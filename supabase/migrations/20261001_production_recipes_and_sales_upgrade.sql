-- ==============================================================================
-- MIGRATION: RECEITAS DE PRODUÇÃO, FOTO/GESTÃO DE MATÉRIAS-PRIMAS E MULTI-VENDAS
-- ==============================================================================

-- 1. TABELA DE RECEITAS DE PRODUTOS (PRODUCT RECIPES) & RENDIMENTO
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS production_yield numeric NOT NULL DEFAULT 1 CHECK (production_yield > 0);

CREATE TABLE IF NOT EXISTS public.product_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE CASCADE,
  quantity_required numeric NOT NULL CHECK (quantity_required > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_recipe_item UNIQUE (product_id, raw_material_id)
);

CREATE INDEX IF NOT EXISTS idx_product_recipes_product ON public.product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_material ON public.product_recipes(raw_material_id);

ALTER TABLE public.product_recipes DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.product_recipes TO authenticated, anon, service_role;

-- RPC para salvar receita completa de um produto
CREATE OR REPLACE FUNCTION public.save_product_recipe(
  p_product_id uuid,
  p_production_yield numeric,
  p_items jsonb -- array of { raw_material_id: uuid, quantity_required: numeric }
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_yield numeric := COALESCE(p_production_yield, 1);
  v_item jsonb;
  v_mat_id uuid;
  v_qty numeric;
  v_count int := 0;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  IF NOT (public.can_operate(v_caller_id)) THEN
    RAISE EXCEPTION 'Permissão negada para configurar receitas de produção.';
  END IF;

  IF v_yield <= 0 THEN
    v_yield := 1;
  END IF;

  -- 1. Atualizar rendimento no produto
  UPDATE public.products
  SET production_yield = v_yield,
      updated_at = now()
  WHERE id = p_product_id;

  -- 2. Limpar itens antigos da receita
  DELETE FROM public.product_recipes WHERE product_id = p_product_id;

  -- 3. Inserir novos itens da receita
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_mat_id := (v_item->>'raw_material_id')::uuid;
      v_qty := (v_item->>'quantity_required')::numeric;

      IF v_mat_id IS NOT NULL AND v_qty IS NOT NULL AND v_qty > 0 THEN
        INSERT INTO public.product_recipes (product_id, raw_material_id, quantity_required)
        VALUES (p_product_id, v_mat_id, v_qty)
        ON CONFLICT (product_id, raw_material_id)
        DO UPDATE SET quantity_required = EXCLUDED.quantity_required, updated_at = now();

        v_count := v_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'production_yield', v_yield,
    'items_count', v_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_product_recipe(uuid, numeric, jsonb) TO authenticated, anon, service_role;


-- 2. ATUALIZAÇÃO DE MATÉRIAS-PRIMAS: FOTO, AJUSTE SEM MOTIVO OBRIGATÓRIO, E EXCLUSÃO
ALTER TABLE public.raw_materials 
ADD COLUMN IF NOT EXISTS image_url text;

-- Atualizar adjust_raw_material_stock_rpc para não exigir motivo obrigatório
CREATE OR REPLACE FUNCTION public.adjust_raw_material_stock_rpc(
  p_raw_material_id uuid, 
  p_quantity_delta numeric, 
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid := auth.uid();
  v_mat record;
  v_prev numeric;
  v_new numeric;
  v_type text;
  v_final_reason text;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  IF NOT (public.can_operate(v_caller_id) OR public.is_manager(v_caller_id)) THEN
    RAISE EXCEPTION 'Apenas gerentes ou administradores podem ajustar estoque de matéria-prima.';
  END IF;

  IF p_quantity_delta IS NULL OR p_quantity_delta = 0 THEN
    RAISE EXCEPTION 'A variação de quantidade não pode ser zero.';
  END IF;

  v_final_reason := COALESCE(NULLIF(trim(p_reason), ''), 'Ajuste manual de estoque');

  SELECT * INTO v_mat FROM public.raw_materials WHERE id = p_raw_material_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matéria-prima não encontrada.';
  END IF;

  v_prev := v_mat.stock_quantity;
  v_new := v_prev + p_quantity_delta;

  IF v_new < 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente: saldo atual % e ajuste solicitado %.', v_prev, p_quantity_delta;
  END IF;

  UPDATE public.raw_materials
  SET stock_quantity = v_new,
      updated_at = now()
  WHERE id = p_raw_material_id;

  v_type := CASE WHEN p_quantity_delta > 0 THEN 'ENTRY' ELSE 'ADJUSTMENT' END;

  INSERT INTO public.raw_material_movements (
    raw_material_id,
    type,
    quantity,
    previous_balance,
    resulting_balance,
    user_id,
    observation
  ) VALUES (
    p_raw_material_id,
    v_type,
    p_quantity_delta,
    v_prev,
    v_new,
    v_caller_id,
    v_final_reason
  );

  INSERT INTO public.audit_logs (
    user_id, action, entity, entity_id, old_data, new_data
  ) VALUES (
    v_caller_id,
    'adjust_raw_material_stock',
    'raw_materials',
    p_raw_material_id,
    jsonb_build_object('previous', v_prev),
    jsonb_build_object('new', v_new, 'delta', p_quantity_delta, 'reason', v_final_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous', v_prev,
    'new_balance', v_new
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.adjust_raw_material_stock_rpc(uuid, numeric, text) TO authenticated, anon, service_role;

-- Função para exclusão segura de matéria-prima
CREATE OR REPLACE FUNCTION public.delete_raw_material_rpc(p_raw_material_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_mat_name text;
  v_used_in_prod boolean := false;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  IF NOT (public.can_operate(v_caller_id) OR public.is_manager(v_caller_id)) THEN
    RAISE EXCEPTION 'Permissão negada para excluir matérias-primas.';
  END IF;

  SELECT name INTO v_mat_name FROM public.raw_materials WHERE id = p_raw_material_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Matéria-prima não encontrada.';
  END IF;

  -- Remove de receitas existentes
  DELETE FROM public.product_recipes WHERE raw_material_id = p_raw_material_id;

  -- Verifica se tem histórico em produções passadas
  SELECT EXISTS (
    SELECT 1 FROM public.production_raw_materials WHERE raw_material_id = p_raw_material_id
  ) INTO v_used_in_prod;

  IF v_used_in_prod THEN
    -- Desativa para preservar histórico contábil
    UPDATE public.raw_materials SET is_active = false, updated_at = now() WHERE id = p_raw_material_id;
    RETURN jsonb_build_object('success', true, 'action', 'deactivated', 'message', 'Matéria-prima desativada pois possui histórico em produções passadas.');
  ELSE
    DELETE FROM public.raw_material_movements WHERE raw_material_id = p_raw_material_id;
    DELETE FROM public.raw_materials WHERE id = p_raw_material_id;
    RETURN jsonb_build_object('success', true, 'action', 'deleted', 'message', 'Matéria-prima excluída com sucesso.');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_raw_material_rpc(uuid) TO authenticated, anon, service_role;


-- 3. ATUALIZAÇÃO DE VENDAS: DESCONTO, FORMAS DE PAGAMENTO E MULTI-PRODUTOS
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS group_id uuid;

CREATE INDEX IF NOT EXISTS idx_sales_group ON public.sales(group_id);

-- Atualiza create_sale para suportar desconto e novas formas de pagamento
CREATE OR REPLACE FUNCTION public.create_sale(
  _product_id uuid, 
  _quantity numeric, 
  _unit_price numeric, 
  _buyer_name text, 
  _payment_method text DEFAULT 'dinheiro'::text, 
  _notes text DEFAULT NULL::text,
  _discount numeric DEFAULT 0,
  _group_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _sale_id uuid;
  _discount numeric := GREATEST(0, COALESCE(_discount, 0));
  _subtotal numeric;
  _total numeric;
  _prod record;
  _sale_prev numeric;
  _sale_new numeric;
  _final_buyer text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.can_operate(_uid) THEN RAISE EXCEPTION 'Seu nível não permite registrar vendas'; END IF;
  IF _quantity IS NULL OR _quantity <= 0 THEN RAISE EXCEPTION 'A quantidade deve ser maior que zero'; END IF;
  IF _unit_price IS NULL OR _unit_price < 0 THEN RAISE EXCEPTION 'Valor unitário inválido'; END IF;

  -- 1. Validar produto e disponibilidade para venda com Lock
  SELECT * INTO _prod FROM public.products WHERE id = _product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;

  IF _prod.ativo IS NOT TRUE THEN
    RAISE EXCEPTION 'Produto inativo';
  END IF;

  IF _prod.can_be_sold IS NOT TRUE THEN
    RAISE EXCEPTION 'Este produto não está liberado para venda no momento.';
  END IF;

  _sale_prev := COALESCE(_prod.sale_available_quantity, _prod.estoque_atual, 0);

  IF _sale_prev < _quantity THEN
    RAISE EXCEPTION 'Estoque disponível para venda insuficiente: disponível % e solicitado %.', _sale_prev, _quantity;
  END IF;

  _sale_new := _sale_prev - _quantity;
  _subtotal := _quantity * _unit_price;
  _total := GREATEST(0, _subtotal - _discount);
  _final_buyer := COALESCE(NULLIF(trim(_buyer_name),''), 'Não informado');

  -- 2. Atualizar saldo disponível para venda
  UPDATE public.products
  SET sale_available_quantity = _sale_new,
      updated_at = now()
  WHERE id = _product_id;

  -- Sincronizar product_sale_stock
  UPDATE public.product_sale_stock
  SET quantity = _sale_new,
      updated_at = now()
  WHERE product_id = _product_id;

  -- 3. Inserir a venda
  INSERT INTO public.sales (
    product_id, seller_id, buyer_name, quantity, unit_price, total_price, payment_method, notes, discount, group_id
  ) VALUES (
    _product_id, _uid, _final_buyer, _quantity, _unit_price, _total, _payment_method, _notes, _discount, _group_id
  ) RETURNING id INTO _sale_id;

  -- 4. Registrar saída no estoque físico tradicional
  PERFORM public.register_movement(_product_id, 'saida', _quantity, 'Venda registrada', _sale_id, NULL);

  -- 5. Registrar movimentação no histórico do Armazém / Venda
  INSERT INTO public.warehouse_movements (
    product_id,
    type,
    quantity,
    previous_balance,
    resulting_balance,
    source,
    destination,
    reference_id,
    user_id,
    observation
  ) VALUES (
    _product_id,
    'SALE',
    _quantity,
    _sale_prev,
    _sale_new,
    'DISPONÍVEL PARA VENDA',
    'CLIENTE: ' || _final_buyer,
    _sale_id,
    _uid,
    'Venda #' || substr(_sale_id::text, 1, 8) || ' (' || _payment_method || ')' || CASE WHEN _discount > 0 THEN ' [Desc: R$ ' || _discount || ']' ELSE '' END
  );

  -- 6. Log de auditoria
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (_uid, 'create_sale', 'sales', _sale_id, jsonb_build_object(
    'product_id', _product_id,
    'product_name', _prod.nome,
    'quantity', _quantity,
    'unit_price', _unit_price,
    'subtotal', _subtotal,
    'discount', _discount,
    'total', _total,
    'buyer', _final_buyer,
    'payment_method', _payment_method,
    'group_id', _group_id,
    'sale_available_new', _sale_new
  ));

  RETURN _sale_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_sale(uuid, numeric, numeric, text, text, text, numeric, uuid) TO authenticated, anon, service_role;


-- RPC para criar venda com múltiplos produtos e desconto global/por item
CREATE OR REPLACE FUNCTION public.create_multi_sale(
  p_items jsonb, -- array of { product_id: uuid, quantity: numeric, unit_price: numeric, discount?: numeric }
  p_buyer_name text,
  p_payment_method text DEFAULT 'dinheiro',
  p_notes text DEFAULT NULL,
  p_total_discount numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_group_id uuid := gen_random_uuid();
  v_item jsonb;
  v_prod_id uuid;
  v_qty numeric;
  v_price numeric;
  v_item_disc numeric;
  v_subtotal numeric;
  v_items_count int := 0;
  v_total_subtotal numeric := 0;
  v_total_items_disc numeric := 0;
  v_sale_ids uuid[] := ARRAY[]::uuid[];
  v_created_sale_id uuid;
  v_global_discount numeric := GREATEST(0, COALESCE(p_total_discount, 0));
  v_remaining_global_disc numeric := v_global_discount;
  v_item_allocated_disc numeric;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado.';
  END IF;

  IF NOT public.can_operate(v_caller_id) THEN
    RAISE EXCEPTION 'Seu nível não permite registrar vendas.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Informe ao menos um produto para registrar a venda.';
  END IF;

  -- Calcular subtotal total para rateio do desconto global proporcional (se houver)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::numeric;
    v_price := (v_item->>'unit_price')::numeric;
    IF v_qty IS NOT NULL AND v_qty > 0 AND v_price IS NOT NULL AND v_price >= 0 THEN
      v_total_subtotal := v_total_subtotal + (v_qty * v_price);
    END IF;
  END LOOP;

  -- Processar cada item da venda
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::numeric;
    v_price := (v_item->>'unit_price')::numeric;
    v_item_disc := GREATEST(0, COALESCE((v_item->>'discount')::numeric, 0));
    v_subtotal := v_qty * v_price;

    -- Ratear desconto global se fornecido
    IF v_global_discount > 0 AND v_total_subtotal > 0 THEN
      v_item_allocated_disc := round((v_subtotal / v_total_subtotal) * v_global_discount, 2);
      IF v_item_allocated_disc > v_remaining_global_disc THEN
        v_item_allocated_disc := v_remaining_global_disc;
      END IF;
      v_remaining_global_disc := v_remaining_global_disc - v_item_allocated_disc;
      v_item_disc := v_item_disc + v_item_allocated_disc;
    END IF;

    -- Chama a lógica individual com group_id
    v_created_sale_id := public.create_sale(
      v_prod_id,
      v_qty,
      v_price,
      p_buyer_name,
      p_payment_method,
      p_notes,
      v_item_disc,
      v_group_id
    );

    v_sale_ids := array_append(v_sale_ids, v_created_sale_id);
    v_items_count := v_items_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'group_id', v_group_id,
    'items_count', v_items_count,
    'sale_ids', v_sale_ids
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_multi_sale(jsonb, text, text, text, numeric) TO authenticated, anon, service_role;
