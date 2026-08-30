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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Flag, Check, Loader2 } from "lucide-react";
import { reportChatMessage } from "@/services/chatService";
import type { ChatMessage } from "@/types/chat";
import { toast } from "sonner";

interface ReportMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: ChatMessage | null;
  conversationId: string;
  currentUserId?: string;
}

const REPORT_REASONS = [
  "Spam ou flood repetitivo",
  "Ofensas, assédio ou toxicidade",
  "Vazamento de informações confidenciais",
  "Anti-RP ou quebra de regras da facção",
  "Conteúdo explícito ou inapropriado",
  "Outro motivo (especificar abaixo)",
];

export function ReportMessageDialog({
  open,
  onOpenChange,
  message,
  conversationId,
  currentUserId,
}: ReportMessageDialogProps) {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!message) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = `${selectedReason}${details.trim() ? `: ${details.trim()}` : ""}`;

    setIsSubmitting(true);
    try {
      await reportChatMessage(
        conversationId,
        message.sender_id,
        finalReason,
        message.id,
        currentUserId
      );

      toast.success("Denúncia enviada à moderação com sucesso.");
      onOpenChange(false);
      setSelectedReason(REPORT_REASONS[0]);
      setDetails("");
    } catch (err: any) {
      toast.error(`Erro ao enviar denúncia: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader className="p-4 pb-2 border-b border-border/60 bg-rose-500/10">
            <DialogTitle className="text-sm font-black text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Denunciar Mensagem / Usuário
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              A denúncia será enviada sigilosamente aos administradores e moderadores da plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-3.5 max-h-[65vh] overflow-y-auto">
            <div className="p-2.5 rounded-xl border border-border/60 bg-secondary/30 text-xs space-y-1">
              <span className="font-bold text-foreground">Autor: {message.sender_name}</span>
              <p className="text-muted-foreground line-clamp-2 italic">
                "{message.content || message.attachment_name || "Anexo"}"
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Motivo Principal</Label>
              <div className="space-y-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-secondary/20 hover:bg-secondary/50 text-xs cursor-pointer select-none transition-all"
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r}
                      checked={selectedReason === r}
                      onChange={() => setSelectedReason(r)}
                      className="accent-primary"
                    />
                    <span className="font-medium text-foreground">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Detalhes Adicionais (Opcional)</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Descreva o contexto ou informações complementares..."
                className="text-xs rounded-xl resize-none"
                rows={2}
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
              className="text-xs font-bold rounded-xl gap-1.5 bg-rose-600 hover:bg-rose-500 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Flag className="h-3.5 w-3.5" />
              )}
              Enviar Denúncia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
