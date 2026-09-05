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
  ExternalLink,
} from "lucide-react";
import { resolveMenuIcon } from "@/lib/menuIcons";
import { isUserDeveloper } from "@/services/devService";
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
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { usePresence } from "@/hooks/usePresence";
import { useOnlineTimer } from "@/hooks/useOnlineTimer";
import { useMembers } from "@/hooks/useData";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { useDevMenuConfig } from "@/hooks/useDevMenuConfig";
import { LEVEL_LABEL, levelBadgeClass, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { FloatingPresenceWidget } from "./FloatingPresenceWidget";
import { ForceCachePurgeListener } from "@/components/dev/ForceCachePurgeListener";

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
  { id: "chat", title: "Chat", url: "/chat", icon: MessageSquare, perm: "view_chat", defaultCat: "Operação", defaultOrder: 3 },
  { id: "tickets", title: "Tickets / Ouvidoria", url: "/tickets", icon: LifeBuoy, perm: "view_tickets", defaultCat: "Operação", defaultOrder: 4 },
  { id: "estoque", title: "Controle de Estoque", url: "/estoque", icon: Boxes, perm: "view_stock", defaultCat: "Gestão", defaultOrder: 5 },
  { id: "membros", title: "Membros", url: "/membros", icon: Users, perm: "view_members", defaultCat: "Gestão", defaultOrder: 6 },
  { id: "hierarquia", title: "Hierarquia", url: "/hierarquia", icon: Workflow, perm: "view_hierarchy", defaultCat: "Gestão", defaultOrder: 7 },
  { id: "fundo-caixa", title: "Fundo de Caixa", url: "/fundo-caixa", icon: Landmark, perm: "view_cash_fund", defaultCat: "Gestão", defaultOrder: 8 },
  { id: "ausencias", title: "Ausências", url: "/ausencias", icon: CalendarOff, perm: "view_absences", defaultCat: "Gestão", defaultOrder: 9 },
  { id: "rankings", title: "Rankings", url: "/rankings", icon: Trophy, perm: "view_rankings", defaultCat: "Gestão", defaultOrder: 10 },
  { id: "desempenho", title: "Meu Desempenho", url: "/desempenho", icon: User, perm: "view_performance", defaultCat: "Gestão", defaultOrder: 11 },
  { id: "metas", title: "Metas", url: "/metas", icon: Target, perm: "view_goals", defaultCat: "Gestão", defaultOrder: 12 },
  { id: "avisos", title: "Enviar Avisos", url: "/avisos", icon: Megaphone, perm: "manage_announcements", defaultCat: "Gestão", defaultOrder: 13 },
  { id: "cargos", title: "Gerenciamento de Cargos", url: "/cargos", icon: ShieldCheck, perm: "manage_roles", defaultCat: "Administração", defaultOrder: 14 },
  { id: "permissoes", title: "Permissões", url: "/permissoes", icon: Settings, perm: "manage_permissions", defaultCat: "Administração", defaultOrder: 15 },
  { id: "logs", title: "Logs", url: "/logs", icon: ScrollText, perm: "view_audit", defaultCat: "Administração", defaultOrder: 16 },
  { id: "atualizacoes", title: "Atualizações", url: "/atualizacoes", icon: Sparkles, perm: "view_patch_notes", defaultCat: "Administração", defaultOrder: 17 },
  { id: "perfil", title: "Meu Perfil", url: "/perfil", icon: User, defaultCat: "Gestão", defaultOrder: 18 },
  { id: "configuracoes", title: "Configurações", url: "/configuracoes", icon: Wrench, perm: "manage_platform_settings", defaultCat: "Administração", defaultOrder: 19 },
];

const DEV_MODULE_NAV_ITEMS: MasterNavItem[] = [
  { id: "dev-hub", title: "Painel Dev Geral", url: "/dev", icon: Terminal, defaultCat: "Ferramentas Dev", defaultOrder: 0 },
  { id: "dev-patch-notes", title: "Patch Notes & Releases", url: "/dev/patch-notes", icon: Sparkles, defaultCat: "Ferramentas Dev", defaultOrder: 1 },
  { id: "dev-desempenho", title: "Gestão Desempenho", url: "/dev/desempenho", icon: TrendingUp, defaultCat: "Ferramentas Dev", defaultOrder: 2 },
  { id: "dev-permissoes", title: "Permissões Tag Dev", url: "/dev/permissoes", icon: KeyRound, defaultCat: "Ferramentas Dev", defaultOrder: 3 },
  { id: "dev-configuracao", title: "Configurações Dev", url: "/dev/configuracao", icon: Code2, defaultCat: "Ferramentas Dev", defaultOrder: 4 },
  { id: "dev-menu-lateral", title: "Menu Lateral Dev", url: "/dev/menu-lateral", icon: Sliders, defaultCat: "Ferramentas Dev", defaultOrder: 5 },
];

