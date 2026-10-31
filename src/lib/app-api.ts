import { supabase } from "@/integrations/supabase/client";
import { rtdb } from "@/integrations/firebase/rtdb";
import type {
  AuthState,
  Category,
  Product,
  Movement,
  Sale,
  Goal,
  Member,
  PendingSignupRequest,
  AuditLog,
  LoginPlayer,
  AppUser,
  Profile,
  Bau,
  DiscordStockConfig,
  DiscordStockLog,
  UserPresence,
  UserPresenceStatus,
  RolePermissionRecord,
  Announcement,
  AnnouncementRead,
  CashMovement,
  CustomRole,
  ModuleAccessLevel,
  SystemModule,
  MemberAbsence,
  CreateAbsencePayload,
  WeeklyGoal,
  GoalSubmission,
  CreateWeeklyGoalPayload,
  SubmitGoalPayload,
  ActionScale,
  ActionScaleMember,
  ActionScaleHistory,
} from "./app-types";
import { LEVEL_LABEL, can, satisfiesPermission, type AppLevel, type Permission } from "./permissions";
import { DEFAULT_CEO_PERMISSIONS, isDevBypassActive } from "@/services/devService";
import type {
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketMessage,
  TicketAttachment,
  TicketMember,
  CreateTicketPayload,
  AddTicketMessagePayload,
  TransferTicketPayload,
  CloseTicketPayload,
  AddTicketMemberPayload,
} from "@/types/tickets";
import { getCategoryInfo, getStatusInfo } from "@/types/tickets";
import { createNotification } from "./notifications-api";
import { isDevAuditLogsEnabled } from "@/services/devService";
import { broadcastPermissionsRealtimeUpdate } from "./permissionsRealtimeSync";
import { getMemberTags, getMemberTagAssignments, parseMemberTagRules } from "@/services/memberTagsService";


