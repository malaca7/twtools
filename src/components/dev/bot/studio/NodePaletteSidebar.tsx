import React, { useState } from "react";
import {
  MessageSquare,
  Reply,
  FileCode,
  Trash2,
  ShieldCheck,
  Globe,
  Send,
  Variable,
  Clock,
  Bell,
  Split,
  Search,
  Plus,
  GripVertical,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActionType } from "@/services/botEngine/types";

interface NodePaletteItem {
  id: string;
  type: "actionNode" | "conditionNode";
  actionType?: ActionType;
  title: string;
  description: string;
  category: "messaging" | "roles" | "logic" | "data";
  icon: any;
  color: string;
  defaultConfig?: Record<string, any>;
}

const PALETTE_ITEMS: NodePaletteItem[] = [
  // Messaging
  {
    id: "send_message",
    type: "actionNode",
    actionType: "send_message",
    title: "Enviar Mensagem",
    description: "Envia texto ou embed para um canal específico ou contexto atual",
    category: "messaging",
    icon: MessageSquare,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    defaultConfig: {
      description: "Mensagem enviada pelo bot",
      color: "#10B981",
    },
  },
  {
    id: "reply_message",
    type: "actionNode",
    actionType: "reply_message",
    title: "Responder Mensagem",
    description: "Responde diretamente à mensagem que acionou o gatilho",
    category: "messaging",
    icon: Reply,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    defaultConfig: {
      description: "Resposta direta ao usuário",
    },
  },
  {
    id: "delete_message",
    type: "actionNode",
    actionType: "delete_message",
    title: "Apagar Mensagem",
    description: "Remove a mensagem que disparou o comando ou outra específica",
    category: "messaging",
    icon: Trash2,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    defaultConfig: {},
  },

  // Roles & Members
  {
    id: "add_role",
    type: "actionNode",
    actionType: "add_role",
    title: "Adicionar Cargo",
    description: "Atribui um cargo no Discord ao autor do comando",
    category: "roles",
    icon: ShieldCheck,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    defaultConfig: {
      roleId: "",
    },
  },
  {
    id: "remove_role",
    type: "actionNode",
    actionType: "remove_role",
    title: "Remover Cargo",
    description: "Remove um cargo específico do usuário no servidor",
    category: "roles",
    icon: ShieldCheck,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    defaultConfig: {
      roleId: "",
    },
  },

  // Logic & Flow Control
  {
    id: "condition_branch",
    type: "conditionNode",
    actionType: "condition_branch",
    title: "Condição IF / ELSE",
    description: "Bifurca o fluxo em caminhos VERDADEIRO (SIM) e FALSO (SENÃO)",
    category: "logic",
    icon: Split,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    defaultConfig: {
      conditionGroups: [
        {
          id: `cg_${Date.now()}`,
          logic: "AND",
          conditions: [
            {
              id: `c_${Date.now()}`,
              field: "user.roles",
              operator: "has_role",
              value: "Membro",
            },
          ],
        },
      ],
    },
  },
  {
    id: "delay",
    type: "actionNode",
    actionType: "delay",
    title: "Aguardar (Delay)",
    description: "Pausa o fluxo por um determinado tempo em milissegundos",
    category: "logic",
    icon: Clock,
    color: "text-zinc-400 bg-zinc-800/40 border-zinc-700/40",
    defaultConfig: {
      durationMs: 1500,
    },
  },

  // Data & Integrations
  {
    id: "set_variable",
    type: "actionNode",
    actionType: "set_variable",
    title: "Definir Variável",
    description: "Salva ou atualiza uma variável na memória do bot",
    category: "data",
    icon: Variable,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    defaultConfig: {
      variableName: "meu_status",
      variableValue: "ativo",
    },
  },
  {
    id: "http_request",
    type: "actionNode",
    actionType: "http_request",
    title: "Requisição Webhook / API",
    description: "Dispara uma requisição HTTP POST/GET externa",
    category: "data",
    icon: Globe,
    color: "text-teal-400 bg-teal-500/10 border-teal-500/30",
    defaultConfig: {
      method: "POST",
      url: "https://api.exemplo.com/webhook",
      headers: { "Content-Type": "application/json" },
      body: '{"event": "discord_action"}',
    },
  },
  {
    id: "send_notification",
    type: "actionNode",
    actionType: "send_notification",
    title: "Notificação no Painel",
    description: "Envia um aviso em tempo real para o painel web da facção",
    category: "data",
    icon: Bell,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    defaultConfig: {
      title: "Notificação do Bot",
      description: "Aviso importante acionado via Discord",
    },
  },
];

interface NodePaletteSidebarProps {
  onAddNode: (item: NodePaletteItem) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function NodePaletteSidebar({ onAddNode, isOpen, onToggle }: NodePaletteSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredItems = PALETTE_ITEMS.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const onDragStart = (event: React.DragEvent, item: NodePaletteItem) => {
    event.dataTransfer.setData("application/reactflow-item", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  };

  if (!isOpen) return null;

  return (
    <aside className="w-80 border-r border-zinc-800 bg-zinc-950/95 flex flex-col h-full z-20 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
              <Layers className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-100">
              Paleta de Blocos
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-800">
            N8N / Studio
          </Badge>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar bloco ou ação..."
            className="pl-8 h-8 text-xs bg-zinc-900/90 border-zinc-800 text-zinc-200 placeholder:text-zinc-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 no-scrollbar text-[10px]">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
              selectedCategory === "all"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedCategory("messaging")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
              selectedCategory === "messaging"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Discord
          </button>
          <button
            onClick={() => setSelectedCategory("logic")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
              selectedCategory === "logic"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Lógica
          </button>
          <button
            onClick={() => setSelectedCategory("roles")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
              selectedCategory === "roles"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Cargos
          </button>
          <button
            onClick={() => setSelectedCategory("data")}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
              selectedCategory === "data"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Webhooks
          </button>
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
          Arraste para a tela ou clique no (+) para adicionar
        </div>

        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => onDragStart(e, item)}
              className="p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing group shadow-sm flex items-start justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`p-2 rounded-lg border shrink-0 ${item.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-tight line-clamp-2 pt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => onAddNode(item)}
                className="h-7 w-7 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg shrink-0"
                title="Inserir nó no fluxo"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-zinc-500 text-xs">
            Nenhum bloco encontrado para &quot;{searchTerm}&quot;
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40 text-[11px] text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-zinc-400">
          <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
          Conecte nós puxando pelas bolinhas
        </span>
      </div>
    </aside>
  );
}
