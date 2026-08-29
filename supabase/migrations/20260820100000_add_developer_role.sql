-- Add 'desenvolvedor' to app_level enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_level' AND e.enumlabel = 'desenvolvedor'
  ) THEN
    ALTER TYPE public.app_level ADD VALUE 'desenvolvedor' BEFORE '01';
  END IF;
END $$;

