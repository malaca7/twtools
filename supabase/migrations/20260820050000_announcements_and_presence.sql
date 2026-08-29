-- Create announcements table for management broadcasts
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and grants for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;

-- Policies for announcements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'announcements_select'
  ) THEN
    CREATE POLICY "announcements_select" ON public.announcements FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'announcements_insert'
  ) THEN
    CREATE POLICY "announcements_insert" ON public.announcements FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'announcements_delete'
  ) THEN
    CREATE POLICY "announcements_delete" ON public.announcements FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Add online_since and total_seconds_online to user_presence table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'user_presence' AND column_name = 'online_since'
  ) THEN
    ALTER TABLE public.user_presence ADD COLUMN online_since timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'user_presence' AND column_name = 'total_seconds_online'
  ) THEN
    ALTER TABLE public.user_presence ADD COLUMN total_seconds_online bigint DEFAULT 0;
  END IF;
END $$;

-- Enable Realtime for announcements
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
