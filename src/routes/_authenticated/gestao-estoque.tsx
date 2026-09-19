import { useState, useMemo, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
  component: GestaoEstoquePage,
});

export type GestaoEstoqueTab = "produtos" | "categorias" | "baus" | "saldos";
export const VALID_GESTAO_ESTOQUE_TABS = ["produtos", "categorias", "baus", "saldos"] as const;

export function GestaoEstoquePage() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useUrlTab<GestaoEstoqueTab>("produtos", {
    paramName: "aba",
    allowedTabs: VALID_GESTAO_ESTOQUE_TABS,
  });

  const canAccess = hasPermission("view_stock_management");

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Acesso Restrito</h2>
          <p className="text-xs text-muted-foreground">
            Você não possui a permissão <strong>view_stock_management</strong> necessária para acessar a Gestão de Estoque. Solicite a um oficial ou administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Gestão de Estoque
                <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-[10px] font-bold">
                  Operações & Catálogo
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                Cadastros, categorias, parametrização de baús do grupo e ajustes auditados de inventário.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ABAS PRINCIPAIS */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as GestaoEstoqueTab)} className="space-y-6">
        <TabsList className="bg-secondary/40 border border-border/50 p-1 rounded-xl grid grid-cols-2 md:grid-cols-4 w-full md:w-auto h-auto gap-1">
          <TabsTrigger value="produtos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2 gap-2">
            <Boxes className="w-3.5 h-3.5" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="categorias" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2 gap-2">
            <FolderTree className="w-3.5 h-3.5" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="baus" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2 gap-2">
            <Layers className="w-3.5 h-3.5" />
            Baús do grupo
          </TabsTrigger>
          <TabsTrigger value="saldos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold text-xs py-2 gap-2">
            <Sliders className="w-3.5 h-3.5" />
            Ajuste & Saldo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="space-y-6 m-0">
          <ProdutosTabContent />
        </TabsContent>

        <TabsContent value="categorias" className="space-y-6 m-0">
          <CategoriasTabContent />
        </TabsContent>

        <TabsContent value="baus" className="space-y-6 m-0">
          <BausTabContent />
        </TabsContent>

        <TabsContent value="saldos" className="space-y-6 m-0">
          <SaldosTabContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// ABA 1: PRODUTOS (CRIAR / EDITAR / APAGAR / GERENCIAR)
