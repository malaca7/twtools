import { supabase } from "@/integrations/supabase/client";
import type { BotProject } from "./types";
import {
  DEFAULT_DISCORD_CONFIG,
  getDiscordBotConfig,
  saveDiscordBotConfig,
  type DiscordBotConfig,
} from "@/services/discordService";
import {
  getBotProjects,
  saveBotProjects,
  DEFAULT_BOT_PROJECT,
  BOT_SYNC_EVENT,
} from "./botService";

const BOTS_STORAGE_KEY = "tw_bot_projects_v1";
const DISCORD_CONFIG_STORAGE_KEY = "tw_discord_bot_config_v1";

let isSyncing = false;

/**
 * Propaga alterações de configuração de Gerenciar Bot / Canais para os Projetos da Bot Engine
 * (Dashboard, Studio & Builder, Meus Bots)
 */
export async function syncDiscordConfigToBotProjects(
  discordConfig: Partial<DiscordBotConfig>
): Promise<BotProject[]> {
  if (isSyncing) {
    const raw = typeof window !== "undefined" ? localStorage.getItem(BOTS_STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [DEFAULT_BOT_PROJECT];
  }

  isSyncing = true;
  try {
    const bots = await getBotProjects();
    const updated = bots.map((b, idx) => {
      // Sincroniza com o bot principal / em foco
      if (idx === 0 || b.id === "bot_twin_wheels_official") {
        return {
          ...b,
          name: discordConfig.botName?.trim() || b.name,
          avatarUrl: discordConfig.botAvatarUrl?.trim() || b.avatarUrl,
          guildId: discordConfig.guildId?.trim() || b.guildId,
          applicationId: discordConfig.clientId?.trim() || b.applicationId,
          enabled: discordConfig.enabled !== undefined ? discordConfig.enabled : b.enabled,
          status: discordConfig.isBotRunning ? "online" : "offline",
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    });

    if (typeof window !== "undefined") {
      localStorage.setItem(BOTS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(BOT_SYNC_EVENT, { detail: updated }));
    }

    // Persiste no Supabase
    try {
      await supabase.from("role_permissions").upsert(
        {
          level: "system_bots_v1",
          nivel: "system_bots_v1",
          permissions: updated as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "level" }
      );
    } catch {}

    return updated;
  } finally {
    isSyncing = false;
  }
}

/**
 * Propaga alterações feitas em Meus Bots / Bot Studio & Builder para a configuração oficial do Discord
 * (Gerenciar Bot, Webhooks Discord, Canais & Logs)
 */
export async function syncBotProjectToDiscordConfig(
  bot: BotProject,
  user?: any,
  profile?: any,
  level?: any
): Promise<DiscordBotConfig> {
  if (isSyncing) {
    return await getDiscordBotConfig();
  }

  isSyncing = true;
  try {
    const currentDiscord = await getDiscordBotConfig();
    const updatedDiscord: DiscordBotConfig = {
      ...currentDiscord,
      botName: bot.name?.trim() || currentDiscord.botName,
      botAvatarUrl: bot.avatarUrl?.trim() || currentDiscord.botAvatarUrl,
      guildId: bot.guildId?.trim() || currentDiscord.guildId,
      clientId: bot.applicationId?.trim() || currentDiscord.clientId,
      enabled: bot.enabled !== undefined ? bot.enabled : currentDiscord.enabled,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(DISCORD_CONFIG_STORAGE_KEY, JSON.stringify(updatedDiscord));
      window.dispatchEvent(new CustomEvent("tw_discord_config_updated", { detail: updatedDiscord }));
    }

    // Persiste no Supabase
    try {
      await supabase.from("role_permissions").upsert(
        {
          level: "system_discord_config",
          nivel: "system_discord_config",
          permissions: updatedDiscord as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "level" }
      );
    } catch {}

    return updatedDiscord;
  } finally {
    isSyncing = false;
  }
}

/**
 * Reconcilia na inicialização para garantir paridade total entre o bot oficial da nuvem e o Studio
 */
export async function reconcileBotConfigurations(): Promise<{
  bots: BotProject[];
  discordConfig: DiscordBotConfig;
}> {
  const [bots, discordConfig] = await Promise.all([
    getBotProjects(),
    getDiscordBotConfig(),
  ]);

  let changed = false;
  const primaryBot = bots[0] || DEFAULT_BOT_PROJECT;

  // Se o DiscordBotConfig tiver nome ou avatar oficial, adotamos no bot principal se não tiver
  const reconciledBots = bots.map((b, idx) => {
    if (idx === 0) {
      let bCopy = { ...b };
      if (discordConfig.botName && discordConfig.botName !== b.name) {
        bCopy.name = discordConfig.botName;
        changed = true;
      }
      if (discordConfig.botAvatarUrl && discordConfig.botAvatarUrl !== b.avatarUrl) {
        bCopy.avatarUrl = discordConfig.botAvatarUrl;
        changed = true;
      }
      if (discordConfig.guildId && (!b.guildId || b.guildId === "1535505650308620400")) {
        bCopy.guildId = discordConfig.guildId;
        changed = true;
      }
      if (discordConfig.clientId && (!b.applicationId || b.applicationId === "1548413371194286314")) {
        bCopy.applicationId = discordConfig.clientId;
        changed = true;
      }
      if (discordConfig.isBotRunning !== undefined) {
        bCopy.status = discordConfig.isBotRunning ? "online" : "offline";
      }
      return bCopy;
    }
    return b;
  });

  if (changed) {
    if (typeof window !== "undefined") {
      localStorage.setItem(BOTS_STORAGE_KEY, JSON.stringify(reconciledBots));
      window.dispatchEvent(new CustomEvent(BOT_SYNC_EVENT, { detail: reconciledBots }));
    }
  }

  return {
    bots: reconciledBots,
    discordConfig,
  };
}
