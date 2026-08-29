import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MenuItemConfig = {
  id: string;
  title: string;
  url: string;
  visible: boolean;
  category: string;
  order: number;
};

export type MenuConfig = {
  categories?: string[];
  items: MenuItemConfig[];
};

const STORAGE_KEY = "tw_menu_config";

// External store listeners for cross-component reactivity
const listeners = new Set<() => void>();
export function emitChange() {
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

export function getMenuConfig(): MenuConfig | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw || raw === "{}" || raw === "null" || raw === "undefined") return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      return parsed as MenuConfig;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches the global menu config saved by leadership from Supabase database.
 * Syncs locally and notifies all subscribers.
 */
export async function fetchRemoteMenuConfig(): Promise<MenuConfig | null> {
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "system_menu_config")
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      const cfg = data.permissions as any;
      if (Array.isArray(cfg.items)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
        emitChange();
        return cfg as MenuConfig;
      }
    }
  } catch (err) {
    console.warn("Erro ao buscar menu_config remoto do banco:", err);
  }
  return getMenuConfig();
}

/**
 * Saves menu config locally and persists globally to Supabase DB for all members.
 */
export async function saveMenuConfig(config: MenuConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  emitChange();

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: "system_menu_config",
        nivel: "system_menu_config",
        permissions: config as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.error("Erro ao sincronizar menu_config no banco:", err);
  }
}

export async function clearMenuConfig() {
  localStorage.removeItem(STORAGE_KEY);
  emitChange();

  try {
    await supabase.from("role_permissions").delete().eq("level", "system_menu_config");
  } catch {}
}

/**
 * Hook that reactively reads global menu config from DB / localStorage.
 * Automatically syncs with database updates from leadership.
 */
export function useMenuConfig() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");

  useEffect(() => {
    void fetchRemoteMenuConfig();
  }, []);

  const config: MenuConfig | null = useMemo(() => {
    try {
      if (!raw || raw === "{}" || raw === "null" || raw === "undefined") return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return parsed as MenuConfig;
      }
      return null;
    } catch {
      return null;
    }
  }, [raw]);

  const save = useCallback((c: MenuConfig) => {
    void saveMenuConfig(c);
  }, []);

  const reset = useCallback(() => {
    void clearMenuConfig();
  }, []);

  return { config, save, reset };
}
