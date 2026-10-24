import { supabase } from "@/integrations/supabase/client";

export interface CustomRequirementItem {
  id: string;
  title: string;
  description: string;
  is_required: boolean;
  type?: "boolean" | "number" | "text";
  min_value?: number;
}

export interface VerificationRequirementsConfig {
  require_discord: boolean;
  require_game_id: boolean;
  require_phone?: boolean;
  min_days_in_faction?: number;
  min_gamification_level?: number;
  allowed_roles?: string[];
  allowed_tags?: string[];
  custom_instructions?: string;
  custom_requirements?: CustomRequirementItem[];
}

export interface VerificationBadgeConfig {
  id: string;
  is_enabled: boolean;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_color: string;
  glow_style: "cyan" | "gold" | "emerald" | "purple" | "rose" | "none" | string;
  tooltip_text: string;
  requirements_config: VerificationRequirementsConfig;
  authorized_roles: string[];
  authorized_tags: string[];
  allow_self_request: boolean;
  created_at?: string;
  updated_at?: string;
}

export type VerificationRequestStatus = "pendente" | "aprovado" | "rejeitado" | "cancelado" | "revogado";

export interface VerificationRequest {
  id: string;
  user_id: string;
  status: VerificationRequestStatus;
  reason: string;
  document_url?: string | null;
  extra_data: Record<string, any>;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joined member profile data
  member?: {
    nome: string;
    nickname?: string | null;
    avatar_url?: string | null;
    discord_username?: string | null;
    discord_avatar_url?: string | null;
    game_id?: string | null;
    telefone?: string | null;
    nivel?: string | null;
  };
  reviewer?: {
    nome: string;
    nickname?: string | null;
  };
}

export interface MemberVerification {
  id: string;
  user_id: string;
  is_verified: boolean;
  verified_at: string;
  verified_by?: string | null;
  request_id?: string | null;
  custom_title?: string | null;
  badge_color_override?: string | null;
  badge_icon_override?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  member?: {
    nome: string;
    nickname?: string | null;
    avatar_url?: string | null;
    discord_username?: string | null;
    discord_avatar_url?: string | null;
    game_id?: string | null;
    telefone?: string | null;
    nivel?: string | null;
  };
  verifier?: {
    nome: string;
    nickname?: string | null;
  };
}

export interface VerificationAuditLog {
  id: string;
  action: string;
  target_user_id?: string | null;
  performed_by?: string | null;
  details: Record<string, any>;
  created_at: string;
  target_member?: {
    nome: string;
    nickname?: string | null;
  };
  performer_member?: {
    nome: string;
    nickname?: string | null;
  };
}

export const DEFAULT_VERIFICATION_CONFIG: VerificationBadgeConfig = {
  id: "default",
  is_enabled: true,
  badge_name: "Verificado",
  badge_description: "Selo oficial de membro verificado e autenticado pela liderança.",
  badge_icon: "BadgeCheck",
  badge_color: "#38bdf8",
  glow_style: "cyan",
  tooltip_text: "Membro Oficial Verificado",
  requirements_config: {
    require_discord: true,
    require_game_id: true,
    require_phone: false,
    min_days_in_faction: 0,
    min_gamification_level: 0,
    allowed_roles: [],
    allowed_tags: [],
    custom_instructions: "Preencha a justificativa detalhada para análise da liderança.",
  },
  authorized_roles: ["ceo", "desenvolvedor", "01", "02", "gerente"],
  authorized_tags: [],
  allow_self_request: true,
};

export async function fetchVerificationConfig(): Promise<VerificationBadgeConfig> {
  // 1. Tenta carregar do Supabase
  try {
    const { data, error } = await supabase
      .from("verification_badge_config" as any)
      .select("*")
      .eq("id", "default")
      .maybeSingle();

    if (!error && data) {
      const merged: VerificationBadgeConfig = {
        ...DEFAULT_VERIFICATION_CONFIG,
        ...(data as any),
        requirements_config: {
          ...DEFAULT_VERIFICATION_CONFIG.requirements_config,
          ...((data as any).requirements_config || {}),
        },
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tw_verification_badge_config", JSON.stringify(merged));
        } catch {}
      }
      return merged;
    }
  } catch {}

  // 2. Fallback Firebase RTDB
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const rtdbConfig = await rtdb.get<any>("verification_badge_config/default");
    if (rtdbConfig) {
      const merged: VerificationBadgeConfig = {
        ...DEFAULT_VERIFICATION_CONFIG,
        ...rtdbConfig,
        requirements_config: {
          ...DEFAULT_VERIFICATION_CONFIG.requirements_config,
          ...(rtdbConfig.requirements_config || {}),
        },
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tw_verification_badge_config", JSON.stringify(merged));
        } catch {}
      }
      return merged;
    }
  } catch {}

  // 3. Fallback LocalStorage Cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("tw_verification_badge_config");
      if (cached) {
        return { ...DEFAULT_VERIFICATION_CONFIG, ...JSON.parse(cached) };
      }
    } catch {}
  }

  return DEFAULT_VERIFICATION_CONFIG;
}

