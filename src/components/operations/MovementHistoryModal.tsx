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
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
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
  const { hasPermission, isDevUser } = useAuth();
  const queryClient = useQueryClient();

  const canViewPage = hasPermission("view_movements") || hasPermission("view_all_movements") || isDevUser;
  const canReverse = hasPermission("reverse_movement") || hasPermission("delete_movement") || isDevUser;
  const canViewBalances = hasPermission("view_movement_balances") || hasPermission("view_stock") || isDevUser;
  const canViewBaus = hasPermission("view_baus") || hasPermission("view_movement_baus") || isDevUser;

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
      <DialogContent className="max-w-5xl w-[96vw] bg-card/95 text-card-foreground border border-border/80 shadow-2xl backdrop-blur-xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
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

                const memberAvatar =
                  matchedMember?.avatar_url ||
                  matchedMember?.discord_avatar_url ||
                  (matchedMember as any)?.original_avatar_url ||
                  null;

                const bauObj = baus.find((b) => b.id === m.bau_id);
                const bauName = bauObj?.nome || "Baú Geral";

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "relative rounded-2xl border p-3 sm:p-4 transition-all duration-200 shadow-xs hover:shadow-md gap-3 flex flex-col md:flex-row md:items-center justify-between overflow-hidden",
                      isReversed
                        ? "opacity-55 bg-secondary/15 border-border/40 grayscale-[0.25]"
                        : isEntrada
                        ? "bg-card/90 border-emerald-500/25 hover:border-emerald-500/50 hover:bg-emerald-500/[0.02]"
                        : "bg-card/90 border-rose-500/25 hover:border-rose-500/50 hover:bg-rose-500/[0.02]"
                    )}
                  >
                    {/* ACCENT GLOW */}
                    <div
                      className={cn(
                        "absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20",
                        isEntrada ? "bg-emerald-500" : "bg-rose-500"
                      )}
                    />

                    {/* SECTION 1: MEMBRO EM DESTAQUE (Foto + Nome + ID/Nickname + Origem) */}
                    <div className="flex items-center gap-3 min-w-0 md:w-[260px] lg:w-[280px] shrink-0">
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl ring-2 ring-primary/25 shadow-xs border border-border/60">
                          {memberAvatar ? (
                            <AvatarImage src={memberAvatar} alt={uName} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-black text-xs sm:text-sm">
                            {uName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1">
                          {m.origin === "discord" ? (
                            <span
                              className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5865F2] text-[9px] text-white shadow-xs"
                              title="Origem: Discord"
                            >
                              🤖
                            </span>
                          ) : m.origin === "painel_dev" ? (
                            <span
                              className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] text-white shadow-xs"
                              title="Origem: Painel Dev"
                            >
                              🛠️
                            </span>
                          ) : (
                            <span
                              className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-slate-950 shadow-xs"
                              title="Origem: Manual"
                            >
                              ✋
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className="font-black text-xs sm:text-sm text-foreground truncate max-w-[170px] sm:max-w-[190px]"
                            title={uName}
                          >
                            {uName}
                          </span>
                          <VerifiedBadge userId={m.user_id} size="xs" />
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[10.5px] text-muted-foreground flex-wrap">
                          {(matchedMember?.game_id || m.game_player_id) && (
                            <Badge
                              variant="outline"
                              className="text-[9.5px] font-mono px-1.5 py-0 rounded-md border-border/70 bg-secondary/40 text-foreground/80 font-bold"
                            >
                              ID: {matchedMember?.game_id || m.game_player_id}
                            </Badge>
                          )}
                          {matchedMember?.nickname && matchedMember.nickname !== matchedMember.nome && (
                            <span
                              className="text-muted-foreground/80 text-[10px] truncate max-w-[100px]"
                              title={matchedMember.nickname}
                            >
                              @{matchedMember.nickname}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: ITEM EM DESTAQUE (Foto + Nome do Produto + Baú + Motivo + Data) */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 md:px-3 py-1.5 md:py-0 border-t md:border-t-0 md:border-l border-border/40">
                      <div className="relative shrink-0">
                        <ProductThumbnail
                          src={prodObj?.imagem_url}
                          name={pName}
                          size="md"
                          className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-border/80 bg-secondary/50 shadow-inner group-hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span
                            className="font-extrabold text-xs sm:text-sm text-foreground tracking-tight truncate max-w-[180px] sm:max-w-xs"
                            title={pName}
                          >
                            {pName}
                          </span>

                          {canViewBaus && (
                            <Badge
                              variant="outline"
                              className="text-[9.5px] border-border/80 bg-secondary/40 text-foreground/85 px-2 py-0.5 rounded-lg shrink-0 font-medium flex items-center gap-1"
                            >
                              <BauIcon
                                foto_url={bauObj?.foto_url || bauObj?.imagem_url}
                                icone={bauObj?.icone}
                                nome={bauName}
                                className="w-3.5 h-3.5 rounded-xs"
                              />
                              <span className="truncate max-w-[110px]">{bauName}</span>
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded-md border border-border/40">
                            <Clock className="w-3 h-3 text-primary/70 shrink-0" />
                            {dateTime(m.created_at)}
                          </span>

                          {m.reason && (
                            <span
                              className="text-[10.5px] text-foreground/85 italic truncate max-w-[180px] sm:max-w-md bg-secondary/20 px-2 py-0.5 rounded-md border border-border/30"
                              title={m.reason}
                            >
                              💬 {m.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: QUANTIDADE EM DESTAQUE & AÇÕES */}
                    <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-border/40 md:pl-3">
                      <div className="text-left md:text-right space-y-0.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono font-black text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-xl shadow-xs flex items-center gap-1.5 border tracking-tight",
                            isEntrada
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/15"
                              : "border-rose-500/40 text-rose-400 bg-rose-500/15"
                          )}
                        >
                          {isEntrada ? (
                            <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <ArrowUpCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span>
                            {isEntrada ? "+" : "-"}
                            {num(m.quantity)} {prodObj?.unidade || "un"}
                          </span>
                        </Badge>

                        {canViewBalances && m.previous_balance !== undefined && (
                          <div className="text-[9.5px] font-mono text-muted-foreground flex items-center gap-1 justify-start md:justify-end">
                            <span>Saldo:</span>
                            <span>{num(m.previous_balance)}</span>
                            <span>→</span>
                            <span className="font-bold text-foreground">{num(m.resulting_balance)}</span>
                          </div>
                        )}
                      </div>

                      {canReverse && (
                        <div className="shrink-0 ml-1">
                          {!isReversed ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7.5 px-2.5 text-xs text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 border-amber-500/30 rounded-xl font-bold cursor-pointer transition-colors shadow-xs"
                              onClick={() => reverseMutation.mutate(m.id)}
                              disabled={reverseMutation.isPending}
                              title="Estornar lançamento"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Estornar</span>
                            </Button>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9px] border-border/80 bg-secondary/50 text-muted-foreground font-semibold px-2 py-0.5 rounded-lg"
                            >
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
