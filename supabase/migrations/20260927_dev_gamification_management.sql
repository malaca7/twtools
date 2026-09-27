-- ============================================================================
-- MIGRATION: GESTÃO COMPLETA DE XP, NÍVEIS E INSÍGNIAS NO PAINEL DEV
-- ============================================================================

-- 1. Helper para checagem estrita de Desenvolvedor ou Administrador
CREATE OR REPLACE FUNCTION public.is_developer(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND nivel::text = 'desenvolvedor'
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND is_developer = true
  );
END; $$;

-- 2. Função de correspondência inversa: Retorna o XP mínimo necessário para cada Nível (Curva Ultra Rara)
CREATE OR REPLACE FUNCTION public.get_min_xp_for_level(p_level INTEGER)
RETURNS BIGINT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_lvl INTEGER;
BEGIN
  v_lvl := COALESCE(p_level, 1);
  IF v_lvl <= 1 THEN RETURN 0;
  ELSIF v_lvl = 2 THEN RETURN 120;
  ELSIF v_lvl = 3 THEN RETURN 350;
  ELSIF v_lvl = 4 THEN RETURN 800;
  ELSIF v_lvl = 5 THEN RETURN 1500;
  ELSIF v_lvl = 6 THEN RETURN 2600;
  ELSIF v_lvl = 7 THEN RETURN 4200;
  ELSIF v_lvl = 8 THEN RETURN 6500;
  ELSIF v_lvl = 9 THEN RETURN 9800;
  ELSIF v_lvl = 10 THEN RETURN 15000;
  ELSIF v_lvl = 11 THEN RETURN 22000;
  ELSIF v_lvl = 12 THEN RETURN 31000;
  ELSIF v_lvl = 13 THEN RETURN 42000;
  ELSIF v_lvl = 14 THEN RETURN 56000;
  ELSIF v_lvl = 15 THEN RETURN 73000;
  ELSIF v_lvl = 16 THEN RETURN 94000;
  ELSIF v_lvl = 17 THEN RETURN 119000;
  ELSIF v_lvl = 18 THEN RETURN 149000;
  ELSIF v_lvl = 19 THEN RETURN 185000;
  ELSIF v_lvl = 20 THEN RETURN 230000;
  ELSIF v_lvl = 21 THEN RETURN 285000;
  ELSIF v_lvl = 22 THEN RETURN 350000;
  ELSIF v_lvl = 23 THEN RETURN 425000;
  ELSIF v_lvl = 24 THEN RETURN 510000;
  ELSIF v_lvl = 25 THEN RETURN 605000;
  ELSIF v_lvl = 26 THEN RETURN 710000;
  ELSIF v_lvl = 27 THEN RETURN 825000;
  ELSIF v_lvl = 28 THEN RETURN 950000;
  ELSIF v_lvl = 29 THEN RETURN 1085000;
  ELSIF v_lvl = 30 THEN RETURN 1230000;
  ELSIF v_lvl = 31 THEN RETURN 1385000;
  ELSIF v_lvl = 32 THEN RETURN 1550000;
  ELSIF v_lvl = 33 THEN RETURN 1725000;
  ELSIF v_lvl = 34 THEN RETURN 1910000;
  ELSIF v_lvl = 35 THEN RETURN 2105000;
  ELSIF v_lvl = 36 THEN RETURN 2310000;
  ELSIF v_lvl = 37 THEN RETURN 2525000;
  ELSIF v_lvl = 38 THEN RETURN 2750000;
  ELSIF v_lvl = 39 THEN RETURN 2985000;
  ELSIF v_lvl = 40 THEN RETURN 3230000;
  ELSIF v_lvl = 41 THEN RETURN 3485000;
  ELSIF v_lvl = 42 THEN RETURN 3750000;
  ELSIF v_lvl = 43 THEN RETURN 4025000;
  ELSIF v_lvl = 44 THEN RETURN 4310000;
  ELSIF v_lvl = 45 THEN RETURN 4605000;
  ELSIF v_lvl = 46 THEN RETURN 4910000;
  ELSIF v_lvl = 47 THEN RETURN 5225000;
  ELSIF v_lvl = 48 THEN RETURN 5550000;
  ELSIF v_lvl = 49 THEN RETURN 5885000;
  ELSIF v_lvl = 50 THEN RETURN 6250000;
  ELSE
    RETURN 6250000 + ((v_lvl - 50)::BIGINT * 350000);
  END IF;
