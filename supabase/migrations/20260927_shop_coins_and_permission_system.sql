-- ==============================================================================
-- TWIN WHEELS: SISTEMA DE LOJA, MOEDA TW COINS, PERMISSÕES FLEXÍVEIS E RESET DE XP
-- Data: 2026-09-27
-- ==============================================================================

-- 1. RESET DE XP E NÍVEL DE TODOS OS MEMBROS (Começar do zero)
UPDATE public.profiles
SET xp = 0, gamification_level = 1;

DELETE FROM public.xp_transactions;

-- 2. ADICIONAR COLUNA DE MOEDA TW COINS EM PROFILES
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tw_coins BIGINT NOT NULL DEFAULT 0;

-- 3. TABELA DE TRANSAÇÕES DE TW COINS
CREATE TABLE IF NOT EXISTS public.tw_coins_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  balance_before BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  action_type TEXT NOT NULL, -- 'exchange_xp', 'shop_purchase', 'dev_grant', 'refund'
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

-- 4. TABELA DO CATÁLOGO DA LOJA
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

-- 5. TABELA DE COMPRAS DA LOJA
CREATE TABLE IF NOT EXISTS public.shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  item_title TEXT NOT NULL,
  category TEXT NOT NULL,
  price_coins_paid BIGINT NOT NULL DEFAULT 0,
  price_xp_paid BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'concluido', -- 'concluido', 'pendente_entrega', 'entregue'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_purchases_user ON public.shop_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_purchases_created ON public.shop_purchases(created_at DESC);

ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_purchases_select_all" ON public.shop_purchases;
CREATE POLICY "shop_purchases_select_all"
  ON public.shop_purchases FOR SELECT
  USING (true);

-- 6. FUNÇÃO DE VERIFICAÇÃO DINÂMICA DE PERMISSÃO (Qualquer cargo com a permissão habilitada)
CREATE OR REPLACE FUNCTION public.user_has_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_level TEXT;
  v_perms JSONB;
  v_is_dev BOOLEAN;
  v_is_ceo BOOLEAN;
BEGIN
  IF p_user_id IS NULL OR p_permission IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Desenvolvedores e CEOs têm acesso total
  SELECT is_developer, is_ceo INTO v_is_dev, v_is_ceo
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_is_dev IS TRUE OR v_is_ceo IS TRUE THEN
    RETURN true;
  END IF;

  -- 2. Obter cargo do usuário
  SELECT nivel::text INTO v_level
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_level IS NULL THEN
    RETURN false;
  END IF;

  IF v_level IN ('01', 'desenvolvedor') THEN
    RETURN true;
  END IF;

  -- 3. Verificar permissões customizadas na tabela role_permissions
  SELECT permissions INTO v_perms
  FROM public.role_permissions
  WHERE level = v_level OR nivel = v_level
  LIMIT 1;

  IF v_perms IS NOT NULL AND jsonb_typeof(v_perms) = 'array' THEN
    IF v_perms ? p_permission THEN
      RETURN true;
    END IF;
  END IF;

  -- 4. Cargos de liderança tradicionais com permissões padrão caso não configurados
  IF p_permission = 'grant_insignia' AND v_level IN ('02', 'gerente') THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_permission(UUID, TEXT) TO authenticated, anon, service_role;

