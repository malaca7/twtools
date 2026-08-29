import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://adgdivossyzpwofouhrh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2Rpdm9zc3l6cHdvZm91aHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDA5MTksImV4cCI6MjEwMjcxNjkxOX0.HNPSa4U5S-yRNTHsY6EUdarss1guBsY_IynUCxwaf3c";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testProfiles() {
  console.log("Checking profiles table...");
  const { data: profiles, error } = await supabase.from('profiles').select('id, user_id, nome, nickname').limit(5);
  if (error) console.error("Error fetching profiles:", error);
  else console.log("Profiles count:", profiles ? profiles.length : 0, profiles);
}

testProfiles();
