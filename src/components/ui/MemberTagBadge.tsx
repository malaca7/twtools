import React from "react";
import {
  Tag as TagIcon,
  ShoppingCart,
  ShieldAlert,
  Code2,
  Terminal,
  Lock,
  Sparkles,
  Zap,
  Award,
  Crown,
  Flame,
  BadgeCheck,
  UserCheck,
  Star,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberTag } from "@/services/memberTagsService";
import { usePanelTheme, resolveCategoryIcon } from "@/lib/panelTheme";

const TAG_ICONS: Record<string, LucideIcon> = {
  Tag: TagIcon,
  ShoppingCart,
  ShieldAlert,
  Code2,
  Terminal,
  Lock,
  Sparkles,
  Zap,
  Award,
  Crown,
  Flame,
  BadgeCheck,
  UserCheck,
  Star,
  Settings,
  Users,
};

export function resolveTagIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return TagIcon;
  if (TAG_ICONS[iconName]) return TAG_ICONS[iconName];
  return resolveCategoryIcon(iconName, TagIcon);
}

interface MemberTagBadgeProps {
  tag: MemberTag;
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
  onRemove?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function MemberTagBadge({
  tag,
  size = "sm",
  showIcon = true,
  onRemove,
  className,
  style,
}: MemberTagBadgeProps) {
  const { devStyle, ceoStyle, memberStyle, DevIcon, CeoIcon, MemberIcon } = usePanelTheme();

  const normalizedId = String(tag.id || "").toLowerCase().trim();
  const normalizedName = String(tag.name || "").toLowerCase().trim();

  const isDevTag =
    normalizedId === "dev" ||
    normalizedId === "desenvolvedor" ||
    normalizedName === "dev" ||
    normalizedName === "desenvolvedor" ||
    normalizedName.includes("desenvolvedor");

  const isCeoTag =
    !isDevTag &&
    (normalizedId === "ceo" ||
      normalizedName === "ceo" ||
      normalizedName === "diretoria" ||
      normalizedName === "executivo");

  const isMemberTag =
    !isDevTag &&
    !isCeoTag &&
    (normalizedId === "membro" ||
      normalizedName === "membro" ||
      normalizedName === "member");

  let activePanelStyle = null;
  let Icon: LucideIcon = resolveTagIcon(tag.icon);

  if (isDevTag) {
    activePanelStyle = devStyle;
    Icon = DevIcon;
  } else if (isCeoTag) {
    activePanelStyle = ceoStyle;
    Icon = CeoIcon;
  } else if (isMemberTag) {
    activePanelStyle = memberStyle;
    Icon = MemberIcon;
  }

  const primaryColor = activePanelStyle ? activePanelStyle.primaryHex : tag.color || "#3b82f6";

  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-0 h-4 gap-1",
    sm: "text-[11px] px-2 py-0.5 h-5 gap-1.5",
    md: "text-xs px-2.5 py-1 h-6 gap-2",
  }[size];

  const iconSizes = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  }[size];

  const dynamicBg =
    activePanelStyle?.isGradient && activePanelStyle.previewGradient
      ? `color-mix(in srgb, ${primaryColor} 18%, transparent)`
      : `${primaryColor}18`;

  const dynamicBorder = `${primaryColor}45`;

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-lg border transition-all select-none shadow-2xs",
        activePanelStyle?.badgeClass,
        sizeClasses,
        className
      )}
      style={{
        backgroundColor: dynamicBg,
        borderColor: dynamicBorder,
        color: primaryColor,
        boxShadow: `0 0 10px -2px ${primaryColor}25`,
        ...style,
      }}
      title={tag.description || tag.name}
    >
      {showIcon && <Icon className={cn(iconSizes, "shrink-0")} />}
      <span className="truncate max-w-[120px]">{tag.name}</span>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-75 focus:outline-none cursor-pointer rounded-full p-0.5"
          title={`Remover tag ${tag.name}`}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </span>
  );
}
