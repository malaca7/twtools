import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Paperclip,
  User,
  ChevronRight,
  ArrowLeft,
  X,
  AlertTriangle,
  FolderOpen,
  Calendar,
  Lock,
  Headphones,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader, NoAccess, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useSyncedUrlParam } from "@/hooks/useUrlTab";
import { useTickets } from "@/hooks/useTickets";
import { NewTicketDialog } from "@/components/tickets/NewTicketDialog";
import { TicketDetailView } from "@/components/tickets/TicketDetailView";
import {
  type Ticket,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
  formatTicketNumber,
  getCategoryInfo,
  getPriorityInfo,
  getStatusInfo,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "@/types/tickets";
import { dateTime, formatTimeOnly } from "@/lib/format";
import { LEVEL_LABEL } from "@/lib/permissions";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tickets")({
  component: TicketsWrapper,
});

function TicketsWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <TicketsPage />;
}

export function TicketsPage() {
  const { hasPermission, loading } = useAuth();
  const canView = hasPermission("view_tickets");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!canView) {
    return (
      <NoAccess message="Você não possui permissão para acessar a área de Tickets / Ouvidoria." />
    );
  }

  return <TicketsContent />;
}

function TicketsContent() {
  const { user, profile, hasPermission } = useAuth();
  const canCreate = hasPermission("create_ticket");
  const canReply = hasPermission("reply_tickets") || hasPermission("reply_ticket" as any);

  const { data: tickets = [], isLoading, refetch } = useTickets();

  // Filtrar estritamente apenas chamados pertencentes ao membro autenticado (ou onde ele é participante convidado)
  const myTickets = useMemo(() => {
    if (!user?.id) return [];
    return tickets.filter(
      (t) =>
        t.user_id === user.id ||
        (t.members || []).some((m) => m.user_id === user.id)
    );
  }, [tickets, user?.id]);

  // Sincronização do ticket selecionado na URL (?ticket=id)
  const [ticketParam, setTicketParam] = useSyncedUrlParam<string>("ticket", "");
  const selectedTicketId = ticketParam || null;
  const setSelectedTicketId = (id: string | null) => setTicketParam(id || "");

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Ticket atualmente selecionado para exibição detalhada
  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return myTickets.find((t) => t.id === selectedTicketId) || null;
  }, [selectedTicketId, myTickets]);

  // Se o ticket selecionado não existe mais nos chamados do membro, fecha a visualização
  useEffect(() => {
    if (selectedTicketId && !selectedTicket && !isLoading) {
      setSelectedTicketId(null);
    }
  }, [selectedTicketId, selectedTicket, isLoading]);

  // Métricas do membro
  const stats = useMemo(() => {
    let active = 0;
    let waitingMember = 0;
    let resolved = 0;
    for (const t of myTickets) {
      if (t.status === "aberto" || t.status === "em_atendimento") {
        active++;
      } else if (t.status === "aguardando_membro") {
        waitingMember++;
      } else if (t.status === "resolvido" || t.status === "fechado") {
        resolved++;
      }
    }
    return {
      active,
      waitingMember,
      resolved,
      total: myTickets.length,
    };
  }, [myTickets]);

  // Filtros aplicados sobre os chamados do membro
  const filteredTickets = useMemo(() => {
    return myTickets.filter((t) => {
      // Filtro de status
      if (statusFilter !== "all") {
        if (statusFilter === "active") {
          if (t.status !== "aberto" && t.status !== "em_atendimento") return false;
        } else if (statusFilter === "resolved") {
          if (t.status !== "resolvido" && t.status !== "fechado") return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }

      // Filtro de categoria
      if (categoryFilter !== "all" && t.category !== categoryFilter) {
        return false;
      }

      // Filtro de prioridade
      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false;
      }

      // Filtro de texto de busca
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const numStr = formatTicketNumber(t.ticket_number).toLowerCase();
        const subj = (t.subject || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        if (
          !numStr.includes(query) &&
          !subj.includes(query) &&
          !desc.includes(query) &&
          !cat.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [myTickets, statusFilter, categoryFilter, priorityFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Principal da Página de Membro */}
      <PageHeader
        icon={LifeBuoy}
        title="Tickets & Ouvidoria"
        description="Canal interno e exclusivo para membros abrirem solicitações, dúvidas, denúncias, reembolsos e acompanharem seus chamados."
        badge={
          <Badge
            variant="outline"
            className="text-xs font-mono border-amber-500/40 text-amber-400 bg-amber-500/10 gap-1.5"
          >
            <LifeBuoy className="h-3 w-3" />
            Portal do Membro
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-9 gap-1.5 text-xs border-border/80 hover:bg-secondary/60"
              title="Atualizar lista de chamados"
            >
              <RotateCcw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>

            {canCreate ? (
              <Button
                size="sm"
                onClick={() => setIsNewDialogOpen(true)}
                className="h-9 gap-1.5 text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 shadow-md shadow-amber-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Abrir Novo Chamado</span>
              </Button>
            ) : (
              <Button
                size="sm"
                disabled
                variant="outline"
                className="h-9 gap-1.5 text-xs opacity-60 cursor-not-allowed border-dashed"
                title="Você não tem permissão para abrir novos tickets"
              >
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>Criação Bloqueada</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Cards de Métricas & Resumo Pessoal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="surface-card border-border/60 hover:border-amber-500/40 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Em Andamento
              </span>
              <p className="text-2xl font-black text-amber-400">{stats.active}</p>
              <span className="text-[10px] text-muted-foreground">
                Sendo atendidos pela gerência
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-border/60 hover:border-sky-500/40 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Aguardando Você
              </span>
              <p className="text-2xl font-black text-sky-400">{stats.waitingMember}</p>
              <span className="text-[10px] text-muted-foreground">
                Aguardando sua réplica
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-border/60 hover:border-emerald-500/40 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Concluídos
              </span>
              <p className="text-2xl font-black text-emerald-400">{stats.resolved}</p>
              <span className="text-[10px] text-muted-foreground">
                Resolvidos com sucesso
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-border/60 hover:border-primary/40 transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total de Chamados
              </span>
              <p className="text-2xl font-black text-foreground">{stats.total}</p>
              <span className="text-[10px] text-muted-foreground">
                Seu histórico registrado
              </span>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <FolderOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal: Modo Split / Detalhes do Chamado ou Lista */}
      {selectedTicket ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-secondary/30 border border-border/60 p-3 rounded-xl">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTicketId(null)}
              className="h-8 gap-1.5 text-xs border-border/80 hover:bg-secondary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar para Meus Chamados</span>
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Visualizando chamado</span>
              <span className="font-mono font-bold text-amber-400">
                {formatTicketNumber(selectedTicket.ticket_number)}
              </span>
            </div>
          </div>

          <div className="h-[750px] min-h-[600px]">
            <TicketDetailView
              ticket={selectedTicket}
              onClose={() => setSelectedTicketId(null)}
              canManage={false}
              isMemberPortal={true}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Barra de Filtros, Abas de Status e Busca */}
          <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs space-y-3.5">
            {/* Abas Rápidas de Status */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
              <TabsList className="bg-secondary/40 border border-border/60 p-1 rounded-xl h-auto flex flex-wrap gap-1">
                <TabsTrigger
                  value="all"
                  className="text-xs font-bold py-1.5 px-3 rounded-lg data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                >
                  Todos ({myTickets.length})
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="text-xs font-bold py-1.5 px-3 rounded-lg data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
                >
                  Em Aberto ({stats.active})
                </TabsTrigger>
                <TabsTrigger
                  value="aguardando_membro"
                  className="text-xs font-bold py-1.5 px-3 rounded-lg data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400"
                >
                  Aguardando Você ({stats.waitingMember})
                </TabsTrigger>
                <TabsTrigger
                  value="resolved"
                  className="text-xs font-bold py-1.5 px-3 rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
                >
                  Concluídos ({stats.resolved})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Controles de Busca & Selects */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar pelo assunto, descrição ou #número do chamado..."
                  className="pl-9 h-9 text-xs rounded-xl bg-secondary/30 border-border/60"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Select Categoria */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-secondary/30 border-border/60 w-full sm:w-[170px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">Todas Categorias</SelectItem>
                  {TICKET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-1.5">
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Select Prioridade */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-secondary/30 border-border/60 w-full sm:w-[150px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="all">Todas Prioridades</SelectItem>
                  {TICKET_PRIORITIES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Listagem de Chamados do Membro */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
              <p className="text-xs text-muted-foreground">Carregando seus chamados...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <LifeBuoy className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-foreground">
                {myTickets.length === 0
                  ? "Você ainda não possui nenhum chamado aberto"
                  : "Nenhum chamado encontrado com os filtros aplicados"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {myTickets.length === 0
                  ? "Precisa de ajuda, tem alguma dúvida, denúncia ou solicitação de reembolso? Abra um novo chamado para falar diretamente com a gerência."
                  : "Tente redefinir a busca ou alternar os filtros de status e categoria para visualizar outros chamados."}
              </p>
              {myTickets.length === 0 && canCreate && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => setIsNewDialogOpen(true)}
                    className="h-8 gap-1.5 text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Abrir Primeiro Chamado
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredTickets.map((t) => {
                const catInfo = getCategoryInfo(t.category);
                const priorityInfo = getPriorityInfo(t.priority);
                const statusInfo = getStatusInfo(t.status);
                const messageCount = (t.messages || []).filter((m) => !m.is_internal_note).length;
                const attachmentCount = (t.attachments || []).length;
                const isWaitingMember = t.status === "aguardando_membro";

                return (
                  <Card
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={cn(
                      "surface-card border-border/70 hover:border-amber-500/60 hover:shadow-md cursor-pointer transition-all duration-200 group overflow-hidden",
                      isWaitingMember && "border-sky-500/50 bg-sky-500/[0.02]"
                    )}
                  >
                    <CardContent className="p-4 sm:p-5 space-y-3">
                      {/* Topo do Card: Número, Badges & Atendente */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {formatTicketNumber(t.ticket_number)}
                          </span>

                          <Badge
                            variant="outline"
                            className={cn("text-[11px] font-medium gap-1", catInfo.badgeClass)}
                          >
                            <span>{catInfo.emoji}</span>
                            <span>{catInfo.label}</span>
                          </Badge>

                          <Badge
                            variant="outline"
                            className={cn("text-[11px] font-medium", priorityInfo.badgeClass)}
                          >
                            <span
                              className={cn("h-1.5 w-1.5 rounded-full mr-1", priorityInfo.dotClass)}
                            />
                            {priorityInfo.label}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={cn("text-[11px] font-medium", statusInfo.badgeClass)}
                          >
                            {statusInfo.label}
                          </Badge>
                        </div>

                        {/* Atendente Responsável (Apenas visualização para o membro) */}
                        <div className="flex items-center gap-1.5 text-xs">
                          {t.assigned_to_name ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/60 border border-border/60">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={t.assigned_to_avatar || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {(t.assigned_to_nickname || t.assigned_to_name || "AT")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[11px] font-medium text-sky-400 inline-flex items-center gap-1">
                                <span>{t.assigned_to_nickname || t.assigned_to_name}</span>
                                <VerifiedBadge userId={t.assigned_to_id} size="xs" />
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                              <Headphones className="h-3 w-3" />
                              Aguardando atendente...
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Assunto & Descrição Resumida */}
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-bold text-foreground group-hover:text-amber-400 transition-colors line-clamp-1">
                          {t.subject}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      </div>

                      {/* Rodapé do Card: Datas, Contadores & Ação */}
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Aberto em {dateTime(t.created_at)}
                          </span>

                          <span>•</span>

                          <span className="flex items-center gap-1 text-foreground/80 font-medium">
                            <MessageSquare className="h-3 w-3 text-amber-400" />
                            {messageCount} {messageCount === 1 ? "mensagem" : "mensagens"}
                          </span>

                          {attachmentCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-foreground/80 font-medium">
                                <Paperclip className="h-3 w-3 text-sky-400" />
                                {attachmentCount} {attachmentCount === 1 ? "anexo" : "anexos"}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-amber-400 font-semibold text-xs ml-auto group-hover:translate-x-0.5 transition-transform">
                          <span>Acompanhar Chamado</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Abertura de Novo Chamado */}
      <NewTicketDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onSuccess={(newId) => {
          setSelectedTicketId(newId);
          void refetch();
        }}
      />
    </div>
  );
}
