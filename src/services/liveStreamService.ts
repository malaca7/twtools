import { supabase } from "@/integrations/supabase/client";
import { createNotification, broadcastNotificationsRealtimeUpdate } from "@/lib/notifications-api";
import {
  type MemberStreamAccount,
  type StreamSession,
  type MemberStreamPreferences,
  type StreamSystemConfig,
  type StreamIntegrationLog,
  type LinkStreamAccountPayload,
  type StreamPlatform,
  cleanChannelInput,
  STREAM_PLATFORMS,
} from "@/types/lives";

export const DEFAULT_STREAM_PREFERENCES: MemberStreamPreferences = {
  user_id: "",
  notifications_enabled: true,
  sound_enabled: true,
  notify_platforms: ["twitch", "kick", "youtube", "tiktok"],
};

export const DEFAULT_SYSTEM_CONFIG: StreamSystemConfig = {
  id: 1,
  platforms: {
    twitch: { enabled: true, clientId: "", clientSecret: "", pollingIntervalSeconds: 60 },
    kick: { enabled: true, pollingIntervalSeconds: 60 },
    youtube: { enabled: true, apiKey: "", pollingIntervalSeconds: 120 },
    tiktok: { enabled: true, pollingIntervalSeconds: 120 },
  },
  global_polling_interval_seconds: 60,
  discord_announcements_channel_id: "",
  discord_announcements_enabled: true,
  notify_in_app: true,
  updated_at: new Date().toISOString(),
};

/**
 * Busca todas as contas de streaming vinculadas dos membros, enriquecidas com dados de perfil.
 */
export async function fetchMemberStreamAccounts(): Promise<MemberStreamAccount[]> {
  try {
    const [accountsRes, profilesRes, rolesRes] = await Promise.all([
      supabase
        .from("member_stream_accounts")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("user_id, nome, nickname, avatar_url, discord_avatar_url, game_id, is_developer, is_ceo"),
      supabase
        .from("user_roles")
        .select("user_id, role"),
    ]);

    if (accountsRes.error) {
      console.warn("Erro ao buscar contas de stream vinculadas:", accountsRes.error);
      return [];
    }

    const profilesMap = new Map<string, any>();
    (profilesRes.data || []).forEach((p) => {
      if (p.user_id) profilesMap.set(p.user_id, p);
    });

    const rolesMap = new Map<string, string>();
    (rolesRes.data || []).forEach((r) => {
      if (r.user_id) rolesMap.set(r.user_id, r.role);
    });

    return (accountsRes.data || []).map((acc: any) => {
      const prof = profilesMap.get(acc.user_id);
      const role = rolesMap.get(acc.user_id);
      const streamerName = prof?.nickname || prof?.nome || acc.display_name || acc.channel_name;

      return {
        ...acc,
        streamer_name: streamerName,
        streamer_nickname: prof?.nickname,
        streamer_game_id: prof?.game_id,
        streamer_role: role || (prof?.is_developer ? "Desenvolvedor" : "Membro"),
        streamer_avatar: prof?.avatar_url || prof?.discord_avatar_url || acc.avatar_url,
      } as MemberStreamAccount;
    });
  } catch (err) {
    console.warn("Exceção ao listar contas de stream:", err);
    return [];
  }
}

/**
 * Busca sessões de transmissões (lives ativas ou histórico de encerramentos)
 */
export async function fetchStreamSessions(options?: {
  isLiveOnly?: boolean;
  limit?: number;
}): Promise<StreamSession[]> {
  try {
    let query = supabase.from("stream_sessions").select("*");

    if (options?.isLiveOnly) {
      query = query.eq("is_live", true).order("started_at", { ascending: false });
    } else {
      query = query.order("is_live", { ascending: false }).order("started_at", { ascending: false });
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("Erro ao buscar sessões de live:", error);
      return [];
    }

    return (data || []) as StreamSession[];
  } catch (err) {
    console.warn("Exceção ao buscar sessões de live:", err);
    return [];
  }
}

/**
 * Busca as preferências de notificação de lives de um membro específico.
 */
