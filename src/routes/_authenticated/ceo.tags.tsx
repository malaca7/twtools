import React, { useState, useMemo } from "react";
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
  ExternalLink,
  Link2,
  Unlink,
  RefreshCcw,
  CheckCircle,
  Hash,
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
import { ALL_PERMISSIONS, type Permission, LEVEL_LABEL, levelBadgeClass } from "@/lib/permissions";
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

const AVAILABLE_PALETTES = [
  { label: "Esmeralda", hex: "#10b981" },
  { label: "Azul Céu", hex: "#0ea5e9" },
  { label: "Índigo", hex: "#6366f1" },
  { label: "Violeta", hex: "#8b5cf6" },
  { label: "Rosa Choque", hex: "#ec4899" },
  { label: "Vermelho", hex: "#ef4444" },
  { label: "Âmbar", hex: "#f59e0b" },
  { label: "Ciano", hex: "#06b6d4" },
  { label: "Teal", hex: "#14b8a6" },
  { label: "Laranja", hex: "#f97316" },
];

const AVAILABLE_ICONS = [
  "Tag",
  "ShoppingCart",
  "ShieldAlert",
  "ShieldCheck",
  "Crown",
  "Star",
  "Award",
  "Flame",
  "Zap",
  "Sparkles",
  "BadgeCheck",
  "UserCheck",
  "Users",
  "Warehouse",
  "Factory",
  "Layers",
  "Coins",
  "DollarSign",
  "Code2",
  "Lock",
  "Settings",
];

