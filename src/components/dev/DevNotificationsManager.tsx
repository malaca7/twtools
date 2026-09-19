import React, { useState, useEffect, useMemo } from "react";
import {
  Bell,
  BellRing,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Power,
  Send,
  Radio,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Megaphone,
  LifeBuoy,
  Target,
  Package,
  TrendingUp,
  UserPlus,
  RefreshCw,
  Sliders,
  Code2,
  Zap,
  Activity,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Copy,
  Terminal,
  Layers,
  Database,
  Volume2,
  Volume1,
  VolumeX,
  Download,
  AlertOctagon,
  Coins,
  Award,
  ShieldAlert,
  Lock,
  Trophy,
  Bot,
  HelpCircle,
  Settings,
  Settings2,
  CheckSquare,
  Square,
  ArrowLeftRight,
  Play,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCustomRoles } from "@/hooks/useData";
import {
  fetchAllRawNotifications,
  createNotification,
  updateAdminNotification,
  toggleAdminNotificationActive,
  deleteAdminNotification,
  purgeAdminNotifications,
  fetchNotificationTypeRules,
  saveNotificationTypeRules,
  broadcastNotificationsRealtimeUpdate,
  getNotificationsRealtimeChannel,
} from "@/lib/notifications-api";
import {
  type AppNotification,
  type NotificationType,
  type NotificationCategory,
  type NotificationTypeRules,
  type NotificationDomain,
  type NotificationTypeDeliveryOptions,
  ALL_NOTIFICATION_TYPES,
  NOTIFICATION_DOMAINS,
  DEFAULT_NOTIFICATION_RULES,
  DEFAULT_TYPE_DELIVERY_OPTIONS,
  getNotificationTypeInfo,
  getCategoryBadge,
  formatRelativeTime,
} from "@/types/notifications";
import { ALL_LEVELS, type AppLevel } from "@/lib/permissions";
import { playNotificationChimeSound, playNotificationSoundEffect } from "@/lib/sound-effects";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ROLES_LIST: { id: string; label: string }[] = [
  { id: "01", label: "01 (Líder Supremo)" },
  { id: "02", label: "02 (Sub-Líder)" },
  { id: "gerente", label: "Gerente" },
  { id: "motoqueiro", label: "Motoqueiro" },
  { id: "membro", label: "Membro" },
  { id: "novato", label: "Novato" },
];

