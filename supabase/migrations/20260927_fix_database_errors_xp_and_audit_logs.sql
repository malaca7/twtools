-- ============================================================================
-- CORREÇÃO DEFINITIVA DE ERROS DO BANCO DE DADOS:
-- 1. Criação das assinaturas de public.award_platform_xp_internal (4 e 6 parâmetros)
-- 2. Compatibilização de public.audit_logs com colunas entity_type, details e table_name
-- 3. Atualização de evaluate_member_rpc e grant_insignia_rpc
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PARTE 1: COMPATIBILIZAÇÃO DA TABELA public.audit_logs
-- ----------------------------------------------------------------------------

-- Adicionar colunas caso não existam para suportar todas as variações de chamada
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS table_name text;

-- Função de sincronização automática entre colunas legadas e novas
CREATE OR REPLACE FUNCTION public.tg_sync_audit_logs_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Sincronizar entity / entity_type / table_name
  IF NEW.entity IS NOT NULL THEN
    IF NEW.entity_type IS NULL THEN NEW.entity_type := NEW.entity; END IF;
    IF NEW.table_name IS NULL THEN NEW.table_name := NEW.entity; END IF;
  ELSIF NEW.entity_type IS NOT NULL THEN
    NEW.entity := NEW.entity_type;
    IF NEW.table_name IS NULL THEN NEW.table_name := NEW.entity_type; END IF;
  ELSIF NEW.table_name IS NOT NULL THEN
    NEW.entity := NEW.table_name;
    NEW.entity_type := NEW.table_name;
  END IF;

  -- Sincronizar new_data / details
  IF NEW.new_data IS NOT NULL THEN
    IF NEW.details IS NULL THEN NEW.details := NEW.new_data; END IF;
  ELSIF NEW.details IS NOT NULL THEN
    NEW.new_data := NEW.details;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_audit_logs_columns ON public.audit_logs;
CREATE TRIGGER trg_sync_audit_logs_columns
  BEFORE INSERT OR UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_sync_audit_logs_columns();

-- Preencher colunas nulas em registros existentes sem perda de dados
UPDATE public.audit_logs
SET
  entity_type = COALESCE(entity_type, entity),
  table_name = COALESCE(table_name, entity),
  details = COALESCE(details, new_data)
WHERE entity_type IS NULL OR details IS NULL OR table_name IS NULL;

