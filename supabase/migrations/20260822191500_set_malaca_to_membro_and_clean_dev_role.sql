-- Migration: Set Malaca (Discord ID 917826984778797087) role to 'membro' and remove 'desenvolvedor' as a standalone faction role
DO $$
DECLARE
  _target_uid uuid;
BEGIN
  -- 1. Locate Malaca by discord_id
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

  -- 2. Clean any remaining 'desenvolvedor' entries in user_roles table to 'membro'
  UPDATE public.user_roles
  SET nivel = 'membro'::public.app_level
  WHERE nivel::text = 'desenvolvedor';
END $$;
