import { rtdb } from "@/integrations/firebase/rtdb";
import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { broadcastPermissionsRealtimeUpdate } from "@/lib/permissionsRealtimeSync";

export type CeoMenuItemConfig = {
  id: string;
  title: string;
  url: string;
  iconName?: string;
  visible: boolean;
  category: string;
  order: number;
  isCustom?: boolean;
};

export type CeoMenuConfig = {
  categories?: string[];
  categoryIcons?: Record<string, string>;
  items: CeoMenuItemConfig[];
  deletedItemIds?: string[];
};

export const DEFAULT_CEO_CATEGORIES = ["CEO Tools", "CEO Access"];

export const DEFAULT_CEO_CATEGORY_ICONS: Record<string, string> = {
  "CEO Tools": "Wrench",
  "CEO Access": "Cpu",
};

export const DEFAULT_CEO_DELETED_ITEM_IDS = [
  "ceo-bot",
  "ceo-webhooks",
  "ceo-financas",
  "ceo-notificacoes",
];

export const DEFAULT_CEO_MENU_ITEMS: CeoMenuItemConfig[] = [
  { id: "ceo-tags", title: "Gerenciar Tags", url: "/ceo/tags", iconName: "Tag", visible: true, category: "CEO Tools", order: 0 },
  { id: "ceo-selos", title: "Gerenciar Selos", url: "/ceo/selos", iconName: "ShieldCheck", visible: true, category: "CEO Tools", order: 1 },
  { id: "ceo-ajustes-estoque", title: "Ajustes de Estoque", url: "/ceo/ajustes-estoque", iconName: "PackageCheck", visible: true, category: "CEO Tools", order: 2 },
  { id: "ceo-dashboard", title: "Visão Geral & Métricas", url: "/ceo/dashboard", iconName: "LayoutDashboard", visible: true, category: "CEO Access", order: 3 },
  { id: "ceo-advertencias", title: "Advertências & Suspensões", url: "/ceo/advertencias", iconName: "ShieldAlert", visible: true, category: "CEO Access", order: 4 },
];

export const CEO_SYSTEM_MODULES = [
  { id: "ceo-dashboard", title: "Visão Geral & Métricas", url: "/ceo/dashboard", defaultCat: "CEO", iconName: "LayoutDashboard", description: "Painel executivo com métricas consolidadas e faturamento geral" },
  { id: "ceo-bot", title: "Gerenciar Bot", url: "/ceo/bot", defaultCat: "CEO", iconName: "Bot", description: "Configuração do bot Discloud e sincronização do Discord" },
  { id: "ceo-webhooks", title: "WebHook Discord", url: "/ceo/webhooks", defaultCat: "CEO", iconName: "Webhook", description: "Integração de canais de avisos e notificações no Discord" },
  { id: "ceo-financas", title: "Fundo de Caixa & Finanças", url: "/ceo/financas", defaultCat: "CEO", iconName: "Landmark", description: "Gestão executiva de cofres, metas monetárias e auditoria" },
  { id: "ceo-ajustes-estoque", title: "Ajustes de Estoque", url: "/ceo/ajustes-estoque", defaultCat: "CEO", iconName: "Sliders", description: "Ajustes administrativos manuais de quantidades em baús" },
  { id: "ceo-tags", title: "Gerenciar Tags", url: "/ceo/tags", defaultCat: "CEO", iconName: "Tags", description: "Criação, cores, ícones e vinculação de tags da facção" },
  { id: "ceo-selos", title: "Gerenciar Selos", url: "/ceo/selos", defaultCat: "CEO", iconName: "BadgeCheck", description: "Painel de gestão, análise de pedidos e aprovação de Selos de Verificação" },
  { id: "ceo-notificacoes", title: "Central de Notificações", url: "/ceo/notificacoes", defaultCat: "CEO", iconName: "BellRing", description: "Disparo e broadcast de notificações e avisos em massa" },
  { id: "ceo-advertencias", title: "Advertências & Suspensões", url: "/ceo/advertencias", defaultCat: "CEO", iconName: "ShieldAlert", description: "Auditoria e gestão de punições, advertências e suspensões" },
];

const STORAGE_KEY = "tw_ceo_menu_config";
const PERMISSION_LEVEL = "system_ceo_menu_config";

