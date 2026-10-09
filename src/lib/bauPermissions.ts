import type { Bau } from "@/lib/app-types";
import { LEVEL_LABEL, type AppLevel } from "@/lib/permissions";

export interface BauAccessUserContext {
  level?: string | null;
  customRoleId?: string | null;
  roleName?: string | null;
  tagIds?: string[];
  tagNames?: string[];
  isDevUser?: boolean;
  isCeoUser?: boolean;
  panelMode?: "member" | "dev" | "ceo";
}

export interface BauAccessResult {
  canView: boolean;
  isActiveForUser: boolean;
  isRestricted: boolean;
  hasAccessGranted: boolean;
  reason?: string;
}

/**
 * Avalia se um membro possui permissão de visualizar e utilizar um baú e suas funções/opções.
 * Regra: Quando "Modo Restrito de Acesso" está ativo, o baú e suas funções/opções
 * SÓ SÃO MOSTRADOS para os membros que possuírem ao menos um dos cargos ou tags marcados.
 * Para todos os demais membros sem o cargo/tag marcado, o baú fica 100% oculto.
 */
export function evaluateBauAccess(
  bau: Bau,
  ctx?: BauAccessUserContext
): BauAccessResult {
  const isGlobalActive = bau.ativo !== false;
  const isRestricted = bau.access_mode === "restricted";

  // Se não há contexto do usuário (ex: carregamento anônimo)
  if (!ctx) {
    return {
      canView: !isRestricted && isGlobalActive,
      isActiveForUser: !isRestricted && isGlobalActive,
      isRestricted,
      hasAccessGranted: !isRestricted,
    };
  }

  // Superadministradores da plataforma (Dev e CEO quando não em modo membro de teste)
  // No modo "member", eles visualizam com as regras reais de cargos e tags para validação precisa
  const isSuperAdminBypass = Boolean((ctx.isDevUser || ctx.isCeoUser) && ctx.panelMode !== "member");
  if (isSuperAdminBypass) {
    return {
      canView: true,
      isActiveForUser: isGlobalActive,
      isRestricted,
      hasAccessGranted: true,
    };
  }

  // Se o baú está configurado com Modo Restrito de Acesso
  if (isRestricted) {
    const allowedRoles = Array.isArray(bau.allowed_roles) ? bau.allowed_roles : [];
    const allowedTags = Array.isArray(bau.allowed_tags) ? bau.allowed_tags : [];

    const userLevel = (ctx.level || "").toLowerCase().trim();
    const userCustomRole = (ctx.customRoleId || "").toLowerCase().trim();
    const userRoleName = (ctx.roleName || "").toLowerCase().trim();
    const userLevelLabel = (LEVEL_LABEL[ctx.level as AppLevel] || "").toLowerCase().trim();

    const userTagIds = (ctx.tagIds || []).map((t) => (t || "").toLowerCase().trim());
    const userTagNames = (ctx.tagNames || []).map((t) => (t || "").toLowerCase().trim());

    // Correspondência de cargo por ID, nível ou nome
    const hasRoleMatch =
      allowedRoles.length > 0 &&
      allowedRoles.some((r) => {
        const clean = (r || "").toLowerCase().trim();
        if (!clean) return false;
        return (
          clean === userLevel ||
          clean === userCustomRole ||
          (userRoleName && clean === userRoleName) ||
          (userLevelLabel && clean === userLevelLabel) ||
          (userLevel && clean.startsWith(userLevel)) ||
          (userLevel && userLevel.startsWith(clean))
        );
      });

    // Correspondência de tag por ID ou nome
    const hasTagMatch =
      allowedTags.length > 0 &&
      allowedTags.some((t) => {
        const clean = (t || "").toLowerCase().trim();
        if (!clean) return false;
        return (
          userTagIds.includes(clean) ||
          userTagNames.includes(clean) ||
          userTagNames.some((n) => n === clean || n.includes(clean) || clean.includes(n))
        );
      });

    // Acesso é estritamente concedido se o usuário possui o cargo OU a tag selecionada
    const hasAccessGranted = hasRoleMatch || hasTagMatch;

    // Se NÃO possui cargo nem tag marcada: O baú e suas opções NÃO são mostrados
    if (!hasAccessGranted) {
      return {
        canView: false,
        isActiveForUser: false,
        isRestricted: true,
        hasAccessGranted: false,
        reason: "Baú restrito para outros cargos e tags da facção.",
      };
    }

    // Se possui cargo ou tag marcada: O baú e suas opções são mostrados normalmente
    return {
      canView: true,
      isActiveForUser: isGlobalActive,
      isRestricted: true,
      hasAccessGranted: true,
      reason: isGlobalActive ? undefined : "Baú inativo na plataforma.",
    };
  }

  // Se o baú está em Modo Livre (acesso aberto a todos os membros):
  if (!isGlobalActive) {
    return {
      canView: true,
      isActiveForUser: false,
      isRestricted: false,
      hasAccessGranted: true,
      reason: "Baú inativo na plataforma.",
    };
  }

  return {
    canView: true,
    isActiveForUser: true,
    isRestricted: false,
    hasAccessGranted: true,
  };
}
