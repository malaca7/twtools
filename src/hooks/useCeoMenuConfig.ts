import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
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

export const DEFAULT_CEO_CATEGORIES = ["CEO Tools"];

export const DEFAULT_CEO_MENU_ITEMS: CeoMenuItemConfig[] = [
  { id: "ceo-dashboard", title: "Visão Geral & Métricas", url: "/ceo/dashboard", iconName: "LayoutDashboard", visible: true, category: "CEO Tools", order: 0 },
  { id: "ceo-bot", title: "Gerenciar Bot", url: "/ceo/bot", iconName: "Bot", visible: true, category: "CEO Tools", order: 1 },
  { id: "ceo-webhooks", title: "WebHook Discord", url: "/ceo/webhooks", iconName: "Webhook", visible: true, category: "CEO Tools", order: 2 },
  { id: "ceo-financas", title: "Fundo de Caixa & Finanças", url: "/ceo/financas", iconName: "Landmark", visible: true, category: "CEO Tools", order: 3 },
  { id: "ceo-ajustes-estoque", title: "Ajustes de Estoque", url: "/ceo/ajustes-estoque", iconName: "Sliders", visible: true, category: "CEO Tools", order: 4 },
  { id: "ceo-notificacoes", title: "Central de Notificações", url: "/ceo/notificacoes", iconName: "BellRing", visible: true, category: "CEO Tools", order: 5 },
  { id: "ceo-tags", title: "Gerenciar Tags", url: "/ceo/tags", iconName: "Tags", visible: true, category: "CEO Tools", order: 6 },
  { id: "ceo-advertencias", title: "Advertências & Suspensões", url: "/ceo/advertencias", iconName: "ShieldAlert", visible: true, category: "CEO Tools", order: 7 },
  { id: "ceo-selos", title: "Gerenciar Selos", url: "/ceo/selos", iconName: "BadgeCheck", visible: true, category: "CEO Tools", order: 8 },
];

export const CEO_SYSTEM_MODULES = [
  { id: "ceo-dashboard", title: "Visão Geral & Métricas", url: "/ceo/dashboard", defaultCat: "CEO Tools", iconName: "LayoutDashboard", description: "Painel executivo com métricas consolidadas e faturamento geral" },
  { id: "ceo-bot", title: "Gerenciar Bot", url: "/ceo/bot", defaultCat: "CEO Tools", iconName: "Bot", description: "Configuração do bot Discloud e sincronização do Discord" },
  { id: "ceo-webhooks", title: "WebHook Discord", url: "/ceo/webhooks", defaultCat: "CEO Tools", iconName: "Webhook", description: "Integração de canais de avisos e notificações no Discord" },
  { id: "ceo-financas", title: "Fundo de Caixa & Finanças", url: "/ceo/financas", defaultCat: "CEO Tools", iconName: "Landmark", description: "Gestão executiva de cofres, metas monetárias e auditoria" },
  { id: "ceo-ajustes-estoque", title: "Ajustes de Estoque", url: "/ceo/ajustes-estoque", defaultCat: "CEO Tools", iconName: "Sliders", description: "Ajustes administrativos manuais de quantidades em baús" },
  { id: "ceo-notificacoes", title: "Central de Notificações", url: "/ceo/notificacoes", defaultCat: "CEO Tools", iconName: "BellRing", description: "Disparo e broadcast de notificações e avisos em massa" },
  { id: "ceo-tags", title: "Gerenciar Tags", url: "/ceo/tags", defaultCat: "CEO Tools", iconName: "Tags", description: "Criação, cores, ícones e vinculação de tags da facção" },
  { id: "ceo-advertencias", title: "Advertências & Suspensões", url: "/ceo/advertencias", defaultCat: "CEO Tools", iconName: "ShieldAlert", description: "Auditoria e gestão de punições, advertências e suspensões" },
  { id: "ceo-selos", title: "Gerenciar Selos", url: "/ceo/selos", defaultCat: "CEO Tools", iconName: "BadgeCheck", description: "Painel de gestão, análise de pedidos e aprovação de Selos de Verificação" },
];

const STORAGE_KEY = "tw_ceo_menu_config";
const PERMISSION_LEVEL = "system_ceo_menu_config";

// External store listeners for cross-component reactivity
const listeners = new Set<() => void>();
export function emitCeoChange() {
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

export function sanitizeCeoConfig(parsed: any): CeoMenuConfig {
  let categories: string[] =
    Array.isArray(parsed?.categories) && parsed.categories.length > 0
      ? parsed.categories.map((c: any) => String(c).trim()).filter(Boolean)
      : [];

  categories = Array.from(new Set(categories));
  if (categories.length === 0) {
    categories = [...DEFAULT_CEO_CATEGORIES];
  }

  const deletedIds = new Set<string>(
    Array.isArray(parsed?.deletedItemIds) ? parsed.deletedItemIds : []
  );

  const defaultIds = new Set(DEFAULT_CEO_MENU_ITEMS.map((d) => d.id));
  const primaryCat = categories[0] || "CEO Tools";

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

  const categoryIcons =
    parsed?.categoryIcons && typeof parsed.categoryIcons === "object"
      ? parsed.categoryIcons
      : {};

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
    if (!raw || raw === "{}" || raw === "null" || raw === "undefined") return null;
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
        emitCeoChange();
        return cfg as CeoMenuConfig;
      }
    }
  } catch (err) {
    console.warn("Erro ao buscar ceo_menu_config remoto do banco:", err);
  }
  return getCeoMenuConfig();
}

/**
 * Salva a configuração do menu CEO localmente e persiste no Supabase
 */
export async function saveCeoMenuConfig(config: CeoMenuConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  emitCeoChange();

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
    console.warn("Falha ao salvar ceo_menu_config remotamente:", err);
  }
}

/**
 * Restaura a configuração padrão do menu CEO
 */
export async function resetCeoMenuConfig() {
  const def: CeoMenuConfig = {
    categories: [...DEFAULT_CEO_CATEGORIES],
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
      items: [...DEFAULT_CEO_MENU_ITEMS],
    };
  }, [raw]);

  useEffect(() => {
    fetchRemoteCeoMenuConfig();
  }, []);

  const save = useCallback(async (newConfig: CeoMenuConfig) => {
    await saveCeoMenuConfig(newConfig);
  }, []);

  const reset = useCallback(async () => {
    await resetCeoMenuConfig();
  }, []);

  return { config, save, reset };
}
