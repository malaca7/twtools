import { useState } from "react";
import { toast } from "sonner";
import {
  Terminal,
  Zap,
  Clock,
  Variable,
  Play,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  Bot,
  ExternalLink,
  Layers,
  Settings,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { BotProject, BotCommand, BotEvent, BotTimer } from "@/services/botEngine/types";
import { CommandEditorModal } from "./CommandEditorModal";
import { EventEditorModal } from "./EventEditorModal";
import { TimerEditorModal } from "./TimerEditorModal";
import { VariableManager } from "./VariableManager";
import { BotSimulatorTester } from "./BotSimulatorTester";

interface BotBuilderProps {
  bot: BotProject;
  onUpdateBot: (updated: BotProject) => void;
}

export function BotBuilder({ bot, onUpdateBot }: BotBuilderProps) {
  const [activeBuilderTab, setActiveBuilderTab] = useState<string>("commands");

  // Modais de Criação / Edição
  const [editingCommand, setEditingCommand] = useState<BotCommand | null>(null);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);

  const [editingEvent, setEditingEvent] = useState<BotEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const [editingTimer, setEditingTimer] = useState<BotTimer | null>(null);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  // =========================================================================
  // HANDLERS DE COMANDOS
  // =========================================================================
  const handleOpenCreateCommand = () => {
    setEditingCommand({
      id: `cmd_${Date.now()}`,
      botId: bot.id,
      name: "",
      prefix: bot.prefix,
      description: "",
      enabled: true,
      parameters: [],
      conditions: [],
      actions: [
        {
          id: `act_${Date.now()}`,
          type: "send_message",
          name: "Resposta do Comando",
          order: 1,
          config: {
            description: "Olá {{user.name}}! Comando executado.",
            color: "#10B981",
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsCommandModalOpen(true);
  };

  const handleSaveCommand = (cmd: BotCommand) => {
    const existing = bot.commands.some((c) => c.id === cmd.id);
    let updatedCommands: BotCommand[];
    if (existing) {
      updatedCommands = bot.commands.map((c) => (c.id === cmd.id ? cmd : c));
      toast.success(`Comando "${bot.prefix}${cmd.name}" atualizado!`);
    } else {
      updatedCommands = [...bot.commands, cmd];
      toast.success(`Comando "${bot.prefix}${cmd.name}" criado!`);
    }
    onUpdateBot({ ...bot, commands: updatedCommands });
  };

  const handleDeleteCommand = (cmdId: string) => {
    onUpdateBot({ ...bot, commands: bot.commands.filter((c) => c.id !== cmdId) });
    toast.success("Comando removido.");
  };

  const handleToggleCommand = (cmdId: string, enabled: boolean) => {
    onUpdateBot({
      ...bot,
      commands: bot.commands.map((c) => (c.id === cmdId ? { ...c, enabled } : c)),
    });
    toast.success(enabled ? "Comando ativado!" : "Comando pausado.");
  };

  // =========================================================================
  // HANDLERS DE EVENTOS
  // =========================================================================
  const handleOpenCreateEvent = () => {
    setEditingEvent({
      id: `evt_${Date.now()}`,
      botId: bot.id,
      name: "",
      triggerType: "message_create",
      description: "",
      enabled: true,
      conditions: [],
      actions: [
        {
          id: `act_${Date.now()}`,
          type: "send_message",
          name: "Resposta do Evento",
          order: 1,
          config: {
            description: "Ação automática do evento",
            color: "#8B5CF6",
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (evt: BotEvent) => {
    const existing = bot.events.some((e) => e.id === evt.id);
    let updatedEvents: BotEvent[];
    if (existing) {
      updatedEvents = bot.events.map((e) => (e.id === evt.id ? evt : e));
      toast.success(`Evento "${evt.name}" atualizado!`);
    } else {
      updatedEvents = [...bot.events, evt];
      toast.success(`Evento "${evt.name}" criado!`);
    }
    onUpdateBot({ ...bot, events: updatedEvents });
  };

  const handleDeleteEvent = (evtId: string) => {
    onUpdateBot({ ...bot, events: bot.events.filter((e) => e.id !== evtId) });
    toast.success("Evento removido.");
  };

  const handleToggleEvent = (evtId: string, enabled: boolean) => {
    onUpdateBot({
      ...bot,
      events: bot.events.map((e) => (e.id === evtId ? { ...e, enabled } : e)),
    });
    toast.success(enabled ? "Evento ativado!" : "Evento pausado.");
  };

  // =========================================================================
  // HANDLERS DE TIMERS
  // =========================================================================
  const handleOpenCreateTimer = () => {
    setEditingTimer({
      id: `timer_${Date.now()}`,
      botId: bot.id,
      name: "",
      description: "",
      scheduleType: "daily",
      scheduleConfig: {
        timeOfDay: "20:00",
        timezone: "America/Sao_Paulo",
      },
      enabled: true,
      repeat: true,
      executionCount: 0,
      conditions: [],
      actions: [
        {
          id: `act_${Date.now()}`,
          type: "send_message",
          name: "Lembrete Programado",
          order: 1,
          config: {
            description: "Mensagem agendada pelo timer",
            color: "#06B6D4",
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsTimerModalOpen(true);
  };

  const handleSaveTimer = (tim: BotTimer) => {
    const existing = bot.timers.some((t) => t.id === tim.id);
    let updatedTimers: BotTimer[];
    if (existing) {
      updatedTimers = bot.timers.map((t) => (t.id === tim.id ? tim : t));
      toast.success(`Timer "${tim.name}" atualizado!`);
    } else {
      updatedTimers = [...bot.timers, tim];
      toast.success(`Timer "${tim.name}" criado!`);
    }
    onUpdateBot({ ...bot, timers: updatedTimers });
  };

  const handleDeleteTimer = (timId: string) => {
    onUpdateBot({ ...bot, timers: bot.timers.filter((t) => t.id !== timId) });
    toast.success("Timer removido.");
  };

  const handleToggleTimer = (timId: string, enabled: boolean) => {
    onUpdateBot({
      ...bot,
      timers: bot.timers.map((t) => (t.id === timId ? { ...t, enabled } : t)),
    });
    toast.success(enabled ? "Timer ativado!" : "Timer pausado.");
  };

  return (
    <div className="space-y-6">
      {/* NAVEGAÇÃO INTERNA DO BUILDER */}
      <Tabs value={activeBuilderTab} onValueChange={setActiveBuilderTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-border/60">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <TabsTrigger value="commands" className="text-xs font-bold gap-1.5 px-3 py-1.5">
              <Terminal className="h-3.5 w-3.5" />
              Comandos ({bot.commands.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs font-bold gap-1.5 px-3 py-1.5">
              <Zap className="h-3.5 w-3.5" />
              Eventos ({bot.events.length})
            </TabsTrigger>
            <TabsTrigger value="timers" className="text-xs font-bold gap-1.5 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5" />
              Timers ({bot.timers.length})
            </TabsTrigger>
            <TabsTrigger value="variables" className="text-xs font-bold gap-1.5 px-3 py-1.5">
              <Variable className="h-3.5 w-3.5" />
              Variáveis ({bot.variables.length})
            </TabsTrigger>
            <TabsTrigger value="simulator" className="text-xs font-bold gap-1.5 px-3 py-1.5">
              <Play className="h-3.5 w-3.5" />
              Simulador
            </TabsTrigger>
          </TabsList>

          <div>
            {activeBuilderTab === "commands" && (
              <Button
                size="sm"
                onClick={handleOpenCreateCommand}
                className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar Comando
              </Button>
            )}
            {activeBuilderTab === "events" && (
              <Button
                size="sm"
                onClick={handleOpenCreateEvent}
                className="text-xs font-bold gap-1.5 bg-amber-600 hover:bg-amber-500 text-white h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar Evento
              </Button>
            )}
            {activeBuilderTab === "timers" && (
              <Button
                size="sm"
                onClick={handleOpenCreateTimer}
                className="text-xs font-bold gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white h-8"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar Timer
              </Button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: COMANDOS */}
        {/* ========================================================================= */}
        <TabsContent value="commands" className="space-y-4">
          {bot.commands.length === 0 ? (
            <Card className="surface-card p-12 text-center border-dashed border-zinc-800">
              <Terminal className="h-8 w-8 text-muted-foreground mx-auto opacity-50 mb-2" />
              <h4 className="text-sm font-bold text-foreground">Nenhum comando criado</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto pt-1 pb-3">
                Crie seu primeiro comando personalizado para responder automaticamente aos membros no Discord.
              </p>
              <Button size="sm" onClick={handleOpenCreateCommand} className="text-xs font-bold">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Criar Primeiro Comando
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bot.commands.map((cmd) => (
                <Card
                  key={cmd.id}
                  className={`surface-card p-4 border transition-all flex flex-col justify-between ${
                    cmd.enabled ? "border-zinc-800/80 bg-zinc-950/60" : "border-zinc-850 opacity-60 bg-zinc-950/30"
                  }`}
                  style={{ borderLeftWidth: "4px", borderLeftColor: cmd.enabled ? "#10B981" : "#52525b" }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm text-foreground">
                            {cmd.prefix || bot.prefix}{cmd.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono py-0 bg-zinc-900">
                            {cmd.actions.length} {cmd.actions.length === 1 ? "ação" : "ações"}
                          </Badge>
                        </div>
                        {cmd.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                            {cmd.description}
                          </p>
                        )}
                      </div>

                      <Switch
                        checked={cmd.enabled}
                        onCheckedChange={(val) => handleToggleCommand(cmd.id, val)}
                        title={cmd.enabled ? "Comando Ativo" : "Comando Pausado"}
                      />
                    </div>

                    {/* Argumentos & Condições */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {cmd.parameters.map((p) => (
                        <Badge key={p.id} className="bg-zinc-900 text-zinc-300 border-zinc-800 text-[10px] font-mono py-0">
                          &lt;{p.name}&gt;
                        </Badge>
                      ))}
                      {cmd.conditions.length > 0 && (
                        <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] py-0">
                          {cmd.conditions.length} {cmd.conditions.length === 1 ? "regra" : "regras"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/60 mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Uso: {cmd.prefix || bot.prefix}{cmd.name}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCommand(cmd);
                          setIsCommandModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Editar comando"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCommand(cmd.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                        title="Excluir comando"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 2: EVENTOS */}
        {/* ========================================================================= */}
        <TabsContent value="events" className="space-y-4">
          {bot.events.length === 0 ? (
            <Card className="surface-card p-12 text-center border-dashed border-zinc-800">
              <Zap className="h-8 w-8 text-muted-foreground mx-auto opacity-50 mb-2" />
              <h4 className="text-sm font-bold text-foreground">Nenhum evento automatizado</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto pt-1 pb-3">
                Configure gatilhos automáticos disparados por mensagens, entrada de membros ou webhooks.
              </p>
              <Button size="sm" onClick={handleOpenCreateEvent} className="text-xs font-bold">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Criar Primeiro Evento
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bot.events.map((evt) => (
                <Card
                  key={evt.id}
                  className={`surface-card p-4 border transition-all flex flex-col justify-between ${
                    evt.enabled ? "border-zinc-800/80 bg-zinc-950/60" : "border-zinc-850 opacity-60 bg-zinc-950/30"
                  }`}
                  style={{ borderLeftWidth: "4px", borderLeftColor: evt.enabled ? "#F59E0B" : "#52525b" }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{evt.name}</span>
                        </div>
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/25 text-[10px] font-mono py-0 mt-1">
                          {evt.triggerType}
                        </Badge>
                        {evt.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      <Switch
                        checked={evt.enabled}
                        onCheckedChange={(val) => handleToggleEvent(evt.id, val)}
                        title={evt.enabled ? "Evento Ativo" : "Evento Pausado"}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/60 mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {evt.actions.length} {evt.actions.length === 1 ? "ação" : "ações"}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingEvent(evt);
                          setIsEventModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Editar evento"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                        title="Excluir evento"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 3: TIMERS */}
        {/* ========================================================================= */}
        <TabsContent value="timers" className="space-y-4">
          {bot.timers.length === 0 ? (
            <Card className="surface-card p-12 text-center border-dashed border-zinc-800">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto opacity-50 mb-2" />
              <h4 className="text-sm font-bold text-foreground">Nenhum timer agendado</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto pt-1 pb-3">
                Programe lembretes diários, recados recorrentes ou rotinas com horários programados.
              </p>
              <Button size="sm" onClick={handleOpenCreateTimer} className="text-xs font-bold">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Criar Primeiro Timer
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bot.timers.map((tim) => (
                <Card
                  key={tim.id}
                  className={`surface-card p-4 border transition-all flex flex-col justify-between ${
                    tim.enabled ? "border-zinc-800/80 bg-zinc-950/60" : "border-zinc-850 opacity-60 bg-zinc-950/30"
                  }`}
                  style={{ borderLeftWidth: "4px", borderLeftColor: tim.enabled ? "#06B6D4" : "#52525b" }}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-foreground">{tim.name}</span>
                        <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/25 text-[10px] font-mono py-0">
                            {tim.scheduleType}
                          </Badge>
                          {tim.scheduleConfig?.timeOfDay && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              às {tim.scheduleConfig.timeOfDay}
                            </span>
                          )}
                        </div>
                        {tim.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                            {tim.description}
                          </p>
                        )}
                      </div>

                      <Switch
                        checked={tim.enabled}
                        onCheckedChange={(val) => handleToggleTimer(tim.id, val)}
                        title={tim.enabled ? "Timer Ativo" : "Timer Pausado"}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/60 mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Execuções: {tim.executionCount}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingTimer(tim);
                          setIsTimerModalOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Editar timer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTimer(tim.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                        title="Excluir timer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 4: VARIÁVEIS */}
        {/* ========================================================================= */}
        <TabsContent value="variables">
          <VariableManager
            variables={bot.variables}
            botId={bot.id}
            onChange={(updatedVars) => onUpdateBot({ ...bot, variables: updatedVars })}
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 5: SIMULADOR / TESTADOR */}
        {/* ========================================================================= */}
        <TabsContent value="simulator">
          <BotSimulatorTester bot={bot} />
        </TabsContent>
      </Tabs>

      {/* MODAIS */}
      <CommandEditorModal
        open={isCommandModalOpen}
        onOpenChange={setIsCommandModalOpen}
        command={editingCommand}
        botPrefix={bot.prefix}
        onSave={handleSaveCommand}
      />

      <EventEditorModal
        open={isEventModalOpen}
        onOpenChange={setIsEventModalOpen}
        event={editingEvent}
        onSave={handleSaveEvent}
      />

      <TimerEditorModal
        open={isTimerModalOpen}
        onOpenChange={setIsTimerModalOpen}
        timer={editingTimer}
        onSave={handleSaveTimer}
      />
    </div>
  );
}
