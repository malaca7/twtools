-- Atualização para suportar números quebrados (fracionários) de XP

-- 1. Alter Tables
ALTER TABLE public.xp_rules_config 
  ALTER COLUMN xp_reward TYPE NUMERIC(10,2),
  ALTER COLUMN cooldown_seconds TYPE NUMERIC(10,2),
  ALTER COLUMN daily_cap TYPE NUMERIC(10,2);

ALTER TABLE public.profiles 
  ALTER COLUMN xp TYPE NUMERIC(10,2);

ALTER TABLE public.xp_transactions 
  ALTER COLUMN amount TYPE NUMERIC(10,2),
  ALTER COLUMN xp_before TYPE NUMERIC(10,2),
  ALTER COLUMN xp_after TYPE NUMERIC(10,2);

-- 2. Drop Old Functions (para recriar com NUMERIC)
DROP FUNCTION IF EXISTS public.dev_update_xp_rule_rpc(text, text, integer, integer, integer, text, text, boolean);
DROP FUNCTION IF EXISTS public.award_platform_xp_internal(uuid, text, integer, text, text, jsonb);
DROP FUNCTION IF EXISTS public.calculate_gamification_level(bigint);
DROP FUNCTION IF EXISTS public.get_level_for_xp(bigint);
DROP FUNCTION IF EXISTS public.dev_manage_member_xp_rpc(uuid, text, integer, text);
DROP FUNCTION IF EXISTS public.exchange_xp_for_coins_rpc(bigint);

-- 3. Recreate Functions with NUMERIC

-- dev_update_xp_rule_rpc
CREATE OR REPLACE FUNCTION public.dev_update_xp_rule_rpc(
  p_action_type TEXT,
  p_name TEXT,
  p_xp_reward NUMERIC,
  p_cooldown_seconds NUMERIC,
  p_daily_cap NUMERIC,
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
    user_id, action, entity, table_name, entity_id, old_data, new_data, created_at
  ) VALUES (
    v_caller_id, 'DEV_UPDATE_XP_RULE', 'xp_rules_config', 'xp_rules_config', trim(p_action_type), '{}'::jsonb,
    jsonb_build_object('action_type', p_action_type, 'name', p_name, 'xp_reward', p_xp_reward, 'cooldown', p_cooldown_seconds, 'cap', p_daily_cap, 'enabled', p_enabled),
    now()
  );

  RETURN jsonb_build_object('success', true, 'action_type', p_action_type);
END;
$$;

-- calculate_gamification_level
CREATE OR REPLACE FUNCTION public.calculate_gamification_level(p_xp NUMERIC)
RETURNS INTEGER
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  IF p_xp < 0 THEN RETURN 1; END IF;
  IF p_xp < 200 THEN RETURN 1; END IF;
  IF p_xp < 1000 THEN RETURN 2; END IF;
  IF p_xp < 3000 THEN RETURN 3; END IF;
  IF p_xp < 6000 THEN RETURN 4; END IF;
  IF p_xp < 10000 THEN RETURN 5; END IF;
  IF p_xp < 15000 THEN RETURN 6; END IF;
  IF p_xp < 25000 THEN RETURN 7; END IF;
  IF p_xp < 40000 THEN RETURN 8; END IF;
  IF p_xp < 60000 THEN RETURN 9; END IF;
  IF p_xp < 90000 THEN RETURN 10; END IF;
  IF p_xp < 130000 THEN RETURN 11 + floor((p_xp - 90000) / 40000)::INTEGER; END IF;
  IF p_xp < 180000 THEN RETURN 12 + floor((p_xp - 130000) / 50000)::INTEGER; END IF;
  RETURN 14 + floor((p_xp - 180000) / 60000)::INTEGER;
END;
$$;

-- get_level_for_xp
CREATE OR REPLACE FUNCTION public.get_level_for_xp(p_xp NUMERIC)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.calculate_gamification_level(p_xp);
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_level_for_xp(NUMERIC) TO authenticated, service_role, anon;