// ============================================================================
function ProdutosTabContent() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: baus = [] } = useBaus();

  const canManage = hasPermission("manage_stock_products");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

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

  // Delete State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const openCreateModal = () => {
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
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.nome.toLowerCase().includes(q);
        const matchesDesc = p.descricao?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, statusFilter]);

  // Estatísticas rápidas
  const totalAtivos = products.filter((p) => p.ativo).length;
  const totalBaixoEstoque = products.filter((p) => p.ativo && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0)).length;
  const valorTotalEstoque = products.reduce((acc, p) => acc + (Number(p.estoque_atual || 0) * Number(p.preco_sugerido || 0)), 0);

  return (
    <div className="space-y-6">
      {/* STATS RÁPIDOS */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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

        <Card className="surface-card border-border/70 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Estoque Crítico</span>
          <div className="flex items-center justify-between">
            <span className={cn("text-2xl font-black", totalBaixoEstoque > 0 ? "text-amber-400" : "text-emerald-400")}>
              {totalBaixoEstoque}
            </span>
            <AlertTriangle className={cn("w-5 h-5 opacity-60", totalBaixoEstoque > 0 ? "text-amber-400" : "text-emerald-400")} />
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
                  placeholder="Pesquisar produto pelo nome ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
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
            </div>

            {canManage && (
              <Button size="sm" onClick={openCreateModal} className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 shrink-0">
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
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Carregando catálogo de produtos...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                    Nenhum produto localizado com os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoria_id);
                  const b = baus.find((item) => item.id === p.bau_id);
                  const isLow = p.ativo && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 0);

                  return (
                    <TableRow key={p.id} className="border-border/40 hover:bg-secondary/20">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          {p.imagem_url ? (
                            <img src={p.imagem_url} alt={p.nome} className="w-8 h-8 rounded object-cover border border-border/60 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-secondary/60 border border-border/60 flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                              📦
                            </div>
                          )}
                          <div className="min-w-0">
                            <strong className="text-xs text-foreground font-bold block truncate">{p.nome}</strong>
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
                        {b ? `${b.icone || "📦"} ${b.nome}` : "—"}
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
                      <TableCell className="text-xs py-2.5 text-right">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditModal(p)}
                              title="Editar Produto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
                              onClick={() => setDeletingProduct(p)}
                              title="Excluir Produto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Somente Leitura</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* MODAL CRIAR / EDITAR PRODUTO */}
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
                  <span>Nome do Item (log CDA)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Alias Discord</span>
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
                          <BauIcon icone={b.icone} className="w-3.5 h-3.5 text-primary" />
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

            <div className="space-y-1.5">
              <Label className="text-xs">URL da Imagem / Ícone (Opcional)</Label>
              <Input
                placeholder="https://exemplo.com/icone.png"
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border/40">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Status do Produto</Label>
                <p className="text-[10px] text-muted-foreground">Produtos ativos aparecem no painel e nos formulários de movimentação</p>
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
              className="bg-primary hover:bg-primary/90 font-bold gap-1.5"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMAÇÃO DE EXCLUSÃO */}
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
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5"
              disabled={deleteMutation.isPending}
              onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
            >
              {deleteMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// ABA 2: CATEGORIAS (CRIAR / EDITAR / APAGAR / GERENCIAR)
// ============================================================================
function CategoriasTabContent() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const { data: categories = [], isLoading } = useCategories();
  const { data: products = [] } = useProducts();

  const canManage = hasPermission("manage_stock_categories");

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
    setEditingCategory(null);
    setNome("");
    setDescricao("");
    setAtivo(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
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

          {canManage && (
            <Button size="sm" onClick={openCreateModal} className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 shrink-0">
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
              <Card key={c.id} className="surface-card border-border/70 flex flex-col justify-between hover:border-primary/40 transition-all">
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

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditModal(c)}
                        title="Editar Categoria"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-400"
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
              <Label className="text-xs">Nome da Categoria *</Label>
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
                <Label className="text-xs font-semibold">Categoria Ativa</Label>
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
              className="bg-primary hover:bg-primary/90 font-bold gap-1.5"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EXCLUSÃO DE CATEGORIA */}
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
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5"
              disabled={deleteMutation.isPending}
              onClick={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
            >
              {deleteMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// ABA 3: BAÚS DO GRUPO (CRIAR / EDITAR / APAGAR / GERENCIAR)
// ============================================================================
function BausTabContent() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const { data: baus = [], isLoading } = useBaus();
  const { data: productBaus = [] } = useProductBaus();
  const { data: config } = useDiscordStockConfig();

  const canManage = hasPermission("manage_stock_baus");

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
    try {
      const url = await uploadBauImage(file);
      setFotoUrl(url);
      toast.success("Foto do baú enviada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da imagem.");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openCreateModal = () => {
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

        // Sincroniza com o config.bau_channels
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

          {canManage && (
            <Button size="sm" onClick={openCreateModal} className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9 shrink-0">
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
                  "surface-card border transition-all flex flex-col justify-between",
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
                    <strong className="text-foreground">{chestItemsCount} tipos de item</strong>
                  </div>
                </CardContent>

                <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-end gap-1">
                  {canManage && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditModal(b)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-semibold gap-1 text-muted-foreground hover:text-rose-400"
                        onClick={() => setDeletingBau(b)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL CRIAR / EDITAR BAÚ */}
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
            <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-card/40">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Foto de Perfil do Baú (Opcional)</span>
                {fotoUrl && (
                  <button
                    type="button"
                    onClick={() => setFotoUrl("")}
                    className="text-[10px] text-destructive hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Remover foto
                  </button>
                )}
              </Label>

              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-xl border-2 border-dashed border-border/80 flex items-center justify-center overflow-hidden bg-secondary/50 shrink-0 shadow-inner">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt="Preview do Baú"
                      className="w-full h-full object-cover"
                    />
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
                      className="h-8 text-xs font-bold gap-1.5 border-border/80"
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
                <Label className="text-xs">Nome do Baú *</Label>
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
                <Label className="text-xs font-semibold">Baú Ativo</Label>
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
              className="bg-primary hover:bg-primary/90 font-bold gap-1.5"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {editingBau ? "Salvar Alterações" : "Cadastrar Baú"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EXCLUSÃO DE BAÚ */}
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
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5"
              disabled={deleteMutation.isPending}
              onClick={() => deletingBau && deleteMutation.mutate(deletingBau)}
            >
              {deleteMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// ABA 4: AJUSTE & SALDO DE ESTOQUE (MATRIZ, AJUSTES AUDITADOS, REDEFINIR)
// ============================================================================
function SaldosTabContent() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const { data: products = [] } = useProducts();
  const { data: baus = [] } = useBaus();
  const { data: productBaus = [], isLoading } = useProductBaus();

  const canAdjust = hasPermission("adjust_stock_balance");
  const canManageBalance = hasPermission("manage_stock_balance");

  const [search, setSearch] = useState("");
  const [selectedBauFilter, setSelectedBauFilter] = useState("all");

  // Modal de Ajuste
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [targetProductId, setTargetProductId] = useState("");
  const [targetBauId, setTargetBauId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"definir" | "entrada" | "saida">("definir");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState("");

  const openAdjustModalFor = (productId?: string, bauId?: string) => {
    setTargetProductId(productId || products[0]?.id || "");
    setTargetBauId(bauId || baus[0]?.id || "");
    setAdjustmentType("definir");
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
        if (!p.nome.toLowerCase().includes(q)) return false;
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
                placeholder="Pesquisar saldo de item..."
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
                    {b.icone || "📦"} {b.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {canAdjust && (
              <Button
                size="sm"
                onClick={() => openAdjustModalFor()}
                className="bg-primary hover:bg-primary/90 font-bold gap-1.5 h-9"
              >
                <Sliders className="w-4 h-4" />
                Lançar Ajuste Auditado
              </Button>
            )}
          </div>
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
                      {b.icone || "📦"} {b.nome}
                    </TableHead>
                  ))
                ) : (
                  <TableHead className="text-xs text-center font-mono">
                    {activeBaus.find((b) => b.id === selectedBauFilter)?.nome}
                  </TableHead>
                )}
                <TableHead className="text-xs text-center font-mono font-bold">Total Geral</TableHead>
                <TableHead className="text-xs text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={activeBaus.length + 3} className="text-center py-12 text-muted-foreground text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Carregando matriz de saldos...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeBaus.length + 3} className="text-center py-12 text-muted-foreground text-xs">
                    Nenhum item localizado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => {
                  const bausToRender = selectedBauFilter === "all" ? activeBaus : activeBaus.filter((b) => b.id === selectedBauFilter);

                  return (
                    <TableRow key={p.id} className="border-border/40 hover:bg-secondary/20">
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📦</span>
                          <div>
                            <strong className="text-xs text-foreground font-bold block">{p.nome}</strong>
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
                                "px-2 py-0.5 rounded text-[11px] font-bold inline-block cursor-pointer hover:underline",
                                q > 0 ? "bg-secondary/60 text-foreground" : "text-muted-foreground opacity-50"
                              )}
                              onClick={() => canAdjust && openAdjustModalFor(p.id, b.id)}
                              title="Clique para ajustar este saldo"
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

                      <TableCell className="text-xs py-2.5 text-right">
                        {canAdjust && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2 border-border/60"
                            onClick={() => openAdjustModalFor(p.id)}
                          >
                            <Sliders className="w-3 h-3 text-primary" />
                            Ajustar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* MODAL DE AJUSTE AUDITADO DE ESTOQUE */}
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
                        {b.icone || "📦"} {b.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Ajuste *</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={adjustmentType === "definir" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 gap-1.5 font-bold"
                  onClick={() => setAdjustmentType("definir")}
                >
                  <Equal className="w-3.5 h-3.5" />
                  Definir Saldo
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === "entrada" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 gap-1.5 font-bold"
                  onClick={() => setAdjustmentType("entrada")}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  Creditar (+)
                </Button>
                <Button
                  type="button"
                  variant={adjustmentType === "saida" ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 gap-1.5 font-bold"
                  onClick={() => setAdjustmentType("saida")}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  Debitar (-)
                </Button>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
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
              </div>

              {/* CARD PREVIEW DO RESULTADO */}
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border/40 flex flex-col justify-center text-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Saldo Resultante</span>
                <div className="flex items-center justify-center gap-2 pt-0.5">
                  <span className="font-mono text-muted-foreground text-xs line-through">{currentSelectedBalance}</span>
                  <ArrowRight className="w-3 h-3 text-primary" />
                  <strong className="font-mono text-sm text-emerald-400 font-black">{calculatedResultingBalance}</strong>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo Auditado do Ajuste *</Label>
              <Textarea
                rows={3}
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
              className="bg-primary hover:bg-primary/90 font-bold gap-1.5"
              disabled={adjustMutation.isPending}
              onClick={() => adjustMutation.mutate()}
            >
              {adjustMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Confirmar e Gravar Ajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
