import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MaintenanceHistoryItem = {
  id: string;
  title: string;
  message: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  severity?: "warning" | "destructive" | "info";
  authorName?: string;
};

export type PlatformSettings = {
  // Faction Identity
  factionName: string;
  factionTag: string;
  factionType: string;
  slogan: string;
  description: string;

  // Session & Presence
  idleTimeoutSeconds: number;
  heartbeatSeconds: number;
  autoOfflineMinutes: number;

  // Operations & Rules
  allowMovementsWithoutBau: boolean;
  notifyPendingSignups: boolean;
  showConsolidatedCashToOperators: boolean;

  // Sounds & Audio
  soundEffectsEnabled: boolean;
  onlineAlertEnabled: boolean;
  soundVolume: number;
  notificationToastPosition: string;

  // Announcements
  showAnnouncementBanner: boolean;
  hideOldAnnouncementsDays: number;

  // Appearance & Theme
  themeStyle: string;
  cardStyle: string;
  fontFamily: string;
  glowEffectsEnabled: boolean;
  statusPulseEnabled: boolean;
  pageTransitionsEnabled: boolean;
  hoverZoomEnabled: boolean;
  borderGlowSpeed: string;
  brightness: number;
  contrast: number;

  // Extended Platform Information & RP Identity
  cityRpName?: string;
  cityRpTag?: string;
  fivemConnectUrl?: string;
  factionCode?: string;
  supportDiscordUrl?: string;
  factionDiscordUrl?: string;
  radioFrequency?: string;
  systemVersion?: string;
  platformLogoUrl?: string;
  platformBannerUrl?: string;
  platformFaviconUrl?: string;
  contactEmail?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  recruitmentFormUrl?: string;
  operatingHours?: string;
  headquartersLocation?: string;
  minRecruitAge?: string;
  minCityTime?: string;
  defaultNewRole?: string;
  weeklyGoalHours?: string;
  weeklyGoalFarm?: string;
  motd?: string;
  welcomeMessage?: string;
  motto?: string;
  rulesSummary?: string;

  // Sistema Global de Manutenção do Sistema & Status Notice
  maintenanceActive: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceEstimatedEnd: string; // ISO string
  maintenanceDurationMinutes: number;
  maintenanceStartedAt: string; // ISO string
  maintenanceSeverity: "warning" | "destructive" | "info";
  maintenanceAllowDevAccess: boolean;
  maintenanceHistory: MaintenanceHistoryItem[];

  systemStatusNotice?: string;
  showSystemStatusNotice?: boolean;
  systemStatusType?: "info" | "warning" | "destructive";

  // Footer Information & Customization
  footerFactionText?: string;
  footerDeveloperName?: string;
  footerDeveloperDiscord?: string;
  footerDeveloperRole?: string;
  footerCustomNote?: string;
  footerCopyrightText?: string;
  footerYear?: string; // "Automático" ou um ano específico
  footerShowYear?: boolean;
  footerShowDeveloperCredits?: boolean;
  footerShowDiscordCopy?: boolean;
  footerShowSupportLink?: boolean;
  footerShowVersion?: boolean;
  footerDividerSymbol?: string;

  // Start Pages / Landing Pages
  startPageUser?: string;
  startPageCeo?: string;
  startPageDev?: string;
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  factionName: "Twin Wheels",
  factionTag: "[TW]",
  factionType: "Gestão de grupo — GTA RP",
  slogan: "Gestão Interna · GTA RP",
  description: "Sistema interno de gestão do grupo Twin Wheels. Controle de estoque, vendas, membros, cargos, desempenho e muito mais.",

  idleTimeoutSeconds: 120,
  heartbeatSeconds: 15,
  autoOfflineMinutes: 10,

  allowMovementsWithoutBau: true,
  notifyPendingSignups: true,
  showConsolidatedCashToOperators: false,

  soundEffectsEnabled: true,
  onlineAlertEnabled: true,
  soundVolume: 60,
  notificationToastPosition: "top-right",

  showAnnouncementBanner: true,
  hideOldAnnouncementsDays: 7,

  themeStyle: "cyberpunk",
  cardStyle: "glassmorphism",
  fontFamily: "space_grotesk",
  glowEffectsEnabled: true,
  statusPulseEnabled: true,
  pageTransitionsEnabled: true,
  hoverZoomEnabled: true,
  borderGlowSpeed: "normal",
  brightness: 100,
  contrast: 100,

  // Extended Platform Information & RP Identity
  cityRpName: "Los Santos RP",
  cityRpTag: "LSRP",
  fivemConnectUrl: "connect cpx.rp",
  factionCode: "FAC-TW01",
  supportDiscordUrl: "https://discord.gg/twinwheels",
  factionDiscordUrl: "https://discord.gg/twinwheels",
  radioFrequency: "98.5 MHz",
  systemVersion: "v2.5.0",
  platformLogoUrl: "",
  platformBannerUrl: "",
  platformFaviconUrl: "",
  contactEmail: "contato@twinwheels.rp",
  instagramHandle: "@twinwheels.rp",
  tiktokHandle: "@twinwheels.rp",
  recruitmentFormUrl: "",
  operatingHours: "18:00h às 02:00h",
  headquartersLocation: "Perto do Píer · Setor Sul",
  minRecruitAge: "16 anos",
  minCityTime: "50 horas de voo",
  defaultNewRole: "Novato / Recruta",
  weeklyGoalHours: "10h semanais",
  weeklyGoalFarm: "100 insumos",
  motd: "Bora bater as metas da semana e manter o estoque abastecido!",
  welcomeMessage: "Bem-vindo à Twin Wheels! Leia as regras e procure um líder para sua integração.",
  motto: "Velocidade, lealdade e precisão em cada curva.",
  rulesSummary: "Respeito mútuo, lealdade à facção, prestação de contas dos baús e discrição total em ações externas.",
  // Sistema Global de Manutenção do Sistema & Status Notice
  maintenanceActive: false,
  maintenanceTitle: "Manutenção Preventiva de Sistema",
  maintenanceMessage: "Estamos realizando melhorias programadas e otimizações na infraestrutura. A plataforma retornará em instantes.",
  maintenanceEstimatedEnd: "",
  maintenanceDurationMinutes: 30,
  maintenanceStartedAt: "",
  maintenanceSeverity: "warning",
  maintenanceAllowDevAccess: true,
  maintenanceHistory: [],

  systemStatusNotice: "",
  showSystemStatusNotice: false,
  systemStatusType: "warning",

  // Footer Information & Customization
  footerFactionText: "Twin Wheels",
  footerDeveloperName: "malaca",
  footerDeveloperDiscord: "malaca7",
  footerDeveloperRole: "Desenvolvido por",
  footerCustomNote: "Gestão Operacional & Executiva GTA RP",
  footerCopyrightText: "Todos os direitos reservados.",
  footerYear: "Automático",
  footerShowYear: true,
  footerShowDeveloperCredits: true,
  footerShowDiscordCopy: true,
  footerShowSupportLink: true,
  footerShowVersion: true,
  footerDividerSymbol: "•",

  startPageUser: "/dashboard",
  startPageCeo: "/ceo/dashboard",
  startPageDev: "/dev",
};