-- exchange_xp_for_coins_rpc
CREATE OR REPLACE FUNCTION public.exchange_xp_for_coins_rpc(
  p_xp_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_user_xp NUMERIC;
  v_exchange_rate NUMERIC := 10.0;
  v_coins_to_add NUMERIC;
  v_new_xp NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF p_xp_amount <= 0 THEN RAISE EXCEPTION 'Valor inválido de XP'; END IF;

  SELECT xp INTO v_user_xp FROM public.profiles WHERE id = v_user_id;
  IF v_user_xp IS NULL OR v_user_xp < p_xp_amount THEN RAISE EXCEPTION 'XP insuficiente'; END IF;

  v_coins_to_add := floor(p_xp_amount / v_exchange_rate);
  IF v_coins_to_add < 1 THEN RAISE EXCEPTION 'Mínimo de % XP para trocar por 1 TW Coin', v_exchange_rate; END IF;

  v_new_xp := v_user_xp - p_xp_amount;

  UPDATE public.profiles SET xp = v_new_xp, coins = COALESCE(coins, 0) + v_coins_to_add WHERE id = v_user_id;

  INSERT INTO public.xp_transactions (user_id, amount, xp_before, xp_after, action_type, category, description)
  VALUES (v_user_id, -p_xp_amount, v_user_xp, v_new_xp, 'xp_exchange', 'system', 'Troca de XP por TW Coins');

  INSERT INTO public.audit_logs (user_id, action, entity, table_name, entity_id, new_data)
  VALUES (v_user_id, 'EXCHANGE_XP', 'profiles', 'profiles', v_user_id::text, jsonb_build_object('xp_deducted', p_xp_amount, 'coins_added', v_coins_to_add));

  RETURN jsonb_build_object('success', true, 'coins_added', v_coins_to_add, 'new_xp', v_new_xp);
END;
$$;
GRANT EXECUTE ON FUNCTION public.exchange_xp_for_coins_rpc(NUMERIC) TO authenticated, service_role;

-- dev_manage_member_xp_rpc
CREATE OR REPLACE FUNCTION public.dev_manage_member_xp_rpc(
  p_member_id UUID,
  p_mode TEXT,
  p_amount NUMERIC,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_current_xp NUMERIC;
  v_new_xp NUMERIC;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Não autenticado.'; END IF;
  IF NOT (public.is_developer(v_caller_id) OR public.is_admin(v_caller_id)) THEN RAISE EXCEPTION 'Privilégios insuficientes.'; END IF;

  SELECT xp INTO v_current_xp FROM public.profiles WHERE id = p_member_id;
  IF v_current_xp IS NULL THEN v_current_xp := 0; END IF;

  IF p_mode = 'add' THEN
    v_new_xp := v_current_xp + p_amount;
  ELSIF p_mode = 'set' THEN
    v_new_xp := p_amount;
  ELSE
    RAISE EXCEPTION 'Modo inválido. Use add ou set.';
  END IF;

  IF v_new_xp < 0 THEN v_new_xp := 0; END IF;

  UPDATE public.profiles SET xp = v_new_xp WHERE id = p_member_id;

  INSERT INTO public.xp_transactions (user_id, amount, xp_before, xp_after, action_type, category, description)
  VALUES (p_member_id, v_new_xp - v_current_xp, v_current_xp, v_new_xp, 'dev_adjust', 'system', p_reason);

  RETURN jsonb_build_object('success', true, 'new_xp', v_new_xp);
END;
$$;

-- award_platform_xp_internal
CREATE OR REPLACE FUNCTION public.award_platform_xp_internal(
  p_user_id UUID,
  p_action_type TEXT,
  p_amount NUMERIC,
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
  v_today_xp NUMERIC;
  v_last_time TIMESTAMPTZ;
  v_grant_xp NUMERIC;
  v_user_xp NUMERIC;
  v_new_xp NUMERIC;
  v_new_level INTEGER;
  v_effective_reward NUMERIC;
BEGIN
  IF p_user_id IS NULL THEN RETURN jsonb_build_object('granted', false, 'reason', 'invalid_user'); END IF;

  SELECT * INTO v_rule FROM public.xp_rules_config WHERE action_type = p_action_type AND enabled = true;
  IF NOT FOUND THEN
    IF p_amount IS NULL OR p_amount <= 0 THEN RETURN jsonb_build_object('granted', false, 'reason', 'rule_disabled_or_not_found'); END IF;
  END IF;

  IF p_amount IS NOT NULL AND p_amount > 0 THEN
    v_effective_reward := p_amount;
  ELSE
    v_effective_reward := v_rule.xp_reward;
  END IF;

  IF v_rule IS NOT NULL THEN
    IF v_rule.cooldown_seconds > 0 THEN
      SELECT created_at INTO v_last_time FROM public.xp_transactions 
      WHERE user_id = p_user_id AND action_type = p_action_type ORDER BY created_at DESC LIMIT 1;
      
      IF v_last_time IS NOT NULL AND (now() - v_last_time) < (v_rule.cooldown_seconds * interval '1 second') THEN
        RETURN jsonb_build_object('granted', false, 'reason', 'cooldown_active');
      END IF;
    END IF;

    IF v_rule.daily_cap > 0 THEN
      SELECT COALESCE(sum(amount), 0) INTO v_today_xp FROM public.xp_transactions
      WHERE user_id = p_user_id AND action_type = p_action_type AND created_at >= CURRENT_DATE;
      
      IF v_today_xp >= v_rule.daily_cap THEN
        RETURN jsonb_build_object('granted', false, 'reason', 'daily_cap_reached');
      END IF;
      
      IF (v_today_xp + v_effective_reward) > v_rule.daily_cap THEN
        v_grant_xp := v_rule.daily_cap - v_today_xp;
      ELSE
        v_grant_xp := v_effective_reward;
      END IF;
    ELSE
      v_grant_xp := v_effective_reward;
    END IF;
  ELSE
    v_grant_xp := v_effective_reward;
  END IF;

  IF v_grant_xp <= 0 THEN RETURN jsonb_build_object('granted', false, 'reason', 'zero_or_negative_xp'); END IF;

  SELECT xp INTO v_user_xp FROM public.profiles WHERE id = p_user_id;
  IF v_user_xp IS NULL THEN v_user_xp := 0; END IF;

  v_new_xp := v_user_xp + v_grant_xp;
  UPDATE public.profiles SET xp = v_new_xp WHERE id = p_user_id;

  INSERT INTO public.xp_transactions (user_id, amount, xp_before, xp_after, action_type, reference_id, category, description, metadata)
  VALUES (p_user_id, v_grant_xp, v_user_xp, v_new_xp, p_action_type, p_reference_id, COALESCE(v_rule.category, 'geral'), p_description, p_metadata);

  v_new_level := public.calculate_gamification_level(v_new_xp);

  RETURN jsonb_build_object('granted', true, 'awarded_xp', v_grant_xp, 'new_total_xp', v_new_xp, 'new_level', v_new_level);
END;
$$;