export async function getCurrentAuth(): Promise<AuthState> {
  try {
    if (typeof window !== "undefined") {
      const devRaw = localStorage.getItem("tw_dev_impersonate");
      if (devRaw) {
        try {
          const dev = JSON.parse(devRaw);
          const currentUserId = dev.user_id || dev.id;

          // Sincroniza em tempo real com os dados mais recentes do banco / RTDB para refletir mudanças instantâneas
          try {
            const { rtdb } = await import("@/integrations/firebase/rtdb");
            const roles = await rtdb.getList<any>("user_roles");
            const userRole = roles.find(r => r && (r.user_id === currentUserId || r.user_id === dev.id));
            if (userRole && userRole.nivel) {
              dev.nivel = userRole.nivel;
            }

            const fbProfiles = await rtdb.getList<any>("profiles");
            const userProf = fbProfiles.find(p => p && (p.user_id === currentUserId || p.id === currentUserId || (dev.discord_id && String(p.discord_id) === String(dev.discord_id))));
            if (userProf) {
              if (userProf.status) dev.status = userProf.status;
              if (userProf.is_developer !== undefined) dev.is_developer = Boolean(userProf.is_developer);
              if (userProf.is_ceo !== undefined) dev.is_ceo = Boolean(userProf.is_ceo);
              if (userProf.custom_theme) dev.custom_theme = userProf.custom_theme;
              if (userProf.nome) dev.nome = userProf.nome;
              if (userProf.nickname !== undefined) dev.nickname = userProf.nickname;
              if (userProf.avatar_url) dev.avatar_url = userProf.avatar_url;
              if (userProf.is_verified !== undefined) dev.is_verified = Boolean(userProf.is_verified);
            }
            localStorage.setItem("tw_dev_impersonate", JSON.stringify(dev));
          } catch {}
          const user: AppUser = {
            id: dev.user_id || dev.id,
            email: dev.discord_email || null,
          };
          const profile: Profile = {
            id: dev.id || dev.user_id,
            user_id: dev.user_id || dev.id,
            nome: dev.nome || "Membro",
            nickname: dev.nickname || null,
            telefone: dev.telefone || null,
            game_id: dev.game_id || null,
            avatar_url: dev.avatar_url || dev.discord_avatar_url || null,
            original_avatar_url: dev.custom_theme?.original_avatar_url || null,
            banner_url: dev.banner_url || dev.custom_theme?.banner_url || null,
            original_banner_url: dev.custom_theme?.original_banner_url || null,
            status: dev.status || "ativo",
            data_entrada: dev.data_entrada || new Date().toISOString().slice(0, 10),
            discord_id: dev.discord_id || null,
            discord_username: dev.discord_username || null,
            discord_avatar_url: dev.discord_avatar_url || dev.avatar_url || null,
            discord_email: dev.discord_email || null,
            is_developer: Boolean(dev.is_developer === true || (dev.is_developer === undefined && dev.discord_id === "722320491767136346")),
            is_ceo: Boolean(dev.is_ceo === true || dev.custom_theme?.is_ceo === true),
            bio: dev.bio || null,
            custom_status: dev.custom_status || null,
            social_links: dev.social_links || null,
            custom_theme: dev.custom_theme || null,
            custom_url: dev.custom_url || null,
            xp: Number(dev.xp || 0),
            gamification_level: Number(dev.gamification_level || 1),
            stars_rating: Number(dev.stars_rating || 5.0),
            stars_count: Number(dev.stars_count || 0),
            tw_coins: Number(dev.tw_coins || 0),
            is_verified: dev.is_verified === true,
          };
          const level = dev.nivel || (profile.is_developer || profile.is_ceo ? "01" : "novato");
          const approvedAccess = profile.status === "ativo";
          return {
            user,
            profile,
            level,
            signupRequestStatus: profile.status === "pendente" ? "pendente" : (profile.status === "rejeitado" ? "rejeitado" : null),
            approvedAccess,
          };
        } catch {}
      }

      // Se temos o usuário Discord no localStorage mas ainda sem sessão formatada
      const authUserRaw = localStorage.getItem("tw_auth_user");
      if (authUserRaw) {
        try {
          const discordUser = JSON.parse(authUserRaw);
          const profiles = await rtdb.getList<any>("profiles");
          const matchedProfile = profiles.find(
            (p) =>
              String(p.discord_id) === String(discordUser.id) ||
              (discordUser.email && p.discord_email === discordUser.email)
          );

          if (matchedProfile) {
            const userRoles = await rtdb.getList<any>("user_roles");
            const userRole = userRoles.find(
              (r) => r.user_id === matchedProfile.user_id || r.user_id === matchedProfile.id
            );
            const isDev = Boolean(matchedProfile.is_developer === true || (matchedProfile.is_developer === undefined && discordUser.id === "722320491767136346"));
            const isCeo = Boolean(matchedProfile.is_ceo === true || matchedProfile.custom_theme?.is_ceo === true);
            const userLevel = userRole?.nivel || (isDev || isCeo ? "01" : "novato");

            const discordAvatar = discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=512`
              : "https://cdn.discordapp.com/embed/avatars/0.png";

            const sessionData = {
              id: matchedProfile.id,
              user_id: matchedProfile.user_id || matchedProfile.id,
              nome: matchedProfile.nome,
              nickname: matchedProfile.nickname,
              telefone: matchedProfile.telefone,
              game_id: matchedProfile.game_id,
              avatar_url: matchedProfile.avatar_url || discordAvatar,
              discord_id: discordUser.id,
              discord_username: discordUser.username,
              discord_avatar_url: discordAvatar,
              discord_email: discordUser.email || matchedProfile.discord_email,
              is_developer: isDev,
              is_ceo: isCeo,
              nivel: userLevel,
              status: matchedProfile.status,
              is_verified: Boolean(matchedProfile.is_verified),
              custom_theme: matchedProfile.custom_theme || null,
            };
            localStorage.setItem("tw_dev_impersonate", JSON.stringify(sessionData));
            const approvedAccess = matchedProfile.status === "ativo";
            return {
              user: { id: sessionData.user_id, email: sessionData.discord_email },
              profile: matchedProfile,
              level: userLevel,
              signupRequestStatus: approvedAccess ? null : (matchedProfile.status as any),
              approvedAccess,
            };
          }
        } catch {}
      }
    }

    const { data: sessionData } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    const session = sessionData?.session;

    if (!session?.user) {
      return {
        user: null,
        profile: null,
        level: null,
        signupRequestStatus: null,
        approvedAccess: false,
      };
    }

    const meta = (session.user.user_metadata || {}) as Record<string, any>;
    const discordId = (meta["provider_id"] as string) || (meta["sub"] as string) || "";
    const discordEmail = session.user.email || (meta["email"] as string) || "";

    // 1. Load profile (first by user_id, fallback to discord_id / discord_email)
    let profileRow: any = null;
    try {
      const { data: pByUid } = await (supabase.from("profiles" as any))
        .select("id, user_id, nome, nickname, telefone, game_id, avatar_url, banner_url, status, data_entrada, discord_id, discord_username, discord_avatar_url, discord_email, is_developer, is_ceo, custom_theme, bio, custom_status, custom_url, xp, gamification_level, stars_rating, stars_count, tw_coins, is_verified")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (pByUid) {
        profileRow = pByUid;
      } else if (discordId || discordEmail) {
        const filters = [];
        if (discordId) filters.push(`discord_id.eq.${discordId}`);
        if (discordEmail) filters.push(`discord_email.eq.${discordEmail}`);

        const { data: pFallback } = await (supabase.from("profiles" as any))
          .select("id, user_id, nome, nickname, telefone, game_id, avatar_url, banner_url, status, data_entrada, discord_id, discord_username, discord_avatar_url, discord_email, is_developer, is_ceo, custom_theme, bio, custom_status, custom_url, xp, gamification_level, stars_rating, stars_count, tw_coins, is_verified")
          .or(filters.join(","))
          .maybeSingle();

        if (pFallback) {
          profileRow = pFallback;
        }
      }
    } catch {}

    // Fallback para Firebase RTDB se não encontrou no Supabase
    if (!profileRow) {
      try {
        const { rtdb } = await import("@/integrations/firebase/rtdb");
        const fbProfiles = await rtdb.getList<any>("profiles");
        profileRow = fbProfiles.find(
          (p) =>
            p.user_id === session.user.id ||
            p.id === session.user.id ||
            (discordId && String(p.discord_id) === String(discordId)) ||
            (discordEmail && p.discord_email === discordEmail)
        );
      } catch {}
    }

    // 2. Load level/role (searching either by session.user.id or the profile's original user_id)
    const roleUserIds = [session.user.id];
    if (profileRow?.user_id && !roleUserIds.includes(profileRow.user_id)) {
      roleUserIds.push(profileRow.user_id);
    }

    let roleRow: any = null;
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("nivel")
        .in("user_id", roleUserIds)
        .limit(1)
        .maybeSingle();
      roleRow = data;
    } catch {}

    if (!roleRow?.nivel) {
      try {
        const { rtdb } = await import("@/integrations/firebase/rtdb");
        const fbRoles = await rtdb.getList<any>("user_roles");
        const found = fbRoles.find((r) => roleUserIds.includes(r.user_id));
        if (found) roleRow = { nivel: found.nivel };
      } catch {}
    }

    // 3. Load signup request status
    let signupRow: any = null;
    try {
      const { data } = await supabase
        .from("signup_requests")
        .select("status")
        .in("user_id", roleUserIds)
        .limit(1)
        .maybeSingle();
      signupRow = data;
    } catch {}

    if (!signupRow?.status && profileRow?.status !== "ativo") {
      try {
        const { rtdb } = await import("@/integrations/firebase/rtdb");
        const fbSignups = await rtdb.getList<any>("signup_requests");
        const found = fbSignups.find((s) => roleUserIds.includes(s.user_id));
        if (found) signupRow = { status: found.status };
      } catch {}
    }

    const user: AppUser = {
      id: session.user.id,
      email: session.user.email ?? null,
    };

    const pAny = profileRow as any;
    const candidateUids = [session.user.id, pAny?.id, pAny?.user_id, discordId].filter(Boolean).map(String);
    let isDev = Boolean(
      pAny?.is_developer === true ||
      (pAny?.is_developer === undefined && discordId === "722320491767136346") ||
      roleRow?.nivel === "desenvolvedor"
    );
    let isCeo = Boolean(pAny?.is_ceo === true || pAny?.custom_theme?.is_ceo === true || roleRow?.nivel === "ceo");

    const profile: Profile | null = profileRow ? {
      id: pAny.id,
      user_id: session.user.id,
      nome: pAny.nome ?? "Membro",
      nickname: pAny.nickname ?? null,
      telefone: pAny.telefone ?? null,
      game_id: pAny.game_id ?? null,
      avatar_url: pAny.avatar_url ?? pAny.discord_avatar_url ?? null,
      original_avatar_url: pAny.custom_theme?.original_avatar_url ?? null,
      banner_url: pAny.banner_url ?? pAny.custom_theme?.banner_url ?? null,
      original_banner_url: pAny.custom_theme?.original_banner_url ?? null,
      status: pAny.status ?? "ativo",
      data_entrada: pAny.data_entrada ?? new Date().toISOString().slice(0, 10),
      discord_id: pAny.discord_id ?? discordId ?? null,
      discord_username: pAny.discord_username ?? meta["user_name"] ?? null,
      discord_avatar_url: pAny.discord_avatar_url ?? pAny.avatar_url ?? null,
      discord_email: pAny.discord_email ?? discordEmail ?? null,
      is_developer: isDev,
      is_ceo: isCeo,
      bio: pAny.bio ?? pAny.custom_theme?.bio ?? null,
      custom_status: pAny.custom_status ?? pAny.custom_theme?.custom_status ?? null,
      social_links: pAny.social_links ?? pAny.custom_theme?.social_links ?? null,
      custom_theme: pAny.custom_theme || null,
      custom_url: pAny.custom_url ?? pAny.custom_theme?.custom_url ?? null,
      xp: Number(pAny.xp || 0),
      gamification_level: Number(pAny.gamification_level || 1),
      stars_rating: Number(pAny.stars_rating || 5.0),
      stars_count: Number(pAny.stars_count || 0),
      tw_coins: Number(pAny.tw_coins || 0),
      is_verified: pAny.is_verified === true,
    } : null;

    if (profile && !profile.discord_avatar_url && session.user.user_metadata?.avatar_url) {
      const initialDiscordAvatar = session.user.user_metadata.avatar_url;
      profile.discord_avatar_url = initialDiscordAvatar;
      if (!profile.avatar_url) profile.avatar_url = initialDiscordAvatar;

      supabase.from("profiles").update({ 
        discord_avatar_url: initialDiscordAvatar,
        ...(profile.avatar_url ? {} : { avatar_url: initialDiscordAvatar }),
      }).eq("user_id", session.user.id).then(({ error }) => {
        if (error) console.error("Falha ao gravar foto inicial do Discord no perfil:", error);
      });
    }

    let level = (roleRow?.nivel as AppLevel) ?? (isDev || isCeo ? "01" : null);

    const sStatus = signupRow?.status;
    const isApprovedMember = Boolean(profile && profile.status === "ativo");
    const approvedAccess = Boolean(
      isApprovedMember &&
        (level || isDev || isCeo) &&
        sStatus !== "pendente" &&
        sStatus !== "rejeitado"
    );

    return {
      user,
      profile,
      level,
      signupRequestStatus: approvedAccess ? null : ((sStatus as any) ?? null),
      approvedAccess,
    };
  } catch (err) {
    console.error("Exceção em getCurrentAuth:", err);
    return {
      user: null,
      profile: null,
      level: null,
      signupRequestStatus: null,
      approvedAccess: false,
    };
  }
}

export async function loginWithPlayer(payload: any): Promise<any> {
  throw new Error("Login por e-mail desativado.");
}

export async function logoutFromApp(): Promise<{ success: boolean }> {
  try {
    await supabase.auth.signOut();
  } catch {}
  if (typeof window !== "undefined") {
    localStorage.removeItem("tw_dev_impersonate");
    localStorage.removeItem("tw_auth_user");
    localStorage.removeItem("tw_pending_discord_user");
    localStorage.removeItem("tw_panel_mode");
    sessionStorage.removeItem("tw_login_logged");
    sessionStorage.removeItem("tw_session_start");
    sessionStorage.removeItem("tw_simulated_user");
  }
  return { success: true };
}

export async function registerPlayerRequest(payload: any): Promise<any> {
  throw new Error("Registro por e-mail desativado.");
}

export async function getLoginPlayers(): Promise<LoginPlayer[]> {
  return [];
}

export async function syncDiscordUser({ data }: { data: { token: string } }): Promise<{ success: boolean }> {
  const { data: { user }, error: userError } = await supabase.auth.getUser(data.token);
  if (userError || !user) {
    throw new Error(userError?.message || "Usuário não autenticado no Supabase");
  }

  const meta = user.user_metadata || {};
  const discordId = (meta["provider_id"] as string) || (meta["sub"] as string) || "";
  const discordUsername = (meta["user_name"] as string) || (meta["name"] as string) || "";
  const discordAvatarUrl = (meta["avatar_url"] as string) || "";
  const discordEmail = user.email || (meta["email"] as string) || "";
  const discordName = (meta["full_name"] as string) || (meta["name"] as string) || "Membro Discord";

  const { error } = await supabase.rpc("sync_discord_user_rpc", {
    _discord_id: discordId,
    _discord_username: discordUsername,
    _discord_avatar_url: discordAvatarUrl,
    _discord_email: discordEmail,
    _discord_name: discordName
  });

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function getCategories(): Promise<Category[]> {
  let listData: any[] = [];
  try {
    listData = await rtdb.getList<any>("categories");
  } catch {}

  if (!listData || listData.length === 0) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, nome, descricao, ativo, created_at")
        .order("nome");
      if (!error && data && data.length > 0) {
        listData = data;
      }
    } catch {}
  }

  return (listData || []).map(d => ({
    id: d.id,
    nome: d.nome,
    descricao: d.descricao,
    ativo: d.ativo ?? true,
    created_at: String(d.created_at)
  })).sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function getBaus(): Promise<Bau[]> {
  let listData: any[] = [];
  let configData: any = null;
  try {
    const [fbBaus, fbConfig] = await Promise.all([
      rtdb.getList<any>("baus"),
      rtdb.getList<any>("discord_stock_config"),
    ]);
    if (fbBaus && fbBaus.length > 0) {
      listData = fbBaus;
    }
    if (fbConfig && fbConfig.length > 0) {
      configData = fbConfig[0];
    }
  } catch {}

  if (listData.length === 0) {
    try {
      const [bausRes, configRes] = await Promise.all([
        supabase.from("baus").select("*").order("created_at", { ascending: true }),
        (supabase.from("discord_stock_config" as any)).select("bau_channels").limit(1).maybeSingle(),
      ]);
      if (!bausRes.error && bausRes.data && bausRes.data.length > 0) {
        listData = bausRes.data;
      }
      if (!configRes.error && configRes.data) {
        configData = configRes.data;
      }
    } catch {}
  }

  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const list: Bau[] = [];

  for (const d of listData || []) {
    const id = String(d.id);
    const normName = String(d.nome || "").trim().toLowerCase();

    if (seenIds.has(id) || (normName && seenNames.has(normName))) {
      continue;
    }
    seenIds.add(id);
    if (normName) seenNames.add(normName);

    const channelConf = configData?.bau_channels?.[id] || {};

    list.push({
      id: d.id,
      nome: d.nome,
      descricao: d.descricao,
      icone: d.icone,
      foto_url: d.foto_url || d.imagem_url || channelConf.foto_url || channelConf.imagem_url || null,
      imagem_url: d.imagem_url || d.foto_url || channelConf.imagem_url || channelConf.foto_url || null,
      banner_url: d.banner_url || d.banner || channelConf.banner_url || null,
      ativo: d.ativo ?? (channelConf.is_active ?? true),
      tipo_gestao: (d.tipo_gestao === "manual" || channelConf.tipo_gestao === "manual" ? "manual" : "automatico"),
      discord_channel_id: d.discord_channel_id || channelConf.channel_id || null,
      discord_guild_id: d.discord_guild_id || channelConf.guild_id || null,
      access_mode: (channelConf.access_mode || (d as any).access_mode || "all") as "all" | "restricted",
      allowed_roles: (channelConf.allowed_roles || (d as any).allowed_roles || []) as string[],
      allowed_tags: (channelConf.allowed_tags || (d as any).allowed_tags || []) as string[],
      restricted_action: (channelConf.restricted_action || (d as any).restricted_action || "disabled") as "hide" | "disabled",
      created_at: String(d.created_at),
    });
  }

  return list;
}

export async function createBau(payload: {
  nome: string;
  descricao?: string;
  icone?: string;
  foto_url?: string | null;
  imagem_url?: string | null;
  banner_url?: string | null;
  tipo_gestao?: "automatico" | "manual";
  discord_channel_id?: string | null;
  discord_guild_id?: string | null;
  ativo?: boolean;
  access_mode?: "all" | "restricted";
  allowed_roles?: string[];
  allowed_tags?: string[];
  restricted_action?: "hide" | "disabled";
}): Promise<Bau> {
  const cleanName = payload.nome.trim();
  if (!cleanName) throw new Error("Informe o nome do baú.");

  const currentBaus = await getBaus();
  if (currentBaus.some(b => b.nome.toLowerCase() === cleanName.toLowerCase())) {
    throw new Error(`Já existe um baú cadastrado com o nome "${cleanName}".`);
  }

  const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `bau_${Date.now()}`;
  const photo = payload.foto_url?.trim() || payload.imagem_url?.trim() || null;
  const banner = payload.banner_url && typeof payload.banner_url === "string" ? (payload.banner_url.trim() || null) : null;
  const isBauActive = payload.ativo !== false;

  const newBau: Bau = {
    id,
    nome: cleanName,
    descricao: payload.descricao?.trim() || null,
    icone: payload.icone || 'box',
    foto_url: photo,
    imagem_url: photo,
    banner_url: banner,
    ativo: isBauActive,
    tipo_gestao: payload.tipo_gestao || 'automatico',
    discord_channel_id: payload.discord_channel_id?.trim() || null,
    discord_guild_id: payload.discord_guild_id?.trim() || null,
    access_mode: payload.access_mode || "all",
    allowed_roles: payload.allowed_roles || [],
    allowed_tags: payload.allowed_tags || [],
    restricted_action: payload.restricted_action || "disabled",
    created_at: new Date().toISOString(),
  };

  await rtdb.set(`baus/${id}`, newBau);

  // Sincronizar metadados em discord_stock_config.bau_channels
  try {
    const config = await getDiscordStockConfig();
    const currentChannels = config?.bau_channels || {};
    const updatedChannelConf = {
      ...(currentChannels[id] || {}),
      bau_id: id,
      channel_id: payload.discord_channel_id?.trim() || "",
      guild_id: payload.discord_guild_id?.trim() || "",
      tipo_gestao: payload.tipo_gestao || "automatico",
      is_active: isBauActive,
      banner_url: banner,
      foto_url: photo,
      imagem_url: photo,
      access_mode: payload.access_mode || "all",
      allowed_roles: payload.allowed_roles || [],
      allowed_tags: payload.allowed_tags || [],
      restricted_action: payload.restricted_action || "disabled",
    };
    await rtdb.update(`discord_stock_config/${config.id || "default"}`, {
      bau_channels: { ...currentChannels, [id]: updatedChannelConf },
      updated_at: new Date().toISOString(),
    });
  } catch {}

  try {
    const insertPayload: any = {
      id,
      nome: cleanName,
      descricao: payload.descricao?.trim() || null,
      icone: payload.icone || 'box',
      foto_url: photo,
      imagem_url: photo,
      ...(banner ? { banner_url: banner } : {}),
      ativo: isBauActive,
      tipo_gestao: payload.tipo_gestao || 'automatico',
      discord_channel_id: payload.discord_channel_id?.trim() || null,
      discord_guild_id: payload.discord_guild_id?.trim() || null,
    };
    await supabase.from("baus").insert(insertPayload);
  } catch {}

  void logAuditAction("create_bau", "baus", { nome: newBau.nome, descricao: newBau.descricao }, undefined, id);
  return newBau;
}

export async function updateBau(payload: {
  id: string;
  nome?: string;
  descricao?: string;
  icone?: string;
  foto_url?: string | null;
  imagem_url?: string | null;
  banner_url?: string | null;
  ativo?: boolean;
  tipo_gestao?: "automatico" | "manual";
  discord_channel_id?: string | null;
  discord_guild_id?: string | null;
  access_mode?: "all" | "restricted";
  allowed_roles?: string[];
  allowed_tags?: string[];
  restricted_action?: "hide" | "disabled";
}): Promise<void> {
  const oldBau = await rtdb.get<any>(`baus/${payload.id}`);

  const updates: any = {};
  if (payload.nome !== undefined) updates.nome = payload.nome.trim();
  if (payload.descricao !== undefined) updates.descricao = payload.descricao.trim();
  if (payload.icone !== undefined) updates.icone = payload.icone;
  if (payload.foto_url !== undefined || payload.imagem_url !== undefined) {
    const rawPhoto = payload.foto_url !== undefined ? payload.foto_url : payload.imagem_url;
    const photo = rawPhoto && typeof rawPhoto === "string" ? (rawPhoto.trim() || null) : null;
    updates.foto_url = photo;
    updates.imagem_url = photo;
  }
  if (payload.banner_url !== undefined) {
    updates.banner_url = payload.banner_url && typeof payload.banner_url === "string" ? (payload.banner_url.trim() || null) : null;
  }
  if (payload.ativo !== undefined) updates.ativo = payload.ativo;
  if (payload.tipo_gestao !== undefined) updates.tipo_gestao = payload.tipo_gestao;
  if (payload.discord_channel_id !== undefined) updates.discord_channel_id = payload.discord_channel_id?.trim() || null;
  if (payload.discord_guild_id !== undefined) updates.discord_guild_id = payload.discord_guild_id?.trim() || null;
  if (payload.access_mode !== undefined) updates.access_mode = payload.access_mode;
  if (payload.allowed_roles !== undefined) updates.allowed_roles = payload.allowed_roles;
  if (payload.allowed_tags !== undefined) updates.allowed_tags = payload.allowed_tags;
  if (payload.restricted_action !== undefined) updates.restricted_action = payload.restricted_action;
  updates.updated_at = new Date().toISOString();

  await rtdb.update(`baus/${payload.id}`, updates);

  // Sincronizar discord_stock_config.bau_channels
  try {
    const config = await getDiscordStockConfig();
    const currentChannels = config?.bau_channels || {};
    const prevConf = currentChannels[payload.id] || {};
    const updatedChannelConf = {
      ...prevConf,
      bau_id: payload.id,
      ...(payload.banner_url !== undefined ? { banner_url: updates.banner_url } : {}),
      ...(updates.foto_url !== undefined ? { foto_url: updates.foto_url, imagem_url: updates.foto_url } : {}),
      ...(updates.tipo_gestao !== undefined ? { tipo_gestao: updates.tipo_gestao } : {}),
      ...(updates.discord_channel_id !== undefined ? { channel_id: updates.discord_channel_id } : {}),
      ...(updates.discord_guild_id !== undefined ? { guild_id: updates.discord_guild_id } : {}),
      ...(updates.ativo !== undefined ? { is_active: updates.ativo } : {}),
      ...(payload.access_mode !== undefined ? { access_mode: payload.access_mode } : {}),
      ...(payload.allowed_roles !== undefined ? { allowed_roles: payload.allowed_roles } : {}),
      ...(payload.allowed_tags !== undefined ? { allowed_tags: payload.allowed_tags } : {}),
      ...(payload.restricted_action !== undefined ? { restricted_action: payload.restricted_action } : {}),
    };
    await rtdb.update(`discord_stock_config/${config.id || "default"}`, {
      bau_channels: { ...currentChannels, [payload.id]: updatedChannelConf },
      updated_at: new Date().toISOString(),
    });
  } catch {}

  try {
    await supabase.from("baus").update(updates).eq("id", payload.id);
  } catch {}

  void logAuditAction("update_bau", "baus", { id: payload.id, ...updates }, oldBau || undefined, payload.id);
}

export async function deleteBau(id: string): Promise<void> {
  const oldBau = await rtdb.get<any>(`baus/${id}`);
  await rtdb.remove(`baus/${id}`);

  // Limpar entradas de product_baus
  try {
    const pBaus = await rtdb.getList<any>("product_baus");
    for (const pb of pBaus) {
      if (pb.bau_id === id) {
        await rtdb.remove(`product_baus/${pb.product_id}_${pb.bau_id}`);
      }
    }
  } catch {}

  try {
    await supabase.from("products").update({ bau_id: null, updated_at: new Date().toISOString() }).eq("bau_id", id);
    await supabase.from("baus").delete().eq("id", id);
  } catch {}

  void logAuditAction("delete_bau", "baus", { id, nome: oldBau?.nome }, undefined, id);
}

export interface ProductBauStock {
  product_id: string;
  bau_id: string;
  quantidade: number;
}

export async function getProductBaus(): Promise<ProductBauStock[]> {
  let data: any[] = [];
  try {
    data = await rtdb.getList<any>("product_baus");
  } catch {}

  if (!data || data.length === 0) {
    try {
      const res = await (supabase.from("product_baus" as any))
        .select("product_id, bau_id, quantidade");
      if (!res.error && res.data && res.data.length > 0) {
        data = res.data;
      }
    } catch {}
  }

  return (data || []).map((d: any) => ({
    product_id: String(d.product_id),
    bau_id: String(d.bau_id),
    quantidade: Number(d.quantidade || 0),
  }));
}

export async function getProducts(): Promise<Product[]> {
  let listData: any[] = [];
  try {
    listData = await rtdb.getList<any>("products");
  } catch {}

  if (!listData || listData.length === 0) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, nome, cda_name, descricao, categoria_id, bau_id, unidade, estoque_atual, estoque_minimo, preco_sugerido, imagem_url, can_be_produced, can_be_sold, sale_available_quantity, production_yield, ativo, created_at, updated_at")
        .order("nome");
      if (!error && data && data.length > 0) {
        listData = data;
      }
    } catch {}
  }

  return (listData || []).map(d => ({
    id: d.id,
    nome: d.nome,
    cda_name: d.cda_name || null,
    descricao: d.descricao,
    categoria_id: d.categoria_id,
    bau_id: d.bau_id,
    unidade: d.unidade,
    estoque_atual: Number(d.estoque_atual || 0),
    estoque_minimo: Number(d.estoque_minimo || 0),
    preco_sugerido: Number(d.preco_sugerido || 0),
    imagem_url: d.imagem_url || null,
    can_be_produced: d.can_be_produced === true,
    can_be_sold: d.can_be_sold === true,
    sale_available_quantity: Number(d.sale_available_quantity || 0),
    production_yield: d.production_yield != null ? Number(d.production_yield) : 1,
    ativo: d.ativo ?? true,
    created_at: String(d.created_at),
    updated_at: String(d.updated_at)
  })).sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
}

export async function updateProductBau(productId: string, bauId: string | null): Promise<void> {
  const prod = await rtdb.get<any>(`products/${productId}`);
  await rtdb.update(`products/${productId}`, { bau_id: bauId, updated_at: new Date().toISOString() });

  try {
    await supabase
      .from("products")
      .update({ bau_id: bauId, updated_at: new Date().toISOString() })
      .eq("id", productId);
  } catch {}

  void logAuditAction("update_product_bau", "products", {
    product_name: prod?.nome || "Produto",
    new_bau_id: bauId,
  }, { bau_id: prod?.bau_id }, productId);
}

export async function getMovements(limit = 250): Promise<Movement[]> {
  const listBaus = await getBaus();
  const defaultBau = listBaus[0];
  const defaultBauId = defaultBau?.id || null;

  let data: any[] = [];
  try {
    data = await rtdb.getList<any>("stock_movements");
    data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (limit && limit > 0) data = data.slice(0, limit);
  } catch {}

  if (!data || data.length === 0) {
    try {
      const res = await (supabase.from("stock_movements" as any))
        .select("id, product_id, user_id, bau_id, type, quantity, previous_balance, resulting_balance, reason, sale_id, reversal_of, created_at, origin, discord_message_id")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!res.error && res.data && res.data.length > 0) {
        data = res.data;
      }
    } catch {}
  }

  return (data || []).map((d: any) => {
    let resolvedBauId = d.bau_id || null;
    let cleanReason = d.reason || null;

    if (!resolvedBauId && cleanReason) {
      const match = cleanReason.match(/\[bau:([a-f0-9-]+)\]/i);
      if (match && match[1] && listBaus.some((b: any) => b.id === match[1])) {
        resolvedBauId = match[1];
      }
    }

    if (cleanReason) {
      cleanReason = cleanReason.replace(/\s*\[bau:[a-f0-9-]+\]/gi, "").trim() || null;
    }

    return {
      id: d.id,
      product_id: d.product_id,
      user_id: d.user_id,
      bau_id: resolvedBauId || defaultBauId,
      type: d.type as "entrada" | "saida",
      quantity: Number(d.quantity),
      previous_balance: Number(d.previous_balance),
      resulting_balance: Number(d.resulting_balance),
      reason: cleanReason,
      sale_id: d.sale_id,
      reversal_of: d.reversal_of,
      created_at: String(d.created_at),
      origin: d.origin,
      discord_message_id: d.discord_message_id,
    };
  });
}

export async function getSales(limit = 250): Promise<Sale[]> {
  let listData: any[] = [];
  try {
    listData = await rtdb.getList<any>("sales");
    listData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (limit && limit > 0) listData = listData.slice(0, limit);
  } catch {}

  if (!listData || listData.length === 0) {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("id, product_id, seller_id, buyer_name, quantity, unit_price, total_price, payment_method, notes, status, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!error && data) listData = data;
    } catch {}
  }

  return (listData || []).map(d => ({
    id: d.id,
    product_id: d.product_id,
    seller_id: d.seller_id,
    buyer_name: d.buyer_name,
    quantity: Number(d.quantity),
    unit_price: Number(d.unit_price),
    total_price: Number(d.total_price),
    payment_method: d.payment_method,
    notes: d.notes,
    status: d.status as "concluida" | "estornada",
    created_at: String(d.created_at)
  }));
}

export async function getGoals(): Promise<Goal[]> {
  let listData: any[] = [];
  try {
    listData = await rtdb.getList<any>("goals");
    listData.sort((a, b) => new Date(b.period_end || b.deadline || 0).getTime() - new Date(a.period_end || a.deadline || 0).getTime());
  } catch {}

  if (!listData || listData.length === 0) {
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("id, user_id, type, target_value, period_start, period_end, descricao, created_at")
        .order("period_end", { ascending: false });
      if (!error && data) listData = data;
    } catch {}
  }

  return (listData || []).map(d => ({
    id: d.id,
    user_id: d.user_id || d.created_by || "",
    type: (d.type === "financeiro" ? "faturamento" : (d.type || "faturamento")) as "vendas" | "faturamento" | "quantidade",
    target_value: Number(d.target_value) || 0,
    period_start: String(d.period_start || d.created_at || "").slice(0, 10),
    period_end: String(d.period_end || d.deadline || "").slice(0, 10),
    descricao: d.descricao || d.description || d.title || null,
    created_at: String(d.created_at || new Date().toISOString())
  }));
}

export async function getUserPresences(): Promise<UserPresence[]> {
  return [];
}

export async function updateUserPresence(_status: UserPresenceStatus, _incrementSeconds = 15, _customUserId?: string): Promise<void> {
  return;
}

export async function getMembers(): Promise<Member[]> {
  let profiles: any[] = [];
  let roles: any[] = [];
  let signupReqs: any[] = [];
  let tagAssignments: any[] = [];
  let ceoConfig: any = null;

  try {
    const [fbProfiles, fbRoles, fbSignups, fbTagAssignments, fbCeoConfig] = await Promise.all([
      rtdb.getList<any>("profiles"),
      rtdb.getList<any>("user_roles"),
      rtdb.getList<any>("signup_requests"),
      rtdb.getList<any>("member_tag_assignments").catch(() => []),
      rtdb.get<any>("role_permissions/system_ceo_config").catch(() => null),
    ]);
    if (fbProfiles && fbProfiles.length > 0) {
      profiles = fbProfiles;
      roles = fbRoles || [];
      signupReqs = fbSignups || [];
      tagAssignments = fbTagAssignments || [];
      ceoConfig = fbCeoConfig;
    }
  } catch {}

  if (profiles.length === 0) {
    try {
      const [profilesRes, rolesRes, signupReqsRes, tagAssignsRes] = await Promise.all([
        (supabase.from("profiles" as any))
          .select("id, user_id, nome, nickname, telefone, game_id, status, data_entrada, created_at, discord_id, discord_username, discord_avatar_url, avatar_url, discord_email, is_developer, is_ceo, custom_theme, xp, gamification_level, stars_rating, stars_count, tw_coins, is_verified")
          .order("created_at", { ascending: true }),
        supabase
          .from("user_roles")
          .select("user_id, nivel"),
        (supabase.from("signup_requests" as any))
          .select("user_id, status"),
        (supabase.from("member_tag_assignments" as any))
          .select("user_id, member_id, tag_id")
          .catch(() => ({ data: [] })),
      ]);

      if (!profilesRes.error && profilesRes.data && profilesRes.data.length > 0) {
        profiles = profilesRes.data;
        roles = rolesRes.data || [];
        signupReqs = signupReqsRes.data || [];
        tagAssignments = (tagAssignsRes as any)?.data || [];
      }
    } catch {}
  }

  const devTagUserIds = new Set<string>();
  const ceoTagUserIds = new Set<string>();
  if (Array.isArray(tagAssignments)) {
    for (const a of tagAssignments) {
      if (!a) continue;
      const tId = String(a.tag_id || "").toLowerCase().trim();
      const uId = String(a.user_id || a.member_id || "").trim();
      if (!uId) continue;
      if (tId === "dev" || tId === "desenvolvedor") {
        devTagUserIds.add(uId);
      }
      if (tId === "ceo") {
        ceoTagUserIds.add(uId);
      }
    }
  }

  const activeCeoSet = new Set<string>();
  const ceoConfigList = Array.isArray(ceoConfig?.permissions?.activeCeoUserIds)
    ? ceoConfig.permissions.activeCeoUserIds
    : Array.isArray(ceoConfig?.activeCeoUserIds)
    ? ceoConfig.activeCeoUserIds
    : [];
  for (const cid of ceoConfigList) {
    if (cid) activeCeoSet.add(String(cid).trim());
  }
  if (typeof window !== "undefined") {
    try {
      const localCfg = localStorage.getItem("tw_ceo_config");
      if (localCfg) {
        const parsed = JSON.parse(localCfg);
        if (Array.isArray(parsed?.activeCeoUserIds)) {
          for (const cid of parsed.activeCeoUserIds) {
            if (cid) activeCeoSet.add(String(cid).trim());
          }
        }
      }
    } catch {}
  }

  const rolesMap = new Map<string, AppLevel>();
  roles.forEach((r: any) => {
    if (r.user_id && r.nivel) rolesMap.set(r.user_id, r.nivel as AppLevel);
  });

  const pendingSet = new Set<string>();
  signupReqs.forEach((s: any) => {
    if (s.status === "pendente") pendingSet.add(s.user_id);
  });

  const mapped = profiles
    .filter((d: any) => {
      if (!d) return false;
      // Must have valid name and identity (filter out ghost records)
      if (!d.nome && !d.nickname) return false;
      const uid = d.user_id || d.id;
      if (!uid) return false;

      // User must not be pending and must have an assigned role or approved status
      if (pendingSet.has(d.user_id)) return false;
      const hasRole = rolesMap.has(d.user_id);
      const isApproved = d.status === "ativo" || d.status === "aprovado";
      return hasRole || isApproved;
    })
    .map((d: any) => {
      const roleNivel = rolesMap.get(d.user_id) || "novato";
      const candidateIds = [
        d.id,
        d.user_id,
        d.discord_id ? String(d.discord_id) : null,
      ].filter(Boolean).map(String);

      const hasDevTag = candidateIds.some((cid) => devTagUserIds.has(cid));
      const hasCeoTag = candidateIds.some((cid) => ceoTagUserIds.has(cid) || activeCeoSet.has(cid));

      return {
        id: d.id || d.user_id,
        user_id: d.user_id || d.id,
        nome: d.nome,
        nickname: d.nickname || null,
        telefone: d.telefone ?? null,
        game_id: d.game_id ?? null,
        status: d.status || "ativo",
        data_entrada: String(d.data_entrada || new Date().toISOString().slice(0, 10)),
        created_at: String(d.created_at || new Date().toISOString()),
        nivel: roleNivel,
        presence_status: "offline" as UserPresenceStatus,
        last_seen: null,
        presence_updated_at: null,
        updated_at: null,
        online_since: null,
        total_seconds_online: 0,
        total_hours_online: 0,
        discord_id: d.discord_id,
        discord_username: d.discord_username,
        discord_avatar_url: d.avatar_url || d.discord_avatar_url || null,
        avatar_url: d.avatar_url || d.discord_avatar_url || null,
        discord_email: d.discord_email,
        banner_url: d.banner_url || d.custom_theme?.banner_url || null,
        original_banner_url: d.original_banner_url || d.custom_theme?.original_banner_url || null,
        original_avatar_url: d.original_avatar_url || d.custom_theme?.original_avatar_url || null,
        bio: d.bio || d.custom_theme?.bio || null,
        custom_status: d.custom_status || d.custom_theme?.custom_status || null,
        is_developer: Boolean(
          d.is_developer === true ||
          roleNivel === "desenvolvedor" ||
          hasDevTag ||
          (d.is_developer === undefined && d.discord_id && String(d.discord_id) === "722320491767136346")
        ),
        is_ceo: Boolean(d.is_ceo === true || d.custom_theme?.is_ceo === true || hasCeoTag),
        custom_theme: d.custom_theme || null,
        custom_url: d.custom_url ?? d.custom_theme?.custom_url ?? null,
        xp: Number(d.xp || 0),
        gamification_level: Number(d.gamification_level || 1),
        stars_rating: Number(d.stars_rating || 5.0),
        stars_count: Number(d.stars_count || 0),
        tw_coins: Number(d.tw_coins || 0),
        is_verified: d.is_verified === true,
      };
    });

  // Deduplicação estrita por user_id (evita duplicação do mesmo usuário)
  const seenUserIds = new Set<string>();
  const deduplicated: Member[] = [];

  for (const m of mapped) {
    const uid = String(m.user_id || m.id).trim();
    if (!uid || seenUserIds.has(uid)) continue;

    seenUserIds.add(uid);
    deduplicated.push(m);
  }

  return deduplicated;
}

export async function cancelSignupRequest(userId?: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const targetId = userId || session?.user?.id;
  if (!targetId) return;

  const { data: prof } = await (supabase.from("profiles" as any))
    .select("nome, nickname")
    .eq("user_id", targetId)
    .maybeSingle();

  const p = prof as { nome?: string; nickname?: string } | null;
  const applicantName = p ? (p.nickname ? `${p.nickname} (${p.nome})` : p.nome) : null;

  // 1. Log audit action first to preserve history in audit_logs
  void logAuditAction("cancel_signup", "signup_requests", {
    target_id: targetId,
    nome: applicantName,
    canceled_at: new Date().toISOString(),
  });

  // 2. Try RPC if exists
  try {
    await supabase.rpc("cancel_signup_request" as any, { _user_id: targetId });
  } catch (err) {}

  // 3. Delete all records from database tables
  await (supabase.from("signup_requests" as any)).delete().eq("user_id", targetId);
  await (supabase.from("profiles" as any)).delete().eq("user_id", targetId);
  await (supabase.from("user_roles" as any)).delete().eq("user_id", targetId);
  await (supabase.from("user_presence" as any)).delete().eq("user_id", targetId);

  // 4. Update status to 'cancelled' as fallback so getPendingSignupRequests (.eq('status', 'pendente')) will never fetch it
  try {
    await (supabase.from("signup_requests" as any))
      .update({ status: "cancelled" })
      .eq("user_id", targetId);
  } catch (err) {}

  // 5. Excluir também do Firebase Realtime Database
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const rawDev = typeof window !== "undefined" ? localStorage.getItem("tw_dev_impersonate") : null;
    const devData = rawDev ? JSON.parse(rawDev) : null;
    const discordId = devData?.discord_id;

    const allSignups = await rtdb.getList<any>("signup_requests");
    const matches = allSignups.filter(
      (s) =>
        s.user_id === targetId ||
        s.id === targetId ||
        (discordId && String(s.discord_id) === String(discordId))
    );
    for (const m of matches) {
      await rtdb.remove(`signup_requests/${m.id}`);
    }

    const profiles = await rtdb.getList<any>("profiles");
    const foundProfiles = profiles.filter(
      (p) =>
        p.user_id === targetId ||
        p.id === targetId ||
        (discordId && String(p.discord_id) === String(discordId))
    );
    for (const p of foundProfiles) {
      if (p.id) await rtdb.remove(`profiles/${p.id}`);
    }

    rtdb.triggerRealtimeNotification("signup_requests", "DELETE", { user_id: targetId });
    rtdb.triggerRealtimeNotification("profiles", "DELETE", { user_id: targetId });
  } catch (err) {
    console.warn("Erro ao limpar cadastro cancelado no Firebase RTDB:", err);
  }
}

export async function updateUserProfile(payload: {
  nome: string;
  nickname?: string | null;
  telefone: string;
  game_id: string;
  custom_url?: string | null;
  public_profile_enabled?: boolean;
  avatar_url?: string | null;
  original_avatar_url?: string | null;
  banner_url?: string | null;
  original_banner_url?: string | null;
  bio?: string | null;
  custom_status?: string | null;
  social_links?: any;
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  let targetUserId = session?.user?.id;
  if (!targetUserId && typeof window !== "undefined") {
    const simRaw = sessionStorage.getItem("tw_dev_impersonate") || localStorage.getItem("tw_dev_impersonate");
    if (simRaw) {
      try {
        const sim = JSON.parse(simRaw);
        targetUserId = sim.user_id || sim.id;
      } catch {}
    }
  }
  if (!targetUserId) throw new Error("Não autenticado");

  const { data: oldProfile } = await (supabase.from("profiles" as any))
    .select("id, user_id, nome, nickname, telefone, game_id, custom_theme, banner_url, bio, custom_status, social_links")
    .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`)
    .maybeSingle();

  let cleanCustomUrl: string | null | undefined = undefined;
  if (payload.custom_url !== undefined) {
    const raw = payload.custom_url ? payload.custom_url.trim().toLowerCase().replace(/^@/, "") : "";
    if (raw) {
      // Validate: 3 to 30 characters, alphanumeric, dot, dash, underscore
      if (!/^[a-z0-9_.-]{3,30}$/.test(raw)) {
        throw new Error("A URL personalizada deve conter de 3 a 30 caracteres (apenas letras, números, ponto, hífen e underline).");
      }

      // Check duplicate custom_url across other profiles
      const { data: duplicates } = await (supabase.from("profiles" as any))
        .select("user_id, custom_theme")
        .filter("custom_theme->>custom_url", "eq", raw)
        .neq("user_id", targetUserId)
        .limit(1);

      if (duplicates && duplicates.length > 0) {
        throw new Error(`A URL personalizada "@${raw}" já está em uso por outro membro. Por favor, escolha outra.`);
      }

      cleanCustomUrl = raw;
    } else {
      cleanCustomUrl = null;
    }
  }

  // Proteção contra payloads base64 gigantes que estouram o limite de requisição do PostgREST/PostgreSQL
  let safeBannerUrl = payload.banner_url;
  if (safeBannerUrl && safeBannerUrl.startsWith("data:") && safeBannerUrl.length > 2048) {
    safeBannerUrl = undefined;
  }
  let safeOriginalBannerUrl = payload.original_banner_url;
  if (safeOriginalBannerUrl && safeOriginalBannerUrl.startsWith("data:") && safeOriginalBannerUrl.length > 2048) {
    safeOriginalBannerUrl = safeBannerUrl || undefined;
  }
  let safeAvatarUrl = (payload as any).avatar_url;
  if (safeAvatarUrl && safeAvatarUrl.startsWith("data:") && safeAvatarUrl.length > 2048) {
    safeAvatarUrl = undefined;
  }
  let safeOriginalAvatarUrl = payload.original_avatar_url;
  if (safeOriginalAvatarUrl && safeOriginalAvatarUrl.startsWith("data:") && safeOriginalAvatarUrl.length > 2048) {
    safeOriginalAvatarUrl = safeAvatarUrl || undefined;
  }

  const existingTheme = (oldProfile as any)?.custom_theme || {};
  const updatedTheme = {
    ...existingTheme,
    ...(cleanCustomUrl !== undefined ? { custom_url: cleanCustomUrl } : {}),
    ...(payload.public_profile_enabled !== undefined ? { public_profile_enabled: payload.public_profile_enabled } : {}),
    ...(safeBannerUrl !== undefined ? { banner_url: safeBannerUrl } : {}),
    ...(safeOriginalBannerUrl !== undefined ? { original_banner_url: safeOriginalBannerUrl } : {}),
    ...(safeOriginalAvatarUrl !== undefined ? { original_avatar_url: safeOriginalAvatarUrl } : {}),
    ...(payload.bio !== undefined ? { bio: payload.bio } : {}),
    ...(payload.custom_status !== undefined ? { custom_status: payload.custom_status } : {}),
    ...(payload.social_links !== undefined ? { social_links: payload.social_links } : {}),
  };

  const finalNome = (payload.nome || (oldProfile as any)?.nome || "Membro").trim();
  const finalTelefone = (payload.telefone || (oldProfile as any)?.telefone || "").trim();
  const finalGameId = (payload.game_id || (oldProfile as any)?.game_id || "").trim();

  const updateFields: Record<string, any> = {
    nome: finalNome,
    nickname: payload.nickname?.trim() || (oldProfile as any)?.nickname || null,
    telefone: finalTelefone,
    game_id: finalGameId,
    custom_theme: updatedTheme,
    updated_at: new Date().toISOString(),
  };

  if (cleanCustomUrl !== undefined) updateFields.custom_url = cleanCustomUrl;
  if (safeAvatarUrl !== undefined) {
    updateFields.avatar_url = safeAvatarUrl;
    updateFields.discord_avatar_url = safeAvatarUrl;
  }
  if (safeBannerUrl !== undefined) updateFields.banner_url = safeBannerUrl;
  if (payload.bio !== undefined) updateFields.bio = payload.bio;
  if (payload.custom_status !== undefined) updateFields.custom_status = payload.custom_status;
  if (payload.social_links !== undefined) updateFields.social_links = payload.social_links;

  const targetId = (oldProfile as any)?.user_id || (oldProfile as any)?.id || targetUserId;

  // 1. Gravar com prioridade no Firebase RTDB
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const fbProfiles = await rtdb.get<Record<string, any>>("profiles");
    if (fbProfiles) {
      const entry = Object.entries(fbProfiles).find(
        ([_, p]) =>
          p &&
          (p.user_id === targetUserId ||
            p.id === targetUserId ||
            p.user_id === targetId ||
            p.id === targetId)
      );
      if (entry) {
        await rtdb.update(`profiles/${entry[0]}`, updateFields);
      }
    }
  } catch (err) {
    console.warn("Aviso ao atualizar perfil no Firebase RTDB:", err);
  }

  // 2. Gravar no Supabase (se acessível)
  try {
    const { error } = await supabase
      .from("profiles")
      .update(updateFields as any)
      .or(`user_id.eq.${targetId},id.eq.${targetId}`);
    if (error) console.warn("Aviso ao gravar perfil no Supabase:", error);
  } catch (err) {
    console.warn("Supabase indisponível para atualização de perfil:", err);
  }

  // Sync to local storage / session storage if impersonation or dev login is in use
  if (typeof window !== "undefined") {
    ["tw_dev_impersonate"].forEach((key) => {
      [localStorage, sessionStorage].forEach((storage) => {
        try {
          const raw = storage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.user_id === targetUserId || parsed.id === targetUserId || !session?.user) {
              const updated = {
                ...parsed,
                nome: updateFields.nome,
                nickname: updateFields.nickname,
                telefone: updateFields.telefone,
                game_id: updateFields.game_id,
                custom_theme: updateFields.custom_theme,
                custom_url: updateFields.custom_url !== undefined ? updateFields.custom_url : parsed.custom_url,
                banner_url: updateFields.banner_url !== undefined ? updateFields.banner_url : parsed.banner_url,
                avatar_url: updateFields.avatar_url !== undefined ? updateFields.avatar_url : parsed.avatar_url,
                discord_avatar_url: updateFields.discord_avatar_url !== undefined ? updateFields.discord_avatar_url : parsed.discord_avatar_url,
                bio: updateFields.bio !== undefined ? updateFields.bio : parsed.bio,
                custom_status: updateFields.custom_status !== undefined ? updateFields.custom_status : parsed.custom_status,
                social_links: updateFields.social_links !== undefined ? updateFields.social_links : parsed.social_links,
              };
              storage.setItem(key, JSON.stringify(updated));
            }
          }
        } catch {}
      });
    });
  }

  void logAuditAction("update_profile", "profiles", {
    nome: payload.nome.trim(),
    nickname: payload.nickname?.trim() || null,
    telefone: payload.telefone.trim(),
    game_id: payload.game_id.trim(),
    custom_url: cleanCustomUrl,
    banner_url: payload.banner_url,
    bio: payload.bio,
    custom_status: payload.custom_status,
  }, oldProfile || undefined, targetUserId);
}

export async function getMemberBySlug(slug: string): Promise<Member | null> {
  const clean = slug ? slug.trim().toLowerCase().replace(/^@/, "") : "";
  if (!clean) return null;

  const members = await getMembers();
  return (
    members.find((m) => {
      const uId = (m.user_id || "").toLowerCase().trim();
      const id = (m.id || "").toLowerCase().trim();
      const cUrl = (m.custom_url || m.custom_theme?.custom_url || "").toLowerCase().trim();
      const dId = (m.discord_id || "").toLowerCase().trim();
      const dUser = (m.discord_username || "").toLowerCase().replace(/#0$/, "").trim();
      const nick = (m.nickname || "").toLowerCase().trim();
      const nome = (m.nome || "").toLowerCase().trim();
      const gId = (m.game_id || "").toLowerCase().trim();

      return (
        (uId && uId === clean) ||
        (id && id === clean) ||
        (cUrl && cUrl === clean) ||
        (dId && dId === clean) ||
        (dUser && dUser === clean) ||
        (nick && nick === clean) ||
        (nome && nome === clean) ||
        (gId && gId === clean)
      );
    }) || null
  );
}

export async function updateUserTheme(theme: import("./app-types").UserThemeSettings): Promise<void> {
  // 1. Obtém todos os IDs associados ao usuário ativo
  let userId: string | null = null;
  const candidateIds = new Set<string>();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      userId = session.user.id;
      candidateIds.add(session.user.id);
    }
  } catch {}

  if (typeof window !== "undefined") {
    try {
      const simRaw = sessionStorage.getItem("tw_dev_impersonate") || localStorage.getItem("tw_dev_impersonate");
      if (simRaw) {
        const sim = JSON.parse(simRaw);
        if (sim.user_id) candidateIds.add(sim.user_id);
        if (sim.id) candidateIds.add(sim.id);
        if (sim.discord_id) candidateIds.add(String(sim.discord_id));
        if (sim.game_id) candidateIds.add(String(sim.game_id));
        if (!userId) userId = sim.user_id || sim.id;
      }
      const authRaw = localStorage.getItem("tw_auth_user");
      if (authRaw) {
        const u = JSON.parse(authRaw);
        if (u.user_id) candidateIds.add(u.user_id);
        if (u.id) candidateIds.add(u.id);
        if (u.discord_id) candidateIds.add(String(u.discord_id));
        if (!userId) userId = u.user_id || u.id;
      }
    } catch {}
  }

  if (!userId && candidateIds.size === 0) throw new Error("Não autenticado");

  // 2. Salva no localStorage e caches de sessão imediatamente
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("tw_user_theme", JSON.stringify(theme));

      const authRaw = localStorage.getItem("tw_auth_user");
      if (authRaw) {
        const u = JSON.parse(authRaw);
        u.custom_theme = { ...(u.custom_theme || {}), ...theme };
        localStorage.setItem("tw_auth_user", JSON.stringify(u));
      }
      const devRaw = localStorage.getItem("tw_dev_impersonate");
      if (devRaw) {
        const d = JSON.parse(devRaw);
        d.custom_theme = { ...(d.custom_theme || {}), ...theme };
        localStorage.setItem("tw_dev_impersonate", JSON.stringify(d));
      }
      const simRaw = sessionStorage.getItem("tw_dev_impersonate");
      if (simRaw) {
        const s = JSON.parse(simRaw);
        s.custom_theme = { ...(s.custom_theme || {}), ...theme };
        sessionStorage.setItem("tw_dev_impersonate", JSON.stringify(s));
      }
    } catch {}
  }

  // 3. Persistência direta no Firebase RTDB
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const profiles = await rtdb.get<Record<string, any>>("profiles");
    if (profiles && typeof profiles === "object") {
      for (const [key, prof] of Object.entries(profiles)) {
        if (!prof) continue;
        const matches = Array.from(candidateIds).some(
          (cid) =>
            prof.user_id === cid ||
            prof.id === cid ||
            key === cid ||
            String(prof.discord_id) === cid ||
            String(prof.game_id) === cid
        );
        if (matches) {
          const mergedTheme = { ...(prof.custom_theme || {}), ...theme };
          await rtdb.update(`profiles/${key}`, {
            custom_theme: mergedTheme,
            updated_at: new Date().toISOString(),
          });
          break;
        }
      }
    }
    // Apenas atualiza userId se já existir nó correspondente no RTDB
    if (userId && profiles && profiles[userId]) {
      await rtdb.update(`profiles/${userId}`, {
        custom_theme: theme,
        updated_at: new Date().toISOString(),
      }).catch(() => {});
    }
  } catch (fbErr) {
    console.warn("Aviso ao persistir custom_theme no Firebase RTDB:", fbErr);
  }

  // 4. Persistência via Supabase REST (atualiza por user_id ou id)
  try {
    const orList = Array.from(candidateIds).map((cid) => `user_id.eq.${cid},id.eq.${cid}`).join(",");
    if (orList) {
      await (supabase.from("profiles" as any))
        .update({
          custom_theme: theme,
          updated_at: new Date().toISOString(),
        })
        .or(orList);
    }
  } catch (sbErr) {
    console.warn("Aviso ao persistir custom_theme no Supabase:", sbErr);
  }
}

