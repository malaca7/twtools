-- ==============================================================================
-- MIGRATION: RPC UNIFICADA DE GESTÃO E TRANSFERÊNCIA DE SALDOS (ARMAZÉM / BAÚS / VENDAS)
-- Permite Mover, Remover, Retornar e Ajustar saldos de produtos em qualquer localização
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.manage_production_stock_rpc(
  p_product_id uuid,
  p_action text, -- 'TRANSFER', 'REMOVE', 'ADJUST'
  p_origin text, -- 'WAREHOUSE', 'SALE', 'BAU'
  p_destination text DEFAULT NULL, -- 'WAREHOUSE', 'SALE', 'BAU'
  p_origin_bau_id uuid DEFAULT NULL,
  p_destination_bau_id uuid DEFAULT NULL,
  p_quantity numeric DEFAULT 0,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_prod record;
  v_wh_prev numeric := 0;
  v_wh_new numeric := 0;
  v_sale_prev numeric := 0;
  v_sale_new numeric := 0;
  v_chest_orig_prev numeric := 0;
  v_chest_orig_new numeric := 0;
  v_chest_dest_prev numeric := 0;
  v_chest_dest_new numeric := 0;
  v_orig_label text;
  v_dest_label text;
  v_bau_orig_nome text;
  v_bau_dest_nome text;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  IF NOT (public.can_operate(v_caller_id) OR public.is_manager(v_caller_id)) THEN
    RAISE EXCEPTION 'Permissão negada para gerenciar saldos e transferências.';
  END IF;

  -- 1. Trava Produto
  SELECT * INTO v_prod FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado.';
  END IF;

  -- Garante existência de registro em warehouse_stock
  INSERT INTO public.warehouse_stock (product_id, quantity)
  VALUES (p_product_id, 0)
  ON CONFLICT (product_id) DO NOTHING;

  SELECT quantity INTO v_wh_prev FROM public.warehouse_stock WHERE product_id = p_product_id FOR UPDATE;
  v_wh_new := v_wh_prev;

  v_sale_prev := COALESCE(v_prod.sale_available_quantity, 0);
  v_sale_new := v_sale_prev;

  -- Se envolve baú de origem
  IF p_origin = 'BAU' THEN
    IF p_origin_bau_id IS NULL THEN
      SELECT b.id, b.nome INTO p_origin_bau_id, v_bau_orig_nome FROM public.baus b WHERE b.ativo IS NOT FALSE ORDER BY b.criado_em ASC LIMIT 1;
    ELSE
      SELECT nome INTO v_bau_orig_nome FROM public.baus WHERE id = p_origin_bau_id;
    END IF;
    IF p_origin_bau_id IS NULL THEN
      RAISE EXCEPTION 'Baú de origem não especificado ou não encontrado.';
    END IF;
    v_orig_label := COALESCE(v_bau_orig_nome, 'Baú');

    SELECT COALESCE(quantidade, 0) INTO v_chest_orig_prev
    FROM public.product_baus
    WHERE product_id = p_product_id AND bau_id = p_origin_bau_id FOR UPDATE;
    IF NOT FOUND THEN v_chest_orig_prev := 0; END IF;
    v_chest_orig_new := v_chest_orig_prev;
  ELSIF p_origin = 'WAREHOUSE' THEN
    v_orig_label := 'Armazém';
  ELSIF p_origin = 'SALE' THEN
    v_orig_label := 'Disponível p/ Venda';
  ELSE
    RAISE EXCEPTION 'Origem inválida: %', p_origin;
  END IF;

  -- Se ação é TRANSFER, valida destino
  IF p_action = 'TRANSFER' THEN
    IF p_destination IS NULL THEN
      RAISE EXCEPTION 'Destino da transferência não informado.';
    END IF;

    IF p_destination = 'BAU' THEN
      IF p_destination_bau_id IS NULL THEN
        SELECT b.id, b.nome INTO p_destination_bau_id, v_bau_dest_nome FROM public.baus b WHERE b.ativo IS NOT FALSE AND (p_origin != 'BAU' OR b.id != p_origin_bau_id) ORDER BY b.criado_em ASC LIMIT 1;
      ELSE
        SELECT nome INTO v_bau_dest_nome FROM public.baus WHERE id = p_destination_bau_id;
      END IF;
      IF p_destination_bau_id IS NULL THEN
        RAISE EXCEPTION 'Baú de destino não especificado ou não encontrado.';
      END IF;
      v_dest_label := COALESCE(v_bau_dest_nome, 'Baú');

      IF p_origin = 'BAU' AND p_origin_bau_id = p_destination_bau_id THEN
        RAISE EXCEPTION 'O baú de destino deve ser diferente do baú de origem.';
      END IF;

      SELECT COALESCE(quantidade, 0) INTO v_chest_dest_prev
      FROM public.product_baus
      WHERE product_id = p_product_id AND bau_id = p_destination_bau_id FOR UPDATE;
      IF NOT FOUND THEN v_chest_dest_prev := 0; END IF;
      v_chest_dest_new := v_chest_dest_prev;
    ELSIF p_destination = 'WAREHOUSE' THEN
      v_dest_label := 'Armazém';
      IF p_origin = 'WAREHOUSE' THEN
        RAISE EXCEPTION 'Origem e destino não podem ser ambos Armazém.';
      END IF;
    ELSIF p_destination = 'SALE' THEN
      v_dest_label := 'Disponível p/ Venda';
      IF p_origin = 'SALE' THEN
        RAISE EXCEPTION 'Origem e destino não podem ser ambos Venda.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Destino inválido: %', p_destination;
    END IF;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
      RAISE EXCEPTION 'Informe uma quantidade válida para transferir.';
    END IF;

    -- Validação de saldo na origem
    IF p_origin = 'WAREHOUSE' AND v_wh_prev < p_quantity THEN
      RAISE EXCEPTION 'Saldo insuficiente no Armazém. Possui % e tentou transferir %.', v_wh_prev, p_quantity;
    ELSIF p_origin = 'SALE' AND v_sale_prev < p_quantity THEN
      RAISE EXCEPTION 'Saldo insuficiente em Vendas. Possui % e tentou transferir %.', v_sale_prev, p_quantity;
    ELSIF p_origin = 'BAU' AND v_chest_orig_prev < p_quantity THEN
      RAISE EXCEPTION 'Saldo insuficiente no %: possui % e tentou transferir %.', v_orig_label, v_chest_orig_prev, p_quantity;
    END IF;

    -- 1. DEBITA DA ORIGEM
    IF p_origin = 'WAREHOUSE' THEN
      v_wh_new := v_wh_prev - p_quantity;
    ELSIF p_origin = 'SALE' THEN
      v_sale_new := v_sale_prev - p_quantity;
    ELSIF p_origin = 'BAU' THEN
      v_chest_orig_new := v_chest_orig_prev - p_quantity;
    END IF;

    -- 2. CREDITA NO DESTINO
    IF p_destination = 'WAREHOUSE' THEN
      v_wh_new := v_wh_new + p_quantity;
    ELSIF p_destination = 'SALE' THEN
      v_sale_new := v_sale_new + p_quantity;
    ELSIF p_destination = 'BAU' THEN
      v_chest_dest_new := v_chest_dest_new + p_quantity;
    END IF;

  ELSIF p_action = 'REMOVE' THEN
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
      RAISE EXCEPTION 'Informe uma quantidade válida para remover.';
    END IF;

    -- Valida e debita
    IF p_origin = 'WAREHOUSE' THEN
      IF v_wh_prev < p_quantity THEN
        RAISE EXCEPTION 'Saldo insuficiente no Armazém para remover. Possui % e tentou remover %.', v_wh_prev, p_quantity;
      END IF;
      v_wh_new := v_wh_prev - p_quantity;
      v_dest_label := 'Descarte / Baixa Armazém';
    ELSIF p_origin = 'SALE' THEN
      IF v_sale_prev < p_quantity THEN
        RAISE EXCEPTION 'Saldo insuficiente em Vendas para remover. Possui % e tentou remover %.', v_sale_prev, p_quantity;
      END IF;
      v_sale_new := v_sale_prev - p_quantity;
      v_dest_label := 'Descarte / Baixa Vendas';
    ELSIF p_origin = 'BAU' THEN
      IF v_chest_orig_prev < p_quantity THEN
        RAISE EXCEPTION 'Saldo insuficiente no % para remover. Possui % e tentou remover %.', v_orig_label, v_chest_orig_prev, p_quantity;
      END IF;
      v_chest_orig_new := v_chest_orig_prev - p_quantity;
      v_dest_label := 'Descarte / Baixa ' || v_orig_label;
    END IF;

  ELSIF p_action = 'ADJUST' THEN
    IF p_quantity IS NULL OR p_quantity < 0 THEN
      RAISE EXCEPTION 'O novo saldo deve ser maior ou igual a zero.';
    END IF;

    IF p_origin = 'WAREHOUSE' THEN
      v_wh_new := p_quantity;
      v_dest_label := 'Ajuste Direto Armazém';
    ELSIF p_origin = 'SALE' THEN
      v_sale_new := p_quantity;
      v_dest_label := 'Ajuste Direto Vendas';
    ELSIF p_origin = 'BAU' THEN
      v_chest_orig_new := p_quantity;
      v_dest_label := 'Ajuste Direto ' || v_orig_label;
    END IF;
  ELSE
    RAISE EXCEPTION 'Ação desconhecida: %', p_action;
  END IF;

  -- EFETIVAÇÃO DAS MUDANÇAS NO BANCO:
  -- A. Armazém
  IF v_wh_new != v_wh_prev THEN
    UPDATE public.warehouse_stock
    SET quantity = v_wh_new, updated_at = now()
    WHERE product_id = p_product_id;

    INSERT INTO public.warehouse_movements (
      product_id, type, quantity, previous_balance, resulting_balance,
      source, destination, user_id, observation
    ) VALUES (
      p_product_id,
      CASE
        WHEN p_action = 'ADJUST' THEN 'MANUAL_ADJUSTMENT'
        WHEN p_action = 'REMOVE' THEN 'DISCARD_REMOVAL'
        WHEN p_destination = 'WAREHOUSE' THEN 'RETURN_TO_WAREHOUSE'
        ELSE 'TRANSFER_OUT'
      END,
      ABS(v_wh_new - v_wh_prev),
      v_wh_prev,
      v_wh_new,
      v_orig_label,
      v_dest_label,
      v_caller_id,
      p_reason
    );
  END IF;

  -- B. Vendas
  IF v_sale_new != v_sale_prev THEN
    UPDATE public.products
    SET sale_available_quantity = v_sale_new, updated_at = now()
    WHERE id = p_product_id;

    INSERT INTO public.product_sale_stock (product_id, quantity)
    VALUES (p_product_id, v_sale_new)
    ON CONFLICT (product_id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now();
  END IF;

  -- C. Baú de Origem
  IF p_origin = 'BAU' AND v_chest_orig_new != v_chest_orig_prev THEN
    INSERT INTO public.product_baus (product_id, bau_id, quantidade)
    VALUES (p_product_id, p_origin_bau_id, v_chest_orig_new)
    ON CONFLICT (product_id, bau_id) DO UPDATE SET quantidade = EXCLUDED.quantidade, updated_at = now();

    UPDATE public.products
    SET estoque_atual = GREATEST(0, COALESCE(estoque_atual, 0) - (v_chest_orig_prev - v_chest_orig_new)),
        updated_at = now()
    WHERE id = p_product_id;

    INSERT INTO public.movements (
      product_id, type, quantity, reason, user_id, bau_id
    ) VALUES (
      p_product_id, 'saida', (v_chest_orig_prev - v_chest_orig_new),
      COALESCE(p_reason, p_action || ' de estoque para ' || v_dest_label),
      v_caller_id, p_origin_bau_id
    );
  END IF;

  -- D. Baú de Destino (se houver transferência)
  IF p_action = 'TRANSFER' AND p_destination = 'BAU' AND v_chest_dest_new != v_chest_dest_prev THEN
    INSERT INTO public.product_baus (product_id, bau_id, quantidade)
    VALUES (p_product_id, p_destination_bau_id, v_chest_dest_new)
    ON CONFLICT (product_id, bau_id) DO UPDATE SET quantidade = EXCLUDED.quantidade, updated_at = now();

    UPDATE public.products
    SET estoque_atual = COALESCE(estoque_atual, 0) + (v_chest_dest_new - v_chest_dest_prev),
        updated_at = now()
    WHERE id = p_product_id;

    INSERT INTO public.movements (
      product_id, type, quantity, reason, user_id, bau_id
    ) VALUES (
      p_product_id, 'entrada', (v_chest_dest_new - v_chest_dest_prev),
      COALESCE(p_reason, 'Transferência de estoque recebida de ' || v_orig_label),
      v_caller_id, p_destination_bau_id
    );
  END IF;

  -- Auditoria Geral
  INSERT INTO public.audit_logs (
    user_id, action, entity, entity_id, new_data
  ) VALUES (
    v_caller_id,
    'manage_production_stock',
    'products',
    p_product_id,
    jsonb_build_object(
      'product_name', v_prod.nome,
      'action', p_action,
      'origin', p_origin,
      'destination', p_destination,
      'origin_bau_id', p_origin_bau_id,
      'destination_bau_id', p_destination_bau_id,
      'quantity', p_quantity,
      'warehouse_balance', v_wh_new,
      'sale_balance', v_sale_new,
      'reason', p_reason
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'action', p_action,
    'warehouse_balance', v_wh_new,
    'sale_balance', v_sale_new,
    'chest_orig_balance', v_chest_orig_new,
    'chest_dest_balance', v_chest_dest_new
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.manage_production_stock_rpc(uuid, text, text, text, uuid, uuid, numeric, text) TO authenticated;
