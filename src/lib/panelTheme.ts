import type { LucideIcon } from "lucide-react";
import {
  Terminal,
  Crown,
  FolderTree,
  Code2,
  Sliders,
  Bot,
  Webhook,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Boxes,
  Users,
  Settings,
  Zap,
  Landmark,
  Workflow,
  Target,
  Radio,
  Eye,
  ScrollText,
  Flame,
  Activity,
  Layers,
  Cpu,
  Wrench,
  KeyRound,
  LayoutDashboard,
  Server,
  FileCode,
  Gauge,
  Database,
  Lock,
} from "lucide-react";

export type PanelColor =
  | "rose"
  | "amber"
  | "cyan"
  | "emerald"
  | "violet"
  | "indigo"
  | "blue"
  | "orange";

export interface PanelColorStyle {
  key: PanelColor;
  label: string;
  description: string;
  hex: string;
  textClass: string;
  textMutedClass: string;
  bgSubtleClass: string;
  bgSolidClass: string;
  borderClass: string;
  borderHoverClass: string;
  borderSubtleClass: string;
  activeItemClass: string;
  badgeClass: string;
  ringClass: string;
  glowClass: string;
}

export const PANEL_COLOR_STYLES: Record<PanelColor, PanelColorStyle> = {
  rose: {
    key: "rose",
    label: "Rosa / Magenta (Dev)",
    description: "Visual de terminal cibernético e comandos avançados",
    hex: "#f43f5e",
    textClass: "text-rose-400",
    textMutedClass: "text-rose-400/70",
    bgSubtleClass: "bg-rose-500/10",
    bgSolidClass: "bg-rose-600 text-white",
    borderClass: "border-rose-500/40",
    borderHoverClass: "hover:border-rose-500/60",
    borderSubtleClass: "border-rose-500/20",
    activeItemClass: "font-black text-rose-400 bg-rose-500/15 border border-rose-500/40 shadow-xs shadow-rose-500/10 rounded-lg",
    badgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    ringClass: "ring-rose-500/40",
    glowClass: "shadow-rose-500/20",
  },
  amber: {
    key: "amber",
    label: "Âmbar / Dourado (CEO)",
    description: "Visual executivo nobre de diretoria e liderança",
    hex: "#f59e0b",
    textClass: "text-amber-400",
    textMutedClass: "text-amber-400/70",
    bgSubtleClass: "bg-amber-500/10",
    bgSolidClass: "bg-gradient-to-r from-amber-500 to-yellow-500 text-black",
    borderClass: "border-amber-500/40",
    borderHoverClass: "hover:border-amber-500/60",
    borderSubtleClass: "border-amber-500/20",
    activeItemClass: "font-black text-amber-300 bg-amber-500/15 border border-amber-500/40 shadow-xs shadow-amber-500/10 rounded-lg",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    ringClass: "ring-amber-500/40",
    glowClass: "shadow-amber-500/20",
  },
  cyan: {
    key: "cyan",
    label: "Ciano Cyberpunk",
    description: "Visual tecnológico de alta densidade e radar",
    hex: "#06b6d4",
    textClass: "text-cyan-400",
    textMutedClass: "text-cyan-400/70",
    bgSubtleClass: "bg-cyan-500/10",
    bgSolidClass: "bg-cyan-600 text-white",
    borderClass: "border-cyan-500/40",
    borderHoverClass: "hover:border-cyan-500/60",
    borderSubtleClass: "border-cyan-500/20",
    activeItemClass: "font-black text-cyan-300 bg-cyan-500/15 border border-cyan-500/40 shadow-xs shadow-cyan-500/10 rounded-lg",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    ringClass: "ring-cyan-500/40",
    glowClass: "shadow-cyan-500/20",
  },
  emerald: {
    key: "emerald",
    label: "Esmeralda Matrix",
    description: "Visual de hacking clássico e alta performance",
    hex: "#10b981",
    textClass: "text-emerald-400",
    textMutedClass: "text-emerald-400/70",
    bgSubtleClass: "bg-emerald-500/10",
    bgSolidClass: "bg-emerald-600 text-white",
    borderClass: "border-emerald-500/40",
    borderHoverClass: "hover:border-emerald-500/60",
    borderSubtleClass: "border-emerald-500/20",
    activeItemClass: "font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 shadow-xs shadow-emerald-500/10 rounded-lg",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    ringClass: "ring-emerald-500/40",
    glowClass: "shadow-emerald-500/20",
  },
  violet: {
    key: "violet",
    label: "Violeta Neon",
    description: "Estilo sofisticado ultra-moderno e vibrante",
    hex: "#8b5cf6",
    textClass: "text-violet-400",
    textMutedClass: "text-violet-400/70",
    bgSubtleClass: "bg-violet-500/10",
    bgSolidClass: "bg-violet-600 text-white",
    borderClass: "border-violet-500/40",
    borderHoverClass: "hover:border-violet-500/60",
    borderSubtleClass: "border-violet-500/20",
    activeItemClass: "font-black text-violet-300 bg-violet-500/15 border border-violet-500/40 shadow-xs shadow-violet-500/10 rounded-lg",
    badgeClass: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    ringClass: "ring-violet-500/40",
    glowClass: "shadow-violet-500/20",
  },
  indigo: {
    key: "indigo",
    label: "Índigo Profundo",
    description: "Design corporativo premium e sóbrio",
    hex: "#6366f1",
    textClass: "text-indigo-400",
    textMutedClass: "text-indigo-400/70",
    bgSubtleClass: "bg-indigo-500/10",
    bgSolidClass: "bg-indigo-600 text-white",
    borderClass: "border-indigo-500/40",
    borderHoverClass: "hover:border-indigo-500/60",
    borderSubtleClass: "border-indigo-500/20",
    activeItemClass: "font-black text-indigo-300 bg-indigo-500/15 border border-indigo-500/40 shadow-xs shadow-indigo-500/10 rounded-lg",
    badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    ringClass: "ring-indigo-500/40",
    glowClass: "shadow-indigo-500/20",
  },
  blue: {
    key: "blue",
    label: "Azul Céu Operacional",
    description: "Estilo limpo, analítico e de monitoramento",
    hex: "#0ea5e9",
    textClass: "text-sky-400",
    textMutedClass: "text-sky-400/70",
    bgSubtleClass: "bg-sky-500/10",
    bgSolidClass: "bg-sky-600 text-white",
    borderClass: "border-sky-500/40",
    borderHoverClass: "hover:border-sky-500/60",
    borderSubtleClass: "border-sky-500/20",
    activeItemClass: "font-black text-sky-300 bg-sky-500/15 border border-sky-500/40 shadow-xs shadow-sky-500/10 rounded-lg",
    badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    ringClass: "ring-sky-500/40",
    glowClass: "shadow-sky-500/20",
  },
  orange: {
    key: "orange",
    label: "Laranja Sunset",
    description: "Energia vibrante, alerta e destaque operacional",
    hex: "#f97316",
    textClass: "text-orange-400",
    textMutedClass: "text-orange-400/70",
    bgSubtleClass: "bg-orange-500/10",
    bgSolidClass: "bg-orange-600 text-white",
    borderClass: "border-orange-500/40",
    borderHoverClass: "hover:border-orange-500/60",
    borderSubtleClass: "border-orange-500/20",
    activeItemClass: "font-black text-orange-300 bg-orange-500/15 border border-orange-500/40 shadow-xs shadow-orange-500/10 rounded-lg",
    badgeClass: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    ringClass: "ring-orange-500/40",
    glowClass: "shadow-orange-500/20",
  },
};

