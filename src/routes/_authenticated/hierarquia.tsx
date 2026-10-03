import { useState, useMemo } from "react";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
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
  Trophy,
  Code2,
  Flame,
  Layers,
  ChevronDown,
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
import { useUrlTab } from "@/hooks/useUrlTab";
import { useMembers, useSales, useMovements, nameOf } from "@/hooks/useData";
import { useMemberTagsMap } from "@/hooks/useMemberTags";
import { MemberTagBadge } from "@/components/ui/MemberTagBadge";
import {
  LEVELS,
  LEVEL_LABEL,
  LEVEL_DESCRIPTION,
  type AppLevel,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { dateOnly } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/hierarquia")({
  component: HierarquiaWrapper,
});

function HierarquiaWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <HierarquiaPage />;
}

type ViewMode = "pyramid" | "cards";

interface RankTierConfig {
  level: AppLevel;
  title: string;
  pyramidTier: string;
  tierNumber: number;
  badgeLabel: string;
  badgeClass: string;
  borderGlow: string;
  accentBg: string;
  nodeBg: string;
  icon: typeof Crown;
  description: string;
  responsibilities: string[];
  maxWidthClass: string;
  gridClass: string;
}

// ─── CARGOS DA HIERARQUIA ORGANIZACIONAL (ESTRUTURA PIRAMIDAL) ───
const RANK_TIERS: RankTierConfig[] = [
  {
    level: "01",
    title: "01 · Liderança / Presidência",
    pyramidTier: "ÁPICE · NÍVEL 1",
    tierNumber: 1,
    badgeLabel: "01",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/35",
    borderGlow: "border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.2)] bg-gradient-to-b from-amber-500/10 via-background to-background",
    accentBg: "bg-amber-500/20 text-amber-300 border-amber-500/50",
    nodeBg: "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/30",
    icon: Crown,
    description: "Liderança executiva, decisões estratégicas e gestão geral do grupo.",
    responsibilities: ["Diretrizes gerais da organização", "Gestão financeira e metas", "Aprovação e promoção de membros"],
    maxWidthClass: "max-w-3xl",
    gridClass: "grid-cols-1 sm:grid-cols-2",
  },
  {
    level: "02",
    title: "02 · Vice-Liderança / Diretoria",
    pyramidTier: "NÍVEL 2",
    tierNumber: 2,
    badgeLabel: "02",
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/35",
    borderGlow: "border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.18)] bg-gradient-to-b from-purple-500/10 via-background to-background",
    accentBg: "bg-purple-500/20 text-purple-300 border-purple-500/50",
    nodeBg: "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-purple-500/20",
    icon: ShieldCheck,
    description: "Subcomando, alinhamento de equipe e supervisão geral das operações.",
    responsibilities: ["Acompanhamento da diretoria", "Supervisão de baús e insumos", "Organização interna da equipe"],
    maxWidthClass: "max-w-4xl",
    gridClass: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  },
  {
    level: "gerente",
    title: "Gerente · Gerência & Supervisão",
    pyramidTier: "NÍVEL 3",
    tierNumber: 3,
    badgeLabel: "Gerente",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/35",
    borderGlow: "border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.18)] bg-gradient-to-b from-blue-500/10 via-background to-background",
    accentBg: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    nodeBg: "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-blue-500/20",
    icon: Shield,
    description: "Controle direto de estoque, baús, balcão de vendas e relatórios.",
    responsibilities: ["Auditoria e abastecimento de suprimentos", "Lançamentos de vendas", "Acompanhamento de metas dos membros"],
    maxWidthClass: "max-w-5xl",
    gridClass: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  },
  {
    level: "motoqueiro",
    title: "Motoqueiro · Operadores & Pilotos",
    pyramidTier: "NÍVEL 4",
    tierNumber: 4,
    badgeLabel: "Motoqueiro",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/35",
    borderGlow: "border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.18)] bg-gradient-to-b from-emerald-500/10 via-background to-background",
    accentBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
    nodeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20",
    icon: Zap,
    description: "Execução direta de atividades, produção e presença ativa nas ações.",
    responsibilities: ["Retirada com prestação de contas", "Vendas diretas aos clientes", "Presença e participação diária"],
    maxWidthClass: "max-w-6xl",
    gridClass: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  },
  {
    level: "membro",
    title: "Membro · Integrantes Efetivados",
    pyramidTier: "NÍVEL 5",
    tierNumber: 5,
    badgeLabel: "Membro",
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/35",
    borderGlow: "border-sky-500/40 shadow-[0_0_20px_rgba(56,189,248,0.15)] bg-gradient-to-b from-sky-500/10 via-background to-background",
    accentBg: "bg-sky-500/20 text-sky-300 border-sky-500/50",
    nodeBg: "bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sky-500/20",
    icon: UserCheck,
    description: "Integrante efetivado com acesso operacional regular à organização.",
    responsibilities: ["Cumprimento das regras do grupo", "Relatórios e lançamento de vendas", "Participação de reuniões"],
    maxWidthClass: "max-w-7xl",
    gridClass: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  },
  {
    level: "novato",
    title: "Novato · Em Avaliação & Integração",
    pyramidTier: "BASE DA PIRÂMIDE · NÍVEL 6",
    tierNumber: 6,
    badgeLabel: "Novato",
    badgeClass: "bg-zinc-500/15 text-zinc-400 border-zinc-500/35",
    borderGlow: "border-zinc-500/30 shadow-[0_0_20px_rgba(113,113,122,0.15)] bg-gradient-to-b from-zinc-500/10 via-background to-background",
    accentBg: "bg-zinc-500/20 text-zinc-300 border-zinc-500/50",
    nodeBg: "bg-zinc-500/20 text-zinc-300 border-zinc-500/50 shadow-zinc-500/20",
    icon: Circle,
    description: "Integrante em período de experiência, adaptação e integração ao grupo.",
    responsibilities: ["Acompanhamento por membros experientes", "Adaptação às rotinas e regras", "Cumprimento da meta inicial"],
    maxWidthClass: "max-w-7xl",
    gridClass: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  },
];

