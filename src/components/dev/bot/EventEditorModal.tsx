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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, ShieldCheck } from "lucide-react";
import type { BotEvent, EventTriggerType } from "@/services/botEngine/types";
import { ActionSequenceList } from "./ActionSequenceList";
import { ConditionGroupEditor } from "./ConditionGroupEditor";

interface EventEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: BotEvent | null;
  onSave: (event: BotEvent) => void;
}

const EVENT_TRIGGERS: { type: EventTriggerType; label: string; desc: string }[] = [
  { type: "message_create", label: "Mensagem Recebida", desc: "Dispara quando qualquer mensagem for enviada no servidor" },
  { type: "member_join", label: "Usuário Entrou", desc: "Dispara quando um novo membro ingressar no servidor Discord" },
  { type: "member_leave", label: "Usuário Saiu", desc: "Dispara quando um membro sair ou for expulso do servidor" },
  { type: "command_ran", label: "Comando Executado", desc: "Dispara após qualquer comando do bot ser executado" },
  { type: "bot_ready", label: "Bot Iniciado / Online", desc: "Dispara assim que o bot se conecta ao Discord" },
  { type: "bot_stop", label: "Bot Desligado / Offline", desc: "Dispara antes do processo do bot encerrar" },
  { type: "webhook_received", label: "Webhook Recebido", desc: "Dispara quando a API TWTools receber um webhook externo" },
  { type: "custom", label: "Evento Personalizado", desc: "Dispara sob demanda via chamada interna da plataforma" },
];

export function EventEditorModal({ open, onOpenChange, event, onSave }: EventEditorModalProps) {
  const [formData, setFormData] = useState<BotEvent | null>(event);

  useEffect(() => {
    setFormData(event);
  }, [event]);

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
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-foreground">
                  {formData.name ? `Editar Evento: ${formData.name}` : "Novo Evento Automatizado"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Configure o gatilho, filtros de escopo e as ações executadas automaticamente.
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
          {/* Identificação Geral & Gatilho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs font-bold">Gatilho do Evento</Label>
              <Select
                value={formData.triggerType}
                onValueChange={(val: EventTriggerType) => setFormData({ ...formData, triggerType: val })}
              >
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                  {EVENT_TRIGGERS.map((trig) => (
                    <SelectItem key={trig.type} value={trig.type} className="text-xs">
                      <div>
                        <span className="font-bold block">{trig.label}</span>
                        <span className="text-[10px] text-muted-foreground">{trig.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs font-bold">Nome da Automação</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Boas-vindas ao Entrar"
                className="bg-zinc-950 border-zinc-800 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold">Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o propósito deste evento"
                className="bg-zinc-950 border-zinc-800 text-xs"
              />
            </div>
          </div>

          {/* Condições & Filtros */}
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
            Salvar Evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
