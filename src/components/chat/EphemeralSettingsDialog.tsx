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
import { Clock, Timer, Check, Loader2, ShieldAlert } from "lucide-react";
import { setConversationEphemeralTtl } from "@/services/chatService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EphemeralSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversationTitle?: string;
  currentTtlHours?: number;
  currentUserId?: string;
  onSuccess?: () => void;
}

const EPHEMERAL_OPTIONS = [
  { hours: 0, label: "Desativado", desc: "As mensagens permanecem salvas indefinidamente" },
  { hours: 24, label: "24 horas", desc: "Novas mensagens desaparecem após 1 dia" },
  { hours: 168, label: "7 dias", desc: "Novas mensagens desaparecem após 1 semana" },
  { hours: 720, label: "30 dias", desc: "Novas mensagens desaparecem após 1 mês" },
];

export function EphemeralSettingsDialog({
  open,
  onOpenChange,
  conversationId,
  conversationTitle,
  currentTtlHours = 0,
  currentUserId,
  onSuccess,
}: EphemeralSettingsDialogProps) {
  const [selectedHours, setSelectedHours] = useState<number>(currentTtlHours);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setConversationEphemeralTtl(conversationId, selectedHours, currentUserId);
      toast.success(
        selectedHours === 0
          ? "Mensagens temporárias desativadas."
          : `Mensagens temporárias ativadas (${selectedHours === 24 ? "24 horas" : selectedHours === 168 ? "7 dias" : "30 dias"})! ⏱️`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(`Erro ao configurar mensagens temporárias: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            Mensagens Temporárias
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure para que novas mensagens desapareçam automaticamente do chat após o período definido.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 space-y-2 max-h-[60vh] overflow-y-auto">
          {EPHEMERAL_OPTIONS.map((opt) => {
            const isSelected = selectedHours === opt.hours;
            return (
              <button
                key={opt.hours}
                type="button"
                onClick={() => setSelectedHours(opt.hours)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-md shadow-primary/20"
                    : "bg-secondary/30 border-border/60 hover:bg-secondary text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">{opt.label}</p>
                    <p
                      className={cn(
                        "text-[10px] leading-tight opacity-80",
                        isSelected ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
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
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-bold rounded-xl gap-1.5"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
