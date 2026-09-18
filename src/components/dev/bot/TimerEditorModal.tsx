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
import { Clock, Calendar } from "lucide-react";
import type { BotTimer, ScheduleType } from "@/services/botEngine/types";
import { ActionSequenceList } from "./ActionSequenceList";

interface TimerEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timer: BotTimer | null;
  onSave: (timer: BotTimer) => void;
}

const SCHEDULE_TYPES: { type: ScheduleType; label: string; desc: string }[] = [
  { type: "interval", label: "Intervalo Recorrente", desc: "A cada X minutos ou horas sem interrupção" },
  { type: "daily", label: "Diariamente", desc: "Executa todos os dias em um horário definido" },
  { type: "weekly", label: "Semanalmente", desc: "Executa em dias específicos da semana" },
  { type: "monthly", label: "Mensalmente", desc: "Executa no mesmo dia de cada mês" },
  { type: "specific_date", label: "Data e Hora Específica", desc: "Executa em uma data e horário exatos uma única vez" },
];

const DAYS_OF_WEEK = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function TimerEditorModal({ open, onOpenChange, timer, onSave }: TimerEditorModalProps) {
  const [formData, setFormData] = useState<BotTimer | null>(timer);

  useEffect(() => {
    setFormData(timer);
  }, [timer]);

  if (!formData) return null;

  const handleConfigChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      scheduleConfig: {
        ...formData.scheduleConfig,
        [key]: value,
      },
    });
  };

  const toggleDayOfWeek = (dayIdx: number) => {
    const current = formData.scheduleConfig?.daysOfWeek || [];
    const next = current.includes(dayIdx)
      ? current.filter((d) => d !== dayIdx)
      : [...current, dayIdx].sort();
    handleConfigChange("daysOfWeek", next);
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
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-foreground">
                  {formData.name ? `Editar Timer: ${formData.name}` : "Novo Timer Agendado"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Programe rotinas cronometradas, avisos diários e tarefas automatizadas.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs font-bold">Tipo de Agendamento</Label>
              <Select
                value={formData.scheduleType}
                onValueChange={(val: ScheduleType) => setFormData({ ...formData, scheduleType: val })}
              >
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                  {SCHEDULE_TYPES.map((st) => (
                    <SelectItem key={st.type} value={st.type} className="text-xs">
                      <div>
                        <span className="font-bold block">{st.label}</span>
                        <span className="text-[10px] text-muted-foreground">{st.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs font-bold">Nome do Timer</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Lembrete Diário de Metas"
                className="bg-zinc-950 border-zinc-800 text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold">Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Qual rotina este timer automatiza?"
                className="bg-zinc-950 border-zinc-800 text-xs"
              />
            </div>
          </div>

          {/* Configuração de Horário / Intervalo */}
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              Parâmetros de Disparo
            </Label>

            {formData.scheduleType === "interval" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Intervalo em Minutos</Label>
                <Input
                  type="number"
                  value={formData.scheduleConfig?.intervalMinutes || 60}
                  onChange={(e) => handleConfigChange("intervalMinutes", parseInt(e.target.value, 10))}
                  placeholder="Ex: 60 (a cada 1 hora)"
                  className="bg-zinc-950 border-zinc-800 text-xs font-mono max-w-xs"
                />
              </div>
            )}

            {(formData.scheduleType === "daily" || formData.scheduleType === "weekly" || formData.scheduleType === "monthly") && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Horário de Execução (HH:MM)</Label>
                <Input
                  type="time"
                  value={formData.scheduleConfig?.timeOfDay || "20:00"}
                  onChange={(e) => handleConfigChange("timeOfDay", e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs font-mono max-w-xs"
                />
              </div>
            )}

            {formData.scheduleType === "weekly" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Dias da Semana</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((dayName, idx) => {
                    const isSelected = (formData.scheduleConfig?.daysOfWeek || []).includes(idx);
                    return (
                      <button
                        key={dayName}
                        type="button"
                        onClick={() => toggleDayOfWeek(idx)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all ${
                          isSelected
                            ? "bg-cyan-600 text-white border-cyan-500 shadow-sm"
                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                        }`}
                      >
                        {dayName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.scheduleType === "specific_date" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Data e Hora Exata</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduleConfig?.specificDate || ""}
                  onChange={(e) => handleConfigChange("specificDate", e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs font-mono max-w-xs"
                />
              </div>
            )}
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
            Salvar Timer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