function DynamicSidebarNavigation() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { hasPermission, user, profile, level, isDevMode, setPanelMode } = useAuth();
  const { config: menuConfig } = useMenuConfig();
  const { config: devMenuConfig } = useDevMenuConfig();
  const { isMobile, setOpenMobile } = useSidebar();
  const storageKey = "tw_sidebar_cats_v1";

  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const toggleCategory = useCallback(
    (cat: string) => {
      setCollapsedCats((prev) => {
        const next = { ...prev, [cat]: !prev[cat] };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [storageKey]
  );

  const isDevUser = isUserDeveloper(user, profile, level);

  // Se o usuário acessar uma rota /dev diretamente, ativa o modo dev apenas se for Dev verificado
  useEffect(() => {
    if (isDevUser && pathname.startsWith("/dev") && !isDevMode) {
      setPanelMode("dev");
    } else if (!isDevUser && isDevMode) {
      setPanelMode("member");
    }
  }, [pathname, isDevUser, isDevMode, setPanelMode]);

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
      .map((c, idx) => ({
        id: c.id,
        title: c.title,
        url: c.url,
        icon: resolveMenuIcon(c.iconName, c.url) as typeof LayoutDashboard,
        perm: undefined,
        defaultCat: c.category || categoryOrder[0] || "Gestão",
        category: c.category || categoryOrder[0] || "Gestão",
        defaultOrder: typeof c.order === "number" ? c.order : 100 + idx,
        order: typeof c.order === "number" ? c.order : 100 + idx,
        visible: c.visible !== false,
        isCustom: true,
      }));

    const allPlatformItems: MasterNavItem[] = [...customizedMaster, ...customNavItems];

    if (isDevUser && isDevMode) {
      // MODO DEV TOOLS:
      // A) Agrupa itens de ferramentas Dev com base em devMenuConfig
      const devValidItems = devMenuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
      const devConfigMap = new Map(devValidItems.map((c) => [c.id || c.url, c]));
      const devCategoryOrder = devMenuConfig?.categories?.length
        ? devMenuConfig.categories
        : ["Ferramentas Dev"];

      const customizedDev = DEV_MODULE_NAV_ITEMS.map((item, defaultIdx) => {
        const cfg = devConfigMap.get(item.id) || devConfigMap.get(item.url);
        return {
          ...item,
          title: cfg?.title || item.title,
          visible: cfg ? cfg.visible !== false : true,
          category: cfg?.category || item.defaultCat,
          order: typeof cfg?.order === "number" ? cfg.order : item.defaultOrder ?? defaultIdx,
        };
      });

      const visibleDev = customizedDev.filter((item) => item.visible);
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

      // B) Agrupa itens da plataforma com base em menuConfig (em modo dev, exibe todos os itens visíveis com bypass)
      const visibleMaster = allPlatformItems.filter((item) => item.visible);
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

      return [...devGroups, ...platformGroups];
    }

    // MODO NORMAL (MEMBRO): Exibe estritamente as permissões e menus atribuídos ao cargo
    const visible = allPlatformItems.filter(
      (item) => item.visible && (!item.perm || hasPermission(item.perm))
    );

    // Group items into categories matching categoryOrder
    const groups: { category: string; items: typeof visible }[] = [];

    categoryOrder.forEach((cat) => {
      const catItems = visible
        .filter((i) => i.category === cat)
        .sort((a, b) => a.order - b.order);
      if (catItems.length > 0) {
        groups.push({ category: cat, items: catItems });
      }
    });

    // Catch any items with categories not in categoryOrder
    const knownCats = new Set(categoryOrder);
    visible.forEach((item) => {
      if (!knownCats.has(item.category)) {
        knownCats.add(item.category);
        const catItems = visible
          .filter((i) => i.category === item.category)
          .sort((a, b) => a.order - b.order);
        if (catItems.length > 0) {
          groups.push({ category: item.category, items: catItems });
        }
      }
    });

    return groups;
  }, [isDevMode, menuConfig, devMenuConfig, hasPermission]);

  return (
    <>
      {/* SELETOR EM DESTAQUE NO TOPO DA BARRA: PAINEL MEMBRO vs DEV TOOLS */}
      {isDevUser && (
        <div className="px-2 pt-1 pb-2 space-y-1.5 border-b border-border/80 mb-2">
          {isDevMode ? (
            /* SE ESTIVER NO MODO DEV TOOLS: Botão em destaque para voltar ao Painel Normal "Painel Membro" */
            <div className="space-y-1.5">
              <Link
                to="/dashboard"
                onClick={() => {
                  setPanelMode("member");
                  if (isMobile) setOpenMobile(false);
                }}
                className="flex items-center justify-between w-full transition-all text-xs font-black p-2.5 rounded-xl border border-primary/50 bg-primary/15 hover:bg-primary/25 text-foreground hover:text-primary shadow-md group/btn cursor-pointer ring-1 ring-primary/40"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                    <ArrowLeft className="h-4 w-4 group-hover/btn:-translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-left">
                    <span className="block font-black text-foreground leading-tight text-xs">Painel Membro</span>
                    <span className="text-[10px] text-muted-foreground font-medium">Voltar ao modo membro</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono px-1.5 py-0 border-primary/40 bg-primary/20 text-primary font-bold shadow-none"
                >
                  MEMBRO
                </Badge>
              </Link>

              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 font-mono text-[9.5px] font-bold shadow-xs">
                <span className="flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 animate-pulse" />
                  MODO DEV TOOLS ATIVO
                </span>
                <span className="text-[9px] text-rose-300/80">ACESSO TOTAL</span>
              </div>
            </div>
          ) : (
            /* SE ESTIVER NO MODO MEMBRO E FOR DEV: Botão em destaque no topo para abrir o Dev Tools */
            <Link
              to="/dev"
              onClick={() => {
                setPanelMode("dev");
                if (isMobile) setOpenMobile(false);
              }}
              className="flex items-center justify-between w-full transition-all text-xs font-black p-2.5 rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-500/20 via-rose-500/10 to-transparent hover:from-rose-500/30 hover:to-rose-500/15 text-rose-300 hover:text-rose-200 shadow-md shadow-rose-950/20 group/btn cursor-pointer ring-1 ring-rose-500/40"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs animate-pulse">
                  <Terminal className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <span className="block font-black text-rose-300 leading-tight text-xs">Dev Tools</span>
                  <span className="text-[10px] text-rose-400/80 font-medium">Painel do Desenvolvedor</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-[9px] font-mono px-1.5 py-0 border-rose-500/50 bg-rose-500/30 text-rose-200 font-black shadow-none"
              >
                DEV TAG
              </Badge>
            </Link>
          )}
        </div>
      )}

      {grouped.map(({ category, items }) => {
        const isCollapsed = Boolean(collapsedCats[category]);

        return (
          <SidebarGroup key={category} className="py-1">
            <SidebarGroupLabel asChild>
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="flex items-center justify-between w-full text-[0.65rem] uppercase tracking-[0.2em] text-sidebar-foreground/70 hover:text-sidebar-foreground font-bold px-2 py-1 rounded transition-colors group/label cursor-pointer"
                title={isCollapsed ? `Expandir ${category}` : `Recolher ${category}`}
              >
                <span className={cn(category === "Ferramentas Dev" && "text-rose-400 font-black flex items-center gap-1.5")}>
                  {category === "Ferramentas Dev" && <Terminal className="h-3 w-3" />}
                  {category}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200 opacity-60 group-hover/label:opacity-100 shrink-0",
                    isCollapsed && "-rotate-90 text-primary font-bold"
                  )}
                />
              </button>
            </SidebarGroupLabel>

            {!isCollapsed && (
              <SidebarGroupContent className="animate-in fade-in-50 duration-200">
                <SidebarMenu>
                  {items.map((item) => {
                    const active = pathname === item.url;
                    const isDevItem = item.url.startsWith("/dev");
                    const isExternal = item.url.startsWith("http://") || item.url.startsWith("https://");
                    const ItemIcon = item.icon || resolveMenuIcon(undefined, item.url);

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
                              className="flex items-center gap-3 transition-colors hover:text-primary text-sidebar-foreground"
                            >
                              <ItemIcon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{item.title}</span>
                              <ExternalLink className="h-3 w-3 ml-auto opacity-50 shrink-0" />
                            </a>
                          ) : (
                            <Link
                              to={item.url}
                              onClick={() => {
                                if (isMobile) setOpenMobile(false);
                              }}
                              className={cn(
                                "flex items-center gap-3 transition-colors",
                                active && (isDevItem ? "font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg" : "font-medium text-primary")
                              )}
                            >
                              <ItemIcon className={cn("h-4 w-4 shrink-0", isDevItem && "text-rose-400")} />
                              <span className="truncate">{item.title}</span>
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
  const { profile, level, signOut, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  // Enable Realtime sync across all modules
  useRealtimeSync();

  // Active user status / presence management
  const { status, isAbsenceMode, resumeSession } = usePresence(user?.id);
  const { data: members = [] } = useMembers();
  const myMember = members.find((m) => m.user_id === user?.id);

  // Live online timer for active session
  const { formattedHuman } = useOnlineTimer(myMember?.online_since);

  // Contagem de membros online e ausentes
  const onlineMembersCount = useMemo(
    () => members.filter((m) => m.presence_status === "online").length,
    [members]
  );
  const ausenteMembersCount = useMemo(
    () => members.filter((m) => m.presence_status === "ausente" || m.presence_status === "ocupado").length,
    [members]
  );

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
          <SidebarHeader className="px-4 py-5">
            <Brand size="sm" />
          </SidebarHeader>
          <SidebarContent>
            <DynamicSidebarNavigation />
          </SidebarContent>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col min-h-screen">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-border/70 bg-background/95 backdrop-blur-xl px-3 sm:px-6 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <SidebarTrigger />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gradient-brand font-display font-extrabold text-sm sm:text-base tracking-[0.14em] uppercase truncate drop-shadow-xs">
                  {settings.factionName || "Twin Wheels"}
                </span>
                {settings.slogan && (
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hidden xl:inline-block">
                    · {settings.slogan}
                  </span>
                )}
              </div>
            </div>

            {/* TOP HEADER: LIVE REALTIME ONLINE TIMER + ONLINE/AUSENTE MEMBERS BADGE + USER AVATAR */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* LIVE ONLINE TIMER BADGE */}
              <div
                className="flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-[10.5px] sm:text-xs font-bold shadow-sm"
                title="Sua sessão online ativa em tempo real nesta plataforma"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{formattedHuman}</span>
              </div>

              {/* ONLINE & AUSENTES MEMBERS BADGE */}
              <div
                className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-border/70 bg-card/80 backdrop-blur-md text-xs font-mono font-bold shadow-sm"
                title={`${onlineMembersCount} membro(s) online e ${ausenteMembersCount} ausente(s)`}
              >
                {/* Online */}
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs" />
                  <span>{onlineMembersCount}</span>
                  <span className="text-[10px] font-sans font-semibold text-muted-foreground hidden sm:inline">online</span>
                </div>

                <span className="h-3 w-px bg-border/80" />

                {/* Ausentes */}
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shadow-xs" />
                  <span>{ausenteMembersCount}</span>
                  <span className="text-[10px] font-sans font-semibold text-muted-foreground hidden sm:inline">
                    {ausenteMembersCount === 1 ? "ausente" : "ausentes"}
                  </span>
                </div>
              </div>

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

                <DropdownMenuContent align="end" className="w-56 z-50">
                  <DropdownMenuLabel className="space-y-1">
                    <p className="text-xs font-bold text-foreground">{mainName}</p>
                    {subName ? <p className="text-[0.65rem] text-muted-foreground">{subName}</p> : null}
                    <div className="flex items-center gap-1.5 text-[0.65rem] font-mono text-emerald-400 font-bold pt-0.5">
                      <Clock className="h-3 w-3" /> Sessão Ativa: {formattedHuman}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate({ to: "/perfil" })} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4 text-primary" /> Meu Perfil
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive font-medium cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 px-2.5 py-4 sm:px-6 lg:px-8 pb-8 flex flex-col justify-between">
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

      {/* BOTÃO E CARD FLUTUANTE DE STATUS DE MEMBROS (PRESENCE WIDGET) */}
      <FloatingPresenceWidget />
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
