-- ==============================================================================
-- MIGRATION: HABILITAR SUPABASE REALTIME EM TODAS AS TABELAS PÚBLICAS
-- Garante publicação em tempo real para sincronização instantânea sem reload
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename NOT IN ('spatial_ref_sys')
    ) LOOP
        -- Configura REPLICA IDENTITY FULL para fornecer registro completo em updates/deletes
        BEGIN
            EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', r.tablename);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

        -- Adiciona a tabela à publicação supabase_realtime
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = r.tablename
        ) THEN
            BEGIN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', r.tablename);
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;
    END LOOP;
END $$;
