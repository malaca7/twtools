-- Adicionar colunas de cor independentes para fundo, borda e ícone da insígnia
ALTER TABLE public.insignias ADD COLUMN IF NOT EXISTS bg_color TEXT;
ALTER TABLE public.insignias ADD COLUMN IF NOT EXISTS border_color TEXT;
-- 'color' já existe (ícone/texto), renomear semanticamente: agora é icon_color
-- Mantemos 'color' por compatibilidade, apenas adicionamos as novas

-- Atualizar save_insignia_rpc para aceitar as 3 cores independentes
CREATE OR REPLACE FUNCTION public.save_insignia_rpc(
  p_id TEXT,
  p_name TEXT,
  p_icon TEXT,
  p_description TEXT,
  p_rarity TEXT,
  p_xp_cost INTEGER,
  p_category TEXT DEFAULT 'geral',
  p_active BOOLEAN DEFAULT true,
  p_color TEXT DEFAULT NULL,
  p_bg_color TEXT DEFAULT NULL,
  p_border_color TEXT DEFAULT NULL
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
    id, name, icon, description, rarity, xp_cost, category, active,
    color, bg_color, border_color, updated_at
  ) VALUES (
    trim(p_id), trim(p_name), trim(p_icon), trim(p_description), p_rarity, p_xp_cost,
    p_category, p_active, p_color, p_bg_color, p_border_color, now()
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
    bg_color = EXCLUDED.bg_color,
    border_color = EXCLUDED.border_color,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'insignia_id', p_id);
END;
$$;
