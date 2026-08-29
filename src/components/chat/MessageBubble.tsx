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
  const isDeleted = message.is_deleted_for_everyone;
  const canDeleteForEveryone = isSelf || userRole === "admin";

  // System message render
  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-2.5 px-4">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/60 border border-border/50 text-muted-foreground text-[11px] font-medium shadow-2xs max-w-md text-center">
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
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
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
          "relative rounded-2xl px-3.5 py-2.5 shadow-xs transition-all",
          isSelf
            ? "bg-primary text-primary-foreground rounded-br-xs"
            : "bg-card text-card-foreground border border-border/70 rounded-bl-xs shadow-sm",
          isDeleted && "opacity-70 italic bg-muted/40 border-dashed"
        )}
      >
        {/* REPLY / QUOTE BOX */}
        {message.reply_to_message && !isDeleted && (
          <div
            onClick={() => message.reply_to_id && onScrollToMessage?.(message.reply_to_id)}
            className={cn(
              "mb-2 p-2 rounded-xl text-xs border-l-3 cursor-pointer transition-all flex flex-col gap-0.5",
              isSelf
                ? "bg-black/15 border-primary-foreground/70 text-primary-foreground/90 hover:bg-black/25"
                : "bg-secondary/70 border-primary text-foreground hover:bg-secondary"
            )}
          >
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <Reply className="h-3 w-3" />
              <span>{message.reply_to_message.sender_name}</span>
            </div>
            <p className="text-[11px] truncate max-w-xs opacity-85">
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
              <div className="overflow-hidden rounded-xl border border-black/10 bg-black/20 max-w-sm">
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
              <div className="overflow-hidden rounded-xl border border-border bg-black max-w-sm">
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
                  "p-2 rounded-xl flex items-center gap-2 border",
                  isSelf ? "bg-black/15 border-primary-foreground/20" : "bg-secondary/60 border-border"
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
                  "flex items-center justify-between p-2.5 rounded-xl border transition-all gap-3 max-w-xs",
                  isSelf
                    ? "bg-black/15 border-primary-foreground/20 text-primary-foreground hover:bg-black/25"
                    : "bg-secondary/60 border-border text-foreground hover:bg-secondary"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate">{message.attachment_name || "Documento"}</p>
                    {message.attachment_size && (
                      <p className="text-[9px] opacity-75 font-mono">
                        {(message.attachment_size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                </div>
                <Download className="h-4 w-4 shrink-0 opacity-80" />
              </a>
            )}
          </div>
        )}

        {/* TEXT CONTENT OR EDIT FORM */}
        {editing ? (
          <div className="space-y-2 py-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-background text-foreground border border-input resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] px-2 text-foreground"
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="h-6 text-[10px] px-2.5 font-bold"
                onClick={handleSaveEdit}
              >
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs font-medium whitespace-pre-wrap leading-relaxed select-text break-words">
            {message.content}
          </p>
        )}

        {/* TIME, EDITED STATUS & READ CHECKS */}
        <div
          className={cn(
            "flex items-center justify-end gap-1 text-[9px] mt-1 opacity-80 font-mono select-none",
            isSelf ? "text-primary-foreground/90" : "text-muted-foreground"
          )}
        >
          {message.is_edited && !isDeleted && (
            <span className="text-[8.5px] italic font-sans opacity-90">(editada)</span>
          )}
          <span>{formatTimeOnly(message.created_at)}</span>
          {isSelf && !isDeleted && <MessageStatusIcon status={message.status} />}
        </div>

        {/* REACTION COUNTERS BAR */}
        {reactionsMap.size > 0 && !isDeleted && (
          <div className="flex flex-wrap items-center gap-1 mt-1.5 -mb-0.5">
            {Array.from(reactionsMap.entries()).map(([emoji, meta]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(message.id, emoji)}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer select-none",
                  meta.hasReacted
                    ? "bg-primary/20 border-primary/50 text-foreground scale-105 shadow-xs"
                    : "bg-secondary/70 border-border/60 text-muted-foreground hover:bg-secondary"
                )}
                title={`Reagido por ${meta.count} pessoa(s)`}
              >
                <span>{emoji}</span>
                <span className="text-[9px] font-mono">{meta.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* QUICK HOVER ACTIONS TOOLBAR (Desktop & Mobile Menu) */}
      {!isDeleted && (
        <div
          className={cn(
            "absolute -top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 bg-background/95 border border-border shadow-md rounded-full px-1 py-0.5 z-20 backdrop-blur-sm",
            isSelf ? "right-2" : "left-2"
          )}
        >
          {/* Quick Reaction Emojis */}
          <div className="flex items-center">
            {QUICK_EMOJIS.slice(0, 3).map((emo) => (
              <button
                key={emo}
                type="button"
                onClick={() => onReact(message.id, emo)}
                className="hover:scale-125 transition-transform text-xs p-1 cursor-pointer"
                title={`Reagir ${emo}`}
              >
                {emo}
              </button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary cursor-pointer"
                title="Mais reações"
              >
                <Smile className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center" className="p-1.5 flex gap-1 z-50">
              {QUICK_EMOJIS.map((emo) => (
                <button
                  key={emo}
                  type="button"
                  onClick={() => onReact(message.id, emo)}
                  className="hover:scale-125 transition-transform text-base p-1 cursor-pointer"
                >
                  {emo}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => onReply(message)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary cursor-pointer"
            title="Responder"
          >
            <Reply className="h-3.5 w-3.5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary cursor-pointer"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isSelf ? "end" : "start"} className="w-44 z-50 text-xs">
              <DropdownMenuItem onClick={() => onReply(message)} className="cursor-pointer">
                <Reply className="mr-2 h-3.5 w-3.5 text-primary" /> Responder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
                <Copy className="mr-2 h-3.5 w-3.5" /> Copiar Texto
              </DropdownMenuItem>

              {isSelf && (
                <DropdownMenuItem onClick={() => setEditing(true)} className="cursor-pointer">
                  <Edit2 className="mr-2 h-3.5 w-3.5 text-amber-400" /> Editar
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDelete(message.id, false)}
                className="text-muted-foreground cursor-pointer"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Apagar para mim
              </DropdownMenuItem>

              {canDeleteForEveryone && (
                <DropdownMenuItem
                  onClick={() => onDelete(message.id, true)}
                  className="text-destructive font-bold cursor-pointer"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" /> Apagar para todos
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR IMAGES */}
      {lightboxImage && (
        <Dialog open={Boolean(lightboxImage)} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-3xl p-2 bg-black/95 border-border">
            <DialogHeader className="p-2">
              <DialogTitle className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Visualizador de Imagem</span>
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Abrir original <ExternalLink className="h-3 w-3" />
                </a>
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-2">
              <img
                src={lightboxImage}
                alt="Imagem ampliada"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
