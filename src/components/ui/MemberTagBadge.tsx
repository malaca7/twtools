import React from "react";
import {
  Tag as TagIcon,
  ShoppingCart,
  ShieldAlert,
  Code2,
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
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberTag } from "@/services/memberTagsService";

const TAG_ICONS: Record<string, LucideIcon> = {
  Tag: TagIcon,
  ShoppingCart,
  ShieldAlert,
  Code2,
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
};

export function resolveTagIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return TagIcon;
  return TAG_ICONS[iconName] || TagIcon;
}

interface MemberTagBadgeProps {
  tag: MemberTag;
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function MemberTagBadge({
  tag,
  size = "sm",
  showIcon = true,
  onRemove,
  className,
}: MemberTagBadgeProps) {
  const Icon = resolveTagIcon(tag.icon);
  const color = tag.color || "#3b82f6";

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

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-lg border transition-all select-none",
        sizeClasses,
        className
      )}
      style={{
        backgroundColor: `${color}18`,
        borderColor: `${color}45`,
        color: color,
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
