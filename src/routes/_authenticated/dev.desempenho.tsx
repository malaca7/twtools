import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  ArrowLeftRight,
  UserCheck,
  Search,
  Award,
  Trophy,
  Target,
  Zap,
  Flame,
  Calendar,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Eye,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Activity,
  Layers,
  X,
  Receipt,
  Boxes,
  User,
} from "lucide-react";
import { InsigniaGrid } from "@/components/performance/InsigniaGrid";
import { calculateMemberInsignias } from "@/lib/insignias";
import { goalProgress } from "@/lib/metrics";
import { PageHeader, NoAccess, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useSales, useMovements, useMembers, useGoals } from "@/hooks/useData";
import { currency, num, dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getLevelLabel, levelBadgeClass } from "@/lib/permissions";
import { isUserDeveloper } from "@/services/devService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/dev/desempenho")({
  component: GestaoDesempenhoPage,
});

type TimeFilter = "all" | "today" | "7days" | "month" | "last_month";
type SortOption = "revenue" | "score" | "sales" | "ticket" | "movements";

export function GestaoDesempenhoPage() {
  const { user, profile, level, hasPermission } = useAuth();
  const isDev = isUserDeveloper(user, profile, level);
  const canView = hasPermission("manage_performance") || isDev;
  const canInspect = hasPermission("inspect_member_performance") || hasPermission("manage_performance") || isDev;

  const { data: sales = [], isLoading: loadingSales } = useSales();
  const { data: movements = [], isLoading: loadingMovements } = useMovements();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const { data: goals = [] } = useGoals();

  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("revenue");
  const [inspectMemberId, setInspectMemberId] = useState<string | null>(null);

  if (!canView) return <NoAccess />;

  const isLoading = loadingSales || loadingMovements || loadingMembers;

  // Filter sales and movements by time period
  const filteredSales = useMemo(() => {
    const active = sales.filter((s) => s.status === "concluida");
    if (timeFilter === "all") return active;

    const now = new Date();
    return active.filter((s) => {
      const date = new Date(s.created_at || (s as any).data);
      if (isNaN(date.getTime())) return true;

      if (timeFilter === "today") {
        return date.toDateString() === now.toDateString();
      }
      if (timeFilter === "7days") {
        const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (timeFilter === "month") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (timeFilter === "last_month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      }
      return true;
    });
  }, [sales, timeFilter]);

  const filteredMovements = useMemo(() => {
    if (timeFilter === "all") return movements;

    const now = new Date();
    return movements.filter((m) => {
      const date = new Date(m.created_at);
      if (isNaN(date.getTime())) return true;

      if (timeFilter === "today") {
        return date.toDateString() === now.toDateString();
      }
      if (timeFilter === "7days") {
        const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (timeFilter === "month") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      if (timeFilter === "last_month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      }
      return true;
    });
  }, [movements, timeFilter]);

  // Overall faction revenue in filtered period
  const totalFactionRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + Number(s.total_price || 0), 0);
  }, [filteredSales]);

  const maxRevenueInSet = useMemo(() => {
    const revs = members.map((m) => {
      return filteredSales
        .filter((s) => s.seller_id === m.user_id)
        .reduce((acc, s) => acc + Number(s.total_price || 0), 0);
    });
    return Math.max(...revs, 1);
  }, [members, filteredSales]);

  // Calculate comprehensive stats for each member
  const memberStats = useMemo(() => {
    return members.map((m) => {
      const mSales = filteredSales.filter((s) => s.seller_id === m.user_id);
      const mRevenue = mSales.reduce((acc, s) => acc + Number(s.total_price || 0), 0);
      const mMovements = filteredMovements.filter((mov) => mov.user_id === m.user_id);
      const mGoals = goals.filter((g) => g.user_id === m.user_id);
      const completedGoals = mGoals.filter((g) => {
        const prog = goalProgress(g, filteredSales);
        return prog.status === "concluida" || prog.percent >= 100;
      }).length;

      const ticketMédio = mSales.length > 0 ? mRevenue / mSales.length : 0;
      const sharePct = totalFactionRevenue > 0 ? (mRevenue / totalFactionRevenue) * 100 : 0;

      // Composite Performance Score (0 - 100)
      const revScore = (mRevenue / maxRevenueInSet) * 50;
      const salesScore = Math.min(mSales.length * 4, 20);
      const movScore = Math.min(mMovements.length * 2, 15);
      const goalScore = mGoals.length > 0 ? (completedGoals / mGoals.length) * 15 : 10;

      const score = Math.min(Math.round(revScore + salesScore + movScore + goalScore), 100);

      return {
        ...m,
        salesCount: mSales.length,
        revenue: mRevenue,
        movementsCount: mMovements.length,
        goalsCount: mGoals.length,
        completedGoals,
        ticketMédio,
        sharePct,
        score,
        sales: mSales,
        movements: mMovements,
      };
    });
  }, [members, filteredSales, filteredMovements, goals, totalFactionRevenue, maxRevenueInSet]);

  // Apply filters and sorting
  const processedMembers = useMemo(() => {
    let result = memberStats.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !search ||
        m.nome.toLowerCase().includes(q) ||
        (m.nickname || "").toLowerCase().includes(q) ||
        (m.game_id || "").toLowerCase().includes(q);

      const matchLevel = levelFilter === "all" || m.nivel === levelFilter;

      return matchSearch && matchLevel;
    });

    result.sort((a, b) => {
      if (sortBy === "revenue") return b.revenue - a.revenue;
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "sales") return b.salesCount - a.salesCount;
      if (sortBy === "ticket") return b.ticketMédio - a.ticketMédio;
      if (sortBy === "movements") return b.movementsCount - a.movementsCount;
      return b.revenue - a.revenue;
    });

    return result;
  }, [memberStats, search, levelFilter, sortBy]);

  // Top MVP Performer (Rank #1 by Revenue)
  const topPerformer = useMemo(() => {
    const sorted = [...memberStats].sort((a, b) => b.revenue - a.revenue);
    return sorted[0] && sorted[0].revenue > 0 ? sorted[0] : null;
  }, [memberStats]);

  // Faction Average Revenue per Active Member
  const avgRevenuePerMember = useMemo(() => {
    const activeMembersCount = memberStats.filter((m) => m.revenue > 0 || m.movementsCount > 0).length || 1;
    return totalFactionRevenue / activeMembersCount;
  }, [totalFactionRevenue, memberStats]);

  // Average Faction Score
  const avgScore = useMemo(() => {
    if (memberStats.length === 0) return 0;
    const totalScore = memberStats.reduce((acc, m) => acc + m.score, 0);
    return Math.round(totalScore / memberStats.length);
  }, [memberStats]);

  // Inspected member object for detail modal
  const inspectedMember = useMemo(() => {
    if (!inspectMemberId) return null;
    return memberStats.find((m) => m.user_id === inspectMemberId) || null;
  }, [inspectMemberId, memberStats]);

  const inspectedInsignias = useMemo(() => {
    if (!inspectedMember) return [];
    return calculateMemberInsignias({
      revenue: inspectedMember.revenue,
      salesCount: inspectedMember.salesCount,
      movementsCount: inspectedMember.movementsCount,
      score: inspectedMember.score,
      ticketMédio: inspectedMember.ticketMédio,
      isMVP: topPerformer?.user_id === inspectedMember.user_id && inspectedMember.revenue > 0,
      totalSecondsOnline: inspectedMember.total_seconds_online || 0,
      hasGoal100Pct: inspectedMember.completedGoals > 0 && inspectedMember.completedGoals >= inspectedMember.goalsCount,
    });
  }, [inspectedMember, topPerformer]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Gestão Executiva de Desempenho"
          description="Painel de controle geral da liderança: produtividade individual de todos os membros, ranking de vendas e engajamento da facção."
        />
        <Link to="/desempenho">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-primary/30 text-primary">
            <User className="h-3.5 w-3.5" />
            Ver Meu Desempenho Pessoal
          </Button>
        </Link>
      </div>

      {/* Control Bar: Time Period & Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-foreground">Período de Análise:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "Geral (Tudo)" },
              { id: "today", label: "Hoje" },
              { id: "7days", label: "7 Dias" },
              { id: "month", label: "Este Mês" },
              { id: "last_month", label: "Mês Anterior" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeFilter(tab.id as TimeFilter)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  timeFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs font-mono font-bold border-primary/30 text-primary gap-1 py-1">
            <Activity className="h-3 w-3" />
            {filteredSales.length} Vendas Analisadas
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <>
          {/* Executive Overview KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Top MVP Card */}
            <Card className="surface-card border-primary/40 relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card">
              <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-primary/20 blur-xl" />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[0.7rem] uppercase tracking-wider font-extrabold text-primary flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    MVP da Facção
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px]">
                    🥇 1º Lugar
                  </Badge>
                </div>

                {topPerformer ? (
                  <div className="flex items-center gap-3 pt-1">
                    <Avatar className="h-12 w-12 border-2 border-primary/50 shadow-md shrink-0">
                      <AvatarImage src={topPerformer.discord_avatar_url || (topPerformer as any).avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary font-extrabold text-sm">
                        {(topPerformer.nickname || topPerformer.nome).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-foreground truncate">
                        {topPerformer.nickname || topPerformer.nome}
                      </p>
                      <p className="text-xs font-bold text-emerald-400 font-mono">
                        {currency(topPerformer.revenue)}
                      </p>
                      <p className="text-[0.65rem] text-muted-foreground">
                        {topPerformer.salesCount} vendas · {topPerformer.sharePct.toFixed(1)}% do total
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-2">Sem vendas no período</p>
                )}
              </CardContent>
            </Card>

            {/* Total Revenue Card */}
            <Card className="surface-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[0.7rem] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                    Faturamento Total
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-foreground tracking-tight">
                  {currency(totalFactionRevenue)}
                </p>
                <p className="text-[0.65rem] text-muted-foreground">
                  Receita total acumulada por todos os membros
                </p>
              </CardContent>
            </Card>

            {/* Average Revenue Card */}
            <Card className="surface-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[0.7rem] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5 text-sky-400" />
                    Média por Membro
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-foreground tracking-tight">
                  {currency(avgRevenuePerMember)}
                </p>
                <p className="text-[0.65rem] text-muted-foreground">
                  Média arrecadada por membro ativo no período
                </p>
              </CardContent>
            </Card>

            {/* Faction Score Card */}
            <Card className="surface-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[0.7rem] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    Produtividade Média
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Flame className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-amber-400 tracking-tight">
                    {avgScore} <span className="text-xs font-normal text-muted-foreground">/ 100 pts</span>
                  </p>
                </div>
                <Progress value={avgScore} className="h-1.5 bg-secondary" />
              </CardContent>
            </Card>
          </div>

          {/* Member Performance Table Section */}
          <Card className="surface-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Relatório Geral de Produtividade dos Membros
                  </CardTitle>
                  <CardDescription className="text-[0.7rem]">
                    {processedMembers.length} membros filtrados no resultado
                  </CardDescription>
                </div>

                {/* Filters & Sorting Inputs */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-52">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou passaporte..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 text-xs pl-8 bg-secondary/50 border-border/60"
                    />
                  </div>

                  {/* Cargo / Level Filter */}
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="h-8 w-36 text-xs bg-secondary/50 border-border/60">
                      <SelectValue placeholder="Todos os Cargos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">Todos os Cargos</SelectItem>
                      <SelectItem value="01" className="text-xs">Líder (01)</SelectItem>
                      <SelectItem value="02" className="text-xs">Sub-Líder (02)</SelectItem>
                      <SelectItem value="03" className="text-xs">Gerente (03)</SelectItem>
                      <SelectItem value="04" className="text-xs">Oficial (04)</SelectItem>
                      <SelectItem value="05" className="text-xs">Operador (05)</SelectItem>
                      <SelectItem value="membro" className="text-xs">Membro</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort By Select */}
                  <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                    <SelectTrigger className="h-8 w-44 text-xs bg-secondary/50 border-border/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue" className="text-xs">Faturamento (Maior)</SelectItem>
                      <SelectItem value="score" className="text-xs">Score de Produtividade</SelectItem>
                      <SelectItem value="sales" className="text-xs">Qtd. de Vendas</SelectItem>
                      <SelectItem value="ticket" className="text-xs">Ticket Médio</SelectItem>
                      <SelectItem value="movements" className="text-xs">Movimentações de Estoque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {processedMembers.length === 0 ? (
                <EmptyState
                  icon={<UserCheck className="h-10 w-10 text-muted-foreground" />}
                  title="Nenhum membro encontrado"
                  description="Não foi encontrado nenhum membro com os filtros selecionados."
                />
              ) : (
                <>
                  {/* MOBILE CARD VIEW */}
                  <div className="space-y-3 p-4 md:hidden">
                    {processedMembers.map((m, idx) => {
                      const rank = idx + 1;
                      return (
                        <div
                          key={m.user_id}
                          onClick={() => setInspectMemberId(m.user_id)}
                          className="p-4 rounded-xl border border-border/60 bg-card/50 hover:bg-secondary/30 transition-all cursor-pointer space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "text-[10px] font-mono shrink-0",
                                  rank === 1 && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                                  rank === 2 && "bg-slate-400/20 text-slate-300 border-slate-400/30",
                                  rank === 3 && "bg-amber-700/20 text-amber-600 border-amber-700/30"
                                )}
                              >
                                #{rank}
                              </Badge>
                              <Avatar className="h-7 w-7 border shrink-0">
                                <AvatarImage src={m.discord_avatar_url || (m as any).avatar_url || undefined} />
                                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                                  {(m.nickname || m.nome).slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-extrabold text-xs text-foreground truncate">{m.nickname || m.nome}</p>
                                {m.game_id && <p className="text-[0.65rem] text-muted-foreground font-mono">ID: {m.game_id}</p>}
                              </div>
                            </div>
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
                              ⚡ {m.score} pts
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center bg-secondary/30 rounded-lg p-2">
                            <div>
                              <p className="text-[0.6rem] text-muted-foreground uppercase font-bold">Faturamento</p>
                              <p className="text-xs font-bold text-emerald-400 font-mono">{currency(m.revenue)}</p>
                            </div>
                            <div>
                              <p className="text-[0.6rem] text-muted-foreground uppercase font-bold">Ticket Médio</p>
                              <p className="text-xs font-bold text-sky-400 font-mono">{currency(m.ticketMédio)}</p>
                            </div>
                            <div>
                              <p className="text-[0.6rem] text-muted-foreground uppercase font-bold">Vendas</p>
                              <p className="text-xs font-bold text-foreground font-mono">{m.salesCount}</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[0.65rem]">
                              <span className="text-muted-foreground font-bold uppercase">Participação no Faturamento</span>
                              <span className="font-bold text-primary font-mono">{m.sharePct.toFixed(1)}%</span>
                            </div>
                            <Progress value={m.sharePct} className="h-1.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP TABLE VIEW */}
                  <div className="hidden md:block w-full overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-secondary/30">
                        <TableRow>
                          <TableHead className="w-12 text-center">Pos</TableHead>
                          <TableHead>Membro / Identificação</TableHead>
                          <TableHead>Cargo / Nível</TableHead>
                          <TableHead>Insígnias</TableHead>
                          <TableHead className="text-center">Score Produtividade</TableHead>
                          <TableHead className="text-right">Faturamento</TableHead>
                          <TableHead className="text-right">Ticket Médio</TableHead>
                          <TableHead className="text-center">Qtd. Vendas</TableHead>
                          <TableHead className="text-center">Movimentações</TableHead>
                          <TableHead className="w-40">Participação</TableHead>
                          <TableHead className="w-12 text-center"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedMembers.map((m, idx) => {
                          const rank = idx + 1;

                          return (
                            <TableRow
                              key={m.user_id}
                              onClick={() => setInspectMemberId(m.user_id)}
                              className="cursor-pointer transition-colors hover:bg-secondary/40 group"
                            >
                              {/* Position Badge */}
                              <TableCell className="text-center font-bold">
                                <span
                                  className={cn(
                                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold font-mono",
                                    rank === 1 && "bg-amber-500 text-black shadow-md shadow-amber-500/20",
                                    rank === 2 && "bg-slate-300 text-black",
                                    rank === 3 && "bg-amber-700 text-white",
                                    rank > 3 && "text-muted-foreground"
                                  )}
                                >
                                  {rank}
                                </span>
                              </TableCell>

                              {/* Member Avatar & Name */}
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 border border-border/60 shrink-0">
                                    <AvatarImage src={m.discord_avatar_url || (m as any).avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                      {(m.nickname || m.nome).slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                                      {m.nickname || m.nome}
                                    </p>
                                    <p className="text-[0.65rem] text-muted-foreground font-mono truncate">
                                      {m.nome} {m.game_id ? `· Passaporte: ${m.game_id}` : ""}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>

                              {/* Cargo / Level */}
                              <TableCell>
                                {m.nivel ? (
                                  <Badge variant="outline" className={levelBadgeClass(m.nivel as any)}>
                                    {getLevelLabel(m.nivel)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>

                              {/* Member Insígnias / Badges */}
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <InsigniaGrid
                                  compact
                                  insignias={calculateMemberInsignias({
                                    revenue: m.revenue,
                                    salesCount: m.salesCount,
                                    movementsCount: m.movementsCount,
                                    score: m.score,
                                    ticketMédio: m.ticketMédio,
                                    isMVP: topPerformer?.user_id === m.user_id && m.revenue > 0,
                                    totalSecondsOnline: m.total_seconds_online || 0,
                                    hasGoal100Pct: m.completedGoals > 0 && m.completedGoals >= m.goalsCount,
                                  })}
                                />
                              </TableCell>

                              {/* Performance Score */}
                              <TableCell className="text-center">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                                  <Zap className="h-3 w-3" />
                                  {m.score} pts
                                </div>
                              </TableCell>

                              {/* Revenue */}
                              <TableCell className="text-right font-extrabold text-emerald-400 font-mono text-xs">
                                {currency(m.revenue)}
                              </TableCell>

                              {/* Ticket Médio */}
                              <TableCell className="text-right font-bold text-sky-400 font-mono text-xs">
                                {currency(m.ticketMédio)}
                              </TableCell>

                              {/* Sales Count */}
                              <TableCell className="text-center font-bold text-xs">
                                {m.salesCount}
                              </TableCell>

                              {/* Movements Count */}
                              <TableCell className="text-center text-xs text-muted-foreground font-mono">
                                {m.movementsCount}
                              </TableCell>

                              {/* Participation Bar */}
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[0.65rem]">
                                    <span className="text-muted-foreground font-mono font-bold">
                                      {m.sharePct.toFixed(1)}%
                                    </span>
                                  </div>
                                  <Progress value={m.sharePct} className="h-1.5" />
                                </div>
                              </TableCell>

                              {/* Action Button */}
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground group-hover:text-primary"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Member Performance Inspection Modal */}
      {inspectedMember && (
        <Dialog open={Boolean(inspectedMember)} onOpenChange={(open) => !open && setInspectMemberId(null)}>
          <DialogContent className="max-w-2xl bg-card border-border shadow-2xl">
            <DialogHeader className="border-b border-border/60 pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/40 shadow-sm">
                  <AvatarImage src={inspectedMember.discord_avatar_url || (inspectedMember as any).avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                    {(inspectedMember.nickname || inspectedMember.nome).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-base font-extrabold text-foreground">
                      {inspectedMember.nickname || inspectedMember.nome}
                    </DialogTitle>
                    {inspectedMember.nivel && (
                      <Badge variant="outline" className={levelBadgeClass(inspectedMember.nivel as any)}>
                        {getLevelLabel(inspectedMember.nivel)}
                      </Badge>
                    )}
                  </div>
                  <DialogDescription className="text-xs">
                    {inspectedMember.nome} {inspectedMember.game_id ? `· Passaporte: ${inspectedMember.game_id}` : ""}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                  <p className="text-[0.65rem] text-muted-foreground font-bold uppercase">Faturamento Total</p>
                  <p className="text-sm font-extrabold text-emerald-400 font-mono">{currency(inspectedMember.revenue)}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                  <p className="text-[0.65rem] text-muted-foreground font-bold uppercase">Ticket Médio</p>
                  <p className="text-sm font-extrabold text-sky-400 font-mono">{currency(inspectedMember.ticketMédio)}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                  <p className="text-[0.65rem] text-muted-foreground font-bold uppercase">Vendas Realizadas</p>
                  <p className="text-sm font-extrabold text-foreground font-mono">{inspectedMember.salesCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                  <p className="text-[0.65rem] text-muted-foreground font-bold uppercase">Score Produtividade</p>
                  <p className="text-sm font-extrabold text-amber-400 font-mono">{inspectedMember.score} / 100 pts</p>
                </div>
              </div>

              {/* Insígnias & Conquistas do Membro Inspecionado */}
              <InsigniaGrid insignias={inspectedInsignias} />

              {/* Progress & Goals Breakdown */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    Participação no Faturamento Total da Facção
                  </span>
                  <span className="font-extrabold text-primary font-mono">{inspectedMember.sharePct.toFixed(1)}%</span>
                </div>
                <Progress value={inspectedMember.sharePct} className="h-2" />
              </div>

              {/* Recent Sales History */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                  Vendas Recentes do Membro ({inspectedMember.sales.length})
                </h4>
                {inspectedMember.sales.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">Nenhuma venda registrada no período selecionado.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {inspectedMember.sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/40 text-xs">
                        <div>
                          <p className="font-bold text-foreground">{sale.buyer_name ? `Cliente: ${sale.buyer_name}` : "Venda Direta"}</p>
                          <p className="text-[0.65rem] text-muted-foreground">{dateTime(sale.created_at || (sale as any).data)}</p>
                        </div>
                        <span className="font-extrabold text-emerald-400 font-mono">{currency(Number(sale.total_price))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Stock Movements */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-sky-400" />
                  Movimentações de Estoque Recentes ({inspectedMember.movements.length})
                </h4>
                {inspectedMember.movements.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2">Nenhuma movimentação de estoque no período.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {inspectedMember.movements.slice(0, 5).map((mov) => (
                      <div key={mov.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/40 text-xs">
                        <div>
                          <p className="font-bold text-foreground">{(mov as any).product_name || "Item de Estoque"}</p>
                          <p className="text-[0.65rem] text-muted-foreground">{dateTime(mov.created_at)}</p>
                        </div>
                        <Badge variant="outline" className={mov.type === "entrada" ? "border-emerald-500/40 text-emerald-400" : "border-rose-500/40 text-rose-400"}>
                          {mov.type === "entrada" ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
