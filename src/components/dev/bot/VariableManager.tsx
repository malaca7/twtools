import { useState } from "react";
import { toast } from "sonner";
import {
  Variable,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Globe,
  Bot,
  User,
  Clock,
  Code,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BotVariable, VariableScope, VariableType } from "@/services/botEngine/types";
import { AVAILABLE_PLACEHOLDERS } from "@/services/botEngine/parser";

interface VariableManagerProps {
  variables: BotVariable[];
  botId: string;
  onChange: (variables: BotVariable[]) => void;
}

const SCOPE_CONFIG: Record<VariableScope, { label: string; icon: any; color: string }> = {
  global: { label: "Global", icon: Globe, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
  bot: { label: "Do Bot", icon: Bot, color: "text-violet-400 bg-violet-500/10 border-violet-500/25" },
  user: { label: "Do Usuário", icon: User, color: "text-blue-400 bg-blue-500/10 border-blue-500/25" },
  temporary: { label: "Temporária", icon: Clock, color: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
  execution: { label: "Da Execução", icon: Code, color: "text-pink-400 bg-pink-500/10 border-pink-500/25" },
};

export function VariableManager({ variables, botId, onChange }: VariableManagerProps) {
  const [selectedScope, setSelectedScope] = useState<string>("all");
  const [editingVar, setEditingVar] = useState<BotVariable | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredVars = variables.filter((v) =>
    selectedScope === "all" ? true : v.scope === selectedScope
  );

  const handleOpenCreate = () => {
    setEditingVar({
      id: `var_${Date.now()}`,
      botId,
      name: "",
      description: "",
      scope: "bot",
      type: "string",
      value: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: BotVariable) => {
    setEditingVar({ ...v });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    onChange(variables.filter((v) => v.id !== id));
    toast.success("Variável removida.");
  };

  const handleSave = () => {
    if (!editingVar || !editingVar.name.trim()) {
      toast.error("Informe um nome para a variável.");
      return;
    }

    const cleanName = editingVar.name.trim().replace(/[^a-zA-Z0-9_]/g, "_");
    const updated = { ...editingVar, name: cleanName };

    const exists = variables.some((v) => v.id === updated.id);
    if (exists) {
      onChange(variables.map((v) => (v.id === updated.id ? updated : v)));
      toast.success(`Variável "${cleanName}" atualizada!`);
    } else {
      onChange([...variables, updated]);
      toast.success(`Variável "${cleanName}" criada com sucesso!`);
    }

    setIsModalOpen(false);
  };

  const handleCopyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(placeholder);
    setCopiedKey(placeholder);
    toast.success(`Placeholder ${placeholder} copiado!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & FILTROS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Variable className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Gerenciador de Variáveis & Placeholders
              <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/25 text-[10px]">
                {variables.length} {variables.length === 1 ? "Variável" : "Variáveis"}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Guarde valores dinâmicos ou utilize os placeholders nativos do sistema nas mensagens e condições.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedScope} onValueChange={setSelectedScope}>
            <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-800 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
              <SelectItem value="all">Todos os Escopos</SelectItem>
              <SelectItem value="bot">Do Bot</SelectItem>
              <SelectItem value="global">Globais</SelectItem>
              <SelectItem value="user">Do Usuário</SelectItem>
              <SelectItem value="temporary">Temporárias</SelectItem>
              <SelectItem value="execution">Da Execução</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-8 text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Variável
          </Button>
        </div>
      </div>

      {/* PLACEHOLDERS DO SISTEMA (ATALHOS RÁPIDOS) */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2.5">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
          Placeholders Nativos Prontos para Uso (Clique para Copiar):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_PLACEHOLDERS.map((p) => {
            const isCopied = copiedKey === p.placeholder;
            return (
              <button
                key={p.placeholder}
                type="button"
                onClick={() => handleCopyPlaceholder(p.placeholder)}
                className="px-2 py-1 rounded-md text-[11px] font-mono bg-zinc-950 border border-zinc-800 hover:border-violet-500/50 hover:bg-violet-950/20 text-zinc-300 transition-all flex items-center gap-1.5"
                title={`${p.label} - Clique para copiar`}
              >
                <span>{p.placeholder}</span>
                {isCopied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground opacity-60" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* LISTA DE VARIÁVEIS CUSTOMIZADAS */}
      {filteredVars.length === 0 ? (
        <Card className="surface-card p-10 text-center border-dashed border-zinc-800">
          <div className="flex flex-col items-center gap-2">
            <Variable className="h-6 w-6 text-muted-foreground opacity-50" />
            <p className="text-xs text-muted-foreground">
              Nenhuma variável customizada encontrada neste escopo.
            </p>
            <Button size="sm" variant="outline" onClick={handleOpenCreate} className="text-xs font-bold mt-2">
              <Plus className="h-3.5 w-3.5" />
              Criar Primeira Variável
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVars.map((v) => {
            const scopeMeta = SCOPE_CONFIG[v.scope] || SCOPE_CONFIG.bot;
            const ScopeIcon = scopeMeta.icon;
            const placeholderTag = `{{vars.${v.name}}}`;
            const isCopied = copiedKey === placeholderTag;

            return (
              <Card
                key={v.id}
                className="surface-card p-3.5 border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-foreground truncate">
                          {v.name}
                        </span>
                        <Badge className={`text-[9px] font-bold px-1.5 py-0 ${scopeMeta.color}`}>
                          <ScopeIcon className="h-2.5 w-2.5 mr-0.5 inline" />
                          {scopeMeta.label}
                        </Badge>
                      </div>
                      {v.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 pt-0.5">
                          {v.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(v)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Editar variável"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(v.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                        title="Excluir variável"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Valor atual */}
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 text-[11px] font-mono text-zinc-300 break-all">
                    <span className="text-[9px] text-muted-foreground block font-sans font-bold uppercase">
                      Valor ({v.type}):
                    </span>
                    {v.value || <span className="italic text-zinc-500">Vazio</span>}
                  </div>
                </div>

                {/* Botão Copiar Placeholder */}
                <div className="pt-2 border-t border-zinc-800/60 mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 truncate">{placeholderTag}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyPlaceholder(placeholderTag)}
                    className="text-[10px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 shrink-0"
                  >
                    {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {isCopied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE VARIÁVEL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Variable className="h-4 w-4 text-pink-400" />
              {editingVar && variables.some((v) => v.id === editingVar.id)
                ? "Editar Variável"
                : "Nova Variável"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Defina o nome, escopo e valor inicial da variável.
            </DialogDescription>
          </DialogHeader>

          {editingVar && (
            <div className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nome da Variável (somente letras, números e _)</Label>
                <Input
                  value={editingVar.name}
                  onChange={(e) => setEditingVar({ ...editingVar, name: e.target.value })}
                  placeholder="Ex: cota_semanal"
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Escopo</Label>
                  <Select
                    value={editingVar.scope}
                    onValueChange={(val: VariableScope) => setEditingVar({ ...editingVar, scope: val })}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                      <SelectItem value="bot">Do Bot</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="user">Do Usuário</SelectItem>
                      <SelectItem value="temporary">Temporária</SelectItem>
                      <SelectItem value="execution">Da Execução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Tipo</Label>
                  <Select
                    value={editingVar.type}
                    onValueChange={(val: VariableType) => setEditingVar({ ...editingVar, type: val })}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                      <SelectItem value="string">Texto (String)</SelectItem>
                      <SelectItem value="number">Número (Number)</SelectItem>
                      <SelectItem value="boolean">Booleano (True/False)</SelectItem>
                      <SelectItem value="json">JSON / Objeto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Valor Inicial</Label>
                <Input
                  value={editingVar.value}
                  onChange={(e) => setEditingVar({ ...editingVar, value: e.target.value })}
                  placeholder="Ex: 50000 ou Twin Wheels"
                  className="bg-zinc-900 border-zinc-800 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Descrição / Finalidade (Opcional)</Label>
                <Input
                  value={editingVar.description}
                  onChange={(e) => setEditingVar({ ...editingVar, description: e.target.value })}
                  placeholder="Para que serve esta variável?"
                  className="bg-zinc-900 border-zinc-800 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-bold bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="text-xs font-bold bg-primary text-primary-foreground"
            >
              Salvar Variável
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
