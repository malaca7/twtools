import { useState, useRef } from "react";
import { Users, Search, Check, Loader2, Camera, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { createGroupConversation, uploadChatAttachment } from "@/services/chatService";
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
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [onlyAdmins, setOnlyAdmins] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = user?.id;

  const safeMembers = Array.isArray(members) ? members : [];
  const availableMembers = safeMembers.filter((m) => m && m.user_id !== currentUserId);
  const filteredMembers = availableMembers.filter((m) => {
    if (!m) return false;
    const q = search.toLowerCase();
    return (
      (m.nome || "").toLowerCase().includes(q) ||
      Boolean(m.nickname && m.nickname.toLowerCase().includes(q)) ||
      Boolean(m.game_id && String(m.game_id).includes(q))
    );
  });

  const toggleSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const res = await uploadChatAttachment(file);
      setAvatarUrl(res.url);
      toast.success("Foto selecionada!");
    } catch (err: any) {
      toast.error(`Falha no upload: ${err.message || err}`);
    } finally {
      setUploadingAvatar(false);
    }
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
        description: description.trim() || undefined,
        avatar_url: avatarUrl || null,
        only_admins_can_post: onlyAdmins,
        participant_ids: selectedUserIds,
      });

      toast.success(`Grupo "${title.trim()}" criado com sucesso!`);
      setTitle("");
      setDescription("");
      setAvatarUrl("");
      setOnlyAdmins(false);
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
      <DialogContent className="sm:max-w-md max-h-[88vh] flex flex-col p-4 sm:p-6 bg-card text-card-foreground border border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
            <Users className="h-5 w-5 text-primary" />
            Novo Grupo de Chat
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Crie um grupo de conversa e defina as configurações iniciais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2 flex-1 overflow-y-auto pr-1">
          {/* FOTO E NOME DO GRUPO */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-14 w-14 border border-border shadow-xs">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
                <AvatarFallback className="bg-primary/15 text-primary font-bold">
                  <Users className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 cursor-pointer"
                title="Adicionar foto"
              >
                {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
            </div>

            <div className="flex-1 space-y-1">
              <Label className="text-xs font-bold text-foreground">Nome do Grupo *</Label>
              <Input
                placeholder="Ex: Diretoria, Ação Tática..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs bg-background"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-foreground">Descrição (Opcional)</Label>
            <Input
              placeholder="Objetivo ou regras do grupo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>

          {/* TOGGLE SOMENTE ADMINS */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/80 text-xs">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>Somente Administradores Podem Falar</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Membros comuns apenas lerão as mensagens deste grupo.
              </p>
            </div>
            <Switch checked={onlyAdmins} onCheckedChange={setOnlyAdmins} />
          </div>

          {/* SELEÇÃO DE MEMBROS */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Participantes ({selectedUserIds.length} selecionados)
              </Label>
              {selectedUserIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar membros para adicionar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-secondary/30"
              />
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-border/80 divide-y divide-border/30 p-1 space-y-0.5">
              {filteredMembers.length === 0 ? (
                <p className="text-center py-4 text-xs text-muted-foreground">Nenhum membro encontrado.</p>
              ) : (
                filteredMembers.map((m) => {
                  const isSelected = selectedUserIds.includes(m.user_id);
                  const displayName = m.nickname || m.nome;
                  const currentNivel = (m.nivel || "novato") as AppLevel;

                  return (
                    <div
                      key={m.user_id}
                      onClick={() => toggleSelect(m.user_id)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer text-xs",
                        isSelected ? "bg-primary/15 border border-primary/30" : "hover:bg-secondary/60"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 border shrink-0">
                          {m.discord_avatar_url && <AvatarImage src={m.discord_avatar_url} />}
                          <AvatarFallback className="text-[10px] font-bold">
                            {displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold truncate text-foreground leading-tight">{displayName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
                            #{m.game_id || "N/A"} · {LEVEL_LABEL[currentNivel] || currentNivel}
                          </p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0",
                          isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isLoading || !title.trim() || selectedUserIds.length === 0}
            className="bg-primary text-primary-foreground font-bold shadow-md cursor-pointer"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Users className="h-3.5 w-3.5 mr-1.5" />}
            Criar Grupo ({selectedUserIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
