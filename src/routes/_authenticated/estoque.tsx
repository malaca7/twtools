import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  Box,
  Search,
  History,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Boxes,
  Tags,
  Plus,
  Edit2,
  Trash2,
  XCircle,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader, NoAccess, EmptyState, ProductThumbnail } from "@/components/ui-kit";
import { MovementDialog } from "@/components/operations/MovementDialog";
import { BauManagerModal } from "@/components/operations/BauManagerModal";
import { useAuth } from "@/hooks/useAuth";
import { useCategories, useProducts, useBaus, useMovements } from "@/hooks/useData";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/app-api";
import { currency, num, formatCurrencyInput, parseCurrencyInput, errorMessage } from "@/lib/format";
import { Product, Category } from "@/lib/app-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/estoque")({
  component: EstoquePage,
});

function EstoquePage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canView = hasPermission("view_stock");
  const canManageProducts = hasPermission("manage_products");
  const canManageBaus = hasPermission("manage_baus");
  const canManageCategories = hasPermission("manage_categories");

  if (!canView) return <NoAccess />;

  // Main Filters
  const [term, setTerm] = useState("");
  const [selectedBauId, setSelectedBauId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<string>("all");
  const [hideZero, setHideZero] = useState(false);

  // Queries
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: categories = [], isLoading: loadingCategories } = useCategories();
  const { data: baus = [], isLoading: loadingBaus } = useBaus();
  const { data: movements = [] } = useMovements();

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodCategory, setProdCategory] = useState("");
  const [prodUnidade, setProdUnidade] = useState("un");
  const [prodEstoqueMin, setProdEstoqueMin] = useState("0");
  const [prodPreco, setProdPreco] = useState("0");
  const [prodImagemUrl, setProdImagemUrl] = useState("");
  const [prodAtivo, setProdAtivo] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadProductImage(file);
      setProdImagemUrl(url);
      toast.success("Imagem enviada e vinculada ao produto!");
    } catch (err: any) {
      toast.error(errorMessage(err));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Category Manager Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catAtivo, setCatAtivo] = useState(true);

  // Deleting State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Helper to compute stock of a product in a specific chest (or all chests if bauId === "all")
  const getProductStock = (productId: string, bauId: string) => {
    const prod = products.find((p) => p.id === productId);
    const globalStock = prod ? Number(prod.estoque_atual || 0) : 0;
    if (bauId === "all" || baus.length <= 1) return Math.max(0, globalStock);
    if (globalStock <= 0) return 0;

    const defaultBauId = baus[0]?.id;
    const relevantMovements = movements.filter((m) => {
      if (m.product_id !== productId) return false;
      const mBauId = m.bau_id || defaultBauId;
      return mBauId === bauId;
    });

    if (relevantMovements.length === 0) return 0;

    const sum = relevantMovements.reduce(
      (acc, m) => acc + (m.type === "entrada" ? Number(m.quantity) : -Number(m.quantity)),
      0
    );

    return Math.max(0, sum);
  };

  // Compute products list with their stock
  const productsWithStock = products.map((p) => {
    const stock = getProductStock(p.id, selectedBauId);
    return {
      ...p,
      stock,
    };
  });

  // Filter products
  const filteredProducts = productsWithStock.filter((p) => {
    if (!p.ativo) return false;
    const matchesTerm = p.nome.toLowerCase().includes(term.trim().toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(term.trim().toLowerCase()));
    const matchesCat = selectedCategory === "all" || p.categoria_id === selectedCategory;
    const matchesHideZero = !hideZero || p.stock > 0;

    let matchesStatus = true;
    if (stockStatusFilter === "in_stock") matchesStatus = p.stock > 0;
    else if (stockStatusFilter === "low_stock") matchesStatus = p.stock > 0 && p.stock <= p.estoque_minimo;
    else if (stockStatusFilter === "zero_stock") matchesStatus = p.stock === 0;

    return matchesTerm && matchesCat && matchesHideZero && matchesStatus;
  });

  // Global metrics
  const activeProducts = products.filter((p) => p.ativo);
  const activeCategories = categories.filter((c) => c.ativo);
  const activeBaus = baus.filter((b) => b.ativo);

  const totalChestItemsCount = productsWithStock.reduce((acc, p) => acc + p.stock, 0);
  const totalChestValue = productsWithStock.reduce(
    (acc, p) => acc + p.stock * Number(p.preco_sugerido || 0),
    0
  );
  const itemsWithStockCount = productsWithStock.filter((p) => p.stock > 0).length;

  // Open Product Modal helper
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProdName(product.nome);
      setProdDesc(product.descricao || "");
      setProdCategory(product.categoria_id || "");
      setProdUnidade(product.unidade || "un");
      setProdEstoqueMin(String(product.estoque_minimo || 0));
      setProdPreco(formatCurrencyInput(product.preco_sugerido || 0));
      setProdImagemUrl(product.imagem_url || "");
      setProdAtivo(product.ativo);
    } else {
      setEditingProduct(null);
      setProdName("");
      setProdDesc("");
      setProdCategory(categories[0]?.id || "");
      setProdUnidade("un");
      setProdEstoqueMin("0");
      setProdPreco("");
      setProdImagemUrl("");
      setProdAtivo(true);
    }
    setProductModalOpen(true);
  };

  // Open Category Modal helper
  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCatName(category.nome);
      setCatDesc(category.descricao || "");
      setCatAtivo(category.ativo);
    } else {
      setEditingCategory(null);
      setCatName("");
      setCatDesc("");
      setCatAtivo(true);
    }
  };

  // Save Product Mutation
  const productMutation = useMutation({
    mutationFn: async () => {
      if (!canManageProducts) throw new Error("Sem permissão para gerenciar produtos.");
      if (!prodName.trim()) throw new Error("O nome do produto é obrigatório.");

      const precoSugerido = parseCurrencyInput(prodPreco);
      const estoqueMinimo = Number(prodEstoqueMin) || 0;

      const prodPayload: any = {
        nome: prodName.trim(),
        unidade: prodUnidade.trim() || "un",
        estoque_minimo: estoqueMinimo,
        preco_sugerido: precoSugerido,
        imagem_url: prodImagemUrl.trim() || null,
      };
      if (prodDesc.trim()) prodPayload.descricao = prodDesc.trim();
      if (prodCategory) prodPayload.categoria_id = prodCategory;

      if (editingProduct) {
        await updateProduct({
          id: editingProduct.id,
          ...prodPayload,
          ativo: prodAtivo,
        });
      } else {
        await createProduct(prodPayload);
      }
    },
    onSuccess: () => {
      toast.success(editingProduct ? "Produto atualizado com sucesso!" : "Novo produto cadastrado!");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductModalOpen(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canManageProducts) throw new Error("Sem permissão para excluir produtos.");
      await deleteProduct(id);
    },
    onSuccess: () => {
      toast.success("Produto excluído com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      setDeletingProduct(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // Save Category Mutation
  const categoryMutation = useMutation({
    mutationFn: async () => {
      if (!canManageCategories && !canManageProducts) throw new Error("Sem permissão para gerenciar categorias.");
      if (!catName.trim()) throw new Error("O nome da categoria é obrigatório.");

      const catPayload: any = {
        nome: catName.trim(),
      };
      if (catDesc.trim()) catPayload.descricao = catDesc.trim();

      if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          ...catPayload,
          ativo: catAtivo,
        });
      } else {
        await createCategory(catPayload);
      }
    },
    onSuccess: () => {
      toast.success(editingCategory ? "Categoria atualizada!" : "Categoria cadastrada!");
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingCategory(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!canManageCategories && !canManageProducts) throw new Error("Sem permissão para excluir categorias.");
      await deleteCategory(id);
    },
    onSuccess: () => {
      toast.success("Categoria excluída com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeletingCategory(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* CABEÇALHO UNIFICADO */}
      <PageHeader
        title="Controle de Estoque"
        description="Painel unificado de gestão de saldos por baú, cadastros de produtos, categorias e baús do grupo."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/movimentacoes">
              <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl font-bold">
                <History className="mr-1.5 h-4 w-4" /> Movimentações
              </Button>
            </Link>

            {canManageBaus ? <BauManagerModal /> : null}

            {(canManageProducts) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryModalOpen(true)}
                  className="h-9 text-xs rounded-xl font-bold"
                >
                  <Tags className="mr-1.5 h-4 w-4 text-sky-400" /> Categorias
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleOpenProductModal()}
                  className="h-9 text-xs bg-gradient-brand text-primary-foreground hover:opacity-90 font-bold rounded-xl shadow-md"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Novo Produto
                </Button>
              </>
            )}

            {hasPermission("create_movement") ? (
              <>
                <MovementDialog
                  defaultType="entrada"
                  trigger={
                    <Button variant="outline" size="sm" className="h-9 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-xl">
                      <ArrowDownCircle className="mr-1.5 h-4 w-4" /> Entrada
                    </Button>
                  }
                />
                <MovementDialog
                  defaultType="saida"
                  trigger={
                    <Button
                      size="sm"
                      className="h-9 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl"
                    >
                      <ArrowUpCircle className="mr-1.5 h-4 w-4" /> Saída
                    </Button>
                  }
                />
              </>
            ) : null}
          </div>
        }
      />

      {/* PAINEL DE MÉTRICAS GERAIS DE ESTOQUE */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="surface-card border-emerald-500/30 bg-emerald-500/5 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Valor em Estoque
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              {currency(totalChestValue)}
            </div>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">
              {num(totalChestItemsCount)} itens acumulados
            </p>
          </CardContent>
        </Card>

        <Card className="surface-card border-primary/20 bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Produtos Cadastrados
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-extrabold text-foreground">{activeProducts.length}</div>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">
              {itemsWithStockCount} produtos com saldo positivo
            </p>
          </CardContent>
        </Card>

        <Card className="surface-card border-sky-500/20 bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Baús de Armazenagem
            </CardTitle>
            <Boxes className="h-4 w-4 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-extrabold text-foreground">{activeBaus.length}</div>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">
              Locais operacionais vinculados ao grupo
            </p>
          </CardContent>
        </Card>

        <Card className="surface-card border-amber-500/20 bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Categorias
            </CardTitle>
            <Tags className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-extrabold text-foreground">{activeCategories.length}</div>
            <p className="text-[0.65rem] text-muted-foreground mt-0.5">
              Agrupadores ativos no catálogo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SELETOR DE BAÚS OPERACIONAIS */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Filtrar Saldo por Baú:
        </p>
        <div className="flex overflow-x-auto pb-2 scrollbar-none flex-nowrap sm:flex-wrap gap-2">
          <Button
            type="button"
            variant={selectedBauId === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedBauId("all")}
            className={cn(
              "h-9 px-3.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0",
              selectedBauId === "all"
                ? "bg-primary text-primary-foreground shadow-primary/20"
                : "border-border/80 bg-card/40 hover:bg-secondary"
            )}
          >
            <Boxes className="h-4 w-4" />
            <span>Todos os Baús (Estoque Geral)</span>
          </Button>

          {baus.map((b) => {
            const isSelected = selectedBauId === b.id;
            const chestItemsCount = products.filter(
              (p) => getProductStock(p.id, b.id) > 0
            ).length;

            return (
              <Button
                key={b.id}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBauId(b.id)}
                className={cn(
                  "h-9 px-3.5 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0",
                  isSelected
                    ? "bg-emerald-600 text-white shadow-emerald-950/20"
                    : "border-border/80 bg-card/40 hover:bg-secondary"
                )}
              >
                <Box className="h-4 w-4" />
                <span>{b.nome}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 rounded-md font-mono",
                    isSelected ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {chestItemsCount} itens
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>

      {/* QUADRO DE PRODUTOS E ESTOQUE */}
      <Card className="surface-card border-border/80 shadow-lg">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar produto por nome ou descrição..."
                className="pl-8 h-9 text-xs rounded-xl bg-secondary/40 border-border/60"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px] h-9 text-xs rounded-xl bg-secondary/40 border-border/60">
                  <SelectValue placeholder="Categoria" />
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

              <Select value={stockStatusFilter} onValueChange={setStockStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl bg-secondary/40 border-border/60">
                  <SelectValue placeholder="Status Saldo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="in_stock">Com Saldo</SelectItem>
                  <SelectItem value="low_stock">Estoque Baixo</SelectItem>
                  <SelectItem value="zero_stock">Zerados</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2 bg-secondary/40 px-3 py-1.5 rounded-xl border border-border/60">
                <Switch
                  id="hide-zero"
                  checked={hideZero}
                  onCheckedChange={setHideZero}
                />
                <Label htmlFor="hide-zero" className="text-xs font-semibold cursor-pointer whitespace-nowrap">
                  Ocultar Zerados
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<Package className="h-10 w-10 text-muted-foreground" />}
                title="Nenhum produto encontrado"
                description="Nenhum item atende aos filtros selecionados."
              />
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (md:hidden — Sem rolagem lateral no smartphone) */}
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:hidden">
                {filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoria_id);
                  const stock = p.stock;
                  const isZero = stock === 0;
                  const isLow = stock > 0 && stock <= p.estoque_minimo;

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "p-3.5 rounded-xl border bg-card text-card-foreground shadow-sm space-y-3",
                        isZero ? "opacity-70 bg-muted/20 border-border" : "border-border/80"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ProductThumbnail src={p.imagem_url} name={p.nome} size="sm" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-foreground truncate">{p.nome}</h4>
                            {cat && (
                              <Badge variant="outline" className="text-[10px] mt-0.5">
                                {cat.nome}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg shrink-0",
                            isZero
                              ? "border-border text-muted-foreground bg-secondary/30"
                              : isLow
                              ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                              : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                          )}
                        >
                          {num(stock)} {p.unidade}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                        <span className="text-muted-foreground">Preço Sugerido:</span>
                        <span className="font-mono font-bold text-emerald-400">{currency(p.preco_sugerido)}</span>
                      </div>

                      {(canManageProducts) && (
                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/40">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-semibold px-2 rounded-lg"
                            onClick={() => handleOpenProductModal(p)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-rose-400 border-rose-500/40 px-2 rounded-lg"
                            onClick={() => setDeletingProduct(p)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Excluir
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (hidden md:block) */}
              <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden shadow-inner">
                <Table>
                  <TableHeader className="bg-secondary/40">
                    <TableRow>
                      <TableHead className="text-xs font-bold">Produto</TableHead>
                      <TableHead className="text-xs font-bold">Categoria</TableHead>
                      <TableHead className="text-xs font-bold text-right">Preço Sugerido</TableHead>
                      <TableHead className="text-xs font-bold text-center">
                        {selectedBauId === "all" ? "Saldo Total" : "Saldo no Baú"}
                      </TableHead>
                      <TableHead className="text-xs font-bold text-center">Status</TableHead>
                      {(canManageProducts) && (
                        <TableHead className="text-xs font-bold text-right">Ações</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((p) => {
                      const cat = categories.find((c) => c.id === p.categoria_id);
                      const stock = p.stock;
                      const isZero = stock === 0;
                      const isLow = stock > 0 && stock <= p.estoque_minimo;

                      return (
                        <TableRow
                          key={p.id}
                          className={cn(
                            "transition-colors hover:bg-secondary/30",
                            isZero ? "opacity-60 bg-muted/10" : ""
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <ProductThumbnail src={p.imagem_url} name={p.nome} size="sm" />
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-foreground leading-snug truncate">{p.nome}</p>
                                {p.descricao && (
                                  <p className="text-[0.65rem] text-muted-foreground truncate max-w-xs">{p.descricao}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {cat ? (
                              <Badge variant="outline" className="text-[10px] font-semibold">
                                {cat.nome}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right font-mono text-xs font-semibold text-emerald-400">
                            {currency(p.preco_sugerido)}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono font-bold text-xs px-3 py-1 rounded-lg",
                                isZero
                                  ? "border-border text-muted-foreground bg-secondary/30"
                                  : isLow
                                  ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                                  : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                              )}
                            >
                              {num(stock)} {p.unidade}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center">
                            {isZero ? (
                              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                                Sem Estoque
                              </Badge>
                            ) : isLow ? (
                              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/10">
                                <AlertTriangle className="h-3 w-3 mr-1 inline" /> Estoque Baixo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                                <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Em Estoque
                              </Badge>
                            )}
                          </TableCell>

                             {(canManageProducts) && (
                            <TableCell className="text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleOpenProductModal(p)}
                                  title="Editar Produto"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10"
                                  onClick={() => setDeletingProduct(p)}
                                  title="Excluir Produto"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* MODAL DE CRIAR / EDITAR PRODUTO */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {editingProduct ? "Editar Cadastro de Produto" : "Novo Produto no Catálogo"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados cadastrais e o preço sugerido do produto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Nome do Produto</Label>
              <Input
                placeholder="Ex: AK-47, Lockpick, Algema..."
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Categoria</Label>
                <Select value={prodCategory} onValueChange={setProdCategory}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Selecione..." />
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
                <Label className="text-xs font-bold">Unidade de Medida</Label>
                <Input
                  placeholder="Ex: un, cx, kg..."
                  value={prodUnidade}
                  onChange={(e) => setProdUnidade(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Estoque Mínimo (Alerta)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={prodEstoqueMin}
                  onChange={(e) => setProdEstoqueMin(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Preço Sugerido (R$)</Label>
                <Input
                  placeholder="R$ 0,00"
                  value={prodPreco}
                  onChange={(e) => setProdPreco(formatCurrencyInput(parseCurrencyInput(e.target.value)))}
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Descrição (Opcional)</Label>
              <Textarea
                placeholder="Detalhes ou observações do produto..."
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                className="text-xs rounded-xl resize-none h-16"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" /> Imagem / Ícone do Produto
                </Label>
                <div className="flex items-center gap-1 bg-secondary/50 p-0.5 rounded-lg border border-border/60">
                  <button
                    type="button"
                    onClick={() => setImageMode("upload")}
                    className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1",
                      imageMode === "upload"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Upload className="h-2.5 w-2.5" /> Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode("url")}
                    className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1",
                      imageMode === "url"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LinkIcon className="h-2.5 w-2.5" /> Link URL
                  </button>
                </div>
              </div>

              {/* INPUT CONTAINER DEPENDING ON MODE */}
              {imageMode === "upload" ? (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    onChange={handleImageFileUpload}
                    className="hidden"
                    id="prod-image-file-upload"
                  />
                  <label
                    htmlFor="prod-image-file-upload"
                    className={cn(
                      "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center gap-1.5",
                      uploadingImage
                        ? "border-primary/50 bg-primary/5 cursor-wait"
                        : "border-border/80 bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50"
                    )}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span className="text-xs font-semibold text-foreground">Enviando imagem para o armazenamento...</span>
                        <span className="text-[10px] text-muted-foreground">Por favor, aguarde</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-primary/80" />
                        <span className="text-xs font-bold text-foreground">
                          Clique para selecionar do computador / celular
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          PNG, JPG, WEBP, GIF ou SVG (máx. 5MB)
                        </span>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    placeholder="https://exemplo.com/imagem.png (Discord, Imgur, etc.)"
                    value={prodImagemUrl}
                    onChange={(e) => setProdImagemUrl(e.target.value)}
                    className="h-9 text-xs rounded-xl font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Insira o link direto de uma imagem para exibir o ícone em todo o sistema.
                  </p>
                </div>
              )}

              {/* LIVE PREVIEW BADGE */}
              {prodImagemUrl && (
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ProductThumbnail src={prodImagemUrl} name={prodName} size="md" className="rounded-xl border shadow-sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">Miniatura vinculada</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-xs font-mono">{prodImagemUrl}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setProdImagemUrl("")}
                    className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 rounded-lg shrink-0"
                    title="Remover miniatura"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Remover
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <Label className="text-xs font-bold">Produto Ativo no Catálogo</Label>
              <Switch checked={prodAtivo} onCheckedChange={setProdAtivo} />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProductModalOpen(false)}
              className="h-9 text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => productMutation.mutate()}
              disabled={productMutation.isPending}
              className="h-9 text-xs bg-gradient-brand text-primary-foreground font-bold rounded-xl"
            >
              {productMutation.isPending ? "Salvando..." : editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE GERENCIAMENTO DE CATEGORIAS */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-sky-400" />
              Gerenciamento de Categorias de Produtos
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre, edite e organize os agrupadores dos itens do estoque.
            </DialogDescription>
          </DialogHeader>

          {/* FORMULARIO DE CATEGORIA */}
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/60 space-y-3">
            <h5 className="text-xs font-bold text-foreground">
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="Nome da categoria..."
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="h-8 text-xs rounded-lg bg-background"
              />
              <Input
                placeholder="Descrição (opcional)..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="h-8 text-xs rounded-lg bg-background"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Switch id="cat-ativo" checked={catAtivo} onCheckedChange={setCatAtivo} />
                <Label htmlFor="cat-ativo" className="text-xs font-semibold cursor-pointer">
                  Categoria Ativa
                </Label>
              </div>

              <div className="flex items-center gap-1.5">
                {editingCategory ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setEditingCategory(null);
                      setCatName("");
                      setCatDesc("");
                      setCatAtivo(true);
                    }}
                  >
                    Cancelar
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  onClick={() => categoryMutation.mutate()}
                  disabled={categoryMutation.isPending}
                  className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg"
                >
                  {categoryMutation.isPending ? "Salvando..." : editingCategory ? "Atualizar" : "Criar Categoria"}
                </Button>
              </div>
            </div>
          </div>

          {/* LISTA DE CATEGORIAS */}
          <div className="max-h-60 overflow-y-auto space-y-2 border border-border/60 rounded-xl p-2 bg-background/50">
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhuma categoria cadastrada.</p>
            ) : (
              categories.map((c) => {
                const linkedCount = products.filter((p) => p.categoria_id === c.id).length;

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-card hover:bg-secondary/30 transition-all text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{c.nome}</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">
                          {linkedCount} produtos
                        </Badge>
                      </div>
                      {c.descricao && <p className="text-[0.65rem] text-muted-foreground">{c.descricao}</p>}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleOpenCategoryModal(c)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10"
                        onClick={() => setDeletingCategory(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAR EXCLUSÃO DE PRODUTO */}
      <Dialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Excluir Produto
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir <strong>{deletingProduct?.nome}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deletingProduct && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/60 my-2">
              <ProductThumbnail src={deletingProduct.imagem_url} name={deletingProduct.nome} size="md" className="rounded-xl border" />
              <div className="min-w-0">
                <p className="font-bold text-xs text-foreground truncate">{deletingProduct.nome}</p>
                <p className="text-[0.65rem] text-muted-foreground font-mono">
                  Saldo atual: {num(deletingProduct.estoque_atual)} {deletingProduct.unidade}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletingProduct(null)} className="h-9 text-xs rounded-xl">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deletingProduct && deleteProductMutation.mutate(deletingProduct.id)}
              disabled={deleteProductMutation.isPending}
              className="h-9 text-xs font-bold rounded-xl"
            >
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAR EXCLUSÃO DE CATEGORIA */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Excluir Categoria
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir a categoria <strong>{deletingCategory?.nome}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeletingCategory(null)} className="h-9 text-xs rounded-xl">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deletingCategory && deleteCategoryMutation.mutate(deletingCategory.id)}
              disabled={deleteCategoryMutation.isPending}
              className="h-9 text-xs font-bold rounded-xl"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
