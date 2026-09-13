import { useState } from "react";
import { toast } from "sonner";
import {
  Play,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  User,
  Hash,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BotProject, ExecutionLog } from "@/services/botEngine/types";
import { runBotSimulation } from "@/services/botEngine/botService";

interface BotSimulatorTesterProps {
  bot: BotProject;
}

export function BotSimulatorTester({ bot }: BotSimulatorTesterProps) {
  const [selectedType, setSelectedType] = useState<"command" | "event">("command");
  const [targetId, setTargetId] = useState<string>(bot.commands?.[0]?.id || "");
  const [userName, setUserName] = useState("Malaca Dev");
  const [userId, setUserId] = useState("1537229296697999462");
  const [userRoles, setUserRoles] = useState("desenvolvedor, lider");
  const [channelName, setChannelName] = useState("testedev");
  const [channelId, setChannelId] = useState("1548413371194286314");
  const [commandArgs, setCommandArgs] = useState("comunicado importante da liderança");
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutionLog | null>(null);

  const availableCommands = bot.commands || [];
  const availableEvents = bot.events || [];

  const handleRunTest = async () => {
    setRunning(true);
    try {
      const selectedCommand = selectedType === "command" ? availableCommands.find((c) => c.id === targetId) : undefined;
      const selectedEvent = selectedType === "event" ? availableEvents.find((e) => e.id === targetId) : undefined;

      const rolesArray = userRoles.split(",").map((r) => r.trim()).filter(Boolean);

      // Parseia argumentos simples
      const argsMap: Record<string, any> = {
        0: commandArgs,
        raw: commandArgs,
      };
      if (selectedCommand?.parameters?.[0]?.name) {
        argsMap[selectedCommand.parameters[0].name] = commandArgs;
      }

      const log = await runBotSimulation({
        bot,
        source: "test",
        triggerName: selectedCommand?.name || selectedEvent?.name || "Teste Manual",
        command: selectedCommand,
        event: selectedEvent,
        user: {
          id: userId,
          name: userName,
          username: userName.toLowerCase().replace(/\s+/g, "_"),
          roles: rolesArray,
          permissions: ["manage_ceo_bot"],
        },
        channel: {
          id: channelId,
          name: channelName,
        },
        message: {
          id: `test_msg_${Date.now()}`,
          content: `${bot.prefix}${selectedCommand?.name || "teste"} ${commandArgs}`,
        },
        args: argsMap,
      });

      setLastResult(log);
      if (log.status === "success") {
        toast.success(`Teste executado com sucesso! (${log.durationMs}ms)`);
      } else if (log.status === "warning") {
        toast.warning("Execução interrompida: Condições não atendidas.");
      } else {
        toast.error(`Falha no teste: ${log.error || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      toast.error(`Erro ao simular: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="p-4 rounded-2xl bg-zinc-950/60 border border-border/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Simulador & Testador Interativo da Bot Engine
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/25 text-[10px]">
                Sandbox Live
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Teste comandos, gatilhos de eventos e verifique a interpolação de variáveis e passos executados em tempo real.
            </p>
          </div>
        </div>

        <Button
          onClick={handleRunTest}
          disabled={running}
          className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 h-9 px-4"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          {running ? "Executando..." : "Executar Teste"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA: PARÂMETROS DO TESTE (lg:col-span-5) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="surface-card p-4 border-zinc-800 space-y-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Alvo da Simulação
              </CardTitle>
            </CardHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Tipo de Alvo</Label>
                  <Select
                    value={selectedType}
                    onValueChange={(val: "command" | "event") => {
                      setSelectedType(val);
                      if (val === "command") {
                        setTargetId(availableCommands[0]?.id || "");
                      } else {
                        setTargetId(availableEvents[0]?.id || "");
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                      <SelectItem value="command">Comando ({availableCommands.length})</SelectItem>
                      <SelectItem value="event">Evento ({availableEvents.length})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Escolha o Alvo</Label>
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                      {selectedType === "command"
                        ? availableCommands.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs font-mono">
                              {bot.prefix}{c.name}
                            </SelectItem>
                          ))
                        : availableEvents.map((e) => (
                            <SelectItem key={e.id} value={e.id} className="text-xs">
                              {e.name}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedType === "command" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Argumentos do Comando</Label>
                  <Input
                    value={commandArgs}
                    onChange={(e) => setCommandArgs(e.target.value)}
                    placeholder="Texto passado como parâmetro do comando"
                    className="h-8 text-xs bg-zinc-900 border-zinc-800"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Contexto Simulado do Usuário & Canal
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Nome do Usuário</Label>
                  <Input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="h-7 text-xs bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">ID Discord</Label>
                  <Input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="h-7 text-xs font-mono bg-zinc-900 border-zinc-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px]">Cargos do Usuário (separados por vírgula)</Label>
                <Input
                  value={userRoles}
                  onChange={(e) => setUserRoles(e.target.value)}
                  placeholder="Ex: lider, gerente, desenvolvedor"
                  className="h-7 text-xs bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Canal</Label>
                  <Input
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="h-7 text-xs bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px]">ID do Canal</Label>
                  <Input
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    className="h-7 text-xs font-mono bg-zinc-900 border-zinc-800"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* COLUNA DIREITA: TRACE & RESULTADO DA EXECUÇÃO (lg:col-span-7) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="surface-card p-4 border-zinc-800 min-h-[380px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">
                    Linha do Tempo de Execução (Trace Log)
                  </span>
                </div>

                {lastResult && (
                  <Badge
                    className={
                      lastResult.status === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 text-[10px]"
                        : lastResult.status === "warning"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/25 text-[10px]"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/25 text-[10px]"
                    }
                  >
                    {lastResult.status === "success"
                      ? "Sucesso"
                      : lastResult.status === "warning"
                      ? "Condição Não Atendida"
                      : "Erro"}
                    {" • "}
                    {lastResult.durationMs}ms
                  </Badge>
                )}
              </div>

              {!lastResult ? (
                <div className="p-12 text-center text-muted-foreground space-y-2">
                  <Terminal className="h-8 w-8 mx-auto opacity-40" />
                  <p className="text-xs">
                    Nenhum teste executado ainda. Clique em "Executar Teste" para ver cada ação processada passo a passo.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {lastResult.trace.map((step, sIdx) => (
                    <div
                      key={step.stepId || sIdx}
                      className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {step.success ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold text-foreground">
                            Passo {sIdx + 1}: {step.stepName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] font-mono py-0 bg-zinc-950">
                            {step.type}
                          </Badge>
                          {step.durationMs !== undefined && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {step.durationMs}ms
                            </span>
                          )}
                        </div>
                      </div>

                      {step.output && (
                        <pre className="p-2 rounded-lg bg-zinc-950 text-[10px] font-mono text-zinc-300 overflow-x-auto border border-zinc-850">
                          {typeof step.output === "string"
                            ? step.output
                            : JSON.stringify(step.output, null, 2)}
                        </pre>
                      )}

                      {step.error && (
                        <p className="text-[11px] text-rose-400 bg-rose-950/20 p-2 rounded border border-rose-900/30">
                          {step.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lastResult && (
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Passos executados: {lastResult.stepsExecuted}</span>
                <span>Iniciado às: {new Date(lastResult.startedAt).toLocaleTimeString()}</span>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
