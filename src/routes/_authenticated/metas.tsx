import { useState, useMemo, useRef, useEffect } from "react";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
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
  Sliders,
} from "lucide-react";
import { UniversalImageAdjusterModal } from "@/components/ui/UniversalImageAdjusterModal";
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
  dateOnly,
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
import { useUrlTab } from "@/hooks/useUrlTab";
import { Switch } from "@/components/ui/switch";
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
  component: MetasWrapper,
});

function MetasWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <MetasPage />;
}

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

function toISODate(d?: string | null): string {
  if (!d) return "";
  const trimmed = d.trim();
  if (trimmed.includes("/")) {
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  return trimmed.slice(0, 10);
}

function formatGoalValue(val: number, type: WeeklyGoalType, unitName?: string | null) {
  if (type === "financeiro" || unitName === "R$") {
    return currency(val);
  }
  return `${num(val)} ${unitName || "unid"}`;
}

function formatGoalPeriod(start?: string | null, end?: string | null) {
  if (!start && !end) return "Vigência Indefinida";
  const s = start ? dateOnly(start) : "Início";
  const e = end ? dateOnly(end) : "Fim";
  return `${s} até ${e}`;
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

export function MetasPage() {
  const { user, profile, hasPermission } = useAuth();
  const currentUserId = user?.id;

  // Permissão estrita: apenas quem possuir explicitamente a permissão manage_goals
  const canManage = hasPermission("manage_goals");
  const canView = hasPermission("view_goals") || canManage;

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

  // Navigation & Filter State sincronizado com a URL (?tab=minhas_metas | painel_validacao | membros | metas_cadastradas)
  const [activeTab, setActiveTab] = useUrlTab<string>("minhas_metas", {
    paramName: "tab",
    allowedTabs: ["minhas_metas", "painel_validacao", "membros", "metas_cadastradas"],
  });

  // Redireciona para visão pessoal se o usuário não possuir a permissão explícita manage_goals
  useEffect(() => {
    if (!canManage && activeTab !== "minhas_metas") {
      setActiveTab("minhas_metas");
    }
  }, [canManage, activeTab, setActiveTab]);
  const [submissionFilter, setSubmissionFilter] = useState<string>("todos");
  const [validationGoalFilter, setValidationGoalFilter] = useState<string>("todos");
  const [validationSearch, setValidationSearch] = useState<string>("");
  const [memberSearch, setMemberSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [viewedGoalId, setViewedGoalId] = useState<string>("todos");
  const [mySubsGoalFilter, setMySubsGoalFilter] = useState<"all" | "selected">("all");
  const [subsScope, setSubsScope] = useState<"family" | "mine">("family");
  const [subsFamilySearch, setSubsFamilySearch] = useState<string>("");

  // Modals State
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [createGoalModalOpen, setCreateGoalModalOpen] = useState(false);
  const [editGoalModalOpen, setEditGoalModalOpen] = useState(false);
  const [deleteGoalConfirmOpen, setDeleteGoalConfirmOpen] = useState(false);
  const [deleteSubConfirmOpen, setDeleteSubConfirmOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<WeeklyGoal | null>(null);
  const [subToDelete, setSubToDelete] = useState<GoalSubmission | null>(null);
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

  // Edit Goal Form State
  const [editingGoal, setEditingGoal] = useState<WeeklyGoal | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editGoalDesc, setEditGoalDesc] = useState("");
  const [editGoalType, setEditGoalType] = useState<WeeklyGoalType>("financeiro");
  const [editGoalTargetValue, setEditGoalTargetValue] = useState("");
  const [editGoalUnitName, setEditGoalUnitName] = useState("R$");
  const [editGoalScope, setEditGoalScope] = useState<GoalTargetScope>("todos");
  const [editGoalTargetRole, setEditGoalTargetRole] = useState<AppLevel>("membro");
  const [editGoalTargetUserId, setEditGoalTargetUserId] = useState("");
  const [editGoalStart, setEditGoalStart] = useState("");
  const [editGoalEnd, setEditGoalEnd] = useState("");
  const [editGoalIsActive, setEditGoalIsActive] = useState(true);

  // Deliver Goal Form State
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [deliverAmount, setDeliverAmount] = useState<string>("");
  const [receiverId, setReceiverId] = useState<string>("");
  const [deliverProofUrl, setDeliverProofUrl] = useState<string>("");
  const [originalProofSrc, setOriginalProofSrc] = useState<string | null>(null);
  const [proofAdjusterOpen, setProofAdjusterOpen] = useState(false);
  const [pendingProofSrc, setPendingProofSrc] = useState<string | null>(null);
  const [deliverNotes, setDeliverNotes] = useState<string>("");
  const [deliverDate, setDeliverDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Goals for this week
  const activeWeeklyGoal = useMemo(() => {
    return weeklyGoals.find((g) => g.is_active) || weeklyGoals[0] || null;
  }, [weeklyGoals]);

  // Selected goal to view, defaulting to active goal, all goals, or first available
  const currentViewGoal = useMemo(() => {
    if (viewedGoalId === "todos") {
      return {
        id: "todos",
        title: "Visão Geral Acumulada de Todas as Metas",
        description: "Consolidado geral de todas as metas e entregas registradas até o dia 13/10/26",
        type: "financeiro" as WeeklyGoalType,
        target_value: activeWeeklyGoal?.target_value || 50000,
        unit_name: "R$",
        scope: "todos" as GoalTargetScope,
        target_role: "membro" as AppLevel,
        period_start: "2026-09-01",
        period_end: "2026-10-31",
        is_active: false,
        created_at: "2026-09-01T00:00:00.000Z",
        created_by: "c5ef6dc6-e126-4027-80c3-319f0a870315",
        created_by_name: "Liderança Twin Wheels",
      };
    }
    if (viewedGoalId && viewedGoalId !== "active") {
      const found = weeklyGoals.find((g) => g.id === viewedGoalId);
      if (found) return found;
    }
    return activeWeeklyGoal || weeklyGoals[0] || null;
  }, [weeklyGoals, viewedGoalId, activeWeeklyGoal]);

  // Helper to match user's own submissions across different identifier fields
  const isMySubmission = (s: GoalSubmission) => {
    if (!currentUserId && !profile) return false;
    return (
      s.user_id === currentUserId ||
      s.user_id === profile?.id ||
      s.user_id === (profile as any)?.user_id ||
      (profile?.nome && s.member_name?.toLowerCase().trim() === profile.nome.toLowerCase().trim()) ||
      (profile?.nickname && s.member_nickname?.toLowerCase().trim() === profile.nickname.toLowerCase().trim()) ||
      (profile?.nickname && s.member_name?.toLowerCase().trim() === profile.nickname.toLowerCase().trim()) ||
      (profile?.nome && s.member_nickname?.toLowerCase().trim() === profile.nome.toLowerCase().trim())
    );
  };

  // Selected Goal for delivery modal
  const selectedGoalForDelivery = useMemo(() => {
    return weeklyGoals.find((g) => g.id === selectedGoalId) || currentViewGoal || activeWeeklyGoal;
  }, [weeklyGoals, selectedGoalId, currentViewGoal, activeWeeklyGoal]);

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
    setOriginalProofSrc(null);
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
    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 15MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPendingProofSrc(result);
      setOriginalProofSrc(result);
      setProofAdjusterOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveAdjustedProof = async (croppedBlob: Blob, croppedDataUrl: string, originalDataUrl?: string) => {
    let finalUrl = "";
    try {
      const { uploadImageToPostimages } = await import("@/services/postimagesService");
      finalUrl = await uploadImageToPostimages(croppedBlob, { filename: `proof_${Date.now()}.png` });
    } catch (e: any) {
      console.warn("⚠️ Aviso ao subir print da meta no Postimages:", e);
      toast.error(e?.message || "Não foi possível enviar o comprovante para o servidor de imagens. Tente novamente.");
      return;
    }

    if (!finalUrl || finalUrl.startsWith("data:")) {
      toast.error("URL de comprovante inválida. O upload não foi concluído.");
      return;
    }

    setDeliverProofUrl(finalUrl);
    if (originalDataUrl && !originalDataUrl.startsWith("data:")) {
      setOriginalProofSrc(originalDataUrl);
    }
    setProofAdjusterOpen(false);
    setPendingProofSrc(null);
    toast.success("Comprovante ajustado no estúdio e salvo com sucesso!");
  };

  const handleReAdjustProof = () => {
    const source = originalProofSrc || deliverProofUrl;
    if (!source) return;
    setPendingProofSrc(source);
    setProofAdjusterOpen(true);
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

  // Current User's Goal Progress
  const myGoalStats = useMemo(() => {
    if (!currentViewGoal) return null;

    const allUserSubs = submissions.filter(isMySubmission);
    const myGoalSubs = viewedGoalId === "todos" ? allUserSubs : allUserSubs.filter((s) => s.goal_id === currentViewGoal.id);
    const displayedSubs = mySubsGoalFilter === "all" || viewedGoalId === "todos" ? allUserSubs : myGoalSubs;

    const approvedAmount = myGoalSubs
      .filter((s) => s.status === "aprovado")
      .reduce((acc, s) => acc + Number(s.amount), 0);
    const pendingAmount = myGoalSubs
      .filter((s) => s.status === "pendente")
      .reduce((acc, s) => acc + Number(s.amount), 0);

    const totalDelivered = approvedAmount + pendingAmount;
    const targetVal = Number(currentViewGoal.target_value) || 1;
    const approvedPct = Math.min(100, Math.max(0, (approvedAmount / targetVal) * 100));
    const totalProgressPct = Math.min(100, Math.max(0, (totalDelivered / targetVal) * 100));
    const pendingPct = Math.min(100 - approvedPct, Math.max(0, (pendingAmount / targetVal) * 100));
    const remaining = Math.max(0, targetVal - totalDelivered);
    const isCompleted = approvedAmount >= targetVal;
    const isFullyDelivered = totalDelivered >= targetVal;

    const today = new Date().toISOString().slice(0, 10);
    const isExpired = today > currentViewGoal.period_end && !isCompleted && !isFullyDelivered;

    const totalAllGoalsDelivered = allUserSubs
      .filter((s) => s.status === "aprovado")
      .reduce((acc, s) => acc + Number(s.amount), 0);

    return {
      goal: currentViewGoal,
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
      submissions: displayedSubs,
      totalUserSubmissionsCount: allUserSubs.length,
      goalSubmissionsCount: myGoalSubs.length,
      totalAllGoalsDelivered,
    };
  }, [currentViewGoal, submissions, currentUserId, profile, mySubsGoalFilter, viewedGoalId]);

  // General Family / Members Progress Overview (Manager only)
  const membersProgress = useMemo(() => {
    if (!currentViewGoal) return [];

    return members.map((m) => {
      const mSubs = submissions.filter(
        (s) =>
          (viewedGoalId === "todos" || s.goal_id === currentViewGoal.id) &&
          (s.user_id === m.user_id ||
           s.user_id === m.id ||
           (m.nome && s.member_name?.toLowerCase().trim() === m.nome.toLowerCase().trim()) ||
           (m.nickname && s.member_nickname?.toLowerCase().trim() === m.nickname.toLowerCase().trim()) ||
           (m.nickname && s.member_name?.toLowerCase().trim() === m.nickname.toLowerCase().trim()) ||
           (m.nome && s.member_nickname?.toLowerCase().trim() === m.nome.toLowerCase().trim()))
      );
      const approvedAmount = mSubs
        .filter((s) => s.status === "aprovado")
        .reduce((acc, s) => acc + Number(s.amount), 0);
      const pendingAmount = mSubs
        .filter((s) => s.status === "pendente")
        .reduce((acc, s) => acc + Number(s.amount), 0);

      const totalDelivered = approvedAmount + pendingAmount;
      const targetVal = Number(currentViewGoal.target_value) || 1;
      const approvedPct = Math.min(100, Math.max(0, (approvedAmount / targetVal) * 100));
      const totalProgressPct = Math.min(100, Math.max(0, (totalDelivered / targetVal) * 100));
      const pendingPct = Math.min(100 - approvedPct, Math.max(0, (pendingAmount / targetVal) * 100));
      const remaining = Math.max(0, targetVal - totalDelivered);
      const isPaid = approvedAmount >= targetVal;
      const isFullyDelivered = totalDelivered >= targetVal;
      const hasPendingReview = pendingAmount > 0;

      const today = new Date().toISOString().slice(0, 10);
      const isExpired = today > currentViewGoal.period_end && !isPaid && !isFullyDelivered;

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
  }, [currentViewGoal, members, submissions, viewedGoalId]);

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
      .filter((s) => s.status === "aprovado" && (!currentViewGoal || viewedGoalId === "todos" || s.goal_id === currentViewGoal.id))
      .reduce((acc, s) => acc + Number(s.amount), 0);
    const totalAllTimeApproved = submissions
      .filter((s) => s.status === "aprovado")
      .reduce((acc, s) => acc + Number(s.amount), 0);
    const familyCompletionPct = Math.min(100, Math.round((paidMembersCount / totalMembers) * 100));

    return {
      totalMembers,
      paidMembersCount,
      pendingMembersCount: totalMembers - paidMembersCount,
      totalCollectedApproved,
      totalAllTimeApproved,
      familyCompletionPct,
    };
  }, [members, membersProgress, submissions, currentViewGoal, viewedGoalId]);

  // Helper de contagem de entregas por meta
  const getGoalSubmissionCount = (goalId: string, status?: string) => {
    return submissions.filter((s) => {
      const matchGoal = goalId === "todos" || s.goal_id === goalId;
      const matchStatus = !status || status === "todos" || s.status === status;
      return matchGoal && matchStatus;
    }).length;
  };

  // Submissões filtradas para o painel de validação
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchStatus = submissionFilter === "todos" || s.status === submissionFilter;
      const matchGoal = validationGoalFilter === "todos" || s.goal_id === validationGoalFilter;
      const matchSearch =
        !validationSearch ||
        s.member_name?.toLowerCase().includes(validationSearch.toLowerCase()) ||
        s.member_nickname?.toLowerCase().includes(validationSearch.toLowerCase()) ||
        s.receiver_name?.toLowerCase().includes(validationSearch.toLowerCase()) ||
        s.notes?.toLowerCase().includes(validationSearch.toLowerCase());
      return matchStatus && matchGoal && matchSearch;
    });
  }, [submissions, submissionFilter, validationGoalFilter, validationSearch]);

  const validationStatusCounts = useMemo(() => {
    return {
      todos: submissions.length,
      pendente: submissions.filter((s) => s.status === "pendente").length,
      aprovado: submissions.filter((s) => s.status === "aprovado").length,
      rejeitado: submissions.filter((s) => s.status === "rejeitado").length,
    };
  }, [submissions]);

  // Lista de entregas exibida na aba Minhas Metas & Entregas (com suporte a ver toda a família)
  const visibleDeliveries = useMemo(() => {
    let list = subsScope === "mine" ? submissions.filter(isMySubmission) : submissions;
    if (viewedGoalId !== "todos" && mySubsGoalFilter === "selected" && currentViewGoal) {
      list = list.filter((s) => s.goal_id === currentViewGoal.id);
    }
    if (subsFamilySearch.trim()) {
      const q = subsFamilySearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.member_name?.toLowerCase().includes(q) ||
          s.member_nickname?.toLowerCase().includes(q) ||
          s.receiver_name?.toLowerCase().includes(q) ||
          s.notes?.toLowerCase().includes(q) ||
          s.goal_title?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [submissions, subsScope, viewedGoalId, mySubsGoalFilter, currentViewGoal, subsFamilySearch, currentUserId, profile]);

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
    if (!canManage) {
      toast.error("Apenas usuários com a permissão explícita 'manage_goals' podem criar metas.");
      return;
    }
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
    if (!canManage) {
      toast.error("Apenas usuários com a permissão explícita 'manage_goals' podem avaliar comprovantes.");
      return;
    }
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

  // Handler: Open Edit Goal Modal
  const handleOpenEditGoal = (goal: WeeklyGoal) => {
    if (!canManage) {
      toast.error("Apenas usuários com a permissão explícita 'manage_goals' podem editar metas.");
      return;
    }
    setEditingGoal(goal);
    setEditGoalTitle(goal.title);
    setEditGoalDesc(goal.description || "");
    setEditGoalType(goal.type);
    setEditGoalTargetValue(
      goal.type === "financeiro" || goal.unit_name === "R$"
        ? formatCurrencyInput(String(Math.round(goal.target_value * 100)))
        : String(goal.target_value)
    );
    setEditGoalUnitName(goal.unit_name || (goal.type === "financeiro" ? "R$" : "itens"));
    setEditGoalScope(goal.target_scope || "todos");
    setEditGoalTargetRole((goal.target_role as AppLevel) || "membro");
    setEditGoalTargetUserId(goal.target_user_id || "");
    setEditGoalStart(toISODate(goal.period_start));
    setEditGoalEnd(toISODate(goal.period_end));
    setEditGoalIsActive(goal.is_active);
    setEditGoalModalOpen(true);
  };

  // Handler: Save Edited Goal
  const handleSaveEditGoal = async () => {
    if (!canManage) {
      toast.error("Apenas usuários com a permissão explícita 'manage_goals' podem editar metas.");
      return;
    }
    if (!editingGoal) return;
    if (!editGoalTitle.trim()) {
      toast.error("Informe um título para a meta.");
      return;
    }
    const val = editGoalType === "financeiro" ? parseCurrencyInput(editGoalTargetValue) : Number(editGoalTargetValue);
    if (!Number.isFinite(val) || val <= 0) {
      toast.error("Informe um valor alvo válido maior que zero.");
      return;
    }
    if (!editGoalStart || !editGoalEnd) {
      toast.error("Defina o período de vigência da meta.");
      return;
    }

    let targetUserName: string | undefined = undefined;
    if (editGoalScope === "membro" && editGoalTargetUserId) {
      const m = members.find((x) => x.user_id === editGoalTargetUserId);
      targetUserName = m ? m.nickname || m.nome : undefined;
    }

    try {
      await updateGoalMutation.mutateAsync({
        id: editingGoal.id,
        updates: {
          title: editGoalTitle.trim(),
          description: editGoalDesc.trim() || undefined,
          type: editGoalType,
          target_value: val,
          unit_name: editGoalType === "financeiro" ? "R$" : editGoalUnitName.trim() || "itens",
          target_scope: editGoalScope,
          target_role: editGoalScope === "cargo" ? editGoalTargetRole : undefined,
          target_user_id: editGoalScope === "membro" ? editGoalTargetUserId : undefined,
          target_user_name: targetUserName,
          period_start: editGoalStart,
          period_end: editGoalEnd,
          is_active: editGoalIsActive,
        },
      });
      setEditGoalModalOpen(false);
      setEditingGoal(null);
    } catch {}
  };

  // Quick preset for edit goal
  const setEditThisWeekPreset = () => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setEditGoalStart(monday.toISOString().slice(0, 10));
    setEditGoalEnd(sunday.toISOString().slice(0, 10));
  };

  // Handler: Delete Goal with Confirmation
  const handleOpenDeleteGoal = (goal: WeeklyGoal) => {
    if (!canManage) {
      toast.error("Apenas usuários com a permissão explícita 'manage_goals' podem excluir metas.");
      return;
    }
    setGoalToDelete(goal);
    setDeleteGoalConfirmOpen(true);
  };

  const handleConfirmDeleteGoal = async () => {
    if (!canManage) {
      toast.error("Apenas usuários com a permissão explícita 'manage_goals' podem excluir metas.");
      return;
    }
    if (!goalToDelete) return;
    try {
      await deleteGoalMutation.mutateAsync(goalToDelete.id);
      setDeleteGoalConfirmOpen(false);
      if (viewedGoalId === goalToDelete.id) {
        setViewedGoalId("todos");
      }
      setGoalToDelete(null);
    } catch {}
  };

  // Handler: Delete Submission with Confirmation
  const handleOpenDeleteSub = (sub: GoalSubmission) => {
    if (!canManage) {
      toast.error("Apenas usuários com a permissão explícita 'manage_goals' podem excluir comprovantes.");
      return;
    }
    setSubToDelete(sub);
    setDeleteSubConfirmOpen(true);
  };

  const handleConfirmDeleteSub = async () => {
    if (!canManage) {
      toast.error("Apenas usuários com a permissão explícita 'manage_goals' podem excluir comprovantes.");
      return;
    }
    if (!subToDelete) return;
    try {
      await deleteSubmissionMutation.mutateAsync(subToDelete.id);
      setDeleteSubConfirmOpen(false);
      if (selectedProofSubmission?.id === subToDelete.id) {
        setProofViewerOpen(false);
        setSelectedProofSubmission(null);
      }
      setSubToDelete(null);
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
                Vigência: <strong>{formatGoalPeriod(myGoalStats.goal.period_start, myGoalStats.goal.period_end)}</strong>
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

        {/* Histórico de Entregas (Pessoal ou de Toda a Família) */}
        <Card className="surface-card border-border/70 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" /> Comprovantes & Entregas da Facção
                </CardTitle>
                <CardDescription className="text-xs">
                  {subsScope === "family"
                    ? `Visualizando todas as ${visibleDeliveries.length} entregas registradas e sincronizadas pela família Twin Wheels.`
                    : "Lista das suas entregas pessoais de meta com comprovante e print do F8."}
                </CardDescription>
              </div>

              {/* Controles de Escopo e Filtro */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => setSubsScope("family")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      subsScope === "family"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Ver todas as 19 entregas de todos os membros da família"
                  >
                    Toda a Família ({submissions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubsScope("mine")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      subsScope === "mine"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Ver apenas as minhas entregas pessoais"
                  >
                    Minhas Entregas ({myGoalStats.totalUserSubmissionsCount})
                  </button>
                </div>

                {viewedGoalId !== "todos" && (
                  <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/60">
                    <button
                      type="button"
                      onClick={() => setMySubsGoalFilter("all")}
                      className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        mySubsGoalFilter === "all"
                          ? "bg-primary/80 text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => setMySubsGoalFilter("selected")}
                      className={cn(
                        "px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        mySubsGoalFilter === "selected"
                          ? "bg-primary/80 text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Desta Meta
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Busca Rápida por Membro / Recebedor */}
            <div className="pt-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar entrega por nome do membro, quem recebeu ou observação..."
                  value={subsFamilySearch}
                  onChange={(e) => setSubsFamilySearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-secondary/30"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {visibleDeliveries.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">
                  {subsFamilySearch
                    ? `Nenhuma entrega encontrada para a busca "${subsFamilySearch}".`
                    : subsScope === "mine"
                    ? "Nenhum comprovante de entrega registrado na sua conta até o momento."
                    : "Nenhum comprovante de entrega encontrado para este filtro."}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDeliverModal(myGoalStats.goal.id)}
                  className="text-xs font-bold border-emerald-500/40 text-emerald-400"
                >
                  Enviar Primeiro Comprovante
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/40 max-h-[600px] overflow-y-auto">
                {visibleDeliveries.map((sub) => (
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
                          <span className="font-mono font-extrabold text-sm text-emerald-400">
                            {sub.unit_name === "R$" ? currency(sub.amount) : `${num(sub.amount)} ${sub.unit_name || "itens"}`}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            • {sub.member_nickname || sub.member_name}
                          </span>
                          {sub.member_role && (
                            <Badge className={cn("text-[9px] font-mono py-0 px-1.5", levelBadgeClass(sub.member_role as AppLevel))}>
                              {LEVEL_LABEL[sub.member_role as AppLevel] || sub.member_role}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[9px] font-bold border-primary/30 text-primary">
                            {sub.goal_title || "Meta Semanal"}
                          </Badge>
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

                      {sub.status === "pendente" && (canManage || isMySubmission(sub)) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSubmissionMutation.mutate(sub.id)}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          title="Remover entrega"
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

          {/* Filtros de Meta e Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar membro..."
                value={validationSearch}
                onChange={(e) => setValidationSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/40"
              />
            </div>

            <Select value={validationGoalFilter} onValueChange={setValidationGoalFilter}>
              <SelectTrigger className="h-8 text-xs min-w-[200px] bg-secondary/40 font-semibold border-border">
                <SelectValue placeholder="Todas as Metas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Metas ({submissions.length} entregas)</SelectItem>
                {weeklyGoals.map((g) => {
                  const count = getGoalSubmissionCount(g.id);
                  return (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title} ({count} {count === 1 ? "entrega" : "entregas"})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 bg-secondary/40 p-1 rounded-xl border border-border/60">
              {(["todos", "pendente", "aprovado", "rejeitado"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSubmissionFilter(st)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer flex items-center gap-1",
                    submissionFilter === st
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{st}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1 rounded-full",
                      submissionFilter === st
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {validationStatusCounts[st]}
                  </span>
                </button>
              ))}
            </div>
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
                      onClick={() => handleOpenDeleteSub(sub)}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                      title="Excluir comprovante permanentemente"
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
                  {(item?.member?.nome || item?.member?.nickname || "MB").slice(0, 2).toUpperCase()}
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
                          currentViewGoal?.type || "financeiro",
                          currentViewGoal?.unit_name
                        )}
                      </strong>
                      {item.pendingAmount > 0 && (
                        <span className="text-[10px] text-amber-400 ml-1 font-bold">
                          ({formatGoalValue(item.pendingAmount, currentViewGoal?.type || "financeiro", currentViewGoal?.unit_name)} em análise)
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
                              currentViewGoal?.type || "financeiro",
                              currentViewGoal?.unit_name
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
          <p className="text-xs text-muted-foreground">Gerencie as metas ativas e históricas do grupo.</p>
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
                    <span>Criada por:</span>
                    <strong className="text-primary font-bold">
                      {g.created_by_name || "Liderança Twin Wheels"}
                    </strong>
                  </div>
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
                      {formatGoalPeriod(g.period_start, g.period_end)}
                    </strong>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-between gap-1 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setViewedGoalId(g.id);
                    setActiveTab("minhas_metas");
                  }}
                  className="text-xs h-7 border-border font-bold text-primary gap-1 cursor-pointer"
                >
                  <Eye className="h-3 w-3" /> Ver no Painel
                </Button>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditGoal(g)}
                      className="text-xs h-7 border-border hover:bg-secondary text-foreground gap-1 cursor-pointer font-medium"
                      title="Editar detalhes desta meta"
                    >
                      <Edit3 className="h-3 w-3 text-primary" /> Editar
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateGoalMutation.mutate({
                          id: g.id,
                          updates: { is_active: !g.is_active },
                        })
                      }
                      className={cn(
                        "text-xs h-7 cursor-pointer",
                        g.is_active
                          ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      )}
                      title={g.is_active ? "Desativar meta" : "Ativar meta"}
                    >
                      {g.is_active ? "Desativar" : "Ativar"}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDeleteGoal(g)}
                      className="text-xs h-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Excluir meta permanentemente"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                    </Button>
                  </div>
                )}
              </CardFooter>
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
            ? "Acompanhe o cumprimento das metas do grupo, valide comprovantes com prints e gerencie a arrecadação da família."
            : "Consulte a meta semanal do grupo, acompanhe seu saldo pago/restante e envie seus comprovantes de entrega de meta."
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

      {/* ─── BARRA SELETORA DE METAS & STATUS FIREBASE ─── */}
      <div className="surface-card border border-border/80 rounded-2xl p-4 bg-gradient-to-r from-card via-card/90 to-card shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Período & Meta Selecionada:
                </span>
                {viewedGoalId === "todos" ? (
                  <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-bold py-0.5">
                    📊 Histórico Acumulado (Todas as Metas)
                  </Badge>
                ) : currentViewGoal?.is_active ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold py-0.5">
                    ⭐ Vigente (Semana Atual)
                  </Badge>
                ) : null}
              </div>
              <h3 className="text-base font-extrabold text-foreground mt-0.5">
                {currentViewGoal ? currentViewGoal.title : "Nenhuma meta selecionada"}
              </h3>
              {currentViewGoal?.created_by_name && (
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>Criada por: <strong className="text-foreground">{currentViewGoal.created_by_name}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Seletor Dropdown & Botão de Entrega */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={viewedGoalId}
              onValueChange={(val) => setViewedGoalId(val)}
            >
              <SelectTrigger className="h-9 text-xs min-w-[300px] bg-secondary/50 border-border font-bold">
                <SelectValue placeholder="Selecione a Meta..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  📊 Visão Geral Consolidada ({submissions.length} Entregas Aprovadas)
                </SelectItem>
                <SelectItem value="active">
                  ⭐ Meta Vigente ({activeWeeklyGoal ? `${activeWeeklyGoal.period_start} a ${activeWeeklyGoal.period_end}` : "Atual"}) — {activeWeeklyGoal ? `${getGoalSubmissionCount(activeWeeklyGoal.id)} entregas` : ""}
                </SelectItem>
                {weeklyGoals.map((g) => {
                  const count = getGoalSubmissionCount(g.id);
                  return (
                    <SelectItem key={g.id} value={g.id}>
                      {g.title} ({g.period_start} a {g.period_end}) — {count} {count === 1 ? "entrega" : "entregas"} {g.is_active ? "• Ativa" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {canManage && currentViewGoal && currentViewGoal.id !== "todos" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenEditGoal(currentViewGoal as WeeklyGoal)}
                className="h-9 border-border bg-secondary/40 hover:bg-secondary text-foreground font-bold gap-1.5 cursor-pointer text-xs"
                title="Editar esta meta"
              >
                <Edit3 className="h-3.5 w-3.5 text-primary" /> Editar Meta
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => handleOpenDeliverModal(currentViewGoal?.id)}
              className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 cursor-pointer text-xs"
            >
              <Send className="h-3.5 w-3.5" /> Entregar p/ esta Meta
            </Button>
          </div>
        </div>

        {/* Linha de Metadados e Sincronização */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-border/40 gap-2 text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Criada por: <strong className="text-primary font-bold">{currentViewGoal?.created_by_name || "Liderança Twin Wheels"}</strong>
            </span>
            <span>•</span>
            <span>
              Vigência: <strong className="text-foreground">{formatGoalPeriod(currentViewGoal?.period_start, currentViewGoal?.period_end)}</strong>
            </span>
            <span>•</span>
            <span>
              Alvo: <strong className="text-emerald-400 font-mono">{currentViewGoal ? formatGoalValue(currentViewGoal.target_value, currentViewGoal.type, currentViewGoal.unit_name) : "R$ 0"}</strong> por membro
            </span>
            <span>•</span>
            <span>
              Total de entregas no sistema: <strong className="text-foreground font-mono">{submissions.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[0.7rem] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Banco de Dados Firebase RTDB Ativo</span>
          </div>
        </div>
      </div>

      {/* ─── KPIS & CARDS SUMMARY ─── */}
      {canManage ? (
        /* VISÃO DE GESTÃO / LIDERANÇA */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Meta Semanal Vigente / Selecionada */}
          <Card className="surface-card border-border/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Meta Selecionada
              </span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-foreground truncate">
                {currentViewGoal ? currentViewGoal.title : "Nenhuma Meta Ativa"}
              </h4>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {currentViewGoal
                  ? formatGoalValue(currentViewGoal.target_value, currentViewGoal.type, currentViewGoal.unit_name)
                  : "R$ 0,00"}
                <span className="text-[0.7rem] font-normal text-muted-foreground ml-1">/ membro</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[0.68rem] text-muted-foreground pt-2 mt-2 border-t border-border/40">
              <CalendarDays className="h-3 w-3 text-primary" />
              <span>
                {currentViewGoal
                  ? `${currentViewGoal.period_start} até ${currentViewGoal.period_end}`
                  : "Sem prazo ativo"}
              </span>
            </div>
          </Card>

          {/* Card 2: Arrecadação Aprovada */}
          <Card className="surface-card border-border/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Total Arrecadado (Meta)
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
                {weeklyKpis.totalAllTimeApproved > weeklyKpis.totalCollectedApproved
                  ? `Total acumulado histórico: ${currency(weeklyKpis.totalAllTimeApproved)}`
                  : "Soma de pagamentos confirmados e aprovados"}
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
          {/* Card 1: Meta Vigente / Selecionada */}
          <Card className="surface-card border-border/70 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                Meta Selecionada
              </span>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-foreground truncate">
                {currentViewGoal ? currentViewGoal.title : "Nenhuma Meta Ativa"}
              </h4>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {currentViewGoal
                  ? formatGoalValue(currentViewGoal.target_value, currentViewGoal.type, currentViewGoal.unit_name)
                  : "R$ 0,00"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[0.68rem] text-muted-foreground pt-2 mt-2 border-t border-border/40">
              <CalendarDays className="h-3 w-3 text-primary" />
              <span>
                {currentViewGoal
                  ? `${currentViewGoal.period_start} até ${currentViewGoal.period_end}`
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
                {myGoalStats && myGoalStats.totalAllGoalsDelivered > myGoalStats.approvedAmount
                  ? `Total histórico acumulado: ${currency(myGoalStats.totalAllGoalsDelivered)}`
                  : myGoalStats && myGoalStats.pendingAmount > 0
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
                      <CheckCircle2 className="h-3.5 w-3.5" /> Print Anexado
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={handleReAdjustProof}
                        className="h-7 px-2.5 text-xs font-bold gap-1 bg-secondary text-foreground hover:bg-secondary/80 cursor-pointer"
                      >
                        <Sliders className="h-3 w-3 text-primary" />
                        <span>Ajustar Foto</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          setDeliverProofUrl("");
                          setOriginalProofSrc(null);
                        }}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        Remover
                      </Button>
                    </div>
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
                <Select value={goalType} onValueChange={(v: string) => setGoalType(v as WeeklyGoalType)}>
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
              <Select value={goalScope} onValueChange={(v: string) => setGoalScope(v as GoalTargetScope)}>
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
              className="bg-gradient-brand text-primary-foreground font-bold gap-2 cursor-pointer"
            >
              {createGoalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Meta Semanal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 2.1: EDITAR META SEMANAL (GESTÃO)                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={editGoalModalOpen} onOpenChange={setEditGoalModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-foreground">
              <Edit3 className="h-5 w-5 text-primary" /> Editar Meta Semanal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atualize as configurações, valores, prazo de vigência ou status desta meta semanal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Título da Meta */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Título da Meta</Label>
              <Input
                placeholder="Ex: Meta Semanal - Farm & Dinheiro Sujo"
                value={editGoalTitle}
                onChange={(e) => setEditGoalTitle(e.target.value)}
                className="text-xs bg-secondary/40 font-semibold"
              />
            </div>

            {/* Tipo de Meta e Valor Alvo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Tipo de Meta</Label>
                <Select
                  value={editGoalType}
                  onValueChange={(v: string) => {
                    const t = v as WeeklyGoalType;
                    setEditGoalType(t);
                    if (t === "financeiro") setEditGoalUnitName("R$");
                    else if (editGoalUnitName === "R$") setEditGoalUnitName("itens");
                  }}
                >
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
                  {editGoalType === "financeiro" ? "Valor Alvo (R$)" : "Quantidade Alvo"}
                </Label>
                <Input
                  placeholder={editGoalType === "financeiro" ? "R$ 50.000" : "Ex: 500"}
                  value={editGoalTargetValue}
                  onChange={(e) =>
                    setEditGoalTargetValue(
                      editGoalType === "financeiro" ? formatCurrencyInput(e.target.value) : e.target.value
                    )
                  }
                  className="font-mono font-bold text-emerald-400 bg-secondary/40 text-xs"
                />
              </div>
            </div>

            {/* Unidade de medida para metas não-financeiras */}
            {editGoalType !== "financeiro" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Unidade de Medida</Label>
                <Input
                  placeholder="Ex: itens, kits, peças, gramas, caixas"
                  value={editGoalUnitName}
                  onChange={(e) => setEditGoalUnitName(e.target.value)}
                  className="text-xs bg-secondary/40"
                />
              </div>
            )}

            {/* Escopo da Meta */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Para Quem é a Meta?</Label>
              <Select value={editGoalScope} onValueChange={(v: string) => setEditGoalScope(v as GoalTargetScope)}>
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

            {editGoalScope === "cargo" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Selecione o Cargo Alvo</Label>
                <Select value={editGoalTargetRole} onValueChange={(v: AppLevel) => setEditGoalTargetRole(v)}>
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

            {editGoalScope === "membro" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Selecione o Membro</Label>
                <Select value={editGoalTargetUserId} onValueChange={setEditGoalTargetUserId}>
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
                  onClick={setEditThisWeekPreset}
                  className="text-[0.68rem] text-primary hover:underline font-bold cursor-pointer"
                >
                  ⚡ Esta Semana (Seg a Dom)
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">Início:</span>
                  <Input
                    type="date"
                    value={editGoalStart}
                    onChange={(e) => setEditGoalStart(e.target.value)}
                    className="text-xs bg-secondary/40 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block mb-1">Término:</span>
                  <Input
                    type="date"
                    value={editGoalEnd}
                    onChange={(e) => setEditGoalEnd(e.target.value)}
                    className="text-xs bg-secondary/40 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Status Ativo da Meta */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/60">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground">Status da Meta</Label>
                <p className="text-[0.7rem] text-muted-foreground">
                  {editGoalIsActive
                    ? "Meta ativa e disponível para entrega no painel."
                    : "Meta encerrada / inativa (apenas consulta)."}
                </p>
              </div>
              <Switch
                checked={editGoalIsActive}
                onCheckedChange={setEditGoalIsActive}
              />
            </div>

            {/* Descrição e Instruções */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Instruções / Regras da Entrega</Label>
              <Textarea
                placeholder="Ex: Entregar até domingo às 23:59 para qualquer 01 ou Gerente em serviço com print do F8."
                value={editGoalDesc}
                onChange={(e) => setEditGoalDesc(e.target.value)}
                className="text-xs bg-secondary/40"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditGoalModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={updateGoalMutation.isPending}
              onClick={handleSaveEditGoal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 cursor-pointer"
            >
              {updateGoalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 2.2: CONFIRMAÇÃO DE EXCLUSÃO DE META (GESTÃO)             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={deleteGoalConfirmOpen} onOpenChange={setDeleteGoalConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-destructive">
              <AlertTriangle className="h-5 w-5" /> Excluir Meta Semanal
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir permanentemente a meta{" "}
              <strong className="text-foreground">"{goalToDelete?.title}"</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1.5">
            <p className="font-bold">⚠️ Atenção:</p>
            <p>
              Esta ação removerá a meta das listas do sistema e do Firebase. Os comprovantes de entrega
              já enviados pelos membros permanecerão guardados no histórico da família.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteGoalConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteGoalMutation.isPending}
              onClick={handleConfirmDeleteGoal}
              className="font-bold gap-2 cursor-pointer"
            >
              {deleteGoalMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 2.3: CONFIRMAÇÃO DE EXCLUSÃO DE COMPROVANTE              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={deleteSubConfirmOpen} onOpenChange={setDeleteSubConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-destructive">
              <Trash2 className="h-5 w-5" /> Excluir Comprovante de Entrega
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja realmente apagar o lançamento de entrega de{" "}
              <strong className="text-foreground">{subToDelete?.member_name}</strong> no valor de{" "}
              <strong className="text-emerald-400 font-mono">
                {subToDelete ? formatGoalValue(subToDelete.amount, "financeiro", subToDelete.unit_name) : ""}
              </strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 space-y-1">
            <p className="font-bold">Informação:</p>
            <p>
              O valor ou quantidade desta entrega será removido dos saldos e do cálculo de cumprimento da meta semanal do integrante.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteSubConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteSubmissionMutation.isPending}
              onClick={handleConfirmDeleteSub}
              className="font-bold gap-2 cursor-pointer"
            >
              {deleteSubmissionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir Comprovante
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

      {/* ESTÚDIO PRO DE AJUSTE DE COMPROVANTE */}
      {proofAdjusterOpen && pendingProofSrc && (
        <UniversalImageAdjusterModal
          isOpen={proofAdjusterOpen}
          imageSrc={pendingProofSrc}
          title="Estúdio Pro — Ajuste e Enquadramento do Comprovante"
          description="Ajuste o zoom no valor/F8, corte as bordas, ajuste o brilho/contraste para melhor leitura da liderança."
          aspectRatioPreset="auto"
          onClose={() => {
            setProofAdjusterOpen(false);
            setPendingProofSrc(null);
          }}
          onSave={handleSaveAdjustedProof}
        />
      )}
    </div>
  );
}
