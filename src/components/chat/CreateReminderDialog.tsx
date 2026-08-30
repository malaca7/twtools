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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Bell, Check, Loader2 } from "lucide-react";
import { createChatMessageReminder } from "@/services/chatService";
import type { ChatMessage } from "@/types/chat";
import { toast } from "sonner";

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: ChatMessage | null;
  conversationId: string;
  currentUserId?: string;
  onSuccess?: () => void;
}

export function CreateReminderDialog({
  open,
  onOpenChange,
  message,
  conversationId,
  currentUserId,
  onSuccess,
}: CreateReminderDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("15m");
  const [customDatetime, setCustomDatetime] = useState<string>("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!message) return null;

  const handleCreate = async () => {
    let remindDate: Date;

    if (selectedPreset === "15m") {
      remindDate = new Date(Date.now() + 15 * 60 * 1000);
    } else if (selectedPreset === "1h") {
      remindDate = new Date(Date.now() + 60 * 60 * 1000);
    } else if (selectedPreset === "tomorrow9") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      remindDate = tomorrow;
    } else if (selectedPreset === "custom" && customDatetime) {
      remindDate = new Date(customDatetime);
      if (isNaN(remindDate.getTime()) || remindDate <= new Date()) {
        toast.error("Escolha uma data e horário futuro válido.");
        return;
      }
    } else {
      toast.error("Selecione um horário válido para o lembrete.");
      return;
    }

    setIsSaving(true);
    try {
      await createChatMessageReminder(
        message.id,
        conversationId,
        remindDate.toISOString(),
        note.trim(),
        currentUserId
      );

      toast.success(`Lembrete programado para ${remindDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`);
      onOpenChange(false);
      setNote("");
      onSuccess?.();
    } catch (err: any) {
      toast.error(`Erro ao criar lembrete: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Criar Lembrete de Mensagem
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            {message.content ? `"${message.content}"` : message.attachment_name || "Anexo"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* PRESETS DE HORÁRIO */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">Quando deseja ser lembrado?</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "15m", label: "Em 15 minutos", sub: "Aviso rápido" },
                { id: "1h", label: "Em 1 hora", sub: "Mais tarde" },
                { id: "tomorrow9", label: "Amanhã às 09:00", sub: "Início do dia" },
                { id: "custom", label: "Personalizado", sub: "Definir data/hora" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPreset(p.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer select-none ${
                    selectedPreset === p.id
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-md shadow-primary/20"
                      : "bg-secondary/40 border-border/60 hover:bg-secondary text-foreground"
                  }`}
                >
                  <span className="text-xs font-bold">{p.label}</span>
                  <span className={`text-[10px] opacity-75 ${selectedPreset === p.id ? "text-primary-foreground" : "text-muted-foreground"}`}>
                    {p.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* DATA/HORA PERSONALIZADA */}
          {selectedPreset === "custom" && (
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-bold">Data e Horário</Label>
              <Input
                type="datetime-local"
                value={customDatetime}
                onChange={(e) => setCustomDatetime(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          )}

          {/* NOTA OPCIONAL */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-bold">Nota pessoal (opcional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Cobrar resposta do relatório"
              className="text-xs rounded-xl"
              maxLength={120}
            />
          </div>
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
            onClick={handleCreate}
            disabled={isSaving}
            className="text-xs font-bold rounded-xl gap-1.5"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Criar Lembrete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
