import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, NoAccess, TableSkeleton, EmptyState, ProductThumbnail } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
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
  component: MovimentacoesPage,
});

type BatchItem = {
  productId: string;
  quantity: number;
};

const PRODUCTS_PER_PAGE = 18;

function MovimentacoesPage() {
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

  // App State: "entrada" | "saida" | "transferencia"
  const [type, setType] = useState<"entrada" | "saida" | "transferencia">("saida");
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

  // Search filter
  const [prodSearch, setProdSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");

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

  const reverseMutation = useMutation({
    mutationFn: async (movementId: string) => {
      if (!canReverse) throw new Error("Você não possui permissão para estornar movimentações.");
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.rpc("reverse_movement", { _movement_id: movementId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movimentação estornada com sucesso.");
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const filteredLogs = movements.filter((m) => {
    const q = logSearch.toLowerCase().trim();
    if (!q) return true;
    const pName = productName(products, m.product_id).toLowerCase();
    const uName = nameOf(members, m.user_id).toLowerCase();
    return pName.includes(q) || uName.includes(q);
  });

  // Paginação do Histórico de Lançamentos
  const [logPage, setLogPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState<number>(10);

  useEffect(() => {
    setLogPage(1);
  }, [logSearch, logsPerPage]);

  const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const safeLogPage = Math.min(Math.max(1, logPage), totalLogPages);
  const paginatedLogs = filteredLogs.slice(
    (safeLogPage - 1) * logsPerPage,
    safeLogPage * logsPerPage
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Painel de Movimentações"
        description="Lançamentos operacionais de entrada, saída e transferência direta entre baús com botões de ação rápida."
      />

      {/* PAINEL INTERATIVO ESTILO APP */}
      {canMove && (
        <Card className="surface-card border-primary/30 shadow-2xl overflow-hidden">
          {/* BOTÕES GRANDES DE TIPO (ENTRADA VS SAÍDA VS TRANSFERÊNCIA) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 p-2 bg-secondary/40 border-b border-border/60 gap-2">
            <button
              type="button"
              onClick={() => { setType("entrada"); setQueue([]); }}
              className={cn(
                "flex items-center justify-center gap-2.5 py-4 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md",
                type === "entrada"
                  ? "bg-emerald-600 text-white shadow-emerald-600/25 ring-2 ring-emerald-400"
                  : "bg-background/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <ArrowDownCircle className="h-5 w-5" />
              <div className="text-left">
                <p className="font-extrabold text-xs sm:text-sm leading-tight">ENTRADA (+)</p>
                <p className="text-[0.65rem] opacity-80 font-normal">Adicionar novos itens no baú</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setType("saida"); setQueue([]); }}
              className={cn(
                "flex items-center justify-center gap-2.5 py-4 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md",
                type === "saida"
                  ? "bg-rose-600 text-white shadow-rose-600/25 ring-2 ring-rose-400"
                  : "bg-background/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <ArrowUpCircle className="h-5 w-5" />
              <div className="text-left">
                <p className="font-extrabold text-xs sm:text-sm leading-tight">SAÍDA (-)</p>
                <p className="text-[0.65rem] opacity-80 font-normal">Retirar itens do baú</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setType("transferencia"); setQueue([]); }}
              className={cn(
                "flex items-center justify-center gap-2.5 py-4 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 shadow-md",
                type === "transferencia"
                  ? "bg-sky-600 text-white shadow-sky-600/25 ring-2 ring-sky-400"
                  : "bg-background/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              )}
            >
              <ArrowRightLeft className="h-5 w-5" />
              <div className="text-left">
                <p className="font-extrabold text-xs sm:text-sm leading-tight">TRANSFERÊNCIA (⇄)</p>
                <p className="text-[0.65rem] opacity-80 font-normal">Mover itens entre dois baús</p>
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
                        className="text-xs h-9 px-4 rounded-xl font-bold"
                      >
                        📦 {b.nome}
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
                            "text-xs h-8 px-3 rounded-lg font-bold",
                            fromBauId === b.id ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                          )}
                        >
                          📦 {b.nome}
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
                              "text-xs h-8 px-3 rounded-lg font-bold",
                              toBauId === b.id ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                            )}
                          >
                            📦 {b.nome}
                          </Button>
                        ))}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* FILTRO DE CATEGORIAS POR BOTÕES CHIP */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Tags className="h-4 w-4 text-primary" /> {canViewBaus ? (type === "transferencia" ? "3" : "2") : "1"}. Filtrar por Categoria
                </Label>
                <div className="relative w-44 sm:w-56">
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

          </CardContent>
        </Card>
      )}

      {/* TABELA DE HISTÓRICO DE MOVIMENTAÇÕES (Controlado pela permissão Ver Histórico de Lançamentos) */}
      {canView ? (
        <Card className="surface-card border-border/80">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">Histórico de Lançamentos</h2>
                <p className="text-xs text-muted-foreground">
                  Últimas movimentações registradas no estoque.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por produto ou membro..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-secondary/30"
                />
              </div>
            </div>

            {loadingMovements ? (
              <TableSkeleton rows={5} />
            ) : filteredLogs.length === 0 ? (
              <EmptyState
                title="Nenhuma movimentação encontrada"
                description="Ainda não existem registros de movimentação no estoque para este filtro."
              />
            ) : (
              <div className="space-y-3">
                {/* LISTA RESPONSIVA EM CARDS MODERNOS (Sem barra de rolagem lateral) */}
                <div className="space-y-2.5">
                  {paginatedLogs.map((m) => {
                    const isEntrada = m.type === "entrada";
                    const isReversed = !!m.reversal_of || reversedIds.has(m.id);
                    const prodObj = products.find((p) => p.id === m.product_id);
                    const pName = prodObj?.nome || productName(products, m.product_id);
                    const uName = nameOf(members, m.user_id);
                    const bauName = baus.find((b) => b.id === m.bau_id)?.nome || "Baú Geral";

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex flex-col md:flex-row items-start md:items-center justify-between p-3 sm:p-3.5 rounded-xl border bg-card/80 hover:bg-secondary/30 transition-all gap-3 shadow-xs",
                          isReversed ? "opacity-50 bg-secondary/10 border-border/40" : "border-border/70"
                        )}
                      >
                        {/* Esquerda: Produto, Baú, Operador e Data */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <ProductThumbnail src={prodObj?.imagem_url} name={pName} size="sm" />
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs sm:text-sm text-foreground truncate max-w-[200px] sm:max-w-xs">
                                {pName}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-bold px-1.5 py-0 shrink-0",
                                  isEntrada
                                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                    : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                                )}
                              >
                                {isEntrada ? "+ Entrada" : "- Saída"}
                              </Badge>
                              {canViewBaus && (
                                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary px-1.5 py-0 shrink-0">
                                  📦 {bauName}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono flex-wrap">
                              <span>🕒 {dateTime(m.created_at)}</span>
                              <span>•</span>
                              <span>👤 {uName}</span>
                              {m.reason && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[180px] sm:max-w-md text-foreground/70" title={m.reason}>
                                    💬 {m.reason}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Direita: Quantidade, Saldo e Ação de Estorno */}
                        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/40 shrink-0">
                          <div className="text-left md:text-right space-y-0.5">
                            <div className={cn("font-mono font-black text-sm sm:text-base leading-tight", isEntrada ? "text-emerald-400" : "text-rose-400")}>
                              {isEntrada ? "+" : "-"}{num(m.quantity)}
                            </div>
                            {canViewBalances && (m.previous_balance !== undefined) && (
                              <div className="text-[10px] font-mono text-muted-foreground">
                                Saldo: {num(m.previous_balance)} → <span className="font-bold text-foreground">{num(m.resulting_balance)}</span>
                              </div>
                            )}
                          </div>

                          {canReverse && (
                            <div className="shrink-0">
                              {!isReversed ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 rounded-lg cursor-pointer"
                                  onClick={() => reverseMutation.mutate(m.id)}
                                  disabled={reverseMutation.isPending}
                                  title="Estornar lançamento"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Estornar
                                </Button>
                              ) : (
                                <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">
                                  Estornado
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CONTROLES DE PAGINAÇÃO */}
                {totalLogPages > 1 || filteredLogs.length > 10 ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>Exibir por página:</span>
                      <Select
                        value={String(logsPerPage)}
                        onValueChange={(val) => setLogsPerPage(Number(val))}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs rounded-lg bg-secondary/30">
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 (padrão)</SelectItem>
                          <SelectItem value="20">20 por pág.</SelectItem>
                          <SelectItem value="50">50 por pág.</SelectItem>
                          <SelectItem value="100">100 por pág.</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-[11px] font-mono">
                        ({(safeLogPage - 1) * logsPerPage + 1} - {Math.min(safeLogPage * logsPerPage, filteredLogs.length)} de {filteredLogs.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                        disabled={safeLogPage <= 1}
                        className="h-8 px-2 text-xs rounded-lg cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                      </Button>

                      <span className="text-xs font-mono font-bold px-2 text-foreground">
                        Pág. {safeLogPage} de {totalLogPages}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                        disabled={safeLogPage >= totalLogPages}
                        className="h-8 px-2 text-xs rounded-lg cursor-pointer"
                      >
                        Próxima <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="surface-card border-border/80 p-8 text-center border-dashed">
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Histórico de Lançamentos Bloqueado</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Seu cargo não possui a permissão <strong className="text-primary font-semibold">Ver Histórico de Lançamentos</strong> ativada para visualizar o registro de movimentações.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
