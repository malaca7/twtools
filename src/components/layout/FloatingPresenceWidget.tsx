import { useState, useRef, useEffect } from "react";
import { Users, X, Clock, Moon, MessageSquare, Plus, ChevronDown, MessageCircle, Send } from "lucide-react";
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
import { dateTime, formatAusenteDuration, formatLastSeen } from "@/lib/format";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { UserPresenceStatus, Member } from "@/lib/app-types";
import type { ChatConversation } from "@/types/chat";
import { toast } from "sonner";

/* ─── Live timer badge for online members (High Density) ─── */
function CompactLiveTimer({ onlineSinceISO }: { onlineSinceISO?: string | null }) {
  const { formattedHuman } = useOnlineTimer(onlineSinceISO);
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold">
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
        "flex items-center justify-between py-2 px-2.5 rounded-xl transition-all group text-xs",
        isSelf ? "cursor-default opacity-85" : "hover:bg-secondary/70 cursor-pointer hover:shadow-xs"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="relative shrink-0">
          <Avatar className="h-7.5 w-7.5 border border-border/80 shadow-xs">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={member.nome} />}
            <AvatarFallback className="bg-secondary font-bold text-[10px] text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <CompactStatusDot status={status as UserPresenceStatus} />
        </div>

        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="truncate font-bold text-foreground text-[11px] leading-tight group-hover:text-primary transition-colors max-w-[130px] sm:max-w-none">
              {displayName}
            </span>
            {isSelf && <span className="text-[9px] font-mono text-muted-foreground">(você)</span>}
            <Badge
              variant="outline"
              className={cn("text-[8px] uppercase font-mono font-bold px-1 py-0 h-3.5 leading-none shrink-0 border-border/60", levelBadgeClass(currentNivel))}
            >
              {LEVEL_LABEL[currentNivel] || currentNivel}
            </Badge>
          </div>
          {member.nickname && (
            <span className="truncate text-[9px] text-muted-foreground leading-none mt-0.5">
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
            className="text-[9px] text-muted-foreground font-mono truncate max-w-[110px] text-right"
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
            className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 rounded-md transition-all shrink-0"
            title={`Conversar com ${displayName}`}
          >
            <MessageSquare className="h-3 w-3" />
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
  const [activeTab, setActiveTab] = useState<"members" | "chat">("members");
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const { data: members = [] } = useMembers();
  const {
    conversations,
    isLoading: loadingConversations,
    totalUnreadCount,
    refetch: refetchConversations,
  } = useConversations(activeConversation?.id);

  const panelRef = useRef<HTMLDivElement>(null);

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
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const inDialog = document.querySelector('[role="dialog"]');
        if (inDialog && inDialog.contains(e.target as Node)) return;
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Counts
  const onlineMembers = members.filter((m) => m.presence_status === "online");
  const ausenteMembers = members.filter((m) => m.presence_status === "ausente" || m.presence_status === "ocupado");
  const offlineMembers = members.filter((m) => !m.presence_status || m.presence_status === "offline");

  const totalOnline = onlineMembers.length;
  const totalAusente = ausenteMembers.length;

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

  return (
    <div ref={panelRef} className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50">
      {/* FLOATING ACTION BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex items-center gap-2 px-3.5 py-2.5 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-200 cursor-pointer active:scale-95",
          isOpen
            ? "border-primary bg-primary text-primary-foreground shadow-primary/30 ring-2 ring-primary/40"
            : "border-primary/40 bg-card/95 text-foreground hover:bg-secondary hover:border-primary/60 shadow-lg"
        )}
        title="Ver membros ativos e mensagens em tempo real"
      >
        <div className="relative flex items-center justify-center">
          <Users className="h-4 w-4 shrink-0" />
          {totalOnline > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
          <span>{totalOnline}</span>
          <span className="text-[10px] font-sans font-semibold opacity-80">Ativos</span>
        </div>

        {/* UNREAD MESSAGES BADGE ON BUBBLE */}
        {totalUnreadCount > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black animate-pulse shadow-xs">
            <MessageSquare className="h-2.5 w-2.5" />
            <span>{totalUnreadCount}</span>
          </div>
        )}

        <ChevronDown
          className={cn("h-3.5 w-3.5 opacity-60 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      {/* FLOATING HIGH-DENSITY CHAT & PRESENCE DRAWER */}
      {isOpen && (
        <div className="fixed inset-x-2.5 bottom-2 top-14 sm:inset-auto sm:bottom-16 sm:right-0 sm:top-auto sm:w-[420px] sm:h-[580px] rounded-2xl border border-border/80 bg-card/98 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in-50 slide-in-from-bottom-3 duration-200 flex flex-col z-50">
          {/* SE UMA CONVERSA ESTIVER ABERTA, EXIBE A JANELA DE CHAT */}
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
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
            />
          ) : (
            /* CASO CONTRÁRIO: EXIBE ABAS (MEMBROS / CONVERSAS) */
            <div className="flex flex-col h-full overflow-hidden">
              {/* TOP TABS & CLOSE BUTTON */}
              <div className="p-2.5 border-b border-border/60 bg-secondary/30 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-secondary/80 p-0.5 rounded-xl border border-border/50">
                  <button
                    type="button"
                    onClick={() => setActiveTab("members")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer",
                      activeTab === "members"
                        ? "bg-card text-foreground shadow-xs border border-border/40"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>Membros</span>
                    <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-bold">
                      {totalOnline}
                    </Badge>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("chat")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer relative",
                      activeTab === "chat"
                        ? "bg-card text-foreground shadow-xs border border-border/40"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Mensagens</span>
                    {totalUnreadCount > 0 && (
                      <Badge className="h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-black animate-pulse">
                        {totalUnreadCount}
                      </Badge>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-xl hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Fechar popup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ABA: MEMBROS */}
              {activeTab === "members" ? (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* SEARCH */}
                  <div className="p-2.5 border-b border-border/40 bg-secondary/10 shrink-0">
                    <Input
                      placeholder="Buscar membros online ou por ID..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="h-8 text-xs bg-secondary/40 border-border/60 rounded-xl"
                    />
                  </div>

                  {/* HIGH DENSITY LIST */}
                  <div className="flex-1 overflow-y-auto p-1.5 space-y-2 divide-y divide-border/30">
                    {/* ONLINE GROUP */}
                    {filteredMembers(onlineMembers).length > 0 && (
                      <div className="space-y-0.5 pt-1 first:pt-0">
                        <div className="flex items-center justify-between px-2 py-1 text-[9px] font-bold font-mono text-emerald-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ONLINE
                          </span>
                          <span>{filteredMembers(onlineMembers).length}</span>
                        </div>
                        {filteredMembers(onlineMembers).map((m) => (
                          <CompactMemberRow
                            key={m.user_id}
                            member={m}
                            onStartChat={handleStartPrivateChat}
                            isSelf={m.user_id === currentUserId}
                          />
                        ))}
                      </div>
                    )}

                    {/* AUSENTE GROUP */}
                    {filteredMembers(ausenteMembers).length > 0 && (
                      <div className="space-y-0.5 pt-1.5">
                        <div className="flex items-center justify-between px-2 py-1 text-[9px] font-bold font-mono text-amber-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> AUSENTES
                          </span>
                          <span>{filteredMembers(ausenteMembers).length}</span>
                        </div>
                        {filteredMembers(ausenteMembers).map((m) => (
                          <CompactMemberRow
                            key={m.user_id}
                            member={m}
                            onStartChat={handleStartPrivateChat}
                            isSelf={m.user_id === currentUserId}
                          />
                        ))}
                      </div>
                    )}

                    {/* OFFLINE GROUP */}
                    {filteredMembers(offlineMembers).length > 0 && (
                      <div className="space-y-0.5 pt-1.5">
                        <div className="flex items-center justify-between px-2 py-1 text-[9px] font-bold font-mono text-zinc-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" /> OFFLINE
                          </span>
                          <span>{filteredMembers(offlineMembers).length}</span>
                        </div>
                        {filteredMembers(offlineMembers).map((m) => (
                          <CompactMemberRow
                            key={m.user_id}
                            member={m}
                            onStartChat={handleStartPrivateChat}
                            isSelf={m.user_id === currentUserId}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ABA: CONVERSAS / MENSAGENS */
                <ConversationList
                  conversations={conversations}
                  isLoading={loadingConversations}
                  onSelectConversation={(conv) => setActiveConversation(conv)}
                  onCreateGroup={() => setCreateGroupOpen(true)}
                />
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
    </div>
  );
}
