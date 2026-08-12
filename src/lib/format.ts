export const currency = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value ?? 0),
  );

export const compactCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));

export const num = (value: number | null | undefined, digits = 0) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(Number(value ?? 0));

export const dateTime = (value: string | Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(value),
      )
    : "—";

export const dateOnly = (value: string | Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
    : "—";

export const dayKey = (value: string | Date) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

export const dayLabel = (key: string) => {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
};

export type RangeKey = "hoje" | "7d" | "30d" | "mes" | "tudo";

export const RANGE_LABEL: Record<RangeKey, string> = {
  hoje: "Hoje",
  "7d": "7 dias",
  "30d": "30 dias",
  mes: "Este mês",
  tudo: "Tudo",
};

export function rangeStart(range: RangeKey): Date | null {
  const now = new Date();
  switch (range) {
    case "hoje":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "7d":
      return new Date(now.getTime() - 6 * 86400000);
    case "30d":
      return new Date(now.getTime() - 29 * 86400000);
    case "mes":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

export function inRange(value: string, range: RangeKey) {
  const start = rangeStart(range);
  if (!start) return true;
  return new Date(value).getTime() >= start.getTime();
}

export function previousWindow(range: RangeKey): { start: Date; end: Date } | null {
  const start = rangeStart(range);
  if (!start) return null;
  const now = new Date();
  const span = now.getTime() - start.getTime();
  return { start: new Date(start.getTime() - span), end: start };
}

export function errorMessage(error: unknown, fallback = "Não foi possível concluir a operação.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  const anyErr = error as { message?: string; details?: string };
  return anyErr.message || anyErr.details || fallback;
}
