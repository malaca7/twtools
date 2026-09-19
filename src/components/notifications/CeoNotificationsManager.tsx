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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  broadcastNotificationsRealtimeUpdate,
} from "@/lib/notifications-api";
import {
  type AppNotification,
  type NotificationType,
  type NotificationCategory,
  ALL_NOTIFICATION_TYPES,
  getNotificationTypeInfo,
  getCategoryBadge,
  formatRelativeTime,
} from "@/types/notifications";
import { ALL_LEVELS, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function CeoNotificationsManager() {
  const { user, profile, hasPermission } = useAuth();

  const canCreate = hasPermission("create_ceo_notification");
  const canEdit = hasPermission("edit_ceo_notification");
  const canDelete = hasPermission("delete_ceo_notification");
  const canToggle = hasPermission("toggle_ceo_notification_active");

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotif, setEditingNotif] = useState<AppNotification | null>(null);

  // Formulário
  const [formTitle, setFormTitle] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formType, setFormType] = useState<NotificationType>("announcement");
  const [formCategory, setFormCategory] = useState<NotificationCategory>("info");
  const [formLink, setFormLink] = useState("");
  const [formTargetMode, setFormTargetMode] = useState<"all" | "roles">("all");
  const [formSelectedRoles, setFormSelectedRoles] = useState<AppLevel[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllRawNotifications();
      setNotifications(data);
    } catch (err: any) {
      toast.error("Erro ao carregar notificações: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("tw_notifications_updated", handleUpdate);
    return () => window.removeEventListener("tw_notifications_updated", handleUpdate);
  }, []);

  const openCreateModal = () => {
    setEditingNotif(null);
    setFormTitle("");
    setFormMessage("");
    setFormType("announcement");
    setFormCategory("info");
    setFormLink("");
    setFormTargetMode("all");
    setFormSelectedRoles([]);
    setFormIsActive(true);
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
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.warning("Título e mensagem são obrigatórios.");
      return;
    }

    setIsSaving(true);
    try {
      const targetRoles = formTargetMode === "roles" && formSelectedRoles.length > 0 ? formSelectedRoles : undefined;

      if (editingNotif) {
        // Atualizar
        await updateAdminNotification(editingNotif.id, {
          title: formTitle.trim(),
          message: formMessage.trim(),
          type: formType,
          category: formCategory,
          link: formLink.trim() || undefined,
          target_roles: targetRoles,
          is_active: formIsActive,
        });
        toast.success("Notificação atualizada com sucesso!");
      } else {
        // Criar
        await createNotification({
          title: formTitle.trim(),
          message: formMessage.trim(),
          type: formType,
          category: formCategory,
          link: formLink.trim() || undefined,
          target_roles: targetRoles,
          sender_id: user?.id,
          sender_name: profile?.nickname || profile?.nome || "Liderança CEO",
          sender_avatar: profile?.avatar_url || profile?.discord_avatar_url,
          is_active: formIsActive,
        });
        toast.success("Notificação disparada com sucesso!");
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error("Erro ao salvar notificação: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (notif: AppNotification) => {
    const nextState = notif.is_active === false ? true : false;
    try {
      await toggleAdminNotificationActive(notif.id, nextState);
      toast.success(nextState ? "Notificação ativada!" : "Notificação pausada.");
      await loadData();
    } catch (err: any) {
      toast.error("Erro ao alterar status: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta notificação de toda a plataforma?")) {
      return;
    }
    try {
      await deleteAdminNotification(id);
      toast.success("Notificação excluída com sucesso.");
      await loadData();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const handlePushAgain = async (notif: AppNotification) => {
    try {
      broadcastNotificationsRealtimeUpdate(notif);
      toast.success(`Disparo push reemitido em tempo real para "${notif.title}"!`);
    } catch (err: any) {
      toast.error("Falha ao reemitir: " + err.message);
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
  }, [notifications, statusFilter, typeFilter, searchQuery]);

  const activeCount = useMemo(() => notifications.filter((n) => n.is_active !== false).length, [notifications]);
  const inactiveCount = useMemo(() => notifications.filter((n) => n.is_active === false).length, [notifications]);

  return (
    <div className="space-y-6">
      {/* STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total no Sistema</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{notifications.length}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/60 text-foreground border border-border/40">
              <Bell className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Notificações Ativas</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-0.5">{activeCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Pausadas / Inativas</p>
              <h3 className="text-2xl font-black text-amber-400 mt-0.5">{inactiveCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Power className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Público Alvo</p>
              <h3 className="text-sm font-bold text-foreground mt-1.5 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Grupo Twin Wheels
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Megaphone className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BARRA DE AÇÕES E FILTROS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/50 p-3.5 rounded-2xl border border-border/60 backdrop-blur-md">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por título, mensagem ou autor..."
              className="pl-9 h-9 text-xs bg-background/70 border-border/70 rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="h-9 text-xs bg-background/70 border-border/70 rounded-xl min-w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Somente Ativas</SelectItem>
              <SelectItem value="inactive">Pausadas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 text-xs bg-background/70 border-border/70 rounded-xl min-w-[130px]">
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
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-9 text-xs font-semibold gap-1.5 rounded-xl border-border/70"
            title="Recarregar"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Atualizar
          </Button>

          {canCreate && (
            <Button
              size="sm"
              onClick={openCreateModal}
              className="h-9 text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              Criar Notificação
            </Button>
          )}
        </div>
      </div>

      {/* LISTAGEM DE NOTIFICAÇÕES */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-muted-foreground space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold">Carregando painel de notificações...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-dashed border-border/70 bg-card/30 space-y-3">
          <div className="p-4 rounded-2xl bg-secondary/50 text-muted-foreground">
            <Bell className="h-8 w-8" />
          </div>
          <p className="text-base font-bold text-foreground">Nenhuma notificação encontrada</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Crie novos comunicados e alertas para serem entregues em tempo real a todos os membros ou cargos selecionados.
          </p>
          {canCreate && (
            <Button
              size="sm"
              onClick={openCreateModal}
              className="text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Criar Agora
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((notif) => {
            const typeInfo = getNotificationTypeInfo(notif.type);
            const categoryBadge = getCategoryBadge(notif.category);
            const isActive = notif.is_active !== false;

            return (
              <div
                key={notif.id}
                className={cn(
                  "flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl border transition-all duration-200 gap-4",
                  isActive
                    ? "bg-card/60 hover:bg-card/90 border-border/80 shadow-xs"
                    : "bg-muted/20 border-border/40 opacity-65"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl border shrink-0 mt-0.5",
                      typeInfo.badgeBg,
                      typeInfo.badgeColor,
                      typeInfo.borderColor
                    )}
                  >
                    <Bell className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono uppercase font-bold py-0",
                          typeInfo.badgeBg,
                          typeInfo.badgeColor,
                          typeInfo.borderColor
                        )}
                      >
                        {typeInfo.label}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold py-0",
                          categoryBadge.bg,
                          categoryBadge.text,
                          categoryBadge.border
                        )}
                      >
                        {categoryBadge.label}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono py-0 font-bold",
                          isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        )}
                      >
                        {isActive ? "Ativa" : "Pausada"}
                      </Badge>

                      <h4 className="text-sm font-black text-foreground">{notif.title}</h4>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground/80 pt-1">
                      {notif.sender_name && (
                        <span>
                          Autor: <strong className="text-foreground/90">{notif.sender_name}</strong>
                        </span>
                      )}
                      <span>
                        Público:{" "}
                        <strong className="text-foreground/90">
                          {notif.target_roles && notif.target_roles.length > 0
                            ? notif.target_roles.join(", ")
                            : "Todos os Membros"}
                        </strong>
                      </span>
                      {notif.link && (
                        <span className="font-mono text-primary flex items-center gap-1">
                          Link: {notif.link} <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                      <span className="font-mono">{formatRelativeTime(notif.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE CONTROLE */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                  {/* REENVIAR PUSH */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-bold text-primary hover:bg-primary/10 gap-1.5 px-2.5 rounded-lg"
                    onClick={() => handlePushAgain(notif)}
                    title="Disparar push em tempo real para os membros"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Disparar
                  </Button>

                  {/* PAUSAR / ATIVAR */}
                  {canToggle && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-lg",
                        isActive ? "text-emerald-400 hover:text-amber-400" : "text-muted-foreground hover:text-emerald-400"
                      )}
                      onClick={() => handleToggleActive(notif)}
                      title={isActive ? "Pausar notificação" : "Ativar notificação"}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                  )}

                  {/* EDITAR */}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                      onClick={() => openEditModal(notif)}
                      title="Editar notificação"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}

                  {/* EXCLUIR */}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                      onClick={() => handleDelete(notif.id)}
                      title="Excluir notificação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl">
          <div className="p-6 pb-4 border-b border-border/60 bg-muted/20">
            <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {editingNotif ? "Editar Notificação do Sistema" : "Nova Notificação / Comunicado"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Configure a mensagem, tipo, categoria e público-alvo que receberá este alerta.
            </DialogDescription>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Título da Notificação *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex.: Reunião Geral de Operações • Twin Wheels"
                className="h-9 text-xs bg-background/80 border-border/80"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Mensagem / Conteúdo *</Label>
              <Textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Descreva o comunicado ou instrução detalhada para o grupo..."
                rows={3}
                className="text-xs bg-background/80 border-border/80 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Tipo de Notificação</Label>
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
                <Label className="text-xs font-bold text-foreground">Categoria / Importância</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as NotificationCategory)}>
                  <SelectTrigger className="h-9 text-xs bg-background/80 border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Informativo</SelectItem>
                    <SelectItem value="success">Sucesso / Conquista</SelectItem>
                    <SelectItem value="warning">Atenção / Instrução</SelectItem>
                    <SelectItem value="alert">Alerta Geral</SelectItem>
                    <SelectItem value="error">Urgente / Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Link de Destino (Opcional)</Label>
              <Input
                value={formLink}
                onChange={(e) => setFormLink(e.target.value)}
                placeholder="Ex.: /comunicados, /metas, /lives, /vendas"
                className="h-9 text-xs bg-background/80 border-border/80 font-mono"
              />
            </div>

            {/* PÚBLICO ALVO */}
            <div className="space-y-2 p-3.5 rounded-xl bg-secondary/20 border border-border/60">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Público Destinatário</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTargetMode("all");
                      setFormSelectedRoles([]);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                      formTargetMode === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Todos os Membros
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTargetMode("roles")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                      formTargetMode === "roles"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Cargos Específicos
                  </button>
                </div>
              </div>

              {formTargetMode === "roles" && (
                <div className="pt-2 border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_LEVELS.map((lvl) => {
                    const isChecked = formSelectedRoles.includes(lvl);
                    return (
                      <label
                        key={lvl}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all",
                          isChecked
                            ? "bg-primary/10 border-primary/40 text-primary font-bold"
                            : "bg-background/40 border-border/60 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormSelectedRoles([...formSelectedRoles, lvl]);
                            } else {
                              setFormSelectedRoles(formSelectedRoles.filter((r) => r !== lvl));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="capitalize">{lvl}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STATUS ATIVO */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/20 border border-border/60">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground">Disparo e Status Ativo</Label>
                <p className="text-[11px] text-muted-foreground">
                  Se desativada, a notificação ficará pausada e não será entregue nos painéis.
                </p>
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
                disabled={isSaving}
                className="text-xs font-bold gap-2 bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-95"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {isSaving ? "Salvando..." : editingNotif ? "Salvar Alterações" : "Emitir Notificação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
