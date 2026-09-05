import { useState, useMemo, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Target,
  Plus,
  Send,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  DollarSign,
  Boxes,
  Users,
  User,
  Image as ImageIcon,
  Eye,
  Filter,
  Search,
  UploadCloud,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ExternalLink,
  FileText,
  Check,
  X,
  ChevronRight,
  Maximize2,
  Layers,
  Receipt,
  AlertTriangle,
  Info,
  CalendarDays,
  Award,
  RotateCcw,
  Edit3,
} from "lucide-react";
import { PageHeader, NoAccess, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMembers, nameOf } from "@/hooks/useData";
import {
  useWeeklyGoals,
  useCreateWeeklyGoal,
  useUpdateWeeklyGoal,
  useDeleteWeeklyGoal,
  useGoalSubmissions,
  useSubmitGoalDelivery,
  useReviewGoalSubmission,
  useDeleteGoalSubmission,
} from "@/hooks/useWeeklyGoals";
import {
  currency,
  formatCurrencyInput,
  parseCurrencyInput,
  dateTime,
  num,
} from "@/lib/format";
import {
  WeeklyGoal,
  GoalSubmission,
  WeeklyGoalType,
  GoalTargetScope,
} from "@/lib/app-types";
import { LEVELS, LEVEL_LABEL, levelBadgeClass, AppLevel } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/metas")({
  component: MetasPage,
});

const GOAL_TYPE_META: Record<
  WeeklyGoalType,
  { label: string; icon: typeof DollarSign; color: string; badgeClass: string }
