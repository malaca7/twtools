import { useState, useEffect, useMemo, useRef } from "react";
import { createFileRoute, Outlet, useChildMatches, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  ArrowRight,
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
  DollarSign,
  Sparkles,
  SlidersHorizontal,
  Info,
  Calendar,
  Hash,
  Radio,
  Activity,
  TrendingUp,
  Bot,
  User,
  Clock,
  Coins,
  BarChart3,
  PieChart,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  Copy,
  ArrowUpRight,
  ArrowDownRight,
  Layers2,
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
import { useModalTitle } from "@/hooks/usePageTitle";
import { evaluateBauAccess } from "@/lib/bauPermissions";
import {
  useMovements,
  useProducts,
  useBaus,
  useProductBaus,
  useCategories,
  useMembers,
  useDiscordStockConfig,
  nameOf,
  productName,
} from "@/hooks/useData";
import { batchSubmitMovements, submitChestTransfer } from "@/lib/app-api";
import { currency, compactCurrency, dateTime, errorMessage, num } from "@/lib/format";
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
  const canViewPage = hasPermission("view_movements");

  if (!canViewPage) return <NoAccess />;
  return <MovimentacoesContent />;
}

function MovimentacoesContent() {
  const { hasPermission, level, profile, memberTags, isDevUser, isCeoUser } = useAuth();
  const queryClient = useQueryClient();
  const canViewPage = hasPermission("view_movements");
  const canMove = hasPermission("create_movement");
  const canView = hasPermission("view_all_movements");
  const canReverse = hasPermission("reverse_movement");
  const canViewBalances = hasPermission("view_movement_balances");
  const canViewBaus = hasPermission("view_movement_baus");
  const canManageBaus = hasPermission("manage_baus");

  const { data: movements = [], isLoading: loadingMovements } = useMovements();
  const { data: products = [] } = useProducts();
  const { data: baus = [] } = useBaus();
  const { data: productBaus = [] } = useProductBaus();
  const { data: categories = [] } = useCategories();
  const { data: members = [] } = useMembers();
  const { data: discordConfig } = useDiscordStockConfig();

  // Contexto de permissão do usuário atual para baús
  const userAuthContext = useMemo(
    () => ({
      level,
      customRoleId: profile?.custom_role_id,
      tagIds: memberTags.map((t) => t.id),
      tagNames: memberTags.map((t) => t.name),
      isDevUser,
      isCeoUser,
      canManage: canManageBaus,
    }),
    [level, profile?.custom_role_id, memberTags, isDevUser, isCeoUser, canManageBaus]
  );

  // Filtragem de baús visíveis para este membro (respeita regra de ocultar se configurado)
  const visibleBaus = useMemo(() => {
    return baus.filter((b) => evaluateBauAccess(b, userAuthContext).canView);
  }, [baus, userAuthContext]);

  // Filtragem estrita de baús ativos vs inativos para este usuário
  const activeBaus = useMemo(
    () => visibleBaus.filter((b) => evaluateBauAccess(b, userAuthContext).isActiveForUser),
    [visibleBaus, userAuthContext]
  );
  const inactiveBaus = useMemo(
    () => visibleBaus.filter((b) => !evaluateBauAccess(b, userAuthContext).isActiveForUser),
    [visibleBaus, userAuthContext]
  );
  const [showInactiveBaus, setShowInactiveBaus] = useState(false);

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

  // Auto-selecionar baú padrão ativo para movimentações
  useEffect(() => {
    const listToPick = activeBaus.length > 0 ? activeBaus : visibleBaus;
    if (listToPick.length > 0) {
      if (!selectedBauId || !listToPick.some((b) => b.id === selectedBauId)) {
        const defaultBau = listToPick[0];
        if (defaultBau) setSelectedBauId(defaultBau.id);
      }
      if (!fromBauId || !listToPick.some((b) => b.id === fromBauId)) {
        if (listToPick[0]) setFromBauId(listToPick[0].id);
      }
      if (!toBauId || toBauId === fromBauId || !listToPick.some((b) => b.id === toBauId)) {
        const otherBau = listToPick.find((b) => b.id !== (fromBauId || listToPick[0]?.id)) || listToPick[1] || listToPick[0];
        if (otherBau) setToBauId(otherBau.id);
      }
    }
  }, [activeBaus, visibleBaus, selectedBauId, fromBauId, toBauId]);

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

  // Estados para Modal de Saldo / Produtos do Baú
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceBauId, setBalanceBauId] = useState<string | null>(null);
  const [balanceSearch, setBalanceSearch] = useState("");
  const [balanceStockFilter, setBalanceStockFilter] = useState<"com_saldo" | "sem_saldo" | "todos">("com_saldo");
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

  // Paginação da seleção de produtos (28 itens por página para grade compacta)
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 28;

  useEffect(() => {
    setProductPage(1);
  }, [prodSearch, selectedCategoryId]);

  const totalProductPages = Math.ceil(activeProducts.length / PRODUCTS_PER_PAGE) || 1;
  const safeProductPage = Math.min(Math.max(1, productPage), totalProductPages);
  const paginatedProducts = activeProducts.slice(
    (safeProductPage - 1) * PRODUCTS_PER_PAGE,
    safeProductPage * PRODUCTS_PER_PAGE
  );

  // Paginação da lista do lote selecionado (18 itens por página para visualização compacta)
  const [queuePage, setQueuePage] = useState(1);
  const QUEUE_PER_PAGE = 18;

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
      setActiveMovementBauId(null);
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
    const stats: Record<string, { itemsCount: number; totalUnits: number; totalValue: number; positiveCount: number }> = {};
    for (const b of baus) {
      let itemsCount = 0;
      let totalUnits = 0;
      let totalValue = 0;
      let positiveCount = 0;
      for (const p of products) {
        if (p.ativo === false) continue;
        const stock = getProductStockInChest(p.id, b.id);
        itemsCount += 1;
        if (stock > 0) {
          positiveCount += 1;
          totalUnits += stock;
          totalValue += stock * Number(p.preco_sugerido || 0);
        }
      }
      stats[b.id] = { itemsCount, totalUnits, totalValue, positiveCount };
    }
    return stats;
  }, [baus, products, productBaus, movements]);

  // Abertura do modal de visualização de saldo e produtos do baú
  const handleOpenBalance = (targetBauId: string) => {
    setBalanceBauId(targetBauId);
    setBalanceSearch("");
    setBalanceStockFilter("com_saldo");
    setBalanceModalOpen(true);
  };

  // Disparo de movimentação a partir do card do baú (Apenas para baús manuais e ativos)
  const handleStartMovementOnBau = (targetBauId: string) => {
    const target = baus.find((b) => b.id === targetBauId);
    if (!target || target.ativo === false) {
      toast.error("Este baú está inativo e não pode receber movimentações.");
      return;
    }
    setActiveMovementBauId(targetBauId);
    setSelectedBauId(targetBauId);
    setFromBauId(targetBauId);
    if (type === "transferencia" && toBauId === targetBauId) {
      const other = activeBaus.find((b) => b.id !== targetBauId);
      if (other) setToBauId(other.id);
    }
    setQueue([]);
  };

  const activeMovementBauObj = baus.find((b) => b.id === activeMovementBauId);

  // Dados do baú ativo no modal de saldo
  const activeBalanceBau = baus.find((b) => b.id === balanceBauId);

  // Personalização dinâmica da barra de título (document.title) ao abrir popups
  useModalTitle(
    activeBalanceBau?.nome ? `Saldo: ${activeBalanceBau.nome}` : "Saldo do Baú",
    balanceModalOpen
  );
  useModalTitle(
    activeMovementBauObj?.nome ? `Movimentar: ${activeMovementBauObj.nome}` : "Movimentar Itens",
    activeMovementBauId !== null
  );
  const activeBalanceInventory = useMemo(() => {
    if (!balanceBauId) return [];
    return products
      .filter((p) => p.ativo !== false)
      .map((p) => {
        const stock = getProductStockInChest(p.id, balanceBauId);
        return {
          product: p,
          stock,
        };
      });
  }, [balanceBauId, products, productBaus, movements, baus]);

  // Contadores de produtos com saldo / sem saldo no baú ativo
  const balanceCounts = useMemo(() => {
    let comSaldo = 0;
    let semSaldo = 0;
    for (const item of activeBalanceInventory) {
      if (item.stock > 0) comSaldo++;
      else semSaldo++;
    }
    return {
      comSaldo,
      semSaldo,
      total: activeBalanceInventory.length,
    };
  }, [activeBalanceInventory]);

  const filteredBalanceItems = useMemo(() => {
    let list = activeBalanceInventory.filter((item) => {
      // Filtro de saldo: com_saldo, sem_saldo ou todos
      if (balanceStockFilter === "com_saldo" && item.stock <= 0) return false;
      if (balanceStockFilter === "sem_saldo" && item.stock > 0) return false;

      if (balanceSearch.trim()) {
        const q = balanceSearch.toLowerCase().trim();
        const aliases = (item.product.cda_name || "").toLowerCase();
        const matchName = item.product.nome.toLowerCase().includes(q);
        const matchAlias = aliases.includes(q);
        return matchName || matchAlias;
      }
      return true;
    });

    return list.sort((a, b) => b.stock - a.stock || a.product.nome.localeCompare(b.product.nome));
  }, [activeBalanceInventory, balanceStockFilter, balanceSearch]);

  // Lista de baús exibidos na grade (por padrão apenas ativos)
  const displayedBaus = useMemo(() => {
    return showInactiveBaus ? visibleBaus : activeBaus;
  }, [visibleBaus, activeBaus, showInactiveBaus]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Painel de Movimentações"
        description="Lançamentos operacionais de entrada, saída e transferência direta entre baús com botões de ação rápida."
      />

      {/* SEÇÃO 1: CARDS COM TODOS OS BAÚS NO TOPO */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Boxes className="h-5 w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Baús do grupo
            </h2>
            <Badge variant="outline" className="text-[10px] font-bold border-primary/40 text-primary">
              {activeBaus.length} {activeBaus.length === 1 ? "baú ativo" : "baús ativos"}
            </Badge>

            {inactiveBaus.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowInactiveBaus((prev) => !prev)}
                className={cn(
                  "h-6.5 px-2 text-[10.5px] rounded-lg font-bold border transition-all cursor-pointer",
                  showInactiveBaus
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-xs"
                    : "text-muted-foreground border-border/70 hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {showInactiveBaus
                  ? `Ocultar Inativos (${inactiveBaus.length})`
                  : `Mostrar Inativos (${inactiveBaus.length})`}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground hidden lg:inline">
              Dica: <span className="font-semibold text-primary">Clique em qualquer card</span> para ver o saldo completo.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {displayedBaus.map((b) => {
            const isManual = b.tipo_gestao === "manual";
            const isInactive = b.ativo === false;
            const stat = bausStats[b.id] || { itemsCount: 0, totalUnits: 0, totalValue: 0, positiveCount: 0 };
            const isCurrentlySelected = type === "transferencia" ? fromBauId === b.id || toBauId === b.id : selectedBauId === b.id;

            return (
              <Card
                key={b.id}
                onClick={() => handleOpenBalance(b.id)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-sm",
                  isInactive
                    ? "bg-card/60 border-dashed border-rose-500/40 opacity-75 grayscale-[35%] hover:opacity-100 hover:grayscale-0"
                    : "bg-card/95 backdrop-blur-md hover:shadow-2xl",
                  isCurrentlySelected && !isInactive
                    ? "border-primary ring-2 ring-primary/50 shadow-primary/15 shadow-xl scale-[1.01]"
                    : !isInactive && "border-border/70 hover:border-primary/60 hover:-translate-y-1.5"
                )}
              >
                {/* Banner no Card (Modo Retrato) */}
                <div className="relative w-full h-32 sm:h-36 overflow-hidden bg-secondary/80 shrink-0">
                  {b.banner_url ? (
                    <img
                      src={b.banner_url}
                      alt={`Banner ${b.nome}`}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className={cn(
                        "w-full h-full flex items-center justify-center relative overflow-hidden",
                        isManual
                          ? "bg-gradient-to-br from-amber-950/70 via-amber-900/40 to-card"
                          : "bg-gradient-to-br from-cyan-950/70 via-slate-900 to-card"
                      )}
                    >
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                      <Layers className="w-12 h-12 text-foreground/10" />
                    </div>
                  )}

                  {/* Gradiente Overlay suave no Banner */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-black/40 pointer-events-none" />

                  {/* Overlay central quando inativo */}
                  {isInactive && (
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-10">
                      <Badge variant="destructive" className="bg-rose-950/95 text-rose-300 border border-rose-500/60 font-black text-[11px] px-2.5 py-0.5 shadow-xl uppercase tracking-wider">
                        🔒 Baú Inativo
                      </Badge>
                    </div>
                  )}

                  {/* Badges Flutuantes no Topo do Banner */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 z-10">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-md shadow-sm border",
                        isManual
                          ? "bg-black/65 text-amber-400 border-amber-500/40"
                          : "bg-black/65 text-cyan-400 border-cyan-500/40"
                      )}
                    >
                      {isManual ? "✍️ Manual" : "🤖 Automático"}
                    </Badge>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] uppercase font-bold px-2 py-0.5 rounded-lg backdrop-blur-md shadow-sm border",
                        !isInactive
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                          : "bg-rose-950/90 text-rose-300 border-rose-500/60"
                      )}
                    >
                      {!isInactive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>

                {/* Conteúdo do Card em Modo Retrato */}
                <div className="px-4 pb-4 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Foto / Ícone do Baú Sobreposta no Banner */}
                    <div className="-mt-9 mx-auto relative z-10 w-16 h-16 rounded-2xl border-4 border-card bg-secondary/90 flex items-center justify-center shrink-0 shadow-xl overflow-hidden ring-1 ring-border/80 group-hover:ring-primary/60 group-hover:scale-105 transition-all duration-300">
                      <BauIcon
                        foto_url={b.foto_url || b.imagem_url}
                        icone={b.icone}
                        nome={b.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Título e Descrição */}
                    <div className="text-center mt-2.5 space-y-1">
                      <h3
                        className="font-black text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate px-1"
                        title={b.nome}
                      >
                        {b.nome}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 px-1 min-h-[30px] leading-relaxed">
                        {b.descricao || (isManual ? "Baú operacional manual com lançamentos livres." : "Sincronizado automaticamente com os logs do Discord.")}
                      </p>
                    </div>
                  </div>

                  {/* Resumo de Métricas em Cápsulas */}
                  <div className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-secondary/40 border border-border/50 text-center shadow-inner">
                    <div className="p-1 flex flex-col justify-center min-w-0">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block truncate">
                        Itens
                      </span>
                      <strong className="text-xs sm:text-sm font-black text-foreground font-mono mt-0.5 truncate">
                        {num(stat.positiveCount)}
                      </strong>
                    </div>

                    <div className="p-1 flex flex-col justify-center border-x border-border/40 min-w-0">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block truncate">
                        Volume
                      </span>
                      <strong
                        className={cn(
                          "text-xs sm:text-sm font-black font-mono mt-0.5 truncate",
                          stat.totalUnits > 0 ? "text-emerald-400" : "text-muted-foreground"
                        )}
                      >
                        {num(stat.totalUnits)}
                      </strong>
                    </div>

                    <div className="p-1 flex flex-col justify-center min-w-0" title={currency(stat.totalValue)}>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block truncate">
                        Valor
                      </span>
                      <strong className="text-[10px] sm:text-xs font-black text-emerald-400 font-mono mt-0.5 truncate block">
                        {Number(stat.totalValue || 0) === 0
                          ? "R$ 0"
                          : Number(stat.totalValue || 0) >= 10000
                          ? compactCurrency(stat.totalValue)
                          : currency(stat.totalValue)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Rodapé de Ações do Card */}
                <div className="px-3.5 py-3 bg-secondary/25 border-t border-border/50 flex items-center justify-between gap-1.5">
                  <div
                    onClick={() => handleOpenBalance(b.id)}
                    className="flex items-center gap-1 text-xs text-primary font-bold group-hover:translate-x-1 transition-transform duration-200 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] sm:text-xs">Ver Saldo</span>
                    <ArrowRight className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Botão Histórico do Baú */}
                    {canView && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistoryBauId(b.id);
                              setHistoryModalOpen(true);
                            }}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-xl text-muted-foreground hover:text-sky-400 hover:border-sky-500/50 hover:bg-sky-500/10 transition-colors cursor-pointer shadow-xs"
                            aria-label={`Histórico do baú ${b.nome}`}
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs font-semibold">
                          Histórico de Movimentações
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Botão Movimentar (Apenas para baús manuais e ativos) */}
                    {isManual && canMove && (
                      !isInactive ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartMovementOnBau(b.id);
                              }}
                              className={cn(
                                "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-xl text-primary-foreground shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0",
                                activeMovementBauId === b.id
                                  ? "bg-amber-500 hover:bg-amber-600 ring-2 ring-amber-400 text-slate-900"
                                  : "bg-primary hover:bg-primary/90"
                              )}
                              aria-label={`Movimentar baú ${b.nome}`}
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs font-semibold">
                            Lançar Movimentação
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-xl text-muted-foreground opacity-40 cursor-not-allowed border-rose-500/30"
                              aria-label="Baú inativo"
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs font-semibold">
                            Baú Inativo (Bloqueado)
                          </TooltipContent>
                        </Tooltip>
                      )
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* MODAL DE MOVIMENTAÇÃO OPERACIONAL (POPUP IGUAL SALDO E HISTÓRICO) */}
      <Dialog
        open={Boolean(canMove && activeMovementBauId && activeMovementBauObj)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveMovementBauId(null);
            setQueue([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl sm:max-w-5xl bg-card border-border/80 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[92vh]">
          {/* HEADER DO POPUP */}
          <DialogHeader className="p-3.5 sm:p-5 border-b border-border/60 bg-gradient-to-r from-secondary/40 via-secondary/20 to-secondary/40 space-y-0 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8 sm:pr-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-secondary/80 border border-border/80 flex items-center justify-center shrink-0 shadow-inner overflow-hidden ring-2 ring-primary/20">
                  <BauIcon
                    foto_url={activeMovementBauObj?.foto_url || activeMovementBauObj?.imagem_url}
                    icone={activeMovementBauObj?.icone}
                    nome={activeMovementBauObj?.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-black text-foreground truncate flex items-center gap-2">
                    {activeMovementBauObj?.nome ? `Movimentar: ${activeMovementBauObj.nome}` : "Movimentação"}
                    <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold">
                      ✋ Modo Manual
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground truncate">
                    Selecione o tipo de movimentação e os produtos para lançar
                  </DialogDescription>
                </div>
              </div>

              {/* SELETOR RÁPIDO DE BAÚ (Permite trocar de baú manual diretamente no popup) */}
              {activeBaus.filter((b) => b.tipo_gestao === "manual").length > 1 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-muted-foreground hidden sm:inline">Baú:</span>
                  <Select
                    value={activeMovementBauId || ""}
                    onValueChange={(newId) => {
                      handleStartMovementOnBau(newId);
                    }}
                  >
                    <SelectTrigger className="h-8.5 text-xs font-semibold rounded-xl bg-background/90 border-border/80 min-w-[150px] shadow-xs">
                      <Boxes className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      <SelectValue placeholder="Trocar Baú" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeBaus
                        .filter((b) => b.tipo_gestao === "manual")
                        .map((b) => (
                          <SelectItem key={b.id} value={b.id} className="text-xs">
                            <span className="font-bold">{b.nome}</span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* BOTÕES DE TIPO ESTILO SEGMENTED CONTROL (ENTRADA VS SAÍDA VS TRANSFERÊNCIA) */}
          <div className="grid grid-cols-3 p-1.5 sm:p-2 bg-secondary/30 border-b border-border/60 gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => { setType("entrada"); setQueue([]); }}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md cursor-pointer active:scale-95",
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
                "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md cursor-pointer active:scale-95",
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
                "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md cursor-pointer active:scale-95",
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

          <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-4 max-h-[calc(92vh-140px)]">
            {/* SELEÇÃO DE BAÚS */}
            {canViewBaus && (
              type !== "transferencia" ? (
                /* MODO ENTRADA / SAÍDA: 1 BAÚ */
                <div className="space-y-1.5">
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

                  <div className="flex flex-wrap gap-1.5">
                    {activeBaus.map((b) => (
                      <Button
                        key={b.id}
                        type="button"
                        variant={selectedBauId === b.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedBauId(b.id)}
                        className={cn(
                          "text-xs h-8 px-3 rounded-xl font-bold flex items-center gap-1.5",
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
                <div className="grid gap-3 sm:grid-cols-2 p-3 sm:p-4 rounded-2xl border border-sky-500/30 bg-sky-500/5">
                  {/* BAÚ ORIGEM */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="h-4 w-4 text-rose-400" /> De onde sai (Baú Origem) *
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeBaus.map((b) => (
                        <Button
                          key={b.id}
                          type="button"
                          variant={fromBauId === b.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setFromBauId(b.id);
                            if (toBauId === b.id) {
                              const other = activeBaus.find((o) => o.id !== b.id);
                              if (other) setToBauId(other.id);
                            }
                          }}
                          className={cn(
                            "text-xs h-7.5 px-2.5 rounded-lg font-bold flex items-center gap-1",
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
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="h-4 w-4 text-emerald-400" /> Para onde vai (Baú Destino) *
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeBaus
                        .filter((b) => b.id !== fromBauId)
                        .map((b) => (
                          <Button
                            key={b.id}
                            type="button"
                            variant={toBauId === b.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setToBauId(b.id)}
                            className={cn(
                              "text-xs h-7.5 px-2.5 rounded-lg font-bold flex items-center gap-1",
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
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 text-center space-y-3 my-2 shadow-inner">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner">
                  🤖
                </div>
                <div className="space-y-1 max-w-lg mx-auto">
                  <h3 className="text-sm font-extrabold text-foreground">
                    Baú com Sincronização 100% Automática via Discord
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    O baú <strong>{type === "transferencia" ? `${fromBau?.nome || "Origem"} / ${toBau?.nome || "Destino"}` : selectedBau?.nome}</strong> opera integrado às logs do canal do Discord. Movimentações manuais comuns estão bloqueadas para este baú para manter a fidelidade do inventário.
                  </p>
                </div>
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                  {hasPermission("estoque.ajustar") ? (
                    <Link to="/dev/estoque">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-md">
                        <Wrench className="w-3.5 h-3.5" /> Acessar Ajustes de Estoque no Painel Dev &rarr;
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
                        className="pl-8 h-7.5 text-xs rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant={selectedCategoryId === "" ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedCategoryId("")}
                      className="text-[11px] h-7 px-2.5 rounded-lg font-semibold"
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
                        className="text-[11px] h-7 px-2.5 rounded-lg font-semibold"
                      >
                        {cat.nome}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* SELETOR DE PRODUTOS COMPACTO */}
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

                  {/* GRADE DE PRODUTOS COMPACTA */}
                  <div className="grid gap-2 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 p-0.5">
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
                            "relative flex flex-col items-center justify-between p-1.5 sm:p-2 rounded-xl border text-left transition-all duration-200 group cursor-pointer aspect-square overflow-hidden select-none",
                            isQueued
                              ? "border-primary bg-primary/15 shadow-md shadow-primary/20 ring-2 ring-primary scale-[1.02]"
                              : "border-border/80 bg-card/60 hover:bg-secondary/60 hover:border-primary/50 hover:shadow-sm hover:scale-[1.02]"
                          )}
                        >
                          {/* NOME DO PRODUTO NO CANTO SUPERIOR ESQUERDO */}
                          <div className="absolute top-1.5 left-1.5 z-10 max-w-[70%] pointer-events-none">
                            <span className="inline-block font-bold text-[9.5px] sm:text-[10px] text-foreground bg-background/85 backdrop-blur-md px-1 py-0.2 rounded border border-border/70 shadow-2xs truncate max-w-full leading-tight">
                              {p.nome}
                            </span>
                          </div>

                          {/* INDICADOR DE SELEÇÃO NO CANTO SUPERIOR DIREITO */}
                          {isQueued && (
                            <div className="absolute top-1.5 right-1.5 z-10 bg-primary text-primary-foreground p-0.5 rounded-md shadow-sm animate-in zoom-in duration-150 pointer-events-none">
                              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 stroke-[3]" />
                            </div>
                          )}

                          {/* IMAGEM DO PRODUTO CENTRALIZADA */}
                          <div className="w-full h-full flex items-center justify-center p-1.5 my-auto pointer-events-none">
                            {p.imagem_url ? (
                              <img
                                src={p.imagem_url}
                                alt={p.nome}
                                className="max-h-12 sm:max-h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary/50 border border-border/60 text-primary/70 group-hover:scale-105 transition-transform">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          {/* QUANTIDADE NO CANTO INFERIOR DIREITO */}
                          <div className="absolute bottom-1.5 right-1.5 z-10 pointer-events-none">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center font-mono font-black text-[9.5px] sm:text-[11px] px-1.5 py-0.5 rounded border shadow-2xs backdrop-blur-md",
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
                            <div className="absolute bottom-1.5 left-1.5 z-10 pointer-events-none">
                              {isQueued ? (
                                <span className="inline-block text-[8px] sm:text-[8.5px] font-bold text-muted-foreground bg-background/85 backdrop-blur-md px-1 py-0.2 rounded border border-border/60">
                                  Disp: {num(stockInChest)}
                                </span>
                              ) : stockInChest === 0 && globalStock > 0 ? (
                                <span className="inline-block text-[8px] sm:text-[8.5px] font-bold text-amber-400 bg-background/90 backdrop-blur-md px-1 py-0.2 rounded border border-amber-500/40">
                                  Tot: {num(globalStock)}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* CONTROLES DE PAGINAÇÃO */}
                  {totalProductPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2.5 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Mostrando {(safeProductPage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(safeProductPage * PRODUCTS_PER_PAGE, activeProducts.length)} de {activeProducts.length} itens cadastrados
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7.5 px-2.5 text-xs rounded-xl"
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
                                "h-7.5 w-7.5 p-0 text-xs font-mono font-bold rounded-xl",
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
                          className="h-7.5 px-2.5 text-xs rounded-xl"
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
                  "space-y-3 rounded-2xl border p-3 sm:p-4 transition-all shadow-md mt-3 w-full max-w-full overflow-hidden",
                  queue.length > 0
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/60 bg-secondary/20"
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-2.5 gap-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4.5 w-4.5 text-primary animate-pulse shrink-0" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
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
                        className="h-6.5 text-xs text-destructive hover:bg-destructive/10 rounded-lg font-bold shrink-0 self-start sm:self-auto cursor-pointer"
                        onClick={() => setQueue([])}
                      >
                        Desmarcar Todos
                      </Button>
                    )}
                  </div>

                  {/* BANNER DE DESTAQUE: TIPO DE MOVIMENTAÇÃO & BAÚ(S) ENVOLVIDOS */}
                  <div className="rounded-xl border border-border/80 bg-background/90 p-2.5 sm:p-3 space-y-2 shadow-inner w-full max-w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[0.65rem] font-extrabold uppercase tracking-wider text-muted-foreground">
                          Operação:
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] sm:text-[11px] px-2 py-0.5 font-black tracking-wide rounded-lg uppercase shadow-sm flex items-center gap-1 max-w-full truncate",
                            type === "saida"
                              ? "border-rose-500/50 bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30"
                              : type === "entrada"
                              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                              : "border-sky-500/50 bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30"
                          )}
                        >
                          {type === "saida"
                            ? "🔻 SAÍDA (-)"
                            : type === "entrada"
                            ? "🟢 ENTRADA (+)"
                            : "⇄ TRANSFERÊNCIA"}
                        </Badge>
                      </div>

                      {/* DESTACAR BAÚ OPERACIONAL / RETIRADA / ORIGEM E DESTINO */}
                      {type !== "transferencia" ? (
                        <div className="flex flex-wrap items-center gap-1 text-xs font-bold">
                          <span className="text-muted-foreground text-[0.7rem]">
                            {type === "saida" ? "Retirada:" : "Depósito:"}
                          </span>
                          <Badge variant="secondary" className="font-extrabold text-[11px] px-2 py-0.5 rounded-lg border border-border bg-secondary text-foreground flex items-center gap-1 truncate max-w-full">
                            <Box className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{baus.find((b) => b.id === selectedBauId)?.nome || "Selecione um Baú"}</span>
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold w-full sm:w-auto">
                          <Badge variant="outline" className="border-rose-500/50 bg-rose-500/10 text-rose-400 font-extrabold text-[11px] px-2 py-0.5 rounded-lg flex items-center gap-1 truncate max-w-full">
                            <span>De:</span>
                            <span className="truncate">{baus.find((b) => b.id === fromBauId)?.nome || "Origem"}</span>
                          </Badge>

                          <ArrowRightLeft className="h-3 w-3 text-sky-400 shrink-0" />

                          <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-extrabold text-[11px] px-2 py-0.5 rounded-lg flex items-center gap-1 truncate max-w-full">
                            <span>Para:</span>
                            <span className="truncate">{baus.find((b) => b.id === toBauId)?.nome || "Destino"}</span>
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* LISTA DE PRODUTOS NO LOTE COM CARDS COMPACTOS */}
                  {queue.length === 0 ? (
                    <div className="py-5 text-center text-xs text-muted-foreground italic space-y-1">
                      <p className="font-bold text-foreground not-italic">Nenhum produto selecionado no lote.</p>
                      <p>Toque em um ou mais produtos na grade acima para montá-lo instantaneamente.</p>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                      {paginatedQueue.map((item) => {
                        const prod = products.find((p) => p.id === item.productId);
                        if (!prod) return null;
                        const stockInChest = getProductStockInChest(prod.id, activeBauId);
                        const isOverStock = (type === "saida" || type === "transferencia") && item.quantity > stockInChest;

                        return (
                          <div
                            key={item.productId}
                            className={cn(
                              "relative flex flex-col rounded-xl border bg-card shadow-xs transition-all overflow-hidden p-2 gap-1.5",
                              isOverStock
                                ? "border-rose-500/60 bg-rose-500/5 ring-1 ring-rose-500/30"
                                : "border-primary/40 bg-primary/5 hover:border-primary/70 shadow-sm"
                            )}
                          >
                            {/* CARD VISUAL DO PRODUTO */}
                            <div className="relative flex flex-col items-center justify-center rounded-lg border border-border/70 bg-background/90 aspect-[4/3] overflow-hidden select-none w-full">
                              {/* NOME DO PRODUTO */}
                              <div className="absolute top-1 left-1 z-10 max-w-[70%] pointer-events-none">
                                <span className="inline-block font-bold text-[9.5px] sm:text-[10px] text-foreground bg-background/85 backdrop-blur-md px-1 py-0.2 rounded border border-border/70 shadow-2xs truncate max-w-full leading-tight">
                                  {prod.nome}
                                </span>
                              </div>

                              {/* BOTÃO DE REMOVER */}
                              <div className="absolute top-1 right-1 z-10">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-md shadow-2xs bg-background/80 backdrop-blur-md cursor-pointer"
                                  onClick={() => setQueue((q) => q.filter((i) => i.productId !== item.productId))}
                                  title="Remover do lote"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                              </div>

                              {/* IMAGEM DO PRODUTO */}
                              <div className="w-full h-full flex items-center justify-center p-1.5 my-auto pointer-events-none">
                                {prod.imagem_url ? (
                                  <img
                                    src={prod.imagem_url}
                                    alt={prod.nome}
                                    className="max-h-11 sm:max-h-14 w-auto object-contain drop-shadow-sm transition-transform duration-200"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/50 border border-border/60 text-primary/70">
                                    <Package className="h-4 w-4" />
                                  </div>
                                )}
                              </div>

                              {/* QUANTIDADE */}
                              <div className="absolute bottom-1 right-1 z-10 pointer-events-none">
                                <span className="inline-flex items-center justify-center font-mono font-black text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded border shadow-2xs backdrop-blur-md bg-primary text-primary-foreground border-primary/50">
                                  {num(item.quantity)}x
                                </span>
                              </div>

                              {/* SALDO DISPONÍVEL */}
                              {canViewBalances && (
                                <div className="absolute bottom-1 left-1 z-10 pointer-events-none">
                                  <span
                                    className={cn(
                                      "inline-block text-[8px] font-bold bg-background/85 backdrop-blur-md px-1 py-0.2 rounded border leading-none",
                                      isOverStock ? "text-rose-400 border-rose-500/50" : "text-muted-foreground border-border/60"
                                    )}
                                  >
                                    {isOverStock ? "⚠️ Falta saldo" : `Disp: ${num(stockInChest)}`}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* CONTROLES DE QUANTIDADE EMBUTIDOS ABAIXO DO CARD */}
                            <div className="space-y-1 pt-0.5">
                              {/* LINHA 1: CAMPO NUMÉRICO */}
                              <div className="w-full">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateQueueQuantity(item.productId, Number(e.target.value) || 1)}
                                  className="h-7 w-full text-center text-xs font-black font-mono rounded-lg border-primary/50 bg-background text-foreground shadow-inner px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-primary"
                                  placeholder="Qtd"
                                />
                              </div>

                              {/* LINHA 2: CONTROLES DE PASSO (- / + / MÁX) */}
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
                                  className="h-6.5 w-full min-w-0 px-0 text-xs font-black rounded-lg bg-secondary/70 hover:bg-secondary border-border/80 cursor-pointer"
                                  onClick={() => handleUpdateQueueQuantity(item.productId, item.quantity - 1)}
                                  title="Diminuir 1"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6.5 w-full min-w-0 px-0 text-xs font-black rounded-lg bg-secondary/70 hover:bg-secondary border-border/80 cursor-pointer"
                                  onClick={() => handleUpdateQueueQuantity(item.productId, item.quantity + 1)}
                                  title="Aumentar 1"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>

                                {(type === "saida" || type === "transferencia") && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6.5 w-full min-w-0 px-0 text-[10px] font-black text-primary border-primary/40 rounded-lg bg-primary/10 hover:bg-primary/20 truncate cursor-pointer shadow-2xs"
                                    onClick={() => handleUpdateQueueQuantity(item.productId, Math.max(1, stockInChest))}
                                    title={`Usar saldo máximo (${num(stockInChest)})`}
                                  >
                                    MÁX
                                  </Button>
                                )}
                              </div>

                              {/* LINHA 3: ATALHOS RÁPIDOS DE QUANTIDADE */}
                              <div className="grid grid-cols-4 gap-1 pt-0.5 w-full">
                                {[1, 5, 10, 25, 50, 100, 250, 500].map((q) => (
                                  <Button
                                    key={q}
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className={cn(
                                      "h-6 w-full min-w-0 px-0 text-[10px] font-black rounded-lg transition-all active:scale-95 border cursor-pointer",
                                      item.quantity === q
                                        ? "bg-primary text-primary-foreground border-primary/50 shadow-xs font-black ring-1 ring-primary/40"
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

                  {/* CONTROLES DE PAGINAÇÃO DO LOTE */}
                  {totalQueuePages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2.5 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Mostrando {(safeQueuePage - 1) * QUEUE_PER_PAGE + 1}–{Math.min(safeQueuePage * QUEUE_PER_PAGE, queue.length)} de {queue.length} produtos no lote
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7.5 px-2.5 text-xs rounded-xl"
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
                                "h-7.5 w-7.5 p-0 text-xs font-mono font-bold rounded-xl",
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
                          className="h-7.5 px-2.5 text-xs rounded-xl"
                          disabled={safeQueuePage >= totalQueuePages}
                          onClick={() => setQueuePage((p) => Math.min(totalQueuePages, p + 1))}
                        >
                          Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* OBSERVAÇÃO DO LOTE E BOTÃO MASTER DE CONFIRMAÇÃO */}
                  <div className="space-y-2.5 pt-2.5 border-t border-border/60">
                    <Input
                      placeholder="Motivo / Observação do Lote (ex.: Reposição de Ação, Entrega de Carga...)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-background"
                    />

                    {(() => {
                      const totalBatchCount = queue.length + (selectedProductId && !queue.some((i) => i.productId === selectedProductId) ? 1 : 0);
                      const itemsText = totalBatchCount === 1 ? "1 item" : `${totalBatchCount} itens`;

                      return (
                        <Button
                          className={cn(
                            "w-full h-11 text-white font-extrabold text-xs sm:text-sm shadow-xl hover:opacity-90 rounded-xl transition-all flex items-center justify-center gap-2 px-3 overflow-hidden text-center leading-none cursor-pointer",
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
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE HISTÓRICO DE MOVIMENTAÇÕES (Abre através do botão dos baús ou pelo cabeçalho) */}
      <MovementHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        initialBauId={historyBauId}
      />

      {/* MODAL: VER SALDO E PRODUTOS DO BAÚ */}
      <Dialog open={balanceModalOpen} onOpenChange={setBalanceModalOpen}>
        <DialogContent className="max-w-4xl bg-card border-border/80 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          {/* HEADER COM FOTO DO BAÚ, TÍTULO E SELETOR RÁPIDO DE BAÚ */}
          <DialogHeader className="p-4 sm:p-5 border-b border-border/60 bg-gradient-to-r from-secondary/40 via-secondary/20 to-secondary/40 space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8 sm:pr-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-secondary/80 border border-border/80 flex items-center justify-center shrink-0 shadow-inner overflow-hidden ring-2 ring-primary/20">
                  <BauIcon
                    foto_url={activeBalanceBau?.foto_url || activeBalanceBau?.imagem_url}
                    icone={activeBalanceBau?.icone}
                    nome={activeBalanceBau?.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-black text-foreground truncate">
                    {activeBalanceBau?.nome ? `Saldo: ${activeBalanceBau.nome}` : "Saldo do Baú"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground truncate">
                    Produtos e quantidades em estoque
                  </DialogDescription>
                </div>
              </div>

              {/* SELETOR RÁPIDO DE BAÚ (PERMITE NAVEGAR ENTRE BAÚS ATIVOS SEM FECHAR O MODAL) */}
              {activeBaus.length > 1 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-muted-foreground hidden sm:inline">Baú:</span>
                  <Select
                    value={balanceBauId || ""}
                    onValueChange={(newId) => {
                      setBalanceBauId(newId);
                      setBalanceSearch("");
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs font-semibold rounded-xl bg-background/90 border-border/80 min-w-[160px] shadow-xs">
                      <Boxes className="w-3.5 h-3.5 mr-1.5 text-primary" />
                      <SelectValue placeholder="Trocar Baú" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeBaus.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="text-xs">
                          <span className="font-bold">{b.nome}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* TOOLBAR: FILTRO DE SALDO + BUSCA + ALTERNADOR DE GRADE/LISTA */}
          <div className="p-3 sm:p-4 border-b border-border/40 bg-secondary/15 space-y-2.5 shrink-0">
            {/* LINHA 1: FILTROS DE ESTOQUE (COM SALDO, SEM SALDO, TODOS) + BOTÕES DE MODO (GRADE/LISTA) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-background/80 border border-border/70 shadow-xs">
                <button
                  type="button"
                  onClick={() => setBalanceStockFilter("com_saldo")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    balanceStockFilter === "com_saldo"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>Com Saldo</span>
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-md",
                    balanceStockFilter === "com_saldo"
                      ? "bg-emerald-500/25 text-emerald-300 font-black"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {balanceCounts.comSaldo}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBalanceStockFilter("sem_saldo")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    balanceStockFilter === "sem_saldo"
                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span>Sem Saldo</span>
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-md",
                    balanceStockFilter === "sem_saldo"
                      ? "bg-rose-500/25 text-rose-300 font-black"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {balanceCounts.semSaldo}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBalanceStockFilter("todos")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    balanceStockFilter === "todos"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  )}
                >
                  <Package className="w-3 h-3 shrink-0" />
                  <span>Todos</span>
                  <span className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-md",
                    balanceStockFilter === "todos"
                      ? "bg-primary-foreground/20 text-primary-foreground font-black"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {balanceCounts.total}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-0.5 border border-border/60 bg-secondary/50 p-1 rounded-xl shrink-0">
                <Button
                  size="sm"
                  variant={balanceViewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setBalanceViewMode("grid")}
                  className={cn(
                    "h-7 w-7 p-0 rounded-lg cursor-pointer",
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
                    "h-7 w-7 p-0 rounded-lg cursor-pointer",
                    balanceViewMode === "list" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Visualização em Lista"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* LINHA 2: CAMPO DE BUSCA */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produto por nome ou tag..."
                value={balanceSearch}
                onChange={(e) => setBalanceSearch(e.target.value)}
                className="pl-9 pr-8 h-8.5 text-xs sm:text-sm rounded-xl bg-background/80 border-border/70 focus-visible:ring-primary/40"
              />
              {balanceSearch && (
                <button
                  type="button"
                  onClick={() => setBalanceSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* BODY: RESPONSIVE PRODUCT GRID OR LIST VIEW */}
          <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 max-h-[60vh]">
            {filteredBalanceItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs space-y-2.5">
                <PackageSearch className="w-10 h-10 mx-auto opacity-40 text-primary animate-pulse" />
                <p className="font-bold text-foreground text-sm">Nenhum produto encontrado</p>
                <p className="text-[11px] max-w-sm mx-auto leading-relaxed">
                  {balanceSearch
                    ? `Nenhum resultado para "${balanceSearch}".`
                    : balanceStockFilter === "com_saldo"
                    ? "Este baú não possui nenhum produto com saldo positivo no momento."
                    : balanceStockFilter === "sem_saldo"
                    ? "Todos os produtos cadastrados possuem saldo positivo neste baú."
                    : "Nenhum produto cadastrado para este baú."}
                </p>
                {balanceStockFilter !== "todos" && !balanceSearch && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBalanceStockFilter("todos")}
                    className="mt-1 text-xs rounded-xl cursor-pointer"
                  >
                    Ver Todos os Produtos ({balanceCounts.total})
                  </Button>
                )}
              </div>
            ) : balanceViewMode === "grid" ? (
              /* GRID VIEW COM DESIGN ELEGANTE E COMPACTO */
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-2.5">
                {filteredBalanceItems.map(({ product, stock }) => {
                  const hasStock = stock > 0;
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "group relative rounded-xl border p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-200 shadow-xs",
                        hasStock
                          ? "bg-gradient-to-b from-card/90 to-secondary/30 border-border/80 hover:border-primary/60 hover:shadow-md hover:-translate-y-0.5"
                          : "bg-secondary/15 border-border/40 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="space-y-1.5">
                        {/* Imagem compacta do produto */}
                        <div className="w-full flex justify-center py-1">
                          <div className="relative p-1.5 rounded-xl bg-secondary/50 border border-border/60 group-hover:border-primary/40 group-hover:scale-105 transition-all shadow-inner">
                            <ProductThumbnail
                              src={product.imagem_url}
                              name={product.nome}
                              size="md"
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Nome do produto */}
                        <div className="text-center">
                          <h4
                            className="text-[11px] sm:text-xs font-bold text-foreground line-clamp-1 leading-tight group-hover:text-primary transition-colors"
                            title={product.nome}
                          >
                            {product.nome}
                          </h4>
                        </div>
                      </div>

                      {/* Cápsula de Estoque */}
                      <div className="pt-1.5 mt-auto">
                        <div
                          className={cn(
                            "text-[10px] sm:text-[11px] font-mono font-bold px-1.5 py-1 rounded-lg text-center border shadow-xs flex items-center justify-center gap-1",
                            hasStock
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-secondary/50 text-muted-foreground border-border/60"
                          )}
                        >
                          {hasStock && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
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
              <div className="space-y-2">
                {filteredBalanceItems.map(({ product, stock }) => {
                  const hasStock = stock > 0;
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "p-2.5 sm:p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                        hasStock
                          ? "bg-card/70 border-border/70 hover:border-primary/50 hover:bg-secondary/30"
                          : "bg-secondary/15 border-border/40 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-1 rounded-xl bg-secondary/50 border border-border/60 shrink-0">
                          <ProductThumbnail
                            src={product.imagem_url}
                            name={product.nome}
                            size="md"
                            className="w-10 h-10 rounded-lg"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-black text-foreground truncate">
                            {product.nome}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-mono font-black px-3 py-1 rounded-xl",
                            hasStock
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
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
          <DialogFooter className="p-3 sm:p-4 border-t border-border/40 bg-secondary/20 flex flex-row justify-end items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBalanceModalOpen(false)}
              className="text-xs cursor-pointer rounded-xl"
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
                className="text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-sm rounded-xl"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Movimentar Baú
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