export function CeoGerenciarTagsPage() {
  const { isDevUser, hasPermission } = useAuth();

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

  const { data: tags = [], isLoading: loadingTags, refetch: refetchTags } = useMemberTags();
  const { data: assignments = [], isLoading: loadingAssignments, refetch: refetchAssignments } = useMemberTagAssignments();
  const { data: members = [], isLoading: loadingMembers } = useMembers();
  const {
    saveTagMutation,
    deleteTagMutation,
    setTagMembersMutation,
    updatePermissionsAndRulesMutation,
  } = useMemberTagMutations();

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
        t.rules?.block_sales ||
        t.rules?.block_movements ||
        t.rules?.block_productions ||
        t.rules?.block_cash_fund
    ).length;
    return { totalTags, totalAssignedMembers, activeTags, blockingTags };
  }, [tags, assignments]);

  // Cards operacionais de membros (removendo Painel DEV e Painel CEO, mantendo Gerenciar Tags sob Administração)
  const platformPageCards = useMemo(() => {
    return PAGE_CARDS.filter((card) => {
      // Exclui Painel DEV e Ferramentas Dev
      if (card.defaultCat === "DEV" || card.defaultCat === "Ferramentas Dev") return false;
      if (card.id.startsWith("dev-") || card.id === "dev" || card.route.startsWith("/dev")) return false;
      // Permite expressamente o card "ceo-tags" (Gerenciar Tags) para permitir concessão granular de Gerenciar, Criar, Apagar e Editar
      if (card.id === "ceo-tags") return true;
      // Exclui Painel CEO
      if (card.defaultCat === "CEO" || card.defaultCat === "Painel CEO") return false;
      if (card.id.startsWith("ceo-") || card.id === "ceo" || card.route.startsWith("/ceo")) return false;
      // Remover expressamente "Transmissão e Lives" e "Twin Life"
      if (card.id === "lives" || card.id === "life") return false;
      return true;
    });
  }, []);

  const allPlatformPermissions = useMemo(() => {
    return Array.from(new Set(platformPageCards.flatMap((c) => c.permissions.map((p) => p.key))));
  }, [platformPageCards]);

  const readOnlyPlatformPermissions = useMemo(() => {
    return READ_ONLY_PERMISSIONS.filter((p) => allPlatformPermissions.includes(p));
  }, [allPlatformPermissions]);

  // Agrupamento e ordenação dinâmica dos PAGE_CARDS operacionais pelas categorias do menu de membros
  const groupedPageCards = useMemo(() => {
    const validConfigItems = menuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
    const configMap = new Map(validConfigItems.map((c) => [c.id || c.url, c]));

    const rawCategories = menuConfig?.categories?.length
      ? menuConfig.categories
      : ["Produções", "Gestão", "Administração"];
    const orderedCategories = rawCategories;

    // Remover categorias "Operação", "DEV", "Ferramentas Dev", "CEO", "Painel CEO"
    const categoryOrder = orderedCategories.filter(
      (c) => c !== "DEV" && c !== "Ferramentas Dev" && c !== "CEO" && c !== "Painel CEO" && c !== "Operação"
    );

    const customized = platformPageCards
      .map((card) => {
        const cfg = configMap.get(card.id) || configMap.get(card.route);
        let cat = cfg?.category || card.defaultCat;
        if (cat === "Operação") {
          cat = card.id === "vendas" ? "Produções" : "Gestão";
        }
        if (card.id === "ceo-tags") {
          cat = "Administração";
        }
        return {
          ...card,
          title: card.id === "ceo-tags" ? "Gerenciar Tags" : (cfg?.title || card.title),
          category: cat,
          order: typeof cfg?.order === "number" ? cfg.order : card.defaultOrder,
        };
      })
      .filter(
        (card) =>
          card.category !== "DEV" &&
          card.category !== "Ferramentas Dev" &&
          card.category !== "CEO" &&
          card.category !== "Painel CEO" &&
          card.category !== "Operação"
      );

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
  }, [menuConfig, platformPageCards]);

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
    setActivePerms([...allPlatformPermissions]);
    void autoSavePermsAndRules([...allPlatformPermissions], activeRules);
  };

  const setReadOnlyPermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    setActivePerms([...readOnlyPlatformPermissions]);
    void autoSavePermsAndRules([...readOnlyPlatformPermissions], activeRules);
  };

  const setOperationalPermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    setActivePerms([...operationalBasicPermissions]);
    void autoSavePermsAndRules([...operationalBasicPermissions], activeRules);
  };

  const setWarehousePermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    setActivePerms([...warehouseLogisticsPermissions]);
    void autoSavePermsAndRules([...warehouseLogisticsPermissions], activeRules);
  };

  const clearAllPermissions = () => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const next: Permission[] = [];
    setActivePerms(next);
    void autoSavePermsAndRules(next, activeRules);
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
    setFormIcon("Tag");
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
    setFormColor(tag.color || "#10b981");
    setFormIcon(tag.icon || "Tag");
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

    try {
      const mergedRules = editingTag
        ? { ...parseMemberTagRules(editingTag.rules), ...formRules }
        : formRules;

      await saveTagMutation.mutateAsync({
        id: editingTag ? editingTag.id : cleanId,
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
    setTagForMembers(tag);
    const existing = new Set(
      assignments.filter((a) => a.tag_id === tag.id).map((a) => a.member_id)
    );
    setSelectedMemberIds(existing);
    setMemberAssignSearch("");
    setMemberAssignFilter("all");
  };

  const filteredMembersForAssign = useMemo(() => {
    return members.filter((m) => {
      const memId = m.user_id || m.id;
      const isAssigned = selectedMemberIds.has(memId) || (m.user_id && selectedMemberIds.has(m.user_id)) || (m.id && selectedMemberIds.has(m.id));
      if (memberAssignFilter === "assigned" && !isAssigned) return false;
      if (memberAssignFilter === "unassigned" && isAssigned) return false;

      if (!memberAssignSearch) return true;
      const q = memberAssignSearch.toLowerCase();
      const matchName = m.nome.toLowerCase().includes(q);
      const matchNick = (m.nickname || "").toLowerCase().includes(q);
      const matchGameId = (m.game_id || "").includes(q);
      const matchNivel = (m.nivel || "").toLowerCase().includes(q);
      return matchName || matchNick || matchGameId || matchNivel;
    });
  }, [members, memberAssignSearch, memberAssignFilter, selectedMemberIds]);

  const handleToggleMember = (userId: string) => {
    if (!canAssignTag) {
      toast.error("Você não possui permissão para alterar vínculos de membros.");
      return;
    }
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAllFilteredMembers = () => {
    if (!canAssignTag) {
      toast.error("Você não possui permissão para alterar vínculos de membros.");
      return;
    }
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      filteredMembersForAssign.forEach((m) => next.add(m.user_id || m.id));
      return next;
    });
  };

  const handleClearAllFilteredMembers = () => {
    if (!canAssignTag) {
      toast.error("Você não possui permissão para alterar vínculos de membros.");
      return;
    }
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      filteredMembersForAssign.forEach((m) => {
        if (m.user_id) next.delete(m.user_id);
        if (m.id) next.delete(m.id);
      });
      return next;
    });
  };

  const handleSaveMemberAssignments = async () => {
    if (!tagForMembers) return;
    if (!canAssignTag) {
      toast.error("Você não possui permissão para salvar vínculos de membros.");
      return;
    }
    try {
      await setTagMembersMutation.mutateAsync({
        tagId: tagForMembers.id,
        memberIds: Array.from(selectedMemberIds),
      });
      setTagForMembers(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
        window.dispatchEvent(new Event("tw_permissions_synced"));
        window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
      }
    } catch (e) {
      // Já tratado
    }
  };

  // Abertura do Modal de Permissões e Regras
  const handleOpenPermsModal = (tag: MemberTag) => {
    if (!canManagePerms && !canManageRules && !hasPermission("view_ceo_tag_permissions")) {
      toast.error("Você não possui permissão para acessar permissões e regras da tag.");
      return;
    }
    setTagForPerms(tag);
    const rawPerms = Array.isArray(tag.permissions) ? tag.permissions : [];
    const validPerms = rawPerms.filter((p) => allPlatformPermissions.includes(p));
    setActivePerms(validPerms);
    setActiveRules(parseMemberTagRules(tag.rules));
    setPermSearch("");
    setPermCategoryFilter("all");
    setPermSubTab(canManagePerms || !canManageRules ? "permissions" : "rules");
    setAutoSaveStatus("idle");
  };

  const autoSavePermsAndRules = async (newPerms: Permission[], newRules: MemberTagRules) => {
    if (!tagForPerms) return;
    setAutoSaveStatus("saving");
    try {
      const safeRules = parseMemberTagRules(newRules);
      await updatePermissionsAndRulesMutation.mutateAsync({
        tagId: tagForPerms.id,
        permissions: newPerms,
        rules: safeRules,
        silent: true,
      });
      setAutoSaveStatus("saved");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("tw_tags_updated"));
        window.dispatchEvent(new Event("tw_permissions_synced"));
        window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
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
    const next = activePerms.includes(perm) ? activePerms.filter((p) => p !== perm) : [...activePerms, perm];
    setActivePerms(next);
    void autoSavePermsAndRules(next, activeRules);
  };

  const handleToggleCardPerms = (card: PageCardConfig) => {
    if (!canManagePerms) {
      toast.error("Você não tem permissão para alterar permissões de tags.");
      return;
    }
    const cardKeys = card.permissions.map((p) => p.key);
    const allIn = cardKeys.every((k) => activePerms.includes(k));
    const next = allIn
      ? activePerms.filter((k) => !cardKeys.includes(k))
      : [...activePerms, ...cardKeys.filter((k) => !activePerms.includes(k))];
    setActivePerms(next);
    void autoSavePermsAndRules(next, activeRules);
  };

  const handleUpdateRuleValue = (newRules: MemberTagRules) => {
    if (!canManageRules) {
      toast.error("Você não tem permissão para alterar regras operacionais de tags.");
      return;
    }
    setActiveRules(newRules);
    void autoSavePermsAndRules(activePerms, newRules);
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
        <Card className="surface-card border-border/70 shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground">Total de Tags</span>
            <TagIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{metrics.totalTags}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Cadastradas no sistema</p>
          </CardContent>
        </Card>

        <Card className="surface-card border-border/70 shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground">Membros com Tag</span>
            <Users className="h-4 w-4 text-sky-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{metrics.totalAssignedMembers}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Com atribuição ativa</p>
          </CardContent>
        </Card>

        <Card className="surface-card border-border/70 shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground">Tags Ativas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{metrics.activeTags}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Operacionais na plataforma</p>
          </CardContent>
        </Card>

        <Card className="surface-card border-border/70 shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground">Tags com Bloqueio</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{metrics.blockingTags}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Restringem operações</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTROS E BUSCA */}
      <Card className="surface-card border-border/70 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Buscar por nome, slug ou descrição..."
              className="pl-9 h-9 text-xs rounded-xl bg-background/50 border-border/60"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <Button
              type="button"
              variant={tagFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("all")}
              className="h-8 text-xs rounded-xl"
            >
              Todas ({tags.length})
            </Button>
            <Button
              type="button"
              variant={tagFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("active")}
              className="h-8 text-xs rounded-xl"
            >
              Ativas
            </Button>
            <Button
              type="button"
              variant={tagFilter === "sales" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("sales")}
              className="h-8 text-xs rounded-xl gap-1"
            >
              <ShoppingCart className="h-3 w-3 text-emerald-400" />
              <span>Vendas</span>
            </Button>
            <Button
              type="button"
              variant={tagFilter === "productions" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("productions")}
              className="h-8 text-xs rounded-xl gap-1"
            >
              <Factory className="h-3 w-3 text-amber-400" />
              <span>Produção</span>
            </Button>
            <Button
              type="button"
              variant={tagFilter === "blocking" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("blocking")}
              className="h-8 text-xs rounded-xl gap-1"
            >
              <ShieldAlert className="h-3 w-3 text-rose-400" />
              <span>Bloqueadoras</span>
            </Button>
            <Button
              type="button"
              variant={tagFilter === "discord" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("discord")}
              className="h-8 text-xs rounded-xl gap-1.5 border-indigo-500/30 text-indigo-300"
            >
              <DiscordIconSvg className="h-3.5 w-3.5 text-[#5865F2]" />
              <span>Discord</span>
            </Button>
            <Button
              type="button"
              variant={tagFilter === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTagFilter("system")}
              className="h-8 text-xs rounded-xl"
            >
              Sistema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* GRID DE TAGS */}
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
              <Button onClick={handleOpenCreateModal} size="sm" className="rounded-xl gap-2 text-xs">
                <Plus className="h-4 w-4" />
                <span>Criar Primeira Tag</span>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map((tag) => {
            const assignedCount = assignments.filter((a) => a.tag_id === tag.id).length;
            const permsCount = Array.isArray(tag.permissions) ? tag.permissions.length : 0;
            const isBlocked = Boolean(tag.rules?.is_blocked || tag.rules?.block_operations);
            const canSell = Boolean(tag.rules?.can_sell);
            const canProduce = Boolean(tag.rules?.can_manage_productions);
            const canRaw = Boolean(tag.rules?.can_manage_raw_materials);
            const canWarehouse = Boolean(tag.rules?.can_transfer_warehouse);
            const isCeoAccess = Boolean(tag.rules?.can_access_ceo || tag.id === "ceo");
            const canEscalas = Boolean(
              tag.rules?.can_manage_escalas ||
              tag.rules?.can_view_escalas ||
              tag.rules?.can_participate_escalas ||
              (Array.isArray(tag.permissions) && tag.permissions.some((p) => typeof p === "string" && p.startsWith("escalas.")))
            );
            const isDiscordLinked = Boolean(tag.discord_role_id);

            return (
              <Card
                key={tag.id}
                className={cn(
                  "surface-card border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden",
                  !tag.is_active ? "opacity-60 bg-muted/20 border-dashed" : "border-border/70"
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
                          className="shadow-sm font-semibold"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono text-muted-foreground truncate">
                            @{tag.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
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
                        {tag.is_system ? (
                          <Badge variant="outline" className="text-[9px] px-2 py-0.5 border-amber-500/40 text-amber-300 bg-amber-500/10 font-bold flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                            Visível no Membro
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 border-border/60 text-muted-foreground bg-secondary/30">
                            Interna / Regras
                          </Badge>
                        )}
                        {!tag.is_active && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-rose-500/30 text-rose-400 bg-rose-500/10">
                            Inativa
                          </Badge>
                        )}
                      </div>
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
                      {isCeoAccess && (
                        <Badge className="text-[10px] py-0 px-2 font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30 gap-1">
                          <Crown className="h-3 w-3" />
                          <span>CEO</span>
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-3 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/30 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>Membros com esta tag:</span>
                      </span>
                      <span className="font-bold text-foreground font-mono">
                        {assignedCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Permissões concedidas:</span>
                      </span>
                      <span className="font-bold text-foreground font-mono">
                        {permsCount} ativas
                      </span>
                    </div>
                  </CardContent>
                </div>

                {(canManagePerms || canManageRules || canAssignTag || canEditTag || canDiscordConfig || (!tag.is_system && canDeleteTag)) && (
                  <div className="p-3 border-t border-border/50 bg-secondary/10 flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      {(canManagePerms || canManageRules) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPermsModal(tag)}
                          className="h-8 text-xs font-semibold rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
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
                          className="h-8 text-xs font-medium rounded-xl gap-1 text-muted-foreground hover:text-foreground"
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
                            "h-8 text-xs font-semibold rounded-xl gap-1.5 transition-all",
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

                    <div className="flex items-center gap-0.5">
                      {canEditTag && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(tag)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                          title="Editar Tag"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!tag.is_system && canDeleteTag && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Deseja realmente apagar a tag "${tag.name}"? Ela será desvinculada de todos os membros.`)) {
                              void deleteTagMutation.mutateAsync(tag.id);
                            }
                          }}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
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
        <DialogContent className="sm:max-w-lg surface-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-primary" />
              <span>{editingTag ? "Editar Tag" : "Criar Nova Tag"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure nome, identificador único, paleta de cor e ícone representativo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome da Tag</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Supervisor Operacional, Vendedor VIP"
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Identificador Único (Slug)</Label>
              <Input
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                disabled={Boolean(editingTag)}
                placeholder="Ex: supervisor_operacional"
                className="rounded-xl h-9 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                Usado internamente pelo sistema e regras de permissão.
              </p>
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

            {/* SELEÇÃO DE COR */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Paleta de Cor</Label>
              <div className="flex flex-wrap items-center gap-2">
                {AVAILABLE_PALETTES.map((p) => {
                  const isSelected = formColor.toLowerCase() === p.hex.toLowerCase();
                  return (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setFormColor(p.hex)}
                      className={cn(
                        "h-7 w-7 rounded-full transition-all border flex items-center justify-center",
                        isSelected ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-105 border-border/40"
                      )}
                      style={{ backgroundColor: p.hex }}
                      title={p.label}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                    </button>
                  );
                })}
                <div className="flex items-center gap-1.5 ml-1">
                  <Input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-7 w-9 p-0.5 rounded cursor-pointer border border-border/60"
                  />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">{formColor}</span>
                </div>
              </div>
            </div>

            {/* SELEÇÃO DE ÍCONE */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Ícone da Tag</Label>
              <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1 border rounded-xl bg-background/50 border-border/60">
                {AVAILABLE_ICONS.map((iconKey) => {
                  const IconComp = resolveTagIcon(iconKey);
                  const isSelected = formIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setFormIcon(iconKey)}
                      className={cn(
                        "p-2 rounded-lg border flex items-center justify-center transition-all",
                        isSelected
                          ? "border-primary bg-primary/20 text-primary shadow-sm"
                          : "border-border/40 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                      )}
                      title={iconKey}
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

      {/* MODAL 2: VINCULAR MEMBROS À TAG */}
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
              Selecione os integrantes que receberão esta tag e todas as suas permissões e regras operacionais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
              <div className="relative w-full sm:w-64">
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
                  >
                    Marcar Todos
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAllFilteredMembers}
                    className="h-7 text-[10px] px-2 rounded-lg text-rose-400 hover:bg-rose-500/10"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </div>

            <div className="border border-border/70 rounded-2xl max-h-72 overflow-y-auto divide-y divide-border/40 bg-background/40">
              {filteredMembersForAssign.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  Nenhum integrante encontrado.
                </div>
              ) : (
                filteredMembersForAssign.map((m) => {
                  const isChecked = selectedMemberIds.has(m.user_id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMember(m.user_id)}
                      className={cn(
                        "p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors select-none",
                        isChecked ? "bg-primary/10" : "hover:bg-secondary/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleMember(m.user_id)}
                          className="rounded pointer-events-none"
                        />
                        <Avatar className="h-7 w-7 border border-border/50 shrink-0">
                          <AvatarImage src={m.avatar_url || ""} />
                          <AvatarFallback className="text-[10px] font-bold">
                            {m.nome.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-xs leading-none truncate">
                            {m.nome}
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

                      {isChecked && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shrink-0">
                          Vinculado
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t border-border/60">
            <span className="text-xs text-muted-foreground">
              Total selecionados: <strong className="text-foreground font-mono">{selectedMemberIds.size}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTagForMembers(null)}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveMemberAssignments}
                disabled={setTagMembersMutation.isPending || !canAssignTag}
                className="text-xs rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {setTagMembersMutation.isPending ? "Salvando..." : "Salvar Vínculos"}
              </Button>
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
                    size="lg"
                    showIcon
                    className="shadow-md font-bold text-sm"
                  />
                )}
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>Configuração de Permissões & Regras</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    As permissões são somadas às patentes e ativas em tempo real no sistema.
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
                  <span>Permissões de Módulos ({activePerms.length} ativas)</span>
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
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
                        onClick={setOperationalPermissions}
                      >
                        <Factory className="h-3 w-3 text-amber-400" />
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

                      return (
                        <div key={category} className="space-y-4">
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
                            <div className="flex items-center gap-2">
                              <FolderTree className="h-4 w-4 text-primary" />
                              <h3 className="text-xs uppercase tracking-widest font-bold text-foreground">
                                Categoria: <span className="text-primary font-extrabold">{category}</span>
                              </h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                              {filteredCards.length} {filteredCards.length === 1 ? "módulo" : "módulos"}
                            </Badge>
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
                              block_login: true,
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
                              block_login: false,
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

                      {/* BLOQUEAR ACESSO À PLATAFORMA (CHAVE MESTRA) */}
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
                  </div>
                </div>

                {/* SEÇÃO 5: GESTÃO DE EQUIPE & RECRUTAMENTO */}
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

                {/* SEÇÃO 6: ESCALA DE AÇÃO & OPERAÇÕES TÁTICAS */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-border/50">
                    <Swords className="h-4 w-4 text-rose-400" />
                    <h3 className="text-xs uppercase tracking-wider font-bold text-rose-400">
                      6. Escala de Ação & Operações Táticas
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* GESTÃO DE ESCALAS */}
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

                    {/* VISUALIZAR ESCALAS */}
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
                variant="outline"
                size="sm"
                onClick={() => setTagForPerms(null)}
                className="text-xs rounded-xl"
              >
                Fechar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  if (!tagForPerms) return;
                  try {
                    const safeRules = parseMemberTagRules(activeRules);
                    await updatePermissionsAndRulesMutation.mutateAsync({
                      tagId: tagForPerms.id,
                      permissions: activePerms,
                      rules: safeRules,
                    });
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("tw_tags_updated"));
                      window.dispatchEvent(new Event("tw_permissions_synced"));
                      window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
                    }
                  } catch (e) {
                    // Já tratado na mutation
                  }
                }}
                disabled={updatePermissionsAndRulesMutation.isPending || (!canManagePerms && !canManageRules)}
                className="text-xs rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{updatePermissionsAndRulesMutation.isPending ? "Salvando..." : "Salvar Alterações"}</span>
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
    </div>
  );
}
