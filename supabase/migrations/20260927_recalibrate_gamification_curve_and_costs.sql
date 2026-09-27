-- ============================================================================
-- RECALIBRAÇÃO DO SISTEMA DE GAMIFICAÇÃO, CURVA DE 50 NÍVEIS E CUSTO DE INSÍGNIAS
-- ============================================================================

-- 1. Redução e Calibração dos Custos das Insígnias
UPDATE public.insignias SET xp_cost = 0, rarity = 'comum' WHERE id = 'iniciacao_asfalto';
UPDATE public.insignias SET xp_cost = 5, rarity = 'comum' WHERE id = 'guardiao_bau';
UPDATE public.insignias SET xp_cost = 12, rarity = 'raro' WHERE id = 'operador_tatica';
UPDATE public.insignias SET xp_cost = 20, rarity = 'raro' WHERE id = 'negociador_ouro';
UPDATE public.insignias SET xp_cost = 35, rarity = 'epico' WHERE id = 'mestre_logistica';
UPDATE public.insignias SET xp_cost = 50, rarity = 'epico' WHERE id = 'falcao_vigia';
UPDATE public.insignias SET xp_cost = 90, rarity = 'lendario' WHERE id = 'lideranca_suprema';
UPDATE public.insignias SET xp_cost = 180, rarity = 'mitico' WHERE id = 'mito_twin_wheels';

-- 2. Calibração Rigorosa das Regras de Ganho de XP (XP Raro e Difícil)
UPDATE public.xp_rules_config SET xp_reward = 3, cooldown_seconds = 60, daily_cap = 15 WHERE action_type = 'sale_completed';
UPDATE public.xp_rules_config SET xp_reward = 1, cooldown_seconds = 120, daily_cap = 5 WHERE action_type = 'stock_movement';
UPDATE public.xp_rules_config SET xp_reward = 2, cooldown_seconds = 86400, daily_cap = 2 WHERE action_type = 'daily_presence';
UPDATE public.xp_rules_config SET xp_reward = 2, cooldown_seconds = 300, daily_cap = 4 WHERE action_type = 'ticket_resolved';
UPDATE public.xp_rules_config SET xp_reward = 1, cooldown_seconds = 1800, daily_cap = 2 WHERE action_type = 'peer_eval_given';
UPDATE public.xp_rules_config SET xp_reward = 2, cooldown_seconds = 3600, daily_cap = 4 WHERE action_type = 'peer_eval_received';
UPDATE public.xp_rules_config SET xp_reward = 1, cooldown_seconds = 1800, daily_cap = 2 WHERE action_type = 'post_published';
UPDATE public.xp_rules_config SET xp_reward = 5, cooldown_seconds = 3600, daily_cap = 10 WHERE action_type = 'goal_milestone';

