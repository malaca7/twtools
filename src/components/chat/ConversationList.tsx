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
  Radio,
  Columns2,
  Maximize2,
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
  viewMode?: "split" | "focus";
  onToggleViewMode?: (mode: "split" | "focus") => void;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateGroup,
  isLoading,
  viewMode = "split",
  onToggleViewMode,
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
    <div className="flex flex-col h-full w-full bg-card/80 overflow-hidden select-none">
      {/* TOP HEADER */}
      <div className="p-3.5 border-b border-border/80 bg-secondary/20 backdrop-blur-md space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-foreground tracking-tight">Mensagens</h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* LAYOUT MODE TOGGLE (SPLIT VS FOCUS) */}
            {onToggleViewMode && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onToggleViewMode(viewMode === "split" ? "focus" : "split")}
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer hidden sm:flex"
                title={
                  viewMode === "split"
                    ? "Modo Dividido ativo (clique para alternar para Modo Foco em tela cheia)"
                    : "Modo Foco ativo (clique para alternar para Modo Dividido lado a lado)"
                }
              >
                {viewMode === "split" ? (
                  <Columns2 className="h-4 w-4 text-primary" />
                ) : (
                  <Maximize2 className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            )}

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
              className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md shadow-primary/20 cursor-pointer"
              title="Criar novo grupo"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Novo Grupo
            </Button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 pl-8.5 text-xs bg-background/80 border-border/70 rounded-xl focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
          />
        </div>

        {/* FILTER CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 pt-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer border",
              activeFilter === "all"
                ? "bg-primary text-primary-foreground border-primary/40 shadow-xs shadow-primary/20"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary"
            )}
          >
            Todas ({conversations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("unread")}
            className={cn(
              "px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5",
              activeFilter === "unread"
                ? "bg-primary text-primary-foreground border-primary/40 shadow-xs shadow-primary/20"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary"
            )}
          >
            <span>Não Lidas</span>
            {conversations.some((c) => (c.unread_count || 0) > 0) && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("groups")}
            className={cn(
              "px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer border",
              activeFilter === "groups"
                ? "bg-primary text-primary-foreground border-primary/40 shadow-xs shadow-primary/20"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary"
            )}
          >
            Grupos
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("direct")}
            className={cn(
              "px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer border",
              activeFilter === "direct"
                ? "bg-primary text-primary-foreground border-primary/40 shadow-xs shadow-primary/20"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary"
            )}
          >
            Diretas
          </button>
        </div>
      </div>

      {/* CONVERSATION ITEMS SCROLL LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground text-xs">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Carregando conversas...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-muted-foreground space-y-1.5 select-none">
            <span className="text-2xl">💬</span>
            <p className="text-xs font-bold text-foreground">Nenhuma conversa encontrada</p>
            <p className="text-[11px]">Inicie um novo chat ou grupo para começar.</p>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isGroup = c.type === "group";
            const isActive = activeConversationId === c.id;
            const other = c.other_participant;
            const title = isGroup
              ? c.title || "Grupo"
              : other?.nickname
              ? `${other.nickname} (${other.nome})`
              : other?.nome || other?.discord_username || "Membro";

            const avatarUrl = isGroup ? c.avatar_url : other?.discord_avatar_url;
            const initials = (isGroup ? c.title || "GR" : other?.nickname || other?.nome || "M").slice(0, 2).toUpperCase();
            const isOnline = other?.presence_status === "online";
            const isAusente = other?.presence_status === "ausente";
            const unread = c.unread_count || 0;

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className={cn(
                  "group relative flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-150 border",
                  isActive
                    ? "bg-primary/15 border-primary/40 shadow-sm text-foreground before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-primary before:rounded-r-full"
                    : "border-transparent hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {/* AVATAR WITH STATUS INDICATOR */}
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10 border border-border/80 group-hover:border-primary/40 transition-colors shadow-xs">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
                    <AvatarFallback className="bg-secondary text-foreground font-bold text-xs">
                      {isGroup ? <Users className="h-4 w-4 text-primary" /> : initials}
                    </AvatarFallback>
                  </Avatar>

                  {!isGroup && other && (
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card",
                        isOnline ? "bg-emerald-500" : isAusente ? "bg-amber-500" : "bg-zinc-500"
                      )}
                      title={isOnline ? "Online" : isAusente ? "Ausente" : "Offline"}
                    />
                  )}
                </div>

                {/* TEXT & LAST MESSAGE */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={cn("truncate text-xs font-bold leading-tight", isActive ? "text-primary font-extrabold" : "text-foreground")}>
                        {title}
                      </span>
                      {isGroup && c.only_admins_can_post && (
                        <Lock className="h-3 w-3 text-amber-400 shrink-0" title="Somente administradores podem falar" />
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {formatTimeOnly(c.last_message_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-[11px] text-muted-foreground leading-tight">
                      {c.last_message ? (
                        <span>{c.last_message}</span>
                      ) : (
                        <span className="italic opacity-60">Nenhuma mensagem</span>
                      )}
                    </p>

                    {unread > 0 && (
                      <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-primary-foreground font-black text-[10px] font-mono shadow-xs shrink-0 animate-pulse">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
