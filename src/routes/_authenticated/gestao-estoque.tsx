import { useState, useMemo, useRef, useEffect } from "react";
import { createFileRoute, Outlet, useChildMatches, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PackageCheck,
  Boxes,
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  Sparkles,
  Bot,
  Hash,
  Radio,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Check,
  X,
  ShieldAlert,
  Info,
  Equal,
  Upload,
  Filter,
  Wrench,
  Zap,
  Tag,
  DollarSign,
  HelpCircle,
  ShoppingCart,
  Factory,
} from "lucide-react";
import { ProductThumbnail } from "@/components/ui/product-thumbnail";
import { BauIcon } from "@/components/ui/bau-icon";
import { useAuth } from "@/hooks/useAuth";
import {
  useProducts,
  useCategories,
  useBaus,
  useProductBaus,
  useDiscordStockConfig,
} from "@/hooks/useData";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  createBau,
  updateBau,
  deleteBau,
  adjustStockDev,
  updateDiscordStockConfig,
  uploadBauImage,
  uploadProductImage,
} from "@/lib/app-api";
import type { Product, Category, Bau } from "@/lib/app-types";
import { currency, formatCurrencyInput, parseCurrencyInput, num, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useUrlTab } from "@/hooks/useUrlTab";
import {
  parseCdaAliases,
  formatCdaAliases,
  searchProductsWithFuzzy,
  FuzzyProductMatch,
} from "@/lib/fuzzySearch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/gestao-estoque")({
  component: GestaoEstoqueWrapper,
});

function GestaoEstoqueWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <GestaoEstoquePage />;
}

export type GestaoEstoqueTab = "produtos" | "categorias" | "baus" | "saldos";
export const VALID_GESTAO_ESTOQUE_TABS = ["produtos", "categorias", "baus", "saldos"] as const;

