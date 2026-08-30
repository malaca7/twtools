import React, { useState } from "react";
import { Pin, X, ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

interface PinnedMessagesBannerProps {
  pinnedMessages: ChatMessage[];
  onSelectMessage: (messageId: string) => void;
  onUnpinMessage?: (messageId: string) => void;
  canManagePin?: boolean;
}

export function PinnedMessagesBanner({
  pinnedMessages,
  onSelectMessage,
  onUnpinMessage,
  canManagePin = false,
}: PinnedMessagesBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const validIndex = Math.min(currentIndex, pinnedMessages.length - 1);
  const activeMsg = pinnedMessages[validIndex];
  if (!activeMsg) return null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
  };

  const handleUnpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUnpinMessage?.(activeMsg.id);
  };

  return (
    <div
      onClick={() => onSelectMessage(activeMsg.id)}
      className="bg-primary/10 border-b border-primary/20 px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-primary/15 transition-all select-none z-10 shrink-0"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="h-6 w-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
          <Pin className="h-3.5 w-3.5 fill-primary" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
              Mensagem Fixada {pinnedMessages.length > 1 ? `(${validIndex + 1}/${pinnedMessages.length})` : ""}
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold truncate">
              • {activeMsg.sender_name || "Membro"}
            </span>
          </div>
          <p className="text-xs text-foreground/90 font-medium truncate leading-tight">
            {activeMsg.content || activeMsg.attachment_name || "Anexo"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {pinnedMessages.length > 1 && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="h-6 w-6 rounded-md hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="h-6 w-6 rounded-md hover:bg-primary/20 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Próxima"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {canManagePin && onUnpinMessage && (
          <button
            type="button"
            onClick={handleUnpin}
            className="h-6 w-6 rounded-md hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
            title="Desafixar mensagem"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
