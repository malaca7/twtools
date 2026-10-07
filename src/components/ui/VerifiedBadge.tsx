import React from "react";
import {
  BadgeCheck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Crown,
  Star,
  Flame,
  Zap,
  ShieldAlert,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useVerificationConfig } from "@/hooks/useVerificationBadge";
import { cn } from "@/lib/utils";

export type VerifiedBadgeSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface VerifiedBadgeProps {
  /**
   * Se o membro está verificado (aprovado). O selo SÓ é exibido quando for exatamente `true`;
   * `undefined`, `null` ou `false` nunca exibem o selo.
   */
  isVerified?: boolean | null;
  /**
   * Força a exibição apenas para pré-visualizações/ilustrações de configuração
   * (ex.: editor do selo, título do modal de solicitação). Nunca usar para membros.
   */
  preview?: boolean;
  /** Tamanho do selo */
  size?: VerifiedBadgeSize;
  /** Cor customizada para sobrepor a padrão */
  color?: string;
  /** Ícone customizado para sobrepor o padrão */
  iconName?: string;
  /** Texto do tooltip */
  tooltip?: string;
  /** Exibir texto ao lado do ícone */
  showText?: boolean;
  /** Texto personalizado ao lado */
  text?: string;
  /** Estilo de glow/brilho */
  glowStyle?: "cyan" | "gold" | "emerald" | "purple" | "rose" | "none" | string;
  /** Classes CSS adicionais */
  className?: string;
  /** Desativar tooltip */
  noTooltip?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  BadgeCheck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Crown,
  Star,
  Flame,
  Zap,
  ShieldAlert,
};

const SIZE_CLASSES: Record<VerifiedBadgeSize, { icon: string; container: string; text: string }> = {
  xs: { icon: "h-3 w-3", container: "h-3.5 w-3.5", text: "text-[9px]" },
  sm: { icon: "h-3.5 w-3.5", container: "h-4 w-4", text: "text-[10px]" },
  md: { icon: "h-4.5 w-4.5", container: "h-5 w-5", text: "text-xs" },
  lg: { icon: "h-6 w-6", container: "h-7 w-7", text: "text-sm" },
  xl: { icon: "h-8 w-8", container: "h-9 w-9", text: "text-base" },
};

const GLOW_CLASSES: Record<string, string> = {
  cyan: "drop-shadow-[0_0_6px_rgba(56,189,248,0.65)]",
  gold: "drop-shadow-[0_0_6px_rgba(245,158,11,0.65)]",
  emerald: "drop-shadow-[0_0_6px_rgba(16,185,129,0.65)]",
  purple: "drop-shadow-[0_0_6px_rgba(168,85,247,0.65)]",
  rose: "drop-shadow-[0_0_6px_rgba(244,63,94,0.65)]",
  none: "",
};

export function VerifiedBadge({
  isVerified = false,
  preview = false,
  size = "sm",
  color,
  iconName,
  tooltip,
  showText = false,
  text,
  glowStyle,
  className,
  noTooltip = false,
}: VerifiedBadgeProps) {
  const { data: config } = useVerificationConfig();

  // Regra de ouro: apenas membros aprovados (isVerified === true) exibem o selo.
  const shouldRender = isVerified === true || preview === true;
  if (!shouldRender) {
    return null;
  }

  // Se o sistema global estiver desabilitado e não for preview forçado
  if (config && !config.is_enabled && !color) {
    return null;
  }

  const effectiveIconName = iconName || config?.badge_icon || "BadgeCheck";
  const effectiveColor = color || config?.badge_color || "#38bdf8";
  const effectiveGlow = glowStyle !== undefined ? glowStyle : config?.glow_style || "cyan";
  const effectiveTooltip = tooltip || config?.tooltip_text || config?.badge_name || "Membro Oficial Verificado";
  const effectiveText = text || config?.badge_name || "Verificado";

  const IconComponent = ICON_MAP[effectiveIconName] || BadgeCheck;
  const sizeConfig = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
  const glowClass = GLOW_CLASSES[effectiveGlow] || GLOW_CLASSES.cyan;

  const badgeElement = (
    <span
      className={cn(
        "inline-flex items-center gap-1 select-none transition-transform duration-200 hover:scale-110 shrink-0",
        showText && "px-1.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20",
        className
      )}
      style={{ color: effectiveColor }}
    >
      <IconComponent
        className={cn(
          sizeConfig.icon,
          glowClass,
          "fill-current/15 stroke-[2.2] transition-all"
        )}
      />
      {showText && (
        <span className={cn("font-bold font-mono uppercase tracking-wider", sizeConfig.text)}>
          {effectiveText}
        </span>
      )}
    </span>
  );

  if (noTooltip) {
    return badgeElement;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badgeElement}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-xs font-semibold px-2.5 py-1 rounded-lg border shadow-lg bg-popover/95 backdrop-blur-md flex items-center gap-1.5"
          style={{ borderColor: `${effectiveColor}40` }}
        >
          <IconComponent className="h-3.5 w-3.5" style={{ color: effectiveColor }} />
          <span>{effectiveTooltip}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
