import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Loader2,
  X,
  CornerDownRight,
  FileText,
} from "lucide-react";
import { ChatMessageText } from "./ChatMessageText";
import { getThreadMessages, sendThreadReply } from "@/services/chatService";
import { formatTimeOnly, dateOnly } from "@/lib/format";
import type { ChatMessage } from "@/types/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageThreadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentMessage: ChatMessage | null;
  conversationId: string;
  currentUserId?: string;
  onReplySent?: () => void;
}

export function MessageThreadDrawer({
  open,
  onOpenChange,
  parentMessage,
  conversationId,
  currentUserId,
  onReplySent,
}: MessageThreadDrawerProps) {
  const [replies, setReplies] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const repliesEndRef = useRef<HTMLDivElement>(null);

  const loadReplies = async () => {
    if (!parentMessage) return;
    setIsLoading(true);
    try {
      const data = await getThreadMessages(parentMessage.id, currentUserId);
      setReplies(data || []);
    } catch (err: any) {
      toast.error(`Erro ao carregar thread: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && parentMessage) {
      void loadReplies();
    }
  }, [open, parentMessage?.id]);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !parentMessage || isSending) return;

    const content = inputText.trim();
    setIsSending(true);
    setInputText("");

    try {
      const newReply = await sendThreadReply(parentMessage.id, conversationId, content, currentUserId);
      setReplies((prev) => [...prev, newReply]);
      onReplySent?.();
    } catch (err: any) {
      toast.error(`Erro ao enviar resposta: ${err.message || err}`);
      setInputText(content);
    } finally {
      setIsSending(false);
    }
  };

  if (!parentMessage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden flex flex-col max-h-[85vh] h-[650px]">
        {/* HEADER */}
        <DialogHeader className="p-3.5 border-b border-border/60 bg-secondary/30 shrink-0">
          <DialogTitle className="text-sm font-black flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Thread de Conversa
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Respostas vinculadas a esta mensagem específica.
          </DialogDescription>
        </DialogHeader>

        {/* MENSAGEM PRINCIPAL (PAI) */}
        <div className="p-3 bg-secondary/40 border-b border-border/60 shrink-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border border-border/60">
              {parentMessage.sender_avatar && <AvatarImage src={parentMessage.sender_avatar} />}
              <AvatarFallback className="text-[9px] font-black">
                {parentMessage.sender_name?.slice(0, 2).toUpperCase() || "M"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-black text-foreground">{parentMessage.sender_name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatTimeOnly(parentMessage.created_at)}
            </span>
          </div>

          <div className="text-xs text-foreground/90 font-medium pl-8 break-words">
            {parentMessage.content ? (
              <ChatMessageText content={parentMessage.content} />
            ) : (
              parentMessage.attachment_name || "Anexo"
            )}
          </div>
        </div>

        {/* LISTA DE RESPOSTAS DA THREAD */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Carregando respostas da thread...</span>
            </div>
          ) : replies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-1.5">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <CornerDownRight className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-foreground">Nenhuma resposta na thread ainda</p>
              <p className="text-[11px]">Seja o primeiro a responder a esta mensagem!</p>
            </div>
          ) : (
            replies.map((reply) => {
              const isSelf = reply.sender_id === currentUserId || reply.is_self;
              return (
                <div
                  key={reply.id}
                  className={cn("flex gap-2 text-xs", isSelf && "justify-end")}
                >
                  {!isSelf && (
                    <Avatar className="h-6 w-6 border border-border/60 shrink-0 mt-0.5">
                      {reply.sender_avatar && <AvatarImage src={reply.sender_avatar} />}
                      <AvatarFallback className="text-[9px] font-black">
                        {reply.sender_name?.slice(0, 2).toUpperCase() || "M"}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "p-2.5 rounded-2xl max-w-[80%] space-y-0.5",
                      isSelf
                        ? "bg-primary text-primary-foreground rounded-tr-xs"
                        : "bg-secondary/70 border border-border/60 rounded-tl-xs text-foreground"
                    )}
                  >
                    {!isSelf && (
                      <span className="text-[10px] font-bold text-primary block">
                        {reply.sender_name}
                      </span>
                    )}
                    <ChatMessageText content={reply.content} />
                    <span
                      className={cn(
                        "text-[9px] font-mono block text-right",
                        isSelf ? "text-primary-foreground/75" : "text-muted-foreground"
                      )}
                    >
                      {formatTimeOnly(reply.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={repliesEndRef} />
        </div>

        {/* INPUT DE RESPOSTA */}
        <form onSubmit={handleSend} className="p-2.5 border-t border-border/60 bg-secondary/30 flex items-center gap-2 shrink-0">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Responder na thread..."
            className="text-xs rounded-xl bg-background/90 h-9"
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim() || isSending}
            className="h-9 w-9 rounded-xl shrink-0 cursor-pointer shadow-xs"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
