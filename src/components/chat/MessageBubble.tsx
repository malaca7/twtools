import React, { useState, memo, useMemo } from "react";
import {
  Reply,
  Copy,
  Edit2,
  Trash2,
  Smile,
  FileText,
  Download,
  Forward,
  Check,
  Pin,
  Star,
  Bell,
  Clock,
  ChevronDown,
  AlertTriangle,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { MessageStatusIcon } from "./MessageStatusIcon";
import { AudioMessagePlayer } from "./AudioMessagePlayer";
import { MediaLightboxModal } from "./MediaLightboxModal";
import { PollBubbleCard } from "./PollBubbleCard";
import { EventBubbleCard } from "./EventBubbleCard";
import { formatTimeOnly } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatMessage, ParticipantRole, PollData, EventData } from "@/types/chat";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  isGroup: boolean;
  userRole?: ParticipantRole;
  currentUserId?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  allMediaMessages?: ChatMessage[];
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

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const SENDER_COLORS = [
  "#25d366", // WhatsApp Green
  "#34b7f1", // WhatsApp Light Blue
  "#ff7675", // Coral
  "#fdcb6e", // Yellow
  "#e17055", // Orange
  "#d63031", // Red
  "#a29bfe", // Purple
  "#00cec9", // Teal
  "#fd79a8", // Pink
  "#55efc4", // Mint
];

