import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, Package, Shield, FlaskConical, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createBau, updateBau, deleteBau } from "@/lib/app-api";
import { useBaus, useProducts } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/format";
import type { Bau } from "@/lib/app-types";

export function BauManagerModal({ trigger }: { trigger?: ReactNode }) {
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingBau, setEditingBau] = useState<Bau | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [icone, setIcone] = useState("box");
  const [isCreating, setIsCreating] = useState(false);

  const { data: baus = [], isLoading } = useBaus();
  const { data: products = [] } = useProducts();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setEditingBau(null);
    setNome("");
    setDescricao("");
    setIcone("box");
    setIsCreating(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!hasPermission("manage_baus")) {
        throw new Error("Você não possui permissão para gerenciar baús.");
      }
      if (!nome.trim()) throw new Error("Informe o nome do baú.");
      if (editingBau) {
        const payload: { id: string; nome: string; descricao?: string; icone?: string } = {
          id: editingBau.id,
          nome: nome.trim(),
          icone,
        };
        if (descricao.trim()) payload.descricao = descricao.trim();
        await updateBau(payload);
      } else {
        const payload: { nome: string; descricao?: string; icone?: string } = {
          nome: nome.trim(),
          icone,
        };
        if (descricao.trim()) payload.descricao = descricao.trim();
        await createBau(payload);
      }
    },
    onSuccess: () => {
      toast.success(editingBau ? "Baú atualizado." : "Novo baú criado.");
      void queryClient.invalidateQueries({ queryKey: ["baus"] });
      resetForm();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!hasPermission("manage_baus")) {
        throw new Error("Você não possui permissão para gerenciar baús.");
      }
      const inUse = products.some((p) => p.bau_id === id);
      if (inUse) {
        throw new Error("Este baú contém produtos vinculados. Reatribua os produtos antes de excluir.");
      }
      await deleteBau(id);
    },
    onSuccess: () => {
      toast.success("Baú excluído.");
      void queryClient.invalidateQueries({ queryKey: ["baus"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const toggleBauMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      await updateBau({ id, ativo });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["baus"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const handleEdit = (bau: Bau) => {
    setEditingBau(bau);
    setNome(bau.nome);
    setDescricao(bau.descricao || "");
    setIcone(bau.icone || "box");
    setIsCreating(true);
  };

  const renderIcon = (iconName: string | null) => {
    switch (iconName) {
      case "shield":
        return <Shield className="h-4 w-4 text-sky-400" />;
      case "flask-conical":
        return <FlaskConical className="h-4 w-4 text-purple-400" />;
      case "package":
        return <Package className="h-4 w-4 text-amber-400" />;
      default:
        return <Box className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Package className="mr-1.5 h-4 w-4" /> Gerenciar Baús
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Baús do Grupo</DialogTitle>
          <DialogDescription>
            Crie, edite e ative/desative os compartimentos de armazenamento de estoque.
          </DialogDescription>
        </DialogHeader>

        {isCreating ? (
          <div className="space-y-4 rounded-xl border border-border/80 p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {editingBau ? "Editar Baú" : "Novo Baú"}
              </p>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Cancelar
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="bau-nome">Nome do Baú</Label>
                <Input
                  id="bau-nome"
                  placeholder="Ex.: Baú de Munições, Baú Secundário"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="bau-desc">Descrição / Local</Label>
                <Textarea
                  id="bau-desc"
                  placeholder="Descrição das regras ou local do baú"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label>Ícone</Label>
                <div className="flex gap-2 pt-1">
                  {[
                    { id: "box", label: "Caixa", icon: Box },
                    { id: "package", label: "Pacote", icon: Package },
                    { id: "shield", label: "Armas", icon: Shield },
                    { id: "flask-conical", label: "Insumos", icon: FlaskConical },
                  ].map((ic) => (
                    <Button
                      key={ic.id}
                      type="button"
                      variant={icone === ic.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIcone(ic.id)}
                      className="gap-1.5"
                    >
                      <ic.icon className="h-4 w-4" /> {ic.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingBau ? "Salvar Alterações" : "Criar Baú"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Baús Cadastrados ({baus.length})
              </p>
              <Button
                size="sm"
                className="bg-gradient-brand text-primary-foreground hover:opacity-90"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="mr-1 h-4 w-4" /> Novo Baú
              </Button>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
            ) : baus.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum baú cadastrado.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {baus.map((b) => {
                  const productCount = products.filter((p) => p.bau_id === b.id).length;
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-secondary/80">
                          {renderIcon(b.icone)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground truncate">{b.nome}</p>
                            {!b.ativo ? (
                              <Badge variant="outline" className="text-xs text-muted-foreground">Inativo</Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {b.descricao || "Sem descrição"} · {productCount} produto(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(b)}
                          title="Editar baú"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(b.id)}
                          disabled={deleteMutation.isPending}
                          title="Excluir baú"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