export async function updateMemberDetails(payload: {
  targetUserId: string;
  nome: string;
  nickname?: string | null;
  telefone?: string | null;
  game_id?: string | null;
  is_developer?: boolean;
  is_ceo?: boolean;
}): Promise<void> {
  const { data: oldProfile } = await (supabase.from("profiles" as any))
    .select("nome, nickname, telefone, game_id, custom_theme")
    .eq("user_id", payload.targetUserId)
    .maybeSingle();

  const updateFields: any = {
    nome: payload.nome.trim(),
    nickname: payload.nickname?.trim() || null,
    telefone: payload.telefone?.trim() || null,
    game_id: payload.game_id?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (payload.is_developer !== undefined) {
    const { data: { session } } = await supabase.auth.getSession();
    const actorId = session?.user?.id;
    if (!actorId) {
      throw new Error("403 Forbidden — Sessão não autenticada.");
    }
    const { data: actorProfile } = await (supabase.from("profiles" as any))
      .select("is_developer")
      .eq("user_id", actorId)
      .maybeSingle();

    if (!actorProfile || !actorProfile.is_developer) {
      throw new Error("403 Forbidden — Apenas quem possui a Tag Dev pode ativar ou desativar a Tag Desenvolvedor.");
    }

    updateFields.is_developer = Boolean(payload.is_developer);
  }

  if (payload.is_ceo !== undefined) {
    // Validação estrita: apenas quem tem Tag Dev pode alterar a Tag CEO
    const { data: { session } } = await supabase.auth.getSession();
    const actorId = session?.user?.id;
    if (!actorId) {
      throw new Error("403 Forbidden — Sessão não autenticada.");
    }
    const { data: actorProfile } = await (supabase.from("profiles" as any))
      .select("is_developer")
      .eq("user_id", actorId)
      .maybeSingle();

    if (!actorProfile || !actorProfile.is_developer) {
      throw new Error("403 Forbidden — Apenas quem possui a Tag Dev pode ativar ou desativar a Tag CEO.");
    }

    const currentTheme = (oldProfile as any)?.custom_theme || {};
    updateFields.is_ceo = Boolean(payload.is_ceo);
    updateFields.custom_theme = {
      ...currentTheme,
      is_ceo: Boolean(payload.is_ceo),
    };
  }

  // 1. Atualizar no Firebase RTDB
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const fbProfiles = await rtdb.get<Record<string, any>>("profiles");
    if (fbProfiles) {
      const entry = Object.entries(fbProfiles).find(
        ([_, p]) => p && (p.user_id === payload.targetUserId || p.id === payload.targetUserId)
      );
      if (entry) {
        await rtdb.update(`profiles/${entry[0]}`, updateFields);
      }
    }
  } catch (err) {
    console.warn("Aviso ao atualizar membro no Firebase RTDB:", err);
  }

  // 2. Atualizar no Supabase (se acessível)
  try {
    const { error } = await (supabase.from("profiles" as any))
      .update(updateFields)
      .eq("user_id", payload.targetUserId);
    if (error) console.warn("Aviso ao gravar membro no Supabase:", error);
  } catch (err) {
    console.warn("Supabase indisponível para atualização de membro:", err);
  }

  const oldP = oldProfile as any;
  const targetName = oldP ? (oldP.nickname || oldP.nome || "Membro") : "Membro";

  void logAuditAction("update_member_details", "members", {
    target_id: payload.targetUserId,
    target_name: targetName,
    nome: payload.nome.trim(),
    nickname: payload.nickname?.trim() || null,
    telefone: payload.telefone?.trim() || null,
    game_id: payload.game_id?.trim() || null,
    is_developer: payload.is_developer,
    is_ceo: payload.is_ceo,
  }, oldProfile || undefined, payload.targetUserId);

  void broadcastPermissionsRealtimeUpdate({
    type: "profiles",
    userId: payload.targetUserId,
  });
}

export async function deleteMember(targetUserId: string): Promise<void> {
  const { data: oldProfile } = await (supabase.from("profiles" as any))
    .select("nome, nickname")
    .eq("user_id", targetUserId)
    .maybeSingle();

  const p = oldProfile as { nome?: string; nickname?: string } | null;
  const targetName = p ? (p.nickname ? `${p.nickname} (${p.nome})` : p.nome) : null;

  const { error } = await supabase.from("profiles").delete().eq("user_id", targetUserId);
  if (error) throw error;

  void logAuditAction(
    "delete_member",
    "members",
    {
      target_id: targetUserId,
      target_name: targetName,
    },
    undefined,
    targetUserId
  );

  void broadcastPermissionsRealtimeUpdate({
    type: "profiles",
    userId: targetUserId,
  });
}

export async function getAnnouncements(): Promise<Announcement[]> {
  let listData: any[] = [];
  try {
    listData = await rtdb.getList<any>("announcements");
    listData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch {}

  if (!listData || listData.length === 0) {
    try {
      const { data, error } = await (supabase.from("announcements" as any))
        .select("id, author_id, title, content, priority, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (!error && data) listData = data;
    } catch {}
  }

  return (listData || []).map((d: any) => ({
    id: d.id,
    author_id: d.author_id,
    title: d.title,
    content: d.content,
    priority: d.priority as "normal" | "importante" | "urgente",
    created_at: String(d.created_at),
    updated_at: String(d.updated_at),
  }));
}

export async function createAnnouncement(payload: { title: string; content: string; priority?: "normal" | "importante" | "urgente" }): Promise<Announcement> {
  const currentAuth = await getCurrentAuth();
  const authorId = currentAuth.user?.id || "sistema";

  const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `ann_${Date.now()}`;
  const now = new Date().toISOString();
  const newAnn: Announcement = {
    id,
    author_id: authorId,
    title: payload.title.trim(),
    content: payload.content.trim(),
    priority: payload.priority || "normal",
    created_at: now,
    updated_at: now,
  };

  await rtdb.set(`announcements/${id}`, newAnn);

  try {
    await (supabase.from("announcements" as any)).insert(newAnn);
  } catch {}

  void logAuditAction("create_announcement", "announcements", { title: payload.title, priority: payload.priority }, undefined, id);

  void createNotification({
    title: `Novo Comunicado: ${payload.title}`,
    message: payload.content.slice(0, 110) + (payload.content.length > 110 ? "..." : ""),
    type: "announcement",
    category: payload.priority === "urgente" ? "error" : payload.priority === "importante" ? "warning" : "info",
    user_id: "all",
    link: "/avisos",
    sender_id: authorId,
  });

  return newAnn;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const oldAnn = await rtdb.get<any>(`announcements/${id}`);
  await rtdb.remove(`announcements/${id}`);

  try {
    await (supabase.from("announcements" as any)).delete().eq("id", id);
  } catch {}

  void logAuditAction("delete_announcement", "announcements", { title: oldAnn?.title }, undefined, id);
}

export async function updateAnnouncement(id: string, payload: { title: string; content: string; priority?: "normal" | "importante" | "urgente" }): Promise<void> {
  const updates = {
    title: payload.title.trim(),
    content: payload.content.trim(),
    priority: payload.priority || "normal",
    updated_at: new Date().toISOString(),
  };

  await rtdb.update(`announcements/${id}`, updates);

  try {
    await (supabase.from("announcements" as any)).update(updates).eq("id", id);
  } catch {}

  void logAuditAction("update_announcement", "announcements", { title: payload.title, priority: payload.priority }, undefined, id);
}

export async function getAnnouncementReads(): Promise<AnnouncementRead[]> {
  let listData: any[] = [];
  try {
    listData = await rtdb.getList<any>("announcement_reads");
  } catch {}

  if (!listData || listData.length === 0) {
    try {
      const { data, error } = await (supabase.from("announcement_reads" as any))
        .select("announcement_id, user_id, read_at");
      if (!error && data) listData = data;
    } catch {}
  }

  return (listData || []).map((d: any) => ({
    announcement_id: String(d.announcement_id),
    user_id: String(d.user_id),
    read_at: String(d.read_at),
  }));
}

export async function markAnnouncementAsRead(announcementId: string): Promise<void> {
  const currentAuth = await getCurrentAuth();
  const userId = currentAuth.user?.id;
  if (!userId) return;

  const key = `${announcementId}_${userId}`;
  await rtdb.set(`announcement_reads/${key}`, {
    announcement_id: announcementId,
    user_id: userId,
    read_at: new Date().toISOString(),
  });

  try {
    await (supabase.from("announcement_reads" as any))
      .upsert({
        announcement_id: announcementId,
        user_id: userId,
        read_at: new Date().toISOString(),
      }, { onConflict: "announcement_id,user_id" });
  } catch {}

  void logAuditAction("read_announcement", "announcements", { title: "Comunicado" }, undefined, announcementId);
}

export async function setMemberLevel(targetUserId: string, newLevel: AppLevel | string): Promise<void> {
  const members = await getMembers();
  const targetMember = members.find(m => m.user_id === targetUserId || m.id === targetUserId);
  const targetProfile = targetMember ? { nome: targetMember.nome, nickname: targetMember.nickname } : null;
  const targetRole = targetMember ? { nivel: targetMember.nivel } : null;

  const customRoles = await getCustomRoles();
  const oldCustomRole = customRoles.find(r => r.id === targetRole?.nivel);
  const newCustomRole = customRoles.find(r => r.id === newLevel);

  // 1. Atualiza no Firebase RTDB
  try {
    const roles = await rtdb.getList<any>("user_roles");
    const roleItem = roles.find(r => r.user_id === targetUserId);
    const key = roleItem?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : targetUserId);
    await rtdb.set(`user_roles/${key}`, {
      ...(roleItem || {}),
      id: key,
      user_id: targetUserId,
      nivel: newLevel,
      updated_at: new Date().toISOString(),
    });
  } catch (fbErr) {
    console.warn("Erro ao atualizar user_roles no Firebase RTDB:", fbErr);
  }

  // 2. Tenta RPC Supabase se disponível
  try {
    await supabase.rpc("set_member_level", {
      _target_user: targetUserId,
      _nivel: newLevel,
    });
  } catch {}

  try {
    await (supabase.from("user_roles" as any))
      .update({ nivel: newLevel, updated_at: new Date().toISOString() })
      .eq("user_id", targetUserId);
  } catch {}

  const p = targetProfile as { nome?: string; nickname?: string } | null;
  const targetName = p ? (p.nickname || p.nome) : "Membro";
  const oldLevelLabel = (oldCustomRole as any)?.nome || LEVEL_LABEL[targetRole?.nivel as AppLevel] || targetRole?.nivel || "cargo anterior";
  const newLevelLabel = (newCustomRole as any)?.nome || LEVEL_LABEL[newLevel as AppLevel] || newLevel;

  void logAuditAction(
    "update_level",
    "members",
    {
      target_id: targetUserId,
      target_name: targetName,
      new_level: newLevelLabel,
      old_level: oldLevelLabel,
    },
    { nivel: targetRole?.nivel },
    targetUserId
  );

  void createNotification({
    title: "Cargo Atualizado! 🛡️",
    message: `Seu cargo foi atualizado para "${newLevelLabel}" pela liderança.`,
    type: "system",
    category: "success",
    user_id: targetUserId,
    link: "/perfil",
  });

  void broadcastPermissionsRealtimeUpdate({
    type: "user_roles",
    userId: targetUserId,
    level: String(newLevel),
  });
}

/* ==========================================================================
   CLASSIFICAÇÃO DE SEVERIDADE AUTOMÁTICA POR TIPO DE AÇÃO
   ========================================================================== */

type AuditSeverity = "info" | "warning" | "critical";

function classifySeverity(action: string): AuditSeverity {
  // Critical: ações destrutivas, estornos, exclusões, alterações de cargo/permissões
  const critical = [
    "delete_member", "delete_members", "delete_product", "delete_category",
    "delete_bau", "delete_announcement", "delete_custom_role",
    "delete_cash_movement", "delete_goal",
    "reverse_movement", "reverse_sale", "reverse_cash_movement",
    "reject_signup", "cancel_signup",
    "update_level", "save_role_permissions", "save_custom_role",
    "reorder_custom_roles", "manage_permissions",
    "operation_error",
  ];
  if (critical.includes(action)) return "critical";

  // Warning: alterações e edições que modificam dados existentes
  const warning = [
    "update_product", "update_category", "update_bau",
    "update_announcement", "update_profile", "update_member_details",
    "update_product_bau",
    "access_denied",
    "session_absence", "session_end",
  ];
  if (warning.includes(action)) return "warning";

  // Info: tudo mais (criações, visualizações, logins)
  return "info";
}

function getBrowserUserAgent(): string {
  if (typeof window !== "undefined" && window.navigator) {
    return window.navigator.userAgent.slice(0, 256);
  }
  return "server";
}

let auditBroadcastChannel: any = null;

function getAuditBroadcastChannel() {
  if (!auditBroadcastChannel) {
    auditBroadcastChannel = supabase.channel("system-audit-logs");
    auditBroadcastChannel.subscribe();
  }
  return auditBroadcastChannel;
}

export async function logAuditAction(
  _action: string,
  _entity: string,
  _newData?: any,
  _oldData?: any,
  _entityId?: string
): Promise<boolean> {
  // Sistema de logs completamente desativado para economia de banco de dados e evitar egress quota
  return true;
}

/* ==========================================================================
   FUNÇÕES AUXILIARES DE LOG PARA COBERTURA COMPLETA
   ========================================================================== */

/** Log de navegação — desativado conforme solicitado */
export async function logPageView(_page: string): Promise<void> {
  // Desativado: não grava logs de navegação entre páginas
}

/** Log de acesso negado — registra tentativa de acessar recurso sem permissão */
export async function logAccessDenied(page: string, requiredPermission?: string): Promise<void> {
  void logAuditAction("access_denied", "authorization", {
    page,
    required_permission: requiredPermission || "unknown",
    denied_at: new Date().toISOString(),
  });
}

/** Log de erro operacional — registra falhas em operações */
export async function logOperationError(action: string, entity: string, errorMsg: string): Promise<void> {
  void logAuditAction("operation_error", entity, {
    failed_action: action,
    error_message: errorMsg.slice(0, 500),
    occurred_at: new Date().toISOString(),
  });
}

/** Log de inspeção de detalhe — registra quando alguém inspeciona um log */
export async function logViewLogDetail(logId: string, logAction: string): Promise<void> {
  void logAuditAction("view_log_detail", "audit_logs", {
    inspected_log_id: logId,
    inspected_action: logAction,
  }, undefined, logId);
}

export async function submitSignupRequest(payload: { nome: string; nickname?: string | null; telefone: string; game_id: string }): Promise<void> {
  let success = false;
  try {
    const { error: rpcErr } = await supabase.rpc("submit_signup_request", {
      _nome: payload.nome.trim(),
      _telefone: payload.telefone.trim(),
      _nickname: (payload.nickname?.trim() || null) as any,
      _game_id: payload.game_id.trim(),
    });

    if (rpcErr) {
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (session?.user) {
        const { error: upsertErr } = await supabase
          .from("signup_requests")
          .upsert(
            {
              user_id: session.user.id,
              nome: payload.nome.trim(),
              nickname: payload.nickname?.trim() || null,
              telefone: payload.telefone.trim(),
              game_id: payload.game_id.trim(),
              status: "pendente",
              requested_at: new Date().toISOString(),
            } as any,
            { onConflict: "user_id" }
          );
        if (!upsertErr) success = true;
      }
    } else {
      success = true;
    }
  } catch (err) {
    console.warn("Supabase signup fallback to Firebase RTDB:", err);
  }

  // Grava também no Firebase Realtime Database
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const rawDev = typeof window !== "undefined" ? localStorage.getItem("tw_dev_impersonate") : null;
    const devData = rawDev ? JSON.parse(rawDev) : null;
    const rawPending = typeof window !== "undefined" ? localStorage.getItem("tw_pending_discord_user") : null;
    const pendingData = rawPending ? JSON.parse(rawPending) : null;

    const discordId = devData?.discord_id || pendingData?.id || null;
    const discordUsername = devData?.discord_username || pendingData?.username || null;
    const discordAvatar = devData?.discord_avatar_url || pendingData?.avatar || null;
    const discordEmail = devData?.discord_email || pendingData?.email || null;
    const userId = devData?.user_id || (discordId ? `discord-${discordId}` : `req_${Date.now()}`);
    const reqId = `req_${Date.now()}`;

    const reqData = {
      id: reqId,
      user_id: userId,
      discord_id: discordId,
      discord_username: discordUsername,
      discord_avatar_url: discordAvatar,
      discord_email: discordEmail,
      nome: payload.nome.trim(),
      nickname: payload.nickname?.trim() || null,
      telefone: payload.telefone.trim(),
      game_id: payload.game_id.trim(),
      status: "pendente",
      requested_at: new Date().toISOString(),
    };

    await rtdb.set(`signup_requests/${reqId}`, reqData);

    // Também criar ou atualizar o perfil com status "pendente" no RTDB
    await rtdb.set(`profiles/${userId}`, {
      id: userId,
      user_id: userId,
      nome: payload.nome.trim(),
      nickname: payload.nickname?.trim() || null,
      telefone: payload.telefone.trim(),
      game_id: payload.game_id.trim(),
      discord_id: discordId,
      discord_username: discordUsername,
      discord_avatar_url: discordAvatar,
      discord_email: discordEmail,
      avatar_url: discordAvatar,
      status: "pendente",
      data_entrada: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Atualizar sessão local no navegador
    if (typeof window !== "undefined") {
      const updatedSession = {
        ...(devData || {}),
        id: userId,
        user_id: userId,
        nome: payload.nome.trim(),
        nickname: payload.nickname?.trim() || null,
        telefone: payload.telefone.trim(),
        game_id: payload.game_id.trim(),
        status: "pendente",
        discord_id: discordId,
        discord_username: discordUsername,
        discord_avatar_url: discordAvatar,
        discord_email: discordEmail,
      };
      localStorage.setItem("tw_dev_impersonate", JSON.stringify(updatedSession));
    }

    rtdb.triggerRealtimeNotification("signup_requests", "INSERT", reqData);
    rtdb.triggerRealtimeNotification("profiles", "UPDATE", { user_id: userId, status: "pendente" });

    success = true;
  } catch (fbErr) {
    console.error("Firebase signup error:", fbErr);
    if (!success) throw fbErr;
  }


  void logAuditAction("submit_signup", "signup_requests", {
    nome: payload.nome.trim(),
    nickname: payload.nickname?.trim() || null,
    telefone: payload.telefone.trim(),
    game_id: payload.game_id.trim(),
  });

  void createNotification({
    title: "Novo Pedido de Cadastro",
    message: `${payload.nome.trim()}${payload.nickname ? ` (${payload.nickname.trim()})` : ""} solicitou aprovação de cadastro na plataforma.`,
    type: "signup",
    category: "info",
    target_roles: ["01", "02", "gerente", "desenvolvedor"],
    link: "/membros?tab=pendentes",
  });
}

export async function submitSignupReview({ data }: { data: { requestId: string; approve: boolean; nivel?: AppLevel; reason?: string } }): Promise<void> {
  let applicantName: string | null = null;
  let targetId: string | undefined = undefined;

  try {
    const req = await rtdb.get<any>(`signup_requests/${data.requestId}`);
    if (req) {
      applicantName = req.nickname ? `${req.nickname} (${req.nome})` : req.nome;
      targetId = req.user_id;
    }
  } catch {}

  if (!applicantName) {
    try {
      const { data: requestData } = await (supabase.from("signup_requests" as any))
        .select("nome, nickname, user_id")
        .eq("id", data.requestId)
        .maybeSingle();
      const reqObj = requestData as { nome?: string; nickname?: string; user_id?: string } | null;
      applicantName = (reqObj ? (reqObj.nickname ? `${reqObj.nickname} (${reqObj.nome})` : reqObj.nome) : null) || null;
      targetId = reqObj?.user_id;
    } catch {}
  }

  // 1. Atualizar no Firebase RTDB
  if (data.approve) {
    try {
      await rtdb.update(`signup_requests/${data.requestId}`, { status: "aprovado" });
      const req = await rtdb.get<any>(`signup_requests/${data.requestId}`);

      if (targetId) {
        // Encontrar ou atualizar perfil no RTDB
        const profiles = await rtdb.getList<any>("profiles");
        const found = profiles.find(p => p.user_id === targetId || p.id === targetId || (req?.discord_id && String(p.discord_id) === String(req.discord_id)));
        const profileKey = found?.id || targetId;

        const profileData = {
          id: profileKey,
          user_id: targetId,
          nome: req?.nome || found?.nome || "Membro",
          nickname: req?.nickname ?? found?.nickname ?? null,
          telefone: req?.telefone || found?.telefone || null,
          game_id: req?.game_id || found?.game_id || null,
          discord_id: req?.discord_id || found?.discord_id || null,
          discord_username: req?.discord_username || found?.discord_username || null,
          discord_avatar_url: req?.discord_avatar_url || found?.discord_avatar_url || null,
          discord_email: req?.discord_email || found?.discord_email || null,
          avatar_url: req?.discord_avatar_url || found?.avatar_url || null,
          status: "ativo",
          data_entrada: found?.data_entrada || new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        };

        await rtdb.set(`profiles/${profileKey}`, profileData);

        // Atualizar user_roles
        const roles = await rtdb.getList<any>("user_roles");
        const foundRole = roles.find(r => r.user_id === targetId);
        const roleKey = foundRole?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : targetId);
        await rtdb.set(`user_roles/${roleKey}`, {
          id: roleKey,
          user_id: targetId,
          nivel: data.nivel || "novato",
          updated_at: new Date().toISOString(),
        });

        rtdb.triggerRealtimeNotification("profiles", "UPDATE", profileData);
        rtdb.triggerRealtimeNotification("user_roles", "UPDATE", { user_id: targetId, nivel: data.nivel || "novato" });
        rtdb.triggerRealtimeNotification("signup_requests", "UPDATE", { id: data.requestId, status: "aprovado" });
      }
    } catch (fbErr) {
      console.warn("Erro ao aprovar cadastro no Firebase RTDB:", fbErr);
    }
  } else {
    try {
      await rtdb.remove(`signup_requests/${data.requestId}`);
      if (targetId) {
        const profiles = await rtdb.getList<any>("profiles");
        const found = profiles.find(p => p.user_id === targetId || p.id === targetId);
        if (found?.id) await rtdb.remove(`profiles/${found.id}`);
        const roles = await rtdb.getList<any>("user_roles");
        const foundRole = roles.find(r => r.user_id === targetId);
        if (foundRole?.id) await rtdb.remove(`user_roles/${foundRole.id}`);

        rtdb.triggerRealtimeNotification("profiles", "DELETE", { user_id: targetId });
        rtdb.triggerRealtimeNotification("user_roles", "DELETE", { user_id: targetId });
        rtdb.triggerRealtimeNotification("signup_requests", "DELETE", { id: data.requestId });
      }
    } catch (fbErr) {
      console.warn("Erro ao rejeitar cadastro no Firebase RTDB:", fbErr);
    }
  }

  // 2. Tentar atualizar no Supabase se disponível
  try {
    const args: { _request_id: string; _approve: boolean; _nivel?: AppLevel; _reason?: string } = {
      _request_id: data.requestId,
      _approve: data.approve,
      _nivel: data.nivel || 'novato',
    };
    if (data.reason) args._reason = data.reason;
    await supabase.rpc("review_signup_request", args);
  } catch {}

  if (data.approve) {
    void logAuditAction("approve_signup", "signup_requests", {
      request_id: data.requestId,
      target_id: targetId,
      nome: applicantName,
      nivel: data.nivel || "novato",
    });

    if (targetId) {
      void createNotification({
        title: "Cadastro Aprovado! 🎉",
        message: "Seu pedido de cadastro foi aprovado pela liderança. Bem-vindo à grupo!",
        type: "signup",
        category: "success",
        user_id: targetId,
        link: "/",
      });
    }
  } else {
    void logAuditAction("reject_signup", "signup_requests", {
      request_id: data.requestId,
      target_id: targetId,
      nome: applicantName,
      reason: data.reason || null,
    });
  }

  void broadcastPermissionsRealtimeUpdate({
    type: "profiles",
    userId: targetId || undefined,
  });
}

export async function getPendingSignupRequests(enabled?: boolean): Promise<PendingSignupRequest[]> {
  if (enabled === false) return [];
  let listData: any[] = [];
  try {
    const allSignups = await rtdb.getList<any>("signup_requests");
    listData = allSignups.filter(s => s.status === "pendente");
    listData.sort((a, b) => new Date(a.requested_at || 0).getTime() - new Date(b.requested_at || 0).getTime());
  } catch {}

  if (!listData || listData.length === 0) {
    try {
      const { data, error } = await (supabase.from("signup_requests" as any))
        .select("id, user_id, nome, nickname, telefone, game_id, requested_at, status, discord_id, discord_username, discord_avatar_url, discord_email")
        .eq("status", "pendente")
        .order("requested_at", { ascending: true });
      if (!error && data) listData = data;
    } catch {}
  }

  return (listData || []).map((d: any) => ({
    id: d.id,
    user_id: d.user_id,
    nome: d.nome,
    nickname: d.nickname ?? null,
    telefone: d.telefone,
    game_id: d.game_id ?? null,
    email: d.discord_email ?? null,
    requested_at: String(d.requested_at),
    status: d.status as any,
    discord_id: d.discord_id ?? null,
    discord_username: d.discord_username ?? null,
    discord_avatar_url: d.discord_avatar_url ?? null,
    discord_email: d.discord_email ?? null,
  }));
}

export async function getAuditLogs(_enabled?: boolean, _offset = 0, _limit = 500): Promise<AuditLog[]> {
  return [];
}

export async function getRolePermissions(): Promise<Record<AppLevel, Permission[]>> {
  let rows: any[] = [];
  try {
    const fbPerms = await rtdb.getList<any>("role_permissions");
    rows = fbPerms.filter((r) => !String(r.level || r.nivel || "").startsWith("system_"));
  } catch {}

  if (!rows || rows.length === 0) {
    try {
      const res = await supabase
        .from("role_permissions")
        .select("level, nivel, permissions")
        .not("level", "like", "system_%");
      if (!res.error && res.data && res.data.length > 0) {
        rows = res.data;
      }
    } catch {}
  }

  const map: Record<string, Permission[]> = {};
  rows.forEach((row) => {
    const lvl = row.level || row.nivel;
    if (lvl) {
      let perms = row.permissions;
      if (typeof perms === "string") {
        try {
          perms = JSON.parse(perms);
        } catch {
          perms = [];
        }
      }
      map[lvl] = Array.isArray(perms) ? (perms as Permission[]) : [];
    }
  });
  return map as Record<AppLevel, Permission[]>;
}

export async function saveRolePermissions(level: AppLevel, permissions: Permission[]): Promise<void> {
  try {
    await rtdb.set(`role_permissions/${level}`, {
      level,
      nivel: level,
      permissions,
      updated_at: new Date().toISOString(),
    });
  } catch (fbErr) {
    console.warn("Erro ao salvar role_permissions no Firebase RTDB:", fbErr);
  }

  try {
    const { error: rpcErr } = await supabase.rpc("save_role_permissions", {
      _level: level,
      _permissions: permissions,
    });

    if (rpcErr) {
      await supabase
        .from("role_permissions")
        .upsert(
          {
            level,
            nivel: level,
            permissions,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "level" }
        );
    }
  } catch {}

  void logAuditAction("save_role_permissions", "role_permissions", {
    level,
    level_label: LEVEL_LABEL[level] || level,
    permissions_count: permissions.length,
    permissions,
  });

  void broadcastPermissionsRealtimeUpdate({
    type: "role_permissions",
    level,
  });
}

export async function submitMovement({ data }: { data: { productId: string; type: "entrada" | "saida"; quantity: number; reason?: string; bauId?: string } }): Promise<{ success: boolean }> {
  const listBaus = await getBaus();
  const defaultBauId = listBaus[0]?.id || null;

  const products = await getProducts();
  const prod = products.find(p => p.id === data.productId);
  const bauIdToUse = data.bauId || prod?.bau_id || defaultBauId;
  const bau = listBaus.find(b => b.id === bauIdToUse);

  const currentDbStock = prod ? Number(prod.estoque_atual || 0) : 0;
  const prevBalance = currentDbStock;
  const newBalance = data.type === "entrada" ? prevBalance + data.quantity : prevBalance - data.quantity;

  const currentAuth = await getCurrentAuth();
  const currentUserId = currentAuth.user?.id || "sistema";

  const newMovementId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `mov_${Date.now()}`;
  const now = new Date().toISOString();

  const newMovement = {
    id: newMovementId,
    product_id: data.productId,
    user_id: currentUserId,
    bau_id: bauIdToUse,
    type: data.type,
    quantity: data.quantity,
    previous_balance: prevBalance,
    resulting_balance: newBalance,
    reason: data.reason?.trim() || null,
    origin: "manual",
    created_at: now,
  };

  // 1. Salvar movimentação no Firebase RTDB
  try {
    await rtdb.set(`stock_movements/${newMovementId}`, newMovement);
  } catch (err) {
    console.error("Erro ao salvar stock_movement no RTDB:", err);
  }

  // 2. Atualizar estoque do produto no Firebase RTDB
  if (prod) {
    try {
      await rtdb.update(`products/${data.productId}`, {
        estoque_atual: newBalance,
        updated_at: now,
      });
    } catch {}
  }

  // 3. Atualizar estoque do baú (product_baus) no Firebase RTDB
  if (bauIdToUse) {
    try {
      const key = `${data.productId}_${bauIdToUse}`;
      const currentPb = await rtdb.get<any>(`product_baus/${key}`);
      const currentPbQty = currentPb ? Number(currentPb.quantidade || 0) : 0;
      const newPbQty = data.type === "entrada" ? currentPbQty + data.quantity : currentPbQty - data.quantity;
      await rtdb.set(`product_baus/${key}`, {
        product_id: data.productId,
        bau_id: bauIdToUse,
        quantidade: newPbQty,
      });
    } catch {}
  }

  // 4. Fallback Supabase
  try {
    const args: any = {
      _product_id: data.productId,
      _type: data.type,
      _quantity: data.quantity,
    };
    if (data.reason?.trim()) args._reason = data.reason.trim();
    if (bauIdToUse) args._bau_id = bauIdToUse;
    await supabase.rpc("register_movement", args);
  } catch {}

  void logAuditAction(
    "create_movement",
    "stock_movements",
    {
      type: data.type,
      quantity: data.quantity,
      product_id: data.productId,
      product_name: prod?.nome || "Produto",
      bau_id: bauIdToUse,
      bau_name: bau?.nome || undefined,
      previous_balance: prevBalance,
      resulting_balance: newBalance,
      reason: data.reason?.trim() || "Sem observação",
    },
    undefined,
    data.productId
  );

  if (newBalance <= (prod?.estoque_minimo || 0)) {

    void createNotification({
      title: `⚠️ Estoque Baixo: ${prod?.nome || "Produto"}`,
      message: `O estoque de ${prod?.nome} atingiu nível crítico: ${newBalance} ${prod?.unidade || "unid."} restantes.`,
      type: "movement",
      category: "warning",
      target_roles: ["01", "02", "gerente", "desenvolvedor"],
      link: "/baus",
    });
  }

  return { success: true };
}

export async function submitChestTransfer(payload: {
  fromBauId: string;
  toBauId: string;
  productId: string;
  quantity: number;
  reason?: string;
}): Promise<void> {
  if (!payload.fromBauId || !payload.toBauId) {
    throw new Error("Selecione os baús de origem e destino.");
  }
  if (payload.fromBauId === payload.toBauId) {
    throw new Error("O baú de destino deve ser diferente do baú de origem.");
  }
  if (!payload.productId) {
    throw new Error("Selecione o produto a ser transferido.");
  }
  if (!payload.quantity || payload.quantity <= 0) {
    throw new Error("A quantidade de transferência deve ser maior que zero.");
  }

  const [listBaus, listProds] = await Promise.all([
    getBaus(),
    getProducts(),
  ]);

  const fromBau = listBaus.find((b) => b.id === payload.fromBauId);
  const toBau = listBaus.find((b) => b.id === payload.toBauId);
  const prod = listProds.find((p) => p.id === payload.productId);

  const fromBauName = fromBau?.nome || "Baú";
  const toBauName = toBau?.nome || "Baú";
  const prodName = prod?.nome || "Produto";
  const obs = payload.reason?.trim() ? ` (${payload.reason.trim()})` : "";

  // 1. Saída do baú de origem
  await submitMovement({
    data: {
      productId: payload.productId,
      type: "saida",
      quantity: payload.quantity,
      bauId: payload.fromBauId,
      reason: `Transferência para ${toBauName}${obs}`,
    },
  });

  // 2. Entrada no baú de destino
  await submitMovement({
    data: {
      productId: payload.productId,
      type: "entrada",
      quantity: payload.quantity,
      bauId: payload.toBauId,
      reason: `Transferência vinda de ${fromBauName}${obs}`,
    },
  });

  // 3. Audit log
  void logAuditAction("transfer_between_chests", "stock_movements", {
    product_id: payload.productId,
    product_name: prodName,
    from_bau_id: payload.fromBauId,
    from_bau_name: fromBauName,
    to_bau_id: payload.toBauId,
    to_bau_name: toBauName,
    quantity: payload.quantity,
    reason: payload.reason || null,
  });

  void createNotification({
    title: "Transferência entre Baús Realizada",
    message: `${payload.quantity}x ${prodName} transferidos de "${fromBauName}" para "${toBauName}".`,
    type: "movement",
    category: "info",
    target_roles: ["01", "02", "gerente", "desenvolvedor"],
    link: "/baus",
  });
}

export async function batchSubmitMovements(items: { productId: string; type: "entrada" | "saida"; quantity: number; reason?: string; bauId?: string }[]): Promise<void> {
  for (const item of items) {
    await submitMovement({ data: item });
  }

  // Summary audit log for the batch operation
  const entradas = items.filter(i => i.type === "entrada").length;
  const saidas = items.filter(i => i.type === "saida").length;
  void logAuditAction("batch_movement", "stock_movements", {
    total_items: items.length,
    entradas,
    saidas,
    products: items.map(i => i.productId),
  });
}

export async function reverseMovement(movementId: string, reason?: string): Promise<void> {
  let oldMov: any = null;
  try {
    oldMov = await rtdb.get<any>(`stock_movements/${movementId}`);
  } catch {}

  if (!oldMov) {
    try {
      const { data } = await supabase.from("stock_movements").select("product_id, type, quantity, reason, bau_id").eq("id", movementId).maybeSingle();
      oldMov = data;
    } catch {}
  }

  let prodName = "Produto";
  if (oldMov?.product_id) {
    try {
      const prods = await getProducts();
      const p = prods.find((item) => item.id === oldMov.product_id);
      if (p?.nome) prodName = p.nome;
    } catch {}
  }

  const rawReason = reason?.trim() || "Estorno de movimentação";

  if (oldMov && oldMov.product_id && oldMov.quantity) {
    try {
      const reverseType = oldMov.type === "entrada" ? "saida" : "entrada";
      await submitMovement({
        data: {
          productId: oldMov.product_id,
          type: reverseType,
          quantity: oldMov.quantity,
          bauId: oldMov.bau_id || undefined,
          reason: `[ESTORNO] ${rawReason}`,
        },
      });
    } catch (fbErr) {
      console.warn("Erro ao estornar movimentação no RTDB:", fbErr);
    }
  }

  try {
    const args: { _movement_id: string; _reason?: string } = {
      _movement_id: movementId,
      _reason: rawReason,
    };
    await supabase.rpc("reverse_movement", args);
  } catch {}

  void logAuditAction("reverse_movement", "stock_movements", {
    movement_id: movementId,
    product_name: prodName,
    original_type: oldMov?.type || "desconhecido",
    original_quantity: oldMov?.quantity,
    reason: rawReason,
  }, undefined, movementId);

  void createNotification({
    title: "Movimentação Estornada",
    message: `Estorno de ${oldMov?.quantity || ""}x ${prodName}. Motivo: "${rawReason}"`,
    type: "movement",
    category: "warning",
    target_roles: ["01", "02", "gerente", "desenvolvedor"],
    link: "/movimentacoes",
  });
}

export async function getDiscordStockConfig(): Promise<DiscordStockConfig> {
  try {
    const list = await rtdb.getList<DiscordStockConfig>("discord_stock_config");
    if (list && list.length > 0) {
      return list[0];
    }
  } catch {}

  try {
    const { data } = await supabase
      .from("discord_stock_config")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) return data as DiscordStockConfig;
  } catch {}

  return {
    id: "5997be53-3053-4bae-8d4c-126efb6f4b6d",
    is_active: true,
    allow_negative_stock: true,
  } as DiscordStockConfig;
}

