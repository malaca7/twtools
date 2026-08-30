import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  ArrowLeft,
  Users,
  Search,
  Settings,
  Info,
  Loader2,
  Lock,
  Unlock,
  Phone,
  Clock,
  Sparkles,
  Columns2,
  Maximize2,
  Copy,
  Trash2,
  Forward,
  CheckSquare,
  Check,
  X,
  Pin,
  Star,
  Vote,
  VolumeX,
  Volume2,
  FolderArchive,
  Bell,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useChatRoom } from "@/hooks/useChat";
import { useQueryClient } from "@tanstack/react-query";
import {
  updateGroupSettings,
  togglePinChatMessage,
  toggleSaveChatMessage,
} from "@/services/chatService";
import { toast } from "sonner";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { GroupSettingsDrawer } from "./GroupSettingsDrawer";
import { ChatSearchDialog } from "./ChatSearchDialog";
import { ForwardMessageDialog } from "./ForwardMessageDialog";
import { UserProfileDrawer } from "./UserProfileDrawer";
import { PinnedMessagesBanner } from "./PinnedMessagesBanner";
import { CreatePollDialog } from "./CreatePollDialog";
import { SavedMessagesDrawer } from "./SavedMessagesDrawer";
import { MuteConversationDialog } from "./MuteConversationDialog";
import { ChatMediaGalleryDrawer } from "./ChatMediaGalleryDrawer";
import { CreateReminderDialog } from "./CreateReminderDialog";
import { CreateEventDialog } from "./CreateEventDialog";
import { EphemeralSettingsDialog } from "./EphemeralSettingsDialog";
import { ModerationToolsDialog } from "./ModerationToolsDialog";
import { ReportMessageDialog } from "./ReportMessageDialog";
import { MessageThreadDrawer } from "./MessageThreadDrawer";
import { useConversations } from "@/hooks/useChat";
import { formatTimeOnly, isTodayDate, isYesterdayDate, formatUserPresenceText } from "@/lib/format";
import { LEVEL_LABEL } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatMessage } from "@/types/chat";
import { Calendar, ShieldAlert, Timer, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatWindowProps {
  conversation: ChatConversation;
  onBack: () => void;
  onConversationUpdated?: () => void;
  onStartPrivateChat?: (userId: string) => void;
  onSelectConversation?: (targetConversation: ChatConversation) => void;
  viewMode?: "split" | "focus";
  onToggleViewMode?: (mode: "split" | "focus") => void;
}

export function ChatWindow({
  conversation,
  onBack,
  onConversationUpdated,
  onStartPrivateChat,
  onSelectConversation,
  viewMode = "split",
  onToggleViewMode,
}: ChatWindowProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    isSending,
    uploadProgress,
    typingUsers,
    replyingTo,
    setReplyingTo,
    sendMessage,
    sendAttachment,
    toggleReaction,
    editMessage,
    deleteMessage,
    sendTypingNotification,
  } = useChatRoom(conversation.id);

  const { conversations: allConversations } = useConversations();
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createPollOpen, setCreatePollOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [ephemeralSettingsOpen, setEphemeralSettingsOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [threadMessage, setThreadMessage] = useState<ChatMessage | null>(null);
  const [reportedMessage, setReportedMessage] = useState<ChatMessage | null>(null);
  const [savedMessagesOpen, setSavedMessagesOpen] = useState(false);
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState<ChatMessage | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  
  // Estado de encaminhamento (único ou múltiplo)
  const [forwardMessages, setForwardMessages] = useState<ChatMessage[] | null>(null);

  // Estado de seleção múltipla
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
  const isSelectionMode = selectedMessageIds.size > 0;

  // Lista de mensagens fixadas na conversa
  const pinnedMessages = messages.filter((m) => m.is_pinned && !m.is_deleted);

  const toggleSelectMessage = (messageId: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const selectAllMessages = () => {
    if (selectedMessageIds.size === messages.length) {
      setSelectedMessageIds(new Set());
    } else {
      setSelectedMessageIds(new Set(messages.map((m) => m.id)));
    }
  };

  const clearSelection = () => {
    setSelectedMessageIds(new Set());
  };

  const handleBatchCopy = () => {
    const selected = messages.filter((m) => selectedMessageIds.has(m.id));
    if (selected.length === 0) return;
    const text = selected
      .map((m) => `[${formatTimeOnly(m.created_at)}] ${m.sender_name || "Membro"}: ${m.content || m.attachment_name || "Anexo"}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success(`${selected.length} mensagens copiadas!`);
    clearSelection();
  };

  const handleBatchForward = () => {
    const selected = messages.filter((m) => selectedMessageIds.has(m.id));
    if (selected.length === 0) return;
    setForwardMessages(selected);
  };

  const handleBatchDelete = async (forEveryone: boolean) => {
    const ids = Array.from(selectedMessageIds);
    if (ids.length === 0) return;
    setBatchDeleteModalOpen(false);
    clearSelection();

    try {
      for (const id of ids) {
        await deleteMessage(id, forEveryone);
      }
      toast.success(`${ids.length} mensagens apagadas.`);
    } catch (err: any) {
      toast.error(`Erro ao apagar mensagens: ${err.message || err}`);
    }
  };

  // Handler para fixar/desafixar mensagem
  const handleTogglePin = async (messageId: string) => {
    try {
      const nextState = await togglePinChatMessage(messageId, currentUserId);
      toast.success(nextState ? "Mensagem fixada no topo!" : "Mensagem desafixada.");
      queryClient.setQueryData<ChatMessage[]>(["chat_messages", conversation.id], (old = []) =>
        old.map((m) => (m.id === messageId ? { ...m, is_pinned: nextState } : m))
      );
    } catch (err: any) {
      toast.error(`Erro ao alterar fixação: ${err.message || err}`);
    }
  };

  // Handler para salvar/favoritar mensagem
  const handleToggleSave = async (messageId: string) => {
    try {
      const nextSaved = await toggleSaveChatMessage(messageId, conversation.id, currentUserId);
      toast.success(nextSaved ? "Mensagem salva nos favoritos! ⭐" : "Mensagem removida dos favoritos.");
      queryClient.setQueryData<ChatMessage[]>(["chat_messages", conversation.id], (old = []) =>
        old.map((m) => (m.id === messageId ? { ...m, is_saved: nextSaved } : m))
      );
    } catch (err: any) {
      toast.error(`Erro ao salvar mensagem: ${err.message || err}`);
    }
  };

  // Handler para atualização de enquete
  const handlePollUpdated = (messageId: string, pollData: any) => {
    queryClient.setQueryData<ChatMessage[]>(["chat_messages", conversation.id], (old = []) =>
      old.map((m) => (m.id === messageId ? { ...m, poll_data: pollData } : m))
    );
  };

  // Handler para atualização de evento
  const handleEventUpdated = (messageId: string, eventData: any) => {
    queryClient.setQueryData<ChatMessage[]>(["chat_messages", conversation.id], (old = []) =>
      old.map((m) => (m.id === messageId ? { ...m, event_data: eventData } : m))
    );
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);
  const isNearBottomRef = useRef(true);
  const prevLastMessageIdRef = useRef<string | null>(null);

  // Auto-scroll to bottom inside the messages container (without scrolling the outer window)
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      if (behavior === "auto") {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      } else {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  };

  // Scroll no carregamento inicial da conversa
  useEffect(() => {
    if (isLoading) {
      isInitialLoadRef.current = true;
      return;
    }
    if (isInitialLoadRef.current && messages.length > 0) {
      scrollToBottom("auto");
      isInitialLoadRef.current = false;
      const lastMsg = messages[messages.length - 1];
      prevLastMessageIdRef.current = lastMsg ? lastMsg.id : null;
    }
  }, [conversation.id, isLoading]);

  // Mantém a posição exata ao carregar mensagens antigas ou rola apenas em novas mensagens no fundo
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current !== null && scrollContainerRef.current) {
      const currentScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = currentScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
      return;
    }

    // Se uma nova mensagem foi adicionada no final da lista
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.id !== prevLastMessageIdRef.current) {
        prevLastMessageIdRef.current = lastMsg.id;
        // Rola para baixo APENAS se a mensagem for enviada pelo próprio usuário OU se o usuário já estiver no final da tela
        if (lastMsg.is_self || isNearBottomRef.current) {
          scrollToBottom("smooth");
        }
      }
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 90;

    // Carrega mensagens mais antigas quando o usuário rola perto do topo
    if (target.scrollTop < 80 && hasMore && !isLoadingMore && !isLoading && messages.length >= 20) {
      prevScrollHeightRef.current = target.scrollHeight;
      void loadMoreMessages();
    }
  };

  // Scroll to a specific message
  const handleScrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "rounded-2xl");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary");
      }, 2000);
    }
  };

  // Header display calculations & admin role verification
  const isGroup = conversation.type === "group";
  const isCreator = isGroup && conversation.created_by === currentUserId;
  const myParticipant = isGroup ? conversation.participants.find((p) => p.user_id === currentUserId) : null;
  const isGroupAdmin = isCreator || myParticipant?.role === "admin" || conversation.my_role === "admin";
  const effectiveUserRole = isGroupAdmin ? "admin" : "member";

  const otherMember = conversation.other_participant;
  const title = isGroup
    ? conversation.title || "Grupo"
    : otherMember?.nickname
    ? `${otherMember.nickname} (${otherMember.nome})`
    : otherMember?.nome || otherMember?.discord_username || "Membro";

  const avatarUrl = isGroup ? conversation.avatar_url : otherMember?.discord_avatar_url;
  const initials = (isGroup ? conversation.title || "GR" : otherMember?.nickname || otherMember?.nome || "M").slice(0, 2).toUpperCase();

  const isOnline = otherMember?.presence_status === "online";
  const isAusente = otherMember?.presence_status === "ausente";
  const memberNivelLabel = otherMember?.nivel ? LEVEL_LABEL[otherMember.nivel] || otherMember.nivel : null;

  const queryClient = useQueryClient();
  const [togglingLock, setTogglingLock] = useState(false);

  const handleQuickToggleOnlyAdmins = async () => {
    if (!isGroup || !isGroupAdmin || togglingLock) return;
    const nextState = !conversation.only_admins_can_post;
    setTogglingLock(true);

    // Optimistic update
    queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
      old.map((c) => (c.id === conversation.id ? { ...c, only_admins_can_post: nextState } : c))
    );

    try {
      await updateGroupSettings({
        conversation_id: conversation.id,
        title: conversation.title || "Grupo",
        only_admins_can_post: nextState,
      });
      toast.success(
        nextState
          ? "🔒 Modo Somente Administradores ativado!"
          : "🔓 Chat liberado para todos os membros."
      );
      onConversationUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar permissão do grupo.");
      void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
    } finally {
      setTogglingLock(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card overflow-hidden select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 border-b border-border/80 bg-secondary/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className={cn(
              "h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer",
              viewMode === "split" && Boolean(onToggleViewMode) && "md:hidden"
            )}
            title="Voltar para lista de conversas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div
            onClick={() => {
              if (isGroup) {
                setGroupSettingsOpen(true);
              } else if (otherMember) {
                setProfileUserId(otherMember.user_id);
              }
            }}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            <div className="relative shrink-0">
              <Avatar className="h-9 w-9 border border-border/80 shadow-xs group-hover:ring-1 group-hover:ring-primary transition-all">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {isGroup ? <Users className="h-4 w-4" /> : initials}
                </AvatarFallback>
              </Avatar>

              {!isGroup && (
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                    isOnline ? "bg-emerald-500 shadow-xs" : isAusente ? "bg-amber-500 animate-pulse" : "bg-zinc-500"
                  )}
                  title={isOnline ? "Online" : isAusente ? "Ausente" : "Offline"}
                />
              )}
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <h4 className="truncate font-extrabold text-xs text-foreground leading-tight group-hover:text-primary transition-colors">
                  {title}
                </h4>
                {isGroup && conversation.only_admins_can_post && (
                  <Badge variant="outline" className="text-[8px] font-mono border-amber-500/40 text-amber-400 bg-amber-500/10 px-1 py-0 font-bold shrink-0">
                    <Lock className="h-2.5 w-2.5 mr-0.5 inline" /> Somente Admins
                  </Badge>
                )}
                {!isGroup && otherMember?.is_developer && (
                  <Badge variant="outline" className="text-[8px] font-mono px-1 py-0 border-rose-500/40 text-rose-400 bg-rose-500/10 font-bold shrink-0">
                    DEV
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground leading-none font-mono flex-wrap">
                {isGroup ? (
                  <span>{conversation.participants.length} participantes</span>
                ) : (
                  <>
                    <span
                      className={cn(
                        "font-bold flex items-center gap-1",
                        isOnline ? "text-emerald-400" : isAusente ? "text-amber-400" : "text-zinc-400"
                      )}
                    >
                      ● {formatUserPresenceText(
                        otherMember?.presence_status,
                        otherMember?.last_seen,
                        otherMember?.presence_updated_at || otherMember?.updated_at
                      )}
                    </span>
                    {otherMember?.game_id && (
                      <span className="text-foreground/80 font-bold">
                        #{otherMember.game_id}
                      </span>
                    )}
                    {memberNivelLabel && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                        {memberNivelLabel}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex items-center gap-1 shrink-0">
          {isGroup && isGroupAdmin && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleQuickToggleOnlyAdmins}
              disabled={togglingLock}
              className={cn(
                "h-8 px-2 text-[11px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 mr-1",
                conversation.only_admins_can_post
                  ? "text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
              )}
              title={
                conversation.only_admins_can_post
                  ? "Clique para liberar o chat para todos os membros"
                  : "Clique para permitir envio de mensagens somente por administradores"
              }
            >
              {togglingLock ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : conversation.only_admins_can_post ? (
                <>
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Somente Admins</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Chat Livre</span>
                </>
              )}
            </Button>
          )}

          {/* LAYOUT MODE TOGGLE (SPLIT VS FOCUS) */}
          {onToggleViewMode && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onToggleViewMode(viewMode === "split" ? "focus" : "split")}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer hidden sm:flex"
              title={
                viewMode === "split"
                  ? "Modo Dividido ativo (clique para alternar para Modo Foco em tela cheia)"
                  : "Modo Foco ativo (clique para alternar para Modo Dividido lado a lado)"
              }
            >
              {viewMode === "split" ? (
                <Columns2 className="h-4 w-4 text-primary" />
              ) : (
                <Maximize2 className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}

          {/* CRIAR EVENTO */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCreateEventOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"
            title="Criar Evento / Ação"
          >
            <Calendar className="h-4 w-4 text-emerald-400" />
          </Button>

          {/* CRIAR ENQUETE */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCreatePollOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"
            title="Criar Enquete"
          >
            <Vote className="h-4 w-4 text-primary" />
          </Button>

          {/* CENTRAL DE MÍDIA E ARQUIVOS */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMediaGalleryOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"
            title="Central de Mídia e Arquivos"
          >
            <FolderArchive className="h-4 w-4" />
          </Button>

          {/* SILENCIAR NOTIFICAÇÕES */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setMuteDialogOpen(true)}
            className={cn(
              "h-8 w-8 rounded-lg cursor-pointer transition-colors",
              conversation.is_muted
                ? "text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
            title={conversation.is_muted ? "Conversa Silenciada (clique para gerenciar)" : "Silenciar Notificações"}
          >
            {conversation.is_muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          {/* MENSAGENS SALVAS */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSavedMessagesOpen(true)}
            className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg cursor-pointer"
            title="Mensagens Salvas & Favoritos"
          >
            <Star className="h-4 w-4 fill-amber-400/40" />
          </Button>

          {/* MENU DE OPÇÕES AVANÇADAS DA CONVERSA */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"
                title="Mais opções da conversa"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs rounded-xl">
              <DropdownMenuItem onClick={() => setSearchOpen(true)} className="cursor-pointer">
                <Search className="h-3.5 w-3.5 mr-2 text-primary" /> Buscar Mensagens
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setCreateEventOpen(true)} className="cursor-pointer">
                <Calendar className="h-3.5 w-3.5 mr-2 text-emerald-400" /> Agendar Evento
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEphemeralSettingsOpen(true)} className="cursor-pointer">
                <Timer className="h-3.5 w-3.5 mr-2 text-rose-400" /> Mensagens Temporárias
              </DropdownMenuItem>

              {isGroup && isGroupAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setModerationOpen(true)} className="cursor-pointer text-amber-400 font-bold">
                    <ShieldAlert className="h-3.5 w-3.5 mr-2 text-amber-400" /> Moderação do Chat
                  </DropdownMenuItem>
                </>
              )}

              {isGroup && (
                <DropdownMenuItem onClick={() => setGroupSettingsOpen(true)} className="cursor-pointer">
                  <Settings className="h-3.5 w-3.5 mr-2" /> Dados e Membros do Grupo
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* BANNER DE MENSAGENS FIXADAS */}
      <PinnedMessagesBanner
        pinnedMessages={pinnedMessages}
        onSelectMessage={handleScrollToMessage}
        onUnpinMessage={handleTogglePin}
        canManagePin={isGroupAdmin || !isGroup}
      />

      {/* MESSAGES SCROLL CONTAINER */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 select-text custom-scrollbar-thin"
      >
        {/* INDICADOR DE CARREGAMENTO DE MENSAGENS ANTERIORES NO TOPO */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-2 gap-2 text-[11px] text-muted-foreground animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span>Carregando histórico anterior...</span>
          </div>
        )}

        {!hasMore && messages.length >= 20 && (
          <div className="flex items-center justify-center py-2 text-[10px] text-muted-foreground/60 font-mono select-none">
            ✦ Início do histórico da conversa ✦
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Carregando histórico...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground space-y-2 select-none">
            <span className="text-3xl">💬</span>
            <p className="text-sm font-bold text-foreground">Nenhuma mensagem ainda</p>
            <p className="text-xs max-w-xs">
              Envie uma mensagem de texto, foto, áudio ou crie um evento para iniciar a conversa!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isSelf = m.sender_id === currentUserId || m.is_self;

            return (
              <MessageBubble
                key={m.id}
                message={m}
                isSelf={Boolean(isSelf)}
                isGroup={isGroup}
                userRole={effectiveUserRole}
                currentUserId={currentUserId}
                isSelectionMode={isSelectionMode}
                isSelected={selectedMessageIds.has(m.id)}
                onToggleSelect={toggleSelectMessage}
                onReply={(msg) => setReplyingTo(msg)}
                onOpenThread={(msg) => setThreadMessage(msg)}
                onReportMessage={(msg) => setReportedMessage(msg)}
                onForward={(msg) => setForwardMessages([msg])}
                onPin={handleTogglePin}
                onSave={handleToggleSave}
                onReminder={(msg) => setReminderMessage(msg)}
                onPollUpdated={handlePollUpdated}
                onEventUpdated={handleEventUpdated}
                onReact={(msgId, emoji) => toggleReaction(msgId, emoji)}
                onEdit={(msgId, content) => editMessage(msgId, content)}
                onDelete={(msgId, forEveryone) => deleteMessage(msgId, forEveryone)}
                onScrollToMessage={handleScrollToMessage}
                onOpenProfile={(uid) => setProfileUserId(uid)}
              />
            );
          })
        )}

        {/* TYPING INDICATOR */}
        <TypingIndicator typingUsers={typingUsers} />

        <div ref={messagesEndRef} />
      </div>

      {/* MULTI-SELECTION ACTION BAR OU MESSAGE INPUT */}
      {isSelectionMode ? (
        <div className="p-3 border-t border-border/80 bg-card/95 backdrop-blur-xl flex items-center justify-between gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground font-black px-2.5 py-1 text-xs">
              {selectedMessageIds.size} selecionada{selectedMessageIds.size > 1 ? "s" : ""}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAllMessages}
              className="h-8 text-xs font-bold rounded-xl hidden sm:inline-flex"
            >
              {selectedMessageIds.size === messages.length ? "Desmarcar tudo" : "Selecionar tudo"}
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleBatchCopy}
              className="h-8 px-2.5 text-xs font-bold rounded-xl gap-1"
              title="Copiar selecionadas"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copiar</span>
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleBatchForward}
              className="h-8 px-3 text-xs font-bold rounded-xl gap-1 shadow-md shadow-primary/20"
              title="Encaminhar selecionadas"
            >
              <Forward className="h-3.5 w-3.5" />
              <span>Encaminhar ({selectedMessageIds.size})</span>
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBatchDeleteModalOpen(true)}
              className="h-8 px-2.5 text-xs font-bold rounded-xl gap-1"
              title="Apagar selecionadas"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Apagar</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSelection}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
              title="Cancelar seleção"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* MESSAGE INPUT COMPONENT */
        <MessageInput
          onSendMessage={async (text) => {
            await sendMessage(text);
            scrollToBottom();
            onConversationUpdated?.();
          }}
          onSendAttachment={async (file, caption) => {
            await sendAttachment(file, caption);
            scrollToBottom();
            onConversationUpdated?.();
          }}
          onTyping={sendTypingNotification}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          uploadProgress={uploadProgress}
          isSending={isSending}
          disabled={isLoading}
          onlyAdminsCanPost={Boolean(conversation.only_admins_can_post)}
          userRole={effectiveUserRole}
        />
      )}

      {/* GROUP SETTINGS DRAWER / DIALOG */}
      {isGroup && (
        <GroupSettingsDrawer
          open={groupSettingsOpen}
          onOpenChange={setGroupSettingsOpen}
          conversation={conversation}
          onConversationUpdated={() => {
            onConversationUpdated?.();
          }}
          onLeaveGroup={onBack}
          onOpenProfile={(uid) => setProfileUserId(uid)}
        />
      )}

      {/* SEARCH IN CONVERSATION DIALOG */}
      <ChatSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        messages={messages}
        onSelectMessage={handleScrollToMessage}
      />

      {/* FORWARD MESSAGE DIALOG */}
      <ForwardMessageDialog
        open={Boolean(forwardMessages && forwardMessages.length > 0)}
        onOpenChange={(op) => !op && setForwardMessages(null)}
        messages={forwardMessages}
        conversations={allConversations}
        currentUserId={currentUserId}
        onSuccess={() => onConversationUpdated?.()}
        onForwardSuccess={(targetConv) => {
          setForwardMessages(null);
          clearSelection();
          onSelectConversation?.(targetConv);
        }}
      />

      {/* BATCH DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={batchDeleteModalOpen} onOpenChange={setBatchDeleteModalOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black">
              Apagar {selectedMessageIds.size} mensagem{selectedMessageIds.size > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Escolha como deseja excluir as mensagens selecionadas:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl text-xs">Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleBatchDelete(false)}
              className="rounded-xl text-xs cursor-pointer"
            >
              Apagar para mim ({selectedMessageIds.size})
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => handleBatchDelete(true)}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              Apagar para todos ({selectedMessageIds.size})
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* USER PROFILE MODAL */}
      <UserProfileDrawer
        userId={profileUserId}
        open={Boolean(profileUserId)}
        onOpenChange={(op) => !op && setProfileUserId(null)}
        onStartChat={(uid) => {
          setProfileUserId(null);
          onStartPrivateChat?.(uid);
        }}
      />

      {/* CRIAR ENQUETE MODAL */}
      <CreatePollDialog
        open={createPollOpen}
        onOpenChange={setCreatePollOpen}
        conversationId={conversation.id}
        currentUserId={currentUserId}
        currentUserName={user?.user_metadata?.custom_claims?.global_name || user?.email || "Membro"}
        onSuccess={() => onConversationUpdated?.()}
      />

      {/* MENSAGENS SALVAS DRAWER */}
      <SavedMessagesDrawer
        open={savedMessagesOpen}
        onOpenChange={setSavedMessagesOpen}
        currentUserId={currentUserId}
        conversations={allConversations}
        onNavigateToMessage={(convId, msgId) => {
          if (convId === conversation.id) {
            handleScrollToMessage(msgId);
          } else {
            const target = allConversations.find((c) => c.id === convId);
            if (target && onSelectConversation) {
              onSelectConversation(target);
              setTimeout(() => handleScrollToMessage(msgId), 300);
            }
          }
        }}
      />

      {/* SILENCIAR NOTIFICAÇÕES MODAL */}
      <MuteConversationDialog
        open={muteDialogOpen}
        onOpenChange={setMuteDialogOpen}
        conversationId={conversation.id}
        conversationTitle={title}
        isMuted={Boolean(conversation.is_muted)}
        currentUserId={currentUserId}
        onSuccess={() => onConversationUpdated?.()}
      />

      {/* CENTRAL DE MÍDIA E ARQUIVOS DRAWER */}
      <ChatMediaGalleryDrawer
        open={mediaGalleryOpen}
        onOpenChange={setMediaGalleryOpen}
        messages={messages}
        conversationTitle={title}
        onSelectMessage={handleScrollToMessage}
      />

      {/* CRIAR LEMBRETE MODAL */}
      <CreateReminderDialog
        open={Boolean(reminderMessage)}
        onOpenChange={(op) => !op && setReminderMessage(null)}
        message={reminderMessage}
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onSuccess={() => onConversationUpdated?.()}
      />

      {/* CRIAR EVENTO MODAL */}
      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        conversationId={conversation.id}
        currentUserId={currentUserId}
        currentUserName={user?.user_metadata?.custom_claims?.global_name || user?.email || "Membro"}
        onSuccess={() => onConversationUpdated?.()}
      />

      {/* MENSAGENS TEMPORÁRIAS MODAL */}
      <EphemeralSettingsDialog
        open={ephemeralSettingsOpen}
        onOpenChange={setEphemeralSettingsOpen}
        conversationId={conversation.id}
        conversationTitle={title}
        currentTtlHours={conversation.ephemeral_ttl_hours || 0}
        currentUserId={currentUserId}
        onSuccess={() => onConversationUpdated?.()}
      />

      {/* FERRAMENTAS DE MODERAÇÃO */}
      <ModerationToolsDialog
        open={moderationOpen}
        onOpenChange={setModerationOpen}
        conversation={conversation}
        currentUserId={currentUserId}
        onActionComplete={() => onConversationUpdated?.()}
      />

      {/* DENUNCIAR MENSAGEM */}
      <ReportMessageDialog
        open={Boolean(reportedMessage)}
        onOpenChange={(op) => !op && setReportedMessage(null)}
        message={reportedMessage}
        conversationId={conversation.id}
        currentUserId={currentUserId}
      />

      {/* THREAD DE MENSAGEM DRAWER */}
      <MessageThreadDrawer
        open={Boolean(threadMessage)}
        onOpenChange={(op) => !op && setThreadMessage(null)}
        parentMessage={threadMessage}
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onReplySent={() => onConversationUpdated?.()}
      />
    </div>
  );
}
