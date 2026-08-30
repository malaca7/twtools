import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, Trash2, FileText, Loader2, Sparkles } from "lucide-react";
import { getSavedChatMessages, toggleSaveChatMessage } from "@/services/chatService";
import { formatTimeOnly, dateOnly } from "@/lib/format";
import type { SavedMessage, ChatConversation } from "@/types/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SavedMessagesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
  conversations: ChatConversation[];
  onNavigateToMessage: (conversationId: string, messageId: string) => void;
}

export function SavedMessagesDrawer({
  open,
  onOpenChange,
  currentUserId,
  conversations,
  onNavigateToMessage,
}: SavedMessagesDrawerProps) {
  const [savedList, setSavedList] = useState<SavedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSaved = async () => {
    if (!currentUserId) return;
    setIsLoading(true);
    try {
      const data = await getSavedChatMessages(currentUserId);
      setSavedList(data || []);
    } catch (err: any) {
      toast.error(`Erro ao carregar mensagens salvas: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadSaved();
    }
  }, [open, currentUserId]);

  const handleRemoveSaved = async (e: React.MouseEvent, item: SavedMessage) => {
    e.stopPropagation();
    try {
      await toggleSaveChatMessage(item.message_id, item.conversation_id, currentUserId);
      setSavedList((prev) => prev.filter((s) => s.id !== item.id));
      toast.success("Removida das mensagens salvas.");
    } catch (err: any) {
      toast.error(`Erro ao remover: ${err.message || err}`);
    }
  };

  const handleJump = (item: SavedMessage) => {
    onOpenChange(false);
    onNavigateToMessage(item.conversation_id, item.message_id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            Mensagens Salvas & Favoritos
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Acesse rapidamente as mensagens importantes que você favoritou.
          </DialogDescription>
        </DialogHeader>

        {/* LISTA DE MENSAGENS SALVAS */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Carregando seus favoritos...</span>
            </div>
          ) : savedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-2xl">
                ⭐
              </div>
              <p className="text-sm font-bold text-foreground">Nenhuma mensagem salva</p>
              <p className="text-xs max-w-xs">
                Favorite mensagens importantes no chat usando a opção &quot;Salvar Mensagem&quot; no menu de opções.
              </p>
            </div>
          ) : (
            savedList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleJump(item)}
                className="w-full text-left p-3 rounded-2xl border border-border/60 bg-secondary/30 hover:bg-secondary hover:border-primary/50 transition-all cursor-pointer group flex flex-col gap-1.5 select-none relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-6 w-6 border border-border/60 shrink-0">
                      {item.sender_avatar && <AvatarImage src={item.sender_avatar} />}
                      <AvatarFallback className="text-[9px] font-black">
                        {item.sender_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-black text-foreground truncate">
                      {item.sender_name}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-border text-muted-foreground">
                      {item.conversation_title}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {dateOnly(item.created_at)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSaved(e, item)}
                      className="h-6 w-6 rounded-lg hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 flex items-center justify-center transition-colors"
                      title="Remover dos salvos"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-foreground/90 font-medium line-clamp-3">
                  {item.content || (
                    <span className="italic text-muted-foreground flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {item.attachment_name || "Anexo"}
                    </span>
                  )}
                </p>

                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Ir para a mensagem</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
