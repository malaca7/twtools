import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Sliders,
  Sparkles,
  Shield,
  Search,
  Check,
  X,
  Trash2,
  UserPlus,
  Send,
  Loader2,
  ExternalLink,
  Award,
  Crown,
  Star,
  Flame,
  Zap,
  Tag as TagIcon,
  HelpCircle,
  RefreshCw,
  Eye,
  Calendar,
  ShieldAlert,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader, EmptyState, TableSkeleton, CeoBadge, DevBadge } from "@/components/ui-kit";
import { CeoGuard } from "@/guards/CeoGuard";
import { useAuth } from "@/hooks/useAuth";
import { useMembers, useCustomRoles } from "@/hooks/useData";
import { useMemberTags } from "@/hooks/useMemberTags";
import {
  useVerificationConfig,
  useVerificationRequests,
  useMemberVerifications,
  useVerificationAuditLogs,
  useVerificationMutations,
} from "@/hooks/useVerificationBadge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { dateTime, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { VerificationRequest, MemberVerification, CustomRequirementItem } from "@/services/verificationBadgeService";

export const Route = createFileRoute("/_authenticated/ceo/selos")({
  component: CeoSelosRouteWrapper,
});

function CeoSelosRouteWrapper() {
  return (
    <CeoGuard>
      <CeoSelosPage />
    </CeoGuard>
  );
}

const AVAILABLE_ICONS = [
  { id: "BadgeCheck", label: "Badge Oficial", Icon: BadgeCheck },
  { id: "ShieldCheck", label: "Escudo Seguro", Icon: ShieldCheck },
  { id: "CheckCircle2", label: "Círculo Check", Icon: CheckCircle2 },
  { id: "Sparkles", label: "Brilho Mágico", Icon: Sparkles },
  { id: "Crown", label: "Coroa Real", Icon: Crown },
  { id: "Star", label: "Estrela Dourada", Icon: Star },
  { id: "Flame", label: "Chama Fogo", Icon: Flame },
  { id: "Zap", label: "Raio Elétrico", Icon: Zap },
];

const PRESET_COLORS = [
  { label: "Sky (Padrão)", color: "#38bdf8", glow: "cyan" },
  { label: "Esmeralda", color: "#10b981", glow: "emerald" },
  { label: "Ouro", color: "#f59e0b", glow: "gold" },
  { label: "Púrpura", color: "#a855f7", glow: "purple" },
  { label: "Rosa Neon", color: "#f43f5e", glow: "rose" },
  { label: "Branco / Clean", color: "#f8fafc", glow: "none" },
];

