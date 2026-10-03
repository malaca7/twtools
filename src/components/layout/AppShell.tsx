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
  Flame,
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
  Award,
  ShoppingBag,
  Coins,
  AlertTriangle,
  Store,
  Factory,
  Warehouse,
  Zap,
  Layers,
} from "lucide-react";
import { resolveMenuIcon } from "@/lib/menuIcons";
import {
  isUserDeveloper,
  DEFAULT_CEO_CONFIG,
  type CeoConfiguration,
  getDevThemeColorSync,
  getCeoThemeColorSync,
  getMemberThemeColorSync,
  DEV_CONFIG_EVENT,
} from "@/services/devService";
import {
  type PanelColor,
  getPanelColorStyle,
  resolveCategoryIcon,
  usePanelTheme,
} from "@/lib/panelTheme";
import { usePageTitle } from "@/hooks/usePageTitle";
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
import { getProxiedImageUrl } from "@/services/postimagesService";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { useDevMenuConfig } from "@/hooks/useDevMenuConfig";
import {
  useCeoMenuConfig,
  DEFAULT_CEO_MENU_ITEMS,
} from "@/hooks/useCeoMenuConfig";
import { LEVEL_LABEL, levelBadgeClass, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "./MobileBottomNav";
import { ScrollToTopButton } from "./ScrollToTopButton";
import { ForceCachePurgeListener } from "@/components/dev/ForceCachePurgeListener";
import { DevToolsMenu } from "@/components/dev/DevToolsMenu";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { SuspensionAlertBanner } from "@/components/warnings/SuspensionAlertBanner";

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
  { id: "produzir", title: "Produzir", url: "/producoes/produzir", icon: Factory, perm: "productions.view", defaultCat: "Produções", defaultOrder: 0 },
  { id: "materias-primas", title: "Matérias-Primas", url: "/producoes/materias-primas", icon: Layers, perm: "raw_materials.view", defaultCat: "Produções", defaultOrder: 1 },
  { id: "armazem", title: "Armazém", url: "/producoes/armazem", icon: Warehouse, perm: "warehouse.view", defaultCat: "Produções", defaultOrder: 2 },
  { id: "gestao-producao", title: "Gestão de Produção", url: "/producoes/gestao", icon: Sliders, perm: "production_management.view", defaultCat: "Produções", defaultOrder: 3 },
  { id: "vendas", title: "Vendas", url: "/vendas", icon: ShoppingCart, perm: "view_sales", defaultCat: "Produções", defaultOrder: 4 },
  { id: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, perm: "view_dashboard", defaultCat: "Gestão", defaultOrder: 5 },
  { id: "movimentacoes", title: "Movimentações", url: "/movimentacoes", icon: ArrowLeftRight, perm: "view_movements", defaultCat: "Gestão", defaultOrder: 6 },
  { id: "tickets", title: "Tickets / Ouvidoria", url: "/tickets", icon: LifeBuoy, perm: "view_tickets", defaultCat: "Gestão", defaultOrder: 7 },
  { id: "loja", title: "Loja Twin Wheels", url: "/loja", icon: ShoppingBag, perm: "view_shop", defaultCat: "Gestão", defaultOrder: 8 },
  { id: "estoque", title: "Controle de Estoque", url: "/controledeestoque", icon: Boxes, perm: "view_stock", defaultCat: "Gestão", defaultOrder: 9 },
  { id: "gestao-estoque", title: "Gestão de Estoque", url: "/gestao-estoque", icon: PackageCheck, perm: "view_stock_management", defaultCat: "Gestão", defaultOrder: 10 },
  { id: "membros", title: "Membros", url: "/membros", icon: Users, perm: "view_members", defaultCat: "Gestão", defaultOrder: 11 },
  { id: "hierarquia", title: "Hierarquia", url: "/hierarquia", icon: Workflow, perm: "view_hierarchy", defaultCat: "Gestão", defaultOrder: 12 },
  { id: "fundo-caixa", title: "Fundo de Caixa", url: "/fundo-caixa", icon: Landmark, perm: "view_cash_fund", defaultCat: "Gestão", defaultOrder: 13 },
  { id: "ausencias", title: "Ausências", url: "/ausencias", icon: CalendarOff, perm: "view_absences", defaultCat: "Gestão", defaultOrder: 14 },
  { id: "rankings", title: "Rankings", url: "/rankings", icon: Trophy, perm: "view_rankings", defaultCat: "Gestão", defaultOrder: 15 },
  { id: "desempenho", title: "Meu Desempenho", url: "/desempenho", icon: User, perm: "view_performance", defaultCat: "Gestão", defaultOrder: 16 },
  { id: "metas", title: "Metas", url: "/metas", icon: Target, perm: "view_goals", defaultCat: "Gestão", defaultOrder: 17 },
  { id: "avisos", title: "Enviar Avisos", url: "/avisos", icon: Megaphone, perm: "manage_announcements", defaultCat: "Gestão", defaultOrder: 18 },
  { id: "cargos", title: "Gerenciamento de Cargos", url: "/cargos", icon: ShieldCheck, perm: "manage_roles", defaultCat: "Administração", defaultOrder: 19 },
  { id: "permissoes", title: "Permissões", url: "/permissoes", icon: Settings, perm: "manage_permissions", defaultCat: "Administração", defaultOrder: 20 },
  { id: "atualizacoes", title: "Atualizações", url: "/atualizacoes", icon: Sparkles, perm: "view_patch_notes", defaultCat: "Administração", defaultOrder: 21 },
  { id: "advertencias", title: "Advertências", url: "/advertencias", icon: ShieldAlert, perm: "view_warnings", defaultCat: "Administração", defaultOrder: 21.5 },
  { id: "perfil", title: "Meu Perfil", url: "/perfil", icon: User, perm: "view_profile", defaultCat: "Gestão", defaultOrder: 22 },
  { id: "configuracoes", title: "Configurações", url: "/configuracoes", icon: Wrench, perm: "manage_platform_settings", defaultCat: "Administração", defaultOrder: 23 },
];

