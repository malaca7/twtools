import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShieldAlert,
  VolumeX,
  UserX,
  History,
  AlertTriangle,
  Loader2,
  Check,
} from "lucide-react";
import {
  getConversationModerationLogs,
  logModerationAction,
  muteConversationParticipant,
  removeConversationParticipant,
} from "@/services/chatService";
import type { ChatConversation, ChatParticipant, ChatModerationLog } from "@/types/chat";
import { formatTimeOnly, dateOnly } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ModerationToolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ChatConversation | null;
  currentUserId?: string;
  onActionComplete?: () => void;
}

export function ModerationToolsDialog({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  onActionComplete,
}: ModerationToolsDialogProps) {
  const [activeTab, setActiveTab] = useState<"members" | "logs">("members");
  const [logs, setLogs] = useState<ChatModerationLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatParticipant | null>(null);
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const loadLogs = async () => {
    if (!conversation) return;
    setIsLoadingLogs(true);
    try {
      const data = await getConversationModerationLogs(conversation.id);
      setLogs(data || []);
    } catch (err: any) {
      toast.error(`Erro ao carregar logs: ${err.message || err}`);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (open && conversation && activeTab === "logs") {
      void loadLogs();
    }
  }, [open, conversation?.id, activeTab]);

  if (!conversation) return null;

  const handleMute = async (participant: ChatParticipant, hours: number) => {
    if (!confirm(`Silenciar ${participant.profile?.nickname || participant.profile?.nome || "este membro"} por ${hours === 0 ? "tempo indeterminado" : `${hours} horas`}?`)) return;

    setIsProcessing(true);
    try {
      const untilDate = hours > 0 ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : null;
      await muteConversationParticipant(conversation.id, participant.user_id, true, untilDate, currentUserId);

      await logModerationAction(
        conversation.id,
        "mute",
        currentUserId || "",
        participant.user_id,
        reason.trim() || `Silenciado por ${hours === 0 ? "tempo indeterminado" : `${hours} horas`}`
      );

      toast.success("Membro silenciado com sucesso.");
      setReason("");
      onActionComplete?.();
    } catch (err: any) {
      toast.error(`Erro ao silenciar: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKick = async (participant: ChatParticipant) => {
    if (!confirm(`Remover ${participant.profile?.nickname || participant.profile?.nome || "este membro"} do grupo?`)) return;

    setIsProcessing(true);
    try {
      await removeConversationParticipant(conversation.id, participant.user_id, currentUserId);

      await logModerationAction(
        conversation.id,
        "kick",
        currentUserId || "",
        participant.user_id,
        reason.trim() || "Removido do grupo"
      );

      toast.success("Membro removido do grupo.");
      setReason("");
      onActionComplete?.();
    } catch (err: any) {
      toast.error(`Erro ao remover: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b border-border/60 bg-amber-500/10 shrink-0">
          <DialogTitle className="text-base font-black text-amber-400 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Painel de Moderação da Conversa
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ações administrativas de controle, silenciamento e auditoria de ações.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2 border-b border-border/40 bg-secondary/20">
            <TabsList className="bg-secondary/60 h-8 p-0.5 rounded-xl">
              <TabsTrigger value="members" className="text-xs rounded-lg font-bold px-3">
                Gerenciar Membros ({conversation.participants?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="logs" className="text-xs rounded-lg font-bold px-3 gap-1">
                <History className="h-3 w-3" /> Histórico de Ações
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ABA 1: MEMBROS */}
          <TabsContent value="members" className="flex-1 p-4 overflow-y-auto space-y-3 m-0">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">Motivo da Ação (Opcional)</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Conduta tóxica, spam em call, descumprimento de regras..."
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold text-foreground">Participantes</Label>
              <div className="space-y-1.5">
                {conversation.participants
                  ?.filter((p) => p.user_id !== currentUserId)
                  .map((p) => {
                    const name = p.profile?.nickname || p.profile?.nome || "Membro";
                    const isMuted = p.is_muted;

                    return (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl border border-border/60 bg-secondary/20 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-7 w-7 border border-border/60">
                            {p.profile?.avatar_url && <AvatarImage src={p.profile.avatar_url} />}
                            <AvatarFallback className="text-[10px] font-bold">
                              {name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{name}</p>
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              {p.role === "admin" ? "★ Administrador" : "Membro"}
                              {isMuted && " • 🔇 Silenciado"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleMute(p, isMuted ? 0 : 24)}
                            className={cn(
                              "h-7 text-[11px] font-bold rounded-lg gap-1",
                              isMuted && "border-amber-500/40 text-amber-400 bg-amber-500/10"
                            )}
                          >
                            <VolumeX className="h-3 w-3" />
                            {isMuted ? "Desilenciar" : "Mute 24h"}
                          </Button>

                          {conversation.type === "group" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleKick(p)}
                              className="h-7 text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg gap-1"
                            >
                              <UserX className="h-3 w-3" />
                              Expulsar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </TabsContent>

          {/* ABA 2: LOGS DE AUDITORIA */}
          <TabsContent value="logs" className="flex-1 p-4 overflow-y-auto space-y-2 m-0">
            {isLoadingLogs ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Carregando histórico...</span>
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Nenhuma ação administrativa registrada nesta conversa.
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl border border-border/60 bg-secondary/20 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground capitalize">
                      {log.action === "mute"
                        ? "🔇 Silenciamento"
                        : log.action === "kick"
                        ? "🚪 Remoção de Membro"
                        : log.action === "delete_message"
                        ? "🗑️ Mensagem Excluída"
                        : log.action}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {dateOnly(log.created_at)} {formatTimeOnly(log.created_at)}
                    </span>
                  </div>
                  {log.reason && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Motivo: {log.reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-3 border-t border-border/60 bg-secondary/30">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs rounded-xl"
          >
            Fechar Painel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