-- 3. Função Matemática Oficial de Níveis (1 até 50+)
-- Requisitos: Nível 10 (2.400 XP), Nível 20 (22.000 XP), Nível 50 (390.000 XP)
CREATE OR REPLACE FUNCTION public.calculate_gamification_level(p_xp BIGINT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_xp BIGINT;
BEGIN
  v_xp := COALESCE(p_xp, 0);
  IF v_xp < 0 THEN
    v_xp := 0;
  END IF;

  -- Níveis 40 a 50
  IF v_xp >= 390000 THEN RETURN 50;
  ELSIF v_xp >= 364000 THEN RETURN 49;
  ELSIF v_xp >= 341000 THEN RETURN 48;
  ELSIF v_xp >= 319000 THEN RETURN 47;
  ELSIF v_xp >= 298000 THEN RETURN 46;
  ELSIF v_xp >= 278000 THEN RETURN 45;
  ELSIF v_xp >= 259000 THEN RETURN 44;
  ELSIF v_xp >= 241000 THEN RETURN 43;
  ELSIF v_xp >= 224000 THEN RETURN 42;
  ELSIF v_xp >= 208000 THEN RETURN 41;
  ELSIF v_xp >= 193000 THEN RETURN 40;

  -- Níveis 30 a 39
  ELSIF v_xp >= 179000 THEN RETURN 39;
  ELSIF v_xp >= 166000 THEN RETURN 38;
  ELSIF v_xp >= 153500 THEN RETURN 37;
  ELSIF v_xp >= 141500 THEN RETURN 36;
  ELSIF v_xp >= 130000 THEN RETURN 35;
  ELSIF v_xp >= 119000 THEN RETURN 34;
  ELSIF v_xp >= 108500 THEN RETURN 33;
  ELSIF v_xp >= 98500 THEN RETURN 32;
  ELSIF v_xp >= 89000 THEN RETURN 31;
  ELSIF v_xp >= 80000 THEN RETURN 30;

  -- Níveis 20 a 29
  ELSIF v_xp >= 71500 THEN RETURN 29;
  ELSIF v_xp >= 64000 THEN RETURN 28;
  ELSIF v_xp >= 57000 THEN RETURN 27;
  ELSIF v_xp >= 50500 THEN RETURN 26;
  ELSIF v_xp >= 44500 THEN RETURN 25;
  ELSIF v_xp >= 39000 THEN RETURN 24;
  ELSIF v_xp >= 34000 THEN RETURN 23;
  ELSIF v_xp >= 29500 THEN RETURN 22;
  ELSIF v_xp >= 25500 THEN RETURN 21;
  ELSIF v_xp >= 22000 THEN RETURN 20; -- MILESTONE 20: 22.000 XP

  -- Níveis 10 a 19
  ELSIF v_xp >= 18800 THEN RETURN 19;
  ELSIF v_xp >= 15900 THEN RETURN 18;
  ELSIF v_xp >= 13300 THEN RETURN 17;
  ELSIF v_xp >= 11000 THEN RETURN 16;
  ELSIF v_xp >= 9000 THEN RETURN 15;
  ELSIF v_xp >= 7200 THEN RETURN 14;
  ELSIF v_xp >= 5700 THEN RETURN 13;
  ELSIF v_xp >= 4400 THEN RETURN 12;
  ELSIF v_xp >= 3300 THEN RETURN 11;
  ELSIF v_xp >= 2400 THEN RETURN 10; -- MILESTONE 10: 2.400 XP

  -- Níveis 1 a 9
  ELSIF v_xp >= 1700 THEN RETURN 9;
  ELSIF v_xp >= 1150 THEN RETURN 8;
  ELSIF v_xp >= 750 THEN RETURN 7;
  ELSIF v_xp >= 450 THEN RETURN 6;
  ELSIF v_xp >= 250 THEN RETURN 5;
  ELSIF v_xp >= 120 THEN RETURN 4;
  ELSIF v_xp >= 50 THEN RETURN 3;
  ELSIF v_xp >= 15 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$;

-- 4. Redução de XP de todos os membros existentes
UPDATE public.profiles
SET xp = LEAST(60, FLOOR(COALESCE(xp, 0) * 0.04)::BIGINT)
WHERE xp > 0;

-- 5. Atualização dos Níveis com a Nova Curva
UPDATE public.profiles
SET gamification_level = public.calculate_gamification_level(xp);

-- 6. Ajustar Transações de Auditoria Anteriores para Evitar Inconsistência no Ranking de Período
UPDATE public.xp_transactions
SET
  amount = LEAST(60, GREATEST(1, FLOOR(amount * 0.04)::INT)),
  xp_before = LEAST(60, FLOOR(COALESCE(xp_before, 0) * 0.04)::BIGINT),
  xp_after = LEAST(60, FLOOR(COALESCE(xp_after, 0) * 0.04)::BIGINT)
WHERE amount > 0;

-- 7. Atualizar RPC de Avaliação com Recompensa Calibrada (+1 ou +2 XP)
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
  v_last_eval TIMESTAMPTZ;
  v_new_rating NUMERIC(3,2);
  v_new_count INTEGER;
  v_member_name TEXT;
  v_incentive_xp INTEGER := 0;
BEGIN
  v_evaluator_id := auth.uid();
  IF v_evaluator_id IS NULL THEN
    RAISE EXCEPTION 'Apenas usuários autenticados podem avaliar.';
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

  INSERT INTO public.member_evaluations (member_id, evaluator_id, stars, feedback, category)
  VALUES (p_member_id, v_evaluator_id, p_stars, p_feedback, p_category);

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
    stars_count = v_new_count
  WHERE user_id = p_member_id;

  -- Recompensa simbólica e calibrada para avaliação de excelência (4 e 5 estrelas: +1 e +2 XP)
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
      gen_random_uuid()::text,
      'Avaliação positiva de desempenho (' || p_stars || ' estrelas)',
      jsonb_build_object('evaluator_id', v_evaluator_id, 'stars', p_stars)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Avaliação de ' || p_stars || ' estrelas registrada com sucesso para ' || COALESCE(v_member_name, 'membro') || '!',
    'new_rating', v_new_rating,
    'stars_count', v_new_count
  );
