import { rtdb } from "@/integrations/firebase/rtdb";
import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { broadcastPermissionsRealtimeUpdate } from "@/lib/permissionsRealtimeSync";

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

export const DEFAULT_DEV_CATEGORIES = ["Dev Tools", "Dev Gestão"];

export const DEFAULT_DEV_CATEGORY_ICONS: Record<string, string> = {
  "Dev Gestão": "Gauge",
  "Dev Tools": "Wrench",
};

export const DEFAULT_DEV_MENU_ITEMS: DevMenuItemConfig[] = [
  { id: "dev-configuracao", title: "Configurações Dev", url: "/dev/configuracao", iconName: "Code2", visible: true, category: "Dev Tools", order: 0 },
  { id: "dev-bot", title: "Gerenciar Bot", url: "/dev/bot", iconName: "Bot", visible: true, category: "Dev Tools", order: 1 },
  { id: "dev-estoque", title: "Estoque", url: "/dev/estoque", iconName: "Boxes", visible: true, category: "Dev Gestão", order: 2 },
  { id: "dev-xp-insignias", title: "Xp e insígnias", url: "/dev/xp-insignias", iconName: "Award", visible: true, category: "Dev Gestão", order: 3 },
  { id: "dev-permissoes", title: "Permissões (Paineis)", url: "/dev/permissoes", iconName: "KeyRound", visible: true, category: "Dev Tools", order: 4 },
  { id: "dev-coins", title: "Gestão de TW Coins", url: "/dev/coins", iconName: "Coins", visible: true, category: "Dev Gestão", order: 5 },
  { id: "dev-loja", title: "Gestão da Loja", url: "/dev/gestaoloja", iconName: "ShoppingBag", visible: true, category: "Dev Gestão", order: 6 },
  { id: "dev-notificacoes", title: "Central de Notificações", url: "/dev/notificacoes", iconName: "BellRing", visible: true, category: "Dev Gestão", order: 7 },
  { id: "dev-advertencias", title: "Advertências & Suspensões", url: "/dev/advertencias", iconName: "ShieldAlert", visible: true, category: "Dev Gestão", order: 8 },
  { id: "dev-loja-oficial", title: "Loja", url: "/dev/loja", iconName: "Store", visible: false, category: "Dev Gestão", order: 9 },
  { id: "dev-menu-lateral", title: "Menu Lateral (Paineis)", url: "/dev/menu-lateral", iconName: "Sliders", visible: true, category: "Dev Tools", order: 10 },
  { id: "dev-patch-notes", title: "Patch Notes", url: "/dev/patch-notes", iconName: "Sparkles", visible: false, category: "Dev Tools", order: 11 },
  { id: "dev-desempenho", title: "Gestão Desempenho", url: "/dev/desempenho", iconName: "TrendingUp", visible: false, category: "Dev Tools", order: 12 },
];

const STORAGE_KEY = "tw_dev_menu_config";
const PERMISSION_LEVEL = "system_dev_menu_config";

// External store listeners for cross-component reactivity
const listeners = new Set<() => void>();
export function emitDevChange() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("tw_menu_updated", { detail: { level: PERMISSION_LEVEL } }));
      window.dispatchEvent(new CustomEvent("tw_dev_config_updated"));
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
  const handleEvent = () => callback();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleEvent);
    window.addEventListener("tw_menu_updated", handleEvent);
    window.addEventListener("tw_dev_config_updated", handleEvent);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleEvent);
      window.removeEventListener("tw_menu_updated", handleEvent);
      window.removeEventListener("tw_dev_config_updated", handleEvent);
    }
  };
}

