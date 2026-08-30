import { useState, memo } from "react";
import {
  Reply,
  Copy,
  Edit2,
  Trash2,
  Smile,
  FileText,
  Download,
  Play,
  Pause,
  ExternalLink,
  MoreVertical,
  Check,
  CheckCheck,
  Shield,
  Volume2,
  ArrowRight,
  Forward,
  CheckSquare,
  Square,
  Pin,
  Star,
  Bell,
  Vote,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MessageStatusIcon } from "./MessageStatusIcon";
import { PollBubbleCard } from "./PollBubbleCard";
import { EventBubbleCard } from "./EventBubbleCard";
import { formatTimeOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessage, ParticipantRole, PollData, EventData } from "@/types/chat";
import { toast } from "sonner";
import { MessageSquare, AlertTriangle, Clock } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  isGroup: boolean;
  userRole?: ParticipantRole;
  currentUserId?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (messageId: string) => void;
  onReply: (message: ChatMessage) => void;
  onOpenThread?: (message: ChatMessage) => void;
  onReportMessage?: (message: ChatMessage) => void;
  onForward?: (message: ChatMessage) => void;
  onPin?: (messageId: string) => void;
  onSave?: (messageId: string) => void;
  onReminder?: (message: ChatMessage) => void;
  onPollUpdated?: (messageId: string, pollData: PollData) => void;
  onEventUpdated?: (messageId: string, eventData: EventData) => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string, forEveryone: boolean) => void;
  onScrollToMessage?: (messageId: string) => void;
  onOpenProfile?: (userId: string) => void;
}

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "🎉", "👎"];

