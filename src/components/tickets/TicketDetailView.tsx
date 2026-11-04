import { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  UserCheck,
  Send,
  Paperclip,
  Lock,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  User,
  Users,
  UserPlus,
  Plus,
  Search,
  Shield,
  UploadCloud,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Eye,
  Info,
  SlidersHorizontal,
  Trash2,
  FileText,
  RotateCcw,
  ChevronDown,
  Check,
  IdCard,
  Headphones,
  Copy,
  Sparkles,
  Zap,
  CornerDownRight,
  ShieldAlert,
  ArrowUpRight,
  Share2,
  KeyRound,
  ShieldCheck,
  Globe,
  Settings2,
  EyeOff,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type Ticket,
  type TicketMessage,
  type TicketStatus,
  type TicketAttachment,
  type TicketPriority,
  type TicketCategory,
  type TicketTranscriptConfig,
  formatTicketNumber,
  getCategoryInfo,
  getPriorityInfo,
  getStatusInfo,
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_CATEGORIES,
} from "@/types/tickets";
import {
  useAddTicketMessage,
  useClaimTicket,
  useTransferTicket,
  useUpdateTicketStatus,
  useCloseTicket,
  useReopenTicket,
  useDeleteTicket,
  useAddTicketMember,
  useRemoveTicketMember,
  useUpdateTicketPriority,
  useUpdateTicketCategory,
  useUnassignTicket,
  useUpdateTicketTranscriptConfig,
  useTickets,
} from "@/hooks/useTickets";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { dateTime, formatTimeOnly } from "@/lib/format";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel, type Permission } from "@/lib/permissions";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { uploadTicketAttachment } from "@/lib/app-api";
import { CannedResponsesMenu } from "./CannedResponsesMenu";
import { TicketMemberDossier } from "./TicketMemberDossier";
import { generateTicketDiscordTranscript } from "./ticketTranscript";

const QUICK_CLOSE_REASONS = [
  "✅ Resolvido e Orientado",
  "💡 Dúvida Esclarecida",
  "💰 Reembolso Concluído",
  "⏱️ Sem Retorno do Membro",
  "❌ Inviável / Recusado",
  "🤝 Acordo Formalizado",
];

function isSystemEventMessage(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return (
    trimmed.startsWith("⚡") ||
    trimmed.startsWith("🔄") ||
    trimmed.startsWith("🔒") ||
    trimmed.startsWith("👥") ||
    trimmed.startsWith("🔀") ||
    trimmed.startsWith("📌") ||
    trimmed.startsWith("⚠️ [Sistema]")
  );
}

interface TicketDetailViewProps {
  ticket: Ticket;
  onClose: () => void;
  canManage?: boolean;
  isMemberPortal?: boolean;
}

