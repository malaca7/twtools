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

    await (supabase.from as any)("platform_settings").upsert({
      key: "admin_tag_permissions",
      value: JSON.stringify(permissions),
      updated_at: new Date().toISOString(),
    });
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
  if (!profile) return false;

  // Acesso estrito: SOMENTE quem tem a chavinha "is_developer" (Tag Dev) ativada no perfil.
  // Bypass do Discord ID removido para evitar falsos positivos durante testes.
  return Boolean((profile as any).is_developer === true);
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
    await (supabase.from as any)("platform_settings").upsert({
      key: "dev_permissions",
      value: JSON.stringify(permissions),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Salvo localmente (Supabase fallback):", err);
  }
}

export const DEV_CONFIG_EVENT = "tw_dev_config_updated";

/**
 * Carrega as configurações do Módulo Dev de forma síncrona do armazenamento local.
 */
export function getDevConfigurationSync(): DevConfiguration {
  if (typeof window === "undefined") return DEFAULT_DEV_CONFIG;
  try {
    const local = localStorage.getItem(DEV_CONFIG_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return { ...DEFAULT_DEV_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn("Falha ao ler configurações Dev sincronamente:", err);
  }
  return DEFAULT_DEV_CONFIG;
}

/**
 * Retorna se o Bypass de Autorização Dev está ativado.
 */
export function isDevBypassActive(): boolean {
  return getDevConfigurationSync().developerBypassMode;
}

/**
 * Retorna se a Auditoria de Ações Dev está ativada.
 */
export function isDevAuditLogsEnabled(): boolean {
  return getDevConfigurationSync().devAuditLogs;
}

/**
 * Retorna se os Alertas de Exceção Dev estão ativados.
 */
export function isDevSystemNotificationsEnabled(): boolean {
  return getDevConfigurationSync().devSystemNotifications;
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
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(config));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: config }));
    }

    // Opcional: Persistir no Supabase platform_settings se disponível
    await (supabase.from as any)("platform_settings").upsert({
      key: "dev_configuration",
      value: JSON.stringify(config),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("Salvo localmente (Supabase fallback):", err);
  }
}

export interface ForceCachePurgeRecord {
  timestamp: number;
  requested_by_id?: string | null;
  requested_by_name?: string | null;
  reason?: string;
}

/**
 * Dispara uma ordem global para que todos os membros conectados limpem os caches
 * do navegador (Service Workers, Cache Storage) e recarreguem a página em tempo real.
 */
export async function triggerForceCachePurge(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null,
  reason?: string
): Promise<ForceCachePurgeRecord> {
  assertDeveloperAccess(user, profile, level);

  const record: ForceCachePurgeRecord = {
    timestamp: Date.now(),
    requested_by_id: user?.id || null,
    requested_by_name: profile?.nickname || profile?.nome || "Desenvolvedor",
    reason: reason?.trim() || "Atualização e limpeza de versão da plataforma",
  };

  try {
    // 1. Persiste no banco Supabase para que clientes recém-abertos também recebam a instrução
    await supabase.from("role_permissions").upsert(
      {
        level: "system_force_cache_purge",
        nivel: "system_force_cache_purge",
        permissions: record as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );

    // 2. Transmite via WebSocket Realtime Broadcast (latência imediata < 50ms)
    const channel = supabase.channel("system-force-cache-purge-channel");
    await channel.send({
      type: "broadcast",
      event: "force_cache_purge",
      payload: record,
    });
  } catch (err) {
    console.error("Erro ao emitir ordem de limpeza de cache:", err);
    throw err;
  }

  return record;
}

/**
 * Busca a última instrução de limpeza forçada de cache emitida no sistema.
 */
export async function fetchLastForceCachePurge(): Promise<ForceCachePurgeRecord | null> {
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "system_force_cache_purge")
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      return data.permissions as unknown as ForceCachePurgeRecord;
    }
  } catch (err) {
    console.warn("Erro ao buscar registro de purga de cache:", err);
  }
  return null;
}
