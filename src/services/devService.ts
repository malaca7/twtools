import { supabase } from "@/integrations/supabase/client";
import type { AppUser, Profile } from "@/lib/app-types";
import { ALL_PERMISSIONS, type AppLevel, type Permission } from "@/lib/permissions";
import type { PanelColor } from "@/lib/panelTheme";
import { broadcastPermissionsRealtimeUpdate } from "@/lib/permissionsRealtimeSync";

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
  devThemeColor?: PanelColor;
  ceoThemeColor?: PanelColor;
  memberThemeColor?: PanelColor;
  devPanelIcon?: string;
  ceoPanelIcon?: string;
  memberPanelIcon?: string;
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
  {
    id: "lives_transmissoes",
    name: "Lives & Transmissões em Tempo Real",
    description: "Detecção automática de streams, vinculação de contas, encerramento forçado e alertas",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: true,
  },
  {
    id: "gamificacao_xp",
    name: "XP, Níveis & Insígnias (Gamificação)",
    description: "Gestão completa de XP, níveis e concessão manual de insígnias sem débito de saldo",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: true,
  },
  {
    id: "tickets_ouvidoria",
    name: "Tickets, Chamados & Ouvidoria",
    description: "Atendimento completo, notas internas, transferências e encerramento de tickets",
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
  devThemeColor: "rose",
  ceoThemeColor: "amber",
  memberThemeColor: "cyan",
  devPanelIcon: "Terminal",
  ceoPanelIcon: "Crown",
  memberPanelIcon: "Users",
};

const DEV_PERMS_KEY = "tw_dev_module_permissions_v1";
const ADMIN_PERMS_KEY = "tw_admin_tag_permissions_v1";
export const DEV_CONFIG_KEY = "tw_dev_module_config_v1";

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
  {
    id: "lives_transmissoes",
    name: "Lives & Transmissões em Tempo Real",
    description: "Detecção automática de streams, vinculação de contas, encerramento forçado e alertas",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: false,
  },
  {
    id: "gamificacao_xp",
    name: "XP, Níveis & Insígnias (Gamificação)",
    description: "Gestão completa de XP, níveis e concessão manual de insígnias sem débito de saldo",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: false,
  },
  {
    id: "tickets_ouvidoria",
    name: "Tickets, Chamados & Ouvidoria",
    description: "Atendimento completo, notas internas, transferências e encerramento de tickets",
    visualizar: true,
    criar: true,
    editar: true,
    excluir: true,
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
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): boolean {
  // Fundador permanente
  if (profile?.discord_id && DEV_DISCORD_IDS.includes(String(profile.discord_id))) return true;
  if ((user as any)?.discord_id && DEV_DISCORD_IDS.includes(String((user as any).discord_id))) return true;
  if (
    user?.id === "c5ef6dc6-e126-4027-80c3-319f0a870315" ||
    profile?.id === "860f8be7-6e51-4a47-8c14-9ca912d3c20a" ||
    (profile as any)?.user_id === "c5ef6dc6-e126-4027-80c3-319f0a870315"
  ) {
    return true;
  }

  // Se o perfil tem explicitamente is_developer === false, NUNCA conceder por localStorage
  if (profile && (profile as any).is_developer === false && level !== "desenvolvedor") {
    return false;
  }

  if (level === "desenvolvedor") return true;
  if ((profile as any)?.is_developer === true) return true;

  if (typeof window !== "undefined") {
    try {
      const devRaw = sessionStorage.getItem("tw_dev_impersonate") || localStorage.getItem("tw_dev_impersonate");
      if (devRaw) {
        const dev = JSON.parse(devRaw);
        if (dev.is_developer === true) {
          const ids = [profile?.id, profile?.user_id, user?.id].filter(Boolean).map(String);
          if (ids.length === 0 || ids.includes(String(dev.user_id)) || ids.includes(String(dev.id))) return true;
        }
      }
    } catch {}
  }
  return false;
}

/**
 * Validação backend/API que dispara erro HTTP 403 Forbidden caso o usuário não tenha a tag de desenvolvedor.
 */
export function assertDeveloperAccess(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): void {
  if (isUserDeveloper(user, profile, level)) return;
  throw new Error("Acesso Negado: Apenas membros com a Tag Dev têm permissão.");
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
  throw new Error("Acesso Negado: Apenas membros com a Tag CEO ou Tag Dev têm permissão.");
}

/**
 * Carrega a matriz de permissões do Módulo Dev da tabela role_permissions ou cache local.
 */
