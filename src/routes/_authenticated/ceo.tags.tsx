import React, { useState, useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Tag as TagIcon,
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Save,
  Check,
  X,
  Sparkles,
  Lock,
  ShoppingCart,
  Percent,
  Warehouse,
  Coins,
  RefreshCw,
  Info,
  Code2,
  Zap,
  Award,
  Crown,
  Flame,
  BadgeCheck,
  UserCheck,
  Star,
  Settings,
  Loader2,
  AlertTriangle,
  FolderTree,
  Filter,
  DollarSign,
  Layers,
  Factory,
  MessageSquare,
  Landmark,
  Megaphone,
  UserPlus,
  Eye,
  SlidersHorizontal,
  HelpCircle,
  Swords,
  Crosshair,
  Target,
  Bot,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronsUp,
  ChevronsDown,
  ChevronUp,
  ExternalLink,
  Link2,
  Unlink,
  RefreshCcw,
  CheckCircle,
  Hash,
  Copy,
  CopyPlus,
  Palette,
  Boxes,
  Truck,
  Car,
  Bike,
  Plane,
  Anchor,
  Navigation,
  Compass,
  MapPin,
  Fuel,
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
  Bell,
  Headphones,
  Radio,
  Send,
  Cpu,
  Database,
  Server,
  FileText,
  Activity,
  Skull,
  Bomb,
  Wrench,
  Hammer,
  type LucideIcon,
} from "lucide-react";
import { CeoGuard } from "@/guards/CeoGuard";
import { PageHeader, CeoBadge, TableSkeleton, EmptyState, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { useMemberTags, useMemberTagAssignments, useMemberTagMutations } from "@/hooks/useMemberTags";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { MemberTagBadge, resolveTagIcon } from "@/components/ui/MemberTagBadge";
import { PAGE_CARDS, READ_ONLY_PERMISSIONS, type PageCardConfig } from "@/lib/permissionCards";
import { ALL_PERMISSIONS, type Permission, LEVEL_LABEL, levelBadgeClass, PERMISSION_EQUIVALENCES } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { parseMemberTagRules, type MemberTag, type MemberTagRules } from "@/services/memberTagsService";
import {
  fetchGuildRoles,
  createDiscordRoleForTag,
  updateDiscordRolePosition,
  syncAllMembersForTag,
  type DiscordRoleInfo,
} from "@/services/discordTagService";
import { fetchBotGuilds, type BotGuildInfo } from "@/services/discordBotManageService";

function DiscordIconSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 127.14 96.36" fill="currentColor">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.34,2.51-2a75.58,75.58,0,0,0,93,0c.79.71,1.63,1.4,2.51,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.6-18.83C129,54.65,122.64,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
    </svg>
  );
}

export const Route = createFileRoute("/_authenticated/ceo/tags")({
  component: CeoGerenciarTagsPageWrapper,
});

function CeoGerenciarTagsPageWrapper() {
  return (
    <CeoGuard>
      <CeoGerenciarTagsPage />
    </CeoGuard>
  );
}

export const SOLID_PALETTES = [
  { label: "Esmeralda", hex: "#10b981" },
  { label: "Verde Neon", hex: "#22c55e" },
  { label: "Ciano Néon", hex: "#06b6d4" },
  { label: "Azul Céu", hex: "#0ea5e9" },
  { label: "Azul Real", hex: "#3b82f6" },
  { label: "Índigo", hex: "#6366f1" },
  { label: "Violeta", hex: "#8b5cf6" },
  { label: "Púrpura", hex: "#a855f7" },
  { label: "Rosa Choque", hex: "#ec4899" },
  { label: "Magenta", hex: "#d946ef" },
  { label: "Vermelho Carmesim", hex: "#ef4444" },
  { label: "Coral", hex: "#ff6b6b" },
  { label: "Laranja Vibrante", hex: "#f97316" },
  { label: "Âmbar Dourado", hex: "#f59e0b" },
  { label: "Amarelo Ouro", hex: "#eab308" },
  { label: "Verde Limão", hex: "#84cc16" },
  { label: "Teal Aquático", hex: "#14b8a6" },
  { label: "Menta", hex: "#34d399" },
  { label: "Ouro Nobre", hex: "#d97706" },
  { label: "Bronze Rústico", hex: "#b45309" },
  { label: "Rubi Imperial", hex: "#be123c" },
  { label: "Vinho Profundo", hex: "#881337" },
  { label: "Azul Marinho", hex: "#1e3a8a" },
  { label: "Ardósia Aço", hex: "#64748b" },
  { label: "Carbono Dark", hex: "#334155" },
  { label: "Grafite Escuro", hex: "#1e293b" },
];

