import { useState } from "react";
import { Users, Search, Plus, MessageSquare, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTimeOnly, isTodayDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatConversation } from "@/types/chat";

interface ConversationListProps {
  conversations: ChatConversation[];
  isLoading: boolean;
  onSelectConversation: (conversation: ChatConversation) => void;
  onOpenCreateGroup: () => void;
}

export function ConversationList({
  conversations,
  isLoading,
  onSelectConversation,
  onOpenCreateGroup,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    if (c.type === "group") {
      return (c.title || "Grupo").toLowerCase().includes(q);
    }
    const other = c.other_participant;
    const name = other?.nickname || other?.nome || "";
    return name.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* SEARCH AND NEW GROUP BUTTON */}
      <div className="p-2.5 border-b border-border/60 flex items-center gap-2 shrink-0 bg-secondary/20">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-secondary/50 border-border/60 rounded-xl"
          />
        </div>

        <Button
          type="button"
          size="sm"
          onClick={onOpenCreateGroup}
          className="h-8 px-2.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
          title="Criar novo grupo"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Novo Grupo</span>
        </Button>
      </div>

      {/* CONVERSATION ITEMS LIST */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 divide-y divide-border/20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground text-xs">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Carregando conversas...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-2">
            <MessageSquare className="h-8 w-8 opacity-40" />
            <p className="text-xs font-bold text-foreground">Nenhuma conversa encontrada</p>
            <p className="text-[11px] leading-snug">
              Selecione um membro na aba <strong>Membros</strong> para conversar ou crie um <strong>Novo Grupo</strong>.
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const isGroup = c.type === "group";
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
            const hasUnread = c.unread_count > 0;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectConversation(c)}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer group pt-2 first:pt-1",
                  hasUnread
                    ? "bg-primary/5 hover:bg-primary/10 border border-primary/20"
                    : "hover:bg-secondary/60"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9 border border-border/80 shadow-xs">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {isGroup ? <Users className="h-4 w-4" /> : initials}
                      </AvatarFallback>
                    </Avatar>

                    {!isGroup && (
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                          isOnline ? "bg-emerald-500" : isAusente ? "bg-amber-500" : "bg-zinc-500"
                        )}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pr-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={cn(
                            "truncate text-xs leading-tight transition-colors",
                            hasUnread ? "font-black text-foreground" : "font-bold text-foreground/90 group-hover:text-primary"
                          )}
                        >
                          {title}
                        </span>
                        {!isGroup && other?.game_id && (
                          <span className="text-[9px] font-mono text-muted-foreground font-semibold">
                            #{other.game_id}
                          </span>
                        )}
                      </div>
                      {c.last_message_at && (
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {formatTimeOnly(c.last_message_at)}
                        </span>
                      )}
                    </div>

                    <p
                      className={cn(
                        "truncate text-[11px] leading-tight",
                        hasUnread ? "font-bold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {c.last_message || (isGroup ? "Grupo criado" : "Conversa iniciada")}
                    </p>
                  </div>
                </div>

                {hasUnread && (
                  <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground font-mono text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    {c.unread_count}
                  </Badge>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