export function getPanelColorStyle(color?: string | null, fallback: PanelColor = "rose"): PanelColorStyle {
  if (color && color in PANEL_COLOR_STYLES) {
    return PANEL_COLOR_STYLES[color as PanelColor];
  }
  return PANEL_COLOR_STYLES[fallback];
}

/* ─── Category Icon Registry ─── */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Terminal,
  Crown,
  FolderTree,
  Code2,
  Sliders,
  Bot,
  Webhook,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Boxes,
  Users,
  Settings,
  Zap,
  Landmark,
  Workflow,
  Target,
  Radio,
  Eye,
  ScrollText,
  Flame,
  Activity,
  Layers,
  Cpu,
  Wrench,
  KeyRound,
  LayoutDashboard,
  Server,
  FileCode,
  Gauge,
  Database,
  Lock,
};

export const POPULAR_CATEGORY_ICONS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: "Terminal", label: "Terminal / Console", icon: Terminal },
  { name: "Crown", label: "Coroa Executiva", icon: Crown },
  { name: "Code2", label: "Código / Dev", icon: Code2 },
  { name: "FolderTree", label: "Árvore de Pastas", icon: FolderTree },
  { name: "Sliders", label: "Controles & Sliders", icon: Sliders },
  { name: "Bot", label: "Bot Discord", icon: Bot },
  { name: "Webhook", label: "Webhook", icon: Webhook },
  { name: "ShieldCheck", label: "Segurança / Cargos", icon: ShieldCheck },
  { name: "Sparkles", label: "Destaque / Novidades", icon: Sparkles },
  { name: "TrendingUp", label: "Métricas & Crescimento", icon: TrendingUp },
  { name: "Boxes", label: "Inventário & Baús", icon: Boxes },
  { name: "Users", label: "Membros & Equipe", icon: Users },
  { name: "Landmark", label: "Finanças & Caixa", icon: Landmark },
  { name: "Settings", label: "Configurações", icon: Settings },
  { name: "Zap", label: "Automação / Raio", icon: Zap },
  { name: "Radio", label: "Transmissões & Lives", icon: Radio },
  { name: "Gauge", label: "Diagnóstico / Velocidade", icon: Gauge },
  { name: "Database", label: "Banco de Dados", icon: Database },
  { name: "Server", label: "Servidores", icon: Server },
  { name: "Layers", label: "Camadas & Módulos", icon: Layers },
];

export function resolveCategoryIcon(
  iconName?: string | null,
  fallback: LucideIcon = FolderTree
): LucideIcon {
  if (iconName && iconName in CATEGORY_ICON_MAP) {
    return CATEGORY_ICON_MAP[iconName];
  }
  return fallback;
}
