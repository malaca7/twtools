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
  Tag as TagIcon,
  Crown,
  Briefcase,
  Boxes,
  Truck,
  Wrench,
  Palette,
  Check,
  Info,
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
import { useMemberTags } from "@/hooks/useMemberTags";
import { MemberTagBadge } from "@/components/ui/MemberTagBadge";
import { InsigniaEmblem } from "@/components/gamification/InsigniaIcon";
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
  type ShopItemType,
  type InsigniaRarity,
} from "@/services/gamificationService";
import { cn } from "@/lib/utils";

const SHOP_CATEGORIES = [
  { id: "todas", label: "Todas as Categorias" },
  { id: "insignias", label: "Insígnias Oficiais" },
  { id: "tags", label: "Tags & Cargos" },
  { id: "servicos", label: "Serviços VIP" },
  { id: "recursos", label: "Recursos & Suprimentos" },
  { id: "veiculos", label: "Veículos & Garagem" },
  { id: "personalizacao", label: "Personalização" },
  { id: "vantagens", label: "Vantagens" },
  { id: "geral", label: "Geral" },
];

const ITEM_TYPES: {
  id: ShopItemType;
  label: string;
  desc: string;
  icon: React.ElementType;
  colorClass: string;
  badgeBg: string;
}[] = [
  {
    id: "insignia",
    label: "Insígnia Oficial (3D)",
    desc: "Emblema 3D realista com concessão automática imediata ao perfil do membro.",
    icon: Award,
    colorClass: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  {
    id: "tag",
    label: "Tag do Sistema / Cargo",
    desc: "Tag de membro vinculada automaticamente ao cargo e perfil do comprador.",
    icon: TagIcon,
    colorClass: "text-blue-400 border-blue-500/40 bg-blue-500/10",
    badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  },
  {
    id: "servico",
    label: "Serviço Personalizado / VIP",
    desc: "Serviço sob demanda (placas, pinturas, VIP) para entrega operacional pela liderança.",
    icon: Briefcase,
    colorClass: "text-purple-400 border-purple-500/40 bg-purple-500/10",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
  {
    id: "recurso",
    label: "Item / Recurso do RP",
    desc: "Itens físicos, armas, suprimentos ou veículos com entrega operacional no jogo.",
    icon: Boxes,
    colorClass: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
];

export function DevShopManager() {
  const queryClient = useQueryClient();
  const { hasPermission, isDevUser } = useAuth();

  const [activeTab, setActiveTab] = useState<string>("catalog");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>("all");

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
    queryFn: () => getShopItems(true), // inclui inativos para gestão
  });

  const { data: insigniasCatalog = [] } = useQuery({
    queryKey: ["insignias_catalog"],
    queryFn: () => getInsigniasCatalog(),
  });

  const { data: memberTags = [] } = useMemberTags();

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
    const pendingDeliveries = allPurchases.filter((p) => p.status === "pendente_entrega").length;
    const totalCoinsSpent = allPurchases
      .filter((p) => p.status !== "estornado")
      .reduce((sum, p) => sum + p.price_coins_paid, 0);

    const insigniasCount = shopItems.filter(
      (i) => i.item_type === "insignia" || Boolean(i.insignia_id)
    ).length;
    const tagsCount = shopItems.filter(
      (i) => i.item_type === "tag" || Boolean(i.tag_id)
    ).length;
    const customCount = shopItems.filter(
      (i) => !i.insignia_id && !i.tag_id
    ).length;

    return {
      totalItems,
      activeItems,
      totalPurchases,
      pendingDeliveries,
      totalCoinsSpent,
      insigniasCount,
      tagsCount,
      customCount,
    };
  }, [shopItems, allPurchases]);

  // Itens filtrados
  const filteredItems = useMemo(() => {
    return shopItems.filter((item) => {
      const matchCat =
        selectedCategory === "todas" ||
        item.category === selectedCategory ||
        (selectedCategory === "insignias" && (item.item_type === "insignia" || Boolean(item.insignia_id))) ||
        (selectedCategory === "tags" && (item.item_type === "tag" || Boolean(item.tag_id)));

      const matchType =
        selectedType === "all" ||
        item.item_type === selectedType ||
        (selectedType === "insignia" && Boolean(item.insignia_id)) ||
        (selectedType === "tag" && Boolean(item.tag_id));

      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.instructions && item.instructions.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.active) ||
        (statusFilter === "inactive" && !item.active);

      return matchCat && matchType && matchSearch && matchStatus;
    });
  }, [shopItems, selectedCategory, selectedType, searchQuery, statusFilter]);

  // Pedidos filtrados
  const filteredPurchases = useMemo(() => {
    return allPurchases.filter((purchase) => {
      if (ordersStatusFilter === "all") return true;
      return purchase.status === ordersStatusFilter;
    });
  }, [allPurchases, ordersStatusFilter]);

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
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span>Gestão da Loja Oficial Twin Wheels</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-bold py-0.5">
                  Catálogo & Recompensas
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crie e gerencie Insígnias 3D, Tags do Sistema, Itens RP e Serviços VIP personalizados com precificação em TW Coins
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
            className="h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer self-start sm:self-auto transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Produto à Loja</span>
          </Button>
        )}
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Pendentes Entrega</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1">
            {metrics.pendingDeliveries}
          </p>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Arrecadação TW</span>
            <Coins className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1">
            {metrics.totalCoinsSpent.toLocaleString("pt-BR")}
          </p>
        </Card>

        <Card className="surface-card border-border/60 p-4 rounded-2xl col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase">Composição</span>
            <Layers className="h-4 w-4 text-violet-400" />
          </div>
          <p className="text-xs font-mono text-muted-foreground mt-2 space-y-0.5">
            <span className="block text-amber-300 font-bold">{metrics.insigniasCount} Insígnias 3D</span>
            <span className="block text-blue-300 font-bold">{metrics.tagsCount} Tags</span>
            <span className="block text-foreground font-bold">{metrics.customCount} Itens & Serviços</span>
          </p>
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
            <TabsTrigger value="orders" className="gap-2 rounded-xl text-xs font-bold relative">
              <History className="h-4 w-4" />
              <span>Histórico de Pedidos & Entregas ({allPurchases.length})</span>
              {metrics.pendingDeliveries > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-black animate-pulse">
                  {metrics.pendingDeliveries}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ==================================================== */}
        {/* ABA 1: CATÁLOGO DE PRODUTOS */}
        {/* ==================================================== */}
        <TabsContent value="catalog" className="space-y-4">
          {/* BARRA DE FILTROS */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, descrição ou instruções..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro de Tipo */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-9 text-xs w-[160px] rounded-xl bg-background/50 border-border/60 font-medium">
                  <SelectValue placeholder="Tipo de Recompensa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos os Tipos</SelectItem>
                  <SelectItem value="insignia" className="text-xs">🏵️ Insígnias 3D</SelectItem>
                  <SelectItem value="tag" className="text-xs">🏷️ Tags do Sistema</SelectItem>
                  <SelectItem value="servico" className="text-xs">💼 Serviços VIP</SelectItem>
                  <SelectItem value="recurso" className="text-xs">📦 Itens do RP</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro de Categoria */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-xs w-[160px] rounded-xl bg-background/50 border-border/60 font-medium">
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

              {/* Filtro de Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs w-[120px] rounded-xl bg-background/50 border-border/60 font-medium">
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
                Altere os filtros de pesquisa ou cadastre um novo produto na loja.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.comum;
                const isLinkedInsignia = item.item_type === "insignia" || Boolean(item.insignia_id);
                const isLinkedTag = item.item_type === "tag" || Boolean(item.tag_id);
                const isService = item.item_type === "servico";
                const isRpItem = item.item_type === "recurso" || item.item_type === "veiculo";

                // Obter dados vinculados de insígnia ou tag
                const linkedInsigniaData = item.insignia || insigniasCatalog.find((i) => i.id === item.insignia_id);
                const linkedTagData = item.tag || memberTags.find((t) => t.id === item.tag_id);

                return (
                  <Card
                    key={item.id}
                    className={cn(
                      "surface-card border-2 p-5 rounded-3xl flex flex-col justify-between transition-all duration-200 relative overflow-hidden group hover:shadow-xl",
                      item.active ? rarity.borderClass : "border-border/40 opacity-70 bg-card/40"
                    )}
                  >
                    <div className="space-y-4">
                      {/* TOPO: BADGE DO TIPO DE PRODUTO E STATUS */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isLinkedInsignia && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] font-black uppercase tracking-wider py-0.5 gap-1">
                              <Award className="h-3 w-3" /> Insígnia 3D
                            </Badge>
                          )}
                          {isLinkedTag && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[9px] font-black uppercase tracking-wider py-0.5 gap-1">
                              <TagIcon className="h-3 w-3" /> Tag do Sistema
                            </Badge>
                          )}
                          {isService && (
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[9px] font-black uppercase tracking-wider py-0.5 gap-1">
                              <Briefcase className="h-3 w-3" /> Serviço VIP
                            </Badge>
                          )}
                          {isRpItem && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[9px] font-black uppercase tracking-wider py-0.5 gap-1">
                              <Boxes className="h-3 w-3" /> Item do RP
                            </Badge>
                          )}
                          <span
                            className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border inline-block",
                              rarity.bgClass,
                              rarity.borderClass,
                              rarity.textClass
                            )}
                          >
                            {rarity.label}
                          </span>
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

                      {/* APRESENTAÇÃO VISUAL: INSÍGNIA 3D / TAG / ÍCONE */}
                      <div className="flex items-center gap-3.5 pt-1">
                        {isLinkedInsignia ? (
                          <div className="shrink-0 group-hover:scale-105 transition-transform">
                            <InsigniaEmblem
                              icon={linkedInsigniaData?.icon || item.icon || "Award"}
                              name={linkedInsigniaData?.name || item.title}
                              rarity={linkedInsigniaData?.rarity || item.rarity}
                              shape_3d={linkedInsigniaData?.shape_3d}
                              material_3d={linkedInsigniaData?.material_3d}
                              border_style_3d={linkedInsigniaData?.border_style_3d}
                              gloss_effect={linkedInsigniaData?.gloss_effect}
                              color={linkedInsigniaData?.color}
                              bgColor={linkedInsigniaData?.bg_color}
                              borderColor={linkedInsigniaData?.border_color}
                              size="md"
                            />
                          </div>
                        ) : isLinkedTag && linkedTagData ? (
                          <div className="shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl bg-secondary/60 border border-border/80 group-hover:scale-105 transition-transform">
                            <MemberTagBadge tag={linkedTagData} size="md" />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "h-12 w-12 rounded-2xl border-2 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
                              rarity.bgClass,
                              rarity.borderClass,
                              rarity.textClass
                            )}
                            style={item.badge_color ? { borderColor: item.badge_color } : undefined}
                          >
                            {renderInsigniaIcon(item.icon, "h-6 w-6")}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider capitalize">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* DESCRIÇÃO E INSTRUÇÕES */}
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {item.instructions && (
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-[11px] text-purple-300 flex items-start gap-1.5">
                          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-400" />
                          <span className="line-clamp-2 leading-snug">
                            <strong>Instruções:</strong> {item.instructions}
                          </span>
                        </div>
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

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 font-sans">
                          <span>Modo de Entrega:</span>
                          <span className={cn("font-bold", isLinkedInsignia || isLinkedTag ? "text-emerald-400" : "text-amber-400")}>
                            {isLinkedInsignia || isLinkedTag ? "⚡ Automática Imediata" : "📦 Operacional Liderança"}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <History className="h-5 w-5 text-emerald-400" />
                      <span>Extrato de Pedidos & Entregas Operacionais</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Gerencie as compras dos membros, confirme entregas operacionais de itens/serviços ou realize estornos auditados
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={ordersStatusFilter} onValueChange={setOrdersStatusFilter}>
                      <SelectTrigger className="h-8 text-xs w-[170px] rounded-xl bg-background/50 border-border/60">
                        <SelectValue placeholder="Filtrar Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">Todos os Status</SelectItem>
                        <SelectItem value="pendente_entrega" className="text-xs">⏳ Pendente Entrega</SelectItem>
                        <SelectItem value="concluido" className="text-xs">⚡ Concluído (Auto)</SelectItem>
                        <SelectItem value="entregue" className="text-xs">✅ Entregue</SelectItem>
                        <SelectItem value="estornado" className="text-xs">↩️ Estornado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoadingPurchases ? (
                  <div className="py-20 flex flex-col items-center justify-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    <p className="text-xs text-muted-foreground font-mono">Carregando pedidos...</p>
                  </div>
                ) : filteredPurchases.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground text-xs">
                    Nenhum pedido encontrado com os filtros selecionados.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/50 bg-secondary/20 text-muted-foreground font-mono">
                          <th className="p-3.5 pl-5">Data</th>
                          <th className="p-3.5">Membro</th>
                          <th className="p-3.5">Item Adquirido</th>
                          <th className="p-3.5">Categoria / Tipo</th>
                          <th className="p-3.5">Valor Pago</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 pr-5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredPurchases.map((purchase) => {
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
                                    ? "Concluído (Automático)"
                                    : purchase.status === "entregue"
                                    ? "Entregue pela Liderança"
                                    : purchase.status === "pendente_entrega"
                                    ? "⏳ Pendente Entrega"
                                    : "↩️ Estornado"}
                                </Badge>
                              </td>

                              <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {canDeliver && isPending && (
                                    <Button
                                      size="sm"
                                      onClick={() => deliverMutation.mutate(purchase.id)}
                                      disabled={deliverMutation.isPending}
                                      className="h-7 px-2.5 text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg gap-1 cursor-pointer"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>Marcar Entregue</span>
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
        memberTags={memberTags}
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
  memberTags,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: ShopItem | null;
  insigniasCatalog: any[];
  memberTags: any[];
}) {
  const queryClient = useQueryClient();

  const [itemType, setItemType] = useState<ShopItemType>("insignia");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("insignias");
  const [icon, setIcon] = useState("Award");
  const [rarity, setRarity] = useState<InsigniaRarity>("comum");
  const [priceCoins, setPriceCoins] = useState("50");
  const [priceXp, setPriceXp] = useState("0");
  const [hasLimitedStock, setHasLimitedStock] = useState(false);
  const [stock, setStock] = useState("10");
  const [insigniaId, setInsigniaId] = useState<string>("none");
  const [tagId, setTagId] = useState<string>("none");
  const [badgeColor, setBadgeColor] = useState<string>("#3b82f6");
  const [instructions, setInstructions] = useState<string>("");
  const [active, setActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState("0");

  React.useEffect(() => {
    if (editingItem) {
      const type: ShopItemType =
        editingItem.item_type ||
        (editingItem.insignia_id ? "insignia" : editingItem.tag_id ? "tag" : "servico");
      setItemType(type);
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
      setTagId(editingItem.tag_id || "none");
      setBadgeColor(editingItem.badge_color || "#3b82f6");
      setInstructions(editingItem.instructions || "");
      setActive(editingItem.active);
      setDisplayOrder(String(editingItem.display_order || 0));
    } else {
      setItemType("insignia");
      setTitle("");
      setDescription("");
      setCategory("insignias");
      setIcon("Award");
      setRarity("comum");
      setPriceCoins("50");
      setPriceXp("0");
      setHasLimitedStock(false);
      setStock("10");
      setInsigniaId("none");
      setTagId("none");
      setBadgeColor("#3b82f6");
      setInstructions("");
      setActive(true);
      setDisplayOrder("0");
    }
  }, [editingItem, open]);

  // Se trocar de tipo de item, ajustar sugestões padrão
  const handleTypeChange = (newType: ShopItemType) => {
    setItemType(newType);
    if (newType === "insignia") {
      setCategory("insignias");
      setIcon("Award");
      setTagId("none");
    } else if (newType === "tag") {
      setCategory("tags");
      setIcon("Tag");
      setInsigniaId("none");
    } else if (newType === "servico") {
      setCategory("servicos");
      setIcon("Briefcase");
      setInsigniaId("none");
      setTagId("none");
    } else if (newType === "recurso") {
      setCategory("recursos");
      setIcon("Boxes");
      setInsigniaId("none");
      setTagId("none");
    }
  };

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

  // Se selecionar uma tag de membro, preencher automaticamente dados sugeridos
  const handleTagSelect = (id: string) => {
    setTagId(id);
    if (id !== "none") {
      const tag = memberTags.find((t) => t.id === id);
      if (tag) {
        setTitle(`Tag: ${tag.name}`);
        setDescription(tag.description || `Adquira a tag oficial de membro ${tag.name}`);
        setIcon(tag.icon || "Tag");
        setBadgeColor(tag.color || "#3b82f6");
        setCategory("tags");
        setRarity("raro");
      }
    }
  };

  // Obter objetos selecionados para live preview
  const selectedInsignia = useMemo(
    () => insigniasCatalog.find((i) => i.id === insigniaId),
    [insigniasCatalog, insigniaId]
  );
  const selectedTag = useMemo(
    () => memberTags.find((t) => t.id === tagId),
    [memberTags, tagId]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsedCoins = Math.max(0, parseInt(priceCoins || "0", 10) || 0);
      const parsedXp = Math.max(0, parseInt(priceXp || "0", 10) || 0);
      const parsedStock = hasLimitedStock ? Math.max(0, parseInt(stock || "0", 10) || 0) : null;
      const parsedOrder = parseInt(displayOrder || "0", 10) || 0;
      const linkedInsignia = itemType === "insignia" && insigniaId !== "none" ? insigniaId : null;
      const linkedTag = itemType === "tag" && tagId !== "none" ? tagId : null;

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
          item_type: itemType,
          insignia_id: linkedInsignia,
          tag_id: linkedTag,
          badge_color: badgeColor.trim() || null,
          instructions: instructions.trim() || null,
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
          item_type: itemType,
          insignia_id: linkedInsignia,
          tag_id: linkedTag,
          badge_color: badgeColor.trim() || undefined,
          instructions: instructions.trim() || undefined,
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
      <DialogContent className="max-w-2xl surface-card border-border/80 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            <span>{editingItem ? "Editar Item da Loja" : "Cadastrar Novo Produto na Loja"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Escolha o tipo de recompensa (Insígnia 3D, Tag, Serviço Personalizado ou Item RP) e defina preços e estoque.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* SELETOR DE TIPO DE PRODUTO / RECOMPENSA */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">
              Selecione o Tipo de Produto / Recompensa:
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ITEM_TYPES.map((type) => {
                const IconComp = type.icon;
                const isSelected = itemType === type.id;

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeChange(type.id)}
                    className={cn(
                      "p-3 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer relative",
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/10"
                        : "border-border/60 bg-secondary/30 hover:bg-secondary/60 opacity-80"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2 rounded-xl border", type.colorClass)}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2.5">
                      <span className="font-bold text-xs text-foreground block leading-tight">
                        {type.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==================================================== */}
          {/* SEÇÃO 1: INSÍGNIA OFICIAL 3D */}
          {/* ==================================================== */}
          {itemType === "insignia" && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in-50 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    <span>Vincular Insígnia do Catálogo Oficial</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Ao comprar este item, o membro receberá a insígnia 3D automaticamente em seu perfil.
                  </p>
                </div>
                {selectedInsignia && (
                  <div className="shrink-0">
                    <InsigniaEmblem
                      icon={selectedInsignia.icon}
                      name={selectedInsignia.name}
                      rarity={selectedInsignia.rarity}
                      shape_3d={selectedInsignia.shape_3d}
                      material_3d={selectedInsignia.material_3d}
                      border_style_3d={selectedInsignia.border_style_3d}
                      gloss_effect={selectedInsignia.gloss_effect}
                      color={selectedInsignia.color}
                      bgColor={selectedInsignia.bg_color}
                      borderColor={selectedInsignia.border_color}
                      size="lg"
                    />
                  </div>
                )}
              </div>

              <Select value={insigniaId} onValueChange={handleInsigniaSelect}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/80 border-amber-500/30 font-medium">
                  <SelectValue placeholder="Selecione uma insígnia oficial..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    -- Nenhuma (Preencher manualmente) --
                  </SelectItem>
                  {insigniasCatalog.map((ins) => (
                    <SelectItem key={ins.id} value={ins.id} className="text-xs">
                      ★ {ins.name} ({ins.rarity}) — {ins.xp_cost || 50} XP sugerido
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ==================================================== */}
          {/* SEÇÃO 2: TAG DO SISTEMA / CARGO */}
          {/* ==================================================== */}
          {itemType === "tag" && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3 animate-in fade-in-50 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <TagIcon className="h-4 w-4" />
                    <span>Vincular Tag de Membro do Sistema</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Ao comprar este item, a tag será atribuída instantaneamente ao membro e liberará suas regras de acesso.
                  </p>
                </div>
                {selectedTag && (
                  <div className="shrink-0 p-2 rounded-xl bg-secondary/80 border border-border/80">
                    <MemberTagBadge tag={selectedTag} size="md" />
                  </div>
                )}
              </div>

              <Select value={tagId} onValueChange={handleTagSelect}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background/80 border-blue-500/30 font-medium">
                  <SelectValue placeholder="Selecione uma tag do sistema..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    -- Nenhuma (Preencher manualmente) --
                  </SelectItem>
                  {memberTags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id} className="text-xs">
                      🏷️ {tag.name} {tag.is_system ? "(Sistema)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ==================================================== */}
          {/* SEÇÃO 3: SERVIÇO PERSONALIZADO OU ITEM RP */}
          {/* ==================================================== */}
          {(itemType === "servico" || itemType === "recurso") && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2 animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-2 text-purple-300 font-bold">
                <Briefcase className="h-4 w-4" />
                <span>Fluxo de Entrega Operacional pela Liderança</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ao ser comprado, o pedido ficará marcado como <strong>Pendente de Entrega</strong> no painel administrativo até que a liderança realize a entrega no RP e confirme o pedido.
              </p>
            </div>
          )}

          {/* TÍTULO E CATEGORIA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Título do Item / Produto *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Emblema Asfalto Lendário, Tag VIP, Kit Assalto..."
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Categoria na Loja *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insignias" className="text-xs">Insígnias</SelectItem>
                  <SelectItem value="tags" className="text-xs">Tags & Cargos</SelectItem>
                  <SelectItem value="servicos" className="text-xs">Serviços VIP</SelectItem>
                  <SelectItem value="recursos" className="text-xs">Recursos & Suprimentos</SelectItem>
                  <SelectItem value="veiculos" className="text-xs">Veículos & Garagem</SelectItem>
                  <SelectItem value="personalizacao" className="text-xs">Personalização</SelectItem>
                  <SelectItem value="vantagens" className="text-xs">Vantagens</SelectItem>
                  <SelectItem value="geral" className="text-xs">Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Descrição do Item</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o que o membro ganha ao adquirir este item..."
              rows={2}
              className="text-xs rounded-xl resize-none"
            />
          </div>

          {/* INSTRUÇÕES ESPECÍFICAS / OBSERVAÇÕES DE ENTREGA */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <span>Instruções de Entrega / Procedimento</span>
              <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span>
            </Label>
            <Input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex: Abrir ticket no Discord informando ID do jogo e placa desejada"
              className="text-xs rounded-xl"
            />
          </div>

          {/* ÍCONE, RARIDADE E COR DO BADGE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ícone Lucide</Label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Ex: Award, Crown, Tag, Gift, Boxes"
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
            {saveMutation.isPending ? "Salvando..." : editingItem ? "Salvar Alterações" : "Criar Produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
