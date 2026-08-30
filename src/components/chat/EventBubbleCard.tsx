import React, { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  Ban,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { respondChatEvent, cancelChatEvent } from "@/services/chatService";
import { formatTimeOnly, dateOnly } from "@/lib/format";
import type { ChatMessage, EventData } from "@/types/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EventBubbleCardProps {
  message: ChatMessage;
  currentUserId?: string;
  isSelf: boolean;
  canManageEvent?: boolean;
  onEventUpdated?: (eventData: EventData) => void;
}

export function EventBubbleCard({
  message,
  currentUserId,
  isSelf,
  canManageEvent = false,
  onEventUpdated,
}: EventBubbleCardProps) {
  const event = message.event_data;
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

  if (!event) return null;

  const responses = event.responses || { vou: [], nao_vou: [], talvez: [] };
  const vouCount = responses.vou?.length || 0;
  const naoVouCount = responses.nao_vou?.length || 0;
  const talvezCount = responses.talvez?.length || 0;
  const totalResponses = vouCount + naoVouCount + talvezCount;

  const myResponse = currentUserId
    ? responses.vou?.includes(currentUserId)
      ? "vou"
      : responses.nao_vou?.includes(currentUserId)
      ? "nao_vou"
      : responses.talvez?.includes(currentUserId)
      ? "talvez"
      : null
    : null;

  const isCancelled = Boolean(event.is_cancelled);
  const canCancel = !isCancelled && (event.created_by === currentUserId || canManageEvent || isSelf);

  const eventDateObj = new Date(event.event_date);
  const isValidDate = !isNaN(eventDateObj.getTime());

  const handleRespond = async (resp: "vou" | "nao_vou" | "talvez") => {
    if (isCancelled || isUpdating) return;
    setIsUpdating(true);

    try {
      const updated = await respondChatEvent(message.id, resp, currentUserId);
      if (updated && onEventUpdated) {
        onEventUpdated(updated);
      }
      toast.success(
        resp === "vou"
          ? "Presença confirmada! 🟢"
          : resp === "nao_vou"
          ? "Marcado como não vai. 🔴"
          : "Marcado como talvez. 🟡"
      );
    } catch (err: any) {
      toast.error(`Erro ao registrar resposta: ${err.message || err}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const updated = await cancelChatEvent(message.id, currentUserId);
      toast.success("Evento cancelado.");
      if (updated && onEventUpdated) {
        onEventUpdated(updated);
      }
    } catch (err: any) {
      toast.error(`Erro ao cancelar: ${err.message || err}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full min-w-[260px] sm:min-w-[320px] max-w-[380px] space-y-3 py-1">
      {/* CABEÇALHO DO EVENTO */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[9.5px] px-1.5 py-0 rounded font-black uppercase tracking-wider flex items-center gap-1",
              isSelf
                ? "border-primary-foreground/30 text-primary-foreground"
                : "border-primary/40 text-primary bg-primary/10"
            )}
          >
            <Calendar className="h-3 w-3" />
            <span>Evento / Ação</span>
          </Badge>

          {isCancelled ? (
            <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
              <Ban className="h-3 w-3" /> Cancelado
            </span>
          ) : (
            <span className="text-[10px] opacity-80 flex items-center gap-1 font-mono">
              <Users className="h-3 w-3" /> {totalResponses} resposta{totalResponses === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <h4 className={cn("text-sm font-black tracking-tight leading-snug break-words", isCancelled && "line-through opacity-70")}>
          {event.title}
        </h4>

        {event.description && (
          <p className="text-xs opacity-90 leading-relaxed break-words">
            {event.description}
          </p>
        )}
      </div>

      {/* DETALHES DE DATA, HORA E LOCAL */}
      <div className={cn("p-2.5 rounded-xl border space-y-1.5 text-xs", isSelf ? "bg-black/20 border-primary-foreground/20" : "bg-card/70 border-border/70")}>
        {isValidDate && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-bold">
              {dateOnly(event.event_date)} às {formatTimeOnly(event.event_date)}
            </span>
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
      </div>

      {/* BOTÕES DE RSVP */}
      {!isCancelled && (
        <div className="space-y-2">
          <span className="text-[10.5px] font-bold opacity-80 uppercase tracking-wider block">
            Sua presença:
          </span>

          <div className="grid grid-cols-3 gap-1.5">
            <Button
              type="button"
              variant={myResponse === "vou" ? "default" : "outline"}
              size="sm"
              disabled={isUpdating}
              onClick={() => handleRespond("vou")}
              className={cn(
                "h-8 text-xs font-bold rounded-xl gap-1 cursor-pointer transition-all",
                myResponse === "vou"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                  : "hover:border-emerald-500/50 hover:text-emerald-400"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Vou ({vouCount})</span>
            </Button>

            <Button
              type="button"
              variant={myResponse === "talvez" ? "default" : "outline"}
              size="sm"
              disabled={isUpdating}
              onClick={() => handleRespond("talvez")}
              className={cn(
                "h-8 text-xs font-bold rounded-xl gap-1 cursor-pointer transition-all",
                myResponse === "talvez"
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-xs"
                  : "hover:border-amber-500/50 hover:text-amber-400"
              )}
            >
              <HelpCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Talvez ({talvezCount})</span>
            </Button>

            <Button
              type="button"
              variant={myResponse === "nao_vou" ? "default" : "outline"}
              size="sm"
              disabled={isUpdating}
              onClick={() => handleRespond("nao_vou")}
              className={cn(
                "h-8 text-xs font-bold rounded-xl gap-1 cursor-pointer transition-all",
                myResponse === "nao_vou"
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-xs"
                  : "hover:border-rose-500/50 hover:text-rose-400"
              )}
            >
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Não ({naoVouCount})</span>
            </Button>
          </div>
        </div>
      )}

      {/* BOTÃO CANCELAR SE AUTORIZADO */}
      {canCancel && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUpdating}
            className="text-[10px] font-black uppercase tracking-wider text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <Ban className="h-3 w-3" /> Cancelar Evento
          </button>
        </div>
      )}
    </div>
  );
}