export function normalizeDevMenuConfig(cfg: DevMenuConfig): DevMenuConfig {
  let cats =
    cfg.categories && Array.isArray(cfg.categories) && cfg.categories.length > 0
      ? cfg.categories
          .map((c) => (typeof c === "string" ? c.trim() : ""))
          .filter((c) => Boolean(c && c.length > 0))
      : [];

  cats = Array.from(new Set(cats));
  if (cats.length === 0 || (cats.length === 1 && cats[0] === "DEV")) {
    cats = [...DEFAULT_DEV_CATEGORIES];
  }

  const defaultIds = new Set(DEFAULT_DEV_MENU_ITEMS.map((d) => d.id));
  const rawItems = (Array.isArray(cfg.items) ? cfg.items : []).filter(
    (i: any) => i && i.id !== "dev-hub" && i.url !== "/dev"
  );
  const savedMap = new Map<string, DevMenuItemConfig>();
  rawItems.forEach((i: any) => {
    if (i && typeof i === "object" && i.id) {
      savedMap.set(i.id, i);
    }
  });

  const merged = DEFAULT_DEV_MENU_ITEMS.map((def, defaultIdx) => {
    const saved = savedMap.get(def.id);
    if (!saved) {
      return {
        ...def,
        category: cats.includes(def.category) ? def.category : cats[0] || "DEV",
      };
    }

    let cat =
      saved.category && typeof saved.category === "string" && saved.category.trim().length > 0
        ? saved.category.trim()
        : def.category;

    // Se a categoria do item foi deletada e não está mais em cats, transfere para a primeira categoria válida
    if (!cats.includes(cat)) {
      cat = cats[0] || "DEV";
    }

    return {
      id: def.id,
      title:
        saved.title && typeof saved.title === "string" && saved.title.trim().length > 0
          ? saved.title.trim()
          : def.title,
      url:
        saved.url && typeof saved.url === "string" && saved.url.trim().length > 0
          ? saved.url.trim()
          : def.url,
      iconName: saved.iconName || def.iconName,
      visible: typeof saved.visible === "boolean" ? saved.visible : def.visible,
      category: cat,
      order: typeof saved.order === "number" ? saved.order : defaultIdx,
    };
  });

  // Preserva itens customizados adicionados pelo usuário
  const customItems: DevMenuItemConfig[] = rawItems
    .filter((i: any) => i && typeof i === "object" && i.id && !defaultIds.has(i.id))
    .map((i: any, idx: number) => {
      let itemCat =
        i.category && typeof i.category === "string" && i.category.trim().length > 0
          ? i.category.trim()
          : cats[0] || "DEV";
      if (!cats.includes(itemCat)) {
        itemCat = cats[0] || "DEV";
      }

      return {
        id: i.id,
        title: i.title && typeof i.title === "string" ? i.title.trim() : "Novo Item Dev",
        url: i.url && typeof i.url === "string" ? i.url.trim() : "/dev",
        iconName: i.iconName || "Terminal",
        visible: typeof i.visible === "boolean" ? i.visible : true,
        category: itemCat,
        order: typeof i.order === "number" ? i.order : 50 + idx,
        isCustom: true,
      };
    });

  return {
    ...cfg,
    categories: cats,
    categoryIcons: cfg.categoryIcons && Object.keys(cfg.categoryIcons).length > 0 ? cfg.categoryIcons : DEFAULT_DEV_CATEGORY_ICONS,
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
  // 1. Prioriza SEMPRE o banco de dados oficial Supabase
  try {
    let { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", PERMISSION_LEVEL)
      .maybeSingle();

    // Fallback REST direto com a chave oficial caso PostgREST retorne erro de autenticação ou vazio
    if ((error || !data || !data.permissions) && typeof fetch !== "undefined") {
      try {
        const url = `${SUPABASE_URL}/rest/v1/role_permissions?select=permissions&level=eq.${PERMISSION_LEVEL}`;
        const res = await fetch(url, {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            Accept: "application/vnd.pgrst.object+json",
          },
        });
        if (res.ok) {
          const directData = await res.json();
          if (directData && directData.permissions) {
            data = directData;
          }
        }
      } catch {}
    }

    if (data && data.permissions && typeof data.permissions === "object") {
      const cfg = data.permissions as any;
      if (Array.isArray(cfg.items)) {
        const normalized = normalizeDevMenuConfig(cfg as DevMenuConfig);
        const prev = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        const next = JSON.stringify(normalized);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEY, next);
          emitDevChange();
        }
        return normalized;
      }
    }
  } catch (err) {
    console.warn("Erro ao buscar dev_menu_config do Supabase:", err);
  }

  // 2. Fallback RTDB caso Supabase retorne vazio
  try {
    const rtdbData = await rtdb.get<any>(`role_permissions/${PERMISSION_LEVEL}`);
    if (rtdbData && rtdbData.permissions && typeof rtdbData.permissions === "object") {
      const cfg = rtdbData.permissions as any;
      if (Array.isArray(cfg.items)) {
        const normalized = normalizeDevMenuConfig(cfg as DevMenuConfig);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        emitDevChange();
        return normalized;
      }
    }
  } catch {}

  return getDevMenuConfig();
}

/**
 * Saves dev menu config locally and persists globally to Supabase DB.
 */
export async function saveDevMenuConfig(config: DevMenuConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  emitDevChange();

  try {
    await rtdb.set(`role_permissions/${PERMISSION_LEVEL}`, {
      level: PERMISSION_LEVEL,
      nivel: PERMISSION_LEVEL,
      permissions: config as any,
      updated_at: new Date().toISOString(),
    });
  } catch (fbErr) {
    console.warn("Erro ao salvar dev_menu_config no RTDB:", fbErr);
  }

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

    void broadcastPermissionsRealtimeUpdate({
      type: "menu_config",
      level: PERMISSION_LEVEL,
    });
  } catch (err) {
    console.error("Erro ao sincronizar dev_menu_config no banco:", err);
  }
}

export async function clearDevMenuConfig() {
  localStorage.removeItem(STORAGE_KEY);
  emitDevChange();

  try {
    await supabase.from("role_permissions").delete().eq("level", PERMISSION_LEVEL);
    void broadcastPermissionsRealtimeUpdate({
      type: "menu_config",
      level: PERMISSION_LEVEL,
    });
  } catch {}
}

/**
 * Hook that reactively reads global dev menu config from DB / localStorage.
 */
export function useDevMenuConfig() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");

  useEffect(() => {
    void fetchRemoteDevMenuConfig();

    if (typeof window !== "undefined") {
      const handleFocus = () => void fetchRemoteDevMenuConfig();
      window.addEventListener("focus", handleFocus);
      window.addEventListener("visibilitychange", handleFocus);
      const interval = setInterval(handleFocus, 12000);
      return () => {
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("visibilitychange", handleFocus);
        clearInterval(interval);
      };
    }
  }, []);

  const config: DevMenuConfig | null = useMemo(() => {
    try {
      if (!raw || raw === "{}" || raw === "null" || raw === "undefined") {
        return {
          categories: [...DEFAULT_DEV_CATEGORIES],
          categoryIcons: { ...DEFAULT_DEV_CATEGORY_ICONS },
          items: [...DEFAULT_DEV_MENU_ITEMS],
        };
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return normalizeDevMenuConfig(parsed as DevMenuConfig);
      }
      return {
        categories: [...DEFAULT_DEV_CATEGORIES],
        categoryIcons: { ...DEFAULT_DEV_CATEGORY_ICONS },
        items: [...DEFAULT_DEV_MENU_ITEMS],
      };
    } catch {
      return {
        categories: [...DEFAULT_DEV_CATEGORIES],
        categoryIcons: { ...DEFAULT_DEV_CATEGORY_ICONS },
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
