import React, { useState } from "react";
import {
  Bot,
  Zap,
  Terminal,
  Calendar,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Plus,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Search,
  Sparkles,
  Sliders,
  Flame,
  FileCode,
  Layers,
  HelpCircle,
  Trash2,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BotProject, ExecutionLog } from "@/services/botEngine/types";

interface BotDashboardProps {
  bots: BotProject[];
  activeBot: BotProject | null;
  onSelectBot: (bot: BotProject) => void;
  onOpenBuilder: (tab?: "commands" | "events" | "timers" | "variables" | "simulator") => void;
  onCreateBot: () => void;
  onToggleBotStatus: (botId: string, enabled: boolean) => void;
  logs: ExecutionLog[];
  onClearLogs?: () => void;
  onRefresh?: () => void;
}

export const BotDashboard: React.FC<BotDashboardProps> = ({
  bots,
  activeBot,
  onSelectBot,
  onOpenBuilder,
  onCreateBot,
  onToggleBotStatus,
  logs,
  onClearLogs,
  onRefresh,
}) => {
  const [inspectedLog, setInspectedLog] = useState<ExecutionLog | null>(null);
  const [logFilter, setLogFilter] = useState<string>("all");

  const totalBots = bots.length;
  const activeBotsCount = bots.filter((b) => b.enabled).length;

  const totalCommands = bots.reduce((acc, b) => acc + (b.commands?.length || 0), 0);
  const totalEvents = bots.reduce((acc, b) => acc + (b.events?.length || 0), 0);
  const totalTimers = bots.reduce((acc, b) => acc + (b.timers?.length || 0), 0);
  const totalExecutions = bots.reduce((acc, b) => acc + (b.stats?.totalExecutions || 0), 0) + logs.length;
  const totalErrors = bots.reduce((acc, b) => acc + (b.stats?.errorsCount || 0), 0) + logs.filter((l) => l.status === "error").length;

  const successRate = totalExecutions > 0 ? Math.round(((totalExecutions - totalErrors) / totalExecutions) * 100) : 100;

  const filteredLogs = logs.filter((l) => {
    if (logFilter === "success") return l.status === "success";
    if (logFilter === "error") return l.status === "error";
    if (logFilter === "blocked") return l.status === "blocked";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-900/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 font-mono text-xs flex items-center gap-1.5"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Bot Engine v1.0.0 Online
              </Badge>
              <Badge
                variant="outline"
                className="bg-zinc-800/80 text-zinc-300 border-zinc-700 text-xs"
              >
                BotGhost Compatible Architecture
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Automações & Construtor de Bots
            </h1>
            <p className="text-sm md:text-base text-zinc-400 max-w-2xl">
              Crie lógicas ricas, comandos interativos com parâmetros, gatilhos de eventos e timers programados sem necessidade de codificação direta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => onOpenBuilder("simulator")}
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 gap-2 h-10 px-4"
            >
              <Play className="h-4 w-4 fill-current" />
              Simulador Sandbox
            </Button>
            <Button
              onClick={onCreateBot}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 h-10 px-4 shadow-lg shadow-emerald-950"
            >
              <Plus className="h-4 w-4" />
              Criar Novo Bot
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <Card className="border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md hover:border-zinc-700/80 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Bots Ativos</span>
              <Bot className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{activeBotsCount}</span>
              <span className="text-xs text-zinc-500">/ {totalBots} total</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {activeBotsCount > 0 ? "Instâncias operacionais" : "Nenhum ativo"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md hover:border-zinc-700/80 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Comandos</span>
              <Terminal className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{totalCommands}</span>
              <span className="text-xs text-zinc-500">ações</span>
            </div>
            <button
              onClick={() => onOpenBuilder("commands")}
              className="mt-2 flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 hover:underline text-left"
            >
              Configurar no builder <ChevronRight className="h-3 w-3" />
            </button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md hover:border-zinc-700/80 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Eventos</span>
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{totalEvents}</span>
              <span className="text-xs text-zinc-500">gatilhos</span>
            </div>
            <button
              onClick={() => onOpenBuilder("events")}
              className="mt-2 flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 hover:underline text-left"
            >
              Ver automações <ChevronRight className="h-3 w-3" />
            </button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md hover:border-zinc-700/80 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Timers</span>
              <Clock className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{totalTimers}</span>
              <span className="text-xs text-zinc-500">agendados</span>
            </div>
            <button
              onClick={() => onOpenBuilder("timers")}
              className="mt-2 flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline text-left"
            >
              Agendamentos <ChevronRight className="h-3 w-3" />
            </button>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md hover:border-zinc-700/80 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Execuções</span>
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{totalExecutions}</span>
              <span className="text-xs text-zinc-500">ciclos</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-400">
              <Flame className="h-3 w-3 text-purple-400" />
              Runtime ativo
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md hover:border-zinc-700/80 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Sucesso</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">{successRate}%</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-zinc-400">
              <span>{totalErrors} erro(s)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Shortcuts & Current Bot Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selected Bot Card */}
        <Card className="lg:col-span-2 border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md shadow-xl">
          <CardHeader className="border-b border-zinc-800/60 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-400" />
                  Bot Ativo Selecionado
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Instância em foco para edição, testes e automações
                </CardDescription>
              </div>

              {activeBot && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Habilitado</span>
                    <Switch
                      checked={activeBot.enabled}
                      onCheckedChange={(val) => onToggleBotStatus(activeBot.id, val)}
                    />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      activeBot.enabled
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400"
                    }
                  >
                    {activeBot.enabled ? "Online" : "Pausado"}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {activeBot ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800/70 bg-zinc-900/40">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={activeBot.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                        alt={activeBot.name}
                        className="h-16 w-16 rounded-2xl border border-zinc-700 object-cover shadow-lg"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-zinc-950 ${
                          activeBot.enabled ? "bg-emerald-500" : "bg-zinc-500"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{activeBot.name}</h3>
                        <Badge variant="outline" className="font-mono text-[10px] text-zinc-400 border-zinc-700">
                          Prefixo: <strong className="text-emerald-400 ml-1">{activeBot.prefix}</strong>
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1 max-w-md">
                        {activeBot.description || "Sem descrição definida."}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 pt-1 font-mono">
                        {activeBot.guildId && <span>Servidor ID: {activeBot.guildId}</span>}
                        {activeBot.applicationId && <span>App ID: {activeBot.applicationId}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-col items-end gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => onOpenBuilder("commands")}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 gap-1.5 shadow-md"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      Abrir Bot Builder
                    </Button>
                  </div>
                </div>

                {/* Sub-modules navigation */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => onOpenBuilder("commands")}
                    className="flex flex-col items-start p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/70 hover:border-blue-500/40 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between w-full text-blue-400 mb-2">
                      <Terminal className="h-4 w-4" />
                      <span className="text-xs font-mono font-bold">{activeBot.commands?.length || 0}</span>
                    </div>
                    <span className="text-xs font-medium text-white group-hover:text-blue-300">Comandos</span>
                    <span className="text-[10px] text-zinc-500">Gatilhos de texto e prefixos</span>
                  </button>

                  <button
                    onClick={() => onOpenBuilder("events")}
                    className="flex flex-col items-start p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/70 hover:border-amber-500/40 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between w-full text-amber-400 mb-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-xs font-mono font-bold">{activeBot.events?.length || 0}</span>
                    </div>
                    <span className="text-xs font-medium text-white group-hover:text-amber-300">Eventos</span>
                    <span className="text-[10px] text-zinc-500">Entradas, saídas e hooks</span>
                  </button>

                  <button
                    onClick={() => onOpenBuilder("timers")}
                    className="flex flex-col items-start p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/70 hover:border-cyan-500/40 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between w-full text-cyan-400 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-mono font-bold">{activeBot.timers?.length || 0}</span>
                    </div>
                    <span className="text-xs font-medium text-white group-hover:text-cyan-300">Timers</span>
                    <span className="text-[10px] text-zinc-500">Rotinas programadas</span>
                  </button>

                  <button
                    onClick={() => onOpenBuilder("variables")}
                    className="flex flex-col items-start p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:bg-zinc-900/70 hover:border-emerald-500/40 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between w-full text-emerald-400 mb-2">
                      <FileCode className="h-4 w-4" />
                      <span className="text-xs font-mono font-bold">{activeBot.variables?.length || 0}</span>
                    </div>
                    <span className="text-xs font-medium text-white group-hover:text-emerald-300">Variáveis</span>
                    <span className="text-[10px] text-zinc-500">Escopos e placeholders</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500">
                <Bot className="h-10 w-10 mx-auto mb-3 opacity-40 text-zinc-400" />
                <p className="text-sm">Nenhum bot configurado.</p>
                <Button onClick={onCreateBot} variant="outline" className="mt-4 border-zinc-700 text-xs">
                  Criar Primeiro Bot
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Shortcuts */}
        <Card className="border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <CardHeader className="border-b border-zinc-800/60 pb-4">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Ações Rápidas
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Atalhos diretos para criar e testar
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-3">
            <button
              onClick={() => onOpenBuilder("commands")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-blue-500/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-white group-hover:text-blue-300">Novo Comando</div>
                  <div className="text-[10px] text-zinc-400">Configurar prefixo e argumentos</div>
                </div>
              </div>
              <Plus className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => onOpenBuilder("events")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-amber-500/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-white group-hover:text-amber-300">Novo Evento</div>
                  <div className="text-[10px] text-zinc-400">Gatilho de entrada ou mensagem</div>
                </div>
              </div>
              <Plus className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => onOpenBuilder("timers")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-cyan-500/40 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-white group-hover:text-cyan-300">Novo Timer</div>
                  <div className="text-[10px] text-zinc-400">Automação com hora marcada</div>
                </div>
              </div>
              <Plus className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => onOpenBuilder("simulator")}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 group-hover:scale-105 transition-transform">
                  <Play className="h-4 w-4 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-medium text-emerald-300">Testar no Simulador</div>
                  <div className="text-[10px] text-emerald-400/70">Disparar comandos em sandbox</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </CardContent>

          <div className="p-4 border-t border-zinc-800/60 bg-zinc-900/30 text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Engine Status: Operacional</span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="h-3 w-3" /> Sincronizar
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* Execution Logs Table */}
      <Card className="border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md shadow-xl">
        <CardHeader className="border-b border-zinc-800/60 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                Logs Recentes de Execução
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Histórico em tempo real de comandos, eventos e automações interpretados pela engine
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5 text-xs">
                <button
                  onClick={() => setLogFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    logFilter === "all" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Todos ({logs.length})
                </button>
                <button
                  onClick={() => setLogFilter("success")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    logFilter === "success" ? "bg-emerald-500/20 text-emerald-400 font-medium" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Sucesso
                </button>
                <button
                  onClick={() => setLogFilter("error")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    logFilter === "error" ? "bg-red-500/20 text-red-400 font-medium" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Erros
                </button>
              </div>

              {logs.length > 0 && onClearLogs && (
                <Button
                  onClick={onClearLogs}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-zinc-500 hover:text-red-400 h-8 px-2"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30 text-zinc-400" />
              <p className="text-sm">Nenhum log de execução gravado recentemente.</p>
              <p className="text-xs text-zinc-600 mt-1">
                Dispare comandos no simulador ou no Discord para ver o rastreamento em tempo real.
              </p>
              <Button
                onClick={() => onOpenBuilder("simulator")}
                variant="outline"
                size="sm"
                className="mt-4 border-zinc-800 text-emerald-400 text-xs gap-1.5"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Abrir Simulador
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60 overflow-x-auto">
              {filteredLogs.map((log) => {
                const isSuccess = log.status === "success";
                const isError = log.status === "error";
                const isBlocked = log.status === "blocked";

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 hover:bg-zinc-900/40 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSuccess
                            ? "bg-emerald-500/10 text-emerald-400"
                            : isError
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : isError ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{log.triggerName}</span>
                          <Badge variant="outline" className="font-mono text-[10px] text-zinc-400 border-zinc-800">
                            {log.triggerType}
                          </Badge>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(log.executedAt).toLocaleTimeString("pt-BR")}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Disparado por: <span className="text-zinc-300">{log.user?.name || "Sistema"}</span> •
                          Canal: <span className="text-zinc-300">{log.channel?.name || "Global"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="font-mono text-[11px] text-zinc-400">{log.durationMs}ms</div>
                        <div className="text-[10px] text-zinc-500">{log.trace?.length || 0} passos executados</div>
                      </div>

                      <Button
                        onClick={() => setInspectedLog(log)}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-zinc-400 hover:text-white"
                      >
                        <Eye className="h-4 w-4 mr-1" /> Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Inspector Dialog */}
      <Dialog open={!!inspectedLog} onOpenChange={() => setInspectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Activity className="h-5 w-5 text-purple-400" />
              Detalhes de Execução: {inspectedLog?.triggerName}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Passo a passo registrado pelo interpretador da Bot Engine
            </DialogDescription>
          </DialogHeader>

          {inspectedLog && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
                  <div className="text-zinc-500 text-[10px]">Status</div>
                  <div className="font-semibold text-white uppercase">{inspectedLog.status}</div>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
                  <div className="text-zinc-500 text-[10px]">Tempo Total</div>
                  <div className="font-semibold font-mono text-emerald-400">{inspectedLog.durationMs}ms</div>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
                  <div className="text-zinc-500 text-[10px]">Gatilho</div>
                  <div className="font-semibold text-white">{inspectedLog.triggerType}</div>
                </div>
                <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
                  <div className="text-zinc-500 text-[10px]">Passos</div>
                  <div className="font-semibold text-white">{inspectedLog.trace?.length || 0}</div>
                </div>
              </div>

              {inspectedLog.error && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
                  <span className="font-bold">Erro: </span>
                  {inspectedLog.error}
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Linha do Tempo de Execução (Trace)
                </div>
                <div className="space-y-2 font-mono text-xs">
                  {inspectedLog.trace?.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/70 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400">
                          #{idx + 1} {step.actionType}
                        </span>
                        <span className="text-[10px] text-zinc-500">{step.durationMs}ms</span>
                      </div>
                      <p className="text-zinc-300 font-sans text-xs">{step.description}</p>
                      {step.result && (
                        <div className="p-2 rounded bg-black/50 border border-zinc-800 text-[11px] text-zinc-400 overflow-x-auto">
                          {JSON.stringify(step.result, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