export async function updateDiscordStockConfig(payload: Partial<DiscordStockConfig>): Promise<DiscordStockConfig> {
  const current = await getDiscordStockConfig();
  const targetId = current.id || "5997be53-3053-4bae-8d4c-126efb6f4b6d";

  const updates: any = {
    ...payload,
    updated_at: new Date().toISOString(),
  };
  delete updates.created_at;

  const merged = { ...current, ...updates };

  try {
    await rtdb.update(`discord_stock_config/${targetId}`, updates);
  } catch (err) {
    console.warn("Erro ao atualizar discord_stock_config no Firebase RTDB:", err);
  }

  try {
    await supabase.from("discord_stock_config").update(updates).eq("id", targetId);
  } catch {}

  return merged as DiscordStockConfig;
}

export async function sanitizeNegativeStocks(): Promise<{ success: boolean; fixed_baus: number; fixed_products: number }> {
  const { data, error } = await supabase.rpc("sanitize_negative_stocks");
  if (error) throw error;
  return data as any;
}

export async function getDiscordStockLogs(_limit = 50): Promise<DiscordStockLog[]> {
  // Sistema de logs do Discord desativado para economia de banco de dados
  return [];
}

export async function adjustStockDev(payload: {
  bauId: string;
  productId: string;
  adjustmentType: "definir" | "entrada" | "saida";
  quantity: number;
  reason: string;
}): Promise<{ success: boolean; movement_id: string; previous_balance: number; resulting_balance: number; global_balance: number }> {
  const { data, error } = await supabase.rpc("adjust_stock_dev", {
    p_bau_id: payload.bauId,
    p_product_id: payload.productId,
    p_adjustment_type: payload.adjustmentType,
    p_quantity: payload.quantity,
    p_reason: payload.reason,
  });

  if (error) throw error;
  return data as any;
}

export async function submitSale({
  data,
}: {
  data: {
    productId: string;
    quantity: number;
    unitPrice: number;
    buyerName: string;
    paymentMethod: string;
    notes?: string;
    discount?: number;
  };
}): Promise<{ success: boolean }> {
  const currentAuth = await getCurrentAuth();
  const sellerId = currentAuth.user?.id || "system";

  const discount = Math.max(0, Number(data.discount || 0));
  const totalPrice = Math.max(0, data.quantity * data.unitPrice - discount);
  const now = new Date().toISOString();
  const saleId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `sale_${Date.now()}`;

  // 1. Obter produto
  const allProds = await getProducts();
  const prod = allProds.find((p) => p.id === data.productId);
  const prodName = prod?.nome || "Produto";

  // 2. Gravar Venda no Firebase RTDB
  const saleRecord: Sale = {
    id: saleId,
    product_id: data.productId,
    seller_id: sellerId,
    buyer_name: data.buyerName.trim(),
    quantity: data.quantity,
    unit_price: data.unitPrice,
    total_price: totalPrice,
    payment_method: data.paymentMethod || "dinheiro",
    notes: data.notes?.trim() || null,
    status: "concluida",
    discount,
    created_at: now,
  };

  try {
    await rtdb.set(`sales/${saleId}`, saleRecord);
  } catch (fbErr) {
    console.warn("Erro ao gravar venda no RTDB:", fbErr);
  }

  // 3. Atualizar estoque do produto no RTDB
  if (prod) {
    const prevStock = Number(prod.estoque_atual || 0);
    const newStock = Math.max(0, prevStock - data.quantity);
    await rtdb.update(`products/${prod.id}`, {
      estoque_atual: newStock,
      updated_at: now,
    }).catch(() => {});

    if (prod.bau_id) {
      const pbKey = `${prod.id}_${prod.bau_id}`;
      const pbData = await rtdb.get<any>(`product_baus/${pbKey}`);
      if (pbData) {
        const pbPrev = Number(pbData.quantidade || pbData.estoque_atual || 0);
        const pbNew = Math.max(0, pbPrev - data.quantity);
        await rtdb.set(`product_baus/${pbKey}`, {
          product_id: prod.id,
          bau_id: prod.bau_id,
          quantidade: pbNew.toFixed(2),
          updated_at: now,
        }).catch(() => {});
      }
    }

    const movId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `mov_${Date.now()}`;
    await rtdb.set(`stock_movements/${movId}`, {
      id: movId,
      product_id: prod.id,
      user_id: sellerId,
      bau_id: prod.bau_id || null,
      type: "saida",
      quantity: data.quantity,
      previous_balance: prevStock,
      resulting_balance: newStock,
      reason: `Venda para ${data.buyerName} (R$ ${totalPrice.toLocaleString("pt-BR")})`,
      sale_id: saleId,
      origin: "venda",
      status: "completed",
      created_at: now,
    }).catch(() => {});

    await rtdb.set("system_stock_sync_pulse", {
      timestamp: Date.now(),
      sale_id: saleId,
      product_id: prod.id,
    }).catch(() => {});
  }

  // 4. Fallback Supabase
  try {
    const args: any = {
      _product_id: data.productId,
      _quantity: data.quantity,
      _unit_price: data.unitPrice,
      _buyer_name: data.buyerName,
      _payment_method: data.paymentMethod || "dinheiro",
      _discount: discount,
    };
    if (data.notes) args._notes = data.notes;
    await supabase.rpc("create_sale", args);
  } catch {}

  void logAuditAction(
    "create_sale",
    "sales",
    {
      product_id: data.productId,
      product_name: prodName,
      quantity: data.quantity,
      unit_price: data.unitPrice,
      discount: discount,
      total_price: totalPrice,
      buyer_name: data.buyerName,
      payment_method: data.paymentMethod || "dinheiro",
      notes: data.notes || null,
    },
    undefined,
    data.productId
  );

  void createNotification({
    title: "Nova Venda Registrada",
    message: `${data.quantity}x ${prodName} para ${data.buyerName} (R$ ${totalPrice.toLocaleString("pt-BR")}).`,
    type: "sale",
    category: "success",
    target_roles: ["01", "02", "gerente", "desenvolvedor"],
    link: "/vendas",
  });

  return { success: true };
}

export async function submitMultiSale({
  data,
}: {
  data: {
    items: { productId: string; quantity: number; unitPrice: number; discount?: number }[];
    buyerName: string;
    paymentMethod: string;
    notes?: string;
    totalDiscount?: number;
  };
}): Promise<{ success: boolean; group_id: string; items_count: number }> {
  const currentAuth = await getCurrentAuth();
  const sellerId = currentAuth.user?.id || "system";
  const groupId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `group_${Date.now()}`;
  const now = new Date().toISOString();
  const allProds = await getProducts();

  const totalDiscount = Math.max(0, Number(data.totalDiscount || 0));
  const totalRaw = data.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const netTotal = Math.max(0, totalRaw - totalDiscount);

  for (let idx = 0; idx < data.items.length; idx++) {
    const it = data.items[idx];
    const saleId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `sale_${Date.now()}_${idx}`;
    const prod = allProds.find((p) => p.id === it.productId);
    const itemDiscount = it.discount || 0;
    const itemTotalPrice = Math.max(0, it.quantity * it.unitPrice - itemDiscount);

    const saleRecord: Sale = {
      id: saleId,
      product_id: it.productId,
      seller_id: sellerId,
      buyer_name: data.buyerName.trim(),
      quantity: it.quantity,
      unit_price: it.unitPrice,
      total_price: itemTotalPrice,
      payment_method: data.paymentMethod || "dinheiro",
      notes: data.notes?.trim() || null,
      status: "concluida",
      discount: itemDiscount,
      group_id: groupId,
      created_at: now,
    };

    await rtdb.set(`sales/${saleId}`, saleRecord).catch(() => {});

    if (prod) {
      const prevStock = Number(prod.estoque_atual || 0);
      const newStock = Math.max(0, prevStock - it.quantity);
      await rtdb.update(`products/${prod.id}`, {
        estoque_atual: newStock,
        updated_at: now,
      }).catch(() => {});

      if (prod.bau_id) {
        const pbKey = `${prod.id}_${prod.bau_id}`;
        const pbData = await rtdb.get<any>(`product_baus/${pbKey}`);
        if (pbData) {
          const pbPrev = Number(pbData.quantidade || pbData.estoque_atual || 0);
          const pbNew = Math.max(0, pbPrev - it.quantity);
          await rtdb.set(`product_baus/${pbKey}`, {
            product_id: prod.id,
            bau_id: prod.bau_id,
            quantidade: pbNew.toFixed(2),
            updated_at: now,
          }).catch(() => {});
        }
      }

      const movId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `mov_${Date.now()}_${idx}`;
      await rtdb.set(`stock_movements/${movId}`, {
        id: movId,
        product_id: prod.id,
        user_id: sellerId,
        bau_id: prod.bau_id || null,
        type: "saida",
        quantity: it.quantity,
        previous_balance: prevStock,
        resulting_balance: newStock,
        reason: `Venda múltipla para ${data.buyerName}`,
        sale_id: saleId,
        origin: "venda",
        status: "completed",
        created_at: now,
      }).catch(() => {});
    }
  }

  await rtdb.set("system_stock_sync_pulse", {
    timestamp: Date.now(),
    group_id: groupId,
    items_count: data.items.length,
  }).catch(() => {});

  try {
    await supabase.rpc("create_multi_sale", {
      p_items: data.items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        discount: i.discount || 0,
      })),
      p_buyer_name: data.buyerName.trim(),
      p_payment_method: data.paymentMethod || "dinheiro",
      p_notes: data.notes?.trim() || null,
      p_total_discount: totalDiscount,
    });
  } catch {}

  void createNotification({
    title: "Nova Venda Multi-Item Registrada",
    message: `${data.items.length} itens para ${data.buyerName} (R$ ${netTotal.toLocaleString("pt-BR")}).`,
    type: "sale",
    category: "success",
    target_roles: ["01", "02", "gerente", "desenvolvedor"],
    link: "/vendas",
  });

  return { success: true, group_id: groupId, items_count: data.items.length };
}

export async function reverseSale(saleId: string, reason?: string): Promise<void> {
  const sale = await rtdb.get<any>(`sales/${saleId}`);
  if (sale) {
    const now = new Date().toISOString();
    await rtdb.update(`sales/${saleId}`, {
      status: "estornada",
      updated_at: now,
    }).catch(() => {});

    const prod = await rtdb.get<any>(`products/${sale.product_id}`);
    if (prod) {
      const prevStock = Number(prod.estoque_atual || 0);
      const newStock = prevStock + Number(sale.quantity || 0);
      await rtdb.update(`products/${prod.id}`, {
        estoque_atual: newStock,
        updated_at: now,
      }).catch(() => {});

      if (prod.bau_id) {
        const pbKey = `${prod.id}_${prod.bau_id}`;
        const pbData = await rtdb.get<any>(`product_baus/${pbKey}`);
        if (pbData) {
          const pbPrev = Number(pbData.quantidade || pbData.estoque_atual || 0);
          const pbNew = pbPrev + Number(sale.quantity || 0);
          await rtdb.set(`product_baus/${pbKey}`, {
            product_id: prod.id,
            bau_id: prod.bau_id,
            quantidade: pbNew.toFixed(2),
            updated_at: now,
          }).catch(() => {});
        }
      }

      const movId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `mov_${Date.now()}`;
      await rtdb.set(`stock_movements/${movId}`, {
        id: movId,
        product_id: prod.id,
        user_id: sale.seller_id || "system",
        bau_id: prod.bau_id || null,
        type: "entrada",
        quantity: Number(sale.quantity || 0),
        previous_balance: prevStock,
        resulting_balance: newStock,
        reason: `[ESTORNO DE VENDA] ${reason || "Estorno solicitado"}`,
        sale_id: saleId,
        origin: "estorno_venda",
        status: "completed",
        created_at: now,
      }).catch(() => {});

      await rtdb.set("system_stock_sync_pulse", {
        timestamp: Date.now(),
        reversal_sale_id: saleId,
      }).catch(() => {});
    }
  }

  try {
    const args: { _sale_id: string; _reason?: string } = {
      _sale_id: saleId,
    };
    if (reason) args._reason = reason;
    await supabase.rpc("reverse_sale", args);
  } catch {}

  void logAuditAction("reverse_sale", "sales", {
    sale_id: saleId,
    reason: reason || "Sem motivo informado",
  }, undefined, saleId);
}

export async function uploadProductImage(file: File): Promise<string> {
  const maxBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxBytes) {
    throw new Error("A imagem selecionada ultrapassa o limite de 15MB.");
  }

  const { uploadImageToPostimages } = await import("@/services/postimagesService");
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const cleanExt = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext) ? ext : "png";
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase().replace(/\.[^/.]+$/, "");
  const fileName = `item_${Date.now()}_${sanitizedName}.${cleanExt}`;

  return await uploadImageToPostimages(file, {
    filename: fileName,
    maxDimension: 1200,
    quality: 0.88,
  });
}

export async function uploadBauImage(file: File): Promise<string> {
  const maxBytes = 15 * 1024 * 1024; // 15MB
  if (file.size > maxBytes) {
    throw new Error("A imagem selecionada ultrapassa o limite de 15MB.");
  }

  const { uploadImageToPostimages } = await import("@/services/postimagesService");
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const cleanExt = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext) ? ext : "png";
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase().replace(/\.[^/.]+$/, "");
  const fileName = `bau_${Date.now()}_${sanitizedName}.${cleanExt}`;

  return await uploadImageToPostimages(file, {
    filename: fileName,
    maxDimension: 1920,
    quality: 0.92,
  });
}

export async function createProduct(payload: {
  nome: string;
  cda_name?: string | null;
  descricao?: string;
  categoria_id?: string;
  bau_id?: string;
  unidade?: string;
  estoque_minimo?: number;
  preco_sugerido?: number;
  imagem_url?: string;
  can_be_produced?: boolean;
  can_be_sold?: boolean;
  sale_available_quantity?: number;
  production_yield?: number;
}): Promise<Product> {
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();
  const newProduct: Product = {
    id: newId,
    nome: payload.nome.trim(),
    cda_name: payload.cda_name?.trim() || null,
    descricao: payload.descricao?.trim() || null,
    categoria_id: payload.categoria_id || null,
    bau_id: payload.bau_id || null,
    unidade: payload.unidade || "un",
    estoque_atual: 0,
    estoque_minimo: payload.estoque_minimo || 0,
    preco_sugerido: payload.preco_sugerido || 0,
    imagem_url: payload.imagem_url?.trim() || null,
    can_be_produced: payload.can_be_produced !== undefined ? payload.can_be_produced : false,
    can_be_sold: payload.can_be_sold !== undefined ? payload.can_be_sold : false,
    sale_available_quantity: Math.max(0, Number(payload.sale_available_quantity || 0)),
    production_yield: payload.production_yield !== undefined ? Math.max(0.001, Number(payload.production_yield)) : 1,
    ativo: true,
    created_at: now,
    updated_at: now,
  };

  try {
    await rtdb.set(`products/${newId}`, newProduct);
  } catch (fbErr) {
    console.warn("Erro ao salvar produto no Firebase RTDB:", fbErr);
  }

  try {
    await supabase.from("products").insert(newProduct);
  } catch {}

  // Sincronizar múltiplos aliases com discord_stock_config.item_mappings se informado
  if (payload.cda_name && payload.cda_name.trim()) {
    try {
      const conf = await getDiscordStockConfig();
      const currentMappings = conf?.item_mappings || {};
      const newMappings = { ...currentMappings };
      const aliases = payload.cda_name.split(/[,;\n|]+/).map((s: string) => s.trim()).filter(Boolean);
      for (const alias of aliases) {
        newMappings[alias.toLowerCase()] = newProduct.nome;
      }
      newMappings[newProduct.nome.trim().toLowerCase()] = newProduct.nome;
      await updateDiscordStockConfig({ item_mappings: newMappings });
    } catch (e) {
      console.warn("Could not sync item_mapping in discord_stock_config:", e);
    }
  }

  void logAuditAction("create_product", "products", { nome: newProduct.nome, cda_name: newProduct.cda_name, preco: newProduct.preco_sugerido, estoque_minimo: newProduct.estoque_minimo, imagem_url: newProduct.imagem_url, can_be_sold: newProduct.can_be_sold }, undefined, newProduct.id);

  return newProduct;
}

