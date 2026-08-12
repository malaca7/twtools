ALTER TABLE public.signup_requests
ADD COLUMN IF NOT EXISTS nickname text;

DROP FUNCTION IF EXISTS public.list_pending_signup_requests();

CREATE OR REPLACE FUNCTION public.submit_signup_request(
  _nome text,
  _telefone text,
  _nickname text DEFAULT NULL
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

  INSERT INTO public.signup_requests (
    user_id,
    nome,
    telefone,
    nickname,
    status,
    requested_at,
    reviewed_at,
    reviewed_by,
    review_reason
  )
  VALUES (
    _uid,
    COALESCE(NULLIF(trim(_nome), ''), 'Membro'),
    NULLIF(trim(_telefone), ''),
    NULLIF(trim(_nickname), ''),
    'pendente'::public.signup_request_status,
    now(),
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    nome = EXCLUDED.nome,
    telefone = EXCLUDED.telefone,
    nickname = EXCLUDED.nickname,
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

CREATE OR REPLACE FUNCTION public.list_pending_signup_requests()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  nome text,
  nickname text,
  telefone text,
  email text,
  requested_at timestamptz,
  status public.signup_request_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sr.id,
    sr.user_id,
    sr.nome,
    sr.nickname,
    sr.telefone,
    u.email,
    sr.requested_at,
    sr.status
  FROM public.signup_requests sr
  LEFT JOIN auth.users u ON u.id = sr.user_id
  WHERE sr.status = 'pendente'::public.signup_request_status
    AND public.is_manager(auth.uid())
  ORDER BY sr.requested_at ASC;
$$;

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
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT public.is_manager(_uid) THEN
    RAISE EXCEPTION 'Sem permissão para aprovar cadastros';
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

  IF NOT public.is_admin(_uid) AND _nivel IN ('01'::public.app_level, '02'::public.app_level, 'gerente'::public.app_level) THEN
    RAISE EXCEPTION 'Somente 01/02 podem aprovar com este nível';
  END IF;

  IF _approve THEN
    SELECT nivel INTO _old_level FROM public.user_roles WHERE user_id = _req.user_id;

    INSERT INTO public.profiles (user_id, nome, nickname, status)
    VALUES (_req.user_id, _req.nome, _req.nickname, 'ativo')
    ON CONFLICT (user_id) DO UPDATE
    SET
      nome = EXCLUDED.nome,
      nickname = EXCLUDED.nickname,
      status = 'ativo',
      updated_at = now();

    INSERT INTO public.user_roles (user_id, nivel)
    VALUES (_req.user_id, _nivel)
    ON CONFLICT (user_id) DO UPDATE
    SET
      nivel = EXCLUDED.nivel,
      updated_at = now();

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
      jsonb_build_object('status', 'aprovado', 'nivel', _nivel)
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

CREATE OR REPLACE FUNCTION public.list_login_players()
RETURNS TABLE (
  user_id uuid,
  nome text,
  nickname text,
  login_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.nome,
    p.nickname,
    u.email AS login_email
  FROM public.profiles p
  JOIN public.user_roles r ON r.user_id = p.user_id
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.status = 'ativo'
  ORDER BY lower(COALESCE(p.nickname, p.nome));
$$;

REVOKE EXECUTE ON FUNCTION public.submit_signup_request(text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_pending_signup_requests() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.review_signup_request(uuid, boolean, public.app_level, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_login_players() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.submit_signup_request(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_pending_signup_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_signup_request(uuid, boolean, public.app_level, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_login_players() TO anon, authenticated;
