import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
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
  Layers,
  CheckCircle2,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import type { ActionType } from "@/services/botEngine/types";
import type { FlowNodeData } from "../flowUtils";

const ACTION_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  send_message: {
    icon: MessageSquare,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
  },
  reply_message: {
    icon: Reply,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/40",
  },
  edit_message: {
    icon: FileCode,
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/40",
  },
  delete_message: {
    icon: Trash2,
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
  },
  add_role: {
    icon: ShieldCheck,
    color: "text-purple-400",
    bg: "bg-purple-500/15",
    border: "border-purple-500/40",
  },
  remove_role: {
    icon: ShieldCheck,
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
  },
  http_request: {
    icon: Globe,
    color: "text-teal-400",
    bg: "bg-teal-500/15",
    border: "border-teal-500/40",
  },
  execute_webhook: {
    icon: Send,
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    border: "border-violet-500/40",
  },
  set_variable: {
    icon: Variable,
    color: "text-pink-400",
    bg: "bg-pink-500/15",
    border: "border-pink-500/40",
  },
  delay: {
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
  },
  send_notification: {
    icon: Bell,
    color: "text-yellow-400",
    bg: "bg-yellow-500/15",
    border: "border-yellow-500/40",
  },
  default: {
    icon: Layers,
    color: "text-indigo-400",
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/40",
  },
};

export const ActionNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as FlowNodeData;
  const actType = (nodeData.actionType as string) || "send_message";
  const visual = ACTION_ICONS[actType] || ACTION_ICONS.default;
  const Icon = visual.icon;

  const getBorderClass = () => {
    if (selected) {
      return "ring-2 ring-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.4)] border-violet-500";
    }
    if (nodeData.status === "running") {
      return "ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] border-yellow-500";
    }
    if (nodeData.status === "error") {
      return "ring-2 ring-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] border-rose-500";
    }
    return "border-zinc-800 hover:border-zinc-700/80";
  };

  const getConfigSummary = () => {
    const cfg = nodeData.config || {};
    if (actType === "send_message" || actType === "reply_message") {
      if (cfg.title) return `Embed: ${cfg.title}`;
      if (cfg.description) return cfg.description.slice(0, 45) + (cfg.description.length > 45 ? "..." : "");
      return "Mensagem ou embed";
    }
    if (actType === "add_role" || actType === "remove_role") {
      return cfg.roleId ? `Cargo ID: ${cfg.roleId}` : "Cargo não definido";
    }
    if (actType === "http_request") {
      return cfg.url ? `${cfg.method || "POST"} ${cfg.url.slice(0, 26)}...` : "Webhook HTTP";
    }
    if (actType === "set_variable") {
      return cfg.variableName ? `${cfg.variableName} = ${cfg.variableValue || "''"}` : "Variável";
    }
    if (actType === "delay") {
      return `${cfg.durationMs || 1000}ms de espera`;
    }
    return nodeData.sublabel || actType;
  };

  return (
    <div
      className={`min-w-[240px] max-w-[300px] rounded-xl bg-zinc-950/95 border backdrop-blur-md shadow-xl transition-all duration-200 group ${getBorderClass()}`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-zinc-950 !-left-1.5 hover:!scale-125 transition-transform"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-gradient-to-r from-zinc-900/90 to-zinc-950/90 border-b border-zinc-800/80 rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg border ${visual.bg} ${visual.border}`}>
            <Icon className={`h-4 w-4 ${visual.color}`} />
          </div>
          <div className="min-w-0">
            <div className={`text-[9px] font-black uppercase tracking-wider ${visual.color}`}>
              {actType.replace(/_/g, " ")}
            </div>
            <div className="text-xs font-bold text-zinc-100 truncate">
              {nodeData.label || "Ação"}
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          {nodeData.status === "running" && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
          )}
          {nodeData.status === "success" && (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          )}
          {nodeData.status === "error" && (
            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="text-[11px] text-zinc-400 leading-relaxed break-words line-clamp-2">
          {getConfigSummary()}
        </p>

        {nodeData.status === "error" && nodeData.errorMsg && (
          <div className="mt-2 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-1.5 rounded">
            {nodeData.errorMsg}
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-zinc-950 !-right-1.5 hover:!scale-125 transition-transform"
      />
    </div>
  );
});

ActionNode.displayName = "ActionNode";
