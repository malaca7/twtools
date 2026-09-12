import { supabase } from "@/integrations/supabase/client";
import type { AppUser, Profile } from "@/lib/app-types";
import type { AppLevel } from "@/lib/permissions";
import { logAuditAction } from "@/lib/app-api";
import {
  getDiscordBotConfig,
  saveDiscordBotConfig,
  type DiscordBotConfig,
} from "@/services/discordService";

export interface BotHeartbeatData {
  status: "online" | "idle" | "dnd" | "offline";
  uptimeSeconds: number;
  pingMs: number;
  guildCount: number;
  memberCount?: number;
  memoryMb?: number;
  botTag?: string;
  botId?: string;
  timestamp: string;
}

export interface DiscordUserValidationResult {
  valid: boolean;
  user?: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    banner?: string;
    bot?: boolean;
    flags?: number;
  };
  error?: string;
}

export const BANNER_PRESETS = [
  {
    name: "Cyber Neon City",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1600&auto=format&fit=crop",
    previewColor: "#8B5CF6",
  },
  {
    name: "Dark Carbon & Tech",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop",
    previewColor: "#1E293B",
  },
  {
    name: "Emerald Grid",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1600&auto=format&fit=crop",
    previewColor: "#10B981",
  },
  {
    name: "Midnight Motor Racing",
    url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1600&auto=format&fit=crop",
    previewColor: "#EF4444",
  },
  {
    name: "Deep Space Aurora",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop",
    previewColor: "#0284C7",
  },
  {
    name: "Redline Speed",
    url: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1600&auto=format&fit=crop",
    previewColor: "#F43F5E",
  },
];

/**
 * Valida um token de bot do Discord diretamente contra a API oficial /users/@me
 */
