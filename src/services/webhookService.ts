import { supabase } from "@/integrations/supabase/client";
import type { AppUser, Profile } from "@/lib/app-types";
import type { AppLevel } from "@/lib/permissions";
import { assertDeveloperAccess, assertDeveloperOrCeoAccess } from "@/services/devService";
import { logAuditAction } from "@/lib/app-api";

export interface DiscordWebhook {
  id: string;
  name: string; // Nome do Webhook / Postador (ex: "TW | Logs Baú QG", "Canal de Postagens")
  guildId: string; // ID do Servidor Discord
  channelId: string; // ID do Canal Discord
  description?: string; // Descrição / Finalidade
  enabled: boolean;
  webhookUrl?: string; // URL Oficial do Webhook Discord aceita pelo Discohook e FiveM

  // Identidade do Emissor
  username?: string; // Nome personalizado do bot ao enviar mensagens
  avatarUrl?: string; // URL do avatar do bot

  // Cores & Design do Embed
  embedColor?: string; // Cor do embed em HEX (ex: #10B981)

  // Configurações Padrões da Mensagem e Embed
  defaultTitle?: string; // Título padrão do embed (ex: "💻 Teste Desenvolvedor")
  defaultDescription?: string; // Subtítulo / descrição padrão (ex: "by malaca")
  useCodeblockField?: boolean; // Se deve renderizar mensagem em caixa de código em destaque
  codeblockLanguage?: string; // Linguagem opcional do codeblock

  authorName?: string; // Nome do autor no topo do embed
  authorIconUrl?: string; // Ícone do autor
  authorUrl?: string; // Link clicável no autor

  thumbnailUrl?: string; // Miniatura no canto superior direito do embed
  imageUrl?: string; // Imagem grande / Banner decorativo no corpo do embed

  footerText?: string; // Texto do rodapé
  footerIconUrl?: string; // Ícone do rodapé
  showTimestamp?: boolean; // Exibir data/hora no rodapé

