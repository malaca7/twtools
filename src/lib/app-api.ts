import { supabase } from "@/integrations/supabase/client";
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
} from "./app-types";
import { LEVEL_LABEL, type AppLevel, type Permission } from "./permissions";

export async function getCurrentAuth(): Promise<AuthState> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return {
        user: null,
        profile: null,
        level: null,
        signupRequestStatus: null,
        approvedAccess: false,
      };
    }

    // Load profile
    const { data: profileRow } = await (supabase.from("profiles" as any))
      .select("id, user_id, nome, nickname, telefone, game_id, avatar_url, status, data_entrada, discord_id, discord_username, discord_avatar_url, discord_email, is_developer, custom_theme")
      .eq("user_id", session.user.id)
      .maybeSingle();

    // Load level/role
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("nivel")
      .eq("user_id", session.user.id)
      .maybeSingle();

    // Load signup request status
    const { data: signupRow } = await supabase
      .from("signup_requests")
      .select("status")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const user: AppUser = {
      id: session.user.id,
      email: session.user.email ?? null,
    };

    const pAny = profileRow as any;
    const profile: Profile | null = profileRow ? {
      id: pAny.id,
      user_id: pAny.user_id,
      nome: pAny.nome ?? "Membro",
      nickname: pAny.nickname ?? null,
      telefone: pAny.telefone ?? null,
      game_id: pAny.game_id ?? null,
      avatar_url: pAny.avatar_url ?? null,
      status: pAny.status ?? "pendente",
      data_entrada: pAny.data_entrada ?? new Date().toISOString().slice(0, 10),
      discord_id: pAny.discord_id ?? null,
      discord_username: pAny.discord_username ?? null,
      discord_avatar_url: pAny.discord_avatar_url ?? null,
      discord_email: pAny.discord_email ?? null,
      is_developer: Boolean(pAny.is_developer),
      custom_theme: pAny.custom_theme || null,
    } : null;

    let level = (roleRow?.nivel as AppLevel) ?? null;

    const sStatus = signupRow?.status;
    const approvedAccess = Boolean(
      profile &&
        level &&
        profile.status === "ativo" &&
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
  await supabase.auth.signOut();
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
  const { data, error } = await supabase
    .from("categories")
    .select("id, nome, descricao, ativo, created_at")
    .order("nome");
  if (error) throw error;
  return (data || []).map(d => ({
    id: d.id,
    nome: d.nome,
    descricao: d.descricao,
    ativo: d.ativo,
    created_at: String(d.created_at)
  }));
}

export async function getBaus(): Promise<Bau[]> {
  const { data, error } = await supabase
    .from("baus")
    .select("id, nome, descricao, icone, ativo, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const list: Bau[] = [];

  for (const d of data || []) {
    const id = String(d.id);
    const normName = String(d.nome || "").trim().toLowerCase();
    
    // Ignore and cleanup any legacy caixote entries
    if (normName.includes("caixote")) {
      void supabase.from("baus").delete().eq("id", id);
      continue;
    }

    if (seenIds.has(id) || (normName && seenNames.has(normName))) {
      continue;
    }
    seenIds.add(id);
    if (normName) seenNames.add(normName);

    list.push({
      id: d.id,
      nome: d.nome,
      descricao: d.descricao,
      icone: d.icone,
      ativo: d.ativo ?? true,
      created_at: String(d.created_at),
    });
  }

  return list;
}

export async function createBau(payload: { nome: string; descricao?: string; icone?: string }): Promise<Bau> {
  const cleanName = payload.nome.trim();
  if (!cleanName) throw new Error("Informe o nome do baú.");

  const { data: existing } = await supabase
    .from("baus")
    .select("id, nome")
    .ilike("nome", cleanName)
    .maybeSingle();

  if (existing) {
    throw new Error(`Já existe um baú cadastrado com o nome "${existing.nome}".`);
  }

  const { data, error } = await supabase
    .from("baus")
    .insert({
      nome: cleanName,
      descricao: payload.descricao?.trim() || null,
      icone: payload.icone || 'box',
      ativo: true
    })
    .select()
    .single();
  if (error) throw error;

  void logAuditAction("create_bau", "baus", { nome: data.nome, descricao: data.descricao }, undefined, data.id);

  return {
    id: data.id,
    nome: data.nome,
    descricao: data.descricao,
    icone: data.icone,
    ativo: data.ativo,
    created_at: String(data.created_at)
  };
}

export async function updateBau(payload: { id: string; nome?: string; descricao?: string; icone?: string; ativo?: boolean }): Promise<void> {
  const { data: oldBau } = await supabase.from("baus").select("nome, descricao, ativo").eq("id", payload.id).maybeSingle();

  const updates: any = {};
  if (payload.nome !== undefined) {
    const cleanName = payload.nome.trim();
    if (!cleanName) throw new Error("Informe o nome do baú.");

    const { data: existing } = await supabase
      .from("baus")
      .select("id, nome")
      .ilike("nome", cleanName)
      .neq("id", payload.id)
      .maybeSingle();

    if (existing) {
      throw new Error(`Já existe outro baú cadastrado com o nome "${existing.nome}".`);
    }

    updates.nome = cleanName;
  }
  if (payload.descricao !== undefined) updates.descricao = payload.descricao.trim();
  if (payload.icone !== undefined) updates.icone = payload.icone;
  if (payload.ativo !== undefined) updates.ativo = payload.ativo;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("baus")
    .update(updates)
    .eq("id", payload.id)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Não foi possível atualizar o baú.");
  }

  void logAuditAction("update_bau", "baus", { id: payload.id, ...updates }, oldBau || undefined, payload.id);
}

export async function deleteBau(id: string): Promise<void> {
  const { data: oldBau } = await supabase.from("baus").select("nome").eq("id", id).maybeSingle();

  // Desvincular produtos que apontavam para este baú
  await supabase
    .from("products")
    .update({ bau_id: null, updated_at: new Date().toISOString() })
    .eq("bau_id", id);

  // Limpar entradas de product_baus se a tabela existir
  try {
    await (supabase.from("product_baus" as any)).delete().eq("bau_id", id);
  } catch (err) {
    console.warn("Could not delete product_baus records:", err);
  }

  const { error } = await supabase.from("baus").delete().eq("id", id);
  if (error) throw error;

  void logAuditAction("delete_bau", "baus", { id, nome: oldBau?.nome }, undefined, id);
}

export interface ProductBauStock {
  product_id: string;
  bau_id: string;
  quantidade: number;
}

export async function getProductBaus(): Promise<ProductBauStock[]> {
  try {
    const { data, error } = await (supabase.from("product_baus" as any))
      .select("product_id, bau_id, quantidade");
    if (error) {
      console.warn("Could not load product_baus directly:", error);
      return [];
    }
    return (data || []).map((d: any) => ({
      product_id: String(d.product_id),
      bau_id: String(d.bau_id),
      quantidade: Number(d.quantidade || 0),
    }));
  } catch {
    return [];
  }
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, nome, descricao, categoria_id, bau_id, unidade, estoque_atual, estoque_minimo, preco_sugerido, imagem_url, ativo, created_at, updated_at")
    .order("nome");
  if (error) throw error;
  return (data || []).map(d => ({
    id: d.id,
    nome: d.nome,
    descricao: d.descricao,
    categoria_id: d.categoria_id,
    bau_id: d.bau_id,
    unidade: d.unidade,
    estoque_atual: Number(d.estoque_atual),
    estoque_minimo: Number(d.estoque_minimo),
    preco_sugerido: Number(d.preco_sugerido),
    imagem_url: d.imagem_url || null,
    ativo: d.ativo,
    created_at: String(d.created_at),
    updated_at: String(d.updated_at)
  }));
}

