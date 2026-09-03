import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarOff,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  AlertCircle,
  Trash2,
  FileText,
  Palmtree,
  Plane,
  HeartPulse,
  Briefcase,
  HelpCircle,
  Sparkles,
  Info,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  Users,
  Activity,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import {
  useAbsences,
  useCreateAbsence,
  useReviewAbsence,
  useCancelAbsence,
  useDeleteAbsence,
} from "@/hooks/useAbsences";
import { levelBadgeClass, getLevelLabel, type AppLevel } from "@/lib/permissions";
import type { AbsenceReason, AbsenceStatus, MemberAbsence } from "@/lib/app-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ausencias")({
  component: AusenciasPage,
});

/* ─── Reason Metadata & Icons ─── */
const REASON_CONFIG: Record<
  AbsenceReason,
  { label: string; icon: typeof Palmtree; color: string; bg: string; border: string }
> = {
  ferias: {
    label: "Férias",
    icon: Palmtree,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  viagem: {
    label: "Viagem",
    icon: Plane,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
  },
  trabalho_estudos: {
    label: "Trabalho / Estudos",
    icon: Briefcase,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
  },
  saude: {
    label: "Saúde / Tratamento",
    icon: HeartPulse,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
  motivo_pessoal: {
    label: "Motivo Pessoal / Família",
    icon: User,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  problemas_tecnicos: {
    label: "Problemas Técnicos / PC",
    icon: Activity,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
  },
  outro: {
    label: "Outro Motivo",
    icon: HelpCircle,
    color: "text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/30",
  },
};

const PIE_COLORS = [
  "#f59e0b", // Amber (Férias)
  "#38bdf8", // Sky (Viagem)
  "#818cf8", // Indigo (Trabalho/Estudos)
  "#fb7185", // Rose (Saúde)
  "#c084fc", // Purple (Motivo Pessoal)
  "#fb923c", // Orange (Problemas Técnicos)
  "#94a3b8", // Slate (Outro)
];

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function getAbsenceTimelineStatus(absence: MemberAbsence): {
  badge: string;
  className: string;
  subtext: string;
} {
  const today = new Date().toISOString().slice(0, 10);

  if (absence.status === "cancelada") {
    return {
      badge: "Cancelada",
      className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
      subtext: "Solicitação cancelada pelo autor",
    };
  }
  if (absence.status === "rejeitado") {
    return {
      badge: "Recusada",
      className: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      subtext: "Recusada pela liderança",
    };
  }
  if (absence.status === "pendente") {
    return {
      badge: "Pendente de Análise",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse",
      subtext: "Aguardando validação da liderança",
    };
  }

  // Aprovada: verificar se está ativa hoje, futura ou concluída
  if (today >= absence.start_date && today <= absence.end_date) {
    const end = new Date(absence.end_date);
    const now = new Date(today);
    const diffDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      badge: "🏖️ Ausente Hoje",
      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-black",
      subtext: diffDays === 0 ? "Retorna amanhã" : `Retorna em ${diffDays} dia(s)`,
    };
  }

  if (today < absence.start_date) {
    const start = new Date(absence.start_date);
    const now = new Date(today);
    const diffDays = Math.max(1, Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      badge: "Agendada",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      subtext: `Inicia em ${diffDays} dia(s)`,
    };
  }

  return {
    badge: "Concluída",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
    subtext: `Encerrada em ${formatDateBR(absence.end_date)}`,
  };
}

function AusenciasPage() {
  const { user, profile, level, hasPermission } = useAuth();
  const { data: absences = [], isLoading, refetch } = useAbsences();
  const createMutation = useCreateAbsence();
  const reviewMutation = useReviewAbsence();
  const cancelMutation = useCancelAbsence();
  const deleteMutation = useDeleteAbsence();

  // Permissions check
  const isLeaderOrAdmin =
    level === "desenvolvedor" ||
    level === "01" ||
    level === "02" ||
    level === "gerente";

  const canView = hasPermission("view_absences") || isLeaderOrAdmin;
  const canManage = hasPermission("manage_absences") || isLeaderOrAdmin;
  const canViewStats = hasPermission("view_all_absences") || canManage;

  // View state
  const [activeTab, setActiveTab] = useState<string>("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    reason: "ferias" as AbsenceReason,
    reason_details: "",
  });

  // Review Modal state
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    absence: MemberAbsence | null;
    action: "aprovado" | "rejeitado";
    notes: string;
  }>({
    open: false,
    absence: null,
    action: "aprovado",
    notes: "",
  });

  // Calculate live days count for creation modal
  const calculatedDays = useMemo(() => {
    try {
      const s = new Date(formData.start_date);
      const e = new Date(formData.end_date);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
      const diff = Math.max(0, e.getTime() - s.getTime());
      return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 1;
    }
  }, [formData.start_date, formData.end_date]);

  // KPIs & Metrics
  const today = new Date().toISOString().slice(0, 10);

  const activeTodayCount = useMemo(() => {
    return absences.filter(
      (a) =>
        a.status === "aprovado" &&
        today >= a.start_date &&
        today <= a.end_date
    ).length;
  }, [absences, today]);

  const pendingCount = useMemo(() => {
    return absences.filter((a) => a.status === "pendente").length;
  }, [absences]);

  const totalApprovedDays = useMemo(() => {
    return absences
      .filter((a) => a.status === "aprovado")
      .reduce((acc, a) => acc + (a.days_count || 1), 0);
  }, [absences]);

  const myAbsencesCount = useMemo(() => {
    return absences.filter((a) => a.user_id === user?.id).length;
  }, [absences, user?.id]);

  // Statistics for Charts (Only for managers)
  const chartDataMonthly = useMemo(() => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const countsByMonth: Record<number, { ausencias: number; dias: number }> = {};

    for (let i = 0; i < 12; i++) {
      countsByMonth[i] = { ausencias: 0, dias: 0 };
    }

    absences.forEach((a) => {
      try {
        const d = new Date(a.start_date);
        const m = d.getMonth();
        if (!isNaN(m) && countsByMonth[m]) {
          countsByMonth[m].ausencias += 1;
          countsByMonth[m].dias += a.days_count || 1;
        }
      } catch {}
    });

    return monthNames.map((name, idx) => ({
      name,
      ausencias: countsByMonth[idx]?.ausencias || 0,
      dias: countsByMonth[idx]?.dias || 0,
    }));
  }, [absences]);

  const chartDataReasons = useMemo(() => {
    const counts: Record<string, number> = {};
    absences.forEach((a) => {
      const reasonKey = a.reason || "outro";
      counts[reasonKey] = (counts[reasonKey] || 0) + 1;
    });

    return Object.entries(counts).map(([key, value]) => ({
      name: REASON_CONFIG[key as AbsenceReason]?.label || key,
      key,
      value,
    }));
  }, [absences]);

  const statsSummary = useMemo(() => {
    const total = absences.length;
    const approved = absences.filter((a) => a.status === "aprovado").length;
    const rejected = absences.filter((a) => a.status === "rejeitado").length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 100;
    const avgDays = total > 0 ? (absences.reduce((acc, a) => acc + (a.days_count || 1), 0) / total).toFixed(1) : "0";

    return {
      total,
      approved,
      rejected,
      approvalRate,
      avgDays,
    };
  }, [absences]);

  // Filtered absences list
  const filteredAbsences = useMemo(() => {
    return absences.filter((a) => {
      // Tab filter
      if (activeTab === "minhas" && a.user_id !== user?.id) return false;
      if (activeTab === "pendentes" && a.status !== "pendente") return false;
      if (activeTab === "ativas" && !(a.status === "aprovado" && today >= a.start_date && today <= a.end_date)) return false;

      // Status filter
      if (statusFilter !== "all" && a.status !== statusFilter) return false;

      // Reason filter
      if (reasonFilter !== "all" && a.reason !== reasonFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = a.member_name?.toLowerCase().includes(q);
        const nickMatch = a.member_nickname?.toLowerCase().includes(q);
        const reasonMatch = a.reason?.toLowerCase().includes(q);
        const detailsMatch = a.reason_details?.toLowerCase().includes(q);
        if (!nameMatch && !nickMatch && !reasonMatch && !detailsMatch) return false;
      }

      return true;
    });
  }, [absences, activeTab, user?.id, today, statusFilter, reasonFilter, searchTerm]);

  // Handlers
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      return;
    }

    await createMutation.mutateAsync(formData);
    setIsCreateOpen(false);
    setFormData({
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      reason: "ferias",
      reason_details: "",
    });
  };

  const handleReviewConfirm = async () => {
    if (!reviewModal.absence) return;
    await reviewMutation.mutateAsync({
      absenceId: reviewModal.absence.id,
      status: reviewModal.action,
      reviewNotes: reviewModal.notes,
    });
    setReviewModal({ open: false, absence: null, action: "aprovado", notes: "" });
  };

  if (!canView) return <NoAccess />;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Ausências & Licenças"
          description="Informe seus períodos de ausência com data de início e retorno, acompanhe justificativas e status de aprovação."
        >
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono font-bold text-xs px-2.5 py-1 flex items-center gap-1.5"
            >
              <CalendarOff className="h-3.5 w-3.5" />
              REGISTRO DE AUSÊNCIAS
            </Badge>
          </div>
        </PageHeader>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-9 text-xs border-border/80"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isLoading && "animate-spin")} />
            Atualizar
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="h-9 text-xs font-bold gap-1.5 bg-gradient-brand text-primary-foreground shadow-md hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Informar Ausência
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Ausentes Hoje */}
        <Card className="surface-card border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="p-3.5 sm:p-4 pb-1 sm:pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                Ausentes Hoje
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Palmtree className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-0">
            <div className="text-2xl font-black text-foreground font-mono">{activeTodayCount}</div>
            <p className="text-[0.7rem] text-muted-foreground mt-0.5">Membro(s) com licença ativa hoje</p>
          </CardContent>
        </Card>

        {/* Card 2: Pendentes */}
        <Card className="surface-card border-amber-500/30 bg-amber-500/5">
          <CardHeader className="p-3.5 sm:p-4 pb-1 sm:pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                Pendentes
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-0">
            <div className="text-2xl font-black text-foreground font-mono">{pendingCount}</div>
            <p className="text-[0.7rem] text-muted-foreground mt-0.5">Aguardando análise da liderança</p>
          </CardContent>
        </Card>

        {/* Card 3: Total Dias Justificados */}
        <Card className="surface-card border-sky-500/30 bg-sky-500/5">
          <CardHeader className="p-3.5 sm:p-4 pb-1 sm:pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
                Dias Justificados
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-0">
            <div className="text-2xl font-black text-foreground font-mono">{totalApprovedDays}</div>
            <p className="text-[0.7rem] text-muted-foreground mt-0.5">Total de dias aprovados no grupo</p>
          </CardContent>
        </Card>

        {/* Card 4: Minhas Ausências */}
        <Card className="surface-card border-purple-500/30 bg-purple-500/5">
          <CardHeader className="p-3.5 sm:p-4 pb-1 sm:pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
                Minhas Ausências
              </CardTitle>
              <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <User className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-0">
            <div className="text-2xl font-black text-foreground font-mono">{myAbsencesCount}</div>
            <p className="text-[0.7rem] text-muted-foreground mt-0.5">Registros vinculados ao seu perfil</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── ESTATÍSTICAS E GRÁFICOS GERENCIAIS (APENAS COM PERMISSÃO DE GESTÃO) ─── */}
      {canViewStats && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  Estatísticas Gerenciais de Ausências
                  <Badge variant="outline" className="text-[9px] font-mono border-amber-500/40 text-amber-400 bg-amber-500/5">
                    Painel Liderança
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Visão consolidada de sazonalidade, motivos mais frequentes e taxa de aprovação da facção.
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px] font-mono">
              Média: {statsSummary.avgDays} dias / ausência
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gráfico 1: Volume de Ausências por Mês */}
            <Card className="surface-card lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Volume de Ausências por Mês</span>
                  <span className="text-[10px] font-mono text-primary font-bold">Total: {statsSummary.total} solicitações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                        labelStyle={{ fontWeight: "bold", color: "#fff" }}
                      />
                      <Bar dataKey="ausencias" name="Ausências" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="dias" name="Dias Acumulados" fill="#38bdf8" radius={[4, 4, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico 2: Distribuição por Motivo */}
            <Card className="surface-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Distribuição por Motivo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 flex flex-col justify-between">
                <div className="h-40 w-full">
                  {chartDataReasons.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Sem registros suficientes para gráfico
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartDataReasons}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          paddingAngle={3}
                        >
                          {chartDataReasons.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#09090b",
                            borderColor: "rgba(255,255,255,0.1)",
                            borderRadius: "0.75rem",
                            fontSize: "11px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10.5px] mt-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Aprovadas:</span>
                    <span className="font-bold text-emerald-400">{statsSummary.approved}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Taxa Aprovação:</span>
                    <span className="font-bold text-primary">{statsSummary.approvalRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── FILTROS, BUSCA E LISTA DE AUSÊNCIAS ─── */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card/60 p-3 rounded-2xl border border-border/60 shadow-sm">
          {/* Tabs Filter */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-secondary/60 border border-border/50 p-1 rounded-xl w-full md:w-auto grid grid-cols-2 sm:grid-cols-4 gap-1 h-auto">
              <TabsTrigger value="todas" className="text-xs font-bold py-1.5 px-3">
                Todas ({absences.length})
              </TabsTrigger>
              <TabsTrigger value="ativas" className="text-xs font-bold py-1.5 px-3 text-emerald-400">
                Ativas ({activeTodayCount})
              </TabsTrigger>
              <TabsTrigger value="pendentes" className="text-xs font-bold py-1.5 px-3 text-amber-400">
                Pendentes ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="minhas" className="text-xs font-bold py-1.5 px-3">
                Minhas ({myAbsencesCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search & Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar membro ou motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/50 border-border/60"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs bg-secondary/50 border-border/60 font-medium">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos Status</SelectItem>
                <SelectItem value="pendente" className="text-xs">Pendente</SelectItem>
                <SelectItem value="aprovado" className="text-xs">Aprovado</SelectItem>
                <SelectItem value="rejeitado" className="text-xs">Recusado</SelectItem>
                <SelectItem value="cancelada" className="text-xs">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="h-8 w-36 text-xs bg-secondary/50 border-border/60 font-medium">
                <SelectValue placeholder="Motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos Motivos</SelectItem>
                {Object.entries(REASON_CONFIG).map(([k, cfg]) => (
                  <SelectItem key={k} value={k} className="text-xs">
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Ausências */}
        {filteredAbsences.length === 0 ? (
          <Card className="surface-card p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground">
              <CalendarOff className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-foreground">Nenhuma ausência encontrada</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Não há registros de ausências para os filtros selecionados.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs font-bold gap-1.5 bg-gradient-brand text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Informar Nova Ausência
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAbsences.map((item) => {
              const reasonCfg = REASON_CONFIG[item.reason] || REASON_CONFIG.outro;
              const ReasonIcon = reasonCfg.icon;
              const timeline = getAbsenceTimelineStatus(item);
              const isOwner = item.user_id === user?.id;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "surface-card border transition-all duration-200 hover:border-primary/40 flex flex-col justify-between",
                    item.status === "pendente" && "border-amber-500/40 shadow-amber-950/20",
                    item.status === "aprovado" && today >= item.start_date && today <= item.end_date && "border-emerald-500/50 bg-emerald-500/5"
                  )}
                >
                  <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      {/* Member Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-9 w-9 border border-primary/30 shrink-0">
                          {item.member_avatar && <AvatarImage src={item.member_avatar} alt={item.member_name} />}
                          <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                            {item.member_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-foreground truncate">
                            {item.member_nickname ? `${item.member_nickname} (${item.member_name})` : item.member_name}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] font-mono px-1.5 py-0 mt-0.5", levelBadgeClass(item.member_role as AppLevel))}
                          >
                            {getLevelLabel(item.member_role)}
                          </Badge>
                        </div>
                      </div>

                      {/* Reason Badge */}
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] font-bold gap-1 px-2 py-0.5 shrink-0", reasonCfg.bg, reasonCfg.color, reasonCfg.border)}
                      >
                        <ReasonIcon className="h-3 w-3" />
                        {reasonCfg.label}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Period & Days */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 border border-border/40 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Início:</span>
                          <span className="font-mono font-extrabold text-foreground">{formatDateBR(item.start_date)}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        <div className="space-y-0.5 text-right">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Retorno:</span>
                          <span className="font-mono font-extrabold text-primary">{formatDateBR(item.end_date)}</span>
                        </div>
                      </div>

                      {/* Timeline Badge */}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={cn("text-[10px] font-bold py-0.5 px-2", timeline.className)}>
                          {timeline.badge}
                        </Badge>
                        <span className="text-[11px] font-mono font-extrabold text-muted-foreground">
                          {item.days_count} dia(s)
                        </span>
                      </div>

                      {/* Reason Description */}
                      {item.reason_details && (
                        <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/30 text-xs text-muted-foreground">
                          <p className="text-[10px] font-bold text-foreground mb-0.5 uppercase tracking-wider flex items-center gap-1">
                            <FileText className="h-3 w-3 text-primary" /> Justificativa:
                          </p>
                          <p className="line-clamp-3 leading-relaxed">{item.reason_details}</p>
                        </div>
                      )}

                      {/* Review Info */}
                      {item.reviewed_by_name && (
                        <div className="text-[10.5px] text-muted-foreground border-t border-border/30 pt-2 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">Revisado por:</span>
                            <span className="font-bold text-primary">{item.reviewed_by_name}</span>
                          </div>
                          {item.review_notes && (
                            <p className="italic text-[10px] text-muted-foreground">"{item.review_notes}"</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Toolbar */}
                    <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formatDateBR(item.created_at.slice(0, 10))}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Liderança: Aprovar / Recusar */}
                        {canManage && item.status === "pendente" && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setReviewModal({
                                  open: true,
                                  absence: item,
                                  action: "rejeitado",
                                  notes: "",
                                })
                              }
                              className="h-7 px-2 text-xs border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-bold"
                            >
                              <X className="h-3.5 w-3.5 mr-1" /> Recusar
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                setReviewModal({
                                  open: true,
                                  absence: item,
                                  action: "aprovado",
                                  notes: "",
                                })
                              }
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                            </Button>
                          </>
                        )}

                        {/* Membro autor: Cancelar se pendente */}
                        {isOwner && item.status === "pendente" && !canManage && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => cancelMutation.mutate(item.id)}
                            disabled={cancelMutation.isPending}
                            className="h-7 px-2 text-xs border-zinc-500/40 text-zinc-400 hover:bg-zinc-500/10"
                          >
                            Cancelar
                          </Button>
                        )}

                        {/* Excluir (apenas liderança / admin) */}
                        {canManage && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (window.confirm("Deseja realmente excluir este registro de ausência?")) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Excluir Registro"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL DE INFORMAR AUSÊNCIA ─── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <CalendarOff className="h-5 w-5 text-amber-400" />
              Informar Período de Ausência
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre o período que você estará ausente das atividades da facção.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Data de Início</Label>
                <Input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                  className="h-9 text-xs bg-secondary/50 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Data de Retorno (Volta)</Label>
                <Input
                  type="date"
                  required
                  min={formData.start_date}
                  value={formData.end_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                  className="h-9 text-xs bg-secondary/50 font-mono font-bold"
                />
              </div>
            </div>

            {/* Dynamic Days Counter Badge */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Duração calculada:
              </span>
              <span className="font-mono text-sm font-black">{calculatedDays} dia(s) de ausência</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Motivo do Afastamento</Label>
              <Select
                value={formData.reason}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, reason: val as AbsenceReason }))}
              >
                <SelectTrigger className="h-9 text-xs bg-secondary/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_CONFIG).map(([k, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <SelectItem key={k} value={k} className="text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                          <span>{cfg.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Justificativa / Detalhes Adicionais</Label>
              <Textarea
                rows={3}
                placeholder="Informe detalhes importantes para a liderança (opcional)..."
                value={formData.reason_details}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason_details: e.target.value }))}
                className="text-xs bg-secondary/50 resize-none leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="h-9 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="h-9 text-xs font-bold bg-gradient-brand text-primary-foreground"
              >
                {createMutation.isPending ? "Enviando..." : "Registrar Ausência"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL DE REVISÃO PELA LIDERANÇA ─── */}
      <Dialog
        open={reviewModal.open}
        onOpenChange={(open) => !open && setReviewModal((prev) => ({ ...prev, open: false }))}
      >
        <DialogContent className="sm:max-w-md bg-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              {reviewModal.action === "aprovado" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Aprovar Ausência de {reviewModal.absence?.member_name}
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-400" />
                  Recusar Ausência de {reviewModal.absence?.member_name}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {reviewModal.action === "aprovado"
                ? "Confirme a aprovação do período de licença informado pelo membro."
                : "Informe o motivo da recusa desta solicitação de ausência."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 text-xs space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">Período:</span>
                <span className="font-bold text-foreground">
                  {formatDateBR(reviewModal.absence?.start_date || "")} até {formatDateBR(reviewModal.absence?.end_date || "")} ({reviewModal.absence?.days_count} dias)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Motivo:</span>
                <span className="font-bold text-foreground">
                  {REASON_CONFIG[reviewModal.absence?.reason || "outro"]?.label}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Observações / Parecer da Liderança</Label>
              <Textarea
                rows={2}
                placeholder="Escreva uma mensagem ou observação para o membro (opcional)..."
                value={reviewModal.notes}
                onChange={(e) => setReviewModal((prev) => ({ ...prev, notes: e.target.value }))}
                className="text-xs bg-secondary/50 resize-none leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewModal((prev) => ({ ...prev, open: false }))}
              className="h-9 text-xs"
            >
              Voltar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleReviewConfirm}
              disabled={reviewMutation.isPending}
              className={cn(
                "h-9 text-xs font-bold text-white shadow-md",
                reviewModal.action === "aprovado" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
              )}
            >
              {reviewMutation.isPending
                ? "Processando..."
                : reviewModal.action === "aprovado"
                ? "Confirmar Aprovação"
                : "Confirmar Recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
