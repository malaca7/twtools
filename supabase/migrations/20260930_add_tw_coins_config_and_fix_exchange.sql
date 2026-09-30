-- ==============================================================================
-- MIGRAÇÃO: CONFIGURAÇÃO DE CÂMBIO TW COINS & CORREÇÃO DA CONVERSÃO DE XP
-- Data: 2026-09-30
-- ==============================================================================

-- 1. TABELA DE CONFIGURAÇÃO DE CÂMBIO E ECONOMIA
CREATE TABLE IF NOT EXISTS public.tw_coins_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  xp_per_coin NUMERIC(10,2) NOT NULL DEFAULT 1.00 CHECK (xp_per_coin > 0),
  exchange_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (exchange_fee_percent >= 0 AND exchange_fee_percent <= 100),
  min_xp_exchange NUMERIC(10,2) NOT NULL DEFAULT 1.00 CHECK (min_xp_exchange >= 0),
  exchange_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Garantir registro padrão único
INSERT INTO public.tw_coins_config (id, xp_per_coin, exchange_fee_percent, min_xp_exchange, exchange_enabled)
VALUES (1, 1.00, 0.00, 1.00, true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.tw_coins_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tw_coins_config_select_all" ON public.tw_coins_config;
CREATE POLICY "tw_coins_config_select_all"
  ON public.tw_coins_config FOR SELECT
  TO authenticated, anon, service_role
  USING (true);

DROP POLICY IF EXISTS "tw_coins_config_manage_dev" ON public.tw_coins_config;
CREATE POLICY "tw_coins_config_manage_dev"
  ON public.tw_coins_config FOR ALL
  TO authenticated, service_role
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (user_id = auth.uid() OR id = auth.uid())
        AND (is_developer = true OR is_ceo = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE (user_id = auth.uid() OR id = auth.uid())
        AND (is_developer = true OR is_ceo = true)
    )
  );

GRANT SELECT ON public.tw_coins_config TO authenticated, anon, service_role;
GRANT ALL ON public.tw_coins_config TO service_role;

-- 2. RPC DE LEITURA DA CONFIGURAÇÃO DE CÂMBIO
CREATE OR REPLACE FUNCTION public.get_coins_exchange_config_rpc()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT id, xp_per_coin, exchange_fee_percent, min_xp_exchange, exchange_enabled, updated_at
  INTO v_rec
  FROM public.tw_coins_config
  WHERE id = 1;

  IF NOT FOUND THEN
    INSERT INTO public.tw_coins_config (id, xp_per_coin, exchange_fee_percent, min_xp_exchange, exchange_enabled)
    VALUES (1, 1.00, 0.00, 1.00, true)
    RETURNING id, xp_per_coin, exchange_fee_percent, min_xp_exchange, exchange_enabled, updated_at
    INTO v_rec;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'xp_per_coin', COALESCE(v_rec.xp_per_coin, 1.00),
    'exchange_fee_percent', COALESCE(v_rec.exchange_fee_percent, 0.00),
    'min_xp_exchange', COALESCE(v_rec.min_xp_exchange, 1.00),
    'exchange_enabled', COALESCE(v_rec.exchange_enabled, true),
    'updated_at', v_rec.updated_at
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_coins_exchange_config_rpc() TO authenticated, anon, service_role;

