import { cn } from "@/lib/utils";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

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
  const { settings } = usePlatformSettings();
  const factionName = settings.factionName || "Twin Wheels";
  const displaySubtitle =
    subtitle !== undefined
      ? subtitle
      : settings.slogan || settings.factionType || "Gestão Interna · GTA RP";

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
          alt={factionName}
          className={cn("object-contain drop-shadow-md rounded-full", logoSizes[size])}
        />
      ) : null}
      <div className="flex flex-col group-data-[collapsible=icon]:hidden">
        <span
          className={cn(
            "text-gradient-brand font-display font-extrabold uppercase leading-none tracking-[0.14em]",
            textSizes[size],
          )}
        >
          {factionName}
        </span>
        {displaySubtitle ? (
          <span className="mt-1 text-[0.65rem] uppercase tracking-[0.32em] text-muted-foreground">
            {displaySubtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
