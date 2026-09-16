import { useMemo } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  MessageSquare,
  Crown,
  Terminal,
  Users,
  User,
  Menu,
  Trophy,
  Target,
  Megaphone,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useChat";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const { isDevUser, isDevMode, isCeoUser, isCeoMode, hasPermission } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { totalUnreadCount } = useConversations();

  const homeUrl = useMemo(() => {
    if (isDevUser && isDevMode) return "/dev/dashboard";
    if (isCeoUser && isCeoMode) return "/ceo/dashboard";
    if (hasPermission("view_dashboard")) return "/dashboard";
    if (hasPermission("view_movements")) return "/movimentacoes";
    if (hasPermission("view_stock")) return "/estoque";
    return "/perfil";
  }, [isDevUser, isDevMode, isCeoUser, isCeoMode, hasPermission]);

  const opsUrl = useMemo(() => {
    if (isDevUser && isDevMode) return "/dev/movimentacoes";
    if (isCeoUser && isCeoMode) return "/ceo/movimentacoes";
    if (hasPermission("view_movements")) return "/movimentacoes";
    if (hasPermission("view_stock")) return "/estoque";
    if (hasPermission("view_sales")) return "/vendas";
    if (hasPermission("view_dashboard")) return "/dashboard";
    return "/perfil";
  }, [isDevUser, isDevMode, isCeoUser, isCeoMode, hasPermission]);

  // Tab 4 contextual setup (Dev > CEO > Membros > Perfil)
  const managementTab = useMemo(() => {
    if (isDevUser && isDevMode) {
      return {
        label: "Dev",
        url: "/dev",
        icon: Terminal,
        isActive: pathname.startsWith("/dev") && !pathname.startsWith("/dev/dashboard") && !pathname.startsWith("/dev/movimentacoes") && !pathname.startsWith("/dev/chat"),
        colorClass: "text-rose-400",
        activeBgClass: "bg-rose-500/15 border-rose-500/30 text-rose-300",
      };
    }
    if ((isCeoUser || isDevUser) && isCeoMode) {
      return {
        label: "CEO",
        url: "/ceo/executivo",
        icon: Crown,
        isActive: pathname.startsWith("/ceo") && !pathname.startsWith("/ceo/dashboard") && !pathname.startsWith("/ceo/movimentacoes") && !pathname.startsWith("/ceo/chat"),
        colorClass: "text-amber-400",
        activeBgClass: "bg-amber-500/15 border-amber-500/30 text-amber-300",
      };
    }
    if (hasPermission("view_members")) {
      return {
        label: "Equipe",
        url: "/membros",
        icon: Users,
        isActive: pathname.startsWith("/membros") || pathname.startsWith("/hierarquia"),
        colorClass: "text-primary",
        activeBgClass: "bg-primary/15 border-primary/30 text-primary",
      };
    }
    return {
      label: "Perfil",
      url: "/perfil",
      icon: User,
      isActive: pathname.startsWith("/perfil"),
      colorClass: "text-primary",
      activeBgClass: "bg-primary/15 border-primary/30 text-primary",
    };
  }, [isDevUser, isDevMode, isCeoUser, isCeoMode, hasPermission, pathname]);

  const isHomeActive = pathname === "/dashboard" || pathname === "/" || pathname === "/dev/dashboard" || pathname === "/ceo/dashboard";
  const isOperationsActive =
    pathname.startsWith("/movimentacoes") ||
    pathname.startsWith("/vendas") ||
    pathname.startsWith("/estoque") ||
    pathname.startsWith("/dev/movimentacoes") ||
    pathname.startsWith("/dev/vendas") ||
    pathname.startsWith("/dev/estoque") ||
    pathname.startsWith("/ceo/movimentacoes") ||
    pathname.startsWith("/ceo/vendas") ||
    pathname.startsWith("/ceo/estoque");
  const isChatRoute = pathname.startsWith("/chat") || pathname.startsWith("/dev/chat") || pathname.startsWith("/ceo/chat");

  const handleChatClick = () => {
    window.dispatchEvent(new CustomEvent("tw_chat_toggle"));
  };

  const middleTab = useMemo(() => {
    if (hasPermission("view_chat")) {
      const MiddleIcon = MessageSquare;
      return {
        label: "Chat",
        icon: MiddleIcon,
        iconColor: "text-emerald-400",
        indicatorColor: "bg-emerald-400",
        isActive: isChatRoute,
        unread: totalUnreadCount,
        onClick: handleChatClick,
      };
    }
    if (hasPermission("view_rankings")) {
      const url = isDevMode ? "/dev/rankings" : isCeoMode ? "/ceo/rankings" : "/rankings";
      const MiddleIcon = Trophy;
      return {
        label: "Rankings",
        icon: MiddleIcon,
        iconColor: "text-amber-400",
        indicatorColor: "bg-amber-400",
        isActive: pathname.startsWith("/rankings") || pathname.startsWith("/dev/rankings") || pathname.startsWith("/ceo/rankings"),
        unread: 0,
        onClick: () => navigate({ to: url as any }),
      };
    }
    if (hasPermission("view_goals")) {
      const url = isDevMode ? "/dev/metas" : isCeoMode ? "/ceo/metas" : "/metas";
      const MiddleIcon = Target;
      return {
        label: "Metas",
        icon: MiddleIcon,
        iconColor: "text-sky-400",
        indicatorColor: "bg-sky-400",
        isActive: pathname.startsWith("/metas") || pathname.startsWith("/dev/metas") || pathname.startsWith("/ceo/metas"),
        unread: 0,
        onClick: () => navigate({ to: url as any }),
      };
    }
    const url = isDevMode ? "/dev/perfil" : isCeoMode ? "/ceo/perfil" : "/perfil";
    const MiddleIcon = User;
    return {
      label: "Perfil",
      icon: MiddleIcon,
      iconColor: "text-primary",
      indicatorColor: "bg-primary",
      isActive: pathname.startsWith("/perfil"),
      unread: 0,
      onClick: () => navigate({ to: url as any }),
    };
  }, [hasPermission, isChatRoute, totalUnreadCount, isDevMode, isCeoMode, pathname, navigate]);

  return (
    <nav
      aria-label="Navegação inferior mobile"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/92 backdrop-blur-2xl border-t border-border/70 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.45)] select-none transition-all duration-200"
    >
      <div className="flex items-center justify-around h-15 px-1 max-w-lg mx-auto">
        {/* 1. INÍCIO */}
        <button
          type="button"
          onClick={() => navigate({ to: homeUrl as any })}
          className={cn(
            "flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 group",
            isHomeActive
              ? "text-primary font-black"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1 rounded-xl transition-all",
              isHomeActive && "bg-primary/15 shadow-xs"
            )}
          >
            <LayoutDashboard className="h-5 w-5 transition-transform group-hover:scale-110" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Início</span>
          {isHomeActive && (
            <span className="h-1 w-1 rounded-full bg-primary mt-0.5" />
          )}
        </button>

        {/* 2. OPERAÇÕES */}
        <button
          type="button"
          onClick={() => navigate({ to: opsUrl as any })}
          className={cn(
            "flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 group",
            isOperationsActive
              ? "text-primary font-black"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1 rounded-xl transition-all",
              isOperationsActive && "bg-primary/15 shadow-xs"
            )}
          >
            <ArrowLeftRight className="h-5 w-5 transition-transform group-hover:scale-110" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Operações</span>
          {isOperationsActive && (
            <span className="h-1 w-1 rounded-full bg-primary mt-0.5" />
          )}
        </button>

        {/* 3. ABA CENTRAL DINÂMICA (CHAT OU METAS OU RANKINGS) */}
        <button
          type="button"
          onClick={middleTab.onClick}
          className={cn(
            "flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 group relative",
            middleTab.isActive
              ? "text-primary font-black"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1 rounded-xl transition-all relative",
              middleTab.isActive && "bg-primary/15 shadow-xs"
            )}
          >
            <middleTab.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", middleTab.iconColor)} />
            {middleTab.unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white font-mono text-[9px] font-black animate-pulse shadow-xs">
                {middleTab.unread > 99 ? "99+" : middleTab.unread}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">{middleTab.label}</span>
          {middleTab.isActive && (
            <span className={cn("h-1 w-1 rounded-full mt-0.5", middleTab.indicatorColor)} />
          )}
        </button>

        {/* 4. GESTÃO CONTEXTUAL (DEV / CEO / EQUIPE / PERFIL) */}
        <button
          type="button"
          onClick={() => navigate({ to: managementTab.url })}
          className={cn(
            "flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 group",
            managementTab.isActive
              ? cn("font-black", managementTab.colorClass)
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1 rounded-xl transition-all",
              managementTab.isActive && managementTab.activeBgClass
            )}
          >
            <managementTab.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">{managementTab.label}</span>
          {managementTab.isActive && (
            <span
              className={cn(
                "h-1 w-1 rounded-full mt-0.5",
                managementTab.label === "CEO"
                  ? "bg-amber-400"
                  : managementTab.label === "Dev"
                  ? "bg-rose-400"
                  : "bg-primary"
              )}
            />
          )}
        </button>

        {/* 5. MAIS / MENU (ABRE GAVETA LATERAL) */}
        <button
          type="button"
          onClick={() => toggleSidebar()}
          className="flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 group text-muted-foreground hover:text-foreground"
        >
          <div className="p-1 rounded-xl transition-all group-hover:bg-secondary/60">
            <Menu className="h-5 w-5 transition-transform group-hover:scale-110 text-foreground/80" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Menu</span>
        </button>
      </div>
    </nav>
  );
}