// External store listeners for cross-component reactivity
const listeners = new Set<() => void>();
export function emitCeoChange() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("tw_menu_updated", { detail: { level: PERMISSION_LEVEL } }));
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
    window.addEventListener("tw_ceo_config_updated", handleEvent);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleEvent);
      window.removeEventListener("tw_menu_updated", handleEvent);
      window.removeEventListener("tw_ceo_config_updated", handleEvent);
    }
  };
}

export function sanitizeCeoConfig(parsed: any): CeoMenuConfig {
  let categories: string[] =
    Array.isArray(parsed?.categories) && parsed.categories.length > 0
      ? parsed.categories.map((c: any) => String(c).trim()).filter(Boolean)
      : [];

  categories = Array.from(new Set(categories));
  // Migra a categoria legada singular "CEO" para as categorias oficiais atuais ["CEO Tools", "CEO Access"]
  if (categories.length === 0 || (categories.length === 1 && categories[0] === "CEO")) {
    categories = [...DEFAULT_CEO_CATEGORIES];
  }

  const deletedIds = new Set<string>([
    ...(Array.isArray(parsed?.deletedItemIds) ? parsed.deletedItemIds : []),
    ...DEFAULT_CEO_DELETED_ITEM_IDS,
  ]);

  const defaultIds = new Set(DEFAULT_CEO_MENU_ITEMS.map((d) => d.id));
  const primaryCat = categories[0] || "CEO";

  const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
  const savedMap = new Map<string, CeoMenuItemConfig>();
  rawItems.forEach((i: any) => {
    if (i && typeof i === "object" && i.id) {
      savedMap.set(i.id, i);
    }
  });

  const merged = DEFAULT_CEO_MENU_ITEMS
    .filter((def) => !deletedIds.has(def.id))
    .map((def, defaultIdx) => {
      const saved = savedMap.get(def.id) || (def.id === "ceo-tags" ? savedMap.get("ceo-permissoes-tags") : undefined);
      if (!saved) {
        return {
          ...def,
          category: categories.includes(def.category) ? def.category : primaryCat,
        };
      }

      let itemCat = saved.category && typeof saved.category === "string" && saved.category.trim().length > 0
        ? saved.category.trim()
        : def.category;

      // Normaliza categoria antiga ou órfã
      if (!categories.includes(itemCat)) {
        itemCat = primaryCat;
      }

      return {
        id: def.id,
        title: def.id === "ceo-tags" ? "Gerenciar Tags" : (saved.title && typeof saved.title === "string" && saved.title.trim().length > 0 ? saved.title.trim() : def.title),
        url: def.id === "ceo-tags" ? "/ceo/tags" : (saved.url && typeof saved.url === "string" && saved.url.trim().length > 1 && saved.url !== "/" ? saved.url.trim() : def.url),
        iconName: saved.iconName || def.iconName,
        visible: typeof saved.visible === "boolean" ? saved.visible : def.visible,
        category: itemCat,
        order: typeof saved.order === "number" ? saved.order : defaultIdx,
      };
    });

  // Preserva itens customizados adicionados pelo usuário (descartando duplicatas que apontem para /ceo/selos)
  const customItems: CeoMenuItemConfig[] = rawItems
    .filter((i: any) => {
      if (!i || typeof i !== "object" || !i.id || defaultIds.has(i.id) || deletedIds.has(i.id)) {
        return false;
      }
      // Se for um item customizado duplicado de Gerenciar Selos, descarta em favor do módulo do sistema
      if (i.url === "/ceo/selos" || (typeof i.title === "string" && i.title.toLowerCase().trim() === "gerenciar selos")) {
        return false;
      }
      return true;
    })
    .map((i: any, idx: number) => {
      let itemCat = i.category && typeof i.category === "string" ? i.category.trim() : primaryCat;
      if (!categories.includes(itemCat)) {
        itemCat = primaryCat;
      }

      return {
        id: i.id,
        title: i.title && typeof i.title === "string" ? i.title.trim() : "Novo Item",
        url: i.url && typeof i.url === "string" ? i.url.trim() : "/ceo",
        iconName: i.iconName || "Crown",
        visible: typeof i.visible === "boolean" ? i.visible : true,
        category: itemCat,
        order: typeof i.order === "number" ? i.order : 50 + idx,
        isCustom: true,
      };
    });

  const categoryIcons = {
    ...DEFAULT_CEO_CATEGORY_ICONS,
    ...(parsed?.categoryIcons && typeof parsed.categoryIcons === "object" ? parsed.categoryIcons : {}),
  };

  return {
    categories,
    categoryIcons,
    items: [...merged, ...customItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    deletedItemIds: Array.from(deletedIds),
  };
}

export function getCeoMenuConfig(): CeoMenuConfig | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw || raw === "{}" || raw === "null" || raw === "undefined") {
      return sanitizeCeoConfig({
        categories: [...DEFAULT_CEO_CATEGORIES],
        categoryIcons: { ...DEFAULT_CEO_CATEGORY_ICONS },
        deletedItemIds: [...DEFAULT_CEO_DELETED_ITEM_IDS],
        items: [...DEFAULT_CEO_MENU_ITEMS],
      });
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      return sanitizeCeoConfig(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Carrega a configuração do menu CEO a partir do Supabase e sincroniza localmente
 */
export async function fetchRemoteCeoMenuConfig(): Promise<CeoMenuConfig | null> {
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
      if (Array.isArray(cfg.items) && cfg.items.length > 0) {
        const sanitized = sanitizeCeoConfig(cfg);
        const prev = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
        const next = JSON.stringify(sanitized);
        if (prev !== next) {
          localStorage.setItem(STORAGE_KEY, next);
          emitCeoChange();
        }
        return sanitized;
      }
    }
  } catch (err) {
    console.warn("Erro ao buscar ceo_menu_config do Supabase:", err);
  }

  // 2. Fallback RTDB caso Supabase retorne vazio
  try {
    const rtdbData = await rtdb.get<any>(`role_permissions/${PERMISSION_LEVEL}`);
    if (rtdbData && rtdbData.permissions && typeof rtdbData.permissions === "object") {
      const cfg = rtdbData.permissions as any;
      if (Array.isArray(cfg.items)) {
        const sanitized = sanitizeCeoConfig(cfg);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        emitCeoChange();
        return sanitized;
      }
    }
  } catch {}

  return getCeoMenuConfig();
}

