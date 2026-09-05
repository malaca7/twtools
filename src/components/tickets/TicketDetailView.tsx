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
  formatTicketNumber,
  getCategoryInfo,
  getPriorityInfo,
  getStatusInfo,
  TICKET_STATUSES,
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
} from "@/hooks/useTickets";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { dateTime, formatTimeOnly } from "@/lib/format";
import { LEVEL_LABEL, levelBadgeClass } from "@/lib/permissions";
import { uploadTicketAttachment } from "@/lib/app-api";

interface TicketDetailViewProps {
  ticket: Ticket;
  onClose: () => void;
  canManage: boolean;
}

export function TicketDetailView({ ticket, onClose, canManage }: TicketDetailViewProps) {
  const { user, profile } = useAuth();
  const isDevUser = Boolean(profile?.is_developer);
  const effectiveCanManage = canManage || isDevUser;
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

  // Local state for sending reply
  const [replyContent, setReplyContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedNewAssigneeId, setSelectedNewAssigneeId] = useState("");
  const [transferNote, setTransferNote] = useState("");

  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  const [lightboxImage, setLightboxImage] = useState<TicketAttachment | null>(null);

  const catInfo = getCategoryInfo(ticket.category);
  const priorityInfo = getPriorityInfo(ticket.priority);
  const statusInfo = getStatusInfo(ticket.status);
  const isClosed = ticket.status === "fechado";
  const isCreator = ticket.user_id === user?.id;
  const isAssigned = ticket.assigned_to_id === user?.id;
  const canManageMembers = effectiveCanManage || isCreator;

  // Lista de membros da facção disponíveis para adicionar (não criador e ainda não participante)
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

  // Management members for transfer dropdown
  const managementMembers = members.filter((m) =>
    ["desenvolvedor", "01", "02", "gerente", "motoqueiro", "membro"].includes(m.nivel || "")
  );

  const handleImageFile = async (file: File) => {
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
    const text = replyContent.trim();
    const attachments = [...replyAttachments];
    const isNote = Boolean(isInternalNote && effectiveCanManage);

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
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
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
    } catch {}
  };

  const handleConfirmClose = async () => {
    try {
      await closeMutation.mutateAsync({
        ticketId: ticket.id,
        payload: {
          reason:
            closeReason.trim() ||
            (isCreator && !effectiveCanManage
              ? "Chamado finalizado pelo próprio autor."
              : "Chamado concluído e resolvido pela gerência."),
        },
      });
      setCloseDialogOpen(false);
      setCloseReason("");
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
      className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden shadow-xl"
      onPaste={handlePaste}
    >
      {/* 1. Header do Ticket */}
      <div className="border-b border-border/80 bg-secondary/30 p-4 shrink-0 space-y-3">
        {/* Linha 1: Badges & Fechar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
              {formatTicketNumber(ticket.ticket_number)}
            </span>
            <Badge variant="outline" className={cn("text-xs font-medium gap-1", catInfo.badgeClass)}>
              <span>{catInfo.emoji}</span>
              <span>{catInfo.label}</span>
            </Badge>
            <Badge variant="outline" className={cn("text-xs font-medium", priorityInfo.badgeClass)}>
              <span className={cn("h-1.5 w-1.5 rounded-full mr-1", priorityInfo.dotClass)} />
              Prioridade {priorityInfo.label}
            </Badge>
            <Badge variant="outline" className={cn("text-xs font-medium", statusInfo.badgeClass)}>
              {statusInfo.label}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            title="Fechar detalhes"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Linha 2: Assunto */}
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
            {ticket.subject}
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={ticket.creator_avatar || undefined} />
                <AvatarFallback className="text-[9px]">
                  {ticket.creator_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-foreground font-medium">
                {ticket.creator_nickname || ticket.creator_name}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({LEVEL_LABEL[ticket.creator_role] || ticket.creator_role})
              </span>
            </span>

            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Aberto em {dateTime(ticket.created_at)}
            </span>

            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Responsável:{" "}
              {ticket.assigned_to_name ? (
                <span className="text-sky-400 font-medium">
                  {ticket.assigned_to_nickname || ticket.assigned_to_name}
                </span>
              ) : (
                <span className="text-muted-foreground italic">Não atribuído</span>
              )}
            </span>
          </div>
        </div>

        {/* Linha 3: Barra de Progresso de Estados (Stepper) */}
        <div className="pt-1">
          <div className="grid grid-cols-5 gap-1 text-[11px] font-medium">
            {TICKET_STATUSES.map((st, idx) => {
              const currentOrder = statusInfo.order;
              const isPast = st.order <= currentOrder;
              const isCurrent = st.order === currentOrder;
              return (
                <div key={st.id} className="flex flex-col items-center text-center gap-1">
                  <div
                    className={cn(
                      "h-1.5 w-full rounded-full transition-all",
                      isCurrent
                        ? "bg-amber-500 shadow-sm shadow-amber-500/50"
                        : isPast
                        ? "bg-emerald-500/80"
                        : "bg-secondary"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] truncate max-w-full hidden sm:inline-block",
                      isCurrent
                        ? "text-amber-400 font-bold"
                        : isPast
                        ? "text-emerald-400"
                        : "text-muted-foreground/60"
                    )}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Linha: Membros Participantes do Chamado */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border/40 flex-wrap text-xs">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
            <Users className="h-3.5 w-3.5 text-amber-400" />
            Membros:
          </span>

          {/* Autor */}
          <div className="flex items-center gap-1 bg-secondary/70 border border-border/70 rounded-full px-2 py-0.5" title="Autor do Chamado">
            <Avatar className="h-3.5 w-3.5">
              <AvatarImage src={ticket.creator_avatar || undefined} />
              <AvatarFallback className="text-[7px]">
                {ticket.creator_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] font-medium text-foreground">
              {ticket.creator_nickname || ticket.creator_name}
            </span>
            <Badge variant="outline" className="text-[8px] py-0 px-1 border-amber-500/30 text-amber-400 bg-amber-500/10">
              Autor
            </Badge>
          </div>

          {/* Responsável */}
          {ticket.assigned_to_name && (
            <div className="flex items-center gap-1 bg-secondary/70 border border-border/70 rounded-full px-2 py-0.5" title="Responsável Atribuído">
              <Avatar className="h-3.5 w-3.5">
                <AvatarImage src={ticket.assigned_to_avatar || undefined} />
                <AvatarFallback className="text-[7px]">
                  {ticket.assigned_to_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium text-sky-400">
                {ticket.assigned_to_nickname || ticket.assigned_to_name}
              </span>
              <Badge variant="outline" className="text-[8px] py-0 px-1 border-sky-500/30 text-sky-400 bg-sky-500/10">
                Resp
              </Badge>
            </div>
          )}

          {/* Membros Adicionados */}
          {(ticket.members || []).map((m) => (
            <div
              key={m.user_id}
              className="group flex items-center gap-1 bg-secondary/70 border border-border/70 rounded-full pl-2 pr-1 py-0.5 hover:border-border transition-colors"
              title={`Adicionado por ${m.added_by_name}`}
            >
              <Avatar className="h-3.5 w-3.5">
                <AvatarImage src={m.avatar || undefined} />
                <AvatarFallback className="text-[7px]">
                  {m.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium text-foreground">
                {m.nickname || m.name}
              </span>
              {canManageMembers && !isClosed && (
                <button
                  type="button"
                  onClick={() => removeMemberMutation.mutate({ ticketId: ticket.id, memberUserId: m.user_id })}
                  disabled={removeMemberMutation.isPending}
                  className="ml-0.5 text-muted-foreground hover:text-rose-400 p-0.5 rounded-full transition-colors"
                  title="Remover membro do chamado"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* Botão Adicionar Membro */}
          {canManageMembers && !isClosed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMemberSearchTerm("");
                setMemberDialogOpen(true);
              }}
              className="h-6 text-[11px] px-2 gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-full border border-dashed border-amber-500/30"
            >
              <UserPlus className="h-3 w-3" />
              Adicionar Membro
            </Button>
          )}
        </div>

        {/* Linha 4: Barra de Ações (Gerência ou Autor) */}
        {(effectiveCanManage || isCreator) && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50 flex-wrap">
            {/* Assumir (Apenas Gerência) */}
            {effectiveCanManage && ticket.assigned_to_id !== user?.id && !isClosed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => claimMutation.mutate(ticket.id)}
                disabled={claimMutation.isPending}
                className="h-7 text-xs gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Assumir Atendimento
              </Button>
            )}

            {/* Transferir (Apenas Gerência) */}
            {effectiveCanManage && !isClosed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransferDialogOpen(true)}
                className="h-7 text-xs gap-1.5 border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Transferir
              </Button>
            )}

            {/* Alterar Status (Apenas Gerência) */}
            {effectiveCanManage && !isClosed && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Alterar Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover border-border">
                  <DropdownMenuLabel className="text-xs">Definir Novo Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {TICKET_STATUSES.filter((s) => s.id !== "fechado").map((s) => (
                    <DropdownMenuItem
                      key={s.id}
                      onClick={() =>
                        updateStatusMutation.mutate({ ticketId: ticket.id, status: s.id })
                      }
                      className={cn("text-xs cursor-pointer", s.id === ticket.status && "font-bold text-amber-400")}
                    >
                      {s.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Fechar Ticket (Gerência ou Autor) */}
            {!isClosed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCloseDialogOpen(true)}
                className="h-7 text-xs gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 ml-auto"
              >
                <Lock className="h-3.5 w-3.5" />
                {isCreator && !effectiveCanManage ? "Encerrar Chamado" : "Fechar Ticket"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => reopenMutation.mutate(ticket.id)}
                disabled={reopenMutation.isPending}
                className="h-7 text-xs gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 ml-auto"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reabrir Chamado
              </Button>
            )}

            {/* Excluir Chamado (Apenas Gerência / Liderança / Dev) */}
            {effectiveCanManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-7 text-xs gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                title="Excluir chamado permanentemente"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 2. Área de Mensagens / Conversação */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Card da Descrição Inicial Aberta pelo Membro */}
        <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={ticket.creator_avatar || undefined} />
                <AvatarFallback className="text-xs">
                  {ticket.creator_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {ticket.creator_nickname || ticket.creator_name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] px-1.5 py-0", levelBadgeClass(ticket.creator_role))}
                  >
                    {LEVEL_LABEL[ticket.creator_role] || ticket.creator_role}
                  </Badge>
                  <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 rounded">
                    Autor do Chamado
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Abertura inicial • {dateTime(ticket.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </div>

          {/* Anexos Iniciais */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="pt-2 border-t border-border/40 space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                Anexos / Prints ({ticket.attachments.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((att) => (
                  <div
                    key={att.id}
                    onClick={() => setLightboxImage(att)}
                    className="group relative w-24 h-24 rounded-lg overflow-hidden border border-border bg-black/40 cursor-pointer"
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
            </div>
          )}
        </div>

        {/* Thread de Mensagens e Notas Internas */}
        {ticket.messages && ticket.messages.length > 0 && (
          <div className="space-y-3 pt-2">
            {ticket.messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const isNote = msg.is_internal_note;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col space-y-1.5 max-w-[88%] sm:max-w-[78%]",
                    isNote
                      ? "mx-auto w-full max-w-[96%]"
                      : isMe
                      ? "ml-auto items-end"
                      : "mr-auto items-start"
                  )}
                >
                  {/* Se for NOTA INTERNA PRIVADA */}
                  {isNote ? (
                    <div className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2 shadow-sm">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                          <Lock className="h-3.5 w-3.5" />
                          <span>NOTA INTERNA PRIVADA (Visível apenas para a gerência)</span>
                        </div>
                        <span className="text-[10px] text-amber-300/80">
                          {dateTime(msg.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={msg.sender_avatar || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {msg.sender_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-amber-300">
                          {msg.sender_nickname || msg.sender_name}
                        </span>
                        <span className="text-[10px] text-amber-400/80">
                          ({LEVEL_LABEL[msg.sender_role] || msg.sender_role})
                        </span>
                      </div>
                      <p className="text-xs text-amber-100 whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              onClick={() => setLightboxImage(att)}
                              className="w-20 h-20 rounded-md overflow-hidden border border-amber-500/40 cursor-pointer"
                            >
                              <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Mensagem Normal */
                    <div
                      className={cn(
                        "rounded-2xl p-3.5 text-xs sm:text-sm space-y-1.5 shadow-sm",
                        isMe
                          ? "bg-amber-500/15 border border-amber-500/30 text-foreground rounded-br-none"
                          : "bg-secondary/70 border border-border text-foreground rounded-bl-none"
                      )}
                    >
                      <div className="flex items-center gap-2 border-b border-border/30 pb-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={msg.sender_avatar || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {msg.sender_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-xs text-foreground">
                          {isMe ? "Você" : msg.sender_nickname || msg.sender_name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] px-1 py-0", levelBadgeClass(msg.sender_role))}
                        >
                          {LEVEL_LABEL[msg.sender_role] || msg.sender_role}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatTimeOnly(msg.created_at)}
                        </span>
                      </div>

                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                      {/* Anexos da mensagem */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {msg.attachments.map((att) => (
                            <div
                              key={att.id}
                              onClick={() => setLightboxImage(att)}
                              className="w-20 h-20 rounded-md overflow-hidden border border-border cursor-pointer group relative"
                            >
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
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

        {/* Banner de Chamado Fechado */}
        {isClosed && (
          <div className="rounded-xl border border-zinc-500/30 bg-zinc-500/10 p-4 text-center space-y-1.5 my-3">
            <div className="flex items-center justify-center gap-1.5 text-zinc-400 font-bold text-xs sm:text-sm">
              <Lock className="h-4 w-4" />
              <span>CHAMADO FINALIZADO E FECHADO</span>
            </div>
            {ticket.closed_reason && (
              <p className="text-xs text-muted-foreground">
                Conclusão: <span className="text-foreground italic">"{ticket.closed_reason}"</span>
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Finalizado por {ticket.closed_by_name || "Gerência"} em {dateTime(ticket.closed_at)}
            </p>
          </div>
        )}
      </div>

      {/* 3. Caixa de Envio de Respostas / Notas Internas */}
      {!isClosed ? (
        <div className="border-t border-border/80 bg-secondary/20 p-3 sm:p-4 space-y-2 shrink-0">
          {/* Controles de Anexos e Nota Interna */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs gap-1 border-border/70 bg-secondary/40 text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="h-3 w-3" />
                Anexar Print
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

              {/* Botão Switch Nota Interna (somente gerência) */}
              {effectiveCanManage && (
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10">
                  <Switch
                    id="internal_note_switch"
                    checked={isInternalNote}
                    onCheckedChange={setIsInternalNote}
                    className="scale-75 data-[state=checked]:bg-amber-500"
                  />
                  <Label
                    htmlFor="internal_note_switch"
                    className="text-[11px] font-semibold text-amber-400 flex items-center gap-1 cursor-pointer select-none"
                  >
                    <Lock className="h-3 w-3" />
                    Nota Interna Privada
                  </Label>
                </div>
              )}
            </div>

            <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
              Pressione <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] border">Ctrl+Enter</kbd> para enviar
            </span>
          </div>

          {/* Miniaturas de anexos anexados na resposta */}
          {replyAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {replyAttachments.map((att) => (
                <div
                  key={att.id}
                  className="group relative w-16 h-16 rounded-md overflow-hidden border border-border bg-secondary"
                >
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      setReplyAttachments((prev) => prev.filter((a) => a.id !== att.id))
                    }
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 hover:bg-rose-600 text-white"
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
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isInternalNote
                  ? "🔒 Digite uma nota interna confidencial (visível apenas para a gerência)..."
                  : "Escreva uma resposta para o chamado..."
              }
              rows={2}
              className={cn(
                "resize-none text-xs sm:text-sm bg-card border-border focus-visible:ring-1",
                isInternalNote
                  ? "border-amber-500/50 bg-amber-500/5 focus-visible:ring-amber-500/50 text-amber-100 placeholder:text-amber-400/50"
                  : "focus-visible:ring-amber-500/40"
              )}
            />
            <Button
              type="button"
              onClick={handleSendReply}
              disabled={addMessageMutation.isPending}
              className={cn(
                "h-10 px-4 shrink-0 font-semibold gap-1.5 text-xs text-black",
                isInternalNote
                  ? "bg-amber-400 hover:bg-amber-500"
                  : "bg-amber-500 hover:bg-amber-600"
              )}
            >
              <Send className="h-3.5 w-3.5" />
              {isInternalNote ? "Salvar Nota" : "Responder"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border/80 bg-secondary/10 p-3 text-center text-xs text-muted-foreground">
          Este chamado está fechado. Para interagir novamente, a gerência deve reabri-lo.
        </div>
      )}

      {/* MODAL: Transferir Responsável */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-purple-400" />
              Transferir Chamado
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione outro membro da gerência para assumir a responsabilidade deste chamado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Novo Responsável *</Label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg p-1">
                {managementMembers.map((m) => {
                  const isSelected = selectedNewAssigneeId === m.user_id;
                  return (
                    <div
                      key={m.user_id}
                      onClick={() => setSelectedNewAssigneeId(m.user_id)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors",
                        isSelected
                          ? "bg-purple-500/20 text-purple-300 font-semibold"
                          : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={m.avatar_url || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {m.nome.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{m.nickname || m.nome}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {LEVEL_LABEL[m.nivel as any] || m.nivel}
                      </Badge>
                    </div>
                  );
                })}
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
                placeholder="Ex: Transferido para resolução com 01..."
                className="text-xs bg-secondary/30"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTransferDialogOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmTransfer}
              disabled={transferMutation.isPending || !selectedNewAssigneeId}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
            >
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Fechar Chamado */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-400">
              <Lock className="h-4 w-4" />
              Finalizar e Fechar Chamado
            </DialogTitle>
            <DialogDescription className="text-xs">
              O chamado será marcado como fechado e todo o histórico e mensagens serão preservados para auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="close_reason" className="text-xs font-semibold">
              Conclusão / Justificativa do Fechamento
            </Label>
            <Textarea
              id="close_reason"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="Ex: Dúvida esclarecida pelo chat / Reembolso aprovado e pago no jogo..."
              rows={3}
              className="text-xs bg-secondary/30"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCloseDialogOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmClose}
              disabled={closeMutation.isPending}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Fechar Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmar Exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Excluir Chamado Permanentemente</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Tem certeza que deseja excluir o chamado{" "}
              <strong className="text-foreground">{formatTicketNumber(ticket.ticket_number)} — {ticket.subject}</strong>?
              Esta ação não pode ser desfeita e removerá todo o histórico de mensagens e anexos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Adicionar Membro ao Chamado */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-400">
              <UserPlus className="h-5 w-5" />
              <DialogTitle>Adicionar Membro ao Chamado</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              O membro adicionado poderá visualizar todo o histórico do chamado e participar das mensagens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder="Buscar membro por nome ou apelido..."
                className="pl-8 h-8 text-xs bg-secondary/40 border-border"
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
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 border border-transparent hover:border-border/60 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={m.avatar_url || m.discord_avatar_url || undefined} />
                        <AvatarFallback className="text-[9px]">
                          {m.nome.slice(0, 2).toUpperCase()}
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
                      className="h-7 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30 gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Adicionar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox / Imagem Tela Cheia */}
      {lightboxImage && (
        <Dialog open={Boolean(lightboxImage)} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-border">
            <div className="relative flex flex-col items-center justify-center p-2">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-h-[85vh] w-auto rounded object-contain"
              />
              <p className="text-xs text-muted-foreground mt-2">{lightboxImage.name}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
