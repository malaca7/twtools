import { useState } from "react";
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
import { MessageStatusIcon } from "./MessageStatusIcon";
import { formatTimeOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessage, ParticipantRole } from "@/types/chat";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  isGroup: boolean;
  userRole?: ParticipantRole;
  currentUserId?: string;
  onReply: (message: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string, forEveryone: boolean) => void;
  onScrollToMessage?: (messageId: string) => void;
  onOpenProfile?: (userId: string) => void;
}

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "😂", "😮", "👏", "🎉", "💀"];

export function MessageBubble({
  message,
  isSelf,
  isGroup,
  userRole = "member",
  currentUserId,
  onReply,
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
        "group relative flex flex-col my-1 transition-all duration-200",
        isSelf ? "items-end ml-auto" : "items-start mr-auto",
        "max-w-[88%] sm:max-w-[78%] md:max-w-[70%]"
      )}
    >
      {/* SENDER NAME IN GROUPS */}
      {isGroup && !isSelf && (
        <div className="flex items-center gap-1.5 px-1 mb-1 leading-none">
          <button
            type="button"
            onClick={() => onOpenProfile?.(message.sender_id)}
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
          "relative rounded-2xl px-3.5 py-2.5 shadow-sm transition-all duration-150",
          isSelf
            ? "bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-primary-foreground rounded-tr-xs border border-primary/20 shadow-md shadow-primary/10"
            : "bg-secondary/70 backdrop-blur-md text-foreground border border-border/70 rounded-tl-xs hover:border-primary/30",
          isDeleted && "opacity-60 italic bg-muted/30 border-dashed"
        )}
      >
        {/* REPLY / QUOTE BOX */}
        {message.reply_to_message && !isDeleted && (
          <div
            onClick={() => message.reply_to_id && onScrollToMessage?.(message.reply_to_id)}
            className={cn(
              "mb-2 p-2 rounded-xl text-xs border-l-3 cursor-pointer transition-all flex flex-col gap-0.5 shadow-2xs",
              isSelf
                ? "bg-black/20 border-primary-foreground/80 text-primary-foreground/95 hover:bg-black/30"
                : "bg-card/80 border-primary text-foreground hover:bg-card"
            )}
          >
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <Reply className="h-3 w-3" />
              <span>{message.reply_to_message.sender_name}</span>
            </div>
            <p className="text-[11px] truncate max-w-xs opacity-90">
              {message.reply_to_message.attachment_name ? (
                <span>📎 {message.reply_to_message.attachment_name}</span>
              ) : (
                message.reply_to_message.content
              )}
            </p>
          </div>
        )}

        {/* ATTACHMENT DISPLAY */}
        {message.attachment_url && !isDeleted && (
          <div className="mb-2 space-y-1.5">
            {message.message_type === "image" && (
              <div className="overflow-hidden rounded-xl border border-black/10 bg-black/20 max-w-sm shadow-md">
                <img
                  src={message.attachment_url}
                  alt={message.attachment_name || "Imagem"}
                  className="max-h-64 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => setLightboxImage(message.attachment_url || null)}
                  loading="lazy"
                />
              </div>
            )}

            {message.message_type === "video" && (
              <div className="overflow-hidden rounded-xl border border-border bg-black max-w-sm shadow-md">
                <video
                  src={message.attachment_url}
                  controls
                  className="max-h-64 w-full"
                  preload="metadata"
                />
              </div>
            )}

            {message.message_type === "audio" && (
              <div
                className={cn(
                  "p-2 rounded-xl flex items-center gap-2 border shadow-xs",
                  isSelf ? "bg-black/20 border-primary-foreground/20" : "bg-card/80 border-border"
                )}
              >
                <Volume2 className="h-4 w-4 shrink-0 text-primary" />
                <audio src={message.attachment_url} controls className="h-8 max-w-[220px]" />
              </div>
            )}

            {message.message_type === "document" && (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noreferrer"
                download={message.attachment_name || "documento"}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border transition-all gap-3 max-w-xs shadow-xs",
                  isSelf
                    ? "bg-black/20 border-primary-foreground/20 hover:bg-black/30 text-primary-foreground"
                    : "bg-card/80 border-border hover:bg-card text-foreground"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-xs truncate font-medium">{message.attachment_name || "Documento"}</span>
                </div>
                <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
              </a>
            )}
          </div>
        )}

        {/* TEXT CONTENT / INLINE EDIT */}
        {editing ? (
          <div className="space-y-2 py-1 min-w-[220px]">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-2.5 py-1 text-xs rounded-lg bg-black/20 text-foreground border border-border focus:border-primary outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
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
              className="w-44 text-xs bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl"
            >
              <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
                <Copy className="h-3.5 w-3.5 mr-2" /> Copiar Mensagem
              </DropdownMenuItem>

              {isSelf && (
                <DropdownMenuItem onClick={() => setEditing(true)} className="cursor-pointer">
                  <Edit2 className="h-3.5 w-3.5 mr-2 text-primary" /> Editar
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDelete(message.id, false)}
                className="cursor-pointer text-muted-foreground"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar para mim
              </DropdownMenuItem>

              {canDeleteForEveryone && (
                <DropdownMenuItem
                  onClick={() => onDelete(message.id, true)}
                  className="cursor-pointer text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar para todos
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

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
