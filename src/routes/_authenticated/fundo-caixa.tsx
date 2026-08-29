import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Landmark,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
  Search,
  RotateCcw,
  Trash2,
  Loader2,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, NoAccess, TableSkeleton, EmptyState } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useCashMovements, useMembers } from "@/hooks/useData";
import { submitCashMovement, reverseCashMovement, deleteCashMovement } from "@/lib/app-api";
import {
  currency,
  formatCurrencyInput,
  parseCurrencyInput,
  dateTime,
  errorMessage,
  RANGE_LABEL,
  inRange,
  type RangeKey,
} from "@/lib/format";
import { CashMovement } from "@/lib/app-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/fundo-caixa")({
  component: FundoCaixaPage,
});

function FundoCaixaPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canView = hasPermission("view_cash_fund");
  const canManage = hasPermission("manage_cash_fund");
  const canReverse = hasPermission("reverse_cash_fund");
  const canDelete = hasPermission("delete_cash_movement");

  const { data: movements = [], isLoading } = useCashMovements();

  // Filters state
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<RangeKey>("tudo");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Create Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<"entrada" | "saida">("entrada");
  const [amount, setAmount] = useState("");
  const [motive, setMotive] = useState("");
  const [notes, setNotes] = useState("");

  // Reversal Modal state
  const [reversingMovement, setReversingMovement] = useState<CashMovement | null>(null);
  const [reversalReason, setReversalReason] = useState("");

  // Deletion Modal state
  const [deletingMovement, setDeletingMovement] = useState<CashMovement | null>(null);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!canManage) throw new Error("Você não possui permissão para lançar movimentações no fundo de caixa.");
      const val = parseCurrencyInput(amount);
      if (!Number.isFinite(val) || val <= 0) {
        throw new Error("Informe um valor válido e maior que zero.");
      }
      if (!motive.trim()) {
        throw new Error("Informe o motivo da movimentação de caixa.");
      }

      await submitCashMovement({
        type,
        amount: val,
        motive: motive.trim(),
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success(
        type === "entrada"
          ? "Entrada no Fundo de Caixa registrada com sucesso!"
          : "Saída do Fundo de Caixa registrada com sucesso!"
      );
      void queryClient.invalidateQueries({ queryKey: ["cash_fund_movements"] });
      setModalOpen(false);
      setAmount("");
      setMotive("");
      setNotes("");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // Reversal Mutation
  const reverseMutation = useMutation({
    mutationFn: async () => {
      if (!canReverse) throw new Error("Você não possui permissão para estornar lançamentos de caixa.");
      if (!reversingMovement) return;
      await reverseCashMovement(reversingMovement.id, reversalReason);
    },
    onSuccess: () => {
      toast.success("Movimentação de caixa estornada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["cash_fund_movements"] });
      setReversingMovement(null);
      setReversalReason("");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!canDelete) throw new Error("Você não possui permissão para excluir lançamentos de caixa.");
      if (!deletingMovement) return;
      await deleteCashMovement(deletingMovement.id);
    },
    onSuccess: () => {
      toast.success("Lançamento de caixa excluído com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["cash_fund_movements"] });
      setDeletingMovement(null);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!canView) return <NoAccess />;

  // Filtered movements
  const filtered = movements.filter((m) => {
    const matchesRange = inRange(m.created_at, range);
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "estornado" ? m.status === "estornado" : m.type === typeFilter && m.status !== "estornado");
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      m.motive.toLowerCase().includes(q) ||
      (m.notes || "").toLowerCase().includes(q) ||
      (m.user_name || "").toLowerCase().includes(q);

    return matchesRange && matchesType && matchesSearch;
  });

  // Calculate Metrics strictly considering active (non-estornado) movements
  const activeMovements = movements.filter((m) => m.status !== "estornado");
  const totalEntradas = activeMovements
    .filter((m) => m.type === "entrada")
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const totalSaidas = activeMovements
    .filter((m) => m.type === "saida")
    .reduce((acc, m) => acc + Number(m.amount), 0);
  const currentBalance = totalEntradas - totalSaidas;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Fundo de Caixa Geral"
        description="Gestão de caixa do grupo com cálculo de saldo em tempo real, registros de aportes, compras e retiradas."
        actions={
          canManage ? (
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Movimentação de Caixa
            </Button>
          ) : null
        }
      />

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-emerald-500/40 bg-emerald-500/5 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-emerald-400">
              Saldo Atual do Caixa
            </CardTitle>
            <Landmark className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {currency(currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Calculado automaticamente (Entradas − Saídas)</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Entradas Ativas
            </CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground font-mono">
              {currency(totalEntradas)}
            </div>
            <p className="text-xs text-emerald-500 font-medium">Aportes e receitas acumuladas</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Saídas Ativas
            </CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground font-mono">
              {currency(totalSaidas)}
            </div>
            <p className="text-xs text-rose-400 font-medium">Despesas e pagamentos efetuados</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lançamentos Ativos
            </CardTitle>
            <Activity className="h-5 w-5 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeMovements.length}</div>
            <p className="text-xs text-muted-foreground">Transações líquidas no histórico</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER BAR */}
      <Card className="surface-card">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por motivo, observação, membro responsável..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RANGE_LABEL).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="entrada">Entradas (+)</SelectItem>
                  <SelectItem value="saida">Saídas (-)</SelectItem>
                  <SelectItem value="estornado">Estornadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="surface-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Histórico de Transações do Fundo de Caixa ({filtered.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Registro cronológico das movimentações financeiras com indicação visível de estornos e exclusões.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-10 w-10 text-muted-foreground" />}
              title="Nenhuma movimentação de caixa encontrada"
              description="Não foram encontrados registros para os filtros selecionados."
            />
          ) : (
            <>
              {/* MOBILE CARD VIEW (Visão em cards para celulares — sem rolagem lateral) */}
              <div className="space-y-3 md:hidden">
                {filtered.map((m) => {
                  const isEntrada = m.type === "entrada";
                  const isEstornado = m.status === "estornado";

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "p-3.5 rounded-xl border bg-card shadow-sm space-y-2.5",
                        isEstornado ? "border-rose-500/40 bg-rose-500/5 opacity-80" : "border-border/80"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                        <Badge
                          className={
                            isEstornado
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/40 text-[0.65rem] font-bold"
                              : isEntrada
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[0.65rem] font-bold"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30 text-[0.65rem] font-bold"
                          }
                        >
                          {isEstornado ? "ESTORNADO" : isEntrada ? "Entrada (+)" : "Saída (-)"}
                        </Badge>
                        <span className="text-[0.65rem] font-mono text-muted-foreground">{dateTime(m.created_at)}</span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-border">
                            {m.user_avatar_url && <AvatarImage src={m.user_avatar_url} alt={m.user_name} />}
                            <AvatarFallback className="bg-secondary font-bold text-[9px]">
                              {(m.user_name || "M").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-foreground">{m.user_name || "Sistema"}</span>
                        </div>

                        <div className="text-right font-mono font-black text-sm">
                          <span className={cn(isEntrada ? "text-emerald-400" : "text-rose-400", isEstornado && "line-through opacity-60")}>
                            {isEntrada ? "+" : "-"}{currency(m.amount)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className={cn("text-xs font-semibold text-foreground", isEstornado && "line-through text-muted-foreground")}>
                          {m.motive}
                        </p>
                        {m.notes ? <p className="text-[0.65rem] text-muted-foreground">{m.notes}</p> : null}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                        <span className="text-[0.65rem] text-muted-foreground">
                          Saldo: <strong className="text-foreground font-mono">{isEstornado ? "(Anulado)" : currency(m.resulting_balance)}</strong>
                        </span>

                        <div className="flex items-center gap-1">
                          {canReverse && !isEstornado ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-amber-400 border-amber-500/40"
                              onClick={() => setReversingMovement(m)}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Estornar
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-rose-400 border-rose-500/40"
                              onClick={() => setDeletingMovement(m)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Excluir
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data / Hora</TableHead>
                      <TableHead>Membro Responsável</TableHead>
                      <TableHead>Status & Tipo</TableHead>
                      <TableHead>Motivo & Detalhes</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Saldo Resultante</TableHead>
                      {canReverse || canDelete ? <TableHead className="text-right">Ações</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((m) => {
                      const isEntrada = m.type === "entrada";
                      const isEstornado = m.status === "estornado";

                      return (
                        <TableRow
                          key={m.id}
                          className={isEstornado ? "opacity-60 bg-rose-500/5 hover:bg-rose-500/10" : ""}
                        >
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {dateTime(m.created_at)}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[140px]">
                              <Avatar className="h-7 w-7 border border-border">
                                {m.user_avatar_url && <AvatarImage src={m.user_avatar_url} alt={m.user_name} />}
                                <AvatarFallback className="bg-secondary font-bold text-[10px]">
                                  {(m.user_name || "M").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-semibold text-foreground">{m.user_name || "Sistema"}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={
                                isEstornado
                                  ? "bg-rose-500/20 text-rose-400 border-rose-500/40 text-[0.65rem] font-bold"
                                  : isEntrada
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[0.65rem] font-bold"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/30 text-[0.65rem] font-bold"
                              }
                            >
                              {isEstornado ? "ESTORNADO" : isEntrada ? "Entrada (+)" : "Saída (-)"}
                            </Badge>
                          </TableCell>

                          <TableCell className="max-w-[280px]">
                            <p className={cn("font-semibold text-xs text-foreground truncate", isEstornado && "line-through text-muted-foreground")}>
                              {m.motive}
                            </p>
                            {m.notes ? <p className="text-[0.65rem] text-muted-foreground truncate">{m.notes}</p> : null}
                          </TableCell>

                          <TableCell className="text-right font-mono font-bold text-xs whitespace-nowrap">
                            <span
                              className={cn(
                                isEntrada ? "text-emerald-400" : "text-rose-400",
                                isEstornado && "line-through opacity-60 text-muted-foreground"
                              )}
                            >
                              {isEntrada ? "+" : "-"}{currency(m.amount)}
                            </span>
                          </TableCell>

                          <TableCell className="text-right font-mono font-bold text-xs text-foreground whitespace-nowrap">
                            {isEstornado ? (
                              <span className="text-rose-400 font-normal italic text-[11px]">(Anulado)</span>
                            ) : (
                              currency(m.resulting_balance)
                            )}
                          </TableCell>

                          {canReverse || canDelete ? (
                            <TableCell className="text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                {canReverse && !isEstornado ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-amber-400 hover:bg-amber-500/10"
                                    onClick={() => setReversingMovement(m)}
                                    title="Estornar esta movimentação"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Estornar
                                  </Button>
                                ) : null}

                                {canDelete ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-rose-400 hover:bg-rose-500/10"
                                    onClick={() => setDeletingMovement(m)}
                                    title="Excluir lançamento permanentemente"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* DIÁLOGO DE NOVA MOVIMENTAÇÃO DE CAIXA */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" /> Nova Movimentação no Fundo de Caixa
            </DialogTitle>
            <DialogDescription>
              Registre aportes, despesas ou retiradas com saldo calculado automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Tipo de Lançamento</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === "entrada" ? "default" : "outline"}
                  className={
                    type === "entrada"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      : "border-border text-muted-foreground"
                  }
                  onClick={() => setType("entrada")}
                >
                  <ArrowDownCircle className="mr-2 h-4 w-4" /> Entrada (+)
                </Button>
                <Button
                  type="button"
                  variant={type === "saida" ? "default" : "outline"}
                  className={
                    type === "saida"
                      ? "bg-rose-600 hover:bg-rose-500 text-white font-bold"
                      : "border-border text-muted-foreground"
                  }
                  onClick={() => setType("saida")}
                >
                  <ArrowUpCircle className="mr-2 h-4 w-4" /> Saída (-)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cash-amount" className="text-xs font-semibold">
                Valor (R$)
              </Label>
              <Input
                id="cash-amount"
                type="text"
                placeholder="R$ 0,00"
                value={amount}
                onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
                className="font-mono text-sm font-bold text-emerald-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cash-motive" className="text-xs font-semibold">
                Motivo / Identificação *
              </Label>
              <Input
                id="cash-motive"
                placeholder="Ex: Aporte semanal de membros / Compra de insumos"
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cash-notes" className="text-xs font-semibold">
                Observações (Opcional)
              </Label>
              <Textarea
                id="cash-notes"
                placeholder="Detalhes adicionais da transação..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 text-xs"
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Landmark className="mr-2 h-4 w-4" />
              )}
              Confirmar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE ESTORNO DE MOVIMENTAÇÃO */}
      <Dialog open={!!reversingMovement} onOpenChange={(open) => !open && setReversingMovement(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <RotateCcw className="h-5 w-5 text-amber-400" /> Confirmar Estorno de Caixa
            </DialogTitle>
            <DialogDescription>
              Esta ação marcará a movimentação como estornada e recalculará o saldo atual do fundo de caixa.
            </DialogDescription>
          </DialogHeader>

          {reversingMovement && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>{reversingMovement.motive}</span>
                  <span className="font-mono text-amber-400">{currency(reversingMovement.amount)}</span>
                </div>
                <p className="text-muted-foreground">
                  Tipo: {reversingMovement.type === "entrada" ? "Entrada (+)" : "Saída (-)"} • Data: {dateTime(reversingMovement.created_at)}
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reversal-reason" className="text-xs font-semibold">
                  Motivo do Estorno (Opcional)
                </Label>
                <Input
                  id="reversal-reason"
                  placeholder="Ex: Valor digitado incorretamente..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReversingMovement(null)} className="text-xs">
              Cancelar
            </Button>
            <Button
              onClick={() => reverseMutation.mutate()}
              disabled={reverseMutation.isPending}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs"
            >
              {reverseMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE EXCLUSÃO DEFINITIVA */}
      <Dialog open={!!deletingMovement} onOpenChange={(open) => !open && setDeletingMovement(null)}>
        <DialogContent className="sm:max-w-md border-rose-500/40">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="h-5 w-5 text-rose-400" /> Excluir Lançamento Definitivamente
            </DialogTitle>
            <DialogDescription>
              Atenção: esta ação removerá o registro do histórico do fundo de caixa e não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {deletingMovement && (
            <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs space-y-1">
              <div className="flex justify-between font-bold text-foreground">
                <span>{deletingMovement.motive}</span>
                <span className="font-mono text-rose-400">{currency(deletingMovement.amount)}</span>
              </div>
              <p className="text-muted-foreground">
                Registrado por: {deletingMovement.user_name || "Sistema"} • {dateTime(deletingMovement.created_at)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingMovement(null)} className="text-xs">
              Cancelar
            </Button>
            <Button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
