import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Workflow,
  Users,
  Search,
  Crown,
  Shield,
  Filter,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Zap,
  LayoutGrid,
  Circle,
  Eye,
  EyeOff,
  Sparkles,
  GitBranch,
  TrendingUp,
  Trophy,
  Code2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMembers, useSales, useMovements, nameOf } from "@/hooks/useData";
import {
  LEVELS,
  LEVEL_LABEL,
  LEVEL_DESCRIPTION,
  LEVEL_RANK,
  type AppLevel,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { dateOnly } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/hierarquia")({
  component: HierarquiaPage,
});

type ViewMode = "tree" | "grid";

interface RankTierConfig {
  level: AppLevel;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  borderGlow: string;
  lineColor: string;
  nodeBg: string;
  icon: typeof Crown;
  description: string;
  responsibilities: string[];
}

// ─── CARGOS OFICIAIS DA FACÇÃO (Desenvolvedor removido dos cargos da hierarquia) ───
const RANK_TIERS: RankTierConfig[] = [
  {
    level: "01",
    title: "01",
    badgeLabel: "01",
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/35",
    borderGlow: "border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.18)]",
    lineColor: "from-purple-500 to-indigo-500",
    nodeBg: "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-purple-500/20",
    icon: Crown,
    description: "Liderança e decisões estratégicas da facção.",
    responsibilities: ["Gestão financeira", "Aprovação de membros", "Definição de metas globais"],
  },
  {
    level: "02",
    title: "02",
    badgeLabel: "02",
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/35",
    borderGlow: "border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.18)]",
    lineColor: "from-indigo-500 to-blue-500",
    nodeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-indigo-500/20",
    icon: ShieldCheck,
    description: "Subcomando tático e supervisão operacional.",
    responsibilities: ["Supervisão de baús", "Organização de ações", "Promover/Demover operadores"],
  },
  {
    level: "gerente",
    title: "Gerente",
    badgeLabel: "Gerente",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/35",
    borderGlow: "border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.18)]",
    lineColor: "from-blue-500 to-emerald-500",
    nodeBg: "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-blue-500/20",
    icon: Shield,
    description: "Controle direto de estoque, baús e relatórios.",
    responsibilities: ["Auditoria de insumos", "Lançamentos de vendas", "Acompanhamento de metas"],
  },
  {
    level: "motoqueiro",
    title: "Motoqueiro",
    badgeLabel: "Motoqueiro",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/35",
    borderGlow: "border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.18)]",
    lineColor: "from-emerald-500 to-sky-500",
    nodeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20",
    icon: Zap,
    description: "Execução de ações e operações diretas.",
    responsibilities: ["Retirada com prestação de contas", "Vendas diretas", "Presença em ações"],
  },
  {
    level: "membro",
    title: "Membro",
    badgeLabel: "Membro",
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/35",
    borderGlow: "border-sky-500/40 shadow-[0_0_20px_rgba(56,189,248,0.15)]",
    lineColor: "from-sky-500 to-amber-500",
    nodeBg: "bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sky-500/20",
    icon: UserCheck,
    description: "Integrante efetivado com acesso operacional.",
    responsibilities: ["Cumprimento de regras", "Relatório de vendas", "Participação de reuniões"],
  },
  {
    level: "novato",
    title: "Novato",
    badgeLabel: "Novato",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/35",
    borderGlow: "border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    lineColor: "from-amber-500 to-zinc-600",
    nodeBg: "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20",
    icon: Circle,
    description: "Integrante em período de avaliação.",
    responsibilities: ["Treinamentos táticos", "Acompanhamento por padrinhos", "Meta reduzida"],
  },
];

