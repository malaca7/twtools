import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
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
  Image as ImageIcon,
  MoreVertical,
  Calendar,
  ShieldAlert,
  Timer,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useChatRoom, useConversations } from "@/hooks/useChat";
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
import { WhatsAppWallpaperDialog } from "./WhatsAppWallpaperDialog";
import { MessageInfoModal } from "./MessageInfoModal";
import { formatTimeOnly, formatUserPresenceText } from "@/lib/format";
import { LEVEL_LABEL } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatMessage } from "@/types/chat";

interface ChatWindowProps {
  conversation: ChatConversation;
  allConversations?: ChatConversation[];
  onBack: () => void;
  onConversationUpdated?: () => void;
  onStartPrivateChat?: (userId: string) => void;
  onSelectConversation?: (targetConversation: ChatConversation) => void;
  viewMode?: "split" | "focus";
  onToggleViewMode?: (mode: "split" | "focus") => void;
}

function getDateLabel(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "HOJE";
  if (d.toDateString() === yesterday.toDateString()) return "ONTEM";
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
}

export function ChatWindow({
  conversation,
  allConversations: passedAllConversations,
  onBack,
  onConversationUpdated,
  onStartPrivateChat,
  onSelectConversation,
  viewMode = "split",
  onToggleViewMode,
}: ChatWindowProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const { conversations: fetchedConversations } = useConversations();
  const allConversations = passedAllConversations || fetchedConversations || [];

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
  } = useChatRoom(conversation.id, conversation);

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
  const [wallpaperDialogOpen, setWallpaperDialogOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState<ChatMessage | null>(null);

  // Tema de wallpaper do WhatsApp
  const [wallpaperTheme, setWallpaperTheme] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tw_chat_wallpaper_theme") || "default";
    }
    return "default";
  });

  useEffect(() => {
    const handleWallpaperChange = (e: any) => {
      if (e.detail?.theme) setWallpaperTheme(e.detail.theme);
    };
    window.addEventListener("tw_chat_wallpaper_change", handleWallpaperChange);
    return () => window.removeEventListener("tw_chat_wallpaper_change", handleWallpaperChange);
  }, []);

  // Estado de encaminhamento
  const [forwardMessages, setForwardMessages] = useState<ChatMessage[] | null>(null);

  // Estado de seleção múltipla
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [batchDeleteModalOpen, setBatchDeleteModalOpen] = useState(false);
  const isSelectionMode = selectedMessageIds.size > 0;

  const safeMessages = Array.isArray(messages) ? messages : [];

  // Lista de mensagens fixadas na conversa
  const pinnedMessages = safeMessages.filter((m) => m?.is_pinned && !m?.is_deleted);

  const toggleSelectMessage = (messageId: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const selectAllMessages = () => {
    if (selectedMessageIds.size === safeMessages.length) {
      setSelectedMessageIds(new Set());
    } else {
      setSelectedMessageIds(new Set(safeMessages.map((m) => m.id)));
    }
  };

  const clearSelection = () => {
    setSelectedMessageIds(new Set());
  };

  const handleBatchCopy = () => {
    const selected = safeMessages.filter((m) => m && selectedMessageIds.has(m.id));
    if (selected.length === 0) return;
    const text = selected
      .map((m) => `[${formatTimeOnly(m.created_at)}] ${m.sender_name || "Membro"}: ${m.content || m.attachment_name || "Anexo"}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success(`${selected.length} mensagens copiadas!`);
    clearSelection();
  };

  const handleBatchForward = () => {
    const selected = safeMessages.filter((m) => m && selectedMessageIds.has(m.id));
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
      toast.success(nextSaved ? "Mensagem favoritada! ⭐" : "Mensagem removida dos favoritos.");
      queryClient.setQueryData<ChatMessage[]>(["chat_messages", conversation.id], (old = []) =>
        old.map((m) => (m.id === messageId ? { ...m, is_saved: nextSaved } : m))
      );
    } catch (err: any) {
      toast.error(`Erro ao salvar mensagem: ${err.message || err}`);
    }
  };

  // Handlers para enquete e evento
  const handlePollUpdated = (messageId: string, pollData: any) => {
    queryClient.setQueryData<ChatMessage[]>(["chat_messages", conversation.id], (old = []) =>
      old.map((m) => (m.id === messageId ? { ...m, poll_data: pollData } : m))
    );
  };

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

  // Auto-scroll to bottom inside container
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

  useLayoutEffect(() => {
    if (prevScrollHeightRef.current !== null && scrollContainerRef.current) {
      const currentScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = currentScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
      return;
    }

    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.id !== prevLastMessageIdRef.current) {
        prevLastMessageIdRef.current = lastMsg.id;
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

    if (target.scrollTop < 80 && hasMore && !isLoadingMore && !isLoading && messages.length >= 20) {
      prevScrollHeightRef.current = target.scrollHeight;
      void loadMoreMessages();
    }
  };

  const handleScrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-[#00a884]", "rounded-lg");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-[#00a884]");
      }, 2000);
    }
  };

  // Header display calculations
  const isGroup = conversation.type === "group";
  const isCreator = isGroup && conversation.created_by === currentUserId;
  const safeParticipants = Array.isArray(conversation.participants) ? conversation.participants : [];
  const myParticipant = isGroup ? safeParticipants.find((p) => p?.user_id === currentUserId) : null;
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

  const bgThemeClass =
    wallpaperTheme === "slate"
      ? "theme-slate"
      : wallpaperTheme === "emerald"
      ? "theme-emerald"
      : wallpaperTheme === "solid"
      ? "theme-solid"
      : "";

  return (
    <div className="flex flex-col h-full w-full bg-[#0b141a] overflow-hidden select-none relative">
      {/* ─── WHATSAPP TOP HEADER BAR (#202c33) ─── */}
      <div className="flex items-center justify-between p-2.5 sm:px-4 sm:py-2.5 bg-[#202c33] border-b border-white/5 shrink-0 z-20 shadow-md gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className={cn(
              "h-9 w-9 -ml-1 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full shrink-0 cursor-pointer",
              viewMode === "split" && Boolean(onToggleViewMode) && "md:hidden"
            )}
            title="Voltar para lista de conversas"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div
            onClick={() => {
              if (isGroup) {
                setGroupSettingsOpen(true);
              } else if (otherMember) {
                setProfileUserId(otherMember.user_id);
              }
            }}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group select-none"
          >
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10 border border-white/10 shadow-xs group-hover:ring-2 group-hover:ring-[#00a884] transition-all">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
                <AvatarFallback className="bg-[#111b21] text-[#00a884] text-xs font-bold">
                  {isGroup ? <Users className="h-4 w-4" /> : initials}
                </AvatarFallback>
              </Avatar>

              {!isGroup && (
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#202c33]",
                    isOnline ? "bg-[#25d366]" : isAusente ? "bg-amber-500 animate-pulse" : "bg-zinc-500"
                  )}
                  title={isOnline ? "Online" : isAusente ? "Ausente" : "Offline"}
                />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <h4 className="truncate font-bold text-sm text-[#e9edef] leading-tight group-hover:text-[#00a884] transition-colors">
                  {title}
                </h4>
                {isGroup && conversation.only_admins_can_post && (
                  <Badge variant="outline" className="text-[8.5px] font-mono border-amber-500/40 text-amber-400 bg-amber-500/10 px-1.5 py-0 font-bold shrink-0">
                    <Lock className="h-2.5 w-2.5 mr-0.5 inline" /> Admins
                  </Badge>
                )}
                {!isGroup && otherMember?.is_developer && (
                  <Badge variant="outline" className="text-[8.5px] font-mono px-1.5 py-0 border-rose-500/40 text-rose-400 bg-rose-500/10 font-bold shrink-0">
                    DEV
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#8696a0] leading-none font-sans truncate">
                {isGroup ? (
                  <span>
                    {safeParticipants.map((p) => p?.profile?.nickname || p?.profile?.nome || "Membro").slice(0, 4).join(", ")}
                    {safeParticipants.length > 4 && ` e mais ${safeParticipants.length - 4}`}
                    {conversation.only_admins_can_post && " • 🔒 Somente Admins Falam"}
                  </span>
                ) : (
                  <>
                    <span
                      className={cn(
                        "flex items-center gap-1 font-medium",
                        isOnline ? "text-[#00a884] font-bold" : "text-[#8696a0]"
                      )}
                    >
                      {formatUserPresenceText(
                        otherMember?.presence_status,
                        otherMember?.last_seen,
                        otherMember?.presence_updated_at || otherMember?.updated_at
                      )}
                    </span>
                    {otherMember?.game_id && (
                      <span className="text-white/60 font-mono text-[10px]">
                        #{otherMember.game_id}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── HEADER ACTIONS: APENAS MENU 3-PONTOS ORGANIZADO ─── */}
        <div className="flex items-center shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
                title="Opções da conversa"
              >
                <MoreVertical className="h-5 w-5 text-[#aebac1]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 text-xs bg-[#233138] border border-white/10 text-white rounded-2xl shadow-2xl p-1.5 z-[1000] animate-in fade-in-50 zoom-in-95 duration-150"
            >
              <DropdownMenuItem
                onClick={() => {
                  if (isGroup) setGroupSettingsOpen(true);
                  else if (otherMember) setProfileUserId(otherMember.user_id);
                }}
                className="cursor-pointer hover:bg-white/10 rounded-xl p-2 font-medium"
              >
                <Info className="h-4 w-4 mr-2.5 text-[#00a884]" />
                {isGroup ? "Dados do grupo" : "Dados do contato"}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setSearchOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-xl p-2 font-medium">
                <Search className="h-4 w-4 mr-2.5 text-cyan-400" />
                Pesquisar na conversa
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setMediaGalleryOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-xl p-2 font-medium">
                <FolderArchive className="h-4 w-4 mr-2.5 text-indigo-400" />
                Mídias, links e arquivos
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setMuteDialogOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-xl p-2 font-medium">
                {conversation.is_muted ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-2.5 text-amber-400" /> Reativar som de notificações
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-2.5 text-amber-400" /> Silenciar notificações
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setWallpaperDialogOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-xl p-2 font-medium">
                <ImageIcon className="h-4 w-4 mr-2.5 text-emerald-400" />
                Mudar papel de parede
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setSavedMessagesOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-xl p-2 font-medium">
                <Star className="h-4 w-4 mr-2.5 text-yellow-400" /> Mensagens favoritas
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setCreateEventOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-xl p-2 font-medium">
                <Calendar className="h-4 w-4 mr-2.5 text-emerald-400" /> Agendar evento
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setCreatePollOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-xl p-2 font-medium">
                <Vote className="h-4 w-4 mr-2.5 text-purple-400" /> Criar enquete
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEphemeralSettingsOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-xl p-2 font-medium">
                <Timer className="h-4 w-4 mr-2.5 text-rose-400" /> Mensagens temporárias
              </DropdownMenuItem>

              {/* TOGGLE APENAS ADMINS FALAM DENTRO DO MENU */}
              {isGroup && isGroupAdmin && (
                <>
                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                  <DropdownMenuItem
                    onClick={handleQuickToggleOnlyAdmins}
                    disabled={togglingLock}
                    className="cursor-pointer hover:bg-amber-500/20 text-amber-400 rounded-xl p-2 font-bold flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {togglingLock ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : conversation.only_admins_can_post ? (
                        <Lock className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Unlock className="h-4 w-4 text-amber-400" />
                      )}
                      <span>Modo Somente Admins</span>
                    </div>
                    <Badge className={cn("text-[9px] px-1.5 py-0.5 font-mono font-bold", conversation.only_admins_can_post ? "bg-amber-500 text-black" : "bg-white/20 text-white")}>
                      {conversation.only_admins_can_post ? "ATIVADO" : "LIVRE"}
                    </Badge>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => setModerationOpen(true)} className="cursor-pointer hover:bg-amber-500/20 text-amber-400 rounded-xl p-2 font-bold">
                    <ShieldAlert className="h-4 w-4 mr-2.5" /> Moderação do chat
                  </DropdownMenuItem>
                </>
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

      {/* ─── WHATSAPP CHAT WALLPAPER & MESSAGES SCROLL CONTAINER ─── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 select-text custom-scrollbar-thin whatsapp-chat-bg",
          bgThemeClass
        )}
      >
        {/* CARREGAMENTO DE MENSAGENS ANTERIORES NO TOPO */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-2 gap-2 text-[11px] text-[#8696a0] animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00a884]" />
            <span>Carregando histórico anterior...</span>
          </div>
        )}

        {!hasMore && messages.length >= 20 && (
          <div className="flex items-center justify-center py-2 text-[10px] text-[#8696a0]/70 font-mono select-none">
            ✦ Início do histórico da conversa ✦
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-[#8696a0] text-xs">
            <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
            <span>Carregando histórico...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#8696a0] space-y-2 select-none">
            <span className="text-4xl">💬</span>
            <p className="text-sm font-bold text-[#e9edef]">Nenhuma mensagem ainda</p>
            <p className="text-xs max-w-xs">
              Envie uma mensagem de texto, foto, áudio de voz ou crie uma enquete para começar!
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isSelf = m.sender_id === currentUserId || m.is_self;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;

            // Identifica se a data mudou para exibir a pílula de data estilo WhatsApp
            const currentDateLabel = getDateLabel(m.created_at);
            const prevDateLabel = prevMsg ? getDateLabel(prevMsg.created_at) : null;
            const showDateHeader = currentDateLabel !== prevDateLabel;

            return (
              <React.Fragment key={m.id}>
                {showDateHeader && (
                  <div className="flex items-center justify-center my-3 sticky top-2 z-10 select-none">
                    <span className="px-3 py-1 rounded-lg bg-[#182229]/90 border border-white/5 text-[#8696a0] text-[11px] font-bold shadow-md uppercase tracking-wider backdrop-blur-md">
                      {currentDateLabel}
                    </span>
                  </div>
                )}

                <MessageBubble
                  message={m}
                  isSelf={Boolean(isSelf)}
                  isGroup={isGroup}
                  userRole={effectiveUserRole}
                  currentUserId={currentUserId}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedMessageIds.has(m.id)}
                  allMediaMessages={messages}
                  onToggleSelect={toggleSelectMessage}
                  onReply={(msg) => {
                    setReplyingTo(msg);
                    window.dispatchEvent(new CustomEvent("tw_chat_focus_input"));
                  }}
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
                  onOpenMessageInfo={(msg) => setInfoMessage(msg)}
                />
              </React.Fragment>
            );
          })
        )}

        {/* TYPING INDICATOR */}
        <TypingIndicator typingUsers={typingUsers} />

        <div ref={messagesEndRef} />
      </div>

      {/* ─── BARRA INFERIOR: SELEÇÃO MÚLTIPLA OU INPUT WHATSAPP ─── */}
      {isSelectionMode ? (
        <div className="p-3 bg-[#202c33] border-t border-white/10 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#00a884] text-white font-bold px-2.5 py-1 text-xs">
              {selectedMessageIds.size} selecionada{selectedMessageIds.size > 1 ? "s" : ""}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAllMessages}
              className="h-8 text-xs font-bold text-white hover:bg-white/10 rounded-lg hidden sm:inline-flex"
            >
              {selectedMessageIds.size === messages.length ? "Desmarcar tudo" : "Selecionar tudo"}
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBatchCopy}
              className="h-8 text-xs font-bold text-white hover:bg-white/10 rounded-lg"
              title="Copiar mensagens"
            >
              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBatchForward}
              className="h-8 text-xs font-bold text-white hover:bg-white/10 rounded-lg"
              title="Encaminhar mensagens"
            >
              <Forward className="h-3.5 w-3.5 mr-1 text-[#53bdeb]" /> Encaminhar
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBatchDeleteModalOpen(true)}
              className="h-8 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
              title="Apagar mensagens"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Apagar
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearSelection}
              className="h-8 w-8 text-[#8696a0] hover:text-white rounded-full cursor-pointer ml-1"
              title="Cancelar seleção"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <MessageInput
          key={conversation.id}
          conversationId={conversation.id}
          onSendMessage={sendMessage}
          onSendAttachment={async (file, caption) => {
            await sendAttachment(file, caption);
          }}
          onTyping={() => sendTypingNotification()}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          uploadProgress={uploadProgress}
          isSending={isSending}
          disabled={isLoading}
          onlyAdminsCanPost={conversation.only_admins_can_post}
          userRole={effectiveUserRole}
          participants={conversation.participants}
          isGroup={isGroup}
          otherParticipant={otherMember}
          currentUserId={currentUserId}
          onOpenPollDialog={() => setCreatePollOpen(true)}
          onOpenEventDialog={() => setCreateEventOpen(true)}
        />
      )}

      {/* DIÁLOGOS & DRAWERS */}
      <WhatsAppWallpaperDialog
        open={wallpaperDialogOpen}
        onOpenChange={setWallpaperDialogOpen}
        currentTheme={wallpaperTheme}
        onThemeChange={setWallpaperTheme}
      />

      <GroupSettingsDrawer
        open={groupSettingsOpen}
        onOpenChange={setGroupSettingsOpen}
        conversation={conversation}
        onConversationUpdated={onConversationUpdated}
        onLeaveGroup={onBack}
        onOpenProfile={(uid) => setProfileUserId(uid)}
      />

      <UserProfileDrawer
        open={Boolean(profileUserId)}
        onOpenChange={(open) => !open && setProfileUserId(null)}
        userId={profileUserId}
        onStartPrivateChat={(uid) => {
          setProfileUserId(null);
          onStartPrivateChat?.(uid);
        }}
      />

      <ChatSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        messages={messages}
        conversationId={conversation.id}
        conversationTitle={title}
        onSelectMessage={handleScrollToMessage}
      />

      <ChatMediaGalleryDrawer
        open={mediaGalleryOpen}
        onOpenChange={setMediaGalleryOpen}
        messages={messages}
        conversationTitle={title}
        onSelectMessage={handleScrollToMessage}
      />

      <CreatePollDialog
        open={createPollOpen}
        onOpenChange={setCreatePollOpen}
        conversationId={conversation.id}
      />

      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        conversationId={conversation.id}
      />

      <ForwardMessageDialog
        open={Boolean(forwardMessages && forwardMessages.length > 0)}
        onOpenChange={(open) => !open && setForwardMessages(null)}
        messages={forwardMessages || []}
        allConversations={allConversations}
        onForwarded={() => {
          setForwardMessages(null);
          clearSelection();
        }}
      />

      <EphemeralSettingsDialog
        open={ephemeralSettingsOpen}
        onOpenChange={setEphemeralSettingsOpen}
        conversationId={conversation.id}
        currentTtlHours={conversation.ephemeral_ttl_hours}
        canManage={effectiveUserRole === "admin"}
        onSettingsUpdated={onConversationUpdated}
      />

      <MuteConversationDialog
        open={muteDialogOpen}
        onOpenChange={setMuteDialogOpen}
        conversationId={conversation.id}
        conversationTitle={title}
        isCurrentlyMuted={Boolean(conversation.is_muted)}
        onMuteUpdated={onConversationUpdated}
      />

      <SavedMessagesDrawer
        open={savedMessagesOpen}
        onOpenChange={setSavedMessagesOpen}
        onSelectSavedMessage={(saved) => {
          if (saved.conversation_id === conversation.id) {
            handleScrollToMessage(saved.message_id);
          } else {
            const target = allConversations.find((c) => c.id === saved.conversation_id);
            if (target) {
              onSelectConversation?.(target);
            }
          }
        }}
      />

      <CreateReminderDialog
        open={Boolean(reminderMessage)}
        onOpenChange={(open) => !open && setReminderMessage(null)}
        message={reminderMessage}
      />

      <ModerationToolsDialog
        open={moderationOpen}
        onOpenChange={setModerationOpen}
        conversation={conversation}
        onMembersUpdated={onConversationUpdated}
      />

      <ReportMessageDialog
        open={Boolean(reportedMessage)}
        onOpenChange={(open) => !open && setReportedMessage(null)}
        message={reportedMessage}
      />

      <MessageThreadDrawer
        open={Boolean(threadMessage)}
        onOpenChange={(open) => !open && setThreadMessage(null)}
        parentMessage={threadMessage}
        conversationTitle={title}
      />

      <MessageInfoModal
        open={Boolean(infoMessage)}
        onOpenChange={(open) => !open && setInfoMessage(null)}
        message={infoMessage}
        conversation={conversation}
        currentUserId={currentUserId}
        onOpenProfile={(uid) => {
          setInfoMessage(null);
          setProfileUserId(uid);
        }}
      />

      {/* MODAL DE EXCLUSÃO EM MASSA */}
      <AlertDialog
        open={batchDeleteModalOpen}
        onOpenChange={setBatchDeleteModalOpen}
      >
        <AlertDialogContent className="max-w-md rounded-2xl bg-[#233138] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              Apagar {selectedMessageIds.size} mensagens?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#8696a0]">
              Deseja apagar as mensagens selecionadas apenas da sua tela ou para todos os participantes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="text-xs rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleBatchDelete(false)}
              className="text-xs rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              Apagar para mim
            </Button>
            {effectiveUserRole === "admin" && (
              <AlertDialogAction
                onClick={() => handleBatchDelete(true)}
                className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Apagar para todos
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
