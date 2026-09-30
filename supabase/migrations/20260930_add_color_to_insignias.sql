ALTER TABLE public.insignias ADD COLUMN IF NOT EXISTS color TEXT;

-- Atualizar save_insignia_rpc para aceitar p_color
CREATE OR REPLACE FUNCTION public.save_insignia_rpc(
  p_id TEXT,
  p_name TEXT,
  p_icon TEXT,
  p_description TEXT,
  p_rarity TEXT,
  p_xp_cost INTEGER,
  p_category TEXT DEFAULT 'geral',
  p_active BOOLEAN DEFAULT true,
  p_color TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas Administradores podem gerenciar o catálogo de insígnias.';
  END IF;

  INSERT INTO public.insignias (
    id, name, icon, description, rarity, xp_cost, category, active, color, updated_at
  ) VALUES (
    trim(p_id), trim(p_name), trim(p_icon), trim(p_description), p_rarity, p_xp_cost, p_category, p_active, p_color, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    rarity = EXCLUDED.rarity,
    xp_cost = EXCLUDED.xp_cost,
    category = EXCLUDED.category,
    active = EXCLUDED.active,
    color = EXCLUDED.color,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'insignia_id', p_id);
END;
$$;
