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
  CheckCircle2,
  Loader2,
  Sparkles,
  Info,
  Boxes,
  RotateCcw,
  Clock,
  User,
  Box,
  Layers,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useProducts,
  useRawMaterials,
  useWarehouseStock,
  useProductRecipes,
  useBaus,
  useProductions,
  useMembers,
  nameOf,
} from "@/hooks/useData";
import { executeProduction } from "@/services/productionService";
import { PageHeader, NoAccess, ProductThumbnail } from "@/components/ui-kit";
import { ProductionNavHeader } from "@/components/productions/ProductionNavHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { dateTime, num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/producoes/produzir")({
  component: ProduzirPage,
});

export function ProduzirPage() {
  const { profile, hasPermission, isDevMode, isCeoMode, tagRules } = useAuth();
  const queryClient = useQueryClient();

  const canProduce =
    hasPermission("productions.create") ||
    hasPermission("create_production") ||
    isDevMode ||
    isCeoMode ||
    tagRules?.can_produce !== false;
  const canView =
    canProduce ||
    hasPermission("productions.view") ||
    hasPermission("view_productions");
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";

  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: rawMaterials = [] } = useRawMaterials();
  const { data: warehouseStock = [] } = useWarehouseStock();
  const { data: allRecipes = [] } = useProductRecipes();
  const { data: baus = [] } = useBaus();
  const { data: members = [] } = useMembers();
  const { data: productions = [], isLoading: loadingProductions } = useProductions(30);

  // Estados do formulário simplificado
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [selectedBauId, setSelectedBauId] = useState<string>("armazem");
  const [consumeMaterials, setConsumeMaterials] = useState<boolean>(false);
  const [observation, setObservation] = useState<string>("");

  // Todos os produtos ativos do catálogo podem ser produzidos
  const availableProducts = useMemo(() => {
    return (products ?? []).filter((p) => p.ativo !== false);
  }, [products]);

  const selectedProduct = useMemo(() => {
    return availableProducts.find((p) => p.id === selectedProductId);
  }, [availableProducts, selectedProductId]);

  // Receita cadastrada para o produto (informativa/opcional)
  const productRecipes = useMemo(() => {
    if (!selectedProductId) return [];
    return allRecipes.filter((r) => r.product_id === selectedProductId);
  }, [allRecipes, selectedProductId]);

  const hasRecipe = productRecipes.length > 0;

  // Saldo atual no armazém do produto selecionado
  const currentWarehouseBalance = useMemo(() => {
    if (!selectedProductId) return 0;
    const wh = warehouseStock.find((w) => w.product_id === selectedProductId);
    return wh ? Number(wh.quantity || 0) : Number(selectedProduct?.estoque_atual || 0);
  }, [warehouseStock, selectedProductId, selectedProduct]);

  // Se houver apenas 1 produto disponível, seleciona automaticamente
  useEffect(() => {
    if (!selectedProductId && availableProducts.length === 1) {
      setSelectedProductId(availableProducts[0].id);
    }
  }, [availableProducts, selectedProductId]);

  const numQty = Math.max(1, parseInt(quantity, 10) || 1);

  // Insumos calculados se o usuário optar por abater matérias-primas
  const calculatedMaterials = useMemo(() => {
    if (!hasRecipe || !consumeMaterials) return [];
    const prodYield = Math.max(1, Number(selectedProduct?.production_yield || 1));
    const factor = numQty / prodYield;

    return productRecipes.map((r) => ({
      raw_material_id: r.raw_material_id,
      quantity_used: Math.max(1, Math.round(Number(r.quantity_required || 1) * factor)),
    }));
  }, [hasRecipe, consumeMaterials, numQty, selectedProduct, productRecipes]);

  // Mutação para registrar a produção
  const productionMutation = useMutation({
    mutationFn: async () => {
      if (!canProduce) {
        throw new Error("Você não possui permissão para registrar produções.");
      }
      if (!selectedProductId) {
        throw new Error("Selecione o produto que foi produzido.");
      }
      if (numQty <= 0) {
        throw new Error("Informe uma quantidade válida produzida.");
      }

      return executeProduction({
        productId: selectedProductId,
        quantity: numQty,
        rawMaterials: consumeMaterials ? calculatedMaterials : [],
        observation: observation.trim() || undefined,
        bauId: selectedBauId !== "armazem" ? selectedBauId : undefined,
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Produção de +${res.quantity}x ${res.product_name} registrada com sucesso!`
      );
      void queryClient.invalidateQueries({ queryKey: ["productions"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["baus"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["stock_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });

      setQuantity("1");
      setObservation("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao registrar produção.");
    },
  });

  // Métricas do dia (produções de hoje)
  const todayStr = new Date().toISOString().slice(0, 10);
  const productionsToday = useMemo(() => {
    return (productions || []).filter((p) => {
      return typeof p.created_at === "string" && p.created_at.startsWith(todayStr);
    });
  }, [productions, todayStr]);

  const totalUnitsToday = useMemo(() => {
    return productionsToday.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  }, [productionsToday]);

  if (!canView && !canProduce) {
    return <NoAccess message="Você não possui permissão para acessar a Estação de Produção." />;
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* MODO SOMENTE LEITURA BANNER */}
      {!canProduce && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
          <Info className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>Modo de Leitura:</strong> Seu cargo permite consultar o histórico de produções, mas não registrar novas ordens.
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
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-mono text-[10px] uppercase font-bold"
              >
                Registro Simplificado
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Registre o que foi produzido e abasteça o estoque da facção com agilidade e transparência.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
            <Link to={`${prefix}/vendas`}>
              <ShoppingCart className="h-4 w-4 text-emerald-400" />
              <span>Ir para Vendas</span>
            </Link>
          </Button>
          <ProductionNavHeader currentTab="produzir" />
        </div>
      </div>

      {/* DASHBOARD PRINCIPAL (GRID 2 COLUNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: FORMULÁRIO DE REGISTRO RÁPIDO */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="surface-card border-border/70 overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Registrar O que Foi Produzido</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Selecione o produto, informe a quantidade produzida e confirme a entrada no estoque.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* 1. SELEÇÃO DO PRODUTO */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Produto Produzido *</span>
                  {selectedProduct && (
                    <span className="text-[11px] font-normal text-muted-foreground">
                      Unidade: <strong className="text-foreground">{selectedProduct.unidade}</strong>
                    </span>
                  )}
                </Label>

                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/70 text-xs font-medium">
                    <SelectValue placeholder="Selecione o produto produzido..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {loadingProducts ? (
                      <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Carregando catálogo...</span>
                      </div>
                    ) : availableProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        Nenhum produto ativo cadastrado no catálogo.
                      </div>
                    ) : (
                      availableProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs py-2">
                          <div className="flex items-center gap-2.5">
                            <ProductThumbnail src={p.imagem_url} alt={p.nome} className="h-6 w-6 rounded-md" />
                            <span className="font-bold text-foreground">{p.nome}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              ({p.unidade}) · Estoque: {num(p.estoque_atual || 0)}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* DETALHES DO PRODUTO SELECIONADO */}
                {selectedProduct && (
                  <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <ProductThumbnail
                        src={selectedProduct.imagem_url}
                        alt={selectedProduct.nome}
                        className="h-10 w-10 rounded-xl shrink-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-foreground">{selectedProduct.nome}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {hasRecipe ? `Receita cadastrada (${productRecipes.length} insumos)` : "Sem receita obrigatória"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Saldo Atual</span>
                      <p className="text-sm font-black font-mono text-emerald-400">
                        {num(currentWarehouseBalance)} {selectedProduct.unidade}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. QUANTIDADE PRODUZIDA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Boxes className="h-3.5 w-3.5 text-amber-400" />
                    <span>Quantidade Produzida *</span>
                  </Label>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Total: {numQty} {selectedProduct?.unidade || "un"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(String(Math.max(1, numQty - 1)))}
                    disabled={numQty <= 1}
                    className="h-11 w-11 rounded-xl shrink-0 border-border/70 hover:bg-amber-500/10 cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <div className="relative flex-1">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuantity(val ? String(Math.max(1, parseInt(val, 10) || 1)) : "");
                      }}
                      placeholder="1"
                      className="h-11 text-base font-mono font-bold rounded-xl bg-background/50 border-border/70 text-center sm:text-left sm:pl-4 text-amber-300 pr-12"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-muted-foreground pointer-events-none">
                      {selectedProduct?.unidade || "un"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(String(numQty + 1))}
                    className="h-11 w-11 rounded-xl shrink-0 border-border/70 hover:bg-amber-500/10 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* BOTÕES RÁPIDOS DE QUANTIDADE */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground mr-1 font-medium">Atalhos rápidos:</span>
                  {[1, 5, 10, 25, 50, 100].map((step) => (
                    <Button
                      key={step}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(String(step))}
                      className={cn(
                        "h-7 text-xs px-2.5 font-mono rounded-lg transition-all cursor-pointer",
                        numQty === step
                          ? "border-amber-500/60 bg-amber-500/20 text-amber-300 font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {step}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(String(numQty + 10))}
                    className="h-7 text-xs px-2 font-mono text-amber-400 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                  >
                    +10
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(String(numQty + 50))}
                    className="h-7 text-xs px-2 font-mono text-amber-400 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                  >
                    +50
                  </Button>
                </div>
              </div>

              {/* 3. DESTINO DO ESTOQUE */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Destino do Estoque</Label>
                <Select value={selectedBauId} onValueChange={setSelectedBauId}>
                  <SelectTrigger className="h-10 rounded-xl bg-background/50 border-border/70 text-xs">
                    <SelectValue placeholder="Selecione o local de entrada..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="armazem" className="text-xs">
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="font-semibold">Armazém Geral da Facção</span>
                      </div>
                    </SelectItem>
                    {baus.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <Box className="h-3.5 w-3.5 text-amber-400" />
                          <span>{b.nome}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 4. INSUMOS / RECEITA (OPCIONAL E NÃO-BLOQUEANTE) */}
              {hasRecipe && (
                <div className="p-3.5 rounded-2xl bg-secondary/20 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-sky-400" />
                      <div>
                        <Label htmlFor="toggle-consume" className="text-xs font-semibold text-foreground cursor-pointer">
                          Abater Matérias-Primas do Armazém
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Opcional: Deduz insumos cadastrados na receita se houver estoque
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="toggle-consume"
                      checked={consumeMaterials}
                      onCheckedChange={setConsumeMaterials}
                    />
                  </div>

                  {consumeMaterials && (
                    <div className="space-y-2 pt-2 border-t border-border/40 text-xs animate-in fade-in duration-200">
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        Insumos a abater para produzir {numQty} {selectedProduct?.unidade || "un"}:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {calculatedMaterials.map((matItem) => {
                          const mat = rawMaterials.find((m) => m.id === matItem.raw_material_id);
                          const avail = Number(mat?.stock_quantity || 0);
                          const isLow = avail < matItem.quantity_used;

                          return (
                            <div
                              key={matItem.raw_material_id}
                              className={cn(
                                "p-2 rounded-xl border text-xs flex items-center justify-between",
                                isLow
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                  : "bg-secondary/40 border-border/40 text-foreground"
                              )}
                            >
                              <span className="font-medium truncate">{mat?.name || "Insumo"}</span>
                              <span className="font-mono font-bold shrink-0 ml-2">
                                -{matItem.quantity_used} {mat?.unit || "un"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. OBSERVAÇÕES (OPCIONAL) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Observação (Opcional)</Label>
                <Textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex: Farm da madrugada, ação de abastecimento, pedido do cliente..."
                  className="text-xs rounded-xl bg-background/50 border-border/70 min-h-[60px] resize-none"
                />
              </div>

              {/* BOTÃO PRINCIPAL DE ENVIO */}
              <Button
                type="button"
                size="lg"
                disabled={productionMutation.isPending || !selectedProductId || numQty <= 0 || !canProduce}
                onClick={() => productionMutation.mutate()}
                className="w-full h-12 rounded-xl bg-gradient-brand text-slate-950 font-black text-sm tracking-wide gap-2 shadow-lg shadow-primary/20 hover:opacity-95 cursor-pointer"
              >
                {productionMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-950" />
                )}
                <span>
                  {selectedProduct
                    ? `Registrar Produção (+${numQty} ${selectedProduct.unidade})`
                    : "Registrar Produção"}
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: FEED DE HISTÓRICO RECENTE & MÉTRICAS */}
        <div className="lg:col-span-5 space-y-6">
          {/* MÉTRICAS RÁPIDAS DO DIA */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="surface-card border-border/70 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Produzido Hoje
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                +{num(totalUnitsToday)}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">unidades registradas hoje</p>
            </Card>

            <Card className="surface-card border-border/70 p-4 rounded-2xl">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Registros Hoje
              </span>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                {productionsToday.length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">lotes fabricados</p>
            </Card>
          </div>

          {/* HISTÓRICO DE PRODUÇÕES RECENTES */}
          <Card className="surface-card border-border/70 overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/40 pb-3 bg-muted/10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-sky-400" />
                  <span>Últimas Produções Registradas</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Entradas recentes de produção no sistema
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                {productions.length} registros
              </Badge>
            </CardHeader>

            <CardContent className="p-3">
              {loadingProductions ? (
                <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                  <span>Carregando produções...</span>
                </div>
              ) : productions.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                  <Boxes className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <p className="font-semibold text-foreground">Nenhuma produção recente</p>
                  <p className="text-[11px]">As produções registradas aparecerão aqui em tempo real.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[540px] overflow-y-auto mobile-touch-scroll pr-1">
                  {productions.slice(0, 15).map((prod) => {
                    const pItem =
                      prod.product ||
                      availableProducts.find((x) => x.id === prod.product_id);
                    const authorName = nameOf(members, prod.user_id) || "Integrante";

                    return (
                      <div
                        key={prod.id}
                        className="p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/35 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <ProductThumbnail
                              src={pItem?.imagem_url}
                              alt={pItem?.nome || "Item"}
                              className="h-7 w-7 rounded-lg shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-foreground block truncate">
                                {pItem?.nome || "Item Fabricado"}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{authorName}</span>
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs font-mono font-bold">
                              +{prod.quantity} {pItem?.unidade || "un"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                          <span className="truncate max-w-[200px]">
                            {prod.observation || "Entrada de produção"}
                          </span>
                          <span className="font-mono shrink-0">
                            {prod.created_at ? dateTime(prod.created_at) : "Recente"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