END;
$$;

-- 3. RPC: AJUSTE MANUAL DE XP NO PAINEL DEV (ADICIONAR OU DEFINIR XP DIRETO)
CREATE OR REPLACE FUNCTION public.dev_manage_member_xp_rpc(
  p_member_id UUID,
  p_mode TEXT, -- 'add' | 'set'
  p_amount INTEGER,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_is_auth BOOLEAN;
  v_old_xp BIGINT;
  v_new_xp BIGINT;
  v_delta INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_member_name TEXT;
  v_dev_name TEXT;
  v_tx_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  v_caller_is_auth := public.is_developer(v_caller_id) OR public.is_admin(v_caller_id);
  IF NOT v_caller_is_auth THEN
    RAISE EXCEPTION 'Acesso negado: apenas Desenvolvedores ou Administradores podem ajustar XP manualmente.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'A justificativa para o ajuste manual de XP é obrigatória.';
  END IF;

  -- Bloqueio em linha do perfil do membro
  SELECT xp, gamification_level, COALESCE(nickname, nome)
  INTO v_old_xp, v_old_level, v_member_name
  FROM public.profiles
  WHERE user_id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro não encontrado no sistema.';
  END IF;

  SELECT COALESCE(nickname, nome)
  INTO v_dev_name
  FROM public.profiles
  WHERE user_id = v_caller_id;

  v_old_xp := COALESCE(v_old_xp, 0);
  v_old_level := COALESCE(v_old_level, 1);

  IF p_mode = 'set' THEN
    v_new_xp := GREATEST(0, p_amount);
    v_delta := (v_new_xp - v_old_xp)::INTEGER;
  ELSE -- 'add'
    v_new_xp := GREATEST(0, v_old_xp + p_amount);
    v_delta := (v_new_xp - v_old_xp)::INTEGER;
  END IF;

  v_new_level := public.calculate_gamification_level(v_new_xp);

  -- Atualiza o perfil do membro
  UPDATE public.profiles
  SET
    xp = v_new_xp,
    gamification_level = v_new_level,
    updated_at = now()
  WHERE user_id = p_member_id;

  -- Registra a transação de XP se houve alteração
  IF v_delta <> 0 THEN
    INSERT INTO public.xp_transactions (
      user_id,
      amount,
      xp_before,
      xp_after,
      action_type,
      reference_id,
      category,
      description,
      metadata,
      created_at
    ) VALUES (
      p_member_id,
      v_delta,
      v_old_xp,
      v_new_xp,
      'dev_manual_adjustment',
      'dev_adj_' || p_member_id::text || '_' || extract(epoch from now())::text,
      'dev',
      format('Ajuste Dev (%s): %s', CASE WHEN p_mode = 'set' THEN 'Fixo' ELSE 'Manual' END, trim(p_reason)),
      jsonb_build_object(
        'adjusted_by', v_caller_id,
        'dev_name', v_dev_name,
        'mode', p_mode,
        'amount_requested', p_amount,
        'delta', v_delta,
        'reason', trim(p_reason)
      ),
      now()
    ) RETURNING id INTO v_tx_id;
  END IF;

  -- Registra na auditoria global do sistema
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
    v_caller_id,
    'DEV_MANUAL_XP',
    'profiles',
    'profiles',
    p_member_id::text,
    jsonb_build_object(
      'target_member', v_member_name,
      'target_id', p_member_id,
      'mode', p_mode,
      'delta', v_delta,
      'old_xp', v_old_xp,
      'new_xp', v_new_xp,
      'old_level', v_old_level,
      'new_level', v_new_level,
      'reason', trim(p_reason)
    ),
    jsonb_build_object(
      'target_member', v_member_name,
      'target_id', p_member_id,
      'mode', p_mode,
      'delta', v_delta,
      'old_xp', v_old_xp,
      'new_xp', v_new_xp,
      'old_level', v_old_level,
      'new_level', v_new_level,
      'reason', trim(p_reason)
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'member_id', p_member_id,
    'member_name', v_member_name,
    'old_xp', v_old_xp,
    'new_xp', v_new_xp,
    'delta', v_delta,
    'old_level', v_old_level,
    'new_level', v_new_level
  );
END;
$$;

-- 4. RPC: DEFINIR NÍVEL MANUALMENTE (COM OU SEM SINCRONIZAÇÃO DE XP)
CREATE OR REPLACE FUNCTION public.dev_set_member_level_rpc(
  p_member_id UUID,
  p_level INTEGER,
  p_sync_xp BOOLEAN,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_old_xp BIGINT;
  v_new_xp BIGINT;
  v_old_level INTEGER;
  v_target_level INTEGER;
  v_member_name TEXT;
  v_dev_name TEXT;
  v_delta INTEGER;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF NOT (public.is_developer(v_caller_id) OR public.is_admin(v_caller_id)) THEN
    RAISE EXCEPTION 'Acesso negado: privilégios insuficientes.';
  END IF;

  IF p_level < 1 THEN
    RAISE EXCEPTION 'O nível deve ser maior ou igual a 1.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'A justificativa para a alteração de nível é obrigatória.';
  END IF;

  v_target_level := LEAST(100, GREATEST(1, p_level));

  SELECT xp, gamification_level, COALESCE(nickname, nome)
  INTO v_old_xp, v_old_level, v_member_name
  FROM public.profiles
  WHERE user_id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro não encontrado no sistema.';
  END IF;

  SELECT COALESCE(nickname, nome)
  INTO v_dev_name
  FROM public.profiles
  WHERE user_id = v_caller_id;

  v_old_xp := COALESCE(v_old_xp, 0);
  v_old_level := COALESCE(v_old_level, 1);

  IF p_sync_xp THEN
    v_new_xp := public.get_min_xp_for_level(v_target_level);
  ELSE
    v_new_xp := v_old_xp;
  END IF;

  v_delta := (v_new_xp - v_old_xp)::INTEGER;

  UPDATE public.profiles
  SET
    gamification_level = v_target_level,
    xp = v_new_xp,
    updated_at = now()
  WHERE user_id = p_member_id;

  IF v_delta <> 0 THEN
    INSERT INTO public.xp_transactions (
      user_id,
      amount,
      xp_before,
      xp_after,
      action_type,
      reference_id,
      category,
      description,
      metadata,
      created_at
    ) VALUES (
      p_member_id,
      v_delta,
      v_old_xp,
      v_new_xp,
      'dev_level_adjustment',
      'dev_lvl_' || p_member_id::text || '_' || extract(epoch from now())::text,
      'dev',
      format('Sincronização de nível para %s: %s', v_target_level, trim(p_reason)),
      jsonb_build_object(
        'adjusted_by', v_caller_id,
        'dev_name', v_dev_name,
        'target_level', v_target_level,
        'sync_xp', p_sync_xp,
        'reason', trim(p_reason)
      ),
      now()
    );
  END IF;

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
    v_caller_id,
    'DEV_MANUAL_LEVEL',
    'profiles',
    'profiles',
    p_member_id::text,
    jsonb_build_object(
      'target_member', v_member_name,
      'old_level', v_old_level,
      'new_level', v_target_level,
      'old_xp', v_old_xp,
      'new_xp', v_new_xp,
      'sync_xp', p_sync_xp,
      'reason', trim(p_reason)
    ),
    jsonb_build_object(
      'target_member', v_member_name,
      'old_level', v_old_level,
      'new_level', v_target_level,
      'old_xp', v_old_xp,
      'new_xp', v_new_xp,
      'sync_xp', p_sync_xp,
      'reason', trim(p_reason)
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'member_id', p_member_id,
    'old_level', v_old_level,
    'new_level', v_target_level,
    'old_xp', v_old_xp,
    'new_xp', v_new_xp
  );
END;
$$;

-- 5. RPC: CONCESSÃO MANUAL DE INSÍGNIA PELO DEV (ISENTO DE CUSTO / BYPASS)
CREATE OR REPLACE FUNCTION public.dev_grant_insignia_rpc(
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
  v_caller_id UUID;
  v_insignia RECORD;
  v_member_name TEXT;
  v_grant_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF NOT (public.is_developer(v_caller_id) OR public.is_admin(v_caller_id)) THEN
    RAISE EXCEPTION 'Acesso negado: privilégios insuficientes.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'A justificativa para conceder a insígnia é obrigatória.';
  END IF;

  SELECT * INTO v_insignia FROM public.insignias WHERE id = p_insignia_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insígnia não encontrada no catálogo.';
  END IF;

  SELECT COALESCE(nickname, nome) INTO v_member_name
  FROM public.profiles
  WHERE user_id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro alvo não encontrado no sistema.';
  END IF;

  -- Se o membro já possui a insígnia, atualiza os dados em vez de duplicar
  SELECT id INTO v_grant_id
  FROM public.member_insignias
  WHERE member_id = p_member_id AND insignia_id = p_insignia_id
  LIMIT 1;

  IF v_grant_id IS NOT NULL THEN
    UPDATE public.member_insignias
    SET
      granted_by = v_caller_id,
      reason = trim(p_reason),
      granted_at = now()
    WHERE id = v_grant_id;
  ELSE
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
      v_caller_id,
      0, -- Zero XP cost para Dev Bypass
      trim(p_reason),
      now()
    ) RETURNING id INTO v_grant_id;
  END IF;

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
    v_caller_id,
    'DEV_GRANT_INSIGNIA',
    'member_insignias',
    'member_insignias',
    v_grant_id::text,
    jsonb_build_object(
      'target_member', v_member_name,
      'member_id', p_member_id,
      'insignia_id', p_insignia_id,
      'insignia_name', v_insignia.name,
      'is_dev_bypass', true,
      'reason', trim(p_reason)
    ),
    jsonb_build_object(
      'target_member', v_member_name,
      'member_id', p_member_id,
      'insignia_id', p_insignia_id,
      'insignia_name', v_insignia.name,
      'is_dev_bypass', true,
      'reason', trim(p_reason)
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'grant_id', v_grant_id,
    'member_name', v_member_name,
    'insignia_name', v_insignia.name
  );
END;
$$;

-- 6. RPC: REVOGAÇÃO DE INSÍGNIA NO PAINEL DEV
CREATE OR REPLACE FUNCTION public.dev_revoke_insignia_rpc(
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
  v_caller_id UUID;
  v_insignia_name TEXT;
  v_member_name TEXT;
  v_deleted_count INTEGER;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF NOT (public.is_developer(v_caller_id) OR public.is_admin(v_caller_id)) THEN
    RAISE EXCEPTION 'Acesso negado: privilégios insuficientes.';
  END IF;

  SELECT name INTO v_insignia_name FROM public.insignias WHERE id = p_insignia_id;
  SELECT COALESCE(nickname, nome) INTO v_member_name FROM public.profiles WHERE user_id = p_member_id;

  DELETE FROM public.member_insignias
  WHERE member_id = p_member_id AND insignia_id = p_insignia_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

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
    v_caller_id,
    'DEV_REVOKE_INSIGNIA',
    'member_insignias',
    'member_insignias',
    p_insignia_id,
    jsonb_build_object(
      'target_member', v_member_name,
      'member_id', p_member_id,
      'insignia_id', p_insignia_id,
      'insignia_name', v_insignia_name,
      'reason', trim(p_reason)
    ),
    jsonb_build_object(
      'target_member', v_member_name,
      'member_id', p_member_id,
      'insignia_id', p_insignia_id,
      'insignia_name', v_insignia_name,
      'reason', trim(p_reason)
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'member_name', v_member_name,
    'insignia_name', v_insignia_name
  );
END;
$$;

-- 7. RPC: EXCLUSÃO OU DESATIVAÇÃO DE INSÍGNIA DO CATÁLOGO
CREATE OR REPLACE FUNCTION public.dev_delete_insignia_rpc(
  p_insignia_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_insignia RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF NOT (public.is_developer(v_caller_id) OR public.is_admin(v_caller_id)) THEN
    RAISE EXCEPTION 'Acesso negado: privilégios insuficientes.';
  END IF;

  SELECT * INTO v_insignia FROM public.insignias WHERE id = p_insignia_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insígnia não encontrada.';
  END IF;

  DELETE FROM public.insignias WHERE id = p_insignia_id;

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
    v_caller_id,
    'DEV_DELETE_INSIGNIA',
    'insignias',
    'insignias',
    p_insignia_id,
    jsonb_build_object('deleted_insignia', v_insignia.name, 'id', p_insignia_id),
    jsonb_build_object('deleted_insignia', v_insignia.name, 'id', p_insignia_id),
    now()
  );

  RETURN jsonb_build_object('success', true, 'insignia_id', p_insignia_id);
END;
$$;

-- 8. RPC: ATUALIZAÇÃO DE REGRAS DE XP & LIMITES DIÁRIOS
CREATE OR REPLACE FUNCTION public.dev_update_xp_rule_rpc(
  p_action_type TEXT,
  p_name TEXT,
  p_xp_reward INTEGER,
  p_cooldown_seconds INTEGER,
  p_daily_cap INTEGER,
  p_category TEXT,
  p_description TEXT,
  p_enabled BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF NOT (public.is_developer(v_caller_id) OR public.is_admin(v_caller_id)) THEN
    RAISE EXCEPTION 'Acesso negado: privilégios insuficientes.';
  END IF;

  INSERT INTO public.xp_rules_config (
    action_type, name, xp_reward, cooldown_seconds, daily_cap, category, description, enabled, updated_at
  ) VALUES (
    trim(p_action_type), trim(p_name), p_xp_reward, p_cooldown_seconds, p_daily_cap, p_category, p_description, p_enabled, now()
  )
  ON CONFLICT (action_type) DO UPDATE SET
    name = EXCLUDED.name,
    xp_reward = EXCLUDED.xp_reward,
    cooldown_seconds = EXCLUDED.cooldown_seconds,
    daily_cap = EXCLUDED.daily_cap,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    enabled = EXCLUDED.enabled,
    updated_at = now();

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
    v_caller_id,
    'DEV_UPDATE_XP_RULE',
    'xp_rules_config',
    'xp_rules_config',
    p_action_type,
    jsonb_build_object(
      'action_type', p_action_type,
      'xp_reward', p_xp_reward,
      'cooldown_seconds', p_cooldown_seconds,
      'daily_cap', p_daily_cap,
      'enabled', p_enabled
    ),
    jsonb_build_object(
      'action_type', p_action_type,
      'xp_reward', p_xp_reward,
      'cooldown_seconds', p_cooldown_seconds,
      'daily_cap', p_daily_cap,
      'enabled', p_enabled
    ),
    now()
  );

  RETURN jsonb_build_object('success', true, 'action_type', p_action_type);
END;
$$;
