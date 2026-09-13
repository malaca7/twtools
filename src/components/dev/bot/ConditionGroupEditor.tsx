import { useState } from "react";
import { Plus, Trash2, HelpCircle, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ConditionGroup, ConditionItem, ConditionOperator } from "@/services/botEngine/types";

interface ConditionGroupEditorProps {
  groups: ConditionGroup[];
  onChange: (groups: ConditionGroup[]) => void;
}

const COMMON_FIELDS = [
  { value: "user.roles", label: "Cargo do Usuário (has_role)" },
  { value: "user.permissions", label: "Permissão do Usuário" },
  { value: "user.id", label: "ID Discord do Usuário" },
  { value: "user.name", label: "Nome do Usuário" },
  { value: "message.content", label: "Conteúdo da Mensagem" },
  { value: "channel.id", label: "ID do Canal" },
  { value: "channel.name", label: "Nome do Canal" },
  { value: "args.0", label: "1º Argumento do Comando" },
];

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "equals", label: "é igual a" },
  { value: "not_equals", label: "é diferente de" },
  { value: "contains", label: "contém" },
  { value: "not_contains", label: "não contém" },
  { value: "starts_with", label: "começa com" },
  { value: "ends_with", label: "termina com" },
  { value: "has_role", label: "possui o cargo" },
  { value: "has_permission", label: "possui a permissão" },
  { value: "greater_than", label: "maior que (>)" },
  { value: "less_than", label: "menor que (<)" },
  { value: "greater_or_equal", label: "maior ou igual (>=)" },
  { value: "less_or_equal", label: "menor ou igual (<=)" },
  { value: "is_empty", label: "está vazio" },
  { value: "is_not_empty", label: "não está vazio" },
];

export function ConditionGroupEditor({ groups, onChange }: ConditionGroupEditorProps) {
  const addGroup = () => {
    const newGroup: ConditionGroup = {
      id: `group_${Date.now()}`,
      logic: "AND",
      conditions: [
        {
          id: `cond_${Date.now()}`,
          field: "user.roles",
          operator: "has_role",
          value: "lider",
        },
      ],
    };
    onChange([...groups, newGroup]);
  };

  const removeGroup = (groupId: string) => {
    onChange(groups.filter((g) => g.id !== groupId));
  };

  const updateGroupLogic = (groupId: string, logic: "AND" | "OR") => {
    onChange(groups.map((g) => (g.id === groupId ? { ...g, logic } : g)));
  };

  const addConditionToGroup = (groupId: string) => {
    const newItem: ConditionItem = {
      id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      field: "message.content",
      operator: "contains",
      value: "",
    };
    onChange(
      groups.map((g) =>
        g.id === groupId ? { ...g, conditions: [...g.conditions, newItem] } : g
      )
    );
  };

  const updateCondition = (
    groupId: string,
    condId: string,
    partial: Partial<ConditionItem>
  ) => {
    onChange(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          conditions: g.conditions.map((c) => (c.id === condId ? { ...c, ...partial } : c)),
        };
      })
    );
  };

  const removeCondition = (groupId: string, condId: string) => {
    onChange(
      groups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          conditions: g.conditions.filter((c) => c.id !== condId),
        };
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Split className="h-3.5 w-3.5 text-violet-400" />
            Condições & Regras de Execução (SE / ENTÃO)
          </Label>
          <p className="text-[0.7rem] text-muted-foreground">
            Defina quem ou quando esta automação pode disparar. Se não houver condições, ela será executada livremente.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addGroup}
          className="text-xs font-bold gap-1.5 h-8 bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5 text-primary" />
          Adicionar Grupo
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-950/40 text-center">
          <p className="text-xs text-muted-foreground">
            Nenhuma condição configurada. Esta automação será executada sempre que acionada.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, gIdx) => (
            <div
              key={group.id}
              className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 relative"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono bg-zinc-950 border-zinc-800">
                    Grupo #{gIdx + 1}
                  </Badge>

                  <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => updateGroupLogic(group.id, "AND")}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        group.logic === "AND"
                          ? "bg-violet-600 text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      E (AND)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateGroupLogic(group.id, "OR")}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        group.logic === "OR"
                          ? "bg-violet-600 text-white"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      OU (OR)
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeGroup(group.id)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                  title="Remover grupo de condições"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Lista de condições do grupo */}
              <div className="space-y-2">
                {group.conditions.map((cond, cIdx) => (
                  <div
                    key={cond.id}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/60"
                  >
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-6 text-center">
                      {cIdx === 0 ? "SE" : group.logic === "AND" ? "E" : "OU"}
                    </span>

                    {/* Campo */}
                    <div className="min-w-[140px] flex-1">
                      <Input
                        value={cond.field}
                        onChange={(e) => updateCondition(group.id, cond.id, { field: e.target.value })}
                        placeholder="user.roles, message.content..."
                        className="h-8 text-xs font-mono bg-zinc-900 border-zinc-800"
                        list={`common-fields-${cond.id}`}
                      />
                      <datalist id={`common-fields-${cond.id}`}>
                        {COMMON_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {/* Operador */}
                    <div className="min-w-[130px] shrink-0">
                      <Select
                        value={cond.operator}
                        onValueChange={(val: ConditionOperator) =>
                          updateCondition(group.id, cond.id, { operator: val })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800 text-foreground">
                          {OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value} className="text-xs">
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Valor esperado */}
                    {!["is_empty", "is_not_empty"].includes(cond.operator) && (
                      <div className="flex-1">
                        <Input
                          value={cond.value}
                          onChange={(e) =>
                            updateCondition(group.id, cond.id, { value: e.target.value })
                          }
                          placeholder="Valor esperado ou {{placeholder}}..."
                          className="h-8 text-xs bg-zinc-900 border-zinc-800"
                        />
                      </div>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCondition(group.id, cond.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-400 shrink-0 self-end sm:self-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex justify-start">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => addConditionToGroup(group.id)}
                  className="text-[11px] font-bold text-violet-400 hover:text-violet-300 h-7 px-2 gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar Linha de Condição
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
