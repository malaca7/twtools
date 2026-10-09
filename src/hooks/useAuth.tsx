import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAuth, logoutFromApp } from "@/lib/app-api";
import type { AppUser, AuthState, Profile, SignupRequestStatus } from "@/lib/app-types";
import { can, satisfiesPermission, LEVEL_LABEL, type AppLevel, type Permission } from "@/lib/permissions";
import { useRolePermissions } from "@/hooks/useData";
import { isUserDeveloper, DEV_DISCORD_IDS, isDevBypassActive, DEV_CONFIG_EVENT, CEO_CONFIG_EVENT, getCeoTagPermissionsSync, getDevTagPermissionsSync, isUserCeo } from "@/services/devService";
import { parseMemberTagRules, getMemberTags, getMemberTagAssignments, type MemberTag } from "@/services/memberTagsService";
import type { MemberWarning } from "@/types/warnings";
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
              is_ceo: Boolean(sim.is_ceo === true),
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
              is_ceo: Boolean(dev.is_ceo === true),
              bio: dev.bio || dev.custom_theme?.bio || null,
              custom_status: dev.custom_status || dev.custom_theme?.custom_status || null,
              social_links: dev.social_links || dev.custom_theme?.social_links || null,
              custom_theme: dev.custom_theme || null,
              custom_url: dev.custom_url || dev.custom_theme?.custom_url || null,
              is_verified: Boolean(dev.is_verified === true),
            },
            level: dev.nivel || "novato",
            signupRequestStatus: null,
            approvedAccess: true,
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
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    };
    window.addEventListener("tw_verifications_updated", handleVerif);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("tw_verifications_updated", handleVerif);
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
      const targetUserId = customEvent?.detail?.userId || customEvent?.detail?.new?.user_id;
      const currentUserId = profile?.user_id || session?.user?.id;
      if (!targetUserId || targetUserId === currentUserId) {
        setPermissionsTick((t) => t + 1);
        void loadAuth();
        void queryClient.invalidateQueries({ queryKey: ["auth"], refetchType: "all" });
        void queryClient.invalidateQueries({ queryKey: ["auth_session"], refetchType: "all" });
        void queryClient.invalidateQueries({ queryKey: ["members"], refetchType: "all" });
      }
    };

    const handleMenuOrCeoUpdate = () => {
      setPermissionsTick((t) => t + 1);
    };

    window.addEventListener("tw_permissions_synced", handlePermissionsSynced);
    window.addEventListener("tw_auth_reload", handleAuthReload);
    window.addEventListener("tw_menu_updated", handleMenuOrCeoUpdate);
    window.addEventListener("tw_ceo_config_updated", handleMenuOrCeoUpdate);
    window.addEventListener("tw_tags_updated", handleMenuOrCeoUpdate);
    window.addEventListener("tw_member_tags_updated", handleMenuOrCeoUpdate);
    window.addEventListener("tw_verifications_updated", handleAuthReload);

    return () => {
      window.removeEventListener("tw_permissions_synced", handlePermissionsSynced);
      window.removeEventListener("tw_auth_reload", handleAuthReload);
      window.removeEventListener("tw_menu_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_ceo_config_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_tags_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_member_tags_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_verifications_updated", handleAuthReload);
    };
  }, [loadAuth, profile?.user_id, session?.user?.id, queryClient]);

  // Realtime subscription para tags de membros e atribuições
  useEffect(() => {
    const channel = supabase
      .channel("member_tags_realtime_auth")
      .on("postgres_changes", { event: "*", schema: "public", table: "member_tags" }, () => {
        setPermissionsTick((t) => t + 1);
        void queryClient.invalidateQueries({ queryKey: ["member_tags"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "member_tag_assignments" }, () => {
        setPermissionsTick((t) => t + 1);
        void queryClient.invalidateQueries({ queryKey: ["member_tag_assignments"] });
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
            profile?.user_id,
            profile?.id,
            session?.user?.id,
          ]
            .filter(Boolean)
            .map((id) => String(id).trim().toLowerCase())
        );

        const myTagIds = new Set<string>();
        for (const a of assignmentsData) {
          if (a.member_id && candidateIds.has(String(a.member_id).trim().toLowerCase())) {
            myTagIds.add(a.tag_id);
          }
        }

        const myTags = tagsData.filter(
          (t) => myTagIds.has(t.id) && t.is_active !== false
        );

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
  }, [activeUserId, activeProfileId, activeDiscordId, activeGameId, profile?.user_id, profile?.id, session?.user?.id, permissionsTick]);

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
      cleanId.startsWith("ceo_") ||
      cleanName === "ceo" ||
      cleanName === "diretoria" ||
      t.rules?.can_access_ceo === true ||
      t.rules?.is_ceo === true ||
      (Array.isArray(t.permissions) && (t.permissions.includes("view_ceo") || t.permissions.includes("manage_ceo_bot") || t.permissions.includes("view_ceo_dashboard")))
    );
  }, []);

  // Coleta as permissões exclusivamente das TAGS DO SISTEMA (exclui Tag Dev e Tag CEO)
  const systemTagPermissions = useMemo<Permission[]>(() => {
    const permsSet = new Set<Permission>();
    for (const tag of memberTags) {
      if (tag.is_active === false) continue;
      // Exclui explicitamente tags de Dev e de CEO das tags do sistema
      if (isDevTagItem(tag) || isCeoTagItem(tag)) continue;

      // Permissões explícitas no array permissions
      if (Array.isArray(tag.permissions)) {
        for (const p of tag.permissions) {
          if (p && typeof p === "string") {
            permsSet.add(p as Permission);
          }
        }
      }
      // Regras e permissões implícitas da tag do sistema
      const rules = tag.rules || {};
      const isBlocked = Boolean(rules.is_blocked || rules.block_operations);
      const cleanId = tag.id.toLowerCase().trim();

      if (!isBlocked && !rules.block_sales && (rules.can_sell || cleanId === "vendedor")) {
        permsSet.add("sales.view" as Permission);
        permsSet.add("sales.create" as Permission);
        permsSet.add("sales.history" as Permission);
        permsSet.add("view_sales" as Permission);
        permsSet.add("create_sale" as Permission);
        permsSet.add("view_products" as Permission);
        permsSet.add("view_baus" as Permission);
        permsSet.add("view_stock" as Permission);
      }
      if (!isBlocked && !rules.block_productions && rules.can_manage_raw_materials) {
        permsSet.add("raw_materials.view" as Permission);
        permsSet.add("raw_materials.create" as Permission);
        permsSet.add("raw_materials.edit" as Permission);
        permsSet.add("raw_materials.transfer_bau" as Permission);
        permsSet.add("raw_materials.history" as Permission);
      }
      if (!isBlocked && !rules.block_productions && rules.can_manage_productions) {
        permsSet.add("productions.view" as Permission);
        permsSet.add("productions.create" as Permission);
        permsSet.add("productions.edit" as Permission);
        permsSet.add("view_productions" as Permission);
        permsSet.add("warehouse.view" as Permission);
      }
      if (!isBlocked && !rules.block_productions && rules.can_transfer_warehouse) {
        permsSet.add("warehouse.view" as Permission);
        permsSet.add("warehouse.transfer" as Permission);
        permsSet.add("warehouse.transfer_storage" as Permission);
        permsSet.add("warehouse.transfer_sale" as Permission);
      }
      if (!isBlocked && !rules.block_productions && rules.can_adjust_warehouse_stock) {
        permsSet.add("warehouse.view" as Permission);
        permsSet.add("warehouse.adjust" as Permission);
      }
      if (!isBlocked && !rules.block_productions && rules.can_manage_production_recipes) {
        permsSet.add("production_management.view" as Permission);
        permsSet.add("production_management.products" as Permission);
        permsSet.add("production_management.raw_materials" as Permission);
        permsSet.add("production_management.productions" as Permission);
        permsSet.add("production_management.settings" as Permission);
      }
      if (!isBlocked && rules.can_manage_members) {
        permsSet.add("view_members" as Permission);
        permsSet.add("approve_requests" as Permission);
        permsSet.add("promote_members" as Permission);
        permsSet.add("edit_members" as Permission);
      }
      if (!isBlocked && rules.can_view_sensitive_data) {
        permsSet.add("view_sensitive_data" as Permission);
      }
      if (!isBlocked && rules.can_view_all_tickets) {
        permsSet.add("view_tickets" as Permission);
        permsSet.add("view_all_tickets" as Permission);
      }
      if (!isBlocked && rules.can_create_announcements) {
        permsSet.add("create_announcements" as Permission);
        permsSet.add("manage_announcements" as Permission);
      }
      if (!isBlocked && !rules.block_sales && rules.can_reverse_sales) {
        permsSet.add("reverse_sale" as Permission);
        permsSet.add("sales.cancel" as Permission);
      }
      if (!isBlocked && !rules.block_sales && rules.can_view_all_sales) {
        permsSet.add("view_all_sales" as Permission);
      }
      if (!isBlocked && !rules.block_cash_fund && (rules.can_deposit_cash_fund || rules.can_withdraw_cash_fund)) {
        permsSet.add("view_cash_fund" as Permission);
        permsSet.add("manage_cash_fund" as Permission);
      }
      if (!isBlocked && rules.can_view_financial_reports) {
        permsSet.add("view_consolidated_financials" as Permission);
      }
      if (!isBlocked && !rules.block_escalas && rules.can_manage_escalas) {
        permsSet.add("escalas.view" as Permission);
        permsSet.add("escalas.details" as Permission);
        permsSet.add("escalas.create" as Permission);
        permsSet.add("escalas.edit" as Permission);
        permsSet.add("escalas.delete" as Permission);
        permsSet.add("escalas.publish" as Permission);
        permsSet.add("escalas.cancel" as Permission);
        permsSet.add("escalas.manage_members" as Permission);
        permsSet.add("escalas.add_participants" as Permission);
        permsSet.add("escalas.remove_participants" as Permission);
        permsSet.add("escalas.confirm_presence" as Permission);
        permsSet.add("escalas.manage_slots" as Permission);
        permsSet.add("escalas.substitute" as Permission);
        permsSet.add("escalas.history" as Permission);
        permsSet.add("escalas.settings" as Permission);
      }
      if (!isBlocked && !rules.block_escalas && (rules.can_view_escalas || rules.can_participate_escalas)) {
        permsSet.add("escalas.view" as Permission);
        permsSet.add("escalas.details" as Permission);
        if (rules.can_participate_escalas) {
          permsSet.add("escalas.confirm_presence" as Permission);
        }
        if (rules.can_view_escalas) {
          permsSet.add("escalas.history" as Permission);
        }
      }
    }
    return Array.from(permsSet);
  }, [memberTags, isDevTagItem, isCeoTagItem]);

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
    // 1. Base (flag is_developer no perfil ou cargo desenvolvedor)
    const baseDev = isUserDeveloper(
      session?.user ? { id: session.user.id, email: session.user.email ?? null } : null,
      profile,
      level
    );
    if (baseDev) return true;

    // 2. Concedido por qualquer tag ativa que o membro possua
    return memberTags.some((t) => {
      if (t.is_active === false) return false;
      const cleanId = t.id.toLowerCase().trim();
      if (cleanId === "desenvolvedor" || cleanId === "dev_test") return true;
      if (t.rules?.can_access_dev === true || t.rules?.is_dev_test === true) return true;
      if (
        Array.isArray(t.permissions) &&
        (t.permissions.includes("view_dev_hub") || t.permissions.includes("manage_dev_config"))
      ) {
        return true;
      }
      return false;
    });
  }, [session?.user, profile, level, memberTags]);

  // Checagem se o membro é CEO (base ou concedido por tag ativa)
  const isCeoUser = useMemo(() => {
    // 1. Base (flag is_ceo no perfil)
    const baseCeo = isUserCeo(profile);
    if (baseCeo) return true;

    // 2. Concedido por qualquer tag ativa que o membro possua
    const tagCeo = memberTags.some((t) => {
      if (t.is_active === false) return false;
      const cleanId = t.id.toLowerCase().trim();
      if (cleanId === "ceo") return true;
      if (t.rules?.can_access_ceo === true || t.rules?.is_ceo === true) return true;
      if (
        Array.isArray(t.permissions) &&
        (t.permissions.includes("view_ceo") || t.permissions.includes("manage_ceo_bot"))
      ) {
        return true;
      }
      return false;
    });
    if (tagCeo) return true;

    // Observação: possuir a Tag Dev NÃO torna o membro CEO automaticamente.
    // O desenvolvedor só recebe permissões da Tag CEO se realmente possuir a Tag CEO.
    return false;
  }, [profile, memberTags]);

  // Permissões ativas agregadas
  const allTagPermissions = useMemo<Permission[]>(() => {
    return Array.from(new Set([
      ...systemTagPermissions,
      ...(isCeoUser ? ceoTagPermissions : []),
      ...(isDevUser ? devTagPermissions : []),
    ]));
  }, [systemTagPermissions, ceoTagPermissions, devTagPermissions, isCeoUser, isDevUser]);

  const isDevMode = Boolean(
    isDevUser &&
      (panelMode === "dev" ||
        (typeof window !== "undefined" &&
          (window.location.pathname.startsWith("/dev") || window.location.hash.includes("/dev"))))
  );

  const isCeoMode = Boolean(
    (isCeoUser || isDevUser) &&
      !isDevMode &&
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
    // Imunidade estrita ao bloqueio APENAS para Desenvolvedores acessando o painel /dev com bypass ativo
    const isDevInDevArea =
      isDevUser &&
      isDevBypassActive() &&
      (panelMode === "dev" || (typeof window !== "undefined" && window.location.pathname.toLowerCase().startsWith("/dev")));
    if (isDevInDevArea) {
      return false;
    }
    return platformLockedTags.length > 0 || Boolean(activeSuspension?.blocks?.block_login);
  }, [platformLockedTags, activeSuspension, isDevUser, panelMode]);

  const isMemberBlocked = useMemo(() => {
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
  }, [memberTags, activeSuspension, isPlatformLocked]);

  // Garante que membros comuns sem Tag Dev ou Tag CEO nunca fiquem travados em panelMode dev ou ceo
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
      } else if (!isCeoUser && !isDevUser && panelMode === "ceo") {
        setPanelModeState("member");
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("tw_panel_mode", "member");
            sessionStorage.setItem("tw_panel_mode", "member");
          } catch {}
        }
      }
    }
  }, [loading, isDevUser, isCeoUser, panelMode]);

  const hasPermission = useCallback(
    (permission: Permission, panelOverride?: "member" | "dev" | "ceo") => {
      const bypassActive = isDevBypassActive();

      // Determinação do painel ativo:
      // Se panelOverride for informado (ex: do Dispatcher ou de menu), usa-o diretamente.
      // Caso contrário, respeita o modo de painel ativo do usuário (panelMode / isDevMode / isCeoMode),
      // garantindo que ao navegar em páginas de CEO e Membro o usuário acesse como Tag Dev (se em dev)
      // ou como Tag CEO (se em ceo).
      let activePanel: "member" | "dev" | "ceo" = panelOverride ?? (
        isDevUser && panelMode === "dev"
          ? "dev"
          : isDevUser && (typeof window !== "undefined" && (window.location.pathname.startsWith("/dev") || window.location.hash.includes("/dev")))
          ? "dev"
          : (isCeoUser || isDevUser) && (panelMode === "ceo" || (typeof window !== "undefined" && (window.location.pathname.startsWith("/ceo") || window.location.hash.includes("/ceo"))))
            ? "ceo"
            : "member"
      );

      // Se o usuário desenvolvedor estiver expressamente com o modo Dev ativo (panelMode === "dev"),
      // qualquer acesso (inclusive rotas executivas como /ceo/selos) avalia com as permissões da Tag Dev,
      // a menos que um panelOverride específico não-dev tenha sido solicitado explicitamente em um subcomponente isolado.
      if (isDevUser && panelMode === "dev" && (!panelOverride || panelOverride === "ceo")) {
        activePanel = "dev";
      }

      // =========================================================================
      // 0. BLOQUEIOS OPERACIONAIS & DE PLATAFORMA (PRECEDÊNCIA MÁXIMA)
      // Regra absoluta do sistema: Bloqueios ficam ACIMA de qualquer cargo (01, 02, etc.),
      // acima de tags de sistema e acima do painel CEO!
      // =========================================================================
      if (!isDevUser || activePanel !== "dev" || !bypassActive) {
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

      // Avaliação base de membro: SOMENTE permissões marcadas no cargo + tags do sistema
      const evaluateAsMember = () =>
        can(level, permission, customRolePermissions) ||
        satisfiesPermission(systemTagPermissions, permission);

      // REGRA 1: NO PAINEL MEMBRO
      // Apenas o cargo do membro e suas tags de sistema definem o acesso.
      // Tag Dev / Tag CEO não concedem permissões extras aqui (exceto bypass Dev ativado explicitamente).
      if (activePanel === "member") {
        if (isDevUser && bypassActive) return true;
        return evaluateAsMember();
      }

      // REGRA 2: NO PAINEL CEO
      if (activePanel === "ceo") {
        if (isDevUser && bypassActive) return true;
        if (permission === "view_ceo") return true;
        if (isCeoUser || isDevUser) {
          if (permission.startsWith("verification.")) {
            return satisfiesPermission(ceoTagPermissions, permission);
          }
          if (satisfiesPermission(ceoTagPermissions, permission)) {
            return true;
          }
        }
        return evaluateAsMember();
      }

      // REGRA 3: NO PAINEL DEV
      if (activePanel === "dev") {
        if (isDevUser) {
          if (bypassActive) return true;
          if (permission === "view_dev_hub" || permission === "view_dev") return true;
          if (permission.startsWith("verification.")) {
            return satisfiesPermission(devTagPermissions, permission);
          }
          if (satisfiesPermission(devTagPermissions, permission)) return true;
        }
        return evaluateAsMember();
      }

      // Fallback padrão: avalia o cargo do membro
      return evaluateAsMember();
    },
    [
      level,
      isDevUser,
      isCeoUser,
      memberTags,
      activeSuspension,
      systemTagPermissions,
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
      // 0. Bloqueios de login e operacionais
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

      // Avaliação estritamente baseada no cargo de membro + tags de sistema (sem Dev bypass)
      return (
        can(level, permission, customRolePermissions) ||
        satisfiesPermission(systemTagPermissions, permission)
      );
    },
    [level, memberTags, activeSuspension, customRolePermissions, systemTagPermissions]
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
