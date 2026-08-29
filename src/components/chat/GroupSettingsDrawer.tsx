import { useState, useRef } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  LogOut,
  Edit2,
  Camera,
  Lock,
  Unlock,
  Check,
  Crown,
  MoreVertical,
  Search,
  Loader2,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import {
  updateGroupSettings,
  manageGroupMember,
  leaveOrDeleteGroup,
  uploadChatAttachment,
} from "@/services/chatService";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatParticipant } from "@/types/chat";
import { toast } from "sonner";

interface GroupSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ChatConversation;
  onConversationUpdated?: () => void;
  onLeaveGroup?: () => void;
  onOpenProfile?: (userId: string) => void;
}

export function GroupSettingsDrawer({
  open,
  onOpenChange,
  conversation,
  onConversationUpdated,
  onLeaveGroup,
  onOpenProfile,
}: GroupSettingsDrawerProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const { data: allMembers = [] } = useMembers();

  // State
  const [editingInfo, setEditingInfo] = useState(false);
  const [title, setTitle] = useState(conversation.title || "");
  const [description, setDescription] = useState(conversation.description || "");
  const [avatarUrl, setAvatarUrl] = useState(conversation.avatar_url || "");
  const [onlyAdmins, setOnlyAdmins] = useState(Boolean(conversation.only_admins_can_post));
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Add members modal state
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check roles
  const myParticipant = conversation.participants.find((p) => p.user_id === currentUserId);
  const isCallerAdmin = myParticipant?.role === "admin";
  const isCallerCreator = conversation.created_by === currentUserId;

  // Handle saving group info
  const handleSaveInfo = async () => {
    if (!title.trim()) {
      toast.error("O nome do grupo não pode estar vazio.");
      return;
    }

    setSavingSettings(true);
    try {
      await updateGroupSettings({
        conversation_id: conversation.id,
        title: title.trim(),
        description: description.trim(),
        avatar_url: avatarUrl || null,
        only_admins_can_post: onlyAdmins,
      });
      toast.success("Configurações do grupo atualizadas!");
      setEditingInfo(false);
      onConversationUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const res = await uploadChatAttachment(file);
      setAvatarUrl(res.url);
      await updateGroupSettings({
        conversation_id: conversation.id,
        title: conversation.title || "Grupo",
        avatar_url: res.url,
      });
      toast.success("Foto do grupo atualizada!");
      onConversationUpdated?.();
    } catch (err: any) {
      toast.error(`Falha no envio da foto: ${err.message || err}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle member actions
  const handleMemberAction = async (
    targetUserId: string,
    action: "make_admin" | "remove_admin" | "remove"
  ) => {
    try {
      await manageGroupMember(conversation.id, targetUserId, action);
      toast.success("Operação realizada com sucesso!");
      onConversationUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerenciar participante.");
    }
  };

  // Handle Add Members
  const handleAddMembersSubmit = async () => {
    if (selectedUserIds.length === 0) return;

    setAddingMembers(true);
    try {
      for (const uid of selectedUserIds) {
        await manageGroupMember(conversation.id, uid, "add", "member");
      }
      toast.success(`${selectedUserIds.length} membro(s) adicionado(s) ao grupo!`);
      setSelectedUserIds([]);
      setAddMembersOpen(false);
      onConversationUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar participantes.");
    } finally {
      setAddingMembers(false);
    }
  };

  // Handle Leave / Delete Group
  const handleLeaveOrDelete = async (action: "leave" | "delete") => {
    const confirmText =
      action === "delete"
        ? "Tem certeza que deseja EXCLUIR este grupo para todos? Esta ação é irreversível."
        : "Tem certeza que deseja sair deste grupo?";

    if (!window.confirm(confirmText)) return;

    try {
      await leaveOrDeleteGroup(conversation.id, action);
      toast.success(action === "delete" ? "Grupo excluído com sucesso." : "Você saiu do grupo.");
      onOpenChange(false);
      onLeaveGroup?.();
    } catch (err: any) {
      toast.error(err.message || "Erro na operação.");
    }
  };

  // Filter non-members for add dialog
  const existingMemberIds = new Set(conversation.participants.map((p) => p.user_id));
  const availableToAdd = allMembers.filter((m) => !existingMemberIds.has(m.user_id));
  const filteredAvailable = availableToAdd.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      m.nome.toLowerCase().includes(q) ||
      (m.nickname && m.nickname.toLowerCase().includes(q)) ||
      (m.game_id && m.game_id.includes(q))
    );
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-5 bg-card text-card-foreground border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="h-5 w-5 text-primary" /> Configurações do Grupo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Detalhes, membros e permissões administrativas do grupo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* GROUP HEADER WITH AVATAR & EDIT ACTION */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/30 border border-border/70 text-center relative group">
              <div className="relative mb-2">
                <Avatar className="h-20 w-20 border-2 border-primary/40 shadow-md">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={title} />}
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">
                    <Users className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>

                {isCallerAdmin && (
                  <>
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
                      className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                      title="Alterar foto do grupo"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                  </>
                )}
              </div>

              {editingInfo ? (
                <div className="w-full space-y-2.5 pt-2">
                  <div className="space-y-1 text-left">
                    <Label className="text-xs font-bold">Nome do Grupo</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <Label className="text-xs font-bold">Descrição</Label>
                    <Input
                      placeholder="Descrição do grupo..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="h-8 text-xs bg-background"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setEditingInfo(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs font-bold"
                      onClick={handleSaveInfo}
                      disabled={savingSettings}
                    >
                      {savingSettings ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 justify-center">
                    <h3 className="font-extrabold text-base text-foreground">{conversation.title}</h3>
                    {isCallerAdmin && (
                      <button
                        type="button"
                        onClick={() => setEditingInfo(true)}
                        className="text-muted-foreground hover:text-primary p-1 cursor-pointer"
                        title="Editar nome e descrição"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {conversation.description && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">{conversation.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">
                    {conversation.participants.length} participantes
                  </p>
                </>
              )}
            </div>

            {/* ONLY ADMINS CAN POST TOGGLE */}
            {isCallerAdmin && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/80">
                <div className="space-y-0.5 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <Label className="text-xs font-bold text-foreground">
                      Somente Administradores Podem Falar
                    </Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Quando ativado, membros comuns não podem enviar mensagens no grupo.
                  </p>
                </div>

                <Switch
                  checked={onlyAdmins}
                  onCheckedChange={async (checked) => {
                    setOnlyAdmins(checked);
                    try {
                      await updateGroupSettings({
                        conversation_id: conversation.id,
                        title: conversation.title || "Grupo",
                        only_admins_can_post: checked,
                      });
                      toast.success(checked ? "Modo somente administradores ativado!" : "Envio liberado para todos.");
                      onConversationUpdated?.();
                    } catch (err: any) {
                      setOnlyAdmins(!checked);
                      toast.error(err.message || "Erro ao alterar permissão.");
                    }
                  }}
                />
              </div>
            )}

            {/* PARTICIPANTS SECTION */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Participantes ({conversation.participants.length})
                </h4>

                {isCallerAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddMembersOpen(true)}
                    className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/10 font-bold rounded-lg cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Adicionar
                  </Button>
                )}
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {conversation.participants.map((part) => {
                  const prof = part.profile;
                  const isCreator = conversation.created_by === part.user_id;
                  const isAdmin = part.role === "admin";
                  const isSelf = part.user_id === currentUserId;
                  const displayName = prof?.nickname || prof?.nome || "Membro";
                  const nivel = (prof?.nivel || "novato") as AppLevel;

                  return (
                    <div
                      key={part.id}
                      className="flex items-center justify-between p-2 rounded-xl border border-border/60 bg-card hover:bg-secondary/40 transition-colors text-xs"
                    >
                      <div
                        onClick={() => onOpenProfile?.(part.user_id)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                      >
                        <Avatar className="h-8 w-8 border border-border/80 shrink-0">
                          {prof?.discord_avatar_url && (
                            <AvatarImage src={prof.discord_avatar_url} alt={displayName} />
                          )}
                          <AvatarFallback className="bg-secondary font-bold text-xs">
                            {displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground truncate">{displayName}</span>
                            {isCreator && (
                              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[8px] font-bold px-1 py-0">
                                <Crown className="h-2.5 w-2.5 mr-0.5" /> Criador
                              </Badge>
                            )}
                            {isAdmin && !isCreator && (
                              <Badge className="bg-primary/15 text-primary border-primary/30 text-[8px] font-bold px-1 py-0">
                                <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                            {prof?.game_id && <span>#{prof.game_id}</span>}
                            <span>· {LEVEL_LABEL[nivel] || nivel}</span>
                          </div>
                        </div>
                      </div>

                      {/* ACTIONS ON MEMBER */}
                      {isCallerAdmin && !isSelf && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs z-50">
                            {isAdmin && !isCreator && (
                              <DropdownMenuItem
                                onClick={() => handleMemberAction(part.user_id, "remove_admin")}
                                className="cursor-pointer"
                              >
                                <Shield className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                Rebaixar para Membro
                              </DropdownMenuItem>
                            )}
                            {!isAdmin && (
                              <DropdownMenuItem
                                onClick={() => handleMemberAction(part.user_id, "make_admin")}
                                className="cursor-pointer font-bold text-primary"
                              >
                                <ShieldCheck className="mr-2 h-3.5 w-3.5 text-primary" />
                                Promover a Admin
                              </DropdownMenuItem>
                            )}
                            {!isCreator && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleMemberAction(part.user_id, "remove")}
                                  className="text-destructive font-bold cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Remover do Grupo
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DANGER ACTIONS */}
            <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleLeaveOrDelete("leave")}
                className="w-full text-xs text-amber-500 border-amber-500/40 hover:bg-amber-500/10 font-bold rounded-xl cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Sair do Grupo
              </Button>

              {isCallerCreator && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleLeaveOrDelete("delete")}
                  className="w-full text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir Grupo Permanentemente
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD MEMBERS MODAL */}
      <Dialog open={addMembersOpen} onOpenChange={setAddMembersOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border border-border p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <UserPlus className="h-5 w-5 text-primary" /> Adicionar Participantes
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione os membros da facção que deseja adicionar a este grupo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar membro por nome ou ID..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/30"
              />
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {filteredAvailable.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhum membro disponível para adicionar.
                </p>
              ) : (
                filteredAvailable.map((m) => {
                  const isSelected = selectedUserIds.includes(m.user_id);
                  const displayName = m.nickname || m.nome;

                  return (
                    <div
                      key={m.user_id}
                      onClick={() => {
                        setSelectedUserIds((prev) =>
                          isSelected ? prev.filter((id) => id !== m.user_id) : [...prev, m.user_id]
                        );
                      }}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer text-xs",
                        isSelected
                          ? "bg-primary/15 border-primary/50 text-foreground"
                          : "bg-secondary/20 border-border hover:bg-secondary/40"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-7 w-7 border">
                          {m.discord_avatar_url && <AvatarImage src={m.discord_avatar_url} />}
                          <AvatarFallback className="text-[10px] font-bold">
                            {displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold truncate leading-tight">{displayName}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            #{m.game_id || "N/A"} · {LEVEL_LABEL[m.nivel as AppLevel] || m.nivel}
                          </p>
                        </div>
                      </div>

                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border/50 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAddMembersOpen(false)}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddMembersSubmit}
              disabled={selectedUserIds.length === 0 || addingMembers}
              className="h-8 text-xs bg-primary text-primary-foreground font-bold"
            >
              {addingMembers ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Adicionar ({selectedUserIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
