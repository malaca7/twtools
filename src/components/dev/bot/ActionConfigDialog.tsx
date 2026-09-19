import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Reply,
  Trash2,
  Clock,
  Send,
  Variable,
  Globe,
  FileCode,
  Bell,
  ShieldCheck,
  Palette,
  Layers,
} from "lucide-react";
import type { BotAction, ActionType } from "@/services/botEngine/types";
import { AVAILABLE_PLACEHOLDERS } from "@/services/botEngine/parser";

interface ActionConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: BotAction | null;
  onSave: (action: BotAction) => void;
}

export const ACTION_TYPE_METADATA: Record<
  ActionType,
  { label: string; description: string; icon: any; color: string }
> = {
  send_message: {
    label: "Enviar Mensagem / Embed",
    description: "Envia um texto formatado ou embed rico para um canal ou usuário do Discord.",
    icon: MessageSquare,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  reply_message: {
    label: "Responder Mensagem",
    description: "Responde diretamente à mensagem que acionou o comando.",
    icon: Reply,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  edit_message: {
    label: "Editar Mensagem",
    description: "Modifica o conteúdo de uma mensagem enviada anteriormente.",
    icon: FileCode,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  },
  delete_message: {
    label: "Apagar Mensagem",
    description: "Deleta uma mensagem especificada ou o gatilho original.",
    icon: Trash2,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  add_role: {
    label: "Adicionar Cargo",
    description: "Atribui um cargo a um membro no Discord ou no sistema.",
    icon: ShieldCheck,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  remove_role: {
    label: "Remover Cargo",
    description: "Remove um cargo específico de um usuário.",
    icon: ShieldCheck,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  set_status: {
    label: "Alterar Status do Bot",
    description: "Atualiza o texto de atividade ou status de presença do bot.",
    icon: Layers,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  database_insert: {
    label: "Criar Registro no Banco",
    description: "Insere novos dados no banco de dados Supabase.",
    icon: FileCode,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  database_update: {
    label: "Atualizar Registro no Banco",
    description: "Atualiza registros existentes no banco de dados.",
    icon: FileCode,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  http_request: {
    label: "Requisição HTTP / API",
    description: "Faz uma chamada REST para qualquer API externa ou webhook.",
    icon: Globe,
    color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  },
  execute_webhook: {
    label: "Executar Webhook",
    description: "Dispara um payload estruturado para um endpoint de webhook.",
    icon: Send,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  },
  set_variable: {
    label: "Definir Variável",
    description: "Cria ou atualiza o valor de uma variável em memória.",
    icon: Variable,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  },
  condition_branch: {
    label: "Condição IF / ELSE (Ramificação)",
    description: "Executa um grupo de ações se for verdadeiro e outro se for falso.",
    icon: Layers,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  },
  delay: {
    label: "Delay / Espera",
    description: "Pausa a execução por um intervalo de tempo determinado.",
    icon: Clock,
    color: "text-zinc-400 bg-zinc-800/40 border-zinc-700/40",
  },
  execute_command: {
    label: "Executar Outro Comando",
    description: "Chama um comando existente encadeando novas automações.",
    icon: Send,
    color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  log_audit: {
    label: "Registrar em Auditoria",
    description: "Grava um evento no histórico de auditoria oficial do grupo.",
    icon: FileCode,
    color: "text-slate-400 bg-slate-800/40 border-slate-700/40",
  },
  send_notification: {
    label: "Enviar Notificação no Painel",
    description: "Dispara uma notificação popup aos usuários logados no sistema web.",
    icon: Bell,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
};

export function ActionConfigDialog({ open, onOpenChange, action, onSave }: ActionConfigDialogProps) {
  const [localAction, setLocalAction] = useState<BotAction | null>(action);

  useEffect(() => {
    setLocalAction(action);
  }, [action]);

  if (!localAction) return null;

  const meta = ACTION_TYPE_METADATA[localAction.type] || ACTION_TYPE_METADATA.send_message;
  const Icon = meta.icon;
  const cfg = localAction.config || {};

  const handleConfigChange = (key: string, value: any) => {
    setLocalAction((prev) => (prev ? { ...prev, config: { ...prev.config, [key]: value } } : null));
  };

  const handleSave = () => {
    if (localAction) {
      onSave(localAction);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${meta.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Configurar Ação: {meta.label}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {meta.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
          {/* Nome da Ação */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Título / Identificador desta Ação</Label>
            <Input
              value={localAction.name || ""}
              onChange={(e) => setLocalAction({ ...localAction, name: e.target.value })}
              placeholder={`Ex: ${meta.label}`}
              className="bg-zinc-900 border-zinc-800 text-xs font-bold"
            />
          </div>

          {/* ========================================================================= */}
          {/* CAMPOS ESPECÍFICOS POR TIPO DE AÇÃO */}
          {/* ========================================================================= */}

          {/* 1. ENVIAR MENSAGEM */}
          {localAction.type === "send_message" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ID do Canal Discord (Opcional)</Label>
                <Input
                  value={cfg.channelId || ""}
                  onChange={(e) => handleConfigChange("channelId", e.target.value)}
                  placeholder="Deixe em branco para enviar no canal que disparou o comando"
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Título do Embed (Opcional)</Label>
                <Input
                  value={cfg.title || ""}
                  onChange={(e) => handleConfigChange("title", e.target.value)}
                  placeholder="Ex: 📢 Aviso da Diretoria"
                  className="bg-zinc-900 border-zinc-800 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">
                  Conteúdo / Mensagem <span className="text-rose-400">*</span>
                </Label>
                <Textarea
                  value={cfg.description || ""}
                  onChange={(e) => handleConfigChange("description", e.target.value)}
                  placeholder="Digite o texto. Suporta {{user.name}}, {{channel.name}}, {{args.0}}..."
                  rows={4}
                  className="bg-zinc-900 border-zinc-800 text-xs font-sans resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Cor do Embed</Label>
                  <Input
                    type="color"
                    value={cfg.color || "#10B981"}
                    onChange={(e) => handleConfigChange("color", e.target.value)}
                    className="h-8 p-1 bg-zinc-900 border-zinc-800 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Menção (@everyone, @role)</Label>
                  <Input
                    value={cfg.mention || ""}
                    onChange={(e) => handleConfigChange("mention", e.target.value)}
                    placeholder="Ex: @everyone ou {{user.mention}}"
                    className="bg-zinc-900 border-zinc-800 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. RESPONDER MENSAGEM */}
          {localAction.type === "reply_message" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Texto de Resposta</Label>
              <Textarea
                value={cfg.content || ""}
                onChange={(e) => handleConfigChange("content", e.target.value)}
                placeholder="Olá {{user.mention}}, sua solicitação foi processada!"
                rows={3}
                className="bg-zinc-900 border-zinc-800 text-xs font-sans resize-none"
              />
            </div>
          )}

          {/* 3. DEFINIR VARIÁVEL */}
          {localAction.type === "set_variable" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nome da Variável</Label>
                <Input
                  value={cfg.name || ""}
                  onChange={(e) => handleConfigChange("name", e.target.value)}
                  placeholder="Ex: saldo_temporario"
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Valor</Label>
                <Input
                  value={cfg.value || ""}
                  onChange={(e) => handleConfigChange("value", e.target.value)}
                  placeholder="Valor ou {{user.id}}"
                  className="bg-zinc-900 border-zinc-800 text-xs"
                />
              </div>
            </div>
          )}

          {/* 4. DELAY */}
          {localAction.type === "delay" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tempo de Espera (Milissegundos)</Label>
              <Input
                type="number"
                value={cfg.ms || 1000}
                onChange={(e) => handleConfigChange("ms", e.target.value)}
                placeholder="Ex: 1000 (1 segundo)"
                className="bg-zinc-900 border-zinc-800 text-xs font-mono"
              />
              <p className="text-[0.65rem] text-muted-foreground">
                Recomendado entre 500ms e 3000ms para evitar sobrecarga.
              </p>
            </div>
          )}

          {/* 5. REQUISIÇÃO HTTP */}
          {localAction.type === "http_request" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs font-bold">Método</Label>
                  <Select
                    value={cfg.method || "GET"}
                    onValueChange={(val) => handleConfigChange("method", val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-bold">URL da API</Label>
                  <Input
                    value={cfg.url || ""}
                    onChange={(e) => handleConfigChange("url", e.target.value)}
                    placeholder="https://api.exemplo.com/webhook"
                    className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                  />
                </div>
              </div>

              {cfg.method !== "GET" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">JSON Payload Body</Label>
                  <Textarea
                    value={cfg.body || ""}
                    onChange={(e) => handleConfigChange("body", e.target.value)}
                    placeholder='{"user": "{{user.id}}", "content": "{{message.content}}"}'
                    rows={3}
                    className="bg-zinc-900 border-zinc-800 text-xs font-mono resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* 6. REGISTRO DE AUDITORIA */}
          {localAction.type === "log_audit" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nome da Ação</Label>
                <Input
                  value={cfg.actionName || ""}
                  onChange={(e) => handleConfigChange("actionName", e.target.value)}
                  placeholder="Ex: bot_custom_action"
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Detalhes do Log</Label>
                <Input
                  value={cfg.details || ""}
                  onChange={(e) => handleConfigChange("details", e.target.value)}
                  placeholder="Ex: Usuário {{user.name}} executou a rotina."
                  className="bg-zinc-900 border-zinc-800 text-xs"
                />
              </div>
            </div>
          )}

          {/* PLACEHOLDERS HELPER */}
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-1.5">
            <span className="text-[0.68rem] font-bold text-muted-foreground block uppercase">
              Variáveis que você pode usar neste campo:
            </span>
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_PLACEHOLDERS.slice(0, 7).map((p) => (
                <Badge
                  key={p.placeholder}
                  variant="outline"
                  className="text-[9px] font-mono bg-zinc-950 border-zinc-800 text-zinc-300 cursor-pointer hover:bg-zinc-800"
                  onClick={() => {
                    navigator.clipboard.writeText(p.placeholder);
                  }}
                  title="Clique para copiar"
                >
                  {p.placeholder}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="text-xs font-bold bg-primary text-primary-foreground"
          >
            Salvar Ação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
