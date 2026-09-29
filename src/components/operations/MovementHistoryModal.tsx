import { useState, useMemo, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  History,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
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
import { useModalTitle } from "@/hooks/usePageTitle";
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
import type { Movement } from "@/lib/app-types";

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

  // Pagination State
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

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
      setPage(1);
    }
  }, [open, initialProductId, initialBauId]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedProductId, selectedBauId, perPage]);

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
  }, [movements, selectedProductId, selectedBauId, searchTerm, products, members]);

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
    selectedBauId !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedProductId("all");
    setSelectedBauId("all");
  };

  const selectedProductObj = products.find((p) => p.id === selectedProductId);

  useModalTitle(
    selectedProductObj ? `Histórico: ${selectedProductObj.nome}` : "Histórico de Movimentações",
    open
  );

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

          </div>
        </DialogHeader>

        {/* SEARCH BAR */}
        <div className="px-3 sm:px-4 py-2.5 border-b border-border/60 bg-secondary/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar produto, autor, ID Discord, motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-xs rounded-xl bg-background/80 border-border/80"
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
        </div>

        {/* MOVEMENTS LIST BODY */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 min-h-[260px]">
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
            <div className="space-y-1.5 sm:space-y-2">
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
                      "flex flex-col md:flex-row items-start md:items-center justify-between p-2 sm:p-2.5 rounded-xl border bg-card/90 hover:bg-secondary/40 transition-all gap-2 sm:gap-2.5 shadow-2xs",
                      isReversed
                        ? "opacity-50 bg-secondary/10 border-border/40"
                        : isEntrada
                        ? "border-emerald-500/20 hover:border-emerald-500/40"
                        : "border-rose-500/20 hover:border-rose-500/40"
                    )}
                  >
                    {/* LEFT: Product, Details, Author, Date */}
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                      <ProductThumbnail
                        src={prodObj?.imagem_url}
                        name={pName}
                        size="sm"
                        className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-lg"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-[13px] text-foreground truncate max-w-[180px] sm:max-w-xs">
                            {pName}
                          </span>

                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] sm:text-[9.5px] font-bold px-1.5 py-0.2 rounded-md shrink-0",
                              isEntrada
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                            )}
                          >
                            {isEntrada ? "+ Entrada" : "- Saída"}
                          </Badge>

                          {canViewBaus && (
                            <Badge variant="outline" className="text-[9px] sm:text-[9.5px] border-border/80 text-foreground/80 px-1.5 py-0.2 rounded-md shrink-0 font-medium flex items-center gap-1">
                              <BauIcon
                                foto_url={bauObj?.foto_url || bauObj?.imagem_url}
                                icone={bauObj?.icone}
                                nome={bauName}
                                className="w-3 h-3 rounded-xs"
                              />
                              <span>{bauName}</span>
                            </Badge>
                          )}

                          {m.origin === "discord" ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] sm:text-[9.5px] border-[#5865F2]/40 text-[#5865F2] bg-[#5865F2]/10 px-1.5 py-0.2 rounded-md shrink-0 font-semibold"
                              title={`Mensagem Discord: ${m.discord_message_id || "N/A"}`}
                            >
                              🤖 Discord
                            </Badge>
                          ) : m.origin === "painel_dev" ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] sm:text-[9.5px] border-rose-500/40 text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded-md shrink-0 font-semibold"
                            >
                              🛠️ Painel Dev
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9px] sm:text-[9.5px] border-amber-500/40 text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-md shrink-0 font-semibold"
                            >
                              ✋ Manual
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono flex-wrap">
                          <span>🕒 {dateTime(m.created_at)}</span>
                          <span>•</span>
                          <span>👤 {uName}</span>
                          {m.reason && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px] sm:max-w-md text-foreground/80 font-sans" title={m.reason}>
                                💬 {m.reason}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Quantity & Reversal */}
                    <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3.5 w-full md:w-auto pt-1.5 md:pt-0 border-t md:border-t-0 border-border/40 shrink-0">
                      <div className="text-left md:text-right space-y-0.5">
                        <div
                          className={cn(
                            "font-mono font-black text-xs sm:text-sm leading-tight",
                            isEntrada ? "text-emerald-400" : "text-rose-400"
                          )}
                        >
                          {isEntrada ? "+" : "-"}
                          {num(m.quantity)} {prodObj?.unidade || "un"}
                        </div>
                        {canViewBalances && m.previous_balance !== undefined && (
                          <div className="text-[9px] font-mono text-muted-foreground">
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
                              className="h-6.5 px-2 text-[11px] text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 rounded-lg cursor-pointer"
                              onClick={() => reverseMutation.mutate(m.id)}
                              disabled={reverseMutation.isPending}
                              title="Estornar lançamento"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Estornar
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-[8.5px] border-border text-muted-foreground">
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
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
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
