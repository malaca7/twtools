-- ==============================================================================
-- MIGRATION: VALIDAR QUANTIDADE MÚLTIPLO DO RENDIMENTO NA PRODUÇÃO
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.execute_production_rpc(
  p_product_id uuid,
  p_quantity numeric,
  p_raw_materials jsonb,
  p_observation text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_prod record;
  v_item jsonb;
  v_mat_id uuid;
  v_qty_used numeric;
  v_mat record;
  v_production_id uuid;
  v_wh_prev numeric := 0;
  v_wh_new numeric := 0;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  IF NOT public.can_operate(v_caller_id) THEN
    RAISE EXCEPTION 'Seu nível ou cargo não possui permissão para executar produções.';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'A quantidade produzida deve ser maior que zero.';
  END IF;

  -- 1. Validar e travar o Produto
  SELECT * INTO v_prod FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado.';
  END IF;

  IF v_prod.ativo IS NOT TRUE THEN
    RAISE EXCEPTION 'Produto "%" está inativo no catálogo.', v_prod.nome;
  END IF;

  IF v_prod.can_be_produced IS NOT TRUE THEN
    RAISE EXCEPTION 'Produto "%" não está habilitado para ser produzido.', v_prod.nome;
  END IF;

  -- Validar se a quantidade a produzir é um múltiplo do rendimento gerado por receita
  IF COALESCE(v_prod.production_yield, 1) > 0 THEN
    IF MOD(p_quantity, v_prod.production_yield) <> 0 THEN
      RAISE EXCEPTION 'A quantidade a fabricar (%) deve ser um múltiplo do rendimento da receita (% % por ciclo).',
        p_quantity, v_prod.production_yield, COALESCE(v_prod.unidade, 'un');
    END IF;
  END IF;

  IF p_raw_materials IS NULL OR jsonb_array_length(p_raw_materials) = 0 THEN
    RAISE EXCEPTION 'É necessário informar ao menos uma matéria-prima utilizada na produção.';
  END IF;

  -- 2. Criar registro mestre de Produção
  INSERT INTO public.productions (
    product_id,
    quantity,
    user_id,
    observation,
    status
  ) VALUES (
    p_product_id,
    p_quantity,
    v_caller_id,
    p_observation,
    'COMPLETED'
  ) RETURNING id INTO v_production_id;

  -- 3. Validar e deduzir cada matéria-prima com Lock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_raw_materials)
  LOOP
    v_mat_id := (v_item->>'raw_material_id')::uuid;
    v_qty_used := COALESCE((v_item->>'quantity_used')::numeric, 0);

    IF v_mat_id IS NULL THEN
      RAISE EXCEPTION 'ID de matéria-prima inválido.';
    END IF;

    IF v_qty_used <= 0 THEN
      RAISE EXCEPTION 'Quantidade de matéria-prima utilizada deve ser maior que zero.';
    END IF;

    SELECT * INTO v_mat FROM public.raw_materials WHERE id = v_mat_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Matéria-prima não encontrada (ID: %).', v_mat_id;
    END IF;

    IF v_mat.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Matéria-prima "%" está inativa.', v_mat.name;
    END IF;

    IF v_mat.stock_quantity < v_qty_used THEN
      RAISE EXCEPTION 'Estoque insuficiente de "%": disponível %, necessário %.',
        v_mat.name, v_mat.stock_quantity, v_qty_used;
    END IF;

    -- Deduzir estoque da matéria-prima
    UPDATE public.raw_materials
    SET stock_quantity = stock_quantity - v_qty_used,
        updated_at = now()
    WHERE id = v_mat_id;

    -- Registrar consumo na produção
    INSERT INTO public.production_raw_materials (
      production_id,
      raw_material_id,
      quantity_used
    ) VALUES (
      v_production_id,
      v_mat_id,
      v_qty_used
    );

    -- Registrar histórico da movimentação de matéria-prima
    INSERT INTO public.raw_material_movements (
      raw_material_id,
      type,
      quantity,
      previous_balance,
      resulting_balance,
      production_id,
      user_id,
      observation
    ) VALUES (
      v_mat_id,
      'CONSUMPTION',
      -v_qty_used,
      v_mat.stock_quantity,
      v_mat.stock_quantity - v_qty_used,
      v_production_id,
      v_caller_id,
      'Consumo na produção #' || substr(v_production_id::text, 1, 8) || ' (' || p_quantity || 'x ' || v_prod.nome || ')'
    );
  END LOOP;

  -- 4. Entrada no Armazém
  -- Trava ou cria registro no armazém
  SELECT quantity INTO v_wh_prev FROM public.warehouse_stock WHERE product_id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    v_wh_prev := 0;
    INSERT INTO public.warehouse_stock (product_id, quantity)
    VALUES (p_product_id, p_quantity)
    RETURNING quantity INTO v_wh_new;
  ELSE
    v_wh_new := v_wh_prev + p_quantity;
    UPDATE public.warehouse_stock
    SET quantity = v_wh_new,
        updated_at = now()
    WHERE product_id = p_product_id;
  END IF;

  -- 5. Registrar Movimentação do Armazém
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
    p_product_id,
    'PRODUCTION',
    p_quantity,
    v_wh_prev,
    v_wh_new,
    'PRODUÇÃO',
    'ARMAZÉM',
    v_production_id,
    v_caller_id,
    COALESCE(p_observation, 'Lote finalizado com sucesso')
  );

  -- 6. Log de Auditoria
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    new_data
  ) VALUES (
    v_caller_id,
    'create_production',
    'productions',
    v_production_id,
    jsonb_build_object(
      'product_id', p_product_id,
      'product_name', v_prod.nome,
      'quantity', p_quantity,
      'resulting_warehouse_balance', v_wh_new
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'production_id', v_production_id,
    'quantity', p_quantity,
    'product_name', v_prod.nome,
    'warehouse_balance', v_wh_new
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_production_rpc(uuid, numeric, jsonb, text) TO authenticated;
