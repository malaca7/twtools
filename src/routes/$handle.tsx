import { createFileRoute, useParams, Link, Navigate } from "@tanstack/react-router";
import { PublicProfilePage } from "@/components/profile/PublicProfilePage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogIn, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Brand } from "@/components/Brand";

// Lista de rotas do sistema reservadas que não devem ser capturadas como perfil público
const RESERVED_ROUTES = new Set([
  "dashboard",
  "membros",
  "estoque",
  "vendas",
  "movimentacoes",
  "fundo-caixa",
  "metas",
  "rankings",
  "loja",
  "avisos",
  "hierarquia",
  "cargos",
  "tickets",
  "chat",
  "logs",
  "lives",
  "notificacoes",
  "configuracoes",
  "ceo",
  "dev",
  "permissoes",
  "atualizacoes",
  "desempenho",
  "baus",
  "categorias",
  "produtos",
  "login",
  "auth",
  "api",
  "perfil",
]);

export const Route = createFileRoute("/$handle")({
  component: DirectProfileRouteComponent,
});

function DirectProfileRouteComponent() {
  const { handle = "" } = useParams({ strict: false }) as any;
  const { user } = useAuth();

  const cleanHandle = (() => {
    try {
      return decodeURIComponent(handle || "").trim().toLowerCase().replace(/^(@|%40)/i, "");
    } catch {
      return (handle || "").trim().toLowerCase().replace(/^(@|%40)/i, "");
    }
  })();

  // Se por ventura coincidir com uma rota reservada do sistema, redireciona para a rota correta
  if (RESERVED_ROUTES.has(cleanHandle)) {
    return <Navigate to={`/${cleanHandle}` as any} replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Topbar Pública Oficial */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md px-4 sm:px-8 py-3 shadow-xs">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Brand size="sm" showSlogan={false} />
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono border-primary/30 text-primary bg-primary/10 py-0.5 px-2 font-bold">
              🌐 Perfil Público
            </Badge>

            {user ? (
              <Link to="/dashboard">
                <Button size="sm" className="h-8 px-3 text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-90 cursor-pointer">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Painel do grupo</span>
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
        <PublicProfilePage handleOverride={cleanHandle} isRootRoute />
      </main>

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p className="font-mono text-[11px]">
          Twin Wheels © {new Date().getFullYear()} · Sistema de Gestão e Operações GTA RP
        </p>
      </footer>
    </div>
  );
}
