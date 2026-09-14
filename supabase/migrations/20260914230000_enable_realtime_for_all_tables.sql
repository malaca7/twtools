-- Migration: Enable Supabase Realtime and REPLICA IDENTITY FULL for all public tables
-- Ensures instantaneous multi-client real-time synchronization without manual page reload

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        -- Set REPLICA IDENTITY FULL so all column values (including old values on updates/deletes) are broadcast
        EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', r.tablename);

        -- Add table to supabase_realtime publication if not already present
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = r.tablename
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', r.tablename);
        END IF;
    END LOOP;
END $$;