-- ----------------------------------------------------------------------------
-- PARTE 2: ASSINATURA COMPLETA DE award_platform_xp_internal (6 PARÂMETROS)
-- (p_user_id, p_action_type, p_amount, p_reference_id, p_description, p_metadata)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.award_platform_xp_internal(
  p_user_id UUID,
  p_action_type TEXT,
  p_amount INTEGER,
  p_reference_id TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rule RECORD;
  v_today_xp INTEGER;
  v_last_time TIMESTAMPTZ;
  v_grant_xp INTEGER;
  v_user_xp BIGINT;
  v_new_xp BIGINT;
  v_new_level INTEGER;
  v_effective_reward INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'invalid_user');
  END IF;

  -- 1. Carregar regra do tipo de ação
  SELECT * INTO v_rule FROM public.xp_rules_config WHERE action_type = p_action_type AND enabled = true;
  IF NOT FOUND THEN
    IF p_amount IS NULL OR p_amount <= 0 THEN
      RETURN jsonb_build_object('granted', false, 'reason', 'rule_disabled_or_not_found');
    END IF;
  END IF;

  -- 2. DEDUPLICAÇÃO ESTRITA: se já recebeu XP por esta referência única, ignora
  IF p_reference_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.xp_transactions
    WHERE user_id = p_user_id AND action_type = p_action_type AND reference_id = p_reference_id
  ) THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'already_claimed');
  END IF;

  -- 3. COOLDOWN / ANTI-SPAM (se houver regra configurada com cooldown > 0)
  IF v_rule.cooldown_seconds IS NOT NULL AND v_rule.cooldown_seconds > 0 THEN
    SELECT created_at INTO v_last_time
    FROM public.xp_transactions
    WHERE user_id = p_user_id AND action_type = p_action_type
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_time IS NOT NULL AND (now() - v_last_time) < (v_rule.cooldown_seconds || ' seconds')::INTERVAL THEN
      RETURN jsonb_build_object('granted', false, 'reason', 'cooldown_active');
    END IF;
  END IF;

  -- 4. LIMITE DIÁRIO (DAILY CAP): somar XP já acumulado hoje nesta ação
  IF v_rule.daily_cap IS NOT NULL AND v_rule.daily_cap > 0 THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_today_xp
    FROM public.xp_transactions
    WHERE user_id = p_user_id
      AND action_type = p_action_type
      AND amount > 0
      AND created_at >= date_trunc('day', now());

    IF v_today_xp >= v_rule.daily_cap THEN
      RETURN jsonb_build_object('granted', false, 'reason', 'daily_cap_reached');
    END IF;

    v_effective_reward := COALESCE(p_amount, v_rule.xp_reward);
    v_grant_xp := LEAST(v_effective_reward, v_rule.daily_cap - v_today_xp);
  ELSE
    v_grant_xp := COALESCE(p_amount, v_rule.xp_reward, 1);
  END IF;

  IF v_grant_xp <= 0 THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'zero_or_negative_grant');
  END IF;

  -- 5. Lock no perfil do usuário e incremento atômico de XP
  SELECT xp INTO v_user_xp FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'profile_not_found');
  END IF;

  v_new_xp := COALESCE(v_user_xp, 0) + v_grant_xp;
  v_new_level := public.calculate_gamification_level(v_new_xp);

  UPDATE public.profiles
  SET
    xp = v_new_xp,
    gamification_level = v_new_level,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 6. Registrar transação imutável no livro-razão de XP
  INSERT INTO public.xp_transactions (
    user_id,
    amount,
    xp_before,
    xp_after,
    action_type,
    reference_id,
    category,
    description,
    metadata
  ) VALUES (
    p_user_id,
    v_grant_xp,
    v_user_xp,
    v_new_xp,
    p_action_type,
    p_reference_id,
    COALESCE(v_rule.category, 'platform'),
    COALESCE(p_description, 'XP concedido por interação na plataforma'),
    COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN jsonb_build_object(
    'granted', true,
    'xp_added', v_grant_xp,
    'new_xp', v_new_xp,
    'new_level', v_new_level
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- PARTE 3: ASSINATURA DE SOBRECARGA COM 4 PARÂMETROS
-- (p_user_id, p_action_type, p_reference_id, p_description)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.award_platform_xp_internal(
  p_user_id UUID,
  p_action_type TEXT,
  p_reference_id TEXT,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.award_platform_xp_internal(
    p_user_id,
    p_action_type,
    NULL,
    p_reference_id,
    p_description,
    '{}'::jsonb
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- PARTE 4: ATUALIZAÇÃO SEGURA DE evaluate_member_rpc
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.evaluate_member_rpc(
  p_member_id UUID,
  p_stars INTEGER,
  p_feedback TEXT DEFAULT '',
  p_category TEXT DEFAULT 'geral'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_evaluator_id UUID;
  v_member_name TEXT;
  v_evaluator_name TEXT;
  v_eval_id UUID;
  v_new_rating NUMERIC(3,2);
  v_new_count INTEGER;
  v_last_eval TIMESTAMPTZ;
  v_incentive_xp INTEGER := 0;
BEGIN
  v_evaluator_id := auth.uid();
  IF v_evaluator_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF NOT (public.is_manager(v_evaluator_id) OR public.is_admin(v_evaluator_id)) THEN
    RAISE EXCEPTION 'Apenas Gerentes e Administradores possuem permissão para avaliar membros.';
  END IF;

  IF v_evaluator_id = p_member_id THEN
    RAISE EXCEPTION 'Você não pode avaliar a si mesmo.';
  END IF;

  IF p_stars < 1 OR p_stars > 5 THEN
    RAISE EXCEPTION 'A avaliação deve ser entre 1 e 5 estrelas.';
  END IF;

  -- Cooldown de 12 horas entre avaliações do mesmo par
  SELECT created_at INTO v_last_eval
  FROM public.member_evaluations
  WHERE member_id = p_member_id AND evaluator_id = v_evaluator_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_eval IS NOT NULL AND (now() - v_last_eval) < INTERVAL '12 hours' THEN
    RAISE EXCEPTION 'Você já avaliou este membro recentemente. Aguarde 12 horas para nova avaliação.';
  END IF;

  SELECT COALESCE(nickname, nome) INTO v_member_name
  FROM public.profiles
  WHERE user_id = p_member_id;

  SELECT COALESCE(nickname, nome) INTO v_evaluator_name
  FROM public.profiles
  WHERE user_id = v_evaluator_id;

  INSERT INTO public.member_evaluations (member_id, evaluator_id, stars, feedback, category)
  VALUES (p_member_id, v_evaluator_id, p_stars, p_feedback, p_category)
  RETURNING id INTO v_eval_id;

  -- Atualizar média e contagem de estrelas do membro
  SELECT
    ROUND(AVG(stars)::numeric, 2),
    COUNT(*)::INTEGER
  INTO v_new_rating, v_new_count
  FROM public.member_evaluations
  WHERE member_id = p_member_id;

  UPDATE public.profiles
  SET
    stars_rating = v_new_rating,
    stars_count = v_new_count,
    updated_at = now()
  WHERE user_id = p_member_id;

  -- 1. Bônus ao avaliador por cumprir papel de auditoria (1 XP)
  PERFORM public.award_platform_xp_internal(
    v_evaluator_id,
    'peer_eval_given',
    1,
    v_eval_id::text,
    format('Auditoria de liderança: avaliação realizada para %s (%s estrelas)', COALESCE(v_member_name, 'membro'), p_stars),
    jsonb_build_object('member_id', p_member_id, 'stars', p_stars, 'eval_id', v_eval_id)
  );

  -- 2. Recompensa calibrada para avaliação de excelência (4 e 5 estrelas: +1 e +2 XP)
  IF p_stars = 5 THEN
    v_incentive_xp := 2;
  ELSIF p_stars = 4 THEN
    v_incentive_xp := 1;
  END IF;

  IF v_incentive_xp > 0 THEN
    PERFORM public.award_platform_xp_internal(
      p_member_id,
      'peer_eval_received',
      v_incentive_xp,
      v_eval_id::text,
      format('Reconhecimento de desempenho: avaliação de %s estrelas recebida de %s', p_stars, COALESCE(v_evaluator_name, 'liderança')),
      jsonb_build_object('evaluator_id', v_evaluator_id, 'stars', p_stars, 'eval_id', v_eval_id)
    );
  END IF;

  -- 3. Log de auditoria global da facção
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_type,
    entity_id,
    new_data,
    details,
    created_at
  ) VALUES (
    v_evaluator_id,
    'MEMBER_EVALUATION',
    'member_evaluations',
    'member_evaluations',
    v_eval_id::text,
    jsonb_build_object(
      'member_id', p_member_id,
      'member_name', v_member_name,
      'stars', p_stars,
      'feedback', p_feedback,
      'category', p_category,
      'rating_after', v_new_rating,
      'eval_count_after', v_new_count
    ),
    jsonb_build_object(
      'member_id', p_member_id,
      'member_name', v_member_name,
      'stars', p_stars,
      'feedback', p_feedback,
      'category', p_category,
      'rating_after', v_new_rating,
      'eval_count_after', v_new_count
    ),
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

-- ----------------------------------------------------------------------------
-- PARTE 5: ATUALIZAÇÃO SEGURA DE grant_insignia_rpc
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.grant_insignia_rpc(
  p_member_id UUID,
  p_insignia_id TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_grantor_id UUID;
  v_grantor_xp BIGINT;
  v_grantor_name TEXT;
  v_member_name TEXT;
  v_cost INTEGER;
  v_insignia RECORD;
  v_new_grantor_xp BIGINT;
  v_grant_id UUID;
BEGIN
  -- 1. Identificar e validar o usuário chamador
  v_grantor_id := auth.uid();
  IF v_grantor_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  -- 2. Validar permissões de gerência/administração no backend
  IF NOT (public.is_manager(v_grantor_id) OR public.is_admin(v_grantor_id)) THEN
    RAISE EXCEPTION 'Permissão negada: apenas Gerentes ou Administradores podem conceder insígnias.';
  END IF;

  -- 3. Não permitir auto-concessão de insígnias
  IF v_grantor_id = p_member_id THEN
    RAISE EXCEPTION 'Operação inválida: você não pode conceder insígnias a si mesmo.';
  END IF;

  -- 4. Validar motivo obrigatório
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'O motivo/justificativa para concessão da insígnia é obrigatório.';
  END IF;

  -- 5. Carregar dados da insígnia
  SELECT * INTO v_insignia FROM public.insignias WHERE id = p_insignia_id AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insígnia inválida ou inativa no catálogo.';
  END IF;
  v_cost := v_insignia.xp_cost;

  -- 6. Bloqueio em linha no perfil do concedente
  SELECT xp, COALESCE(nickname, nome) INTO v_grantor_xp, v_grantor_name
  FROM public.profiles
  WHERE user_id = v_grantor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil do concedente não encontrado no sistema.';
  END IF;

  -- 7. Verificar se o administrador/gerente possui XP suficiente
  IF v_grantor_xp < v_cost THEN
    RAISE EXCEPTION 'XP insuficiente para conceder esta insígnia. Você possui % XP, mas o custo exigido é de % XP.', v_grantor_xp, v_cost;
  END IF;

  -- 8. Bloqueio em linha no perfil do membro beneficiado
  SELECT COALESCE(nickname, nome) INTO v_member_name
  FROM public.profiles
  WHERE user_id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro alvo não encontrado no sistema.';
  END IF;

  -- 9. DEDUZIR XP DO ADMINISTRADOR/GERENTE
  v_new_grantor_xp := v_grantor_xp - v_cost;
  UPDATE public.profiles
  SET
    xp = v_new_grantor_xp,
    gamification_level = public.calculate_gamification_level(v_new_grantor_xp),
    updated_at = now()
  WHERE user_id = v_grantor_id;

  -- 10. Registrar transação de auditoria de XP para o concedente se houve custo
  IF v_cost > 0 THEN
    INSERT INTO public.xp_transactions (
      user_id,
      amount,
      xp_before,
      xp_after,
      action_type,
      reference_id,
      category,
      description,
      metadata
    ) VALUES (
      v_grantor_id,
      -v_cost,
      v_grantor_xp,
      v_new_grantor_xp,
      'insignia_grant_cost',
      p_member_id::text || '_' || p_insignia_id || '_' || extract(epoch from now())::text,
      'badge',
      format('Custo de concessão da insígnia "%s" para o membro %s', v_insignia.name, v_member_name),
      jsonb_build_object(
        'member_id', p_member_id,
        'member_name', v_member_name,
        'insignia_id', p_insignia_id,
        'insignia_name', v_insignia.name,
        'cost', v_cost,
        'reason', p_reason
      )
    );
  END IF;

  -- 11. Inserir registro oficial de concessão da insígnia
  INSERT INTO public.member_insignias (
    member_id,
    insignia_id,
    granted_by,
    xp_cost_paid,
    reason,
    granted_at
  ) VALUES (
    p_member_id,
    p_insignia_id,
    v_grantor_id,
    v_cost,
    trim(p_reason),
    now()
  ) RETURNING id INTO v_grant_id;

  -- 12. Registrar log de auditoria global da facção
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_type,
    entity_id,
    new_data,
    details,
    created_at
  ) VALUES (
    v_grantor_id,
    'GRANT_INSIGNIA',
    'member_insignias',
    'member_insignias',
    v_grant_id::text,
    jsonb_build_object(
      'member_id', p_member_id,
      'member_name', v_member_name,
      'insignia_id', p_insignia_id,
      'insignia_name', v_insignia.name,
      'xp_cost_deducted', v_cost,
      'grantor_new_xp', v_new_grantor_xp,
      'reason', p_reason
    ),
    jsonb_build_object(
      'member_id', p_member_id,
      'member_name', v_member_name,
      'insignia_id', p_insignia_id,
      'insignia_name', v_insignia.name,
      'xp_cost_deducted', v_cost,
      'grantor_new_xp', v_new_grantor_xp,
      'reason', p_reason
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'grant_id', v_grant_id,
    'member_id', p_member_id,
    'member_name', v_member_name,
    'insignia_id', p_insignia_id,
    'insignia_name', v_insignia.name,
    'xp_cost_deducted', v_cost,
    'grantor_new_xp', v_new_grantor_xp,
    'message', format('Insígnia "%s" concedida com sucesso para %s!', v_insignia.name, v_member_name)
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- PARTE 6: PERMISSÕES E GRANTS EXPLÍCITOS
-- ----------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.award_platform_xp_internal(UUID, TEXT, INTEGER, TEXT, TEXT, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_platform_xp_internal(UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.evaluate_member_rpc(UUID, INTEGER, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.grant_insignia_rpc(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT ALL ON public.audit_logs TO service_role, postgres;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
