-- Migração: Vinculação de Matérias-Primas com Produtos de Estoque
-- Adiciona a coluna product_id na tabela raw_materials

ALTER TABLE public.raw_materials 
ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_raw_materials_product_id ON public.raw_materials(product_id);
