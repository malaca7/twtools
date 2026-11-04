import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  Eye,
  ArrowUpDown,
  RotateCcw,
  IdCard,
  Copy,
  LayoutGrid,
  List,
  RefreshCw,
  Radio,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const PRIORITY_RANK: Record<string, number> = {
  urgente: 4,
  alta: 3,
  media: 2,
  baixa: 1,
};

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Agora";
    if (mins < 60) return `Há ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Há ${days}d`;
  } catch {
    return "";
  }
}

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
    hasPermission("view_atendimento_tickets" as Permission);

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
  const canAccess =
    hasPermission("atendimento_tickets.view" as Permission) ||
    hasPermission("view_atendimento_tickets" as Permission);

  if (!canAccess) {
    return (
      <NoAccess message="Você não tem permissão para acessar a central de Atendimento de Tickets." />
    );
  }

  const canManage = hasPermission("manage_tickets");
  const canClaim = hasPermission("claim_tickets") || hasPermission("claim_ticket" as Permission);
  const canCreate = hasPermission("create_ticket") || canManage;
  const canViewAll = hasPermission("view_all_tickets") || canManage;

  const { data: tickets = [], isLoading, isFetching } = useTickets();
  const queryClient = useQueryClient();
  const claimMutation = useClaimTicket();

  // Auto ativar e sincronizar visualização na página automaticamente quando a permissão mudar em tempo real
  const prevCanViewAllRef = useRef(canViewAll);
  useEffect(() => {
    if (prevCanViewAllRef.current !== canViewAll) {
      prevCanViewAllRef.current = canViewAll;
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      if (canViewAll) {
        toast.success("Fila geral de atendimento auto-ativada e sincronizada! 🎧", {
          id: "atendimento-perm-sync",
        });
      } else {
        toast.info("Visualização sincronizada: restrita aos seus chamados de atendimento.", {
          id: "atendimento-perm-sync",
        });
      }
    }
  }, [canViewAll, queryClient]);

  // Tab de filtro de atendimento (?tab=all | assigned_me | unassigned | urgent | closed)
  const [activeTab, setActiveTab] = useUrlTab<
    "all" | "assigned_me" | "unassigned" | "urgent" | "closed"
  >("all", {
    paramName: "tab",
    allowedTabs: ["all", "assigned_me", "unassigned", "urgent", "closed"],
    usePath: false,
  });

  const [ticketParam, setTicketParam] = useSyncedUrlParam<string>("ticket", "");
  const selectedTicketId = ticketParam || null;
  const setSelectedTicketId = (id: string | null) => setTicketParam(id || "");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  // Modo de visualização da fila (Cards visuais ou Tabela operacional densa)
  const [viewMode, setViewMode] = useState<"cards" | "table">(() => {
    if (typeof window === "undefined") return "cards";
    return (localStorage.getItem("tw_atendimento_view_mode") as "cards" | "table") || "cards";
  });

  const handleToggleViewMode = (mode: "cards" | "table") => {
    setViewMode(mode);
    try {
      localStorage.setItem("tw_atendimento_view_mode", mode);
    } catch {}
  };

  // Sincronização manual com animação
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["tickets"] });
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Fila de atendimento sincronizada em tempo real! 🎧", {
        id: "manual-ticket-refresh",
      });
    }, 350);
  };

  // Filtros locais avançados
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority" | "messages">("newest");

  const isAnyFilterActive =
    Boolean(searchTerm.trim()) ||
    filterCategory !== "all" ||
    filterPriority !== "all" ||
    filterStatus !== "all" ||
    filterAssignee !== "all" ||
    sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterPriority("all");
    setFilterStatus("all");
    setFilterAssignee("all");
    setSortBy("newest");
  };

  // Limpar seleção caso o ticket selecionado seja excluído em tempo real
  useEffect(() => {
    if (selectedTicketId && tickets.length > 0 && !tickets.some((t) => t.id === selectedTicketId)) {
      setSelectedTicketId(null);
    }
  }, [tickets, selectedTicketId, setSelectedTicketId]);

  // Candidatos de identificação do usuário autenticado para conferência segura
  const myCandidateIds = useMemo(() => {
    return new Set(
      [
        user?.id,
        profile?.id,
        profile?.user_id,
        profile?.game_id,
        (profile as any)?.passaporte,
        profile?.discord_id,
        profile?.discord_email,
        user?.email,
      ]
        .filter(Boolean)
        .map((id) => String(id).trim().toLowerCase())
    );
  }, [user?.id, user?.email, profile?.id, profile?.user_id, profile?.game_id, (profile as any)?.passaporte, profile?.discord_id, profile?.discord_email]);

  const checkIsMyTicket = useCallback(
    (t: Ticket) => {
      const uid = String(t.user_id || "").trim().toLowerCase();
      const aid = String(t.assigned_to_id || "").trim().toLowerCase();
      if (uid && myCandidateIds.has(uid)) return true;
      if (aid && myCandidateIds.has(aid)) return true;
      if (t.members && Array.isArray(t.members)) {
        return t.members.some((m) => {
          const mid = String(m.user_id || (m as any).id || "").trim().toLowerCase();
          return mid && myCandidateIds.has(mid);
        });
      }
      return false;
    },
    [myCandidateIds]
  );

  // Contadores operacionais (respeitando view_all_tickets)
  const stats = useMemo(() => {
    const list = canViewAll ? tickets : tickets.filter(checkIsMyTicket);
    const total = list.length;
    const assignedMe = list.filter((t) => myCandidateIds.has(String(t.assigned_to_id || "").trim().toLowerCase()) && t.status !== "fechado").length;
    const unassigned = list.filter((t) => !t.assigned_to_id && t.status !== "fechado").length;
    const urgent = list.filter((t) => (t.priority === "urgente" || t.priority === "alta") && t.status !== "fechado").length;
    const closed = list.filter((t) => t.status === "fechado").length;
    const inProgress = list.filter((t) => t.status === "em_atendimento").length;

    return { total, assignedMe, unassigned, urgent, closed, inProgress };
  }, [tickets, canViewAll, checkIsMyTicket, myCandidateIds]);

  // Filtragem dos tickets para a lista de atendimento
  const filteredTickets = useMemo(() => {
    const list = tickets.filter((t) => {
      // Se não possui view_all_tickets nem canManage, só vê chamados atribuídos a si, onde participa ou onde é criador
      if (!canViewAll && !checkIsMyTicket(t)) {
        return false;
      }

      // 1. Tab filtro
      if (activeTab === "assigned_me") {
        if (!myCandidateIds.has(String(t.assigned_to_id || "").trim().toLowerCase()) || t.status === "fechado") return false;
      } else if (activeTab === "unassigned") {
        if (Boolean(t.assigned_to_id) || t.status === "fechado") return false;
      } else if (activeTab === "urgent") {
        if ((t.priority !== "urgente" && t.priority !== "alta") || t.status === "fechado") return false;
      } else if (activeTab === "closed") {
        if (t.status !== "fechado") return false;
      } else if (activeTab === "all") {
        // Exibe todos os tickets em 'all'
      }

      // 2. Filtro de Status Específico
      if (filterStatus !== "all" && t.status !== filterStatus) {
        return false;
      }

      // 3. Filtro por Atendente
      if (filterAssignee === "unassigned") {
        if (Boolean(t.assigned_to_id)) return false;
      } else if (filterAssignee === "me") {
        if (!myCandidateIds.has(String(t.assigned_to_id || "").trim().toLowerCase())) return false;
      } else if (filterAssignee !== "all" && t.assigned_to_id !== filterAssignee) {
        return false;
      }

      // 4. Categoria
      if (filterCategory !== "all" && t.category !== filterCategory) {
        return false;
      }

      // 5. Prioridade
      if (filterPriority !== "all" && t.priority !== filterPriority) {
        return false;
      }

      // 6. Busca por texto
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

    return list.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "priority") {
        const diff = (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0);
        if (diff !== 0) return diff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "messages") {
        const diff = (b.messages?.length || 0) - (a.messages?.length || 0);
        if (diff !== 0) return diff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [
    tickets,
    activeTab,
    canViewAll,
    checkIsMyTicket,
    myCandidateIds,
    filterStatus,
    filterAssignee,
    filterCategory,
    filterPriority,
    searchTerm,
    sortBy,
  ]);

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
    <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-in fade-in duration-300">
      {/* CABEÇALHO PRINCIPAL COM INDICADOR EM TEMPO REAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm">
                <Headphones className="h-6 w-6" />
              </span>
              <span>Atendimento Ticket</span>
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold">Desk em Tempo Real</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Central operacional unificada para triagem, moderação sigilosa, notas internas e resolução ágil de chamados.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isFetching}
            className="h-9 px-3 gap-1.5 text-xs font-semibold border-border/70 hover:bg-secondary/60 rounded-xl"
            title="Sincronizar fila agora"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 text-cyan-400", (isRefreshing || isFetching) && "animate-spin")} />
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>

          {canCreate && (
            <Button
              onClick={() => setIsNewDialogOpen(true)}
              className="h-9 px-4 gap-2 font-bold shadow-lg bg-gradient-to-r from-cyan-500 via-primary to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-primary-foreground border-none rounded-xl"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Chamado</span>
            </Button>
          )}
        </div>
      </div>

      {/* DASHBOARD DE MÉTRICAS OPERACIONAIS REESTILIZADO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card Todos os Tickets */}
        <Card
          onClick={() => setActiveTab("all")}
          className={cn(
            "relative overflow-hidden border border-border/80 shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyan-500/10",
            "bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-sm",
            activeTab === "all"
              ? "ring-2 ring-cyan-500 border-cyan-500/60 shadow-lg shadow-cyan-500/10"
              : "hover:border-cyan-500/40"
          )}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Todos os Tickets
              </p>
              <p className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono tracking-tight">
                {stats.total}
              </p>
              <span className="text-[10px] text-muted-foreground/80 block">Fila completa</span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <Headphones className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card Meus Atendimentos */}
        <Card
          onClick={() => setActiveTab("assigned_me")}
          className={cn(
            "relative overflow-hidden border border-border/80 shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-primary/10",
            "bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-sm",
            activeTab === "assigned_me"
              ? "ring-2 ring-primary border-primary/60 shadow-lg shadow-primary/10"
              : "hover:border-primary/40"
          )}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-emerald-500" />
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Meus Atendimentos
              </p>
              <p className="text-2xl sm:text-3xl font-black text-primary font-mono tracking-tight">
                {stats.assignedMe}
              </p>
              <span className="text-[10px] text-muted-foreground/80 block">Em andamento</span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0 shadow-inner">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card Fila Aberta (Sem Atendente) */}
        <Card
          onClick={() => setActiveTab("unassigned")}
          className={cn(
            "relative overflow-hidden border border-border/80 shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-amber-500/10",
            "bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-sm",
            activeTab === "unassigned"
              ? "ring-2 ring-amber-500 border-amber-500/60 shadow-lg shadow-amber-500/10"
              : "hover:border-amber-500/40"
          )}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Sem Atendente
              </p>
              <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                {stats.unassigned}
              </p>
              <span className="text-[10px] text-amber-400/80 font-medium block">Prontos p/ assumir</span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card Urgentes / Alta Prioridade */}
        <Card
          onClick={() => setActiveTab("urgent")}
          className={cn(
            "relative overflow-hidden border border-border/80 shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-rose-500/10",
            "bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-sm",
            activeTab === "urgent"
              ? "ring-2 ring-rose-500 border-rose-500/60 shadow-lg shadow-rose-500/10"
              : "hover:border-rose-500/40"
          )}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Urgentes / Alta
              </p>
              <p className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">
                {stats.urgent}
              </p>
              <span className="text-[10px] text-rose-400/80 font-medium block">Atenção prioritária</span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <AlertTriangle className={cn("h-5 w-5", stats.urgent > 0 && "animate-pulse")} />
            </div>
          </CardContent>
        </Card>

        {/* Card Finalizados */}
        <Card
          onClick={() => setActiveTab("closed")}
          className={cn(
            "relative overflow-hidden border border-border/80 shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-purple-500/10 col-span-2 sm:col-span-1",
            "bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-sm",
            activeTab === "closed"
              ? "ring-2 ring-purple-500 border-purple-500/60 shadow-lg shadow-purple-500/10"
              : "hover:border-purple-500/40"
          )}
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
          <CardContent className="p-3.5 sm:p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Finalizados
              </p>
              <p className="text-2xl sm:text-3xl font-black text-purple-400 font-mono tracking-tight">
                {stats.closed}
              </p>
              <span className="text-[10px] text-muted-foreground/80 block">Histórico resolvido</span>
            </div>
            <div className="h-11 w-11 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ABAS OPERACIONAIS, CONTROLES DE VISUALIZAÇÃO E FILTROS */}
      <div className="space-y-4">
        {/* LINHA 1: TABS DE STATUS, PESQUISA E SWITCH DE MODO */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <Tabs
            value={activeTab}
            onValueChange={(val: any) => setActiveTab(val)}
            className="w-full lg:w-auto"
          >
            <TabsList className="bg-secondary/40 border border-border/60 p-1 rounded-2xl w-full lg:w-auto grid grid-cols-3 sm:grid-cols-5 gap-1 h-auto">
              <TabsTrigger
                value="all"
                className="gap-1.5 text-xs font-bold data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 data-[state=active]:shadow-xs py-2 rounded-xl"
              >
                <Headphones className="h-3.5 w-3.5" />
                <span>Todos</span>
                {stats.total > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                    {stats.total}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="assigned_me"
                className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-xs py-2 rounded-xl"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Atribuídos</span>
                {stats.assignedMe > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono bg-primary/20 text-primary border border-primary/30">
                    {stats.assignedMe}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="unassigned"
                className="gap-1.5 text-xs font-bold data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 data-[state=active]:shadow-xs py-2 rounded-xl"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Sem Atendente</span>
                {stats.unassigned > 0 && (
                  <Badge className="ml-1 px-1.5 py-0 text-[10px] font-mono bg-amber-500/30 text-amber-200 border border-amber-500/40">
                    {stats.unassigned}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="urgent"
                className="gap-1.5 text-xs font-bold data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300 data-[state=active]:shadow-xs py-2 rounded-xl"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                <span>Urgentes</span>
                {stats.urgent > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {stats.urgent}
                  </Badge>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="closed"
                className="gap-1.5 text-xs font-bold data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 data-[state=active]:shadow-xs py-2 rounded-xl col-span-2 sm:col-span-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400" />
                <span>Finalizados</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-1 lg:max-w-md justify-end">
            {/* BARRA DE PESQUISA RÁPIDA */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por #, assunto, solicitante ou atendente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 bg-secondary/40 border-border/70 rounded-xl text-xs h-10 shadow-xs focus-visible:ring-cyan-500/40"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* SELETOR DE MODO DE VISUALIZAÇÃO: CARDS OU TABELA */}
            <div className="flex items-center p-1 bg-secondary/40 border border-border/70 rounded-xl shrink-0">
              <Button
                size="sm"
                variant={viewMode === "cards" ? "default" : "ghost"}
                onClick={() => handleToggleViewMode("cards")}
                className={cn(
                  "h-8 px-2.5 text-xs font-bold gap-1.5 rounded-lg transition-all",
                  viewMode === "cards"
                    ? "bg-cyan-500 text-black shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Exibir em cards visuais detalhados"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Cards</span>
              </Button>
              <Button
                size="sm"
                variant={viewMode === "table" ? "default" : "ghost"}
                onClick={() => handleToggleViewMode("table")}
                className={cn(
                  "h-8 px-2.5 text-xs font-bold gap-1.5 rounded-lg transition-all",
                  viewMode === "table"
                    ? "bg-cyan-500 text-black shadow-xs font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Exibir em tabela de alta densidade"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Tabela</span>
              </Button>
            </div>
          </div>
        </div>

        {/* LINHA 2: BARRA DE FILTROS REFINADOS E ORDENAÇÃO */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-secondary/25 border border-border/60 rounded-2xl text-xs backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-foreground font-bold shrink-0 mr-1">
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            <span>Filtros da Fila:</span>
          </div>

          {/* Categoria */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-36 bg-card/60 border-border/70 rounded-xl text-xs h-8">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todas Categorias</SelectItem>
              {TICKET_CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Prioridade */}
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32 bg-card/60 border-border/70 rounded-xl text-xs h-8">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todas Prioridades</SelectItem>
              {TICKET_PRIORITIES.map((p) => {
                const pInfo = getPriorityInfo(p.id);
                return (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", pInfo?.dotClass)} />
                      {p.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 bg-card/60 border-border/70 rounded-xl text-xs h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todos os Status</SelectItem>
              {TICKET_STATUSES.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Atendente */}
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-36 bg-card/60 border-border/70 rounded-xl text-xs h-8">
              <SelectValue placeholder="Atendente" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Todos Atendentes</SelectItem>
              <SelectItem value="me">Meus Atendimentos</SelectItem>
              <SelectItem value="unassigned">Sem Atendente</SelectItem>
            </SelectContent>
          </Select>

          {/* Ordenação da Fila */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] text-muted-foreground hidden sm:inline-flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" />
              Ordenar:
            </span>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-44 bg-card/60 border-border/70 rounded-xl text-xs h-8 font-medium">
                <SelectValue placeholder="Ordenação" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="newest">🕒 Mais Recentes</SelectItem>
                <SelectItem value="oldest">⏳ Fila FIFO (Mais Antigos)</SelectItem>
                <SelectItem value="priority">🔥 Maior Prioridade</SelectItem>
                <SelectItem value="messages">💬 Mais Mensagens</SelectItem>
              </SelectContent>
            </Select>

            {isAnyFilterActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 px-2.5 text-[11px] text-rose-400 hover:text-rose-300 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl gap-1"
                title="Limpar todos os filtros selecionados"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Limpar</span>
              </Button>
            )}
          </div>
        </div>

        {/* FEED PRINCIPAL: CARDS OU TABELA DE ALTA DENSIDADE */}
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
              searchTerm || filterCategory !== "all" || filterPriority !== "all" || filterStatus !== "all"
                ? "Tente ajustar os termos da busca ou filtros selecionados."
                : activeTab === "assigned_me"
                ? "Você não possui chamados atribuídos a você no momento."
                : activeTab === "unassigned"
                ? "Excelente trabalho! Não há chamados aguardando atendimento na fila aberta."
                : "Não há registros de chamados nesta categoria."
            }
          />
        ) : viewMode === "table" ? (
          /* MODO TABELA OPERACIONAL DE ALTA DENSIDADE */
          <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm overflow-hidden shadow-xl">
            <Table>
              <TableHeader className="bg-secondary/40">
                <TableRow className="border-border/60 hover:bg-transparent text-xs">
                  <TableHead className="w-24 font-bold text-foreground"># Ticket</TableHead>
                  <TableHead className="font-bold text-foreground">Solicitante</TableHead>
                  <TableHead className="font-bold text-foreground">Assunto & Categoria</TableHead>
                  <TableHead className="w-32 font-bold text-foreground">Prioridade</TableHead>
                  <TableHead className="w-36 font-bold text-foreground">Status</TableHead>
                  <TableHead className="font-bold text-foreground">Responsável</TableHead>
                  <TableHead className="w-28 font-bold text-foreground">Abertura</TableHead>
                  <TableHead className="w-32 text-right font-bold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => {
                  const catInfo = getCategoryInfo(ticket.category);
                  const priorityInfo = getPriorityInfo(ticket.priority);
                  const statusInfo = getStatusInfo(ticket.status);
                  const isClosed = ticket.status === "fechado";
                  const hasNoAssignee = !ticket.assigned_to_id;
                  const isMyAssignment = ticket.assigned_to_id === user?.id;

                  return (
                    <TableRow
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={cn(
                        "cursor-pointer border-border/40 transition-colors hover:bg-cyan-500/5 group text-xs",
                        isMyAssignment && "bg-primary/5",
                        ticket.priority === "urgente" && !isClosed && "bg-rose-500/5"
                      )}
                    >
                      {/* # Ticket */}
                      <TableCell className="font-mono font-bold text-cyan-400">
                        {formatTicketNumber(ticket.ticket_number)}
                      </TableCell>

                      {/* Solicitante */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-border shrink-0">
                            <AvatarImage src={ticket.creator_avatar || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {(ticket.creator_name || ticket.creator_nickname || "MB").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate inline-flex items-center gap-1">
                              <span>{ticket.creator_nickname || ticket.creator_name}</span>
                              <VerifiedBadge userId={ticket.creator_id} isVerified={ticket.creator_is_verified} size="xs" />
                            </p>
                            <span className="text-[10px] text-muted-foreground block">
                              {LEVEL_LABEL[ticket.creator_role] || ticket.creator_role}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Assunto & Categoria */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground group-hover:text-cyan-400 transition-colors line-clamp-1">
                            {ticket.subject}
                          </p>
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-medium", catInfo?.badgeClass)}>
                            {catInfo?.emoji} {catInfo?.label || ticket.category}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Prioridade */}
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", priorityInfo?.badgeClass)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full mr-1", priorityInfo?.dotClass)} />
                          {priorityInfo?.label || ticket.priority}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", statusInfo?.badgeClass)}>
                          {statusInfo?.label || ticket.status}
                        </Badge>
                      </TableCell>

                      {/* Responsável */}
                      <TableCell>
                        {ticket.assigned_to_name ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/60 border border-border/60 text-sky-400 font-medium">
                            <UserCheck className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{ticket.assigned_to_nickname || ticket.assigned_to_name}</span>
                            <VerifiedBadge userId={ticket.assigned_to_id} size="xs" />
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            <Zap className="h-3 w-3" /> Fila Aberta
                          </span>
                        )}
                      </TableCell>

                      {/* Tempo */}
                      <TableCell className="font-mono text-[11px] text-muted-foreground">
                        {formatRelativeTime(ticket.created_at)}
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
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
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="h-7 px-3 text-[11px] font-bold gap-1 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg shadow-xs"
                          >
                            <span>Atender</span>
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* MODO CARDS VISUAIS ELEGANTES */
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
                    "relative overflow-hidden border border-border/80 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group",
                    "bg-gradient-to-b from-card/90 to-card/50 backdrop-blur-sm hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:-translate-y-0.5",
                    isMyAssignment && "border-l-4 border-l-primary",
                    hasNoAssignee && !isClosed && "border-l-4 border-l-amber-500",
                    ticket.priority === "urgente" && !isClosed && "ring-1 ring-rose-500/40"
                  )}
                >
                  {/* Borda superior de status correspondente */}
                  <div
                    className={cn(
                      "absolute top-0 left-0 right-0 h-1 transition-all",
                      ticket.priority === "urgente" && !isClosed
                        ? "bg-gradient-to-r from-rose-500 to-red-600"
                        : isMyAssignment
                        ? "bg-gradient-to-r from-primary to-emerald-500"
                        : hasNoAssignee && !isClosed
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                        : isClosed
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500"
                    )}
                  />

                  <CardContent className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between pt-5">
                    <div>
                      {/* HEADER DO CARD: TICKET NUMBER, BADGES & STATUS */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                            {formatTicketNumber(ticket.ticket_number)}
                          </span>

                          <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", catInfo?.badgeClass)}>
                            {catInfo?.emoji} {catInfo?.label || ticket.category}
                          </Badge>

                          <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", priorityInfo?.badgeClass)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full mr-1", priorityInfo?.dotClass)} />
                            {priorityInfo?.label || ticket.priority}
                          </Badge>

                          {/* Tempo Relativo */}
                          <span className="text-[10px] font-mono text-muted-foreground/80 bg-secondary/50 px-1.5 py-0.5 rounded border border-border/40">
                            {formatRelativeTime(ticket.created_at)}
                          </span>
                        </div>

                        <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", statusInfo?.badgeClass)}>
                          {statusInfo?.label || ticket.status}
                        </Badge>
                      </div>

                      {/* ASSUNTO DO TICKET */}
                      <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-cyan-400 transition-colors line-clamp-1">
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
                            <span className="inline-flex items-center gap-1 text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                              <UserCheck className="h-3 w-3" />
                              <span className="truncate max-w-[110px]">{ticket.assigned_to_nickname || ticket.assigned_to_name}</span>
                              <VerifiedBadge userId={ticket.assigned_to_id} size="xs" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 animate-pulse">
                              <Zap className="h-3 w-3" /> Fila Aberta
                            </span>
                          )}
                        </div>
                      </div>

                      {/* BARRINHA DE BOTÕES DE AÇÃO RÁPIDA */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-cyan-400/80" />
                            {dateTime(ticket.created_at)}
                          </span>
                          {msgCount > 0 && (
                            <span className="flex items-center gap-1" title={`${msgCount} mensagens trocadas`}>
                              <MessageSquare className="h-3 w-3" />
                              {msgCount}
                            </span>
                          )}
                          {attachCount > 0 && (
                            <span className="flex items-center gap-1" title={`${attachCount} prints/anexos`}>
                              <Paperclip className="h-3 w-3" />
                              {attachCount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {hasNoAssignee && !isClosed && canClaim && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => handleClaimTicket(ticket.id, e)}
                              className="h-7 px-2.5 text-[11px] font-bold gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg shadow-xs"
                            >
                              <Zap className="h-3 w-3" /> Assumir
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="h-7 px-3 text-[11px] font-bold gap-1 bg-cyan-500 hover:bg-cyan-600 text-black rounded-lg shadow-xs"
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

      {/* MODAL DETALHADO DO TICKET (TICKET DETAIL VIEW EXPANDIDO E ELEGANTE) */}
      {selectedTicket && (
        <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
          <DialogContent className="max-w-7xl w-[96vw] h-[92vh] sm:h-[90vh] p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-md shadow-2xl flex flex-col rounded-2xl">
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