/**
 * Atualiza a configuração do Selo de Verificado (CEO / Autorizado)
 */
export async function updateVerificationConfig(
  config: Partial<VerificationBadgeConfig>
): Promise<VerificationBadgeConfig> {
  const payload = {
    ...config,
    id: "default",
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("verification_badge_config" as any)
      .upsert(payload as any, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("Aviso ao salvar config de selo no Supabase, tentando RTDB:", error.message);
    }
  } catch (err) {
    console.warn("Erro ao salvar config no Supabase:", err);
  }

  // Sincroniza sempre no Firebase RTDB como garantia
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set("verification_badge_config/default", payload);
  } catch (err) {
    console.warn("Erro ao salvar config no RTDB:", err);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("tw_verification_badge_config", JSON.stringify({ ...DEFAULT_VERIFICATION_CONFIG, ...payload }));
    } catch {}
    window.dispatchEvent(new CustomEvent("tw_verification_config_updated"));
  }

  return { ...DEFAULT_VERIFICATION_CONFIG, ...payload } as VerificationBadgeConfig;
}

/**
 * Busca todas as solicitações de verificação (com perfis dos membros)
 */
export async function fetchVerificationRequests(statusFilter?: string): Promise<VerificationRequest[]> {
  let requests: any[] = [];
  try {
    let query = supabase
      .from("verification_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      requests = data;
    }
  } catch (err) {
    console.error("Erro ao buscar solicitações de verificação no Supabase:", err);
  }

  // Fallback RTDB se necessário
  if (requests.length === 0) {
    try {
      const { rtdb } = await import("@/integrations/firebase/rtdb");
      const rtdbList = await rtdb.getList<any>("verification_requests");
      if (rtdbList && rtdbList.length > 0) {
        requests = rtdbList.sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        if (statusFilter && statusFilter !== "all") {
          requests = requests.filter((r) => r.status === statusFilter);
        }
      }
    } catch {}
  }

  if (!requests || requests.length === 0) return [];

  // Busca todos os user_ids envolvidos para preencher os dados de perfil
  const userIds = Array.from(new Set(requests.map((r: any) => r.user_id).filter(Boolean)));
  const reviewerIds = Array.from(new Set(requests.map((r: any) => r.reviewed_by).filter(Boolean)));
  const allUserIds = Array.from(new Set([...userIds, ...reviewerIds]));

  const profilesMap: Record<string, any> = {};
  if (allUserIds.length > 0) {
    try {
      const { data: profiles } = await (supabase.from("profiles") as any)
        .select("id, user_id, nome, nickname, avatar_url, discord_username, discord_avatar_url, game_id, telefone")
        .in("user_id", allUserIds);

      if (profiles) {
        for (const p of profiles) {
          if (p.user_id) profilesMap[p.user_id] = p;
          if (p.id) profilesMap[p.id] = p;
        }
      }
    } catch {}

    // Fallback perfis do RTDB caso algum profile não tenha vindo
    const missingIds = allUserIds.filter((id) => !profilesMap[id]);
    if (missingIds.length > 0) {
      try {
        const { rtdb } = await import("@/integrations/firebase/rtdb");
        const fbProfiles = await rtdb.getList<any>("profiles");
        for (const p of fbProfiles) {
          if (p.user_id && !profilesMap[p.user_id]) profilesMap[p.user_id] = p;
          if (p.id && !profilesMap[p.id]) profilesMap[p.id] = p;
        }
      } catch {}
    }
  }

  return requests.map((req: any) => ({
    ...req,
    member: profilesMap[req.user_id] || null,
    reviewer: req.reviewed_by ? profilesMap[req.reviewed_by] || null : null,
  })) as unknown as VerificationRequest[];
}

/**
 * Busca a solicitação ativa/recente do membro logado
 */
export async function fetchMyVerificationRequest(): Promise<VerificationRequest | null> {
  let userId: string | null = null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    userId = user.id;
  } else if (typeof window !== "undefined") {
    try {
      const sim = sessionStorage.getItem("tw_dev_impersonate") || localStorage.getItem("tw_dev_impersonate");
      if (sim) {
        const parsed = JSON.parse(sim);
        userId = parsed.user_id || parsed.id;
      }
    } catch {}
  }

  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("verification_requests" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as unknown as VerificationRequest;
  } catch {}

  // Fallback RTDB
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const list = await rtdb.getList<any>("verification_requests");
    const myReq = list
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
    if (myReq) return myReq as VerificationRequest;
  } catch {}

  return null;
}

