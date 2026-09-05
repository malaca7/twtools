import React, { useState, useEffect } from "react";
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
  Folder,
  FolderCog,
  Mic,
  Image as ImageIcon,
  Video,
  FileText,
  Vote,
  Calendar,
  MessageSquarePlus,
  CheckCheck,
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
  markAllConversationsAsRead,
  deleteConversationForUser,
  getUserChatFolders,
} from "@/services/chatService";
import { chatSound } from "@/lib/chatSound";
import { ChatSoundSettingsDialog } from "./ChatSoundSettingsDialog";
import { ManageFoldersDialog } from "./ManageFoldersDialog";
import { formatTimeOnly, formatUserPresenceText } from "@/lib/format";
import { cn } from "@/lib/utils";
import { MessageStatusIcon } from "./MessageStatusIcon";
import type { ChatConversation, ChatUserFolder, MessageStatus } from "@/types/chat";
import { toast } from "sonner";

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
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onCreateGroup,
  isLoading,
  viewMode = "split",
  onToggleViewMode,
}: ConversationListProps) {
  const { user, profile } = useAuth();
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
      setUserFolders(Array.isArray(data) ? data : []);
    } catch {
      setUserFolders([]);
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

  // Handlers de gerenciamento de conversa
  const handlePin = async (e: React.MouseEvent, conv: ChatConversation) => {
    e.stopPropagation();
    const nextPinned = !conv.is_pinned;
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
      queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
        old.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
      );
      if (currentUserId) void markConversationAsRead(conv.id, currentUserId);
      toast.success("Marcada como lida.");
    } else {
      queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
        old.map((c) => (c.id === conv.id ? { ...c, unread_count: 1 } : c))
      );
      if (currentUserId) void markConversationAsUnread(conv.id, currentUserId);
      toast.success("Marcada como não lida.");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return;
    queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
      old.map((c) => ({ ...c, unread_count: 0 }))
    );
    try {
      await markAllConversationsAsRead(currentUserId);
      toast.success("Todas as conversas foram marcadas como lidas.");
    } catch {
      void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
    }
  };

  const handleConfirmDeleteConversation = async () => {
    if (!convToDelete || !currentUserId) return;
    const deletedId = convToDelete.id;
    setConvToDelete(null);

    queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
      old.filter((c) => c.id !== deletedId)
    );

    try {
      await deleteConversationForUser(deletedId, currentUserId);
      toast.success("Conversa apagada.");
    } catch {
      toast.error("Erro ao apagar conversa.");
      void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
    }
  };

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const safeUserFolders = Array.isArray(userFolders) ? userFolders : [];

  // Filtragem
  const filteredConversations = safeConversations.filter((c) => {
    if (!c) return false;
    const isGroup = c.type === "group";
    const other = c.other_participant;
    const title = isGroup ? c.title || "" : other?.nickname || other?.nome || "Membro";

    if (selectedFolderId) {
      const activeFolder = safeUserFolders.find((f) => f.id === selectedFolderId);
      if (activeFolder && !activeFolder.conversation_ids?.includes(c.id)) {
        return false;
      }
    }

    if (activeFilter === "archived") {
      if (!c.is_archived) return false;
    } else {
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

  const pinnedCount = safeConversations.filter((c) => c?.is_pinned && !c?.is_archived).length;
  const archivedCount = safeConversations.filter((c) => c?.is_archived).length;
  const unreadCount = safeConversations.filter((c) => (c?.unread_count || 0) > 0 && !c?.is_archived).length;

  const myAvatarUrl = profile?.avatar_url || profile?.discord_avatar_url;
  const myInitials = (profile?.nickname || profile?.nome || "EU").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full w-full bg-[#111b21] overflow-hidden select-none">
      {/* ─── WHATSAPP WEB SIDEBAR HEADER (#202c33) ─── */}
      <div className="p-2.5 sm:px-3 sm:py-2.5 bg-[#202c33] border-b border-white/5 flex items-center justify-between shrink-0 shadow-sm">
        {/* AVATAR DO USUÁRIO LOGADO */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 border border-white/10 shadow-xs">
            {myAvatarUrl && <AvatarImage src={myAvatarUrl} alt="Meu Perfil" />}
            <AvatarFallback className="bg-emerald-700 text-white text-xs font-bold">
              {myInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold text-[#e9edef] hidden sm:inline truncate max-w-[110px]">
            {profile?.nickname || profile?.nome || "Meu Chat"}
          </span>
        </div>

        {/* AÇÕES DE TOPO DO WHATSAPP */}
        <div className="flex items-center gap-1 text-[#aebac1]">
          {/* LAYOUT MODE TOGGLE */}
          {onToggleViewMode && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onToggleViewMode(viewMode === "split" ? "focus" : "split")}
              className="h-8 w-8 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full cursor-pointer hidden sm:flex"
              title={viewMode === "split" ? "Modo Dividido ativo" : "Modo Foco ativo"}
            >
              {viewMode === "split" ? (
                <Columns2 className="h-4 w-4 text-[#00a884]" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* NOVO GRUPO */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCreateGroup}
            className="h-8 w-8 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
            title="Novo grupo"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>

          {/* SONS */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
                title={soundEnabled ? "Sons ativados" : "Sons desativados"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-[#00a884]" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 text-xs bg-[#233138] border border-white/10 text-white rounded-xl shadow-2xl p-1">
              <DropdownMenuItem onClick={handleToggleSound} className="cursor-pointer hover:bg-white/10 rounded-lg">
                {soundEnabled ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5 mr-2 text-rose-400" /> Desativar sons
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5 mr-2 text-[#00a884]" /> Ativar sons
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSoundSettingsOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-lg text-[#00a884] font-bold">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-2" /> Personalizar sons
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* MENU 3-PONTOS */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
                title="Mais opções"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs bg-[#233138] border border-white/10 text-white rounded-xl shadow-2xl p-1 z-50">
              <DropdownMenuItem
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="cursor-pointer hover:bg-white/10 rounded-lg text-[#00a884] font-bold"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-2" /> Marcar todas como lidas
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onClick={onCreateGroup} className="cursor-pointer hover:bg-white/10 rounded-lg">
                <Users className="h-3.5 w-3.5 mr-2 text-[#00a884]" /> Novo grupo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setManageFoldersOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-lg">
                <FolderCog className="h-3.5 w-3.5 mr-2 text-[#7f66ff]" /> Gerenciar pastas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── WHATSAPP SEARCH BAR (#111b21) ─── */}
      <div className="p-2.5 space-y-2 border-b border-white/5 bg-[#111b21] shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
          <Input
            placeholder="Pesquisar ou começar uma nova conversa"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 pr-3 text-xs bg-[#202c33] border-transparent rounded-lg text-[#e9edef] placeholder:text-[#8696a0] focus:border-white/10 transition-colors"
          />
        </div>

        {/* PASTAS PERSONALIZADAS (SE EXISTIREM) */}
        {userFolders.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10.5px] font-bold transition-all shrink-0 cursor-pointer border",
                selectedFolderId === null
                  ? "bg-white/10 text-white border-white/20 font-black"
                  : "bg-transparent text-[#8696a0] hover:text-white border-transparent"
              )}
            >
              Todas
            </button>

            {userFolders.map((f) => {
              const isSel = selectedFolderId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFolderId(f.id)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10.5px] font-bold transition-all shrink-0 cursor-pointer border",
                    isSel
                      ? "text-white font-black"
                      : "bg-transparent text-[#8696a0] hover:text-white border-transparent"
                  )}
                  style={isSel ? { backgroundColor: f.color || "#00a884", borderColor: f.color } : {}}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── WHATSAPP FILTER CHIPS ─── */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer",
              activeFilter === "all"
                ? "bg-[#00a884] text-white font-bold shadow-xs"
                : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]/80"
            )}
          >
            Tudo
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("unread")}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1",
              activeFilter === "unread"
                ? "bg-[#00a884] text-white font-bold shadow-xs"
                : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]/80"
            )}
          >
            <span>Não lidas</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#25d366] text-black font-mono text-[9px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("groups")}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer",
              activeFilter === "groups"
                ? "bg-[#00a884] text-white font-bold shadow-xs"
                : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]/80"
            )}
          >
            Grupos
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("direct")}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer",
              activeFilter === "direct"
                ? "bg-[#00a884] text-white font-bold shadow-xs"
                : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]/80"
            )}
          >
            Contatos
          </button>

          {pinnedCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter("pinned")}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1",
                activeFilter === "pinned"
                  ? "bg-[#00a884] text-white font-bold shadow-xs"
                  : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]/80"
              )}
            >
              <Pin className="h-3 w-3" />
              <span>Fixadas</span>
            </button>
          )}

          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter("archived")}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1",
                activeFilter === "archived"
                  ? "bg-[#00a884] text-white font-bold shadow-xs"
                  : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]/80"
              )}
            >
              <Archive className="h-3 w-3" />
              <span>Arquivadas ({archivedCount})</span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 bg-[#00a884]/15 hover:bg-[#00a884]/25 text-[#00a884] border border-[#00a884]/30 active:scale-95 shadow-2xs"
              title="Marcar todas as conversas como lidas"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Ler todas</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── WHATSAPP CONVERSATION LIST SCROLLER ─── */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-[#8696a0] text-xs">
            <div className="h-5 w-5 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
            <span>Carregando conversas...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-[#8696a0] space-y-1 select-none">
            <span className="text-2xl">💬</span>
            <p className="text-xs font-bold text-[#e9edef]">Nenhuma conversa encontrada</p>
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

            const isLastMsgSelf = c.last_message_sender_id === currentUserId;
            let lastMsgStatus: MessageStatus = "sent";
            if (isLastMsgSelf && c.last_message_at) {
              const lastTime = new Date(c.last_message_at).getTime();
              const otherParts = (c.participants || []).filter((p) => p.user_id !== currentUserId);
              if (otherParts.length > 0) {
                const allRead = otherParts.every(
                  (p) => p.last_read_at && new Date(p.last_read_at).getTime() >= lastTime
                );
                if (allRead) {
                  lastMsgStatus = "read";
                } else {
                  const anyDelivered = otherParts.some(
                    (p) =>
                      (p.last_read_at && new Date(p.last_read_at).getTime() >= lastTime) ||
                      p.profile?.presence_status === "online" ||
                      (p.profile?.last_seen && new Date(p.profile.last_seen).getTime() >= lastTime)
                  );
                  if (anyDelivered) lastMsgStatus = "delivered";
                }
              }
            }

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-all duration-150 select-none",
                  isActive
                    ? "bg-[#2a3942] text-white"
                    : unread > 0
                    ? "bg-[#00a884]/[0.08] hover:bg-[#00a884]/[0.15] text-[#d1d7db] border-l-[3.5px] border-[#25d366]"
                    : "hover:bg-[#202c33]/70 text-[#8696a0]"
                )}
              >
                {/* AVATAR COM INDICADOR DE STATUS */}
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12 border border-white/10 shadow-xs">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
                    <AvatarFallback className="bg-[#202c33] text-[#00a884] font-bold text-sm">
                      {isGroup ? <Users className="h-5 w-5" /> : initials}
                    </AvatarFallback>
                  </Avatar>

                  {!isGroup && other && (
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-[#111b21]",
                        isOnline ? "bg-[#25d366]" : isAusente ? "bg-amber-500 animate-pulse" : "bg-zinc-500"
                      )}
                      title={formatUserPresenceText(
                        other.presence_status,
                        other.last_seen,
                        other.presence_updated_at || other.updated_at
                      )}
                    />
                  )}
                </div>

                {/* CONVERSATION DETAILS & PREVIEW */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={cn(
                          "truncate text-sm leading-tight",
                          isActive
                            ? "text-white font-semibold"
                            : unread > 0
                            ? "text-white font-bold"
                            : "text-[#e9edef] font-medium"
                        )}
                      >
                        {title}
                      </span>
                      {unread > 0 && !isActive && (
                        <span
                          className="h-2 w-2 rounded-full bg-[#25d366] shrink-0 shadow-[0_0_6px_rgba(37,211,102,0.7)] animate-pulse"
                          title="Mensagens não lidas"
                        />
                      )}
                      {isGroup && c.only_admins_can_post && (
                        <Lock className="h-3 w-3 text-amber-400 shrink-0" title="Somente admins" />
                      )}
                    </div>

                    <span
                      className={cn(
                        "text-[11px] font-mono shrink-0",
                        unread > 0 ? "text-[#25d366] font-bold" : "text-[#8696a0]"
                      )}
                    >
                      {formatTimeOnly(c.last_message_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={cn(
                        "truncate text-xs leading-tight flex items-center gap-1 max-w-[200px] sm:max-w-[230px]",
                        unread > 0 ? "text-[#e9edef] font-medium" : "text-[#8696a0]"
                      )}
                    >
                      {isLastMsgSelf && c.last_message && (
                        <MessageStatusIcon status={lastMsgStatus} className="h-3 w-3 shrink-0 inline-block mr-0.5" />
                      )}
                      {c.last_message ? (
                        <span className="truncate">{c.last_message}</span>
                      ) : (
                        <span className="italic opacity-60">Nenhuma mensagem</span>
                      )}
                    </p>

                    <div className="flex items-center gap-1 shrink-0">
                      {isMuted && (
                        <VolumeX className="h-3.5 w-3.5 text-[#8696a0]" title="Silenciado" />
                      )}

                      {isPinned && (
                        <Pin className="h-3.5 w-3.5 text-[#8696a0] fill-[#8696a0] rotate-45" title="Fixada" />
                      )}

                      {unread > 0 && (
                        <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#25d366] text-black font-black text-[11px] font-mono shadow-[0_0_10px_rgba(37,211,102,0.45)] shrink-0 animate-in zoom-in-75">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}

                      {/* CONTEXT MENU ON HOVER */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 flex items-center justify-center text-[#8696a0] hover:text-white transition-opacity cursor-pointer"
                            title="Opções da conversa"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 text-xs bg-[#233138] border border-white/10 text-white rounded-xl shadow-2xl p-1 z-50"
                        >
                          <DropdownMenuItem
                            onClick={(e) => handlePin(e, c)}
                            className="cursor-pointer hover:bg-white/10 rounded-lg"
                          >
                            {isPinned ? (
                              <>
                                <PinOff className="h-3.5 w-3.5 mr-2 text-[#00a884]" /> Desafixar conversa
                              </>
                            ) : (
                              <>
                                <Pin className="h-3.5 w-3.5 mr-2 text-[#00a884]" /> Fixar no topo
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => handleToggleReadStatus(e, c)}
                            className="cursor-pointer hover:bg-white/10 rounded-lg"
                          >
                            {unread > 0 ? (
                              <>
                                <MailCheck className="h-3.5 w-3.5 mr-2 text-[#00a884]" /> Marcar como lida
                              </>
                            ) : (
                              <>
                                <Mail className="h-3.5 w-3.5 mr-2 text-amber-400" /> Marcar como não lida
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => handleMute(e, c)}
                            className="cursor-pointer hover:bg-white/10 rounded-lg"
                          >
                            {isMuted ? (
                              <>
                                <Bell className="h-3.5 w-3.5 mr-2 text-[#00a884]" /> Ativar notificações
                              </>
                            ) : (
                              <>
                                <BellOff className="h-3.5 w-3.5 mr-2 text-[#8696a0]" /> Silenciar conversa
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => handleArchive(e, c)}
                            className="cursor-pointer hover:bg-white/10 rounded-lg"
                          >
                            {isArchived ? (
                              <>
                                <ArchiveRestore className="h-3.5 w-3.5 mr-2 text-[#00a884]" /> Desarquivar conversa
                              </>
                            ) : (
                              <>
                                <Archive className="h-3.5 w-3.5 mr-2 text-[#8696a0]" /> Arquivar conversa
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-white/10" />

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setConvToDelete(c);
                            }}
                            className="cursor-pointer hover:bg-rose-500/20 text-rose-400 rounded-lg font-bold"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar conversa
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
        <AlertDialogContent className="max-w-md rounded-2xl bg-[#233138] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-rose-400">
              <Trash2 className="h-4 w-4" />
              Apagar conversa?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#8696a0] leading-relaxed">
              Você tem certeza de que deseja apagar a conversa com &quot;
              <strong className="text-white">
                {convToDelete?.type === "group"
                  ? convToDelete.title
                  : convToDelete?.other_participant?.nickname || convToDelete?.other_participant?.nome || "Membro"}
              </strong>
              &quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteConversation}
              className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Sim, apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DIÁLOGOS DE SONS E PASTAS */}
      <ChatSoundSettingsDialog
        open={soundSettingsOpen}
        onOpenChange={setSoundSettingsOpen}
      />

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
