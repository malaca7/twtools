-- Create the sync_discord_user_rpc function to handle Discord OAuth syncing client-side
CREATE OR REPLACE FUNCTION public.sync_discord_user_rpc(
  _discord_id text,
  _discord_username text,
  _discord_avatar_url text,
  _discord_email text,
  _discord_name text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  _new_uid uuid := auth.uid();
  _existing_uid uuid;
  _needs_merge boolean := false;
  _count int;
BEGIN
  IF _new_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- 1. Check if profile already exists for this discord_id
  SELECT user_id INTO _existing_uid FROM public.profiles WHERE discord_id = _discord_id LIMIT 1;

  IF _existing_uid IS NOT NULL THEN
    IF _existing_uid != _new_uid THEN
      _needs_merge := true;
    END IF;
  ELSE
    -- 2. Not found by discord_id. Try by email
    SELECT id INTO _existing_uid FROM auth.users WHERE email = _discord_email AND id != _new_uid LIMIT 1;
    IF _existing_uid IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _existing_uid) THEN
      _needs_merge := true;
    ELSE
      -- 3. Try by nickname or name
      SELECT user_id INTO _existing_uid FROM public.profiles 
      WHERE (LOWER(nickname) = LOWER(_discord_username) OR LOWER(nome) = LOWER(_discord_name))
        AND user_id != _new_uid
      LIMIT 1;
      IF _existing_uid IS NOT NULL THEN
        _needs_merge := true;
      END IF;
    END IF;
  END IF;

  IF _needs_merge THEN
    -- Merge old user -> new user
    -- Delete dummy records for new_uid if they exist
    DELETE FROM public.profiles WHERE user_id = _new_uid;
    DELETE FROM public.user_roles WHERE user_id = _new_uid;

    -- Update references in public tables
    UPDATE public.profiles SET 
      user_id = _new_uid,
      discord_id = _discord_id,
      discord_username = _discord_username,
      discord_avatar_url = _discord_avatar_url,
      discord_email = _discord_email,
      nome = _discord_name,
      avatar_url = _discord_avatar_url,
      updated_at = now()
    WHERE user_id = _existing_uid;

    UPDATE public.user_roles SET 
      user_id = _new_uid,
      updated_at = now()
    WHERE user_id = _existing_uid;

    UPDATE public.signup_requests SET 
      user_id = _new_uid,
      updated_at = now()
    WHERE user_id = _existing_uid;

    UPDATE public.stock_movements SET 
      user_id = _new_uid
    WHERE user_id = _existing_uid;

    UPDATE public.sales SET 
      seller_id = _new_uid
    WHERE seller_id = _existing_uid;

    UPDATE public.goals SET 
      user_id = _new_uid
    WHERE user_id = _existing_uid;

    UPDATE public.audit_logs SET 
      user_id = _new_uid
    WHERE user_id = _existing_uid;

    UPDATE public.signup_requests SET
      reviewed_by = _new_uid
    WHERE reviewed_by = _existing_uid;
  ELSE
    -- No merge needed. Upsert profile and role
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _new_uid) THEN
      UPDATE public.profiles SET
        discord_id = _discord_id,
        discord_username = _discord_username,
        discord_avatar_url = _discord_avatar_url,
        discord_email = _discord_email,
        nome = _discord_name,
        avatar_url = _discord_avatar_url,
        updated_at = now()
      WHERE user_id = _new_uid;
    ELSE
      INSERT INTO public.profiles (
        user_id, nome, nickname, avatar_url, status, 
        discord_id, discord_username, discord_avatar_url, discord_email
      )
      VALUES (
        _new_uid, _discord_name, _discord_username, _discord_avatar_url, 'ativo',
        _discord_id, _discord_username, _discord_avatar_url, _discord_email
      );

      IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _new_uid) THEN
        SELECT count(*) INTO _count FROM public.user_roles;
        INSERT INTO public.user_roles (user_id, nivel)
        VALUES (_new_uid, CASE WHEN _count = 0 THEN '01'::public.app_level ELSE 'membro'::public.app_level END)
        ON CONFLICT (user_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_discord_user_rpc(text, text, text, text, text) TO authenticated;
