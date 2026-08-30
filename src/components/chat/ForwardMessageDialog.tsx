import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Users, User, ArrowRight, Loader2, Check } from "lucide-react";
import { forwardChatMessage } from "@/services/chatService";
import type { ChatConversation, ChatMessage } from "@/types/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: ChatMessage | null;
  messages?: ChatMessage[] | null;
  conversations: ChatConversation[];
  currentUserId?: string;
  onSuccess?: () => void;
  onForwardSuccess?: (targetConversation: ChatConversation) => void;
}

export function ForwardMessageDialog({
  open,
  onOpenChange,
  message,
  messages,
  conversations,
  currentUserId,
  onSuccess,
  onForwardSuccess,
}: ForwardMessageDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Lista normalizada de mensagens para encaminhar
  const messageList: ChatMessage[] = messages && messages.length > 0
    ? messages
    : message
    ? [message]
    : [];

  if (messageList.length === 0) return null;

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (c.type === "group") {
      return (c.title || "Grupo").toLowerCase().includes(q);
    }
    const name = c.other_participant?.nickname || c.other_participant?.nome || "Membro";
    return name.toLowerCase().includes(q);
  });

  const handleForward = async () => {
    if (!selectedConvId || messageList.length === 0 || isSending) return;
    setIsSending(true);

    try {
      // Ordena cronologicamente para enviar na ordem correta
      const sorted = [...messageList].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      for (const msg of sorted) {
        await forwardChatMessage(selectedConvId, msg, currentUserId);
      }

      toast.success(
        sorted.length > 1
          ? `${sorted.length} mensagens encaminhadas com sucesso!`
          : "Mensagem encaminhada com sucesso!"
      );

      const targetConv = conversations.find((c) => c.id === selectedConvId);

      onOpenChange(false);
      setSelectedConvId(null);
      setSearch("");
      onSuccess?.();

      if (targetConv && onForwardSuccess) {
        onForwardSuccess(targetConv);
      }
    } catch (err: any) {
      toast.error(`Erro ao encaminhar: ${err.message || err}`);
    } finally {
      setIsSending(false);
    }
  };

  const count = messageList.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" />
            {count > 1 ? `Encaminhar ${count} mensagens` : "Encaminhar mensagem"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            {count > 1
              ? `${count} mensagens selecionadas para encaminhar`
              : messageList[0]?.content
              ? `"${messageList[0].content}"`
              : messageList[0]?.attachment_name || "Anexo"}
          </DialogDescription>
        </DialogHeader>

        {/* BUSCA DE CONVERSAS */}
        <div className="p-3 border-b border-border/40 bg-secondary/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar conversa ou membro..."
              className="pl-8 h-9 text-xs rounded-xl bg-background/80"
              autoFocus
            />
          </div>
        </div>

        {/* LISTA DE CONVERSAS DISPONÍVEIS */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-72">
          {filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Nenhuma conversa encontrada.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConvId === conv.id;
              const title =
                conv.type === "group"
                  ? conv.title || "Grupo"
                  : conv.other_participant?.nickname || conv.other_participant?.nome || "Membro";
              const avatar =
                conv.type === "group"
                  ? conv.avatar_url
                  : conv.other_participant?.discord_avatar_url;

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedConvId(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer select-none",
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20"
                      : "hover:bg-secondary/60 text-foreground"
                  )}
                >
                  <Avatar className="h-9 w-9 border border-border/60 shrink-0">
                    {avatar && <AvatarImage src={avatar} />}
                    <AvatarFallback className="text-[11px] font-black bg-secondary">
                      {conv.type === "group" ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        title.slice(0, 2).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black truncate">{title}</span>
                      {conv.type === "group" && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] px-1 py-0 rounded",
                            isSelected ? "border-primary-foreground/40 text-primary-foreground" : "border-border text-muted-foreground"
                          )}
                        >
                          Grupo
                        </Badge>
                      )}
                    </div>
                    <p className={cn("text-[11px] truncate opacity-80", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>
                      {conv.last_message || "Sem mensagens"}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary-foreground text-primary flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-3 border-t border-border/60 bg-secondary/30 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl"
            disabled={isSending}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleForward}
            disabled={!selectedConvId || isSending}
            className="text-xs font-bold rounded-xl gap-1.5"
          >
            {isSending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Encaminhar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
