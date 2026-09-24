import React, { useState } from "react";
import {
  Bot,
  Plus,
  Edit2,
  Trash2,
  Sliders,
  Play,
  Terminal,
  Zap,
  Clock,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Calendar,
  Activity,
  Shield,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BotProject } from "@/services/botEngine/types";
import { toast } from "sonner";

interface BotListProps {
  bots: BotProject[];
  selectedBotId: string;
  onSelectBot: (bot: BotProject) => void;
  onCreateBot: () => void;
  onEditBot: (bot: BotProject) => void;
  onDeleteBot: (botId: string) => void;
  onDuplicateBot: (bot: BotProject) => void;
  onToggleStatus: (botId: string, enabled: boolean) => void;
  onOpenBuilder: (bot: BotProject) => void;
}

export const BotList: React.FC<BotListProps> = ({
  bots,
  selectedBotId,
  onSelectBot,
  onCreateBot,
  onEditBot,
  onDeleteBot,
  onDuplicateBot,
  onToggleStatus,
  onOpenBuilder,
}) => {
  const [botToDelete, setBotToDelete] = useState<BotProject | null>(null);

  const handleDeleteConfirm = () => {
    if (botToDelete) {
      onDeleteBot?.(botToDelete.id);
      setBotToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-400" />
            Meus Projetos de Bot
          </h2>
          <p className="text-xs text-zinc-400">
            Gerencie múltiplos bots ou instâncias do grupo com prefixos e conjuntos de regras independentes
          </p>
        </div>

        <Button
          onClick={() => onCreateBot?.()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 gap-1.5 shadow-lg shadow-emerald-950/60"
        >
          <Plus className="h-4 w-4" />
          Novo Bot
        </Button>
      </div>

      {/* Grid of Bots */}
      {bots.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-950/50 py-16 text-center">
          <CardContent className="space-y-4">
            <Bot className="h-12 w-12 mx-auto text-zinc-600" />
            <div>
              <h3 className="text-base font-bold text-white">Nenhum bot encontrado</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                Crie seu primeiro bot para configurar comandos, respostas automáticas e timers de rotina.
              </p>
            </div>
            <Button
              onClick={onCreateBot}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Criar Primeiro Bot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bots.map((bot) => {
            const isSelected = bot.id === selectedBotId;
            const commandsCount = bot.commands?.length || 0;
            const eventsCount = bot.events?.length || 0;
            const timersCount = bot.timers?.length || 0;

            return (
              <Card
                key={bot.id}
                className={`relative flex flex-col justify-between border transition-all duration-200 overflow-hidden ${
                  isSelected
                    ? "border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 via-zinc-950 to-zinc-950 shadow-xl shadow-emerald-950/20"
                    : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700/80 hover:bg-zinc-900/40"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
                )}

                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={bot.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                          alt={bot.name}
                          className="h-12 w-12 rounded-xl border border-zinc-700/80 object-cover shadow"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).onerror = null;
                            (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                          }}
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 ${
                            bot.enabled ? "bg-emerald-500" : "bg-zinc-500"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <CardTitle className="text-base font-bold text-white line-clamp-1">
                            {bot.name}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] px-1.5 py-0 border-zinc-700 text-zinc-300"
                          >
                            Prefixo: <strong className="text-emerald-400 ml-1">{bot.prefix}</strong>
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              bot.enabled
                                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                : "border-zinc-800 text-zinc-500"
                            }`}
                          >
                            {bot.enabled ? "Online" : "Desativado"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 border-zinc-800 bg-zinc-950 text-white">
                        <DropdownMenuItem
                          onClick={() => {
                            onSelectBot?.(bot);
                            onOpenBuilder?.(bot);
                          }}
                          className="text-xs cursor-pointer gap-2"
                        >
                          <Sliders className="h-3.5 w-3.5 text-blue-400" /> Abrir Construtor
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditBot?.(bot)}
                          className="text-xs cursor-pointer gap-2"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-zinc-400" /> Configurações
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDuplicateBot?.(bot)}
                          className="text-xs cursor-pointer gap-2"
                        >
                          <Copy className="h-3.5 w-3.5 text-emerald-400" /> Duplicar Bot
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem
                          onClick={() => setBotToDelete(bot)}
                          disabled={bots.length <= 1}
                          className="text-xs text-red-400 hover:text-red-300 cursor-pointer gap-2 focus:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Excluir Bot
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CardDescription className="text-xs text-zinc-400 line-clamp-2 mt-3 min-h-[32px]">
                    {bot.description || "Nenhuma descrição fornecida para esta instância de automação."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-5 py-3 space-y-4">
                  {/* Counters */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 text-center">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Comandos</div>
                      <div className="text-sm font-bold text-white font-mono flex items-center justify-center gap-1">
                        <Terminal className="h-3 w-3 text-blue-400" /> {commandsCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Eventos</div>
                      <div className="text-sm font-bold text-white font-mono flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3 text-amber-400" /> {eventsCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Timers</div>
                      <div className="text-sm font-bold text-white font-mono flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-cyan-400" /> {timersCount}
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-[11px] text-zinc-400">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Execuções totais:</span>
                      <span className="font-mono text-zinc-300">{bot.stats?.totalExecutions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Status da Engine:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400">{bot.enabled ? "Ativo" : "Pausado"}</span>
                        <Switch
                          checked={bot.enabled}
                          onCheckedChange={(checked) => onToggleStatus?.(bot.id, checked)}
                          className="scale-75 origin-right"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-2 border-t border-zinc-800/60 bg-zinc-900/20 flex items-center justify-between gap-2">
                  <Button
                    onClick={() => {
                      onSelectBot?.(bot);
                      toast.success(`Bot "${bot.name}" selecionado como ativo.`);
                    }}
                    variant={isSelected ? "secondary" : "ghost"}
                    size="sm"
                    className="text-xs h-8 text-zinc-300"
                  >
                    {isSelected ? "Selecionado" : "Selecionar"}
                  </Button>

                  <Button
                    onClick={() => {
                      onSelectBot?.(bot);
                      onOpenBuilder?.(bot);
                    }}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 gap-1.5 shadow"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    Construtor
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Bot Alert Dialog */}
      <AlertDialog open={!!botToDelete} onOpenChange={() => setBotToDelete(null)}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Excluir Bot "{botToDelete?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-400">
              Esta ação removerá permanentemente o bot, todos os seus comandos ({botToDelete?.commands?.length || 0}),
              eventos ({botToDelete?.events?.length || 0}) e timers ({botToDelete?.timers?.length || 0}). Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 bg-zinc-900 text-zinc-300 text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-500 text-white text-xs"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
