import { useState, useMemo, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Swords,
  Target,
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Plus,
  Search,
  Sliders,
  Check,
  X,
  Flame,
  ArrowRight,
  History,
  UserPlus,
  RefreshCw,
  AlertTriangle,
  Radio,
  Share2,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Shield,
  Layers,
  Crown,
  Eye,
  Info,
  Car,
  Crosshair,
  BadgeAlert,
  CalendarCheck,
  DoorOpen,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useActionScales,
  useActionScale,
  useActionScaleHistory,
  useMembers,
  nameOf,
} from "@/hooks/useData";
import {
  saveActionScale,
  publishActionScale,
  cancelActionScale,
  deleteActionScale,
  addActionScaleMember,
  removeActionScaleMember,
  confirmActionScalePresence,
  leaveActionScale,
  substituteActionScaleMember,
  reviewActionScaleMember,
} from "@/lib/app-api";
import type { ActionScale, ActionScaleMember, ActionScaleStatus, ActionScaleApprovalStatus } from "@/lib/app-types";
import { PageHeader, NoAccess, EmptyState } from "@/components/ui-kit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatDate, num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/escalas")({
  component: EscalasPage,
});

export const ACTION_TYPES = [
  { value: "operacao", label: "Operação de Rua", icon: Swords, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { value: "assalto", label: "Assalto / Roubo", icon: Target, color: "text-red-400 border-red-500/30 bg-red-500/10" },
  { value: "dominacao", label: "Dominação de Ponto", icon: Crown, color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
  { value: "guerra", label: "Guerra de Facção", icon: Flame, color: "text-rose-500 border-rose-500/30 bg-rose-500/10" },
  { value: "escolta", label: "Escolta VIP / Comboio", icon: Shield, color: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
  { value: "treinamento", label: "Treinamento Tático", icon: Crosshair, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { value: "reuniao", label: "Reunião de Ação", icon: Users, color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
  { value: "outro", label: "Outro Evento", icon: Sparkles, color: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10" },
];

export const POSTOS_FUNCAO = [
  { value: "Líder de Ação", label: "Líder de Ação (Comando)", icon: Crown, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { value: "Linha de Frente", label: "Linha de Frente (Assalto)", icon: Swords, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { value: "Piloto de Fuga", label: "Piloto de Fuga (Motorista)", icon: Car, color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
  { value: "Atirador", label: "Atirador (Tiro Longo / Suporte)", icon: Crosshair, color: "text-red-400 bg-red-500/10 border-red-500/30" },
  { value: "Batedor", label: "Batedor (Reconhecimento)", icon: Radio, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  { value: "Suporte", label: "Suporte / Retaguarda", icon: Shield, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  { value: "Operacional", label: "Operador Geral", icon: Target, color: "text-zinc-300 bg-zinc-500/10 border-zinc-500/30" },
];

export function EscalasPage() {
  const { user, profile, hasPermission, isDevUser, isCeoUser } = useAuth();
  const queryClient = useQueryClient();

  const isPrivileged = Boolean(isDevUser || isCeoUser);

  // Permissões com suporte total a Dev e CEO
  const canView = isPrivileged || hasPermission("escalas.view");
  const canDetails = isPrivileged || hasPermission("escalas.details") || canView;
  const canCreate = isPrivileged || hasPermission("escalas.create");
  const canEdit = isPrivileged || hasPermission("escalas.edit");
  const canDelete = isPrivileged || hasPermission("escalas.delete");
  const canPublish = isPrivileged || hasPermission("escalas.publish");
  const canCancel = isPrivileged || hasPermission("escalas.cancel");
  const canManageMembers = isPrivileged || hasPermission("escalas.manage_members");
  const canAddParticipants = isPrivileged || canManageMembers || hasPermission("escalas.add_participants");
  const canRemoveParticipants = isPrivileged || canManageMembers || hasPermission("escalas.remove_participants");
  const canConfirmPresence = isPrivileged || hasPermission("escalas.confirm_presence");
  const canManageSlots = isPrivileged || hasPermission("escalas.manage_slots") || canCreate || canManageMembers;
  const canSubstitute = isPrivileged || canManageMembers || hasPermission("escalas.substitute");
  const canViewHistory = isPrivileged || hasPermission("escalas.history");
  const canManageSettings = isPrivileged || hasPermission("escalas.settings");

  const myMemberId = profile?.id || profile?.user_id || user?.id;
  const actorName = profile?.nickname || profile?.nome || user?.email || "Operador";

  // Verificar se o usuário atual é Gerente desta escala (ou liderança/admin)
  const isScaleManager = useCallback((scale?: ActionScale | null) => {
    if (!scale) return false;
    if (isPrivileged || canManageMembers) return true;
    const myPId = profile?.id;
    const myUId = profile?.user_id || user?.id;
    if (scale.gerente_id && (scale.gerente_id === myPId || scale.gerente_id === myUId)) return true;
    if (scale.criado_por && (scale.criado_por === myUId || scale.criado_por === myPId)) return true;
    return false;
  }, [isPrivileged, canManageMembers, profile, user]);

  // Consultas
  const { data: scales = [], isLoading } = useActionScales();
  const { data: members = [] } = useMembers();

  // Estados locais
  const [activeTab, setActiveTab] = useState<"ativas" | "historico">("ativas");
  const [filterType, setFilterType] = useState<string>("todos");
  const [filterOnlyMine, setFilterOnlyMine] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Garante que aba de histórico seja revertida caso o usuário não tenha permissão de visualizá-la
  useEffect(() => {
    if (!canViewHistory && activeTab === "historico") {
      setActiveTab("ativas");
    }
  }, [canViewHistory, activeTab]);

  // Modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editScaleData, setEditScaleData] = useState<ActionScale | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedScaleId, setSelectedScaleId] = useState<string | null>(null);

  const [claimSlotModalOpen, setClaimSlotModalOpen] = useState(false);
  const [claimSlotScale, setClaimSlotScale] = useState<ActionScale | null>(null);
  const [claimPostoFuncao, setClaimPostoFuncao] = useState("Operacional");
  const [claimTipoVaga, setClaimTipoVaga] = useState<"titular" | "reserva">("titular");

  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [substituteModalOpen, setSubstituteModalOpen] = useState(false);
  const [substituteTargetMember, setSubstituteTargetMember] = useState<ActionScaleMember | null>(null);

  const [reproveModalOpen, setReproveModalOpen] = useState(false);
  const [reproveTargetMember, setReproveTargetMember] = useState<ActionScaleMember | null>(null);
  const [reproveMotivo, setReproveMotivo] = useState("");

  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [absenceTargetScaleId, setAbsenceTargetScaleId] = useState<string | null>(null);
  const [absenceReason, setAbsenceReason] = useState("");

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetScaleId, setCancelTargetScaleId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Sincronização em tempo real das escalas
  useEffect(() => {
    const channel = supabase
      .channel("action_scales_realtime_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "action_scales" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
          if (selectedScaleId) {
            void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "action_scale_members" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
          if (selectedScaleId) {
            void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
            void queryClient.invalidateQueries({ queryKey: ["action_scale_history", selectedScaleId] });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, selectedScaleId]);

  // Detalhes da escala ativa no modal
  const { data: selectedScale, isLoading: loadingSelectedScale } = useActionScale(
    selectedScaleId || undefined
  );
  const { data: scaleHistory = [] } = useActionScaleHistory(selectedScaleId || undefined);

  // Form State para Criação / Edição
  const [formTitulo, setFormTitulo] = useState("");
  const [formTipoAcao, setFormTipoAcao] = useState("operacao");
  const [formDataHora, setFormDataHora] = useState("");
  const [formDataHoraChamada, setFormDataHoraChamada] = useState("");
  const [formLocalPosto, setFormLocalPosto] = useState("");
  const [formVagasLimite, setFormVagasLimite] = useState("10");
  const [formVagasReservas, setFormVagasReservas] = useState("2");
  const [formGerenteId, setFormGerenteId] = useState<string>("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formStatus, setFormStatus] = useState<ActionScaleStatus>("publicada");

  // Form State para Adição de Membro
  const [addSelectedMemberId, setAddSelectedMemberId] = useState("");
  const [addPostoFuncao, setAddPostoFuncao] = useState("Operacional");
  const [addTipoVaga, setAddTipoVaga] = useState<"titular" | "reserva">("titular");

  // Form State para Substituição
  const [subSelectedMemberId, setSubSelectedMemberId] = useState("");
  const [subMotivo, setSubMotivo] = useState("");

  const handleOpenClaimModal = (scale: ActionScale) => {
    setClaimSlotScale(scale);
    const titularesLeft = Math.max(0, (scale.vagas_limite || 10) - (scale.total_titulares || 0));
    setClaimTipoVaga(titularesLeft > 0 ? "titular" : "reserva");
    setClaimPostoFuncao("Operacional");
    setClaimSlotModalOpen(true);
  };

  // Abrir modal de criação
  const handleOpenCreateModal = () => {
    setEditScaleData(null);
    setFormTitulo("");
    setFormTipoAcao("operacao");
    // Default: próxima hora cheia
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    const dateStr = new Date(nextHour.getTime() - nextHour.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormDataHora(dateStr);

    const callHour = new Date(nextHour.getTime() - 15 * 60000);
    const callStr = new Date(callHour.getTime() - callHour.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormDataHoraChamada(callStr);

    setFormLocalPosto("");
    setFormVagasLimite("10");
    setFormVagasReservas("2");
    setFormGerenteId(profile?.id || "");
    setFormDescricao("");
    setFormStatus("publicada");
    setCreateModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEditModal = (scale: ActionScale) => {
    setEditScaleData(scale);
    setFormTitulo(scale.titulo);
    setFormTipoAcao(scale.tipo_acao);
    setFormDataHora(scale.data_hora ? new Date(scale.data_hora).toISOString().slice(0, 16) : "");
    setFormDataHoraChamada(
      scale.data_hora_chamada ? new Date(scale.data_hora_chamada).toISOString().slice(0, 16) : ""
    );
    setFormLocalPosto(scale.local_posto);
    setFormVagasLimite(String(scale.vagas_limite || 10));
    setFormVagasReservas(String(scale.vagas_reservas || 2));
    setFormGerenteId(scale.gerente_id || "none");
    setFormDescricao(scale.descricao || "");
    setFormStatus(scale.status);
    setCreateModalOpen(true);
  };

  // Salvar Escala (Mutation)
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formTitulo.trim()) throw new Error("Informe o título da escala.");
      if (!formLocalPosto.trim()) throw new Error("Informe o local ou posto de encontro.");
      if (!formDataHora) throw new Error("Informe a data e horário da ação.");

      const targetGerente = formGerenteId && formGerenteId !== "none"
        ? members.find((m) => m.id === formGerenteId || m.user_id === formGerenteId)
        : null;

      return await saveActionScale({
        id: editScaleData?.id || null,
        titulo: formTitulo.trim(),
        tipo_acao: formTipoAcao,
        descricao: formDescricao.trim(),
        data_hora: new Date(formDataHora).toISOString(),
        data_hora_chamada: formDataHoraChamada ? new Date(formDataHoraChamada).toISOString() : null,
        local_posto: formLocalPosto.trim(),
        vagas_limite: parseInt(formVagasLimite, 10) || 10,
        vagas_reservas: parseInt(formVagasReservas, 10) || 0,
        status: formStatus,
        gerenteId: targetGerente ? (targetGerente.id || targetGerente.user_id) : null,
        gerenteNome: targetGerente ? (targetGerente.nickname || targetGerente.nome) : null,
        actor_name: actorName,
      });
    },
    onSuccess: (data) => {
      toast.success(
        editScaleData ? "Escala de ação atualizada com sucesso!" : "Nova escala de ação criada com sucesso!",
        { icon: "⚔️" }
      );
      setCreateModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
      if (selectedScaleId === data.id) {
        void queryClient.invalidateQueries({ queryKey: ["action_scale", data.id] });
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao salvar escala.");
    },
  });

  // Publicar Escala
  const publishMutation = useMutation({
    mutationFn: async (scaleId: string) => {
      return await publishActionScale(scaleId, actorName);
    },
    onSuccess: () => {
      toast.success("Escala publicada com sucesso! Os membros já podem confirmar presença.", { icon: "📢" });
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
      if (selectedScaleId) void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao publicar escala.");
    },
  });

  // Cancelar Escala
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!cancelTargetScaleId) throw new Error("Escala não selecionada.");
      if (!cancelReason.trim()) throw new Error("Informe o motivo do cancelamento.");
      return await cancelActionScale(cancelTargetScaleId, cancelReason.trim(), actorName);
    },
    onSuccess: () => {
      toast.success("Escala cancelada com sucesso.", { icon: "🚫" });
      setCancelModalOpen(false);
      setCancelReason("");
      setCancelTargetScaleId(null);
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
      if (selectedScaleId) void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao cancelar escala.");
    },
  });

  // Excluir Escala
  const deleteMutation = useMutation({
    mutationFn: async (scaleId: string) => {
      if (!confirm("Tem certeza que deseja excluir esta escala permanentemente?")) return;
      return await deleteActionScale(scaleId);
    },
    onSuccess: () => {
      toast.success("Escala de ação excluída permanentemente.");
      if (selectedScaleId) setDetailsModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao excluir escala.");
    },
  });

  // Confirmar Presença Rápida
  const confirmPresenceMutation = useMutation({
    mutationFn: async ({
      scaleId,
      status,
      reacao,
      justificativa,
      postoFuncao,
      tipoVaga,
    }: {
      scaleId: string;
      status: "confirmado" | "ausente" | "pendente";
      reacao?: string;
      justificativa?: string;
      postoFuncao?: string;
      tipoVaga?: "titular" | "reserva";
    }) => {
      return await confirmActionScalePresence({
        scaleId,
        memberId: myMemberId,
        status,
        reacao,
        justificativa,
        postoFuncao,
        tipoVaga,
        actorName,
      });
    },
    onSuccess: (_, vars) => {
      if (vars.status === "confirmado") {
        toast.success("Presença confirmada na ação! Boa sorte, operador.", { icon: "👍" });
      } else if (vars.status === "ausente") {
        toast.info("Ausência registrada na escala de ação.", { icon: "❌" });
        setAbsenceModalOpen(false);
        setAbsenceReason("");
      }
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
      if (selectedScaleId) void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao atualizar confirmação.");
    },
  });

  // Garantir Minha Vaga (Auto-inscrição na Ação)
  const claimSlotMutation = useMutation({
    mutationFn: async () => {
      if (!claimSlotScale) throw new Error("Escala não selecionada.");
      return await confirmActionScalePresence({
        scaleId: claimSlotScale.id,
        memberId: myMemberId,
        status: "confirmado",
        reacao: "👍",
        postoFuncao: claimPostoFuncao,
        tipoVaga: claimTipoVaga,
        actorName,
      });
    },
    onSuccess: () => {
      toast.success("Vaga garantida com sucesso! Você está confirmado na ação.", { icon: "🎯" });
      setClaimSlotModalOpen(false);
      setClaimSlotScale(null);
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
      if (selectedScaleId) {
        void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao garantir vaga na escala.");
    },
  });

  // Liberar Vaga e Sair da Escala
  const leaveScaleMutation = useMutation({
    mutationFn: async ({ scaleId }: { scaleId: string }) => {
      if (!confirm("Tem certeza de que deseja liberar sua vaga e sair desta escala?")) return;
      return await leaveActionScale({
        scaleId,
        memberId: myMemberId,
        actorName,
      });
    },
    onSuccess: () => {
      toast.info("Você liberou sua vaga e saiu da escala de ação.", { icon: "🚪" });
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
      if (selectedScaleId) {
        void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao liberar vaga.");
    },
  });

  // Adicionar Membro à Escala
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!selectedScaleId) throw new Error("Selecione uma escala.");
      if (!addSelectedMemberId) throw new Error("Selecione um membro.");
      return await addActionScaleMember({
        scaleId: selectedScaleId,
        memberId: addSelectedMemberId,
        postoFuncao: addPostoFuncao,
        tipoVaga: addTipoVaga,
        actorName,
      });
    },
    onSuccess: () => {
      toast.success("Membro escalado com sucesso!", { icon: "🎯" });
      setAddMemberModalOpen(false);
      setAddSelectedMemberId("");
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
      if (selectedScaleId) void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao escalar membro.");
    },
  });

  // Remover Membro da Escala
  const removeMemberMutation = useMutation({
    mutationFn: async ({ scaleId, memberId }: { scaleId: string; memberId: string }) => {
      if (!confirm("Remover este membro da escala?")) return;
      return await removeActionScaleMember(scaleId, memberId, actorName);
    },
    onSuccess: () => {
      toast.success("Membro removido da escala.");
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
      if (selectedScaleId) void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao remover membro.");
    },
  });

  // Substituir Membro
  const substituteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedScaleId || !substituteTargetMember) throw new Error("Dados incompletos.");
      if (!subSelectedMemberId) throw new Error("Selecione o membro substituto.");
      if (!subMotivo.trim()) throw new Error("Informe o motivo da substituição.");

      return await substituteActionScaleMember({
        scaleId: selectedScaleId,
        originalMemberId: substituteTargetMember.member_id,
        substitutoId: subSelectedMemberId,
        motivo: subMotivo.trim(),
        actorName,
      });
    },
    onSuccess: () => {
      toast.success("Substituição realizada com sucesso!", { icon: "🔄" });
      setSubstituteModalOpen(false);
      setSubstituteTargetMember(null);
      setSubSelectedMemberId("");
      setSubMotivo("");
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
      if (selectedScaleId) void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao realizar substituição.");
    },
  });

  // Avaliar / Aprovar / Reprovar Membro (Gerente da Escala ou Comando)
  const reviewMemberMutation = useMutation({
    mutationFn: async ({
      scaleId,
      memberId,
      statusAprovacao,
      motivo,
    }: {
      scaleId: string;
      memberId: string;
      statusAprovacao: "aprovado" | "reprovado";
      motivo?: string;
    }) => {
      return await reviewActionScaleMember({
        scaleId,
        memberId,
        statusAprovacao,
        motivo,
        actorName,
      });
    },
    onSuccess: (_, vars) => {
      if (vars.statusAprovacao === "aprovado") {
        toast.success("Membro APROVADO na ação com sucesso!", { icon: "✅" });
      } else {
        toast.info("Membro REPROVADO na ação.", { icon: "❌" });
        setReproveModalOpen(false);
        setReproveTargetMember(null);
        setReproveMotivo("");
      }
      void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
      if (selectedScaleId) {
        void queryClient.invalidateQueries({ queryKey: ["action_scale", selectedScaleId] });
        void queryClient.invalidateQueries({ queryKey: ["action_scale_history", selectedScaleId] });
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao registrar avaliação do membro.");
    },
  });

  // Filtros aplicados
  const filteredScales = useMemo(() => {
    return scales.filter((s) => {
      // Aba ativa vs histórico
      const isHistorical = s.status === "concluida" || s.status === "cancelada";
      if (activeTab === "ativas" && isHistorical) return false;
      if (activeTab === "historico" && !isHistorical) return false;

      // Filtro tipo
      if (filterType !== "todos" && s.tipo_acao !== filterType) return false;

      // Filtro "Minhas Escalas"
      if (filterOnlyMine && !s.user_is_escalado) return false;

      // Busca textual
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = s.titulo.toLowerCase().includes(q);
        const matchLocal = s.local_posto.toLowerCase().includes(q);
        const matchDesc = (s.descricao || "").toLowerCase().includes(q);
        if (!matchTitle && !matchLocal && !matchDesc) return false;
      }

      return true;
    });
  }, [scales, activeTab, filterType, filterOnlyMine, searchTerm]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const ativas = scales.filter((s) => s.status === "publicada" || s.status === "em_andamento");
    const convocados = ativas.reduce((acc, s) => acc + (s.total_titulares || 0) + (s.total_reservas || 0), 0);
    const confirmados = ativas.reduce(
      (acc, s) => acc + (s.confirmados_titulares || 0) + (s.confirmados_reservas || 0),
      0
    );
    const vagasTotal = ativas.reduce((acc, s) => acc + (s.vagas_limite || 0), 0);
    const vagasAbertas = Math.max(0, vagasTotal - confirmados);

    return {
      totalAtivas: ativas.length,
      convocados,
      confirmados,
      vagasAbertas,
    };
  }, [scales]);

  const selectedUserMember = useMemo(() => {
    if (!selectedScale?.membros) return null;
    const myId = profile?.id;
    const myUid = profile?.user_id || user?.id;
    return (
      selectedScale.membros.find(
        (m) =>
          (myId && (m.member_id === myId || m.user_id === myId)) ||
          (myUid && (m.user_id === myUid || m.member_id === myUid))
      ) || null
    );
  }, [selectedScale, profile, user]);

  if (!canView) {
    return (
      <div className="mx-auto max-w-xl py-16 px-4 animate-in fade-in-50 duration-300">
        <Card className="surface-card border-rose-500/30 text-center p-8 space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-foreground">Acesso Não Autorizado</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seu cargo ou tag atual não possui permissão para visualizar o menu ou a página de <strong className="text-foreground">Escala de Ação</strong> da facção. Solicite autorização à liderança caso necessário.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              className="border-rose-500/30 hover:bg-rose-500/10 text-xs font-bold gap-2 cursor-pointer"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/dashboard";
                }
              }}
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Retornar ao Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Escala de Ação & Operações"
          description="Central tática da facção para convocação de membros, agendamento de ações, controle de vagas titulares e reservas e confirmação em tempo real."
        />

        <div className="flex flex-wrap items-center gap-2">
          {canCreate && (
            <Button
              size="lg"
              className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold gap-2 shadow-lg shadow-rose-950/40 cursor-pointer"
              onClick={handleOpenCreateModal}
            >
              <Plus className="w-5 h-5" />
              Nova Escala de Ação
            </Button>
          )}
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS TÁTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="surface-card border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Ações Agendadas
              </span>
              <span className="text-2xl font-black font-mono text-rose-400">
                {stats.totalAtivas}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <Swords className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Membros Convocados
              </span>
              <span className="text-2xl font-black font-mono text-amber-300">
                {stats.convocados}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Presenças Confirmadas
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {stats.confirmados}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="surface-card border-sky-500/20 bg-sky-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Vagas em Aberto
              </span>
              <span className="text-2xl font-black font-mono text-sky-400">
                {stats.vagasAbertas}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Target className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ABAS E BARRA DE FILTROS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-3">
          <Tabs
            value={activeTab}
            onValueChange={(v: any) => setActiveTab(v)}
            className="w-full sm:w-auto"
          >
            <TabsList className="bg-secondary/40 border border-border/50">
              <TabsTrigger value="ativas" className="gap-2">
                <Swords className="w-4 h-4" />
                Escalas Agendadas
                <Badge
                  variant="outline"
                  className="ml-1 text-[10px] py-0 px-1 font-mono border-rose-500/30 text-rose-400"
                >
                  {scales.filter((s) => s.status !== "concluida" && s.status !== "cancelada").length}
                </Badge>
              </TabsTrigger>
              {canViewHistory && (
                <TabsTrigger value="historico" className="gap-2">
                  <History className="w-4 h-4" />
                  Histórico & Arquivo
                  <Badge
                    variant="outline"
                    className="ml-1 text-[10px] py-0 px-1 font-mono border-border"
                  >
                    {scales.filter((s) => s.status === "concluida" || s.status === "cancelada").length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-2 text-xs text-muted-foreground font-medium bg-secondary/30 px-3 py-1.5 rounded-lg border border-border/40">
              <Label htmlFor="only-mine" className="cursor-pointer text-xs select-none">
                Minhas Convocatórias
              </Label>
              <Switch
                id="only-mine"
                checked={filterOnlyMine}
                onCheckedChange={setFilterOnlyMine}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Tipo de Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar escala, local..."
                  className="pl-8 h-9 text-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* LISTA DE CARDS DE ESCALAS */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
            <p className="text-xs text-muted-foreground">Carregando escalas táticas de ação...</p>
          </div>
        ) : filteredScales.length === 0 ? (
          <EmptyState
            icon={Swords}
            title={activeTab === "ativas" ? "Nenhuma escala ativa no momento" : "Nenhum histórico encontrado"}
            description={
              activeTab === "ativas"
                ? "Não há escalas de ação publicadas ou agendadas com os filtros selecionados."
                : "Não constam registros de ações concluídas ou canceladas no histórico recente."
            }
            action={
              canCreate && activeTab === "ativas" ? (
                <Button onClick={handleOpenCreateModal} className="gap-2 bg-rose-600 hover:bg-rose-700">
                  <Plus className="w-4 h-4" /> Criar Escala Agora
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredScales.map((scale) => {
              const typeCfg =
                ACTION_TYPES.find((t) => t.value === scale.tipo_acao) || ACTION_TYPES[0];
              const IconComp = typeCfg.icon;

              const totalTitulares = scale.total_titulares || 0;
              const limite = scale.vagas_limite || 10;
              const confirmados = scale.confirmados_titulares || 0;
              const ausentes = scale.ausentes_titulares || 0;
              const pendentes = scale.pendentes_titulares || 0;
              const fillPct = Math.min(100, Math.round((totalTitulares / limite) * 100));

              const isPast = new Date(scale.data_hora).getTime() < Date.now();
              const dateObj = new Date(scale.data_hora);
              const formattedDate = dateObj.toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              });
              const formattedTime = dateObj.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <Card
                  key={scale.id}
                  className={cn(
                    "surface-card border transition-all duration-300 hover:shadow-xl flex flex-col justify-between group",
                    scale.status === "publicada"
                      ? "border-rose-500/30 hover:border-rose-500/60"
                      : scale.status === "em_andamento"
                      ? "border-amber-500/40 bg-amber-500/5 animate-pulse"
                      : scale.status === "cancelada"
                      ? "border-border/40 opacity-70"
                      : "border-border/60"
                  )}
                >
                  <CardHeader className="pb-3 border-b border-border/30">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[11px] font-semibold py-0.5 px-2 gap-1.5", typeCfg.color)}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        {typeCfg.label}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono uppercase tracking-wider py-0.5 px-2",
                          scale.status === "publicada"
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/40"
                            : scale.status === "em_andamento"
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold"
                            : scale.status === "concluida"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                            : scale.status === "cancelada"
                            ? "bg-rose-950/30 text-rose-400 border-rose-500/30"
                            : "bg-secondary text-muted-foreground border-border"
                        )}
                      >
                        {scale.status}
                      </Badge>
                    </div>

                    <CardTitle className="text-base font-black text-foreground pt-2 line-clamp-1 group-hover:text-rose-400 transition-colors">
                      {scale.titulo}
                    </CardTitle>

                    {/* GERENTE DA ESCALA */}
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg w-fit mt-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-muted-foreground font-normal">Gerente:</span>
                      <span className="truncate">{scale.gerente_nome || "Não Definido"}</span>
                      {isScaleManager(scale) && (
                        <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/20 px-1 rounded ml-1">
                          Você
                        </span>
                      )}
                    </div>

                    {scale.descricao && (canDetails || isScaleManager(scale)) && (
                      <CardDescription className="text-xs line-clamp-2 pt-0.5">
                        {scale.descricao}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4 flex-1">
                    {/* ALERTA DE PENDÊNCIA DE APROVAÇÃO (VISÍVEL PARA GERENTE / COMANDO) */}
                    {isScaleManager(scale) && (scale.pendentes_aprovacao_count || 0) > 0 && (
                      <div
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 font-bold animate-pulse cursor-pointer hover:bg-amber-500/25 transition-colors"
                        onClick={() => {
                          setSelectedScaleId(scale.id);
                          setDetailsModalOpen(true);
                        }}
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            {scale.pendentes_aprovacao_count} {scale.pendentes_aprovacao_count === 1 ? "membro aguardando" : "membros aguardando"} aprovação
                          </span>
                        </span>
                        <span className="text-[10px] uppercase font-mono underline">
                          Avaliar
                        </span>
                      </div>
                    )}

                    {/* DATA, HORÁRIO E LOCAL */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/40">
                        <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Início da Ação
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            {formattedDate} • {formattedTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/40">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            Ponto de Encontro
                          </span>
                          <span className="font-semibold text-foreground truncate block">
                            {scale.local_posto}
                          </span>
                        </div>
                      </div>
                    </div>

                    {scale.data_hora_chamada && (
                      <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                        <span>
                          Concentração & Rádio:{" "}
                          <strong>
                            {new Date(scale.data_hora_chamada).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </strong>
                        </span>
                      </div>
                    )}

                    {/* VAGAS E PROGRESSO */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-rose-400" />
                          Vagas Titulares:
                        </span>
                        <span className="font-mono text-foreground font-bold">
                          {totalTitulares} / {limite}
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            fillPct >= 100
                              ? "bg-rose-500"
                              : fillPct >= 70
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          )}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> {confirmados} Confirmados
                        </span>
                        {pendentes > 0 && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Clock className="w-3 h-3" /> {pendentes} Pendentes
                          </span>
                        )}
                        {scale.vagas_reservas > 0 && (
                          <span className="text-[10px] font-mono text-sky-400">
                            +{scale.total_reservas || 0}/{scale.vagas_reservas} Reservas
                          </span>
                        )}
                      </div>
                    </div>

                    {/* STATUS DO USUÁRIO LOGADO - SE JÁ ESCALADO */}
                    {scale.user_is_escalado && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-rose-300">
                            <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                            <span>Sua Vaga:</span>
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1 font-mono uppercase bg-rose-500/20 text-rose-300 border-rose-500/40"
                            >
                              {scale.user_tipo_vaga || "Titular"}
                            </Badge>
                            {scale.user_posto_funcao && (
                              <span className="text-[10px] text-muted-foreground font-normal">
                                ({scale.user_posto_funcao})
                              </span>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono py-0 font-bold",
                              scale.user_member_status === "confirmado"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : scale.user_member_status === "ausente"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            )}
                          >
                            {scale.user_member_status === "confirmado"
                              ? "Confirmado ✅"
                              : scale.user_member_status === "ausente"
                              ? "Ausente ❌"
                              : "Pendente ⏳"}
                          </Badge>
                        </div>

                        {/* Status de Aprovação do Gerente */}
                        <div className="flex items-center justify-between text-xs pt-0.5">
                          <span className="text-[11px] text-muted-foreground font-medium">Status de Aprovação:</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono py-0 font-bold",
                              scale.user_status_aprovacao === "aprovado"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : scale.user_status_aprovacao === "reprovado"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                            )}
                          >
                            {scale.user_status_aprovacao === "aprovado"
                              ? "Aprovado pelo Gerente ✅"
                              : scale.user_status_aprovacao === "reprovado"
                              ? "Reprovado pelo Gerente ❌"
                              : "Aguardando Aprovação ⏳"}
                          </Badge>
                        </div>

                        {scale.user_status_aprovacao === "pendente" && (
                          <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 p-2 rounded-lg flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              Sua vaga foi solicitada e aguarda validação do Gerente da Escala ({scale.gerente_nome || "Comando"}).
                            </span>
                          </div>
                        )}

                        {scale.user_status_aprovacao === "reprovado" && (
                          <div className="text-[11px] text-rose-300/90 bg-rose-500/10 border border-rose-500/25 p-2 rounded-lg flex items-start gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <span>Sua participação nesta ação foi <strong>reprovada</strong> pelo Gerente da Escala.</span>
                              {scale.user_motivo_reprovacao && (
                                <p className="text-[10px] text-rose-400 italic pt-0.5">Motivo: {scale.user_motivo_reprovacao}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {canConfirmPresence && scale.status !== "cancelada" && scale.status !== "concluida" && (
                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <Button
                              size="sm"
                              className={cn(
                                "text-[11px] font-bold gap-1 h-8 cursor-pointer px-2",
                                scale.user_member_status === "confirmado"
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                              )}
                              disabled={confirmPresenceMutation.isPending}
                              onClick={() =>
                                confirmPresenceMutation.mutate({
                                  scaleId: scale.id,
                                  status: "confirmado",
                                  reacao: "👍",
                                })
                              }
                            >
                              <Check className="w-3.5 h-3.5" />
                              Vou à Ação
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[11px] font-bold gap-1 h-8 border-rose-500/30 text-rose-300 hover:bg-rose-500/10 cursor-pointer px-2"
                              onClick={() => {
                                setAbsenceTargetScaleId(scale.id);
                                setAbsenceReason("");
                                setAbsenceModalOpen(true);
                              }}
                            >
                              <X className="w-3.5 h-3.5" />
                              Não Posso
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[11px] font-bold gap-1 h-8 text-zinc-400 hover:text-zinc-200 hover:bg-secondary cursor-pointer px-2"
                              title="Liberar vaga e sair da escala"
                              disabled={leaveScaleMutation.isPending}
                              onClick={() => leaveScaleMutation.mutate({ scaleId: scale.id })}
                            >
                              <DoorOpen className="w-3.5 h-3.5" />
                              Liberar
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* VAGAS ABERTAS E BOTÃO DE MARCAR / GARANTIR VAGA (PARA QUEM NÃO ESTÁ ESCALADO) */}
                    {canConfirmPresence && !scale.user_is_escalado && (scale.status === "publicada" || scale.status === "em_andamento") && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            Vagas Disponíveis
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400/90 font-bold">
                            {Math.max(0, (scale.vagas_limite || 10) - (scale.total_titulares || 0))} Titulares / {Math.max(0, (scale.vagas_reservas || 0) - (scale.total_reservas || 0))} Reservas
                          </span>
                        </div>

                        {Math.max(0, (scale.vagas_limite || 10) - (scale.total_titulares || 0)) > 0 ||
                        Math.max(0, (scale.vagas_reservas || 0) - (scale.total_reservas || 0)) > 0 ? (
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black gap-2 h-9 shadow-lg shadow-emerald-950/40 cursor-pointer"
                            onClick={() => handleOpenClaimModal(scale)}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                            ⚡ Garantir Minha Vaga na Ação
                          </Button>
                        ) : (
                          <div className="text-[11px] text-center text-amber-300/80 font-medium py-1">
                            Vagas esgotadas (Aguarde ausências ou substituições)
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>

                  {/* AÇÕES NO RODAPÉ DO CARD */}
                  <div className="p-4 pt-0 border-t border-border/20 mt-auto flex items-center justify-between gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold gap-1.5 cursor-pointer"
                      onClick={() => {
                        setSelectedScaleId(scale.id);
                        setDetailsModalOpen(true);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 text-rose-400" />
                      Ver Detalhes & Roster
                    </Button>

                    {/* Ações Rápidas de Gestão */}
                    {(((canPublish || isScaleManager(scale)) && scale.status === "rascunho") ||
                      ((canEdit || isScaleManager(scale)) && scale.status !== "cancelada" && scale.status !== "concluida") ||
                      ((canCancel || isScaleManager(scale)) && scale.status !== "cancelada" && scale.status !== "concluida") ||
                      canDelete) && (
                      <div className="flex items-center gap-1">
                        {(canPublish || isScaleManager(scale)) && scale.status === "rascunho" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                            title="Publicar Escala"
                            disabled={publishMutation.isPending}
                            onClick={() => publishMutation.mutate(scale.id)}
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {(canEdit || isScaleManager(scale)) && scale.status !== "cancelada" && scale.status !== "concluida" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Editar Escala"
                            onClick={() => handleOpenEditModal(scale)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {(canCancel || isScaleManager(scale)) && scale.status !== "cancelada" && scale.status !== "concluida" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Cancelar Escala"
                            onClick={() => {
                              setCancelTargetScaleId(scale.id);
                              setCancelReason("");
                              setCancelModalOpen(true);
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Excluir Escala"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(scale.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* MODAL 1: CRIAR OU EDITAR ESCALA                                                */}
      {/* ============================================================================== */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl surface-card border-rose-500/30 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <Swords className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {editScaleData ? "Editar Escala de Ação" : "Nova Escala de Ação Tática"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Defina os parâmetros da operação, data, ponto de encontro e limite de vagas para os operadores.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Título da Operação *
                </Label>
                <Input
                  placeholder="Ex: Assalto ao Banco Central, Dominação da Colina, Operação de Rua..."
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="font-bold text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo de Ação *
                </Label>
                <Select value={formTipoAcao} onValueChange={setFormTipoAcao}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <t.icon className="w-4 h-4 text-rose-400" />
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Local / Ponto de Encontro *
                </Label>
                <Input
                  placeholder="Ex: Sede Twin Wheels, Galpão 03, Píer..."
                  value={formLocalPosto}
                  onChange={(e) => setFormLocalPosto(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Data e Horário de Início *
                </Label>
                <Input
                  type="datetime-local"
                  value={formDataHora}
                  onChange={(e) => setFormDataHora(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Horário de Concentração / Rádio
                </Label>
                <Input
                  type="datetime-local"
                  value={formDataHoraChamada}
                  onChange={(e) => setFormDataHoraChamada(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              {(canManageSlots || (editScaleData && isScaleManager(editScaleData))) && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Limite de Vagas Titulares
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formVagasLimite}
                      onChange={(e) => setFormVagasLimite(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Vagas Reservas (Suplentes)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={formVagasReservas}
                      onChange={(e) => setFormVagasReservas(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </>
              )}

              {(canManageMembers || canCreate || isPrivileged) && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" />
                    Gerente / Líder da Escala (Responsável por Aprovar / Reprovar Membros)
                  </Label>
                  <Select value={formGerenteId} onValueChange={setFormGerenteId}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Selecione o gerente da escala..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="none">
                        Nenhum gerente designado (Somente Comando / Liderança)
                      </SelectItem>
                      {members.map((m) => {
                        const memberKey = m.id || m.user_id;
                        return (
                          <SelectItem key={memberKey} value={memberKey}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{m.nickname || m.nome}</span>
                              {m.game_id && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  (ID: {m.game_id})
                                </span>
                              )}
                              {m.cargo && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] py-0 px-1 border-border/50 text-muted-foreground"
                                >
                                  {m.cargo}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    O Gerente designado terá autoridade tática direta nesta operação para aprovar ou reprovar a inscrição e presença dos membros na ação.
                  </p>
                </div>
              )}

              {(canPublish || canCancel || canCreate || canManageMembers || (editScaleData && isScaleManager(editScaleData))) && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Status da Escala
                  </Label>
                  <Select value={formStatus} onValueChange={(v: any) => setFormStatus(v)}>
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho (Privado para Gestores)</SelectItem>
                      <SelectItem value="publicada">Publicada (Visível para Convocação)</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento (Operação Ativa)</SelectItem>
                      <SelectItem value="concluida">Concluída (Finalizada)</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Instruções Táticas, Armamento e Frequência
                </Label>
                <Textarea
                  placeholder="Ex: Colete obrigatório, 2x lockpicks por operador, arma primária Micro SMG / AK, frequência de rádio 420.5..."
                  rows={4}
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold gap-2 cursor-pointer shadow-md"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {editScaleData ? "Salvar Alterações" : "Criar Escala de Ação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================================== */}
      {/* MODAL 2: DETALHES COMPLETOS, ROSTER E HISTÓRICO                                */}
      {/* ============================================================================== */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl surface-card border-rose-500/30 max-h-[90vh] overflow-y-auto">
          {loadingSelectedScale || !selectedScale ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
              <p className="text-xs text-muted-foreground">Carregando detalhes do roster...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <DialogHeader className="border-b border-border/40 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 border-rose-500/30"
                      >
                        {selectedScale.tipo_acao}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono uppercase bg-secondary text-foreground"
                      >
                        {selectedScale.status}
                      </Badge>
                    </div>
                    <DialogTitle className="text-xl font-black text-foreground pt-1">
                      {selectedScale.titulo}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Criado por {selectedScale.criado_por_nome || "Comando"} em{" "}
                      {formatDate(selectedScale.criado_em)}
                    </DialogDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    {(canAddParticipants || isScaleManager(selectedScale)) && selectedScale.status !== "cancelada" && selectedScale.status !== "concluida" && (
                      <Button
                        size="sm"
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 cursor-pointer"
                        onClick={() => {
                          setAddSelectedMemberId("");
                          setAddPostoFuncao("Operacional");
                          setAddTipoVaga("titular");
                          setAddMemberModalOpen(true);
                        }}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Escalar Membro
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* DADOS LOGÍSTICOS DA AÇÃO */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1 block">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Gerente da Escala
                  </span>
                  <span className="font-bold text-foreground truncate text-sm block">
                    {selectedScale.gerente_nome || "Não Definido"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {isScaleManager(selectedScale) ? "👑 Você é o Gerente" : "Líder da Ação"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Horário da Ação
                  </span>
                  <span className="font-bold text-foreground font-mono text-sm block">
                    {new Date(selectedScale.data_hora).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(selectedScale.data_hora).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Concentração
                  </span>
                  <span className="font-bold text-amber-300 font-mono text-sm block">
                    {selectedScale.data_hora_chamada
                      ? new Date(selectedScale.data_hora_chamada).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Sem horário"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Check-in no rádio</span>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Local / Posição
                  </span>
                  <span className="font-bold text-foreground truncate text-sm block">
                    {selectedScale.local_posto}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Ponto de Encontro</span>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Quadro de Vagas
                  </span>
                  <span className="font-bold text-rose-400 font-mono text-sm block">
                    {(selectedScale.membros || []).filter((m) => m.tipo_vaga === "titular" && m.status_aprovacao !== "reprovado").length} /{" "}
                    {selectedScale.vagas_limite}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    +{selectedScale.vagas_reservas} Suplentes
                  </span>
                </div>
              </div>

              {/* ALERTA DE MEMBROS AGUARDANDO AVALIAÇÃO DO GERENTE DA ESCALA (SOMENTE GERENTES / LIDERANÇA) */}
              {(isScaleManager(selectedScale) || canManageMembers) &&
                (selectedScale.membros || []).filter((m) => m.status_aprovacao === "pendente").length > 0 &&
                selectedScale.status !== "cancelada" &&
                selectedScale.status !== "concluida" && (
                <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-extrabold text-amber-300 block text-sm">
                        {(selectedScale.membros || []).filter((m) => m.status_aprovacao === "pendente").length} operador(es) aguardando aprovação na ação!
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {isScaleManager(selectedScale)
                          ? "Você é o Gerente responsável. Utilize os botões [Aprovar] ou [Reprovar] no roster abaixo para validar a equipe."
                          : `As inscrições aguardam avaliação pelo Gerente da Escala (${selectedScale.gerente_nome || "Comando"}).`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* INSTRUÇÕES TÁTICAS */}
              {selectedScale.descricao && (
                <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-rose-300 block flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-rose-400" />
                    Briefing Tático & Instruções de Armamento
                  </span>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedScale.descricao}
                  </p>
                </div>
              )}

              {/* STATUS E AÇÕES DO USUÁRIO LOGADO NESTA ESCALA */}
              {selectedScale.status !== "cancelada" && selectedScale.status !== "concluida" && (
                <div
                  className={cn(
                    "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all",
                    selectedUserMember
                      ? "bg-rose-500/10 border-rose-500/30"
                      : "bg-emerald-500/10 border-emerald-500/30"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-foreground flex items-center gap-1.5 text-sm">
                        {selectedUserMember ? (
                          <>
                            <Crosshair className="w-4 h-4 text-rose-400" />
                            Sua Vaga: {selectedUserMember.tipo_vaga === "titular" ? "Titular Principal" : "Reserva"}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            Vagas Abertas na Ação
                          </>
                        )}
                      </span>
                      {selectedUserMember && (
                        <>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono py-0 font-bold",
                              selectedUserMember.status_presenca === "confirmado"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : selectedUserMember.status_presenca === "ausente"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            )}
                          >
                            {selectedUserMember.status_presenca === "confirmado"
                              ? "Confirmado ✅"
                              : selectedUserMember.status_presenca === "ausente"
                              ? "Ausente ❌"
                              : "Pendente ⏳"}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono py-0 font-bold",
                              selectedUserMember.status_aprovacao === "aprovado"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : selectedUserMember.status_aprovacao === "reprovado"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                            )}
                          >
                            {selectedUserMember.status_aprovacao === "aprovado"
                              ? "Aprovado pelo Gerente ✅"
                              : selectedUserMember.status_aprovacao === "reprovado"
                              ? "Reprovado pelo Gerente ❌"
                              : "Aguardando Aprovação ⏳"}
                          </Badge>
                        </>
                      )}
                    </div>

                    {selectedUserMember?.status_aprovacao === "pendente" && (
                      <p className="text-[11px] text-amber-300/90 font-medium">
                        ⏳ Sua inscrição foi registrada e aguarda aprovação do Gerente da Escala ({selectedScale.gerente_nome || "Comando"}).
                      </p>
                    )}

                    {selectedUserMember?.status_aprovacao === "reprovado" && (
                      <p className="text-[11px] text-rose-300/90 font-medium">
                        ❌ Sua participação nesta ação foi reprovada pelo Gerente da Escala.
                        {selectedUserMember.motivo_reprovacao && ` Motivo: ${selectedUserMember.motivo_reprovacao}`}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {selectedUserMember ? (
                        <>
                          Função escalada: <span className="text-foreground font-semibold">{selectedUserMember.posto_funcao}</span>
                          {selectedUserMember.justificativa_ausencia && (
                            <span className="text-rose-400 italic block pt-0.5">
                              Motivo da ausência: {selectedUserMember.justificativa_ausencia}
                            </span>
                          )}
                        </>
                      ) : (
                        `Esta ação possui ${Math.max(
                          0,
                          (selectedScale.vagas_limite || 10) -
                            (selectedScale.membros || []).filter(
                              (m) => m.tipo_vaga === "titular" && m.status_presenca !== "ausente"
                            ).length
                        )} vagas titulares e ${Math.max(
                          0,
                          (selectedScale.vagas_reservas || 0) -
                            (selectedScale.membros || []).filter(
                              (m) => m.tipo_vaga === "reserva" && m.status_presenca !== "ausente"
                            ).length
                        )} reservas disponíveis.`
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedUserMember ? (
                      canConfirmPresence && (
                        <>
                          <Button
                            size="sm"
                            className={cn(
                              "text-xs font-bold gap-1.5 h-8 cursor-pointer",
                              selectedUserMember.status_presenca === "confirmado"
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
                            )}
                            disabled={confirmPresenceMutation.isPending}
                            onClick={() =>
                              confirmPresenceMutation.mutate({
                                scaleId: selectedScale.id,
                                status: "confirmado",
                                reacao: "👍",
                              })
                            }
                          >
                            <Check className="w-3.5 h-3.5" />
                            {selectedUserMember.status_presenca === "confirmado" ? "Confirmado" : "Confirmar Presença"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs font-bold gap-1.5 h-8 border-rose-500/30 text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                            onClick={() => {
                              setAbsenceTargetScaleId(selectedScale.id);
                              setAbsenceReason("");
                              setAbsenceModalOpen(true);
                            }}
                          >
                            <X className="w-3.5 h-3.5" />
                            Não Posso Ir
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs font-bold gap-1.5 h-8 text-zinc-400 hover:text-zinc-200 hover:bg-secondary cursor-pointer"
                            title="Liberar vaga e sair da escala"
                            disabled={leaveScaleMutation.isPending}
                            onClick={() => leaveScaleMutation.mutate({ scaleId: selectedScale.id })}
                          >
                            <DoorOpen className="w-3.5 h-3.5" />
                            Liberar Vaga
                          </Button>
                        </>
                      )
                    ) : canConfirmPresence && (selectedScale.status === "publicada" || selectedScale.status === "em_andamento") ? (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold gap-2 text-xs h-9 shadow-lg shadow-emerald-950/40 cursor-pointer"
                        onClick={() => handleOpenClaimModal(selectedScale)}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        ⚡ Garantir Minha Vaga na Ação
                      </Button>
                    ) : null}
                  </div>
                </div>
              )}

              {/* ABAS ROSTER E HISTÓRICO */}
              <Tabs defaultValue="titulares" className="w-full">
                <TabsList className="bg-secondary/40 border border-border/40">
                  <TabsTrigger value="titulares" className="gap-2">
                    <Users className="w-4 h-4" />
                    Titulares (
                    {(selectedScale.membros || []).filter((m) => m.tipo_vaga === "titular").length})
                  </TabsTrigger>
                  <TabsTrigger value="reservas" className="gap-2">
                    <Shield className="w-4 h-4" />
                    Reservas (
                    {(selectedScale.membros || []).filter((m) => m.tipo_vaga === "reserva").length})
                  </TabsTrigger>
                  {canViewHistory && (
                    <TabsTrigger value="historico" className="gap-2">
                      <History className="w-4 h-4" />
                      Histórico / Logs ({scaleHistory.length})
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* ABA TITULARES */}
                <TabsContent value="titulares" className="space-y-3 pt-3">
                  {(selectedScale.membros || []).filter((m) => m.tipo_vaga === "titular").length ===
                  0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      Nenhum membro escalado como titular ainda.
                    </div>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {(selectedScale.membros || [])
                        .filter((m) => m.tipo_vaga === "titular")
                        .map((member) => (
                          <div
                            key={member.id}
                            className="p-3 rounded-xl border border-border/50 bg-secondary/20 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center font-bold text-rose-400 shrink-0 overflow-hidden">
                                {member.avatar_url ? (
                                  <img
                                    src={member.avatar_url}
                                    alt={member.nome}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  (member.nickname || member.nome).slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <div className="font-bold text-xs text-foreground truncate flex items-center gap-1.5">
                                  <span>{member.nickname || member.nome}</span>
                                  {member.reacao && <span>{member.reacao}</span>}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] py-0 px-1 border-rose-500/30 text-rose-400"
                                  >
                                    {member.posto_funcao}
                                  </Badge>

                                  <span
                                    className={cn(
                                      "font-medium",
                                      member.status_presenca === "confirmado"
                                        ? "text-emerald-400"
                                        : member.status_presenca === "ausente"
                                        ? "text-rose-400"
                                        : member.status_presenca === "substituido"
                                        ? "text-sky-400"
                                        : "text-amber-400"
                                    )}
                                  >
                                    {member.status_presenca === "confirmado"
                                      ? "Confirmado"
                                      : member.status_presenca === "ausente"
                                      ? "Ausente"
                                      : member.status_presenca === "substituido"
                                      ? "Substituído"
                                      : "Pendente"}
                                  </span>

                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] py-0 px-1 font-mono uppercase font-bold",
                                      member.status_aprovacao === "aprovado"
                                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                        : member.status_aprovacao === "reprovado"
                                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                        : "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse"
                                    )}
                                  >
                                    {member.status_aprovacao === "aprovado"
                                      ? "Aprovado ✅"
                                      : member.status_aprovacao === "reprovado"
                                      ? "Reprovado ❌"
                                      : "Aguardando Avaliação ⏳"}
                                  </Badge>
                                </div>

                                {member.status_aprovacao === "reprovado" && member.motivo_reprovacao && (
                                  <p className="text-[10px] text-rose-400 italic truncate max-w-[220px]">
                                    Motivo: {member.motivo_reprovacao}
                                  </p>
                                )}

                                {member.justificativa_ausencia && (
                                  <p className="text-[10px] text-rose-400 italic truncate max-w-[220px]">
                                    Ausência: {member.justificativa_ausencia}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Botões do Membro */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Ações de Aprovação do Gerente da Escala */}
                              {(isScaleManager(selectedScale) || canManageMembers) && selectedScale.status !== "cancelada" && selectedScale.status !== "concluida" && (
                                <>
                                  {member.status_aprovacao !== "aprovado" && (
                                    <Button
                                      size="sm"
                                      className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 px-2 cursor-pointer shadow-sm"
                                      title="Aprovar operador na ação"
                                      disabled={reviewMemberMutation.isPending}
                                      onClick={() =>
                                        reviewMemberMutation.mutate({
                                          scaleId: selectedScale.id,
                                          memberId: member.member_id,
                                          statusAprovacao: "aprovado",
                                        })
                                      }
                                    >
                                      <Check className="w-3 h-3" />
                                      Aprovar
                                    </Button>
                                  )}

                                  {member.status_aprovacao !== "reprovado" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[10px] border-rose-500/40 text-rose-300 hover:bg-rose-500/10 font-bold gap-1 px-2 cursor-pointer"
                                      title="Reprovar operador na ação"
                                      onClick={() => {
                                        setReproveTargetMember(member);
                                        setReproveMotivo("");
                                        setReproveModalOpen(true);
                                      }}
                                    >
                                      <X className="w-3 h-3" />
                                      Reprovar
                                    </Button>
                                  )}
                                </>
                              )}

                              {(canSubstitute || isScaleManager(selectedScale)) && member.status_presenca === "ausente" && selectedScale.status !== "cancelada" && selectedScale.status !== "concluida" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px] border-amber-500/40 text-amber-300 hover:bg-amber-500/10 px-2 cursor-pointer"
                                  onClick={() => {
                                    setSubstituteTargetMember(member);
                                    setSubSelectedMemberId("");
                                    setSubMotivo("");
                                    setSubstituteModalOpen(true);
                                  }}
                                >
                                  Substituir
                                </Button>
                              )}

                              {(canRemoveParticipants || isScaleManager(selectedScale)) && selectedScale.status !== "cancelada" && selectedScale.status !== "concluida" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                  title="Remover da escala"
                                  onClick={() =>
                                    removeMemberMutation.mutate({
                                      scaleId: selectedScale.id,
                                      memberId: member.member_id,
                                    })
                                  }
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>

                {/* ABA RESERVAS */}
                <TabsContent value="reservas" className="space-y-3 pt-3">
                  {(selectedScale.membros || []).filter((m) => m.tipo_vaga === "reserva").length ===
                  0 ? (
                    <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      Nenhum membro na lista de reservas no momento.
                    </div>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {(selectedScale.membros || [])
                        .filter((m) => m.tipo_vaga === "reserva")
                        .map((member) => (
                          <div
                            key={member.id}
                            className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 shrink-0 overflow-hidden">
                                {member.avatar_url ? (
                                  <img
                                    src={member.avatar_url}
                                    alt={member.nome}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  (member.nickname || member.nome).slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <div className="font-bold text-xs text-foreground truncate flex items-center gap-1.5">
                                  <span>{member.nickname || member.nome}</span>
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] py-0 px-1 border-sky-500/40 text-sky-300"
                                  >
                                    Reserva
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                  <span className="text-muted-foreground">{member.posto_funcao}</span>
                                  <span>•</span>
                                  <span
                                    className={
                                      member.status_presenca === "confirmado"
                                        ? "text-emerald-400 font-medium"
                                        : "text-amber-400 font-medium"
                                    }
                                  >
                                    {member.status_presenca}
                                  </span>

                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] py-0 px-1 font-mono uppercase font-bold",
                                      member.status_aprovacao === "aprovado"
                                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                        : member.status_aprovacao === "reprovado"
                                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                        : "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse"
                                    )}
                                  >
                                    {member.status_aprovacao === "aprovado"
                                      ? "Aprovado ✅"
                                      : member.status_aprovacao === "reprovado"
                                      ? "Reprovado ❌"
                                      : "Aguardando Avaliação ⏳"}
                                  </Badge>
                                </div>

                                {member.status_aprovacao === "reprovado" && member.motivo_reprovacao && (
                                  <p className="text-[10px] text-rose-400 italic truncate max-w-[220px]">
                                    Motivo: {member.motivo_reprovacao}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Ações de Aprovação do Gerente da Escala para Reservas */}
                              {(isScaleManager(selectedScale) || canManageMembers) && selectedScale.status !== "cancelada" && selectedScale.status !== "concluida" && (
                                <>
                                  {member.status_aprovacao !== "aprovado" && (
                                    <Button
                                      size="sm"
                                      className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 px-2 cursor-pointer shadow-sm"
                                      title="Aprovar reserva na ação"
                                      disabled={reviewMemberMutation.isPending}
                                      onClick={() =>
                                        reviewMemberMutation.mutate({
                                          scaleId: selectedScale.id,
                                          memberId: member.member_id,
                                          statusAprovacao: "aprovado",
                                        })
                                      }
                                    >
                                      <Check className="w-3 h-3" />
                                      Aprovar
                                    </Button>
                                  )}

                                  {member.status_aprovacao !== "reprovado" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[10px] border-rose-500/40 text-rose-300 hover:bg-rose-500/10 font-bold gap-1 px-2 cursor-pointer"
                                      title="Reprovar reserva na ação"
                                      onClick={() => {
                                        setReproveTargetMember(member);
                                        setReproveMotivo("");
                                        setReproveModalOpen(true);
                                      }}
                                    >
                                      <X className="w-3 h-3" />
                                      Reprovar
                                    </Button>
                                  )}
                                </>
                              )}

                              {(canRemoveParticipants || isScaleManager(selectedScale)) && selectedScale.status !== "cancelada" && selectedScale.status !== "concluida" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                  onClick={() =>
                                    removeMemberMutation.mutate({
                                      scaleId: selectedScale.id,
                                      memberId: member.member_id,
                                    })
                                  }
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>

                {/* ABA HISTÓRICO */}
                {canViewHistory && (
                  <TabsContent value="historico" className="space-y-2 pt-3">
                    {scaleHistory.length === 0 ? (
                      <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                        Nenhum registro de log registrado para esta escala.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40 border border-border/40 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                        {scaleHistory.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 text-xs flex items-start justify-between gap-3 hover:bg-secondary/20 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <p className="font-semibold text-foreground">{item.details}</p>
                              <span className="text-[10px] text-muted-foreground">
                                Por {item.actor_name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================================== */}
      {/* MODAL 2.5: GARANTIR / MARCAR VAGA NA ESCALA                                    */}
      {/* ============================================================================== */}
      <Dialog open={claimSlotModalOpen} onOpenChange={setClaimSlotModalOpen}>
        <DialogContent className="max-w-md surface-card border-emerald-500/40">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Garantir Minha Vaga na Ação
            </DialogTitle>
            <DialogDescription className="text-xs">
              {claimSlotScale?.titulo} — {claimSlotScale?.local_posto}
            </DialogDescription>
          </DialogHeader>

          {claimSlotScale && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Horário da Ação:</span>
                  <span className="font-mono font-bold text-foreground">
                    {new Date(claimSlotScale.data_hora).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ({new Date(claimSlotScale.data_hora).toLocaleDateString("pt-BR")})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Vagas Titulares Livres:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {Math.max(0, (claimSlotScale.vagas_limite || 10) - (claimSlotScale.total_titulares || 0))} vagas
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Vagas Reservas Livres:</span>
                  <span className="font-mono font-bold text-sky-400">
                    {Math.max(0, (claimSlotScale.vagas_reservas || 0) - (claimSlotScale.total_reservas || 0))} vagas
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sua Função / Posto Tático *
                </Label>
                <Select value={claimPostoFuncao} onValueChange={setClaimPostoFuncao}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSTOS_FUNCAO.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <p.icon className="w-3.5 h-3.5" />
                          <span>{p.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo de Vaga Desejada *
                </Label>
                <Select value={claimTipoVaga} onValueChange={(v: any) => setClaimTipoVaga(v)}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="titular">
                      Vaga Titular (Escalado Principal - se disponível)
                    </SelectItem>
                    <SelectItem value="reserva">
                      Vaga Reserva (Suplente em Espera)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setClaimSlotModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold gap-1.5"
              disabled={claimSlotMutation.isPending}
              onClick={() => claimSlotMutation.mutate()}
            >
              {claimSlotMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirmar Minha Vaga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================================== */}
      {/* MODAL 3: ADICIONAR MEMBRO À ESCALA                                             */}
      {/* ============================================================================== */}
      <Dialog open={addMemberModalOpen} onOpenChange={setAddMemberModalOpen}>
        <DialogContent className="max-w-md surface-card border-rose-500/30">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-rose-400" />
              Escalar Operador para Ação
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione o membro da facção e atribua o posto/função tática nesta ação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Membro da Facção *
              </Label>
              <Select value={addSelectedMemberId} onValueChange={setAddSelectedMemberId}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Selecione o membro da facção..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {members.map((m) => {
                    const memberKey = m.id || m.user_id;
                    const isAlreadyIn = (selectedScale?.membros || []).some(
                      (sm) =>
                        sm.member_id === memberKey ||
                        sm.user_id === m.user_id ||
                        (m.id && sm.member_id === m.id)
                    );
                    return (
                      <SelectItem key={memberKey} value={memberKey} disabled={isAlreadyIn}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{m.nickname || m.nome}</span>
                            {m.game_id && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                (ID: {m.game_id})
                              </span>
                            )}
                            {m.nivel && (
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0 px-1 border-border/50 text-muted-foreground capitalize"
                              >
                                {m.nivel}
                              </Badge>
                            )}
                          </div>
                          {isAlreadyIn && (
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0 px-1 border-rose-500/40 text-rose-400 bg-rose-500/10"
                            >
                              Já Escalado
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Posto / Função Tática *
              </Label>
              <Select value={addPostoFuncao} onValueChange={setAddPostoFuncao}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSTOS_FUNCAO.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <p.icon className="w-3.5 h-3.5" />
                        <span>{p.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                3. Tipo de Vaga *
              </Label>
              <Select value={addTipoVaga} onValueChange={(v: any) => setAddTipoVaga(v)}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="titular">Vaga Titular (Escalado Principal)</SelectItem>
                  <SelectItem value="reserva">Vaga Reserva (Suplente / Em Espera)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddMemberModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold gap-1.5"
              disabled={!addSelectedMemberId || addMemberMutation.isPending}
              onClick={() => addMemberMutation.mutate()}
            >
              {addMemberMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirmar Escalação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================================== */}
      {/* MODAL 4: SUBSTITUIR MEMBRO AUSENTE                                             */}
      {/* ============================================================================== */}
      <Dialog open={substituteModalOpen} onOpenChange={setSubstituteModalOpen}>
        <DialogContent className="max-w-md surface-card border-amber-500/40">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 text-amber-300">
              <RefreshCw className="w-5 h-5 text-amber-400" />
              Substituir Membro Ausente
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione o operador suplente que assumirá a vaga de{" "}
              <strong>
                {substituteTargetMember?.nickname || substituteTargetMember?.nome}
              </strong>{" "}
              ({substituteTargetMember?.posto_funcao}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Operador Substituto *
              </Label>
              <Select value={subSelectedMemberId} onValueChange={setSubSelectedMemberId}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Selecione o substituto..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {members
                    .filter((m) => {
                      const memberKey = m.id || m.user_id;
                      return (
                        memberKey !== substituteTargetMember?.member_id &&
                        m.user_id !== substituteTargetMember?.user_id &&
                        !(selectedScale?.membros || []).some(
                          (sm) =>
                            (sm.member_id === memberKey || sm.user_id === m.user_id) &&
                            sm.status_presenca !== "ausente"
                        )
                      );
                    })
                    .map((m) => {
                      const memberKey = m.id || m.user_id;
                      return (
                        <SelectItem key={memberKey} value={memberKey}>
                          <div className="flex items-center gap-2">
                            <span>{m.nickname || m.nome}</span>
                            {m.game_id && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                (ID: {m.game_id})
                              </span>
                            )}
                            {m.nivel && (
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0 px-1 border-border/50 text-muted-foreground capitalize"
                              >
                                {m.nivel}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Motivo da Substituição *
              </Label>
              <Input
                placeholder="Ex: Titular impossibilitado, chamado no rádio, emergência..."
                value={subMotivo}
                onChange={(e) => setSubMotivo(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSubstituteModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold gap-1.5"
              disabled={!subSelectedMemberId || !subMotivo.trim() || substituteMutation.isPending}
              onClick={() => substituteMutation.mutate()}
            >
              {substituteMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirmar Substituição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================================== */}
      {/* MODAL 5: JUSTIFICAR AUSÊNCIA NA ESCALA                                         */}
      {/* ============================================================================== */}
      <Dialog open={absenceModalOpen} onOpenChange={setAbsenceModalOpen}>
        <DialogContent className="max-w-md surface-card border-rose-500/40">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 text-rose-400">
              <UserX className="w-5 h-5 text-rose-400" />
              Justificar Ausência na Ação
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informe a justificativa pela qual você não poderá comparecer a esta ação convocada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Motivo da Ausência *
              </Label>
              <Textarea
                placeholder="Descreva o motivo (ex: Trabalho fora da cidade, compromisso familiar, imprevisto de horário)..."
                rows={3}
                value={absenceReason}
                onChange={(e) => setAbsenceReason(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAbsenceModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold gap-1.5"
              disabled={!absenceReason.trim() || confirmPresenceMutation.isPending}
              onClick={() => {
                if (absenceTargetScaleId) {
                  confirmPresenceMutation.mutate({
                    scaleId: absenceTargetScaleId,
                    status: "ausente",
                    reacao: "❌",
                    justificativa: absenceReason.trim(),
                  });
                }
              }}
            >
              {confirmPresenceMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Registrar Ausência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================================== */}
      {/* MODAL 6: CANCELAR ESCALA DE AÇÃO                                               */}
      {/* ============================================================================== */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md surface-card border-rose-500/40">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Cancelar Escala de Ação
            </DialogTitle>
            <DialogDescription className="text-xs">
              O cancelamento desmobilizará os membros convocados e registrará um log de auditoria permanente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Motivo do Cancelamento *
              </Label>
              <Textarea
                placeholder="Informe o motivo oficial do cancelamento da operação..."
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Voltar
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold gap-1.5"
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {cancelMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================================== */}
      {/* MODAL 7: REPROVAR MEMBRO DA ESCALA (GERENTE DA ESCALA OU COMANDO)              */}
      {/* ============================================================================== */}
      <Dialog open={reproveModalOpen} onOpenChange={setReproveModalOpen}>
        <DialogContent className="max-w-md surface-card border-rose-500/40">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 text-rose-400">
              <UserX className="w-5 h-5 text-rose-400" />
              Reprovar Participação na Ação
            </DialogTitle>
            <DialogDescription className="text-xs">
              Você está definindo como <strong>reprovado</strong> o operador{" "}
              <strong>{reproveTargetMember?.nickname || reproveTargetMember?.nome}</strong>{" "}
              ({reproveTargetMember?.posto_funcao}) para esta ação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Motivo da Reprovação (Opcional)
              </Label>
              <Textarea
                placeholder="Informe o motivo para o operador (ex: Falta de armamento/colete exigido, conduta recente, vaga priorizada para outra função)..."
                rows={3}
                value={reproveMotivo}
                onChange={(e) => setReproveMotivo(e.target.value)}
                className="text-xs resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                O motivo informado ficará registrado no histórico da escala e visível para o membro.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReproveModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold gap-1.5 cursor-pointer"
              disabled={reviewMemberMutation.isPending}
              onClick={() => {
                if (selectedScaleId && reproveTargetMember) {
                  reviewMemberMutation.mutate({
                    scaleId: selectedScaleId,
                    memberId: reproveTargetMember.member_id,
                    statusAprovacao: "reprovado",
                    motivo: reproveMotivo.trim(),
                  });
                }
              }}
            >
              {reviewMemberMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Confirmar Reprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