> = {
  financeiro: {
    label: "Financeiro (R$)",
    icon: DollarSign,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  quantidade: {
    label: "Insumos / Itens",
    icon: Boxes,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  vendas: {
    label: "Vendas Concluídas",
    icon: TrendingUp,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  geral: {
    label: "Geral / Produção",
    icon: Target,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
};

function formatGoalValue(val: number, type: WeeklyGoalType, unitName?: string | null) {
  if (type === "financeiro" || unitName === "R$") {
    return currency(val);
  }
  return `${num(val)} ${unitName || "unid"}`;
}

function parseGoalAmount(
  val: string | number | null | undefined,
  goalType?: WeeklyGoalType,
  unitName?: string | null
): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;

  const str = String(val).trim();
  if (!str) return 0;

  const isFinancial = goalType === "financeiro" || unitName === "R$" || str.includes("R$");

  if (isFinancial) {
    if (str.includes(",") || str.includes("R$")) {
      const digits = str.replace(/\D/g, "");
      if (!digits) return 0;
      return parseInt(digits, 10) / 100;
    }
    const digits = str.replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  // Non-financial
  if (str.includes("R$")) {
    const digits = str.replace(/\D/g, "");
    if (!digits) return 0;
    return str.includes(",") ? parseInt(digits, 10) / 100 : parseInt(digits, 10);
  }

  const sanitized = str.replace(/\s/g, "").replace(",", ".");
  const numVal = parseFloat(sanitized);
  return isNaN(numVal) ? 0 : numVal;
}

function MetasPage() {
  const { user, profile, hasPermission } = useAuth();
  const currentUserId = user?.id;
  const currentLevel = (profile?.nivel || "novato") as AppLevel;

  const canView = hasPermission("view_goals");
  const canManage = hasPermission("manage_goals");

  // Data Queries
  const { data: weeklyGoals = [], isLoading: loadingGoals } = useWeeklyGoals();
  const { data: submissions = [], isLoading: loadingSubmissions } = useGoalSubmissions();
  const { data: members = [] } = useMembers();

  // Mutations
  const createGoalMutation = useCreateWeeklyGoal();
  const updateGoalMutation = useUpdateWeeklyGoal();
  const deleteGoalMutation = useDeleteWeeklyGoal();
  const submitGoalMutation = useSubmitGoalDelivery();
  const reviewGoalMutation = useReviewGoalSubmission();
  const deleteSubmissionMutation = useDeleteGoalSubmission();

  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<string>("minhas_metas");
  const [submissionFilter, setSubmissionFilter] = useState<string>("todos");
  const [memberSearch, setMemberSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("todos");

  // Modals State
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [createGoalModalOpen, setCreateGoalModalOpen] = useState(false);
  const [proofViewerOpen, setProofViewerOpen] = useState(false);
  const [selectedProofSubmission, setSelectedProofSubmission] = useState<GoalSubmission | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingSubmission, setRejectingSubmission] = useState<GoalSubmission | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  // Create Goal Form State
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalType, setGoalType] = useState<WeeklyGoalType>("financeiro");
  const [goalTargetValue, setGoalTargetValue] = useState("");
  const [goalUnitName, setGoalUnitName] = useState("R$");
  const [goalScope, setGoalScope] = useState<GoalTargetScope>("todos");
  const [goalTargetRole, setGoalTargetRole] = useState<AppLevel>("membro");
  const [goalTargetUserId, setGoalTargetUserId] = useState("");
  const [goalStart, setGoalStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    return monday.toISOString().slice(0, 10);
  });
  const [goalEnd, setGoalEnd] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday.toISOString().slice(0, 10);
  });

  // Deliver Goal Form State
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [deliverAmount, setDeliverAmount] = useState<string>("");
  const [receiverId, setReceiverId] = useState<string>("");
  const [deliverProofUrl, setDeliverProofUrl] = useState<string>("");
  const [deliverNotes, setDeliverNotes] = useState<string>("");
  const [deliverDate, setDeliverDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Goals for this week
  const activeWeeklyGoal = useMemo(() => {
    return weeklyGoals.find((g) => g.is_active) || weeklyGoals[0] || null;
  }, [weeklyGoals]);

  // Selected Goal for delivery modal
  const selectedGoalForDelivery = useMemo(() => {
    return weeklyGoals.find((g) => g.id === selectedGoalId) || activeWeeklyGoal;
  }, [weeklyGoals, selectedGoalId, activeWeeklyGoal]);

  const isDeliverFinancial = useMemo(() => {
    if (!selectedGoalForDelivery) return true;
    return selectedGoalForDelivery.type === "financeiro" || selectedGoalForDelivery.unit_name === "R$";
  }, [selectedGoalForDelivery]);

  // Set default selected goal when opening delivery modal
  useEffect(() => {
    if (activeWeeklyGoal && !selectedGoalId) {
      setSelectedGoalId(activeWeeklyGoal.id);
    }
  }, [activeWeeklyGoal, selectedGoalId]);

  const handleOpenDeliverModal = (goalId?: string) => {
    if (goalId) {
      setSelectedGoalId(goalId);
    } else if (activeWeeklyGoal) {
      setSelectedGoalId(activeWeeklyGoal.id);
    } else if (weeklyGoals.length > 0) {
      setSelectedGoalId(weeklyGoals[0].id);
    }
    setDeliverAmount("");
    setDeliverProofUrl("");
    setDeliverNotes("");
    setReceiverId("");
    setDeliverModalOpen(true);
  };

  // Helper for quick current week date presets
  const setThisWeekPreset = () => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setGoalStart(monday.toISOString().slice(0, 10));
    setGoalEnd(sunday.toISOString().slice(0, 10));
  };

  // Helper for image upload & paste handling
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setDeliverProofUrl(result);
      toast.success("Print do comprovante anexado!");
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          handleImageFile(file);
          break;
        }
      }
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  // Current User's Active Goal Progress
  const myGoalStats = useMemo(() => {
    if (!activeWeeklyGoal || !currentUserId) return null;

    const mySubs = submissions.filter(
      (s) => s.goal_id === activeWeeklyGoal.id && s.user_id === currentUserId
    );
    const approvedAmount = mySubs
      .filter((s) => s.status === "aprovado")
      .reduce((acc, s) => acc + Number(s.amount), 0);
    const pendingAmount = mySubs
      .filter((s) => s.status === "pendente")
      .reduce((acc, s) => acc + Number(s.amount), 0);

    const totalDelivered = approvedAmount + pendingAmount;
    const targetVal = Number(activeWeeklyGoal.target_value) || 1;
    const approvedPct = Math.min(100, Math.max(0, (approvedAmount / targetVal) * 100));
    const totalProgressPct = Math.min(100, Math.max(0, (totalDelivered / targetVal) * 100));
    const pendingPct = Math.min(100 - approvedPct, Math.max(0, (pendingAmount / targetVal) * 100));
    const remaining = Math.max(0, targetVal - totalDelivered);
    const isCompleted = approvedAmount >= targetVal;
    const isFullyDelivered = totalDelivered >= targetVal;

    const today = new Date().toISOString().slice(0, 10);
    const isExpired = today > activeWeeklyGoal.period_end && !isCompleted && !isFullyDelivered;

    return {
      goal: activeWeeklyGoal,
      approvedAmount,
      pendingAmount,
      totalDelivered,
      remaining,
      progressPct: totalProgressPct,
      approvedPct,
      pendingPct,
      isCompleted,
      isFullyDelivered,
      isExpired,
      submissions: mySubs,
    };
  }, [activeWeeklyGoal, currentUserId, submissions]);

  // General Family / Members Progress Overview (Manager only)
  const membersProgress = useMemo(() => {
    if (!activeWeeklyGoal) return [];

    return members.map((m) => {
      const mSubs = submissions.filter(
        (s) => s.goal_id === activeWeeklyGoal.id && s.user_id === m.user_id
      );
      const approvedAmount = mSubs
        .filter((s) => s.status === "aprovado")
        .reduce((acc, s) => acc + Number(s.amount), 0);
      const pendingAmount = mSubs
        .filter((s) => s.status === "pendente")
        .reduce((acc, s) => acc + Number(s.amount), 0);

      const totalDelivered = approvedAmount + pendingAmount;
      const targetVal = Number(activeWeeklyGoal.target_value) || 1;
      const approvedPct = Math.min(100, Math.max(0, (approvedAmount / targetVal) * 100));
      const totalProgressPct = Math.min(100, Math.max(0, (totalDelivered / targetVal) * 100));
      const pendingPct = Math.min(100 - approvedPct, Math.max(0, (pendingAmount / targetVal) * 100));
      const remaining = Math.max(0, targetVal - totalDelivered);
      const isPaid = approvedAmount >= targetVal;
      const isFullyDelivered = totalDelivered >= targetVal;
      const hasPendingReview = pendingAmount > 0;

      const today = new Date().toISOString().slice(0, 10);
      const isExpired = today > activeWeeklyGoal.period_end && !isPaid && !isFullyDelivered;

      let statusBadge = "Pendente";
      let statusColor = "bg-secondary text-muted-foreground border-border";

      if (isPaid) {
        statusBadge = "Meta Paga 100%";
        statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      } else if (isFullyDelivered) {
        statusBadge = "100% (Em Análise)";
        statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
      } else if (hasPendingReview) {
        statusBadge = "Em Análise";
        statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
      } else if (approvedAmount > 0) {
        statusBadge = "Parcial";
        statusColor = "bg-sky-500/10 text-sky-400 border-sky-500/30";
      } else if (isExpired) {
        statusBadge = "Atrasado";
        statusColor = "bg-destructive/10 text-destructive border-destructive/30";
      }

      return {
        member: m,
        approvedAmount,
        pendingAmount,
        totalDelivered,
        remaining,
        progressPct: totalProgressPct,
        approvedPct,
        pendingPct,
        isPaid,
        isFullyDelivered,
        hasPendingReview,
        isExpired,
        statusBadge,
        statusColor,
        submissionsCount: mSubs.length,
      };
    });
  }, [activeWeeklyGoal, members, submissions]);

  // Filtered Members Progress
  const filteredMembersProgress = useMemo(() => {
    return membersProgress.filter((item) => {
      const matchName =
        !memberSearch ||
        item.member.nome.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (item.member.nickname && item.member.nickname.toLowerCase().includes(memberSearch.toLowerCase()));

      const matchRole = roleFilter === "todos" || item.member.nivel === roleFilter;

      return matchName && matchRole;
    });
  }, [membersProgress, memberSearch, roleFilter]);

  // Pending Submissions Count for notification badge
  const pendingSubmissionsCount = useMemo(() => {
    return submissions.filter((s) => s.status === "pendente").length;
  }, [submissions]);

  // Overall Weekly KPIs
  const weeklyKpis = useMemo(() => {
    const totalMembers = members.length || 1;
    const paidMembersCount = membersProgress.filter((m) => m.isPaid).length;
    const totalCollectedApproved = submissions
      .filter((s) => s.status === "aprovado" && (!activeWeeklyGoal || s.goal_id === activeWeeklyGoal.id))
      .reduce((acc, s) => acc + Number(s.amount), 0);
    const familyCompletionPct = Math.min(100, Math.round((paidMembersCount / totalMembers) * 100));

    return {
      totalMembers,
      paidMembersCount,
      pendingMembersCount: totalMembers - paidMembersCount,
      totalCollectedApproved,
      familyCompletionPct,
    };
  }, [members, membersProgress, submissions, activeWeeklyGoal]);

  // Filtered Submissions List for Management Tab
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (submissionFilter === "todos") return true;
      return s.status === submissionFilter;
    });
  }, [submissions, submissionFilter]);

  // Potential Receivers (Leaders, Managers, Officers, Members)
  const potentialReceivers = useMemo(() => {
    return members.filter((m) => m.user_id !== currentUserId);
  }, [members, currentUserId]);

  if (!canView) return <NoAccess />;

  // Handler: Submit Delivery
  const handleDeliverGoal = async () => {
    const goal = selectedGoalForDelivery;
    if (!goal) {
      toast.error("Selecione uma meta válida.");
      return;
    }
    const val = parseGoalAmount(deliverAmount, goal.type, goal.unit_name);
    if (!Number.isFinite(val) || val <= 0) {
      toast.error("Informe um valor ou quantidade válida entregue maior que zero.");
      return;
    }
    if (!receiverId) {
      toast.error("Selecione o membro da família que recebeu o valor/itens.");
      return;
    }

    try {
      await submitGoalMutation.mutateAsync({
        goal_id: goal.id,
        receiver_id: receiverId,
        amount: val,
        proof_url: deliverProofUrl.trim() || undefined,
        notes: deliverNotes.trim() || undefined,
        delivered_at: deliverDate ? new Date(deliverDate).toISOString() : new Date().toISOString(),
      });
      setDeliverModalOpen(false);
      setDeliverAmount("");
      setDeliverProofUrl("");
      setDeliverNotes("");
      setReceiverId("");
    } catch {}
  };

  // Handler: Create Goal
  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) {
      toast.error("Informe um título para a meta.");
      return;
    }
    const val = goalType === "financeiro" ? parseCurrencyInput(goalTargetValue) : Number(goalTargetValue);
    if (!Number.isFinite(val) || val <= 0) {
      toast.error("Informe um valor alvo válido maior que zero.");
      return;
    }
    if (!goalStart || !goalEnd) {
      toast.error("Defina o período da meta.");
      return;
    }

    let targetUserName: string | undefined = undefined;
    if (goalScope === "membro" && goalTargetUserId) {
      const m = members.find((x) => x.user_id === goalTargetUserId);
      targetUserName = m ? m.nickname || m.nome : undefined;
    }

    try {
      await createGoalMutation.mutateAsync({
        title: goalTitle.trim(),
        description: goalDesc.trim() || undefined,
        type: goalType,
        target_value: val,
        unit_name: goalType === "financeiro" ? "R$" : goalUnitName.trim() || "itens",
        target_scope: goalScope,
        target_role: goalScope === "cargo" ? goalTargetRole : undefined,
        target_user_id: goalScope === "membro" ? goalTargetUserId : undefined,
        target_user_name: targetUserName,
        period_start: goalStart,
        period_end: goalEnd,
      });
      setCreateGoalModalOpen(false);
      setGoalTitle("");
      setGoalDesc("");
      setGoalTargetValue("");
    } catch {}
  };

  // Handler: Confirm Rejection
  const handleConfirmReject = async () => {
    if (!rejectingSubmission) return;
    try {
      await reviewGoalMutation.mutateAsync({
        submissionId: rejectingSubmission.id,
        status: "rejeitado",
        reviewNotes: rejectNotes.trim() || undefined,
      });
      setRejectModalOpen(false);
      if (selectedProofSubmission?.id === rejectingSubmission.id) {
        setSelectedProofSubmission((prev) =>
          prev ? { ...prev, status: "rejeitado", review_notes: rejectNotes.trim() || undefined } : null
        );
      }
      setRejectingSubmission(null);
      setRejectNotes("");
    } catch {}
  };

  // ─── RENDER HELPER 1: VISÃO PESSOAL (MINHA META & MINHAS ENTREGAS) ───
  const renderPersonalGoalView = () => {
    if (!myGoalStats) {
      return (
        <EmptyState
          icon={<Target className="h-10 w-10 text-muted-foreground" />}
          title="Nenhuma meta semanal ativa"
          description="A liderança ainda não ativou nenhuma meta semanal para a família."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Status Pessoal da Semana */}
        <Card
          className={cn(
            "surface-card border transition-all lg:col-span-1 flex flex-col justify-between",
            myGoalStats.isCompleted
              ? "border-emerald-500/40 bg-emerald-500/5"
              : myGoalStats.isFullyDelivered
              ? "border-amber-500/40 bg-amber-500/5"
              : myGoalStats.isExpired
              ? "border-destructive/40 bg-destructive/5"
              : "border-primary/40 bg-primary/5"
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] font-bold border-primary/40 text-primary">
                {GOAL_TYPE_META[myGoalStats.goal.type]?.label || "Meta Semanal"}
              </Badge>
              {myGoalStats.isCompleted ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Meta Paga 100%
                </Badge>
              ) : myGoalStats.isFullyDelivered ? (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] font-bold gap-1">
                  <Clock className="h-3 w-3" /> 100% Entregue (Em Análise)
                </Badge>
              ) : myGoalStats.isExpired ? (
                <Badge variant="destructive" className="text-[10px] font-bold">
                  Prazo Expirado
                </Badge>
              ) : myGoalStats.pendingAmount > 0 ? (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] font-bold gap-1">
                  <Clock className="h-3 w-3" /> Em Análise
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] font-bold">
                  Em Aberto
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg font-extrabold text-foreground pt-1">
              {myGoalStats.goal.title}
            </CardTitle>
            {myGoalStats.goal.description && (
              <CardDescription className="text-xs text-muted-foreground line-clamp-3">
                {myGoalStats.goal.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            <div className="p-3.5 rounded-xl bg-background/60 border border-border/70 space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground">
                    {myGoalStats.pendingAmount > 0 && myGoalStats.approvedAmount === 0
                      ? "Total Entregue (Em Análise) / Alvo"
                      : "Já Pago / Alvo"}
                  </p>
                  <p className="text-lg font-mono font-extrabold text-emerald-400">
                    {formatGoalValue(
                      myGoalStats.totalDelivered,
                      myGoalStats.goal.type,
                      myGoalStats.goal.unit_name
                    )}
                    <span className="text-xs font-normal text-muted-foreground">
                      {" / "}
                      {formatGoalValue(
                        myGoalStats.goal.target_value,
                        myGoalStats.goal.type,
                        myGoalStats.goal.unit_name
                      )}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-extrabold text-primary">
                    {myGoalStats.progressPct.toFixed(0)}%
                  </span>
                  {myGoalStats.pendingAmount > 0 && (
                    <span className="block text-[10px] text-amber-400 font-bold">
                      {myGoalStats.approvedAmount > 0
                        ? `(${myGoalStats.approvedPct.toFixed(0)}% aprovado)`
                        : "(aguardando print)"}
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de Progresso Dual / Responsiva */}
              <div className="relative h-2.5 w-full bg-secondary/80 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${myGoalStats.approvedPct}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 bg-amber-500 transition-all duration-500 rounded-full"
                  style={{
                    left: `${myGoalStats.approvedPct}%`,
                    width: `${myGoalStats.pendingPct}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">Restante:</span>
                <span className="font-mono font-bold text-foreground">
                  {myGoalStats.remaining === 0
                    ? "Meta Entregue! 🎉"
                    : formatGoalValue(
                        myGoalStats.remaining,
                        myGoalStats.goal.type,
                        myGoalStats.goal.unit_name
                      )}
                </span>
              </div>

              {myGoalStats.pendingAmount > 0 && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[0.7rem] text-amber-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Você possui <strong>{formatGoalValue(myGoalStats.pendingAmount, myGoalStats.goal.type, myGoalStats.goal.unit_name)}</strong> aguardando aprovação de print.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>
                Vigência: <strong>{myGoalStats.goal.period_start}</strong> até <strong>{myGoalStats.goal.period_end}</strong>
              </span>
            </div>
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/40">
            <Button
              onClick={() => handleOpenDeliverModal(myGoalStats.goal.id)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4" /> Informar Pagamento / Entrega
            </Button>
          </CardFooter>
        </Card>

        {/* Histórico Pessoal de Entregas */}
        <Card className="surface-card border-border/70 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" /> Meus Comprovantes & Entregas Registradas
                </CardTitle>
                <CardDescription className="text-xs">
                  Lista de todas as entregas de meta que você enviou com comprovante.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold">
                {myGoalStats.submissions.length} entregas
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {myGoalStats.submissions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">Nenhum comprovante de entrega enviado ainda nesta semana.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDeliverModal()}
                  className="text-xs font-bold border-emerald-500/40 text-emerald-400"
                >
                  Enviar Primeiro Comprovante
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {myGoalStats.submissions.map((sub) => (
                  <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Preview do print ou ícone */}
                      {sub.proof_url ? (
                        <div
                          onClick={() => {
                            setSelectedProofSubmission(sub);
                            setProofViewerOpen(true);
                          }}
                          className="relative w-14 h-14 rounded-xl overflow-hidden border border-border/70 shrink-0 cursor-pointer group bg-black/40"
                        >
                          <img
                            src={sub.proof_url}
                            alt="Print do comprovante"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-secondary/60 border border-border/70 flex items-center justify-center text-muted-foreground shrink-0">
                          <Receipt className="h-5 w-5" />
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-extrabold text-sm text-foreground">
                            {sub.unit_name === "R$" ? currency(sub.amount) : `${num(sub.amount)} ${sub.unit_name || "itens"}`}
                          </span>
                          {sub.status === "aprovado" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px] font-bold">
                              <Check className="h-2.5 w-2.5 mr-0.5" /> Aprovado
                            </Badge>
                          ) : sub.status === "rejeitado" ? (
                            <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-[9px] font-bold">
                              <X className="h-2.5 w-2.5 mr-0.5" /> Recusado
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] font-bold">
                              <Clock className="h-2.5 w-2.5 mr-0.5" /> Pendente
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Entregue para: <strong className="text-foreground">{sub.receiver_name}</strong>
                        </p>

                        <p className="text-[0.68rem] text-muted-foreground">
                          {dateTime(sub.delivered_at)}
                        </p>

                        {sub.notes && (
                          <p className="text-[0.7rem] text-foreground/80 italic pt-0.5">
                            "{sub.notes}"
                          </p>
                        )}

                        {sub.review_notes && (
                          <p className="text-[0.7rem] text-amber-400 font-medium pt-0.5">
                            Nota da Liderança: {sub.review_notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {sub.proof_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProofSubmission(sub);
                            setProofViewerOpen(true);
                          }}
                          className="h-8 text-xs gap-1.5 border-border/80"
                        >
                          <Eye className="h-3.5 w-3.5" /> Ver Print
                        </Button>
                      )}

                      {sub.status === "pendente" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSubmissionMutation.mutate(sub.id)}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── RENDER HELPER 2: PAINEL DE VALIDAÇÃO (GESTOR ONLY) ───
  const renderValidationPanel = () => (
    <Card className="surface-card border-border/70">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Painel de Validação e Análise de Entregas
            </CardTitle>
            <CardDescription className="text-xs">
              Examine os comprovantes de prints enviados pelos membros, verifique quem recebeu e aprove ou recuse.
            </CardDescription>
          </div>

          {/* Filtros de Status */}
          <div className="flex items-center gap-1.5 bg-secondary/40 p-1 rounded-xl border border-border/60">
            {["todos", "pendente", "aprovado", "rejeitado"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSubmissionFilter(st)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer",
                  submissionFilter === st
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loadingSubmissions ? (
          <TableSkeleton rows={4} />
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground space-y-2">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 opacity-60" />
            <h4 className="text-sm font-bold text-foreground">Nenhuma entrega encontrada</h4>
            <p className="text-xs">
              {submissionFilter === "pendente"
                ? "Todas as entregas enviadas já foram analisadas pela liderança!"
                : "Nenhum comprovante de entrega registrado para este filtro."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                className={cn(
                  "p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors",
                  sub.status === "pendente"
                    ? "bg-amber-500/5 hover:bg-amber-500/10"
                    : "hover:bg-secondary/20"
                )}
              >
                {/* Lado Esquerdo: Dados do Membro e Entrega */}
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Print Thumbnail */}
                  {sub.proof_url ? (
                    <div
                      onClick={() => {
                        setSelectedProofSubmission(sub);
                        setProofViewerOpen(true);
                      }}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-border/80 shrink-0 cursor-pointer group bg-black/60 shadow-md"
                    >
                      <img
                        src={sub.proof_url}
                        alt="Comprovante"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Maximize2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-secondary/60 border border-border flex items-center justify-center text-muted-foreground shrink-0">
                      <Receipt className="h-6 w-6" />
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-foreground">
                        {sub.member_name}
                      </span>
                      {sub.member_role && (
                        <Badge className={cn("text-[9px] font-mono py-0 px-1.5", levelBadgeClass(sub.member_role as AppLevel))}>
                          {LEVEL_LABEL[sub.member_role as AppLevel] || sub.member_role}
                        </Badge>
                      )}
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono font-extrabold text-sm text-emerald-400">
                        {sub.unit_name === "R$" ? currency(sub.amount) : `${num(sub.amount)} ${sub.unit_name || "itens"}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>
                        Meta: <strong className="text-foreground">{sub.goal_title}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Entregue para: <strong className="text-foreground">{sub.receiver_name}</strong>
                      </span>
                      <span>•</span>
                      <span>{dateTime(sub.delivered_at)}</span>
                    </div>

                    {sub.notes && (
                      <p className="text-xs text-foreground/80 bg-background/40 p-1.5 rounded-lg border border-border/50">
                        💬 <em>"{sub.notes}"</em>
                      </p>
                    )}

                    {sub.review_notes && (
                      <p className="text-xs text-amber-400 font-medium">
                        ⚠️ Motivo da recusa: {sub.review_notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Ações de Aprovação / Rejeição */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {sub.proof_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProofSubmission(sub);
                        setProofViewerOpen(true);
                      }}
                      className="h-8 text-xs gap-1 font-bold border-border"
                    >
                      <Eye className="h-3.5 w-3.5" /> Abrir Print
                    </Button>
                  )}

                  {canManage && sub.status === "pendente" && (
                    <>
                      <Button
                        size="sm"
                        disabled={reviewGoalMutation.isPending}
                        onClick={() =>
                          reviewGoalMutation.mutate({
                            submissionId: sub.id,
                            status: "aprovado",
                          })
                        }
                        className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1 cursor-pointer"
                        title="Aprovar entrega"
                      >
                        <Check className="h-3.5 w-3.5" /> Aprovar
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewGoalMutation.isPending}
                        onClick={() => {
                          setRejectingSubmission(sub);
                          setRejectNotes(sub.review_notes || "");
                          setRejectModalOpen(true);
                        }}
                        className="h-8 text-xs font-bold border-destructive/40 text-destructive hover:bg-destructive/10 gap-1 cursor-pointer"
                        title="Recusar entrega"
                      >
                        <X className="h-3.5 w-3.5" /> Recusar
                      </Button>
                    </>
                  )}

                  {canManage && sub.status === "aprovado" && (
                    <>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs font-bold gap-1 py-1 px-2.5">
                        <Check className="h-3.5 w-3.5" /> Aprovado
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewGoalMutation.isPending}
                        onClick={() =>
                          reviewGoalMutation.mutate({
                            submissionId: sub.id,
                            status: "pendente",
                          })
                        }
                        className="h-8 text-xs font-semibold border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1 cursor-pointer"
                        title="Voltar para validação (status pendente)"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Voltar p/ Validação
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewGoalMutation.isPending}
                        onClick={() => {
                          setRejectingSubmission(sub);
                          setRejectNotes(sub.review_notes || "");
                          setRejectModalOpen(true);
                        }}
                        className="h-8 text-xs font-semibold border-destructive/40 text-destructive hover:bg-destructive/10 gap-1 cursor-pointer"
                        title="Alterar para Recusado"
                      >
                        <X className="h-3.5 w-3.5" /> Recusar
                      </Button>
                    </>
                  )}

                  {canManage && sub.status === "rejeitado" && (
                    <>
                      <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs font-bold gap-1 py-1 px-2.5">
                        <X className="h-3.5 w-3.5" /> Recusado
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewGoalMutation.isPending}
                        onClick={() =>
                          reviewGoalMutation.mutate({
                            submissionId: sub.id,
                            status: "pendente",
                          })
                        }
                        className="h-8 text-xs font-semibold border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-1 cursor-pointer"
                        title="Voltar para validação (status pendente)"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Voltar p/ Validação
                      </Button>
                      <Button
                        size="sm"
                        disabled={reviewGoalMutation.isPending}
                        onClick={() =>
                          reviewGoalMutation.mutate({
                            submissionId: sub.id,
                            status: "aprovado",
                          })
                        }
                        className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-1 cursor-pointer"
                        title="Alterar para Aprovado"
                      >
                        <Check className="h-3.5 w-3.5" /> Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRejectingSubmission(sub);
                          setRejectNotes(sub.review_notes || "");
                          setRejectModalOpen(true);
                        }}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                        title="Editar motivo da recusa"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Editar Motivo
                      </Button>
                    </>
                  )}

                  {canManage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSubmissionMutation.mutate(sub.id)}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ─── RENDER HELPER 3: CONTROLE GERAL DA FAMÍLIA (GESTOR ONLY) ───
  const renderFamilyMembersControl = () => (
    <Card className="surface-card border-border/70">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Raio-X de Cumprimento Semanal da Família
            </CardTitle>
            <CardDescription className="text-xs">
              Veja quais membros já pagaram a meta da semana, valores parciais e membros pendentes.
            </CardDescription>
          </div>

          {/* Busca e Filtro de Cargo */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar membro..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/40"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 text-xs w-36 bg-secondary/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Cargos</SelectItem>
                {LEVELS.map((lvl) => (
                  <SelectItem key={lvl} value={lvl}>
                    {LEVEL_LABEL[lvl]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {filteredMembersProgress.map((item) => (
            <div
              key={item.member.user_id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
                  {item.member.nome.slice(0, 2).toUpperCase()}
                </div>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-extrabold text-sm text-foreground truncate">
                      {item.member.nickname ? `${item.member.nickname} (${item.member.nome})` : item.member.nome}
                    </h5>
                    {item.member.nivel && (
                      <Badge className={cn("text-[9px] font-mono py-0 px-1.5", levelBadgeClass(item.member.nivel))}>
                        {LEVEL_LABEL[item.member.nivel] || item.member.nivel}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>
                      Entregue:{" "}
                      <strong className="text-emerald-400 font-mono">
                        {formatGoalValue(
                          item.totalDelivered,
                          activeWeeklyGoal.type,
                          activeWeeklyGoal.unit_name
                        )}
                      </strong>
                      {item.pendingAmount > 0 && (
                        <span className="text-[10px] text-amber-400 ml-1 font-bold">
                          ({formatGoalValue(item.pendingAmount, activeWeeklyGoal.type, activeWeeklyGoal.unit_name)} em análise)
                        </span>
                      )}
                    </span>
                    <span>•</span>
                    <span>
                      Restante:{" "}
                      <strong className="text-foreground font-mono">
                        {item.remaining === 0
                          ? "Concluído"
                          : formatGoalValue(
                              item.remaining,
                              activeWeeklyGoal.type,
                              activeWeeklyGoal.unit_name
                            )}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 sm:w-64 justify-between sm:justify-end">
                <div className="w-28 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono font-bold">
                    <span>Progresso</span>
                    <span className="text-primary">{item.progressPct.toFixed(0)}%</span>
                  </div>
                  <div className="relative h-2 w-full bg-secondary/80 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-emerald-500 rounded-full"
                      style={{ width: `${item.approvedPct}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 bg-amber-500 rounded-full"
                      style={{
                        left: `${item.approvedPct}%`,
                        width: `${item.pendingPct}%`,
                      }}
                    />
                  </div>
                </div>

                <Badge className={cn("text-xs font-bold shrink-0", item.statusColor)}>
                  {item.statusBadge}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // ─── RENDER HELPER 4: GESTÃO DE METAS CADASTRADAS (GESTOR ONLY) ───
  const renderGoalsManagement = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Metas Semanais Registradas</h3>
          <p className="text-xs text-muted-foreground">Gerencie as metas ativas e históricas da facção.</p>
        </div>
        {canManage && (
          <Button
            onClick={() => setCreateGoalModalOpen(true)}
            size="sm"
            className="bg-gradient-brand text-primary-foreground text-xs font-bold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar Meta
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {weeklyGoals.map((g) => {
          const metaConfig = GOAL_TYPE_META[g.type] || GOAL_TYPE_META.geral;
          const MetaIcon = metaConfig.icon;

          return (
            <Card key={g.id} className="surface-card border-border/70 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-xl border", metaConfig.color)}>
                      <MetaIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <Badge variant="outline" className={cn("text-[9px] font-bold", metaConfig.badgeClass)}>
                        {metaConfig.label}
                      </Badge>
                      <CardTitle className="text-sm font-extrabold text-foreground mt-0.5">
                        {g.title}
                      </CardTitle>
                    </div>
                  </div>

                  <Badge
                    variant={g.is_active ? "default" : "secondary"}
                    className="text-[9px] font-mono uppercase shrink-0"
                  >
                    {g.is_active ? "Ativa" : "Encerrada"}
                  </Badge>
                </div>

                {g.description && (
                  <CardDescription className="text-xs text-muted-foreground line-clamp-2 pt-1">
                    {g.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pt-2">
                <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Alvo por Membro:</span>
                  <span className="font-mono font-extrabold text-sm text-emerald-400">
                    {formatGoalValue(g.target_value, g.type, g.unit_name)}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Escopo:</span>
                    <strong className="text-foreground capitalize">
                      {g.target_scope === "todos"
                        ? "Todos os Membros"
                        : g.target_scope === "cargo"
                        ? `Cargo: ${LEVEL_LABEL[g.target_role as AppLevel] || g.target_role}`
                        : `Membro: ${g.target_user_name || "Individual"}`}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Vigência:</span>
                    <strong className="text-foreground font-mono text-[11px]">
                      {g.period_start} até {g.period_end}
                    </strong>
                  </div>
                </div>
              </CardContent>

              {canManage && (
                <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateGoalMutation.mutate({
                        id: g.id,
                        updates: { is_active: !g.is_active },
                      })
                    }
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    {g.is_active ? "Desativar" : "Ativar"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteGoalMutation.mutate(g.id)}
                    className="text-xs h-7 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                  </Button>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* ─── PAGE HEADER & QUICK ACTIONS ─── */}
      <PageHeader
        title="Metas & Contribuições Semanais"
        description={
          canManage
            ? "Acompanhe o cumprimento das metas da facção, valide comprovantes com prints e gerencie a arrecadação da família."
            : "Consulte a meta semanal da facção, acompanhe seu saldo pago/restante e envie seus comprovantes de entrega de meta."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => handleOpenDeliverModal()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4" /> Entregar Meta
            </Button>

            {canManage && (
              <Button
                onClick={() => setCreateGoalModalOpen(true)}
                className="bg-gradient-brand text-primary-foreground hover:opacity-90 font-bold gap-2 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Nova Meta Semanal
              </Button>
            )}
          </div>
        }
      />

      {/* ─── KPIS & CARDS SUMMARY ─── */}
      {canManage ? (
        /* VISÃO DE GESTÃO / LIDERANÇA */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Meta Semanal Vigente */}
          <Card className="surface-card border-border/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Meta Semanal Vigente
              </span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-foreground truncate">
                {activeWeeklyGoal ? activeWeeklyGoal.title : "Nenhuma Meta Ativa"}
              </h4>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {activeWeeklyGoal
                  ? formatGoalValue(activeWeeklyGoal.target_value, activeWeeklyGoal.type, activeWeeklyGoal.unit_name)
                  : "R$ 0,00"}
                <span className="text-[0.7rem] font-normal text-muted-foreground ml-1">/ membro</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[0.68rem] text-muted-foreground pt-2 mt-2 border-t border-border/40">
              <CalendarDays className="h-3 w-3 text-primary" />
              <span>
                {activeWeeklyGoal
                  ? `${activeWeeklyGoal.period_start} até ${activeWeeklyGoal.period_end}`
                  : "Sem prazo ativo"}
              </span>
            </div>
          </Card>

          {/* Card 2: Arrecadação Aprovada */}
          <Card className="surface-card border-border/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Total Arrecadado (Semana)
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-mono font-extrabold text-emerald-400">
                {currency(weeklyKpis.totalCollectedApproved)}
              </h4>
              <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                Soma de pagamentos confirmados e aprovados
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[0.68rem] text-emerald-400 pt-2 mt-2 border-t border-border/40">
              <CheckCircle2 className="h-3 w-3" />
              <span>Validado pela liderança</span>
            </div>
          </Card>

          {/* Card 3: Cumprimento da Família */}
          <Card className="surface-card border-border/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Membros em Dia
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <h4 className="text-xl font-mono font-extrabold text-foreground">
                  {weeklyKpis.paidMembersCount} / {weeklyKpis.totalMembers}
                </h4>
                <span className="text-xs font-mono font-bold text-primary">
                  {weeklyKpis.familyCompletionPct}%
                </span>
              </div>
              <Progress value={weeklyKpis.familyCompletionPct} className="h-1.5 mt-2" />
            </div>
            <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground pt-2 mt-2 border-t border-border/40">
              <span>{weeklyKpis.pendingMembersCount} pendentes</span>
              <span className="text-emerald-400 font-semibold">{weeklyKpis.paidMembersCount} concluídos</span>
            </div>
          </Card>

          {/* Card 4: Entregas Pendentes de Revisão */}
          <Card
            onClick={() => setActiveTab("painel_validacao")}
            className="surface-card border-border/70 p-4 flex flex-col justify-between transition-all cursor-pointer hover:border-amber-500/40 hover:bg-amber-500/5"
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Entregas Pendentes
              </span>
              <div
                className={cn(
                  "p-1.5 rounded-lg border",
                  pendingSubmissionsCount > 0
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse"
                    : "bg-secondary text-muted-foreground border-border"
                )}
              >
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-mono font-extrabold text-foreground">
                  {pendingSubmissionsCount}
                </h4>
                {pendingSubmissionsCount > 0 && (
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] font-bold">
                    Aguardando Análise
                  </Badge>
                )}
              </div>
              <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                Comprovantes com prints enviados pelos membros
              </p>
            </div>
            <div className="flex items-center justify-between text-[0.68rem] text-primary font-semibold pt-2 mt-2 border-t border-border/40">
              <span>Clique para analisar →</span>
              <Receipt className="h-3 w-3" />
            </div>
          </Card>
        </div>
      ) : (
        /* VISÃO PESSOAL RESUMIDA PARA O MEMBRO */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Meta Vigente */}
          <Card className="surface-card border-border/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Minha Meta da Semana
              </span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-foreground truncate">
                {activeWeeklyGoal ? activeWeeklyGoal.title : "Nenhuma Meta Ativa"}
              </h4>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {activeWeeklyGoal
                  ? formatGoalValue(activeWeeklyGoal.target_value, activeWeeklyGoal.type, activeWeeklyGoal.unit_name)
                  : "R$ 0,00"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[0.68rem] text-muted-foreground pt-2 mt-2 border-t border-border/40">
              <CalendarDays className="h-3 w-3 text-primary" />
              <span>
                {activeWeeklyGoal
                  ? `${activeWeeklyGoal.period_start} até ${activeWeeklyGoal.period_end}`
                  : "Sem prazo"}
              </span>
            </div>
          </Card>

          {/* Card 2: Meu Total Entregue / Aprovado */}
          <Card className="surface-card border-border/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Meu Total Pago / Entregue
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-mono font-extrabold text-emerald-400">
                {myGoalStats
                  ? formatGoalValue(myGoalStats.totalDelivered, myGoalStats.goal.type, myGoalStats.goal.unit_name)
                  : "R$ 0,00"}
              </h4>
              <p className="text-[0.7rem] text-muted-foreground mt-0.5">
                {myGoalStats && myGoalStats.pendingAmount > 0
                  ? myGoalStats.approvedAmount > 0
                    ? `${formatGoalValue(myGoalStats.approvedAmount, myGoalStats.goal.type, myGoalStats.goal.unit_name)} aprovado + ${formatGoalValue(myGoalStats.pendingAmount, myGoalStats.goal.type, myGoalStats.goal.unit_name)} em análise`
                    : "Aguardando validação da liderança"
                  : "Entregas aprovadas pela liderança"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[0.68rem] text-emerald-400 pt-2 mt-2 border-t border-border/40">
              {myGoalStats && myGoalStats.pendingAmount > 0 && myGoalStats.approvedAmount === 0 ? (
                <>
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span className="text-amber-400 font-semibold">
                    {myGoalStats.progressPct.toFixed(0)}% entregue (em análise)
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>
                    {myGoalStats ? `${myGoalStats.progressPct.toFixed(0)}% concluído` : "0%"}
                  </span>
                </>
              )}
            </div>
          </Card>

          {/* Card 3: Meu Saldo Restante */}
          <Card className="surface-card border-border/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Saldo Restante
              </span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Boxes className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-mono font-extrabold text-foreground">
                {myGoalStats
                  ? myGoalStats.remaining === 0
                    ? "Meta Paga! 🎉"
                    : formatGoalValue(myGoalStats.remaining, myGoalStats.goal.type, myGoalStats.goal.unit_name)
                  : "R$ 0,00"}
              </h4>
              <Progress value={myGoalStats?.progressPct || 0} className="h-1.5 mt-2" />
            </div>
            <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground pt-2 mt-2 border-t border-border/40">
              <span>{myGoalStats?.remaining === 0 ? "Tudo quitado" : "Valor faltante"}</span>
              <span className="text-primary font-semibold">{myGoalStats?.progressPct.toFixed(0) || 0}% entregue</span>
            </div>
          </Card>

          {/* Card 4: Meu Status */}
          <Card className="surface-card border-border/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Meu Status Atual
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                {myGoalStats?.isCompleted ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs font-bold gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Meta Paga 100%
                  </Badge>
                ) : myGoalStats?.isFullyDelivered ? (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs font-bold gap-1">
                    <Clock className="h-3.5 w-3.5" /> 100% Entregue (Em Análise)
                  </Badge>
                ) : myGoalStats && myGoalStats.pendingAmount > 0 ? (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs font-bold gap-1">
                    <Clock className="h-3.5 w-3.5" /> Em Análise
                  </Badge>
                ) : myGoalStats && myGoalStats.approvedAmount > 0 ? (
                  <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/40 text-xs font-bold gap-1">
                    <Info className="h-3.5 w-3.5" /> Pagamento Parcial
                  </Badge>
                ) : myGoalStats?.isExpired ? (
                  <Badge variant="destructive" className="text-xs font-bold">
                    Prazo Expirado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs font-bold">
                    Em Aberto
                  </Badge>
                )}
              </div>
              <p className="text-[0.7rem] text-muted-foreground mt-2">
                {myGoalStats ? `${myGoalStats.submissions.length} entregas registradas` : "Nenhum comprovante"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[0.68rem] text-muted-foreground pt-2 mt-2 border-t border-border/40">
              <Receipt className="h-3 w-3 text-primary" />
              <span>Histórico pessoal salvo</span>
            </div>
          </Card>
        </div>
      )}

      {/* ─── CONTEÚDO PRINCIPAL (COM OU SEM ABAS DE GESTÃO) ─── */}
      {canManage ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/40 p-1 border border-border/60 flex flex-wrap h-auto gap-1">
            <TabsTrigger
              value="minhas_metas"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold py-2 px-4 cursor-pointer gap-2"
            >
              <User className="h-3.5 w-3.5" /> Minha Meta & Minhas Entregas
            </TabsTrigger>

            <TabsTrigger
              value="painel_validacao"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold py-2 px-4 cursor-pointer gap-2"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Validação de Comprovantes
              {pendingSubmissionsCount > 0 && (
                <Badge className="ml-1 bg-amber-500 text-black font-extrabold text-[10px] py-0 px-1.5 h-4">
                  {pendingSubmissionsCount}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="membros"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold py-2 px-4 cursor-pointer gap-2"
            >
              <Users className="h-3.5 w-3.5" /> Controle Geral da Família
            </TabsTrigger>

            <TabsTrigger
              value="metas_cadastradas"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-bold py-2 px-4 cursor-pointer gap-2"
            >
              <Layers className="h-3.5 w-3.5" /> Metas Cadastradas ({weeklyGoals.length})
            </TabsTrigger>
          </TabsList>

          {/* ABA 1 */}
          <TabsContent value="minhas_metas" className="space-y-6 mt-0">
            {renderPersonalGoalView()}
          </TabsContent>

          {/* ABA 2 */}
          <TabsContent value="painel_validacao" className="space-y-4 mt-0">
            {renderValidationPanel()}
          </TabsContent>

          {/* ABA 3 */}
          <TabsContent value="membros" className="space-y-4 mt-0">
            {renderFamilyMembersControl()}
          </TabsContent>

          {/* ABA 4 */}
          <TabsContent value="metas_cadastradas" className="space-y-4 mt-0">
            {renderGoalsManagement()}
          </TabsContent>
        </Tabs>
      ) : (
        /* MEMBROS SEM PERMISSÃO DE GESTÃO: APENAS VISÃO PESSOAL E RESUMIDA */
        <div className="space-y-6">
          {renderPersonalGoalView()}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: ENTREGAR META / PAGAR META COM PRINT                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={deliverModalOpen} onOpenChange={setDeliverModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onPaste={handlePaste}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <Send className="h-5 w-5 text-emerald-400" /> Informar Entrega / Pagamento de Meta
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os detalhes do pagamento da meta, a quem você entregou e anexe o print do comprovante (F8).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Seleção da Meta */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Meta Semanal</Label>
              <Select
                value={selectedGoalId || (activeWeeklyGoal ? activeWeeklyGoal.id : "")}
                onValueChange={(val) => {
                  setSelectedGoalId(val);
                  setDeliverAmount("");
                }}
              >
                <SelectTrigger className="bg-secondary/40">
                  <SelectValue placeholder="Selecione a meta..." />
                </SelectTrigger>
                <SelectContent>
                  {weeklyGoals
                    .filter((g) => g.is_active)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title} — Alvo: {formatGoalValue(g.target_value, g.type, g.unit_name)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Valor ou Quantidade Entregue */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                {isDeliverFinancial
                  ? "Valor Entregue (R$)"
                  : `Quantidade Entregue (${selectedGoalForDelivery?.unit_name || "itens"})`}
              </Label>
              <Input
                placeholder={
                  isDeliverFinancial
                    ? "Ex: R$ 50.000,00"
                    : `Ex: 500 (${selectedGoalForDelivery?.unit_name || "itens"})`
                }
                value={deliverAmount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (isDeliverFinancial) {
                    setDeliverAmount(formatCurrencyInput(raw));
                  } else {
                    setDeliverAmount(raw.replace(/[^0-9.]/g, ""));
                  }
                }}
                className="font-mono font-bold text-emerald-400 bg-secondary/40 text-sm"
              />
              <p className="text-[0.68rem] text-muted-foreground">
                {isDeliverFinancial
                  ? "Você pode entregar o valor total da meta ou pagamentos parciais."
                  : `Informe a quantidade de ${selectedGoalForDelivery?.unit_name || "insumos/itens"} entregues.`}
              </p>
            </div>

            {/* 3. A qual membro entregou (Membro Recebedor) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">A Qual Membro da Liderança Entregou?</Label>
              <Select value={receiverId} onValueChange={setReceiverId}>
                <SelectTrigger className="bg-secondary/40">
                  <SelectValue placeholder="Selecione o membro que recebeu..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {potentialReceivers.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.nickname ? `${m.nickname} (${m.nome})` : m.nome}{" "}
                      {m.nivel ? `— ${LEVEL_LABEL[m.nivel] || m.nivel}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Dropzone de Print / Comprovante */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" /> Print / Comprovante da Entrega
                </Label>
                <span className="text-[0.68rem] text-muted-foreground">
                  Suporta Ctrl+V ou arrastar arquivo
                </span>
              </div>

              {deliverProofUrl ? (
                <div className="relative rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-2 space-y-2">
                  <div className="relative max-h-48 rounded-lg overflow-hidden border border-border bg-black/60 flex items-center justify-center">
                    <img
                      src={deliverProofUrl}
                      alt="Preview do print"
                      className="max-h-48 w-auto object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Print Anexado com Sucesso
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => setDeliverProofUrl("")}
                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Remover Print
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "p-5 rounded-xl border-2 border-dashed transition-all text-center cursor-pointer select-none space-y-2",
                    isDraggingFile
                      ? "border-primary bg-primary/10"
                      : "border-border/70 hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                  />
                  <UploadCloud className="h-8 w-8 mx-auto text-primary opacity-80" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Clique para selecionar ou arraste o print aqui
                    </p>
                    <p className="text-[0.68rem] text-muted-foreground mt-0.5">
                      Dica: Você também pode colar o print com <strong>Ctrl+V</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Observações do Membro */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Observações / Detalhes (Opcional)</Label>
              <Textarea
                placeholder="Ex: Deixei 50k no baú 2 com o 01 Fulano por volta das 21h."
                value={deliverNotes}
                onChange={(e) => setDeliverNotes(e.target.value)}
                className="text-xs bg-secondary/40"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeliverModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={submitGoalMutation.isPending}
              onClick={handleDeliverGoal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2"
            >
              {submitGoalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: NOVA META SEMANAL (GESTÃO)                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={createGoalModalOpen} onOpenChange={setCreateGoalModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <Target className="h-5 w-5 text-primary" /> Cadastrar Nova Meta Semanal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Defina a meta semanal que os membros da família deverão cumprir e entregar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Título da Meta */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Título da Meta</Label>
              <Input
                placeholder="Ex: Meta Semanal - Farm & Dinheiro Sujo"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="text-xs bg-secondary/40"
              />
            </div>

            {/* Tipo de Meta e Valor Alvo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tipo de Meta</Label>
                <Select value={goalType} onValueChange={(v: WeeklyGoalType) => setGoalType(v)}>
                  <SelectTrigger className="bg-secondary/40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financeiro">Financeiro (R$)</SelectItem>
                    <SelectItem value="quantidade">Insumos / Itens</SelectItem>
                    <SelectItem value="vendas">Qtd. de Vendas</SelectItem>
                    <SelectItem value="geral">Geral / Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  {goalType === "financeiro" ? "Valor Alvo (R$)" : "Quantidade Alvo"}
                </Label>
                <Input
                  placeholder={goalType === "financeiro" ? "R$ 50.000" : "Ex: 500"}
                  value={goalTargetValue}
                  onChange={(e) =>
                    setGoalTargetValue(
                      goalType === "financeiro" ? formatCurrencyInput(e.target.value) : e.target.value
                    )
                  }
                  className="font-mono font-bold text-emerald-400 bg-secondary/40 text-xs"
                />
              </div>
            </div>

            {/* Escopo da Meta */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Para Quem é a Meta?</Label>
              <Select value={goalScope} onValueChange={(v: GoalTargetScope) => setGoalScope(v)}>
                <SelectTrigger className="bg-secondary/40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Membros (Geral)</SelectItem>
                  <SelectItem value="cargo">Por Cargo Hierárquico</SelectItem>
                  <SelectItem value="membro">Membro Específico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {goalScope === "cargo" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Selecione o Cargo Alvo</Label>
                <Select value={goalTargetRole} onValueChange={(v: AppLevel) => setGoalTargetRole(v)}>
                  <SelectTrigger className="bg-secondary/40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {LEVEL_LABEL[lvl]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {goalScope === "membro" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Selecione o Membro</Label>
                <Select value={goalTargetUserId} onValueChange={setGoalTargetUserId}>
                  <SelectTrigger className="bg-secondary/40 text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-52">
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.nickname ? `${m.nickname} (${m.nome})` : m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Período da Meta */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Período de Vigência</Label>
                <button
                  type="button"
                  onClick={setThisWeekPreset}
                  className="text-[0.68rem] text-primary hover:underline font-bold cursor-pointer"
                >
                  ⚡ Esta Semana (Seg a Dom)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={goalStart}
                  onChange={(e) => setGoalStart(e.target.value)}
                  className="text-xs bg-secondary/40 font-mono"
                />
                <Input
                  type="date"
                  value={goalEnd}
                  onChange={(e) => setGoalEnd(e.target.value)}
                  className="text-xs bg-secondary/40 font-mono"
                />
              </div>
            </div>

            {/* Descrição e Instruções */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Instruções / Regras da Entrega</Label>
              <Textarea
                placeholder="Ex: Entregar até domingo às 23:59 para qualquer 01 ou Gerente em serviço com print do F8."
                value={goalDesc}
                onChange={(e) => setGoalDesc(e.target.value)}
                className="text-xs bg-secondary/40"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setCreateGoalModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={createGoalMutation.isPending}
              onClick={handleCreateGoal}
              className="bg-gradient-brand text-primary-foreground font-bold gap-2"
            >
              {createGoalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Meta Semanal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: VISUALIZADOR DE COMPROVANTE (PRINT)                   */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={proofViewerOpen} onOpenChange={setProofViewerOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[95vh] p-4 flex flex-col justify-between">
          <DialogHeader className="pb-2 border-b border-border/40">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> Comprovante de Entrega
              </DialogTitle>
              {selectedProofSubmission && (
                <Badge
                  className={cn(
                    "text-xs font-bold",
                    selectedProofSubmission.status === "aprovado"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : selectedProofSubmission.status === "rejeitado"
                      ? "bg-destructive/10 text-destructive border-destructive/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  )}
                >
                  {selectedProofSubmission.status.toUpperCase()}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedProofSubmission && (
            <div className="space-y-4 py-2 overflow-y-auto max-h-[70vh]">
              {/* Imagem do Print */}
              <div className="rounded-xl overflow-hidden border border-border/80 bg-black/80 flex items-center justify-center p-1">
                {selectedProofSubmission.proof_url ? (
                  <img
                    src={selectedProofSubmission.proof_url}
                    alt="Print da entrega"
                    className="max-h-[50vh] w-auto object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto opacity-30" />
                    <p className="text-xs">Nenhum print anexado a este lançamento.</p>
                  </div>
                )}
              </div>

              {/* Informações da Entrega */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs">
                <div>
                  <span className="text-[0.65rem] text-muted-foreground uppercase">Membro:</span>
                  <p className="font-extrabold text-foreground truncate">{selectedProofSubmission.member_name}</p>
                </div>
                <div>
                  <span className="text-[0.65rem] text-muted-foreground uppercase">Entregue Para:</span>
                  <p className="font-extrabold text-foreground truncate">{selectedProofSubmission.receiver_name}</p>
                </div>
                <div>
                  <span className="text-[0.65rem] text-muted-foreground uppercase">Valor / Qtd:</span>
                  <p className="font-mono font-extrabold text-emerald-400 truncate">
                    {selectedProofSubmission.unit_name === "R$"
                      ? currency(selectedProofSubmission.amount)
                      : `${num(selectedProofSubmission.amount)} ${selectedProofSubmission.unit_name || "itens"}`}
                  </p>
                </div>
                <div>
                  <span className="text-[0.65rem] text-muted-foreground uppercase">Data/Hora:</span>
                  <p className="text-foreground truncate">{dateTime(selectedProofSubmission.delivered_at)}</p>
                </div>
              </div>

              {selectedProofSubmission.notes && (
                <div className="p-2.5 rounded-lg bg-background/50 border border-border/50 text-xs">
                  <span className="text-[0.65rem] text-muted-foreground uppercase block font-bold">Observação do Membro:</span>
                  <p className="text-foreground italic">"{selectedProofSubmission.notes}"</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border/40 flex items-center justify-between sm:justify-between flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setProofViewerOpen(false)}>
              Fechar
            </Button>

            {canManage && selectedProofSubmission && (
              <div className="flex items-center gap-2 flex-wrap">
                {selectedProofSubmission.status === "pendente" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        setRejectingSubmission(selectedProofSubmission);
                        setRejectNotes(selectedProofSubmission.review_notes || "");
                        setRejectModalOpen(true);
                      }}
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-bold cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Recusar
                    </Button>

                    <Button
                      size="sm"
                      onClick={async () => {
                        await reviewGoalMutation.mutateAsync({
                          submissionId: selectedProofSubmission.id,
                          status: "aprovado",
                        });
                        setSelectedProofSubmission((prev) =>
                          prev ? { ...prev, status: "aprovado" } : null
                        );
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Aprovar Comprovante
                    </Button>
                  </>
                )}

                {selectedProofSubmission.status === "aprovado" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reviewGoalMutation.isPending}
                      onClick={async () => {
                        await reviewGoalMutation.mutateAsync({
                          submissionId: selectedProofSubmission.id,
                          status: "pendente",
                        });
                        setSelectedProofSubmission((prev) =>
                          prev ? { ...prev, status: "pendente", review_notes: undefined } : null
                        );
                      }}
                      className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-bold cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Voltar p/ Validação
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectingSubmission(selectedProofSubmission);
                        setRejectNotes(selectedProofSubmission.review_notes || "");
                        setRejectModalOpen(true);
                      }}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-bold cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Mudar p/ Recusado
                    </Button>
                  </>
                )}

                {selectedProofSubmission.status === "rejeitado" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reviewGoalMutation.isPending}
                      onClick={async () => {
                        await reviewGoalMutation.mutateAsync({
                          submissionId: selectedProofSubmission.id,
                          status: "pendente",
                        });
                        setSelectedProofSubmission((prev) =>
                          prev ? { ...prev, status: "pendente", review_notes: undefined } : null
                        );
                      }}
                      className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-bold cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Voltar p/ Validação
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectingSubmission(selectedProofSubmission);
                        setRejectNotes(selectedProofSubmission.review_notes || "");
                        setRejectModalOpen(true);
                      }}
                      className="border-muted text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" /> Editar Motivo
                    </Button>

                    <Button
                      size="sm"
                      disabled={reviewGoalMutation.isPending}
                      onClick={async () => {
                        await reviewGoalMutation.mutateAsync({
                          submissionId: selectedProofSubmission.id,
                          status: "aprovado",
                        });
                        setSelectedProofSubmission((prev) =>
                          prev ? { ...prev, status: "aprovado" } : null
                        );
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Mudar p/ Aprovado
                    </Button>
                  </>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: RECUSAR / REJEITAR COMPROVANTE COM JUSTIFICATIVA      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-destructive">
              <AlertTriangle className="h-5 w-5" />{" "}
              {rejectingSubmission?.status === "rejeitado"
                ? "Editar Motivo da Recusa"
                : "Recusar Comprovante de Entrega"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informe o motivo da recusa para que o integrante possa corrigir e reenviar o comprovante corretamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Motivo da Recusa / Observações</Label>
              <Textarea
                placeholder="Ex: Print ilegível, valor divergente no baú, F8 sem passaporte aberto..."
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="text-xs bg-secondary/40"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={reviewGoalMutation.isPending}
              onClick={handleConfirmReject}
              className="font-bold cursor-pointer"
            >
              {reviewGoalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {rejectingSubmission?.status === "rejeitado" ? "Salvar Motivo" : "Confirmar Recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
