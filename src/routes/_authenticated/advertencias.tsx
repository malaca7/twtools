import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  Plus,
  Search,
  Filter,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Undo2,
  Trash2,
  Edit2,
  User,
  Lock,
  Eye,
  Info,
  Layers,
  Radio,
  Sparkles,
  RefreshCw,
  Tag,
  AlertOctagon,
  Shield,
  HelpCircle,
  Download,
  Copy,
  FileSpreadsheet,
  FileText,
  Check,
  ArrowLeft,
  FileSignature,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { useMemberTags } from "@/hooks/useMemberTags";
import {
  useWarnings,
  useCreateWarningMutation,
  useUpdateWarningMutation,
  useRevokeWarningMutation,
  useDeleteWarningMutation,
  useAcknowledgeWarningMutation,
} from "@/hooks/useWarnings";
import {
  type MemberWarning,
  type WarningType,
  type WarningSeverity,
  type SuspensionType,
  type WarningStatus,
  type CreateWarningPayload,
  WARNING_REASON_PRESETS,
} from "@/types/warnings";
import { getProxiedImageUrl } from "@/services/postimagesService";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/advertencias")({
  component: AdvertenciasPage,
});

export function AdvertenciasPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Prontuário Disciplinar & Advertências"
          description="Carregando informações disciplinares..."
        />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return <AdvertenciasContent />;
}

