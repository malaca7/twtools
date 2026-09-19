import { useState, useEffect, useMemo, useRef } from "react";
import { createFileRoute, Outlet, useChildMatches, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  Plus,
  Minus,
  Trash2,
  Package,
  Boxes,
  Box,
  CheckCircle2,
  Loader2,
  Search,
  Check,
  Zap,
  RotateCcw,
  Tags,
  Lock,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Eye,
  PackageSearch,
  Layers,
  X,
  History,
  LayoutGrid,
  List,
} from "lucide-react";
import { BauIcon } from "@/components/ui/bau-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, NoAccess, TableSkeleton, EmptyState, ProductThumbnail } from "@/components/ui-kit";
import { MovementHistoryModal } from "@/components/operations/MovementHistoryModal";
import { useAuth } from "@/hooks/useAuth";
import { useUrlTab } from "@/hooks/useUrlTab";
import {
  useMovements,
  useProducts,
  useBaus,
  useProductBaus,
  useCategories,
  useMembers,
  nameOf,
  productName,
} from "@/hooks/useData";
import { batchSubmitMovements, submitChestTransfer } from "@/lib/app-api";
import { dateTime, errorMessage, num } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/movimentacoes")({
  component: MovimentacoesWrapper,
});

function MovimentacoesWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <MovimentacoesPage />;
}

type BatchItem = {
  productId: string;
  quantity: number;
};

const PRODUCTS_PER_PAGE = 18;

