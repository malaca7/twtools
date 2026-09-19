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
  X,
  Maximize2,
  Minimize2,
  Sliders,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActionType } from "@/services/botEngine/types";
import { cn } from "@/lib/utils";

export interface NodePaletteItem {
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

export const PALETTE_ITEMS: NodePaletteItem[] = [
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

  // Logic & Conditions
  {
    id: "condition_branch",
    type: "conditionNode",
    title: "Bifurcação SE / SENÃO",
    description: "Divide o fluxo em caminhos VERDADEIRO e FALSO de acordo com regras",
    category: "logic",
    icon: Split,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    defaultConfig: {
      conditionType: "role",
      operator: "equals",
      value: "",
    },
  },
  {
    id: "wait_delay",
    type: "actionNode",
    actionType: "wait_delay",
    title: "Aguardar (Delay)",
    description: "Pausa a execução do fluxo por um intervalo determinado em segundos",
    category: "logic",
    icon: Clock,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    defaultConfig: {
      seconds: 5,
    },
  },

  // Data & Webhooks
  {
    id: "webhook_call",
    type: "actionNode",
    actionType: "webhook_call",
    title: "Disparar Webhook HTTP",
    description: "Envia requisição POST/GET externa com payload dinâmico",
    category: "data",
    icon: Globe,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    defaultConfig: {
      url: "https://",
      method: "POST",
      body: "{}",
    },
  },
  {
    id: "custom_code",
    type: "actionNode",
    actionType: "custom_code",
    title: "Script JavaScript",
    description: "Executa código personalizado com variáveis de contexto da mensagem",
    category: "data",
    icon: FileCode,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    defaultConfig: {
      code: "// Contexto: message, author, guild, args\nreturn { success: true };",
    },
  },
  {
    id: "set_variable",
    type: "actionNode",
    actionType: "set_variable",
    title: "Gravar Variável",
    description: "Armazena dados temporários ou persistentes no contexto do bot",
    category: "data",
    icon: Variable,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    defaultConfig: {
      variableName: "",
      variableValue: "",
    },
  },
];

interface NodePaletteSidebarProps {
  onAddNode: (item: NodePaletteItem) => void;
  isOpen: boolean;
  onToggle: () => void;
  width?: number;
  onWidthPreset?: (width: number) => void;
  isMobile?: boolean;
  mobileHeight?: number;
  onMobileHeightPreset?: (heightVh: number) => void;
  onCloseMobile?: () => void;
}

export function NodePaletteSidebar({
  onAddNode,
  isOpen,
  onToggle,
  width = 300,
  onWidthPreset,
  isMobile = false,
  mobileHeight = 55,
  onMobileHeightPreset,
  onCloseMobile,
}: NodePaletteSidebarProps) {
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

  // Render for Mobile as Bottom Sheet / Responsive Drawer
  if (isMobile) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-zinc-950/98 border-t border-zinc-800 rounded-t-2xl shadow-2xl backdrop-blur-xl transition-all duration-200">
        {/* Mobile Top Header with Drag Handle & Presets */}
        <div className="p-3 border-b border-zinc-800/80 flex flex-col gap-2">
          {/* Top Center Grab Pill */}
          <div className="mx-auto w-12 h-1.5 rounded-full bg-zinc-700/80 mb-0.5" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-100">Paleta de Blocos</span>
                <p className="text-[10px] text-zinc-400">Toque em (+) para inserir no fluxo</p>
              </div>
            </div>

            {/* Height Presets & Close Button */}
            <div className="flex items-center gap-1.5">
              {onMobileHeightPreset && (
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                  <button
                    onClick={() => onMobileHeightPreset(40)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors",
                      mobileHeight <= 45 ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
                    )}
                    title="Altura compacta"
                  >
                    40%
                  </button>
                  <button
                    onClick={() => onMobileHeightPreset(60)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors",
                      mobileHeight > 45 && mobileHeight <= 70 ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
                    )}
                    title="Altura média"
                  >
                    60%
                  </button>
                  <button
                    onClick={() => onMobileHeightPreset(85)}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors",
                      mobileHeight > 70 ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
                    )}
                    title="Altura máxima"
                  >
                    85%
                  </button>
                </div>
              )}

              <Button
                size="icon"
                variant="ghost"
                onClick={onCloseMobile || onToggle}
                className="h-7 w-7 text-zinc-400 hover:text-white rounded-lg border border-zinc-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar bloco ou ação..."
              className="pl-8 h-8 text-xs bg-zinc-900/90 border-zinc-800 text-zinc-200 placeholder:text-zinc-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
            {["all", "messaging", "logic", "roles", "data"].map((cat) => {
              const label =
                cat === "all"
                  ? "Todos"
                  : cat === "messaging"
                  ? "Discord"
                  : cat === "logic"
                  ? "Lógica"
                  : cat === "roles"
                  ? "Cargos"
                  : "Webhooks";
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Item List */}
        <div
          style={{ maxHeight: `calc(${mobileHeight}vh - 140px)` }}
          className="overflow-y-auto p-3 space-y-2"
        >
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 active:bg-zinc-900 transition-all flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg border shrink-0 ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-100 truncate">{item.title}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{item.description}</div>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => onAddNode(item)}
                  className="h-7 px-2.5 text-xs bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg shrink-0 gap-1 font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Inserir</span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render for Desktop as Resizable Sidebar
  return (
    <aside
      style={{ width: `${width}px` }}
      className="border-r border-zinc-800 bg-zinc-950/95 flex flex-col h-full z-20 shadow-2xl backdrop-blur-md relative shrink-0 transition-[width] duration-75"
    >
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
              <Layers className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-100">
              Paleta de Blocos
            </span>
          </div>

          {/* Width Presets & Dimension Badge */}
          <div className="flex items-center gap-1.5">
            {onWidthPreset && (
              <div className="hidden sm:flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
                <button
                  onClick={() => onWidthPreset(240)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors",
                    width <= 260 ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
                  )}
                  title="Largura compacta (240px)"
                >
                  240
                </button>
                <button
                  onClick={() => onWidthPreset(300)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors",
                    width > 260 && width <= 360 ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
                  )}
                  title="Largura padrão (300px)"
                >
                  300
                </button>
                <button
                  onClick={() => onWidthPreset(420)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors",
                    width > 360 ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
                  )}
                  title="Largura ampla (420px)"
                >
                  420
                </button>
              </div>
            )}

            <Button
              size="icon"
              variant="ghost"
              onClick={onToggle}
              className="h-6 w-6 text-zinc-400 hover:text-white rounded"
              title="Recolher barra lateral"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
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
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-2 py-0.5 rounded font-semibold transition-all shrink-0 ${
              selectedCategory === "all"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedCategory("messaging")}
            className={`px-2 py-0.5 rounded font-semibold transition-all shrink-0 ${
              selectedCategory === "messaging"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Discord
          </button>
          <button
            onClick={() => setSelectedCategory("logic")}
            className={`px-2 py-0.5 rounded font-semibold transition-all shrink-0 ${
              selectedCategory === "logic"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Lógica
          </button>
          <button
            onClick={() => setSelectedCategory("roles")}
            className={`px-2 py-0.5 rounded font-semibold transition-all shrink-0 ${
              selectedCategory === "roles"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            Cargos
          </button>
          <button
            onClick={() => setSelectedCategory("data")}
            className={`px-2 py-0.5 rounded font-semibold transition-all shrink-0 ${
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
      <div className="p-2.5 border-t border-zinc-800/80 bg-zinc-900/40 text-[11px] text-zinc-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
          <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
          Conecte nós puxando pelas bolinhas
        </span>
        <span className="text-[10px] font-mono text-zinc-500">{Math.round(width)}px</span>
      </div>
    </aside>
  );
}
