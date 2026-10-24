import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import {
  Headphones,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Paperclip,
  User,
  Shield,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  X,
  AlertTriangle,
  FolderOpen,
  Calendar,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  Check,
  Zap,
  Sparkles,
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
import { useUrlTab, useSyncedUrlParam } from "@/hooks/useUrlTab";
import { useTickets, useClaimTicket } from "@/hooks/useTickets";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  TICKET_STATUSES,
} from "@/types/tickets";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { dateTime, formatTimeOnly } from "@/lib/format";
import { LEVEL_LABEL, levelBadgeClass, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/atendimento-tickets")({
  component: AtendimentoTicketsWrapper,
});

function AtendimentoTicketsWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <AtendimentoTicketsPage />;
}

export function AtendimentoTicketsPage() {
  const { hasPermission, loading } = useAuth();
  const canAccess =
    hasPermission("atendimento_tickets.view" as Permission) ||
    hasPermission("manage_tickets");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <NoAccess message="Você não tem permissão para acessar a central de Atendimento de Tickets." />
    );
  }

  return <AtendimentoTicketsContent />;
}

export function AtendimentoTicketsContent() {
  const { user, profile, hasPermission } = useAuth();
  const canManage = hasPermission("manage_tickets");
  const canClaim = hasPermission("claim_tickets") || hasPermission("claim_ticket" as Permission) || canManage;
  const canCreate = hasPermission("create_ticket") || canManage;
  const canViewAll = hasPermission("view_all_tickets") || canManage;

  const { data: tickets = [], isLoading, isFetching } = useTickets();
  const claimMutation = useClaimTicket();

  // Tab de filtro de atendimento (?tab=all | assigned_me | unassigned | urgent | closed)
  const [activeTab, setActiveTab] = useUrlTab<
    "all" | "assigned_me" | "unassigned" | "urgent" | "closed"
  >("all", {
    paramName: "tab",
    allowedTabs: ["all", "assigned_me", "unassigned", "urgent", "closed"],
  });

  const [ticketParam, setTicketParam] = useSyncedUrlParam<string>("ticket", "");
  const selectedTicketId = ticketParam || null;
  const setSelectedTicketId = (id: string | null) => setTicketParam(id || "");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  // Filtros locais
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  // Limpar seleção caso o ticket selecionado seja excluído em tempo real
  useEffect(() => {
    if (selectedTicketId && tickets.length > 0 && !tickets.some((t) => t.id === selectedTicketId)) {
      setSelectedTicketId(null);
    }
  }, [tickets, selectedTicketId, setSelectedTicketId]);

  // Contadores operacionais (respeitando view_all_tickets)
  const stats = useMemo(() => {
    const list = canViewAll
      ? tickets
      : tickets.filter(
          (t) =>
            t.assigned_to_id === user?.id ||
            t.user_id === user?.id ||
            (t.members || []).some((m) => m.user_id === user?.id)
        );
    const total = list.length;
    const assignedMe = list.filter((t) => t.assigned_to_id === user?.id && t.status !== "fechado").length;
    const unassigned = list.filter((t) => !t.assigned_to_id && t.status !== "fechado").length;
    const urgent = list.filter((t) => (t.priority === "urgente" || t.priority === "alta") && t.status !== "fechado").length;
    const closed = list.filter((t) => t.status === "fechado").length;
    const inProgress = list.filter((t) => t.status === "em_atendimento").length;

    return { total, assignedMe, unassigned, urgent, closed, inProgress };
  }, [tickets, user?.id, canViewAll]);

  // Filtragem dos tickets para a lista de atendimento
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Se não possui view_all_tickets nem canManage, só vê chamados atribuídos a si, onde participa ou onde é criador
      if (
        !canViewAll &&
        t.assigned_to_id !== user?.id &&
        t.user_id !== user?.id &&
        !(t.members || []).some((m) => m.user_id === user?.id)
      ) {
        return false;
      }

      // 1. Tab filtro
      if (activeTab === "assigned_me") {
        if (t.assigned_to_id !== user?.id || t.status === "fechado") return false;
      } else if (activeTab === "unassigned") {
        if (Boolean(t.assigned_to_id) || t.status === "fechado") return false;
      } else if (activeTab === "urgent") {
        if ((t.priority !== "urgente" && t.priority !== "alta") || t.status === "fechado") return false;
      } else if (activeTab === "closed") {
        if (t.status !== "fechado") return false;
      } else if (activeTab === "all") {
        // Exibe todos os tickets em 'all'
      }

      // 2. Categoria
      if (filterCategory !== "all" && t.category !== filterCategory) {
        return false;
      }

      // 3. Prioridade
      if (filterPriority !== "all" && t.priority !== filterPriority) {
        return false;
      }

      // 4. Busca por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const numFormatted = formatTicketNumber(t.ticket_number).toLowerCase();
        const subject = t.subject.toLowerCase();
        const creator = (t.creator_name || "").toLowerCase();
        const nickname = (t.creator_nickname || "").toLowerCase();
        const assignee = (t.assigned_to_name || "").toLowerCase();

        return (
          numFormatted.includes(query) ||
          t.ticket_number.toString().includes(query) ||
          subject.includes(query) ||
          creator.includes(query) ||
          nickname.includes(query) ||
          assignee.includes(query)
        );
      }

      return true;
    });
  }, [tickets, activeTab, user?.id, searchTerm, filterCategory, filterPriority]);

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const handleClaimTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await claimMutation.mutateAsync(ticketId);
      toast.success("Você assumiu o atendimento deste ticket!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao assumir ticket");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <PageHeader
        title="Atendimento Ticket"
        description="Central operacional de triagem, atendimento rápido, transferência e encerramento de chamados."
        icon={Headphones}
        action={
          canCreate ? (
            <Button
              onClick={() => setIsNewDialogOpen(true)}
              className="gap-2 font-bold shadow-lg bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-600 text-primary-foreground border-none rounded-xl"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Chamado</span>
            </Button>
          ) : undefined
        }
      />

      {/* DASHBOARD DE MÉTRICAS OPERACIONAIS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card Todos os Tickets */}
        <Card
          onClick={() => setActiveTab("all")}
          className={cn(
            "surface-card border-border/80 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]",
            activeTab === "all" ? "ring-2 ring-cyan-500 border-cyan-500/50 bg-cyan-500/5" : ""
          )}
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Todos os Tickets
              </p>
              <p className="text-2xl font-black text-cyan-400 font-mono">{stats.total}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Headphones className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card Meus Atendimentos */}
        <Card
          onClick={() => setActiveTab("assigned_me")}
          className={cn(
            "surface-card border-border/80 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]",
            activeTab === "assigned_me" ? "ring-2 ring-primary border-primary/50 bg-primary/5" : ""
          )}
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Meus Atendimentos
              </p>
              <p className="text-2xl font-black text-primary font-mono">{stats.assignedMe}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card Fila Aberta */}
        <Card
          onClick={() => setActiveTab("unassigned")}
          className={cn(
            "surface-card border-border/80 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]",
            activeTab === "unassigned" ? "ring-2 ring-amber-500 border-amber-500/50 bg-amber-500/5" : ""
          )}
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Sem Atendente
              </p>
              <p className="text-2xl font-black text-amber-400 font-mono">{stats.unassigned}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card Urgentes */}
        <Card
          onClick={() => setActiveTab("urgent")}
          className={cn(
            "surface-card border-border/80 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]",
            activeTab === "urgent" ? "ring-2 ring-rose-500 border-rose-500/50 bg-rose-500/5" : ""
          )}
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Urgentes / Alta
              </p>
              <p className="text-2xl font-black text-rose-400 font-mono">{stats.urgent}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Card Finalizados */}
        <Card
          onClick={() => setActiveTab("closed")}
          className={cn(
            "surface-card border-border/80 shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] col-span-2 sm:col-span-1",
            activeTab === "closed" ? "ring-2 ring-emerald-500 border-emerald-500/50 bg-emerald-500/5" : ""
          )}
        >
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Finalizados
              </p>
              <p className="text-2xl font-black text-emerald-400 font-mono">{stats.closed}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ABAS OPERACIONAIS E FILTROS DE PESQUISA */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <Tabs
            value={activeTab}
            onValueChange={(val: any) => setActiveTab(val)}
            className="w-full md:w-auto"
          >
            <TabsList className="bg-secondary/60 border border-border/50 p-1 rounded-xl w-full md:w-auto grid grid-cols-3 sm:grid-cols-5 gap-1 h-auto">
              <TabsTrigger
                value="all"
                className="gap-1.5 text-xs font-bold data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 py-2 rounded-lg"
              >
                <Headphones className="h-3.5 w-3.5" />
                <span>Todos os Tickets</span>
                {stats.total > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                    {stats.total}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="assigned_me"
                className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-2 rounded-lg"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Atribuídos</span>
                {stats.assignedMe > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono">
                    {stats.assignedMe}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="unassigned"
                className="gap-1.5 text-xs font-bold data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 py-2 rounded-lg"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Sem Atendente</span>
                {stats.unassigned > 0 && (
                  <Badge className="ml-1 px-1.5 py-0 text-[10px] font-mono bg-amber-500/30 text-amber-200 border border-amber-500/40">
                    {stats.unassigned}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="urgent"
                className="gap-1.5 text-xs font-bold data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300 py-2 rounded-lg"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <span>Urgentes</span>
              </TabsTrigger>

              <TabsTrigger
                value="closed"
                className="gap-1.5 text-xs font-bold data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 py-2 rounded-lg col-span-2 sm:col-span-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Finalizados</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* BARRA DE PESQUISA E SELEÇÃO DE CATEGORIA */}
          <div className="flex items-center gap-2 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por #, assunto, autor ou atendente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-secondary/40 border-border/60 rounded-xl text-xs h-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-36 bg-secondary/40 border-border/60 rounded-xl text-xs h-10">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {TICKET_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* LISTA DE CARDS DE ATENDIMENTO DE TICKETS */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-secondary/20 border border-border/40 animate-pulse"
              />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            icon={Headphones}
            title="Nenhum ticket encontrado nesta fila"
            description={
              searchTerm || filterCategory !== "all"
                ? "Tente ajustar os termos da busca ou filtros selecionados."
                : activeTab === "assigned_me"
                ? "Você não possui chamados atribuídos a você no momento."
                : activeTab === "unassigned"
                ? "Excelente! Não há chamados aguardando atendimento na fila aberta."
                : "Não há registros de chamados nesta categoria."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTickets.map((ticket) => {
              const catInfo = getCategoryInfo(ticket.category);
              const priorityInfo = getPriorityInfo(ticket.priority);
              const statusInfo = getStatusInfo(ticket.status);
              const isClosed = ticket.status === "fechado";
              const isMyAssignment = ticket.assigned_to_id === user?.id;
              const hasNoAssignee = !ticket.assigned_to_id;
              const msgCount = (ticket.messages || []).length;
              const attachCount = (ticket.attachments || []).length;

              return (
                <Card
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={cn(
                    "surface-card border-border/80 rounded-2xl shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer relative overflow-hidden group flex flex-col justify-between",
                    isMyAssignment ? "border-l-4 border-l-primary" : "",
                    hasNoAssignee && !isClosed ? "border-l-4 border-l-amber-500" : "",
                    ticket.priority === "urgente" && !isClosed ? "ring-1 ring-rose-500/40" : ""
                  )}
                >
                  <CardContent className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* HEADER DO CARD: TICKET NUMBER, BADGES & STATUS */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-secondary border border-border/60 text-foreground">
                            {formatTicketNumber(ticket.ticket_number)}
                          </span>

                          <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", catInfo?.badgeClass)}>
                            {catInfo?.label || ticket.category}
                          </Badge>

                          <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", priorityInfo?.badgeClass)}>
                            {priorityInfo?.label || ticket.priority}
                          </Badge>
                        </div>

                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", statusInfo?.badgeClass)}>
                          {statusInfo?.label || ticket.status}
                        </Badge>
                      </div>

                      {/* ASSUNTO DO TICKET */}
                      <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {ticket.subject}
                      </h3>

                      {/* DESCRIÇÃO DA SOLICITAÇÃO */}
                      <p className="text-xs text-muted-foreground/90 line-clamp-2 mt-1 leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>

                    {/* FOOTER DO CARD: AUTOR, ATENDENTE E AÇÕES RÁPIDAS */}
                    <div className="pt-3 border-t border-border/50 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                        {/* Autor do Ticket */}
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-6 w-6 border border-border/60 shrink-0">
                            {ticket.creator_avatar && <AvatarImage src={ticket.creator_avatar} alt={ticket.creator_name} />}
                            <AvatarFallback className="text-[9px] font-bold bg-primary/20 text-primary">
                              {(ticket?.creator_name || ticket?.creator_nickname || "TC").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate font-semibold text-foreground/90 inline-flex items-center gap-1">
                            <span>{ticket.creator_nickname || ticket.creator_name}</span>
                            <VerifiedBadge userId={ticket.creator_id} isVerified={ticket.creator_is_verified} size="xs" />
                          </span>
                        </div>

                        {/* Status de Atribuição */}
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          {ticket.assigned_to_name ? (
                            <span className="inline-flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                              <UserCheck className="h-3 w-3" />
                              <span className="truncate max-w-[100px]">{ticket.assigned_to_name}</span>
                              <VerifiedBadge userId={ticket.assigned_to_id} size="xs" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              <UserPlus className="h-3 w-3" /> Sem Atendente
                            </span>
                          )}
                        </div>
                      </div>

                      {/* BARRINHA DE BOTÕES DE AÇÃO RÁPIDA */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-primary/70" />
                            {dateTime(ticket.created_at)}
                          </span>
                          {msgCount > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {msgCount}
                            </span>
                          )}
                          {attachCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {attachCount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {hasNoAssignee && !isClosed && canClaim && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => handleClaimTicket(ticket.id, e)}
                              className="h-7 px-2.5 text-[11px] font-bold gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg"
                            >
                              <Zap className="h-3 w-3" /> Assumir
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="h-7 px-3 text-[11px] font-bold gap-1 rounded-lg shadow-xs"
                          >
                            <span>Atender</span>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DETALHADO DO TICKET (TICKET DETAIL VIEW) */}
      {selectedTicket && (
        <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
          <DialogContent className="max-w-4xl h-[90vh] sm:h-[86vh] p-0 overflow-hidden border-border bg-card shadow-2xl flex flex-col">
            <TicketDetailView
              ticket={selectedTicket}
              onClose={() => setSelectedTicketId(null)}
              canManage={canManage}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* DIÁLOGO PARA CRIAR NOVO TICKET */}
      <NewTicketDialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />
    </div>
  );
}