export async function updateProductBau(productId: string, bauId: string | null): Promise<void> {
  const { data: oldProd } = await supabase.from("products").select("nome, bau_id").eq("id", productId).maybeSingle();
  const { data: oldBau } = oldProd?.bau_id ? await supabase.from("baus").select("nome").eq("id", oldProd.bau_id).maybeSingle() : { data: null };
  const { data: newBau } = bauId ? await supabase.from("baus").select("nome").eq("id", bauId).maybeSingle() : { data: null };

  const { error } = await supabase
    .from("products")
    .update({ bau_id: bauId, updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) throw error;

  void logAuditAction("update_product_bau", "products", {
    product_name: oldProd?.nome || "Produto",
    old_bau_name: (oldBau as any)?.nome || "Nenhum",
    new_bau_name: (newBau as any)?.nome || "Nenhum",
  }, { bau_id: oldProd?.bau_id }, productId);
}

export async function getMovements(): Promise<Movement[]> {
  const { data: bausRes } = await supabase.from("baus").select("id, nome");
  const listBaus = bausRes || [];
  const defaultBau = listBaus[0];
  const defaultBauId = defaultBau?.id || null;

  const { data, error } = await (supabase.from("stock_movements" as any))
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Error loading stock_movements:", error);
    return [];
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
    };
  });
}

export async function getSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("id, product_id, seller_id, buyer_name, quantity, unit_price, total_price, payment_method, notes, status, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data || []).map(d => ({
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
  const { data, error } = await supabase
    .from("goals")
    .select("id, user_id, type, target_value, period_start, period_end, descricao, created_at")
    .order("period_end", { ascending: false });
  if (error) throw error;
  return (data || []).map(d => ({
    id: d.id,
    user_id: d.user_id,
    type: d.type as "vendas" | "faturamento" | "quantidade",
    target_value: Number(d.target_value),
    period_start: String(d.period_start),
    period_end: String(d.period_end),
    descricao: d.descricao,
    created_at: String(d.created_at)
  }));
}

export async function getUserPresences(): Promise<UserPresence[]> {
  const { data, error } = await supabase
    .from("user_presence")
    .select("user_id, status, last_seen, updated_at");
  if (error) throw error;
  return (data || []).map(d => ({
    user_id: d.user_id,
    status: d.status as UserPresenceStatus,
    last_seen: String(d.last_seen),
    updated_at: String(d.updated_at)
  }));
}

export async function updateUserPresence(status: UserPresenceStatus, incrementSeconds = 60): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const userId = session.user.id;
  const nowISO = new Date().toISOString();

  // 1. Trigger RPC if available for incrementing online seconds
  try {
    await supabase.rpc("heartbeat_user_presence" as any, {
      _status: status,
      _increment_seconds: incrementSeconds,
    });
  } catch (e) {}

  // 2. Always upsert user_presence table to guarantee status ("online" | "ausente" | "offline") is updated in DB
  const { data: existing } = await (supabase.from("user_presence" as any))
    .select("status, online_since, total_seconds_online")
    .eq("user_id", userId)
    .maybeSingle();

  let onlineSince = (existing as any)?.online_since;
  let totalSecs = Number((existing as any)?.total_seconds_online || 0);

  if (status === "online") {
    if (!onlineSince || (existing as any)?.status === "offline") {
      onlineSince = nowISO;
    }
    if (incrementSeconds > 0) {
      totalSecs += incrementSeconds;
    }
  } else if (status === "ausente") {
    // Retain online_since timestamp while away if needed
    if (!onlineSince) onlineSince = nowISO;
  } else {
    onlineSince = null;
  }

  const { error: upsertErr } = await (supabase.from("user_presence" as any))
    .upsert(
      {
        user_id: userId,
        status,
        last_seen: nowISO,
        online_since: onlineSince,
        total_seconds_online: totalSecs,
        updated_at: nowISO,
      },
      { onConflict: "user_id" }
    );
  if (upsertErr) console.error("Error updating user presence:", upsertErr);
}

export async function getMembers(): Promise<Member[]> {
  const [profilesRes, rolesRes, presenceRes, signupReqsRes] = await Promise.all([
    (supabase.from("profiles" as any))
      .select("user_id, nome, nickname, telefone, game_id, status, data_entrada, created_at, discord_id, discord_username, discord_avatar_url, discord_email, is_developer")
      .order("created_at", { ascending: true }),
    supabase
      .from("user_roles")
      .select("user_id, nivel"),
    (supabase.from("user_presence" as any))
      .select("user_id, status, last_seen, online_since, total_seconds_online, updated_at"),
    (supabase.from("signup_requests" as any))
      .select("user_id, status")
  ]);

  if (profilesRes.error) throw profilesRes.error;

  const rolesMap = new Map<string, AppLevel>();
  (rolesRes.data || []).forEach((r) => {
    if (r.user_id && r.nivel) rolesMap.set(r.user_id, r.nivel as AppLevel);
  });

  const pendingSet = new Set<string>();
  (signupReqsRes.data || []).forEach((s: any) => {
    if (s.status === "pendente") pendingSet.add(s.user_id);
  });

  const nowMs = Date.now();
  const presenceMap = new Map<string, { status: UserPresenceStatus; last_seen?: string; updated_at?: string; online_since?: string; total_seconds: number; total_hours: number }>();
  (presenceRes.data || []).forEach((p: any) => {
    const secs = Number(p.total_seconds_online || 0);
    let computedStatus = (p.status as UserPresenceStatus) || "offline";
    const lastSeenMs = p.last_seen ? new Date(p.last_seen).getTime() : 0;
    const diffSecs = lastSeenMs > 0 ? (nowMs - lastSeenMs) / 1000 : 99999;

    // Automatic calculation for stale online presences (inactive for > 90s -> ausente, > 300s -> offline)
    if (computedStatus === "online" && diffSecs > 90) {
      computedStatus = diffSecs > 300 ? "offline" : "ausente";
    }

    const item: { status: UserPresenceStatus; last_seen?: string; updated_at?: string; online_since?: string; total_seconds: number; total_hours: number } = {
      status: computedStatus,
      last_seen: p.last_seen ? String(p.last_seen) : undefined,
      updated_at: p.updated_at ? String(p.updated_at) : undefined,
      total_seconds: secs,
      total_hours: Math.round((secs / 3600) * 10) / 10,
    };
    if (p.online_since && computedStatus === "online") item.online_since = String(p.online_since);
    presenceMap.set(p.user_id, item);
  });

  return (profilesRes.data || [])
    .filter((d: any) => {
      // User must not be pending and must have an assigned role or approved status
      if (pendingSet.has(d.user_id)) return false;
      const hasRole = rolesMap.has(d.user_id);
      return hasRole || d.status === "aprovado";
    })
    .map((d: any) => {
      const roleNivel = rolesMap.get(d.user_id) || "novato";
      const pres = presenceMap.get(d.user_id);

      return {
        user_id: d.user_id,
        nome: d.nome,
        nickname: d.nickname,
        telefone: d.telefone ?? null,
        game_id: d.game_id ?? null,
        status: d.status,
        data_entrada: String(d.data_entrada),
        created_at: String(d.created_at),
        nivel: roleNivel,
        presence_status: pres?.status || "offline",
        last_seen: pres?.last_seen || null,
        presence_updated_at: pres?.updated_at || pres?.last_seen || null,
        updated_at: pres?.updated_at || null,
        online_since: pres?.online_since || null,
        total_seconds_online: pres?.total_seconds || 0,
        total_hours_online: pres?.total_hours || 0,
        discord_id: d.discord_id,
        discord_username: d.discord_username,
        discord_avatar_url: d.discord_avatar_url,
        discord_email: d.discord_email,
        is_developer: Boolean(d.is_developer || roleNivel === "desenvolvedor" || d.discord_id === "917826984778797087"),
      };
    });
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
}

