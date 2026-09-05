import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DevMenuItemConfig = {
  id: string;
  title: string;
  url: string;
  visible: boolean;
  category: string;
  order: number;
};

export type DevMenuConfig = {
  categories?: string[];
  items: DevMenuItemConfig[];
};

export const DEFAULT_DEV_CATEGORIES = ["Ferramentas Dev"];

export const DEFAULT_DEV_MENU_ITEMS: DevMenuItemConfig[] = [
  { id: "dev-hub", title: "Painel Dev Geral", url: "/dev", visible: true, category: "Ferramentas Dev", order: 0 },
  { id: "dev-patch-notes", title: "Patch Notes & Releases", url: "/dev/patch-notes", visible: true, category: "Ferramentas Dev", order: 1 },
  { id: "dev-desempenho", title: "Gestão Desempenho", url: "/dev/desempenho", visible: true, category: "Ferramentas Dev", order: 2 },
  { id: "dev-permissoes", title: "Permissões Tag Dev", url: "/dev/permissoes", visible: true, category: "Ferramentas Dev", order: 3 },
  { id: "dev-configuracao", title: "Configurações Dev", url: "/dev/configuracao", visible: true, category: "Ferramentas Dev", order: 4 },
  { id: "dev-menu-lateral", title: "Menu Lateral Dev", url: "/dev/menu-lateral", visible: true, category: "Ferramentas Dev", order: 5 },
];

const STORAGE_KEY = "tw_dev_menu_config";
const PERMISSION_LEVEL = "system_dev_menu_config";

// External store listeners for cross-component reactivity
const listeners = new Set<() => void>();
export function emitDevChange() {
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

export function getDevMenuConfig(): DevMenuConfig | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw || raw === "{}" || raw === "null" || raw === "undefined") return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      return parsed as DevMenuConfig;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches the global dev menu config from Supabase database.
 * Syncs locally and notifies all subscribers.
 */
export async function fetchRemoteDevMenuConfig(): Promise<DevMenuConfig | null> {
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", PERMISSION_LEVEL)
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      const cfg = data.permissions as any;
      if (Array.isArray(cfg.items)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
        emitDevChange();
        return cfg as DevMenuConfig;
      }
    }
  } catch (err) {
    console.warn("Erro ao buscar dev_menu_config remoto do banco:", err);
  }
  return getDevMenuConfig();
}

/**
 * Saves dev menu config locally and persists globally to Supabase DB.
 */
export async function saveDevMenuConfig(config: DevMenuConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  emitDevChange();

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: PERMISSION_LEVEL,
        nivel: PERMISSION_LEVEL,
        permissions: config as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.error("Erro ao sincronizar dev_menu_config no banco:", err);
  }
}

export async function clearDevMenuConfig() {
  localStorage.removeItem(STORAGE_KEY);
  emitDevChange();

  try {
    await supabase.from("role_permissions").delete().eq("level", PERMISSION_LEVEL);
  } catch {}
}

/**
 * Hook that reactively reads global dev menu config from DB / localStorage.
 */
export function useDevMenuConfig() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");

  useEffect(() => {
    void fetchRemoteDevMenuConfig();
  }, []);

  const config: DevMenuConfig | null = useMemo(() => {
    try {
      if (!raw || raw === "{}" || raw === "null" || raw === "undefined") return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return parsed as DevMenuConfig;
      }
      return null;
    } catch {
      return null;
    }
  }, [raw]);

  const save = useCallback((c: DevMenuConfig) => {
    void saveDevMenuConfig(c);
  }, []);

  const reset = useCallback(() => {
    void clearDevMenuConfig();
  }, []);

  return { config, save, reset };
}
