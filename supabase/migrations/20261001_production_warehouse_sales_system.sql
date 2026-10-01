-- ==============================================================================
-- MIGRAÇÃO: SISTEMA COMPLETO DE PRODUÇÃO, ARMAZÉM E VENDAS (TWTOOLS)
-- ==============================================================================

-- 1. ATUALIZAÇÃO DA TABELA PRODUCTS COM CONTROLES DE PRODUÇÃO E VENDA
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS can_be_produced boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_be_sold boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sale_available_quantity numeric NOT NULL DEFAULT 0 CHECK (sale_available_quantity >= 0);

-- Inicializa sale_available_quantity com estoque_atual caso seja zero para produtos existentes que já possuam estoque
UPDATE public.products 
SET sale_available_quantity = estoque_atual 
WHERE sale_available_quantity = 0 AND estoque_atual > 0;

-- 2. TABELA DE MATÉRIAS-PRIMAS (RAW MATERIALS)
CREATE TABLE IF NOT EXISTS public.raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  unit text NOT NULL DEFAULT 'un',
  stock_quantity numeric NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raw_materials_active ON public.raw_materials(is_active);
CREATE INDEX IF NOT EXISTS idx_raw_materials_name ON public.raw_materials(name);

-- Trigger updated_at para raw_materials
DROP TRIGGER IF EXISTS trg_raw_materials_updated ON public.raw_materials;
CREATE TRIGGER trg_raw_materials_updated 
  BEFORE UPDATE ON public.raw_materials 
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3. TABELA DE PRODUÇÕES (PRODUCTIONS)
CREATE TABLE IF NOT EXISTS public.productions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  user_id uuid NOT NULL,
  observation text,
  status text NOT NULL DEFAULT 'COMPLETED', -- 'COMPLETED', 'CANCELLED'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_productions_product ON public.productions(product_id);
CREATE INDEX IF NOT EXISTS idx_productions_user ON public.productions(user_id);
CREATE INDEX IF NOT EXISTS idx_productions_created ON public.productions(created_at DESC);