const URL_TO_PERMISSION_MAP: Record<string, Permission> = {
  "/dashboard": "view_dashboard",
  "/movimentacoes": "view_movements",
  "/vendas": "view_sales",
  "/producoes/produzir": "productions.view",
  "/producoes/materias-primas": "raw_materials.view",
  "/materias-primas": "raw_materials.view",
  "/producoes/armazem": "warehouse.view",
  "/producoes/gestao": "production_management.view",
  "/producoes/gestao-producao": "production_management.view",
  "/gestao-producao": "production_management.view",
  "/producoes": "productions.view",
  "/tickets": "view_tickets",
  "/loja": "view_shop",
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
  "/perfil/dados": "view_profile",
  "/perfil/aparencia": "edit_profile_appearance",
  "/perfil/advertencias": "view_profile_warnings",
  "/perfil/disciplinar": "view_profile_warnings",
  "/configuracoes": "manage_platform_settings",
  "/dev/notificacoes": "view_dev_notifications",
  "/dev/xp-insignias": "manage_dev_gamification",
  "/dev/gestaoloja": "view_dev_shop",
  "/dev/loja": "view_dev_shop",
  "/dev/coins": "view_dev_coins",
  "/dev/gestao-estoque": "view_stock_management",
  "/dev/producoes/produzir": "productions.view",
  "/dev/producoes/materias-primas": "raw_materials.view",
  "/dev/producoes/armazem": "warehouse.view",
  "/dev/producoes/gestao": "production_management.view",
  "/dev/producoes/gestao-producao": "production_management.view",
  "/dev/producoes": "productions.view",
  "/ceo": "view_ceo",
  "/ceo/dashboard": "view_ceo",
  "/ceo/executivo": "view_ceo",
  "/ceo/bot": "manage_ceo_bot",
  "/ceo/webhooks": "manage_ceo_webhooks",
  "/ceo/financas": "view_ceo_financials",
  "/ceo/financeiro": "view_ceo_financials",
  "/ceo/notificacoes": "view_ceo_notifications",
  "/ceo/ajustes-estoque": "view_ceo_stock_adjustments",
  "/ceo/membros": "view_members",
  "/ceo/cargos": "manage_roles",
  "/ceo/vendas": "view_sales",
  "/ceo/producoes/produzir": "productions.view",
  "/ceo/producoes/materias-primas": "raw_materials.view",
  "/ceo/producoes/armazem": "warehouse.view",
  "/ceo/producoes/gestao": "production_management.view",
  "/ceo/producoes/gestao-producao": "production_management.view",
  "/ceo/producoes": "productions.view",
  "/ceo/armazem": "warehouse.view",
  "/ceo/tags": "view_ceo_tag_permissions",
  "/ceo/permissoes-tags": "view_ceo_tag_permissions",
  "/ceo/logs": "view_audit",
  "/dev/tags": "view_dev_tags",
  "/dev/gerenciar-tags": "view_dev_tags",
  "/dev/ceo": "view_ceo",
  "/dev/ceo/dashboard": "view_ceo",
  "/dev/ceo/executivo": "view_ceo",
  "/dev/ceo/bot": "manage_ceo_bot",
  "/dev/ceo/webhooks": "manage_ceo_webhooks",
  "/dev/ceo/financas": "view_ceo_financials",
  "/dev/ceo/ajustes-estoque": "view_ceo_stock_adjustments",
  "/dev/ceo/notificacoes": "view_ceo_notifications",
  "/dev/ceo/tags": "view_ceo_tag_permissions",
  "/dev/ceo/advertencias": "view_ceo_warnings",
  "/dev/ajustes-estoque": "view_ceo_stock_adjustments",
  "/dev/webhooks": "manage_ceo_webhooks",
  "/dev/financas": "view_ceo_financials",
  "/advertencias": "view_warnings",
  "/ceo/advertencias": "view_ceo_warnings",
  "/dev/advertencias": "view_dev_warnings",
  "/dev/bot": "manage_dev_bot",
  "/dev/patch-notes": "manage_dev_patch_notes",
  "/dev/desempenho": "manage_dev_performance",
  "/dev/permissoes": "manage_dev_permissions",
  "/dev/configuracao": "manage_dev_config",
  "/dev/menu-lateral": "manage_dev_menu",
  "/dev/estoque": "view_dev_hub",
};

