-- 1. Alter entity_id column type from uuid to text to prevent type 42804 errors
ALTER TABLE public.audit_logs ALTER COLUMN entity_id TYPE text USING entity_id::text;

-- 2. Create/update SECURITY DEFINER RPC function to insert audit logs with full privileges
CREATE OR REPLACE FUNCTION public.log_audit_action_rpc(
  _action text,
  _entity text,
  _new_data jsonb DEFAULT NULL,
  _old_data jsonb DEFAULT NULL,
  _entity_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
  _log_id uuid;
  _fallback_uid text;
BEGIN
  _uid := auth.uid();

  IF _uid IS NULL THEN
    _fallback_uid := COALESCE(_new_data->>'user_id', _old_data->>'user_id', _new_data->>'target_id');
    IF _fallback_uid IS NOT NULL AND _fallback_uid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      _uid := _fallback_uid::uuid;
    END IF;
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    old_data,
    new_data,
    created_at
  ) VALUES (
    _uid,
    _action,
    _entity,
    _entity_id,
    _old_data,
    _new_data,
    now()
  )
  RETURNING id INTO _log_id;

  RETURN _log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit_action_rpc(text, text, jsonb, jsonb, text) TO authenticated, anon;

-- 3. Update RLS policies on public.audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users and anon to insert audit logs
DROP POLICY IF EXISTS "audit_insert_authenticated" ON public.audit_logs;
CREATE POLICY "audit_insert_authenticated" ON public.audit_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Allow authenticated users to select audit logs
DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_select_authenticated" ON public.audit_logs;
CREATE POLICY "audit_select_authenticated" ON public.audit_logs
  FOR SELECT TO authenticated, anon
  USING (true);
