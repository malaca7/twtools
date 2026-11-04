import { useEffect, useState, useMemo } from "react";
import {
  createFileRoute,
  useParams,
  useNavigate,
  Link,
  Outlet,
  useChildMatches,
} from "@tanstack/react-router";
import {
  Headphones,
  Shield,
  ArrowRight,
  Loader2,
  ExternalLink,
  LogIn,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useTickets } from "@/hooks/useTickets";
import { isUserDeveloper, isUserCeo } from "@/services/devService";
import { formatTicketNumber } from "@/types/tickets";

export const Route = createFileRoute("/ticket/$ticketId")({
  component: TicketRedirectResolverPage,
});

export function TicketRedirectResolverPage() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <TicketRedirectContent />;
}

function TicketRedirectContent() {
  const { ticketId } = useParams({ from: "/ticket/$ticketId" });
  const navigate = useNavigate();

  // Sanitiza o ID removendo possíveis barras finais ou espaços
  const cleanTicketId = useMemo(() => {
    return String(ticketId || "").replace(/\/+$/, "").trim();
  }, [ticketId]);

  const { user, profile, level, hasPermission, approvedAccess, loading: authLoading } = useAuth();
  const { data: allTickets = [], isLoading: ticketsLoading } = useTickets();

  // Localiza o ticket na lista caso já esteja disponível
  const foundTicket = useMemo(() => {
    if (!cleanTicketId) return null;
    return allTickets.find(
      (t) => t.id === cleanTicketId || String(t.ticket_number) === cleanTicketId
    );
  }, [allTickets, cleanTicketId]);

  // Se o usuário estiver autenticado, redireciona automaticamente para a tela ideal
  useEffect(() => {
    if (authLoading) return;

    if (user && approvedAccess && cleanTicketId) {
      const isDev = isUserDeveloper(user, profile, level) || level === "desenvolvedor";
      const isCeo = isUserCeo(profile) || level === "ceo";
      const isStaff =
        isDev ||
        isCeo ||
        hasPermission("reply_tickets") ||
        hasPermission("can_view_all_tickets" as any) ||
        hasPermission("view_all_tickets" as any);

      const targetPath = isStaff ? "/atendimento-tickets" : "/tickets";

      void navigate({
        to: targetPath,
        search: { ticket: cleanTicketId },
        replace: true,
      });
    }
  }, [authLoading, user, approvedAccess, profile, level, hasPermission, cleanTicketId, navigate]);

  // Se o usuário não estiver autenticado, salva a intenção de redirecionamento no sessionStorage
  useEffect(() => {
    if (!authLoading && (!user || !approvedAccess) && cleanTicketId && typeof window !== "undefined") {
      try {
        sessionStorage.setItem("tw_auth_redirect", `/ticket/${cleanTicketId}`);
      } catch {}
    }
  }, [authLoading, user, approvedAccess, cleanTicketId]);

  // Enquanto verifica a sessão do usuário ou processa redirecionamento
  if (authLoading || (user && approvedAccess)) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center animate-in fade-in-50 duration-300">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <div className="space-y-1">
            <h1 className="text-base font-black tracking-tight text-foreground">
              Acessando Chamado
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Redirecionando para o chamado {cleanTicketId}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se não estiver logado, exibe tela de transição para o login
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Topbar Pública */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md px-4 sm:px-8 py-3 shadow-xs">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <Brand size="sm" />
          </Link>

          <Badge
            variant="outline"
            className="text-[10px] font-mono border-cyan-500/30 text-cyan-400 bg-cyan-500/10 py-0.5 px-2 font-bold"
          >
            Atendimento Ticket
          </Badge>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full surface-card border-border/80 shadow-2xl overflow-hidden bg-card/95 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-xl">
                <Headphones className="h-9 w-9" />
              </div>

              <div className="space-y-1">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 text-xs font-mono font-bold"
                >
                  Chamado {foundTicket ? `#${formatTicketNumber(foundTicket.ticket_number)}` : `#${cleanTicketId}`}
                </Badge>
                <h2 className="text-xl font-black text-foreground tracking-tight">
                  {foundTicket?.subject || "Notificação de Atendimento"}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Você foi direcionado a partir de uma notificação do bot no Discord. Faça login na sua conta da facção para visualizar as mensagens e responder ao chamado.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  ID do Chamado:
                </span>
                <span className="font-mono font-bold text-foreground truncate max-w-[200px]">
                  {cleanTicketId}
                </span>
              </div>
              {foundTicket && (
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <span className="text-muted-foreground font-medium">Status:</span>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase">
                    {foundTicket.status}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              <Button
                type="button"
                className="w-full h-10 font-bold text-xs gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    try {
                      sessionStorage.setItem("tw_auth_redirect", `/ticket/${cleanTicketId}`);
                    } catch {}
                  }
                  void navigate({ to: "/" });
                }}
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar na Plataforma para Responder</span>
              </Button>

              <Link
                to={`/ticket/${cleanTicketId}/transcript` as any}
                className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground text-xs font-semibold transition-all"
              >
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                <span>Ver Transcrição Pública Oficial</span>
                <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
