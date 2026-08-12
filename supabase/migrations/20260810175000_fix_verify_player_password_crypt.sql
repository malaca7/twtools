CREATE OR REPLACE FUNCTION public.verify_player_password(
  _user_id uuid,
  _senha text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _encrypted text;
BEGIN
  IF _user_id IS NULL OR _senha IS NULL OR length(trim(_senha)) = 0 THEN
    RETURN false;
  END IF;

  SELECT u.encrypted_password
    INTO _encrypted
  FROM auth.users u
  JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id = _user_id
    AND p.status = 'ativo'
    AND u.deleted_at IS NULL;

  IF _encrypted IS NULL THEN
    RETURN false;
  END IF;

  RETURN _encrypted = extensions.crypt('twtools:' || trim(_senha) || ':v1!', _encrypted);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_player_password(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_player_password(uuid, text) TO anon, authenticated;
