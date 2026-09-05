import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
} from "@/types/notifications";
import { cn } from "@/lib/utils";

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
    case "system":
    default:
      return <Bell className={className} />;
  }
}

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

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

  const displayList = activeTab === "unread" ? unreadNotifications : notifications;

  const handleNotificationClick = (notif: AppNotification) => {
    if (user?.id && (!notif.read_by || !notif.read_by.includes(user.id))) {
      markAsReadMutation.mutate(notif.id);
    }
    if (notif.link) {
      setOpen(false);
      navigate({ to: notif.link as any });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-all duration-200 outline-none hover:bg-secondary/60",
            hasUnread && "text-primary hover:text-primary"
          )}
          title={
            hasUnread
              ? `${unreadCount} nova(s) notificação(ões) em tempo real`
              : "Central de Notificações"
          }
        >
          {hasUnread ? (
            <BellRing className="h-5 w-5 text-primary animate-bounce-subtle" />
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
          )}

          {/* Indicador pulsante e badge de não lidas */}
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-80" />
              <span className="relative inline-flex items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-extrabold text-primary-foreground font-mono shadow-md border border-background">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] sm:w-[430px] p-0 z-50 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Notificações</h3>
                {hasUnread && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono font-bold bg-primary/15 text-primary border-primary/20">
                    {unreadCount} nova{unreadCount === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Sincronizadas em tempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Silenciar / Ativar Som */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              onClick={toggleSound}
              title={soundEnabled ? "Silenciar notificações sonoras" : "Ativar notificações sonoras"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            {/* Marcar todas como lidas */}
            {hasUnread && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-primary rounded-lg gap-1.5"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                title="Marcar todas como lidas"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lidas</span>
              </Button>
            )}
          </div>
        </div>

        {/* ABAS: TODAS / NÃO LIDAS */}
        <div className="px-4 pt-2.5 pb-2 bg-muted/10 border-b border-border/40">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid grid-cols-2 h-8 w-full bg-background/80 border border-border/60 p-0.5 rounded-xl">
              <TabsTrigger
                value="all"
                className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                Todas ({notifications.length})
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-1.5"
              >
                Não Lidas
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-bold">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* LISTA DE NOTIFICAÇÕES */}
        <ScrollArea className="h-[360px] sm:h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground space-y-2">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Sincronizando notificações...</p>
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6 space-y-3">
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60 text-muted-foreground/60 shadow-inner">
                {activeTab === "unread" ? (
                  <Sparkles className="h-8 w-8 text-primary/70" />
                ) : (
                  <Inbox className="h-8 w-8" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  {activeTab === "unread" ? "Tudo em dia!" : "Nenhuma notificação"}
                </p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  {activeTab === "unread"
                    ? "Você não possui nenhuma notificação pendente para ler."
                    : "Você receberá atualizações de chamados, metas, movimentações e comunicados aqui."}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/30 p-2 space-y-1">
              {displayList.map((notif) => {
                const isRead = Boolean(user?.id && notif.read_by?.includes(user.id));
                const typeInfo = getNotificationTypeInfo(notif.type);
                const categoryBadge = getCategoryBadge(notif.category);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "group relative flex items-start gap-3 p-3 rounded-xl transition-all duration-150 cursor-pointer text-left border",
                      isRead
                        ? "bg-transparent hover:bg-muted/40 border-transparent"
                        : "bg-primary/5 hover:bg-primary/10 border-primary/20 shadow-xs"
                    )}
                  >
                    {/* ÍCONE / AVATAR */}
                    <div className="relative shrink-0 mt-0.5">
                      {notif.sender_avatar ? (
                        <Avatar className="h-9 w-9 border border-border shadow-xs">
                          <AvatarImage src={notif.sender_avatar} />
                          <AvatarFallback className={cn("text-xs font-bold", typeInfo.badgeBg, typeInfo.badgeColor)}>
                            {renderTypeIcon(notif.type, "h-4 w-4")}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div
                          className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105",
                            typeInfo.badgeBg,
                            typeInfo.badgeColor,
                            typeInfo.borderColor
                          )}
                        >
                          {renderTypeIcon(notif.type, "h-4 w-4")}
                        </div>
                      )}

                      {/* Dot de Não Lida */}
                      {!isRead && (
                        <span className="absolute -top-1 -left-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                        </span>
                      )}
                    </div>

                    {/* CONTEÚDO */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0",
                              typeInfo.badgeBg,
                              typeInfo.badgeColor,
                              typeInfo.borderColor
                            )}
                          >
                            {typeInfo.label}
                          </span>
                          {notif.user_id !== "all" && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                              Direto
                            </span>
                          )}
                          <p
                            className={cn(
                              "text-xs truncate",
                              isRead ? "font-semibold text-foreground/90" : "font-bold text-foreground"
                            )}
                          >
                            {notif.title}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap shrink-0">
                          {formatRelativeTime(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* METADADOS / REMETENTE */}
                      <div className="flex items-center justify-between pt-0.5 text-[10px] text-muted-foreground/80">
                        {notif.sender_name && (
                          <span className="truncate max-w-[160px]">
                            Por: <span className="font-medium text-foreground/80">{notif.sender_name}</span>
                          </span>
                        )}
                        {notif.link && (
                          <span className="inline-flex items-center gap-1 text-primary text-[10.5px] font-bold group-hover:underline ml-auto">
                            Ver detalhes <ExternalLink className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* BOTÕES DE AÇÃO RÁPIDA (HOVER) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 absolute right-2 top-2 bg-card/90 backdrop-blur-md p-1 rounded-lg border border-border/80 shadow-md">
                      {!isRead ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-emerald-400 rounded-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user?.id) markAsReadMutation.mutate(notif.id);
                          }}
                          title="Marcar como lida"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-md"
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
        </ScrollArea>

        {/* RODAPÉ */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Total: {notifications.length} notificação{notifications.length === 1 ? "" : "ões"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive font-medium gap-1 px-2"
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
            >
              <Trash2 className="h-3 w-3" />
              Limpar todas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