/**
 * Salva a configuração do menu CEO localmente e persiste no Supabase
 */
export async function saveCeoMenuConfig(config: CeoMenuConfig) {
  const sanitized = sanitizeCeoConfig(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  emitCeoChange();

  try {
    await rtdb.set(`role_permissions/${PERMISSION_LEVEL}`, {
      level: PERMISSION_LEVEL,
      nivel: PERMISSION_LEVEL,
      permissions: sanitized as any,
      updated_at: new Date().toISOString(),
    });
  } catch (fbErr) {
    console.warn("Erro ao salvar ceo_menu_config no RTDB:", fbErr);
  }

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: PERMISSION_LEVEL,
        nivel: PERMISSION_LEVEL,
        permissions: sanitized as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );

    void broadcastPermissionsRealtimeUpdate({
      type: "menu_config",
      level: PERMISSION_LEVEL,
    });
  } catch (err) {
    console.warn("Falha ao salvar ceo_menu_config remotamente:", err);
  }
}

/**
 * Restaura a configuração padrão do menu CEO
 */
export async function resetCeoMenuConfig() {
  const def: CeoMenuConfig = {
    categories: [...DEFAULT_CEO_CATEGORIES],
    categoryIcons: { ...DEFAULT_CEO_CATEGORY_ICONS },
    deletedItemIds: [...DEFAULT_CEO_DELETED_ITEM_IDS],
    items: [...DEFAULT_CEO_MENU_ITEMS],
  };
  await saveCeoMenuConfig(def);
}

/**
 * Hook reativo para consumir e atualizar a configuração do menu lateral do Painel CEO
 */
export function useCeoMenuConfig() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "{}");

  const config = useMemo<CeoMenuConfig>(() => {
    try {
      if (raw && raw !== "{}" && raw !== "null") {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return sanitizeCeoConfig(parsed);
        }
      }
    } catch {}
    return {
      categories: [...DEFAULT_CEO_CATEGORIES],
      categoryIcons: { ...DEFAULT_CEO_CATEGORY_ICONS },
      deletedItemIds: [...DEFAULT_CEO_DELETED_ITEM_IDS],
      items: [...DEFAULT_CEO_MENU_ITEMS],
    };
  }, [raw]);

  useEffect(() => {
    void fetchRemoteCeoMenuConfig();

    if (typeof window !== "undefined") {
      const handleFocus = () => void fetchRemoteCeoMenuConfig();
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

  const save = useCallback(async (newConfig: CeoMenuConfig) => {
    await saveCeoMenuConfig(newConfig);
  }, []);

  const reset = useCallback(async () => {
    await resetCeoMenuConfig();
  }, []);

  return { config, save, reset };
}
