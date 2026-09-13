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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal, Plus, Trash2, Sliders, ShieldCheck } from "lucide-react";
import type { BotCommand, CommandParameter } from "@/services/botEngine/types";
import { ActionSequenceList } from "./ActionSequenceList";
import { ConditionGroupEditor } from "./ConditionGroupEditor";

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

  const addParameter = () => {
    const newParam: CommandParameter = {
      id: `param_${Date.now()}`,
      name: `arg${(formData.parameters?.length || 0) + 1}`,
      type: "string",
      required: true,
      description: "Parâmetro do comando",
    };
    setFormData({
      ...formData,
      parameters: [...(formData.parameters || []), newParam],
    });
  };

  const removeParameter = (paramId: string) => {
    setFormData({
      ...formData,
      parameters: (formData.parameters || []).filter((p) => p.id !== paramId),
    });
  };

  const updateParameter = (paramId: string, partial: Partial<CommandParameter>) => {
    setFormData({
      ...formData,
      parameters: (formData.parameters || []).map((p) =>
        p.id === paramId ? { ...p, ...partial } : p
      ),
    });
  };

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

          {/* Parâmetros / Argumentos */}
          <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-primary" />
                  Parâmetros / Argumentos do Comando
                </Label>
                <p className="text-[0.7rem] text-muted-foreground">
                  Argumentos digitados pelos membros após o comando (ex: !aviso &lt;mensagem&gt;).
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addParameter}
                className="text-xs font-bold gap-1 h-7 bg-zinc-950 border-zinc-800 hover:bg-zinc-850"
              >
                <Plus className="h-3 w-3" />
                Adicionar Argumento
              </Button>
            </div>

            {formData.parameters?.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Nenhum argumento configurado. O comando não requer parâmetros extras.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.parameters?.map((param) => (
                  <div
                    key={param.id}
                    className="flex items-center gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800"
                  >
                    <Input
                      value={param.name}
                      onChange={(e) => updateParameter(param.id, { name: e.target.value.trim() })}
                      placeholder="Nome (ex: motivo)"
                      className="h-7 text-xs font-mono bg-zinc-900 border-zinc-800 w-32"
                    />

                    <Select
                      value={param.type}
                      onValueChange={(val: any) => updateParameter(param.id, { type: val })}
                    >
                      <SelectTrigger className="h-7 text-xs bg-zinc-900 border-zinc-800 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                        <SelectItem value="string">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="channel">Canal</SelectItem>
                        <SelectItem value="role">Cargo</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      value={param.description}
                      onChange={(e) => updateParameter(param.id, { description: e.target.value })}
                      placeholder="Descrição do argumento"
                      className="h-7 text-xs bg-zinc-900 border-zinc-800 flex-1"
                    />

                    <div className="flex items-center gap-1 shrink-0 px-1">
                      <span className="text-[10px] text-muted-foreground">Obrigatório</span>
                      <Switch
                        checked={param.required}
                        onCheckedChange={(val) => updateParameter(param.id, { required: val })}
                        className="scale-75"
                      />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeParameter(param.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Condições & Permissões */}
          <ConditionGroupEditor
            groups={formData.conditions || []}
            onChange={(groups) => setFormData({ ...formData, conditions: groups })}
          />

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