export async function updateProduct(payload: {
  id: string;
  nome?: string;
  cda_name?: string | null;
  descricao?: string;
  categoria_id?: string | null;
  bau_id?: string | null;
  unidade?: string;
  estoque_minimo?: number;
  preco_sugerido?: number;
  imagem_url?: string | null;
  can_be_produced?: boolean;
  can_be_sold?: boolean;
  sale_available_quantity?: number;
  production_yield?: number;
  ativo?: boolean;
}): Promise<void> {
  let oldProd: Product | undefined;
  try {
    const list = await getProducts();
    oldProd = list.find((p) => p.id === payload.id);
  } catch {}

  const updates: any = {};
  if (payload.nome !== undefined) updates.nome = payload.nome.trim();
  if (payload.cda_name !== undefined) updates.cda_name = payload.cda_name ? payload.cda_name.trim() : null;
  if (payload.descricao !== undefined) updates.descricao = payload.descricao.trim();
  if (payload.categoria_id !== undefined) updates.categoria_id = payload.categoria_id;
  if (payload.bau_id !== undefined) updates.bau_id = payload.bau_id;
  if (payload.unidade !== undefined) updates.unidade = payload.unidade;
  if (payload.estoque_minimo !== undefined) updates.estoque_minimo = payload.estoque_minimo;
  if (payload.preco_sugerido !== undefined) updates.preco_sugerido = payload.preco_sugerido;
  if (payload.can_be_produced !== undefined) updates.can_be_produced = payload.can_be_produced;
  if (payload.can_be_sold !== undefined) updates.can_be_sold = payload.can_be_sold;
  if (payload.sale_available_quantity !== undefined) updates.sale_available_quantity = Math.max(0, Number(payload.sale_available_quantity || 0));
  if (payload.production_yield !== undefined) updates.production_yield = Math.max(0.001, Number(payload.production_yield));
  if (payload.imagem_url !== undefined) {
    const rawImg = payload.imagem_url;
    updates.imagem_url = rawImg && typeof rawImg === "string" ? (rawImg.trim() || null) : null;
  }
  if (payload.ativo !== undefined) updates.ativo = payload.ativo;
  updates.updated_at = new Date().toISOString();

  try {
    await rtdb.update(`products/${payload.id}`, updates);
  } catch (fbErr) {
    console.warn("Erro ao atualizar produto no RTDB:", fbErr);
  }

  try {
    await supabase.from("products").update(updates).eq("id", payload.id);
  } catch {}

  // Sincronizar múltiplos aliases com discord_stock_config.item_mappings se cda_name ou nome foram alterados
  if (payload.cda_name !== undefined || payload.nome !== undefined) {
    try {
      const conf = await getDiscordStockConfig();
      const currentMappings = conf?.item_mappings || {};
      const newMappings = { ...currentMappings };

      if (oldProd?.cda_name) {
        const oldAliases = oldProd.cda_name.split(/[,;\n|]+/).map((s: string) => s.trim()).filter(Boolean);
        for (const oldAlias of oldAliases) {
          delete newMappings[oldAlias.toLowerCase()];
        }
      }
      if (oldProd?.nome && payload.nome && oldProd.nome.trim().toLowerCase() !== payload.nome.trim().toLowerCase()) {
        delete newMappings[oldProd.nome.trim().toLowerCase()];
      }

      const finalName = updates.nome || oldProd?.nome || "";
      const effectiveCda = updates.cda_name !== undefined ? updates.cda_name : oldProd?.cda_name;
      if (effectiveCda) {
        const newAliases = effectiveCda.split(/[,;\n|]+/).map((s: string) => s.trim()).filter(Boolean);
        for (const newAlias of newAliases) {
          newMappings[newAlias.toLowerCase()] = finalName;
        }
      }
      if (finalName) {
        newMappings[finalName.toLowerCase()] = finalName;
      }
      await updateDiscordStockConfig({ item_mappings: newMappings });
    } catch (e) {
      console.warn("Could not sync item_mapping in discord_stock_config:", e);
    }
  }

  void logAuditAction("update_product", "products", { id: payload.id, ...updates }, oldProd || undefined, payload.id);
}

export async function deleteProduct(id: string): Promise<void> {
  let oldProd: any = null;
  try {
    const list = await getProducts();
    oldProd = list.find((p) => p.id === id);
    await rtdb.remove(`products/${id}`);
  } catch (fbErr) {
    console.warn("Erro ao remover produto do RTDB:", fbErr);
  }

  try {
    await supabase.from("products").delete().eq("id", id);
  } catch {}

  void logAuditAction("delete_product", "products", { id, nome: oldProd?.nome, cda_name: oldProd?.cda_name }, oldProd || undefined, id);
}

export async function createCategory(payload: { nome: string; descricao?: string }): Promise<Category> {
  const cleanName = payload.nome.trim();
  if (!cleanName) throw new Error("Informe o nome da categoria.");

  const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `cat_${Date.now()}`;
  const now = new Date().toISOString();
  const newCat: Category = {
    id,
    nome: cleanName,
    descricao: payload.descricao?.trim() || null,
    ativo: true,
    created_at: now,
  };

  try {
    await rtdb.set(`categories/${id}`, newCat);
  } catch (fbErr) {
    console.warn("Erro ao salvar categoria no RTDB:", fbErr);
  }

  try {
    await supabase.from("categories").insert({
      id,
      nome: newCat.nome,
      descricao: newCat.descricao,
      ativo: true,
      created_at: now,
    });
  } catch {}

  void logAuditAction("create_category", "categories", { nome: newCat.nome, descricao: newCat.descricao }, undefined, id);

  return newCat;
}

export async function updateCategory(payload: { id: string; nome?: string; descricao?: string; ativo?: boolean }): Promise<void> {
  let oldCat: any = null;
  try {
    oldCat = await rtdb.get<any>(`categories/${payload.id}`);
  } catch {}

  const updates: any = {};
  if (payload.nome !== undefined) updates.nome = payload.nome.trim();
  if (payload.descricao !== undefined) updates.descricao = payload.descricao ? payload.descricao.trim() : null;
  if (payload.ativo !== undefined) updates.ativo = payload.ativo;
  updates.updated_at = new Date().toISOString();

  try {
    await rtdb.update(`categories/${payload.id}`, updates);
  } catch (fbErr) {
    console.warn("Erro ao atualizar categoria no RTDB:", fbErr);
  }

  try {
    await supabase.from("categories").update(updates).eq("id", payload.id);
  } catch {}

  void logAuditAction("update_category", "categories", { id: payload.id, ...updates }, oldCat || undefined, payload.id);
}

export async function deleteCategory(id: string): Promise<void> {
  let oldCat: any = null;
  try {
    oldCat = await rtdb.get<any>(`categories/${id}`);
    await rtdb.remove(`categories/${id}`);
  } catch {}

  try {
    await supabase.from("categories").delete().eq("id", id);
  } catch {}

  void logAuditAction("delete_category", "categories", { id, nome: oldCat?.nome }, undefined, id);
}

export async function createGoal(payload: { user_id: string; type: "vendas" | "faturamento" | "quantidade"; target_value: number; period_start: string; period_end: string; descricao?: string }): Promise<Goal> {
  let targetName = "Membro";
  try {
    const profiles = await rtdb.getList<any>("profiles");
    const targetProfile = profiles.find((p: any) => p.user_id === payload.user_id || p.id === payload.user_id);
    if (targetProfile) {
      targetName = targetProfile.nickname || targetProfile.nome || "Membro";
    }
  } catch {}

  const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `goal_${Date.now()}`;
  const now = new Date().toISOString();
  const newGoal: Goal = {
    id,
    user_id: payload.user_id,
    type: payload.type,
    target_value: Number(payload.target_value),
    period_start: String(payload.period_start),
    period_end: String(payload.period_end),
    descricao: payload.descricao?.trim() || null,
    created_at: now,
  };

  try {
    await rtdb.set(`goals/${id}`, newGoal);
  } catch (fbErr) {
    console.warn("Erro ao salvar meta no RTDB:", fbErr);
  }

  try {
    await supabase.from("goals").insert(newGoal);
  } catch {}

  const typeLabel = payload.type === "vendas" ? "Vendas" : payload.type === "faturamento" ? "Faturamento" : "Quantidade";
  void logAuditAction("create_goal", "goals", {
    target_name: targetName,
    goal_type: typeLabel,
    target_value: payload.target_value,
    period_start: payload.period_start,
    period_end: payload.period_end,
    descricao: payload.descricao || null,
  }, undefined, id);

  return newGoal;
}

export async function deleteGoal(id: string): Promise<void> {
  let oldGoal: any = null;
  try {
    oldGoal = await rtdb.get<any>(`goals/${id}`);
  } catch {}
  let targetName = "Membro";
  if (oldGoal?.user_id) {
    try {
      const profiles = await rtdb.getList<any>("profiles");
      const targetProfile = profiles.find((p: any) => p.user_id === oldGoal.user_id || p.id === oldGoal.user_id);
      if (targetProfile) targetName = targetProfile.nickname || targetProfile.nome || "Membro";
    } catch {}
  }
  const typeLabel = oldGoal?.type === "vendas" ? "Vendas" : oldGoal?.type === "faturamento" ? "Faturamento" : "Quantidade";

  try {
    await rtdb.remove(`goals/${id}`);
  } catch {}

  try {
    await supabase.from("goals").delete().eq("id", id);
  } catch {}

  void logAuditAction("delete_goal", "goals", {
    id,
    target_name: targetName,
    goal_type: typeLabel,
    target_value: oldGoal?.target_value,
  }, undefined, id);
}

/* ==========================================================================
   FUNDO DE CAIXA GERAL (CASH FUND API)
   ========================================================================== */

export async function getCashMovements(): Promise<CashMovement[]> {
  let data: any[] = [];
  try {
    data = await rtdb.getList<any>("cash_fund_movements");
  } catch {}

  if (!data || data.length === 0) {
    try {
      const res = await (supabase.from("cash_fund_movements" as any))
        .select("id, user_id, type, amount, motive, notes, status, previous_balance, resulting_balance, reversal_of, created_at");
      if (!res.error && res.data && res.data.length > 0) {
        data = res.data;
      }
    } catch {}
  }

  const members = await getMembers();
  const profileMap = new Map<string, { name: string; avatar: string | null }>();
  members.forEach((m) => {
    profileMap.set(m.user_id, {
      name: m.nickname || m.nome || "Membro",
      avatar: m.avatar_url || m.discord_avatar_url || null,
    });
  });

  // Ordenação cronológica ascendente para cálculo exato e consistente do saldo acumulado
  const sortedAsc = [...(data || [])].sort((a: any, b: any) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (diff !== 0) return diff;
    return String(a.id).localeCompare(String(a.id));
  });

  let runningBalance = 0;

  const processed: CashMovement[] = sortedAsc.map((d: any) => {
    const prof = d.user_id ? profileMap.get(d.user_id) : null;
    const amt = Math.round((Number(d.amount) || 0) * 100) / 100;
    const isEstornado = d.status === "estornado";

    const prevBal = runningBalance;
    let resBal = runningBalance;

    if (!isEstornado) {
      if (d.type === "entrada") {
        runningBalance = Math.round((runningBalance + amt) * 100) / 100;
      } else {
        runningBalance = Math.round((runningBalance - amt) * 100) / 100;
      }
      resBal = runningBalance;
    }

    return {
      id: String(d.id),
      user_id: d.user_id ? String(d.user_id) : null,
      type: d.type as "entrada" | "saida",
      amount: amt,
      motive: String(d.motive),
      notes: d.notes ? String(d.notes) : null,
      status: d.status ? String(d.status) : "ativo",
      previous_balance: isEstornado ? Number(d.previous_balance) : prevBal,
      resulting_balance: isEstornado ? Number(d.resulting_balance) : resBal,
      reversal_of: d.reversal_of ? String(d.reversal_of) : null,
      created_at: String(d.created_at),
      user_name: prof?.name || "Sistema",
      user_avatar_url: prof?.avatar || undefined,
    };
  });

  // Retorna ordenado do mais recente para o mais antigo (padrão de extrato financeiro)
  return processed.sort((a, b) => {
    const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (diff !== 0) return diff;
    return String(b.id).localeCompare(String(a.id));
  });
}

export async function submitCashMovement(payload: {
  type: "entrada" | "saida";
  amount: number;
  motive: string;
  notes?: string | undefined;
}): Promise<void> {
  const auth = await getCurrentAuth();
  const currentUserId = auth.user?.id || null;
  const newId = crypto.randomUUID();
  const newMovement = {
    id: newId,
    user_id: currentUserId,
    type: payload.type,
    amount: payload.amount,
    motive: payload.motive.trim(),
    notes: payload.notes?.trim() || null,
    status: "ativo",
    created_at: new Date().toISOString(),
  };

  try {
    await rtdb.set(`cash_fund_movements/${newId}`, newMovement);
  } catch (fbErr) {
    console.warn("Erro ao salvar cash_fund_movement no RTDB:", fbErr);
  }

  try {
    await (supabase.rpc as any)("register_cash_movement", {
      _type: payload.type,
      _amount: payload.amount,
      _motive: payload.motive.trim(),
      _notes: payload.notes?.trim() || null,
    });
  } catch {}
}

export async function reverseCashMovement(movementId: string, reason?: string | undefined): Promise<void> {
  try {
    await rtdb.update(`cash_fund_movements/${movementId}`, {
      status: "estornado",
      reversal_reason: reason?.trim() || null,
      updated_at: new Date().toISOString(),
    });
  } catch {}

  try {
    await (supabase.rpc as any)("reverse_cash_movement", {
      _movement_id: movementId,
      _reason: reason?.trim() || null,
    });
  } catch {}
}

export async function deleteCashMovement(movementId: string): Promise<void> {
  try {
    await rtdb.remove(`cash_fund_movements/${movementId}`);
  } catch {}

  try {
    await (supabase.rpc as any)("delete_cash_movement", {
      _movement_id: movementId,
    });
  } catch {}
}

/* ==========================================================================
   GERENCIAMENTO DE CARGOS E PERMISSÕES GRANULARES (CUSTOM ROLES API)
   ========================================================================== */

export async function getCustomRoles(): Promise<CustomRole[]> {
  let list: any[] = [];
  try {
    list = await rtdb.getList<any>("custom_roles");
  } catch {}

  if (!list || list.length === 0) {
    try {
      const { data } = await (supabase.from("custom_roles" as any))
        .select("id, nome, descricao, rank, is_system, module_permissions, created_at, updated_at")
        .order("rank", { ascending: false });
      if (data) list = data;
    } catch {}
  }

  return (list || []).map((d: any) => ({
    id: String(d.id),
    nome: String(d.nome),
    descricao: d.descricao ? String(d.descricao) : null,
    rank: Number(d.rank || 0),
    is_system: Boolean(d.is_system),
    module_permissions: (d.module_permissions || {}) as Record<SystemModule, ModuleAccessLevel>,
    created_at: String(d.created_at || new Date().toISOString()),
    updated_at: String(d.updated_at || new Date().toISOString()),
  })).sort((a, b) => b.rank - a.rank);
}

export async function saveCustomRole(payload: {
  id: string;
  nome: string;
  descricao?: string | undefined;
  rank?: number | undefined;
  module_permissions: Partial<Record<SystemModule, ModuleAccessLevel>>;
}): Promise<void> {
  const roleRecord = {
    id: payload.id,
    nome: payload.nome.trim(),
    descricao: payload.descricao?.trim() || null,
    rank: payload.rank || 1,
    module_permissions: payload.module_permissions,
    updated_at: new Date().toISOString(),
  };

  try {
    await rtdb.set(`custom_roles/${payload.id}`, roleRecord);
  } catch (fbErr) {
    console.warn("Erro ao salvar custom_roles no RTDB:", fbErr);
  }

  try {
    await (supabase.rpc as any)("save_custom_role", {
      _id: payload.id,
      _nome: payload.nome.trim(),
      _descricao: payload.descricao?.trim() || null,
      _rank: payload.rank || 1,
      _module_permissions: payload.module_permissions,
    });
  } catch {}

  void logAuditAction("save_custom_role", "custom_roles", {
    nome: payload.nome.trim(),
    descricao: payload.descricao?.trim() || null,
    rank: payload.rank || 1,
    module_permissions: payload.module_permissions,
  }, undefined, payload.id);

  void broadcastPermissionsRealtimeUpdate({
    type: "custom_roles",
    level: payload.id,
  });
}

export async function deleteCustomRole(roleId: string): Promise<void> {
  let oldRole: any = null;
  try {
    const list = await getCustomRoles();
    oldRole = list.find((r) => r.id === roleId);
    await rtdb.remove(`custom_roles/${roleId}`);
  } catch (fbErr) {
    console.warn("Erro ao remover custom_roles no RTDB:", fbErr);
  }

  try {
    await (supabase.rpc as any)("delete_custom_role", {
      _role_id: roleId,
    });
  } catch {}

  void logAuditAction("delete_custom_role", "custom_roles", {
    nome: oldRole?.nome || "Cargo",
    rank: oldRole?.rank,
  }, undefined, roleId);

  void broadcastPermissionsRealtimeUpdate({
    type: "custom_roles",
    level: roleId,
  });
}

export async function reorderCustomRoles(orderedIds: string[]): Promise<void> {
  try {
    const rankStep = 10;
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      const rank = (orderedIds.length - i) * rankStep;
      await rtdb.update(`custom_roles/${id}`, { rank, updated_at: new Date().toISOString() });
    }
  } catch {}

  try {
    await (supabase.rpc as any)("reorder_custom_roles", {
      _ordered_ids: orderedIds,
    });
  } catch {}

  void logAuditAction("reorder_custom_roles", "custom_roles", {
    total_reordered: orderedIds.length,
  });

  void broadcastPermissionsRealtimeUpdate({
    type: "custom_roles",
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   ABSENCES / LICENÇAS MANAGEMENT
   ══════════════════════════════════════════════════════════════════════════ */
const ABSENCES_STORAGE_KEY = "tw_absences_v1";
const ABSENCES_DB_LEVEL = "system_absences_list";

async function persistRolePermissionsData(level: string, permissions: any): Promise<void> {
  try {
    await rtdb.set(`role_permissions/${level}`, {
      level,
      nivel: level,
      permissions,
      updated_at: new Date().toISOString(),
    });

    if (level === WEEKLY_GOALS_DB_LEVEL && Array.isArray(permissions?.goals)) {
      for (const g of permissions.goals) {
        if (g?.id) {
          await rtdb.set(`weekly_goals/${g.id}`, g).catch(() => {});
          await rtdb.set(`goals/${g.id}`, g).catch(() => {});
        }
      }
    } else if (level === GOAL_SUBMISSIONS_DB_LEVEL && Array.isArray(permissions?.submissions)) {
      for (const s of permissions.submissions) {
        if (s?.id) {
          await rtdb.set(`goal_submissions/${s.id}`, s).catch(() => {});
        }
      }
    }
  } catch (fbErr) {
    console.warn(`Erro ao salvar ${level} no Firebase RTDB:`, fbErr);
  }

  try {
    const { error: rpcError } = await supabase.rpc("save_role_permissions", {
      _level: level,
      _permissions: permissions,
    });
    if (!rpcError) return;
  } catch {}

  try {
    await supabase.from("role_permissions").upsert(
      {
        level,
        nivel: level,
        permissions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.warn(`Erro ao salvar ${level} no banco:`, err);
  }
}

function getLocalAbsences(): MemberAbsence[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(ABSENCES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalAbsences(absences: MemberAbsence[], emitEvent: boolean = true): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(ABSENCES_STORAGE_KEY, JSON.stringify(absences));
      if (emitEvent) {
        window.dispatchEvent(new CustomEvent("tw_absences_updated"));
      }
    }
  } catch {}
}

export async function getAbsences(): Promise<MemberAbsence[]> {
  try {
    const rtdbEntry = await rtdb.get<any>(`role_permissions/${ABSENCES_DB_LEVEL}`);
    if (rtdbEntry && rtdbEntry.permissions && typeof rtdbEntry.permissions === "object") {
      const parsed = rtdbEntry.permissions as any;
      if (Array.isArray(parsed.absences)) {
        setLocalAbsences(parsed.absences, false);
        return parsed.absences;
      }
    }
  } catch {}

  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", ABSENCES_DB_LEVEL)
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      const parsed = data.permissions as any;
      if (Array.isArray(parsed.absences)) {
        setLocalAbsences(parsed.absences, false);
        return parsed.absences;
      }
    }
  } catch (err) {
    console.warn("Erro ao carregar ausências do banco:", err);
  }
  return getLocalAbsences();
}

export async function createAbsence(payload: CreateAbsencePayload): Promise<MemberAbsence> {
  const currentAuth = await getCurrentAuth().catch(() => ({ user: null, profile: null, level: null }));
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));

  // Caller ID and author info
  const callerUserId = session?.user?.id || currentAuth.user?.id || currentAuth.profile?.user_id || "sistema";
  const callerName = currentAuth.profile?.nickname || currentAuth.profile?.nome || "Liderança";
  const callerAvatar = currentAuth.profile?.avatar_url || currentAuth.profile?.discord_avatar_url || null;

  // Target user ID for the absence
  const targetUserId = payload.user_id || callerUserId;

  if (!targetUserId || targetUserId === "sistema") {
    throw new Error("Usuário não identificado. Selecione um membro na lista para registrar a ausência.");
  }

  // Resolve target member information
  let memberName = payload.member_name || "";
  let memberNickname = payload.member_nickname !== undefined ? payload.member_nickname : null;
  let memberAvatar = payload.member_avatar || null;
  let memberRole: AppLevel = (payload.member_role as AppLevel) || "membro";

  // If registering for caller and we have current profile, use it
  if (targetUserId === callerUserId && currentAuth.profile) {
    memberName = memberName || currentAuth.profile.nome || "Membro";
    memberNickname = memberNickname !== null ? memberNickname : (currentAuth.profile.nickname || null);
    memberAvatar = memberAvatar || currentAuth.profile.avatar_url || currentAuth.profile.discord_avatar_url || null;
    memberRole = (currentAuth.level as AppLevel) || memberRole;
  }

  // If details are still missing, query profiles & user_roles
  if (!memberName || memberName === "Membro") {
    try {
      const { data: profileRow } = await (supabase.from("profiles" as any))
        .select("nome, nickname, avatar_url, discord_avatar_url")
        .eq("user_id", targetUserId)
        .maybeSingle();

      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("nivel")
        .eq("user_id", targetUserId)
        .maybeSingle();

      const p = profileRow as any;
      if (p) {
        memberName = p.nome || memberName || "Membro";
        if (memberNickname === null && p.nickname !== undefined) memberNickname = p.nickname;
        if (!memberAvatar) memberAvatar = p.avatar_url || p.discord_avatar_url || null;
      }
      if (roleRow?.nivel) {
        memberRole = roleRow.nivel as AppLevel;
      }
    } catch {}
  }

  if (!memberName) memberName = "Membro";

  // Calculate days count
  const start = new Date(payload.start_date);
  const end = new Date(payload.end_date);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const daysCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const isAutoApproved = Boolean(payload.auto_approve === true);
  const now = new Date().toISOString();

  const newAbsence: MemberAbsence = {
    id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: targetUserId,
    member_name: memberName,
    member_nickname: memberNickname,
    member_role: memberRole,
    member_avatar: memberAvatar,
    start_date: payload.start_date,
    end_date: payload.end_date,
    days_count: daysCount,
    reason: payload.reason,
    reason_details: payload.reason_details?.trim() || null,
    status: isAutoApproved ? "aprovado" : "pendente",
    reviewed_by: isAutoApproved ? callerUserId : null,
    reviewed_by_name: isAutoApproved ? callerName : null,
    reviewed_at: isAutoApproved ? now : null,
    review_notes: isAutoApproved ? (payload.review_notes || "Aprovado no momento do cadastro pela liderança") : null,
    created_at: now,
  };

  const currentList = await getAbsences();
  const updatedList = [newAbsence, ...currentList.filter((a) => a.id !== newAbsence.id)];

  setLocalAbsences(updatedList, true);

  await persistRolePermissionsData(ABSENCES_DB_LEVEL, { absences: updatedList });

  void logAuditAction(
    isAutoApproved ? "create_and_approve_absence" : "create_absence",
    "absences",
    {
      member_name: memberName,
      target_user_id: targetUserId,
      start_date: payload.start_date,
      end_date: payload.end_date,
      days: daysCount,
      reason: payload.reason,
      status: newAbsence.status,
      created_by_name: callerName,
    },
    undefined,
    newAbsence.id
  );

  // Notifications
  if (isAutoApproved && targetUserId !== callerUserId) {
    void createNotification({
      title: "Licença Concedida 🏖️",
      message: `Uma licença de ${daysCount} dia(s) (${payload.start_date} a ${payload.end_date}) foi concedida para você por ${callerName}.`,
      type: "absence",
      category: "success",
      user_id: targetUserId,
      link: "/ausencias",
      sender_id: callerUserId,
      sender_name: callerName,
      sender_avatar: callerAvatar,
    });
  } else if (!isAutoApproved) {
    void createNotification({
      title: "Nova Solicitação de Licença",
      message: `${memberName} solicitou licença de ${daysCount} dia(s) (${payload.start_date} a ${payload.end_date}). Motivo: ${payload.reason}`,
      type: "absence",
      category: "warning",
      target_roles: ["01", "02", "gerente", "desenvolvedor"],
      link: "/ausencias",
      sender_id: callerUserId,
      sender_name: callerName,
      sender_avatar: memberAvatar || callerAvatar,
    });
  }

  return newAbsence;
}

export async function reviewAbsence(
  absenceId: string,
  payload: { status: "aprovado" | "rejeitado"; review_notes?: string }
): Promise<MemberAbsence> {
  const currentAuth = await getCurrentAuth().catch(() => ({ user: null, profile: null, level: null }));
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));

  const reviewerId = session?.user?.id || currentAuth.user?.id || currentAuth.profile?.user_id || "lideranca";
  const reviewerName = currentAuth.profile?.nickname || currentAuth.profile?.nome || "Liderança";
  const reviewerAvatar = currentAuth.profile?.avatar_url || currentAuth.profile?.discord_avatar_url || null;

  const currentList = await getAbsences();
  const targetIndex = currentList.findIndex((a) => a.id === absenceId);
  if (targetIndex === -1) throw new Error("Solicitação de ausência não encontrada.");

  const target = currentList[targetIndex];
  const now = new Date().toISOString();
  const updatedAbsence: MemberAbsence = {
    ...target,
    status: payload.status,
    reviewed_by: reviewerId,
    reviewed_by_name: reviewerName,
    reviewed_at: now,
    review_notes: payload.review_notes?.trim() || null,
    updated_at: now,
  };

  const updatedList = [...currentList];
  updatedList[targetIndex] = updatedAbsence;

  setLocalAbsences(updatedList, true);

  await persistRolePermissionsData(ABSENCES_DB_LEVEL, { absences: updatedList });

  void logAuditAction(
    payload.status === "aprovado" ? "approve_absence" : "reject_absence",
    "absences",
    {
      member_name: target.member_name,
      status: payload.status,
      reviewer_name: reviewerName,
      review_notes: payload.review_notes || null,
    },
    undefined,
    absenceId
  );

  void createNotification({
    title: payload.status === "aprovado" ? "Licença Aprovada! 🏖️" : "Licença Não Aprovada",
    message: `Sua solicitação de licença (${target.start_date} a ${target.end_date}) foi ${payload.status} por ${reviewerName}.`,
    type: "absence",
    category: payload.status === "aprovado" ? "success" : "error",
    user_id: target.user_id,
    link: "/ausencias",
    sender_id: reviewerId,
    sender_name: reviewerName,
    sender_avatar: reviewerAvatar,
  });

  return updatedAbsence;
}