const DEV_MODULE_NAV_ITEMS: MasterNavItem[] = [
  { id: "dev-bot", title: "Bot", url: "/dev/bot", icon: Bot, defaultCat: "DEV", defaultOrder: 0 },
  { id: "dev-estoque", title: "Estoque", url: "/dev/estoque", icon: Boxes, defaultCat: "DEV", defaultOrder: 2 },
  { id: "dev-patch-notes", title: "Patch Notes & Releases", url: "/dev/patch-notes", icon: Sparkles, defaultCat: "DEV", defaultOrder: 3 },
  { id: "dev-desempenho", title: "Gestão Desempenho", url: "/dev/desempenho", icon: TrendingUp, defaultCat: "DEV", defaultOrder: 4 },
  { id: "dev-xp-insignias", title: "Xp e insígnias", url: "/dev/xp-insignias", icon: Award, defaultCat: "DEV", defaultOrder: 5 },
  { id: "dev-loja", title: "Gestão da Loja", url: "/dev/gestaoloja", icon: ShoppingBag, defaultCat: "DEV", defaultOrder: 6 },
  { id: "dev-loja-oficial", title: "Loja", url: "/dev/loja", icon: Store, defaultCat: "DEV", defaultOrder: 6.5 },
  { id: "dev-coins", title: "Gestão de Coins", url: "/dev/coins", icon: Coins, defaultCat: "DEV", defaultOrder: 7 },
  { id: "dev-permissoes", title: "Permissões Tag Dev", url: "/dev/permissoes", icon: KeyRound, defaultCat: "DEV", defaultOrder: 8 },
  { id: "dev-configuracao", title: "Configurações Dev", url: "/dev/configuracao", icon: Code2, defaultCat: "DEV", defaultOrder: 9 },
  { id: "dev-menu-lateral", title: "Menu Lateral Dev", url: "/dev/menu-lateral", icon: Sliders, defaultCat: "DEV", defaultOrder: 10 },
  { id: "dev-notificacoes", title: "Central de Notificações", url: "/dev/notificacoes", icon: BellRing, defaultCat: "DEV", defaultOrder: 11 },
];

const CEO_MODULE_NAV_ITEMS: MasterNavItem[] = [
  { id: "ceo-executivo", title: "Visão Executiva & Métricas", url: "/ceo/executivo", icon: LayoutDashboard, defaultCat: "CEO", defaultOrder: 0 },
  { id: "ceo-bot", title: "Gerenciar Bot", url: "/ceo/bot", icon: Bot, defaultCat: "CEO", defaultOrder: 1 },
  { id: "ceo-webhooks", title: "WebHook Discord", url: "/ceo/webhooks", icon: Webhook, defaultCat: "CEO", defaultOrder: 2 },
  { id: "ceo-financas", title: "Fundo de Caixa & Finanças", url: "/ceo/financas", icon: Landmark, defaultCat: "CEO", defaultOrder: 3 },
  { id: "ceo-ajustes-estoque", title: "Ajustes de Estoque", url: "/ceo/ajustes-estoque", icon: Sliders, defaultCat: "CEO", defaultOrder: 4 },
  { id: "ceo-notificacoes", title: "Central de Notificações", url: "/ceo/notificacoes", icon: BellRing, defaultCat: "CEO", defaultOrder: 5 },
  { id: "ceo-tags", title: "Gerenciar Tags", url: "/ceo/tags", icon: Tags, defaultCat: "CEO", defaultOrder: 6 },
];

