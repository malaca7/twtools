import { supabase } from "@/integrations/supabase/client";
import type { AppUser, Profile } from "@/lib/app-types";
import type { AppLevel, Permission } from "@/lib/permissions";

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
  developerBypassMode: false,
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
  "722320491767136346", // Malaca (Fundador & Dev)
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
  if (!profile && !level) return false;

  // Acesso estrito: SOMENTE quem tem a chavinha "is_developer" (Tag Dev) ativada no perfil ou cargo "desenvolvedor"
  return Boolean((profile as any)?.is_developer === true || level === "desenvolvedor");
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
 * Validação backend/API que permite acesso para Desenvolvedores OU para membros com a Tag CEO
 * (verificando opcionalmente a permissão granular da Tag CEO).
 */
export function assertDeveloperOrCeoAccess(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null,
  permission?: Permission
): void {
  if (isUserDeveloper(user, profile, level)) return;
  if (isUserCeo(profile)) {
    if (!permission) return;
    const ceoPerms = getCeoTagPermissionsSync();
    if (ceoPerms.includes(permission)) return;
  }
  const error: any = new Error("403 Forbidden — Acesso Negado. Permissão de Desenvolvedor ou Tag CEO necessária.");
  error.status = 403;
  error.statusCode = 403;
  throw error;
}

/**
 * Carrega a matriz de permissões do Módulo Dev da tabela role_permissions ou cache local.
 */
export async function getDevPermissions(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<any[]> {
  assertDeveloperAccess(user, profile, level);

  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "desenvolvedor")
      .maybeSingle();

    if (!error && data && Array.isArray(data.permissions)) {
      const perms = data.permissions.map(String);
      if (typeof window !== "undefined") {
        localStorage.setItem(DEV_PERMS_KEY, JSON.stringify(perms));
      }
      return perms;
    }
  } catch (err) {
    console.warn("Falha ao buscar permissões Dev no Supabase:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(DEV_PERMS_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
  }

  return DEFAULT_DEV_PERMISSIONS;
}

/**
 * Obtém síncronamente as permissões da Tag Dev persistidas em localStorage
 */
export function getDevTagPermissionsSync(): string[] {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(DEV_PERMS_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => (typeof item === "string" ? item : item.id || item.name));
        }
      }
    } catch {}
  }
  return [];
}

/**
 * Salva a matriz de permissões do Módulo Dev em role_permissions (desenvolvedor) e localStorage.
 */
