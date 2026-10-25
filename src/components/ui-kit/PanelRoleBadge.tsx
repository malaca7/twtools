import React from "react";
import { Badge } from "@/components/ui/badge";
import { usePanelTheme } from "@/lib/panelTheme";
import { cn } from "@/lib/utils";
import type { AppLevel } from "@/lib/permissions";
import { LEVEL_LABEL } from "@/lib/permissions";

export interface RoleBadgeProps {
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
  className?: string;
  label?: string;
  text?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function DevBadge({
  size = "xs",
  showIcon = true,
  className,
  label = "DEV",
  text,
  children,
  style,
}: RoleBadgeProps) {
  const { devStyle, DevIcon } = usePanelTheme();
  const badgeText = children ?? text ?? label;

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0 h-4 gap-1",
    sm: "text-[10px] px-2 py-0.5 h-5 gap-1.5",
    md: "text-xs px-2.5 py-1 h-6 gap-1.5",
  };

  const iconSizes = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  };

  const dynamicBg =
    devStyle.isGradient && devStyle.previewGradient
      ? `color-mix(in srgb, ${devStyle.primaryHex} 18%, transparent)`
      : `${devStyle.primaryHex}18`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono font-black border uppercase tracking-wider inline-flex items-center shrink-0 shadow-xs backdrop-blur-xs transition-colors select-none",
        devStyle.badgeClass,
        sizeClasses[size],
        className
      )}
      style={{
        borderColor: `${devStyle.primaryHex}55`,
        backgroundColor: dynamicBg,
        color: devStyle.primaryHex,
        boxShadow: `0 0 10px -2px ${devStyle.primaryHex}25`,
        ...style,
      }}
    >
      {showIcon && <DevIcon className={cn("shrink-0", iconSizes[size])} />}
      <span>{badgeText}</span>
    </Badge>
  );
}

export function CeoBadge({
  size = "xs",
  showIcon = true,
  className,
  label = "CEO",
  text,
  children,
  style,
}: RoleBadgeProps) {
  const { ceoStyle, CeoIcon } = usePanelTheme();
  const badgeText = children ?? text ?? label;

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0 h-4 gap-1",
    sm: "text-[10px] px-2 py-0.5 h-5 gap-1.5",
    md: "text-xs px-2.5 py-1 h-6 gap-1.5",
  };

  const iconSizes = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  };

  const dynamicBg =
    ceoStyle.isGradient && ceoStyle.previewGradient
      ? `color-mix(in srgb, ${ceoStyle.primaryHex} 18%, transparent)`
      : `${ceoStyle.primaryHex}18`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-bold uppercase tracking-wider inline-flex items-center shrink-0 shadow-xs backdrop-blur-xs transition-colors border select-none",
        ceoStyle.badgeClass,
        sizeClasses[size],
        className
      )}
      style={{
        borderColor: `${ceoStyle.primaryHex}55`,
        backgroundColor: dynamicBg,
        color: ceoStyle.primaryHex,
        boxShadow: `0 0 10px -2px ${ceoStyle.primaryHex}25`,
        ...style,
      }}
    >
      {showIcon && <CeoIcon className={cn("shrink-0", iconSizes[size])} />}
      <span>{badgeText}</span>
    </Badge>
  );
}

export function MemberBadge({
  size = "xs",
  showIcon = true,
  className,
  label = "MEMBRO",
  text,
  children,
  style,
}: RoleBadgeProps) {
  const { memberStyle, MemberIcon } = usePanelTheme();
  const badgeText = children ?? text ?? label;

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0 h-4 gap-1",
    sm: "text-[10px] px-2 py-0.5 h-5 gap-1.5",
    md: "text-xs px-2.5 py-1 h-6 gap-1.5",
  };

  const iconSizes = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  };

  const dynamicBg =
    memberStyle.isGradient && memberStyle.previewGradient
      ? `color-mix(in srgb, ${memberStyle.primaryHex} 18%, transparent)`
      : `${memberStyle.primaryHex}18`;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-bold uppercase tracking-wider inline-flex items-center shrink-0 shadow-xs backdrop-blur-xs transition-colors border select-none",
        memberStyle.badgeClass,
        sizeClasses[size],
        className
      )}
      style={{
        borderColor: `${memberStyle.primaryHex}55`,
        backgroundColor: dynamicBg,
        color: memberStyle.primaryHex,
        boxShadow: `0 0 10px -2px ${memberStyle.primaryHex}25`,
        ...style,
      }}
    >
      {showIcon && <MemberIcon className={cn("shrink-0", iconSizes[size])} />}
      <span>{badgeText}</span>
    </Badge>
  );
}

export interface PanelRoleBadgeProps extends RoleBadgeProps {
  isDev?: boolean;
  isCeo?: boolean;
  level?: AppLevel | string | null;
}

export function PanelRoleBadge({
  isDev,
  isCeo,
  level,
  size = "xs",
  showIcon = true,
  className,
  style,
}: PanelRoleBadgeProps) {
  const norm = String(level || "").toLowerCase().trim();

  if (isDev || norm === "desenvolvedor" || norm === "dev") {
    return <DevBadge size={size} showIcon={showIcon} className={className} style={style} />;
  }

  if (isCeo || norm === "ceo") {
    return <CeoBadge size={size} showIcon={showIcon} className={className} style={style} />;
  }

  if (norm === "membro") {
    return <MemberBadge size={size} showIcon={showIcon} className={className} style={style} />;
  }

  const roleLabel = level ? LEVEL_LABEL[level as AppLevel] || level : "Membro";

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0 h-4 select-none",
        className
      )}
      style={style}
    >
      {roleLabel}
    </Badge>
  );
}
