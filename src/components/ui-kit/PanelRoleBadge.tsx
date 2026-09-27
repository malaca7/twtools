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
}

export function DevBadge({
  size = "xs",
  showIcon = true,
  className,
  label = "DEV",
}: RoleBadgeProps) {
  const { devStyle, DevIcon } = usePanelTheme();

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

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono font-black border uppercase tracking-wider inline-flex items-center shrink-0 shadow-xs backdrop-blur-xs transition-colors",
        devStyle.badgeClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <DevIcon className={cn("shrink-0", iconSizes[size])} />}
      <span>{label}</span>
    </Badge>
  );
}

export function CeoBadge({
  size = "xs",
  showIcon = true,
  className,
  label = "CEO",
}: RoleBadgeProps) {
  const { ceoStyle, CeoIcon } = usePanelTheme();

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

  return (
    <Badge
      className={cn(
        "font-bold uppercase tracking-wider inline-flex items-center shrink-0 shadow-xs backdrop-blur-xs transition-colors border",
        ceoStyle.badgeClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <CeoIcon className={cn("shrink-0", iconSizes[size])} />}
      <span>{label}</span>
    </Badge>
  );
}

export function MemberBadge({
  size = "xs",
  showIcon = true,
  className,
  label = "MEMBRO",
}: RoleBadgeProps) {
  const { memberStyle, MemberIcon } = usePanelTheme();

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

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-bold uppercase tracking-wider inline-flex items-center shrink-0 shadow-xs backdrop-blur-xs transition-colors border",
        memberStyle.badgeClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <MemberIcon className={cn("shrink-0", iconSizes[size])} />}
      <span>{label}</span>
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
}: PanelRoleBadgeProps) {
  const { devStyle, ceoStyle, memberStyle, DevIcon, CeoIcon, MemberIcon } = usePanelTheme();

  if (isDev || level === "desenvolvedor") {
    return <DevBadge size={size} showIcon={showIcon} className={className} />;
  }

  if (isCeo) {
    return <CeoBadge size={size} showIcon={showIcon} className={className} />;
  }

  if (level === "membro") {
    return <MemberBadge size={size} showIcon={showIcon} className={className} />;
  }

  const roleLabel = level ? (LEVEL_LABEL[level as AppLevel] || level) : "Membro";

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0 h-4",
        className
      )}
    >
      {roleLabel}
    </Badge>
  );
}
