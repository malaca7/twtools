
-- ENUMS
CREATE TYPE public.app_level AS ENUM ('01','02','gerente','motoqueiro','membro','novato');
CREATE TYPE public.movement_type AS ENUM ('entrada','saida');
CREATE TYPE public.sale_status AS ENUM ('concluida','estornada');
CREATE TYPE public.goal_type AS ENUM ('vendas','faturamento','quantidade');

-- UPDATED AT
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nome text NOT NULL,
  nickname text,
  avatar_url text,
  status text NOT NULL DEFAULT 'ativo',
  data_entrada date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nivel public.app_level NOT NULL DEFAULT 'novato',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_user_roles_updated BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- HELPERS
CREATE OR REPLACE FUNCTION public.get_level(_user_id uuid)
RETURNS public.app_level LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT nivel FROM public.user_roles WHERE user_id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND nivel IN ('01','02'));
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND nivel IN ('01','02','gerente'));
$$;

CREATE OR REPLACE FUNCTION public.can_operate(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND nivel IN ('01','02','gerente','motoqueiro','membro'));
$$;

-- PROFILE POLICIES
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- USER ROLES POLICIES
CREATE POLICY "roles_select_auth" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "categories_select" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_manage" ON public.categories FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  categoria_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  unidade text NOT NULL DEFAULT 'un',
  estoque_atual numeric NOT NULL DEFAULT 0 CHECK (estoque_atual >= 0),
  estoque_minimo numeric NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  preco_sugerido numeric NOT NULL DEFAULT 0 CHECK (preco_sugerido >= 0),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_categoria ON public.products(categoria_id);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_manage" ON public.products FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