export async function cancelAbsence(absenceId: string): Promise<void> {
  const currentList = await getAbsences();
  const target = currentList.find((a) => a.id === absenceId);
  if (!target) return;

  const updatedList = currentList.map((a) =>
    a.id === absenceId ? { ...a, status: "cancelada" as const, updated_at: new Date().toISOString() } : a
  );

  setLocalAbsences(updatedList, true);

  await persistRolePermissionsData(ABSENCES_DB_LEVEL, { absences: updatedList });

  void logAuditAction(
    "cancel_absence",
    "absences",
    {
      member_name: target.member_name,
      start_date: target.start_date,
      end_date: target.end_date,
    },
    undefined,
    absenceId
  );
}

export async function deleteAbsence(absenceId: string): Promise<void> {
  const currentList = await getAbsences();
  const target = currentList.find((a) => a.id === absenceId);
  const updatedList = currentList.filter((a) => a.id !== absenceId);

  setLocalAbsences(updatedList, true);

  await persistRolePermissionsData(ABSENCES_DB_LEVEL, { absences: updatedList });

  if (target) {
    void logAuditAction(
      "delete_absence",
      "absences",
      {
        member_name: target.member_name,
        start_date: target.start_date,
        end_date: target.end_date,
      },
      undefined,
      absenceId
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// METAS SEMANAIS & ENTREGAS DE METAS COM COMPROVANTE (PRINT)
// ═══════════════════════════════════════════════════════════════

const WEEKLY_GOALS_DB_LEVEL = "system_weekly_goals";
const GOAL_SUBMISSIONS_DB_LEVEL = "system_goal_submissions";
const WEEKLY_GOALS_STORAGE_KEY = "tw_weekly_goals";
const GOAL_SUBMISSIONS_STORAGE_KEY = "tw_goal_submissions";

function getLocalWeeklyGoals(): WeeklyGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WEEKLY_GOALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalWeeklyGoals(goals: WeeklyGoal[], emitEvent: boolean = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WEEKLY_GOALS_STORAGE_KEY, JSON.stringify(goals));
    if (emitEvent) {
      window.dispatchEvent(new CustomEvent("tw_weekly_goals_updated"));
    }
  } catch {}
}

function getLocalGoalSubmissions(): GoalSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GOAL_SUBMISSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalGoalSubmissions(submissions: GoalSubmission[], emitEvent: boolean = true) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GOAL_SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
    if (emitEvent) {
      window.dispatchEvent(new CustomEvent("tw_goal_submissions_updated"));
    }
  } catch {}
}

export async function getWeeklyGoals(): Promise<WeeklyGoal[]> {
  const goalsMap = new Map<string, WeeklyGoal>();

  // 1. Coleção direta no Firebase RTDB
  try {
    const directGoals = await rtdb.get<Record<string, WeeklyGoal>>("weekly_goals");
    if (directGoals && typeof directGoals === "object") {
      Object.values(directGoals).forEach((g: any) => {
        if (g && g.id && !g._schema_info) goalsMap.set(g.id, g);
      });
    }
  } catch {}

  // 2. Nó role_permissions/system_weekly_goals
  try {
    const rtdbEntry = await rtdb.get<any>(`role_permissions/${WEEKLY_GOALS_DB_LEVEL}`);
    if (rtdbEntry) {
      const candidate = Array.isArray(rtdbEntry)
        ? rtdbEntry
        : Array.isArray(rtdbEntry.permissions)
        ? rtdbEntry.permissions
        : Array.isArray(rtdbEntry.permissions?.goals)
        ? rtdbEntry.permissions.goals
        : Array.isArray(rtdbEntry.goals)
        ? rtdbEntry.goals
        : null;

      if (candidate && candidate.length > 0) {
        candidate.forEach((g: any) => {
          if (g && g.id && !goalsMap.has(g.id)) goalsMap.set(g.id, g);
        });
      }
    }
  } catch {}

  // 3. Fallback REST direto do Firebase
  if (goalsMap.size === 0 && typeof fetch !== "undefined") {
    try {
      const res = await fetch("https://rfdrive-fd805-default-rtdb.firebaseio.com/weekly_goals.json");
      const data = await res.json();
      if (data && typeof data === "object") {
        Object.values(data).forEach((g: any) => {
          if (g && g.id && !g._schema_info) goalsMap.set(g.id, g as WeeklyGoal);
        });
      }
    } catch {}
  }

  // 4. Fallback Supabase
  if (goalsMap.size === 0) {
    try {
      const { data } = await supabase
        .from("role_permissions")
        .select("permissions")
        .eq("level", WEEKLY_GOALS_DB_LEVEL)
        .maybeSingle();

      if (data) {
        const candidate = Array.isArray(data.permissions)
          ? data.permissions
          : Array.isArray(data.permissions?.goals)
          ? data.permissions.goals
          : null;
        if (candidate && candidate.length > 0) {
          candidate.forEach((g: any) => {
            if (g && g.id && !goalsMap.has(g.id)) goalsMap.set(g.id, g);
          });
        }
      }
    } catch (err) {
      console.warn("Erro ao carregar metas semanais do banco:", err);
    }
  }

  const list = Array.from(goalsMap.values());
  if (list.length > 0) {
    setLocalWeeklyGoals(list, false);
    return list;
  }

  const local = getLocalWeeklyGoals();
  if (local.length > 0) return local;

  // Meta padrão inicial caso não exista nenhuma cadastrada
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const defaultGoal: WeeklyGoal = {
    id: `goal_default_${Date.now()}`,
    title: "Meta Semanal Operacional",
    description: "Meta semanal padrão de contribuição da família Twin Wheels. Entregue os insumos ou dinheiro para um líder/gerente em serviço e anexe o print do F8.",
    type: "financeiro",
    target_value: 50000,
    unit_name: "R$",
    target_scope: "todos",
    period_start: monday.toISOString().slice(0, 10),
    period_end: sunday.toISOString().slice(0, 10),
    is_active: true,
    created_by_name: "Liderança Twin Wheels",
    created_at: new Date().toISOString(),
  };

  const initialList = [defaultGoal];
  setLocalWeeklyGoals(initialList, false);
  return initialList;
}

export async function createWeeklyGoal(payload: CreateWeeklyGoalPayload): Promise<WeeklyGoal> {
  let sessionUserId: string | undefined = undefined;
  let creatorName = "Liderança";

  try {
    const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    sessionUserId = data.session?.user?.id;
  } catch {}

  if (sessionUserId) {
    try {
      const { data: profileRow } = await (supabase.from("profiles" as any))
        .select("nome, nickname")
        .eq("user_id", sessionUserId)
        .maybeSingle();
      const p = profileRow as any;
      if (p) creatorName = p.nickname || p.nome || "Liderança";
    } catch {}
  }

  if (!sessionUserId && typeof window !== "undefined") {
    try {
      const localProfile = JSON.parse(localStorage.getItem("tw_user_profile") || "{}");
      sessionUserId = localProfile?.user_id || localProfile?.id;
      if (!creatorName || creatorName === "Liderança") {
        creatorName = localProfile?.nickname || localProfile?.nome || "Liderança";
      }
    } catch {}
  }

  const newGoal: WeeklyGoal = {
    id: `wgoal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    type: payload.type,
    target_value: Number(payload.target_value),
    unit_name: payload.unit_name?.trim() || (payload.type === "financeiro" ? "R$" : "itens"),
    target_scope: payload.target_scope,
    target_role: payload.target_role || null,
    target_user_id: payload.target_user_id || null,
    target_user_name: payload.target_user_name || null,
    period_start: payload.period_start,
    period_end: payload.period_end,
    is_active: payload.is_active ?? true,
    created_by: sessionUserId,
    created_by_name: creatorName,
    created_at: new Date().toISOString(),
  };

  const currentList = await getWeeklyGoals();
  const updatedList = [newGoal, ...currentList.filter((g) => g.id !== newGoal.id)];
  setLocalWeeklyGoals(updatedList, true);

  // Persistência direta no Firebase RTDB
  try {
    await rtdb.set(`weekly_goals/${newGoal.id}`, newGoal);
    await rtdb.set(`goals/${newGoal.id}`, newGoal);
    await rtdb.set(`role_permissions/${WEEKLY_GOALS_DB_LEVEL}/permissions/goals`, updatedList);
    await rtdb.set(`role_permissions/${WEEKLY_GOALS_DB_LEVEL}/goals`, updatedList);
  } catch (err) {
    console.warn("Aviso ao persistir nova meta no RTDB:", err);
  }

  await persistRolePermissionsData(WEEKLY_GOALS_DB_LEVEL, { goals: updatedList });

  void logAuditAction(
    "create_goal",
    "goals",
    {
      title: newGoal.title,
      type: newGoal.type,
      target_value: newGoal.target_value,
      period_start: newGoal.period_start,
      period_end: newGoal.period_end,
      target_scope: newGoal.target_scope,
    },
    undefined,
    newGoal.id
  );

  if (newGoal.target_scope === "individual" && newGoal.target_user_id) {
    void createNotification({
      title: "Nova Meta Atribuída a Você! 🎯",
      message: `Você recebeu uma meta individual: "${newGoal.title}" (Alvo: ${newGoal.target_value} ${newGoal.unit_name}).`,
      type: "goal",
      category: "info",
      user_id: newGoal.target_user_id,
      link: "/metas",
      sender_id: sessionUserId,
      sender_name: creatorName,
    });
  } else if (newGoal.target_scope === "cargo" && newGoal.target_role) {
    void createNotification({
      title: "Nova Meta para seu Cargo! 🎯",
      message: `Uma meta foi definida para seu cargo: "${newGoal.title}" (Alvo: ${newGoal.target_value} ${newGoal.unit_name}).`,
      type: "goal",
      category: "info",
      target_roles: [newGoal.target_role],
      link: "/metas",
      sender_id: sessionUserId,
      sender_name: creatorName,
    });
  } else {
    void createNotification({
      title: "Nova Meta Semanal Criada! 🎯",
      message: `Meta para todos os membros: "${newGoal.title}" (Alvo: ${newGoal.target_value} ${newGoal.unit_name}).`,
      type: "goal",
      category: "info",
      user_id: "all",
      link: "/metas",
      sender_id: sessionUserId,
      sender_name: creatorName,
    });
  }

  return newGoal;
}

export async function updateWeeklyGoal(
  id: string,
  updates: Partial<Omit<WeeklyGoal, "id" | "created_at">>
): Promise<WeeklyGoal> {
  const currentList = await getWeeklyGoals();
  const target = currentList.find((g) => g.id === id);
  if (!target) throw new Error("Meta semanal não encontrada.");

  const updated: WeeklyGoal = {
    ...target,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const updatedList = currentList.map((g) => (g.id === id ? updated : g));
  setLocalWeeklyGoals(updatedList, true);

  // Atualização direta nos nós do Firebase RTDB
  try {
    await rtdb.set(`weekly_goals/${id}`, updated);
    await rtdb.set(`goals/${id}`, updated);
    await rtdb.set(`role_permissions/${WEEKLY_GOALS_DB_LEVEL}/permissions/goals`, updatedList);
    await rtdb.set(`role_permissions/${WEEKLY_GOALS_DB_LEVEL}/goals`, updatedList);
  } catch (err) {
    console.warn("Aviso ao persistir atualização de meta no RTDB:", err);
  }

  await persistRolePermissionsData(WEEKLY_GOALS_DB_LEVEL, { goals: updatedList });

  void logAuditAction(
    "update_goal",
    "goals",
    {
      id,
      title: updated.title,
      is_active: updated.is_active,
    },
    undefined,
    id
  );

  return updated;
}

export async function deleteWeeklyGoal(id: string): Promise<void> {
  const currentList = await getWeeklyGoals();
  const target = currentList.find((g) => g.id === id);
  const updatedList = currentList.filter((g) => g.id !== id);

  setLocalWeeklyGoals(updatedList, true);

  // Remoção explícita de todos os nós do Firebase RTDB
  try {
    await rtdb.remove(`weekly_goals/${id}`);
    await rtdb.remove(`goals/${id}`);
    await rtdb.set(`role_permissions/${WEEKLY_GOALS_DB_LEVEL}/permissions/goals`, updatedList);
    await rtdb.set(`role_permissions/${WEEKLY_GOALS_DB_LEVEL}/goals`, updatedList);
  } catch (err) {
    console.warn("Aviso ao remover meta do RTDB:", err);
  }

  await persistRolePermissionsData(WEEKLY_GOALS_DB_LEVEL, { goals: updatedList });

  if (target) {
    void logAuditAction(
      "delete_goal",
      "goals",
      {
        id,
        title: target.title,
      },
      undefined,
      id
    );
  }
}

// ─── ENTREGAS DE METAS (SUBMISSIONS) ───

export async function getGoalSubmissions(): Promise<GoalSubmission[]> {
  const subsMap = new Map<string, GoalSubmission>();

  // 1. Coleção direta goal_submissions no Firebase RTDB
  try {
    const directSubs = await rtdb.get<Record<string, GoalSubmission>>("goal_submissions");
    if (directSubs && typeof directSubs === "object") {
      Object.values(directSubs).forEach((s: any) => {
        if (s && s.id && !s._schema_info) subsMap.set(s.id, s);
      });
    }
  } catch {}

  // 2. Nó role_permissions/system_goal_submissions no Firebase RTDB
  try {
    const rtdbEntry = await rtdb.get<any>(`role_permissions/${GOAL_SUBMISSIONS_DB_LEVEL}`);
    if (rtdbEntry) {
      const candidate = Array.isArray(rtdbEntry)
        ? rtdbEntry
        : Array.isArray(rtdbEntry.permissions)
        ? rtdbEntry.permissions
        : Array.isArray(rtdbEntry.permissions?.submissions)
        ? rtdbEntry.permissions.submissions
        : Array.isArray(rtdbEntry.submissions)
        ? rtdbEntry.submissions
        : null;

      if (candidate && candidate.length > 0) {
        candidate.forEach((s: any) => {
          if (s && s.id) {
            const existing = subsMap.get(s.id);
            subsMap.set(s.id, existing ? { ...existing, ...s } : s);
          }
        });
      }
    }
  } catch {}

  // 3. Fallback REST direto do Firebase RTDB (bypassa qualquer timeout do SDK)
  if (subsMap.size === 0 && typeof fetch !== "undefined") {
    try {
      const res = await fetch("https://rfdrive-fd805-default-rtdb.firebaseio.com/role_permissions/system_goal_submissions.json");
      const data = await res.json();
      const list = data?.permissions?.submissions || (Array.isArray(data) ? data : null);
      if (Array.isArray(list) && list.length > 0) {
        list.forEach((s: any) => {
          if (s && s.id) subsMap.set(s.id, s as GoalSubmission);
        });
      }
    } catch {}
  }

  // 4. Fallback Supabase
  if (subsMap.size === 0) {
    try {
      const { data } = await supabase
        .from("role_permissions")
        .select("permissions")
        .eq("level", GOAL_SUBMISSIONS_DB_LEVEL)
        .maybeSingle();

      if (data) {
        const candidate = Array.isArray(data.permissions)
          ? data.permissions
          : Array.isArray(data.permissions?.submissions)
          ? data.permissions.submissions
          : null;
        if (candidate && candidate.length > 0) {
          candidate.forEach((s: any) => {
            if (s && s.id) subsMap.set(s.id, s);
          });
        }
      }
    } catch (err) {
      console.warn("Erro ao carregar entregas de metas do banco:", err);
    }
  }

  const result = Array.from(subsMap.values());
  if (result.length > 0) {
    setLocalGoalSubmissions(result, false);
    return result;
  }

  return getLocalGoalSubmissions();
}

export async function submitGoalDelivery(payload: SubmitGoalPayload): Promise<GoalSubmission> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuário não autenticado.");

  // Membro que está entregando
  let profileRow: any = null;
  try {
    const { data } = await (supabase.from("profiles" as any))
      .select("nome, nickname, avatar_url, discord_avatar_url")
      .eq("user_id", session.user.id)
      .maybeSingle();
    profileRow = data;
  } catch {}

  if (!profileRow) {
    try {
      const fbProfiles = await rtdb.getList<any>("profiles");
      profileRow = fbProfiles.find(x => x.user_id === session.user.id || x.id === session.user.id);
    } catch {}
  }

  let roleRow: any = null;
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("nivel")
      .eq("user_id", session.user.id)
      .maybeSingle();
    roleRow = data;
  } catch {}

  const p = profileRow as any;
  const memberName = p?.nome || p?.nickname || "Membro";
  const memberNickname = p?.nickname || null;
  const memberAvatar = p?.avatar_url || p?.discord_avatar_url || null;
  const memberRole = (roleRow?.nivel as AppLevel) || "membro";

  // Membro recebedor
  let receiverProfileRow: any = null;
  try {
    const { data } = await (supabase.from("profiles" as any))
      .select("nome, nickname, avatar_url, discord_avatar_url")
      .eq("user_id", payload.receiver_id)
      .maybeSingle();
    receiverProfileRow = data;
  } catch {}

  if (!receiverProfileRow) {
    try {
      const fbProfiles = await rtdb.getList<any>("profiles");
      receiverProfileRow = fbProfiles.find(x => x.user_id === payload.receiver_id || x.id === payload.receiver_id);
    } catch {}
  }

  let receiverRoleRow: any = null;
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("nivel")
      .eq("user_id", payload.receiver_id)
      .maybeSingle();
    receiverRoleRow = data;
  } catch {}

  const rp = receiverProfileRow as any;
  const receiverName = rp?.nickname || rp?.nome || "Membro da Liderança";
  const receiverAvatar = rp?.avatar_url || rp?.discord_avatar_url || null;
  const receiverRole = (receiverRoleRow?.nivel as AppLevel) || null;

  // Localiza a meta
  const weeklyGoals = await getWeeklyGoals();
  const goal = weeklyGoals.find((g) => g.id === payload.goal_id);
  const goalTitle = goal ? goal.title : "Meta Semanal";
  const unitName = goal?.unit_name || (goal?.type === "financeiro" ? "R$" : "itens");

  const newSubmission: GoalSubmission = {
    id: `gsub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    goal_id: payload.goal_id,
    goal_title: goalTitle,
    user_id: session.user.id,
    member_name: memberName,
    member_nickname: memberNickname,
    member_role: memberRole,
    member_avatar: memberAvatar,
    receiver_id: payload.receiver_id,
    receiver_name: receiverName,
    receiver_role: receiverRole,
    receiver_avatar: receiverAvatar,
    amount: Number(payload.amount),
    unit_name: unitName,
    proof_url: payload.proof_url || null,
    notes: payload.notes?.trim() || null,
    delivered_at: payload.delivered_at || new Date().toISOString(),
    status: "pendente",
    created_at: new Date().toISOString(),
  };

  const currentList = await getGoalSubmissions();
  const updatedList = [newSubmission, ...currentList.filter((s) => s.id !== newSubmission.id)];
  setLocalGoalSubmissions(updatedList, true);

  await persistRolePermissionsData(GOAL_SUBMISSIONS_DB_LEVEL, { submissions: updatedList });

  void logAuditAction(
    "submit_goal_delivery",
    "goals",
    {
      goal_title: goalTitle,
      member_name: memberName,
      receiver_name: receiverName,
      amount: newSubmission.amount,
      unit: unitName,
      has_proof: Boolean(newSubmission.proof_url),
    },
    undefined,
    newSubmission.id
  );

  void createNotification({
    title: "Nova Entrega de Meta",
    message: `${memberName} registrou entrega de ${newSubmission.amount} ${unitName} para "${goalTitle}".`,
    type: "goal",
    category: "info",
    user_id: payload.receiver_id || "all",
    target_roles: ["01", "02", "gerente", "desenvolvedor"],
    link: "/metas",
    sender_id: session.user.id,
    sender_name: memberName,
    sender_avatar: memberAvatar,
  });

  return newSubmission;
}

export async function reviewGoalSubmission(
  submissionId: string,
  payload: { status: "aprovado" | "rejeitado" | "pendente"; review_notes?: string }
): Promise<GoalSubmission> {
  const { data: { session } } = await supabase.auth.getSession();
  let reviewerName = "Liderança";

  if (session?.user?.id) {
    const { data: reviewerProfile } = await (supabase.from("profiles" as any))
      .select("nome, nickname")
      .eq("user_id", session.user.id)
      .maybeSingle();
    const rp = reviewerProfile as any;
    if (rp) reviewerName = rp.nickname || rp.nome || "Liderança";
  }

  const currentList = await getGoalSubmissions();
  const target = currentList.find((s) => s.id === submissionId);
  if (!target) throw new Error("Entrega de meta não encontrada.");

  const isPending = payload.status === "pendente";
  const updated: GoalSubmission = {
    ...target,
    status: payload.status,
    reviewed_by: isPending ? null : session?.user?.id || null,
    reviewed_by_name: isPending ? null : reviewerName,
    reviewed_at: isPending ? null : new Date().toISOString(),
    review_notes: isPending
      ? null
      : payload.review_notes !== undefined
      ? (payload.review_notes?.trim() || null)
      : target.review_notes,
    updated_at: new Date().toISOString(),
  };

  const updatedList = currentList.map((s) => (s.id === submissionId ? updated : s));
  setLocalGoalSubmissions(updatedList, true);

  // Persistência direta no Firebase RTDB
  try {
    await rtdb.set(`goal_submissions/${submissionId}`, updated);
    await rtdb.set(`role_permissions/${GOAL_SUBMISSIONS_DB_LEVEL}/permissions/submissions`, updatedList);
    await rtdb.set(`role_permissions/${GOAL_SUBMISSIONS_DB_LEVEL}/submissions`, updatedList);
  } catch (err) {
    console.warn("Aviso ao salvar revisão de entrega no RTDB:", err);
  }

  await persistRolePermissionsData(GOAL_SUBMISSIONS_DB_LEVEL, { submissions: updatedList });

  void logAuditAction(
    payload.status === "aprovado"
      ? "approve_goal_delivery"
      : payload.status === "rejeitado"
      ? "reject_goal_delivery"
      : "reopen_goal_delivery",
    "goals",
    {
      goal_title: target.goal_title,
      member_name: target.member_name,
      amount: target.amount,
      reviewed_by: isPending ? null : reviewerName,
      review_notes: isPending ? null : payload.review_notes || null,
    },
    undefined,
    submissionId
  );

  if (!isPending) {
    void createNotification({
      title: payload.status === "aprovado" ? "Entrega de Meta Aprovada! 🎯" : "Entrega de Meta Não Aprovada",
      message: `Sua entrega de ${target.amount} ${target.unit_name} para "${target.goal_title}" foi ${payload.status} por ${reviewerName}.`,
      type: "goal",
      category: payload.status === "aprovado" ? "success" : "error",
      user_id: target.user_id,
      link: "/metas",
      sender_id: session?.user?.id,
      sender_name: reviewerName,
    });
  }

  return updated;
}

export async function deleteGoalSubmission(submissionId: string): Promise<void> {
  const currentList = await getGoalSubmissions();
  const target = currentList.find((s) => s.id === submissionId);
  const updatedList = currentList.filter((s) => s.id !== submissionId);

  setLocalGoalSubmissions(updatedList, true);

  // Remoção explícita de todos os nós do Firebase RTDB
  try {
    await rtdb.remove(`goal_submissions/${submissionId}`);
    await rtdb.set(`role_permissions/${GOAL_SUBMISSIONS_DB_LEVEL}/permissions/submissions`, updatedList);
    await rtdb.set(`role_permissions/${GOAL_SUBMISSIONS_DB_LEVEL}/submissions`, updatedList);
  } catch (err) {
    console.warn("Aviso ao remover entrega de meta do RTDB:", err);
  }

  await persistRolePermissionsData(GOAL_SUBMISSIONS_DB_LEVEL, { submissions: updatedList });

  if (target) {
    void logAuditAction(
      "delete_goal_submission",
      "goals",
      {
        submission_id: submissionId,
        goal_title: target.goal_title,
        member_name: target.member_name,
        amount: target.amount,
      },
      undefined,
      submissionId
    );
  }
}

/* ==========================================================================
   MÓDULO TICKETS / OUVIDORIA
   ========================================================================== */

const TICKETS_STORAGE_KEY = "tw_tickets_v1";
const TICKETS_DB_LEVEL = "system_tickets_data";

let ticketsBroadcastChannel: any = null;

export function getTicketsRealtimeChannel() {
  if (!ticketsBroadcastChannel) {
    ticketsBroadcastChannel = supabase.channel("tw_tickets_realtime_sync", {
      config: { broadcast: { self: true } },
    });

    // 1. Escutar broadcast tickets_sync enviado por qualquer outro cliente/dispositivo
    ticketsBroadcastChannel.on("broadcast", { event: "tickets_sync" }, () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tw_tickets_updated"));
      }
    });

    // 2. Escutar inserções em audit_logs para entidade 'tickets' (registro leve <1KB, sempre transmitido pelo WAL)
    ticketsBroadcastChannel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "audit_logs",
      },
      (payload: any) => {
        const row = payload.new;
        if (row?.entity === "tickets" || (row?.action && String(row.action).includes("ticket"))) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_tickets_updated"));
          }
        }
      }
    );

    // 3. Escutar mudanças em role_permissions para level = 'system_tickets_data'
    ticketsBroadcastChannel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "role_permissions",
      },
      (payload: any) => {
        const row = payload.new || payload.old;
        if (row?.level === TICKETS_DB_LEVEL || !row?.level) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_tickets_updated"));
          }
        }
      }
    );

    ticketsBroadcastChannel.subscribe();
  }
  return ticketsBroadcastChannel;
}

export function broadcastTicketsRealtimeUpdate(): void {
  try {
    if (typeof window !== "undefined") {
      // 1. Notificar a aba atual
      window.dispatchEvent(new CustomEvent("tw_tickets_updated"));

      // 2. Disparar storage event para todas as outras abas abertas no mesmo navegador
      try {
        localStorage.setItem("tw_tickets_sync_ping", String(Date.now()));
      } catch {}

      // 3. Notificar via BroadcastChannel do navegador
      try {
        const bc = new BroadcastChannel("tw_tickets_channel");
        bc.postMessage({ type: "tickets_sync", timestamp: Date.now() });
        setTimeout(() => {
          try {
            bc.close();
          } catch {}
        }, 1000);
      } catch {}
    }

    // 4. Notificar outros computadores/usuários via WebSocket do Supabase Realtime
    const ch = getTicketsRealtimeChannel();
    const sendMsg = () => {
      void ch.send({
        type: "broadcast",
        event: "tickets_sync",
        payload: { timestamp: Date.now() },
      });
    };

    if (ch.state === "joined") {
      sendMsg();
    } else {
      ch.subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          sendMsg();
        }
      });
    }
  } catch (err) {
    console.warn("Erro ao emitir broadcast de tickets:", err);
  }
}

function getLocalTickets(): Ticket[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalTickets(tickets: Ticket[], emitEvent: boolean = true): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
      if (emitEvent) {
        window.dispatchEvent(new CustomEvent("tw_tickets_updated"));
      }
    }
  } catch {}
}

async function fetchAllRawTickets(): Promise<Ticket[]> {
  try {
    const rtdbEntry = await rtdb.get<any>(`role_permissions/${TICKETS_DB_LEVEL}`);
    if (rtdbEntry && rtdbEntry.permissions && typeof rtdbEntry.permissions === "object") {
      const parsed = rtdbEntry.permissions as any;
      if (Array.isArray(parsed.tickets)) {
        return parsed.tickets as Ticket[];
      }
    }
  } catch {}

  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", TICKETS_DB_LEVEL)
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      const parsed = data.permissions as any;
      if (Array.isArray(parsed.tickets)) {
        return parsed.tickets as Ticket[];
      }
    }
  } catch (err) {
    console.warn("Erro ao carregar tickets do banco:", err);
  }
  return getLocalTickets();
}

