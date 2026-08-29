-- 1. BAUS TABLE & COLUMNS
CREATE TABLE IF NOT EXISTS public.baus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  icone text DEFAULT 'box',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.baus TO authenticated;
GRANT ALL ON public.baus TO service_role;
ALTER TABLE public.baus DISABLE ROW LEVEL SECURITY;

-- Default chests if empty
INSERT INTO public.baus (nome, descricao, icone)
SELECT 'Baú Principal', 'Baú central de operações da facção', 'package'
WHERE NOT EXISTS (SELECT 1 FROM public.baus);

INSERT INTO public.baus (nome, descricao, icone)
SELECT 'Baú de Armas', 'Depósito de armamentos, coletes e munições', 'shield'
WHERE NOT EXISTS (SELECT 1 FROM public.baus WHERE nome = 'Baú de Armas');

INSERT INTO public.baus (nome, descricao, icone)
SELECT 'Baú de Drogas', 'Insumos e drogas processadas', 'flask-conical'
WHERE NOT EXISTS (SELECT 1 FROM public.baus WHERE nome = 'Baú de Drogas');

-- Add bau_id to products and stock_movements
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bau_id uuid REFERENCES public.baus(id) ON DELETE SET NULL;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS bau_id uuid REFERENCES public.baus(id) ON DELETE SET NULL;

-- Set default bau_id for existing products if null
DO $$
DECLARE
  _main_bau uuid;
BEGIN
  SELECT id INTO _main_bau FROM public.baus ORDER BY created_at ASC LIMIT 1;
  IF _main_bau IS NOT NULL THEN
    UPDATE public.products SET bau_id = _main_bau WHERE bau_id IS NULL;
    UPDATE public.stock_movements SET bau_id = _main_bau WHERE bau_id IS NULL;
  END IF;
END $$;


-- 2. USER PRESENCE TABLE
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'online', -- 'online' | 'ausente' | 'ocupado' | 'offline'
  last_seen timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_presence TO authenticated;
GRANT ALL ON public.user_presence TO service_role;
ALTER TABLE public.user_presence DISABLE ROW LEVEL SECURITY;


-- 3. ROLE PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.role_permissions (
  level text PRIMARY KEY,
  nivel text,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure primary key / unique index on level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'role_permissions_pkey'
  ) THEN
    ALTER TABLE public.role_permissions ADD PRIMARY KEY (level);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

ALTER TABLE public.role_permissions ADD COLUMN IF NOT EXISTS level text;
ALTER TABLE public.role_permissions ADD COLUMN IF NOT EXISTS nivel text;

-- Add unique constraint on level if missing
DO $$
BEGIN
  ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_level_key UNIQUE (level);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY;

-- Upsert initial role permissions
INSERT INTO public.role_permissions (level, nivel, permissions) VALUES
('01', '01', '["view_dashboard","view_products","manage_products","view_stock","create_movement","reverse_movement","view_all_movements","view_sales","create_sale","reverse_sale","view_all_sales","view_financials","view_members","manage_members","approve_requests","change_roles","view_performance","view_rankings","manage_goals","view_audit"]'::jsonb),
('02', '02', '["view_dashboard","view_products","manage_products","view_stock","create_movement","reverse_movement","view_all_movements","view_sales","create_sale","reverse_sale","view_all_sales","view_financials","view_members","manage_members","approve_requests","change_roles","view_performance","view_rankings","manage_goals","view_audit"]'::jsonb),
('gerente', 'gerente', '["view_dashboard","view_products","manage_products","view_stock","create_movement","reverse_movement","view_all_movements","view_sales","create_sale","reverse_sale","view_all_sales","view_financials","view_members","manage_members","approve_requests","view_performance","view_rankings","manage_goals"]'::jsonb),
('motoqueiro', 'motoqueiro', '["view_dashboard","view_products","view_stock","create_movement","view_sales","create_sale","view_performance","view_rankings"]'::jsonb),
('membro', 'membro', '["view_dashboard","view_products","view_stock","create_movement","view_sales","create_sale","view_performance","view_rankings"]'::jsonb),
('novato', 'novato', '["view_dashboard","view_products","view_stock","view_rankings"]'::jsonb)
ON CONFLICT DO NOTHING;


