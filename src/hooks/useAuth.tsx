import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAuth, logoutFromApp } from "@/lib/app-api";
import type { AppUser, AuthState, Profile, SignupRequestStatus } from "@/lib/app-types";
import { can, LEVEL_LABEL, type AppLevel, type Permission } from "@/lib/permissions";
import { useRolePermissions } from "@/hooks/useData";
import { isUserDeveloper, DEV_DISCORD_IDS, isDevBypassActive, DEV_CONFIG_EVENT, CEO_CONFIG_EVENT, getCeoTagPermissionsSync, isUserCeo } from "@/services/devService";

type Session = { user: AppUser } | null;

type AuthContextValue = {
  session: Session | null;
  user: AppUser | null;
  profile: Profile | null;
  level: AppLevel | null;
  signupRequestStatus: SignupRequestStatus | null;
  approvedAccess: boolean;
  isDevMode: boolean;
  isDevUser: boolean;
  isCeoMode: boolean;
  isCeoUser: boolean;
  panelMode: "member" | "dev" | "ceo";
  setPanelMode: (mode: "member" | "dev" | "ceo") => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [level, setLevel] = useState<AppLevel | null>(null);
  const [signupRequestStatus, setSignupRequestStatus] = useState<SignupRequestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [panelMode, setPanelModeState] = useState<"member" | "dev" | "ceo">(() => {
    if (typeof window === "undefined") return "member";
    return (localStorage.getItem("tw_panel_mode") as "member" | "dev" | "ceo") || "member";
  });
  const { data: customRolePermissions } = useRolePermissions();

  const prevLevelRef = useRef<AppLevel | null>(null);

  const applyState = useCallback((next: AuthState) => {
    // Notify member if their role/level was updated by leadership
    if (prevLevelRef.current && next.level && prevLevelRef.current !== next.level) {
      const newLevelName = LEVEL_LABEL[next.level] || next.level;
      toast.success(`Seu cargo foi atualizado para "${newLevelName}" pela liderança!`, {
        icon: "🛡️",
        duration: 5000,
      });
    }
    prevLevelRef.current = next.level;

    setSession((prev) => {
      if (!next.user && !prev) return null;
      if (next.user && prev?.user && next.user.id === prev.user.id && next.user.email === prev.user.email) {
        return prev;
      }
      return next.user ? { user: next.user } : null;
    });

    setProfile((prev) => {
      if (!next.profile && !prev) return null;
      if (!next.profile || !prev) return next.profile;
      if (
        prev.id === next.profile.id &&
        prev.nome === next.profile.nome &&
        prev.nickname === next.profile.nickname &&
        prev.status === next.profile.status &&
        prev.avatar_url === next.profile.avatar_url &&
        prev.is_developer === next.profile.is_developer &&
        prev.is_ceo === next.profile.is_ceo &&
        prev.custom_url === next.profile.custom_url
      ) {
        return prev;
      }
      return next.profile;
    });

    setLevel((prev) => (prev === next.level ? prev : next.level));
    setSignupRequestStatus((prev) => (prev === next.signupRequestStatus ? prev : next.signupRequestStatus));
  }, []);

  const loadAuth = useCallback(async () => {
    const next = await getCurrentAuth();

    // DEV FALLBACK: If no real session, check for dev impersonation in sessionStorage
    if (!next.user && typeof window !== "undefined") {
      const devRaw = sessionStorage.getItem("tw_dev_impersonate");
      if (devRaw) {
        try {
          const dev = JSON.parse(devRaw);
          const devState: AuthState = {
            user: { id: dev.user_id, email: dev.discord_email || null },
            profile: {
              id: dev.user_id,
              user_id: dev.user_id,
              nome: dev.nome || "Membro",
              nickname: dev.nickname || null,
              telefone: null,
              game_id: null,
              avatar_url: dev.discord_avatar_url || null,
              status: dev.status || "ativo",
              data_entrada: new Date().toISOString().slice(0, 10),
              discord_id: dev.discord_id || null,
              discord_username: dev.discord_username || null,
              discord_avatar_url: dev.discord_avatar_url || null,
              discord_email: dev.discord_email || null,
            },
            level: dev.nivel || null,
            signupRequestStatus: null,
            approvedAccess: Boolean(dev.nivel && dev.status === "ativo"),
          };
          applyState(devState);
          return;
        } catch {}
      }
    }

    applyState(next);

    // If user is authenticated and login has not been logged for this browser session yet
    if (next.user && !sessionStorage.getItem("tw_login_logged")) {
      sessionStorage.setItem("tw_login_logged", String(Date.now()));
      if (!sessionStorage.getItem("tw_session_start")) {
        sessionStorage.setItem("tw_session_start", String(Date.now()));
      }
      try {
        const { logAuditAction } = await import("@/lib/app-api");
        await logAuditAction("login", "auth", {
          user_id: next.user.id,
          user_name: next.profile?.nickname || next.profile?.nome || "Membro",
        });
        await logAuditAction("session_start", "user_presence", {
          user_id: next.user.id,
          user_name: next.profile?.nickname || next.profile?.nome || "Membro",
        });
      } catch (err) {}
    }
  }, [applyState]);

  useEffect(() => {
    void loadAuth().finally(() => setLoading(false));
  }, [loadAuth]);

  // Real-time synchronization for role changes and permissions updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const currentUserId = session.user.id;

    const channel = supabase
      .channel(`realtime-user-auth-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${currentUserId}`,
        },
        async () => {
          await loadAuth();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${currentUserId}`,
        },
        async () => {
          await loadAuth();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "role_permissions",
        },
        async () => {
          void queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadAuth, queryClient, session?.user?.id]);

  const refresh = useCallback(async () => {
    await loadAuth();
  }, [loadAuth]);

  const signOut = useCallback(async () => {
    const startStr = sessionStorage.getItem("tw_session_start");
    let durationFormatted = "";
    if (startStr) {
      const elapsedSeconds = Math.max(1, Math.floor((Date.now() - Number(startStr)) / 1000));
      const hours = Math.floor(elapsedSeconds / 3600);
      const mins = Math.floor((elapsedSeconds % 3600) / 60);
      durationFormatted = hours > 0 ? `${hours}h ${mins}min` : `${mins || 1}min`;
    }
    sessionStorage.removeItem("tw_session_start");
    sessionStorage.removeItem("tw_login_logged");
    sessionStorage.removeItem("tw_dev_impersonate");

    try {
      const { logAuditAction, updateUserPresence } = await import("@/lib/app-api");
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      const targetUserId = activeSession?.user?.id || profile?.user_id || session?.user?.id;

      if (targetUserId) {
        const { data: profRow } = await (supabase.from("profiles" as any))
          .select("nome, nickname")
          .eq("user_id", targetUserId)
          .maybeSingle();

        const pAny = profRow as any;
        const userName = pAny?.nickname || pAny?.nome || profile?.nickname || profile?.nome || "Membro";

        await logAuditAction("logout", "auth", {
          user_id: targetUserId,
          user_name: userName,
          duration_formatted: durationFormatted || "1min",
        });
        await logAuditAction("session_end", "user_presence", {
          user_id: targetUserId,
          user_name: userName,
          duration_formatted: durationFormatted || "1min",
          reason: "logout_usuario",
        });
        await updateUserPresence("offline", 0);
      }
    } catch (err) {
      console.error("Erro ao registrar logs de saída:", err);
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao deslogar do Supabase:", error);
    }
    await logoutFromApp();
    applyState({
      user: null,
      profile: null,
      level: null,
      signupRequestStatus: null,
      approvedAccess: false,
    });
  }, [profile, session, applyState]);

  const isDevUser = isUserDeveloper(
    session?.user ? { id: session.user.id, email: session.user.email ?? null } : null,
    profile,
    level
  );

  const isCeoUser = isUserCeo(profile);

  const isDevMode = Boolean(
    isDevUser &&
      (panelMode === "dev" ||
        (typeof window !== "undefined" &&
          (window.location.pathname.startsWith("/dev") || window.location.hash.includes("/dev"))))
  );

  const isCeoMode = Boolean(
    (isCeoUser || isDevUser) &&
      (panelMode === "ceo" ||
        (typeof window !== "undefined" &&
          (window.location.pathname.startsWith("/ceo") || window.location.hash.includes("/ceo"))))
  );

  const setPanelMode = useCallback((mode: "member" | "dev" | "ceo") => {
    setPanelModeState(mode);
    try {
      localStorage.setItem("tw_panel_mode", mode);
      sessionStorage.setItem("tw_panel_mode", mode);
    } catch {}
  }, []);

  // Sincronização reativa instantânea com as opções de ajuste geral Dev (Bypass, etc.)
  const [devConfigTick, setDevConfigTick] = useState(0);

  useEffect(() => {
    const handleConfigUpdate = () => {
      setDevConfigTick((prev) => prev + 1);
    };
    window.addEventListener(DEV_CONFIG_EVENT, handleConfigUpdate);
    window.addEventListener(CEO_CONFIG_EVENT, handleConfigUpdate);
    window.addEventListener("storage", handleConfigUpdate);
    return () => {
      window.removeEventListener(DEV_CONFIG_EVENT, handleConfigUpdate);
      window.removeEventListener(CEO_CONFIG_EVENT, handleConfigUpdate);
      window.removeEventListener("storage", handleConfigUpdate);
    };
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => {
      const bypassActive = isDevBypassActive();
      const inCeoPanel =
        panelMode === "ceo" ||
        (typeof window !== "undefined" &&
          (window.location.pathname.startsWith("/ceo") || window.location.hash.includes("/ceo")));

      // 1. Se o Bypass de Autorização Dev estiver ATIVO e for um usuário desenvolvedor verificado:
      // Concede acesso supremo irrestrito a todas as páginas e ações, EXCETO quando estiver operando no painel CEO
      if (isDevUser && bypassActive && !inCeoPanel) {
        return true;
      }

      // 2. Avaliação da Tag CEO: se estiver no painel CEO ou possuir a Tag CEO ativa
      if (inCeoPanel || isCeoUser) {
        const ceoPerms = getCeoTagPermissionsSync();
        if (Array.isArray(ceoPerms)) {
          if (inCeoPanel) {
            return ceoPerms.includes(permission);
          }
          if (ceoPerms.includes(permission)) {
            return true;
          }
        }
      }

      // 3. Avalia rigorosamente as permissões reais atribuídas ao cargo do membro na matriz de permissões
      return can(level, permission, customRolePermissions);
    },
    [level, isDevUser, isCeoUser, customRolePermissions, devConfigTick, panelMode]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      level,
      signupRequestStatus,
      approvedAccess: Boolean(
        profile &&
          level &&
          profile.status === "ativo" &&
          signupRequestStatus !== "pendente" &&
          signupRequestStatus !== "rejeitado"
      ),
      loading,
      isDevMode,
      isDevUser,
      isCeoMode,
      isCeoUser,
      panelMode,
      setPanelMode,
      refresh,
      signOut,
      hasPermission,
    }),
    [
      session,
      profile,
      level,
      signupRequestStatus,
      loading,
      isDevMode,
      isDevUser,
      isCeoMode,
      isCeoUser,
      panelMode,
      setPanelMode,
      refresh,
      signOut,
      hasPermission,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
