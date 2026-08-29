import postgres from 'postgres';

const sql = postgres('postgresql://postgres:M4l@qu14s@db.adgdivossyzpwofouhrh.supabase.co:5432/postgres', { ssl: 'require' });

async function run() {
  try {
    const res = await sql`SELECT 1 as test`;
    console.log(res);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();
