import { useState, useMemo } from "react";
import { createFileRoute, Outlet, useChildMatches, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  ShoppingCart,
  ArrowLeftRight,
  Calendar,
  Zap,
  Star,
  Award,
  Shield,
  Settings,
  Sparkles,
  ChevronRight,
  UserCheck,
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getGamificationRanking,
  getInsigniasCatalog,
  getLevelInfo,
  RARITY_CONFIG,
  type RankedGamificationMember,
} from "@/services/gamificationService";
import { InsigniaGrantModal } from "@/components/gamification/InsigniaGrantModal";
import { MemberEvaluationModal } from "@/components/gamification/MemberEvaluationModal";
import { InsigniaCatalogManagerModal } from "@/components/gamification/InsigniaCatalogManagerModal";

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
  const { user, profile, level, isDevUser, isCeoUser, hasPermission } = useAuth();
  const canView = hasPermission("view_rankings");

  const isManagerOrAdmin =
    Boolean(isDevUser || isCeoUser || level === "01" || level === "02" || level === "gerente");
  const isAdminOrDev =
    Boolean(isDevUser || isCeoUser || level === "01" || level === "desenvolvedor");

  // Abas de classificação sincronizadas com a URL (?tipo=xp | revenue | sales | movements)
  const [rankingType, setRankingType] = useUrlTab<"xp" | "revenue" | "sales" | "movements">("xp", {
    paramName: "tipo",
    allowedTabs: ["xp", "revenue", "sales", "movements"],
    usePath: false,
  });

  // Filtro de período (?periodo=week | month | all)
  const [period, setPeriod] = useUrlTab<"week" | "month" | "all">("all", {
    paramName: "periodo",
    allowedTabs: ["week", "month", "all"],
    usePath: false,
  });

  // Modais de avaliação, concessão e catálogo
  const [evaluatingMember, setEvaluatingMember] = useState<RankedGamificationMember | null>(null);
  const [grantingInsigniaMember, setGrantingInsigniaMember] = useState<RankedGamificationMember | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  // Consultas aos dados existentes e gamificação
  const { data: sales = [], isLoading: loadingSales } = useSales();
  const { data: movements = [], isLoading: loadingMovements } = useMovements();
  const { data: members = [], isLoading: loadingMembers } = useMembers();

  // Consulta do Ranking Oficial por XP do Supabase com cache e atualização contínua
  const { data: gamificationRanking = [], isLoading: loadingGamification } = useQuery({
    queryKey: ["gamification_ranking", period],
    queryFn: () => getGamificationRanking(period as any),
    refetchInterval: 30000,
  });

  if (!canView) return <NoAccess />;

  // Posição e destaque do próprio usuário logado
  const currentUserGamification = useMemo(() => {
    if (!user?.id || !gamificationRanking.length) return null;
    return gamificationRanking.find((m) => m.user_id === user.id) || null;
  }, [user?.id, gamificationRanking]);

  const currentUserLevelInfo = currentUserGamification
    ? getLevelInfo(currentUserGamification.xp)
    : profile?.xp
    ? getLevelInfo(profile.xp)
    : getLevelInfo(0);

  // Period filtering calculation for legacy metrics
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

  // Aggregate stats per member for legacy rankings
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

  const legacyRankedList: LegacyRankedMember[] = members.map((m) => {
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
    legacyRankedList.sort((a, b) => b.totalRevenue - a.totalRevenue);
  } else if (rankingType === "sales") {
    legacyRankedList.sort((a, b) => b.salesCount - a.salesCount);
  } else if (rankingType === "movements") {
    legacyRankedList.sort((a, b) => b.movementsCount - a.movementsCount);
  }

  const isCurrentLoading =
    rankingType === "xp" ? loadingGamification : loadingSales || loadingMovements || loadingMembers;

  const currentListCount = rankingType === "xp" ? gamificationRanking.length : legacyRankedList.length;

  // Top 3 Podium Selection
  const xpFirst = gamificationRanking[0];
  const xpSecond = gamificationRanking[1];
  const xpThird = gamificationRanking[2];

  const legacyFirst = legacyRankedList[0];
  const legacySecond = legacyRankedList[1];
  const legacyThird = legacyRankedList[2];

  const getLegacyMetricDisplay = (m?: LegacyRankedMember) => {
    if (!m) return "0";
    if (rankingType === "revenue") return currency(m.totalRevenue);
    if (rankingType === "sales") return `${m.salesCount} vendas`;
    return `${m.movementsCount} mov.`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Rankings & Liderança"
          description="Classificação dos membros do grupo por XP, patentes de honra, faturamento e operações."
        />

        {isAdminOrDev && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCatalogModalOpen(true)}
              className="gap-1.5 border-primary/40 bg-card/60 hover:bg-primary/10 hover:border-primary text-xs"
            >
              <Settings className="h-3.5 w-3.5 text-primary" />
              <span>Catálogo de Insígnias</span>
            </Button>
          </div>
        )}
      </div>

      {/* DESTAQUE DA POSIÇÃO DO PRÓPRIO USUÁRIO (SEMPRE VISÍVEL) */}
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
                  <Zap className="h-3.5 w-3.5 fill-current" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase font-mono tracking-wider text-primary font-bold">
                    Sua Posição Oficial
                  </span>
                  {currentUserGamification?.rank_position ? (
                    <Badge className="bg-primary text-primary-foreground font-black text-xs px-2 py-0.5">
                      #{currentUserGamification.rank_position} Geral
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
                    Nv. {currentUserLevelInfo.level} · {currentUserLevelInfo.title}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    {(currentUserGamification?.stars_rating ?? profile?.stars_rating ?? 5.0).toFixed(1)}
                  </span>
                  <span>•</span>
                  <span className="text-primary font-mono font-bold">
                    {num(currentUserGamification?.xp ?? profile?.xp ?? 0)} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Lado Direito: Barra de Progresso para o Próximo Nível e Conquistas */}
            <div className="flex flex-col gap-2 w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 md:pl-6">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Progresso do Nível
                </span>
                <span className="font-mono font-bold text-foreground">
                  {currentUserLevelInfo.progressPercent}%
                </span>
              </div>

              <Progress value={currentUserLevelInfo.progressPercent} className="h-2.5 bg-secondary/80" />

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {num(currentUserLevelInfo.xpInCurrentLevel)} / {num(currentUserLevelInfo.xpNeededForNext + currentUserLevelInfo.xpInCurrentLevel)} XP
                </span>
                <span className="text-primary font-medium">
                  {currentUserLevelInfo.xpNeededForNext > 0
                    ? `Faltam ${num(currentUserLevelInfo.xpNeededForNext)} XP`
                    : "Nível Máximo"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Award className="h-3.5 w-3.5 text-amber-400" />
                  <span>
                    <strong className="text-foreground font-mono">
                      {currentUserGamification?.insignias_count ?? 0}
                    </strong>{" "}
                    insígnias
                  </span>
                </div>

                <Link
                  to="/perfil"
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <span>Ver meu perfil</span>
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CATEGORY & PERIOD SWITCHERS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={rankingType} onValueChange={(v) => setRankingType(v as any)} className="w-full sm:w-auto">
          <TabsList className="bg-secondary/60 flex-wrap">
            <TabsTrigger value="xp" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold">
              <Zap className="h-4 w-4 fill-current" /> Top XP & Nível
            </TabsTrigger>
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

        <div className="flex items-center gap-2 self-end sm:self-auto">
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

      {isCurrentLoading ? (
        <TableSkeleton rows={6} />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* SEÇÃO 1: RANKING POR XP (PRINCIPAL) */}
          {/* ========================================================================= */}
          {rankingType === "xp" && (
            <>
              {/* PODIUM CARDS (XP) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
                {/* 2º Lugar (Prata) */}
                <Card className="order-2 border-slate-700/60 bg-gradient-to-b from-slate-800/40 to-card/60 backdrop-blur md:order-1 transition-all hover:border-slate-500/80">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="relative mb-3">
                      <Avatar className="h-16 w-16 border-2 border-slate-400 shadow-md">
                        <AvatarImage src={xpSecond?.avatar_url || ""} />
                        <AvatarFallback className="bg-slate-800 text-slate-200 font-bold">
                          {(xpSecond?.nickname || xpSecond?.nome || "2º").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-slate-400 p-1 text-slate-950 shadow">
                        <Medal className="h-4 w-4" />
                      </div>
                    </div>

                    <Badge variant="outline" className="mb-1 border-slate-500 text-slate-300">
                      2º Lugar
                    </Badge>
                    <h3 className="font-bold text-foreground text-base truncate max-w-[200px]">
                      {xpSecond?.nickname || xpSecond?.nome || "—"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {xpSecond?.nivel ? getLevelLabel(xpSecond.nivel) : "Membro"}
                    </p>

                    {xpSecond && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center">
                        <Badge className="bg-primary/20 text-primary border border-primary/30 text-[10px] py-0 font-bold">
                          Nv. {xpSecond.gamification_level} · {getLevelInfo(xpSecond.xp).title}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] py-0 border-amber-500/40 text-amber-300 flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400" />
                          {xpSecond.stars_rating.toFixed(1)}
                        </Badge>
                      </div>
                    )}

                    <div className="mt-4 text-xl font-black text-slate-200 font-mono">
                      {xpSecond ? `${num(xpSecond.xp)} XP` : "0 XP"}
                    </div>

                    {xpSecond?.insignias_count ? (
                      <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Award className="h-3 w-3 text-amber-400" /> {xpSecond.insignias_count} insígnias
                      </span>
                    ) : null}

                    {/* Ações de Gestão para 2º Lugar */}
                    {isManagerOrAdmin && xpSecond && (
                      <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-border/40 w-full justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEvaluatingMember(xpSecond)}
                          className="h-7 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        >
                          <Star className="h-3 w-3 fill-amber-400" /> Avaliar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setGrantingInsigniaMember(xpSecond)}
                          className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Award className="h-3 w-3" /> Insígnia
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 1º Lugar (Ouro / Campeão de XP) */}
                <Card className="order-1 border-amber-500/60 bg-gradient-to-b from-amber-500/15 via-card/90 to-card backdrop-blur md:order-2 md:-translate-y-2 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/30">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="relative mb-3">
                      <Avatar className="h-20 w-20 border-4 border-amber-500 shadow-xl shadow-amber-500/30">
                        <AvatarImage src={xpFirst?.avatar_url || ""} />
                        <AvatarFallback className="bg-amber-950 text-amber-300 font-bold text-lg">
                          {(xpFirst?.nickname || xpFirst?.nome || "1º").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-4 right-1/2 translate-x-1/2 text-amber-400 animate-bounce">
                        <Crown className="h-7 w-7 fill-amber-400" />
                      </div>
                      <div className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-amber-500 p-1 text-slate-950 shadow-md">
                        <Trophy className="h-4 w-4" />
                      </div>
                    </div>

                    <Badge className="mb-1 bg-amber-500 text-slate-950 font-black hover:bg-amber-400 shadow-md shadow-amber-500/20">
                      1º Lugar · Campeão Geral
                    </Badge>
                    <h3 className="text-lg font-black text-foreground truncate max-w-[220px]">
                      {xpFirst?.nickname || xpFirst?.nome || "—"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {xpFirst?.nivel ? getLevelLabel(xpFirst.nivel) : "Membro"}
                    </p>

                    {xpFirst && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center">
                        <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] py-0 font-bold">
                          Nv. {xpFirst.gamification_level} · {getLevelInfo(xpFirst.xp).title}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] py-0 border-amber-500/50 text-amber-300 flex items-center gap-0.5 font-bold">
                          <Star className="h-2.5 w-2.5 fill-amber-400" />
                          {xpFirst.stars_rating.toFixed(1)}
                        </Badge>
                      </div>
                    )}

                    <div className="mt-4 text-2xl font-black text-amber-400 font-mono tracking-tight">
                      {xpFirst ? `${num(xpFirst.xp)} XP` : "0 XP"}
                    </div>

                    {xpFirst?.insignias_count ? (
                      <span className="text-xs text-amber-300/80 mt-1 flex items-center gap-1 font-semibold">
                        <Award className="h-3.5 w-3.5 text-amber-400" /> {xpFirst.insignias_count} insígnias conquistadas
                      </span>
                    ) : null}

                    {/* Ações de Gestão para 1º Lugar */}
                    {isManagerOrAdmin && xpFirst && (
                      <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-amber-500/20 w-full justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEvaluatingMember(xpFirst)}
                          className="h-7 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        >
                          <Star className="h-3 w-3 fill-amber-400" /> Avaliar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setGrantingInsigniaMember(xpFirst)}
                          className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Award className="h-3 w-3" /> Insígnia
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 3º Lugar (Bronze) */}
                <Card className="order-3 border-amber-800/40 bg-gradient-to-b from-amber-900/20 to-card/60 backdrop-blur md:order-3 transition-all hover:border-amber-700/60">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="relative mb-3">
                      <Avatar className="h-16 w-16 border-2 border-amber-700 shadow-md">
                        <AvatarImage src={xpThird?.avatar_url || ""} />
                        <AvatarFallback className="bg-amber-950 text-amber-500 font-bold">
                          {(xpThird?.nickname || xpThird?.nome || "3º").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-amber-700 p-1 text-slate-950 shadow">
                        <Medal className="h-4 w-4" />
                      </div>
                    </div>

                    <Badge variant="outline" className="mb-1 border-amber-700 text-amber-600">
                      3º Lugar
                    </Badge>
                    <h3 className="font-bold text-foreground text-base truncate max-w-[200px]">
                      {xpThird?.nickname || xpThird?.nome || "—"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {xpThird?.nivel ? getLevelLabel(xpThird.nivel) : "Membro"}
                    </p>

                    {xpThird && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap justify-center">
                        <Badge className="bg-primary/20 text-primary border border-primary/30 text-[10px] py-0 font-bold">
                          Nv. {xpThird.gamification_level} · {getLevelInfo(xpThird.xp).title}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] py-0 border-amber-500/40 text-amber-300 flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-amber-400" />
                          {xpThird.stars_rating.toFixed(1)}
                        </Badge>
                      </div>
                    )}

                    <div className="mt-4 text-xl font-black text-amber-600 font-mono">
                      {xpThird ? `${num(xpThird.xp)} XP` : "0 XP"}
                    </div>

                    {xpThird?.insignias_count ? (
                      <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Award className="h-3 w-3 text-amber-400" /> {xpThird.insignias_count} insígnias
                      </span>
                    ) : null}

                    {/* Ações de Gestão para 3º Lugar */}
                    {isManagerOrAdmin && xpThird && (
                      <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-border/40 w-full justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEvaluatingMember(xpThird)}
                          className="h-7 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                        >
                          <Star className="h-3 w-3 fill-amber-400" /> Avaliar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setGrantingInsigniaMember(xpThird)}
                          className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Award className="h-3 w-3" /> Insígnia
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* TABELA GERAL DE RANKING POR XP */}
              <Card className="border-border bg-card/60 backdrop-blur shadow-md">
                <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary fill-current" />
                      <span>Classificação Geral por Experiência & Honra</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {gamificationRanking.length} membros qualificados no ranking oficial da facção.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {gamificationRanking.length === 0 ? (
                    <EmptyState
                      icon={<Trophy className="h-10 w-10 text-muted-foreground" />}
                      title="Nenhum registro de XP"
                      description="Ainda não há membros pontuados com as regras ativas de gamificação."
                    />
                  ) : (
                    <>
                      {/* MOBILE LIST VIEW */}
                      <div className="space-y-2.5 p-3 md:hidden">
                        {gamificationRanking.map((m) => {
                          const pos = m.rank_position;
                          const isMe = m.user_id === user?.id;
                          const lvlInfo = getLevelInfo(m.xp);

                          return (
                            <div
                              key={m.user_id}
                              className={cn(
                                "p-3 rounded-xl border bg-card shadow-xs flex flex-col gap-2.5 transition-all",
                                isMe ? "ring-2 ring-primary border-primary bg-primary/5" : pos <= 3 ? "border-primary/40 bg-primary/5" : "border-border/70"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="font-mono font-black text-xs text-muted-foreground w-6 text-center shrink-0">
                                    {pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `${pos}º`}
                                  </span>

                                  <Avatar className="h-9 w-9 border border-border shrink-0">
                                    <AvatarImage src={m.avatar_url || ""} />
                                    <AvatarFallback className="font-bold text-xs">
                                      {(m.nickname || m.nome).slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-bold text-xs text-foreground truncate">
                                        {m.nickname || m.nome}
                                      </p>
                                      {isMe && (
                                        <Badge className="bg-primary text-primary-foreground text-[9px] px-1 py-0">
                                          Você
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 pt-0.5">
                                      {m.nivel && (
                                        <Badge variant="outline" className={cn("text-[9px] px-1 py-0", levelBadgeClass(m.nivel as any))}>
                                          {getLevelLabel(m.nivel)}
                                        </Badge>
                                      )}
                                      <span className="text-[10px] text-muted-foreground font-semibold">
                                        Nv. {m.gamification_level}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-black text-xs text-primary font-mono block">
                                    {num(m.xp)} XP
                                  </span>
                                  <div className="flex items-center gap-1 justify-end pt-0.5">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    <span className="text-[10px] font-bold text-amber-400">
                                      {m.stars_rating.toFixed(1)}
                                    </span>
                                    {m.insignias_count > 0 && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-300 ml-1">
                                        🎖️ {m.insignias_count}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Barra de Progresso Mobile */}
                              <div className="w-full space-y-1">
                                <Progress value={lvlInfo.progressPercent} className="h-1.5" />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                  <span>{lvlInfo.title}</span>
                                  <span>{lvlInfo.progressPercent}%</span>
                                </div>
                              </div>

                              {/* Ações para Gerente / Admin */}
                              {isManagerOrAdmin && (
                                <div className="flex items-center gap-1 pt-2 border-t border-border/40 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEvaluatingMember(m)}
                                    className="h-6 text-[10px] px-2 gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                  >
                                    <Star className="h-2.5 w-2.5 fill-amber-400" /> Avaliar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setGrantingInsigniaMember(m)}
                                    className="h-6 text-[10px] px-2 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                  >
                                    <Award className="h-2.5 w-2.5" /> Insígnia
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* DESKTOP TABLE VIEW */}
                      <div className="hidden md:block overflow-x-auto w-full">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b border-border/60">
                              <TableHead className="w-16 text-center">Posição</TableHead>
                              <TableHead>Membro</TableHead>
                              <TableHead>Cargo Facção</TableHead>
                              <TableHead>Nível & Patente</TableHead>
                              <TableHead className="text-right">Experiência (XP)</TableHead>
                              <TableHead className="text-center">Avaliação</TableHead>
                              <TableHead className="text-center">Insígnias</TableHead>
                              {isManagerOrAdmin && <TableHead className="text-right pr-6">Ações</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {gamificationRanking.map((m) => {
                              const pos = m.rank_position;
                              const isMe = m.user_id === user?.id;
                              const lvlInfo = getLevelInfo(m.xp);

                              return (
                                <TableRow
                                  key={m.user_id}
                                  className={cn(
                                    "transition-colors",
                                    isMe
                                      ? "bg-primary/10 hover:bg-primary/15 font-semibold"
                                      : pos <= 3
                                      ? "bg-secondary/30 hover:bg-secondary/50"
                                      : "hover:bg-secondary/20"
                                  )}
                                >
                                  {/* Posição */}
                                  <TableCell className="text-center font-bold text-muted-foreground">
                                    {pos === 1 ? (
                                      <span className="text-amber-400 font-black">🥇 1º</span>
                                    ) : pos === 2 ? (
                                      <span className="text-slate-300 font-black">🥈 2º</span>
                                    ) : pos === 3 ? (
                                      <span className="text-amber-600 font-black">🥉 3º</span>
                                    ) : (
                                      <span className="font-mono text-xs">{pos}º</span>
                                    )}
                                  </TableCell>

                                  {/* Membro */}
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-9 w-9 border border-border shrink-0">
                                        <AvatarImage src={m.avatar_url || ""} />
                                        <AvatarFallback className="font-bold text-xs">
                                          {(m.nickname || m.nome).slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <p className="font-bold text-foreground text-sm leading-tight">
                                            {m.nickname || m.nome}
                                          </p>
                                          {isMe && (
                                            <Badge className="bg-primary text-primary-foreground text-[9px] px-1 py-0 font-bold">
                                              Você
                                            </Badge>
                                          )}
                                        </div>
                                        <span className="text-[11px] text-muted-foreground">
                                          {m.nome}
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>

                                  {/* Cargo */}
                                  <TableCell>
                                    {m.nivel ? (
                                      <Badge
                                        variant="outline"
                                        className={cn("text-[10px] py-0 font-mono font-bold", levelBadgeClass(m.nivel as any))}
                                      >
                                        {getLevelLabel(m.nivel)}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">—</span>
                                    )}
                                  </TableCell>

                                  {/* Nível Gamificado & Patente */}
                                  <TableCell>
                                    <div className="space-y-1 max-w-[180px]">
                                      <div className="flex items-center gap-1.5">
                                        <Badge className="bg-primary/20 text-primary border border-primary/40 text-[10px] py-0 font-extrabold">
                                          Nv. {m.gamification_level}
                                        </Badge>
                                        <span className="text-xs font-semibold text-foreground truncate">
                                          {lvlInfo.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Progress value={lvlInfo.progressPercent} className="h-1.5 flex-1" />
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                          {lvlInfo.progressPercent}%
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>

                                  {/* XP */}
                                  <TableCell className="text-right">
                                    <div className="space-y-0.5">
                                      <span className="font-black text-sm text-primary font-mono block">
                                        {num(m.xp)} XP
                                      </span>
                                      {period !== "all" && (
                                        <span className="text-[10px] text-muted-foreground block font-mono">
                                          +{num(m.period_xp)} no período
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>

                                  {/* Estrelas */}
                                  <TableCell className="text-center">
                                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                      <span className="font-black text-xs text-amber-300 font-mono">
                                        {m.stars_rating.toFixed(1)}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        ({m.stars_count})
                                      </span>
                                    </div>
                                  </TableCell>

                                  {/* Insígnias */}
                                  <TableCell className="text-center">
                                    {m.insignias_count > 0 ? (
                                      <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-300 font-bold text-xs gap-1">
                                        <Award className="h-3.5 w-3.5" />
                                        <span>{m.insignias_count}</span>
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground font-mono">0</span>
                                    )}
                                  </TableCell>

                                  {/* Ações (Gerente / Admin) */}
                                  {isManagerOrAdmin && (
                                    <TableCell className="text-right pr-6">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setEvaluatingMember(m)}
                                          title="Avaliar Desempenho com 1 a 5 estrelas"
                                          className="h-8 px-2 text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/15"
                                        >
                                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                                          <span className="hidden lg:inline">Avaliar</span>
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setGrantingInsigniaMember(m)}
                                          title="Conceder Insígnia (desconta XP do seu saldo)"
                                          className="h-8 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/15"
                                        >
                                          <Award className="h-3.5 w-3.5" />
                                          <span className="hidden lg:inline">Insígnia</span>
                                        </Button>
                                      </div>
                                    </TableCell>
                                  )}
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

          {/* ========================================================================= */}
          {/* SEÇÃO 2: RANKINGS LEGADOS (FATURAMENTO, VENDAS, MOVIMENTAÇÕES) */}
          {/* ========================================================================= */}
          {rankingType !== "xp" && (
            <>
              {/* PODIUM CARDS LEGADOS */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
                {/* 2nd Place (Silver) */}
                <Card className="order-2 border-slate-700/60 bg-gradient-to-b from-slate-800/40 to-card/60 backdrop-blur md:order-1">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="relative mb-3">
                      <Avatar className="h-16 w-16 border-2 border-slate-400 shadow-md">
                        <AvatarFallback className="bg-slate-800 text-slate-200 font-bold">
                          {(legacySecond?.nickname || legacySecond?.nome || "2º").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-slate-400 p-1 text-slate-950 shadow">
                        <Medal className="h-4 w-4" />
                      </div>
                    </div>

                    <Badge variant="outline" className="mb-1 border-slate-500 text-slate-300">
                      2º Lugar
                    </Badge>
                    <h3 className="font-semibold text-foreground">{legacySecond?.nickname || legacySecond?.nome || "—"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {legacySecond?.nivel ? getLevelLabel(legacySecond.nivel) : "Membro"}
                    </p>

                    <div className="mt-4 text-lg font-bold text-slate-300">
                      {getLegacyMetricDisplay(legacySecond)}
                    </div>
                  </CardContent>
                </Card>

                {/* 1st Place (Gold / Champion) */}
                <Card className="order-1 border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-card/80 to-card backdrop-blur md:order-2 md:-translate-y-2 shadow-lg">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="relative mb-3">
                      <Avatar className="h-20 w-20 border-4 border-amber-500 shadow-lg shadow-amber-500/20">
                        <AvatarFallback className="bg-amber-950 text-amber-300 font-bold text-lg">
                          {(legacyFirst?.nickname || legacyFirst?.nome || "1º").slice(0, 2).toUpperCase()}
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
                    <h3 className="text-lg font-bold text-foreground">{legacyFirst?.nickname || legacyFirst?.nome || "—"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {legacyFirst?.nivel ? getLevelLabel(legacyFirst.nivel) : "Membro"}
                    </p>

                    <div className="mt-4 text-2xl font-black text-amber-400">
                      {getLegacyMetricDisplay(legacyFirst)}
                    </div>
                  </CardContent>
                </Card>

                {/* 3rd Place (Bronze) */}
                <Card className="order-3 border-amber-800/40 bg-gradient-to-b from-amber-900/20 to-card/60 backdrop-blur md:order-3">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="relative mb-3">
                      <Avatar className="h-16 w-16 border-2 border-amber-700 shadow-md">
                        <AvatarFallback className="bg-amber-950 text-amber-500 font-bold">
                          {(legacyThird?.nickname || legacyThird?.nome || "3º").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 right-1/2 translate-x-1/2 rounded-full bg-amber-700 p-1 text-slate-950 shadow">
                        <Medal className="h-4 w-4" />
                      </div>
                    </div>

                    <Badge variant="outline" className="mb-1 border-amber-700 text-amber-600">
                      3º Lugar
                    </Badge>
                    <h3 className="font-semibold text-foreground">{legacyThird?.nickname || legacyThird?.nome || "—"}</h3>
                    <p className="text-xs text-muted-foreground">
                      {legacyThird?.nivel ? getLevelLabel(legacyThird.nivel) : "Membro"}
                    </p>

                    <div className="mt-4 text-lg font-bold text-amber-600">
                      {getLegacyMetricDisplay(legacyThird)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* LEADERBOARD TABLE LEGADO */}
              <Card className="border-border bg-card/60 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Classificação Geral
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {legacyRankedList.length === 0 ? (
                    <EmptyState
                      icon={<Trophy className="h-10 w-10 text-muted-foreground" />}
                      title="Nenhum dado de ranking"
                      description="Ainda não há registros no período selecionado."
                    />
                  ) : (
                    <>
                      {/* MOBILE LIST VIEW */}
                      <div className="space-y-2.5 p-3 md:hidden">
                        {legacyRankedList.map((m, idx) => {
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
                                  {rankingType === "revenue"
                                    ? currency(m.totalRevenue)
                                    : rankingType === "sales"
                                    ? `${m.salesCount} vendas`
                                    : `${m.movementsCount} mov.`}
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
                            {legacyRankedList.map((m, idx) => {
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

      {/* MODAL DE CONCESSÃO DE INSÍGNIAS (DESCONTA XP DO PRÓPRIO CONCEDENTE) */}
      <InsigniaGrantModal
        open={Boolean(grantingInsigniaMember)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setGrantingInsigniaMember(null);
        }}
        targetMember={grantingInsigniaMember}
        grantorXp={profile?.xp || 0}
      />

      {/* MODAL ADMINISTRATIVO DE GERENCIAMENTO DO CATÁLOGO DE INSÍGNIAS */}
      <InsigniaCatalogManagerModal
        open={isCatalogModalOpen}
        onOpenChange={setIsCatalogModalOpen}
      />
    </div>
  );
}
