import { useState, useMemo } from "react";
import { createFileRoute, Outlet, useChildMatches, Link } from "@tanstack/react-router";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  ShoppingCart,
  ArrowLeftRight,
  Calendar,
  Star,
  ChevronRight,
} from "lucide-react";
import { PageHeader, NoAccess, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useUrlTab } from "@/hooks/useUrlTab";
import { useSales, useMovements, useMembers, nameOf } from "@/hooks/useData";
import { currency, num } from "@/lib/format";
import { getLevelLabel, levelBadgeClass } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberEvaluationModal } from "@/components/performance/MemberEvaluationModal";
import { useMemberTagsMap } from "@/hooks/useMemberTags";
import { MemberTagBadge } from "@/components/ui/MemberTagBadge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

export const Route = createFileRoute("/_authenticated/rankings")({
  component: RankingsWrapper,
});

function RankingsWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <RankingsPage />;
}

type LegacyRankedMember = {
  user_id: string;
  nome: string;
  nickname: string | null;
  nivel: string | null;
  totalRevenue: number;
  salesCount: number;
  movementsCount: number;
};

export function RankingsPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("view_rankings");

  if (!canView) return <NoAccess />;
  return <RankingsContent />;
}

function RankingsContent() {
  const { user, profile, isDevUser, isCeoUser, hasPermission } = useAuth();
  const memberTagsMap = useMemberTagsMap();
  const canViewFinancial = hasPermission("view_rankings_financial");
  const canViewMovements = hasPermission("view_rankings_movements");
  const canEvaluate = Boolean(
    hasPermission("evaluate_member") ||
    hasPermission("manage_performance") ||
    isDevUser ||
    isCeoUser
  );

  // Abas de classificação sincronizadas com a URL (?tipo=revenue | sales | movements)
  const defaultTab = canViewFinancial ? "revenue" : "movements";
  const [rankingType, setRankingType] = useUrlTab<"revenue" | "sales" | "movements">(defaultTab, {
    paramName: "tipo",
    allowedTabs: ["revenue", "sales", "movements"],
    usePath: false,
  });

  // Filtro de período (?periodo=week | month | all)
  const [period, setPeriod] = useUrlTab<"week" | "month" | "all">("all", {
    paramName: "periodo",
    allowedTabs: ["week", "month", "all"],
    usePath: false,
  });

  // Modal de avaliação
  const [evaluatingMember, setEvaluatingMember] = useState<any | null>(null);

  // Consultas aos dados de vendas, movimentações e membros
  const { data: sales = [], isLoading: loadingSales } = useSales();
  const { data: movements = [], isLoading: loadingMovements } = useMovements();
  const { data: members = [], isLoading: loadingMembers } = useMembers();

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

  // Aggregate stats per member for rankings
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

  const rankedList: LegacyRankedMember[] = members.map((m) => {
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

  if (rankingType === "revenue") {
    rankedList.sort((a, b) => b.totalRevenue - a.totalRevenue);
  } else if (rankingType === "sales") {
    rankedList.sort((a, b) => b.salesCount - a.salesCount);
  } else if (rankingType === "movements") {
    rankedList.sort((a, b) => b.movementsCount - a.movementsCount);
  }

  const isCurrentLoading = loadingSales || loadingMovements || loadingMembers;
  const currentListCount = rankedList.length;

  // Posição do usuário logado
  const myIndex = rankedList.findIndex((m) => m.user_id === user?.id);
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const myStats = user?.id ? memberStatsMap.get(user.id) : null;

  // Top 3 Podium Selection
  const first = rankedList[0];
  const second = rankedList[1];
  const third = rankedList[2];

  const getMetricDisplay = (m?: LegacyRankedMember) => {
    if (!m) return "0";
    if (rankingType === "revenue") return currency(m.totalRevenue);
    if (rankingType === "sales") return `${m.salesCount} vendas`;
    return `${m.movementsCount} mov.`;
  };

  const getMetricLabel = () => {
    if (rankingType === "revenue") return "Faturamento Total";
    if (rankingType === "sales") return "Vendas Realizadas";
    return "Movimentações de Baú";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Rankings Operacionais"
          description="Classificação dos membros do grupo por faturamento, vendas e movimentações operacionais."
        />
      </div>

      {/* DESTAQUE DA POSIÇÃO DO PRÓPRIO USUÁRIO */}
      <Card className="border-primary/40 bg-gradient-to-r from-primary/15 via-card/90 to-card backdrop-blur-md shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <CardContent className="p-4 sm:p-6 relative z-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Lado Esquerdo: Identificação e Posição */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/60 shadow-lg">
                  <AvatarImage src={profile?.avatar_url || profile?.discord_avatar_url || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-base">
                    {(profile?.nickname || profile?.nome || "EU").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1.5 -right-1 rounded-full bg-primary p-1 text-primary-foreground shadow">
                  <Trophy className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase font-mono tracking-wider text-primary font-bold">
                    Sua Posição no Ranking
                  </span>
                  {myRank ? (
                    <Badge className="bg-primary text-primary-foreground font-black text-xs px-2 py-0.5">
                      #{myRank} Geral
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-muted-foreground/30 text-muted-foreground">
                      Sem classificação ativa
                    </Badge>
                  )}
                  {profile?.status === "ativo" && (
                    <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] py-0">
                      Ativo
                    </Badge>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-black text-foreground truncate mt-0.5">
                  {profile?.nickname || profile?.nome || "Você"}
                </h2>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5 flex-wrap">
                  <span className="font-semibold text-foreground">
                    {profile?.nivel ? getLevelLabel(profile.nivel) : "Membro"}
                  </span>
                  <span>•</span>
                  <span className="text-primary font-mono font-bold">
                    {rankingType === "revenue"
                      ? currency(myStats?.revenue || 0)
                      : rankingType === "sales"
                      ? `${myStats?.salesCount || 0} vendas`
                      : `${myStats?.movementsCount || 0} movimentações`}
                  </span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Acesso rápido */}
            <div className="flex items-center gap-3 shrink-0">
              <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-xl">
                <Link to="/desempenho">
                  <span>Meu Desempenho</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CATEGORY & PERIOD SWITCHERS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={rankingType} onValueChange={(v) => setRankingType(v as any)} className="w-full sm:w-auto">
          <TabsList className="bg-secondary/60 flex-wrap w-full sm:w-auto h-auto p-1 gap-1">
            {canViewFinancial && (
              <>
                <TabsTrigger value="revenue" className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" /> Top Faturamento
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4" /> Top Vendas
                </TabsTrigger>
              </>
            )}
            {canViewMovements && (
              <TabsTrigger value="movements" className="flex items-center gap-1.5">
                <ArrowLeftRight className="h-4 w-4" /> Top Movimentações
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full sm:w-auto">
            <TabsList className="bg-secondary/40 w-full sm:w-auto h-auto p-1 gap-1">
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

      {isCurrentLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <>
          {/* PODIUM CARDS */}
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
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h3 className="font-semibold text-foreground">{second?.nickname || second?.nome || "—"}</h3>
                  <VerifiedBadge isVerified={members.find((m) => m.user_id === second?.user_id)?.is_verified} userId={second?.user_id} size="xs" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {second?.nivel ? getLevelLabel(second.nivel) : "Membro"}
                </p>

                <div className="mt-4 text-lg font-bold text-slate-300">
                  {getMetricDisplay(second)}
                </div>

                {canEvaluate && second && (
                  <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-border/40 w-full justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEvaluatingMember(second)}
                      className="h-7 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    >
                      <Star className="h-3 w-3 fill-amber-400" /> Avaliar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 1st Place (Gold) */}
            <Card className="order-1 border-amber-500/60 bg-gradient-to-b from-amber-950/40 via-card/80 to-card/60 backdrop-blur md:order-2 md:-translate-y-2 shadow-xl shadow-amber-500/5">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="relative mb-3">
                  <Avatar className="h-20 w-20 border-2 border-amber-400 shadow-lg">
                    <AvatarFallback className="bg-amber-900/60 text-amber-200 font-bold text-lg">
                      {(first?.nickname || first?.nome || "1º").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-amber-400 p-1.5 text-amber-950 shadow">
                    <Crown className="h-5 w-5 fill-current" />
                  </div>
                </div>

                <Badge className="mb-1 bg-amber-400 text-amber-950 font-bold">
                  1º Lugar · Líder
                </Badge>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground">{first?.nickname || first?.nome || "—"}</h3>
                  <VerifiedBadge isVerified={members.find((m) => m.user_id === first?.user_id)?.is_verified} userId={first?.user_id} size="xs" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {first?.nivel ? getLevelLabel(first.nivel) : "Membro"}
                </p>

                <div className="mt-4 text-xl font-black text-amber-400 font-mono">
                  {getMetricDisplay(first)}
                </div>

                {canEvaluate && first && (
                  <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-border/40 w-full justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEvaluatingMember(first)}
                      className="h-7 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    >
                      <Star className="h-3 w-3 fill-amber-400" /> Avaliar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3rd Place (Bronze) */}
            <Card className="order-3 border-amber-800/50 bg-gradient-to-b from-amber-950/20 to-card/60 backdrop-blur md:order-3">
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="relative mb-3">
                  <Avatar className="h-16 w-16 border-2 border-amber-700 shadow-md">
                    <AvatarFallback className="bg-amber-950 text-amber-300 font-bold">
                      {(third?.nickname || third?.nome || "3º").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-amber-700 p-1 text-amber-100 shadow">
                    <Medal className="h-4 w-4" />
                  </div>
                </div>

                <Badge variant="outline" className="mb-1 border-amber-700 text-amber-500">
                  3º Lugar
                </Badge>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h3 className="font-semibold text-foreground">{third?.nickname || third?.nome || "—"}</h3>
                  <VerifiedBadge isVerified={members.find((m) => m.user_id === third?.user_id)?.is_verified} userId={third?.user_id} size="xs" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {third?.nivel ? getLevelLabel(third.nivel) : "Membro"}
                </p>

                <div className="mt-4 text-lg font-bold text-amber-500/90">
                  {getMetricDisplay(third)}
                </div>

                {canEvaluate && third && (
                  <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-border/40 w-full justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEvaluatingMember(third)}
                      className="h-7 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                    >
                      <Star className="h-3 w-3 fill-amber-400" /> Avaliar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* TABELA COMPLETA */}
          <Card className="surface-card">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span>Classificação Geral ({currentListCount} operadores)</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {getMetricLabel()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {rankedList.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="Nenhum registro encontrado"
                  description="Não há dados operacionais registrados para o período selecionado."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-secondary/20">
                      <TableRow>
                        <TableHead className="w-16 text-center">Posição</TableHead>
                        <TableHead>Operador / Membro</TableHead>
                        <TableHead>Cargo / Nível</TableHead>
                        <TableHead className="text-right">{getMetricLabel()}</TableHead>
                        {rankingType === "revenue" && (
                          <>
                            <TableHead className="text-center">Vendas</TableHead>
                            <TableHead className="text-right">Ticket Médio</TableHead>
                          </>
                        )}
                        {canEvaluate && <TableHead className="text-center w-28">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankedList.map((m, idx) => {
                        const rank = idx + 1;
                        const isUser = m.user_id === user?.id;
                        const tags = memberTagsMap[m.user_id] || [];
                        const avgTicket = m.salesCount > 0 ? m.totalRevenue / m.salesCount : 0;

                        return (
                          <TableRow
                            key={m.user_id}
                            className={cn(
                              "transition-colors",
                              isUser && "bg-primary/5 hover:bg-primary/10"
                            )}
                          >
                            <TableCell className="text-center font-bold font-mono">
                              {rank <= 3 ? (
                                <span
                                  className={cn(
                                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold",
                                    rank === 1 && "bg-amber-400 text-amber-950",
                                    rank === 2 && "bg-slate-300 text-slate-950",
                                    rank === 3 && "bg-amber-700 text-amber-100"
                                  )}
                                >
                                  {rank}
                                </span>
                              ) : (
                                `#${rank}`
                              )}
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-[10px] font-bold bg-primary/20 text-primary">
                                    {(m.nickname || m.nome || "MB").slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-xs text-foreground truncate">
                                      {m.nickname || m.nome}
                                    </span>
                                    <VerifiedBadge isVerified={members.find((mb) => mb.user_id === m.user_id)?.is_verified} userId={m.user_id} size="xs" />
                                    {isUser && (
                                      <Badge variant="outline" className="text-[9px] py-0 border-primary text-primary font-bold">
                                        Você
                                      </Badge>
                                    )}
                                  </div>
                                  {tags.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                      {tags.slice(0, 2).map((t) => (
                                        <MemberTagBadge key={t.id} tag={t} size="xs" />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              {m.nivel ? (
                                <Badge variant="outline" className={cn("text-[10px] py-0 font-mono", levelBadgeClass(m.nivel as any))}>
                                  {getLevelLabel(m.nivel)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>

                            <TableCell className="text-right font-mono font-bold text-foreground">
                              {getMetricDisplay(m)}
                            </TableCell>

                            {rankingType === "revenue" && (
                              <>
                                <TableCell className="text-center font-mono text-xs">
                                  {m.salesCount}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                  {currency(avgTicket)}
                                </TableCell>
                              </>
                            )}

                            {canEvaluate && (
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEvaluatingMember(m)}
                                  className="h-7 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                >
                                  <Star className="h-3 w-3 fill-amber-400" />
                                  <span className="hidden sm:inline">Avaliar</span>
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* MODAL DE AVALIAÇÃO DE DESEMPENHO (1 A 5 ESTRELAS) */}
      <MemberEvaluationModal
        open={Boolean(evaluatingMember)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEvaluatingMember(null);
        }}
        targetMember={evaluatingMember}
      />
    </div>
  );
}
