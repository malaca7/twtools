import React, { useMemo } from "react";
import {
  BadgeCheck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Crown,
  Star,
  Award,
  Flame,
  Zap,
  Shield,
  Gem,
  Trophy,
  Target,
  Check,
  CheckCheck,
  Heart,
  Swords,
  ShieldAlert,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useVerificationConfig, useMemberVerifications } from "@/hooks/useVerificationBadge";
import { cn } from "@/lib/utils";

export type VerifiedBadgeSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface VerifiedBadgeProps {
  /**
   * Se o membro está verificado (aprovado). O selo só é exibido quando for verdadeiro,
   * ou quando userId/member for informado e o membro estiver verificado no sistema.
   */
  isVerified?: boolean | null;
  /** ID do usuário/membro para checagem automática e carregamento de customizações individuais */
  userId?: string | null;
  /** Objeto de membro (caso disponível) */
  member?: any | null;
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
  glowStyle?: "cyan" | "gold" | "emerald" | "purple" | "rose" | "auto" | "none" | string;
  /** Classes CSS adicionais */
  className?: string;
  /** Desativar tooltip */
  noTooltip?: boolean;
}

export const VERIFIED_ICONS_MAP: Record<string, React.ElementType> = {
  BadgeCheck,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Crown,
  Star,
  Award,
  Flame,
  Zap,
  Shield,
  Gem,
  Trophy,
  Target,
  Check,
  CheckCheck,
  Heart,
  Swords,
  ShieldAlert,
};

const SIZE_CLASSES: Record<VerifiedBadgeSize, { icon: string; container: string; text: string }> = {
  xs: { icon: "h-3.5 w-3.5", container: "h-3.5 w-3.5", text: "text-[9px]" },
  sm: { icon: "h-4 w-4", container: "h-4 w-4", text: "text-[10px]" },
  md: { icon: "h-5 w-5", container: "h-5 w-5", text: "text-xs" },
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
  isVerified,
  userId,
  member,
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
  const { data: verifications } = useMemberVerifications();

  // Resolução do ID do membro
  const effectiveUserId = useMemo(() => {
    return userId || member?.user_id || member?.id || null;
  }, [userId, member]);

  // Busca eventual personalização direta para o membro
  const memberVerRecord = useMemo(() => {
    if (!effectiveUserId || !verifications || verifications.length === 0) return null;
    return (
      verifications.find(
        (v) =>
          v.user_id === effectiveUserId ||
          v.id === `ver_${effectiveUserId}` ||
          (v.member && (v.member.user_id === effectiveUserId || (v.member as any).id === effectiveUserId))
      ) || null
    );
  }, [effectiveUserId, verifications]);

  // Determina se o membro está verificado
  const computedVerified = useMemo(() => {
    if (preview === true) return true;
    if (isVerified === true) return true;
    if (member?.is_verified === true) return true;
    if (memberVerRecord?.is_verified === true) return true;
    return false;
  }, [preview, isVerified, member, memberVerRecord]);

  // Se não estiver verificado e não for preview, não renderiza
  if (!computedVerified) {
    return null;
  }

  // Se o sistema global estiver desabilitado e não for preview nem cor forçada
  if (config && !config.is_enabled && !color && !preview) {
    return null;
  }

  // Resolução da identidade visual seguindo a hierarquia:
  // 1. Props explícitos passados ao componente
  // 2. Customizações específicas do membro (se gravadas em member_verifications)
  // 3. Configuração oficial definida em "Personalização Visual & Requisitos do Selo"
  // 4. Fallback padrão da Twin Wheels
  const effectiveIconName =
    iconName ||
    memberVerRecord?.badge_icon_override ||
    config?.badge_icon ||
    "BadgeCheck";

  const effectiveColor =
    color ||
    memberVerRecord?.badge_color_override ||
    config?.badge_color ||
    "#38bdf8";

  const rawGlow = glowStyle !== undefined ? glowStyle : config?.glow_style || "cyan";

  const effectiveTooltip =
    tooltip ||
    memberVerRecord?.custom_title ||
    config?.tooltip_text ||
    config?.badge_name ||
    "Membro Oficial Verificado";

  const effectiveText =
    text ||
    memberVerRecord?.custom_title ||
    config?.badge_name ||
    "Verificado";

  const IconComponent = VERIFIED_ICONS_MAP[effectiveIconName] || BadgeCheck;
  const sizeConfig = SIZE_CLASSES[size] || SIZE_CLASSES.sm;

  // Cálculo do estilo de Glow (brilho)
  const isNoneGlow = rawGlow === "none";
  const presetGlowClass = !isNoneGlow && GLOW_CLASSES[rawGlow] ? GLOW_CLASSES[rawGlow] : "";
  const dynamicFilter =
    !isNoneGlow && !presetGlowClass
      ? `drop-shadow(0 0 6px ${effectiveColor}aa)`
      : undefined;

  const badgeElement = (
    <span
      className={cn(
        "inline-flex items-center gap-1 select-none transition-all duration-200 hover:scale-110 shrink-0 align-middle",
        showText && "px-1.5 py-0.5 rounded-full border",
        className
      )}
      style={{
        color: effectiveColor,
        ...(showText
          ? {
              backgroundColor: `${effectiveColor}15`,
              borderColor: `${effectiveColor}35`,
            }
          : {}),
      }}
      aria-label={effectiveTooltip}
    >
      <IconComponent
        className={cn(
          sizeConfig.icon,
          presetGlowClass,
          "fill-current/15 stroke-[2.2] transition-all"
        )}
        style={dynamicFilter ? { filter: dynamicFilter } : undefined}
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
          className="text-xs font-semibold px-2.5 py-1 rounded-lg border shadow-lg bg-popover/95 backdrop-blur-md flex items-center gap-1.5 z-50 pointer-events-none"
          style={{ borderColor: `${effectiveColor}40` }}
        >
          <IconComponent className="h-3.5 w-3.5 shrink-0" style={{ color: effectiveColor }} />
          <span>{effectiveTooltip}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Componente utilitário de conveniência que renderiza o nome do membro
 * acompanhado do Selo Oficial de Verificado de forma padronizada.
 */
export function MemberDisplayName({
  name,
  nickname,
  userId,
  isVerified,
  badgeSize = "xs",
  className,
  nameClassName,
  showFullIdentity = false,
}: {
  name?: string | null;
  nickname?: string | null;
  userId?: string | null;
  isVerified?: boolean | null;
  badgeSize?: VerifiedBadgeSize;
  className?: string;
  nameClassName?: string;
  showFullIdentity?: boolean;
}) {
  const mainName = nickname || name || "Membro";
  const subName = showFullIdentity && nickname && name && nickname !== name ? ` (${name})` : "";

  return (
    <span className={cn("inline-flex items-center gap-1.5 min-w-0 flex-wrap", className)}>
      <span className={cn("truncate", nameClassName)}>
        {mainName}
        {subName}
      </span>
      <VerifiedBadge userId={userId} isVerified={isVerified} size={badgeSize} />
    </span>
  );
}
