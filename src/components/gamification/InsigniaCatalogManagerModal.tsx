import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Check,
  AlertCircle,
  Coins,
  Shield,
  Sparkles,
  Crown,
  Boxes,
  Target,
  DollarSign,
  Truck,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  getInsigniasCatalog,
  saveInsignia,
  RARITY_CONFIG,
  type InsigniaItem,
  type InsigniaRarity,
} from "@/services/gamificationService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const ICONS_OPTIONS = ["Award", "Shield", "Sparkles", "Crown", "Boxes", "Target", "DollarSign", "Truck", "Eye"];

const ICON_MAP: Record<string, React.ElementType> = {
  Award,
  Shield,
  Sparkles,
  Crown,
  Boxes,
  Target,
  DollarSign,
  Truck,
  Eye,
};

interface InsigniaCatalogManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsigniaCatalogManagerModal({
  open,
  onOpenChange,
}: InsigniaCatalogManagerModalProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManageCatalog = hasPermission("manage_insignias_catalog");

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ["insignias_catalog"],
    queryFn: getInsigniasCatalog,
    enabled: open,
  });

  const [editingItem, setEditingItem] = useState<Partial<InsigniaItem> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<InsigniaItem>) => {
      if (!canManageCatalog) throw new Error("Você não possui permissão para gerenciar o catálogo.");
      if (!item.id || !item.name) throw new Error("ID e Nome são obrigatórios.");
      await saveInsignia({
        id: item.id.trim().toLowerCase().replace(/\s+/g, "_"),
        name: item.name.trim(),
        icon: item.icon || "Award",
        description: item.description || "",
        rarity: (item.rarity as InsigniaRarity) || "comum",
        xp_cost: Number(item.xp_cost || 0),
        category: item.category || "geral",
        active: item.active !== false,
      });
    },
    onSuccess: () => {
      toast.success("Insígnia configurada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["insignias_catalog"] });
      setIsEditing(false);
      setEditingItem(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Falha ao salvar insígnia.");
    },
  });

  const handleOpenNew = () => {
    setEditingItem({
      id: "",
      name: "",
      icon: "Award",
      description: "",
      rarity: "comum",
      xp_cost: 50,
      category: "geral",
      active: true,
    });
    setIsEditing(true);
  };

  const handleOpenEdit = (item: InsigniaItem) => {
    setEditingItem({ ...item });
    setIsEditing(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto surface-card border-border/80">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-foreground">
                  Catálogo de Insígnias & Custos
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Configure títulos, ícones, raridades e o custo em XP debitado do concedente.
                </DialogDescription>
              </div>
            </div>

            {!isEditing && canManageCatalog && (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenNew}
                className="h-8 text-xs font-bold gap-1 bg-amber-500 text-slate-950 hover:bg-amber-600"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nova Insígnia</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {isEditing && editingItem ? (
          /* FORMULÁRIO DE CRIAÇÃO / EDIÇÃO */
          <div className="space-y-4 pt-2 border-t border-border/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Identificador Único (ID):</label>
                <Input
                  value={editingItem.id || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, id: e.target.value })}
                  placeholder="ex: negociador_ouro"
                  className="h-8 text-xs font-mono bg-background/50"
                  disabled={Boolean(catalog.some((c) => c.id === editingItem.id))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Nome da Insígnia:</label>
                <Input
                  value={editingItem.name || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="ex: Negociador de Ouro"
                  className="h-8 text-xs bg-background/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Raridade:</label>
                <Select
                  value={editingItem.rarity || "comum"}
                  onValueChange={(val: any) => setEditingItem({ ...editingItem, rarity: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comum">Comum</SelectItem>
                    <SelectItem value="raro">Raro</SelectItem>
                    <SelectItem value="epico">Épico</SelectItem>
                    <SelectItem value="lendario">Lendário</SelectItem>
                    <SelectItem value="mitico">Mítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Custo em XP:</span>
                  <span className="text-[10px] text-muted-foreground font-normal">(Debitado do líder)</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  step={10}
                  value={editingItem.xp_cost ?? 50}
                  onChange={(e) => setEditingItem({ ...editingItem, xp_cost: Number(e.target.value) })}
                  className="h-8 text-xs font-mono bg-background/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Ícone:</label>
                <Select
                  value={editingItem.icon || "Award"}
                  onValueChange={(val) => setEditingItem({ ...editingItem, icon: val })}
                >
                  <SelectTrigger className="h-8 text-xs bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONS_OPTIONS.map((ico) => {
                      const IconComp = ICON_MAP[ico] || Award;
                      return (
                        <SelectItem key={ico} value={ico}>
                          <div className="flex items-center gap-2">
                            <IconComp className="h-3.5 w-3.5" />
                            <span>{ico}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Descrição do Feito / Honraria:</label>
              <Textarea
                value={editingItem.description || ""}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                placeholder="Descreva o que o membro realizou para merecer este distintivo..."
                rows={2}
                className="text-xs bg-background/50 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={saveMutation.isPending}
              >
                Voltar à Lista
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => saveMutation.mutate(editingItem)}
                disabled={saveMutation.isPending || !editingItem.id || !editingItem.name}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5"
              >
                {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Salvar no Catálogo
              </Button>
            </div>
          </div>
        ) : (
          /* LISTA DE INSÍGNIAS NO CATÁLOGO */
          <div className="space-y-2 pt-2">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                Carregando catálogo de insígnias...
              </div>
            ) : catalog.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                Nenhuma insígnia cadastrada no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {catalog.map((badge) => {
                  const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;
                  const IconComp = ICON_MAP[badge.icon] || Award;

                  return (
                    <div
                      key={badge.id}
                      className={cn(
                        "p-3 rounded-xl border bg-secondary/30 flex items-start justify-between gap-3 transition-all",
                        rarity.borderClass
                      )}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border",
                            rarity.bgClass,
                            rarity.borderClass,
                            rarity.textClass
                          )}
                        >
                          <IconComp className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate">
                            {badge.name}
                          </h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                            {badge.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant="outline"
                              className={cn("text-[9px] px-1 py-0 uppercase font-bold", rarity.textClass, rarity.borderClass)}
                            >
                              {rarity.label}
                            </Badge>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              {badge.xp_cost > 0 ? `${badge.xp_cost} XP` : "Sem Custo"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canManageCatalog && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(badge)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                          title="Editar esta insígnia"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
