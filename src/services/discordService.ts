import { supabase } from "@/integrations/supabase/client";
import type { AppUser, Profile } from "@/lib/app-types";
import type { AppLevel } from "@/lib/permissions";
import { assertDeveloperAccess } from "@/services/devService";

export interface DiscordLogChannels {
  generalLogsChannelId?: string;
  generalLogsWebhookUrl?: string;
  stockMovementsChannelId?: string;
  stockMovementsWebhookUrl?: string;
  salesChannelId?: string;
  salesWebhookUrl?: string;
  cashFundChannelId?: string;
  cashFundWebhookUrl?: string;
  membersChannelId?: string;
  membersWebhookUrl?: string;
  goalsChannelId?: string;
  goalsWebhookUrl?: string;
  announcementsChannelId?: string;
  announcementsWebhookUrl?: string;
  systemChannelId?: string;
  systemWebhookUrl?: string;
}

export interface DiscordEnabledEvents {
  logins: boolean;
  stockMovements: boolean;
  sales: boolean;
  cashFund: boolean;
  members: boolean;
  roles: boolean;
  goals: boolean;
  announcements: boolean;
  forcePurge: boolean;
  systemErrors: boolean;
  pageViews: boolean;
}

export interface DiscordEmbedColors {
  sales: string;
  movements: string;
  cashFund: string;
  members: string;
  roles: string;
  goals: string;
  announcements: string;
  system: string;
  errors: string;
  logins: string;
}

export interface DiscordBotConfig {
  enabled: boolean;
  guildId: string;
  guildName: string;
  botToken?: string;
  clientId?: string;
  botStatusText?: string;
  botActivityType?: "Playing" | "Watching" | "Listening" | "Competing";
  logChannels: DiscordLogChannels;
  enabledEvents: DiscordEnabledEvents;
  embedColors: DiscordEmbedColors;
  sendViaWebhookFallback: boolean;
  footerText?: string;
  footerIconUrl?: string;
  botAvatarUrl?: string;
  serverIconUrl?: string;
}

export const DEFAULT_DISCORD_CONFIG: DiscordBotConfig = {
  enabled: true,
  guildId: "123456789012345678",
  guildName: "Twin Wheels RP",
  botStatusText: "Twin Wheels • Logs em Tempo Real",
  botActivityType: "Watching",
  sendViaWebhookFallback: true,
  footerText: "Twin Wheels RP • Sistema Integrado de Logs",
  footerIconUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
  botAvatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
  serverIconUrl: "",
  logChannels: {
    generalLogsChannelId: "",
    generalLogsWebhookUrl: "",
    stockMovementsChannelId: "",
    stockMovementsWebhookUrl: "",
    salesChannelId: "",
    salesWebhookUrl: "",
    cashFundChannelId: "",
    cashFundWebhookUrl: "",
    membersChannelId: "",
    membersWebhookUrl: "",
    goalsChannelId: "",
    goalsWebhookUrl: "",
    announcementsChannelId: "",
    announcementsWebhookUrl: "",
    systemChannelId: "",
    systemWebhookUrl: "",
  },
  enabledEvents: {
    logins: true,
    stockMovements: true,
    sales: true,
    cashFund: true,
    members: true,
    roles: true,
    goals: true,
    announcements: true,
    forcePurge: true,
    systemErrors: true,
    pageViews: false,
  },
  embedColors: {
    sales: "#10B981", // Emerald green
    movements: "#0284C7", // Sky blue
    cashFund: "#F59E0B", // Amber
    members: "#8B5CF6", // Purple
    roles: "#6366F1", // Indigo
    goals: "#EC4899", // Pink
    announcements: "#EAB308", // Yellow
    system: "#06B6D4", // Cyan
    errors: "#EF4444", // Red
    logins: "#10B981", // Emerald
  },
};

const DISCORD_CONFIG_STORAGE_KEY = "tw_discord_bot_config_v1";
const DISCORD_CONFIG_LEVEL = "system_discord_config";

/**
 * Carrega a configuração do Discord a partir do Supabase ou Cache Local
 */
