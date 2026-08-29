-- Migration: Update is_admin to include profile.is_developer = true and enforce dev role change rules in set_member_level

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND nivel::text IN ('01', '02', 'desenvolvedor')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND is_developer = true
  );
END; $$;

CREATE OR REPLACE FUNCTION public.set_member_level(_target_user uuid, _nivel public.app_level)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _old public.app_level;
  _caller_is_dev boolean := false;
  _target_is_dev boolean := false;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verifica se quem está chamando possui a Tag de Dev
  SELECT COALESCE(is_developer, false) INTO _caller_is_dev
  FROM public.profiles WHERE user_id = _uid;

  -- Verifica se o membro alvo possui a Tag de Dev
  SELECT COALESCE(is_developer, false) INTO _target_is_dev
  FROM public.profiles WHERE user_id = _target_user;

  -- Regra: Apenas quem tem a Tag de Dev pode alterar o cargo de quem tem a Tag de Dev!
  IF _target_is_dev AND NOT _caller_is_dev THEN
    RAISE EXCEPTION 'Apenas membros com a Tag de Dev podem alterar o cargo de outro Desenvolvedor.';
  END IF;

  -- Permissão geral: Precisa ser Admin ou ter a Tag de Dev
  IF NOT (public.is_admin(_uid) OR _caller_is_dev) THEN
    RAISE EXCEPTION 'Sem permissão para alterar níveis';
  END IF;

  SELECT nivel INTO _old FROM public.user_roles WHERE user_id = _target_user;

  INSERT INTO public.user_roles (user_id, nivel) VALUES (_target_user, _nivel)
  ON CONFLICT (user_id) DO UPDATE SET nivel = EXCLUDED.nivel, updated_at = now();

  INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
  VALUES (_uid, 'update_level', 'user_roles', _target_user, jsonb_build_object('nivel', _old), jsonb_build_object('nivel', _nivel));
END; $$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_member_level(uuid, public.app_level) TO authenticated;
