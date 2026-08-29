import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Search,
  Plus,
  Loader2,
} from "lucide-react";
import { PageHeader, NoAccess, TableSkeleton, EmptyState, ProductThumbnail } from "@/components/ui-kit";
import { SaleDialog, PAYMENT_LABEL, PAYMENT_METHODS } from "@/components/operations/SaleDialog";
import { useAuth } from "@/hooks/useAuth";
import { useSales, useProducts, useMembers, nameOf, productName } from "@/hooks/useData";
import { reverseSale } from "@/lib/app-api";
import { currency, dateTime, errorMessage, num } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/vendas")({
  component: VendasPage,
});

function VendasPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canView = hasPermission("view_sales");
  const canCreate = hasPermission("create_sale");
  const canReverse = hasPermission("reverse_sale");

  const { data: sales = [], isLoading: loadingSales } = useSales();
  const { data: products = [] } = useProducts();
  const { data: members = [] } = useMembers();

  // Filters state
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Reverse Sale state
  const [saleToReverse, setSaleToReverse] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState("");

  const reverseMutation = useMutation({
    mutationFn: async () => {
      if (!canReverse) throw new Error("Você não possui permissão para estornar vendas.");
      if (!saleToReverse) return;
      await reverseSale(saleToReverse, reverseReason.trim() || "Estorno solicitado");
    },
    onSuccess: () => {
      toast.success("Venda estornada com sucesso. Estoque restaurado.");
      void queryClient.invalidateQueries({ queryKey: ["sales"] });
      void queryClient.invalidateQueries({ queryKey: ["movements"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      setSaleToReverse(null);
      setReverseReason("");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!canView) return <NoAccess />;

  // Filtered sales
  const filteredSales = sales.filter((s) => {
    const pName = productName(products, s.product_id).toLowerCase();
    const seller = nameOf(members, s.seller_id).toLowerCase();
    const buyer = (s.buyer_name || "").toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = !search || pName.includes(query) || seller.includes(query) || buyer.includes(query);
    const matchesPayment = paymentFilter === "all" || s.payment_method === paymentFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  // Calculate statistics
  const activeSales = sales.filter((s) => s.status === "concluida");
  const totalRevenue = activeSales.reduce((acc, s) => acc + Number(s.total_price), 0);
  const totalSalesCount = activeSales.length;
  const avgTicket = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const salesToday = activeSales.filter((s) => s.created_at.startsWith(todayStr));
  const revenueToday = salesToday.reduce((acc, s) => acc + Number(s.total_price), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Vendas"
        description="Gestão de vendas do grupo com estorno automático de estoque."
        actions={
          canCreate ? (
            <SaleDialog
              trigger={
                <Button className="bg-gradient-brand text-primary-foreground hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" /> Nova venda
                </Button>
              }
            />
          ) : null
        }
      />

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Faturamento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{totalSalesCount} vendas concluídas</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Vendas Hoje
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{salesToday.length}</div>
            <p className="text-xs text-muted-foreground">Faturado: {currency(revenueToday)}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{currency(avgTicket)}</div>
            <p className="text-xs text-muted-foreground">Média por transação</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Estornos
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {sales.filter((s) => s.status === "estornada").length}
            </div>
            <p className="text-xs text-muted-foreground">Vendas canceladas/revertidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto, vendedor ou comprador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Pagamentos</SelectItem>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="estornada">Estornada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardContent className="p-0">
          {loadingSales ? (
            <TableSkeleton rows={5} />
          ) : filteredSales.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="h-10 w-10 text-muted-foreground" />}
              title="Nenhuma venda encontrada"
              description="Não foram encontradas vendas com os filtros selecionados."
            />
          ) : (
            <>
              {/* MOBILE CARD VIEW */}
              <div className="space-y-3 p-3 md:hidden">
                {filteredSales.map((sale) => {
                  const p = products.find((x) => x.id === sale.product_id);
                  const isReversed = sale.status === "estornada";

                  return (
                    <div
                      key={sale.id}
                      className={cn(
                        "p-3.5 rounded-xl border bg-card shadow-sm space-y-2.5",
                        isReversed ? "border-rose-500/40 bg-rose-500/5 opacity-75" : "border-border/80"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <ProductThumbnail src={p?.imagem_url} name={p?.nome || productName(products, sale.product_id)} size="xs" />
                          <span className="font-bold text-xs text-foreground truncate">{productName(products, sale.product_id)}</span>
                        </div>

                        <Badge
                          className={
                            isReversed
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/40 text-[0.65rem] font-bold shrink-0"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[0.65rem] font-bold shrink-0"
                          }
                        >
                          {isReversed ? "Estornada" : "Concluída"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Quantidade / Total</span>
                          <span className="font-bold text-foreground">
                            {num(sale.quantity)} {p?.unidade || "un"} · <strong className="text-primary">{currency(sale.total_price)}</strong>
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-muted-foreground block">Pagamento</span>
                          <span className="font-medium text-foreground capitalize">
                            {PAYMENT_LABEL[sale.payment_method] || sale.payment_method}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-muted-foreground block">Vendedor</span>
                          <span className="font-medium text-foreground truncate block">
                            {nameOf(members, sale.seller_id)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-muted-foreground block">Comprador</span>
                          <span className="font-medium text-foreground truncate block">
                            {sale.buyer_name || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                        <span>{dateTime(sale.created_at)}</span>

                        {canReverse && !isReversed && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
                            onClick={() => setSaleToReverse(sale.id)}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" /> Estornar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data / Hora</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Qtd.</TableHead>
                      <TableHead className="text-right">Unitário</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Comprador</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      {canReverse ? <TableHead className="text-right">Ação</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => {
                      const p = products.find((x) => x.id === sale.product_id);
                      const isReversed = sale.status === "estornada";

                      return (
                        <TableRow key={sale.id} className={isReversed ? "opacity-60 bg-muted/20" : ""}>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {dateTime(sale.created_at)}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <ProductThumbnail src={p?.imagem_url} name={p?.nome || productName(products, sale.product_id)} size="xs" />
                              <span className="truncate">{productName(products, sale.product_id)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {num(sale.quantity)} {p?.unidade || "un"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {currency(sale.unit_price)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-accent">
                            {currency(sale.total_price)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {nameOf(members, sale.seller_id)}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {sale.buyer_name || "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="capitalize">
                              {PAYMENT_LABEL[sale.payment_method] || sale.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isReversed ? (
                              <Badge variant="destructive" className="text-[0.65rem]">
                                Estornada
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[0.65rem]">
                                Concluída
                              </Badge>
                            )}
                          </TableCell>
                          {canReverse ? (
                            <TableCell className="text-right">
                              {!isReversed ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                                  onClick={() => setSaleToReverse(sale.id)}
                                >
                                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Estornar
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
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

      {/* Reverse Confirmation Dialog */}
      <Dialog open={!!saleToReverse} onOpenChange={(open) => !open && setSaleToReverse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Estorno de Venda</DialogTitle>
            <DialogDescription>
              O valor da venda será estornado e a quantidade de itens será devolvida automaticamente ao estoque.
            </DialogDescription>
          </DialogHeader>

          {saleToReverse && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/60 my-1">
              <ProductThumbnail
                src={products.find((p) => p.id === saleToReverse.product_id)?.imagem_url}
                name={productName(products, saleToReverse.product_id)}
                size="md"
                className="rounded-xl border shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-foreground truncate">{productName(products, saleToReverse.product_id)}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {num(saleToReverse.quantity)} {products.find((p) => p.id === saleToReverse.product_id)?.unidade || "un"} · Total: {currency(saleToReverse.total_price)}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 py-2">
            <Input
              placeholder="Motivo do estorno (opcional)..."
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaleToReverse(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={reverseMutation.isPending}
              onClick={() => reverseMutation.mutate()}
            >
              {reverseMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Estornar Venda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
