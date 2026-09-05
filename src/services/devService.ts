import { supabase } from "@/integrations/supabase/client";
import type { AppUser, Profile } from "@/lib/app-types";
import type { AppLevel } from "@/lib/permissions";

export interface DevPermissionResource {
  id: string;
  name: string;
  description: string;
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
}

export interface DevConfiguration {
  developerBypassMode: boolean;
  devAuditLogs: boolean;
  devSystemNotifications: boolean;
}

export const DEFAULT_DEV_PERMISSIONS: DevPermissionResource[] = [
  {
    id: "estoque_baus",
    name: "Gestão de Estoque & Baús de Insumos",
    description: "Controle de baixo nível dos baús, movimentações e depósitos de suprimentos",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: true,
  },
  {
    id: "vendas_financeiro",
    name: "Vendas, Comissões & Fundo de Caixa",
    description: "Lançamento de vendas, controle financeiro e movimentações de caixa",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: true,
  },
  {
    id: "membros_hierarquia",
    name: "Gestão de Membros, Hierarquia & Cargos",
    description: "Administração de integrantes, aprovação de cadastros e alteração de patentes",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: true,
  },
  {
    id: "configuracoes_sistema",
    name: "Configurações & Painel Administrativo",
    description: "Ajustes Globais de plataforma, comunicados e customização de menus",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: true,
  },
  {
    id: "auditoria_logs",
    name: "Auditoria, Logs & Histórico de Operações",
    description: "Inspeção dos registros de auditoria e relatórios de presença dos membros",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: true,
  },
];

export const DEFAULT_DEV_CONFIG: DevConfiguration = {
  developerBypassMode: true,
  devAuditLogs: true,
  devSystemNotifications: true,
};

const DEV_PERMS_KEY = "tw_dev_module_permissions_v1";
const ADMIN_PERMS_KEY = "tw_admin_tag_permissions_v1";
const DEV_CONFIG_KEY = "tw_dev_module_config_v1";

export const DEFAULT_ADMIN_TAG_PERMISSIONS: DevPermissionResource[] = [
  {
    id: "estoque_baus",
    name: "Gestão de Estoque & Baús de Insumos",
    description: "Controle de baixo nível dos baús, movimentações e depósitos de suprimentos",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: false,
  },
  {
    id: "vendas_financeiro",
    name: "Vendas, Comissões & Fundo de Caixa",
    description: "Lançamento de vendas, controle financeiro e movimentações de caixa",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: false,
  },
  {
    id: "membros_hierarquia",
    name: "Gestão de Membros, Hierarquia & Cargos",
    description: "Administração de integrantes, aprovação de cadastros e alteração de patentes",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: false,
  },
  {
    id: "configuracoes_sistema",
    name: "Configurações & Painel Administrativo",
    description: "Ajustes Globais de plataforma, comunicados e customização de menus",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: false,
  },
  {
    id: "auditoria_logs",
    name: "Auditoria, Logs & Histórico de Operações",
    description: "Inspeção dos registros de auditoria e relatórios de presença dos membros",
    visualizar: true,
    criar: true,
    editar: false,
    excluir: false,
  },
];

/**
 * Carrega a matriz de permissões da Tag Administrador.
 */