  mentionRoles?: string; // Menções padrão (ex: @everyone, @here ou ID de cargo)

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
  defaultGuildId: "1535505650308620400",
  defaultUsername: "Twin Wheels RP",
  defaultAvatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
  defaultFooterText: "Twin Wheels RP • Canal de Mensagens",
  updatedAt: new Date().toISOString(),
  webhooks: [
    {
      id: "webhook_1789248648283",
      name: "TW | Logs de Baú QG",
      guildId: "1535505650308620400",
      channelId: "1535637509818548234",
      webhookUrl: "https://discord.com/api/webhooks/1548409284000485420/AoRhvOaaA-yNUdWHcV-TZUNx4gOLxWFddthfe3kfHKpycQ2SmyaUsQiSNTnagelHzlsR",
      description: "Logs de Baú QG",
      enabled: true,
      username: "Twin Wheels",
      avatarUrl: "https://adgdivossyzpwofouhrh.supabase.co/storage/v1/object/public/products/webhooks/avatar_1789248677469_twin_wheell.png",
      embedColor: "#008FFD",
      footerText: "Twin Wheels • Logs de Baú QG",
      thumbnailUrl: "https://adgdivossyzpwofouhrh.supabase.co/storage/v1/object/public/products/webhooks/avatar_1789248796551_twin_wheell.png",
      showTimestamp: true,
      mentionRoles: "@everyone",
      defaultTitle: "💻 Teste Desenvolvedor",
      defaultDescription: "by malaca",
      useCodeblockField: true,
      createdAt: "2026-09-12T21:30:48.283Z",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "webhook_tw_testedev",
      name: "Canal Teste Dev (Twin Wheel)",
      guildId: "1535505650308620400",
      channelId: "1548413371194286314",
      webhookUrl: "https://discord.com/api/webhooks/1548433124801904760/dhzOLP652m1UZfuQ3MwYViMl3Pk0byMgTP5D1x6rUzlPEXolXQuVtdmkS_n9z7O1rNY6",
      description: "Canal oficial do grupo Twin Wheel para testes e validações de dev",
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
    {
      id: "webhook_tw_batepapo",
      name: "Bate-Papo Geral (Twin Wheel)",
      guildId: "1535505650308620400",
      channelId: "1535637119471587408",
      webhookUrl: "https://discord.com/api/webhooks/1548436113092517948/q9QhwHYZC5UBOtaZgT2iqHM2vlH-UFT7c2lO_yZL9OEzTvXSq4qQVjxiRMdj9gyy1vVO",
      description: "Canal principal de interação e comunicados do grupo Twin Wheel",
      enabled: true,
      username: "Twin Wheels RP",
      avatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      embedColor: "#8B5CF6",
      mentionRoles: "",
      footerText: "Twin Wheels RP",
      showTimestamp: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "webhook_tw_avisos",
      name: "Avisos Oficiais (Twin Wheel)",
      guildId: "1535505650308620400",
      channelId: "1535505650920984628",
      webhookUrl: "https://discord.com/api/webhooks/1548436161108774912/MNtUgj9lWo6h_RlJuDXpfwefbSe7d6_pEDSxqZLbDE9kS-UQ3xv5s0xREH-eFTGe9SfI",
      description: "Canal de avisos importantes e comunicados da liderança",
      enabled: true,
      username: "Twin Wheels RP",
      avatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      embedColor: "#EF4444",
      mentionRoles: "",
      footerText: "Twin Wheels RP",
      showTimestamp: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "webhook_default_general",
      name: "Canal Geral (Malaca Devs)",
      guildId: "1537229296697999462",
      channelId: "1538375505953165312",
      webhookUrl: "https://discord.com/api/webhooks/1548427834303971380/OTvHNGi-REvB-JuI-zQ8wSQqN25NpmnkeNPTWMNYvjohHlsQAHUc5ILNGl8p3bIy22Mn",
      description: "Canal integrado para testes e postagens no servidor de desenvolvimento",
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
 * Valida se uma URL é um link oficial de Webhook do Discord (compatível com Discohook)
 */
export function isDiscordWebhookUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  return /^https:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/i.test(url.trim());
}

/**
 * Valida se uma string é um ID numérico snowflake legítimo do Discord (17 a 20 dígitos)
 */
export function isValidDiscordId(id?: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^\d{17,20}$/.test(id.trim());
}

// Mapeamentos conhecidos de canais para webhooks oficiais provisionados
export const KNOWN_CHANNEL_WEBHOOKS: Record<string, string> = {
  // Twin Wheel - testedev
  "1548413371194286314": "https://discord.com/api/webhooks/1548433124801904760/dhzOLP652m1UZfuQ3MwYViMl3Pk0byMgTP5D1x6rUzlPEXolXQuVtdmkS_n9z7O1rNY6",
  // Twin Wheel - bate-papo
  "1535637119471587408": "https://discord.com/api/webhooks/1548436113092517948/q9QhwHYZC5UBOtaZgT2iqHM2vlH-UFT7c2lO_yZL9OEzTvXSq4qQVjxiRMdj9gyy1vVO",
  // Twin Wheel - avisos
  "1535505650920984628": "https://discord.com/api/webhooks/1548436161108774912/MNtUgj9lWo6h_RlJuDXpfwefbSe7d6_pEDSxqZLbDE9kS-UQ3xv5s0xREH-eFTGe9SfI",
  // Twin Wheel - baus
  "1535637509818548234": "https://discord.com/api/webhooks/1548409284000485420/AoRhvOaaA-yNUdWHcV-TZUNx4gOLxWFddthfe3kfHKpycQ2SmyaUsQiSNTnagelHzlsR",
  // malaca developers - geral
  "1538375505953165312": "https://discord.com/api/webhooks/1548427834303971380/OTvHNGi-REvB-JuI-zQ8wSQqN25NpmnkeNPTWMNYvjohHlsQAHUc5ILNGl8p3bIy22Mn",
};

/**
 * Retorna o link oficial do Webhook Discord compatível com Discohook, FiveM e bots
 */
export function getWebhookShareableUrl(webhook?: DiscordWebhook | null): string {
  if (!webhook) return "";
  if (webhook.webhookUrl && isDiscordWebhookUrl(webhook.webhookUrl)) {
    return webhook.webhookUrl.trim();
  }
  if (webhook.channelId && KNOWN_CHANNEL_WEBHOOKS[webhook.channelId]) {
    return KNOWN_CHANNEL_WEBHOOKS[webhook.channelId];
  }
  return `https://twin.discloud.app/webhook/${webhook.channelId || webhook.id}`;
}

/**
 * Retorna a URL alternativa do Postador Web no navegador
 */
export function getWebPosterUrl(webhook?: DiscordWebhook | null): string {
  if (!webhook) return "https://twin.discloud.app/webhook";
  return `https://twin.discloud.app/webhook/${webhook.channelId || webhook.id}`;
}

/**
 * Retorna o link para abrir diretamente no Discohook com a URL pré-preenchida
 */
export function getDiscohookUrl(webhook?: DiscordWebhook | null): string {
  const url = getWebhookShareableUrl(webhook);
  return `https://discohook.org/?url=${encodeURIComponent(url)}`;
}

/**
 * Solicita ao Bot que obtenha ou crie um Webhook oficial do Discord para o canal especificado
 */
export async function fetchOrCreateDiscordChannelWebhook(
  channelId: string,
  webhookName?: string
): Promise<{ success: boolean; webhookUrl?: string; error?: string }> {
  if (!isValidDiscordId(channelId)) {
    return { success: false, error: "ID de canal inválido." };
  }

  // Mapeamento instantâneo para canais já provisionados
  if (KNOWN_CHANNEL_WEBHOOKS[channelId]) {
    return {
      success: true,
      webhookUrl: KNOWN_CHANNEL_WEBHOOKS[channelId],
    };
  }

  // Tenta API direta do Discloud (bot gera ou obtém webhook oficial do canal)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://twin.discloud.app/api/webhook-url/${channelId}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);
    if (res.ok && data?.success && data?.webhookUrl) {
      return { success: true, webhookUrl: data.webhookUrl };
    }
    if (data?.error) {
      return { success: false, error: data.error };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.name === "AbortError"
        ? "Tempo limite esgotado ao contatar o bot no Discloud."
        : "Não foi possível conectar ao bot no Discloud no momento.",
    };
  }

  return { success: false, error: "Não foi possível obter o webhook oficial deste canal." };
}

/**
 * Realiza o upload de imagem de avatar do bot para o Supabase Storage
 */
export async function uploadWebhookAvatar(file: File): Promise<string> {
  // 1. Prioriza CDN Postimages (Zero consumo de storage e egress de banco)
  try {
    const { uploadImageToPostimages } = await import("@/services/postimagesService");
    const cdnUrl = await uploadImageToPostimages(file);
    if (cdnUrl) return cdnUrl;
  } catch (postErr) {
    console.warn("⚠️ Aviso ao subir avatar no Postimages CDN, usando fallback:", postErr);
  }

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
      const existingWebhooks = Array.isArray(dbConfig.webhooks)
        ? dbConfig.webhooks.map((w) => ({
            ...w,
            guildId: w.guildId || DEFAULT_WEBHOOKS_CONFIG.defaultGuildId,
            channelId: w.channelId || "",
          }))
        : [];

      const merged: DiscordWebhooksConfig = {
        ...DEFAULT_WEBHOOKS_CONFIG,
        ...dbConfig,
        webhooks: existingWebhooks,
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
      const parsedWebhooks = Array.isArray(parsed.webhooks)
        ? parsed.webhooks.map((w: any) => ({
            ...w,
            guildId: w.guildId || DEFAULT_WEBHOOKS_CONFIG.defaultGuildId,
            channelId: w.channelId || "",
          }))
        : [];

      return {
        ...DEFAULT_WEBHOOKS_CONFIG,
        ...parsed,
        webhooks: parsedWebhooks,
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
  assertDeveloperOrCeoAccess(user, profile, level, "webhook_save_config");

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

export interface DiscordEmbedData {
  title?: string;
  titleUrl?: string;
  description?: string;
  color?: string;
  useCodeblock?: boolean;
  authorName?: string;
  authorIconUrl?: string;
  authorUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  footerText?: string;
  footerIconUrl?: string;
  showTimestamp?: boolean;
  fields?: { name: string; value: string; inline?: boolean }[];
}

export interface PostMessagePayload {
  content?: string;
  username?: string;
  avatarUrl?: string;
  embeds?: DiscordEmbedData[];
  // Backwards compatibility for single embed:
  title?: string;
  titleUrl?: string;
  description?: string;
  color?: string;
  useCodeblock?: boolean;
  authorName?: string;
  authorIconUrl?: string;
  authorUrl?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  footerText?: string;
  footerIconUrl?: string;
  showTimestamp?: boolean;
  mention?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}

export interface WebhookDeliveryResult {
  success: boolean;
  message: string;
  messageId?: string;
  channelName?: string;
}

/**
 * Envia uma mensagem personalizada para o canal configurado no Webhook
 * com suporte completo a múltiplos embeds ricos estilo Discohook e entrega em tempo real.
 */
export async function postMessageToWebhookChannel(
  webhook: DiscordWebhook,
  messageData: PostMessagePayload,
  senderName: string = "Painel TWTools",
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<WebhookDeliveryResult> {
  assertDeveloperOrCeoAccess(user, profile, level, "webhook_send_message");

  if (!webhook.channelId || !isValidDiscordId(webhook.channelId)) {
    return {
      success: false,
      message: "O ID do canal do servidor não é válido. Informe um ID numérico de 17 a 20 dígitos.",
    };
  }

  // Normaliza múltiplos embeds ou compatibilidade com campos soltos de embed único
  const rawEmbeds: DiscordEmbedData[] =
    messageData.embeds && messageData.embeds.length > 0
      ? messageData.embeds
      : messageData.title ||
        messageData.description ||
        messageData.imageUrl ||
        messageData.thumbnailUrl ||
        messageData.authorName ||
        (messageData.fields && messageData.fields.length > 0)
      ? [
          {
            title: messageData.title,
            titleUrl: messageData.titleUrl,
            description: messageData.description,
            color: messageData.color,
            useCodeblock: messageData.useCodeblock,
            authorName: messageData.authorName,
            authorIconUrl: messageData.authorIconUrl,
            authorUrl: messageData.authorUrl,
            thumbnailUrl: messageData.thumbnailUrl,
            imageUrl: messageData.imageUrl,
            footerText: messageData.footerText,
            footerIconUrl: messageData.footerIconUrl,
            showTimestamp: messageData.showTimestamp,
            fields: messageData.fields,
          },
        ]
      : [];

  const cleanContent = messageData.content?.trim() || messageData.mention?.trim() || undefined;

  const hasAnyContent = Boolean(cleanContent || rawEmbeds.length > 0);

  if (!hasAnyContent) {
    return {
      success: false,
      message: "Informe ao menos o texto da mensagem ou configure pelo menos um embed.",
    };
  }

  const testId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const botUsername = messageData.username?.trim() || webhook.username || webhook.name || "Twin Wheels RP";
  const botAvatar = messageData.avatarUrl?.trim() || webhook.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png";

  // Formata a lista de embeds para o padrão da API do Discord (máximo 10)
  const discordEmbedsPayload = rawEmbeds.slice(0, 10).map((emb) => {
    const embColor = emb.color || webhook.embedColor || "#10B981";
    let desc = emb.description?.trim();
    const embFields = [...(emb.fields || [])];

    if (emb.useCodeblock && desc) {
      desc = `\`\`\`${webhook.codeblockLanguage || ""}\n${desc}\n\`\`\``;
    }

    return {
      title: emb.title?.trim() || undefined,
      url: emb.titleUrl?.trim() || undefined,
      description: desc || undefined,
      color: hexToInt(embColor),
      author: emb.authorName?.trim()
        ? {
            name: emb.authorName.trim(),
            icon_url: emb.authorIconUrl?.trim() || undefined,
            url: emb.authorUrl?.trim() || undefined,
          }
        : undefined,
      thumbnail: emb.thumbnailUrl?.trim() ? { url: emb.thumbnailUrl.trim() } : undefined,
      image: emb.imageUrl?.trim() ? { url: emb.imageUrl.trim() } : undefined,
      footer: emb.footerText?.trim()
        ? {
            text: emb.footerText.trim(),
            icon_url: emb.footerIconUrl?.trim() || undefined,
          }
        : undefined,
      timestamp: emb.showTimestamp !== false ? new Date().toISOString() : undefined,
      fields: embFields.length > 0 ? embFields : undefined,
    };
  });

  // Prepara o payload para o disparador em tempo real do Bot
  const firstEmb = rawEmbeds[0] || {};
  const botPayload = {
    test_id: testId,
    action: "create_announcement",
    entity: "discord_channel_test",
    entity_id: webhook.channelId,
    user_id: user?.id || null,
    created_at: new Date().toISOString(),
    new_data: {
      test_id: testId,
      channel_id: webhook.channelId,
      guild_id: webhook.guildId,
      title: firstEmb.title || "Comunicado Oficial",
      content: cleanContent || firstEmb.description,
      description: firstEmb.description,
      image_url: firstEmb.imageUrl,
      user_name: botUsername,
      user_nickname: botUsername,
      notes: cleanContent || firstEmb.description,
      embed_color: firstEmb.color || webhook.embedColor || "#10B981",
      fields: firstEmb.fields || [],
      mention: cleanContent,
      embeds: discordEmbedsPayload,
    },
  };

  // 1. TENTA ENVIO DIRETO AO WEBHOOK DO DISCORD (Resposta em milissegundos)
  const officialUrl = getWebhookShareableUrl(webhook);
  if (officialUrl && isDiscordWebhookUrl(officialUrl)) {
    try {
      const discordPayload: any = {
        username: botUsername,
        avatar_url: botAvatar,
        content: cleanContent || undefined,
        embeds: discordEmbedsPayload.length > 0 ? discordEmbedsPayload : undefined,
      };

      const res = await fetch(officialUrl + "?wait=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        try {
          logAuditAction("webhook_post_message", "webhooks", {
            webhookId: webhook.id,
            webhookName: webhook.name,
            guildId: webhook.guildId,
            channelId: webhook.channelId,
            title: firstEmb.title || "Postagem Webhook",
            hasImage: !!firstEmb.imageUrl,
            sender: senderName,
            actor: profile?.nome || user?.email || "Desenvolvedor",
          }).catch(() => {});
        } catch {}

        return {
          success: true,
          message: `Mensagem entregue com sucesso no canal Discord! (ID: ${data?.id || "OK"})`,
          messageId: data?.id,
          channelName: data?.channel_id,
        };
      }
    } catch (err) {
      console.warn("Falha no envio direto ao webhook Discord, tentando fallback...", err);
    }
  }

  // 2. TENTA ENVIO VIA ENDPOINT HTTP DO BOT DISCLOUD (twin.discloud.app/webhook/:channelId)
  if (webhook.channelId && isValidDiscordId(webhook.channelId)) {
    try {
      const botRes = await fetch(`https://twin.discloud.app/webhook/${webhook.channelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: firstEmb.title || "Comunicado Oficial",
          description: firstEmb.description || cleanContent || "",
          imageUrl: firstEmb.imageUrl,
          mention: cleanContent,
          color: firstEmb.color || webhook.embedColor,
          username: botUsername,
          avatarUrl: botAvatar,
          embeds: discordEmbedsPayload,
        }),
      });
      if (botRes.ok) {
        const botData = await botRes.json().catch(() => null);
        if (botData?.success) {
          return {
            success: true,
            message: botData.message || "Mensagem enviada com sucesso para o canal!",
            messageId: botData.messageId,
            channelName: botData.channelName,
          };
        }
      }
    } catch (err) {
      console.warn("Falha no envio via Discloud HTTP, tentando fallback Realtime...", err);
    }
  }

  // 3. FALLBACK VIA REALTIME BROADCAST DO BOT
  return new Promise((resolve) => {
    let hasResolved = false;

    // Timeout de segurança de 10 segundos
    const timeoutTimer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        resolve({
          success: false,
          message: `O Bot oficial não confirmou a entrega em 10 segundos. Verifique se o bot está online na Discloud e se possui permissão para ver e enviar mensagens no canal (${webhook.channelId}).`,
        });
      }
    }, 10000);

    // 1. Canal persistente de teste e comandos diretos do bot
    const testChannel = supabase.channel("system-discord-test-channel");
    testChannel
      .on("broadcast", { event: "test_result" }, (msg: any) => {
        if (msg?.payload?.test_id === testId && !hasResolved) {
          hasResolved = true;
          clearTimeout(timeoutTimer);

          if (msg.payload.success) {
            resolve({
              success: true,
              message: `Mensagem entregue com sucesso no canal #${msg.payload.channel_name || webhook.channelId}! (ID: ${msg.payload.message_id})`,
              messageId: msg.payload.message_id,
              channelName: msg.payload.channel_name,
            });
          } else {
            resolve({
              success: false,
              message: `Falha no Discord: ${msg.payload.error_message || "O bot não conseguiu postar a mensagem neste canal."}`,
            });
          }
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await testChannel.send({
            type: "broadcast",
            event: "trigger_test",
            payload: botPayload,
          });

          // Fallback no banco para poller contínuo do bot
          try {
            await supabase.from("audit_logs").insert(botPayload as any);
          } catch {}
        }
      });

    // 2. Canal de webhook dispatch para retrocompatibilidade
    const dispatchChannel = supabase.channel("system-discord-webhook-dispatch");
    dispatchChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        try {
          await dispatchChannel.send({
            type: "broadcast",
            event: "dispatch_post",
            payload: {
              webhookId: webhook.id,
              guildId: webhook.guildId,
              channelId: webhook.channelId,
              username: webhook.username || "Twin Wheels RP",
              avatarUrl: webhook.avatarUrl,
              content: cleanContent,
              embed: discordEmbedsPayload[0],
              sender: senderName,
              timestamp: Date.now(),
            },
          });
        } catch {}
      }
    });

    // Auditoria da ação
    try {
      logAuditAction("webhook_post_message", "webhooks", {
        webhookId: webhook.id,
        webhookName: webhook.name,
        guildId: webhook.guildId,
        channelId: webhook.channelId,
        title: firstEmb.title || "Postagem Webhook",
        hasImage: !!firstEmb.imageUrl,
        sender: senderName,
        actor: profile?.nome || user?.email || "Desenvolvedor",
      }).catch(() => {});
    } catch {}
  });
}

