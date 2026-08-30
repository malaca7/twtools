import React, { useState } from "react";
import { Vote, Check, Lock, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { votePollChatMessage, closePollChatMessage } from "@/services/chatService";
import type { ChatMessage, PollData } from "@/types/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PollBubbleCardProps {
  message: ChatMessage;
  currentUserId?: string;
  isSelf: boolean;
  canManagePoll?: boolean;
  onPollUpdated?: (pollData: PollData) => void;
}

export function PollBubbleCard({
  message,
  currentUserId,
  isSelf,
  canManagePoll = false,
  onPollUpdated,
}: PollBubbleCardProps) {
  const poll = message.poll_data;
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!poll) return null;

  const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);
  const isClosed = Boolean(poll.is_closed || (poll.expires_at && new Date() > new Date(poll.expires_at)));
  const canClose = !isClosed && (poll.created_by === currentUserId || canManagePoll || isSelf);

  const handleVote = async (optionId: string) => {
    if (isClosed || isVoting) return;
    setIsVoting(true);

    try {
      const updated = await votePollChatMessage(message.id, optionId, currentUserId);
      if (updated && onPollUpdated) {
        onPollUpdated(updated);
      }
    } catch (err: any) {
      toast.error(`Erro ao votar: ${err.message || err}`);
    } finally {
      setIsVoting(false);
    }
  };

  const handleClosePoll = async () => {
    if (isClosing) return;
    setIsClosing(true);

    try {
      const updated = await closePollChatMessage(message.id, currentUserId);
      toast.success("Enquete encerrada!");
      if (updated && onPollUpdated) {
        onPollUpdated(updated);
      }
    } catch (err: any) {
      toast.error(`Erro ao encerrar enquete: ${err.message || err}`);
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="w-full min-w-[260px] sm:min-w-[300px] max-w-[360px] space-y-3 py-1">
      {/* CABEÇALHO DA ENQUETE */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[9.5px] px-1.5 py-0 rounded font-black uppercase tracking-wider flex items-center gap-1",
              isSelf ? "border-primary-foreground/30 text-primary-foreground" : "border-primary/40 text-primary bg-primary/10"
            )}
          >
            <Vote className="h-3 w-3" />
            <span>Enquete {poll.is_multiple_choice ? "• Voto Múltiplo" : ""}</span>
          </Badge>

          {isClosed ? (
            <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Encerrada
            </span>
          ) : (
            <span className="text-[10px] opacity-80 flex items-center gap-1 font-mono">
              <Users className="h-3 w-3" /> {totalVotes} voto{totalVotes === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <h4 className="text-sm font-black tracking-tight leading-snug break-words">
          {poll.question}
        </h4>
        <p className="text-[10.5px] opacity-75 leading-none">
          Criada por {poll.created_by_name || "Membro"}
        </p>
      </div>

      {/* LISTA DE OPÇÕES E BARRAS DE VOTAÇÃO */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const voteCount = opt.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const hasVoted = currentUserId ? opt.votes?.includes(currentUserId) : false;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={isClosed || isVoting}
              onClick={() => handleVote(opt.id)}
              className={cn(
                "w-full text-left p-2.5 rounded-xl border relative overflow-hidden transition-all select-none group",
                isSelf
                  ? "bg-black/20 border-primary-foreground/20 hover:border-primary-foreground/40"
                  : "bg-background/80 border-border/80 hover:border-primary/60",
                hasVoted && (isSelf ? "ring-1 ring-primary-foreground" : "ring-1 ring-primary border-primary"),
                !isClosed && "cursor-pointer active:scale-[0.99]"
              )}
            >
              {/* BARRA DE PROGRESSO EM SEGUNDO PLANO */}
              <div
                className={cn(
                  "absolute top-0 left-0 bottom-0 transition-all duration-500 rounded-xl pointer-events-none",
                  isSelf ? "bg-primary-foreground/20" : "bg-primary/20",
                  hasVoted && (isSelf ? "bg-primary-foreground/30" : "bg-primary/30")
                )}
                style={{ width: `${percentage}%` }}
              />

              {/* CONTEÚDO DA OPÇÃO */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                      isSelf ? "border-primary-foreground/60" : "border-border",
                      hasVoted && (isSelf ? "bg-primary-foreground text-primary border-primary-foreground" : "bg-primary text-primary-foreground border-primary")
                    )}
                  >
                    {hasVoted && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>

                  <span className="text-xs font-bold leading-tight break-words truncate">
                    {opt.text}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-right">
                  <span className="text-[11px] font-mono font-black">{percentage}%</span>
                  <span className="text-[9.5px] opacity-70 font-mono">({voteCount})</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* RODAPÉ: BOTÃO ENCERRAR SE AUTORIZADO */}
      {canClose && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={handleClosePoll}
            disabled={isClosing}
            className="text-[10px] font-black uppercase tracking-wider text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            {isClosing && <Loader2 className="h-3 w-3 animate-spin" />}
            Encerrar votação
          </button>
        </div>
      )}
    </div>
  );
}