export function CeoSelosPage() {
  const { hasPermission, isDevUser, isCeoUser, level, panelMode } = useAuth();

  // Determina o painel ativo de permissões:
  const effectivePanel: "dev" | "ceo" | "member" =
    isDevUser && panelMode === "dev"
      ? "dev"
      : isCeoUser
      ? "ceo"
      : "member";

  // Permissões Granulares de Verificação no painel efetivo
  const canManage = hasPermission("verification.manage", effectivePanel);
  const canReview = hasPermission("verification.review", effectivePanel);
  const canGrant = hasPermission("verification.grant_direct", effectivePanel);
  const canRevoke = hasPermission("verification.revoke", effectivePanel);
  const canConfig = hasPermission("verification.config", effectivePanel);
  const canRequirements = hasPermission("verification.requirements", effectivePanel);
  const canAudit = hasPermission("verification.audit", effectivePanel);
  const canView = canManage;

  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const { data: tags = [] } = useMemberTags();
  const { data: dbCustomRoles = [] } = useCustomRoles();

  const { data: config, isLoading: loadingConfig } = useVerificationConfig();
  const { data: requests = [], isLoading: loadingRequests } = useVerificationRequests("all");
  const { data: verifications = [], isLoading: loadingVerifications } = useMemberVerifications();
  const { data: auditLogs = [], isLoading: loadingAudit } = useVerificationAuditLogs(60);

  const {
    updateConfigMutation,
    reviewRequestMutation,
    grantDirectMutation,
    revokeMutation,
  } = useVerificationMutations();

  // Tab State (Aba "cargos" autorizações foi removida)
  const [activeTab, setActiveTab] = useState<"pendentes" | "verificados" | "configuracao" | "auditoria">("pendentes");

  // Filtros
  const [memberSearch, setMemberSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");

  // Modal de Análise (Aprovar / Rejeitar)
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [customTitle, setCustomTitle] = useState("Verificado Oficial");
  const [reviewBadgeColor, setReviewBadgeColor] = useState("");

  // Modal de Concessão Direta
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [directTargetUserId, setDirectTargetUserId] = useState("");
  const [directCustomTitle, setDirectCustomTitle] = useState("Verificado Oficial");
  const [directColor, setDirectColor] = useState("");
  const [directNotes, setDirectNotes] = useState("");
  const [directSearch, setDirectSearch] = useState("");

  // Modal de Revogação
  const [revokingMember, setRevokingMember] = useState<MemberVerification | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  // Modal de Criação de Requisito Personalizado
  const [isAddReqModalOpen, setIsAddReqModalOpen] = useState(false);
  const [newReqTitle, setNewReqTitle] = useState("");
  const [newReqDescription, setNewReqDescription] = useState("");
  const [newReqRequired, setNewReqRequired] = useState(true);

  // Config Form State
  const [formName, setFormName] = useState(config?.badge_name || "Verificado");
  const [formDescription, setFormDescription] = useState(config?.badge_description || "");
  const [formIcon, setFormIcon] = useState(config?.badge_icon || "BadgeCheck");
  const [formColor, setFormColor] = useState(config?.badge_color || "#38bdf8");
  const [formGlow, setFormGlow] = useState(config?.glow_style || "cyan");
  const [formTooltip, setFormTooltip] = useState(config?.tooltip_text || "Membro Oficial Verificado");
  const [formRequireDiscord, setFormRequireDiscord] = useState(config?.requirements_config?.require_discord ?? true);
  const [formRequireGameId, setFormRequireGameId] = useState(config?.requirements_config?.require_game_id ?? true);
  const [formRequirePhone, setFormRequirePhone] = useState(config?.requirements_config?.require_phone ?? false);
  const [formMinLevel, setFormMinLevel] = useState<number>(config?.requirements_config?.min_gamification_level ?? 3);
  const [formMinDays, setFormMinDays] = useState<number>(config?.requirements_config?.min_days_in_faction ?? 0);
  const [formCustomInstructions, setFormCustomInstructions] = useState<string>(
    config?.requirements_config?.custom_instructions || ""
  );
  const [formCustomRequirements, setFormCustomRequirements] = useState<CustomRequirementItem[]>(
    config?.requirements_config?.custom_requirements || []
  );
  const [formAllowSelfRequest, setFormAllowSelfRequest] = useState(config?.allow_self_request ?? true);
  const [formAuthorizedRoles, setFormAuthorizedRoles] = useState<string[]>(config?.authorized_roles || ["ceo", "desenvolvedor", "01", "02", "gerente"]);
  const [formAuthorizedTags, setFormAuthorizedTags] = useState<string[]>(config?.authorized_tags || []);

  // Sincroniza form quando config carrega
  useMemo(() => {
    if (config) {
      setFormName(config.badge_name || "Verificado");
      setFormDescription(config.badge_description || "");
      setFormIcon(config.badge_icon || "BadgeCheck");
      setFormColor(config.badge_color || "#38bdf8");
      setFormGlow(config.glow_style || "cyan");
      setFormTooltip(config.tooltip_text || "Membro Oficial Verificado");
      setFormRequireDiscord(config.requirements_config?.require_discord ?? true);
      setFormRequireGameId(config.requirements_config?.require_game_id ?? true);
      setFormRequirePhone(config.requirements_config?.require_phone ?? false);
      setFormMinLevel(config.requirements_config?.min_gamification_level ?? 3);
      setFormMinDays(config.requirements_config?.min_days_in_faction ?? 0);
      setFormCustomInstructions(config.requirements_config?.custom_instructions || "");
      setFormCustomRequirements(config.requirements_config?.custom_requirements || []);
      setFormAllowSelfRequest(config.allow_self_request ?? true);
      setFormAuthorizedRoles(config.authorized_roles || ["ceo", "desenvolvedor", "01", "02", "gerente"]);
      setFormAuthorizedTags(config.authorized_tags || []);
    }
  }, [config]);

  // Contadores
  const pendingRequests = useMemo(() => requests.filter((r) => r.status === "pendente"), [requests]);
  const activeVerifications = useMemo(() => verifications.filter((v) => v.is_verified), [verifications]);

  // Lista filtrada de solicitações
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (!requestSearch) return true;
      const q = requestSearch.toLowerCase();
      const nameMatch = (r.member?.nome || "").toLowerCase().includes(q);
      const nickMatch = (r.member?.nickname || "").toLowerCase().includes(q);
      const discordMatch = (r.member?.discord_username || "").toLowerCase().includes(q);
      const reasonMatch = r.reason.toLowerCase().includes(q);
      return nameMatch || nickMatch || discordMatch || reasonMatch;
    });
  }, [requests, requestSearch]);

  // Lista filtrada de membros verificados
  const filteredVerifications = useMemo(() => {
    return activeVerifications.filter((v) => {
      if (!memberSearch) return true;
      const q = memberSearch.toLowerCase();
      const nameMatch = (v.member?.nome || "").toLowerCase().includes(q);
      const nickMatch = (v.member?.nickname || "").toLowerCase().includes(q);
      const discordMatch = (v.member?.discord_username || "").toLowerCase().includes(q);
      const idMatch = (v.member?.game_id || "").includes(q);
      return nameMatch || nickMatch || discordMatch || idMatch;
    });
  }, [activeVerifications, memberSearch]);

  // Membros elegíveis para concessão direta (que ainda não são verificados)
  const unverifiedMembers = useMemo(() => {
    const verifiedUserIds = new Set(activeVerifications.map((v) => v.user_id));
    return members.filter((m) => {
      if (verifiedUserIds.has(m.user_id) || (m as any).is_verified) return false;
      if (m.user_id === directTargetUserId) return true;
      if (!directSearch) return true;
      const q = directSearch.toLowerCase();
      return (
        (m.nome || "").toLowerCase().includes(q) ||
        (m.nickname || "").toLowerCase().includes(q) ||
        (m.game_id || "").toLowerCase().includes(q) ||
        ((m as any).discord_username || "").toLowerCase().includes(q)
      );
    });
  }, [members, activeVerifications, directSearch, directTargetUserId]);

  const selectedDirectMember = useMemo(() => {
    return members.find((m) => m.user_id === directTargetUserId);
  }, [members, directTargetUserId]);

  // Gerenciar Requisitos Personalizados
  const handleAddCustomReq = () => {
    if (!newReqTitle.trim()) return;
    const newReq: CustomRequirementItem = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: newReqTitle.trim(),
      description: newReqDescription.trim(),
      is_required: newReqRequired,
    };
    setFormCustomRequirements((prev) => [...prev, newReq]);
    setNewReqTitle("");
    setNewReqDescription("");
    setNewReqRequired(true);
    setIsAddReqModalOpen(false);
  };

  const handleToggleCustomReq = (id: string) => {
    setFormCustomRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_required: !r.is_required } : r))
    );
  };

  const handleDeleteCustomReq = (id: string) => {
    setFormCustomRequirements((prev) => prev.filter((r) => r.id !== id));
  };

  // Salvar Configurações Gerais & Requisitos
  const handleSaveConfig = async () => {
    await updateConfigMutation.mutateAsync({
      badge_name: formName.trim(),
      badge_description: formDescription.trim(),
      badge_icon: formIcon,
      badge_color: formColor,
      glow_style: formGlow,
      tooltip_text: formTooltip.trim(),
      allow_self_request: formAllowSelfRequest,
      requirements_config: {
        require_discord: formRequireDiscord,
        require_game_id: formRequireGameId,
        require_phone: formRequirePhone,
        min_days_in_faction: Number(formMinDays) || 0,
        min_gamification_level: Number(formMinLevel) || 0,
        allowed_roles: [],
        allowed_tags: [],
        custom_instructions: formCustomInstructions.trim(),
        custom_requirements: formCustomRequirements,
      },
      authorized_roles: formAuthorizedRoles,
      authorized_tags: formAuthorizedTags,
    });
  };

  // Processar Análise de Solicitação
  const handleConfirmReview = async () => {
    if (!selectedRequest) return;
    await reviewRequestMutation.mutateAsync({
      requestId: selectedRequest.id,
      approve: reviewAction === "approve",
      notes: reviewNotes.trim() || undefined,
      customTitle: customTitle.trim() || undefined,
      badgeColor: reviewBadgeColor.trim() || undefined,
    });
    setSelectedRequest(null);
    setReviewNotes("");
  };

  // Processar Concessão Direta
  const handleConfirmDirect = async () => {
    if (!directTargetUserId) return;
    await grantDirectMutation.mutateAsync({
      targetUserId: directTargetUserId,
      customTitle: directCustomTitle.trim() || undefined,
      badgeColor: directColor.trim() || undefined,
      notes: directNotes.trim() || undefined,
    });
    setIsDirectModalOpen(false);
    setDirectTargetUserId("");
    setDirectNotes("");
  };

  // Processar Revogação
  const handleConfirmRevoke = async () => {
    if (!revokingMember) return;
    await revokeMutation.mutateAsync({
      targetUserId: revokingMember.user_id,
      reason: revokeReason.trim() || "Selo revogado pela administração.",
    });
    setRevokingMember(null);
    setRevokeReason("");
  };

  // Garante que abas restritas não permaneçam ativas se o membro perder a permissão
  useEffect(() => {
    if (!canConfig && !canRequirements && activeTab === "configuracao") {
      setActiveTab("pendentes");
    } else if (!canAudit && activeTab === "auditoria") {
      setActiveTab("pendentes");
    }
  }, [canConfig, canRequirements, canAudit, activeTab]);

  // Bloqueio de acesso para membros sem permissão de visualização/gerenciamento
  if (!canView) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Gerenciar Selos & Verificações"
          description="Controle e personalização completa do Selo de Verificado da Twin Wheels."
        />
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 rounded-2xl bg-card border border-border/60 shadow-sm">
          <div className="p-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-sm">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">Acesso ao Módulo de Selos Restrito</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Você não possui permissão para visualizar ou gerenciar os Selos de Verificação. Entre em contato com a liderança para liberar seu acesso.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Gerenciar Selos (Central CEO)"
        description="Painel da Diretoria — Controle executivo do Selo de Verificado da Twin Wheels, aprovação de solicitações, concessões, revogações, requisitos e auditoria."
        actions={
          canGrant ? (
            <Button
              type="button"
              onClick={() => {
                setDirectTargetUserId("");
                setIsDirectModalOpen(true);
              }}
              className="h-9 px-4 text-xs rounded-xl font-extrabold bg-sky-500 hover:bg-sky-600 text-white gap-2 shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Conceder Selo Direto</span>
            </Button>
          ) : undefined
        }
      />

      {/* CARDS DE MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="surface-card border-border/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Membros Verificados</span>
            <BadgeCheck className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-foreground">{activeVerifications.length}</p>
          <span className="text-[10px] text-muted-foreground">Selo ativo no sistema</span>
        </Card>

        <Card className="surface-card border-border/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Solicitações Pendentes</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{pendingRequests.length}</p>
          <span className="text-[10px] text-muted-foreground">Aguardando análise</span>
        </Card>

        <Card className="surface-card border-border/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total de Membros</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{members.length}</p>
          <span className="text-[10px] text-muted-foreground">Base oficial</span>
        </Card>

        <Card className="surface-card border-border/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Taxa de Verificação</span>
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {members.length > 0 ? Math.round((activeVerifications.length / members.length) * 100) : 0}%
          </p>
          <span className="text-[10px] text-muted-foreground">Dos membros verificados</span>
        </Card>
      </div>

      {/* ABAS PRINCIPAIS */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-4">
        <TabsList className="flex flex-wrap sm:grid sm:grid-flow-col sm:auto-cols-fr w-full h-auto p-1 bg-secondary/30 rounded-xl gap-1">
          <TabsTrigger
            value="pendentes"
            className="text-xs py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Pendentes</span>
            {pendingRequests.length > 0 && (
              <Badge className="bg-amber-500 text-black text-[10px] py-0 px-1.5 font-bold ml-1 animate-pulse">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="verificados"
            className="text-xs py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5"
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            <span>Verificados ({activeVerifications.length})</span>
          </TabsTrigger>

          {(canConfig || canRequirements) && (
            <TabsTrigger
              value="configuracao"
              className="text-xs py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Configurações & Requisitos</span>
            </TabsTrigger>
          )}

          {canAudit && (
            <TabsTrigger
              value="auditoria"
              className="text-xs py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Auditoria</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ABA 1: SOLICITAÇÕES PENDENTES */}
        <TabsContent value="pendentes" className="space-y-4">
          <Card className="surface-card border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>Fila de Análise de Verificação</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Membros que enviaram solicitação para receber o Selo Oficial de Verificado.
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar solicitação..."
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-xl"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loadingRequests ? (
                <TableSkeleton rows={4} />
              ) : pendingRequests.length === 0 ? (
                <EmptyState
                  title="Nenhuma solicitação pendente"
                  description="Todas as solicitações de verificação foram analisadas!"
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-border/70 bg-background/60 space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-10 w-10 border border-border/60 shrink-0">
                              <AvatarImage src={req.member?.discord_avatar_url || req.member?.avatar_url || ""} />
                              <AvatarFallback className="font-bold text-xs">
                                {(req.member?.nickname || req.member?.nome || "MB").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-foreground truncate">
                                {req.member?.nickname ? `${req.member.nickname} (${req.member.nome})` : req.member?.nome || "Membro"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                {req.member?.game_id && (
                                  <span className="font-mono font-bold text-foreground">ID: #{req.member.game_id}</span>
                                )}
                                {req.member?.discord_username && (
                                  <span className="text-indigo-400 font-mono">@{req.member.discord_username}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
                            {dateTime(req.created_at)}
                          </Badge>
                        </div>

                        {/* JUSTIFICATIVA */}
                        <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                            Justificativa do Membro
                          </span>
                          <p className="text-xs text-foreground italic leading-relaxed">
                            "{req.reason}"
                          </p>
                        </div>

                        {/* COMPROVANTE */}
                        {req.document_url && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">Comprovante:</span>
                            <a
                              href={req.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-400 hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <span>Ver link / print</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {/* REQUISITOS CUSTOMIZADOS CONFIRMADOS */}
                        {req.extra_data?.custom_declarations && Object.keys(req.extra_data.custom_declarations).length > 0 && (
                          <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40 space-y-1 text-xs">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                              Declaração de Requisitos da Liderança
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(req.extra_data.custom_declarations).map(([k, v]) => (
                                <Badge
                                  key={k}
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] py-0 font-mono",
                                    v ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-rose-500/40 text-rose-400"
                                  )}
                                >
                                  {v ? "✓ Declarado Cumprido" : "✗ Não Confirmado"}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* BOTÕES DE AÇÃO */}
                      {canReview && (
                        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(req);
                              setReviewAction("approve");
                              setCustomTitle("Verificado Oficial");
                              setReviewNotes("");
                            }}
                            className="flex-1 h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Aprovar</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(req);
                              setReviewAction("reject");
                              setReviewNotes("");
                            }}
                            className="flex-1 h-8 text-xs font-semibold rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-1.5 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Rejeitar</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: MEMBROS VERIFICADOS */}
        <TabsContent value="verificados" className="space-y-4">
          <Card className="surface-card border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-sky-400" />
                    <span>Membros Oficiais Verificados</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Integrantes que possuem o selo oficial ativo no perfil e em toda a plataforma.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, ID..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-xl"
                    />
                  </div>
                  {canGrant && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setDirectTargetUserId("");
                        setIsDirectModalOpen(true);
                      }}
                      className="h-8 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white gap-1.5 shadow-sm shadow-sky-500/20 shrink-0 cursor-pointer hidden md:flex"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Conceder Selo Direto</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loadingVerifications ? (
                <TableSkeleton rows={5} />
              ) : filteredVerifications.length === 0 ? (
                <EmptyState
                  title="Nenhum membro verificado encontrado"
                  description="Use o botão 'Conceder Selo Direto' no topo da página ou aprove solicitações pendentes."
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/60">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-transparent border-b border-border/60">
                        <TableHead className="font-bold text-xs">Membro / Personagem</TableHead>
                        <TableHead className="font-bold text-xs">Selo & Título</TableHead>
                        <TableHead className="font-bold text-xs">Data de Verificação</TableHead>
                        <TableHead className="font-bold text-xs">Aprovado Por</TableHead>
                        {canRevoke && <TableHead className="font-bold text-xs text-right pr-4">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredVerifications.map((v) => (
                        <TableRow key={v.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-9 w-9 border border-border/60 shadow-xs">
                                <AvatarImage src={v.member?.discord_avatar_url || v.member?.avatar_url || ""} />
                                <AvatarFallback className="font-bold text-xs">
                                  {(v.member?.nickname || v.member?.nome || "MB").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-foreground">
                                    {v.member?.nickname ? `${v.member.nickname} (${v.member.nome})` : v.member?.nome}
                                  </span>
                                  <VerifiedBadge
                                    isVerified
                                    size="sm"
                                    color={v.badge_color_override || undefined}
                                    iconName={v.badge_icon_override || undefined}
                                  />
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                  {v.member?.game_id && (
                                    <span className="font-mono">ID: #{v.member.game_id}</span>
                                  )}
                                  {v.member?.discord_username && (
                                    <span className="text-indigo-400 font-mono">@{v.member.discord_username}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[11px] font-bold px-2 py-0.5 rounded-lg border-sky-500/30 text-sky-400 bg-sky-500/10 gap-1"
                              style={v.badge_color_override ? { borderColor: `${v.badge_color_override}50`, color: v.badge_color_override, backgroundColor: `${v.badge_color_override}15` } : {}}
                            >
                              <VerifiedBadge
                                isVerified
                                size="xs"
                                color={v.badge_color_override || undefined}
                                iconName={v.badge_icon_override || undefined}
                                noTooltip
                              />
                              <span>{v.custom_title || config?.badge_name || "Verificado"}</span>
                            </Badge>
                          </TableCell>

                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {dateTime(v.verified_at)}
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">
                            {v.verifier?.nome || "Administração"}
                          </TableCell>

                          {canRevoke && (
                            <TableCell className="text-right pr-4">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setRevokingMember(v);
                                  setRevokeReason("");
                                }}
                                className="h-7 text-xs rounded-lg text-rose-400 hover:bg-rose-500/10 gap-1 font-semibold"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remover Selo</span>
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: CONFIGURAÇÃO DO SELO & REQUISITOS */}
        {(canConfig || canRequirements) && (
          <TabsContent value="configuracao" className="space-y-4">
            <Card className="surface-card border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  <span>Personalização Visual & Requisitos do Selo</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Ajuste o ícone, a cor, o efeito de brilho e gerencie todos os requisitos necessários para obtenção do selo.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* PREVIEW EM TEMPO REAL */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-background to-secondary/30 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Visualização em Tempo Real
                    </span>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <span className="text-sm font-extrabold text-foreground">Exemplo Jogador</span>
                      <VerifiedBadge
                        preview
                        size="sm"
                        iconName={formIcon}
                        color={formColor}
                        glowStyle={formGlow}
                        tooltip={formTooltip}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tooltip: "{formTooltip}" • Nome: "{formName}"
                    </p>
                  </div>

                  {/* ESCALA DE TAMANHOS */}
                  <div className="flex items-center gap-3 p-2 bg-background/80 rounded-xl border border-border/50">
                    <div className="text-center">
                      <VerifiedBadge preview size="xs" iconName={formIcon} color={formColor} glowStyle={formGlow} noTooltip />
                      <span className="text-[9px] text-muted-foreground block mt-0.5">XS</span>
                    </div>
                    <div className="text-center">
                      <VerifiedBadge preview size="sm" iconName={formIcon} color={formColor} glowStyle={formGlow} noTooltip />
                      <span className="text-[9px] text-muted-foreground block mt-0.5">SM</span>
                    </div>
                    <div className="text-center">
                      <VerifiedBadge preview size="md" iconName={formIcon} color={formColor} glowStyle={formGlow} noTooltip />
                      <span className="text-[9px] text-muted-foreground block mt-0.5">MD</span>
                    </div>
                    <div className="text-center">
                      <VerifiedBadge preview size="lg" iconName={formIcon} color={formColor} glowStyle={formGlow} noTooltip />
                      <span className="text-[9px] text-muted-foreground block mt-0.5">LG</span>
                    </div>
                  </div>
                </div>

                {/* VISUAL / APARÊNCIA DO SELO (SOMENTE CANCONFIG) */}
                {canConfig && (
                  <div className="space-y-4 pt-2 border-t border-border/40">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Aparência Visual & Identidade
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Nome do Selo</Label>
                        <Input
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Ex: Verificado Oficial"
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Texto do Tooltip</Label>
                        <Input
                          value={formTooltip}
                          onChange={(e) => setFormTooltip(e.target.value)}
                          placeholder="Ex: Membro Oficial Verificado"
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    {/* SELETOR DE ÍCONE */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Ícone Oficial do Selo</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {AVAILABLE_ICONS.map(({ id, label, Icon }) => {
                          const isSelected = formIcon === id;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setFormIcon(id)}
                              className={cn(
                                "p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-xs text-left cursor-pointer",
                                isSelected
                                  ? "border-sky-500 bg-sky-500/15 text-foreground font-bold ring-1 ring-sky-500"
                                  : "border-border/60 bg-background/60 hover:bg-secondary/40 text-muted-foreground"
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" style={{ color: formColor }} />
                              <span className="truncate">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SELETOR DE COR & GLOW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Cor do Selo</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={formColor}
                            onChange={(e) => setFormColor(e.target.value)}
                            className="h-9 w-12 p-0.5 rounded-xl cursor-pointer"
                          />
                          <Input
                            value={formColor}
                            onChange={(e) => setFormColor(e.target.value)}
                            className="h-9 text-xs font-mono uppercase rounded-xl"
                          />
                        </div>

                        {/* PRESETS */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {PRESET_COLORS.map((p) => (
                            <button
                              key={p.color}
                              type="button"
                              onClick={() => {
                                setFormColor(p.color);
                                setFormGlow(p.glow);
                              }}
                              className="px-2 py-0.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all"
                              style={{ borderColor: `${p.color}60`, color: p.color, backgroundColor: `${p.color}15` }}
                            >
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                              <span>{p.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Estilo de Brilho / Glow</Label>
                        <select
                          value={formGlow}
                          onChange={(e) => setFormGlow(e.target.value)}
                          className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold cursor-pointer shadow-xs"
                        >
                          <option value="cyan">Ciano / Neon Blue</option>
                          <option value="emerald">Esmeralda / Verde</option>
                          <option value="gold">Dourado / Gold</option>
                          <option value="purple">Púrpura / Violeta</option>
                          <option value="rose">Rosa / Red Neon</option>
                          <option value="none">Sem Brilho (Clean)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* GESTÃO DE REQUISITOS E REGRAS (SE CANREQUIREMENTS OU CANCONFIG) */}
                {(canRequirements || canConfig) && (
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-sky-400" />
                        <span>Requisitos & Regras Obrigatórias para Obtenção do Selo</span>
                      </p>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddReqModalOpen(true)}
                        className="h-7 text-xs rounded-xl font-semibold gap-1 bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Novo Requisito</span>
                      </Button>
                    </div>

                    {/* REQUISITOS PADRÃO DO SISTEMA */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold cursor-pointer">Discord Vinculado</Label>
                          <p className="text-[10px] text-muted-foreground">Exigir conta de Discord</p>
                        </div>
                        <Switch checked={formRequireDiscord} onCheckedChange={setFormRequireDiscord} />
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold cursor-pointer">ID do Jogo Informado</Label>
                          <p className="text-[10px] text-muted-foreground">Exigir ID GTA RP</p>
                        </div>
                        <Switch checked={formRequireGameId} onCheckedChange={setFormRequireGameId} />
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold cursor-pointer">Telefone Cadastrado</Label>
                          <p className="text-[10px] text-muted-foreground">Exigir número celular</p>
                        </div>
                        <Switch checked={formRequirePhone} onCheckedChange={setFormRequirePhone} />
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-semibold cursor-pointer">Auto-solicitação</Label>
                          <p className="text-[10px] text-muted-foreground">Membros pedem no painel</p>
                        </div>
                        <Switch checked={formAllowSelfRequest} onCheckedChange={setFormAllowSelfRequest} />
                      </div>
                    </div>

                    {/* PARÂMETROS DE NÍVEL E TEMPO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Nível Mínimo de Experiência (Faccional)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formMinLevel}
                          onChange={(e) => setFormMinLevel(Number(e.target.value) || 0)}
                          placeholder="0 = Sem requisito de nível"
                          className="h-8 text-xs rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Dias Mínimos de Permanência na Facção</Label>
                        <Input
                          type="number"
                          min={0}
                          value={formMinDays}
                          onChange={(e) => setFormMinDays(Number(e.target.value) || 0)}
                          placeholder="0 = Sem requisito de dias"
                          className="h-8 text-xs rounded-xl"
                        />
                      </div>
                    </div>

                    {/* REQUISITOS PERSONALIZADOS ADICIONADOS */}
                    <div className="space-y-2 pt-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        Requisitos Customizados ({formCustomRequirements.length})
                      </Label>

                      {formCustomRequirements.length === 0 ? (
                        <div className="p-3 rounded-xl border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                          Nenhum requisito personalizado cadastrado. Clique em "Novo Requisito" acima para adicionar.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {formCustomRequirements.map((req) => (
                            <div
                              key={req.id}
                              className="p-3 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground">{req.title}</span>
                                  {(req.is_required ?? req.required) ? (
                                    <Badge variant="outline" className="text-[9px] bg-rose-500/10 text-rose-400 border-rose-500/30">
                                      Obrigatório
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[9px] bg-muted/20 text-muted-foreground">
                                      Opcional / Recomendado
                                    </Badge>
                                  )}
                                </div>
                                {req.description && (
                                  <p className="text-[11px] text-muted-foreground">{req.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-muted-foreground">Obrigatório</span>
                                  <Switch
                                    checked={Boolean(req.is_required ?? req.required)}
                                    onCheckedChange={() => handleToggleCustomReq(req.id)}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCustomReq(req.id)}
                                  className="h-7 w-7 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* INSTRUÇÕES PERSONALIZADAS PARA O CANDIDATO */}
                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-semibold">Instruções para o Solicitante</Label>
                      <Textarea
                        value={formCustomInstructions}
                        onChange={(e) => setFormCustomInstructions(e.target.value)}
                        placeholder="Orientações exibidas no formulário de solicitação de selo..."
                        rows={2}
                        className="text-xs rounded-xl resize-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={updateConfigMutation.isPending}
                    className="text-xs rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-5 gap-1.5 shadow-md"
                  >
                    {updateConfigMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Salvar Configurações & Requisitos</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ABA 5: AUDITORIA & HISTÓRICO */}
        {canAudit && (
          <TabsContent value="auditoria" className="space-y-4">
            <Card className="surface-card border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Histórico & Logs de Auditoria</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Registro detalhado de todas as solicitações, aprovações, recusas e concessões diretas.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {loadingAudit ? (
                  <TableSkeleton rows={4} />
                ) : auditLogs.length === 0 ? (
                  <EmptyState
                    title="Nenhum log registrado"
                    description="As ações de verificação realizadas serão registradas aqui em tempo real."
                  />
                ) : (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl border border-border/60 bg-background/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold uppercase",
                                log.action.includes("aprovada") || log.action.includes("concedido")
                                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                  : log.action.includes("rejeitada") || log.action.includes("removido")
                                  ? "border-rose-500/30 text-rose-400 bg-rose-500/10"
                                  : "border-sky-500/30 text-sky-400 bg-sky-500/10"
                              )}
                            >
                              {log.action.replace(/_/g, " ")}
                            </Badge>
                            <span className="font-bold text-foreground">
                              {log.target_member?.nickname || log.target_member?.nome || "Membro"}
                            </span>
                          </div>
                          {log.details?.reason || log.details?.notes ? (
                            <p className="text-[11px] text-muted-foreground italic">
                              "{log.details?.reason || log.details?.notes}"
                            </p>
                          ) : null}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-muted-foreground font-mono">{dateTime(log.created_at)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Por: {log.performer_member?.nome || "Sistema"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* DIALOG DE ANÁLISE DE SOLICITAÇÃO (APROVAR / REJEITAR) */}
      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-md surface-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {reviewAction === "approve" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Aprovar Verificação de Membro</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-rose-400" />
                  <span>Rejeitar Solicitação de Verificação</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Membro: <strong className="text-foreground">{selectedRequest?.member?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {reviewAction === "approve" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Título do Selo (Opcional)</Label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Ex: Verificado Oficial / Líder / Operador"
                    className="h-8 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Notas / Observação Interna</Label>
                  <Input
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Ex: Aprovado após conferência de print e atividade."
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Motivo da Rejeição <span className="text-rose-400">*</span>
                </Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Informe o motivo para que o membro possa se adequar..."
                  rows={3}
                  className="text-xs rounded-xl resize-none"
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedRequest(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmReview}
              disabled={reviewRequestMutation.isPending || (reviewAction === "reject" && !reviewNotes.trim())}
              className={cn(
                "text-xs rounded-xl font-bold text-white",
                reviewAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
              )}
            >
              {reviewRequestMutation.isPending ? "Processando..." : reviewAction === "approve" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONCESSÃO DIRETA DE SELO */}
      <Dialog
        open={isDirectModalOpen}
        onOpenChange={(open) => {
          setIsDirectModalOpen(open);
          if (!open) {
            setDirectSearch("");
            setDirectNotes("");
            setDirectColor("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg surface-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-sky-400" />
              <span>Conceder Selo de Verificado Direto</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conceda o selo de verificação imediatamente a qualquer integrante sem necessidade de solicitação prévia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* SELEÇÃO DO MEMBRO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Selecione o Membro</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por nome, apelido, ID # ou discord..."
                  value={directSearch}
                  onChange={(e) => setDirectSearch(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-xl mb-1.5"
                />
              </div>

              <select
                value={directTargetUserId}
                onChange={(e) => setDirectTargetUserId(e.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold cursor-pointer shadow-xs focus:ring-2 focus:ring-sky-500/30"
              >
                <option value="">Selecione um integrante ({unverifiedMembers.length} disponíveis)...</option>
                {unverifiedMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.nome} {m.nickname ? `(${m.nickname})` : ""} — ID #{m.game_id || "N/A"}
                  </option>
                ))}
              </select>
            </div>

            {/* CARD DO MEMBRO SELECIONADO & PREVIEW DO SELO */}
            {selectedDirectMember ? (
              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-10 w-10 border border-sky-500/30 shadow-xs">
                      <AvatarImage src={(selectedDirectMember as any).discord_avatar_url || selectedDirectMember.avatar_url || ""} />
                      <AvatarFallback className="font-bold text-xs">
                        {(selectedDirectMember.nickname || selectedDirectMember.nome || "MB").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-foreground">
                          {selectedDirectMember.nickname ? `${selectedDirectMember.nickname} (${selectedDirectMember.nome})` : selectedDirectMember.nome}
                        </span>
                        <VerifiedBadge
                          preview
                          size="sm"
                          iconName={formIcon}
                          color={directColor || formColor}
                          glowStyle={formGlow}
                          tooltip={directCustomTitle || formTooltip}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        {selectedDirectMember.game_id && <span className="font-mono font-bold text-sky-300">ID: #{selectedDirectMember.game_id}</span>}
                        {(selectedDirectMember as any).discord_username && <span className="font-mono text-indigo-400">@{(selectedDirectMember as any).discord_username}</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-sky-500/20 text-muted-foreground">
                  <span>Visualização Oficial:</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg border-sky-500/40 text-sky-300 bg-sky-500/20 gap-1"
                    style={directColor ? { borderColor: `${directColor}60`, color: directColor, backgroundColor: `${directColor}20` } : {}}
                  >
                    <VerifiedBadge
                      preview
                      size="xs"
                      iconName={formIcon}
                      color={directColor || formColor}
                      glowStyle={formGlow}
                      noTooltip
                    />
                    <span>{directCustomTitle.trim() || formName || "Verificado Oficial"}</span>
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-secondary/30 border border-border/50 text-center text-muted-foreground text-xs">
                Selecione um integrante da lista acima para pré-visualizar a concessão do selo.
              </div>
            )}

            {/* TÍTULO PERSONALIZADO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Título Personalizado do Selo</Label>
              <Input
                value={directCustomTitle}
                onChange={(e) => setDirectCustomTitle(e.target.value)}
                placeholder="Ex: Verificado Oficial / Líder / Parceiro"
                className="h-8 text-xs rounded-xl"
              />
            </div>

            {/* COR PERSONALIZADA / PALETA */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Cor de Destaque do Selo</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setDirectColor(preset.color)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-all",
                      directColor === preset.color || (!directColor && preset.color === formColor)
                        ? "border-white bg-white/10 shadow-sm scale-105"
                        : "border-border/60 bg-secondary/20 hover:border-border"
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block border border-white/20"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* JUSTIFICATIVA / NOTAS */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Justificativa / Motivo da Concessão</Label>
              <Input
                value={directNotes}
                onChange={(e) => setDirectNotes(e.target.value)}
                placeholder="Ex: Concessão direta pela liderança / Membro oficial de confiança"
                className="h-8 text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDirectModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmDirect}
              disabled={!directTargetUserId || grantDirectMutation.isPending}
              className="text-xs rounded-xl font-bold bg-sky-500 hover:bg-sky-600 text-white gap-1.5 shadow-md shadow-sky-500/20"
            >
              {grantDirectMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Concedendo...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Conceder Selo Direto</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE REVOGAÇÃO DE SELO */}
      <Dialog open={Boolean(revokingMember)} onOpenChange={(open) => !open && setRevokingMember(null)}>
        <DialogContent className="sm:max-w-md surface-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-400">
              <Trash2 className="h-5 w-5" />
              <span>Revogar Selo de Verificado</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Remover o selo de <strong className="text-foreground">{revokingMember?.member?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-xs text-muted-foreground">
              O membro perderá o selo de verificado visual em toda a plataforma imediatamente.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo da Revogação</Label>
              <Textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Ex: Inatividade prolongada / Quebra de conduta..."
                rows={3}
                className="text-xs rounded-xl resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevokingMember(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmRevoke}
              disabled={revokeMutation.isPending}
              className="text-xs rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {revokeMutation.isPending ? "Revogando..." : "Confirmar Revogação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CRIAR REQUISITO PERSONALIZADO */}
      <Dialog open={isAddReqModalOpen} onOpenChange={setIsAddReqModalOpen}>
        <DialogContent className="sm:max-w-md surface-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-sky-400" />
              <span>Adicionar Requisito Personalizado</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Crie uma regra ou condição específica necessária para o membro solicitar o selo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Título do Requisito</Label>
              <Input
                value={newReqTitle}
                onChange={(e) => setNewReqTitle(e.target.value)}
                placeholder="Ex: Print do Perfil no Discord / Enviar Formação de Recruta"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição / Detalhes (Opcional)</Label>
              <Textarea
                value={newReqDescription}
                onChange={(e) => setNewReqDescription(e.target.value)}
                placeholder="Explicar o que o membro precisa fazer para cumprir este requisito..."
                rows={3}
                className="text-xs rounded-xl resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border/40">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold cursor-pointer">Tornar Obrigatório</Label>
                <p className="text-[10px] text-muted-foreground">
                  Se ativado, o membro não poderá enviar sem cumprir esta regra
                </p>
              </div>
              <Switch checked={newReqRequired} onCheckedChange={setNewReqRequired} />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddReqModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddCustomReq}
              disabled={!newReqTitle.trim()}
              className="text-xs rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Adicionar Requisito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
