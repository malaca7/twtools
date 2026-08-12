CREATE TYPE public.signup_request_status AS ENUM ('pendente', 'aprovado', 'rejeitado');

CREATE TABLE public.signup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nome text NOT NULL,
  telefone text NOT NULL,
  status public.signup_request_status NOT NULL DEFAULT 'pendente',
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.signup_requests TO authenticated;
GRANT ALL ON public.signup_requests TO service_role;
ALTER TABLE public.signup_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_signup_requests_status ON public.signup_requests(status, requested_at DESC);
CREATE TRIGGER trg_signup_requests_updated BEFORE UPDATE ON public.signup_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "signup_requests_select_own_or_manager"
ON public.signup_requests
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_manager(auth.uid()));

CREATE POLICY "signup_requests_insert_own"
ON public.signup_requests
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "signup_requests_update_manager"
ON public.signup_requests
FOR UPDATE TO authenticated
USING (public.is_manager(auth.uid()))
WITH CHECK (public.is_manager(auth.uid()));

CREATE OR REPLACE FUNCTION public.submit_signup_request(_nome text, _telefone text)
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

  INSERT INTO public.signup_requests (user_id, nome, telefone, status, requested_at, reviewed_at, reviewed_by, review_reason)
  VALUES (
    _uid,
    COALESCE(NULLIF(trim(_nome), ''), 'Membro'),
    NULLIF(trim(_telefone), ''),
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

CREATE OR REPLACE FUNCTION public.get_signup_request_status()
RETURNS public.signup_request_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sr.status
  FROM public.signup_requests sr
  WHERE sr.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.list_pending_signup_requests()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  nome text,
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
    VALUES (_req.user_id, _req.nome, NULL, 'ativo')
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

REVOKE EXECUTE ON FUNCTION public.submit_signup_request(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_signup_request_status() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_pending_signup_requests() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.review_signup_request(uuid, boolean, public.app_level, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_signup_request(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_signup_request_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_pending_signup_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_signup_request(uuid, boolean, public.app_level, text) TO authenticated;
