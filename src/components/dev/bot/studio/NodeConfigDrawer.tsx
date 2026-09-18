import React from "react";
import {
  X,
  Trash2,
  Copy,
  Save,
  Terminal,
  Zap,
  Split,
  MessageSquare,
  HelpCircle,
  Code2,
  ShieldCheck,
  Globe,
  Variable,
  Clock,
  Bell,
  Sparkles,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConditionGroupEditor } from "../ConditionGroupEditor";
import { CommandParametersEditor } from "../CommandParametersEditor";
import { AVAILABLE_PLACEHOLDERS } from "@/services/botEngine/parser";
import type { FlowNodeData } from "./flowUtils";
import type { Node } from "@xyflow/react";
import type { EventTriggerType } from "@/services/botEngine/types";

interface NodeConfigDrawerProps {
  selectedNode: Node<FlowNodeData> | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, newData: Partial<FlowNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode?: (node: Node<FlowNodeData>) => void;
}

export function NodeConfigDrawer({
  selectedNode,
  onClose,
  onUpdateNodeData,
  onDeleteNode,
  onDuplicateNode,
}: NodeConfigDrawerProps) {
  if (!selectedNode) return null;

  const { id, data } = selectedNode;
  const isTrigger = data.isTrigger;
  const isCondition = data.isCondition || data.actionType === "condition_branch";
  const cfg = data.config || {};

  const handleConfigChange = (key: string, value: any) => {
    const updatedConfig = { ...cfg, [key]: value };
    onUpdateNodeData(id, { config: updatedConfig });
  };

  const handleLabelChange = (newLabel: string) => {
    onUpdateNodeData(id, { label: newLabel });
  };

  const insertPlaceholder = (placeholder: string, currentField: string) => {
    const prev = cfg[currentField] || "";
    handleConfigChange(currentField, `${prev} {{${placeholder}}}`);
  };

  return (
    <aside className="w-96 border-l border-zinc-800 bg-zinc-950/95 flex flex-col h-full z-20 shadow-2xl backdrop-blur-md">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-2 rounded-lg border ${
              isTrigger
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : isCondition
                ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                : "bg-violet-500/15 border-violet-500/30 text-violet-400"
            }`}
          >
            {isTrigger ? (
              <Terminal className="h-4 w-4" />
            ) : isCondition ? (
              <Split className="h-4 w-4" />
            ) : (
              <Code2 className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              {isTrigger ? "Configuração do Gatilho" : isCondition ? "Lógica Condicional" : "Configuração da Ação"}
            </span>
            <div className="text-xs font-bold text-zinc-100 truncate">{data.label}</div>
          </div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="h-8 w-8 text-zinc-400 hover:text-zinc-100 rounded-lg"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ========================================================================= */}
        {/* 1. CONFIGURAÇÃO DE GATILHO (TRIGGER) */}
        {/* ========================================================================= */}
        {isTrigger && (
          <div className="space-y-5">
            {data.commandName !== undefined ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-200">Nome do Comando</Label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                      {data.prefix || "!"}
                    </span>
                    <Input
                      value={data.commandName || ""}
                      onChange={(e) => {
                        const name = e.target.value.toLowerCase().replace(/\s+/g, "_");
                        onUpdateNodeData(id, {
                          commandName: name,
                          label: `Comando: ${data.prefix || "!"}${name}`,
                        });
                      }}
                      placeholder="ex: painel, equipe, aviso"
                      className="bg-zinc-900 border-zinc-800 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-200">Descrição</Label>
                  <Textarea
                    value={data.sublabel || ""}
                    onChange={(e) => onUpdateNodeData(id, { sublabel: e.target.value })}
                    placeholder="Descrição do que este comando executa..."
                    rows={2}
                    className="bg-zinc-900 border-zinc-800 text-xs resize-none"
                  />
                </div>

                {/* Parâmetros / Argumentos do Comando no Studio */}
                <div className="pt-3 border-t border-zinc-800/80">
                  <CommandParametersEditor
                    parameters={data.parameters || []}
                    onChange={(newParams) => onUpdateNodeData(id, { parameters: newParams })}
                    commandPrefix={data.prefix || "!"}
                    commandName={data.commandName || "comando"}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-200">Tipo de Evento Discord</Label>
                  <Select
                    value={data.triggerType || "message_create"}
                    onValueChange={(val: EventTriggerType) => {
                      onUpdateNodeData(id, {
                        triggerType: val,
                        label: `Evento: ${val}`,
                      });
                    }}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs">
                      <SelectValue placeholder="Selecione o tipo de evento" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-xs">
                      <SelectItem value="message_create">Mensagem Enviada (message_create)</SelectItem>
                      <SelectItem value="member_join">Novo Membro Entrou (member_join)</SelectItem>
                      <SelectItem value="member_leave">Membro Saiu (member_leave)</SelectItem>
                      <SelectItem value="command_ran">Comando Executado (command_ran)</SelectItem>
                      <SelectItem value="bot_ready">Bot Online / Conectado (bot_ready)</SelectItem>
                      <SelectItem value="webhook_received">Webhook Externo (webhook_received)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-200">Descrição do Evento</Label>
                  <Textarea
                    value={data.sublabel || ""}
                    onChange={(e) => onUpdateNodeData(id, { sublabel: e.target.value })}
                    placeholder="Descrição do fluxo do evento..."
                    rows={2}
                    className="bg-zinc-900 border-zinc-800 text-xs resize-none"
                  />
                </div>
              </>
            )}

            {/* Seleção de Servidor Discord onde vai funcionar */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-blue-400" />
                  Servidor Discord Autorizado
                </Label>
                <Badge variant="outline" className="text-[10px] font-mono text-zinc-400 border-zinc-700">
                  {data.guildId === "1535505650308620400"
                    ? "Twin Wheel"
                    : data.guildId === "1537229296697999462"
                    ? "Malaca Devs"
                    : !data.guildId || data.guildId === "all"
                    ? "Global"
                    : "Personalizado"}
                </Badge>
              </div>
              <Select
                value={data.guildId || "all"}
                onValueChange={(val) => onUpdateNodeData(id, { guildId: val })}
              >
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-xs">
                  <SelectValue placeholder="Selecione o servidor" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-xs">
                  <SelectItem value="all">🌐 Todos os Servidores (Global)</SelectItem>
                  <SelectItem value="1535505650308620400">🏍️ Twin Wheel (1535505650308620400)</SelectItem>
                  <SelectItem value="1537229296697999462">💻 Malaca Developers (1537229296697999462)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-zinc-500">
                Define em qual servidor o bot irá responder a este {data.commandName !== undefined ? "comando" : "evento"}.
              </p>
            </div>

            {/* Condições & Regras de Execução (SE / ENTÃO) */}
            <div className="pt-4 border-t border-zinc-800/80">
              <ConditionGroupEditor
                groups={data.conditions || []}
                onChange={(newGroups) => onUpdateNodeData(id, { conditions: newGroups })}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. CONFIGURAÇÃO DE CONDIÇÃO IF / ELSE */}
        {/* ========================================================================= */}
        {isCondition && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-200">Título do Bloco</Label>
              <Input
                value={data.label || ""}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs font-bold"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <span className="font-bold">Como funciona a bifurcação:</span>
              <p className="text-[11px] text-amber-200/80 pt-1 leading-relaxed">
                Se as regras forem atendidas, o fluxo segue pela saída verde <b>SIM / TRUE</b>. Caso contrário, segue pela saída vermelha <b>NÃO / FALSE</b>.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-200">Regras de Validação</Label>
              <ConditionGroupEditor
                groups={cfg.conditionGroups || []}
                onChange={(newGroups) => handleConfigChange("conditionGroups", newGroups)}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. CONFIGURAÇÃO DE AÇÕES DISCORD E EXTERNAS */}
        {/* ========================================================================= */}
        {!isTrigger && !isCondition && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-200">Título deste Bloco</Label>
              <Input
                value={data.label || ""}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Ex: Enviar Mensagem de Boas-Vindas"
                className="bg-zinc-900 border-zinc-800 text-xs font-bold"
              />
            </div>

            {/* SEND_MESSAGE or REPLY_MESSAGE */}
            {(data.actionType === "send_message" || data.actionType === "reply_message") && (
              <div className="space-y-3.5">
                {data.actionType === "send_message" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-200">ID do Canal Discord (Opcional)</Label>
                    <Input
                      value={cfg.channelId || ""}
                      onChange={(e) => handleConfigChange("channelId", e.target.value)}
                      placeholder="Deixe em branco para usar o canal atual"
                      className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-200">Título do Embed (Opcional)</Label>
                  <Input
                    value={cfg.title || ""}
                    onChange={(e) => handleConfigChange("title", e.target.value)}
                    placeholder="Ex: 📢 Comunicado da Facção"
                    className="bg-zinc-900 border-zinc-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-200">
                      Mensagem / Descrição <span className="text-rose-400">*</span>
                    </Label>
                  </div>
                  <Textarea
                    value={cfg.description || ""}
                    onChange={(e) => handleConfigChange("description", e.target.value)}
                    placeholder="Texto da mensagem enviada..."
                    rows={4}
                    className="bg-zinc-900 border-zinc-800 text-xs resize-none"
                  />
                </div>

                {/* Variáveis rápidas */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    Inserir Variáveis Rápidas
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {["user.name", "user.id", "channel.name", "server.name"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => insertPlaceholder(p, "description")}
                        className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-mono text-emerald-400 border border-zinc-800 transition-colors"
                      >
                        +{p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-200">Cor do Embed</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cfg.color || "#10B981"}
                      onChange={(e) => handleConfigChange("color", e.target.value)}
                      className="h-8 w-12 rounded bg-zinc-900 border border-zinc-800 cursor-pointer p-0.5"
                    />
                    <Input
                      value={cfg.color || "#10B981"}
                      onChange={(e) => handleConfigChange("color", e.target.value)}
                      className="bg-zinc-900 border-zinc-800 text-xs font-mono uppercase w-32"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ROLES */}
            {(data.actionType === "add_role" || data.actionType === "remove_role") && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-200">ID do Cargo no Discord</Label>
                  <Input
                    value={cfg.roleId || ""}
                    onChange={(e) => handleConfigChange("roleId", e.target.value)}
                    placeholder="Ex: 123456789012345678"
                    className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                  />
                  <p className="text-[10px] text-zinc-500">
                    O bot precisa ter permissão de Gerenciar Cargos acima do cargo configurado.
                  </p>
                </div>
              </div>
            )}

            {/* SET_VARIABLE */}
            {data.actionType === "set_variable" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-200">Nome da Variável</Label>
                  <Input
                    value={cfg.variableName || ""}
                    onChange={(e) => handleConfigChange("variableName", e.target.value)}
                    placeholder="ex: contador_farm, meta_semanal"
                    className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-200">Valor</Label>
                  <Input
                    value={cfg.variableValue || ""}
                    onChange={(e) => handleConfigChange("variableValue", e.target.value)}
                    placeholder="Valor a ser armazenado"
                    className="bg-zinc-900 border-zinc-800 text-xs"
                  />
                </div>
              </div>
            )}

            {/* HTTP_REQUEST */}
            {data.actionType === "http_request" && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-200">Método</Label>
                    <Select
                      value={cfg.method || "POST"}
                      onValueChange={(val) => handleConfigChange("method", val)}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-950 border-zinc-800 text-xs">
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-200">URL do Endpoint</Label>
                    <Input
                      value={cfg.url || ""}
                      onChange={(e) => handleConfigChange("url", e.target.value)}
                      placeholder="https://api.exemplo.com/webhook"
                      className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-200">Payload Body (JSON)</Label>
                  <Textarea
                    value={cfg.body || ""}
                    onChange={(e) => handleConfigChange("body", e.target.value)}
                    placeholder='{"user_id": "{{user.id}}", "action": "trigger"}'
                    rows={4}
                    className="bg-zinc-900 border-zinc-800 text-xs font-mono resize-none"
                  />
                </div>
              </div>
            )}

            {/* DELAY */}
            {data.actionType === "delay" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-200">Tempo de Espera (milissegundos)</Label>
                <Input
                  type="number"
                  value={cfg.durationMs || 1000}
                  onChange={(e) => handleConfigChange("durationMs", parseInt(e.target.value) || 1000)}
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
                <p className="text-[10px] text-zinc-500">
                  Ex: 1000 = 1 segundo, 5000 = 5 segundos.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between gap-2">
        {!isTrigger && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDeleteNode(id)}
            className="text-xs font-bold gap-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30 h-8"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir Bloco
          </Button>
        )}

        <Button
          size="sm"
          onClick={onClose}
          className="ml-auto text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white h-8"
        >
          <Save className="h-3.5 w-3.5" />
          Concluir Edição
        </Button>
      </div>
    </aside>
  );
}
