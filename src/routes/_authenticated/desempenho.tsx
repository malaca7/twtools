import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  ArrowLeftRight,
  UserCheck,
  Award,
  Trophy,
  Target,
  Zap,
  Flame,
  Calendar,
  Activity,
  Receipt,
  Boxes,
  User,
  Sparkles,
  BarChart3,
  Layers,
  ArrowRight,
} from "lucide-react";
import { InsigniaGrid } from "@/components/performance/InsigniaGrid";
import { calculateMemberInsignias } from "@/lib/insignias";
import { goalProgress, GOAL_STATUS_LABEL, GOAL_TYPE_LABEL } from "@/lib/metrics";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useSales, useMovements, useMembers, useGoals } from "@/hooks/useData";
import { currency, num, dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getLevelLabel, levelBadgeClass } from "@/lib/permissions";
import { isUserDeveloper } from "@/services/devService";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export const Route = createFileRoute("/_authenticated/desempenho")({
  component: MeuDesempenhoPage,
});

type TimeFilter = "all" | "today" | "7days" | "month" | "last_month";

export function MeuDesempenhoPage() {
  const { user, profile, level } = useAuth();

  const { data: sales = [], isLoading: loadingSales } = useSales();
  const { data: movements = [], isLoading: loadingMovements } = useMovements();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const { data: goals = [] } = useGoals();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const isLoading = loadingSales || loadingMovements || loadingMembers;

  const currentUserId = user?.id || profile?.user_id;

  // Filter sales and movements by time period
  const activeSales = useMemo(() => sales.filter((s) => s.status === "concluida"), [sales]);

  const filteredSales = useMemo(() => {
    if (timeFilter === "all") return activeSales;

    const now = new Date();
    return activeSales.filter((s) => {
      const date = new Date(s.created_at || (s as any).data);
      if (isNaN(date.getTime())) return true;

      if (timeFilter === "today") return date.toDateString() === now.toDateString();
      if (timeFilter === "7days") return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 7;
      if (timeFilter === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (timeFilter === "last_month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      }
      return true;
    });
  }, [activeSales, timeFilter]);

  const filteredMovements = useMemo(() => {
    if (timeFilter === "all") return movements;

    const now = new Date();
    return movements.filter((m) => {
      const date = new Date(m.created_at);
      if (isNaN(date.getTime())) return true;

      if (timeFilter === "today") return date.toDateString() === now.toDateString();
      if (timeFilter === "7days") return (now.getTime() - date.getTime()) / (1000 * 3600 * 24) <= 7;
      if (timeFilter === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      if (timeFilter === "last_month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
      }
      return true;
    });
  }, [movements, timeFilter]);

  // Overall faction revenue for share calculation
  const totalFactionRevenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + Number(s.total_price || 0), 0);
  }, [filteredSales]);

  // Current user's personal sales & movements
  const mySales = useMemo(() => {
    return filteredSales.filter((s) => s.seller_id === currentUserId);
  }, [filteredSales, currentUserId]);

  const myMovements = useMemo(() => {
    return filteredMovements.filter((m) => m.user_id === currentUserId);
  }, [filteredMovements, currentUserId]);

  const myGoals = useMemo(() => {
    return goals.filter((g) => g.user_id === currentUserId);
  }, [goals, currentUserId]);

  // Personal metrics
  const myRevenue = useMemo(() => {
    return mySales.reduce((acc, s) => acc + Number(s.total_price || 0), 0);
  }, [mySales]);

  const myTicketMédio = useMemo(() => {
    return mySales.length > 0 ? myRevenue / mySales.length : 0;
  }, [myRevenue, mySales.length]);

  const mySharePct = useMemo(() => {
    return totalFactionRevenue > 0 ? (myRevenue / totalFactionRevenue) * 100 : 0;
  }, [myRevenue, totalFactionRevenue]);

  // Calculate ranking position of current user
  const myRankPosition = useMemo(() => {
    const sorted = [...members].map((m) => {
      const rev = filteredSales
        .filter((s) => s.seller_id === m.user_id)
        .reduce((acc, s) => acc + Number(s.total_price || 0), 0);
      return { user_id: m.user_id, rev };
    });
    sorted.sort((a, b) => b.rev - a.rev);
    const index = sorted.findIndex((x) => x.user_id === currentUserId);
    return index !== -1 ? index + 1 : sorted.length;
  }, [members, filteredSales, currentUserId]);

  // Personal Productivity Score (0 - 100)
  const myScore = useMemo(() => {
    const maxRev = Math.max(
      ...members.map((m) =>
        filteredSales.filter((s) => s.seller_id === m.user_id).reduce((acc, s) => acc + Number(s.total_price || 0), 0)
      ),
      1
    );
    const revScore = (myRevenue / maxRev) * 50;
    const salesScore = Math.min(mySales.length * 4, 20);
    const movScore = Math.min(myMovements.length * 2, 15);
    const completedGoals = myGoals.filter((g) => {
      const prog = goalProgress(g, activeSales);
      return prog.status === "concluida" || prog.percent >= 100;
    }).length;
    const goalScore = myGoals.length > 0 ? (completedGoals / myGoals.length) * 15 : 10;

    return Math.min(Math.round(revScore + salesScore + movScore + goalScore), 100);
  }, [myRevenue, mySales.length, myMovements.length, myGoals, activeSales, members, filteredSales]);

  // Goal Progress (0 - 100%)
  const myGoalProgress = useMemo(() => {
    if (myGoals.length === 0) return 0;
    const completedGoals = myGoals.filter((g) => {
      const prog = goalProgress(g, activeSales);
      return prog.status === "concluida" || prog.percent >= 100;
    }).length;
    return (completedGoals / myGoals.length) * 100;
  }, [myGoals, activeSales]);

  // Operational Insígnias / Badges System
  const myInsignias = useMemo(() => {
    return calculateMemberInsignias({
      revenue: myRevenue,
      salesCount: mySales.length,
      movementsCount: myMovements.length,
      score: myScore,
      ticketMédio: myTicketMédio,
      isMVP: myRankPosition === 1 && myRevenue > 0,
      totalSecondsOnline: (profile as any)?.total_seconds_online || 0,
      hasGoal100Pct: myGoalProgress >= 100,
    });
  }, [myRevenue, mySales.length, myMovements.length, myScore, myTicketMédio, myRankPosition, (profile as any)?.total_seconds_online, myGoalProgress]);

  const memberName = profile?.nickname || profile?.nome || "Membro";

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in-50 duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <PageHeader
        title={`Meu Desempenho Operacional 👤`}
        description="Sua ficha individual de faturamento, volume de vendas, histórico de movimentações e produtividade na facção."
      />
      </div>

      {/* Control Bar: Time Period Selector */}
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
          <Badge variant="outline" className="text-xs font-mono font-bold border-amber-500/30 text-amber-400 gap-1 py-1">
            <Trophy className="h-3 w-3 text-amber-400" />
            Sua Posição no Ranking: #{myRankPosition} de {members.length}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : (
        <>
          {/* Member Profile Header Card */}
          <Card className="surface-card border-primary/30 bg-gradient-to-br from-primary/10 via-card to-secondary/30 relative overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/50 shadow-lg shrink-0">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary font-black text-xl">
                      {memberName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black text-foreground">{memberName}</h2>
                      {level && (
                        <Badge variant="outline" className={levelBadgeClass(level)}>
                          {getLevelLabel(level)}
                        </Badge>
                      )}
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-bold">
                        ⚡ {myScore} pts de Produtividade
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {profile?.nome} {profile?.game_id ? `· Passaporte: ${profile.game_id}` : ""}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="p-3 rounded-xl bg-card/60 border border-border/50">
                    <p className="text-[0.65rem] uppercase font-bold text-muted-foreground">Seu Faturamento</p>
                    <p className="text-base font-extrabold text-emerald-400 font-mono">{currency(myRevenue)}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/50">
                    <p className="text-[0.65rem] uppercase font-bold text-muted-foreground">Ticket Médio</p>
                    <p className="text-base font-extrabold text-sky-400 font-mono">{currency(myTicketMédio)}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/50">
                    <p className="text-[0.65rem] uppercase font-bold text-muted-foreground">Suas Vendas</p>
                    <p className="text-base font-extrabold text-foreground font-mono">{mySales.length}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border/50">
                    <p className="text-[0.65rem] uppercase font-bold text-muted-foreground">Movimentações</p>
                    <p className="text-base font-extrabold text-foreground font-mono">{myMovements.length}</p>
                  </div>
                </div>
              </div>

              {/* Faction Share Bar */}
              <div className="mt-5 pt-4 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    Sua Participação no Faturamento da Facção
                  </span>
                  <span className="font-extrabold text-primary font-mono">{mySharePct.toFixed(1)}%</span>
                </div>
                <Progress value={mySharePct} className="h-2 bg-secondary" />
              </div>
            </CardContent>
          </Card>

          {/* Insígnias & Conquistas Operacionais */}
          <InsigniaGrid insignias={myInsignias} />

          {/* Member's Sales & Movements History Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* My Recent Sales */}
            <Card className="surface-card">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-400" />
                    Minhas Vendas Realizadas ({mySales.length})
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-400">
                    {currency(myRevenue)} Total
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {mySales.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
                    title="Nenhuma venda no período"
                    description="Você ainda não registrou vendas concluídas no período selecionado."
                  />
                ) : (
                  <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
                    {mySales.map((s) => (
                      <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                        <div>
                          <p className="font-bold text-xs text-foreground">
                            {s.buyer_name ? `Cliente: ${s.buyer_name}` : "Venda Direta"}
                          </p>
                          <p className="text-[0.65rem] text-muted-foreground font-mono">
                            {dateTime(s.created_at || (s as any).data)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-xs text-emerald-400 font-mono">
                            {currency(Number(s.total_price))}
                          </p>
                          <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            Concluída
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Stock Movements */}
            <Card className="surface-card">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-sky-400" />
                    Minhas Movimentações de Estoque ({myMovements.length})
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono border-sky-500/30 text-sky-400">
                    {myMovements.length} Movimentos
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {myMovements.length === 0 ? (
                  <EmptyState
                    icon={<ArrowLeftRight className="h-8 w-8 text-muted-foreground" />}
                    title="Nenhuma movimentação de estoque"
                    description="Você ainda não registrou entradas ou saídas de baú no período selecionado."
                  />
                ) : (
                  <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
                    {myMovements.map((mov) => (
                      <div key={mov.id} className="p-3.5 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                        <div>
                          <p className="font-bold text-xs text-foreground">
                            {(mov as any).product_name || "Item de Estoque"}
                          </p>
                          <p className="text-[0.65rem] text-muted-foreground font-mono">
                            {dateTime(mov.created_at)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-mono font-bold",
                            mov.type === "entrada"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          )}
                        >
                          {mov.type === "entrada" ? `+${mov.quantity} (Entrada)` : `-${mov.quantity} (Saída)`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* My Goals Card */}
          {myGoals.length > 0 && (
            <Card className="surface-card">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-400" />
                  Minhas Metas Atribuidas ({myGoals.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {myGoals.map((goal) => {
                    const prog = goalProgress(goal, activeSales);
                    const pct = prog.percent;
                    const isDone = prog.status === "concluida" || pct >= 100;

                    return (
                      <div key={goal.id} className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-extrabold text-xs text-foreground">{goal.descricao || GOAL_TYPE_LABEL[goal.type] || "Meta"}</p>
                          <Badge variant="outline" className={isDone ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-amber-500/10 text-amber-400 border-amber-500/30"}>
                            {GOAL_STATUS_LABEL[prog.status] || (isDone ? "Concluída" : "Em Andamento")}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[0.65rem] font-mono">
                            <span className="text-muted-foreground">{num(prog.current)} de {num(goal.target_value)}</span>
                            <span className="font-bold text-primary">{pct.toFixed(0)}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
