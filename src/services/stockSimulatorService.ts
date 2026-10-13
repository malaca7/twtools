import { supabase } from "@/integrations/supabase/client";
import { rtdb } from "@/integrations/firebase/rtdb";

export interface SimulatedStockItem {
  name: string;
  quantity: number; // positive for addition (+), negative for withdrawal (-)
}

export interface SimulateStockPayload {
  channelId: string;
  authorName: string;
  gamePlayerId?: string;
  bauName: string;
  items: SimulatedStockItem[];
  timeString?: string;
  useWebhook?: boolean;
}

export interface SimulateStockResult {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
  channelName?: string;
  channelId?: string;
  rpcResult?: any;
  method?: "bot_http" | "bot_realtime" | "webhook" | "direct_rpc" | "rtdb_direct";
  itemsProcessed?: number;
}

/**
 * Envia uma movimentação idêntica ao bot Cidade Alta APP para o canal de Discord via HTTP Bot ou Realtime
 */
export async function sendSimulatedStockToDiscord(payload: SimulateStockPayload): Promise<SimulateStockResult> {
  // 1. Tenta envio direto via endpoint HTTP do Bot Discloud (twin.discloud.app/api/simulate-stock)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch("https://twin.discloud.app/api/simulate-stock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        method: "bot_http",
        message: `Mensagem enviada com sucesso para #${data.channelName || data.channelId}!`,
        messageId: data.messageId,
        channelName: data.channelName,
        channelId: data.channelId,
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
  } catch (httpErr: any) {
    console.warn("⚠️ Falha no endpoint HTTP do bot, tentando via Supabase Realtime broadcast:", httpErr.message);

    // 2. Fallback via Supabase Realtime Broadcast (sem restrições de CORS/rede)
    try {
      const channel = supabase.channel("system-stock-simulate");
      await channel.subscribe();
      await channel.send({
        type: "broadcast",
        event: "simulate_stock",
        payload: payload,
      });

      return {
        success: true,
        method: "bot_realtime",
        message: "Comando de simulação transmitido em tempo real para o bot via canal seguro!",
        channelId: payload.channelId,
      };
    } catch (realtimeErr: any) {
      return {
        success: false,
        error: `Não foi possível enviar ao Discord: ${httpErr.message || realtimeErr.message}`,
      };
    }
  }
}

/**
 * Envia diretamente para um webhook do Discord (exibição idêntica como 'Cidade Alta APP')
 */