DROP TRIGGER IF EXISTS trg_productions_updated ON public.productions;
CREATE TRIGGER trg_productions_updated 
  BEFORE UPDATE ON public.productions 
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. TABELA DE CONSUMO DE MATÉRIAS-PRIMAS DA PRODUÇÃO
CREATE TABLE IF NOT EXISTS public.production_raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id uuid NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  quantity_used numeric NOT NULL CHECK (quantity_used > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prm_production ON public.production_raw_materials(production_id);
CREATE INDEX IF NOT EXISTS idx_prm_material ON public.production_raw_materials(raw_material_id);

-- 5. TABELA DE ARMAZÉM (WAREHOUSE STOCK - SALDO DOS PRODUTOS PRODUZIDOS)
CREATE TABLE IF NOT EXISTS public.warehouse_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_stock_product ON public.warehouse_stock(product_id);

DROP TRIGGER IF EXISTS trg_warehouse_stock_updated ON public.warehouse_stock;
CREATE TRIGGER trg_warehouse_stock_updated 
  BEFORE UPDATE ON public.warehouse_stock 
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6. TABELA DE DISPONIBILIDADE PARA VENDA (PRODUCT SALE STOCK - ESPELHO ESTRUTURAL)
CREATE TABLE IF NOT EXISTS public.product_sale_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_sale_stock_prod ON public.product_sale_stock(product_id);

DROP TRIGGER IF EXISTS trg_product_sale_stock_updated ON public.product_sale_stock;
CREATE TRIGGER trg_product_sale_stock_updated 
  BEFORE UPDATE ON public.product_sale_stock 
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Sincroniza tabela product_sale_stock com products.sale_available_quantity
INSERT INTO public.product_sale_stock (product_id, quantity)
SELECT id, sale_available_quantity FROM public.products
ON CONFLICT (product_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 7. TABELA DE MOVIMENTAÇÕES DO ARMAZÉM (WAREHOUSE MOVEMENTS)
CREATE TABLE IF NOT EXISTS public.warehouse_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  type text NOT NULL, -- 'PRODUCTION', 'TRANSFER_TO_STORAGE', 'TRANSFER_TO_SALE', 'SALE', 'SALE_CANCEL', 'STOCK_ADJUSTMENT'
  quantity numeric NOT NULL CHECK (quantity > 0),
  previous_balance numeric NOT NULL DEFAULT 0,
  resulting_balance numeric NOT NULL DEFAULT 0,
  source text,
  destination text,
  reference_id uuid,
  user_id uuid NOT NULL,
  observation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wm_product ON public.warehouse_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_wm_type ON public.warehouse_movements(type);
CREATE INDEX IF NOT EXISTS idx_wm_user ON public.warehouse_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_wm_created ON public.warehouse_movements(created_at DESC);

-- 8. TABELA DE MOVIMENTAÇÕES DE MATÉRIA-PRIMA (RAW MATERIAL MOVEMENTS)
CREATE TABLE IF NOT EXISTS public.raw_material_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id uuid NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  type text NOT NULL, -- 'ENTRY', 'CONSUMPTION', 'ADJUSTMENT'
  quantity numeric NOT NULL, -- positivo ou negativo
  previous_balance numeric NOT NULL DEFAULT 0,
  resulting_balance numeric NOT NULL DEFAULT 0,
  production_id uuid REFERENCES public.productions(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  observation text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rmm_material ON public.raw_material_movements(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_rmm_created ON public.raw_material_movements(created_at DESC);

-- 9. PERMISSÕES E RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.raw_materials TO authenticated;
GRANT ALL ON public.raw_materials TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.productions TO authenticated;
GRANT ALL ON public.productions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_raw_materials TO authenticated;
GRANT ALL ON public.production_raw_materials TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouse_stock TO authenticated;
GRANT ALL ON public.warehouse_stock TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_sale_stock TO authenticated;
GRANT ALL ON public.product_sale_stock TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouse_movements TO authenticated;
GRANT ALL ON public.warehouse_movements TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.raw_material_movements TO authenticated;
GRANT ALL ON public.raw_material_movements TO service_role;

-- RLS desabilitado ou liberado para authenticated para controle centralizado pelas RPCs e Guards
ALTER TABLE public.raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.productions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sale_stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_material_movements DISABLE ROW LEVEL SECURITY;

-- 10. REALTIME PUBLICATION
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.raw_materials, 
      public.productions, 
      public.warehouse_stock, 
      public.warehouse_movements;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 11. INSERIR MATÉRIAS-PRIMAS INICIAIS (SEED) SE A TABELA ESTIVER VAZIA
INSERT INTO public.raw_materials (name, description, unit, stock_quantity, is_active)
SELECT * FROM (VALUES
  ('Aço Refinado', 'Metal de alta resistência para armamentos pesados e peças automotivas', 'kg', 500::numeric, true),
  ('Pólvora Negra', 'Composto propelente para munições e explosivos controlados', 'kg', 300::numeric, true),
  ('Polímero Tático', 'Material sintético leve para coronhas, empunhaduras e coletes', 'kg', 250::numeric, true),
  ('Pasta Base', 'Matéria-prima bruta para refino de substâncias químicas', 'g', 1000::numeric, true),
  ('Querosene Técnico', 'Solvente destilado de pureza química para síntese', 'L', 200::numeric, true),
  ('Embalagem a Vácuo', 'Pacotes vedados à prova d''água e com proteção térmica', 'un', 1500::numeric, true),
  ('Fios de Cobre', 'Fiação de alta condutividade para módulos de ignição e rádios', 'm', 400::numeric, true),
  ('Fibra Balística', 'Tecido reforçado para forração de blindagem corporal e coletes', 'm²', 150::numeric, true)
) AS v(name, description, unit, stock_quantity, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.raw_materials LIMIT 1);

-- Garante que todos os produtos tenham um registro em warehouse_stock
INSERT INTO public.warehouse_stock (product_id, quantity)
SELECT id, 0 FROM public.products
ON CONFLICT (product_id) DO NOTHING;


-- ==============================================================================
-- 12. RPCs SEGURAS DE TRANSAÇÃO DO MÓDULO DE PRODUÇÃO E ARMAZÉM
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- RPC 1: EXECUÇÃO DE PRODUÇÃO
-- ------------------------------------------------------------------------------
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


-- ------------------------------------------------------------------------------
-- RPC 2: TRANSFERIR DO ARMAZÉM PARA BAÚ/ESTOQUE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_warehouse_to_storage_rpc(
  p_product_id uuid,
  p_quantity numeric,
  p_bau_id uuid DEFAULT NULL,
  p_observation text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_wh_prev numeric;
  v_wh_new numeric;
  v_prod record;
  v_bau_nome text := 'Estoque Geral';
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  IF NOT public.can_operate(v_caller_id) THEN
    RAISE EXCEPTION 'Permissão negada para transferir do armazém para baú.';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'A quantidade a transferir deve ser maior que zero.';
  END IF;

  -- 1. Trava Armazém
  SELECT quantity INTO v_wh_prev FROM public.warehouse_stock WHERE product_id = p_product_id FOR UPDATE;
  IF NOT FOUND OR v_wh_prev IS NULL THEN
    RAISE EXCEPTION 'Produto não possui registro no armazém.';
  END IF;

  IF v_wh_prev < p_quantity THEN
    RAISE EXCEPTION 'Saldo insuficiente no armazém: possui % e tentou transferir %.', v_wh_prev, p_quantity;
  END IF;

  v_wh_new := v_wh_prev - p_quantity;

  -- Atualiza saldo do armazém
  UPDATE public.warehouse_stock
  SET quantity = v_wh_new,
      updated_at = now()
  WHERE product_id = p_product_id;

  -- 2. Atualiza estoque no Baú/Produto
  SELECT * INTO v_prod FROM public.products WHERE id = p_product_id FOR UPDATE;

  IF p_bau_id IS NOT NULL THEN
    SELECT nome INTO v_bau_nome FROM public.baus WHERE id = p_bau_id;
    IF v_bau_nome IS NULL THEN v_bau_nome := 'Baú'; END IF;

    -- Atualiza ou insere na tabela product_baus
    INSERT INTO public.product_baus (product_id, bau_id, quantidade)
    VALUES (p_product_id, p_bau_id, p_quantity)
    ON CONFLICT (product_id, bau_id) 
    DO UPDATE SET quantidade = public.product_baus.quantidade + EXCLUDED.quantidade, updated_at = now();
  END IF;

  -- Credita no estoque geral de products
  PERFORM public.register_movement(
    p_product_id,
    'entrada',
    p_quantity,
    'Transferência do Armazém para ' || v_bau_nome || COALESCE(': ' || p_observation, ''),
    NULL,
    NULL
  );

  -- 3. Registra movimentação do Armazém
  INSERT INTO public.warehouse_movements (
    product_id,
    type,
    quantity,
    previous_balance,
    resulting_balance,
    source,
    destination,
    user_id,
    observation
  ) VALUES (
    p_product_id,
    'TRANSFER_TO_STORAGE',
    p_quantity,
    v_wh_prev,
    v_wh_new,
    'ARMAZÉM',
    v_bau_nome,
    v_caller_id,
    p_observation
  );

  -- 4. Auditoria
  INSERT INTO public.audit_logs (
    user_id, action, entity, entity_id, new_data
  ) VALUES (
    v_caller_id,
    'warehouse_transfer_storage',
    'warehouse_stock',
    p_product_id,
    jsonb_build_object(
      'quantity', p_quantity,
      'bau_id', p_bau_id,
      'destination', v_bau_nome,
      'new_warehouse_balance', v_wh_new
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'transferred', p_quantity,
    'warehouse_balance', v_wh_new,
    'destination', v_bau_nome
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.transfer_warehouse_to_storage_rpc(uuid, numeric, uuid, text) TO authenticated;


-- ------------------------------------------------------------------------------
-- RPC 3: TRANSFERIR DO ARMAZÉM PARA VENDA
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_warehouse_to_sale_rpc(
  p_product_id uuid,
  p_quantity numeric,
  p_observation text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_wh_prev numeric;
  v_wh_new numeric;
  v_prod record;
  v_sale_prev numeric;
  v_sale_new numeric;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  IF NOT public.can_operate(v_caller_id) THEN
    RAISE EXCEPTION 'Permissão negada para transferir do armazém para venda.';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'A quantidade a transferir deve ser maior que zero.';
  END IF;

  -- 1. Validar Produto
  SELECT * INTO v_prod FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado.';
  END IF;

  IF v_prod.ativo IS NOT TRUE THEN
    RAISE EXCEPTION 'Produto "%" está inativo.', v_prod.nome;
  END IF;

  IF v_prod.can_be_sold IS NOT TRUE THEN
    RAISE EXCEPTION 'Produto "%" não está habilitado para venda. Ative a opção nas configurações de produto.', v_prod.nome;
  END IF;

  -- 2. Validar e Travar Saldo do Armazém
  SELECT quantity INTO v_wh_prev FROM public.warehouse_stock WHERE product_id = p_product_id FOR UPDATE;
  IF NOT FOUND OR v_wh_prev IS NULL THEN
    RAISE EXCEPTION 'Produto não possui registro de saldo no armazém.';
  END IF;

  IF v_wh_prev < p_quantity THEN
    RAISE EXCEPTION 'Saldo insuficiente no armazém: possui % e tentou transferir %.', v_wh_prev, p_quantity;
  END IF;

  v_wh_new := v_wh_prev - p_quantity;

  -- Atualiza Armazém
  UPDATE public.warehouse_stock
  SET quantity = v_wh_new,
      updated_at = now()
  WHERE product_id = p_product_id;

  -- 3. Credita na Disponibilidade para Venda
  v_sale_prev := COALESCE(v_prod.sale_available_quantity, 0);
  v_sale_new := v_sale_prev + p_quantity;

  UPDATE public.products
  SET sale_available_quantity = v_sale_new,
      updated_at = now()
  WHERE id = p_product_id;

  -- Sincroniza tabela product_sale_stock
  INSERT INTO public.product_sale_stock (product_id, quantity)
  VALUES (p_product_id, p_quantity)
  ON CONFLICT (product_id)
  DO UPDATE SET quantity = public.product_sale_stock.quantity + EXCLUDED.quantity, updated_at = now();

  -- 4. Registra movimentação do Armazém
  INSERT INTO public.warehouse_movements (
    product_id,
    type,
    quantity,
    previous_balance,
    resulting_balance,
    source,
    destination,
    user_id,
    observation
  ) VALUES (
    p_product_id,
    'TRANSFER_TO_SALE',
    p_quantity,
    v_wh_prev,
    v_wh_new,
    'ARMAZÉM',
    'DISPONÍVEL PARA VENDA',
    v_caller_id,
    p_observation
  );

  -- 5. Auditoria
  INSERT INTO public.audit_logs (
    user_id, action, entity, entity_id, new_data
  ) VALUES (
    v_caller_id,
    'warehouse_transfer_sale',
    'products',
    p_product_id,
    jsonb_build_object(
      'quantity', p_quantity,
      'product_name', v_prod.nome,
      'warehouse_balance', v_wh_new,
      'sale_available_balance', v_sale_new
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'transferred', p_quantity,
    'warehouse_balance', v_wh_new,
    'sale_available_balance', v_sale_new
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.transfer_warehouse_to_sale_rpc(uuid, numeric, text) TO authenticated;


-- ------------------------------------------------------------------------------
-- RPC 4: AJUSTAR SALDO DO ARMAZÉM
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_warehouse_stock_rpc(
  p_product_id uuid,
  p_new_quantity numeric,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_prev numeric := 0;
  v_diff numeric;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  IF NOT public.is_manager(v_caller_id) THEN
    RAISE EXCEPTION 'Apenas gerentes ou administradores podem ajustar saldo de armazém.';
  END IF;

  IF p_new_quantity IS NULL OR p_new_quantity < 0 THEN
    RAISE EXCEPTION 'O novo saldo deve ser maior ou igual a zero.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'O motivo do ajuste é obrigatório.';
  END IF;

  SELECT quantity INTO v_prev FROM public.warehouse_stock WHERE product_id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN
    v_prev := 0;
    INSERT INTO public.warehouse_stock (product_id, quantity)
    VALUES (p_product_id, p_new_quantity);
  ELSE
    UPDATE public.warehouse_stock
    SET quantity = p_new_quantity,
        updated_at = now()
    WHERE product_id = p_product_id;
  END IF;

  v_diff := p_new_quantity - v_prev;

  IF v_diff != 0 THEN
    INSERT INTO public.warehouse_movements (
      product_id,
      type,
      quantity,
      previous_balance,
      resulting_balance,
      source,
      destination,
      user_id,
      observation
    ) VALUES (
      p_product_id,
      'STOCK_ADJUSTMENT',
      abs(v_diff),
      v_prev,
      p_new_quantity,
      'ARMAZÉM',
      'AJUSTE MANUAL',
      v_caller_id,
      p_reason
    );
  END IF;

  INSERT INTO public.audit_logs (
    user_id, action, entity, entity_id, old_data, new_data
  ) VALUES (
    v_caller_id,
    'adjust_warehouse_stock',
    'warehouse_stock',
    p_product_id,
    jsonb_build_object('previous', v_prev),
    jsonb_build_object('new', p_new_quantity, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous', v_prev,
    'new_balance', p_new_quantity
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.adjust_warehouse_stock_rpc(uuid, numeric, text) TO authenticated;


-- ------------------------------------------------------------------------------
-- RPC 5: AJUSTAR ESTOQUE DE MATÉRIA-PRIMA
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_raw_material_stock_rpc(
  p_raw_material_id uuid,
  p_quantity_delta numeric,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_mat record;
  v_prev numeric;
  v_new numeric;
  v_type text;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso não autenticado.';
  END IF;

  IF NOT public.is_manager(v_caller_id) THEN
    RAISE EXCEPTION 'Apenas gerentes ou administradores podem ajustar estoque de matéria-prima.';
  END IF;

  IF p_quantity_delta IS NULL OR p_quantity_delta = 0 THEN
    RAISE EXCEPTION 'A variação de quantidade não pode ser zero.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'O motivo do ajuste é obrigatório.';
  END IF;

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
    p_reason
  );

  INSERT INTO public.audit_logs (
    user_id, action, entity, entity_id, old_data, new_data
  ) VALUES (
    v_caller_id,
    'adjust_raw_material_stock',
    'raw_materials',
    p_raw_material_id,
    jsonb_build_object('previous', v_prev),
    jsonb_build_object('new', v_new, 'delta', p_quantity_delta, 'reason', p_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous', v_prev,
    'new_balance', v_new
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.adjust_raw_material_stock_rpc(uuid, numeric, text) TO authenticated;


-- ==============================================================================
-- 13. INTEGRAÇÃO COM VENDAS EXISTENTES: ATUALIZAR CREATE_SALE E REVERSE_SALE
-- ==============================================================================

-- Redefine create_sale com validação de can_be_sold, sale_available_quantity e log em warehouse_movements
CREATE OR REPLACE FUNCTION public.create_sale(
  _product_id uuid,
  _quantity numeric,
  _unit_price numeric,
  _buyer_name text,
  _payment_method text DEFAULT 'dinheiro',
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _sale_id uuid;
  _total numeric;
  _prod record;
  _sale_prev numeric;
  _sale_new numeric;
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
  _total := _quantity * _unit_price;

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
    product_id, seller_id, buyer_name, quantity, unit_price, total_price, payment_method, notes
  ) VALUES (
    _product_id, _uid, COALESCE(NULLIF(trim(_buyer_name),''),'Não informado'), _quantity, _unit_price, _total, _payment_method, _notes
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
    'CLIENTE: ' || COALESCE(trim(_buyer_name), 'Não informado'),
    _sale_id,
    _uid,
    'Venda #' || substr(_sale_id::text, 1, 8) || ' (' || _payment_method || ')'
  );

  -- 6. Log de auditoria
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (_uid, 'create_sale', 'sales', _sale_id, jsonb_build_object(
    'product_id', _product_id,
    'product_name', _prod.nome,
    'quantity', _quantity,
    'total', _total,
    'buyer', _buyer_name,
    'sale_available_new', _sale_new
  ));

  RETURN _sale_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_sale(uuid, numeric, numeric, text, text, text) TO authenticated;


-- Redefine reverse_sale com devolução ao sale_available_quantity e log em warehouse_movements
CREATE OR REPLACE FUNCTION public.reverse_sale(
  _sale_id uuid,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _s public.sales;
  _prod record;
  _sale_prev numeric;
  _sale_new numeric;
BEGIN
  IF NOT public.is_manager(_uid) THEN RAISE EXCEPTION 'Sem permissão para estornar vendas'; END IF;

  SELECT * INTO _s FROM public.sales WHERE id = _sale_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venda não encontrada'; END IF;
  IF _s.status = 'estornada' THEN RAISE EXCEPTION 'Esta venda já foi estornada'; END IF;

  -- 1. Marcar venda como estornada
  UPDATE public.sales SET status = 'estornada', updated_at = now() WHERE id = _sale_id;

  -- 2. Restabelecer saldo de venda no produto
  SELECT * INTO _prod FROM public.products WHERE id = _s.product_id FOR UPDATE;
  _sale_prev := COALESCE(_prod.sale_available_quantity, 0);
  _sale_new := _sale_prev + _s.quantity;

  UPDATE public.products
  SET sale_available_quantity = _sale_new,
      updated_at = now()
  WHERE id = _s.product_id;

  -- Sincronizar product_sale_stock
  UPDATE public.product_sale_stock
  SET quantity = _sale_new,
      updated_at = now()
  WHERE product_id = _s.product_id;

  -- 3. Estornar movimentação do estoque tradicional
  PERFORM public.register_movement(
    _s.product_id,
    'entrada',
    _s.quantity,
    COALESCE(_reason, 'Estorno de venda'),
    _sale_id,
    NULL
  );

  -- 4. Registrar movimentação no Armazém / Venda
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
    _s.product_id,
    'SALE_CANCEL',
    _s.quantity,
    _sale_prev,
    _sale_new,
    'ESTORNO DE VENDA',
    'DISPONÍVEL PARA VENDA',
    _sale_id,
    _uid,
    COALESCE(_reason, 'Estorno de venda #' || substr(_sale_id::text, 1, 8))
  );

  -- 5. Auditoria
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
  VALUES (
    _uid,
    'reverse_sale',
    'sales',
    _sale_id,
    jsonb_build_object('status', 'concluida'),
    jsonb_build_object('status', 'estornada', 'motivo', _reason, 'restored_quantity', _s.quantity)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.reverse_sale(uuid, text) TO authenticated;
