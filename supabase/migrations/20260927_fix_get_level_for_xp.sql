-- ============================================================================
-- FIX: Criar função public.get_level_for_xp(BIGINT) e desambiguar RPCs
-- Resolve o erro: Could not choose the best candidate function between integer e bigint
-- ============================================================================

-- 1. Dropar sobrecargas ambíguas de INTEGER que conflitam no PostgREST
DROP FUNCTION IF EXISTS public.exchange_xp_for_coins_rpc(INTEGER);
DROP FUNCTION IF EXISTS public.get_level_for_xp(INTEGER);

-- 2. Criar função get_level_for_xp única (BIGINT aceita inteiros automaticamente por coerção)
CREATE OR REPLACE FUNCTION public.get_level_for_xp(p_xp BIGINT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.calculate_gamification_level(p_xp);
$$;

GRANT EXECUTE ON FUNCTION public.get_level_for_xp(BIGINT) TO authenticated, service_role, anon;

-- 3. Atualizar exchange_xp_for_coins_rpc com assinatura única BIGINT
CREATE OR REPLACE FUNCTION public.exchange_xp_for_coins_rpc(
  p_xp_amount BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_xp BIGINT;
  v_current_coins BIGINT;
  v_new_xp BIGINT;
  v_new_coins BIGINT;
  v_coins_gained BIGINT;
  v_user_name TEXT;
  v_new_level INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF p_xp_amount IS NULL OR p_xp_amount <= 0 THEN
    RAISE EXCEPTION 'A quantidade de XP para troca deve ser maior que zero.';
  END IF;

  -- Bloquear perfil para atualização atômica
  SELECT xp, tw_coins, COALESCE(nickname, nome)
  INTO v_current_xp, v_current_coins, v_user_name
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil do usuário não encontrado.';
  END IF;

  IF v_current_xp < p_xp_amount THEN
    RAISE EXCEPTION 'XP insuficiente: você possui % XP e tentou trocar % XP.', v_current_xp, p_xp_amount;
  END IF;

  -- Conversão 1 para 1
  v_coins_gained := p_xp_amount;
  v_new_xp := v_current_xp - p_xp_amount;
  v_new_coins := v_current_coins + v_coins_gained;
  v_new_level := public.calculate_gamification_level(v_new_xp);

  UPDATE public.profiles
  SET xp = v_new_xp,
      tw_coins = v_new_coins,
      gamification_level = v_new_level,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Registrar na auditoria de XP
  INSERT INTO public.xp_transactions (
    user_id,
    amount,
    xp_before,
    xp_after,
    action_type,
    category,
    description
  ) VALUES (
    v_user_id,
    -p_xp_amount,
    v_current_xp,
    v_new_xp,
    'coin_exchange',
    'loja',
    format('Conversão de %s XP em %s TW Coins', p_xp_amount, v_coins_gained)
  );

  -- Registrar na auditoria de TW Coins
  INSERT INTO public.tw_coins_transactions (
    user_id,
    amount,
    balance_before,
    balance_after,
    action_type,
    description,
    metadata
  ) VALUES (
    v_user_id,
    v_coins_gained,
    v_current_coins,
    v_new_coins,
    'exchange_xp',
    format('Troca realizada: +%s TW Coins a partir de %s XP', v_coins_gained, p_xp_amount),
    jsonb_build_object('xp_exchanged', p_xp_amount)
  );

  RETURN jsonb_build_object(
    'success', true,
    'coins_gained', v_coins_gained,
    'new_xp', v_new_xp,
    'new_coins', v_new_coins,
    'new_level', v_new_level,
    'message', format('Você converteu com sucesso %s XP em %s TW Coins!', p_xp_amount, v_coins_gained)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.exchange_xp_for_coins_rpc(BIGINT) TO authenticated, service_role;