-- 3. RPC DEV PARA ATUALIZAR A COBRANÇA E PARÂMETROS DE CÂMBIO
CREATE OR REPLACE FUNCTION public.dev_update_coins_config_rpc(
  p_xp_per_coin NUMERIC,
  p_exchange_fee_percent NUMERIC,
  p_min_xp_exchange NUMERIC,
  p_exchange_enabled BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_is_dev BOOLEAN := false;
  v_is_ceo BOOLEAN := false;
  v_rec RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  SELECT is_developer, is_ceo
  INTO v_is_dev, v_is_ceo
  FROM public.profiles
  WHERE user_id = v_caller_id OR id = v_caller_id
  LIMIT 1;

  IF NOT (COALESCE(v_is_dev, false) OR COALESCE(v_is_ceo, false)) THEN
    RAISE EXCEPTION 'Apenas Desenvolvedores ou CEOs podem alterar a configuração de câmbio.';
  END IF;

  IF p_xp_per_coin IS NULL OR p_xp_per_coin <= 0 THEN
    RAISE EXCEPTION 'A taxa de XP por Coin deve ser maior que zero.';
  END IF;

  IF p_exchange_fee_percent IS NULL OR p_exchange_fee_percent < 0 OR p_exchange_fee_percent > 100 THEN
    RAISE EXCEPTION 'A tarifa de câmbio deve estar entre 0%% e 100%%.';
  END IF;

  IF p_min_xp_exchange IS NULL OR p_min_xp_exchange < 0 THEN
    RAISE EXCEPTION 'O valor mínimo de XP para conversão não pode ser negativo.';
  END IF;

  INSERT INTO public.tw_coins_config (
    id, xp_per_coin, exchange_fee_percent, min_xp_exchange, exchange_enabled, updated_at, updated_by
  ) VALUES (
    1, p_xp_per_coin, p_exchange_fee_percent, p_min_xp_exchange, COALESCE(p_exchange_enabled, true), now(), v_caller_id
  )
  ON CONFLICT (id) DO UPDATE SET
    xp_per_coin = EXCLUDED.xp_per_coin,
    exchange_fee_percent = EXCLUDED.exchange_fee_percent,
    min_xp_exchange = EXCLUDED.min_xp_exchange,
    exchange_enabled = EXCLUDED.exchange_enabled,
    updated_at = now(),
    updated_by = EXCLUDED.updated_by
  RETURNING id, xp_per_coin, exchange_fee_percent, min_xp_exchange, exchange_enabled, updated_at
  INTO v_rec;

  -- Auditoria
  INSERT INTO public.audit_logs (
    user_id, action, entity, table_name, entity_id, new_data
  ) VALUES (
    v_caller_id,
    'UPDATE_COINS_CONFIG',
    'tw_coins_config',
    'tw_coins_config',
    '1',
    jsonb_build_object(
      'xp_per_coin', p_xp_per_coin,
      'exchange_fee_percent', p_exchange_fee_percent,
      'min_xp_exchange', p_min_xp_exchange,
      'exchange_enabled', p_exchange_enabled
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Configuração de câmbio de TW Coins atualizada com sucesso!',
    'xp_per_coin', v_rec.xp_per_coin,
    'exchange_fee_percent', v_rec.exchange_fee_percent,
    'min_xp_exchange', v_rec.min_xp_exchange,
    'exchange_enabled', v_rec.exchange_enabled,
    'updated_at', v_rec.updated_at
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.dev_update_coins_config_rpc(NUMERIC, NUMERIC, NUMERIC, BOOLEAN) TO authenticated, service_role;

-- 4. RPC DE CONVERSÃO DE XP POR TW COINS (CORRIGIDA, ATÔMICA E CONFIGURÁVEL)
DROP FUNCTION IF EXISTS public.exchange_xp_for_coins_rpc(BIGINT);
DROP FUNCTION IF EXISTS public.exchange_xp_for_coins_rpc(INTEGER);
DROP FUNCTION IF EXISTS public.exchange_xp_for_coins_rpc(NUMERIC);

CREATE OR REPLACE FUNCTION public.exchange_xp_for_coins_rpc(
  p_xp_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_profile_id UUID;
  v_profile_user_id UUID;
  v_current_xp NUMERIC;
  v_current_coins BIGINT;
  v_user_name TEXT;
  v_new_xp NUMERIC;
  v_new_coins BIGINT;
  v_new_level INTEGER;

  -- Parâmetros de Câmbio
  v_xp_per_coin NUMERIC;
  v_fee_percent NUMERIC;
  v_min_xp NUMERIC;
  v_exchange_enabled BOOLEAN;

  v_gross_coins BIGINT;
  v_fee_coins BIGINT;
  v_coins_to_add BIGINT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF p_xp_amount IS NULL OR p_xp_amount <= 0 THEN
    RAISE EXCEPTION 'A quantidade de XP para troca deve ser maior que zero.';
  END IF;

  -- 1. Carregar Parâmetros Oficiais de Câmbio da Tabela tw_coins_config
  SELECT xp_per_coin, exchange_fee_percent, min_xp_exchange, exchange_enabled
  INTO v_xp_per_coin, v_fee_percent, v_min_xp, v_exchange_enabled
  FROM public.tw_coins_config
  WHERE id = 1;

  v_xp_per_coin := COALESCE(v_xp_per_coin, 1.00);
  v_fee_percent := COALESCE(v_fee_percent, 0.00);
  v_min_xp := COALESCE(v_min_xp, 1.00);
  v_exchange_enabled := COALESCE(v_exchange_enabled, true);

  IF NOT v_exchange_enabled THEN
    RAISE EXCEPTION 'A conversão de XP em TW Coins está temporariamente suspensa pela diretoria.';
  END IF;

  IF p_xp_amount < v_min_xp THEN
    RAISE EXCEPTION 'O valor mínimo de XP para conversão é de % XP.', v_min_xp;
  END IF;

  -- 2. Localizar perfil do usuário autenticado de forma robusta (por user_id ou por id)
  SELECT id, user_id, xp, tw_coins, COALESCE(nickname, nome, 'Membro')
  INTO v_profile_id, v_profile_user_id, v_current_xp, v_current_coins, v_user_name
  FROM public.profiles
  WHERE user_id = v_caller_id OR id = v_caller_id
  LIMIT 1
  FOR UPDATE;

  -- Fallback se o user_id for correspondido via metadata do Discord
  IF NOT FOUND THEN
    SELECT id, user_id, xp, tw_coins, COALESCE(nickname, nome, 'Membro')
    INTO v_profile_id, v_profile_user_id, v_current_xp, v_current_coins, v_user_name
    FROM public.profiles
    WHERE discord_id = (SELECT raw_user_meta_data->>'provider_id' FROM auth.users WHERE id = v_caller_id)
       OR discord_email = (SELECT email FROM auth.users WHERE id = v_caller_id)
    LIMIT 1
    FOR UPDATE;

    IF FOUND AND v_profile_user_id <> v_caller_id THEN
      UPDATE public.profiles
      SET user_id = v_caller_id
      WHERE id = v_profile_id;
      v_profile_user_id := v_caller_id;
    END IF;
  END IF;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Perfil do usuário não encontrado na base de dados.';
  END IF;

  v_current_xp := COALESCE(v_current_xp, 0);
  v_current_coins := COALESCE(v_current_coins, 0);

  IF v_current_xp < p_xp_amount THEN
    RAISE EXCEPTION 'XP insuficiente: você possui % XP e tentou converter % XP.', v_current_xp, p_xp_amount;
  END IF;

  -- 3. Cálculo de Câmbio com Taxa e Cobrança
  -- Moedas brutas obtidas pela taxa de câmbio (XP por Coin)
  v_gross_coins := floor(p_xp_amount / v_xp_per_coin);
  IF v_gross_coins < 1 THEN
    RAISE EXCEPTION 'Com a taxa de câmbio configurada (% XP por TW Coin), você precisa de pelo menos % XP para obter 1 Coin.', v_xp_per_coin, v_xp_per_coin;
  END IF;

  -- Cobrança da taxa percentual de câmbio
  IF v_fee_percent > 0 THEN
    v_fee_coins := floor(v_gross_coins * (v_fee_percent / 100.0));
  ELSE
    v_fee_coins := 0;
  END IF;

  v_coins_to_add := v_gross_coins - v_fee_coins;
  IF v_coins_to_add < 1 THEN
    RAISE EXCEPTION 'O valor líquido de TW Coins após dedução da tarifa de câmbio (% %%) é inferior a 1 Coin.', v_fee_percent;
  END IF;

  v_new_xp := v_current_xp - p_xp_amount;
  v_new_coins := v_current_coins + v_coins_to_add;
  v_new_level := public.calculate_gamification_level(v_new_xp);

  -- 4. Atualizar Perfil de forma atômica
  UPDATE public.profiles
  SET xp = v_new_xp,
      tw_coins = v_new_coins,
      gamification_level = v_new_level,
      updated_at = now()
  WHERE id = v_profile_id;

  -- 5. Registrar Histórico de XP
  INSERT INTO public.xp_transactions (
    user_id, amount, xp_before, xp_after, action_type, category, description, metadata
  ) VALUES (
    v_profile_user_id,
    -p_xp_amount,
    v_current_xp,
    v_new_xp,
    'xp_exchange',
    'system',
    format('Conversão de %s XP em %s TW Coins (Taxa: %s XP/Coin, Tarifa: %s%%)', p_xp_amount, v_coins_to_add, v_xp_per_coin, v_fee_percent),
    jsonb_build_object(
      'coins_gained', v_coins_to_add,
      'gross_coins', v_gross_coins,
      'fee_coins', v_fee_coins,
      'xp_per_coin', v_xp_per_coin,
      'fee_percent', v_fee_percent
    )
  );

  -- 6. Registrar Extrato de TW Coins
  INSERT INTO public.tw_coins_transactions (
    user_id, amount, balance_before, balance_after, action_type, description, metadata
  ) VALUES (
    v_profile_user_id,
    v_coins_to_add,
    v_current_coins,
    v_new_coins,
    'exchange_xp',
    format('Conversão de %s XP em %s TW Coins (Taxa: %s XP/Coin, Tarifa: %s%%)', p_xp_amount, v_coins_to_add, v_xp_per_coin, v_fee_percent),
    jsonb_build_object(
      'xp_deducted', p_xp_amount,
      'gross_coins', v_gross_coins,
      'fee_coins', v_fee_coins,
      'xp_per_coin', v_xp_per_coin,
      'fee_percent', v_fee_percent
    )
  );

  -- 7. Log de Auditoria Geral
  INSERT INTO public.audit_logs (
    user_id, action, entity, table_name, entity_id, new_data
  ) VALUES (
    v_profile_user_id,
    'EXCHANGE_XP',
    'profiles',
    'profiles',
    v_profile_id::text,
    jsonb_build_object(
      'xp_deducted', p_xp_amount,
      'coins_added', v_coins_to_add,
      'gross_coins', v_gross_coins,
      'fee_coins', v_fee_coins,
      'xp_per_coin', v_xp_per_coin,
      'fee_percent', v_fee_percent
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'coins_gained', v_coins_to_add,
    'gross_coins', v_gross_coins,
    'fee_coins', v_fee_coins,
    'new_xp', v_new_xp,
    'new_coins', v_new_coins,
    'message', format('Sucesso! %s XP convertidos em %s TW Coins.', p_xp_amount, v_coins_to_add)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.exchange_xp_for_coins_rpc(NUMERIC) TO authenticated, service_role;

-- Recarregar cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
