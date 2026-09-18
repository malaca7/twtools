import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";

import { TriggerNode } from "./nodes/TriggerNode";
import { ActionNode } from "./nodes/ActionNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { NodePaletteSidebar } from "./NodePaletteSidebar";
import { NodeConfigDrawer } from "./NodeConfigDrawer";
import { StudioToolbar } from "./StudioToolbar";
import { Sliders, Split } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CommandParametersEditor } from "../CommandParametersEditor";
import { ConditionGroupEditor } from "../ConditionGroupEditor";

import {
  commandToFlow,
  eventToFlow,
  flowToActions,
  FlowNodeData,
  getActionDefaultLabel,
} from "./flowUtils";

import type { BotCommand, BotEvent, ActionType, CommandParameter, ConditionGroup } from "@/services/botEngine/types";

const nodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
};

interface BotStudioProps {
  mode: "command" | "event";
  initialCommand?: BotCommand;
  initialEvent?: BotEvent;
  botPrefix?: string;
  onSaveCommand?: (command: BotCommand) => void;
  onSaveEvent?: (event: BotEvent) => void;
  onBack: () => void;
}

export function BotStudio(props: BotStudioProps) {
  return (
    <ReactFlowProvider>
      <BotStudioInner {...props} />
    </ReactFlowProvider>
  );
}

