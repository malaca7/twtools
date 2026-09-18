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
  categoryIcons?: Record<string, string>;
  items: DevMenuItemConfig[];
};

export const DEFAULT_DEV_CATEGORIES = ["DEV"];

export const DEFAULT_DEV_MENU_ITEMS: DevMenuItemConfig[] = [
  { id: "dev-hub", title: "Painel Dev Geral", url: "/dev", visible: true, category: "DEV", order: 0 },
  { id: "dev-bot", title: "Bot", url: "/dev/bot", visible: true, category: "DEV", order: 1 },
  { id: "dev-patch-notes", title: "Patch Notes & Releases", url: "/dev/patch-notes", visible: true, category: "DEV", order: 2 },
  { id: "dev-desempenho", title: "Gestão Desempenho", url: "/dev/desempenho", visible: true, category: "DEV", order: 3 },
  { id: "dev-permissoes", title: "Permissões Tag Dev", url: "/dev/permissoes", visible: true, category: "DEV", order: 4 },
  { id: "dev-configuracao", title: "Configurações Dev", url: "/dev/configuracao", visible: true, category: "DEV", order: 5 },
  { id: "dev-menu-lateral", title: "Menu Lateral Dev", url: "/dev/menu-lateral", visible: true, category: "DEV", order: 6 },
  { id: "dev-notificacoes", title: "Central de Notificações", url: "/dev/notificacoes", visible: true, category: "DEV", order: 7 },
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

export function normalizeDevMenuConfig(cfg: DevMenuConfig): DevMenuConfig {
  // Migra qualquer categoria legada "Ferramentas Dev" para "DEV"
  let cats = cfg.categories && Array.isArray(cfg.categories) && cfg.categories.length > 0
    ? cfg.categories.map((c) => (c.toLowerCase() === "ferramentas dev" || c.toLowerCase() === "ferramenta dev" ? "DEV" : c))
    : ["DEV"];

  // Deduplica categorias
  cats = Array.from(new Set(cats));
  if (!cats.includes("DEV")) {
    cats.unshift("DEV");
  }

  const items = (cfg.items || []).map((item) => {
    if (!item.category || item.category.toLowerCase() === "ferramentas dev" || item.category.toLowerCase() === "ferramenta dev") {
      return { ...item, category: "DEV" };
    }
    return item;
  });

  // Garante que dev-notificacoes esteja presente
  if (!items.some((i) => i.id === "dev-notificacoes" || i.url === "/dev/notificacoes")) {
    items.push({
      id: "dev-notificacoes",
      title: "Central de Notificações",
      url: "/dev/notificacoes",
      visible: true,
      category: "DEV",
      order: items.length,
    });
  }

  return {
    ...cfg,
    categories: cats,
    items,
  };
}

export function getDevMenuConfig(): DevMenuConfig | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw || raw === "{}" || raw === "null" || raw === "undefined") return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      const normalized = normalizeDevMenuConfig(parsed as DevMenuConfig);
      if (raw !== JSON.stringify(normalized) && typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
      return normalized;
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
        const normalized = normalizeDevMenuConfig(cfg as DevMenuConfig);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        emitDevChange();
        return normalized;
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