export async function getAdminTagPermissions(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<DevPermissionResource[]> {
  assertDeveloperAccess(user, profile, level);

  try {
    const local = localStorage.getItem(ADMIN_PERMS_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Falha ao ler permissões Admin Tag do armazenamento local:", err);
  }

  return DEFAULT_ADMIN_TAG_PERMISSIONS;
}

/**
 * Salva a matriz de permissões da Tag Administrador.
 */
export async function saveAdminTagPermissions(
  permissions: DevPermissionResource[],
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  await new Promise((resolve) => setTimeout(resolve, 600));

  try {
    localStorage.setItem(ADMIN_PERMS_KEY, JSON.stringify(permissions));

    await supabase.from("platform_settings").upsert({
      key: "admin_tag_permissions",
      value: JSON.stringify(permissions),
      updated_at: new Date().toISOString(),
    } as any);
  } catch (err) {
    console.warn("Salvo localmente (Supabase fallback):", err);
  }
}

export const DEV_DISCORD_IDS: string[] = [
  "917826984778797087", // Malaca
  "722320491767136346", // Developers / malaca7k
];

/**
 * Validação rigorosa de autorização para o Módulo Dev.
 * Retorna true se o usuário possui a tag/permissão de desenvolvedor.
 */
export function isUserDeveloper(
  user: AppUser | null | undefined,
  profile: Profile | null | undefined,
  level: AppLevel | null | undefined
): boolean {
  if (!user && !profile && !level) return false;

  // 1. Nível/Cargo hierárquico explícito 'desenvolvedor'
  if (level === "desenvolvedor") return true;

  // 2. ID do Discord verificado de Desenvolvedor Principal (Malaca)
  if (profile?.discord_id && DEV_DISCORD_IDS.includes(String(profile.discord_id))) return true;

  // 3. Flag de desenvolvedor ativada no perfil (somente válida se o cargo for desenvolvedor)
  if ((profile as any)?.is_developer === true && level === "desenvolvedor") return true;

  return false;
}

/**
 * Validação backend/API que dispara erro HTTP 403 Forbidden caso o usuário não tenha a tag de desenvolvedor.
 */
export function assertDeveloperAccess(
  user: AppUser | null | undefined,
  profile: Profile | null | undefined,
  level: AppLevel | null | undefined
): void {
  if (!isUserDeveloper(user, profile, level)) {
    const error: any = new Error("403 Forbidden — Acesso Negado ao Módulo Dev. Tag 'desenvolvedor' é necessária.");
    error.status = 403;
    error.statusCode = 403;
    throw error;
  }
}

/**
 * Carrega a matriz de permissões do Módulo Dev.
 */
export async function getDevPermissions(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<DevPermissionResource[]> {
  assertDeveloperAccess(user, profile, level);

  try {
    const local = localStorage.getItem(DEV_PERMS_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Falha ao ler permissões Dev do armazenamento local:", err);
  }

  return DEFAULT_DEV_PERMISSIONS;
}

/**
 * Salva a matriz de permissões do Módulo Dev.
 */
export async function saveDevPermissions(
  permissions: DevPermissionResource[],
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  // Simula latência de rede profissional para feedback visual de carregamento
  await new Promise((resolve) => setTimeout(resolve, 600));

  try {
    localStorage.setItem(DEV_PERMS_KEY, JSON.stringify(permissions));

    // Opcional: Persistir no Supabase platform_settings se disponível
    await supabase.from("platform_settings").upsert({
      key: "dev_permissions",
      value: JSON.stringify(permissions),
      updated_at: new Date().toISOString(),
    } as any);
  } catch (err) {
    console.warn("Salvo localmente (Supabase fallback):", err);
  }
}

/**
 * Carrega as configurações do Módulo Dev.
 */
export async function getDevConfiguration(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<DevConfiguration> {
  assertDeveloperAccess(user, profile, level);

  try {
    const local = localStorage.getItem(DEV_CONFIG_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return { ...DEFAULT_DEV_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn("Falha ao ler configurações Dev do armazenamento local:", err);
  }

  return DEFAULT_DEV_CONFIG;
}

/**
 * Salva as configurações do Módulo Dev.
 */
export async function saveDevConfiguration(
  config: DevConfiguration,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  // Simula latência de rede profissional para feedback visual de carregamento
  await new Promise((resolve) => setTimeout(resolve, 600));

  try {
    localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(config));

    // Opcional: Persistir no Supabase platform_settings se disponível
    await supabase.from("platform_settings").upsert({
      key: "dev_configuration",
      value: JSON.stringify(config),
      updated_at: new Date().toISOString(),
    } as any);
  } catch (err) {
    console.warn("Salvo localmente (Supabase fallback):", err);
  }
}
