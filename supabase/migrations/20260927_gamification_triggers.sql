-- =========================================================================
-- TRIGGERS AUTOMÁTICOS DE XP PARA INTERAÇÕES REAIS NA PLATAFORMA
-- =========================================================================

-- 1. TRIGGER EM VENDAS CONCLUÍDAS
CREATE OR REPLACE FUNCTION public.tg_award_xp_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'concluida' AND NEW.seller_id IS NOT NULL THEN
    PERFORM public.award_platform_xp_internal(
      NEW.seller_id,
      'sale_completed',
      NEW.id::text,
      format('Venda concluída de %sx unidades para %s', NEW.quantity, COALESCE(NEW.buyer_name, 'cliente'))
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_xp_on_sale ON public.sales;
CREATE TRIGGER trg_award_xp_on_sale
  AFTER INSERT OR UPDATE OF status ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_award_xp_on_sale();

-- 2. TRIGGER EM MOVIMENTAÇÕES DE BAÚ
CREATE OR REPLACE FUNCTION public.tg_award_xp_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL AND NEW.reversal_of IS NULL THEN
    PERFORM public.award_platform_xp_internal(
      NEW.user_id,
      'stock_movement',
      NEW.id::text,
      format('Movimentação (%s) registrada em baú físico', NEW.type)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_xp_on_movement ON public.stock_movements;
CREATE TRIGGER trg_award_xp_on_movement
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_award_xp_on_movement();

-- 3. TRIGGER EM PUBLICAÇÕES NO MURAL / FEED
CREATE OR REPLACE FUNCTION public.tg_award_xp_on_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.author_id IS NOT NULL THEN
    PERFORM public.award_platform_xp_internal(
      NEW.author_id,
      'post_published',
      NEW.id::text,
      'Publicação de informe/mídia no mural oficial'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_xp_on_post ON public.profile_posts;
CREATE TRIGGER trg_award_xp_on_post
  AFTER INSERT ON public.profile_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_award_xp_on_post();

-- 4. ATUALIZAR HEARTBEAT DE PRESENÇA PARA BÔNUS DIÁRIO
CREATE OR REPLACE FUNCTION public.heartbeat_user_presence(
  _user_id uuid,
  _status text DEFAULT 'online',
  _increment_seconds integer DEFAULT 30
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _current_user_id uuid;
  _existing_status text;
  _existing_since timestamptz;
  _existing_last_seen timestamptz;
BEGIN
  _current_user_id := COALESCE(auth.uid(), _user_id);
  IF _current_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT status, online_since, last_seen
  INTO _existing_status, _existing_since, _existing_last_seen
  FROM public.user_presence
  WHERE user_id = _current_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_presence (
      user_id,
      status,
      last_seen,
      online_since,
      total_seconds_online,
      updated_at
    ) VALUES (
      _current_user_id,
      _status,
      now(),
      now(),
      LEAST(GREATEST(_increment_seconds, 0), 300),
      now()
    );
  ELSE
    IF _existing_status = 'offline' OR _existing_last_seen IS NULL OR _existing_last_seen < (now() - interval '2 minutes') THEN
      _existing_since := CASE WHEN _status = 'offline' THEN NULL ELSE now() END;
    ELSIF _status = 'offline' THEN
      _existing_since := NULL;
    ELSIF _existing_since IS NULL THEN
      _existing_since := now();
    END IF;

    UPDATE public.user_presence
    SET
      status = _status,
      last_seen = now(),
      online_since = _existing_since,
      total_seconds_online = COALESCE(total_seconds_online, 0) + (CASE WHEN _status = 'online' THEN LEAST(GREATEST(_increment_seconds, 0), 300) ELSE 0 END),
      updated_at = now()
    WHERE user_id = _current_user_id;
  END IF;

  -- Bônus de XP diário para presença ativa (limitado a 1 vez por dia pelo reference_id current_date)
  IF _status = 'online' THEN
    PERFORM public.award_platform_xp_internal(
      _current_user_id,
      'daily_presence',
      current_date::text,
      'Presença diária ativa registrada no painel'
    );
  END IF;
END;
$$;