export async function saveDevPermissions(
  permissions: any[],
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  const permStrings: string[] = permissions.map((p: any) =>
    typeof p === "string" ? p : p.id || p.name
  );

  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(DEV_PERMS_KEY, JSON.stringify(permStrings));
      window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: permStrings }));
      window.dispatchEvent(new Event("storage"));
    }

    // Persiste no Supabase em role_permissions sob o level 'desenvolvedor'
    const { error: roleErr } = await supabase.from("role_permissions").upsert(
      {
        level: "desenvolvedor",
        nivel: "desenvolvedor",
        permissions: permStrings as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );

    if (roleErr) {
      console.warn("Falha ao salvar permissões do Dev em role_permissions:", roleErr);
    }

    // Também atualiza platform_settings como fallback
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

/* ==========================================================================
   GESTÃO DA TAG CEO (DIRETORIA EXECUTIVA / VIP OURO)
   Acesso e atribuição ESTRITAMENTE restritos a portadores da Tag Dev
   ========================================================================== */

export const CEO_PERMS_KEY = "tw_ceo_tag_permissions_v1";
export const CEO_CONFIG_KEY = "tw_ceo_config_v1";

export interface CeoConfiguration {
  enabled: boolean;
  badgeLabel: string;
  badgeColor: string;
  description: string;
  executiveBypassLevel: boolean;
  activeCeoUserIds: string[];
  // Módulos do Painel CEO configurados pelos Desenvolvedores
  allowManageBot: boolean;
  allowWebhooks: boolean;
  allowFinancials: boolean;
  allowAnnouncements: boolean;
  showRealBalance: boolean;
  updatedAt?: string;
}

export const DEFAULT_CEO_CONFIG: CeoConfiguration = {
  enabled: true,
  badgeLabel: "CEO",
  badgeColor: "gold",
  description: "Diretoria Executiva da facção Twin Wheels. Gestão operacional avançada e liderança de negócios.",
  executiveBypassLevel: false,
  activeCeoUserIds: [],
  allowManageBot: true,
  allowWebhooks: true,
  allowFinancials: true,
  allowAnnouncements: true,
  showRealBalance: true,
};

export const DEFAULT_CEO_PERMISSIONS: string[] = [
  "view_ceo",
  "manage_ceo_bot",
  "bot_send_message",
  "bot_add_app",
  "bot_change_status",
  "bot_change_name",
  "bot_change_avatar",
  "bot_change_banner",
  "bot_change_presence",
  "bot_restart",
  "bot_power_toggle",
  "bot_invite",
  "bot_manage_roles",
  "manage_ceo_webhooks",
  "webhook_send_message",
  "webhook_test",
  "webhook_create",
  "webhook_edit",
  "webhook_delete",
  "webhook_toggle_active",
  "webhook_copy_url",
  "webhook_view_code",
  "webhook_save_config",
  "view_ceo_financials",
  "view_dashboard",
  "view_cash_fund",
  "manage_cash_fund",
  "view_stock",
  "view_movements",
  "create_movement",
  "reverse_movement",
  "view_baus",
  "manage_baus",
  "view_all_movements",
  "view_sales",
  "create_sale",
  "reverse_sale",
  "view_products",
  "manage_products",
  "view_categories",
  "manage_categories",
  "view_members",
  "view_sensitive_data",
  "approve_requests",
  "promote_members",
  "edit_members",
  "view_consolidated_financials",
  "manage_roles",
  "manage_announcements",
  "view_rankings",
  "view_performance",
  "inspect_member_performance",
  "view_goals",
  "manage_goals",
  "view_hierarchy",
  "view_audit",
  "view_profile",
  "view_financials",
  "manage_members",
  "view_all_sales",
  "view_chat",
  "create_chat_group",
  "manage_chat_groups",
  "view_absences",
  "manage_absences",
  "view_all_absences",
  "view_patch_notes",
  "view_tickets",
  "create_ticket",
  "view_all_tickets",
  "manage_tickets",
  "view_notifications",
  "send_notifications",
  "manage_notifications",
];

/**
 * Helper síncrono para verificar se o usuário ou membro possui a Tag CEO ativa
 */
export function isUserCeo(
  profile?: Profile | null | undefined,
  member?: any
): boolean {
  if (profile?.is_ceo === true || profile?.custom_theme?.is_ceo === true) return true;
  if (member?.is_ceo === true || member?.custom_theme?.is_ceo === true) return true;
  return false;
}

/**
 * Carrega a lista de permissões da Tag CEO persistidas no Supabase / LocalStorage
 */
export async function getCeoTagPermissions(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<string[]> {
  // Leitura aberta para avaliação de permissões em tempo de execução
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "ceo")
      .maybeSingle();

    if (!error && data && Array.isArray(data.permissions)) {
      const perms = data.permissions.map(String);
      if (typeof window !== "undefined") {
        localStorage.setItem(CEO_PERMS_KEY, JSON.stringify(perms));
      }
      return perms;
    }
  } catch (err) {
    console.warn("Falha ao buscar permissões da Tag CEO no Supabase:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(CEO_PERMS_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
  }

  return DEFAULT_CEO_PERMISSIONS;
}

export const CEO_CONFIG_EVENT = "tw_ceo_config_updated";

/**
 * Obtém síncronamente as permissões da Tag CEO persistidas em localStorage ou default
 */
export function getCeoTagPermissionsSync(): string[] {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(CEO_PERMS_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
  }
  return DEFAULT_CEO_PERMISSIONS;
}

/**
 * Salva a matriz de permissões da Tag CEO (Apenas Desenvolvedores)
 */
export async function saveCeoTagPermissions(
  permissions: string[],
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(CEO_PERMS_KEY, JSON.stringify(permissions));
      window.dispatchEvent(new CustomEvent(CEO_CONFIG_EVENT, { detail: permissions }));
      window.dispatchEvent(new Event("storage"));
    }

    const { error } = await supabase.from("role_permissions").upsert(
      {
        level: "ceo",
        nivel: "ceo",
        permissions: permissions as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );

    if (error) {
      console.warn("Falha ao salvar permissões da Tag CEO em role_permissions:", error);
    }
  } catch (err) {
    console.error("Erro ao salvar permissões da Tag CEO:", err);
    throw err;
  }
}

/**
 * Carrega a configuração geral da Tag CEO
 */
