import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://adgdivossyzpwofouhrh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2Rpdm9zc3l6cHdvZm91aHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDA5MTksImV4cCI6MjEwMjcxNjkxOX0.HNPSa4U5S-yRNTHsY6EUdarss1guBsY_IynUCxwaf3c";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test() {
  console.log("Checking profiles & user_roles for Discord ID 917826984778797087...");
  
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('user_id, nome, nickname, discord_id')
    .or('discord_id.eq.917826984778797087,nome.ilike.%malaca%');
    
  console.log("Profiles found:", JSON.stringify(profiles, null, 2), pErr);

  if (profiles && profiles.length > 0) {
    for (const p of profiles) {
      const { data: role, error: rErr } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', p.user_id);
      console.log(`Role for user ${p.nome} (${p.user_id}):`, role, rErr);
    }
  }

  // Also query all user_roles
  const { data: allRoles } = await supabase.from('user_roles').select('*');
  console.log("All user_roles in DB:", allRoles);
}

test();
