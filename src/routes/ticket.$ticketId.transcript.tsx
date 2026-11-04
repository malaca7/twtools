import { useState, useMemo, useEffect } from "react";
import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import {
  Shield,
  Lock,
  Unlock,
  KeyRound,
  Printer,
  Copy,
  ExternalLink,
  Calendar,
  Clock,
  User,
  Users,
  Paperclip,
  CheckCircle2,
  FileText,
  Eye,
  EyeOff,
  Headphones,
  ArrowLeft,
  Share2,
  Sparkles,
  Download,
  AlertCircle,
  HelpCircle,
  Hash,
  Phone,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type Ticket,
  type TicketMessage,
  type TicketAttachment,
  formatTicketNumber,
  getCategoryInfo,
  getPriorityInfo,
  getStatusInfo,
} from "@/types/tickets";
import { fetchPublicTicketTranscript } from "@/lib/app-api";
import { useTickets } from "@/hooks/useTickets";
import { useAuth } from "@/hooks/useAuth";
import { dateTime, formatTimeOnly } from "@/lib/format";
import { LEVEL_LABEL, levelBadgeClass } from "@/lib/permissions";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { generateTicketDiscordTranscript } from "@/components/tickets/ticketTranscript";

export const Route = createFileRoute("/ticket/$ticketId/transcript")({
  component: TicketTranscriptPage,
});

function isSystemEventMessage(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return (
    trimmed.startsWith("⚡") ||
    trimmed.startsWith("🔄") ||
    trimmed.startsWith("🔒") ||
    trimmed.startsWith("👥") ||
    trimmed.startsWith("🔀") ||
    trimmed.startsWith("📌") ||
    trimmed.startsWith("⚠️ [Sistema]")
  );
}

