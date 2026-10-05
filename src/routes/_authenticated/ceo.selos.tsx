import { useState, useMemo } from "react";
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
import type { VerificationRequest, MemberVerification } from "@/services/verificationBadgeService";

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
  const { hasPermission, isDevUser, isCeoUser, level } = useAuth();
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

  // Tab State
  const [activeTab, setActiveTab] = useState<"pendentes" | "verificados" | "configuracao" | "cargos" | "auditoria">("pendentes");

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
      if (verifiedUserIds.has(m.user_id)) return false;
      if (!directSearch) return true;
      const q = directSearch.toLowerCase();
      return (
        m.nome.toLowerCase().includes(q) ||
        (m.nickname || "").toLowerCase().includes(q) ||
        (m.game_id || "").includes(q)
      );
    });
  }, [members, activeVerifications, directSearch]);

  // Salvar Configurações Gerais
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
        allowed_roles: [],
        allowed_tags: [],
        custom_instructions: config?.requirements_config?.custom_instructions || "",
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Gerenciar Selos & Verificações"
        description="Controle e personalização completa do Selo de Verificado da Twin Wheels, aprovação de solicitações, requisitos e auditoria."
        action={
          <Button
            type="button"
            size="sm"
            onClick={() => setIsDirectModalOpen(true)}
            className="text-xs rounded-xl font-bold bg-sky-500 hover:bg-sky-600 text-white gap-1.5 shadow-lg shadow-sky-500/20"
          >
            <UserPlus className="h-4 w-4" />
            <span>Conceder Selo Direto</span>
          </Button>
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
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full h-auto p-1 bg-secondary/30 rounded-xl gap-1">
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

          <TabsTrigger
            value="configuracao"
            className="text-xs py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Configurar Selo</span>
          </TabsTrigger>

          <TabsTrigger
            value="cargos"
            className="text-xs py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Autorizações</span>
          </TabsTrigger>

          <TabsTrigger
            value="auditoria"
            className="text-xs py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold flex items-center gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Auditoria</span>
          </TabsTrigger>
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
                      </div>

                      {/* BOTÕES DE AÇÃO */}
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
                          className="flex-1 h-8 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
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
                          className="flex-1 h-8 text-xs font-semibold rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-1.5"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Rejeitar</span>
                        </Button>
                      </div>
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

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, ID..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-xl"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {loadingVerifications ? (
                <TableSkeleton rows={5} />
              ) : filteredVerifications.length === 0 ? (
                <EmptyState
                  title="Nenhum membro verificado encontrado"
                  description="Use o botão 'Conceder Selo Direto' ou aprove solicitações pendentes."
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
                        <TableHead className="font-bold text-xs text-right pr-4">Ações</TableHead>
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
        <TabsContent value="configuracao" className="space-y-4">
          <Card className="surface-card border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <span>Personalização Visual & Regras do Selo</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Ajuste o ícone, a cor, o efeito de brilho e as regras exigidas para solicitar o selo.
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
                    <VerifiedBadge size="xs" iconName={formIcon} color={formColor} glowStyle={formGlow} noTooltip />
                    <span className="text-[9px] text-muted-foreground block mt-0.5">XS</span>
                  </div>
                  <div className="text-center">
                    <VerifiedBadge size="sm" iconName={formIcon} color={formColor} glowStyle={formGlow} noTooltip />
                    <span className="text-[9px] text-muted-foreground block mt-0.5">SM</span>
                  </div>
                  <div className="text-center">
                    <VerifiedBadge size="md" iconName={formIcon} color={formColor} glowStyle={formGlow} noTooltip />
                    <span className="text-[9px] text-muted-foreground block mt-0.5">MD</span>
                  </div>
                  <div className="text-center">
                    <VerifiedBadge size="lg" iconName={formIcon} color={formColor} glowStyle={formGlow} noTooltip />
                    <span className="text-[9px] text-muted-foreground block mt-0.5">LG</span>
                  </div>
                </div>
              </div>

              {/* CAMPOS DE CONFIGURAÇÃO */}
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

              {/* REQUISITOS OBRIGATÓRIOS */}
              <div className="p-4 rounded-2xl bg-secondary/20 border border-border/60 space-y-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                  <span>Requisitos Obrigatórios para Solicitação</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold cursor-pointer">Discord Vinculado</Label>
                      <p className="text-[10px] text-muted-foreground">Exigir autenticação com Discord</p>
                    </div>
                    <Switch checked={formRequireDiscord} onCheckedChange={setFormRequireDiscord} />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold cursor-pointer">ID do Jogo Informado</Label>
                      <p className="text-[10px] text-muted-foreground">Exigir ID de jogador GTA RP</p>
                    </div>
                    <Switch checked={formRequireGameId} onCheckedChange={setFormRequireGameId} />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold cursor-pointer">Permitir Auto-solicitação</Label>
                      <p className="text-[10px] text-muted-foreground">Membros podem solicitar no painel</p>
                    </div>
                    <Switch checked={formAllowSelfRequest} onCheckedChange={setFormAllowSelfRequest} />
                  </div>
                </div>
              </div>

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
                      <span>Salvar Configurações</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4: CARGOS & TAGS AUTORIZADOS */}
        <TabsContent value="cargos" className="space-y-4">
          <Card className="surface-card border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Cargos e Tags com Permissão de Análise</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Selecione quais cargos e tags possuem autoridade para analisar, aprovar, rejeitar e revogar verificações.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Cargos Organizacionais Autorizados</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["ceo", "desenvolvedor", "01", "02", "gerente", "motoqueiro", "membro"].map((roleId) => {
                    const isChecked = formAuthorizedRoles.includes(roleId);
                    return (
                      <div
                        key={roleId}
                        onClick={() => {
                          if (isChecked) {
                            setFormAuthorizedRoles(formAuthorizedRoles.filter((r) => r !== roleId));
                          } else {
                            setFormAuthorizedRoles([...formAuthorizedRoles, roleId]);
                          }
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors select-none text-xs",
                          isChecked ? "bg-primary/10 border-primary/40 font-bold" : "bg-background/60 border-border/50 hover:bg-secondary/40"
                        )}
                      >
                        <span className="capitalize">{roleId}</span>
                        {isChecked && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold">Tags Especiais Autorizadas</Label>
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma tag cadastrada.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {tags.map((tag) => {
                      const isChecked = formAuthorizedTags.includes(tag.id);
                      return (
                        <div
                          key={tag.id}
                          onClick={() => {
                            if (isChecked) {
                              setFormAuthorizedTags(formAuthorizedTags.filter((t) => t !== tag.id));
                            } else {
                              setFormAuthorizedTags([...formAuthorizedTags, tag.id]);
                            }
                          }}
                          className={cn(
                            "p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors select-none text-xs",
                            isChecked ? "bg-primary/10 border-primary/40 font-bold" : "bg-background/60 border-border/50 hover:bg-secondary/40"
                          )}
                        >
                          <span className="truncate">{tag.name}</span>
                          {isChecked && <Check className="h-3.5 w-3.5 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={updateConfigMutation.isPending}
                  className="text-xs rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-5 gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Salvar Autorizações</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 5: AUDITORIA & HISTÓRICO */}
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
      <Dialog open={isDirectModalOpen} onOpenChange={setIsDirectModalOpen}>
        <DialogContent className="sm:max-w-md surface-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-sky-400" />
              <span>Conceder Selo de Verificado Direto</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conceda o selo imediatamente a qualquer integrante sem necessidade de formulário prévio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Selecione o Membro</Label>
              <Input
                placeholder="Filtrar membro por nome ou ID..."
                value={directSearch}
                onChange={(e) => setDirectSearch(e.target.value)}
                className="h-8 text-xs rounded-xl mb-1.5"
              />
              <select
                value={directTargetUserId}
                onChange={(e) => setDirectTargetUserId(e.target.value)}
                className="h-9 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold cursor-pointer shadow-xs"
              >
                <option value="">Selecione um integrante...</option>
                {unverifiedMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.nome} {m.nickname ? `(${m.nickname})` : ""} — ID #{m.game_id || "N/A"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Título Personalizado (Opcional)</Label>
              <Input
                value={directCustomTitle}
                onChange={(e) => setDirectCustomTitle(e.target.value)}
                placeholder="Ex: Verificado Oficial / Parceiro"
                className="h-8 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Justificativa / Motivo</Label>
              <Input
                value={directNotes}
                onChange={(e) => setDirectNotes(e.target.value)}
                placeholder="Ex: Concessão direta pela liderança / Cargo de confiança"
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
              className="text-xs rounded-xl font-bold bg-sky-500 hover:bg-sky-600 text-white"
            >
              {grantDirectMutation.isPending ? "Concedendo..." : "Conceder Selo"}
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
    </div>
  );
}
