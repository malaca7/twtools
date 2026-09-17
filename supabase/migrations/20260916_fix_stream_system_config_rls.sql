-- Migration: 20260916_fix_stream_system_config_rls.sql
-- Description: Corrigir politicas de RLS e permissoes da tabela stream_system_config e stream_integration_logs

-- Garantir permissoes basicas
GRANT ALL ON public.stream_system_config TO authenticated;
GRANT ALL ON public.stream_system_config TO service_role;
GRANT SELECT ON public.stream_system_config TO anon;

GRANT ALL ON public.stream_integration_logs TO authenticated;
GRANT ALL ON public.stream_integration_logs TO service_role;
GRANT SELECT ON public.stream_integration_logs TO anon;

-- Recriar politicas para stream_system_config
ALTER TABLE public.stream_system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stream_system_config_select_policy" ON public.stream_system_config;
DROP POLICY IF EXISTS "stream_system_config_update_policy" ON public.stream_system_config;
DROP POLICY IF EXISTS "stream_system_config_insert_policy" ON public.stream_system_config;
DROP POLICY IF EXISTS "stream_system_config_all_policy" ON public.stream_system_config;

-- Permitir leitura para anon e autenticados
CREATE POLICY "stream_system_config_select_policy" ON public.stream_system_config
  FOR SELECT TO public
  USING (true);

-- Permitir gerenciamento (INSERT, UPDATE) para usuarios autenticados
CREATE POLICY "stream_system_config_all_auth_policy" ON public.stream_system_config
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Recriar politicas para stream_integration_logs
ALTER TABLE public.stream_integration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stream_integration_logs_select_policy" ON public.stream_integration_logs;
DROP POLICY IF EXISTS "stream_integration_logs_insert_policy" ON public.stream_integration_logs;
DROP POLICY IF EXISTS "stream_integration_logs_all_policy" ON public.stream_integration_logs;

CREATE POLICY "stream_integration_logs_select_policy" ON public.stream_integration_logs
  FOR SELECT TO public
  USING (true);

CREATE POLICY "stream_integration_logs_all_auth_policy" ON public.stream_integration_logs
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Garantir que a linha id = 1 existe com os campos padroes
INSERT INTO public.stream_system_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
