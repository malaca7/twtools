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
} from "lucide-react";
import { BauIcon } from "@/components/ui/bau-icon";
import { useAuth } from "@/hooks/useAuth";
import {
  useProducts,
  useCategories,
  useBaus,
  useProductBaus,
  useMovements,
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
      tabs.push({ id: "baus", label: "Baús do grupo", icon: Layers, count: baus.length });
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-black tracking-tight text-foreground">Acesso Restrito à Gestão de Estoque</h2>
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
    <div className="space-y-6 pb-12">
      {/* CABEÇALHO DA PÁGINA COM AÇÕES GERAIS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary shadow-xs">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  Gestão de Estoque
                </h1>
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[10px] font-bold">
                  Operações & Catálogo
                </Badge>
                {isDevUser && (
                  <Badge variant="outline" className="border-rose-500/40 text-rose-400 bg-rose-500/10 text-[10px] font-bold hidden sm:inline-flex">
                    Visão Dev (Acesso Pleno)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Cadastros, categorias, parametrização de baús do grupo e ajustes auditados de inventário.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDevUser && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5 rounded-xl border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 shadow-xs"
            >
              <Link to="/dev/estoque">
                <Wrench className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ajustes Dev & Bot</span>
                <span className="sm:hidden">Dev Estoque</span>
              </Link>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isRefetchingProducts}
            className="h-9 text-xs font-semibold gap-1.5 rounded-xl border-border/70 hover:bg-secondary/60 cursor-pointer"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-primary", isRefetchingProducts && "animate-spin")} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* ABAS PRINCIPAIS - RENDERIZAÇÃO ESTREITA E OCULTAÇÃO TOTAL DE NÃO-PERMITIDAS */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as GestaoEstoqueTab)} className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-secondary/40 border border-border/50 p-1 rounded-xl flex flex-wrap items-center gap-1 w-full sm:w-auto h-auto min-w-max">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2 px-3.5 gap-2 rounded-lg transition-all cursor-pointer"
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
          <TabsContent value="produtos" className="space-y-6 m-0">
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
          <TabsContent value="categorias" className="space-y-6 m-0">
            <CategoriasTabContent canManage={canManageCategorias} />
          </TabsContent>
        )}

        {canViewBaus && (
          <TabsContent value="baus" className="space-y-6 m-0">
            <BausTabContent canManage={canManageBaus} />
          </TabsContent>
        )}

        {canViewSaldos && (
          <TabsContent value="saldos" className="space-y-6 m-0">
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
// ABA 1: PRODUTOS (CATÁLOGO, REGRAS, IMAGENS, PREÇOS E FILTROS INTELIGENTES)
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
  const [cdaName, setCdaName] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [bauId, setBauId] = useState("");
  const [unidade, setUnidade] = useState("un");
  const [precoInput, setPrecoInput] = useState("");
  const [estoqueMin, setEstoqueMin] = useState(0);
  const [imagemUrl, setImagemUrl] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const openCreateModal = () => {
    if (!canManage) return;
    setEditingProduct(null);
    setNome("");
    setCdaName("");
    setDescricao("");
    setCategoriaId(categories[0]?.id || "");
    setBauId(baus[0]?.id || "");
    setUnidade("un");
    setPrecoInput("");
    setEstoqueMin(0);
    setImagemUrl("");
    setAtivo(true);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    if (!canManage) return;
    setEditingProduct(prod);
    setNome(prod.nome);
    setCdaName(prod.cda_name || "");
    setDescricao(prod.descricao || "");
    setCategoriaId(prod.categoria_id || "");
    setBauId(prod.bau_id || "");
    setUnidade(prod.unidade || "un");
    setPrecoInput(prod.preco_sugerido ? formatCurrencyInput(prod.preco_sugerido) : "");
    setEstoqueMin(prod.estoque_minimo || 0);
    setImagemUrl(prod.imagem_url || "");
    setAtivo(prod.ativo);
    setIsModalOpen(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const toastId = toast.loading("Enviando foto do produto...");
    try {
      const url = await uploadProductImage(file);
      setImagemUrl(url);
      toast.success("Foto do produto enviada com sucesso!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da foto.", { id: toastId });
    } finally {
      setIsUploadingImage(false);
      if (productImageInputRef.current) productImageInputRef.current.value = "";
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe o nome do produto.");
      const precoSugerido = parseCurrencyInput(precoInput);

      const payload: any = {
        nome: nome.trim(),
        cda_name: cdaName.trim() || undefined,
        descricao: descricao.trim() || undefined,
        categoria_id: categoriaId || undefined,
        bau_id: bauId || undefined,
        unidade: unidade.trim() || "un",
        estoque_minimo: estoqueMin,
        preco_sugerido: precoSugerido,
        imagem_url: imagemUrl.trim() || undefined,
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
      setDeletingProduct(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao excluir produto.");
    },
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter === "active" && !p.ativo) return false;
      if (statusFilter === "inactive" && p.ativo) return false;
      if (categoryFilter !== "all" && p.categoria_id !== categoryFilter) return false;
      if (criticalOnlyFilter) {
        const isLow = p.ativo && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0);
        if (!isLow) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.nome.toLowerCase().includes(q);
        const matchesDesc = p.descricao?.toLowerCase().includes(q);
        const matchesCda = p.cda_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCda) return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, statusFilter, criticalOnlyFilter]);

  // Estatísticas rápidas
  const totalAtivos = products.filter((p) => p.ativo).length;
  const totalBaixoEstoque = products.filter((p) => p.ativo && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0)).length;
  const valorTotalEstoque = products.reduce((acc, p) => acc + Number(p.estoque_atual || 0) * Number(p.preco_sugerido || 0), 0);

  const hasAnyRowAction = canManage || canAdjustSaldos;

  return (
    <div className="space-y-6">
      {/* STATS RÁPIDOS */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="surface-card border-border/70 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Total de Produtos</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-foreground">{products.length}</span>
            <Boxes className="w-5 h-5 text-primary opacity-60" />
          </div>
          <span className="text-[10px] text-muted-foreground">{totalAtivos} ativos no catálogo</span>
        </Card>

        <Card className="surface-card border-border/70 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Categorias</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-cyan-400">{categories.length}</span>
            <FolderTree className="w-5 h-5 text-cyan-400 opacity-60" />
          </div>
          <span className="text-[10px] text-muted-foreground">Departamentos configurados</span>
        </Card>

        <Card
          onClick={() => setCriticalOnlyFilter((prev) => !prev)}
          className={cn(
            "surface-card border p-4 space-y-1 transition-all cursor-pointer",
            criticalOnlyFilter
              ? "border-amber-500/80 bg-amber-500/10 shadow-sm"
              : "border-border/70 hover:border-amber-500/40"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Estoque Crítico</span>
            <Badge variant="outline" className="text-[9px] font-mono border-amber-500/40 text-amber-400">
              {criticalOnlyFilter ? "Filtro Ativo" : "Filtrar"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-2xl font-black", totalBaixoEstoque > 0 ? "text-amber-400" : "text-emerald-400")}>
              {totalBaixoEstoque}
            </span>
            <AlertTriangle className={cn("w-5 h-5", totalBaixoEstoque > 0 ? "text-amber-400" : "text-emerald-400")} />
          </div>
          <span className="text-[10px] text-muted-foreground">Itens em ou abaixo do mínimo</span>
        </Card>

        <Card className="surface-card border-border/70 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Patrimônio em Itens</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-emerald-400 tracking-tight">{currency(valorTotalEstoque)}</span>
            <TrendingUp className="w-5 h-5 text-emerald-400 opacity-60" />
          </div>
          <span className="text-[10px] text-muted-foreground">Valor estimado em depósito</span>
        </Card>
      </div>

      {/* BARRA DE FERRAMENTAS E FILTROS */}
      <Card className="surface-card border-border/80">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar produto pelo nome, descrição ou log CDA..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 text-xs h-9"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-44 text-xs h-9">
                  <SelectValue placeholder="Categoria..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="w-36 text-xs h-9">
                  <SelectValue placeholder="Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Apenas Ativos</SelectItem>
                  <SelectItem value="inactive">Apenas Inativos</SelectItem>
                </SelectContent>
              </Select>

              {criticalOnlyFilter && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCriticalOnlyFilter(false)}
                  className="h-9 text-xs font-bold gap-1 text-amber-400 bg-amber-500/15 border border-amber-500/30"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Estoque Crítico</span>
                  <X className="w-3 h-3 ml-0.5" />
                </Button>
              )}
            </div>

            {/* BOTÃO NOVO PRODUTO (OCULTO SE NÃO TIVER PERMISSÃO) */}
            {canManage && (
              <Button
                size="sm"
                onClick={openCreateModal}
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 shrink-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Produto
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TABELA DE PRODUTOS */}
      <Card className="surface-card border-border/80 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="text-xs">Produto</TableHead>
                <TableHead className="text-xs">Categoria</TableHead>
                <TableHead className="text-xs">Baú Preferencial</TableHead>
                <TableHead className="text-xs text-right">Preço Sugerido</TableHead>
                <TableHead className="text-xs text-center">Estoque Mín.</TableHead>
                <TableHead className="text-xs text-center">Saldo Atual</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
                {/* COLUNA AÇÕES OCULTA SE O MEMBRO NÃO TIVER NENHUMA AÇÃO PERMITIDA */}
                {hasAnyRowAction && <TableHead className="text-xs text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={hasAnyRowAction ? 8 : 7} className="text-center py-12 text-muted-foreground text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Carregando catálogo de produtos...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasAnyRowAction ? 8 : 7} className="text-center py-12 text-muted-foreground text-xs">
                    Nenhum produto localizado com os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoria_id);
                  const b = baus.find((item) => item.id === p.bau_id);
                  const isLow = p.ativo && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0);

                  return (
                    <TableRow key={p.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          {p.imagem_url ? (
                            <img
                              src={p.imagem_url}
                              alt={p.nome}
                              className="w-8 h-8 rounded-lg object-cover border border-border/60 shrink-0 bg-black/40"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-secondary/80 border border-border/60 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 shadow-inner">
                              📦
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <strong className="text-xs text-foreground font-bold truncate">{p.nome}</strong>
                              {p.cda_name && (
                                <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 border-primary/30 text-primary/80 bg-primary/5">
                                  CDA: {p.cda_name}
                                </Badge>
                              )}
                            </div>
                            {p.descricao && <span className="text-[10px] text-muted-foreground block truncate max-w-xs">{p.descricao}</span>}
                          </div>
                        </div>
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

                      {/* AÇÕES DE LINHA (OCULTAS SE NÃO TIVER PERMISSÃO) */}
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
                                <span className="hidden sm:inline">Ajustar</span>
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

      {/* MODAL CRIAR / EDITAR PRODUTO (SOMENTE SE canManage) */}
      {canManage && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border/80">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Boxes className="w-4 h-4 text-primary" />
                {editingProduct ? `Editar Produto: ${editingProduct.nome}` : "Cadastrar Novo Produto"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Preencha os dados do item para catálogo, baú preferencial e regras de estoque.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Nome do Produto <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Ex: MP5, Micro Uzi, Paracetamol..."
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>Nome no Log Discord (CDA)</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Alias Ingestão</span>
                  </Label>
                  <Input
                    placeholder="Ex: Lockpick, Micro Uzi..."
                    value={cdaName}
                    onChange={(e) => setCdaName(e.target.value)}
                    className="text-xs font-mono"
                  />
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

              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger className="text-xs">
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
                    <SelectTrigger className="text-xs">
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

              <div className="grid gap-3 grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Unidade</Label>
                  <Input
                    placeholder="Ex: un, pacote..."
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Preço Sugerido</Label>
                  <Input
                    placeholder="R$ 0,00"
                    value={precoInput}
                    onChange={(e) => setPrecoInput(formatCurrencyInput(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Estoque Mínimo</Label>
                  <Input
                    type="number"
                    min={0}
                    value={estoqueMin}
                    onChange={(e) => setEstoqueMin(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* FOTO DO PRODUTO COM UPLOAD DIRETO OU LINK */}
              <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Foto do Produto (Opcional)</Label>
                  {imagemUrl && (
                    <button
                      type="button"
                      onClick={() => setImagemUrl("")}
                      className="text-[10px] text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Remover foto
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl border border-border/80 flex items-center justify-center overflow-hidden bg-background shrink-0 shadow-inner">
                    {imagemUrl ? (
                      <img src={imagemUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Boxes className="w-5 h-5 text-muted-foreground opacity-40" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <input
                        ref={productImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProductImageUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingImage}
                        onClick={() => productImageInputRef.current?.click()}
                        className="h-7 text-xs font-bold gap-1 rounded-lg border-border/80 cursor-pointer"
                      >
                        {isUploadingImage ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 text-primary" />}
                        <span>{isUploadingImage ? "Enviando..." : "Upload Foto"}</span>
                      </Button>
                    </div>
                    <Input
                      placeholder="Ou cole o link direto da imagem..."
                      value={imagemUrl}
                      onChange={(e) => setImagemUrl(e.target.value)}
                      className="text-xs h-7.5"
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
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 cursor-pointer"
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
          <DialogContent className="sm:max-w-md bg-card border-rose-500/30">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                Excluir Produto
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tem certeza que deseja apagar o produto <strong>{deletingProduct?.nome}</strong>?
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
              O histórico de movimentações anteriores será preservado para auditoria, mas o produto não poderá mais ser movimentado.
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setDeletingProduct(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 cursor-pointer"
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
// ABA 2: CATEGORIAS (CRIAR / EDITAR / APAGAR / GERENCIAR)
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
    <div className="space-y-6">
      {/* BARRA DE FERRAMENTAS */}
      <Card className="surface-card border-border/80">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* BOTÃO NOVA CATEGORIA (OCULTO SE NÃO TIVER PERMISSÃO) */}
          {canManage && (
            <Button size="sm" onClick={openCreateModal} className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 shrink-0 cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" />
              Nova Categoria
            </Button>
          )}
        </CardContent>
      </Card>

      {/* GRID DE CATEGORIAS */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
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
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <FolderTree className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-sm font-bold text-foreground">{c.nome}</CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase font-bold",
                        c.ativo ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-muted text-muted-foreground"
                      )}
                    >
                      {c.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  {c.descricao && <CardDescription className="text-xs line-clamp-2 pt-1">{c.descricao}</CardDescription>}
                </CardHeader>

                <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {prodCount} {prodCount === 1 ? "produto" : "produtos"}
                  </Badge>

                  {/* AÇÕES DE CATEGORIA (OCULTAS SE NÃO TIVER PERMISSÃO) */}
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
          <DialogContent className="sm:max-w-md bg-card border-border/80">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-cyan-400" />
                {editingCategory ? `Editar Categoria: ${editingCategory.nome}` : "Cadastrar Nova Categoria"}
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
                  className="text-xs"
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 cursor-pointer"
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
          <DialogContent className="sm:max-w-md bg-card border-rose-500/30">
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
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                Atenção: Existem produtos vinculados a esta categoria. Ao excluí-la, os produtos ficarão sem categoria atribuída.
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setDeletingCategory(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 cursor-pointer"
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
// ABA 3: BAÚS DO GRUPO (CRIAR / EDITAR / APAGAR / GERENCIAR)
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
  const [tipoGestao, setTipoGestao] = useState<"automatico" | "manual">("automatico");
  const [discordChannelId, setDiscordChannelId] = useState("");
  const [discordGuildId, setDiscordGuildId] = useState("");
  const [ativo, setAtivo] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      toast.success("Foto do baú enviada com sucesso!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da imagem.", { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openCreateModal = () => {
    if (!canManage) return;
    setEditingBau(null);
    setNome("");
    setDescricao("");
    setIcone("📦");
    setFotoUrl("");
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

      if (editingBau) {
        await updateBau({
          id: editingBau.id,
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          icone: icone.trim() || "📦",
          foto_url: cleanPhoto,
          imagem_url: cleanPhoto,
          tipo_gestao: tipoGestao,
          discord_channel_id: cleanChannelId,
          discord_guild_id: cleanGuildId,
          ativo,
        });

        // Sincroniza com config.bau_channels
        const updatedBauChannels = {
          ...(config?.bau_channels || {}),
          [editingBau.id]: {
            bau_id: editingBau.id,
            channel_id: cleanChannelId || "",
            guild_id: cleanGuildId || "",
            tipo_gestao: tipoGestao,
            is_active: ativo,
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
    <div className="space-y-6">
      {/* BARRA DE FERRAMENTAS */}
      <Card className="surface-card border-border/80">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar baú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          {/* BOTÃO NOVO BAÚ (OCULTO SE NÃO TIVER PERMISSÃO) */}
          {canManage && (
            <Button size="sm" onClick={openCreateModal} className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 shrink-0 cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" />
              Novo Baú
            </Button>
          )}
        </CardContent>
      </Card>

      {/* LISTA / CARDS DE BAÚS */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
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
                  "surface-card border transition-all flex flex-col justify-between shadow-xs",
                  isAuto ? "border-primary/30 hover:border-primary/50" : "border-border/70 hover:border-border"
                )}
              >
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-secondary/80 border border-border/70 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        <BauIcon
                          foto_url={b.foto_url || b.imagem_url}
                          icone={b.icone}
                          nome={b.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">{b.nome}</CardTitle>
                        <span className="text-[10px] text-muted-foreground font-mono">ID: {b.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] uppercase font-bold",
                        b.ativo ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-muted text-muted-foreground"
                      )}
                    >
                      {b.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {b.descricao && <CardDescription className="text-xs line-clamp-2">{b.descricao}</CardDescription>}
                </CardHeader>

                <CardContent className="space-y-3 text-xs pb-3">
                  <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Modo de Movimentação:</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] font-bold gap-1",
                          isAuto ? "text-cyan-400 bg-cyan-950/40 border border-cyan-800/40" : "text-amber-400 bg-amber-950/40 border border-amber-800/40"
                        )}
                      >
                        {isAuto ? <Bot className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                        {isAuto ? "Automático (Discord)" : "Manual (Painel Web)"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Canal Discord:</span>
                      {channelId ? (
                        <span className="font-mono text-foreground font-bold text-[11px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          {channelId.slice(0, 10)}...
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">
                          {isAuto ? "🔴 Não configurado" : "Dispensa canal"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1 text-muted-foreground text-[11px]">
                    <span>Itens com saldo em estoque:</span>
                    <strong className="text-foreground font-mono">{chestItemsCount} tipos de item</strong>
                  </div>
                </CardContent>

                {/* AÇÕES DE BAÚ (OCULTAS SE NÃO TIVER PERMISSÃO) */}
                {canManage && (
                  <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-end gap-1">
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
          <DialogContent className="sm:max-w-lg bg-card border-border/80">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                {editingBau ? `Editar Baú: ${editingBau.nome}` : "Cadastrar Novo Baú"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure o tipo de gestão de movimentação e os parâmetros de conexão com o canal do Discord.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              {/* Foto de Perfil do Baú */}
              <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Foto de Perfil do Baú (Opcional)</Label>
                  {fotoUrl && (
                    <button
                      type="button"
                      onClick={() => setFotoUrl("")}
                      className="text-[10px] text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Remover foto
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl border-2 border-dashed border-border/80 flex items-center justify-center overflow-hidden bg-background shrink-0 shadow-inner">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt="Preview do Baú" className="w-full h-full object-cover" />
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
                        className="h-8 text-xs font-bold gap-1.5 border-border/80 cursor-pointer"
                      >
                        {isUploadingPhoto ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
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

              <div className="grid gap-3 grid-cols-4">
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
                      🤖 Automático (Ingestão de mensagens via canal do Discord)
                    </SelectItem>
                    <SelectItem value="manual">
                      ✍️ Manual (Lançamentos manuais pelo painel na página Movimentações)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground pt-1">
                  {tipoGestao === "automatico"
                    ? "O bot monitora o canal exclusivo informado abaixo e lança entradas, saídas e transferências automaticamente a partir das mensagens do jogo."
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 cursor-pointer"
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
          <DialogContent className="sm:max-w-md bg-card border-rose-500/30">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                Excluir Baú
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tem certeza que deseja apagar o baú <strong>{deletingBau?.nome}</strong>?
              </DialogDescription>
            </DialogHeader>

            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
              Atenção: Apenas baús que não sejam o único depósito do grupo podem ser excluídos.
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setDeletingBau(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5 cursor-pointer"
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
// ABA 4: AJUSTE & SALDO DE ESTOQUE (MATRIZ, AJUSTES AUDITADOS, REDEFINIR)
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
    // Se não tiver permissão crítica de redefinir saldo, força "entrada"
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

    // Fallback: se houver apenas 1 baú ou se o produto tem bau_id direto
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

  // Tabela filtrada
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.nome.toLowerCase().includes(q) && !p.cda_name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [products, search]);

  const activeBaus = useMemo(() => baus.filter((b) => b.ativo), [baus]);

  return (
    <div className="space-y-6">
      {/* BARRA DE FERRAMENTAS E AÇÃO RÁPIDA */}
      <Card className="surface-card border-border/80">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar saldo de item por nome ou alias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <Select value={selectedBauFilter} onValueChange={setSelectedBauFilter}>
              <SelectTrigger className="w-44 text-xs h-9">
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

          {/* BOTÃO LANÇAR AJUSTE AUDITADO (OCULTO SE NÃO TIVER PERMISSÃO) */}
          {canAdjust && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => openAdjustModalFor()}
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 cursor-pointer shadow-sm"
              >
                <Sliders className="w-4 h-4" />
                Lançar Ajuste Auditado
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MATRIZ DE SALDOS POR PRODUTO E BAÚ */}
      <Card className="surface-card border-border/80 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
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
              {filteredProducts.length} itens catalogados
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
                {/* COLUNA AÇÃO OCULTA SE NÃO TIVER PERMISSÃO DE AJUSTAR */}
                {canAdjust && <TableHead className="text-xs text-right">Ação</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={activeBaus.length + (canAdjust ? 3 : 2)} className="text-center py-12 text-muted-foreground text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Carregando matriz de saldos...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeBaus.length + (canAdjust ? 3 : 2)} className="text-center py-12 text-muted-foreground text-xs">
                    Nenhum item localizado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => {
                  const bausToRender = selectedBauFilter === "all" ? activeBaus : activeBaus.filter((b) => b.id === selectedBauFilter);

                  return (
                    <TableRow key={p.id} className="border-border/40 hover:bg-secondary/20 transition-colors">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          {p.imagem_url ? (
                            <img
                              src={p.imagem_url}
                              alt={p.nome}
                              className="w-7 h-7 rounded-lg object-cover border border-border/60 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-base">📦</span>
                          )}
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

                      {/* COLUNA AÇÃO (OCULTA SE NÃO TIVER PERMISSÃO) */}
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

      {/* MODAL DE AJUSTE AUDITADO DE ESTOQUE (SOMENTE SE canAdjust) */}
      {canAdjust && (
        <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border/80">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                Lançar Ajuste Auditado de Estoque
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ajuste físico ou correção de contagem gravada permanentemente com motivo auditado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Produto *</Label>
                  <Select value={targetProductId} onValueChange={setTargetProductId}>
                    <SelectTrigger className="text-xs">
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
                    <SelectTrigger className="text-xs">
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

              {/* TIPO DE AJUSTE (DEFINIR SALDO OCULTO SE NÃO TIVER canManageBalance) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo de Ajuste *</Label>
                <div className={cn("grid gap-2", canManageBalance ? "grid-cols-3" : "grid-cols-2")}>
                  {canManageBalance && (
                    <Button
                      type="button"
                      variant={adjustmentType === "definir" ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8 gap-1.5 font-bold cursor-pointer"
                      onClick={() => setAdjustmentType("definir")}
                    >
                      <Equal className="w-3.5 h-3.5" />
                      Definir Saldo
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant={adjustmentType === "entrada" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8 gap-1.5 font-bold cursor-pointer"
                    onClick={() => setAdjustmentType("entrada")}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    Creditar (+)
                  </Button>

                  <Button
                    type="button"
                    variant={adjustmentType === "saida" ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8 gap-1.5 font-bold cursor-pointer"
                    onClick={() => setAdjustmentType("saida")}
                  >
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    Debitar (-)
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      {adjustmentType === "definir" ? "Novo Saldo Exato" : "Quantidade a Ajustar"} *
                    </Label>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="text-xs font-mono h-9"
                  />

                  {/* ATALHOS RÁPIDOS DE QUANTIDADE */}
                  <div className="flex items-center gap-1 pt-1">
                    {[1, 5, 10, 50, 100].map((step) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => setQuantity((prev) => (adjustmentType === "definir" ? step : prev + step))}
                        className="text-[10px] font-mono font-bold bg-secondary/80 hover:bg-secondary border border-border/70 rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
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

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Esta ação grava imediatamente um registro de auditoria permanente com a tag <strong>[Ajuste Gestão]</strong> e recalcula o saldo geral do grupo.
                </span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setIsAdjustModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 cursor-pointer shadow-sm"
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
