import { type ReactNode, useMemo, useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Package,
  Users,
  Workflow,
  TrendingUp,
  Trophy,
  Target,
  ScrollText,
  Settings,
  ShieldCheck,
  LogOut,
  Plus,
  User,
  Tags,
  DollarSign,
  Megaphone,
  Landmark,
  ShieldAlert,
  Zap,
  Clock,
  Moon,
  Wrench,
  ChevronDown,
  Code2,
  KeyRound,
  Menu,
  Terminal,
  ArrowLeft,
  MessageSquare,
  Sliders,
  CalendarOff,
  Sparkles,
  LifeBuoy,
  Crown,
  ExternalLink,
  Bot,
  Webhook,
  Radio,
  FolderTree,
  Activity,
  Shield,
  BellRing,
  PackageCheck,
} from "lucide-react";
import { resolveMenuIcon } from "@/lib/menuIcons";
import {
  isUserDeveloper,
  DEFAULT_CEO_CONFIG,
  type CeoConfiguration,
  getDevThemeColorSync,
  getCeoThemeColorSync,
  DEV_CONFIG_EVENT,
} from "@/services/devService";
import {
  type PanelColor,
  getPanelColorStyle,
  resolveCategoryIcon,
} from "@/lib/panelTheme";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Brand } from "@/components/Brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { usePresence } from "@/hooks/usePresence";
import { useOnlineTimer } from "@/hooks/useOnlineTimer";
import { useMembers } from "@/hooks/useData";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { useDevMenuConfig } from "@/hooks/useDevMenuConfig";
import {
  useCeoMenuConfig,
  DEFAULT_CEO_MENU_ITEMS,
} from "@/hooks/useCeoMenuConfig";
import { LEVEL_LABEL, levelBadgeClass, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { FloatingOnlineMembersWidget } from "./FloatingPresenceWidget";
import { MobileBottomNav } from "./MobileBottomNav";
import { ForceCachePurgeListener } from "@/components/dev/ForceCachePurgeListener";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

type MasterNavItem = {
  id: string;
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  perm?: Permission;
  defaultCat: string;
  defaultOrder: number;
};

const MASTER_NAV_ITEMS: MasterNavItem[] = [
  { id: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, perm: "view_dashboard", defaultCat: "Operação", defaultOrder: 0 },
  { id: "movimentacoes", title: "Movimentações", url: "/movimentacoes", icon: ArrowLeftRight, perm: "view_movements", defaultCat: "Operação", defaultOrder: 1 },
  { id: "vendas", title: "Vendas", url: "/vendas", icon: ShoppingCart, perm: "view_sales", defaultCat: "Operação", defaultOrder: 2 },
  { id: "lives", title: "Lives", url: "/lives", icon: Radio, perm: "view_lives", defaultCat: "Operação", defaultOrder: 3 },
  { id: "tickets", title: "Tickets / Ouvidoria", url: "/tickets", icon: LifeBuoy, perm: "view_tickets", defaultCat: "Operação", defaultOrder: 4 },
  { id: "estoque", title: "Controle de Estoque", url: "/controledeestoque", icon: Boxes, perm: "view_stock", defaultCat: "Gestão", defaultOrder: 5 },
  { id: "gestao-estoque", title: "Gestão de Estoque", url: "/gestao-estoque", icon: PackageCheck, perm: "view_stock_management", defaultCat: "Gestão", defaultOrder: 6 },
  { id: "membros", title: "Membros", url: "/membros", icon: Users, perm: "view_members", defaultCat: "Gestão", defaultOrder: 7 },
  { id: "hierarquia", title: "Hierarquia", url: "/hierarquia", icon: Workflow, perm: "view_hierarchy", defaultCat: "Gestão", defaultOrder: 7 },
  { id: "fundo-caixa", title: "Fundo de Caixa", url: "/fundo-caixa", icon: Landmark, perm: "view_cash_fund", defaultCat: "Gestão", defaultOrder: 8 },
  { id: "ausencias", title: "Ausências", url: "/ausencias", icon: CalendarOff, perm: "view_absences", defaultCat: "Gestão", defaultOrder: 9 },
  { id: "rankings", title: "Rankings", url: "/rankings", icon: Trophy, perm: "view_rankings", defaultCat: "Gestão", defaultOrder: 10 },
  { id: "desempenho", title: "Meu Desempenho", url: "/desempenho", icon: User, perm: "view_performance", defaultCat: "Gestão", defaultOrder: 11 },
  { id: "metas", title: "Metas", url: "/metas", icon: Target, perm: "view_goals", defaultCat: "Gestão", defaultOrder: 12 },
  { id: "avisos", title: "Enviar Avisos", url: "/avisos", icon: Megaphone, perm: "manage_announcements", defaultCat: "Gestão", defaultOrder: 13 },
  { id: "cargos", title: "Gerenciamento de Cargos", url: "/cargos", icon: ShieldCheck, perm: "manage_roles", defaultCat: "Administração", defaultOrder: 14 },
  { id: "permissoes", title: "Permissões", url: "/permissoes", icon: Settings, perm: "manage_permissions", defaultCat: "Administração", defaultOrder: 15 },
  { id: "atualizacoes", title: "Atualizações", url: "/atualizacoes", icon: Sparkles, perm: "view_patch_notes", defaultCat: "Administração", defaultOrder: 16 },
  { id: "perfil", title: "Meu Perfil", url: "/perfil", icon: User, perm: "view_profile", defaultCat: "Gestão", defaultOrder: 17 },
  { id: "configuracoes", title: "Configurações", url: "/configuracoes", icon: Wrench, perm: "manage_platform_settings", defaultCat: "Administração", defaultOrder: 18 },
];

const URL_TO_PERMISSION_MAP: Record<string, Permission> = {
  "/dashboard": "view_dashboard",
  "/movimentacoes": "view_movements",
  "/vendas": "view_sales",
  "/lives": "view_lives",
  "/tickets": "view_tickets",
  "/controledeestoque": "view_stock",
  "/estoque": "view_stock",
  "/gestao-estoque": "view_stock_management",
  "/baus": "view_stock",
  "/categorias": "view_stock",
  "/produtos": "view_stock",
  "/membros": "view_members",
  "/hierarquia": "view_hierarchy",
  "/fundo-caixa": "view_cash_fund",
  "/ausencias": "view_absences",
  "/rankings": "view_rankings",
  "/desempenho": "view_performance",
  "/meu-desempenho": "view_performance",
  "/metas": "view_goals",
  "/avisos": "manage_announcements",
  "/cargos": "manage_roles",
  "/permissoes": "manage_permissions",
  "/permissoes-gerais": "manage_permissions",
  "/atualizacoes": "view_patch_notes",
  "/perfil": "view_profile",
  "/configuracoes": "manage_platform_settings",
  "/dev/notificacoes": "view_dev_notifications",
  "/ceo/notificacoes": "view_ceo_notifications",
  "/ceo/ajustes-estoque": "view_ceo_stock_adjustments",
};

const DEV_MODULE_NAV_ITEMS: MasterNavItem[] = [
  { id: "dev-hub", title: "Painel Dev Geral", url: "/dev", icon: Terminal, defaultCat: "DEV", defaultOrder: 0 },
  { id: "dev-bot", title: "Bot", url: "/dev/bot", icon: Bot, defaultCat: "DEV", defaultOrder: 1 },
  { id: "dev-estoque", title: "Estoque", url: "/dev/estoque", icon: Boxes, defaultCat: "DEV", defaultOrder: 2 },
  { id: "dev-patch-notes", title: "Patch Notes & Releases", url: "/dev/patch-notes", icon: Sparkles, defaultCat: "DEV", defaultOrder: 3 },
  { id: "dev-desempenho", title: "Gestão Desempenho", url: "/dev/desempenho", icon: TrendingUp, defaultCat: "DEV", defaultOrder: 4 },
  { id: "dev-permissoes", title: "Permissões Tag Dev", url: "/dev/permissoes", icon: KeyRound, defaultCat: "DEV", defaultOrder: 5 },
  { id: "dev-configuracao", title: "Configurações Dev", url: "/dev/configuracao", icon: Code2, defaultCat: "DEV", defaultOrder: 6 },
  { id: "dev-menu-lateral", title: "Menu Lateral Dev", url: "/dev/menu-lateral", icon: Sliders, defaultCat: "DEV", defaultOrder: 7 },
  { id: "dev-notificacoes", title: "Central de Notificações", url: "/dev/notificacoes", icon: BellRing, defaultCat: "DEV", defaultOrder: 8 },
];

const CEO_MODULE_NAV_ITEMS: MasterNavItem[] = [
  { id: "ceo-executivo", title: "Visão Executiva & Métricas", url: "/ceo/executivo", icon: LayoutDashboard, defaultCat: "CEO", defaultOrder: 0 },
  { id: "ceo-bot", title: "Gerenciar Bot", url: "/ceo/bot", icon: Bot, defaultCat: "CEO", defaultOrder: 1 },
  { id: "ceo-webhooks", title: "WebHook Discord", url: "/ceo/webhooks", icon: Webhook, defaultCat: "CEO", defaultOrder: 2 },
  { id: "ceo-financas", title: "Fundo de Caixa & Finanças", url: "/ceo/financas", icon: Landmark, defaultCat: "CEO", defaultOrder: 3 },
  { id: "ceo-ajustes-estoque", title: "Ajustes de Estoque", url: "/ceo/ajustes-estoque", icon: Sliders, defaultCat: "CEO", defaultOrder: 4 },
  { id: "ceo-notificacoes", title: "Central de Notificações", url: "/ceo/notificacoes", icon: BellRing, defaultCat: "CEO", defaultOrder: 5 },
];

function DynamicSidebarNavigation() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { hasPermission, user, profile, level, isDevMode, isCeoMode, setPanelMode, isCeoUser } = useAuth();
  const { config: menuConfig } = useMenuConfig();
  const { config: devMenuConfig } = useDevMenuConfig();
  const { config: ceoMenuConfig } = useCeoMenuConfig();
  const { isMobile, setOpenMobile } = useSidebar();
  const storageKey = "tw_sidebar_open_cat_v2";

  const ceoConfig = useMemo<CeoConfiguration>(() => {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("tw_ceo_config_v1");
        if (local) return { ...DEFAULT_CEO_CONFIG, ...JSON.parse(local) };
      } catch {}
    }
    return DEFAULT_CEO_CONFIG;
  }, []);

  const [devTheme, setDevTheme] = useState<PanelColor>(() => getDevThemeColorSync());
  const [ceoTheme, setCeoTheme] = useState<PanelColor>(() => getCeoThemeColorSync());

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      if (e?.detail) {
        if (e.detail.devThemeColor) setDevTheme(e.detail.devThemeColor);
        if (e.detail.ceoThemeColor) setCeoTheme(e.detail.ceoThemeColor);
      }
    };
    window.addEventListener(DEV_CONFIG_EVENT, handleConfigChange);
    return () => window.removeEventListener(DEV_CONFIG_EVENT, handleConfigChange);
  }, []);

  const devStyle = useMemo(() => getPanelColorStyle(devTheme, "rose"), [devTheme]);
  const ceoStyle = useMemo(() => getPanelColorStyle(ceoTheme, "amber"), [ceoTheme]);

  const isItemActive = useCallback(
    (targetUrl: string) => {
      if (targetUrl.includes("?")) {
        const [path, query] = targetUrl.split("?");
        const params = new URLSearchParams(query);
        const expectedTab = params.get("tab");
        const currentTab =
          (routerState.location.search as any)?.tab ||
          (typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("tab")
            : null) ||
          pathname.split("/").filter(Boolean).pop() ||
          "dashboard";

        if (pathname === path || pathname.startsWith(path + "/")) {
          return expectedTab === currentTab;
        }
        return false;
      }
      if (targetUrl === "/dev" && (pathname === "/dev" || pathname === "/dev/")) return true;
      if (targetUrl === "/ceo" && (pathname === "/ceo" || pathname === "/ceo/")) return true;
      if (pathname === targetUrl) return true;
      if (targetUrl !== "/dev" && targetUrl !== "/ceo" && targetUrl !== "/" && pathname.startsWith(targetUrl + "/")) return true;
      return false;
    },
    [pathname, routerState.location.search]
  );

  const [openCategory, setOpenCategory] = useState<string | null>(() => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });

  const toggleCategory = useCallback(
    (cat: string) => {
      setOpenCategory((prev) => {
        // Modo acordeão: Se já estiver aberta, fecha (null). Se for outra, abre a nova e fecha qualquer outra.
        const next = prev === cat ? null : cat;
        try {
          if (next) {
            localStorage.setItem(storageKey, next);
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch {}
        return next;
      });
    },
    [storageKey]
  );

  const isDevUser = isUserDeveloper(user, profile, level);

  // Sincroniza o modo de painel com base na rota acessada
  useEffect(() => {
    if (pathname.startsWith("/dev")) {
      if (isDevUser && !isDevMode) setPanelMode("dev");
    } else if (pathname.startsWith("/ceo")) {
      if ((isCeoUser || isDevUser) && !isCeoMode) setPanelMode("ceo");
    } else {
      // Qualquer rota regular de membro (/dashboard, /estoque, /membros, etc.)
      if (isDevMode || isCeoMode) {
        setPanelMode("member");
      }
    }
  }, [pathname, isDevUser, isCeoUser, isDevMode, isCeoMode, setPanelMode]);

  const grouped = useMemo(() => {
    // 1. Configuração do menu da plataforma (Membros / Geral)
    const validConfigItems = menuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
    const configMap = new Map(validConfigItems.map((c) => [c.id || c.url, c]));

    const categoryOrder = menuConfig?.categories?.length
      ? menuConfig.categories
      : ["Operação", "Gestão", "Administração"];

    // Customiza itens nativos da plataforma com a configuração salva
    const customizedMaster: MasterNavItem[] = MASTER_NAV_ITEMS.map((item, defaultIdx) => {
      const cfg = configMap.get(item.id) || configMap.get(item.url);
      return {
        ...item,
        title: cfg?.title || item.title,
        icon: cfg?.iconName ? resolveMenuIcon(cfg.iconName, item.url) : item.icon,
        visible: cfg ? cfg.visible !== false : true,
        category: cfg?.category || item.defaultCat,
        order: typeof cfg?.order === "number" ? cfg.order : item.defaultOrder ?? defaultIdx,
      };
    });

    // Anexa itens customizados criados pelo usuário
    const masterIds = new Set(MASTER_NAV_ITEMS.map((m) => m.id));
    const customNavItems: MasterNavItem[] = validConfigItems
      .filter((c) => !masterIds.has(c.id))
      .map((c, idx) => {
        const cleanPath = (c.url || "").split("?")[0].toLowerCase();
        const autoPerm = URL_TO_PERMISSION_MAP[cleanPath];
        return {
          id: c.id,
          title: c.title,
          url: c.url,
          icon: resolveMenuIcon(c.iconName, c.url) as typeof LayoutDashboard,
          perm: autoPerm,
          defaultCat: c.category || categoryOrder[0] || "Gestão",
          category: c.category || categoryOrder[0] || "Gestão",
          defaultOrder: typeof c.order === "number" ? c.order : 100 + idx,
          order: typeof c.order === "number" ? c.order : 100 + idx,
          visible: c.visible !== false,
          isCustom: true,
        };
      });

    const allPlatformItems: MasterNavItem[] = [...customizedMaster, ...customNavItems].filter(
      (item) => item.id !== "chat" && item.id !== "logs" && item.url !== "/chat" && item.url !== "/logs"
    );

    // Itens da Categoria CEO (dinâmico com base em useCeoMenuConfig e permissões)
    const ceoValidItems = ceoMenuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
    const ceoConfigMap = new Map(ceoValidItems.map((c) => [c.id || c.url, c]));
    const ceoCategoryOrder = ceoMenuConfig?.categories?.length
      ? ceoMenuConfig.categories
      : ["CEO"];

    const defaultCeoIds = new Set(DEFAULT_CEO_MENU_ITEMS.map((d) => d.id));
    const customizedCeo: MasterNavItem[] = DEFAULT_CEO_MENU_ITEMS.map((item, defaultIdx) => {
      const cfg = ceoConfigMap.get(item.id) || ceoConfigMap.get(item.url);
      return {
        id: item.id,
        title: cfg?.title || item.title,
        url: cfg?.url || item.url,
        icon: (cfg?.iconName ? resolveMenuIcon(cfg.iconName, item.url) : resolveMenuIcon(item.iconName, item.url)) as typeof LayoutDashboard,
        visible: cfg ? cfg.visible !== false : item.visible !== false,
        defaultCat: item.category || "CEO",
        category: cfg?.category || item.category || "CEO",
        defaultOrder: item.order ?? defaultIdx,
        order: typeof cfg?.order === "number" ? cfg.order : item.order ?? defaultIdx,
      };
    });

    const customCeoItems: MasterNavItem[] = ceoValidItems
      .filter((c) => !defaultCeoIds.has(c.id))
      .map((c, idx) => ({
        id: c.id,
        title: c.title,
        url: c.url,
        icon: resolveMenuIcon(c.iconName, c.url) as typeof LayoutDashboard,
        visible: c.visible !== false,
        defaultCat: c.category || ceoCategoryOrder[0] || "CEO",
        category: c.category || ceoCategoryOrder[0] || "CEO",
        defaultOrder: typeof c.order === "number" ? c.order : 50 + idx,
        order: typeof c.order === "number" ? c.order : 50 + idx,
        isCustom: true,
      }));

    const allCeoItems = [...customizedCeo, ...customCeoItems];

    const visibleCeo = (isCeoUser || isDevUser)
      ? allCeoItems.filter((item) => {
          if (!item.visible) return false;
          if (item.id === "ceo-dashboard" && !hasPermission("view_ceo")) return false;
          if (item.id === "ceo-bot" && (!hasPermission("manage_ceo_bot") || ceoConfig.allowManageBot === false)) return false;
          if (item.id === "ceo-webhooks" && (!hasPermission("manage_ceo_webhooks") || ceoConfig.allowWebhooks === false)) return false;
          if (item.id === "ceo-financas" && (!hasPermission("view_ceo_financials") || ceoConfig.allowFinancials === false)) return false;
          return true;
        })
      : [];

    const ceoGroups: { category: string; items: typeof visibleCeo }[] = [];
    ceoCategoryOrder.forEach((cat) => {
      const catItems = visibleCeo
        .filter((i) => (i.category || "CEO") === cat)
        .sort((a, b) => a.order - b.order);
      if (catItems.length > 0) {
        ceoGroups.push({ category: cat, items: catItems });
      }
    });

    const knownCeoCats = new Set(ceoCategoryOrder);
    visibleCeo.forEach((item) => {
      const cat = item.category || "CEO";
      if (!knownCeoCats.has(cat)) {
        knownCeoCats.add(cat);
        const catItems = visibleCeo
          .filter((i) => (i.category || "CEO") === cat)
          .sort((a, b) => a.order - b.order);
        if (catItems.length > 0) {
          ceoGroups.push({ category: cat, items: catItems });
        }
      }
    });

    // =========================================================================
    // MODO 1: DESENVOLVEDOR (Apenas membros com tag Dev em modo Dev)
    // =========================================================================
    if (isDevUser && isDevMode) {
      // A) Agrupa ferramentas exclusivas de Dev
      const devValidItems = devMenuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
      const devConfigMap = new Map(devValidItems.map((c) => [c.id || c.url, c]));
      const rawDevCats = devMenuConfig?.categories?.length
        ? devMenuConfig.categories
        : ["DEV"];
      const devCategoryOrder = Array.from(
        new Set(
          rawDevCats.map((c) =>
            c.toLowerCase() === "ferramentas dev" || c.toLowerCase() === "ferramenta dev" ? "DEV" : c
          )
        )
      );
      if (!devCategoryOrder.includes("DEV")) {
        devCategoryOrder.unshift("DEV");
      }

      const defaultDevIds = new Set(DEV_MODULE_NAV_ITEMS.map((d) => d.id));
      const customizedDev = DEV_MODULE_NAV_ITEMS.map((item, defaultIdx) => {
        const cfg = devConfigMap.get(item.id) || devConfigMap.get(item.url);
        let cat = cfg?.category || item.defaultCat;
        if (!cat || cat.toLowerCase() === "ferramentas dev" || cat.toLowerCase() === "ferramenta dev") {
          cat = "DEV";
        }
        return {
          ...item,
          title: cfg?.title || item.title,
          url: cfg?.url || item.url,
          icon: (cfg?.iconName ? resolveMenuIcon(cfg.iconName, item.url) : item.icon) as typeof LayoutDashboard,
          visible: cfg ? cfg.visible !== false : true,
          category: cat,
          order: typeof cfg?.order === "number" ? cfg.order : item.defaultOrder ?? defaultIdx,
        };
      });

      const customDevItems: MasterNavItem[] = devValidItems
        .filter((c) => !defaultDevIds.has(c.id))
        .map((c, idx) => ({
          id: c.id,
          title: c.title,
          url: c.url,
          icon: resolveMenuIcon(c.iconName, c.url) as typeof LayoutDashboard,
          category: c.category || devCategoryOrder[0] || "DEV",
          defaultCat: c.category || devCategoryOrder[0] || "DEV",
          defaultOrder: typeof c.order === "number" ? c.order : 50 + idx,
          order: typeof c.order === "number" ? c.order : 50 + idx,
          visible: c.visible !== false,
          isCustom: true,
        }));

      const allDevItems = [...customizedDev, ...customDevItems];
      const visibleDev = allDevItems.filter((item) => item.visible);
      const devGroups: { category: string; items: typeof visibleDev }[] = [];

      devCategoryOrder.forEach((cat) => {
        const catItems = visibleDev
          .filter((i) => i.category === cat)
          .sort((a, b) => a.order - b.order);
        if (catItems.length > 0) {
          devGroups.push({ category: cat, items: catItems });
        }
      });

      const knownDevCats = new Set(devCategoryOrder);
      visibleDev.forEach((item) => {
        if (!knownDevCats.has(item.category)) {
          knownDevCats.add(item.category);
          const catItems = visibleDev
            .filter((i) => i.category === item.category)
            .sort((a, b) => a.order - b.order);
          if (catItems.length > 0) {
            devGroups.push({ category: item.category, items: catItems });
          }
        }
      });

      // B) Agrupa menus da plataforma com URLs prefixadas como /dev/* (apenas o que o Dev tem permissão)
      const visibleMaster = allPlatformItems
        .filter((item) => item.visible && (!item.perm || hasPermission(item.perm)))
        .map((item) => {
          let devUrl = item.url;
          if (item.id === "desempenho") {
            devUrl = "/dev/meu-desempenho";
          } else if (item.id === "permissoes") {
            devUrl = "/dev/permissoes-gerais";
          } else if (item.id === "estoque" || item.url === "/controledeestoque" || item.url === "/estoque") {
            devUrl = "/dev/controledeestoque";
          } else if (devUrl.startsWith("/") && !devUrl.startsWith("/dev")) {
            devUrl = `/dev${devUrl}`;
          }
          return {
            ...item,
            url: devUrl,
          };
        });

      const platformGroups: { category: string; items: typeof visibleMaster }[] = [];

      categoryOrder.forEach((cat) => {
        const catItems = visibleMaster
          .filter((i) => i.category === cat)
          .sort((a, b) => a.order - b.order);
        if (catItems.length > 0) {
          platformGroups.push({ category: cat, items: catItems });
        }
      });

      const knownPlatformCats = new Set(categoryOrder);
      visibleMaster.forEach((item) => {
        if (!knownPlatformCats.has(item.category)) {
          knownPlatformCats.add(item.category);
          const catItems = visibleMaster
            .filter((i) => i.category === item.category)
            .sort((a, b) => a.order - b.order);
          if (catItems.length > 0) {
            platformGroups.push({ category: item.category, items: catItems });
          }
        }
      });

      // Isolamento estrito: No modo Dev, aparecem APENAS menus dev e da plataforma dev
      return [...devGroups, ...platformGroups];
    }

    // =========================================================================
    // MODO 2: CEO (Apenas membros com tag CEO em modo CEO)
    // =========================================================================
    if ((isCeoUser || isDevUser) && isCeoMode) {
      // A) Ferramentas CEO (ceoGroups)
      // B) Agrupa menus da plataforma com URLs prefixadas como /ceo/* (apenas o que o CEO tem permissão)
      const visibleCeoMaster = allPlatformItems
        .filter((item) => item.id !== "dashboard" && item.url !== "/dashboard")
        .filter((item) => item.visible && (!item.perm || hasPermission(item.perm)))
        .map((item) => {
          let ceoUrl = item.url;
          if (ceoUrl.startsWith("/") && !ceoUrl.startsWith("/ceo")) {
            ceoUrl = `/ceo${ceoUrl}`;
          }
          return {
            ...item,
            url: ceoUrl,
          };
        });

      const ceoPlatformGroups: { category: string; items: typeof visibleCeoMaster }[] = [];

      categoryOrder.forEach((cat) => {
        const catItems = visibleCeoMaster
          .filter((i) => i.category === cat)
          .sort((a, b) => a.order - b.order);
        if (catItems.length > 0) {
          ceoPlatformGroups.push({ category: cat, items: catItems });
        }
      });

      const knownCeoPlatformCats = new Set(categoryOrder);
      visibleCeoMaster.forEach((item) => {
        if (!knownCeoPlatformCats.has(item.category)) {
          knownCeoPlatformCats.add(item.category);
          const catItems = visibleCeoMaster
            .filter((i) => i.category === item.category)
            .sort((a, b) => a.order - b.order);
          if (catItems.length > 0) {
            ceoPlatformGroups.push({ category: item.category, items: catItems });
          }
        }
      });

      // Isolamento estrito: No modo CEO, aparecem APENAS menus CEO e da plataforma ceo
      return [...ceoGroups, ...ceoPlatformGroups];
    }

    // =========================================================================
    // MODO 3: MEMBRO REGULAR (Sem menus Dev e sem menus CEO)
    // Regra: Apenas menus que o cargo do membro tem permissão!
    // =========================================================================
    const visibleMember = allPlatformItems.filter((item) => {
      // 1. Nunca exibir links de dev ou de ceo no painel membro
      if (item.url.startsWith("/dev") || item.url.startsWith("/ceo")) return false;
      // 2. Se foi desmarcado/ocultado na configuração do menu
      if (!item.visible) return false;
      // 3. Verifica estritamente a permissão exigida pelo cargo do membro
      const cleanPath = item.url.split("?")[0].toLowerCase();
      const requiredPerm = item.perm || URL_TO_PERMISSION_MAP[cleanPath];
      if (requiredPerm && !hasPermission(requiredPerm)) {
        return false;
      }
      return true;
    });

    const memberGroups: { category: string; items: typeof visibleMember }[] = [];

    categoryOrder.forEach((cat) => {
      const catItems = visibleMember
        .filter((i) => i.category === cat)
        .sort((a, b) => a.order - b.order);
      if (catItems.length > 0) {
        memberGroups.push({ category: cat, items: catItems });
      }
    });

    const knownMemberCats = new Set(categoryOrder);
    visibleMember.forEach((item) => {
      if (!knownMemberCats.has(item.category)) {
        knownMemberCats.add(item.category);
        const catItems = visibleMember
          .filter((i) => i.category === item.category)
          .sort((a, b) => a.order - b.order);
        if (catItems.length > 0) {
          memberGroups.push({ category: item.category, items: catItems });
        }
      }
    });

    return memberGroups;
  }, [isDevMode, isCeoMode, isDevUser, isCeoUser, menuConfig, devMenuConfig, ceoMenuConfig, ceoConfig, hasPermission]);

  useEffect(() => {
    if (!grouped.length) return;
    const activeGroup = grouped.find((g) => g.items.some((i) => isItemActive(i.url)));
    if (activeGroup) {
      setOpenCategory(activeGroup.category);
    } else {
      setOpenCategory((prev) => {
        if (!prev || !grouped.some((g) => g.category === prev)) {
          return grouped[0]?.category || null;
        }
        return prev;
      });
    }
  }, [pathname, isItemActive, grouped]);

  return (
    <>
      {grouped.map(({ category, items }) => {
        const isOpen = openCategory === category;

        // Isolamento estrito: devStyle e ícone Dev APENAS em categorias de Dev
        const isDevCategory = devMenuConfig?.categories?.length
          ? devMenuConfig.categories.includes(category) || category === "DEV" || category === "Ferramentas Dev" || category === "Dev"
          : (category === "DEV" || category === "Ferramentas Dev" || category === "Dev");

        // Isolamento estrito: ceoStyle e ícone CEO APENAS em categorias de CEO
        const isCeoCategory = !isDevCategory && (
          ceoMenuConfig?.categories?.length
            ? ceoMenuConfig.categories.includes(category)
            : category === "CEO"
        );

        let activeStyle = null;
        let defaultFallbackIcon = FolderTree;
        let savedIconName: string | null | undefined = null;

        if (isDevCategory) {
          activeStyle = devStyle;
          defaultFallbackIcon = Terminal;
          savedIconName = devMenuConfig?.categoryIcons?.[category];
        } else if (isCeoCategory) {
          activeStyle = ceoStyle;
          defaultFallbackIcon = Crown;
          savedIconName = ceoMenuConfig?.categoryIcons?.[category];
        } else {
          // Categorias padrão da plataforma (Operação, Gestão, Administração, etc.)
          activeStyle = null;
          savedIconName = menuConfig?.categoryIcons?.[category];
          if (category === "Operação") {
            defaultFallbackIcon = Activity;
          } else if (category === "Gestão") {
            defaultFallbackIcon = Shield;
          } else if (category === "Administração") {
            defaultFallbackIcon = Sliders;
          } else {
            defaultFallbackIcon = FolderTree;
          }
        }

        const CatIcon = resolveCategoryIcon(savedIconName, defaultFallbackIcon);

        return (
          <SidebarGroup key={category} className="py-1 px-1">
            <SidebarGroupLabel asChild>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="group/label flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[10.5px] uppercase tracking-[0.14em] font-bold text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-150 cursor-pointer"
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className={cn(
                      "flex items-center justify-center h-5 w-5 rounded-md shrink-0 transition-colors",
                      isDevCategory
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        : isCeoCategory
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-primary/10 text-primary border border-primary/20"
                    )}
                  >
                    <CatIcon className="h-3 w-3 shrink-0" />
                  </span>
                  <span
                    className={cn(
                      "truncate font-bold tracking-wider",
                      isDevCategory
                        ? devStyle.textClass
                        : isCeoCategory
                        ? ceoStyle.textClass
                        : "text-sidebar-foreground"
                    )}
                  >
                    {category}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground/60 group-hover/label:text-foreground shrink-0",
                    !isOpen && "-rotate-90 text-primary/70"
                  )}
                />
              </button>
            </SidebarGroupLabel>

            {isOpen && (
              <SidebarGroupContent className="pt-1 pb-0.5 animate-in fade-in-50 duration-200">
                <SidebarMenu className="gap-0.5">
                  {items.map((item) => {
                    const active = isItemActive(item.url);
                    const isExternal = item.url.startsWith("http://") || item.url.startsWith("https://");
                    const ItemIcon = item.icon || resolveMenuIcon(undefined, item.url);

                    let linkTarget: any = item.url;
                    let linkSearch: any = undefined;
                    if (item.url.includes("?")) {
                      const [p, q] = item.url.split("?");
                      linkTarget = p;
                      linkSearch = Object.fromEntries(new URLSearchParams(q));
                    }

                    return (
                      <SidebarMenuItem key={item.id || item.url}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                          {isExternal ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                if (isMobile) setOpenMobile(false);
                              }}
                              className={cn(
                                "group/menuitem flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150",
                                isDevCategory
                                  ? "text-sidebar-foreground/85 hover:text-rose-400 hover:bg-rose-500/10"
                                  : isCeoCategory
                                  ? "text-sidebar-foreground/85 hover:text-amber-400 hover:bg-amber-500/10"
                                  : "text-sidebar-foreground/85 hover:text-primary hover:bg-sidebar-accent/70"
                              )}
                            >
                              <ItemIcon
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-colors",
                                  isDevCategory
                                    ? "text-rose-400/80 group-hover/menuitem:text-rose-400"
                                    : isCeoCategory
                                    ? "text-amber-400/80 group-hover/menuitem:text-amber-400"
                                    : "text-muted-foreground group-hover/menuitem:text-primary"
                                )}
                              />
                              <span className="truncate flex-1">{item.title}</span>
                              <ExternalLink className="h-3 w-3 ml-auto opacity-50 shrink-0" />
                            </a>
                          ) : (
                            <Link
                              to={linkTarget}
                              search={linkSearch}
                              onClick={() => {
                                if (isMobile) setOpenMobile(false);
                              }}
                              className={cn(
                                "group/menuitem flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 relative",
                                active
                                  ? isDevCategory
                                    ? cn(devStyle.activeItemClass, "shadow-xs font-semibold")
                                    : isCeoCategory
                                    ? cn(ceoStyle.activeItemClass, "shadow-xs font-semibold")
                                    : "bg-primary/10 text-primary border-l-2 border-primary font-semibold shadow-xs"
                                  : isDevCategory
                                  ? "text-sidebar-foreground/80 hover:text-rose-300 hover:bg-rose-500/10"
                                  : isCeoCategory
                                  ? "text-sidebar-foreground/80 hover:text-amber-300 hover:bg-amber-500/10"
                                  : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                              )}
                            >
                              <ItemIcon
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-colors",
                                  active
                                    ? isDevCategory
                                      ? devStyle.textClass
                                      : isCeoCategory
                                      ? ceoStyle.textClass
                                      : "text-primary"
                                    : isDevCategory
                                    ? "text-rose-400/70 group-hover/menuitem:text-rose-300"
                                    : isCeoCategory
                                    ? "text-amber-400/70 group-hover/menuitem:text-amber-300"
                                    : "text-muted-foreground group-hover/menuitem:text-foreground"
                                )}
                              />
                              <span className="truncate flex-1">{item.title}</span>
                            </Link>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, level, signOut, user, isCeoUser, isDevUser, setPanelMode } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  // Permissões e cálculo de acesso a múltiplos painéis
  const canAccessCeo = isCeoUser || isDevUser;
  const canAccessDev = isDevUser;
  const hasMultiplePanels = canAccessCeo || canAccessDev;

  const [devTheme, setDevTheme] = useState<PanelColor>(() => getDevThemeColorSync());
  const [ceoTheme, setCeoTheme] = useState<PanelColor>(() => getCeoThemeColorSync());

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      if (e?.detail) {
        if (e.detail.devThemeColor) setDevTheme(e.detail.devThemeColor);
        if (e.detail.ceoThemeColor) setCeoTheme(e.detail.ceoThemeColor);
      }
    };
    window.addEventListener(DEV_CONFIG_EVENT, handleConfigChange);
    return () => window.removeEventListener(DEV_CONFIG_EVENT, handleConfigChange);
  }, []);

  const devStyle = useMemo(() => getPanelColorStyle(devTheme, "rose"), [devTheme]);
  const ceoStyle = useMemo(() => getPanelColorStyle(ceoTheme, "amber"), [ceoTheme]);

  // Active user status / presence management
  const { status, isAbsenceMode, resumeSession } = usePresence(user?.id);
  const { data: members = [] } = useMembers();
  const myMember = members.find((m) => m.user_id === user?.id);

  // Live online timer for active session
  const { formattedHuman } = useOnlineTimer(myMember?.online_since);

  const avatarUrl = profile?.avatar_url || profile?.discord_avatar_url;
  const mainName = profile?.nickname || profile?.nome || "Membro";
  const subName = profile?.nickname ? profile.nome : null;
  const initials = mainName.slice(0, 2).toUpperCase();
  const { settings } = usePlatformSettings();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="px-4 py-5 shrink-0">
            <Brand size="sm" />
          </SidebarHeader>
          <SidebarContent>
            <DynamicSidebarNavigation />
          </SidebarContent>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col min-h-screen">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 sm:gap-4 border-b border-border/70 bg-background/95 backdrop-blur-xl px-3 sm:px-6 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <SidebarTrigger />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gradient-brand font-display font-extrabold text-xs sm:text-base tracking-[0.12em] uppercase truncate drop-shadow-xs max-w-[120px] sm:max-w-none">
                  {settings.factionName || "Twin Wheels"}
                </span>
                {settings.slogan && (
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hidden xl:inline-block">
                    · {settings.slogan}
                  </span>
                )}
              </div>

              {/* SELETOR DE PAINÉIS (MEMBRO / CEO / DEV) NA BARRA DE TOPO */}
              {/* Só exibe se o membro tiver acesso a mais de um painel, e apenas os painéis permitidos */}
              {hasMultiplePanels && (
                <div className="flex items-center p-0.5 sm:p-1 bg-secondary/50 border border-border/80 rounded-xl shadow-xs gap-0.5 sm:gap-1 backdrop-blur-md">
                  {/* Botão Painel Membro */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/dashboard"
                        onClick={() => setPanelMode("member")}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                          !pathname.startsWith("/dev") && !pathname.startsWith("/ceo")
                            ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/40 font-bold"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        )}
                        aria-label="Painel Membro"
                      >
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <span className="hidden md:inline">Membro</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-[11px] font-bold">
                      Painel Membro
                    </TooltipContent>
                  </Tooltip>

                  {/* Botão Painel CEO */}
                  {canAccessCeo && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to="/ceo/dashboard"
                          onClick={() => setPanelMode("ceo")}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                            pathname.startsWith("/ceo")
                              ? cn(ceoStyle.bgSolidClass, "shadow-xs ring-1", ceoStyle.ringClass, "font-bold")
                              : cn(ceoStyle.textMutedClass, "hover:bg-secondary/60 hover:text-foreground")
                          )}
                          aria-label="Painel CEO"
                        >
                          <Crown className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden md:inline">CEO</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className={cn("text-[11px] font-bold", ceoStyle.textClass)}>
                        Painel Executivo CEO
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Botão Painel Dev */}
                  {canAccessDev && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to="/dev/dashboard"
                          onClick={() => setPanelMode("dev")}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                            pathname.startsWith("/dev")
                              ? cn(devStyle.bgSolidClass, "shadow-xs ring-1", devStyle.ringClass, "font-bold")
                              : cn(devStyle.textMutedClass, "hover:bg-secondary/60 hover:text-foreground")
                          )}
                          aria-label="Painel Dev Tools"
                        >
                          <Terminal className="h-3.5 w-3.5 shrink-0" />
                          <span className="hidden md:inline">Dev</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className={cn("text-[11px] font-bold", devStyle.textClass)}>
                        Painel Dev (Dev Tools)
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>

            {/* TOP HEADER: LIVE REALTIME ONLINE TIMER + NOTIFICATION CENTER + USER AVATAR */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* LIVE ONLINE TIMER BADGE (Em telas < sm fica oculto do topo para evitar poluição visual; visível no dropdown do perfil) */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-[10.5px] sm:text-xs font-bold shadow-sm"
                title="Sua sessão online ativa em tempo real nesta plataforma"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{formattedHuman}</span>
              </div>

              {/* CENTRAL DE NOTIFICAÇÕES EM TEMPO REAL */}
              <NotificationCenter />

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex items-center gap-2 h-10 sm:h-11 px-1.5 sm:px-2 hover:bg-secondary/50 rounded-xl outline-none"
                  >
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border border-primary/40 shadow-sm pointer-events-none shrink-0">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={mainName} />}
                      <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="text-left min-w-0 hidden md:block pointer-events-none max-w-[130px]">
                      <p className="truncate text-xs sm:text-sm font-bold text-foreground leading-tight">
                        {mainName}
                      </p>
                      {subName ? (
                        <p className="truncate text-[0.65rem] text-muted-foreground leading-tight">
                          {subName}
                        </p>
                      ) : (
                        <p className="truncate text-[0.65rem] text-muted-foreground leading-tight">
                          {level ? LEVEL_LABEL[level] : "Membro"}
                        </p>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="space-y-1">
                    <p className="text-xs font-bold text-foreground">{mainName}</p>
                    {subName ? <p className="text-[0.65rem] text-muted-foreground">{subName}</p> : null}
                    <div className="flex items-center gap-1.5 text-[0.65rem] font-mono text-emerald-400 font-bold pt-0.5">
                      <Clock className="h-3 w-3" /> Sessão Ativa: {formattedHuman}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => {
                      if (pathname.startsWith("/dev")) {
                        navigate({ to: "/dev/perfil" });
                      } else if (pathname.startsWith("/ceo")) {
                        navigate({ to: "/ceo/perfil" });
                      } else {
                        navigate({ to: "/perfil" });
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4 text-primary" /> Meu Perfil
                  </DropdownMenuItem>

                  {(isCeoUser || isDevUser) && (
                    <DropdownMenuItem
                      onClick={() => navigate({ to: "/ceo/dashboard" })}
                      className="cursor-pointer text-amber-300 focus:text-amber-200 focus:bg-amber-500/10 font-bold"
                    >
                      <Crown className="mr-2 h-4 w-4 text-amber-400" /> Painel CEO
                    </DropdownMenuItem>
                  )}

                  {isDevUser && (
                    <DropdownMenuItem
                      onClick={() => navigate({ to: "/dev" })}
                      className="cursor-pointer text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 font-bold"
                    >
                      <Terminal className="mr-2 h-4 w-4 text-rose-400" /> Painel Dev
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive font-medium cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 px-2.5 py-4 sm:px-6 lg:px-8 pb-24 md:pb-8 flex flex-col justify-between">
            <div className="w-full max-w-7xl mx-auto">{children}</div>

            {/* RODAPÉ DISCRETO COM CRÉDITOS DO DESENVOLVEDOR (BY MALACA - DISCORD: MALACA7) */}
            <footer className="py-6 mt-12 border-t border-border/40 text-center text-xs text-muted-foreground/80 space-y-1 w-full max-w-7xl mx-auto">
              <div className="flex items-center justify-center gap-1.5 flex-wrap font-medium">
                <span>{settings.factionName || "Twin Wheels"} &copy; {new Date().getFullYear()}</span>
                <span className="opacity-40">•</span>
                <span>Desenvolvido por</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("malaca7");
                    toast.success("Tag do Discord (malaca7) copiada com sucesso!");
                  }}
                  className="font-bold text-primary hover:underline inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 transition-all hover:bg-primary/20 cursor-pointer"
                  title="Clique para copiar a tag do Discord: malaca7"
                >
                  <span>malaca</span>
                  <span className="text-[10px] font-mono opacity-80">(malaca7)</span>
                </button>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* BALÃO FLUTUANTE DE MEMBROS ONLINE */}
      <FloatingOnlineMembersWidget />
      <MobileBottomNav />
      <ForceCachePurgeListener />

      {/* POPUP COMPACTO DE AUSÊNCIA POR INATIVIDADE */}
      {isAbsenceMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in-30 duration-200">
          <div className="max-w-xs w-full rounded-2xl border border-amber-500/30 bg-card/95 backdrop-blur-xl p-5 shadow-2xl space-y-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Moon className="h-5 w-5 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-foreground">Sessão Ausente</h4>
              <p className="text-[0.75rem] text-muted-foreground leading-snug">
                Sua sessão foi alternada para <strong>Ausente</strong> devido à inatividade.
              </p>
            </div>

            <button
              type="button"
              onClick={() => resumeSession()}
              className="w-full h-9 bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="h-3.5 w-3.5" /> Voltar ao Sistema
            </button>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