export async function fetchUserStreamPreferences(userId?: string | null): Promise<MemberStreamPreferences> {
  if (!userId) return DEFAULT_STREAM_PREFERENCES;

  try {
    const { data, error } = await supabase
      .from("member_stream_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return { ...DEFAULT_STREAM_PREFERENCES, user_id: userId };
    }

    return {
      user_id: data.user_id,
      notifications_enabled: data.notifications_enabled !== false,
      sound_enabled: data.sound_enabled !== false,
      notify_platforms: Array.isArray(data.notify_platforms)
        ? (data.notify_platforms as StreamPlatform[])
        : DEFAULT_STREAM_PREFERENCES.notify_platforms,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch {
    return { ...DEFAULT_STREAM_PREFERENCES, user_id: userId };
  }
}

/**
 * Salva as preferências de notificação de live do membro.
 */
export async function saveUserStreamPreferences(
  preferences: MemberStreamPreferences
): Promise<MemberStreamPreferences> {
  if (!preferences.user_id) throw new Error("Usuário não identificado.");

  const payload = {
    user_id: preferences.user_id,
    notifications_enabled: preferences.notifications_enabled,
    sound_enabled: preferences.sound_enabled,
    notify_platforms: preferences.notify_platforms,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("member_stream_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Falha ao salvar preferências de live.");
  }

  return data as MemberStreamPreferences;
}

/**
 * Vincula uma nova conta de streaming ao perfil do membro.
 */
export async function linkStreamAccount(
  userId: string,
  payload: LinkStreamAccountPayload,
  profileInfo?: { nome?: string; nickname?: string; avatar_url?: string }
): Promise<MemberStreamAccount> {
  if (!userId) throw new Error("Usuário não autenticado.");

  const { channel_name, channel_url } = cleanChannelInput(payload.platform, payload.channelInput);

  if (!channel_name || channel_name.length < 2) {
    throw new Error("Nome de usuário ou canal inválido.");
  }

  const displayName = payload.display_name || profileInfo?.nickname || profileInfo?.nome || channel_name;
  const avatarUrl = payload.avatar_url || profileInfo?.avatar_url || null;

  const insertData = {
    user_id: userId,
    platform: payload.platform,
    channel_name: channel_name,
    channel_url: channel_url,
    display_name: displayName,
    avatar_url: avatarUrl,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("member_stream_accounts")
    .upsert(insertData, { onConflict: "user_id,platform,channel_name" })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Falha ao vincular conta de stream.");
  }

  // Registra log técnico de auditoria
  try {
    await supabase.from("stream_integration_logs").insert({
      platform: payload.platform,
      event_type: "poll",
      status: "info",
      streamer_name: displayName,
      message: `Membro vinculou conta ${STREAM_PLATFORMS[payload.platform].name}: ${channel_name}`,
      details: { channel_url, user_id: userId },
    });
  } catch {}

  return data as MemberStreamAccount;
}

/**
 * Desvincula / remove uma conta de streaming.
 */
export async function unlinkStreamAccount(accountId: string): Promise<void> {
  const { error } = await supabase
    .from("member_stream_accounts")
    .delete()
    .eq("id", accountId);

  if (error) {
    throw new Error(error.message || "Falha ao desvincular conta de stream.");
  }
}

/**
 * Alterna status ativo/inativo de verificação da conta de stream.
 */
export async function toggleStreamAccountActive(accountId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("member_stream_accounts")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", accountId);

  if (error) {
    throw new Error(error.message || "Falha ao atualizar conta de stream.");
  }
}

/**
 * Busca configurações do sistema de lives.
 */
export async function fetchStreamSystemConfig(): Promise<StreamSystemConfig> {
  try {
    const { data, error } = await supabase
      .from("stream_system_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_SYSTEM_CONFIG;
    }

    return {
      ...DEFAULT_SYSTEM_CONFIG,
      ...data,
      platforms: {
        ...DEFAULT_SYSTEM_CONFIG.platforms,
        ...(data.platforms || {}),
      },
    };
  } catch {
    return DEFAULT_SYSTEM_CONFIG;
  }
}

/**
 * Salva as configurações administrativas de APIs e plataformas de live.
 */
export async function saveStreamSystemConfig(
  config: Partial<StreamSystemConfig>,
  userId?: string
): Promise<StreamSystemConfig> {
  const payload: any = {
    id: 1,
    ...config,
    updated_at: new Date().toISOString(),
  };

  if (userId) payload.updated_by = userId;

  const { data, error } = await supabase
    .from("stream_system_config")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Falha ao salvar configurações de lives.");
  }

  // Também replica em role_permissions (level = 'system_streams_config') para redundância
  try {
    await supabase.from("role_permissions").upsert(
      {
        level: "system_streams_config",
        nivel: "system_streams_config",
        permissions: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch {}

  return data as StreamSystemConfig;
}

/**
 * Busca logs de auditoria e integrações das transmissões ao vivo.
 */
export async function fetchStreamIntegrationLogs(limit: number = 100): Promise<StreamIntegrationLog[]> {
  try {
    const { data, error } = await supabase
      .from("stream_integration_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Erro ao buscar logs de live:", error);
      return [];
    }

    return (data || []) as StreamIntegrationLog[];
  } catch {
    return [];
  }
}

/**
 * Simula um evento de live ao vivo para fins de validação e testes no Painel Dev.
 */
export async function simulateLiveEvent(
  params: {
    streamer_name: string;
    platform: StreamPlatform;
    channel_name: string;
    title: string;
    category?: string;
    stream_url?: string;
    thumbnail_url?: string;
  },
  currentUserId?: string
): Promise<StreamSession> {
  const now = new Date().toISOString();
  const sessionUrl = params.stream_url || `https://${params.platform}.tv/${params.channel_name}`;

  const sessionPayload = {
    user_id: currentUserId || null,
    platform: params.platform,
    channel_name: params.channel_name,
    streamer_name: params.streamer_name,
    streamer_avatar: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
    title: params.title || `Live de Teste Twin Wheels GTA RP • Operação Especial`,
    category: params.category || "Grand Theft Auto V",
    thumbnail_url: params.thumbnail_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60",
    stream_url: sessionUrl,
    external_stream_id: `sim_${Date.now()}`,
    is_live: true,
    started_at: now,
    last_checked_at: now,
    viewer_count: Math.floor(Math.random() * 80) + 20,
    peak_viewers: Math.floor(Math.random() * 80) + 20,
    notification_sent: true,
    notified_at: now,
  };

  const { data, error } = await supabase
    .from("stream_sessions")
    .insert(sessionPayload)
    .select()
    .single();

  if (error) {
    throw new Error("Falha ao injetar live simulada: " + error.message);
  }

  // Dispara notificação no painel em tempo real para todos os membros conectados
  await createNotification({
    title: `${params.streamer_name} está Ao Vivo! 🔴`,
    message: `Transmitindo "${sessionPayload.title}" na ${STREAM_PLATFORMS[params.platform].name}!`,
    type: "live",
    category: "alert",
    link: `/lives`,
    metadata: {
      platform: params.platform,
      streamer_name: params.streamer_name,
      channel_name: params.channel_name,
      title: sessionPayload.title,
      category: sessionPayload.category,
      stream_url: sessionUrl,
      thumbnail_url: sessionPayload.thumbnail_url,
      is_simulated: true,
    },
  });

  // Registra log técnico
  await supabase.from("stream_integration_logs").insert({
    platform: params.platform,
    event_type: "simulated_live",
    status: "success",
    streamer_name: params.streamer_name,
    message: `Simulação de live disparada com sucesso pelo Painel Dev: "${sessionPayload.title}"`,
    details: sessionPayload,
  });

  return data as StreamSession;
}

/**
 * Encerra uma live ativa no banco.
 */
export async function endStreamSession(sessionId: string): Promise<void> {
  await supabase
    .from("stream_sessions")
    .update({
      is_live: false,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  // Emite notificação de sincronização
  broadcastNotificationsRealtimeUpdate({ action: "live_ended", sessionId });
}

/**
 * Limpa todo o histórico de logs e sessões de teste
 */
export async function purgeStreamHistory(): Promise<void> {
  await supabase.from("stream_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("stream_integration_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
}
