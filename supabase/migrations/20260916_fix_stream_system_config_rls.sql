-- Migration: 20260916_fix_stream_system_config_rls.sql
-- Description: Permitir ALL para public (anon, authenticated, service_role) identico a role_permissions

ALTER TABLE public.stream_system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stream_system_config_select_policy" ON public.stream_system_config;
DROP POLICY IF EXISTS "stream_system_config_update_policy" ON public.stream_system_config;
DROP POLICY IF EXISTS "stream_system_config_insert_policy" ON public.stream_system_config;
DROP POLICY IF EXISTS "stream_system_config_all_auth_policy" ON public.stream_system_config;
DROP POLICY IF EXISTS "allow_all_stream_system_config" ON public.stream_system_config;

CREATE POLICY "allow_all_stream_system_config" ON public.stream_system_config
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.stream_integration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stream_integration_logs_select_policy" ON public.stream_integration_logs;
DROP POLICY IF EXISTS "stream_integration_logs_insert_policy" ON public.stream_integration_logs;
DROP POLICY IF EXISTS "stream_integration_logs_all_auth_policy" ON public.stream_integration_logs;
DROP POLICY IF EXISTS "allow_all_stream_integration_logs" ON public.stream_integration_logs;

CREATE POLICY "allow_all_stream_integration_logs" ON public.stream_integration_logs
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

GRANT ALL ON TABLE public.stream_system_config TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.stream_integration_logs TO anon, authenticated, service_role;

-- Garantir registro padrão id = 1
INSERT INTO public.stream_system_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
