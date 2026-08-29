import { useState } from "react";
import { Users, UserPlus, UserMinus, ShieldCheck, Edit2, LogOut, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import {
  addGroupMembers,
  removeGroupMember,
  updateGroupInfo,
} from "@/services/chatService";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ChatConversation } from "@/types/chat";

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ChatConversation;
  onConversationUpdated: () => void;
  onLeaveGroup?: () => void;
}

export function GroupMembersDialog({
  open,
  onOpenChange,
  conversation,
  onConversationUpdated,
  onLeaveGroup,
}: GroupMembersDialogProps) {
  const { user } = useAuth();
  const { data: members = [] } = useMembers();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title || "");
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedNewUserIds, setSelectedNewUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentUserId = user?.id;
  const currentParticipant = conversation.participants.find((p) => p.user_id === currentUserId);
  const isAdmin = currentParticipant?.role === "admin" || conversation.created_by === currentUserId;

  const currentParticipantIds = new Set(conversation.participants.map((p) => p.user_id));
  const availableToAdd = members.filter((m) => !currentParticipantIds.has(m.user_id));

  const handleUpdateTitle = async () => {
    if (!newTitle.trim()) return;
    setIsLoading(true);
    try {
      await updateGroupInfo(conversation.id, newTitle.trim());
      toast.success("Nome do grupo atualizado!");
      setIsEditingTitle(false);
      onConversationUpdated();
    } catch (err: any) {
      toast.error(`Erro ao atualizar nome: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSelectedMembers = async () => {
    if (selectedNewUserIds.length === 0) return;
    setIsLoading(true);
    try {
      await addGroupMembers(conversation.id, selectedNewUserIds);
      toast.success("Novos membros adicionados ao grupo!");
      setSelectedNewUserIds([]);
      setIsAddingMembers(false);
      onConversationUpdated();
    } catch (err: any) {
      toast.error(`Erro ao adicionar membros: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string, targetName: string) => {
    if (!confirm(`Deseja remover ${targetName} do grupo?`)) return;
    setIsLoading(true);
    try {
      await removeGroupMember(conversation.id, targetUserId);
      toast.success(`${targetName} foi removido do grupo.`);
      onConversationUpdated();
    } catch (err: any) {
      toast.error(`Erro ao remover membro: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Tem certeza que deseja sair deste grupo?")) return;
    if (!currentUserId) return;
    setIsLoading(true);
    try {
      await removeGroupMember(conversation.id, currentUserId);
      toast.success("Você saiu do grupo.");
      onOpenChange(false);
      onLeaveGroup?.();
      onConversationUpdated();
    } catch (err: any) {
      toast.error(`Erro ao sair do grupo: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-base font-extrabold">
            <div className="flex items-center gap-2 min-w-0">
              <Users className="h-5 w-5 text-primary shrink-0" />
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-8 text-xs font-bold"
                    autoFocus
                  />
                  <Button size="sm" className="h-8 px-2.5 text-xs font-bold" onClick={handleUpdateTitle} disabled={isLoading}>
                    Salvar
                  </Button>
                </div>
              ) : (
                <span className="truncate">{conversation.title || "Grupo"}</span>
              )}
            </div>

            {isAdmin && !isEditingTitle && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setNewTitle(conversation.title || "");
                  setIsEditingTitle(true);
                }}
                title="Editar nome do grupo"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 flex-1 overflow-hidden flex flex-col">
          {/* HEADER INFO */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/40 border border-border/50 text-xs">
            <span className="text-muted-foreground font-medium">
              {conversation.participants.length} Participantes
            </span>
            {isAdmin && !isAddingMembers && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-bold gap-1 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setIsAddingMembers(true)}
              >
                <UserPlus className="h-3.5 w-3.5" /> Adicionar Membros
              </Button>
            )}
          </div>

          {/* VIEW: ADDING MEMBERS */}
          {isAddingMembers ? (
            <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  Adicionar ao Grupo ({selectedNewUserIds.length} selecionados)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => {
                    setIsAddingMembers(false);
                    setSelectedNewUserIds([]);
                  }}
                >
                  Cancelar
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-52 rounded-lg border border-border/60 divide-y divide-border/30 p-1 space-y-0.5">
                {availableToAdd.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Todos os membros da facção já estão no grupo.
                  </div>
                ) : (
                  availableToAdd.map((m) => {
                    const isSelected = selectedNewUserIds.includes(m.user_id);
                    const currentNivel = (m.nivel || "novato") as AppLevel;
                    const displayName = m.nickname || m.nome;

                    return (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() =>
                          setSelectedNewUserIds((prev) =>
                            prev.includes(m.user_id) ? prev.filter((id) => id !== m.user_id) : [...prev, m.user_id]
                          )
                        }
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-md text-left transition-colors cursor-pointer text-xs",
                          isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/60"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-7 w-7 border border-border/80 shrink-0">
                            {m.discord_avatar_url && <AvatarImage src={m.discord_avatar_url} alt={m.nome} />}
                            <AvatarFallback className="bg-secondary text-[10px] font-bold">
                              {displayName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate font-bold text-foreground">{displayName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4 font-mono", levelBadgeClass(currentNivel))}>
                            {LEVEL_LABEL[currentNivel] || currentNivel}
                          </Badge>
                          <div
                            className={cn(
                              "h-4 w-4 rounded border flex items-center justify-center",
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <Button
                size="sm"
                className="w-full bg-primary text-primary-foreground font-bold h-8 text-xs"
                onClick={handleAddSelectedMembers}
                disabled={isLoading || selectedNewUserIds.length === 0}
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
                Confirmar Adição
              </Button>
            </div>
          ) : (
            /* VIEW: CURRENT PARTICIPANTS LIST */
            <div className="flex-1 overflow-y-auto max-h-60 rounded-lg border border-border/60 divide-y divide-border/30 p-1 space-y-0.5">
              {conversation.participants.map((p) => {
                const prof = p.profile;
                const displayName = prof?.nickname || prof?.nome || "Membro";
                const isMemberAdmin = p.role === "admin" || p.user_id === conversation.created_by;
                const isSelf = p.user_id === currentUserId;

                return (
                  <div
                    key={p.user_id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/40 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar className="h-7 w-7 border border-border/80">
                          {prof?.discord_avatar_url && <AvatarImage src={prof.discord_avatar_url} alt={displayName} />}
                          <AvatarFallback className="bg-secondary text-[10px] font-bold">
                            {displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {prof?.presence_status === "online" && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card bg-emerald-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-bold text-foreground text-xs leading-tight">
                            {displayName}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-mono text-muted-foreground">(você)</span>
                          )}
                        </div>
                        {prof?.nickname && (
                          <span className="truncate text-[10px] text-muted-foreground block leading-none">
                            {prof.nome}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isMemberAdmin ? (
                        <Badge
                          variant="outline"
                          className="border-primary/40 bg-primary/10 text-primary text-[9px] font-mono font-bold px-1.5 py-0 flex items-center gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground px-1.5 py-0">
                          Membro
                        </Badge>
                      )}

                      {isAdmin && !isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMember(p.user_id, displayName)}
                          disabled={isLoading}
                          title="Remover do grupo"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t border-border/40 gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs font-bold"
            onClick={handleLeaveGroup}
            disabled={isLoading}
          >
            <LogOut className="h-3.5 w-3.5 mr-1" /> Sair do Grupo
          </Button>

          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