function MessageBubbleBase({
  message,
  isSelf,
  isGroup,
  userRole = "member",
  currentUserId,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onReply,
  onOpenThread,
  onReportMessage,
  onForward,
  onPin,
  onSave,
  onReminder,
  onPollUpdated,
  onEventUpdated,
  onReact,
  onEdit,
  onDelete,
  onScrollToMessage,
  onOpenProfile,
}: MessageBubbleProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [deleteConfirmMode, setDeleteConfirmMode] = useState<"self" | "everyone" | null>(null);

  const isSystem = message.message_type === "system";
  const isDeleted = message.is_deleted || message.is_deleted_for_everyone;
  const canDeleteForEveryone = isSelf || userRole === "admin";

  // System message render
  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-2.5 px-4">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/50 border border-border/60 text-muted-foreground text-[11px] font-medium shadow-xs max-w-md text-center backdrop-blur-sm">
          <span>{message.content}</span>
          <span className="text-[9px] opacity-60 font-mono ml-1">{formatTimeOnly(message.created_at)}</span>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Mensagem copiada para a área de transferência!");
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    onEdit(message.id, editContent);
    setEditing(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmMode) return;
    onDelete(message.id, deleteConfirmMode === "everyone");
    setDeleteConfirmMode(null);
  };

  // Group reactions by emoji
  const reactionsMap = new Map<string, { count: number; userIds: string[]; hasReacted: boolean }>();
  (message.reactions || []).forEach((r) => {
    const cur = reactionsMap.get(r.emoji) || { count: 0, userIds: [], hasReacted: false };
    cur.count += 1;
    cur.userIds.push(r.user_id);
    if (r.user_id === currentUserId) cur.hasReacted = true;
    reactionsMap.set(r.emoji, cur);
  });

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        "group relative flex items-center gap-2 my-1 transition-all duration-200",
        isSelf ? "justify-end ml-auto" : "justify-start mr-auto",
        "max-w-[95%] sm:max-w-[85%] md:max-w-[75%]"
      )}
    >
      {/* SELECTION CHECKBOX IN SELECTION MODE */}
      {isSelectionMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(message.id);
          }}
          className="shrink-0 p-1 cursor-pointer select-none"
        >
          <div
            className={cn(
              "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
              isSelected
                ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30"
                : "border-muted-foreground/40 bg-card hover:border-primary"
            )}
          >
            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </div>
        </button>
      )}

      <div
        className={cn(
          "flex flex-col transition-all duration-200 flex-1 min-w-0",
          isSelf ? "items-end" : "items-start",
          isSelectionMode && "cursor-pointer"
        )}
        onClick={() => {
          if (isSelectionMode) onToggleSelect?.(message.id);
        }}
      >
        {/* SENDER NAME IN GROUPS */}
        {isGroup && !isSelf && (
          <div className="flex items-center gap-1.5 px-1 mb-1 leading-none">
            <button
              type="button"
              onClick={(e) => {
                if (isSelectionMode) return;
                e.stopPropagation();
                onOpenProfile?.(message.sender_id);
              }}
              className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{message.sender_name || "Membro"}</span>
            </button>
            {message.sender_game_id && (
              <span className="text-[9px] font-mono text-muted-foreground">
                #{message.sender_game_id}
              </span>
            )}
          </div>
        )}

        {/* MESSAGE CARD CONTAINER */}
        <div
          className={cn(
            "relative rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-sm transition-all text-foreground",
            isSelf
              ? "bg-primary text-primary-foreground rounded-tr-xs"
              : "bg-secondary/80 border border-border/60 rounded-tl-xs",
            isDeleted && "opacity-60 italic bg-secondary/40 border border-dashed border-border",
            isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary"
          )}
        >
        {/* PIN, SAVED & EPHEMERAL BADGES */}
        {(message.is_pinned || message.is_saved || message.expires_at) && !isDeleted && (
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap select-none">
            {message.is_pinned && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wider",
                  isSelf ? "bg-black/30 text-primary-foreground" : "bg-primary/15 text-primary"
                )}
              >
                <Pin className="h-2.5 w-2.5 fill-current" /> Fixada
              </span>
            )}
            {message.is_saved && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wider",
                  isSelf ? "bg-black/30 text-amber-300" : "bg-amber-500/15 text-amber-500"
                )}
              >
                <Star className="h-2.5 w-2.5 fill-current" /> Salva
              </span>
            )}
            {message.expires_at && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold uppercase tracking-wider font-mono",
                  isSelf ? "bg-black/30 text-rose-300" : "bg-rose-500/15 text-rose-400"
                )}
                title={`Expira em: ${new Date(message.expires_at).toLocaleString()}`}
              >
                <Clock className="h-2.5 w-2.5" /> Temporária
              </span>
            )}
          </div>
        )}

        {/* FORWARDED MESSAGE HEADER */}
        {message.is_forwarded && !isDeleted && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-bold italic mb-1.5 select-none border-b pb-1",
              isSelf
                ? "text-primary-foreground/90 border-primary-foreground/20"
                : "text-muted-foreground border-border/40"
            )}
          >
            <Forward className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
            <span>
              {message.forwarded_from_name
                ? `Mensagem encaminhada de ${message.forwarded_from_name}`
                : "Mensagem encaminhada"}
            </span>
          </div>
        )}

        {/* REPLIED MESSAGE QUOTE PREVIEW */}
        {message.reply_to_message && !isDeleted && (
          <div
            onClick={() => message.reply_to_id && onScrollToMessage?.(message.reply_to_id)}
            className={cn(
              "flex flex-col border-l-2 pl-2 py-0.5 mb-1.5 rounded text-[11px] cursor-pointer transition-opacity hover:opacity-90",
              isSelf
                ? "border-primary-foreground/60 bg-black/20 text-primary-foreground/90"
                : "border-primary bg-background/50 text-foreground"
            )}
          >
            <span className="font-bold text-[10px] text-primary-foreground/80">
              {message.reply_to_message.sender_name}
            </span>
            <span className="line-clamp-1 italic">
              {message.reply_to_message.content || message.reply_to_message.attachment_name || "Anexo"}
            </span>
          </div>
        )}

        {/* ATTACHMENT PREVIEW */}
        {message.attachment_url && !isDeleted && (
          <div className="mb-2 space-y-1.5">
            {message.message_type === "image" && (
              <img
                src={message.attachment_url}
                alt={message.attachment_name || "Imagem"}
                onClick={() => setLightboxImage(message.attachment_url || null)}
                className="max-h-60 rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
              />
            )}
            {message.message_type === "video" && (
              <video
                src={message.attachment_url}
                controls
                className="max-h-60 w-full rounded-xl"
              />
            )}
            {message.message_type === "audio" && (
              <div
                className={cn(
                  "p-2 rounded-xl flex items-center gap-2 border",
                  isSelf ? "bg-black/20 border-primary-foreground/20" : "bg-card border-border"
                )}
              >
                <Volume2 className="h-4 w-4 shrink-0 text-primary" />
                <audio src={message.attachment_url} controls className="h-8 max-w-[200px]" />
              </div>
            )}
            {message.message_type === "document" && (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold hover:underline",
                  isSelf ? "bg-black/20 border-primary-foreground/30 text-primary-foreground" : "bg-card border-border/80 text-foreground"
                )}
              >
                <FileText className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{message.attachment_name || "Arquivo"}</span>
                <Download className="h-3.5 w-3.5 ml-auto opacity-70" />
              </a>
            )}
          </div>
        )}

        {/* MESSAGE CONTENT / POLL / EVENT / INLINE EDIT */}
        {editing ? (
          <div className="space-y-1.5">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-black/30 border border-primary-foreground/40 text-primary-foreground focus:outline-none resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-[10px]"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="h-6 px-2.5 text-[10px] font-bold"
                onClick={handleSaveEdit}
              >
                Salvar
              </Button>
            </div>
          </div>
        ) : message.message_type === "event" || message.event_data ? (
          <EventBubbleCard
            message={message}
            currentUserId={currentUserId}
            isSelf={isSelf}
            canManageEvent={userRole === "admin" || isSelf}
            onEventUpdated={(e) => onEventUpdated?.(message.id, e)}
          />
        ) : message.message_type === "poll" || message.poll_data ? (
          <PollBubbleCard
            message={message}
            currentUserId={currentUserId}
            isSelf={isSelf}
            canManagePoll={userRole === "admin" || isSelf}
            onPollUpdated={(p) => onPollUpdated?.(message.id, p)}
          />
        ) : (
          <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words select-text">
            {isDeleted ? "🚫 Mensagem apagada" : message.content}
          </p>
        )}

        {/* TIMESTAMP & STATUS ICON */}
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1 text-[9px] font-mono leading-none select-none",
            isSelf ? "text-primary-foreground/75" : "text-muted-foreground"
          )}
        >
          {message.is_edited && !isDeleted && (
            <span className="italic opacity-80 mr-0.5">editada</span>
          )}
          <span>{formatTimeOnly(message.created_at)}</span>
          {isSelf && !isDeleted && <MessageStatusIcon status={message.status} />}
        </div>
      </div>

      {/* THREAD REPLIES BUTTON */}
      {!isDeleted && (Boolean(message.thread_reply_count && message.thread_reply_count > 0) || onOpenThread) && (
        <div className="flex items-center gap-1 mt-1 px-1">
          {Boolean(message.thread_reply_count && message.thread_reply_count > 0) ? (
            <button
              type="button"
              onClick={() => onOpenThread?.(message)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-extrabold bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all cursor-pointer shadow-2xs"
            >
              <MessageSquare className="h-3 w-3" />
              <span>{message.thread_reply_count} resposta{message.thread_reply_count === 1 ? "" : "s"} na thread</span>
            </button>
          ) : null}
        </div>
      )}

      {/* REACTIONS PILLS */}
      {reactionsMap.size > 0 && !isDeleted && (
        <div className="flex items-center gap-1 mt-1 px-1 flex-wrap">
          {Array.from(reactionsMap.entries()).map(([emoji, data]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(message.id, emoji)}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-2xs",
                data.hasReacted
                  ? "bg-primary/20 border-primary/50 text-primary scale-105"
                  : "bg-secondary/70 border-border/70 hover:bg-secondary text-foreground hover:scale-105"
              )}
            >
              <span>{emoji}</span>
              <span className="text-[10px] font-mono">{data.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* HOVER ACTIONS TOOLBAR */}
      {!isDeleted && !editing && (
        <div
          className={cn(
            "absolute -top-3.5 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-0.5 p-0.5 rounded-full bg-card border border-border/80 shadow-lg z-10 backdrop-blur-md",
            isSelf ? "right-2" : "left-2"
          )}
        >
          {/* Quick Reaction trigger */}
          <DropdownMenu open={reactionMenuOpen} onOpenChange={setReactionMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="Reagir"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align={isSelf ? "end" : "start"}
              className="flex items-center gap-1 p-1 bg-card/95 backdrop-blur-xl border border-border rounded-full shadow-2xl"
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(message.id, emoji);
                    setReactionMenuOpen(false);
                  }}
                  className="h-7 w-7 rounded-full hover:bg-secondary flex items-center justify-center text-base hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reply */}
          <button
            type="button"
            onClick={() => onReply(message)}
            className="h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            title="Responder"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>

          {/* Pin */}
          {onPin && (
            <button
              type="button"
              onClick={() => onPin(message.id)}
              className={cn(
                "h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center cursor-pointer transition-colors",
                message.is_pinned ? "text-primary fill-primary" : "text-muted-foreground hover:text-foreground"
              )}
              title={message.is_pinned ? "Desafixar" : "Fixar"}
            >
              <Pin className={cn("h-3.5 w-3.5", message.is_pinned && "fill-current")} />
            </button>
          )}

          {/* Forward */}
          {onForward && (
            <button
              type="button"
              onClick={() => onForward(message)}
              className="h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Encaminhar"
            >
              <Forward className="h-3.5 w-3.5" />
            </button>
          )}

          {/* More options menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                title="Mais opções"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align={isSelf ? "end" : "start"}
              className="w-52 text-xs bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl"
            >
              <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
                <Copy className="h-3.5 w-3.5 mr-2" /> Copiar Mensagem
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onToggleSelect?.(message.id)} className="cursor-pointer">
                <CheckSquare className="h-3.5 w-3.5 mr-2 text-primary" /> Selecionar Mensagem
              </DropdownMenuItem>

              {onOpenThread && !message.thread_parent_id && (
                <DropdownMenuItem onClick={() => onOpenThread(message)} className="cursor-pointer">
                  <MessageSquare className="h-3.5 w-3.5 mr-2 text-primary" /> Responder em Thread
                </DropdownMenuItem>
              )}

              {onPin && (
                <DropdownMenuItem onClick={() => onPin(message.id)} className="cursor-pointer">
                  <Pin className="h-3.5 w-3.5 mr-2 text-primary" /> {message.is_pinned ? "Desafixar do Topo" : "Fixar no Topo"}
                </DropdownMenuItem>
              )}

              {onSave && (
                <DropdownMenuItem onClick={() => onSave(message.id)} className="cursor-pointer">
                  <Star className="h-3.5 w-3.5 mr-2 text-amber-400" /> {message.is_saved ? "Remover dos Salvos" : "Salvar Mensagem"}
                </DropdownMenuItem>
              )}

              {onReminder && (
                <DropdownMenuItem onClick={() => onReminder(message)} className="cursor-pointer">
                  <Bell className="h-3.5 w-3.5 mr-2 text-primary" /> Criar Lembrete
                </DropdownMenuItem>
              )}

              {onForward && (
                <DropdownMenuItem onClick={() => onForward(message)} className="cursor-pointer">
                  <Forward className="h-3.5 w-3.5 mr-2 text-primary" /> Encaminhar Mensagem
                </DropdownMenuItem>
              )}

              {onReportMessage && !isSelf && (
                <DropdownMenuItem onClick={() => onReportMessage(message)} className="cursor-pointer text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5 mr-2" /> Denunciar Mensagem
                </DropdownMenuItem>
              )}

              {isSelf && !message.poll_data && (
                <DropdownMenuItem onClick={() => setEditing(true)} className="cursor-pointer">
                  <Edit2 className="h-3.5 w-3.5 mr-2 text-primary" /> Editar Mensagem
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setDeleteConfirmMode("self");
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmMode("self");
                }}
                className="cursor-pointer text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar para mim
              </DropdownMenuItem>

              {canDeleteForEveryone && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setDeleteConfirmMode("everyone");
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmMode("everyone");
                  }}
                  className="cursor-pointer text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar para todos
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      </div>

      {/* CONFIRM DELETE DIALOG */}
      <AlertDialog
        open={Boolean(deleteConfirmMode)}
        onOpenChange={(open) => !open && setDeleteConfirmMode(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-black">
              {deleteConfirmMode === "everyone" ? "Apagar mensagem para todos?" : "Apagar mensagem para mim?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {deleteConfirmMode === "everyone"
                ? "Esta mensagem será removida e substituída por uma indicação de mensagem apagada para todos os participantes."
                : "Esta mensagem deixará de ser exibida apenas na sua visualização desta conversa."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Sim, apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* IMAGE LIGHTBOX MODAL */}
      <Dialog open={Boolean(lightboxImage)} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border border-border/80 shadow-2xl rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Visualização da Imagem</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2">
            {lightboxImage && (
              <img
                src={lightboxImage}
                alt="Imagem ampliada"
                className="max-h-[80vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleBase);
