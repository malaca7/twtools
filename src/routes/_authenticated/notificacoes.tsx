import React, { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  ExternalLink,
  Inbox,
  LifeBuoy,
  MessageSquare,
  Calendar,
  Target,
  Package,
  TrendingUp,
  Megaphone,
  UserPlus,
  Check,
  Sparkles,
  Search,
  SlidersHorizontal,
  Radio,
  Play,
  Settings2,
  History,
  MailCheck,
} from "lucide-react";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from "@/hooks/useNotifications";
import {
  getNotificationTypeInfo,
  getCategoryBadge,
  formatRelativeTime,
  type AppNotification,
  type NotificationType,
  type NotificationCategory,
} from "@/types/notifications";
import { cn } from "@/lib/utils";
import { playNotificationChimeSound } from "@/lib/sound-effects";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  component: MemberNotificationsPage,
});

function renderTypeIcon(type: NotificationType, className: string = "h-4 w-4") {
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
    case "announcement":
      return <Megaphone className={className} />;
    case "signup":
      return <UserPlus className={className} />;
    case "live":
      return <Radio className={cn(className, "text-rose-400 animate-pulse")} />;
    case "system":
    default:
      return <Bell className={className} />;
  }
}

export function MemberNotificationsPage() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  if (!hasPermission("view_notifications")) {
    return <NoAccess />;
  }

  const {
    notifications,
    unreadNotifications,
    unreadCount,
    hasUnread,
    soundEnabled,
    toggleSound,
    isLoading,
  } = useNotifications();

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();
  const clearAllMutation = useClearAllNotifications();

  // Filtros locais
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "history" | "preferences">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Preferências locais salvas em localStorage
  const [notifyLives, setNotifyLives] = useState(() => {
    return localStorage.getItem("pref_notify_lives") !== "false";
  });
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(() => {
    return localStorage.getItem("pref_notify_announcements") !== "false";
  });
  const [notifyTickets, setNotifyTickets] = useState(() => {
    return localStorage.getItem("pref_notify_tickets") !== "false";
  });
  const [soundVolume, setSoundVolume] = useState(() => {
    return Number(localStorage.getItem("pref_notify_volume") || "70");
  });

  const handleTogglePref = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val);
    localStorage.setItem(key, String(val));
    toast.success("Preferência pessoal atualizada!");
  };

  const handleTestSound = () => {
    playNotificationChimeSound(soundVolume);
    toast.info("Tocando efeito sonoro de alerta...", {
      description: `Volume definido em ${soundVolume}%.`,
    });
  };

  // Separação de lidas e não lidas
  const readNotifications = useMemo(() => {
    if (!user?.id) return [];
    return notifications.filter((n) => n.read_by?.includes(user.id));
  }, [notifications, user?.id]);

  // Filtragem avançada
  const filteredList = useMemo(() => {
    let list: AppNotification[] = [];
    if (activeTab === "unread") {
      list = unreadNotifications;
    } else if (activeTab === "history") {
      list = readNotifications;
    } else {
      list = notifications;
    }

    if (categoryFilter !== "all") {
      list = list.filter((n) => n.category === categoryFilter);
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
  }, [notifications, unreadNotifications, readNotifications, activeTab, categoryFilter, typeFilter, searchQuery]);

  const handleNotificationClick = (notif: AppNotification) => {
    if (user?.id && (!notif.read_by || !notif.read_by.includes(user.id))) {
      markAsReadMutation.mutate(notif.id);
    }
    if (notif.link) {
      navigate({ to: notif.link as any });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* CABEÇALHO */}
      <PageHeader
        title="Central de Notificações"
        description="Acompanhe comunicados, chamados, transmissões ao vivo e alertas da facção Twin Wheels em tempo real."
        icon={BellRing}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSound}
            className={cn(
              "gap-1.5 text-xs font-semibold rounded-xl border-border/70",
              soundEnabled ? "text-emerald-400 border-emerald-500/30" : "text-muted-foreground"
            )}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? "Som Ativo" : "Silencioso"}
          </Button>

          {hasUnread && (
            <Button
              variant="default"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="gap-1.5 text-xs font-bold rounded-xl bg-gradient-brand text-primary-foreground shadow-sm"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar Todas Lidas
            </Button>
          )}
        </div>
      </PageHeader>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Recebidas</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{notifications.length}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/50 text-foreground border border-border/40">
              <Bell className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Não Lidas</p>
              <h3 className="text-2xl font-black text-primary mt-0.5">{unreadCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Já Lidas / Histórico</p>
              <h3 className="text-2xl font-black text-muted-foreground mt-0.5">{readNotifications.length}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/40 text-muted-foreground border border-border/40">
              <MailCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Status do Som</p>
              <h3 className="text-sm font-bold text-foreground mt-1.5 flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", soundEnabled ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground")} />
                {soundEnabled ? "Ativado" : "Mudo"}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-secondary/50 text-foreground border border-border/40">
              <Volume2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS PRINCIPAIS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <TabsList className="bg-secondary/40 border border-border/60 p-1 rounded-xl">
            <TabsTrigger value="all" className="text-xs font-bold gap-1.5 rounded-lg data-[state=active]:bg-card">
              <Bell className="h-3.5 w-3.5" />
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs font-bold gap-1.5 rounded-lg data-[state=active]:bg-card">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Não Lidas ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs font-bold gap-1.5 rounded-lg data-[state=active]:bg-card">
              <History className="h-3.5 w-3.5" />
              Histórico ({readNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs font-bold gap-1.5 rounded-lg data-[state=active]:bg-card">
              <Settings2 className="h-3.5 w-3.5" />
              Preferências & Som
            </TabsTrigger>
          </TabsList>

          {activeTab !== "preferences" && notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
              className="text-xs text-muted-foreground hover:text-destructive gap-1.5 self-end sm:self-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar Notificações
            </Button>
          )}
        </div>

        {/* TAB DE PREFERÊNCIAS E PERSONALIZAÇÃO PESSOAL */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CONFIGURAÇÃO DE SONS */}
            <Card className="border-border/70 bg-card/60 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Volume2 className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Efeitos Sonoros & Chime</CardTitle>
                    <CardDescription className="text-xs">
                      Personalize os alertas audíveis ao receber notificações no navegador.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/20 border border-border/60">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-bold text-foreground">Sons de Alertas Ativados</Label>
                    <p className="text-xs text-muted-foreground">
                      Tocar som quando novas notificações ou transmissões ao vivo começarem.
                    </p>
                  </div>
                  <Switch checked={soundEnabled} onCheckedChange={toggleSound} />
                </div>

                <div className="space-y-2 p-3.5 rounded-xl bg-secondary/20 border border-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-foreground">Volume do Alerta</Label>
                    <span className="text-xs font-mono font-bold text-primary">{soundVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={soundVolume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setSoundVolume(v);
                      localStorage.setItem("pref_notify_volume", String(v));
                    }}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-muted-foreground">Teste a intensidade sonora</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestSound}
                      className="h-8 text-xs font-bold gap-1.5 rounded-lg border-border/70 hover:border-primary/40"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Testar Som
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PREFERÊNCIAS DE FILTRAGEM PESSOAL */}
            <Card className="border-border/70 bg-card/60 backdrop-blur-md">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Filtros de Alertas Pessoais</CardTitle>
                    <CardDescription className="text-xs">
                      Escolha quais categorias exibem notificações flutuantes e tocam som no seu perfil.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Radio className="h-3.5 w-3.5 text-rose-400" />
                      Alertas de Lives & Transmissões
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Receber alertas automáticos quando membros da facção ficarem online.
                    </p>
                  </div>
                  <Switch
                    checked={notifyLives}
                    onCheckedChange={(val) =>
                      handleTogglePref("pref_notify_lives", val, setNotifyLives)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-2">
                      <Megaphone className="h-3.5 w-3.5 text-blue-400" />
                      Comunicados da Liderança (CEO/Oficiais)
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Avisos importantes, diretrizes de operações e chamadas gerais.
                    </p>
                  </div>
                  <Switch
                    checked={notifyAnnouncements}
                    onCheckedChange={(val) =>
                      handleTogglePref("pref_notify_announcements", val, setNotifyAnnouncements)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/60">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-2">
                      <LifeBuoy className="h-3.5 w-3.5 text-amber-400" />
                      Chamados & Atendimentos
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Respostas a tickets e convocações individuais.
                    </p>
                  </div>
                  <Switch
                    checked={notifyTickets}
                    onCheckedChange={(val) =>
                      handleTogglePref("pref_notify_tickets", val, setNotifyTickets)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LISTAS: TODAS / NÃO LIDAS / HISTÓRICO */}
        {activeTab !== "preferences" && (
          <div className="space-y-4">
            {/* BARRA DE FILTROS E BUSCA */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por título, mensagem ou autor..."
                  className="pl-9 h-10 text-xs bg-card/60 border-border/70 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 text-xs bg-card/60 border-border/70 rounded-xl min-w-[130px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    <SelectItem value="info">Informativos</SelectItem>
                    <SelectItem value="success">Conquistas & Vendas</SelectItem>
                    <SelectItem value="warning">Avisos Importantes</SelectItem>
                    <SelectItem value="alert">Alertas Críticos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-10 text-xs bg-card/60 border-border/70 rounded-xl min-w-[130px]">
                    <SelectValue placeholder="Tipo de Notificação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Tipos</SelectItem>
                    <SelectItem value="live">Transmissões (Lives)</SelectItem>
                    <SelectItem value="announcement">Comunicados</SelectItem>
                    <SelectItem value="ticket">Chamados</SelectItem>
                    <SelectItem value="goal">Metas</SelectItem>
                    <SelectItem value="movement">Movimentações</SelectItem>
                    <SelectItem value="sale">Vendas</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* RENDERIZAÇÃO DA LISTA */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-3">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold">Carregando notificações...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-dashed border-border/70 bg-card/30 space-y-3">
                <div className="p-4 rounded-2xl bg-secondary/50 text-muted-foreground">
                  <Inbox className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-foreground">
                    {searchQuery || categoryFilter !== "all" || typeFilter !== "all"
                      ? "Nenhuma notificação encontrada com esses filtros"
                      : "Nenhuma notificação por aqui"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {searchQuery || categoryFilter !== "all" || typeFilter !== "all"
                      ? "Tente alterar os termos de pesquisa ou limpar os filtros de categoria e tipo."
                      : "Assim que houver novos comunicados ou atualizações, eles serão listados aqui em tempo real."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredList.map((notif) => {
                  const isRead = Boolean(user?.id && notif.read_by?.includes(user.id));
                  const typeInfo = getNotificationTypeInfo(notif.type);
                  const categoryBadge = getCategoryBadge(notif.category);

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer gap-3",
                        isRead
                          ? "bg-card/40 hover:bg-card/70 border-border/60"
                          : "bg-primary/5 hover:bg-primary/10 border-primary/30 shadow-md"
                      )}
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        {/* AVATAR / ÍCONE */}
                        <div className="relative shrink-0 mt-0.5 sm:mt-0">
                          {notif.sender_avatar ? (
                            <Avatar className="h-10 w-10 border border-border shadow-xs">
                              <AvatarImage src={notif.sender_avatar} />
                              <AvatarFallback
                                className={cn("text-xs font-bold", typeInfo.badgeBg, typeInfo.badgeColor)}
                              >
                                {renderTypeIcon(notif.type, "h-4 w-4")}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div
                              className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105",
                                typeInfo.badgeBg,
                                typeInfo.badgeColor,
                                typeInfo.borderColor
                              )}
                            >
                              {renderTypeIcon(notif.type, "h-5 w-5")}
                            </div>
                          )}

                          {!isRead && (
                            <span className="absolute -top-1 -left-1 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-80" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                            </span>
                          )}
                        </div>

                        {/* TEXTOS */}
                        <div className="min-w-0 space-y-1">
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

                            <h4
                              className={cn(
                                "text-sm truncate",
                                isRead ? "font-semibold text-foreground/90" : "font-black text-foreground"
                              )}
                            >
                              {notif.title}
                            </h4>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/80 pt-0.5">
                            {notif.sender_name && (
                              <span>
                                Remetente: <strong className="text-foreground/90">{notif.sender_name}</strong>
                              </span>
                            )}
                            <span className="font-mono">{formatRelativeTime(notif.created_at)}</span>
                            {isRead ? (
                              <span className="text-emerald-400/80 flex items-center gap-1">
                                <Check className="h-3 w-3" /> Lida
                              </span>
                            ) : (
                              <span className="text-primary font-bold">Nova</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AÇÕES */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {notif.link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-bold text-primary hover:text-primary gap-1 px-2.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notif);
                            }}
                          >
                            Acessar
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {!isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2.5 rounded-lg border-border/70"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (user?.id) markAsReadMutation.mutate(notif.id);
                            }}
                            title="Marcar como lida"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            Marcar Lida
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user?.id) deleteMutation.mutate(notif.id);
                          }}
                          title="Excluir notificação"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Tabs>
    </div>
  );
}
