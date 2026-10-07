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
  try {
    let query = supabase
      .from("verification_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: requests, error } = await query;
    if (error) {
      console.error("Erro ao buscar solicitações de verificação:", error);
      return [];
    }

    if (!requests || requests.length === 0) return [];

    // Busca todos os user_ids envolvidos para preencher os dados de perfil
    const userIds = Array.from(new Set(requests.map((r: any) => r.user_id).filter(Boolean)));
    const reviewerIds = Array.from(new Set(requests.map((r: any) => r.reviewed_by).filter(Boolean)));
    const allUserIds = Array.from(new Set([...userIds, ...reviewerIds]));

    const profilesMap: Record<string, any> = {};
    if (allUserIds.length > 0) {
      const { data: profiles } = await (supabase
        .from("profiles") as any)
        .select("user_id, nome, nickname, avatar_url, discord_username, discord_avatar_url, game_id, telefone")
        .in("user_id", allUserIds);

      if (profiles) {
        for (const p of profiles) {
          profilesMap[p.user_id] = p;
        }
      }
    }

    return requests.map((req: any) => ({
      ...req,
      member: profilesMap[req.user_id] || null,
      reviewer: req.reviewed_by ? profilesMap[req.reviewed_by] || null : null,
    })) as unknown as VerificationRequest[];
  } catch (err) {
    console.error("Erro ao carregar solicitações de verificação:", err);
    return [];
  }
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
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profileData } = await (supabase as any)
      .from("profiles")
      .select("is_verified")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileData?.is_verified) {
      throw new Error("Seu perfil já possui o Selo de Verificado oficial! Você não pode realizar novas solicitações.");
    }
  }

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
  try {
    const { data: verifications, error } = await supabase
      .from("member_verifications" as any)
      .select("*")
      .eq("is_verified", true)
      .order("verified_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar membros verificados:", error);
      return [];
    }

    if (!verifications || verifications.length === 0) return [];

    const userIds = Array.from(new Set(verifications.map((v: any) => v.user_id).filter(Boolean)));
    const verifierIds = Array.from(new Set(verifications.map((v: any) => v.verified_by).filter(Boolean)));
    const allIds = Array.from(new Set([...userIds, ...verifierIds]));

    const profilesMap: Record<string, any> = {};
    if (allIds.length > 0) {
      const { data: profiles } = await (supabase
        .from("profiles") as any)
        .select("user_id, nome, nickname, avatar_url, discord_username, discord_avatar_url, game_id, telefone")
        .in("user_id", allIds);

      if (profiles) {
        for (const p of profiles) {
          profilesMap[p.user_id] = p;
        }
      }
    }

    return verifications.map((v: any) => ({
      ...v,
      member: profilesMap[v.user_id] || null,
      verifier: v.verified_by ? profilesMap[v.verified_by] || null : null,
    })) as unknown as MemberVerification[];
  } catch (err) {
    console.error("Erro ao carregar membros verificados:", err);
    return [];
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
