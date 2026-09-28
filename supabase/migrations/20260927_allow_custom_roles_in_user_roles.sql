-- ==============================================================================
-- Migração: Permitir Cargos Customizados / Dinâmicos em user_roles
-- Corrige o erro: invalid input value for enum app_level: "teste"
-- ==============================================================================

-- 1. Alterar a coluna user_roles.nivel de app_level para text
ALTER TABLE public.user_roles ALTER COLUMN nivel DROP DEFAULT;
ALTER TABLE public.user_roles ALTER COLUMN nivel TYPE text USING nivel::text;
ALTER TABLE public.user_roles ALTER COLUMN nivel SET DEFAULT 'novato';

-- 2. Atualizar função get_level
DROP FUNCTION IF EXISTS public.get_level(uuid);

CREATE OR REPLACE FUNCTION public.get_level(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(nivel, 'novato') FROM public.user_roles WHERE user_id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_level(uuid) TO authenticated, anon, service_role;

-- 3. Atualizar função set_member_level
DROP FUNCTION IF EXISTS public.set_member_level(uuid, public.app_level);
DROP FUNCTION IF EXISTS public.set_member_level(uuid, text);

CREATE OR REPLACE FUNCTION public.set_member_level(_target_user uuid, _nivel text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _old text;
BEGIN
  IF _uid IS NOT NULL AND NOT public.is_admin(_uid) THEN
    RAISE EXCEPTION 'Sem permissão para alterar níveis';
  END IF;

  SELECT nivel INTO _old FROM public.user_roles WHERE user_id = _target_user;

  INSERT INTO public.user_roles (user_id, nivel, updated_at)
  VALUES (_target_user, _nivel, now())
  ON CONFLICT (user_id) DO UPDATE SET
    nivel = EXCLUDED.nivel,
    updated_at = now();

  IF _uid IS NOT NULL THEN
    INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
    VALUES (
      _uid,
      'update_level',
      'user_roles',
      _target_user,
      jsonb_build_object('nivel', _old),
      jsonb_build_object('nivel', _nivel)
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_member_level(uuid, text) TO authenticated, service_role;

-- 4. Atualizar função review_signup_request
DROP FUNCTION IF EXISTS public.review_signup_request(uuid, boolean, public.app_level, text);
DROP FUNCTION IF EXISTS public.review_signup_request(uuid, boolean, text, text);

CREATE OR REPLACE FUNCTION public.review_signup_request(
  _request_id uuid,
  _approve boolean,
  _nivel text DEFAULT 'novato'::text,
  _reason text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _req public.signup_requests;
  _old_level text;
  _effective_level text;
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

  -- Obter dados do Discord via auth.users como fallback
  SELECT
    COALESCE(raw_user_meta_data->>'provider_id', raw_user_meta_data->>'sub'),
    COALESCE(raw_user_meta_data->>'user_name', raw_user_meta_data->>'name', raw_user_meta_data->>'full_name'),
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture'),
    COALESCE(email, raw_user_meta_data->>'email')
  INTO _d_id, _d_user, _d_avatar, _d_email
  FROM auth.users
  WHERE id = _req.user_id;

  IF _approve THEN
    _effective_level := COALESCE(_nivel, 'novato');

    SELECT nivel INTO _old_level FROM public.user_roles WHERE user_id = _req.user_id;

    -- Atualizar ou inserir perfil com status ativo
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

    -- Inserir / Atualizar cargo do membro
    INSERT INTO public.user_roles (user_id, nivel)
    VALUES (_req.user_id, _effective_level)
    ON CONFLICT (user_id) DO UPDATE
    SET
      nivel = EXCLUDED.nivel,
      updated_at = now();

    -- Marcar solicitação como aprovada
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

GRANT EXECUTE ON FUNCTION public.review_signup_request(uuid, boolean, text, text) TO authenticated, service_role;

-- 5. Atualizar ensure_membership
CREATE OR REPLACE FUNCTION public.ensure_membership(_nome text, _nickname text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _count int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;

  INSERT INTO public.profiles (user_id, nome, nickname)
  VALUES (_uid, COALESCE(NULLIF(trim(_nome),''), 'Membro'), NULLIF(trim(_nickname),''))
  ON CONFLICT (user_id) DO NOTHING;

  SELECT count(*) INTO _count FROM public.user_roles;

  INSERT INTO public.user_roles (user_id, nivel)
  VALUES (_uid, CASE WHEN _count = 0 THEN '01' ELSE 'novato' END)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_membership(text, text) TO authenticated, service_role;

-- 6. Atualizar sync_discord_user
CREATE OR REPLACE FUNCTION public.sync_discord_user(
  p_user_id uuid,
  p_discord_id text,
  p_discord_username text,
  p_discord_avatar_url text,
  p_discord_email text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile_id UUID;
  v_role_id UUID;
  v_current_level text;
BEGIN
  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = p_user_id;
  IF v_profile_id IS NOT NULL THEN
    UPDATE public.profiles
    SET
      discord_id = p_discord_id,
      discord_username = p_discord_username,
      discord_avatar_url = p_discord_avatar_url,
      discord_email = COALESCE(p_discord_email, discord_email),
      updated_at = NOW()
    WHERE id = v_profile_id;
  ELSE
    INSERT INTO public.profiles (
      user_id,
      nome,
      discord_id,
      discord_username,
      discord_avatar_url,
      discord_email
    ) VALUES (
      p_user_id,
      COALESCE(p_discord_username, 'Membro'),
      p_discord_id,
      p_discord_username,
      p_discord_avatar_url,
      p_discord_email
    )
    RETURNING id INTO v_profile_id;
  END IF;

  SELECT id, nivel INTO v_role_id, v_current_level FROM public.user_roles WHERE user_id = p_user_id;
  IF v_role_id IS NULL THEN
    INSERT INTO public.user_roles (user_id, nivel)
    VALUES (p_user_id, 'novato');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'user_id', p_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_discord_user(uuid, text, text, text, text) TO authenticated, service_role;