export async function getDevPermissions(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "desenvolvedor")
      .maybeSingle();

    let rawPerms = data?.permissions;
    if (typeof rawPerms === "string") {
      try {
        rawPerms = JSON.parse(rawPerms);
      } catch {}
    }

    // Registro existente no banco é a fonte única da verdade (mesmo vazio = nenhuma permissão marcada)
    if (!error && data && Array.isArray(rawPerms)) {
      const perms = rawPerms.map(String);
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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }

  return ALL_PERMISSIONS as any[];
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
  return ALL_PERMISSIONS as any[];
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
  const permStrings: string[] = permissions.map((p: any) =>
    typeof p === "string" ? p : p.id || p.name || p.key
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
      value: JSON.stringify(permStrings),
      updated_at: new Date().toISOString(),
    });

    void broadcastPermissionsRealtimeUpdate({
      type: "role_permissions",
      level: "desenvolvedor",
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

export function getDevThemeColorSync(): PanelColor {
  return getDevConfigurationSync().devThemeColor || "rose";
}

export function getCeoThemeColorSync(): PanelColor {
  return getDevConfigurationSync().ceoThemeColor || "amber";
}

export function getMemberThemeColorSync(): PanelColor {
  return getDevConfigurationSync().memberThemeColor || "cyan";
}

export function getDevPanelIconSync(): string {
  return getDevConfigurationSync().devPanelIcon || "Terminal";
}

export function getCeoPanelIconSync(): string {
  return getDevConfigurationSync().ceoPanelIcon || "Crown";
}

export function getMemberPanelIconSync(): string {
  return getDevConfigurationSync().memberPanelIcon || "Users";
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

let activeDevConfigFetchPromise: Promise<DevConfiguration> | null = null;

/**
 * Busca as configurações e cores dos painéis remotamente no Firebase RTDB / banco
 * e sincroniza no cache local de todos os membros e usuários conectados.
 */
export async function fetchRemoteDevConfiguration(forceFresh = false): Promise<DevConfiguration> {
  if (!forceFresh && activeDevConfigFetchPromise) {
    return activeDevConfigFetchPromise;
  }

  activeDevConfigFetchPromise = (async () => {
    try {
      let remoteConfig: any = null;

      try {
        const { rtdb } = await import("@/integrations/firebase/rtdb");
        const rtdbData = await rtdb.get<any>("role_permissions/system_dev_config");
        if (rtdbData) {
          remoteConfig = rtdbData.permissions || rtdbData;
        }
      } catch {}

      if (!remoteConfig) {
        try {
          const { data } = await supabase
            .from("role_permissions")
            .select("permissions")
            .eq("level", "system_dev_config")
            .maybeSingle();

          if (data?.permissions && typeof data.permissions === "object") {
            remoteConfig = data.permissions;
          }
        } catch {}
      }

      if (!remoteConfig) {
        try {
          const { data } = await (supabase.from as any)("platform_settings")
            .select("value")
            .eq("key", "dev_configuration")
            .maybeSingle();

          if (data?.value) {
            remoteConfig = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          }
        } catch {}
      }

      if (remoteConfig && typeof remoteConfig === "object") {
        const merged: DevConfiguration = {
          ...DEFAULT_DEV_CONFIG,
          ...remoteConfig,
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: merged }));
          } catch {}
        }
        return merged;
      }

      return getDevConfigurationSync();
    } finally {
      setTimeout(() => {
        activeDevConfigFetchPromise = null;
      }, 600);
    }
  })();

  return activeDevConfigFetchPromise;
}

/**
 * Carrega as configurações do Módulo Dev com prioridade para a sincronização remota.
 */
