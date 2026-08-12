DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'developers@twtools.local';

  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'developers@twtools.local',
      crypt('112233', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nome":"developers","nickname":"developers"}'::jsonb,
      now(),
      now()
    )
    RETURNING id INTO v_user_id;

    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id::text,
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::text, 'developers@twtools.local')::jsonb,
      'email',
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider_id, provider) DO NOTHING;
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt('112233', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('nome', 'developers', 'nickname', 'developers'),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  INSERT INTO public.profiles (user_id, nome, nickname, status)
  VALUES (v_user_id, 'developers', 'developers', 'ativo')
  ON CONFLICT (user_id) DO UPDATE
  SET
    nome = EXCLUDED.nome,
    nickname = EXCLUDED.nickname,
    status = 'ativo',
    updated_at = now();

  INSERT INTO public.user_roles (user_id, nivel)
  VALUES (v_user_id, '01'::public.app_level)
  ON CONFLICT (user_id) DO UPDATE
  SET
    nivel = '01'::public.app_level,
    updated_at = now();
END
$$;