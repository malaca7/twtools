-- Add Discord columns to signup_requests table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'signup_requests' AND column_name = 'discord_id'
  ) THEN
    ALTER TABLE public.signup_requests ADD COLUMN discord_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'signup_requests' AND column_name = 'discord_username'
  ) THEN
    ALTER TABLE public.signup_requests ADD COLUMN discord_username text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'signup_requests' AND column_name = 'discord_avatar_url'
  ) THEN
    ALTER TABLE public.signup_requests ADD COLUMN discord_avatar_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'signup_requests' AND column_name = 'discord_email'
  ) THEN
    ALTER TABLE public.signup_requests ADD COLUMN discord_email text;
  END IF;
END $$;

-- Update submit_signup_request RPC to automatically extract and populate Discord account info from auth.users
CREATE OR REPLACE FUNCTION public.submit_signup_request(
  _nome text,
  _telefone text,
  _nickname text DEFAULT NULL,
  _game_id text DEFAULT NULL
)
RETURNS public.signup_request_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _status public.signup_request_status;
  _d_id text;
  _d_user text;
  _d_avatar text;
  _d_email text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- Extract Discord metadata directly from auth.users
  SELECT
    COALESCE(raw_user_meta_data->>'provider_id', raw_user_meta_data->>'sub'),
    COALESCE(raw_user_meta_data->>'user_name', raw_user_meta_data->>'name', raw_user_meta_data->>'full_name'),
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture'),
    COALESCE(email, raw_user_meta_data->>'email')
  INTO _d_id, _d_user, _d_avatar, _d_email
  FROM auth.users
  WHERE id = _uid;

  INSERT INTO public.signup_requests (
    user_id, nome, nickname, telefone, game_id, status, requested_at,
    discord_id, discord_username, discord_avatar_url, discord_email
  )
  VALUES (
    _uid,
    COALESCE(NULLIF(trim(_nome), ''), 'Membro'),
    NULLIF(trim(_nickname), ''),
    COALESCE(NULLIF(trim(_telefone), ''), 'N/A'),
    COALESCE(NULLIF(trim(_game_id), ''), 'N/A'),
    'pendente'::public.signup_request_status,
    now(),
    _d_id, _d_user, _d_avatar, _d_email
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    nome = EXCLUDED.nome,
    nickname = EXCLUDED.nickname,
    telefone = EXCLUDED.telefone,
    game_id = EXCLUDED.game_id,
    discord_id = COALESCE(EXCLUDED.discord_id, public.signup_requests.discord_id),
    discord_username = COALESCE(EXCLUDED.discord_username, public.signup_requests.discord_username),
    discord_avatar_url = COALESCE(EXCLUDED.discord_avatar_url, public.signup_requests.discord_avatar_url),
    discord_email = COALESCE(EXCLUDED.discord_email, public.signup_requests.discord_email),
    status = 'pendente'::public.signup_request_status,
    requested_at = now(),
    reviewed_at = NULL,
    reviewed_by = NULL,
    review_reason = NULL,
    updated_at = now();

  -- Also make sure profiles table has discord columns populated for this pending user
  INSERT INTO public.profiles (
    user_id, nome, nickname, telefone, game_id, status,
    discord_id, discord_username, discord_avatar_url, discord_email, avatar_url
  )
  VALUES (
    _uid, _nome, _nickname, _telefone, _game_id, 'pendente',
    _d_id, _d_user, _d_avatar, _d_email, _d_avatar
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    nome = EXCLUDED.nome,
    nickname = EXCLUDED.nickname,
    telefone = EXCLUDED.telefone,
    game_id = EXCLUDED.game_id,
    discord_id = COALESCE(EXCLUDED.discord_id, public.profiles.discord_id),
    discord_username = COALESCE(EXCLUDED.discord_username, public.profiles.discord_username),
    discord_avatar_url = COALESCE(EXCLUDED.discord_avatar_url, public.profiles.discord_avatar_url),
    discord_email = COALESCE(EXCLUDED.discord_email, public.profiles.discord_email),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  SELECT status INTO _status
  FROM public.signup_requests
  WHERE user_id = _uid;

  RETURN _status;
END;
$$;

-- Update review_signup_request RPC to guarantee Discord info is copied to profiles upon approval
CREATE OR REPLACE FUNCTION public.review_signup_request(
  _request_id uuid,
  _approve boolean,
  _nivel public.app_level DEFAULT 'novato',
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid := auth.uid();
  _req public.signup_requests;
  _old_level public.app_level;
  _effective_level public.app_level;
  _d_id text;
  _d_user text;
  _d_avatar text;
  _d_email text;
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

  -- Get auth.users Discord info as fallback
  SELECT
    COALESCE(raw_user_meta_data->>'provider_id', raw_user_meta_data->>'sub'),
    COALESCE(raw_user_meta_data->>'user_name', raw_user_meta_data->>'name', raw_user_meta_data->>'full_name'),
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture'),
    COALESCE(email, raw_user_meta_data->>'email')
  INTO _d_id, _d_user, _d_avatar, _d_email
  FROM auth.users
  WHERE id = _req.user_id;

  IF _approve THEN
    _effective_level := COALESCE(_nivel, 'novato'::public.app_level);

    SELECT nivel INTO _old_level FROM public.user_roles WHERE user_id = _req.user_id;

    -- Insert or Update profile with status = 'ativo' AND full Discord info!
    INSERT INTO public.profiles (
      user_id, nome, nickname, telefone, game_id, status,
      discord_id, discord_username, discord_avatar_url, discord_email, avatar_url
    )
    VALUES (
      _req.user_id, _req.nome, _req.nickname, _req.telefone, _req.game_id, 'ativo',
      COALESCE(_req.discord_id, _d_id),
      COALESCE(_req.discord_username, _d_user),
      COALESCE(_req.discord_avatar_url, _d_avatar),
      COALESCE(_req.discord_email, _d_email),
      COALESCE(_req.discord_avatar_url, _d_avatar)
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      nome = COALESCE(NULLIF(trim(EXCLUDED.nome), ''), public.profiles.nome),
      nickname = COALESCE(EXCLUDED.nickname, public.profiles.nickname),
      telefone = COALESCE(NULLIF(trim(EXCLUDED.telefone), ''), public.profiles.telefone),
      game_id = COALESCE(NULLIF(trim(EXCLUDED.game_id), ''), public.profiles.game_id),
      status = 'ativo',
      discord_id = COALESCE(EXCLUDED.discord_id, public.profiles.discord_id, _d_id),
      discord_username = COALESCE(EXCLUDED.discord_username, public.profiles.discord_username, _d_user),
      discord_avatar_url = COALESCE(EXCLUDED.discord_avatar_url, public.profiles.discord_avatar_url, _d_avatar),
      discord_email = COALESCE(EXCLUDED.discord_email, public.profiles.discord_email, _d_email),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url, _d_avatar),
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