export function HierarquiaPage() {
  const { hasPermission } = useAuth();
  const { data: members = [] } = useMembers();
  const { data: sales = [] } = useSales();
  const { data: movements = [] } = useMovements();
  const memberTagsMap = useMemberTagsMap();

  const [search, setSearch] = useState("");
  // Sincronização do modo de visualização com a URL (?modo=pyramid | cards)
  const [viewMode, setViewMode] = useUrlTab<ViewMode>("pyramid", {
    paramName: "modo",
    allowedTabs: ["pyramid", "cards"],
  });
  const [selectedRankFilter, setSelectedRankFilter] = useState<string>("all");
  const [hideEmptyRanks, setHideEmptyRanks] = useState<boolean>(false);

  const canView = hasPermission("view_hierarchy");

  // Estatísticas de vendas e movimentações por usuário
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

  // Agrupamento de membros por nível hierárquico
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

  // Tiers ativos após filtros
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

  // Resumo de contagem de integrantes
  const statsSummary = useMemo(() => {
    const totalCount = members.length;
    const leadershipCount = members.filter(
      (m) => m.nivel === "01" || m.nivel === "02"
    ).length;
    const managementCount = members.filter(
      (m) => m.nivel === "gerente"
    ).length;
    const membersCount = members.filter(
      (m) => m.nivel === "motoqueiro" || m.nivel === "membro"
    ).length;
    const novicesCount = members.filter(
      (m) => m.nivel === "novato"
    ).length;

    return { totalCount, leadershipCount, managementCount, membersCount, novicesCount };
  }, [members]);

  if (!canView) {
    return <NoAccess />;
  }

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Hierarquia da Organização"
          description="Pirâmide hierárquica por cargos e distribuição de todos os integrantes do grupo Twin Wheels."
        />
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Modo de Visualização */}
          <div className="flex items-center rounded-xl bg-card border border-border/60 p-1 shadow-sm">
            <Button
              variant={viewMode === "pyramid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("pyramid")}
              className={cn(
                "h-8 text-xs gap-1.5 font-bold transition-all cursor-pointer",
                viewMode === "pyramid"
                  ? "bg-gradient-brand text-primary-foreground shadow"
                  : "text-muted-foreground"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Pirâmide por Cargos
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className={cn(
                "h-8 text-xs gap-1.5 font-bold transition-all cursor-pointer",
                viewMode === "cards"
                  ? "bg-gradient-brand text-primary-foreground shadow"
                  : "text-muted-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards por Cargo
            </Button>
          </div>
        </div>
      </div>

      {/* Banner de Estatísticas da Estrutura */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block truncate">Total Integrantes</span>
            <span className="text-base font-black text-foreground">{statsSummary.totalCount} membros</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Crown className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block truncate">Liderança & Direção</span>
            <span className="text-base font-black text-amber-400">{statsSummary.leadershipCount} líderes</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block truncate">Gerência & Operações</span>
            <span className="text-base font-black text-blue-400">{statsSummary.managementCount + statsSummary.membersCount} ativos</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block truncate">Novatos / Recrutas</span>
            <span className="text-base font-black text-zinc-400">{statsSummary.novicesCount} em integração</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, passaporte, apelido ou discord..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Seletor de Cargo Específico */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">Cargo:</span>
            <select
              value={selectedRankFilter}
              onChange={(e) => setSelectedRankFilter(e.target.value)}
              className="h-8 text-xs font-semibold rounded-xl bg-secondary/40 border border-border/60 px-2.5 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Todos os Cargos</option>
              {RANK_TIERS.map((tier) => (
                <option key={tier.level} value={tier.level}>
                  {tier.badgeLabel} — {tier.title.split("·")[1]?.trim() || tier.title}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Ocultar Cargos sem Membros */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/30 border border-border/40">
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
              Ocultar Cargos Vazios
            </Label>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      {activeTiers.length === 0 ? (
        <Card className="surface-card p-12 text-center space-y-3 rounded-2xl">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted/20 border border-border/60 flex items-center justify-center text-muted-foreground">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Nenhum cargo para exibir</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Não foram encontrados membros nos filtros selecionados.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedRankFilter("all");
              setHideEmptyRanks(false);
              setSearch("");
            }}
            className="h-8 text-xs font-bold rounded-xl border-primary/40 text-primary cursor-pointer"
          >
            Exibir Toda a Hierarquia
          </Button>
        </Card>
      ) : viewMode === "pyramid" ? (
        /* ═══════════════════════════════════════════════════════════════════
           MODO PIRÂMIDE ORGANIZACIONAL POR CARGOS (FLUID PYRAMID TIERS)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="space-y-6 pt-2">
          {activeTiers.map((tier, tierIdx) => {
            const TierIcon = tier.icon;
            const rankMembers = groupedMembers.get(tier.level) || [];

            // Top seller do cargo
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
              <div key={tier.level} className="flex flex-col items-center w-full">
                {/* Indicador de Conexão Piramidal entre os Níveis */}
                {tierIdx > 0 && (
                  <div className="h-6 w-0.5 bg-gradient-to-b from-border/80 to-primary/40 my-1 rounded-full shrink-0" />
                )}

                {/* Container do Nível da Pirâmide */}
                <div
                  className={cn(
                    "w-full rounded-2xl p-4 sm:p-6 border transition-all duration-300 space-y-4 relative overflow-hidden",
                    tier.borderGlow,
                    tier.maxWidthClass
                  )}
                >
                  {/* Cabeçalho do Nível da Pirâmide */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("p-2.5 rounded-xl border shadow-md shrink-0", tier.accentBg)}>
                        <TierIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground border border-border/50">
                            {tier.pyramidTier}
                          </span>
                          <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight truncate">
                            {tier.title}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{tier.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-mono px-3 py-1 font-extrabold shadow-xs",
                          tier.badgeClass
                        )}
                      >
                        {rankMembers.length} {rankMembers.length === 1 ? "integrante" : "integrantes"}
                      </Badge>
                    </div>
                  </div>

                  {/* Lista de Membros no Nível da Pirâmide */}
                  {rankMembers.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-card/40 border border-dashed border-border/60 text-xs text-muted-foreground italic">
                      Nenhum integrante cadastrado neste cargo no momento.
                    </div>
                  ) : (
                    <div className={cn("grid gap-3.5 pt-1", tier.gridClass)}>
                      {rankMembers.map((member) => {
                        const userStats = memberStatsMap.get(member.user_id) || {
                          totalSales: 0,
                          totalMovements: 0,
                        };
                        const isTopPerformer = member.user_id === topSellerId;
                        const isDeveloper = member.nivel === "desenvolvedor";

                        // Recupera todas as tags que o membro possui no sistema
                        const assignedTags =
                          memberTagsMap[member.user_id] ||
                          memberTagsMap[member.id] ||
                          [];

                        return (
                          <div
                            key={member.user_id || member.id}
                            className={cn(
                              "p-4 rounded-2xl bg-card/85 backdrop-blur-sm border border-border/80 hover:border-primary/60 transition-all duration-300 hover:shadow-xl space-y-3 relative group overflow-hidden flex flex-col justify-between",
                              isTopPerformer && "border-amber-500/50 bg-amber-500/5 shadow-amber-500/10",
                              tier.level === "01" && "ring-1 ring-amber-500/30 shadow-md"
                            )}
                          >
                            {/* Destaque Top Vendas */}
                            {isTopPerformer && (
                              <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-bl-xl shadow-xs flex items-center gap-1">
                                <Trophy className="h-3 w-3" /> Top Vendas
                              </div>
                            )}

                            {/* Info Principal do Membro */}
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-3 pt-0.5">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                  <Avatar className="h-12 w-12 border-2 border-border/80 shadow-md">
                                    <AvatarImage src={member.discord_avatar_url || member.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/20 text-primary font-black text-xs">
                                      {(member.nome || "TW").substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>

                                <div className="min-w-0 flex-1">
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
                                        <Code2 className="h-2.5 w-2.5" /> Dev
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                    {member.discord_username
                                      ? `@${member.discord_username}`
                                      : member.nickname || "Integrante Twin Wheels"}
                                  </p>
                                </div>
                              </div>

                              {/* TAGS DO MEMBRO (EXIBIÇÃO EM TODA VISUALIZAÇÃO) */}
                              {assignedTags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  {assignedTags.map((tag) => (
                                    <MemberTagBadge
                                      key={tag.id}
                                      tag={tag}
                                      size="xs"
                                      showIcon
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Estatísticas de Desempenho & Admissão */}
                            <div className="space-y-2 pt-2 border-t border-border/50">
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="p-1.5 rounded-xl bg-secondary/40 border border-border/30">
                                  <span className="text-muted-foreground block text-[9px] font-semibold">
                                    Vendas Totais
                                  </span>
                                  <span className="font-mono font-bold text-emerald-400">
                                    R$ {userStats.totalSales.toLocaleString("pt-BR")}
                                  </span>
                                </div>
                                <div className="p-1.5 rounded-xl bg-secondary/40 border border-border/30">
                                  <span className="text-muted-foreground block text-[9px] font-semibold">
                                    Lançamentos
                                  </span>
                                  <span className="font-mono font-bold text-sky-400">
                                    {userStats.totalMovements} ops
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                                <span>Admissão:</span>
                                <span className="font-mono font-semibold">{dateOnly(member.data_entrada)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════
           MODO CARDS POR CARGO (DETALHADO COM ATRIBUIÇÕES & INTEGRANTES)
           ═══════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeTiers.map((tier) => {
            const TierIcon = tier.icon;
            const rankMembers = groupedMembers.get(tier.level) || [];

            return (
              <Card
                key={tier.level}
                className={cn("surface-card border transition-all duration-300 rounded-2xl", tier.borderGlow)}
              >
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("p-2.5 rounded-xl border shadow-sm shrink-0", tier.accentBg)}>
                        <TierIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-black truncate">{tier.title}</CardTitle>
                        </div>
                        <CardDescription className="text-xs truncate">{tier.description}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-mono shrink-0 font-bold", tier.badgeClass)}
                    >
                      {rankMembers.length} {rankMembers.length === 1 ? "membro" : "membros"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Atribuições do Cargo */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Atribuições & Responsabilidades do Cargo:
                    </span>
                    <ul className="space-y-1.5">
                      {tier.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-foreground/85">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Lista de Integrantes com Tags */}
                  <div className="pt-3 border-t border-border/50 space-y-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                      Integrantes neste cargo ({rankMembers.length}):
                    </span>
                    {rankMembers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Nenhum membro ativo neste cargo.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {rankMembers.map((m) => {
                          const assignedTags =
                            memberTagsMap[m.user_id] ||
                            memberTagsMap[m.id] ||
                            [];

                          return (
                            <div
                              key={m.user_id || m.id}
                              className="p-2.5 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/40 transition-all shadow-xs space-y-1.5"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarImage src={m.discord_avatar_url || m.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px] font-bold bg-primary/20 text-primary">
                                    {(m.nome || "TW").substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-bold text-foreground block truncate">
                                    {nameOf(members, m.user_id)}
                                  </span>
                                  {m.game_id && (
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      #{m.game_id}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Tags do Membro */}
                              {assignedTags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border/30">
                                  {assignedTags.map((tag) => (
                                    <MemberTagBadge
                                      key={tag.id}
                                      tag={tag}
                                      size="xs"
                                      showIcon
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
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
