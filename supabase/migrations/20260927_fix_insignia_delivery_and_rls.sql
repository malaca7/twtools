-- ============================================================================
-- MIGRATION: CORREÇÃO DEFINITIVA DE CONCESSÃO E ENTREGA DE INSÍGNIAS
-- ============================================================================

-- 1. CORREÇÃO DE POLÍTICAS RLS (Garantir leitura irrestrita para frontend em todas as sessões)
DROP POLICY IF EXISTS "member_insignias_select" ON public.member_insignias;
CREATE POLICY "member_insignias_select" ON public.member_insignias
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "insignias_select" ON public.insignias;
CREATE POLICY "insignias_select" ON public.insignias
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "xp_rules_select" ON public.xp_rules_config;
CREATE POLICY "xp_rules_select" ON public.xp_rules_config
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "xp_transactions_select" ON public.xp_transactions;
CREATE POLICY "xp_transactions_select" ON public.xp_transactions
  FOR SELECT USING (true);

-- 2. DEDUPLICAÇÃO DE REGISTROS DUPLICADOS EXISTENTES EM member_insignias
DELETE FROM public.member_insignias a
USING public.member_insignias b
WHERE a.id > b.id
  AND a.member_id = b.member_id
  AND a.insignia_id = b.insignia_id;

-- 3. ÍNDICE ÚNICO PARA IMPEDIR CONCESSÕES DUPLICADAS
CREATE UNIQUE INDEX IF NOT EXISTS idx_member_insignias_unique
  ON public.member_insignias (member_id, insignia_id);

-- 4. ATUALIZAÇÃO DA FUNÇÃO grant_insignia_rpc (Validação anti-duplicação, proteção de XP e retorno detalhado)
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
  v_insignia RECORD;
  v_grantor_xp BIGINT;
  v_new_grantor_xp BIGINT;
  v_member_name TEXT;
  v_grantor_name TEXT;
  v_cost INTEGER;
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

  -- 7. Bloqueio em linha no perfil do membro beneficiado
  SELECT COALESCE(nickname, nome) INTO v_member_name
  FROM public.profiles
  WHERE user_id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro alvo não encontrado no sistema.';
  END IF;

  -- 8. Verificar se o membro já possui esta insígnia (impede débito indevido de XP)
  IF EXISTS (
    SELECT 1 FROM public.member_insignias
    WHERE member_id = p_member_id AND insignia_id = p_insignia_id
  ) THEN
    RAISE EXCEPTION 'O membro % já possui a insígnia "%s". Não é permitido conceder insígnias repetidas.', v_member_name, v_insignia.name;
  END IF;

  -- 9. Verificar se o administrador/gerente possui XP suficiente
  IF v_grantor_xp < v_cost THEN
    RAISE EXCEPTION 'XP insuficiente para conceder esta insígnia. Você possui % XP, mas o custo exigido é de % XP.', v_grantor_xp, v_cost;
  END IF;

  -- 10. DEDUZIR XP DO CONCEDENTE
  v_new_grantor_xp := v_grantor_xp - v_cost;
  UPDATE public.profiles
  SET
    xp = v_new_grantor_xp,
    gamification_level = public.calculate_gamification_level(v_new_grantor_xp),
    updated_at = now()
  WHERE user_id = v_grantor_id;

  -- 11. Registrar transação de auditoria de XP para o concedente se houve custo
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
        'reason', trim(p_reason)
      )
    );
  END IF;

  -- 12. Inserir registro oficial de concessão da insígnia
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

  -- 13. Registrar log de auditoria global
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
      'reason', trim(p_reason)
    ),
    jsonb_build_object(
      'member_id', p_member_id,
      'member_name', v_member_name,
      'insignia_id', p_insignia_id,
      'insignia_name', v_insignia.name,
      'xp_cost_deducted', v_cost,
      'grantor_new_xp', v_new_grantor_xp,
      'reason', trim(p_reason)
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Insígnia "%s" concedida com sucesso para %s!', v_insignia.name, v_member_name),
    'grant_id', v_grant_id,
    'insignia_id', p_insignia_id,
    'insignia_name', v_insignia.name,
    'member_name', v_member_name,
    'grantor_new_xp', v_new_grantor_xp,
    'cost_deducted', v_cost
  );
END;
$$;

-- 5. ATUALIZAÇÃO DE get_gamification_ranking (Contagem distinta e precisa de insígnias)
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
      COUNT(DISTINCT mi.insignia_id)::INTEGER as badge_count
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
      COALESCE(pc.sum_xp, 0)::BIGINT as period_xp,
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
        bm.stars_rating DESC,
        bm.insignias_count DESC,
        bm.nome ASC
    ) as rank_position
  FROM base_members bm
  ORDER BY rank_position ASC;
END;
$$;
