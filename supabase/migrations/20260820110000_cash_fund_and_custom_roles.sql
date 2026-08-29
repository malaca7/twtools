-- 1. Create cash_fund_movements table
CREATE TABLE IF NOT EXISTS public.cash_fund_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  motive text NOT NULL,
  notes text,
  previous_balance numeric(14,2) NOT NULL DEFAULT 0,
  resulting_balance numeric(14,2) NOT NULL DEFAULT 0,
  reversal_of uuid REFERENCES public.cash_fund_movements(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for cash_fund_movements
ALTER TABLE public.cash_fund_movements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cash_fund_movements' AND policyname = 'Allow select cash_fund_movements'
  ) THEN
    CREATE POLICY "Allow select cash_fund_movements" ON public.cash_fund_movements FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cash_fund_movements' AND policyname = 'Allow insert cash_fund_movements'
  ) THEN
    CREATE POLICY "Allow insert cash_fund_movements" ON public.cash_fund_movements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 2. Create RPC register_cash_movement
CREATE OR REPLACE FUNCTION public.register_cash_movement(
  _type text,
  _amount numeric,
  _motive text,
  _notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _prev_balance numeric(14,2) := 0;
  _res_balance numeric(14,2) := 0;
  _new_id uuid;
  _user_name text := 'Membro';
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF _type NOT IN ('entrada', 'saida') THEN
    RAISE EXCEPTION 'Tipo de movimentação de caixa inválido';
  END IF;

  IF _amount <= 0 THEN
    RAISE EXCEPTION 'O valor da movimentação deve ser maior que zero';
  END IF;

  IF NULLIF(trim(_motive), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o motivo da movimentação de caixa';
  END IF;

  -- Lock latest movement to get exact balance
  SELECT COALESCE(resulting_balance, 0) INTO _prev_balance
  FROM public.cash_fund_movements
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF _type = 'entrada' THEN
    _res_balance := _prev_balance + _amount;
  ELSE
    _res_balance := _prev_balance - _amount;
  END IF;

  INSERT INTO public.cash_fund_movements (
    user_id, type, amount, motive, notes, previous_balance, resulting_balance, created_at
  )
  VALUES (
    _uid, _type, _amount, trim(_motive), NULLIF(trim(_notes), ''), _prev_balance, _res_balance, now()
  )
  RETURNING id INTO _new_id;

  SELECT COALESCE(nickname, nome, 'Membro') INTO _user_name
  FROM public.profiles WHERE user_id = _uid;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (
    _uid,
    'create_cash_movement',
    'cash_fund_movements',
    _new_id,
    jsonb_build_object(
      'type', _type,
      'amount', _amount,
      'motive', trim(_motive),
      'notes', NULLIF(trim(_notes), ''),
      'previous_balance', _prev_balance,
      'resulting_balance', _res_balance,
      'user_name', _user_name
    )
  );

  RETURN _new_id;
END;
$$;

-- 3. Create RPC reverse_cash_movement
CREATE OR REPLACE FUNCTION public.reverse_cash_movement(
  _movement_id uuid,
  _reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _orig public.cash_fund_movements;
  _rev_type text;
  _prev_balance numeric(14,2) := 0;
  _res_balance numeric(14,2) := 0;
  _new_id uuid;
  _user_name text := 'Membro';
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO _orig FROM public.cash_fund_movements WHERE id = _movement_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimentação de caixa não encontrada';
  END IF;

  _rev_type := CASE WHEN _orig.type = 'entrada' THEN 'saida' ELSE 'entrada' END;

  SELECT COALESCE(resulting_balance, 0) INTO _prev_balance
  FROM public.cash_fund_movements
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF _rev_type = 'entrada' THEN
    _res_balance := _prev_balance + _orig.amount;
  ELSE
    _res_balance := _prev_balance - _orig.amount;
  END IF;

  INSERT INTO public.cash_fund_movements (
    user_id, type, amount, motive, notes, previous_balance, resulting_balance, reversal_of, created_at
  )
  VALUES (
    _uid, _rev_type, _orig.amount,
    'Estorno: ' || _orig.motive,
    COALESCE(NULLIF(trim(_reason), ''), 'Estorno de movimentação de caixa'),
    _prev_balance, _res_balance, _movement_id, now()
  )
  RETURNING id INTO _new_id;

  SELECT COALESCE(nickname, nome, 'Membro') INTO _user_name
  FROM public.profiles WHERE user_id = _uid;

  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (
    _uid,
    'reverse_cash_movement',
    'cash_fund_movements',
    _new_id,
    jsonb_build_object(
      'original_id', _movement_id,
      'amount', _orig.amount,
      'reason', _reason,
      'user_name', _user_name
    )
  );

  RETURN _new_id;
END;
$$;

-- 4. Create custom_roles table
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id text PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  rank integer NOT NULL DEFAULT 1,
  is_system boolean NOT NULL DEFAULT false,
  module_permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for custom_roles
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_roles' AND policyname = 'Allow select custom_roles'
  ) THEN
    CREATE POLICY "Allow select custom_roles" ON public.custom_roles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'custom_roles' AND policyname = 'Allow all custom_roles'
  ) THEN
    CREATE POLICY "Allow all custom_roles" ON public.custom_roles FOR ALL USING (true);
  END IF;
END $$;

-- 5. Seed default system roles
INSERT INTO public.custom_roles (id, nome, descricao, rank, is_system, module_permissions)
VALUES
  (
    'desenvolvedor', 'Desenvolvedor', 'Acesso total de desenvolvimento e administração de sistema', 100, true,
    '{"dashboard":"manage","fundo_caixa":"manage","produtos":"manage","categorias":"manage","baus":"manage","movimentacoes":"manage","vendas":"manage","membros":"manage","desempenho":"manage","auditoria":"manage","gestao_cargos":"manage"}'::jsonb
  ),
  (
    '01', '01', 'Acesso administrativo completo de liderança', 90, true,
    '{"dashboard":"manage","fundo_caixa":"manage","produtos":"manage","categorias":"manage","baus":"manage","movimentacoes":"manage","vendas":"manage","membros":"manage","desempenho":"manage","auditoria":"manage","gestao_cargos":"manage"}'::jsonb
  ),
  (
    '02', '02', 'Administra operações, estoque e membros', 80, true,
    '{"dashboard":"manage","fundo_caixa":"manage","produtos":"manage","categorias":"manage","baus":"manage","movimentacoes":"manage","vendas":"manage","membros":"manage","desempenho":"manage","auditoria":"manage","gestao_cargos":"view"}'::jsonb
  ),
  (
    'gerente', 'Gerente', 'Operações, estoque, vendas e acompanhamento de metas', 70, true,
    '{"dashboard":"manage","fundo_caixa":"view","produtos":"manage","categorias":"manage","baus":"manage","movimentacoes":"manage","vendas":"manage","membros":"manage","desempenho":"manage","auditoria":"none","gestao_cargos":"none"}'::jsonb
  ),
  (
    'motoqueiro', 'Motoqueiro', 'Operações próprias, vendas e movimentações de estoque', 50, true,
    '{"dashboard":"view","fundo_caixa":"none","produtos":"view","categorias":"view","baus":"view","movimentacoes":"manage","vendas":"manage","membros":"view","desempenho":"view","auditoria":"none","gestao_cargos":"none"}'::jsonb
  ),
  (
    'membro', 'Membro', 'Acesso operacional e relatórios próprios', 40, true,
    '{"dashboard":"view","fundo_caixa":"none","produtos":"view","categorias":"view","baus":"view","movimentacoes":"manage","vendas":"manage","membros":"view","desempenho":"view","auditoria":"none","gestao_cargos":"none"}'::jsonb
  ),
  (
    'novato', 'Novato', 'Acesso inicial limitado para leitura', 10, true,
    '{"dashboard":"view","fundo_caixa":"none","produtos":"view","categorias":"view","baus":"view","movimentacoes":"none","vendas":"none","membros":"none","desempenho":"view","auditoria":"none","gestao_cargos":"none"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  rank = EXCLUDED.rank,
  module_permissions = EXCLUDED.module_permissions,
  updated_at = now();

-- 6. RPC save_custom_role
CREATE OR REPLACE FUNCTION public.save_custom_role(
  _id text,
  _nome text,
  _descricao text,
  _rank integer,
  _module_permissions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _clean_id text := lower(regexp_replace(trim(_id), '[^a-zA-Z0-9_]', '_', 'g'));
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NULLIF(trim(_nome), '') IS NULL THEN
    RAISE EXCEPTION 'Informe o nome do cargo';
  END IF;

  INSERT INTO public.custom_roles (id, nome, descricao, rank, is_system, module_permissions, updated_at)
  VALUES (
    _clean_id,
    trim(_nome),
    NULLIF(trim(_descricao), ''),
    COALESCE(_rank, 1),
    false,
    COALESCE(_module_permissions, '{}'::jsonb),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    rank = COALESCE(EXCLUDED.rank, public.custom_roles.rank),
    module_permissions = EXCLUDED.module_permissions,
    updated_at = now();

  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (
    _uid,
    'save_custom_role',
    'custom_roles',
    _clean_id,
    jsonb_build_object('nome', _nome, 'rank', _rank)
  );
END;
$$;

-- 7. RPC delete_custom_role
CREATE OR REPLACE FUNCTION public.delete_custom_role(
  _role_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _role public.custom_roles;
  _count_members int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO _role FROM public.custom_roles WHERE id = _role_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cargo não encontrado';
  END IF;

  IF _role.is_system THEN
    RAISE EXCEPTION 'Cargos padrão do sistema não podem ser excluídos';
  END IF;

  -- Check if any member has this role
  SELECT count(*) INTO _count_members FROM public.user_roles WHERE nivel::text = _role_id;
  IF _count_members > 0 THEN
    RAISE EXCEPTION 'Não é possível excluir o cargo pois existem % membros vinculados a ele', _count_members;
  END IF;

  DELETE FROM public.custom_roles WHERE id = _role_id;

  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data)
  VALUES (
    _uid,
    'delete_custom_role',
    'custom_roles',
    _role_id,
    jsonb_build_object('nome', _role.nome)
  );
END;
$$;

-- 8. RPC reorder_custom_roles
CREATE OR REPLACE FUNCTION public.reorder_custom_roles(
  _ordered_ids text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _total int := array_length(_ordered_ids, 1);
  _i int;
  _role_id text;
  _rank_value int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF _total IS NULL OR _total = 0 THEN
    RETURN;
  END IF;

  FOR _i IN 1.._total LOOP
    _role_id := _ordered_ids[_i];
    _rank_value := (_total - _i + 1) * 10;

    UPDATE public.custom_roles
    SET rank = _rank_value, updated_at = now()
    WHERE id = _role_id;
  END LOOP;

  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (
    _uid,
    'reorder_custom_roles',
    'custom_roles',
    NULL,
    jsonb_build_object('ordered_ids', _ordered_ids)
  );
END;
$$;