/**
 * Envia uma solicitação de verificação
 */
export async function submitVerificationRequest(params: {
  reason: string;
  document_url?: string | null;
  extra_data?: Record<string, any>;
}): Promise<{ success: boolean; request_id: string }> {
  let userId: string | null = null;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    userId = user.id;
  } else if (typeof window !== "undefined") {
    try {
      const sim = sessionStorage.getItem("tw_dev_impersonate") || localStorage.getItem("tw_dev_impersonate");
      if (sim) {
        const parsed = JSON.parse(sim);
        userId = parsed.user_id || parsed.id;
      }
    } catch {}
  }

  if (!userId) {
    throw new Error("Você precisa estar autenticado para enviar uma solicitação de verificação.");
  }

  // Validação: membro já verificado
  try {
    const { data: profileData } = await (supabase as any)
      .from("profiles")
      .select("is_verified")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileData?.is_verified) {
      throw new Error("Seu perfil já possui o Selo de Verificado oficial! Você não pode realizar novas solicitações.");
    }
  } catch (err: any) {
    if (err.message && err.message.includes("já possui o Selo")) throw err;
  }

  // Tenta RPC primeiro
  try {
    const { data, error } = await supabase.rpc("submit_verification_request_rpc" as any, {
      p_reason: params.reason,
      p_document_url: params.document_url || null,
      p_extra_data: params.extra_data || {},
    });

    if (!error && data) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tw_verifications_updated"));
      }
      return data as any;
    }
  } catch {}

  // Fallback Direto Resiliente
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  const requestPayload: VerificationRequest = {
    id: requestId,
    user_id: userId,
    status: "pendente",
    reason: params.reason,
    document_url: params.document_url || null,
    extra_data: params.extra_data || {},
    created_at: now,
    updated_at: now,
  };

  try {
    await supabase.from("verification_requests" as any).insert(requestPayload as any);
  } catch {}

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set(`verification_requests/${requestId}`, requestPayload);
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_verifications_updated"));
  }

  return { success: true, request_id: requestId };
}

/**
 * Cancela a solicitação própria de verificação
 */
export async function cancelVerificationRequest(requestId: string): Promise<void> {
  try {
    await supabase.rpc("cancel_verification_request_rpc" as any, {
      p_request_id: requestId,
    });
  } catch {}

  const now = new Date().toISOString();
  try {
    await supabase
      .from("verification_requests" as any)
      .update({ status: "cancelado", updated_at: now } as any)
      .eq("id", requestId);
  } catch {}

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.update(`verification_requests/${requestId}`, {
      status: "cancelado",
      updated_at: now,
    });
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_verifications_updated"));
  }
}

async function syncProfileVerificationRtdb(targetUserId: string, isVerified: boolean, now: string) {
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const fbProfiles = await rtdb.get<Record<string, any>>("profiles");
    if (fbProfiles && typeof fbProfiles === "object") {
      for (const [k, p] of Object.entries(fbProfiles)) {
        if (!p) continue;
        if (p.user_id === targetUserId || p.id === targetUserId || k === targetUserId) {
          await rtdb.update(`profiles/${k}`, { is_verified: isVerified, updated_at: now }).catch(() => {});
          return;
        }
      }
    }
  } catch {}
}

/**
 * Analisa uma solicitação de verificação (Aprova ou Rejeita)
 */
