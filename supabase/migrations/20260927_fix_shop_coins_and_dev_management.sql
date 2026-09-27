-- ==============================================================================
-- TWIN WHEELS: CORREÇÃO COMPLETA DE LOJA, MOEDAS TW COINS, RPCs E AUDITORIA
-- Data: 2026-09-27
-- ==============================================================================

-- 1. GARANTIR COLUNA grantor_name NA TABELA member_insignias
ALTER TABLE public.member_insignias
ADD COLUMN IF NOT EXISTS grantor_name TEXT;

-- 2. GARANTIR COLUNA tw_coins EM public.profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tw_coins BIGINT NOT NULL DEFAULT 0;

-- 3. GARANTIR TABELAS DE LOJA E TRANSAÇÕES COM POLÍTICAS E ÍNDICES
CREATE TABLE IF NOT EXISTS public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Gift',
  category TEXT NOT NULL DEFAULT 'geral', -- 'insignias', 'vantagens', 'recursos', 'veiculos', 'personalizacao'
  price_coins BIGINT NOT NULL DEFAULT 0,
  price_xp BIGINT NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'comum', -- 'comum', 'raro', 'epico', 'lendario', 'mitico'
  stock INTEGER, -- NULL = ilimitado
  insignia_id TEXT REFERENCES public.insignias(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_items_active ON public.shop_items(active, display_order);
CREATE INDEX IF NOT EXISTS idx_shop_items_category ON public.shop_items(category);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_items_select_all" ON public.shop_items;
CREATE POLICY "shop_items_select_all"
  ON public.shop_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "shop_items_dev_all" ON public.shop_items;
CREATE POLICY "shop_items_dev_all"
  ON public.shop_items FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  item_title TEXT NOT NULL,
  category TEXT NOT NULL,
  price_coins_paid BIGINT NOT NULL DEFAULT 0,
  price_xp_paid BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'concluido', -- 'concluido', 'pendente_entrega', 'entregue', 'estornado'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_purchases_user ON public.shop_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_created ON public.shop_purchases(created_at DESC);

ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_purchases_select_all" ON public.shop_purchases;
CREATE POLICY "shop_purchases_select_all"
  ON public.shop_purchases FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "shop_purchases_manage_all" ON public.shop_purchases;
CREATE POLICY "shop_purchases_manage_all"
  ON public.shop_purchases FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.tw_coins_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount BIGINT NOT NULL,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  action_type TEXT NOT NULL, -- 'exchange_xp', 'shop_purchase', 'dev_grant', 'dev_deduct', 'refund'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tw_coins_transactions_user ON public.tw_coins_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tw_coins_transactions_created ON public.tw_coins_transactions(created_at DESC);

ALTER TABLE public.tw_coins_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tw_coins_transactions_select_all" ON public.tw_coins_transactions;
CREATE POLICY "tw_coins_transactions_select_all"
  ON public.tw_coins_transactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "tw_coins_transactions_insert_all" ON public.tw_coins_transactions;
CREATE POLICY "tw_coins_transactions_insert_all"
  ON public.tw_coins_transactions FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- 4. RPC ATÔMICA: CONVERSÃO DE XP PARA TW COINS (ROBUSTA, PRECISA E COM RESOLUÇÃO DE PERFIL)
CREATE OR REPLACE FUNCTION public.exchange_xp_for_coins_rpc(
  p_xp_amount BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_profile_user_id UUID;
  v_current_xp BIGINT;
  v_current_coins BIGINT;
  v_new_xp BIGINT;
  v_new_coins BIGINT;
  v_coins_gained BIGINT;
  v_user_name TEXT;
  v_new_level INTEGER;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  IF p_xp_amount IS NULL OR p_xp_amount <= 0 THEN
    RAISE EXCEPTION 'A quantidade de XP para troca deve ser maior que zero.';
  END IF;

  -- 1. Localizar perfil pelo user_id do auth ou metadata
  SELECT user_id, xp, tw_coins, COALESCE(nickname, nome, 'Membro')
  INTO v_profile_user_id, v_current_xp, v_current_coins, v_user_name
  FROM public.profiles
  WHERE user_id = v_caller_id
  FOR UPDATE;

  -- Fallback caso o user_id esteja em outro formato ou discord
  IF NOT FOUND THEN
    SELECT user_id, xp, tw_coins, COALESCE(nickname, nome, 'Membro')
    INTO v_profile_user_id, v_current_xp, v_current_coins, v_user_name
    FROM public.profiles
    WHERE discord_id = (SELECT raw_user_meta_data->>'provider_id' FROM auth.users WHERE id = v_caller_id)
       OR discord_email = (SELECT email FROM auth.users WHERE id = v_caller_id)
    LIMIT 1
    FOR UPDATE;

    IF FOUND AND v_profile_user_id <> v_caller_id THEN
      -- Sincronizar user_id do perfil com a sessão atual
      UPDATE public.profiles
      SET user_id = v_caller_id
      WHERE user_id = v_profile_user_id;
      v_profile_user_id := v_caller_id;
    END IF;
  END IF;

  IF v_profile_user_id IS NULL THEN
    RAISE EXCEPTION 'Perfil do usuário não encontrado na plataforma.';
  END IF;

  v_current_xp := COALESCE(v_current_xp, 0);
  v_current_coins := COALESCE(v_current_coins, 0);

  IF v_current_xp < p_xp_amount THEN
    RAISE EXCEPTION 'XP insuficiente: você possui % XP e tentou trocar % XP.', v_current_xp, p_xp_amount;
  END IF;

  -- Taxa de conversão 1 para 1
  v_coins_gained := p_xp_amount;
  v_new_xp := v_current_xp - p_xp_amount;
  v_new_coins := v_current_coins + v_coins_gained;
  v_new_level := public.calculate_gamification_level(v_new_xp);

  -- Atualizar perfil atomicamente
  UPDATE public.profiles
  SET xp = v_new_xp,
      tw_coins = v_new_coins,
      gamification_level = v_new_level,
      updated_at = now()
  WHERE user_id = v_profile_user_id;

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
    v_profile_user_id,
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
    v_profile_user_id,
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


-- 5. RPC CORRIGIDA E ROBUSTA DE COMPRA NA LOJA (buy_shop_item_rpc)
CREATE OR REPLACE FUNCTION public.buy_shop_item_rpc(
  p_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_profile_user_id UUID;
  v_item RECORD;
  v_current_coins BIGINT;
  v_new_coins BIGINT;
  v_user_name TEXT;
  v_purchase_id UUID;
  v_grant_id UUID;
  v_purchase_status TEXT;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  -- 1. Carregar e bloquear item da loja
  SELECT * INTO v_item
  FROM public.shop_items
  WHERE id = p_item_id AND active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item da loja não encontrado ou indisponível.';
  END IF;

  -- 2. Verificar estoque se aplicável
  IF v_item.stock IS NOT NULL AND v_item.stock <= 0 THEN
    RAISE EXCEPTION 'Este item está esgotado no momento.';
  END IF;

  -- 3. Localizar comprador em profiles
  SELECT user_id, tw_coins, COALESCE(nickname, nome, 'Membro')
  INTO v_profile_user_id, v_current_coins, v_user_name
  FROM public.profiles
  WHERE user_id = v_caller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT user_id, tw_coins, COALESCE(nickname, nome, 'Membro')
    INTO v_profile_user_id, v_current_coins, v_user_name
    FROM public.profiles
    WHERE discord_id = (SELECT raw_user_meta_data->>'provider_id' FROM auth.users WHERE id = v_caller_id)
       OR discord_email = (SELECT email FROM auth.users WHERE id = v_caller_id)
    LIMIT 1
    FOR UPDATE;

    IF FOUND AND v_profile_user_id <> v_caller_id THEN
      UPDATE public.profiles
      SET user_id = v_caller_id
      WHERE user_id = v_profile_user_id;
      v_profile_user_id := v_caller_id;
    END IF;
  END IF;

  IF v_profile_user_id IS NULL THEN
    RAISE EXCEPTION 'Perfil do comprador não encontrado na plataforma.';
  END IF;

  v_current_coins := COALESCE(v_current_coins, 0);

  -- 4. Se for uma insígnia, verificar se o membro já a possui
  IF v_item.insignia_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.member_insignias
      WHERE member_id = v_profile_user_id AND insignia_id = v_item.insignia_id
    ) THEN
      RAISE EXCEPTION 'Você já possui a insígnia "%s". Não é necessário comprá-la novamente.', v_item.title;
    END IF;
  END IF;

  -- 5. Verificar saldo de moedas
  IF v_current_coins < v_item.price_coins THEN
    RAISE EXCEPTION 'Saldo insuficiente de TW Coins: você possui % e o item custa % TW Coins.', v_current_coins, v_item.price_coins;
  END IF;

  -- 6. Deduzir o valor em TW Coins
  v_new_coins := v_current_coins - v_item.price_coins;
  UPDATE public.profiles
  SET tw_coins = v_new_coins,
      updated_at = now()
  WHERE user_id = v_profile_user_id;

  -- 7. Abater estoque se aplicável
  IF v_item.stock IS NOT NULL THEN
    UPDATE public.shop_items
    SET stock = stock - 1,
        updated_at = now()
    WHERE id = p_item_id;
  END IF;

  -- 8. Atribuir insígnia imediatamente se o item for uma condecoração
  v_grant_id := NULL;
  IF v_item.insignia_id IS NOT NULL THEN
    INSERT INTO public.member_insignias (
      member_id,
      insignia_id,
      granted_by,
      grantor_name,
      xp_cost_paid,
      reason,
      granted_at
    ) VALUES (
      v_profile_user_id,
      v_item.insignia_id,
      v_profile_user_id,
      'Loja Oficial Twin Wheels',
      v_item.price_coins,
      format('Adquirido na Loja Oficial Twin Wheels por %s TW Coins', v_item.price_coins),
      now()
    )
    ON CONFLICT (member_id, insignia_id) DO NOTHING
    RETURNING id INTO v_grant_id;

    v_purchase_status := 'concluido';
  ELSE
    -- Se for vantagem física, veículo ou recurso do RP, marca como pendente de entrega
    IF v_item.category IN ('veiculos', 'recursos', 'vantagens') THEN
      v_purchase_status := 'pendente_entrega';
    ELSE
      v_purchase_status := 'concluido';
    END IF;
  END IF;

  -- 9. Registrar compra na tabela shop_purchases
  INSERT INTO public.shop_purchases (
    user_id,
    item_id,
    item_title,
    category,
    price_coins_paid,
    status,
    metadata
  ) VALUES (
    v_profile_user_id,
    v_item.id,
    v_item.title,
    v_item.category,
    v_item.price_coins,
    v_purchase_status,
    jsonb_build_object(
      'insignia_id', v_item.insignia_id,
      'grant_id', v_grant_id,
      'rarity', v_item.rarity,
      'buyer_name', v_user_name
    )
  )
  RETURNING id INTO v_purchase_id;

  -- 10. Registrar na auditoria de TW Coins
  INSERT INTO public.tw_coins_transactions (
    user_id,
    amount,
    balance_before,
    balance_after,
    action_type,
    description,
    metadata
  ) VALUES (
    v_profile_user_id,
    -v_item.price_coins,
    v_current_coins,
    v_new_coins,
    'shop_purchase',
    format('Compra na Loja: %s (-%s TW Coins)', v_item.title, v_item.price_coins),
    jsonb_build_object(
      'item_id', v_item.id,
      'purchase_id', v_purchase_id,
      'item_title', v_item.title
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'item_title', v_item.title,
    'price_paid', v_item.price_coins,
    'new_coins', v_new_coins,
    'has_insignia', v_item.insignia_id IS NOT NULL,
    'status', v_purchase_status,
    'message', format('Você adquiriu com sucesso "%s" por %s TW Coins!', v_item.title, v_item.price_coins)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_shop_item_rpc(UUID) TO authenticated, service_role;


-- 6. RPC DEV: AJUSTAR COINS MANUALMENTE (CONCEDER OU DEDUZIR)
CREATE OR REPLACE FUNCTION public.dev_adjust_member_coins_rpc(
  p_target_user_id UUID,
  p_amount BIGINT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_name TEXT;
  v_current_coins BIGINT;
  v_new_coins BIGINT;
  v_target_name TEXT;
  v_action_type TEXT;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  -- Obter nome do administrador
  SELECT COALESCE(nickname, nome, 'Admin Dev') INTO v_admin_name
  FROM public.profiles
  WHERE user_id = v_admin_id;

  -- Carregar e travar perfil alvo
  SELECT tw_coins, COALESCE(nickname, nome, 'Membro')
  INTO v_current_coins, v_target_name
  FROM public.profiles
  WHERE user_id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro alvo não encontrado.';
  END IF;

  v_current_coins := COALESCE(v_current_coins, 0);
  v_new_coins := v_current_coins + p_amount;

  IF v_new_coins < 0 THEN
    RAISE EXCEPTION 'Saldo não pode ficar negativo. Saldo atual: % Coins, dedução solicitada: % Coins.', v_current_coins, ABS(p_amount);
  END IF;

  IF p_amount >= 0 THEN
    v_action_type := 'dev_grant';
  ELSE
    v_action_type := 'dev_deduct';
  END IF;

  UPDATE public.profiles
  SET tw_coins = v_new_coins,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  INSERT INTO public.tw_coins_transactions (
    user_id,
    amount,
    balance_before,
    balance_after,
    action_type,
    description,
    metadata
  ) VALUES (
    p_target_user_id,
    p_amount,
    v_current_coins,
    v_new_coins,
    v_action_type,
    COALESCE(trim(p_reason), format('Ajuste administrativo por %s', v_admin_name)),
    jsonb_build_object(
      'admin_id', v_admin_id,
      'admin_name', v_admin_name,
      'reason', trim(p_reason)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'target_user_id', p_target_user_id,
    'target_name', v_target_name,
    'previous_coins', v_current_coins,
    'new_coins', v_new_coins,
    'amount_adjusted', p_amount,
    'message', format('Saldo de %s atualizado com sucesso para %s TW Coins!', v_target_name, v_new_coins)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dev_adjust_member_coins_rpc(UUID, BIGINT, TEXT) TO authenticated, service_role;


-- 7. RPC DEV: ESTORNAR COMPRA DA LOJA (REFUND)
CREATE OR REPLACE FUNCTION public.dev_refund_shop_purchase_rpc(
  p_purchase_id UUID,
  p_reason TEXT DEFAULT 'Estorno administrativo solicitado'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_name TEXT;
  v_purchase RECORD;
  v_current_coins BIGINT;
  v_new_coins BIGINT;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  SELECT COALESCE(nickname, nome, 'Admin Dev') INTO v_admin_name
  FROM public.profiles
  WHERE user_id = v_admin_id;

  SELECT * INTO v_purchase
  FROM public.shop_purchases
  WHERE id = p_purchase_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de compra não encontrado.';
  END IF;

  IF v_purchase.status = 'estornado' THEN
    RAISE EXCEPTION 'Esta compra já foi estornada anteriormente.';
  END IF;

  -- Carregar saldo do comprador
  SELECT tw_coins INTO v_current_coins
  FROM public.profiles
  WHERE user_id = v_purchase.user_id
  FOR UPDATE;

  v_current_coins := COALESCE(v_current_coins, 0);
  v_new_coins := v_current_coins + v_purchase.price_coins_paid;

  -- Devolver moedas
  UPDATE public.profiles
  SET tw_coins = v_new_coins,
      updated_at = now()
  WHERE user_id = v_purchase.user_id;

  -- Se tinha insígnia vinculada, remover a condecoração
  IF (v_purchase.metadata->>'insignia_id') IS NOT NULL THEN
    DELETE FROM public.member_insignias
    WHERE member_id = v_purchase.user_id
      AND insignia_id = (v_purchase.metadata->>'insignia_id');
  END IF;

  -- Se tinha estoque, devolver ao estoque
  UPDATE public.shop_items
  SET stock = stock + 1
  WHERE id = v_purchase.item_id AND stock IS NOT NULL;

  -- Marcar compra como estornada
  UPDATE public.shop_purchases
  SET status = 'estornado',
      updated_at = now(),
      metadata = jsonb_set(metadata, '{refund}', jsonb_build_object(
        'refunded_at', now(),
        'refunded_by', v_admin_id,
        'refunded_by_name', v_admin_name,
        'reason', trim(p_reason)
      ))
  WHERE id = p_purchase_id;

  -- Inserir transação de estorno
  INSERT INTO public.tw_coins_transactions (
    user_id,
    amount,
    balance_before,
    balance_after,
    action_type,
    description,
    metadata
  ) VALUES (
    v_purchase.user_id,
    v_purchase.price_coins_paid,
    v_current_coins,
    v_new_coins,
    'refund',
    format('Estorno de compra: %s (+%s TW Coins)', v_purchase.item_title, v_purchase.price_coins_paid),
    jsonb_build_object(
      'purchase_id', p_purchase_id,
      'admin_id', v_admin_id,
      'reason', trim(p_reason)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', p_purchase_id,
    'refunded_coins', v_purchase.price_coins_paid,
    'new_coins', v_new_coins,
    'message', format('Compra estornada com sucesso! %s TW Coins devolvidos ao membro.', v_purchase.price_coins_paid)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.dev_refund_shop_purchase_rpc(UUID, TEXT) TO authenticated, service_role;