export async function updateUserProfile(payload: { nome: string; nickname?: string | null; telefone: string; game_id: string }): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Não autenticado");

  const { data: oldProfile } = await (supabase.from("profiles" as any))
    .select("nome, nickname, telefone, game_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({
      nome: payload.nome.trim(),
      nickname: payload.nickname?.trim() || null,
      telefone: payload.telefone.trim(),
      game_id: payload.game_id.trim(),
      updated_at: new Date().toISOString(),
    } as any)
    .eq("user_id", session.user.id);

  if (error) throw error;

  void logAuditAction("update_profile", "profiles", {
    nome: payload.nome.trim(),
    nickname: payload.nickname?.trim() || null,
    telefone: payload.telefone.trim(),
    game_id: payload.game_id.trim(),
  }, oldProfile || undefined, session.user.id);
}

export async function updateUserTheme(theme: import("./app-types").UserThemeSettings): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Não autenticado");

  const { error } = await (supabase.from("profiles" as any))
    .update({
      custom_theme: theme,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", session.user.id);

  if (error) throw error;
}

export async function updateMemberDetails(payload: {
  targetUserId: string;
  nome: string;
  nickname?: string | null;
  telefone?: string | null;
  game_id?: string | null;
  is_developer?: boolean;
}): Promise<void> {
  const { data: oldProfile } = await (supabase.from("profiles" as any))
    .select("nome, nickname, telefone, game_id")
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
    updateFields.is_developer = Boolean(payload.is_developer);
  }

  const { error } = await (supabase.from("profiles" as any))
    .update(updateFields)
    .eq("user_id", payload.targetUserId);

  if (error) throw error;

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
  }, oldProfile || undefined, payload.targetUserId);
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
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await (supabase.from("announcements" as any))
    .select("id, author_id, title, content, priority, created_at, updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Não autenticado");

  const { data, error } = await (supabase.from("announcements" as any))
    .insert({
      author_id: session.user.id,
      title: payload.title.trim(),
      content: payload.content.trim(),
      priority: payload.priority || "normal",
    })
    .select()
    .single();

  if (error) throw error;

  void logAuditAction("create_announcement", "announcements", { title: payload.title, priority: payload.priority }, undefined, (data as any).id);

  return {
    id: (data as any).id,
    author_id: (data as any).author_id,
    title: (data as any).title,
    content: (data as any).content,
    priority: (data as any).priority as any,
    created_at: String((data as any).created_at),
    updated_at: String((data as any).updated_at),
  };
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { data: oldAnn } = await (supabase.from("announcements" as any)).select("title").eq("id", id).maybeSingle();
  const { error } = await (supabase.from("announcements" as any)).delete().eq("id", id);
  if (error) throw error;

  void logAuditAction("delete_announcement", "announcements", { title: (oldAnn as any)?.title }, undefined, id);
}