-- 7. ATUALIZAÇÃO DA FUNÇÃO grant_insignia_rpc: USAR user_has_permission EM VEZ DE HARDCODE DE CARGO
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

  -- 2. VALIDAR SE O CARGO DO USUÁRIO POSSUI A PERMISSÃO 'grant_insignia' HABILITADA
  IF NOT (
    public.user_has_permission(v_grantor_id, 'grant_insignia')
    OR public.is_admin(v_grantor_id)
    OR public.is_manager(v_grantor_id)
  ) THEN
    RAISE EXCEPTION 'Permissão negada: seu cargo atual não possui autorização para conceder insígnias.';
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

  -- 8. Verificar se o membro já possui esta insígnia
  IF EXISTS (
    SELECT 1 FROM public.member_insignias
    WHERE member_id = p_member_id AND insignia_id = p_insignia_id
  ) THEN
    RAISE EXCEPTION 'O membro % já possui a insígnia "%s". Não é permitido conceder insígnias repetidas.', v_member_name, v_insignia.name;
  END IF;

  -- 9. Verificar se o concedente possui XP suficiente
  IF v_grantor_xp < v_cost THEN
    RAISE EXCEPTION 'XP insuficiente para condecorar: você possui % XP e a insígnia requer % XP.', v_grantor_xp, v_cost;
  END IF;

  -- 10. Deduzir o custo em XP do concedente
  v_new_grantor_xp := v_grantor_xp - v_cost;
  UPDATE public.profiles
  SET xp = v_new_grantor_xp,
      gamification_level = public.get_level_for_xp(v_new_grantor_xp),
      updated_at = now()
  WHERE user_id = v_grantor_id;

  -- 11. Registrar a concessão na tabela member_insignias
  INSERT INTO public.member_insignias (
    member_id,
    insignia_id,
    granted_by,
    grantor_name,
    xp_cost_paid,
    reason,
    granted_at
  ) VALUES (
    p_member_id,
    p_insignia_id,
    v_grantor_id,
    v_grantor_name,
    v_cost,
    trim(p_reason),
    now()
  )
  RETURNING id INTO v_grant_id;

  -- 12. Registrar no log de auditoria
  PERFORM public.create_audit_log_entry(
    v_grantor_id,
    'GRANT_INSIGNIA',
    'Concedida insígnia ' || v_insignia.name || ' para ' || v_member_name || ' (Custo: ' || v_cost || ' XP). Motivo: ' || trim(p_reason),
    jsonb_build_object(
      'member_id', p_member_id,
      'member_name', v_member_name,
      'insignia_id', p_insignia_id,
      'insignia_name', v_insignia.name,
      'xp_cost', v_cost,
      'grantor_xp_before', v_grantor_xp,
      'grantor_xp_after', v_new_grantor_xp,
      'reason', trim(p_reason)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'grant_id', v_grant_id,
    'insignia_name', v_insignia.name,
    'member_name', v_member_name,
    'grantor_xp_remaining', v_new_grantor_xp,
    'message', format('Insígnia "%s" concedida com sucesso para %s!', v_insignia.name, v_member_name)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_insignia_rpc(UUID, TEXT, TEXT) TO authenticated, service_role;

-- 8. FUNÇÃO PARA TROCAR XP POR TW COINS (Taxa: 1 XP = 1 TW Coin)
CREATE OR REPLACE FUNCTION public.exchange_xp_for_coins_rpc(
  p_xp_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_current_xp BIGINT;
  v_current_coins BIGINT;
  v_new_xp BIGINT;
  v_new_coins BIGINT;
  v_coins_gained BIGINT;
  v_user_name TEXT;
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

  UPDATE public.profiles
  SET xp = v_new_xp,
      tw_coins = v_new_coins,
      gamification_level = public.get_level_for_xp(v_new_xp),
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
    'message', format('Você converteu com sucesso %s XP em %s TW Coins!', p_xp_amount, v_coins_gained)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.exchange_xp_for_coins_rpc(INTEGER) TO authenticated, service_role;

-- 9. FUNÇÃO PARA COMPRAR ITEM NA LOJA (Usando TW Coins)
CREATE OR REPLACE FUNCTION public.buy_shop_item_rpc(
  p_item_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_item RECORD;
  v_current_coins BIGINT;
  v_new_coins BIGINT;
  v_user_name TEXT;
  v_purchase_id UUID;
  v_grant_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
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

  -- 3. Se for uma insígnia, verificar se o membro já a possui
  IF v_item.insignia_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.member_insignias
      WHERE member_id = v_user_id AND insignia_id = v_item.insignia_id
    ) THEN
      RAISE EXCEPTION 'Você já possui a insígnia "%s". Não é necessário comprá-la novamente.', v_item.title;
    END IF;
  END IF;

  -- 4. Carregar e bloquear saldo do comprador
  SELECT tw_coins, COALESCE(nickname, nome)
  INTO v_current_coins, v_user_name
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_current_coins < v_item.price_coins THEN
    RAISE EXCEPTION 'Saldo insuficiente de TW Coins: você possui % e o item custa % TW Coins.', v_current_coins, v_item.price_coins;
  END IF;

  -- 5. Deduzir o valor em TW Coins
  v_new_coins := v_current_coins - v_item.price_coins;
  UPDATE public.profiles
  SET tw_coins = v_new_coins,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- 6. Abater estoque se aplicável
  IF v_item.stock IS NOT NULL THEN
    UPDATE public.shop_items
    SET stock = stock - 1,
        updated_at = now()
    WHERE id = p_item_id;
  END IF;

  -- 7. Se o item concede insígnia, atribuir automaticamente ao membro
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
      v_user_id,
      v_item.insignia_id,
      v_user_id,
      'Loja Twin Wheels',
      v_item.price_coins,
      format('Adquirido na Loja Oficial Twin Wheels por %s TW Coins', v_item.price_coins),
      now()
    )
    RETURNING id INTO v_grant_id;
  END IF;

  -- 8. Registrar compra na tabela shop_purchases
  INSERT INTO public.shop_purchases (
    user_id,
    item_id,
    item_title,
    category,
    price_coins_paid,
    status,
    metadata
  ) VALUES (
    v_user_id,
    v_item.id,
    v_item.title,
    v_item.category,
    v_item.price_coins,
    'concluido',
    jsonb_build_object(
      'insignia_id', v_item.insignia_id,
      'grant_id', v_grant_id,
      'rarity', v_item.rarity
    )
  )
  RETURNING id INTO v_purchase_id;

  -- 9. Registrar na auditoria de TW Coins
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
    -v_item.price_coins,
    v_current_coins,
    v_new_coins,
    'shop_purchase',
    format('Compra na Loja: %s (-%s TW Coins)', v_item.title, v_item.price_coins),
    jsonb_build_object('item_id', v_item.id, 'purchase_id', v_purchase_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'item_title', v_item.title,
    'price_paid', v_item.price_coins,
    'new_coins', v_new_coins,
    'has_insignia', v_item.insignia_id IS NOT NULL,
    'message', format('Você adquiriu com sucesso "%s" por %s TW Coins!', v_item.title, v_item.price_coins)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_shop_item_rpc(UUID) TO authenticated, service_role;

-- 10. POPULAR ITENS INICIAIS DA LOJA (Se a tabela estiver vazia)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.shop_items LIMIT 1) THEN
    -- Inserir Insígnias oficiais que podem ser compradas na loja
    INSERT INTO public.shop_items (title, description, icon, category, price_coins, rarity, insignia_id, display_order)
    SELECT 
      name,
      description,
      icon,
      'insignias',
      xp_cost,
      rarity,
      id,
      ROW_NUMBER() OVER () as display_order
    FROM public.insignias
    WHERE active = true;

    -- Inserir itens e vantagens especiais
    INSERT INTO public.shop_items (title, description, icon, category, price_coins, rarity, stock, display_order)
    VALUES
      ('Tag VIP no Discord Twin Wheels', 'Receba o cargo exclusivo VIP no Discord com cor personalizada e destaque na lista de membros por 30 dias.', 'Crown', 'vantagens', 250, 'epico', 20, 100),
      ('Kit Operacional de Assalto', 'Conjunto com coletes reforçados, munição pesada e suprimentos médicos de pronta entrega no Baú da facção.', 'Boxes', 'recursos', 150, 'raro', NULL, 101),
      ('Vale Tunagem Completa', 'Voucher de mecânica com direito a blindagem máxima, motor nível 5 e nitro customizado na oficina parceira.', 'Truck', 'veiculos', 300, 'lendario', 15, 102),
      ('Destaque VIP no Perfil Oficial', 'Sua foto e canal recebem destaque no topo do painel e banner holográfico exclusivo no perfil público.', 'Sparkles', 'personalizacao', 180, 'epico', NULL, 103),
      ('Caixa de Suprimentos Misteriosa', 'Abra uma caixa surpresa contendo recursos raros, TW Coins extras ou itens especiais da facção.', 'Gift', 'recursos', 80, 'comum', NULL, 104);
  END IF;
END $$;