const TAGS_LIST: { id: string; label: string; color: string }[] = [
  { id: "tag_dev", label: "Tag Desenvolvedor", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
  { id: "tag_ceo", label: "Tag CEO", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
];

function renderTypeIconHelper(type: NotificationType | string, className = "h-4 w-4") {
  switch (type) {
    case "ticket":
      return <LifeBuoy className={className} />;
    case "chat":
      return <MessageSquare className={className} />;
    case "absence":
      return <Calendar className={className} />;
    case "goal":
      return <Target className={className} />;
    case "movement":
      return <Package className={className} />;
    case "sale":
      return <TrendingUp className={className} />;
    case "cash_fund":
      return <Coins className={className} />;
    case "stock_alert":
      return <AlertTriangle className={className} />;
    case "announcement":
      return <Megaphone className={className} />;
    case "role_update":
      return <Award className={className} />;
    case "member_warning":
      return <ShieldAlert className={className} />;
    case "security_alert":
      return <Lock className={cn(className, "text-rose-500")} />;
    case "achievement":
      return <Trophy className={cn(className, "text-amber-400")} />;
    case "signup":
      return <UserPlus className={className} />;
    case "live":
      return <Radio className={cn(className, "text-rose-400")} />;
    case "bot_sync":
      return <Bot className={className} />;
    case "patch_notes":
      return <Sparkles className={className} />;
    case "feedback":
      return <HelpCircle className={className} />;
    case "system":
    default:
      return <Bell className={className} />;
  }
}

export function DevNotificationsManager() {
  const { user, profile, hasPermission, isDevUser } = useAuth();

  const canManageRules = isDevUser || hasPermission("manage_dev_notification_rules");
  const canCreate = isDevUser || hasPermission("create_dev_notification");
  const canEdit = isDevUser || hasPermission("edit_dev_notification");
  const canDelete = isDevUser || hasPermission("delete_dev_notification");
  const canSimulate = isDevUser || hasPermission("simulate_dev_notification");
  const canToggle = isDevUser || hasPermission("toggle_dev_notification_active");
  const canPurge = isDevUser || hasPermission("purge_dev_notifications");
  const canInspect = isDevUser || hasPermission("inspect_dev_notification_payload");
  const canExport = isDevUser || hasPermission("export_dev_notifications");
  const canManageSounds = isDevUser || hasPermission("manage_dev_notification_sounds");
  const canEmergencyAlert = isDevUser || hasPermission("broadcast_dev_emergency_alert");

  const [activeTab, setActiveTab] = useState<"matrix" | "manager" | "simulator" | "purge" | "telemetry">("matrix");

  // Dados de Notificações
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(true);

  // Matriz de Regras
  const [rules, setRules] = useState<NotificationTypeRules>(DEFAULT_NOTIFICATION_RULES);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isSavingRules, setIsSavingRules] = useState(false);

  // Cargos Dinâmicos do Banco de Dados
  const { data: dbCustomRoles = [] } = useCustomRoles();

  const allRolesCombined = useMemo(() => {
    if (dbCustomRoles && dbCustomRoles.length > 0) {
      return dbCustomRoles.map((r: any) => ({
        id: String(r.id),
        label: r.nome ? `${r.id} (${r.nome})` : String(r.id),
        nome: String(r.nome || r.id),
        rank: Number(r.rank ?? 0),
      }));
    }
    return ROLES_LIST.map((r, idx) => ({
      id: r.id,
      label: r.label,
      nome: r.label,
      rank: 100 - idx * 10,
    }));
  }, [dbCustomRoles]);

  // Filtros Avançados da Matriz
  const [matrixDomain, setMatrixDomain] = useState<"all" | NotificationDomain>("all");
  const [matrixSearch, setMatrixSearch] = useState("");
  const [matrixRoleSearch, setMatrixRoleSearch] = useState("");

  // Tipos Visíveis na Matriz
  const visibleTypes = useMemo(() => {
    return ALL_NOTIFICATION_TYPES.filter((t) => {
      const info = getNotificationTypeInfo(t);
      if (matrixDomain !== "all" && info.domain !== matrixDomain) return false;
      if (matrixSearch.trim()) {
        const q = matrixSearch.toLowerCase();
        return (
          t.toLowerCase().includes(q) ||
          info.label.toLowerCase().includes(q) ||
          info.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [matrixDomain, matrixSearch]);

  // Cargos Visíveis
  const visibleRoles = useMemo(() => {
    if (!matrixRoleSearch.trim()) return allRolesCombined;
    const q = matrixRoleSearch.toLowerCase();
    return allRolesCombined.filter(
      (r) => r.id.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)
    );
  }, [allRolesCombined, matrixRoleSearch]);

  // Tags Visíveis
  const visibleTags = useMemo(() => {
    if (!matrixRoleSearch.trim()) return TAGS_LIST;
    const q = matrixRoleSearch.toLowerCase();
    return TAGS_LIST.filter(
      (t) => t.id.toLowerCase().includes(q) || t.label.toLowerCase().includes(q)
    );
  }, [matrixRoleSearch]);

  // Modal de Opções de Entrega do Tipo
  const [isTypeOptionsOpen, setIsTypeOptionsOpen] = useState(false);
  const [selectedTypeForOptions, setSelectedTypeForOptions] = useState<NotificationType | null>(null);
  const [editingDeliveryOptions, setEditingDeliveryOptions] = useState<NotificationTypeDeliveryOptions>({
    enabled: true,
    showToast: true,
    showBell: true,
    sound: "chime",
    soundVolume: 70,
    severity: "info",
    toastDuration: 5,
    mirrorDiscord: true,
  });

  const openTypeOptionsModal = (type: NotificationType) => {
    setSelectedTypeForOptions(type);
    const existing = rules.typeOptions?.[type] || DEFAULT_TYPE_DELIVERY_OPTIONS[type] || {
      enabled: true,
      showToast: true,
      showBell: true,
      sound: "chime",
      soundVolume: 70,
      severity: "info",
      toastDuration: 5,
      mirrorDiscord: true,
    };
    setEditingDeliveryOptions({ ...existing });
    setIsTypeOptionsOpen(true);
  };

  const handleSaveTypeDeliveryOptions = () => {
    if (!selectedTypeForOptions) return;
    setRules((prev) => ({
      ...prev,
      typeOptions: {
        ...(prev.typeOptions || DEFAULT_TYPE_DELIVERY_OPTIONS),
        [selectedTypeForOptions]: { ...editingDeliveryOptions },
      },
    }));
    setIsTypeOptionsOpen(false);
    toast.success(
      `Opções de entrega para "${getNotificationTypeInfo(selectedTypeForOptions).label}" atualizadas!`
    );
  };

  const handleResetCurrentTypeDeliveryOptions = () => {
    if (!selectedTypeForOptions) return;
    const def = DEFAULT_TYPE_DELIVERY_OPTIONS[selectedTypeForOptions];
    if (def) {
      setEditingDeliveryOptions({ ...def });
      toast.info("Valores padrão restaurados.");
    }
  };

  // Modal de Cópia de Permissões
  const [copyModalState, setCopyModalState] = useState<{
    open: boolean;
    targetType: "roles" | "tags";
    targetId: string;
    targetLabel: string;
    sourceSubject: string;
  }>({
    open: false,
    targetType: "roles",
    targetId: "",
    targetLabel: "",
    sourceSubject: "",
  });

  const handleOpenCopyModal = (targetType: "roles" | "tags", targetId: string, targetLabel: string) => {
    const defaultSource =
      targetType === "roles"
        ? allRolesCombined.find((r) => r.id !== targetId)?.id || "01"
        : "tag_dev";

    setCopyModalState({
      open: true,
      targetType,
      targetId,
      targetLabel,
      sourceSubject: defaultSource,
    });
  };

  const handleExecuteCopy = () => {
    const { targetType, targetId, sourceSubject } = copyModalState;
    if (!sourceSubject) return;

    const isSourceTag = sourceSubject.startsWith("tag_");
    const sourceGroup = isSourceTag ? rules.tags : rules.roles;
    const sourceList = sourceGroup[sourceSubject] || [];

    setRules((prev) => {
      const targetGroup = { ...prev[targetType] };
      targetGroup[targetId] = [...sourceList];
      return { ...prev, [targetType]: targetGroup };
    });

    setCopyModalState((prev) => ({ ...prev, open: false }));
    toast.success(`Permissões copiadas com sucesso para "${copyModalState.targetLabel}"!`);
  };

  // Filtros do Gerenciador
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotif, setEditingNotif] = useState<AppNotification | null>(null);
  const [isSavingNotif, setIsSavingNotif] = useState(false);

  // Campos do Form
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formType, setFormType] = useState<NotificationType>("system");
  const [formCategory, setFormCategory] = useState<NotificationCategory>("info");
  const [formLink, setFormLink] = useState("");
  const [formTargetMode, setFormTargetMode] = useState<"all" | "roles">("all");
  const [formSelectedRoles, setFormSelectedRoles] = useState<AppLevel[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formMetadataJson, setFormMetadataJson] = useState("");

  // Modal de Inspeção JSON
  const [inspectNotif, setInspectNotif] = useState<AppNotification | null>(null);

  // Simulator State
  const [simType, setSimType] = useState<NotificationType>("live");
  const [simCategory, setSimCategory] = useState<NotificationCategory>("alert");
  const [simTitle, setSimTitle] = useState("🔴 Streamer Twin Wheels iniciou Transmissão!");
  const [simMessage, setSimMessage] = useState("Transmitindo Operação RP do grupo em alta definição na Twitch!");
  const [simLink, setSimLink] = useState("/lives");
  const [isSimulating, setIsSimulating] = useState(false);

  // Purge State
  const [purgeType, setPurgeType] = useState<string>("all");
  const [purgeCategory, setPurgeCategory] = useState<string>("all");
  const [purgeDays, setPurgeDays] = useState<string>("0");
  const [isPurging, setIsPurging] = useState(false);

  // Carregar dados
  const loadNotifications = async () => {
    setIsLoadingNotifs(true);
    try {
      const data = await fetchAllRawNotifications();
      setNotifications(data);
    } catch (err: any) {
      toast.error("Erro ao carregar notificações: " + err.message);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  const loadRules = async () => {
    setIsLoadingRules(true);
    try {
      const r = await fetchNotificationTypeRules();
      setRules(r);
    } catch (err: any) {
      toast.error("Erro ao carregar matriz de regras: " + err.message);
    } finally {
      setIsLoadingRules(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadRules();

    const handleNotifUpdate = () => loadNotifications();
    const handleRulesUpdate = () => loadRules();

    window.addEventListener("tw_notifications_updated", handleNotifUpdate);
    window.addEventListener("tw_notification_rules_updated", handleRulesUpdate);

    return () => {
      window.removeEventListener("tw_notifications_updated", handleNotifUpdate);
      window.removeEventListener("tw_notification_rules_updated", handleRulesUpdate);
    };
  }, []);

  // --- REGRAS / MATRIZ ---
  const handleToggleRule = (subjectType: "roles" | "tags", subjectId: string, nType: NotificationType) => {
    setRules((prev) => {
      const group = { ...prev[subjectType] };
      const currentList = group[subjectId] || [];
      let nextList: NotificationType[];

      if (currentList.includes(nType)) {
        nextList = currentList.filter((t) => t !== nType);
      } else {
        nextList = [...currentList, nType];
      }

      group[subjectId] = nextList;
      return {
        ...prev,
        [subjectType]: group,
      };
    });
  };

  const handleToggleRowAll = (subjectType: "roles" | "tags", subjectId: string) => {
    setRules((prev) => {
      const group = { ...prev[subjectType] };
      const currentList = group[subjectId] || [];
      const hasAll = currentList.length >= ALL_NOTIFICATION_TYPES.length;

      group[subjectId] = hasAll ? [] : [...ALL_NOTIFICATION_TYPES];
      return {
        ...prev,
        [subjectType]: group,
      };
    });
  };

  const handleInvertRow = (subjectType: "roles" | "tags", subjectId: string) => {
    setRules((prev) => {
      const group = { ...prev[subjectType] };
      const currentList = group[subjectId] || [];
      const inverted = ALL_NOTIFICATION_TYPES.filter((t) => !currentList.includes(t));
      group[subjectId] = inverted;
      return {
        ...prev,
        [subjectType]: group,
      };
    });
    toast.info("Seleção de tipos invertida para esta linha.");
  };

  // Ações em Lote para Tipos Visíveis
  const handleBulkMarkVisible = (action: "enable" | "disable" | "invert") => {
    setRules((prev) => {
      const nextRoles = { ...prev.roles };
      const nextTags = { ...prev.tags };

      const applyAction = (currentList: NotificationType[]) => {
        if (action === "enable") {
          return Array.from(new Set([...currentList, ...visibleTypes]));
        } else if (action === "disable") {
          return currentList.filter((t) => !visibleTypes.includes(t));
        } else {
          const toAdd = visibleTypes.filter((t) => !currentList.includes(t));
          const toKeep = currentList.filter((t) => !visibleTypes.includes(t));
          return [...toKeep, ...toAdd];
        }
      };

      allRolesCombined.forEach((r) => {
        nextRoles[r.id] = applyAction(nextRoles[r.id] || []);
      });

      TAGS_LIST.forEach((t) => {
        nextTags[t.id] = applyAction(nextTags[t.id] || []);
      });

      return { ...prev, roles: nextRoles, tags: nextTags };
    });

    toast.success(
      action === "enable"
        ? `Todos os ${visibleTypes.length} tipos visíveis foram marcados para todos os cargos!`
        : action === "disable"
        ? `Tipos visíveis foram desmarcados em todos os cargos.`
        : `Seleção dos tipos visíveis invertida em todos os cargos.`
    );
  };

  // Presets Globais
  const handleApplyOperationalPreset = () => {
    setRules(DEFAULT_NOTIFICATION_RULES);
    toast.info("Preset Operacional Padrão carregado! Clique em 'Salvar Matriz' para salvar.");
  };

  const handleApplyCriticalOnlyPreset = () => {
    const criticalTypes: NotificationType[] = [
      "security_alert",
      "stock_alert",
      "member_warning",
      "announcement",
      "cash_fund",
    ];
    setRules((prev) => {
      const nextRoles: Record<string, NotificationType[]> = {};
      const nextTags: Record<string, NotificationType[]> = {};

      allRolesCombined.forEach((r) => {
        nextRoles[r.id] = [...criticalTypes];
      });

      TAGS_LIST.forEach((t) => {
        nextTags[t.id] = [...ALL_NOTIFICATION_TYPES];
      });

      return {
        ...prev,
        roles: nextRoles,
        tags: nextTags,
      };
    });
    toast.info("Preset 'Apenas Críticos & Alertas' aplicado.");
  };

  const handleSaveRules = async () => {
    setIsSavingRules(true);
    try {
      await saveNotificationTypeRules(rules, profile?.nickname || user?.id);
      toast.success("Matriz de regras salva com sucesso no banco de dados!");
    } catch (err: any) {
      toast.error("Erro ao salvar regras: " + err.message);
    } finally {
      setIsSavingRules(false);
    }
  };

  const handleResetRules = () => {
    if (confirm("Deseja restaurar todas as regras para o padrão de fábrica?")) {
      setRules(DEFAULT_NOTIFICATION_RULES);
      toast.info("Regras restauradas para o padrão. Clique em 'Salvar Regras' para persistir.");
    }
  };

  // --- CRUD NOTIFICAÇÕES ---
  const openCreateModal = () => {
    setEditingNotif(null);
    setFormTitle("");
    setFormMessage("");
    setFormType("system");
    setFormCategory("info");
    setFormLink("");
    setFormTargetMode("all");
    setFormSelectedRoles([]);
    setFormIsActive(true);
    setFormMetadataJson("");
    setIsModalOpen(true);
  };

  const openEditModal = (notif: AppNotification) => {
    setEditingNotif(notif);
    setFormTitle(notif.title);
    setFormMessage(notif.message);
    setFormType(notif.type);
    setFormCategory(notif.category);
    setFormLink(notif.link || "");
    if (notif.target_roles && notif.target_roles.length > 0) {
      setFormTargetMode("roles");
      setFormSelectedRoles(notif.target_roles);
    } else {
      setFormTargetMode("all");
      setFormSelectedRoles([]);
    }
    setFormIsActive(notif.is_active !== false);
    setFormMetadataJson(notif.metadata ? JSON.stringify(notif.metadata, null, 2) : "");
    setIsModalOpen(true);
  };

  const handleSaveNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.warning("Título e conteúdo são obrigatórios.");
      return;
    }

    let parsedMetadata: any = undefined;
    if (formMetadataJson.trim()) {
      try {
        parsedMetadata = JSON.parse(formMetadataJson.trim());
      } catch (err) {
        toast.error("JSON de metadados inválido. Corrija a formatação.");
        return;
      }
    }

    setIsSavingNotif(true);
    try {
      const targetRoles = formTargetMode === "roles" && formSelectedRoles.length > 0 ? formSelectedRoles : undefined;

      if (editingNotif) {
        await updateAdminNotification(editingNotif.id, {
          title: formTitle.trim(),
          message: formMessage.trim(),
          type: formType,
          category: formCategory,
          link: formLink.trim() || undefined,
          target_roles: targetRoles,
          is_active: formIsActive,
          metadata: parsedMetadata,
        });
        toast.success("Notificação atualizada com sucesso!");
      } else {
        await createNotification({
          title: formTitle.trim(),
          message: formMessage.trim(),
          type: formType,
          category: formCategory,
          link: formLink.trim() || undefined,
          target_roles: targetRoles,
          sender_id: user?.id,
          sender_name: profile?.nickname || profile?.nome || "Dev Admin",
          sender_avatar: profile?.avatar_url || profile?.discord_avatar_url,
          is_active: formIsActive,
          metadata: parsedMetadata,
        });
        toast.success("Notificação criada e emitida via broadcast!");
      }

      setIsModalOpen(false);
      await loadNotifications();
    } catch (err: any) {
      toast.error("Erro ao salvar notificação: " + err.message);
    } finally {
      setIsSavingNotif(false);
    }
  };

  const handleToggleActive = async (notif: AppNotification) => {
    const nextState = notif.is_active === false ? true : false;
    try {
      await toggleAdminNotificationActive(notif.id, nextState);
      toast.success(nextState ? "Notificação ativada!" : "Notificação pausada.");
      await loadNotifications();
    } catch (err: any) {
      toast.error("Erro ao alterar status: " + err.message);
    }
  };

  const handleDeleteNotif = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar permanentemente esta notificação?")) return;
    try {
      await deleteAdminNotification(id);
      toast.success("Notificação excluída.");
      await loadNotifications();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  // --- SIMULADOR ---
  const handleRunSimulation = async () => {
    if (!simTitle.trim() || !simMessage.trim()) {
      toast.warning("Título e mensagem do simulador são obrigatórios.");
      return;
    }

    setIsSimulating(true);
    try {
      // Tocar som de teste no Dev
      playNotificationChimeSound(85);

      const created = await createNotification({
        title: simTitle.trim(),
        message: simMessage.trim(),
        type: simType,
        category: simCategory,
        link: simLink.trim() || undefined,
        sender_id: user?.id,
        sender_name: "Simulador Dev [TESTE]",
        metadata: {
          is_simulated: true,
          simulated_at: new Date().toISOString(),
          simulated_by: profile?.nickname || user?.id,
        },
      });

      toast.success(`Push simulado emitido com sucesso! (${getNotificationTypeInfo(simType).label})`, {
        description: "Todos os clientes conectados receberam o evento em tempo real.",
      });

      await loadNotifications();
    } catch (err: any) {
      toast.error("Falha no simulador: " + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplySimPreset = (preset: {
    type: NotificationType;
    category: NotificationCategory;
    title: string;
    message: string;
    link: string;
  }) => {
    setSimType(preset.type);
    setSimCategory(preset.category);
    setSimTitle(preset.title);
    setSimMessage(preset.message);
    setSimLink(preset.link);
  };

  // --- EXPORTAR DADOS ---
  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notifications, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `notificacoes_tw_dev_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Histórico de notificações exportado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao exportar dados: " + err.message);
    }
  };

  // --- ALERTA DE EMERGÊNCIA ---
  const handleEmergencyAlert = async () => {
    if (!confirm("Confirmar emissão de ALERTA DE EMERGÊNCIA GLOBAL para todo o grupo?")) return;
    try {
      playNotificationChimeSound(100);
      await createNotification({
        title: "🚨 ALERTA CRÍTICO DE EMERGÊNCIA — COMANDO",
        message: "Atenção todos os integrantes: Convocação urgente ou alerta operacional prioritário!",
        type: "announcement",
        category: "alert",
        sender_id: user?.id,
        sender_name: profile?.nickname || profile?.nome || "Comando Dev",
        is_active: true,
        metadata: {
          is_emergency: true,
          broadcast_all: true,
          triggered_at: new Date().toISOString(),
          triggered_by: profile?.nickname || user?.id,
        },
      });
      toast.success("Alerta de emergência emitido globalmente via Realtime!");
      await loadNotifications();
    } catch (err: any) {
      toast.error("Falha ao emitir alerta: " + err.message);
    }
  };

  // --- PURGE / LIMPEZA ---
  const handleRunPurge = async () => {
    const daysNum = Number(purgeDays);
    const confirmMsg =
      daysNum > 0
        ? `Confirma a exclusão de todas as notificações anteriores a ${daysNum} dias?`
        : purgeType !== "all"
        ? `Confirma a exclusão de todas as notificações do tipo "${purgeType}"?`
        : "ATENÇÃO: Deseja apagar TODAS as notificações registradas no sistema? Esta ação é irreversível.";

    if (!confirm(confirmMsg)) return;

    setIsPurging(true);
    try {
      const removed = await purgeAdminNotifications({
        type: purgeType !== "all" ? purgeType : undefined,
        category: purgeCategory !== "all" ? purgeCategory : undefined,
        olderThanDays: daysNum > 0 ? daysNum : undefined,
      });

      toast.success(`Limpeza concluída! ${removed} notificação(ões) removida(s).`);
      await loadNotifications();
    } catch (err: any) {
      toast.error("Falha na limpeza em massa: " + err.message);
    } finally {
      setIsPurging(false);
    }
  };

  // Filtragem da lista
  const filteredList = useMemo(() => {
    let list = [...notifications];

    if (statusFilter === "active") {
      list = list.filter((n) => n.is_active !== false);
    } else if (statusFilter === "inactive") {
      list = list.filter((n) => n.is_active === false);
    }

    if (typeFilter !== "all") {
      list = list.filter((n) => n.type === typeFilter);
    }

    if (categoryFilter !== "all") {
      list = list.filter((n) => n.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          (n.sender_name && n.sender_name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [notifications, statusFilter, typeFilter, categoryFilter, searchQuery]);

  // Estatísticas e telemetria
  const stats = useMemo(() => {
    const total = notifications.length;
    const active = notifications.filter((n) => n.is_active !== false).length;
    const inactive = total - active;

    const typeCounts: Record<string, number> = {};
    ALL_NOTIFICATION_TYPES.forEach((t) => (typeCounts[t] = 0));
    notifications.forEach((n) => {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    });

    const categoryCounts: Record<string, number> = {};
    notifications.forEach((n) => {
      categoryCounts[n.category] = (categoryCounts[n.category] || 0) + 1;
    });

    return { total, active, inactive, typeCounts, categoryCounts };
  }, [notifications]);

  return (
    <div className="space-y-6">
      {/* ABAS SUPERIORES DEV */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <TabsList className="bg-secondary/60 border border-border/80 p-1 rounded-2xl inline-flex w-full sm:w-auto">
            <TabsTrigger
              value="matrix"
              className="text-xs font-bold gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Sliders className="h-4 w-4 text-purple-400" />
              Matriz de Tipos por Cargo & Tag
            </TabsTrigger>

            <TabsTrigger
              value="manager"
              className="text-xs font-bold gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Layers className="h-4 w-4 text-primary" />
              Gerenciador Avançado ({notifications.length})
            </TabsTrigger>

            <TabsTrigger
              value="simulator"
              className="text-xs font-bold gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Zap className="h-4 w-4 text-amber-400" />
              Simulador de Push
            </TabsTrigger>

            <TabsTrigger
              value="telemetry"
              className="text-xs font-bold gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              <Activity className="h-4 w-4 text-emerald-400" />
              Telemetria
            </TabsTrigger>

            <TabsTrigger
              value="purge"
              className="text-xs font-bold gap-1.5 rounded-xl data-[state=active]:bg-card data-[state=active]:text-destructive"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              Purge & Manutenção
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadNotifications();
                loadRules();
              }}
              className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border/70"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", (isLoadingNotifs || isLoadingRules) && "animate-spin")} />
              Sincronizar
            </Button>
          </div>
        </div>

        {/* =========================================================================
            ABA 1: MATRIZ DE REGRAS DE TIPOS DE NOTIFICAÇÃO POR CARGO E TAG
            ========================================================================= */}
        <TabsContent value="matrix" className="space-y-6">
          <Card className="border-border/80 bg-card/60 backdrop-blur-md shadow-xl">
            <CardHeader className="p-5 pb-4 border-b border-border/60">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-black flex items-center gap-2">
                        Matriz de Tipos de Notificação por Cargo & Tag
                        <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-purple-500/30 text-purple-400 bg-purple-500/10">
                          {ALL_NOTIFICATION_TYPES.length} Tipos no Sistema
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Defina quais cargos da hierarquia e tags recebem cada categoria de evento, configure canais de entrega e teste alertas sonoros.
                      </CardDescription>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canManageRules}
                        className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border/70 bg-card/80 hover:bg-card"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Presets Rápidos
                        <ChevronDown className="h-3 w-3 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 text-xs">
                      <DropdownMenuItem onClick={handleApplyOperationalPreset} className="gap-2.5 py-2 cursor-pointer">
                        <Package className="h-4 w-4 text-emerald-400" />
                        <div>
                          <p className="font-bold">Padrão Operacional</p>
                          <p className="text-[10px] text-muted-foreground">Distribuição equilibrada por cargo</p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleApplyCriticalOnlyPreset} className="gap-2.5 py-2 cursor-pointer">
                        <AlertOctagon className="h-4 w-4 text-rose-400" />
                        <div>
                          <p className="font-bold text-rose-400">Apenas Críticos & Segurança</p>
                          <p className="text-[10px] text-muted-foreground">Segurança, alertas e estoque zerado</p>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleResetRules} className="gap-2.5 py-2 text-muted-foreground cursor-pointer">
                        <RotateCcw className="h-4 w-4" />
                        <div>
                          <p className="font-bold">Restaurar Padrão de Fábrica</p>
                          <p className="text-[10px] text-muted-foreground">Volta todas as regras ao padrão</p>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    size="sm"
                    onClick={handleSaveRules}
                    disabled={!canManageRules || isSavingRules}
                    className="h-8 text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-md hover:opacity-95"
                  >
                    {isSavingRules ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {isSavingRules ? "Salvando..." : "Salvar Matriz"}
                  </Button>
                </div>
              </div>

              {/* FILTROS DE DOMÍNIO & BUSCAS */}
              <div className="mt-4 pt-3 border-t border-border/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* PILULAS DE DOMÍNIO */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-secondary/30 rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => setMatrixDomain("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                      matrixDomain === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <span>Todos os Tipos</span>
                    <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px] h-4 font-mono", matrixDomain === "all" ? "border-primary-foreground/40 text-primary-foreground" : "border-border/60")}>
                      {ALL_NOTIFICATION_TYPES.length}
                    </Badge>
                  </button>

                  {NOTIFICATION_DOMAINS.map((dom) => {
                    const count = ALL_NOTIFICATION_TYPES.filter(
                      (t) => getNotificationTypeInfo(t).domain === dom.id
                    ).length;
                    const isSelected = matrixDomain === dom.id;
                    return (
                      <button
                        key={dom.id}
                        type="button"
                        onClick={() => setMatrixDomain(dom.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                          isSelected
                            ? "bg-card text-foreground shadow-xs border border-border"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        )}
                        title={dom.description}
                      >
                        <span>{dom.label}</span>
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4 font-mono">
                          {count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                {/* BUSCADORES */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={matrixSearch}
                      onChange={(e) => setMatrixSearch(e.target.value)}
                      placeholder="Buscar tipo..."
                      className="pl-9 h-8 text-xs bg-background/60 border-border/60 rounded-xl"
                    />
                  </div>

                  <div className="relative w-full sm:w-48">
                    <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={matrixRoleSearch}
                      onChange={(e) => setMatrixRoleSearch(e.target.value)}
                      placeholder="Filtrar cargo..."
                      className="pl-9 h-8 text-xs bg-background/60 border-border/60 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* BARRA DE AÇÕES EM LOTE PARA TIPOS VISÍVEIS */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/20 border border-border/50">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    Ações nos Tipos Visíveis ({visibleTypes.length}):
                  </span>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkMarkVisible("enable")}
                    disabled={!canManageRules || visibleTypes.length === 0}
                    className="h-7 text-[11px] font-bold gap-1 rounded-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <CheckSquare className="h-3 w-3" />
                    Marcar Visíveis
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkMarkVisible("disable")}
                    disabled={!canManageRules || visibleTypes.length === 0}
                    className="h-7 text-[11px] font-bold gap-1 rounded-lg border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                  >
                    <Square className="h-3 w-3" />
                    Desmarcar Visíveis
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkMarkVisible("invert")}
                    disabled={!canManageRules || visibleTypes.length === 0}
                    className="h-7 text-[11px] font-bold gap-1 rounded-lg border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    Inverter Visíveis
                  </Button>
                </div>

                <div className="text-[11px] text-muted-foreground font-mono">
                  {visibleRoles.length} cargos • {visibleTags.length} tags exibidos
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    <th className="p-3.5 font-black uppercase text-muted-foreground w-64 sticky left-0 bg-card/95 backdrop-blur-md z-10 border-r border-border/40">
                      Cargo / Tag da Facção
                    </th>
                    {visibleTypes.map((nType) => {
                      const info = getNotificationTypeInfo(nType);
                      const currentOpts = rules.typeOptions?.[nType] || DEFAULT_TYPE_DELIVERY_OPTIONS[nType];

                      return (
                        <th key={nType} className="p-2.5 font-extrabold text-center uppercase tracking-wider min-w-[110px]">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono text-[10.5px]",
                                info.badgeBg,
                                info.badgeColor,
                                info.borderColor
                              )}
                              title={info.description}
                            >
                              {renderTypeIconHelper(nType, "h-3 w-3")}
                              {info.label}
                            </span>

                            <button
                              type="button"
                              onClick={() => openTypeOptionsModal(nType)}
                              className="inline-flex items-center gap-1 text-[9.5px] font-mono text-muted-foreground hover:text-primary transition-colors py-0.5 px-1.5 rounded hover:bg-secondary/50"
                              title={`Configurar som (${currentOpts?.sound || "chime"}), toast e canais de "${info.label}"`}
                            >
                              <Settings2 className="h-2.5 w-2.5" />
                              <span>Opções</span>
                            </button>
                          </div>
                        </th>
                      );
                    })}
                    <th className="p-3 text-center font-extrabold uppercase text-muted-foreground w-28 sticky right-0 bg-card/95 backdrop-blur-md z-10 border-l border-border/40">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/40">
                  {/* SEÇÃO 1: CARGOS HIERÁRQUICOS */}
                  <tr className="bg-secondary/25">
                    <td colSpan={visibleTypes.length + 2} className="p-2.5 px-4 font-black uppercase tracking-wider text-[11px] text-primary flex items-center justify-between">
                      <span>Cargos da Hierarquia Twin Wheels ({visibleRoles.length})</span>
                      <span className="text-[10px] text-muted-foreground font-mono font-normal">Permissões granulares de recebimento</span>
                    </td>
                  </tr>

                  {visibleRoles.map((role) => {
                    const currentList = rules.roles[role.id] || [];
                    const allowedCount = currentList.length;
                    const isAll = allowedCount >= ALL_NOTIFICATION_TYPES.length;

                    return (
                      <tr key={role.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3.5 font-bold text-foreground sticky left-0 bg-card/95 backdrop-blur-md z-10 border-r border-border/40">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{role.label}</span>
                            <Badge variant="outline" className={cn("text-[9.5px] font-mono px-1.5 py-0 shrink-0", allowedCount > 0 ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-border/60 text-muted-foreground")}>
                              {allowedCount}/{ALL_NOTIFICATION_TYPES.length}
                            </Badge>
                          </div>
                        </td>

                        {visibleTypes.map((nType) => {
                          const isAllowed = currentList.includes(nType);
                          const info = getNotificationTypeInfo(nType);
                          return (
                            <td key={nType} className="p-2 text-center">
                              <button
                                type="button"
                                disabled={!canManageRules}
                                onClick={() => handleToggleRule("roles", role.id, nType)}
                                className={cn(
                                  "h-7 w-7 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer",
                                  isAllowed
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-xs hover:bg-emerald-500/30"
                                    : "bg-muted/25 text-muted-foreground/35 border-border/40 hover:bg-muted/50 hover:text-muted-foreground"
                                )}
                                title={isAllowed ? `${info.label}: Permitido para ${role.label}` : `${info.label}: Bloqueado para ${role.label}`}
                              >
                                {isAllowed ? <Check className="h-4 w-4" /> : <X className="h-3.5 w-3.5" />}
                              </button>
                            </td>
                          );
                        })}

                        <td className="p-2 text-center border-l border-border/40 sticky right-0 bg-card/95 backdrop-blur-md z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={!canManageRules}
                                className="h-6 text-[10px] px-2 font-mono text-muted-foreground hover:text-foreground gap-1"
                              >
                                <span>Opções</span>
                                <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-xs">
                              <DropdownMenuItem onClick={() => handleToggleRowAll("roles", role.id)} className="gap-2 cursor-pointer">
                                <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                                <span>{isAll ? "Desmarcar Todos" : "Marcar Todos"}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleInvertRow("roles", role.id)} className="gap-2 cursor-pointer">
                                <ArrowLeftRight className="h-3.5 w-3.5 text-purple-400" />
                                <span>Inverter Seleção</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenCopyModal("roles", role.id, role.label)} className="gap-2 cursor-pointer">
                                <Copy className="h-3.5 w-3.5 text-primary" />
                                <span>Copiar de outro cargo...</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}

                  {/* SEÇÃO 2: TAGS ESPECIAIS */}
                  <tr className="bg-secondary/25">
                    <td colSpan={visibleTypes.length + 2} className="p-2.5 px-4 font-black uppercase tracking-wider text-[11px] text-amber-400 flex items-center justify-between">
                      <span>Tags Especiais de Diretoria & Desenvolvimento ({visibleTags.length})</span>
                      <span className="text-[10px] text-muted-foreground font-mono font-normal">Cargos de auditoria e governança</span>
                    </td>
                  </tr>

                  {visibleTags.map((tag) => {
                    const currentList = rules.tags[tag.id] || [];
                    const allowedCount = currentList.length;
                    const isAll = allowedCount >= ALL_NOTIFICATION_TYPES.length;

                    return (
                      <tr key={tag.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3.5 sticky left-0 bg-card/95 backdrop-blur-md z-10 border-r border-border/40">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline" className={cn("text-[10px] font-bold py-0.5", tag.color)}>
                              {tag.label}
                            </Badge>
                            <Badge variant="outline" className={cn("text-[9.5px] font-mono px-1.5 py-0 shrink-0", allowedCount > 0 ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-border/60 text-muted-foreground")}>
                              {allowedCount}/{ALL_NOTIFICATION_TYPES.length}
                            </Badge>
                          </div>
                        </td>

                        {visibleTypes.map((nType) => {
                          const isAllowed = currentList.includes(nType);
                          const info = getNotificationTypeInfo(nType);
                          return (
                            <td key={nType} className="p-2 text-center">
                              <button
                                type="button"
                                disabled={!canManageRules}
                                onClick={() => handleToggleRule("tags", tag.id, nType)}
                                className={cn(
                                  "h-7 w-7 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer",
                                  isAllowed
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-xs hover:bg-emerald-500/30"
                                    : "bg-muted/25 text-muted-foreground/35 border-border/40 hover:bg-muted/50 hover:text-muted-foreground"
                                )}
                                title={isAllowed ? `${info.label}: Permitido para ${tag.label}` : `${info.label}: Bloqueado para ${tag.label}`}
                              >
                                {isAllowed ? <Check className="h-4 w-4" /> : <X className="h-3.5 w-3.5" />}
                              </button>
                            </td>
                          );
                        })}

                        <td className="p-2 text-center border-l border-border/40 sticky right-0 bg-card/95 backdrop-blur-md z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={!canManageRules}
                                className="h-6 text-[10px] px-2 font-mono text-muted-foreground hover:text-foreground gap-1"
                              >
                                <span>Opções</span>
                                <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 text-xs">
                              <DropdownMenuItem onClick={() => handleToggleRowAll("tags", tag.id)} className="gap-2 cursor-pointer">
                                <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                                <span>{isAll ? "Desmarcar Todos" : "Marcar Todos"}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleInvertRow("tags", tag.id)} className="gap-2 cursor-pointer">
                                <ArrowLeftRight className="h-3.5 w-3.5 text-purple-400" />
                                <span>Inverter Seleção</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenCopyModal("tags", tag.id, tag.label)} className="gap-2 cursor-pointer">
                                <Copy className="h-3.5 w-3.5 text-primary" />
                                <span>Copiar de outro cargo...</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* =========================================================================
              PAINEL DE CONFIGURAÇÕES DE ENTREGA, SONS & CANAIS POR TIPO
              ========================================================================= */}
          <Card className="border-border/80 bg-card/60 backdrop-blur-md shadow-xl">
            <CardHeader className="p-5 pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      Canais de Entrega, Sons & Opções Globais por Tipo
                      <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-primary/30 text-primary bg-primary/10">
                        {visibleTypes.length} Configurados
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Controle pop-ups na tela (toast), gravação na central de notificações (sino), espelhamento Discord e efeitos sonoros sci-fi em tempo real.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playNotificationSoundEffect("chime", 80)}
                    className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border/70"
                  >
                    <Play className="h-3.5 w-3.5 text-primary" />
                    Testar Som Padrão
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {visibleTypes.map((nType) => {
                  const info = getNotificationTypeInfo(nType);
                  const opts = rules.typeOptions?.[nType] || DEFAULT_TYPE_DELIVERY_OPTIONS[nType] || {
                    enabled: true,
                    showToast: true,
                    showBell: true,
                    sound: "chime",
                    soundVolume: 70,
                    severity: "info",
                    toastDuration: 5,
                    mirrorDiscord: false,
                  };

                  const soundLabel =
                    opts.sound === "chime"
                      ? "Cristal Chime"
                      : opts.sound === "success"
                      ? "Bipe Sucesso"
                      : opts.sound === "online"
                      ? "Radar Tático"
                      : opts.sound === "urgent"
                      ? "Alerta Urgente"
                      : opts.sound === "click"
                      ? "Clique Sutil"
                      : "Silencioso";

                  return (
                    <div
                      key={nType}
                      className="p-3.5 rounded-2xl bg-secondary/20 border border-border/60 hover:border-border transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        {/* HEADER DO CARD */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "p-2 rounded-xl border flex items-center justify-center",
                                info.badgeBg,
                                info.badgeColor,
                                info.borderColor
                              )}
                            >
                              {renderTypeIconHelper(nType, "h-4 w-4")}
                            </span>
                            <div>
                              <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                                {info.label}
                                <span className="text-[10px] font-mono text-muted-foreground font-normal">({nType})</span>
                              </h4>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">{info.description}</p>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openTypeOptionsModal(nType)}
                            className="h-7 w-7 p-0 rounded-lg border-border/60 text-muted-foreground hover:text-primary hover:bg-secondary/60 shrink-0"
                            title={`Editar opções de entrega de ${info.label}`}
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* CANAIS STATUS */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md border flex items-center gap-1",
                              opts.showToast
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                                : "bg-muted/30 text-muted-foreground border-border/40"
                            )}
                          >
                            Toast: {opts.showToast ? `${opts.toastDuration || 5}s` : "OFF"}
                          </span>

                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md border flex items-center gap-1",
                              opts.showBell
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-bold"
                                : "bg-muted/30 text-muted-foreground border-border/40"
                            )}
                          >
                            Sino: {opts.showBell ? "ON" : "OFF"}
                          </span>

                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md border flex items-center gap-1",
                              opts.mirrorDiscord
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30 font-bold"
                                : "bg-muted/30 text-muted-foreground border-border/40"
                            )}
                          >
                            Discord: {opts.mirrorDiscord ? "ON" : "OFF"}
                          </span>
                        </div>
                      </div>

                      {/* RODAPÉ DO CARD: SOM & SEVERIDADE */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => playNotificationSoundEffect(opts.sound, opts.soundVolume)}
                            disabled={opts.sound === "none"}
                            className={cn(
                              "h-6 px-2 rounded-lg border text-[10px] font-mono font-bold inline-flex items-center gap-1 transition-all",
                              opts.sound !== "none"
                                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 cursor-pointer shadow-2xs"
                                : "bg-muted/20 text-muted-foreground/40 border-border/30 cursor-not-allowed"
                            )}
                            title={opts.sound !== "none" ? `Clique para ouvir som: ${soundLabel} (${opts.soundVolume}%)` : "Sem som"}
                          >
                            <Volume2 className="h-2.5 w-2.5" />
                            <span>{soundLabel}</span>
                          </button>
                        </div>

                        <Badge
                          variant="outline"
                          className={cn("text-[9.5px] font-mono uppercase px-1.5 py-0", getCategoryBadge(opts.severity).color)}
                        >
                          {opts.severity}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            ABA 2: GERENCIADOR AVANÇADO (CRUD, TOGGLE, INSPEÇÃO JSON)
            ========================================================================= */}
        <TabsContent value="manager" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/50 p-3 rounded-2xl border border-border/60">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar no sistema..."
                  className="pl-9 h-9 text-xs bg-background/70 border-border/70 rounded-xl"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="h-9 text-xs bg-background/70 border-border/70 rounded-xl min-w-[110px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="inactive">Pausadas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 text-xs bg-background/70 border-border/70 rounded-xl min-w-[120px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  {ALL_NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {getNotificationTypeInfo(t).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs bg-background/70 border-border/70 rounded-xl min-w-[120px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="alert">Alerta</SelectItem>
                  <SelectItem value="error">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  disabled={notifications.length === 0}
                  className="h-9 text-xs font-semibold gap-1.5 rounded-xl border-border/70"
                  title="Exportar todas as notificações em formato JSON"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Exportar JSON</span>
                </Button>
              )}

              <Button
                size="sm"
                disabled={!canCreate}
                onClick={openCreateModal}
                className="h-9 text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Criar Notificação Dev
              </Button>
            </div>
          </div>

          {isLoadingNotifs ? (
            <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-semibold">Carregando banco de notificações...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border/70 bg-card/30 space-y-2">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-bold">Nenhum registro correspondente aos filtros.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredList.map((notif) => {
                const typeInfo = getNotificationTypeInfo(notif.type);
                const categoryBadge = getCategoryBadge(notif.category);
                const isActive = notif.is_active !== false;

                return (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex flex-col md:flex-row items-start md:items-center justify-between p-3.5 rounded-xl border transition-all duration-150 gap-3 text-xs",
                      isActive
                        ? "bg-card/60 hover:bg-card/90 border-border/80"
                        : "bg-muted/20 border-border/40 opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "p-2 rounded-lg border shrink-0 mt-0.5",
                          typeInfo.badgeBg,
                          typeInfo.badgeColor,
                          typeInfo.borderColor
                        )}
                      >
                        <Bell className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 space-y-0.5 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] font-mono uppercase font-bold py-0", typeInfo.badgeBg, typeInfo.badgeColor)}
                          >
                            {typeInfo.label}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={cn("text-[9px] font-semibold py-0", categoryBadge.bg, categoryBadge.text)}
                          >
                            {categoryBadge.label}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-mono py-0",
                              isActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            )}
                          >
                            {isActive ? "Ativa" : "Pausada"}
                          </Badge>

                          <span className="font-mono text-[10px] text-muted-foreground">ID: {notif.id}</span>
                        </div>

                        <h4 className="text-xs font-bold text-foreground truncate">{notif.title}</h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{notif.message}</p>

                        <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-muted-foreground/80 pt-0.5 font-mono">
                          <span>Destinatário: {notif.user_id}</span>
                          <span>
                            Lidos: {Array.isArray(notif.read_by) ? notif.read_by.length : 0}
                          </span>
                          <span>Criado: {formatRelativeTime(notif.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* AÇÕES DEV */}
                    <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                        onClick={() => setInspectNotif(notif)}
                        title="Inspecionar Payload JSON"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7 rounded-lg",
                          isActive ? "text-emerald-400 hover:text-amber-400" : "text-muted-foreground hover:text-emerald-400"
                        )}
                        onClick={() => handleToggleActive(notif)}
                        title={isActive ? "Pausar" : "Ativar"}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>

                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary rounded-lg"
                          onClick={() => openEditModal(notif)}
                          title="Editar"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                          onClick={() => handleDeleteNotif(notif.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* =========================================================================
            ABA 3: SIMULADOR DE PUSH EM TEMPO REAL
            ========================================================================= */}
        <TabsContent value="simulator" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PAINEL DE CONTROLE DO SIMULADOR */}
            <Card className="md:col-span-2 border-border/80 bg-card/60 backdrop-blur-md">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  Disparador de Simulações em Tempo Real
                </CardTitle>
                <CardDescription className="text-xs">
                  Injete eventos no barramento de WebSocket para testar o comportamento visual, sonoro e os filtros de cargo.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Tipo de Evento</Label>
                    <Select value={simType} onValueChange={(v) => setSimType(v as NotificationType)}>
                      <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_NOTIFICATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {getNotificationTypeInfo(t).label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground">Categoria / Severidade</Label>
                    <Select value={simCategory} onValueChange={(v) => setSimCategory(v as NotificationCategory)}>
                      <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="success">Sucesso</SelectItem>
                        <SelectItem value="warning">Aviso</SelectItem>
                        <SelectItem value="alert">Alerta</SelectItem>
                        <SelectItem value="error">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Título do Evento</Label>
                  <Input
                    value={simTitle}
                    onChange={(e) => setSimTitle(e.target.value)}
                    className="h-9 text-xs bg-background/80 border-border/80"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Mensagem do Evento</Label>
                  <Textarea
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    rows={3}
                    className="text-xs bg-background/80 border-border/80 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Link / Rota Interna</Label>
                  <Input
                    value={simLink}
                    onChange={(e) => setSimLink(e.target.value)}
                    className="h-9 text-xs bg-background/80 border-border/80 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => playNotificationChimeSound(80)}
                    className="text-xs font-semibold gap-1.5 rounded-xl border-border/70"
                  >
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                    Ouvir Som Chime
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={!canSimulate || isSimulating}
                    onClick={handleRunSimulation}
                    className="text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-md hover:opacity-95"
                  >
                    {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {isSimulating ? "Emitindo..." : "Disparar Push Simulador"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* PRESETS RÁPIDOS */}
            <Card className="border-border/80 bg-card/60 backdrop-blur-md space-y-3">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Cenários Rápidos
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecione um cenário para preencher instantaneamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    handleApplySimPreset({
                      type: "live",
                      category: "alert",
                      title: "🔴 Streamer do grupo Ao Vivo na Twitch!",
                      message: "Transmitindo 'Ação Policial na Favela • Twin Wheels' com mais de 50 espectadores.",
                      link: "/lives",
                    })
                  }
                  className="w-full text-left p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-all text-xs space-y-1"
                >
                  <p className="font-bold text-rose-400 flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5" />
                    Transmissão Ao Vivo (Live)
                  </p>
                  <p className="text-[11px] text-muted-foreground">Testa detecção automática e reprodução sonora.</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplySimPreset({
                      type: "announcement",
                      category: "error",
                      title: "🚨 COMUNICADO EMERGENCIAL — DEFESA DE BASE",
                      message: "Todos os membros disponíveis devem se apresentar imediatamente na sede do grupo.",
                      link: "/comunicados",
                    })
                  }
                  className="w-full text-left p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-all text-xs space-y-1"
                >
                  <p className="font-bold text-rose-400 flex items-center gap-1.5">
                    <Megaphone className="h-3.5 w-3.5" />
                    Comunicado Crítico de Ataque
                  </p>
                  <p className="text-[11px] text-muted-foreground">Testa severidade urgente e alta prioridade.</p>
                </button>

                {canEmergencyAlert && (
                  <button
                    type="button"
                    onClick={handleEmergencyAlert}
                    className="w-full text-left p-3 rounded-xl border border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 transition-all text-xs space-y-1 shadow-xs"
                  >
                    <p className="font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertOctagon className="h-3.5 w-3.5" />
                      Emitir Alerta de Emergência Global Imediato
                    </p>
                    <p className="text-[11px] text-muted-foreground">Dispara push crítico em tempo real para toda a organização com som máximo.</p>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    handleApplySimPreset({
                      type: "sale",
                      category: "success",
                      title: "💰 Grande Venda Concluída no Baú",
                      message: "Venda de armamentos no valor de R$ 350.000,00 registrada com sucesso.",
                      link: "/vendas",
                    })
                  }
                  className="w-full text-left p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-all text-xs space-y-1"
                >
                  <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Venda de Alto Valor
                  </p>
                  <p className="text-[11px] text-muted-foreground">Testa notificação de conquista financeira.</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplySimPreset({
                      type: "stock_alert",
                      category: "error",
                      title: "⚠️ Alerta de Estoque Crítico — Baú 1",
                      message: "Lockpick e Algemas atingiram nível crítico (apenas 2 unidades restantes no armazém).",
                      link: "/baus",
                    })
                  }
                  className="w-full text-left p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-all text-xs space-y-1"
                >
                  <p className="font-bold text-orange-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Estoque Crítico / Baixo
                  </p>
                  <p className="text-[11px] text-muted-foreground">Testa alerta urgente de reposição de suprimentos.</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplySimPreset({
                      type: "security_alert",
                      category: "error",
                      title: "🛡️ Tentativa Suspeita Bloqueada",
                      message: "Tentativa de acesso com credenciais inválidas detectada e bloqueada pelo firewall.",
                      link: "/dev/auditoria",
                    })
                  }
                  className="w-full text-left p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-all text-xs space-y-1"
                >
                  <p className="font-bold text-rose-500 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Alerta de Segurança Crítico
                  </p>
                  <p className="text-[11px] text-muted-foreground">Testa som sirene e severidade urgente com alerta vermelho.</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplySimPreset({
                      type: "cash_fund",
                      category: "warning",
                      title: "💵 Retirada Financeira do Caixa Central",
                      message: "Saque de R$ 150.000,00 efetuado para compra de frotas e peças de oficina.",
                      link: "/fundo-caixa",
                    })
                  }
                  className="w-full text-left p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-all text-xs space-y-1"
                >
                  <p className="font-bold text-yellow-400 flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5" />
                    Movimentação de Caixa / Finanças
                  </p>
                  <p className="text-[11px] text-muted-foreground">Testa aviso financeiro com confirmação.</p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplySimPreset({
                      type: "achievement",
                      category: "success",
                      title: "🏆 Meta Semanal Concluída com Sucesso!",
                      message: "A facção atingiu 100% da arrecadação semanal! Parabéns a todos os envolvidos.",
                      link: "/metas",
                    })
                  }
                  className="w-full text-left p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-all text-xs space-y-1"
                >
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5" />
                    Conquista & Meta Batida
                  </p>
                  <p className="text-[11px] text-muted-foreground">Testa celebração, troféu e som harmônico.</p>
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =========================================================================
            ABA 4: TELEMETRIA & DIAGNÓSTICO
            ========================================================================= */}
        <TabsContent value="telemetry" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-semibold">Total no Banco</p>
                <h3 className="text-2xl font-black text-foreground mt-1">{stats.total}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Notificações armazenadas</p>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-semibold">Emissão Ativa</p>
                <h3 className="text-2xl font-black text-emerald-400 mt-1">{stats.active}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Prontas para entrega</p>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-semibold">Realtime Channel</p>
                <h3 className="text-sm font-black text-primary mt-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  tw_notifications_realtime_sync
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">WebSocket conectado</p>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-semibold">Pausadas</p>
                <h3 className="text-2xl font-black text-amber-400 mt-1">{stats.inactive}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pausadas no sistema</p>
              </CardContent>
            </Card>
          </div>

          {/* DISTRIBUIÇÃO POR TIPO */}
          <Card className="border-border/80 bg-card/60">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold">Distribuição por Tipo de Evento</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {ALL_NOTIFICATION_TYPES.map((t) => {
                  const info = getNotificationTypeInfo(t);
                  const count = stats.typeCounts[t] || 0;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

                  return (
                    <div key={t} className="p-3 rounded-xl bg-secondary/30 border border-border/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-[11px] font-bold", info.badgeColor)}>{info.label}</span>
                        <span className="text-xs font-mono font-black">{count}</span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono">{pct}% do total</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            ABA 5: PURGE & MANUTENÇÃO EM MASSA
            ========================================================================= */}
        <TabsContent value="purge" className="space-y-6">
          <Card className="border-rose-500/30 bg-card/60 backdrop-blur-md">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-black text-rose-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Zona de Limpeza em Massa (Purge)
              </CardTitle>
              <CardDescription className="text-xs">
                Exclua notificações antigas, redefina históricos ou faça faxina seletiva por categoria no banco de dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Filtrar Tipo para Limpeza</Label>
                  <Select value={purgeType} onValueChange={setPurgeType}>
                    <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      {ALL_NOTIFICATION_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {getNotificationTypeInfo(t).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Filtrar Categoria</Label>
                  <Select value={purgeCategory} onValueChange={setPurgeCategory}>
                    <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Categorias</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="warning">Aviso</SelectItem>
                      <SelectItem value="alert">Alerta</SelectItem>
                      <SelectItem value="error">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Idade Mínima</Label>
                  <Select value={purgeDays} onValueChange={setPurgeDays}>
                    <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Qualquer Data (Todas)</SelectItem>
                      <SelectItem value="7">Mais antigas que 7 dias</SelectItem>
                      <SelectItem value="15">Mais antigas que 15 dias</SelectItem>
                      <SelectItem value="30">Mais antigas que 30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                <p className="font-bold">Aviso de Exclusão Irreversível:</p>
                <p className="text-[11px] mt-0.5 text-rose-200/80">
                  Ao executar o Purge, os registros serão excluídos definitivamente da memória e do Supabase para todos os usuários do grupo.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isPurging}
                  onClick={handleRunPurge}
                  className="text-xs font-bold gap-2 rounded-xl"
                >
                  {isPurging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  {isPurging ? "Executando Purge..." : "Executar Purge de Notificações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DEV */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl">
          <div className="p-6 pb-4 border-b border-border/60 bg-muted/20">
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              {editingNotif ? "Editor Técnico de Notificação" : "Criar Notificação Dev"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Crie notificações com metadados detalhados, alvos de cargos e links profundos.
            </DialogDescription>
          </div>

          <form onSubmit={handleSaveNotif} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Título *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-9 text-xs bg-background/80 border-border/80"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Mensagem *</Label>
              <Textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={3}
                className="text-xs bg-background/80 border-border/80 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Tipo</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as NotificationType)}>
                  <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_NOTIFICATION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {getNotificationTypeInfo(t).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Categoria</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as NotificationCategory)}>
                  <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                    <SelectItem value="error">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Link / Rota</Label>
              <Input
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                placeholder="/lives, /metas, /vendas"
                className="h-9 text-xs bg-background/80 border-border/80 font-mono"
              />
            </div>

            {/* METADADOS JSON */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Metadados JSON Adicionais (Opcional)</Label>
                <span className="text-[10px] text-muted-foreground font-mono">Formato objeto</span>
              </div>
              <Textarea
                value={formMetadataJson}
                onChange={(e) => setFormMetadataJson(e.target.value)}
                placeholder='{ "custom_key": "custom_val" }'
                rows={3}
                className="text-xs font-mono bg-background/80 border-border/80 resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/20 border border-border/60">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground">Ativa para Entrega</Label>
                <p className="text-[11px] text-muted-foreground">Se falso, fica invisível nos clientes comuns.</p>
              </div>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>

            <DialogFooter className="pt-3 border-t border-border/40 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-muted-foreground"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSavingNotif}
                className="text-xs font-bold gap-2 bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-95"
              >
                {isSavingNotif ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {isSavingNotif ? "Salvando..." : "Salvar Notificação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL DE INSPEÇÃO JSON */}
      <Dialog open={!!inspectNotif} onOpenChange={(o) => !o && setInspectNotif(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl">
          <div className="p-6 pb-3 border-b border-border/60 flex items-center justify-between">
            <DialogTitle className="text-sm font-black flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              Inspeção de Payload JSON
            </DialogTitle>
            {inspectNotif && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(inspectNotif, null, 2));
                  toast.success("JSON copiado para a área de transferência!");
                }}
                className="h-7 text-[11px] gap-1"
              >
                <Copy className="h-3 w-3" />
                Copiar
              </Button>
            )}
          </div>

          <div className="p-6">
            <pre className="p-4 rounded-xl bg-background/90 border border-border/80 text-[11px] font-mono overflow-x-auto max-h-[60vh] scrollbar-thin text-foreground/90">
              {inspectNotif ? JSON.stringify(inspectNotif, null, 2) : ""}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: OPÇÕES DE ENTREGA & SONS DO TIPO DE NOTIFICAÇÃO
          ========================================================================= */}
      <Dialog open={isTypeOptionsOpen} onOpenChange={setIsTypeOptionsOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl">
          {selectedTypeForOptions && (
            <div>
              {/* HEADER DO MODAL */}
              <div className="p-6 pb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center justify-center",
                      getNotificationTypeInfo(selectedTypeForOptions).badgeBg,
                      getNotificationTypeInfo(selectedTypeForOptions).badgeColor,
                      getNotificationTypeInfo(selectedTypeForOptions).borderColor
                    )}
                  >
                    {renderTypeIconHelper(selectedTypeForOptions, "h-5 w-5")}
                  </div>
                  <div>
                    <DialogTitle className="text-base font-black flex items-center gap-2">
                      Opções de Entrega: {getNotificationTypeInfo(selectedTypeForOptions).label}
                      <span className="text-xs font-mono text-muted-foreground font-normal">({selectedTypeForOptions})</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">
                      {getNotificationTypeInfo(selectedTypeForOptions).description}
                    </DialogDescription>
                  </div>
                </div>
              </div>

              {/* CORPO DE CONFIGURAÇÕES */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* 1. CANAIS DE ENTREGA */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-primary" />
                    Canais de Distribuição
                  </h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground">Pop-up Flutuante (Toast)</Label>
                        <p className="text-[11px] text-muted-foreground">Exibe balão sonoro e visual no canto da tela do usuário.</p>
                      </div>
                      <Switch
                        checked={editingDeliveryOptions.showToast}
                        onCheckedChange={(v) =>
                          setEditingDeliveryOptions((prev) => ({ ...prev, showToast: v }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground">Central de Notificações / Sino</Label>
                        <p className="text-[11px] text-muted-foreground">Registra no histórico persistente do cabeçalho para leitura posterior.</p>
                      </div>
                      <Switch
                        checked={editingDeliveryOptions.showBell}
                        onCheckedChange={(v) =>
                          setEditingDeliveryOptions((prev) => ({ ...prev, showBell: v }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground">Espelhar no Discord Webhook</Label>
                        <p className="text-[11px] text-muted-foreground">Envia mensagem espelhada para o canal integrado no Discord.</p>
                      </div>
                      <Switch
                        checked={editingDeliveryOptions.mirrorDiscord}
                        onCheckedChange={(v) =>
                          setEditingDeliveryOptions((prev) => ({ ...prev, mirrorDiscord: v }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* 2. EFEITOS SONOROS SCI-FI */}
                <div className="space-y-3 pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                      Alerta Sonoro & Áudio Tático
                    </h4>
                    <span className="text-[10px] font-mono text-muted-foreground">Web Audio API Sci-Fi</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Efeito Sonoro</Label>
                      <Select
                        value={editingDeliveryOptions.sound}
                        onValueChange={(v) =>
                          setEditingDeliveryOptions((prev) => ({ ...prev, sound: v as any }))
                        }
                      >
                        <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chime">Cristal Chime (Futurista / Suave)</SelectItem>
                          <SelectItem value="success">Bipe Harmônico (Sucesso / Conquista)</SelectItem>
                          <SelectItem value="online">Radar Tático (Pulso Sci-Fi)</SelectItem>
                          <SelectItem value="urgent">Alerta Urgente (Grave / Sirene)</SelectItem>
                          <SelectItem value="click">Clique Tático (Mecânico Sutil)</SelectItem>
                          <SelectItem value="none">Silencioso (Sem Alerta Sonoro)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground">Volume do Alerta</Label>
                        <span className="text-[11px] font-mono font-bold text-primary">
                          {editingDeliveryOptions.sound === "none" ? "Mudo" : `${editingDeliveryOptions.soundVolume}%`}
                        </span>
                      </div>
                      <div className="pt-2">
                        <Slider
                          disabled={editingDeliveryOptions.sound === "none"}
                          value={[editingDeliveryOptions.soundVolume]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={([val]) =>
                            setEditingDeliveryOptions((prev) => ({ ...prev, soundVolume: val }))
                          }
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={editingDeliveryOptions.sound === "none"}
                    onClick={() =>
                      playNotificationSoundEffect(
                        editingDeliveryOptions.sound,
                        editingDeliveryOptions.soundVolume
                      )
                    }
                    className="w-full h-8 text-xs font-bold gap-2 rounded-xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Ouvir Prévia do Som Selecionado ({editingDeliveryOptions.sound})
                  </Button>
                </div>

                {/* 3. SEVERIDADE & DURAÇÃO */}
                <div className="space-y-3 pt-3 border-t border-border/40">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Severidade & Duração do Toast
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Severidade Padrão</Label>
                      <Select
                        value={editingDeliveryOptions.severity}
                        onValueChange={(v) =>
                          setEditingDeliveryOptions((prev) => ({ ...prev, severity: v as any }))
                        }
                      >
                        <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info (Azul Celeste)</SelectItem>
                          <SelectItem value="success">Sucesso (Verde Esmeralda)</SelectItem>
                          <SelectItem value="warning">Atenção (Âmbar)</SelectItem>
                          <SelectItem value="alert">Alerta Operacional (Laranja)</SelectItem>
                          <SelectItem value="error">Urgente / Crítico (Rubi)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-foreground">Duração na Tela</Label>
                      <Select
                        value={String(editingDeliveryOptions.toastDuration || 5)}
                        onValueChange={(v) =>
                          setEditingDeliveryOptions((prev) => ({
                            ...prev,
                            toastDuration: Number(v),
                          }))
                        }
                      >
                        <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Segundos (Rápido)</SelectItem>
                          <SelectItem value="5">5 Segundos (Padrão)</SelectItem>
                          <SelectItem value="8">8 Segundos (Destaque)</SelectItem>
                          <SelectItem value="12">12 Segundos (Prolongado)</SelectItem>
                          <SelectItem value="15">15 Segundos (Máximo)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER DO MODAL */}
              <div className="p-4 px-6 border-t border-border/50 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetCurrentTypeDeliveryOptions}
                  className="text-xs text-muted-foreground hover:text-foreground h-8"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Restaurar Padrão Deste Tipo
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTypeOptionsOpen(false)}
                    className="text-xs h-8"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveTypeDeliveryOptions}
                    className="text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-95 h-8"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Salvar Opções
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: COPIAR PERMISSÕES DE OUTRO CARGO
          ========================================================================= */}
      <Dialog open={copyModalState.open} onOpenChange={(open) => setCopyModalState((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md p-6 border-border/80 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black flex items-center gap-2">
              <Copy className="h-4 w-4 text-primary" />
              Copiar Permissões de Notificação
            </DialogTitle>
            <DialogDescription className="text-xs">
              Copie instantaneamente todos os tipos de notificações habilitados de outro cargo ou tag para <strong className="text-foreground">{copyModalState.targetLabel}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Cargo ou Tag de Origem (Copiar de:)</Label>
              <Select
                value={copyModalState.sourceSubject}
                onValueChange={(v) =>
                  setCopyModalState((prev) => ({ ...prev, sourceSubject: v }))
                }
              >
                <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                  <SelectValue placeholder="Selecione o cargo de origem..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header_roles" disabled className="font-bold text-[10px] uppercase text-primary">
                    -- Cargos da Hierarquia --
                  </SelectItem>
                  {allRolesCombined
                    .filter((r) => r.id !== copyModalState.targetId)
                    .map((r) => {
                      const count = (rules.roles[r.id] || []).length;
                      return (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label} ({count} tipos permitidos)
                        </SelectItem>
                      );
                    })}

                  <SelectItem value="header_tags" disabled className="font-bold text-[10px] uppercase text-amber-400">
                    -- Tags Especiais --
                  </SelectItem>
                  {TAGS_LIST
                    .filter((t) => t.id !== copyModalState.targetId)
                    .map((t) => {
                      const count = (rules.tags[t.id] || []).length;
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label} ({count} tipos permitidos)
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-xl bg-secondary/25 border border-border/60 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Como funciona a cópia:
              </p>
              <p>As permissões existentes de "{copyModalState.targetLabel}" serão substituídas pelas do cargo selecionado acima. Para salvar definitivamente, clique em "Salvar Matriz" na tela principal.</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCopyModalState((prev) => ({ ...prev, open: false }))}
              className="text-xs h-8"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteCopy}
              disabled={!copyModalState.sourceSubject}
              className="text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-95 h-8"
            >
              <Check className="h-3.5 w-3.5" />
              Copiar e Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
