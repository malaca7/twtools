import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DevMenuItemConfig = {
  id: string;
  title: string;
  url: string;
  iconName?: string;
  visible: boolean;
  category: string;
  order: number;
  isCustom?: boolean;
};

export type DevMenuConfig = {
  categories?: string[];
  categoryIcons?: Record<string, string>;
  items: DevMenuItemConfig[];
};

export const DEFAULT_DEV_CATEGORIES = ["DEV"];

export const DEFAULT_DEV_MENU_ITEMS: DevMenuItemConfig[] = [
  { id: "dev-hub", title: "Painel Dev Geral", url: "/dev", iconName: "Terminal", visible: true, category: "DEV", order: 0 },
  { id: "dev-bot", title: "Bot", url: "/dev/bot", iconName: "Bot", visible: true, category: "DEV", order: 1 },
  { id: "dev-estoque", title: "Estoque", url: "/dev/estoque", iconName: "Boxes", visible: true, category: "DEV", order: 2 },
  { id: "dev-patch-notes", title: "Patch Notes & Releases", url: "/dev/patch-notes", iconName: "Sparkles", visible: true, category: "DEV", order: 3 },
  { id: "dev-desempenho", title: "Gestão Desempenho", url: "/dev/desempenho", iconName: "TrendingUp", visible: true, category: "DEV", order: 4 },
  { id: "dev-permissoes", title: "Permissões Tag Dev", url: "/dev/permissoes", iconName: "KeyRound", visible: true, category: "DEV", order: 5 },
  { id: "dev-configuracao", title: "Configurações Dev", url: "/dev/configuracao", iconName: "Code2", visible: true, category: "DEV", order: 6 },
  { id: "dev-menu-lateral", title: "Menu Lateral Dev", url: "/dev/menu-lateral", iconName: "Sliders", visible: true, category: "DEV", order: 7 },
  { id: "dev-notificacoes", title: "Central de Notificações", url: "/dev/notificacoes", iconName: "BellRing", visible: true, category: "DEV", order: 8 },
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
  let cats = cfg.categories && Array.isArray(cfg.categories) && cfg.categories.length > 0
    ? cfg.categories.map((c) => (c.toLowerCase() === "ferramentas dev" || c.toLowerCase() === "ferramenta dev" ? "DEV" : c))
    : ["DEV"];

  cats = Array.from(new Set(cats));
  if (!cats.includes("DEV")) {
    cats.unshift("DEV");
  }

  const defaultIds = new Set(DEFAULT_DEV_MENU_ITEMS.map((d) => d.id));
  const rawItems = Array.isArray(cfg.items) ? cfg.items : [];
  const savedMap = new Map<string, DevMenuItemConfig>();
  rawItems.forEach((i: any) => {
    if (i && typeof i === "object" && i.id) {
      savedMap.set(i.id, i);
    }
  });

  const merged = DEFAULT_DEV_MENU_ITEMS.map((def, defaultIdx) => {
    const saved = savedMap.get(def.id);
    if (!saved) return def;
    let cat = saved.category || def.category;
    if (cat.toLowerCase() === "ferramentas dev" || cat.toLowerCase() === "ferramenta dev") {
      cat = "DEV";
    }
    return {
      id: def.id,
      title: saved.title && typeof saved.title === "string" && saved.title.trim().length > 0 ? saved.title.trim() : def.title,
      url: saved.url && typeof saved.url === "string" && saved.url.trim().length > 0 ? saved.url.trim() : def.url,
      iconName: saved.iconName || def.iconName,
      visible: typeof saved.visible === "boolean" ? saved.visible : def.visible,
      category: cat,
      order: typeof saved.order === "number" ? saved.order : defaultIdx,
    };
  });

  // Preserva itens customizados adicionados pelo usuário
  const customItems: DevMenuItemConfig[] = rawItems
    .filter((i: any) => i && typeof i === "object" && i.id && !defaultIds.has(i.id))
    .map((i: any, idx: number) => ({
      id: i.id,
      title: i.title && typeof i.title === "string" ? i.title.trim() : "Novo Item Dev",
      url: i.url && typeof i.url === "string" ? i.url.trim() : "/dev",
      iconName: i.iconName || "Terminal",
      visible: typeof i.visible === "boolean" ? i.visible : true,
      category: i.category || cats[0] || "DEV",
      order: typeof i.order === "number" ? i.order : 50 + idx,
      isCustom: true,
    }));

  return {
    ...cfg,
    categories: cats,
    items: [...merged, ...customItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
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
      if (!raw || raw === "{}" || raw === "null" || raw === "undefined") {
        return {
          categories: [...DEFAULT_DEV_CATEGORIES],
          items: [...DEFAULT_DEV_MENU_ITEMS],
        };
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return normalizeDevMenuConfig(parsed as DevMenuConfig);
      }
      return {
        categories: [...DEFAULT_DEV_CATEGORIES],
        items: [...DEFAULT_DEV_MENU_ITEMS],
      };
    } catch {
      return {
        categories: [...DEFAULT_DEV_CATEGORIES],
        items: [...DEFAULT_DEV_MENU_ITEMS],
      };
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