export async function reviewVerificationRequest(params: {
  requestId: string;
  approve: boolean;
  notes?: string;
  customTitle?: string;
  badgeColor?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const reviewerId = user?.id || "ceo";
  const now = new Date().toISOString();
  const newStatus: VerificationRequestStatus = params.approve ? "aprovado" : "rejeitado";

  // Tenta RPC primeiro
  try {
    await supabase.rpc("review_verification_request_rpc" as any, {
      p_request_id: params.requestId,
      p_approve: params.approve,
      p_notes: params.notes || null,
      p_custom_title: params.customTitle || "Verificado Oficial",
      p_badge_color: params.badgeColor || null,
    });
  } catch {}

  // Fallback e sincronização direta garantida
  let targetUserId = "";
  try {
    const { data: req } = await supabase
      .from("verification_requests" as any)
      .select("user_id")
      .eq("id", params.requestId)
      .maybeSingle();
    if (req?.user_id) targetUserId = req.user_id;
  } catch {}

  if (!targetUserId) {
    try {
      const { rtdb } = await import("@/integrations/firebase/rtdb");
      const req = await rtdb.get<any>(`verification_requests/${params.requestId}`);
      if (req?.user_id) targetUserId = req.user_id;
    } catch {}
  }

  // 1. Atualiza a solicitação
  const updatePayload = {
    status: newStatus,
    reviewed_by: reviewerId,
    reviewed_at: now,
    review_notes: params.notes || null,
    updated_at: now,
  };

  try {
    await supabase
      .from("verification_requests" as any)
      .update(updatePayload as any)
      .eq("id", params.requestId);
  } catch {}

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.update(`verification_requests/${params.requestId}`, updatePayload);
  } catch {}

  // 2. Se tiver targetUserId, atualiza status do perfil e member_verifications
  if (targetUserId) {
    if (params.approve) {
      // Ativa selo no perfil
      try {
        await supabase
          .from("profiles" as any)
          .update({ is_verified: true, updated_at: now } as any)
          .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`);
      } catch {}

      await syncProfileVerificationRtdb(targetUserId, true, now);

      // Insere/atualiza registro em member_verifications
      const verRecord = {
        id: `ver_${targetUserId}`,
        user_id: targetUserId,
        is_verified: true,
        verified_at: now,
        verified_by: reviewerId,
        request_id: params.requestId,
        custom_title: params.customTitle || "Verificado Oficial",
        badge_color_override: params.badgeColor || null,
        notes: params.notes || null,
        created_at: now,
        updated_at: now,
      };

      try {
        await supabase
          .from("member_verifications" as any)
          .upsert(verRecord as any, { onConflict: "user_id" });
      } catch {}

      try {
        const { rtdb } = await import("@/integrations/firebase/rtdb");
        await rtdb.set(`member_verifications/${targetUserId}`, verRecord);
      } catch {}
    } else {
      // Rejeição
      try {
        await supabase
          .from("profiles" as any)
          .update({ is_verified: false, updated_at: now } as any)
          .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`);
      } catch {}

      await syncProfileVerificationRtdb(targetUserId, false, now);
      try {
        const { rtdb } = await import("@/integrations/firebase/rtdb");
        await rtdb.delete(`member_verifications/${targetUserId}`);
      } catch {}

      try {
        await supabase
          .from("member_verifications" as any)
          .delete()
          .eq("user_id", targetUserId);
      } catch {}
    }
  }

  // 3. Auditoria
  const auditPayload = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    action: params.approve ? "approve_request" : "reject_request",
    target_user_id: targetUserId || null,
    performed_by: reviewerId,
    details: {
      request_id: params.requestId,
      notes: params.notes || null,
      custom_title: params.customTitle || null,
    },
    created_at: now,
  };

  try {
    await supabase.from("verification_audit_logs" as any).insert(auditPayload as any);
  } catch {}
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set(`verification_audit_logs/${auditPayload.id}`, auditPayload);
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_verifications_updated"));
    window.dispatchEvent(new Event("tw_permissions_synced"));
  }
}

/**
 * Concede selo diretamente a um membro
 */
export async function grantDirectVerification(params: {
  targetUserId: string;
  customTitle?: string;
  badgeColor?: string;
  notes?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const grantedBy = user?.id || "ceo";
  const now = new Date().toISOString();

  try {
    await supabase.rpc("grant_direct_verification_rpc" as any, {
      p_target_user_id: params.targetUserId,
      p_custom_title: params.customTitle || "Verificado Oficial",
      p_badge_color: params.badgeColor || null,
      p_notes: params.notes || null,
    });
  } catch {}

  // Fallback e garantia de persistência direta
  try {
    await supabase
      .from("profiles" as any)
      .update({ is_verified: true, updated_at: now } as any)
      .or(`user_id.eq.${params.targetUserId},id.eq.${params.targetUserId}`);
  } catch {}

    await syncProfileVerificationRtdb(params.targetUserId, true, now);

  const verRecord = {
    id: `ver_${params.targetUserId}`,
    user_id: params.targetUserId,
    is_verified: true,
    verified_at: now,
    verified_by: grantedBy,
    custom_title: params.customTitle || "Verificado Oficial",
    badge_color_override: params.badgeColor || null,
    notes: params.notes || null,
    created_at: now,
    updated_at: now,
  };

  try {
    await supabase
      .from("member_verifications" as any)
      .upsert(verRecord as any, { onConflict: "user_id" });
  } catch {}

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set(`member_verifications/${params.targetUserId}`, verRecord);
  } catch {}

  // Auditoria
  const auditPayload = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    action: "grant_direct",
    target_user_id: params.targetUserId,
    performed_by: grantedBy,
    details: {
      custom_title: params.customTitle || "Verificado Oficial",
      notes: params.notes || null,
    },
    created_at: now,
  };

  try {
    await supabase.from("verification_audit_logs" as any).insert(auditPayload as any);
  } catch {}
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set(`verification_audit_logs/${auditPayload.id}`, auditPayload);
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_verifications_updated"));
    window.dispatchEvent(new Event("tw_permissions_synced"));
  }
}

/**
 * Revoga / Remove o selo de verificado de um membro
 */
