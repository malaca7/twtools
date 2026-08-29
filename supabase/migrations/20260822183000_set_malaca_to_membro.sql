-- Set role of Discord ID 917826984778797087 to 'membro'
DO $$
DECLARE
  _target_uid uuid;
BEGIN
  SELECT user_id INTO _target_uid
  FROM public.profiles
  WHERE discord_id = '917826984778797087'
  LIMIT 1;

  IF _target_uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, nivel, updated_at)
    VALUES (_target_uid, 'membro'::public.app_level, now())
    ON CONFLICT (user_id) DO UPDATE
    SET nivel = 'membro'::public.app_level, updated_at = now();
  END IF;
END $$;
