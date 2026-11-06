-- Create member_tags and member_tag_assignments tables in Postgres
CREATE TABLE IF NOT EXISTS public.member_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'Tag',
  category TEXT DEFAULT 'custom',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  permissions JSONB DEFAULT '[]'::jsonb,
  rules JSONB DEFAULT '{}'::jsonb,
  discord_role_id TEXT,
  discord_guild_id TEXT,
  discord_role_name TEXT,
  discord_sync_enabled BOOLEAN DEFAULT true,
  discord_role_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.member_tag_assignments (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL,
  user_id TEXT,
  tag_id TEXT NOT NULL,
  assigned_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  assigned_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_tag_assignments_member_id ON public.member_tag_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_member_tag_assignments_user_id ON public.member_tag_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_member_tag_assignments_tag_id ON public.member_tag_assignments(tag_id);

ALTER TABLE public.member_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_tag_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'member_tags' AND policyname = 'allow_all_member_tags'
  ) THEN
    CREATE POLICY allow_all_member_tags ON public.member_tags FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'member_tag_assignments' AND policyname = 'allow_all_member_tag_assignments'
  ) THEN
    CREATE POLICY allow_all_member_tag_assignments ON public.member_tag_assignments FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;
