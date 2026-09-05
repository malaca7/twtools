import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
  Shield,
  SlidersHorizontal,
  ChevronRight,
  ArrowLeft,
  X,
  AlertTriangle,
  FolderOpen,
  Calendar,
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
  TICKET_STATUSES,
} from "@/types/tickets";
import { dateTime, formatTimeOnly } from "@/lib/format";
import { LEVEL_LABEL, levelBadgeClass } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tickets")({
  component: TicketsPage,
});

function TicketsPage() {
  const { user, profile, hasPermission } = useAuth();
  const isDevUser = Boolean(profile?.is_developer);
  const canView = hasPermission("view_tickets") || isDevUser;
  const canCreate = hasPermission("create_ticket") || isDevUser;
  const canManage = hasPermission("manage_tickets") || isDevUser;
  const canViewAll = hasPermission("view_all_tickets") || isDevUser;
  const canSeeAll = canViewAll || canManage || isDevUser;

  const { data: tickets = [], isLoading, isFetching } = useTickets();

  // State
  const [activeTab, setActiveTab] = useState<"my" | "all">("all");
  const [hasManuallySelectedTab, setHasManuallySelectedTab] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  // Sincronização inteligente da aba inicial:
  // Se o usuário tem permissão para ver todos os tickets (ou liderança/dev),
  // e ainda não alternou manualmente para "Meus Chamados", manter em "all" para exibir os chamados existentes.
  useEffect(() => {
    if (!hasManuallySelectedTab) {
      if (canSeeAll) {
        setActiveTab("all");
      } else {
        setActiveTab("my");
      }
    }
  }, [canSeeAll, hasManuallySelectedTab]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all"); // all, my_assigned, unassigned

  // Check access
  if (!canView) {
    return <NoAccess message="Você não tem permissão para acessar a área de Tickets / Ouvidoria." />;
  }

  // Estatísticas globais
  const stats = useMemo(() => {
    const total = tickets.length;
    const myCount = tickets.filter((t) => t.user_id === user?.id).length;
    const openCount = tickets.filter((t) => t.status === "aberto").length;
    const inProgressCount = tickets.filter(
      (t) => t.status === "em_atendimento" || t.status === "aguardando"
    ).length;
    const closedCount = tickets.filter(
      (t) => t.status === "resolvido" || t.status === "fechado"
    ).length;
    return { total, myCount, openCount, inProgressCount, closedCount };
  }, [tickets, user?.id]);

  // Filtragem dos tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Filtro por Aba
      if (activeTab === "my" && t.user_id !== user?.id) {
        return false;
      }

      // Filtro por termo de busca
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const numFormatted = formatTicketNumber(t.ticket_number).toLowerCase();
        const subjectMatch = t.subject.toLowerCase().includes(query);
        const descMatch = t.description.toLowerCase().includes(query);
        const authorMatch = (t.creator_nickname || t.creator_name).toLowerCase().includes(query);
        const assignedMatch = (t.assigned_to_nickname || t.assigned_to_name || "")
          .toLowerCase()
          .includes(query);
        const numMatch =
          numFormatted.includes(query) || t.ticket_number.toString().includes(query);

        if (!subjectMatch && !descMatch && !authorMatch && !assignedMatch && !numMatch) {
          return false;
        }
      }

      // Filtro por Categoria
      if (filterCategory !== "all" && t.category !== filterCategory) {
        return false;
      }

      // Filtro por Status
      if (filterStatus !== "all" && t.status !== filterStatus) {
        return false;
      }

      // Filtro por Prioridade
      if (filterPriority !== "all" && t.priority !== filterPriority) {
        return false;
      }

      // Filtro por Responsável
      if (filterAssignee === "my_assigned" && t.assigned_to_id !== user?.id) {
        return false;
      }
      if (filterAssignee === "unassigned" && t.assigned_to_id) {
        return false;
      }

      return true;
    });
  }, [tickets, activeTab, user?.id, searchTerm, filterCategory, filterStatus, filterPriority, filterAssignee]);

  // Selected ticket
  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  const hasActiveFilters =
    searchTerm ||
    filterCategory !== "all" ||
    filterStatus !== "all" ||
    filterPriority !== "all" ||
    filterAssignee !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterAssignee("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* 1. Cabeçalho Principal */}
      <PageHeader
        title="Tickets / Ouvidoria"
        description="Canal confidencial de solicitações, denúncias, reembolsos e ouvidoria direta com a gerência Twin Wheels."
        actions={
          canCreate ? (
            <Button
              size="sm"
              onClick={() => setIsNewDialogOpen(true)}
              className="h-9 gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-md shadow-amber-500/10"
            >
              <Plus className="h-4 w-4" />
              Novo Chamado
            </Button>
          ) : undefined
        }
      />

      {/* 2. Cards de Métricas & Indicadores */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-card/70 border-border/80">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                Total
              </span>
              <p className="text-xl font-bold font-mono text-foreground">{stats.total}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/80 text-muted-foreground">
              <LifeBuoy className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                Meus Chamados
              </span>
              <p className="text-xl font-bold font-mono text-sky-400">{stats.myCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <User className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                Abertos
              </span>
              <p className="text-xl font-bold font-mono text-emerald-400">{stats.openCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                Em Atendimento
              </span>
              <p className="text-xl font-bold font-mono text-amber-400">
                {stats.inProgressCount}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <MessageSquare className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/80 col-span-2 sm:col-span-1">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                Concluídos
              </span>
              <p className="text-xl font-bold font-mono text-zinc-400">{stats.closedCount}</p>
            </div>
            <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Barra de Abas e Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Abas: Meus vs Todos */}
          {canSeeAll ? (
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setHasManuallySelectedTab(true);
                setActiveTab(val as "my" | "all");
              }}
              className="w-full sm:w-auto"
            >
              <TabsList className="bg-secondary/60 border border-border/80 p-0.5 h-9">
                <TabsTrigger value="all" className="text-xs px-3 gap-1.5 font-medium">
                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                  Todos os Chamados
                  <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1 border-border bg-background">
                    {stats.total}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="my" className="text-xs px-3 gap-1.5 font-medium">
                  <User className="h-3.5 w-3.5 text-sky-400" />
                  Meus Chamados
                  <Badge variant="outline" className="ml-1 text-[10px] py-0 px-1 border-border bg-background">
                    {stats.myCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs px-2.5 py-1 gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-400">
                <User className="h-3.5 w-3.5" />
                Meus Chamados Abertos ({stats.myCount})
              </Badge>
            </div>
          )}

          {/* Busca Textual */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar #número, assunto, autor..."
              className="pl-8 h-9 text-xs bg-secondary/30 border-border"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Linha de Dropdowns de Filtro */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
          {/* Categoria */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 text-xs bg-secondary/30 border-border">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-xs">
                Todas as Categorias
              </SelectItem>
              {TICKET_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-xs">
                  {cat.emoji} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs bg-secondary/30 border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-xs">
                Todos os Status
              </SelectItem>
              {TICKET_STATUSES.map((st) => (
                <SelectItem key={st.id} value={st.id} className="text-xs">
                  {st.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Prioridade */}
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-8 text-xs bg-secondary/30 border-border">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-xs">
                Todas as Prioridades
              </SelectItem>
              {TICKET_PRIORITIES.map((pri) => (
                <SelectItem key={pri.id} value={pri.id} className="text-xs">
                  {pri.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Responsável (quando visualizando todos) */}
          {canViewAll && activeTab === "all" && (
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="h-8 text-xs bg-secondary/30 border-border">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all" className="text-xs">
                  Todos os Responsáveis
                </SelectItem>
                <SelectItem value="my_assigned" className="text-xs">
                  Atribuídos a Mim
                </SelectItem>
                <SelectItem value="unassigned" className="text-xs">
                  Sem Responsável
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1"
            >
              <X className="h-3 w-3" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* 4. Layout Principal: Lista de Tickets + Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[550px]">
        {/* Coluna da Lista de Tickets */}
        <div
          className={cn(
            "space-y-2.5 transition-all",
            selectedTicket
              ? "hidden lg:block lg:col-span-5 xl:col-span-4"
              : "col-span-12"
          )}
        >
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center border border-border/80 rounded-xl bg-card/40 space-y-3">
              <LifeBuoy className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {hasActiveFilters
                    ? "Nenhum chamado encontrado para os filtros selecionados."
                    : "Nenhum chamado registrado no momento."}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {hasActiveFilters
                    ? "Tente ajustar ou limpar os filtros para visualizar outros chamados."
                    : "Precisa de ajuda, tem uma denúncia ou solicitação? Abra um chamado diretamente para a gerência."}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs">
                  Limpar Filtros
                </Button>
              ) : (
                canCreate && (
                  <Button
                    size="sm"
                    onClick={() => setIsNewDialogOpen(true)}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Abrir Chamado Agora
                  </Button>
                )
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicketId === t.id;
                const cat = getCategoryInfo(t.category);
                const pri = getPriorityInfo(t.priority);
                const st = getStatusInfo(t.status);
                const msgCount = (t.messages || []).length;
                const hasAttachments = (t.attachments && t.attachments.length > 0) || false;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={cn(
                      "group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-2.5",
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30"
                        : "bg-card/70 border-border/70 hover:bg-card hover:border-border hover:shadow-sm"
                    )}
                  >
                    {/* Topo do card: Número, Categoria, Status, Prioridade */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {formatTicketNumber(t.ticket_number)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0 gap-1", cat.badgeClass)}
                        >
                          <span>{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0", st.badgeClass)}
                        >
                          {st.label}
                        </Badge>
                        <span
                          className={cn("h-2 w-2 rounded-full shrink-0", pri.dotClass)}
                          title={`Prioridade: ${pri.label}`}
                        />
                      </div>
                    </div>

                    {/* Assunto e Snippet da Descrição */}
                    <div className="space-y-1">
                      <h4
                        className={cn(
                          "text-sm font-semibold leading-tight transition-colors line-clamp-1",
                          isSelected ? "text-amber-300" : "text-foreground group-hover:text-amber-400"
                        )}
                      >
                        {t.subject}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    </div>

                    {/* Rodapé do Card: Autor, Responsável, Data, Mensagens */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                      <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={t.creator_avatar || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {t.creator_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground truncate font-medium">
                          {t.creator_nickname || t.creator_name}
                        </span>
                        {t.assigned_to_name && (
                          <span className="text-[10px] text-sky-400/90 truncate">
                            • Resp: {t.assigned_to_nickname || t.assigned_to_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {hasAttachments && (
                          <span className="flex items-center gap-0.5 text-muted-foreground" title="Possui anexos">
                            <Paperclip className="h-3 w-3" />
                            <span className="text-[10px]">{t.attachments?.length}</span>
                          </span>
                        )}

                        {msgCount > 0 && (
                          <span className="flex items-center gap-0.5 text-muted-foreground" title="Mensagens">
                            <MessageSquare className="h-3 w-3" />
                            <span className="text-[10px]">{msgCount}</span>
                          </span>
                        )}

                        <span className="text-[10px] text-muted-foreground/80">
                          {formatTimeOnly(t.updated_at || t.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna de Detalhes / Conversação do Ticket */}
        {selectedTicket ? (
          <div className="col-span-12 lg:col-span-7 xl:col-span-8 h-[750px]">
            {/* Botão de voltar visível no mobile */}
            <div className="lg:hidden pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTicketId(null)}
                className="h-8 text-xs gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar para Lista
              </Button>
            </div>
            <TicketDetailView
              ticket={selectedTicket}
              onClose={() => setSelectedTicketId(null)}
              canManage={canManage}
            />
          </div>
        ) : (
          /* Estado vazio quando nenhum ticket está selecionado no desktop */
          <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 h-[600px] border border-border/60 rounded-xl bg-card/20 items-center justify-center p-8 text-center flex-col gap-3">
            <div className="p-4 rounded-full bg-secondary/50 border border-border/80 text-muted-foreground">
              <LifeBuoy className="h-8 w-8 text-amber-400/70" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Nenhum chamado selecionado
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Selecione um chamado na lista ao lado para visualizar os detalhes, responder ou gerenciar o atendimento.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 5. Modal Novo Chamado */}
      <NewTicketDialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />
    </div>
  );
}