-- 4. FIX REVIEW SIGNUP REQUEST FUNCTION
CREATE OR REPLACE FUNCTION public.review_signup_request(
  _request_id uuid,
  _approve boolean,
  _nivel public.app_level DEFAULT 'novato',
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _req public.signup_requests;
  _old_level public.app_level;
  _effective_level public.app_level;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO _req
  FROM public.signup_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  IF _req.status = 'aprovado'::public.signup_request_status THEN
    RAISE EXCEPTION 'Solicitação já aprovada';
  END IF;

  IF _approve THEN
    -- Approving join request defaults role to novato unless explicitly passed
    _effective_level := COALESCE(_nivel, 'novato'::public.app_level);

    SELECT nivel INTO _old_level FROM public.user_roles WHERE user_id = _req.user_id;

    -- Update or Insert profile set status to 'ativo'
    INSERT INTO public.profiles (user_id, nome, nickname, status)
    VALUES (_req.user_id, _req.nome, NULL, 'ativo')
    ON CONFLICT (user_id) DO UPDATE
    SET
      nome = COALESCE(NULLIF(trim(EXCLUDED.nome), ''), public.profiles.nome),
      status = 'ativo',
      updated_at = now();

    -- Assign user role level
    INSERT INTO public.user_roles (user_id, nivel)
    VALUES (_req.user_id, _effective_level)
    ON CONFLICT (user_id) DO UPDATE
    SET
      nivel = EXCLUDED.nivel,
      updated_at = now();

    -- Mark request approved
    UPDATE public.signup_requests
    SET
      status = 'aprovado'::public.signup_request_status,
      reviewed_at = now(),
      reviewed_by = _uid,
      review_reason = NULL,
      updated_at = now()
    WHERE id = _request_id;

    INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
    VALUES (
      _uid,
      'approve_signup',
      'signup_requests',
      _req.user_id,
      jsonb_build_object('status', _req.status, 'nivel', _old_level),
      jsonb_build_object('status', 'aprovado', 'nivel', _effective_level)
    );
  ELSE
    UPDATE public.signup_requests
    SET
      status = 'rejeitado'::public.signup_request_status,
      reviewed_at = now(),
      reviewed_by = _uid,
      review_reason = NULLIF(trim(_reason), ''),
      updated_at = now()
    WHERE id = _request_id;

    INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
    VALUES (
      _uid,
      'reject_signup',
      'signup_requests',
      _req.user_id,
      jsonb_build_object('status', _req.status),
      jsonb_build_object('status', 'rejeitado', 'motivo', NULLIF(trim(_reason), ''))
    );
  END IF;
END;
$$;


-- 5. RPC FUNCTION TO SAVE ROLE PERMISSIONS
CREATE OR REPLACE FUNCTION public.save_role_permissions(
  _level text,
  _permissions jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update if exists, insert if not
  IF EXISTS (SELECT 1 FROM public.role_permissions WHERE level = _level OR nivel = _level) THEN
    UPDATE public.role_permissions
    SET permissions = _permissions, updated_at = now()
    WHERE level = _level OR nivel = _level;
  ELSE
    INSERT INTO public.role_permissions (level, nivel, permissions, updated_at)
    VALUES (_level, _level, _permissions, now());
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_role_permissions(text, jsonb) TO authenticated;

-- Ensure default role permissions include approve_requests and change_roles
INSERT INTO public.role_permissions (level, nivel, permissions) VALUES
('01', '01', '["view_dashboard","view_products","manage_products","view_stock","create_movement","reverse_movement","view_all_movements","view_sales","create_sale","reverse_sale","view_all_sales","view_financials","view_members","manage_members","approve_requests","change_roles","view_performance","view_rankings","manage_goals","view_audit"]'::jsonb),
('02', '02', '["view_dashboard","view_products","manage_products","view_stock","create_movement","reverse_movement","view_all_movements","view_sales","create_sale","reverse_sale","view_all_sales","view_financials","view_members","manage_members","approve_requests","change_roles","view_performance","view_rankings","manage_goals","view_audit"]'::jsonb),
('gerente', 'gerente', '["view_dashboard","view_products","manage_products","view_stock","create_movement","reverse_movement","view_all_movements","view_sales","create_sale","reverse_sale","view_all_sales","view_financials","view_members","manage_members","approve_requests","change_roles","view_performance","view_rankings","manage_goals"]'::jsonb),
('motoqueiro', 'motoqueiro', '["view_dashboard","view_products","view_stock","create_movement","view_sales","create_sale","view_performance","view_rankings"]'::jsonb),
('membro', 'membro', '["view_dashboard","view_products","view_stock","create_movement","view_sales","create_sale","view_performance","view_rankings"]'::jsonb),
('novato', 'novato', '["view_dashboard","view_products","view_stock","view_rankings"]'::jsonb)
ON CONFLICT (level) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Enable Realtime publication on all key tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products, public.stock_movements, public.sales, public.baus, public.profiles, public.user_roles, public.signup_requests, public.user_presence, public.role_permissions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

