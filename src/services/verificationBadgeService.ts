import { supabase } from "@/integrations/supabase/client";

export interface VerificationRequirementsConfig {
  require_discord: boolean;
  require_game_id: boolean;
  require_phone?: boolean;
  min_days_in_faction?: number;
  min_gamification_level?: number;
  allowed_roles?: string[];
  allowed_tags?: string[];
  custom_instructions?: string;
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

/**
 * Busca a configuração singleton do Selo de Verificado
 */
export async function fetchVerificationConfig(): Promise<VerificationBadgeConfig> {
  const { data, error } = await supabase
    .from("verification_badge_config" as any)
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_VERIFICATION_CONFIG;
  }

  return {
    ...DEFAULT_VERIFICATION_CONFIG,
    ...(data as any),
    requirements_config: {
      ...DEFAULT_VERIFICATION_CONFIG.requirements_config,
      ...((data as any).requirements_config || {}),
    },
  };
}

/**
 * Atualiza a configuração do Selo de Verificado (CEO / Autorizado)
 */
export async function updateVerificationConfig(
  config: Partial<VerificationBadgeConfig>
): Promise<VerificationBadgeConfig> {
  const payload = {
    ...config,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("verification_badge_config" as any)
    .update(payload as any)
    .eq("id", "default")
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Falha ao salvar configurações do selo.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_verification_config_updated"));
  }

  return (data as any) || DEFAULT_VERIFICATION_CONFIG;
}

/**
 * Busca todas as solicitações de verificação (com perfis dos membros)
 */
export async function fetchVerificationRequests(statusFilter?: string): Promise<VerificationRequest[]> {
  let query = supabase
    .from("verification_requests" as any)
    .select(`
      *,
      member:profiles!verification_requests_user_id_fkey (
        nome,
        nickname,
        avatar_url,
        discord_username,
        discord_avatar_url,
        game_id,
        telefone
      ),
      reviewer:profiles!verification_requests_reviewed_by_fkey (
        nome,
        nickname
      )
    `)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Erro ao buscar solicitações de verificação:", error);
    return [];
  }

  return (data || []) as unknown as VerificationRequest[];
}

/**
 * Busca a solicitação ativa/recente do membro logado
 */
export async function fetchMyVerificationRequest(): Promise<VerificationRequest | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("verification_requests" as any)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as VerificationRequest;
}

/**
 * Envia uma solicitação de verificação
 */
export async function submitVerificationRequest(params: {
  reason: string;
  document_url?: string | null;
  extra_data?: Record<string, any>;
}): Promise<{ success: boolean; request_id: string }> {
  const { data, error } = await supabase.rpc("submit_verification_request_rpc" as any, {
    p_reason: params.reason,
    p_document_url: params.document_url || null,
    p_extra_data: params.extra_data || {},
  });

  if (error) {
    throw new Error(error.message || "Erro ao enviar solicitação de verificação.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_verifications_updated"));
  }

  return data as any;
}

/**
 * Cancela a solicitação própria de verificação
 */
export async function cancelVerificationRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_verification_request_rpc" as any, {
    p_request_id: requestId,
  });

  if (error) {
    throw new Error(error.message || "Erro ao cancelar solicitação.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_verifications_updated"));
  }
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
  const { error } = await supabase.rpc("review_verification_request_rpc" as any, {
    p_request_id: params.requestId,
    p_approve: params.approve,
    p_notes: params.notes || null,
    p_custom_title: params.customTitle || "Verificado Oficial",
    p_badge_color: params.badgeColor || null,
  });

  if (error) {
    throw new Error(error.message || "Erro ao processar solicitação de verificação.");
  }

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
  const { error } = await supabase.rpc("grant_direct_verification_rpc" as any, {
    p_target_user_id: params.targetUserId,
    p_custom_title: params.customTitle || "Verificado Oficial",
    p_badge_color: params.badgeColor || null,
    p_notes: params.notes || null,
  });

  if (error) {
    throw new Error(error.message || "Erro ao conceder selo de verificação.");
  }

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
  const { error } = await supabase.rpc("revoke_verification_rpc" as any, {
    p_target_user_id: params.targetUserId,
    p_reason: params.reason || "Selo revogado pela administração.",
  });

  if (error) {
    throw new Error(error.message || "Erro ao revogar selo de verificação.");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tw_verifications_updated"));
    window.dispatchEvent(new Event("tw_permissions_synced"));
  }
}

/**
 * Lista todos os membros verificados ativos
 */
export async function fetchMemberVerifications(): Promise<MemberVerification[]> {
  const { data, error } = await supabase
    .from("member_verifications" as any)
    .select(`
      *,
      member:profiles!member_verifications_user_id_fkey (
        nome,
        nickname,
        avatar_url,
        discord_username,
        discord_avatar_url,
        game_id,
        telefone
      ),
      verifier:profiles!member_verifications_verified_by_fkey (
        nome,
        nickname
      )
    `)
    .eq("is_verified", true)
    .order("verified_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar membros verificados:", error);
    return [];
  }

  return (data || []) as unknown as MemberVerification[];
}

/**
 * Busca histórico / logs de auditoria do sistema de verificação
 */
export async function fetchVerificationAuditLogs(limit = 50): Promise<VerificationAuditLog[]> {
  const { data, error } = await supabase
    .from("verification_audit_logs" as any)
    .select(`
      *,
      target_member:profiles!verification_audit_logs_target_user_id_fkey (
        nome,
        nickname
      ),
      performer_member:profiles!verification_audit_logs_performed_by_fkey (
        nome,
        nickname
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erro ao carregar auditoria de verificações:", error);
    return [];
  }

  return (data || []) as unknown as VerificationAuditLog[];
}