function HierarquiaPage() {
  const { hasPermission } = useAuth();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const { data: sales = [] } = useSales();
  const { data: movements = [] } = useMovements();

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [selectedRankFilter, setSelectedRankFilter] = useState<string>("all");
  const [hideEmptyRanks, setHideEmptyRanks] = useState<boolean>(true);

  const canView = hasPermission("view_hierarchy") || hasPermission("view_members");

  // Calculate member stats (sales & movements count per user)
  const memberStatsMap = useMemo(() => {
    const stats = new Map<string, { totalSales: number; totalMovements: number }>();
    sales.forEach((s) => {
      if (s.seller_id) {
        const curr = stats.get(s.seller_id) || { totalSales: 0, totalMovements: 0 };
        curr.totalSales += Number(s.total_price || 0);
        stats.set(s.seller_id, curr);
      }
    });
    movements.forEach((m) => {
      if (m.user_id) {
        const curr = stats.get(m.user_id) || { totalSales: 0, totalMovements: 0 };
        curr.totalMovements += 1;
        stats.set(m.user_id, curr);
      }
    });
    return stats;
  }, [sales, movements]);

  // Group members by level (mapping "desenvolvedor" to "01" for hierarchy view)
  const groupedMembers = useMemo(() => {
    const map = new Map<AppLevel, typeof members>();
    LEVELS.forEach((lvl) => map.set(lvl, []));

    members.forEach((m) => {
      let lvl = (m.nivel as AppLevel) || "membro";
      if (lvl === "desenvolvedor") {
        lvl = "membro";
      }
      const list = map.get(lvl) || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (m.nome || "").toLowerCase();
        const nick = (m.nickname || "").toLowerCase();
        const pass = (m.game_id || "").toLowerCase();
        const disc = (m.discord_username || "").toLowerCase();
        if (!name.includes(q) && !nick.includes(q) && !pass.includes(q) && !disc.includes(q)) {
          return;
        }
      }
      list.push(m);
    });

    return map;
  }, [members, search]);

  // Filtered active rank tiers (Hiding empty rank tiers if hideEmptyRanks === true)
  const activeTiers = useMemo(() => {
    return RANK_TIERS.filter((tier) => {
      if (selectedRankFilter !== "all" && selectedRankFilter !== tier.level) {
        return false;
      }
      const rankMembers = groupedMembers.get(tier.level) || [];
      if (hideEmptyRanks && rankMembers.length === 0) {
        return false;
      }
      return true;
    });
  }, [selectedRankFilter, hideEmptyRanks, groupedMembers]);

  // Overall Statistics Summary
  const statsSummary = useMemo(() => {
    const totalCount = members.length;
    const onlineCount = members.filter((m) => m.presence_status === "online").length;
    const leadershipCount = members.filter(
      (m) => m.nivel === "01" || m.nivel === "02" || m.nivel === "desenvolvedor"
    ).length;
    const operatorsCount = members.filter(
      (m) => m.nivel === "gerente" || m.nivel === "motoqueiro" || m.nivel === "membro"
    ).length;

    return { totalCount, onlineCount, leadershipCount, operatorsCount };
  }, [members]);

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Hierarquia do Grupo"
          description="Árvore genealógica tática, estrutura organizacional e cadeia de comando da facção."
        />
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl bg-card border border-border/60 p-1 shadow-sm">
            <Button
              variant={viewMode === "tree" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tree")}
              className={cn(
                "h-7 text-xs gap-1.5 font-bold transition-all",
                viewMode === "tree"
                  ? "bg-gradient-brand text-primary-foreground shadow"
                  : "text-muted-foreground"
              )}
            >
              <GitBranch className="h-3.5 w-3.5" />
              Árvore Genealógica
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-7 text-xs gap-1.5 font-bold transition-all",
                viewMode === "grid"
                  ? "bg-gradient-brand text-primary-foreground shadow"
                  : "text-muted-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid de Patentes
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Efetivo Total</span>
            <span className="text-base font-black text-foreground">{statsSummary.totalCount} membros</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Em Serviço</span>
            <span className="text-base font-black text-emerald-400">{statsSummary.onlineCount} online</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Crown className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Alta Liderança</span>
            <span className="text-base font-black text-purple-400">{statsSummary.leadershipCount} comandantes</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Operadores</span>
            <span className="text-base font-black text-blue-400">{statsSummary.operatorsCount} táticos</span>
          </div>
        </div>
      </div>

      {/* Filter, Search & Empty Rank Toggle Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, passaporte, apelido ou discord..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Toggle Hide Empty Ranks */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/30 border border-border/40">
            <Switch
              id="hide-empty-ranks"
              checked={hideEmptyRanks}
              onCheckedChange={setHideEmptyRanks}
              className="scale-90"
            />
            <Label
              htmlFor="hide-empty-ranks"
              className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
            >
              {hideEmptyRanks ? (
                <EyeOff className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
              )}
              Ocultar Patentes sem Membros
            </Label>
          </div>
        </div>
      </div>

      {/* MAIN VIEW CONTENT */}
      {activeTiers.length === 0 ? (
        <Card className="surface-card p-10 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted/20 border border-border/60 flex items-center justify-center text-muted-foreground">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Nenhuma patente para exibir</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Todas as patentes filtradas estão atualmente sem membros integrantes atrelados.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedRankFilter("all");
              setHideEmptyRanks(false);
              setSearch("");
            }}
            className="h-8 text-xs font-bold rounded-xl border-primary/40 text-primary"
          >
            Exibir Todas as Patentes
          </Button>
        </Card>
      ) : viewMode === "tree" ? (
        /* ─── ÁRVORE GENEALÓGICA TÁTICA (Connected Hierarchy Branch Tree) ─── */
        <div className="relative pl-4 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-7 before:top-6 before:bottom-6 before:w-1 before:bg-gradient-to-b before:from-purple-500 via-indigo-500 to-emerald-500/30 before:rounded-full">
          {activeTiers.map((tier) => {
            const TierIcon = tier.icon;
            const rankMembers = groupedMembers.get(tier.level) || [];

            // Find top seller in this tier
            let topSellerId: string | null = null;
            let maxSales = 0;
            rankMembers.forEach((m) => {
              const stats = memberStatsMap.get(m.user_id);
              if (stats && stats.totalSales > maxSales && stats.totalSales > 0) {
                maxSales = stats.totalSales;
                topSellerId = m.user_id;
              }
            });

            return (
              <div key={tier.level} className="relative transition-all duration-300">
                {/* Genealogical Node Connection Marker */}
                <div className="absolute -left-4 sm:-left-8 top-4 -translate-x-1/2 flex items-center justify-center z-10">
                  <div
                    className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center border-2 shadow-xl bg-background transition-transform duration-300 hover:scale-110",
                      tier.nodeBg
                    )}
                  >
                    <TierIcon className="h-4 w-4" />
                  </div>
                </div>

                {/* Tier Card Container */}
                <div
                  className={cn(
                    "surface-card rounded-2xl p-4 sm:p-5 border transition-all duration-300 space-y-4 relative overflow-hidden",
                    tier.borderGlow
                  )}
                >
                  {/* Rank Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl border shadow-sm shrink-0", tier.badgeClass)}>
                        <TierIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
                            {tier.title}
                          </h3>
                          <Badge variant="outline" className={cn("text-[10px] font-mono", tier.badgeClass)}>
                            {tier.badgeLabel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{tier.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className="text-xs font-mono border-primary/40 text-primary bg-primary/10 px-3 py-1 font-bold"
                      >
                        {rankMembers.length} {rankMembers.length === 1 ? "membro" : "membros"}
                      </Badge>
                    </div>
                  </div>

                  {/* Genealogical Member Cards Tree Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
                    {rankMembers.map((member) => {
                      const userStats = memberStatsMap.get(member.user_id) || {
                        totalSales: 0,
                        totalMovements: 0,
                      };
                      const isOnline = member.presence_status === "online";
                      const isAusente = member.presence_status === "ausente";
                      const isTopPerformer = member.user_id === topSellerId;
                      const isDeveloper = member.nivel === "desenvolvedor";

                      return (
                        <div
                          key={member.user_id}
                          className={cn(
                            "p-3.5 rounded-xl bg-card/70 border border-border/70 hover:border-primary/50 transition-all duration-300 hover:shadow-xl space-y-3 relative group overflow-hidden",
                            isTopPerformer && "border-amber-500/40 bg-amber-500/5 shadow-amber-500/10"
                          )}
                        >
                          {/* Top Performer Ribbon Badge */}
                          {isTopPerformer && (
                            <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1">
                              <Trophy className="h-3 w-3" /> Top Vendas
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Member Avatar & Status */}
                              <div className="relative shrink-0">
                                <Avatar className="h-11 w-11 border border-border/80 shadow-md">
                                  <AvatarImage src={member.discord_avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">
                                    {(member.nome || "TW").substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span
                                  className={cn(
                                    "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card shadow-sm",
                                    isOnline
                                      ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                      : isAusente
                                      ? "bg-amber-500"
                                      : "bg-zinc-600"
                                  )}
                                  title={`Status: ${isOnline ? "Online em serviço" : isAusente ? "Ausente" : "Offline"}`}
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-black text-foreground truncate">
                                    {nameOf(members, member.user_id)}
                                  </p>
                                  {member.game_id && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] font-mono py-0 px-1.5 border-primary/40 text-primary shrink-0 bg-primary/5"
                                    >
                                      #{member.game_id}
                                    </Badge>
                                  )}
                                  {isDeveloper && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] font-mono py-0 px-1 border-rose-500/40 text-rose-400 bg-rose-500/10 shrink-0 font-bold flex items-center gap-0.5"
                                    >
                                      <Code2 className="h-2.5 w-2.5" /> Dev System
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[0.65rem] text-muted-foreground truncate mt-0.5">
                                  {member.discord_username
                                    ? `@${member.discord_username}`
                                    : member.nickname || "Integrante Twin Wheels"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Stats Metrics Badges */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[10px]">
                            <div className="p-1.5 rounded-lg bg-secondary/40 border border-border/30">
                              <span className="text-muted-foreground block text-[9px] font-semibold">
                                Vendas Totais
                              </span>
                              <span className="font-mono font-bold text-emerald-400">
                                R$ {userStats.totalSales.toLocaleString("pt-BR")}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-lg bg-secondary/40 border border-border/30">
                              <span className="text-muted-foreground block text-[9px] font-semibold">
                                Lançamentos
                              </span>
                              <span className="font-mono font-bold text-sky-400">
                                {userStats.totalMovements} ops
                              </span>
                            </div>
                          </div>

                          {/* Admission date */}
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/20">
                            <span>Admissão:</span>
                            <span className="font-mono font-semibold">{dateOnly(member.data_entrada)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── GRID VIEW (Cards de Patentes Detalhados) ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeTiers.map((tier) => {
            const TierIcon = tier.icon;
            const rankMembers = groupedMembers.get(tier.level) || [];

            return (
              <Card
                key={tier.level}
                className={cn("surface-card border transition-all duration-300", tier.borderGlow)}
              >
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl border shadow-sm", tier.badgeClass)}>
                        <TierIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-black">{tier.title}</CardTitle>
                        <CardDescription className="text-[0.7rem]">{tier.description}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs font-mono border-primary/30 text-primary bg-primary/5 shrink-0"
                    >
                      {rankMembers.length} membros
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Responsibilities */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Atribuições & Responsabilidades:
                    </span>
                    <ul className="space-y-1">
                      {tier.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-foreground/80">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Members list pill chips */}
                  <div className="pt-2 border-t border-border/40">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-2">
                      Integrantes nesta patente ({rankMembers.length}):
                    </span>
                    {rankMembers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Nenhum membro ativo nesta patente.</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {rankMembers.map((m) => (
                          <div
                            key={m.user_id}
                            className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-secondary/40 border border-border/50 hover:border-primary/40 transition-all shadow-sm"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={m.discord_avatar_url || undefined} />
                              <AvatarFallback className="text-[9px] font-bold bg-primary/20 text-primary">
                                {(m.nome || "TW").substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-bold text-foreground">
                              {nameOf(members, m.user_id)}
                            </span>
                            {m.nivel === "desenvolvedor" && (
                              <Badge variant="outline" className="text-[8px] font-mono py-0 px-1 border-rose-500/40 text-rose-400 bg-rose-500/10">
                                Dev
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
