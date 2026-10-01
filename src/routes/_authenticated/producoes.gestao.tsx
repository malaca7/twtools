import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PackageCheck,
  Factory,
  Warehouse,
  Boxes,
  ShoppingCart,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Sliders,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Calendar,
  Clock,
  User,
  History,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  TrendingUp,
  BarChart3,
  Check,
  X,
  Tag,
  Settings,
  Shield,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useProducts,
  useRawMaterials,
  useProductions,
  useWarehouseStock,
  useWarehouseMovements,
  useSales,
  useCategories,
  useMembers,
  nameOf,
} from "@/hooks/useData";
import {
  createRawMaterial,
  updateRawMaterial,
  adjustRawMaterialStock,
  updateProductProductionSettings,
} from "@/services/productionService";
import { createProduct, updateProduct } from "@/lib/app-api";
import { PageHeader, NoAccess, ProductThumbnail } from "@/components/ui-kit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { RawMaterial, Product, Production, WarehouseMovement } from "@/lib/app-types";

export const Route = createFileRoute("/_authenticated/producoes/gestao")({
  component: GestaoProducaoPage,
});

export function GestaoProducaoPage() {
  const { hasPermission, isDevUser, isDevMode, isCeoMode } = useAuth();
  const queryClient = useQueryClient();
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";

  const canAccess =
    isDevUser ||
    hasPermission("production_management.view") ||
    hasPermission("view_production_management") ||
    hasPermission("manage_products");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [periodFilter, setPeriodFilter] = useState<"all" | "today" | "7days" | "30days">("all");

  // Dados
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: rawMaterials = [], isLoading: loadingMaterials } = useRawMaterials();
  const { data: productions = [], isLoading: loadingProductions } = useProductions(200);
  const { data: warehouseStock = [] } = useWarehouseStock();
  const { data: movements = [], isLoading: loadingMovements } = useWarehouseMovements(undefined, 200);
  const { data: sales = [] } = useSales();
  const { data: categories = [] } = useCategories();
  const { data: members = [] } = useMembers();

  // Estados de Busca e Filtros
  const [productSearch, setProductSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [productionSearch, setProductionSearch] = useState("");
  const [movementSearch, setMovementSearch] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("all");

  // Modais de Matéria-Prima
  const [isNewMaterialOpen, setIsNewMaterialOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [materialName, setMaterialName] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [materialUnit, setMaterialUnit] = useState("un");
  const [materialStock, setMaterialStock] = useState("0");

  // Modal Ajuste de Estoque de Matéria-Prima
  const [adjustingMaterial, setAdjustingMaterial] = useState<RawMaterial | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<string>("10");
  const [adjustReason, setAdjustReason] = useState<string>("");

  // Modal de Produto (Configurações de Produção & Venda)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodCanProduce, setProdCanProduce] = useState(true);
  const [prodCanSell, setProdCanSell] = useState(true);
  const [prodIsActive, setProdIsActive] = useState(true);

  // Filtro temporal para produções e vendas
  const filteredProductionsByPeriod = useMemo(() => {
    if (periodFilter === "all") return productions;
    const now = new Date().getTime();
    return productions.filter((p) => {
      const pTime = new Date(p.created_at).getTime();
      const diffHours = (now - pTime) / (1000 * 3600);
      if (periodFilter === "today") return diffHours <= 24;
      if (periodFilter === "7days") return diffHours <= 24 * 7;
      if (periodFilter === "30days") return diffHours <= 24 * 30;
      return true;
    });
  }, [productions, periodFilter]);

  // Métricas do Dashboard
  const dashboardMetrics = useMemo(() => {
    const totalProduced = productions.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const periodProduced = filteredProductionsByPeriod.reduce(
      (sum, p) => sum + Number(p.quantity || 0),
      0
    );
    const totalInWarehouse = warehouseStock.reduce((sum, w) => sum + Number(w.quantity || 0), 0);
    const totalSaleAvailable = products.reduce(
      (sum, p) => sum + Number(p.sale_available_quantity || 0),
      0
    );
    const totalSold = sales
      .filter((s) => s.status !== "estornada")
      .reduce((sum, s) => sum + Number(s.quantity || 0), 0);

    const totalRawMaterialsConsumed = productions.reduce((sum, p) => {
      return (
        sum +
        (p.consumed_materials || []).reduce(
          (matSum, m) => matSum + Number(m.quantity_used || 0),
          0
        )
      );
    }, 0);

    return {
      totalProduced,
      periodProduced,
      totalInWarehouse,
      totalSaleAvailable,
      totalSold,
      totalRawMaterialsConsumed,
      activeProductsCount: products.filter((p) => p.ativo).length,
      producibleCount: products.filter((p) => p.ativo && p.can_be_produced !== false).length,
      saleableCount: products.filter((p) => p.ativo && p.can_be_sold !== false).length,
    };
  }, [productions, filteredProductionsByPeriod, warehouseStock, products, sales]);

  // MUTAÇÃO: Salvar Matéria-Prima (Criar ou Editar)
  const saveMaterialMutation = useMutation({
    mutationFn: async () => {
      if (!materialName.trim()) throw new Error("Informe o nome da matéria-prima.");
      if (!materialUnit.trim()) throw new Error("Informe a unidade da matéria-prima.");

      if (editingMaterial) {
        await updateRawMaterial(editingMaterial.id, {
          name: materialName.trim(),
          description: materialDesc.trim() || null,
          unit: materialUnit.trim(),
        });
      } else {
        await createRawMaterial({
          name: materialName.trim(),
          description: materialDesc.trim() || undefined,
          unit: materialUnit.trim(),
          stock_quantity: Math.max(0, parseFloat(materialStock) || 0),
        });
      }
    },
    onSuccess: () => {
      toast.success(
        editingMaterial
          ? "Matéria-prima atualizada com sucesso!"
          : "Matéria-prima cadastrada com sucesso!"
      );
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      setIsNewMaterialOpen(false);
      setEditingMaterial(null);
      setMaterialName("");
      setMaterialDesc("");
      setMaterialStock("0");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar matéria-prima.");
    },
  });

  // MUTAÇÃO: Ajustar Estoque de Matéria-Prima
  const adjustMaterialMutation = useMutation({
    mutationFn: async () => {
      if (!adjustingMaterial) return;
      const numDelta = parseFloat(adjustDelta);
      if (isNaN(numDelta) || numDelta === 0) {
        throw new Error("Informe uma variação de quantidade válida.");
      }
      if (!adjustReason.trim()) throw new Error("O motivo do ajuste é obrigatório.");

      return adjustRawMaterialStock(adjustingMaterial.id, numDelta, adjustReason.trim());
    },
    onSuccess: () => {
      toast.success("Estoque de matéria-prima ajustado com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      setAdjustingMaterial(null);
      setAdjustDelta("10");
      setAdjustReason("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao ajustar estoque de matéria-prima.");
    },
  });

  // MUTAÇÃO: Alternar Status Ativo da Matéria-Prima
  const toggleMaterialActiveMutation = useMutation({
    mutationFn: async (mat: RawMaterial) => {
      await updateRawMaterial(mat.id, { is_active: !mat.is_active });
    },
    onSuccess: () => {
      toast.success("Status da matéria-prima alterado.");
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao alterar status.");
    },
  });

  // MUTAÇÃO: Salvar Configurações do Produto
  const saveProductSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!editingProduct) return;
      await updateProductProductionSettings(editingProduct.id, {
        can_be_produced: prodCanProduce,
        can_be_sold: prodCanSell,
        ativo: prodIsActive,
      });
    },
    onSuccess: () => {
      toast.success("Configurações do produto atualizadas com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      setEditingProduct(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar configurações do produto.");
    },
  });

  if (!canAccess) {
    return <NoAccess message="Você não possui permissão para acessar a Gestão de Produção." />;
  }

  return (
    <div className="space-y-6 w-full max-w-full pb-12 animate-in fade-in duration-300">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Gestão de Produção & Fábrica
              </h1>
              <Badge variant="outline" className="bg-sky-500/10 text-sky-300 border-sky-500/30 font-mono text-[10px] uppercase font-bold">
                Painel Administrativo
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Supervisão central de matérias-primas, parâmetros de catálogo, histórico de lotes e auditoria de armazém
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-10 px-3 rounded-xl text-xs gap-1.5">
            <Link to={`${prefix}/producoes/produzir`}>
              <Factory className="h-4 w-4 text-amber-400" />
              <span>Estação Produzir</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10 px-3 rounded-xl text-xs gap-1.5">
            <Link to={`${prefix}/producoes/armazem`}>
              <Warehouse className="h-4 w-4 text-emerald-400" />
              <span>Ver Armazém</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10 px-3 rounded-xl text-xs gap-1.5">
            <Link to={`${prefix}/vendas`}>
              <ShoppingCart className="h-4 w-4 text-amber-400" />
              <span>Ir para Vendas</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ABAS CENTRAIS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-secondary/40 border border-border/60 p-1 rounded-2xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="dashboard" className="gap-2 rounded-xl text-xs font-bold py-2">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2 rounded-xl text-xs font-bold py-2">
            <Boxes className="h-3.5 w-3.5" />
            <span>Produtos ({products.length})</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="gap-2 rounded-xl text-xs font-bold py-2">
            <Layers className="h-3.5 w-3.5" />
            <span>Matérias-Primas ({rawMaterials.length})</span>
          </TabsTrigger>
          <TabsTrigger value="productions" className="gap-2 rounded-xl text-xs font-bold py-2">
            <Factory className="h-3.5 w-3.5" />
            <span>Produções ({productions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2 rounded-xl text-xs font-bold py-2">
            <History className="h-3.5 w-3.5" />
            <span>Movimentações Armazém ({movements.length})</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 rounded-xl text-xs font-bold py-2">
            <Settings className="h-3.5 w-3.5" />
            <span>Configurações</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================================================== */}
        {/* ABA 1: DASHBOARD */}
        {/* ==================================================== */}
        <TabsContent value="dashboard" className="space-y-5">
          {/* FILTRO DE PERÍODO */}
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">Período de Análise:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: "all", label: "Todo o Período" },
                  { id: "30days", label: "Últimos 30 Dias" },
                  { id: "7days", label: "Últimos 7 Dias" },
                  { id: "today", label: "Hoje (24h)" },
                ] as const
              ).map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant={periodFilter === p.id ? "default" : "outline"}
                  onClick={() => setPeriodFilter(p.id)}
                  className={cn(
                    "h-7 text-[11px] rounded-lg px-2.5",
                    periodFilter === p.id && "bg-sky-500 hover:bg-sky-600 text-white font-bold"
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* INDICADORES DO DASHBOARD */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <Card className="surface-card border-border/60 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Produzido</span>
              <p className="text-2xl font-black text-amber-400 font-mono mt-1">
                {dashboardMetrics.totalProduced.toLocaleString("pt-BR")}
              </p>
              <span className="text-[10px] text-muted-foreground">Itens fabricados</span>
            </Card>

            <Card className="surface-card border-border/60 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Produção Período</span>
              <p className="text-2xl font-black text-sky-400 font-mono mt-1">
                {dashboardMetrics.periodProduced.toLocaleString("pt-BR")}
              </p>
              <span className="text-[10px] text-muted-foreground">No filtro selecionado</span>
            </Card>

            <Card className="surface-card border-border/60 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Em Armazém</span>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {dashboardMetrics.totalInWarehouse.toLocaleString("pt-BR")}
              </p>
              <span className="text-[10px] text-muted-foreground">Estoque não distribuído</span>
            </Card>

            <Card className="surface-card border-border/60 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Disp. p/ Venda</span>
              <p className="text-2xl font-black text-amber-300 font-mono mt-1">
                {dashboardMetrics.totalSaleAvailable.toLocaleString("pt-BR")}
              </p>
              <span className="text-[10px] text-muted-foreground">Liberados no balcão</span>
            </Card>

            <Card className="surface-card border-border/60 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Vendido</span>
              <p className="text-2xl font-black text-foreground font-mono mt-1">
                {dashboardMetrics.totalSold.toLocaleString("pt-BR")}
              </p>
              <span className="text-[10px] text-muted-foreground">Vendas concluídas</span>
            </Card>

            <Card className="surface-card border-border/60 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Consumo Insumos</span>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">
                {dashboardMetrics.totalRawMaterialsConsumed.toLocaleString("pt-BR")}
              </p>
              <span className="text-[10px] text-muted-foreground">Matérias baixadas</span>
            </Card>
          </div>

          {/* VISÃO GRÁFICA / STATUS DO CATÁLOGO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="surface-card border-border/70 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-primary" />
                  <span>Configuração do Catálogo</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {dashboardMetrics.activeProductsCount} Itens Ativos
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <span className="text-muted-foreground">Produtos Habilitados para Produção:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {dashboardMetrics.producibleCount} de {products.length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <span className="text-muted-foreground">Produtos Habilitados para Venda:</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    {dashboardMetrics.saleableCount} de {products.length}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 text-[11px] text-muted-foreground space-y-1">
                  <p className="font-bold text-foreground">Regra de Venda Independente:</p>
                  <p>
                    A permissão de venda é configurada individualmente. Um produto pode ser produzido para estocagem interna sem estar disponível para venda.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="surface-card border-border/70 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  <span>Níveis de Matérias-Primas</span>
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {rawMaterials.length} Insumos
                </Badge>
              </div>

              <div className="space-y-2">
                {rawMaterials.slice(0, 5).map((mat) => {
                  const isLow = Number(mat.stock_quantity) <= 10;
                  return (
                    <div
                      key={mat.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 text-xs"
                    >
                      <span className="font-medium text-foreground">{mat.name}</span>
                      <span
                        className={cn(
                          "font-mono font-bold",
                          isLow ? "text-rose-400" : "text-emerald-400"
                        )}
                      >
                        {mat.stock_quantity.toLocaleString("pt-BR")} {mat.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ==================================================== */}
        {/* ABA 2: GERENCIAMENTO DE PRODUTOS */}
        {/* ==================================================== */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto por nome..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Defina se cada item pode ser <strong>produzido</strong> e se pode ser <strong>vendido</strong>.
            </p>
          </div>

          <Card className="surface-card border-border/70 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                      <th className="p-3.5 pl-5">Produto</th>
                      <th className="p-3.5">Categoria</th>
                      <th className="p-3.5 text-center">Permite Produção</th>
                      <th className="p-3.5 text-center">Permite Venda</th>
                      <th className="p-3.5 text-center">Status Geral</th>
                      <th className="p-3.5 pr-5 text-right">Configurações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {products
                      .filter((p) =>
                        !productSearch || p.nome.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .map((prod) => {
                        const canProduce = prod.can_be_produced !== false;
                        const canSell = prod.can_be_sold !== false;
                        const cat = categories.find((c) => c.id === prod.categoria_id);

                        return (
                          <tr key={prod.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-3.5 pl-5">
                              <div className="flex items-center gap-3">
                                <ProductThumbnail
                                  src={prod.imagem_url}
                                  alt={prod.nome}
                                  className="h-10 w-10 rounded-xl shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-foreground">{prod.nome}</p>
                                  <span className="text-[11px] text-muted-foreground font-mono">
                                    Un: {prod.unidade}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 text-muted-foreground">
                              {cat?.nome || "Sem Categoria"}
                            </td>

                            <td className="p-3.5 text-center">
                              {canProduce ? (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-500/10 text-amber-300 border-amber-500/30 font-bold"
                                >
                                  Sim (Produzível)
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                                >
                                  Bloqueado
                                </Badge>
                              )}
                            </td>

                            <td className="p-3.5 text-center">
                              {canSell ? (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                                >
                                  Sim (Liberado)
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                                >
                                  Uso Interno
                                </Badge>
                              )}
                            </td>

                            <td className="p-3.5 text-center">
                              {prod.ativo ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Ativo</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                                  <X className="h-3.5 w-3.5" />
                                  <span>Inativo</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 pr-5 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setProdCanProduce(prod.can_be_produced !== false);
                                  setProdCanSell(prod.can_be_sold !== false);
                                  setProdIsActive(prod.ativo !== false);
                                }}
                                className="h-7 px-2.5 text-xs rounded-lg gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Configurar</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================== */}
        {/* ABA 3: MATÉRIAS-PRIMAS */}
        {/* ==================================================== */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar matéria-prima..."
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
              />
            </div>

            <Button
              onClick={() => {
                setEditingMaterial(null);
                setMaterialName("");
                setMaterialDesc("");
                setMaterialUnit("kg");
                setMaterialStock("0");
                setIsNewMaterialOpen(true);
              }}
              className="h-9 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Matéria-Prima</span>
            </Button>
          </div>

          <Card className="surface-card border-border/70 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                      <th className="p-3.5 pl-5">Matéria-Prima</th>
                      <th className="p-3.5">Descrição</th>
                      <th className="p-3.5 text-right font-mono">Estoque Atual</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 pr-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {rawMaterials
                      .filter((m) =>
                        !materialSearch || m.name.toLowerCase().includes(materialSearch.toLowerCase())
                      )
                      .map((mat) => (
                        <tr key={mat.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3.5 pl-5 font-bold text-foreground">
                            {mat.name}
                          </td>

                          <td className="p-3.5 text-muted-foreground max-w-md truncate">
                            {mat.description || "—"}
                          </td>

                          <td className="p-3.5 text-right font-mono font-black text-emerald-400">
                            {mat.stock_quantity.toLocaleString("pt-BR")}{" "}
                            <span className="text-[10px] text-muted-foreground font-normal">
                              {mat.unit}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => toggleMaterialActiveMutation.mutate(mat)}
                              className="cursor-pointer"
                            >
                              {mat.is_active ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-zinc-500 text-[10px]">
                                  Inativa
                                </Badge>
                              )}
                            </button>
                          </td>

                          <td className="p-3.5 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* AJUSTAR ESTOQUE */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAdjustingMaterial(mat);
                                  setAdjustDelta("10");
                                  setAdjustReason("");
                                }}
                                className="h-7 px-2 text-[11px] font-bold text-amber-300 border-amber-500/30 bg-amber-500/10 rounded-lg gap-1"
                              >
                                <ArrowRightLeft className="h-3 w-3" />
                                <span>Ajustar</span>
                              </Button>

                              {/* EDITAR */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMaterial(mat);
                                  setMaterialName(mat.name);
                                  setMaterialDesc(mat.description || "");
                                  setMaterialUnit(mat.unit);
                                  setIsNewMaterialOpen(true);
                                }}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================== */}
        {/* ABA 4: HISTÓRICO DE PRODUÇÕES */}
        {/* ==================================================== */}
        <TabsContent value="productions" className="space-y-4">
          <Card className="surface-card border-border/70 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Factory className="h-4 w-4 text-amber-400" />
                <span>Auditoria Cronológica de Lotes Produzidos</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                      <th className="p-3 pl-5">Data/Hora</th>
                      <th className="p-3">Operador</th>
                      <th className="p-3">Produto</th>
                      <th className="p-3 text-right">Qtd Fabricada</th>
                      <th className="p-3">Matérias-Primas Consumidas</th>
                      <th className="p-3 pr-5">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {productions.map((p) => {
                      const operatorName = nameOf(members, p.user_id);
                      return (
                        <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-3 pl-5 font-mono text-muted-foreground whitespace-nowrap">
                            {new Date(p.created_at).toLocaleString("pt-BR")}
                          </td>

                          <td className="p-3 whitespace-nowrap font-medium text-foreground">
                            {operatorName}
                          </td>

                          <td className="p-3 font-bold text-foreground">
                            {p.product?.nome || "Produto"}
                          </td>

                          <td className="p-3 text-right font-mono font-black text-amber-300">
                            +{p.quantity} {p.product?.unidade || "un"}
                          </td>

                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {(p.consumed_materials || []).map((c, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-[10px] font-mono bg-rose-500/10 text-rose-300 border-rose-500/20"
                                >
                                  {c.raw_material?.name || "Insumo"}: -{c.quantity_used}{" "}
                                  {c.raw_material?.unit || "un"}
                                </Badge>
                              ))}
                            </div>
                          </td>

                          <td className="p-3 pr-5 text-muted-foreground max-w-xs truncate">
                            {p.observation || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================== */}
        {/* ABA 5: MOVIMENTAÇÕES DO ARMAZÉM */}
        {/* ==================================================== */}
        <TabsContent value="movements" className="space-y-4">
          <Card className="surface-card border-border/70 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <span>Histórico Completo do Armazém</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                      <th className="p-3 pl-5">Data/Hora</th>
                      <th className="p-3">Operação</th>
                      <th className="p-3">Produto</th>
                      <th className="p-3">Origem &rarr; Destino</th>
                      <th className="p-3 text-right">Qtd</th>
                      <th className="p-3 pr-5 text-right font-mono">Saldo Resultante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 pl-5 font-mono text-muted-foreground">
                          {new Date(m.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {m.type}
                          </Badge>
                        </td>
                        <td className="p-3 font-bold text-foreground">{m.product?.nome}</td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">
                          {m.source} &rarr; {m.destination}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-foreground">
                          {m.quantity}
                        </td>
                        <td className="p-3 pr-5 text-right font-mono font-black text-emerald-400">
                          {m.resulting_balance}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================== */}
        {/* ABA 6: CONFIGURAÇÕES E DIRETRIZES */}
        {/* ==================================================== */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="surface-card border-border/70 p-5 rounded-2xl space-y-4">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              <span>Políticas & Diretrizes do Ciclo de Produção</span>
            </CardTitle>
            <div className="space-y-3 text-xs text-muted-foreground">
              <p>
                <strong>1. Fluxo Integrado:</strong> Matéria-Prima &rarr; Produzir &rarr; Armazém &rarr; Baú ou Venda.
              </p>
              <p>
                <strong>2. Validação Transacional (ACID):</strong> Toda alteração de estoque roda em transações protegidas com row locks no Postgres. Quantidades negativas são rigorosamente rejeitadas.
              </p>
              <p>
                <strong>3. Independência Comercial:</strong> Produtos com <code>can_be_sold = false</code> nunca aparecerão para venda na tela comercial, servindo exclusivamente para logística interna.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================================================== */}
      {/* MODAL: CRIAR / EDITAR MATÉRIA-PRIMA */}
      {/* ==================================================== */}
      <Dialog open={isNewMaterialOpen} onOpenChange={setIsNewMaterialOpen}>
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground">
              {editingMaterial ? "Editar Matéria-Prima" : "Cadastrar Nova Matéria-Prima"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome da Matéria-Prima *</Label>
              <Input
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Ex: Pólvora Refinada"
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Unidade de Medida *</Label>
              <Input
                value={materialUnit}
                onChange={(e) => setMaterialUnit(e.target.value)}
                placeholder="Ex: kg, un, L, g"
                className="text-xs rounded-xl"
              />
            </div>

            {!editingMaterial && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estoque Inicial (&ge; 0)</Label>
                <Input
                  type="number"
                  min="0"
                  value={materialStock}
                  onChange={(e) => setMaterialStock(e.target.value)}
                  className="text-xs rounded-xl font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição / Utilidade</Label>
              <Textarea
                value={materialDesc}
                onChange={(e) => setMaterialDesc(e.target.value)}
                placeholder="Ex: Insumo utilizado para fabricação de munição e coletes"
                className="text-xs rounded-xl min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewMaterialOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => saveMaterialMutation.mutate()}
              disabled={saveMaterialMutation.isPending || !materialName.trim()}
              className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl"
            >
              {saveMaterialMutation.isPending ? "Salvando..." : "Salvar Matéria-Prima"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL: AJUSTAR ESTOQUE DE MATÉRIA-PRIMA */}
      {/* ==================================================== */}
      <Dialog
        open={Boolean(adjustingMaterial)}
        onOpenChange={(open) => !open && setAdjustingMaterial(null)}
      >
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground">
              Ajustar Estoque de Insumo
            </DialogTitle>
            <DialogDescription className="text-xs">
              Item: <strong className="text-foreground">{adjustingMaterial?.name}</strong> · Estoque atual:{" "}
              <span className="font-mono text-emerald-400 font-bold">
                {adjustingMaterial?.stock_quantity} {adjustingMaterial?.unit}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Variação de Estoque (Positivo para entrada, negativo para saída) *
              </Label>
              <Input
                type="number"
                step="any"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                placeholder="Ex: 50 ou -20"
                className="text-base font-mono font-bold text-amber-300 rounded-xl"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[10, 50, 100, -10, -50].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustDelta(String(d))}
                    className="h-6 text-[10px] px-2 font-mono rounded-lg"
                  >
                    {d > 0 ? `+${d}` : d}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo Oficial do Ajuste *</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ex: Compra de matéria-prima ou descarte por validade"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAdjustingMaterial(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => adjustMaterialMutation.mutate()}
              disabled={adjustMaterialMutation.isPending || !adjustReason.trim()}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
            >
              {adjustMaterialMutation.isPending ? "Ajustando..." : "Confirmar Ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL: CONFIGURAR PRODUTO (PRODUÇÃO & VENDA) */}
      {/* ==================================================== */}
      <Dialog
        open={Boolean(editingProduct)}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground">
              Configurações de Produção & Venda
            </DialogTitle>
            <DialogDescription className="text-xs">
              Produto: <strong className="text-foreground">{editingProduct?.nome}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* PERMITIR PRODUÇÃO */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/30 border border-border/60">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground cursor-pointer">
                  Permitir Produção
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Se ativado, este item aparecerá na tela de Estação de Produção.
                </p>
              </div>
              <Switch checked={prodCanProduce} onCheckedChange={setProdCanProduce} />
            </div>

            {/* PERMITIR VENDA */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/30 border border-border/60">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground cursor-pointer">
                  Permitir Venda Comercial
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Se ativado, o item poderá ser vendido no balcão quando tiver saldo liberado.
                </p>
              </div>
              <Switch checked={prodCanSell} onCheckedChange={setProdCanSell} />
            </div>

            {/* ATIVO NO SISTEMA */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/30 border border-border/60">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground cursor-pointer">
                  Produto Ativo no Catálogo Geral
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Desative para arquivar o produto globalmente na plataforma.
                </p>
              </div>
              <Switch checked={prodIsActive} onCheckedChange={setProdIsActive} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingProduct(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => saveProductSettingsMutation.mutate()}
              disabled={saveProductSettingsMutation.isPending}
              className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl"
            >
              {saveProductSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
