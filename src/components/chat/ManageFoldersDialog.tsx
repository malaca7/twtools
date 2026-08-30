import React, { useState } from "react";
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
import {
  Folder,
  FolderPlus,
  Trash2,
  Edit2,
  Check,
  Loader2,
  Plus,
  Briefcase,
  Shield,
  Star,
  Users,
  Flame,
  Zap,
} from "lucide-react";
import { saveUserChatFolder, deleteUserChatFolder } from "@/services/chatService";
import type { ChatConversation, ChatUserFolder } from "@/types/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ManageFoldersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: ChatUserFolder[];
  conversations: ChatConversation[];
  currentUserId?: string;
  onFoldersUpdated: () => void;
}

const PRESET_ICONS = [
  { id: "folder", icon: Folder, name: "Pasta" },
  { id: "briefcase", icon: Briefcase, name: "Trabalho" },
  { id: "shield", icon: Shield, name: "Facção" },
  { id: "star", icon: Star, name: "Importantes" },
  { id: "users", icon: Users, name: "Galera" },
  { id: "flame", icon: Flame, name: "Ação" },
  { id: "zap", icon: Zap, name: "Projetos" },
];

const PRESET_COLORS = [
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#8b5cf6", // Purple
];

export function ManageFoldersDialog({
  open,
  onOpenChange,
  folders,
  conversations,
  currentUserId,
  onFoldersUpdated,
}: ManageFoldersDialogProps) {
  const [editingFolder, setEditingFolder] = useState<Partial<ChatUserFolder> | null>(null);
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("folder");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const startCreate = () => {
    setEditingFolder({ name: "" });
    setName("");
    setSelectedIcon("folder");
    setSelectedColor("#6366f1");
    setSelectedConvIds([]);
  };

  const startEdit = (f: ChatUserFolder) => {
    setEditingFolder(f);
    setName(f.name);
    setSelectedIcon(f.icon || "folder");
    setSelectedColor(f.color || "#6366f1");
    setSelectedConvIds(f.conversation_ids || []);
  };

  const handleToggleConv = (convId: string) => {
    setSelectedConvIds((prev) =>
      prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Digite o nome da pasta.");
      return;
    }

    setIsSaving(true);
    try {
      await saveUserChatFolder(
        {
          id: editingFolder?.id,
          name: name.trim(),
          icon: selectedIcon,
          color: selectedColor,
          conversation_ids: selectedConvIds,
        },
        currentUserId
      );

      toast.success(editingFolder?.id ? "Pasta atualizada!" : "Pasta criada com sucesso! 📂");
      setEditingFolder(null);
      onFoldersUpdated();
    } catch (err: any) {
      toast.error(`Erro ao salvar pasta: ${err.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (folderId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta pasta de conversas?")) return;
    setIsDeleting(folderId);
    try {
      await deleteUserChatFolder(folderId, currentUserId);
      toast.success("Pasta removida.");
      if (editingFolder?.id === folderId) setEditingFolder(null);
      onFoldersUpdated();
    } catch (err: any) {
      toast.error(`Erro ao excluir: ${err.message || err}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b border-border/60 bg-secondary/30">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Folder className="h-4 w-4 text-primary" />
            Organização de Conversas em Pastas
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Crie categorias personalizadas para agrupar e filtrar suas conversas.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {editingFolder ? (
            /* FORMULÁRIO DE EDIÇÃO / CRIAÇÃO */
            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-border/40">
                <span className="text-xs font-bold text-foreground">
                  {editingFolder.id ? "Editar Pasta" : "Nova Pasta"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingFolder(null)}
                  className="h-6 text-[11px]"
                >
                  Voltar para Lista
                </Button>
              </div>

              {/* NOME */}
              <div className="space-y-1">
                <Label className="text-xs font-bold">Nome da Pasta</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Trabalho, Facção, Importantes..."
                  className="text-xs rounded-xl"
                  maxLength={40}
                  autoFocus
                />
              </div>

              {/* ÍCONE & COR */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Ícone</Label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_ICONS.map((it) => {
                      const IconComp = it.icon;
                      const isSel = selectedIcon === it.id;
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => setSelectedIcon(it.id)}
                          className={cn(
                            "h-7 w-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer",
                            isSel
                              ? "border-primary bg-primary text-primary-foreground shadow-xs"
                              : "border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary"
                          )}
                          title={it.name}
                        >
                          <IconComp className="h-3.5 w-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Cor de Destaque</Label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        style={{ backgroundColor: c }}
                        className={cn(
                          "h-7 w-7 rounded-lg border border-white/20 transition-all cursor-pointer flex items-center justify-center",
                          selectedColor === c && "ring-2 ring-foreground scale-110 shadow-xs"
                        )}
                      >
                        {selectedColor === c && <Check className="h-3 w-3 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SELEÇÃO DE CONVERSAS */}
              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-bold flex items-center justify-between">
                  <span>Conversas Incluídas</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {selectedConvIds.length} selecionada(s)
                  </span>
                </Label>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-border/60 p-1.5 space-y-1 bg-secondary/15">
                  {conversations.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground p-2 text-center">
                      Nenhuma conversa disponível.
                    </p>
                  ) : (
                    conversations.map((conv) => {
                      const isIncluded = selectedConvIds.includes(conv.id);
                      const title =
                        conv.type === "group"
                          ? conv.title || "Grupo"
                          : conv.other_participant?.nickname || conv.other_participant?.nome || "Conversa";

                      return (
                        <button
                          key={conv.id}
                          type="button"
                          onClick={() => handleToggleConv(conv.id)}
                          className={cn(
                            "w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer",
                            isIncluded
                              ? "bg-primary/20 text-foreground font-bold border border-primary/40"
                              : "hover:bg-secondary/60 text-muted-foreground"
                          )}
                        >
                          <span className="truncate">{title}</span>
                          {isIncluded && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingFolder(null)}
                  className="text-xs rounded-xl"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="text-xs font-bold rounded-xl gap-1.5"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Salvar Pasta
                </Button>
              </div>
            </form>
          ) : (
            /* LISTA DE PASTAS EXISTENTES */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Suas Pastas ({folders.length})</span>
                <Button
                  type="button"
                  size="sm"
                  onClick={startCreate}
                  className="h-8 text-xs font-bold rounded-xl gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nova Pasta
                </Button>
              </div>

              {folders.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border/80 rounded-2xl p-6 space-y-2">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                    <FolderPlus className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-foreground">Nenhuma pasta criada</p>
                  <p className="text-[11px] text-muted-foreground">
                    Crie pastas para organizar grupos de trabalho, facção ou conversas importantes.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startCreate}
                    className="text-xs rounded-xl gap-1 mt-2"
                  >
                    <Plus className="h-3.5 w-3.5" /> Criar Primeira Pasta
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {folders.map((f) => {
                    const convCount = f.conversation_ids?.length || 0;
                    return (
                      <div
                        key={f.id}
                        className="p-3 rounded-xl border border-border/60 bg-secondary/20 flex items-center justify-between gap-2 hover:bg-secondary/40 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-white shadow-xs"
                            style={{ backgroundColor: f.color || "#6366f1" }}
                          >
                            <Folder className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{f.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {convCount} conversa{convCount === 1 ? "" : "s"} vinculada{convCount === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => startEdit(f)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Editar pasta"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(f.id)}
                            disabled={isDeleting === f.id}
                            className="h-7 w-7 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                            title="Excluir pasta"
                          >
                            {isDeleting === f.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-3 border-t border-border/60 bg-secondary/30">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs rounded-xl"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
