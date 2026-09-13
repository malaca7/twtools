import React, { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  Sliders,
  Terminal,
  Layers,
  LayoutDashboard,
  Play,
  Settings2,
  RefreshCw,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  Activity,
  History,
  FileCode,
} from "lucide-react";
import { PageHeader } from "@/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { toast } from "sonner";

// Services & Engine
import type { BotProject, ExecutionLog } from "@/services/botEngine/types";
import {
  getBotProjects,
  saveBotProjects,
  getExecutionLogs,
  BOT_SYNC_EVENT,
  DEFAULT_BOT_PROJECT,
} from "@/services/botEngine/botService";

// Subcomponents
import { BotDashboard } from "@/components/dev/bot/BotDashboard";
import { BotList } from "@/components/dev/bot/BotList";
import { BotBuilder } from "@/components/dev/bot/BotBuilder";
import { BotEditorModal } from "@/components/dev/bot/BotEditorModal";

export const Route = createFileRoute("/_authenticated/dev/bot")({
  component: DevBotPageWrapper,
});

function DevBotPageWrapper() {
  return (
    <DeveloperGuard>
      <DevBotPageContent />
    </DeveloperGuard>
  );
}

function DevBotPageContent() {
  const [bots, setBots] = useState<BotProject[]>([DEFAULT_BOT_PROJECT]);
  const [selectedBotId, setSelectedBotId] = useState<string>(DEFAULT_BOT_PROJECT.id);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [builderTab, setBuilderTab] = useState<string>("commands");
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Bot creation/editing modal state
  const [botModalOpen, setBotModalOpen] = useState<boolean>(false);
  const [botToEdit, setBotToEdit] = useState<BotProject | null>(null);

  // Carrega bots e logs
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const loadedBots = await getBotProjects();
      setBots(loadedBots);
      if (loadedBots.length > 0 && !loadedBots.find((b) => b.id === selectedBotId)) {
        setSelectedBotId(loadedBots[0].id);
      }
      setLogs(getExecutionLogs());
    } catch (err) {
      console.error("Erro ao carregar dados do bot:", err);
      toast.error("Erro ao carregar instâncias do bot");
    } finally {
      setLoading(false);
    }
  }, [selectedBotId]);

  useEffect(() => {
    loadData();

    const handleSync = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setBots(e.detail);
      }
    };

    const handleLogsUpdate = () => {
      setLogs(getExecutionLogs());
    };

    window.addEventListener(BOT_SYNC_EVENT, handleSync);
    window.addEventListener("tw_bot_logs_updated", handleLogsUpdate);

    return () => {
      window.removeEventListener(BOT_SYNC_EVENT, handleSync);
      window.removeEventListener("tw_bot_logs_updated", handleLogsUpdate);
    };
  }, [loadData]);

  // Bot ativo selecionado
  const activeBot = bots.find((b) => b.id === selectedBotId) || bots[0] || null;

  // Handlers para bots
  const handleSaveBot = async (updatedBot: BotProject) => {
    const exists = bots.some((b) => b.id === updatedBot.id);
    let newBots: BotProject[];
    if (exists) {
      newBots = bots.map((b) => (b.id === updatedBot.id ? updatedBot : b));
    } else {
      newBots = [...bots, updatedBot];
    }
    setBots(newBots);
    setSelectedBotId(updatedBot.id);
    await saveBotProjects(newBots);
  };

  const handleDeleteBot = async (botId: string) => {
    if (bots.length <= 1) {
      toast.error("Você precisa manter ao menos um bot configurado no sistema.");
      return;
    }
    const newBots = bots.filter((b) => b.id !== botId);
    setBots(newBots);
    if (selectedBotId === botId && newBots.length > 0) {
      setSelectedBotId(newBots[0].id);
    }
    await saveBotProjects(newBots);
    toast.success("Bot removido com sucesso!");
  };

  const handleDuplicateBot = async (bot: BotProject) => {
    const duplicated: BotProject = {
      ...bot,
      id: `bot_${Date.now()}`,
      name: `${bot.name} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commands: bot.commands?.map((c) => ({ ...c, id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` })) || [],
      events: bot.events?.map((e) => ({ ...e, id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` })) || [],
      timers: bot.timers?.map((t) => ({ ...t, id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` })) || [],
      variables: bot.variables?.map((v) => ({ ...v, id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` })) || [],
    };
    const newBots = [...bots, duplicated];
    setBots(newBots);
    setSelectedBotId(duplicated.id);
    await saveBotProjects(newBots);
    toast.success(`Bot "${duplicated.name}" duplicado com sucesso!`);
  };

  const handleToggleStatus = async (botId: string, enabled: boolean) => {
    const newBots = bots.map((b) => (b.id === botId ? { ...b, enabled } : b));
    setBots(newBots);
    await saveBotProjects(newBots);
    toast.success(enabled ? "Bot ativado no servidor!" : "Bot pausado.");
  };

  const handleOpenBuilderWithTab = (tab: "commands" | "events" | "timers" | "variables" | "simulator" = "commands") => {
    setBuilderTab(tab);
    setActiveTab("builder");
  };

  const handleClearLogs = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tw_bot_execution_logs_v1");
      setLogs([]);
      toast.success("Histórico de logs limpo com sucesso.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Construtor & Gerenciador de Bot"
        description="Plataforma de criação e orquestração de comandos, eventos e automações para Discord GTA RP inspirada no BotGhost"
      >
        <div className="flex items-center gap-3">
          {activeBot && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-xs">
              <span className="text-zinc-500">Bot em Foco:</span>
              <span className="font-semibold text-white">{activeBot.name}</span>
              <Badge variant="outline" className="font-mono text-[10px] text-emerald-400 border-emerald-500/30">
                {activeBot.prefix}
              </Badge>
            </div>
          )}

          <Button
            onClick={() => {
              setBotToEdit(null);
              setBotModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 gap-1.5 shadow-md"
          >
            <Bot className="h-4 w-4" />
            Novo Bot
          </Button>

          <Button
            onClick={() => loadData()}
            variant="outline"
            size="icon"
            className="h-9 w-9 border-zinc-800 text-zinc-400 hover:text-white"
            title="Recarregar dados"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </PageHeader>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-3">
          <TabsList className="bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl h-auto">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-xs gap-2 py-2 px-3.5 rounded-lg transition-all"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="builder"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-xs gap-2 py-2 px-3.5 rounded-lg transition-all"
            >
              <Sliders className="h-4 w-4" />
              Bot Builder
              {activeBot && (
                <Badge variant="outline" className="ml-1 text-[10px] border-zinc-700 font-mono">
                  {(activeBot.commands?.length || 0) + (activeBot.events?.length || 0) + (activeBot.timers?.length || 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="bots"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-xs gap-2 py-2 px-3.5 rounded-lg transition-all"
            >
              <Bot className="h-4 w-4" />
              Meus Bots
              <Badge variant="outline" className="ml-1 text-[10px] border-zinc-700 font-mono">
                {bots.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Active Bot Switcher if multiple bots exist */}
          {bots.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">Alternar Bot:</span>
              <select
                value={selectedBotId}
                onChange={(e) => setSelectedBotId(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-2.5 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
              >
                {bots.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.prefix})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab Content: Dashboard */}
        <TabsContent value="dashboard" className="space-y-6 mt-0 focus-visible:outline-none">
          <BotDashboard
            bots={bots}
            activeBot={activeBot}
            onSelectBot={(bot) => setSelectedBotId(bot.id)}
            onOpenBuilder={handleOpenBuilderWithTab}
            onCreateBot={() => {
              setBotToEdit(null);
              setBotModalOpen(true);
            }}
            onToggleBotStatus={handleToggleStatus}
            logs={logs}
            onClearLogs={handleClearLogs}
            onRefresh={loadData}
          />
        </TabsContent>

        {/* Tab Content: Bot Builder */}
        <TabsContent value="builder" className="space-y-6 mt-0 focus-visible:outline-none">
          {activeBot ? (
            <BotBuilder
              bot={activeBot}
              onUpdateBot={handleSaveBot}
              onSaveBot={handleSaveBot}
              initialTab={builderTab as any}
            />
          ) : (
            <div className="py-20 text-center text-zinc-500">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-30 text-zinc-400" />
              <p className="text-sm">Selecione ou crie um bot para começar a usar o construtor.</p>
              <Button
                onClick={() => {
                  setBotToEdit(null);
                  setBotModalOpen(true);
                }}
                className="mt-4 bg-emerald-600 text-xs"
              >
                Criar Bot
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Tab Content: Meus Bots */}
        <TabsContent value="bots" className="space-y-6 mt-0 focus-visible:outline-none">
          <BotList
            bots={bots}
            selectedBotId={selectedBotId}
            onSelectBot={(bot) => setSelectedBotId(bot.id)}
            onCreateBot={() => {
              setBotToEdit(null);
              setBotModalOpen(true);
            }}
            onEditBot={(bot) => {
              setBotToEdit(bot);
              setBotModalOpen(true);
            }}
            onDeleteBot={handleDeleteBot}
            onDuplicateBot={handleDuplicateBot}
            onToggleStatus={handleToggleStatus}
            onOpenBuilder={(bot) => {
              setSelectedBotId(bot.id);
              setActiveTab("builder");
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Bot Editor / Creator Modal */}
      <BotEditorModal
        open={botModalOpen}
        onOpenChange={setBotModalOpen}
        bot={botToEdit}
        onSave={handleSaveBot}
      />
    </div>
  );
}
