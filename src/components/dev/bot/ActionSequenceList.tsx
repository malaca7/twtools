import { useState } from "react";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Settings,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BotAction, ActionType } from "@/services/botEngine/types";
import { ActionConfigDialog, ACTION_TYPE_METADATA } from "./ActionConfigDialog";

interface ActionSequenceListProps {
  actions: BotAction[];
  onChange: (actions: BotAction[]) => void;
  title?: string;
  description?: string;
}

export function ActionSequenceList({
  actions,
  onChange,
  title = "Sequência de Ações Executadas",
  description = "Ações que o bot executará em ordem após o acionamento.",
}: ActionSequenceListProps) {
  const [editingAction, setEditingAction] = useState<BotAction | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const addAction = (type: ActionType) => {
    const meta = ACTION_TYPE_METADATA[type];
    const newAction: BotAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type,
      name: meta.label,
      order: actions.length + 1,
      config: type === "send_message" ? { color: "#10B981", description: "Mensagem do Bot" } : {},
    };
    onChange([...actions, newAction]);
    setEditingAction(newAction);
    setIsConfigOpen(true);
  };

  const removeAction = (id: string) => {
    onChange(actions.filter((a) => a.id !== id).map((a, idx) => ({ ...a, order: idx + 1 })));
  };

  const moveAction = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= actions.length) return;

    const copy = [...actions];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    onChange(copy.map((a, idx) => ({ ...a, order: idx + 1 })));
  };

  const handleSaveAction = (saved: BotAction) => {
    onChange(actions.map((a) => (a.id === saved.id ? saved : a)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            {title}
          </h4>
          <p className="text-[0.7rem] text-muted-foreground">{description}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              className="text-xs font-bold gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Ação
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-zinc-950 border-zinc-800 text-foreground">
            <DropdownMenuLabel className="text-xs font-bold text-muted-foreground">
              Escolha o Tipo de Ação
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {Object.entries(ACTION_TYPE_METADATA).map(([key, meta]) => {
              const Icon = meta.icon;
              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => addAction(key as ActionType)}
                  className="flex items-center gap-2 text-xs py-1.5 cursor-pointer hover:bg-zinc-900"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold">{meta.label}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {actions.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/40 text-center space-y-2">
          <Sparkles className="h-6 w-6 text-muted-foreground mx-auto opacity-50" />
          <p className="text-xs text-muted-foreground">
            Nenhuma ação encadeada. Clique em "Adicionar Ação" acima para montar a resposta do bot.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((act, idx) => {
            const meta = ACTION_TYPE_METADATA[act.type] || ACTION_TYPE_METADATA.send_message;
            const Icon = meta.icon;

            return (
              <div
                key={act.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Badge
                    variant="outline"
                    className="h-6 w-6 rounded-full p-0 flex items-center justify-center font-mono text-[10px] bg-zinc-950 border-zinc-800 shrink-0"
                  >
                    {idx + 1}
                  </Badge>

                  <div className={`p-1.5 rounded-lg border ${meta.color} shrink-0`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground truncate block">
                      {act.name || meta.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block font-mono">
                      {meta.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={idx === 0}
                    onClick={() => moveAction(idx, "up")}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Mover para cima"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={idx === actions.length - 1}
                    onClick={() => moveAction(idx, "down")}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Mover para baixo"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingAction(act);
                      setIsConfigOpen(true);
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                    title="Configurar ação"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAction(act.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                    title="Excluir ação"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÃO DE AÇÃO */}
      <ActionConfigDialog
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        action={editingAction}
        onSave={handleSaveAction}
      />
    </div>
  );
}
