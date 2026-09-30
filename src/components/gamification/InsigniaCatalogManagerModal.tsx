import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Award,
  Plus,
  Edit2,
  Loader2,
  Check,
  Shield,
  Sparkles,
  Crown,
  Boxes,
  Target,
  DollarSign,
  Truck,
  Eye,
  Palette,
  RefreshCw,
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

import { DynamicInsigniaIcon } from "@/components/gamification/InsigniaIcon";
import { IconPicker } from "@/components/dev/IconPicker";

/** Paleta de presets de cor */
export const COLOR_PALETTE = [
  "#8B5CF6", // Roxo
  "#6366F1", // Índigo
  "#3B82F6", // Azul
  "#06B6D4", // Ciano
  "#10B981", // Esmeralda
  "#22C55E", // Verde
  "#EAB308", // Amarelo
  "#F59E0B", // Âmbar
  "#F97316", // Laranja
  "#EF4444", // Vermelho
  "#EC4899", // Rosa
  "#F472B6", // Rosa Claro
  "#B45309", // Bronze
  "#78716C", // Pedra
  "#94A3B8", // Prata
  "#F8FAFC", // Branco
];

// ─── HELPER PRINCIPAL ───────────────────────────────────────────────────────

/**
 * Computa os estilos inline de um ícone de insígnia com base nas cores
 * personalizadas (bg_color, border_color, color) ou nas classes de raridade.
 */
export function getInsigniaIconStyles(badge: {
  color?: string | null;
  bg_color?: string | null;
  border_color?: string | null;
  rarity?: string;
}): React.CSSProperties | undefined {
  const hasBg = Boolean(badge.bg_color);
  const hasBorder = Boolean(badge.border_color);
  const hasIcon = Boolean(badge.color);

  if (!hasBg && !hasBorder && !hasIcon) return undefined;

  return {
    ...(hasBg ? { backgroundColor: badge.bg_color! } : {}),
    ...(hasBorder ? { borderColor: badge.border_color! } : {}),
    ...(hasIcon ? { color: badge.color! } : {}),
  };
}

/** Estilo inline só para o container externo do card (borda sutil) */
export function getInsigniaCardStyles(badge: {
  border_color?: string | null;
  bg_color?: string | null;
}): React.CSSProperties | undefined {
  if (!badge.border_color && !badge.bg_color) return undefined;
  return {
    ...(badge.border_color ? { borderColor: `${badge.border_color}50` } : {}),
    ...(badge.bg_color ? { backgroundColor: `${badge.bg_color}15` } : {}),
  };
}

// ─── COMPONENTE DE COLOR PICKER ──────────────────────────────────────────────

export interface ColorPickerFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (val: string | null) => void;
  placeholder?: string;
}

