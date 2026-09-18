import { useEffect } from "react";
import { createFileRoute, Outlet, Navigate, useLocation, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, LayoutDashboard } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, approvedAccess, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Verifica se o visitante está acessando um perfil público (/perfil/:handle ou similar)
  const isPublicProfilePath = (() => {
    const p = (location.pathname || "").toLowerCase().trim();
    return p.startsWith("/perfil/") && p !== "/perfil/dados" && p !== "/perfil/aparencia" && p !== "/perfil/publico";
  })();

  useEffect(() => {
    if (!loading && (!user || !approvedAccess) && !isPublicProfilePath) {
      void navigate({ to: "/", replace: true });
    }
  }, [loading, user, approvedAccess, isPublicProfilePath, navigate]);

  // Se for perfil público (/perfil/:handle), SEMPRE renderiza como página standalone independente do AppShell e sem bloquear no loading
  if (isPublicProfilePath) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
        {/* Topbar Pública Oficial Standalone */}
        <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md px-4 sm:px-8 py-3 shadow-xs">
          <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="Twin Wheels"
                className="h-8 w-8 rounded-xl object-contain border border-primary/40 p-0.5 bg-secondary/50 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">
                  TWIN WHEELS
                </span>
                <span className="text-[10px] text-muted-foreground font-mono leading-none">
                  Perfil de Integrante Oficial
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono border-primary/30 text-primary bg-primary/10 py-0.5 px-2 font-bold">
                🌐 Perfil Público
              </Badge>

              {user ? (
                <Link to="/dashboard">
                  <Button size="sm" className="h-8 px-3 text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-90 cursor-pointer">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span>Painel da Facção</span>
                  </Button>
                </Link>
              ) : (
                <Link to="/">
                  <Button size="sm" className="h-8 px-3 text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-90 cursor-pointer">
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Acessar Painel / Entrar</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>

        <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
          <p className="font-mono text-[11px]">
            Twin Wheels © {new Date().getFullYear()} · Sistema de Gestão e Operações GTA RP
          </p>
        </footer>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Carregando painel Twin Wheels...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado ou não tiver acesso aprovado, aguarda o redirecionamento
  if (!user || !approvedAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

