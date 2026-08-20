import { cn } from "@/lib/utils";

export function Brand({
  className,
  size = "md",
  subtitle,
  showLogo = true,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  subtitle?: string;
  showLogo?: boolean;
}) {
  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl sm:text-5xl",
  } as const;

  const logoSizes = {
    sm: "h-7 w-7",
    md: "h-10 w-10",
    lg: "h-20 w-20 sm:h-24 sm:w-24",
  } as const;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {showLogo ? (
        <img
          src="/logo.png"
          alt="Twin Wheels"
          className={cn("object-contain drop-shadow-md rounded-full", logoSizes[size])}
        />
      ) : null}
      <div className="flex flex-col">
        <span
          className={cn(
            "text-gradient-brand font-display font-extrabold uppercase leading-none tracking-[0.14em]",
            textSizes[size],
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
    </div>
  );
}