export function ColorPickerField({ label, value, onChange, placeholder }: ColorPickerFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[10px] text-muted-foreground hover:text-rose-400 transition-colors"
            title="Limpar"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Paleta de presets */}
      <div className="flex flex-wrap gap-1.5">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            className={cn(
              "h-5 w-5 rounded-md border-2 transition-all hover:scale-125 shrink-0",
              value === c ? "border-white scale-125 ring-2 ring-white/40" : "border-transparent"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        {/* Nenhuma cor */}
        <button
          type="button"
          title="Sem cor personalizada"
          onClick={() => onChange(null)}
          className={cn(
            "h-5 w-5 rounded-md border-2 transition-all hover:scale-125 relative overflow-hidden",
            !value ? "border-white scale-110" : "border-transparent border-border/40"
          )}
          style={{ background: "linear-gradient(135deg, #334155 50%, transparent 50%)" }}
        />
      </div>

      {/* Input hex + color wheel */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#8B5CF6"}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-9 rounded-md cursor-pointer border border-border/50 p-0.5 bg-transparent shrink-0"
        />
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder={placeholder || "#hex ou rgba(...)"}
          className="h-8 text-[11px] font-mono bg-background/50"
        />
        {value && (
          <div
            className="h-7 w-7 rounded-md border border-border/50 shrink-0"
            style={{ backgroundColor: value }}
          />
        )}
      </div>
    </div>
  );
}

// ─── MODAL PRINCIPAL ─────────────────────────────────────────────────────────

interface InsigniaCatalogManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InsigniaCatalogManagerModal({ open, onOpenChange }: InsigniaCatalogManagerModalProps) {
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
  const [colorTab, setColorTab] = useState<"icon" | "bg" | "border">("icon");

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<InsigniaItem>) => {
      if (!canManageCatalog) throw new Error("Sem permissão para gerenciar o catálogo.");
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
        color: item.color || null,
        bg_color: item.bg_color || null,
        border_color: item.border_color || null,
      });
    },
    onSuccess: () => {
      toast.success("Insígnia configurada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["insignias_catalog"] });
      setIsEditing(false);
      setEditingItem(null);
    },
    onError: (err: any) => toast.error(err.message || "Falha ao salvar insígnia."),
  });

  const handleOpenNew = () => {
    setEditingItem({ id: "", name: "", icon: "Award", description: "", rarity: "comum", xp_cost: 50, category: "geral", active: true, color: null, bg_color: null, border_color: null });
    setIsEditing(true);
  };

  const handleOpenEdit = (item: InsigniaItem) => {
    setEditingItem({ ...item });
    setIsEditing(true);
  };

  const set = (key: keyof InsigniaItem, val: any) =>
    setEditingItem((prev) => prev ? { ...prev, [key]: val } : prev);

  // Preview
  const rarity = RARITY_CONFIG[(editingItem?.rarity as InsigniaRarity) || "comum"] || RARITY_CONFIG.comum;
  const previewStyle = getInsigniaIconStyles(editingItem || {});
  const hasCustomColor = editingItem?.color || editingItem?.bg_color || editingItem?.border_color;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto surface-card border-border/80">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-foreground">
                  Catálogo de Insígnias &amp; Custos
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Configure ícones, raridades, cores personalizadas e custo em XP.
                </DialogDescription>
              </div>
            </div>
            {!isEditing && canManageCatalog && (
              <Button type="button" size="sm" onClick={handleOpenNew}
                className="h-8 text-xs font-bold gap-1 bg-amber-500 text-slate-950 hover:bg-amber-600">
                <Plus className="h-3.5 w-3.5" /><span>Nova Insígnia</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {isEditing && editingItem ? (
          <div className="space-y-4 pt-2 border-t border-border/60">

            {/* ── PREVIEW AO VIVO ── */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border/50">
              {/* Emblema */}
              <div
                className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all duration-200",
                  !previewStyle && rarity.bgClass,
                  !previewStyle && rarity.borderClass,
                  !previewStyle && rarity.textClass,
                )}
                style={previewStyle || undefined}
              >
                <DynamicInsigniaIcon name={editingItem.icon || "Award"} className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground truncate">
                  {editingItem.name || "Nome da Insígnia"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {hasCustomColor ? "Cores personalizadas ativas" : `Usando cores da raridade: ${rarity.label}`}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {editingItem.bg_color && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm border border-white/20" style={{ backgroundColor: editingItem.bg_color }} />
                      <span>Fundo</span>
                    </div>
                  )}
                  {editingItem.border_color && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm border-2" style={{ borderColor: editingItem.border_color, backgroundColor: "transparent" }} />
                      <span>Borda</span>
                    </div>
                  )}
                  {editingItem.color && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: editingItem.color }} />
                      <span>Ícone</span>
                    </div>
                  )}
                </div>
              </div>
              {hasCustomColor && (
                <Button
                  type="button" variant="ghost" size="sm"
                  onClick={() => setEditingItem({ ...editingItem, color: null, bg_color: null, border_color: null })}
                  className="h-7 text-[10px] text-muted-foreground hover:text-rose-400 gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Resetar cores
                </Button>
              )}
            </div>

            {/* ── CAMPOS DE INFORMAÇÃO ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Identificador Único (ID):</label>
                <Input value={editingItem.id || ""} onChange={(e) => set("id", e.target.value)}
                  placeholder="ex: negociador_ouro" className="h-8 text-xs font-mono bg-background/50"
                  disabled={Boolean(catalog.some((c) => c.id === editingItem.id))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Nome:</label>
                <Input value={editingItem.name || ""} onChange={(e) => set("name", e.target.value)}
                  placeholder="ex: Negociador de Ouro" className="h-8 text-xs bg-background/50" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Raridade:</label>
                <Select value={editingItem.rarity || "comum"} onValueChange={(v: any) => set("rarity", v)}>
                  <SelectTrigger className="h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
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
                  <span className="text-[9px] text-muted-foreground">(do concedente)</span>
                </label>
                <Input type="number" min={0} step={10} value={editingItem.xp_cost ?? 50}
                  onChange={(e) => set("xp_cost", Number(e.target.value))}
                  className="h-8 text-xs font-mono bg-background/50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Ícone Lucide:</label>
                <IconPicker
                  value={editingItem.icon || "Award"}
                  onChange={(val) => set("icon", val)}
                >
                  <Button variant="outline" className="w-full justify-start h-8 text-xs px-2.5 bg-background/50">
                    <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                      <DynamicInsigniaIcon name={editingItem.icon || "Award"} className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span className="truncate">{editingItem.icon || "Award"}</span>
                    </div>
                  </Button>
                </IconPicker>
              </div>
            </div>

            {/* ── SEÇÃO DE CORES ── */}
            <div className="rounded-xl border border-border/50 overflow-hidden">
              {/* Abas */}
              <div className="flex border-b border-border/50 bg-secondary/20">
                {([
                  { id: "bg", label: "Fundo", color: editingItem.bg_color },
                  { id: "border", label: "Borda", color: editingItem.border_color },
                  { id: "icon", label: "Ícone", color: editingItem.color },
                ] as { id: typeof colorTab; label: string; color?: string | null }[]).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setColorTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold transition-all border-b-2",
                      colorTab === tab.id
                        ? "border-amber-400 text-foreground bg-secondary/40"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Palette className="h-3 w-3" />
                    <span>{tab.label}</span>
                    {tab.color && (
                      <div className="h-2.5 w-2.5 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: tab.color }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Conteúdo da aba */}
              <div className="p-3">
                {colorTab === "bg" && (
                  <ColorPickerField
                    label="Cor de fundo do emblema"
                    value={editingItem.bg_color}
                    onChange={(v) => set("bg_color", v)}
                    placeholder="ex: #1a1a2e ou rgba(139,92,246,0.2)"
                  />
                )}
                {colorTab === "border" && (
                  <ColorPickerField
                    label="Cor da borda do emblema"
                    value={editingItem.border_color}
                    onChange={(v) => set("border_color", v)}
                    placeholder="ex: #8B5CF6"
                  />
                )}
                {colorTab === "icon" && (
                  <ColorPickerField
                    label="Cor do ícone / texto"
                    value={editingItem.color}
                    onChange={(v) => set("color", v)}
                    placeholder="ex: #F8FAFC"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Descrição:</label>
              <Textarea value={editingItem.description || ""} onChange={(e) => set("description", e.target.value)}
                placeholder="Descreva o que o membro realizou para merecer este distintivo..."
                rows={2} className="text-xs bg-background/50 resize-none" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
              <Button type="button" variant="outline" size="sm"
                onClick={() => { setIsEditing(false); setEditingItem(null); }}
                disabled={saveMutation.isPending}>
                Voltar
              </Button>
              <Button type="button" size="sm"
                onClick={() => saveMutation.mutate(editingItem)}
                disabled={saveMutation.isPending || !editingItem.id || !editingItem.name}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1.5">
                {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Salvar no Catálogo
              </Button>
            </div>
          </div>
        ) : (
          /* ── LISTA ── */
          <div className="space-y-2 pt-2">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                Carregando catálogo...
              </div>
            ) : catalog.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                Nenhuma insígnia cadastrada.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {catalog.map((badge) => {
                  const rar = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;
                  const iconStyle = getInsigniaIconStyles(badge);
                  const cardStyle = getInsigniaCardStyles(badge);

                  return (
                    <div
                      key={badge.id}
                      className={cn(
                        "p-3 rounded-xl border bg-secondary/30 flex items-start justify-between gap-3 transition-all",
                        !cardStyle && rar.borderClass
                      )}
                      style={cardStyle}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                            !iconStyle && rar.bgClass,
                            !iconStyle && rar.borderClass,
                            !iconStyle && rar.textClass,
                          )}
                          style={iconStyle}
                        >
                          <DynamicInsigniaIcon name={badge.icon} className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                            {badge.name}
                            {/* Pontinhos de cor personalizada */}
                            {(badge.bg_color || badge.border_color || badge.color) && (
                              <div className="flex items-center gap-0.5">
                                {badge.bg_color && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: badge.bg_color }} />}
                                {badge.border_color && <div className="h-2 w-2 rounded-full border" style={{ borderColor: badge.border_color, backgroundColor: "transparent" }} />}
                                {badge.color && <div className="h-2 w-2 rounded-full" style={{ backgroundColor: badge.color }} />}
                              </div>
                            )}
                          </h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                            {badge.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className={cn("text-[9px] px-1 py-0 uppercase font-bold", rar.textClass, rar.borderClass)}>
                              {rar.label}
                            </Badge>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              {badge.xp_cost > 0 ? `${badge.xp_cost} XP` : "Sem Custo"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canManageCatalog && (
                        <Button type="button" variant="ghost" size="sm"
                          onClick={() => handleOpenEdit(badge)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0">
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
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
