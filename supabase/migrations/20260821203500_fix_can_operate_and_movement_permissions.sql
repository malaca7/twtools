-- Update public.can_operate function to include desenvolvedor, custom roles and custom saved permissions
CREATE OR REPLACE FUNCTION public.can_operate(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  _level text;
  _perms jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT nivel::text INTO _level FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  IF _level IS NULL THEN
    RETURN false;
  END IF;

  -- Default system levels that can operate
  IF _level IN ('desenvolvedor', '01', '02', 'gerente', 'motoqueiro', 'membro') THEN
    RETURN true;
  END IF;

  -- Check if permissions are customized in role_permissions table
  SELECT permissions INTO _perms FROM public.role_permissions WHERE level = _level OR nivel = _level LIMIT 1;
  IF _perms IS NOT NULL AND jsonb_typeof(_perms) = 'array' THEN
    IF _perms ? 'create_movement' OR _perms ? 'view_stock' OR _perms ? 'create_sale' THEN
      RETURN true;
    END IF;
  END IF;

  -- Check custom roles table
  IF EXISTS (SELECT 1 FROM public.custom_roles WHERE id = _level) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_operate(uuid) TO authenticated;
