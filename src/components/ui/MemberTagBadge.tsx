import React from "react";
import {
  Tag as TagIcon,
  ShoppingCart,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Code2,
  Terminal,
  Lock,
  Unlock,
  Key,
  Sparkles,
  Zap,
  Award,
  Crown,
  Flame,
  BadgeCheck,
  UserCheck,
  UserPlus,
  Users,
  User,
  Star,
  Settings,
  X,
  Swords,
  Crosshair,
  Target,
  Skull,
  Bomb,
  Wrench,
  Hammer,
  Truck,
  Car,
  Bike,
  Plane,
  Anchor,
  Navigation,
  Compass,
  MapPin,
  Fuel,
  Package,
  Boxes,
  Warehouse,
  Factory,
  DollarSign,
  Coins,
  Wallet,
  CreditCard,
  Banknote,
  Percent,
  Landmark,
  PiggyBank,
  Receipt,
  Scale,
  TrendingUp,
  HandCoins,
  Trophy,
  Medal,
  HeartHandshake,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Megaphone,
  Bell,
  Headphones,
  Radio,
  Send,
  AlertTriangle,
  Info,
  HelpCircle,
  Cpu,
  Bot,
  Database,
  Server,
  Sliders,
  SlidersHorizontal,
  CheckCircle,
  CheckCircle2,
  Bookmark,
  FileText,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MemberTag } from "@/services/memberTagsService";
import { usePanelTheme, resolveCategoryIcon } from "@/lib/panelTheme";

const TAG_ICONS: Record<string, LucideIcon> = {
  Tag: TagIcon,
  ShoppingCart,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Code2,
  Terminal,
  Lock,
  Unlock,
  Key,
  Sparkles,
  Zap,
  Award,
  Crown,
  Flame,
  BadgeCheck,
  UserCheck,
  UserPlus,
  Users,
  User,
  Star,
  Settings,
  Swords,
  Crosshair,
  Target,
  Skull,
  Bomb,
  Wrench,
  Hammer,
  Truck,
  Car,
  Bike,
  Plane,
  Anchor,
  Navigation,
  Compass,
  MapPin,
  Fuel,
  Package,
  Boxes,
  Warehouse,
  Factory,
  DollarSign,
  Coins,
  Wallet,
  CreditCard,
  Banknote,
  Percent,
  Landmark,
  PiggyBank,
  Receipt,
  Scale,
  TrendingUp,
  HandCoins,
  Trophy,
  Medal,
  HeartHandshake,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Megaphone,
  Bell,
  Headphones,
  Radio,
  Send,
  AlertTriangle,
  Info,
  HelpCircle,
  Cpu,
  Bot,
  Database,
  Server,
  Sliders,
  SlidersHorizontal,
  CheckCircle,
  CheckCircle2,
  Bookmark,
  FileText,
  Activity,
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

  const rawColor = tag.color || "#3b82f6";
  const isCustomGradient = Boolean(rawColor && (rawColor.includes("gradient") || rawColor.startsWith("linear-")));
  const isPanelGradient = Boolean(activePanelStyle?.isGradient && activePanelStyle.previewGradient);
  const isGradient = isPanelGradient || (!activePanelStyle && isCustomGradient);
  const gradientValue = isPanelGradient ? activePanelStyle?.previewGradient : rawColor;

  const primaryColor = activePanelStyle ? activePanelStyle.primaryHex : rawColor;

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

  if (isGradient && gradientValue) {
    return (
      <span
        className={cn(
          "inline-flex items-center font-bold rounded-lg border transition-all select-none shadow-sm",
          sizeClasses,
          className
        )}
        style={{
          background: gradientValue,
          borderColor: "rgba(255, 255, 255, 0.35)",
          color: "#ffffff",
          boxShadow: "0 2px 10px -2px rgba(0, 0, 0, 0.4)",
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.6)",
          ...style,
        }}
        title={tag.description || tag.name}
      >
        {showIcon && <Icon className={cn(iconSizes, "shrink-0 drop-shadow-sm")} />}
        <span className="truncate max-w-[140px] drop-shadow-sm">{tag.name}</span>

        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-0.5 hover:opacity-80 focus:outline-none cursor-pointer rounded-full p-0.5 hover:bg-black/20 text-white"
            title={`Remover tag ${tag.name}`}
          >
            <X className="h-2.5 w-2.5 drop-shadow-sm" />
          </button>
        )}
      </span>
    );
  }

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
      <span className="truncate max-w-[140px]">{tag.name}</span>

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
