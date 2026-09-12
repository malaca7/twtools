import { supabase } from "@/integrations/supabase/client";
import type { AppUser, Profile } from "@/lib/app-types";
import type { AppLevel } from "@/lib/permissions";
import { assertDeveloperAccess } from "@/services/devService";
import { logAuditAction } from "@/lib/app-api";

export interface DiscordWebhook {
  id: string;
  name: string; // Nome do Webhook / Postador (ex: "Avisos da Diretoria", "Canal de Postagens")
  guildId: string; // ID do Servidor Discord
  channelId: string; // ID do Canal Discord
  description?: string; // Descrição / Finalidade
  enabled: boolean;
  username?: string; // Nome personalizado do bot ao enviar mensagens
  avatarUrl?: string; // URL da imagem enviada por upload direto
  embedColor?: string; // Cor do embed (HEX)
  footerText?: string; // Texto do rodapé
  mentionRoles?: string; // Menções padrão (ex: @everyone, @here ou ID de cargo)
  showTimestamp?: boolean; // Exibir timestamp
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  lastStatus?: "success" | "error";
  lastErrorMessage?: string;
}

export interface DiscordWebhooksConfig {
  enabled: boolean;
  webhooks: DiscordWebhook[];
  defaultGuildId: string;
  defaultUsername: string;
  defaultAvatarUrl: string;
  defaultFooterText: string;
  updatedAt: string;
}

export const DEFAULT_WEBHOOKS_CONFIG: DiscordWebhooksConfig = {
  enabled: true,
  defaultGuildId: "1537229296697999462",
  defaultUsername: "Twin Wheels RP",
  defaultAvatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
  defaultFooterText: "Twin Wheels RP • Canal de Mensagens",
  updatedAt: new Date().toISOString(),
  webhooks: [
    {
      id: "webhook_default_general",
      name: "Canal de Postagens Geral",
      guildId: "1537229296697999462",
      channelId: "1538375505953165312",
      description: "Canal integrado para envio de mensagens, comunicados e postagens",
      enabled: true,
      username: "Twin Wheels RP",
      avatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      embedColor: "#10B981",
      mentionRoles: "",
      footerText: "Twin Wheels RP",
      showTimestamp: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

const WEBHOOKS_STORAGE_KEY = "tw_discord_webhooks_config_v2";
const WEBHOOKS_DB_LEVEL = "system_discord_webhooks";

/**
 * Converte cor HEX (#10B981) para número inteiro aceito pela API do Discord
 */
export function hexToInt(hex?: string): number {
  if (!hex) return 0x10b981;
  const clean = hex.replace("#", "").trim();
  const num = parseInt(clean, 16);
  return isNaN(num) ? 0x10b981 : num;
}

/**
 * Valida se uma string é um ID numérico snowflake legítimo do Discord (17 a 20 dígitos)
 */
export function isValidDiscordId(id?: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^\d{17,20}$/.test(id.trim());
}

/**
 * Realiza o upload de imagem de avatar do bot para o Supabase Storage
 */
export async function uploadWebhookAvatar(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const cleanExt = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? ext : "png";
  const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
  const fileName = `webhooks/avatar_${Date.now()}_${sanitized}`;

  // Tenta bucket "products"
  let uploadRes = await supabase.storage.from("products").upload(fileName, file, {
    cacheControl: "31536000",
    upsert: true,
    contentType: file.type || `image/${cleanExt}`,
  });

  // Fallback para bucket "chat-attachments"
  if (uploadRes.error) {
    uploadRes = await supabase.storage.from("chat-attachments").upload(fileName, file, {
      cacheControl: "31536000",
      upsert: true,
      contentType: file.type || `image/${cleanExt}`,
    });
    if (uploadRes.error) {
      throw new Error(`Falha ao carregar imagem: ${uploadRes.error.message}`);
    }
    const { data: pubData } = supabase.storage.from("chat-attachments").getPublicUrl(uploadRes.data.path);
    return pubData.publicUrl;
  }

  const { data: pubData } = supabase.storage.from("products").getPublicUrl(uploadRes.data.path);
  return pubData.publicUrl;
}

/**
 * Carrega a lista e configuração de webhooks
 */
export async function getDiscordWebhooksConfig(): Promise<DiscordWebhooksConfig> {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", WEBHOOKS_DB_LEVEL)
      .maybeSingle();

    if (!error && data?.permissions && typeof data.permissions === "object") {
      const dbConfig = data.permissions as unknown as Partial<DiscordWebhooksConfig>;
      const merged: DiscordWebhooksConfig = {
        ...DEFAULT_WEBHOOKS_CONFIG,
        ...dbConfig,
        webhooks: Array.isArray(dbConfig.webhooks)
          ? dbConfig.webhooks.map((w) => ({
              ...w,
              guildId: w.guildId || DEFAULT_WEBHOOKS_CONFIG.defaultGuildId,
              channelId: w.channelId || "",
            }))
          : DEFAULT_WEBHOOKS_CONFIG.webhooks,
      };

      try {
        localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(merged));
      } catch {}

      return merged;
    }
  } catch (err) {
    console.warn("Falha ao buscar webhooks do Discord no Supabase:", err);
  }

  try {
    const local = localStorage.getItem(WEBHOOKS_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return {
        ...DEFAULT_WEBHOOKS_CONFIG,
        ...parsed,
        webhooks: Array.isArray(parsed.webhooks) ? parsed.webhooks : DEFAULT_WEBHOOKS_CONFIG.webhooks,
      };
    }
  } catch {}

  return DEFAULT_WEBHOOKS_CONFIG;
}

/**
 * Salva a configuração de webhooks no Supabase e no Cache Local
 */
export async function saveDiscordWebhooksConfig(
  config: DiscordWebhooksConfig,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  const cleanConfig: DiscordWebhooksConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(cleanConfig));

    const { error } = await supabase.from("role_permissions").upsert(
      {
        level: WEBHOOKS_DB_LEVEL,
        nivel: WEBHOOKS_DB_LEVEL,
        permissions: cleanConfig as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );

    if (error) {
      const { error: rpcError } = await (supabase.rpc as any)("save_role_permissions", {
        p_level: WEBHOOKS_DB_LEVEL,
        p_permissions: cleanConfig,
      });
      if (rpcError) throw rpcError;
    }

    const channel = supabase.channel("system-discord-webhooks-sync");
    await channel.send({
      type: "broadcast",
      event: "webhooks_updated",
      payload: cleanConfig,
    });
  } catch (err: any) {
    console.error("Erro ao salvar configuração de webhooks:", err);
    throw new Error(err.message || "Falha ao persistir configurações de webhooks no banco de dados.");
  }
}

