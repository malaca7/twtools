import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAuth, logoutFromApp } from "@/lib/app-api";
import type { AppUser, AuthState, Profile, SignupRequestStatus } from "@/lib/app-types";
import { can, satisfiesPermission, LEVEL_LABEL, type AppLevel, type Permission } from "@/lib/permissions";
import { useRolePermissions } from "@/hooks/useData";
import { isUserDeveloper, DEV_DISCORD_IDS, isDevBypassActive, DEV_CONFIG_EVENT, CEO_CONFIG_EVENT, getCeoTagPermissionsSync, getDevTagPermissionsSync, isUserCeo } from "@/services/devService";
import { parseMemberTagRules, getMemberTags, getMemberTagAssignments, CEO_SYSTEM_TAG, DEV_SYSTEM_TAG, type MemberTag } from "@/services/memberTagsService";
import type { MemberWarning, SuspensionFunctionalBlocks } from "@/types/warnings";
import { getWarnings, WARNINGS_REALTIME_EVENT } from "@/services/warningsService";

type Session = { user: AppUser } | null;

type AuthContextValue = {
  session: Session | null;
  user: AppUser | null;
  profile: Profile | null;
  level: AppLevel | null;
  signupRequestStatus: SignupRequestStatus | null;
  approvedAccess: boolean;
  loading: boolean;
  isDevMode: boolean;
  isDevUser: boolean;
  isCeoMode: boolean;
  isCeoUser: boolean;
  panelMode: "member" | "dev" | "ceo";
  setPanelMode: (mode: "member" | "dev" | "ceo") => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: Permission, panelOverride?: "member" | "dev" | "ceo") => boolean;
  hasMemberRolePermission: (permission: Permission) => boolean;
  memberTags: MemberTag[];
  tagPermissions: Permission[];
  hasTag: (tagId: string) => boolean;
  isMemberBlocked: boolean;
  isPlatformLocked: boolean;
  platformLockedTags: MemberTag[];
  activeSuspension: MemberWarning | null;
  isSuspended: boolean;
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
        prev.discord_avatar_url === next.profile.discord_avatar_url &&
        prev.banner_url === next.profile.banner_url &&
        prev.bio === next.profile.bio &&
        prev.custom_status === next.profile.custom_status &&
        prev.is_developer === next.profile.is_developer &&
        prev.is_ceo === next.profile.is_ceo &&
        prev.custom_url === next.profile.custom_url &&
        prev.xp === next.profile.xp &&
        prev.tw_coins === next.profile.tw_coins &&
        prev.gamification_level === next.profile.gamification_level &&
        prev.stars_rating === next.profile.stars_rating &&
        prev.stars_count === next.profile.stars_count &&
        prev.is_verified === next.profile.is_verified &&
        JSON.stringify(prev.custom_theme) === JSON.stringify(next.profile.custom_theme)
      ) {
        return prev;
      }
      return next.profile;
    });

    setLevel((prev) => (prev === next.level ? prev : next.level));
    setSignupRequestStatus((prev) => (prev === next.signupRequestStatus ? prev : next.signupRequestStatus));
  }, []);

  const loadAuth = useCallback(async () => {
    // 1. DEV SIMULATOR: Prioritize simulation stored in sessionStorage (if active from Dev Hub)
    if (typeof window !== "undefined") {
      const simRaw = sessionStorage.getItem("tw_dev_impersonate");
      if (simRaw) {
        try {
          const sim = JSON.parse(simRaw);
          const simState: AuthState = {
            user: { id: sim.user_id || "dev-sim", email: sim.discord_email || null },
            profile: {
              id: sim.id || sim.user_id,
              user_id: sim.user_id,
              nome: sim.nome || "Membro",
              nickname: sim.nickname || null,
              telefone: sim.telefone || null,
              game_id: sim.game_id || null,
              avatar_url: sim.avatar_url || sim.discord_avatar_url || null,
              original_avatar_url: sim.original_avatar_url || sim.custom_theme?.original_avatar_url || null,
              banner_url: sim.banner_url || sim.custom_theme?.banner_url || null,
              original_banner_url: sim.original_banner_url || sim.custom_theme?.original_banner_url || null,
              status: sim.status || "ativo",
              data_entrada: sim.data_entrada || "2026-09-04",
              discord_id: sim.discord_id || null,
              discord_username: sim.discord_username || null,
              discord_avatar_url: sim.discord_avatar_url || sim.avatar_url || null,
              discord_email: sim.discord_email || null,
              is_developer: Boolean(sim.is_developer === true),
              is_ceo: Boolean(sim.is_ceo === true || sim.custom_theme?.is_ceo === true || isUserCeo(sim)),
              bio: sim.bio || sim.custom_theme?.bio || null,
              custom_status: sim.custom_status || sim.custom_theme?.custom_status || null,
              social_links: sim.social_links || sim.custom_theme?.social_links || null,
              custom_theme: sim.custom_theme || null,
              custom_url: sim.custom_url || sim.custom_theme?.custom_url || null,
              is_verified: Boolean(sim.is_verified === true),
            },
            level: sim.nivel || "novato",
            signupRequestStatus: null,
            approvedAccess: true,
          };

          if (sim.custom_theme && typeof document !== "undefined") {
            try {
              const th = sim.custom_theme;
              if (th.themeStyle) document.documentElement.setAttribute("data-theme-style", th.themeStyle);
              if (th.cardStyle) document.documentElement.setAttribute("data-card-style", th.cardStyle);
              if (th.bgPattern) document.documentElement.setAttribute("data-bg-pattern", th.bgPattern);
              if (th.fontFamily) document.documentElement.setAttribute("data-font-family", th.fontFamily);
            } catch {}
          }

          applyState(simState);
          return;
        } catch {}
      }
    }

    const next = await getCurrentAuth();

    // 2. DEV DIRECT LOGIN FALLBACK: If no real Supabase session, check localStorage
    if (!next.user && typeof window !== "undefined") {
      const devRaw = localStorage.getItem("tw_dev_impersonate");
      if (devRaw) {
        try {
          const dev = JSON.parse(devRaw);
          const devState: AuthState = {
            user: { id: dev.user_id, email: dev.discord_email || null },
            profile: {
              id: dev.id || dev.user_id,
              user_id: dev.user_id,
              nome: dev.nome || "Membro",
              nickname: dev.nickname || null,
              telefone: dev.telefone || null,
              game_id: dev.game_id || null,
              avatar_url: dev.avatar_url || dev.discord_avatar_url || null,
              original_avatar_url: dev.original_avatar_url || dev.custom_theme?.original_avatar_url || null,
              banner_url: dev.banner_url || dev.custom_theme?.banner_url || null,
              original_banner_url: dev.original_banner_url || dev.custom_theme?.original_banner_url || null,
              status: dev.status || "ativo",
              data_entrada: dev.data_entrada || "2026-09-04",
              discord_id: dev.discord_id || null,
              discord_username: dev.discord_username || null,
              discord_avatar_url: dev.discord_avatar_url || dev.avatar_url || null,
              discord_email: dev.discord_email || null,
              is_developer: Boolean(dev.is_developer === true),
              is_ceo: Boolean(dev.is_ceo === true || dev.custom_theme?.is_ceo === true || isUserCeo(dev)),
              bio: dev.bio || dev.custom_theme?.bio || null,
              custom_status: dev.custom_status || dev.custom_theme?.custom_status || null,
              social_links: dev.social_links || dev.custom_theme?.social_links || null,
              custom_theme: dev.custom_theme || null,
              custom_url: dev.custom_url || dev.custom_theme?.custom_url || null,
              is_verified: Boolean(dev.is_verified === true),
            },
            level: dev.nivel || "novato",
            signupRequestStatus: dev.status === "pendente" ? "pendente" : (dev.status === "rejeitado" ? "rejeitado" : null),
            approvedAccess: dev.status === "ativo",
          };

          if (dev.custom_theme && typeof document !== "undefined") {
            try {
              const th = dev.custom_theme;
              if (th.themeStyle) document.documentElement.setAttribute("data-theme-style", th.themeStyle);
              if (th.cardStyle) document.documentElement.setAttribute("data-card-style", th.cardStyle);
              if (th.bgPattern) document.documentElement.setAttribute("data-bg-pattern", th.bgPattern);
              if (th.fontFamily) document.documentElement.setAttribute("data-font-family", th.fontFamily);
            } catch {}
          }

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
      } catch (err) {}
    }
  }, [applyState]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) setLoading(false);
    }, 2500);

    void loadAuth().finally(() => {
      if (active) {
        clearTimeout(timer);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loadAuth]);

  // Real-time synchronization for role changes and permissions updates
  useEffect(() => {
    const currentUserId = profile?.user_id || session?.user?.id;
    if (!currentUserId) return;

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
          void queryClient.invalidateQueries({ queryKey: ["auth"], refetchType: "all" });
          void queryClient.invalidateQueries({ queryKey: ["auth_session"], refetchType: "all" });
          void queryClient.invalidateQueries({ queryKey: ["members"], refetchType: "all" });
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
          void queryClient.invalidateQueries({ queryKey: ["auth"], refetchType: "active" });
          void queryClient.invalidateQueries({ queryKey: ["auth_session"], refetchType: "active" });
          void queryClient.invalidateQueries({ queryKey: ["members"], refetchType: "active" });
        }
      )
      .subscribe();

    const handleVerif = () => {
      void loadAuth();
      setPermissionsTick((t) => t + 1);
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["member_tags"] });
      void queryClient.invalidateQueries({ queryKey: ["member_tag_assignments"] });
    };
    window.addEventListener("tw_verifications_updated", handleVerif);
    window.addEventListener(CEO_CONFIG_EVENT, handleVerif);
    window.addEventListener(DEV_CONFIG_EVENT, handleVerif);
    window.addEventListener("tw_tags_updated", handleVerif);
    window.addEventListener("tw_member_updated", handleVerif);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("tw_verifications_updated", handleVerif);
      window.removeEventListener(CEO_CONFIG_EVENT, handleVerif);
      window.removeEventListener(DEV_CONFIG_EVENT, handleVerif);
      window.removeEventListener("tw_tags_updated", handleVerif);
      window.removeEventListener("tw_member_updated", handleVerif);
    };
  }, [loadAuth, queryClient, profile?.user_id, session?.user?.id]);

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
    localStorage.removeItem("tw_dev_impersonate");
    localStorage.removeItem("tw_panel_mode");

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

  // Sincronização reativa instantânea com as opções de ajuste geral Dev (Bypass, etc.)
  const [devConfigTick, setDevConfigTick] = useState(0);
  const [permissionsTick, setPermissionsTick] = useState(0);

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

  // Sincronização reativa instantânea em tempo real de permissões, cargos e autorizações de membros
  useEffect(() => {
    const handlePermissionsSynced = () => {
      setPermissionsTick((t) => t + 1);
      void queryClient.invalidateQueries({ queryKey: ["role_permissions"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["custom_roles"], refetchType: "all" });
      void loadAuth();
    };

    const handleAuthReload = (e?: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent?.detail;
      const eventTargetIds: string[] = [
        detail?.userId,
        detail?.user_id,
        detail?.memberId,
        detail?.member_id,
        detail?.id,
        detail?.new?.user_id,
        detail?.new?.id,
        detail?.new?.member_id,
        detail?.old?.user_id,
        detail?.old?.id,
        ...(Array.isArray(detail?.candidateIds) ? detail.candidateIds : []),
      ]
        .filter(Boolean)
        .map((id) => String(id).trim().toLowerCase());

      const myIds = new Set(
        [
          profile?.user_id,
          session?.user?.id,
          profile?.id,
          profile?.discord_id,
          (profile as any)?.game_id,
        ]
          .filter(Boolean)
          .map((id) => String(id).trim().toLowerCase())
      );

      const isTargetForMe = eventTargetIds.length === 0 || eventTargetIds.some((id) => myIds.has(id));

      // 1. AÇÃO SÍNCRONA INSTANTÂNEA SE A TAG FOI REMOVIDA (0ms)
      if (detail?.type === "tag_toggle" && detail?.status === false) {
        const removedTag = String(detail?.tag || "").toLowerCase().trim();

        // Se a tag removida foi para este usuário conectado, limpa na hora o estado local
        if (isTargetForMe) {
          setMemberTagsState((prev) =>
            prev.filter((t) => {
              if (removedTag === "ceo" && isCeoTagItem(t)) return false;
              if ((removedTag === "dev" || removedTag === "desenvolvedor") && isDevTagItem(t)) return false;
              return t.id.toLowerCase() !== removedTag;
            })
          );

          setProfile((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            if (removedTag === "ceo") {
              updated.is_ceo = false;
              if (updated.custom_theme) {
                updated.custom_theme = { ...updated.custom_theme, is_ceo: false };
              }
            }
            if (removedTag === "dev" || removedTag === "desenvolvedor") {
              updated.is_developer = false;
            }
            return updated;
          });

          if (removedTag === "ceo") {
            try {
              const raw = localStorage.getItem("tw_ceo_config");
              if (raw) {
                const cfg = JSON.parse(raw);
                cfg.activeCeoUserIds = (cfg.activeCeoUserIds || []).filter(
                  (id: string) => !myIds.has(String(id).toLowerCase())
                );
                localStorage.setItem("tw_ceo_config", JSON.stringify(cfg));
                localStorage.setItem("tw_ceo_config_v1", JSON.stringify(cfg));
              }
              const devRaw = localStorage.getItem("tw_dev_impersonate");
              if (devRaw) {
                const dev = JSON.parse(devRaw);
                dev.is_ceo = false;
                if (dev.custom_theme) dev.custom_theme.is_ceo = false;
                localStorage.setItem("tw_dev_impersonate", JSON.stringify(dev));
                sessionStorage.setItem("tw_dev_impersonate", JSON.stringify(dev));
              }
            } catch {}

            setPanelModeState("member");
            try {
              localStorage.setItem("tw_panel_mode", "member");
              sessionStorage.setItem("tw_panel_mode", "member");
            } catch {}

            if (typeof window !== "undefined") {
              const currentPath = (window.location.pathname || "").toLowerCase();
              if (currentPath.startsWith("/ceo")) {
                toast.error("Seu acesso à Tag CEO foi revogado pela liderança.", { id: "ceo-tag-revoked" });
                window.location.replace("/dashboard");
              }
            }
          }

          if (removedTag === "dev" || removedTag === "desenvolvedor") {
            try {
              localStorage.removeItem("tw_dev_auth");
              const devRaw = localStorage.getItem("tw_dev_impersonate");
              if (devRaw) {
                const dev = JSON.parse(devRaw);
                dev.is_developer = false;
                localStorage.setItem("tw_dev_impersonate", JSON.stringify(dev));
                sessionStorage.setItem("tw_dev_impersonate", JSON.stringify(dev));
              }
            } catch {}

            setPanelModeState("member");
            try {
              localStorage.setItem("tw_panel_mode", "member");
              sessionStorage.setItem("tw_panel_mode", "member");
            } catch {}

            if (typeof window !== "undefined") {
              const currentPath = (window.location.pathname || "").toLowerCase();
              if (currentPath.startsWith("/dev")) {
                toast.error("Seu acesso à Tag Dev foi revogado pela liderança.", { id: "dev-tag-revoked" });
                window.location.replace("/dashboard");
              }
            }
          }
        }
      }

      // 1.1 AÇÃO SÍNCRONA INSTANTÂNEA SE A TAG FOI CONCEDIDA (0ms)
      if (detail?.type === "tag_toggle" && detail?.status === true) {
        const addedTag = String(detail?.tag || "").toLowerCase().trim();

        // Se a tag concedida foi para este usuário conectado, aplica na hora o estado local
        if (isTargetForMe) {
          setMemberTagsState((prev) => {
            const next = [...prev];
            if (addedTag === "ceo") {
              if (!next.some((t) => isCeoTagItem(t))) {
                next.unshift(CEO_SYSTEM_TAG);
              }
            } else if (addedTag === "dev" || addedTag === "desenvolvedor") {
              if (!next.some((t) => isDevTagItem(t))) {
                next.unshift(DEV_SYSTEM_TAG);
              }
            }
            return next;
          });

          setProfile((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            if (addedTag === "ceo") {
              updated.is_ceo = true;
              if (updated.custom_theme) {
                updated.custom_theme = { ...updated.custom_theme, is_ceo: true };
              } else {
                updated.custom_theme = { is_ceo: true };
              }
            }
            if (addedTag === "dev" || addedTag === "desenvolvedor") {
              updated.is_developer = true;
            }
            return updated;
          });

          if (addedTag === "ceo") {
            try {
              const raw = localStorage.getItem("tw_ceo_config") || "{}";
              const cfg = JSON.parse(raw);
              const list = new Set(cfg.activeCeoUserIds || []);
              for (const id of myIds) list.add(id);
              cfg.activeCeoUserIds = Array.from(list);
              localStorage.setItem("tw_ceo_config", JSON.stringify(cfg));
              localStorage.setItem("tw_ceo_config_v1", JSON.stringify(cfg));
            } catch {}

            toast.success("Você recebeu a Tag CEO! O painel executivo e suas permissões foram ativados em tempo real. 👑", {
              id: "ceo-tag-granted",
            });
          }

          if (addedTag === "dev" || addedTag === "desenvolvedor") {
            toast.success("Você recebeu a Tag Dev! O painel de desenvolvedor e suas ferramentas foram ativados em tempo real. 💻", {
              id: "dev-tag-granted",
            });
          }
        }
      }

      // 2. Atualização otimista imediata nas listas em cache do React Query para TODOS os membros conectados
      queryClient.setQueryData<any[]>(["member_tag_assignments"], (old) => {
        if (!Array.isArray(old)) return old;
        if (detail?.type === "tag_toggle") {
          const toggledTag = String(detail?.tag || "").toLowerCase().trim();
          if (detail.status === false) {
            return old.filter((item) => {
              const itemMemberId = String(item.member_id || item.user_id || "").toLowerCase();
              const itemTagId = String(item.tag_id || "").toLowerCase();
              if (itemTagId === toggledTag && eventTargetIds.includes(itemMemberId)) {
                return false;
              }
              return true;
            });
          } else if (detail.status === true) {
            const next = [...old];
            for (const tid of eventTargetIds) {
              const assignKey = `${tid}_${toggledTag}`;
              if (!next.some((item) => String(item.id || `${item.member_id}_${item.tag_id}`).toLowerCase() === assignKey.toLowerCase())) {
                next.push({
                  id: assignKey,
                  member_id: tid,
                  user_id: tid,
                  tag_id: toggledTag,
                  created_at: new Date().toISOString(),
                });
              }
            }
            return next;
          }
        }
        return old;
      });

      queryClient.setQueryData<any[]>(["members"], (old) => {
        if (!Array.isArray(old)) return old;
        if (detail?.type === "tag_toggle") {
          const toggledTag = String(detail?.tag || "").toLowerCase().trim();
          return old.map((m) => {
            const mIds = [m.user_id, m.id].filter(Boolean).map((id) => String(id).toLowerCase());
            if (mIds.some((id) => eventTargetIds.includes(id))) {
              const copy = { ...m };
              if (toggledTag === "ceo") {
                copy.is_ceo = detail.status;
                if (copy.custom_theme) copy.custom_theme = { ...copy.custom_theme, is_ceo: detail.status };
                else if (detail.status) copy.custom_theme = { is_ceo: true };
                if (detail.status && copy.nivel === "membro") copy.nivel = "ceo";
                else if (!detail.status && copy.nivel === "ceo") copy.nivel = "membro";
              }
              if (toggledTag === "dev" || toggledTag === "desenvolvedor") {
                copy.is_developer = detail.status;
                if (detail.status) {
                  copy.nivel = "desenvolvedor";
                } else if (!detail.status && copy.nivel === "desenvolvedor") {
                  copy.nivel = "membro";
                }
              }
              return copy;
            }
            return m;
          });
        }
        return old;
      });

      // Invalidação global mandatória de consultas para todos os membros conectados na plataforma
      setPermissionsTick((t) => t + 1);
      void queryClient.invalidateQueries({ queryKey: ["members"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["user_roles"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["member_tags"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["member_tag_assignments"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["profiles"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["role_permissions"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["custom_roles"], refetchType: "all" });

      if (isTargetForMe) {
        void loadAuth();
        void queryClient.invalidateQueries({ queryKey: ["auth"], refetchType: "all" });
        void queryClient.invalidateQueries({ queryKey: ["auth_session"], refetchType: "all" });
      }
    };

    const handleMenuOrCeoUpdate = () => {
      setPermissionsTick((t) => t + 1);
      void loadAuth();
      void queryClient.invalidateQueries({ queryKey: ["member_tags"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["member_tag_assignments"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["members"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["auth"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["profiles"], refetchType: "all" });
      void queryClient.invalidateQueries({ queryKey: ["tickets"], refetchType: "all" });
    };

    window.addEventListener("tw_permissions_synced", handlePermissionsSynced);
    window.addEventListener("tw_auth_reload", handleAuthReload);
    window.addEventListener("tw_menu_updated", handleMenuOrCeoUpdate);
    window.addEventListener("tw_ceo_config_updated", handleMenuOrCeoUpdate);
    window.addEventListener("tw_dev_config_updated", handleMenuOrCeoUpdate);
    window.addEventListener("tw_tags_updated", handleMenuOrCeoUpdate);
    window.addEventListener("tw_member_tags_updated", handleMenuOrCeoUpdate);
    window.addEventListener("tw_verifications_updated", handleAuthReload);

    return () => {
      window.removeEventListener("tw_permissions_synced", handlePermissionsSynced);
      window.removeEventListener("tw_auth_reload", handleAuthReload);
      window.removeEventListener("tw_menu_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_ceo_config_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_dev_config_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_tags_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_member_tags_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_verifications_updated", handleAuthReload);
    };
  }, [loadAuth, profile?.user_id, profile?.id, profile?.discord_id, session?.user?.id, queryClient]);

  // Realtime subscription para tags de membros e atribuições
  useEffect(() => {
    const channel = supabase
      .channel("member_tags_realtime_auth")
      .on("postgres_changes", { event: "*", schema: "public", table: "member_tags" }, () => {
        setPermissionsTick((t) => t + 1);
        void queryClient.invalidateQueries({ queryKey: ["member_tags"] });
        void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "member_tag_assignments" }, () => {
        setPermissionsTick((t) => t + 1);
        void queryClient.invalidateQueries({ queryKey: ["member_tag_assignments"] });
        void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Carrega as tags do membro ativo
  const activeUserId = profile?.user_id || session?.user?.id;
  const activeProfileId = profile?.id;
  const activeDiscordId = profile?.discord_id;
  const activeGameId = profile?.game_id;
  const [memberTags, setMemberTagsState] = useState<MemberTag[]>([]);

  useEffect(() => {
    let isCancelled = false;
    async function loadUserTags() {
      if (!activeUserId && !activeProfileId && !activeDiscordId && !activeGameId) {
        setMemberTagsState([]);
        return;
      }
      try {
        const [tagsData, assignmentsData] = await Promise.all([
          getMemberTags(),
          getMemberTagAssignments(),
        ]);

        const candidateIds = new Set(
          [
            activeUserId,
            activeProfileId,
            activeDiscordId,
            activeGameId,
            profile?.game_id,
            (profile as any)?.passaporte,
            profile?.user_id,
            profile?.id,
            session?.user?.id,
          ]
            .filter(Boolean)
            .map((id) => String(id).trim().toLowerCase())
        );

        const myTagIds = new Set<string>();
        for (const a of assignmentsData) {
          const mId = String(a.member_id || "").trim().toLowerCase();
          const uId = String((a as any).user_id || "").trim().toLowerCase();
          if ((mId && candidateIds.has(mId)) || (uId && candidateIds.has(uId))) {
            myTagIds.add(String(a.tag_id || "").trim().toLowerCase());
          }
        }

        // Se o usuário tem a tag 'ceo' atribuída ou está explicitamente com is_ceo no perfil
        let hasCeoActive = Boolean(
          myTagIds.has("ceo") ||
          (profile?.is_ceo === true && (profile as any)?.is_ceo !== false) ||
          profile?.custom_theme?.is_ceo === true
        );

        // Se explicitamente revogado, garante falso
        if (profile && profile.is_ceo === false && !myTagIds.has("ceo")) {
          hasCeoActive = false;
        }

        const isExplicitlyRevokedDev = profile && (profile as any).is_developer === false && !myTagIds.has("dev") && !myTagIds.has("desenvolvedor");

        const hasDevActive = Boolean(
          !isExplicitlyRevokedDev &&
          (
            myTagIds.has("dev") ||
            myTagIds.has("desenvolvedor") ||
            profile?.is_developer === true ||
            level === "desenvolvedor" ||
            (profile as any)?.role === "desenvolvedor" ||
            isUserDeveloper(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null, profile, level)
          )
        );

        const myTags = tagsData.filter(
          (t) =>
            (myTagIds.has(String(t.id).trim().toLowerCase()) ||
              myTagIds.has(String(t.name || "").trim().toLowerCase())) &&
            t.is_active !== false
        );

        if (hasCeoActive && !myTags.some((t) => t.id === "ceo")) {
          myTags.unshift(CEO_SYSTEM_TAG);
        }
        if (hasDevActive && !myTags.some((t) => t.id === "dev" || t.id === "desenvolvedor")) {
          myTags.unshift(DEV_SYSTEM_TAG);
        }

        if (!isCancelled) {
          setMemberTagsState(myTags);
        }
      } catch (e) {
        console.warn("Aviso ao carregar tags do membro:", e);
      }
    }
    void loadUserTags();
    return () => {
      isCancelled = true;
    };
  }, [activeUserId, activeProfileId, activeDiscordId, activeGameId, profile?.user_id, profile?.id, profile?.game_id, session?.user?.id, permissionsTick]);

  // Carrega e monitora a suspensão ou penalidade com bloqueios do membro logado
  const [activeSuspension, setActiveSuspension] = useState<MemberWarning | null>(null);

  useEffect(() => {
    let isCancelled = false;
    async function checkSuspension() {
      if (!activeUserId && !activeProfileId && !activeDiscordId) {
        setActiveSuspension(null);
        return;
      }
      try {
        const all = await getWarnings();
        if (isCancelled) return;
        const now = new Date().toISOString();

        const currentUserId = (activeUserId || "").trim().toLowerCase();
        const currentProfileId = (activeProfileId || "").trim().toLowerCase();
        const currentProfileUserId = (profile?.user_id || "").trim().toLowerCase();
        const currentProfileDbId = (profile?.id || "").trim().toLowerCase();

        const matchMember = (w: MemberWarning) => {
          if (!w.member_id) return false;
          const targetMemberId = String(w.member_id).trim().toLowerCase();
          if (!targetMemberId) return false;

          // Confirmação estrita por ID único do membro punido (NUNCA por nome/admin)
          const isTarget =
            (currentUserId && targetMemberId === currentUserId) ||
            (currentProfileId && targetMemberId === currentProfileId) ||
            (currentProfileUserId && targetMemberId === currentProfileUserId) ||
            (currentProfileDbId && targetMemberId === currentProfileDbId);

          return isTarget;
        };

        const activeList = all.filter((w) => {
          if (w.status !== "ativo") return false;
          if (w.ends_at && w.ends_at <= now) return false;
          return matchMember(w);
        });

        // Mescla todos os bloqueios funcionais das penalidades ativas do membro punido
        const mergedBlocks = activeList.reduce<SuspensionFunctionalBlocks>((acc, curr) => {
          if (!curr.blocks) return acc;
          return {
            block_all_operations: Boolean(acc.block_all_operations || curr.blocks.block_all_operations),
            block_login: Boolean(acc.block_login || curr.blocks.block_login),
            block_sales: Boolean(acc.block_sales || curr.blocks.block_sales),
            block_movements: Boolean(acc.block_movements || curr.blocks.block_movements),
            block_productions: Boolean(acc.block_productions || curr.blocks.block_productions),
            block_cash_fund: Boolean(acc.block_cash_fund || curr.blocks.block_cash_fund),
          };
        }, {});

        // Prioriza suspensões formais ou advertências com bloqueios
        const primary =
          activeList.find((w) => w.is_suspension || w.type === "suspensao") ||
          activeList.find((w) => w.blocks && Object.values(w.blocks).some(Boolean)) ||
          activeList[0] ||
          null;

        if (primary) {
          setActiveSuspension({
            ...primary,
            blocks: mergedBlocks,
          });
        } else {
          setActiveSuspension(null);
        }
      } catch {
        if (!isCancelled) setActiveSuspension(null);
      }
    }

    void checkSuspension();

    const handleUpdate = () => {
      void checkSuspension();
    };

    window.addEventListener(WARNINGS_REALTIME_EVENT, handleUpdate);
    return () => {
      isCancelled = true;
      window.removeEventListener(WARNINGS_REALTIME_EVENT, handleUpdate);
    };
  }, [activeUserId, activeProfileId, profile?.user_id, profile?.id, permissionsTick]);

  const isSuspended = Boolean(
    activeSuspension &&
    (activeSuspension.is_suspension || activeSuspension.type === "suspensao" || (activeSuspension.blocks && Object.values(activeSuspension.blocks).some(Boolean)))
  );

  // Helpers de identificação de tags especiais
  const isDevTagItem = useCallback((t: { id?: string; name?: string; rules?: any; permissions?: any }) => {
    const cleanId = (t.id || "").toLowerCase().trim();
    const cleanName = (t.name || "").toLowerCase().trim();
    return (
      cleanId === "desenvolvedor" ||
      cleanId === "dev" ||
      cleanId.startsWith("dev_") ||
      cleanName === "desenvolvedor" ||
      cleanName === "dev" ||
      t.rules?.can_access_dev === true ||
      t.rules?.is_dev_test === true ||
      (Array.isArray(t.permissions) && (t.permissions.includes("view_dev_hub") || t.permissions.includes("manage_dev_config") || t.permissions.includes("view_dev")))
    );
  }, []);

  const isCeoTagItem = useCallback((t: { id?: string; name?: string; rules?: any; permissions?: any }) => {
    const cleanId = (t.id || "").toLowerCase().trim();
    const cleanName = (t.name || "").toLowerCase().trim();
    return (
      cleanId === "ceo" ||
      cleanName === "ceo" ||
      t.rules?.can_access_ceo === true ||
      t.rules?.is_ceo === true
    );
  }, []);

  // Coleta as permissões de TODAS as tags ativas do membro (permissions[] + rules)
  // As tags que o funcionário possuir somam permissões tanto no painel de membro quanto no painel CEO!
  const memberTagsPermissions = useMemo<Permission[]>(() => {
    const permsSet = new Set<Permission>();
    for (const tag of memberTags) {
      if (tag.is_active === false) continue;

      // Permissões explícitas no array permissions da tag
      if (Array.isArray(tag.permissions)) {
        for (const p of tag.permissions) {
          if (p && typeof p === "string") {
            permsSet.add(p as Permission);

            if (p === "manage_absences" || p === "view_all_absences" || p === "request_absence") {
              permsSet.add("view_absences");
            }
            if (p === "manage_warnings" || p === "view_all_warnings" || p === "create_warning" || p === "create_suspension") {
              permsSet.add("view_warnings");
            }
            if (p === "create_movement" || p === "view_all_movements") {
              permsSet.add("view_movements");
              permsSet.add("view_stock");
            }
          }
        }
      }

      // Regras e permissões implícitas da tag do sistema
      const rules = parseMemberTagRules(tag.rules);
      const cleanId = (tag.id || "").toLowerCase().trim();

      // Comercial & Vendas
      if (rules.can_sell || cleanId === "vendedor") {
        permsSet.add("sales.view");
        permsSet.add("sales.create");
        permsSet.add("sales.history");
        permsSet.add("view_sales");
        permsSet.add("create_sale");
        permsSet.add("view_products");
        permsSet.add("view_baus");
        permsSet.add("view_stock");
      }
      if (rules.can_reverse_sales) {
        permsSet.add("reverse_sale");
        permsSet.add("sales.cancel");
      }
      if (rules.can_view_all_sales) {
        permsSet.add("view_all_sales");
      }

      // Produções, Armazém & Matérias-Primas
      if (rules.can_manage_raw_materials) {
        permsSet.add("raw_materials.view");
        permsSet.add("raw_materials.create");
        permsSet.add("raw_materials.edit");
        permsSet.add("raw_materials.transfer_bau");
        permsSet.add("raw_materials.history");
      }
      if (rules.can_manage_productions) {
        permsSet.add("productions.view");
        permsSet.add("productions.create");
        permsSet.add("productions.edit");
        permsSet.add("view_productions");
        permsSet.add("create_production");
        permsSet.add("warehouse.view");
      }
      if (rules.can_transfer_warehouse) {
        permsSet.add("warehouse.view");
        permsSet.add("warehouse.transfer");
        permsSet.add("warehouse.transfer_storage");
        permsSet.add("warehouse.transfer_sale");
      }
      if (rules.can_adjust_warehouse_stock) {
        permsSet.add("warehouse.view");
        permsSet.add("warehouse.adjust");
      }
      if (rules.can_manage_production_recipes) {
        permsSet.add("production_management.view");
        permsSet.add("production_management.products");
        permsSet.add("production_management.raw_materials");
        permsSet.add("production_management.productions");
        permsSet.add("production_management.settings");
        permsSet.add("production_management.reports");
      }

      // Fundo de Caixa & Finanças
      if (rules.can_deposit_cash_fund || rules.can_withdraw_cash_fund) {
        permsSet.add("view_cash_fund");
        permsSet.add("manage_cash_fund");
      }
      if (rules.can_view_financial_reports) {
        permsSet.add("view_consolidated_financials");
        permsSet.add("view_ceo_financials");
      }

      // Gestão de Membros & Equipe
      if (rules.can_manage_members) {
        permsSet.add("view_members");
        permsSet.add("approve_requests");
        permsSet.add("promote_members");
        permsSet.add("edit_members");
      }
      if (rules.can_view_sensitive_data) {
        permsSet.add("view_sensitive_data");
      }
      if (rules.can_view_all_tickets) {
        permsSet.add("view_all_tickets");
      }
      if (rules.can_create_announcements) {
        permsSet.add("create_announcements" as any);
        permsSet.add("manage_announcements");
      }

      // Escala de Ação
      if (rules.can_manage_escalas) {
        permsSet.add("escalas.view");
        permsSet.add("escalas.details");
        permsSet.add("escalas.create");
        permsSet.add("escalas.edit");
        permsSet.add("escalas.delete");
        permsSet.add("escalas.publish");
        permsSet.add("escalas.cancel");
        permsSet.add("escalas.manage_members");
        permsSet.add("escalas.add_participants");
        permsSet.add("escalas.remove_participants");
        permsSet.add("escalas.confirm_presence");
        permsSet.add("escalas.manage_slots");
        permsSet.add("escalas.substitute");
        permsSet.add("escalas.history");
        permsSet.add("escalas.settings");
      }
      if (rules.can_view_escalas || rules.can_participate_escalas) {
        permsSet.add("escalas.view");
        permsSet.add("escalas.details");
        if (rules.can_participate_escalas) {
          permsSet.add("escalas.confirm_presence");
        }
        if (rules.can_view_escalas) {
          permsSet.add("escalas.history");
        }
      }

      // Acesso Executivo CEO
      if (rules.can_access_ceo || rules.is_ceo) {
        permsSet.add("view_ceo");
        permsSet.add("view_ceo_dashboard");
      }

      // Acesso Desenvolvedor
      if (rules.can_access_dev || rules.is_dev_test) {
        permsSet.add("view_dev_hub");
        permsSet.add("view_dev");
      }
    }
    return Array.from(permsSet);
  }, [memberTags]);

  const systemTagPermissions = memberTagsPermissions;

  // Permissões específicas da TAG CEO (somente as marcadas em role_permissions["ceo"] + tags CEO ativas)
  const ceoTagPermissions = useMemo<Permission[]>(() => {
    const permsSet = new Set<Permission>();
    const rawCeoPerms = customRolePermissions?.["ceo"];
    // Se existe registro salvo no banco, ele é a fonte única da verdade (mesmo que vazio).
    // Caso contrário (ainda carregando / nunca salvo), usa o cache local ou o padrão.
    const ceoPerms = Array.isArray(rawCeoPerms) ? rawCeoPerms : getCeoTagPermissionsSync();

    for (const p of ceoPerms) {
      if (p) permsSet.add(p as Permission);
    }
    for (const tag of memberTags) {
      if (tag.is_active === false) continue;
      if (!isCeoTagItem(tag)) continue;
      if (Array.isArray(tag.permissions)) {
        for (const p of tag.permissions) {
          if (p && typeof p === "string") permsSet.add(p as Permission);
        }
      }
    }
    return Array.from(permsSet);
  }, [memberTags, customRolePermissions, isCeoTagItem]);

  // Permissões específicas da TAG DEV (somente as marcadas em role_permissions["desenvolvedor"] + tags DEV ativas)
  const devTagPermissions = useMemo<Permission[]>(() => {
    const permsSet = new Set<Permission>();
    const rawDevPerms = customRolePermissions?.["desenvolvedor"];
    const devPerms = Array.isArray(rawDevPerms) ? rawDevPerms : getDevTagPermissionsSync();

    for (const p of devPerms) {
      if (p) permsSet.add(p as Permission);
    }
    for (const tag of memberTags) {
      if (tag.is_active === false) continue;
      if (!isDevTagItem(tag)) continue;
      if (Array.isArray(tag.permissions)) {
        for (const p of tag.permissions) {
          if (p && typeof p === "string") permsSet.add(p as Permission);
        }
      }
    }
    return Array.from(permsSet);
  }, [memberTags, customRolePermissions, isDevTagItem]);

  // Checagem se o membro é Desenvolvedor (base ou concedido por tag ativa)
  const isDevUser = useMemo(() => {
    // 1. Tags ativas atribuídas ao membro
    const hasActiveDevTag = memberTags.some((t) => {
      if (t.is_active === false) return false;
      if (isDevTagItem(t)) return true;
      const cleanId = t.id.toLowerCase().trim();
      if (cleanId === "desenvolvedor" || cleanId === "dev" || cleanId === "dev_test") return true;
      if (t.rules?.can_access_dev === true || t.rules?.is_dev_test === true) return true;
      if (
        Array.isArray(t.permissions) &&
        (t.permissions.includes("view_dev_hub") || t.permissions.includes("manage_dev_config") || t.permissions.includes("view_dev"))
      ) {
        return true;
      }
      return false;
    });

    if (hasActiveDevTag) return true;

    // Se o perfil tem explicitamente is_developer === false e não é fundador permanente, NÃO é dev
    if (profile && (profile as any).is_developer === false && level !== "desenvolvedor") {
      const isPermanentFounder =
        (profile?.discord_id && DEV_DISCORD_IDS.includes(String(profile.discord_id))) ||
        ((session?.user as any)?.discord_id && DEV_DISCORD_IDS.includes(String((session?.user as any).discord_id))) ||
        session?.user?.id === "c5ef6dc6-e126-4027-80c3-319f0a870315";
      if (!isPermanentFounder) return false;
    }

    // 2. Base (flag is_developer no perfil ou cargo desenvolvedor)
    const baseDev = isUserDeveloper(
      session?.user ? { id: session.user.id, email: session.user.email ?? null } : null,
      profile,
      level
    );
    if (baseDev) return true;
    if (level === "desenvolvedor" || (profile as any)?.role === "desenvolvedor") return true;
    if (profile?.discord_id && DEV_DISCORD_IDS.includes(String(profile.discord_id))) return true;
    if ((session?.user as any)?.discord_id && DEV_DISCORD_IDS.includes(String((session?.user as any).discord_id))) return true;
    if (session?.user?.id === "c5ef6dc6-e126-4027-80c3-319f0a870315") return true;

    return false;
  }, [session?.user, profile, level, memberTags, isDevTagItem]);

  // Checagem se o membro é CEO (base ou concedido por tag ativa)
  const isCeoUser = useMemo(() => {
    // 1. Tags ativas atribuídas ao membro que concedem acesso CEO
    const hasActiveCeoTag = memberTags.some((t) => {
      if (t.is_active === false) return false;
      if (isCeoTagItem(t)) return true;
      const cleanId = t.id.toLowerCase().trim();
      if (cleanId === "ceo") return true;
      if (t.rules?.can_access_ceo === true || t.rules?.is_ceo === true) return true;
      if (
        Array.isArray(t.permissions) &&
        (t.permissions.includes("view_ceo") ||
          t.permissions.includes("view_ceo_dashboard") ||
          t.permissions.includes("view_ceo_financials") ||
          t.permissions.includes("view_ceo_stock_adjustments") ||
          t.permissions.includes("view_ceo_notifications") ||
          t.permissions.includes("manage_ceo_bot") ||
          t.permissions.includes("manage_ceo_webhooks") ||
          t.permissions.includes("view_ceo_tag_permissions") ||
          t.permissions.includes("verification.manage") ||
          t.permissions.includes("view_ceo_warnings"))
      ) {
        return true;
      }
      return false;
    });

    if (hasActiveCeoTag) return true;

    // Se o perfil tem explicitamente is_ceo === false e não tem tag ativa CEO, NUNCA é CEO
    if (profile && profile.is_ceo === false && !memberTags.some((t) => t.is_active !== false && t.id === "ceo")) {
      return false;
    }

    // 2. Base (flag is_ceo no perfil ou checagem isUserCeo)
    if (isUserCeo(profile, session?.user ? { id: session.user.id } : null)) return true;
    if (profile?.is_ceo === true || profile?.custom_theme?.is_ceo === true) return true;
    if (level === "ceo" || (profile as any)?.role === "ceo" || (profile as any)?.cargo === "ceo") return true;

    return false;
  }, [session?.user, profile, level, memberTags, isCeoTagItem]);

  // Permissões ativas agregadas
  const allTagPermissions = useMemo<Permission[]>(() => {
    return Array.from(new Set([
      ...memberTagsPermissions,
      ...(isCeoUser ? ceoTagPermissions : []),
      ...(isDevUser ? devTagPermissions : []),
    ]));
  }, [memberTagsPermissions, ceoTagPermissions, devTagPermissions, isCeoUser, isDevUser]);

  const isDevMode = Boolean(
    isDevUser &&
      (typeof window !== "undefined"
        ? (window.location.pathname.toLowerCase().startsWith("/dev") || window.location.hash.toLowerCase().includes("/dev"))
        : panelMode === "dev")
  );

  const isCeoMode = Boolean(
    isCeoUser &&
      !isDevMode &&
      (typeof window !== "undefined"
        ? (window.location.pathname.toLowerCase().startsWith("/ceo") || window.location.hash.toLowerCase().includes("/ceo"))
        : panelMode === "ceo")
  );

  const setPanelMode = useCallback((mode: "member" | "dev" | "ceo") => {
    setPanelModeState(mode);
    try {
      localStorage.setItem("tw_panel_mode", mode);
      sessionStorage.setItem("tw_panel_mode", mode);
    } catch {}
  }, []);

  const hasTag = useCallback(
    (tagId: string) => {
      const clean = tagId.toLowerCase().trim();
      return memberTags.some((t) => t.id.toLowerCase() === clean && t.is_active !== false);
    },
    [memberTags]
  );

  const platformLockedTags = useMemo(() => {
    return memberTags.filter((t) => t.is_active !== false && t.rules?.block_login === true);
  }, [memberTags]);

  const isPlatformLocked = useMemo(() => {
    // Imunidade total ao bloqueio de plataforma para quem possui a Tag Dev
    if (isDevUser) {
      return false;
    }
    return platformLockedTags.length > 0 || Boolean(activeSuspension?.blocks?.block_login);
  }, [platformLockedTags, activeSuspension, isDevUser]);

  const isMemberBlocked = useMemo(() => {
    // Imunidade total a bloqueios operacionais para quem possui a Tag Dev
    if (isDevUser) {
      return false;
    }
    return (
      isPlatformLocked ||
      memberTags.some(
        (t) =>
          t.is_active !== false &&
          (t.rules?.is_blocked === true ||
            t.rules?.block_operations === true ||
            t.rules?.block_login === true)
      ) ||
      Boolean(
        activeSuspension &&
          (activeSuspension.blocks?.block_all_operations || activeSuspension.blocks?.block_login)
      )
    );
  }, [memberTags, activeSuspension, isPlatformLocked, isDevUser]);

  // Garante que membros comuns sem Tag Dev ou Tag CEO nunca fiquem travados em rotas ou modos de painel desautorizados
  useEffect(() => {
    if (!loading) {
      if (!isDevUser && panelMode === "dev") {
        const nextMode = isCeoUser ? "ceo" : "member";
        setPanelModeState(nextMode);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("tw_panel_mode", nextMode);
            sessionStorage.setItem("tw_panel_mode", nextMode);
          } catch {}
        }
      } else if (!isCeoUser && panelMode === "ceo") {
        const nextMode = isDevUser ? "dev" : "member";
        setPanelModeState(nextMode);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("tw_panel_mode", nextMode);
            sessionStorage.setItem("tw_panel_mode", nextMode);
          } catch {}
        }
      }

      // Redirecionamento instantâneo caso o usuário esteja em rota restrita sem a devida tag
      if (typeof window !== "undefined") {
        const path = (window.location.pathname || "").toLowerCase();
        const hash = (window.location.hash || "").toLowerCase();
        if (!isDevUser && (path.startsWith("/dev") || hash.includes("/dev"))) {
          window.location.replace("/dashboard");
        } else if (!isCeoUser && (path.startsWith("/ceo") || hash.includes("/ceo"))) {
          window.location.replace("/dashboard");
        }
      }
    }
  }, [loading, isDevUser, isCeoUser, panelMode]);

  const hasPermission = useCallback(
    (permission: Permission, panelOverride?: "member" | "dev" | "ceo") => {
      const bypassActive = isDevBypassActive();

      // Determinação estrita do painel ativo:
      // Se panelOverride for informado (ex: do Dispatcher ou de menu), usa-o diretamente com prioridade máxima.
      // Caso contrário, respeita a rota atual da janela (/dev/* -> dev, /ceo/* -> ceo, outras -> member).
      let activePanel: "member" | "dev" | "ceo" = "member";
      if (panelOverride) {
        activePanel = panelOverride;
      } else if (typeof window !== "undefined") {
        const path = (window.location.pathname || "").toLowerCase();
        const hash = (window.location.hash || "").toLowerCase();
        if (isDevUser && (path.startsWith("/dev") || hash.includes("/dev"))) {
          activePanel = "dev";
        } else if (isCeoUser && (path.startsWith("/ceo") || hash.includes("/ceo"))) {
          activePanel = "ceo";
        } else {
          activePanel = "member";
        }
      } else {
        activePanel = panelMode ?? "member";
      }

      // =========================================================================
      // 0. BLOQUEIOS OPERACIONAIS & DE PLATAFORMA (PRECEDÊNCIA MÁXIMA)
      // Regra absoluta do sistema: Bloqueios ficam ACIMA de qualquer cargo (01, 02, etc.),
      // acima de outras tags e acima do painel CEO, EXCETO SE O MEMBRO TIVER A TAG DEV!
      // =========================================================================
      if (!isDevUser) {
        // 0.1. CHAVE MESTRA: BLOQUEIO TOTAL DE ACESSO À PLATAFORMA (block_login)
        // Se o usuário possuir qualquer tag ativa com block_login OU suspensão com block_login:
        // TODAS AS PERMISSÕES SÃO NEGADAS IMEDIATAMENTE!
        const hasLoginBlock =
          memberTags.some((t) => t.is_active !== false && t.rules?.block_login === true) ||
          Boolean(activeSuspension?.blocks?.block_login);
        if (hasLoginBlock) {
          return false;
        }

        // 0.15. MEMBRO JÁ VERIFICADO: Não visualiza página de solicitação e não solicita novo selo
        if (profile?.is_verified === true) {
          if (permission === "verification.view_page" || permission === "verification.request") {
            return false;
          }
        }

        const isOperationalAction =
          permission.startsWith("create_") ||
          permission.startsWith("delete_") ||
          permission.startsWith("reverse_") ||
          permission.startsWith("edit_") ||
          permission.startsWith("manage_") ||
          permission.includes(".create") ||
          permission.includes(".edit") ||
          permission.includes(".delete") ||
          permission.includes(".transfer") ||
          permission.includes(".adjust") ||
          permission.includes(".cancel") ||
          permission === "manage_cash_fund" ||
          permission === "reverse_cash_fund" ||
          permission === "delete_cash_movement" ||
          permission === "manage_baus" ||
          permission === "manage_products" ||
          permission === "manage_categories" ||
          permission === "buy_shop_items" ||
          permission === "manage_shop" ||
          permission === "adjust_stock_balance" ||
          permission === "manage_stock_balance" ||
          permission === "request_absence" ||
          permission === "manage_absences" ||
          permission === "create_ticket" ||
          permission === "manage_goals" ||
          permission === "manage_performance" ||
          permission === "approve_requests" ||
          permission === "promote_members" ||
          permission === "edit_members" ||
          permission === "delete_members" ||
          permission === "change_roles" ||
          permission === "manage_roles" ||
          permission === "manage_permissions";

        const isSalesPermission =
          permission.startsWith("sales.") ||
          permission.includes("sale") ||
          permission === "view_sales" ||
          permission === "view_all_sales" ||
          permission === "create_sale" ||
          permission === "reverse_sale" ||
          permission === "delete_sale";

        const isMovementPermission =
          permission.includes("movement") ||
          permission.includes("bau") ||
          permission === "view_movements" ||
          permission === "view_baus" ||
          permission === "create_movement" ||
          permission === "reverse_movement" ||
          permission === "delete_movement" ||
          permission === "manage_baus" ||
          permission === "raw_materials.transfer_bau";

        const isProductionPermission =
          permission.startsWith("productions.") ||
          permission.startsWith("raw_materials.") ||
          permission.startsWith("warehouse.") ||
          permission.startsWith("production_management.") ||
          permission.includes("production") ||
          permission.includes("raw_material") ||
          permission.includes("warehouse") ||
          permission === "view_productions";

        const isCashPermission =
          permission.includes("cash") ||
          permission === "view_cash_fund" ||
          permission === "manage_cash_fund" ||
          permission === "reverse_cash_fund" ||
          permission === "delete_cash_movement";

        // 0.2. BLOQUEIO TOTAL DE OPERAÇÕES (is_blocked OU block_operations OU suspensão)
        const hasOperationsBlock =
          memberTags.some(
            (t) =>
              t.is_active !== false &&
              (t.rules?.is_blocked === true || t.rules?.block_operations === true)
          ) || Boolean(activeSuspension?.blocks?.block_all_operations);
        const isEscalasOperational =
          permission.startsWith("escalas.") &&
          permission !== "escalas.view" &&
          permission !== "escalas.details" &&
          permission !== "escalas.history";
        if (hasOperationsBlock) {
          if (
            isOperationalAction ||
            isSalesPermission ||
            isMovementPermission ||
            isProductionPermission ||
            isCashPermission ||
            isEscalasOperational
          ) {
            return false;
          }
        }

        // 0.2.5. BLOQUEIO ESPECÍFICO DE ESCALAS (block_escalas)
        const hasEscalasBlock =
          memberTags.some((t) => t.is_active !== false && t.rules?.block_escalas === true);
        if (hasEscalasBlock && permission.startsWith("escalas.")) {
          return false;
        }

        // 0.3. BLOQUEIOS ESPECÍFICOS: VENDAS (block_sales)
        const hasSalesBlock =
          memberTags.some((t) => t.is_active !== false && t.rules?.block_sales === true) ||
          Boolean(activeSuspension?.blocks?.block_sales);
        if (hasSalesBlock && isSalesPermission) {
          return false;
        }

        // 0.4. BLOQUEIOS ESPECÍFICOS: MOVIMENTAÇÕES DE BAÚ (block_movements)
        const hasMovementsBlock =
          memberTags.some((t) => t.is_active !== false && t.rules?.block_movements === true) ||
          Boolean(activeSuspension?.blocks?.block_movements);
        if (hasMovementsBlock && isMovementPermission) {
          return false;
        }

        // 0.5. BLOQUEIOS ESPECÍFICOS: PRODUÇÕES & ARMAZÉM (block_productions)
        const hasProductionsBlock =
          memberTags.some((t) => t.is_active !== false && t.rules?.block_productions === true) ||
          Boolean(activeSuspension?.blocks?.block_productions);
        if (hasProductionsBlock && isProductionPermission) {
          return false;
        }

        // 0.6. BLOQUEIOS ESPECÍFICOS: FUNDO DE CAIXA (block_cash_fund)
        const hasCashBlock =
          memberTags.some((t) => t.is_active !== false && t.rules?.block_cash_fund === true) ||
          Boolean(activeSuspension?.blocks?.block_cash_fund);
        if (hasCashBlock && isCashPermission) {
          return false;
        }
      }

      // Avaliação base de membro: soma permissões do CARGO do membro + permissões de TODAS as Tags do membro
      const evaluateAsMember = () => {
        if (can(level, permission, customRolePermissions)) return true;
        if (satisfiesPermission(memberTagsPermissions, permission)) return true;
        return false;
      };

      // =========================================================================
      // 1. PAINEL MEMBRO: Soma permissões do Cargo + Tags do Funcionário
      // =========================================================================
      if (activePanel === "member") {
        return evaluateAsMember();
      }

      // =========================================================================
      // 2. PAINEL CEO: Soma permissões da Tag CEO + Cargo do Funcionário + Tags do Funcionário
      // =========================================================================
      if (activePanel === "ceo") {
        if (isCeoUser || isDevUser) {
          if (permission === "view_ceo" || permission === "view_ceo_dashboard") return true;
          if (satisfiesPermission(ceoTagPermissions, permission)) return true;
        }
        return evaluateAsMember();
      }

      // =========================================================================
      // 3. PAINEL DEV: Soma permissões Dev + Tag CEO + Cargo + Tags do Funcionário
      // =========================================================================
      if (activePanel === "dev") {
        if (isDevUser) {
          if (bypassActive) return true;
          if (
            permission === "view_dev_hub" ||
            permission === "view_dev" ||
            permission.startsWith("manage_dev_") ||
            permission === "view_ceo" ||
            permission === "view_ceo_dashboard"
          ) {
            return true;
          }
          if (satisfiesPermission(devTagPermissions, permission)) return true;
          if (satisfiesPermission(ceoTagPermissions, permission)) return true;
        }
        return evaluateAsMember();
      }

      return evaluateAsMember();
    },
    [
      level,
      isDevUser,
      isCeoUser,
      memberTags,
      activeSuspension,
      memberTagsPermissions,
      ceoTagPermissions,
      devTagPermissions,
      customRolePermissions,
      panelMode,
      devConfigTick,
      permissionsTick,
    ]
  );

  const hasMemberRolePermission = useCallback(
    (permission: Permission) => {
      // 0. Bloqueios de login e operacionais (aplica para todos exceto quem possui a Tag Dev)
      if (!isDevUser) {
        const hasLoginBlock =
          memberTags.some((t) => t.is_active !== false && t.rules?.block_login === true) ||
          Boolean(activeSuspension?.blocks?.block_login);
        if (hasLoginBlock) return false;

        const hasOperationsBlock =
          memberTags.some(
            (t) =>
              t.is_active !== false &&
              (t.rules?.is_blocked === true || t.rules?.block_operations === true)
          ) || Boolean(activeSuspension?.blocks?.block_all_operations);
        if (
          hasOperationsBlock &&
          (permission.startsWith("manage_") ||
            permission.startsWith("approve_") ||
            permission.startsWith("create_") ||
            permission.startsWith("delete_"))
        ) {
          return false;
        }
      }

      // Soma permissões do cargo + tags de membros
      return (
        can(level, permission, customRolePermissions) ||
        satisfiesPermission(memberTagsPermissions, permission)
      );
    },
    [level, isDevUser, memberTags, activeSuspension, customRolePermissions, memberTagsPermissions]
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
      hasMemberRolePermission,
      memberTags,
      tagPermissions: allTagPermissions,
      hasTag,
      isMemberBlocked,
      isPlatformLocked,
      platformLockedTags,
      activeSuspension,
      isSuspended,
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
      hasMemberRolePermission,
      memberTags,
      allTagPermissions,
      hasTag,
      isMemberBlocked,
      isPlatformLocked,
      platformLockedTags,
      activeSuspension,
      isSuspended,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