-- STOCK MOVEMENTS
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL,
  type public.movement_type NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  previous_balance numeric NOT NULL,
  resulting_balance numeric NOT NULL,
  reason text,
  sale_id uuid,
  reversal_of uuid REFERENCES public.stock_movements(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_movements_user ON public.stock_movements(user_id);
CREATE INDEX idx_movements_created ON public.stock_movements(created_at DESC);
CREATE POLICY "movements_select_manager" ON public.stock_movements FOR SELECT TO authenticated USING (public.is_manager(auth.uid()));
CREATE POLICY "movements_select_own" ON public.stock_movements FOR SELECT TO authenticated USING (user_id = auth.uid());

-- SALES
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL,
  buyer_name text NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  payment_method text NOT NULL DEFAULT 'dinheiro',
  notes text,
  status public.sale_status NOT NULL DEFAULT 'concluida',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sales_seller ON public.sales(seller_id);
CREATE INDEX idx_sales_product ON public.sales(product_id);
CREATE INDEX idx_sales_created ON public.sales(created_at DESC);
CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "sales_select_manager" ON public.sales FOR SELECT TO authenticated USING (public.is_manager(auth.uid()));
CREATE POLICY "sales_select_own" ON public.sales FOR SELECT TO authenticated USING (seller_id = auth.uid());

ALTER TABLE public.stock_movements ADD CONSTRAINT fk_movement_sale FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL;

-- GOALS
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.goal_type NOT NULL,
  target_value numeric NOT NULL CHECK (target_value > 0),
  period_start date NOT NULL,
  period_end date NOT NULL,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_goals_user ON public.goals(user_id);
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "goals_select_manager" ON public.goals FOR SELECT TO authenticated USING (public.is_manager(auth.uid()));
CREATE POLICY "goals_select_own" ON public.goals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "goals_manage" ON public.goals FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

-- AUDIT LOGS
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);
CREATE POLICY "audit_select_admin" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- ONBOARDING
CREATE OR REPLACE FUNCTION public.ensure_membership(_nome text, _nickname text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _count int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  INSERT INTO public.profiles (user_id, nome, nickname)
  VALUES (_uid, COALESCE(NULLIF(trim(_nome),''), 'Membro'), NULLIF(trim(_nickname),''))
  ON CONFLICT (user_id) DO NOTHING;
  SELECT count(*) INTO _count FROM public.user_roles;
  INSERT INTO public.user_roles (user_id, nivel)
  VALUES (_uid, CASE WHEN _count = 0 THEN '01'::public.app_level ELSE 'novato'::public.app_level END)
  ON CONFLICT (user_id) DO NOTHING;
END; $$;
GRANT EXECUTE ON FUNCTION public.ensure_membership(text, text) TO authenticated;

-- SET LEVEL (admin only)
CREATE OR REPLACE FUNCTION public.set_member_level(_target_user uuid, _nivel public.app_level)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _old public.app_level;
BEGIN
  IF NOT public.is_admin(_uid) THEN RAISE EXCEPTION 'Sem permissão para alterar níveis'; END IF;
  SELECT nivel INTO _old FROM public.user_roles WHERE user_id = _target_user;
  INSERT INTO public.user_roles (user_id, nivel) VALUES (_target_user, _nivel)
  ON CONFLICT (user_id) DO UPDATE SET nivel = EXCLUDED.nivel, updated_at = now();
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
  VALUES (_uid, 'update_level', 'user_roles', _target_user, jsonb_build_object('nivel', _old), jsonb_build_object('nivel', _nivel));
END; $$;
GRANT EXECUTE ON FUNCTION public.set_member_level(uuid, public.app_level) TO authenticated;

-- STOCK MOVEMENT
CREATE OR REPLACE FUNCTION public.register_movement(
  _product_id uuid, _type public.movement_type, _quantity numeric,
  _reason text DEFAULT NULL, _sale_id uuid DEFAULT NULL, _reversal_of uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _prev numeric; _new numeric; _mid uuid; _ativo boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.can_operate(_uid) THEN RAISE EXCEPTION 'Seu nível não permite registrar movimentações'; END IF;
  IF _quantity IS NULL OR _quantity <= 0 THEN RAISE EXCEPTION 'A quantidade deve ser maior que zero'; END IF;
  SELECT estoque_atual, ativo INTO _prev, _ativo FROM public.products WHERE id = _product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto inválido'; END IF;
  IF _ativo IS NOT TRUE THEN RAISE EXCEPTION 'Produto inativo'; END IF;
  IF _type = 'entrada' THEN _new := _prev + _quantity; ELSE _new := _prev - _quantity; END IF;
  IF _new < 0 THEN RAISE EXCEPTION 'Estoque insuficiente: saldo atual % e saída de %', _prev, _quantity; END IF;
  UPDATE public.products SET estoque_atual = _new WHERE id = _product_id;
  INSERT INTO public.stock_movements (product_id, user_id, type, quantity, previous_balance, resulting_balance, reason, sale_id, reversal_of)
  VALUES (_product_id, _uid, _type, _quantity, _prev, _new, _reason, _sale_id, _reversal_of)
  RETURNING id INTO _mid;
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (_uid, 'create_movement', 'stock_movements', _mid, jsonb_build_object('type', _type, 'quantity', _quantity, 'product_id', _product_id));
  RETURN _mid;
END; $$;
GRANT EXECUTE ON FUNCTION public.register_movement(uuid, public.movement_type, numeric, text, uuid, uuid) TO authenticated;

-- REVERSE MOVEMENT
CREATE OR REPLACE FUNCTION public.reverse_movement(_movement_id uuid, _reason text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _m public.stock_movements; _existing uuid;
BEGIN
  IF NOT public.is_manager(_uid) THEN RAISE EXCEPTION 'Sem permissão para estornar movimentações'; END IF;
  SELECT * INTO _m FROM public.stock_movements WHERE id = _movement_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Movimentação não encontrada'; END IF;
  SELECT id INTO _existing FROM public.stock_movements WHERE reversal_of = _movement_id;
  IF _existing IS NOT NULL THEN RAISE EXCEPTION 'Esta movimentação já foi estornada'; END IF;
  RETURN public.register_movement(
    _m.product_id,
    CASE WHEN _m.type = 'entrada' THEN 'saida'::public.movement_type ELSE 'entrada'::public.movement_type END,
    _m.quantity,
    COALESCE(_reason, 'Estorno de movimentação'),
    NULL,
    _movement_id
  );
END; $$;
GRANT EXECUTE ON FUNCTION public.reverse_movement(uuid, text) TO authenticated;

-- CREATE SALE
CREATE OR REPLACE FUNCTION public.create_sale(
  _product_id uuid, _quantity numeric, _unit_price numeric, _buyer_name text,
  _payment_method text DEFAULT 'dinheiro', _notes text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _sale_id uuid; _total numeric;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF NOT public.can_operate(_uid) THEN RAISE EXCEPTION 'Seu nível não permite registrar vendas'; END IF;
  IF _quantity IS NULL OR _quantity <= 0 THEN RAISE EXCEPTION 'A quantidade deve ser maior que zero'; END IF;
  IF _unit_price IS NULL OR _unit_price < 0 THEN RAISE EXCEPTION 'Valor unitário inválido'; END IF;
  _total := _quantity * _unit_price;
  INSERT INTO public.sales (product_id, seller_id, buyer_name, quantity, unit_price, total_price, payment_method, notes)
  VALUES (_product_id, _uid, COALESCE(NULLIF(trim(_buyer_name),''),'Não informado'), _quantity, _unit_price, _total, _payment_method, _notes)
  RETURNING id INTO _sale_id;
  PERFORM public.register_movement(_product_id, 'saida', _quantity, 'Venda registrada', _sale_id, NULL);
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (_uid, 'create_sale', 'sales', _sale_id, jsonb_build_object('quantity', _quantity, 'total', _total));
  RETURN _sale_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.create_sale(uuid, numeric, numeric, text, text, text) TO authenticated;

-- REVERSE SALE
CREATE OR REPLACE FUNCTION public.reverse_sale(_sale_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _s public.sales;
BEGIN
  IF NOT public.is_manager(_uid) THEN RAISE EXCEPTION 'Sem permissão para estornar vendas'; END IF;
  SELECT * INTO _s FROM public.sales WHERE id = _sale_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venda não encontrada'; END IF;
  IF _s.status = 'estornada' THEN RAISE EXCEPTION 'Esta venda já foi estornada'; END IF;
  UPDATE public.sales SET status = 'estornada' WHERE id = _sale_id;
  PERFORM public.register_movement(_s.product_id, 'entrada', _s.quantity, COALESCE(_reason,'Estorno de venda'), _sale_id, NULL);
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
  VALUES (_uid, 'reverse_sale', 'sales', _sale_id, jsonb_build_object('status','concluida'), jsonb_build_object('status','estornada','motivo',_reason));
END; $$;
GRANT EXECUTE ON FUNCTION public.reverse_sale(uuid, text) TO authenticated;
