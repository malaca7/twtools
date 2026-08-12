import { cn } from "@/lib/utils";

export function Brand({
  className,
  size = "md",
  subtitle,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  subtitle?: string;
}) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-5xl sm:text-6xl",
  } as const;

  return (
    <div className={cn("flex flex-col", className)}>
      <span
        className={cn(
          "text-gradient-brand font-display font-extrabold uppercase leading-none tracking-[0.14em]",
          sizes[size],
        )}
      >
        Twin Wheels
      </span>
      {subtitle ? (
        <span className="mt-1 text-[0.65rem] uppercase tracking-[0.32em] text-muted-foreground">
          {subtitle}
        </span>
      ) : null}
    </div>
  );
}
