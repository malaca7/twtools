import postgres from "postgres";

async function testConnection(port, sslMode) {
  console.log(`Testing port ${port} with ssl ${sslMode}...`);
  try {
    const sql = postgres({
      host: "db.adgdivossyzpwofouhrh.supabase.co",
      port: port,
      database: "postgres",
      username: "postgres",
      password: "rontuc-1pesnu-geGgad",
      ssl: sslMode,
      connect_timeout: 5
    });

    const res = await sql`SELECT 1 as test`;
    console.log(`SUCCESS on port ${port}!`, res);

    // Run our RPC fix
    console.log("Fixing set_member_level function in database...");
    await sql`
      CREATE OR REPLACE FUNCTION public.set_member_level(_target_user uuid, _nivel public.app_level)
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
      DECLARE
        _uid uuid := auth.uid();
        _old public.app_level;
      BEGIN
        SELECT nivel INTO _old FROM public.user_roles WHERE user_id = _target_user;

        INSERT INTO public.user_roles (user_id, nivel, updated_at)
        VALUES (_target_user, _nivel, now())
        ON CONFLICT (user_id) DO UPDATE SET nivel = EXCLUDED.nivel, updated_at = now();

        IF _uid IS NOT NULL THEN
          INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
          VALUES (_uid, 'update_level', 'user_roles', _target_user, jsonb_build_object('nivel', _old), jsonb_build_object('nivel', _nivel));
        END IF;
      END; $$;
    `;

    await sql`
      GRANT EXECUTE ON FUNCTION public.set_member_level(uuid, public.app_level) TO authenticated, service_role, anon;
    `;

    await sql`
      GRANT INSERT, UPDATE, SELECT ON public.user_roles TO authenticated, service_role;
    `;

    await sql`
      DROP POLICY IF EXISTS "roles_insert_auth" ON public.user_roles;
      CREATE POLICY "roles_insert_auth" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (true);
    `;

    await sql`
      DROP POLICY IF EXISTS "roles_update_auth" ON public.user_roles;
      CREATE POLICY "roles_update_auth" ON public.user_roles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    `;

    // Ensure Discord ID 917826984778797087 (Malaca) role is 'membro'
    const malaca = await sql`
      SELECT p.user_id, p.nome, p.nickname, p.discord_id, r.nivel
      FROM public.profiles p
      LEFT JOIN public.user_roles r ON r.user_id = p.user_id
      WHERE p.discord_id = '917826984778797087';
    `;
    console.log("Malaca Profile:", malaca);

    if (malaca.length > 0) {
      const uid = malaca[0].user_id;
      await sql`
        INSERT INTO public.user_roles (user_id, nivel, updated_at)
        VALUES (${uid}, 'membro'::public.app_level, now())
        ON CONFLICT (user_id) DO UPDATE SET nivel = 'membro'::public.app_level, updated_at = now();
      `;
      console.log("Malaca role set to 'membro'!");
    }

    await sql.end();
    return true;
  } catch (err) {
    console.error(`Failed on port ${port}:`, err.message);
    return false;
  }
}

async function main() {
  const ok5432 = await testConnection(5432, "require");
  if (!ok5432) {
    await testConnection(6543, "require");
  }
}

main();
