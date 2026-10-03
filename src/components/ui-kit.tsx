import React, { type ReactNode, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  icon,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode | React.ComponentType<{ className?: string }>;
  children?: ReactNode;
}) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === "function") {
      const Comp = icon as React.ComponentType<{ className?: string }>;
      return <Comp className="h-6 w-6 text-primary" />;
    }
    if (typeof icon === "object" && icon !== null) {
      if ("render" in icon || "$$typeof" in icon) {
        try {
          const Comp = icon as React.ComponentType<{ className?: string }>;
          return <Comp className="h-6 w-6 text-primary" />;
        } catch {
          return null;
        }
      }
      return null;
    }
    if (typeof icon === "string" || typeof icon === "number") {
      return icon;
    }
    return null;
  };

  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mt-0.5">
            {renderIcon()}
          </div>
        ) : null}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 max-w-2xl text-xs sm:text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2 pt-1 sm:pt-0">{actions}</div> : null}
      {children}
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
  icon?: ReactNode | React.ComponentType<{ className?: string }>;
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

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === "function") {
      const Comp = icon as React.ComponentType<{ className?: string }>;
      return <Comp className="h-5 w-5" />;
    }
    if (typeof icon === "object" && icon !== null) {
      if ("render" in icon || "$$typeof" in icon) {
        try {
          const Comp = icon as React.ComponentType<{ className?: string }>;
          return <Comp className="h-5 w-5" />;
        } catch {
          return null;
        }
      }
      return null;
    }
    if (typeof icon === "string" || typeof icon === "number") {
      return icon;
    }
    return null;
  };

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
            <span className={cn("rounded-xl p-2.5", accentRing)}>{renderIcon()}</span>
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
  icon?: ReactNode | React.ComponentType<{ className?: string }>;
}) {
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === "function") {
      const Comp = icon as React.ComponentType<{ className?: string }>;
      return <Comp className="h-10 w-10 text-muted-foreground" />;
    }
    if (typeof icon === "object" && icon !== null) {
      if ("render" in icon || "$$typeof" in icon) {
        try {
          const Comp = icon as React.ComponentType<{ className?: string }>;
          return <Comp className="h-10 w-10 text-muted-foreground" />;
        } catch {
          return null;
        }
      }
      return null;
    }
    if (typeof icon === "string" || typeof icon === "number") {
      return icon;
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-muted-foreground">{renderIcon()}</div> : null}
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

export function NoAccess({
  title = "Acesso restrito",
  description,
  message,
  icon,
  action,
}: {
  title?: string;
  description?: string;
  message?: string;
  icon?: ReactNode | React.ComponentType<{ className?: string }>;
  action?: ReactNode;
} = {}) {
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;

    // Log access denied event asynchronously
    const page = typeof window !== "undefined" ? window.location.pathname : "unknown";
    import("@/lib/app-api").then(({ logAccessDenied }) => {
      void logAccessDenied(page);
    }).catch(() => {});
  }, []);

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={message || description || "Seu nível hierárquico não permite visualizar esta área. Fale com um administrador (01/02)."}
      action={action}
    />
  );
}

export { ProductThumbnail } from "@/components/ui/product-thumbnail";
export * from "@/components/ui-kit/PanelRoleBadge";


