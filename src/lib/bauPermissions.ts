import type { Bau } from "@/lib/app-types";

export interface BauAccessUserContext {
  level?: string | null;
  customRoleId?: string | null;
  tagIds?: string[];
  tagNames?: string[];
  isDevUser?: boolean;
  isCeoUser?: boolean;
  canManage?: boolean;
}

export interface BauAccessResult {
  canView: boolean;
  isActiveForUser: boolean;
  isRestricted: boolean;
  hasAccessGranted: boolean;
  reason?: string;
}

/**
 * Avalia se um membro possui permissão de visualizar e utilizar um baú,
 * considerando o modo de acesso configurado ("all" ou "restricted"),
 * os cargos permitidos e as tags de membros atribuídas.
 */
export function evaluateBauAccess(
  bau: Bau,
  ctx?: BauAccessUserContext
): BauAccessResult {
  const isGlobalActive = bau.ativo !== false;
  const isRestricted = bau.access_mode === "restricted";

  // Se não há contexto do usuário (ex: carregamento inicial ou anônimo)
  if (!ctx) {
    return {
      canView: isGlobalActive,
      isActiveForUser: isGlobalActive,
      isRestricted,
      hasAccessGranted: !isRestricted,
    };
  }

  // Desenvolvedores, CEOs e quem gerencia baús possuem acesso irrestrito
  if (ctx.isDevUser || ctx.isCeoUser || ctx.canManage) {
    return {
      canView: true,
      isActiveForUser: isGlobalActive,
      isRestricted,
      hasAccessGranted: true,
    };
  }

  // Se o baú está desativado globalmente na administração
  if (!isGlobalActive) {
    return {
      canView: true,
      isActiveForUser: false,
      isRestricted,
      hasAccessGranted: false,
      reason: "Baú inativo na plataforma.",
    };
  }

  // Se o baú for liberado para todos os membros
  if (!isRestricted) {
    return {
      canView: true,
      isActiveForUser: true,
      isRestricted: false,
      hasAccessGranted: true,
    };
  }

  const allowedRoles = Array.isArray(bau.allowed_roles) ? bau.allowed_roles : [];
  const allowedTags = Array.isArray(bau.allowed_tags) ? bau.allowed_tags : [];

  const userLevel = (ctx.level || "").toLowerCase().trim();
  const userCustomRole = (ctx.customRoleId || "").toLowerCase().trim();
  const userTagIds = (ctx.tagIds || []).map((t) => (t || "").toLowerCase().trim());
  const userTagNames = (ctx.tagNames || []).map((t) => (t || "").toLowerCase().trim());

  // Correspondência de cargo por ID ou nível
  const hasRoleMatch =
    allowedRoles.length > 0 &&
    allowedRoles.some((r) => {
      const clean = r.toLowerCase().trim();
      return clean === userLevel || clean === userCustomRole;
    });

  // Correspondência de tag por ID ou nome
  const hasTagMatch =
    allowedTags.length > 0 &&
    allowedTags.some((t) => {
      const clean = t.toLowerCase().trim();
      return userTagIds.includes(clean) || userTagNames.includes(clean);
    });

  // Se nenhum cargo e nenhuma tag foram marcados, assume bloqueio para não-administradores
  const hasAccessGranted =
    (allowedRoles.length > 0 && hasRoleMatch) ||
    (allowedTags.length > 0 && hasTagMatch) ||
    (allowedRoles.length === 0 && allowedTags.length === 0);

  if (hasAccessGranted) {
    return {
      canView: true,
      isActiveForUser: true,
      isRestricted: true,
      hasAccessGranted: true,
    };
  }

  const restrictedAction = bau.restricted_action || "disabled";
  if (restrictedAction === "hide") {
    return {
      canView: false,
      isActiveForUser: false,
      isRestricted: true,
      hasAccessGranted: false,
      reason: "Baú restrito para outros cargos e tags.",
    };
  }

  return {
    canView: true,
    isActiveForUser: false,
    isRestricted: true,
    hasAccessGranted: false,
    reason: "Baú desativado para seu cargo/tag.",
  };
}
