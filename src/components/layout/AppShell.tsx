import { type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Trophy,
  Target,
  ScrollText,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { LEVEL_LABEL, levelBadgeClass, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; perm?: Permission };

const NAV_OPERACAO: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, perm: "view_dashboard" },
  { title: "Estoque", url: "/estoque", icon: Boxes, perm: "view_stock" },
  { title: "Movimentações", url: "/movimentacoes", icon: ArrowLeftRight, perm: "view_stock" },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart, perm: "view_sales" },
  { title: "Produtos", url: "/produtos", icon: Package, perm: "view_products" },
];

const NAV_GESTAO: NavItem[] = [
  { title: "Membros", url: "/membros", icon: Users, perm: "view_members" },
  { title: "Desempenho", url: "/desempenho", icon: TrendingUp, perm: "view_performance" },
  { title: "Rankings", url: "/rankings", icon: Trophy, perm: "view_rankings" },
  { title: "Metas", url: "/metas", icon: Target, perm: "view_performance" },
  { title: "Auditoria", url: "/auditoria", icon: ScrollText, perm: "view_audit" },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const { hasPermission } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const visible = items.filter((item) => !item.perm || hasPermission(item.perm));
  if (visible.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[0.65rem] uppercase tracking-[0.2em]">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map((item) => {
            const active = pathname === item.url;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                  <Link
                    to={item.url}
                    className={cn(
                      "flex items-center gap-3 transition-colors",
                      active && "font-medium text-primary",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, level, signOut, user, hasPermission } = useAuth();
  const navigate = useNavigate();

  const initials = (profile?.nickname || profile?.nome || user?.email || "TW")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="px-4 py-5">
            <Brand size="sm" subtitle="Gestão interna" />
          </SidebarHeader>
          <SidebarContent>
            <NavGroup label="Operação" items={NAV_OPERACAO} />
            <NavGroup label="Gestão" items={NAV_GESTAO} />
          </SidebarContent>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-background/80 px-3 backdrop-blur-xl sm:px-6">
            <SidebarTrigger />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {profile?.nome ?? "Membro"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>

            {level ? (
              <Badge
                variant="outline"
                className={cn("hidden sm:inline-flex", levelBadgeClass(level))}
              >
                {LEVEL_LABEL[level]}
              </Badge>
            ) : null}

            {hasPermission("create_sale") ? (
              <Button
                size="sm"
                className="hidden bg-gradient-brand text-primary-foreground hover:opacity-90 md:inline-flex"
                onClick={() => navigate({ to: "/vendas" })}
              >
                <Plus className="mr-1 h-4 w-4" /> Nova venda
              </Button>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-secondary text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="space-y-1">
                  <p className="text-sm">{profile?.nome ?? "Membro"}</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    {level ? LEVEL_LABEL[level] : "Sem nível"}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/configuracoes" })}>
                  <Settings className="mr-2 h-4 w-4" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 px-3 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
