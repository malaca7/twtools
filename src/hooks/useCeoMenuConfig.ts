import { useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CeoMenuItemConfig = {
  id: string;
  title: string;
  url: string;
  iconName?: string;
  visible: boolean;
  category: string;
  order: number;
};

export type CeoMenuConfig = {
  categories?: string[];
  categoryIcons?: Record<string, string>;
  items: CeoMenuItemConfig[];
};

export const DEFAULT_CEO_CATEGORIES = ["CEO"];

export const DEFAULT_CEO_MENU_ITEMS: CeoMenuItemConfig[] = [
  { id: "ceo-dashboard", title: "Visão Geral & Métricas", url: "/ceo/dashboard", iconName: "LayoutDashboard", visible: true, category: "CEO", order: 0 },
  { id: "ceo-bot", title: "Gerenciar Bot", url: "/ceo/bot", iconName: "Bot", visible: true, category: "CEO", order: 1 },
  { id: "ceo-webhooks", title: "WebHook Discord", url: "/ceo/webhooks", iconName: "Webhook", visible: true, category: "CEO", order: 2 },
  { id: "ceo-financas", title: "Fundo de Caixa & Finanças", url: "/ceo/financas", iconName: "Landmark", visible: true, category: "CEO", order: 3 },
  { id: "ceo-notificacoes", title: "Central de Notificações", url: "/ceo/notificacoes", iconName: "BellRing", visible: true, category: "CEO", order: 4 },
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
  const categories =
    Array.isArray(parsed?.categories) && parsed.categories.length > 0
      ? parsed.categories
      : [...DEFAULT_CEO_CATEGORIES];

  const defaultMap = new Map(DEFAULT_CEO_MENU_ITEMS.map((d) => [d.id, d]));

  const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
  const savedMap = new Map<string, CeoMenuItemConfig>();
  rawItems.forEach((i: any) => {
    if (i && typeof i === "object" && i.id) {
      savedMap.set(i.id, i);
    }
  });

  const merged = DEFAULT_CEO_MENU_ITEMS.map((def, defaultIdx) => {
    const saved = savedMap.get(def.id);
    if (!saved) return def;
    return {
      id: def.id,
      title:
        saved.title && typeof saved.title === "string" && saved.title.trim().length > 0
          ? saved.title.trim()
          : def.title,
      url:
        saved.url && typeof saved.url === "string" && saved.url.trim().length > 1 && saved.url !== "/"
          ? saved.url.trim()
          : def.url,
      iconName: saved.iconName || def.iconName,
      visible: typeof saved.visible === "boolean" ? saved.visible : def.visible,
      category:
        saved.category && typeof saved.category === "string" && saved.category.trim().length > 0
          ? saved.category.trim()
          : def.category,
      order: typeof saved.order === "number" ? saved.order : defaultIdx,
    };
  });

  const categoryIcons =
    parsed?.categoryIcons && typeof parsed.categoryIcons === "object"
      ? parsed.categoryIcons
      : {};

  return {
    categories,
    categoryIcons,
    items: merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
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
