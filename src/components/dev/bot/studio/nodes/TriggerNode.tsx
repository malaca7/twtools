import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Terminal, Zap, Clock, Webhook, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FlowNodeData } from "../flowUtils";

export const TriggerNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as FlowNodeData;
  const isCommand = Boolean(nodeData.commandName || nodeData.prefix);
  const isEvent = Boolean(nodeData.triggerType);

  const getIcon = () => {
    if (isCommand) return <Terminal className="h-4 w-4 text-emerald-400" />;
    if (isEvent) return <Zap className="h-4 w-4 text-amber-400" />;
    return <Clock className="h-4 w-4 text-cyan-400" />;
  };

  const getTriggerTypeBadge = () => {
    if (isCommand) return "COMANDO DISCORD";
    if (isEvent) return "EVENTO DISCORD";
    return "GATILHO DE ENTRADA";
  };

  const borderClass = selected
    ? "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)] border-emerald-500"
    : "border-emerald-500/40 hover:border-emerald-500/70";

  return (
    <div
      className={`min-w-[240px] max-w-[320px] rounded-xl bg-zinc-950/95 border backdrop-blur-md shadow-xl transition-all duration-200 ${borderClass}`}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-950/60 via-zinc-900/80 to-zinc-950 border-b border-zinc-800/80 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            {getIcon()}
          </div>
          <div>
            <div className="text-[10px] font-black tracking-wider uppercase text-emerald-400">
              {getTriggerTypeBadge()}
            </div>
            <div className="text-xs font-bold text-zinc-100 truncate max-w-[170px]">
              {nodeData.label || "Gatilho Inicial"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {nodeData.status === "running" && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          {nodeData.status === "success" && (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          )}
          {nodeData.status === "error" && (
            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
          )}
          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            START
          </span>
        </div>
      </div>

      {/* Node Body */}
      <div className="p-3 space-y-2">
        {nodeData.sublabel && (
          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
            {nodeData.sublabel}
          </p>
        )}

        {isCommand && nodeData.parameters && nodeData.parameters.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {nodeData.parameters.map((p, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-[9px] font-mono bg-zinc-900/80 text-zinc-300 border-zinc-700/60 px-1.5 py-0"
              >
                &lt;{p.name}&gt;
              </Badge>
            ))}
          </div>
        )}

        {isEvent && nodeData.triggerType && (
          <Badge
            variant="outline"
            className="text-[9px] font-mono bg-amber-500/10 text-amber-300 border-amber-500/30 px-1.5 py-0"
          >
            {nodeData.triggerType}
          </Badge>
        )}

        {nodeData.conditions && nodeData.conditions.length > 0 && (
          <div className="flex items-center gap-1 pt-0.5">
            <Badge
              variant="outline"
              className="text-[9px] font-mono bg-violet-500/15 text-violet-300 border-violet-500/30 px-1.5 py-0"
            >
              {nodeData.conditions.length} {nodeData.conditions.length === 1 ? "regra condicional" : "regras condicionais"}
            </Badge>
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-zinc-950 !-right-1.5 hover:!scale-125 transition-transform"
      />
    </div>
  );
});

TriggerNode.displayName = "TriggerNode";
