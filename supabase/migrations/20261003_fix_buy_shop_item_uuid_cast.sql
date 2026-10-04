-- =========================================================================
-- CORREÇÃO: buy_shop_item_rpc (Remoção de cast indevido text = uuid)
-- =========================================================================

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
  v_tag_assignment_id UUID;
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

  -- 4. Validação se já possui insígnia
  IF v_item.insignia_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.member_insignias
      WHERE (member_id = v_profile_user_id OR member_id = v_caller_id) AND insignia_id = v_item.insignia_id
    ) THEN
      RAISE EXCEPTION 'Você já possui a insígnia "%s". Não é necessário comprá-la novamente.', v_item.title;
    END IF;
  END IF;

  -- 5. Validação se já possui tag vinculada (Comparando UUID = UUID)
  IF v_item.tag_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.member_tag_assignments
      WHERE (member_id = v_profile_user_id OR member_id = v_caller_id) AND tag_id = v_item.tag_id
    ) THEN
      RAISE EXCEPTION 'Você já possui a tag "%s" vinculada ao seu perfil.', v_item.title;
    END IF;
  END IF;

  -- 6. Verificar saldo de moedas
  IF v_current_coins < v_item.price_coins THEN
    RAISE EXCEPTION 'Saldo insuficiente de TW Coins: você possui % e o item custa % TW Coins.', v_current_coins, v_item.price_coins;
  END IF;

  -- 7. Deduzir o valor em TW Coins
  v_new_coins := v_current_coins - v_item.price_coins;
  UPDATE public.profiles
  SET tw_coins = v_new_coins,
      updated_at = now()
  WHERE user_id = v_profile_user_id;

  -- 8. Abater estoque se aplicável
  IF v_item.stock IS NOT NULL THEN
    UPDATE public.shop_items
    SET stock = stock - 1,
        updated_at = now()
    WHERE id = p_item_id;
  END IF;

  -- 9. Concessão Imediata: Insígnia ou Tag
  v_grant_id := NULL;
  v_tag_assignment_id := NULL;

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
  ELSIF v_item.tag_id IS NOT NULL THEN
    INSERT INTO public.member_tag_assignments (
      member_id,
      tag_id,
      assigned_by,
      assigned_at
    ) VALUES (
      v_profile_user_id,
      v_item.tag_id,
      v_profile_user_id,
      now()
    )
    ON CONFLICT (member_id, tag_id) DO NOTHING
    RETURNING id INTO v_tag_assignment_id;

    v_purchase_status := 'concluido';
  ELSE
    -- Se for serviço personalizado, veículo ou recurso físico do RP, fica pendente de entrega
    IF v_item.category IN ('servicos', 'veiculos', 'recursos', 'vantagens', 'personalizacao') 
       OR v_item.item_type IN ('servico', 'custom', 'recurso', 'veiculo', 'personalizado') THEN
      v_purchase_status := 'pendente_entrega';
    ELSE
      v_purchase_status := 'concluido';
    END IF;
  END IF;

  -- 10. Registrar compra na tabela shop_purchases
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
      'item_type', COALESCE(v_item.item_type, 'custom'),
      'insignia_id', v_item.insignia_id,
      'tag_id', v_item.tag_id,
      'grant_id', v_grant_id,
      'tag_assignment_id', v_tag_assignment_id,
      'rarity', v_item.rarity,
      'buyer_name', v_user_name,
      'instructions', v_item.instructions
    )
  )
  RETURNING id INTO v_purchase_id;

  -- 11. Registrar na auditoria de TW Coins
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
      'item_title', v_item.title,
      'item_type', v_item.item_type
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'item_title', v_item.title,
    'price_paid', v_item.price_coins,
    'new_coins', v_new_coins,
    'has_insignia', (v_item.insignia_id IS NOT NULL),
    'has_tag', (v_item.tag_id IS NOT NULL),
    'status', v_purchase_status,
    'message', CASE 
      WHEN v_item.insignia_id IS NOT NULL THEN 'Compra realizada com sucesso! A insígnia foi adicionada ao seu perfil.'
      WHEN v_item.tag_id IS NOT NULL THEN 'Compra realizada com sucesso! A tag foi vinculada ao seu perfil.'
      WHEN v_purchase_status = 'pendente_entrega' THEN 'Compra realizada! Seu pedido foi registrado e aguarda entrega da diretoria/gerência.'
      ELSE 'Compra realizada com sucesso!'
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.buy_shop_item_rpc(UUID) TO authenticated, service_role;
