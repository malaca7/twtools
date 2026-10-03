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
import { PageHeader, NoAccess, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { useMemberTags } from "@/hooks/useMemberTags";
import {
  useWarnings,
  useCreateWarningMutation,
  useUpdateWarningMutation,
  useRevokeWarningMutation,
  useDeleteWarningMutation,
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
  const { hasPermission, isDevUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Advertências & Suspensões"
          description="Carregando permissões disciplinares..."
        />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  const canAccess =
    hasPermission("view_warnings") ||
    hasPermission("view_all_warnings") ||
    hasPermission("view_warning_details") ||
    hasPermission("manage_warnings") ||
    hasPermission("create_warning") ||
    hasPermission("create_suspension") ||
    hasPermission("edit_warning") ||
    hasPermission("revoke_warning") ||
    hasPermission("delete_warning") ||
    hasPermission("export_warnings") ||
    hasPermission("view_ceo_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("view_dev_warnings") ||
    hasPermission("manage_dev_warnings") ||
    isDevUser;

  if (!canAccess) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <PageHeader
          title="Advertências & Suspensões"
          description="Sistema disciplinar e controle de penalidades da organização."
        />
        <div className="flex min-h-[420px] items-center justify-center p-4">
          <Card className="max-w-md w-full surface-card text-center p-6 sm:p-8 space-y-5 border-rose-500/30 bg-rose-500/[0.03] shadow-lg shadow-rose-950/20">
            <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-inner">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Acesso Restrito</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Você não possui a permissão <strong>"Visualizar Página / Menu de Advertências"</strong>.
                O acesso a esta área é restrito aos cargos e tags autorizados pela liderança.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-border/60 hover:bg-secondary/60 text-xs"
              >
                <Link to="/dashboard">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Ir ao Dashboard
                </Link>
              </Button>
              <Button
                asChild
                variant="default"
                size="sm"
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                <Link to="/perfil/advertencias">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Minhas Advertências
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return <AdvertenciasContent />;
}

function AdvertenciasContent() {
  const { hasPermission, isDevUser, isCeoUser, user, profile, loading } = useAuth();

  const canAccess =
    hasPermission("view_warnings") ||
    hasPermission("view_all_warnings") ||
    hasPermission("view_warning_details") ||
    hasPermission("manage_warnings") ||
    hasPermission("create_warning") ||
    hasPermission("create_suspension") ||
    hasPermission("edit_warning") ||
    hasPermission("revoke_warning") ||
    hasPermission("delete_warning") ||
    hasPermission("export_warnings") ||
    hasPermission("view_ceo_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("view_dev_warnings") ||
    hasPermission("manage_dev_warnings") ||
    isDevUser;

  if (!loading && !canAccess) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        <PageHeader
          title="Advertências & Suspensões"
          description="Sistema disciplinar e controle de penalidades da organização."
        />
        <div className="flex min-h-[420px] items-center justify-center p-4">
          <Card className="max-w-md w-full surface-card text-center p-6 sm:p-8 space-y-5 border-rose-500/30 bg-rose-500/[0.03] shadow-lg shadow-rose-950/20">
            <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-inner">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Acesso Restrito</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Você não possui a permissão <strong>"Visualizar Página / Menu de Advertências"</strong>.
                O acesso a esta área é restrito aos cargos e tags autorizados pela liderança.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-border/60 hover:bg-secondary/60 text-xs"
              >
                <Link to="/dashboard">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Ir ao Dashboard
                </Link>
              </Button>
              <Button
                asChild
                variant="default"
                size="sm"
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                <Link to="/perfil/advertencias">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Minhas Advertências
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const { data: warnings = [], isLoading, refetch, isRefetching } = useWarnings();
  const { data: members = [] } = useMembers();
  const { data: tags = [] } = useMemberTags();

  // Permissões granulares
  const canCreateWarning =
    hasPermission("create_warning") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings");

  const canCreateSuspension =
    hasPermission("create_suspension") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings");

  const canCreate = canCreateWarning || canCreateSuspension;

  const canEdit =
    hasPermission("edit_warning") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings");

  const canRevoke =
    hasPermission("revoke_warning") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings");

  const canDelete =
    hasPermission("delete_warning") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings");

  const canViewDetails =
    hasPermission("view_warning_details") ||
    hasPermission("view_all_warnings") ||
    hasPermission("view_warnings") ||
    hasPermission("view_ceo_warnings") ||
    hasPermission("view_dev_warnings") ||
    hasPermission("manage_warnings");

  const canExport =
    hasPermission("export_warnings") ||
    hasPermission("manage_warnings") ||
    hasPermission("manage_ceo_warnings") ||
    hasPermission("manage_dev_warnings");

  // Mutations
  const createMutation = useCreateWarningMutation();
  const updateMutation = useUpdateWarningMutation();
  const revokeMutation = useRevokeWarningMutation();
  const deleteMutation = useDeleteWarningMutation();

  // Estados de Filtros e Busca
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [typeFilter, setTypeFilter] = useState<string>("todos");
  const [severityFilter, setSeverityFilter] = useState<string>("todos");

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

  // Permissão de Visualização Global (apenas membros autorizados com view_all_warnings ou gerenciamento)
  const canViewGlobal = useMemo(() => {
    if (isDevUser) return true;
    return Boolean(
      hasPermission("view_all_warnings") ||
      hasPermission("manage_warnings") ||
      hasPermission("view_ceo_warnings") ||
      hasPermission("view_dev_warnings") ||
      hasPermission("manage_ceo_warnings") ||
      hasPermission("manage_dev_warnings")
    );
  }, [hasPermission, isDevUser]);

  // Lista base (filtrada estritamente por membro caso não tenha permissão global)
  const baseWarnings = useMemo(() => {
    if (canViewGlobal) {
      return warnings;
    }

    const currentUserId = user?.id ? String(user.id).trim().toLowerCase() : "";
    const currentProfileId = profile?.id ? String(profile.id).trim().toLowerCase() : "";
    const currentProfileUserId = profile?.user_id ? String(profile.user_id).trim().toLowerCase() : "";
    const currentGameId = profile?.game_id ? String(profile.game_id).trim().toLowerCase() : "";
    const currentProfileName = profile?.nome ? String(profile.nome).trim().toLowerCase() : "";
    const currentProfileNick = profile?.nickname ? String(profile.nickname).trim().toLowerCase() : "";

    // Se nenhum identificador for encontrado, por segurança não expõe advertências globais
    if (!currentUserId && !currentProfileId && !currentProfileUserId && !currentGameId && !currentProfileName) {
      return [];
    }

    return warnings.filter((w) => {
      const warnMemberId = w.member_id ? String(w.member_id).trim().toLowerCase() : "";
      const warnGameId = w.member_game_id ? String(w.member_game_id).trim().toLowerCase() : "";
      const warnName = w.member_name ? String(w.member_name).trim().toLowerCase() : "";
      const warnNick = w.member_nickname ? String(w.member_nickname).trim().toLowerCase() : "";

      const matchId = Boolean(
        (currentUserId && warnMemberId === currentUserId) ||
        (currentProfileId && warnMemberId === currentProfileId) ||
        (currentProfileUserId && warnMemberId === currentProfileUserId)
      );

      const matchGameId = Boolean(currentGameId && warnGameId === currentGameId);
      const matchName = Boolean(
        (currentProfileName && warnName === currentProfileName) ||
        (currentProfileNick && warnNick && warnNick === currentProfileNick)
      );

      return matchId || matchGameId || matchName;
    });
  }, [warnings, canViewGlobal, user?.id, profile?.id, profile?.user_id, profile?.game_id, profile?.nome, profile?.nickname]);

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    const total = baseWarnings.length;
    const activeSuspensions = baseWarnings.filter(
      (w) => w.status === "ativo" && (w.is_suspension || w.type === "suspensao")
    ).length;
    const activeWarnings = baseWarnings.filter(
      (w) => w.status === "ativo" && !w.is_suspension && w.type === "advertencia"
    ).length;
    const revoked = baseWarnings.filter((w) => w.status === "revogado").length;
    return { total, activeSuspensions, activeWarnings, revoked };
  }, [baseWarnings]);

  // Lista Filtrada por filtros e busca
  const filteredWarnings = useMemo(() => {
    return baseWarnings.filter((w) => {
      // Busca
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

      // Filtro Status
      if (statusFilter !== "todos" && w.status !== statusFilter) {
        return false;
      }

      // Filtro Tipo
      if (typeFilter !== "todos" && w.type !== typeFilter) {
        return false;
      }

      // Filtro Severidade
      if (severityFilter !== "todos" && w.severity !== severityFilter) {
        return false;
      }

      return true;
    });
  }, [baseWarnings, searchTerm, statusFilter, typeFilter, severityFilter]);

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

  // Exportar Relatório CSV
  const handleExportCsv = () => {
    if (filteredWarnings.length === 0) {
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
    const rows = filteredWarnings.map((w) => [
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
    if (filteredWarnings.length === 0) {
      toast.warning("Nenhum registro para copiar.");
      return;
    }
    const text = filteredWarnings
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
                Advertências & Suspensões
                {!canViewGlobal ? (
                  <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-300 bg-amber-500/10 py-0.5">
                    Visualização Pessoal
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold border-rose-500/40 text-rose-300 bg-rose-500/10 py-0.5">
                    Acesso Global
                  </Badge>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                {!canViewGlobal
                  ? "Visualizando apenas o seu histórico disciplinar individual e eventuais bloqueios."
                  : "Painel disciplinar para aplicação de penalidades, suspensões temporárias ou permanentes e auditoria global."}
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

          {canExport && (
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

          {canCreate && (
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

      {/* CARDS DE MÉTRICAS / KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="surface-card border-border/70 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total de Registros</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-foreground">{stats.total}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Histórico disciplinar acumulado</p>
        </Card>

        <Card className="surface-card border-rose-500/30 bg-rose-950/10 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-300">Suspensões Ativas</span>
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <Ban className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-rose-400">{stats.activeSuspensions}</div>
          <p className="text-[10px] text-rose-300/80 mt-0.5">Membros com bloqueio funcional ativo</p>
        </Card>

        <Card className="surface-card border-amber-500/30 bg-amber-950/10 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">Advertências Ativas</span>
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-amber-400">{stats.activeWarnings}</div>
          <p className="text-[10px] text-amber-300/80 mt-0.5">Membros notificados e sob observação</p>
        </Card>

        <Card className="surface-card border-purple-500/30 bg-purple-950/10 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-purple-300">Punições Revogadas</span>
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Undo2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black font-mono text-purple-400">{stats.revoked}</div>
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

      {/* LISTAGEM DE ADVERTÊNCIAS & SUSPENSÕES */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filteredWarnings.length === 0 ? (
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
              <Button size="sm" onClick={handleOpenCreateModal} className="mt-4 gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white">
                <Plus className="h-4 w-4" />
                <span>Aplicar Primeira Advertência</span>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredWarnings.map((warn) => {
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

            {/* 4. DESCRIÇÃO E DETALHES */}
            <div>
              <Label className="text-xs font-semibold text-foreground">
                Descrição dos Fatos & Evidências <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                placeholder="Detalhe o ocorrido, datas, reuniões, regras violadas e justificativa da penalidade..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="mt-1 text-xs min-h-[90px]"
                required
              />
            </div>

            {/* 5. VIGÊNCIA E DURAÇÃO DA PENALIDADE */}
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
                        <SelectItem value="temporaria">Temporária (Com data de término)</SelectItem>
                        <SelectItem value="permanente">Permanente (Até anistia formal)</SelectItem>
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
                      <Label className="text-[10px] text-muted-foreground">Dias</Label>
                      <Input
                        type="number"
                        min={0}
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Horas</Label>
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
                    Após esse período de vigência, a advertência passa automaticamente para o status de "expirado".
                  </p>
                </div>
              )}
            </div>

            {/* 6. BLOQUEIOS & RESTRIÇÕES OPERACIONAIS */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
              <div>
                <Label className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-rose-400" />
                  Bloquear Automaticamente (Segurança & Disciplina):
                </Label>
                <p className="text-[11px] text-rose-300/70 mt-0.5">
                  Selecione as restrições operacionais imediatas que serão impostas ao membro durante a vigência da penalidade.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-rose-500/30 cursor-pointer hover:bg-background/80 transition-colors">
                  <Switch checked={blockAllOperations} onCheckedChange={setBlockAllOperations} />
                  <div>
                    <span className="font-bold text-rose-300 block">Bloqueio Total Operacional</span>
                    <span className="text-[10px] text-muted-foreground">Impede qualquer ação/modificação no sistema</span>
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
                    <span className="font-semibold text-foreground block">Bloquear Vendas de Produtos</span>
                    <span className="text-[10px] text-muted-foreground">Impede registrar ou estornar vendas</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                  <Switch checked={blockMovements} onCheckedChange={setBlockMovements} />
                  <div>
                    <span className="font-semibold text-foreground block">Bloquear Retiradas / Baús</span>
                    <span className="text-[10px] text-muted-foreground">Impede retiradas e transferências</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                  <Switch checked={blockProductions} onCheckedChange={setBlockProductions} />
                  <div>
                    <span className="font-semibold text-foreground block">Bloquear Produções & Armazém</span>
                    <span className="text-[10px] text-muted-foreground">Impede ordens de produção e estoque</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background/80 transition-colors">
                  <Switch checked={blockCashFund} onCheckedChange={setBlockCashFund} />
                  <div>
                    <span className="font-semibold text-foreground block">Bloquear Fundo de Caixa</span>
                    <span className="text-[10px] text-muted-foreground">Impede depósitos e saques de caixa</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 7. ATRIBUIÇÃO AUTOMÁTICA DE TAG DE PUNIÇÃO */}
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
                disabled={createMutation.isPending || !selectedMemberId}
                className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {createMutation.isPending ? "Aplicando..." : "Confirmar e Aplicar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: EDITAR PENALIDADE */}
      <Dialog open={Boolean(editingWarning)} onOpenChange={(open) => !open && setEditingWarning(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Edit2 className="h-5 w-5 text-primary" />
              Editar Registro Disciplinar
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Retifique detalhes, motivo, gravidade ou configurações de bloqueio da penalidade.
            </DialogDescription>
          </DialogHeader>

          {editingWarning && (
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-secondary/40 border border-border text-xs flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">Membro:</span>{" "}
                  <strong className="text-foreground">{editingWarning.member_nickname || editingWarning.member_name}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{" "}
                  <Badge variant="outline" className="text-[10px] uppercase">{editingWarning.type}</Badge>
                </div>
              </div>

              {/* GRAVIDADE */}
              <div>
                <Label className="text-xs font-semibold text-foreground">Gravidade da Infração</Label>
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