interface EffectiveTicketAuth {
  user: { id: string; email?: string | null };
  role: AppLevel;
  nome: string;
  nickname: string | null;
  avatar: string | null;
  canView: boolean;
  canCreate: boolean;
  canViewAll: boolean;
  canManage: boolean;
  canReply: boolean;
  canClaim: boolean;
  canTransfer: boolean;
  canChangeStatus: boolean;
  canClose: boolean;
  canReopen: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
  canInternalNotes: boolean;
  isSuperUser: boolean;
}

async function getEffectiveTicketAuth(): Promise<EffectiveTicketAuth | null> {
  // 1. Simulação / Dev Impersonate em ambiente de navegador
  if (typeof window !== "undefined") {
    const simRaw = sessionStorage.getItem("tw_simulated_user");
    if (simRaw) {
      try {
        const sim = JSON.parse(simRaw);
        if (sim && sim.id) {
          const simLevel = (sim.nivel as AppLevel) || "membro";
          const isDev = Boolean(sim.is_developer);
          const isCeo = Boolean(sim.is_ceo);
          const isSuper = (isDev && isDevBypassActive()) || simLevel === "01";
          const customMap = await getRolePermissions();
          const ceoPerms = customMap?.["ceo"] || (DEFAULT_CEO_PERMISSIONS as Permission[]);

          let simTagPerms: Permission[] = [];
          try {
            const [allTags, allAssignments] = await Promise.all([
              getMemberTags(),
              getMemberTagAssignments(),
            ]);
            const simCandIds = new Set(
              [sim.id, sim.user_id, sim.discord_id, sim.game_id, sim.discord_email]
                .filter(Boolean)
                .map((x: any) => String(x).trim().toLowerCase())
            );
            const myTagIds = new Set<string>();
            for (const a of allAssignments) {
              const mId = String(a.member_id || "").trim().toLowerCase();
              const uId = String((a as any).user_id || "").trim().toLowerCase();
              if ((mId && simCandIds.has(mId)) || (uId && simCandIds.has(uId))) {
                myTagIds.add(String(a.tag_id).trim().toLowerCase());
              }
            }
            const matchingTags = allTags.filter((t) => myTagIds.has(String(t.id).trim().toLowerCase()) || myTagIds.has(String(t.name || "").trim().toLowerCase()));
            matchingTags.forEach((t) => {
              const tagPerms = Array.isArray(t.permissions)
                ? t.permissions
                : (t.permissions && typeof t.permissions === "object" ? Object.values(t.permissions) : []);
              tagPerms.forEach((p: any) => { if (p) simTagPerms.push(p as Permission); });
              if (t.rules?.can_view_all_tickets) {
                simTagPerms.push("view_all_tickets");
                simTagPerms.push("can_view_all_tickets" as Permission);
              }
            });
          } catch {}

          const checkSimPerm = (perm: Permission) => {
            if (isSuper) return true;
            if (can(simLevel, perm, customMap)) return true;
            if (satisfiesPermission(simTagPerms, perm)) return true;
            if (isCeo && satisfiesPermission(ceoPerms, perm)) return true;
            return false;
          };

          const canManage = isSuper || checkSimPerm("manage_tickets");
          const canViewAll = isSuper || canManage || checkSimPerm("view_all_tickets");
          const canCreate = isSuper || canManage || checkSimPerm("create_ticket");
          const canReply = isSuper || checkSimPerm("reply_tickets") || checkSimPerm("reply_ticket" as Permission);
          const canClaim = isSuper || checkSimPerm("claim_tickets") || checkSimPerm("claim_ticket" as Permission);
          const canTransfer = isSuper || canManage || checkSimPerm("transfer_tickets") || checkSimPerm("transfer_ticket" as Permission);
          const canChangeStatus = isSuper || canManage || checkSimPerm("change_ticket_status");
          const canClose = isSuper || canManage || checkSimPerm("close_tickets") || checkSimPerm("close_ticket" as Permission);
          const canReopen = isSuper || canManage || checkSimPerm("reopen_tickets") || checkSimPerm("reopen_ticket" as Permission);
          const canDelete = isSuper || canManage || checkSimPerm("delete_tickets") || checkSimPerm("delete_ticket" as Permission);
          const canManageMembers = isSuper || canManage || checkSimPerm("manage_ticket_members");
          const canInternalNotes = isSuper || canManage || checkSimPerm("internal_notes_tickets") || isCeo;
          const canView = isSuper || canViewAll || checkSimPerm("view_tickets") || checkSimPerm("atendimento_tickets.view" as Permission) || checkSimPerm("view_atendimento_tickets" as Permission);

          return {
            user: { id: sim.user_id || sim.id, email: sim.discord_email || null },
            role: simLevel,
            nome: sim.nome || "Membro",
            nickname: sim.nickname || null,
            avatar: sim.avatar_url || sim.discord_avatar_url || null,
            canView,
            canCreate,
            canViewAll,
            canManage,
            canReply,
            canClaim,
            canTransfer,
            canChangeStatus,
            canClose,
            canReopen,
            canDelete,
            canManageMembers,
            canInternalNotes,
            isSuperUser: isSuper,
          };
        }
      } catch {}
    }

    const devRaw = localStorage.getItem("tw_dev_impersonate");
    if (devRaw) {
      try {
        const dev = JSON.parse(devRaw);
        if (dev && dev.user_id) {
          const devLevel = (dev.nivel as AppLevel) || "membro";
          const isDev = Boolean(dev.is_developer);
          const isCeo = Boolean(dev.is_ceo);
          const isSuper = (isDev && isDevBypassActive()) || devLevel === "01";
          const customMap = await getRolePermissions();
          const ceoPerms = customMap?.["ceo"] || (DEFAULT_CEO_PERMISSIONS as Permission[]);

          let devTagPerms: Permission[] = [];
          try {
            const [allTags, allAssignments] = await Promise.all([
              getMemberTags(),
              getMemberTagAssignments(),
            ]);
            const devCandIds = new Set(
              [dev.id, dev.user_id, dev.discord_id, dev.game_id, dev.discord_email]
                .filter(Boolean)
                .map((x: any) => String(x).trim().toLowerCase())
            );
            const myTagIds = new Set<string>();
            for (const a of allAssignments) {
              const mId = String(a.member_id || "").trim().toLowerCase();
              const uId = String((a as any).user_id || "").trim().toLowerCase();
              if ((mId && devCandIds.has(mId)) || (uId && devCandIds.has(uId))) {
                myTagIds.add(String(a.tag_id).trim().toLowerCase());
              }
            }
            const matchingTags = allTags.filter((t) => myTagIds.has(String(t.id).trim().toLowerCase()) || myTagIds.has(String(t.name || "").trim().toLowerCase()));
            matchingTags.forEach((t) => {
              const tagPerms = Array.isArray(t.permissions)
                ? t.permissions
                : (t.permissions && typeof t.permissions === "object" ? Object.values(t.permissions) : []);
              tagPerms.forEach((p: any) => { if (p) devTagPerms.push(p as Permission); });
              if (t.rules?.can_view_all_tickets) {
                devTagPerms.push("view_all_tickets");
                devTagPerms.push("can_view_all_tickets" as Permission);
              }
            });
          } catch {}

          const checkDevPerm = (perm: Permission) => {
            if (isSuper) return true;
            if (can(devLevel, perm, customMap)) return true;
            if (satisfiesPermission(devTagPerms, perm)) return true;
            if (isCeo && satisfiesPermission(ceoPerms, perm)) return true;
            return false;
          };

          const canManage = isSuper || checkDevPerm("manage_tickets");
          const canViewAll = isSuper || canManage || checkDevPerm("view_all_tickets");
          const canCreate = isSuper || canManage || checkDevPerm("create_ticket");
          const canReply = isSuper || checkDevPerm("reply_tickets") || checkDevPerm("reply_ticket" as Permission);
          const canClaim = isSuper || checkDevPerm("claim_tickets") || checkDevPerm("claim_ticket" as Permission);
          const canTransfer = isSuper || canManage || checkDevPerm("transfer_tickets") || checkDevPerm("transfer_ticket" as Permission);
          const canChangeStatus = isSuper || canManage || checkDevPerm("change_ticket_status");
          const canClose = isSuper || canManage || checkDevPerm("close_tickets") || checkDevPerm("close_ticket" as Permission);
          const canReopen = isSuper || canManage || checkDevPerm("reopen_tickets") || checkDevPerm("reopen_ticket" as Permission);
          const canDelete = isSuper || canManage || checkDevPerm("delete_tickets") || checkDevPerm("delete_ticket" as Permission);
          const canManageMembers = isSuper || canManage || checkDevPerm("manage_ticket_members");
          const canInternalNotes = isSuper || canManage || checkDevPerm("internal_notes_tickets") || isCeo;
          const canView = isSuper || canViewAll || checkDevPerm("view_tickets") || checkDevPerm("atendimento_tickets.view" as Permission) || checkDevPerm("view_atendimento_tickets" as Permission);

          return {
            user: { id: dev.user_id, email: dev.discord_email || null },
            role: devLevel,
            nome: dev.nome || "Membro",
            nickname: dev.nickname || null,
            avatar: dev.avatar_url || dev.discord_avatar_url || null,
            canView,
            canCreate,
            canViewAll,
            canManage,
            canReply,
            canClaim,
            canTransfer,
            canChangeStatus,
            canClose,
            canReopen,
            canDelete,
            canManageMembers,
            canInternalNotes,
            isSuperUser: isSuper,
          };
        }
      } catch {}
    }
  }

  // 2. Sessão real do Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const meta = (session.user.user_metadata || {}) as Record<string, any>;
  const discordId = (meta["provider_id"] as string) || (meta["sub"] as string) || "";
  const discordEmail = session.user.email || (meta["email"] as string) || "";

  // 3. Carregar perfil (busca por user_id, depois fallback por discord_id / email)
  let profileRow: any = null;
  const { data: pByUid } = await (supabase.from("profiles" as any))
    .select("id, user_id, nome, nickname, avatar_url, discord_avatar_url, discord_id, is_developer, is_ceo, custom_theme")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (pByUid) {
    profileRow = pByUid;
  } else if (discordId || discordEmail) {
    const filters = [];
    if (discordId) filters.push(`discord_id.eq.${discordId}`);
    if (discordEmail) filters.push(`discord_email.eq.${discordEmail}`);
    const { data: pFallback } = await (supabase.from("profiles" as any))
      .select("id, user_id, nome, nickname, avatar_url, discord_avatar_url, discord_id, is_developer, is_ceo, custom_theme")
      .or(filters.join(","))
      .maybeSingle();
    if (pFallback) profileRow = pFallback;
  }

  const p = profileRow as any;
  const roleUserIds = [session.user.id];
  if (p?.user_id && !roleUserIds.includes(p.user_id)) {
    roleUserIds.push(p.user_id);
  }

  // 4. Carregar cargo na tabela user_roles
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("nivel")
    .in("user_id", roleUserIds)
    .limit(1)
    .maybeSingle();

  const isDevUser = Boolean(
    p?.is_developer === true || (p?.is_developer === undefined && discordId === "722320491767136346") || roleRow?.nivel === "desenvolvedor"
  );
  let isCeoUser = Boolean(
    p?.is_ceo === true || p?.custom_theme?.is_ceo === true
  );
  const userLevel = (roleRow?.nivel as AppLevel) || (isDevUser ? "desenvolvedor" : "membro");
  const isSuperUser = (isDevUser && isDevBypassActive()) || userLevel === "01";

  // 5. Carregar tags ativas do membro (incluindo permissões e regras das tags)
  let userTags: any[] = [];
  try {
    const candidateIds = new Set(
      [
        session.user.id,
        p?.id,
        p?.user_id,
        p?.game_id,
        (p as any)?.passaporte,
        discordId,
        discordEmail,
        p?.discord_id,
        p?.discord_email,
        session?.user?.email,
        p?.discord_username,
        p?.nickname,
        p?.nome,
      ]
        .filter(Boolean)
        .map((id) => String(id).trim().toLowerCase())
    );

    const [allTags, allAssignments] = await Promise.all([
      getMemberTags(),
      getMemberTagAssignments(),
    ]);

    const myTagIds = new Set<string>();
    for (const a of allAssignments) {
      const mId = String(a.member_id || "").trim().toLowerCase();
      const uId = String((a as any).user_id || "").trim().toLowerCase();
      if ((mId && candidateIds.has(mId)) || (uId && candidateIds.has(uId))) {
        myTagIds.add(String(a.tag_id).trim().toLowerCase());
      }
    }

    userTags = allTags.filter((t) => {
      const cleanId = String(t.id).trim().toLowerCase();
      const cleanName = String(t.name || "").trim().toLowerCase();
      return (myTagIds.has(cleanId) || myTagIds.has(cleanName)) && t.is_active !== false;
    });
  } catch (err) {
    console.warn("Aviso ao carregar tags do membro em getEffectiveTicketAuth:", err);
  }

  // Verificar se possui Tag CEO
  const hasCeoTag = userTags.some((t) => {
    if (t.is_active === false) return false;
    const cleanId = (t.id || "").toLowerCase().trim();
    const rules = parseMemberTagRules(t.rules);
    return cleanId === "ceo" || rules.can_access_ceo === true || rules.is_ceo === true;
  });
  if (hasCeoTag) {
    isCeoUser = true;
  }

  // Verificar se possui qualquer tag ativa com a permissão ou regra explícita de visualizar todos os chamados
  const hasTagWithViewAll = userTags.some((t) => {
    if (t.is_active === false) return false;
    if (!isDevUser && (t.rules?.is_blocked || t.rules?.block_operations)) return false;
    const rules = parseMemberTagRules(t.rules);
    const tagPerms = Array.isArray(t.permissions)
      ? t.permissions
      : (t.permissions && typeof t.permissions === "object" ? Object.values(t.permissions) : []);
    const hasRule = Boolean(rules.can_view_all_tickets);
    const hasPerm = tagPerms.includes("view_all_tickets") || tagPerms.includes("can_view_all_tickets");
    return hasRule || hasPerm;
  });

  // Coletar todas as permissões granulares das tags ativas do membro
  const tagPermsList: Permission[] = [];
  userTags.forEach((t) => {
    if (t.is_active === false) return;
    if (!isDevUser && (t.rules?.is_blocked || t.rules?.block_operations)) return;
    const rules = parseMemberTagRules(t.rules);
    const tagPerms = Array.isArray(t.permissions)
      ? t.permissions
      : (t.permissions && typeof t.permissions === "object" ? Object.values(t.permissions) : []);
    if (rules.can_view_all_tickets || tagPerms.includes("view_all_tickets") || tagPerms.includes("can_view_all_tickets")) {
      tagPermsList.push("view_all_tickets");
      tagPermsList.push("can_view_all_tickets" as Permission);
    }
    tagPerms.forEach((perm: string) => {
      if (perm) tagPermsList.push(perm as Permission);
    });
  });

  // 6. Matriz de permissões dos cargos do banco de dados
  const customRoleMap = await getRolePermissions();
  const rawDevPerms = customRoleMap?.["desenvolvedor"];
  const devPerms = Array.isArray(rawDevPerms) && rawDevPerms.length > 0 ? rawDevPerms : [];
  const rawCeoPerms = customRoleMap?.["ceo"];
  const ceoPerms = Array.isArray(rawCeoPerms) && rawCeoPerms.length > 0
    ? rawCeoPerms
    : (DEFAULT_CEO_PERMISSIONS as Permission[]);

  // 7. Determinação do painel ativo e avaliador granular estrito de permissão
  const pathname = typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "";
  const isDevPanel = isDevUser && (pathname.startsWith("/dev") || pathname.includes("/dev/"));
  const isCeoPanel = !isDevPanel && isCeoUser && (pathname.startsWith("/ceo") || pathname.includes("/ceo/"));

  const checkPerm = (perm: Permission): boolean => {
    if (isSuperUser) return true;

    if (isDevPanel) {
      // Painel Dev: apenas permissões da tag dev
      return satisfiesPermission(devPerms, perm);
    }

    if (isCeoPanel) {
      // Painel CEO: apenas permissões da tag ceo (NÃO tem permissões da tag dev)
      return satisfiesPermission(ceoPerms, perm);
    }

    // Painel Membro: soma das permissões das tags comuns do membro + cargo do membro (sem tag dev e sem tag ceo)
    const regularTagPerms = tagPermsList.filter((p) => p !== "view_dev_hub" && p !== "view_dev" && p !== "view_ceo" && p !== "view_ceo_dashboard");
    const effectiveRole = (userLevel === "desenvolvedor" || userLevel === "ceo")
      ? ((p as any)?.cargo || (p as any)?.role || (p as any)?.nivel || "membro")
      : userLevel;
    const hasRolePerm = can(effectiveRole, perm, customRoleMap);
    return hasTagPerm || hasRolePerm;
  };

  const canManage = isSuperUser || checkPerm("manage_tickets");
  const canViewAll = isSuperUser || canManage || checkPerm("view_all_tickets") || hasTagWithViewAll;
  const canCreate = isSuperUser || canManage || checkPerm("create_ticket");
  const canReply =
    isSuperUser ||
    checkPerm("reply_tickets") ||
    checkPerm("reply_ticket" as Permission);
  const canClaim =
    isSuperUser ||
    checkPerm("claim_tickets") ||
    checkPerm("claim_ticket" as Permission);
  const canTransfer =
    isSuperUser ||
    canManage ||
    checkPerm("transfer_tickets") ||
    checkPerm("transfer_ticket" as Permission);
  const canChangeStatus = isSuperUser || canManage || checkPerm("change_ticket_status");
  const canClose = isSuperUser || canManage || checkPerm("close_tickets") || checkPerm("close_ticket" as Permission);
  const canReopen = isSuperUser || canManage || checkPerm("reopen_tickets") || checkPerm("reopen_ticket" as Permission);
  const canDelete = isSuperUser || canManage || checkPerm("delete_tickets") || checkPerm("delete_ticket" as Permission);
  const canManageMembers = isSuperUser || canManage || checkPerm("manage_ticket_members");
  const canInternalNotes = isSuperUser || canManage || checkPerm("internal_notes_tickets");
  const canView = isSuperUser || canViewAll || checkPerm("view_tickets") || checkPerm("atendimento_tickets.view" as Permission) || checkPerm("view_atendimento_tickets" as Permission);

  const nome = p?.nome || "Membro";
  const nickname = p?.nickname || null;
  const avatar = p?.avatar_url || p?.discord_avatar_url || null;

  return {
    user: { id: session.user.id, email: session.user.email },
    role: userLevel,
    nome,
    nickname,
    avatar,
    canView,
    canCreate,
    canViewAll,
    canManage,
    canReply,
    canClaim,
    canTransfer,
    canChangeStatus,
    canClose,
    canReopen,
    canDelete,
    canManageMembers,
    canInternalNotes,
    isSuperUser,
  };
}

/**
 * Retorna todos os tickets acessíveis ao usuário atual de acordo com suas permissões.
 * - Membro comum: visualiza apenas os próprios chamados (`user_id === session.user.id`).
 * - Atendentes com `claim_tickets`, `view_all_tickets` ou `manage_tickets`: visualizam a fila de atendimento.
 * - Usuários sem `manage_tickets` ou `internal_notes_tickets`: mensagens internas são removidas.
 */
export async function getTickets(): Promise<Ticket[]> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) return [];
  if (!auth.canView) return [];

  const rawTickets = await fetchAllRawTickets();

  // Filtragem de privacidade:
  // - Quem tem view_all_tickets, manage_tickets, claim_tickets, transfer_tickets ou superUser vê os tickets da fila
  // - Quem está atribuído ao ticket também pode vê-lo
  // - Membro comum visualiza apenas os próprios chamados e onde participa
  const filteredTickets = rawTickets.filter((ticket) => {
    if (auth.canViewAll || auth.canManage || auth.isSuperUser) return true;
    if (ticket.assigned_to_id === auth.user.id) return true;
    if (ticket.user_id === auth.user.id) return true;
    if (ticket.members && ticket.members.some((m) => m.user_id === auth.user.id)) return true;
    return false;
  });

  // Ocultar notas internas confidenciais para quem não possui manage_tickets ou internal_notes_tickets
  const sanitizedTickets = filteredTickets.map((ticket) => {
    if (auth.canManage || auth.canInternalNotes || auth.isSuperUser) return ticket;
    return {
      ...ticket,
      messages: (ticket.messages || []).filter((msg) => !msg.is_internal_note),
    };
  });

  setLocalTickets(sanitizedTickets, false);
  return sanitizedTickets;
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const tickets = await getTickets();
  return tickets.find((t) => t.id === ticketId) || null;
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) throw new Error("Usuário não autenticado");

  if (!auth.canCreate) {
    throw new Error("Permissão insuficiente para abrir novos tickets");
  }

  const creatorRole = auth.role;
  const creatorName = auth.nome;
  const creatorNickname = auth.nickname;
  const creatorAvatar = auth.avatar;

  const allRawTickets = await fetchAllRawTickets();

  // Cálculo do número sequencial
  const maxNumber = allRawTickets.reduce((max, t) => Math.max(max, t.ticket_number || 0), 0);
  const nextTicketNumber = maxNumber + 1;

  const now = new Date().toISOString();
  const newTicket: Ticket = {
    id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticket_number: nextTicketNumber,
    category: payload.category,
    subject: payload.subject.trim(),
    description: payload.description.trim(),
    priority: payload.priority,
    status: "aberto",
    user_id: auth.user.id,
    creator_name: creatorName,
    creator_nickname: creatorNickname,
    creator_role: creatorRole,
    creator_avatar: creatorAvatar,
    assigned_to_id: null,
    assigned_to_name: null,
    assigned_to_nickname: null,
    assigned_to_role: null,
    assigned_to_avatar: null,
    members: [],
    attachments: payload.attachments || [],
    messages: [],
    created_at: now,
    updated_at: now,
    closed_at: null,
    closed_by_id: null,
    closed_by_name: null,
    closed_reason: null,
  };

  const updatedRawList = [newTicket, ...allRawTickets.filter((t) => t.id !== newTicket.id)];
  setLocalTickets(updatedRawList, false);
  await persistRolePermissionsData(TICKETS_DB_LEVEL, { tickets: updatedRawList });

  broadcastTicketsRealtimeUpdate();

  const catInfo = getCategoryInfo(payload.category);
  void logAuditAction(
    "create_ticket",
    "tickets",
    {
      ticket_id: newTicket.id,
      ticket_number: newTicket.ticket_number,
      subject: newTicket.subject,
      category: newTicket.category,
      category_label: catInfo?.label,
      priority: newTicket.priority,
      user_id: auth.user.id,
      creator_name: creatorName,
    },
    undefined,
    newTicket.id
  );

  void createNotification({
    title: `Novo Chamado #${String(newTicket.ticket_number).padStart(3, "0")}`,
    message: `${creatorName} abriu um chamado: "${newTicket.subject}" (${catInfo?.label || newTicket.category})`,
    type: "ticket",
    category: newTicket.priority === "urgente" || newTicket.priority === "alta" ? "alert" : "info",
    target_roles: ["01", "02", "gerente", "desenvolvedor"],
    link: `/tickets/${newTicket.id}`,
    sender_id: auth.user.id,
    sender_name: creatorName,
    sender_avatar: creatorAvatar,
  });

  return newTicket;
}

export async function addTicketMessage(
  ticketId: string,
  payload: AddTicketMessagePayload
): Promise<TicketMessage> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) throw new Error("Usuário não autenticado");

  const allRawTickets = await fetchAllRawTickets();
  const targetIndex = allRawTickets.findIndex((t) => t.id === ticketId);
  if (targetIndex === -1) throw new Error("Ticket não encontrado");

  const ticket = allRawTickets[targetIndex];

  // Verificação de autorização: deve ter acesso ao chamado e permissão estrita de responder
  const isCreator = ticket.user_id === auth.user.id;
  const isAssigned = ticket.assigned_to_id === auth.user.id;
  const isMember = (ticket.members || []).some((m) => m.user_id === auth.user.id);
  const hasTicketAccess = isCreator || isAssigned || isMember || auth.canManage || auth.canViewAll || auth.isSuperUser;
  const canReply = (auth.canReply || auth.isSuperUser) && hasTicketAccess;

  if (!canReply) {
    throw new Error("Você não possui permissão para responder ou enviar mensagens neste chamado.");
  }

  // Apenas quem possui manage_tickets, internal_notes_tickets ou isSuperUser pode enviar nota interna privada
  const isInternal = Boolean(payload.is_internal_note && (auth.canManage || auth.canInternalNotes || auth.isSuperUser));

  const now = new Date().toISOString();
  const newMessage: TicketMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticket_id: ticketId,
    sender_id: auth.user.id,
    sender_name: auth.nome,
    sender_nickname: auth.nickname,
    sender_role: auth.role,
    sender_avatar: auth.avatar,
    content: payload.content.trim(),
    is_internal_note: isInternal,
    attachments: payload.attachments || [],
    created_at: now,
  };

  // Progressão inteligente de estados:
  // Se estava "aguardando" e o membro respondeu, volta para "em_atendimento"
  // Se estava "aberto" e a gerência respondeu publicamente, avança para "em_atendimento"
  let nextStatus = ticket.status;
  if (ticket.status === "aguardando" && isCreator && !isInternal) {
    nextStatus = "em_atendimento";
  } else if (ticket.status === "aberto" && (auth.canManage || auth.isSuperUser) && !isInternal) {
    nextStatus = "em_atendimento";
  }

  const updatedTicket: Ticket = {
    ...ticket,
    status: nextStatus,
    messages: [...(ticket.messages || []), newMessage],
    updated_at: now,
  };

  allRawTickets[targetIndex] = updatedTicket;
  setLocalTickets(allRawTickets, false);
  await persistRolePermissionsData(TICKETS_DB_LEVEL, { tickets: allRawTickets });

  broadcastTicketsRealtimeUpdate();

  void logAuditAction(
    isInternal ? "ticket_internal_note" : "ticket_reply",
    "tickets",
    {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      sender_name: auth.nome,
      is_internal_note: isInternal,
      attachments_count: payload.attachments?.length || 0,
    },
    undefined,
    ticket.id
  );

  if (!isInternal) {
    const recipients = new Set<string>();
    if (ticket.user_id !== auth.user.id) recipients.add(ticket.user_id);
    if (ticket.assigned_to_id && ticket.assigned_to_id !== auth.user.id) recipients.add(ticket.assigned_to_id);
    (ticket.members || []).forEach((m) => {
      if (m.user_id !== auth.user.id) recipients.add(m.user_id);
    });

    for (const recipientId of recipients) {
      void createNotification({
        title: `Resposta no Chamado #${String(ticket.ticket_number).padStart(3, "0")}`,
        message: `${auth.nome}: "${payload.content.slice(0, 95)}${payload.content.length > 95 ? "..." : ""}"`,
        type: "ticket",
        category: "info",
        user_id: recipientId,
        link: `/tickets/${ticket.id}`,
        sender_id: auth.user.id,
        sender_name: auth.nome,
        sender_avatar: auth.avatar,
      });
    }
  }

  return newMessage;
}

