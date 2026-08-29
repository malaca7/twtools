-- Create announcement_reads table to track member reads per announcement
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

-- Enable RLS and grants for announcement_reads
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.announcement_reads TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'announcement_reads' AND policyname = 'announcement_reads_select'
  ) THEN
    CREATE POLICY "announcement_reads_select" ON public.announcement_reads FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'announcement_reads' AND policyname = 'announcement_reads_insert'
  ) THEN
    CREATE POLICY "announcement_reads_insert" ON public.announcement_reads FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;
