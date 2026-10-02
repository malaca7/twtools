import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
  const { hasPermission, isDevUser, isCeoUser } = useAuth();

  const canView = hasPermission("view_warnings") || isDevUser || isCeoUser;
  if (!canView) {
    return <NoAccess />;
  }

  return <AdvertenciasContent />;
}

function AdvertenciasContent() {
  const { hasPermission, isDevUser, isCeoUser, user, profile } = useAuth();
  const { data: warnings = [], isLoading, refetch, isRefetching } = useWarnings();
  const { data: members = [] } = useMembers();
  const { data: tags = [] } = useMemberTags();

  const canCreate = hasPermission("create_warning") || hasPermission("manage_warnings") || isDevUser || isCeoUser;
  const canEdit = hasPermission("edit_warning") || hasPermission("manage_warnings") || isDevUser || isCeoUser;
  const canRevoke = hasPermission("revoke_warning") || hasPermission("manage_warnings") || isDevUser || isCeoUser;
  const canDelete = hasPermission("delete_warning") || hasPermission("manage_warnings") || isDevUser || isCeoUser;

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

  // Bloqueios Funcionais
  const [blockAllOperations, setBlockAllOperations] = useState(true);
  const [blockLogin, setBlockLogin] = useState(false);
  const [blockSales, setBlockSales] = useState(false);
  const [blockMovements, setBlockMovements] = useState(false);
  const [blockProductions, setBlockProductions] = useState(false);
  const [blockCashFund, setBlockCashFund] = useState(false);

  // Estatísticas Rápidas
  const stats = useMemo(() => {
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

  // Lista Filtrada
  const filteredWarnings = useMemo(() => {
    return warnings.filter((w) => {
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
  }, [warnings, searchTerm, statusFilter, typeFilter, severityFilter]);

  // Reset do Formulário
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
    setBlockAllOperations(true);
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
      blocks: isSusp
        ? {
            block_all_operations: blockAllOperations,
            block_login: blockLogin,
            block_sales: blockSales,
            block_movements: blockMovements,
            block_productions: blockProductions,
            block_cash_fund: blockCashFund,
          }
        : undefined,

      applied_tag_id: isSusp && appliedTagId !== "none" ? appliedTagId : null,
    };

    await createMutation.mutateAsync(payload);
    setIsCreateModalOpen(false);
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
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Advertências & Suspensões
              </h1>
              <p className="text-xs text-muted-foreground">
                Painel disciplinar para aplicação de penalidades, suspensões temporárias ou permanentes e bloqueios automáticos.
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
                      </div>

                      {/* DESCRIÇÃO RESUMIDA */}
                      <p className="text-xs text-muted-foreground line-clamp-2 pt-0.5">
                        {warn.description}
                      </p>

                      {/* BLOQUEIOS FUNCIONAIS */}
                      {isSusp && warn.blocks && Object.values(warn.blocks).some(Boolean) && (
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
                        onClick={() => setEditingWarning(warn)}
                        className="h-8 px-2.5 text-xs font-semibold rounded-lg gap-1 border-border/80 cursor-pointer"
                        title="Editar penalidade"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
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
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advertencia">⚠️ Advertência Disciplinar</SelectItem>
                    <SelectItem value="suspensao">🚫 Suspensão de Membro</SelectItem>
                  </SelectContent>
                </Select>
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

            {/* 5. CONFIGURAÇÕES ESPECÍFICAS DE SUSPENSÃO */}
            {newType === "suspensao" ? (
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-4">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <Ban className="h-4 w-4" /> Parâmetros da Suspensão
                </div>

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

                {/* BLOQUEIOS FUNCIONAIS */}
                <div className="space-y-2 pt-2 border-t border-rose-500/20">
                  <Label className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-rose-400" />
                    Bloquear Automaticamente Durante a Suspensão:
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background">
                      <Switch checked={blockAllOperations} onCheckedChange={setBlockAllOperations} />
                      <span className="font-semibold text-rose-300">Bloqueio Total Operacional</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background">
                      <Switch checked={blockLogin} onCheckedChange={setBlockLogin} />
                      <span>Bloquear Acesso à Plataforma</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background">
                      <Switch checked={blockSales} onCheckedChange={setBlockSales} />
                      <span>Bloquear Vendas de Produtos</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background">
                      <Switch checked={blockMovements} onCheckedChange={setBlockMovements} />
                      <span>Bloquear Retiradas / Baús</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background">
                      <Switch checked={blockProductions} onCheckedChange={setBlockProductions} />
                      <span>Bloquear Produções & Armazém</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border cursor-pointer hover:bg-background">
                      <Switch checked={blockCashFund} onCheckedChange={setBlockCashFund} />
                      <span>Bloquear Fundo de Caixa</span>
                    </label>
                  </div>
                </div>

                {/* ATRIBUIÇÃO AUTOMÁTICA DE TAG (INTEGRAÇÃO COM TAGS) */}
                <div className="pt-2 border-t border-rose-500/20">
                  <Label className="text-xs font-semibold text-rose-200 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" />
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
                    Se selecionada, a tag será atribuída ao membro e desvinculada automaticamente quando a suspensão expirar ou for revogada.
                  </p>
                </div>
              </div>
            ) : (
              // SE FOR ADVERTÊNCIA SIMPLES
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <Label className="text-xs font-semibold text-amber-300">Validade da Advertência no Prontuário</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="h-9 text-xs w-28"
                  />
                  <span className="text-xs text-muted-foreground">
                    dias (após esse período, o status se torna "expirado")
                  </span>
                </div>
              </div>
            )}

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

      {/* MODAL 2: REVOGAR / CANCELAR SUSPENSÃO */}
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

      {/* MODAL 3: EXCLUIR PERMANENTEMENTE */}
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

      {/* MODAL 4: DETALHES COMPLETOS DO REGISTRO */}
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
