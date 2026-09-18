import type { Node, Edge } from "@xyflow/react";
import type {
  BotCommand,
  BotEvent,
  BotAction,
  ActionType,
  ConditionGroup,
  EventTriggerType,
  CommandParameter,
} from "@/services/botEngine/types";

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  sublabel?: string;
  iconType?: string;
  category?: "trigger" | "action" | "condition" | "logic" | "data";
  actionType?: ActionType;
  triggerType?: EventTriggerType;
  isTrigger?: boolean;
  isCondition?: boolean;
  config?: Record<string, any>;
  parameters?: CommandParameter[];
  conditions?: ConditionGroup[];
  guildId?: string;
  prefix?: string;
  commandName?: string;
  enabled?: boolean;
  status?: "idle" | "running" | "success" | "error";
  errorMsg?: string;
}

/**
 * Converte um BotCommand para o formato de Nós e Arestas do Studio React Flow
 */
export function commandToFlow(
  command: BotCommand,
  botPrefix: string = "!"
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];

  const triggerId = "trigger_node";
  const cleanName = (command.name || "comando").toLowerCase().replace(/^[!/]/, "");
  nodes.push({
    id: triggerId,
    type: "triggerNode",
    position: { x: 60, y: 220 },
    data: {
      label: `Slash Command: /${cleanName}`,
      sublabel: command.description || "Gatilho Slash Command oficial do Discord (/)",
      isTrigger: true,
      category: "trigger",
      prefix: "/",
      commandName: cleanName,
      guildId: command.guildId || "all",
      parameters: command.parameters || [],
      conditions: command.conditions || [],
      enabled: command.enabled,
    },
  });

  let prevNodeId = triggerId;
  let currentX = 400;
  let currentY = 220;

  // Processa ações recursivamente ou em sequência
  const processActions = (
    actions: BotAction[],
    parentId: string,
    startX: number,
    startY: number,
    sourceHandle?: string
  ) => {
    let lastId = parentId;
    let x = startX;

    actions.forEach((act, idx) => {
      const nodeId = act.id || `node_act_${idx}_${Date.now()}`;
      const isCondition = act.type === "condition_branch";

      nodes.push({
        id: nodeId,
        type: isCondition ? "conditionNode" : "actionNode",
        position: { x, y: startY },
        data: {
          label: act.name || getActionDefaultLabel(act.type),
          sublabel: getActionSublabel(act),
          actionType: act.type,
          isCondition,
          category: isCondition ? "condition" : "action",
          config: act.config || {},
        },
      });

      // Cria a aresta conectando ao nó anterior
      edges.push({
        id: `edge_${lastId}_to_${nodeId}`,
        source: lastId,
        target: nodeId,
        sourceHandle: sourceHandle || undefined,
        animated: true,
        style: { stroke: isCondition ? "#f59e0b" : "#8b5cf6", strokeWidth: 2 },
      });

      lastId = nodeId;
      x += 320;

      // Se for ramo condicional, processa thenActions e elseActions
      if (isCondition) {
        if (act.thenActions && act.thenActions.length > 0) {
          processActions(act.thenActions, nodeId, x, startY - 140, "true");
        }
        if (act.elseActions && act.elseActions.length > 0) {
          processActions(act.elseActions, nodeId, x, startY + 140, "false");
        }
      }
    });
  };

  if (command.actions && command.actions.length > 0) {
    processActions(command.actions, prevNodeId, currentX, currentY);
  } else {
    // Adiciona uma ação padrão inicial para guiar o usuário
    const initialActId = `act_${Date.now()}`;
    nodes.push({
      id: initialActId,
      type: "actionNode",
      position: { x: currentX, y: currentY },
      data: {
        label: "Enviar Mensagem Discord",
        sublabel: "Resposta padrão do comando",
        actionType: "send_message",
        category: "action",
        config: {
          description: "Olá {{user.name}}! O comando foi executado com sucesso.",
          color: "#10B981",
        },
      },
    });
    edges.push({
      id: `edge_${triggerId}_to_${initialActId}`,
      source: triggerId,
      target: initialActId,
      animated: true,
      style: { stroke: "#8b5cf6", strokeWidth: 2 },
    });
  }

  return { nodes, edges };
}