export async function sendSimulatedStockViaWebhook(
  webhookUrl: string,
  payload: SimulateStockPayload
): Promise<SimulateStockResult> {
  try {
    const { authorName, gamePlayerId, bauName, items, timeString } = payload;
    const saldoLiquidoLines: string[] = [];
    const detalhesLines: string[] = [];

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      if (qty === 0) continue;
      const name = String(item.name).trim();
      const sign = qty > 0 ? `+${qty}` : `${qty}`;
      saldoLiquidoLines.push(`${name} \`${sign}\``);

      detalhesLines.push(name);
      if (qty > 0) {
        const verb = qty === 1 ? "adicionado" : "adicionados";
        detalhesLines.push(`↳ +${qty} ${verb}`);
      } else {
        const absQty = Math.abs(qty);
        const verb = absQty === 1 ? "removido" : "removidos";
        detalhesLines.push(`↳ -${absQty} ${verb}`);
      }
    }

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const formattedTime = timeString || `Hoje às ${hh}:${mm}`;

    const description = [
      `📦 ${bauName || "Baú"}`,
      "",
      "📊 Saldo líquido",
      saldoLiquidoLines.join("\n"),
      "",
      "🧾 Detalhes da movimentação",
      detalhesLines.join("\n"),
      "",
      `Movimentações agrupadas em uma janela de 30 segundos • ${formattedTime}`,
    ].join("\n");

    const authorTitle = gamePlayerId ? `${authorName} • ID ${gamePlayerId}` : authorName;

    const embed = {
      author: { name: authorTitle },
      description: description,
      color: 0xf59e0b,
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Cidade Alta",
        avatar_url: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
        embeds: [embed],
      }),
    });

    if (res.ok) {
      return {
        success: true,
        method: "webhook",
        message: "Mensagem postada com sucesso via Webhook Cidade Alta APP!",
      };
    } else {
      const errText = await res.text();
      return {
        success: false,
        error: `Erro ao postar no webhook Discord (${res.status}): ${errText}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Falha ao enviar webhook",
    };
  }
}

/**
 * Simula a movimentação diretamente no Banco de Dados Supabase (RPC process_discord_stock_log)
 */
export async function simulateDirectDbStockLog(
  payload: SimulateStockPayload & { guildId?: string; defaultBauId?: string }
): Promise<SimulateStockResult> {
  try {
    const { authorName, gamePlayerId, bauName, items, channelId, guildId } = payload;
    const fakeMessageId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    const parsedItems = items.map((it) => ({
      is_transfer: false,
      from_bau_name: null,
      to_bau_name: null,
      bau_name: bauName,
      item_name: it.name,
      quantity_change: it.quantity,
    }));

    const saldoLiquidoLines = items.map((it) => `${it.name} \`${it.quantity > 0 ? "+" : ""}${it.quantity}\``);
    const detalhesLines = items.flatMap((it) => [
      it.name,
      it.quantity > 0 ? `↳ +${it.quantity} adicionados` : `↳ -${Math.abs(it.quantity)} removidos`,
    ]);

    const rawText = [
      `${authorName} • ID ${gamePlayerId || "1"}`,
      `📦 ${bauName || "Baú"}`,
      "",
      "📊 Saldo líquido",
      saldoLiquidoLines.join("\n"),
      "",
      "🧾 Detalhes da movimentação",
      detalhesLines.join("\n"),
      "",
      `Movimentações agrupadas em uma janela de 30 segundos • Hoje às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    ].join("\n");

    const embedObj = {
      author: { name: `${authorName} • ID ${gamePlayerId || "1"}` },
      description: rawText,
      color: 16097035,
    };

    // 1. Tentar gravar diretamente no Firebase RTDB (banco principal)
    try {
      const [allBaus, allProds, configList, profilesList, productBausMap] = await Promise.all([
        rtdb.getList<any>("baus"),
        rtdb.getList<any>("products"),
        rtdb.getList<any>("discord_stock_config"),
        rtdb.getList<any>("profiles"),
        rtdb.get<Record<string, any>>("product_baus") || {},
      ]);

      const config = configList?.[0] || { allow_negative_stock: true };
      const allowNegative = config.allow_negative_stock === true;

      // Localizar baú alvo
      let targetBau = allBaus.find((b) => b.nome && b.nome.toLowerCase() === (bauName || "").toLowerCase()) ||
        allBaus.find((b) => b.id === config.default_bau_id) ||
        allBaus[0];

      if (!targetBau && allBaus.length > 0) targetBau = allBaus[0];

      // Localizar usuário
      let finalUserId: string | null = null;
      let finalAuthorName = authorName || "Sistema Twin Wheels";
      if (gamePlayerId) {
        const pFound = profilesList.find((p) => p.game_id && String(p.game_id).trim() === String(gamePlayerId).trim());
        if (pFound) {
          finalUserId = pFound.user_id || pFound.id;
          finalAuthorName = pFound.nome || finalAuthorName;
        }
      }
      if (!finalUserId && authorName) {
        const lowerAuthor = authorName.trim().toLowerCase();
        const pFound = profilesList.find((p) =>
          (p.nome && p.nome.trim().toLowerCase() === lowerAuthor) ||
          (p.nickname && p.nickname.trim().toLowerCase() === lowerAuthor)
        );
        if (pFound) {
          finalUserId = pFound.user_id || pFound.id;
          finalAuthorName = pFound.nome || finalAuthorName;
        }
      }

      const pbMap = { ...(productBausMap || {}) };

      for (const item of items) {
        const cleanName = item.name.trim();
        const lowerClean = cleanName.toLowerCase();

        let prod = allProds.find((p) => {
          if (!p.nome) return false;
          if (p.nome.trim().toLowerCase() === lowerClean) return true;
          if (p.cda_name) {
            const aliases = p.cda_name.split(/[,;\n|]+/).map((s: string) => s.trim().toLowerCase()).filter(Boolean);
            if (aliases.includes(lowerClean)) return true;
          }
          return false;
        });

        if (!prod) {
          const newProdId = crypto.randomUUID ? crypto.randomUUID() : `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          prod = {
            id: newProdId,
            nome: cleanName,
            cda_name: cleanName,
            categoria_id: null,
            ativo: true,
            estoque_atual: "0.00",
            estoque_minimo: "0.00",
            preco_sugerido: "0.00",
            unidade: "un",
            created_at: nowIso,
            updated_at: nowIso,
          };
          await rtdb.set(`products/${newProdId}`, prod);
          allProds.push(prod);
        }

        const pbKey = `${prod.id}_${targetBau?.id || "default"}`;
        const prevQty = parseFloat(pbMap[pbKey]?.quantidade || 0) || 0;
        const qtyChange = item.quantity;
        let newQty = prevQty + qtyChange;
        if (!allowNegative && newQty < 0) newQty = 0;

        const pbData = {
          product_id: prod.id,
          bau_id: targetBau?.id,
          quantidade: newQty.toFixed(2),
          updated_at: nowIso,
        };
        await rtdb.set(`product_baus/${pbKey}`, pbData);
        pbMap[pbKey] = pbData;

        const movId = crypto.randomUUID ? crypto.randomUUID() : `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const movType = qtyChange > 0 ? "entrada" : "saida";
        await rtdb.set(`stock_movements/${movId}`, {
          id: movId,
          product_id: prod.id,
          bau_id: targetBau?.id,
          user_id: finalUserId,
          type: movType,
          quantity: Math.abs(qtyChange).toFixed(2),
          previous_balance: prevQty.toFixed(2),
          resulting_balance: newQty.toFixed(2),
          reason: `Simulação de Movimentação (${movType})`,
          discord_message_id: fakeMessageId,
          discord_user_name: finalAuthorName,
          game_player_id: gamePlayerId || null,
          origin: "simulacao",
          raw_log: rawText,
          status: "completed",
          created_at: nowIso,
        });

        // Recalcular saldo total do produto
        let totalStock = 0;
        for (const [k, pb] of Object.entries(pbMap)) {
          if (pb && (pb as any).product_id === prod.id) {
            totalStock += parseFloat((pb as any).quantidade || 0) || 0;
          }
        }
        if (!allowNegative && totalStock < 0) totalStock = 0;
        await rtdb.update(`products/${prod.id}`, {
          estoque_atual: totalStock.toFixed(2),
          updated_at: nowIso,
        });
      }

      // Salvar log no Firebase RTDB
      const stockLogId = crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await rtdb.set(`discord_stock_logs/${stockLogId}`, {
        id: stockLogId,
        message_id: fakeMessageId,
        channel_id: channelId || null,
        guild_id: guildId || null,
        author_name: finalAuthorName,
        game_player_id: gamePlayerId || null,
        raw_content: rawText,
        raw_embeds: embedObj,
        parsed_items: parsedItems,
        status: "success",
        error_message: null,
        created_at: nowIso,
      });

      // Atualizar config no RTDB
      if (config.id) {
        await rtdb.update(`discord_stock_config/${config.id}`, {
          last_message_id: fakeMessageId,
          last_processed_at: nowIso,
          last_status: "success",
          updated_at: nowIso,
        }).catch(() => {});
      }

      // Emitir pulso de sincronização no Firebase RTDB
      await rtdb.set("system_stock_sync_pulse", {
        timestamp: Date.now(),
        message_id: fakeMessageId,
        channel_id: channelId,
        bau_id: targetBau?.id,
        bau_name: targetBau?.nome,
        author_name: finalAuthorName,
        items_count: items.length,
      });

      // Emitir broadcast Supabase para atualizar abas abertas
      try {
        const bChannel = supabase.channel("system-stock-events");
        await bChannel.send({
          type: "broadcast",
          event: "stock_movement_created",
          payload: {
            message_id: fakeMessageId,
            channel_id: channelId,
            bau_name: targetBau?.nome || bauName,
            author_name: finalAuthorName,
            items_count: items.length,
            timestamp: Date.now(),
          },
        });
      } catch {}

      return {
        success: true,
        method: "rtdb_direct",
        message: "Movimentação gravada e calculada com sucesso no Firebase Realtime Database!",
        messageId: fakeMessageId,
        itemsProcessed: items.length,
      };
    } catch (rtdbErr: any) {
      console.warn("Erro ao simular no Firebase RTDB:", rtdbErr);
      return {
        success: false,
        error: rtdbErr.message || "Erro ao gravar movimentação no Firebase RTDB",
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Erro desconhecido ao executar simulação",
    };
  }
}
