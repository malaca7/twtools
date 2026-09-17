export type StreamPlatform = "twitch" | "kick" | "youtube" | "tiktok";

export interface PlatformMeta {
  id: StreamPlatform;
  name: string;
  badgeColor: string;
  badgeBg: string;
  borderColor: string;
  brandHex: string;
  domainUrl: string;
  placeholder: string;
  helperText: string;
}

export const STREAM_PLATFORMS: Record<StreamPlatform, PlatformMeta> = {
  twitch: {
    id: "twitch",
    name: "Twitch",
    badgeColor: "text-purple-400",
    badgeBg: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    brandHex: "#9146FF",
    domainUrl: "https://twitch.tv/",
    placeholder: "Ex: nome_do_canal ou twitch.tv/nome_do_canal",
    helperText: "Informe seu nome de usuário da Twitch ou link direto do canal.",
  },
  kick: {
    id: "kick",
    name: "Kick",
    badgeColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    brandHex: "#53FC18",
    domainUrl: "https://kick.com/",
    placeholder: "Ex: streamer_rp ou kick.com/streamer_rp",
    helperText: "Informe seu slug/usuário oficial do Kick.",
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    badgeColor: "text-rose-400",
    badgeBg: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    brandHex: "#FF0000",
    domainUrl: "https://youtube.com/",
    placeholder: "Ex: @CanalDoStreamer ou youtube.com/@CanalDoStreamer",
    helperText: "Informe seu identificador (@handle) ou link completo do seu canal.",
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    badgeColor: "text-cyan-400",
    badgeBg: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    brandHex: "#00F2FE",
    domainUrl: "https://tiktok.com/@",
    placeholder: "Ex: @usuario_tiktok ou tiktok.com/@usuario_tiktok",
    helperText: "Informe seu @ do TikTok.",
  },
};

export interface MemberStreamAccount {
  id: string;
  user_id: string;
  platform: StreamPlatform;
  channel_name: string;
  channel_url: string;
  channel_id?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  oauth_data?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // Campos enriquecidos pelo join com profiles
  streamer_name?: string;
  streamer_nickname?: string;
  streamer_game_id?: string;
  streamer_role?: string;
  streamer_avatar?: string;
}

export interface StreamSession {
  id: string;
  stream_account_id?: string | null;
  user_id?: string | null;
  platform: StreamPlatform;
  channel_name: string;
  streamer_name: string;
  streamer_avatar?: string | null;
  title?: string | null;
  category?: string | null;
  thumbnail_url?: string | null;
  stream_url: string;
  external_stream_id?: string | null;
  is_live: boolean;
  started_at: string;
  ended_at?: string | null;
  last_checked_at: string;
  viewer_count: number;
  peak_viewers: number;
  notification_sent: boolean;
  notified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberStreamPreferences {
  user_id: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  notify_platforms: StreamPlatform[];
  created_at?: string;
  updated_at?: string;
}

export interface PlatformConfigItem {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  pollingIntervalSeconds: number;
}

export interface StreamSystemConfig {
  id: number;
  platforms: {
    twitch: PlatformConfigItem;
    kick: PlatformConfigItem;
    youtube: PlatformConfigItem;
    tiktok: PlatformConfigItem;
    [key: string]: PlatformConfigItem;
  };
  global_polling_interval_seconds: number;
  discord_announcements_channel_id: string;
  discord_announcements_enabled: boolean;
  notify_in_app: boolean;
  updated_at: string;
  updated_by?: string | null;
}

export interface StreamIntegrationLog {
  id: string;
  platform: string;
  event_type: "poll" | "live_start" | "live_end" | "error" | "webhook" | "simulated_live";
  status: "success" | "warning" | "error" | "info";
  streamer_name?: string | null;
  message: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface LinkStreamAccountPayload {
  platform: StreamPlatform;
  channelInput: string;
  display_name?: string;
  avatar_url?: string;
}

export function cleanChannelInput(platform: StreamPlatform, input: string): { channel_name: string; channel_url: string } {
  const trimmed = input.trim();
  let cleanName = trimmed;

  // Remove URLs conhecidas se o usuário colou o link completo
  cleanName = cleanName
    .replace(/^https?:\/\/(?:www\.)?twitch\.tv\//i, "")
    .replace(/^https?:\/\/(?:www\.)?kick\.com\//i, "")
    .replace(/^https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|user\/|channel\/)?/i, "")
    .replace(/^https?:\/\/(?:www\.)?tiktok\.com\/(?:@)?/i, "")
    .replace(/[/?#].*$/, "") // Remove query params ou subpaths
    .trim();

  // Para YouTube e TikTok, normaliza handle com @
  if (platform === "youtube" || platform === "tiktok") {
    if (!cleanName.startsWith("@") && !cleanName.startsWith("UC")) {
      cleanName = `@${cleanName}`;
    }
  } else {
    // Para Twitch e Kick, remove @ se digitado
    cleanName = cleanName.replace(/^@/, "").toLowerCase();
  }

  let finalUrl = "";
  switch (platform) {
    case "twitch":
      finalUrl = `https://twitch.tv/${cleanName}`;
      break;
    case "kick":
      finalUrl = `https://kick.com/${cleanName}`;
      break;
    case "youtube":
      finalUrl = cleanName.startsWith("UC")
        ? `https://youtube.com/channel/${cleanName}`
        : `https://youtube.com/${cleanName}`;
      break;
    case "tiktok":
      finalUrl = `https://tiktok.com/${cleanName.startsWith("@") ? cleanName : `@${cleanName}`}/live`;
      break;
  }

  return {
    channel_name: cleanName,
    channel_url: finalUrl,
  };
}