export function MovimentacoesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canViewPage = hasPermission("view_movements");
  const canMove = hasPermission("create_movement");
  const canView = hasPermission("view_all_movements");
  const canReverse = hasPermission("reverse_movement");
  const canViewBalances = hasPermission("view_movement_balances");
  const canViewBaus = hasPermission("view_movement_baus");

  if (!canViewPage) return <NoAccess />;

  const { data: movements = [], isLoading: loadingMovements } = useMovements();
  const { data: products = [] } = useProducts();
  const { data: baus = [] } = useBaus();
  const { data: productBaus = [] } = useProductBaus();
  const { data: categories = [] } = useCategories();
  const { data: members = [] } = useMembers();

  // App State sincronizado com a URL (?tipo=entrada | saida | transferencia)
  const [type, setType] = useUrlTab<"entrada" | "saida" | "transferencia">("saida", {
    paramName: "tipo",
    allowedTabs: ["entrada", "saida", "transferencia"],
  });
  const [selectedBauId, setSelectedBauId] = useState<string>("");
  const [fromBauId, setFromBauId] = useState<string>("");
  const [toBauId, setToBauId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");

  // Auto-set default chests when loaded
  useEffect(() => {
    if (baus.length > 0) {
      if (!selectedBauId || !baus.some((b) => b.id === selectedBauId)) {
        const defaultBau = baus[0];
        if (defaultBau) setSelectedBauId(defaultBau.id);
      }
      if (!fromBauId || !baus.some((b) => b.id === fromBauId)) {
        if (baus[0]) setFromBauId(baus[0].id);
      }
      if (!toBauId || toBauId === fromBauId || !baus.some((b) => b.id === toBauId)) {
        const otherBau = baus.find((b) => b.id !== (fromBauId || baus[0]?.id)) || baus[1] || baus[0];
        if (otherBau) setToBauId(otherBau.id);
      }
    }
  }, [baus, selectedBauId, fromBauId, toBauId]);

  // Queue batch items
  const [queue, setQueue] = useState<BatchItem[]>([]);

  // Search and queue
  const [prodSearch, setProdSearch] = useState("");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyBauId, setHistoryBauId] = useState<string | null>(null);

  const selectedBau = baus.find((b) => b.id === selectedBauId);
  const isSelectedBauAuto = selectedBau ? selectedBau.tipo_gestao !== "manual" : false;
  const fromBau = baus.find((b) => b.id === fromBauId);
  const toBau = baus.find((b) => b.id === toBauId);
  const isTransferAuto = type === "transferencia" && ((fromBau && fromBau.tipo_gestao !== "manual") || (toBau && toBau.tipo_gestao !== "manual"));
  const isCurrentActionBlocked = (type !== "transferencia" && isSelectedBauAuto) || isTransferAuto;

  // Estados para Modal de Saldo / Inventário do Baú e Ações Rápidas
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceBauId, setBalanceBauId] = useState<string | null>(null);
  const [balanceSearch, setBalanceSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<"positive" | "all" | "zero">("positive");
  const [balanceViewMode, setBalanceViewMode] = useState<"grid" | "list">("grid");
  const movementSectionRef = useRef<HTMLDivElement>(null);

  // Set de IDs das movimentações que já foram estornadas
  const reversedIds = useMemo(() => {
    const set = new Set<string>();
    movements.forEach((m) => {
      if (m.reversal_of) set.add(m.reversal_of);
    });
    return set;
  }, [movements]);

  // Calculate stock in chest
  const getProductStockInChest = (productId: string, bauId?: string): number => {
    if (!bauId) return 0;

    const prod = products.find((p) => p.id === productId);
    const globalStock = prod ? Number(prod.estoque_atual || 0) : 0;

    if (baus.length <= 1) {
      return globalStock;
    }

    const chestEntry = productBaus.find(
      (pb) => pb.product_id === productId && pb.bau_id === bauId
    );
    if (chestEntry !== undefined) {
      return Math.max(0, Number(chestEntry.quantidade || 0));
    }

    const defaultBauId = baus[0]?.id;
    const chestMovements = movements.filter((m) => {
      if (m.product_id !== productId) return false;
      const mBauId = m.bau_id || defaultBauId;
      return mBauId === bauId;
    });

    if (chestMovements.length === 0) {
      return 0;
    }

    const chestSum = chestMovements.reduce(
      (acc, m) => acc + (m.type === "entrada" ? Number(m.quantity) : -Number(m.quantity)),
      0
    );

    return Math.max(0, chestSum);
  };

  // Frequência de movimentação dos produtos (mais movimentados primeiro)
  const productMovementCounts = useMemo(() => {
    const map: Record<string, number> = {};
    movements.forEach((m) => {
      if (m.product_id && !m.reversal_of && !reversedIds.has(m.id)) {
        map[m.product_id] = (map[m.product_id] || 0) + 1;
      }
    });
    return map;
  }, [movements, reversedIds]);

  const activeBauId = type === "transferencia" ? fromBauId : selectedBauId;

  // Produtos filtrados: exibe todos os produtos ativos da categoria selecionada
  const activeProducts = products
    .filter((p) => {
      if (!p.ativo) return false;
      if (selectedCategoryId && p.categoria_id !== selectedCategoryId) return false;
      if (prodSearch && !p.nome.toLowerCase().includes(prodSearch.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      const countA = productMovementCounts[a.id] || 0;
      const countB = productMovementCounts[b.id] || 0;
      if (countB !== countA) return countB - countA;
      return a.nome.localeCompare(b.nome);
    });

  // Paginação da seleção de produtos (18 itens por página)
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 18;

  useEffect(() => {
    setProductPage(1);
  }, [prodSearch, selectedCategoryId]);

  const totalProductPages = Math.ceil(activeProducts.length / PRODUCTS_PER_PAGE) || 1;
  const safeProductPage = Math.min(Math.max(1, productPage), totalProductPages);
  const paginatedProducts = activeProducts.slice(
    (safeProductPage - 1) * PRODUCTS_PER_PAGE,
    safeProductPage * PRODUCTS_PER_PAGE
  );

  // Paginação da lista do lote selecionado (12 itens por página)
  const [queuePage, setQueuePage] = useState(1);
  const QUEUE_PER_PAGE = 12;

  const totalQueuePages = Math.ceil(queue.length / QUEUE_PER_PAGE) || 1;
  const safeQueuePage = Math.min(Math.max(1, queuePage), totalQueuePages);
  const paginatedQueue = queue.slice(
    (safeQueuePage - 1) * QUEUE_PER_PAGE,
    safeQueuePage * QUEUE_PER_PAGE
  );

  const selectedProd = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProd && activeBauId ? getProductStockInChest(selectedProd.id, activeBauId) : 0;
  const destStock = selectedProd && type === "transferencia" && toBauId ? getProductStockInChest(selectedProd.id, toBauId) : 0;

  const nextStock =
    type === "entrada"
      ? currentStock + quantity
      : currentStock - quantity;

  const handleAddQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleSetMax = () => {
    if (type === "transferencia" && !fromBauId) {
      toast.error("Selecione o baú de origem primeiro.");
      return;
    }
    if (type !== "transferencia" && !selectedBauId) {
      toast.error("Selecione um baú operacional primeiro.");
      return;
    }
    if (selectedProd) {
      if (currentStock <= 0) {
        toast.error(`Sem saldo disponível de ${selectedProd.nome} neste baú.`);
        setQuantity(1);
      } else {
        setQuantity(currentStock);
      }
    } else {
      toast.error("Selecione um produto primeiro para aplicar a quantidade máxima disponível.");
    }
  };

  const handleResetQuantity = () => {
    setQuantity(1);
  };

  const handleToggleProductInQueue = (productId: string) => {
    if (isCurrentActionBlocked) {
      toast.error("Este baú opera em modo automático via Discord. Movimentações manuais estão bloqueadas.");
      return;
    }

    if (type === "transferencia") {
      if (!fromBauId) {
        toast.error("Selecione o baú de origem.");
        return;
      }
      if (!toBauId) {
        toast.error("Selecione o baú de destino.");
        return;
      }
      if (fromBauId === toBauId) {
        toast.error("O baú de destino deve ser diferente do baú de origem.");
        return;
      }
    } else if (!selectedBauId) {
      toast.error("Selecione um baú operacional antes de adicionar produtos ao lote.");
      return;
    }

    if (type !== "entrada") {
      const stockInChest = getProductStockInChest(productId, activeBauId);
      if (stockInChest <= 0) {
        toast.error("Este produto não possui saldo disponível neste baú.");
        return;
      }
    }

    setQueue((prev) => {
      const exists = prev.some((i) => i.productId === productId);
      if (exists) {
        return prev.filter((i) => i.productId !== productId);
      } else {
        return [...prev, { productId, quantity: 1 }];
      }
    });
  };

  const handleUpdateQueueQuantity = (productId: string, newQty: number) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      })
    );
  };

  const addItemToQueue = () => {
    if (isCurrentActionBlocked) {
      toast.error("Este baú opera em modo automático via Discord. Movimentações manuais estão bloqueadas.");
      return;
    }

    if (type === "transferencia") {
      if (!fromBauId) {
        toast.error("Selecione o baú de origem.");
        return;
      }
      if (!toBauId) {
        toast.error("Selecione o baú de destino.");
        return;
      }
      if (fromBauId === toBauId) {
        toast.error("O baú de destino deve ser diferente do baú de origem.");
        return;
      }
    } else if (!selectedBauId) {
      toast.error("Selecione um baú operacional antes de adicionar itens.");
      return;
    }

    if (!selectedProductId || !selectedProd) {
      toast.error("Selecione um produto primeiro.");
      return;
    }
    if (quantity <= 0) {
      toast.error("A quantidade deve ser maior que zero.");
      return;
    }

    if ((type === "saida" || type === "transferencia") && quantity > currentStock) {
      const bauName =
        type === "transferencia"
          ? baus.find((b) => b.id === fromBauId)?.nome || "Origem"
          : baus.find((b) => b.id === selectedBauId)?.nome || "Baú";
      toast.error(`Saldo insuficiente no ${bauName}! Disponível: ${num(currentStock)}`);
      return;
    }

    setQueue((prev) => {
      const idx = prev.findIndex((i) => i.productId === selectedProductId);
      if (idx >= 0 && prev[idx]) {
        const copy = [...prev];
        copy[idx] = { ...prev[idx]!, quantity: prev[idx]!.quantity + quantity };
        return copy;
      }
      return [...prev, { productId: selectedProductId, quantity }];
    });

    setSelectedProductId("");
    setQuantity(1);
  };

  const submitBatchMutation = useMutation({
    mutationFn: async () => {
      if (!canMove) throw new Error("Você não possui permissão para lançar movimentações.");
      if (isCurrentActionBlocked) throw new Error("Este baú opera em modo automático via Discord. Movimentações manuais livres estão bloqueadas.");

      let itemsToSubmit = [...queue];

      // Auto-include currently selected product into batch if not explicitly queued
      if (selectedProductId && selectedProd) {
        const existingIdx = itemsToSubmit.findIndex((i) => i.productId === selectedProductId);
        if (existingIdx >= 0 && itemsToSubmit[existingIdx]) {
          itemsToSubmit[existingIdx] = {
            ...itemsToSubmit[existingIdx]!,
            quantity: itemsToSubmit[existingIdx]!.quantity + quantity,
          };
        } else {
          itemsToSubmit.push({ productId: selectedProductId, quantity });
        }
      }

      if (itemsToSubmit.length === 0) {
        throw new Error("Adicione pelo menos um produto ao lote para confirmar o envio.");
      }

      if (type === "transferencia") {
        if (!fromBauId) throw new Error("Selecione o baú de origem.");
        if (!toBauId) throw new Error("Selecione o baú de destino.");
        if (fromBauId === toBauId) throw new Error("O baú de destino deve ser diferente do baú de origem.");

        for (const item of itemsToSubmit) {
          const itemStock = getProductStockInChest(item.productId, fromBauId);
          if (item.quantity > itemStock) {
            const p = products.find((prod) => prod.id === item.productId);
            throw new Error(`Saldo insuficiente no baú de origem para ${p?.nome || "produto"}. Disponível: ${num(itemStock)}`);
          }
          await submitChestTransfer({
            fromBauId,
            toBauId,
            productId: item.productId,
            quantity: item.quantity,
            reason: reason.trim() || "Transferência em Lote entre Baús",
          });
        }
      } else {
        if (!selectedBauId) throw new Error("Selecione obrigatoriamente um baú operacional.");

        if (type === "saida") {
          for (const item of itemsToSubmit) {
            const itemStock = getProductStockInChest(item.productId, selectedBauId);
            if (item.quantity > itemStock) {
              const p = products.find((prod) => prod.id === item.productId);
              throw new Error(`Saldo insuficiente para ${p?.nome || "produto"}. Disponível: ${num(itemStock)}`);
            }
          }
        }

        const payload = itemsToSubmit.map((item) => ({
          productId: item.productId,
          type,
          quantity: item.quantity,
          reason: reason.trim() || "Movimentação Operacional de Estoque",
          ...(selectedBauId ? { bauId: selectedBauId } : {}),
        }));

        await batchSubmitMovements(payload);
      }
    },
    onSuccess: () => {
      const msg =
        type === "entrada"
          ? "Lote de Entrada processado com sucesso!"
          : type === "saida"
          ? "Lote de Saída processado com sucesso!"
          : "Lote de Transferência entre baús processado com sucesso!";
      toast.success(msg);
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      setQueue([]);
      setSelectedProductId("");
      setQuantity(1);
      setReason("");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const [activeMovementBauId, setActiveMovementBauId] = useState<string | null>(null);

  // Estatísticas agregadas de inventário por baú
  const bausStats = useMemo(() => {
    const stats: Record<string, { itemsCount: number; totalUnits: number }> = {};
    for (const b of baus) {
      let itemsCount = 0;
      let totalUnits = 0;
      for (const p of products) {
        if (p.ativo === false) continue;
        const stock = getProductStockInChest(p.id, b.id);
        if (stock > 0) {
          itemsCount += 1;
          totalUnits += stock;
        }
      }
      stats[b.id] = { itemsCount, totalUnits };
    }
    return stats;
  }, [baus, products, productBaus, movements]);

  // Abertura do modal de visualização de saldo do baú
  const handleOpenBalance = (targetBauId: string) => {
    setBalanceBauId(targetBauId);
    setBalanceSearch("");
    setBalanceFilter("positive");
    setBalanceModalOpen(true);
  };

  // Disparo de movimentação a partir do card do baú (Apenas para baús manuais)
  const handleStartMovementOnBau = (targetBauId: string) => {
    setActiveMovementBauId(targetBauId);
    setSelectedBauId(targetBauId);
    setFromBauId(targetBauId);
    if (type === "transferencia" && toBauId === targetBauId) {
      const other = baus.find((b) => b.id !== targetBauId);
      if (other) setToBauId(other.id);
    }
    setQueue([]);
    const targetBauObj = baus.find((b) => b.id === targetBauId);
    toast.info(`Baú "${targetBauObj?.nome || "Selecionado"}" aberto para lançamento.`);
    setTimeout(() => {
      movementSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const activeMovementBauObj = baus.find((b) => b.id === activeMovementBauId);

  // Dados do baú ativo no modal de saldo
  const activeBalanceBau = baus.find((b) => b.id === balanceBauId);
  const activeBalanceInventory = useMemo(() => {
    if (!balanceBauId) return [];
    return products
      .filter((p) => p.ativo !== false)
      .map((p) => {
        const stock = getProductStockInChest(p.id, balanceBauId);
        const cat = categories.find((c) => c.id === p.categoria_id);
        return {
          product: p,
          stock,
          categoryName: cat?.nome || "Geral",
        };
      })
      .sort((a, b) => {
        if (b.stock !== a.stock) return b.stock - a.stock;
        return a.product.nome.localeCompare(b.product.nome);
      });
  }, [balanceBauId, products, productBaus, movements, categories, baus]);

  const filteredBalanceItems = useMemo(() => {
    return activeBalanceInventory.filter((item) => {
      if (balanceFilter === "positive" && item.stock <= 0) return false;
      if (balanceFilter === "zero" && item.stock > 0) return false;
      if (balanceSearch.trim()) {
        const q = balanceSearch.toLowerCase().trim();
        const matchName = item.product.nome.toLowerCase().includes(q);
        const matchCat = item.categoryName.toLowerCase().includes(q);
        return matchName || matchCat;
      }
      return true;
    });
  }, [activeBalanceInventory, balanceFilter, balanceSearch]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Painel de Movimentações"
        description="Lançamentos operacionais de entrada, saída e transferência direta entre baús com botões de ação rápida."
      />

      {/* SEÇÃO 1: CARDS COM TODOS OS BAÚS NO TOPO */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Baús do grupo
            </h2>
            <Badge variant="outline" className="text-[10px] font-bold">
              {baus.length} {baus.length === 1 ? "baú" : "baús"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground hidden lg:inline">
              Ações rápidas: <Eye className="w-3.5 h-3.5 inline mx-0.5 text-primary" /> Ver Saldo, <History className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" /> Histórico ou <ArrowRightLeft className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" /> Movimentar.
            </p>
            {canView && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setHistoryBauId("all");
                  setHistoryModalOpen(true);
                }}
                className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 border-border/80 hover:border-primary/50 hover:bg-primary/10 text-foreground cursor-pointer shadow-xs transition-all"
              >
                <History className="h-3.5 w-3.5 text-primary" />
                <span>Histórico Geral</span>
                <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 rounded-md">
                  {num(movements.length)}
                </Badge>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {baus.map((b) => {
            const isManual = b.tipo_gestao === "manual";
            const stat = bausStats[b.id] || { itemsCount: 0, totalUnits: 0 };
            const isCurrentlySelected = type === "transferencia" ? fromBauId === b.id || toBauId === b.id : selectedBauId === b.id;

            return (
              <Card
                key={b.id}
                className={cn(
                  "surface-card transition-all duration-200 hover:shadow-lg relative overflow-hidden flex flex-col justify-between border",
                  isCurrentlySelected ? "border-primary ring-1 ring-primary/40 shadow-md" : "border-border/70 hover:border-border"
                )}
              >
                <div className="p-4 space-y-3">
                  {/* Top row: Icon + Name + Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-secondary/70 border border-border/60 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                        <BauIcon
                          foto_url={b.foto_url || b.imagem_url}
                          icone={b.icone}
                          nome={b.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-foreground truncate" title={b.nome}>
                          {b.nome}
                        </h3>
                        {b.descricao ? (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {b.descricao}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground opacity-60">
                            {isManual ? "Baú operacional padrão" : "Monitorado via Discord"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9.5px] font-bold px-2 py-0.5 rounded-md",
                          isManual
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                        )}
                      >
                        {isManual ? "✍️ Manual" : "🤖 Automático"}
                      </Badge>
                    </div>
                  </div>

                  {/* Metrics summary */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-secondary/30 border border-border/40 text-center">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Itens Únicos
                      </span>
                      <strong className="text-xs sm:text-sm font-extrabold text-foreground font-mono">
                        {num(stat.itemsCount)}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/30 border border-border/40 text-center">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Volume Total
                      </span>
                      <strong className="text-xs sm:text-sm font-extrabold text-primary font-mono">
                        {num(stat.totalUnits)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Actions row: ONLY SYMBOLS ON BUTTONS */}
                <div className="px-4 py-2.5 bg-secondary/20 border-t border-border/40 flex items-center justify-between">
                  <div className="text-[11px] text-muted-foreground">
                    {isManual ? (
                      <span className="text-amber-400/90 font-medium">Lançamento Web</span>
                    ) : (
                      <span className="text-cyan-400/90 font-medium">Sincroniza Discord</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botão Ver Saldo (Apenas Símbolo) */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenBalance(b.id)}
                          className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-colors cursor-pointer"
                          aria-label={`Ver Saldo do baú ${b.nome}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs font-semibold">
                        Ver Saldo do Baú
                      </TooltipContent>
                    </Tooltip>

                    {/* Botão Ver Histórico de Movimentações do Baú (Apenas Símbolo) */}
                    {canView && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setHistoryBauId(b.id);
                              setHistoryModalOpen(true);
                            }}
                            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-sky-400 hover:border-sky-500/50 hover:bg-sky-500/10 transition-colors cursor-pointer"
                            aria-label={`Histórico de Movimentações do baú ${b.nome}`}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs font-semibold">
                          Histórico de Movimentações deste Baú
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Botão Movimentar (Apenas Símbolo) - SOMENTE PARA BAÚS MANUAIS */}
                    {isManual && canMove && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => handleStartMovementOnBau(b.id)}
                            className={cn(
                              "h-8 w-8 p-0 rounded-lg text-primary-foreground shadow-sm transition-all active:scale-95 cursor-pointer",
                              activeMovementBauId === b.id
                                ? "bg-amber-500 hover:bg-amber-600 ring-2 ring-amber-400"
                                : "bg-primary hover:bg-primary/90"
                            )}
                            aria-label={`Movimentar baú ${b.nome}`}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs font-semibold">
                          Lançar Movimentação neste Baú
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* PAINEL INTERATIVO ESTILO APP (ABRE APENAS AO CLICAR EM MOVIMENTAR NO CARD DE UM BAÚ MANUAL) */}
      {canMove && activeMovementBauId && activeMovementBauObj && (
        <Card ref={movementSectionRef} className="surface-card border-primary/50 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
          {/* HEADER DO BAÚ SELECIONADO PARA OPERAÇÃO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-primary/10 border-b border-primary/25">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                <BauIcon
                  foto_url={activeMovementBauObj.foto_url || activeMovementBauObj.imagem_url}
                  icone={activeMovementBauObj.icone}
                  nome={activeMovementBauObj.nome}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                  Lançamento Operacional: {activeMovementBauObj.nome}
                  <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">✍️ Modo Manual</Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Selecione o tipo de movimentação (Entrada, Saída ou Transferência) e os produtos abaixo.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveMovementBauId(null);
                setQueue([]);
              }}
              className="h-8 px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl border-border/80 shrink-0"
            >
              <X className="w-4 h-4 mr-1 text-rose-400" /> Fechar / Voltar aos Baús
            </Button>
          </div>

          {/* BOTÕES DE TIPO ESTILO SEGMENTED CONTROL (ENTRADA VS SAÍDA VS TRANSFERÊNCIA) */}
          <div className="grid grid-cols-3 p-1.5 sm:p-2 bg-secondary/40 border-b border-border/60 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => { setType("entrada"); setQueue([]); }}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md cursor-pointer active:scale-95",
                type === "entrada"
                  ? "bg-emerald-600 text-white shadow-emerald-600/25 ring-2 ring-emerald-400"
                  : "bg-background/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <div className="text-center sm:text-left">
                <p className="font-extrabold text-[11px] sm:text-sm leading-tight">ENTRADA (+)</p>
                <p className="text-[0.65rem] opacity-80 font-normal hidden sm:block">Adicionar novos itens no baú</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setType("saida"); setQueue([]); }}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md cursor-pointer active:scale-95",
                type === "saida"
                  ? "bg-rose-600 text-white shadow-rose-600/25 ring-2 ring-rose-400"
                  : "bg-background/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <div className="text-center sm:text-left">
                <p className="font-extrabold text-[11px] sm:text-sm leading-tight">SAÍDA (-)</p>
                <p className="text-[0.65rem] opacity-80 font-normal hidden sm:block">Retirar itens do baú</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setType("transferencia"); setQueue([]); }}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2.5 sm:py-3.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md cursor-pointer active:scale-95",
                type === "transferencia"
                  ? "bg-sky-600 text-white shadow-sky-600/25 ring-2 ring-sky-400"
                  : "bg-background/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <div className="text-center sm:text-left">
                <p className="font-extrabold text-[11px] sm:text-sm leading-tight">TRANSF. (⇄)</p>
                <p className="text-[0.65rem] opacity-80 font-normal hidden sm:block">Mover itens entre dois baús</p>
              </div>
            </button>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* SELEÇÃO DE BAÚS */}
            {canViewBaus && (
              type !== "transferencia" ? (
                /* MODO ENTRADA / SAÍDA: 1 BAÚ */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="h-4 w-4 text-primary" /> 1. Escolha o Baú de Operação
                    </Label>
                    {selectedBauId && (
                      <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                        Baú Selecionado
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {baus.map((b) => (
                      <Button
                        key={b.id}
                        type="button"
                        variant={selectedBauId === b.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedBauId(b.id)}
                        className={cn(
                          "text-xs h-9 px-3.5 rounded-xl font-bold flex items-center gap-1.5",
                          selectedBauId === b.id ? "bg-primary text-primary-foreground shadow-sm" : ""
                        )}
                      >
                        <span>📦 {b.nome}</span>
                        {b.tipo_gestao === "manual" ? (
                          <span className={cn("text-[9px] px-1 py-0.2 rounded font-medium", selectedBauId === b.id ? "bg-amber-400 text-slate-900" : "bg-amber-500/10 text-amber-400 border border-amber-500/20")}>
                            ✋ Manual
                          </span>
                        ) : (
                          <span className={cn("text-[9px] px-1 py-0.2 rounded font-medium", selectedBauId === b.id ? "bg-emerald-400 text-slate-900" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20")}>
                            🤖 Discord
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                /* MODO TRANSFERÊNCIA: BAÚ ORIGEM E DESTINO */
                <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5">
                  {/* BAÚ ORIGEM */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="h-4 w-4 text-rose-400" /> De onde sai (Baú Origem) *
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {baus.map((b) => (
                        <Button
                          key={b.id}
                          type="button"
                          variant={fromBauId === b.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setFromBauId(b.id);
                            if (toBauId === b.id) {
                              const other = baus.find((o) => o.id !== b.id);
                              if (other) setToBauId(other.id);
                            }
                          }}
                          className={cn(
                            "text-xs h-8 px-2.5 rounded-lg font-bold flex items-center gap-1",
                            fromBauId === b.id ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                          )}
                        >
                          <span>📦 {b.nome}</span>
                          <span className="text-[9px] opacity-80 font-normal">
                            ({b.tipo_gestao === "manual" ? "Manual" : "Auto"})
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* BAÚ DESTINO */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="h-4 w-4 text-emerald-400" /> Para onde vai (Baú Destino) *
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {baus
                        .filter((b) => b.id !== fromBauId)
                        .map((b) => (
                          <Button
                            key={b.id}
                            type="button"
                            variant={toBauId === b.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setToBauId(b.id)}
                            className={cn(
                              "text-xs h-8 px-2.5 rounded-lg font-bold flex items-center gap-1",
                              toBauId === b.id ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                            )}
                          >
                            <span>📦 {b.nome}</span>
                            <span className="text-[9px] opacity-80 font-normal">
                              ({b.tipo_gestao === "manual" ? "Manual" : "Auto"})
                            </span>
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              )
            )}

            {isCurrentActionBlocked ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 text-center space-y-4 my-2 shadow-inner">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-inner">
                  🤖
                </div>
                <div className="space-y-1.5 max-w-lg mx-auto">
                  <h3 className="text-base font-extrabold text-foreground">
                    Baú com Sincronização 100% Automática via Discord
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    O baú <strong>{type === "transferencia" ? `${fromBau?.nome || "Origem"} / ${toBau?.nome || "Destino"}` : selectedBau?.nome}</strong> opera integrado às logs do canal do Discord. Movimentações manuais comuns estão bloqueadas para este baú para manter a fidelidade do inventário.
                  </p>
                </div>
                <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                  {hasPermission("estoque.ajustar") ? (
                    <Link to="/dev/estoque">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 rounded-xl shadow-md">
                        <Wrench className="w-4 h-4" /> Acessar Ajustes de Estoque no Painel Dev &rarr;
                      </Button>
                    </Link>
                  ) : (
                    <div className="text-xs text-muted-foreground bg-secondary/50 border border-border/50 py-1.5 px-3 rounded-xl">
                      Ajustes pontuais de estoque são restritos a Administradores e Desenvolvedores via Painel Dev.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* FILTRO DE CATEGORIAS POR BOTÕES CHIP */}
                <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tags className="h-4 w-4 text-primary" /> {canViewBaus ? (type === "transferencia" ? "3" : "2") : "1"}. Filtrar por Categoria
                </Label>
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto pelo nome..."
                    value={prodSearch}
                    onChange={(e) => setProdSearch(e.target.value)}
                    className="pl-8 h-7 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant={selectedCategoryId === "" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategoryId("")}
                  className="text-[11px] h-7 px-3 rounded-lg font-semibold"
                >
                  Todas as Categorias
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={selectedCategoryId === cat.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="text-[11px] h-7 px-3 rounded-lg font-semibold"
                  >
                    {cat.nome}
                  </Button>
                ))}
              </div>
            </div>

            {/* SELETOR GRANDE DE PRODUTOS (SELEÇÃO MÚLTIPLA DIRETA POR TOQUE) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-primary" /> {canViewBaus ? (type === "transferencia" ? "4" : "3") : "2"}. Toque para Selecionar os Produtos ({activeProducts.length})
                </Label>
                {queue.length > 0 && (
                  <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/40 bg-primary/10">
                    {queue.length} {queue.length === 1 ? "produto selecionado" : "produtos selecionados"}
                  </Badge>
                )}
              </div>

              {/* GRADE DE PRODUTOS SEM BARRA DE ROLAGEM COM PAGINAÇÃO */}
              <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 p-0.5">
                {paginatedProducts.map((p) => {
                  const isQueued = queue.some((i) => i.productId === p.id);
                  const queuedItem = queue.find((i) => i.productId === p.id);
                  const stockInChest = getProductStockInChest(p.id, activeBauId);
                  const globalStock = Number(p.estoque_atual || 0);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleToggleProductInQueue(p.id)}
                      className={cn(
                        "relative flex flex-col items-center justify-center p-2 rounded-2xl border text-left transition-all duration-200 group cursor-pointer aspect-square overflow-hidden select-none",
                        isQueued
                          ? "border-primary bg-primary/15 shadow-lg shadow-primary/20 ring-2 ring-primary scale-[1.02]"
                          : "border-border/80 bg-card/60 hover:bg-secondary/60 hover:border-primary/50 hover:shadow-md hover:scale-[1.02]"
                      )}
                    >
                      {/* NOME DO PRODUTO NO CANTO SUPERIOR ESQUERDO */}
                      <div className="absolute top-2 left-2 z-10 max-w-[78%] pointer-events-none">
                        <span className="inline-block font-extrabold text-[11px] sm:text-xs text-foreground bg-background/85 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-border/70 shadow-sm truncate max-w-full leading-tight">
                          {p.nome}
                        </span>
                      </div>

                      {/* INDICADOR DE SELEÇÃO NO CANTO SUPERIOR DIREITO */}
                      {isQueued && (
                        <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground p-1 rounded-lg shadow-md animate-in zoom-in duration-150 pointer-events-none">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}

                      {/* IMAGEM DO PRODUTO CENTRALIZADA */}
                      <div className="w-full h-full flex items-center justify-center p-3 my-auto pointer-events-none">
                        {p.imagem_url ? (
                          <img
                            src={p.imagem_url}
                            alt={p.nome}
                            className="max-h-20 sm:max-h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary/50 border border-border/60 text-primary/70 group-hover:scale-110 transition-transform">
                            <Package className="h-7 w-7" />
                          </div>
                        )}
                      </div>

                      {/* QUANTIDADE NO CANTO INFERIOR DIREITO */}
                      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded-md border shadow-md backdrop-blur-md",
                            isQueued
                              ? "bg-primary text-primary-foreground border-primary/50 shadow-primary/30"
                              : stockInChest > 0
                              ? "bg-background/90 text-emerald-400 border-emerald-500/40"
                              : "bg-background/90 text-rose-400 border-rose-500/40"
                          )}
                        >
                          {isQueued ? `${num(queuedItem?.quantity || 1)}x` : `${num(stockInChest)} un`}
                        </span>
                      </div>

                      {/* DETALHE NO CANTO INFERIOR ESQUERDO */}
                      {canViewBalances && (
                        <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                          {isQueued ? (
                            <span className="inline-block text-[9px] font-bold text-muted-foreground bg-background/85 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-border/60">
                              Disp: {num(stockInChest)}
                            </span>
                          ) : stockInChest === 0 && globalStock > 0 ? (
                            <span className="inline-block text-[8.5px] font-bold text-amber-400 bg-background/90 backdrop-blur-md px-1 py-0.5 rounded-md border border-amber-500/40">
                              Tot: {num(globalStock)}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* CONTROLES DE PAGINAÇÃO SE HOUVER MAIS DE 18 PRODUTOS */}
              {totalProductPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {(safeProductPage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(safeProductPage * PRODUCTS_PER_PAGE, activeProducts.length)} de {activeProducts.length} itens cadastrados
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs rounded-xl"
                      disabled={safeProductPage <= 1}
                      onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalProductPages }, (_, i) => i + 1).map((pageNum) => (
                        <Button
                          key={pageNum}
                          type="button"
                          variant={safeProductPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-8 w-8 p-0 text-xs font-mono font-bold rounded-xl",
                            safeProductPage === pageNum ? "bg-primary text-primary-foreground shadow-sm" : ""
                          )}
                          onClick={() => setProductPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs rounded-xl"
                      disabled={safeProductPage >= totalProductPages}
                      onClick={() => setProductPage((p) => Math.min(totalProductPages, p + 1))}
                    >
                      Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* PAINEL DO LOTE EM PREPARAÇÃO COM EDIÇÃO INLINE DE QUANTIDADES */}
            <div className={cn(
              "space-y-4 rounded-2xl border p-3.5 sm:p-5 transition-all shadow-md mt-4 w-full max-w-full overflow-hidden",
              queue.length > 0
                ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                : "border-border/60 bg-secondary/20"
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary animate-pulse shrink-0" />
                  <div>
                    <h4 className="text-sm font-extrabold text-foreground">
                      Lote Selecionado ({queue.length} {queue.length === 1 ? "produto" : "produtos"})
                    </h4>
                    <p className="text-[0.65rem] text-muted-foreground">
                      Ajuste as quantidades diretamente abaixo de cada item antes de confirmar.
                    </p>
                  </div>
                </div>

                {queue.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 rounded-lg font-bold shrink-0 self-start sm:self-auto"
                    onClick={() => setQueue([])}
                  >
                    Desmarcar Todos
                  </Button>
                )}
              </div>

              {/* BANNER DE DESTAQUE: TIPO DE MOVIMENTAÇÃO & BAÚ(S) ENVOLVIDOS */}
              <div className="rounded-xl border border-border/80 bg-background/90 p-3 sm:p-3.5 space-y-2.5 shadow-inner w-full max-w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Operação em Lote:
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] sm:text-xs px-2.5 py-1 font-black tracking-wide rounded-lg uppercase shadow-sm flex items-center gap-1 max-w-full truncate",
                        type === "saida"
                          ? "border-rose-500/50 bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30"
                          : type === "entrada"
                          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                          : "border-sky-500/50 bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30"
                      )}
                    >
                      {type === "saida"
                        ? "🔻 SAÍDA DE ESTOQUE (-)"
                        : type === "entrada"
                        ? "🟢 ENTRADA DE ESTOQUE (+)"
                        : "⇄ TRANSFERÊNCIA ENTRE BAÚS"}
                    </Badge>
                  </div>

                  {/* DESTACAR BAÚ OPERACIONAL / RETIRADA / ORIGEM E DESTINO */}
                  {type !== "transferencia" ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                      <span className="text-muted-foreground text-[0.7rem]">
                        {type === "saida" ? "Baú de Retirada:" : "Baú de Depósito:"}
                      </span>
                      <Badge variant="secondary" className="font-extrabold text-xs px-2.5 py-0.5 rounded-lg border border-border bg-secondary text-foreground flex items-center gap-1 truncate max-w-full">
                        <Box className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{baus.find((b) => b.id === selectedBauId)?.nome || "Selecione um Baú"}</span>
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold w-full sm:w-auto">
                      <Badge variant="outline" className="border-rose-500/50 bg-rose-500/10 text-rose-400 font-extrabold text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 truncate max-w-full">
                        <span>De:</span>
                        <span className="truncate">{baus.find((b) => b.id === fromBauId)?.nome || "Origem"}</span>
                      </Badge>

                      <ArrowRightLeft className="h-3.5 w-3.5 text-sky-400 shrink-0" />

                      <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-extrabold text-xs px-2 py-0.5 rounded-lg flex items-center gap-1 truncate max-w-full">
                        <span>Para:</span>
                        <span className="truncate">{baus.find((b) => b.id === toBauId)?.nome || "Destino"}</span>
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* LISTA DE PRODUTOS NO LOTE COM O MESMO FORMATO DE CARD ESTILO INVENTÁRIO GTA RP */}
              {queue.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground italic space-y-1">
                  <p className="font-bold text-foreground not-italic">Nenhum produto selecionado no lote.</p>
                  <p>Toque em um ou mais produtos na grade acima para montá-lo instantaneamente.</p>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {paginatedQueue.map((item) => {
                    const prod = products.find((p) => p.id === item.productId);
                    if (!prod) return null;
                    const stockInChest = getProductStockInChest(prod.id, activeBauId);
                    const isOverStock = (type === "saida" || type === "transferencia") && item.quantity > stockInChest;

                    return (
                      <div
                        key={item.productId}
                        className={cn(
                          "relative flex flex-col rounded-2xl border bg-card shadow-sm transition-all overflow-hidden p-2.5 gap-2",
                          isOverStock
                            ? "border-rose-500/60 bg-rose-500/5 ring-1 ring-rose-500/30"
                            : "border-primary/40 bg-primary/5 hover:border-primary/70 shadow-md"
                        )}
                      >
                        {/* CARD VISUAL IDÊNTICO AO DA PARTE DE PRODUTOS */}
                        <div className="relative flex flex-col items-center justify-center rounded-xl border border-border/70 bg-background/90 aspect-square overflow-hidden select-none w-full">
                          {/* NOME DO PRODUTO NO CANTO SUPERIOR ESQUERDO */}
                          <div className="absolute top-1.5 left-1.5 z-10 max-w-[72%] pointer-events-none">
                            <span className="inline-block font-extrabold text-[10px] sm:text-[11px] text-foreground bg-background/85 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-border/70 shadow-sm truncate max-w-full leading-tight">
                              {prod.nome}
                            </span>
                          </div>

                          {/* BOTÃO DE REMOVER NO CANTO SUPERIOR DIREITO */}
                          <div className="absolute top-1.5 right-1.5 z-10">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-md shadow-sm bg-background/80 backdrop-blur-md"
                              onClick={() => setQueue((q) => q.filter((i) => i.productId !== item.productId))}
                              title="Remover do lote"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* IMAGEM DO PRODUTO CENTRALIZADA */}
                          <div className="w-full h-full flex items-center justify-center p-2.5 my-auto pointer-events-none">
                            {prod.imagem_url ? (
                              <img
                                src={prod.imagem_url}
                                alt={prod.nome}
                                className="max-h-16 sm:max-h-20 w-auto object-contain drop-shadow-md transition-transform duration-200"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/50 border border-border/60 text-primary/70">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>

                          {/* QUANTIDADE NO CANTO INFERIOR DIREITO */}
                          <div className="absolute bottom-1.5 right-1.5 z-10 pointer-events-none">
                            <span className="inline-flex items-center justify-center font-mono font-black text-[11px] sm:text-xs px-1.5 py-0.5 rounded-md border shadow-md backdrop-blur-md bg-primary text-primary-foreground border-primary/50 shadow-primary/30">
                              {num(item.quantity)}x
                            </span>
                          </div>

                          {/* SALDO DISPONÍVEL NO CANTO INFERIOR ESQUERDO */}
                          {canViewBalances && (
                            <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
                              <span
                                className={cn(
                                  "inline-block text-[8.5px] font-bold bg-background/85 backdrop-blur-md px-1 py-0.5 rounded border leading-none",
                                  isOverStock ? "text-rose-400 border-rose-500/50" : "text-muted-foreground border-border/60"
                                )}
                              >
                                {isOverStock ? "⚠️ Falta saldo" : `Disp: ${num(stockInChest)}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* CONTROLES DE QUANTIDADE EMBUTIDOS ABAIXO DO CARD (CAMPO FULL-WIDTH PERFEITO PARA 4+ DÍGITOS) */}
                        <div className="space-y-1.5 pt-1">
                          {/* LINHA 1: CAMPO NUMÉRICO DEDICADO 100% DE LARGURA (PERFEITO PARA DIGITAR 4+ DÍGITOS) */}
                          <div className="w-full">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQueueQuantity(item.productId, Number(e.target.value) || 1)}
                              className="h-9 w-full text-center text-sm font-black font-mono rounded-xl border-primary/50 bg-background text-foreground shadow-inner px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-primary"
                              placeholder="Qtd"
                            />
                          </div>

                          {/* LINHA 2: CONTROLES DE PASSO (- / + / MÁX) EM GRID COM ZERO OVERFLOW */}
                          <div
                            className={cn(
                              "grid gap-1 w-full",
                              type === "saida" || type === "transferencia" ? "grid-cols-3" : "grid-cols-2"
                            )}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7.5 w-full min-w-0 px-0 text-xs font-black rounded-xl bg-secondary/70 hover:bg-secondary border-border/80"
                              onClick={() => handleUpdateQueueQuantity(item.productId, item.quantity - 1)}
                              title="Diminuir 1"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7.5 w-full min-w-0 px-0 text-xs font-black rounded-xl bg-secondary/70 hover:bg-secondary border-border/80"
                              onClick={() => handleUpdateQueueQuantity(item.productId, item.quantity + 1)}
                              title="Aumentar 1"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>

                            {(type === "saida" || type === "transferencia") && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7.5 w-full min-w-0 px-0 text-[10.5px] sm:text-xs font-black text-primary border-primary/40 rounded-xl bg-primary/10 hover:bg-primary/20 truncate shadow-2xs"
                                onClick={() => handleUpdateQueueQuantity(item.productId, Math.max(1, stockInChest))}
                                title={`Usar saldo máximo (${num(stockInChest)})`}
                              >
                                MÁX
                              </Button>
                            )}
                          </div>

                          {/* LINHA 3: ATALHOS RÁPIDOS DE QUANTIDADE (BOTÕES GRANDES EM GRID, SEM NENHUMA BARRA DE ROLAGEM) */}
                          <div className="grid grid-cols-4 gap-1 pt-0.5 w-full">
                            {[1, 5, 10, 25, 50, 100, 250, 500].map((q) => (
                              <Button
                                key={q}
                                type="button"
                                variant="secondary"
                                size="sm"
                                className={cn(
                                  "h-7 w-full min-w-0 px-0 text-[11px] font-black rounded-xl transition-all active:scale-95 border",
                                  item.quantity === q
                                    ? "bg-primary text-primary-foreground border-primary/50 shadow-md font-black ring-1 ring-primary/40"
                                    : "bg-secondary/70 border-border/60 hover:border-primary/40 hover:bg-primary/15 text-foreground/80 hover:text-foreground"
                                )}
                                onClick={() => handleUpdateQueueQuantity(item.productId, q)}
                              >
                                {q}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* CONTROLES DE PAGINAÇÃO SE HOUVER MAIS DE 12 ITENS NO LOTE */}
              {totalQueuePages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Mostrando {(safeQueuePage - 1) * QUEUE_PER_PAGE + 1}–{Math.min(safeQueuePage * QUEUE_PER_PAGE, queue.length)} de {queue.length} produtos no lote
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs rounded-xl"
                      disabled={safeQueuePage <= 1}
                      onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalQueuePages }, (_, i) => i + 1).map((pageNum) => (
                        <Button
                          key={pageNum}
                          type="button"
                          variant={safeQueuePage === pageNum ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-8 w-8 p-0 text-xs font-mono font-bold rounded-xl",
                            safeQueuePage === pageNum ? "bg-primary text-primary-foreground shadow-sm" : ""
                          )}
                          onClick={() => setQueuePage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs rounded-xl"
                      disabled={safeQueuePage >= totalQueuePages}
                      onClick={() => setQueuePage((p) => Math.min(totalQueuePages, p + 1))}
                    >
                      Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}

              {/* OBSERVAÇÃO DO LOTE E BOTÃO MASTER DE CONFIRMAÇÃO */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <Input
                  placeholder="Motivo / Observação do Lote (ex.: Reposição de Ação, Entrega de Carga...)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-background"
                />

                {(() => {
                  const totalBatchCount = queue.length + (selectedProductId && !queue.some((i) => i.productId === selectedProductId) ? 1 : 0);
                  const itemsText = totalBatchCount === 1 ? "1 item" : `${totalBatchCount} itens`;

                  return (
                    <Button
                      className={cn(
                        "w-full h-12 text-white font-extrabold text-xs sm:text-sm shadow-xl hover:opacity-90 rounded-xl transition-all flex items-center justify-center gap-2 px-3 overflow-hidden text-center leading-none",
                        type === "entrada"
                          ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-950/20"
                          : type === "saida"
                          ? "bg-rose-600 hover:bg-rose-700 shadow-rose-950/20"
                          : "bg-sky-600 hover:bg-sky-700 shadow-sky-950/20"
                      )}
                      onClick={() => submitBatchMutation.mutate()}
                      disabled={submitBatchMutation.isPending || (queue.length === 0 && !selectedProductId)}
                    >
                      {submitBatchMutation.isPending ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      )}
                      <span className="truncate">CONFIRMAR LOTE ({itemsText})</span>
                    </Button>
                  );
                })()}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )}

      {/* MODAL DE HISTÓRICO DE MOVIMENTAÇÕES (Abre através do botão dos baús ou pelo cabeçalho) */}
      <MovementHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        initialBauId={historyBauId}
      />

      {/* MODAL: VER SALDO E INVENTÁRIO DO BAÚ */}
      <Dialog open={balanceModalOpen} onOpenChange={setBalanceModalOpen}>
        <DialogContent className="max-w-4xl bg-card border-border/80 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[88vh]">
          {/* HEADER COM FOTO DE PERFIL DO BAÚ */}
          <DialogHeader className="p-4 sm:p-5 border-b border-border/60 bg-secondary/30 space-y-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-secondary/80 border border-border/70 flex items-center justify-center shrink-0 shadow-inner overflow-hidden ring-1 ring-primary/20">
                  <BauIcon
                    foto_url={activeBalanceBau?.foto_url || activeBalanceBau?.imagem_url}
                    icone={activeBalanceBau?.icone}
                    nome={activeBalanceBau?.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2 flex-wrap">
                    <span className="truncate">{activeBalanceBau?.nome || "Inventário do Baú"}</span>
                    {activeBalanceBau?.tipo_gestao === "manual" ? (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-bold">
                        ✍️ Manual
                      </Badge>
                    ) : (
                      <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] font-bold">
                        🤖 Automático (Discord)
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground truncate">
                    {activeBalanceBau?.descricao || "Saldos atuais e produtos alocados neste baú."}
                  </DialogDescription>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 shrink-0 text-right">
                <div className="p-2 rounded-xl bg-secondary/40 border border-border/50 text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Total em Estoque</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {num(activeBalanceInventory.reduce((acc, i) => acc + (i.stock > 0 ? i.stock : 0), 0))} un.
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Search, Filter Tabs and View Mode Toggle */}
          <div className="p-3 sm:p-4 border-b border-border/40 bg-secondary/15 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar item ou categoria no baú..."
                value={balanceSearch}
                onChange={(e) => setBalanceSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl bg-background/80"
              />
              {balanceSearch && (
                <button
                  type="button"
                  onClick={() => setBalanceSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={balanceFilter === "positive" ? "default" : "outline"}
                  onClick={() => setBalanceFilter("positive")}
                  className="text-[11px] h-7 px-2.5 rounded-lg cursor-pointer"
                >
                  Com Saldo ({activeBalanceInventory.filter((i) => i.stock > 0).length})
                </Button>
                <Button
                  size="sm"
                  variant={balanceFilter === "all" ? "default" : "outline"}
                  onClick={() => setBalanceFilter("all")}
                  className="text-[11px] h-7 px-2.5 rounded-lg cursor-pointer"
                >
                  Todos ({activeBalanceInventory.length})
                </Button>
                <Button
                  size="sm"
                  variant={balanceFilter === "zero" ? "default" : "outline"}
                  onClick={() => setBalanceFilter("zero")}
                  className="text-[11px] h-7 px-2.5 rounded-lg cursor-pointer"
                >
                  Zerados ({activeBalanceInventory.filter((i) => i.stock <= 0).length})
                </Button>
              </div>

              {/* Grid / List Mode Switcher */}
              <div className="flex items-center gap-0.5 border border-border/60 bg-secondary/50 p-0.5 rounded-lg">
                <Button
                  size="sm"
                  variant={balanceViewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setBalanceViewMode("grid")}
                  className={cn(
                    "h-6 w-7 p-0 rounded-md cursor-pointer",
                    balanceViewMode === "grid" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Visualização em Grade"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant={balanceViewMode === "list" ? "default" : "ghost"}
                  onClick={() => setBalanceViewMode("list")}
                  className={cn(
                    "h-6 w-7 p-0 rounded-md cursor-pointer",
                    balanceViewMode === "list" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Visualização em Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Body: Responsive Product Grid or List View */}
          <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 max-h-[56vh]">
            {filteredBalanceItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs space-y-2.5">
                <PackageSearch className="w-10 h-10 mx-auto opacity-40 text-primary animate-pulse" />
                <p className="font-bold text-foreground text-sm">Nenhum item encontrado no baú</p>
                <p className="text-[11px] max-w-xs mx-auto">
                  {balanceSearch ? `Nenhum resultado para "${balanceSearch}". Tente outro termo.` : "Nenhum item atende aos filtros de saldo selecionados."}
                </p>
              </div>
            ) : balanceViewMode === "grid" ? (
              /* GRID VIEW COM IMAGEM DO ITEM */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredBalanceItems.map(({ product, stock, categoryName }) => {
                  const hasStock = stock > 0;
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "group relative rounded-xl border p-3 flex flex-col justify-between transition-all duration-200 shadow-xs",
                        hasStock
                          ? "bg-card/70 border-border/70 hover:border-primary/50 hover:bg-card/90 hover:shadow-md"
                          : "bg-secondary/20 border-border/40 opacity-70 hover:opacity-100"
                      )}
                    >
                      <div className="space-y-2.5">
                        {/* Imagem do Produto com Destaque e Hover Zoom */}
                        <div className="w-full flex justify-center py-1">
                          <div className="relative p-1.5 rounded-xl bg-secondary/50 border border-border/60 group-hover:border-primary/40 group-hover:scale-105 transition-all shadow-inner">
                            <ProductThumbnail
                              src={product.imagem_url}
                              name={product.nome}
                              size="xl"
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Detalhes do Produto */}
                        <div className="space-y-0.5 text-center">
                          <span className="text-[10px] text-primary/80 font-bold uppercase tracking-wider block truncate">
                            {categoryName}
                          </span>
                          <h4
                            className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[2.2em]"
                            title={product.nome}
                          >
                            {product.nome}
                          </h4>
                        </div>
                      </div>

                      {/* Badge de Saldo / Unidades */}
                      <div className="pt-2.5 mt-auto">
                        <div
                          className={cn(
                            "text-xs font-mono font-bold px-2 py-1 rounded-lg text-center border shadow-xs flex items-center justify-center gap-1",
                            hasStock
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-secondary/50 text-muted-foreground border-border/60"
                          )}
                        >
                          <span className="truncate">
                            {num(stock)} {product.unidade || "un"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="divide-y divide-border/40 space-y-1">
                {filteredBalanceItems.map(({ product, stock, categoryName }) => {
                  const hasStock = stock > 0;
                  return (
                    <div
                      key={product.id}
                      className="py-2 px-2.5 flex items-center justify-between rounded-lg hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ProductThumbnail
                          src={product.imagem_url}
                          name={product.nome}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                            {product.nome}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {categoryName}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-mono font-bold px-2.5 py-1",
                            hasStock
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-secondary/60 text-muted-foreground border-border/60"
                          )}
                        >
                          {num(stock)} {product.unidade || "un"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FOOTER DO MODAL */}
          <DialogFooter className="p-3 sm:p-4 border-t border-border/40 bg-secondary/20 flex flex-col sm:flex-row sm:justify-between items-center gap-2">
            <div className="text-[11px] text-muted-foreground w-full sm:w-auto text-center sm:text-left">
              Total exibido: <strong>{filteredBalanceItems.length}</strong> itens (
              <strong className="text-emerald-400">
                {filteredBalanceItems.filter((i) => i.stock > 0).length}
              </strong>{" "}
              com saldo)
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
              {canView && activeBalanceBau && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBalanceModalOpen(false);
                    setHistoryBauId(activeBalanceBau.id);
                    setHistoryModalOpen(true);
                  }}
                  className="text-xs font-bold gap-1.5 border-border/80 hover:border-sky-500/50 hover:bg-sky-500/10 text-foreground cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-sky-400" />
                  <span>Histórico do Baú</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBalanceModalOpen(false)}
                className="text-xs cursor-pointer"
              >
                Fechar
              </Button>
              {activeBalanceBau?.tipo_gestao === "manual" && canMove && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setBalanceModalOpen(false);
                    if (activeBalanceBau) handleStartMovementOnBau(activeBalanceBau.id);
                  }}
                  className="text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-sm"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Movimentar Baú
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
