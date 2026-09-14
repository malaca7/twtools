import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://efwqhqevfxlschyhbiao.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd3FocWV2Znhsc2NoeWhiaWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTA0NTksImV4cCI6MjEwNDk4NjQ1OX0.NphUbLaJbJfU7dZvq8JZYoGWBYruAtvduDD0yrULy9k";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
