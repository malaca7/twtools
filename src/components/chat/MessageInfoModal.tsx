import React, { useState, useMemo } from "react";
import {
  CheckCheck,
  Check,
  Clock,
  Info,
  Users,
  Search,
  FileText,
  Vote,
  Calendar,
  Eye,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageStatusIcon } from "./MessageStatusIcon";
import { ChatMessageText } from "./ChatMessageText";
import { getMessageReceiptInfo } from "@/services/chatService";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { formatTimeOnly, formatLastSeen } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatMessage, MessageReceiptParticipantInfo } from "@/types/chat";

interface MessageInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: ChatMessage | null;
  conversation: ChatConversation;
  currentUserId?: string;
  onOpenProfile?: (userId: string) => void;
}

function formatWhatsAppDateTime(isoStr?: string | null): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "—";

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (isToday) return `Hoje às ${timeStr}`;
  if (isYesterday) return `Ontem às ${timeStr}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} às ${timeStr}`;
}

export function MessageInfoModal({
  open,
  onOpenChange,
  message,
  conversation,
  currentUserId,
  onOpenProfile,
}: MessageInfoModalProps) {
  const [activeTab, setActiveTab] = useState<"all" | "read" | "delivered" | "pending">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const isGroup = conversation.type === "group";

  const receiptSummary = useMemo(() => {
    if (!message) return null;
    return getMessageReceiptInfo(message, conversation);
  }, [message, conversation]);

  if (!message || !receiptSummary) return null;

  const isSelf = message.sender_id === currentUserId || message.is_self;
  const isGroupAdmin =
    isGroup &&
    (conversation.created_by === currentUserId ||
      conversation.my_role === "admin" ||
      conversation.participants?.some((p) => p.user_id === currentUserId && p.role === "admin"));

  if (!isSelf && !isGroupAdmin) return null;

  // Filtra participantes pela busca e aba ativa
  const filterList = (list: MessageReceiptParticipantInfo[]) => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (p) =>
        p.user_name.toLowerCase().includes(term) ||
        (p.nickname && p.nickname.toLowerCase().includes(term)) ||
        (p.game_id && p.game_id.toLowerCase().includes(term))
    );
  };

  const filteredRead = filterList(receiptSummary.readParticipants);
  const filteredDelivered = filterList(receiptSummary.deliveredParticipants);
  const filteredPending = filterList(receiptSummary.pendingParticipants);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 sm:p-0 gap-0 bg-[#182229] border border-white/20 text-white rounded-2xl shadow-2xl ring-1 ring-white/10 max-h-[82vh] overflow-y-hidden overflow-x-hidden flex flex-col">
        {/* HEADER ESTILO WHATSAPP */}
        <DialogHeader className="p-4 pr-12 bg-[#202c33] border-b border-white/10 space-y-1 shrink-0 relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center shrink-0">
                <Info className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-white leading-none truncate">
                Dados da mensagem
              </DialogTitle>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0",
                receiptSummary.status === "read"
                  ? "border-[#53bdeb]/40 text-[#53bdeb] bg-[#53bdeb]/10"
                  : receiptSummary.status === "delivered"
                  ? "border-[#8696a0]/40 text-[#8696a0] bg-[#8696a0]/10"
                  : "border-white/10 text-white/60 bg-white/5"
              )}
            >
              {receiptSummary.status === "read"
                ? "Visualizada"
                : receiptSummary.status === "delivered"
                ? "Entregue"
                : "Enviada"}
            </Badge>
          </div>
          <p className="text-[11px] text-[#8696a0] font-sans truncate">
            {isSelf ? "Enviada por você em " : `Enviada por ${message.sender_name || "Membro"} em `}
            {formatWhatsAppDateTime(message.created_at)}
          </p>
        </DialogHeader>

        {/* PREVIEW DO BALÃO DA MENSAGEM */}
        <div className="px-4 py-2.5 bg-[#0b141a] border-b border-white/5 shrink-0">
          <div className="text-[10px] uppercase font-bold text-[#8696a0] tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              <span>{isSelf ? "Mensagem enviada por você" : `Mensagem enviada por ${message.sender_name || "Membro"}`}</span>
            </span>
          </div>

          <div
            className={cn(
              "relative rounded-lg p-2.5 shadow-md text-[#e9edef] max-w-full max-h-28 overflow-y-auto custom-scrollbar-thin text-xs",
              isSelf
                ? "whatsapp-bubble-out rounded-tr-none ml-auto"
                : "whatsapp-bubble-in rounded-tl-none mr-auto"
            )}
          >
            {/* Se houver anexo */}
            {message.attachment_url && (
              <div className="mb-2">
                {message.message_type === "image" && (
                  <img
                    src={message.attachment_url}
                    alt={message.attachment_name || "Mídia"}
                    className="max-h-36 w-full object-cover rounded-md"
                  />
                )}
                {message.message_type === "video" && (
                  <video
                    src={message.attachment_url}
                    controls
                    className="max-h-36 w-full rounded-md"
                  />
                )}
                {message.message_type === "document" && (
                  <div className="flex items-center gap-2 p-2 rounded bg-black/20 text-xs">
                    <FileText className="h-4 w-4 text-[#7f66ff]" />
                    <span className="truncate flex-1">{message.attachment_name || "Documento"}</span>
                  </div>
                )}
              </div>
            )}

            {/* Enquete */}
            {message.poll_data && (
              <div className="flex items-center gap-2 p-2 rounded bg-black/20 text-xs font-semibold text-amber-300 mb-1">
                <Vote className="h-4 w-4 shrink-0" />
                <span className="truncate">🗳️ {message.poll_data.question}</span>
              </div>
            )}

            {/* Evento */}
            {message.event_data && (
              <div className="flex items-center gap-2 p-2 rounded bg-black/20 text-xs font-semibold text-emerald-300 mb-1">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="truncate">📅 {message.event_data.title}</span>
              </div>
            )}

            {/* Texto */}
            {!message.poll_data && !message.event_data && (
              <ChatMessageText
                content={message.content}
                isDeleted={Boolean(message.is_deleted || message.is_deleted_for_everyone)}
                showPreview={false}
              />
            )}
          </div>
        </div>

        {/* CASO 1: CONVERSA PRIVADA (1:1) */}
        {!isGroup && (() => {
          const isDirectRead = receiptSummary.status === "read" || receiptSummary.readCount > 0;
          const directReadTime =
            receiptSummary.readParticipants[0]?.timestamp ||
            (isDirectRead ? message.updated_at || message.created_at : null);

          const isDirectDelivered =
            isDirectRead ||
            receiptSummary.status === "delivered" ||
            receiptSummary.deliveredCount > 0 ||
            message.status === "delivered";
          const directDeliveredTime =
            receiptSummary.deliveredParticipants[0]?.timestamp ||
            directReadTime ||
            message.created_at;

          return (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-[#111b21] custom-scrollbar-thin">
              <div className="text-[10px] uppercase font-bold text-[#8696a0] tracking-wider flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                <span>Status com o destinatário</span>
              </div>

              <div className="rounded-xl bg-[#202c33]/70 border border-white/5 divide-y divide-white/5 overflow-hidden">
                {/* LIDA */}
                <div className="p-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isDirectRead ? "bg-[#53bdeb]/15 text-[#53bdeb]" : "bg-white/5 text-[#8696a0]"
                      )}
                    >
                      <CheckCheck className={cn("h-4 w-4 stroke-[2.5]", isDirectRead ? "text-[#53bdeb]" : "text-[#8696a0]")} />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#e9edef]">Lida</h5>
                      <p className="text-[11px] text-[#8696a0]">
                        {isDirectRead
                          ? formatWhatsAppDateTime(directReadTime)
                          : "Ainda não visualizada"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ENTREGUE */}
                <div className="p-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isDirectDelivered ? "bg-[#8696a0]/15 text-[#8696a0]" : "bg-white/5 text-[#8696a0]"
                      )}
                    >
                      <CheckCheck className="h-4 w-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#e9edef]">Entregue</h5>
                      <p className="text-[11px] text-[#8696a0]">
                        {isDirectDelivered
                          ? formatWhatsAppDateTime(directDeliveredTime)
                          : "Aguardando entrega"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ENVIADA */}
                <div className="p-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-[#8696a0]/10 text-[#8696a0] flex items-center justify-center shrink-0">
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#e9edef]">Enviada</h5>
                      <p className="text-[11px] text-[#8696a0]">
                        {formatWhatsAppDateTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* CASO 2: CONVERSA EM GRUPO */}
        {isGroup && (
          <div className="flex flex-col flex-1 min-h-0 bg-[#111b21] overflow-hidden">
            {/* CARDS DE RESUMO DE MÉTRICAS */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-[#202c33]/70 border-b border-white/5 text-center shrink-0">
              {/* Lida */}
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "read" ? "all" : "read")}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer",
                  activeTab === "read"
                    ? "bg-[#53bdeb]/20 border-[#53bdeb] text-white shadow-sm ring-1 ring-[#53bdeb]/40"
                    : "bg-[#111b21] border-white/5 hover:border-white/10 text-[#8696a0]"
                )}
              >
                <div className="flex items-center justify-center gap-1 text-[#53bdeb] text-xs font-bold mb-0.5">
                  <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Lida</span>
                </div>
                <div className="text-base font-black text-white leading-tight font-mono">
                  {receiptSummary.readCount}
                </div>
              </button>

              {/* Entregue */}
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "delivered" ? "all" : "delivered")}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer",
                  activeTab === "delivered"
                    ? "bg-[#8696a0]/25 border-[#8696a0] text-white shadow-sm ring-1 ring-[#8696a0]/40"
                    : "bg-[#111b21] border-white/5 hover:border-white/10 text-[#8696a0]"
                )}
              >
                <div className="flex items-center justify-center gap-1 text-[#8696a0] text-xs font-bold mb-0.5">
                  <CheckCheck className="h-3.5 w-3.5 stroke-[2]" />
                  <span>Entregue</span>
                </div>
                <div className="text-base font-black text-white leading-tight font-mono">
                  {receiptSummary.deliveredCount}
                </div>
              </button>

              {/* Pendente */}
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === "pending" ? "all" : "pending")}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer",
                  activeTab === "pending"
                    ? "bg-amber-500/20 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/40"
                    : "bg-[#111b21] border-white/5 hover:border-white/10 text-[#8696a0]"
                )}
              >
                <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold mb-0.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Pendente</span>
                </div>
                <div className="text-base font-black text-white leading-tight font-mono">
                  {receiptSummary.pendingCount}
                </div>
              </button>
            </div>

            {/* BARRA DE ABAS RÁPIDAS */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#182229] border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar scroll-smooth">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap",
                  activeTab === "all"
                    ? "bg-white/15 text-white"
                    : "text-[#8696a0] hover:text-white hover:bg-white/5"
                )}
              >
                Todos ({receiptSummary.totalRecipients})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("read")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 whitespace-nowrap",
                  activeTab === "read"
                    ? "bg-[#53bdeb]/20 text-[#53bdeb]"
                    : "text-[#8696a0] hover:text-[#53bdeb] hover:bg-white/5"
                )}
              >
                <CheckCheck className="h-3 w-3 stroke-[2.5]" /> Lida ({receiptSummary.readCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("delivered")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 whitespace-nowrap",
                  activeTab === "delivered"
                    ? "bg-[#8696a0]/25 text-white"
                    : "text-[#8696a0] hover:text-white hover:bg-white/5"
                )}
              >
                <CheckCheck className="h-3 w-3 stroke-[2]" /> Entregue ({receiptSummary.deliveredCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1 whitespace-nowrap",
                  activeTab === "pending"
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-[#8696a0] hover:text-amber-400 hover:bg-white/5"
                )}
              >
                <Clock className="h-3 w-3" /> Pendente ({receiptSummary.pendingCount})
              </button>
            </div>

            {/* CAMPO DE BUSCA SE HOUVER MAIS DE 2 PARTICIPANTES */}
            {receiptSummary.totalRecipients > 2 && (
              <div className="p-2.5 border-b border-white/5 bg-[#111b21] shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8696a0]" />
                  <Input
                    placeholder="Buscar participante por nome, apelido ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pl-8 pr-3 text-xs bg-[#202c33] border-transparent rounded-lg text-[#e9edef] placeholder:text-[#8696a0]"
                  />
                </div>
              </div>
            )}

            {/* LISTA ROLÁVEL DE PARTICIPANTES */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/5 custom-scrollbar-thin">
              {/* SEÇÃO LIDA POR */}
              {(activeTab === "all" || activeTab === "read") && (
                <div>
                  <div className="px-4 py-1.5 bg-[#182229] flex items-center justify-between text-[11px] font-bold text-[#53bdeb] uppercase tracking-wider sticky top-0 z-10">
                    <span className="flex items-center gap-1.5">
                      <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                      Lida por ({filteredRead.length})
                    </span>
                  </div>

                  {filteredRead.length === 0 ? (
                    <div className="p-2.5 text-center text-[11px] text-[#8696a0]/80 italic">
                      {searchTerm ? "Nenhum membro encontrado" : "Nenhum participante visualizou ainda"}
                    </div>
                  ) : (
                    filteredRead.map((p) => (
                      <ParticipantReceiptRow
                        key={p.user_id}
                        participant={p}
                        onOpenProfile={onOpenProfile}
                      />
                    ))
                  )}
                </div>
              )}

              {/* SEÇÃO ENTREGUE A */}
              {(activeTab === "all" || activeTab === "delivered") && (
                <div>
                  <div className="px-4 py-1.5 bg-[#182229] flex items-center justify-between text-[11px] font-bold text-[#8696a0] uppercase tracking-wider sticky top-0 z-10">
                    <span className="flex items-center gap-1.5">
                      <CheckCheck className="h-3.5 w-3.5 stroke-[2]" />
                      Entregue a ({filteredDelivered.length})
                    </span>
                  </div>

                  {filteredDelivered.length === 0 ? (
                    <div className="p-2.5 text-center text-[11px] text-[#8696a0]/80 italic">
                      {searchTerm
                        ? "Nenhum membro encontrado"
                        : "Nenhum membro aguardando apenas leitura"}
                    </div>
                  ) : (
                    filteredDelivered.map((p) => (
                      <ParticipantReceiptRow
                        key={p.user_id}
                        participant={p}
                        onOpenProfile={onOpenProfile}
                      />
                    ))
                  )}
                </div>
              )}

              {/* SEÇÃO PENDENTE DE ENTREGA */}
              {(activeTab === "all" || activeTab === "pending") && (
                <div>
                  <div className="px-4 py-1.5 bg-[#182229] flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase tracking-wider sticky top-0 z-10">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Pendente de entrega ({filteredPending.length})
                    </span>
                  </div>

                  {filteredPending.length === 0 ? (
                    <div className="p-2.5 text-center text-[11px] text-[#8696a0]/80 italic">
                      {searchTerm ? "Nenhum membro encontrado" : "Todos os membros já receberam a mensagem"}
                    </div>
                  ) : (
                    filteredPending.map((p) => (
                      <ParticipantReceiptRow
                        key={p.user_id}
                        participant={p}
                        onOpenProfile={onOpenProfile}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ParticipantReceiptRow({
  participant,
  onOpenProfile,
}: {
  participant: MessageReceiptParticipantInfo;
  onOpenProfile?: (userId: string) => void;
}) {
  const isOnline = participant.presence_status === "online";
  const isAusente = participant.presence_status === "ausente";

  const timeLabel =
    participant.status === "read"
      ? formatWhatsAppDateTime(participant.timestamp)
      : participant.status === "delivered"
      ? formatWhatsAppDateTime(participant.timestamp)
      : participant.last_seen
      ? `Visto ${formatLastSeen(participant.last_seen)}`
      : "Aguardando conexão";

  return (
    <div
      onClick={() => onOpenProfile?.(participant.user_id)}
      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-[#202c33]/60 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <Avatar className="h-9 w-9 border border-white/10">
            {participant.avatar_url && (
              <AvatarImage src={participant.avatar_url} alt={participant.user_name} />
            )}
            <AvatarFallback className="bg-[#202c33] text-[#00a884] text-xs font-bold">
              {(participant.nickname || participant.user_name || "M").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#111b21]",
              isOnline ? "bg-[#25d366]" : isAusente ? "bg-amber-500" : "bg-zinc-500"
            )}
          />
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="text-xs font-bold text-[#e9edef] truncate">
              {participant.nickname || participant.user_name}
            </span>
            {participant.game_id && (
              <span className="text-[10px] font-mono text-[#8696a0] bg-white/5 px-1 rounded">
                #{participant.game_id}
              </span>
            )}
            {participant.role === "admin" && (
              <Badge className="text-[8px] bg-[#00a884]/15 border-[#00a884]/30 text-[#00a884] font-bold px-1 py-0">
                Admin
              </Badge>
            )}
          </div>
          {participant.nickname && participant.user_name && participant.nickname !== participant.user_name && (
            <p className="text-[10px] text-[#8696a0] truncate leading-none">
              {participant.user_name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right font-mono text-[11px] leading-tight">
          <div
            className={cn(
              "flex items-center justify-end gap-1 font-semibold",
              participant.status === "read"
                ? "text-[#53bdeb]"
                : participant.status === "delivered"
                ? "text-[#8696a0]"
                : "text-amber-400"
            )}
          >
            {participant.status === "read" ? (
              <CheckCheck className="h-3.5 w-3.5 stroke-[2.5]" />
            ) : participant.status === "delivered" ? (
              <CheckCheck className="h-3.5 w-3.5 stroke-[2]" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            <span>
              {participant.status === "read"
                ? "Lida"
                : participant.status === "delivered"
                ? "Entregue"
                : "Pendente"}
            </span>
          </div>
          <p className="text-[10px] text-[#8696a0] mt-0.5">{timeLabel}</p>
        </div>
      </div>
    </div>
  );
}
