import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductThumbnailProps {
  src?: string | null;
  imageUrl?: string | null;
  name?: string;
  productName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  fallbackIconClassName?: string;
  fit?: "cover" | "contain";
}

const sizeClasses = {
  xs: "h-6 w-6 rounded-md",
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-12 w-12 rounded-xl",
  xl: "h-16 w-16 rounded-2xl",
  "2xl": "h-20 w-20 rounded-2xl",
  full: "h-full w-full rounded-xl",
};

const iconSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
  "2xl": "h-10 w-10",
  full: "h-10 w-10",
};

export function ProductThumbnail({
  src,
  imageUrl,
  name,
  productName,
  size = "md",
  className,
  fallbackIconClassName,
  fit = "cover",
}: ProductThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const cleanSrc = (src || imageUrl)?.trim();
  const effectiveName = name || productName || "Produto";

  useEffect(() => {
    setHasError(false);
  }, [cleanSrc]);

  if (cleanSrc && !hasError) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden border border-border/80 bg-secondary/50 shadow-sm transition-all duration-200 hover:scale-105 hover:border-primary/50",
          sizeClasses[size],
          className
        )}
        title={effectiveName}
      >
        <img
          src={cleanSrc}
          alt={effectiveName}
          className={cn(
            "h-full w-full object-center",
            fit === "contain" ? "object-contain p-1" : "object-cover"
          )}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-border/60 bg-secondary/40 text-muted-foreground shadow-sm",
        sizeClasses[size],
        className
      )}
      title={effectiveName}
    >
      <Package className={cn(iconSizes[size], "text-primary/70", fallbackIconClassName)} />
    </div>
  );
}