function AdvertenciasContent() {
  const { hasPermission, isDevUser, isCeoUser, user, profile } = useAuth();

  // Queries
  const { data: warnings = [], isLoading, refetch, isRefetching } = useWarnings();
  const { data: members = [] } = useMembers();
  const { data: tags = [] } = useMemberTags();

  // Mutations
  const createMutation = useCreateWarningMutation();
  const updateMutation = useUpdateWarningMutation();
  const revokeMutation = useRevokeWarningMutation();
  const deleteMutation = useDeleteWarningMutation();
  const acknowledgeMutation = useAcknowledgeWarningMutation();

  // Permissões granulares
  const canViewGlobal = useMemo(() => {
    if (isDevUser) return true;
    return Boolean(
      hasPermission("view_all_warnings") ||
      hasPermission("view_warnings") ||
      hasPermission("manage_warnings") ||
      hasPermission("view_ceo_warnings") ||
      hasPermission("view_dev_warnings") ||
      hasPermission("manage_ceo_warnings") ||
      hasPermission("manage_dev_warnings")
    );
  }, [hasPermission, isDevUser]);

  const canCreateWarning =
    hasPermission("create_warning") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings") ||
    isDevUser;

  const canCreateSuspension =
    hasPermission("create_suspension") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings") ||
    isDevUser;

  const canCreate = canCreateWarning || canCreateSuspension;

  const canEdit =
    hasPermission("edit_warning") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings") ||
    isDevUser;

  const canRevoke =
    hasPermission("revoke_warning") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings") ||
    isDevUser;

  const canDelete =
    hasPermission("delete_warning") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings") ||
    isDevUser;

  const canViewDetails = true;

  const canExport =
    hasPermission("export_warnings") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings") ||
    isDevUser;

  // Aba principal ("gestao" para admins/líderes, "prontuario" para histórico pessoal)
  const [mainTab, setMainTab] = useState<"gestao" | "prontuario">("gestao");

  // Se o usuário não tiver permissão global, fixa em seu prontuário
  const currentTab = canViewGlobal ? mainTab : "prontuario";

  // Identificadores do membro atual
  const currentUserId = user?.id ? String(user.id).trim().toLowerCase() : "";
  const currentProfileId = profile?.id ? String(profile.id).trim().toLowerCase() : "";
  const currentProfileUserId = profile?.user_id ? String(profile.user_id).trim().toLowerCase() : "";
  const currentGameId = profile?.game_id ? String(profile.game_id).trim().toLowerCase() : "";
  const currentDiscordId = profile?.discord_id ? String(profile.discord_id).trim().toLowerCase() : "";

  // Prontuário pessoal do usuário logado
  const myWarnings = useMemo(() => {
    if (!currentUserId && !currentProfileId && !currentProfileUserId && !currentGameId && !currentDiscordId) {
      return [];
    }

    return warnings.filter((w) => {
      const warnMemberId = w.member_id ? String(w.member_id).trim().toLowerCase() : "";
      const warnGameId = w.member_game_id ? String(w.member_game_id).trim().toLowerCase() : "";
      return Boolean(
        (currentUserId && warnMemberId === currentUserId) ||
        (currentProfileId && warnMemberId === currentProfileId) ||
        (currentProfileUserId && warnMemberId === currentProfileUserId) ||
        (currentGameId && (warnMemberId === currentGameId || warnGameId === currentGameId))
      );
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [warnings, currentUserId, currentProfileId, currentProfileUserId, currentGameId, currentDiscordId]);

  // Advertências ativas pendentes de ciência
  const pendingScienceWarnings = useMemo(() => {
    return myWarnings.filter((w) => w.status === "ativo" && !w.acknowledged_at);
  }, [myWarnings]);

  // Suspensão pessoal ativa
  const myActiveSuspension = useMemo(() => {
    const now = new Date().toISOString();
    return myWarnings.find((w) => {
      if (w.status !== "ativo") return false;
      if (!w.is_suspension && w.type !== "suspensao") return false;
      if (w.ends_at && w.ends_at <= now) return false;
      return true;
    });
  }, [myWarnings]);

  // Estados de Filtros e Busca (Gestão Global)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [severityFilter, setSeverityFilter] = useState<string>("todos");

  // Estados de Filtros e Busca (Meu Prontuário)
  const [mySearchTerm, setMySearchTerm] = useState("");
  const [myStatusFilter, setMyStatusFilter] = useState<string>("todos");

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWarning, setEditingWarning] = useState<MemberWarning | null>(null);
  const [revokingWarning, setRevokingWarning] = useState<MemberWarning | null>(null);
  const [revocationReasonInput, setRevocationReasonInput] = useState("");
  const [deletingWarningId, setDeletingWarningId] = useState<string | null>(null);
  const [viewingWarning, setViewingWarning] = useState<MemberWarning | null>(null);

  // Formulário de Criação
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [newType, setNewType] = useState<WarningType>("advertencia");
  const [newSeverity, setNewSeverity] = useState<WarningSeverity>("media");
  const [selectedPreset, setSelectedPreset] = useState<string>(WARNING_REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [suspensionType, setSuspensionType] = useState<SuspensionType>("temporaria");
  const [durationDays, setDurationDays] = useState<number>(3);
  const [durationHours, setDurationHours] = useState<number>(0);
  const [appliedTagId, setAppliedTagId] = useState<string>("none");

  // Bloqueios Funcionais Criação
  const [blockAllOperations, setBlockAllOperations] = useState(true);
  const [blockLogin, setBlockLogin] = useState(false);
  const [blockSales, setBlockSales] = useState(false);
  const [blockMovements, setBlockMovements] = useState(false);
  const [blockProductions, setBlockProductions] = useState(false);
  const [blockCashFund, setBlockCashFund] = useState(false);

  // Formulário de Edição
  const [editSeverity, setEditSeverity] = useState<WarningSeverity>("media");
  const [editPreset, setEditPreset] = useState<string>(WARNING_REASON_PRESETS[0]);
  const [editCustomReason, setEditCustomReason] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSuspensionType, setEditSuspensionType] = useState<SuspensionType>("temporaria");
  const [editDurationDays, setEditDurationDays] = useState<number>(3);
  const [editDurationHours, setEditDurationHours] = useState<number>(0);
  const [editAppliedTagId, setEditAppliedTagId] = useState<string>("none");

  // Bloqueios Funcionais Edição
  const [editBlockAllOperations, setEditBlockAllOperations] = useState(true);
  const [editBlockLogin, setEditBlockLogin] = useState(false);
  const [editBlockSales, setEditBlockSales] = useState(false);
  const [editBlockMovements, setEditBlockMovements] = useState(false);
  const [editBlockProductions, setEditBlockProductions] = useState(false);
  const [editBlockCashFund, setEditBlockCashFund] = useState(false);

  // Estatísticas Globais
  const globalStats = useMemo(() => {
    const total = warnings.length;
    const activeSuspensions = warnings.filter(
      (w) => w.status === "ativo" && (w.is_suspension || w.type === "suspensao")
    ).length;
    const activeWarnings = warnings.filter(
      (w) => w.status === "ativo" && !w.is_suspension && w.type === "advertencia"
    ).length;
    const revoked = warnings.filter((w) => w.status === "revogado").length;
    return { total, activeSuspensions, activeWarnings, revoked };
  }, [warnings]);

  // Estatísticas Pessoais (Meu Prontuário)
  const myStats = useMemo(() => {
    const total = myWarnings.length;
    const activeSuspensions = myWarnings.filter(
      (w) => w.status === "ativo" && (w.is_suspension || w.type === "suspensao")
    ).length;
    const activeWarnings = myWarnings.filter(
      (w) => w.status === "ativo" && !w.is_suspension && w.type === "advertencia"
    ).length;
    const expiredOrRevoked = myWarnings.filter(
      (w) => w.status === "expirado" || w.status === "revogado"
    ).length;
    const pendingScience = pendingScienceWarnings.length;
    return { total, activeSuspensions, activeWarnings, expiredOrRevoked, pendingScience };
  }, [myWarnings, pendingScienceWarnings]);

  // Lista Filtrada Global
  const filteredGlobalWarnings = useMemo(() => {
    return warnings.filter((w) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const memberMatch =
          w.member_name.toLowerCase().includes(query) ||
          (w.member_nickname && w.member_nickname.toLowerCase().includes(query)) ||
          (w.member_game_id && w.member_game_id.toLowerCase().includes(query));
        const reasonMatch = w.reason.toLowerCase().includes(query);
        const adminMatch = w.admin_name.toLowerCase().includes(query);
        const descMatch = w.description.toLowerCase().includes(query);
        if (!memberMatch && !reasonMatch && !adminMatch && !descMatch) {
          return false;
        }
      }

      if (statusFilter !== "todos" && w.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== "todos" && w.type !== typeFilter) {
        return false;
      }

      if (severityFilter !== "todos" && w.severity !== severityFilter) {
        return false;
      }

      return true;
    });
  }, [warnings, searchTerm, statusFilter, typeFilter, severityFilter]);

  // Lista Filtrada Pessoal (Meu Prontuário)
  const filteredMyWarnings = useMemo(() => {
    return myWarnings.filter((w) => {
      if (mySearchTerm.trim()) {
        const query = mySearchTerm.toLowerCase();
        const reasonMatch = w.reason.toLowerCase().includes(query);
        const adminMatch = w.admin_name.toLowerCase().includes(query);
        const descMatch = w.description.toLowerCase().includes(query);
        if (!reasonMatch && !adminMatch && !descMatch) {
          return false;
        }
      }

      if (myStatusFilter !== "todos" && w.status !== myStatusFilter) {
        return false;
      }

      return true;
    });
  }, [myWarnings, mySearchTerm, myStatusFilter]);

  // Reset do Formulário de Criação
  const resetCreateForm = () => {
    setSelectedMemberId("");
    setNewType("advertencia");
    setNewSeverity("media");
    setSelectedPreset(WARNING_REASON_PRESETS[0]);
    setCustomReason("");
    setNewDescription("");
    setSuspensionType("temporaria");
    setDurationDays(3);
    setDurationHours(0);
    setAppliedTagId("none");
    setBlockAllOperations(false);
    setBlockLogin(false);
    setBlockSales(false);
    setBlockMovements(false);
    setBlockProductions(false);
    setBlockCashFund(false);
  };

  const handleOpenCreateModal = () => {
    resetCreateForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (warn: MemberWarning) => {
    setEditingWarning(warn);
    setEditSeverity(warn.severity || "media");
    if (WARNING_REASON_PRESETS.includes(warn.reason as any)) {
      setEditPreset(warn.reason);
      setEditCustomReason("");
    } else {
      setEditPreset(WARNING_REASON_PRESETS[WARNING_REASON_PRESETS.length - 1]);
      setEditCustomReason(warn.reason || "");
    }
    setEditDescription(warn.description || "");
    setEditSuspensionType(warn.suspension_type || "temporaria");
    setEditDurationDays(warn.duration_days ?? (warn.type === "suspensao" ? 3 : 7));
    setEditDurationHours(warn.duration_hours ?? 0);
    setEditAppliedTagId(warn.applied_tag_id || "none");

    setEditBlockAllOperations(Boolean(warn.blocks?.block_all_operations));
    setEditBlockLogin(Boolean(warn.blocks?.block_login));
    setEditBlockSales(Boolean(warn.blocks?.block_sales));
    setEditBlockMovements(Boolean(warn.blocks?.block_movements));
    setEditBlockProductions(Boolean(warn.blocks?.block_productions));
    setEditBlockCashFund(Boolean(warn.blocks?.block_cash_fund));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    const targetMember = members.find((m) => m.id === selectedMemberId || m.user_id === selectedMemberId);
    const memberName = targetMember?.nome || "Membro";
    const memberNickname = targetMember?.nickname || null;
    const memberAvatar = targetMember?.avatar_url || null;
    const memberGameId = targetMember?.game_id || null;
    const memberLevel = targetMember?.role || targetMember?.level || "Membro";

    const isSusp = newType === "suspensao";
    const finalReason = selectedPreset.includes("Outro") && customReason.trim()
      ? customReason.trim()
      : selectedPreset;

    const hasAnyBlock =
      blockAllOperations ||
      blockLogin ||
      blockSales ||
      blockMovements ||
      blockProductions ||
      blockCashFund;

    const payload: CreateWarningPayload = {
      member_id: targetMember?.user_id || targetMember?.id || selectedMemberId,
      member_name: memberName,
      member_nickname: memberNickname,
      member_avatar: memberAvatar,
      member_game_id: memberGameId,
      member_level: memberLevel,

      admin_id: user?.id || "admin",
      admin_name: profile?.nome || profile?.nickname || user?.email || "Administrador",
      admin_nickname: profile?.nickname || null,
      admin_avatar: profile?.avatar_url || null,

      type: newType,
      severity: newSeverity,
      reason: finalReason,
      description: newDescription.trim(),

      starts_at: new Date().toISOString(),
      duration_days: durationDays > 0 ? durationDays : null,
      duration_hours: durationHours > 0 ? durationHours : null,

      is_suspension: isSusp,
      suspension_type: isSusp ? suspensionType : null,
      blocks: hasAnyBlock
        ? {
            block_all_operations: blockAllOperations,
            block_login: blockLogin,
            block_sales: blockSales,
            block_movements: blockMovements,
            block_productions: blockProductions,
            block_cash_fund: blockCashFund,
          }
        : undefined,

      applied_tag_id: appliedTagId !== "none" ? appliedTagId : null,
    };

    await createMutation.mutateAsync(payload);
    setIsCreateModalOpen(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarning) return;

    const isSusp = editingWarning.is_suspension || editingWarning.type === "suspensao";
    const finalReason = editPreset.includes("Outro") && editCustomReason.trim()
      ? editCustomReason.trim()
      : editPreset;

    const hasAnyEditBlock =
      editBlockAllOperations ||
      editBlockLogin ||
      editBlockSales ||
      editBlockMovements ||
      editBlockProductions ||
      editBlockCashFund;

    await updateMutation.mutateAsync({
      id: editingWarning.id,
      payload: {
        severity: editSeverity,
        reason: finalReason,
        description: editDescription.trim(),
        duration_days: editDurationDays > 0 ? editDurationDays : null,
        duration_hours: editDurationHours > 0 ? editDurationHours : null,
        suspension_type: isSusp ? editSuspensionType : null,
        blocks: hasAnyEditBlock
          ? {
              block_all_operations: editBlockAllOperations,
              block_login: editBlockLogin,
              block_sales: editBlockSales,
              block_movements: editBlockMovements,
              block_productions: editBlockProductions,
              block_cash_fund: editBlockCashFund,
            }
          : undefined,
        applied_tag_id: editAppliedTagId !== "none" ? editAppliedTagId : null,
      },
    });

    setEditingWarning(null);
  };

  const handleRevokeSubmit = async () => {
    if (!revokingWarning) return;
    await revokeMutation.mutateAsync({
      id: revokingWarning.id,
      reason: revocationReasonInput.trim(),
    });
    setRevokingWarning(null);
    setRevocationReasonInput("");
  };

  const handleDeleteSubmit = async () => {
    if (!deletingWarningId) return;
    await deleteMutation.mutateAsync(deletingWarningId);
    setDeletingWarningId(null);
  };

  const handleAcknowledgeWarning = async (warnId: string) => {
    await acknowledgeMutation.mutateAsync(warnId);
  };

  // Exportar Relatório CSV
  const handleExportCsv = () => {
    if (filteredGlobalWarnings.length === 0) {
      toast.warning("Nenhum registro para exportar.");
      return;
    }
    const headers = [
      "ID",
      "Data Início",
      "Data Término",
      "Status",
      "Tipo",
      "Gravidade",
      "Membro",
      "Nickname",
      "Game ID",
      "Cargo",
      "Motivo",
      "Descrição",
      "Aplicado Por",
      "Ciente",
      "Revogado Por",
      "Justificativa Revogação",
    ];
    const rows = filteredGlobalWarnings.map((w) => [
      w.id,
      new Date(w.starts_at).toLocaleString("pt-BR"),
      w.ends_at ? new Date(w.ends_at).toLocaleString("pt-BR") : "Permanente",
      w.status,
      w.type,
      w.severity,
      w.member_name,
      w.member_nickname || "",
      w.member_game_id || "",
      w.member_level || "",
      `"${(w.reason || "").replace(/"/g, '""')}"`,
      `"${(w.description || "").replace(/"/g, '""')}"`,
      w.admin_name,
      w.acknowledged_at ? new Date(w.acknowledged_at).toLocaleString("pt-BR") : "Não",
      w.revoked_by_name || "",
      w.revocation_reason ? `"${w.revocation_reason.replace(/"/g, '""')}"` : "",
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `advertencias_tw_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Relatório CSV exportado com sucesso!");
  };

  // Copiar Relatório Formatado
  const handleCopyReport = () => {
    if (filteredGlobalWarnings.length === 0) {
      toast.warning("Nenhum registro para copiar.");
      return;
    }
    const text = filteredGlobalWarnings
      .map((w, idx) => {
        return `${idx + 1}. [${w.type.toUpperCase()}] ${w.member_name} (${w.member_level || "Membro"}) - ${w.reason}\nGravidade: ${w.severity.toUpperCase()} | Status: ${w.status.toUpperCase()} | Aplicado por: ${w.admin_name} em ${new Date(w.starts_at).toLocaleDateString("pt-BR")}\nDescrição: ${w.description}\n`;
      })
      .join("\n--------------------------\n\n");

    navigator.clipboard.writeText(text);
    toast.success("Relatório copiado para a área de transferência!");
  };

  const getSeverityBadge = (sev: WarningSeverity) => {
    switch (sev) {
      case "critica":
        return <Badge variant="destructive" className="font-bold text-[10px] uppercase bg-rose-600">Crítica</Badge>;
      case "grave":
        return <Badge variant="outline" className="font-bold text-[10px] uppercase border-rose-500/50 text-rose-400 bg-rose-500/10">Grave</Badge>;
      case "media":
        return <Badge variant="outline" className="font-bold text-[10px] uppercase border-amber-500/50 text-amber-400 bg-amber-500/10">Média</Badge>;
      case "leve":
      default:
        return <Badge variant="outline" className="font-bold text-[10px] uppercase border-sky-500/50 text-sky-400 bg-sky-500/10">Leve</Badge>;
    }
  };

  const getStatusBadge = (status: WarningStatus) => {
    switch (status) {
      case "ativo":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ativo
          </span>
        );
      case "expirado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
            Expirado
          </span>
        );
      case "revogado":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            Revogado / Anistiado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-inner">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex flex-wrap items-center gap-2">
                Prontuário Disciplinar & Advertências
                {canViewGlobal && (
                  <Badge variant="outline" className="text-[10px] font-bold border-rose-500/40 text-rose-300 bg-rose-500/10 py-0.5">
                    Liderança & Gestão
                  </Badge>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                {canViewGlobal
                  ? "Painel disciplinar para aplicação de advertências, controle de suspensões e acompanhamento de prontuários individuais."
                  : "Seu prontuário individual, histórico de ocorrências, restrições ativas e confirmação de ciência."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-secondary/60 cursor-pointer"
            title="Sincronizar lista agora"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          {canExport && currentTab === "gestao" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-secondary/60 cursor-pointer"
                  title="Exportar dados do painel disciplinar"
                >
                  <Download className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Exportação de Dados</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportCsv} className="text-xs gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Exportar Planilha (CSV)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyReport} className="text-xs gap-2 cursor-pointer">
                  <Copy className="h-3.5 w-3.5 text-sky-400" />
                  <span>Copiar Relatório Texto</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {canCreate && currentTab === "gestao" && (
            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="h-9 gap-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Penalidade</span>
            </Button>
          )}
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO PARA QUEM TEM PERMISSÃO GLOBAL */}
      {canViewGlobal && (
        <div className="flex items-center gap-2 p-1 rounded-xl bg-secondary/40 border border-border/60 w-fit">
          <button
            type="button"
            onClick={() => setMainTab("gestao")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              mainTab === "gestao"
                ? "bg-background text-foreground shadow-sm border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>📋 Gestão de Penalidades (Geral)</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
              {globalStats.total}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("prontuario")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              mainTab === "prontuario"
                ? "bg-background text-foreground shadow-sm border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-4 w-4 text-primary" />
            <span>🛡️ Meu Prontuário Disciplinar</span>
            {pendingScienceWarnings.length > 0 ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-bold bg-amber-600 animate-pulse">
                {pendingScienceWarnings.length} pendente(s)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                {myWarnings.length}
              </Badge>
            )}
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODO 1: MEU PRONTUÁRIO DISCIPLINAR (PESSOAL)             */}
      {/* ========================================================= */}
      {currentTab === "prontuario" && (
        <div className="space-y-5">
          {/* BANNER DO MEMBRO */}
          <Card className="surface-card border-border/80 p-4 sm:p-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Avatar className="h-14 w-14 border-2 border-primary/40 shadow-md">
                  <AvatarImage src={getProxiedImageUrl(profile?.avatar_url || user?.user_metadata?.avatar_url || "") || undefined} />
                  <AvatarFallback className="font-bold text-base bg-primary/20 text-primary">
                    {(profile?.nome || user?.email || "EU").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      {profile?.nickname || profile?.nome || user?.email}
                    </h2>
                    {profile?.game_id && (
                      <Badge variant="outline" className="font-mono text-[10px] py-0">
                        ID: {profile.game_id}
                      </Badge>
                    )}
                    {profile?.cargo && (
                      <Badge variant="secondary" className="text-[10px] py-0 font-semibold">
                        {profile.cargo}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Histórico funcional disciplinar individual e acompanhamento de registros operacionais.
                  </p>
                </div>
              </div>

              <div>
                {myActiveSuspension ? (
                  <Badge variant="destructive" className="px-3 py-1.5 text-xs font-bold gap-1.5 bg-rose-600 animate-pulse">
                    <Ban className="h-3.5 w-3.5" /> Suspensão Ativa
                  </Badge>
                ) : myStats.activeWarnings > 0 ? (
                  <Badge variant="outline" className="px-3 py-1.5 text-xs font-bold gap-1.5 border-amber-500/50 text-amber-400 bg-amber-500/10">
                    <AlertTriangle className="h-3.5 w-3.5" /> Sob Advertência Ativa ({myStats.activeWarnings})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="px-3 py-1.5 text-xs font-bold gap-1.5 border-emerald-500/50 text-emerald-400 bg-emerald-500/10">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Prontuário Regular
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* ALERTA DE CIÊNCIA PENDENTE */}
          {pendingScienceWarnings.length > 0 && (
            <Card className="border-amber-500/60 bg-amber-500/[0.08] p-4 sm:p-5 shadow-lg shadow-amber-950/20 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5">
                    <AlertOctagon className="h-6 w-6 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-amber-200">
                      Confirmação de Leitura & Ciência Obrigatória ({pendingScienceWarnings.length} pendente{pendingScienceWarnings.length > 1 ? "s" : ""})
                    </h3>
                    <p className="text-xs text-amber-300/80 leading-relaxed">
                      Você possui penalidade(s) disciplinar(es) ativa(s) que requerem sua confirmação expressa de leitura. Clique no botão de confirmação em cada registro abaixo para registrar sua ciência aos termos.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  <Button
                    size="sm"
                    onClick={async () => {
                      for (const pw of pendingScienceWarnings) {
                        await acknowledgeMutation.mutateAsync(pw.id);
                      }
                    }}
                    disabled={acknowledgeMutation.isPending}
                    className="w-full md:w-auto text-xs font-bold bg-amber-500 hover:bg-amber-600 text-amber-950 gap-1.5 shadow-md cursor-pointer"
                  >
                    <FileSignature className="h-4 w-4" />
                    <span>Confirmar Ciência de Todas ({pendingScienceWarnings.length})</span>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* RESTRIÇÕES ATIVAS SE HOUVER SUSPENSÃO */}
          {myActiveSuspension?.blocks && Object.values(myActiveSuspension.blocks).some(Boolean) && (
            <Card className="border-rose-500/40 bg-rose-950/15 p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                <Lock className="h-4 w-4 text-rose-400" />
                <span>Restrições Operacionais em Vigor para sua Conta:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {myActiveSuspension.blocks.block_all_operations && (
                  <Badge variant="destructive" className="text-[10px] uppercase font-bold bg-rose-600">
                    Bloqueio Total Operacional
                  </Badge>
                )}
                {myActiveSuspension.blocks.block_login && (
                  <Badge variant="destructive" className="text-[10px] uppercase font-bold bg-rose-700">
                    Acesso à Plataforma Bloqueado
                  </Badge>
                )}
                {myActiveSuspension.blocks.block_sales && (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-amber-500/60 text-amber-300 bg-amber-500/10">
                    Vendas Bloqueadas
                  </Badge>
                )}
                {myActiveSuspension.blocks.block_movements && (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-amber-500/60 text-amber-300 bg-amber-500/10">
                    Baú Bloqueado
                  </Badge>
                )}
                {myActiveSuspension.blocks.block_productions && (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-amber-500/60 text-amber-300 bg-amber-500/10">
                    Produção Bloqueada
                  </Badge>
                )}
                {myActiveSuspension.blocks.block_cash_fund && (
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-amber-500/60 text-amber-300 bg-amber-500/10">
                    Fundo de Caixa Bloqueado
                  </Badge>
                )}
              </div>
            </Card>
          )}

          {/* KPIS PESSOAIS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="surface-card border-border/70 p-3.5">
              <span className="text-[11px] font-medium text-muted-foreground block">Total de Ocorrências</span>
              <div className="mt-1 text-2xl font-black font-mono text-foreground">{myStats.total}</div>
              <span className="text-[10px] text-muted-foreground">Histórico acumulado</span>
            </Card>

            <Card className="surface-card border-rose-500/30 bg-rose-950/10 p-3.5">
              <span className="text-[11px] font-medium text-rose-300 block">Suspensões Ativas</span>
              <div className="mt-1 text-2xl font-black font-mono text-rose-400">{myStats.activeSuspensions}</div>
              <span className="text-[10px] text-rose-300/80">Com bloqueio temporário</span>
            </Card>

            <Card className="surface-card border-amber-500/30 bg-amber-950/10 p-3.5">
              <span className="text-[11px] font-medium text-amber-300 block">Advertências Ativas</span>
              <div className="mt-1 text-2xl font-black font-mono text-amber-400">{myStats.activeWarnings}</div>
              <span className="text-[10px] text-amber-300/80">Registros em observação</span>
            </Card>

            <Card className="surface-card border-emerald-500/30 bg-emerald-950/10 p-3.5">
              <span className="text-[11px] font-medium text-emerald-300 block">Cumpridas / Anistiadas</span>
              <div className="mt-1 text-2xl font-black font-mono text-emerald-400">{myStats.expiredOrRevoked}</div>
              <span className="text-[10px] text-emerald-300/80">Penalidades arquivadas</span>
            </Card>
          </div>

          {/* FILTROS PESSOAIS */}
          <Card className="surface-card border-border/80 p-3">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar em minhas penalidades por motivo ou autor..."
                  value={mySearchTerm}
                  onChange={(e) => setMySearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <Select value={myStatusFilter} onValueChange={setMyStatusFilter}>
                <SelectTrigger className="h-8 text-xs w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="ativo">Apenas Ativos</SelectItem>
                  <SelectItem value="expirado">Expirados</SelectItem>
                  <SelectItem value="revogado">Revogados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* LISTAGEM PESSOAL */}
          {isLoading ? (
            <TableSkeleton rows={4} />
          ) : filteredMyWarnings.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-10 w-10 text-emerald-400" />}
              title="Nenhuma ocorrência disciplinar encontrada"
              description={
                mySearchTerm || myStatusFilter !== "todos"
                  ? "Nenhum registro corresponde aos filtros selecionados."
                  : "Seu prontuário individual está limpo e você não possui registros de advertência ou suspensão ativos!"
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredMyWarnings.map((warn) => {
                const isSusp = warn.is_suspension || warn.type === "suspensao";
                const isTerminated = warn.status === "expirado" || warn.status === "revogado";
                const isPendingMyScience = warn.status === "ativo" && !warn.acknowledged_at;

                return (
                  <Card
                    key={warn.id}
                    className={cn(
                      "surface-card border transition-all hover:border-border/90 p-4",
                      isPendingMyScience && "border-amber-500/60 bg-amber-950/10 ring-1 ring-amber-500/30",
                      warn.status === "ativo" && !isPendingMyScience && isSusp && "border-rose-500/40 bg-rose-950/5",
                      warn.status === "ativo" && !isPendingMyScience && !isSusp && "border-amber-500/40 bg-amber-950/5",
                      isTerminated && "opacity-75"
                    )}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={isSusp ? "destructive" : "outline"}
                            className={cn(
                              "font-bold text-[10px] uppercase",
                              !isSusp && "border-amber-500/50 text-amber-400 bg-amber-500/10"
                            )}
                          >
                            {isSusp
                              ? warn.suspension_type === "permanente"
                                ? "🚫 Suspensão Permanente"
                                : "🚫 Suspensão Temporária"
                              : "⚠️ Advertência"}
                          </Badge>

                          {getSeverityBadge(warn.severity)}
                          {getStatusBadge(warn.status)}

                          {warn.applied_tag_id && (
                            <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary border border-primary/30 flex items-center gap-1">
                              <Tag className="h-2.5 w-2.5" />
                              Tag: {tags.find((t) => t.id === warn.applied_tag_id)?.name || warn.applied_tag_id}
                            </Badge>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            {warn.reason}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                            {warn.description}
                          </p>
                        </div>

                        {/* DATAS E CIÊNCIA */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Aplicado em: {new Date(warn.starts_at).toLocaleDateString("pt-BR")}
                          </span>

                          {warn.ends_at ? (
                            <span className="flex items-center gap-1 font-mono text-foreground/80">
                              <Clock className="h-3 w-3 text-primary" />
                              Término: {new Date(warn.ends_at).toLocaleString("pt-BR")}
                            </span>
                          ) : isSusp ? (
                            <span className="text-rose-400 font-semibold">Permanente</span>
                          ) : null}

                          <span>
                            Por: <strong className="text-foreground">{warn.admin_name}</strong>
                          </span>

                          {warn.acknowledged_at ? (
                            <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Ciente em {new Date(warn.acknowledged_at).toLocaleString("pt-BR")}
                            </span>
                          ) : (
                            <span className="text-amber-400 font-bold inline-flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Ciência pendente
                            </span>
                          )}
                        </div>

                        {/* MOTIVO DE REVOGAÇÃO SE HOUVER */}
                        {warn.status === "revogado" && warn.revocation_reason && (
                          <div className="mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-200">
                            <strong className="text-purple-300">Justificativa da Anistia/Revogação:</strong> {warn.revocation_reason}
                            {warn.revoked_by_name && ` (por ${warn.revoked_by_name})`}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {isPendingMyScience && (
                          <Button
                            size="sm"
                            onClick={() => handleAcknowledgeWarning(warn.id)}
                            disabled={acknowledgeMutation.isPending}
                            className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-amber-950 gap-1.5 shadow-md cursor-pointer"
                          >
                            <FileSignature className="h-3.5 w-3.5" />
                            <span>Dar Ciência</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingWarning(warn)}
                          className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1 border-border/80 cursor-pointer"
                          title="Ver detalhes completos"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detalhes</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODO 2: GESTÃO GLOBAL DE PENALIDADES (ADMIN/LIDERANÇA)   */}
      {/* ========================================================= */}
      {currentTab === "gestao" && (
        <div className="space-y-6">
          {/* CARDS DE MÉTRICAS / KPIS GLOBAIS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="surface-card border-border/70 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total de Registros</span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-foreground">{globalStats.total}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Histórico disciplinar acumulado</p>
            </Card>

            <Card className="surface-card border-rose-500/30 bg-rose-950/10 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-rose-300">Suspensões Ativas</span>
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                  <Ban className="h-4 w-4 animate-pulse" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-rose-400">{globalStats.activeSuspensions}</div>
              <p className="text-[10px] text-rose-300/80 mt-0.5">Membros com bloqueio funcional ativo</p>
            </Card>

            <Card className="surface-card border-amber-500/30 bg-amber-950/10 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-300">Advertências Ativas</span>
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-amber-400">{globalStats.activeWarnings}</div>
              <p className="text-[10px] text-amber-300/80 mt-0.5">Membros notificados e sob observação</p>
            </Card>

            <Card className="surface-card border-purple-500/30 bg-purple-950/10 p-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-purple-300">Punições Revogadas</span>
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Undo2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-purple-400">{globalStats.revoked}</div>
              <p className="text-[10px] text-purple-300/80 mt-0.5">Canceladas manualmente com anistia</p>
            </Card>
          </div>

          {/* BARRA DE FILTROS E BUSCA */}
          <Card className="surface-card border-border/80 p-3 sm:p-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por membro, ID, motivo ou administrador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Status</SelectItem>
                    <SelectItem value="ativo">Apenas Ativos</SelectItem>
                    <SelectItem value="expirado">Expirados</SelectItem>
                    <SelectItem value="revogado">Revogados</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9 text-xs w-[130px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Tipos</SelectItem>
                    <SelectItem value="advertencia">Advertências</SelectItem>
                    <SelectItem value="suspensao">Suspensões</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="h-9 text-xs w-[130px]">
                    <SelectValue placeholder="Gravidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas Gravidades</SelectItem>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* LISTAGEM DE ADVERTÊNCIAS & SUSPENSÕES GLOBAIS */}
          {isLoading ? (
            <TableSkeleton rows={6} />
          ) : filteredGlobalWarnings.length === 0 ? (
            <EmptyState
              icon={<ShieldAlert className="h-10 w-10 text-muted-foreground" />}
              title="Nenhum registro disciplinar encontrado"
              description={
                searchTerm || statusFilter !== "todos" || typeFilter !== "todos"
                  ? "Tente ajustar os filtros ou termo de busca acima."
                  : "Nenhuma advertência ou suspensão foi aplicada ainda. O histórico da organização está limpo!"
              }
              action={
                canCreate ? (
                  <Button size="sm" onClick={handleOpenCreateModal} className="mt-4 gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>Aplicar Primeira Advertência</span>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredGlobalWarnings.map((warn) => {
                const isSusp = warn.is_suspension || warn.type === "suspensao";
                const isTerminated = warn.status === "expirado" || warn.status === "revogado";

                return (
                  <Card
                    key={warn.id}
                    className={cn(
                      "surface-card border transition-all hover:border-border/90 p-4",
                      warn.status === "ativo" && isSusp && "border-rose-500/40 bg-rose-950/5 shadow-xs",
                      warn.status === "ativo" && !isSusp && "border-amber-500/40 bg-amber-950/5 shadow-xs",
                      isTerminated && "opacity-75"
                    )}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* MEMBRO & DADOS PRINCIPAIS */}
                      <div className="flex items-start gap-3.5">
                        <Avatar className="h-11 w-11 border-2 border-border/80 shadow-xs shrink-0 mt-0.5">
                          <AvatarImage src={getProxiedImageUrl(warn.member_avatar || "") || undefined} />
                          <AvatarFallback className="font-bold text-xs bg-primary/20 text-primary">
                            {warn.member_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {warn.member_nickname || warn.member_name}
                            </span>
                            {warn.member_nickname && (
                              <span className="text-xs text-muted-foreground font-normal">
                                ({warn.member_name})
                              </span>
                            )}
                            {warn.member_game_id && (
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground">
                                ID: {warn.member_game_id}
                              </span>
                            )}
                            {warn.member_level && (
                              <Badge variant="outline" className="text-[10px] font-semibold py-0">
                                {warn.member_level}
                              </Badge>
                            )}
                            {getStatusBadge(warn.status)}
                          </div>

                          {/* TÍTULO E MOTIVO */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <Badge
                              variant={isSusp ? "destructive" : "outline"}
                              className={cn(
                                "font-bold text-[10px] uppercase",
                                !isSusp && "border-amber-500/50 text-amber-400 bg-amber-500/10"
                              )}
                            >
                              {isSusp
                                ? warn.suspension_type === "permanente"
                                ? "🚫 Suspensão Permanente"
                                : "🚫 Suspensão Temporária"
                              : "⚠️ Advertência"}
                            </Badge>
                            {getSeverityBadge(warn.severity)}
                            <span className="text-xs font-semibold text-foreground/90">
                              {warn.reason}
                            </span>
                            {warn.applied_tag_id && (
                              <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary border border-primary/30 flex items-center gap-1">
                                <Tag className="h-2.5 w-2.5" />
                                Tag: {tags.find((t) => t.id === warn.applied_tag_id)?.name || warn.applied_tag_id}
                              </Badge>
                            )}
                          </div>

                          {/* DESCRIÇÃO RESUMIDA */}
                          <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
                            {warn.description}
                          </p>

                          {/* BLOQUEIOS FUNCIONAIS */}
                          {warn.blocks && Object.values(warn.blocks).some(Boolean) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5" /> Bloqueios:
                              </span>
                              {warn.blocks.block_all_operations && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-medium">
                                  Operações Gerais
                                </span>
                              )}
                              {warn.blocks.block_login && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-medium">
                                  Acesso Plataforma
                                </span>
                              )}
                              {warn.blocks.block_sales && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                                  Vendas
                                </span>
                              )}
                              {warn.blocks.block_movements && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                                  Baú / Movimentações
                                </span>
                              )}
                              {warn.blocks.block_productions && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                                  Produção
                                </span>
                              )}
                              {warn.blocks.block_cash_fund && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium">
                                  Fundo de Caixa
                                </span>
                              )}
                            </div>
                          )}

                          {/* METADADOS DE DATA, ADMIN E CIÊNCIA */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Início: {new Date(warn.starts_at).toLocaleDateString("pt-BR")}
                            </span>

                            {warn.ends_at ? (
                              <span className="flex items-center gap-1 font-mono text-foreground/80">
                                <Clock className="h-3 w-3 text-primary" />
                                Término: {new Date(warn.ends_at).toLocaleString("pt-BR")}
                              </span>
                            ) : isSusp ? (
                              <span className="text-rose-400 font-semibold">Permanente</span>
                            ) : null}

                            <span>
                              Aplicado por: <strong className="text-foreground">{warn.admin_name}</strong>
                            </span>

                            {warn.acknowledged_at ? (
                              <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Ciente em {new Date(warn.acknowledged_at).toLocaleDateString("pt-BR")}
                              </span>
                            ) : (
                              <span className="text-amber-400 font-medium inline-flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Pendente de ciência
                              </span>
                            )}
                          </div>

                          {/* MOTIVO DA REVOGAÇÃO SE HOUVER */}
                          {warn.status === "revogado" && warn.revocation_reason && (
                            <div className="mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-200">
                              <strong className="text-purple-300">Justificativa da Revogação:</strong> {warn.revocation_reason}
                              {warn.revoked_by_name && ` (por ${warn.revoked_by_name})`}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AÇÕES ADMINISTRATIVAS */}
                      <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-center shrink-0">
                        {canViewDetails && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingWarning(warn)}
                            className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1 border-border/80 cursor-pointer"
                            title="Ver detalhes completos"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Detalhes</span>
                          </Button>
                        )}

                        {canRevoke && warn.status === "ativo" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRevokingWarning(warn);
                              setRevocationReasonInput("");
                            }}
                            className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1 border-purple-500/40 text-purple-400 hover:bg-purple-500/10 cursor-pointer"
                            title="Revogar / Cancelar penalidade"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                            <span>Revogar</span>
                          </Button>
                        )}

                        {canEdit && warn.status === "ativo" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditModal(warn)}
                            className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1 border-border/80 cursor-pointer"
                            title="Editar penalidade"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Editar</span>
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingWarningId(warn.id)}
                            className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Excluir registro permanentemente"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: NOVA ADVERTÊNCIA / SUSPENSÃO */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Aplicar Penalidade Disciplinar
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Registre uma advertência disciplinar ou suspensão com vigência e bloqueios funcionais automáticos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            {/* 1. SELEÇÃO DO MEMBRO */}
            <div>
              <Label className="text-xs font-semibold text-foreground">
                Membro Penalizado <span className="text-rose-500">*</span>
              </Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId} required>
                <SelectTrigger className="mt-1 h-10 text-xs">
                  <SelectValue placeholder="Selecione o membro..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {members.map((m) => (
                    <SelectItem key={m.id || m.user_id} value={m.id || m.user_id}>
                      {m.nickname || m.nome} {m.game_id ? `(ID: ${m.game_id})` : ""} - {m.role || m.level || "Membro"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. TIPO DE PENALIDADE E SEVERIDADE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-foreground">Tipo de Penalidade</Label>
                <Select
                  value={newType}
                  onValueChange={(v: any) => setNewType(v)}
                  disabled={!canCreateSuspension && canCreateWarning}
                >
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advertencia">⚠️ Advertência Disciplinar</SelectItem>
                    {canCreateSuspension && (
                      <SelectItem value="suspensao">🚫 Suspensão de Membro</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {!canCreateSuspension && canCreateWarning && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Seu cargo possui permissão apenas para aplicar advertências simples.
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground">Gravidade da Infração</Label>
                <Select value={newSeverity} onValueChange={(v: any) => setNewSeverity(v)}>
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve (Advertência verbal / registro)</SelectItem>
                    <SelectItem value="media">Média (Descumprimento padrão)</SelectItem>
                    <SelectItem value="grave">Grave (Infração severa às regras)</SelectItem>
                    <SelectItem value="critica">Crítica (Falta gravíssima / risco à facção)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3. MOTIVO PRINCIPAL */}
            <div>
              <Label className="text-xs font-semibold text-foreground">
                Motivo da Infração <span className="text-rose-500">*</span>
              </Label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WARNING_REASON_PRESETS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPreset.includes("Outro") && (
              <div>
                <Label className="text-xs font-semibold text-foreground">Especificar Motivo Personalizado</Label>
                <Input
                  placeholder="Descreva o motivo sintético..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="mt-1 h-9 text-xs"
                  required
                />
              </div>
            )}

            {/* 4. DESCRIÇÃO DETALHADA */}
            <div>
              <Label className="text-xs font-semibold text-foreground">
                Descrição dos Fatos & Evidências <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                placeholder="Detalhe o ocorrido, normas violadas, provas ou acordos estabelecidos..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="mt-1 text-xs min-h-[90px]"
                required
              />
            </div>

            {/* 5. VIGÊNCIA E DURAÇÃO */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
                <Clock className="h-4 w-4 text-primary" /> Vigência & Duração
              </div>

              {newType === "suspensao" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Tipo de Duração</Label>
                    <Select value={suspensionType} onValueChange={(v: any) => setSuspensionType(v)}>
                      <SelectTrigger className="mt-1 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temporaria">Temporária (dias/horas definidos)</SelectItem>
                        <SelectItem value="permanente">Permanente (indeterminada)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {suspensionType === "temporaria" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-semibold">Dias</Label>
                        <Input
                          type="number"
                          min={0}
                          value={durationDays}
                          onChange={(e) => setDurationDays(Number(e.target.value))}
                          className="mt-1 h-9 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Horas</Label>
                        <Input
                          type="number"
                          min={0}
                          max={23}
                          value={durationHours}
                          onChange={(e) => setDurationHours(Number(e.target.value))}
                          className="mt-1 h-9 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-semibold text-foreground">Validade da Advertência no Prontuário</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Dias de vigência</Label>
                      <Input
                        type="number"
                        min={0}
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Horas adicionais</Label>
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Após este período, o registro passará automaticamente para o status de expirado.
                  </p>
                </div>
              )}
            </div>

            {/* 6. BLOQUEIOS FUNCIONAIS */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
              <div>
                <Label className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-rose-400" />
                  Bloqueios Funcionais Automáticos:
                </Label>
                <p className="text-[11px] text-rose-300/70 mt-0.5">
                  O sistema aplicará as travas operacionais enquanto a penalidade estiver ativa.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-rose-500/30 cursor-pointer hover:bg-background/80 transition-colors">
                  <Switch checked={blockAllOperations} onCheckedChange={setBlockAllOperations} />
                  <div>
                    <span className="font-bold text-rose-300 block">Bloqueio Total Operacional</span>
                    <span className="text-[10px] text-muted-foreground">Impede qualquer modificação</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                  <Switch checked={blockLogin} onCheckedChange={setBlockLogin} />
                  <div>
                    <span className="font-semibold text-foreground block">Bloquear Acesso à Plataforma</span>
                    <span className="text-[10px] text-muted-foreground">Bloqueia navegação e login</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                  <Switch checked={blockSales} onCheckedChange={setBlockSales} />
                  <div>
                    <span className="font-semibold text-foreground block">Bloquear Vendas</span>
                    <span className="text-[10px] text-muted-foreground">Impede registrar vendas</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                  <Switch checked={blockMovements} onCheckedChange={setBlockMovements} />
                  <div>
                    <span className="font-semibold text-foreground block">Bloquear Baú</span>
                    <span className="text-[10px] text-muted-foreground">Impede retiradas de baú</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                  <Switch checked={blockProductions} onCheckedChange={setBlockProductions} />
                  <div>
                    <span className="font-semibold text-foreground block">Bloquear Produções</span>
                    <span className="text-[10px] text-muted-foreground">Impede ordens de produção</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                  <Switch checked={blockCashFund} onCheckedChange={setBlockCashFund} />
                  <div>
                    <span className="font-semibold text-foreground block">Bloquear Fundo de Caixa</span>
                    <span className="text-[10px] text-muted-foreground">Impede movimentações de caixa</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 7. ATRIBUIÇÃO AUTOMÁTICA DE TAG */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-primary" />
                Atribuir Tag Automática de Punição (Opcional):
              </Label>
              <Select value={appliedTagId} onValueChange={setAppliedTagId}>
                <SelectTrigger className="mt-1 h-9 text-xs">
                  <SelectValue placeholder="Nenhuma tag adicional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma tag adicional</SelectItem>
                  {tags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      🏷️ {t.name} ({t.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Se selecionada, a tag será atribuída ao membro e desvinculada automaticamente quando a penalidade expirar ou for revogada.
              </p>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-9 text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {createMutation.isPending ? "Aplicando..." : "Confirmar & Aplicar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDITAR ADVERTÊNCIA */}
      <Dialog open={Boolean(editingWarning)} onOpenChange={(open) => !open && setEditingWarning(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Edit2 className="h-5 w-5 text-primary" />
              Editar Penalidade Disciplinar
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingWarning ? `Modificando registro de ${editingWarning.member_name}` : ""}
            </DialogDescription>
          </DialogHeader>

          {editingWarning && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              {/* SEVERIDADE */}
              <div>
                <Label className="text-xs font-semibold text-foreground">Gravidade</Label>
                <Select value={editSeverity} onValueChange={(v: any) => setEditSeverity(v)}>
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* MOTIVO */}
              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Motivo da Infração <span className="text-rose-500">*</span>
                </Label>
                <Select value={editPreset} onValueChange={setEditPreset}>
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WARNING_REASON_PRESETS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editPreset.includes("Outro") && (
                <div>
                  <Label className="text-xs font-semibold text-foreground">Especificar Motivo Personalizado</Label>
                  <Input
                    placeholder="Descreva o motivo sintético..."
                    value={editCustomReason}
                    onChange={(e) => setEditCustomReason(e.target.value)}
                    className="mt-1 h-9 text-xs"
                    required
                  />
                </div>
              )}

              {/* DESCRIÇÃO */}
              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Descrição dos Fatos & Evidências <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  placeholder="Detalhe o ocorrido..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 text-xs min-h-[90px]"
                  required
                />
              </div>

              {/* VIGÊNCIA E DURAÇÃO */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
                <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
                  <Clock className="h-4 w-4 text-primary" /> Vigência & Duração
                </div>

                {(editingWarning.is_suspension || editingWarning.type === "suspensao") ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Tipo de Duração</Label>
                      <Select value={editSuspensionType} onValueChange={(v: any) => setEditSuspensionType(v)}>
                        <SelectTrigger className="mt-1 h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="temporaria">Temporária</SelectItem>
                          <SelectItem value="permanente">Permanente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editSuspensionType === "temporaria" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-semibold">Dias</Label>
                          <Input
                            type="number"
                            min={0}
                            value={editDurationDays}
                            onChange={(e) => setEditDurationDays(Number(e.target.value))}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Horas</Label>
                          <Input
                            type="number"
                            min={0}
                            max={23}
                            value={editDurationHours}
                            onChange={(e) => setEditDurationHours(Number(e.target.value))}
                            className="mt-1 h-9 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Validade da Advertência (Dias & Horas)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Dias</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editDurationDays}
                          onChange={(e) => setEditDurationDays(Number(e.target.value))}
                          className="h-9 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Horas</Label>
                        <Input
                          type="number"
                          min={0}
                          max={23}
                          value={editDurationHours}
                          onChange={(e) => setEditDurationHours(Number(e.target.value))}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BLOQUEIOS FUNCIONAIS */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div>
                  <Label className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-rose-400" />
                    Bloquear Automaticamente:
                  </Label>
                  <p className="text-[11px] text-rose-300/70 mt-0.5">
                    Defina as restrições operacionais ativas para este registro disciplinar.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-rose-500/30 cursor-pointer hover:bg-background/80 transition-colors">
                    <Switch checked={editBlockAllOperations} onCheckedChange={setEditBlockAllOperations} />
                    <div>
                      <span className="font-bold text-rose-300 block">Bloqueio Total Operacional</span>
                      <span className="text-[10px] text-muted-foreground">Impede qualquer ação/modificação</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                    <Switch checked={editBlockLogin} onCheckedChange={setEditBlockLogin} />
                    <div>
                      <span className="font-semibold text-foreground block">Bloquear Acesso à Plataforma</span>
                      <span className="text-[10px] text-muted-foreground">Bloqueia navegação e login</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                    <Switch checked={editBlockSales} onCheckedChange={setEditBlockSales} />
                    <div>
                      <span className="font-semibold text-foreground block">Bloquear Vendas</span>
                      <span className="text-[10px] text-muted-foreground">Impede registrar vendas</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                    <Switch checked={editBlockMovements} onCheckedChange={setEditBlockMovements} />
                    <div>
                      <span className="font-semibold text-foreground block">Bloquear Baú</span>
                      <span className="text-[10px] text-muted-foreground">Impede retiradas de baú</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                    <Switch checked={editBlockProductions} onCheckedChange={setEditBlockProductions} />
                    <div>
                      <span className="font-semibold text-foreground block">Bloquear Produções</span>
                      <span className="text-[10px] text-muted-foreground">Impede ordens de produção</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                    <Switch checked={editBlockCashFund} onCheckedChange={setEditBlockCashFund} />
                    <div>
                      <span className="font-semibold text-foreground block">Bloquear Fundo de Caixa</span>
                      <span className="text-[10px] text-muted-foreground">Impede movimentações de caixa</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* ATRIBUIÇÃO AUTOMÁTICA DE TAG */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-primary" />
                  Atribuir Tag Automática de Punição (Opcional):
                </Label>
                <Select value={editAppliedTagId} onValueChange={setEditAppliedTagId}>
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Nenhuma tag adicional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma tag adicional</SelectItem>
                    {tags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        🏷️ {t.name} ({t.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Se selecionada, a tag será atribuída ao membro e desvinculada automaticamente quando a penalidade expirar ou for revogada.
                </p>
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingWarning(null)}
                  className="h-9 text-xs cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: REVOGAR / CANCELAR SUSPENSÃO */}
      <Dialog open={Boolean(revokingWarning)} onOpenChange={(open) => !open && setRevokingWarning(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Undo2 className="h-5 w-5 text-purple-400" />
              Revogar Penalidade Disciplinar
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              A anistia removerá imediatamente as restrições funcionais e a tag de punição vinculada ao membro.
            </DialogDescription>
          </DialogHeader>

          {revokingWarning && (
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border text-xs space-y-1">
                <div><strong>Membro:</strong> {revokingWarning.member_name}</div>
                <div><strong>Infração:</strong> {revokingWarning.reason}</div>
                <div><strong>Tipo:</strong> {revokingWarning.type.toUpperCase()} ({revokingWarning.severity.toUpperCase()})</div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Justificativa Oficial da Revogação <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  placeholder="Ex.: Cumprimento de acordo, retratação aprovada pela diretoria, erro no relatório..."
                  value={revocationReasonInput}
                  onChange={(e) => setRevocationReasonInput(e.target.value)}
                  className="mt-1 text-xs min-h-[80px]"
                  required
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRevokingWarning(null)}
                  className="h-9 text-xs cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRevokeSubmit}
                  disabled={revokeMutation.isPending || !revocationReasonInput.trim()}
                  className="h-9 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                >
                  {revokeMutation.isPending ? "Revogando..." : "Confirmar Revogação"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 4: EXCLUIR PERMANENTEMENTE */}
      <Dialog open={Boolean(deletingWarningId)} onOpenChange={(open) => !open && setDeletingWarningId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-rose-500">
              <Trash2 className="h-5 w-5" />
              Excluir Registro Disciplinar
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Esta ação removerá o registro definitivamente da plataforma. Essa operação é auditada.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingWarningId(null)}
              className="h-9 text-xs cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeleteSubmit}
              disabled={deleteMutation.isPending}
              className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: DETALHES COMPLETOS DO REGISTRO */}
      <Dialog open={Boolean(viewingWarning)} onOpenChange={(open) => !open && setViewingWarning(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Info className="h-5 w-5 text-primary" />
              Prontuário Disciplinar Completo
            </DialogTitle>
          </DialogHeader>

          {viewingWarning && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={getProxiedImageUrl(viewingWarning.member_avatar || "") || undefined} />
                  <AvatarFallback className="font-bold">{viewingWarning.member_name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-sm text-foreground">
                    {viewingWarning.member_nickname || viewingWarning.member_name}
                  </div>
                  <div className="text-muted-foreground">
                    Cargo: {viewingWarning.member_level || "Membro"} · ID: {viewingWarning.member_game_id || "N/A"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-secondary/20 border border-border/60">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Tipo:</span>
                  <span className="font-semibold text-foreground uppercase">{viewingWarning.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Gravidade:</span>
                  <span className="font-semibold text-foreground uppercase">{viewingWarning.severity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Data de Aplicação:</span>
                  <span className="font-mono text-foreground">{new Date(viewingWarning.starts_at).toLocaleString("pt-BR")}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Previsão Término:</span>
                  <span className="font-mono text-foreground">
                    {viewingWarning.ends_at ? new Date(viewingWarning.ends_at).toLocaleString("pt-BR") : "Indeterminada / Permanente"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Status:</span>
                  <div>{getStatusBadge(viewingWarning.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Confirmado Ciência:</span>
                  <span className="text-foreground">
                    {viewingWarning.acknowledged_at
                      ? new Date(viewingWarning.acknowledged_at).toLocaleString("pt-BR")
                      : "Pendente"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Motivo Oficial:</span>
                <p className="font-semibold text-foreground text-xs mt-0.5">{viewingWarning.reason}</p>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Relato Detalhado:</span>
                <p className="mt-1 p-3 rounded-lg bg-secondary/30 border border-border whitespace-pre-wrap text-foreground/90 text-xs">
                  {viewingWarning.description}
                </p>
              </div>

              {viewingWarning.status === "revogado" && viewingWarning.revocation_reason && (
                <div>
                  <span className="text-purple-400 block text-[10px] uppercase font-bold">Anistia / Revogação:</span>
                  <p className="mt-1 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-200">
                    {viewingWarning.revocation_reason}
                  </p>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button size="sm" variant="outline" onClick={() => setViewingWarning(null)} className="h-8 text-xs cursor-pointer">
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
