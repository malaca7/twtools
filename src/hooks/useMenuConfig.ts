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

export const DEFAULT_MENU_CATEGORIES = ["Operação", "Gestão", "Administração"];

export const DEFAULT_MENU_ITEMS: MenuItemConfig[] = [
  { id: "dashboard", title: "Dashboard", url: "/dashboard", visible: true, category: "Operação", order: 0 },
  { id: "movimentacoes", title: "Movimentações", url: "/movimentacoes", visible: true, category: "Operação", order: 1 },
  { id: "vendas", title: "Vendas", url: "/vendas", visible: true, category: "Operação", order: 2 },
  { id: "chat", title: "Chat", url: "/chat", visible: true, category: "Operação", order: 3 },
  { id: "tickets", title: "Tickets / Ouvidoria", url: "/tickets", visible: true, category: "Operação", order: 4 },
  { id: "estoque", title: "Controle de Estoque", url: "/estoque", visible: true, category: "Gestão", order: 5 },
  { id: "membros", title: "Membros", url: "/membros", visible: true, category: "Gestão", order: 6 },
  { id: "hierarquia", title: "Hierarquia", url: "/hierarquia", visible: true, category: "Gestão", order: 7 },
  { id: "fundo-caixa", title: "Fundo de Caixa", url: "/fundo-caixa", visible: true, category: "Gestão", order: 8 },
  { id: "ausencias", title: "Ausências", url: "/ausencias", visible: true, category: "Gestão", order: 9 },
  { id: "rankings", title: "Rankings", url: "/rankings", visible: true, category: "Gestão", order: 10 },
  { id: "desempenho", title: "Meu Desempenho", url: "/desempenho", visible: true, category: "Gestão", order: 11 },
  { id: "metas", title: "Metas", url: "/metas", visible: true, category: "Gestão", order: 12 },
  { id: "avisos", title: "Enviar Avisos", url: "/avisos", visible: true, category: "Gestão", order: 13 },
  { id: "cargos", title: "Gerenciamento de Cargos", url: "/cargos", visible: true, category: "Administração", order: 14 },
  { id: "permissoes", title: "Permissões", url: "/permissoes", visible: true, category: "Administração", order: 15 },
  { id: "logs", title: "Logs", url: "/logs", visible: true, category: "Administração", order: 16 },
  { id: "atualizacoes", title: "Atualizações", url: "/atualizacoes", visible: true, category: "Administração", order: 17 },
  { id: "perfil", title: "Meu Perfil", url: "/perfil", visible: true, category: "Gestão", order: 18 },
  { id: "configuracoes", title: "Configurações", url: "/configuracoes", visible: true, category: "Administração", order: 19 },
];

/**
 * Reconciles and synchronizes any partial or saved menu configuration.
 * Always guarantees that:
 * 1. All standard categories ("Operação", "Gestão", "Administração") exist.
 * 2. All 20 canonical platform menus exist and are properly mapped.
 * 3. Any custom categories and custom menu items are preserved.
 * 4. Stale configurations where admin items were defaulted to "Gestão" heal to "Administração".
 */
export function syncMenuConfig(raw: Partial<MenuConfig> | null | undefined): MenuConfig {
  const savedCats = Array.isArray(raw?.categories) ? raw.categories : [];
  const savedItems = Array.isArray(raw?.items) ? raw.items : [];

  // 1. Synchronize categories
  const categories: string[] = [];
  const addCategory = (c: unknown) => {
    if (typeof c !== "string") return;
    const trimmed = c.trim();
    if (trimmed && !categories.includes(trimmed)) {
      categories.push(trimmed);
    }
  };

  // Preserve user custom categories order
  savedCats.forEach(addCategory);
  // Ensure default base categories are always included
  DEFAULT_MENU_CATEGORIES.forEach(addCategory);
  // Ensure any category assigned to an item is included
  savedItems.forEach((it) => {
    if (it && typeof it.category === "string") addCategory(it.category);
  });

  // 2. Build map of saved items by id and url
  const savedMap = new Map<string, MenuItemConfig>();
  savedItems.forEach((item) => {
    if (item && typeof item === "object") {
      if (item.id) savedMap.set(item.id, item);
      if (item.url) savedMap.set(item.url, item);
    }
  });

  // 3. Merge DEFAULT_MENU_ITEMS
  const items: MenuItemConfig[] = DEFAULT_MENU_ITEMS.map((def, defaultIdx) => {
    const saved = savedMap.get(def.id) || savedMap.get(def.url);
    if (!saved) {
      return { ...def, order: defaultIdx };
    }

    let category = typeof saved.category === "string" && saved.category.trim() ? saved.category.trim() : def.category;
    // Auto-heal admin items that were previously stuck in "Gestão" because the old code lacked "Administração"
    if (
      def.category === "Administração" &&
      category === "Gestão" &&
      !savedCats.includes("Administração")
    ) {
      category = "Administração";
    }

    return {
      id: def.id,
      title: typeof saved.title === "string" && saved.title.trim() ? saved.title.trim() : def.title,
      url: def.url,
      visible: typeof saved.visible === "boolean" ? saved.visible : def.visible,
      category,
      order: typeof saved.order === "number" ? saved.order : defaultIdx,
    };
  });

  // 4. Retain any extra items that user may have saved
  const defaultIds = new Set(DEFAULT_MENU_ITEMS.map((d) => d.id));
  const defaultUrls = new Set(DEFAULT_MENU_ITEMS.map((d) => d.url));
  savedItems.forEach((saved) => {
    if (saved && saved.id && !defaultIds.has(saved.id) && !defaultUrls.has(saved.url)) {
      const cat = typeof saved.category === "string" && saved.category.trim() ? saved.category.trim() : "Gestão";
      addCategory(cat);
      items.push({
        id: saved.id,
        title: typeof saved.title === "string" && saved.title.trim() ? saved.title.trim() : saved.id,
        url: saved.url || `/${saved.id}`,
        visible: typeof saved.visible === "boolean" ? saved.visible : true,
        category: cat,
        order: typeof saved.order === "number" ? saved.order : items.length,
      });
    }
  });

  // Sort items by order
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    categories,
    items,
  };
}

export function getMenuConfig(): MenuConfig {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw || raw === "{}" || raw === "null" || raw === "undefined") {
      return syncMenuConfig(null);
    }
    const parsed = JSON.parse(raw);
    return syncMenuConfig(parsed);
  } catch {
    return syncMenuConfig(null);
  }
}

/**
 * Fetches the global menu config saved by leadership from Supabase database.
 * Syncs locally and notifies all subscribers.
 */
export async function fetchRemoteMenuConfig(): Promise<MenuConfig> {
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "system_menu_config")
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      const cfg = syncMenuConfig(data.permissions as any);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      emitChange();
      return cfg;
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
  const synced = syncMenuConfig(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
  emitChange();

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: "system_menu_config",
        nivel: "system_menu_config",
        permissions: synced as any,
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
 * Automatically syncs with database updates from leadership and ensures full menu integrity.
 */
export function useMenuConfig() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");

  useEffect(() => {
    void fetchRemoteMenuConfig();
  }, []);

  const config: MenuConfig = useMemo(() => {
    try {
      if (!raw || raw === "{}" || raw === "null" || raw === "undefined") {
        return syncMenuConfig(null);
      }
      const parsed = JSON.parse(raw);
      return syncMenuConfig(parsed);
    } catch {
      return syncMenuConfig(null);
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