export async function updateAnnouncement(id: string, payload: { title: string; content: string; priority?: "normal" | "importante" | "urgente" }): Promise<void> {
  const { error } = await (supabase.from("announcements" as any))
    .update({
      title: payload.title.trim(),
      content: payload.content.trim(),
      priority: payload.priority || "normal",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;

  void logAuditAction("update_announcement", "announcements", { title: payload.title, priority: payload.priority }, undefined, id);
}

export async function getAnnouncementReads(): Promise<AnnouncementRead[]> {
  const { data, error } = await (supabase.from("announcement_reads" as any))
    .select("announcement_id, user_id, read_at");
  if (error) throw error;
  return (data || []).map((d: any) => ({
    announcement_id: String(d.announcement_id),
    user_id: String(d.user_id),
    read_at: String(d.read_at),
  }));
}

export async function markAnnouncementAsRead(announcementId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const { data: ann } = await (supabase.from("announcements" as any)).select("title").eq("id", announcementId).maybeSingle();

  const { error } = await (supabase.from("announcement_reads" as any))
    .upsert({
      announcement_id: announcementId,
      user_id: session.user.id,
      read_at: new Date().toISOString(),
    }, { onConflict: "announcement_id,user_id" });

  void logAuditAction("read_announcement", "announcements", { title: (ann as any)?.title || "Comunicado" }, undefined, announcementId);
}

export async function setMemberLevel(targetUserId: string, newLevel: AppLevel): Promise<void> {
  const { data: targetProfile } = await (supabase.from("profiles" as any)).select("nome, nickname").eq("user_id", targetUserId).maybeSingle();
  const { data: targetRole } = await supabase.from("user_roles").select("nivel").eq("user_id", targetUserId).maybeSingle();
  const { data: oldCustomRole } = await (supabase.from("custom_roles" as any)).select("nome").eq("id", targetRole?.nivel).maybeSingle();
  const { data: newCustomRole } = await (supabase.from("custom_roles" as any)).select("nome").eq("id", newLevel).maybeSingle();

  // 1. Tenta RPC set_member_level primeiro (Security Definer para bypass de RLS)
  const { error: rpcError } = await supabase.rpc("set_member_level", {
    _target_user: targetUserId,
    _nivel: newLevel,
  });

  // 2. Se a RPC falhou ou não existe, executa o upsert/update direto na tabela user_roles
  if (rpcError) {
    console.warn("RPC set_member_level falhou, tentando fallback direto...", rpcError);
    const { error: upsertError } = await (supabase.from("user_roles" as any))
      .upsert({
        user_id: targetUserId,
        nivel: newLevel,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.warn("Upsert direto em user_roles falhou, tentando update...", upsertError);
      await (supabase.from("user_roles" as any))
        .update({ nivel: newLevel, updated_at: new Date().toISOString() })
        .eq("user_id", targetUserId);
    }
  }

  // 3. Confirma se o cargo atualizado foi alterado com sucesso
  const { data: checkRole } = await supabase
    .from("user_roles")
    .select("nivel")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (checkRole?.nivel !== newLevel) {
    const { error: finalError } = await (supabase.from("user_roles" as any))
      .update({ nivel: newLevel, updated_at: new Date().toISOString() })
      .eq("user_id", targetUserId);

    if (finalError && checkRole?.nivel !== newLevel) {
      throw new Error(`Falha ao alterar o cargo do membro: ${finalError.message}`);
    }
  }

  const p = targetProfile as { nome?: string; nickname?: string } | null;
  const targetName = p ? (p.nickname || p.nome) : "Membro";
  const oldLevelLabel = (oldCustomRole as any)?.nome || LEVEL_LABEL[targetRole?.nivel as AppLevel] || targetRole?.nivel || "cargo anterior";
  const newLevelLabel = (newCustomRole as any)?.nome || LEVEL_LABEL[newLevel] || newLevel;

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

export async function logAuditAction(
  action: string,
  entity: string,
  newData?: any,
  oldData?: any,
  entityId?: string
): Promise<void> {
  let userId: string | null = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id || null;
  } catch (err) {}

  if (!userId) {
    userId = newData?.user_id || oldData?.user_id || newData?.target_id || null;
  }

  // Enrich new_data with _meta block (severity, user_agent, timestamp)
  const severity = classifySeverity(action);
  const enrichedNewData = {
    ...(newData || {}),
    _meta: {
      severity,
      user_agent: getBrowserUserAgent(),
      logged_at: new Date().toISOString(),
    },
  };

  try {
    // 1. Try SECURITY DEFINER RPC first
    const { error: rpcError } = await (supabase.rpc as any)("log_audit_action_rpc", {
      _action: action,
      _entity: entity,
      _new_data: enrichedNewData,
      _old_data: oldData || null,
      _entity_id: entityId || null,
    });

    if (rpcError) {
      // 2. Fallback to direct insert
      const { error } = await supabase.from("audit_logs").insert({
        user_id: userId,
        action,
        entity,
        entity_id: entityId || null,
        old_data: oldData || null,
        new_data: enrichedNewData,
        created_at: new Date().toISOString(),
      } as any);

      if (error) {
        console.error("Erro ao inserir log de auditoria:", error);
      }
    }
  } catch (err) {
    console.error("Exceção ao inserir log de auditoria:", err);
  }
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
  const { error: rpcErr } = await supabase.rpc("submit_signup_request", {
    _nome: payload.nome.trim(),
    _telefone: payload.telefone.trim(),
    _nickname: (payload.nickname?.trim() || null) as any,
    _game_id: payload.game_id.trim(),
  });

  if (rpcErr) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw rpcErr;
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
    if (upsertErr) throw upsertErr;
  }

  void logAuditAction("submit_signup", "signup_requests", {
    nome: payload.nome.trim(),
    nickname: payload.nickname?.trim() || null,
    telefone: payload.telefone.trim(),
    game_id: payload.game_id.trim(),
  });
}

export async function submitSignupReview({ data }: { data: { requestId: string; approve: boolean; nivel?: AppLevel; reason?: string } }): Promise<void> {
  const { data: requestData } = await (supabase.from("signup_requests" as any))
    .select("nome, nickname, user_id")
    .eq("id", data.requestId)
    .maybeSingle();

  const reqObj = requestData as { nome?: string; nickname?: string; user_id?: string } | null;
  const applicantName = reqObj ? (reqObj.nickname ? `${reqObj.nickname} (${reqObj.nome})` : reqObj.nome) : null;
  const targetId = reqObj?.user_id;

  const args: { _request_id: string; _approve: boolean; _nivel?: AppLevel; _reason?: string } = {
    _request_id: data.requestId,
    _approve: data.approve,
    _nivel: data.nivel || 'novato',
  };
  if (data.reason) args._reason = data.reason;
  const { error } = await supabase.rpc("review_signup_request", args);
  if (error && data.approve) throw error;

  if (data.approve) {
    void logAuditAction("approve_signup", "signup_requests", {
      request_id: data.requestId,
      target_id: targetId,
      nome: applicantName,
      nivel: data.nivel || "novato",
    });
  } else {
    // 1. Audit log entry is written first so history is preserved
    void logAuditAction("reject_signup", "signup_requests", {
      request_id: data.requestId,
      target_id: targetId,
      nome: applicantName,
      reason: data.reason || null,
    });

    // 2. Wipe user records completely upon rejection
    await (supabase.from("signup_requests" as any)).delete().eq("id", data.requestId);
    if (targetId) {
      await (supabase.from("signup_requests" as any)).delete().eq("user_id", targetId);
      await (supabase.from("profiles" as any)).delete().eq("user_id", targetId);
      await (supabase.from("user_roles" as any)).delete().eq("user_id", targetId);
      await (supabase.from("user_presence" as any)).delete().eq("user_id", targetId);
    }
  }
}

export async function getPendingSignupRequests(enabled?: boolean): Promise<PendingSignupRequest[]> {
  if (enabled === false) return [];
  const { data, error } = await (supabase.from("signup_requests" as any))
    .select("id, user_id, nome, nickname, telefone, game_id, requested_at, status, discord_id, discord_username, discord_avatar_url, discord_email")
    .eq("status", "pendente")
    .order("requested_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((d: any) => ({
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

export async function getAuditLogs(enabled?: boolean, offset = 0, limit = 500): Promise<AuditLog[]> {
  if (enabled === false) return [];
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, user_id, action, entity, entity_id, old_data, new_data, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data || []).map(d => {
    const nd = d.new_data as any;
    const meta = nd?._meta || {};
    return {
      id: d.id,
      user_id: d.user_id,
      action: d.action,
      entity: d.entity,
      entity_id: d.entity_id,
      old_data: d.old_data,
      new_data: d.new_data,
      created_at: String(d.created_at),
      severity: (meta.severity as AuditLog["severity"]) || classifySeverity(d.action),
      user_agent: meta.user_agent || undefined,
    };
  });
}

export async function getRolePermissions(): Promise<Record<AppLevel, Permission[]>> {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("level, nivel, permissions");
  
  if (error || !data) return {} as any;
  const map: Record<string, Permission[]> = {};
  data.forEach((row) => {
    const lvl = row.level || row.nivel;
    if (lvl) {
      map[lvl] = Array.isArray(row.permissions) ? (row.permissions as Permission[]) : [];
    }
  });
  return map as Record<AppLevel, Permission[]>;
}

export async function saveRolePermissions(level: AppLevel, permissions: Permission[]): Promise<void> {
  const { error: rpcErr } = await supabase.rpc("save_role_permissions", {
    _level: level,
    _permissions: permissions,
  });

  if (rpcErr) {
    const { error: upsertErr } = await supabase
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
    if (upsertErr) throw upsertErr;
  }

  void logAuditAction("save_role_permissions", "role_permissions", {
    level,
    level_label: LEVEL_LABEL[level] || level,
    permissions_count: permissions.length,
    permissions,
  });
}



export async function submitMovement({ data }: { data: { productId: string; type: "entrada" | "saida"; quantity: number; reason?: string; bauId?: string } }): Promise<{ success: boolean }> {
  const { data: bausData } = await supabase.from("baus").select("id, nome");
  const defaultBauId = (bausData || [])[0]?.id || null;

  const { data: prod } = await supabase.from("products").select("nome, estoque_atual, bau_id").eq("id", data.productId).maybeSingle();
  const bauIdToUse = data.bauId || prod?.bau_id || defaultBauId;
  const { data: bau } = bauIdToUse ? await supabase.from("baus").select("nome").eq("id", bauIdToUse).maybeSingle() : { data: null };

  const args: { 
    _product_id: string; 
    _type: "entrada" | "saida"; 
    _quantity: number; 
    _reason?: string;
    _bau_id?: string;
  } = {
    _product_id: data.productId,
    _type: data.type,
    _quantity: data.quantity,
  };

  const rawReason = data.reason?.trim() || "";
  if (rawReason) args._reason = rawReason;
  if (bauIdToUse) args._bau_id = bauIdToUse;

  const currentDbStock = prod ? Number(prod.estoque_atual) : 0;
  const prevBalance = currentDbStock;
  const newBalance = data.type === "entrada" ? prevBalance + data.quantity : prevBalance - data.quantity;

  const { data: newMovementId, error } = await supabase.rpc("register_movement", args);
  if (error) throw error;

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
      reason: rawReason || "Sem observação",
    },
    undefined,
    data.productId
  );

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

  const [fromBauRes, toBauRes, prodRes] = await Promise.all([
    supabase.from("baus").select("nome").eq("id", payload.fromBauId).maybeSingle(),
    supabase.from("baus").select("nome").eq("id", payload.toBauId).maybeSingle(),
    supabase.from("products").select("nome").eq("id", payload.productId).maybeSingle(),
  ]);

  const fromBauName = fromBauRes.data?.nome || "Baú";
  const toBauName = toBauRes.data?.nome || "Baú";
  const prodName = prodRes.data?.nome || "Produto";
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
  const { data: oldMov } = await supabase.from("stock_movements").select("product_id, type, quantity, reason, bau_id").eq("id", movementId).maybeSingle();
  let prodName = "Produto";
  if (oldMov?.product_id) {
    const { data: prod } = await supabase.from("products").select("nome").eq("id", oldMov.product_id).maybeSingle();
    prodName = prod?.nome || "Produto";
  }

  const rawReason = reason?.trim() || "Estorno de movimentação";
  const args: { _movement_id: string; _reason?: string } = {
    _movement_id: movementId,
    _reason: rawReason,
  };
  const { error } = await supabase.rpc("reverse_movement", args);
  if (error) throw error;

  void logAuditAction("reverse_movement", "stock_movements", {
    movement_id: movementId,
    product_name: prodName,
    original_type: oldMov?.type || "desconhecido",
    original_quantity: oldMov?.quantity,
    reason: reason || "Sem motivo informado",
  }, undefined, movementId);
}

export async function submitSale({ data }: { data: { productId: string; quantity: number; unitPrice: number; buyerName: string; paymentMethod: string; notes?: string } }): Promise<{ success: boolean }> {
  const { data: prod } = await supabase.from("products").select("nome").eq("id", data.productId).maybeSingle();
  const totalPrice = data.quantity * data.unitPrice;

  const args: { _product_id: string; _quantity: number; _unit_price: number; _buyer_name: string; _payment_method?: string; _notes?: string } = {
    _product_id: data.productId,
    _quantity: data.quantity,
    _unit_price: data.unitPrice,
    _buyer_name: data.buyerName,
    _payment_method: data.paymentMethod || 'dinheiro',
  };
  if (data.notes) args._notes = data.notes;
  const { error } = await supabase.rpc("create_sale", args);
  if (error) throw error;

  void logAuditAction(
    "create_sale",
    "sales",
    {
      product_id: data.productId,
      product_name: prod?.nome || "Produto",
      quantity: data.quantity,
      unit_price: data.unitPrice,
      total_price: totalPrice,
      buyer_name: data.buyerName,
      payment_method: data.paymentMethod || "dinheiro",
      notes: data.notes || null,
    },
    undefined,
    data.productId
  );

  return { success: true };
}

export async function reverseSale(saleId: string, reason?: string): Promise<void> {
  const { data: oldSale } = await supabase.from("sales").select("product_id, quantity, total_price, buyer_name").eq("id", saleId).maybeSingle();
  let prodName = "Produto";
  if (oldSale?.product_id) {
    const { data: prod } = await supabase.from("products").select("nome").eq("id", oldSale.product_id).maybeSingle();
    prodName = prod?.nome || "Produto";
  }

  const args: { _sale_id: string; _reason?: string } = {
    _sale_id: saleId,
  };
  if (reason) args._reason = reason;
  const { error } = await supabase.rpc("reverse_sale", args);
  if (error) throw error;

  void logAuditAction("reverse_sale", "sales", {
    sale_id: saleId,
    product_name: prodName,
    quantity: oldSale?.quantity,
    total_price: oldSale?.total_price,
    buyer_name: oldSale?.buyer_name,
    reason: reason || "Sem motivo informado",
  }, undefined, saleId);
}

export async function uploadProductImage(file: File): Promise<string> {
  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    throw new Error("A imagem selecionada ultrapassa o limite de 5MB.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const cleanExt = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext) ? ext : "png";
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
  const fileName = `item_${Date.now()}_${sanitizedName}`;

  const { data, error } = await supabase.storage.from("products").upload(fileName, file, {
    cacheControl: "31536000",
    upsert: true,
    contentType: file.type || `image/${cleanExt}`,
  });

  if (error) {
    throw new Error(`Falha ao fazer upload da imagem: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}

export async function createProduct(payload: { nome: string; descricao?: string; categoria_id?: string; bau_id?: string; unidade?: string; estoque_minimo?: number; preco_sugerido?: number; imagem_url?: string }): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      nome: payload.nome.trim(),
      descricao: payload.descricao?.trim() || null,
      categoria_id: payload.categoria_id || null,
      bau_id: payload.bau_id || null,
      unidade: payload.unidade || 'un',
      estoque_minimo: payload.estoque_minimo || 0,
      preco_sugerido: payload.preco_sugerido || 0,
      imagem_url: payload.imagem_url?.trim() || null,
      ativo: true
    })
    .select()
    .single();
  if (error) throw error;

  void logAuditAction("create_product", "products", { nome: data.nome, preco: data.preco_sugerido, estoque_minimo: data.estoque_minimo, imagem_url: data.imagem_url }, undefined, data.id);

  return {
    id: data.id,
    nome: data.nome,
    descricao: data.descricao,
    categoria_id: data.categoria_id,
    bau_id: data.bau_id,
    unidade: data.unidade,
    estoque_atual: Number(data.estoque_atual),
    estoque_minimo: Number(data.estoque_minimo),
    preco_sugerido: Number(data.preco_sugerido),
    imagem_url: data.imagem_url || null,
    ativo: data.ativo,
    created_at: String(data.created_at),
    updated_at: String(data.updated_at)
  };
}

export async function updateProduct(payload: { id: string; nome?: string; descricao?: string; categoria_id?: string | null; bau_id?: string | null; unidade?: string; estoque_minimo?: number; preco_sugerido?: number; imagem_url?: string | null; ativo?: boolean }): Promise<void> {
  const { data: oldProd } = await supabase.from("products").select("nome, descricao, preco_sugerido, estoque_minimo, imagem_url, ativo").eq("id", payload.id).maybeSingle();

  const updates: any = {};
  if (payload.nome !== undefined) updates.nome = payload.nome.trim();
  if (payload.descricao !== undefined) updates.descricao = payload.descricao.trim();
  if (payload.categoria_id !== undefined) updates.categoria_id = payload.categoria_id;
  if (payload.bau_id !== undefined) updates.bau_id = payload.bau_id;
  if (payload.unidade !== undefined) updates.unidade = payload.unidade;
  if (payload.estoque_minimo !== undefined) updates.estoque_minimo = payload.estoque_minimo;
  if (payload.preco_sugerido !== undefined) updates.preco_sugerido = payload.preco_sugerido;
  if (payload.imagem_url !== undefined) updates.imagem_url = payload.imagem_url ? payload.imagem_url.trim() : null;
  if (payload.ativo !== undefined) updates.ativo = payload.ativo;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("products").update(updates).eq("id", payload.id).select();
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Não foi possível atualizar o produto.");
  }

  void logAuditAction("update_product", "products", { id: payload.id, ...updates }, oldProd || undefined, payload.id);
}

export async function deleteProduct(id: string): Promise<void> {
  const { data: oldProd } = await supabase.from("products").select("nome").eq("id", id).maybeSingle();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;

  void logAuditAction("delete_product", "products", { id, nome: oldProd?.nome }, undefined, id);
}

export async function createCategory(payload: { nome: string; descricao?: string }): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({
      nome: payload.nome.trim(),
      descricao: payload.descricao?.trim() || null,
      ativo: true
    })
    .select()
    .single();
  if (error) throw error;

  void logAuditAction("create_category", "categories", { nome: data.nome, descricao: data.descricao }, undefined, data.id);

  return {
    id: data.id,
    nome: data.nome,
    descricao: data.descricao,
    ativo: data.ativo,
    created_at: String(data.created_at)
  };
}

export async function updateCategory(payload: { id: string; nome?: string; descricao?: string; ativo?: boolean }): Promise<void> {
  const { data: oldCat } = await supabase.from("categories").select("nome, descricao, ativo").eq("id", payload.id).maybeSingle();

  const updates: any = {};
  if (payload.nome !== undefined) updates.nome = payload.nome.trim();
  if (payload.descricao !== undefined) updates.descricao = payload.descricao.trim();
  if (payload.ativo !== undefined) updates.ativo = payload.ativo;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("categories").update(updates).eq("id", payload.id).select();
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Não foi possível atualizar a categoria.");
  }

  void logAuditAction("update_category", "categories", { id: payload.id, ...updates }, oldCat || undefined, payload.id);
}

export async function deleteCategory(id: string): Promise<void> {
  const { data: oldCat } = await supabase.from("categories").select("nome").eq("id", id).maybeSingle();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;

  void logAuditAction("delete_category", "categories", { id, nome: oldCat?.nome }, undefined, id);
}

export async function createGoal(payload: { user_id: string; type: "vendas" | "faturamento" | "quantidade"; target_value: number; period_start: string; period_end: string; descricao?: string }): Promise<Goal> {
  const { data: targetProfile } = await (supabase.from("profiles" as any))
    .select("nome, nickname")
    .eq("user_id", payload.user_id)
    .maybeSingle();
  const tP = targetProfile as any;
  const targetName = tP ? (tP.nickname || tP.nome || "Membro") : "Membro";

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: payload.user_id,
      type: payload.type,
      target_value: payload.target_value,
      period_start: payload.period_start,
      period_end: payload.period_end,
      descricao: payload.descricao?.trim() || null
    })
    .select()
    .single();
  if (error) throw error;

  const typeLabel = payload.type === "vendas" ? "Vendas" : payload.type === "faturamento" ? "Faturamento" : "Quantidade";
  void logAuditAction("create_goal", "goals", {
    target_name: targetName,
    goal_type: typeLabel,
    target_value: payload.target_value,
    period_start: payload.period_start,
    period_end: payload.period_end,
    descricao: payload.descricao || null,
  }, undefined, data.id);

  return {
    id: data.id,
    user_id: data.user_id,
    type: data.type as any,
    target_value: Number(data.target_value),
    period_start: String(data.period_start),
    period_end: String(data.period_end),
    descricao: data.descricao,
    created_at: String(data.created_at)
  };
}

export async function deleteGoal(id: string): Promise<void> {
  const { data: oldGoal } = await supabase.from("goals").select("user_id, type, target_value, period_start, period_end, descricao").eq("id", id).maybeSingle();
  let targetName = "Membro";
  if (oldGoal?.user_id) {
    const { data: prof } = await (supabase.from("profiles" as any)).select("nome, nickname").eq("user_id", oldGoal.user_id).maybeSingle();
    const p = prof as any;
    targetName = p ? (p.nickname || p.nome || "Membro") : "Membro";
  }
  const typeLabel = oldGoal?.type === "vendas" ? "Vendas" : oldGoal?.type === "faturamento" ? "Faturamento" : "Quantidade";

  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;

  void logAuditAction("delete_goal", "goals", {
    target_name: targetName,
    goal_type: typeLabel,
    target_value: oldGoal?.target_value,
    period_start: oldGoal?.period_start,
    period_end: oldGoal?.period_end,
    descricao: oldGoal?.descricao || null,
  }, undefined, id);
}

/* ==========================================================================
   FUNDO DE CAIXA GERAL (CASH FUND API)
   ========================================================================== */

export async function getCashMovements(): Promise<CashMovement[]> {
  const { data, error } = await (supabase.from("cash_fund_movements" as any))
    .select("id, user_id, type, amount, motive, notes, status, previous_balance, resulting_balance, reversal_of, created_at");

  if (error) throw error;

  const { data: profiles } = await (supabase.from("profiles" as any))
    .select("user_id, nome, nickname, discord_avatar_url, avatar_url");

  const profileMap = new Map<string, { name: string; avatar: string | null }>();
  (profiles || []).forEach((p: any) => {
    profileMap.set(p.user_id, {
      name: p.nickname || p.nome || "Membro",
      avatar: p.discord_avatar_url || p.avatar_url || null,
    });
  });

  // Ordenação cronológica ascendente para cálculo exato e consistente do saldo acumulado
  const sortedAsc = [...(data || [])].sort((a: any, b: any) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (diff !== 0) return diff;
    return String(a.id).localeCompare(String(b.id));
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
  const { error } = await (supabase.rpc as any)("register_cash_movement", {
    _type: payload.type,
    _amount: payload.amount,
    _motive: payload.motive.trim(),
    _notes: payload.notes?.trim() || null,
  });

  if (error) throw error;

  void logAuditAction("create_cash_movement", "cash_fund_movements", {
    type: payload.type,
    amount: payload.amount,
    motive: payload.motive.trim(),
    notes: payload.notes?.trim() || null,
  });
}

export async function reverseCashMovement(movementId: string, reason?: string | undefined): Promise<void> {
  const { data: oldMov } = await (supabase.from("cash_fund_movements" as any))
    .select("type, amount, motive")
    .eq("id", movementId)
    .maybeSingle();

  const { error } = await (supabase.rpc as any)("reverse_cash_movement", {
    _movement_id: movementId,
    _reason: reason?.trim() || null,
  });

  if (error) throw error;

  const oldM = oldMov as any;
  void logAuditAction("reverse_cash_movement", "cash_fund_movements", {
    movement_id: movementId,
    original_type: oldM?.type || "desconhecido",
    amount: oldM?.amount,
    original_motive: oldM?.motive || null,
    reason: reason?.trim() || "Sem motivo informado",
  }, undefined, movementId);
}

export async function deleteCashMovement(movementId: string): Promise<void> {
  const { data: oldMov } = await (supabase.from("cash_fund_movements" as any))
    .select("type, amount, motive")
    .eq("id", movementId)
    .maybeSingle();

  const { error } = await (supabase.rpc as any)("delete_cash_movement", {
    _movement_id: movementId,
  });

  if (error) throw error;

  const oldM = oldMov as any;
  void logAuditAction("delete_cash_movement", "cash_fund_movements", {
    movement_id: movementId,
    type: oldM?.type || "desconhecido",
    amount: oldM?.amount,
    motive: oldM?.motive || null,
  }, undefined, movementId);
}

/* ==========================================================================
   GERENCIAMENTO DE CARGOS E PERMISSÕES GRANULARES (CUSTOM ROLES API)
   ========================================================================== */

export async function getCustomRoles(): Promise<CustomRole[]> {
  const { data, error } = await (supabase.from("custom_roles" as any))
    .select("id, nome, descricao, rank, is_system, module_permissions, created_at, updated_at")
    .order("rank", { ascending: false });

  if (error) throw error;

  return (data || []).map((d: any) => ({
    id: String(d.id),
    nome: String(d.nome),
    descricao: d.descricao ? String(d.descricao) : null,
    rank: Number(d.rank),
    is_system: Boolean(d.is_system),
    module_permissions: (d.module_permissions || {}) as Record<SystemModule, ModuleAccessLevel>,
    created_at: String(d.created_at),
    updated_at: String(d.updated_at),
  }));
}

export async function saveCustomRole(payload: {
  id: string;
  nome: string;
  descricao?: string | undefined;
  rank?: number | undefined;
  module_permissions: Partial<Record<SystemModule, ModuleAccessLevel>>;
}): Promise<void> {
  const { error } = await (supabase.rpc as any)("save_custom_role", {
    _id: payload.id,
    _nome: payload.nome.trim(),
    _descricao: payload.descricao?.trim() || null,
    _rank: payload.rank || 1,
    _module_permissions: payload.module_permissions,
  });

  if (error) throw error;

  void logAuditAction("save_custom_role", "custom_roles", {
    nome: payload.nome.trim(),
    descricao: payload.descricao?.trim() || null,
    rank: payload.rank || 1,
    module_permissions: payload.module_permissions,
  }, undefined, payload.id);
}

export async function deleteCustomRole(roleId: string): Promise<void> {
  const { data: oldRole } = await (supabase.from("custom_roles" as any))
    .select("nome, rank")
    .eq("id", roleId)
    .maybeSingle();

  const { error } = await (supabase.rpc as any)("delete_custom_role", {
    _role_id: roleId,
  });

  if (error) throw error;

  const r = oldRole as any;
  void logAuditAction("delete_custom_role", "custom_roles", {
    nome: r?.nome || "Cargo",
    rank: r?.rank,
  }, undefined, roleId);
}

export async function reorderCustomRoles(orderedIds: string[]): Promise<void> {
  const { error } = await (supabase.rpc as any)("reorder_custom_roles", {
    _ordered_ids: orderedIds,
  });

  if (error) throw error;

  void logAuditAction("reorder_custom_roles", "custom_roles", {
    total_reordered: orderedIds.length,
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   ABSENCES / LICENÇAS MANAGEMENT
   ══════════════════════════════════════════════════════════════════════════ */
const ABSENCES_STORAGE_KEY = "tw_absences_v1";
const ABSENCES_DB_LEVEL = "system_absences_list";

function getLocalAbsences(): MemberAbsence[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(ABSENCES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalAbsences(absences: MemberAbsence[]): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(ABSENCES_STORAGE_KEY, JSON.stringify(absences));
      window.dispatchEvent(new CustomEvent("tw_absences_updated"));
    }
  } catch {}
}

export async function getAbsences(): Promise<MemberAbsence[]> {
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", ABSENCES_DB_LEVEL)
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      const parsed = data.permissions as any;
      if (Array.isArray(parsed.absences)) {
        setLocalAbsences(parsed.absences);
        return parsed.absences;
      }
    }
  } catch (err) {
    console.warn("Erro ao carregar ausências do banco:", err);
  }
  return getLocalAbsences();
}

export async function createAbsence(payload: CreateAbsencePayload): Promise<MemberAbsence> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuário não autenticado");

  // Fetch current user's profile and role
  const { data: profileRow } = await (supabase.from("profiles" as any))
    .select("nome, nickname, avatar_url, discord_avatar_url")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("nivel")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const p = profileRow as any;
  const memberName = p?.nome || "Membro";
  const memberNickname = p?.nickname || null;
  const memberAvatar = p?.discord_avatar_url || p?.avatar_url || null;
  const memberRole = (roleRow?.nivel as AppLevel) || "membro";

  // Calculate days count
  const start = new Date(payload.start_date);
  const end = new Date(payload.end_date);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const daysCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const newAbsence: MemberAbsence = {
    id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: session.user.id,
    member_name: memberName,
    member_nickname: memberNickname,
    member_role: memberRole,
    member_avatar: memberAvatar,
    start_date: payload.start_date,
    end_date: payload.end_date,
    days_count: daysCount,
    reason: payload.reason,
    reason_details: payload.reason_details?.trim() || null,
    status: "pendente",
    created_at: new Date().toISOString(),
  };

  const currentList = await getAbsences();
  const updatedList = [newAbsence, ...currentList.filter((a) => a.id !== newAbsence.id)];

  setLocalAbsences(updatedList);

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: ABSENCES_DB_LEVEL,
        nivel: ABSENCES_DB_LEVEL,
        permissions: { absences: updatedList } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.error("Erro ao sincronizar ausência no banco:", err);
  }

  void logAuditAction(
    "create_absence",
    "absences",
    {
      member_name: memberName,
      start_date: payload.start_date,
      end_date: payload.end_date,
      days: daysCount,
      reason: payload.reason,
    },
    undefined,
    newAbsence.id
  );

  return newAbsence;
}

export async function reviewAbsence(
  absenceId: string,
  payload: { status: "aprovado" | "rejeitado"; review_notes?: string }
): Promise<MemberAbsence> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuário não autenticado");

  const { data: reviewerProfile } = await (supabase.from("profiles" as any))
    .select("nome, nickname")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const rev = reviewerProfile as any;
  const reviewerName = rev?.nickname || rev?.nome || "Liderança";

  const currentList = await getAbsences();
  const targetIndex = currentList.findIndex((a) => a.id === absenceId);
  if (targetIndex === -1) throw new Error("Solicitação de ausência não encontrada.");

  const target = currentList[targetIndex];
  const updatedAbsence: MemberAbsence = {
    ...target,
    status: payload.status,
    reviewed_by: session.user.id,
    reviewed_by_name: reviewerName,
    reviewed_at: new Date().toISOString(),
    review_notes: payload.review_notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const updatedList = [...currentList];
  updatedList[targetIndex] = updatedAbsence;

  setLocalAbsences(updatedList);

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: ABSENCES_DB_LEVEL,
        nivel: ABSENCES_DB_LEVEL,
        permissions: { absences: updatedList } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.error("Erro ao salvar revisão de ausência no banco:", err);
  }

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

  return updatedAbsence;
}

export async function cancelAbsence(absenceId: string): Promise<void> {
  const currentList = await getAbsences();
  const target = currentList.find((a) => a.id === absenceId);
  if (!target) return;

  const updatedList = currentList.map((a) =>
    a.id === absenceId ? { ...a, status: "cancelada" as const, updated_at: new Date().toISOString() } : a
  );

  setLocalAbsences(updatedList);

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: ABSENCES_DB_LEVEL,
        nivel: ABSENCES_DB_LEVEL,
        permissions: { absences: updatedList } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch {}

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

  setLocalAbsences(updatedList);

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: ABSENCES_DB_LEVEL,
        nivel: ABSENCES_DB_LEVEL,
        permissions: { absences: updatedList } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch {}

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

function setLocalWeeklyGoals(goals: WeeklyGoal[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WEEKLY_GOALS_STORAGE_KEY, JSON.stringify(goals));
    window.dispatchEvent(new CustomEvent("tw_weekly_goals_updated"));
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

function setLocalGoalSubmissions(submissions: GoalSubmission[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GOAL_SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
    window.dispatchEvent(new CustomEvent("tw_goal_submissions_updated"));
  } catch {}
}

export async function getWeeklyGoals(): Promise<WeeklyGoal[]> {
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", WEEKLY_GOALS_DB_LEVEL)
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      const parsed = data.permissions as any;
      if (Array.isArray(parsed.goals)) {
        setLocalWeeklyGoals(parsed.goals);
        return parsed.goals;
      }
    }
  } catch (err) {
    console.warn("Erro ao carregar metas semanais do banco:", err);
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
  setLocalWeeklyGoals(initialList);
  return initialList;
}

export async function createWeeklyGoal(payload: CreateWeeklyGoalPayload): Promise<WeeklyGoal> {
  const { data: { session } } = await supabase.auth.getSession();
  
  let creatorName = "Liderança";
  if (session?.user?.id) {
    const { data: profileRow } = await (supabase.from("profiles" as any))
      .select("nome, nickname")
      .eq("user_id", session.user.id)
      .maybeSingle();
    const p = profileRow as any;
    if (p) creatorName = p.nickname || p.nome || "Liderança";
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
    created_by: session?.user?.id,
    created_by_name: creatorName,
    created_at: new Date().toISOString(),
  };

  const currentList = await getWeeklyGoals();
  const updatedList = [newGoal, ...currentList.filter((g) => g.id !== newGoal.id)];
  setLocalWeeklyGoals(updatedList);

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: WEEKLY_GOALS_DB_LEVEL,
        nivel: WEEKLY_GOALS_DB_LEVEL,
        permissions: { goals: updatedList } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.warn("Erro ao salvar meta semanal no banco:", err);
  }

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
  setLocalWeeklyGoals(updatedList);

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: WEEKLY_GOALS_DB_LEVEL,
        nivel: WEEKLY_GOALS_DB_LEVEL,
        permissions: { goals: updatedList } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch {}

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

  setLocalWeeklyGoals(updatedList);

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: WEEKLY_GOALS_DB_LEVEL,
        nivel: WEEKLY_GOALS_DB_LEVEL,
        permissions: { goals: updatedList } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch {}

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
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", GOAL_SUBMISSIONS_DB_LEVEL)
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      const parsed = data.permissions as any;
      if (Array.isArray(parsed.submissions)) {
        setLocalGoalSubmissions(parsed.submissions);
        return parsed.submissions;
      }
    }
  } catch (err) {
    console.warn("Erro ao carregar entregas de metas do banco:", err);
  }
  return getLocalGoalSubmissions();
}

export async function submitGoalDelivery(payload: SubmitGoalPayload): Promise<GoalSubmission> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Usuário não autenticado.");

  // Membro que está entregando
  const { data: profileRow } = await (supabase.from("profiles" as any))
    .select("nome, nickname, avatar_url, discord_avatar_url")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("nivel")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const p = profileRow as any;
  const memberName = p?.nome || "Membro";
  const memberNickname = p?.nickname || null;
  const memberAvatar = p?.discord_avatar_url || p?.avatar_url || null;
  const memberRole = (roleRow?.nivel as AppLevel) || "membro";

  // Membro recebedor
  const { data: receiverProfileRow } = await (supabase.from("profiles" as any))
    .select("nome, nickname, avatar_url, discord_avatar_url")
    .eq("user_id", payload.receiver_id)
    .maybeSingle();

  const { data: receiverRoleRow } = await supabase
    .from("user_roles")
    .select("nivel")
    .eq("user_id", payload.receiver_id)
    .maybeSingle();

  const rp = receiverProfileRow as any;
  const receiverName = rp?.nickname || rp?.nome || "Membro da Liderança";
  const receiverAvatar = rp?.discord_avatar_url || rp?.avatar_url || null;
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
  setLocalGoalSubmissions(updatedList);

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: GOAL_SUBMISSIONS_DB_LEVEL,
        nivel: GOAL_SUBMISSIONS_DB_LEVEL,
        permissions: { submissions: updatedList } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.warn("Erro ao sincronizar entrega de meta no banco:", err);
  }

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

  return newSubmission;
}

export async function reviewGoalSubmission(
  submissionId: string,
  payload: { status: "aprovado" | "rejeitado"; review_notes?: string }
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

  const updated: GoalSubmission = {
    ...target,
    status: payload.status,
    reviewed_by: session?.user?.id || null,
    reviewed_by_name: reviewerName,
    reviewed_at: new Date().toISOString(),
    review_notes: payload.review_notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const updatedList = currentList.map((s) => (s.id === submissionId ? updated : s));
  setLocalGoalSubmissions(updatedList);

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: GOAL_SUBMISSIONS_DB_LEVEL,
        nivel: GOAL_SUBMISSIONS_DB_LEVEL,
        permissions: { submissions: updatedList } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.warn("Erro ao salvar revisão de entrega no banco:", err);
  }

  void logAuditAction(
    payload.status === "aprovado" ? "approve_goal_delivery" : "reject_goal_delivery",
    "goals",
    {
      goal_title: target.goal_title,
      member_name: target.member_name,
      amount: target.amount,
      reviewed_by: reviewerName,
      review_notes: payload.review_notes || null,
    },
    undefined,
    submissionId
  );

  return updated;
}

export async function deleteGoalSubmission(submissionId: string): Promise<void> {
  const currentList = await getGoalSubmissions();
  const target = currentList.find((s) => s.id === submissionId);
  const updatedList = currentList.filter((s) => s.id !== submissionId);

  setLocalGoalSubmissions(updatedList);

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: GOAL_SUBMISSIONS_DB_LEVEL,
        nivel: GOAL_SUBMISSIONS_DB_LEVEL,
        permissions: { submissions: updatedList } as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch {}

  if (target) {
    void logAuditAction(
      "delete_goal_submission",
      "goals",
      {
        goal_title: target.goal_title,
        member_name: target.member_name,
        amount: target.amount,
      },
      undefined,
      submissionId
    );
  }
}
