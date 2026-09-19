import { supabase } from "@/integrations/supabase/client";

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
  method?: "bot_http" | "bot_realtime" | "webhook" | "direct_rpc";
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

    const { data: rpcRes, error } = await (supabase.rpc as any)("process_discord_stock_log", {
      p_message_id: fakeMessageId,
      p_guild_id: guildId || null,
      p_channel_id: channelId || null,
      p_author_name: authorName,
      p_game_player_id: gamePlayerId || null,
      p_raw_content: rawText,
      p_raw_embeds: embedObj,
      p_parsed_items: parsedItems,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Broadcast instantâneo para atualizar imediatamente todas as abas
    try {
      const bChannel = supabase.channel("system-stock-events");
      await bChannel.send({
        type: "broadcast",
        event: "stock_movement_created",
        payload: {
          message_id: fakeMessageId,
          channel_id: channelId,
          bau_name: bauName,
          author_name: authorName,
          items_count: items.length,
          timestamp: Date.now(),
        },
      });
    } catch {}

    return {
      success: rpcRes?.success ?? true,
      method: "direct_rpc",
      message: "Movimentação processada com sucesso no banco de dados!",
      messageId: fakeMessageId,
      rpcResult: rpcRes,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Erro ao executar simulação RPC no banco",
    };
  }
}
