import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MenuItemConfig = {
  id: string;
  title: string;
  url: string;
  visible: boolean;
  category: string;
  order: number;
  iconName?: string;
  isCustom?: boolean;
};

export type MenuConfig = {
  categories?: string[];
  items: MenuItemConfig[];
  deletedItemIds?: string[];
};

const STORAGE_KEY = "tw_menu_config";

// External store listeners for cross-component reactivity
const listeners = new Set<() => void>();
export function emitChange() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }
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
 * Reconcilia e sincroniza configurações parciais ou salvas do menu lateral.
 * Garante que:
 * 1. A ordem e as categorias customizadas do usuário são fielmente respeitadas (sem ressuscitar categorias excluídas).
 * 2. A ordem de itens salva/arranjada pelo usuário é preservada 1:1 com reindexação sequencial limpa.
 * 3. Novos módulos canônicos da plataforma ausentes na configuração do usuário são anexados ao fim sem perder dados e sem ressuscitar categorias excluídas.
 * 4. Itens customizados criados pelo usuário são preservados com suas rotas, ícones e categorias.
 * 5. Itens explicitamente excluídos pelo usuário permanecem excluídos.
 */
export function syncMenuConfig(raw: Partial<MenuConfig> | null | undefined): MenuConfig {
  const savedCats = Array.isArray(raw?.categories)
    ? raw.categories.filter((c): c is string => typeof c === "string" && Boolean(c.trim()))
    : [];

  const savedItems = Array.isArray(raw?.items)
    ? raw.items.filter((it): it is MenuItemConfig => Boolean(it && typeof it === "object" && it.id))
    : [];

  const deletedSet = new Set<string>(
    Array.isArray(raw?.deletedItemIds)
      ? raw.deletedItemIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
      : []
  );

  // 1. Sincronização de Categorias
  const categories: string[] = [];
  const addCategory = (c: unknown) => {
    if (typeof c !== "string") return;
    const trimmed = c.trim();
    if (trimmed && !categories.includes(trimmed)) {
      categories.push(trimmed);
    }
  };

  // Se o usuário especificou uma lista de categorias (mesmo com nomes customizados), respeita estritamente
  if (savedCats.length > 0) {
    savedCats.forEach(addCategory);
  } else {
    // Apenas se não houver nenhuma categoria configurada usa o padrão
    DEFAULT_MENU_CATEGORIES.forEach(addCategory);
  }

  // 2. Mapa de itens padrão da plataforma
  const defaultItemsMap = new Map<string, MenuItemConfig>();
  DEFAULT_MENU_ITEMS.forEach((def) => {
    defaultItemsMap.set(def.id, def);
  });

  // 3. Processa os itens preservando a sequência exata configurada pelo usuário
  const items: MenuItemConfig[] = [];
  const processedIds = new Set<string>();

  if (savedItems.length > 0) {
    savedItems.forEach((saved) => {
      if (!saved || !saved.id || processedIds.has(saved.id) || deletedSet.has(saved.id)) return;
      processedIds.add(saved.id);

      const defaultMatch = defaultItemsMap.get(saved.id) || DEFAULT_MENU_ITEMS.find((d) => d.url === saved.url);
      const title =
        typeof saved.title === "string" && saved.title.trim()
          ? saved.title.trim()
          : defaultMatch?.title || saved.id;

      const url =
        typeof saved.url === "string" && saved.url.trim()
          ? saved.url.trim()
          : defaultMatch?.url || `/${saved.id}`;

      let category =
        typeof saved.category === "string" && saved.category.trim()
          ? saved.category.trim()
          : defaultMatch?.category || categories[0] || "Gestão";

      const visible = typeof saved.visible === "boolean" ? saved.visible : true;
      const iconName = typeof saved.iconName === "string" ? saved.iconName : undefined;
      const isCustom = Boolean(saved.isCustom || !defaultMatch);

      // Garante que a categoria do item está registrada na lista de categorias
      addCategory(category);

      items.push({
        id: saved.id,
        title,
        url,
        visible,
        category,
        order: items.length,
        iconName,
        isCustom,
      });
    });
  }

  // 4. Garante que qualquer módulo canônico do sistema que não esteja na lista do usuário seja anexado (a não ser que tenha sido excluído)
  DEFAULT_MENU_ITEMS.forEach((def) => {
    if (!processedIds.has(def.id) && !deletedSet.has(def.id)) {
      processedIds.add(def.id);
      // Se a categoria padrão ainda existe na lista, usa ela. Senão mapeia para a primeira categoria válida sem ressuscitar categorias deletadas
      const targetCategory = categories.includes(def.category) ? def.category : (categories[0] || "Gestão");
      items.push({
        ...def,
        category: targetCategory,
        order: items.length,
      });
    }
  });

  // 5. Reindexação sequencial estrita de order (0, 1, 2, ...)
  items.forEach((item, idx) => {
    item.order = idx;
  });

  const finalCategories = categories.length > 0 ? categories : [...DEFAULT_MENU_CATEGORIES];

  return {
    categories: finalCategories,
    items,
    deletedItemIds: Array.from(deletedSet),
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
 * Tries RPC save_role_permissions first to bypass RLS restrictions, then falls back to direct upsert.
 */
export async function saveMenuConfig(config: MenuConfig) {
  const synced = syncMenuConfig(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
  emitChange();

  try {
    const { error: rpcErr } = await supabase.rpc("save_role_permissions", {
      _level: "system_menu_config",
      _permissions: synced as any,
    });

    if (rpcErr) {
      await supabase.from("role_permissions").upsert(
        {
          level: "system_menu_config",
          nivel: "system_menu_config",
          permissions: synced as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "level" }
      );
    }
  } catch (err) {
    console.error("Erro ao sincronizar menu_config no banco:", err);
  }
}

export async function clearMenuConfig() {
  localStorage.removeItem(STORAGE_KEY);
  emitChange();

  try {
    const { error: rpcErr } = await supabase.rpc("save_role_permissions", {
      _level: "system_menu_config",
      _permissions: null as any,
    });
    if (rpcErr) {
      await supabase.from("role_permissions").delete().eq("level", "system_menu_config");
    }
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
