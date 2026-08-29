import postgres from "postgres";

const DATABASE_URL = "postgresql://postgres:rontuc-1pesnu-geGgad@db.adgdivossyzpwofouhrh.supabase.co:5432/postgres";
const sql = postgres(DATABASE_URL, { ssl: "require" });

async function run() {
  console.log("Updating set_member_level RPC...");
  try {
    await sql`
      CREATE OR REPLACE FUNCTION public.set_member_level(_target_user uuid, _nivel public.app_level)
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
      DECLARE _uid uuid := auth.uid(); _old public.app_level;
      BEGIN
        IF NOT public.is_admin(_uid) THEN RAISE EXCEPTION 'Sem permissão para alterar níveis'; END IF;
        SELECT nivel INTO _old FROM public.user_roles WHERE user_id = _target_user;
        INSERT INTO public.user_roles (user_id, nivel) VALUES (_target_user, _nivel)
        ON CONFLICT (user_id) DO UPDATE SET nivel = EXCLUDED.nivel, updated_at = now();
        INSERT INTO public.audit_logs (user_id, action, entity, entity_id, old_data, new_data)
        VALUES (_uid, 'update_level', 'user_roles', _target_user, jsonb_build_object('nivel', _old), jsonb_build_object('nivel', _nivel));
      END; $$;
    `;
    console.log("RPC updated successfully.");
  } catch (error) {
    console.error("Failed to update RPC:", error);
  } finally {
    await sql.end();
  }
}

run();
