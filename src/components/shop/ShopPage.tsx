import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ShoppingBag,
  Coins,
  Zap,
  Sparkles,
  Award,
  Crown,
  Boxes,
  Truck,
  Gift,
  Search,
  History,
  ArrowRightLeft,
  CheckCircle2,
  Lock,
  AlertCircle,
  Loader2,
  ChevronRight,
  Filter,
  Check,
  Package,
  Tag as TagIcon,
  Briefcase,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMyMemberTags, useMemberTagAssignments } from "@/hooks/useMemberTags";
import { MemberTagBadge } from "@/components/ui/MemberTagBadge";
import { InsigniaEmblem } from "@/components/gamification/InsigniaIcon";
import {
  getShopItems,
  getMemberCoins,
  exchangeXpForCoins,
  getCoinsExchangeConfig,
  buyShopItem,
  getMemberShopPurchases,
  getMemberInsignias,
  RARITY_CONFIG,
  type ShopItem,
  type ShopPurchase,
} from "@/services/gamificationService";
import { renderInsigniaIcon } from "@/components/gamification/MemberGamificationCard";
import { formatXp } from "@/lib/format";
import { cn } from "@/lib/utils";

const CATEGORY_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  todos: { label: "Todos os Itens", icon: ShoppingBag },
  insignias: { label: "Insígnias 3D", icon: Award },
  tags: { label: "Tags & Cargos", icon: TagIcon },
  servicos: { label: "Serviços VIP", icon: Briefcase },
  recursos: { label: "Recursos & Armas", icon: Boxes },
  veiculos: { label: "Veículos & Garagem", icon: Truck },
  personalizacao: { label: "Personalização", icon: Sparkles },
};