function DynamicSidebarNavigation() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { hasPermission, user, profile, level, isDevMode, isCeoMode, setPanelMode, isCeoUser, isDevUser } = useAuth();
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

  const { devStyle, ceoStyle, memberStyle, DevIcon, CeoIcon, MemberIcon } = usePanelTheme();

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
      if (targetUrl === "/ceo" && (pathname === "/ceo" || pathname === "/ceo/")) return true;
      if (pathname === targetUrl) return true;
      if (targetUrl !== "/dev" && targetUrl !== "/ceo" && targetUrl !== "/" && pathname.startsWith(targetUrl + "/")) return true;

      // Equivalência entre rotas /dev/ceo/* e /ceo/* ou /dev/tags e /ceo/tags
      const cleanPath = pathname.replace(/^\/dev/, "");
      const cleanTarget = targetUrl.replace(/^\/dev/, "");
      if (cleanPath && cleanTarget && cleanPath === cleanTarget) return true;
      if ((cleanPath === "/ceo/tags" || cleanPath === "/tags") && (cleanTarget === "/ceo/tags" || cleanTarget === "/tags")) return true;
      if ((cleanPath === "/ceo" || cleanPath === "/ceo/dashboard") && (cleanTarget === "/ceo" || cleanTarget === "/ceo/dashboard")) return true;

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

  // Sincroniza o modo de painel com base na rota acessada
  useEffect(() => {
    if (pathname.startsWith("/dev")) {
      if (isDevUser && !isDevMode) setPanelMode("dev");
    } else if (pathname.startsWith("/ceo")) {
      if ((isCeoUser || isDevUser || hasPermission("view_ceo")) && !isCeoMode) {
        setPanelMode("ceo");
      }
    } else {
      // Qualquer rota regular de membro (/dashboard, /estoque, /membros, etc.)
      if (isDevMode || isCeoMode) {
        setPanelMode("member");
      }
    }
  }, [pathname, isDevUser, isCeoUser, isDevMode, isCeoMode, setPanelMode, hasPermission]);

  const grouped = useMemo(() => {
    // 1. Configuração do menu da plataforma (Membros / Geral)
    const validConfigItems = menuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
    const deletedSet = new Set<string>(
      Array.isArray(menuConfig?.deletedItemIds) ? menuConfig.deletedItemIds : []
    );
    const rawCategories = menuConfig?.categories?.length
      ? menuConfig.categories
      : ["Produções", "Gestão", "Administração"];
    const categoryOrder = rawCategories
      .filter((c) => c !== "Operação")
      .includes("Produções")
        ? rawCategories.filter((c) => c !== "Operação")
        : ["Produções", ...rawCategories.filter((c) => c !== "Operação")];

    const masterItemsMap = new Map<string, MasterNavItem>();
    MASTER_NAV_ITEMS.forEach((m) => {
      masterItemsMap.set(m.id, m);
      masterItemsMap.set(m.url, m);
    });

    let allPlatformItems: MasterNavItem[] = [];

    if (validConfigItems.length > 0) {
      // Quando existe configuração salva pelo usuário, ela é a fonte de verdade absoluta!
      const processedIds = new Set<string>();

      allPlatformItems = validConfigItems
        .filter((c) => !deletedSet.has(c.id) && !deletedSet.has(c.url))
        .filter((c) => c.id !== "chat" && c.id !== "logs" && c.url !== "/chat" && c.url !== "/logs")
        .map((c, idx) => {
          processedIds.add(c.id);
          const master = masterItemsMap.get(c.id) || masterItemsMap.get(c.url);
          const cleanPath = (c.url || "").split("?")[0].toLowerCase();
          const autoPerm = master?.perm || URL_TO_PERMISSION_MAP[cleanPath];
          const icon = c.iconName
            ? (resolveMenuIcon(c.iconName, c.url) as typeof LayoutDashboard)
            : (master?.icon || (resolveMenuIcon(undefined, c.url) as typeof LayoutDashboard));

          // Garante que o item pertença a uma das categorias oficiais configuradas
          let cat = c.category;
          if (cat === "Operação") {
            cat = c.id === "vendas" ? "Produções" : "Gestão";
          }
          if (!cat || !categoryOrder.includes(cat)) {
            cat = categoryOrder[0] || "Gestão";
          }

          return {
            id: c.id,
            title: c.title || master?.title || c.id,
            url: c.url,
            icon,
            perm: autoPerm,
            category: cat,
            defaultCat: cat,
            order: typeof c.order === "number" ? c.order : idx,
            visible: c.visible !== false,
            isCustom: Boolean(c.isCustom || !master),
          };
        });

      // Anexa apenas módulos essenciais da plataforma que não estejam na lista e NÃO foram excluídos pelo usuário
      MASTER_NAV_ITEMS.forEach((m, idx) => {
        if (!processedIds.has(m.id) && !deletedSet.has(m.id) && !deletedSet.has(m.url)) {
          if (m.id === "chat" || m.id === "logs" || m.url === "/chat" || m.url === "/logs") return;
          let targetCat = m.defaultCat;
          if (targetCat === "Operação") {
            targetCat = m.id === "vendas" ? "Produções" : "Gestão";
          }
          if (!categoryOrder.includes(targetCat)) {
            targetCat = categoryOrder[0] || "Gestão";
          }
          allPlatformItems.push({
            ...m,
            category: targetCat,
            defaultCat: targetCat,
            order: allPlatformItems.length + idx,
            visible: true,
          });
        }
      });
    } else {
      // Fallback para primeira inicialização antes de qualquer configuração salva
      allPlatformItems = MASTER_NAV_ITEMS
        .filter((m) => !deletedSet.has(m.id) && !deletedSet.has(m.url))
        .filter((m) => m.id !== "chat" && m.id !== "logs" && m.url !== "/chat" && m.url !== "/logs")
        .map((m, idx) => {
          let cat = m.defaultCat;
          if (cat === "Operação") {
            cat = m.id === "vendas" ? "Produções" : "Gestão";
          }
          if (!categoryOrder.includes(cat)) {
            cat = categoryOrder[0] || "Gestão";
          }
          return {
            ...m,
            category: cat,
            defaultCat: cat,
            order: m.defaultOrder ?? idx,
            visible: true,
          };
        });
    }

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

    const canSeeCeo = Boolean(isCeoUser || isDevUser || hasPermission("view_ceo"));

    const visibleCeo = canSeeCeo
      ? allCeoItems.filter((item) => {
          if (!item.visible) return false;
          // Remove bypass: relies on granular hasPermission checks below

          if (
            (item.id === "ceo-dashboard" || item.id === "ceo-executivo" || item.url === "/ceo" || item.url === "/ceo/dashboard") &&
            !hasPermission("view_ceo", "ceo") &&
            !hasPermission("view_ceo_dashboard", "ceo")
          ) {
            return false;
          }
          if (item.id === "ceo-bot" && (!hasPermission("manage_ceo_bot", "ceo") || ceoConfig.allowManageBot === false)) return false;
          if (item.id === "ceo-webhooks" && (!hasPermission("manage_ceo_webhooks", "ceo") || ceoConfig.allowWebhooks === false)) return false;
          if (item.id === "ceo-financas" && (!hasPermission("view_ceo_financials", "ceo") || ceoConfig.allowFinancials === false)) return false;
          if (item.id === "ceo-ajustes-estoque" && !hasPermission("view_ceo_stock_adjustments", "ceo")) return false;
          if (item.id === "ceo-notificacoes" && !hasPermission("view_ceo_notifications", "ceo")) return false;
          if (item.id === "ceo-tags" && !hasPermission("view_ceo_tag_permissions", "ceo")) return false;
          const cleanUrl = (item.url || "").split("?")[0].toLowerCase();
          const reqPerm = URL_TO_PERMISSION_MAP[cleanUrl];
          if (reqPerm && !hasPermission(reqPerm, "ceo")) return false;
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
            c.toLowerCase() === "ferramentas dev" || c.toLowerCase() === "ferramenta dev"
              ? (rawDevCats.includes("DEV") ? "DEV" : rawDevCats[0] || "DEV")
              : c
          )
        )
      );

      const defaultDevIds = new Set(DEV_MODULE_NAV_ITEMS.map((d) => d.id));
      const customizedDev = DEV_MODULE_NAV_ITEMS.map((item, defaultIdx) => {
        const cfg = devConfigMap.get(item.id) || devConfigMap.get(item.url);
        let cat = cfg?.category || item.defaultCat;
        if (!cat || !devCategoryOrder.includes(cat)) {
          cat = devCategoryOrder[0] || "DEV";
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
        .filter((c) => !defaultDevIds.has(c.id) && c.id !== "dev-hub" && c.url !== "/dev")
        .map((c, idx) => {
          let itemCat = c.category || devCategoryOrder[0] || "DEV";
          if (!devCategoryOrder.includes(itemCat)) {
            itemCat = devCategoryOrder[0] || "DEV";
          }
          return {
            id: c.id,
            title: c.title,
            url: c.url,
            icon: resolveMenuIcon(c.iconName, c.url) as typeof LayoutDashboard,
            category: itemCat,
            defaultCat: itemCat,
            defaultOrder: typeof c.order === "number" ? c.order : 50 + idx,
            order: typeof c.order === "number" ? c.order : 50 + idx,
            visible: c.visible !== false,
            isCustom: true,
          };
        });

      const allDevItems = [...customizedDev, ...customDevItems];
      const visibleDev = allDevItems.filter((item) => {
        if (!item.visible) return false;
        const cleanUrl = (item.url || "").split("?")[0].toLowerCase();
        const reqPerm = URL_TO_PERMISSION_MAP[cleanUrl];
        if (reqPerm && !hasPermission(reqPerm, "dev")) return false;
        return true;
      });
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
        .filter((item) => item.visible && (!item.perm || hasPermission(item.perm, "dev")))
        .map((item) => {
          let devUrl = item.url;
          if (item.id === "desempenho") {
            devUrl = "/dev/meu-desempenho";
          } else if (item.id === "permissoes") {
            devUrl = "/dev/permissoes-gerais";
          } else if (item.id === "estoque" || item.url === "/controledeestoque" || item.url === "/estoque") {
            devUrl = "/dev/controledeestoque";
          } else if (item.id === "gestao-estoque" || item.url === "/gestao-estoque") {
            devUrl = "/dev/gestao-estoque";
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

      // Se o membro com Tag Dev estiver no painel dev, exibe as categorias e menus do Painel CEO para acessar como dev com todas as permissões dev!
      const devCeoGroups = ceoGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => {
          let devUrl = item.url;
          if (item.id === "ceo-tags" || item.id === "tags" || item.url === "/ceo/tags") {
            devUrl = "/dev/tags";
          } else if (item.id === "ceo-bot" || item.url === "/ceo/bot") {
            devUrl = "/dev/bot";
          } else if (item.id === "ceo-notificacoes" || item.url === "/ceo/notificacoes") {
            devUrl = "/dev/notificacoes";
          } else if (item.id === "ceo-ajustes-estoque" || item.url === "/ceo/ajustes-estoque") {
            devUrl = "/dev/ajustes-estoque";
          } else if (item.id === "ceo-webhooks" || item.url === "/ceo/webhooks") {
            devUrl = "/dev/webhooks";
          } else if (item.id === "ceo-financas" || item.url === "/ceo/financas") {
            devUrl = "/dev/financas";
          } else if (item.id === "ceo-advertencias" || item.url === "/ceo/advertencias") {
            devUrl = "/dev/advertencias";
          } else if (item.id === "ceo-dashboard" || item.url === "/ceo" || item.url === "/ceo/dashboard") {
            devUrl = "/dev/ceo";
          } else if (devUrl.startsWith("/ceo") && !devUrl.startsWith("/dev")) {
            devUrl = `/dev${devUrl}`;
          }
          return {
            ...item,
            url: devUrl,
          };
        }),
      }));

      return [...devGroups, ...(devCeoGroups.length > 0 ? devCeoGroups : []), ...platformGroups];
    }

    // =========================================================================
    // MODO 2: CEO (Apenas membros com tag CEO em modo CEO)
    // =========================================================================
    if ((isCeoUser || isDevUser || hasPermission("view_ceo")) && isCeoMode) {
      // A) Ferramentas CEO (ceoGroups)
      // B) Agrupa menus da plataforma com URLs prefixadas como /ceo/* (apenas o que o CEO tem permissão)
      const visibleCeoMaster = allPlatformItems
        .filter((item) => item.id !== "dashboard" && item.url !== "/dashboard")
        .filter((item) => item.visible && (isCeoUser || isDevUser || !item.perm || hasPermission(item.perm, "ceo")))
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
      if (requiredPerm && !hasPermission(requiredPerm, "member")) {
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

        let activeStyle = isDevCategory ? devStyle : isCeoCategory ? ceoStyle : memberStyle;
        let defaultFallbackIcon = FolderTree;
        let savedIconName: string | null | undefined = null;

        if (isDevCategory) {
          defaultFallbackIcon = DevIcon;
          savedIconName = devMenuConfig?.categoryIcons?.[category];
        } else if (isCeoCategory) {
          defaultFallbackIcon = CeoIcon;
          savedIconName = ceoMenuConfig?.categoryIcons?.[category];
        } else {
          // Categorias padrão da plataforma (Operação, Gestão, Administração, etc.)
          savedIconName = menuConfig?.categoryIcons?.[category];
          if (category === "Operação") {
            defaultFallbackIcon = Activity;
          } else if (category === "Gestão") {
            defaultFallbackIcon = Shield;
          } else if (category === "Administração") {
            defaultFallbackIcon = Sliders;
          } else {
            defaultFallbackIcon = MemberIcon;
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
                      "flex items-center justify-center h-5 w-5 rounded-md shrink-0 transition-colors border",
                      activeStyle.bgSubtleClass,
                      activeStyle.iconClass || activeStyle.textClass,
                      activeStyle.borderSubtleClass
                    )}
                  >
                    <CatIcon className="h-3 w-3 shrink-0" />
                  </span>
                  <span
                    className={cn(
                      "truncate font-bold tracking-wider",
                      activeStyle.textClass
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
                                "text-sidebar-foreground/85 hover:text-foreground",
                                activeStyle.itemHoverClass || "hover:bg-sidebar-accent/70"
                              )}
                            >
                              <ItemIcon
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-colors text-muted-foreground",
                                  activeStyle.itemIconHoverClass || "group-hover/menuitem:text-foreground"
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
                                  ? cn(activeStyle.activeItemClass, "shadow-xs font-semibold")
                                  : cn(
                                      "text-sidebar-foreground/80 hover:text-foreground",
                                      activeStyle.itemHoverClass || "hover:bg-sidebar-accent/60"
                                    )
                              )}
                            >
                              <ItemIcon
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-colors",
                                  active
                                    ? (activeStyle.iconClass || activeStyle.textClass)
                                    : cn("text-muted-foreground/75", activeStyle.itemIconHoverClass || "group-hover/menuitem:text-foreground")
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
  const { profile, level, signOut, user, isCeoUser, isDevUser, setPanelMode, hasPermission } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  // Permissões e cálculo de acesso a múltiplos painéis
  const canAccessCeo = isCeoUser || isDevUser || hasPermission("view_ceo");
  const canAccessDev = isDevUser;
  const hasMultiplePanels = canAccessCeo || canAccessDev;

  const { devStyle, ceoStyle, memberStyle, DevIcon, CeoIcon, MemberIcon } = usePanelTheme();

  const avatarUrl = profile?.avatar_url || profile?.discord_avatar_url;
  const mainName = profile?.nickname || profile?.nome || "Membro";
  const subName = profile?.nickname ? profile.nome : null;
  const initials = mainName.slice(0, 2).toUpperCase();
  const { settings } = usePlatformSettings();
  const { pageTitle, tabTitle } = usePageTitle();

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

        <div className="flex min-w-0 flex-1 flex-col min-h-screen platform-filters">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-1.5 sm:gap-4 border-b border-border/70 bg-background/95 backdrop-blur-xl px-2.5 sm:px-6 shadow-sm">
            <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
              <SidebarTrigger />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gradient-brand font-display font-extrabold text-xs sm:text-base tracking-[0.12em] uppercase truncate drop-shadow-xs max-w-[85px] xs:max-w-[120px] sm:max-w-none">
                  {settings.factionName || "Twin Wheels"}
                </span>
                {settings.slogan && (
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hidden xl:inline-block">
                    · {settings.slogan}
                  </span>
                )}
              </div>

              {/* TÍTULO ESPECÍFICO DA PÁGINA & ABA NA BARRA DE TOPO */}
              {pageTitle && (
                <div className="hidden lg:flex items-center gap-1.5 min-w-0 pl-2 sm:pl-3 border-l border-border/60 text-xs">
                  <span className="font-extrabold text-foreground truncate max-w-[160px] xl:max-w-[220px]">
                    {pageTitle}
                  </span>
                  {tabTitle && (
                    <>
                      <span className="text-muted-foreground/40 font-bold">•</span>
                      <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md truncate max-w-[140px]">
                        {tabTitle}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* SELETOR DE PAINÉIS (MEMBRO / CEO / DEV) NA BARRA DE TOPO */}
              {/* Só exibe se o membro tiver acesso a mais de um painel, e apenas os painéis permitidos */}
              {hasMultiplePanels && (
                <div className="flex items-center p-0.5 sm:p-1 bg-secondary/50 border border-border/80 rounded-xl shadow-xs gap-0.5 sm:gap-1 backdrop-blur-md">
                  {/* Botão Painel Membro */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={settings?.startPageUser || "/dashboard"}
                        onClick={() => setPanelMode("member")}
                        className={cn(
                          "flex items-center gap-1 sm:gap-1.5 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                          !pathname.startsWith("/dev") && !pathname.startsWith("/ceo")
                            ? cn(memberStyle.bgSolidClass, "shadow-xs ring-1", memberStyle.ringClass, "font-bold")
                            : cn(memberStyle.textMutedClass, "hover:bg-secondary/60 hover:text-foreground")
                        )}
                        aria-label="Painel Membro"
                      >
                        <MemberIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="hidden md:inline">Membro</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className={cn("text-[11px] font-bold", memberStyle.textClass)}>
                      Painel Membro
                    </TooltipContent>
                  </Tooltip>

                  {/* Botão Painel CEO */}
                  {canAccessCeo && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to={settings?.startPageCeo || "/ceo/dashboard"}
                          onClick={() => setPanelMode("ceo")}
                          className={cn(
                            "flex items-center gap-1 sm:gap-1.5 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                            pathname.startsWith("/ceo")
                              ? cn(ceoStyle.bgSolidClass, "shadow-xs ring-1", ceoStyle.ringClass, "font-bold")
                              : cn(ceoStyle.textMutedClass, "hover:bg-secondary/60 hover:text-foreground")
                          )}
                          aria-label="Painel CEO"
                        >
                          <CeoIcon className="h-3.5 w-3.5 shrink-0" />
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
                          to={settings?.startPageDev || "/dev"}
                          onClick={() => setPanelMode("dev")}
                          className={cn(
                            "flex items-center gap-1 sm:gap-1.5 px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
                            pathname.startsWith("/dev")
                              ? cn(devStyle.bgSolidClass, "shadow-xs ring-1", devStyle.ringClass, "font-bold")
                              : cn(devStyle.textMutedClass, "hover:bg-secondary/60 hover:text-foreground")
                          )}
                          aria-label="Painel Dev Tools"
                        >
                          <DevIcon className="h-3.5 w-3.5 shrink-0" />
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

            {/* TOP HEADER: GAMIFICATION BADGES + NOTIFICATION CENTER + USER AVATAR */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* BADGES DE GAMIFICAÇÃO: XP & TW COINS */}
              {user && (
                <div className="flex items-center gap-1 sm:gap-1.5 mr-0.5 sm:mr-1">
                  {/* BADGE DE XP */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/desempenho"
                        className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 font-mono text-xs font-bold transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Zap className="h-3.5 w-3.5 text-violet-400 fill-violet-400/20 shrink-0" />
                        <span className="hidden xs:inline text-[11px] font-bold text-violet-200">
                          {Number(profile?.xp || 0).toLocaleString("pt-BR")}{" "}
                          <span className="text-[10px] text-violet-400/80 font-normal">XP</span>
                        </span>
                        <span className="xs:hidden text-[10px] font-bold text-violet-200">
                          {Number(profile?.xp || 0) >= 1000
                            ? `${(Number(profile?.xp || 0) / 1000).toFixed(1)}k`
                            : Number(profile?.xp || 0)}
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs space-y-0.5 bg-card/95 border-violet-500/30">
                      <p className="font-bold text-violet-300 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Pontos de Experiência (XP)
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Nível {Number(profile?.gamification_level || 1)} · {Number(profile?.xp || 0).toLocaleString("pt-BR")} XP acumulados. Clique para abrir Meu Desempenho.
                      </p>
                    </TooltipContent>
                  </Tooltip>

                  {/* BADGE DE TW COINS */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/loja"
                        className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        <Coins className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span className="hidden xs:inline text-[11px] font-bold text-amber-200">
                          {Number(profile?.tw_coins || 0).toLocaleString("pt-BR")}{" "}
                          <span className="text-[10px] text-amber-400/80 font-normal">Coins</span>
                        </span>
                        <span className="xs:hidden text-[10px] font-bold text-amber-200">
                          {Number(profile?.tw_coins || 0) >= 1000
                            ? `${(Number(profile?.tw_coins || 0) / 1000).toFixed(1)}k`
                            : Number(profile?.tw_coins || 0)}
                        </span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs space-y-0.5 bg-card/95 border-amber-500/30">
                      <p className="font-bold text-amber-300 flex items-center gap-1">
                        <Coins className="h-3 w-3" /> Saldo de TW Coins
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {Number(profile?.tw_coins || 0).toLocaleString("pt-BR")} moedas disponíveis. Clique para abrir a Loja Oficial.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Indicador de Manutenção Ativa */}
              {(settings.maintenanceActive || settings.showSystemStatusNotice) && (
                <div className="flex items-center">
                  <Badge
                    variant="outline"
                    className="border-amber-500/70 bg-amber-500/15 text-amber-300 font-mono text-[10px] font-bold gap-1.5 animate-pulse px-2 sm:px-2.5 py-1 shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <span className="hidden sm:inline">MODO DE MANUTENÇÃO ATIVO</span>
                    <span className="sm:hidden">MANUTENÇÃO</span>
                  </Badge>
                </div>
              )}

              {/* DEV TOOLS (VISÍVEL APENAS PARA DEVS) */}
              <DevToolsMenu />

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
                      {avatarUrl && <AvatarImage src={getProxiedImageUrl(avatarUrl)} alt={mainName} />}
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
                      onClick={() => navigate({ to: settings?.startPageCeo || "/ceo/dashboard" })}
                      className={cn("cursor-pointer font-bold", ceoStyle.textClass, ceoStyle.itemHoverClass)}
                    >
                      <CeoIcon className={cn("mr-2 h-4 w-4", ceoStyle.iconClass)} /> Painel CEO
                    </DropdownMenuItem>
                  )}

                  {isDevUser && (
                    <DropdownMenuItem
                      onClick={() => navigate({ to: settings?.startPageDev || "/dev" })}
                      className={cn("cursor-pointer font-bold", devStyle.textClass, devStyle.itemHoverClass)}
                    >
                      <DevIcon className={cn("mr-2 h-4 w-4", devStyle.iconClass)} /> Painel Dev
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

          <main className="flex-1 px-2.5 py-4 sm:px-6 lg:px-8 pb-28 md:pb-8 flex flex-col justify-between">
            {settings.showSystemStatusNotice && settings.systemStatusNotice && (
              <div className="w-full max-w-7xl mx-auto mb-4">
                <div
                  className={cn(
                    "p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-xs transition-all",
                    settings.systemStatusType === "destructive"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                      : settings.systemStatusType === "info"
                      ? "bg-sky-500/10 border-sky-500/30 text-sky-200"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertTriangle
                      className={cn(
                        "w-4 h-4 shrink-0",
                        settings.systemStatusType === "destructive"
                          ? "text-rose-400"
                          : settings.systemStatusType === "info"
                          ? "text-sky-400"
                          : "text-amber-400"
                      )}
                    />
                    <span className="font-semibold leading-relaxed truncate">{settings.systemStatusNotice}</span>
                  </div>
                  {settings.cityRpName && (
                    <span className="hidden sm:inline-block font-mono text-[10px] px-2 py-0.5 rounded-full bg-background/50 border border-current opacity-80 shrink-0">
                      {settings.cityRpName}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="w-full max-w-7xl mx-auto">
              <SuspensionAlertBanner />
              {children}
            </div>

            {/* RODAPÉ DINÂMICO E TOTALMENTE PERSONALIZÁVEL */}
            <footer className="py-6 mt-12 border-t border-border/40 text-center text-xs text-muted-foreground/80 space-y-1.5 w-full max-w-7xl mx-auto">
              <div className="flex items-center justify-center gap-1.5 flex-wrap font-medium">
                <span>
                  {settings.footerFactionText || settings.factionName || "Twin Wheels"}
                  {settings.footerShowYear !== false && (
                    <> &copy; {(!settings.footerYear || settings.footerYear === "Automático") ? new Date().getFullYear() : settings.footerYear}</>
                  )}
                </span>

                {settings.footerCopyrightText && (
                  <>
                    <span className="text-foreground/60 mx-1 font-bold">{settings.footerDividerSymbol || "•"}</span>
                    <span>{settings.footerCopyrightText}</span>
                  </>
                )}

                {settings.footerShowDeveloperCredits !== false && (
                  <>
                    <span className="text-foreground/60 mx-1 font-bold">{settings.footerDividerSymbol || "•"}</span>
                    <span>{settings.footerDeveloperRole || "Desenvolvido por"}</span>
                    {settings.footerShowDiscordCopy !== false && (settings.footerDeveloperDiscord || "malaca7") ? (
                      <button
                        type="button"
                        onClick={() => {
                          const tag = settings.footerDeveloperDiscord || "malaca7";
                          navigator.clipboard.writeText(tag);
                          toast.success(`Tag do Discord (${tag}) copiada com sucesso!`);
                        }}
                        className="font-bold text-primary hover:underline inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 transition-all hover:bg-primary/20 cursor-pointer"
                        title={`Clique para copiar a tag do Discord: ${settings.footerDeveloperDiscord || "malaca7"}`}
                      >
                        <span>{settings.footerDeveloperName || "malaca"}</span>
                        <span className="text-[10px] font-mono opacity-80">
                          ({settings.footerDeveloperDiscord || "malaca7"})
                        </span>
                      </button>
                    ) : (
                      <span className="font-bold text-primary">
                        {settings.footerDeveloperName || "malaca"}
                      </span>
                    )}
                  </>
                )}

                {settings.footerShowVersion !== false && (settings.systemVersion || "v2.5.0") && (
                  <>
                    <span className="text-foreground/60 mx-1 font-bold">{settings.footerDividerSymbol || "•"}</span>
                    <span className="font-mono text-[10px] bg-secondary/60 px-1.5 py-0.5 rounded border border-border/50 text-foreground/80">
                      {settings.systemVersion || "v2.5.0"}
                    </span>
                  </>
                )}

                {settings.footerShowSupportLink !== false && settings.supportDiscordUrl && (
                  <>
                    <span className="text-foreground/60 mx-1 font-bold">{settings.footerDividerSymbol || "•"}</span>
                    <a
                      href={settings.supportDiscordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Suporte Discord
                    </a>
                  </>
                )}
              </div>

              {settings.footerCustomNote && (
                <p className="text-[11px] text-muted-foreground/60 italic font-mono">
                  {settings.footerCustomNote}
                </p>
              )}
            </footer>
          </main>
        </div>
      </div>

      <MobileBottomNav />
      <ForceCachePurgeListener />
      <ScrollToTopButton />
    </SidebarProvider>
  );
}
