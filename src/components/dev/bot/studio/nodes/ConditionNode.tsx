import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Split, CheckCircle2, AlertCircle } from "lucide-react";
import type { FlowNodeData } from "../flowUtils";

export const ConditionNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as FlowNodeData;
  const cfg = nodeData.config || {};
  const groups = cfg.conditionGroups || cfg.conditions || [];
  const groupCount = Array.isArray(groups) ? groups.length : 0;

  const borderClass = selected
    ? "ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] border-amber-500"
    : "border-amber-500/40 hover:border-amber-500/70";

  return (
    <div
      className={`min-w-[260px] max-w-[320px] rounded-xl bg-zinc-950/95 border backdrop-blur-md shadow-xl transition-all duration-200 ${borderClass}`}
    >
      {/* Target Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-zinc-950 !-left-1.5 hover:!scale-125 transition-transform"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-gradient-to-r from-amber-950/50 via-zinc-900/80 to-zinc-950 border-b border-zinc-800/80 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
            <Split className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              CONDIÇÃO SE / SENÃO
            </div>
            <div className="text-xs font-bold text-zinc-100 truncate max-w-[170px]">
              {nodeData.label || "Bifurcação Condicional"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {nodeData.status === "running" && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
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
      <div className="p-3 space-y-2">
        <div className="text-[11px] text-zinc-400">
          {groupCount > 0 ? (
            <span className="font-semibold text-zinc-300">
              {groupCount} {groupCount === 1 ? "grupo de regras" : "grupos de regras"} configurados
            </span>
          ) : (
            <span className="italic text-zinc-500">Nenhuma regra de validação definida</span>
          )}
        </div>

        {/* Dual Branch Output Indicators */}
        <div className="pt-2 border-t border-zinc-800/60 flex flex-col gap-2.5">
          {/* True branch */}
          <div className="flex items-center justify-end gap-2 relative pr-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              SE VERDADEIRO (SIM)
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <Handle
              type="source"
              position={Position.Right}
              id="true"
              style={{ top: "auto", bottom: "35px" }}
              className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-zinc-950 !-right-1.5 hover:!scale-125 transition-transform"
            />
          </div>

          {/* False branch */}
          <div className="flex items-center justify-end gap-2 relative pr-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              SE FALSO (SENÃO)
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <Handle
              type="source"
              position={Position.Right}
              id="false"
              style={{ top: "auto", bottom: "12px" }}
              className="!w-3 !h-3 !bg-rose-500 !border-2 !border-zinc-950 !-right-1.5 hover:!scale-125 transition-transform"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

ConditionNode.displayName = "ConditionNode";