export function ShopPage() {
  const { user, profile, hasPermission, refresh } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || "";

  const canViewShop = hasPermission("view_shop");
  const canBuyItems = hasPermission("buy_shop_items");

  const [activeCategory, setActiveCategory] = useState("todos");
  const [search, setSearch] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("todos");

  // Modais
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [itemToBuy, setItemToBuy] = useState<ShopItem | null>(null);

  // Queries
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ["shop_items"],
    queryFn: () => getShopItems(false),
    enabled: canViewShop,
    staleTime: 30 * 1000,
  });

  const { data: memberCoins = 0, isLoading: isLoadingCoins } = useQuery({
    queryKey: ["member_coins", userId],
    queryFn: () => (userId ? getMemberCoins(userId) : Promise.resolve(0)),
    enabled: Boolean(userId),
    staleTime: 10 * 1000,
  });

  const { data: memberInsignias = [] } = useQuery({
    queryKey: ["member_insignias", userId],
    queryFn: () => (userId ? getMemberInsignias(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });

  const myTags = useMyMemberTags();
  const { data: allAssignments = [] } = useMemberTagAssignments();

  // IDs de insígnias e tags que o usuário possui
  const ownedInsigniaIds = useMemo(
    () => new Set(memberInsignias.map((m) => m.insignia_id)),
    [memberInsignias]
  );

  const ownedTagIds = useMemo(() => {
    const ids = new Set<string>(myTags.map((t) => t.id));
    // Complementar com assignments diretos por member_id ou user_id
    allAssignments.forEach((a) => {
      if (
        (a.member_id === userId ||
          a.member_id === profile?.id ||
          a.member_id === (profile as any)?.member_id) &&
        a.tag_id
      ) {
        ids.add(a.tag_id);
      }
    });
    return ids;
  }, [myTags, allAssignments, userId, profile]);

  const currentXp = Number(profile?.xp || 0);

  // Filtragem dos itens da loja
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory !== "todos") {
        if (activeCategory === "insignias" && item.category !== "insignias" && item.item_type !== "insignia" && !item.insignia_id) {
          return false;
        }
        if (activeCategory === "tags" && item.category !== "tags" && item.item_type !== "tag" && !item.tag_id) {
          return false;
        }
        if (
          activeCategory !== "insignias" &&
          activeCategory !== "tags" &&
          item.category !== activeCategory
        ) {
          return false;
        }
      }
      if (selectedRarity !== "todos" && item.rarity !== selectedRarity) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchInst = item.instructions?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchInst) return false;
      }
      return true;
    });
  }, [items, activeCategory, selectedRarity, search]);

  if (!canViewShop) {
    return <NoAccess message="Você não possui permissão para acessar a Loja Oficial da Facção." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* CABEÇALHO DA PÁGINA */}
      <PageHeader
        title="Loja Oficial Twin Wheels"
        description="Mercado exclusivo da facção — Converta seu XP acumulado em Moedas TW e adquira insígnias de honra 3D, tags de sistema, serviços personalizados e suprimentos operacionais."
        icon={ShoppingBag}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-secondary/60 h-9 cursor-pointer"
            >
              <History className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Minhas Compras</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsExchangeModalOpen(true)}
              className="text-xs font-bold gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black shadow-md shadow-amber-500/20 h-9 font-mono cursor-pointer transition-transform active:scale-95"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Trocar XP por Moedas</span>
            </Button>
          </div>
        }
      />

      {/* BANNER DE CARTEIRA DO MEMBRO (SALDO TW COINS & XP) */}
      <Card className="surface-card border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-5 pointer-events-none">
          <Coins className="h-64 w-64 text-amber-400" />
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <Coins className="h-7 w-7 text-amber-400 animate-pulse" />
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Sua Carteira Twin Wheels
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-2xl font-black text-foreground font-mono">
                    {memberCoins.toLocaleString("pt-BR")}{" "}
                    <span className="text-amber-400 text-lg">TW Coins</span>
                  </h3>
                  <span className="text-xs text-muted-foreground font-normal">
                    disponíveis para compras
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="p-3 rounded-2xl bg-secondary/60 border border-border/80 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Saldo de XP Atual
                  </span>
                  <span className="text-sm font-black font-mono text-foreground">
                    {formatXp(currentXp)} XP
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setIsExchangeModalOpen(true)}
                className="h-12 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs gap-2 shadow-md shadow-amber-500/20 cursor-pointer transition-transform active:scale-95"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>Converter XP</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BARRA DE CATEGORIAS & FILTROS */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* ABAS DE CATEGORIAS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {Object.entries(CATEGORY_MAP).map(([key, config]) => {
              const IconComp = config.icon;
              const isActive = activeCategory === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none",
                    isActive
                      ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                      : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/60"
                  )}
                >
                  <IconComp className="h-3.5 w-3.5" />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>

          {/* BUSCA DE ITENS */}
          <div className="relative w-full lg:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar item, insígnia, tag..."
              className="h-9 pl-9 text-xs bg-background/50 border-border/70 rounded-xl"
            />
          </div>
        </div>

        {/* LISTAGEM DOS ITENS EM CARDS DE ALTA FIDELIDADE */}
        {isLoadingItems ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-400" />
            <p className="text-xs text-muted-foreground font-mono">
              Carregando catálogo da Loja Twin Wheels...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="surface-card p-12 text-center border-dashed rounded-3xl space-y-3">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-secondary/80 flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Nenhum item localizado
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Não encontramos nenhum produto nesta categoria com os filtros atuais.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.comum;
              const isLinkedInsignia = item.item_type === "insignia" || Boolean(item.insignia_id);
              const isLinkedTag = item.item_type === "tag" || Boolean(item.tag_id);
              const isService = item.item_type === "servico";
              const isRpItem = item.item_type === "recurso" || item.item_type === "veiculo";

              const isAlreadyOwnedInsignia = item.insignia_id
                ? ownedInsigniaIds.has(item.insignia_id)
                : false;
              const isAlreadyOwnedTag = item.tag_id
                ? ownedTagIds.has(item.tag_id)
                : false;

              const isAlreadyOwned = isAlreadyOwnedInsignia || isAlreadyOwnedTag;
              const hasEnoughCoins = memberCoins >= item.price_coins;
              const isOutOfStock = item.stock !== null && item.stock <= 0;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "relative overflow-hidden rounded-3xl border-2 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between group bg-card/80 select-none",
                    rarity.borderClass
                  )}
                  style={{
                    boxShadow: "0 10px 25px -10px rgba(0,0,0,0.5)",
                  }}
                >
                  {/* Fundo sutil com gradiente da raridade */}
                  <div className={cn("absolute inset-0 opacity-15 pointer-events-none", rarity.bgClass)} />

                  <div className="space-y-4 relative z-10">
                    {/* TOPO: TIPO & RARIDADE & ESTOQUE */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {isLinkedInsignia && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] font-black uppercase py-0.2">
                            Insígnia 3D
                          </Badge>
                        )}
                        {isLinkedTag && (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[9px] font-black uppercase py-0.2">
                            Tag de Cargo
                          </Badge>
                        )}
                        {isService && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-[9px] font-black uppercase py-0.2">
                            Serviço VIP
                          </Badge>
                        )}
                        <span
                          className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-xs",
                            rarity.bgClass,
                            rarity.borderClass,
                            rarity.textClass
                          )}
                        >
                          ★ {rarity.label}
                        </span>
                      </div>

                      {item.stock !== null ? (
                        item.stock > 0 ? (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/50">
                            {item.stock} un
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold">
                            Esgotado
                          </Badge>
                        )
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Ilimitado
                        </span>
                      )}
                    </div>

                    {/* ÍCONE / EMBLEMA DE DESTAQUE */}
                    <div className="flex items-center gap-3.5">
                      {isLinkedInsignia ? (
                        <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                          <InsigniaEmblem
                            icon={item.insignia?.icon || item.icon || "Award"}
                            name={item.insignia?.name || item.title}
                            rarity={item.insignia?.rarity || item.rarity}
                            shape_3d={item.insignia?.shape_3d}
                            material_3d={item.insignia?.material_3d}
                            border_style_3d={item.insignia?.border_style_3d}
                            gloss_effect={item.insignia?.gloss_effect}
                            color={item.insignia?.color}
                            bgColor={item.insignia?.bg_color}
                            borderColor={item.insignia?.border_color}
                            size="md"
                          />
                        </div>
                      ) : isLinkedTag && item.tag ? (
                        <div className="shrink-0 p-2 rounded-2xl bg-secondary/80 border border-border/80 transition-transform duration-300 group-hover:scale-105">
                          <MemberTagBadge tag={item.tag} size="md" />
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "h-14 w-14 rounded-2xl border-2 shadow-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
                            rarity.bgClass,
                            rarity.borderClass,
                            rarity.textClass
                          )}
                          style={item.badge_color ? { borderColor: item.badge_color } : undefined}
                        >
                          {renderInsigniaIcon(item.icon, "h-7 w-7")}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-sm text-foreground group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider capitalize">
                          {CATEGORY_MAP[item.category]?.label || item.category}
                        </span>
                      </div>
                    </div>

                    {/* DESCRIÇÃO DO ITEM */}
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[32px]">
                      {item.description || "Item oficial da facção Twin Wheels disponível para aquisição."}
                    </p>

                    {item.instructions && (
                      <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 flex items-center gap-1.5">
                        <Info className="h-3 w-3 shrink-0 text-purple-400" />
                        <span className="truncate">{item.instructions}</span>
                      </div>
                    )}
                  </div>

                  {/* RODAPÉ DO CARD: PREÇO E BOTÃO DE COMPRA */}
                  <div className="pt-4 mt-4 border-t border-white/10 space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        Preço:
                      </span>
                      <div className="flex items-center gap-1.5 font-mono font-black text-foreground">
                        <Coins className="h-4 w-4 text-amber-400" />
                        <span className="text-base text-amber-400">
                          {item.price_coins.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          Coins
                        </span>
                      </div>
                    </div>

                    {isAlreadyOwnedInsignia ? (
                      <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Insígnia Já Conquistada</span>
                      </div>
                    ) : isAlreadyOwnedTag ? (
                      <div className="w-full py-2 px-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Tag Já Vinculada</span>
                      </div>
                    ) : isOutOfStock ? (
                      <Button disabled className="w-full rounded-xl text-xs font-bold opacity-60">
                        Item Esgotado
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setItemToBuy(item)}
                        disabled={!canBuyItems}
                        className={cn(
                          "w-full rounded-xl text-xs font-black gap-2 transition-all cursor-pointer h-10",
                          hasEnoughCoins
                            ? "bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 active:scale-95"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80 border border-border"
                        )}
                      >
                        {hasEnoughCoins ? (
                          <>
                            <ShoppingBag className="h-3.5 w-3.5" />
                            <span>Comprar Agora</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-3.5 w-3.5" />
                            <span>Faltam {(item.price_coins - memberCoins).toLocaleString("pt-BR")} Coins</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: CONVERTER XP EM TW COINS */}
      <ExchangeXpModal
        open={isExchangeModalOpen}
        onOpenChange={setIsExchangeModalOpen}
        currentXp={currentXp}
        currentCoins={memberCoins}
        userId={userId}
      />

      {/* MODAL 2: CONFIRMAÇÃO DE COMPRA DO ITEM */}
      {itemToBuy && (
        <BuyItemDialog
          item={itemToBuy}
          open={Boolean(itemToBuy)}
          onOpenChange={(op) => !op && setItemToBuy(null)}
          memberCoins={memberCoins}
          userId={userId}
          onExchangeClick={() => {
            setItemToBuy(null);
            setIsExchangeModalOpen(true);
          }}
        />
      )}

      {/* MODAL 3: HISTÓRICO DE COMPRAS DO MEMBRO */}
      <ShopPurchasesHistoryModal
        open={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        userId={userId}
      />
    </div>
  );
}

// ==========================================
// SUB-COMPONENTE: MODAL DE TROCA DE XP POR COINS
// ==========================================
function ExchangeXpModal({
  open,
  onOpenChange,
  currentXp,
  currentCoins,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentXp: number;
  currentCoins: number;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();
  const [xpToExchange, setXpToExchange] = useState<string>("50");

  const { data: exchangeConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["coins_exchange_config"],
    queryFn: getCoinsExchangeConfig,
    enabled: open,
    staleTime: 30 * 1000,
  });

  const xpPerCoin = Math.max(0.01, Number(exchangeConfig?.xp_per_coin || 1.0));
  const feePercent = Math.max(0, Math.min(100, Number(exchangeConfig?.exchange_fee_percent || 0.0)));
  const minXp = Math.max(1, Number(exchangeConfig?.min_xp_exchange || 1.0));
  const isExchangeEnabled = exchangeConfig?.exchange_enabled !== false;

  const numXp = Math.max(0, parseFloat(xpToExchange.replace(",", ".") || "0") || 0);
  const grossCoins = Math.floor(numXp / xpPerCoin);
  const feeCoins = feePercent > 0 ? Math.floor(grossCoins * (feePercent / 100)) : 0;
  const coinsToReceive = Math.max(0, grossCoins - feeCoins);

  const hasEnoughXp = currentXp >= numXp && numXp >= minXp;
  const canConvert = isExchangeEnabled && hasEnoughXp && coinsToReceive > 0;

  const exchangeMutation = useMutation({
    mutationFn: () => exchangeXpForCoins(numXp),
    onSuccess: (data) => {
      toast.success(data.message || "XP convertido com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["member_coins", userId] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["gamification_ranking"] });
      void queryClient.invalidateQueries({ queryKey: ["coins_exchange_config"] });
      void refresh();
      onOpenChange(false);
      setXpToExchange("50");
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao converter XP em TW Coins.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md surface-card border-border/80">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                Trocar XP por TW Coins
              </DialogTitle>
              <DialogDescription className="text-xs">
                Converta seus pontos de XP acumulados em moedas para gastar na loja oficial da facção.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {!isExchangeEnabled && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              <span className="font-semibold text-xs leading-tight">
                A conversão de XP em TW Coins está temporariamente suspensa pela administração.
              </span>
            </div>
          )}

          {/* TAXA DE CONVERSÃO E COBRANÇA DE CÂMBIO */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-amber-300 font-bold">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Câmbio Oficial:</span>
              </div>
              <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/40 text-xs">
                {xpPerCoin} XP = 1 TW Coin
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-amber-500/20 text-[11px] text-amber-300/80 font-normal">
              <span>Tarifa de Câmbio:</span>
              <span className="font-mono font-bold text-amber-200">
                {feePercent > 0 ? `${feePercent}% cobrada pela facção` : "Isento (0% taxa)"}
              </span>
            </div>

            {minXp > 1 && (
              <div className="flex items-center justify-between text-[11px] text-amber-300/80 font-normal">
                <span>Conversão Mínima:</span>
                <span className="font-mono font-bold text-amber-200">{minXp} XP</span>
              </div>
            )}
          </div>

          {/* SALDOS ATUAIS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                Seu Saldo de XP
              </span>
              <p className="font-mono font-black text-base text-foreground">
                {formatXp(currentXp)} XP
              </p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/70 space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                Seu Saldo de Coins
              </span>
              <p className="font-mono font-black text-base text-amber-400">
                {Number(currentCoins || 0).toLocaleString("pt-BR")} Coins
              </p>
            </div>
          </div>

          {/* CAMPO DE ENTRADA DO XP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Quantidade de XP para Converter:
              </label>
              <span className="text-[11px] text-muted-foreground font-mono">
                Máximo disponível: {formatXp(currentXp)} XP
              </span>
            </div>

            <div className="relative">
              <Zap className="h-4 w-4 absolute left-3 top-3 text-amber-400" />
              <Input
                type="number"
                step="0.01"
                min={minXp}
                max={currentXp}
                value={xpToExchange}
                onChange={(e) => setXpToExchange(e.target.value)}
                placeholder={`Ex: ${Math.max(minXp, 50)}`}
                className="h-10 pl-9 font-mono font-black text-sm bg-background/50"
              />
            </div>

            {/* BOTÕES DE PRESET RÁPIDO */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {[Math.max(minXp, 10), 25, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setXpToExchange(String(preset))}
                  className="px-2.5 py-1 rounded-lg bg-secondary/70 hover:bg-secondary text-[11px] font-bold text-muted-foreground hover:text-foreground border border-border/60 transition-colors cursor-pointer"
                >
                  +{preset} XP
                </button>
              ))}
              <button
                type="button"
                onClick={() => setXpToExchange(String(currentXp))}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-[11px] font-bold text-amber-300 border border-amber-500/30 transition-colors cursor-pointer ml-auto"
              >
                Converter Tudo ({formatXp(currentXp)} XP)
              </button>
            </div>
          </div>

          {/* SIMULAÇÃO DE RESULTADO DETALHADA */}
          <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>XP a Deduzir:</span>
              <span className="text-rose-400 font-bold">-{formatXp(numXp)} XP</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Câmbio Bruto:</span>
              <span className="text-foreground font-bold">+{grossCoins.toLocaleString("pt-BR")} Coins</span>
            </div>
            {feePercent > 0 && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tarifa da Facção ({feePercent}%):</span>
                <span className="text-rose-400 font-bold">-{feeCoins.toLocaleString("pt-BR")} Coins</span>
              </div>
            )}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between font-bold text-foreground">
              <span>TW Coins a Receber:</span>
              <span className="text-amber-400 text-sm font-black">
                +{coinsToReceive.toLocaleString("pt-BR")} Coins
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Novo Saldo Estimado:</span>
              <span className="text-amber-300 font-bold">
                {(currentCoins + coinsToReceive).toLocaleString("pt-BR")} Coins
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => exchangeMutation.mutate()}
            disabled={!canConvert || exchangeMutation.isPending}
            className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-black gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            {exchangeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="h-4 w-4" />
            )}
            <span>
              {!isExchangeEnabled
                ? "Câmbio Suspenso"
                : numXp < minXp
                ? `Mínimo de ${minXp} XP`
                : currentXp < numXp
                ? "XP Insuficiente"
                : coinsToReceive < 1
                ? "Rendimento Menor que 1 Coin"
                : "Confirmar Conversão"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// SUB-COMPONENTE: DIÁLOGO DE COMPRA DE ITEM
// ==========================================
function BuyItemDialog({
  item,
  open,
  onOpenChange,
  memberCoins,
  userId,
  onExchangeClick,
}: {
  item: ShopItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberCoins: number;
  userId: string;
  onExchangeClick: () => void;
}) {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();
  const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.comum;
  const hasEnoughCoins = memberCoins >= item.price_coins;

  const isLinkedInsignia = item.item_type === "insignia" || Boolean(item.insignia_id);
  const isLinkedTag = item.item_type === "tag" || Boolean(item.tag_id);

  const buyMutation = useMutation({
    mutationFn: () => buyShopItem(item.id),
    onSuccess: (data) => {
      toast.success(data.message || `Compra de "${item.title}" concluída com sucesso!`);
      void queryClient.invalidateQueries({ queryKey: ["shop_items"] });
      void queryClient.invalidateQueries({ queryKey: ["member_coins", userId] });
      void queryClient.invalidateQueries({ queryKey: ["member_insignias", userId] });
      void queryClient.invalidateQueries({ queryKey: ["member_tag_assignments"] });
      void queryKeyInvalidateMember();
      void refresh();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao realizar a compra.");
    },
  });

  const queryKeyInvalidateMember = async () => {
    await queryClient.invalidateQueries({ queryKey: ["shop_purchases", userId] });
    await queryClient.invalidateQueries({ queryKey: ["all_shop_purchases"] });
    await queryClient.invalidateQueries({ queryKey: ["gamification_ranking"] });
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    await queryClient.invalidateQueries({ queryKey: ["members"] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md surface-card border-border/80">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {isLinkedInsignia ? (
              <InsigniaEmblem
                icon={item.insignia?.icon || item.icon || "Award"}
                name={item.insignia?.name || item.title}
                rarity={item.insignia?.rarity || item.rarity}
                shape_3d={item.insignia?.shape_3d}
                material_3d={item.insignia?.material_3d}
                border_style_3d={item.insignia?.border_style_3d}
                gloss_effect={item.insignia?.gloss_effect}
                color={item.insignia?.color}
                bgColor={item.insignia?.bg_color}
                borderColor={item.insignia?.border_color}
                size="md"
              />
            ) : isLinkedTag && item.tag ? (
              <div className="p-2 rounded-xl bg-secondary/80 border border-border/80">
                <MemberTagBadge tag={item.tag} size="md" />
              </div>
            ) : (
              <div className={cn("h-12 w-12 rounded-2xl border-2 shadow-lg flex items-center justify-center shrink-0", rarity.bgClass, rarity.borderClass, rarity.textClass)}>
                {renderInsigniaIcon(item.icon, "h-6 w-6")}
              </div>
            )}
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Confirmar Aquisição
              </DialogTitle>
              <DialogDescription className="text-xs">
                Revise os detalhes do produto antes de finalizar sua compra.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* CARD RESUMO DO ITEM */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-foreground">{item.title}</h4>
              <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border", rarity.bgClass, rarity.borderClass, rarity.textClass)}>
                {rarity.label}
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-xs">
              {item.description || "Item oficial da Loja Twin Wheels."}
            </p>

            {item.instructions && (
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium flex items-start gap-1.5 text-[11px]">
                <Info className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
                <span>
                  <strong>Instruções de Entrega:</strong> {item.instructions}
                </span>
              </div>
            )}

            {isLinkedInsignia && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-2 text-[11px]">
                <Award className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Esta insígnia 3D será adicionada imediatamente ao seu perfil oficial!</span>
              </div>
            )}

            {isLinkedTag && (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 font-semibold flex items-center gap-2 text-[11px]">
                <TagIcon className="h-4 w-4 shrink-0 text-blue-400" />
                <span>Esta tag de cargo será vinculada imediatamente ao seu perfil e permissões!</span>
              </div>
            )}

            {!isLinkedInsignia && !isLinkedTag && (
              <div className="p-2.5 rounded-xl bg-secondary/60 border border-border/80 text-muted-foreground font-medium flex items-center gap-2 text-[11px]">
                <Briefcase className="h-4 w-4 shrink-0 text-foreground" />
                <span>O pedido será registrado para entrega operacional pela liderança.</span>
              </div>
            )}
          </div>

          {/* DÉBITO E SALDO */}
          <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/60 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Seu Saldo Atual:</span>
              <span className="font-bold text-foreground">{memberCoins.toLocaleString("pt-BR")} Coins</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Preço do Item:</span>
              <span className="text-amber-400 font-bold">-{item.price_coins.toLocaleString("pt-BR")} Coins</span>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between font-bold">
              <span>Saldo Após a Compra:</span>
              <span className={cn(hasEnoughCoins ? "text-emerald-400" : "text-rose-400")}>
                {(memberCoins - item.price_coins).toLocaleString("pt-BR")} Coins
              </span>
            </div>
          </div>

          {!hasEnoughCoins && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>Saldo insuficiente de TW Coins</span>
              </div>
              <p className="text-[11px] text-rose-300/80 leading-relaxed">
                Você precisa de mais {(item.price_coins - memberCoins).toLocaleString("pt-BR")} TW Coins. Converta seu XP para concluir a compra!
              </p>
              <Button
                type="button"
                onClick={onExchangeClick}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl h-8 mt-1 cursor-pointer"
              >
                Trocar XP por Moedas Agora
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => buyMutation.mutate()}
            disabled={!hasEnoughCoins || buyMutation.isPending}
            className="rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-black gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            {buyMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
            <span>Confirmar Aquisição</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// SUB-COMPONENTE: HISTÓRICO DE COMPRAS DO MEMBRO
// ==========================================
function ShopPurchasesHistoryModal({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}) {
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["shop_purchases", userId],
    queryFn: () => (userId ? getMemberShopPurchases(userId) : Promise.resolve([])),
    enabled: open && Boolean(userId),
    staleTime: 10 * 1000,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto surface-card border-border/80">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <History className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground">
                Histórico de Compras na Loja
              </DialogTitle>
              <DialogDescription className="text-xs">
                Registro de todas as suas compras, insígnias, tags e solicitações de serviços.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              Carregando compras...
            </div>
          ) : purchases.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-2xl space-y-2">
              <Package className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p className="font-bold">Nenhuma compra realizada ainda</p>
              <p className="text-[11px] max-w-xs mx-auto">
                Adquira itens, condecorações ou vantagens na loja usando suas TW Coins!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="p-3 rounded-2xl bg-secondary/40 border border-border/70 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h5 className="font-black text-foreground text-xs">{purchase.item_title}</h5>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {new Date(purchase.created_at).toLocaleString("pt-BR")} • Categoria:{" "}
                      <span className="capitalize">{purchase.category}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-400 flex items-center gap-1 text-xs">
                      <Coins className="h-3 w-3" /> {purchase.price_coins_paid.toLocaleString("pt-BR")} Coins
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] mt-0.5",
                        purchase.status === "concluido" || purchase.status === "entregue"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : purchase.status === "pendente_entrega"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/30"
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
