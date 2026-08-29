-- Add game_id and telefone to profiles if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'game_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN game_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'telefone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN telefone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'signup_requests' AND column_name = 'game_id'
  ) THEN
    ALTER TABLE public.signup_requests ADD COLUMN game_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'signup_requests' AND column_name = 'nickname'
  ) THEN
    ALTER TABLE public.signup_requests ADD COLUMN nickname text;
  END IF;
END $$;

-- Update submit_signup_request function
CREATE OR REPLACE FUNCTION public.submit_signup_request(
  _nome text,
  _telefone text,
  _nickname text DEFAULT NULL,
  _game_id text DEFAULT NULL
)
RETURNS public.signup_request_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _status public.signup_request_status;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  INSERT INTO public.signup_requests (user_id, nome, nickname, telefone, game_id, status, requested_at)
  VALUES (
    _uid,
    COALESCE(NULLIF(trim(_nome), ''), 'Membro'),
    NULLIF(trim(_nickname), ''),
    COALESCE(NULLIF(trim(_telefone), ''), 'N/A'),
    COALESCE(NULLIF(trim(_game_id), ''), 'N/A'),
    'pendente'::public.signup_request_status,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    nome = EXCLUDED.nome,
    nickname = EXCLUDED.nickname,
    telefone = EXCLUDED.telefone,
    game_id = EXCLUDED.game_id,
    status = 'pendente'::public.signup_request_status,
    requested_at = now(),
    reviewed_at = NULL,
    reviewed_by = NULL,
    review_reason = NULL,
    updated_at = now();

  SELECT status INTO _status
  FROM public.signup_requests
  WHERE user_id = _uid;

  RETURN _status;
END;
$$;

-- Update review_signup_request function
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
    _effective_level := COALESCE(_nivel, 'novato'::public.app_level);

    SELECT nivel INTO _old_level FROM public.user_roles WHERE user_id = _req.user_id;

    -- Update or Insert profile with status = 'ativo', preserving game_id and telefone
    INSERT INTO public.profiles (user_id, nome, nickname, telefone, game_id, status)
    VALUES (_req.user_id, _req.nome, _req.nickname, _req.telefone, _req.game_id, 'ativo')
    ON CONFLICT (user_id) DO UPDATE
    SET
      nome = COALESCE(NULLIF(trim(EXCLUDED.nome), ''), public.profiles.nome),
      nickname = COALESCE(EXCLUDED.nickname, public.profiles.nickname),
      telefone = COALESCE(NULLIF(trim(EXCLUDED.telefone), ''), public.profiles.telefone),
      game_id = COALESCE(NULLIF(trim(EXCLUDED.game_id), ''), public.profiles.game_id),
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

GRANT EXECUTE ON FUNCTION public.submit_signup_request(text, text, text, text) TO authenticated;
