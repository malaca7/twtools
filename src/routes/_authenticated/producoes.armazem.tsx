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
  ArrowDownLeft,
  PackagePlus,
  HandMetal,
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
  RotateCcw,
  Undo2,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useWarehouseStock,
  useBaus,
  useProductBaus,
  useWarehouseMovements,
  useCategories,
  useRawMaterials,
  useProducts,
  useCustomRoles,
} from "@/hooks/useData";
import { evaluateBauAccess } from "@/lib/bauPermissions";
import {
  transferWarehouseToStorage,
  transferWarehouseToSale,
  adjustWarehouseStock,
  manageProductionStock,
  pullRawMaterialFromBau,
  adjustRawMaterialStock,
  ManageStockAction,
  StockLocation,
} from "@/services/productionService";
import type { RawMaterial } from "@/lib/app-types";
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
import type { WarehouseStock, Bau, WarehouseMovement } from "@/lib/app-types";

export const Route = createFileRoute("/_authenticated/producoes/armazem")({
  component: ArmazemPage,
});

export function ArmazemPage() {
  const { hasPermission, isDevMode, isCeoMode, level, memberTags, isDevUser, isCeoUser, panelMode } = useAuth();
  const queryClient = useQueryClient();
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";

  const canView = hasPermission("warehouse.view") || hasPermission("view_warehouse");
  const canTransferStorage = hasPermission("warehouse.transfer_storage") || hasPermission("warehouse.transfer");
  const canTransferSale = hasPermission("warehouse.transfer_sale") || hasPermission("warehouse.transfer");
  const canTransfer = canTransferStorage || canTransferSale;
  const canAdjust = hasPermission("warehouse.adjust");

  const { data: rawStockList = [], isLoading: loadingStock } = useWarehouseStock();
  const { data: rawMaterials = [], isLoading: loadingRawMaterials } = useRawMaterials();
  const { data: products = [] } = useProducts();
  const { data: baus = [] } = useBaus();
  const { data: productBaus = [] } = useProductBaus();
  const { data: categories = [] } = useCategories();
  const { data: rawMovements = [], isLoading: loadingMovements } = useWarehouseMovements(undefined, 100);
  const { data: customRoles = [] } = useCustomRoles();

  const currentRole = useMemo(() => {
    return customRoles.find((r) => r.id === level || r.nome?.toLowerCase() === level?.toLowerCase());
  }, [customRoles, level]);

  const userAuthContext = useMemo(
    () => ({
      level,
      customRoleId: currentRole?.id || level,
      roleName: currentRole?.nome || level,
      tagIds: memberTags.map((t) => t.id),
      tagNames: memberTags.map((t) => t.name),
      isDevUser,
      isCeoUser,
      panelMode,
    }),
    [level, currentRole, memberTags, isDevUser, isCeoUser, panelMode]
  );

  // Requisito: O saldo de matérias-primas NÃO deve misturar na tabela de produtos acabados
  const rawMaterialProductIds = useMemo(
    () => new Set(rawMaterials.map((rm) => rm.product_id).filter(Boolean)),
    [rawMaterials]
  );
  const rawMaterialNames = useMemo(
    () => new Set(rawMaterials.map((rm) => rm.name.trim().toLowerCase())),
    [rawMaterials]
  );

  const isRawMaterial = (productId?: string | null, productName?: string | null) => {
    if (productId && rawMaterialProductIds.has(productId)) return true;
    if (productName && rawMaterialNames.has(productName.trim().toLowerCase())) return true;
    return false;
  };

  // Lista estrita de produtos finais (oculta matérias-primas da aba de produtos do armazém)
  const stockList = useMemo(() => {
    return rawStockList.filter((item) => !isRawMaterial(item.product_id, item.product?.nome));
  }, [rawStockList, rawMaterialProductIds, rawMaterialNames]);

  const movements = useMemo(() => {
    return rawMovements.filter((m) => !isRawMaterial(m.product_id, (m as any).product?.nome));
  }, [rawMovements, rawMaterialProductIds, rawMaterialNames]);

  // Filtragem estrita de baús ativos (respeitando restrições de cargos e tags)
  const activeBaus = useMemo(
    () => baus.filter((b) => evaluateBauAccess(b, userAuthContext).isActiveForUser),
    [baus, userAuthContext]
  );

  // Baús em Modo de Movimentação MANUAL
  const manualBaus = useMemo(
    () =>
      activeBaus.filter(
        (b) =>
          (b as any).tipo_gestao?.toLowerCase() === "manual" ||
          !(b as any).discord_channel_id
      ),
    [activeBaus]
  );

  const getBauProductStock = (bauId: string, prodId: string) => {
    const found = productBaus.find((pb) => pb.bau_id === bauId && pb.product_id === prodId);
    return Math.round(Number(found?.quantidade || 0));
  };

  // Saldo de Matéria-Prima em Baú Específico
  const getMaterialStockInBau = (mat: RawMaterial, bauId: string): number => {
    let prodId = mat.product_id;
    if (!prodId) {
      const match = products.find((p) => p.nome.trim().toLowerCase() === mat.name.trim().toLowerCase());
      prodId = match?.id;
    }
    if (!prodId) return 0;
    const found = productBaus.find((pb) => pb.bau_id === bauId && pb.product_id === prodId);
    return Math.round(Number(found?.quantidade || 0));
  };

  // Saldo de Matéria-Prima no somatório de todos os baús manuais
  const getMaterialTotalInManualBaus = (mat: RawMaterial): number => {
    let total = 0;
    for (const b of manualBaus) {
      total += getMaterialStockInBau(mat, b.id);
    }
    return total;
  };

  // Estados de Filtro
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("stock");

  // Modais de Transferência Básica
  const [transferType, setTransferType] = useState<"storage" | "sale" | "adjust" | null>(null);
  const [selectedStock, setSelectedStock] = useState<WarehouseStock | null>(null);
  const [transferQty, setTransferQty] = useState<string>("");
  const [destinationBauId, setDestinationBauId] = useState<string>("");
  const [transferNotes, setTransferNotes] = useState<string>("");

  // Modal de Retorno Rápido ao Armazém (de Baú ou Vendas)
  const [returnState, setReturnState] = useState<{
    product: WarehouseStock["product"];
    origin: "SALE" | "BAU";
    bauId?: string;
    maxQty: number;
  } | null>(null);
  const [returnQty, setReturnQty] = useState<string>("");
  const [returnNotes, setReturnNotes] = useState<string>("");

  // Modal de Estorno de Movimentação
  const [revertingMovement, setRevertingMovement] = useState<WarehouseMovement | null>(null);

  // Modal de Gestão Completa de Saldo (Ajustar / Retornar / Mover / Descartar)
  const [managingStockItem, setManagingStockItem] = useState<WarehouseStock | null>(null);
  const [stockAction, setStockAction] = useState<ManageStockAction | "RETURN_WAREHOUSE">("TRANSFER");
  const [stockOrigin, setStockOrigin] = useState<StockLocation>("WAREHOUSE");
  const [stockDestination, setStockDestination] = useState<StockLocation>("SALE");
  const [stockOriginBauId, setStockOriginBauId] = useState<string>("");
  const [stockDestinationBauId, setStockDestinationBauId] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("");
  const [stockReason, setStockReason] = useState<string>("");

  // Modais de Entrada de Matéria-Prima no Armazém
  const [pullRawModalOpen, setPullRawModalOpen] = useState(false);
  const [selectedMaterialForPull, setSelectedMaterialForPull] = useState<RawMaterial | null>(null);
  const [selectedBauForPull, setSelectedBauForPull] = useState<string>("");
  const [pullQuantity, setPullQuantity] = useState<string>("10");
  const [pullReason, setPullReason] = useState<string>("");

  const [manualEntryModalOpen, setManualEntryModalOpen] = useState(false);
  const [selectedMaterialForEntry, setSelectedMaterialForEntry] = useState<RawMaterial | null>(null);
  const [manualEntryQuantity, setManualEntryQuantity] = useState<string>("50");
  const [manualEntryReason, setManualEntryReason] = useState<string>("");

  const [rawMaterialSearch, setRawMaterialSearch] = useState("");

  const filteredRawMaterials = useMemo(() => {
    if (!rawMaterialSearch.trim()) return rawMaterials;
    const q = rawMaterialSearch.toLowerCase();
    return rawMaterials.filter((m) => m.name.toLowerCase().includes(q));
  }, [rawMaterials, rawMaterialSearch]);

  const availableInSelectedBau = useMemo(() => {
    if (!selectedMaterialForPull || !selectedBauForPull) return 0;
    return getMaterialStockInBau(selectedMaterialForPull, selectedBauForPull);
  }, [selectedMaterialForPull, selectedBauForPull, productBaus]);

  const pullRawMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMaterialForPull) throw new Error("Selecione uma matéria-prima.");
      if (!selectedBauForPull) throw new Error("Selecione o baú manual de origem.");
      const qty = parseInt(pullQuantity, 10);
      if (isNaN(qty) || qty <= 0) throw new Error("Informe uma quantidade válida maior que zero.");

      if (qty > availableInSelectedBau) {
        throw new Error(
          `Saldo insuficiente no baú manual: possui ${availableInSelectedBau} e tentou transferir ${qty}.`
        );
      }

      return pullRawMaterialFromBau(
        selectedMaterialForPull.id,
        selectedBauForPull,
        qty,
        pullReason.trim() || undefined
      );
    },
    onSuccess: (res) => {
      toast.success(
        `${res.quantity}x ${selectedMaterialForPull?.name} transferidos do Baú Manual para o estoque!`
      );
      setPullRawModalOpen(false);
      setPullReason("");
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["raw_material_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao transferir matérias-primas do baú manual");
    },
  });

  const manualEntryRawMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMaterialForEntry) throw new Error("Selecione uma matéria-prima.");
      const qty = parseInt(manualEntryQuantity, 10);
      if (isNaN(qty) || qty <= 0) throw new Error("Informe uma quantidade inteira positiva.");
      return adjustRawMaterialStock(
        selectedMaterialForEntry.id,
        qty,
        manualEntryReason.trim() || "Entrada manual de matéria-prima no armazém"
      );
    },
    onSuccess: (res) => {
      toast.success(
        `Entrada manual realizada: +${manualEntryQuantity}x ${selectedMaterialForEntry?.name}! Novo saldo: ${res?.new_balance}`
      );
      setManualEntryModalOpen(false);
      setManualEntryReason("");
      setManualEntryQuantity("50");
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["raw_material_movements"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao realizar entrada manual");
    },
  });

  // Métricas
  const metrics = useMemo(() => {
    const totalWarehouse = Math.round(
      stockList.reduce((sum, s) => sum + Number(s.quantity || 0), 0)
    );
    const totalSaleAvailable = Math.round(
      stockList.reduce(
        (sum, s) => sum + Number(s.product?.sale_available_quantity || 0),
        0
      )
    );
    const totalGeneralStorage = Math.round(
      stockList.reduce(
        (sum, s) => sum + Number(s.product?.estoque_atual || 0),
        0
      )
    );
    const inStockCount = stockList.filter((s) => Math.round(Number(s.quantity || 0)) > 0).length;
    const withAnyStockCount = stockList.filter(
      (s) =>
        Math.round(Number(s.quantity || 0)) > 0 ||
        Math.round(Number(s.product?.sale_available_quantity || 0)) > 0 ||
        Math.round(Number(s.product?.estoque_atual || 0)) > 0
    ).length;

    return {
      totalWarehouse,
      totalSaleAvailable,
      totalGeneralStorage,
      inStockCount,
      totalProducts: withAnyStockCount,
    };
  }, [stockList]);

  // Lista Filtrada: exibe APENAS produtos com saldo Em Armazém (> 0)
  const filteredStock = useMemo(() => {
    return stockList.filter((item) => {
      const prod = item.product;
      const whQty = Math.round(Number(item.quantity || 0));

      // Requisito: na página Armazém, apenas mostrar produtos com saldo Em Armazém
      if (whQty <= 0 && statusFilter !== "all_stock") {
        return false;
      }

      const prodName = prod?.nome?.toLowerCase() || "";
      const matchesSearch = !search || prodName.includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || prod?.categoria_id === categoryFilter;

      let matchesStatus = true;
      if (statusFilter === "in_stock") matchesStatus = whQty > 0;
      if (statusFilter === "can_sell") matchesStatus = prod?.can_be_sold === true;
      if (statusFilter === "cannot_sell") matchesStatus = prod?.can_be_sold === false;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [stockList, search, categoryFilter, statusFilter]);

  // Lista de Produtos Distribuídos (com saldo em Baú ou Vendas)
  const distributedStock = useMemo(() => {
    return stockList.filter((item) => {
      const prod = item.product;
      const saleQty = Math.round(Number(prod?.sale_available_quantity || 0));
      const bauQty = Math.round(Number(prod?.estoque_atual || 0));

      // Apenas produtos que possuem saldo em Baús ou Vendas
      if (saleQty <= 0 && bauQty <= 0) return false;

      const prodName = prod?.nome?.toLowerCase() || "";
      const matchesSearch = !search || prodName.includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || prod?.categoria_id === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [stockList, search, categoryFilter]);

  // Mutação para Transferir para Baú/Estoque
  const transferToStorageMutation = useMutation({
    mutationFn: async () => {
      if (!canTransferStorage) throw new Error("Você não possui permissão para transferir produtos para baús.");
      if (!selectedStock) return;
      if (!destinationBauId || !activeBaus.some((b) => b.id === destinationBauId)) {
        throw new Error("Selecione um baú ativo de destino válido.");
      }
      const numQ = parseInt(transferQty, 10);
      if (isNaN(numQ) || numQ <= 0) throw new Error("Informe uma quantidade inteira válida (> 0).");
      if (numQ > Number(selectedStock.quantity || 0)) {
        throw new Error("Quantidade informada excede o saldo em armazém.");
      }

      return transferWarehouseToStorage(
        selectedStock.product_id,
        numQ,
        destinationBauId,
        transferNotes.trim() || undefined
      );
    },
    onSuccess: (res) => {
      toast.success(
        `${Math.round(res.transferred)}x transferidos com sucesso para ${res.destination}!`
      );
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
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
      const numQ = parseInt(transferQty, 10);
      if (isNaN(numQ) || numQ <= 0) throw new Error("Informe uma quantidade inteira válida (> 0).");
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
        `${Math.round(res.transferred)}x liberados para Vendas com sucesso! Saldo para venda: ${Math.round(res.sale_available_balance)}.`
      );
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
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
      const numQ = parseInt(transferQty, 10);
      if (isNaN(numQ) || numQ < 0) throw new Error("Informe um saldo inteiro válido (>= 0).");
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
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      setTransferType(null);
      setSelectedStock(null);
      setTransferQty("");
      setTransferNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao ajustar saldo.");
    },
  });

  // Mutação de Retorno Rápido ao Armazém (de Baú ou Vendas)
  const returnStockMutation = useMutation({
    mutationFn: async () => {
      if (!returnState?.product) return;
      const numQ = parseInt(returnQty, 10);
      if (isNaN(numQ) || numQ <= 0) throw new Error("Informe uma quantidade inteira válida (> 0).");
      if (numQ > returnState.maxQty) throw new Error("Quantidade excede o saldo disponível para retorno.");

      return manageProductionStock({
        productId: returnState.product.id,
        action: "TRANSFER",
        origin: returnState.origin,
        destination: "WAREHOUSE",
        originBauId: returnState.origin === "BAU" ? (returnState.bauId || activeBaus[0]?.id || null) : null,
        quantity: numQ,
        reason: returnNotes.trim() || `Retorno de ${returnState.origin === "SALE" ? "Vendas" : "Baú"} para o Armazém`,
      });
    },
    onSuccess: () => {
      toast.success("Saldo retornado ao Armazém com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["stock_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      setReturnState(null);
      setReturnQty("");
      setReturnNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao retornar saldo ao armazém.");
    },
  });

  // Mutação de Estorno de Transferência do Histórico
  const revertMovementMutation = useMutation({
    mutationFn: async (mov: WarehouseMovement) => {
      const isStorage = mov.type === "TRANSFER_TO_STORAGE";
      const isSale = mov.type === "TRANSFER_TO_SALE";
      if (!isStorage && !isSale) throw new Error("Apenas transferências para baús ou vendas podem ser estornadas.");

      const numQ = Math.round(Number(mov.quantity || 0));
      if (numQ <= 0) throw new Error("Quantidade inválida para estorno.");

      const origin: StockLocation = isSale ? "SALE" : "BAU";
      let originBauId: string | null = null;
      if (isStorage) {
        const match = activeBaus.find((b) => b.nome === mov.destination) || activeBaus[0];
        originBauId = match?.id || null;
      }

      return manageProductionStock({
        productId: mov.product_id,
        action: "TRANSFER",
        origin,
        destination: "WAREHOUSE",
        originBauId,
        quantity: numQ,
        reason: `Estorno de transferência (#${mov.id.slice(0, 8)}) para o Armazém`,
      });
    },
    onSuccess: (_, mov) => {
      toast.success(`Transferência estornada com sucesso! ${Math.round(mov.quantity)}x retornados ao Armazém.`);
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      setRevertingMovement(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao estornar movimentação.");
    },
  });

  // Mutação de Gestão Geral de Saldo (Ajustar / Mover / Descartar)
  const manageStockMutation = useMutation({
    mutationFn: async () => {
      if (!managingStockItem?.product) return;
      const isAdjust = stockAction === "ADJUST";
      const numQ = parseInt(stockQuantity, 10);
      if (isNaN(numQ) || (isAdjust ? numQ < 0 : numQ <= 0)) {
        throw new Error(isAdjust ? "Informe um saldo inteiro válido (>= 0)." : "Informe uma quantidade inteira válida (> 0).");
      }

      const effectiveAction: ManageStockAction = stockAction === "RETURN_WAREHOUSE" ? "TRANSFER" : stockAction;
      const effectiveDest: StockLocation = stockAction === "RETURN_WAREHOUSE" ? "WAREHOUSE" : stockDestination;

      return manageProductionStock({
        productId: managingStockItem.product.id,
        action: effectiveAction,
        origin: stockOrigin,
        destination: effectiveAction === "TRANSFER" ? effectiveDest : undefined,
        originBauId: stockOrigin === "BAU" ? (stockOriginBauId || activeBaus[0]?.id || null) : null,
        destinationBauId: (effectiveAction === "TRANSFER" && effectiveDest === "BAU") ? (stockDestinationBauId || activeBaus[0]?.id || null) : null,
        quantity: numQ,
        reason: stockReason.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Gestão de saldo executada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      setManagingStockItem(null);
      setStockQuantity("");
      setStockReason("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao gerenciar saldo.");
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

        <div className="flex flex-wrap items-center gap-2">
          {canTransfer && (
            <Button
              onClick={() => {
                if (rawMaterials.length > 0) setSelectedMaterialForPull(rawMaterials[0]);
                if (manualBaus.length > 0) setSelectedBauForPull(manualBaus[0].id);
                setPullQuantity("10");
                setPullReason("");
                setPullRawModalOpen(true);
              }}
              variant="outline"
              size="sm"
              className="bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold gap-1.5 shadow-sm rounded-xl"
              title="Transferir matérias-primas de um baú manual para o armazém"
            >
              <ArrowDownLeft className="h-4 w-4 text-amber-400" />
              Transferir de Baú Manual
            </Button>
          )}

          {canAdjust && (
            <Button
              onClick={() => {
                if (rawMaterials.length > 0) setSelectedMaterialForEntry(rawMaterials[0]);
                setManualEntryQuantity("50");
                setManualEntryReason("");
                setManualEntryModalOpen(true);
              }}
              variant="outline"
              size="sm"
              className="bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold gap-1.5 shadow-sm rounded-xl"
              title="Dar entrada manual de matéria-prima no armazém"
            >
              <PackagePlus className="h-4 w-4 text-emerald-400" />
              Entrada Manual
            </Button>
          )}

          <ProductionNavHeader currentTab="armazem" />
        </div>
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

      {/* ABAS: ESTOQUE vs PRODUTOS DISTRIBUÍDOS vs MATÉRIAS-PRIMAS vs HISTÓRICO */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/40 border border-border/60 p-1 rounded-2xl h-11 flex-wrap sm:flex-nowrap">
          <TabsTrigger value="stock" className="gap-2 rounded-xl text-xs font-bold">
            <Warehouse className="h-4 w-4" />
            <span>Itens no Armazém ({filteredStock.length})</span>
          </TabsTrigger>
          <TabsTrigger value="distributed" className="gap-2 rounded-xl text-xs font-bold">
            <ArrowRightLeft className="h-4 w-4 text-sky-400" />
            <span>Saldos em Baús & Vendas ({distributedStock.length})</span>
          </TabsTrigger>
          <TabsTrigger value="raw-materials" className="gap-2 rounded-xl text-xs font-bold">
            <Layers className="h-4 w-4 text-amber-400" />
            <span>Matérias-Primas ({rawMaterials.length})</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2 rounded-xl text-xs font-bold">
            <History className="h-4 w-4 text-violet-400" />
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
                <SelectTrigger className="h-9 text-xs w-[170px] rounded-xl bg-background/50 border-border/60">
                  <SelectValue placeholder="Status de Estoque" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Com Saldo no Armazém</SelectItem>
                  <SelectItem value="in_stock" className="text-xs">Saldo Armazém (&gt; 0)</SelectItem>
                  <SelectItem value="all_stock" className="text-xs">Exibir Também Zerados</SelectItem>
                  <SelectItem value="can_sell" className="text-xs">Habilitado p/ Venda</SelectItem>
                  <SelectItem value="cannot_sell" className="text-xs">Não Habilitado p/ Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TABELA DE PRODUTOS DO ARMAZÉM */}
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
                  <p className="font-bold text-foreground">Nenhum produto com saldo no Armazém Central</p>
                  <p>Todos os produtos foram distribuídos para Baús/Vendas ou ainda não possuem produção registrada.</p>
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
                        <th className="p-3.5 pr-5 text-right">Ações de Distribuição & Retorno</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredStock.map((item) => {
                        const prod = item.product;
                        const whQty = Math.round(Number(item.quantity || 0));
                        const saleQty = Math.round(Number(prod?.sale_available_quantity || 0));
                        const bauQty = Math.round(Number(prod?.estoque_atual || 0));
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
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {/* TRANSFERIR PARA BAÚ */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={whQty <= 0 || !canTransferStorage || activeBaus.length === 0}
                                  onClick={() => {
                                    setSelectedStock(item);
                                    setTransferType("storage");
                                    setTransferQty(String(whQty));
                                    setDestinationBauId(activeBaus[0]?.id || "");
                                    setTransferNotes("");
                                  }}
                                  className="h-7 px-2.5 text-[11px] font-bold bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border-sky-500/30 rounded-lg gap-1 cursor-pointer"
                                  title={
                                    activeBaus.length === 0
                                      ? "Nenhum baú ativo disponível"
                                      : canTransferStorage
                                      ? "Transferir para baú/estoque ativo"
                                      : "Sem permissão para transferir para baú"
                                  }
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

                                {/* RETORNAR DE BAÚ SE HOUVER SALDO */}
                                {bauQty > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReturnState({
                                        product: prod,
                                        origin: "BAU",
                                        bauId: activeBaus[0]?.id || "",
                                        maxQty: bauQty,
                                      });
                                      setReturnQty(String(bauQty));
                                      setReturnNotes("");
                                    }}
                                    className="h-7 px-2 text-[10px] font-bold bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border-sky-500/30 rounded-lg gap-1 cursor-pointer"
                                    title="Retornar produtos de baú para o armazém"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>De Baú</span>
                                  </Button>
                                )}

                                {/* RETORNAR DE VENDAS SE HOUVER SALDO */}
                                {saleQty > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReturnState({
                                        product: prod,
                                        origin: "SALE",
                                        maxQty: saleQty,
                                      });
                                      setReturnQty(String(saleQty));
                                      setReturnNotes("");
                                    }}
                                    className="h-7 px-2 text-[10px] font-bold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-amber-500/30 rounded-lg gap-1 cursor-pointer"
                                    title="Retornar produtos de vendas para o armazém"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>De Vendas</span>
                                  </Button>
                                )}

                                {/* GERENCIAR SALDO COMPLETO */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setManagingStockItem(item);
                                    setStockAction("TRANSFER");
                                    setStockOrigin("WAREHOUSE");
                                    setStockDestination("SALE");
                                    setStockOriginBauId(activeBaus[0]?.id || "");
                                    setStockDestinationBauId(activeBaus[0]?.id || "");
                                    setStockQuantity(String(whQty || 1));
                                    setStockReason("");
                                  }}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                                  title="Opções avançadas de gestão e ajuste de estoque"
                                >
                                  <SlidersHorizontal className="h-3 w-3 text-primary" />
                                </Button>
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

        {/* ABA 2: PRODUTOS DISTRIBUÍDOS (EM BAÚS E EM VENDAS) */}
        <TabsContent value="distributed" className="space-y-4">
          <Card className="surface-card border-border/70 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-sky-400" />
                    <span>Produtos Transferidos para Baús e Vendas</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Gerencie, retorne ou ajuste produtos produzidos que estão atualmente distribuídos nos baús operacionais ou disponíveis para vendas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {distributedStock.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                  <Boxes className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <p className="font-bold text-foreground">Nenhum produto distribuído no momento</p>
                  <p>Todos os produtos produzidos continuam centralizados no armazém ou não possuem saldos externos.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                        <th className="p-3.5 pl-5">Produto</th>
                        <th className="p-3.5 text-right font-mono">Em Baús</th>
                        <th className="p-3.5 text-right font-mono">Disp. Venda</th>
                        <th className="p-3.5 text-right font-mono">Saldo Armazém</th>
                        <th className="p-3.5 pr-5 text-right">Ações de Gestão & Retorno</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {distributedStock.map((item) => {
                        const prod = item.product;
                        const whQty = Math.round(Number(item.quantity || 0));
                        const saleQty = Math.round(Number(prod?.sale_available_quantity || 0));
                        const bauQty = Math.round(Number(prod?.estoque_atual || 0));

                        return (
                          <tr key={item.id} className="hover:bg-muted/10 transition-colors">
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

                            <td className="p-3.5 text-right font-mono font-bold text-sky-300">
                              {bauQty.toLocaleString("pt-BR")}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                {prod?.unidade}
                              </span>
                            </td>

                            <td className="p-3.5 text-right font-mono font-bold text-amber-300">
                              {saleQty.toLocaleString("pt-BR")}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                {prod?.unidade}
                              </span>
                            </td>

                            <td className="p-3.5 text-right font-mono text-muted-foreground">
                              {whQty.toLocaleString("pt-BR")}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                {prod?.unidade}
                              </span>
                            </td>

                            <td className="p-3.5 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {bauQty > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReturnState({
                                        product: prod,
                                        origin: "BAU",
                                        bauId: activeBaus[0]?.id || "",
                                        maxQty: bauQty,
                                      });
                                      setReturnQty(String(bauQty));
                                      setReturnNotes("");
                                    }}
                                    className="h-7 px-2.5 text-[11px] font-bold bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 border-sky-500/30 rounded-lg gap-1 cursor-pointer"
                                    title="Retornar produtos de baús de volta ao armazém"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>Retornar do Baú</span>
                                  </Button>
                                )}

                                {saleQty > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReturnState({
                                        product: prod,
                                        origin: "SALE",
                                        maxQty: saleQty,
                                      });
                                      setReturnQty(String(saleQty));
                                      setReturnNotes("");
                                    }}
                                    className="h-7 px-2.5 text-[11px] font-bold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-amber-500/30 rounded-lg gap-1 cursor-pointer"
                                    title="Retornar produtos disponíveis para venda de volta ao armazém"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>Retornar de Vendas</span>
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setManagingStockItem(item);
                                    setStockAction("TRANSFER");
                                    setStockOrigin(bauQty > 0 ? "BAU" : "SALE");
                                    setStockDestination("WAREHOUSE");
                                    setStockOriginBauId(activeBaus[0]?.id || "");
                                    setStockDestinationBauId(activeBaus[0]?.id || "");
                                    setStockQuantity(String(bauQty > 0 ? bauQty : saleQty));
                                    setStockReason("");
                                  }}
                                  className="h-7 px-2.5 text-[11px] font-bold bg-secondary/80 text-foreground hover:bg-secondary rounded-lg gap-1 cursor-pointer"
                                  title="Opções avançadas de gestão e ajuste de estoque"
                                >
                                  <SlidersHorizontal className="h-3 w-3 text-primary" />
                                  <span>Gerenciar Saldo</span>
                                </Button>
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

        {/* ABA: MATÉRIAS-PRIMAS DO ARMAZÉM */}
        <TabsContent value="raw-materials" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar matéria-prima por nome..."
                value={rawMaterialSearch}
                onChange={(e) => setRawMaterialSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (rawMaterials.length > 0) setSelectedMaterialForPull(rawMaterials[0]);
                  if (manualBaus.length > 0) setSelectedBauForPull(manualBaus[0].id);
                  setPullQuantity("10");
                  setPullReason("");
                  setPullRawModalOpen(true);
                }}
                className="h-9 text-xs font-semibold gap-1.5 bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 rounded-xl"
              >
                <ArrowDownLeft className="h-3.5 w-3.5 text-amber-400" />
                Transferir de Baú Manual
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (rawMaterials.length > 0) setSelectedMaterialForEntry(rawMaterials[0]);
                  setManualEntryQuantity("50");
                  setManualEntryReason("");
                  setManualEntryModalOpen(true);
                }}
                className="h-9 text-xs font-semibold gap-1.5 bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 rounded-xl"
              >
                <PackagePlus className="h-3.5 w-3.5 text-emerald-400" />
                Entrada Manual
              </Button>

              <Button
                asChild
                size="sm"
                variant="ghost"
                className="h-9 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground rounded-xl"
              >
                <Link to={`${prefix}/producoes/materias-primas`}>
                  <span>Ver Todos os Insumos</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          <Card className="surface-card border-border/70 overflow-hidden">
            <CardContent className="p-0">
              {loadingRawMaterials ? (
                <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span>Carregando matérias-primas...</span>
                </div>
              ) : filteredRawMaterials.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                  <Layers className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <p className="font-bold text-foreground">Nenhuma matéria-prima cadastrada ou encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                        <th className="p-3.5 pl-5">Matéria-Prima</th>
                        <th className="p-3.5 text-right font-mono">Saldo em Estoque</th>
                        <th className="p-3.5 text-right font-mono">Saldo em Baús Manuais</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 pr-5 text-right">Ações de Abastecimento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredRawMaterials.map((mat) => {
                        const stockInManualBaus = getMaterialTotalInManualBaus(mat);
                        const isCritical = mat.is_active && mat.stock_quantity <= (mat.min_stock || 0);

                        return (
                          <tr key={mat.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-3.5 pl-5">
                              <div className="flex items-center gap-3">
                                <ProductThumbnail
                                  src={mat.image_url}
                                  alt={mat.name}
                                  className="h-10 w-10 rounded-xl shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-foreground">{mat.name}</p>
                                  <span className="text-[11px] text-muted-foreground">
                                    Unidade: <strong className="text-foreground">{mat.unit}</strong>
                                    {mat.min_stock ? ` · Mínimo: ${mat.min_stock}` : ""}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 text-right">
                              <span
                                className={cn(
                                  "font-mono font-black text-sm",
                                  mat.stock_quantity > 0 ? "text-emerald-400" : "text-muted-foreground/60"
                                )}
                              >
                                {mat.stock_quantity.toLocaleString("pt-BR")}{" "}
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  {mat.unit}
                                </span>
                              </span>
                            </td>

                            <td className="p-3.5 text-right font-mono font-medium text-sky-300">
                              {stockInManualBaus.toLocaleString("pt-BR")}{" "}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                {mat.unit}
                              </span>
                            </td>

                            <td className="p-3.5 text-center">
                              {mat.stock_quantity === 0 ? (
                                <Badge variant="outline" className="text-[10px] border-rose-500/30 bg-rose-500/10 text-rose-300">
                                  Zerado
                                </Badge>
                              ) : isCritical ? (
                                <Badge variant="outline" className="text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-300 font-semibold animate-pulse">
                                  Reposição
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                                  Adequado
                                </Badge>
                              )}
                            </td>

                            <td className="p-3.5 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedMaterialForPull(mat);
                                    if (manualBaus.length > 0) setSelectedBauForPull(manualBaus[0].id);
                                    setPullQuantity("10");
                                    setPullReason("");
                                    setPullRawModalOpen(true);
                                  }}
                                  className="h-7 px-2 text-[11px] gap-1 bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                                  title="Transferir saldo de baú manual para o estoque"
                                >
                                  <ArrowDownLeft className="h-3 w-3" />
                                  Puxar Baú
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedMaterialForEntry(mat);
                                    setManualEntryQuantity("50");
                                    setManualEntryReason("");
                                    setManualEntryModalOpen(true);
                                  }}
                                  className="h-7 px-2 text-[11px] gap-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                                  title="Dar entrada manual neste insumo"
                                >
                                  <PackagePlus className="h-3 w-3 text-emerald-400" />
                                  Entrada
                                </Button>
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

        {/* ABA 4: HISTÓRICO DE MOVIMENTAÇÕES DO ARMAZÉM */}
        <TabsContent value="movements" className="space-y-4">
          <Card className="surface-card border-border/70 overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <span>Auditoria de Movimentações do Armazém</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Registro cronológico de entradas de produção, saídas para baús, liberações comerciais e estornos
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
                        <th className="p-3 text-right font-mono">Saldo Após</th>
                        <th className="p-3 pr-5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {movements.map((m) => {
                        const isEntry =
                          m.type === "PRODUCTION" ||
                          m.type === "SALE_CANCEL" ||
                          m.type === "RETURN_TO_WAREHOUSE" ||
                          m.type === "ESTORNO_TRANSFERENCIA";
                        const canRevert =
                          m.type === "TRANSFER_TO_STORAGE" ||
                          m.type === "TRANSFER_TO_SALE" ||
                          m.type === "TRANSFER_OUT";

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
                                    : m.type === "RETURN_TO_WAREHOUSE" || m.type === "ESTORNO_TRANSFERENCIA"
                                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                    : m.type === "SALE"
                                    ? "border-rose-500/30 text-rose-400 bg-rose-500/10"
                                    : "border-border text-muted-foreground"
                                )}
                              >
                                {m.type === "PRODUCTION"
                                  ? "Produção (+)"
                                  : m.type === "TRANSFER_TO_SALE"
                                  ? "Para Venda (-)"
                                  : m.type === "TRANSFER_TO_STORAGE"
                                  ? "Para Baú (-)"
                                  : m.type === "RETURN_TO_WAREHOUSE"
                                  ? "Retorno Armazém (+)"
                                  : m.type === "ESTORNO_TRANSFERENCIA"
                                  ? "Estorno (+)"
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
                              {isEntry ? `+${Math.round(Number(m.quantity))}` : `-${Math.round(Number(m.quantity))}`} {m.product?.unidade || "un"}
                            </td>

                            <td className="p-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                              {Math.round(Number(m.resulting_balance)).toLocaleString("pt-BR")}
                            </td>

                            {/* AÇÃO DE ESTORNO */}
                            <td className="p-3 pr-5 text-right whitespace-nowrap">
                              {canRevert ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRevertingMovement(m)}
                                  className="h-6 px-2 text-[10px] font-bold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/30 rounded-lg gap-1 cursor-pointer"
                                  title="Estornar esta transferência e devolver o saldo ao Armazém"
                                >
                                  <Undo2 className="h-3 w-3" />
                                  <span>Estornar</span>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground/30 text-[10px]">—</span>
                              )}
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
      {/* MODAL 1: TRANSFERIR PARA BAÚ/ESTOQUE (APENAS ATIVOS) */}
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
                {Math.round(Number(selectedStock?.quantity || 0)).toLocaleString("pt-BR")} {selectedStock?.product?.unidade}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* BAÚ DESTINO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Baú / Depósito de Destino (Apenas Baús Ativos) *</Label>
              {activeBaus.length === 0 ? (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Nenhum baú ativo encontrado. Não é possível transferir no momento.</span>
                </div>
              ) : (
                <Select value={destinationBauId} onValueChange={setDestinationBauId}>
                  <SelectTrigger className="h-10 rounded-xl bg-background/50 text-xs font-bold">
                    <SelectValue placeholder="Selecione o baú ativo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBaus.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* QUANTIDADE COM ATALHOS */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Quantidade a Transferir *</Label>
                {Math.floor(Number(selectedStock?.quantity || 0)) > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTransferQty(String(Math.floor(Number(selectedStock?.quantity || 0))))}
                    className="h-5 px-2 text-[10px] text-sky-400 hover:text-sky-300 font-mono rounded cursor-pointer"
                  >
                    Usar Máximo ({Math.floor(Number(selectedStock?.quantity || 0))})
                  </Button>
                )}
              </div>
              <Input
                type="number"
                step="1"
                min="1"
                max={Math.floor(Number(selectedStock?.quantity || 0))}
                value={transferQty}
                onChange={(e) => {
                  const val = e.target.value;
                  setTransferQty(val ? String(Math.max(1, parseInt(val, 10) || 0)) : "");
                }}
                className="text-base font-mono font-bold text-sky-300 rounded-xl bg-background/50"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[1, 5, 10, 25, 50, 100].map((qty) => {
                  const maxVal = Math.floor(Number(selectedStock?.quantity || 0));
                  const isAvailable = maxVal >= qty;
                  const isSelected = Number(transferQty) === qty;
                  return (
                    <Button
                      key={qty}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={!isAvailable}
                      onClick={() => setTransferQty(String(qty))}
                      className={cn(
                        "h-6 text-[10px] px-2.5 font-mono rounded-lg transition-all",
                        isSelected
                          ? "bg-sky-600 hover:bg-sky-500 text-white font-bold"
                          : isAvailable
                          ? "hover:border-sky-500/50 hover:text-sky-300"
                          : "opacity-40"
                      )}
                    >
                      {qty} un
                    </Button>
                  );
                })}
                {Math.floor(Number(selectedStock?.quantity || 0)) > 0 && (
                  <Button
                    type="button"
                    variant={Number(transferQty) === Math.floor(Number(selectedStock?.quantity || 0)) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransferQty(String(Math.floor(Number(selectedStock?.quantity || 0))))}
                    className={cn(
                      "h-6 text-[10px] px-2.5 font-mono rounded-lg transition-all",
                      Number(transferQty) === Math.floor(Number(selectedStock?.quantity || 0))
                        ? "bg-sky-600 hover:bg-sky-500 text-white font-bold"
                        : "hover:border-sky-500/50 hover:text-sky-300"
                    )}
                  >
                    Máx ({Math.floor(Number(selectedStock?.quantity || 0))})
                  </Button>
                )}
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
              disabled={transferToStorageMutation.isPending || !transferQty || activeBaus.length === 0}
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
                {Math.round(Number(selectedStock?.quantity || 0)).toLocaleString("pt-BR")} {selectedStock?.product?.unidade}
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
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Quantidade a Liberar para Venda *</Label>
                {Math.floor(Number(selectedStock?.quantity || 0)) > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTransferQty(String(Math.floor(Number(selectedStock?.quantity || 0))))}
                    className="h-5 px-2 text-[10px] text-amber-400 hover:text-amber-300 font-mono rounded cursor-pointer"
                  >
                    Usar Máximo ({Math.floor(Number(selectedStock?.quantity || 0))})
                  </Button>
                )}
              </div>
              <Input
                type="number"
                step="1"
                min="1"
                max={Math.floor(Number(selectedStock?.quantity || 0))}
                value={transferQty}
                onChange={(e) => {
                  const val = e.target.value;
                  setTransferQty(val ? String(Math.max(1, parseInt(val, 10) || 0)) : "");
                }}
                className="text-base font-mono font-bold text-amber-300 rounded-xl bg-background/50"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[1, 5, 10, 25, 50, 100].map((qty) => {
                  const maxVal = Math.floor(Number(selectedStock?.quantity || 0));
                  const isAvailable = maxVal >= qty;
                  const isSelected = Number(transferQty) === qty;
                  return (
                    <Button
                      key={qty}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={!isAvailable}
                      onClick={() => setTransferQty(String(qty))}
                      className={cn(
                        "h-6 text-[10px] px-2.5 font-mono rounded-lg transition-all",
                        isSelected
                          ? "bg-amber-600 hover:bg-amber-500 text-white font-bold"
                          : isAvailable
                          ? "hover:border-amber-500/50 hover:text-amber-300"
                          : "opacity-40"
                      )}
                    >
                      {qty} un
                    </Button>
                  );
                })}
                {Math.floor(Number(selectedStock?.quantity || 0)) > 0 && (
                  <Button
                    type="button"
                    variant={Number(transferQty) === Math.floor(Number(selectedStock?.quantity || 0)) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTransferQty(String(Math.floor(Number(selectedStock?.quantity || 0))))}
                    className={cn(
                      "h-6 text-[10px] px-2.5 font-mono rounded-lg transition-all",
                      Number(transferQty) === Math.floor(Number(selectedStock?.quantity || 0))
                        ? "bg-amber-600 hover:bg-amber-500 text-white font-bold"
                        : "hover:border-amber-500/50 hover:text-amber-300"
                    )}
                  >
                    Máx ({Math.floor(Number(selectedStock?.quantity || 0))})
                  </Button>
                )}
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
                {Math.round(Number(selectedStock?.quantity || 0)).toLocaleString("pt-BR")} {selectedStock?.product?.unidade}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Novo Saldo Absoluto (&ge; 0) *</Label>
              <Input
                type="number"
                step="1"
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

      {/* ==================================================== */}
      {/* MODAL 4: RETORNAR SALDO AO ARMAZÉM (DE BAÚ OU VENDAS) */}
      {/* ==================================================== */}
      <Dialog
        open={!!returnState}
        onOpenChange={(open) => !open && setReturnState(null)}
      >
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-emerald-400" />
              <span>Retornar Saldo ao Armazém Central</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Produto: <strong className="text-foreground">{returnState?.product?.nome}</strong> · Origem:{" "}
              <Badge variant="outline" className="font-bold text-[10px] ml-1">
                {returnState?.origin === "SALE" ? "Disponível para Venda" : "Baú de Estoque"}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Devolução ao Armazém</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                A quantidade retornada será debitada da origem e incorporada imediatamente ao saldo físico do Armazém Central.
              </p>
            </div>

            {/* SE FOR DE BAÚ E TIVER MÚLTIPLOS BAÚS ATIVOS */}
            {returnState?.origin === "BAU" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Baú de Origem *</Label>
                <Select
                  value={returnState.bauId || activeBaus[0]?.id || ""}
                  onValueChange={(val) => {
                    const newMax = returnState.product ? Math.floor(Number(getBauProductStock(val, returnState.product.id))) : 0;
                    setReturnState({ ...returnState, bauId: val, maxQty: newMax });
                    if (Number(returnQty) > newMax) {
                      setReturnQty(newMax > 0 ? String(newMax) : "");
                    }
                  }}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background/50 text-xs font-bold">
                    <SelectValue placeholder="Selecione o baú de origem..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBaus.map((b) => (
                      <SelectItem key={b.id} value={b.id} className="text-xs">
                        {b.nome} (Saldo: {returnState.product ? getBauProductStock(b.id, returnState.product.id) : 0} un)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* QUANTIDADE */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Quantidade a Retornar *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Disponível: <strong className="text-emerald-400">{returnState?.maxQty || 0}</strong> {returnState?.product?.unidade}
                  </span>
                  {(returnState?.maxQty || 0) > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReturnQty(String(returnState?.maxQty || 0))}
                      className="h-5 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 font-mono rounded cursor-pointer"
                    >
                      Usar Máximo ({returnState?.maxQty || 0})
                    </Button>
                  )}
                </div>
              </div>
              <Input
                type="number"
                step="1"
                min="1"
                max={returnState?.maxQty || 1}
                value={returnQty}
                onChange={(e) => {
                  const val = e.target.value;
                  setReturnQty(val ? String(Math.max(1, parseInt(val, 10) || 0)) : "");
                }}
                className="text-base font-mono font-bold text-emerald-400 rounded-xl bg-background/50"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[1, 5, 10, 25, 50, 100].map((qty) => {
                  const isAvailable = (returnState?.maxQty || 0) >= qty;
                  const isSelected = Number(returnQty) === qty;
                  return (
                    <Button
                      key={qty}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={!isAvailable}
                      onClick={() => setReturnQty(String(qty))}
                      className={cn(
                        "h-6 text-[10px] px-2.5 font-mono rounded-lg transition-all",
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          : isAvailable
                          ? "hover:border-emerald-500/50 hover:text-emerald-400"
                          : "opacity-40"
                      )}
                    >
                      {qty} un
                    </Button>
                  );
                })}
                {(returnState?.maxQty || 0) > 0 && (
                  <Button
                    type="button"
                    variant={Number(returnQty) === (returnState?.maxQty || 0) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReturnQty(String(returnState?.maxQty || 0))}
                    className={cn(
                      "h-6 text-[10px] px-2.5 font-mono rounded-lg transition-all",
                      Number(returnQty) === (returnState?.maxQty || 0)
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        : "hover:border-emerald-500/50 hover:text-emerald-400"
                    )}
                  >
                    Máx ({returnState?.maxQty || 0})
                  </Button>
                )}
              </div>
            </div>

            {/* MOTIVO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo do Retorno (Opcional):</Label>
              <Input
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Ex: Devolução de saldo não comercializado / reorganização física"
                className="text-xs rounded-xl bg-background/50"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReturnState(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => returnStockMutation.mutate()}
              disabled={returnStockMutation.isPending || !returnQty}
              className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl gap-1.5"
            >
              {returnStockMutation.isPending ? "Retornando..." : "Confirmar Retorno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL 5: CONFIRMAÇÃO DE ESTORNO DE MOVIMENTAÇÃO */}
      {/* ==================================================== */}
      <Dialog
        open={!!revertingMovement}
        onOpenChange={(open) => !open && setRevertingMovement(null)}
      >
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
              <Undo2 className="h-5 w-5 text-rose-400" />
              <span>Confirmar Estorno de Transferência</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Deseja desfazer a transferência e retornar os itens integralmente ao saldo do armazém?
            </DialogDescription>
          </DialogHeader>

          {revertingMovement && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>Atenção: Ação de Estorno de Saldo</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  A quantidade de{" "}
                  <strong className="text-foreground font-mono">
                    {Math.round(Number(revertingMovement.quantity))}x {revertingMovement.product?.nome || "itens"}
                  </strong>{" "}
                  será retirada de <strong>{revertingMovement.destination}</strong> e voltará imediatamente para o{" "}
                  <strong>Armazém Central</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-background/50 border border-border/60 space-y-1 text-[11px]">
                <p><strong>Produto:</strong> {revertingMovement.product?.nome}</p>
                <p><strong>Data da Transferência:</strong> {new Date(revertingMovement.created_at).toLocaleString("pt-BR")}</p>
                <p><strong>Destino Anterior:</strong> {revertingMovement.destination}</p>
                <p><strong>Quantidade:</strong> {Math.round(Number(revertingMovement.quantity))} {revertingMovement.product?.unidade}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRevertingMovement(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => revertingMovement && revertMovementMutation.mutate(revertingMovement)}
              disabled={revertMovementMutation.isPending}
              className="text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl gap-1.5"
            >
              {revertMovementMutation.isPending ? "Estornando..." : "Confirmar Estorno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL 6: GESTÃO AVANÇADA DE SALDO (TRANSFERIR / AJUSTAR / BAIXAR) */}
      {/* ==================================================== */}
      <Dialog
        open={!!managingStockItem}
        onOpenChange={(open) => !open && setManagingStockItem(null)}
      >
        <DialogContent className="max-w-lg surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <span>Gerenciador de Saldos do Produto</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Produto: <strong className="text-foreground">{managingStockItem?.product?.nome}</strong> ({managingStockItem?.product?.unidade})
            </DialogDescription>
          </DialogHeader>

          {managingStockItem && (
            <div className="space-y-4 py-2 text-xs">
              {/* VISÃO GERAL DE SALDOS DO PRODUTO */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-secondary/30 border border-border/60">
                <div className="text-center p-2 rounded-xl bg-background/50">
                  <span className="text-[10px] text-muted-foreground block font-bold">Armazém</span>
                  <span className="font-mono text-emerald-400 font-black text-sm">
                    {Math.round(Number(managingStockItem.quantity || 0))}
                  </span>
                </div>
                <div className="text-center p-2 rounded-xl bg-background/50">
                  <span className="text-[10px] text-muted-foreground block font-bold">Vendas</span>
                  <span className="font-mono text-amber-300 font-black text-sm">
                    {Math.round(Number(managingStockItem.product?.sale_available_quantity || 0))}
                  </span>
                </div>
                <div className="text-center p-2 rounded-xl bg-background/50">
                  <span className="text-[10px] text-muted-foreground block font-bold">Baús</span>
                  <span className="font-mono text-sky-400 font-black text-sm">
                    {Math.round(Number(managingStockItem.product?.estoque_atual || 0))}
                  </span>
                </div>
              </div>

              {/* TIPO DE AÇÃO */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ação Desejada *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={stockAction === "TRANSFER" ? "default" : "outline"}
                    onClick={() => setStockAction("TRANSFER")}
                    className="h-8 text-[11px] font-bold rounded-xl"
                  >
                    Transferir
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={stockAction === "RETURN_WAREHOUSE" ? "default" : "outline"}
                    onClick={() => setStockAction("RETURN_WAREHOUSE")}
                    className="h-8 text-[11px] font-bold rounded-xl text-emerald-300"
                  >
                    Retornar Armazém
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={stockAction === "ADJUST" ? "default" : "outline"}
                    onClick={() => setStockAction("ADJUST")}
                    className="h-8 text-[11px] font-bold rounded-xl text-violet-300"
                  >
                    Ajustar Saldo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={stockAction === "REMOVE" ? "destructive" : "outline"}
                    onClick={() => setStockAction("REMOVE")}
                    className="h-8 text-[11px] font-bold rounded-xl text-rose-300"
                  >
                    Baixar / Descartar
                  </Button>
                </div>
              </div>

              {/* ORIGEM E DESTINO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ORIGEM */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Origem (De onde sai) *</Label>
                  <Select
                    value={stockOrigin}
                    onValueChange={(val: StockLocation) => setStockOrigin(val)}
                  >
                    <SelectTrigger className="h-9 rounded-xl bg-background/50 text-xs">
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAREHOUSE" className="text-xs">Armazém Central</SelectItem>
                      <SelectItem value="SALE" className="text-xs">Disponível p/ Venda</SelectItem>
                      <SelectItem value="BAU" className="text-xs">Baú de Estoque</SelectItem>
                    </SelectContent>
                  </Select>

                  {stockOrigin === "BAU" && (
                    <div className="pt-1">
                      <Select value={stockOriginBauId} onValueChange={setStockOriginBauId}>
                        <SelectTrigger className="h-9 rounded-xl bg-background/50 text-xs">
                          <SelectValue placeholder="Selecione o baú de origem" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeBaus.map((b) => (
                            <SelectItem key={b.id} value={b.id} className="text-xs">
                              {b.nome} ({managingStockItem.product ? getBauProductStock(b.id, managingStockItem.product.id) : 0} un)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* DESTINO (SE FOR TRANSFERÊNCIA) */}
                {(stockAction === "TRANSFER" || stockAction === "RETURN_WAREHOUSE") && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Destino (Para onde vai) *</Label>
                    <Select
                      value={stockAction === "RETURN_WAREHOUSE" ? "WAREHOUSE" : stockDestination}
                      disabled={stockAction === "RETURN_WAREHOUSE"}
                      onValueChange={(val: StockLocation) => setStockDestination(val)}
                    >
                      <SelectTrigger className="h-9 rounded-xl bg-background/50 text-xs">
                        <SelectValue placeholder="Destino" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WAREHOUSE" className="text-xs">Armazém Central</SelectItem>
                        <SelectItem value="SALE" className="text-xs">Disponível p/ Venda</SelectItem>
                        <SelectItem value="BAU" className="text-xs">Baú de Estoque</SelectItem>
                      </SelectContent>
                    </Select>

                    {stockAction === "TRANSFER" && stockDestination === "BAU" && (
                      <div className="pt-1">
                        <Select value={stockDestinationBauId} onValueChange={setStockDestinationBauId}>
                          <SelectTrigger className="h-9 rounded-xl bg-background/50 text-xs">
                            <SelectValue placeholder="Selecione o baú de destino" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeBaus.map((b) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">
                                {b.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* QUANTIDADE */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    {stockAction === "ADJUST" ? "Novo Saldo Absoluto (≥ 0) *" : "Quantidade a Movimentar / Baixar *"}
                  </Label>
                  {stockAction !== "ADJUST" && managingStockItem && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const maxVal = Math.floor(Number(
                          stockOrigin === "WAREHOUSE"
                            ? (managingStockItem?.quantity || 0)
                            : stockOrigin === "SALE"
                            ? (managingStockItem?.product?.sale_available_quantity || 0)
                            : (managingStockItem?.product ? getBauProductStock(stockOriginBauId, managingStockItem.product.id) : 0)
                        ));
                        if (maxVal > 0) setStockQuantity(String(maxVal));
                      }}
                      className="h-5 px-2 text-[10px] text-primary hover:text-primary/80 font-mono rounded cursor-pointer"
                    >
                      Usar Máximo (
                      {Math.floor(Number(
                        stockOrigin === "WAREHOUSE"
                          ? (managingStockItem?.quantity || 0)
                          : stockOrigin === "SALE"
                          ? (managingStockItem?.product?.sale_available_quantity || 0)
                          : (managingStockItem?.product ? getBauProductStock(stockOriginBauId, managingStockItem.product.id) : 0)
                      ))}
                      )
                    </Button>
                  )}
                </div>
                <Input
                  type="number"
                  step="1"
                  min={stockAction === "ADJUST" ? "0" : "1"}
                  value={stockQuantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStockQuantity(val ? String(Math.max(stockAction === "ADJUST" ? 0 : 1, parseInt(val, 10) || 0)) : "");
                  }}
                  className="text-base font-mono font-bold text-primary rounded-xl bg-background/50"
                />
                {stockAction !== "ADJUST" && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {[1, 5, 10, 25, 50, 100].map((qty) => {
                      const maxVal = Math.floor(Number(
                        stockOrigin === "WAREHOUSE"
                          ? (managingStockItem?.quantity || 0)
                          : stockOrigin === "SALE"
                          ? (managingStockItem?.product?.sale_available_quantity || 0)
                          : (managingStockItem?.product ? getBauProductStock(stockOriginBauId, managingStockItem.product.id) : 0)
                      ));
                      const isAvailable = maxVal >= qty;
                      const isSelected = Number(stockQuantity) === qty;
                      return (
                        <Button
                          key={qty}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          disabled={!isAvailable}
                          onClick={() => setStockQuantity(String(qty))}
                          className={cn(
                            "h-6 text-[10px] px-2.5 font-mono rounded-lg transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground font-bold"
                              : isAvailable
                              ? "hover:border-primary/50 hover:text-primary"
                              : "opacity-40"
                          )}
                        >
                          {qty} un
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MOTIVO */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Motivo / Observação:</Label>
                <Input
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="Ex: Auditoria interna, lote transferido, descarte de avaria..."
                  className="text-xs rounded-xl bg-background/50"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setManagingStockItem(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => manageStockMutation.mutate()}
              disabled={manageStockMutation.isPending || !stockQuantity}
              className={cn(
                "text-xs font-bold rounded-xl gap-1.5",
                stockAction === "REMOVE"
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : stockAction === "RETURN_WAREHOUSE"
                  ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {manageStockMutation.isPending
                ? "Processando..."
                : stockAction === "REMOVE"
                ? "Confirmar Baixa"
                : stockAction === "ADJUST"
                ? "Salvar Ajuste"
                : stockAction === "RETURN_WAREHOUSE"
                ? "Confirmar Retorno"
                : "Confirmar Transferência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL: TRANSFERIR MATÉRIA-PRIMA DE BAÚ MANUAL */}
      {/* ==================================================== */}
      <Dialog open={pullRawModalOpen} onOpenChange={setPullRawModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <ArrowDownLeft className="h-5 w-5 text-amber-400" />
              Transferir Matéria-Prima de Baú Manual
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transfira insumos de um baú com modo de movimentação manual diretamente para o estoque do armazém.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Selecionar Matéria-Prima */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Matéria-Prima</Label>
              <Select
                value={selectedMaterialForPull?.id || ""}
                onValueChange={(val) => {
                  const found = rawMaterials.find((m) => m.id === val);
                  setSelectedMaterialForPull(found || null);
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/60">
                  <SelectValue placeholder="Selecione a matéria-prima" />
                </SelectTrigger>
                <SelectContent>
                  {rawMaterials.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name} (Saldo atual: {m.stock_quantity} {m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Selecionar Baú de Origem (Apenas Manuais) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Baú de Origem (Modo Manual)</Label>
                <span className="text-[10px] text-amber-400/90 font-mono font-bold">
                  {manualBaus.length} baú(s) manual(is)
                </span>
              </div>
              {manualBaus.length === 0 ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  ⚠️ Nenhum baú ativo em modo de movimentação manual foi encontrado. Apenas baús manuais permitem transferência de insumos para o armazém.
                </div>
              ) : (
                <Select value={selectedBauForPull} onValueChange={setSelectedBauForPull}>
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-background/60">
                    <SelectValue placeholder="Selecione o baú manual" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualBaus.map((b) => {
                      const stockInB = selectedMaterialForPull
                        ? getMaterialStockInBau(selectedMaterialForPull, b.id)
                        : 0;
                      return (
                        <SelectItem key={b.id} value={b.id} className="text-xs">
                          {b.nome} · [MODO MANUAL] · Disp: {stockInB} {selectedMaterialForPull?.unit || "un"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 3. Destaque Visual */}
            {selectedBauForPull && (
              <div className="p-3 rounded-xl border text-xs space-y-1.5 bg-amber-500/10 border-amber-500/30 text-amber-200">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <HandMetal className="h-4 w-4 text-amber-400" />
                    Baú em Modo de Movimentação MANUAL
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300">
                    Disponível no Baú: {availableInSelectedBau} {selectedMaterialForPull?.unit || "un"}
                  </Badge>
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  ⚠️ <strong>Regra de Transferência Manual:</strong> A quantidade será debitada do baú manual e creditada no estoque de matérias-primas do armazém.
                </p>
              </div>
            )}

            {/* 4. Quantidade */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Quantidade a Transferir</Label>
                <div className="flex items-center gap-1">
                  {["10", "50", "100"].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setPullQuantity(qty)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 font-mono"
                    >
                      {qty}
                    </button>
                  ))}
                  {availableInSelectedBau > 0 && (
                    <button
                      type="button"
                      onClick={() => setPullQuantity(String(availableInSelectedBau))}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono"
                    >
                      TUDO ({availableInSelectedBau})
                    </button>
                  )}
                </div>
              </div>
              <Input
                type="number"
                min="1"
                max={availableInSelectedBau || undefined}
                value={pullQuantity}
                onChange={(e) => setPullQuantity(e.target.value)}
                placeholder="Ex: 50"
                className="h-9 text-xs rounded-xl bg-background/60 font-mono"
              />
            </div>

            {/* 5. Motivo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo / Observação (Opcional)</Label>
              <Input
                value={pullReason}
                onChange={(e) => setPullReason(e.target.value)}
                placeholder="Ex: Abastecimento de linha de manufatura"
                className="h-9 text-xs rounded-xl bg-background/60"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPullRawModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={
                pullRawMutation.isPending ||
                !selectedMaterialForPull ||
                !selectedBauForPull ||
                availableInSelectedBau <= 0
              }
              onClick={() => pullRawMutation.mutate()}
              className="text-xs rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white gap-1.5 shadow-md shadow-amber-600/20"
            >
              {pullRawMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownLeft className="h-4 w-4" />
              )}
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL: ENTRADA MANUAL DE MATÉRIA-PRIMA */}
      {/* ==================================================== */}
      <Dialog open={manualEntryModalOpen} onOpenChange={setManualEntryModalOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <PackagePlus className="h-5 w-5 text-emerald-400" />
              Entrada Manual de Matéria-Prima
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Adicione insumos diretamente ao estoque do armazém com registro completo em auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Selecionar Matéria-Prima */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Matéria-Prima</Label>
              <Select
                value={selectedMaterialForEntry?.id || ""}
                onValueChange={(val) => {
                  const found = rawMaterials.find((m) => m.id === val);
                  setSelectedMaterialForEntry(found || null);
                }}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/60">
                  <SelectValue placeholder="Selecione a matéria-prima" />
                </SelectTrigger>
                <SelectContent>
                  {rawMaterials.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name} (Saldo atual: {m.stock_quantity} {m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Previsão de Saldo */}
            {selectedMaterialForEntry && (
              <div className="p-3 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Saldo Atual:</span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {selectedMaterialForEntry.stock_quantity} {selectedMaterialForEntry.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[11px]">Saldo Projetado:</span>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {selectedMaterialForEntry.stock_quantity + (parseInt(manualEntryQuantity, 10) || 0)}{" "}
                    {selectedMaterialForEntry.unit}
                  </span>
                </div>
              </div>
            )}

            {/* Quantidade a Adicionar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Quantidade da Entrada</Label>
                <div className="flex items-center gap-1">
                  {["10", "50", "100", "500"].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setManualEntryQuantity(qty)}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-secondary hover:bg-secondary/80 font-mono"
                    >
                      +{qty}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                min="1"
                value={manualEntryQuantity}
                onChange={(e) => setManualEntryQuantity(e.target.value)}
                placeholder="Ex: 50"
                className="h-9 text-xs rounded-xl bg-background/60 font-mono"
              />
            </div>

            {/* Motivo / Observação */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo / Observação (Opcional)</Label>
              <Input
                value={manualEntryReason}
                onChange={(e) => setManualEntryReason(e.target.value)}
                placeholder="Ex: Coleta externa, compra avulsa, doação de membro..."
                className="h-9 text-xs rounded-xl bg-background/60"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManualEntryModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={manualEntryRawMutation.isPending || !selectedMaterialForEntry || !manualEntryQuantity}
              onClick={() => manualEntryRawMutation.mutate()}
              className="text-xs rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-md shadow-emerald-600/20"
            >
              {manualEntryRawMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PackagePlus className="h-4 w-4" />
              )}
              Confirmar Entrada Manual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
