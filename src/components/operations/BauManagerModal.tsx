import { useState, useRef, type ReactNode } from "react";
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
  Upload,
  Image as ImageIcon,
  X,
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
import { BauIcon } from "@/components/ui/bau-icon";
import { createBau, updateBau, deleteBau, uploadBauImage } from "@/lib/app-api";
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
  const [fotoUrl, setFotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [tipoGestao, setTipoGestao] = useState<"automatico" | "manual">("automatico");
  const [isCreating, setIsCreating] = useState(false);
  const [bauToDelete, setBauToDelete] = useState<Bau | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: baus = [], isLoading } = useBaus();
  const { data: products = [] } = useProducts();
  const { data: movements = [] } = useMovements();
  const { data: productBaus = [] } = useProductBaus();
  const queryClient = useQueryClient();

  const uniqueBaus = baus.filter(
    (b, index, self) =>
      index ===
      self.findIndex(
        (t) => t.id === b.id || (t.nome && b.nome && t.nome.trim().toLowerCase() === b.nome.trim().toLowerCase())
      )
  );

  const resetForm = () => {
    setEditingBau(null);
    setNome("");
    setDescricao("");
    setIcone("box");
    setFotoUrl("");
    setTipoGestao("automatico");
    setIsCreating(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const url = await uploadBauImage(file);
      setFotoUrl(url);
      if (editingBau?.id) {
        await updateBau({
          id: editingBau.id,
          foto_url: url,
          imagem_url: url,
        });
        void queryClient.invalidateQueries({ queryKey: ["baus"] });
      }
      toast.success("Foto do baú enviada e salva com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da imagem.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
      const cleanName = nome.trim();
      if (!cleanName) throw new Error("Informe o nome do baú.");

      const cleanPhoto = fotoUrl.trim() || null;

      if (editingBau) {
        const isDuplicate = baus.some(
          (b) => b.id !== editingBau.id && b.nome.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (isDuplicate) {
          throw new Error(`Já existe outro baú cadastrado com o nome "${cleanName}".`);
        }

        const payload: {
          id: string;
          nome: string;
          descricao?: string;
          icone?: string;
          foto_url?: string | null;
          imagem_url?: string | null;
          tipo_gestao?: "automatico" | "manual";
        } = {
          id: editingBau.id,
          nome: cleanName,
          icone,
          foto_url: cleanPhoto,
          imagem_url: cleanPhoto,
          tipo_gestao: tipoGestao,
        };
        if (descricao.trim()) payload.descricao = descricao.trim();
        await updateBau(payload);
      } else {
        const isDuplicate = baus.some(
          (b) => b.nome.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (isDuplicate) {
          throw new Error(`Já existe um baú cadastrado com o nome "${cleanName}".`);
        }

        const payload: {
          nome: string;
          descricao?: string;
          icone?: string;
          foto_url?: string | null;
          imagem_url?: string | null;
          tipo_gestao?: "automatico" | "manual";
        } = {
          nome: cleanName,
          icone,
          foto_url: cleanPhoto,
          imagem_url: cleanPhoto,
          tipo_gestao: tipoGestao,
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
    setFotoUrl(bau.foto_url || bau.imagem_url || "");
    setTipoGestao(bau.tipo_gestao === "manual" ? "manual" : "automatico");
    setIsCreating(true);
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
              Crie, edite e configure os compartimentos de armazenamento e fotos de perfil dos baús.
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
                {/* Foto de Perfil do Baú */}
                <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-card/40">
                  <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Foto de Perfil do Baú (Opcional)</span>
                    {fotoUrl && (
                      <button
                        type="button"
                        onClick={() => setFotoUrl("")}
                        className="text-[10px] text-destructive hover:underline flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Remover foto
                      </button>
                    )}
                  </Label>

                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl border-2 border-dashed border-border/80 flex items-center justify-center overflow-hidden bg-secondary/50 shrink-0 shadow-inner">
                      {fotoUrl ? (
                        <img
                          src={fotoUrl}
                          alt="Preview do Baú"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BauIcon icone={icone} className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingPhoto}
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 text-xs font-bold gap-1.5 border-border/80"
                        >
                          {isUploadingPhoto ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-primary" />
                          )}
                          {isUploadingPhoto ? "Enviando..." : "Upload de Foto"}
                        </Button>
                      </div>
                      <Input
                        placeholder="Ou cole o link direto da imagem..."
                        value={fotoUrl}
                        onChange={(e) => setFotoUrl(e.target.value)}
                        className="text-xs h-7.5"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bau-nome">Nome do Baú *</Label>
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
                  <Label className="text-xs font-semibold">Modo de Operação do Baú</Label>
                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => setTipoGestao("automatico")}
                      className={cn(
                        "flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left transition-all",
                        tipoGestao === "automatico"
                          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/50"
                          : "border-border/60 bg-secondary/40 hover:bg-secondary/70 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                        <span>🤖</span> Automático (Discord)
                      </div>
                      <p className="text-[11px] leading-tight text-muted-foreground">
                        Sincronizado via logs do Discord. Bloqueia lançamentos manuais livres.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTipoGestao("manual")}
                      className={cn(
                        "flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left transition-all",
                        tipoGestao === "manual"
                          ? "border-amber-500/60 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/50"
                          : "border-border/60 bg-secondary/40 hover:bg-secondary/70 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                        <span>✋</span> Manual (Plataforma)
                      </div>
                      <p className="text-[11px] leading-tight text-muted-foreground">
                        Permite lançar entradas, saídas e transferências manuais pelo site.
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <Label>Ícone Alternativo</Label>
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
                  Baús Cadastrados ({uniqueBaus.length})
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
              ) : uniqueBaus.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum baú cadastrado.</p>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {uniqueBaus.map((b) => {
                    const stockInfo = getBauStockInfo(b.id);
                    const hasStock = stockInfo.count > 0;

                    return (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/70 hover:border-border transition-colors bg-card/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/70 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                            <BauIcon
                              foto_url={b.foto_url || b.imagem_url}
                              icone={b.icone}
                              nome={b.nome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm text-foreground truncate">{b.nome}</p>
                              {b.tipo_gestao === "manual" ? (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium bg-amber-500/10 text-amber-400 border-amber-500/30">
                                  ✋ Manual
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                  🤖 Automático
                                </Badge>
                              )}
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
