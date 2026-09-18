import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Terminal, ShieldCheck } from "lucide-react";
import type { BotCommand } from "@/services/botEngine/types";
import { ActionSequenceList } from "./ActionSequenceList";

interface CommandEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  command: BotCommand | null;
  botPrefix: string;
  onSave: (command: BotCommand) => void;
}

export function CommandEditorModal({
  open,
  onOpenChange,
  command,
  botPrefix,
  onSave,
}: CommandEditorModalProps) {
  const [formData, setFormData] = useState<BotCommand | null>(command);

  useEffect(() => {
    setFormData(command);
  }, [command]);

  if (!formData) return null;

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-foreground max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-foreground">
                  {formData.name ? `Editar Comando: ${formData.prefix || botPrefix}${formData.name}` : "Novo Comando"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Configure argumentos, permissões de acesso e o encadeamento de ações.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Ativo</span>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(val) => setFormData({ ...formData, enabled: val })}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Identificação Geral */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs font-bold">Prefixo</Label>
              <Input
                value={formData.prefix ?? botPrefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                placeholder="!"
                className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold">Nome do Comando (sem prefixo)</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().trim() })}
                placeholder="Ex: aviso, saldo, perfil"
                className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5 col-span-3">
              <Label className="text-xs font-bold">Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="O que este comando faz quando executado?"
                className="bg-zinc-950 border-zinc-800 text-xs"
              />
            </div>
          </div>

          {/* Sequência de Ações */}
          <ActionSequenceList
            actions={formData.actions || []}
            onChange={(actions) => setFormData({ ...formData, actions })}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="text-xs font-bold bg-primary text-primary-foreground"
          >
            Salvar Comando
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
