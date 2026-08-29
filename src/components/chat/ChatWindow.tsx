import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Users, Info, Loader2, Phone, IdCard, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useChatRoom } from "@/hooks/useChat";
import { MessageStatusIcon } from "./MessageStatusIcon";
import { TypingIndicator } from "./TypingIndicator";
import { GroupMembersDialog } from "./GroupMembersDialog";
import { formatTimeOnly, isTodayDate, isYesterdayDate } from "@/lib/format";
import { LEVEL_LABEL } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/types/chat";

interface ChatWindowProps {
  conversation: ChatConversation;
  onBack: () => void;
  onConversationUpdated?: () => void;
}

export function ChatWindow({ conversation, onBack, onConversationUpdated }: ChatWindowProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const {
    messages,
    isLoading,
    isSending,
    typingUsers,
    sendMessage,
    sendTypingNotification,
  } = useChatRoom(conversation.id);

  const [inputContent, setInputContent] = useState("");
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on messages change
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom(isLoading ? "auto" : "smooth");
  }, [messages, typingUsers, isLoading]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation.id]);

  const handleSend = async () => {
    const text = inputContent.trim();
    if (!text || isSending) return;
    setInputContent("");
    try {
      await sendMessage(text);
      scrollToBottom();
      onConversationUpdated?.();
    } catch {
      setInputContent(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);
    sendTypingNotification();
  };

  // Header display calculations
  const isGroup = conversation.type === "group";
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

  return (
    <div className="flex flex-col h-full w-full bg-card overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between p-3 border-b border-border/70 bg-secondary/30 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground shrink-0"
            title="Voltar para lista de conversas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="relative shrink-0">
            <Avatar className="h-9 w-9 border border-border/80 shadow-xs">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {isGroup ? <Users className="h-4 w-4" /> : initials}
              </AvatarFallback>
            </Avatar>
            {!isGroup && (
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                  isOnline ? "bg-emerald-500" : isAusente ? "bg-amber-500" : "bg-zinc-500"
                )}
                title={isOnline ? "Online" : isAusente ? "Ausente" : "Offline"}
              />
            )}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <h4 className="truncate font-extrabold text-xs text-foreground leading-tight">{title}</h4>
              {!isGroup && otherMember?.is_developer && (
                <Badge variant="outline" className="text-[8px] font-mono px-1 py-0 border-rose-500/40 text-rose-400 bg-rose-500/10 font-bold shrink-0">
                  DEV
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground leading-none font-mono flex-wrap">
              {isGroup ? (
                <span>{conversation.participants.length} membros</span>
              ) : (
                <>
                  <span className={cn("font-bold flex items-center gap-1", isOnline ? "text-emerald-400" : isAusente ? "text-amber-400" : "text-zinc-400")}>
                    ● {isOnline ? "Online" : isAusente ? "Ausente" : "Offline"}
                  </span>
                  {otherMember?.game_id && (
                    <span className="text-foreground/80 font-bold">
                      #{otherMember.game_id}
                    </span>
                  )}
                  {otherMember?.telefone && (
                    <span className="text-muted-foreground hidden sm:inline">
                      📞 {otherMember.telefone}
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

        {isGroup && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setGroupDetailsOpen(true)}
            title="Ver informações do grupo"
          >
            <Info className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Carregando mensagens...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground space-y-1">
            <span className="text-2xl">💬</span>
            <p className="text-xs font-bold text-foreground">Nenhuma mensagem ainda</p>
            <p className="text-[11px]">Envie uma mensagem para iniciar a conversa!</p>
          </div>
        ) : (
          messages.map((m, index) => {
            const isSelf = m.sender_id === currentUserId || m.is_self;
            const prevMsg = messages[index - 1];
            const isSameSenderAsPrev = prevMsg && prevMsg.sender_id === m.sender_id;

            return (
              <div
                key={m.id}
                className={cn("flex flex-col max-w-[82%] sm:max-w-[75%]", isSelf ? "ml-auto items-end" : "mr-auto items-start")}
              >
                {/* SENDER NAME IN GROUPS */}
                {isGroup && !isSelf && !isSameSenderAsPrev && (
                  <div className="flex items-center gap-1.5 px-1 mb-1 leading-none">
                    <span className="text-[10px] font-bold text-primary">
                      {m.sender_name || "Membro"}
                    </span>
                    {m.sender_game_id && (
                      <span className="text-[9px] font-mono text-muted-foreground">
                        #{m.sender_game_id}
                      </span>
                    )}
                  </div>
                )}

                {/* BUBBLE */}
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl text-xs break-words shadow-xs transition-all relative group",
                    isSelf
                      ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
                      : "bg-secondary text-secondary-foreground rounded-bl-xs border border-border/40"
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed select-text">{m.content}</p>

                  <div
                    className={cn(
                      "flex items-center gap-1 justify-end text-[9px] mt-1 opacity-75 font-mono",
                      isSelf ? "text-primary-foreground/90" : "text-muted-foreground"
                    )}
                  >
                    <span>{formatTimeOnly(m.created_at)}</span>
                    {isSelf && <MessageStatusIcon status={m.status} />}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* TYPING INDICATOR */}
        <TypingIndicator typingUsers={typingUsers} />

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div className="p-2.5 border-t border-border/70 bg-card shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            placeholder="Digite uma mensagem..."
            value={inputContent}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="flex-1 h-9 text-xs bg-secondary/40 border-border/80 focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
            disabled={isLoading}
          />

          <Button
            type="submit"
            size="icon"
            disabled={!inputContent.trim() || isSending}
            className="h-9 w-9 bg-primary text-primary-foreground rounded-xl shadow-md hover:bg-primary/90 shrink-0 cursor-pointer active:scale-95"
            title="Enviar mensagem"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>

      {/* GROUP DETAILS DIALOG */}
      {isGroup && (
        <GroupMembersDialog
          open={groupDetailsOpen}
          onOpenChange={setGroupDetailsOpen}
          conversation={conversation}
          onConversationUpdated={() => {
            onConversationUpdated?.();
          }}
          onLeaveGroup={onBack}
        />
      )}
    </div>
  );
}