/**
 * Converte um BotEvent para o formato de Nós e Arestas do Studio React Flow
 */
export function eventToFlow(
  event: BotEvent
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];

  const triggerId = "trigger_node";
  nodes.push({
    id: triggerId,
    type: "triggerNode",
    position: { x: 60, y: 220 },
    data: {
      label: `Evento: ${getEventTriggerLabel(event.triggerType)}`,
      sublabel: event.description || "Gatilho disparado automaticamente pelo Discord",
      isTrigger: true,
      category: "trigger",
      triggerType: event.triggerType,
      guildId: event.guildId || "all",
      conditions: event.conditions || [],
      enabled: event.enabled,
    },
  });

  let currentX = 400;
  let currentY = 220;

  const processActions = (
    actions: BotAction[],
    parentId: string,
    startX: number,
    startY: number,
    sourceHandle?: string
  ) => {
    let lastId = parentId;
    let x = startX;

    actions.forEach((act, idx) => {
      const nodeId = act.id || `node_act_${idx}_${Date.now()}`;
      const isCondition = act.type === "condition_branch";

      nodes.push({
        id: nodeId,
        type: isCondition ? "conditionNode" : "actionNode",
        position: { x, y: startY },
        data: {
          label: act.name || getActionDefaultLabel(act.type),
          sublabel: getActionSublabel(act),
          actionType: act.type,
          isCondition,
          category: isCondition ? "condition" : "action",
          config: act.config || {},
        },
      });

      edges.push({
        id: `edge_${lastId}_to_${nodeId}`,
        source: lastId,
        target: nodeId,
        sourceHandle: sourceHandle || undefined,
        animated: true,
        style: { stroke: isCondition ? "#f59e0b" : "#8b5cf6", strokeWidth: 2 },
      });

      lastId = nodeId;
      x += 320;

      if (isCondition) {
        if (act.thenActions && act.thenActions.length > 0) {
          processActions(act.thenActions, nodeId, x, startY - 140, "true");
        }
        if (act.elseActions && act.elseActions.length > 0) {
          processActions(act.elseActions, nodeId, x, startY + 140, "false");
        }
      }
    });
  };

  if (event.actions && event.actions.length > 0) {
    processActions(event.actions, triggerId, currentX, currentY);
  } else {
    const initialActId = `act_${Date.now()}`;
    nodes.push({
      id: initialActId,
      type: "actionNode",
      position: { x: currentX, y: currentY },
      data: {
        label: "Enviar Mensagem de Boas-vindas",
        sublabel: "Ação executada ao disparar o evento",
        actionType: "send_message",
        category: "action",
        config: {
          description: "Bem-vindo ao servidor, {{user.name}}!",
          color: "#8B5CF6",
        },
      },
    });
    edges.push({
      id: `edge_${triggerId}_to_${initialActId}`,
      source: triggerId,
      target: initialActId,
      animated: true,
      style: { stroke: "#8b5cf6", strokeWidth: 2 },
    });
  }

  return { nodes, edges };
}

/**
 * Converte o grafo de nós e arestas de volta para uma lista sequencial de BotAction
 */
