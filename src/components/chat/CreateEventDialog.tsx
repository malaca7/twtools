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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Clock, Check, Loader2, Sparkles } from "lucide-react";
import { sendEventChatMessage } from "@/services/chatService";
import { toast } from "sonner";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentUserId?: string;
  currentUserName?: string;
  onSuccess?: () => void;
}

export function CreateEventDialog({
  open,
  onOpenChange,
  conversationId,
  currentUserId,
  currentUserName,
  onSuccess,
}: CreateEventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Digite o título do evento.");
      return;
    }
    if (!eventDate) {
      toast.error("Selecione a data e o horário do evento.");
      return;
    }

    const selectedTime = new Date(eventDate).getTime();
    if (isNaN(selectedTime)) {
      toast.error("Data inválida.");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendEventChatMessage(
        conversationId,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          event_date: new Date(eventDate).toISOString(),
          location: location.trim() || undefined,
        },
        currentUserId,
        currentUserName
      );

      toast.success("Evento criado com sucesso!");
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setEventDate("");
      setLocation("");
      onSuccess?.();
    } catch (err: any) {
      toast.error(`Erro ao criar evento: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b border-border/60">
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Criar Evento no Chat
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Agende ações, reuniões ou encontros com confirmação de presença (RSVP).
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto">
            {/* TÍTULO */}
            <div className="space-y-1">
              <Label className="text-xs font-bold">Título do Evento</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Ação no Banco Central / Reunião Geral"
                className="text-xs rounded-xl"
                maxLength={100}
                autoFocus
              />
            </div>

            {/* DATA E HORA */}
            <div className="space-y-1">
              <Label className="text-xs font-bold flex items-center gap-1">
                <Clock className="h-3 w-3 text-primary" />
                Data e Horário
              </Label>
              <Input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            {/* LOCAL */}
            <div className="space-y-1">
              <Label className="text-xs font-bold flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" />
                Localização (Opcional)
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: QG Twin Wheels / Píer / Discord Sala 2"
                className="text-xs rounded-xl"
                maxLength={100}
              />
            </div>

            {/* DESCRIÇÃO */}
            <div className="space-y-1">
              <Label className="text-xs font-bold">Descrição / Detalhes (Opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instruções de armamento, regras de engajamento ou pauta..."
                className="text-xs rounded-xl resize-none"
                rows={3}
                maxLength={300}
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
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs font-bold rounded-xl gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Agendar Evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