const STORAGE_KEY = "tw_platform_settings";

const listeners = new Set<() => void>();
export function emitPlatformSettingsChange() {
  listeners.forEach((l) => l());
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "{}";
  return localStorage.getItem(STORAGE_KEY) || "{}";
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getPlatformSettings(): PlatformSettings {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw || raw === "{}" || raw === "null") return DEFAULT_PLATFORM_SETTINGS;
    return { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

/**
 * Fetches global platform settings configured by leadership from Supabase database.
 */
export async function fetchRemotePlatformSettings(): Promise<PlatformSettings> {
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "system_platform_settings")
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      const merged = { ...DEFAULT_PLATFORM_SETTINGS, ...(data.permissions as any) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      emitPlatformSettingsChange();
      return merged;
    }
  } catch (err) {
    console.warn("Erro ao buscar platform_settings remotas do banco:", err);
  }
  return getPlatformSettings();
}

/**
 * Saves platform settings locally and persists globally to Supabase DB for all members.
 */
export async function savePlatformSettings(settings: PlatformSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  emitPlatformSettingsChange();

  // 1. Broadcast instantâneo entre abas e janelas locais
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("tw_platform_settings_updated", { detail: settings }));
      const bc = new BroadcastChannel("tw_platform_settings_channel");
      bc.postMessage({ settings, timestamp: Date.now() });
      bc.close();
    } catch {}
  }

  // 2. Broadcast via Supabase Realtime para todos os membros conectados (<50ms)
  try {
    const realtimeChannel = supabase.channel("system-platform-settings");
    realtimeChannel.send({
      type: "broadcast",
      event: "platform_settings_updated",
      payload: { settings },
    });
  } catch {}

  // 3. Persistência em banco de dados Supabase
  try {
    let saveSuccess = false;
    try {
      const { error: rpcErr } = await supabase.rpc("save_role_permissions", {
        _level: "system_platform_settings",
        _permissions: settings as any,
      });
      if (!rpcErr) saveSuccess = true;
    } catch {}

    if (!saveSuccess) {
      await supabase.from("role_permissions").upsert(
        {
          level: "system_platform_settings",
          nivel: "system_platform_settings",
          permissions: settings as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "level" }
      );
    }
  } catch (err) {
    console.error("Erro ao sincronizar system_platform_settings no banco:", err);
  }
}

