import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Volume2,
  VolumeX,
  MessageSquare,
  Sparkles,
  Lock,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatSound } from "@/lib/chatSound";
import { formatTimeOnly, isTodayDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/types/chat";

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConversationId?: string | null;
  onSelectConversation: (conv: ChatConversation) => void;
  onCreateGroup: () => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateGroup,
  isLoading,
}: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "groups" | "direct">("all");
  const [soundEnabled, setSoundEnabled] = useState(chatSound.isEnabled());

  const handleToggleSound = () => {
    const next = chatSound.toggle();
    setSoundEnabled(next);
  };

  const filteredConversations = conversations.filter((c) => {
    const isGroup = c.type === "group";
    const other = c.other_participant;
    const title = isGroup ? c.title || "" : other?.nickname || other?.nome || "Membro";

    if (activeFilter === "unread" && (c.unread_count || 0) === 0) return false;
    if (activeFilter === "groups" && !isGroup) return false;
    if (activeFilter === "direct" && isGroup) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return title.toLowerCase().includes(q) || (c.last_message || "").toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full w-full bg-card overflow-hidden select-none">
      {/* TOP BAR: TITLE + ACTIONS */}
      <div className="p-3 border-b border-border/80 bg-secondary/30 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-extrabold text-foreground">Mensagens</h3>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleToggleSound}
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              title={soundEnabled ? "Sons ativados (clique para silenciar)" : "Sons desativados"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onCreateGroup}
              className="h-7 text-xs bg-primary text-primary-foreground font-bold rounded-lg shadow-sm hover:bg-primary/90 cursor-pointer"
              title="Criar novo grupo"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Novo Grupo
            </Button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-background border-border/80 rounded-xl"
          />
        </div>

        {/* FILTER CHIPS */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer",
              activeFilter === "all"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            Todas ({conversations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("unread")}
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1",
              activeFilter === "unread"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            Não Lidas
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("groups")}
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer",
              activeFilter === "groups"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            Grupos
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("direct")}
            className={cn(
              "px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer",
              activeFilter === "direct"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            )}
          >
            Diretas
          </button>
        </div>
      </div>

      {/* CONVERSATION ITEMS SCROLL LIST */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30 p-1.5 space-y-0.5">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
            <span className="animate-spin inline-block text-lg">⏳</span>
            <p>Carregando conversas...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <p className="font-bold text-foreground">Nenhuma conversa encontrada</p>
            <p className="text-[11px]">
              Inicie uma conversa clicando em um membro ou crie um grupo!
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isGroup = conv.type === "group";
            const other = conv.other_participant;
            const title = isGroup ? conv.title || "Grupo" : other?.nickname || other?.nome || "Membro";
            const avatarUrl = isGroup ? conv.avatar_url : other?.discord_avatar_url;
            const initials = (isGroup ? conv.title || "GR" : other?.nickname || other?.nome || "M").slice(0, 2).toUpperCase();
            const isOnline = other?.presence_status === "online";
            const isAusente = other?.presence_status === "ausente";
            const isSelected = activeConversationId === conv.id;
            const unread = conv.unread_count || 0;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-xs group",
                  isSelected
                    ? "bg-primary/15 text-foreground border border-primary/40 shadow-xs"
                    : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10 border border-border/80 shadow-xs">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {isGroup ? <Users className="h-4 w-4" /> : initials}
                      </AvatarFallback>
                    </Avatar>

                    {!isGroup && (
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                          isOnline ? "bg-emerald-500 shadow-xs" : isAusente ? "bg-amber-500 animate-pulse" : "bg-zinc-500"
                        )}
                        title={isOnline ? "Online" : isAusente ? "Ausente" : "Offline"}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-foreground text-xs truncate leading-tight group-hover:text-primary transition-colors">
                        {title}
                      </span>
                      {conv.only_admins_can_post && (
                        <Lock className="h-3 w-3 text-amber-400 shrink-0" title="Somente admins podem falar" />
                      )}
                    </div>

                    <p
                      className={cn(
                        "truncate text-[11px] leading-snug mt-0.5",
                        unread > 0 ? "font-bold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {conv.last_message || "Sem mensagens ainda..."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 pl-2">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {conv.last_message_at ? formatTimeOnly(conv.last_message_at) : ""}
                  </span>

                  {unread > 0 && (
                    <Badge className="h-4.5 min-w-4.5 px-1 bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center rounded-full shadow-sm animate-pulse">
                      {unread > 99 ? "99+" : unread}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
