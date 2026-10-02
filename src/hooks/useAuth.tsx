import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAuth, logoutFromApp } from "@/lib/app-api";
import type { AppUser, AuthState, Profile, SignupRequestStatus } from "@/lib/app-types";
import { can, satisfiesPermission, LEVEL_LABEL, type AppLevel, type Permission } from "@/lib/permissions";
import { useRolePermissions } from "@/hooks/useData";
import { isUserDeveloper, DEV_DISCORD_IDS, isDevBypassActive, DEV_CONFIG_EVENT, CEO_CONFIG_EVENT, getCeoTagPermissionsSync, getDevTagPermissionsSync, isUserCeo } from "@/services/devService";
import type { MemberTag } from "@/services/memberTagsService";

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
  hasPermission: (permission: Permission) => boolean;
  memberTags: MemberTag[];
  tagPermissions: Permission[];
  hasTag: (tagId: string) => boolean;
  isMemberBlocked: boolean;
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

    return () => {
      void supabase.removeChannel(channel);
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

    return () => {
      window.removeEventListener("tw_permissions_synced", handlePermissionsSynced);
      window.removeEventListener("tw_auth_reload", handleAuthReload);
      window.removeEventListener("tw_menu_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_ceo_config_updated", handleMenuOrCeoUpdate);
      window.removeEventListener("tw_tags_updated", handleMenuOrCeoUpdate);
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
  const [memberTags, setMemberTagsState] = useState<MemberTag[]>([]);

  useEffect(() => {
    let isCancelled = false;
    async function loadUserTags() {
      if (!activeUserId && !activeProfileId) {
        setMemberTagsState([]);
        return;
      }
      try {
        const idFilters = [
          activeUserId ? `member_id.eq.${activeUserId}` : null,
          activeProfileId && activeProfileId !== activeUserId ? `member_id.eq.${activeProfileId}` : null,
        ].filter(Boolean).join(",");

        const query = supabase
          .from("member_tag_assignments" as any)
          .select("tag_id, member_tags (*)");

        if (idFilters.includes(",")) {
          query.or(idFilters);
        } else if (activeUserId) {
          query.eq("member_id", activeUserId);
        } else if (activeProfileId) {
          query.eq("member_id", activeProfileId);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && !isCancelled) {
          const loadedTags: MemberTag[] = data
            .map((d: any) => d.member_tags)
            .filter(Boolean)
            .filter((t: any) => t.is_active !== false);
          setMemberTagsState(loadedTags);
        }
      } catch (e) {
        console.warn("Aviso ao carregar tags do membro:", e);
      }
    }
    void loadUserTags();
    return () => {
      isCancelled = true;
    };
  }, [activeUserId, activeProfileId, permissionsTick]);

  // Coleta a soma universal de todas as permissões de todas as tags ativas do membro
  const allTagPermissions = useMemo<Permission[]>(() => {
    const permsSet = new Set<Permission>();
    for (const tag of memberTags) {
      if (tag.is_active === false) continue;
      // Permissões explícitas no array permissions
      if (Array.isArray(tag.permissions)) {
        for (const p of tag.permissions) {
          if (p && typeof p === "string") {
            permsSet.add(p as Permission);
          }
        }
      }
      // Regras e permissões implícitas da tag
      const rules = tag.rules || {};
      const cleanId = tag.id.toLowerCase().trim();
      if (rules.can_access_ceo || rules.is_ceo || cleanId === "ceo") {
        permsSet.add("view_ceo" as Permission);
      }
      if (
        rules.can_access_dev ||
        rules.is_dev_test ||
        cleanId === "dev_test" ||
        cleanId === "desenvolvedor"
      ) {
        permsSet.add("view_dev_hub" as Permission);
      }
      if (rules.can_sell || cleanId === "vendedor") {
        permsSet.add("sales.view" as Permission);
        permsSet.add("sales.create" as Permission);
        permsSet.add("sales.history" as Permission);
        permsSet.add("view_sales" as Permission);
        permsSet.add("create_sale" as Permission);
        permsSet.add("view_products" as Permission);
        permsSet.add("view_baus" as Permission);
        permsSet.add("view_stock" as Permission);
      }
      if (rules.can_manage_raw_materials) {
        permsSet.add("raw_materials.view" as Permission);
        permsSet.add("raw_materials.create" as Permission);
        permsSet.add("raw_materials.edit" as Permission);
        permsSet.add("raw_materials.transfer_bau" as Permission);
        permsSet.add("raw_materials.history" as Permission);
      }
      if (rules.can_manage_productions) {
        permsSet.add("productions.view" as Permission);
        permsSet.add("productions.create" as Permission);
        permsSet.add("productions.edit" as Permission);
        permsSet.add("view_productions" as Permission);
        permsSet.add("warehouse.view" as Permission);
      }
      if (rules.can_transfer_warehouse) {
        permsSet.add("warehouse.view" as Permission);
        permsSet.add("warehouse.transfer" as Permission);
        permsSet.add("warehouse.transfer_storage" as Permission);
        permsSet.add("warehouse.transfer_sale" as Permission);
      }
      if (rules.can_adjust_warehouse_stock) {
        permsSet.add("warehouse.view" as Permission);
        permsSet.add("warehouse.adjust" as Permission);
      }
      if (rules.can_manage_production_recipes) {
        permsSet.add("production_management.view" as Permission);
        permsSet.add("production_management.products" as Permission);
        permsSet.add("production_management.raw_materials" as Permission);
        permsSet.add("production_management.productions" as Permission);
        permsSet.add("production_management.settings" as Permission);
      }
      if (rules.can_manage_members) {
        permsSet.add("view_members" as Permission);
        permsSet.add("approve_requests" as Permission);
        permsSet.add("promote_members" as Permission);
        permsSet.add("edit_members" as Permission);
      }
      if (rules.can_view_sensitive_data) {
        permsSet.add("view_sensitive_data" as Permission);
      }
      if (rules.can_view_all_tickets) {
        permsSet.add("view_tickets" as Permission);
        permsSet.add("view_all_tickets" as Permission);
      }
      if (rules.can_create_announcements) {
        permsSet.add("create_announcements" as Permission);
        permsSet.add("manage_announcements" as Permission);
      }
      if (rules.can_reverse_sales) {
        permsSet.add("reverse_sale" as Permission);
        permsSet.add("sales.cancel" as Permission);
      }
      if (rules.can_view_all_sales) {
        permsSet.add("view_all_sales" as Permission);
      }
      if (rules.can_deposit_cash_fund || rules.can_withdraw_cash_fund) {
        permsSet.add("view_cash_fund" as Permission);
        permsSet.add("manage_cash_fund" as Permission);
      }
      if (rules.can_view_financial_reports) {
        permsSet.add("view_consolidated_financials" as Permission);
      }
    }
    return Array.from(permsSet);
  }, [memberTags]);

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
    return memberTags.some((t) => {
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
  }, [profile, memberTags]);

  const isDevMode = Boolean(
    isDevUser &&
      (typeof window !== "undefined"
        ? (window.location.pathname.startsWith("/dev") || window.location.hash.includes("/dev"))
        : panelMode === "dev")
  );

  const isCeoMode = Boolean(
    (isCeoUser || isDevUser) &&
      (typeof window !== "undefined"
        ? (window.location.pathname.startsWith("/ceo") || window.location.hash.includes("/ceo"))
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

  const isMemberBlocked = useMemo(() => {
    return memberTags.some(
      (t) => t.is_active !== false && (t.rules?.is_blocked === true || t.rules?.block_operations === true)
    );
  }, [memberTags]);

  // Garante que membros comuns sem Tag Dev ou Tag CEO nunca fiquem travados em panelMode dev ou ceo
  useEffect(() => {
    if (!loading && !isDevUser && !isCeoUser && panelMode !== "member") {
      setPanelModeState("member");
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tw_panel_mode", "member");
          sessionStorage.setItem("tw_panel_mode", "member");
        } catch {}
      }
    }
  }, [loading, isDevUser, isCeoUser, panelMode]);

  const hasPermission = useCallback(
    (permission: Permission) => {
      const bypassActive = isDevBypassActive();
      const inCeoPanel =
        panelMode === "ceo" ||
        (typeof window !== "undefined" &&
          (window.location.pathname.startsWith("/ceo") || window.location.hash.includes("/ceo")));
      const inDevPanel =
        panelMode === "dev" ||
        (typeof window !== "undefined" &&
          (window.location.pathname.startsWith("/dev") || window.location.hash.includes("/dev")));
      const inMemberPanel = !inCeoPanel && !inDevPanel;

      // 0. Avaliação de Regras Restritivas da Tag (ex: Tag Bloqueado ou Bloqueios Granulares)
      if (!isDevUser) {
        const hasBlockingTag = memberTags.some(
          (t) => t.is_active !== false && (t.rules?.is_blocked === true || t.rules?.block_operations === true)
        );

        const isOperationalAction =
          permission.startsWith("create_") ||
          permission.startsWith("delete_") ||
          permission.startsWith("reverse_") ||
          permission.includes(".create") ||
          permission.includes(".edit") ||
          permission.includes(".delete") ||
          permission.includes(".transfer") ||
          permission.includes(".adjust") ||
          permission.includes(".cancel") ||
          permission === "manage_cash_fund" ||
          permission === "adjust_stock_balance" ||
          permission === "manage_stock_balance";

        if (hasBlockingTag && isOperationalAction) {
          return false;
        }

        // Checa bloqueios específicos adicionais de regras da tag
        const isSalesAction = permission.startsWith("sales.") || permission.includes("sale");
        const isCashAction = permission.includes("cash_fund");
        const isMovementAction = permission.includes("movement");
        const isProdAction = permission.startsWith("productions.") || permission.includes("production");

        for (const t of memberTags) {
          if (t.is_active === false) continue;
          if (t.rules?.block_sales && isSalesAction && isOperationalAction) return false;
          if (t.rules?.block_cash_fund && isCashAction && isOperationalAction) return false;
          if (t.rules?.block_movements && isMovementAction && isOperationalAction) return false;
          if (t.rules?.block_productions && isProdAction && isOperationalAction) return false;
        }
      }

      // 0.1. SOMA UNIVERSAL DAS TAGS:
      // Se qualquer tag ativa do membro possui a permissão (exata ou por herança/equivalência),
      // essa permissão é SOMADA e está plenamente ativa em QUALQUER painel (Membro, CEO ou DEV)!
      if (satisfiesPermission(allTagPermissions, permission)) {
        return true;
      }

      // 1. Quando estiver operando no PAINEL MEMBRO:
      // A soma é: permissões do cargo (level) + permissões de todas as tags (já avaliadas acima!)
      if (inMemberPanel) {
        return can(level, permission, customRolePermissions);
      }

      // 2. Quando estiver operando no PAINEL DEV (ou rota /dev):
      // A soma é: Bypass Dev (se ativo) OU permissões Dev + permissões do cargo (level) + todas as tags!
      if (inDevPanel) {
        if (isDevUser && bypassActive) {
          return true;
        }
        const devPerms = customRolePermissions?.["desenvolvedor"] ?? getDevTagPermissionsSync();
        if (satisfiesPermission(devPerms, permission)) {
          return true;
        }
        if (isDevUser) {
          if (can("desenvolvedor", permission, customRolePermissions)) return true;
          return true;
        }
        return can(level, permission, customRolePermissions);
      }

      // 3. Quando estiver operando no PAINEL CEO (ou rota /ceo):
      // A soma é: permissões CEO + permissões do cargo (level) + todas as tags!
      if (inCeoPanel) {
        const ceoPerms = customRolePermissions?.["ceo"] ?? getCeoTagPermissionsSync();
        if (satisfiesPermission(ceoPerms, permission)) {
          return true;
        }
        return can(level, permission, customRolePermissions);
      }

      // Fallback padrão: avalia o cargo do membro
      return can(level, permission, customRolePermissions);
    },
    [
      level,
      isDevUser,
      isCeoUser,
      memberTags,
      allTagPermissions,
      customRolePermissions,
      devConfigTick,
      panelMode,
      permissionsTick,
    ]
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
      memberTags,
      tagPermissions: allTagPermissions,
      hasTag,
      isMemberBlocked,
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
      memberTags,
      allTagPermissions,
      hasTag,
      isMemberBlocked,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
