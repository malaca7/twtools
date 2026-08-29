import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Medal, Crown, TrendingUp, ShoppingCart, ArrowLeftRight, Calendar } from "lucide-react";
import { PageHeader, NoAccess, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useSales, useMovements, useMembers, nameOf } from "@/hooks/useData";
import { currency, num } from "@/lib/format";
import { getLevelLabel, levelBadgeClass } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/rankings")({
  component: RankingsPage,
});

type RankedMember = {
  user_id: string;
  nome: string;
  nickname: string | null;
  nivel: string | null;
  totalRevenue: number;
  salesCount: number;
  movementsCount: number;
};

function RankingsPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("view_rankings");

  const { data: sales = [], isLoading: loadingSales } = useSales();
  const { data: movements = [], isLoading: loadingMovements } = useMovements();
  const { data: members = [], isLoading: loadingMembers } = useMembers();

  const [period, setPeriod] = useState<"week" | "month" | "all">("all");
  const [rankingType, setRankingType] = useState<"revenue" | "sales" | "movements">("revenue");

  if (!canView) return <NoAccess />;

  const isLoading = loadingSales || loadingMovements || loadingMembers;

  // Period filtering calculation
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filterByDate = (dateStr: string) => {
    if (period === "all") return true;
    const d = new Date(dateStr);
    if (period === "week") return d >= weekAgo;
    if (period === "month") return d >= monthAgo;
    return true;
  };

  const filteredSales = sales.filter((s) => s.status === "concluida" && filterByDate(s.created_at));
  const filteredMovements = movements.filter((m) => filterByDate(m.created_at));

  // Aggregate stats per member
  const memberStatsMap = new Map<string, { revenue: number; salesCount: number; movementsCount: number }>();

  filteredSales.forEach((s) => {
    const cur = memberStatsMap.get(s.seller_id) || { revenue: 0, salesCount: 0, movementsCount: 0 };
    cur.revenue += Number(s.total_price);
    cur.salesCount += 1;
    memberStatsMap.set(s.seller_id, cur);
  });

  filteredMovements.forEach((m) => {
    const cur = memberStatsMap.get(m.user_id) || { revenue: 0, salesCount: 0, movementsCount: 0 };
    cur.movementsCount += 1;
    memberStatsMap.set(m.user_id, cur);
  });

  // Map to member array
  const rankedList: RankedMember[] = members.map((m) => {
    const stats = memberStatsMap.get(m.user_id) || { revenue: 0, salesCount: 0, movementsCount: 0 };
    return {
      user_id: m.user_id,
      nome: m.nome,
      nickname: m.nickname,
      nivel: m.nivel,
      totalRevenue: stats.revenue,
      salesCount: stats.salesCount,
      movementsCount: stats.movementsCount,
    };
  });

  // Sort according to selected ranking type
  if (rankingType === "revenue") {
    rankedList.sort((a, b) => b.totalRevenue - a.totalRevenue);
  } else if (rankingType === "sales") {
    rankedList.sort((a, b) => b.salesCount - a.salesCount);
  } else {
    rankedList.sort((a, b) => b.movementsCount - a.movementsCount);
  }

  // Top 3 Podium
  const first = rankedList[0];
  const second = rankedList[1];
  const third = rankedList[2];
  const remaining = rankedList.slice(3);

  const getMetricDisplay = (m?: RankedMember) => {
    if (!m) return "0";
    if (rankingType === "revenue") return currency(m.totalRevenue);
    if (rankingType === "sales") return `${m.salesCount} vendas`;
    return `${m.movementsCount} mov.`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Rankings & Liderança"
        description="Classificação dos membros do grupo por vendas, faturamento e operações."
      />

      {/* Period & Category Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={rankingType} onValueChange={(v) => setRankingType(v as any)} className="w-full sm:w-auto">
          <TabsList className="bg-secondary/60">
            <TabsTrigger value="revenue" className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Top Faturamento
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4" /> Top Vendas
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-1.5">
              <ArrowLeftRight className="h-4 w-4" /> Top Movimentações
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList className="bg-secondary/40">
              <TabsTrigger value="week" className="text-xs">
                Esta Semana
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs">
                Este Mês
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                Geral
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <>
          {/* PODIUM CARDS (1st, 2nd, 3rd) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
            {/* 2nd Place (Silver) */}
            <Card className="order-2 border-slate-700/60 bg-gradient-to-b from-slate-800/40 to-card/60 backdrop-blur md:order-1">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="relative mb-3">
                  <Avatar className="h-16 w-16 border-2 border-slate-400 shadow-md">
                    <AvatarFallback className="bg-slate-800 text-slate-200 font-bold">
                      {(second?.nickname || second?.nome || "2º").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-slate-400 p-1 text-slate-950 shadow">
                    <Medal className="h-4 w-4" />
                  </div>
                </div>

                <Badge variant="outline" className="mb-1 border-slate-500 text-slate-300">
                  2º Lugar
                </Badge>
                <h3 className="font-semibold text-foreground">{second?.nickname || second?.nome || "—"}</h3>
                <p className="text-xs text-muted-foreground">
                  {second?.nivel ? getLevelLabel(second.nivel) : "Membro"}
                </p>

                <div className="mt-4 text-lg font-bold text-slate-300">
                  {getMetricDisplay(second)}
                </div>
              </CardContent>
            </Card>

            {/* 1st Place (Gold / Champion) */}
            <Card className="order-1 border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-card/80 to-card backdrop-blur md:order-2 md:-translate-y-2 shadow-lg">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="relative mb-3">
                  <Avatar className="h-20 w-20 border-4 border-amber-500 shadow-lg shadow-amber-500/20">
                    <AvatarFallback className="bg-amber-950 text-amber-300 font-bold text-lg">
                      {(first?.nickname || first?.nome || "1º").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-3 right-1/2 translate-x-1/2 text-amber-400 animate-bounce">
                    <Crown className="h-6 w-6 fill-amber-400" />
                  </div>
                  <div className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-amber-500 p-1 text-slate-950 shadow">
                    <Trophy className="h-4 w-4" />
                  </div>
                </div>

                <Badge className="mb-1 bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
                  1º Lugar · Campeão
                </Badge>
                <h3 className="text-lg font-bold text-foreground">{first?.nickname || first?.nome || "—"}</h3>
                <p className="text-xs text-muted-foreground">
                  {first?.nivel ? getLevelLabel(first.nivel) : "Membro"}
                </p>

                <div className="mt-4 text-2xl font-black text-amber-400">
                  {getMetricDisplay(first)}
                </div>
              </CardContent>
            </Card>

            {/* 3rd Place (Bronze) */}
            <Card className="order-3 border-amber-800/40 bg-gradient-to-b from-amber-900/20 to-card/60 backdrop-blur md:order-3">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="relative mb-3">
                  <Avatar className="h-16 w-16 border-2 border-amber-700 shadow-md">
                    <AvatarFallback className="bg-amber-950 text-amber-500 font-bold">
                      {(third?.nickname || third?.nome || "3º").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-amber-700 p-1 text-slate-950 shadow">
                    <Medal className="h-4 w-4" />
                  </div>
                </div>

                <Badge variant="outline" className="mb-1 border-amber-700 text-amber-600">
                  3º Lugar
                </Badge>
                <h3 className="font-semibold text-foreground">{third?.nickname || third?.nome || "—"}</h3>
                <p className="text-xs text-muted-foreground">
                  {third?.nivel ? getLevelLabel(third.nivel) : "Membro"}
                </p>

                <div className="mt-4 text-lg font-bold text-amber-600">
                  {getMetricDisplay(third)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LEADERBOARD TABLE (4th onwards) */}
          <Card className="border-border bg-card/60 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">
                Classificação Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {rankedList.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="h-10 w-10 text-muted-foreground" />}
                  title="Nenhum dado de ranking"
                  description="Ainda não há registros no período selecionado."
                />
              ) : (
                <>
                  {/* MOBILE LIST VIEW */}
                  <div className="space-y-2.5 p-3 md:hidden">
                    {rankedList.map((m, idx) => {
                      const pos = idx + 1;
                      return (
                        <div
                          key={m.user_id}
                          className={cn(
                            "p-3 rounded-xl border bg-card shadow-xs flex items-center justify-between gap-2.5",
                            pos <= 3 ? "border-primary/40 bg-primary/5" : "border-border/70"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono font-black text-xs text-muted-foreground w-6 text-center shrink-0">
                              {pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `${pos}º`}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">
                                {m.nickname || m.nome}
                              </p>
                              <div className="flex items-center gap-1.5 pt-0.5">
                                {m.nivel && (
                                  <Badge variant="outline" className={cn("text-[9px] px-1 py-0", levelBadgeClass(m.nivel as any))}>
                                    {getLevelLabel(m.nivel)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-black text-xs text-primary font-mono block">
                              {currency(m.totalRevenue)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {m.salesCount} vendas · {m.movementsCount} mov.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP TABLE VIEW */}
                  <div className="hidden md:block overflow-x-auto w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 text-center">Posição</TableHead>
                          <TableHead>Membro</TableHead>
                          <TableHead>Cargo / Nível</TableHead>
                          <TableHead className="text-right">Faturamento</TableHead>
                          <TableHead className="text-right">Vendas</TableHead>
                          <TableHead className="text-right">Movimentações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankedList.map((m, idx) => {
                          const pos = idx + 1;
                          return (
                            <TableRow key={m.user_id} className={pos <= 3 ? "bg-secondary/30" : ""}>
                              <TableCell className="text-center font-bold text-muted-foreground">
                                {pos === 1 ? "🥇 1º" : pos === 2 ? "🥈 2º" : pos === 3 ? "🥉 3º" : `${pos}º`}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {m.nickname ? `${m.nickname} (${m.nome})` : m.nome}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {m.nivel ? (
                                  <Badge
                                    variant="outline"
                                    className={levelBadgeClass(m.nivel as any)}
                                  >
                                    {getLevelLabel(m.nivel)}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-accent">
                                {currency(m.totalRevenue)}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-foreground">
                                {m.salesCount}
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {m.movementsCount}
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
    </div>
  );
}
