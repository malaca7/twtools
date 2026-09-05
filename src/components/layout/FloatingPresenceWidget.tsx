import { useState, useRef, useEffect } from "react";
import {
  Users,
  X,
  MessageSquare,
  MessageCircle,
  MessageCircleMore,
  Volume2,
  VolumeX,
  ChevronDown,
  Moon,
  Search,
  Check,
  Sparkles,
  User,
  Radio,
  SlidersHorizontal,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { useOnlineTimer } from "@/hooks/useOnlineTimer";
import { useConversations } from "@/hooks/useChat";
import { getOrCreatePrivateConversation } from "@/services/chatService";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ConversationList } from "@/components/chat/ConversationList";
import { CreateGroupDialog } from "@/components/chat/CreateGroupDialog";
import { ChatSoundSettingsDialog } from "@/components/chat/ChatSoundSettingsDialog";
import {
  chatSound,
  GLOW_COLORS,
  type ChatVisualAlertStyle,
  type ChatGlowColor,
} from "@/lib/chatSound";
import { formatAusenteDuration, formatLastSeen } from "@/lib/format";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { UserPresenceStatus, Member } from "@/lib/app-types";
import type { ChatConversation } from "@/types/chat";
import { toast } from "sonner";

/* ─── Live timer badge for online members (High Density) ─── */
function CompactLiveTimer({ onlineSinceISO }: { onlineSinceISO?: string | null }) {
  const { formattedHuman } = useOnlineTimer(onlineSinceISO);
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[9.5px] font-bold shadow-2xs">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>
      <span>{formattedHuman}</span>
    </div>
  );
}

/* ─── Compact Status Dot ─── */
function CompactStatusDot({ status }: { status: UserPresenceStatus | undefined }) {
  if (status === "online") {
    return (
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
    );
  }
  if (status === "ausente") {
    return (
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-amber-500 shadow-sm animate-pulse" />
    );
  }
  return (
    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-zinc-500/80" />
  );
}