export async function validateDiscordBotToken(token: string): Promise<DiscordUserValidationResult> {
  const cleanToken = token ? token.trim().replace(/^Bot\s+/i, "") : "";
  if (!cleanToken || cleanToken.length < 20) {
    return {
      valid: false,
      error: "O token fornecido parece ser muito curto ou inválido.",
    };
  }

  try {
    const res = await fetch("https://discord.com/api/v10/users/@me", {
      headers: {
        Authorization: `Bot ${cleanToken}`,
      },
    });

    if (res.status === 200) {
      const userData = await res.json();
      return {
        valid: true,
        user: {
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator,
          avatar: userData.avatar
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
            : undefined,
          banner: userData.banner
            ? `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.png?size=1024`
            : undefined,
          bot: userData.bot,
          flags: userData.flags,
        },
      };
    } else if (res.status === 401) {
      return {
        valid: false,
        error: "Não autorizado (401). O token do bot está incorreto ou foi revogado no Discord Developer Portal.",
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        valid: false,
        error: errData.message || `A API do Discord retornou código HTTP ${res.status}.`,
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      error: err?.message || "Não foi possível conectar à API do Discord (problema de rede/CORS).",
    };
  }
}

/**
 * Gera URL de convite OAuth2 com permissões de Administrador (ou customizadas)
 */
export function generateBotInviteUrl(clientId?: string, permissions: string = "8"): string {
  const id = clientId && clientId.trim().length > 5 ? clientId.trim() : "1536184283197079622";
  return `https://discord.com/oauth2/authorize?client_id=${id}&scope=bot%20applications.commands&permissions=${permissions}`;
}

/**
 * Gera atalho direto para a página do bot no Discord Developer Portal
 */
export function getDeveloperPortalUrl(clientId?: string): string {
  const id = clientId && clientId.trim().length > 5 ? clientId.trim() : "1536184283197079622";
  return `https://discord.com/developers/applications/${id}/bot`;
}

/**
 * Envia um comando de ciclo de vida para o bot (start, stop, restart)
 * atualizando o banco de dados, disparando realtime broadcast e acionando a Discloud API caso configurada.
 */
export async function sendBotLifecycleCommand(
  action: "start" | "stop" | "restart",
  config: DiscordBotConfig,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<{ success: boolean; message: string; discloudStatus?: string }> {
  const now = new Date().toISOString();
  const updatedConfig: DiscordBotConfig = {
    ...config,
    isBotRunning: action === "stop" ? false : true,
    lastStartedAt: action === "start" ? now : config.lastStartedAt,
    lastStoppedAt: action === "stop" ? now : config.lastStoppedAt,
    lastRestartedAt: action === "restart" ? now : config.lastRestartedAt,
  };

  // 1. Salva a nova configuração persistente no Supabase
  await saveDiscordBotConfig(updatedConfig, user, profile, level);

  // 2. Dispara broadcast imediato no canal do bot
  try {
    const controlChannel = supabase.channel("system-discord-bot-control");
    await controlChannel.send({
      type: "broadcast",
      event: "bot_command",
      payload: {
        action,
        timestamp: Date.now(),
        actor: profile?.nome || user?.email || "Desenvolvedor",
        config: {
          botStatus: updatedConfig.botStatus,
          botStatusText: updatedConfig.botStatusText,
          botActivityType: updatedConfig.botActivityType,
          intentPresences: updatedConfig.intentPresences,
          intentGuildMembers: updatedConfig.intentGuildMembers,
          intentMessageContent: updatedConfig.intentMessageContent,
        },
      },
    });
  } catch (bcErr) {
    console.warn("Falha ao emitir broadcast de comando do bot:", bcErr);
  }

  // 3. Se houver Token da Discloud e App ID, tenta acionar a API da Discloud
  let discloudMessage = "";
  if (config.discloudApiToken && config.discloudApiToken.trim().length > 10) {
    const appId = config.discloudAppId || "twin";
    try {
      const endpoint = `https://api.discloud.app/v2/app/${encodeURIComponent(appId)}/${action}`;
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "api-token": config.discloudApiToken.trim(),
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const discloudData = await res.json();
        discloudMessage = ` (Discloud: ${discloudData.message || "Comando enviado à nuvem"})`;
      } else {
        const errJson = await res.json().catch(() => ({}));
        discloudMessage = ` (Discloud aviso: ${errJson.message || `HTTP ${res.status}`})`;
      }
    } catch (dErr: any) {
      discloudMessage = ` (Discloud aviso: ${dErr.message || "Erro de conexão"})`;
    }
  }

  // 4. Registra log de auditoria
  try {
    await logAuditAction(`bot_${action}`, {
      action,
      botName: updatedConfig.botName || "Roda Dupla",
      botId: updatedConfig.clientId || "1536184283197079622",
      discloudAppId: updatedConfig.discloudAppId,
      actor: profile?.nome || user?.email || "Desenvolvedor",
      timestamp: now,
    });
  } catch {}

  const actionLabels = {
    start: "Bot ligado e inicializado com sucesso!",
    stop: "Bot pausado/desligado com sucesso.",
    restart: "Comando de reinicialização enviado com sucesso!",
  };

  return {
    success: true,
    message: `${actionLabels[action]}${discloudMessage}`,
  };
}

/**
 * Escuta batimentos cardíacos (Heartbeat) emitidos pelo bot em tempo real
 */
export function subscribeToBotHeartbeat(onHeartbeat: (data: BotHeartbeatData) => void) {
  const channel = supabase
    .channel("system-discord-bot-heartbeat")
    .on("broadcast", { event: "heartbeat" }, (payload) => {
      if (payload?.payload) {
        onHeartbeat(payload.payload as BotHeartbeatData);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Faz upload de imagem de avatar ou banner do bot para o Supabase Storage
 */
export async function uploadBotImage(file: File, type: "avatar" | "banner" = "avatar"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const cleanExt = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? ext : "png";
  const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
  const fileName = `bot/${type}_${Date.now()}_${sanitized}`;

  let uploadRes = await supabase.storage.from("products").upload(fileName, file, {
    cacheControl: "31536000",
    upsert: true,
    contentType: file.type || `image/${cleanExt}`,
  });

  if (uploadRes.error) {
    uploadRes = await supabase.storage.from("chat-attachments").upload(fileName, file, {
      cacheControl: "31536000",
      upsert: true,
      contentType: file.type || `image/${cleanExt}`,
    });
    if (uploadRes.error) {
      throw new Error(`Falha ao fazer upload da imagem: ${uploadRes.error.message}`);
    }
    const { data: pubData } = supabase.storage.from("chat-attachments").getPublicUrl(uploadRes.data.path);
    return pubData.publicUrl;
  }

  const { data: pubData } = supabase.storage.from("products").getPublicUrl(uploadRes.data.path);
  return pubData.publicUrl;
}