export const GRADIENT_PALETTES = [
  { label: "Cyberpunk Néon", gradient: "linear-gradient(135deg, #06b6d4 0%, #ec4899 100%)" },
  { label: "Fogo Carmesim", gradient: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)" },
  { label: "Ouro Executivo", gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)" },
  { label: "Esmeralda Tóxica", gradient: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)" },
  { label: "Roxo Imperial", gradient: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" },
  { label: "Sunset Tropical", gradient: "linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)" },
  { label: "Gelo Cósmico", gradient: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)" },
  { label: "Esmeralda Ouro", gradient: "linear-gradient(135deg, #059669 0%, #eab308 100%)" },
  { label: "Sangue Carmesim", gradient: "linear-gradient(135deg, #881337 0%, #e11d48 100%)" },
  { label: "Diamante Platina", gradient: "linear-gradient(135deg, #64748b 0%, #cbd5e1 50%, #475569 100%)" },
  { label: "Violeta Radiante", gradient: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)" },
  { label: "Trovão Elétrico", gradient: "linear-gradient(135deg, #eab308 0%, #3b82f6 100%)" },
  { label: "Matrix Néon", gradient: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)" },
  { label: "Midnight Aurora", gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)" },
  { label: "Vulcão Vulcânico", gradient: "linear-gradient(135deg, #b91c1c 0%, #f97316 100%)" },
  { label: "Aura Real", gradient: "linear-gradient(135deg, #4c1d95 0%, #c026d3 100%)" },
];

export const ICON_CATEGORIES = [
  {
    category: "Operações & Combate",
    icons: [
      { key: "Swords", label: "Espadas (Combate / Ação)" },
      { key: "Crosshair", label: "Mira (Sniper / Precisão)" },
      { key: "Target", label: "Alvo (Operacional)" },
      { key: "Shield", label: "Escudo (Defesa)" },
      { key: "ShieldCheck", label: "Escudo Aprovado" },
      { key: "ShieldAlert", label: "Escudo Alerta / Restrição" },
      { key: "Flame", label: "Chama / Fogo" },
      { key: "Zap", label: "Raio / Velocidade" },
      { key: "Sparkles", label: "Brilho Especial" },
      { key: "Skull", label: "Caveira" },
      { key: "Bomb", label: "Bomba / Explosivo" },
      { key: "Wrench", label: "Chave Inglesa (Mecânica)" },
      { key: "Hammer", label: "Martelo (Operário)" },
      { key: "Radio", label: "Rádio Tático" },
    ],
  },
  {
    category: "Logística & Veículos",
    icons: [
      { key: "Warehouse", label: "Armazém" },
      { key: "Factory", label: "Fábrica / Produção" },
      { key: "Package", label: "Pacote / Encomenda" },
      { key: "Boxes", label: "Caixas / Estoque" },
      { key: "Truck", label: "Caminhão / Frete" },
      { key: "Car", label: "Carro" },
      { key: "Bike", label: "Moto" },
      { key: "Plane", label: "Avião" },
      { key: "Anchor", label: "Âncora / Porto" },
      { key: "Navigation", label: "Navegação" },
      { key: "Compass", label: "Bússola" },
      { key: "MapPin", label: "Ponto no Mapa" },
      { key: "Fuel", label: "Combustível" },
    ],
  },
  {
    category: "Vendas & Finanças",
    icons: [
      { key: "ShoppingCart", label: "Carrinho de Vendas" },
      { key: "DollarSign", label: "Cifrão / Dinheiro" },
      { key: "Coins", label: "Moedas" },
      { key: "Wallet", label: "Carteira" },
      { key: "CreditCard", label: "Cartão de Crédito" },
      { key: "Banknote", label: "Cédula / Dinheiro" },
      { key: "Percent", label: "Porcentagem / Desconto" },
      { key: "Landmark", label: "Banco / Cofre Central" },
      { key: "PiggyBank", label: "Cofrinho / Fundo" },
      { key: "Receipt", label: "Recibo / Comprovante" },
      { key: "HandCoins", label: "Mão com Moedas" },
      { key: "Scale", label: "Balança / Justiça" },
      { key: "TrendingUp", label: "Crescimento / Lucro" },
    ],
  },
  {
    category: "Liderança & Prestígio",
    icons: [
      { key: "Crown", label: "Coroa (Liderança / Alta Cúpula)" },
      { key: "Trophy", label: "Troféu" },
      { key: "Medal", label: "Medalha" },
      { key: "Award", label: "Mérito / Conquista" },
      { key: "Star", label: "Estrela (VIP)" },
      { key: "BadgeCheck", label: "Distintivo Verificado" },
      { key: "UserCheck", label: "Membro Aprovado" },
      { key: "Users", label: "Equipe / Grupo" },
      { key: "UserPlus", label: "Recrutamento" },
      { key: "HeartHandshake", label: "Aliança / Parceria" },
      { key: "Briefcase", label: "Maleta Executiva" },
      { key: "GraduationCap", label: "Treinamento / Graduação" },
      { key: "Lock", label: "Segurança / Cadeado" },
      { key: "Tag", label: "Tag Padrão" },
    ],
  },
  {
    category: "Comunicação & Mídia",
    icons: [
      { key: "MessageSquare", label: "Mensagem / Chat" },
      { key: "Megaphone", label: "Megafone / Anúncio" },
      { key: "Bell", label: "Sino / Notificações" },
      { key: "Headphones", label: "Headset / Suporte" },
      { key: "Send", label: "Despacho / Envio" },
      { key: "AlertTriangle", label: "Alerta / Atenção" },
      { key: "Info", label: "Informação" },
      { key: "HelpCircle", label: "Ajuda / FAQ" },
    ],
  },
  {
    category: "Tecnologia & Dev",
    icons: [
      { key: "Code2", label: "Código Dev" },
      { key: "Terminal", label: "Terminal" },
      { key: "Cpu", label: "Processador / Chip" },
      { key: "Bot", label: "Robô / Automação" },
      { key: "Database", label: "Banco de Dados" },
      { key: "Server", label: "Servidor" },
      { key: "Sliders", label: "Controles" },
      { key: "SlidersHorizontal", label: "Filtros / Níveis" },
      { key: "Settings", label: "Configurações" },
      { key: "CheckCircle2", label: "Concluído" },
      { key: "Bookmark", label: "Favorito" },
      { key: "Activity", label: "Atividade / Pulso" },
      { key: "FileText", label: "Relatório / Documento" },
    ],
  },
];

export const ALL_AVAILABLE_ICONS = ICON_CATEGORIES.flatMap((c) => c.icons);

export function CeoGerenciarTagsPage() {
  const { user, profile, isDevUser, hasTag, hasPermission } = useAuth();
  const isDevMember = Boolean(isDevUser || hasTag?.("dev") || hasTag?.("desenvolvedor"));

  const canViewTags = Boolean(
    hasPermission("view_ceo_tag_permissions") ||
    hasPermission("manage_ceo_tag_permissions") ||
    hasPermission("create_ceo_tag") ||
    hasPermission("edit_ceo_tag") ||
    hasPermission("delete_ceo_tag") ||
    hasPermission("assign_ceo_tag")
  );
  const canCreateTag = Boolean(hasPermission("create_ceo_tag"));
  const canEditTag = Boolean(hasPermission("edit_ceo_tag"));
  const canDeleteTag = Boolean(hasPermission("delete_ceo_tag"));
  const canManagePerms = Boolean(
    hasPermission("manage_ceo_tag_permissions") ||
    hasPermission("manage_ceo_tag_permissions_detail")
  );
  const canManageRules = Boolean(
    hasPermission("manage_ceo_tag_permissions") ||
    hasPermission("manage_ceo_tag_rules")
  );
  const canAssignTag = Boolean(hasPermission("assign_ceo_tag"));

  // Permissões de Integração Discord
  const canDiscordConfig = Boolean(
    isDevUser ||
    hasPermission("tags.discord_config") ||
    hasPermission("manage_ceo_tag_permissions") ||
    hasPermission("manage_dev_tags")
  );
  const canDiscordCreateRole = Boolean(
    isDevUser ||
    hasPermission("tags.discord_create_role") ||
    hasPermission("manage_ceo_tag_permissions") ||
    hasPermission("manage_dev_tags")
  );
  const canDiscordEditPosition = Boolean(
    isDevUser ||
    hasPermission("tags.discord_edit_position") ||
    hasPermission("manage_ceo_tag_permissions") ||
    hasPermission("manage_dev_tags")
  );
  const canDiscordLink = Boolean(
    isDevUser ||
    hasPermission("tags.discord_link") ||
    hasPermission("manage_ceo_tag_permissions") ||
    hasPermission("manage_dev_tags")
  );
  const canDiscordSync = Boolean(
    isDevUser ||
    hasPermission("tags.discord_sync_members") ||
    hasPermission("manage_ceo_tag_permissions") ||
    hasPermission("manage_dev_tags")
  );

  const { data: rawTags = [], isLoading: loadingTags, refetch: refetchTags } = useMemberTags();
  // Tag CEO é exclusiva do Painel Dev na página de permissões (/dev/permissoes).
  // Não deve ser exibida nem gerenciada na página de Gerenciar Tags.
  const tags = useMemo(() => {
    return rawTags.filter((t) => {
      const cleanId = (t.id || "").toLowerCase().trim();
      const cleanName = (t.name || "").toLowerCase().trim();
      return cleanId !== "ceo" && cleanName !== "ceo";
    });
  }, [rawTags]);
  const { data: assignments = [], isLoading: loadingAssignments, refetch: refetchAssignments } = useMemberTagAssignments();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const {
    saveTagMutation,
    deleteTagMutation,
    toggleSystemTagMutation,
    toggleAssignmentMutation,
    setTagMembersMutation,
    updatePermissionsAndRulesMutation,
    updateTagsOrderMutation,
  } = useMemberTagMutations();

  // Permissão para reordenar tags
  const canReorderTags = Boolean(
    isDevUser ||
    canEditTag ||
    canManagePerms ||
    hasPermission("edit_ceo_tag") ||
    hasPermission("manage_ceo_tag_permissions") ||
    hasPermission("manage_dev_tags")
  );

  // Modal de Reordenação de Tags
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderList, setReorderList] = useState<MemberTag[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const handleMoveTagUp = async (tagId: string) => {
    if (!canReorderTags) {
      toast.error("Você não possui permissão para reordenar tags.");
      return;
    }
    const idx = tags.findIndex((t) => t.id === tagId);
    if (idx <= 0) return;
    const newTags = [...tags];
    const temp = newTags[idx];
    newTags[idx] = newTags[idx - 1];
    newTags[idx - 1] = temp;
    try {
      await updateTagsOrderMutation.mutateAsync(newTags.map((t) => t.id));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao subir posição da tag.");
    }
  };

  const handleMoveTagDown = async (tagId: string) => {
    if (!canReorderTags) {
      toast.error("Você não possui permissão para reordenar tags.");
      return;
    }
    const idx = tags.findIndex((t) => t.id === tagId);
    if (idx < 0 || idx >= tags.length - 1) return;
    const newTags = [...tags];
    const temp = newTags[idx];
    newTags[idx] = newTags[idx + 1];
    newTags[idx + 1] = temp;
    try {
      await updateTagsOrderMutation.mutateAsync(newTags.map((t) => t.id));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao descer posição da tag.");
    }
  };

  const handleSaveReorderModal = async () => {
    if (!canReorderTags) return;
    setIsSavingOrder(true);
    try {
      await updateTagsOrderMutation.mutateAsync(reorderList.map((t) => t.id));
      setIsReorderModalOpen(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar reordenação das tags.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Filtros de busca de tags
  const [tagSearch, setTagSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<"all" | "active" | "blocking" | "sales" | "productions" | "discord" | "system">("all");

  // Modal de Criação / Edição de Tag
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<MemberTag | null>(null);
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState("#10b981");
  const [formIcon, setFormIcon] = useState("Tag");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsSystem, setFormIsSystem] = useState(false);
  const [formRules, setFormRules] = useState<MemberTagRules>({});
  const [formDiscordRoleId, setFormDiscordRoleId] = useState<string | null>(null);
  const [formDiscordGuildId, setFormDiscordGuildId] = useState<string | null>(null);
  const [formDiscordRoleName, setFormDiscordRoleName] = useState<string | null>(null);
  const [formDiscordSyncEnabled, setFormDiscordSyncEnabled] = useState(true);
  const [formDiscordRolePosition, setFormDiscordRolePosition] = useState<number | null>(null);

  // Estados de Personalização Avançada de Cores e Ícones
  const [colorMode, setColorMode] = useState<"solid" | "gradient">("solid");
  const [iconSearch, setIconSearch] = useState("");
  const [selectedIconCategory, setSelectedIconCategory] = useState("all");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const filteredIconsList = useMemo(() => {
    let list = ALL_AVAILABLE_ICONS;
    if (selectedIconCategory !== "all") {
      const cat = ICON_CATEGORIES.find((c) => c.category === selectedIconCategory);
      list = cat ? cat.icons : list;
    }
    if (!iconSearch.trim()) return list;
    const q = iconSearch.toLowerCase().trim();
    return list.filter((i) => i.key.toLowerCase().includes(q) || i.label.toLowerCase().includes(q));
  }, [selectedIconCategory, iconSearch]);

  const { config: menuConfig } = useMenuConfig();

  // Modal de Integração Discord
  const [tagForDiscord, setTagForDiscord] = useState<MemberTag | null>(null);
  const [discordGuilds, setDiscordGuilds] = useState<BotGuildInfo[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string>("1535505650308620400");
  const [guildRoles, setGuildRoles] = useState<DiscordRoleInfo[]>([]);
  const [loadingGuildRoles, setLoadingGuildRoles] = useState(false);
  const [discordModalTab, setDiscordModalTab] = useState<"link" | "create" | "hierarchy" | "sync">("link");
  const [roleSearch, setRoleSearch] = useState("");

  // Criação de Cargo no Discord
  const [createRoleName, setCreateRoleName] = useState("");
  const [createRoleColor, setCreateRoleColor] = useState("#5865F2");
  const [createRoleHoist, setCreateRoleHoist] = useState(true);
  const [createRoleMentionable, setCreateRoleMentionable] = useState(false);
  const [targetInsertMode, setTargetInsertMode] = useState<"below" | "above" | "exact">("below");
  const [targetRelativeRoleId, setTargetRelativeRoleId] = useState<string>("");
  const [createRolePosition, setCreateRolePosition] = useState<number>(5);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Edição de Posição & Sincronização
  const [isUpdatingPosition, setIsUpdatingPosition] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncReport, setSyncReport] = useState<{
    totalMembers: number;
    synced: number;
    skippedNoDiscordId: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Modal de Vínculo de Membros à Tag
  const [tagForMembers, setTagForMembers] = useState<MemberTag | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [memberAssignSearch, setMemberAssignSearch] = useState("");
  const [memberAssignFilter, setMemberAssignFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [memberAssignRankFilter, setMemberAssignRankFilter] = useState("all");
  const [memberAssignSavingId, setMemberAssignSavingId] = useState<string | null>(null);
  const [memberAssignAutoSaved, setMemberAssignAutoSaved] = useState(false);
  const memberAutoSavedTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const availableMemberRanks = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.nivel && m.nivel.trim()) set.add(m.nivel.trim());
    });
    return Array.from(set).sort();
  }, [members]);

  // Modal de Permissões e Regras da Tag
  const [tagForPerms, setTagForPerms] = useState<MemberTag | null>(null);
  const [activePerms, setActivePerms] = useState<Permission[]>([]);
  const [activeRules, setActiveRules] = useState<MemberTagRules>({});
  const [permSearch, setPermSearch] = useState("");
  const [permCategoryFilter, setPermCategoryFilter] = useState<string>("all");
  const [permSubTab, setPermSubTab] = useState<"permissions" | "rules">("permissions");

  // Auto-save state e refs
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const debounceDiscountRef = React.useRef<NodeJS.Timeout | null>(null);

  // Scroll ref e detecção de topo/final no modal de permissões para balão flutuante
  const permModalBodyRef = React.useRef<HTMLDivElement>(null);
  const [isModalAtTop, setIsModalAtTop] = useState(true);

  const handleModalScroll = useCallback(() => {
    if (!permModalBodyRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = permModalBodyRef.current;
    const isNearBottom = clientHeight + scrollTop >= scrollHeight - 60;
    setIsModalAtTop(!isNearBottom && scrollTop < 200);
  }, []);

  const scrollToModalBottom = useCallback(() => {
    if (permModalBodyRef.current) {
      permModalBodyRef.current.scrollTo({
        top: permModalBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const scrollToModalTop = useCallback(() => {
    if (permModalBodyRef.current) {
      permModalBodyRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  // Métricas
  const metrics = useMemo(() => {
    const totalTags = tags.length;
    const totalAssignedMembers = new Set(assignments.map((a) => a.member_id)).size;
    const activeTags = tags.filter((t) => t.is_active !== false).length;
    const blockingTags = tags.filter(
      (t) =>
        t.rules?.is_blocked ||
        t.rules?.block_operations ||
        t.rules?.block_login ||
        t.rules?.block_escalas ||
        t.rules?.block_sales ||
        t.rules?.block_movements ||
        t.rules?.block_productions ||
        t.rules?.block_cash_fund
    ).length;
    return { totalTags, totalAssignedMembers, activeTags, blockingTags };
  }, [tags, assignments]);

  // Checagem de categoria restrita (CEO, Executivo CEO, Gestão, Plataforma)
  const isRestrictedCategory = useCallback((catName: string) => {
    const norm = (catName || "").toLowerCase().trim();
    return (
      norm === "ceo" ||
      norm === "executivo ceo" ||
      norm === "painel ceo" ||
      norm === "gestão" ||
      norm === "gestao" ||
      norm === "plataforma"
    );
  }, []);

  // Checagem de card restrito para membros sem a tag dev
  const isRestrictedCard = useCallback(
    (card: { id: string; route: string; title: string; defaultCat: string; category?: string }) => {
      if (isRestrictedCategory(card.category || "")) return true;
      if (isRestrictedCategory(card.defaultCat || "")) return true;
      const id = (card.id || "").toLowerCase().trim();
      const route = (card.route || "").toLowerCase().trim();
      const title = (card.title || "").toLowerCase().trim();
      if (id.startsWith("ceo-") || id === "ceo" || route.startsWith("/ceo")) return true;
      if (id === "configuracoes" || id === "permissoes" || id === "atualizacoes" || title.includes("plataforma")) return true;
      return false;
    },
    [isRestrictedCategory]
  );

  // Cards operacionais de membros (excluindo DEV e Painel Executivo CEO)
  const platformPageCards = useMemo(() => {
    return PAGE_CARDS.filter((card) => {
      // Exclui Painel DEV e Ferramentas Dev
      if (card.defaultCat === "DEV" || card.defaultCat === "Ferramentas Dev") return false;
      if (card.id.startsWith("dev-") || card.id === "dev" || card.route.startsWith("/dev")) return false;
      // Exclui Painel Executivo CEO (/ceo)
      if (card.id === "ceo" || card.route === "/ceo") return false;
      // Remover expressamente "Transmissão e Lives" e "Twin Life"
      if (card.id === "lives" || card.id === "life") return false;
      return true;
    });
  }, []);

  // Cards visíveis no modal de permissões da tag
  const visiblePageCards = useMemo(() => {
    if (isDevMember) {
      return platformPageCards;
    }
    return platformPageCards.filter((card) => !isRestrictedCard(card));
  }, [isDevMember, platformPageCards, isRestrictedCard]);

  // Chaves de permissões restritas (para salvamento e preservação de integridade)
  const restrictedPermissionKeys = useMemo<Set<Permission>>(() => {
    const set = new Set<Permission>();
    PAGE_CARDS.forEach((card) => {
      if (isRestrictedCard(card)) {
        card.permissions.forEach((p) => set.add(p.key));
      }
    });
    return set;
  }, [isRestrictedCard]);

  const allPlatformPermissions = useMemo(() => {
    return Array.from(new Set(platformPageCards.flatMap((c) => c.permissions.map((p) => p.key))));
  }, [platformPageCards]);

  const visiblePlatformPermissions = useMemo<Permission[]>(() => {
    return Array.from(new Set(visiblePageCards.flatMap((c) => c.permissions.map((p) => p.key))));
  }, [visiblePageCards]);

  const readOnlyPlatformPermissions = useMemo(() => {
    return READ_ONLY_PERMISSIONS.filter((p) => allPlatformPermissions.includes(p));
  }, [allPlatformPermissions]);

  const visibleReadOnlyPermissions = useMemo(() => {
    return READ_ONLY_PERMISSIONS.filter((p) => visiblePlatformPermissions.includes(p));
  }, [visiblePlatformPermissions]);

  // Agrupamento e ordenação dinâmica dos PAGE_CARDS pelas categorias
  const groupedPageCards = useMemo(() => {
    const validConfigItems = menuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
    const configMap = new Map(validConfigItems.map((c) => [c.id || c.url, c]));

    const rawCategories = menuConfig?.categories?.length
      ? menuConfig.categories
      : ["Produções", "Gestão", "Administração"];
    let orderedCategories = [...rawCategories];

    // Remover categorias "Operação", "DEV", "Ferramentas Dev"
    let categoryOrder = orderedCategories.filter(
      (c) => c !== "DEV" && c !== "Ferramentas Dev" && c !== "Operação"
    );

    // Se NÃO tiver a tag dev, filtrar categorias de CEO, Executivo CEO, Gestão e Plataforma
    if (!isDevMember) {
      categoryOrder = categoryOrder.filter((c) => !isRestrictedCategory(c));
    }

    const customized = visiblePageCards
      .map((card) => {
        const cfg = configMap.get(card.id) || configMap.get(card.route);
        let cat = cfg?.category || card.defaultCat;
        if (cat === "Operação") {
          cat = card.id === "vendas" ? "Produções" : "Gestão";
        }
        if (card.id === "ceo-tags") {
          cat = "Administração";
        } else if (
          card.defaultCat === "CEO" ||
          card.defaultCat === "Painel CEO" ||
          card.id.startsWith("ceo-") ||
          card.id === "ceo" ||
          card.route.startsWith("/ceo")
        ) {
          cat = "Executivo CEO";
        }
        return {
          ...card,
          title: card.id === "ceo-tags" ? "Gerenciar Tags" : (cfg?.title || card.title),
          category: cat,
          order: typeof cfg?.order === "number" ? cfg.order : card.defaultOrder,
        };
      })
      .filter((card) => {
        if (card.category === "DEV" || card.category === "Ferramentas Dev" || card.category === "Operação") return false;
        if (!isDevMember && isRestrictedCard(card)) return false;
        return true;
      });

    const groups: { category: string; cards: typeof customized }[] = [];

    categoryOrder.forEach((cat) => {
      const catCards = customized
        .filter((c) => c.category === cat)
        .sort((a, b) => a.order - b.order);
      if (catCards.length > 0) {
        groups.push({ category: cat, cards: catCards });
      }
    });

    const knownCats = new Set(categoryOrder);
    customized.forEach((card) => {
      if (!knownCats.has(card.category)) {
        knownCats.add(card.category);
        const catCards = customized
          .filter((c) => c.category === card.category)
          .sort((a, b) => a.order - b.order);
        if (catCards.length > 0) {
          groups.push({ category: card.category, cards: catCards });
        }
      }
    });

    return groups;
  }, [menuConfig, visiblePageCards, isDevMember, isRestrictedCategory, isRestrictedCard]);

  const operationalBasicPermissions = useMemo<Permission[]>(() => {
    return [
      "view_dashboard",
      "view_stock",
      "view_movements",
      "create_movement",
      "view_baus",
      "view_sales",
      "create_sale",
      "sales.view",
      "sales.create",
      "sales.history",
      "productions.view",
      "productions.create",
      "warehouse.view",
      "warehouse.transfer",
      "warehouse.transfer_sale",
      "raw_materials.view",
      "raw_materials.transfer_bau",
      "view_products",
      "view_profile",
      "view_chat",
      "view_notifications",
    ].filter((p) => allPlatformPermissions.includes(p as Permission)) as Permission[];
  }, [allPlatformPermissions]);

  const warehouseLogisticsPermissions = useMemo<Permission[]>(() => {
    return [
      "view_stock",
      "view_movements",
      "create_movement",
      "view_baus",
      "productions.view",
      "warehouse.view",
      "warehouse.transfer",
      "warehouse.transfer_storage",
      "warehouse.transfer_sale",
      "warehouse.adjust",
      "warehouse.history",
      "raw_materials.view",
      "raw_materials.create",
      "raw_materials.edit",
      "raw_materials.adjust",
      "raw_materials.transfer_bau",
      "raw_materials.history",
      "production_management.view",
    ].filter((p) => allPlatformPermissions.includes(p as Permission)) as Permission[];
  }, [allPlatformPermissions]);

  const setAllPermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const targetPerms = isDevMember ? allPlatformPermissions : visiblePlatformPermissions;
    const nextPerms = isDevMember
      ? [...allPlatformPermissions]
      : Array.from(new Set([...activePerms.filter((p) => !visiblePlatformPermissions.includes(p)), ...targetPerms]));

    const nextRules = isDevMember
      ? {
          ...activeRules,
          can_view_all_tickets: true,
          can_view_sensitive_data: true,
          can_view_all_sales: true,
          can_create_announcements: true,
          can_reverse_sales: true,
          can_manage_members: true,
        }
      : {
          ...activeRules,
          can_view_all_sales: true,
          can_reverse_sales: true,
        };
    setActiveRules(nextRules);
    setActivePerms(nextPerms);
    void autoSavePermsAndRules(nextPerms, nextRules);
  };

  const setReadOnlyPermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const targetPerms = isDevMember ? readOnlyPlatformPermissions : visibleReadOnlyPermissions;
    const nextPerms = isDevMember
      ? [...readOnlyPlatformPermissions]
      : Array.from(new Set([...activePerms.filter((p) => !visiblePlatformPermissions.includes(p)), ...targetPerms]));

    const nextRules = isDevMember
      ? {
          ...activeRules,
          can_view_all_tickets: nextPerms.includes("view_all_tickets"),
          can_view_sensitive_data: nextPerms.includes("view_sensitive_data"),
          can_view_all_sales: nextPerms.includes("view_all_sales"),
          can_reverse_sales: false,
        }
      : {
          ...activeRules,
          can_view_all_sales: nextPerms.includes("view_all_sales"),
          can_reverse_sales: false,
        };
    setActiveRules(nextRules);
    setActivePerms(nextPerms);
    void autoSavePermsAndRules(nextPerms, nextRules);
  };

  const setOperationalPermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const nextPerms = isDevMember
      ? [...operationalBasicPermissions]
      : Array.from(new Set([...activePerms.filter((p) => !visiblePlatformPermissions.includes(p)), ...operationalBasicPermissions]));

    const nextRules = {
      ...activeRules,
      can_sell: true,
      allow_sales_counter: true,
    };
    setActiveRules(nextRules);
    setActivePerms(nextPerms);
    void autoSavePermsAndRules(nextPerms, nextRules);
  };

  const setWarehousePermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const nextPerms = isDevMember
      ? [...warehouseLogisticsPermissions]
      : Array.from(new Set([...activePerms.filter((p) => !visiblePlatformPermissions.includes(p)), ...warehouseLogisticsPermissions]));

    const nextRules = {
      ...activeRules,
      can_manage_productions: true,
      can_manage_raw_materials: true,
      can_transfer_warehouse: true,
      can_adjust_warehouse_stock: true,
    };
    setActiveRules(nextRules);
    setActivePerms(nextPerms);
    void autoSavePermsAndRules(nextPerms, nextRules);
  };

  const setSalesPermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const salesKeys: Permission[] = [
      "view_sales",
      "create_sale",
      "sales.view",
      "sales.create",
      "sales.history",
      "view_products",
      "view_prices",
      "view_stock",
    ].filter((p) => allPlatformPermissions.includes(p as Permission)) as Permission[];

    const nextPerms = isDevMember
      ? Array.from(new Set([...activePerms, ...salesKeys]))
      : Array.from(new Set([...activePerms, ...salesKeys.filter((p) => visiblePlatformPermissions.includes(p))]));

    const nextRules = {
      ...activeRules,
      can_sell: true,
      allow_sales_counter: true,
      can_view_all_sales: true,
    };
    setActiveRules(nextRules);
    setActivePerms(nextPerms);
    void autoSavePermsAndRules(nextPerms, nextRules);
    toast.success("Predefinição de Vendas & Balcão aplicada!");
  };

  const setProductionPermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const prodKeys: Permission[] = [
      "productions.view",
      "productions.create",
      "production_management.view",
      "raw_materials.view",
      "raw_materials.create",
      "raw_materials.edit",
      "raw_materials.transfer_bau",
      "view_stock",
    ].filter((p) => allPlatformPermissions.includes(p as Permission)) as Permission[];

    const nextPerms = isDevMember
      ? Array.from(new Set([...activePerms, ...prodKeys]))
      : Array.from(new Set([...activePerms, ...prodKeys.filter((p) => visiblePlatformPermissions.includes(p))]));

    const nextRules = {
      ...activeRules,
      can_manage_productions: true,
      can_manage_raw_materials: true,
      can_manage_production_recipes: true,
    };
    setActiveRules(nextRules);
    setActivePerms(nextPerms);
    void autoSavePermsAndRules(nextPerms, nextRules);
    toast.success("Predefinição de Produção & Fábrica aplicada!");
  };

  const handleToggleEntireCategory = (categoryCards: PageCardConfig[], markAll: boolean) => {
    if (!canManagePerms) {
      toast.error("Você não possui permissão para alterar permissões da tag.");
      return;
    }
    const categoryPermKeys = categoryCards.flatMap((c) => c.permissions.map((p) => p.key));
    let nextPerms: Permission[];
    if (markAll) {
      nextPerms = Array.from(new Set([...activePerms, ...categoryPermKeys]));
    } else {
      const set = new Set(activePerms);
      categoryPermKeys.forEach((k) => set.delete(k));
      nextPerms = Array.from(set);
    }
    setActivePerms(nextPerms);
    void autoSavePermsAndRules(nextPerms, activeRules);
    toast.success(markAll ? "Todas as permissões da categoria marcadas!" : "Todas as permissões da categoria desmarcadas!");
  };

  const clearAllPermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const next = isDevMember
      ? []
      : activePerms.filter((p) => !visiblePlatformPermissions.includes(p));

    const nextRules = isDevMember
      ? {
          ...activeRules,
          can_view_all_tickets: false,
          can_view_sensitive_data: false,
          can_view_all_sales: false,
          can_reverse_sales: false,
          can_create_announcements: false,
          can_access_ceo: false,
          is_ceo: false,
        }
      : {
          ...activeRules,
          can_view_all_sales: false,
          can_reverse_sales: false,
        };
    setActiveRules(nextRules);
    setActivePerms(next);
    void autoSavePermsAndRules(next, nextRules);
  };

  // Lista de tags filtrada
  const filteredTags = useMemo(() => {
    return tags.filter((tag) => {
      if (tagSearch) {
        const q = tagSearch.toLowerCase();
        const matchName = tag.name.toLowerCase().includes(q);
        const matchId = tag.id.toLowerCase().includes(q);
        const matchDesc = (tag.description || "").toLowerCase().includes(q);
        const matchDiscord = (tag.discord_role_name || "").toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDesc && !matchDiscord) return false;
      }

      if (tagFilter === "active" && !tag.is_active) return false;
      if (
        tagFilter === "blocking" &&
        !tag.rules?.is_blocked &&
        !tag.rules?.block_operations &&
        !tag.rules?.block_login &&
        !tag.rules?.block_escalas &&
        !tag.rules?.block_sales &&
        !tag.rules?.block_movements &&
        !tag.rules?.block_productions &&
        !tag.rules?.block_cash_fund
      )
        return false;
      if (tagFilter === "sales" && !tag.rules?.can_sell && tag.id !== "vendedor") return false;
      if (tagFilter === "productions" && !tag.rules?.can_manage_productions && !tag.rules?.can_manage_raw_materials) return false;
      if (tagFilter === "discord" && !tag.discord_role_id) return false;
      if (tagFilter === "system" && !tag.is_system) return false;

      return true;
    });
  }, [tags, tagSearch, tagFilter]);

  // Abertura do Modal de Criação / Edição
  const handleOpenCreateModal = () => {
    if (!canCreateTag) {
      toast.error("Você não possui permissão para criar tags.");
      return;
    }
    setEditingTag(null);
    setFormId("");
    setFormName("");
    setFormDesc("");
    setFormColor("#10b981");
    setColorMode("solid");
    setFormIcon("Tag");
    setIconSearch("");
    setSelectedIconCategory("all");
    setFormIsActive(true);
    setFormIsSystem(false);
    setFormRules({});
    setFormDiscordRoleId(null);
    setFormDiscordGuildId(null);
    setFormDiscordRoleName(null);
    setFormDiscordSyncEnabled(true);
    setFormDiscordRolePosition(null);
    setIsTagModalOpen(true);
  };

  const handleOpenEditModal = (tag: MemberTag) => {
    if (!canEditTag) {
      toast.error("Você não possui permissão para editar tags.");
      return;
    }
    setEditingTag(tag);
    setFormId(tag.id);
    setFormName(tag.name);
    setFormDesc(tag.description || "");
    const tagColor = tag.color || "#10b981";
    setFormColor(tagColor);
    setColorMode(tagColor.includes("gradient") || tagColor.startsWith("linear-") ? "gradient" : "solid");
    setFormIcon(tag.icon || "Tag");
    setIconSearch("");
    setSelectedIconCategory("all");
    setFormIsActive(tag.is_active !== false);
    setFormIsSystem(Boolean(tag.is_system));
    setFormRules(parseMemberTagRules(tag.rules));
    setFormDiscordRoleId(tag.discord_role_id || null);
    setFormDiscordGuildId(tag.discord_guild_id || null);
    setFormDiscordRoleName(tag.discord_role_name || null);
    setFormDiscordSyncEnabled(tag.discord_sync_enabled !== false);
    setFormDiscordRolePosition(tag.discord_role_position !== undefined ? tag.discord_role_position : null);
    setIsTagModalOpen(true);
  };

  const handleDuplicateTag = (tag: MemberTag) => {
    if (!canCreateTag) {
      toast.error("Você não possui permissão para criar tags.");
      return;
    }
    setEditingTag(null);
    const baseSlug = `${tag.id}_copia`.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    setFormId(baseSlug);
    setFormName(`${tag.name} (Cópia)`);
    setFormDesc(tag.description || "");
    const tagColor = tag.color || "#10b981";
    setFormColor(tagColor);
    setColorMode(tagColor.includes("gradient") || tagColor.startsWith("linear-") ? "gradient" : "solid");
    setFormIcon(tag.icon || "Tag");
    setIconSearch("");
    setSelectedIconCategory("all");
    setFormIsActive(true);
    setFormIsSystem(Boolean(tag.is_system));
    setFormRules({ ...parseMemberTagRules(tag.rules) });
    setFormDiscordRoleId(null);
    setFormDiscordGuildId(null);
    setFormDiscordRoleName(null);
    setFormDiscordSyncEnabled(false);
    setFormDiscordRolePosition(null);
    setIsTagModalOpen(true);
    toast.info("Configurações duplicadas com sucesso! Ajuste o que desejar e clique em Criar Tag.");
  };

  const handleSaveTagForm = async () => {
    if (editingTag && !canEditTag) {
      toast.error("Você não possui permissão para editar tags.");
      return;
    }
    if (!editingTag && !canCreateTag) {
      toast.error("Você não possui permissão para criar tags.");
      return;
    }
    if (!formName.trim()) {
      toast.error("Informe o nome da tag.");
      return;
    }
    const cleanId = (formId || formName)
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]/g, "_");

    if (!cleanId) {
      toast.error("Informe um identificador (slug) válido.");
      return;
    }

    if (cleanId === "ceo" || formName.trim().toLowerCase() === "ceo") {
      toast.error("A tag CEO não pode ser criada ou modificada por esta página.");
      return;
    }

    if (editingTag && cleanId !== editingTag.id) {
      const isTaken = tags.some((t) => t.id.toLowerCase() === cleanId && t.id.toLowerCase() !== editingTag.id.toLowerCase());
      if (isTaken) {
        toast.error(`O identificador (slug) "${cleanId}" já está em uso por outra tag.`);
        return;
      }
    } else if (!editingTag) {
      const isTaken = tags.some((t) => t.id.toLowerCase() === cleanId);
      if (isTaken) {
        toast.error(`O identificador (slug) "${cleanId}" já está em uso.`);
        return;
      }
    }

    try {
      const rawRules = editingTag
        ? { ...parseMemberTagRules(editingTag.rules), ...formRules }
        : formRules;
      const mergedRules = { ...rawRules, can_access_ceo: false, is_ceo: false };

      if (editingTag && cleanId !== editingTag.id) {
        toast.info("Slug alterado: migrando vínculos e regras para o novo identificador...");
      }

      await saveTagMutation.mutateAsync({
        id: cleanId,
        previousId: editingTag ? editingTag.id : undefined,
        name: formName.trim(),
        description: formDesc.trim() || null,
        color: formColor,
        icon: formIcon,
        is_active: formIsActive,
        permissions: editingTag ? editingTag.permissions : [],
        rules: mergedRules,
        is_system: formIsSystem,
        discord_role_id: formDiscordRoleId,
        discord_guild_id: formDiscordGuildId,
        discord_role_name: formDiscordRoleName,
        discord_sync_enabled: formDiscordSyncEnabled,
        discord_role_position: formDiscordRolePosition,
      });
      setIsTagModalOpen(false);
      setEditingTag(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
        window.dispatchEvent(new Event("tw_permissions_synced"));
        window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
      }
    } catch (e) {
      // Já tratado na mutation
    }
  };

  // Funções de Integração Discord
  const loadGuildRoles = async (guildId: string) => {
    if (!guildId) return;
    setLoadingGuildRoles(true);
    try {
      const roles = await fetchGuildRoles(guildId);
      setGuildRoles(roles);
    } catch (err: any) {
      toast.error("Erro ao carregar cargos do Discord.");
    } finally {
      setLoadingGuildRoles(false);
    }
  };

  const handleOpenDiscordModal = async (tag: MemberTag) => {
    if (!canDiscordConfig && !canDiscordLink && !canDiscordCreateRole) {
      toast.error("Você não possui permissão para gerenciar a integração Discord de tags.");
      return;
    }
    setTagForDiscord(tag);
    setCreateRoleName(tag.name);
    setCreateRoleColor(tag.color || "#5865F2");
    setCreateRoleHoist(true);
    setCreateRoleMentionable(false);
    setSyncReport(null);
    setRoleSearch("");
    setTargetInsertMode("below");
    setTargetRelativeRoleId("");
    setDiscordModalTab(tag.discord_role_id ? "link" : "create");

    try {
      const gList = await fetchBotGuilds();
      setDiscordGuilds(gList);
      const targetGuild = tag.discord_guild_id || gList[0]?.id || "1535505650308620400";
      setSelectedGuildId(targetGuild);
      await loadGuildRoles(targetGuild);
    } catch {
      await loadGuildRoles("1535505650308620400");
    }
  };

  const handleLinkExistingRole = async (role: DiscordRoleInfo) => {
    if (!tagForDiscord) return;
    if (!canDiscordLink) {
      toast.error("Você não tem permissão para vincular cargos do Discord.");
      return;
    }
    try {
      await saveTagMutation.mutateAsync({
        ...tagForDiscord,
        discord_role_id: role.id,
        discord_guild_id: selectedGuildId,
        discord_role_name: role.name,
        discord_role_position: role.position,
      });
      setTagForDiscord((prev) =>
        prev
          ? {
              ...prev,
              discord_role_id: role.id,
              discord_guild_id: selectedGuildId,
              discord_role_name: role.name,
              discord_role_position: role.position,
            }
          : null
      );
      toast.success(`Tag vinculada com sucesso ao cargo "${role.name}" no Discord!`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao vincular cargo.");
    }
  };

  const handleUnlinkDiscordRole = async () => {
    if (!tagForDiscord) return;
    if (!canDiscordLink) {
      toast.error("Você não tem permissão para desvincular cargos do Discord.");
      return;
    }
    try {
      await saveTagMutation.mutateAsync({
        ...tagForDiscord,
        discord_role_id: null,
        discord_guild_id: null,
        discord_role_name: null,
        discord_role_position: null,
      });
      setTagForDiscord((prev) =>
        prev
          ? {
              ...prev,
              discord_role_id: null,
              discord_guild_id: null,
              discord_role_name: null,
              discord_role_position: null,
            }
          : null
      );
      toast.success("Cargo do Discord desvinculado da tag com sucesso.");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao desvincular cargo.");
    }
  };

  const handleCreateAndLinkDiscordRole = async () => {
    if (!tagForDiscord) return;
    if (!canDiscordCreateRole) {
      toast.error("Você não possui permissão para criar cargos no Discord.");
      return;
    }
    if (!createRoleName.trim()) {
      toast.error("Informe o nome do cargo Discord.");
      return;
    }

    setIsCreatingRole(true);
    try {
      let targetPos: number | undefined = undefined;
      if (targetInsertMode === "above" && targetRelativeRoleId) {
        const rel = guildRoles.find((r) => r.id === targetRelativeRoleId);
        if (rel) targetPos = rel.position + 1;
      } else if (targetInsertMode === "below" && targetRelativeRoleId) {
        const rel = guildRoles.find((r) => r.id === targetRelativeRoleId);
        if (rel) targetPos = Math.max(1, rel.position);
      } else if (targetInsertMode === "exact") {
        targetPos = createRolePosition;
      }

      const newRole = await createDiscordRoleForTag({
        guildId: selectedGuildId,
        name: createRoleName.trim(),
        colorHex: createRoleColor,
        hoist: createRoleHoist,
        mentionable: createRoleMentionable,
        targetPosition: targetPos,
      });

      await saveTagMutation.mutateAsync({
        ...tagForDiscord,
        discord_role_id: newRole.id,
        discord_guild_id: selectedGuildId,
        discord_role_name: newRole.name,
        discord_role_position: newRole.position,
      });

      setTagForDiscord((prev) =>
        prev
          ? {
              ...prev,
              discord_role_id: newRole.id,
              discord_guild_id: selectedGuildId,
              discord_role_name: newRole.name,
              discord_role_position: newRole.position,
            }
          : null
      );

      await loadGuildRoles(selectedGuildId);
      setDiscordModalTab("link");
      toast.success(`Cargo "${newRole.name}" criado no Discord e vinculado com sucesso!`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Falha ao criar cargo no Discord.");
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleUpdatePosition = async (roleId: string, newPosition: number) => {
    if (!tagForDiscord || !canDiscordEditPosition) {
      toast.error("Você não tem permissão para alterar posição hierárquica no Discord.");
      return;
    }
    setIsUpdatingPosition(true);
    try {
      await updateDiscordRolePosition(selectedGuildId, roleId, newPosition);
      if (tagForDiscord.discord_role_id === roleId) {
        await saveTagMutation.mutateAsync({
          ...tagForDiscord,
          discord_role_position: newPosition,
        });
        setTagForDiscord((prev) => (prev ? { ...prev, discord_role_position: newPosition } : null));
      }
      await loadGuildRoles(selectedGuildId);
      toast.success("Posição hierárquica do cargo atualizada no Discord!");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar posição no Discord.");
    } finally {
      setIsUpdatingPosition(false);
    }
  };

  const handleSyncMembersNow = async () => {
    if (!tagForDiscord || !tagForDiscord.discord_role_id) {
      toast.error("Vincule um cargo do Discord antes de sincronizar.");
      return;
    }
    if (!canDiscordSync) {
      toast.error("Você não tem permissão para sincronizar membros no Discord.");
      return;
    }

    setIsSyncingAll(true);
    setSyncReport(null);
    try {
      const report = await syncAllMembersForTag(tagForDiscord);
      setSyncReport(report);
      if (report.success) {
        toast.success(`Sincronização concluída! ${report.synced} membros sincronizados com sucesso.`);
      } else {
        toast.warning(`Sincronização concluída com avisos: ${report.synced} sincronizados, ${report.failed} falhas.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Falha na sincronização com o Discord.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Abertura do Modal de Vínculo de Membros
  const handleOpenAssignMembersModal = (tag: MemberTag) => {
    if (!canAssignTag) {
      toast.error("Você não possui permissão para vincular membros a tags.");
      return;
    }
    const cleanId = (tag.id || "").toLowerCase().trim();
    const cleanName = (tag.name || "").toLowerCase().trim();
    if (cleanId === "ceo" || cleanName === "ceo") {
      toast.error("Não é permitido atribuir a tag CEO por esta página.");
      return;
    }
    setTagForMembers(tag);
    const existing = new Set<string>();
    assignments
      .filter((a) => a.tag_id === tag.id)
      .forEach((a) => {
        if (a.member_id) existing.add(a.member_id);
      });
    // Sincroniza pares de user_id e id de cada membro
    members.forEach((m) => {
      if (m.user_id && existing.has(m.user_id) && m.id) existing.add(m.id);
      if (m.id && existing.has(m.id) && m.user_id) existing.add(m.user_id);
    });
    setSelectedMemberIds(existing);
    setMemberAssignSearch("");
    setMemberAssignFilter("all");
    setMemberAssignRankFilter("all");
    setMemberAssignSavingId(null);
    setMemberAssignAutoSaved(false);
  };

  const currentlyAssignedMembersList = useMemo(() => {
    if (!tagForMembers) return [];
    return members.filter((m) => {
      const memId = m.user_id || m.id || "";
      return (
        (memId && selectedMemberIds.has(memId)) ||
        (m.user_id && selectedMemberIds.has(m.user_id)) ||
        (m.id && selectedMemberIds.has(m.id))
      );
    });
  }, [tagForMembers, members, selectedMemberIds]);

  const filteredMembersForAssign = useMemo(() => {
    const list = members.filter((m) => {
      const memId = m.user_id || m.id || "";
      const isAssigned =
        (memId ? selectedMemberIds.has(memId) : false) ||
        (m.user_id && selectedMemberIds.has(m.user_id)) ||
        (m.id && selectedMemberIds.has(m.id));

      if (memberAssignFilter === "assigned" && !isAssigned) return false;
      if (memberAssignFilter === "unassigned" && isAssigned) return false;

      if (memberAssignRankFilter !== "all") {
        if ((m.nivel || "").trim() !== memberAssignRankFilter) return false;
      }

      if (!memberAssignSearch) return true;
      const q = memberAssignSearch.toLowerCase();
      const matchName = m.nome.toLowerCase().includes(q);
      const matchNick = (m.nickname || "").toLowerCase().includes(q);
      const matchGameId = (m.game_id || "").includes(q);
      const matchNivel = (m.nivel || "").toLowerCase().includes(q);
      return matchName || matchNick || matchGameId || matchNivel;
    });

    // Ordenação: 1º Integrantes vinculados no topo, 2º Ordem alfabética
    return list.sort((a, b) => {
      const isAssignedA =
        (a.user_id && selectedMemberIds.has(a.user_id)) ||
        (a.id && selectedMemberIds.has(a.id));
      const isAssignedB =
        (b.user_id && selectedMemberIds.has(b.user_id)) ||
        (b.id && selectedMemberIds.has(b.id));

      if (isAssignedA !== isAssignedB) {
        return isAssignedA ? -1 : 1;
      }

      const nameA = (a.nickname || a.nome || "").trim();
      const nameB = (b.nickname || b.nome || "").trim();
      return nameA.localeCompare(nameB, "pt-BR", { sensitivity: "base" });
    });
  }, [members, memberAssignSearch, memberAssignFilter, memberAssignRankFilter, selectedMemberIds]);

  const handleToggleMember = async (member: { id?: string; user_id?: string }) => {
    if (!tagForMembers) return;
    const cleanTagId = (tagForMembers.id || "").toLowerCase().trim();
    const cleanTagName = (tagForMembers.name || "").toLowerCase().trim();
    if (cleanTagId === "ceo" || cleanTagName === "ceo") {
      toast.error("Não é permitido atribuir a tag CEO por esta página.");
      return;
    }
    if (!canAssignTag) {
      toast.error("Você não possui permissão para alterar vínculos de membros.");
      return;
    }

    const candidateIds = [member.user_id, member.id].filter(Boolean) as string[];
    if (candidateIds.length === 0) return;

    const isCurrentlyChecked = candidateIds.some((id) => selectedMemberIds.has(id));
    const nextChecked = !isCurrentlyChecked;
    const primaryId = member.user_id || member.id || candidateIds[0];

    // Atualização otimista imediata na interface
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (nextChecked) {
        candidateIds.forEach((id) => next.add(id));
      } else {
        candidateIds.forEach((id) => next.delete(id));
      }
      return next;
    });

    setMemberAssignSavingId(primaryId);
    setMemberAssignAutoSaved(false);

    try {
      await toggleAssignmentMutation.mutateAsync({
        memberId: primaryId,
        tagId: tagForMembers.id,
        currentStatus: isCurrentlyChecked,
        active: nextChecked,
        candidateIds,
        assignedBy: user?.id,
      });

      setMemberAssignAutoSaved(true);
      if (memberAutoSavedTimerRef.current) clearTimeout(memberAutoSavedTimerRef.current);
      memberAutoSavedTimerRef.current = setTimeout(() => {
        setMemberAssignAutoSaved(false);
      }, 2500);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
        window.dispatchEvent(new Event("tw_permissions_synced"));
        window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
      }
    } catch (err: any) {
      // Reverter em caso de erro
      setSelectedMemberIds((prev) => {
        const rollback = new Set(prev);
        if (isCurrentlyChecked) {
          candidateIds.forEach((id) => rollback.add(id));
        } else {
          candidateIds.forEach((id) => rollback.delete(id));
        }
        return rollback;
      });
      toast.error(err.message || "Erro ao salvar vínculo do membro.");
    } finally {
      setMemberAssignSavingId(null);
    }
  };

  const handleSelectAllFilteredMembers = async () => {
    if (!tagForMembers) return;
    const cleanTagId = (tagForMembers.id || "").toLowerCase().trim();
    const cleanTagName = (tagForMembers.name || "").toLowerCase().trim();
    if (cleanTagId === "ceo" || cleanTagName === "ceo") {
      toast.error("Não é permitido atribuir a tag CEO por esta página.");
      return;
    }
    if (!canAssignTag) {
      toast.error("Você não possui permissão para alterar vínculos de membros.");
      return;
    }
    const next = new Set(selectedMemberIds);
    filteredMembersForAssign.forEach((m) => {
      const id = m.user_id || m.id;
      if (id) next.add(id);
    });
    setSelectedMemberIds(next);
    setMemberAssignAutoSaved(false);

    try {
      await setTagMembersMutation.mutateAsync({
        tagId: tagForMembers.id,
        memberIds: Array.from(next),
        assignedBy: user?.id,
      });
      setMemberAssignAutoSaved(true);
      if (memberAutoSavedTimerRef.current) clearTimeout(memberAutoSavedTimerRef.current);
      memberAutoSavedTimerRef.current = setTimeout(() => {
        setMemberAssignAutoSaved(false);
      }, 2500);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
        window.dispatchEvent(new Event("tw_permissions_synced"));
        window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao vincular todos os membros.");
    }
  };

  const handleClearAllFilteredMembers = async () => {
    if (!tagForMembers) return;
    const cleanTagId = (tagForMembers.id || "").toLowerCase().trim();
    const cleanTagName = (tagForMembers.name || "").toLowerCase().trim();
    if (cleanTagId === "ceo" || cleanTagName === "ceo") {
      toast.error("Não é permitido atribuir a tag CEO por esta página.");
      return;
    }
    if (!canAssignTag) {
      toast.error("Você não possui permissão para alterar vínculos de membros.");
      return;
    }
    const next = new Set(selectedMemberIds);
    filteredMembersForAssign.forEach((m) => {
      if (m.user_id) next.delete(m.user_id);
      if (m.id) next.delete(m.id);
    });
    setSelectedMemberIds(next);
    setMemberAssignAutoSaved(false);

    try {
      await setTagMembersMutation.mutateAsync({
        tagId: tagForMembers.id,
        memberIds: Array.from(next),
        assignedBy: user?.id,
      });
      setMemberAssignAutoSaved(true);
      if (memberAutoSavedTimerRef.current) clearTimeout(memberAutoSavedTimerRef.current);
      memberAutoSavedTimerRef.current = setTimeout(() => {
        setMemberAssignAutoSaved(false);
      }, 2500);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
        window.dispatchEvent(new Event("tw_permissions_synced"));
        window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao desvincular membros.");
    }
  };

  // Abertura do Modal de Permissões e Regras
  const handleOpenPermsModal = (tag: MemberTag) => {
    if (!canManagePerms && !canManageRules && !hasPermission("view_ceo_tag_permissions")) {
      toast.error("Você não possui permissão para acessar permissões e regras da tag.");
      return;
    }
    setTagForPerms(tag);
    const rawPerms = Array.isArray(tag.permissions) ? [...tag.permissions] : [];
    let validPerms = rawPerms.filter((p) => allPlatformPermissions.includes(p));
    const parsedRules = parseMemberTagRules(tag.rules);

    parsedRules.can_access_ceo = false;
    parsedRules.is_ceo = false;
    validPerms = validPerms.filter((p) => p !== "view_ceo" && p !== "view_ceo_dashboard");

    setActivePerms(Array.from(new Set(validPerms)));
    setActiveRules(parsedRules);
    setPermSearch("");
    setPermCategoryFilter("all");
    setPermSubTab(canManagePerms || !canManageRules ? "permissions" : "rules");
    setAutoSaveStatus("idle");
    setIsModalAtTop(true);
  };

  const autoSavePermsAndRules = async (newPerms: Permission[], newRules: MemberTagRules) => {
    if (!tagForPerms) return;
    setAutoSaveStatus("saving");
    try {
      let permsToSave = newPerms;
      let rulesToSave = { ...newRules };
      if (!isDevMember) {
        if (tagForPerms.permissions) {
          const existingRawPerms = Array.isArray(tagForPerms.permissions) ? tagForPerms.permissions : [];
          const existingRestricted = existingRawPerms.filter((p) => restrictedPermissionKeys.has(p));
          permsToSave = Array.from(new Set([...permsToSave, ...existingRestricted]));
        }

        const existingRules = parseMemberTagRules(tagForPerms.rules);
        rulesToSave = {
          ...rulesToSave,
          can_access_ceo: Boolean(existingRules.can_access_ceo),
          is_ceo: Boolean(existingRules.is_ceo),
          can_access_dev: Boolean(existingRules.can_access_dev),
          is_dev_test: Boolean(existingRules.is_dev_test),
        };
      }

      const safeRules = parseMemberTagRules(rulesToSave);
      await updatePermissionsAndRulesMutation.mutateAsync({
        tagId: tagForPerms.id,
        permissions: permsToSave,
        rules: safeRules,
        silent: true,
      });

      // Atualiza o estado da tag no modal para evitar snapshot defasado
      setTagForPerms((prev) => (prev ? { ...prev, permissions: permsToSave, rules: safeRules } : null));

      setAutoSaveStatus("saved");
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tw_auth_reload", {
            detail: {
              type: "tags_updated",
              tag: tagForPerms.id,
              timestamp: Date.now(),
            },
          })
        );
        window.dispatchEvent(new Event("tw_tags_updated"));
        window.dispatchEvent(new Event("tw_permissions_synced"));
        window.dispatchEvent(new CustomEvent("tw_member_tags_updated", { detail: { tag: tagForPerms.id } }));
        window.dispatchEvent(new Event("tw_tickets_updated"));
      }
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 2500);
    } catch (e) {
      setAutoSaveStatus("error");
      toast.error("Erro ao salvar permissões e regras da tag automaticamente.");
    }
  };

  const handleTogglePerm = (perm: Permission) => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const isAdding = !activePerms.includes(perm);
    const equivs = (PERMISSION_EQUIVALENCES[perm as string] || []) as Permission[];
    const keysToRemove = new Set<Permission>([perm, ...equivs]);
    const nextPerms = isAdding
      ? Array.from(new Set([...activePerms, perm]))
      : activePerms.filter((p) => !keysToRemove.has(p));

    let nextRules = { ...activeRules };
    if (perm === "view_all_tickets") {
      nextRules.can_view_all_tickets = isAdding;
    }
    if (perm === "manage_members") {
      nextRules.can_manage_members = isAdding;
    }
    if (perm === "view_sensitive_data") {
      nextRules.can_view_sensitive_data = isAdding;
    }
    if (perm === "create_announcements" || perm === "manage_announcements") {
      nextRules.can_create_announcements = isAdding;
    }
    if (perm === "view_all_sales") {
      nextRules.can_view_all_sales = isAdding;
    }
    if (perm === "reverse_sale" || perm === "sales.cancel") {
      nextRules.can_reverse_sales = isAdding;
    }

    setActiveRules(nextRules);
    setActivePerms(nextPerms);
    void autoSavePermsAndRules(nextPerms, nextRules);
  };

  const handleToggleCardPerms = (card: PageCardConfig) => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const cardKeys = card.permissions.map((p) => p.key);
    const allEquivKeys = cardKeys.flatMap((k) => [k, ...((PERMISSION_EQUIVALENCES[k as string] || []) as Permission[])]);
    const allIn = cardKeys.every((k) => activePerms.includes(k));
    const keysToRemove = new Set<Permission>(allEquivKeys);
    const nextPerms = allIn
      ? activePerms.filter((k) => !keysToRemove.has(k))
      : Array.from(new Set([...activePerms, ...cardKeys]));

    let nextRules = { ...activeRules };
    if (cardKeys.includes("view_all_tickets")) {
      nextRules.can_view_all_tickets = nextPerms.includes("view_all_tickets");
    }
    if (cardKeys.includes("manage_members")) {
      nextRules.can_manage_members = nextPerms.includes("manage_members");
    }
    if (cardKeys.includes("view_sensitive_data")) {
      nextRules.can_view_sensitive_data = nextPerms.includes("view_sensitive_data");
    }
    if (cardKeys.includes("create_announcements") || cardKeys.includes("manage_announcements")) {
      nextRules.can_create_announcements = nextPerms.includes("create_announcements") || nextPerms.includes("manage_announcements");
    }
    if (cardKeys.includes("view_all_sales")) {
      nextRules.can_view_all_sales = nextPerms.includes("view_all_sales");
    }
    if (cardKeys.includes("reverse_sale") || cardKeys.includes("sales.cancel")) {
      nextRules.can_reverse_sales = nextPerms.includes("reverse_sale") || nextPerms.includes("sales.cancel");
    }

    setActiveRules(nextRules);
    setActivePerms(nextPerms);
    void autoSavePermsAndRules(nextPerms, nextRules);
  };

  const handleUpdateRuleValue = (newRules: MemberTagRules) => {
    if (!canManageRules) {
      toast.error("Você não tem permissão para alterar regras operacionais de tags.");
      return;
    }
    let nextPerms = [...activePerms];

    // Sincronização view_all_tickets
    if (newRules.can_view_all_tickets && !nextPerms.includes("view_all_tickets")) {
      nextPerms.push("view_all_tickets");
    } else if (!newRules.can_view_all_tickets && nextPerms.includes("view_all_tickets")) {
      nextPerms = nextPerms.filter((p) => p !== "view_all_tickets");
    }

    // Sincronização can_view_sensitive_data
    if (newRules.can_view_sensitive_data && !nextPerms.includes("view_sensitive_data")) {
      nextPerms.push("view_sensitive_data");
    } else if (!newRules.can_view_sensitive_data && nextPerms.includes("view_sensitive_data")) {
      nextPerms = nextPerms.filter((p) => p !== "view_sensitive_data");
    }

    // Sincronização can_create_announcements
    if (newRules.can_create_announcements && !nextPerms.includes("create_announcements" as any)) {
      nextPerms.push("create_announcements" as any, "manage_announcements");
    } else if (!newRules.can_create_announcements) {
      nextPerms = nextPerms.filter((p) => p !== "create_announcements" && p !== "manage_announcements");
    }

    // Sincronização can_view_all_sales
    if (newRules.can_view_all_sales && !nextPerms.includes("view_all_sales")) {
      nextPerms.push("view_all_sales");
    } else if (!newRules.can_view_all_sales && nextPerms.includes("view_all_sales")) {
      nextPerms = nextPerms.filter((p) => p !== "view_all_sales");
    }

    // Sincronização can_reverse_sales
    if (newRules.can_reverse_sales && !nextPerms.includes("reverse_sale")) {
      nextPerms.push("reverse_sale", "sales.cancel");
    } else if (!newRules.can_reverse_sales) {
      nextPerms = nextPerms.filter((p) => p !== "reverse_sale" && p !== "sales.cancel");
    }

    nextPerms = nextPerms.filter((p) => p !== "view_ceo" && p !== "view_ceo_dashboard");
    nextPerms = Array.from(new Set(nextPerms));
    setActiveRules(newRules);
    setActivePerms(nextPerms);
    void autoSavePermsAndRules(nextPerms, newRules);
  };

  const handleDiscountChange = (val: number) => {
    if (!canManageRules) {
      toast.error("Você não tem permissão para alterar regras operacionais de tags.");
      return;
    }
    const nextRules = { ...activeRules, max_discount_pct: val };
    setActiveRules(nextRules);
    if (debounceDiscountRef.current) clearTimeout(debounceDiscountRef.current);
    debounceDiscountRef.current = setTimeout(() => {
      void autoSavePermsAndRules(activePerms, nextRules);
    }, 400);
  };

  if (!canViewTags) {
    return <NoAccess />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER DA PÁGINA */}
      <PageHeader
        title="Gerenciar Tags"
        description="Gestão executiva de tags, cargos especiais, concessão de permissões granulares e regras operacionais."
      >
        <div className="flex items-center gap-2">
          <CeoBadge />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void refetchTags();
              void refetchAssignments();
              toast.info("Dados de tags atualizados.");
            }}
            className="rounded-xl gap-1.5 h-9 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sincronizar</span>
          </Button>
          {canReorderTags && tags.length > 1 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setReorderList([...tags]);
                setIsReorderModalOpen(true);
              }}
              className="rounded-xl gap-1.5 h-9 text-xs border-primary/30 text-primary hover:bg-primary/10 shadow-xs"
              title="Reordenar a prioridade e hierarquia das tags"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>Reordenar Tags ({tags.length})</span>
            </Button>
          )}
          {canCreateTag && (
            <Button
              type="button"
              onClick={handleOpenCreateModal}
              className="rounded-xl gap-2 h-9 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Nova Tag</span>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* MÉTRICAS EM DESTAQUE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="surface-card border border-primary/20 shadow-lg relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-60 pointer-events-none" />
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total de Tags</span>
            <div className="p-2 rounded-xl bg-primary/15 text-primary border border-primary/30 shadow-xs group-hover:scale-105 transition-transform">
              <TagIcon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">{metrics.totalTags}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Cadastradas na plataforma</p>
          </CardContent>
        </Card>

        <Card className="surface-card border border-sky-500/20 shadow-lg relative overflow-hidden group hover:border-sky-500/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Membros com Tag</span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-xs group-hover:scale-105 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">{metrics.totalAssignedMembers}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Com atribuição ativa</p>
          </CardContent>
        </Card>

        <Card className="surface-card border border-emerald-500/20 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags Ativas</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">{metrics.activeTags}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Operacionais no sistema</p>
          </CardContent>
        </Card>

        <Card className="surface-card border border-rose-500/20 shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags Bloqueadoras</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs group-hover:scale-105 transition-transform">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 relative z-10">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">{metrics.blockingTags}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Restringem operações</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS E BUSCA */}
      <Card className="surface-card border-border/80 shadow-md">
        <CardContent className="p-3.5 sm:p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-84">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Buscar por nome, slug (@tag) ou regra..."
              className="pl-9 h-9 text-xs rounded-xl bg-background/60 border-border/70 focus-visible:ring-primary/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <Button
              type="button"
              variant={tagFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("all")}
              className="h-8 text-xs rounded-xl font-bold cursor-pointer"
            >
              Todas ({tags.length})
            </Button>
            <Button
              type="button"
              variant={tagFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("active")}
              className="h-8 text-xs rounded-xl font-bold cursor-pointer"
            >
              Ativas ({metrics.activeTags})
            </Button>
            <Button
              type="button"
              variant={tagFilter === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("system")}
              className="h-8 text-xs rounded-xl font-bold gap-1 cursor-pointer border-amber-500/30 text-amber-300"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Sistema ({tags.filter((t) => t.is_system).length})</span>
            </Button>
            <Button
              type="button"
              variant={tagFilter === "sales" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("sales")}
              className="h-8 text-xs rounded-xl font-bold gap-1 cursor-pointer"
            >
              <ShoppingCart className="h-3 w-3 text-emerald-400" />
              <span>Vendas</span>
            </Button>
            <Button
              type="button"
              variant={tagFilter === "productions" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("productions")}
              className="h-8 text-xs rounded-xl font-bold gap-1 cursor-pointer"
            >
              <Factory className="h-3 w-3 text-amber-400" />
              <span>Produção</span>
            </Button>
            <Button
              type="button"
              variant={tagFilter === "blocking" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("blocking")}
              className="h-8 text-xs rounded-xl font-bold gap-1 cursor-pointer border-rose-500/30 text-rose-400"
            >
              <ShieldAlert className="h-3 w-3 text-rose-400" />
              <span>Bloqueadoras ({metrics.blockingTags})</span>
            </Button>
            <Button
              type="button"
              variant={tagFilter === "discord" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("discord")}
              className="h-8 text-xs rounded-xl font-bold gap-1.5 border-indigo-500/30 text-indigo-300 cursor-pointer"
            >
              <DiscordIconSvg className="h-3.5 w-3.5 text-[#5865F2]" />
              <span>Discord ({tags.filter((t) => t.discord_role_id).length})</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GRID DE TAGS COM DESIGN PREMIUM */}
      {loadingTags ? (
        <TableSkeleton rows={4} />
      ) : filteredTags.length === 0 ? (
        <EmptyState
          title="Nenhuma tag encontrada"
          description={
            tagSearch
              ? `Nenhum resultado para "${tagSearch}". Tente outro termo.`
              : "Nenhuma tag cadastrada com os filtros selecionados."
          }
          icon={<TagIcon className="h-10 w-10 text-muted-foreground" />}
          action={
            canCreateTag ? (
              <Button onClick={handleOpenCreateModal} size="sm" className="rounded-xl gap-2 text-xs font-bold cursor-pointer">
                <Plus className="h-4 w-4" />
                <span>Criar Primeira Tag</span>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map((tag) => {
            const tagAssignments = assignments.filter((a) => a.tag_id === tag.id);
            const assignedCount = tagAssignments.length;
            const assignedMemberIds = new Set(tagAssignments.map((a) => a.member_id));
            const sampleAssignedMembers = members.filter((m) => assignedMemberIds.has(m.id || "") || (m.user_id && assignedMemberIds.has(m.user_id))).slice(0, 4);
            const permsCount = Array.isArray(tag.permissions) ? tag.permissions.length : 0;
            const isBlocked = Boolean(tag.rules?.is_blocked || tag.rules?.block_operations);
            const canSell = Boolean(tag.rules?.can_sell);
            const canProduce = Boolean(tag.rules?.can_manage_productions);
            const canRaw = Boolean(tag.rules?.can_manage_raw_materials);
            const canWarehouse = Boolean(tag.rules?.can_transfer_warehouse);
            const canEscalas = Boolean(
              tag.rules?.can_manage_escalas ||
              tag.rules?.can_view_escalas ||
              tag.rules?.can_participate_escalas ||
              (Array.isArray(tag.permissions) && tag.permissions.some((p) => typeof p === "string" && p.startsWith("escalas.")))
            );
            const isDiscordLinked = Boolean(tag.discord_role_id);
            const currentTagIndex = tags.findIndex((t) => t.id === tag.id);
            const tagColor = tag.color || "#10b981";

            return (
              <Card
                key={tag.id}
                style={{
                  borderLeftColor: tagColor,
                  borderLeftWidth: "4px",
                }}
                className={cn(
                  "surface-card border transition-all duration-300 hover:shadow-xl flex flex-col justify-between overflow-hidden relative group",
                  !tag.is_active ? "opacity-60 bg-muted/20 border-dashed" : "border-border/80 hover:border-border"
                )}
              >
                <div>
                  <CardHeader className="p-4 pb-3 border-b border-border/40">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MemberTagBadge
                          tag={tag}
                          size="md"
                          showIcon
                          className="shadow-sm font-bold text-xs"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-mono font-bold px-1.5 py-0 h-4.5 rounded-md border flex items-center gap-1",
                                currentTagIndex === 0
                                  ? "bg-amber-500/15 text-amber-400 border-amber-500/35 font-extrabold"
                                  : currentTagIndex === 1
                                  ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/35"
                                  : "bg-muted/40 text-muted-foreground border-border/60"
                              )}
                              title={`Posição hierárquica #${currentTagIndex + 1}. A tag no topo tem a maior prioridade.`}
                            >
                              {currentTagIndex === 0 ? (
                                <>
                                  <Crown className="h-2.5 w-2.5 text-amber-400" />
                                  <span>#1 Topo</span>
                                </>
                              ) : (
                                <span>#{currentTagIndex + 1}</span>
                              )}
                            </Badge>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void navigator.clipboard.writeText(tag.id);
                                setCopiedSlug(tag.id);
                                setTimeout(() => setCopiedSlug(null), 1500);
                                toast.success(`Slug @${tag.id} copiado!`);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground font-semibold px-1 py-0.5 rounded hover:bg-secondary/60 transition-colors cursor-pointer group"
                              title="Clique para copiar o slug da tag"
                            >
                              <span>@{tag.id}</span>
                              {copiedSlug === tag.id ? (
                                <Check className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                              ) : (
                                <Copy className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100 shrink-0" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                        {canReorderTags && tags.length > 1 && (
                          <div className="flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5 border border-border/50 shadow-2xs">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={currentTagIndex <= 0 || updateTagsOrderMutation.isPending}
                              onClick={() => handleMoveTagUp(tag.id)}
                              className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title={currentTagIndex <= 0 ? "Tag já é nível #1 (topo)" : `Subir nível (mover para #${currentTagIndex})`}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={currentTagIndex >= tags.length - 1 || updateTagsOrderMutation.isPending}
                              onClick={() => handleMoveTagDown(tag.id)}
                              className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                              title={currentTagIndex >= tags.length - 1 ? "Tag já está no último nível" : `Descer nível (mover para #${currentTagIndex + 2})`}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {isDiscordLinked && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-2 py-0.5 border-[#5865F2]/40 text-indigo-300 bg-[#5865F2]/10 font-bold flex items-center gap-1 cursor-pointer hover:bg-[#5865F2]/20 transition-all"
                            onClick={() => handleOpenDiscordModal(tag)}
                            title={`Cargo Discord: ${tag.discord_role_name || tag.discord_role_id}`}
                          >
                            <DiscordIconSvg className="h-2.5 w-2.5 text-[#5865F2]" />
                            <span className="truncate max-w-[90px]">{tag.discord_role_name || "Discord"}</span>
                          </Badge>
                        )}
                        {!tag.is_active && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-rose-500/30 text-rose-400 bg-rose-500/10 font-bold">
                            Inativa
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* TOGGLE INTERATIVO DE TAG DE SISTEMA */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/35 border border-border/60 text-xs mt-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className={cn("h-3.5 w-3.5 shrink-0 transition-colors", tag.is_system ? "text-amber-400" : "text-muted-foreground")} />
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold block truncate text-foreground">
                            {tag.is_system ? "Tag de Sistema" : "Tag Interna / Regras"}
                          </span>
                          <span className="text-[9.5px] text-muted-foreground block truncate">
                            {tag.is_system ? "Visível publicamente no perfil" : "Privada para regras e permissões"}
                          </span>
                        </div>
                      </div>
                      <Switch
                        checked={Boolean(tag.is_system)}
                        disabled={toggleSystemTagMutation.isPending || !canEditTag}
                        onCheckedChange={(checked) => {
                          if (!canEditTag) {
                            toast.error("Você não possui permissão para alterar configurações de tags.");
                            return;
                          }
                          void toggleSystemTagMutation.mutateAsync({ tagId: tag.id, isSystem: checked });
                        }}
                        className="data-[state=checked]:bg-amber-500 scale-75 cursor-pointer shrink-0"
                        title={tag.is_system ? "Desativar Tag de Sistema" : "Ativar Tag de Sistema"}
                      />
                    </div>

                    {tag.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {tag.description}
                      </p>
                    )}

                    {/* BADGES DE REGRAS ATIVAS */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {isBlocked ? (
                        <Badge className="text-[10px] py-0 px-2 font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 gap-1">
                          <ShieldAlert className="h-3 w-3" />
                          <span>Bloqueio Total</span>
                        </Badge>
                      ) : (
                        <>
                          {tag.rules?.block_login && (
                            <Badge className="text-[10px] py-0 px-2 font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 gap-1">
                              <Lock className="h-3 w-3" />
                              <span>Bloqueio Login</span>
                            </Badge>
                          )}
                          {tag.rules?.block_escalas && (
                            <Badge className="text-[10px] py-0 px-2 font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              <span>Bloqueio Escalas</span>
                            </Badge>
                          )}
                          {tag.rules?.block_sales && (
                            <Badge className="text-[10px] py-0 px-2 font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              <span>Bloqueio Vendas</span>
                            </Badge>
                          )}
                          {tag.rules?.block_movements && (
                            <Badge className="text-[10px] py-0 px-2 font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              <span>Bloqueio Baús</span>
                            </Badge>
                          )}
                          {tag.rules?.block_productions && (
                            <Badge className="text-[10px] py-0 px-2 font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              <span>Bloqueio Produções</span>
                            </Badge>
                          )}
                          {tag.rules?.block_cash_fund && (
                            <Badge className="text-[10px] py-0 px-2 font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 gap-1">
                              <ShieldAlert className="h-3 w-3" />
                              <span>Bloqueio Caixa</span>
                            </Badge>
                          )}
                        </>
                      )}
                      {canEscalas && !tag.rules?.block_escalas && !isBlocked && (
                        <Badge className="text-[10px] py-0 px-2 font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 gap-1">
                          <Swords className="h-3 w-3" />
                          <span>Escalas</span>
                        </Badge>
                      )}
                      {canSell && !tag.rules?.block_sales && !isBlocked && (
                        <Badge className="text-[10px] py-0 px-2 font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          <span>Vendas</span>
                        </Badge>
                      )}
                      {tag.rules?.max_discount_pct !== undefined && !tag.rules?.block_sales && !isBlocked && (
                        <Badge className="text-[10px] py-0 px-2 font-medium bg-sky-500/15 text-sky-400 border border-sky-500/30 gap-1 font-mono">
                          <Percent className="h-3 w-3" />
                          <span>Max {tag.rules.max_discount_pct}%</span>
                        </Badge>
                      )}
                      {canProduce && !tag.rules?.block_productions && !isBlocked && (
                        <Badge className="text-[10px] py-0 px-2 font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 gap-1">
                          <Factory className="h-3 w-3" />
                          <span>Produção</span>
                        </Badge>
                      )}
                      {canRaw && !tag.rules?.block_productions && !isBlocked && (
                        <Badge className="text-[10px] py-0 px-2 font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30 gap-1">
                          <Layers className="h-3 w-3" />
                          <span>Insumos</span>
                        </Badge>
                      )}
                      {canWarehouse && !tag.rules?.block_productions && !isBlocked && (
                        <Badge className="text-[10px] py-0 px-2 font-medium bg-teal-500/15 text-teal-400 border border-teal-500/30 gap-1">
                          <Warehouse className="h-3 w-3" />
                          <span>Armazém</span>
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/25 border border-border/40">
                        <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <Users className="h-3.5 w-3.5 text-sky-400" />
                          <span>Membros:</span>
                        </span>
                        <span className="font-extrabold text-foreground font-mono text-xs">
                          {assignedCount}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/25 border border-border/40">
                        <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Permissões:</span>
                        </span>
                        <span className="font-extrabold text-foreground font-mono text-xs">
                          {permsCount}
                        </span>
                      </div>
                    </div>

                    {sampleAssignedMembers.length > 0 && (
                      <div
                        onClick={() => canAssignTag && handleOpenAssignMembersModal(tag)}
                        className="flex items-center justify-between p-2 rounded-xl bg-secondary/15 border border-border/40 hover:bg-secondary/30 transition-colors cursor-pointer group"
                        title="Clique para gerenciar membros vinculados"
                      >
                        <div className="flex items-center -space-x-2 overflow-hidden py-0.5">
                          {sampleAssignedMembers.map((m) => (
                            <Avatar key={m.id || m.user_id} className="h-6 w-6 border-2 border-background ring-1 ring-border/50 text-[10px] font-bold">
                              <AvatarImage src={m.avatar_url || m.foto || undefined} alt={m.nome} />
                              <AvatarFallback className="bg-primary/20 text-primary text-[9px]">
                                {(m.nickname || m.nome || "M").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {assignedCount > sampleAssignedMembers.length && (
                            <div className="h-6 w-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-[9px] font-extrabold border-2 border-background ring-1 ring-border/50">
                              +{assignedCount - sampleAssignedMembers.length}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1 font-medium">
                          <span>Ver todos</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      </div>
                    )}
                  </CardContent>
                </div>

                {(canManagePerms || canManageRules || canAssignTag || canEditTag || canDiscordConfig || canDeleteTag) && (
                  <div className="p-3 border-t border-border/50 bg-secondary/15 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(canManagePerms || canManageRules) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPermsModal(tag)}
                          className="h-8 text-xs font-semibold rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Permissões</span>
                        </Button>
                      )}
                      {canAssignTag && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAssignMembersModal(tag)}
                          className="h-8 text-xs font-medium rounded-xl gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Vincular Membros"
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Membros ({assignedCount})</span>
                        </Button>
                      )}
                      {canDiscordConfig && (
                        <Button
                          type="button"
                          variant={isDiscordLinked ? "outline" : "ghost"}
                          size="sm"
                          onClick={() => handleOpenDiscordModal(tag)}
                          className={cn(
                            "h-8 text-xs font-semibold rounded-xl gap-1.5 transition-all cursor-pointer",
                            isDiscordLinked
                              ? "border-[#5865F2]/40 text-indigo-300 bg-[#5865F2]/10 hover:bg-[#5865F2]/20"
                              : "text-muted-foreground hover:text-indigo-400 hover:bg-[#5865F2]/10"
                          )}
                          title={isDiscordLinked ? `Vinculado a: ${tag.discord_role_name || "Discord"}` : "Configurar Cargo no Discord"}
                        >
                          <DiscordIconSvg className="h-3.5 w-3.5 text-[#5865F2]" />
                          <span>{isDiscordLinked ? "Discord ✓" : "Discord"}</span>
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {canCreateTag && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicateTag(tag)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                          title="Duplicar / Clonar Tag"
                        >
                          <CopyPlus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canEditTag && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(tag)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Editar Tag"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDeleteTag && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const confirmMsg = tag.is_system
                              ? `ATENÇÃO: A tag "${tag.name}" está definida como Tag de Sistema.\n\nDeseja realmente excluí-la? Ela será desvinculada de todos os membros e removida do sistema.`
                              : `Deseja realmente apagar a tag "${tag.name}"? Ela será desvinculada de todos os membros.`;
                            if (confirm(confirmMsg)) {
                              void deleteTagMutation.mutateAsync(tag.id);
                            }
                          }}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          title="Excluir Tag"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CRIAR / EDITAR TAG */}
      <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto surface-card border-border/80 shadow-2xl p-4 sm:p-6">
          <DialogHeader className="pb-3 border-b border-border/60">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-primary" />
              <span>{editingTag ? "Editar Tag" : "Criar Nova Tag"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure nome, identificador único (slug), paleta de cores (sólida ou degradê) e ícone representativo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* PRÉ-VISUALIZAÇÃO EM TEMPO REAL */}
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <span>Pré-visualização em Tempo Real</span>
                </span>
                <Badge variant="outline" className="text-[10px] font-mono border-border/60 text-muted-foreground">
                  {formIsSystem ? "Tag Pública de Sistema" : "Tag de Regras Interna"}
                </Badge>
              </div>
              <div className="flex items-center flex-wrap gap-4 p-3 bg-background/80 rounded-xl border border-border/40 justify-center sm:justify-start">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-mono">md:</span>
                  <MemberTagBadge
                    tag={{
                      id: formId || "preview",
                      name: formName.trim() || "Prévia da Tag",
                      color: formColor,
                      icon: formIcon,
                      is_system: formIsSystem,
                      is_active: formIsActive,
                      permissions: [],
                      rules: {},
                      created_at: "",
                      updated_at: "",
                    }}
                    size="md"
                    showIcon
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-mono">sm:</span>
                  <MemberTagBadge
                    tag={{
                      id: formId || "preview",
                      name: formName.trim() || "Prévia da Tag",
                      color: formColor,
                      icon: formIcon,
                      is_system: formIsSystem,
                      is_active: formIsActive,
                      permissions: [],
                      rules: {},
                      created_at: "",
                      updated_at: "",
                    }}
                    size="sm"
                    showIcon
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-mono">xs:</span>
                  <MemberTagBadge
                    tag={{
                      id: formId || "preview",
                      name: formName.trim() || "Prévia da Tag",
                      color: formColor,
                      icon: formIcon,
                      is_system: formIsSystem,
                      is_active: formIsActive,
                      permissions: [],
                      rules: {},
                      created_at: "",
                      updated_at: "",
                    }}
                    size="xs"
                    showIcon
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nome da Tag</Label>
                <Input
                  value={formName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormName(newName);
                    if (!editingTag) {
                      const autoSlug = newName
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9_-]/g, "_")
                        .slice(0, 32);
                      setFormId(autoSlug);
                    }
                  }}
                  placeholder="Ex: Supervisor Operacional, Vendedor VIP"
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-primary" />
                    <span>Identificador Único (Slug)</span>
                  </Label>
                  {editingTag && (
                    <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-300 bg-amber-500/10">
                      Edição Habilitada
                    </Badge>
                  )}
                </div>
                <Input
                  value={formId}
                  onChange={(e) => setFormId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "_"))}
                  placeholder="Ex: supervisor_operacional"
                  className="rounded-xl h-9 text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {editingTag
                    ? "Ao alterar o slug, os vínculos de todos os membros serão migrados automaticamente."
                    : "Identificador único usado nas regras e banco de dados (letras minúsculas, números, '_' ou '-')."}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descrição (Opcional)</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Explique o propósito ou responsabilidades desta tag..."
                className="rounded-xl text-xs resize-none"
                rows={2}
              />
            </div>

            {/* SELEÇÃO DE COR E DEGRADÊ */}
            <div className="space-y-2 p-3 rounded-2xl bg-secondary/20 border border-border/60">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-primary" />
                  <span>Estilo Visual & Cor da Tag</span>
                </Label>
                <div className="flex items-center gap-1 bg-secondary/50 p-0.5 rounded-lg border border-border/50">
                  <button
                    type="button"
                    onClick={() => setColorMode("solid")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                      colorMode === "solid"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Cores Sólidas ({SOLID_PALETTES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode("gradient")}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                      colorMode === "gradient"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Degradê Premium ({GRADIENT_PALETTES.length})
                  </button>
                </div>
              </div>

              {colorMode === "solid" ? (
                <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-13 gap-1.5 p-2 rounded-xl bg-background/50 border border-border/60 max-h-32 overflow-y-auto">
                  {SOLID_PALETTES.map((p) => {
                    const isSelected = formColor.toLowerCase() === p.hex.toLowerCase();
                    return (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setFormColor(p.hex)}
                        className={cn(
                          "h-7 w-7 rounded-lg transition-all border flex items-center justify-center cursor-pointer shadow-2xs shrink-0 mx-auto",
                          isSelected
                            ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background border-white"
                            : "hover:scale-105 border-border/40 hover:border-foreground/40"
                        )}
                        style={{ backgroundColor: p.hex }}
                        title={p.label}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 rounded-xl bg-background/50 border border-border/60 max-h-36 overflow-y-auto">
                  {GRADIENT_PALETTES.map((g) => {
                    const isSelected = formColor === g.gradient;
                    return (
                      <button
                        key={g.label}
                        type="button"
                        onClick={() => setFormColor(g.gradient)}
                        className={cn(
                          "h-8 rounded-lg transition-all border flex items-center justify-between px-2 text-[10px] font-bold cursor-pointer text-white shadow-2xs relative overflow-hidden",
                          isSelected
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-white scale-[1.02]"
                            : "hover:scale-[1.02] border-white/20 hover:border-white/40"
                        )}
                        style={{ background: g.gradient }}
                        title={g.label}
                      >
                        <span className="truncate drop-shadow-md text-[9.5px]">{g.label}</span>
                        {isSelected && <Check className="h-3 w-3 drop-shadow-md shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Input customizado de cor ou gradiente */}
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="color"
                  value={formColor.startsWith("#") ? formColor : "#10b981"}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="h-7 w-9 p-0.5 rounded cursor-pointer border border-border/60 shrink-0"
                  title="Seletor de cor nativo"
                />
                <div className="flex-1 relative">
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    placeholder="Hex (#10b981) ou linear-gradient(...)"
                    className="h-7 text-xs font-mono rounded-xl bg-background/60"
                  />
                </div>
              </div>
            </div>

            {/* SELEÇÃO DE ÍCONE */}
            <div className="space-y-2 p-3 rounded-2xl bg-secondary/20 border border-border/60">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-xs font-semibold">Ícone da Tag ({filteredIconsList.length})</Label>
                <div className="relative w-44">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Buscar ícone..."
                    className="h-7 pl-7 pr-6 text-[11px] rounded-lg bg-background/60"
                  />
                  {iconSearch && (
                    <button
                      type="button"
                      onClick={() => setIconSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Categorias de Ícones */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedIconCategory("all")}
                  className={cn(
                    "px-2 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors border cursor-pointer",
                    selectedIconCategory === "all"
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-secondary/40 text-muted-foreground border-border/40 hover:text-foreground"
                  )}
                >
                  Todos ({ALL_AVAILABLE_ICONS.length})
                </button>
                {ICON_CATEGORIES.map((cat) => (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => setSelectedIconCategory(cat.category)}
                    className={cn(
                      "px-2 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors border cursor-pointer",
                      selectedIconCategory === cat.category
                        ? "bg-primary text-primary-foreground border-primary font-bold"
                        : "bg-secondary/40 text-muted-foreground border-border/40 hover:text-foreground"
                    )}
                  >
                    {cat.category.split("&")[0].trim()}
                  </button>
                ))}
              </div>

              {/* Grid de Ícones */}
              <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-12 gap-1.5 max-h-36 overflow-y-auto p-1.5 border rounded-xl bg-background/50 border-border/60">
                {filteredIconsList.map(({ key: iconKey, label }) => {
                  const IconComp = resolveTagIcon(iconKey);
                  const isSelected = formIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setFormIcon(iconKey)}
                      className={cn(
                        "p-2 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer relative group",
                        isSelected
                          ? "border-primary bg-primary/20 text-primary shadow-xs ring-1 ring-primary"
                          : "border-border/40 hover:bg-secondary/60 text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                      title={`${iconKey} - ${label}`}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BLOQUEIOS AUTOMÁTICOS & RESTRIÇÕES OPERACIONAIS */}
            <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span>Bloquear Automaticamente (Segurança & Disciplina)</span>
                </Label>
                <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                  Restrições
                </Badge>
              </div>
              <p className="text-[11px] text-rose-300/70">
                Se ativado, qualquer integrante que possuir esta tag terá suas ações bloqueadas imediatamente pelo sistema.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* BLOQUEIO TOTAL */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-background/60 border border-rose-500/40">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-[11px] font-bold text-rose-300 block">Bloqueio Total Operacional</span>
                    <span className="text-[10px] text-muted-foreground">Impede qualquer modificação</span>
                  </div>
                  <Switch
                    checked={Boolean(formRules.is_blocked || formRules.block_operations)}
                    onCheckedChange={(val) =>
                      setFormRules((prev) => ({ ...prev, is_blocked: val, block_operations: val }))
                    }
                  />
                </div>

                {/* BLOQUEAR ACESSO À PLATAFORMA (CHAVE MESTRA) */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-[11px] font-bold text-rose-400 block">Bloquear Acesso à Plataforma</span>
                    <span className="text-[10px] text-muted-foreground">Chave mestra: trava 100% dos menus, páginas e abas</span>
                  </div>
                  <Switch
                    checked={Boolean(formRules.block_login)}
                    onCheckedChange={(val) =>
                      setFormRules((prev) => ({ ...prev, block_login: val }))
                    }
                  />
                </div>

                {/* BLOQUEAR VENDAS */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-background/60 border border-border/70">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-[11px] font-semibold text-foreground block">Bloquear Balcão de Vendas</span>
                    <span className="text-[10px] text-muted-foreground">Impede lançar ordens de venda</span>
                  </div>
                  <Switch
                    checked={Boolean(formRules.block_sales)}
                    onCheckedChange={(val) =>
                      setFormRules((prev) => ({ ...prev, block_sales: val }))
                    }
                  />
                </div>

                {/* BLOQUEAR BAÚS */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-background/60 border border-border/70">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-[11px] font-semibold text-foreground block">Bloquear Retiradas / Baús</span>
                    <span className="text-[10px] text-muted-foreground">Impede retiradas nos baús</span>
                  </div>
                  <Switch
                    checked={Boolean(formRules.block_movements)}
                    onCheckedChange={(val) =>
                      setFormRules((prev) => ({ ...prev, block_movements: val }))
                    }
                  />
                </div>

                {/* BLOQUEAR PRODUÇÕES */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-background/60 border border-border/70">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-[11px] font-semibold text-foreground block">Bloquear Produção & Armazém</span>
                    <span className="text-[10px] text-muted-foreground">Impede ordens e fabricação</span>
                  </div>
                  <Switch
                    checked={Boolean(formRules.block_productions)}
                    onCheckedChange={(val) =>
                      setFormRules((prev) => ({ ...prev, block_productions: val }))
                    }
                  />
                </div>

                {/* BLOQUEAR ESCALAS */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-background/60 border border-border/70">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-[11px] font-semibold text-foreground block">Bloquear Escalas de Ação</span>
                    <span className="text-[10px] text-muted-foreground">Impede participar ou gerenciar escalas</span>
                  </div>
                  <Switch
                    checked={Boolean(formRules.block_escalas)}
                    onCheckedChange={(val) =>
                      setFormRules((prev) => ({ ...prev, block_escalas: val }))
                    }
                  />
                </div>

                {/* BLOQUEAR CAIXA */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-background/60 border border-border/70">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-[11px] font-semibold text-foreground block">Bloquear Fundo de Caixa</span>
                    <span className="text-[10px] text-muted-foreground">Impede saques e depósitos</span>
                  </div>
                  <Switch
                    checked={Boolean(formRules.block_cash_fund)}
                    onCheckedChange={(val) =>
                      setFormRules((prev) => ({ ...prev, block_cash_fund: val }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* INTEGRAÇÃO COM DISCORD */}
            <div className="p-3.5 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                  <DiscordIconSvg className="h-4 w-4 text-[#5865F2]" />
                  <span>Integração com Discord (Sincronização de Cargos)</span>
                </Label>
                {formDiscordRoleId ? (
                  <Badge className="text-[10px] bg-[#5865F2] text-white font-bold gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Vinculado</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-[#5865F2]/40 text-indigo-300">
                    Não Vinculado
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-indigo-200/70">
                Vincule esta tag a um cargo do Discord para sincronizar automaticamente quando atribuir ou remover membros na plataforma.
              </p>

              {formDiscordRoleId ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-[#5865F2]/40">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-indigo-300 truncate">
                        {formDiscordRoleName || "Cargo Discord"}
                      </span>
                      {formDiscordRolePosition !== null && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 border-[#5865F2]/40 text-indigo-300 font-mono">
                          Pos #{formDiscordRolePosition}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      ID: {formDiscordRoleId}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (editingTag) {
                        handleOpenDiscordModal(editingTag);
                      } else {
                        toast.info("Crie a tag primeiro para abrir o painel avançado de cargos do Discord.");
                      }
                    }}
                    className="h-7 text-[11px] rounded-lg border-[#5865F2]/40 text-indigo-300 hover:bg-[#5865F2]/20"
                  >
                    Gerenciar
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-background/40 border border-dashed border-[#5865F2]/40">
                  <span className="text-[11px] text-muted-foreground">
                    Nenhum cargo Discord associado a esta tag.
                  </span>
                  {editingTag && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenDiscordModal(editingTag)}
                      className="h-7 text-[11px] rounded-lg gap-1.5 bg-[#5865F2] hover:bg-[#5865F2]/90 text-white font-bold"
                    >
                      <DiscordIconSvg className="h-3 w-3" />
                      <span>Configurar Discord</span>
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-[#5865F2]/20">
                <div className="space-y-0.5 pr-2">
                  <span className="text-[11px] font-semibold text-foreground block">
                    Sincronização Automática
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Ao atribuir/remover tag na plataforma, sincroniza cargo no Discord
                  </span>
                </div>
                <Switch
                  checked={formDiscordSyncEnabled}
                  onCheckedChange={setFormDiscordSyncEnabled}
                />
              </div>
            </div>

            {/* STATUS E SISTEMA */}
            <div className="pt-2 flex items-center justify-between border-t border-border/60">
              <div className="flex items-center gap-2">
                <Switch
                  id="form-active"
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
                <Label htmlFor="form-active" className="text-xs cursor-pointer font-medium">
                  Tag Ativa no Sistema
                </Label>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="form-system" className="text-xs cursor-pointer font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      Tag de Sistema (Exibir Vinculada ao Membro)
                    </Label>
                    <p className="text-[11px] text-amber-200/70 leading-relaxed">
                      Quando ativada, a tag aparece visualmente vinculada ao membro em toda a plataforma (Hierarquia, Topbar, Perfil e Listas de Membros). Se desativada, a tag funciona exclusivamente para concessão de permissões e regras operacionais.
                    </p>
                  </div>
                  <Switch
                    id="form-system"
                    checked={formIsSystem}
                    onCheckedChange={setFormIsSystem}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTagModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveTagForm}
              disabled={saveTagMutation.isPending || (editingTag ? !canEditTag : !canCreateTag)}
              className="text-xs rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saveTagMutation.isPending ? "Salvando..." : editingTag ? "Salvar Alterações" : "Criar Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: VINCULAR MEMBROS À TAG (COM AUTO-SALVAMENTO E VINCULADOS NO TOPO) */}
      <Dialog open={Boolean(tagForMembers)} onOpenChange={(open) => !open && setTagForMembers(null)}>
        <DialogContent className="sm:max-w-xl surface-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-400" />
                <span>Vincular Membros à Tag</span>
              </div>
              {tagForMembers && (
                <MemberTagBadge tag={tagForMembers} size="sm" showIcon />
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Marque ou desmarque os integrantes para vincular ou desvincular em tempo real com salvamento automático.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* CHIPS DE MEMBROS VINCULADOS COM 1-CLIQUE PARA REMOVER */}
            {selectedMemberIds.size > 0 && (
              <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Membros Vinculados ({selectedMemberIds.size})</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllFilteredMembers}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Desvincular todos
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {members
                    .filter((m) => {
                      const memId = m.user_id || m.id || "";
                      return (
                        (memId && selectedMemberIds.has(memId)) ||
                        (m.user_id && selectedMemberIds.has(m.user_id)) ||
                        (m.id && selectedMemberIds.has(m.id))
                      );
                    })
                    .map((m) => {
                      const isSaving =
                        memberAssignSavingId === m.user_id || (m.id && memberAssignSavingId === m.id);
                      return (
                        <span
                          key={m.user_id || m.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-background/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium shadow-2xs group"
                        >
                          <Avatar className="h-4 w-4 shrink-0">
                            <AvatarImage src={m.avatar_url || ""} />
                            <AvatarFallback className="text-[8px]">
                              {(m.nickname || m.nome || "M").slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="max-w-[110px] truncate">{m.nickname || m.nome}</span>
                          <button
                            type="button"
                            disabled={Boolean(isSaving)}
                            onClick={() => handleToggleMember(m)}
                            className="p-0.5 rounded hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 cursor-pointer disabled:opacity-50"
                            title="Remover vínculo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={memberAssignSearch}
                  onChange={(e) => setMemberAssignSearch(e.target.value)}
                  placeholder="Filtrar membro..."
                  className="pl-8 h-8 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={memberAssignFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMemberAssignFilter("all")}
                    className="h-7 text-[10px] px-2 rounded-lg"
                  >
                    Todos ({members.length})
                  </Button>
                  <Button
                    type="button"
                    variant={memberAssignFilter === "assigned" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMemberAssignFilter("assigned")}
                    className="h-7 text-[10px] px-2 rounded-lg"
                  >
                    Vinculados ({selectedMemberIds.size})
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAllFilteredMembers}
                    className="h-7 text-[10px] px-2 rounded-lg text-primary hover:bg-primary/10"
                    title="Vincular todos os membros filtrados"
                  >
                    Marcar Todos
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFilteredMembers}
                    className="h-7 text-[10px] px-2 rounded-lg text-rose-400 hover:bg-rose-500/10"
                    title="Desvincular todos os membros filtrados"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </div>

            {/* FILTRO RÁPIDO DE CARGO / PATENTE */}
            {availableMemberRanks.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                <span className="text-[10px] text-muted-foreground shrink-0 font-medium mr-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  <span>Patente:</span>
                </span>
                <Button
                  type="button"
                  variant={memberAssignRankFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMemberAssignRankFilter("all")}
                  className="h-6 text-[10px] px-2 rounded-md shrink-0"
                >
                  Todas
                </Button>
                {availableMemberRanks.map((rank) => (
                  <Button
                    key={rank}
                    type="button"
                    variant={memberAssignRankFilter === rank ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMemberAssignRankFilter(rank)}
                    className="h-6 text-[10px] px-2 rounded-md shrink-0"
                  >
                    {rank}
                  </Button>
                ))}
              </div>
            )}

            <div className="border border-border/70 rounded-2xl max-h-72 overflow-y-auto divide-y divide-border/40 bg-background/40">
              {filteredMembersForAssign.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  Nenhum integrante encontrado.
                </div>
              ) : (
                filteredMembersForAssign.map((m) => {
                  const memKey = m.user_id || m.id || "";
                  const isChecked = (m.user_id && selectedMemberIds.has(m.user_id)) || (m.id && selectedMemberIds.has(m.id));
                  const isSavingThisMember = memberAssignSavingId === m.user_id || (m.id && memberAssignSavingId === m.id);

                  return (
                    <div
                      key={memKey}
                      onClick={() => handleToggleMember(m)}
                      className={cn(
                        "p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors select-none",
                        isChecked ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-secondary/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Checkbox
                          checked={Boolean(isChecked)}
                          onCheckedChange={() => handleToggleMember(m)}
                          className="rounded pointer-events-none"
                        />
                        <Avatar className="h-7 w-7 border border-border/50 shrink-0">
                          <AvatarImage src={m.avatar_url || ""} />
                          <AvatarFallback className="text-[10px] font-bold">
                            {(m?.nickname || m?.nome || "MB").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-xs leading-none truncate">
                            {m.nickname ? `${m.nickname} (${m.nome})` : m.nome}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {m.game_id && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                ID: #{m.game_id}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {m.nivel || "Membro"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSavingThisMember ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : isChecked ? (
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1">
                            <Check className="h-3 w-3" />
                            <span>Vinculado</span>
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-3 text-xs w-full justify-between">
              <span className="text-muted-foreground text-[11px]">
                Integrantes vinculados: <strong className="text-foreground font-mono font-bold">{selectedMemberIds.size}</strong> de {members.length}
              </span>

              {/* Status de salvamento em tempo real */}
              <div className="flex items-center gap-1.5">
                {memberAssignSavingId || setTagMembersMutation.isPending || toggleAssignmentMutation.isPending ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-primary font-bold animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Salvando alterações...</span>
                  </span>
                ) : memberAssignAutoSaved ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Salvo automaticamente</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-sky-400" />
                    <span>Sincronização em tempo real</span>
                  </span>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: PERMISSÕES & REGRAS GRANULARES (EXPANDIDO & AUTO-SALVAMENTO) */}
      <Dialog open={Boolean(tagForPerms)} onOpenChange={(open) => !open && setTagForPerms(null)}>
        <DialogContent className="max-w-5xl surface-card border-border/80 shadow-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {/* TOPO DO MODAL */}
          <div className="p-4 sm:p-5 border-b border-border/60 bg-secondary/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {tagForPerms && (
                  <MemberTagBadge
                    tag={tagForPerms}
                    size="md"
                    showIcon
                    className="shadow-md font-bold text-sm"
                  />
                )}
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2 flex-wrap">
                    <span>Configuração de Permissões & Regras</span>
                    {isDevMember ? (
                      <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary bg-primary/10 gap-1 font-semibold">
                        <Code2 className="h-3 w-3" />
                        <span>Acesso Dev: Todas as permissões visíveis</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-mono border-muted-foreground/30 text-muted-foreground bg-secondary/30 gap-1 font-medium">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" />
                        <span>Módulos Operacionais</span>
                      </Badge>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isDevMember
                      ? "As permissões são somadas às patentes e ativas em tempo real no sistema (incluindo módulos de CEO, Gestão e Plataforma)."
                      : "As permissões operacionais são somadas às patentes e ativas em tempo real no sistema."}
                  </p>
                </div>
              </div>

              {/* STATUS DE AUTO-SALVAMENTO EM TEMPO REAL */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                {autoSaveStatus === "saving" && (
                  <Badge variant="outline" className="text-xs py-1 px-3 bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1.5 animate-pulse font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Salvando alterações...</span>
                  </Badge>
                )}
                {autoSaveStatus === "saved" && (
                  <Badge variant="outline" className="text-xs py-1 px-3 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Salvo automaticamente</span>
                  </Badge>
                )}
                {autoSaveStatus === "idle" && (
                  <Badge variant="outline" className="text-xs py-1 px-3 bg-primary/5 text-muted-foreground border-primary/20 gap-1.5 font-normal">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    <span>Auto-salvamento ativo</span>
                  </Badge>
                )}
                {autoSaveStatus === "error" && (
                  <Badge variant="outline" className="text-xs py-1 px-3 bg-rose-500/10 text-rose-400 border-rose-500/30 gap-1.5 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Falha ao salvar</span>
                  </Badge>
                )}
              </div>
            </div>

            {/* SELETOR DE SUB-ABAS */}
            <div className="mt-4 flex items-center gap-2">
              {canManagePerms && (
                <Button
                  type="button"
                  variant={permSubTab === "permissions" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPermSubTab("permissions")}
                  className="h-8 text-xs rounded-xl gap-2 font-bold"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>
                    Permissões de Módulos (
                    {isDevMember
                      ? activePerms.length
                      : activePerms.filter((p) => visiblePlatformPermissions.includes(p)).length}{" "}
                    ativas)
                  </span>
                </Button>
              )}
              {canManageRules && (
                <Button
                  type="button"
                  variant={permSubTab === "rules" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPermSubTab("rules")}
                  className="h-8 text-xs rounded-xl gap-2 font-bold"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Regras Operacionais & Limitações</span>
                </Button>
              )}
            </div>
          </div>

          {/* CORPO DO MODAL */}
          <div ref={permModalBodyRef} onScroll={handleModalScroll} className="flex-1 overflow-y-auto p-4 sm:p-5 pb-24">
            {permSubTab === "permissions" && (
              <div className="space-y-6">
                {!canManagePerms && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300 font-medium text-xs">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>Modo Somente Leitura: Você possui permissão para visualizar as permissões da tag, mas não para alterá-las.</span>
                  </div>
                )}
                {/* BARRA DE PRESETS E BUSCA */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-secondary/20 border border-border/60">
                  <div className="relative w-full lg:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                      placeholder="Filtrar por nome, rota ou permissão..."
                      className="pl-8 h-8 text-xs rounded-xl bg-background/60"
                    />
                  </div>

                  {canManagePerms && (
                    <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 font-bold border-primary/30 text-primary hover:bg-primary/10 rounded-xl"
                        onClick={setAllPermissions}
                      >
                        Todas as Permissões
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 font-medium border-border/60 hover:bg-secondary rounded-xl gap-1"
                        onClick={setSalesPermissions}
                      >
                        <ShoppingCart className="h-3 w-3 text-emerald-400" />
                        <span>Vendas & Balcão</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 font-medium border-border/60 hover:bg-secondary rounded-xl gap-1"
                        onClick={setProductionPermissions}
                      >
                        <Factory className="h-3 w-3 text-amber-400" />
                        <span>Produção & Fábrica</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 font-medium border-border/60 hover:bg-secondary rounded-xl gap-1"
                        onClick={setOperationalPermissions}
                      >
                        <Zap className="h-3 w-3 text-amber-400" />
                        <span>Operacional Básico</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 font-medium border-border/60 hover:bg-secondary rounded-xl gap-1"
                        onClick={setWarehousePermissions}
                      >
                        <Warehouse className="h-3 w-3 text-emerald-400" />
                        <span>Logística & Armazém</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2.5 font-medium border-border/60 hover:bg-secondary rounded-xl"
                        onClick={setReadOnlyPermissions}
                      >
                        Apenas Leitura
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                        onClick={clearAllPermissions}
                      >
                        Limpar
                      </Button>
                    </div>
                  )}
                </div>

                {/* FILTRO DE CATEGORIAS DO MENU */}
                <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-border/40">
                  <Button
                    type="button"
                    variant={permCategoryFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPermCategoryFilter("all")}
                    className="h-7 text-xs rounded-xl"
                  >
                    Todas as Categorias
                  </Button>
                  {groupedPageCards.map((g) => (
                    <Button
                      key={g.category}
                      type="button"
                      variant={permCategoryFilter === g.category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPermCategoryFilter(g.category)}
                      className="h-7 text-xs rounded-xl"
                    >
                      {g.category} ({g.cards.length})
                    </Button>
                  ))}
                </div>

                {/* CARDS DE PERMISSÕES AGRUPADOS POR CATEGORIA */}
                <div className="space-y-8 pr-1">
                  {groupedPageCards
                    .filter((g) => permCategoryFilter === "all" || permCategoryFilter === g.category)
                    .map(({ category, cards }) => {
                      const filteredCards = cards.filter((card) => {
                        if (!permSearch) return true;
                        const q = permSearch.toLowerCase();
                        return (
                          card.title.toLowerCase().includes(q) ||
                          card.route.toLowerCase().includes(q) ||
                          card.description.toLowerCase().includes(q) ||
                          card.permissions.some(
                            (p) =>
                              p.label.toLowerCase().includes(q) ||
                              p.key.toLowerCase().includes(q) ||
                              p.description.toLowerCase().includes(q)
                          )
                        );
                      });

                      if (filteredCards.length === 0) return null;

                      const categoryPermKeys = filteredCards.flatMap((c) => c.permissions.map((p) => p.key));
                      const activeInCat = categoryPermKeys.filter((k) => activePerms.includes(k)).length;
                      const isAllCatActive = categoryPermKeys.length > 0 && activeInCat === categoryPermKeys.length;

                      return (
                        <div key={category} className="space-y-4">
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <FolderTree className="h-4 w-4 text-primary" />
                              <h3 className="text-xs uppercase tracking-widest font-bold text-foreground">
                                Categoria: <span className="text-primary font-extrabold">{category}</span>
                              </h3>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-mono",
                                  activeInCat > 0
                                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-bold"
                                    : "border-muted-foreground/30 text-muted-foreground bg-secondary/30"
                                )}
                              >
                                {activeInCat} / {categoryPermKeys.length} ativas
                              </Badge>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5 hidden sm:inline-flex">
                                {filteredCards.length} {filteredCards.length === 1 ? "módulo" : "módulos"}
                              </Badge>
                              {canManagePerms && categoryPermKeys.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleEntireCategory(filteredCards, true)}
                                    disabled={isAllCatActive}
                                    className="h-6.5 text-[10px] px-2 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-40"
                                    title="Marcar todas as permissões desta categoria"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    <span>Marcar Categoria</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleEntireCategory(filteredCards, false)}
                                    disabled={activeInCat === 0}
                                    className="h-6.5 text-[10px] px-2 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer disabled:opacity-40"
                                    title="Desmarcar todas as permissões desta categoria"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    <span>Desmarcar</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredCards.map((pageCard) => {
                              const PageIcon = pageCard.icon;
                              const cardPermKeys = pageCard.permissions.map((p) => p.key);
                              const allIn = cardPermKeys.every((k) => activePerms.includes(k));
                              const countIn = cardPermKeys.filter((k) => activePerms.includes(k)).length;

                              return (
                                <Card key={pageCard.id} className="surface-card flex flex-col justify-between border-border/70 shadow-sm">
                                  <div>
                                    <CardHeader className="pb-3 border-b border-border/50">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className={cn("p-2 rounded-lg border shrink-0", pageCard.color)}>
                                            <PageIcon className="h-4 w-4" />
                                          </div>
                                          <div className="min-w-0">
                                            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 truncate">
                                              <span>{pageCard.title}</span>
                                              <span className="text-[10px] text-muted-foreground font-mono font-normal truncate">
                                                ({pageCard.route})
                                              </span>
                                            </CardTitle>
                                            <CardDescription className="text-[0.7rem] line-clamp-1">
                                              {pageCard.description}
                                            </CardDescription>
                                          </div>
                                        </div>

                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          disabled={!canManagePerms}
                                          onClick={() => handleToggleCardPerms(pageCard)}
                                          className={cn(
                                            "h-7 text-[10px] font-bold px-2 rounded-lg border transition-all shrink-0 cursor-pointer",
                                            allIn
                                              ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                              : "border-primary/30 text-primary hover:bg-primary/10"
                                          )}
                                        >
                                          {allIn ? "Desmarcar Módulo" : "Marcar Módulo"} ({countIn}/{cardPermKeys.length})
                                        </Button>
                                      </div>
                                    </CardHeader>

                                    <CardContent className="pt-3 space-y-2">
                                      {pageCard.permissions.map((perm) => {
                                        const isChecked = activePerms.includes(perm.key);
                                        return (
                                          <div
                                            key={`${pageCard.id}-${perm.key}`}
                                            role="checkbox"
                                            aria-checked={isChecked}
                                            tabIndex={0}
                                            onClick={() => handleTogglePerm(perm.key)}
                                            onKeyDown={(e) => {
                                              if (e.key === " " || e.key === "Enter") {
                                                e.preventDefault();
                                                handleTogglePerm(perm.key);
                                              }
                                            }}
                                            className={cn(
                                              "p-2.5 rounded-xl border transition-all duration-150 flex items-start gap-3 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/50 hover:scale-[1.005] active:scale-[0.99]",
                                              isChecked
                                                ? "border-primary/50 bg-primary/10 shadow-sm shadow-primary/15 text-foreground"
                                                : "border-border/50 bg-background/40 hover:bg-secondary/30 hover:border-primary/30 text-muted-foreground",
                                              !canManagePerms && "pointer-events-none opacity-60"
                                            )}
                                          >
                                            <Checkbox
                                              id={`perm-${pageCard.id}-${perm.key}`}
                                              checked={isChecked}
                                              tabIndex={-1}
                                              className="mt-0.5 pointer-events-none rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5 justify-between">
                                                <p className={cn("text-xs font-semibold leading-tight", isChecked ? "text-foreground font-bold" : "text-foreground/90")}>
                                                  {perm.label}
                                                </p>
                                                {perm.badge && (
                                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/20 text-primary">
                                                    {perm.badge}
                                                  </Badge>
                                                )}
                                              </div>
                                              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                                {perm.description}
                                              </p>
                                              <span className="text-[9px] font-mono text-muted-foreground/60 mt-0.5 block">
                                                {perm.key}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </CardContent>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)}
                </div>
              </div>
            )}

            {/* ABA DE REGRAS OPERACIONAIS & LIMITAÇÕES (TOTALMENTE EXPANDIDA) */}
            {permSubTab === "rules" && (
              <div className="space-y-6 max-w-4xl py-2 text-xs">
                {!canManageRules && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300 font-medium text-xs">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>Modo Somente Leitura: Você possui permissão para visualizar as regras da tag, mas não para alterá-las.</span>
                  </div>
                )}
                <div className={cn("space-y-6", !canManageRules && "opacity-75 pointer-events-none")}>
                  {/* SEÇÃO 1: BLOQUEIOS & RESTRIÇÕES */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-400" />
                        <h3 className="text-xs uppercase tracking-wider font-bold text-rose-400">
                          1. Bloqueios & Restrições Operacionais (Segurança)
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateRuleValue({
                              ...activeRules,
                              is_blocked: true,
                              block_operations: true,
                              block_login: isDevMember ? true : Boolean(activeRules.block_login),
                              block_escalas: true,
                              block_sales: true,
                              block_movements: true,
                              block_productions: true,
                              block_cash_fund: true,
                            })
                          }
                          className="h-6 text-[10px] px-2 rounded-lg border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                        >
                          Ativar Todos
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateRuleValue({
                              ...activeRules,
                              is_blocked: false,
                              block_operations: false,
                              block_login: isDevMember ? false : Boolean(activeRules.block_login),
                              block_escalas: false,
                              block_sales: false,
                              block_movements: false,
                              block_productions: false,
                              block_cash_fund: false,
                            })
                          }
                          className="h-6 text-[10px] px-2 rounded-lg text-muted-foreground hover:bg-secondary"
                        >
                          Limpar Bloqueios
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* BLOQUEAR TUDO */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/30">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 text-rose-400">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Bloqueio Total de Operações</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Impede qualquer movimentação, venda, baú, aporte ou produção do integrante.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.is_blocked || activeRules.block_operations)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, is_blocked: val, block_operations: val })
                          }
                        />
                      </div>

                      {/* BLOQUEAR ACESSO À PLATAFORMA (CHAVE MESTRA - APENAS DEV) */}
                      {isDevMember && (
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/40">
                          <div className="space-y-0.5 pr-2">
                            <Label className="text-xs font-bold text-rose-400 flex items-center gap-1.5 flex-wrap">
                              <Lock className="h-3.5 w-3.5 text-rose-400" />
                              <span>Bloquear Acesso à Plataforma</span>
                              <Badge variant="outline" className="text-[9px] font-mono border-rose-500/50 text-rose-300 bg-rose-500/20 py-0 px-1">
                                Chave Mestra
                              </Badge>
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                              Bloqueia todo acesso à plataforma para quem possuir esta tag. Todos os menus, páginas e abas ficam travados e sem conseguir interagir.
                            </p>
                          </div>
                          <Switch
                            checked={Boolean(activeRules.block_login)}
                            onCheckedChange={(val) =>
                              handleUpdateRuleValue({ ...activeRules, block_login: val })
                            }
                          />
                        </div>
                      )}

                      {/* BLOQUEAR ESCALAS DE AÇÃO */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Swords className="h-3.5 w-3.5 text-rose-400" />
                            <span>Bloquear Escala de Ação</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Impede acesso, visualização, convocação e confirmação em escalas de ação da facção.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.block_escalas)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, block_escalas: val })
                          }
                        />
                      </div>

                      {/* BLOQUEAR VENDAS */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <ShoppingCart className="h-3.5 w-3.5 text-rose-400" />
                            <span>Bloquear Balcão de Vendas</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Impede lançamento de novas ordens e operações no módulo de Vendas.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.block_sales)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, block_sales: val })
                          }
                        />
                      </div>

                      {/* BLOQUEAR BAÚS */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-rose-400" />
                            <span>Bloquear Movimentações de Baú</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Bloqueia retiradas e transferências manuais de baús da facção.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.block_movements)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, block_movements: val })
                          }
                        />
                      </div>

                      {/* BLOQUEAR PRODUÇÕES */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Factory className="h-3.5 w-3.5 text-rose-400" />
                            <span>Bloquear Estação de Produção & Armazém</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Impede execução de novas receitas ou fabricação de produtos.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.block_productions)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, block_productions: val })
                          }
                        />
                      </div>

                      {/* BLOQUEAR FUNDO DE CAIXA */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Landmark className="h-3.5 w-3.5 text-rose-400" />
                            <span>Bloquear Fundo de Caixa</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Proíbe lançamentos de depósitos, retiradas e saques no caixa.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.block_cash_fund)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, block_cash_fund: val })
                          }
                        />
                      </div>
                    </div>
                  </div>

                {/* SEÇÃO 2: VENDAS & COMERCIAL */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                    <ShoppingCart className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                      2. Vendas, Comercial & Balcão
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* HABILITAR VENDAS */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Habilitar Vendas Comerciais</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Define a tag como vendedora oficial no catálogo e lançamentos.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_sell)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_sell: val })
                        }
                      />
                    </div>

                    {/* BALCÃO RÁPIDO DE VENDAS */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-amber-400" />
                          <span>Balcão Rápido de Vendas</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite checkout expresso com calculadora de troco e comissão direta.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.allow_sales_counter)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, allow_sales_counter: val })
                        }
                      />
                    </div>

                    {/* ESTORNO DE VENDAS */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                          <span>Permitir Estorno de Vendas</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite retificar ou estornar vendas já confirmadas no histórico.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_reverse_sales)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_reverse_sales: val })
                        }
                      />
                    </div>

                    {/* VER VENDAS GLOBAIS */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Visualizar Vendas Globais</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite consultar histórico de vendas de todos os membros.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_view_all_sales)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_view_all_sales: val })
                        }
                      />
                    </div>

                    {/* LIMITE DE DESCONTO */}
                    <div className="p-3.5 rounded-2xl bg-secondary/20 border border-border/60 md:col-span-2 space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Percent className="h-3.5 w-3.5 text-sky-400" />
                            <span>Desconto Máximo Permitido na Venda (%)</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Porcentagem máxima de abatimento que o membro com esta tag pode aplicar nos produtos.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={activeRules.max_discount_pct ?? 20}
                            onChange={(e) =>
                              handleDiscountChange(Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))
                            }
                            className="w-20 text-right font-mono font-bold text-emerald-400 rounded-xl"
                          />
                          <span className="text-xs font-mono font-bold text-muted-foreground">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 3: PRODUÇÕES, ARMAZÉM & MATÉRIAS-PRIMAS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                    <Factory className="h-4 w-4 text-amber-400" />
                    <h3 className="text-xs uppercase tracking-wider font-bold text-amber-400">
                      3. Produções, Armazém & Matérias-Primas
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* GESTÃO DE PRODUÇÃO */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Factory className="h-3.5 w-3.5 text-amber-400" />
                          <span>Habilitar Estação de Produção</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite fabricar receitas e produzir lotes de itens na oficina.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_manage_productions)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_manage_productions: val })
                        }
                      />
                    </div>

                    {/* GESTÃO DE MATÉRIAS-PRIMAS */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-orange-400" />
                          <span>Habilitar Matérias-Primas & Insumos</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite lançar entradas manuais e puxar matérias-primas de baús manuais.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_manage_raw_materials)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_manage_raw_materials: val })
                        }
                      />
                    </div>

                    {/* TRANSFERÊNCIAS DO ARMAZÉM */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Warehouse className="h-3.5 w-3.5 text-teal-400" />
                          <span>Transferências do Armazém</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite transferir produtos prontos para Baús ou Disponibilidade de Venda.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_transfer_warehouse)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_transfer_warehouse: val })
                        }
                      />
                    </div>

                    {/* AJUSTES DE SALDO NO ARMAZÉM */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Sliders className="h-3.5 w-3.5 text-teal-400" />
                          <span>Ajuste Manual de Saldo no Armazém</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite recalibração direta de quantidades no estoque central.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_adjust_warehouse_stock)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_adjust_warehouse_stock: val })
                        }
                      />
                    </div>

                    {/* CONFIGURAR RECEITAS DE PRODUÇÃO */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60 md:col-span-2">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Settings className="h-3.5 w-3.5 text-amber-400" />
                          <span>Gerenciar & Calibrar Receitas de Produção</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite criar novos produtos produzíveis, definir proporções de insumos e rendimentos gerados por receita.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_manage_production_recipes)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_manage_production_recipes: val })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 4: FUNDO DE CAIXA & FINANÇAS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                    <Landmark className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                      4. Fundo de Caixa & Finanças
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Coins className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Permitir Aportes & Depósitos</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite adicionar recursos ao caixa da organização.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_deposit_cash_fund)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_deposit_cash_fund: val })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-rose-400" />
                          <span>Permitir Saques & Retiradas</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite lançar saques no fundo de caixa com justificativa.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_withdraw_cash_fund)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_withdraw_cash_fund: val })
                        }
                      />
                    </div>

                    {isDevMember && (
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60 md:col-span-2">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Landmark className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Visualizar Relatórios Financeiros Consolidados</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Permite consultar balanços contábeis, faturamento de vendas e gráficos de evolução.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.can_view_financial_reports)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, can_view_financial_reports: val })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SEÇÃO 5: GESTÃO DE EQUIPE & RECRUTAMENTO (APENAS DEV) */}
                {isDevMember && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                      <Users className="h-4 w-4 text-sky-400" />
                      <h3 className="text-xs uppercase tracking-wider font-bold text-sky-400">
                        5. Gestão de Equipe & Liderança
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <UserPlus className="h-3.5 w-3.5 text-sky-400" />
                            <span>Recrutamento & Aprovação de Membros</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Permite aceitar ou recusar solicitações de entrada na facção.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.can_manage_members)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, can_manage_members: val })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                            <span>Visualizar Dados Confidenciais</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Exibe Game ID, notas disciplinares e contatos nos perfis.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.can_view_sensitive_data)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, can_view_sensitive_data: val })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                            <span>Atender Tickets de Suporte</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Permite visualizar e responder tickets abertos por qualquer membro.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.can_view_all_tickets)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, can_view_all_tickets: val })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Megaphone className="h-3.5 w-3.5 text-amber-400" />
                            <span>Publicar Avisos no Mural</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Permite emitir comunicados oficiais com fixação no mural geral.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.can_create_announcements)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, can_create_announcements: val })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SEÇÃO 6: ESCALA DE AÇÃO & OPERAÇÕES TÁTICAS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                    <Swords className="h-4 w-4 text-rose-400" />
                    <h3 className="text-xs uppercase tracking-wider font-bold text-rose-400">
                      6. Escala de Ação & Operações Táticas
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* GESTÃO DE ESCALAS (APENAS DEV) */}
                    {isDevMember && (
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Crown className="h-3.5 w-3.5 text-amber-400" />
                            <span>Habilitar Gestão de Escalas</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Permite criar novas ações, convocar integrantes, aprovar/reprovar participantes e realizar substituições.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.can_manage_escalas)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, can_manage_escalas: val })
                          }
                        />
                      </div>
                    )}

                    {/* VISUALIZAR ESCALAS (APENAS DEV) */}
                    {isDevMember && (
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                        <div className="space-y-0.5 pr-2">
                          <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-rose-400" />
                            <span>Visualizar Central de Escalas</span>
                          </Label>
                          <p className="text-[11px] text-muted-foreground">
                            Permite acessar a página de Escalas de Ação e consultar horários, locais e convocados.
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(activeRules.can_view_escalas)}
                          onCheckedChange={(val) =>
                            handleUpdateRuleValue({ ...activeRules, can_view_escalas: val })
                          }
                        />
                      </div>
                    )}

                    {/* CONFIRMAR PRESENÇA & PARTICIPAR */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60 md:col-span-2">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Confirmar Presença & Reivindicar Vaga</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Permite ao membro reagir como 'Vou', confirmar presença e garantir vagas titulares e reservas nas ações convocadas.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.can_participate_escalas)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, can_participate_escalas: val })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 7: RECURSOS EXPERIMENTAIS & OTIMIZAÇÕES */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                    <Sparkles className="h-4 w-4 text-sky-400" />
                    <h3 className="text-xs uppercase tracking-wider font-bold text-sky-400">
                      7. Recursos Experimentais & Otimizações
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                          <span>Recursos Beta & Experimentais</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Habilita módulos antecipados e simulações na interface.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.experimental_features)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, experimental_features: val })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="space-y-0.5 pr-2">
                        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-amber-400" />
                          <span>Resgate Automático de Metas</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Reivindica bônus e premiações de metas assim que concluídas.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(activeRules.auto_claim_rewards)}
                        onCheckedChange={(val) =>
                          handleUpdateRuleValue({ ...activeRules, auto_claim_rewards: val })
                        }
                      />
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>

          {/* BALÃO FLUTUANTE DE NAVEGAÇÃO E FILTROS RÁPIDOS (ESTILO DEV.PERMISSOES) */}
          {permSubTab === "permissions" && tagForPerms && (
            <div className="absolute z-[40] pointer-events-none bottom-16 sm:bottom-18 left-0 right-0 flex justify-center items-center px-2 sm:px-4 max-w-full">
              <div
                className={cn(
                  "surface-card floating-widget pointer-events-auto",
                  "flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl bg-card/95 backdrop-blur-2xl",
                  "shadow-[0_20px_50px_rgba(0,0,0,0.75)] ring-1 ring-border/60 max-w-[calc(100vw-2rem)] sm:max-w-fit",
                  "border transition-all duration-200 ease-out animate-in fade-in zoom-in-95"
                )}
                style={{
                  borderColor: `${tagForPerms.color || "#10b981"}70`,
                  boxShadow: `0 20px 50px rgba(0,0,0,0.75), 0 0 30px ${tagForPerms.color || "#10b981"}25`,
                }}
              >
                {/* Tag Badge & Contador de Permissões */}
                <div className="flex items-center gap-2 bg-secondary/40 px-2.5 py-1.5 rounded-xl border border-border/50 shrink-0">
                  <MemberTagBadge tag={tagForPerms} size="sm" showIcon className="font-bold text-xs" />
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono px-1.5 py-0 font-bold hidden sm:inline-flex"
                    style={{
                      borderColor: `${tagForPerms.color || "#10b981"}50`,
                      color: tagForPerms.color || "#10b981",
                      backgroundColor: `${tagForPerms.color || "#10b981"}15`,
                    }}
                  >
                    {isDevMember
                      ? activePerms.length
                      : activePerms.filter((p) => visiblePlatformPermissions.includes(p)).length}{" "}
                    ativas
                  </Badge>
                </div>

                {/* Divisor vertical */}
                <div className="h-6 w-px bg-border/60 shrink-0" />

                {/* Filtro de Categorias no Balão Flutuante */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className={cn(
                        "h-8 sm:h-8.5 px-2.5 sm:px-3 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-secondary/80 cursor-pointer shadow-xs transition-all text-foreground shrink-0",
                        permCategoryFilter !== "all" && "border-primary/50 shadow-sm"
                      )}
                      style={
                        permCategoryFilter !== "all"
                          ? {
                              borderColor: `${tagForPerms.color || "#10b981"}70`,
                              backgroundColor: `${tagForPerms.color || "#10b981"}15`,
                              color: tagForPerms.color || "#10b981",
                            }
                          : undefined
                      }
                      title="Filtrar por categoria de permissões"
                    >
                      <Filter
                        className="h-3.5 w-3.5 shrink-0"
                        style={{
                          color: permCategoryFilter !== "all" ? tagForPerms.color || "#10b981" : undefined,
                        }}
                      />
                      <span className="max-w-[80px] sm:max-w-[130px] truncate text-left">
                        {permCategoryFilter === "all" ? "Categorias" : permCategoryFilter}
                      </span>
                      <ChevronUp className="h-3 w-3 opacity-60 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    align="center"
                    sideOffset={10}
                    className="w-56 max-h-[300px] overflow-y-auto z-[10000] p-1.5 rounded-xl border-border/80 shadow-2xl bg-card/95 backdrop-blur-xl"
                  >
                    <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                      Categorias de Módulos
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      onClick={() => setPermCategoryFilter("all")}
                      className={cn(
                        "text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5 flex items-center justify-between",
                        permCategoryFilter === "all" && "font-bold bg-secondary/80 text-foreground"
                      )}
                    >
                      <span>Todas as Categorias</span>
                      {permCategoryFilter === "all" && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </DropdownMenuItem>
                    {groupedPageCards.map((g) => {
                      const isSelected = permCategoryFilter === g.category;
                      return (
                        <DropdownMenuItem
                          key={`float-cat-${g.category}`}
                          onClick={() => setPermCategoryFilter(g.category)}
                          className={cn(
                            "text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5 flex items-center justify-between",
                            isSelected && "font-bold bg-secondary/80 text-foreground"
                          )}
                        >
                          <span className="truncate pr-2">{g.category}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({g.cards.length})
                            </span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Divisor vertical */}
                <div className="h-6 w-px bg-border/60 shrink-0" />

                {/* Presets Rápidos */}
                {canManagePerms && (
                  <div className="hidden md:flex items-center gap-1 bg-secondary/40 p-1 rounded-xl border border-border/50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-lg cursor-pointer"
                      onClick={setSalesPermissions}
                      title="Predefinição rápida: Vendas Comerciais"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Vendas
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 font-bold text-amber-400 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                      onClick={setProductionPermissions}
                      title="Predefinição rápida: Produção & Armazém"
                    >
                      <Factory className="h-3 w-3 mr-1" />
                      Produção
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                      onClick={clearAllPermissions}
                      title="Limpar permissões"
                    >
                      Limpar
                    </Button>
                  </div>
                )}

                {canManagePerms && <div className="hidden md:block h-6 w-px bg-border/60 shrink-0" />}

                {/* Botão de Rolagem: Ir para o Final / Ir para o Início */}
                {isModalAtTop ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={scrollToModalBottom}
                    className="h-8 sm:h-8.5 px-2.5 sm:px-3 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-secondary/80 cursor-pointer shadow-xs transition-all text-foreground hover:border-primary/50 shrink-0"
                    title="Ir para o final da lista de permissões"
                  >
                    <ChevronsDown className="h-3.5 w-3.5 text-primary animate-bounce shrink-0" />
                    <span className="hidden sm:inline">Ir para o final</span>
                    <span className="sm:hidden">Final</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={scrollToModalTop}
                    className="h-8 sm:h-8.5 px-2.5 sm:px-3 text-xs font-bold gap-1.5 rounded-xl border-border/80 hover:bg-secondary/80 cursor-pointer shadow-xs transition-all text-foreground hover:border-primary/50 shrink-0"
                    title="Voltar ao início da lista de permissões"
                  >
                    <ChevronsUp className="h-3.5 w-3.5 text-primary animate-bounce shrink-0" />
                    <span className="hidden sm:inline">Ir para o início</span>
                    <span className="sm:hidden">Início</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* RODAPÉ DO MODAL */}
          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t border-border/60 bg-secondary/15">
            <div className="flex items-center gap-2">
              {autoSaveStatus === "saving" && (
                <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Salvando automaticamente...</span>
                </span>
              )}
              {autoSaveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Todas as alterações foram salvas</span>
                </span>
              )}
              {autoSaveStatus === "idle" && (
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-amber-400/80" />
                  <span>Alterações em permissões e regras são salvas automaticamente</span>
                </span>
              )}
              {autoSaveStatus === "error" && (
                <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Erro ao salvar automaticamente</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                size="sm"
                onClick={() => setTagForPerms(null)}
                className="text-xs rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 px-5"
              >
                Concluído
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: INTEGRAÇÃO DISCORD DA TAG */}
      <Dialog
        open={Boolean(tagForDiscord)}
        onOpenChange={(open) => !open && setTagForDiscord(null)}
      >
        <DialogContent className="sm:max-w-3xl surface-card border-border/80 shadow-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          {/* HEADER DO MODAL */}
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 bg-secondary/15 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2]">
                  <DiscordIconSvg className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <span>Integração Discord da Tag</span>
                    {tagForDiscord && <MemberTagBadge tag={tagForDiscord} size="sm" showIcon />}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Vincule cargos do Discord, crie novos cargos automaticamente e gerencie a hierarquia do servidor.
                  </DialogDescription>
                </div>
              </div>

              {/* SELETOR DE SERVIDOR DO BOT */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0">
                <div className="flex items-center gap-1.5 bg-background/80 border border-border/60 px-2.5 py-1 rounded-xl">
                  <span className="text-[11px] font-semibold text-muted-foreground">Servidor:</span>
                  <select
                    value={selectedGuildId}
                    onChange={(e) => {
                      const gId = e.target.value;
                      setSelectedGuildId(gId);
                      void loadGuildRoles(gId);
                    }}
                    className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                  >
                    {discordGuilds.map((g) => (
                      <option key={g.id} value={g.id} className="bg-popover text-popover-foreground">
                        {g.name} ({g.memberCount || "?"} membros)
                      </option>
                    ))}
                    {!discordGuilds.some((g) => g.id === "1535505650308620400") && (
                      <option value="1535505650308620400" className="bg-popover text-popover-foreground">
                        Twin Wheel (Principal)
                      </option>
                    )}
                  </select>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void loadGuildRoles(selectedGuildId)}
                  disabled={loadingGuildRoles}
                  className="h-8 w-8 rounded-xl"
                  title="Recarregar cargos do Discord"
                >
                  <RefreshCcw className={cn("h-3.5 w-3.5", loadingGuildRoles && "animate-spin text-primary")} />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* CORPO DO MODAL COM TABS */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            <Tabs
              value={discordModalTab}
              onValueChange={(val: any) => setDiscordModalTab(val)}
              className="space-y-4"
            >
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-secondary/30 rounded-xl gap-1">
                <TabsTrigger
                  value="link"
                  className="text-xs py-1.5 rounded-lg data-[state=active]:bg-[#5865F2] data-[state=active]:text-white font-semibold flex items-center gap-1.5"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Vincular Cargo</span>
                  {guildRoles.length > 0 && (
                    <Badge variant="outline" className="text-[9px] py-0 px-1 ml-1 bg-black/20 border-white/20 text-inherit">
                      {guildRoles.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="create"
                  className="text-xs py-1.5 rounded-lg data-[state=active]:bg-[#5865F2] data-[state=active]:text-white font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Criar Novo Cargo</span>
                </TabsTrigger>
                <TabsTrigger
                  value="hierarchy"
                  className="text-xs py-1.5 rounded-lg data-[state=active]:bg-[#5865F2] data-[state=active]:text-white font-semibold flex items-center gap-1.5"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>Hierarquia Servidor</span>
                </TabsTrigger>
                <TabsTrigger
                  value="sync"
                  className="text-xs py-1.5 rounded-lg data-[state=active]:bg-[#5865F2] data-[state=active]:text-white font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Sincronização</span>
                </TabsTrigger>
              </TabsList>

              {/* ABA 1: VINCULAR CARGO EXISTENTE */}
              <TabsContent value="link" className="space-y-4 m-0">
                {/* STATUS DE VÍNCULO ATUAL */}
                {tagForDiscord?.discord_role_id ? (
                  <div className="p-3.5 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-indigo-200">Cargo Vinculado Atualmente:</span>
                        <Badge
                          className="text-xs font-bold px-2 py-0.5"
                          style={{
                            backgroundColor: tagForDiscord.color || "#5865F2",
                            color: "#fff",
                          }}
                        >
                          @{tagForDiscord.discord_role_name || tagForDiscord.discord_role_id}
                        </Badge>
                        {tagForDiscord.discord_role_position !== null && (
                          <Badge variant="outline" className="text-[10px] border-[#5865F2]/40 text-indigo-300 font-mono">
                            Posição #{tagForDiscord.discord_role_position}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        Role ID: {tagForDiscord.discord_role_id} • Guild ID: {tagForDiscord.discord_guild_id || selectedGuildId}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUnlinkDiscordRole}
                        disabled={!canDiscordLink}
                        className="text-xs rounded-xl h-8 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 gap-1.5"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        <span>Desvincular</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-secondary/30 border border-dashed border-border/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">Nenhum cargo Discord vinculado</p>
                      <p className="text-[11px] text-muted-foreground">
                        Selecione um cargo da lista abaixo para vincular ou crie um novo cargo na aba "Criar Novo Cargo".
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setDiscordModalTab("create")}
                      className="text-xs rounded-xl h-8 bg-[#5865F2] text-white hover:bg-[#5865F2]/90 font-bold shrink-0 gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Criar Novo</span>
                    </Button>
                  </div>
                )}

                {/* BUSCA DE CARGOS DO SERVIDOR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-semibold">Cargos Disponíveis no Servidor ({guildRoles.length})</Label>
                    <div className="relative w-48 sm:w-64">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={roleSearch}
                        onChange={(e) => setRoleSearch(e.target.value)}
                        placeholder="Filtrar cargos..."
                        className="pl-8 h-7 text-xs rounded-lg bg-background/50 border-border/60"
                      />
                    </div>
                  </div>

                  {loadingGuildRoles ? (
                    <div className="p-8 text-center text-muted-foreground space-y-2">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#5865F2]" />
                      <p>Carregando cargos do Discord...</p>
                    </div>
                  ) : guildRoles.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground border border-dashed rounded-xl bg-background/30">
                      Nenhum cargo encontrado no servidor selecionado.
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-1.5 border rounded-xl p-2 bg-background/40 border-border/60">
                      {guildRoles
                        .filter((r) => !roleSearch || r.name.toLowerCase().includes(roleSearch.toLowerCase()) || r.id.includes(roleSearch))
                        .map((role) => {
                          const isCurrent = tagForDiscord?.discord_role_id === role.id;
                          return (
                            <div
                              key={role.id}
                              className={cn(
                                "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                                isCurrent
                                  ? "bg-[#5865F2]/15 border-[#5865F2]/60 shadow-sm"
                                  : "bg-background/60 border-border/40 hover:bg-secondary/40"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <span
                                  className="h-3.5 w-3.5 rounded-full shrink-0 border border-white/20"
                                  style={{ backgroundColor: role.colorHex || "#99aab5" }}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-foreground text-xs truncate">
                                      {role.name}
                                    </span>
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono border-border/60 text-muted-foreground">
                                      Pos #{role.position}
                                    </Badge>
                                    {role.hoist && (
                                      <Badge variant="outline" className="text-[9px] py-0 px-1 border-indigo-500/30 text-indigo-300">
                                        Destacado
                                      </Badge>
                                    )}
                                    {role.managed && (
                                      <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/30 text-amber-300">
                                        Bot/Integrado
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                                    ID: {role.id}
                                  </p>
                                </div>
                              </div>

                              <div>
                                {isCurrent ? (
                                  <Badge className="bg-[#5865F2] text-white text-[10px] font-bold gap-1 py-1 px-2.5">
                                    <Check className="h-3 w-3" />
                                    <span>Vinculado</span>
                                  </Badge>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void handleLinkExistingRole(role)}
                                    disabled={!canDiscordLink}
                                    className="h-7 text-xs rounded-lg border-indigo-500/40 text-indigo-300 hover:bg-[#5865F2] hover:text-white"
                                  >
                                    Vincular
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ABA 2: CRIAR NOVO CARGO AUTOMATICAMENTE */}
              <TabsContent value="create" className="space-y-4 m-0">
                <div className="p-3.5 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 space-y-1.5">
                  <p className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#5865F2]" />
                    <span>Criação Instantânea no Discord</span>
                  </p>
                  <p className="text-[11px] text-indigo-200/70 leading-relaxed">
                    O sistema criará um novo cargo oficial diretamente no seu servidor Discord com as configurações abaixo e vinculará a tag instantaneamente.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nome do Cargo no Discord</Label>
                    <Input
                      value={createRoleName}
                      onChange={(e) => setCreateRoleName(e.target.value)}
                      placeholder="Ex: Tático • Operações"
                      className="h-9 text-xs rounded-xl bg-background/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Cor do Cargo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={createRoleColor}
                        onChange={(e) => setCreateRoleColor(e.target.value)}
                        className="h-9 w-12 p-0.5 rounded-xl cursor-pointer bg-background/60"
                      />
                      <Input
                        value={createRoleColor}
                        onChange={(e) => setCreateRoleColor(e.target.value)}
                        className="h-9 text-xs font-mono rounded-xl uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border/60">
                    <div className="space-y-0.5 pr-2">
                      <span className="text-xs font-semibold text-foreground block">Exibir Separadamente (Hoist)</span>
                      <span className="text-[10px] text-muted-foreground">Destaca integrantes com este cargo na lista online</span>
                    </div>
                    <Switch
                      checked={createRoleHoist}
                      onCheckedChange={setCreateRoleHoist}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border/60">
                    <div className="space-y-0.5 pr-2">
                      <span className="text-xs font-semibold text-foreground block">Permitir Menções (@mention)</span>
                      <span className="text-[10px] text-muted-foreground">Permite que membros mencionem este cargo</span>
                    </div>
                    <Switch
                      checked={createRoleMentionable}
                      onCheckedChange={setCreateRoleMentionable}
                    />
                  </div>
                </div>

                {/* POSIÇÃO HIERÁRQUICA DO NOVO CARGO */}
                <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <ArrowUpDown className="h-4 w-4 text-primary" />
                      <span>Posição Hierárquica no Discord</span>
                    </Label>
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                      Ordem de Precedência
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Escolha onde o novo cargo ficará posicionado em relação aos cargos existentes no servidor selecionado.
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={targetInsertMode === "below" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTargetInsertMode("below")}
                      className="h-8 text-xs rounded-xl"
                    >
                      Abaixo de Outro
                    </Button>
                    <Button
                      type="button"
                      variant={targetInsertMode === "above" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTargetInsertMode("above")}
                      className="h-8 text-xs rounded-xl"
                    >
                      Acima de Outro
                    </Button>
                    <Button
                      type="button"
                      variant={targetInsertMode === "exact" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTargetInsertMode("exact")}
                      className="h-8 text-xs rounded-xl"
                    >
                      Posição Exata (#)
                    </Button>
                  </div>

                  {targetInsertMode !== "exact" ? (
                    <div className="space-y-1.5 pt-1">
                      <Label className="text-xs text-muted-foreground">
                        {targetInsertMode === "below" ? "Posicionar Imediatamente Abaixo do Cargo:" : "Posicionar Imediatamente Acima do Cargo:"}
                      </Label>
                      <select
                        value={targetRelativeRoleId}
                        onChange={(e) => setTargetRelativeRoleId(e.target.value)}
                        className="w-full h-9 text-xs rounded-xl bg-background/80 border border-border/70 px-3 font-semibold focus:outline-none"
                      >
                        <option value="">Selecione um cargo de referência...</option>
                        {guildRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            #{r.position} — {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      <Label className="text-xs text-muted-foreground">Número da Posição Hierárquica (1 = logo acima de @everyone)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={guildRoles.length + 5}
                        value={createRolePosition}
                        onChange={(e) => setCreateRolePosition(parseInt(e.target.value, 10) || 1)}
                        className="h-9 text-xs rounded-xl bg-background/80"
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleCreateAndLinkDiscordRole}
                  disabled={isCreatingRole || !canDiscordCreateRole || !createRoleName.trim()}
                  className="w-full h-10 text-xs rounded-xl bg-[#5865F2] hover:bg-[#5865F2]/90 text-white font-bold gap-2 shadow-lg shadow-[#5865F2]/20"
                >
                  {isCreatingRole ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Criando cargo no Discord...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Criar Cargo no Discord e Vincular à Tag</span>
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* ABA 3: HIERARQUIA COMPLETA DO SERVIDOR */}
              <TabsContent value="hierarchy" className="space-y-3 m-0">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/60 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">Estrutura Hierárquica de Cargos</p>
                    <p className="text-[11px] text-muted-foreground">
                      Cargos com maior posição numérica têm precedência e exibição superior no Discord.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {guildRoles.length} Cargos
                  </Badge>
                </div>

                {loadingGuildRoles ? (
                  <div className="p-8 text-center text-muted-foreground space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#5865F2]" />
                    <p>Carregando hierarquia...</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-1.5 border rounded-xl p-2 bg-background/40 border-border/60">
                    {guildRoles.map((role) => {
                      const isLinkedToCurrentTag = tagForDiscord?.discord_role_id === role.id;
                      return (
                        <div
                          key={role.id}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                            isLinkedToCurrentTag
                              ? "bg-[#5865F2]/20 border-[#5865F2] ring-1 ring-[#5865F2] shadow-sm"
                              : "bg-background/60 border-border/40"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0.5 shrink-0 bg-background/80">
                              #{role.position}
                            </Badge>
                            <span
                              className="h-3.5 w-3.5 rounded-full shrink-0 border border-white/20"
                              style={{ backgroundColor: role.colorHex || "#99aab5" }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={cn("text-xs font-bold truncate", isLinkedToCurrentTag && "text-indigo-200")}>
                                  {role.name}
                                </span>
                                {isLinkedToCurrentTag && (
                                  <Badge className="bg-[#5865F2] text-white text-[9px] py-0 px-1.5 font-bold">
                                    Tag Atual
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] font-mono text-muted-foreground truncate">
                                ID: {role.id}
                              </p>
                            </div>
                          </div>

                          {isLinkedToCurrentTag && canDiscordEditPosition && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => void handleUpdatePosition(role.id, role.position + 1)}
                                disabled={isUpdatingPosition}
                                className="h-7 w-7 rounded-lg"
                                title="Subir Posição no Discord"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => void handleUpdatePosition(role.id, Math.max(1, role.position - 1))}
                                disabled={isUpdatingPosition || role.position <= 1}
                                className="h-7 w-7 rounded-lg"
                                title="Descer Posição no Discord"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* ABA 4: SINCRONIZAÇÃO DE MEMBROS */}
              <TabsContent value="sync" className="space-y-4 m-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Membros com esta Tag</span>
                    <p className="text-xl font-bold text-foreground">
                      {assignments.filter((a) => a.tag_id === tagForDiscord?.id).length}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Contas Discord Vinculadas</span>
                    <p className="text-xl font-bold text-emerald-400">
                      {
                        members.filter(
                          (m) =>
                            assignments.some((a) => a.tag_id === tagForDiscord?.id && (a.member_id === m.id || a.member_id === m.user_id)) &&
                            m.discord_id &&
                            m.discord_id.trim().length > 5
                        ).length
                      }
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border/60 space-y-1">
                    <span className="text-[11px] text-muted-foreground">Cargo no Discord</span>
                    <p className="text-sm font-bold text-indigo-300 truncate">
                      {tagForDiscord?.discord_role_name || "Nenhum cargo"}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">Sincronização em Lote de Membros</p>
                      <p className="text-[11px] text-muted-foreground">
                        Atribui automaticamente o cargo do Discord a todos os integrantes que já possuem esta tag no sistema.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleSyncMembersNow}
                    disabled={isSyncingAll || !canDiscordSync || !tagForDiscord?.discord_role_id}
                    className="w-full h-9 text-xs rounded-xl font-bold bg-[#5865F2] hover:bg-[#5865F2]/90 text-white gap-2 shadow-sm"
                  >
                    {isSyncingAll ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sincronizando com o Discord...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Sincronizar Todos os Membros Desta Tag Agora</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* RELATÓRIO DE SINCRONIZAÇÃO */}
                {syncReport && (
                  <div className="p-3.5 rounded-2xl bg-background/80 border border-border/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Resultado da Última Sincronização</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                        <span className="font-bold text-sm block">{syncReport.synced}</span>
                        <span className="text-[10px]">Sincronizados</span>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                        <span className="font-bold text-sm block">{syncReport.skippedNoDiscordId}</span>
                        <span className="text-[10px]">Sem Discord ID</span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                        <span className="font-bold text-sm block">{syncReport.failed}</span>
                        <span className="text-[10px]">Falhas</span>
                      </div>
                    </div>

                    {syncReport.errors.length > 0 && (
                      <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-[11px] text-rose-300 space-y-1">
                        <p className="font-bold">Avisos da API:</p>
                        {syncReport.errors.slice(0, 3).map((err, idx) => (
                          <p key={idx} className="font-mono text-[10px] truncate">• {err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* RODAPÉ DO MODAL */}
          <DialogFooter className="p-3 sm:p-4 border-t border-border/60 bg-secondary/15 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <DiscordIconSvg className="h-3.5 w-3.5 text-[#5865F2]" />
              <span>Twin Wheels Discord Bot Sync</span>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTagForDiscord(null)}
              className="text-xs rounded-xl"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REORDENAÇÃO COMPLETA DAS TAGS */}
      <Dialog open={isReorderModalOpen} onOpenChange={setIsReorderModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 border-b border-border/60 bg-secondary/20">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowUpDown className="h-5 w-5 text-primary" />
              <span>Ordenar e Reorganizar Tags</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed mt-1">
              A ordem das tags define o <strong>nível hierárquico</strong> no sistema. Membros com múltiplas tags terão seus cards na página de membros destacados com a tag de <strong>nível mais alto</strong> (mais próxima do topo • #1).
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {reorderList.map((tag, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === reorderList.length - 1;

              return (
                <div
                  key={tag.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border bg-card/80 transition-all gap-3",
                    isFirst ? "border-amber-500/40 bg-amber-500/5 shadow-xs" : "border-border/60 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "font-mono text-xs h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border",
                        isFirst
                          ? "bg-amber-500 text-black border-amber-400 font-extrabold shadow-xs"
                          : "bg-muted text-muted-foreground border-border/70 font-bold"
                      )}
                    >
                      {idx + 1}
                    </span>

                    <MemberTagBadge tag={tag} size="sm" showIcon className="shadow-xs shrink-0" />

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                        <span>{tag.name}</span>
                        {isFirst && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] py-0 px-1.5 font-bold gap-1">
                            <Crown className="h-2.5 w-2.5 text-amber-400" />
                            Nível Mais Alto
                          </Badge>
                        )}
                        {!tag.is_active && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-rose-500/30 text-rose-400 bg-rose-500/10">
                            Inativa
                          </Badge>
                        )}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground truncate">
                        @{tag.id}
                        {tag.description ? ` • ${tag.description}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isFirst}
                      onClick={() => {
                        if (isFirst) return;
                        const next = [...reorderList];
                        const [item] = next.splice(idx, 1);
                        next.unshift(item);
                        setReorderList(next);
                      }}
                      className="h-8 w-8 rounded-lg"
                      title="Mover para o topo absoluto"
                    >
                      <ChevronsUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isFirst}
                      onClick={() => {
                        if (isFirst) return;
                        const next = [...reorderList];
                        const temp = next[idx];
                        next[idx] = next[idx - 1];
                        next[idx - 1] = temp;
                        setReorderList(next);
                      }}
                      className="h-8 w-8 rounded-lg"
                      title="Subir uma posição"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isLast}
                      onClick={() => {
                        if (isLast) return;
                        const next = [...reorderList];
                        const temp = next[idx];
                        next[idx] = next[idx + 1];
                        next[idx + 1] = temp;
                        setReorderList(next);
                      }}
                      className="h-8 w-8 rounded-lg"
                      title="Descer uma posição"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isLast}
                      onClick={() => {
                        if (isLast) return;
                        const next = [...reorderList];
                        const [item] = next.splice(idx, 1);
                        next.push(item);
                        setReorderList(next);
                      }}
                      className="h-8 w-8 rounded-lg"
                      title="Mover para o final absoluto"
                    >
                      <ChevronsDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="p-3 sm:p-4 border-t border-border/60 bg-secondary/15 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Posicione as tags na hierarquia desejada e salve as alterações.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReorderModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSavingOrder}
                onClick={handleSaveReorderModal}
                className="text-xs font-bold rounded-xl gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSavingOrder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Salvar Nova Ordem</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
