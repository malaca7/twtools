-- =============================================================================
-- XP SYSTEM OVERHAUL (2026-10-07)
-- * Corrige crédito de XP (profiles.user_id x profiles.id)
-- * Saldo 100% decimal (numeric(14,2)) e ganhos sempre < 1 XP
-- * Curva de níveis unificada (banco = frontend) para economia decimal
-- * Deduplicação, cooldown/limite diário em America/Sao_Paulo, lock por usuário
-- * Estorno automático de XP (venda estornada / movimentação revertida)
-- * Novos gatilhos: produção concluída e transferência de armazém
-- * Remove registros de audit_logs gerados pelo sistema de XP
-- * Credita retroativamente ganhos registrados que nunca entraram no saldo
-- =============================================================================

-- 1. TIPOS DECIMAIS ------------------------------------------------------------
ALTER TABLE public.profiles
  ALTER COLUMN xp TYPE numeric(14,2) USING round(COALESCE(xp, 0), 2),
  ALTER COLUMN xp SET DEFAULT 0;

ALTER TABLE public.xp_transactions
  ALTER COLUMN amount    TYPE numeric(14,2),
  ALTER COLUMN xp_before TYPE numeric(14,2),
  ALTER COLUMN xp_after  TYPE numeric(14,2);

ALTER TABLE public.xp_rules_config
  ALTER COLUMN xp_reward TYPE numeric(6,2),
  ALTER COLUMN xp_reward SET DEFAULT 0.30;

UPDATE public.xp_rules_config SET xp_reward = 0.99 WHERE xp_reward >= 1;
UPDATE public.xp_rules_config SET xp_reward = 0.01 WHERE xp_reward <= 0;

ALTER TABLE public.xp_rules_config DROP CONSTRAINT IF EXISTS xp_rules_reward_below_one;
ALTER TABLE public.xp_rules_config
  ADD CONSTRAINT xp_rules_reward_below_one CHECK (xp_reward > 0 AND xp_reward < 1);

-- 2. CURVA DE NÍVEIS UNIFICADA -------------------------------------------------
CREATE OR REPLACE FUNCTION public.xp_level_thresholds()
RETURNS numeric[]
LANGUAGE sql IMMUTABLE
AS $$
  SELECT ARRAY[
    0, 5, 15, 30, 60, 100, 160, 240, 320, 400,
    500, 620, 760, 920, 1100, 1300, 1520, 1760, 2020, 2300,
    2600, 2920, 3260, 3620, 4000, 4400, 4820, 5260, 5720, 6200,
    6700, 7220, 7760, 8320, 8900, 9500, 10120, 10760, 11420, 12100,
    12800, 13520, 14260, 15020, 15800, 16600, 17420, 18260, 19120, 20000
  ]::numeric[];
$$;

CREATE OR REPLACE FUNCTION public.calculate_gamification_level(p_xp numeric)
RETURNS integer
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  t numeric[] := public.xp_level_thresholds();
  v numeric := GREATEST(COALESCE(p_xp, 0), 0);
  i integer;
BEGIN
  IF v >= t[50] THEN
    RETURN 50 + floor((v - t[50]) / 1000)::integer;
  END IF;
  FOR i IN REVERSE 50..1 LOOP
    IF v >= t[i] THEN RETURN i; END IF;
  END LOOP;
  RETURN 1;
END;
$$;

DROP FUNCTION IF EXISTS public.get_min_xp_for_level(integer);
CREATE FUNCTION public.get_min_xp_for_level(p_level integer)
RETURNS numeric
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  t numeric[] := public.xp_level_thresholds();
  v_lvl integer := GREATEST(COALESCE(p_level, 1), 1);
BEGIN
  IF v_lvl <= 50 THEN RETURN t[v_lvl]; END IF;
  RETURN t[50] + ((v_lvl - 50) * 1000);
END;
$$;

