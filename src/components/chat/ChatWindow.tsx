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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChatRoom } from "@/hooks/useChat";
import { useQueryClient } from "@tanstack/react-query";
import { updateGroupSettings } from "@/services/chatService";
import { toast } from "sonner";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { GroupSettingsDrawer } from "./GroupSettingsDrawer";
import { ChatSearchDialog } from "./ChatSearchDialog";
import { UserProfileDrawer } from "./UserProfileDrawer";
import { formatTimeOnly, isTodayDate, isYesterdayDate, formatUserPresenceText } from "@/lib/format";
import { LEVEL_LABEL } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatMessage } from "@/types/chat";

interface ChatWindowProps {
  conversation: ChatConversation;
  onBack: () => void;
  onConversationUpdated?: () => void;
  onStartPrivateChat?: (userId: string) => void;
  viewMode?: "split" | "focus";
  onToggleViewMode?: (mode: "split" | "focus") => void;
}

export function ChatWindow({
  conversation,
  onBack,
  onConversationUpdated,
  onStartPrivateChat,
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

  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);

  // Auto-scroll to bottom on initial load
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isLoading) {
      isInitialLoadRef.current = true;
      return;
    }
    if (isInitialLoadRef.current && messages.length > 0) {
      scrollToBottom("auto");
      isInitialLoadRef.current = false;
    }
  }, [messages.length, isLoading]);

  // Adjust scroll position after loading older messages so viewport does not jump
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current !== null && scrollContainerRef.current) {
      const currentScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = currentScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = null;
    }
  }, [messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
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
              viewMode === "split" && "md:hidden"
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

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"
            title="Buscar mensagens na conversa"
          >
            <Search className="h-4 w-4" />
          </Button>

          {isGroup && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setGroupSettingsOpen(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg cursor-pointer"
              title="Configurações e membros do grupo"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* MESSAGES SCROLL CONTAINER */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 select-text"
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
              Envie uma mensagem de texto, foto, áudio ou documento para iniciar a conversa!
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
                onReply={(msg) => setReplyingTo(msg)}
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

      {/* MESSAGE INPUT COMPONENT */}
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
    </div>
  );
}
