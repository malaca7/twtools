import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState, KpiCard, PageHeader } from "@/components/ui-kit";
import { MovementDialog } from "@/components/operations/MovementDialog";
import { SaleDialog } from "@/components/operations/SaleDialog";
import { useAuth } from "@/hooks/useAuth";
import {
  nameOf,
  productName,
  useGoals,
  useMembers,
  useMovements,
  useProducts,
  useSales,
} from "@/hooks/useData";
import { currency, dateTime, dayLabel, num } from "@/lib/format";
import {
  goalProgress,
  lowStock,
  memberStats,
  previousMetrics,
  salesMetrics,
  seriesByDay,
  trendPercent,
} from "@/lib/metrics";
import { LEVEL_LABEL, levelBadgeClass } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, level, hasPermission, user } = useAuth();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: sales = [], isLoading: loadingSales } = useSales();
  const { data: movements = [], isLoading: loadingMoves } = useMovements();
  const { data: members = [] } = useMembers();
  const { data: goals = [] } = useGoals();

  const canFinance = hasPermission("view_financials");
  const metrics = salesMetrics(sales, "30d");
  const prev = previousMetrics(sales, "30d");
  const alerts = lowStock(products);
  const ranking = memberStats(members, sales, movements, "30d").slice(0, 5);
  const myGoals = goals
    .filter((g) => g.user_id === user?.id)
    .map((g) => goalProgress(g, sales))
    .slice(0, 3);

  const totalEstoque = products.reduce((acc, p) => acc + Number(p.estoque_atual), 0);
  const entradas = movements.filter((m) => m.type === "entrada").length;
  const saidas = movements.filter((m) => m.type === "saida").length;

  const salesSeries = seriesByDay(metrics.scoped, (s: { total_price: number }) =>
    Number(s.total_price),
  ).map((d) => ({ dia: dayLabel(d.key), valor: d.value }));

  const stockSeries = seriesByDay(movements, () => 1)
    .map((d) => ({
      dia: dayLabel(d.key),
      entradas: movements.filter(
        (m) => m.type === "entrada" && m.created_at.slice(0, 10) === d.key,
      ).length,
      saidas: movements.filter((m) => m.type === "saida" && m.created_at.slice(0, 10) === d.key)
        .length,
    }))
    .slice(-14);

  const recent = [...movements].slice(0, 6);
  const bestSeller = ranking[0];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Salve, ${profile?.nickname || profile?.nome || "membro"}`}
        description="Visão geral das operações e resultados da Twin Wheels."
        actions={
          <div className="flex flex-wrap gap-2">
            {level ? (
              <Badge variant="outline" className={cn("self-center", levelBadgeClass(level))}>
                Nível {LEVEL_LABEL[level]}
              </Badge>
            ) : null}
            {hasPermission("create_movement") ? (
              <>
                <MovementDialog
                  defaultType="entrada"
                  trigger={
                    <Button variant="outline" size="sm">
                      <ArrowDownCircle className="mr-1 h-4 w-4" /> Entrada
                    </Button>
                  }
                />
                <MovementDialog
                  defaultType="saida"
                  trigger={
                    <Button variant="outline" size="sm">
                      <ArrowUpCircle className="mr-1 h-4 w-4" /> Saída
                    </Button>
                  }
                />
              </>
            ) : null}
            {hasPermission("create_sale") ? (
              <SaleDialog
                trigger={
                  <Button
                    size="sm"
                    className="bg-gradient-brand text-primary-foreground hover:opacity-90"
                  >
                    <ShoppingCart className="mr-1 h-4 w-4" /> Nova venda
                  </Button>
                }
              />
            ) : null}
            <Button asChild variant="ghost" size="sm">
              <Link to="/desempenho">
                <TrendingUp className="mr-1 h-4 w-4" /> Ver desempenho
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canFinance ? (
          <KpiCard
            label="Faturamento (30d)"
            value={currency(metrics.faturamento)}
            icon={<DollarSign className="h-5 w-5" />}
            loading={loadingSales}
            trend={trendPercent(metrics.faturamento, prev?.faturamento)}
          />
        ) : (
          <KpiCard
            label="Minhas vendas (30d)"
            value={num(sales.filter((s) => s.seller_id === user?.id).length)}
            icon={<ShoppingCart className="h-5 w-5" />}
            loading={loadingSales}
          />
        )}
        <KpiCard
          label="Vendas (30d)"
          value={num(metrics.vendas)}
          hint={canFinance ? `Ticket médio ${currency(metrics.ticket)}` : undefined}
          icon={<ShoppingCart className="h-5 w-5" />}
          accent="accent"
          loading={loadingSales}
        />
        <KpiCard
          label="Itens em estoque"
          value={num(totalEstoque)}
          hint={`${products.length} produtos cadastrados`}
          icon={<Boxes className="h-5 w-5" />}
          accent="success"
          loading={loadingProducts}
        />
        <KpiCard
          label="Estoque baixo"
          value={num(alerts.length)}
          hint={`${entradas} entradas · ${saidas} saídas`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent={alerts.length ? "warning" : "primary"}
          loading={loadingProducts || loadingMoves}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="surface-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {canFinance ? "Faturamento diário (14 dias)" : "Vendas diárias (14 dias)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesSeries}>
                <defs>
                  <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={60} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                  formatter={(v: number) => (canFinance ? currency(v) : num(v))}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="var(--color-primary)"
                  fill="url(#gradSales)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-accent" /> Ranking (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranking.length === 0 ? (
              <EmptyState title="Sem atividade registrada" />
            ) : (
              ranking.map((stat, index) => (
                <div key={stat.user_id} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
                      index === 0
                        ? "bg-gradient-brand text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{nameOf(members, stat.user_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.vendas} vendas · {stat.atividade} operações
                    </p>
                  </div>
                  {canFinance ? (
                    <span className="text-sm font-medium text-accent">
                      {currency(stat.faturamento)}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="surface-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Entradas x Saídas</CardTitle>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="dia" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={30} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="entradas" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-base">Alertas de estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum produto abaixo do mínimo. Tudo certo.
                </p>
              ) : (
                alerts.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{p.nome}</span>
                    <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
                      {num(p.estoque_atual)} / {num(p.estoque_minimo)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="surface-card">
            <CardHeader>
              <CardTitle className="text-base">Minhas metas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {myGoals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma meta atribuída a você.</p>
              ) : (
                myGoals.map((g) => (
                  <div key={g.goal.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{g.goal.type}</span>
                      <span className="font-medium">{g.percent.toFixed(0)}%</span>
                    </div>
                    <Progress value={g.percent} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="surface-card mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Atividades recentes</CardTitle>
          {bestSeller && canFinance ? (
            <span className="text-xs text-muted-foreground">
              Destaque: {nameOf(members, bestSeller.user_id)}
            </span>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {recent.length === 0 ? (
            <EmptyState
              title="Nenhuma movimentação ainda"
              description="Registre a primeira entrada de estoque para começar."
            />
          ) : (
            recent.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "rounded-lg p-1.5",
                      m.type === "entrada"
                        ? "bg-success/10 text-success"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {m.type === "entrada" ? (
                      <ArrowDownCircle className="h-4 w-4" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {productName(products, m.product_id)} · {num(m.quantity)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {nameOf(members, m.user_id)} · {m.reason || "Sem observação"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {dateTime(m.created_at)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