export async function getDiscordBotConfig(): Promise<DiscordBotConfig> {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", DISCORD_CONFIG_LEVEL)
      .maybeSingle();

    if (!error && data?.permissions && typeof data.permissions === "object") {
      const dbConfig = data.permissions as unknown as Partial<DiscordBotConfig>;
      const merged: DiscordBotConfig = {
        ...DEFAULT_DISCORD_CONFIG,
        ...dbConfig,
        logChannels: {
          ...DEFAULT_DISCORD_CONFIG.logChannels,
          ...(dbConfig.logChannels || {}),
        },
        enabledEvents: {
          ...DEFAULT_DISCORD_CONFIG.enabledEvents,
          ...(dbConfig.enabledEvents || {}),
        },
        embedColors: {
          ...DEFAULT_DISCORD_CONFIG.embedColors,
          ...(dbConfig.embedColors || {}),
        },
      };

      try {
        localStorage.setItem(DISCORD_CONFIG_STORAGE_KEY, JSON.stringify(merged));
      } catch {}

      return merged;
    }
  } catch (err) {
    console.warn("Falha ao buscar discord_config no Supabase:", err);
  }

  // Fallback para localStorage
  try {
    const local = localStorage.getItem(DISCORD_CONFIG_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return {
        ...DEFAULT_DISCORD_CONFIG,
        ...parsed,
        logChannels: {
          ...DEFAULT_DISCORD_CONFIG.logChannels,
          ...(parsed.logChannels || {}),
        },
        enabledEvents: {
          ...DEFAULT_DISCORD_CONFIG.enabledEvents,
          ...(parsed.enabledEvents || {}),
        },
        embedColors: {
          ...DEFAULT_DISCORD_CONFIG.embedColors,
          ...(parsed.embedColors || {}),
        },
      };
    }
  } catch {}

  return DEFAULT_DISCORD_CONFIG;
}

/**
 * Salva a configuração do Discord no Supabase e no Cache Local
 */
export async function saveDiscordBotConfig(
  config: DiscordBotConfig,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  try {
    localStorage.setItem(DISCORD_CONFIG_STORAGE_KEY, JSON.stringify(config));

    // Salva no banco de dados Supabase na tabela role_permissions
    const { error } = await supabase.from("role_permissions").upsert(
      {
        level: DISCORD_CONFIG_LEVEL,
        nivel: DISCORD_CONFIG_LEVEL,
        permissions: config as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );

    if (error) {
      throw error;
    }

    // Dispara broadcast em tempo real para o tw-bot atualizar a memória imediatamente
    const channel = supabase.channel("system-discord-config-sync");
    await channel.send({
      type: "broadcast",
      event: "discord_config_updated",
      payload: config,
    });
  } catch (err: any) {
    console.error("Erro ao salvar configuração do Discord:", err);
    throw new Error(err.message || "Falha ao persistir configurações do Discord no banco de dados.");
  }
}

export interface DiscordEmbedPayload {
  title: string;
  description: string;
  color: number;
  timestamp: string;
  footer?: {
    text: string;
    icon_url?: string;
  };
  author?: {
    name: string;
    icon_url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

/**
 * Converte cor HEX (#10B981) para número inteiro aceito pela API do Discord
 */
export function hexToInt(hex: string): number {
  if (!hex) return 0x10b981;
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return isNaN(num) ? 0x10b981 : num;
}

/**
 * Envia um embed de teste para uma URL de Webhook do Discord
 */
export async function sendTestDiscordWebhook(
  webhookUrl: string,
  categoryName: string,
  embedColorHex: string,
  senderName: string = "Desenvolvedor"
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return {
      success: false,
      message: "URL do Webhook inválida. Certifique-se de colar a URL completa gerada no Discord.",
    };
  }

  const embed: DiscordEmbedPayload = {
    title: `🧪 Teste de Conexão: Canal de ${categoryName}`,
    description: `Este é um disparo de teste enviado diretamente do **Painel Dev da Twin Wheels** para validar a integração e formatação de logs em Embeds.`,
    color: hexToInt(embedColorHex),
    timestamp: new Date().toISOString(),
    author: {
      name: `Disparado por ${senderName}`,
      icon_url: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
    },
    fields: [
      {
        name: "🏷️ Categoria",
        value: `\`${categoryName}\``,
        inline: true,
      },
      {
        name: "⚡ Status",
        value: "`Online & Operacional`",
        inline: true,
      },
      {
        name: "🌐 Origem",
        value: "`Twin Wheels Web App (Dev Panel)`",
        inline: true,
      },
      {
        name: "🎨 Cor do Embed",
        value: `\`${embedColorHex}\``,
        inline: true,
      },
      {
        name: "📅 Horário Local",
        value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
        inline: true,
      },
    ],
    footer: {
      text: "Twin Wheels RP • Sistema de Logs & Auditoria",
      icon_url: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "Twin Wheels Bot",
        avatar_url: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
        embeds: [embed],
      }),
    });

    if (response.ok || response.status === 204) {
      return {
        success: true,
        message: "Embed de teste entregue com sucesso no canal do Discord!",
      };
    } else {
      const text = await response.text();
      return {
        success: false,
        message: `O Discord recusou a requisição (${response.status}): ${text || "Verifique as permissões do Webhook"}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao disparar requisição HTTP para o Discord: ${err?.message || err}`,
    };
  }
}