export async function claimTicket(ticketId: string): Promise<Ticket> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) throw new Error("Usuário não autenticado");

  if (!auth.canClaim && !auth.canManage && !auth.isSuperUser) {
    throw new Error("Permissão insuficiente para assumir tickets");
  }

  const allRawTickets = await fetchAllRawTickets();
  const targetIndex = allRawTickets.findIndex((t) => t.id === ticketId);
  if (targetIndex === -1) throw new Error("Ticket não encontrado");

  const ticket = allRawTickets[targetIndex];
  const now = new Date().toISOString();

  const updatedTicket: Ticket = {
    ...ticket,
    assigned_to_id: auth.user.id,
    assigned_to_name: auth.nome,
    assigned_to_nickname: auth.nickname,
    assigned_to_role: auth.role,
    assigned_to_avatar: auth.avatar,
    status: ticket.status === "aberto" ? "em_atendimento" : ticket.status,
    updated_at: now,
  };

  allRawTickets[targetIndex] = updatedTicket;
  setLocalTickets(allRawTickets, false);
  await persistRolePermissionsData(TICKETS_DB_LEVEL, { tickets: allRawTickets });

  broadcastTicketsRealtimeUpdate();

  void logAuditAction(
    "claim_ticket",
    "tickets",
    {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      assigned_to_id: auth.user.id,
      assigned_to_name: auth.nome,
    },
    undefined,
    ticket.id
  );

  if (ticket.user_id !== auth.user.id) {
    void createNotification({
      title: `Chamado #${String(ticket.ticket_number).padStart(3, "0")} em atendimento`,
      message: `${auth.nome} assumiu o atendimento do seu chamado.`,
      type: "ticket",
      category: "info",
      user_id: ticket.user_id,
      link: `/tickets/${ticket.id}`,
      sender_id: auth.user.id,
      sender_name: auth.nome,
      sender_avatar: auth.avatar,
    });
  }

  return updatedTicket;
}

export async function transferTicket(
  ticketId: string,
  payload: TransferTicketPayload
): Promise<Ticket> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) throw new Error("Usuário não autenticado");

  const allRawTickets = await fetchAllRawTickets();
  const targetIndex = allRawTickets.findIndex((t) => t.id === ticketId);
  if (targetIndex === -1) throw new Error("Ticket não encontrado");

  const ticket = allRawTickets[targetIndex];
  const isAssigned = ticket.assigned_to_id === auth.user.id;

  if (!auth.canTransfer && !auth.canManage && !isAssigned && !auth.isSuperUser) {
    throw new Error("Permissão insuficiente para transferir tickets");
  }
  const now = new Date().toISOString();

  const updatedTicket: Ticket = {
    ...ticket,
    assigned_to_id: payload.new_assigned_to_id,
    assigned_to_name: payload.new_assigned_to_name,
    assigned_to_nickname: payload.new_assigned_to_nickname || null,
    assigned_to_role: payload.new_assigned_to_role || null,
    assigned_to_avatar: payload.new_assigned_to_avatar || null,
    status: ticket.status === "aberto" ? "em_atendimento" : ticket.status,
    updated_at: now,
  };

  // Se houver nota interna na transferência, adiciona ao histórico
  if (payload.note && payload.note.trim()) {
    const transferNoteMsg: TicketMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ticket_id: ticketId,
      sender_id: auth.user.id,
      sender_name: auth.nome,
      sender_nickname: auth.nickname,
      sender_role: auth.role,
      sender_avatar: auth.avatar,
      content: `🔄 [Transferência de Responsável] Chamado transferido para ${payload.new_assigned_to_name}.${payload.note ? ` Nota: "${payload.note.trim()}"` : ""}`,
      is_internal_note: true,
      created_at: now,
    };
    updatedTicket.messages = [...(updatedTicket.messages || []), transferNoteMsg];
  }

  allRawTickets[targetIndex] = updatedTicket;
  setLocalTickets(allRawTickets, false);
  await persistRolePermissionsData(TICKETS_DB_LEVEL, { tickets: allRawTickets });

  broadcastTicketsRealtimeUpdate();

  void logAuditAction(
    "transfer_ticket",
    "tickets",
    {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      old_assigned_to: ticket.assigned_to_name,
      new_assigned_to_id: payload.new_assigned_to_id,
      new_assigned_to_name: payload.new_assigned_to_name,
      note: payload.note || null,
    },
    undefined,
    ticket.id
  );

  // Notifica o novo atendente individualmente
  void createNotification({
    title: `Chamado #${String(ticket.ticket_number).padStart(3, "0")} atribuído a você`,
    message: `${auth.nome} atribuiu a responsabilidade do chamado "${ticket.subject}" a você.`,
    type: "ticket",
    category: "info",
    user_id: payload.new_assigned_to_id,
    link: `/tickets/${ticket.id}`,
    sender_id: auth.user.id,
    sender_name: auth.nome,
  });

  // Notifica o autor do chamado sobre o novo responsável
  if (ticket.user_id !== auth.user.id && ticket.user_id !== payload.new_assigned_to_id) {
    void createNotification({
      title: `Chamado #${String(ticket.ticket_number).padStart(3, "0")} transferido`,
      message: `Seu chamado foi transferido para ${payload.new_assigned_to_name}.`,
      type: "ticket",
      category: "info",
      user_id: ticket.user_id,
      link: `/tickets/${ticket.id}`,
      sender_id: auth.user.id,
      sender_name: auth.nome,
    });
  }

  return updatedTicket;
}

export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus
): Promise<Ticket> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) throw new Error("Usuário não autenticado");

  const allRawTickets = await fetchAllRawTickets();
  const targetIndex = allRawTickets.findIndex((t) => t.id === ticketId);
  if (targetIndex === -1) throw new Error("Ticket não encontrado");

  const ticket = allRawTickets[targetIndex];
  const isAssigned = ticket.assigned_to_id === auth.user.id;

  if (!auth.canChangeStatus && !auth.canManage && !isAssigned && !auth.isSuperUser) {
    throw new Error("Permissão insuficiente para alterar status de tickets");
  }
  const now = new Date().toISOString();

  let closedAt = ticket.closed_at;
  let closedById = ticket.closed_by_id;
  let closedByName = ticket.closed_by_name;

  if (newStatus === "fechado") {
    closedAt = now;
    closedById = auth.user.id;
    closedByName = auth.nickname || auth.nome || "Gestor";
  } else if ((ticket.status as string) === "fechado") {
    closedAt = null;
    closedById = null;
    closedByName = null;
  }

  const updatedTicket: Ticket = {
    ...ticket,
    status: newStatus,
    updated_at: now,
    closed_at: closedAt,
    closed_by_id: closedById,
    closed_by_name: closedByName,
  };

  allRawTickets[targetIndex] = updatedTicket;
  setLocalTickets(allRawTickets, false);
  await persistRolePermissionsData(TICKETS_DB_LEVEL, { tickets: allRawTickets });

  broadcastTicketsRealtimeUpdate();

  const stInfo = getStatusInfo(newStatus);
  void logAuditAction(
    "update_ticket_status",
    "tickets",
    {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      old_status: ticket.status,
      new_status: newStatus,
      new_status_label: stInfo?.label,
    },
    undefined,
    ticket.id
  );

  // Notifica o autor individualmente se o status não for fechado (fechamento já possui notificação específica)
  if (ticket.user_id !== auth.user.id && newStatus !== "fechado") {
    void createNotification({
      title: `Status do Chamado #${String(ticket.ticket_number).padStart(3, "0")} atualizado`,
      message: `Status do seu chamado "${ticket.subject}" foi alterado para "${stInfo?.label || newStatus}".`,
      type: "ticket",
      category: "info",
      user_id: ticket.user_id,
      link: `/tickets/${ticket.id}`,
      sender_id: auth.user.id,
      sender_name: auth.nome,
    });
  }

  return updatedTicket;
}

export async function closeTicket(
  ticketId: string,
  payload?: CloseTicketPayload
): Promise<Ticket> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) throw new Error("Usuário não autenticado");

  const allRawTickets = await fetchAllRawTickets();
  const targetIndex = allRawTickets.findIndex((t) => t.id === ticketId);
  if (targetIndex === -1) throw new Error("Ticket não encontrado");

  const ticket = allRawTickets[targetIndex];
  const isCreator = ticket.user_id === auth.user.id;
  const isAssigned = ticket.assigned_to_id === auth.user.id;

  if (!auth.canClose && !auth.canManage && !isCreator && !isAssigned && !auth.isSuperUser) {
    throw new Error("Permissão insuficiente para fechar tickets");
  }

  const actorName = auth.nickname || auth.nome || (isCreator ? "Autor do Chamado" : "Gestor");
  const now = new Date().toISOString();
  const reason =
    payload?.reason?.trim() ||
    (isCreator
      ? "Chamado finalizado pelo próprio autor."
      : "Chamado concluído e resolvido pela gerência.");

  const updatedTicket: Ticket = {
    ...ticket,
    status: "fechado",
    updated_at: now,
    closed_at: now,
    closed_by_id: auth.user.id,
    closed_by_name: actorName,
    closed_reason: reason,
  };

  allRawTickets[targetIndex] = updatedTicket;
  setLocalTickets(allRawTickets, false);
  await persistRolePermissionsData(TICKETS_DB_LEVEL, { tickets: allRawTickets });

  broadcastTicketsRealtimeUpdate();

  void logAuditAction(
    "close_ticket",
    "tickets",
    {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      closed_by_name: actorName,
      reason,
    },
    undefined,
    ticket.id
  );

  if (ticket.user_id !== auth.user.id) {
    void createNotification({
      title: `Chamado #${String(ticket.ticket_number).padStart(3, "0")} finalizado`,
      message: `Seu chamado "${ticket.subject}" foi finalizado por ${actorName}. Motivo: "${reason}"`,
      type: "ticket",
      category: "success",
      user_id: ticket.user_id,
      link: `/tickets/${ticket.id}`,
      sender_id: auth.user.id,
      sender_name: actorName,
    });
  }

  return updatedTicket;
}

export async function reopenTicket(ticketId: string): Promise<Ticket> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) throw new Error("Usuário não autenticado");

  const allRawTickets = await fetchAllRawTickets();
  const targetIndex = allRawTickets.findIndex((t) => t.id === ticketId);
  if (targetIndex === -1) throw new Error("Ticket não encontrado");

  const ticket = allRawTickets[targetIndex];
  const isCreator = ticket.user_id === auth.user.id;
  const isAssigned = ticket.assigned_to_id === auth.user.id;

  if (!auth.canReopen && !auth.canManage && !isCreator && !isAssigned && !auth.isSuperUser) {
    throw new Error("Permissão insuficiente para reabrir tickets");
  }

  const now = new Date().toISOString();

  const updatedTicket: Ticket = {
    ...ticket,
    status: ticket.assigned_to_id ? "em_atendimento" : "aberto",
    updated_at: now,
    closed_at: null,
    closed_by_id: null,
    closed_by_name: null,
    closed_reason: null,
  };

  allRawTickets[targetIndex] = updatedTicket;
  setLocalTickets(allRawTickets, false);
  await persistRolePermissionsData(TICKETS_DB_LEVEL, { tickets: allRawTickets });

  broadcastTicketsRealtimeUpdate();

  void logAuditAction(
    "reopen_ticket",
    "tickets",
    {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
    },
    undefined,
    ticket.id
  );

  return updatedTicket;
}

export async function deleteTicket(ticketId: string): Promise<void> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) throw new Error("Usuário não autenticado");

  if (!auth.canDelete && !auth.canManage && !auth.isSuperUser) {
    throw new Error("Permissão insuficiente para excluir tickets");
  }

  const allRawTickets = await fetchAllRawTickets();
  const target = allRawTickets.find((t) => t.id === ticketId);
  const updatedList = allRawTickets.filter((t) => t.id !== ticketId);
  setLocalTickets(updatedList, false);

  await persistRolePermissionsData(TICKETS_DB_LEVEL, { tickets: updatedList });

  broadcastTicketsRealtimeUpdate();

  if (target) {
    void logAuditAction(
      "delete_ticket",
      "tickets",
      {
        ticket_id: ticketId,
        ticket_number: target.ticket_number,
        subject: target.subject,
      },
      undefined,
      ticketId
    );
  }
}

/**
 * Upload otimizado de anexo de chamado para o bucket 'chat-attachments'.
 * Retorna URL pública leve para evitar inchar a tabela com Base64.
 */
export async function uploadTicketAttachment(file: File): Promise<TicketAttachment> {
  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxBytes) {
    throw new Error("O anexo não pode exceder 10MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const sanitizedExt = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? ext : "png";
  const uniqueName = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${sanitizedExt}`;
  const filePath = `tickets/${uniqueName}`;

  // 1. Se for imagem, envia para a API Postimages
  if (file.type && file.type.startsWith("image/")) {
    try {
      const { uploadImageToPostimages } = await import("@/services/postimagesService");
      const cdnUrl = await uploadImageToPostimages(file, { filename: uniqueName });
      return {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name || "print.png",
        url: cdnUrl,
        size: file.size,
        type: file.type || `image/${sanitizedExt}`,
        created_at: new Date().toISOString(),
      };
    } catch (postErr) {
      console.warn("⚠️ Aviso ao subir anexo para o Postimages:", postErr);
    }
  }

  // Fallback se upload falhar
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: file.name || "print.png",
    url: dataUrl,
    size: file.size,
    type: file.type,
    created_at: new Date().toISOString(),
  };
}

/**
 * Adiciona um membro participante ao chamado.
 */
export async function addTicketMember(
  ticketId: string,
  payload: AddTicketMemberPayload
): Promise<Ticket> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) throw new Error("Usuário não autenticado");

  const allRawTickets = await fetchAllRawTickets();
  const targetIndex = allRawTickets.findIndex((t) => t.id === ticketId);
  if (targetIndex === -1) throw new Error("Ticket não encontrado");

  const ticket = allRawTickets[targetIndex];

  // Permissão: Gerência/Liderança/SuperUser, Criador do ticket ou Atendente Atribuído
  const isCreator = ticket.user_id === auth.user.id;
  const isAssigned = ticket.assigned_to_id === auth.user.id;
  if (!auth.canManageMembers && !auth.canManage && !auth.isSuperUser && !isCreator && !isAssigned) {
    throw new Error("Você não tem permissão para adicionar membros a este ticket");
  }

  const currentMembers = ticket.members || [];
  if (currentMembers.some((m) => m.user_id === payload.user_id)) {
    throw new Error("Este membro já está no chamado");
  }
  if (ticket.user_id === payload.user_id) {
    throw new Error("Este membro é o autor do chamado");
  }

  const now = new Date().toISOString();
  const newMember: TicketMember = {
    user_id: payload.user_id,
    name: payload.name,
    nickname: payload.nickname || null,
    role: payload.role || null,
    avatar: payload.avatar || null,
    added_at: now,
    added_by_id: auth.user.id,
    added_by_name: auth.nickname || auth.nome || "Membro",
  };

  // Mensagem de sistema no histórico da conversa
  const actorName = auth.nickname || auth.nome || "Gestor";
  const targetName = payload.nickname || payload.name;
  const memberSystemMsg: TicketMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticket_id: ticketId,
    sender_id: auth.user.id,
    sender_name: auth.nome,
    sender_nickname: auth.nickname,
    sender_role: auth.role,
    sender_avatar: auth.avatar,
    content: `👥 [Membros] ${targetName} foi adicionado(a) ao chamado por ${actorName}.`,
    is_internal_note: false,
    created_at: now,
  };

  const updatedTicket: Ticket = {
    ...ticket,
    members: [...currentMembers, newMember],
    messages: [...(ticket.messages || []), memberSystemMsg],
    updated_at: now,
  };

  allRawTickets[targetIndex] = updatedTicket;
  setLocalTickets(allRawTickets, false);
  await persistRolePermissionsData(TICKETS_DB_LEVEL, { tickets: allRawTickets });

  broadcastTicketsRealtimeUpdate();

  void logAuditAction(
    "add_ticket_member",
    "tickets",
    {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      member_id: payload.user_id,
      member_name: targetName,
      added_by: actorName,
    },
    undefined,
    ticket.id
  );

  void createNotification({
    title: `Adicionado ao Chamado #${String(ticket.ticket_number).padStart(3, "0")}`,
    message: `${actorName} adicionou você como participante no chamado: "${ticket.subject}".`,
    type: "ticket",
    category: "info",
    user_id: payload.user_id,
    link: `/tickets/${ticket.id}`,
    sender_id: auth.user.id,
    sender_name: actorName,
  });

  return updatedTicket;
}

/**
 * Remove um membro participante do chamado.
 */
export async function removeTicketMember(
  ticketId: string,
  memberUserId: string
): Promise<Ticket> {
  const auth = await getEffectiveTicketAuth();
  if (!auth) throw new Error("Usuário não autenticado");

  const allRawTickets = await fetchAllRawTickets();
  const targetIndex = allRawTickets.findIndex((t) => t.id === ticketId);
  if (targetIndex === -1) throw new Error("Ticket não encontrado");

  const ticket = allRawTickets[targetIndex];

  const isCreator = ticket.user_id === auth.user.id;
  const isAssigned = ticket.assigned_to_id === auth.user.id;
  if (!auth.canManageMembers && !auth.canManage && !auth.isSuperUser && !isCreator && !isAssigned) {
    throw new Error("Você não tem permissão para remover membros deste ticket");
  }

  const currentMembers = ticket.members || [];
  const targetMember = currentMembers.find((m) => m.user_id === memberUserId);
  if (!targetMember) throw new Error("Membro não encontrado no chamado");

  const now = new Date().toISOString();
  const actorName = auth.nickname || auth.nome || "Gestor";
  const targetName = targetMember.nickname || targetMember.name;

  const memberSystemMsg: TicketMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticket_id: ticketId,
    sender_id: auth.user.id,
    sender_name: auth.nome,
    sender_nickname: auth.nickname,
    sender_role: auth.role,
    sender_avatar: auth.avatar,
    content: `👥 [Membros] ${targetName} foi removido(a) do chamado por ${actorName}.`,
    is_internal_note: false,
    created_at: now,
  };

  const updatedTicket: Ticket = {
    ...ticket,
    members: currentMembers.filter((m) => m.user_id !== memberUserId),
    messages: [...(ticket.messages || []), memberSystemMsg],
    updated_at: now,
  };

  allRawTickets[targetIndex] = updatedTicket;
  setLocalTickets(allRawTickets, false);
  await persistRolePermissionsData(TICKETS_DB_LEVEL, { tickets: allRawTickets });

  broadcastTicketsRealtimeUpdate();

  void logAuditAction(
    "remove_ticket_member",
    "tickets",
    {
      ticket_id: ticket.id,
      ticket_number: ticket.ticket_number,
      subject: ticket.subject,
      member_id: memberUserId,
      member_name: targetName,
      removed_by: actorName,
    },
    undefined,
    ticket.id
  );

  void createNotification({
    title: `Removido do Chamado #${String(ticket.ticket_number).padStart(3, "0")}`,
    message: `Você foi removido(a) do chamado "${ticket.subject}" por ${actorName}.`,
    type: "ticket",
    category: "warning",
    user_id: memberUserId,
    link: "/tickets",
    sender_id: auth.user.id,
    sender_name: actorName,
  });

  return updatedTicket;
}

// ==============================================================================
// SISTEMA DE ESCALA DE AÇÃO API
// ==============================================================================

export async function getActionScales(status?: string): Promise<ActionScale[]> {
  try {
    const { data, error } = await supabase.rpc("get_action_scales_summary", {
      p_status: status || null,
    });
    if (error) throw error;
    if (Array.isArray(data)) return data as ActionScale[];
  } catch (err) {
    console.warn("RPC get_action_scales_summary failed, falling back to direct query:", err);
  }

  let query = supabase.from("action_scales").select("*").order("data_hora", { ascending: true });
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ActionScale[];
}

export async function getActionScale(id: string): Promise<ActionScale | null> {
  const { data: scale, error: scaleErr } = await supabase
    .from("action_scales")
    .select("*")
    .eq("id", id)
    .single();

  if (scaleErr) throw scaleErr;
  if (!scale) return null;

  const { data: members, error: memErr } = await supabase
    .from("action_scale_members")
    .select("*")
    .eq("scale_id", id)
    .order("tipo_vaga", { ascending: false })
    .order("criado_em", { ascending: true });

  if (memErr) throw memErr;

  return {
    ...scale,
    membros: (members || []) as ActionScaleMember[],
  };
}

export async function getActionScaleMembers(scaleId: string): Promise<ActionScaleMember[]> {
  const { data, error } = await supabase
    .from("action_scale_members")
    .select("*")
    .eq("scale_id", scaleId)
    .order("tipo_vaga", { ascending: false })
    .order("criado_em", { ascending: true });

  if (error) throw error;
  return (data || []) as ActionScaleMember[];
}

export async function getActionScaleHistory(scaleId: string): Promise<ActionScaleHistory[]> {
  const { data, error } = await supabase
    .from("action_scale_history")
    .select("*")
    .eq("scale_id", scaleId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as ActionScaleHistory[];
}

export async function saveActionScale(payload: {
  id?: string | null;
  titulo: string;
  tipo_acao: string;
  descricao?: string | null;
  data_hora: string;
  data_hora_chamada?: string | null;
  local_posto: string;
  vagas_limite?: number;
  vagas_reservas?: number;
  status?: string;
  gerenteId?: string | null;
  gerenteNome?: string | null;
  actor_name: string;
  metadata?: Record<string, any>;
}): Promise<ActionScale> {
  const scaleId = payload.id || ((typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `scale_${Date.now()}`);
  const now = new Date().toISOString();
  const scaleObj: ActionScale = {
    id: scaleId,
    titulo: payload.titulo.trim(),
    tipo_acao: payload.tipo_acao,
    descricao: payload.descricao?.trim() || null,
    data_hora: payload.data_hora,
    data_hora_chamada: payload.data_hora_chamada || null,
    local_posto: payload.local_posto,
    vagas_limite: payload.vagas_limite ?? 10,
    vagas_reservas: payload.vagas_reservas ?? 2,
    status: (payload.status as any) || "rascunho",
    gerente_id: payload.gerenteId || null,
    gerente_nome: payload.gerenteNome || null,
    metadata: payload.metadata || {},
    criado_em: now,
    atualizado_em: now,
  } as any;

  try {
    await rtdb.set(`action_scales/${scaleId}`, scaleObj);
  } catch (fbErr) {
    console.warn("Erro ao salvar escala no RTDB:", fbErr);
  }

  try {
    await supabase.rpc("save_action_scale", {
      p_id: scaleId,
      p_titulo: payload.titulo,
      p_tipo_acao: payload.tipo_acao,
      p_descricao: payload.descricao || null,
      p_data_hora: payload.data_hora,
      p_data_hora_chamada: payload.data_hora_chamada || null,
      p_local_posto: payload.local_posto,
      p_vagas_limite: payload.vagas_limite ?? 10,
      p_vagas_reservas: payload.vagas_reservas ?? 2,
      p_status: payload.status || "rascunho",
      p_actor_name: payload.actor_name,
      p_metadata: payload.metadata || {},
      p_gerente_id: payload.gerenteId || null,
      p_gerente_nome: payload.gerenteNome || null,
    });
  } catch {}

  void logAuditAction("save_action_scale", "action_scales", { titulo: payload.titulo, status: payload.status }, undefined, scaleId);
  return scaleObj;
}

export async function publishActionScale(scaleId: string, actorName: string): Promise<any> {
  try {
    await rtdb.update(`action_scales/${scaleId}`, {
      status: "publicada",
      atualizado_em: new Date().toISOString(),
    });
  } catch {}

  try {
    await supabase.rpc("publish_action_scale", {
      p_scale_id: scaleId,
      p_actor_name: actorName,
    });
  } catch {}

  void logAuditAction("publish_action_scale", "action_scales", { scaleId, actorName }, undefined, scaleId);
  return { success: true, status: "publicada" };
}

export async function cancelActionScale(scaleId: string, motivo: string, actorName: string): Promise<any> {
  try {
    await rtdb.update(`action_scales/${scaleId}`, {
      status: "cancelada",
      motivo_cancelamento: motivo,
      atualizado_em: new Date().toISOString(),
    });
  } catch {}

  try {
    await supabase.rpc("cancel_action_scale", {
      p_scale_id: scaleId,
      p_motivo: motivo,
      p_actor_name: actorName,
    });
  } catch {}

  void logAuditAction("cancel_action_scale", "action_scales", { scaleId, motivo, actorName }, undefined, scaleId);
  return { success: true, status: "cancelada" };
}

export async function deleteActionScale(scaleId: string): Promise<void> {
  try {
    await rtdb.remove(`action_scales/${scaleId}`);
  } catch {}

  try {
    await supabase.from("action_scales").delete().eq("id", scaleId);
  } catch {}

  void logAuditAction("delete_action_scale", "action_scales", { scaleId }, undefined, scaleId);
}

export async function addActionScaleMember(payload: {
  scaleId: string;
  memberId: string;
  postoFuncao: string;
  tipoVaga: "titular" | "reserva";
  actorName: string;
}): Promise<ActionScaleMember> {
  const { data, error } = await supabase.rpc("add_action_scale_member", {
    p_scale_id: payload.scaleId,
    p_member_id: payload.memberId,
    p_posto_funcao: payload.postoFuncao,
    p_tipo_vaga: payload.tipoVaga,
    p_actor_name: payload.actorName,
  });
  if (error) throw error;
  return data as ActionScaleMember;
}

export async function removeActionScaleMember(scaleId: string, memberId: string, actorName: string): Promise<void> {
  const { error } = await supabase.rpc("remove_action_scale_member", {
    p_scale_id: scaleId,
    p_member_id: memberId,
    p_actor_name: actorName,
  });
  if (error) throw error;
}

export async function confirmActionScalePresence(payload: {
  scaleId: string;
  memberId?: string | null;
  status: "confirmado" | "ausente" | "pendente";
  reacao?: string;
  justificativa?: string;
  postoFuncao?: string;
  tipoVaga?: "titular" | "reserva" | null;
  actorName: string;
}): Promise<ActionScaleMember> {
  const { data, error } = await supabase.rpc("confirm_action_scale_presence", {
    p_scale_id: payload.scaleId,
    p_member_id: payload.memberId || null,
    p_status_presenca: payload.status,
    p_reacao: payload.reacao || (payload.status === "confirmado" ? "👍" : "❌"),
    p_justificativa: payload.justificativa || "",
    p_actor_name: payload.actorName,
    p_posto_funcao: payload.postoFuncao || "Operacional",
    p_tipo_vaga: payload.tipoVaga || null,
  });
  if (error) throw error;
  return data as ActionScaleMember;
}

export async function leaveActionScale(payload: {
  scaleId: string;
  memberId?: string | null;
  actorName: string;
}): Promise<any> {
  const { data, error } = await supabase.rpc("leave_action_scale", {
    p_scale_id: payload.scaleId,
    p_member_id: payload.memberId || null,
    p_actor_name: payload.actorName,
  });
  if (error) throw error;
  return data;
}

export async function substituteActionScaleMember(payload: {
  scaleId: string;
  originalMemberId: string;
  substitutoId: string;
  motivo: string;
  actorName: string;
}): Promise<any> {
  const { data, error } = await supabase.rpc("substitute_action_scale_member", {
    p_scale_id: payload.scaleId,
    p_original_member_id: payload.originalMemberId,
    p_substituto_id: payload.substitutoId,
    p_motivo: payload.motivo,
    p_actor_name: payload.actorName,
  });
  if (error) throw error;
  return data;
}

export async function reviewActionScaleMember(payload: {
  scaleId: string;
  memberId: string;
  statusAprovacao: "aprovado" | "reprovado" | "pendente";
  motivo?: string;
  actorName: string;
}): Promise<ActionScaleMember> {
  const { data, error } = await supabase.rpc("review_action_scale_member", {
    p_scale_id: payload.scaleId,
    p_member_id: payload.memberId,
    p_status_aprovacao: payload.statusAprovacao,
    p_motivo: payload.motivo || null,
    p_actor_name: payload.actorName,
  });
  if (error) throw error;
  return data as ActionScaleMember;
}
