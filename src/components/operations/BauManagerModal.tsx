import { useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  Package,
  Shield,
  FlaskConical,
  Box,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createBau, updateBau, deleteBau } from "@/lib/app-api";
import { useBaus, useProducts, useMovements, useProductBaus } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { errorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Bau, Product } from "@/lib/app-types";

export function BauManagerModal({ trigger }: { trigger?: ReactNode }) {
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingBau, setEditingBau] = useState<Bau | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [icone, setIcone] = useState("box");
  const [isCreating, setIsCreating] = useState(false);
  const [bauToDelete, setBauToDelete] = useState<Bau | null>(null);

  const { data: baus = [], isLoading } = useBaus();
  const { data: products = [] } = useProducts();
  const { data: movements = [] } = useMovements();
  const { data: productBaus = [] } = useProductBaus();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setEditingBau(null);
    setNome("");
    setDescricao("");
    setIcone("box");
    setIsCreating(false);
  };

  // Helper para computar se um baú possui saldo positivo de algum item
  const getBauStockInfo = (bauId: string) => {
    let totalUnits = 0;
    const itemsWithStock: { product: Product; stock: number }[] = [];

    for (const prod of products) {
      let stock = 0;
      const chestEntry = productBaus.find(
        (pb) => pb.product_id === prod.id && pb.bau_id === bauId
      );

      if (chestEntry !== undefined) {
        stock = Math.max(0, Number(chestEntry.quantidade || 0));
      } else {
        const defaultBauId = baus[0]?.id;
        const chestMovements = movements.filter((m) => {
          if (m.product_id !== prod.id) return false;
          const mBauId = m.bau_id || defaultBauId;
          return mBauId === bauId;
        });

        if (chestMovements.length > 0) {
          stock = Math.max(
            0,
            chestMovements.reduce(
              (acc, m) => acc + (m.type === "entrada" ? Number(m.quantity) : -Number(m.quantity)),
              0
            )
          );
        } else if (prod.bau_id === bauId) {
          stock = Math.max(0, Number(prod.estoque_atual || 0));
        }
      }

      if (stock > 0) {
        totalUnits += stock;
        itemsWithStock.push({ product: prod, stock });
      }
    }

    return { totalUnits, itemsWithStock, count: itemsWithStock.length };
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
    mutationFn: async (targetBau: Bau) => {
      if (!hasPermission("manage_baus")) {
        throw new Error("Você não possui permissão para gerenciar baús.");
      }
      if (baus.length <= 1) {
        throw new Error("Não é possível excluir o único baú cadastrado no sistema.");
      }
      const stockInfo = getBauStockInfo(targetBau.id);
      if (stockInfo.count > 0 || stockInfo.totalUnits > 0) {
        throw new Error(
          `Não é possível excluir o baú "${targetBau.nome}" pois ele possui ${stockInfo.count} item(ns) com saldo em estoque (${stockInfo.totalUnits} un.). Zere ou transfira os itens antes de excluir.`
        );
      }
      await deleteBau(targetBau.id);
    },
    onSuccess: (_, targetBau) => {
      toast.success(`Baú "${targetBau.nome}" excluído com sucesso.`);
      void queryClient.invalidateQueries({ queryKey: ["baus"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      setBauToDelete(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const handleDeleteClick = (bau: Bau) => {
    if (!hasPermission("manage_baus")) {
      toast.error("Você não possui permissão para gerenciar baús.");
      return;
    }
    if (baus.length <= 1) {
      toast.error("Não é possível excluir o único baú cadastrado no sistema.");
      return;
    }

    const stockInfo = getBauStockInfo(bau.id);
    if (stockInfo.count > 0 || stockInfo.totalUnits > 0) {
      toast.error(
        `Não é possível excluir o baú "${bau.nome}" pois ele possui ${stockInfo.count} item(ns) com saldo (${stockInfo.totalUnits} un.). Zere ou transfira os itens antes de excluir.`
      );
      return;
    }

    setBauToDelete(bau);
  };

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
    <>
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
              Crie, edite e configure os compartimentos de armazenamento de estoque do grupo.
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
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {baus.map((b) => {
                    const stockInfo = getBauStockInfo(b.id);
                    const hasStock = stockInfo.count > 0;

                    return (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:border-border transition-colors bg-card/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-secondary/80 shrink-0">
                            {renderIcon(b.icone)}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm text-foreground truncate">{b.nome}</p>
                              {!b.ativo ? (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                                  Inativo
                                </Badge>
                              ) : null}
                              {hasStock ? (
                                <Badge
                                  variant="outline"
                                  className="text-[11px] py-0 px-2 font-normal bg-amber-500/10 text-amber-500 border-amber-500/30 flex items-center gap-1"
                                >
                                  <Layers className="h-3 w-3" />
                                  {stockInfo.count} item(ns) · {stockInfo.totalUnits} un.
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[11px] py-0 px-2 font-normal bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                >
                                  Vazio (0 saldo)
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {b.descricao || "Sem descrição"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
                            className={cn(
                              "h-8 w-8 transition-colors",
                              hasStock
                                ? "text-muted-foreground/40 hover:text-amber-500 hover:bg-amber-500/10"
                                : "text-destructive hover:text-destructive hover:bg-destructive/10"
                            )}
                            onClick={() => handleDeleteClick(b)}
                            disabled={deleteMutation.isPending}
                            title={
                              hasStock
                                ? `Possui ${stockInfo.count} item(ns) em saldo. Zere o estoque antes de excluir.`
                                : "Excluir baú"
                            }
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

      {/* Confirmação de Exclusão de Baú */}
      <AlertDialog
        open={!!bauToDelete}
        onOpenChange={(isOpen) => {
          if (!isOpen && !deleteMutation.isPending) {
            setBauToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Confirmar Exclusão de Baú
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <span>
                Tem certeza que deseja excluir o baú <strong>{bauToDelete?.nome}</strong>?
              </span>
              <span className="block text-xs text-muted-foreground">
                O baú está com saldo zerado (0 itens). Produtos que eventualmente estejam vinculados a ele como baú padrão terão o vínculo desfeito. Esta ação não poderá ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (bauToDelete) {
                  deleteMutation.mutate(bauToDelete);
                }
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Excluir Baú
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
