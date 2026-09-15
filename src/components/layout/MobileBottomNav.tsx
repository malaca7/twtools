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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useChat";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const { isDevUser, isDevMode, isCeoUser, hasPermission } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { totalUnreadCount } = useConversations();

  // Tab 4 contextual setup (Dev > CEO > Membros > Perfil)
  const managementTab = useMemo(() => {
    if (isDevUser && isDevMode) {
      return {
        label: "Dev",
        url: "/dev",
        icon: Terminal,
        isActive: pathname.startsWith("/dev"),
        colorClass: "text-rose-400",
        activeBgClass: "bg-rose-500/15 border-rose-500/30 text-rose-300",
      };
    }
    if (isCeoUser) {
      return {
        label: "CEO",
        url: "/ceo",
        icon: Crown,
        isActive: pathname.startsWith("/ceo"),
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
  }, [isDevUser, isDevMode, isCeoUser, hasPermission, pathname]);

  const isHomeActive = pathname === "/dashboard" || pathname === "/";
  const isOperationsActive =
    pathname.startsWith("/movimentacoes") ||
    pathname.startsWith("/vendas") ||
    pathname.startsWith("/estoque");
  const isChatRoute = pathname.startsWith("/chat");

  const handleChatClick = () => {
    // Dispara evento para o widget de chat abrir em gaveta nativa
    window.dispatchEvent(new CustomEvent("tw_chat_toggle"));
  };

  return (
    <nav
      aria-label="Navegação inferior mobile"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/92 backdrop-blur-2xl border-t border-border/70 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.45)] select-none transition-all duration-200"
    >
      <div className="flex items-center justify-around h-15 px-1 max-w-lg mx-auto">
        {/* 1. INÍCIO */}
        <button
          type="button"
          onClick={() => navigate({ to: "/dashboard" })}
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
          onClick={() => navigate({ to: "/movimentacoes" })}
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

        {/* 3. CHAT (COM BADGE DE NÃO LIDAS) */}
        <button
          type="button"
          onClick={handleChatClick}
          className={cn(
            "flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-90 group relative",
            isChatRoute
              ? "text-primary font-black"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div
            className={cn(
              "p-1 rounded-xl transition-all relative",
              isChatRoute && "bg-primary/15 shadow-xs"
            )}
          >
            <MessageSquare className="h-5 w-5 transition-transform group-hover:scale-110 text-emerald-400" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white font-mono text-[9px] font-black animate-pulse shadow-xs">
                {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">Chat</span>
          {isChatRoute && (
            <span className="h-1 w-1 rounded-full bg-emerald-400 mt-0.5" />
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
