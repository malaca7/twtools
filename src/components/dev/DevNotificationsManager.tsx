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
  Download,
  AlertOctagon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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
  ALL_NOTIFICATION_TYPES,
  DEFAULT_NOTIFICATION_RULES,
  getNotificationTypeInfo,
  getCategoryBadge,
  formatRelativeTime,
} from "@/types/notifications";
import { ALL_LEVELS, type AppLevel } from "@/lib/permissions";
import { playNotificationChimeSound } from "@/lib/sound-effects";
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
  const [simMessage, setSimMessage] = useState("Transmitindo Operação RP da facção em alta definição na Twitch!");
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
    if (!confirm("Confirmar emissão de ALERTA DE EMERGÊNCIA GLOBAL para toda a facção?")) return;
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
            <CardHeader className="p-5 pb-3 border-b border-border/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-purple-400" />
                    Matriz de Permissão de Tipos de Notificação
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Permita ou bloqueie quais categorias de notificações cada Cargo e cada Tag têm direito de receber no sistema.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetRules}
                    disabled={!canManageRules || isSavingRules}
                    className="h-8 text-xs font-semibold gap-1 rounded-xl border-border/70"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restaurar Padrão
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleSaveRules}
                    disabled={!canManageRules || isSavingRules}
                    className="h-8 text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-95"
                  >
                    {isSavingRules ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {isSavingRules ? "Salvando..." : "Salvar Matriz"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30">
                    <th className="p-3.5 font-black uppercase text-muted-foreground w-48 sticky left-0 bg-card/95 backdrop-blur-md z-10">
                      Cargo / Tag
                    </th>
                    {ALL_NOTIFICATION_TYPES.map((nType) => {
                      const info = getNotificationTypeInfo(nType);
                      return (
                        <th key={nType} className="p-3 font-extrabold text-center uppercase tracking-wider">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono text-[10.5px]",
                              info.badgeBg,
                              info.badgeColor,
                              info.borderColor
                            )}
                          >
                            {info.label}
                          </span>
                        </th>
                      );
                    })}
                    <th className="p-3 text-center font-extrabold uppercase text-muted-foreground w-20">
                      Todos
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/40">
                  {/* SEÇÃO 1: CARGOS HIERÁRQUICOS */}
                  <tr className="bg-secondary/20">
                    <td colSpan={ALL_NOTIFICATION_TYPES.length + 2} className="p-2.5 px-4 font-black uppercase tracking-wider text-[11px] text-primary">
                      Cargos da Hierarquia Twin Wheels
                    </td>
                  </tr>

                  {ROLES_LIST.map((role) => {
                    const currentList = rules.roles[role.id] || [];
                    const isAll = currentList.length >= ALL_NOTIFICATION_TYPES.length;

                    return (
                      <tr key={role.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3.5 font-bold text-foreground sticky left-0 bg-card/95 backdrop-blur-md z-10 border-r border-border/40">
                          {role.label}
                        </td>

                        {ALL_NOTIFICATION_TYPES.map((nType) => {
                          const isAllowed = currentList.includes(nType);
                          return (
                            <td key={nType} className="p-2 text-center">
                              <button
                                type="button"
                                disabled={!canManageRules}
                                onClick={() => handleToggleRule("roles", role.id, nType)}
                                className={cn(
                                  "h-7 w-7 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer",
                                  isAllowed
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-xs"
                                    : "bg-muted/30 text-muted-foreground/40 border-border/40 hover:bg-muted/50"
                                )}
                                title={isAllowed ? `Permitido para ${role.id}` : `Bloqueado para ${role.id}`}
                              >
                                {isAllowed ? <Check className="h-4 w-4" /> : <X className="h-3.5 w-3.5" />}
                              </button>
                            </td>
                          );
                        })}

                        <td className="p-2 text-center border-l border-border/40">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!canManageRules}
                            onClick={() => handleToggleRowAll("roles", role.id)}
                            className="h-6 text-[10px] px-1.5 font-mono text-muted-foreground hover:text-primary"
                          >
                            {isAll ? "Desmarcar" : "Marcar"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* SEÇÃO 2: TAGS ESPECIAIS */}
                  <tr className="bg-secondary/20">
                    <td colSpan={ALL_NOTIFICATION_TYPES.length + 2} className="p-2.5 px-4 font-black uppercase tracking-wider text-[11px] text-amber-400">
                      Tags Especiais de Diretoria & Desenvolvimento
                    </td>
                  </tr>

                  {TAGS_LIST.map((tag) => {
                    const currentList = rules.tags[tag.id] || [];
                    const isAll = currentList.length >= ALL_NOTIFICATION_TYPES.length;

                    return (
                      <tr key={tag.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-3.5 sticky left-0 bg-card/95 backdrop-blur-md z-10 border-r border-border/40">
                          <Badge variant="outline" className={cn("text-[10px] font-bold py-0.5", tag.color)}>
                            {tag.label}
                          </Badge>
                        </td>

                        {ALL_NOTIFICATION_TYPES.map((nType) => {
                          const isAllowed = currentList.includes(nType);
                          return (
                            <td key={nType} className="p-2 text-center">
                              <button
                                type="button"
                                disabled={!canManageRules}
                                onClick={() => handleToggleRule("tags", tag.id, nType)}
                                className={cn(
                                  "h-7 w-7 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer",
                                  isAllowed
                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-xs"
                                    : "bg-muted/30 text-muted-foreground/40 border-border/40 hover:bg-muted/50"
                                )}
                              >
                                {isAllowed ? <Check className="h-4 w-4" /> : <X className="h-3.5 w-3.5" />}
                              </button>
                            </td>
                          );
                        })}

                        <td className="p-2 text-center border-l border-border/40">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!canManageRules}
                            onClick={() => handleToggleRowAll("tags", tag.id)}
                            className="h-6 text-[10px] px-1.5 font-mono text-muted-foreground hover:text-primary"
                          >
                            {isAll ? "Desmarcar" : "Marcar"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
                      title: "🔴 Streamer da Facção Ao Vivo na Twitch!",
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
                      message: "Todos os membros disponíveis devem se apresentar imediatamente na sede da facção.",
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
                  Ao executar o Purge, os registros serão excluídos definitivamente da memória e do Supabase para todos os usuários da facção.
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
    </div>
  );
}