export function TicketDetailView({
  ticket,
  onClose,
  canManage = false,
  isMemberPortal = false,
}: TicketDetailViewProps) {
  const { user, profile, hasPermission } = useAuth();
  const effectiveCanManage = !isMemberPortal && (canManage || hasPermission("manage_tickets"));
  const { data: members = [] } = useMembers();

  // Mutations
  const addMessageMutation = useAddTicketMessage();
  const claimMutation = useClaimTicket();
  const transferMutation = useTransferTicket();
  const updateStatusMutation = useUpdateTicketStatus();
  const closeMutation = useCloseTicket();
  const reopenMutation = useReopenTicket();
  const deleteMutation = useDeleteTicket();
  const addMemberMutation = useAddTicketMember();
  const removeMemberMutation = useRemoveTicketMember();
  const updatePriorityMutation = useUpdateTicketPriority();
  const updateCategoryMutation = useUpdateTicketCategory();
  const unassignMutation = useUnassignTicket();
  const { data: allTickets = [] } = useTickets();

  // Dossier state & creator lookup
  const [showDossier, setShowDossier] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const creatorMember = useMemo(
    () => members.find((m) => m.user_id === ticket.user_id),
    [members, ticket.user_id]
  );

  // Local state for sending reply
  const [replyContent, setReplyContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferSearchTerm, setTransferSearchTerm] = useState("");
  const [selectedNewAssigneeId, setSelectedNewAssigneeId] = useState("");
  const [transferNote, setTransferNote] = useState("");

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [enableTranscript, setEnableTranscript] = useState(true);
  const [requirePassword, setRequirePassword] = useState(false);
  const [transcriptPassword, setTranscriptPassword] = useState("");
  const [includeNotesInTranscript, setIncludeNotesInTranscript] = useState(false);
  const [censorSensitiveInTranscript, setCensorSensitiveInTranscript] = useState(false);
  const [showClosePassword, setShowClosePassword] = useState(false);

  // Configuração posterior da transcrição (chamados já fechados)
  const [transcriptSettingsOpen, setTranscriptSettingsOpen] = useState(false);
  const [cfgEnabled, setCfgEnabled] = useState(true);
  const [cfgRequirePassword, setCfgRequirePassword] = useState(false);
  const [cfgPassword, setCfgPassword] = useState("");
  const [cfgIncludeNotes, setCfgIncludeNotes] = useState(false);
  const [cfgCensorSensitive, setCfgCensorSensitive] = useState(false);
  const [showCfgPassword, setShowCfgPassword] = useState(false);

  const updateTranscriptMutation = useUpdateTicketTranscriptConfig();

  const getTranscriptUrl = (id: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/ticket/${id}/transcript/`;
    }
    return `/ticket/${id}/transcript/`;
  };

  const handleGenerateRandomPass = (target: "close" | "settings") => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "TW-";
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (target === "close") {
      setTranscriptPassword(res);
      setRequirePassword(true);
    } else {
      setCfgPassword(res);
      setCfgRequirePassword(true);
    }
    toast.success(`Senha segura gerada: ${res}`);
  };

  const handleSaveTranscriptSettings = async () => {
    try {
      const trimmed = cfgPassword.trim();
      await updateTranscriptMutation.mutateAsync({
        ticketId: ticket.id,
        config: {
          enabled: cfgEnabled,
          has_password: Boolean(cfgRequirePassword && trimmed),
          password: cfgRequirePassword && trimmed ? trimmed : null,
          include_internal_notes: cfgIncludeNotes,
          censor_sensitive_data: cfgCensorSensitive,
        },
      });
      setTranscriptSettingsOpen(false);
    } catch {}
  };
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  const [lightboxImage, setLightboxImage] = useState<TicketAttachment | null>(null);

  const catInfo = getCategoryInfo(ticket.category);
  const priorityInfo = getPriorityInfo(ticket.priority);
  const statusInfo = getStatusInfo(ticket.status);
  const isClosed = ticket.status === "fechado";
  const isCreator = ticket.user_id === user?.id;
  const isParticipant = (ticket.members || []).some((m) => m.user_id === user?.id);
  const isAssigned = ticket.assigned_to_id === user?.id;

  // Permissões granulares estritas — se for portal de membro, desativa todas ações de gestão e atendimento
  const canClaim =
    !isMemberPortal &&
    (hasPermission("claim_tickets") ||
      hasPermission("claim_ticket" as Permission) ||
      effectiveCanManage);
  const canUnassign =
    !isMemberPortal &&
    (hasPermission("unassign_tickets" as Permission) ||
      effectiveCanManage);
  const canTransfer =
    !isMemberPortal &&
    (hasPermission("transfer_tickets") ||
      hasPermission("transfer_ticket" as Permission) ||
      effectiveCanManage);
  const canChangeStatus =
    !isMemberPortal &&
    (hasPermission("change_ticket_status") ||
      effectiveCanManage);
  const canChangePriority =
    !isMemberPortal &&
    (hasPermission("change_ticket_priority" as Permission) ||
      effectiveCanManage);
  const canChangeCategory =
    !isMemberPortal &&
    (hasPermission("change_ticket_category" as Permission) ||
      effectiveCanManage);

  // Permissões detalhadas de Notas Internas: Visualizar e Enviar
  const canViewInternalNotes =
    !isMemberPortal &&
    (hasPermission("view_ticket_internal_notes" as Permission) ||
      hasPermission("internal_notes_tickets") ||
      effectiveCanManage);
  const canSendInternalNotes =
    !isMemberPortal &&
    (hasPermission("send_ticket_internal_notes" as Permission) ||
      hasPermission("internal_notes_tickets") ||
      effectiveCanManage);
  const canInternalNotes = canViewInternalNotes || canSendInternalNotes;

  // Permissão detalhada de Anexos: no portal de membros o autor/participante pode enviar com a resposta; na central desk exige a permissão estrita
  const canSendAttachments = isMemberPortal
    ? (hasPermission("send_ticket_attachments" as Permission) || effectiveCanManage || isCreator || isParticipant)
    : (hasPermission("send_ticket_attachments" as Permission) || effectiveCanManage);

  // Permissões de ferramentas adicionais
  const canViewDossier =
    !isMemberPortal &&
    (hasPermission("view_ticket_dossier" as Permission) ||
      effectiveCanManage);
  const canExportTranscript =
    !isMemberPortal &&
    (hasPermission("export_ticket_transcript" as Permission) ||
      effectiveCanManage);
  const canUseMacros =
    !isMemberPortal &&
    (hasPermission("use_ticket_macros" as Permission) ||
      hasPermission("reply_tickets") ||
      hasPermission("reply_ticket" as Permission) ||
      effectiveCanManage ||
      canReply);

  const canManageMembers =
    !isMemberPortal &&
    (hasPermission("manage_ticket_members") ||
      effectiveCanManage);
  const canClose = isMemberPortal
    ? (isCreator && !isClosed)
    : (hasPermission("close_tickets") ||
      hasPermission("close_ticket" as Permission) ||
      effectiveCanManage ||
      isCreator);
  const canReopen =
    !isMemberPortal &&
    (hasPermission("reopen_tickets") ||
      hasPermission("reopen_ticket" as Permission) ||
      effectiveCanManage);
  const canDelete =
    !isMemberPortal &&
    (hasPermission("delete_tickets") ||
      hasPermission("delete_ticket" as Permission) ||
      effectiveCanManage);

  const canReply =
    hasPermission("reply_tickets") ||
    hasPermission("reply_ticket" as Permission) ||
    effectiveCanManage;

  // Lista de membros do grupo disponíveis para adicionar (não criador e ainda não participante)
  const availableMembersToAdd = useMemo(() => {
    const existingIds = new Set<string>([
      ticket.user_id,
      ...(ticket.members || []).map((m) => m.user_id),
    ]);
    const term = memberSearchTerm.toLowerCase().trim();
    return members
      .filter((m) => !existingIds.has(m.user_id))
      .filter((m) => {
        if (!term) return true;
        const name = (m.nome || "").toLowerCase();
        const nick = (m.nickname || "").toLowerCase();
        return name.includes(term) || nick.includes(term);
      });
  }, [members, ticket.user_id, ticket.members, memberSearchTerm]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages?.length]);

  // Management members for transfer dropdown (with search filter)
  const filteredTransferMembers = useMemo(() => {
    const base = members.filter((m) =>
      ["desenvolvedor", "01", "02", "gerente", "motoqueiro", "membro"].includes(m.nivel || "")
    );
    const term = transferSearchTerm.toLowerCase().trim();
    if (!term) return base;
    return base.filter((m) => {
      const name = (m.nome || "").toLowerCase();
      const nick = (m.nickname || "").toLowerCase();
      return name.includes(term) || nick.includes(term);
    });
  }, [members, transferSearchTerm]);

  const handleCopyTicketId = () => {
    navigator.clipboard.writeText(formatTicketNumber(ticket.ticket_number));
    toast.success("ID do chamado copiado!", {
      description: formatTicketNumber(ticket.ticket_number),
    });
  };

  const handleImageFile = async (file: File) => {
    if (!canReply) {
      toast.error("Você não possui a permissão 'Responder e Enviar Mensagens nos Chamados'.");
      return;
    }
    if (!canSendAttachments) {
      toast.error("Você não possui a permissão para enviar anexos e prints nos chamados.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são aceitas como anexo.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setIsUploadingAttachment(true);
    const toastId = toast.loading("Enviando print para o servidor...");
    try {
      const newAtt = await uploadTicketAttachment(file);
      setReplyAttachments((prev) => [...prev, newAtt]);
      toast.success("Print anexado com sucesso!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao processar anexo.", { id: toastId });
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!canReply || !canSendAttachments) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          void handleImageFile(file);
          break;
        }
      }
    }
  };

  const handleSendReply = async () => {
    if (!canReply) {
      toast.error("Você não possui a permissão 'Responder e Enviar Mensagens nos Chamados'.");
      return;
    }

    const text = replyContent.trim();
    const attachments = [...replyAttachments];
    const isNote = Boolean(isInternalNote && canSendInternalNotes);

    if (attachments.length > 0 && !canSendAttachments) {
      toast.error("Você não possui permissão para enviar anexos e prints nos chamados.");
      return;
    }

    if (!text && attachments.length === 0) {
      toast.error("Digite uma mensagem ou anexe uma imagem.");
      return;
    }

    // Limpa o formulário imediatamente para resposta instantânea de 0ms
    setReplyContent("");
    setReplyAttachments([]);
    setIsInternalNote(false);

    try {
      await addMessageMutation.mutateAsync({
        ticketId: ticket.id,
        payload: {
          content: text,
          is_internal_note: isNote,
          attachments,
        },
      });
    } catch {
      // Em caso de falha de conexão, restaura o texto para o usuário
      setReplyContent(text);
      setReplyAttachments(attachments);
      setIsInternalNote(isNote);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Envia diretamente com Enter (Shift + Enter desce a linha)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendReply();
    }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedNewAssigneeId) {
      toast.error("Selecione o membro para quem deseja transferir.");
      return;
    }
    const targetMember = members.find((m) => m.user_id === selectedNewAssigneeId);
    if (!targetMember) return;

    try {
      await transferMutation.mutateAsync({
        ticketId: ticket.id,
        payload: {
          new_assigned_to_id: targetMember.user_id,
          new_assigned_to_name: targetMember.nome,
          new_assigned_to_nickname: targetMember.nickname || null,
          new_assigned_to_role: (targetMember.nivel as any) || null,
          new_assigned_to_avatar: targetMember.avatar_url || null,
          note: transferNote.trim() || undefined,
        },
      });
      setTransferDialogOpen(false);
      setTransferNote("");
      setSelectedNewAssigneeId("");
    } catch {}
  };

  const handleConfirmClose = async () => {
    try {
      const trimmedPass = transcriptPassword.trim();
      await closeMutation.mutateAsync({
        ticketId: ticket.id,
        payload: {
          reason:
            closeReason.trim() ||
            (isCreator && !effectiveCanManage
              ? "Chamado finalizado pelo próprio autor."
              : "Chamado concluído e resolvido pela gerência."),
          transcript_config: {
            enabled: enableTranscript,
            has_password: Boolean(requirePassword && trimmedPass),
            password: requirePassword && trimmedPass ? trimmedPass : null,
            include_internal_notes: includeNotesInTranscript,
            censor_sensitive_data: censorSensitiveInTranscript,
          },
        },
      });
      setCloseDialogOpen(false);
      setCloseReason("");
      toast.success("Chamado encerrado e Transcrição Oficial gerada!", {
        description: `/ticket/${ticket.id}/transcript/`,
        action: {
          label: "Abrir Transcrição",
          onClick: () => window.open(`/ticket/${ticket.id}/transcript/`, "_blank"),
        },
      });
    } catch {}
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(ticket.id);
      setDeleteDialogOpen(false);
      onClose();
    } catch {}
  };

  return (
    <div
      className="flex flex-col h-full bg-card/95 border border-border/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md"
      onPaste={handlePaste}
    >
      {/* 1. HEADER DO TICKET: Barra Topo Compacta, Informativa e Elegante */}
      <div className="h-14 px-4 sm:px-5 border-b border-border/70 bg-gradient-to-r from-secondary/50 via-card/60 to-secondary/40 shrink-0 flex items-center justify-between gap-3">
        {/* Lado Esquerdo da Barra de Topo */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* ID do Chamado com 1-Click Copy */}
          <button
            type="button"
            onClick={handleCopyTicketId}
            className="group flex items-center gap-1.5 text-xs font-mono font-black text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-2 py-1 rounded-lg border border-amber-500/30 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title="Copiar número do chamado"
          >
            <span>{formatTicketNumber(ticket.ticket_number)}</span>
            <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Assunto / Título do Chamado */}
          <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate max-w-[180px] sm:max-w-xs md:max-w-md lg:max-w-lg" title={ticket.subject}>
            {ticket.subject}
          </h2>

          {/* Badges Essenciais em Topo */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {/* Status */}
            <Badge variant="outline" className={cn("text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-2xs", statusInfo.badgeClass)}>
              {statusInfo.label}
            </Badge>

            {/* Categoria */}
            <Badge variant="outline" className={cn("text-[11px] font-semibold gap-1 px-2 py-0.5 rounded-lg shadow-2xs", catInfo.badgeClass)}>
              <span>{catInfo.emoji}</span>
              <span className="hidden md:inline">{catInfo.label}</span>
            </Badge>

            {/* Prioridade */}
            <Badge variant="outline" className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-lg shadow-2xs hidden lg:inline-flex", priorityInfo.badgeClass)}>
              <span className={cn("h-1.5 w-1.5 rounded-full mr-1", priorityInfo.dotClass)} />
              Prioridade {priorityInfo.label}
            </Badge>
          </div>
        </div>

        {/* Lado Direito da Barra de Topo */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Responsável Rápido no Topo */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs bg-secondary/50 px-2.5 py-1 rounded-lg border border-border/50">
            <span className="text-muted-foreground text-[11px]">Responsável:</span>
            {ticket.assigned_to_name ? (
              <span className="text-sky-300 font-semibold inline-flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={ticket.assigned_to_avatar || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {(ticket.assigned_to_nickname || ticket.assigned_to_name).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{ticket.assigned_to_nickname || ticket.assigned_to_name}</span>
                <VerifiedBadge userId={ticket.assigned_to_id} size="xs" />
              </span>
            ) : (
              <span className="text-amber-400/80 font-mono text-[11px]">Fila Livre</span>
            )}
          </div>

          {/* Botão de Alternar Sidebar em Mobile */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileSidebar((v) => !v)}
            className="md:hidden h-8 px-2.5 text-xs gap-1.5 border-border/70 rounded-xl"
            title="Alternar entre Chat e Opções do Chamado"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
            <span>{showMobileSidebar ? "Chat" : "Opções"}</span>
          </Button>

          {/* Botão Fechar Modal */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl shrink-0"
            title="Fechar detalhes do chamado (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. CORPO PRINCIPAL EM 2 COLUNAS: CHAT NA ESQUERDA + OPÇÕES NA DIREITA */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative">
        {/* COLUNA ESQUERDA: O CHAT & RESPOSTAS */}
        <div className={cn(
          "flex-1 min-w-0 flex flex-col h-full bg-background/40 relative",
          showMobileSidebar ? "hidden md:flex" : "flex"
        )}>
          {/* 2. ÁREA DE MENSAGENS / CONVERSAÇÃO / TIMELINE */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Card da Descrição Inicial ("Solicitação Genesis") */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-secondary/30 to-secondary/20 p-4 sm:p-5 space-y-3.5 shadow-sm border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 rounded-xl border border-cyan-500/30">
                <AvatarImage src={ticket.creator_avatar || undefined} />
                <AvatarFallback className="text-xs font-bold bg-secondary">
                  {(ticket?.creator_name || ticket?.creator_nickname || "TC").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    {ticket.creator_nickname || ticket.creator_name}
                  </span>
                  <VerifiedBadge userId={ticket.user_id || (ticket as any).creator_id} isVerified={members.find((m) => m.user_id === (ticket.user_id || (ticket as any).creator_id))?.is_verified} size="xs" />
                  <Badge
                    variant="outline"
                    className={cn("text-[9px] px-1.5 py-0 font-medium", levelBadgeClass(ticket.creator_role))}
                  >
                    {LEVEL_LABEL[ticket.creator_role] || ticket.creator_role}
                  </Badge>
                  <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.2 rounded-full">
                    Solicitação Inicial
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Abertura inicial do chamado • {dateTime(ticket.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-foreground/95 whitespace-pre-wrap leading-relaxed font-sans">
            {ticket.description}
          </div>

          {/* Anexos Iniciais */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="pt-2.5 border-t border-border/40 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-cyan-400" />
                Prints e Comprovantes Anexados ({ticket.attachments.length}):
              </span>
              <div className="flex flex-wrap gap-2.5">
                {ticket.attachments.map((att) => (
                  <div
                    key={att.id}
                    onClick={() => setLightboxImage(att)}
                    className="group relative w-24 h-24 rounded-xl overflow-hidden border border-border/80 bg-black/40 cursor-pointer shadow-sm hover:border-cyan-500/60 transition-all"
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 text-[10px]">
                      <Eye className="h-4 w-4" />
                      <span>Ampliar</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thread de Mensagens e Notas Internas */}
        {ticket.messages && ticket.messages.length > 0 && (
          <div className="space-y-3.5 pt-1">
            {ticket.messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const isNote = msg.is_internal_note;
              const isSystem = isSystemEventMessage(msg.content);

              // Notas internas confidenciais são estritamente ocultadas para quem não tem permissão de visualização
              if (isNote && !canViewInternalNotes) {
                return null;
              }

              // SE FOR EVENTO DE SISTEMA (Claim, Transfer, Fechamento, etc.)
              if (isSystem) {
                return (
                  <div key={msg.id} className="flex items-center gap-3 my-3 px-2">
                    <div className="h-px flex-1 bg-border/40" />
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/60 text-[11px] font-mono text-muted-foreground shadow-2xs">
                      <span>{msg.content}</span>
                      <span className="text-[10px] text-muted-foreground/60">• {formatTimeOnly(msg.created_at)}</span>
                    </div>
                    <div className="h-px flex-1 bg-border/40" />
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col space-y-1.5 max-w-[92%] sm:max-w-[80%]",
                    isNote
                      ? "mx-auto w-full max-w-[98%]"
                      : isMe
                      ? "ml-auto items-end"
                      : "mr-auto items-start"
                  )}
                >
                  {/* Se for NOTA INTERNA PRIVADA (Dossiê Confidencial) */}
                  {isNote ? (
                    <div className="w-full rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 p-4 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between border-b border-amber-500/25 pb-2">
                        <div className="flex items-center gap-2 text-xs font-black text-amber-400">
                          <span className="p-1 rounded-md bg-amber-500/20 border border-amber-500/30">
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                          <span>NOTA INTERNA PRIVADA — CONFIDENCIAL</span>
                        </div>
                        <span className="text-[10px] text-amber-300/80 font-mono">
                          {dateTime(msg.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={msg.sender_avatar || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {(msg?.sender_name || msg?.sender_nickname || "MB").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold text-amber-300">
                          {msg.sender_nickname || msg.sender_name}
                        </span>
                        <VerifiedBadge userId={msg.sender_id} isVerified={members.find((m) => m.user_id === msg.sender_id)?.is_verified} size="xs" />
                        <span className="text-[10px] text-amber-400/80 font-semibold">
                          ({LEVEL_LABEL[msg.sender_role] || msg.sender_role})
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-100/95 whitespace-pre-wrap leading-relaxed font-sans">
                        {msg.content}
                      </p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1.5 border-t border-amber-500/20">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              onClick={() => setLightboxImage(att)}
                              className="w-20 h-20 rounded-lg overflow-hidden border border-amber-500/40 cursor-pointer group relative shadow-2xs"
                            >
                              <img src={att.url} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Mensagem Normal de Chat */
                    <div
                      className={cn(
                        "rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm space-y-2 shadow-sm border transition-all",
                        isMe
                          ? "bg-amber-500/15 border-amber-500/35 text-foreground rounded-br-xs"
                          : "bg-secondary/70 border-border/80 text-foreground rounded-bl-xs"
                      )}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap border-b border-border/30 pb-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={msg.sender_avatar || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {(msg?.sender_name || msg?.sender_nickname || "MB").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-xs text-foreground">
                          {isMe ? "Você" : msg.sender_nickname || msg.sender_name}
                        </span>
                        <VerifiedBadge userId={msg.sender_id} isVerified={members.find((m) => m.user_id === msg.sender_id)?.is_verified} size="xs" />
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] px-1.5 py-0 font-medium", levelBadgeClass(msg.sender_role))}
                        >
                          {LEVEL_LABEL[msg.sender_role] || msg.sender_role}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                          {formatTimeOnly(msg.created_at)}
                        </span>
                      </div>

                      <div className="whitespace-pre-wrap leading-relaxed text-foreground/95">{msg.content}</div>

                      {/* Anexos da mensagem */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1 border-t border-border/20">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              onClick={() => setLightboxImage(att)}
                              className="w-20 h-20 rounded-xl overflow-hidden border border-border/80 cursor-pointer group relative shadow-2xs hover:border-primary/60 transition-all"
                            >
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Banner de Chamado Fechado e Transcrição Web Oficial */}
        {isClosed && (
          <div className="rounded-3xl border border-zinc-500/30 bg-gradient-to-br from-zinc-500/10 via-secondary/40 to-zinc-500/5 p-5 sm:p-6 space-y-4 my-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-zinc-500/20 border border-zinc-500/30 text-zinc-300">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                    Chamado Finalizado e Arquivado
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Encerrado por {ticket.closed_by_name || "Gerência"} em {dateTime(ticket.closed_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href={`/ticket/${ticket.id}/transcript/`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all shadow-xs"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Abrir Transcrição Web</span>
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(getTranscriptUrl(ticket.id));
                    toast.success("Link oficial da transcrição copiado!");
                  }}
                  className="h-8 text-xs gap-1 border-border/70 rounded-xl"
                  title="Copiar URL pública da transcrição"
                >
                  <Share2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Copiar Link</span>
                </Button>

                {effectiveCanManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const curCfg = ticket.transcript_config;
                      setCfgEnabled(curCfg?.enabled ?? true);
                      setCfgRequirePassword(Boolean(curCfg?.has_password && curCfg?.password));
                      setCfgPassword(curCfg?.password || "");
                      setCfgIncludeNotes(Boolean(curCfg?.include_internal_notes));
                      setCfgCensorSensitive(Boolean(curCfg?.censor_sensitive_data));
                      setTranscriptSettingsOpen(true);
                    }}
                    className="h-8 text-xs gap-1 border-border/70 rounded-xl text-muted-foreground hover:text-foreground"
                    title="Configurar senha e opções da transcrição"
                  >
                    <Settings2 className="h-3.5 w-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Opções Transcrição</span>
                  </Button>
                )}
              </div>
            </div>

            {ticket.closed_reason && (
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Conclusão Registrada:
                </span>
                <p className="text-foreground font-semibold italic leading-relaxed">"{ticket.closed_reason}"</p>
              </div>
            )}

            {/* Link e Segurança da Transcrição */}
            <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="text-muted-foreground text-[11px]">
                  URL Oficial:{" "}
                  <code className="text-cyan-300 font-mono font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/25">
                    /ticket/{ticket.id}/transcript/
                  </code>
                </span>
              </div>

              {ticket.transcript_config?.has_password && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                  <KeyRound className="h-3 w-3" />
                  <span>Protegida por Senha</span>
                  {effectiveCanManage && ticket.transcript_config?.password && (
                    <span className="font-mono bg-amber-500/20 px-1 rounded text-amber-200">
                      ({ticket.transcript_config.password})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. CAIXA DE ENVIO DE RESPOSTAS / NOTAS INTERNAS */}
      {!isClosed ? (
        canReply ? (
          <div className="border-t border-border/80 bg-secondary/30 p-3 sm:p-4 space-y-2.5 shrink-0">
            {/* Controles de Anexos, Respostas Rápidas e Switch de Nota Interna */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Respostas Rápidas / Macros para Atendentes */}
                {canUseMacros && (
                  <CannedResponsesMenu
                    onSelect={(text, isInternal) => {
                      setReplyContent((prev) => (prev ? `${prev}\n\n${text}` : text));
                      if (isInternal !== undefined && canSendInternalNotes) {
                        setIsInternalNote(isInternal);
                      }
                      setTimeout(() => {
                        replyTextareaRef.current?.focus();
                      }, 60);
                    }}
                    disabled={addMessageMutation.isPending}
                  />
                )}

                {canSendAttachments && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAttachment}
                      className="h-7 text-xs gap-1.5 border-border/70 bg-secondary/50 text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      <Paperclip className="h-3 w-3" />
                      <span>{isUploadingAttachment ? "Enviando print..." : "Anexar Print"}</span>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          for (let i = 0; i < files.length; i++) {
                            handleImageFile(files[i]);
                          }
                        }
                      }}
                    />
                  </>
                )}

                {/* Switch Nota Interna */}
                {canSendInternalNotes && (
                  <div className={cn(
                    "flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all",
                    isInternalNote
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-2xs"
                      : "border-border/60 bg-secondary/40 text-muted-foreground"
                  )}>
                    <Switch
                      id="internal_note_switch"
                      checked={isInternalNote}
                      onCheckedChange={setIsInternalNote}
                      className="scale-75 data-[state=checked]:bg-amber-500"
                    />
                    <Label
                      htmlFor="internal_note_switch"
                      className="text-[11px] font-bold flex items-center gap-1 cursor-pointer select-none"
                    >
                      <Lock className="h-3 w-3" />
                      <span>Nota Interna Privada</span>
                    </Label>
                  </div>
                )}
              </div>

              <span className="text-[10px] text-muted-foreground hidden sm:inline-block font-mono">
                Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted/80 text-[10px] border border-border/70 font-sans">Enter</kbd> para enviar • <kbd className="px-1.5 py-0.5 rounded bg-muted/80 text-[10px] border border-border/70 font-sans">Shift + Enter</kbd> para quebrar linha
              </span>
            </div>

            {/* Aviso quando modo nota interna estiver ativo */}
            {isInternalNote && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs font-semibold animate-in fade-in duration-150">
                <Lock className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>
                  Modo Nota Interna Ativo: Esta mensagem NÃO será visível para o membro, apenas para a gerência.
                </span>
              </div>
            )}

            {/* Miniaturas de anexos anexados na resposta */}
            {replyAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {replyAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="group relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-secondary shadow-xs"
                  >
                    <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setReplyAttachments((prev) => prev.filter((a) => a.id !== att.id))
                      }
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 hover:bg-rose-600 text-white transition-colors"
                      title="Remover anexo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Textarea e Botão Enviar */}
            <div className="flex gap-2 items-end">
              <Textarea
                ref={replyTextareaRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  isInternalNote
                    ? "🔒 Digite uma nota interna confidencial (visível apenas para a gerência)..."
                    : "Escreva uma resposta para o chamado..."
                }
                rows={2}
                className={cn(
                  "resize-none text-xs sm:text-sm bg-card border-border/80 focus-visible:ring-2 rounded-xl transition-all",
                  isInternalNote
                    ? "border-amber-500/60 bg-amber-500/5 focus-visible:ring-amber-500/60 text-amber-100 placeholder:text-amber-400/50"
                    : "focus-visible:ring-cyan-500/50"
                )}
              />
              <Button
                type="button"
                onClick={handleSendReply}
                disabled={addMessageMutation.isPending}
                className={cn(
                  "h-10 px-4 shrink-0 font-bold gap-1.5 text-xs text-black rounded-xl shadow-sm transition-all active:scale-95",
                  isInternalNote
                    ? "bg-amber-400 hover:bg-amber-500"
                    : "bg-cyan-500 hover:bg-cyan-600"
                )}
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isInternalNote ? "Salvar Nota" : "Responder"}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t border-border/70 bg-gradient-to-r from-amber-500/5 via-secondary/20 to-amber-500/5 p-3.5 sm:p-4 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 shrink-0">
            <div className="flex items-center gap-2 font-semibold text-amber-400/90">
              <Lock className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Modo Somente Leitura:</span>
            </div>
            <span className="text-muted-foreground">
              Você não possui a permissão <strong className="text-foreground">"Responder e Enviar Mensagens nos Chamados"</strong> atribuída ao seu cargo ou tag.
            </span>
          </div>
        )
      ) : (
        <div className="border-t border-border/80 bg-secondary/15 p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 shrink-0">
          <Lock className="h-3.5 w-3.5 text-amber-400/80 shrink-0" />
          <span>
            Este chamado está encerrado.{" "}
            {canReopen
              ? "Você possui autorização para reabri-lo no botão superior se necessário."
              : "Apenas membros autorizados com a permissão 'Reabrir Chamados Fechados' podem reabri-lo."}
          </span>
        </div>
      )}

              </div>

        {/* COLUNA DIREITA: OPÇÕES, AÇÕES E METADADOS DO CHAMADO */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-88 shrink-0 border-l border-border/70 bg-card/75 backdrop-blur-md flex flex-col h-full overflow-y-auto divide-y divide-border/60",
            showMobileSidebar ? "flex" : "hidden md:flex"
          )}
        >
          {/* 1. AÇÕES RÁPIDAS DO CHAMADO */}
          {(canClaim || canTransfer || canClose || canReopen || canDelete || canUnassign) && (
            <div className="p-4 space-y-2.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Ações Rápidas
              </span>

              <div className="flex flex-col gap-1.5">
                {/* Assumir Chamado */}
                {canClaim && ticket.assigned_to_id !== user?.id && !isClosed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => claimMutation.mutate(ticket.id)}
                    disabled={claimMutation.isPending}
                    className="h-8 text-xs gap-2 border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 rounded-xl font-bold justify-start shadow-2xs"
                  >
                    <UserCheck className="h-4 w-4 text-sky-400 shrink-0" />
                    <span>Assumir Atendimento</span>
                  </Button>
                )}

                {/* Devolver para Fila */}
                {canUnassign && isAssigned && !isClosed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unassignMutation.mutate(ticket.id)}
                    disabled={unassignMutation.isPending}
                    className="h-8 text-xs gap-2 border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl justify-start"
                    title="Devolver para a fila livre sem atendente"
                  >
                    <RotateCcw className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Devolver para a Fila</span>
                  </Button>
                )}

                {/* Transferir */}
                {canTransfer && !isClosed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNewAssigneeId("");
                      setTransferNote("");
                      setTransferSearchTerm("");
                      setTransferDialogOpen(true);
                    }}
                    className="h-8 text-xs gap-2 border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 rounded-xl justify-start"
                  >
                    <ArrowRightLeft className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>Transferir Chamado</span>
                  </Button>
                )}

                {/* Fechar / Encerrar Chamado */}
                {!isClosed && canClose && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCloseReason("");
                      setCloseDialogOpen(true);
                    }}
                    className="h-8 text-xs gap-2 border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 rounded-xl font-bold justify-start shadow-2xs"
                  >
                    <Lock className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>{isCreator && !effectiveCanManage ? "Encerrar Chamado" : "Finalizar Chamado"}</span>
                  </Button>
                )}

                {/* Reabrir Chamado */}
                {isClosed && (
                  canReopen ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reopenMutation.mutate(ticket.id)}
                      disabled={reopenMutation.isPending}
                      className="h-8 text-xs gap-2 border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl font-bold justify-start"
                    >
                      <RefreshCw className={cn("h-4 w-4 shrink-0", reopenMutation.isPending && "animate-spin")} />
                      <span>Reabrir Chamado</span>
                    </Button>
                  ) : (
                    <div className="p-2 rounded-xl bg-secondary/30 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-amber-400/60 shrink-0" />
                      <span>Reabertura restrita à liderança</span>
                    </div>
                  )
                )}

                {/* Excluir Chamado */}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="h-8 text-xs gap-2 border-rose-500/30 text-rose-400 hover:bg-rose-500/15 rounded-xl justify-start"
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    <span>Excluir Chamado</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 2. FLUXO & STATUS DO CHAMADO */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                Fluxo & Status
              </span>
              <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 shadow-2xs", statusInfo.badgeClass)}>
                {statusInfo.label}
              </Badge>
            </div>

            {/* Stepper visual compacto */}
            <div className="relative flex items-center justify-between pt-1 px-1">
              <div className="absolute left-2.5 right-2.5 top-1/2 -translate-y-1/2 h-0.5 bg-border/60 z-0" />
              {TICKET_STATUSES.map((st, idx) => {
                const currentOrder = statusInfo.order;
                const isPast = st.order < currentOrder;
                const isCurrent = st.order === currentOrder;
                return (
                  <div key={st.id} className="relative z-10 flex flex-col items-center group" title={st.label}>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all duration-200",
                        isCurrent
                          ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/40 ring-2 ring-amber-500/30 scale-110"
                          : isPast
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "bg-card text-muted-foreground border-border/70"
                      )}
                    >
                      {isPast ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : <span>{idx + 1}</span>}
                    </div>
                    <span className={cn(
                      "text-[9px] font-semibold mt-1 transition-colors text-center hidden xl:block",
                      isCurrent ? "text-amber-400 font-bold" : isPast ? "text-emerald-400/90" : "text-muted-foreground/40"
                    )}>
                      {st.label.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Transições Rápidas de Status */}
            {canChangeStatus && !isClosed && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Alterar Status:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {ticket.status !== "aguardando" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ ticketId: ticket.id, status: "aguardando" })}
                      disabled={updateStatusMutation.isPending}
                      className="h-7 text-[11px] px-2 gap-1.5 border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 rounded-lg justify-start"
                      title="Aguardar retorno do membro"
                    >
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="truncate">Aguardar</span>
                    </Button>
                  )}

                  {ticket.status !== "em_atendimento" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ ticketId: ticket.id, status: "em_atendimento" })}
                      disabled={updateStatusMutation.isPending}
                      className="h-7 text-[11px] px-2 gap-1.5 border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15 rounded-lg justify-start"
                      title="Definir em atendimento"
                    >
                      <Headphones className="h-3 w-3 shrink-0" />
                      <span className="truncate">Atendendo</span>
                    </Button>
                  )}

                  {ticket.status !== "resolvido" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ ticketId: ticket.id, status: "resolvido" })}
                      disabled={updateStatusMutation.isPending}
                      className="h-7 text-[11px] px-2 gap-1.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 rounded-lg justify-start"
                      title="Marcar como resolvido"
                    >
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">Resolver</span>
                    </Button>
                  )}

                  {/* Dropdown com todos os status */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2 gap-1 border-border/70 rounded-lg justify-between"
                      >
                        <span className="truncate">Outro status</span>
                        <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuLabel className="text-xs">Definir Novo Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {TICKET_STATUSES.filter((s) => s.id !== "fechado").map((s) => (
                        <DropdownMenuItem
                          key={s.id}
                          onClick={() => updateStatusMutation.mutate({ ticketId: ticket.id, status: s.id })}
                          className={cn("text-xs cursor-pointer", s.id === ticket.status && "font-bold text-amber-400")}
                        >
                          {s.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>

          {/* 3. CLASSIFICAÇÃO */}
          <div className="p-4 space-y-2.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" />
              Classificação
            </span>

            <div className="space-y-2 text-xs">
              {/* Prioridade */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-secondary/30 border border-border/50">
                <span className="text-muted-foreground text-[11px]">Prioridade:</span>
                {canChangePriority && !isClosed ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatePriorityMutation.isPending}
                        className="h-6 text-[11px] gap-1 px-2 border-border/70 rounded-lg hover:bg-secondary/70"
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", priorityInfo.dotClass)} />
                        <span className="font-semibold">{priorityInfo.label}</span>
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuLabel className="text-xs">Definir Prioridade</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {TICKET_PRIORITIES.map((p) => {
                        const pInfo = getPriorityInfo(p.id);
                        return (
                          <DropdownMenuItem
                            key={p.id}
                            onClick={() => updatePriorityMutation.mutate({ ticketId: ticket.id, priority: p.id })}
                            className={cn("text-xs cursor-pointer flex items-center justify-between gap-3", p.id === ticket.priority && "font-bold text-amber-400")}
                          >
                            <span className="flex items-center gap-2">
                              <span className={cn("h-2 w-2 rounded-full", pInfo.dotClass)} />
                              {pInfo.label}
                            </span>
                            {p.id === ticket.priority && <Check className="h-3.5 w-3.5 text-amber-400" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5", priorityInfo.badgeClass)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full mr-1", priorityInfo.dotClass)} />
                    {priorityInfo.label}
                  </Badge>
                )}
              </div>

              {/* Categoria */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-secondary/30 border border-border/50">
                <span className="text-muted-foreground text-[11px]">Categoria:</span>
                {canChangeCategory && !isClosed ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updateCategoryMutation.isPending}
                        className="h-6 text-[11px] gap-1 px-2 border-border/70 rounded-lg hover:bg-secondary/70"
                      >
                        <span>{catInfo.emoji}</span>
                        <span className="font-semibold truncate max-w-[120px]">{catInfo.label}</span>
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuLabel className="text-xs">Reclassificar Categoria</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {TICKET_CATEGORIES.map((c) => (
                        <DropdownMenuItem
                          key={c.id}
                          onClick={() => updateCategoryMutation.mutate({ ticketId: ticket.id, category: c.id })}
                          className={cn("text-xs cursor-pointer flex items-center justify-between gap-3", c.id === ticket.category && "font-bold text-cyan-400")}
                        >
                          <span className="flex items-center gap-2">
                            <span>{c.emoji}</span>
                            {c.label}
                          </span>
                          {c.id === ticket.category && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge variant="outline" className={cn("text-[10px] font-semibold gap-1 px-2 py-0.5", catInfo.badgeClass)}>
                    <span>{catInfo.emoji}</span>
                    <span className="truncate max-w-[120px]">{catInfo.label}</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 4. PARTICIPANTES */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-amber-400" />
                Participantes
              </span>
              {canManageMembers && !isClosed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMemberSearchTerm("");
                    setMemberDialogOpen(true);
                  }}
                  className="h-6 text-[10px] px-2 gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-md border border-dashed border-amber-500/30"
                >
                  <UserPlus className="h-3 w-3" />
                  <span>Adicionar</span>
                </Button>
              )}
            </div>

            <div className="space-y-1.5">
              {/* Autor */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30 border border-border/40 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={ticket.creator_avatar || undefined} />
                    <AvatarFallback className="text-[9px]">
                      {(ticket?.creator_name || ticket?.creator_nickname || "TC").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-foreground font-semibold text-xs truncate">
                        {ticket.creator_nickname || ticket.creator_name}
                      </span>
                      <VerifiedBadge userId={ticket.creator_id || ticket.user_id} isVerified={ticket.creator_is_verified} size="xs" />
                    </div>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {LEVEL_LABEL[ticket.creator_role] || ticket.creator_role}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-amber-500/30 text-amber-400 bg-amber-500/10 rounded-full font-bold shrink-0">
                  Autor
                </Badge>
              </div>

              {/* Responsável Atribuído */}
              {ticket.assigned_to_name ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30 border border-sky-500/30 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={ticket.assigned_to_avatar || undefined} />
                      <AvatarFallback className="text-[9px]">
                        {(ticket?.assigned_to_name || ticket?.assigned_to_nickname || "TC").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sky-300 font-semibold text-xs truncate">
                          {ticket.assigned_to_nickname || ticket.assigned_to_name}
                        </span>
                        <VerifiedBadge userId={ticket.assigned_to_id} size="xs" />
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Atendente
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-sky-500/30 text-sky-400 bg-sky-500/10 rounded-full font-bold shrink-0">
                    Atendente
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/20 border border-dashed border-border/60 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 opacity-60" />
                    <span className="text-xs italic">Fila Livre (Sem atendente)</span>
                  </div>
                  {canClaim && !isClosed && (
                    <button
                      type="button"
                      onClick={() => claimMutation.mutate(ticket.id)}
                      disabled={claimMutation.isPending}
                      className="text-[10px] font-bold text-sky-400 hover:text-sky-300 underline"
                    >
                      Assumir
                    </button>
                  )}
                </div>
              )}

              {/* Membros Convidados */}
              {(ticket.members || []).map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between p-2 rounded-xl bg-secondary/25 border border-border/40 text-xs hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={m.avatar || undefined} />
                      <AvatarFallback className="text-[9px]">
                        {(m?.name || m?.nickname || "MB").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground text-xs font-medium truncate">
                      {m.nickname || m.name}
                    </span>
                  </div>
                  {canManageMembers && !isClosed && (
                    <button
                      type="button"
                      onClick={() => removeMemberMutation.mutate({ ticketId: ticket.id, memberUserId: m.user_id })}
                      disabled={removeMemberMutation.isPending}
                      className="text-muted-foreground hover:text-rose-400 p-1 rounded-md transition-colors"
                      title="Remover participante"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5. FERRAMENTAS & TRANSCRIÇÃO */}
          {(!isMemberPortal || isClosed) && (
            <div className="p-4 space-y-2.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Ferramentas & Transcrição
              </span>

              <div className="space-y-1.5">
                {/* Dossiê do Jogador */}
                {!isMemberPortal && canViewDossier && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDossier(true)}
                    className="w-full h-8 text-xs gap-2 border-cyan-500/35 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 rounded-xl justify-start font-semibold"
                  >
                    <IdCard className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Abrir Dossiê do Jogador</span>
                  </Button>
                )}

                {/* Copiar Transcrição Discord */}
                {!isMemberPortal && canExportTranscript && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const transcript = generateTicketDiscordTranscript(ticket, canViewInternalNotes);
                      navigator.clipboard.writeText(transcript);
                      toast.success("Transcrição completa copiada para colar no Discord!");
                    }}
                    className="w-full h-8 text-xs gap-2 border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl justify-start"
                  >
                    <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>Copiar Transcrição Discord</span>
                  </Button>
                )}

                {/* Chamado Fechado: Transcrição Web Oficial */}
                {isClosed && (
                  <div className="pt-1.5 space-y-1.5 border-t border-border/40">
                    <a
                      href={`/ticket/${ticket.id}/transcript/`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full h-8 text-xs px-3 inline-flex items-center justify-between border border-cyan-500/35 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 rounded-xl font-bold transition-all shadow-xs"
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Transcrição Web Oficial</span>
                      </span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>

                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(getTranscriptUrl(ticket.id));
                          toast.success("Link oficial da transcrição copiado!");
                        }}
                        className="h-7 text-[11px] gap-1 border-border/70 rounded-lg text-muted-foreground hover:text-foreground"
                      >
                        <Share2 className="h-3 w-3 text-cyan-400" />
                        <span>Copiar Link</span>
                      </Button>

                      {effectiveCanManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const curCfg = ticket.transcript_config;
                            setCfgEnabled(curCfg?.enabled ?? true);
                            setCfgRequirePassword(Boolean(curCfg?.has_password && curCfg?.password));
                            setCfgPassword(curCfg?.password || "");
                            setCfgIncludeNotes(Boolean(curCfg?.include_internal_notes));
                            setCfgCensorSensitive(Boolean(curCfg?.censor_sensitive_data));
                            setTranscriptSettingsOpen(true);
                          }}
                          className="h-7 text-[11px] gap-1 border-border/70 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                          <Settings2 className="h-3 w-3 text-amber-400" />
                          <span>Configurar</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. DETALHES TÉCNICOS & METADADOS */}
          <div className="p-4 space-y-2 text-xs text-muted-foreground">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-cyan-400" />
              Detalhes do Chamado
            </span>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span>Aberto em:</span>
                <span className="text-foreground">{dateTime(ticket.created_at)}</span>
              </div>
              {ticket.closed_at && (
                <div className="flex items-center justify-between">
                  <span>Encerrado em:</span>
                  <span className="text-foreground">{dateTime(ticket.closed_at)}</span>
                </div>
              )}
              {ticket.closed_by_name && (
                <div className="flex items-center justify-between">
                  <span>Encerrado por:</span>
                  <span className="text-foreground truncate max-w-[130px]">{ticket.closed_by_name}</span>
                </div>
              )}
              {ticket.closed_reason && (
                <div className="pt-1 border-t border-border/30">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Motivo de Encerramento:
                  </span>
                  <p className="text-foreground font-sans font-medium italic mt-0.5 leading-snug">
                    "{ticket.closed_reason}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 0: DOSSIÊ COMPLETO DO JOGADOR */}
      {!isMemberPortal && canViewDossier && (
        <Dialog open={showDossier} onOpenChange={setShowDossier}>
          <DialogContent className="max-w-2xl bg-card/95 border-border/80 backdrop-blur-xl rounded-2xl shadow-2xl p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <IdCard className="h-4 w-4" />
                </span>
                <span>Dossiê Completo do Jogador</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Histórico operacional, dados do jogo, Discord e métricas de chamados do autor.
              </DialogDescription>
            </DialogHeader>

            <div className="pt-2">
              <TicketMemberDossier
                ticket={ticket}
                allTickets={allTickets}
                memberProfile={creatorMember}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 1: TRANSFERIR RESPONSÁVEL COM BUSCA E NOTA */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/80 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ArrowRightLeft className="h-4 w-4" />
              </span>
              <span>Transferir Atendimento do Chamado</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecione outro atendente ou líder para assumir a continuidade deste chamado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Campo de Busca Rápida */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={transferSearchTerm}
                onChange={(e) => setTransferSearchTerm(e.target.value)}
                placeholder="Filtrar por nome ou apelido..."
                className="pl-8 h-8 text-xs bg-secondary/40 border-border/70 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Novo Responsável *</Label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-border/70 rounded-xl p-1 bg-secondary/20">
                {filteredTransferMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum membro encontrado.</p>
                ) : (
                  filteredTransferMembers.map((m) => {
                    const isSelected = selectedNewAssigneeId === m.user_id;
                    return (
                      <div
                        key={m.user_id}
                        onClick={() => setSelectedNewAssigneeId(m.user_id)}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors",
                          isSelected
                            ? "bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40"
                            : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={m.avatar_url || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {(m?.nome || m?.nickname || "MB").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <span className="text-foreground font-semibold block">{m.nickname || m.nome}</span>
                            {m.nickname && <span className="text-[10px] text-muted-foreground block">{m.nome}</span>}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {LEVEL_LABEL[m.nivel as any] || m.nivel}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="transfer_note" className="text-xs font-semibold">
                Motivo / Nota Interna da Transferência (Opcional)
              </Label>
              <Input
                id="transfer_note"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="Ex: Alinhamento de reembolso com diretoria..."
                className="text-xs bg-secondary/30 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferDialogOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmTransfer}
              disabled={transferMutation.isPending || !selectedNewAssigneeId}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold"
            >
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: FECHAR CHAMADO COM CHIPS RÁPIDOS */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/80 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-400">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Lock className="h-4 w-4" />
              </span>
              <span>Finalizar e Fechar Chamado</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              O chamado será concluído e arquivado com auditoria completa de mensagens e anexos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Chips de Resolução Rápida em 1 Clique */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Motivos Rápidos de Conclusão:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CLOSE_REASONS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setCloseReason(chip)}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium",
                      closeReason === chip
                        ? "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold"
                        : "bg-secondary/40 border-border/60 hover:bg-secondary hover:text-foreground text-muted-foreground"
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="close_reason" className="text-xs font-semibold">
                Justificativa Detalhada do Encerramento *
              </Label>
              <Textarea
                id="close_reason"
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="Ex: Dúvida esclarecida pelo chat / Reembolso aprovado e pago no jogo..."
                rows={3}
                className="text-xs bg-secondary/30 rounded-xl leading-relaxed"
              />
            </div>

            {/* OPÇÕES DA TRANSCRIÇÃO WEB */}
            <div className="pt-2 border-t border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Transcrição Web Oficial</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  /ticket/{ticket.id}/transcript/
                </span>
              </div>

              {/* Ativar Transcrição */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <Label htmlFor="trans_enabled" className="text-xs font-semibold cursor-pointer">
                    Gerar Página Pública da Transcrição
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Cria o link interativo no site para auditoria ou envio no Discord.
                  </p>
                </div>
                <Switch
                  id="trans_enabled"
                  checked={enableTranscript}
                  onCheckedChange={setEnableTranscript}
                />
              </div>

              {enableTranscript && (
                <div className="space-y-2.5 animate-in fade-in duration-150">
                  {/* Ativar Senha de Acesso */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="trans_pwd_toggle" className="text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Proteger Transcrição com Senha</span>
                        </Label>
                        <p className="text-[10px] text-amber-200/80">
                          Exige senha para qualquer pessoa visualizar o histórico na web.
                        </p>
                      </div>
                      <Switch
                        id="trans_pwd_toggle"
                        checked={requirePassword}
                        onCheckedChange={setRequirePassword}
                        className="data-[state=checked]:bg-amber-500"
                      />
                    </div>

                    {requirePassword && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="close_pwd_input" className="text-[11px] font-semibold text-amber-300">
                            Senha de Acesso *
                          </Label>
                          <button
                            type="button"
                            onClick={() => handleGenerateRandomPass("close")}
                            className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>Gerar Senha Segura</span>
                          </button>
                        </div>
                        <div className="relative">
                          <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="close_pwd_input"
                            type={showClosePassword ? "text" : "password"}
                            value={transcriptPassword}
                            onChange={(e) => setTranscriptPassword(e.target.value)}
                            placeholder="Digite ou gere uma senha..."
                            className="pl-8 pr-8 h-8 text-xs bg-secondary/50 border-amber-500/40 rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => setShowClosePassword((p) => !p)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showClosePassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Incluir Notas Internas Privadas (Apenas para Staff com permissão) */}
                  {canViewInternalNotes && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/60">
                      <div className="space-y-0.5">
                        <Label htmlFor="trans_notes_toggle" className="text-xs font-semibold cursor-pointer">
                          Incluir Notas Internas na Transcrição
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Se ativado, notas confidenciais da moderação também serão exibidas no registro.
                        </p>
                      </div>
                      <Switch
                        id="trans_notes_toggle"
                        checked={includeNotesInTranscript}
                        onCheckedChange={setIncludeNotesInTranscript}
                      />
                    </div>
                  )}

                  {/* Censurar Dados Pessoais / LGPD */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/60">
                    <div className="space-y-0.5">
                      <Label htmlFor="trans_censor_toggle" className="text-xs font-semibold cursor-pointer">
                        Censurar Dados Sensíveis (Telefone / Discord)
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Oculta números de telefone e IDs pessoais de visualizadores não-staff.
                      </p>
                    </div>
                    <Switch
                      id="trans_censor_toggle"
                      checked={censorSensitiveInTranscript}
                      onCheckedChange={setCensorSensitiveInTranscript}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCloseDialogOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmClose}
              disabled={closeMutation.isPending}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
            >
              Fechar Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: EXCLUSÃO PERMANENTE */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/80 rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-400">
              <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <DialogTitle className="text-base font-bold">Excluir Chamado Permanentemente</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Tem certeza que deseja excluir o chamado{" "}
              <strong className="text-foreground">{formatTicketNumber(ticket.ticket_number)} — {ticket.subject}</strong>?
              Esta ação removerá todo o histórico e não poderá ser revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{deleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: ADICIONAR MEMBRO AO CHAMADO COM FILTRO */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-md border-border/80 rounded-2xl shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-400">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <UserPlus className="h-4 w-4" />
              </span>
              <DialogTitle className="text-base font-bold">Adicionar Membro ao Chamado</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              O membro adicionado poderá acompanhar as mensagens e contribuir com o chamado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder="Buscar membro por nome ou apelido..."
                className="pl-8 h-8 text-xs bg-secondary/40 border-border/70 rounded-xl"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {availableMembersToAdd.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum membro disponível para adicionar.
                </p>
              ) : (
                availableMembersToAdd.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/50 border border-transparent hover:border-border/60 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 rounded-lg">
                        <AvatarImage src={m.avatar_url || m.discord_avatar_url || undefined} />
                        <AvatarFallback className="text-[9px]">
                          {(m?.nome || m?.nickname || "MB").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {m.nickname || m.nome}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {m.nivel ? LEVEL_LABEL[m.nivel as AppLevel] || m.nivel : "Membro"}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await addMemberMutation.mutateAsync({
                          ticketId: ticket.id,
                          payload: {
                            user_id: m.user_id,
                            name: m.nome,
                            nickname: m.nickname || null,
                            role: (m.nivel as AppLevel) || null,
                            avatar: m.avatar_url || m.discord_avatar_url || null,
                          },
                        });
                        setMemberDialogOpen(false);
                      }}
                      disabled={addMemberMutation.isPending}
                      className="h-7 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30 gap-1 rounded-lg"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Adicionar</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 6: CONFIGURAÇÕES DA TRANSCRIÇÃO WEB */}
      <Dialog open={transcriptSettingsOpen} onOpenChange={setTranscriptSettingsOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/80 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Globe className="h-4 w-4" />
              </span>
              <span>Configurações da Transcrição Web</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ajuste as permissões de acesso, senha e opções do registro oficial deste chamado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Link da Transcrição com Copiar */}
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Link Oficial da Web:
                </span>
                <span className="font-mono text-cyan-300 font-bold truncate block">
                  /ticket/{ticket.id}/transcript/
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(getTranscriptUrl(ticket.id));
                    toast.success("Link oficial copiado!");
                  }}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copiar</span>
                </Button>
                <a
                  href={`/ticket/${ticket.id}/transcript/`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-7 px-2 text-xs inline-flex items-center gap-1 rounded-lg border border-border/70 hover:bg-secondary/80 text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Ativar/Desativar Transcrição */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/60">
              <div className="space-y-0.5">
                <Label htmlFor="cfg_enabled" className="text-xs font-semibold cursor-pointer">
                  Página da Transcrição Habilitada
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Permite que o registro seja acessado através da URL.
                </p>
              </div>
              <Switch
                id="cfg_enabled"
                checked={cfgEnabled}
                onCheckedChange={setCfgEnabled}
              />
            </div>

            {/* Proteger com Senha */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="cfg_pwd_toggle" className="text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Proteger com Senha</span>
                  </Label>
                  <p className="text-[10px] text-amber-200/80">
                    Exige senha autorizada para visualizar mensagens e anexos.
                  </p>
                </div>
                <Switch
                  id="cfg_pwd_toggle"
                  checked={cfgRequirePassword}
                  onCheckedChange={setCfgRequirePassword}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              {cfgRequirePassword && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cfg_pwd_input" className="text-[11px] font-semibold text-amber-300">
                      Senha de Acesso *
                    </Label>
                    <button
                      type="button"
                      onClick={() => handleGenerateRandomPass("settings")}
                      className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>Gerar Senha Segura</span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="cfg_pwd_input"
                      type={showCfgPassword ? "text" : "password"}
                      value={cfgPassword}
                      onChange={(e) => setCfgPassword(e.target.value)}
                      placeholder="Digite ou gere uma senha..."
                      className="pl-8 pr-8 h-8 text-xs bg-secondary/50 border-amber-500/40 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCfgPassword((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCfgPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notas Internas */}
            {canViewInternalNotes && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/60">
                <div className="space-y-0.5">
                  <Label htmlFor="cfg_notes_toggle" className="text-xs font-semibold cursor-pointer">
                    Incluir Notas Internas
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Exibe notas confidenciais da moderação na transcrição.
                  </p>
                </div>
                <Switch
                  id="cfg_notes_toggle"
                  checked={cfgIncludeNotes}
                  onCheckedChange={setCfgIncludeNotes}
                />
              </div>
            )}

            {/* Censurar Dados Pessoais */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/60">
              <div className="space-y-0.5">
                <Label htmlFor="cfg_censor_toggle" className="text-xs font-semibold cursor-pointer">
                  Censurar Dados Sensíveis (Telefone / Discord)
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Oculta números de telefone e IDs pessoais de não-staff.
                </p>
              </div>
              <Switch
                id="cfg_censor_toggle"
                checked={cfgCensorSensitive}
                onCheckedChange={setCfgCensorSensitive}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTranscriptSettingsOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveTranscriptSettings}
              disabled={updateTranscriptMutation.isPending}
              className="text-xs bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded-xl shadow-xs"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 5: LIGHTBOX / IMAGEM TELA CHEIA */}
      {lightboxImage && (
        <Dialog open={Boolean(lightboxImage)} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-4xl p-3 bg-black/95 border-border/80 backdrop-blur-xl rounded-2xl shadow-2xl">
            <div className="relative flex flex-col items-center justify-center p-2 space-y-3">
              <div className="w-full flex items-center justify-between text-xs text-muted-foreground px-2">
                <span className="font-mono truncate max-w-md">{lightboxImage.name}</span>
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-cyan-400 hover:underline font-semibold"
                >
                  <span>Abrir em nova aba</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl border border-white/10"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
