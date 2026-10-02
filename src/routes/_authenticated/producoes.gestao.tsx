import { useState, useMemo, useEffect } from "react";
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
  BookOpen,
  Image as ImageIcon,
  Upload,
  Undo2,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useProducts,
  useRawMaterials,
  useProductRecipes,
  useProductions,
  useWarehouseStock,
  useWarehouseMovements,
  useSales,
  useCategories,
  useMembers,
  useBaus,
  useProductBaus,
  nameOf,
} from "@/hooks/useData";
import {
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  adjustRawMaterialStock,
  syncRawMaterialsAsProducts,
  getProductRecipes,
  saveProductRecipe,
  updateProductProductionSettings,
  manageProductionStock,
  type ManageStockAction,
  type StockLocation,
} from "@/services/productionService";
import { createProduct, updateProduct } from "@/lib/app-api";
import { PageHeader, NoAccess, ProductThumbnail } from "@/components/ui-kit";
import { ProductionNavHeader } from "@/components/productions/ProductionNavHeader";
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
import { currency } from "@/lib/format";
import type { RawMaterial, Product, Production, WarehouseMovement } from "@/lib/app-types";

export const Route = createFileRoute("/_authenticated/producoes/gestao")({
  component: GestaoProducaoPage,
});

export function GestaoProducaoPage() {
  const { hasPermission, isDevMode, isCeoMode, isDevUser, isCeoUser } = useAuth();
  const queryClient = useQueryClient();
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";

  const canAccess =
    isDevMode ||
    isCeoMode ||
    isDevUser ||
    isCeoUser ||
    hasPermission("production_management.view") ||
    hasPermission("view_production_management");

  const canManageProducts =
    isDevMode ||
    isCeoMode ||
    isDevUser ||
    isCeoUser ||
    hasPermission("production_management.products");

  const canManageMaterials =
    isDevMode ||
    isCeoMode ||
    isDevUser ||
    isCeoUser ||
    hasPermission("production_management.raw_materials");

  const canAuditProductions =
    isDevMode ||
    isCeoMode ||
    isDevUser ||
    isCeoUser ||
    hasPermission("production_management.productions");

  const canManageSettings =
    isDevMode ||
    isCeoMode ||
    isDevUser ||
    isCeoUser ||
    hasPermission("production_management.settings");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [periodFilter, setPeriodFilter] = useState<"all" | "today" | "7days" | "30days">("all");

  // Dados
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: rawMaterials = [], isLoading: loadingMaterials } = useRawMaterials();
  const { data: allRecipes = [] } = useProductRecipes();
  const { data: productions = [], isLoading: loadingProductions } = useProductions(200);
  const { data: warehouseStock = [] } = useWarehouseStock();
  const { data: movements = [], isLoading: loadingMovements } = useWarehouseMovements(undefined, 200);
  const { data: sales = [] } = useSales();
  const { data: categories = [] } = useCategories();
  const { data: members = [] } = useMembers();
  const { data: baus = [] } = useBaus();
  const { data: productBaus = [] } = useProductBaus();
  const activeBaus = useMemo(
    () => baus.filter((b) => b.ativo !== false && (b as any).is_active !== false),
    [baus]
  );

  // Estados de Busca e Filtros
  const [productSearch, setProductSearch] = useState("");
  const [productStockFilter, setProductStockFilter] = useState<"all" | "in_stock" | "producible">("all");
  const [materialSearch, setMaterialSearch] = useState("");
  const [productionSearch, setProductionSearch] = useState("");
  const [movementSearch, setMovementSearch] = useState("");
  const [movementTypeFilter, setMovementTypeFilter] = useState("all");

  // Modal de Gestão e Transferência de Saldos (Armazém / Baús / Vendas)
  const [managingStockProduct, setManagingStockProduct] = useState<Product | null>(null);
  const [stockAction, setStockAction] = useState<ManageStockAction | "RETURN_WAREHOUSE">("TRANSFER");
  const [stockOrigin, setStockOrigin] = useState<StockLocation>("WAREHOUSE");
  const [stockDestination, setStockDestination] = useState<StockLocation>("BAU");
  const [stockOriginBauId, setStockOriginBauId] = useState<string>("");
  const [stockDestinationBauId, setStockDestinationBauId] = useState<string>("");
  const [stockQuantity, setStockQuantity] = useState<string>("1");
  const [stockReason, setStockReason] = useState<string>("");

  // Modais de Matéria-Prima
  const [isNewMaterialOpen, setIsNewMaterialOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [selectedMaterialProductId, setSelectedMaterialProductId] = useState<string>("");
  const [materialName, setMaterialName] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [materialUnit, setMaterialUnit] = useState("un");
  const [materialStock, setMaterialStock] = useState("0");
  const [materialImageUrl, setMaterialImageUrl] = useState("");
  const [isUploadingMaterialImage, setIsUploadingMaterialImage] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<RawMaterial | null>(null);

  // Modal Ajuste de Estoque de Matéria-Prima
  const [adjustingMaterial, setAdjustingMaterial] = useState<RawMaterial | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<string>("10");
  const [adjustReason, setAdjustReason] = useState<string>("");

  // Modal de Produto (Configurações de Produção, Venda & Ficha Técnica)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodCanProduce, setProdCanProduce] = useState(false);
  const [prodCanSell, setProdCanSell] = useState(false);
  const [prodIsActive, setProdIsActive] = useState(true);
  const [prodYield, setProdYield] = useState<string>("1");
  const [prodUnitPrice, setProdUnitPrice] = useState<string>("0");
  const [recipeItems, setRecipeItems] = useState<Array<{ id: string; raw_material_id: string; quantity_required: string }>>([]);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);

  // Auto-sincronização transparente de matérias-primas com produtos e armazém
  useEffect(() => {
    if (rawMaterials.length > 0) {
      const hasUnlinked = rawMaterials.some((m) => !m.product_id);
      if (hasUnlinked) {
        void syncRawMaterialsAsProducts().then((res) => {
          if (res?.createdCount > 0) {
            void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
            void queryClient.invalidateQueries({ queryKey: ["products"] });
            void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
          }
        });
      }
    }
  }, [rawMaterials, queryClient]);

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
      producibleCount: products.filter((p) => p.ativo && p.can_be_produced === true).length,
      saleableCount: products.filter((p) => p.ativo && p.can_be_sold === true).length,
    };
  }, [productions, filteredProductionsByPeriod, warehouseStock, products, sales]);

  // MUTAÇÃO: Salvar Matéria-Prima (Criar ou Editar)
  const saveMaterialMutation = useMutation({
    mutationFn: async () => {
      if (!canManageMaterials) throw new Error("Você não possui permissão para cadastrar ou editar matérias-primas.");
      if (!materialName.trim()) throw new Error("Selecione um produto do estoque ou informe o nome da matéria-prima.");
      if (!materialUnit.trim()) throw new Error("Selecione a unidade da matéria-prima.");

      let prodId = selectedMaterialProductId && selectedMaterialProductId !== "custom" ? selectedMaterialProductId : null;

      // Se não tiver selecionado um produto existente, verificar se já existe produto com esse nome no estoque
      if (!prodId) {
        const found = products.find(p => p.nome.trim().toLowerCase() === materialName.trim().toLowerCase());
        if (found) {
          prodId = found.id;
        } else {
          // Cadastrar automaticamente como produto de estoque se caso não for cadastrada
          try {
            const newProd = await createProduct({
              nome: materialName.trim(),
              descricao: materialDesc.trim() || `Matéria-prima: ${materialName.trim()}`,
              unidade: materialUnit.trim(),
              imagem_url: materialImageUrl.trim() || undefined,
              estoque_minimo: 0,
              preco_sugerido: 0,
              can_be_produced: false,
              can_be_sold: false,
            });
            prodId = newProd.id;
          } catch (e) {
            console.warn("Aviso ao criar produto correspondente para matéria-prima:", e);
          }
        }
      }

      if (editingMaterial) {
        await updateRawMaterial(editingMaterial.id, {
          name: materialName.trim(),
          description: materialDesc.trim() || null,
          unit: materialUnit.trim(),
          image_url: materialImageUrl.trim() || null,
          product_id: prodId,
        });
      } else {
        await createRawMaterial({
          name: materialName.trim(),
          description: materialDesc.trim() || undefined,
          unit: materialUnit.trim(),
          stock_quantity: Math.max(0, parseFloat(materialStock) || 0),
          image_url: materialImageUrl.trim() || null,
          product_id: prodId,
        });
      }
    },
    onSuccess: () => {
      toast.success(
        editingMaterial
          ? "Matéria-prima atualizada com sucesso!"
          : "Matéria-prima cadastrada e vinculada ao estoque com sucesso!"
      );
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      setIsNewMaterialOpen(false);
      setEditingMaterial(null);
      setSelectedMaterialProductId("");
      setMaterialName("");
      setMaterialDesc("");
      setMaterialUnit("un");
      setMaterialStock("0");
      setMaterialImageUrl("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar matéria-prima.");
    },
  });

  // MUTAÇÃO: Sincronizar todas as matérias-primas como produtos de estoque
  const syncMaterialsMutation = useMutation({
    mutationFn: async () => {
      if (!canManageMaterials) throw new Error("Você não possui permissão para sincronizar matérias-primas.");
      return await syncRawMaterialsAsProducts();
    },
    onSuccess: (res) => {
      if (res.createdCount > 0) {
        toast.success(`${res.createdCount} matéria(s)-prima(s) cadastrada(s) como novos produtos de estoque!`);
      } else {
        toast.success("Todas as matérias-primas já estão cadastradas e sincronizadas no estoque!");
      }
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao sincronizar com o estoque.");
    },
  });

  // MUTAÇÃO: Excluir Matéria-Prima
  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canManageMaterials) throw new Error("Você não possui permissão para excluir matérias-primas.");
      return await deleteRawMaterial(id);
    },
    onSuccess: (res) => {
      toast.success(res.message || "Matéria-prima processada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["product_recipes"] });
      setMaterialToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao excluir matéria-prima.");
    },
  });

  // Upload de Foto de Matéria-Prima
  const handleUploadMaterialImage = async (file: File) => {
    setIsUploadingMaterialImage(true);
    try {
      const { uploadImageToPostimages } = await import("@/services/postimagesService");
      const url = await uploadImageToPostimages(file, { filename: `mat_${Date.now()}` });
      setMaterialImageUrl(url);
      toast.success("Foto da matéria-prima enviada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da imagem.");
    } finally {
      setIsUploadingMaterialImage(false);
    }
  };

  // MUTAÇÃO: Ajustar Estoque de Matéria-Prima (motivo opcional)
  const adjustMaterialMutation = useMutation({
    mutationFn: async () => {
      if (!canManageMaterials) throw new Error("Você não possui permissão para ajustar estoque de matérias-primas.");
      if (!adjustingMaterial) return;
      const numDelta = parseInt(adjustDelta, 10);
      if (isNaN(numDelta) || numDelta === 0) {
        throw new Error("Informe uma variação de quantidade válida.");
      }

      return adjustRawMaterialStock(adjustingMaterial.id, numDelta, adjustReason.trim() || undefined);
    },
    onSuccess: () => {
      toast.success("Estoque de matéria-prima ajustado com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["raw_materials"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
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
      if (!canManageMaterials) throw new Error("Você não possui permissão para alterar matérias-primas.");
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

  // Abertura do Modal de Configuração do Produto (Carrega Receita)
  const handleOpenProductConfig = async (prod: Product) => {
    setEditingProduct(prod);
    setProdCanProduce(prod.can_be_produced === true);
    setProdCanSell(prod.can_be_sold === true);
    setProdIsActive(prod.ativo !== false);
    setProdYield(String(prod.production_yield != null && Number(prod.production_yield) > 0 ? prod.production_yield : 1));
    setProdUnitPrice(String(prod.preco_sugerido ?? 0));
    setIsLoadingRecipe(true);
    try {
      const existing = await getProductRecipes(prod.id);
      if (existing.length > 0) {
        setRecipeItems(
          existing.map((e) => ({
            id: e.id,
            raw_material_id: e.raw_material_id,
            quantity_required: String(e.quantity_required),
          }))
        );
      } else {
        setRecipeItems([]);
      }
    } catch (err) {
      console.error("Erro ao carregar receita:", err);
      setRecipeItems([]);
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  const handleAddRecipeItem = () => {
    const firstMat = rawMaterials[0]?.id || "";
    setRecipeItems((prev) => [
      ...prev,
      { id: `rec-${Date.now()}-${Math.random()}`, raw_material_id: firstMat, quantity_required: "1" },
    ]);
  };

  const handleRemoveRecipeItem = (id: string) => {
    setRecipeItems((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRecipeItem = (id: string, updates: Partial<{ raw_material_id: string; quantity_required: string }>) => {
    setRecipeItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  // MUTAÇÃO: Salvar Configurações do Produto e Ficha Técnica / Receita
  const saveProductSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!canManageProducts) throw new Error("Você não possui permissão para configurar produtos.");
      if (!editingProduct) return;

      const numYield = Math.max(1, Math.round(parseFloat(prodYield) || 1));
      const numUnitPrice = Math.max(0, parseFloat(prodUnitPrice) || 0);

      // Salva flags de produção/venda, rendimento e preço unitário sugerido
      await updateProductProductionSettings(editingProduct.id, {
        can_be_produced: prodCanProduce,
        can_be_sold: prodCanSell,
        ativo: prodIsActive,
        production_yield: numYield,
        preco_sugerido: numUnitPrice,
      });

      // Salva itens da receita (sempre números inteiros)
      const validItems = recipeItems
        .filter((r) => r.raw_material_id && parseFloat(r.quantity_required) > 0)
        .map((r) => ({
          raw_material_id: r.raw_material_id,
          quantity_required: Math.max(1, Math.round(parseFloat(r.quantity_required) || 1)),
        }));

      await saveProductRecipe(editingProduct.id, numYield, validItems);
    },
    onSuccess: () => {
      toast.success("Configurações e receita de produção salvas com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product_recipes"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      setEditingProduct(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar configurações do produto.");
    },
  });

  // Cálculos de saldo do produto selecionado para o modal de gestão de estoque
  const managingWhStock = useMemo(() => {
    if (!managingStockProduct) return 0;
    const wh = warehouseStock.find((w) => w.product_id === managingStockProduct.id);
    return Number(wh?.quantity || 0);
  }, [warehouseStock, managingStockProduct]);

  const managingSaleStock = useMemo(() => {
    if (!managingStockProduct) return 0;
    return Number(managingStockProduct.sale_available_quantity || 0);
  }, [managingStockProduct]);

  const getBauProductStock = (bauId: string) => {
    if (!managingStockProduct || !bauId) return 0;
    const pb = productBaus.find(
      (p) => p.product_id === managingStockProduct.id && p.bau_id === bauId
    );
    return Number(pb?.quantidade || 0);
  };

  const currentOriginStock = useMemo(() => {
    if (stockOrigin === "WAREHOUSE") return managingWhStock;
    if (stockOrigin === "SALE") return managingSaleStock;
    if (stockOrigin === "BAU") return getBauProductStock(stockOriginBauId);
    return 0;
  }, [stockOrigin, managingWhStock, managingSaleStock, stockOriginBauId, productBaus, managingStockProduct]);

  const currentDestStock = useMemo(() => {
    const dest = stockAction === "RETURN_WAREHOUSE" ? "WAREHOUSE" : stockDestination;
    if (dest === "WAREHOUSE") return managingWhStock;
    if (dest === "SALE") return managingSaleStock;
    if (dest === "BAU") return getBauProductStock(stockDestinationBauId);
    return 0;
  }, [stockAction, stockDestination, managingWhStock, managingSaleStock, stockDestinationBauId, productBaus, managingStockProduct]);

  const handleOpenStockManager = (prod: Product) => {
    setManagingStockProduct(prod);
    setStockAction("TRANSFER");
    const wh = warehouseStock.find((w) => w.product_id === prod.id);
    const whQ = Number(wh?.quantity || 0);
    const saleQ = Number(prod.sale_available_quantity || 0);

    if (whQ > 0) {
      setStockOrigin("WAREHOUSE");
      setStockDestination("BAU");
      setStockQuantity(String(Math.min(10, whQ)));
    } else if (saleQ > 0) {
      setStockOrigin("SALE");
      setStockDestination("WAREHOUSE");
      setStockQuantity(String(Math.min(10, saleQ)));
    } else {
      setStockOrigin("BAU");
      setStockDestination("WAREHOUSE");
      setStockQuantity("1");
    }

    const defaultBau = activeBaus[0]?.id || "";
    setStockOriginBauId(defaultBau);
    const otherBau = activeBaus.find((b) => b.id !== defaultBau)?.id || defaultBau;
    setStockDestinationBauId(otherBau);
    setStockReason("");
  };

  // MUTAÇÃO: Mover, Retornar, Remover ou Ajustar Saldo de Produtos
  const manageStockMutation = useMutation({
    mutationFn: async () => {
      if (!managingStockProduct) return;
      const numQ = Math.max(stockAction === "ADJUST" ? 0 : 1, parseInt(stockQuantity, 10) || 0);
      if (isNaN(numQ) || (stockAction !== "ADJUST" && numQ <= 0) || (stockAction === "ADJUST" && numQ < 0)) {
        throw new Error("Informe uma quantidade válida.");
      }

      const actualAction: ManageStockAction =
        stockAction === "RETURN_WAREHOUSE" ? "TRANSFER" : stockAction;
      const actualDestination: StockLocation =
        stockAction === "RETURN_WAREHOUSE" ? "WAREHOUSE" : stockDestination;

      if (actualAction === "TRANSFER" && stockOrigin === actualDestination && stockOrigin !== "BAU") {
        throw new Error("Origem e destino devem ser diferentes.");
      }

      if (
        actualAction === "TRANSFER" &&
        stockOrigin === "BAU" &&
        actualDestination === "BAU" &&
        stockOriginBauId === stockDestinationBauId
      ) {
        throw new Error("O baú de destino deve ser diferente do baú de origem.");
      }

      return manageProductionStock({
        productId: managingStockProduct.id,
        action: actualAction,
        origin: stockOrigin,
        destination: actualAction === "TRANSFER" ? actualDestination : undefined,
        originBauId: stockOrigin === "BAU" ? stockOriginBauId : undefined,
        destinationBauId: actualDestination === "BAU" ? stockDestinationBauId : undefined,
        quantity: numQ,
        reason: stockReason.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Operação de estoque processada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_stock"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["warehouse_movements"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      setManagingStockProduct(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao processar movimentação de estoque.");
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

        <ProductionNavHeader currentTab="gestao" />
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

            {/* FILTROS RÁPIDOS DE ESTOQUE */}
            <div className="flex items-center gap-1.5">
              {[
                { id: "all", label: "Todos" },
                { id: "in_stock", label: "Com Saldo" },
                { id: "producible", label: "Produzíveis" },
              ].map((f) => (
                <Button
                  key={f.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProductStockFilter(f.id as any)}
                  className={cn(
                    "h-8 px-2.5 text-xs rounded-xl transition-all cursor-pointer font-semibold",
                    productStockFilter === f.id
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <Card className="surface-card border-border/70 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                      <th className="p-3.5 pl-5">Produto</th>
                      <th className="p-3.5 text-center">Preço Unitário</th>
                      <th className="p-3.5 text-center">Saldos (Armazém / Venda / Baús)</th>
                      <th className="p-3.5 text-center">Permite Produção</th>
                      <th className="p-3.5 text-center">Permite Venda</th>
                      <th className="p-3.5 text-center">Ficha Técnica / Receita</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 pr-5 text-right">Ações de Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {products
                      .filter((prod) => {
                        if (productSearch && !prod.nome.toLowerCase().includes(productSearch.toLowerCase())) {
                          return false;
                        }
                        const wh = warehouseStock.find((w) => w.product_id === prod.id);
                        const whQ = Number(wh?.quantity || 0);
                        const saleQ = Number(prod.sale_available_quantity || 0);
                        const bauQ = Number(prod.estoque_atual || 0);
                        const totalQ = whQ + saleQ + bauQ;

                        if (productStockFilter === "in_stock" && totalQ <= 0) return false;
                        if (productStockFilter === "producible" && !prod.can_be_produced) return false;
                        return true;
                      })
                      .map((prod) => {
                        const canProduce = prod.can_be_produced === true;
                        const canSell = prod.can_be_sold === true;
                        const cat = categories.find((c) => c.id === prod.categoria_id);
                        const prodRecipes = allRecipes.filter((r) => r.product_id === prod.id);
                        const wh = warehouseStock.find((w) => w.product_id === prod.id);
                        const whQty = Number(wh?.quantity || 0);
                        const saleQty = Number(prod.sale_available_quantity || 0);
                        const bauQty = Number(prod.estoque_atual || 0);
                        const totalStock = whQty + saleQty + bauQty;

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
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                                    <span>Un: {prod.unidade}</span>
                                    <span>·</span>
                                    <span>{cat?.nome || "Sem Categoria"}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* PREÇO UNITÁRIO SUGERIDO */}
                            <td className="p-3.5 text-center font-mono font-bold text-emerald-400">
                              {prod.preco_sugerido && Number(prod.preco_sugerido) > 0 ? (
                                currency(Number(prod.preco_sugerido))
                              ) : (
                                <span className="text-muted-foreground/60 font-normal text-[11px]">Não def.</span>
                              )}
                            </td>

                            {/* SALDOS POR LOCALIZAÇÃO */}
                            <td className="p-3.5 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center justify-center gap-1 font-mono text-[10px] flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "px-1.5 py-0",
                                      whQty > 0
                                        ? "bg-sky-500/15 text-sky-300 border-sky-500/30 font-bold"
                                        : "text-muted-foreground/60 border-border/40"
                                    )}
                                    title="Saldo no Armazém da Fábrica"
                                  >
                                    Armazém: {whQty}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "px-1.5 py-0",
                                      saleQty > 0
                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold"
                                        : "text-muted-foreground/60 border-border/40"
                                    )}
                                    title="Disponível para Venda Comercial"
                                  >
                                    Venda: {saleQty}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "px-1.5 py-0",
                                      bauQty > 0
                                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold"
                                        : "text-muted-foreground/60 border-border/40"
                                    )}
                                    title="Saldo armazenado em Baús"
                                  >
                                    Baús: {bauQty}
                                  </Badge>
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  Total Geral: <strong className={cn(totalStock > 0 ? "text-foreground font-bold" : "text-muted-foreground")}>{totalStock} {prod.unidade}</strong>
                                </span>
                              </div>
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
                              {canProduce ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] font-mono",
                                      prodRecipes.length > 0
                                        ? "bg-sky-500/10 text-sky-300 border-sky-500/30"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    )}
                                  >
                                    {prodRecipes.length > 0
                                      ? `${prodRecipes.length} insumo(s)`
                                      : "Sem receita definida"}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    Rendimento: <strong className="text-foreground">{prod.production_yield || 1}</strong> {prod.unidade}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">—</span>
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
                              <div className="flex items-center justify-end gap-1.5">
                                {/* MOVER / GERENCIAR SALDO */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenStockManager(prod)}
                                  className="h-7 px-2.5 text-xs rounded-lg gap-1 font-bold text-amber-300 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
                                  title="Mover, remover, retornar ou ajustar saldo em baús, armazém e vendas"
                                >
                                  <ArrowRightLeft className="h-3 w-3" />
                                  <span>Mover Saldo</span>
                                </Button>

                                {/* CONFIGURAR PRODUTO */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenProductConfig(prod)}
                                  className="h-7 px-2 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground"
                                  title="Configurações e Ficha Técnica"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  <span>Configurar</span>
                                </Button>
                              </div>
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

            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setEditingMaterial(null);
                  setSelectedMaterialProductId("");
                  setMaterialName("");
                  setMaterialDesc("");
                  setMaterialUnit("un");
                  setMaterialStock("0");
                  setMaterialImageUrl("");
                  setIsNewMaterialOpen(true);
                }}
                className="h-9 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Nova Matéria-Prima</span>
              </Button>
            </div>
          </div>

          <Card className="surface-card border-border/70 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-muted-foreground font-semibold">
                      <th className="p-3.5 pl-5">Matéria-Prima</th>
                      <th className="p-3.5">Descrição</th>
                      <th className="p-3.5 text-right font-mono">Saldo em Armazém</th>
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
                          <td className="p-3.5 pl-5">
                            <div className="flex items-center gap-3">
                              <ProductThumbnail
                                src={mat.image_url}
                                alt={mat.name}
                                className="h-9 w-9 rounded-xl shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-foreground">{mat.name}</p>
                                  {mat.product_id ? (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-sky-500/10 text-sky-400 border-sky-500/30">
                                      Estoque Vinculado
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-400 border-amber-500/30">
                                      Pendente Estoque
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  Unidade: {mat.unit}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 text-muted-foreground max-w-md truncate">
                            {mat.description || "—"}
                          </td>

                          <td className="p-3.5 text-right font-mono font-black text-emerald-400">
                            {(() => {
                              const wh = warehouseStock.find((w) => w.product_id === mat.product_id);
                              const qty = wh ? Number(wh.quantity || 0) : Number(mat.stock_quantity || 0);
                              return qty.toLocaleString("pt-BR");
                            })()}{" "}
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
                                  setSelectedMaterialProductId(mat.product_id || "");
                                  setMaterialName(mat.name);
                                  setMaterialDesc(mat.description || "");
                                  setMaterialUnit(mat.unit || "un");
                                  setMaterialImageUrl(mat.image_url || "");
                                  setIsNewMaterialOpen(true);
                                }}
                                title="Editar Matéria-Prima"
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>

                              {/* EXCLUIR */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setMaterialToDelete(mat)}
                                title="Excluir Matéria-Prima"
                                className="h-7 w-7 p-0 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
              {editingMaterial ? "Editar Matéria-Prima" : "Adicionar Matéria-Prima"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione um produto do estoque ou informe as definições da matéria-prima.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* 1. SELEÇÃO DO PRODUTO DE ESTOQUE */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
              <Label className="text-xs font-bold text-amber-200 flex items-center justify-between">
                <span>Produto de Estoque *</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  Selecione para preencher automaticamente
                </span>
              </Label>
              <Select
                value={selectedMaterialProductId}
                onValueChange={(val) => {
                  setSelectedMaterialProductId(val);
                  if (val === "custom") {
                    setMaterialName("");
                    return;
                  }
                  const prod = products.find((p) => p.id === val);
                  if (prod) {
                    setMaterialName(prod.nome);
                    if (prod.unidade) setMaterialUnit(prod.unidade);
                    if (prod.imagem_url) setMaterialImageUrl(prod.imagem_url);
                    if (prod.descricao) setMaterialDesc(prod.descricao);
                    if (!editingMaterial) {
                      setMaterialStock(String(prod.estoque_atual || 0));
                    }
                  }
                }}
              >
                <SelectTrigger className="text-xs rounded-xl bg-background/80 border-border/70 h-9 font-medium">
                  <SelectValue placeholder="Selecione um produto do estoque..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="custom" className="text-xs font-bold text-amber-400">
                    + Digitar Outro / Cadastrar Novo Produto
                  </SelectItem>
                  {products.map((p) => {
                    const alreadyIsMat = rawMaterials.some(
                      (m) =>
                        (editingMaterial ? m.id !== editingMaterial.id : true) &&
                        (m.product_id === p.id || m.name.toLowerCase() === p.nome.toLowerCase())
                    );
                    return (
                      <SelectItem key={p.id} value={p.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{p.nome}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            (Estoque: {p.estoque_atual} {p.unidade})
                          </span>
                          {alreadyIsMat && (
                            <span className="text-[10px] text-amber-400/90 font-mono">
                              • Já adicionado
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {selectedMaterialProductId && selectedMaterialProductId !== "custom" && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 px-1">
                  <span>Vinculado ao produto de estoque.</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMaterialProductId("custom")}
                    className="text-amber-400 hover:underline text-[10px]"
                  >
                    Digitar outro nome
                  </button>
                </div>
              )}
            </div>

            {/* NOME DA MATÉRIA-PRIMA */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome da Matéria-Prima *</Label>
              <Input
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Ex: Chapa de Metal, Linha, Arame..."
                className="text-xs rounded-xl"
              />
            </div>
            {/* FOTO DA MATÉRIA-PRIMA */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Foto da Matéria-Prima (Opcional)</Label>
              <div className="flex items-center gap-3">
                <ProductThumbnail
                  src={materialImageUrl}
                  alt={materialName || "Insumo"}
                  className="h-16 w-16 rounded-2xl border border-border/70 shrink-0"
                />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUploadMaterialImage(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingMaterialImage}
                        className="h-7 text-xs rounded-lg gap-1.5 pointer-events-none"
                      >
                        {isUploadingMaterialImage ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        <span>{isUploadingMaterialImage ? "Enviando..." : "Enviar Foto"}</span>
                      </Button>
                    </label>

                    {materialImageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMaterialImageUrl("")}
                        className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 rounded-lg gap-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Remover</span>
                      </Button>
                    )}
                  </div>
                  <Input
                    value={materialImageUrl}
                    onChange={(e) => setMaterialImageUrl(e.target.value)}
                    placeholder="Ou cole a URL direta da imagem..."
                    className="text-[11px] h-7 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Unidade de Medida *</Label>
              <Select value={materialUnit} onValueChange={setMaterialUnit}>
                <SelectTrigger className="text-xs rounded-xl bg-background/50 border-border/60">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="un">Unidade (un)</SelectItem>
                  <SelectItem value="kg">Quilograma (kg)</SelectItem>
                  <SelectItem value="g">Grama (g)</SelectItem>
                  <SelectItem value="mg">Miligrama (mg)</SelectItem>
                  <SelectItem value="l">Litro (l)</SelectItem>
                  <SelectItem value="ml">Mililitro (ml)</SelectItem>
                  <SelectItem value="pct">Pacote (pct)</SelectItem>
                  <SelectItem value="cx">Caixa (cx)</SelectItem>
                  <SelectItem value="fd">Fardo (fd)</SelectItem>
                  <SelectItem value="m">Metro (m)</SelectItem>
                  <SelectItem value="cm">Centímetro (cm)</SelectItem>
                  <SelectItem value="dose">Dose (dose)</SelectItem>
                  <SelectItem value="barra">Barra (barra)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!editingMaterial && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estoque Inicial (&ge; 0)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={materialStock}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMaterialStock(val ? String(Math.max(0, parseInt(val, 10) || 0)) : "");
                  }}
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
              Item: <strong className="text-foreground">{adjustingMaterial?.name}</strong> · Saldo em Armazém:{" "}
              <span className="font-mono text-emerald-400 font-bold">
                {(() => {
                  if (!adjustingMaterial) return 0;
                  const wh = warehouseStock.find((w) => w.product_id === adjustingMaterial.product_id);
                  const qty = wh ? Number(wh.quantity || 0) : Number(adjustingMaterial.stock_quantity || 0);
                  return qty.toLocaleString("pt-BR");
                })()}{" "}
                {adjustingMaterial?.unit}
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
                step="1"
                value={adjustDelta}
                onChange={(e) => {
                  const val = e.target.value;
                  setAdjustDelta(val ? String(parseInt(val, 10) || 0) : "");
                }}
                placeholder="Ex: 50 ou -20"
                className="text-base font-mono font-bold text-amber-300 rounded-xl"
              />
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {[1, 5, 10, 50, 100, -1, -5, -10, -50].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdjustDelta(String(d))}
                    className={cn(
                      "h-6 text-[10px] px-2 font-mono rounded-lg cursor-pointer",
                      d > 0 ? "hover:text-emerald-400 hover:border-emerald-500/50" : "hover:text-rose-400 hover:border-rose-500/50"
                    )}
                  >
                    {d > 0 ? `+${d}` : d}
                  </Button>
                ))}
              </div>
              {(() => {
                if (!adjustingMaterial) return null;
                const wh = warehouseStock.find((w) => w.product_id === adjustingMaterial.product_id);
                const cur = wh ? Number(wh.quantity || 0) : Number(adjustingMaterial.stock_quantity || 0);
                const delta = parseInt(adjustDelta, 10) || 0;
                const proj = cur + delta;
                return (
                  <p className="text-[11px] text-muted-foreground font-mono pt-1">
                    Saldo após o ajuste:{" "}
                    <strong className={cn(proj < 0 ? "text-rose-400" : "text-emerald-400", "font-bold")}>
                      {proj.toLocaleString("pt-BR")} {adjustingMaterial.unit}
                    </strong>
                  </p>
                );
              })()}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo do Ajuste (Opcional)</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ex: Compra de insumos, contagem manual ou descarte (opcional)"
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
              disabled={
                adjustMaterialMutation.isPending ||
                isNaN(parseFloat(adjustDelta)) ||
                parseFloat(adjustDelta) === 0
              }
              className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl"
            >
              {adjustMaterialMutation.isPending ? "Ajustando..." : "Confirmar Ajuste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL: CONFIRMAR EXCLUSÃO DE MATÉRIA-PRIMA */}
      {/* ==================================================== */}
      <Dialog
        open={Boolean(materialToDelete)}
        onOpenChange={(open) => !open && setMaterialToDelete(null)}
      >
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Excluir Matéria-Prima</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Tem certeza que deseja excluir a matéria-prima{" "}
              <strong className="text-foreground">{materialToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
            <p className="font-semibold">Regra de Segurança Histórica:</p>
            <p className="text-[11px] text-muted-foreground">
              Se esta matéria-prima já foi utilizada em produções anteriores, o sistema apenas irá <strong>desativá-la</strong> para preservar a auditoria dos lotes. Caso não haja produções vinculadas, ela será excluída permanentemente.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMaterialToDelete(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => materialToDelete && deleteMaterialMutation.mutate(materialToDelete.id)}
              disabled={deleteMaterialMutation.isPending}
              className="text-xs font-bold rounded-xl"
            >
              {deleteMaterialMutation.isPending ? "Excluindo..." : "Excluir Matéria-Prima"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL: CONFIGURAR PRODUTO (PRODUÇÃO, VENDA & RECEITA) */}
      {/* ==================================================== */}
      <Dialog
        open={Boolean(editingProduct)}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <Settings className="h-4 w-4 text-sky-400" />
              <span>Configurações & Ficha Técnica do Produto</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Item: <strong className="text-foreground">{editingProduct?.nome}</strong> ({editingProduct?.unidade})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2 text-xs">
            {/* PARÂMETROS GERAIS */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                Diretrizes de Acesso & Visibilidade
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                {/* PERMITIR PRODUÇÃO */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/60">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      Permitir Produção na Fábrica
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Se ativado, este item aparecerá na tela de Estação de Produção.
                    </p>
                  </div>
                  <Switch checked={prodCanProduce} onCheckedChange={setProdCanProduce} />
                </div>

                {/* PERMITIR VENDA */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/60">
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
                <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/60">
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
            </div>

            {/* SEÇÃO: PREÇO UNITÁRIO DE VENDA */}
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Preço Unitário Sugerido (R$)</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Valor base por unidade de <strong>{editingProduct?.nome}</strong> utilizado no registro de vendas e balcão.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-400">R$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prodUnitPrice}
                    onChange={(e) => setProdUnitPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-32 text-right text-sm font-mono font-bold text-emerald-400 rounded-xl"
                  />
                </div>
              </div>

              {/* Atalhos rápidos de preço */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
                <span className="text-[10px] text-muted-foreground font-semibold">Atalhos:</span>
                {[10, 50, 100, 250, 500, 1000, 2500, 5000].map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProdUnitPrice(String(v))}
                    className="h-6 text-[10px] px-2 font-mono rounded-lg hover:border-emerald-500/50 hover:text-emerald-300"
                  >
                    R$ {v}
                  </Button>
                ))}
              </div>
            </div>

            {/* SEÇÃO: FICHA TÉCNICA E RECEITA DE PRODUÇÃO */}
            {prodCanProduce && (
              <div className="space-y-4 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Factory className="h-3.5 w-3.5 text-amber-400" />
                      <span>Ficha Técnica / Receita de Fabricação</span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Defina as matérias-primas e a proporção de rendimento gerada por lote.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddRecipeItem}
                    disabled={rawMaterials.length === 0}
                    className="h-7 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Insumo</span>
                  </Button>
                </div>

                {/* RENDIMENTO (PRODUCE YIELD) */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-amber-200">
                        Rendimento Gerado por Receita *
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Quantidade de <strong>{editingProduct?.nome}</strong> ({editingProduct?.unidade}) que é produzida ao consumir os insumos da lista abaixo:
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={prodYield}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProdYield(val ? String(Math.max(1, parseInt(val, 10) || 1)) : "");
                        }}
                        placeholder="1"
                        className="w-24 text-right text-sm font-mono font-bold text-amber-300 rounded-xl"
                      />
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        {editingProduct?.unidade || "un"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* LISTA DE MATÉRIAS-PRIMAS DA RECEITA */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Matérias-Primas Consumidas por Ciclo
                  </Label>

                  {isLoadingRecipe ? (
                    <div className="flex items-center justify-center p-6 text-xs text-muted-foreground gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Carregando ingredientes da receita...</span>
                    </div>
                  ) : recipeItems.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground">
                      Nenhuma matéria-prima configurada nesta receita ainda. Clique em <strong>"Adicionar Insumo"</strong> acima para definir os insumos necessários.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {recipeItems.map((item, index) => {
                        const selectedMat = rawMaterials.find((m) => m.id === item.raw_material_id);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/60"
                          >
                            <span className="text-[11px] font-mono font-bold text-muted-foreground w-5 shrink-0">
                              #{index + 1}
                            </span>

                            {/* SELECT DE MATÉRIA-PRIMA */}
                            <div className="flex-1">
                              <Select
                                value={item.raw_material_id}
                                onValueChange={(val) =>
                                  handleUpdateRecipeItem(item.id, { raw_material_id: val })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs rounded-lg bg-background/50 border-border/60">
                                  <SelectValue placeholder="Selecione o insumo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rawMaterials.map((mat) => {
                                    const wh = warehouseStock.find((w) => w.product_id === mat.product_id);
                                    const disp = wh ? Number(wh.quantity || 0) : Number(mat.stock_quantity || 0);
                                    return (
                                      <SelectItem key={mat.id} value={mat.id}>
                                        {mat.name} ({mat.unit}) — Armazém: {disp.toLocaleString("pt-BR")}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* QUANTIDADE NECESSÁRIA */}
                            <div className="w-28 shrink-0 flex items-center gap-1.5">
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity_required}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateRecipeItem(item.id, {
                                    quantity_required: val ? String(Math.max(1, parseInt(val, 10) || 1)) : "",
                                  });
                                }}
                                placeholder="Qtd"
                                className="h-8 text-xs font-mono font-bold rounded-lg text-right"
                              />
                              <span className="text-[11px] font-mono text-muted-foreground shrink-0 w-8">
                                {selectedMat?.unit || "un"}
                              </span>
                            </div>

                            {/* BOTÃO REMOVER */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRecipeItem(item.id)}
                              className="h-8 w-8 p-0 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
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
              {saveProductSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações & Receita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================== */}
      {/* MODAL: GERENCIADOR DE SALDOS & TRANSFERÊNCIAS */}
      {/* ==================================================== */}
      <Dialog
        open={Boolean(managingStockProduct)}
        onOpenChange={(open) => !open && setManagingStockProduct(null)}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-amber-400" />
              <span>Gestão de Saldos & Transferências</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mova, retorne, remova ou ajuste o estoque de{" "}
              <strong className="text-foreground">{managingStockProduct?.nome}</strong> em qualquer localização.
            </DialogDescription>
          </DialogHeader>

          {/* BANNER COM OS SALDOS ATUAIS DO PRODUTO */}
          {managingStockProduct && (
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <ProductThumbnail
                  src={managingStockProduct.imagem_url}
                  alt={managingStockProduct.nome}
                  className="h-12 w-12 rounded-xl shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground text-sm truncate">{managingStockProduct.nome}</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Unidade de controle: <strong className="text-foreground">{managingStockProduct.unidade}</strong>
                  </p>
                </div>
              </div>

              {/* SALDOS POR LOCAL */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40">
                <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                  <span className="text-[10px] text-sky-300 font-bold uppercase block">Armazém</span>
                  <span className="text-sm font-mono font-black text-sky-400">
                    {managingWhStock} {managingStockProduct.unidade}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase block">Venda</span>
                  <span className="text-sm font-mono font-black text-emerald-400">
                    {managingSaleStock} {managingStockProduct.unidade}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-[10px] text-amber-300 font-bold uppercase block">Em Baús</span>
                  <span className="text-sm font-mono font-black text-amber-400">
                    {Number(managingStockProduct.estoque_atual || 0)} {managingStockProduct.unidade}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* OPERAÇÃO SELECIONADA */}
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Operação</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: "TRANSFER", label: "Mover / Transferir", icon: ArrowRightLeft },
                  { id: "RETURN_WAREHOUSE", label: "Retornar ao Armazém", icon: Undo2 },
                  { id: "REMOVE", label: "Remover / Baixa", icon: Trash2 },
                  { id: "ADJUST", label: "Ajustar Saldo", icon: Sliders },
                ].map((act) => {
                  const Icon = act.icon;
                  const isSelected = stockAction === act.id;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        setStockAction(act.id as any);
                        if (act.id === "RETURN_WAREHOUSE") {
                          setStockOrigin(managingSaleStock > 0 ? "SALE" : "BAU");
                          setStockDestination("WAREHOUSE");
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-2.5 rounded-xl border text-[11px] font-bold gap-1 transition-all cursor-pointer",
                        isSelected
                          ? "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs"
                          : "bg-secondary/20 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary/40"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELEÇÃO DE ORIGEM & DESTINO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-secondary/20 border border-border/50">
              {/* ORIGEM */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>{stockAction === "ADJUST" ? "Local do Ajuste *" : "Origem (De onde sai) *"}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Disp: <strong className="text-foreground">{currentOriginStock}</strong>
                  </span>
                </Label>
                <Select
                  value={stockOrigin}
                  onValueChange={(val: StockLocation) => {
                    setStockOrigin(val);
                    if (val === stockDestination && stockAction === "TRANSFER" && val !== "BAU") {
                      setStockDestination(val === "WAREHOUSE" ? "BAU" : "WAREHOUSE");
                    }
                  }}
                >
                  <SelectTrigger className="text-xs rounded-xl bg-background/50 border-border/60 font-semibold">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockAction !== "RETURN_WAREHOUSE" && (
                      <SelectItem value="WAREHOUSE">
                        🏭 Armazém da Fábrica ({managingWhStock} un)
                      </SelectItem>
                    )}
                    <SelectItem value="SALE">
                      🛒 Disponível para Venda ({managingSaleStock} un)
                    </SelectItem>
                    <SelectItem value="BAU">
                      📦 Baú de Estoque ({Number(managingStockProduct?.estoque_atual || 0)} un)
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* SE FOR BAÚ DE ORIGEM, SELECIONA O BAÚ */}
                {stockOrigin === "BAU" && (
                  <div className="pt-1.5 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold">Selecione o Baú de Origem:</span>
                    <Select value={stockOriginBauId} onValueChange={setStockOriginBauId}>
                      <SelectTrigger className="text-xs rounded-xl bg-background/50 border-border/60">
                        <SelectValue placeholder="Selecione o baú" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeBaus.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nome} (Saldo: {getBauProductStock(b.id)} un)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* DESTINO (APENAS PARA TRANSFERÊNCIA OU RETORNO) */}
              {(stockAction === "TRANSFER" || stockAction === "RETURN_WAREHOUSE") && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center justify-between">
                    <span>Destino (Para onde vai) *</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Atual: <strong className="text-foreground">{currentDestStock}</strong>
                    </span>
                  </Label>
                  <Select
                    value={stockAction === "RETURN_WAREHOUSE" ? "WAREHOUSE" : stockDestination}
                    onValueChange={(val: StockLocation) => setStockDestination(val)}
                    disabled={stockAction === "RETURN_WAREHOUSE"}
                  >
                    <SelectTrigger className="text-xs rounded-xl bg-background/50 border-border/60 font-semibold">
                      <SelectValue placeholder="Selecione o destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAREHOUSE">
                        🏭 Armazém da Fábrica ({managingWhStock} un)
                      </SelectItem>
                      {managingStockProduct?.can_be_sold && (
                        <SelectItem value="SALE">
                          🛒 Disponível para Venda ({managingSaleStock} un)
                        </SelectItem>
                      )}
                      <SelectItem value="BAU">
                        📦 Baú de Estoque
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* SE FOR BAÚ DE DESTINO, SELECIONA O BAÚ */}
                  {stockAction === "TRANSFER" && stockDestination === "BAU" && (
                    <div className="pt-1.5 space-y-1">
                      <span className="text-[10px] text-muted-foreground font-semibold">Selecione o Baú de Destino:</span>
                      <Select value={stockDestinationBauId} onValueChange={setStockDestinationBauId}>
                        <SelectTrigger className="text-xs rounded-xl bg-background/50 border-border/60">
                          <SelectValue placeholder="Selecione o baú" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeBaus
                            .filter((b) => stockOrigin !== "BAU" || b.id !== stockOriginBauId)
                            .map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.nome} (Atual: {getBauProductStock(b.id)} un)
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
                  {stockAction === "ADJUST" ? "Novo Saldo Definido *" : "Quantidade a Movimentar / Baixar *"}
                </Label>
                {stockAction !== "ADJUST" && currentOriginStock > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStockQuantity(String(currentOriginStock))}
                    className="h-5 px-2 text-[10px] text-amber-300 hover:text-amber-200 font-mono rounded"
                  >
                    Usar Máximo ({currentOriginStock})
                  </Button>
                )}
              </div>
              <Input
                type="number"
                min={stockAction === "ADJUST" ? "0" : "1"}
                step="1"
                value={stockQuantity}
                onChange={(e) => {
                  const val = e.target.value;
                  setStockQuantity(val ? String(Math.max(stockAction === "ADJUST" ? 0 : 1, parseInt(val, 10) || 0)) : "");
                }}
                placeholder="Ex: 10"
                className="text-base font-mono font-bold text-amber-300 rounded-xl"
              />
              {stockAction !== "ADJUST" && (
                <div className="flex items-center gap-1.5 pt-1">
                  {[1, 5, 10, 25, 50, 100].map((d) => (
                    <Button
                      key={d}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStockQuantity(String(d))}
                      className="h-6 text-[10px] px-2 font-mono rounded-lg"
                    >
                      +{d}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* MOTIVO / OBSERVAÇÃO */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo / Justificativa (Opcional)</Label>
              <Input
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                placeholder="Ex: Transferência de lote, descarte de avaria, retorno de vendas..."
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setManagingStockProduct(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => manageStockMutation.mutate()}
              disabled={
                manageStockMutation.isPending ||
                isNaN(parseFloat(stockQuantity)) ||
                (stockAction !== "ADJUST" && parseFloat(stockQuantity) <= 0) ||
                (stockAction === "ADJUST" && parseFloat(stockQuantity) < 0) ||
                (stockAction !== "ADJUST" && parseFloat(stockQuantity) > currentOriginStock)
              }
              className={cn(
                "text-xs font-bold rounded-xl",
                stockAction === "REMOVE"
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
              )}
            >
              {manageStockMutation.isPending
                ? "Processando..."
                : stockAction === "REMOVE"
                ? "Confirmar Remoção"
                : stockAction === "ADJUST"
                ? "Confirmar Ajuste"
                : stockAction === "RETURN_WAREHOUSE"
                ? "Confirmar Retorno"
                : "Confirmar Transferência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
