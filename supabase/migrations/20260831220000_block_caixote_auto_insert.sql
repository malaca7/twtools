-- Migration to permanently prevent legacy client auto-inserts of "Baú Caixote"
CREATE OR REPLACE FUNCTION public.block_caixote_auto_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF LOWER(TRIM(NEW.nome)) = 'baú caixote' OR LOWER(TRIM(NEW.nome)) = 'bau caixote' THEN
    RETURN NULL; -- Silently ignore insertion from legacy cached clients
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_caixote ON public.baus;
CREATE TRIGGER trg_block_caixote
  BEFORE INSERT ON public.baus
  FOR EACH ROW
  EXECUTE FUNCTION public.block_caixote_auto_insert();
