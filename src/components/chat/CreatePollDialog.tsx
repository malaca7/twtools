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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Vote, Plus, Trash2, Clock, Check, Loader2 } from "lucide-react";
import { sendPollChatMessage } from "@/services/chatService";
import { toast } from "sonner";

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentUserId?: string;
  currentUserName?: string;
  onSuccess?: () => void;
}

export function CreatePollDialog({
  open,
  onOpenChange,
  conversationId,
  currentUserId,
  currentUserName,
  onSuccess,
}: CreatePollDialogProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationHours, setExpirationHours] = useState<number>(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    if (options.length >= 8) {
      toast.error("Limite máximo de 8 opções por enquete.");
      return;
    }
    setOptions((prev) => [...prev, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      toast.error("A enquete precisa de no mínimo 2 opções.");
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast.error("Digite a pergunta da enquete.");
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      toast.error("Preencha pelo menos 2 opções válidas.");
      return;
    }

    setIsSubmitting(true);
    try {
      let expiresAt: string | null = null;
      if (hasExpiration && expirationHours > 0) {
        expiresAt = new Date(Date.now() + expirationHours * 3600 * 1000).toISOString();
      }

      await sendPollChatMessage(
        conversationId,
        question.trim(),
        validOptions,
        isMultipleChoice,
        expiresAt,
        currentUserId,
        currentUserName
      );

      toast.success("Enquete criada com sucesso!");
      onOpenChange(false);
      setQuestion("");
      setOptions(["", ""]);
      setIsMultipleChoice(false);
      setHasExpiration(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(`Erro ao criar enquete: ${err.message || err}`);
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
              <Vote className="h-4 w-4 text-primary" />
              Criar Enquete
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Crie uma votação rápida e acompanhe os resultados em tempo real.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* PERGUNTA */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Pergunta da enquete</Label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Qual o melhor horário para a ação?"
                className="text-xs rounded-xl"
                maxLength={140}
                autoFocus
              />
            </div>

            {/* OPÇÕES */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Opções de resposta</Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {options.length}/8
                </span>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-muted-foreground w-4 text-center">
                      {idx + 1}.
                    </span>
                    <Input
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Opção ${idx + 1}`}
                      className="text-xs rounded-xl flex-1"
                      maxLength={80}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(idx)}
                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-rose-400 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 8 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="w-full text-xs rounded-xl font-bold gap-1.5 border-dashed mt-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Opção
                </Button>
              )}
            </div>

            {/* CONFIGURAÇÕES ADICIONAIS */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Respostas múltiplas</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Permitir que membros votem em mais de uma opção
                  </p>
                </div>
                <Switch
                  checked={isMultipleChoice}
                  onCheckedChange={setIsMultipleChoice}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold">Prazo de encerramento</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Encerrar votação automaticamente após um período
                  </p>
                </div>
                <Switch
                  checked={hasExpiration}
                  onCheckedChange={setHasExpiration}
                />
              </div>

              {hasExpiration && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: "1 hora", hours: 1 },
                    { label: "24 horas", hours: 24 },
                    { label: "3 dias", hours: 72 },
                  ].map((dur) => (
                    <Button
                      key={dur.hours}
                      type="button"
                      variant={expirationHours === dur.hours ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExpirationHours(dur.hours)}
                      className="text-xs rounded-xl font-bold"
                    >
                      {dur.label}
                    </Button>
                  ))}
                </div>
              )}
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
              Publicar Enquete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
