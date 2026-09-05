import { supabase } from "@/integrations/supabase/client";
import type { AppUser, Profile } from "@/lib/app-types";
import type { AppLevel } from "@/lib/permissions";
import { assertDeveloperAccess } from "@/services/devService";

export interface DiscordLogChannels {
  generalLogsChannelId?: string;
  stockMovementsChannelId?: string;
  salesChannelId?: string;
  cashFundChannelId?: string;
  membersChannelId?: string;
  goalsChannelId?: string;
  announcementsChannelId?: string;
  systemChannelId?: string;
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
  footerText?: string;
  footerIconUrl?: string;
  botAvatarUrl?: string;
  serverIconUrl?: string;
}

export const DEFAULT_DISCORD_CONFIG: DiscordBotConfig = {
  enabled: true,
  guildId: "",
  guildName: "Twin Wheels RP",
  botStatusText: "Twin Wheels • Logs em Tempo Real",
  botActivityType: "Watching",
  footerText: "Twin Wheels RP • Sistema Integrado de Logs",
  footerIconUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
  botAvatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
  serverIconUrl: "",
  logChannels: {
    generalLogsChannelId: "",
    stockMovementsChannelId: "",
    salesChannelId: "",
    cashFundChannelId: "",
    membersChannelId: "",
    goalsChannelId: "",
    announcementsChannelId: "",
    systemChannelId: "",
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
 * Dispara um embed de teste diretamente através do Bot oficial (sem necessidade de webhook)
 */
export async function triggerDiscordBotTestEmbed(
  categoryKey: keyof DiscordLogChannels,
  categoryName: string,
  targetChannelId: string,
  senderName: string = "Desenvolvedor",
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<{ success: boolean; message: string }> {
  assertDeveloperAccess(user, profile, level);

  if (!targetChannelId || targetChannelId.trim().length < 5) {
    return {
      success: false,
      message: `Informe um ID de Canal válido do Discord para a categoria "${categoryName}".`,
    };
  }

  try {
    const payload = {
      action: "test_discord_log",
      entity: "discord_channel_test",
      entity_id: targetChannelId,
      user_id: user?.id || null,
      created_at: new Date().toISOString(),
      new_data: {
        category_key: categoryKey,
        category_name: categoryName,
        channel_id: targetChannelId,
        user_name: senderName,
        user_nickname: profile?.nickname || profile?.nome || senderName,
        discord_id: profile?.discord_id || null,
        notes: `Disparo de teste efetuado via Painel Dev para o canal #${categoryName} (ID: ${targetChannelId}).`,
      },
    };

    // 1. Registra no audit_logs para que o listener Realtime do tw-bot envie imediatamente
    const { error: insertError } = await supabase.from("audit_logs").insert(payload as any);

    if (insertError) {
      console.warn("Aviso ao registrar log de teste em audit_logs:", insertError.message);
    }

    // 2. Envia também via Broadcast Realtime direto para o tw-bot
    const broadcastChannel = supabase.channel("system-discord-test-trigger");
    await broadcastChannel.send({
      type: "broadcast",
      event: "trigger_test_embed",
      payload,
    });

    return {
      success: true,
      message: `Embed de teste transmitido com sucesso para o Bot no canal #${categoryName} (ID: ${targetChannelId})!`,
    };
  } catch (err: any) {
    console.error("Erro ao disparar teste do Bot Discord:", err);
    return {
      success: false,
      message: `Falha ao disparar teste para o bot: ${err?.message || err}`,
    };
  }
}
