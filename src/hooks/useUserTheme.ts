import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateUserTheme } from "@/lib/app-api";
import { DEFAULT_USER_THEME, type UserThemeSettings } from "@/lib/app-types";
import { toast } from "sonner";

const STORAGE_KEY = "tw_user_theme";

const themeListeners = new Set<() => void>();
function emitThemeChange() {
  themeListeners.forEach((fn) => fn());
}

/**
 * Aplica os atributos de tema e CSS variables no elemento raiz (<html>)
 */
export function applyThemeToDOM(theme: UserThemeSettings) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme.themeStyle || "cyberpunk");
  root.setAttribute("data-card-style", theme.cardStyle || "glassmorphism");
  root.setAttribute("data-font", theme.fontFamily || "space_grotesk");
  root.setAttribute("data-glow", theme.glowEffectsEnabled !== false ? "true" : "false");
  root.setAttribute("data-glow-intensity", theme.glowIntensity || "medium");
  root.setAttribute("data-status-pulse", theme.statusPulseEnabled !== false ? "true" : "false");
  root.setAttribute("data-page-transitions", theme.pageTransitionsEnabled !== false ? "true" : "false");
  root.setAttribute("data-hover-zoom", theme.hoverZoomEnabled !== false ? "true" : "false");
  root.setAttribute("data-border-glow-speed", theme.borderGlowSpeed || "normal");
  root.setAttribute("data-border-radius", theme.borderRadius || "smooth");
  root.setAttribute("data-bg-pattern", theme.bgPattern || "cyber_grid");
  root.setAttribute("data-ui-density", theme.uiDensity || "normal");

  root.style.setProperty("--platform-brightness", `${theme.brightness ?? 100}%`);
  root.style.setProperty("--platform-contrast", `${theme.contrast ?? 100}%`);
  root.style.setProperty("--platform-saturation", `${theme.saturation ?? 100}%`);

  // Custom Primary / Accent Color Override & Logo Brand Gradient
  if (theme.customPrimaryColor) {
    const custom = theme.customPrimaryColor;
    root.style.setProperty("--primary", custom);
    root.style.setProperty("--ring", custom);
    root.style.setProperty("--sidebar-primary", custom);
    root.style.setProperty("--sidebar-ring", custom);
    root.style.setProperty("--color-primary", custom);
    root.style.setProperty("--custom-accent", custom);
    root.style.setProperty("--glow-color", custom);

    // Gradiente dinâmico da Logo / Brand combinando a cor de destaque com tom luminoso
    root.style.setProperty(
      "--gradient-brand",
      `linear-gradient(105deg, ${custom} 0%, color-mix(in srgb, ${custom} 60%, #ffffff 40%) 100%)`
    );

    // Variáveis derivadas para efeitos suaves de superfície e realces
    root.style.setProperty("--accent", `color-mix(in srgb, ${custom} 18%, transparent)`);
    root.style.setProperty("--accent-foreground", custom);
    root.style.setProperty("--sidebar-accent", `color-mix(in srgb, ${custom} 14%, transparent)`);
    root.style.setProperty("--sidebar-accent-foreground", custom);
    root.style.setProperty("--shadow-elegant", `0 0 28px -4px color-mix(in srgb, ${custom} 45%, transparent)`);
    root.style.setProperty("--shadow-glow", `0 0 20px -2px color-mix(in srgb, ${custom} 40%, transparent)`);
  } else {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--sidebar-primary");
    root.style.removeProperty("--sidebar-ring");
    root.style.removeProperty("--color-primary");
    root.style.removeProperty("--custom-accent");
    root.style.removeProperty("--glow-color");
    root.style.removeProperty("--gradient-brand");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-foreground");
    root.style.removeProperty("--sidebar-accent");
    root.style.removeProperty("--sidebar-accent-foreground");
    root.style.removeProperty("--shadow-elegant");
    root.style.removeProperty("--shadow-glow");
  }
}

// Auto-executa no primeiro carregamento do script no navegador
if (typeof window !== "undefined") {
  try {
    const initialTheme = getLocalUserTheme();
    applyThemeToDOM(initialTheme);
  } catch {}
}

/**
 * Lê o tema individual salvo no localStorage
 */
function getLocalUserTheme(): UserThemeSettings {
  if (typeof window === "undefined") return DEFAULT_USER_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_THEME;
    return { ...DEFAULT_USER_THEME, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_THEME;
  }
}

/**
 * Hook para gerenciar e persistir o tema e a aparência INDIVIDUAL de cada membro.
 */
export function useUserTheme() {
  const { profile, refresh } = useAuth();
  const [localTheme, setLocalTheme] = useState<UserThemeSettings>(getLocalUserTheme);
  const [isSaving, setIsSaving] = useState(false);

  // Sincroniza quando o perfil remoto do usuário carrega
  useEffect(() => {
    if (profile?.custom_theme) {
      const merged = { ...DEFAULT_USER_THEME, ...profile.custom_theme };
      setLocalTheme(merged);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      applyThemeToDOM(merged);
    } else {
      const local = getLocalUserTheme();
      setLocalTheme(local);
      applyThemeToDOM(local);
    }
  }, [profile?.custom_theme]);

  // Listener para sincronizar alterações de tema entre abas e componentes
  useEffect(() => {
    const handleChange = () => {
      const current = getLocalUserTheme();
      setLocalTheme(current);
      applyThemeToDOM(current);
    };

    themeListeners.add(handleChange);
    return () => {
      themeListeners.delete(handleChange);
    };
  }, []);

  // Salva o tema individual (no localStorage e no perfil do Supabase)
  const saveTheme = useCallback(
    async (newSettings: Partial<UserThemeSettings>) => {
      const updated: UserThemeSettings = {
        ...localTheme,
        ...newSettings,
      };

      setLocalTheme(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      applyThemeToDOM(updated);
      emitThemeChange();

      setIsSaving(true);
      try {
        await updateUserTheme(updated);
        await refresh?.();
        toast.success("Seu tema e aparência individuais foram salvos!");
      } catch (err: any) {
        console.warn("Tema salvo localmente (offline ou fallback):", err);
        toast.success("Tema salvo no seu navegador!");
      } finally {
        setIsSaving(false);
      }
    },
    [localTheme, refresh]
  );

  // Pré-visualização instantânea sem salvar
  const previewTheme = useCallback((draft: Partial<UserThemeSettings>) => {
    const merged = { ...localTheme, ...draft };
    applyThemeToDOM(merged);
  }, [localTheme]);

  // Reverte para o tema padrão individual
  const resetTheme = useCallback(async () => {
    setLocalTheme(DEFAULT_USER_THEME);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER_THEME));
    } catch {}

    applyThemeToDOM(DEFAULT_USER_THEME);
    emitThemeChange();

    try {
      await updateUserTheme(DEFAULT_USER_THEME);
      await refresh?.();
      toast.success("Tema restaurado para o padrão!");
    } catch {
      toast.success("Tema padrão aplicado!");
    }
  }, [refresh]);

  return {
    theme: localTheme,
    isSaving,
    saveTheme,
    previewTheme,
    resetTheme,
  };
}
