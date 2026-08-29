-- Migration: Remove 'desenvolvedor' from custom_roles table completely
DO $$
BEGIN
  DELETE FROM public.custom_roles WHERE id = 'desenvolvedor' OR LOWER(nome) = 'desenvolvedor';
END $$;
