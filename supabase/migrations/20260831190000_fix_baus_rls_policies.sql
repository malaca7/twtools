-- Ensure public.baus has full manage permissions for authenticated users
DO $$
BEGIN
  DROP POLICY IF EXISTS "baus_update_auth" ON public.baus;
  DROP POLICY IF EXISTS "baus_manage" ON public.baus;
  DROP POLICY IF EXISTS "baus_select_auth" ON public.baus;
  DROP POLICY IF EXISTS "baus_insert_auth" ON public.baus;
  DROP POLICY IF EXISTS "baus_delete_auth" ON public.baus;
  
  CREATE POLICY "baus_manage" ON public.baus 
    FOR ALL 
    USING (auth.uid() IS NOT NULL) 
    WITH CHECK (auth.uid() IS NOT NULL);
END $$;