export async function getDevConfiguration(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<DevConfiguration> {
  assertDeveloperAccess(user, profile, level);

  try {
    return await fetchRemoteDevConfiguration();
  } catch (err) {
    console.warn("Falha ao buscar configurações Dev remotas, usando cache local:", err);
  }

  return getDevConfigurationSync();
}

/**
 * Salva as configurações do Módulo Dev no Firebase RTDB, localStorage e Supabase.
 */
export async function saveDevConfiguration(
  config: DevConfiguration,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  const cleanConfig: DevConfiguration = {
    ...DEFAULT_DEV_CONFIG,
    ...config,
  };

  // 1. Salva localmente e emite evento imediato
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(cleanConfig));
      window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: cleanConfig }));
      window.dispatchEvent(new Event("storage"));
    }
  } catch {}

  // 2. Persiste diretamente no Firebase RTDB para propagação em tempo real via WebSocket
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set("role_permissions/system_dev_config", {
      level: "system_dev_config",
      nivel: "system_dev_config",
      permissions: cleanConfig as any,
      updated_at: new Date().toISOString(),
    });
  } catch (fbErr) {
    console.warn("Aviso ao salvar system_dev_config no RTDB:", fbErr);
  }

  // 3. Persiste no Supabase em role_permissions e platform_settings
  try {
    await supabase.from("role_permissions").upsert(
      {
        level: "system_dev_config",
        nivel: "system_dev_config",
        permissions: cleanConfig as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );

    await (supabase.from as any)("platform_settings").upsert({
      key: "dev_configuration",
      value: JSON.stringify(cleanConfig),
      updated_at: new Date().toISOString(),
    });

    void broadcastPermissionsRealtimeUpdate({
      type: "role_permissions",
      level: "system_dev_config",
    });
  } catch (err) {
    console.warn("Aviso ao salvar dev_configuration no Supabase:", err);
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
    if (typeof window !== "undefined") {
      localStorage.setItem("tw_force_cache_purge", JSON.stringify(record));
    }

    await fetch(`https://rfdrive-fd805-default-rtdb.firebaseio.com/role_permissions/system_force_cache_purge.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "system_force_cache_purge",
        nivel: "system_force_cache_purge",
        permissions: record as any,
        updated_at: new Date().toISOString(),
      }),
    }).catch(() => {});

    try {
      await supabase.from("role_permissions").upsert(
        {
          level: "system_force_cache_purge",
          nivel: "system_force_cache_purge",
          permissions: record as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "level" }
      );
    } catch {}

    try {
      const channel = supabase.channel("system-force-cache-purge-channel");
      await channel.send({
        type: "broadcast",
        event: "force_cache_purge",
        payload: record,
      });
    } catch {}
  } catch (err) {
    console.warn("Aviso ao emitir ordem de limpeza de cache:", err);
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
   GESTÃO DA TAG CEO (DIRETORIA EXECUTIVA)
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
  allowStockAdjustments: boolean;
  allowAnnouncements: boolean;
  showRealBalance: boolean;
  themeColor?: PanelColor;
  updatedAt?: string;
}

export const DEFAULT_CEO_CONFIG: CeoConfiguration = {
  enabled: true,
  badgeLabel: "CEO",
  badgeColor: "gold",
  themeColor: "amber",
  description: "Diretoria Executiva do grupo Twin Wheels. Gestão operacional avançada e liderança de negócios.",
  executiveBypassLevel: false,
  activeCeoUserIds: [],
  allowManageBot: true,
  allowWebhooks: true,
  allowFinancials: true,
  allowStockAdjustments: true,
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
  "view_ceo_stock_adjustments",
  "manage_ceo_stock_adjustments",
  "ceo_adjust_stock_balance",
  "ceo_stock_add",
  "ceo_stock_remove",
  "view_ceo_tag_permissions",
  "manage_ceo_tag_permissions",
  "create_ceo_tag",
  "edit_ceo_tag",
  "delete_ceo_tag",
  "manage_ceo_tag_permissions_detail",
  "manage_ceo_tag_rules",
  "assign_ceo_tag",
  "view_ceo_warnings",
  "manage_ceo_warnings",
  // Permissões de Selos de Verificação CEO
  "verification.manage",
  "verification.review",
  "verification.grant_direct",
  "verification.revoke",
  "verification.config",
  "verification.requirements",
  "verification.audit",
  "view_warnings",
  "view_all_warnings",
  "create_warning",
  "create_suspension",
  "edit_warning",
  "revoke_warning",
  "delete_warning",
  "view_warning_details",
  "export_warnings",
  "manage_warnings",
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
  "productions.view",
  "productions.create",
  "productions.edit",
  "productions.delete",
  "view_productions",
  "create_production",
  "warehouse.view",
  "warehouse.transfer",
  "warehouse.transfer_storage",
  "warehouse.transfer_sale",
  "warehouse.adjust",
  "warehouse.history",
  "view_warehouse",
  "production_management.view",
  "production_management.products",
  "production_management.raw_materials",
  "production_management.productions",
  "production_management.settings",
  "production_management.reports",
  "view_production_management",
  "sales.view",
  "sales.create",
  "sales.edit",
  "sales.cancel",
  "sales.history",
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
  "edit_profile_data",
  "edit_profile_banner",
  "edit_profile_bio",
  "edit_profile_custom_url",
  "edit_profile_appearance",
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
  "atendimento_tickets.view",
  "view_atendimento_tickets",
  "create_ticket",
  "reply_tickets",
  "view_all_tickets",
  "claim_tickets",
  "transfer_tickets",
  "change_ticket_status",
  "internal_notes_tickets",
  "manage_ticket_members",
  "close_tickets",
  "reopen_tickets",
  "delete_tickets",
  "manage_tickets",
  "view_notifications",
  "send_notifications",
  "manage_notifications",
  "view_lives",
  "link_stream_account",
  "manage_stream_accounts",
  "force_end_live_session",
  "simulate_live_stream",
  "configure_stream_api",
  "view_stream_logs",
  "manage_lives",
  "view_life",
  "life_view_following",
  "life_view_bookmarks",
  "post_life",
  "life_post_image",
  "life_post_video",
  "life_mention_members",
  "life_use_hashtags",
  "life_like_posts",
  "life_bookmark_posts",
  "life_comment_posts",
  "life_delete_own_comment",
  "life_delete_own_post",
  "life_follow_members",
  "life_pin_posts",
  "life_moderate_posts",
  "life_moderate_comments",
  "manage_life",
  // Escala de Ação
  "escalas.view",
  "escalas.details",
  "escalas.create",
  "escalas.edit",
  "escalas.delete",
  "escalas.publish",
  "escalas.cancel",
  "escalas.manage_members",
  "escalas.add_participants",
  "escalas.remove_participants",
  "escalas.confirm_presence",
  "escalas.manage_slots",
  "escalas.substitute",
  "escalas.history",
  "escalas.settings",
  // Matérias-Primas
  "raw_materials.view",
  "raw_materials.create",
  "raw_materials.edit",
  "raw_materials.delete",
  "raw_materials.adjust",
  "raw_materials.transfer_bau",
  "raw_materials.history",
];

/**
 * Helper síncrono para verificar se o usuário ou membro possui a Tag CEO ativa
 */
export function isUserCeo(
  profile?: Profile | null | undefined,
  member?: any
): boolean {
  // Se explicitamente falso, NÃO é CEO
  if (profile && profile.is_ceo === false && (profile as any)?.cargo !== "ceo" && (profile as any)?.nivel !== "ceo") return false;
  if (member && member.is_ceo === false && member.cargo !== "ceo" && member.nivel !== "ceo") return false;

  if (profile?.is_ceo === true || profile?.custom_theme?.is_ceo === true) return true;
  if (member?.is_ceo === true || member?.custom_theme?.is_ceo === true) return true;
  if ((profile as any)?.role === "ceo" || (profile as any)?.cargo === "ceo" || (profile as any)?.nivel === "ceo") return true;
  if ((member as any)?.role === "ceo" || (member as any)?.cargo === "ceo" || (member as any)?.nivel === "ceo") return true;

  if (typeof window !== "undefined") {
    try {
      const devRaw = sessionStorage.getItem("tw_dev_impersonate") || localStorage.getItem("tw_dev_impersonate");
      if (devRaw) {
        const dev = JSON.parse(devRaw);
        if (dev.is_ceo === true || dev.custom_theme?.is_ceo === true) {
          const ids = [profile?.id, profile?.user_id, member?.id, member?.user_id].filter(Boolean).map(String);
          if (ids.length === 0 || ids.includes(String(dev.user_id)) || ids.includes(String(dev.id))) return true;
        }
      }
    } catch {}
  }
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

    let rawPerms = data?.permissions;
    if (typeof rawPerms === "string") {
      try {
        rawPerms = JSON.parse(rawPerms);
      } catch {}
    }

    if (!error && data && Array.isArray(rawPerms)) {
      const perms = rawPerms.map(String);
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

    await fetch(`https://rfdrive-fd805-default-rtdb.firebaseio.com/role_permissions/ceo.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "ceo",
        nivel: "ceo",
        permissions: permissions as any,
        updated_at: new Date().toISOString(),
      }),
    }).catch(() => {});

    try {
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
    } catch {}

    void broadcastPermissionsRealtimeUpdate({
      type: "role_permissions",
      level: "ceo",
    });
  } catch (err) {
    console.warn("Aviso ao salvar permissões da Tag CEO:", err);
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
        localStorage.setItem("tw_ceo_config", JSON.stringify(merged));
      }
      return merged;
    }
  } catch (err) {
    console.warn("Falha ao ler configuração da Tag CEO no Supabase:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(CEO_CONFIG_KEY) || localStorage.getItem("tw_ceo_config");
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
      localStorage.setItem("tw_ceo_config", JSON.stringify(config));
      window.dispatchEvent(new CustomEvent(CEO_CONFIG_EVENT, { detail: config }));
      window.dispatchEvent(new Event("storage"));
    }

    await fetch(`https://rfdrive-fd805-default-rtdb.firebaseio.com/role_permissions/system_ceo_config.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        level: "system_ceo_config",
        nivel: "system_ceo_config",
        permissions: config as any,
        updated_at: new Date().toISOString(),
      }),
    }).catch(() => {});

    try {
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
    } catch {}

    void broadcastPermissionsRealtimeUpdate({
      type: "ceo_config",
    });
  } catch (err) {
    console.warn("Aviso ao salvar configuração da Tag CEO:", err);
  }
}

function isValidUuid(val: any): boolean {
  return (
    typeof val === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim())
  );
}

function extractTargetCandidateIds(target: any): string[] {
  const ids = new Set<string>();
  if (!target) return [];
  if (typeof target === "string") {
    if (target.trim()) ids.add(target.trim());
    return Array.from(ids);
  }
  if (typeof target === "object") {
    if (target.user_id) ids.add(String(target.user_id).trim());
    if (target.id) ids.add(String(target.id).trim());
    if (target.member_id) ids.add(String(target.member_id).trim());
    if (target.discord_id) ids.add(String(target.discord_id).trim());
  }
  return Array.from(ids).filter(Boolean);
}

/**
 * Ativa ou desativa a Tag CEO para um membro do grupo.
 * REGRA ESTRITA: Apenas quem possui a Tag Dev (is_developer === true) pode executar!
 */
export async function toggleMemberCeoTag(
  target: any,
  enable: boolean,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<{ success: boolean; is_ceo: boolean }> {
  assertDeveloperAccess(user, profile, level);

  const candidateIds = extractTargetCandidateIds(target);
  if (candidateIds.length === 0) {
    throw new Error("ID do usuário alvo inválido.");
  }

  const primaryTargetId = candidateIds[0];
  const now = new Date().toISOString();
  let targetName = typeof target === "object" ? (target.nickname || target.nome || primaryTargetId) : primaryTargetId;
  let existingTheme: any = (typeof target === "object" && target.custom_theme) ? target.custom_theme : {};

  // 1. Atualiza no Firebase RTDB (profiles) estritamente pelas chaves únicas do usuário
  const matchedKeys: string[] = [];
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const fbProfiles = await rtdb.get<Record<string, any>>("profiles");
    if (fbProfiles && typeof fbProfiles === "object") {
      for (const [k, v] of Object.entries(fbProfiles)) {
        if (!v) continue;
        const vIds = [v.user_id, v.id, k].filter(Boolean).map(String);
        const matches = vIds.some((id) => candidateIds.includes(id));
        if (matches) {
          matchedKeys.push(k);
          if (v.user_id) candidateIds.push(String(v.user_id));
          if (v.id) candidateIds.push(String(v.id));
          candidateIds.push(k);
          targetName = v.nickname || v.nome || targetName;
          existingTheme = v.custom_theme || existingTheme;

          const updatedTheme = { ...existingTheme, is_ceo: enable };
          await rtdb.update(`profiles/${k}`, {
            is_ceo: enable,
            custom_theme: updatedTheme,
            updated_at: now,
          }).catch(() => {});
        }
      }
    }

    // Apenas atualiza chave primária se já existir no RTDB para evitar nós fantasmas
    if (matchedKeys.length === 0 && fbProfiles && fbProfiles[primaryTargetId]) {
      await rtdb.update(`profiles/${primaryTargetId}`, {
        is_ceo: enable,
        custom_theme: { ...existingTheme, is_ceo: enable },
        updated_at: now,
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("Aviso ao atualizar profiles no RTDB:", err);
  }

  // Deduplica candidateIds (apenas UUIDs e chaves reais)
  const uniqueCandidateIds = Array.from(new Set(candidateIds.filter(Boolean).map(String)));

  // 2. Atualiza no Supabase (profiles) estritamente por id e user_id (UUIDs)
  try {
    const orConditions: string[] = [];
    for (const cid of uniqueCandidateIds) {
      if (isValidUuid(cid)) {
        orConditions.push(`id.eq.${cid}`);
        orConditions.push(`user_id.eq.${cid}`);
      }
    }

    if (orConditions.length > 0) {
      const { data: targetProfiles } = await (supabase.from("profiles" as any))
        .select("id, user_id, game_id, discord_id, nome, nickname, custom_theme")
        .or(orConditions.join(","));

      if (targetProfiles && targetProfiles.length > 0) {
        for (const tp of targetProfiles) {
          targetName = tp.nickname || tp.nome || targetName;
          const updatedTheme = { ...(tp.custom_theme || existingTheme || {}), is_ceo: enable };
          const colToMatch = isValidUuid(tp.id) ? "id" : "user_id";
          const valToMatch = tp[colToMatch];

          await (supabase.from("profiles" as any))
            .update({
              is_ceo: enable,
              custom_theme: updatedTheme,
              updated_at: now,
            })
            .eq(colToMatch, valToMatch)
            .catch(() => {});
        }
      }
    }

    // Se estiver desativando, sincroniza user_roles no Supabase caso estivesse como ceo
    if (!enable) {
      for (const cid of uniqueCandidateIds) {
        if (isValidUuid(cid)) {
          await (supabase.from("user_roles" as any))
            .update({ nivel: "membro" })
            .eq("user_id", cid)
            .eq("nivel", "ceo")
            .catch(() => {});
        }
      }
    } else {
      for (const cid of uniqueCandidateIds) {
        if (isValidUuid(cid)) {
          await (supabase.from("user_roles" as any))
            .update({ nivel: "ceo" })
            .eq("user_id", cid)
            .eq("nivel", "membro")
            .catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn("Aviso ao atualizar profiles no Supabase:", err);
  }

  // 3. Sincroniza em member_tag_assignments (tag_id: 'ceo')
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    if (enable) {
      for (const cid of uniqueCandidateIds) {
        if (!isValidUuid(cid)) continue;
        const assignmentKey = `${cid}_ceo`;
        const assignmentData = {
          id: assignmentKey,
          member_id: cid,
          user_id: cid,
          tag_id: "ceo",
          assigned_by: isValidUuid(user?.id) ? user?.id : null,
          created_at: now,
        };
        await rtdb.set(`member_tag_assignments/${assignmentKey}`, assignmentData).catch(() => {});
        await (supabase.from("member_tag_assignments" as any))
          .upsert(assignmentData, { onConflict: "id" })
          .catch(async () => {
            await (supabase.from("member_tag_assignments" as any)).insert(assignmentData).catch(() => {});
          });
      }
    } else {
      // Remove de RTDB member_tag_assignments
      const list = await rtdb.getList<any>("member_tag_assignments").catch(() => []);
      for (const item of list) {
        if (
          item &&
          item.tag_id === "ceo" &&
          (uniqueCandidateIds.includes(String(item.member_id)) ||
            uniqueCandidateIds.includes(String(item.user_id)) ||
            uniqueCandidateIds.includes(String(item.id)))
        ) {
          const key = item._key || item.id || `${item.member_id || item.user_id}_${item.tag_id}`;
          await rtdb.remove(`member_tag_assignments/${key}`).catch(() => {});
        }
      }
      for (const cid of uniqueCandidateIds) {
        await rtdb.remove(`member_tag_assignments/${cid}_ceo`).catch(() => {});
        if (isValidUuid(cid)) {
          await (supabase.from("member_tag_assignments" as any))
            .delete()
            .eq("tag_id", "ceo")
            .eq("member_id", cid)
            .catch(() => {});
          await (supabase.from("member_tag_assignments" as any))
            .delete()
            .eq("tag_id", "ceo")
            .eq("user_id", cid)
            .catch(() => {});
        }
      }
    }

    // Sincroniza cargo no Discord se bot configurado
    const { triggerAutoDiscordTagSync } = await import("@/services/memberTagsService");
    for (const cid of uniqueCandidateIds) {
      if (isValidUuid(cid)) {
        void triggerAutoDiscordTagSync(cid, "ceo", enable ? "add" : "remove");
      }
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar member_tag_assignments (ceo):", err);
  }

  // 4. Atualiza a lista de IDs de CEO na configuração central (system_ceo_config)
  try {
    const currentConfig = await getCeoConfiguration(user, profile, level);
    const activeSet = new Set(currentConfig.activeCeoUserIds || []);
    if (enable) {
      for (const cid of uniqueCandidateIds) {
        if (isValidUuid(cid)) activeSet.add(cid);
      }
    } else {
      for (const cid of uniqueCandidateIds) {
        activeSet.delete(cid);
      }
    }
    await saveCeoConfiguration(
      {
        ...currentConfig,
        activeCeoUserIds: Array.from(activeSet),
        updatedAt: now,
      },
      user,
      profile,
      level
    );
  } catch (err) {
    console.warn("Falha ao sincronizar activeCeoUserIds:", err);
  }

  // 5. Se o alvo for o usuário logado atualmente ou se corresponder ao impersonate, atualiza cache de sessão local
  if (typeof window !== "undefined") {
    try {
      const devRaw = localStorage.getItem("tw_dev_impersonate");
      if (devRaw) {
        const devObj = JSON.parse(devRaw);
        const matchesTarget = uniqueCandidateIds.some((id) =>
          id === String(devObj.user_id) || id === String(devObj.id)
        );
        if (matchesTarget) {
          devObj.is_ceo = enable;
          if (devObj.custom_theme) devObj.custom_theme.is_ceo = enable;
          else devObj.custom_theme = { is_ceo: enable };
          localStorage.setItem("tw_dev_impersonate", JSON.stringify(devObj));
          sessionStorage.setItem("tw_dev_impersonate", JSON.stringify(devObj));
        }
      }
    } catch {}

    for (const cid of uniqueCandidateIds) {
      window.dispatchEvent(
        new CustomEvent("tw_auth_reload", {
          detail: {
            type: "tag_toggle",
            tag: "ceo",
            status: enable,
            userId: cid,
            candidateIds: uniqueCandidateIds,
          },
        })
      );
    }
    window.dispatchEvent(new Event("tw_permissions_synced"));
    window.dispatchEvent(new Event("tw_ceo_config_updated"));
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new Event("tw_member_tags_updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // 6. Registra no log de auditoria
  try {
    const { logAuditAction } = await import("@/lib/app-api");
    const actorName = profile?.nickname || profile?.nome || "Desenvolvedor";
    await logAuditAction(
      enable ? "conceder_tag_ceo" : "revogar_tag_ceo",
      "membros",
      {
        alvo_user_id: primaryTargetId,
        alvo_nome: targetName,
        executado_por: actorName,
        novo_status: enable ? "CEO Ativado" : "CEO Desativado",
        timestamp: now,
      }
    );
  } catch (auditErr) {
    console.warn("Falha ao registrar auditoria de CEO:", auditErr);
  }

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set("system_realtime_events/latest", {
      type: "tag_toggle",
      tag: "ceo",
      status: enable,
      userId: primaryTargetId,
      candidateIds: uniqueCandidateIds,
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}

  void broadcastPermissionsRealtimeUpdate({
    type: "tag_toggle",
    tag: "ceo",
    status: enable,
    userId: primaryTargetId,
    candidateIds: uniqueCandidateIds,
  });
  void broadcastPermissionsRealtimeUpdate({
    type: "profiles",
    userId: primaryTargetId,
    candidateIds: uniqueCandidateIds,
  });
  void broadcastPermissionsRealtimeUpdate({
    type: "ceo_config",
    candidateIds: uniqueCandidateIds,
  });

  return { success: true, is_ceo: enable };
}

/**
 * Ativa ou desativa a Tag Dev para um membro do grupo.
 * REGRA ESTRITA: Apenas quem possui a Tag Dev (is_developer === true) pode executar!
 */
export async function toggleMemberDevTag(
  target: any,
  enable: boolean,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<{ success: boolean; is_developer: boolean }> {
  assertDeveloperAccess(user, profile, level);

  const candidateIds = extractTargetCandidateIds(target);
  if (candidateIds.length === 0) {
    throw new Error("ID do usuário alvo inválido.");
  }

  const primaryTargetId = candidateIds[0];
  const now = new Date().toISOString();
  let targetName = typeof target === "object" ? (target.nickname || target.nome || primaryTargetId) : primaryTargetId;

  // 1. Atualiza no Firebase RTDB (profiles) estritamente pelas chaves únicas do usuário
  const matchedKeys: string[] = [];
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const fbProfiles = await rtdb.get<Record<string, any>>("profiles");
    if (fbProfiles && typeof fbProfiles === "object") {
      for (const [k, v] of Object.entries(fbProfiles)) {
        if (!v) continue;
        const vIds = [v.user_id, v.id, k].filter(Boolean).map(String);
        const matches = vIds.some((id) => candidateIds.includes(id));
        if (matches) {
          matchedKeys.push(k);
          if (v.user_id) candidateIds.push(String(v.user_id));
          if (v.id) candidateIds.push(String(v.id));
          candidateIds.push(k);
          targetName = v.nickname || v.nome || targetName;

          await rtdb.update(`profiles/${k}`, {
            is_developer: enable,
            updated_at: now,
          }).catch(() => {});
        }
      }
    }

    // Apenas atualiza chave primária se já existir no RTDB para evitar nós fantasmas
    if (matchedKeys.length === 0 && fbProfiles && fbProfiles[primaryTargetId]) {
      await rtdb.update(`profiles/${primaryTargetId}`, {
        is_developer: enable,
        updated_at: now,
      }).catch(() => {});
    }

    // Se estiver desativando e o usuário tinha nivel desenvolvedor, ajusta user_roles para evitar que continue dev
    if (!enable) {
      for (const cid of candidateIds) {
        if (isValidUuid(cid)) {
          const existingRole = await rtdb.get<any>(`user_roles/${cid}`).catch(() => null);
          if (existingRole && (existingRole.nivel === "desenvolvedor" || existingRole.nivel === "dev")) {
            await rtdb.update(`user_roles/${cid}`, {
              nivel: "membro",
              updated_at: now,
            }).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.warn("Aviso ao atualizar profiles no RTDB:", err);
  }

  // Deduplica candidateIds (apenas UUIDs e chaves reais)
  const uniqueCandidateIds = Array.from(new Set(candidateIds.filter(Boolean).map(String)));

  // 2. Atualiza no Supabase (profiles) com checagem rigorosa de tipos UUID vs texto
  try {
    const orConditions: string[] = [];
    for (const cid of uniqueCandidateIds) {
      if (isValidUuid(cid)) {
        orConditions.push(`id.eq.${cid}`);
        orConditions.push(`user_id.eq.${cid}`);
      }
    }

    if (orConditions.length > 0) {
      const { data: targetProfiles } = await (supabase.from("profiles" as any))
        .select("id, user_id, game_id, discord_id, nome, nickname, is_developer")
        .or(orConditions.join(","));

      if (targetProfiles && targetProfiles.length > 0) {
        for (const tp of targetProfiles) {
          targetName = tp.nickname || tp.nome || targetName;
          const colToMatch = isValidUuid(tp.id) ? "id" : "user_id";
          const valToMatch = tp[colToMatch];

          await (supabase.from("profiles" as any))
            .update({
              is_developer: enable,
              updated_at: now,
            })
            .eq(colToMatch, valToMatch)
            .catch(() => {});
        }
      }
    }

    // Se estiver desativando, sincroniza user_roles no Supabase caso estivesse como desenvolvedor
    if (!enable) {
      for (const cid of uniqueCandidateIds) {
        if (isValidUuid(cid)) {
          await (supabase.from("user_roles" as any))
            .update({ nivel: "membro" })
            .eq("user_id", cid)
            .eq("nivel", "desenvolvedor")
            .catch(() => {});
        }
      }
    } else {
      for (const cid of uniqueCandidateIds) {
        if (isValidUuid(cid)) {
          await (supabase.from("user_roles" as any))
            .update({ nivel: "desenvolvedor" })
            .eq("user_id", cid)
            .catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn("Aviso ao atualizar profiles no Supabase:", err);
  }

  // 3. Sincroniza em member_tag_assignments (tags 'dev' e 'desenvolvedor')
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const devTagVariants = ["dev", "desenvolvedor"];

    if (enable) {
      for (const cid of uniqueCandidateIds) {
        if (!isValidUuid(cid)) continue;
        const assignmentKey = `${cid}_dev`;
        const assignmentData = {
          id: assignmentKey,
          member_id: cid,
          user_id: cid,
          tag_id: "dev",
          assigned_by: isValidUuid(user?.id) ? user?.id : null,
          created_at: now,
        };
        await rtdb.set(`member_tag_assignments/${assignmentKey}`, assignmentData).catch(() => {});
        await (supabase.from("member_tag_assignments" as any))
          .upsert(assignmentData, { onConflict: "id" })
          .catch(async () => {
            await (supabase.from("member_tag_assignments" as any)).insert(assignmentData).catch(() => {});
          });
      }
    } else {
      // Remove de RTDB member_tag_assignments todas as variantes
      const list = await rtdb.getList<any>("member_tag_assignments").catch(() => []);
      for (const item of list) {
        if (
          item &&
          devTagVariants.includes(item.tag_id) &&
          (uniqueCandidateIds.includes(String(item.member_id)) ||
            uniqueCandidateIds.includes(String(item.user_id)) ||
            uniqueCandidateIds.includes(String(item.id)))
        ) {
          const key = item._key || item.id || `${item.member_id || item.user_id}_${item.tag_id}`;
          await rtdb.remove(`member_tag_assignments/${key}`).catch(() => {});
        }
      }
      for (const cid of uniqueCandidateIds) {
        for (const variant of devTagVariants) {
          await rtdb.remove(`member_tag_assignments/${cid}_${variant}`).catch(() => {});
        }
        if (isValidUuid(cid)) {
          for (const variant of devTagVariants) {
            await (supabase.from("member_tag_assignments" as any))
              .delete()
              .eq("tag_id", variant)
              .eq("member_id", cid)
              .catch(() => {});
            await (supabase.from("member_tag_assignments" as any))
              .delete()
              .eq("tag_id", variant)
              .eq("user_id", cid)
              .catch(() => {});
          }
        }
      }
    }

    // Sincroniza cargo no Discord se bot configurado
    const { triggerAutoDiscordTagSync } = await import("@/services/memberTagsService");
    for (const cid of uniqueCandidateIds) {
      if (isValidUuid(cid)) {
        void triggerAutoDiscordTagSync(cid, "dev", enable ? "add" : "remove");
      }
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar member_tag_assignments (dev):", err);
  }

  // 4. Se o alvo for o usuário logado atualmente ou impersonate, atualiza cache de sessão local
  if (typeof window !== "undefined") {
    try {
      const devRaw = localStorage.getItem("tw_dev_impersonate");
      if (devRaw) {
        const devObj = JSON.parse(devRaw);
        const matchesTarget = uniqueCandidateIds.some((id) =>
          id === String(devObj.user_id) || id === String(devObj.id)
        );
        if (matchesTarget) {
          devObj.is_developer = enable;
          localStorage.setItem("tw_dev_impersonate", JSON.stringify(devObj));
          sessionStorage.setItem("tw_dev_impersonate", JSON.stringify(devObj));
        }
      }
    } catch {}

    for (const cid of uniqueCandidateIds) {
      window.dispatchEvent(
        new CustomEvent("tw_auth_reload", {
          detail: {
            type: "tag_toggle",
            tag: "dev",
            status: enable,
            userId: cid,
            candidateIds: uniqueCandidateIds,
          },
        })
      );
    }
    window.dispatchEvent(new Event("tw_permissions_synced"));
    window.dispatchEvent(new Event("tw_dev_config_updated"));
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new Event("tw_member_tags_updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // 5. Registra no log de auditoria
  try {
    const { logAuditAction } = await import("@/lib/app-api");
    const actorName = profile?.nickname || profile?.nome || "Desenvolvedor";
    await logAuditAction(
      enable ? "conceder_tag_dev" : "revogar_tag_dev",
      "membros",
      {
        alvo_user_id: primaryTargetId,
        alvo_nome: targetName,
        executado_por: actorName,
        novo_status: enable ? "Dev Ativado" : "Dev Desativado",
        timestamp: now,
      }
    );
  } catch (auditErr) {
    console.warn("Falha ao registrar auditoria de Dev:", auditErr);
  }

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set("system_realtime_events/latest", {
      type: "tag_toggle",
      tag: "dev",
      status: enable,
      userId: primaryTargetId,
      candidateIds: uniqueCandidateIds,
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}

  void broadcastPermissionsRealtimeUpdate({
    type: "tag_toggle",
    tag: "dev",
    status: enable,
    userId: primaryTargetId,
    candidateIds: uniqueCandidateIds,
  });
  void broadcastPermissionsRealtimeUpdate({
    type: "profiles",
    userId: primaryTargetId,
    candidateIds: uniqueCandidateIds,
  });
  void broadcastPermissionsRealtimeUpdate({
    type: "dev_config",
    candidateIds: uniqueCandidateIds,
  });

  return { success: true, is_developer: enable };
}
