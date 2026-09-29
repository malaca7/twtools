import { useState, useEffect, useCallback, useRef } from "react";
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
  root.style.setProperty("--platform-text-brightness", `${theme.textBrightness ?? 100}%`);
  root.setAttribute("data-text-brightness", `${theme.textBrightness ?? 100}`);

  // Custom Primary / Accent Color Override & Logo Brand Gradient (Degradês e Sólidos)
  if (theme.customPrimaryColor) {
    const raw = theme.customPrimaryColor;
    const isGradient = raw.startsWith("gradient:") || raw.includes("linear-gradient");

    let gradientCss = "";
    let solidColor = "";

    if (raw.startsWith("gradient:")) {
      const parts = raw.replace("gradient:", "").split("|");
      gradientCss = parts[0];
      solidColor = parts[1] || parts[0];
    } else if (raw.includes("linear-gradient")) {
      gradientCss = raw;
      const match = raw.match(/#(?:[0-9a-fA-F]{3,8})|oklch\([^)]+\)|rgb\([^)]+\)|hsl\([^)]+\)/);
      solidColor = match ? match[0] : "#6366f1";
    } else {
      solidColor = raw;
      gradientCss = `linear-gradient(105deg, ${raw} 0%, color-mix(in srgb, ${raw} 60%, #ffffff 40%) 100%)`;
    }

    root.style.setProperty("--primary", solidColor);
    root.style.setProperty("--ring", solidColor);
    root.style.setProperty("--sidebar-primary", solidColor);
    root.style.setProperty("--sidebar-ring", solidColor);
    root.style.setProperty("--color-primary", solidColor);
    root.style.setProperty("--custom-accent", solidColor);
    root.style.setProperty("--glow-color", solidColor);

    // Gradiente dinâmico da Logo / Brand e botões destacados
    root.style.setProperty("--gradient-brand", gradientCss);
    root.style.setProperty("--gradient-primary", gradientCss);

    // Variáveis derivadas para efeitos suaves de superfície e realces
    root.style.setProperty("--accent", `color-mix(in srgb, ${solidColor} 18%, transparent)`);
    root.style.setProperty("--accent-foreground", solidColor);
    root.style.setProperty("--sidebar-accent", `color-mix(in srgb, ${solidColor} 14%, transparent)`);
    root.style.setProperty("--sidebar-accent-foreground", solidColor);
    root.style.setProperty("--shadow-elegant", `0 0 28px -4px color-mix(in srgb, ${solidColor} 45%, transparent)`);
    root.style.setProperty("--shadow-glow", `0 0 20px -2px color-mix(in srgb, ${solidColor} 40%, transparent)`);
  } else {
    root.style.removeProperty("--primary");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--sidebar-primary");
    root.style.removeProperty("--sidebar-ring");
    root.style.removeProperty("--color-primary");
    root.style.removeProperty("--custom-accent");
    root.style.removeProperty("--glow-color");
    root.style.removeProperty("--gradient-brand");
    root.style.removeProperty("--gradient-primary");
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
  const { profile } = useAuth();
  const [localTheme, setLocalTheme] = useState<UserThemeSettings>(getLocalUserTheme);
  const [isSaving, setIsSaving] = useState(false);

  // Ref para rastrear o tema mais recente e evitar problemas de stale closure
  const latestThemeRef = useRef<UserThemeSettings>(localTheme);
  useEffect(() => {
    latestThemeRef.current = localTheme;
  }, [localTheme]);

  // Ref para saber se estamos ativamente salvando (evita que o sync remoto sobrescreva)
  const isSavingRef = useRef(false);

  // Sincroniza quando o perfil remoto do usuário carrega (apenas na carga inicial, não durante saves)
  useEffect(() => {
    // Se estamos salvando, ignorar o sync remoto para evitar reverter a alteração local
    if (isSavingRef.current) return;

    if (profile?.custom_theme) {
      const merged = { ...DEFAULT_USER_THEME, ...profile.custom_theme };
      setLocalTheme(merged);
      latestThemeRef.current = merged;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      applyThemeToDOM(merged);
    } else {
      const local = getLocalUserTheme();
      setLocalTheme(local);
      latestThemeRef.current = local;
      applyThemeToDOM(local);
    }
  }, [profile?.custom_theme]);

  // Listener para sincronizar alterações de tema entre abas e componentes
  useEffect(() => {
    const handleChange = () => {
      const current = getLocalUserTheme();
      setLocalTheme(current);
      latestThemeRef.current = current;
      applyThemeToDOM(current);
    };

    themeListeners.add(handleChange);
    return () => {
      themeListeners.delete(handleChange);
    };
  }, []);

  // Salva o tema individual (no localStorage e no perfil do Supabase) em tempo real
  // Aceita um objeto COMPLETO ou partial — usa latestThemeRef para evitar stale closures
  const saveTheme = useCallback(
    async (newSettings: Partial<UserThemeSettings> | UserThemeSettings, showFeedback = false) => {
      // Usa o ref para obter o estado mais recente (evita stale closure)
      const baseTheme = latestThemeRef.current;
      const updated: UserThemeSettings = {
        ...baseTheme,
        ...newSettings,
      };

      // Atualiza estado e ref simultaneamente
      setLocalTheme(updated);
      latestThemeRef.current = updated;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      applyThemeToDOM(updated);
      emitThemeChange();

      // Marca como salvando para bloquear o sync remoto de sobrescrever
      isSavingRef.current = true;
      setIsSaving(true);
      try {
        await updateUserTheme(updated);
        if (showFeedback) {
          toast.success("Seu tema e aparência individuais foram salvos!");
        }
      } catch (err: any) {
        console.warn("Tema salvo localmente (offline ou fallback):", err);
      } finally {
        setIsSaving(false);
        // Desbloqueia o sync remoto após um delay para evitar race condition
        setTimeout(() => {
          isSavingRef.current = false;
        }, 1000);
      }
    },
    [] // Sem dependências — usa refs para estado mais recente
  );

  // Pré-visualização instantânea sem salvar
  const previewTheme = useCallback((draft: Partial<UserThemeSettings>) => {
    const merged = { ...latestThemeRef.current, ...draft };
    applyThemeToDOM(merged);
  }, []);

  // Reverte para o tema padrão individual
  const resetTheme = useCallback(async () => {
    setLocalTheme(DEFAULT_USER_THEME);
    latestThemeRef.current = DEFAULT_USER_THEME;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER_THEME));
    } catch {}

    applyThemeToDOM(DEFAULT_USER_THEME);
    emitThemeChange();

    isSavingRef.current = true;
    try {
      await updateUserTheme(DEFAULT_USER_THEME);
      toast.success("Tema restaurado para o padrão!");
    } catch {
      toast.success("Tema padrão aplicado!");
    } finally {
      setTimeout(() => {
        isSavingRef.current = false;
      }, 1000);
    }
  }, []);

  return {
    theme: localTheme,
    isSaving,
    saveTheme,
    previewTheme,
    resetTheme,
  };
}
