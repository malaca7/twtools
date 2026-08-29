-- Fix register_cash_movement RPC to handle empty cash_fund_movements table without NULL previous_balance error

ALTER TABLE public.cash_fund_movements ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo';
ALTER TABLE public.cash_fund_movements ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP FUNCTION IF EXISTS public.register_cash_movement(text, numeric, text, text);
DROP FUNCTION IF EXISTS public.reverse_cash_movement(uuid, text);
DROP FUNCTION IF EXISTS public.delete_cash_movement(uuid);
DROP FUNCTION IF EXISTS public.save_role_permissions(text, jsonb);

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

  -- Lock latest movement to get exact balance (using scalar expression to guarantee 0 on empty table)
  _prev_balance := COALESCE(
    (SELECT resulting_balance FROM public.cash_fund_movements ORDER BY created_at DESC, id DESC LIMIT 1),
    0
  );

  IF _type = 'entrada' THEN
    _res_balance := _prev_balance + _amount;
  ELSE
    _res_balance := _prev_balance - _amount;
  END IF;

  INSERT INTO public.cash_fund_movements (
    user_id,
    type,
    amount,
    previous_balance,
    resulting_balance,
    motive,
    notes,
    status,
    created_at
  )
  VALUES (
    _uid,
    _type,
    _amount,
    _prev_balance,
    _res_balance,
    trim(_motive),
    NULLIF(trim(_notes), ''),
    'ativo',
    now()
  )
  RETURNING id INTO _new_id;

  -- Resolve actor name for audit log
  SELECT COALESCE(nickname, nome, 'Membro') INTO _user_name
  FROM public.profiles
  WHERE user_id = _uid;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (
    _uid,
    'create_cash_movement',
    'cash_fund_movements',
    _new_id,
    jsonb_build_object(
      'id', _new_id,
      'type', _type,
      'amount', _amount,
      'previous_balance', _prev_balance,
      'resulting_balance', _res_balance,
      'motive', trim(_motive),
      'user_name', _user_name
    )
  );

  RETURN _new_id;
END;
$$;

-- Fix reverse_cash_movement RPC
CREATE OR REPLACE FUNCTION public.reverse_cash_movement(
  _movement_id uuid,
  _reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _orig record;
  _last_balance numeric(14,2) := 0;
  _new_balance numeric(14,2) := 0;
  _reverse_type text;
  _user_name text := 'Membro';
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO _orig
  FROM public.cash_fund_movements
  WHERE id = _movement_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimentação de caixa não encontrada';
  END IF;

  IF _orig.status = 'estornado' THEN
    RAISE EXCEPTION 'Esta movimentação já foi estornada';
  END IF;

  _last_balance := COALESCE(
    (SELECT resulting_balance FROM public.cash_fund_movements WHERE status = 'ativo' ORDER BY created_at DESC, id DESC LIMIT 1),
    0
  );

  _reverse_type := CASE WHEN _orig.type = 'entrada' THEN 'saida' ELSE 'entrada' END;
  
  IF _reverse_type = 'saida' THEN
    _new_balance := _last_balance - _orig.amount;
  ELSE
    _new_balance := _last_balance + _orig.amount;
  END IF;

  -- Mark original movement as estornado
  UPDATE public.cash_fund_movements
  SET status = 'estornado',
      updated_at = now()
  WHERE id = _movement_id;

  SELECT COALESCE(nickname, nome, 'Membro') INTO _user_name
  FROM public.profiles
  WHERE user_id = _uid;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (
    _uid,
    'reverse_cash_movement',
    'cash_fund_movements',
    _movement_id,
    jsonb_build_object(
      'id', _movement_id,
      'amount', _orig.amount,
      'original_type', _orig.type,
      'resulting_balance', _new_balance,
      'reason', NULLIF(trim(_reason), ''),
      'user_name', _user_name
    )
  );

  RETURN true;
END;
$$;

-- Fix delete_cash_movement RPC
CREATE OR REPLACE FUNCTION public.delete_cash_movement(
  _movement_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _orig record;
  _user_name text := 'Membro';
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO _orig
  FROM public.cash_fund_movements
  WHERE id = _movement_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimentação de caixa não encontrada';
  END IF;

  SELECT COALESCE(nickname, nome, 'Membro') INTO _user_name
  FROM public.profiles
  WHERE user_id = _uid;

  -- Delete from cash_fund_movements table
  DELETE FROM public.cash_fund_movements
  WHERE id = _movement_id;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, new_data)
  VALUES (
    _uid,
    'delete_cash_movement',
    'cash_fund_movements',
    _movement_id,
    jsonb_build_object(
      'id', _movement_id,
      'amount', _orig.amount,
      'type', _orig.type,
      'motive', _orig.motive,
      'user_name', _user_name
    )
  );

  RETURN true;
END;
$$;

-- Ensure role_permissions table and save_role_permissions RPC
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text UNIQUE NOT NULL,
  nivel text,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de role_permissions para autenticados" ON public.role_permissions;
CREATE POLICY "Permitir leitura de role_permissions para autenticados"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Permitir escrita em role_permissions para autenticados" ON public.role_permissions;
CREATE POLICY "Permitir escrita em role_permissions para autenticados"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.save_role_permissions(
  _level text,
  _permissions jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.role_permissions (level, nivel, permissions, updated_at)
  VALUES (_level, _level, _permissions, now())
  ON CONFLICT (level)
  DO UPDATE SET
    permissions = EXCLUDED.permissions,
    updated_at = now();

  RETURN true;
END;
$$;
