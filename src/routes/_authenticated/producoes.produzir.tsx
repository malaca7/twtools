import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Factory,
  PackageCheck,
  Warehouse,
  ShoppingCart,
  Plus,
  Minus,
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
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts, useRawMaterials, useWarehouseStock, useProductRecipes } from "@/hooks/useData";
import { executeProduction } from "@/services/productionService";
import { PageHeader, NoAccess, ProductThumbnail } from "@/components/ui-kit";
import { ProductionNavHeader } from "@/components/productions/ProductionNavHeader";
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
  const { hasPermission, isDevMode, isCeoMode } = useAuth();
  const queryClient = useQueryClient();

  const canProduce = hasPermission("productions.create") || hasPermission("create_production");
  const canView = canProduce || hasPermission("productions.view") || hasPermission("view_productions");
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";

  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: rawMaterials = [], isLoading: loadingMaterials } = useRawMaterials();
  const { data: warehouseStock = [] } = useWarehouseStock();
  const { data: allRecipes = [] } = useProductRecipes();

  // Estados do formulário
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [materialsUsed, setMaterialsUsed] = useState<MaterialItem[]>([]);
  const [observation, setObservation] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Produtos habilitados para produção
  const producibleProducts = useMemo(() => {
    return products.filter((p) => p.ativo && p.can_be_produced === true);
  }, [products]);

  const selectedProduct = useMemo(() => {
    return producibleProducts.find((p) => p.id === selectedProductId);
  }, [producibleProducts, selectedProductId]);

  const activeRawMaterials = useMemo(() => {
    return rawMaterials.filter((m) => m.is_active);
  }, [rawMaterials]);

  // Receita cadastrada para o produto selecionado
  const currentProductRecipes = useMemo(() => {
    if (!selectedProductId) return [];
    return allRecipes.filter((r) => r.product_id === selectedProductId);
  }, [allRecipes, selectedProductId]);

  // Rendimento definido para a receita deste produto (mínimo 1)
  const selectedProductYield = useMemo(() => {
    return Math.max(1, Math.round(Number(selectedProduct?.production_yield || 1)));
  }, [selectedProduct]);

  const numQty = parseFloat(quantity) || 0;

  // Verifica se a quantidade informada é um múltiplo exato do rendimento gerado por receita
  const isMultiple = useMemo(() => {
    if (!selectedProduct || numQty <= 0) return true;
    return numQty % selectedProductYield === 0;
  }, [selectedProduct, numQty, selectedProductYield]);

  // Quantidade de ciclos/receitas inteiras correspondentes
  const recipeCycles = useMemo(() => {
    if (selectedProductYield <= 0) return 0;
    return isMultiple
      ? Math.round(numQty / selectedProductYield)
      : Math.max(1, Math.round(numQty / selectedProductYield));
  }, [selectedProductYield, isMultiple, numQty]);

  // Função para aplicar a receita cadastrada proporcionalmente à quantidade (sempre números inteiros)
  const applyProductRecipe = (productId: string, targetQtyStr?: string) => {
    const prod = producibleProducts.find((p) => p.id === productId);
    const recs = allRecipes.filter((r) => r.product_id === productId);
    if (recs.length === 0) return false;

    const rawQty = Math.max(1, Math.round(parseFloat(targetQtyStr ?? quantity) || 1));
    const prodYield = Math.max(1, Math.round(Number(prod?.production_yield || 1)));
    
    // O consumo de matérias-primas é estritamente proporcional aos ciclos completos de receita
    const cycles = Math.max(1, Math.round(rawQty / prodYield));

    const mapped: MaterialItem[] = recs.map((r) => ({
      raw_material_id: r.raw_material_id,
      quantity_used: Math.max(
        1,
        Math.round(Number(r.quantity_required)) * cycles
      ),
    }));

    setMaterialsUsed(mapped);
    return true;
  };

  // Ao selecionar um produto, garante que a quantidade seja múltiplo do rendimento (ou 1 ciclo)
  const handleSelectProduct = (newProductId: string) => {
    setSelectedProductId(newProductId);
    const nextProd = producibleProducts.find((p) => p.id === newProductId);
    const nextYield = Math.max(1, Math.round(Number(nextProd?.production_yield || 1)));
    const currentNum = parseInt(quantity, 10);

    let nextQty = String(nextYield);
    if (!isNaN(currentNum) && currentNum >= nextYield && currentNum % nextYield === 0) {
      nextQty = String(currentNum);
    }
    setQuantity(nextQty);
    applyProductRecipe(newProductId, nextQty);
  };

  // Ajusta por passos de ciclos de receita (+1 ciclo, -1 ciclo, etc.)
  const handleStepQuantity = (directionMultiplier: number) => {
    const delta = directionMultiplier * selectedProductYield;
    const currentVal = parseInt(quantity, 10) || 0;
    const nextVal = Math.max(selectedProductYield, currentVal + delta);
    const nextStr = String(nextVal);
    setQuantity(nextStr);
    if (selectedProductId) {
      applyProductRecipe(selectedProductId, nextStr);
    }
  };

  // Ajusta diretamente pelo número de ciclos
  const handleSetCycles = (cyclesCount: number) => {
    const cleanCycles = Math.max(1, cyclesCount);
    const targetUnits = cleanCycles * selectedProductYield;
    const nextStr = String(targetUnits);
    setQuantity(nextStr);
    if (selectedProductId) {
      applyProductRecipe(selectedProductId, nextStr);
    }
  };

  // Ao sair do campo (blur), auto-ajusta para o múltiplo mais próximo caso não seja múltiplo
  const handleQuantityBlur = () => {
    const parsed = parseInt(quantity, 10);
    if (isNaN(parsed) || parsed < selectedProductYield) {
      const snapped = selectedProductYield;
      setQuantity(String(snapped));
      if (selectedProductId) applyProductRecipe(selectedProductId, String(snapped));
      return;
    }
    if (parsed % selectedProductYield !== 0) {
      const snapped = Math.max(
        selectedProductYield,
        Math.round(parsed / selectedProductYield) * selectedProductYield
      );
      setQuantity(String(snapped));
      if (selectedProductId) {
        applyProductRecipe(selectedProductId, String(snapped));
      }
      toast.info(
        `Quantidade ajustada para ${snapped} ${selectedProduct?.unidade || "un"} (${snapped / selectedProductYield} ciclo(s) da receita).`
      );
    }
  };

  // Botão de auto-correção rápida para múltiplo
  const snapToMultiple = (multipleQty: number) => {
    const snapped = Math.max(selectedProductYield, multipleQty);
    setQuantity(String(snapped));
    if (selectedProductId) {
      applyProductRecipe(selectedProductId, String(snapped));
    }
  };

  // Carrega automaticamente a receita ao mudar o produto selecionado ou carregar as receitas
  useEffect(() => {
    if (!selectedProductId) return;
    const prod = producibleProducts.find((p) => p.id === selectedProductId);
    const prodYield = Math.max(1, Math.round(Number(prod?.production_yield || 1)));

    const currentNum = parseInt(quantity, 10);
    let targetQty = quantity;
    if (isNaN(currentNum) || currentNum < prodYield || currentNum % prodYield !== 0) {
      targetQty = String(prodYield);
      setQuantity(targetQty);
    }

    const applied = applyProductRecipe(selectedProductId, targetQty);
    if (!applied && materialsUsed.length === 0 && activeRawMaterials.length > 0) {
      setMaterialsUsed([
        { raw_material_id: activeRawMaterials[0].id, quantity_used: 1 },
      ]);
    }
  }, [selectedProductId, allRecipes]);

  // Se houver apenas 1 produto habilitado, pré-seleciona automaticamente com seu rendimento
  useEffect(() => {
    if (!selectedProductId && producibleProducts.length === 1) {
      const first = producibleProducts[0];
      const initialYield = Math.max(1, Math.round(Number(first.production_yield || 1)));
      setSelectedProductId(first.id);
      setQuantity(String(initialYield));
      applyProductRecipe(first.id, String(initialYield));
    }
  }, [producibleProducts, selectedProductId]);

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

  // Validação em tempo real das matérias-primas e regras de receita
  const validation = useMemo(() => {
    const parsedQty = parseFloat(quantity) || 0;
    if (!selectedProductId) return { valid: false, message: "Selecione um produto para produzir." };
    if (parsedQty <= 0) return { valid: false, message: "A quantidade a fabricar deve ser maior que zero." };

    // Validação estrita de múltiplo do rendimento da receita
    if (selectedProductYield > 1 && parsedQty % selectedProductYield !== 0) {
      return {
        valid: false,
        message: `A quantidade a fabricar (${parsedQty} ${selectedProduct?.unidade || "un"}) deve ser múltiplo exato do rendimento da receita (${selectedProductYield} ${selectedProduct?.unidade || "un"} por ciclo).`,
        isMultipleError: true,
      };
    }

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
          message: `Estoque insuficiente de ${mat.name}: possui ${Math.round(mat.stock_quantity)} ${mat.unit} e necessita de ${Math.round(item.quantity_used)} ${mat.unit}.`,
          insufficientMaterial: mat.name,
        };
      }
    }

    return { valid: true, message: "Tudo pronto para produzir!" };
  }, [selectedProductId, quantity, selectedProductYield, selectedProduct, materialsUsed, rawMaterials]);

  // Mutação de Produção
  const productionMutation = useMutation({
    mutationFn: async () => {
      if (!canProduce) throw new Error("Você não possui permissão para executar produções.");
      if (!validation.valid) throw new Error(validation.message);
      const cleanNum = Math.max(1, Math.round(parseFloat(quantity) || 1));
      return executeProduction({
        productId: selectedProductId,
        quantity: cleanNum,
        rawMaterials: materialsUsed.map((m) => ({
          raw_material_id: m.raw_material_id,
          quantity_used: Math.max(1, Math.round(Number(m.quantity_used) || 1)),
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

      // Reset inteligente para 1 ciclo do produto
      setIsConfirmOpen(false);
      const defaultQty = String(selectedProductYield || 1);
      setQuantity(defaultQty);
      if (selectedProductId) {
        applyProductRecipe(selectedProductId, defaultQty);
      } else {
        setMaterialsUsed(
          activeRawMaterials.length > 0
            ? [{ raw_material_id: activeRawMaterials[0].id, quantity_used: 1 }]
            : []
        );
      }
      setObservation("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao registrar produção.");
    },
  });

  if (!canView && !canProduce) {
    return <NoAccess message="Você não possui permissão para acessar a Estação de Produção." />;
  }

  return (
    <div className="space-y-6 w-full max-w-full pb-12 animate-in fade-in duration-300">
      {/* MODO SOMENTE LEITURA BANNER */}
      {!canProduce && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
          <Info className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>Modo de Leitura:</strong> Seu cargo possui permissão para visualização da Estação de Produção e receitas de produtos, mas não para emitir novas ordens de fabricação.
          </span>
        </div>
      )}

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

        <ProductionNavHeader currentTab="produzir" />
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
                <Select value={selectedProductId} onValueChange={handleSelectProduct}>
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

                {!loadingProducts && producibleProducts.length === 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>Nenhum produto habilitado para produção</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Todos os produtos cadastrados atualmente possuem a opção <strong>&quot;Habilitado para Produção&quot;</strong> desativada. Para liberar produtos para fabricação, acesse a Gestão de Produção ou Gestão de Estoque.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button asChild size="sm" variant="outline" className="h-7 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/15 gap-1.5">
                        <Link to={`${prefix}/producoes/gestao`}>
                          <PackageCheck className="h-3 w-3" />
                          <span>Habilitar na Gestão</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* CARD RESUMO DO PRODUTO SELECIONADO */}
              {selectedProduct && (
                <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <ProductThumbnail
                      src={selectedProduct.imagem_url}
                      alt={selectedProduct.nome}
                      className="h-12 w-12 rounded-xl shrink-0"
                    />
                    <div>
                      <p className="text-xs font-black text-foreground">{selectedProduct.nome}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground">
                          Unidade: <strong className="text-foreground">{selectedProduct.unidade}</strong>
                        </span>
                        {currentProductRecipes.length > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-sky-500/10 text-sky-300 border-sky-500/30 text-[10px] font-mono"
                          >
                            Receita: {currentProductRecipes.length} insumo(s) • Rendimento: {selectedProductYield} {selectedProduct.unidade}/ciclo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Saldo no Armazém</span>
                    <p className="text-base font-black font-mono text-emerald-400">
                      {currentWarehouseBalance.toLocaleString("pt-BR")} {selectedProduct.unidade}
                    </p>
                  </div>
                </div>
              )}

              {/* CONTROLES DE QUANTIDADE E LOTES DE PRODUÇÃO */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Boxes className="h-3.5 w-3.5 text-amber-400" />
                    <span>Quantidade a Fabricar *</span>
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-mono",
                        isMultiple
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-rose-500/10 text-rose-300 border-rose-500/30 font-bold"
                      )}
                    >
                      Total: {numQty} {selectedProduct?.unidade || "un"}
                      {selectedProduct && selectedProductYield > 1 && (
                        <span>
                          {isMultiple ? ` (${recipeCycles} ciclo(s))` : " (Inválido: não múltiplo)"}
                        </span>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* STEPPER & INPUT PRINCIPAL */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleStepQuantity(-1)}
                    disabled={numQty <= selectedProductYield}
                    className="h-11 w-11 rounded-xl shrink-0 border-border/70 hover:bg-amber-500/10 hover:text-amber-300"
                    title={`Diminuir 1 ciclo (-${selectedProductYield} ${selectedProduct?.unidade || "un"})`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min={selectedProductYield}
                      step={selectedProductYield}
                      value={quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleanVal = val ? String(Math.max(1, parseInt(val, 10) || 1)) : "";
                        setQuantity(cleanVal);
                        if (selectedProductId) {
                          applyProductRecipe(selectedProductId, cleanVal);
                        }
                      }}
                      onBlur={handleQuantityBlur}
                      placeholder={`Múltiplo de ${selectedProductYield}`}
                      className={cn(
                        "h-11 text-base font-mono font-black rounded-xl bg-background/50 border-border/70 pr-14 text-center sm:text-left sm:pl-4",
                        !isMultiple ? "border-rose-500/60 text-rose-300" : "text-amber-300"
                      )}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-muted-foreground pointer-events-none">
                      {selectedProduct?.unidade || "un"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleStepQuantity(1)}
                    className="h-11 w-11 rounded-xl shrink-0 border-border/70 hover:bg-amber-500/10 hover:text-amber-300"
                    title={`Aumentar 1 ciclo (+${selectedProductYield} ${selectedProduct?.unidade || "un"})`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* BARRA DE CICLOS DE RECEITA E STEPPERS RÁPIDOS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-muted-foreground">Ciclos da Receita: </span>
                      <strong className="text-foreground font-mono font-bold">
                        {recipeCycles} ciclo(s)
                      </strong>
                      <span className="text-[11px] text-muted-foreground ml-1 font-mono">
                        ({recipeCycles} × {selectedProductYield} {selectedProduct?.unidade || "un"})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground mr-1 hidden sm:inline">Passo:</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStepQuantity(-1)}
                      disabled={numQty <= selectedProductYield}
                      className="h-6 px-2 text-[10px] font-mono rounded-lg border-border/60"
                      title={`-1 ciclo (-${selectedProductYield})`}
                    >
                      -1 ciclo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStepQuantity(1)}
                      className="h-6 px-2 text-[10px] font-mono rounded-lg border-border/60"
                      title={`+1 ciclo (+${selectedProductYield})`}
                    >
                      +1 ciclo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStepQuantity(5)}
                      className="h-6 px-2 text-[10px] font-mono rounded-lg border-border/60 text-amber-300 bg-amber-500/10"
                      title={`+5 ciclos (+${5 * selectedProductYield})`}
                    >
                      +5 ciclos
                    </Button>
                  </div>
                </div>

                {/* ALERTA DE NÃO-MÚLTIPLO E AUTO-CORREÇÃO RÁPIDA */}
                {!isMultiple && selectedProduct && selectedProductYield > 1 && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2 text-amber-300 font-semibold">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <div>
                        <span>
                          <strong>{numQty} {selectedProduct.unidade}</strong> não é múltiplo do rendimento da receita (<strong>{selectedProductYield} {selectedProduct.unidade}</strong> por ciclo).
                        </span>
                        <p className="text-[11px] text-muted-foreground font-normal mt-0.5">
                          Para garantir o consumo correto das receitas, a fabricação deve ser realizada em múltiplos exatos de {selectedProductYield} {selectedProduct.unidade}.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
                      <span className="text-[10px] text-amber-300/80 font-bold uppercase">Ajuste rápido:</span>
                      {Math.floor(numQty / selectedProductYield) * selectedProductYield > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            snapToMultiple(Math.floor(numQty / selectedProductYield) * selectedProductYield)
                          }
                          className="h-6 text-[11px] px-2.5 border-amber-500/40 text-amber-200 hover:bg-amber-500/20 rounded-lg font-mono"
                        >
                          Arredondar para {Math.floor(numQty / selectedProductYield) * selectedProductYield} {selectedProduct.unidade} ({Math.floor(numQty / selectedProductYield)} ciclos)
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          snapToMultiple(Math.ceil(numQty / selectedProductYield) * selectedProductYield)
                        }
                        className="h-6 text-[11px] px-2.5 border-amber-500/40 text-amber-200 hover:bg-amber-500/20 rounded-lg font-mono"
                      >
                        Arredondar para {Math.ceil(numQty / selectedProductYield) * selectedProductYield} {selectedProduct.unidade} ({Math.ceil(numQty / selectedProductYield)} ciclos)
                      </Button>
                    </div>
                  </div>
                )}

                {/* ATALHOS DE LOTES (CICLOS DA RECEITA) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-semibold">Atalhos de Lotes de Produção:</span>
                    <span className="font-mono text-[10px]">
                      1 ciclo = {selectedProductYield} {selectedProduct?.unidade || "un"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[1, 5, 10, 25, 50, 100].map((cycleCount) => {
                      const targetUnits = cycleCount * selectedProductYield;
                      const isSelected = numQty === targetUnits;

                      return (
                        <Button
                          key={cycleCount}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetCycles(cycleCount)}
                          className={cn(
                            "h-7 text-[11px] px-2.5 font-mono rounded-lg transition-all",
                            isSelected
                              ? "border-amber-500/60 bg-amber-500/20 text-amber-300 font-bold shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:border-border/80"
                          )}
                        >
                          {selectedProductYield === 1 ? (
                            <span>+{targetUnits}</span>
                          ) : (
                            <span>
                              <strong className="text-foreground">{cycleCount}x</strong> ({targetUnits} {selectedProduct?.unidade || "un"})
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CARD 2: MATÉRIAS-PRIMAS CONSUMIDAS */}
          <Card className="surface-card border-border/70 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-xs">
                      2
                    </span>
                    <span>Consumo de Matérias-Primas</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Insumos consumidos para fabricar {quantity || 0} {selectedProduct?.unidade || "un"}
                    {selectedProduct && selectedProductYield > 1 && (
                      <span> ({recipeCycles} ciclo(s) de receita)</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {currentProductRecipes.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applyProductRecipe(selectedProductId, quantity)}
                      className="h-8 px-2.5 text-xs text-sky-300 border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 rounded-xl gap-1.5"
                      title="Recalcular matérias-primas pela receita padrão"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Recalcular Receita</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddMaterial()}
                    className="h-8 px-3 text-xs font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Insumo</span>
                  </Button>
                </div>
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
                    const recipeItem = currentProductRecipes.find((r) => r.raw_material_id === item.raw_material_id);

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
                                        (Disp: {Math.round(m.stock_quantity).toLocaleString("pt-BR")} {m.unit})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* QUANTIDADE UTILIZADA */}
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end">
                              <div className="w-32">
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantity_used ? Math.round(item.quantity_used) : ""}
                                  onChange={(e) => {
                                    const parsed = parseInt(e.target.value, 10);
                                    handleUpdateMaterial(index, {
                                      quantity_used: isNaN(parsed) ? 0 : Math.max(0, parsed),
                                    });
                                  }}
                                  placeholder="Qtd"
                                  className="h-9 text-xs font-mono font-bold text-foreground rounded-xl bg-background/50 border-border/70 text-right"
                                />
                              </div>
                              {recipeItem && (
                                <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                  {recipeItem.quantity_required} {mat?.unit || "un"}/ciclo
                                </span>
                              )}
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
                                    Estoque insuficiente! Disponível: {Math.round(mat.stock_quantity).toLocaleString("pt-BR")} {mat.unit}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                  <span className="text-muted-foreground">
                                    Estoque disponível:{" "}
                                    <strong className="text-emerald-400 font-mono">
                                      {Math.round(mat.stock_quantity).toLocaleString("pt-BR")} {mat.unit}
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
                                {Math.max(0, Math.round(mat.stock_quantity - (item.quantity_used || 0))).toLocaleString("pt-BR")}{" "}
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
                  <div className="text-right">
                    <span className="font-mono font-black text-amber-400 text-sm">
                      +{numQty} {selectedProduct?.unidade || "un"}
                    </span>
                    {selectedProduct && selectedProductYield > 1 && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {recipeCycles} ciclo(s) ({selectedProductYield} {selectedProduct.unidade}/ciclo)
                      </p>
                    )}
                  </div>
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
                            -{Math.round(item.quantity_used).toLocaleString("pt-BR")} {mat?.unit || "un"}
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
                disabled={!canProduce || !validation.valid || productionMutation.isPending}
                className={cn(
                  "w-full h-11 text-xs font-black rounded-xl gap-2 transition-all",
                  canProduce
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-lg shadow-amber-500/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                )}
              >
                {!canProduce ? (
                  <>
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    <span>Sem Permissão para Produzir</span>
                  </>
                ) : productionMutation.isPending ? (
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
              {selectedProduct && selectedProductYield > 1 && (
                <span className="text-muted-foreground font-mono">
                  {" "}({recipeCycles} ciclo(s) da receita)
                </span>
              )}
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
                        -{Math.round(item.quantity_used).toLocaleString("pt-BR")} {mat?.unit}
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
