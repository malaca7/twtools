import React from "react";
import { Sliders, Plus, Trash2, HelpCircle, Hash, AtSign, Shield, Type, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CommandParameter } from "@/services/botEngine/types";

interface CommandParametersEditorProps {
  parameters: CommandParameter[];
  onChange: (params: CommandParameter[]) => void;
  commandPrefix?: string;
  commandName?: string;
  readOnly?: boolean;
}

export function CommandParametersEditor({
  parameters = [],
  onChange,
  commandPrefix = "!",
  commandName = "comando",
  readOnly = false,
}: CommandParametersEditorProps) {
  const addParameter = () => {
    const newParam: CommandParameter = {
      id: `param_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `arg${parameters.length + 1}`,
      type: "string",
      required: true,
      description: "",
      defaultValue: "",
    };
    onChange([...parameters, newParam]);
  };

  const removeParameter = (paramId: string) => {
    onChange(parameters.filter((p) => p.id !== paramId));
  };

  const updateParameter = (paramId: string, partial: Partial<CommandParameter>) => {
    onChange(
      parameters.map((p) => (p.id === paramId ? { ...p, ...partial } : p))
    );
  };

  const getTypeIcon = (type: CommandParameter["type"]) => {
    switch (type) {
      case "string":
        return <Type className="h-3.5 w-3.5 text-blue-400" />;
      case "number":
        return <span className="font-mono text-[11px] font-bold text-emerald-400">#</span>;
      case "user":
        return <AtSign className="h-3.5 w-3.5 text-amber-400" />;
      case "channel":
        return <Hash className="h-3.5 w-3.5 text-purple-400" />;
      case "role":
        return <Shield className="h-3.5 w-3.5 text-rose-400" />;
      case "boolean":
        return <ToggleLeft className="h-3.5 w-3.5 text-cyan-400" />;
      default:
        return <Type className="h-3.5 w-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com Descrição e Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Sliders className="h-4 w-4" />
            </div>
            <Label className="text-xs font-bold text-zinc-100">
              Parâmetros / Argumentos do Comando
            </Label>
            <Badge variant="outline" className="text-[10px] font-mono py-0 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
              {parameters.length} {parameters.length === 1 ? "argumento" : "argumentos"}
            </Badge>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
            Configure as variáveis e valores que os usuários devem ou podem digitar após o comando.
          </p>
        </div>

        {!readOnly && (
          <Button
            type="button"
            size="sm"
            onClick={addParameter}
            className="text-xs font-bold gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Argumento
          </Button>
        )}
      </div>

      {/* Syntax Preview Pill */}
      {parameters.length > 0 && (
        <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 text-[11px] font-medium">Sintaxe no chat:</span>
            <code className="font-mono text-xs font-bold text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {commandPrefix}{commandName || "comando"}{" "}
              {parameters.map((p) => (p.required ? `<${p.name || "arg"}>` : `[${p.name || "arg"}]`)).join(" ")}
            </code>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 hidden sm:flex">
            <span>&lt;obrigatório&gt;</span>
            <span>[opcional]</span>
          </div>
        </div>
      )}

      {/* Lista de Argumentos */}
      {parameters.length === 0 ? (
        <div className="p-5 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center space-y-2">
          <Sliders className="h-6 w-6 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400">
            Nenhum argumento cadastrado. O comando executará sem exigir parâmetros após o nome.
          </p>
          {!readOnly && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addParameter}
              className="text-xs font-bold gap-1 h-7 border-zinc-800 hover:bg-zinc-900 text-zinc-300"
            >
              <Plus className="h-3 w-3" />
              Adicionar Primeiro Parâmetro
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {parameters.map((param, index) => (
            <div
              key={param.id || index}
              className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/90 hover:border-zinc-700 transition-all space-y-2.5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 w-5">
                    #{index + 1}
                  </span>
                  <div className="relative flex-1 max-w-[180px]">
                    <Input
                      value={param.name}
                      onChange={(e) =>
                        updateParameter(param.id, {
                          name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                        })
                      }
                      placeholder="nome_do_arg"
                      disabled={readOnly}
                      className="h-8 text-xs font-mono font-bold bg-zinc-900 border-zinc-800 text-emerald-400 placeholder:text-zinc-600"
                    />
                  </div>

                  <Select
                    value={param.type || "string"}
                    onValueChange={(val: any) => updateParameter(param.id, { type: val })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-800 w-[140px] text-zinc-200">
                      <div className="flex items-center gap-1.5 truncate">
                        {getTypeIcon(param.type)}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
                      <SelectItem value="string">Texto (String)</SelectItem>
                      <SelectItem value="number">Número (Inteiro/Decimal)</SelectItem>
                      <SelectItem value="user">Usuário (@Membro)</SelectItem>
                      <SelectItem value="channel">Canal (#Texto)</SelectItem>
                      <SelectItem value="role">Cargo (@Role)</SelectItem>
                      <SelectItem value="boolean">Booleano (Sim/Não)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-[10px] font-medium text-zinc-400">
                      {param.required ? (
                        <span className="text-amber-400 font-bold">Obrigatório</span>
                      ) : (
                        <span className="text-zinc-500">Opcional</span>
                      )}
                    </span>
                    <Switch
                      checked={param.required}
                      onCheckedChange={(val) => updateParameter(param.id, { required: val })}
                      disabled={readOnly}
                      className="scale-75 data-[state=checked]:bg-amber-600"
                    />
                  </div>

                  {!readOnly && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeParameter(param.id)}
                      className="h-8 w-8 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      title="Excluir argumento"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Descrição e Valor Padrão */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-zinc-900">
                <div className="sm:col-span-2">
                  <Input
                    value={param.description || ""}
                    onChange={(e) => updateParameter(param.id, { description: e.target.value })}
                    placeholder="Descrição para a ajuda do comando (ex: Motivo do aviso ou punição)"
                    disabled={readOnly}
                    className="h-7 text-xs bg-zinc-900/80 border-zinc-800/80 text-zinc-300 placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <Input
                    value={param.defaultValue || ""}
                    onChange={(e) => updateParameter(param.id, { defaultValue: e.target.value })}
                    placeholder="Valor padrão (opcional)"
                    disabled={readOnly || param.required}
                    className="h-7 text-xs bg-zinc-900/80 border-zinc-800/80 text-zinc-300 placeholder:text-zinc-600 font-mono disabled:opacity-40"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