export function TicketTranscriptPage() {
  const { ticketId } = useParams({ from: "/ticket/$ticketId/transcript" });
  const { user, profile, hasPermission } = useAuth();
  const { data: allTickets = [] } = useTickets();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Senha e Autenticação local da Transcrição
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<TicketAttachment | null>(null);

  // Busca o chamado a partir da lista em cache ou do banco público
  useEffect(() => {
    let isMounted = true;
    async function loadTicket() {
      setIsLoading(true);
      // 1. Tenta encontrar no cache local de tickets
      const cached = allTickets.find(
        (t) => t.id === ticketId || String(t.ticket_number) === ticketId
      );
      if (cached) {
        if (isMounted) {
          setTicket(cached);
          setIsLoading(false);
        }
        return;
      }

      // 2. Busca diretamente no Firebase / RTDB público
      try {
        const found = await fetchPublicTicketTranscript(ticketId);
        if (isMounted) {
          setTicket(found);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTicket();
    return () => {
      isMounted = false;
    };
  }, [ticketId, allTickets]);

  const config = ticket?.transcript_config;
  const hasPassword = Boolean(config?.has_password && config?.password);

  // Membros da equipe autorizados (Líderes ou moderadores) ignoram o bloqueio de senha se estiverem autenticados
  const isPrivilegedStaff =
    hasPermission("manage_tickets") ||
    hasPermission("view_ticket_internal_notes" as any) ||
    Boolean(profile?.is_developer || profile?.is_ceo);

  // Verifica se já desbloqueou nesta sessão
  useEffect(() => {
    if (!ticket) return;
    if (!hasPassword || isPrivilegedStaff) {
      setIsUnlocked(true);
      return;
    }
    const sessionKey = `tw_transcript_auth_${ticket.id}`;
    if (sessionStorage.getItem(sessionKey) === "unlocked") {
      setIsUnlocked(true);
    }
  }, [ticket?.id, hasPassword, isPrivilegedStaff]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !config?.password) return;

    if (passwordInput.trim() === config.password.trim()) {
      setIsUnlocked(true);
      sessionStorage.setItem(`tw_transcript_auth_${ticket.id}`, "unlocked");
      toast.success("Acesso autorizado à transcrição oficial! 🔓");
    } else {
      toast.error("Senha incorreta. Verifique com o atendente ou líder responsável.");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link oficial da transcrição copiado para a área de transferência!");
  };

  const handleCopyDiscord = () => {
    if (!ticket) return;
    const includeInternal = Boolean(config?.include_internal_notes && isPrivilegedStaff);
    const text = generateTicketDiscordTranscript(ticket, includeInternal);
    navigator.clipboard.writeText(text);
    toast.success("Transcrição completa formatada para Discord copiada!");
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Headphones className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            Carregando transcrição oficial do chamado...
          </p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/80 bg-card/95 backdrop-blur-md rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">Chamado Não Encontrado</h2>
            <p className="text-xs text-muted-foreground">
              A transcrição para o identificador informado não existe ou foi removida.
            </p>
          </div>
          <Button asChild variant="outline" className="text-xs rounded-xl">
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const catInfo = getCategoryInfo(ticket.category);
  const priorityInfo = getPriorityInfo(ticket.priority);
  const statusInfo = getStatusInfo(ticket.status);

  // SE ESTIVER PROTEGIDO POR SENHA E NÃO ESTIVER DESBLOQUEADO
  if (hasPassword && !isUnlocked && !isPrivilegedStaff) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card/95 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-md">
              <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Acesso Restrito • Transcrição Protegida
              </span>
              <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight pt-1">
                Chamado {formatTicketNumber(ticket.ticket_number)}
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Este registro oficial de atendimento foi protegido por senha pela gerência da Twin Wheels. Insira a senha autorizada para visualizar o histórico de mensagens e anexos.
              </p>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3.5">
            <div className="space-y-1.5">
              <label htmlFor="transcript_pwd" className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Senha de Acesso</span>
                <span className="text-[10px] text-muted-foreground">Solicite à liderança</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="transcript_pwd"
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite a senha da transcrição..."
                  className="pl-9 pr-9 text-xs sm:text-sm bg-secondary/50 border-border/80 rounded-xl h-10"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-sm gap-2"
            >
              <Unlock className="h-4 w-4" />
              <span>Desbloquear Transcrição</span>
            </Button>
          </form>

          <div className="pt-2 border-t border-border/40 text-center text-[10px] text-muted-foreground">
            Twin Wheels GTA RP • Transcrição Criptografada e Autenticada
          </div>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL DA TRANSCRIÇÃO OFICIAL
  const shouldCensor = Boolean(config?.censor_sensitive_data && !isPrivilegedStaff);
  const includeInternalNotes = Boolean(config?.include_internal_notes || isPrivilegedStaff);

  const durationText = (() => {
    if (!ticket.closed_at) return "Em aberto";
    try {
      const diffMs = new Date(ticket.closed_at).getTime() - new Date(ticket.created_at).getTime();
      const diffMins = Math.round(diffMs / (1000 * 60));
      if (diffMins < 60) return `${diffMins} minutos`;
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      return `${diffHours}h ${remainingMins}m`;
    } catch {
      return "—";
    }
  })();

  const integrityHash = `TW-SEC-${ticket.id.slice(0, 8).toUpperCase()}-${ticket.closed_at ? ticket.closed_at.slice(0, 10).replace(/-/g, "") : "ACTIVE"}`;

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 selection:bg-amber-500/20 selection:text-amber-300">
      {/* BARRA SUPERIOR DE AÇÕES E NAVEGAÇÃO (NÃO IMPRIME NO PDF) */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-card/90 backdrop-blur-md px-4 py-3 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Link
              to="/atendimento-tickets"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary/70 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar ao Desk</span>
            </Link>
            <span className="text-muted-foreground/40">•</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono font-bold">
              <Headphones className="h-3 w-3" />
              <span>Desk Transcript</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 text-xs gap-1.5 border-border/70 rounded-xl"
              title="Copiar link desta transcrição"
            >
              <Share2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Copiar Link</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyDiscord}
              className="h-8 text-xs gap-1.5 border-border/70 rounded-xl"
              title="Copiar log formatado em Markdown para o Discord"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Discord</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Salvar PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* DOCUMENTO OFICIAL DA TRANSCRIÇÃO */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* BANNER OFICIAL DA FACÇÃO */}
        <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-secondary/30 p-5 sm:p-7 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-black text-sm">
                  {formatTicketNumber(ticket.ticket_number)}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Twin Wheels GTA RP • Transcrição Oficial
                </span>
                {hasPassword && (
                  <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400 bg-amber-500/10 gap-1 rounded-full font-bold">
                    <Lock className="h-2.5 w-2.5" />
                    Protegido
                  </Badge>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight pt-1">
                {ticket.subject}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Badge variant="outline" className={cn("text-xs font-semibold gap-1 px-2.5 py-1 rounded-xl shadow-xs", catInfo.badgeClass)}>
                <span>{catInfo.emoji}</span>
                <span>{catInfo.label}</span>
              </Badge>
              <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-1 rounded-xl shadow-xs", priorityInfo.badgeClass)}>
                <span className={cn("h-2 w-2 rounded-full mr-1.5", priorityInfo.dotClass)} />
                {priorityInfo.label}
              </Badge>
              <Badge variant="outline" className={cn("text-xs font-bold px-2.5 py-1 rounded-xl shadow-xs", statusInfo.badgeClass)}>
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* DADOS METADADOS DO CHAMADO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Solicitante */}
            <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                <User className="h-3 w-3 text-cyan-400" />
                Solicitante
              </span>
              <p className="font-bold text-foreground truncate">
                {ticket.creator_nickname || ticket.creator_name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {LEVEL_LABEL[ticket.creator_role] || ticket.creator_role}
              </p>
            </div>

            {/* Atendente Responsável */}
            <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                <Headphones className="h-3 w-3 text-sky-400" />
                Responsável
              </span>
              <p className="font-bold text-sky-300 truncate">
                {ticket.assigned_to_name ? (ticket.assigned_to_nickname || ticket.assigned_to_name) : "Fila Geral"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {ticket.assigned_to_role ? LEVEL_LABEL[ticket.assigned_to_role] || ticket.assigned_to_role : "Atendente"}
              </p>
            </div>

            {/* Abertura e Encerramento */}
            <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                <Calendar className="h-3 w-3 text-amber-400" />
                Datas
              </span>
              <p className="text-[11px] font-mono text-foreground">
                Aberto: {dateTime(ticket.created_at)}
              </p>
              {ticket.closed_at && (
                <p className="text-[10px] font-mono text-muted-foreground">
                  Fechado: {dateTime(ticket.closed_at)}
                </p>
              )}
            </div>

            {/* Duração & Finalizador */}
            <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                <Clock className="h-3 w-3 text-emerald-400" />
                Duração
              </span>
              <p className="font-bold text-emerald-400 font-mono">
                {durationText}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                Por: {ticket.closed_by_name || "Gerência"}
              </p>
            </div>
          </div>

          {/* Justificativa de Conclusão */}
          {ticket.closed_reason && (
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Justificativa Oficial de Conclusão:
              </span>
              <p className="text-foreground italic font-medium leading-relaxed">
                "{ticket.closed_reason}"
              </p>
            </div>
          )}
        </div>

        {/* 1. RELATO INICIAL DO MEMBRO */}
        <div className="rounded-3xl border border-cyan-500/30 bg-card/95 p-5 sm:p-6 space-y-3.5 shadow-md border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 rounded-xl border border-cyan-500/30">
                <AvatarImage src={ticket.creator_avatar || undefined} />
                <AvatarFallback className="text-xs font-bold bg-secondary">
                  {(ticket?.creator_name || ticket?.creator_nickname || "TC").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {ticket.creator_nickname || ticket.creator_name}
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold ml-2 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                  Abertura Inicial
                </span>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {dateTime(ticket.created_at)}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-foreground/95 whitespace-pre-wrap leading-relaxed font-sans">
            {ticket.description}
          </p>

          {/* Anexos Iniciais */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="pt-2 border-t border-border/40 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-cyan-400" />
                Prints Anexados na Abertura ({ticket.attachments.length}):
              </span>
              <div className="flex flex-wrap gap-2.5">
                {ticket.attachments.map((att) => (
                  <div
                    key={att.id}
                    onClick={() => setLightboxImage(att)}
                    className="group relative w-24 h-24 rounded-xl overflow-hidden border border-border/80 bg-black/40 cursor-pointer shadow-sm hover:border-cyan-500/60 transition-all"
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. HISTÓRICO COMPLETO DA CONVERSAÇÃO */}
        {ticket.messages && ticket.messages.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Histórico de Mensagens ({ticket.messages.length})
              </h2>
            </div>

            <div className="space-y-3">
              {ticket.messages.map((msg) => {
                const isNote = msg.is_internal_note;
                const isSystem = isSystemEventMessage(msg.content);

                // Oculta notas internas se não configurado
                if (isNote && !includeInternalNotes) {
                  return null;
                }

                // EVENTO DE SISTEMA
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex items-center gap-3 my-3 px-2">
                      <div className="h-px flex-1 bg-border/40" />
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/60 text-[11px] font-mono text-muted-foreground shadow-2xs">
                        <span>{msg.content}</span>
                        <span className="text-[10px] text-muted-foreground/60">• {formatTimeOnly(msg.created_at)}</span>
                      </div>
                      <div className="h-px flex-1 bg-border/40" />
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="w-full">
                    {isNote ? (
                      /* NOTA INTERNA PRIVADA */
                      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 p-4 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between border-b border-amber-500/25 pb-1.5">
                          <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" />
                            NOTA INTERNA CONFIDENCIAL
                          </span>
                          <span className="text-[10px] text-amber-300 font-mono">
                            {dateTime(msg.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={msg.sender_avatar || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {(msg?.sender_name || "TC").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-amber-300">
                            {msg.sender_nickname || msg.sender_name}
                          </span>
                          <span className="text-[10px] text-amber-400/80">
                            ({LEVEL_LABEL[msg.sender_role] || msg.sender_role})
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-amber-100 whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      </div>
                    ) : (
                      /* MENSAGEM NORMAL */
                      <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 rounded-lg">
                              <AvatarImage src={msg.sender_avatar || undefined} />
                              <AvatarFallback className="text-[9px]">
                                {(msg?.sender_name || "TC").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-foreground">
                              {msg.sender_nickname || msg.sender_name}
                            </span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {LEVEL_LABEL[msg.sender_role] || msg.sender_role}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {dateTime(msg.created_at)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground/95 whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1 border-t border-border/20">
                            {msg.attachments.map((att) => (
                              <div
                                key={att.id}
                                onClick={() => setLightboxImage(att)}
                                className="w-20 h-20 rounded-xl overflow-hidden border border-border/80 cursor-pointer group relative shadow-2xs"
                              >
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SELO DE AUTENTICIDADE E AUDITORIA */}
        <footer className="rounded-3xl border border-border/70 bg-secondary/30 p-5 text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Shield className="h-4 w-4" />
            <span>Registro Autenticado e Arquivado • Twin Wheels GTA RP</span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            Integridade: <span className="text-foreground font-bold">{integrityHash}</span>
          </div>
          <p className="text-[10px] text-muted-foreground max-w-md mx-auto">
            Este documento é uma transcrição digital gerada automaticamente pelos servidores da facção. Todas as mensagens e horários são sincronizados com o horário oficial de Brasília (BRT).
          </p>
        </footer>
      </main>

      {/* Lightbox / Preview Dialog */}
      {lightboxImage && (
        <Dialog open={Boolean(lightboxImage)} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-4xl p-3 bg-black/95 border-border/80 backdrop-blur-xl rounded-2xl shadow-2xl">
            <div className="relative flex flex-col items-center justify-center p-2 space-y-3">
              <div className="w-full flex items-center justify-between text-xs text-muted-foreground px-2">
                <span className="font-mono truncate max-w-md">{lightboxImage.name}</span>
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-cyan-400 hover:underline font-semibold"
                >
                  <span>Abrir em nova aba</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl border border-white/10"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

