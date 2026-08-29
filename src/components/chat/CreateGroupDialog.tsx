import { useState } from "react";
import { Users, Search, Check, Loader2 } from "lucide-react";
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
import { createGroupConversation } from "@/services/chatService";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ChatConversation } from "@/types/chat";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: (group: ChatConversation) => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateGroupDialogProps) {
  const { user } = useAuth();
  const { data: members = [] } = useMembers();

  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentUserId = user?.id;

  // Filtrar membros (exceto o próprio usuário)
  const availableMembers = members.filter((m) => m.user_id !== currentUserId);

  const filteredMembers = availableMembers.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.nome.toLowerCase().includes(q) ||
      (m.nickname && m.nickname.toLowerCase().includes(q))
    );
  });

  const toggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!currentUserId) return;
    if (!title.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error("Selecione pelo menos um membro para o grupo.");
      return;
    }

    setIsLoading(true);
    try {
      const newGroup = await createGroupConversation(currentUserId, {
        title: title.trim(),
        participant_ids: selectedUserIds,
      });

      toast.success(`Grupo "${title.trim()}" criado com sucesso!`);
      setTitle("");
      setSelectedUserIds([]);
      setSearch("");
      onOpenChange(false);
      onGroupCreated(newGroup);
    } catch (err: any) {
      toast.error(`Erro ao criar grupo: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
            <Users className="h-5 w-5 text-primary" />
            Novo Grupo de Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 flex-1 overflow-hidden flex flex-col">
          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">
              Nome do Grupo *
            </label>
            <Input
              placeholder="Ex: Operação Twin Wheels, Diretoria, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs"
              autoFocus
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-foreground">
                Participantes ({selectedUserIds.length} selecionados)
              </label>
              {selectedUserIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  Limpar seleção
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar membro..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-secondary/40"
              />
            </div>
          </div>

          {/* LISTA DE MEMBROS */}
          <div className="flex-1 overflow-y-auto max-h-56 rounded-lg border border-border/60 divide-y divide-border/30 p-1 space-y-0.5">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Nenhum membro encontrado.
              </div>
            ) : (
              filteredMembers.map((m) => {
                const isSelected = selectedUserIds.includes(m.user_id);
                const currentNivel = (m.nivel || "novato") as AppLevel;
                const displayName = m.nickname || m.nome;
                const initials = displayName.slice(0, 2).toUpperCase();

                return (
                  <button
                    key={m.user_id}
                    type="button"
                    onClick={() => toggleSelect(m.user_id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-md text-left transition-colors cursor-pointer text-xs",
                      isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-7 w-7 border border-border/80 shrink-0">
                        {m.discord_avatar_url && <AvatarImage src={m.discord_avatar_url} alt={m.nome} />}
                        <AvatarFallback className="bg-secondary text-[10px] font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-foreground leading-tight text-xs">
                          {displayName}
                        </p>
                        {m.nickname && (
                          <p className="truncate text-[10px] text-muted-foreground leading-none">
                            {m.nome}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] px-1 py-0 h-4 font-mono font-bold", levelBadgeClass(currentNivel))}
                      >
                        {LEVEL_LABEL[currentNivel] || currentNivel}
                      </Badge>
                      <div
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center transition-colors",
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
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isLoading || !title.trim() || selectedUserIds.length === 0}
            className="bg-primary text-primary-foreground font-bold shadow-md"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Users className="h-3.5 w-3.5 mr-1.5" />}
            Criar Grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