export async function revokeVerification(params: {
  targetUserId: string;
  reason?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const revokedBy = user?.id || "ceo";
  const now = new Date().toISOString();

  try {
    await supabase.rpc("revoke_verification_rpc" as any, {
      p_target_user_id: params.targetUserId,
      p_reason: params.reason || "Selo revogado pela administração.",
    });
  } catch {}

  // Atualiza perfil para is_verified = false
  try {
    await supabase
      .from("profiles" as any)
      .update({ is_verified: false, updated_at: now } as any)
      .or(`user_id.eq.${params.targetUserId},id.eq.${params.targetUserId}`);
  } catch {}

    await syncProfileVerificationRtdb(params.targetUserId, false, now);
    try {
      const { rtdb } = await import("@/integrations/firebase/rtdb");
      await rtdb.delete(`member_verifications/${params.targetUserId}`);
    } catch {}

  try {
    await supabase
      .from("member_verifications" as any)
      .delete()
      .eq("user_id", params.targetUserId);
  } catch {}

  // Atualiza solicitações pendentes/aprovadas para revogado
  try {
    await supabase
      .from("verification_requests" as any)
      .update({ status: "revogado", updated_at: now } as any)
      .eq("user_id", params.targetUserId)
      .eq("status", "aprovado");
  } catch {}

  // Auditoria
  const auditPayload = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    action: "revoke",
    target_user_id: params.targetUserId,
    performed_by: revokedBy,
    details: {
      reason: params.reason || "Selo revogado pela administração.",
    },
    created_at: now,
  };

  try {
    await supabase.from("verification_audit_logs" as any).insert(auditPayload as any);
  } catch {}
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set(`verification_audit_logs/${auditPayload.id}`, auditPayload);
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_verifications_updated"));
    window.dispatchEvent(new Event("tw_permissions_synced"));
  }
}

/**
 * Lista todos os membros verificados ativos
 * Combina resiliente Supabase e Firebase RTDB, consolidando member_verifications e profiles com is_verified === true
 */
export async function fetchMemberVerifications(): Promise<MemberVerification[]> {
  const verificationsMap = new Map<string, any>();

  // 1. Carrega de member_verifications do Supabase
  try {
    const { data, error } = await supabase
      .from("member_verifications" as any)
      .select("*")
      .eq("is_verified", true)
      .order("verified_at", { ascending: false });

    if (!error && data && data.length > 0) {
      for (const v of data) {
        if (v.user_id) verificationsMap.set(v.user_id, v);
      }
    }
  } catch (err) {
    console.error("Erro ao carregar membros verificados do Supabase:", err);
  }

  // 2. Mescla com member_verifications do Firebase RTDB
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const rtdbList = await rtdb.getList<any>("member_verifications");
    if (rtdbList && rtdbList.length > 0) {
      for (const v of rtdbList) {
        if (v && v.is_verified && v.user_id && !verificationsMap.has(v.user_id)) {
          verificationsMap.set(v.user_id, v);
        }
      }
    }
  } catch {}

  // 3. Mescla com perfis marcados como is_verified === true do Supabase
  try {
    const { data: verifiedProfiles } = await supabase
      .from("profiles" as any)
      .select("id, user_id, nome, nickname, avatar_url, discord_username, discord_avatar_url, game_id, telefone, nivel, is_verified, updated_at")
      .eq("is_verified", true);

    if (verifiedProfiles && verifiedProfiles.length > 0) {
      for (const p of verifiedProfiles) {
        const uid = p.user_id || p.id;
        if (uid && !verificationsMap.has(uid)) {
          verificationsMap.set(uid, {
            id: `ver_${uid}`,
            user_id: uid,
            is_verified: true,
            verified_at: p.updated_at || new Date().toISOString(),
            custom_title: "Verificado Oficial",
            created_at: p.updated_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
            member: p,
          });
        }
      }
    }
  } catch {}

  // 4. Mescla com perfis do Firebase RTDB
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const rtdbProfiles = await rtdb.getList<any>("profiles");
    if (rtdbProfiles && rtdbProfiles.length > 0) {
      for (const p of rtdbProfiles) {
        if (p && p.is_verified) {
          const uid = p.user_id || p.id;
          if (uid && !verificationsMap.has(uid)) {
            verificationsMap.set(uid, {
              id: `ver_${uid}`,
              user_id: uid,
              is_verified: true,
              verified_at: p.updated_at || new Date().toISOString(),
              custom_title: "Verificado Oficial",
              created_at: p.updated_at || new Date().toISOString(),
              updated_at: p.updated_at || new Date().toISOString(),
              member: p,
            });
          }
        }
      }
    }
  } catch {}

  const verifications = Array.from(verificationsMap.values());
  if (verifications.length === 0) return [];

  const userIds = Array.from(new Set(verifications.map((v: any) => v.user_id).filter(Boolean)));
  const verifierIds = Array.from(new Set(verifications.map((v: any) => v.verified_by).filter(Boolean)));
  const allIds = Array.from(new Set([...userIds, ...verifierIds]));

  const profilesMap: Record<string, any> = {};
  if (allIds.length > 0) {
    try {
      const { data: profiles } = await (supabase.from("profiles") as any)
        .select("id, user_id, nome, nickname, avatar_url, discord_username, discord_avatar_url, game_id, telefone")
        .in("user_id", allIds);

      if (profiles) {
        for (const p of profiles) {
          if (p.user_id) profilesMap[p.user_id] = p;
          if (p.id) profilesMap[p.id] = p;
        }
      }
    } catch {}

    const missingIds = allIds.filter((id) => !profilesMap[id]);
    if (missingIds.length > 0) {
      try {
        const { rtdb } = await import("@/integrations/firebase/rtdb");
        const fbProfiles = await rtdb.getList<any>("profiles");
        for (const p of fbProfiles) {
          if (p.user_id && !profilesMap[p.user_id]) profilesMap[p.user_id] = p;
          if (p.id && !profilesMap[p.id]) profilesMap[p.id] = p;
        }
      } catch {}
    }
  }

  return verifications.map((v: any) => ({
    ...v,
    member: v.member || profilesMap[v.user_id] || null,
    verifier: v.verified_by ? profilesMap[v.verified_by] || null : null,
  })) as unknown as MemberVerification[];
}