-- 3. MOTOR CENTRAL DE CONCESSÃO DE XP ------------------------------------------
CREATE OR REPLACE FUNCTION public.award_platform_xp_internal(
  p_user_id uuid,
  p_action_type text,
  p_amount numeric,
  p_reference_id text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_rule public.xp_rules_config%ROWTYPE;
  v_reward numeric;
  v_grant numeric;
  v_today numeric;
  v_last timestamptz;
  v_profile_id uuid;
  v_old numeric;
  v_new numeric;
  v_level integer;
  v_tx_id uuid;
  v_day_start timestamptz :=
    (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo');
BEGIN
  IF p_user_id IS NULL OR p_action_type IS NULL THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'invalid_input');
  END IF;

  SELECT * INTO v_rule FROM public.xp_rules_config WHERE action_type = p_action_type;
  IF NOT FOUND OR NOT v_rule.enabled THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'rule_disabled_or_not_found');
  END IF;

  -- Ganho sempre decimal e abaixo de 1 XP
  v_reward := round(LEAST(COALESCE(NULLIF(p_amount, 0), v_rule.xp_reward), 0.99), 2);
  IF v_reward <= 0 THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'zero_reward');
  END IF;

  -- Lock do perfil (serializa concessões simultâneas do mesmo usuário)
  SELECT id, COALESCE(xp, 0) INTO v_profile_id, v_old
  FROM public.profiles WHERE user_id = p_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    SELECT id, COALESCE(xp, 0) INTO v_profile_id, v_old
    FROM public.profiles WHERE id = p_user_id
    FOR UPDATE;
  END IF;
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'profile_not_found');
  END IF;

  -- Deduplicação por referência
  IF p_reference_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.xp_transactions
    WHERE user_id = p_user_id AND action_type = p_action_type AND reference_id = p_reference_id
  ) THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'duplicate');
  END IF;

  -- Cooldown
  IF COALESCE(v_rule.cooldown_seconds, 0) > 0 THEN
    SELECT created_at INTO v_last FROM public.xp_transactions
    WHERE user_id = p_user_id AND action_type = p_action_type AND amount > 0
    ORDER BY created_at DESC LIMIT 1;
    IF v_last IS NOT NULL AND now() - v_last < v_rule.cooldown_seconds * interval '1 second' THEN
      RETURN jsonb_build_object('granted', false, 'reason', 'cooldown_active');
    END IF;
  END IF;

  -- Limite diário (fuso de Brasília)
  v_grant := v_reward;
  IF COALESCE(v_rule.daily_cap, 0) > 0 THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_today FROM public.xp_transactions
    WHERE user_id = p_user_id AND action_type = p_action_type AND created_at >= v_day_start;
    IF v_today >= v_rule.daily_cap THEN
      RETURN jsonb_build_object('granted', false, 'reason', 'daily_cap_reached');
    END IF;
    v_grant := round(LEAST(v_reward, v_rule.daily_cap - v_today), 2);
  END IF;

  IF v_grant <= 0 THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'zero_reward');
  END IF;

  v_new := round(v_old + v_grant, 2);
  v_level := public.calculate_gamification_level(v_new);

  INSERT INTO public.xp_transactions
    (user_id, amount, xp_before, xp_after, action_type, reference_id, category, description, metadata)
  VALUES
    (p_user_id, v_grant, v_old, v_new, p_action_type, p_reference_id,
     COALESCE(v_rule.category, 'geral'), p_description, COALESCE(p_metadata, '{}'::jsonb))
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_tx_id;

  IF v_tx_id IS NULL THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'duplicate');
  END IF;

  UPDATE public.profiles
  SET xp = v_new, gamification_level = v_level, updated_at = now()
  WHERE id = v_profile_id;

  RETURN jsonb_build_object(
    'granted', true,
    'awarded_xp', v_grant,
    'new_total_xp', v_new,
    'new_level', v_level,
    'action_type', p_action_type
  );
