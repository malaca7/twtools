import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon,
  trend,
  loading,
  accent = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  trend?: number | null;
  loading?: boolean;
  accent?: "primary" | "accent" | "success" | "warning" | "destructive";
}) {
  const accentRing = {
    primary: "text-primary bg-primary/10",
    accent: "text-accent bg-accent/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  }[accent];

  return (
    <Card className="surface-card overflow-hidden transition-transform duration-200 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-3 h-7 w-24" />
            ) : (
              <p className="mt-2 truncate text-2xl font-semibold text-foreground">{value}</p>
            )}
            {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
            {typeof trend === "number" && Number.isFinite(trend) ? (
              <p
                className={cn(
                  "mt-2 text-xs font-medium",
                  trend >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}% vs período anterior
              </p>
            ) : null}
          </div>
          {icon ? (
            <span className={cn("rounded-xl p-2.5", accentRing)}>{icon}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function NoAccess() {
  return (
    <EmptyState
      title="Acesso restrito"
      description="Seu nível hierárquico não permite visualizar esta área. Fale com um administrador (01/02)."
    />
  );
}
