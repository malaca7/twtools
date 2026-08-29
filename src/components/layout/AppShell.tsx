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
} from "lucide-react";
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
import { LEVEL_LABEL, levelBadgeClass, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { FloatingPresenceWidget } from "./FloatingPresenceWidget";

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
  { id: "estoque", title: "Controle de Estoque", url: "/estoque", icon: Boxes, perm: "view_stock", defaultCat: "Gestão", defaultOrder: 3 },
  { id: "membros", title: "Membros", url: "/membros", icon: Users, perm: "view_members", defaultCat: "Gestão", defaultOrder: 4 },
  { id: "hierarquia", title: "Hierarquia", url: "/hierarquia", icon: Workflow, perm: "view_hierarchy", defaultCat: "Gestão", defaultOrder: 5 },
  { id: "fundo-caixa", title: "Fundo de Caixa", url: "/fundo-caixa", icon: Landmark, perm: "view_cash_fund", defaultCat: "Gestão", defaultOrder: 6 },
  { id: "rankings", title: "Rankings", url: "/rankings", icon: Trophy, perm: "view_rankings", defaultCat: "Gestão", defaultOrder: 7 },
  { id: "desempenho", title: "Meu Desempenho", url: "/desempenho", icon: User, perm: "view_performance", defaultCat: "Gestão", defaultOrder: 8 },
  { id: "metas", title: "Metas", url: "/metas", icon: Target, perm: "view_goals", defaultCat: "Gestão", defaultOrder: 9 },
  { id: "cargos", title: "Gerenciamento de Cargos", url: "/cargos", icon: ShieldCheck, perm: "manage_roles", defaultCat: "Gestão", defaultOrder: 10 },
  { id: "permissoes", title: "Permissões", url: "/permissoes", icon: Settings, perm: "manage_permissions", defaultCat: "Gestão", defaultOrder: 11 },
  { id: "avisos", title: "Enviar Avisos", url: "/avisos", icon: Megaphone, perm: "manage_announcements", defaultCat: "Gestão", defaultOrder: 12 },
  { id: "logs", title: "Logs", url: "/logs", icon: ScrollText, perm: "view_audit", defaultCat: "Gestão", defaultOrder: 13 },
  { id: "perfil", title: "Meu Perfil", url: "/perfil", icon: User, defaultCat: "Gestão", defaultOrder: 14 },
  { id: "configuracoes", title: "Configurações", url: "/configuracoes", icon: Wrench, perm: "manage_platform_settings", defaultCat: "Gestão", defaultOrder: 15 },
];

const DEV_MODULE_NAV_ITEMS: MasterNavItem[] = [
  { id: "dev-hub", title: "Painel Dev Geral", url: "/dev", icon: Terminal, defaultCat: "Ferramentas Dev", defaultOrder: 0 },
  { id: "dev-desempenho", title: "Gestão Desempenho", url: "/dev/desempenho", icon: TrendingUp, defaultCat: "Ferramentas Dev", defaultOrder: 1 },
  { id: "dev-permissoes", title: "Permissões Tag Dev", url: "/dev/permissoes", icon: KeyRound, defaultCat: "Ferramentas Dev", defaultOrder: 2 },
  { id: "dev-configuracao", title: "Configurações Dev", url: "/dev/configuracao", icon: Code2, defaultCat: "Ferramentas Dev", defaultOrder: 3 },
];

