import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  footerShowYear?: boolean;
  footerShowDeveloperCredits?: boolean;
  footerShowDiscordCopy?: boolean;
  footerShowSupportLink?: boolean;
  footerShowVersion?: boolean;
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
  footerShowYear: true,
  footerShowDeveloperCredits: true,
  footerShowDiscordCopy: true,
  footerShowSupportLink: true,
  footerShowVersion: true,
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

export function usePlatformSettings() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");

  useEffect(() => {
    void fetchRemotePlatformSettings();
  }, []);

  const settings: PlatformSettings = useMemo(() => {
    try {
      if (!raw || raw === "{}" || raw === "null") return DEFAULT_PLATFORM_SETTINGS;
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PLATFORM_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_PLATFORM_SETTINGS;
    }
  }, [raw]);

  const save = useCallback((s: PlatformSettings) => {
    void savePlatformSettings(s);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    emitPlatformSettingsChange();
    try {
      void supabase.from("role_permissions").delete().eq("level", "system_platform_settings");
    } catch {}
  }, []);

  return { settings, save, reset };
}
