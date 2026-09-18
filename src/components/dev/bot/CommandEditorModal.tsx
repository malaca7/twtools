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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Terminal, ShieldCheck, Sparkles, EyeOff, Hash } from "lucide-react";
import type { BotCommand } from "@/services/botEngine/types";
import { ActionSequenceList } from "./ActionSequenceList";
import { CommandParametersEditor } from "./CommandParametersEditor";

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
    if (command) {
      setFormData({
        ...command,
        prefix: "/",
        isSlash: true,
        parameters: command.parameters || [],
        description: command.description || `Comando /${command.name || "novo"}`,
      });
    } else {
      setFormData(null);
    }
  }, [command]);

  if (!formData) return null;

  const handleSave = () => {
    if (!formData.name.trim()) return;
    const cleanName = formData.name
      .toLowerCase()
      .trim()
      .replace(/^[!/]/, "")
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 32);

    onSave({
      ...formData,
      name: cleanName,
      prefix: "/",
      isSlash: true,
      description: (formData.description?.trim() || `Comando /${cleanName}`).slice(0, 100),
      parameters: formData.parameters || [],
      updatedAt: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  const handleNameChange = (val: string) => {
    const sanitized = val
      .toLowerCase()
      .replace(/^[!/]/, "")
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 32);
    setFormData({ ...formData, name: sanitized });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-black text-foreground">
                    {formData.name ? `Editar Slash Command: /${formData.name}` : "Novo Slash Command"}
                  </DialogTitle>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-mono gap-1">
                    <Sparkles className="h-3 w-3" />
                    Slash Command Oficial (/)
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Comando nativo do Discord (/), com suporte a argumentos, permissões e ações automáticas.
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
          {/* Identificação Geral do Slash Command */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs font-bold text-zinc-300">Tipo / Prefixo</Label>
              <div className="h-9 flex items-center px-3 rounded-md bg-zinc-950 border border-zinc-800 text-xs font-mono font-black text-emerald-400">
                / (Slash Command)
              </div>
            </div>

            <div className="space-y-1.5 col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-300">Nome do Comando (sem barra)</Label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {formData.name.length}/32 caracteres (minúsculo, a-z, 0-9, _, -)
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-500 font-mono text-xs font-bold">/</span>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="ex: aviso, cotas, saldo, perfil"
                  className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold pl-7 text-emerald-400"
                />
              </div>
            </div>

            <div className="space-y-1.5 col-span-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-300">Descrição (Exibida no Discord)</Label>
                <span className="text-[10px] text-zinc-500">
                  {formData.description.length}/100 caracteres
                </span>
              </div>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 100) })}
                placeholder="Explicação do comando exibida na lista de sugestões do Discord"
                className="bg-zinc-950 border-zinc-800 text-xs"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-zinc-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Servidor Discord Autorizado
              </Label>
              <select
                value={formData.guildId || "all"}
                onChange={(e) => setFormData({ ...formData, guildId: e.target.value })}
                className="w-full h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">🌐 Todos os Servidores (Global + Ativação Instantânea)</option>
                <option value="1535505650308620400">🏍️ Twin Wheel (1535505650308620400)</option>
                <option value="1537229296697999462">💻 Malaca Developers (1537229296697999462)</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-1 flex flex-col justify-end">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800 h-9">
                <div className="flex items-center gap-1.5">
                  <EyeOff className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-[11px] font-medium text-zinc-300">Resposta Efêmera (Privada)</span>
                </div>
                <Switch
                  checked={Boolean(formData.ephemeral)}
                  onCheckedChange={(val) => setFormData({ ...formData, ephemeral: val })}
                  className="scale-75 data-[state=checked]:bg-cyan-600"
                />
              </div>
            </div>
          </div>

          {/* Editor de Parâmetros / Argumentos do Slash Command */}
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <CommandParametersEditor
              parameters={formData.parameters || []}
              onChange={(params) => setFormData({ ...formData, parameters: params })}
              commandPrefix="/"
              commandName={formData.name || "comando"}
            />
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
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Salvar Slash Command
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