/* ─── High Density Member Row with Direct Chat Action ─── */
function CompactMemberRow({
  member,
  onStartChat,
  isSelf,
}: {
  member: Member;
  onStartChat: (targetUserId: string) => void;
  isSelf: boolean;
}) {
  const status = member.presence_status || "offline";
  const currentNivel = (member.nivel || "novato") as AppLevel;
  const avatarUrl = member.discord_avatar_url;
  const displayName = member.nickname || member.nome;
  const initials = displayName.slice(0, 2).toUpperCase();

  const ausenteText = formatAusenteDuration(member.presence_updated_at || member.updated_at || member.last_seen);
  const lastSeenFull = formatLastSeen(member.last_seen || member.presence_updated_at || member.updated_at);
  const lastSeenCompact = lastSeenFull.replace("Visto por último ", "");

  return (
    <div
      onClick={() => !isSelf && onStartChat(member.user_id)}
      className={cn(
        "flex items-center justify-between py-2 px-2.5 rounded-xl transition-all group text-xs border border-transparent select-none",
        isSelf
          ? "cursor-default opacity-85 bg-secondary/15"
          : "hover:bg-secondary/70 hover:border-border/60 cursor-pointer hover:shadow-xs active:scale-[0.99]"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="relative shrink-0">
          <Avatar className="h-8 w-8 border border-border/80 shadow-xs group-hover:border-primary/50 transition-colors">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={member.nome} />}
            <AvatarFallback className="bg-secondary font-bold text-[10px] text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <CompactStatusDot status={status as UserPresenceStatus} />
        </div>

        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="truncate font-black text-foreground text-xs leading-tight group-hover:text-primary transition-colors max-w-[140px] sm:max-w-none">
              {displayName}
            </span>
            {isSelf && <span className="text-[9px] font-mono text-muted-foreground font-bold">(você)</span>}
            <Badge
              variant="outline"
              className={cn("text-[8.5px] uppercase font-mono font-bold px-1.5 py-0 h-4 leading-none shrink-0 border-border/60", levelBadgeClass(currentNivel))}
            >
              {LEVEL_LABEL[currentNivel] || currentNivel}
            </Badge>
          </div>
          {member.nickname && (
            <span className="truncate text-[10px] text-muted-foreground leading-none mt-0.5">
              {member.nome}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 pl-2 flex items-center gap-1.5">
        {status === "online" ? (
          <CompactLiveTimer onlineSinceISO={member.online_since} />
        ) : status === "ausente" ? (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-[9px] font-bold"
            title={ausenteText}
          >
            <Moon className="h-2.5 w-2.5 shrink-0" />
            <span>{ausenteText}</span>
          </div>
        ) : (
          <span
            className="text-[9.5px] text-muted-foreground font-mono truncate max-w-[110px] text-right"
            title={lastSeenFull}
          >
            {lastSeenCompact}
          </span>
        )}

        {!isSelf && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground group-hover:text-primary group-hover:bg-primary/15 rounded-lg transition-all shrink-0"
            title={`Conversar com ${displayName}`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function FloatingPresenceWidget() {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "members">("chat");
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<"all" | "online" | "ausente" | "offline">("all");
  const [soundEnabled, setSoundEnabled] = useState(chatSound.isEnabled());
  const [isAlerting, setIsAlerting] = useState(false);

  // Estados avançados de alerta visual
  const [latestAlert, setLatestAlert] = useState<{
    senderName: string;
    senderAvatar: string | null;
    content: string;
    conversationId: string;
    visualStyle: ChatVisualAlertStyle;
    glowColor: ChatGlowColor;
  } | null>(null);
  const [showToastAlert, setShowToastAlert] = useState(false);
  const [showScreenGlow, setShowScreenGlow] = useState(false);

  const { data: members = [] } = useMembers();
  const {
    conversations,
    isLoading: loadingConversations,
    totalUnreadCount,
    unreadConversationsCount,
    refetch: refetchConversations,
  } = useConversations(activeConversation?.id);

  const panelRef = useRef<HTMLDivElement>(null);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar estado do som
  useEffect(() => {
    const handleSoundChange = (e: any) => {
      if (typeof e.detail?.enabled === "boolean") {
        setSoundEnabled(e.detail.enabled);
      }
    };
    window.addEventListener("tw_chat_sound_change", handleSoundChange);
    return () => window.removeEventListener("tw_chat_sound_change", handleSoundChange);
  }, []);

  // Escutar eventos de nova mensagem e navegação de chat
  useEffect(() => {
    const handleNewMessageAlert = (e: any) => {
      const detail = e.detail || {};
      const settings = chatSound.getSettings();
      const style = detail.visualStyle || settings.visualStyle;
      const color = detail.glowColor || settings.glowColor;
      const senderName = detail.senderName || "Alguém";
      const senderAvatar = detail.senderAvatar || null;
      const content = detail.message?.content || detail.message?.attachment_name || "Enviou uma mensagem";
      const conversationId = detail.conversationId;

      setIsAlerting(true);
      setLatestAlert({
        senderName,
        senderAvatar,
        content,
        conversationId,
        visualStyle: style,
        glowColor: color,
      });

      if (style === "toast") {
        setShowToastAlert(true);
        if (isOpen) {
          toast(detail.isMention ? `📢 Mencionado por ${senderName}` : `💬 ${senderName}`, {
            description: content,
            action: conversationId
              ? {
                  label: "Ver",
                  onClick: () => {
                    if (conversations) {
                      const found = conversations.find((c) => c.id === conversationId);
                      if (found) setActiveConversation(found);
                    }
                  },
                }
              : undefined,
          });
        }
      } else if (style === "screen_glow") {
        setShowScreenGlow(true);
      }

      // NÃO abrir automaticamente o balão do chat ao receber mensagem!
      // O balão só abre quando o usuário clica manualmente no botão flutuante.

      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = setTimeout(() => {
        setIsAlerting(false);
        setShowToastAlert(false);
        setShowScreenGlow(false);
      }, 7000);
    };

    const handleOpenConversation = (e: any) => {
      const conversationId = e.detail?.conversationId;
      if (conversationId) {
        setIsOpen(true);
        const found = conversations.find((c) => c.id === conversationId);
        if (found) setActiveConversation(found);
      }
    };

    window.addEventListener("tw_chat_new_message", handleNewMessageAlert);
    window.addEventListener("tw_chat_open_conversation", handleOpenConversation);
    return () => {
      window.removeEventListener("tw_chat_new_message", handleNewMessageAlert);
      window.removeEventListener("tw_chat_open_conversation", handleOpenConversation);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [conversations]);

  // Sync active conversation when conversations query updates
  useEffect(() => {
    if (activeConversation) {
      const updated = conversations.find((c) => c.id === activeConversation.id);
      if (updated) {
        setActiveConversation(updated);
      }
    }
  }, [conversations]);

  // Close panel on outside click only on desktop (on mobile, user uses close button)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (window.innerWidth < 640) return; // Ignore on mobile
      const target = e.target as Element | null;
      if (!target) return;

      // Se o clique foi dentro do próprio widget, não fecha
      if (panelRef.current && panelRef.current.contains(target)) return;

      // Se o clique foi em qualquer portal do Radix (Dialog, AlertDialog, DropdownMenu, Popover, etc.)
      if (
        target.closest(
          '[role="dialog"], [role="alertdialog"], [role="menu"], [data-radix-portal], [data-radix-popper-content-wrapper], [data-radix-dropdown-menu-content], [data-radix-focus-guard]'
        )
      ) {
        return;
      }

      // Se houver algum Dialog ou AlertDialog aberto no DOM, não fecha o chat
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        return;
      }

      setIsOpen(false);
      setIsAlerting(false);
      setShowToastAlert(false);
      setShowScreenGlow(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Limpa alerta de animação quando o usuário abre ou fecha o balão
  const handleToggleOpen = () => {
    setIsAlerting(false);
    setShowToastAlert(false);
    setShowScreenGlow(false);
    setIsOpen((prev) => !prev);
  };

  const handleToggleSound = () => {
    const next = chatSound.toggle();
    setSoundEnabled(next);
    toast.info(next ? "Sons de notificação ativados" : "Sons silenciados");
  };

  // Counts de membros
  const onlineMembers = members.filter((m) => m.presence_status === "online");
  const ausenteMembers = members.filter((m) => m.presence_status === "ausente" || m.presence_status === "ocupado");
  const offlineMembers = members.filter((m) => !m.presence_status || m.presence_status === "offline");

  const totalOnline = onlineMembers.length;

  const filteredMembers = (list: Member[]) => {
    if (!memberSearch.trim()) return list;
    const q = memberSearch.toLowerCase();
    return list.filter(
      (m) =>
        m.nome.toLowerCase().includes(q) ||
        (m.nickname && m.nickname.toLowerCase().includes(q)) ||
        (m.game_id && m.game_id.includes(q))
    );
  };

  const handleStartPrivateChat = async (targetUserId: string) => {
    if (!currentUserId) {
      toast.error("Você precisa estar autenticado.");
      return;
    }
    try {
      const conv = await getOrCreatePrivateConversation(currentUserId, targetUserId);
      setActiveConversation(conv);
      setActiveTab("chat");
      void refetchConversations();
    } catch (err: any) {
      toast.error(`Erro ao abrir conversa: ${err.message || err}`);
    }
  };

  // Determinar classes visuais de alerta neon
  const activeGlow = latestAlert?.glowColor
    ? GLOW_COLORS.find((c) => c.id === latestAlert.glowColor) || GLOW_COLORS[0]
    : GLOW_COLORS[0];

  return (
    <>
      {/* 🎆 SCREEN EDGE GLOW AURA OVERLAY */}
      {showScreenGlow && !isOpen && (
        <div
          className={cn(
            "fixed inset-0 pointer-events-none z-[9998] transition-opacity duration-300 animate-pulse border-[6px]",
            activeGlow.borderClass,
            "shadow-[inset_0_0_90px_rgba(16,185,129,0.35)]"
          )}
        />
      )}

      {/* 🚀 CARD FLUTUANTE DE ALERTA DE MENSAGEM (TOAST INTERATIVO) */}
      {showToastAlert && latestAlert && !isOpen && (
        <div className="fixed bottom-[78px] right-3 sm:right-6 z-[9999] max-w-sm w-full bg-card/95 backdrop-blur-2xl border border-primary/40 rounded-3xl p-3.5 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 border-2 border-primary shrink-0 shadow-md">
              {latestAlert.senderAvatar && <AvatarImage src={latestAlert.senderAvatar} />}
              <AvatarFallback className="bg-primary/20 font-black text-primary text-xs">
                {latestAlert.senderName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-foreground truncate max-w-[130px]">
                  {latestAlert.senderName}
                </span>
                <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30 font-bold shrink-0">
                  Nova Mensagem
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                {latestAlert.content}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setIsOpen(true);
                setShowToastAlert(false);
                if (latestAlert.conversationId && conversations) {
                  const found = conversations.find((c) => c.id === latestAlert.conversationId);
                  if (found) setActiveConversation(found);
                }
              }}
              className="h-8 px-3 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-md cursor-pointer hover:bg-primary/90"
            >
              Responder
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowToastAlert(false)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* CONTAINER DO BALÃO FLUTUANTE */}
      <div ref={panelRef} className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50">
        {/* FLOATING ACTION BUTTON — BALÃO FLUTUANTE DE CHAT 💬 */}
        <button
          type="button"
          onClick={handleToggleOpen}
          className={cn(
            "relative flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-300 cursor-pointer active:scale-95 group select-none",
            isOpen
              ? "border-primary bg-primary text-primary-foreground shadow-primary/40 ring-4 ring-primary/30"
              : "border-primary/50 bg-card/95 text-foreground hover:bg-secondary hover:border-primary/80 shadow-xl",
            isAlerting &&
              !isOpen &&
              cn("animate-bounce ring-4", activeGlow.ringClass, activeGlow.borderClass, activeGlow.shadowClass)
          )}
          title={`${totalOnline} membro(s) online • Abrir Chat em tempo real`}
        >
          {/* Pulsing ring indicator on new message */}
          {isAlerting && !isOpen && (
            <span
              className={cn(
                "absolute -inset-1 rounded-full opacity-40 animate-ping pointer-events-none",
                activeGlow.bgClass
              )}
            />
          )}

          {/* CHAT ICON 💬 */}
          <div className="relative flex items-center justify-center">
            <MessageCircleMore
              className={cn(
                "h-5 w-5 shrink-0 transition-transform group-hover:scale-110",
                isOpen ? "text-primary-foreground" : "text-primary"
              )}
            />

            {/* Status online ping dot no ícone */}
            {totalOnline > 0 && !isOpen && totalUnreadCount === 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </div>

          {/* CHAT LABEL */}
          <span className={cn("text-xs font-black tracking-tight", isOpen ? "text-primary-foreground" : "text-foreground")}>
            Chat
          </span>

          {/* UNREAD CONVERSATIONS BADGE */}
          {unreadConversationsCount > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black animate-pulse shadow-md shadow-rose-600/40"
              title={`${unreadConversationsCount} conversa(s) com mensagens não lidas`}
            >
              <MessageSquare className="h-2.5 w-2.5" />
              <span>{unreadConversationsCount}</span>
            </div>
          )}

          <ChevronDown
            className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </button>

        {/* FLOATING HIGH-DENSITY CHAT & PRESENCE POPUP (ALINHADO E SEM CORTES) */}
        {isOpen && (
          <div className="fixed inset-x-2 bottom-[68px] top-14 sm:inset-auto sm:bottom-[78px] sm:right-6 sm:top-auto sm:w-[440px] sm:max-w-[calc(100vw-2.5rem)] sm:h-[620px] sm:max-h-[calc(100vh-100px)] rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in-50 slide-in-from-bottom-3 duration-200 flex flex-col z-[999]">
            {/* SE UMA CONVERSA ESTIVER ABERTA, EXIBE A JANELA DE CHAT */}
            {activeConversation ? (
              <ChatWindow
                key={activeConversation.id}
                conversation={activeConversation}
                allConversations={conversations}
                onBack={() => {
                  setActiveConversation(null);
                  void refetchConversations();
                }}
                onConversationUpdated={() => {
                  void refetchConversations();
                }}
                onStartPrivateChat={(uid) => {
                  void handleStartPrivateChat(uid);
                }}
                onSelectConversation={(conv) => {
                  setActiveConversation(conv);
                  void refetchConversations();
                }}
                viewMode="focus"
              />
            ) : (
              /* CASO CONTRÁRIO: EXIBE ABAS (CHAT PRINCIPAL / MEMBROS ONLINE) */
              <div className="flex flex-col h-full overflow-hidden">
                {/* TOP HEADER & SEGMENTED PILL TABS */}
                <div className="p-3 border-b border-border/60 bg-secondary/30 flex items-center justify-between gap-2 shrink-0 backdrop-blur-md">
                  <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-2xl border border-border/50 shadow-inner">
                    {/* ABA 1 (PRINCIPAL): CHAT */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("chat")}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer relative select-none",
                        activeTab === "chat"
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Conversas</span>
                      {totalUnreadCount > 0 && (
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold",
                            activeTab === "chat"
                              ? "bg-primary-foreground text-primary"
                              : "bg-rose-500 text-white"
                          )}
                        >
                          {totalUnreadCount}
                        </span>
                      )}
                    </button>

                    {/* ABA 2: MEMBROS ONLINE */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("members")}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer relative select-none",
                        activeTab === "members"
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                      )}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Membros</span>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold",
                          activeTab === "members"
                            ? "bg-primary-foreground text-primary"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        )}
                      >
                        {totalOnline}
                      </span>
                    </button>
                  </div>

                  {/* AÇÕES NO HEADER: CONFIGURAÇÕES E FECHAR */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSettingsOpen(true)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                      title="Configurações de som e alertas do chat"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleOpen}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-all"
                      title="Fechar painel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* CONTEÚDO DAS ABAS */}
                {activeTab === "chat" ? (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <ConversationList
                      conversations={conversations}
                      activeConversationId={activeConversation?.id}
                      onSelectConversation={(conv) => {
                        setActiveConversation(conv);
                        void refetchConversations();
                      }}
                      onCreateGroup={() => setCreateGroupOpen(true)}
                      isLoading={loadingConversations}
                      viewMode="focus"
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden flex flex-col bg-card/50">
                    {/* BARRA DE PESQUISA E FILTROS DE MEMBROS */}
                    <div className="p-3 border-b border-border/50 bg-secondary/20 space-y-2 shrink-0">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Buscar membro por nome ou ID..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="h-8 pl-8 text-xs bg-background/80 border-border/60 rounded-xl"
                        />
                        {memberSearch && (
                          <button
                            type="button"
                            onClick={() => setMemberSearch("")}
                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* SEGMENTED FILTERS */}
                      <div className="grid grid-cols-4 gap-1">
                        {(["all", "online", "ausente", "offline"] as const).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setMemberFilter(filter)}
                            className={cn(
                              "py-1 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border text-center select-none cursor-pointer",
                              memberFilter === filter
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-secondary/40 border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                          >
                            {filter === "all"
                              ? `Todos (${members.length})`
                              : filter === "online"
                              ? `Online (${onlineMembers.length})`
                              : filter === "ausente"
                              ? `Ausente (${ausenteMembers.length})`
                              : `Off (${offlineMembers.length})`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* LISTA DE MEMBROS ALTA DENSIDADE */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-3">
                      {/* SEÇÃO ONLINE */}
                      {(memberFilter === "all" || memberFilter === "online") && filteredMembers(onlineMembers).length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-black font-mono text-emerald-400 uppercase tracking-wider bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              ONLINE AGORA
                            </span>
                            <span className="font-bold">{filteredMembers(onlineMembers).length}</span>
                          </div>
                          <div className="space-y-0.5">
                            {filteredMembers(onlineMembers).map((m) => (
                              <CompactMemberRow
                                key={m.user_id}
                                member={m}
                                onStartChat={handleStartPrivateChat}
                                isSelf={m.user_id === currentUserId}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SEÇÃO AUSENTE */}
                      {(memberFilter === "all" || memberFilter === "ausente") && filteredMembers(ausenteMembers).length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-black font-mono text-amber-400 uppercase tracking-wider bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <span className="flex items-center gap-1.5">
                              <Moon className="h-3 w-3" />
                              AUSENTE / AFK
                            </span>
                            <span className="font-bold">{filteredMembers(ausenteMembers).length}</span>
                          </div>
                          <div className="space-y-0.5">
                            {filteredMembers(ausenteMembers).map((m) => (
                              <CompactMemberRow
                                key={m.user_id}
                                member={m}
                                onStartChat={handleStartPrivateChat}
                                isSelf={m.user_id === currentUserId}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SEÇÃO OFFLINE */}
                      {(memberFilter === "all" || memberFilter === "offline") && filteredMembers(offlineMembers).length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-black font-mono text-zinc-400 uppercase tracking-wider bg-zinc-500/5 rounded-lg border border-zinc-500/20">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-zinc-500" />
                              OFFLINE
                            </span>
                            <span className="font-bold">{filteredMembers(offlineMembers).length}</span>
                          </div>
                          <div className="space-y-0.5">
                            {filteredMembers(offlineMembers).map((m) => (
                              <CompactMemberRow
                                key={m.user_id}
                                member={m}
                                onStartChat={handleStartPrivateChat}
                                isSelf={m.user_id === currentUserId}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {filteredMembers(members).length === 0 && (
                        <div className="text-center py-12 text-muted-foreground space-y-1">
                          <p className="text-xs font-bold text-foreground">Nenhum membro encontrado</p>
                          <p className="text-[11px]">Tente buscar por outro nome ou ID.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL PARA CRIAR NOVO GRUPO */}
        <CreateGroupDialog
          open={createGroupOpen}
          onOpenChange={setCreateGroupOpen}
          onGroupCreated={(newGroup) => {
            setActiveConversation(newGroup);
            setActiveTab("chat");
            void refetchConversations();
          }}
        />

        {/* MODAL PARA CONFIGURAÇÕES DE SONS E ALERTAS */}
        <ChatSoundSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </>
  );
}
