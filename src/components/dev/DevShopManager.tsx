import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  Package,
  Sparkles,
  Coins,
  History,
  CheckCircle2,
  RotateCcw,
  Search,
  Filter,
  Eye,
  EyeOff,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Shield,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { renderInsigniaIcon } from "@/components/gamification/MemberGamificationCard";
import {
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  getAllShopPurchases,
  updateShopPurchaseStatus,
  devRefundShopPurchase,
  getInsigniasCatalog,
  RARITY_CONFIG,
  type ShopItem,
  type ShopPurchase,
  type InsigniaRarity,
} from "@/services/gamificationService";
import { cn } from "@/lib/utils";

const SHOP_CATEGORIES = [
  { id: "todas", label: "Todas as Categorias" },
  { id: "insignias", label: "Insígnias Oficiais" },
  { id: "vantagens", label: "Vantagens & Cargos" },
  { id: "recursos", label: "Recursos & Suprimentos" },
  { id: "veiculos", label: "Veículos & Garagem" },
  { id: "personalizacao", label: "Personalização VIP" },
  { id: "geral", label: "Geral" },
];

export function DevShopManager() {
  const queryClient = useQueryClient();
  const { hasPermission, isDevUser } = useAuth();

  const [activeTab, setActiveTab] = useState<string>("catalog");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Estados dos Modais
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ShopItem | null>(null);
  const [purchaseToRefund, setPurchaseToRefund] = useState<ShopPurchase | null>(null);
  const [refundReason, setRefundReason] = useState("");

  // Permissões
  const canCreate = isDevUser || hasPermission("create_dev_shop_item");
  const canEdit = isDevUser || hasPermission("edit_dev_shop_item");
  const canDelete = isDevUser || hasPermission("delete_dev_shop_item");
  const canManageOrders = isDevUser || hasPermission("manage_dev_shop_orders");
  const canDeliver = isDevUser || hasPermission("deliver_dev_shop_order");
  const canRefund = isDevUser || hasPermission("refund_dev_shop_order");

  // Queries
  const { data: shopItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ["shop_items"],
    queryFn: () => getShopItems(false), // traz todos inclusive inativos
  });

  const { data: insigniasCatalog = [] } = useQuery({
    queryKey: ["insignias_catalog"],
    queryFn: () => getInsigniasCatalog(),
  });

  const { data: allPurchases = [], isLoading: isLoadingPurchases } = useQuery({
    queryKey: ["all_shop_purchases"],
    queryFn: () => getAllShopPurchases(),
    enabled: canManageOrders,
  });

  // Métricas
  const metrics = useMemo(() => {
    const totalItems = shopItems.length;
    const activeItems = shopItems.filter((i) => i.active).length;
    const totalPurchases = allPurchases.length;
    const totalCoinsSpent = allPurchases
      .filter((p) => p.status !== "estornado")
      .reduce((sum, p) => sum + p.price_coins_paid, 0);

    return { totalItems, activeItems, totalPurchases, totalCoinsSpent };
  }, [shopItems, allPurchases]);

  // Itens filtrados
  const filteredItems = useMemo(() => {
    return shopItems.filter((item) => {
      const matchCat = selectedCategory === "todas" || item.category === selectedCategory;
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.active) ||
        (statusFilter === "inactive" && !item.active);

      return matchCat && matchSearch && matchStatus;
    });
  }, [shopItems, selectedCategory, searchQuery, statusFilter]);

  // Mutations
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await updateShopItem(id, { active });
    },
    onSuccess: () => {
      toast.success("Status do item atualizado!");
      void queryClient.invalidateQueries({ queryKey: ["shop_items"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao alterar status do item.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteShopItem(id);
    },
    onSuccess: () => {
      toast.success("Item removido do catálogo com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["shop_items"] });
      setItemToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao remover item.");
    },
  });

  const deliverMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      await updateShopPurchaseStatus(purchaseId, "entregue");
    },
    onSuccess: () => {
      toast.success("Pedido marcado como entregue com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["all_shop_purchases"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao atualizar pedido.");
    },
  });

  const refundMutation = useMutation({
    mutationFn: async ({ purchaseId, reason }: { purchaseId: string; reason: string }) => {
      return devRefundShopPurchase(purchaseId, reason);
    },
    onSuccess: (data) => {
      toast.success(data.message || "Compra estornada e moedas devolvidas!");
      void queryClient.invalidateQueries({ queryKey: ["all_shop_purchases"] });
      void queryClient.invalidateQueries({ queryKey: ["shop_items"] });
      void queryClient.invalidateQueries({ queryKey: ["tw_coins_transactions"] });
      setPurchaseToRefund(null);
      setRefundReason("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao estornar compra.");
    },
  });

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Gestão da Loja Oficial Twin Wheels
              </h1>
              <p className="text-xs text-muted-foreground">
                Painel administrativo de catálogo, itens, precificação em TW Coins, estoque e entregas
              </p>
            </div>
          </div>
        </div>

        {canCreate && (
          <Button
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Item na Loja</span>
          </Button>
        )}
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Itens Ativos</span>
            <Package className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-1">
            {metrics.activeItems}{" "}
            <span className="text-xs text-muted-foreground font-normal">/ {metrics.totalItems}</span>
          </p>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Total de Pedidos</span>
            <History className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground mt-1">{metrics.totalPurchases}</p>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Arrecadação TW Coins</span>
            <Coins className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1">
            {metrics.totalCoinsSpent.toLocaleString("pt-BR")}
          </p>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Categorias</span>
            <Layers className="h-4 w-4 text-violet-400" />
          </div>
          <p className="text-2xl font-black text-foreground mt-1">6</p>
        </Card>
      </div>

      {/* ABAS: CATÁLOGO vs HISTÓRICO DE COMPRAS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-secondary/40 border border-border/60 p-1 rounded-2xl h-11">
          <TabsTrigger value="catalog" className="gap-2 rounded-xl text-xs font-bold">
            <Package className="h-4 w-4" />
            <span>Catálogo de Produtos ({shopItems.length})</span>
          </TabsTrigger>
          {canManageOrders && (
            <TabsTrigger value="orders" className="gap-2 rounded-xl text-xs font-bold">
              <History className="h-4 w-4" />
              <span>Histórico de Pedidos & Entregas ({allPurchases.length})</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ==================================================== */}
        {/* ABA 1: CATÁLOGO DE PRODUTOS */}
        {/* ==================================================== */}
        <TabsContent value="catalog" className="space-y-4">
          {/* BARRA DE FILTROS */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-xs w-[170px] rounded-xl bg-background/50 border-border/60 font-medium">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {SHOP_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs w-[130px] rounded-xl bg-background/50 border-border/60 font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos</SelectItem>
                  <SelectItem value="active" className="text-xs">Apenas Ativos</SelectItem>
                  <SelectItem value="inactive" className="text-xs">Apenas Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* GRID DE ITENS */}
          {isLoadingItems ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <p className="text-xs text-muted-foreground font-mono">Carregando catálogo da loja...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <Card className="surface-card p-12 text-center border-dashed border-border/60 rounded-3xl">
              <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-foreground">Nenhum item encontrado</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Altere os filtros de pesquisa ou cadastre um novo produto.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.comum;

                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "surface-card border-2 p-5 rounded-3xl flex flex-col justify-between transition-all duration-200 relative overflow-hidden group",
                      item.active ? rarity.borderClass : "border-border/40 opacity-70 bg-card/40"
                    )}
                  >
                    <div className="space-y-4">
                      {/* TOPO COM ÍCONE E BADGES */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-12 w-12 rounded-2xl border-2 shadow-md flex items-center justify-center shrink-0",
                              rarity.bgClass,
                              rarity.borderClass,
                              rarity.textClass
                            )}
                          >
                            {renderInsigniaIcon(item.icon, "h-6 w-6")}
                          </div>
                          <div>
                            <span
                              className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border inline-block mb-1",
                                rarity.bgClass,
                                rarity.borderClass,
                                rarity.textClass
                              )}
                            >
                              {rarity.label}
                            </span>
                            <h4 className="font-bold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">
                              {item.title}
                            </h4>
                          </div>
                        </div>

                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={item.active}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: item.id, active: checked })
                              }
                              className="scale-75 cursor-pointer data-[state=checked]:bg-emerald-500"
                              title={item.active ? "Desativar Item" : "Ativar Item"}
                            />
                          </div>
                        )}
                      </div>

                      {/* DESCRIÇÃO */}
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* DETALHES DE PREÇO E ESTOQUE */}
                      <div className="p-3 rounded-2xl bg-secondary/40 border border-border/50 space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-[11px]">Preço Coins:</span>
                          <span className="font-bold text-amber-300 flex items-center gap-1">
                            <Coins className="h-3 w-3 text-amber-400" />
                            {item.price_coins.toLocaleString("pt-BR")} Coins
                          </span>
                        </div>

                        {item.price_xp > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-[11px]">Preço XP:</span>
                            <span className="font-bold text-violet-300">
                              {item.price_xp.toLocaleString("pt-BR")} XP
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-border/40 pt-1.5">
                          <span className="text-muted-foreground text-[11px]">Estoque:</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold py-0",
                              item.stock === null
                                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                : item.stock > 0
                                ? "text-blue-400 border-blue-500/30"
                                : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                            )}
                          >
                            {item.stock === null
                              ? "Ilimitado"
                              : item.stock > 0
                              ? `${item.stock} disponíveis`
                              : "Esgotado"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                          <span>Categoria:</span>
                          <span className="capitalize font-sans font-bold text-foreground">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RODAPÉ COM AÇÕES */}
                    <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Ordem: {item.display_order}
                      </span>

                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(item);
                              setIsItemModalOpen(true);
                            }}
                            className="h-8 px-2.5 text-xs text-primary hover:bg-primary/10 rounded-xl gap-1 cursor-pointer font-bold"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Editar</span>
                          </Button>
                        )}

                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setItemToDelete(item)}
                            className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                            title="Excluir Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ==================================================== */}
        {/* ABA 2: HISTÓRICO DE COMPRAS E ENTREGAS */}
        {/* ==================================================== */}
        {canManageOrders && (
          <TabsContent value="orders" className="space-y-4">
            <Card className="surface-card border-border/60 rounded-3xl overflow-hidden">
              <CardHeader className="p-5 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <History className="h-5 w-5 text-emerald-400" />
                      <span>Extrato de Pedidos Realizados</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Gerencie as compras dos membros, confirme entregas operacionais ou realize estornos
                    </CardDescription>
                  </div>

                  <Badge variant="outline" className="font-mono text-xs font-bold px-3 py-1">
                    {allPurchases.length} compras registradas
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoadingPurchases ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    <p className="text-xs text-muted-foreground font-mono">Carregando pedidos...</p>
                  </div>
                ) : allPurchases.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-xs">
                    Nenhuma compra realizada ainda na loja.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/50 bg-secondary/20 text-muted-foreground font-mono">
                          <th className="p-3.5 pl-5">Data</th>
                          <th className="p-3.5">Membro</th>
                          <th className="p-3.5">Item Adquirido</th>
                          <th className="p-3.5">Categoria</th>
                          <th className="p-3.5">Valor Pago</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 pr-5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {allPurchases.map((purchase) => {
                          const isRefunded = purchase.status === "estornado";
                          const isPending = purchase.status === "pendente_entrega";

                          return (
                            <tr
                              key={purchase.id}
                              className={cn(
                                "hover:bg-secondary/20 transition-colors",
                                isRefunded && "opacity-60 bg-rose-500/[0.02]"
                              )}
                            >
                              <td className="p-3.5 pl-5 font-mono text-muted-foreground whitespace-nowrap">
                                {new Date(purchase.created_at).toLocaleString("pt-BR")}
                              </td>

                              <td className="p-3.5 font-bold text-foreground whitespace-nowrap">
                                {purchase.buyer_name || "Membro"}
                              </td>

                              <td className="p-3.5 font-medium text-foreground whitespace-nowrap">
                                {purchase.item_title}
                              </td>

                              <td className="p-3.5 capitalize font-mono text-muted-foreground">
                                {purchase.category}
                              </td>

                              <td className="p-3.5 font-bold font-mono text-amber-300 whitespace-nowrap">
                                <span className="flex items-center gap-1">
                                  <Coins className="h-3 w-3 text-amber-400" />
                                  {purchase.price_coins_paid.toLocaleString("pt-BR")}
                                </span>
                              </td>

                              <td className="p-3.5">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] font-bold py-0.5",
                                    purchase.status === "concluido"
                                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                      : purchase.status === "entregue"
                                      ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                                      : purchase.status === "pendente_entrega"
                                      ? "text-amber-300 border-amber-500/30 bg-amber-500/15 animate-pulse"
                                      : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                                  )}
                                >
                                  {purchase.status === "concluido"
                                    ? "Concluído"
                                    : purchase.status === "entregue"
                                    ? "Entregue"
                                    : purchase.status === "pendente_entrega"
                                    ? "Pendente Entrega"
                                    : "Estornado"}
                                </Badge>
                              </td>

                              <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {canDeliver && isPending && (
                                    <Button
                                      size="sm"
                                      onClick={() => deliverMutation.mutate(purchase.id)}
                                      disabled={deliverMutation.isPending}
                                      className="h-7 px-2.5 text-[11px] font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-lg gap-1 cursor-pointer"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>Entregar</span>
                                    </Button>
                                  )}

                                  {canRefund && !isRefunded && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setPurchaseToRefund(purchase);
                                        setRefundReason("Estorno solicitado pela liderança");
                                      }}
                                      className="h-7 px-2.5 text-[11px] font-bold border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-lg gap-1 cursor-pointer"
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                      <span>Estornar</span>
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
        )}
      </Tabs>

      {/* ==================================================== */}
      {/* MODAL: CRIAR OU EDITAR PRODUTO NA LOJA */}
      {/* ==================================================== */}
      <ItemFormDialog
        open={isItemModalOpen}
        onOpenChange={setIsItemModalOpen}
        editingItem={editingItem}
        insigniasCatalog={insigniasCatalog}
      />

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AlertDialog open={Boolean(itemToDelete)} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent className="surface-card border-border/80">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Excluir produto da loja?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Tem certeza que deseja excluir o item{" "}
              <strong className="text-foreground">"{itemToDelete?.title}"</strong> do catálogo?
              Esta ação removerá o produto imediatamente da vitrine dos membros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
              disabled={deleteMutation.isPending}
              className="text-xs bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGO DE ESTORNO DE COMPRA */}
      <Dialog open={Boolean(purchaseToRefund)} onOpenChange={() => setPurchaseToRefund(null)}>
        <DialogContent className="max-w-md surface-card border-border/80">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-rose-400" />
              <span>Estornar Compra e Devolver Moedas</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              O comprador receberá de volta as {purchaseToRefund?.price_coins_paid} TW Coins
              automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 rounded-xl bg-secondary/40 border border-border/60 space-y-1 font-mono">
              <p>
                <span className="text-muted-foreground">Item:</span>{" "}
                <span className="font-bold text-foreground">{purchaseToRefund?.item_title}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Reembolso:</span>{" "}
                <span className="font-bold text-amber-300">
                  +{purchaseToRefund?.price_coins_paid} TW Coins
                </span>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="refund-reason" className="text-xs font-semibold">
                Motivo do Estorno (Auditado):
              </Label>
              <Input
                id="refund-reason"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Ex: Cancelamento a pedido do comprador ou falha no item"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPurchaseToRefund(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() =>
                purchaseToRefund &&
                refundMutation.mutate({
                  purchaseId: purchaseToRefund.id,
                  reason: refundReason,
                })
              }
              disabled={refundMutation.isPending || !refundReason.trim()}
              className="text-xs bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold cursor-pointer"
            >
              {refundMutation.isPending ? "Processando..." : "Confirmar Estorno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTE: FORMULÁRIO DE ITEM DA LOJA
// ==========================================
function ItemFormDialog({
  open,
  onOpenChange,
  editingItem,
  insigniasCatalog,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: ShopItem | null;
  insigniasCatalog: any[];
}) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("vantagens");
  const [icon, setIcon] = useState("Gift");
  const [rarity, setRarity] = useState<InsigniaRarity>("comum");
  const [priceCoins, setPriceCoins] = useState("50");
  const [priceXp, setPriceXp] = useState("0");
  const [hasLimitedStock, setHasLimitedStock] = useState(false);
  const [stock, setStock] = useState("10");
  const [insigniaId, setInsigniaId] = useState<string>("none");
  const [active, setActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState("0");

  React.useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description || "");
      setCategory(editingItem.category);
      setIcon(editingItem.icon || "Gift");
      setRarity(editingItem.rarity || "comum");
      setPriceCoins(String(editingItem.price_coins || 0));
      setPriceXp(String(editingItem.price_xp || 0));
      setHasLimitedStock(editingItem.stock !== null);
      setStock(editingItem.stock !== null ? String(editingItem.stock) : "10");
      setInsigniaId(editingItem.insignia_id || "none");
      setActive(editingItem.active);
      setDisplayOrder(String(editingItem.display_order || 0));
    } else {
      setTitle("");
      setDescription("");
      setCategory("vantagens");
      setIcon("Gift");
      setRarity("comum");
      setPriceCoins("50");
      setPriceXp("0");
      setHasLimitedStock(false);
      setStock("10");
      setInsigniaId("none");
      setActive(true);
      setDisplayOrder("0");
    }
  }, [editingItem, open]);

  // Se selecionar uma insígnia oficial, preencher automaticamente dados sugeridos
  const handleInsigniaSelect = (id: string) => {
    setInsigniaId(id);
    if (id !== "none") {
      const ins = insigniasCatalog.find((i) => i.id === id);
      if (ins) {
        setTitle(ins.name);
        setDescription(ins.description || "");
        setIcon(ins.icon || "Award");
        setCategory("insignias");
        setRarity(ins.rarity || "comum");
        setPriceCoins(String(ins.xp_cost || 50));
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedCoins = Math.max(0, parseInt(priceCoins || "0", 10) || 0);
      const parsedXp = Math.max(0, parseInt(priceXp || "0", 10) || 0);
      const parsedStock = hasLimitedStock ? Math.max(0, parseInt(stock || "0", 10) || 0) : null;
      const parsedOrder = parseInt(displayOrder || "0", 10) || 0;
      const linkedInsignia = insigniaId === "none" ? null : insigniaId;

      if (!title.trim()) {
        throw new Error("O título do item é obrigatório.");
      }

      if (editingItem) {
        await updateShopItem(editingItem.id, {
          title: title.trim(),
          description: description.trim() || null,
          category,
          icon,
          rarity,
          price_coins: parsedCoins,
          price_xp: parsedXp,
          stock: parsedStock,
          insignia_id: linkedInsignia,
          active,
          display_order: parsedOrder,
        });
      } else {
        await createShopItem({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          icon,
          rarity,
          price_coins: parsedCoins,
          price_xp: parsedXp,
          stock: parsedStock,
          insignia_id: linkedInsignia,
          active,
          display_order: parsedOrder,
        });
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? "Item atualizado com sucesso!" : "Item criado com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["shop_items"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao salvar produto.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl surface-card border-border/80 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            <span>{editingItem ? "Editar Item da Loja" : "Cadastrar Novo Item na Loja"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure os parâmetros de venda, precificação em moedas e vinculação de condecorações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* SELEÇÃO OPCIONAL DE VÍNCULO COM INSÍGNIA */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
            <Label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Award className="h-4 w-4" />
              <span>Vincular a uma Insígnia Oficial existente?</span>
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Se vinculado, ao comprar este item o membro receberá a insígnia correspondente em seu perfil.
            </p>
            <Select value={insigniaId} onValueChange={handleInsigniaSelect}>
              <SelectTrigger className="h-9 text-xs rounded-xl bg-background/80 border-amber-500/30">
                <SelectValue placeholder="Selecione uma insígnia (ou nenhuma)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">
                  Nenhuma (Item comum / Vantagem / Recurso)
                </SelectItem>
                {insigniasCatalog.map((ins) => (
                  <SelectItem key={ins.id} value={ins.id} className="text-xs">
                    ★ {ins.name} ({ins.rarity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TÍTULO E CATEGORIA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Título do Item *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Tag VIP Discord ou Kit Assalto"
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Categoria *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insignias" className="text-xs">Insígnias</SelectItem>
                  <SelectItem value="vantagens" className="text-xs">Vantagens & Cargos</SelectItem>
                  <SelectItem value="recursos" className="text-xs">Recursos & Baú</SelectItem>
                  <SelectItem value="veiculos" className="text-xs">Veículos & Mecânica</SelectItem>
                  <SelectItem value="personalizacao" className="text-xs">Personalização VIP</SelectItem>
                  <SelectItem value="geral" className="text-xs">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Descrição Comercial</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o que o membro ganha ao adquirir este item..."
              rows={3}
              className="text-xs rounded-xl resize-none"
            />
          </div>

          {/* ÍCONE, RARIDADE E ORDEM */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ícone Lucide</Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Ex: Gift, Crown, Award, Boxes"
                className="text-xs rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Raridade Visual</Label>
              <Select value={rarity} onValueChange={(v: any) => setRarity(v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comum" className="text-xs">Comum</SelectItem>
                  <SelectItem value="raro" className="text-xs">Raro</SelectItem>
                  <SelectItem value="epico" className="text-xs">Épico</SelectItem>
                  <SelectItem value="lendario" className="text-xs">Lendário</SelectItem>
                  <SelectItem value="mitico" className="text-xs">Mítico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ordem na Vitrine</Label>
              <Input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          {/* PRECIFICAÇÃO: COINS & XP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-secondary/30 border border-border/60">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-400" />
                <span>Preço em TW Coins *</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={priceCoins}
                onChange={(e) => setPriceCoins(e.target.value)}
                className="text-xs rounded-xl font-mono font-bold text-amber-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>Preço Opcional em XP</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={priceXp}
                onChange={(e) => setPriceXp(e.target.value)}
                placeholder="0 = apenas coins"
                className="text-xs rounded-xl font-mono font-bold text-violet-300"
              />
            </div>
          </div>

          {/* CONTROLE DE ESTOQUE */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-secondary/30 border border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground text-xs">Limitar Estoque Disponível?</p>
                <p className="text-[11px] text-muted-foreground">
                  Se desativado, o item terá estoque ilimitado para compra contínua.
                </p>
              </div>
              <Switch
                checked={hasLimitedStock}
                onCheckedChange={setHasLimitedStock}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            {hasLimitedStock && (
              <div className="pt-2 border-t border-border/40 flex items-center gap-3">
                <Label className="text-xs whitespace-nowrap">Quantidade em Estoque:</Label>
                <Input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="text-xs rounded-xl font-mono max-w-[120px]"
                />
              </div>
            )}
          </div>

          {/* STATUS ATIVO */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/20 border border-border/50">
            <div>
              <p className="font-bold text-foreground text-xs">Item Visível na Loja</p>
              <p className="text-[11px] text-muted-foreground">
                Se inativo, o produto ficará oculto para os membros até ser reativado.
              </p>
            </div>
            <Switch
              checked={active}
              onCheckedChange={setActive}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !title.trim()}
            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl font-bold cursor-pointer"
          >
            {saveMutation.isPending ? "Salvando..." : editingItem ? "Salvar Alterações" : "Criar Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