EXCEPTION WHEN OTHERS THEN
  -- Nunca interrompe a operação de negócio que disparou o ganho de XP
  RETURN jsonb_build_object('granted', false, 'reason', 'error', 'detail', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.award_platform_xp_internal(
  p_user_id uuid, p_action_type text, p_reference_id text, p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN public.award_platform_xp_internal(p_user_id, p_action_type, NULL, p_reference_id, p_description, '{}'::jsonb);
END;
$$;

-- Estorno de XP concedido por uma referência (venda estornada, movimentação revertida)
CREATE OR REPLACE FUNCTION public.revoke_platform_xp_internal(
  p_user_id uuid, p_action_type text, p_reference_id text, p_description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_granted numeric;
  v_profile_id uuid;
  v_old numeric;
  v_new numeric;
  v_tx_id uuid;
BEGIN
  IF p_user_id IS NULL OR p_reference_id IS NULL THEN
    RETURN jsonb_build_object('revoked', false, 'reason', 'invalid_input');
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_granted FROM public.xp_transactions
  WHERE user_id = p_user_id AND action_type = p_action_type AND reference_id = p_reference_id AND amount > 0;
  IF v_granted <= 0 THEN
    RETURN jsonb_build_object('revoked', false, 'reason', 'nothing_to_revoke');
  END IF;

  SELECT id, COALESCE(xp, 0) INTO v_profile_id, v_old
  FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF v_profile_id IS NULL THEN
    RETURN jsonb_build_object('revoked', false, 'reason', 'profile_not_found');
  END IF;

  v_new := GREATEST(round(v_old - v_granted, 2), 0);

  INSERT INTO public.xp_transactions
    (user_id, amount, xp_before, xp_after, action_type, reference_id, category, description, metadata)
  VALUES
    (p_user_id, v_new - v_old, v_old, v_new, p_action_type || '_reversal', p_reference_id,
     'reversal', p_description, jsonb_build_object('original_action', p_action_type))
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_tx_id;

  IF v_tx_id IS NULL THEN
    RETURN jsonb_build_object('revoked', false, 'reason', 'already_revoked');
  END IF;

  UPDATE public.profiles
  SET xp = v_new, gamification_level = public.calculate_gamification_level(v_new), updated_at = now()
  WHERE id = v_profile_id;

  RETURN jsonb_build_object('revoked', true, 'revoked_xp', v_granted, 'new_total_xp', v_new);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('revoked', false, 'reason', 'error', 'detail', SQLERRM);
END;
$$;

REVOKE ALL ON FUNCTION public.award_platform_xp_internal(uuid, text, numeric, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_platform_xp_internal(uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revoke_platform_xp_internal(uuid, text, text, text) FROM PUBLIC, anon, authenticated;

-- 4. RESGATE PELO CLIENTE (somente ações permitidas) ---------------------------
CREATE OR REPLACE FUNCTION public.claim_action_xp_rpc(
  p_action_type text, p_reference_id text DEFAULT NULL, p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_today text := to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD');
BEGIN
  IF v_caller IS NULL THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'not_authenticated');
  END IF;

  IF p_action_type = 'daily_presence' THEN
    RETURN public.award_platform_xp_internal(
      v_caller, 'daily_presence', NULL, v_today, 'Presença diária ativa na plataforma', '{}'::jsonb
    );
  END IF;

  RETURN jsonb_build_object('granted', false, 'reason', 'action_not_claimable');
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_action_xp_rpc(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.heartbeat_user_presence(
  _user_id uuid, _status text DEFAULT 'online', _increment_seconds integer DEFAULT 30
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  _current_user_id uuid;
  _existing_status text;
  _existing_since timestamptz;
  _existing_last_seen timestamptz;
BEGIN
  _current_user_id := COALESCE(auth.uid(), _user_id);
  IF _current_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT status, online_since, last_seen
  INTO _existing_status, _existing_since, _existing_last_seen
  FROM public.user_presence
  WHERE user_id = _current_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_presence (user_id, status, last_seen, online_since, total_seconds_online, updated_at)
    VALUES (_current_user_id, _status, now(), now(), LEAST(GREATEST(_increment_seconds, 0), 300), now());
  ELSE
    IF _existing_status = 'offline' OR _existing_last_seen IS NULL OR _existing_last_seen < (now() - interval '2 minutes') THEN
      _existing_since := CASE WHEN _status = 'offline' THEN NULL ELSE now() END;
    ELSIF _status = 'offline' THEN
      _existing_since := NULL;
    ELSIF _existing_since IS NULL THEN
      _existing_since := now();
    END IF;

    UPDATE public.user_presence
    SET
      status = _status,
      last_seen = now(),
      online_since = _existing_since,
      total_seconds_online = COALESCE(total_seconds_online, 0)
        + (CASE WHEN _status = 'online' THEN LEAST(GREATEST(_increment_seconds, 0), 300) ELSE 0 END),
      updated_at = now()
    WHERE user_id = _current_user_id;
  END IF;

  IF _status = 'online' THEN
    PERFORM public.award_platform_xp_internal(
      _current_user_id, 'daily_presence', NULL,
      to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD'),
      'Presença diária ativa na plataforma', '{}'::jsonb
    );
  END IF;
END;
$$;

-- 5. GATILHOS AUTOMÁTICOS ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_award_xp_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.seller_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.status = 'concluida' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'concluida') THEN
    PERFORM public.award_platform_xp_internal(
      NEW.seller_id, 'sale_completed', NEW.id::text,
      format('Venda concluída de %sx unidades para %s', NEW.quantity, COALESCE(NEW.buyer_name, 'cliente'))
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'concluida' AND NEW.status IS DISTINCT FROM 'concluida' THEN
    PERFORM public.revoke_platform_xp_internal(
      NEW.seller_id, 'sale_completed', NEW.id::text,
      format('Estorno de XP: venda %s', COALESCE(NEW.status, 'cancelada'))
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_award_xp_on_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_orig_user uuid;
BEGIN
  IF NEW.reversal_of IS NULL THEN
    IF NEW.user_id IS NOT NULL THEN
      PERFORM public.award_platform_xp_internal(
        NEW.user_id, 'stock_movement', NEW.id::text,
        format('Movimentação (%s) registrada em baú físico', NEW.type)
      );
    END IF;
  ELSE
    SELECT user_id INTO v_orig_user FROM public.stock_movements WHERE id = NEW.reversal_of;
    IF v_orig_user IS NOT NULL THEN
      PERFORM public.revoke_platform_xp_internal(
        v_orig_user, 'stock_movement', NEW.reversal_of::text, 'Estorno de XP: movimentação revertida'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_award_xp_on_production()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND upper(COALESCE(NEW.status, '')) IN ('COMPLETED', 'CONCLUIDA', 'CONCLUIDO')
     AND (TG_OP = 'INSERT' OR upper(COALESCE(OLD.status, '')) NOT IN ('COMPLETED', 'CONCLUIDA', 'CONCLUIDO')) THEN
    PERFORM public.award_platform_xp_internal(
      NEW.user_id, 'production_completed', NEW.id::text,
      format('Produção concluída (%s unidades)', NEW.quantity)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_xp_on_production ON public.productions;
CREATE TRIGGER trg_award_xp_on_production
  AFTER INSERT OR UPDATE OF status ON public.productions
  FOR EACH ROW EXECUTE FUNCTION public.tg_award_xp_on_production();

CREATE OR REPLACE FUNCTION public.tg_award_xp_on_warehouse_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    PERFORM public.award_platform_xp_internal(
      NEW.user_id, 'warehouse_transfer', NEW.id::text, 'Transferência de suprimentos do armazém central'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_xp_on_warehouse_transfer ON public.audit_logs;
CREATE TRIGGER trg_award_xp_on_warehouse_transfer
  AFTER INSERT ON public.audit_logs
  FOR EACH ROW
  WHEN (NEW.action LIKE 'warehouse_transfer%')
  EXECUTE FUNCTION public.tg_award_xp_on_warehouse_transfer();

-- 6. AVALIAÇÃO DE MEMBROS (usa as regras configuradas, sempre < 1 XP) ---------
CREATE OR REPLACE FUNCTION public.evaluate_member_rpc(
  p_member_id uuid, p_stars integer, p_feedback text DEFAULT '', p_category text DEFAULT 'geral'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_evaluator_id uuid;
  v_member_name text;
  v_evaluator_name text;
  v_eval_id uuid;
  v_new_rating numeric(3,2);
  v_new_count integer;
  v_last_eval timestamptz;
BEGIN
  v_evaluator_id := auth.uid();
  IF v_evaluator_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF NOT public.check_user_evaluation_permission(v_evaluator_id) THEN
    RAISE EXCEPTION 'Você não possui permissão para avaliar membros.';
  END IF;

  IF v_evaluator_id = p_member_id THEN
    RAISE EXCEPTION 'Você não pode avaliar a si mesmo.';
  END IF;

  IF p_stars < 1 OR p_stars > 5 THEN
    RAISE EXCEPTION 'A avaliação deve ser entre 1 e 5 estrelas.';
  END IF;

  SELECT created_at INTO v_last_eval
  FROM public.member_evaluations
  WHERE member_id = p_member_id AND evaluator_id = v_evaluator_id
  ORDER BY created_at DESC LIMIT 1;

  IF v_last_eval IS NOT NULL AND (now() - v_last_eval) < INTERVAL '12 hours' THEN
    RAISE EXCEPTION 'Você já avaliou este membro recentemente. Aguarde 12 horas para nova avaliação.';
  END IF;

  SELECT COALESCE(nickname, nome) INTO v_member_name FROM public.profiles WHERE user_id = p_member_id;
  SELECT COALESCE(nickname, nome) INTO v_evaluator_name FROM public.profiles WHERE user_id = v_evaluator_id;

  INSERT INTO public.member_evaluations (member_id, evaluator_id, stars, feedback, category)
  VALUES (p_member_id, v_evaluator_id, p_stars, p_feedback, p_category)
  RETURNING id INTO v_eval_id;

  SELECT ROUND(AVG(stars)::numeric, 2), COUNT(*)::integer
  INTO v_new_rating, v_new_count
  FROM public.member_evaluations WHERE member_id = p_member_id;

  UPDATE public.profiles
  SET stars_rating = v_new_rating, stars_count = v_new_count, updated_at = now()
  WHERE user_id = p_member_id;

  PERFORM public.award_platform_xp_internal(
    v_evaluator_id, 'peer_eval_given', NULL, v_eval_id::text,
    format('Avaliação realizada para %s (%s estrelas)', COALESCE(v_member_name, 'membro'), p_stars),
    jsonb_build_object('member_id', p_member_id, 'stars', p_stars)
  );

  IF p_stars >= 4 THEN
    PERFORM public.award_platform_xp_internal(
      p_member_id, 'peer_eval_received', NULL, v_eval_id::text,
      format('Avaliação de %s estrelas recebida de %s', p_stars, COALESCE(v_evaluator_name, 'liderança')),
      jsonb_build_object('evaluator_id', v_evaluator_id, 'stars', p_stars)
    );
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity, entity_type, entity_id, new_data, details, created_at)
  VALUES (
    v_evaluator_id, 'MEMBER_EVALUATION', 'member_evaluations', 'member_evaluations', v_eval_id::text,
    jsonb_build_object('member_id', p_member_id, 'member_name', v_member_name, 'stars', p_stars,
      'feedback', p_feedback, 'category', p_category, 'rating_after', v_new_rating, 'eval_count_after', v_new_count),
    jsonb_build_object('member_id', p_member_id, 'member_name', v_member_name, 'stars', p_stars,
      'feedback', p_feedback, 'category', p_category, 'rating_after', v_new_rating, 'eval_count_after', v_new_count),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Avaliação de %s estrelas registrada com sucesso para %s!', p_stars, COALESCE(v_member_name, 'membro')),
    'new_rating', v_new_rating,
    'stars_count', v_new_count
  );
END;
$$;

-- 7. FERRAMENTAS DEV (decimais, sem audit_logs de XP) -------------------------
CREATE OR REPLACE FUNCTION public.dev_manage_member_xp_rpc(
  p_member_id uuid, p_mode text, p_amount numeric, p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_profile_id uuid;
  v_name text;
  v_old numeric;
  v_new numeric;
  v_old_level integer;
  v_new_level integer;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Não autenticado.'; END IF;
  IF NOT (public.is_developer(v_caller) OR public.is_admin(v_caller)) THEN
    RAISE EXCEPTION 'Privilégios insuficientes.';
  END IF;
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'A justificativa é obrigatória.';
  END IF;

  SELECT id, COALESCE(xp, 0), COALESCE(nickname, nome), COALESCE(gamification_level, 1)
  INTO v_profile_id, v_old, v_name, v_old_level
  FROM public.profiles WHERE user_id = p_member_id FOR UPDATE;
  IF v_profile_id IS NULL THEN RAISE EXCEPTION 'Membro não encontrado.'; END IF;

  IF p_mode = 'add' THEN
    v_new := v_old + COALESCE(p_amount, 0);
  ELSIF p_mode = 'set' THEN
    v_new := COALESCE(p_amount, 0);
  ELSE
    RAISE EXCEPTION 'Modo inválido. Use add ou set.';
  END IF;

  v_new := GREATEST(round(v_new, 2), 0);
  v_new_level := public.calculate_gamification_level(v_new);

  UPDATE public.profiles
  SET xp = v_new, gamification_level = v_new_level, updated_at = now()
  WHERE id = v_profile_id;

  IF v_new <> v_old THEN
    INSERT INTO public.xp_transactions (user_id, amount, xp_before, xp_after, action_type, category, description, metadata)
    VALUES (p_member_id, v_new - v_old, v_old, v_new, 'dev_adjust', 'dev', trim(p_reason),
            jsonb_build_object('adjusted_by', v_caller, 'mode', p_mode));
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'member_id', p_member_id, 'member_name', v_name,
    'old_xp', v_old, 'new_xp', v_new, 'delta', v_new - v_old,
    'old_level', v_old_level, 'new_level', v_new_level
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.dev_set_member_level_rpc(
  p_member_id uuid, p_level integer, p_sync_xp boolean, p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_profile_id uuid;
  v_old numeric;
  v_new numeric;
  v_old_level integer;
  v_target integer;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Acesso negado: usuário não autenticado.'; END IF;
  IF NOT (public.is_developer(v_caller) OR public.is_admin(v_caller)) THEN
    RAISE EXCEPTION 'Acesso negado: privilégios insuficientes.';
  END IF;
  IF p_level < 1 THEN RAISE EXCEPTION 'O nível deve ser maior ou igual a 1.'; END IF;
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'A justificativa para a alteração de nível é obrigatória.';
  END IF;

  v_target := LEAST(100, GREATEST(1, p_level));

  SELECT id, COALESCE(xp, 0), COALESCE(gamification_level, 1)
  INTO v_profile_id, v_old, v_old_level
  FROM public.profiles WHERE user_id = p_member_id FOR UPDATE;
  IF v_profile_id IS NULL THEN RAISE EXCEPTION 'Membro não encontrado no sistema.'; END IF;

  v_new := CASE WHEN p_sync_xp THEN public.get_min_xp_for_level(v_target) ELSE v_old END;

  UPDATE public.profiles
  SET gamification_level = v_target, xp = v_new, updated_at = now()
  WHERE id = v_profile_id;

  IF v_new <> v_old THEN
    INSERT INTO public.xp_transactions
      (user_id, amount, xp_before, xp_after, action_type, reference_id, category, description, metadata)
    VALUES
      (p_member_id, v_new - v_old, v_old, v_new, 'dev_level_adjustment',
       'dev_lvl_' || p_member_id::text || '_' || extract(epoch from clock_timestamp())::text, 'dev',
       format('Sincronização de nível para %s: %s', v_target, trim(p_reason)),
       jsonb_build_object('adjusted_by', v_caller, 'target_level', v_target, 'sync_xp', p_sync_xp));
  END IF;

  RETURN jsonb_build_object(
    'success', true, 'member_id', p_member_id,
    'old_level', v_old_level, 'new_level', v_target, 'old_xp', v_old, 'new_xp', v_new
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.dev_update_xp_rule_rpc(
  p_action_type text, p_name text, p_xp_reward numeric, p_cooldown_seconds numeric,
  p_daily_cap numeric, p_category text, p_description text, p_enabled boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Acesso negado: usuário não autenticado.'; END IF;
  IF NOT (public.is_developer(v_caller) OR public.is_admin(v_caller)) THEN
    RAISE EXCEPTION 'Acesso negado: privilégios insuficientes.';
  END IF;
  IF p_xp_reward IS NULL OR p_xp_reward <= 0 OR p_xp_reward >= 1 THEN
    RAISE EXCEPTION 'A recompensa de XP deve ser decimal entre 0,01 e 0,99.';
  END IF;

  INSERT INTO public.xp_rules_config
    (action_type, name, xp_reward, cooldown_seconds, daily_cap, category, description, enabled, updated_at)
  VALUES
    (trim(p_action_type), trim(p_name), round(p_xp_reward, 2), GREATEST(COALESCE(p_cooldown_seconds, 0), 0),
     GREATEST(COALESCE(p_daily_cap, 0), 0), p_category, p_description, p_enabled, now())
  ON CONFLICT (action_type) DO UPDATE SET
    name = EXCLUDED.name,
    xp_reward = EXCLUDED.xp_reward,
    cooldown_seconds = EXCLUDED.cooldown_seconds,
    daily_cap = EXCLUDED.daily_cap,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    enabled = EXCLUDED.enabled,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'action_type', p_action_type);
END;
$$;

-- 8. INSÍGNIAS: saldo do concedente sem truncar decimais ----------------------
CREATE OR REPLACE FUNCTION public.grant_insignia_rpc(p_member_id uuid, p_insignia_id text, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_grantor_id uuid;
  v_insignia record;
  v_grantor_xp numeric;
  v_new_grantor_xp numeric;
  v_member_name text;
  v_grantor_name text;
  v_cost numeric;
  v_grant_id uuid;
BEGIN
  v_grantor_id := auth.uid();
  IF v_grantor_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF NOT (public.user_has_permission(v_grantor_id, 'grant_insignia') OR public.is_developer(v_grantor_id)) THEN
    RAISE EXCEPTION 'Permissão negada: seu cargo atual não possui a permissão "Conceder Insígnias a Membro" habilitada.';
  END IF;

  IF v_grantor_id = p_member_id THEN
    RAISE EXCEPTION 'Operação inválida: você não pode conceder insígnias a si mesmo.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'O motivo/justificativa para concessão da insígnia é obrigatório.';
  END IF;

  SELECT id, name, xp_cost, rarity, icon, category, active
  INTO v_insignia
  FROM public.insignias_catalog
  WHERE id = p_insignia_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insígnia inválida ou não encontrada no catálogo oficial.';
  END IF;
  IF NOT v_insignia.active THEN
    RAISE EXCEPTION 'Esta insígnia está temporariamente desativada no catálogo.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.member_insignias WHERE user_id = p_member_id AND insignia_id = p_insignia_id) THEN
    RAISE EXCEPTION 'O integrante selecionado já possui esta insígnia.';
  END IF;

  v_cost := COALESCE(v_insignia.xp_cost, 0);

  SELECT COALESCE(xp, 0), COALESCE(nickname, nome)
  INTO v_grantor_xp, v_grantor_name
  FROM public.profiles WHERE user_id = v_grantor_id
  FOR UPDATE;

  IF v_cost > 0 AND v_grantor_xp < v_cost THEN
    RAISE EXCEPTION 'Saldo de XP insuficiente para condecoração. Custo: % XP, Saldo atual: % XP.', v_cost, v_grantor_xp;
  END IF;

  SELECT COALESCE(nickname, nome) INTO v_member_name FROM public.profiles WHERE user_id = p_member_id;
  v_member_name := COALESCE(v_member_name, 'Integrante');

  IF v_cost > 0 THEN
    v_new_grantor_xp := round(v_grantor_xp - v_cost, 2);

    UPDATE public.profiles
    SET xp = v_new_grantor_xp,
        gamification_level = public.calculate_gamification_level(v_new_grantor_xp),
        updated_at = now()
    WHERE user_id = v_grantor_id;

    INSERT INTO public.xp_transactions (user_id, amount, xp_before, xp_after, action_type, category, description, metadata)
    VALUES (
      v_grantor_id, -v_cost, v_grantor_xp, v_new_grantor_xp, 'insignia_cost', 'insignia',
      format('Débito de XP para concessão da insígnia "%s" a %s', v_insignia.name, v_member_name),
      jsonb_build_object('insignia_id', v_insignia.id, 'insignia_name', v_insignia.name,
        'beneficiary_id', p_member_id, 'beneficiary_name', v_member_name, 'reason', trim(p_reason))
    );
  END IF;

  INSERT INTO public.member_insignias (user_id, insignia_id, granted_by, reason, granted_at)
  VALUES (p_member_id, v_insignia.id, v_grantor_id, trim(p_reason), now())
  RETURNING id INTO v_grant_id;

  INSERT INTO public.audit_logs (user_id, user_name, action, entity, details, created_at)
  VALUES (
    v_grantor_id, v_grantor_name, 'insignia_granted', 'member_insignias',
    format('Concedeu a insígnia "%s" para o membro %s. Motivo: %s', v_insignia.name, v_member_name, trim(p_reason)),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'grant_id', v_grant_id,
    'insignia_id', v_insignia.id,
    'insignia_name', v_insignia.name,
    'insignia_rarity', v_insignia.rarity,
    'member_id', p_member_id,
    'member_name', v_member_name,
    'xp_cost', v_cost,
    'remaining_grantor_xp', COALESCE(v_new_grantor_xp, v_grantor_xp),
    'grantor_new_xp', COALESCE(v_new_grantor_xp, v_grantor_xp)
  );
END;
$$;

-- 9. RANKING COM XP DECIMAL ----------------------------------------------------
DROP FUNCTION IF EXISTS public.get_gamification_ranking(text);
CREATE FUNCTION public.get_gamification_ranking(p_period text DEFAULT 'all')
RETURNS TABLE(
  user_id uuid, nome text, nickname text, avatar_url text, game_id text, nivel text,
  is_developer boolean, is_ceo boolean, xp numeric, period_xp numeric, gamification_level integer,
  stars_rating numeric, stars_count integer, insignias_count integer, rank_position bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_since timestamptz;
BEGIN
  IF p_period = 'week' THEN
    v_since := now() - INTERVAL '7 days';
  ELSIF p_period = 'month' THEN
    v_since := now() - INTERVAL '30 days';
  ELSE
    v_since := NULL;
  END IF;

  RETURN QUERY
  WITH period_calc AS (
    SELECT tx.user_id AS pid, COALESCE(SUM(tx.amount), 0)::numeric AS sum_xp
    FROM public.xp_transactions tx
    WHERE (v_since IS NULL OR tx.created_at >= v_since)
      AND tx.action_type IN (SELECT r.action_type FROM public.xp_rules_config r)
    GROUP BY tx.user_id
  ),
  insignia_calc AS (
    SELECT mi.member_id AS mid, COUNT(DISTINCT mi.insignia_id)::integer AS badge_count
    FROM public.member_insignias mi
    GROUP BY mi.member_id
  ),
  base_members AS (
    SELECT
      p.user_id,
      p.nome,
      p.nickname,
      COALESCE(p.avatar_url, p.discord_avatar_url) AS avatar_url,
      p.game_id,
      COALESCE(ur.nivel::text, 'membro') AS nivel,
      COALESCE(p.is_developer, false) AS is_developer,
      COALESCE(p.is_ceo, false) AS is_ceo,
      COALESCE(p.xp, 0)::numeric AS xp,
      COALESCE(pc.sum_xp, 0)::numeric AS period_xp,
      public.calculate_gamification_level(p.xp) AS gamification_level,
      COALESCE(p.stars_rating, 5.0) AS stars_rating,
      COALESCE(p.stars_count, 0) AS stars_count,
      COALESCE(ic.badge_count, 0) AS insignias_count
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    LEFT JOIN period_calc pc ON pc.pid = p.user_id
    LEFT JOIN insignia_calc ic ON ic.mid = p.user_id
    WHERE p.status = 'ativo'
  )
  SELECT
    bm.user_id, bm.nome, bm.nickname, bm.avatar_url, bm.game_id, bm.nivel,
    bm.is_developer, bm.is_ceo, bm.xp, bm.period_xp, bm.gamification_level,
    bm.stars_rating, bm.stars_count, bm.insignias_count,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE WHEN p_period IN ('week', 'month') THEN bm.period_xp ELSE bm.xp END DESC,
        bm.xp DESC, bm.stars_rating DESC, bm.insignias_count DESC, bm.nome ASC
    ) AS rank_position
  FROM base_members bm
  ORDER BY rank_position ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_gamification_ranking(text) TO authenticated;

-- 10. CORREÇÃO RETROATIVA DOS SALDOS -------------------------------------------
-- Ganhos históricos >= 1 XP passam para o valor da regra (economia decimal)
UPDATE public.xp_transactions t
SET amount = r.xp_reward
FROM public.xp_rules_config r
WHERE t.action_type = r.action_type AND t.amount >= 1;

-- Credita ganhos registrados que nunca entraram no saldo (bug profiles.id x user_id)
DO $$
DECLARE
  rec record;
  v_tx uuid;
BEGIN
  FOR rec IN
    SELECT p.id AS profile_id, p.user_id, COALESCE(p.xp, 0) AS cur_xp, g.lost
    FROM public.profiles p
    JOIN (
      SELECT t.user_id, round(SUM(t.amount), 2) AS lost
      FROM public.xp_transactions t
      WHERE t.action_type IN (SELECT action_type FROM public.xp_rules_config)
        AND t.amount > 0
      GROUP BY t.user_id
    ) g ON g.user_id = p.user_id
    WHERE g.lost > 0
  LOOP
    v_tx := NULL;
    INSERT INTO public.xp_transactions
      (user_id, amount, xp_before, xp_after, action_type, reference_id, category, description, metadata)
    VALUES
      (rec.user_id, rec.lost, rec.cur_xp, round(rec.cur_xp + rec.lost, 2), 'xp_backfill', 'backfill_20261007',
       'system', 'Correção: crédito de XP de ações anteriores não aplicadas ao saldo', '{}'::jsonb)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_tx;

    IF v_tx IS NOT NULL THEN
      UPDATE public.profiles SET xp = round(rec.cur_xp + rec.lost, 2) WHERE id = rec.profile_id;
    END IF;
  END LOOP;
END;
$$;

-- Recalcula o nível de todos com a nova curva
UPDATE public.profiles SET gamification_level = public.calculate_gamification_level(xp);
