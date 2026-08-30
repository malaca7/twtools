import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VolumeX, Volume2, Clock, Check, Loader2 } from "lucide-react";
import { setConversationMuteDuration } from "@/services/chatService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MuteConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversationTitle?: string;
  isMuted?: boolean;
  currentUserId?: string;
  onSuccess?: () => void;
}

const MUTE_OPTIONS = [
  { label: "1 hora", minutes: 60, desc: "Silenciar durante a próxima hora" },
  { label: "8 horas", minutes: 480, desc: "Silenciar pelo turno de trabalho" },
  { label: "24 horas", minutes: 1440, desc: "Silenciar por 1 dia completo" },
  { label: "7 dias", minutes: 10080, desc: "Silenciar durante uma semana" },
  { label: "Sempre", minutes: -1, desc: "Silenciar até eu reativar manualmente" },
];

export function MuteConversationDialog({
  open,
  onOpenChange,
  conversationId,
  conversationTitle,
  isMuted = false,
  currentUserId,
  onSuccess,
}: MuteConversationDialogProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(480);
  const [isSaving, setIsSaving] = useState(false);

  const handleApplyMute = async (minutes: number) => {
    setIsSaving(true);
    try {
      await setConversationMuteDuration(conversationId, minutes, currentUserId);
      toast.success(
        minutes === 0
          ? "Notificações reativadas para esta conversa!"
          : "Notificações desta conversa foram silenciadas."
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(`Erro ao atualizar silenciamento: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <VolumeX className="h-4 w-4 text-amber-400" />
            Silenciar Notificações
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            {conversationTitle ? `Escolha a duração para silenciar "${conversationTitle}"` : "Escolha por quanto tempo deseja silenciar"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 space-y-1.5 max-h-[60vh] overflow-y-auto">
          {MUTE_OPTIONS.map((opt) => {
            const isSelected = selectedMinutes === opt.minutes;
            return (
              <button
                key={opt.minutes}
                type="button"
                onClick={() => setSelectedMinutes(opt.minutes)}
                className={cn(
                  "w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-md shadow-primary/20"
                    : "bg-secondary/40 border-border/60 hover:bg-secondary text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{opt.label}</p>
                    <p className={cn("text-[10px] opacity-75 leading-tight", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>
                      {opt.desc}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-primary-foreground text-primary flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="p-3 border-t border-border/60 bg-secondary/30 flex items-center justify-between gap-2">
          {isMuted ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleApplyMute(0)}
              disabled={isSaving}
              className="text-xs font-bold rounded-xl gap-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            >
              <Volume2 className="h-3.5 w-3.5" /> Reativar Notificações
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl"
              disabled={isSaving}
            >
              Cancelar
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => handleApplyMute(selectedMinutes)}
            disabled={isSaving}
            className="text-xs font-bold rounded-xl gap-1.5"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