function DynamicSidebarNavigation() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { hasPermission, user, profile, level, isDevMode, setPanelMode } = useAuth();
  const { config: menuConfig } = useMenuConfig();
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

  // Se o usuário acessar uma rota /dev diretamente, ativa o modo dev
  useEffect(() => {
    if (isDevUser && pathname.startsWith("/dev") && !isDevMode) {
      setPanelMode("dev");
    }
  }, [pathname, isDevUser, isDevMode, setPanelMode]);

  const grouped = useMemo(() => {
    if (isDevMode) {
      // MODO DEV TOOLS: Exibe absolutamente todos os menus e módulos com bypass total
      const allItemsWithDev = [...DEV_MODULE_NAV_ITEMS, ...MASTER_NAV_ITEMS];
      const categories = ["Ferramentas Dev", "Operação", "Gestão", "Administração"];
      const groups: { category: string; items: typeof allItemsWithDev }[] = [];

      categories.forEach((cat) => {
        const catItems = allItemsWithDev
          .filter((i) => i.defaultCat === cat)
          .sort((a, b) => a.defaultOrder - b.defaultOrder);
        if (catItems.length > 0) {
          groups.push({ category: cat, items: catItems });
        }
      });

      return groups;
    }

    // MODO NORMAL (MEMBRO): Exibe estritamente as permissões e menus atribuídos ao cargo
    const validConfigItems = menuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
    const configMap = new Map(validConfigItems.map((c) => [c.id || c.url, c]));

    const categoryOrder = menuConfig?.categories?.length
      ? menuConfig.categories
      : ["Operação", "Gestão", "Administração"];

    // Customize master items with saved config
    const customized = MASTER_NAV_ITEMS.map((item) => {
      const cfg = configMap.get(item.id) || configMap.get(item.url);
      return {
        ...item,
        title: cfg?.title || item.title,
        visible: cfg ? cfg.visible !== false : true,
        category: cfg?.category || item.defaultCat,
        order: typeof cfg?.order === "number" ? cfg.order : item.defaultOrder,
      };
    });

    // Filter visible & authorized items
    const visible = customized.filter(
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
  }, [isDevMode, menuConfig, hasPermission]);

  return (
    <>
      {/* BADGE DE MODO DEV TOOLS NA BARRA LATERAL */}
      {isDevMode && (
        <div className="px-3 pt-1 pb-2">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 font-mono text-[10px] font-bold shadow-sm">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 animate-pulse" />
              MODO DEV TOOLS
            </span>
            <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 border-rose-500/40 bg-rose-500/20 text-rose-300 font-black">
              TODOS MENUS
            </Badge>
          </div>
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

                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
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
                            <item.icon className={cn("h-4 w-4", isDevItem && "text-rose-400")} />
                            <span>{item.title}</span>
                          </Link>
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

      {/* SE ESTIVER NO MODO DEV TOOLS: Botão para voltar ao Painel Normal "Painel Membro" */}
      {isDevMode && (
        <SidebarGroup className="py-2 mt-3 border-t border-border/80 bg-muted/10">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Voltar ao Painel Normal do Membro"
              >
                <Link
                  to="/dashboard"
                  onClick={() => {
                    setPanelMode("member");
                    if (isMobile) setOpenMobile(false);
                  }}
                  className="flex items-center justify-between w-full transition-all text-xs font-bold px-3 py-2.5 rounded-xl border border-border/90 bg-card hover:bg-secondary text-foreground hover:text-primary shadow-sm group/btn cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4 text-primary group-hover/btn:-translate-x-0.5 transition-transform" />
                    <span className="font-extrabold">Painel Membro</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono px-1.5 py-0 border-border bg-secondary/50 text-muted-foreground font-semibold"
                  >
                    NORMAL
                  </Badge>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )}

      {/* SE ESTIVER NO MODO NORMAL E FOR DEV: Botão para abrir o Dev Tools */}
      {!isDevMode && isDevUser && (
        <SidebarGroup className="py-1 mt-2 border-t border-rose-500/20">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/dev")}
                tooltip="Dev Tools — Painel do Desenvolvedor (Acesso Total)"
              >
                <Link
                  to="/dev"
                  onClick={() => {
                    setPanelMode("dev");
                    if (isMobile) setOpenMobile(false);
                  }}
                  className={cn(
                    "flex items-center justify-between w-full transition-all text-xs font-bold px-3 py-2 rounded-xl",
                    pathname.startsWith("/dev")
                      ? "font-black text-rose-400 bg-rose-500/15 border border-rose-500/40 shadow-sm ring-1 ring-rose-500/30"
                      : "text-rose-400/90 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Terminal className="h-4 w-4 text-rose-400 animate-pulse" />
                    <span>Dev Tools</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono px-1.5 py-0 border-rose-500/40 bg-rose-500/20 text-rose-300 font-black shadow-none"
                  >
                    DEV
                  </Badge>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )}
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

  const avatarUrl = profile?.discord_avatar_url || profile?.avatar_url;
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
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/95 backdrop-blur-xl px-3 sm:px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
            </div>

            {/* TOP HEADER: LIVE REALTIME ONLINE TIMER BADGE + USER AVATAR */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* LIVE ONLINE TIMER BADGE */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-[11px] sm:text-xs font-bold shadow-sm"
                title="Sua sessão online ativa em tempo real nesta plataforma"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{formattedHuman}</span>
              </div>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex items-center gap-2 h-11 px-2 hover:bg-secondary/50 rounded-xl outline-none"
                  >
                    <Avatar className="h-9 w-9 border border-primary/40 shadow-sm pointer-events-none">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={mainName} />}
                      <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="text-left min-w-0 hidden sm:block pointer-events-none">
                      <p className="truncate text-sm font-bold text-foreground leading-tight">
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

          <main className="flex-1 px-3 py-4 sm:px-6 lg:px-8 pb-8 flex flex-col justify-between">
            <div>{children}</div>

            {/* RODAPÉ DISCRETO COM CRÉDITOS DO DESENVOLVEDOR (BY MALACA - DISCORD: MALACA7) */}
            <footer className="py-6 mt-12 border-t border-border/40 text-center text-xs text-muted-foreground/80 space-y-1">
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