export function flowToActions(nodes: Node<FlowNodeData>[], edges: Edge[]): BotAction[] {
  const triggerNode = nodes.find((n) => n.data.isTrigger);
  if (!triggerNode) return [];

  // Mapeia conexões de saída: sourceId -> targetId[]
  const outgoingMap: Record<string, { targetId: string; sourceHandle?: string }[]> = {};
  edges.forEach((edge) => {
    if (!outgoingMap[edge.source]) {
      outgoingMap[edge.source] = [];
    }
    outgoingMap[edge.source].push({
      targetId: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
    });
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();

  const traverse = (nodeId: string): BotAction[] => {
    const connections = outgoingMap[nodeId] || [];
    const actions: BotAction[] = [];

    connections.forEach(({ targetId, sourceHandle }, index) => {
      if (visited.has(targetId)) return;
      visited.add(targetId);

      const targetNode = nodeMap.get(targetId);
      if (!targetNode || targetNode.data.isTrigger) return;

      const actType = (targetNode.data.actionType as ActionType) || "send_message";
      const isCondition = targetNode.data.isCondition || actType === "condition_branch";

      const actionItem: BotAction = {
        id: targetNode.id,
        type: actType,
        name: (targetNode.data.label as string) || getActionDefaultLabel(actType),
        order: actions.length + 1,
        config: (targetNode.data.config as Record<string, any>) || {},
      };

      if (isCondition) {
        // Encontra conexões com handle "true" e "false"
        const condConnections = outgoingMap[targetNode.id] || [];
        const trueTarget = condConnections.find((c) => c.sourceHandle === "true" || !c.sourceHandle);
        const falseTarget = condConnections.find((c) => c.sourceHandle === "false");

        if (trueTarget) {
          actionItem.thenActions = traverse(trueTarget.targetId);
        }
        if (falseTarget) {
          actionItem.elseActions = traverse(falseTarget.targetId);
        }
      } else {
        // Ação linear comum: continua a travessia
        const nextActions = traverse(targetNode.id);
        actions.push(actionItem);
        actions.push(...nextActions);
        return;
      }

      actions.push(actionItem);
    });

    return actions;
  };

  return traverse(triggerNode.id);
}

/**
 * Labels padrão legíveis para Ações
 */
export function getActionDefaultLabel(type: ActionType): string {
  switch (type) {
    case "send_message":
      return "Enviar Mensagem";
    case "reply_message":
      return "Responder Mensagem";
    case "add_role":
      return "Adicionar Cargo Discord";
    case "remove_role":
      return "Remover Cargo Discord";
    case "set_variable":
      return "Definir Variável";
    case "condition_branch":
      return "Condição Se / Senão (IF)";
    case "http_request":
      return "Requisição HTTP / Webhook";
    case "execute_webhook":
      return "Disparar Webhook TW";
    case "delay":
      return "Aguardar (Delay)";
    case "delete_message":
      return "Apagar Mensagem";
    case "database_insert":
      return "Inserir no Banco de Dados";
    case "database_update":
      return "Atualizar no Banco de Dados";
    case "log_audit":
      return "Registrar Log de Auditoria";
    default:
      return "Ação Discord";
  }
}

export function getActionSublabel(act: BotAction): string {
  if (act.type === "send_message") {
    return act.config?.title || act.config?.description?.slice(0, 32) || "Mensagem ou embed";
  }
  if (act.type === "add_role" || act.type === "remove_role") {
    return act.config?.roleId ? `Cargo ID: ${act.config.roleId}` : "Selecionar cargo";
  }
  if (act.type === "http_request") {
    return act.config?.url ? `${act.config.method || "POST"} ${act.config.url.slice(0, 24)}` : "Webhook HTTP";
  }
  if (act.type === "condition_branch") {
    return "Avalia regras e bifurca fluxo";
  }
  return act.type;
}

export function getEventTriggerLabel(type: EventTriggerType): string {
  switch (type) {
    case "message_create":
      return "Mensagem Enviada no Servidor";
    case "member_join":
      return "Novo Membro Entrou no Servidor";
    case "member_leave":
      return "Membro Saiu do Servidor";
    case "command_ran":
      return "Comando Executado";
    case "bot_ready":
      return "Bot Conectado / Online";
    case "webhook_received":
      return "Webhook Externo Recebido";
    default:
      return "Gatilho de Evento";
  }
}
