import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://eptcwuzfnarrvextneuu.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwdGN3dXpmbmFycnZleHRuZXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDI0MjksImV4cCI6MjEwNTc3ODQyOX0.WrXZZ-oxdBqhbrQx3tLrqtbbk1tFsaweJwROV3ThtPI";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