/**
 * Envia mensagem de teste com confirmação real de recebimento pelo Discord
 */
export async function testDiscordWebhookChannel(
  webhook: DiscordWebhook,
  senderName: string = "Desenvolvedor",
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<WebhookDeliveryResult> {
  assertDeveloperOrCeoAccess(user, profile, level, "webhook_test");

  if (!webhook.channelId || !isValidDiscordId(webhook.channelId)) {
    return {
      success: false,
      message: "O ID do canal do servidor não é válido. Informe um ID numérico de 17 a 20 dígitos.",
    };
  }

  // 1. TENTA TESTE DIRETO VIA DISCORD WEBHOOK NATIVO
  const officialUrl = getWebhookShareableUrl(webhook);
  if (officialUrl && isDiscordWebhookUrl(officialUrl)) {
    try {
      const testTitle = webhook.defaultTitle || `💻 Teste: ${webhook.name}`;
      const testDesc = webhook.defaultDescription || `by ${profile?.nome || senderName || "Desenvolvedor"}`;

      const testFields: any[] = [];
      if (webhook.useCodeblockField) {
        testFields.push({
          name: "\u200b",
          value: `\`\`\`${webhook.codeblockLanguage || ""}\nTestando webhook\n\`\`\``,
          inline: false,
        });
      } else {
        testFields.push({
          name: "Status do Webhook",
          value: `Conexão 100% confirmada no canal <#${webhook.channelId}>`,
          inline: false,
        });
      }

      const discordPayload: any = {
        username: webhook.username || webhook.name || "Twin Wheels RP",
        avatar_url: webhook.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
        content: webhook.mentionRoles || undefined,
        embeds: [
          {
            title: testTitle,
            description: testDesc,
            color: hexToInt(webhook.embedColor || "#10B981"),
            author: webhook.authorName
              ? {
                  name: webhook.authorName,
                  icon_url: webhook.authorIconUrl || webhook.avatarUrl,
                  url: webhook.authorUrl || undefined,
                }
              : undefined,
            thumbnail: webhook.thumbnailUrl ? { url: webhook.thumbnailUrl } : undefined,
            image: webhook.imageUrl ? { url: webhook.imageUrl } : undefined,
            footer: {
              text: webhook.footerText || "Twin Wheels RP • Teste de Conexão",
              icon_url: webhook.footerIconUrl || webhook.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
            },
            timestamp: webhook.showTimestamp !== false ? new Date().toISOString() : undefined,
            fields: testFields,
          },
        ],
      };

      const res = await fetch(officialUrl + "?wait=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        return {
          success: true,
          message: `✅ Teste entregue com sucesso no canal Discord! (ID da Mensagem: ${data?.id || "OK"})`,
          messageId: data?.id,
          channelName: data?.channel_id,
        };
      }
    } catch (err) {
      console.warn("Falha no envio direto do teste ao webhook Discord, tentando fallback...", err);
    }
  }

  const testId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const testPayload = {
    test_id: testId,
    action: "test_discord_log",
    entity: "discord_channel_test",
    entity_id: webhook.channelId,
    user_id: user?.id || null,
    created_at: new Date().toISOString(),
    new_data: {
      test_id: testId,
      category_key: "webhook_test",
      category_name: webhook.name || "Canal de Postagens",
      channel_id: webhook.channelId,
      guild_id: webhook.guildId,
      user_name: webhook.username || senderName,
      user_nickname: webhook.username || senderName,
      notes: `Disparo de teste do webhook "${webhook.name}". ID Servidor: ${webhook.guildId || "N/A"} | ID Canal: ${webhook.channelId}. Conexão 100% confirmada!`,
    },
  };

  return new Promise((resolve) => {
    let hasResolved = false;

    const timeoutTimer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        resolve({
          success: false,
          message: `O Bot oficial (tw-bot) não respondeu em 10 segundos. Certifique-se de que o bot está ligado na Discloud e tem permissão para visualizar e postar no canal (${webhook.channelId}).`,
        });
      }
    }, 10000);

    const testChannel = supabase.channel("system-discord-test-channel");

    testChannel
      .on("broadcast", { event: "test_result" }, (msg: any) => {
        if (msg?.payload?.test_id === testId && !hasResolved) {
          hasResolved = true;
          clearTimeout(timeoutTimer);

          if (msg.payload.success) {
            resolve({
              success: true,
              message: `✅ Teste entregue com sucesso no canal #${msg.payload.channel_name || webhook.channelId}! (ID da Mensagem: ${msg.payload.message_id})`,
              messageId: msg.payload.message_id,
              channelName: msg.payload.channel_name,
            });
          } else {
            resolve({
              success: false,
              message: `❌ Falha no Bot do Discord: ${msg.payload.error_message || "Erro ao postar mensagem no canal."}`,
            });
          }
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await testChannel.send({
            type: "broadcast",
            event: "trigger_test",
            payload: testPayload,
          });

          try {
            await supabase.from("audit_logs").insert(testPayload as any);
          } catch {}
        }
      });
  });
}

