import {
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  MessageSquare,
  LifeBuoy,
  Users,
  Workflow,
  Landmark,
  CalendarOff,
  Trophy,
  User,
  Target,
  Megaphone,
  ShieldCheck,
  Settings,
  ScrollText,
  Sparkles,
  Wrench,
  Globe,
  ExternalLink,
  Link as LinkIcon,
  FileText,
  Folder,
  FolderTree,
  Table,
  Flame,
  Zap,
  Radio,
  KeyRound,
  Lock,
  Award,
  Crosshair,
  Car,
  DollarSign,
  Briefcase,
  Phone,
  MapPin,
  Tag,
  BookOpen,
  Sliders,
  Star,
  Bell,
  Shield,
  Terminal,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type MenuIconDef = {
  name: string;
  label: string;
  icon: LucideIcon;
};

export const AVAILABLE_MENU_ICONS: MenuIconDef[] = [
  { name: "LayoutDashboard", label: "Dashboard", icon: LayoutDashboard },
  { name: "Boxes", label: "Estoque / Armazém", icon: Boxes },
  { name: "ArrowLeftRight", label: "Movimentações", icon: ArrowLeftRight },
  { name: "ShoppingCart", label: "Vendas", icon: ShoppingCart },
  { name: "MessageSquare", label: "Chat / Mensagens", icon: MessageSquare },
  { name: "LifeBuoy", label: "Tickets / Suporte", icon: LifeBuoy },
  { name: "Users", label: "Membros", icon: Users },
  { name: "Workflow", label: "Hierarquia", icon: Workflow },
  { name: "Landmark", label: "Fundo de Caixa / Banco", icon: Landmark },
  { name: "CalendarOff", label: "Ausências", icon: CalendarOff },
  { name: "Trophy", label: "Rankings", icon: Trophy },
  { name: "TrendingUp", label: "Desempenho", icon: TrendingUp },
  { name: "User", label: "Perfil / Usuário", icon: User },
  { name: "Target", label: "Metas", icon: Target },
  { name: "Megaphone", label: "Avisos / Anúncios", icon: Megaphone },
  { name: "ShieldCheck", label: "Cargos / Segurança", icon: ShieldCheck },
  { name: "Settings", label: "Permissões", icon: Settings },
  { name: "ScrollText", label: "Logs", icon: ScrollText },
  { name: "Sparkles", label: "Atualizações", icon: Sparkles },
  { name: "Wrench", label: "Configurações", icon: Wrench },
  { name: "Globe", label: "Link Externo / Web", icon: Globe },
  { name: "ExternalLink", label: "Link Externo", icon: ExternalLink },
  { name: "Link", label: "Link Geral", icon: LinkIcon },
  { name: "FileText", label: "Documentos / Regras", icon: FileText },
  { name: "Folder", label: "Pasta", icon: Folder },
  { name: "FolderTree", label: "Categorias", icon: FolderTree },
  { name: "Table", label: "Planilhas / Tabelas", icon: Table },
  { name: "Flame", label: "Ação / Guerras", icon: Flame },
  { name: "Zap", label: "Ações Rápidas", icon: Zap },
  { name: "Radio", label: "Rádio", icon: Radio },
  { name: "KeyRound", label: "Chaves / Acesso", icon: KeyRound },
  { name: "Lock", label: "Privado / Cofre", icon: Lock },
  { name: "Award", label: "Condecorações", icon: Award },
  { name: "Crosshair", label: "Treinamentos / Armas", icon: Crosshair },
  { name: "Car", label: "Garagem / Veículos", icon: Car },
  { name: "DollarSign", label: "Finanças / Dinheiro", icon: DollarSign },
  { name: "Briefcase", label: "Negócios / Parcerias", icon: Briefcase },
  { name: "Phone", label: "Contato / Celular", icon: Phone },
  { name: "MapPin", label: "Locais / Pontos", icon: MapPin },
  { name: "Tag", label: "Etiquetas", icon: Tag },
  { name: "BookOpen", label: "Manual / Guia", icon: BookOpen },
  { name: "Sliders", label: "Painel / Controles", icon: Sliders },
  { name: "Star", label: "Destaque / Favoritos", icon: Star },
  { name: "Bell", label: "Alertas", icon: Bell },
  { name: "Shield", label: "Proteção / Blindagem", icon: Shield },
  { name: "Terminal", label: "Terminal / Dev", icon: Terminal },
];

export const CANONICAL_URL_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/movimentacoes": ArrowLeftRight,
  "/vendas": ShoppingCart,
  "/chat": MessageSquare,
  "/tickets": LifeBuoy,
  "/estoque": Boxes,
  "/membros": Users,
  "/hierarquia": Workflow,
  "/fundo-caixa": Landmark,
  "/ausencias": CalendarOff,
  "/rankings": Trophy,
  "/desempenho": User,
  "/dev/desempenho": TrendingUp,
  "/dev.desempenho": TrendingUp,
  "/metas": Target,
  "/cargos": ShieldCheck,
  "/permissoes": Settings,
  "/avisos": Megaphone,
  "/logs": ScrollText,
  "/atualizacoes": Sparkles,
  "/perfil": User,
  "/configuracoes": Wrench,
  "/dev": Terminal,
  "/dev/permissoes": KeyRound,
  "/dev/configuracao": Sliders,
  "/dev/menu-lateral": Sliders,
  "/dev/patch-notes": Sparkles,
};

const ICON_BY_NAME: Record<string, LucideIcon> = AVAILABLE_MENU_ICONS.reduce(
  (acc, item) => {
    acc[item.name.toLowerCase()] = item.icon;
    return acc;
  },
  {} as Record<string, LucideIcon>
);

export function resolveMenuIcon(iconName?: string | null, url?: string | null): LucideIcon {
  if (iconName && typeof iconName === "string") {
    const key = iconName.trim().toLowerCase();
    if (ICON_BY_NAME[key]) {
      return ICON_BY_NAME[key];
    }
  }

  if (url && typeof url === "string") {
    const cleanUrl = url.trim();
    if (CANONICAL_URL_ICONS[cleanUrl]) {
      return CANONICAL_URL_ICONS[cleanUrl];
    }
    if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
      return Globe;
    }
  }

  return Settings;
}
