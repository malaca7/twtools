import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://adgdivossyzpwofouhrh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ2Rpdm9zc3l6cHdvZm91aHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNDA5MTksImV4cCI6MjEwMjcxNjkxOX0.HNPSa4U5S-yRNTHsY6EUdarss1guBsY_IynUCxwaf3c";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAllLogs() {
  console.log("Fetching audit_logs with anon key...");
  const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching audit_logs:", error);
  } else {
    console.log("Total audit_logs rows:", data ? data.length : 0);
    if (data && data.length > 0) {
      console.log("Sample logs:", JSON.stringify(data.slice(0, 5), null, 2));
      const actions = [...new Set(data.map(d => d.action))];
      console.log("Unique actions in DB:", actions);
    }
  }
}

checkAllLogs();