END;
$$;

-- 8. Atualizar get_gamification_ranking para limitar period_xp ao xp total
CREATE OR REPLACE FUNCTION public.get_gamification_ranking(
  p_period TEXT DEFAULT 'all'
)
RETURNS TABLE (
  user_id UUID,
  nome TEXT,
  nickname TEXT,
  avatar_url TEXT,
  game_id TEXT,
  nivel TEXT,
  is_developer BOOLEAN,
  is_ceo BOOLEAN,
  xp BIGINT,
  period_xp BIGINT,
  gamification_level INTEGER,
  stars_rating NUMERIC,
  stars_count INTEGER,
  insignias_count INTEGER,
  rank_position BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_since TIMESTAMPTZ;
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
    SELECT
      tx.user_id as pid,
      COALESCE(SUM(tx.amount), 0)::BIGINT as sum_xp
    FROM public.xp_transactions tx
    WHERE (v_since IS NULL OR tx.created_at >= v_since)
      AND tx.amount > 0
    GROUP BY tx.user_id
  ),
  insignia_calc AS (
    SELECT
      mi.member_id as mid,
      COUNT(*)::INTEGER as badge_count
    FROM public.member_insignias mi
    GROUP BY mi.member_id
  ),
  base_members AS (
    SELECT
      p.user_id,
      p.nome,
      p.nickname,
      COALESCE(p.avatar_url, p.discord_avatar_url) as avatar_url,
      p.game_id,
      COALESCE(ur.nivel::text, 'membro') as nivel,
      COALESCE(p.is_developer, false) as is_developer,
      COALESCE(p.is_ceo, false) as is_ceo,
      p.xp,
      CASE
        WHEN p_period = 'all' THEN p.xp
        ELSE LEAST(p.xp, COALESCE(pc.sum_xp, 0)::BIGINT)
      END as period_xp,
      p.gamification_level,
      p.stars_rating,
      p.stars_count,
      COALESCE(ic.badge_count, 0) as insignias_count
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    LEFT JOIN period_calc pc ON pc.pid = p.user_id
    LEFT JOIN insignia_calc ic ON ic.mid = p.user_id
    WHERE p.status = 'ativo'
  )
  SELECT
    bm.user_id,
    bm.nome,
    bm.nickname,
    bm.avatar_url,
    bm.game_id,
    bm.nivel,
    bm.is_developer,
    bm.is_ceo,
    bm.xp,
    bm.period_xp,
    bm.gamification_level,
    bm.stars_rating,
    bm.stars_count,
    bm.insignias_count,
    ROW_NUMBER() OVER (
      ORDER BY
        bm.xp DESC,
        bm.period_xp DESC,
        bm.stars_rating DESC,
        bm.insignias_count DESC,
        bm.nome ASC
    ) as rank_position
  FROM base_members bm
  ORDER BY rank_position ASC;
END;
$$;