function getSenderColor(nameOrId: string): string {
  let hash = 0;
  for (let i = 0; i < nameOrId.length; i++) {
    hash = (hash << 5) - hash + nameOrId.charCodeAt(i);
    hash |= 0;
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

function MessageBubbleBase({
  message,
  isSelf,
  isGroup,
  userRole = "member",
  currentUserId,
  isSelectionMode = false,
  isSelected = false,
  allMediaMessages = [],
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [deleteConfirmMode, setDeleteConfirmMode] = useState<"self" | "everyone" | null>(null);

  const isSystem = message.message_type === "system";
  const isDeleted = message.is_deleted || message.is_deleted_for_everyone;
  const canDeleteForEveryone = isSelf || userRole === "admin";

  const senderColor = useMemo(
    () => getSenderColor(message.sender_id || message.sender_name || "Membro"),
    [message.sender_id, message.sender_name]
  );

  // Mensagem do sistema
  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-2 px-4 select-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#182229]/90 border border-white/5 text-[#8696a0] text-[11px] font-medium shadow-sm max-w-md text-center backdrop-blur-md">
          <span>{message.content}</span>
          <span className="text-[9px] opacity-60 font-mono ml-1">{formatTimeOnly(message.created_at)}</span>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Mensagem copiada!");
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

  // Agrupa reações por emoji
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
        "group relative flex items-start gap-2 my-1 transition-all duration-150",
        isSelf ? "justify-end ml-auto" : "justify-start mr-auto",
        "max-w-[92%] sm:max-w-[80%] md:max-w-[70%]"
      )}
    >
      {/* SELECTION CHECKBOX (MODO DE SELEÇÃO) */}
      {isSelectionMode && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(message.id);
          }}
          className="shrink-0 p-1 cursor-pointer select-none self-center"
        >
          <div
            className={cn(
              "h-5 w-5 rounded-md border flex items-center justify-center transition-all",
              isSelected
                ? "bg-[#00a884] border-[#00a884] text-white shadow-md"
                : "border-[#8696a0]/50 bg-[#111b21] hover:border-[#00a884]"
            )}
          >
            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </div>
        </button>
      )}

      <div
        className={cn(
          "flex flex-col transition-all duration-150 flex-1 min-w-0 relative",
          isSelf ? "items-end" : "items-start",
          isSelectionMode && "cursor-pointer"
        )}
        onClick={() => {
          if (isSelectionMode) onToggleSelect?.(message.id);
        }}
      >
        {/* BOLHA WHATSAPP */}
        <div
          className={cn(
            "relative rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-md transition-all text-[#e9edef] max-w-full",
            isSelf
              ? "whatsapp-bubble-out whatsapp-tail-right rounded-tr-none"
              : "whatsapp-bubble-in whatsapp-tail-left rounded-tl-none",
            isDeleted && "opacity-70 italic border border-dashed border-white/10",
            isSelected && "ring-2 ring-[#00a884] ring-offset-2 ring-offset-[#0b141a]"
          )}
        >
          {/* HOVER DROPDOWN TRIGGER (CHEVRON WHATSAPP) */}
          {!isDeleted && !editing && (
            <div
              className={cn(
                "absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                "h-5 w-5 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center cursor-pointer text-white/80 hover:text-white"
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="h-full w-full flex items-center justify-center cursor-pointer">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align={isSelf ? "end" : "start"}
                  className="w-52 text-xs bg-[#233138] border border-white/10 text-white rounded-xl shadow-2xl z-50 p-1"
                >
                  <DropdownMenuItem onClick={() => onReply(message)} className="cursor-pointer hover:bg-white/10 rounded-lg">
                    <Reply className="h-3.5 w-3.5 mr-2 text-[#00a884]" /> Responder
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => setReactionMenuOpen(true)} className="cursor-pointer hover:bg-white/10 rounded-lg">
                    <Smile className="h-3.5 w-3.5 mr-2 text-yellow-400" /> Reagir à mensagem
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleCopy} className="cursor-pointer hover:bg-white/10 rounded-lg">
                    <Copy className="h-3.5 w-3.5 mr-2" /> Copiar texto
                  </DropdownMenuItem>

                  {onForward && (
                    <DropdownMenuItem onClick={() => onForward(message)} className="cursor-pointer hover:bg-white/10 rounded-lg">
                      <Forward className="h-3.5 w-3.5 mr-2 text-[#53bdeb]" /> Encaminhar
                    </DropdownMenuItem>
                  )}

                  {onSave && (
                    <DropdownMenuItem onClick={() => onSave(message.id)} className="cursor-pointer hover:bg-white/10 rounded-lg">
                      <Star className="h-3.5 w-3.5 mr-2 text-amber-400" /> {message.is_saved ? "Remover dos favoritos" : "Favoritar"}
                    </DropdownMenuItem>
                  )}

                  {onPin && (
                    <DropdownMenuItem onClick={() => onPin(message.id)} className="cursor-pointer hover:bg-white/10 rounded-lg">
                      <Pin className="h-3.5 w-3.5 mr-2 text-emerald-400" /> {message.is_pinned ? "Desafixar do topo" : "Fixar no topo"}
                    </DropdownMenuItem>
                  )}

                  {onReminder && (
                    <DropdownMenuItem onClick={() => onReminder(message)} className="cursor-pointer hover:bg-white/10 rounded-lg">
                      <Bell className="h-3.5 w-3.5 mr-2 text-purple-400" /> Criar lembrete
                    </DropdownMenuItem>
                  )}

                  {onOpenThread && !message.thread_parent_id && (
                    <DropdownMenuItem onClick={() => onOpenThread(message)} className="cursor-pointer hover:bg-white/10 rounded-lg">
                      <MessageSquare className="h-3.5 w-3.5 mr-2 text-primary" /> Responder em thread
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={() => onToggleSelect?.(message.id)} className="cursor-pointer hover:bg-white/10 rounded-lg">
                    <Check className="h-3.5 w-3.5 mr-2 text-[#00a884]" /> Selecionar
                  </DropdownMenuItem>

                  {onReportMessage && !isSelf && (
                    <DropdownMenuItem onClick={() => onReportMessage(message)} className="cursor-pointer hover:bg-white/10 rounded-lg text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 mr-2" /> Denunciar
                    </DropdownMenuItem>
                  )}

                  {isSelf && !message.poll_data && !message.event_data && (
                    <DropdownMenuItem onClick={() => setEditing(true)} className="cursor-pointer hover:bg-white/10 rounded-lg">
                      <Edit2 className="h-3.5 w-3.5 mr-2 text-[#00a884]" /> Editar
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-white/10" />

                  <DropdownMenuItem
                    onClick={() => setDeleteConfirmMode("self")}
                    className="cursor-pointer hover:bg-white/10 rounded-lg text-[#8696a0]"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar para mim
                  </DropdownMenuItem>

                  {canDeleteForEveryone && (
                    <DropdownMenuItem
                      onClick={() => setDeleteConfirmMode("everyone")}
                      className="cursor-pointer hover:bg-rose-500/20 text-rose-400 rounded-lg font-bold"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Apagar para todos
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* SENDER NAME EM GRUPOS ESTILO WHATSAPP */}
          {isGroup && !isSelf && !isDeleted && (
            <div className="flex items-center gap-1.5 mb-1 leading-none">
              <button
                type="button"
                onClick={(e) => {
                  if (isSelectionMode) return;
                  e.stopPropagation();
                  onOpenProfile?.(message.sender_id);
                }}
                style={{ color: senderColor }}
                className="text-[12px] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{message.sender_name || "Membro"}</span>
              </button>
              {message.sender_game_id && (
                <span className="text-[10px] font-mono text-[#8696a0]">
                  #{message.sender_game_id}
                </span>
              )}
            </div>
          )}

          {/* FORWARDED BADGE */}
          {message.is_forwarded && !isDeleted && (
            <div className="flex items-center gap-1 text-[11px] italic text-[#8696a0] mb-1 select-none">
              <Forward className="h-3 w-3 stroke-[2.5]" />
              <span>
                {message.forwarded_from_name
                  ? `Encaminhada de ${message.forwarded_from_name}`
                  : "Encaminhada"}
              </span>
            </div>
          )}

          {/* BADGES: PIN, STAR, EXPIRING */}
          {(message.is_pinned || message.is_saved || message.expires_at) && !isDeleted && (
            <div className="flex items-center gap-1.5 mb-1 flex-wrap select-none text-[9.5px]">
              {message.is_pinned && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/25 text-emerald-400 font-bold">
                  <Pin className="h-2.5 w-2.5 fill-current" /> Fixada
                </span>
              )}
              {message.is_saved && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/25 text-amber-300 font-bold">
                  <Star className="h-2.5 w-2.5 fill-current" /> Favorita
                </span>
              )}
              {message.expires_at && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/25 text-rose-300 font-bold font-mono">
                  <Clock className="h-2.5 w-2.5" /> Temporária
                </span>
              )}
            </div>
          )}

          {/* REPLIED MESSAGE QUOTE PREVIEW ESTILO WHATSAPP */}
          {message.reply_to_message && !isDeleted && (
            <div
              onClick={() => message.reply_to_id && onScrollToMessage?.(message.reply_to_id)}
              className={cn(
                "flex flex-col border-l-4 pl-2.5 py-1 mb-1.5 rounded-r-md text-[11px] cursor-pointer transition-opacity hover:opacity-90",
                isSelf ? "border-[#25d366] bg-black/25" : "border-[#34b7f1] bg-black/25"
              )}
            >
              <span
                style={{ color: getSenderColor(message.reply_to_message.sender_name) }}
                className="font-bold text-[11px] block leading-tight truncate"
              >
                {message.reply_to_message.sender_name}
              </span>
              <span className="text-[#8696a0] line-clamp-1 italic text-[11px]">
                {message.reply_to_message.content || message.reply_to_message.attachment_name || "Anexo"}
              </span>
            </div>
          )}

          {/* ─── ATTACHMENTS (IMAGEM / VÍDEO / ÁUDIO / DOCUMENTO) ─── */}
          {message.attachment_url && !isDeleted && (
            <div className="mb-1 space-y-1">
              {/* IMAGEM */}
              {message.message_type === "image" && (
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={message.attachment_url}
                    alt={message.attachment_name || "Foto"}
                    onClick={() => setLightboxOpen(true)}
                    className="max-h-72 w-full object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                  />
                </div>
              )}

              {/* VÍDEO */}
              {message.message_type === "video" && (
                <div className="overflow-hidden rounded-lg relative group/vid">
                  <video
                    src={message.attachment_url}
                    controls
                    className="max-h-72 w-full rounded-lg"
                  />
                </div>
              )}

              {/* ÁUDIO / VOICE NOTE WHATSAPP PLAYER */}
              {message.message_type === "audio" && (
                <AudioMessagePlayer
                  src={message.attachment_url}
                  isSelf={isSelf}
                  senderAvatar={message.sender_avatar}
                  senderName={message.sender_name}
                />
              )}

              {/* DOCUMENTO / ARQUIVO */}
              {message.message_type === "document" && (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-semibold hover:opacity-90 transition-opacity",
                    isSelf ? "bg-black/20 border-white/10" : "bg-[#111b21] border-white/10"
                  )}
                >
                  <div className="h-9 w-9 rounded-lg bg-[#7f66ff]/20 text-[#7f66ff] flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-white font-medium">{message.attachment_name || "Documento"}</p>
                    <span className="text-[10px] text-[#8696a0] font-mono">
                      {message.attachment_size ? `${(message.attachment_size / 1024).toFixed(1)} KB` : "Arquivo"}
                    </span>
                  </div>
                  <Download className="h-4 w-4 text-[#8696a0] shrink-0 ml-1" />
                </a>
              )}
            </div>
          )}

          {/* ─── CORPO DA MENSAGEM / ENQUETE / EVENTO / EDIÇÃO ─── */}
          {editing ? (
            <div className="space-y-1.5 py-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full text-xs p-2 rounded-lg bg-black/40 border border-white/20 text-white focus:outline-none resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] text-white/70"
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="h-6 px-2.5 text-[10px] font-bold bg-[#00a884] hover:bg-[#00a884]/90 text-white"
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
            message.message_type !== "audio" && (
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words select-text font-sans">
                {isDeleted ? "🚫 Mensagem apagada" : message.content}
              </p>
            )
          )}

          {/* ─── HORA & TICKS EMBUTIDOS ESTILO WHATSAPP ─── */}
          <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] text-[#8696a0] font-mono leading-none select-none float-right ml-3">
            {message.is_edited && !isDeleted && (
              <span className="italic text-[9px] mr-0.5 text-[#8696a0]/80">editada</span>
            )}
            <span>{formatTimeOnly(message.created_at)}</span>
            {isSelf && !isDeleted && <MessageStatusIcon status={message.status} />}
          </div>
          <div className="clear-both" />
        </div>

        {/* THREAD REPLIES LINK */}
        {!isDeleted && (Boolean(message.thread_reply_count && message.thread_reply_count > 0) || onOpenThread) && (
          <div className="flex items-center gap-1 mt-1 px-1">
            {Boolean(message.thread_reply_count && message.thread_reply_count > 0) && (
              <button
                type="button"
                onClick={() => onOpenThread?.(message)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#111b21] border border-white/10 text-[#00a884] hover:bg-white/5 transition-colors cursor-pointer shadow-sm"
              >
                <MessageSquare className="h-3 w-3" />
                <span>{message.thread_reply_count} resposta{message.thread_reply_count === 1 ? "" : "s"}</span>
              </button>
            )}
          </div>
        )}

        {/* REACTION PILLS */}
        {reactionsMap.size > 0 && !isDeleted && (
          <div className="flex items-center gap-1 mt-1 px-1 flex-wrap">
            {Array.from(reactionsMap.entries()).map(([emoji, data]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(message.id, emoji)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer shadow-sm",
                  data.hasReacted
                    ? "bg-[#00a884]/20 border-[#00a884]/40 text-[#00a884] scale-105"
                    : "bg-[#202c33] border-white/10 hover:bg-white/10 text-white hover:scale-105"
                )}
              >
                <span>{emoji}</span>
                <span className="text-[10px] font-mono">{data.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* FLOATING QUICK REACTIONS BAR ON HOVER */}
        {!isDeleted && !editing && (
          <div
            className={cn(
              "absolute -top-4 opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-0.5 p-1 rounded-full bg-[#233138] border border-white/10 shadow-xl z-20 backdrop-blur-md",
              isSelf ? "right-6" : "left-6"
            )}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(message.id, emoji)}
                className="h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center text-sm hover:scale-125 transition-transform cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO PARA APAGAR */}
      <AlertDialog
        open={Boolean(deleteConfirmMode)}
        onOpenChange={(open) => !open && setDeleteConfirmMode(null)}
      >
        <AlertDialogContent className="max-w-md rounded-2xl bg-[#233138] border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">
              {deleteConfirmMode === "everyone" ? "Apagar mensagem para todos?" : "Apagar mensagem para mim?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#8696a0]">
              {deleteConfirmMode === "everyone"
                ? "Esta mensagem será apagada para todas as pessoas nesta conversa."
                : "Esta mensagem deixará de ser exibida apenas para você."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* LIGHTBOX DE MÍDIA WHATSAPP */}
      <MediaLightboxModal
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        currentMessage={message}
        allMediaMessages={allMediaMessages}
      />
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleBase);