function BotStudioInner({
  mode,
  initialCommand,
  initialEvent,
  botPrefix = "!",
  onSaveCommand,
  onSaveEvent,
  onBack,
}: BotStudioProps) {
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Status enabled do comando/evento
  const [enabled, setEnabled] = useState<boolean>(
    mode === "command" ? initialCommand?.enabled ?? true : initialEvent?.enabled ?? true
  );

  // Inicializa nós e arestas a partir do comando ou evento existente
  const initialFlow = useMemo(() => {
    if (mode === "command" && initialCommand) {
      return commandToFlow(initialCommand, botPrefix);
    }
    if (mode === "event" && initialEvent) {
      return eventToFlow(initialEvent);
    }
    // Fallback vazio
    return {
      nodes: [
        {
          id: "trigger_node",
          type: "triggerNode",
          position: { x: 80, y: 220 },
          data: {
            label: mode === "command" ? `Comando: ${botPrefix}novo` : "Evento: message_create",
            sublabel: "Gatilho de entrada do fluxo",
            isTrigger: true,
            category: "trigger",
            prefix: botPrefix,
            commandName: "novo",
            parameters: [],
            conditions: [],
            enabled: true,
          },
        },
      ],
      edges: [],
    };
  }, [mode, initialCommand, initialEvent, botPrefix]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>(initialFlow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialFlow.edges);

  // UI state
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isParametersModalOpen, setIsParametersModalOpen] = useState(false);
  const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);

  // Nó selecionado atual
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const triggerNode = useMemo(() => nodes.find((n) => n.data.isTrigger) || null, [nodes]);
  const currentParameters = useMemo(() => triggerNode?.data.parameters || [], [triggerNode]);
  const currentConditions = useMemo(() => triggerNode?.data.conditions || [], [triggerNode]);

  const handleUpdateTriggerParameters = (newParams: CommandParameter[]) => {
    if (!triggerNode) return;
    handleUpdateNodeData(triggerNode.id, { parameters: newParams });
  };

  const handleUpdateTriggerConditions = (newConditions: ConditionGroup[]) => {
    if (!triggerNode) return;
    handleUpdateNodeData(triggerNode.id, { conditions: newConditions });
  };

  // Conexão entre nós (arestas)
  const onConnect = useCallback(
    (connection: Connection) => {
      const isConditionSource = nodes.find((n) => n.id === connection.source)?.data.isCondition;
      const strokeColor =
        connection.sourceHandle === "false"
          ? "#f43f5e"
          : connection.sourceHandle === "true"
          ? "#10b981"
          : isConditionSource
          ? "#f59e0b"
          : "#8b5cf6";

      const newEdge: Edge = {
        ...connection,
        id: `edge_${connection.source}_${connection.sourceHandle || "default"}_to_${connection.target}`,
        animated: true,
        style: { stroke: strokeColor, strokeWidth: 2.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 16,
          height: 16,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
      toast.success("Nós conectados com sucesso!");
    },
    [nodes, setEdges]
  );

  // Seleção de nós
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Drag & Drop da Sidebar para o Canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData("application/reactflow-item");
      if (!rawData) return;

      try {
        const item = JSON.parse(rawData);
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNodeId = `node_${item.actionType || "act"}_${Date.now()}`;
        const isCondition = item.type === "conditionNode";

        const newNode: Node<FlowNodeData> = {
          id: newNodeId,
          type: item.type,
          position,
          data: {
            label: item.title,
            sublabel: item.description,
            actionType: item.actionType as ActionType,
            category: item.category,
            isCondition,
            config: item.defaultConfig || {},
            status: "idle",
          },
        };

        setNodes((nds) => [...nds, newNode]);
        setSelectedNodeId(newNodeId);

        // Se houver um nó selecionado anteriormente, conecta automaticamente
        if (selectedNodeId) {
          const strokeColor = isCondition ? "#f59e0b" : "#8b5cf6";
          setEdges((eds) =>
            addEdge(
              {
                id: `edge_${selectedNodeId}_to_${newNodeId}`,
                source: selectedNodeId,
                target: newNodeId,
                animated: true,
                style: { stroke: strokeColor, strokeWidth: 2 },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: strokeColor,
                  width: 14,
                  height: 14,
                },
              },
              eds
            )
          );
        }

        toast.success(`Bloco "${item.title}" adicionado ao fluxo!`);
      } catch (err) {
        console.error("Falha ao soltar elemento no fluxo:", err);
      }
    },
    [reactFlowInstance, selectedNodeId, setNodes, setEdges]
  );

  // Adição direta por clique na Sidebar
  const handleAddNodeFromPalette = (item: any) => {
    // Posiciona à direita do último nó
    const lastNode = nodes[nodes.length - 1];
    const posX = lastNode ? lastNode.position.x + 320 : 400;
    const posY = lastNode ? lastNode.position.y : 220;

    const newNodeId = `node_${item.actionType || "act"}_${Date.now()}`;
    const isCondition = item.type === "conditionNode";

    const newNode: Node<FlowNodeData> = {
      id: newNodeId,
      type: item.type,
      position: { x: posX, y: posY },
      data: {
        label: item.title,
        sublabel: item.description,
        actionType: item.actionType as ActionType,
        category: item.category,
        isCondition,
        config: item.defaultConfig || {},
        status: "idle",
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newNodeId);

    // Conecta automaticamente ao nó anterior se houver
    const sourceNode = selectedNode || lastNode;
    if (sourceNode) {
      const strokeColor = isCondition ? "#f59e0b" : "#8b5cf6";
      setEdges((eds) =>
        addEdge(
          {
            id: `edge_${sourceNode.id}_to_${newNodeId}`,
            source: sourceNode.id,
            target: newNodeId,
            animated: true,
            style: { stroke: strokeColor, strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: strokeColor,
              width: 14,
              height: 14,
            },
          },
          eds
        )
      );
    }

    toast.success(`Bloco "${item.title}" inserido!`);
  };

  // Atualização dos dados do nó selecionado
  const handleUpdateNodeData = (nodeId: string, newData: Partial<FlowNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              ...newData,
              config: newData.config ? { ...n.data.config, ...newData.config } : n.data.config,
            },
          };
        }
        return n;
      })
    );
  };

  // Exclusão de nó
  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
    toast.success("Bloco removido do fluxo.");
  };

  // Auto layout simples para organizar em fila/árvore
  const handleAutoLayout = () => {
    let currentX = 80;
    const startY = 220;

    setNodes((nds) =>
      nds.map((n, idx) => {
        if (n.data.isTrigger) {
          return { ...n, position: { x: 80, y: startY } };
        }
        currentX += 320;
        return { ...n, position: { x: currentX, y: startY } };
      })
    );
    toast.success("Fluxo organizado automaticamente!");
  };

  // Salvar no Bot
  const handleSave = () => {
    const actions = flowToActions(nodes, edges);
    const triggerNode = nodes.find((n) => n.data.isTrigger);

    if (mode === "command") {
      const cmdName =
        triggerNode?.data.commandName ||
        initialCommand?.name ||
        "comando_" + Math.random().toString(36).slice(2, 6);
      const cmdPrefix = triggerNode?.data.prefix || initialCommand?.prefix || botPrefix;
      const cmdDescription = triggerNode?.data.sublabel || initialCommand?.description || "";
      const parameters = triggerNode?.data.parameters || initialCommand?.parameters || [];

      const updatedCommand: BotCommand = {
        id: initialCommand?.id || `cmd_${Date.now()}`,
        botId: initialCommand?.botId || "bot_default",
        name: cmdName,
        prefix: cmdPrefix,
        description: cmdDescription,
        enabled,
        parameters,
        conditions: triggerNode?.data.conditions || initialCommand?.conditions || [],
        actions,
        createdAt: initialCommand?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (onSaveCommand) {
        onSaveCommand(updatedCommand);
      }
      toast.success(`Comando "${cmdPrefix}${cmdName}" salvo com sucesso via Studio!`);
    } else {
      const triggerType = triggerNode?.data.triggerType || initialEvent?.triggerType || "message_create";
      const evtName =
        triggerNode?.data.label || initialEvent?.name || `Evento ${triggerType}`;
      const evtDesc = triggerNode?.data.sublabel || initialEvent?.description || "";

      const updatedEvent: BotEvent = {
        id: initialEvent?.id || `evt_${Date.now()}`,
        botId: initialEvent?.botId || "bot_default",
        name: evtName,
        triggerType,
        description: evtDesc,
        enabled,
        conditions: triggerNode?.data.conditions || initialEvent?.conditions || [],
        actions,
        createdAt: initialEvent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (onSaveEvent) {
        onSaveEvent(updatedEvent);
      }
      toast.success(`Evento "${evtName}" salvo com sucesso via Studio!`);
    }

    onBack();
  };

  // Simulação / Teste do Fluxo em Tempo Real
  const handleRunTest = async () => {
    setIsTesting(true);
    toast.info("Iniciando simulação do fluxo...");

    // Reseta status de todos os nós
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: "idle" } })));

    // Ordenação simples de nós por arestas a partir do gatilho
    const triggerNode = nodes.find((n) => n.data.isTrigger);
    if (!triggerNode) {
      toast.error("Gatilho inicial não encontrado!");
      setIsTesting(false);
      return;
    }

    const executionQueue: string[] = [triggerNode.id];
    const visited = new Set<string>();

    while (executionQueue.length > 0) {
      const currId = executionQueue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      // Marca como running
      setNodes((nds) =>
        nds.map((n) => (n.id === currId ? { ...n, data: { ...n.data, status: "running" } } : n))
      );

      // Delay visual de execução (500ms)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Marca como success
      setNodes((nds) =>
        nds.map((n) => (n.id === currId ? { ...n, data: { ...n.data, status: "success" } } : n))
      );

      // Pega os próximos nós conectados
      const nextEdges = edges.filter((e) => e.source === currId);
      for (const edge of nextEdges) {
        if (!visited.has(edge.target)) {
          executionQueue.push(edge.target);
        }
      }
    }

    setIsTesting(false);
    toast.success("Simulação de fluxo concluída com sucesso! Todos os blocos responderam.");

    // Reseta status para idle após 4 segundos
    setTimeout(() => {
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, status: "idle" } })));
    }, 4000);
  };

  const studioTitle =
    mode === "command"
      ? `${triggerNode?.data.prefix || botPrefix}${triggerNode?.data.commandName || initialCommand?.name || "novo_comando"}`
      : triggerNode?.data.label || initialEvent?.name || "Novo Evento";

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[680px] w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl relative">
      {/* Top Studio Toolbar */}
      <StudioToolbar
        title={studioTitle}
        subTitle={triggerNode?.data.sublabel}
        isCommand={mode === "command"}
        isEvent={mode === "event"}
        enabled={enabled}
        onToggleEnabled={setEnabled}
        onBack={onBack}
        onSave={handleSave}
        onRunTest={handleRunTest}
        isTesting={isTesting}
        onTogglePalette={() => setIsPaletteOpen((prev) => !prev)}
        isPaletteOpen={isPaletteOpen}
        onAutoLayout={handleAutoLayout}
        onOpenParameters={() => setIsParametersModalOpen(true)}
        parametersCount={currentParameters.length}
        onOpenConditions={() => setIsConditionsModalOpen(true)}
        conditionsCount={currentConditions.length}
      />

      {/* Main Studio Body (Palette + Canvas + Config Drawer) */}
      <div className="flex-1 flex overflow-hidden relative" ref={reactFlowWrapper}>
        {/* Left Palette Sidebar */}
        <NodePaletteSidebar
          isOpen={isPaletteOpen}
          onToggle={() => setIsPaletteOpen((prev) => !prev)}
          onAddNode={handleAddNodeFromPalette}
        />

        {/* Center Canvas */}
        <div className="flex-1 h-full w-full relative bg-zinc-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: "#8b5cf6", strokeWidth: 2 },
            }}
            proOptions={{ hideAttribution: true }}
            className="tw-flow-canvas"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={18}
              size={1.5}
              color="#27272a"
              className="bg-zinc-950"
            />
            <Controls
              className="!bg-zinc-900 !border !border-zinc-800 !rounded-xl !shadow-xl !fill-zinc-300"
              showInteractive={false}
            />
            <MiniMap
              nodeColor={(node) => {
                if (node.data?.isTrigger) return "#10b981";
                if (node.data?.isCondition) return "#f59e0b";
                return "#8b5cf6";
              }}
              maskColor="rgba(9, 9, 11, 0.75)"
              className="!bg-zinc-950 !border !border-zinc-800 !rounded-xl overflow-hidden !shadow-2xl"
            />
          </ReactFlow>

          {/* Quick Add Floating Button if palette is closed */}
          {!isPaletteOpen && (
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="absolute top-4 left-4 z-10 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-2 hover:border-zinc-700"
            >
              <span>+ Adicionar Bloco</span>
            </button>
          )}
        </div>

        {/* Right Node Config Drawer */}
        {selectedNode && (
          <NodeConfigDrawer
            selectedNode={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onUpdateNodeData={handleUpdateNodeData}
            onDeleteNode={handleDeleteNode}
          />
        )}
      </div>

      {/* Modal Dedicado de Parâmetros / Argumentos no Studio */}
      <Dialog open={isParametersModalOpen} onOpenChange={setIsParametersModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-400" />
              Parâmetros / Argumentos do Comando ({triggerNode?.data.commandName || initialCommand?.name || "comando"})
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Configure os parâmetros e argumentos esperados na chamada deste comando no Discord.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <CommandParametersEditor
              parameters={currentParameters}
              onChange={handleUpdateTriggerParameters}
              commandPrefix={triggerNode?.data.prefix || botPrefix}
              commandName={triggerNode?.data.commandName || initialCommand?.name || "comando"}
            />
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsParametersModalOpen(false)}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
            >
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dedicado de Condições & Regras (SE / ENTÃO) no Studio */}
      <Dialog open={isConditionsModalOpen} onOpenChange={setIsConditionsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Split className="h-4 w-4 text-violet-400" />
              Condições & Regras de Execução (SE / ENTÃO)
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Defina as regras e permissões para a execução desta automação no Discord.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <ConditionGroupEditor
              groups={currentConditions}
              onChange={handleUpdateTriggerConditions}
            />
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsConditionsModalOpen(false)}
              className="text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl"
            >
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