export async function getCeoConfiguration(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<CeoConfiguration> {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "system_ceo_config")
      .maybeSingle();

    if (!error && data && data.permissions && typeof data.permissions === "object") {
      const merged = { ...DEFAULT_CEO_CONFIG, ...(data.permissions as any) };
      if (typeof window !== "undefined") {
        localStorage.setItem(CEO_CONFIG_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch (err) {
    console.warn("Falha ao ler configuração da Tag CEO no Supabase:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(CEO_CONFIG_KEY);
      if (local) {
        return { ...DEFAULT_CEO_CONFIG, ...JSON.parse(local) };
      }
    } catch {}
  }

  return DEFAULT_CEO_CONFIG;
}

/**
 * Salva a configuração da Tag CEO (Apenas Desenvolvedores)
 */
export async function saveCeoConfiguration(
  config: CeoConfiguration,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(CEO_CONFIG_KEY, JSON.stringify(config));
      window.dispatchEvent(new CustomEvent(CEO_CONFIG_EVENT, { detail: config }));
      window.dispatchEvent(new Event("storage"));
    }

    const { error } = await supabase.from("role_permissions").upsert(
      {
        level: "system_ceo_config",
        nivel: "system_ceo_config",
        permissions: config as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );

    if (error) {
      console.warn("Falha ao salvar system_ceo_config no Supabase:", error);
    }
  } catch (err) {
    console.error("Erro ao salvar configuração da Tag CEO:", err);
    throw err;
  }
}

/**
 * Ativa ou desativa a Tag CEO para um membro da facção.
 * REGRA ESTRITA: Apenas quem possui a Tag Dev (is_developer === true) pode executar!
 */
export async function toggleMemberCeoTag(
  targetUserId: string,
  enable: boolean,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<{ success: boolean; is_ceo: boolean }> {
  assertDeveloperAccess(user, profile, level);

  if (!targetUserId) {
    throw new Error("ID do usuário alvo inválido.");
  }

  // 1. Busca o perfil atual do membro
  const { data: targetProfile, error: fetchErr } = await (supabase.from("profiles" as any))
    .select("user_id, nome, nickname, custom_theme")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`Falha ao buscar perfil do membro: ${fetchErr.message}`);
  }

  const existingTheme = (targetProfile as any)?.custom_theme || {};
  const updatedTheme = {
    ...existingTheme,
    is_ceo: enable,
  };

  // 2. Atualiza no perfil do membro (profiles.is_ceo e profiles.custom_theme)
  const { error: updateErr } = await (supabase.from("profiles" as any))
    .update({
      is_ceo: enable,
      custom_theme: updatedTheme,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", targetUserId);

  if (updateErr) {
    throw new Error(`Falha ao atualizar status de CEO: ${updateErr.message}`);
  }

  // 3. Atualiza a lista de IDs de CEO na configuração central
  try {
    const currentConfig = await getCeoConfiguration(user, profile, level);
    const activeSet = new Set(currentConfig.activeCeoUserIds || []);
    if (enable) {
      activeSet.add(targetUserId);
    } else {
      activeSet.delete(targetUserId);
    }
    await saveCeoConfiguration(
      {
        ...currentConfig,
        activeCeoUserIds: Array.from(activeSet),
        updatedAt: new Date().toISOString(),
      },
      user,
      profile,
      level
    );
  } catch (err) {
    console.warn("Falha ao sincronizar activeCeoUserIds:", err);
  }

  // 4. Registra no log de auditoria
  try {
    const { logAuditAction } = await import("@/lib/app-api");
    const targetName = (targetProfile as any)?.nickname || (targetProfile as any)?.nome || targetUserId;
    const actorName = profile?.nickname || profile?.nome || "Desenvolvedor";

    await logAuditAction(
      enable ? "conceder_tag_ceo" : "revogar_tag_ceo",
      "membros",
      {
        alvo_user_id: targetUserId,
        alvo_nome: targetName,
        executado_por: actorName,
        novo_status: enable ? "CEO Ativado" : "CEO Desativado",
        timestamp: new Date().toISOString(),
      }
    );
  } catch (auditErr) {
    console.warn("Falha ao registrar auditoria de CEO:", auditErr);
  }

  return { success: true, is_ceo: enable };
}

/**
 * Ativa ou desativa a Tag Dev para um membro da facção.
 * REGRA ESTRITA: Apenas quem possui a Tag Dev (is_developer === true) pode executar!
 */
export async function toggleMemberDevTag(
  targetUserId: string,
  enable: boolean,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<{ success: boolean; is_developer: boolean }> {
  assertDeveloperAccess(user, profile, level);

  if (!targetUserId) {
    throw new Error("ID do usuário alvo inválido.");
  }

  // 1. Busca o perfil atual do membro
  const { data: targetProfile, error: fetchErr } = await (supabase.from("profiles" as any))
    .select("user_id, nome, nickname, is_developer")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`Falha ao buscar perfil do membro: ${fetchErr.message}`);
  }

  // 2. Atualiza no perfil do membro (profiles.is_developer)
  const { error: updateErr } = await (supabase.from("profiles" as any))
    .update({
      is_developer: enable,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", targetUserId);

  if (updateErr) {
    throw new Error(`Falha ao atualizar status de Desenvolvedor: ${updateErr.message}`);
  }

  // 3. Registra no log de auditoria
  try {
    const { logAuditAction } = await import("@/lib/app-api");
    const targetName = (targetProfile as any)?.nickname || (targetProfile as any)?.nome || targetUserId;
    const actorName = profile?.nickname || profile?.nome || "Desenvolvedor";

    await logAuditAction(
      enable ? "conceder_tag_dev" : "revogar_tag_dev",
      "membros",
      {
        alvo_user_id: targetUserId,
        alvo_nome: targetName,
        executado_por: actorName,
        novo_status: enable ? "Dev Ativado" : "Dev Desativado",
        timestamp: new Date().toISOString(),
      }
    );
  } catch (auditErr) {
    console.warn("Falha ao registrar auditoria de Dev:", auditErr);
  }

  return { success: true, is_developer: enable };
}