/**
 * Inicia a manutenção global do sistema com prazo e mensagem definidos
 */
export async function startPlatformMaintenance(params: {
  title?: string;
  message?: string;
  durationMinutes?: number;
  estimatedEnd?: string;
  severity?: "warning" | "destructive" | "info";
  authorName?: string;
  allowDevAccess?: boolean;
}) {
  const current = getPlatformSettings();
  const now = new Date();
  const duration = params.durationMinutes ?? current.maintenanceDurationMinutes ?? 30;
  const estimatedEnd =
    params.estimatedEnd ||
    new Date(now.getTime() + duration * 60 * 1000).toISOString();

  const updated: PlatformSettings = {
    ...current,
    maintenanceActive: true,
    maintenanceTitle: params.title || current.maintenanceTitle || "Manutenção do Sistema em Andamento",
    maintenanceMessage: params.message || current.maintenanceMessage || "Estamos realizando atualizações técnicas na infraestrutura. O sistema retornará em instantes.",
    maintenanceDurationMinutes: duration,
    maintenanceStartedAt: now.toISOString(),
    maintenanceEstimatedEnd: estimatedEnd,
    maintenanceSeverity: params.severity || current.maintenanceSeverity || "warning",
    maintenanceAllowDevAccess: params.allowDevAccess ?? true,
    // Sincroniza também o notice para retrocompatibilidade
    showSystemStatusNotice: true,
    systemStatusNotice: params.message || current.maintenanceMessage || "Sistema em manutenção programada.",
    systemStatusType: params.severity || "warning",
  };

  await savePlatformSettings(updated);
  return updated;
}

/**
 * Desativa/finaliza a manutenção global do sistema e registra no histórico
 */
export async function finishPlatformMaintenance(authorName?: string) {
  const current = getPlatformSettings();
  const now = new Date();

  let historyItem: MaintenanceHistoryItem | null = null;
  if (current.maintenanceStartedAt) {
    const started = new Date(current.maintenanceStartedAt).getTime();
    const durationMin = Math.max(1, Math.round((now.getTime() - started) / (1000 * 60)));
    historyItem = {
      id: "maint_" + Date.now(),
      title: current.maintenanceTitle || "Manutenção do Sistema",
      message: current.maintenanceMessage || "",
      startedAt: current.maintenanceStartedAt,
      endedAt: now.toISOString(),
      durationMinutes: durationMin,
      severity: current.maintenanceSeverity || "warning",
      authorName: authorName || "Desenvolvedor",
    };
  }

  const updatedHistory = historyItem
    ? [historyItem, ...(current.maintenanceHistory || [])].slice(0, 30)
    : (current.maintenanceHistory || []);

  const updated: PlatformSettings = {
    ...current,
    maintenanceActive: false,
    showSystemStatusNotice: false,
    systemStatusNotice: "",
    maintenanceHistory: updatedHistory,
  };

  await savePlatformSettings(updated);
  return updated;
}

/**
 * Prorroga o tempo estimado da manutenção (+15min, +30min, etc.)
 */
export async function extendPlatformMaintenance(extraMinutes: number = 15) {
  const current = getPlatformSettings();
  const currentEnd = current.maintenanceEstimatedEnd
    ? new Date(current.maintenanceEstimatedEnd).getTime()
    : Date.now();
  const baseTime = Math.max(Date.now(), currentEnd);
  const newEnd = new Date(baseTime + extraMinutes * 60 * 1000).toISOString();
  const newDuration = (current.maintenanceDurationMinutes || 30) + extraMinutes;

  const updated: PlatformSettings = {
    ...current,
    maintenanceActive: true,
    maintenanceEstimatedEnd: newEnd,
    maintenanceDurationMinutes: newDuration,
  };

  await savePlatformSettings(updated);
  return updated;
}

/**
 * Apaga e reseta os dados da manutenção
 */
