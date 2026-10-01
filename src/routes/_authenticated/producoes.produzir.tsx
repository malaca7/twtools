import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Factory,
  PackageCheck,
  Warehouse,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Boxes,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts, useRawMaterials, useWarehouseStock } from "@/hooks/useData";
import { executeProduction } from "@/services/productionService";
import { PageHeader, NoAccess, ProductThumbnail } from "@/components/ui-kit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { RawMaterial, Product } from "@/lib/app-types";

export const Route = createFileRoute("/_authenticated/producoes/produzir")({
  component: ProduzirPage,
});

type MaterialItem = {
  raw_material_id: string;
  quantity_used: number;
};

export function ProduzirPage() {
  const { hasPermission, isDevUser } = useAuth();
  const queryClient = useQueryClient();

  const canProduce = isDevUser || hasPermission("productions.create") || hasPermission("create_production");

  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: rawMaterials = [], isLoading: loadingMaterials } = useRawMaterials();
  const { data: warehouseStock = [] } = useWarehouseStock();

  // Estados do formulário
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [materialsUsed, setMaterialsUsed] = useState<MaterialItem[]>([]);
  const [observation, setObservation] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Produtos habilitados para produção
  const producibleProducts = useMemo(() => {
    return products.filter((p) => p.ativo && p.can_be_produced !== false);
  }, [products]);

  const selectedProduct = useMemo(() => {
    return producibleProducts.find((p) => p.id === selectedProductId);
  }, [producibleProducts, selectedProductId]);

  const activeRawMaterials = useMemo(() => {
    return rawMaterials.filter((m) => m.is_active);
  }, [rawMaterials]);

  // Saldo atual no armazém do produto selecionado
  const currentWarehouseBalance = useMemo(() => {
    if (!selectedProductId) return 0;
    const wh = warehouseStock.find((w) => w.product_id === selectedProductId);
    return wh ? Number(wh.quantity || 0) : 0;
  }, [warehouseStock, selectedProductId]);

  // Adicionar linha de matéria-prima
  const handleAddMaterial = (matId?: string) => {
    const firstAvailable = matId || activeRawMaterials.find(
      (m) => !materialsUsed.some((u) => u.raw_material_id === m.id)
    )?.id;

    if (!firstAvailable) {
      toast.error("Todas as matérias-primas ativas já foram adicionadas à lista.");
      return;
    }

    setMaterialsUsed((prev) => [
      ...prev,
      { raw_material_id: firstAvailable, quantity_used: 1 },
    ]);
  };

  const handleUpdateMaterial = (index: number, updates: Partial<MaterialItem>) => {
    setMaterialsUsed((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterialsUsed((prev) => prev.filter((_, i) => i !== index));
  };

  // Validação em tempo real das matérias-primas
  const validation = useMemo(() => {
    const numQty = parseFloat(quantity) || 0;
    if (!selectedProductId) return { valid: false, message: "Selecione um produto para produzir." };
    if (numQty <= 0) return { valid: false, message: "A quantidade a produzir deve ser maior que zero." };
    if (materialsUsed.length === 0) {
      return { valid: false, message: "Adicione ao menos uma matéria-prima utilizada na produção." };
    }

    for (const item of materialsUsed) {
      const mat = rawMaterials.find((m) => m.id === item.raw_material_id);
      if (!mat) return { valid: false, message: "Matéria-prima inválida selecionada." };
      if (!item.quantity_used || item.quantity_used <= 0) {
        return { valid: false, message: `Informe uma quantidade válida para ${mat.name}.` };
      }
      if (item.quantity_used > mat.stock_quantity) {
        return {
          valid: false,
          message: `Estoque insuficiente de ${mat.name}: possui ${mat.stock_quantity} ${mat.unit} e necessita de ${item.quantity_used} ${mat.unit}.`,
          insufficientMaterial: mat.name,
        };
      }
    }

    return { valid: true, message: "Tudo pronto para produzir!" };
  }, [selectedProductId, quantity, materialsUsed, rawMaterials]);

  // Mutação de Produção
  const productionMutation = useMutation({
    mutationFn: async () => {
      if (!validation.valid) throw new Error(validation.message);
      const numQty = parseFloat(quantity);
      return executeProduction({
        productId: selectedProductId,
        quantity: numQty,
        rawMaterials: materialsUsed.map((m) => ({
          raw_material_id: m.raw_material_id,
          quantity_used: Number(m.quantity_used),
        })),
        observation: observation.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Produção de ${res.quantity}x ${res.product_name} concluída! Itens adicionados ao Armazém.`
      );
      void queryClient.invalidateQueries({ queryKey: ["productions"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });

      // Reset
      setIsConfirmOpen(false);
      setQuantity("1");
      setMaterialsUsed([]);
      setObservation("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao registrar produção.");
    },
  });

  if (!canProduce) {
    return <NoAccess message="Você não possui permissão para executar ordens de produção." />;
  }

  const numQty = parseFloat(quantity) || 0;

  return (
    <div className="space-y-6 w-full max-w-full pb-12 animate-in fade-in duration-300">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Factory className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Estação de Produção
              </h1>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 font-mono text-[10px] uppercase font-bold">
                Módulo Industrial
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Processe insumos e matérias-primas para fabricar lotes de produtos com entrada imediata no Armazém
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
            <Link to="/producoes/armazem">
              <Warehouse className="h-4 w-4 text-emerald-400" />
              <span>Ver Armazém</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
            <Link to="/producoes/gestao">
              <PackageCheck className="h-4 w-4 text-sky-400" />
              <span>Gestão Central</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA: FORMULÁRIO DE PRODUÇÃO */}
        <div className="lg:col-span-7 space-y-6">
          {/* CARD 1: PRODUTO & QUANTIDADE */}
          <Card className="surface-card border-border/70 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs">
                  1
                </span>
                <span>Produto & Quantidade a Fabricar</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Selecione o item do catálogo aprovado para produção e a meta de unidades do lote
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* SELEÇÃO DO PRODUTO */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Produto Alvo *</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/70 text-xs font-medium">
                    <SelectValue placeholder="Selecione o produto a ser fabricado..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {loadingProducts ? (
                      <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando produtos...</span>
                      </div>
                    ) : producibleProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Nenhum produto habilitado para produção encontrado.
                      </div>
                    ) : (
                      producibleProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs py-2">
                          <div className="flex items-center gap-2.5">
                            <ProductThumbnail src={p.imagem_url} alt={p.nome} className="h-6 w-6 rounded-md" />
                            <span className="font-bold text-foreground">{p.nome}</span>
                            <span className="text-[11px] text-muted-foreground">({p.unidade})</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* CARD RESUMO DO PRODUTO SELECIONADO */}
              {selectedProduct && (
                <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <ProductThumbnail
                      src={selectedProduct.imagem_url}
                      alt={selectedProduct.nome}
                      className="h-12 w-12 rounded-xl"
                    />
                    <div>
                      <p className="text-xs font-black text-foreground">{selectedProduct.nome}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Unidade: <strong className="text-foreground">{selectedProduct.unidade}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Saldo no Armazém</span>
                    <p className="text-base font-black font-mono text-emerald-400">
                      {currentWarehouseBalance.toLocaleString("pt-BR")} {selectedProduct.unidade}
                    </p>
                  </div>
                </div>
              )}

              {/* QUANTIDADE PRODUZIDA */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Quantidade Produzida *</Label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Total: {numQty} {selectedProduct?.unidade || "un"}
                  </span>
                </div>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ex: 10"
                  className="h-11 text-base font-mono font-bold text-amber-300 rounded-xl bg-background/50 border-border/70"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground mr-1">Atalhos:</span>
                  {[1, 5, 10, 25, 50, 100].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(String(amt))}
                      className={cn(
                        "h-6 text-[10px] px-2 font-mono rounded-lg",
                        quantity === String(amt)
                          ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                          : "text-muted-foreground"
                      )}
                    >
                      +{amt}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: MATÉRIAS-PRIMAS CONSUMIDAS */}
          <Card className="surface-card border-border/70 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs">
                      2
                    </span>
                    <span>Consumo de Matérias-Primas</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Adicione os insumos consumidos para este lote de produção
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleAddMaterial()}
                  className="h-8 px-3 text-xs font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar Matéria-Prima</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              {materialsUsed.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-secondary/20 border border-dashed border-border/70 space-y-3">
                  <div className="p-2.5 rounded-2xl bg-muted/30 text-muted-foreground w-fit mx-auto">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Nenhuma matéria-prima incluída ainda</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Clique no botão acima para adicionar as matérias-primas que foram utilizadas.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddMaterial()}
                    className="text-xs rounded-xl gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Incluir Primeiro Insumo</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {materialsUsed.map((item, index) => {
                    const mat = rawMaterials.find((m) => m.id === item.raw_material_id);
                    const isOverStock = mat && Number(item.quantity_used) > Number(mat.stock_quantity);

                    return (
                      <div
                        key={index}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all space-y-2.5",
                          isOverStock
                            ? "bg-rose-500/10 border-rose-500/30"
                            : "bg-secondary/30 border-border/60"
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          {/* SELECT MATÉRIA-PRIMA */}
                          <div className="flex-1 min-w-[200px]">
                            <Select
                              value={item.raw_material_id}
                              onValueChange={(val) => handleUpdateMaterial(index, { raw_material_id: val })}
                            >
                              <SelectTrigger className="h-9 text-xs rounded-xl bg-background/50 border-border/70 font-bold">
                                <SelectValue placeholder="Selecione o insumo..." />
                              </SelectTrigger>
                              <SelectContent>
                                {activeRawMaterials.map((m) => (
                                  <SelectItem key={m.id} value={m.id} className="text-xs">
                                    <div className="flex items-center justify-between gap-3 w-full">
                                      <span>{m.name}</span>
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        (Disp: {m.stock_quantity} {m.unit})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* QUANTIDADE UTILIZADA */}
                          <div className="flex items-center gap-2">
                            <div className="w-32">
                              <Input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.quantity_used || ""}
                                onChange={(e) =>
                                  handleUpdateMaterial(index, {
                                    quantity_used: parseFloat(e.target.value) || 0,
                                  })
                                }
                                placeholder="Qtd"
                                className="h-9 text-xs font-mono font-bold text-foreground rounded-xl bg-background/50 border-border/70 text-right"
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-muted-foreground w-8">
                              {mat?.unit || "un"}
                            </span>

                            {/* REMOVER */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMaterial(index)}
                              className="h-8 w-8 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* STATUS DO ESTOQUE DA MATÉRIA-PRIMA */}
                        {mat && (
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40">
                            <div className="flex items-center gap-1.5">
                              {isOverStock ? (
                                <>
                                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                  <span className="text-rose-400 font-bold">
                                    Estoque insuficiente! Disponível: {mat.stock_quantity} {mat.unit}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                  <span className="text-muted-foreground">
                                    Estoque disponível:{" "}
                                    <strong className="text-emerald-400 font-mono">
                                      {mat.stock_quantity} {mat.unit}
                                    </strong>
                                  </span>
                                </>
                              )}
                            </div>
                            <span className="font-mono text-muted-foreground">
                              Restará:{" "}
                              <strong
                                className={cn(
                                  isOverStock ? "text-rose-400" : "text-foreground"
                                )}
                              >
                                {Math.max(0, mat.stock_quantity - (item.quantity_used || 0)).toFixed(1)}{" "}
                                {mat.unit}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD 3: OBSERVAÇÃO & NOTAS */}
          <Card className="surface-card border-border/70 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs">
                  3
                </span>
                <span>Observação & Identificação do Lote (Opcional)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <Textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ex: Produção semanal de coletes táticos e munição pesada para a ação de território..."
                className="text-xs rounded-xl bg-background/50 border-border/70 min-h-[80px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: RESUMO EXECUTIVO & CONFIRMAÇÃO */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="surface-card border-border/70 bg-gradient-to-br from-amber-500/[0.04] via-secondary/15 to-transparent sticky top-20">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span>Resumo da Ordem de Produção</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Revise os parâmetros antes de efetivar a transação no banco de dados
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* ITEM A PRODUZIR */}
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Produto:</span>
                  <span className="font-bold text-foreground">
                    {selectedProduct ? selectedProduct.nome : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Lote Produzido:</span>
                  <span className="font-mono font-black text-amber-400 text-sm">
                    +{numQty} {selectedProduct?.unidade || "un"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Destino Inicial:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Warehouse className="h-3.5 w-3.5" />
                    <span>Armazém Central</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Saldo Projetado no Armazém:</span>
                  <span className="font-mono font-bold text-foreground">
                    {(currentWarehouseBalance + numQty).toLocaleString("pt-BR")}{" "}
                    {selectedProduct?.unidade || "un"}
                  </span>
                </div>
              </div>

              {/* LISTA DE MATÉRIAS-PRIMAS A DEDUZIR */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Matérias-Primas a Deduzir ({materialsUsed.length}):
                </Label>
                {materialsUsed.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nenhum insumo configurado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {materialsUsed.map((item, idx) => {
                      const mat = rawMaterials.find((m) => m.id === item.raw_material_id);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-background/40 border border-border/40 text-xs"
                        >
                          <span className="font-medium text-foreground">{mat?.name || "Insumo"}</span>
                          <span className="font-mono font-bold text-rose-400">
                            -{item.quantity_used} {mat?.unit || "un"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AVISO DE TRANSAÇÃO ATÔMICA */}
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Garantia de Integridade (Transação ACID)</span>
                </p>
                <p>
                  As matérias-primas serão baixadas e os produtos adicionados ao armazém em transação atômica. Se qualquer validação falhar, a operação é desfeita sem alterar saldos.
                </p>
              </div>

              {/* STATUS DE VALIDAÇÃO */}
              {!validation.valid && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{validation.message}</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-border/40 p-5">
              <Button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={!validation.valid || productionMutation.isPending}
                className="w-full h-11 text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl cursor-pointer shadow-lg shadow-amber-500/20 gap-2"
              >
                {productionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processando Produção...</span>
                  </>
                ) : (
                  <>
                    <Factory className="h-4 w-4" />
                    <span>Confirmar Produção de Lote</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <Factory className="h-5 w-5 text-amber-400" />
              <span>Confirmar Execução de Produção</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja confirmar o consumo dos insumos e a fabricação de{" "}
              <strong className="text-foreground">
                {numQty}x {selectedProduct?.nome}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-2">
              <p className="font-bold text-foreground">Insumos que serão consumidos agora:</p>
              <ul className="space-y-1">
                {materialsUsed.map((item, idx) => {
                  const mat = rawMaterials.find((m) => m.id === item.raw_material_id);
                  return (
                    <li key={idx} className="flex items-center justify-between text-muted-foreground font-mono">
                      <span>• {mat?.name}</span>
                      <strong className="text-rose-400">
                        -{item.quantity_used} {mat?.unit}
                      </strong>
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Os itens produzidos serão entregues diretamente ao saldo do <strong>Armazém</strong>.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => productionMutation.mutate()}
              disabled={productionMutation.isPending}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl gap-1.5"
            >
              {productionMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Fabricando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Confirmar e Finalizar</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