export function GestaoEstoquePage({ initialTab }: { initialTab?: GestaoEstoqueTab } = {}) {
  const { hasPermission, isDevMode, isDevUser: isDevFromAuth } = useAuth();
  const isDevUser = isDevMode || isDevFromAuth;

  const { data: products = [], refetch: refetchProducts, isRefetching: isRefetchingProducts } = useProducts();
  const { data: categories = [], refetch: refetchCategories } = useCategories();
  const { data: baus = [], refetch: refetchBaus } = useBaus();
  const { refetch: refetchProductBaus } = useProductBaus();

  // Permissões granulares e isoladas da Gestão de Estoque (com bypass de visualização para Tag Dev)
  const canManageProdutos = hasPermission("manage_stock_products") || isDevUser;
  const canViewProdutos = canManageProdutos;

  const canManageCategorias = hasPermission("manage_stock_categories") || isDevUser;
  const canViewCategorias = canManageCategorias;

  const canManageBaus = hasPermission("manage_stock_baus") || isDevUser;
  const canViewBaus = canManageBaus;

  const canManageStockBalance = hasPermission("manage_stock_balance") || isDevUser;
  const canAdjustSaldos = canManageStockBalance || hasPermission("adjust_stock_balance") || isDevUser;
  const canViewSaldos = canAdjustSaldos;

  const hasBaseManagement =
    hasPermission("view_stock_management") ||
    canViewProdutos ||
    canViewCategorias ||
    canViewBaus ||
    canViewSaldos ||
    isDevUser;

  // Lista dinâmica de abas estritamente permitidas (as não permitidas ficam 100% ocultas)
  const visibleTabs = useMemo<{ id: GestaoEstoqueTab; label: string; icon: any; count?: number }[]>(() => {
    const tabs: { id: GestaoEstoqueTab; label: string; icon: any; count?: number }[] = [];
    if (canViewProdutos) {
      tabs.push({ id: "produtos", label: "Produtos", icon: Boxes, count: products.length });
    }
    if (canViewCategorias) {
      tabs.push({ id: "categorias", label: "Categorias", icon: FolderTree, count: categories.length });
    }
    if (canViewBaus) {
      tabs.push({ id: "baus", label: "Baús do Grupo", icon: Layers, count: baus.length });
    }
    if (canViewSaldos) {
      const lowCount = products.filter((p) => p.ativo && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0)).length;
      tabs.push({ id: "saldos", label: "Ajuste & Saldo", icon: Sliders, count: lowCount > 0 ? lowCount : undefined });
    }
    return tabs;
  }, [canViewProdutos, canViewCategorias, canViewBaus, canViewSaldos, products, categories.length, baus.length]);

  const allowedTabsList = useMemo(() => visibleTabs.map((t) => t.id), [visibleTabs]);
  const defaultTab = useMemo(() => {
    if (initialTab && (allowedTabsList as string[]).includes(initialTab)) {
      return initialTab;
    }
    return allowedTabsList[0] || "produtos";
  }, [initialTab, allowedTabsList]);

  const [activeTab, setActiveTab] = useUrlTab<GestaoEstoqueTab>(defaultTab, {
    paramName: "aba",
    allowedTabs: allowedTabsList.length > 0 ? allowedTabsList : VALID_GESTAO_ESTOQUE_TABS,
  });

  // Proteção: caso a URL aponte para uma aba não permitida, força a primeira permitida
  useEffect(() => {
    if (allowedTabsList.length > 0 && !allowedTabsList.includes(activeTab)) {
      setActiveTab(allowedTabsList[0]);
    }
  }, [allowedTabsList, activeTab, setActiveTab]);

  // Sincronização reativa caso a aba inicial da rota mude
  useEffect(() => {
    if (initialTab && (allowedTabsList as string[]).includes(initialTab) && activeTab !== initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, allowedTabsList, activeTab, setActiveTab]);

  const canAccess = hasBaseManagement && allowedTabsList.length > 0;

  const handleRefreshAll = async () => {
    const p = toast.loading("Atualizando dados de estoque...");
    try {
      await Promise.all([
        refetchProducts(),
        refetchCategories(),
        refetchBaus(),
        refetchProductBaus(),
      ]);
      toast.success("Dados de estoque atualizados!", { id: p });
    } catch {
      toast.error("Falha ao atualizar dados.", { id: p });
    }
  };

  if (!canAccess || allowedTabsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 sm:p-6 space-y-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-sm">
          <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="space-y-2 max-w-md px-2">
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">Acesso Restrito à Gestão de Estoque</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {hasBaseManagement
              ? "Você possui autorização básica no módulo, porém nenhuma aba (Produtos, Categorias, Baús ou Ajustes de Saldo) foi liberada para o seu cargo ou usuário. Solicite a um oficial ou administrador para habilitar as abas desejadas."
              : "Você não possui permissões ativas para visualizar ou gerenciar as seções administrativas de Gestão de Estoque deste grupo. Solicite acesso a um oficial ou administrador."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* CABEÇALHO DA PÁGINA COM AÇÕES GERAIS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-4 sm:pb-5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary shadow-xs shrink-0 mt-0.5 sm:mt-0">
            <PackageCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Gestão de Estoque
              </h1>
              <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[9px] sm:text-[10px] font-bold py-0.5">
                Operações & Catálogo
              </Badge>
              {isDevUser && (
                <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 text-[9px] sm:text-[10px] font-bold">
                  Visão Dev
                </Badge>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none mt-0.5">
              Cadastros, categorias, parametrização de baús do grupo e ajustes auditados de inventário.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          {isDevUser && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial h-8 sm:h-9 text-xs font-semibold gap-1.5 rounded-xl border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 shadow-xs"
            >
              <Link to="/dev/estoque">
                <Wrench className="w-3.5 h-3.5" />
                <span className="inline">Ajustes Dev & Bot</span>
              </Link>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefetchingProducts}
            className="flex-1 sm:flex-initial h-8 sm:h-9 text-xs font-semibold gap-1.5 rounded-xl border-border/70 hover:bg-secondary/60 cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-primary", isRefetchingProducts && "animate-spin")} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* ABAS PRINCIPAIS COM SCROLL RESPONSIVO */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as GestaoEstoqueTab)} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
          <TabsList className="bg-secondary/40 border border-border/50 p-1 rounded-xl flex items-center gap-1 w-max sm:w-auto h-auto">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2 px-3 sm:px-3.5 gap-1.5 sm:gap-2 rounded-lg transition-all cursor-pointer shrink-0"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full",
                        activeTab === tab.id
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* CONTEÚDO DAS ABAS (CARREGADO SOMENTE SE PERMITIDO) */}
        {canViewProdutos && (
          <TabsContent value="produtos" className="space-y-4 sm:space-y-6 m-0">
            <ProdutosTabContent
              canManage={canManageProdutos}
              canAdjustSaldos={canAdjustSaldos}
              onNavigateToAdjust={(prodId, bauId) => {
                if (canViewSaldos) {
                  setActiveTab("saldos");
                }
              }}
            />
          </TabsContent>
        )}

        {canViewCategorias && (
          <TabsContent value="categorias" className="space-y-4 sm:space-y-6 m-0">
            <CategoriasTabContent canManage={canManageCategorias} />
          </TabsContent>
        )}

        {canViewBaus && (
          <TabsContent value="baus" className="space-y-4 sm:space-y-6 m-0">
            <BausTabContent canManage={canManageBaus} />
          </TabsContent>
        )}

        {canViewSaldos && (
          <TabsContent value="saldos" className="space-y-4 sm:space-y-6 m-0">
            <SaldosTabContent
              canAdjust={canAdjustSaldos}
              canManageBalance={canManageStockBalance}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ============================================================================
// ABA 1: PRODUTOS (MÚLTIPLOS ALIASES DE LOG DISCORD, FUZZY SEARCH E CARDS MOBILE)
// ============================================================================
interface ProdutosTabContentProps {
  canManage: boolean;
  canAdjustSaldos: boolean;
  onNavigateToAdjust?: (productId?: string, bauId?: string) => void;
}

function ProdutosTabContent({ canManage, canAdjustSaldos, onNavigateToAdjust }: ProdutosTabContentProps) {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: baus = [] } = useBaus();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [criticalOnlyFilter, setCriticalOnlyFilter] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [nome, setNome] = useState("");
  const [cdaAliases, setCdaAliases] = useState<string[]>([]);
  const [cdaInputText, setCdaInputText] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [bauId, setBauId] = useState("");
  const [unidade, setUnidade] = useState("un");
  const [precoInput, setPrecoInput] = useState("");
  const [estoqueMin, setEstoqueMin] = useState(0);
  const [imagemUrl, setImagemUrl] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [canBeSold, setCanBeSold] = useState(false);
  const [canBeProduced, setCanBeProduced] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const openCreateModal = () => {
    if (!canManage) return;
    setEditingProduct(null);
    setNome("");
    setCdaAliases([]);
    setCdaInputText("");
    setDescricao("");
    setCategoriaId(categories[0]?.id || "");
    setBauId(baus[0]?.id || "");
    setUnidade("un");
    setPrecoInput("");
    setEstoqueMin(0);
    setImagemUrl("");
    setAtivo(true);
    setCanBeSold(false);
    setCanBeProduced(true);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    if (!canManage) return;
    setEditingProduct(prod);
    setNome(prod.nome);
    setCdaAliases(parseCdaAliases(prod.cda_name));
    setCdaInputText("");
    setDescricao(prod.descricao || "");
    setCategoriaId(prod.categoria_id || "");
    setBauId(prod.bau_id || "");
    setUnidade(prod.unidade || "un");
    setPrecoInput(prod.preco_sugerido ? formatCurrencyInput(prod.preco_sugerido) : "");
    setEstoqueMin(prod.estoque_minimo || 0);
    setImagemUrl(prod.imagem_url || "");
    setAtivo(prod.ativo);
    setCanBeSold(prod.can_be_sold === true);
    setCanBeProduced(prod.can_be_produced !== false);
    setIsModalOpen(true);
  };

  const handleAddCdaAlias = async (textToAdd?: string) => {
    const raw = textToAdd !== undefined ? textToAdd : cdaInputText;
    if (!raw.trim()) return;
    const parsed = parseCdaAliases(raw);
    if (parsed.length === 0) return;

    const nextAliases = parseCdaAliases([...cdaAliases, ...parsed].join(", "));
    setCdaAliases(nextAliases);
    setCdaInputText("");

    if (editingProduct?.id) {
      const formattedCda = formatCdaAliases(nextAliases);
      const toastId = toast.loading("Salvando tag de log do Discord...");
      try {
        await updateProduct({
          id: editingProduct.id,
          cda_name: formattedCda || null,
        });
        void queryClient.invalidateQueries({ queryKey: ["products"] });
        void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
        toast.success("Nome de log do Discord salvo automaticamente!", { id: toastId });
      } catch (err: any) {
        toast.error(err.message || "Erro ao salvar nome de log no Discord.", { id: toastId });
      }
    }
  };

  const handleRemoveCdaAlias = async (aliasToRemove: string) => {
    const nextAliases = cdaAliases.filter((a) => a.toLowerCase() !== aliasToRemove.toLowerCase());
    setCdaAliases(nextAliases);

    if (editingProduct?.id) {
      const formattedCda = formatCdaAliases(nextAliases);
      const toastId = toast.loading("Removendo tag de log do Discord...");
      try {
        await updateProduct({
          id: editingProduct.id,
          cda_name: formattedCda || null,
        });
        void queryClient.invalidateQueries({ queryKey: ["products"] });
        void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
        toast.success("Nome de log removido e salvo automaticamente!", { id: toastId });
      } catch (err: any) {
        toast.error(err.message || "Erro ao atualizar nomes de log no Discord.", { id: toastId });
      }
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const toastId = toast.loading("Enviando foto do produto...");
    try {
      const url = await uploadProductImage(file);
      setImagemUrl(url);
      if (editingProduct?.id) {
        await updateProduct({
          id: editingProduct.id,
          imagem_url: url,
        });
        void queryClient.invalidateQueries({ queryKey: ["products"] });
      }
      toast.success("Foto do produto enviada e salva com sucesso!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da foto.", { id: toastId });
    } finally {
      setIsUploadingImage(false);
      if (productImageInputRef.current) productImageInputRef.current.value = "";
    }
  };

  const handleRemoveProductImage = async () => {
    setImagemUrl("");
    if (editingProduct?.id) {
      const toastId = toast.loading("Removendo foto do produto...");
      try {
        await updateProduct({
          id: editingProduct.id,
          imagem_url: null,
        });
        void queryClient.invalidateQueries({ queryKey: ["products"] });
        toast.success("Foto do produto removida com sucesso!", { id: toastId });
      } catch (err: any) {
        toast.error(err.message || "Erro ao remover foto do produto.", { id: toastId });
      }
    } else {
      toast.info("Foto removida.");
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe o nome do produto.");
      const precoSugerido = parseCurrencyInput(precoInput);

      // Inclui o que estiver digitado no campo de alias se o usuário esqueceu de clicar em adicionar
      let finalAliases = [...cdaAliases];
      if (cdaInputText.trim()) {
        const pending = parseCdaAliases(cdaInputText);
        finalAliases = parseCdaAliases([...finalAliases, ...pending].join(", "));
      }

      const formattedCda = formatCdaAliases(finalAliases);

      const payload: any = {
        nome: nome.trim(),
        cda_name: formattedCda || undefined,
        descricao: descricao.trim() || undefined,
        categoria_id: categoriaId || undefined,
        bau_id: bauId || undefined,
        unidade: unidade.trim() || "un",
        estoque_minimo: estoqueMin,
        preco_sugerido: precoSugerido,
        imagem_url: imagemUrl.trim() ? imagemUrl.trim() : null,
        can_be_sold: canBeSold,
        can_be_produced: canBeProduced,
      };

      if (editingProduct) {
        await updateProduct({
          id: editingProduct.id,
          ...payload,
          ativo,
        });
      } else {
        await createProduct(payload);
      }
    },
    onSuccess: () => {
      toast.success(editingProduct ? "Produto atualizado com sucesso!" : "Produto cadastrado com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar produto.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteProduct(id);
    },
    onSuccess: () => {
      toast.success("Produto excluído com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      setDeletingProduct(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao excluir produto.");
    },
  });

  // Aplicação de filtros + busca por similaridade fuzzy
  const { exactFilteredProducts, similarFilteredProducts } = useMemo(() => {
    // 1. Filtragem base por status, categoria e estoque crítico
    const baseList = products.filter((p) => {
      if (statusFilter === "active" && !p.ativo) return false;
      if (statusFilter === "inactive" && p.ativo) return false;
      if (categoryFilter !== "all" && p.categoria_id !== categoryFilter) return false;
      if (criticalOnlyFilter) {
        const isLow = p.ativo && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0);
        if (!isLow) return false;
      }
      return true;
    });

    if (!search.trim()) {
      return {
        exactFilteredProducts: baseList,
        similarFilteredProducts: [] as FuzzyProductMatch[],
      };
    }

    const { exactMatches, similarMatches } = searchProductsWithFuzzy(
      baseList,
      search,
      categories,
      baus
    );

    return {
      exactFilteredProducts: exactMatches,
      similarFilteredProducts: similarMatches,
    };
  }, [products, search, categoryFilter, statusFilter, criticalOnlyFilter, categories, baus]);

  // Estatísticas rápidas
  const totalAtivos = products.filter((p) => p.ativo).length;
  const totalBaixoEstoque = products.filter((p) => p.ativo && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0)).length;
  const valorTotalEstoque = products.reduce((acc, p) => acc + Number(p.estoque_atual || 0) * Number(p.preco_sugerido || 0), 0);

  const hasAnyRowAction = canManage || canAdjustSaldos;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* STATS RÁPIDOS RESPONSIVOS */}
      <div className="grid gap-2.5 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="surface-card border-border/70 p-3 sm:p-4 space-y-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">Total de Produtos</span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-foreground">{products.length}</span>
            <Boxes className="w-4 h-4 sm:w-5 sm:h-5 text-primary opacity-60 shrink-0" />
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground block truncate">{totalAtivos} ativos no catálogo</span>
        </Card>

        <Card className="surface-card border-border/70 p-3 sm:p-4 space-y-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">Categorias</span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-cyan-400">{categories.length}</span>
            <FolderTree className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 opacity-60 shrink-0" />
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground block truncate">Departamentos ativos</span>
        </Card>

        <Card
          onClick={() => setCriticalOnlyFilter((prev) => !prev)}
          className={cn(
            "surface-card border p-3 sm:p-4 space-y-1 transition-all cursor-pointer",
            criticalOnlyFilter
              ? "border-amber-500/80 bg-amber-500/10 shadow-sm"
              : "border-border/70 hover:border-amber-500/40"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">Estoque Crítico</span>
            <Badge variant="outline" className="text-[8px] sm:text-[9px] font-mono border-amber-500/40 text-amber-400 px-1 py-0">
              {criticalOnlyFilter ? "Ativo" : "Filtrar"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-xl sm:text-2xl font-black", totalBaixoEstoque > 0 ? "text-amber-400" : "text-emerald-400")}>
              {totalBaixoEstoque}
            </span>
            <AlertTriangle className={cn("w-4 h-4 sm:w-5 sm:h-5 shrink-0", totalBaixoEstoque > 0 ? "text-amber-400" : "text-emerald-400")} />
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground block truncate">Abaixo do mínimo</span>
        </Card>

        <Card className="surface-card border-border/70 p-3 sm:p-4 space-y-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block truncate">Patrimônio em Itens</span>
          <div className="flex items-center justify-between">
            <span className="text-base sm:text-lg font-black text-emerald-400 tracking-tight truncate">{currency(valorTotalEstoque)}</span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 opacity-60 shrink-0" />
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground block truncate">Valor em depósito</span>
        </Card>
      </div>

      {/* BARRA DE FERRAMENTAS E FILTROS RESPONSIVOS */}
      <Card className="surface-card border-border/80">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2">
              {/* CAMPO DE PESQUISA */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, descrição ou logs do Discord..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 text-xs h-9 bg-background/60"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* DROPDOWNS EM LINHA DUPLA NO MOBILE */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="text-xs h-9 w-full sm:w-40 bg-background/60">
                    <SelectValue placeholder="Categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                  <SelectTrigger className="text-xs h-9 w-full sm:w-36 bg-background/60">
                    <SelectValue placeholder="Status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    <SelectItem value="active">Apenas Ativos</SelectItem>
                    <SelectItem value="inactive">Apenas Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {criticalOnlyFilter && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCriticalOnlyFilter(false)}
                  className="h-9 text-xs font-bold gap-1 text-amber-400 bg-amber-500/15 border border-amber-500/30 shrink-0 w-full sm:w-auto"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Estoque Crítico</span>
                  <X className="w-3 h-3 ml-0.5" />
                </Button>
              )}
            </div>

            {/* BOTÃO NOVO PRODUTO */}
            {canManage && (
              <Button
                size="sm"
                onClick={openCreateModal}
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 w-full sm:w-auto shrink-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Produto</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AVISO DE NOMES SIMILARES ENCONTRADOS (FUZZY SEARCH / SUGESTÕES) */}
      {search.trim() && exactFilteredProducts.length === 0 && similarFilteredProducts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Nenhum produto com o termo exato "{search}", mas encontramos {similarFilteredProducts.length} possíveis itens parecidos:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {similarFilteredProducts.map(({ product, reason, score }) => (
              <Badge
                key={product.id}
                variant="outline"
                className="border-amber-500/40 bg-amber-500/15 text-amber-200 text-[11px] py-1 px-2 gap-1.5"
              >
                <strong className="font-bold">{product.nome}</strong>
                <span className="opacity-75 font-mono text-[10px]">({reason})</span>
                <span className="text-[9px] bg-amber-500/30 px-1 rounded font-mono font-bold">
                  {Math.round(score * 100)}%
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* LISTA DE PRODUTOS: CARDS PARA MOBILE (md:hidden) E TABELA PARA DESKTOP (hidden md:block) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
            Carregando catálogo de produtos...
          </Card>
        ) : exactFilteredProducts.length === 0 && similarFilteredProducts.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-xs">
            Nenhum produto localizado com os filtros selecionados.
          </Card>
        ) : (
          (exactFilteredProducts.length > 0 ? exactFilteredProducts : similarFilteredProducts.map((s) => s.product)).map((p) => {
            const cat = categories.find((c) => c.id === p.categoria_id);
            const b = baus.find((item) => item.id === p.bau_id);
            const isLow = p.ativo && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0);
            const aliases = parseCdaAliases(p.cda_name);

            return (
              <Card
                key={p.id}
                className={cn(
                  "surface-card border transition-all p-3.5 space-y-3 shadow-xs",
                  isLow ? "border-rose-500/30 bg-rose-500/[0.02]" : "border-border/70"
                )}
              >
                {/* TOPO: FOTO + NOME + BADGES DE STATUS E SALDO */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <ProductThumbnail src={p.imagem_url} name={p.nome} size="md" className="shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <strong className="text-sm text-foreground font-bold leading-tight">{p.nome}</strong>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase font-bold py-0 px-1.5",
                            p.ativo ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-muted text-muted-foreground"
                          )}
                        >
                          {p.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        {p.can_be_sold && (
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-bold py-0 px-1.5 border-emerald-500/40 text-emerald-400 bg-emerald-500/10 flex items-center gap-1"
                          >
                            <ShoppingCart className="w-2.5 h-2.5" />
                            <span>Venda</span>
                          </Badge>
                        )}
                        {p.can_be_produced !== false && (
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-bold py-0 px-1.5 border-amber-500/40 text-amber-400 bg-amber-500/10 flex items-center gap-1"
                          >
                            <Factory className="w-2.5 h-2.5" />
                            <span>Produção</span>
                          </Badge>
                        )}
                      </div>
                      {p.descricao && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{p.descricao}</p>
                      )}
                    </div>
                  </div>

                  {/* SALDO EM DESTAQUE */}
                  <div className="text-right shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-bold font-mono text-xs px-2 py-0.5",
                        isLow
                          ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                          : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      )}
                    >
                      {num(p.estoque_atual || 0)} {p.unidade || "un"}
                    </Badge>
                    <span className="block text-[9px] text-muted-foreground font-mono mt-0.5">
                      Mín: {p.estoque_minimo || 0}
                    </span>
                  </div>
                </div>

                {/* ALIASES DO DISCORD (CDA) */}
                {aliases.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mr-0.5">
                      <Bot className="w-3 h-3 text-cyan-400" />
                      Logs Discord:
                    </span>
                    {aliases.map((alias, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-[10px] font-mono py-0 px-1.5 border-primary/30 text-primary bg-primary/5"
                      >
                        {alias}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* METADADOS (CATEGORIA, BAÚ PREFERENCIAL, PREÇO) */}
                <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-secondary/30 border border-border/40 text-xs">
                  <div>
                    <span className="text-[9px] text-muted-foreground block uppercase font-medium">Categoria</span>
                    <span className="text-[11px] font-semibold text-foreground truncate block">
                      {cat?.nome || "Geral"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-muted-foreground block uppercase font-medium">Baú Padrão</span>
                    <span className="text-[11px] text-foreground truncate flex items-center gap-1 font-medium">
                      {b ? (
                        <>
                          <BauIcon foto_url={b.foto_url || b.imagem_url} icone={b.icone} nome={b.nome} className="w-3 h-3 object-cover rounded shrink-0" />
                          <span className="truncate">{b.nome}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-muted-foreground block uppercase font-medium">Preço Sugerido</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-400 truncate block">
                      {p.preco_sugerido ? currency(p.preco_sugerido) : "—"}
                    </span>
                  </div>
                </div>

                {/* AÇÕES NO CARD MOBILE */}
                {hasAnyRowAction && (
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-border/40">
                    {canAdjustSaldos && onNavigateToAdjust && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 flex-1 text-xs text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 gap-1.5 rounded-lg font-bold"
                        onClick={() => onNavigateToAdjust(p.id, p.bau_id || undefined)}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Ajustar Saldo</span>
                      </Button>
                    )}

                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground border-border/70 rounded-lg"
                          onClick={() => openEditModal(p)}
                          title="Editar Produto"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          <span>Editar</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border-border/70 rounded-lg"
                          onClick={() => setDeletingProduct(p)}
                          title="Excluir Produto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* TABELA DE PRODUTOS PARA DESKTOP (hidden md:block) */}
      <Card className="surface-card border-border/80 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-xs">Produto</TableHead>
                <TableHead className="text-xs">Logs Discord (CDA)</TableHead>
                <TableHead className="text-xs">Categoria</TableHead>
                <TableHead className="text-xs">Baú Preferencial</TableHead>
                <TableHead className="text-xs text-right">Preço Sugerido</TableHead>
                <TableHead className="text-xs text-center">Estoque Mín.</TableHead>
                <TableHead className="text-xs text-center">Saldo Atual</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
                {hasAnyRowAction && <TableHead className="text-xs text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={hasAnyRowAction ? 9 : 8} className="text-center py-12 text-muted-foreground text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Carregando catálogo de produtos...
                  </TableCell>
                </TableRow>
              ) : exactFilteredProducts.length === 0 && similarFilteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasAnyRowAction ? 9 : 8} className="text-center py-12 text-muted-foreground text-xs">
                    Nenhum produto localizado com os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                (exactFilteredProducts.length > 0 ? exactFilteredProducts : similarFilteredProducts.map((s) => s.product)).map((p) => {
                  const cat = categories.find((c) => c.id === p.categoria_id);
                  const b = baus.find((item) => item.id === p.bau_id);
                  const isLow = p.ativo && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0);
                  const aliases = parseCdaAliases(p.cda_name);

                  return (
                    <TableRow key={p.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <ProductThumbnail src={p.imagem_url} name={p.nome} size="sm" />
                          <div className="min-w-0">
                            <strong className="text-xs text-foreground font-bold truncate block">{p.nome}</strong>
                            {p.descricao && <span className="text-[10px] text-muted-foreground block truncate max-w-xs">{p.descricao}</span>}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs py-2.5">
                        {aliases.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {aliases.map((a, i) => (
                              <Badge key={i} variant="outline" className="text-[9px] font-mono py-0 px-1 border-primary/30 text-primary bg-primary/5 truncate">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[10px] italic">Mesmo do produto</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs py-2.5">
                        <Badge variant="outline" className="text-[10px] border-border/60">
                          {cat?.nome || "Geral"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs py-2.5 text-muted-foreground">
                        {b ? (
                          <span className="flex items-center gap-1.5">
                            <BauIcon foto_url={b.foto_url || b.imagem_url} icone={b.icone} nome={b.nome} className="w-3.5 h-3.5 object-cover rounded" />
                            <span className="truncate">{b.nome}</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell className="text-xs py-2.5 text-right font-mono font-medium text-foreground">
                        {p.preco_sugerido ? currency(p.preco_sugerido) : "—"}
                      </TableCell>

                      <TableCell className="text-xs py-2.5 text-center font-mono text-muted-foreground">
                        {p.estoque_minimo || 0} {p.unidade || "un"}
                      </TableCell>

                      <TableCell className="text-xs py-2.5 text-center font-mono">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-bold text-[11px]",
                            isLow
                              ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                              : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                          )}
                        >
                          {num(p.estoque_atual || 0)} {p.unidade || "un"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs py-2.5 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-bold",
                            p.ativo ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-muted text-muted-foreground"
                          )}
                        >
                          {p.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>

                      {/* AÇÕES DE LINHA */}
                      {hasAnyRowAction && (
                        <TableCell className="text-xs py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canAdjustSaldos && onNavigateToAdjust && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/10 gap-1 rounded-lg cursor-pointer"
                                onClick={() => onNavigateToAdjust(p.id, p.bau_id || undefined)}
                                title="Lançar ajuste de saldo deste item"
                              >
                                <Sliders className="w-3 h-3" />
                                <span className="inline">Ajustar</span>
                              </Button>
                            )}

                            {canManage && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                                  onClick={() => openEditModal(p)}
                                  title="Editar Produto"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                                  onClick={() => setDeletingProduct(p)}
                                  title="Excluir Produto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* MODAL CRIAR / EDITAR PRODUTO COM SUPORTE A MÚLTIPLOS ALIASES DE DISCORD */}
      {canManage && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg bg-card border-border/80 max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Boxes className="w-4 h-4 text-primary shrink-0" />
                <span>{editingProduct ? `Editar Produto: ${editingProduct.nome}` : "Cadastrar Novo Produto"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Preencha os dados do item, múltiplos nomes de log do Discord (CDA) e baú preferencial.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Nome do Produto <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Ex: MP5, Micro Uzi, Paracetamol, LockPick..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              {/* SEÇÃO DE MÚLTIPLOS NOMES DE LOG DISCORD (CDA) */}
              <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Nomes no Log Discord (CDA)</span>
                  </Label>
                  <span className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>Salva automaticamente</span>
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Adicione todos os nomes ou variações que o Discord/FiveM usa para registrar este item nos baús. Ao adicionar ou remover, as alterações são salvas automaticamente.
                </p>

                {/* CHIPS DE ALIASES ADICIONADOS */}
                <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] p-2 rounded-lg bg-background/80 border border-border/60">
                  {cdaAliases.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic">
                      Nenhum alias adicional cadastrado (usa o próprio nome do produto)
                    </span>
                  ) : (
                    cdaAliases.map((alias) => (
                      <Badge
                        key={alias}
                        variant="secondary"
                        className="text-xs font-mono py-0.5 pl-2 pr-1 gap-1 border border-primary/30 text-primary bg-primary/10 flex items-center"
                      >
                        <span>{alias}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCdaAlias(alias)}
                          className="hover:bg-primary/20 rounded-full p-0.5 text-primary/80 hover:text-primary cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>

                {/* INPUT PARA ADICIONAR NOVO ALIAS */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Digite um nome (ex: lockpick, micro uzi) e pressione Enter..."
                    value={cdaInputText}
                    onChange={(e) => setCdaInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddCdaAlias();
                      }
                    }}
                    className="text-xs h-8 font-mono flex-1 bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCdaAlias()}
                    className="h-8 text-xs font-bold gap-1 px-3 border-border/80 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    <span>Adicionar</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descrição / Observação</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex: Armamento leve de resposta rápida..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Selecione a categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Baú Preferencial</Label>
                  <Select value={bauId} onValueChange={setBauId}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Selecione o baú..." />
                    </SelectTrigger>
                    <SelectContent>
                      {baus.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          <span className="flex items-center gap-1.5">
                            <BauIcon foto_url={b.foto_url || b.imagem_url} icone={b.icone} nome={b.nome} className="w-3.5 h-3.5 object-cover rounded" />
                            <span>{b.nome}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Unidade</Label>
                  <Input
                    placeholder="Ex: un, pacote..."
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="text-xs font-mono h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Preço Sugerido</Label>
                  <Input
                    placeholder="R$ 0,00"
                    value={precoInput}
                    onChange={(e) => setPrecoInput(formatCurrencyInput(e.target.value))}
                    className="text-xs font-mono h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Estoque Mínimo</Label>
                  <Input
                    type="number"
                    min={0}
                    value={estoqueMin}
                    onChange={(e) => setEstoqueMin(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="text-xs font-mono h-9"
                  />
                </div>
              </div>

              {/* FOTO DO PRODUTO COM UPLOAD DIRETO OU LINK */}
              <div className="space-y-2.5 p-3.5 rounded-xl border border-border/70 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Foto do Produto (Opcional)</Label>
                  {imagemUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveProductImage}
                      className="h-6 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 font-bold gap-1 cursor-pointer rounded-lg"
                    >
                      <Trash2 className="w-3 h-3" /> Remover Foto
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl border border-border/80 flex items-center justify-center overflow-hidden bg-background shrink-0 shadow-inner p-1">
                    {imagemUrl ? (
                      <ProductThumbnail src={imagemUrl} name={nome || "Preview"} size="lg" className="h-full w-full rounded-xl border-0" />
                    ) : (
                      <Boxes className="w-6 h-6 text-muted-foreground opacity-40" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <input
                        ref={productImageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                        className="hidden"
                        onChange={handleProductImageUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingImage}
                        onClick={() => productImageInputRef.current?.click()}
                        className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border/80 cursor-pointer shadow-xs"
                      >
                        {isUploadingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> : <Upload className="w-3.5 h-3.5 text-primary" />}
                        <span>{isUploadingImage ? "Enviando imagem..." : "Upload Foto"}</span>
                      </Button>
                    </div>
                    <Input
                      placeholder="Ou cole o link direto da imagem..."
                      value={imagemUrl}
                      onChange={(e) => setImagemUrl(e.target.value)}
                      className="text-xs h-8 rounded-xl bg-background/80"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold cursor-pointer">Status do Produto</Label>
                  <p className="text-[10px] text-muted-foreground">Produtos ativos aparecem nos menus e movimentações</p>
                </div>
                <Switch checked={ativo} onCheckedChange={setAtivo} />
              </div>

              {/* OPÇÃO DE VENDAS */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-emerald-400 cursor-pointer flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Liberado para Vendas</span>
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Quando ativado, este produto fica habilitado para cadastro de vendas na página de Vendas
                  </p>
                </div>
                <Switch checked={canBeSold} onCheckedChange={setCanBeSold} />
              </div>

              {/* OPÇÃO DE PRODUÇÃO */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-amber-400 cursor-pointer flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5" />
                    <span>Habilitado para Produção</span>
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Permite que membros fabriquem este produto na Estação de Produção
                  </p>
                </div>
                <Switch checked={canBeProduced} onCheckedChange={setCanBeProduced} />
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 cursor-pointer w-full sm:w-auto shadow-sm"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
      {canManage && (
        <Dialog open={Boolean(deletingProduct)} onOpenChange={(open) => !open && setDeletingProduct(null)}>
          <DialogContent className="w-[95vw] sm:max-w-md bg-card border-rose-500/30 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                Excluir Produto
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tem certeza que deseja apagar o produto <strong>{deletingProduct?.nome}</strong>?
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
              O histórico de movimentações anteriores será preservado para auditoria, mas o produto não poderá mais ser movimentado.
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingProduct(null)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 cursor-pointer w-full sm:w-auto shadow-sm"
                disabled={deleteMutation.isPending}
                onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
              >
                {deleteMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirmar Exclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ============================================================================
// ABA 2: CATEGORIAS (CRIAR / EDITAR / APAGAR / RESPONSIVIDADE MOBILE)
// ============================================================================
interface CategoriasTabContentProps {
  canManage: boolean;
}

function CategoriasTabContent({ canManage }: CategoriasTabContentProps) {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useCategories();
  const { data: products = [] } = useProducts();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);

  // Delete State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const openCreateModal = () => {
    if (!canManage) return;
    setEditingCategory(null);
    setNome("");
    setDescricao("");
    setAtivo(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    if (!canManage) return;
    setEditingCategory(cat);
    setNome(cat.nome);
    setDescricao(cat.descricao || "");
    setAtivo(cat.ativo);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe o nome da categoria.");
      const payload: any = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
      };

      if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          ...payload,
          ativo,
        });
      } else {
        await createCategory(payload);
      }
    },
    onSuccess: () => {
      toast.success(editingCategory ? "Categoria atualizada!" : "Categoria cadastrada!");
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar categoria.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteCategory(id);
    },
    onSuccess: () => {
      toast.success("Categoria excluída com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeletingCategory(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao excluir categoria.");
    },
  });

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return c.nome.toLowerCase().includes(q) || c.descricao?.toLowerCase().includes(q);
    });
  }, [categories, search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* BARRA DE FERRAMENTAS */}
      <Card className="surface-card border-border/80">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-background/60"
            />
          </div>

          {canManage && (
            <Button size="sm" onClick={openCreateModal} className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 w-full sm:w-auto shrink-0 cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Nova Categoria</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* GRID DE CATEGORIAS RESPONSIVO */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
            Carregando categorias...
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground text-xs">
            Nenhuma categoria localizada.
          </div>
        ) : (
          filteredCategories.map((c) => {
            const prodCount = products.filter((p) => p.categoria_id === c.id).length;

            return (
              <Card key={c.id} className="surface-card border-border/70 flex flex-col justify-between hover:border-primary/40 transition-all shadow-xs">
                <CardHeader className="p-3.5 sm:p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
                        <FolderTree className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-sm font-bold text-foreground truncate">{c.nome}</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] uppercase font-bold shrink-0",
                        c.ativo ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-muted text-muted-foreground"
                      )}
                    >
                      {c.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  {c.descricao && <CardDescription className="text-xs line-clamp-2 pt-1.5">{c.descricao}</CardDescription>}
                </CardHeader>

                <CardFooter className="p-3.5 sm:p-4 pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {prodCount} {prodCount === 1 ? "produto" : "produtos"}
                  </Badge>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                        onClick={() => openEditModal(c)}
                        title="Editar Categoria"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        onClick={() => setDeletingCategory(c)}
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL CRIAR / EDITAR CATEGORIA */}
      {canManage && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-md bg-card border-border/80 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-cyan-400" />
                <span>{editingCategory ? `Editar Categoria: ${editingCategory.nome}` : "Cadastrar Nova Categoria"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Defina o nome e a descrição para agrupamento dos insumos no catálogo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nome da Categoria *</Label>
                <Input
                  placeholder="Ex: Armamentos, Munições, Farmácia, Peças..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descrição / Finalidade</Label>
                <Textarea
                  rows={3}
                  placeholder="Ex: Itens e insumos bélicos utilizados em ações..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold cursor-pointer">Categoria Ativa</Label>
                  <p className="text-[10px] text-muted-foreground">Categorias ativas aparecem nos filtros de catálogo</p>
                </div>
                <Switch checked={ativo} onCheckedChange={setAtivo} />
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 cursor-pointer w-full sm:w-auto shadow-sm"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL EXCLUSÃO DE CATEGORIA */}
      {canManage && (
        <Dialog open={Boolean(deletingCategory)} onOpenChange={(open) => !open && setDeletingCategory(null)}>
          <DialogContent className="w-[95vw] sm:max-w-md bg-card border-rose-500/30 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                Excluir Categoria
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tem certeza que deseja apagar a categoria <strong>{deletingCategory?.nome}</strong>?
              </DialogDescription>
            </DialogHeader>

            {deletingCategory && products.some((p) => p.categoria_id === deletingCategory.id) && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                Atenção: Existem produtos vinculados a esta categoria. Ao excluí-la, os produtos ficarão sem categoria atribuída.
              </div>
            )}

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingCategory(null)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 cursor-pointer w-full sm:w-auto shadow-sm"
                disabled={deleteMutation.isPending}
                onClick={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
              >
                {deleteMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirmar Exclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ============================================================================
// ABA 3: BAÚS DO GRUPO (CONFIGURAÇÃO, CANAL DISCORD E RESPONSIVIDADE MOBILE)
// ============================================================================
interface BausTabContentProps {
  canManage: boolean;
}

function BausTabContent({ canManage }: BausTabContentProps) {
  const queryClient = useQueryClient();
  const { data: baus = [], isLoading } = useBaus();
  const { data: productBaus = [] } = useProductBaus();
  const { data: config } = useDiscordStockConfig();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBau, setEditingBau] = useState<Bau | null>(null);

  // Form State
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [icone, setIcone] = useState("📦");
  const [fotoUrl, setFotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [tipoGestao, setTipoGestao] = useState<"automatico" | "manual">("automatico");
  const [discordChannelId, setDiscordChannelId] = useState("");
  const [discordGuildId, setDiscordGuildId] = useState("");
  const [ativo, setAtivo] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [deletingBau, setDeletingBau] = useState<Bau | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    const toastId = toast.loading("Enviando imagem do baú...");
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
      toast.success("Foto do baú enviada e salva com sucesso!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da imagem.", { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveBauPhoto = async () => {
    setFotoUrl("");
    if (editingBau?.id) {
      const toastId = toast.loading("Removendo foto do baú...");
      try {
        await updateBau({
          id: editingBau.id,
          foto_url: null,
          imagem_url: null,
        });
        void queryClient.invalidateQueries({ queryKey: ["baus"] });
        toast.success("Foto do baú removida com sucesso!", { id: toastId });
      } catch (err: any) {
        toast.error(err.message || "Erro ao remover foto do baú.", { id: toastId });
      }
    } else {
      toast.info("Foto removida.");
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    const toastId = toast.loading("Enviando banner do baú...");
    try {
      const url = await uploadBauImage(file);
      setBannerUrl(url);
      if (editingBau?.id) {
        await updateBau({
          id: editingBau.id,
          banner_url: url,
        });
        void queryClient.invalidateQueries({ queryKey: ["baus"] });
        void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      }
      toast.success("Banner do baú salvo com sucesso!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload do banner.", { id: toastId });
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
    }
  };

  const handleRemoveBauBanner = async () => {
    setBannerUrl("");
    if (editingBau?.id) {
      const toastId = toast.loading("Removendo banner do baú...");
      try {
        await updateBau({
          id: editingBau.id,
          banner_url: null,
        });
        void queryClient.invalidateQueries({ queryKey: ["baus"] });
        void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
        toast.success("Banner do baú removido com sucesso!", { id: toastId });
      } catch (err: any) {
        toast.error(err.message || "Erro ao remover banner do baú.", { id: toastId });
      }
    } else {
      toast.info("Banner removido.");
    }
  };

  const openCreateModal = () => {
    if (!canManage) return;
    setEditingBau(null);
    setNome("");
    setDescricao("");
    setIcone("📦");
    setFotoUrl("");
    setBannerUrl("");
    setTipoGestao("automatico");
    setDiscordChannelId("");
    setDiscordGuildId("");
    setAtivo(true);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Bau) => {
    if (!canManage) return;
    setEditingBau(b);
    setNome(b.nome);
    setDescricao(b.descricao || "");
    setIcone(b.icone || "📦");
    setFotoUrl(b.foto_url || b.imagem_url || "");
    setBannerUrl(b.banner_url || "");
    setTipoGestao(b.tipo_gestao || "automatico");
    setDiscordChannelId(b.discord_channel_id || config?.bau_channels?.[b.id]?.channel_id || "");
    setDiscordGuildId(b.discord_guild_id || config?.bau_channels?.[b.id]?.guild_id || "");
    setAtivo(b.ativo);
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe o nome do baú.");

      const cleanChannelId = discordChannelId.trim() || null;
      const cleanGuildId = discordGuildId.trim() || null;
      const cleanPhoto = fotoUrl.trim() || null;
      const cleanBanner = bannerUrl.trim() || null;

      if (editingBau) {
        await updateBau({
          id: editingBau.id,
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          icone: icone.trim() || "📦",
          foto_url: cleanPhoto,
          imagem_url: cleanPhoto,
          banner_url: cleanBanner,
          tipo_gestao: tipoGestao,
          discord_channel_id: cleanChannelId,
          discord_guild_id: cleanGuildId,
          ativo,
        });

        // Sincroniza com config.bau_channels garantindo que banner_url e foto_url sejam preservados
        const updatedBauChannels = {
          ...(config?.bau_channels || {}),
          [editingBau.id]: {
            bau_id: editingBau.id,
            channel_id: cleanChannelId || "",
            guild_id: cleanGuildId || "",
            tipo_gestao: tipoGestao,
            is_active: ativo,
            banner_url: cleanBanner,
            foto_url: cleanPhoto,
            imagem_url: cleanPhoto,
          },
        };
        await updateDiscordStockConfig({ bau_channels: updatedBauChannels });
      } else {
        const created = await createBau({
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          icone: icone.trim() || "📦",
          foto_url: cleanPhoto,
          imagem_url: cleanPhoto,
          banner_url: cleanBanner,
          tipo_gestao: tipoGestao,
          discord_channel_id: cleanChannelId,
          discord_guild_id: cleanGuildId,
        });

        if (created?.id) {
          const updatedBauChannels = {
            ...(config?.bau_channels || {}),
            [created.id]: {
              bau_id: created.id,
              channel_id: cleanChannelId || "",
              guild_id: cleanGuildId || "",
              tipo_gestao: tipoGestao,
              is_active: true,
              banner_url: cleanBanner,
              foto_url: cleanPhoto,
              imagem_url: cleanPhoto,
            },
          };
          await updateDiscordStockConfig({ bau_channels: updatedBauChannels });
        }
      }
    },
    onSuccess: () => {
      toast.success(editingBau ? "Baú atualizado com sucesso!" : "Baú cadastrado com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["baus"] });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar baú.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (b: Bau) => {
      if (baus.length <= 1) {
        throw new Error("Não é possível excluir o único baú cadastrado no sistema.");
      }
      await deleteBau(b.id);

      if (config?.bau_channels && config.bau_channels[b.id]) {
        const next = { ...config.bau_channels };
        delete next[b.id];
        await updateDiscordStockConfig({ bau_channels: next });
      }
    },
    onSuccess: () => {
      toast.success("Baú excluído com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["baus"] });
      void queryClient.invalidateQueries({ queryKey: ["discord_stock_config"] });
      setDeletingBau(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao excluir baú.");
    },
  });

  const filteredBaus = useMemo(() => {
    return baus.filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return b.nome.toLowerCase().includes(q) || b.descricao?.toLowerCase().includes(q);
    });
  }, [baus, search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* BARRA DE FERRAMENTAS */}
      <Card className="surface-card border-border/80">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar baú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-background/60"
            />
          </div>

          {canManage && (
            <Button size="sm" onClick={openCreateModal} className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 w-full sm:w-auto shrink-0 cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" />
              <span>Novo Baú</span>
            </Button>
          )}
        </CardContent>
      </Card>

        {/* LISTA / CARDS DE BAÚS RESPONSIVOS */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
              Carregando baús...
            </div>
          ) : filteredBaus.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground text-xs">
              Nenhum baú localizado.
            </div>
          ) : (
            filteredBaus.map((b) => {
              const isAuto = b.tipo_gestao !== "manual";
              const channelId = b.discord_channel_id || config?.bau_channels?.[b.id]?.channel_id;
              const chestItemsCount = productBaus.filter((pb) => pb.bau_id === b.id && Number(pb.quantidade || 0) > 0).length;

              return (
                <Card
                  key={b.id}
                  className={cn(
                    "surface-card border overflow-hidden transition-all flex flex-col justify-between shadow-xs",
                    isAuto ? "border-primary/30 hover:border-primary/50" : "border-border/70 hover:border-border"
                  )}
                >
                  {/* Banner do Baú se presente */}
                  {b.banner_url ? (
                    <div className="relative w-full h-24 sm:h-28 overflow-hidden bg-secondary/60 shrink-0">
                      <img
                        src={b.banner_url}
                        alt={`Banner ${b.nome}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-black/30 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase font-bold shrink-0 backdrop-blur-md shadow-sm",
                            b.ativo ? "border-emerald-500/50 text-emerald-300 bg-emerald-950/80" : "border-muted text-muted-foreground bg-black/60"
                          )}
                        >
                          {b.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  ) : null}

                  <CardHeader className={cn("p-3.5 sm:p-4 pb-3 space-y-2", b.banner_url && "pt-2")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-11 h-11 rounded-xl bg-secondary/80 border-2 border-border/80 flex items-center justify-center shrink-0 overflow-hidden shadow-md",
                          b.banner_url && "-mt-7 relative z-10 ring-2 ring-background bg-card"
                        )}>
                          <BauIcon
                            foto_url={b.foto_url || b.imagem_url}
                            icone={b.icone}
                            nome={b.nome}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-bold text-foreground truncate">{b.nome}</CardTitle>
                          <span className="text-[10px] text-muted-foreground font-mono block">ID: {b.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                      {!b.banner_url && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] uppercase font-bold shrink-0",
                            b.ativo ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-muted text-muted-foreground"
                          )}
                        >
                          {b.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      )}
                    </div>
                    {b.descricao && <CardDescription className="text-xs line-clamp-2">{b.descricao}</CardDescription>}
                  </CardHeader>

                  <CardContent className="p-3.5 sm:p-4 pt-0 space-y-2.5 text-xs pb-3">
                    <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/40 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-[11px] font-medium">Modo de Gestão:</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-bold gap-1 shrink-0",
                            isAuto ? "text-cyan-400 bg-cyan-950/40 border border-cyan-800/40" : "text-amber-400 bg-amber-950/40 border border-amber-800/40"
                          )}
                        >
                          {isAuto ? <Bot className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                          {isAuto ? "Automático (Discord)" : "Manual (Painel)"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-[11px]">Canal Discord:</span>
                        {channelId ? (
                          <span className="font-mono text-foreground font-bold text-[11px] flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3 text-emerald-400" />
                            {channelId.slice(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px] shrink-0">
                            {isAuto ? "🔴 Não vinculado" : "Dispensa canal"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1 text-muted-foreground text-[11px]">
                      <span>Itens com saldo:</span>
                      <strong className="text-foreground font-mono">{chestItemsCount} tipos de item</strong>
                    </div>
                  </CardContent>

                  {canManage && (
                    <CardFooter className="p-3.5 sm:p-4 pt-2 border-t border-border/40 flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                        onClick={() => openEditModal(b)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        onClick={() => setDeletingBau(b)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* MODAL CRIAR / EDITAR BAÚ */}
        {canManage && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="w-[95vw] sm:max-w-lg bg-card border-border/80 max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>{editingBau ? `Editar Baú: ${editingBau.nome}` : "Cadastrar Novo Baú"}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Configure a foto, banner, tipo de gestão de movimentação e os parâmetros de conexão com o Discord.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-2 text-xs">
                {/* FOTO DO BAÚ COM UPLOAD DIRETO OU LINK */}
                <div className="space-y-2.5 p-3.5 rounded-xl border border-border/70 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">Foto de Perfil do Baú (Opcional)</Label>
                    {fotoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveBauPhoto}
                        className="h-6 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 font-bold gap-1 cursor-pointer rounded-lg"
                      >
                        <Trash2 className="w-3 h-3" /> Remover Foto
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="relative w-14 h-14 rounded-2xl border-2 border-dashed border-border/80 flex items-center justify-center overflow-hidden bg-background shrink-0 shadow-inner p-1">
                      {fotoUrl ? (
                        <BauIcon foto_url={fotoUrl} icone={icone} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <BauIcon icone={icone} className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingPhoto}
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border/80 cursor-pointer shadow-xs"
                        >
                          {isUploadingPhoto ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                          ) : (
                            <Upload className="w-3.5 h-3.5 text-primary" />
                          )}
                          <span>{isUploadingPhoto ? "Enviando imagem..." : "Upload Foto"}</span>
                        </Button>
                      </div>
                      <Input
                        placeholder="Ou cole o link direto da imagem..."
                        value={fotoUrl}
                        onChange={(e) => setFotoUrl(e.target.value)}
                        className="text-xs h-8 rounded-xl bg-background/80"
                      />
                    </div>
                  </div>
                </div>

                {/* BANNER DE CAPA DO BAÚ (RETANGULAR / PANORÂMICO) */}
                <div className="space-y-2.5 p-3.5 rounded-xl border border-border/70 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-foreground">Banner de Capa do Baú (Opcional)</Label>
                      <p className="text-[10px] text-muted-foreground">Exibido nos cards em modo retrato da página de movimentação</p>
                    </div>
                    {bannerUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveBauBanner}
                        className="h-6 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 font-bold gap-1 cursor-pointer rounded-lg"
                      >
                        <Trash2 className="w-3 h-3" /> Remover Banner
                      </Button>
                    )}
                  </div>

                  {bannerUrl ? (
                    <div className="relative w-full h-24 rounded-xl border border-border/70 overflow-hidden bg-background group shadow-inner">
                      <img
                        src={bannerUrl}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => bannerFileInputRef.current?.click()}
                          className="h-7 text-xs font-semibold"
                        >
                          <Upload className="w-3 h-3 mr-1" /> Trocar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveBauBanner}
                          className="h-7 text-xs font-semibold"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Remover
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <input
                      ref={bannerFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      className="hidden"
                      onChange={handleBannerUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingBanner}
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border/80 cursor-pointer shadow-xs shrink-0"
                    >
                      {isUploadingBanner ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span>{isUploadingBanner ? "Enviando banner..." : "Upload Banner"}</span>
                    </Button>
                    <Input
                      placeholder="Ou cole o link direto do banner..."
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      className="text-xs h-8 rounded-xl bg-background/80 flex-1"
                    />
                  </div>
                </div>

              <div className="grid gap-2.5 sm:gap-3 grid-cols-4">
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-xs">Ícone</Label>
                  <Input
                    value={icone}
                    onChange={(e) => setIcone(e.target.value)}
                    className="text-center text-lg h-9"
                    maxLength={4}
                  />
                </div>

                <div className="space-y-1.5 col-span-3">
                  <Label className="text-xs font-bold">Nome do Baú *</Label>
                  <Input
                    placeholder="Ex: BAÚ QG, Baú Casa, Baú Armas..."
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descrição / Finalidade</Label>
                <Textarea
                  rows={2}
                  placeholder="Ex: Armazenamento principal de armamentos e munições..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-secondary/30 border border-border/40">
                <Label className="text-xs font-bold text-foreground block">
                  Modo de Movimentação do Baú *
                </Label>
                <Select value={tipoGestao} onValueChange={(val: any) => setTipoGestao(val)}>
                  <SelectTrigger className="text-xs h-9 bg-background/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatico">
                      🤖 Automático (Ingestão de logs via Discord)
                    </SelectItem>
                    <SelectItem value="manual">
                      ✍️ Manual (Lançamentos manuais pelo painel web)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground pt-1 leading-relaxed">
                  {tipoGestao === "automatico"
                    ? "O bot monitora o canal exclusivo informado abaixo e lança entradas, saídas e transferências automaticamente a partir das logs."
                    : "Membros realizam as movimentações diretamente na aba Movimentações do painel. O bot não ingere mensagens deste baú."}
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    ID do Canal do Discord {tipoGestao === "automatico" ? "*" : "(Opcional)"}
                  </Label>
                  <Input
                    placeholder="Ex: 112233445566778899"
                    value={discordChannelId}
                    onChange={(e) => setDiscordChannelId(e.target.value)}
                    className="text-xs font-mono h-9"
                  />
                  <p className="text-[10px] text-muted-foreground">ID numérico do canal onde o bot capta as logs deste baú.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">ID do Servidor Discord (Guild ID - Opcional)</Label>
                  <Input
                    placeholder="Ex: 998877665544332211 (opcional, herda servidor geral)"
                    value={discordGuildId}
                    onChange={(e) => setDiscordGuildId(e.target.value)}
                    className="text-xs font-mono h-9"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold cursor-pointer">Baú Ativo</Label>
                  <p className="text-[10px] text-muted-foreground">Baús ativos ficam disponíveis para seleção em todas as telas</p>
                </div>
                <Switch checked={ativo} onCheckedChange={setAtivo} />
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 cursor-pointer w-full sm:w-auto shadow-sm"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {editingBau ? "Salvar Alterações" : "Cadastrar Baú"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL EXCLUSÃO DE BAÚ */}
      {canManage && (
        <Dialog open={Boolean(deletingBau)} onOpenChange={(open) => !open && setDeletingBau(null)}>
          <DialogContent className="w-[95vw] sm:max-w-md bg-card border-rose-500/30 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                Excluir Baú
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tem certeza que deseja apagar o baú <strong>{deletingBau?.nome}</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
              Atenção: Apenas baús que não sejam o único depósito do grupo podem ser excluídos.
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingBau(null)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 cursor-pointer w-full sm:w-auto shadow-sm"
                disabled={deleteMutation.isPending}
                onClick={() => deletingBau && deleteMutation.mutate(deletingBau)}
              >
                {deleteMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirmar Exclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ============================================================================
// ABA 4: AJUSTE & SALDO DE ESTOQUE (MATRIZ, MODAL AUDITADO E CARDS MOBILE)
// ============================================================================
interface SaldosTabContentProps {
  canAdjust: boolean;
  canManageBalance: boolean;
}

function SaldosTabContent({ canAdjust, canManageBalance }: SaldosTabContentProps) {
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const { data: baus = [] } = useBaus();
  const { data: productBaus = [], isLoading } = useProductBaus();

  const [search, setSearch] = useState("");
  const [selectedBauFilter, setSelectedBauFilter] = useState("all");

  // Modal de Ajuste
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState("");
  const [targetBauId, setTargetBauId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"definir" | "entrada" | "saida">("entrada");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");

  const openAdjustModalFor = (productId?: string, bauId?: string) => {
    if (!canAdjust) return;
    setTargetProductId(productId || products[0]?.id || "");
    setTargetBauId(bauId || baus[0]?.id || "");
    setAdjustmentType(canManageBalance ? "definir" : "entrada");
    setQuantity(1);
    setReason("");
    setIsAdjustModalOpen(true);
  };

  // Helper para computar saldo atual do produto no baú selecionado
  const currentSelectedBalance = useMemo(() => {
    if (!targetProductId || !targetBauId) return 0;
    const entry = productBaus.find((pb) => pb.product_id === targetProductId && pb.bau_id === targetBauId);
    if (entry) return Number(entry.quantidade || 0);

    const p = products.find((prod) => prod.id === targetProductId);
    if (baus.length <= 1 && p) return Number(p.estoque_atual || 0);
    return 0;
  }, [targetProductId, targetBauId, productBaus, products, baus]);

  // Saldo resultante calculado
  const calculatedResultingBalance = useMemo(() => {
    const q = Number(quantity) || 0;
    if (adjustmentType === "definir") return q;
    if (adjustmentType === "entrada") return currentSelectedBalance + q;
    if (adjustmentType === "saida") return Math.max(0, currentSelectedBalance - q);
    return currentSelectedBalance;
  }, [adjustmentType, quantity, currentSelectedBalance]);

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!targetProductId) throw new Error("Selecione o produto.");
      if (!targetBauId) throw new Error("Selecione o baú.");
      if (!reason.trim() || reason.trim().length < 4) {
        throw new Error("Informe um motivo detalhado para a auditoria de ajuste (mínimo 4 caracteres).");
      }

      if (adjustmentType === "definir" && !canManageBalance) {
        throw new Error("Você não possui a permissão crítica necessária para redefinir saldos absolutos.");
      }

      return await adjustStockDev({
        productId: targetProductId,
        bauId: targetBauId,
        adjustmentType,
        quantity: Number(quantity) || 0,
        reason: reason.trim(),
      });
    },
    onSuccess: (res) => {
      toast.success(
        `Saldo atualizado com sucesso! Novo saldo: ${res?.resulting_balance ?? calculatedResultingBalance}`
      );
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      setIsAdjustModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao gravar ajuste de estoque.");
    },
  });

  // Tabela filtrada com busca case-insensitive e fuzzy
  const { exactFilteredProducts, similarFilteredProducts } = useMemo(() => {
    if (!search.trim()) {
      return {
        exactFilteredProducts: products,
        similarFilteredProducts: [] as FuzzyProductMatch[],
      };
    }
    return searchProductsWithFuzzy(products, search, [], baus);
  }, [products, search, baus]);

  const activeBaus = useMemo(() => baus.filter((b) => b.ativo), [baus]);
  const displayedProducts = exactFilteredProducts.length > 0 ? exactFilteredProducts : similarFilteredProducts.map((s) => s.product);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* BARRA DE FERRAMENTAS E AÇÃO RÁPIDA */}
      <Card className="surface-card border-border/80">
        <CardContent className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar saldo por nome ou alias Discord..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 text-xs h-9 bg-background/60"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Select value={selectedBauFilter} onValueChange={setSelectedBauFilter}>
              <SelectTrigger className="w-full sm:w-44 text-xs h-9 bg-background/60">
                <SelectValue placeholder="Filtrar por Baú..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Baús</SelectItem>
                {activeBaus.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="flex items-center gap-1.5">
                      <BauIcon foto_url={b.foto_url || b.imagem_url} icone={b.icone} nome={b.nome} className="w-3.5 h-3.5 object-cover rounded" />
                      <span>{b.nome}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canAdjust && (
            <Button
              size="sm"
              onClick={() => openAdjustModalFor()}
              className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 w-full sm:w-auto shrink-0 cursor-pointer shadow-sm"
            >
              <Sliders className="w-4 h-4" />
              <span>Lançar Ajuste Auditado</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* AVISO DE NOMES SIMILARES NO SALDO */}
      {search.trim() && exactFilteredProducts.length === 0 && similarFilteredProducts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>Nenhum saldo para "{search}", mas encontramos estes itens parecidos:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {similarFilteredProducts.map(({ product, reason, score }) => (
              <Badge
                key={product.id}
                variant="outline"
                className="border-amber-500/40 bg-amber-500/15 text-amber-200 text-[11px] py-1 px-2 gap-1.5"
              >
                <strong className="font-bold">{product.nome}</strong>
                <span className="opacity-75 font-mono text-[10px]">({reason})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* EXIBIÇÃO MOBILE DE SALDOS POR BAÚ (md:hidden) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
            Carregando saldos de estoque...
          </Card>
        ) : displayedProducts.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-xs">
            Nenhum item localizado.
          </Card>
        ) : (
          displayedProducts.map((p) => {
            const isLow = Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0);
            const bausToRender = selectedBauFilter === "all" ? activeBaus : activeBaus.filter((b) => b.id === selectedBauFilter);

            return (
              <Card
                key={p.id}
                className={cn(
                  "surface-card border p-3.5 space-y-3 transition-all shadow-xs",
                  isLow ? "border-rose-500/30 bg-rose-500/[0.02]" : "border-border/70"
                )}
              >
                {/* TOPO: ITEM + SALDO TOTAL GERAL */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ProductThumbnail src={p.imagem_url} name={p.nome} size="sm" className="shrink-0" />
                    <div className="min-w-0">
                      <strong className="text-sm font-bold text-foreground block truncate">{p.nome}</strong>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Mínimo: {p.estoque_minimo || 0} {p.unidade || "un"}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "font-bold font-mono text-xs px-2 py-0.5 shrink-0",
                      isLow
                        ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                        : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                    )}
                  >
                    Total: {num(p.estoque_atual || 0)} {p.unidade || "un"}
                  </Badge>
                </div>

                {/* DISTRIBUIÇÃO POR BAÚ EM CHIPS CLICÁVEIS */}
                <div className="space-y-1.5 pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    Distribuição nos Baús (toque para ajustar):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {bausToRender.map((b) => {
                      const entry = productBaus.find((pb) => pb.product_id === p.id && pb.bau_id === b.id);
                      const q = entry ? Number(entry.quantidade || 0) : 0;

                      return (
                        <div
                          key={b.id}
                          onClick={() => canAdjust && openAdjustModalFor(p.id, b.id)}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg border text-xs transition-all",
                            q > 0
                              ? "bg-secondary/60 border-border/80 hover:border-primary/50"
                              : "bg-secondary/20 border-border/40 opacity-60",
                            canAdjust ? "cursor-pointer active:scale-95" : ""
                          )}
                        >
                          <span className="flex items-center gap-1.5 min-w-0 truncate">
                            <BauIcon foto_url={b.foto_url || b.imagem_url} icone={b.icone} nome={b.nome} className="w-3.5 h-3.5 object-cover rounded shrink-0" />
                            <span className="text-[11px] font-medium truncate">{b.nome}</span>
                          </span>
                          <strong className="font-mono text-xs font-bold text-foreground pl-1 shrink-0">
                            {num(q)}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BOTÃO AJUSTAR SALDO */}
                {canAdjust && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs font-bold text-primary border-primary/30 bg-primary/5 hover:bg-primary/10 gap-1.5 rounded-lg"
                    onClick={() => openAdjustModalFor(p.id)}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Lançar Ajuste Auditado</span>
                  </Button>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* MATRIZ DE SALDOS PARA DESKTOP (hidden md:block) */}
      <Card className="surface-card border-border/80 overflow-hidden hidden md:block">
        <CardHeader className="pb-3 border-b border-border/40 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Matriz de Distribuição de Estoque por Baú
              </CardTitle>
              <CardDescription className="text-xs">
                Contagem atualizada de cada item distribuída entre os baús do grupo.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {displayedProducts.length} itens catalogados
            </Badge>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-xs min-w-[200px]">Item</TableHead>
                {selectedBauFilter === "all" ? (
                  activeBaus.map((b) => (
                    <TableHead key={b.id} className="text-xs text-center font-mono">
                      <span className="flex items-center justify-center gap-1">
                        <BauIcon foto_url={b.foto_url || b.imagem_url} icone={b.icone} nome={b.nome} className="w-3.5 h-3.5 object-cover rounded" />
                        <span>{b.nome}</span>
                      </span>
                    </TableHead>
                  ))
                ) : (
                  <TableHead className="text-xs text-center font-mono">
                    {activeBaus.find((b) => b.id === selectedBauFilter)?.nome}
                  </TableHead>
                )}
                <TableHead className="text-xs text-center font-mono font-bold">Total Geral</TableHead>
                {canAdjust && <TableHead className="text-xs text-right">Ação</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={activeBaus.length + (canAdjust ? 3 : 2)} className="text-center py-12 text-muted-foreground text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Carregando matriz de saldos...
                  </TableCell>
                </TableRow>
              ) : displayedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeBaus.length + (canAdjust ? 3 : 2)} className="text-center py-12 text-muted-foreground text-xs">
                    Nenhum item localizado.
                  </TableCell>
                </TableRow>
              ) : (
                displayedProducts.map((p) => {
                  const bausToRender = selectedBauFilter === "all" ? activeBaus : activeBaus.filter((b) => b.id === selectedBauFilter);

                  return (
                    <TableRow key={p.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <ProductThumbnail src={p.imagem_url} name={p.nome} size="sm" />
                          <div>
                            <strong className="text-xs text-foreground font-bold block truncate">{p.nome}</strong>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Mín: {p.estoque_minimo || 0} {p.unidade || "un"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {bausToRender.map((b) => {
                        const entry = productBaus.find((pb) => pb.product_id === p.id && pb.bau_id === b.id);
                        const q = entry ? Number(entry.quantidade || 0) : 0;

                        return (
                          <TableCell key={b.id} className="text-xs py-2.5 text-center font-mono">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[11px] font-bold inline-block transition-all",
                                q > 0 ? "bg-secondary/60 text-foreground" : "text-muted-foreground opacity-40",
                                canAdjust ? "cursor-pointer hover:bg-primary/20 hover:text-primary hover:underline" : "cursor-default"
                              )}
                              onClick={() => canAdjust && openAdjustModalFor(p.id, b.id)}
                              title={canAdjust ? "Clique para ajustar este saldo" : undefined}
                            >
                              {num(q)}
                            </span>
                          </TableCell>
                        );
                      })}

                      <TableCell className="text-xs py-2.5 text-center font-mono font-bold">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px] font-bold",
                            Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0)
                              ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                              : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                          )}
                        >
                          {num(p.estoque_atual || 0)} {p.unidade || "un"}
                        </Badge>
                      </TableCell>

                      {canAdjust && (
                        <TableCell className="text-xs py-2.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2.5 border-border/60 hover:bg-primary/10 hover:text-primary cursor-pointer rounded-lg font-bold"
                            onClick={() => openAdjustModalFor(p.id)}
                          >
                            <Sliders className="w-3 h-3 text-primary" />
                            Ajustar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* MODAL DE AJUSTE AUDITADO DE ESTOQUE */}
      {canAdjust && (
        <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg bg-card border-border/80 max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span>Lançar Ajuste Auditado de Estoque</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ajuste físico ou correção de contagem gravada permanentemente com motivo auditado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Produto *</Label>
                  <Select value={targetProductId} onValueChange={setTargetProductId}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Selecione o produto..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Baú Destino *</Label>
                  <Select value={targetBauId} onValueChange={setTargetBauId}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="Selecione o baú..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeBaus.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          <span className="flex items-center gap-1.5">
                            <BauIcon foto_url={b.foto_url || b.imagem_url} icone={b.icone} nome={b.nome} className="w-3.5 h-3.5 object-cover rounded" />
                            <span>{b.nome}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* TIPO DE AJUSTE */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo de Ajuste *</Label>
                <div className={cn("grid gap-1.5 sm:gap-2", canManageBalance ? "grid-cols-3" : "grid-cols-2")}>
                  {canManageBalance && (
                    <Button
                      type="button"
                      variant={adjustmentType === "definir" ? "default" : "outline"}
                      size="sm"
                      className="text-[11px] sm:text-xs h-8 gap-1 font-bold cursor-pointer"
                      onClick={() => setAdjustmentType("definir")}
                    >
                      <Equal className="w-3 h-3" />
                      Definir Saldo
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant={adjustmentType === "entrada" ? "default" : "outline"}
                    size="sm"
                    className="text-[11px] sm:text-xs h-8 gap-1 font-bold cursor-pointer"
                    onClick={() => setAdjustmentType("entrada")}
                  >
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    Creditar (+)
                  </Button>

                  <Button
                    type="button"
                    variant={adjustmentType === "saida" ? "default" : "outline"}
                    size="sm"
                    className="text-[11px] sm:text-xs h-8 gap-1 font-bold cursor-pointer"
                    onClick={() => setAdjustmentType("saida")}
                  >
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                    Debitar (-)
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    {adjustmentType === "definir" ? "Novo Saldo Exato" : "Quantidade a Ajustar"} *
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="text-xs font-mono h-9"
                  />

                  {/* ATALHOS RÁPIDOS DE QUANTIDADE */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {[1, 5, 10, 50, 100].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setQuantity((prev) => (adjustmentType === "definir" ? step : prev + step))}
                        className="text-[10px] font-mono font-bold bg-secondary/80 hover:bg-secondary border border-border/70 rounded px-2 py-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CARD PREVIEW DO RESULTADO */}
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 flex flex-col justify-center text-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Saldo Resultante</span>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="font-mono text-muted-foreground text-xs line-through">{currentSelectedBalance}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    <strong className="font-mono text-base text-emerald-400 font-black">{calculatedResultingBalance}</strong>
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-0.5">
                    {adjustmentType === "definir"
                      ? "Novo saldo absoluto"
                      : adjustmentType === "entrada"
                      ? `+${quantity} adicionados`
                      : `-${quantity} subtraídos`}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Motivo Auditado do Ajuste *</Label>
                  <span className="text-[10px] text-muted-foreground">{reason.length}/300</span>
                </div>
                <Textarea
                  rows={3}
                  maxLength={300}
                  placeholder="Descreva detalhadamente o motivo (ex: 'Acerto de inventário semanal', 'Apreensão policial em ação', 'Correção de contagem física')..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Esta ação grava imediatamente um registro de auditoria permanente com a tag <strong>[Ajuste Gestão]</strong> e recalcula o saldo geral do grupo.
                </span>
              </div>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsAdjustModalOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 cursor-pointer w-full sm:w-auto shadow-sm"
                disabled={adjustMutation.isPending}
                onClick={() => adjustMutation.mutate()}
              >
                {adjustMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirmar e Gravar Ajuste
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