export interface PostMessagePayload {
  title?: string;
  description: string;
  imageUrl?: string;
  mention?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}

/**
 * Envia uma mensagem personalizada para o canal configurado no Webhook
 */
export async function postMessageToWebhookChannel(
  webhook: DiscordWebhook,
  messageData: PostMessagePayload,
  senderName: string = "Painel TWTools",
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<{ success: boolean; message: string }> {
  assertDeveloperAccess(user, profile, level);

  if (!webhook.channelId || !isValidDiscordId(webhook.channelId)) {
    return {
      success: false,
      message: "O ID do canal do servidor não é válido. Informe um ID de 17 a 20 dígitos.",
    };
  }

  if (!messageData.description || !messageData.description.trim()) {
    return {
      success: false,
      message: "O conteúdo da mensagem é obrigatório.",
    };
  }

  const embedColorInt = hexToInt(webhook.embedColor || "#10B981");

  const embedPayload: any = {
    description: messageData.description.trim(),
    color: embedColorInt,
    footer: {
      text: webhook.footerText || "Twin Wheels RP",
    },
  };

  if (messageData.title && messageData.title.trim()) {
    embedPayload.title = messageData.title.trim();
  }

  if (messageData.imageUrl && messageData.imageUrl.trim()) {
    embedPayload.image = { url: messageData.imageUrl.trim() };
  }

  if (webhook.showTimestamp !== false) {
    embedPayload.timestamp = true;
  }

  if (messageData.fields && messageData.fields.length > 0) {
    embedPayload.fields = messageData.fields;
  }

  const contentMention = messageData.mention || webhook.mentionRoles || undefined;

  try {
    // Envia o comando via Broadcast para o robô tw-bot despachar
    const dispatchChannel = supabase.channel("system-discord-webhook-dispatch");
    await dispatchChannel.send({
      type: "broadcast",
      event: "dispatch_post",
      payload: {
        webhookId: webhook.id,
        guildId: webhook.guildId,
        channelId: webhook.channelId,
        username: webhook.username || "Twin Wheels RP",
        avatarUrl: webhook.avatarUrl,
        content: contentMention,
        embed: embedPayload,
        sender: senderName,
        timestamp: Date.now(),
      },
    });

    // Registra na auditoria
    try {
      await logAuditAction("webhook_post_message", {
        webhookId: webhook.id,
        webhookName: webhook.name,
        guildId: webhook.guildId,
        channelId: webhook.channelId,
        title: messageData.title,
        sender: senderName,
        actor: profile?.nome || user?.email || "Desenvolvedor",
      });
    } catch {}

    return {
      success: true,
      message: `Mensagem enviada com sucesso para o canal (${webhook.channelId})!`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha ao transmitir mensagem: ${err?.message || err}`,
    };
  }
}

/**
 * Envia mensagem de teste para o canal do Webhook
 */
export async function testDiscordWebhookChannel(
  webhook: DiscordWebhook,
  senderName: string = "Desenvolvedor",
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<{ success: boolean; message: string }> {
  return postMessageToWebhookChannel(
    webhook,
    {
      title: `🧪 Teste de Conexão: ${webhook.name}`,
      description: `Esta é uma mensagem de teste enviada a partir do painel de gerenciamento de webhooks do **Twin Wheels RP**.\n\nSe você está visualizando esta mensagem, a integração com o Servidor e Canal está **100% funcional**!`,
      fields: [
        { name: "Servidor ID", value: `\`${webhook.guildId || "N/A"}\``, inline: true },
        { name: "Canal ID", value: `\`${webhook.channelId}\``, inline: true },
        { name: "Enviado por", value: senderName, inline: true },
      ],
    },
    senderName,
    user,
    profile,
    level
  );
}