/**
 * Atualiza o título ou personalização individual de um membro já verificado
 */
export async function updateMemberVerificationOverride(params: {
  targetUserId: string;
  customTitle?: string;
  badgeColor?: string;
  badgeIcon?: string;
  notes?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    updated_at: now,
  };
  if (params.customTitle !== undefined) updatePayload.custom_title = params.customTitle;
  if (params.badgeColor !== undefined) updatePayload.badge_color_override = params.badgeColor || null;
  if (params.badgeIcon !== undefined) updatePayload.badge_icon_override = params.badgeIcon || null;
  if (params.notes !== undefined) updatePayload.notes = params.notes;

  try {
    await supabase
      .from("member_verifications" as any)
      .update(updatePayload as any)
      .eq("user_id", params.targetUserId);
  } catch {}

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.update(`member_verifications/${params.targetUserId}`, updatePayload);
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_verifications_updated"));
  }
}

/**
 * Busca histórico / logs de auditoria do sistema de verificação
 */
export async function fetchVerificationAuditLogs(limit = 50): Promise<VerificationAuditLog[]> {
  try {
    const { data: logs, error } = await supabase
      .from("verification_audit_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Erro ao carregar auditoria de verificações:", error);
      return [];
    }

    if (!logs || logs.length === 0) return [];

    const targetIds = Array.from(new Set(logs.map((l: any) => l.target_user_id).filter(Boolean)));
    const performerIds = Array.from(new Set(logs.map((l: any) => l.performed_by).filter(Boolean)));
    const allIds = Array.from(new Set([...targetIds, ...performerIds]));

    const profilesMap: Record<string, any> = {};
    if (allIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome, nickname")
        .in("user_id", allIds);

      if (profiles) {
        for (const p of profiles) {
          profilesMap[p.user_id] = p;
        }
      }
    }

    return logs.map((l: any) => ({
      ...l,
      target_member: profilesMap[l.target_user_id] || null,
      performer_member: l.performed_by ? profilesMap[l.performed_by] || null : null,
    })) as unknown as VerificationAuditLog[];
  } catch (err) {
    console.error("Erro ao carregar auditoria de verificações:", err);
    return [];
  }
}

export interface EvaluatedRequirementItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  isMet: boolean;
  currentValue?: any;
  requiredValue?: any;
  message: string;
  category: "account" | "level" | "faction" | "role" | "custom";
}

export interface VerificationRequirementsEvaluation {
  meetsAll: boolean;
  totalRequired: number;
  passedRequired: number;
  totalOptional: number;
  passedOptional: number;
  items: EvaluatedRequirementItem[];
  allowSelfRequest: boolean;
  customInstructions?: string;
  // Propriedades retrocompatíveis
  levelOk: boolean;
  roleOk: boolean;
  discordOk: boolean;
  gameIdOk: boolean;
  phoneOk: boolean;
  daysOk: boolean;
  insigniasOk: boolean;
  evaluationsOk: boolean;
  currentLevel: number;
  currentRole: string;
  daysInFaction: number;
  insigniasCount: number;
  evaluationsCount: number;
  details: {
    levelMessage: string;
    roleMessage: string;
    discordMessage?: string | undefined;
    gameIdMessage?: string | undefined;
    phoneMessage?: string | undefined;
    daysMessage?: string | undefined;
    insigniasMessage: string;
    evaluationsMessage: string;
    [key: string]: string | undefined;
  };
}

