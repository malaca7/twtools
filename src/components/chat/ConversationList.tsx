import { useState, useEffect } from "react";
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
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  MailCheck,
  Mail,
  MoreVertical,
  Bell,
  BellOff,
  Check,
  Music2,
  SlidersHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import {
  togglePinConversation,
  toggleMuteConversation,
  toggleArchiveConversation,
  markConversationAsRead,
  markConversationAsUnread,
  deleteConversationForUser,
  getUserChatFolders,
} from "@/services/chatService";
import { chatSound } from "@/lib/chatSound";
import { ChatSoundSettingsDialog } from "./ChatSoundSettingsDialog";
import { ManageFoldersDialog } from "./ManageFoldersDialog";
import { formatTimeOnly, formatUserPresenceText } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatUserFolder } from "@/types/chat";
import { toast } from "sonner";
import { Folder, FolderCog } from "lucide-react";

interface ConversationListProps {
  conversations: ChatConversation[];
  activeConversationId?: string | null;
  onSelectConversation: (conv: ChatConversation) => void;
  onCreateGroup: () => void;
  isLoading?: boolean;
  viewMode?: "split" | "focus";
  onToggleViewMode?: (mode: "split" | "focus") => void;
}

type FilterType = "all" | "unread" | "pinned" | "archived" | "groups" | "direct";

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateGroup,
  isLoading,
  viewMode = "split",
  onToggleViewMode,
}: ConversationListProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [userFolders, setUserFolders] = useState<ChatUserFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [manageFoldersOpen, setManageFoldersOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(chatSound.isEnabled());
  const [soundSettingsOpen, setSoundSettingsOpen] = useState(false);
  const [convToDelete, setConvToDelete] = useState<ChatConversation | null>(null);

  const loadFolders = async () => {
    if (!currentUserId) return;
    try {
      const data = await getUserChatFolders(currentUserId);
      setUserFolders(data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (currentUserId) {
      void loadFolders();
    }
  }, [currentUserId]);

  useEffect(() => {
    const handleSoundChange = (e: any) => {
      if (typeof e.detail?.enabled === "boolean") {
        setSoundEnabled(e.detail.enabled);
      }
    };
    window.addEventListener("tw_chat_sound_change", handleSoundChange);
    return () => window.removeEventListener("tw_chat_sound_change", handleSoundChange);
  }, []);

  const handleToggleSound = () => {
    const next = chatSound.toggle();
    setSoundEnabled(next);
  };

  // HANDLERS DE GERENCIAMENTO DE CONVERSAS COM RESPOSTA EM 0ms
  const handlePin = async (e: React.MouseEvent, conv: ChatConversation) => {
    e.stopPropagation();
    const nextPinned = !conv.is_pinned;
    // Otimista
    queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
      old.map((c) => (c.id === conv.id ? { ...c, is_pinned: nextPinned } : c))
    );
    try {
      await togglePinConversation(conv.id, currentUserId);
      toast.success(nextPinned ? "Conversa fixada no topo!" : "Conversa desafixada.");
    } catch {
      toast.error("Erro ao alterar fixação.");
      void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
    }
  };

  const handleMute = async (e: React.MouseEvent, conv: ChatConversation) => {
    e.stopPropagation();
    const nextMuted = !conv.is_muted;
    // Otimista
    queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
      old.map((c) => (c.id === conv.id ? { ...c, is_muted: nextMuted } : c))
    );
    try {
      await toggleMuteConversation(conv.id, currentUserId);
      toast.success(nextMuted ? "Notificações silenciadas." : "Notificações ativadas!");
    } catch {
      toast.error("Erro ao alterar silêncio.");
      void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
    }
  };

  const handleArchive = async (e: React.MouseEvent, conv: ChatConversation) => {
    e.stopPropagation();
    const nextArchived = !conv.is_archived;
    // Otimista
    queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
      old.map((c) => (c.id === conv.id ? { ...c, is_archived: nextArchived } : c))
    );
    try {
      await toggleArchiveConversation(conv.id, currentUserId);
      toast.success(nextArchived ? "Conversa arquivada!" : "Conversa desarquivada.");
    } catch {
      toast.error("Erro ao alterar arquivamento.");
      void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
    }
  };

  const handleToggleReadStatus = async (e: React.MouseEvent, conv: ChatConversation) => {
    e.stopPropagation();
    const isCurrentlyUnread = (conv.unread_count || 0) > 0;
    if (isCurrentlyUnread) {
      // Marcar como lido
      queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
        old.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      );
      if (currentUserId) void markConversationAsRead(conv.id, currentUserId);
      toast.success("Marcada como lida.");
    } else {
      // Marcar como não lido
      queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
        old.map((c) => (c.id === conv.id ? { ...c, unread_count: 1 } : c))
      );
      if (currentUserId) void markConversationAsUnread(conv.id, currentUserId);
      toast.success("Marcada como não lida.");
    }
  };

  const handleConfirmDeleteConversation = async () => {
    if (!convToDelete || !currentUserId) return;
    const deletedId = convToDelete.id;
    setConvToDelete(null);

    // Otimista: remove da lista imediatamente
    queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
      old.filter((c) => c.id !== deletedId)
    );

    try {
      await deleteConversationForUser(deletedId, currentUserId);
      toast.success("Conversa apagada com sucesso!");
    } catch {
      toast.error("Erro ao apagar conversa.");
      void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
    }
  };

  // FILTRAGEM & ORDENAÇÃO
  const filteredConversations = conversations.filter((c) => {
    const isGroup = c.type === "group";
    const other = c.other_participant;
    const title = isGroup ? c.title || "" : other?.nickname || other?.nome || "Membro";

    // Filtro por Pasta Personalizada selecionada
    if (selectedFolderId) {
      const activeFolder = userFolders.find((f) => f.id === selectedFolderId);
      if (activeFolder && !activeFolder.conversation_ids?.includes(c.id)) {
        return false;
      }
    }

    // Filtro de Arquivadas
    if (activeFilter === "archived") {
      if (!c.is_archived) return false;
    } else {
      // Nas outras abas, omite as arquivadas por padrão
      if (c.is_archived) return false;
    }

    if (activeFilter === "unread" && (c.unread_count || 0) === 0) return false;
    if (activeFilter === "pinned" && !c.is_pinned) return false;
    if (activeFilter === "groups" && !isGroup) return false;
    if (activeFilter === "direct" && isGroup) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return title.toLowerCase().includes(q) || (c.last_message || "").toLowerCase().includes(q);
  });

  const pinnedCount = conversations.filter((c) => c.is_pinned && !c.is_archived).length;
  const archivedCount = conversations.filter((c) => c.is_archived).length;
  const unreadCount = conversations.filter((c) => (c.unread_count || 0) > 0 && !c.is_archived).length;

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

            {/* SOUND TOGGLE & SETTINGS */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                  title={soundEnabled ? "Sons ativados (clique para opções)" : "Sons desativados"}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 text-xs rounded-xl">
                <DropdownMenuItem onClick={handleToggleSound} className="cursor-pointer">
                  {soundEnabled ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5 mr-2 text-rose-400" /> Silenciar Sons do Chat
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 mr-2 text-emerald-400" /> Ativar Sons do Chat
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSoundSettingsOpen(true)} className="cursor-pointer font-bold text-primary">
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-primary" /> Mudar Sons do Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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

        {/* PASTAS PERSONALIZADAS (FOLDERS BAR) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 border-b border-border/40">
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all shrink-0 cursor-pointer border flex items-center gap-1",
              selectedFolderId === null
                ? "bg-foreground/10 text-foreground border-foreground/30 font-black shadow-2xs"
                : "bg-secondary/20 text-muted-foreground hover:text-foreground border-border/40 hover:bg-secondary"
            )}
          >
            <Folder className="h-3 w-3" />
            <span>Todas</span>
          </button>

          {userFolders.map((f) => {
            const isSel = selectedFolderId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFolderId(f.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all shrink-0 cursor-pointer border flex items-center gap-1",
                  isSel
                    ? "text-white font-black shadow-xs"
                    : "bg-secondary/20 text-muted-foreground hover:text-foreground border-border/40 hover:bg-secondary"
                )}
                style={isSel ? { backgroundColor: f.color || "#6366f1", borderColor: f.color } : {}}
              >
                <span>{f.name}</span>
                {f.conversation_ids?.length > 0 && (
                  <span className="text-[9px] opacity-75 font-mono">({f.conversation_ids.length})</span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setManageFoldersOpen(true)}
            className="px-2 py-1 rounded-lg text-[10px] font-bold text-primary hover:bg-primary/10 transition-all shrink-0 cursor-pointer flex items-center gap-1 ml-auto border border-dashed border-primary/30"
            title="Gerenciar pastas de conversas"
          >
            <FolderCog className="h-3 w-3" />
            <span>Pastas</span>
          </button>
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
            Tudo ({conversations.filter((c) => !c.is_archived).length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("unread")}
            className={cn(
              "px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1",
              activeFilter === "unread"
                ? "bg-primary text-primary-foreground border-primary/40 shadow-xs shadow-primary/20"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary"
            )}
          >
            <span>Não Lidas</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px]">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("pinned")}
            className={cn(
              "px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1",
              activeFilter === "pinned"
                ? "bg-primary text-primary-foreground border-primary/40 shadow-xs shadow-primary/20"
                : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary"
            )}
          >
            <Pin className="h-3 w-3" />
            <span>Fixadas ({pinnedCount})</span>
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

          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter("archived")}
              className={cn(
                "px-3 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1",
                activeFilter === "archived"
                  ? "bg-primary text-primary-foreground border-primary/40 shadow-xs shadow-primary/20"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground border-border/50 hover:bg-secondary"
              )}
            >
              <Archive className="h-3 w-3" />
              <span>Arquivadas ({archivedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* CONVERSATION ITEMS SCROLL LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground text-xs">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Carregando conversas...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-muted-foreground space-y-1.5 select-none">
            <span className="text-2xl">💬</span>
            <p className="text-xs font-bold text-foreground">Nenhuma conversa encontrada</p>
            <p className="text-[11px]">
              {activeFilter === "archived"
                ? "Você não possui conversas arquivadas."
                : "Inicie um novo chat ou grupo para começar."}
            </p>
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
            const isPinned = Boolean(c.is_pinned);
            const isMuted = Boolean(c.is_muted);
            const isArchived = Boolean(c.is_archived);

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className={cn(
                  "group relative flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-150 border",
                  isActive
                    ? "bg-primary/15 border-primary/40 shadow-sm text-foreground before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:bg-primary before:rounded-r-full"
                    : isPinned
                    ? "bg-secondary/40 border-primary/20 hover:bg-secondary/70 text-foreground"
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
                        isOnline ? "bg-emerald-500" : isAusente ? "bg-amber-500 animate-pulse" : "bg-zinc-500"
                      )}
                      title={formatUserPresenceText(
                        other.presence_status,
                        other.last_seen,
                        other.presence_updated_at || other.updated_at
                      )}
                    />
                  )}
                </div>

                {/* TEXT & LAST MESSAGE */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isPinned && (
                        <Pin className="h-3 w-3 text-primary shrink-0 fill-primary/30 rotate-45" title="Conversa Fixada" />
                      )}
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
                    <p className="truncate text-[11px] text-muted-foreground leading-tight max-w-[190px] sm:max-w-[220px]">
                      {c.last_message ? (
                        <span>{c.last_message}</span>
                      ) : (
                        <span className="italic opacity-60">Nenhuma mensagem</span>
                      )}
                    </p>

                    <div className="flex items-center gap-1 shrink-0">
                      {isMuted && (
                        <VolumeX className="h-3 w-3 text-muted-foreground/70" title="Silenciado" />
                      )}

                      {unread > 0 && (
                        <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-primary-foreground font-black text-[10px] font-mono shadow-xs shrink-0 animate-pulse">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}

                      {/* CONVERSATION ACTIONS DROPDOWN */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-opacity cursor-pointer"
                            title="Opções da conversa"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 text-xs bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl z-50"
                        >
                          <DropdownMenuItem
                            onClick={(e) => handlePin(e, c)}
                            className="cursor-pointer font-medium"
                          >
                            {isPinned ? (
                              <>
                                <PinOff className="h-3.5 w-3.5 mr-2 text-primary" /> Desafixar Chat
                              </>
                            ) : (
                              <>
                                <Pin className="h-3.5 w-3.5 mr-2 text-primary" /> Fixar no Topo
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => handleToggleReadStatus(e, c)}
                            className="cursor-pointer font-medium"
                          >
                            {unread > 0 ? (
                              <>
                                <MailCheck className="h-3.5 w-3.5 mr-2 text-emerald-400" /> Marcar como Lido
                              </>
                            ) : (
                              <>
                                <Mail className="h-3.5 w-3.5 mr-2 text-amber-400" /> Marcar como Não Lido
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => handleMute(e, c)}
                            className="cursor-pointer font-medium"
                          >
                            {isMuted ? (
                              <>
                                <Bell className="h-3.5 w-3.5 mr-2 text-emerald-400" /> Ativar Notificações
                              </>
                            ) : (
                              <>
                                <BellOff className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Silenciar Chat
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => handleArchive(e, c)}
                            className="cursor-pointer font-medium"
                          >
                            {isArchived ? (
                              <>
                                <ArchiveRestore className="h-3.5 w-3.5 mr-2 text-primary" /> Desarquivar Chat
                              </>
                            ) : (
                              <>
                                <Archive className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Arquivar Chat
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setConvToDelete(c);
                            }}
                            className="cursor-pointer font-medium text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar Conversa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO PARA APAGAR CONVERSA */}
      <AlertDialog
        open={Boolean(convToDelete)}
        onOpenChange={(open) => !open && setConvToDelete(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black flex items-center gap-2 text-rose-400">
              <Trash2 className="h-4 w-4" />
              Apagar conversa?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Você tem certeza de que deseja apagar a conversa com &quot;
              <strong className="text-foreground">
                {convToDelete?.type === "group"
                  ? convToDelete.title
                  : convToDelete?.other_participant?.nickname || convToDelete?.other_participant?.nome || "Membro"}
              </strong>
              &quot;? As mensagens desta conversa deixarão de aparecer na sua lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteConversation}
              className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Sim, apagar conversa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGO DE CONFIGURAÇÃO DE SONS DO CHAT */}
      <ChatSoundSettingsDialog
        open={soundSettingsOpen}
        onOpenChange={setSoundSettingsOpen}
      />

      {/* DIÁLOGO DE GERENCIAMENTO DE PASTAS */}
      <ManageFoldersDialog
        open={manageFoldersOpen}
        onOpenChange={setManageFoldersOpen}
        folders={userFolders}
        conversations={conversations}
        currentUserId={currentUserId}
        onFoldersUpdated={loadFolders}
      />
    </div>
  );
}
