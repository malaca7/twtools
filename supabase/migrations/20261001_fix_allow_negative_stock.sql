-- Migration: Fix Permitir Saldo Negativo e Saneamento de Estoque Negativo
-- 1. Criação da função de saneamento de saldos negativos
CREATE OR REPLACE FUNCTION public.sanitize_negative_stocks()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_fixed_baus INTEGER := 0;
  v_fixed_prods INTEGER := 0;
BEGIN
  -- Zerar saldos negativos em product_baus
  WITH updated_baus AS (
    UPDATE public.product_baus
    SET quantidade = 0, updated_at = now()
    WHERE quantidade < 0
    RETURNING 1
  )
  SELECT count(*) INTO v_fixed_baus FROM updated_baus;

  -- Recalcular produtos cujo estoque_atual está negativo ou desincronizado da soma dos baús
  WITH updated_prods AS (
    UPDATE public.products p
    SET estoque_atual = GREATEST(0, COALESCE((SELECT SUM(pb.quantidade) FROM public.product_baus pb WHERE pb.product_id = p.id), 0)),
        updated_at = now()
    WHERE p.estoque_atual < 0 
       OR p.estoque_atual != COALESCE((SELECT SUM(pb.quantidade) FROM public.product_baus pb WHERE pb.product_id = p.id), 0)
    RETURNING 1
  )
  SELECT count(*) INTO v_fixed_prods FROM updated_prods;

  RETURN jsonb_build_object(
    'success', true,
    'fixed_baus', v_fixed_baus,
    'fixed_products', v_fixed_prods
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sanitize_negative_stocks() TO authenticated, service_role, anon;

-- 2. Atualização completa de process_discord_stock_log
CREATE OR REPLACE FUNCTION public.process_discord_stock_log(
  p_message_id text, 
  p_guild_id text, 
  p_channel_id text, 
  p_author_name text, 
  p_game_player_id text, 
  p_raw_content text, 
  p_raw_embeds jsonb, 
  p_parsed_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    DECLARE
      v_log_id UUID;
      v_config RECORD;
      v_item JSONB;
      v_bau_id UUID;
      v_from_bau_id UUID;
      v_to_bau_id UUID;
      v_product_id UUID;
      v_product_name TEXT;
      v_clean_item_name TEXT;
      v_prev_stock NUMERIC;
      v_new_stock NUMERIC;
      v_qty_change NUMERIC;
      v_is_transfer BOOLEAN;
      v_mov_type TEXT;
      v_allow_negative BOOLEAN := false;
      v_default_bau UUID;
      v_default_cat UUID;
      
      -- Member resolution variables
      v_target_user_id UUID := NULL;
      v_actor_display_name TEXT := NULL;
      v_final_user_id UUID := NULL;
      v_final_author_name TEXT;
      v_items_processed INTEGER := 0;
    BEGIN
      -- 1. Verificar se mensagem já foi processada com sucesso
      IF EXISTS (SELECT 1 FROM public.discord_stock_logs WHERE message_id = p_message_id AND status = 'success') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Mensagem já processada anteriormente');
      END IF;

      -- 2. Carregar configuração
      SELECT * INTO v_config FROM public.discord_stock_config LIMIT 1;
      IF v_config.is_active IS FALSE THEN
        INSERT INTO public.discord_stock_logs (
          message_id, channel_id, guild_id, author_name, game_player_id, raw_content, raw_embeds, parsed_items, status, error_message
        ) VALUES (
          p_message_id, p_channel_id, p_guild_id, p_author_name, p_game_player_id, p_raw_content, p_raw_embeds, p_parsed_items, 'ignored', 'Processamento automático desativado'
        )
        ON CONFLICT (message_id) DO UPDATE SET status = 'ignored', error_message = 'Processamento automático desativado';
        RETURN jsonb_build_object('success', false, 'ignored', true, 'error', 'Processamento automático está desativado');
      END IF;

      -- Respeitar estritamente a preferência do usuário configurada no painel
      v_allow_negative := COALESCE(v_config.allow_negative_stock, false);
      v_default_bau := v_config.default_bau_id;

      IF v_default_bau IS NULL THEN
        SELECT id INTO v_default_bau FROM public.baus WHERE tipo_gestao = 'automatico' AND ativo = true ORDER BY created_at ASC LIMIT 1;
        IF v_default_bau IS NULL THEN
          SELECT id INTO v_default_bau FROM public.baus WHERE ativo = true ORDER BY created_at ASC LIMIT 1;
        END IF;
      END IF;

      -- Categoria padrão para novos produtos auto-cadastrados
      SELECT id INTO v_default_cat FROM public.categories ORDER BY created_at ASC LIMIT 1;

      -- 3. Resolver membro por game_id (Passaporte / ID in-game) ou por nome
      IF p_game_player_id IS NOT NULL AND trim(p_game_player_id) != '' THEN
        SELECT user_id, nome INTO v_target_user_id, v_actor_display_name
        FROM public.profiles
        WHERE game_id IS NOT NULL AND trim(game_id) = trim(p_game_player_id)
        LIMIT 1;
      END IF;

      IF v_target_user_id IS NULL AND p_author_name IS NOT NULL AND trim(p_author_name) != '' THEN
        SELECT user_id, nome INTO v_target_user_id, v_actor_display_name
        FROM public.profiles
        WHERE lower(trim(nome)) = lower(trim(p_author_name)) 
           OR (nickname IS NOT NULL AND lower(trim(nickname)) = lower(trim(p_author_name)))
        LIMIT 1;
      END IF;

      IF v_target_user_id IS NOT NULL THEN
        v_final_user_id := v_target_user_id;
        v_final_author_name := COALESCE(v_actor_display_name, p_author_name);
      ELSE
        -- Quando autor do Discord não é membro registrado, user_id é NULL para evitar erros de FK e XP indevido
        v_final_user_id := NULL;
        v_final_author_name := COALESCE(p_author_name, 'Sistema Twin Wheels');
      END IF;

      -- 4. Inserir ou atualizar log como processing
      INSERT INTO public.discord_stock_logs (
        message_id, channel_id, guild_id, author_name, game_player_id, raw_content, raw_embeds, parsed_items, status
      ) VALUES (
        p_message_id, p_channel_id, p_guild_id, v_final_author_name, p_game_player_id, p_raw_content, p_raw_embeds, p_parsed_items, 'processing'
      )
      ON CONFLICT (message_id) DO UPDATE 
        SET author_name = EXCLUDED.author_name,
            game_player_id = EXCLUDED.game_player_id,
            raw_content = EXCLUDED.raw_content,
            raw_embeds = EXCLUDED.raw_embeds,
            parsed_items = EXCLUDED.parsed_items,
            status = 'processing'
      RETURNING id INTO v_log_id;

      -- 5. Processar cada item do log
      FOR v_item IN SELECT * FROM jsonb_array_elements(p_parsed_items)
      LOOP
        v_is_transfer := COALESCE((v_item->>'is_transfer')::boolean, false);
        v_qty_change := (v_item->>'quantity_change')::numeric;
        v_clean_item_name := trim(v_item->>'item_name');

        -- Localizar Produto por nome ou cda_name (case-insensitive e tolerante a formatações)
        SELECT id, nome INTO v_product_id, v_product_name 
        FROM public.products 
        WHERE nome ILIKE v_clean_item_name
           OR (cda_name IS NOT NULL AND cda_name ILIKE v_clean_item_name)
        LIMIT 1;

        IF v_product_id IS NULL THEN
          -- Tentativa de busca removendo caracteres especiais e espaços extras
          SELECT id, nome INTO v_product_id, v_product_name 
          FROM public.products 
          WHERE lower(regexp_replace(nome, '[^a-zA-Z0-9]', '', 'g')) = lower(regexp_replace(v_clean_item_name, '[^a-zA-Z0-9]', '', 'g'))
             OR (cda_name IS NOT NULL AND lower(regexp_replace(cda_name, '[^a-zA-Z0-9]', '', 'g')) = lower(regexp_replace(v_clean_item_name, '[^a-zA-Z0-9]', '', 'g')))
          LIMIT 1;
        END IF;

        -- Auto-criação do produto se não existir (evita travamento de logs e perda de movimentações)
        IF v_product_id IS NULL THEN
          INSERT INTO public.products (
            nome, cda_name, categoria_id, ativo, estoque_atual, created_at, updated_at
          ) VALUES (
            v_clean_item_name, v_clean_item_name, v_default_cat, true, 0, now(), now()
          ) RETURNING id, nome INTO v_product_id, v_product_name;
        END IF;

        IF v_is_transfer IS TRUE THEN
          -- Identificar baú de origem e destino
          SELECT id INTO v_from_bau_id FROM public.baus WHERE nome ILIKE trim(v_item->>'from_bau_name') LIMIT 1;
          SELECT id INTO v_to_bau_id FROM public.baus WHERE nome ILIKE trim(v_item->>'to_bau_name') LIMIT 1;

          IF v_from_bau_id IS NULL THEN v_from_bau_id := v_default_bau; END IF;
          IF v_to_bau_id IS NULL THEN v_to_bau_id := v_default_bau; END IF;

          -- Débito no baú de origem
          INSERT INTO public.product_baus (product_id, bau_id, quantidade) VALUES (v_product_id, v_from_bau_id, 0)
          ON CONFLICT (product_id, bau_id) DO NOTHING;

          SELECT COALESCE(quantidade, 0) INTO v_prev_stock FROM public.product_baus 
          WHERE product_id = v_product_id AND bau_id = v_from_bau_id FOR UPDATE;

          -- Se não permite saldo negativo, limita o piso a zero
          IF v_allow_negative IS FALSE AND (v_prev_stock - ABS(v_qty_change)) < 0 THEN
            v_new_stock := 0;
          ELSE
            v_new_stock := v_prev_stock - ABS(v_qty_change);
          END IF;

          UPDATE public.product_baus SET quantidade = v_new_stock, updated_at = now() 
          WHERE product_id = v_product_id AND bau_id = v_from_bau_id;

          -- Inserir movimentação de saída
          INSERT INTO public.stock_movements (
            product_id, bau_id, user_id, type, quantity, previous_balance, resulting_balance,
            reason, discord_message_id, discord_user_name, game_player_id, origin, raw_log, status
          ) VALUES (
            v_product_id, v_from_bau_id, v_final_user_id, 'saida'::movement_type, ABS(v_qty_change), v_prev_stock, v_new_stock,
            'Transferência automática para ' || COALESCE(v_item->>'to_bau_name', 'Baú'),
            p_message_id, v_final_author_name, p_game_player_id, 'discord', p_raw_content, 'success'
          );

          -- Crédito no baú de destino
          INSERT INTO public.product_baus (product_id, bau_id, quantidade) VALUES (v_product_id, v_to_bau_id, 0)
          ON CONFLICT (product_id, bau_id) DO NOTHING;

          SELECT COALESCE(quantidade, 0) INTO v_prev_stock FROM public.product_baus 
          WHERE product_id = v_product_id AND bau_id = v_to_bau_id FOR UPDATE;

          v_new_stock := v_prev_stock + ABS(v_qty_change);

          UPDATE public.product_baus SET quantidade = v_new_stock, updated_at = now() 
          WHERE product_id = v_product_id AND bau_id = v_to_bau_id;

          -- Inserir movimentação de entrada
          INSERT INTO public.stock_movements (
            product_id, bau_id, user_id, type, quantity, previous_balance, resulting_balance,
            reason, discord_message_id, discord_user_name, game_player_id, origin, raw_log, status
          ) VALUES (
            v_product_id, v_to_bau_id, v_final_user_id, 'entrada'::movement_type, ABS(v_qty_change), v_prev_stock, v_new_stock,
            'Transferência automática recebida de ' || COALESCE(v_item->>'from_bau_name', 'Baú'),
            p_message_id, v_final_author_name, p_game_player_id, 'discord', p_raw_content, 'success'
          );

        ELSE
          -- Movimentação normal (Entrada ou Saída)
          v_bau_id := NULL;
          IF (v_item->>'bau_name') IS NOT NULL AND trim(v_item->>'bau_name') != '' AND lower(trim(v_item->>'bau_name')) != 'baú' AND lower(trim(v_item->>'bau_name')) != 'bau' THEN
            SELECT id INTO v_bau_id FROM public.baus WHERE nome ILIKE '%' || trim(v_item->>'bau_name') || '%' LIMIT 1;
          END IF;

          IF v_bau_id IS NULL THEN
            -- Tentar resolver pelo canal do discord
            SELECT id INTO v_bau_id FROM public.baus WHERE discord_channel_id = p_channel_id LIMIT 1;
          END IF;

          IF v_bau_id IS NULL THEN
            v_bau_id := v_default_bau;
          END IF;

          IF v_bau_id IS NULL THEN
            UPDATE public.discord_stock_logs 
            SET status = 'error', error_message = 'Nenhum baú automático configurado ou encontrado'
            WHERE id = v_log_id;
            RETURN jsonb_build_object('success', false, 'error', 'Baú não configurado');
          END IF;

          -- Garantir linha em product_baus
          INSERT INTO public.product_baus (product_id, bau_id, quantidade) VALUES (v_product_id, v_bau_id, 0)
          ON CONFLICT (product_id, bau_id) DO NOTHING;

          SELECT COALESCE(quantidade, 0) INTO v_prev_stock 
          FROM public.product_baus 
          WHERE product_id = v_product_id AND bau_id = v_bau_id FOR UPDATE;

          -- Se não permite saldo negativo, piso em 0
          IF v_allow_negative IS FALSE AND (v_prev_stock + v_qty_change) < 0 THEN
            v_new_stock := 0;
          ELSE
            v_new_stock := v_prev_stock + v_qty_change;
          END IF;

          v_mov_type := CASE WHEN v_qty_change > 0 THEN 'entrada' ELSE 'saida' END;

          -- Atualizar saldo em product_baus
          UPDATE public.product_baus 
          SET quantidade = v_new_stock, updated_at = now() 
          WHERE product_id = v_product_id AND bau_id = v_bau_id;

          -- Inserir movimentação no histórico
          INSERT INTO public.stock_movements (
            product_id, bau_id, user_id, type, quantity, previous_balance, resulting_balance, 
            reason, discord_message_id, discord_user_name, game_player_id, origin, raw_log, status
          ) VALUES (
            v_product_id, v_bau_id, v_final_user_id, 
            v_mov_type::movement_type,
            ABS(v_qty_change),
            v_prev_stock,
            v_new_stock,
            'Sincronizado via Discord Logs (' || v_mov_type || ')',
            p_message_id,
            v_final_author_name,
            p_game_player_id,
            'discord',
            p_raw_content,
            'success'
          );

        END IF;

        -- Atualizar saldo global do produto
        UPDATE public.products 
        SET estoque_atual = (
          SELECT CASE 
            WHEN v_allow_negative IS FALSE THEN GREATEST(0, COALESCE(SUM(quantidade), 0))
            ELSE COALESCE(SUM(quantidade), 0)
          END
          FROM public.product_baus WHERE product_id = v_product_id
        ),
        updated_at = now()
        WHERE id = v_product_id;

        v_items_processed := v_items_processed + 1;
      END LOOP;

      -- 6. Registrar sucesso no log e na configuração (sem sobrescrever a opção allow_negative_stock!)
      UPDATE public.discord_stock_logs 
      SET status = 'success', error_message = NULL 
      WHERE id = v_log_id;

      UPDATE public.discord_stock_config 
      SET last_processed_at = now(),
          last_message_id = p_message_id,
          last_status = 'success',
          last_error = NULL
      WHERE id = v_config.id;

      RETURN jsonb_build_object(
        'success', true, 
        'log_id', v_log_id, 
        'linked_user_id', v_final_user_id, 
        'author', v_final_author_name,
        'items_count', v_items_processed
      );

    EXCEPTION WHEN OTHERS THEN
      IF v_log_id IS NOT NULL THEN
        UPDATE public.discord_stock_logs SET status = 'error', error_message = SQLERRM WHERE id = v_log_id;
      END IF;
      UPDATE public.discord_stock_config 
      SET last_processed_at = now(),
          last_status = 'error',
          last_error = SQLERRM
      WHERE id = COALESCE(v_config.id, (SELECT id FROM public.discord_stock_config LIMIT 1));
      RETURN jsonb_build_object('success', false, 'error', SQLERRM);
    END;
$function$;

-- 3. Definir allow_negative_stock = false na configuração atual
UPDATE public.discord_stock_config SET allow_negative_stock = false;

-- 4. Executar saneamento inicial
SELECT public.sanitize_negative_stocks();
