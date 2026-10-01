import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Warehouse,
  Boxes,
  ArrowRightLeft,
  ShoppingCart,
  Search,
  Filter,
  PackageCheck,
  Plus,
  ArrowUpRight,
  TrendingUp,
  History,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Loader2,
  Factory,
  Layers,
  Archive,
  Info,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useWarehouseStock,
  useBaus,
  useWarehouseMovements,
  useCategories,
} from "@/hooks/useData";
import {
  transferWarehouseToStorage,
  transferWarehouseToSale,
  adjustWarehouseStock,
} from "@/services/productionService";
import { PageHeader, NoAccess, ProductThumbnail } from "@/components/ui-kit";
import { ProductionNavHeader } from "@/components/productions/ProductionNavHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { WarehouseStock, Bau } from "@/lib/app-types";

export const Route = createFileRoute("/_authenticated/producoes/armazem")({
  component: ArmazemPage,
});

export function ArmazemPage() {
  const { hasPermission, isDevMode, isCeoMode } = useAuth();
  const queryClient = useQueryClient();
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";

  const canView = hasPermission("warehouse.view") || hasPermission("view_warehouse");
  const canTransferStorage = hasPermission("warehouse.transfer_storage") || hasPermission("warehouse.transfer");
  const canTransferSale = hasPermission("warehouse.transfer_sale") || hasPermission("warehouse.transfer");
  const canTransfer = canTransferStorage || canTransferSale;
  const canAdjust = hasPermission("warehouse.adjust");

  const { data: stockList = [], isLoading: loadingStock } = useWarehouseStock();
  const { data: baus = [] } = useBaus();
  const { data: categories = [] } = useCategories();
  const { data: movements = [], isLoading: loadingMovements } = useWarehouseMovements(undefined, 100);

  // Estados de Filtro
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("stock");

  // Modais de Transferência
  const [transferType, setTransferType] = useState<"storage" | "sale" | "adjust" | null>(null);
  const [selectedStock, setSelectedStock] = useState<WarehouseStock | null>(null);
  const [transferQty, setTransferQty] = useState<string>("");
  const [destinationBauId, setDestinationBauId] = useState<string>("");
  const [transferNotes, setTransferNotes] = useState<string>("");

  // Métricas
  const metrics = useMemo(() => {
    const totalWarehouse = stockList.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
    const totalSaleAvailable = stockList.reduce(
      (sum, s) => sum + Number(s.product?.sale_available_quantity || 0),
      0
    );
    const totalGeneralStorage = stockList.reduce(
      (sum, s) => sum + Number(s.product?.estoque_atual || 0),
      0
    );
    const inStockCount = stockList.filter((s) => Number(s.quantity || 0) > 0).length;
    const withAnyStockCount = stockList.filter(
      (s) =>
        Number(s.quantity || 0) > 0 ||
        Number(s.product?.sale_available_quantity || 0) > 0 ||
        Number(s.product?.estoque_atual || 0) > 0
    ).length;

    return {
      totalWarehouse,
      totalSaleAvailable,
      totalGeneralStorage,
      inStockCount,
      totalProducts: withAnyStockCount,
    };
  }, [stockList]);

  // Lista Filtrada: exibe apenas itens que têm saldo disponível no armazém, em vendas ou em baú
  const filteredStock = useMemo(() => {
    return stockList.filter((item) => {
      const prod = item.product;
      const whQty = Number(item.quantity || 0);
      const saleQty = Number(prod?.sale_available_quantity || 0);
      const bauQty = Number(prod?.estoque_atual || 0);

      // Requisito: mostrar apenas produtos com saldo disponível no armazém, em vendas ou em baús
      const hasAnyStock = whQty > 0 || saleQty > 0 || bauQty > 0;
      if (!hasAnyStock && statusFilter !== "zero_stock") {
        return false;
      }

      const prodName = prod?.nome?.toLowerCase() || "";
      const matchesSearch = !search || prodName.includes(search.toLowerCase());

      const matchesCat =
        categoryFilter === "all" || prod?.categoria_id === categoryFilter;

      let matchesStatus = true;
      if (statusFilter === "in_stock") matchesStatus = whQty > 0;
      if (statusFilter === "zero_stock") matchesStatus = whQty === 0 && saleQty === 0 && bauQty === 0;
      if (statusFilter === "can_sell") matchesStatus = prod?.can_be_sold === true;
      if (statusFilter === "cannot_sell") matchesStatus = prod?.can_be_sold === false;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [stockList, search, categoryFilter, statusFilter]);

  // Mutação para Transferir para Baú/Estoque
  const transferToStorageMutation = useMutation({
    mutationFn: async () => {
      if (!canTransferStorage) throw new Error("Você não possui permissão para transferir produtos para baús.");
      if (!selectedStock) return;
      const numQ = parseFloat(transferQty);
      if (!numQ || numQ <= 0) throw new Error("Informe uma quantidade válida.");
      if (numQ > Number(selectedStock.quantity || 0)) {
        throw new Error("Quantidade informada excede o saldo em armazém.");
      }

      return transferWarehouseToStorage(
        selectedStock.product_id,
        numQ,
        destinationBauId || undefined,
        transferNotes.trim() || undefined
      );
    },
    onSuccess: (res) => {
      toast.success(
        `${res.transferred}x transferidos com sucesso para ${res.destination}!`
      );
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      setTransferType(null);
      setSelectedStock(null);
      setTransferQty("");
      setTransferNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao transferir para baú.");
    },
  });

  // Mutação para Transferir para Venda
  const transferToSaleMutation = useMutation({
    mutationFn: async () => {
      if (!canTransferSale) throw new Error("Você não possui permissão para disponibilizar produtos para venda.");
      if (!selectedStock) return;
      const numQ = parseFloat(transferQty);
      if (!numQ || numQ <= 0) throw new Error("Informe uma quantidade válida.");
      if (numQ > Number(selectedStock.quantity || 0)) {
        throw new Error("Quantidade informada excede o saldo em armazém.");
      }
      if (selectedStock.product?.can_be_sold === false) {
        throw new Error("Este produto não está liberado para venda.");
      }

      return transferWarehouseToSale(
        selectedStock.product_id,
        numQ,
        transferNotes.trim() || undefined
      );
    },
    onSuccess: (res) => {
      toast.success(
        `${res.transferred}x liberados para Vendas com sucesso! Saldo para venda: ${res.sale_available_balance}.`
      );
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      setTransferType(null);
      setSelectedStock(null);
      setTransferQty("");
      setTransferNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao transferir para venda.");
    },
  });

  // Mutação de Ajuste de Armazém
  const adjustStockMutation = useMutation({
    mutationFn: async () => {
      if (!canAdjust) throw new Error("Você não possui permissão para realizar ajustes de armazém.");
      if (!selectedStock) return;
      const numQ = parseFloat(transferQty);
      if (isNaN(numQ) || numQ < 0) throw new Error("Informe um saldo válido (>= 0).");
      if (!transferNotes.trim()) throw new Error("O motivo do ajuste é obrigatório.");

      return adjustWarehouseStock(
        selectedStock.product_id,
        numQ,
        transferNotes.trim()
      );
    },
    onSuccess: () => {
      toast.success("Saldo de armazém ajustado com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      setTransferType(null);
      setSelectedStock(null);
      setTransferQty("");
      setTransferNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao ajustar saldo.");
    },
  });

  if (!canView) {
    return <NoAccess message="Você não possui permissão para acessar o Armazém." />;
  }

  return (
    <div className="space-y-6 w-full max-w-full pb-12 animate-in fade-in duration-300">
      {/* MODO SOMENTE LEITURA BANNER */}
      {!canTransfer && !canAdjust && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
          <Info className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>
            <strong>Modo de Leitura:</strong> Seu cargo possui permissão para consultar os saldos e movimentações do Armazém, mas não para efetuar transferências ou ajustes de inventário.
          </span>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Warehouse className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Armazém Central
              </h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 font-mono text-[10px] uppercase font-bold">
                Depósito de Produções
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Saldos produzidos da facção com distribuição inteligente para Baús ou Disponibilidade de Venda
            </p>
          </div>
        </div>

        <ProductionNavHeader currentTab="armazem" />
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Saldo no Armazém</span>
            <Warehouse className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 font-mono mt-1">
            {metrics.totalWarehouse.toLocaleString("pt-BR")}{" "}
            <span className="text-xs text-muted-foreground font-normal">un</span>
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            {metrics.inStockCount} itens com saldo disponível
          </span>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Disponível p/ Venda</span>
            <ShoppingCart className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1">
            {metrics.totalSaleAvailable.toLocaleString("pt-BR")}{" "}
            <span className="text-xs text-muted-foreground font-normal">un</span>
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            Liberados para lançamentos comerciais
          </span>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Em Baús / Estoque</span>
            <Boxes className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-foreground font-mono mt-1">
            {metrics.totalGeneralStorage.toLocaleString("pt-BR")}{" "}
            <span className="text-xs text-muted-foreground font-normal">un</span>
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            Depósito operacional físico
          </span>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Itens com Saldo</span>
            <PackageCheck className="h-4 w-4 text-violet-400" />
          </div>
          <p className="text-2xl font-black text-foreground font-mono mt-1">
            {metrics.totalProducts}
          </p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            Produtos com estoque em armazém, vendas ou baús
          </span>
        </Card>
      </div>

      {/* ABAS: ESTOQUE vs HISTÓRICO */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/40 border border-border/60 p-1 rounded-2xl h-11">
          <TabsTrigger value="stock" className="gap-2 rounded-xl text-xs font-bold">
            <Warehouse className="h-4 w-4" />
            <span>Itens no Armazém ({filteredStock.length})</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2 rounded-xl text-xs font-bold">
            <History className="h-4 w-4" />
            <span>Movimentações do Armazém ({movements.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: TABELA DE ESTOQUE DO ARMAZÉM */}
        <TabsContent value="stock" className="space-y-4">
          {/* BARRA DE FILTROS */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs w-[160px] rounded-xl bg-background/50 border-border/60">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todas Categorias</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs w-[160px] rounded-xl bg-background/50 border-border/60">
                  <SelectValue placeholder="Status de Estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos os Status</SelectItem>
                  <SelectItem value="in_stock" className="text-xs">Com Saldo no Armazém</SelectItem>
                  <SelectItem value="zero_stock" className="text-xs">Sem Saldo (Zerado)</SelectItem>
                  <SelectItem value="can_sell" className="text-xs">Habilitado p/ Venda</SelectItem>
                  <SelectItem value="cannot_sell" className="text-xs">Não Habilitado p/ Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TABELA DE PRODUTOS */}
          <Card className="surface-card border-border/70 overflow-hidden">
            <CardContent className="p-0">
              {loadingStock ? (
                <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Carregando inventário do armazém...</span>
                </div>
              ) : filteredStock.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                  <Warehouse className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <p className="font-bold text-foreground">Nenhum produto encontrado</p>
                  <p>Tente ajustar os termos de busca ou filtros selecionados.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                        <th className="p-3.5 pl-5">Produto</th>
                        <th className="p-3.5 text-right font-mono">Em Armazém</th>
                        <th className="p-3.5 text-right font-mono">Disp. Venda</th>
                        <th className="p-3.5 text-right font-mono">Em Baús</th>
                        <th className="p-3.5 text-center">Status Venda</th>
                        <th className="p-3.5 pr-5 text-right">Ações de Distribuição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredStock.map((item) => {
                        const prod = item.product;
                        const whQty = Number(item.quantity || 0);
                        const saleQty = Number(prod?.sale_available_quantity || 0);
                        const bauQty = Number(prod?.estoque_atual || 0);
                        const canSell = prod?.can_be_sold === true;

                        return (
                          <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                            {/* PRODUTO */}
                            <td className="p-3.5 pl-5">
                              <div className="flex items-center gap-3">
                                <ProductThumbnail
                                  src={prod?.imagem_url}
                                  alt={prod?.nome || "Produto"}
                                  className="h-10 w-10 rounded-xl shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-foreground">{prod?.nome || "Sem nome"}</p>
                                  <span className="text-[11px] text-muted-foreground">
                                    Unidade: <strong className="text-foreground">{prod?.unidade || "un"}</strong>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* SALDO EM ARMAZÉM */}
                            <td className="p-3.5 text-right">
                              <span
                                className={cn(
                                  "font-mono font-black text-sm",
                                  whQty > 0 ? "text-emerald-400" : "text-muted-foreground/60"
                                )}
                              >
                                {whQty.toLocaleString("pt-BR")}{" "}
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  {prod?.unidade}
                                </span>
                              </span>
                            </td>

                            {/* DISPONÍVEL PARA VENDA */}
                            <td className="p-3.5 text-right font-mono font-bold text-amber-300">
                              {saleQty.toLocaleString("pt-BR")}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                {prod?.unidade}
                              </span>
                            </td>

                            {/* EM BAÚS */}
                            <td className="p-3.5 text-right font-mono text-foreground font-medium">
                              {bauQty.toLocaleString("pt-BR")}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                {prod?.unidade}
                              </span>
                            </td>

                            {/* STATUS DE VENDA */}
                            <td className="p-3.5 text-center">
                              {canSell ? (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold text-[10px]"
                                >
                                  Liberado p/ Venda
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30 font-bold text-[10px]"
                                >
                                  Uso Interno
                                </Badge>
                              )}
                            </td>

                            {/* AÇÕES */}
                            <td className="p-3.5 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* TRANSFERIR PARA BAÚ */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={whQty <= 0 || !canTransferStorage}
                                  onClick={() => {
                                    setSelectedStock(item);
                                    setTransferType("storage");
                                    setTransferQty(String(whQty));
                                    setDestinationBauId(baus[0]?.id || "");
                                    setTransferNotes("");
                                  }}
                                  className="h-7 px-2.5 text-[11px] font-bold bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border-sky-500/30 rounded-lg gap-1 cursor-pointer"
                                  title={canTransferStorage ? "Transferir para baú/estoque" : "Sem permissão para transferir para baú"}
                                >
                                  <Boxes className="h-3 w-3" />
                                  <span>Para Baú</span>
                                </Button>

                                {/* TRANSFERIR PARA VENDA */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={whQty <= 0 || !canSell || !canTransferSale}
                                  onClick={() => {
                                    setSelectedStock(item);
                                    setTransferType("sale");
                                    setTransferQty(String(whQty));
                                    setTransferNotes("");
                                  }}
                                  className="h-7 px-2.5 text-[11px] font-bold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-amber-500/30 rounded-lg gap-1 cursor-pointer"
                                  title={canTransferSale ? "Transferir para disponibilidade de venda" : "Sem permissão para disponibilizar para venda"}
                                >
                                  <ShoppingCart className="h-3 w-3" />
                                  <span>Para Venda</span>
                                </Button>

                                {/* AJUSTE MANUAL (GERÊNCIA) */}
                                {canAdjust && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedStock(item);
                                      setTransferType("adjust");
                                      setTransferQty(String(whQty));
                                      setTransferNotes("Ajuste manual de inventário");
                                    }}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                                    title="Ajuste de saldo"
                                  >
                                    <Sliders className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: HISTÓRICO DE MOVIMENTAÇÕES DO ARMAZÉM */}
        <TabsContent value="movements" className="space-y-4">
          <Card className="surface-card border-border/70 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <span>Auditoria de Movimentações do Armazém</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Registro cronológico de entradas de produção, saídas para baús e liberações comerciais
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {loadingMovements ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                  <span className="mt-2 block">Carregando histórico...</span>
                </div>
              ) : movements.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Nenhuma movimentação registrada no armazém.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                        <th className="p-3 pl-5">Data/Hora</th>
                        <th className="p-3">Operação</th>
                        <th className="p-3">Produto</th>
                        <th className="p-3">Origem &rarr; Destino</th>
                        <th className="p-3">Observação</th>
                        <th className="p-3 text-right">Qtd</th>
                        <th className="p-3 pr-5 text-right font-mono">Saldo Após</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {movements.map((m) => {
                        const isEntry = m.type === "PRODUCTION" || m.type === "SALE_CANCEL";

                        return (
                          <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-3 pl-5 whitespace-nowrap text-muted-foreground font-mono">
                              {new Date(m.created_at).toLocaleString("pt-BR")}
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-bold font-mono py-0.5",
                                  m.type === "PRODUCTION"
                                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                    : m.type === "TRANSFER_TO_SALE"
                                    ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                                    : m.type === "TRANSFER_TO_STORAGE"
                                    ? "border-sky-500/30 text-sky-400 bg-sky-500/10"
                                    : m.type === "SALE"
                                    ? "border-rose-500/30 text-rose-400 bg-rose-500/10"
                                    : "border-border text-muted-foreground"
                                )}
                              >
                                {m.type === "PRODUCTION"
                                  ? "Produção (+)"
                                  : m.type === "TRANSFER_TO_SALE"
                                  ? "Para Venda"
                                  : m.type === "TRANSFER_TO_STORAGE"
                                  ? "Para Baú"
                                  : m.type === "SALE"
                                  ? "Venda Realizada"
                                  : m.type === "SALE_CANCEL"
                                  ? "Estorno Venda"
                                  : "Ajuste"}
                              </Badge>
                            </td>

                            <td className="p-3 font-bold text-foreground">
                              {m.product?.nome || "Produto"}
                            </td>

                            <td className="p-3 text-muted-foreground font-mono text-[11px]">
                              <span>{m.source || "—"}</span> &rarr;{" "}
                              <strong className="text-foreground">{m.destination || "—"}</strong>
                            </td>

                            <td className="p-3 text-foreground/80 max-w-xs truncate">
                              {m.observation || "—"}
                            </td>

                            <td
                              className={cn(
                                "p-3 text-right font-mono font-black whitespace-nowrap",
                                isEntry ? "text-emerald-400" : "text-amber-400"
                              )}
                            >
                              {isEntry ? `+${m.quantity}` : `-${m.quantity}`} {m.product?.unidade || "un"}
                            </td>

                            <td className="p-3 pr-5 text-right font-mono font-bold text-foreground whitespace-nowrap">
                              {m.resulting_balance.toLocaleString("pt-BR")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================================================== */}
      {/* MODAL 1: TRANSFERIR PARA BAÚ/ESTOQUE */}
      {/* ==================================================== */}
      <Dialog
        open={transferType === "storage"}
        onOpenChange={(open) => !open && setTransferType(null)}
      >
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <Boxes className="h-5 w-5 text-sky-400" />
              <span>Transferir do Armazém para Baú</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Produto: <strong className="text-foreground">{selectedStock?.product?.nome}</strong> · Saldo no Armazém:{" "}
              <span className="font-mono text-emerald-400 font-bold">
                {Number(selectedStock?.quantity || 0)} {selectedStock?.product?.unidade}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* BAÚ DESTINO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Baú / Depósito de Destino *</Label>
              <Select value={destinationBauId} onValueChange={setDestinationBauId}>
                <SelectTrigger className="h-10 rounded-xl bg-background/50 text-xs font-bold">
                  <SelectValue placeholder="Selecione o baú..." />
                </SelectTrigger>
                <SelectContent>
                  {baus.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* QUANTIDADE COM ATALHOS */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quantidade a Transferir *</Label>
              <Input
                type="number"
                min="1"
                max={Number(selectedStock?.quantity || 0)}
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                className="text-base font-mono font-bold text-sky-300 rounded-xl bg-background/50"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[25, 50, 75, 100].map((pct) => (
                  <Button
                    key={pct}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const total = Number(selectedStock?.quantity || 0);
                      const calculated = Math.max(1, Math.floor((total * pct) / 100));
                      setTransferQty(String(calculated));
                    }}
                    className="h-6 text-[10px] px-2 font-mono rounded-lg"
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>

            {/* OBSERVAÇÃO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Observação (Opcional):</Label>
              <Input
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Ex: Abastecimento do baú operacional da sede"
                className="text-xs rounded-xl bg-background/50"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTransferType(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => transferToStorageMutation.mutate()}
              disabled={transferToStorageMutation.isPending || !transferQty}
              className="text-xs bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold rounded-xl gap-1.5"
            >
              {transferToStorageMutation.isPending ? "Transferindo..." : "Confirmar Transferência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL 2: TRANSFERIR PARA DISPONIBILIDADE DE VENDA */}
      {/* ==================================================== */}
      <Dialog
        open={transferType === "sale"}
        onOpenChange={(open) => !open && setTransferType(null)}
      >
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-amber-400" />
              <span>Transferir para Disponibilidade de Venda</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Produto: <strong className="text-foreground">{selectedStock?.product?.nome}</strong> · Saldo no Armazém:{" "}
              <span className="font-mono text-emerald-400 font-bold">
                {Number(selectedStock?.quantity || 0)} {selectedStock?.product?.unidade}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1 text-amber-200">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                <span>Integração com a Página de Vendas</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                A quantidade transferida ficará imediatamente visível e liberada para lançamento pelos vendedores na tela de <strong>Vendas</strong>.
              </p>
            </div>

            {/* QUANTIDADE COM ATALHOS */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quantidade a Liberar para Venda *</Label>
              <Input
                type="number"
                min="1"
                max={Number(selectedStock?.quantity || 0)}
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                className="text-base font-mono font-bold text-amber-300 rounded-xl bg-background/50"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[25, 50, 75, 100].map((pct) => (
                  <Button
                    key={pct}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const total = Number(selectedStock?.quantity || 0);
                      const calculated = Math.max(1, Math.floor((total * pct) / 100));
                      setTransferQty(String(calculated));
                    }}
                    className="h-6 text-[10px] px-2 font-mono rounded-lg"
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>

            {/* OBSERVAÇÃO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Observação (Opcional):</Label>
              <Input
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Ex: Lote liberado para negociação comercial"
                className="text-xs rounded-xl bg-background/50"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTransferType(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => transferToSaleMutation.mutate()}
              disabled={transferToSaleMutation.isPending || !transferQty}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl gap-1.5"
            >
              {transferToSaleMutation.isPending ? "Liberando..." : "Confirmar Liberação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL 3: AJUSTE MANUAL DE SALDO (GERÊNCIA) */}
      {/* ==================================================== */}
      <Dialog
        open={transferType === "adjust"}
        onOpenChange={(open) => !open && setTransferType(null)}
      >
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <Sliders className="h-5 w-5 text-violet-400" />
              <span>Ajuste Manual de Saldo no Armazém</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Produto: <strong className="text-foreground">{selectedStock?.product?.nome}</strong> · Saldo atual:{" "}
              <span className="font-mono text-foreground font-bold">
                {Number(selectedStock?.quantity || 0)} {selectedStock?.product?.unidade}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Novo Saldo Absoluto (&ge; 0) *</Label>
              <Input
                type="number"
                min="0"
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                className="text-base font-mono font-bold text-violet-300 rounded-xl bg-background/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo do Ajuste (Obrigatório) *</Label>
              <Input
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Ex: Correção de contagem física em auditoria"
                className="text-xs rounded-xl bg-background/50"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTransferType(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => adjustStockMutation.mutate()}
              disabled={adjustStockMutation.isPending || !transferNotes.trim()}
              className="text-xs bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-xl gap-1.5"
            >
              {adjustStockMutation.isPending ? "Ajustando..." : "Salvar Novo Saldo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