/**
 * Avalia dinamicamente os requisitos oficiais de verificação configurados
 * na tela de Gerenciamento de Selos (/ceo/selos) da Twin Wheels.
 */
export async function getMemberVerificationRequirementsStatus(
  userId?: string,
  profile?: any,
  roleLevel?: string | null,
  customConfig?: VerificationBadgeConfig | null
): Promise<VerificationRequirementsEvaluation> {
  const currentUserId = userId || profile?.user_id;

  // Carrega a configuração ativa do selo caso não tenha sido injetada
  let config = customConfig;
  if (!config) {
    try {
      config = await fetchVerificationConfig();
    } catch {
      config = DEFAULT_VERIFICATION_CONFIG;
    }
  }

  const reqConfig = config?.requirements_config || DEFAULT_VERIFICATION_CONFIG.requirements_config;
  const allowSelfRequest = config?.allow_self_request !== false;
  const customInstructions = reqConfig.custom_instructions?.trim() || "";

  // 1. Dados Básicos do Membro
  const currentLevel = Number(profile?.gamification_level ?? profile?.level ?? 1);
  const currentRole = String(roleLevel || profile?.nivel || "novato").toLowerCase().trim();

  // Cálculo de permanência na facção (dias)
  const joinDateStr = profile?.data_entrada || profile?.created_at;
  const daysInFaction = joinDateStr
    ? Math.max(0, Math.floor((Date.now() - new Date(joinDateStr).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Conta de Discord vinculada
  const hasDiscord = Boolean(
    profile?.discord_username?.trim() ||
    profile?.discord_id?.trim() ||
    profile?.discord_email?.trim()
  );

  // ID do jogo informado
  const hasGameId = Boolean(profile?.game_id && String(profile.game_id).trim() !== "");

  // Telefone informado
  const hasPhone = Boolean(profile?.telefone && String(profile.telefone).trim() !== "");

  // Itens avaliados dinamicamente
  const items: EvaluatedRequirementItem[] = [];

  // A) Requisito: Discord Vinculado
  if (reqConfig.require_discord) {
    items.push({
      id: "discord",
      title: "Discord Oficial Vinculado",
      description: "Conta do Discord autenticada na plataforma da Twin Wheels",
      isRequired: true,
      isMet: hasDiscord,
      currentValue: profile?.discord_username || (hasDiscord ? "Conectado" : "Não Vinculado"),
      requiredValue: "Vinculado",
      message: hasDiscord
        ? `Discord vinculado (@${profile?.discord_username || "Conectado"})`
        : "Nenhuma conta Discord vinculada ao perfil. Acesse Seu Perfil para vincular.",
      category: "account",
    });
  }

  // B) Requisito: ID do Jogo Informado
  if (reqConfig.require_game_id) {
    items.push({
      id: "game_id",
      title: "ID / Passaporte GTA RP",
      description: "Identificador do personagem nos servidores de GTA RP",
      isRequired: true,
      isMet: hasGameId,
      currentValue: profile?.game_id || "Não Informado",
      requiredValue: "Informado",
      message: hasGameId
        ? `Passaporte cadastrado (ID: #${profile?.game_id})`
        : "ID/Passaporte do GTA RP não informado no perfil.",
      category: "account",
    });
  }

  // C) Requisito: Telefone Cadastrado
  if (reqConfig.require_phone) {
    items.push({
      id: "phone",
      title: "Telefone de Contato",
      description: "Número de telefone operacional cadastrado",
      isRequired: true,
      isMet: hasPhone,
      currentValue: profile?.telefone || "Não Informado",
      requiredValue: "Cadastrado",
      message: hasPhone
        ? `Telefone cadastrado (${profile?.telefone})`
        : "Telefone de contato não cadastrado no perfil.",
      category: "account",
    });
  }

  // D) Requisito: Nível Mínimo de Gamificação
  const minLevel = Number(reqConfig.min_gamification_level || 0);
  if (minLevel > 0) {
    const levelOk = currentLevel >= minLevel;
    items.push({
      id: "level",
      title: `Nível Mínimo de Experiência (${minLevel}+)`,
      description: `Patente faccional de nível ${minLevel} ou superior necessária`,
      isRequired: true,
      isMet: levelOk,
      currentValue: currentLevel,
      requiredValue: minLevel,
      message: levelOk
        ? `Nível ${currentLevel} atingido (Exigido: Nível ${minLevel}+)`
        : `Nível atual ${currentLevel} insuficiente (Exigido: Nível ${minLevel}+)`,
      category: "level",
    });
  }

  // E) Requisito: Dias Mínimos de Permanência
  const minDays = Number(reqConfig.min_days_in_faction || 0);
  if (minDays > 0) {
    const daysOk = daysInFaction >= minDays;
    items.push({
      id: "days_in_faction",
      title: `Tempo de Facção (${minDays}+ dias)`,
      description: `Permanência ativa igual ou superior a ${minDays} dias`,
      isRequired: true,
      isMet: daysOk,
      currentValue: daysInFaction,
      requiredValue: minDays,
      message: daysOk
        ? `${daysInFaction} dia(s) na facção (Mínimo de ${minDays} dias atendido)`
        : `${daysInFaction} dia(s) na facção (Necessário permanecer pelo menos ${minDays} dias)`,
      category: "faction",
    });
  }

  // F) Requisito: Cargos Autorizados
  if (Array.isArray(reqConfig.allowed_roles) && reqConfig.allowed_roles.length > 0) {
    const allowedList = reqConfig.allowed_roles.map((r: string) => r.toLowerCase().trim());
    const roleOk = allowedList.includes(currentRole);
    items.push({
      id: "role",
      title: "Cargo Faccional Autorizado",
      description: `Cargos permitidos: ${reqConfig.allowed_roles.join(", ")}`,
      isRequired: true,
      isMet: roleOk,
      currentValue: currentRole.toUpperCase(),
      requiredValue: reqConfig.allowed_roles.join(", "),
      message: roleOk
        ? `Cargo "${currentRole.toUpperCase()}" habilitado para solicitação`
        : `Cargo "${currentRole.toUpperCase()}" não autorizado. Permitidos: ${reqConfig.allowed_roles.join(", ")}`,
      category: "role",
    });
  }

  // G) Requisitos Customizados Cadastrados pela Liderança
  if (Array.isArray(reqConfig.custom_requirements)) {
    reqConfig.custom_requirements.forEach((cReq) => {
      const isReq = Boolean(cReq.is_required ?? (cReq as any).required);
      items.push({
        id: `custom_${cReq.id}`,
        title: cReq.title,
        description: cReq.description,
        isRequired: isReq,
        isMet: true, // Avaliação declaratória pelo candidato no formulário
        message: isReq
          ? "Requisito obrigatório da Diretoria — Confirme sua declaração no envio"
          : "Critério sugerido pela Diretoria",
        category: "custom",
      });
    });
  }

  // Se nenhum requisito restritivo estiver configurado, adiciona um informativo
  if (items.length === 0) {
    items.push({
      id: "open",
      title: "Solicitação Aberta",
      description: "Nenhum critério restritivo configurado pela Diretoria Executiva",
      isRequired: false,
      isMet: true,
      message: "Qualquer membro ativo pode submeter uma justificativa para análise da liderança.",
      category: "account",
    });
  }

  // Contabilização
  const requiredItems = items.filter((i) => i.isRequired);
  const optionalItems = items.filter((i) => !i.isRequired);
  const passedRequired = requiredItems.filter((i) => i.isMet).length;
  const passedOptional = optionalItems.filter((i) => i.isMet).length;
  const meetsAll = requiredItems.length === 0 || passedRequired === requiredItems.length;

  // Retrocompatibilidade
  const levelItem = items.find((i) => i.id === "level");
  const roleItem = items.find((i) => i.id === "role");
  const discordItem = items.find((i) => i.id === "discord");
  const gameIdItem = items.find((i) => i.id === "game_id");
  const phoneItem = items.find((i) => i.id === "phone");
  const daysItem = items.find((i) => i.id === "days_in_faction");

  return {
    meetsAll,
    totalRequired: requiredItems.length,
    passedRequired,
    totalOptional: optionalItems.length,
    passedOptional,
    items,
    allowSelfRequest,
    customInstructions,
    levelOk: levelItem ? levelItem.isMet : true,
    roleOk: roleItem ? roleItem.isMet : true,
    discordOk: discordItem ? discordItem.isMet : true,
    gameIdOk: gameIdItem ? gameIdItem.isMet : true,
    phoneOk: phoneItem ? phoneItem.isMet : true,
    daysOk: daysItem ? daysItem.isMet : true,
    insigniasOk: true,
    evaluationsOk: true,
    currentLevel,
    currentRole,
    daysInFaction,
    insigniasCount: 0,
    evaluationsCount: 0,
    details: {
      levelMessage: levelItem?.message || `Nível ${currentLevel}`,
      roleMessage: roleItem?.message || `Cargo ${currentRole.toUpperCase()}`,
      discordMessage: discordItem?.message,
      gameIdMessage: gameIdItem?.message,
      phoneMessage: phoneItem?.message,
      daysMessage: daysItem?.message,
      insigniasMessage: "Condecorações faccionais registradas",
      evaluationsMessage: "Avaliações registradas na plataforma",
    },
  };
}
