import { useState, useMemo, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  History,
  Search,
  RotateCcw,
  Boxes,
  Box,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton, EmptyState, ProductThumbnail } from "@/components/ui-kit";
import { BauIcon } from "@/components/ui/bau-icon";
import { useAuth } from "@/hooks/useAuth";
import {
  useMovements,
  useProducts,
  useBaus,
  useMembers,
  nameOf,
  productName,
} from "@/hooks/useData";
import { dateTime, num, errorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Movement, Product, Bau } from "@/lib/app-types";

export interface MovementHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductId?: string | null;
  initialBauId?: string | null;
}

export function MovementHistoryModal({
  open,
  onOpenChange,
  initialProductId = null,
  initialBauId = null,
}: MovementHistoryModalProps) {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canViewPage = hasPermission("view_movements") || hasPermission("view_all_movements");
  const canReverse = hasPermission("reverse_movement");
  const canViewBalances = hasPermission("view_movement_balances") || hasPermission("view_stock");
  const canViewBaus = hasPermission("view_baus") || hasPermission("view_movement_baus");

  const { data: movements = [], isLoading: loadingMovements } = useMovements();
  const { data: products = [] } = useProducts();
  const { data: baus = [] } = useBaus();
  const { data: members = [] } = useMembers();

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [selectedBauId, setSelectedBauId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedOrigin, setSelectedOrigin] = useState<string>("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Sync initial product / baú when modal opens
  useEffect(() => {
    if (open) {
      if (initialProductId) {
        setSelectedProductId(initialProductId);
      } else {
        setSelectedProductId("all");
      }
      if (initialBauId && initialBauId !== "all") {
        setSelectedBauId(initialBauId);
      } else {
        setSelectedBauId("all");
      }
      setSearchTerm("");
      setSelectedType("all");
      setSelectedOrigin("all");
      setPage(1);
    }
  }, [open, initialProductId, initialBauId]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedProductId, selectedBauId, selectedType, selectedOrigin, perPage]);

  // Set of reversed movement IDs
  const reversedIds = useMemo(() => {
    const set = new Set<string>();
    movements.forEach((m) => {
      if (m.reversal_of) set.add(m.reversal_of);
    });
    return set;
  }, [movements]);

  // Reverse Movement Mutation
  const reverseMutation = useMutation({
    mutationFn: async (movementId: string) => {
      if (!canReverse) throw new Error("Você não possui permissão para estornar movimentações.");
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.rpc("reverse_movement", { _movement_id: movementId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movimentação estornada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["product_baus"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Filter by product
      if (selectedProductId !== "all" && m.product_id !== selectedProductId) {
        return false;
      }

      // Filter by baú
      if (selectedBauId !== "all" && m.bau_id !== selectedBauId) {
        return false;
      }

      // Filter by origin
      if (selectedOrigin !== "all") {
        if (selectedOrigin === "manual" && m.origin && m.origin !== "manual") return false;
        if (selectedOrigin !== "manual" && m.origin !== selectedOrigin) return false;
      }

      // Filter by type
      if (selectedType !== "all") {
        if (selectedType === "transferencia" && !m.reason?.toLowerCase().includes("transferência")) return false;
        if (selectedType !== "transferencia" && m.type !== selectedType) return false;
      }

      // Filter by search query
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;

      const pName = productName(products, m.product_id).toLowerCase();
      const uName = nameOf(members, m.user_id).toLowerCase();
      const dUser = (m.discord_user_name || "").toLowerCase();
      const gPlayer = (m.game_player_id || "").toLowerCase();
      const reason = (m.reason || "").toLowerCase();
      const msgId = (m.discord_message_id || "").toLowerCase();

      return (
        pName.includes(q) ||
        uName.includes(q) ||
        dUser.includes(q) ||
        gPlayer.includes(q) ||
        reason.includes(q) ||
        msgId.includes(q)
      );
    });
  }, [movements, selectedProductId, selectedBauId, selectedOrigin, selectedType, searchTerm, products, members]);

  // Overall Statistics for current filtered set
  const stats = useMemo(() => {
    let totalEntradas = 0;
    let qtyEntradas = 0;
    let totalSaidas = 0;
    let qtySaidas = 0;
    let discordCount = 0;
    let manualCount = 0;

    filteredMovements.forEach((m) => {
      const isReversed = !!m.reversal_of || reversedIds.has(m.id);
      if (isReversed) return;

      if (m.type === "entrada") {
        totalEntradas += 1;
        qtyEntradas += Number(m.quantity || 0);
      } else {
        totalSaidas += 1;
        qtySaidas += Number(m.quantity || 0);
      }

      if (m.origin === "discord") discordCount += 1;
      else manualCount += 1;
    });

    return {
      total: filteredMovements.length,
      totalEntradas,
      qtyEntradas,
      totalSaidas,
      qtySaidas,
      discordCount,
      manualCount,
    };
  }, [filteredMovements, reversedIds]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredMovements.length / perPage) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedMovements = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filteredMovements.slice(start, start + perPage);
  }, [filteredMovements, safePage, perPage]);

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm !== "" ||
    selectedProductId !== "all" ||
    selectedBauId !== "all" ||
    selectedType !== "all" ||
    selectedOrigin !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedProductId("all");
    setSelectedBauId("all");
    setSelectedType("all");
    setSelectedOrigin("all");
  };

  const selectedProductObj = products.find((p) => p.id === selectedProductId);

  if (!canViewPage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[96vw] bg-card/95 text-card-foreground border border-border/80 shadow-2xl backdrop-blur-xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border/60 bg-gradient-to-r from-card to-secondary/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-foreground">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <History className="h-5 w-5" />
                </div>
                <span>Histórico de Movimentações</span>
                {selectedProductObj && (
                  <Badge variant="outline" className="text-xs border-primary/40 bg-primary/10 text-primary">
                    {selectedProductObj.nome}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Auditoria completa de entradas, saídas, transferências e sincronizações do Discord.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs px-2.5 py-1 rounded-xl">
                {num(filteredMovements.length)} registro{filteredMovements.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </div>

          {/* STATS QUICK BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
            <div className="p-2 sm:p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <ArrowDownCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Entradas</p>
                <p className="text-xs sm:text-sm font-extrabold font-mono text-emerald-400 truncate">
                  +{num(stats.qtyEntradas)} <span className="text-[10px] text-muted-foreground font-normal">({stats.totalEntradas}x)</span>
                </p>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                <ArrowUpCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Saídas</p>
                <p className="text-xs sm:text-sm font-extrabold font-mono text-rose-400 truncate">
                  -{num(stats.qtySaidas)} <span className="text-[10px] text-muted-foreground font-normal">({stats.totalSaidas}x)</span>
                </p>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl border border-[#5865F2]/20 bg-[#5865F2]/5 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#5865F2]/10 text-[#5865F2] shrink-0">
                <span className="text-xs">🤖</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Via Discord</p>
                <p className="text-xs sm:text-sm font-extrabold font-mono text-foreground truncate">
                  {num(stats.discordCount)} logs
                </p>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <span className="text-xs">✋</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Manual / Painel</p>
                <p className="text-xs sm:text-sm font-extrabold font-mono text-foreground truncate">
                  {num(stats.manualCount)} logs
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* FILTERS TOOLBAR */}
        <div className="p-3 sm:p-4 border-b border-border/60 bg-secondary/20 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {/* SEARCH */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar produto, autor, ID Discord, motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8.5 text-xs rounded-xl bg-background/80 border-border/80"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* PRODUCT SELECT */}
            <div>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="h-8.5 text-xs rounded-xl bg-background/80 border-border/80 truncate">
                  <SelectValue placeholder="Produto" />
                </SelectTrigger>
                <SelectContent className="max-h-60 z-[10000]">
                  <SelectItem value="all">Todos os Produtos</SelectItem>
                  {products
                    .slice()
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* BAÚ SELECT */}
            <div>
              <Select value={selectedBauId} onValueChange={setSelectedBauId}>
                <SelectTrigger className="h-8.5 text-xs rounded-xl bg-background/80 border-border/80">
                  <SelectValue placeholder="Baú" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="all">Todos os Baús</SelectItem>
                  {baus.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <span className="flex items-center gap-1.5">
                        <BauIcon
                          foto_url={b.foto_url || b.imagem_url}
                          icone={b.icone}
                          nome={b.nome}
                          className="w-3.5 h-3.5 rounded-xs"
                        />
                        <span>{b.nome}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ORIGIN SELECT */}
            <div>
              <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
                <SelectTrigger className="h-8.5 text-xs rounded-xl bg-background/80 border-border/80">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="all">Todas as Origens</SelectItem>
                  <SelectItem value="discord">🤖 Discord Bot</SelectItem>
                  <SelectItem value="painel_dev">🛠️ Painel Dev</SelectItem>
                  <SelectItem value="manual">✋ Lançamento Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            {/* TYPE FILTER PILLS */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">Tipo:</span>
              <Button
                type="button"
                variant={selectedType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("all")}
                className={cn(
                  "h-7 text-[11px] px-2.5 rounded-lg",
                  selectedType === "all" ? "bg-primary text-primary-foreground font-bold" : "bg-card/40"
                )}
              >
                Todos
              </Button>
              <Button
                type="button"
                variant={selectedType === "entrada" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("entrada")}
                className={cn(
                  "h-7 text-[11px] px-2.5 rounded-lg",
                  selectedType === "entrada"
                    ? "bg-emerald-600 text-white font-bold"
                    : "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
                )}
              >
                <ArrowDownCircle className="h-3 w-3 mr-1" /> Entradas
              </Button>
              <Button
                type="button"
                variant={selectedType === "saida" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType("saida")}
                className={cn(
                  "h-7 text-[11px] px-2.5 rounded-lg",
                  selectedType === "saida"
                    ? "bg-rose-600 text-white font-bold"
                    : "border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10"
                )}
              >
                <ArrowUpCircle className="h-3 w-3 mr-1" /> Saídas
              </Button>
            </div>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
              >
                <X className="h-3 w-3 mr-1" /> Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        {/* MOVEMENTS LIST BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-[260px]">
          {loadingMovements ? (
            <TableSkeleton rows={6} />
          ) : filteredMovements.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={<History className="h-10 w-10 text-muted-foreground" />}
                title="Nenhuma movimentação encontrada"
                description={
                  hasActiveFilters
                    ? "Nenhum registro atende aos filtros atuais. Tente ajustar a busca."
                    : "Ainda não existem registros de movimentações no estoque."
                }
                action={
                  hasActiveFilters ? (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3 rounded-xl text-xs">
                      Limpar Filtros
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {paginatedMovements.map((m) => {
                const isEntrada = m.type === "entrada";
                const isReversed = !!m.reversal_of || reversedIds.has(m.id);
                const prodObj = products.find((p) => p.id === m.product_id);
                const pName = prodObj?.nome || productName(products, m.product_id);

                const matchedMember =
                  members.find((mem) => mem.user_id === m.user_id) ||
                  (m.game_player_id
                    ? members.find(
                        (mem) => mem.game_id && String(mem.game_id).trim() === String(m.game_player_id).trim()
                      )
                    : undefined);

                const uName = matchedMember
                  ? matchedMember.nome
                  : m.discord_user_name && m.discord_user_name !== "Sistema Twin Wheels"
                  ? m.discord_user_name
                  : m.origin === "discord"
                  ? "Sistema Twin Wheels"
                  : nameOf(members, m.user_id);

                const bauObj = baus.find((b) => b.id === m.bau_id);
                const bauName = bauObj?.nome || "Baú Geral";

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex flex-col md:flex-row items-start md:items-center justify-between p-3.5 rounded-xl border bg-card/90 hover:bg-secondary/40 transition-all gap-3 shadow-xs",
                      isReversed
                        ? "opacity-50 bg-secondary/10 border-border/40"
                        : isEntrada
                        ? "border-emerald-500/20 hover:border-emerald-500/40"
                        : "border-rose-500/20 hover:border-rose-500/40"
                    )}
                  >
                    {/* LEFT: Product, Details, Author, Date */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ProductThumbnail src={prodObj?.imagem_url} name={pName} size="sm" />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[200px] sm:max-w-xs">
                            {pName}
                          </span>

                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0",
                              isEntrada
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                            )}
                          >
                            {isEntrada ? "+ Entrada" : "- Saída"}
                          </Badge>

                          {canViewBaus && (
                            <Badge variant="outline" className="text-[10px] border-border/80 text-foreground/80 px-1.5 py-0.5 rounded-md shrink-0 font-medium flex items-center gap-1">
                              <BauIcon
                                foto_url={bauObj?.foto_url || bauObj?.imagem_url}
                                icone={bauObj?.icone}
                                nome={bauName}
                                className="w-3.5 h-3.5 rounded-xs"
                              />
                              <span>{bauName}</span>
                            </Badge>
                          )}

                          {m.origin === "discord" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-[#5865F2]/40 text-[#5865F2] bg-[#5865F2]/10 px-1.5 py-0.5 rounded-md shrink-0 font-semibold"
                              title={`Mensagem Discord: ${m.discord_message_id || "N/A"}`}
                            >
                              🤖 Discord
                            </Badge>
                          ) : m.origin === "painel_dev" ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-rose-500/40 text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md shrink-0 font-semibold"
                            >
                              🛠️ Painel Dev
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md shrink-0 font-semibold"
                            >
                              ✋ Manual
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
                              <span className="truncate max-w-[220px] sm:max-w-md text-foreground/80 font-sans" title={m.reason}>
                                💬 {m.reason}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Quantity & Reversal */}
                    <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/40 shrink-0">
                      <div className="text-left md:text-right space-y-0.5">
                        <div
                          className={cn(
                            "font-mono font-black text-sm sm:text-base leading-tight",
                            isEntrada ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {isEntrada ? "+" : "-"}
                          {num(m.quantity)} {prodObj?.unidade || "un"}
                        </div>
                        {canViewBalances && m.previous_balance !== undefined && (
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {num(m.previous_balance)} →{" "}
                            <span className="font-bold text-foreground">{num(m.resulting_balance)}</span>
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
          )}
        </div>

        {/* MODAL FOOTER & PAGINATION */}
        <DialogFooter className="p-3 sm:p-4 border-t border-border/60 bg-gradient-to-r from-card to-secondary/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* PER PAGE & COUNTER */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5">
              <span>Exibir:</span>
              <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
                <SelectTrigger className="h-7.5 w-20 text-xs rounded-lg bg-background border-border/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredMovements.length > 0 && (
              <span className="font-mono text-[11px]">
                {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filteredMovements.length)} de {filteredMovements.length}
              </span>
            )}
          </div>

          {/* PAGE BUTTONS & ACTIONS */}
          <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="h-8 px-2.5 text-xs rounded-xl"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Anterior
                </Button>

                <span className="text-xs font-mono font-bold px-2 text-foreground">
                  {safePage} / {totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="h-8 px-2.5 text-xs rounded-xl"
                >
                  Próxima <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            )}

            <Link to="/movimentacoes" onClick={() => onOpenChange(false)}>
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl font-bold gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
                <span>Nova Movimentação</span>
              </Button>
            </Link>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs rounded-xl font-bold px-4 bg-secondary text-foreground hover:bg-secondary/80 border border-border/80"
            >
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
