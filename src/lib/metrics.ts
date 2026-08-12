import type { Member, Movement, Product, Sale, Goal } from "@/hooks/useData";
import { dayKey, inRange, previousWindow, type RangeKey } from "@/lib/format";

export const activeSales = (sales: Sale[]) => sales.filter((s) => s.status === "concluida");

export function salesMetrics(sales: Sale[], range: RangeKey) {
  const scoped = activeSales(sales).filter((s) => inRange(s.created_at, range));
  const faturamento = scoped.reduce((acc, s) => acc + Number(s.total_price), 0);
  const quantidade = scoped.reduce((acc, s) => acc + Number(s.quantity), 0);
  const vendas = scoped.length;
  return {
    scoped,
    faturamento,
    quantidade,
    vendas,
    ticket: vendas ? faturamento / vendas : 0,
  };
}

export function previousMetrics(sales: Sale[], range: RangeKey) {
  const win = previousWindow(range);
  if (!win) return null;
  const scoped = activeSales(sales).filter((s) => {
    const t = new Date(s.created_at).getTime();
    return t >= win.start.getTime() && t < win.end.getTime();
  });
  const faturamento = scoped.reduce((acc, s) => acc + Number(s.total_price), 0);
  return {
    faturamento,
    vendas: scoped.length,
    quantidade: scoped.reduce((acc, s) => acc + Number(s.quantity), 0),
  };
}

export function trendPercent(current: number, previous: number | undefined | null) {
  if (previous === undefined || previous === null) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function seriesByDay(
  items: { created_at: string }[],
  valueOf: (item: never) => number,
  days = 14,
) {
  const buckets = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    buckets.set(dayKey(d), 0);
  }
  for (const item of items) {
    const key = dayKey(item.created_at);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + valueOf(item as never));
    }
  }
  return Array.from(buckets.entries()).map(([key, value]) => ({ key, value }));
}

export function lowStock(products: Product[]) {
  return products.filter(
    (p) => p.ativo && Number(p.estoque_atual) <= Number(p.estoque_minimo),
  );
}

export type MemberStats = {
  user_id: string;
  vendas: number;
  faturamento: number;
  quantidade: number;
  movimentacoes: number;
  entradas: number;
  saidas: number;
  atividade: number;
};

export function memberStats(
  members: Member[],
  sales: Sale[],
  movements: Movement[],
  range: RangeKey,
): MemberStats[] {
  const scopedSales = activeSales(sales).filter((s) => inRange(s.created_at, range));
  const scopedMoves = movements.filter((m) => inRange(m.created_at, range));

  return members
    .map((member) => {
      const mySales = scopedSales.filter((s) => s.seller_id === member.user_id);
      const myMoves = scopedMoves.filter((m) => m.user_id === member.user_id);
      const entradas = myMoves.filter((m) => m.type === "entrada").length;
      const saidas = myMoves.filter((m) => m.type === "saida").length;
      return {
        user_id: member.user_id,
        vendas: mySales.length,
        faturamento: mySales.reduce((acc, s) => acc + Number(s.total_price), 0),
        quantidade: mySales.reduce((acc, s) => acc + Number(s.quantity), 0),
        movimentacoes: myMoves.length,
        entradas,
        saidas,
        atividade: myMoves.length + mySales.length,
      };
    })
    .sort((a, b) => b.faturamento - a.faturamento);
}

export type GoalProgress = {
  goal: Goal;
  current: number;
  percent: number;
  status: "nao_iniciada" | "em_andamento" | "concluida" | "atrasada";
};

export const GOAL_STATUS_LABEL: Record<GoalProgress["status"], string> = {
  nao_iniciada: "Não iniciada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  atrasada: "Atrasada",
};

export const GOAL_TYPE_LABEL: Record<Goal["type"], string> = {
  vendas: "Nº de vendas",
  faturamento: "Faturamento",
  quantidade: "Quantidade vendida",
};

export function goalProgress(goal: Goal, sales: Sale[]): GoalProgress {
  const start = new Date(`${goal.period_start}T00:00:00`).getTime();
  const end = new Date(`${goal.period_end}T23:59:59`).getTime();
  const scoped = activeSales(sales).filter((s) => {
    const t = new Date(s.created_at).getTime();
    return s.seller_id === goal.user_id && t >= start && t <= end;
  });

  const current =
    goal.type === "vendas"
      ? scoped.length
      : goal.type === "faturamento"
        ? scoped.reduce((acc, s) => acc + Number(s.total_price), 0)
        : scoped.reduce((acc, s) => acc + Number(s.quantity), 0);

  const percent = Math.min(100, (current / Number(goal.target_value)) * 100);
  const now = Date.now();
  let status: GoalProgress["status"] = "em_andamento";
  if (percent >= 100) status = "concluida";
  else if (now > end) status = "atrasada";
  else if (current === 0) status = now < start ? "nao_iniciada" : "em_andamento";

  return { goal, current, percent, status };
}
