import React, { useState, useMemo } from "react";
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
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Settings2,
  Coins,
  AlertTriangle,
  Award,
  Lock,
  Trophy,
  Bot,
  HelpCircle,
} from "lucide-react";
import { useManagementPendingActions } from "@/hooks/useManagementPendingActions";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
} from "@/hooks/useNotifications";
import {
  getNotificationTypeInfo,
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
    case "live":
      return <Radio className={cn(className, "text-rose-400 animate-pulse")} />;
    case "cash_fund":
      return <Coins className={className} />;
    case "stock_alert":
      return <AlertTriangle className={className} />;
    case "role_update":
      return <Award className={className} />;
    case "member_warning":
      return <ShieldAlert className={className} />;
    case "security_alert":
      return <Lock className={cn(className, "text-rose-500")} />;
    case "achievement":
      return <Trophy className={cn(className, "text-amber-400")} />;
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

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"unread" | "management">("unread");

  const {
    unreadNotifications,
    unreadCount,
    hasUnread,
    soundEnabled,
    toggleSound,
    isLoading,
  } = useNotifications();

  const {
    isManager,
    totalPendingCount,
    allActionItems,
  } = useManagementPendingActions();

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();
  const deleteMutation = useDeleteNotification();

  // No popup de notificações, NÃO mostrar notificações lidas (apenas unread)
  const displayList = unreadNotifications;

  const handleNotificationClick = (notif: AppNotification) => {
    if (user?.id && (!notif.read_by || !notif.read_by.includes(user.id))) {
      markAsReadMutation.mutate(notif.id);
    }
    if (notif.link) {
      setOpen(false);
      navigate({ to: notif.link as any });
    }
  };

  const hasManagementPending = isManager && totalPendingCount > 0;
  const showBadge = hasUnread || hasManagementPending;
  const displayBadgeCount = unreadCount > 0 ? unreadCount : totalPendingCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-10 w-10 sm:h-11 sm:w-11 rounded-full transition-all duration-200 outline-none hover:bg-secondary/60",
            showBadge && "text-primary hover:text-primary"
          )}
          title={
            showBadge
              ? `${unreadCount} notificação(ões) pendente(s)${hasManagementPending ? ` • ${totalPendingCount} pendência(s) de gestão` : ""}`
              : "Notificações"
          }
        >
          {showBadge ? (
            <BellRing className={cn("h-5 w-5 animate-bounce-subtle", hasUnread ? "text-primary" : "text-amber-400")} />
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
          )}

          {/* Indicador de não lidas */}
          {showBadge && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-80",
                  hasUnread ? "bg-primary/60" : "bg-amber-500/60"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold font-mono shadow-md border border-background",
                  hasUnread
                    ? "bg-primary text-primary-foreground"
                    : "bg-amber-500 text-black"
                )}
              >
                {displayBadgeCount > 99 ? "99+" : displayBadgeCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-1.25rem)] sm:w-[440px] max-w-[440px] p-0 overflow-hidden"
      >
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <BellRing className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">Novas Notificações</h3>
                {hasUnread ? (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono font-bold bg-primary/15 text-primary border-primary/20">
                    {unreadCount} nova{unreadCount === 1 ? "" : "s"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium text-muted-foreground">
                    0 pendentes
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Apenas notificações não lidas</p>
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

        {/* ABAS SE FOR GESTOR: NÃO LIDAS / GESTÃO */}
        {isManager && (
          <div className="px-4 pt-2 pb-1.5 bg-muted/10 border-b border-border/40">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid h-8 w-full grid-cols-2 bg-background/80 border border-border/60 p-0.5 rounded-xl">
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
                <TabsTrigger
                  value="management"
                  className="text-xs font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-1.5"
                >
                  Gestão
                  {totalPendingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-mono font-extrabold animate-pulse">
                      {totalPendingCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL (EXCLUSIVAMENTE NÃO LIDAS NO POPUP) */}
        <ScrollArea className="h-[340px] sm:h-[380px]">
          {activeTab === "management" && isManager ? (
            <div className="p-3 space-y-2.5">
              {totalPendingCount > 0 ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">Ações de Gestão Pendentes</p>
                    <p className="text-[11px] text-muted-foreground">
                      {totalPendingCount} demanda(s) operacional(is) aguardando atendimento.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-200">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">Gestão em Dia</p>
                    <p className="text-[11px] text-muted-foreground">
                      Nenhuma pendência operacional em aberto no momento.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {allActionItems.map((item) => {
                  const hasCount = item.count > 0;
                  const ItemIcon = item.icon;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border transition-all text-left",
                        hasCount
                          ? "bg-secondary/40 border-border/80 hover:border-primary/40 shadow-xs"
                          : "bg-muted/20 border-border/30 opacity-65"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "p-2 rounded-lg border shrink-0",
                            hasCount
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-muted/40 text-muted-foreground border-border/40"
                          )}
                        >
                          <ItemIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground truncate">
                              {item.title}
                            </span>
                            {hasCount && (
                              <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border-amber-500/40"
                              >
                                {item.count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {hasCount ? item.description : "Nenhuma pendência"}
                          </p>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant={hasCount ? "default" : "outline"}
                        className={cn(
                          "h-7 text-[11px] font-bold px-2.5 gap-1 shrink-0 ml-2",
                          hasCount
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                            : "opacity-60 hover:opacity-100"
                        )}
                        onClick={() => {
                          setOpen(false);
                          navigate({ to: item.link as any });
                        }}
                      >
                        {item.actionLabel}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground space-y-2">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Sincronizando notificações...</p>
            </div>
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6 space-y-3">
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/60 text-muted-foreground/60 shadow-inner">
                <Sparkles className="h-8 w-8 text-primary/70" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Tudo em dia!</p>
                <p className="text-xs text-muted-foreground max-w-[250px]">
                  Você não possui notificações não lidas. Acesse a Central Completa para ver o histórico de avisos já lidos.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold gap-1.5 rounded-xl border-border/80"
                onClick={() => {
                  setOpen(false);
                  navigate({ to: "/notificacoes" as any });
                }}
              >
                Ver Notificações Anteriores
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/30 p-2 space-y-1">
              {displayList.map((notif) => {
                const typeInfo = getNotificationTypeInfo(notif.type);

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="group relative flex items-start gap-3 p-3 rounded-xl transition-all duration-150 cursor-pointer text-left border bg-primary/5 hover:bg-primary/10 border-primary/20 shadow-xs"
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

                      {/* Dot pulsante de Não Lida */}
                      <span className="absolute -top-1 -left-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                      </span>
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
                          <p className="text-xs font-bold text-foreground truncate">
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

                      <div className="flex items-center justify-between pt-0.5 text-[10px] text-muted-foreground/80">
                        {notif.sender_name && (
                          <span className="truncate max-w-[160px]">
                            De: <span className="font-medium text-foreground/80">{notif.sender_name}</span>
                          </span>
                        )}
                        {notif.link && (
                          <span className="inline-flex items-center gap-1 text-primary text-[10.5px] font-bold group-hover:underline ml-auto">
                            Ver detalhes <ExternalLink className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AÇÃO RÁPIDA (MARCAR LIDA / EXCLUIR) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 absolute right-2 top-2 bg-card/90 backdrop-blur-md p-1 rounded-lg border border-border/80 shadow-md">
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

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-md"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user?.id) deleteMutation.mutate(notif.id);
                        }}
                        title="Excluir"
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

        {/* RODAPÉ DO POPUP: BOTÃO PARA IR PARA A CENTRAL COMPLETA /todas notificações */}
        <div className="p-3 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs font-bold text-primary hover:text-primary/90 gap-1.5 px-2 hover:bg-primary/10 rounded-xl"
            onClick={() => {
              setOpen(false);
              navigate({ to: "/notificacoes" as any });
            }}
          >
            <Settings2 className="h-3.5 w-3.5" />
            Central Completa & Preferências
            <ArrowRight className="h-3 w-3" />
          </Button>

          {hasUnread && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs font-medium text-muted-foreground hover:text-foreground gap-1 px-2.5 rounded-lg border-border/70"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Lidas
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
