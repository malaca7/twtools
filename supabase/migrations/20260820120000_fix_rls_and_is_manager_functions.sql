-- 1. Update is_admin and is_manager SQL functions to include 'desenvolvedor' and all management roles
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND nivel::text IN ('desenvolvedor', '01', '02')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND nivel::text IN ('desenvolvedor', '01', '02', 'gerente')
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.custom_roles cr ON cr.id = ur.nivel::text
    WHERE ur.user_id = _user_id AND cr.rank >= 50
  );
$$;

-- 2. Ensure RLS policies allow authenticated users to INSERT, UPDATE and DELETE on products, categories, baus
DO $$
BEGIN
  -- Products policy
  DROP POLICY IF EXISTS "products_manage" ON public.products;
  CREATE POLICY "products_manage" ON public.products FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

  -- Categories policy
  DROP POLICY IF EXISTS "categories_manage" ON public.categories;
  CREATE POLICY "categories_manage" ON public.categories FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

  -- Baús policy
  DROP POLICY IF EXISTS "baus_update_auth" ON public.baus;
  CREATE POLICY "baus_update_auth" ON public.baus FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

  -- Goals policy
  DROP POLICY IF EXISTS "goals_manage" ON public.goals;
  CREATE POLICY "goals_manage" ON public.goals FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
END $$;