export async function resetPlatformMaintenanceData() {
  const current = getPlatformSettings();
  const updated: PlatformSettings = {
    ...current,
    maintenanceActive: false,
    maintenanceTitle: DEFAULT_PLATFORM_SETTINGS.maintenanceTitle,
    maintenanceMessage: DEFAULT_PLATFORM_SETTINGS.maintenanceMessage,
    maintenanceEstimatedEnd: "",
    maintenanceStartedAt: "",
    maintenanceDurationMinutes: 30,
    maintenanceSeverity: "warning",
    showSystemStatusNotice: false,
    systemStatusNotice: "",
  };

  await savePlatformSettings(updated);
  return updated;
}

/**
 * Limpa todo o histórico de manutenções
 */
export async function clearPlatformMaintenanceHistory() {
  const current = getPlatformSettings();
  const updated: PlatformSettings = {
    ...current,
    maintenanceHistory: [],
  };

  await savePlatformSettings(updated);
  return updated;
}

/**
 * Remove um item específico do histórico de manutenções
 */
export async function deletePlatformMaintenanceHistoryItem(id: string) {
  const current = getPlatformSettings();
  const updated: PlatformSettings = {
    ...current,
    maintenanceHistory: (current.maintenanceHistory || []).filter((h) => h.id !== id),
  };

  await savePlatformSettings(updated);
  return updated;
}

export function usePlatformSettings() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");

  useEffect(() => {
    void fetchRemotePlatformSettings();

    // Sincroniza via BroadcastChannel entre abas
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("tw_platform_settings_channel");
        bc.onmessage = (event) => {
          if (event.data?.settings) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(event.data.settings));
            emitPlatformSettingsChange();
          }
        };
      }
    } catch {}

    const onCustomUpdate = (e: any) => {
      if (e.detail) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(e.detail));
        emitPlatformSettingsChange();
      }
    };

    window.addEventListener("tw_platform_settings_updated", onCustomUpdate);

    // Supabase Realtime Channel para recebimento instantâneo em todas as telas (<50ms)
    const realtimeChannel = supabase
      .channel("system-platform-settings")
      .on("broadcast", { event: "platform_settings_updated" }, (payload: any) => {
        if (payload?.payload?.settings) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.payload.settings));
          emitPlatformSettingsChange();
          window.dispatchEvent(
            new CustomEvent("tw_platform_settings_updated", { detail: payload.payload.settings })
          );
        }
      })
      .subscribe();

    return () => {
      try {
        bc?.close();
      } catch {}
      window.removeEventListener("tw_platform_settings_updated", onCustomUpdate);
      void supabase.removeChannel(realtimeChannel);
    };
  }, []);

  // Polling a cada 6 segundos caso manutenção esteja ativa para garantir atualização em tempo real para visitantes bloqueados
  useEffect(() => {
    const rawVal = localStorage.getItem(STORAGE_KEY);
    let isActive = false;
    try {
      if (rawVal) {
        const p = JSON.parse(rawVal);
        isActive = Boolean(p.maintenanceActive || p.showSystemStatusNotice);
      }
    } catch {}

    if (!isActive) return;

    const interval = setInterval(() => {
      void fetchRemotePlatformSettings();
    }, 6000);

    return () => clearInterval(interval);
  }, [raw]);

  const settings: PlatformSettings = useMemo(() => {
    try {
      if (!raw || raw === "{}" || raw === "null") return DEFAULT_PLATFORM_SETTINGS;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PLATFORM_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_PLATFORM_SETTINGS;
    }
  }, [raw]);

  const save = useCallback(async (s: PlatformSettings) => {
    await savePlatformSettings(s);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    emitPlatformSettingsChange();
    try {
      void supabase.from("role_permissions").delete().eq("level", "system_platform_settings");
    } catch {}
  }, []);

  const startMaintenance = useCallback((params: Parameters<typeof startPlatformMaintenance>[0]) => {
    return startPlatformMaintenance(params);
  }, []);

  const finishMaintenance = useCallback((authorName?: string) => {
    return finishPlatformMaintenance(authorName);
  }, []);

  const extendMaintenance = useCallback((extraMinutes?: number) => {
    return extendPlatformMaintenance(extraMinutes);
  }, []);

  const resetMaintenance = useCallback(() => {
    return resetPlatformMaintenanceData();
  }, []);

  const clearHistory = useCallback(() => {
    return clearPlatformMaintenanceHistory();
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    return deletePlatformMaintenanceHistoryItem(id);
  }, []);

  return {
    settings,
    save,
    reset,
    startMaintenance,
    finishMaintenance,
    extendMaintenance,
    resetMaintenance,
    clearHistory,
    deleteHistoryItem,
  };
}
