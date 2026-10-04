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
  Layers,
  SunMedium,
  Gem,
  Hexagon,
  Square,
  Star,
  CircleDot,
  CheckCircle2,
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
  type InsigniaShape3D,
  type InsigniaMaterial3D,
  type InsigniaBorderStyle3D,
  type InsigniaGlossEffect,
} from "@/services/gamificationService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

import {
  DynamicInsigniaIcon,
  InsigniaEmblem,
  MATERIAL_PRESETS,
  RARITY_TO_MATERIAL,
  RARITY_TO_SHAPE,
} from "@/components/gamification/InsigniaIcon";
import { IconPicker } from "@/components/dev/IconPicker";

/** Paleta de presets de cor */
export const COLOR_PALETTE = [
  "#38BDF8", // Azul Céu / Verified
  "#0284C7", // Azul Royal
  "#8B5CF6", // Roxo
  "#6366F1", // Índigo
  "#3B82F6", // Azul
  "#06B6D4", // Ciano
  "#10B981", // Esmeralda
  "#22C55E", // Verde
  "#EAB308", // Amarelo
  "#F59E0B", // Âmbar / Ouro
  "#F97316", // Laranja
  "#EF4444", // Vermelho
  "#EC4899", // Rosa
  "#F472B6", // Rosa Claro
  "#B45309", // Bronze
  "#78716C", // Pedra
  "#94A3B8", // Prata
  "#F8FAFC", // Branco
];

// ─── OPÇÕES VISUAIS 3D ───────────────────────────────────────────────────────

export const SHAPE_OPTIONS: { id: InsigniaShape3D; label: string; desc: string; icon: string }[] = [
  { id: "rosette", label: "Roseta Verified 3D", desc: "Selo Oficial com 16 pontas curvadas (Estilo Referência)", icon: "🏵️" },
  { id: "medal", label: "Medalha Circular 3D", desc: "Disco de condecoração clássico com relevo", icon: "🎖️" },
  { id: "shield", label: "Escudo Nobre 3D", desc: "Brasão tático e de proteção de facção", icon: "🛡️" },
  { id: "diamond", label: "Diamante Lapidado", desc: "Joia geométrica 3D com facetas de cristal", icon: "💎" },
  { id: "hexagon", label: "Hexágono Tático", desc: "Design moderno com bordas chanfradas", icon: "⬡" },
  { id: "octagon", label: "Octógono Imperial", desc: "Selo de honra de alta autoridade", icon: "🛑" },
  { id: "square", label: "Broche Chanfrado", desc: "Distintivo quadrado arredondado 3D", icon: "⏹️" },
  { id: "star", label: "Estrela de Honra", desc: "Condecoração militar e honorífica", icon: "⭐" },
];

export const MATERIAL_OPTIONS: { id: InsigniaMaterial3D; label: string; desc: string; gradient: string }[] = [
  { id: "safira_blue", label: "Safira Azul 3D (Verified)", desc: "Azul elétrico com reflexo de vidro cristalino", gradient: "linear-gradient(135deg, #38bdf8 0%, #0284c7 50%, #0369a1 100%)" },
  { id: "gold_24k", label: "Ouro Imperial 24k", desc: "Dourado radiante com brilho metálico nobre", gradient: "linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #78350f 100%)" },
  { id: "ruby_red", label: "Rubi Carmesim 3D", desc: "Vermelho rubi de alto impacto e prestígio", gradient: "linear-gradient(135deg, #fda4af 0%, #f43f5e 50%, #881337 100%)" },
  { id: "platinum_chrome", label: "Platina & Cromo 3D", desc: "Prata espelhada com acabamento metálico", gradient: "linear-gradient(135deg, #ffffff 0%, #94a3b8 50%, #1e293b 100%)" },
  { id: "amethyst_purple", label: "Ametista Cósmica 3D", desc: "Púrpura místico com energia cósmica", gradient: "linear-gradient(135deg, #e9d5ff 0%, #a855f7 50%, #4c1d95 100%)" },
  { id: "emerald_green", label: "Esmeralda Real 3D", desc: "Verde esmeralda cintilante e sofisticado", gradient: "linear-gradient(135deg, #a7f3d0 0%, #10b981 50%, #064e3b 100%)" },
  { id: "obsidian_black", label: "Obsidiana & Ouro Negro", desc: "Preto luxo acetinado com detalhes dourados", gradient: "linear-gradient(135deg, #334155 0%, #0f172a 60%, #020617 100%)" },
  { id: "cyber_neon", label: "Cyber Neon Furta-cor", desc: "Efeito holográfico prismático futurista", gradient: "linear-gradient(135deg, #38bdf8 0%, #ec4899 50%, #7c3aed 100%)" },
  { id: "custom", label: "Cores Personalizadas", desc: "Paleta customizada pelo criador", gradient: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" },
];

export const BORDER_OPTIONS: { id: InsigniaBorderStyle3D; label: string; desc: string }[] = [
  { id: "metallic_chamfer", label: "Chanfro Metálico 3D", desc: "Borda chanfrada com iluminação bidirecional" },
  { id: "gold_trim", label: "Moldura Ouro 24k", desc: "Contorno em ouro polido de alta patente" },
  { id: "silver_trim", label: "Moldura Prata Espelhada", desc: "Contorno cromado reflexivo" },
  { id: "neon_glow", label: "Borda Neon Glow", desc: "Aura luminosa vibrante ao redor do emblema" },
  { id: "glass_rim", label: "Borda de Vidro Cristal", desc: "Acabamento translúcido de acrílico" },
  { id: "none", label: "Sem Moldura Externa", desc: "Superfície 3D pura e limpa" },
];

export const GLOSS_OPTIONS: { id: InsigniaGlossEffect; label: string; desc: string }[] = [
  { id: "ultra_glass", label: "Ultra Glass (Arco Verified)", desc: "Arco especular de vidro na metade superior (Idêntico à referência)" },
  { id: "specular_sheen", label: "Sheen Esmaltado Metálico", desc: "Faixa diagonal de reflexo metálico" },
  { id: "radial_dome", label: "Domo Convexo 3D", desc: "Esfera convexa com foco de luz central" },
  { id: "holographic", label: "Reflexo Holográfico", desc: "Brilho furta-cor sutil ao movimentar" },
];

// ─── HELPERS DE ESTILO COMPATÍVEIS ───────────────────────────────────────────

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
            className="text-[10px] text-muted-foreground hover:text-rose-400 transition-colors flex items-center gap-1"
            title="Limpar e usar padrão"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Resetar</span>
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
              "h-5 w-5 rounded-md border-2 transition-all hover:scale-125 shrink-0 shadow-xs",
              value === c ? "border-white scale-125 ring-2 ring-white/40" : "border-transparent"
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        {/* Nenhuma cor */}
        <button
          type="button"
          title="Sem cor personalizada (usar material)"
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
          value={value || "#38BDF8"}
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
            className="h-7 w-7 rounded-md border border-border/50 shrink-0 shadow-xs"
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
  const [editorSection, setEditorSection] = useState<"visual3d" | "info" | "colors">("visual3d");
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
        shape_3d: item.shape_3d || "rosette",
        material_3d: item.material_3d || "safira_blue",
        border_style_3d: item.border_style_3d || "metallic_chamfer",
        gloss_effect: item.gloss_effect || "ultra_glass",
      });
    },
    onSuccess: () => {
      toast.success("Insígnia 3D salva e atualizada com sucesso!");
      void queryClient.invalidateQueries({ queryKey: ["insignias_catalog"] });
      void queryClient.invalidateQueries({ queryKey: ["member_insignias"] });
      void queryClient.invalidateQueries({ queryKey: ["gamification_ranking"] });
      setIsEditing(false);
      setEditingItem(null);
    },
    onError: (err: any) => toast.error(err.message || "Falha ao salvar insígnia."),
  });

  const handleOpenNew = () => {
    setEditingItem({
      id: "",
      name: "",
      icon: "CheckCircle2",
      description: "",
      rarity: "raro",
      xp_cost: 50,
      category: "geral",
      active: true,
      color: null,
      bg_color: null,
      border_color: null,
      shape_3d: "rosette",
      material_3d: "safira_blue",
      border_style_3d: "metallic_chamfer",
      gloss_effect: "ultra_glass",
    });
    setEditorSection("visual3d");
    setIsEditing(true);
  };

  const handleOpenEdit = (item: InsigniaItem) => {
    setEditingItem({
      ...item,
      shape_3d: item.shape_3d || RARITY_TO_SHAPE[item.rarity] || "rosette",
      material_3d: item.material_3d || RARITY_TO_MATERIAL[item.rarity] || "safira_blue",
      border_style_3d: item.border_style_3d || "metallic_chamfer",
      gloss_effect: item.gloss_effect || "ultra_glass",
    });
    setEditorSection("visual3d");
    setIsEditing(true);
  };

  const set = (key: keyof InsigniaItem, val: any) =>
    setEditingItem((prev) => (prev ? { ...prev, [key]: val } : prev));

  // Preview Info
  const currentRarity = (editingItem?.rarity as InsigniaRarity) || "comum";
  const rarity = RARITY_CONFIG[currentRarity] || RARITY_CONFIG.comum;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto surface-card border-border/80">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-purple-500/20 text-sky-400 border border-sky-500/30 shadow-inner">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                  <span>Catálogo de Insígnias &amp; Emblemas 3D</span>
                  <Badge variant="outline" className="text-[9px] bg-sky-500/10 text-sky-400 border-sky-500/30 font-bold uppercase">
                    3D Engine HD
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Crie condecorações com acabamento 3D realista, rosetas verified, materiais preciosos e reflexos de vidro.
                </DialogDescription>
              </div>
            </div>
            {!isEditing && canManageCatalog && (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenNew}
                className="h-8 text-xs font-bold gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nova Insígnia 3D</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {isEditing && editingItem ? (
          <div className="space-y-4 pt-2 border-t border-border/60">

            {/* ── PREVIEW AO VIVO 3D EM TEMPO REAL ── */}
            <div className="p-4 rounded-3xl bg-gradient-to-b from-secondary/40 via-background/60 to-secondary/30 border border-border/80 shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
                
                {/* Visualização Principal 2XL */}
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center p-3 rounded-2xl bg-black/40 border border-white/10 shadow-2xl backdrop-blur-md">
                    <InsigniaEmblem
                      icon={editingItem.icon || "CheckCircle2"}
                      name={editingItem.name || "Prévia do Emblema"}
                      rarity={editingItem.rarity || "comum"}
                      shape_3d={editingItem.shape_3d}
                      material_3d={editingItem.material_3d}
                      border_style_3d={editingItem.border_style_3d}
                      gloss_effect={editingItem.gloss_effect}
                      color={editingItem.color}
                      bgColor={editingItem.bg_color}
                      borderColor={editingItem.border_color}
                      size="2xl"
                      showStar={true}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-foreground">
                        {editingItem.name || "Nome da Insígnia"}
                      </h3>
                      <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5 border", rarity.borderClass, rarity.bgClass, rarity.textClass)}>
                        {rarity.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm">
                      {editingItem.description || "Sem descrição inserida ainda. Configure os detalhes abaixo."}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                      <span className="text-amber-400 font-bold">
                        {editingItem.xp_cost ? `${editingItem.xp_cost} XP de Concessão` : "Sem Custo de XP"}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sky-300 font-bold">
                        {SHAPE_OPTIONS.find((s) => s.id === editingItem.shape_3d)?.label || "Roseta 3D"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Escala de tamanhos (XS, SM, MD, LG) */}
                <div className="flex flex-col items-center sm:items-end gap-1.5 border-t sm:border-t-0 sm:border-l border-border/60 pt-3 sm:pt-0 sm:pl-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Escalas de Exibição
                  </span>
                  <div className="flex items-center gap-2.5 bg-black/30 p-2 rounded-2xl border border-white/5">
                    {(["xs", "sm", "md", "lg"] as const).map((s) => (
                      <div key={s} className="flex flex-col items-center gap-1">
                        <InsigniaEmblem
                          icon={editingItem.icon || "CheckCircle2"}
                          rarity={editingItem.rarity || "comum"}
                          shape_3d={editingItem.shape_3d}
                          material_3d={editingItem.material_3d}
                          border_style_3d={editingItem.border_style_3d}
                          gloss_effect={editingItem.gloss_effect}
                          color={editingItem.color}
                          bgColor={editingItem.bg_color}
                          borderColor={editingItem.border_color}
                          size={s}
                          showStar={s !== "xs"}
                        />
                        <span className="text-[9px] font-mono text-muted-foreground uppercase">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── NAVEGAÇÃO DE ABAS DE EDIÇÃO ── */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/30 border border-border/60">
              <button
                type="button"
                onClick={() => setEditorSection("visual3d")}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2",
                  editorSection === "visual3d"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Aparência 3D &amp; Formato</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorSection("info")}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2",
                  editorSection === "info"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                )}
              >
                <Award className="h-3.5 w-3.5" />
                <span>Dados &amp; Ícone Lucide</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorSection("colors")}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2",
                  editorSection === "colors"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                )}
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Cores Customizadas</span>
                {(editingItem.color || editingItem.bg_color || editingItem.border_color) && (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            </div>

            {/* ── CONTEÚDO 1: APARÊNCIA 3D & FORMATO ── */}
            {editorSection === "visual3d" && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {/* 1. SELETOR DE FORMATO GEOMÉTRICO */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-sky-400" />
                      <span>Formato Geométrico 3D:</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {SHAPE_OPTIONS.find((s) => s.id === editingItem.shape_3d)?.label}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SHAPE_OPTIONS.map((shape) => {
                      const isSelected = (editingItem.shape_3d || "rosette") === shape.id;
                      return (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => set("shape_3d", shape.id)}
                          className={cn(
                            "p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 relative group",
                            isSelected
                              ? "bg-sky-500/20 border-sky-400 text-sky-200 shadow-md ring-1 ring-sky-400/50"
                              : "bg-secondary/20 border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="text-xl shrink-0 group-hover:scale-125 transition-transform">
                            {shape.icon}
                          </span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{shape.label}</span>
                            <span className="text-[9px] text-muted-foreground line-clamp-1 leading-none mt-0.5">
                              {shape.desc}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 absolute top-2 right-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SELETOR DE MATERIAL & ACABAMENTO */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Gem className="h-3.5 w-3.5 text-amber-400" />
                      <span>Material Precioso &amp; Acabamento 3D:</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {MATERIAL_OPTIONS.find((m) => m.id === (editingItem.material_3d || "safira_blue"))?.label}
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {MATERIAL_OPTIONS.map((mat) => {
                      const isSelected = (editingItem.material_3d || "safira_blue") === mat.id;
                      return (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => set("material_3d", mat.id)}
                          className={cn(
                            "p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2.5 relative",
                            isSelected
                              ? "bg-amber-500/15 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/50"
                              : "bg-secondary/20 border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div
                            className="h-7 w-7 rounded-xl shrink-0 border border-white/20 shadow-inner"
                            style={{ background: mat.gradient }}
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{mat.label}</span>
                            <span className="text-[9px] text-muted-foreground line-clamp-1 leading-none mt-0.5">
                              {mat.desc}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 absolute top-2 right-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. BORDA & BRILHO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Moldura 3D */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-purple-400" />
                      <span>Moldura / Borda 3D:</span>
                    </label>
                    <Select
                      value={editingItem.border_style_3d || "metallic_chamfer"}
                      onValueChange={(val: any) => set("border_style_3d", val)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BORDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            <span className="font-bold">{opt.label}</span> — <span className="text-muted-foreground text-[11px]">{opt.desc}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Efeito de Vidro */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <SunMedium className="h-3.5 w-3.5 text-sky-400" />
                      <span>Efeito de Vidro &amp; Reflexo:</span>
                    </label>
                    <Select
                      value={editingItem.gloss_effect || "ultra_glass"}
                      onValueChange={(val: any) => set("gloss_effect", val)}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GLOSS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            <span className="font-bold">{opt.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* ── CONTEÚDO 2: DADOS & ÍCONE LUCIDE ── */}
            {editorSection === "info" && (
              <div className="space-y-3.5 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Identificador Único (ID):</label>
                    <Input
                      value={editingItem.id || ""}
                      onChange={(e) => set("id", e.target.value)}
                      placeholder="ex: verified_oficial ou mestre_vendas"
                      className="h-8 text-xs font-mono bg-background/50"
                      disabled={Boolean(catalog.some((c) => c.id === editingItem.id))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Nome Oficial da Insígnia:</label>
                    <Input
                      value={editingItem.name || ""}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="ex: Selo Verified Oficial"
                      className="h-8 text-xs font-bold bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Raridade Oficial:</label>
                    <Select value={editingItem.rarity || "comum"} onValueChange={(v: any) => set("rarity", v)}>
                      <SelectTrigger className="h-8 text-xs bg-background/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comum">Comum (Platina)</SelectItem>
                        <SelectItem value="raro">Raro (Safira Azul)</SelectItem>
                        <SelectItem value="epico">Épico (Ametista)</SelectItem>
                        <SelectItem value="lendario">Lendário (Ouro 24k)</SelectItem>
                        <SelectItem value="mitico">Mítico (Rubi Imperial)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span>Custo em XP:</span>
                      <span className="text-[9px] text-muted-foreground">(do concedente)</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={10}
                      value={editingItem.xp_cost ?? 50}
                      onChange={(e) => set("xp_cost", Number(e.target.value))}
                      className="h-8 text-xs font-mono font-bold bg-background/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">Símbolo / Ícone Lucide:</label>
                    <IconPicker
                      value={editingItem.icon || "CheckCircle2"}
                      onChange={(val) => set("icon", val)}
                    >
                      <Button variant="outline" className="w-full justify-start h-8 text-xs px-2.5 bg-background/50">
                        <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                          <DynamicInsigniaIcon name={editingItem.icon || "CheckCircle2"} className="w-3.5 h-3.5 shrink-0 text-primary" />
                          <span className="truncate">{editingItem.icon || "CheckCircle2"}</span>
                        </div>
                      </Button>
                    </IconPicker>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Descrição &amp; Critério de Concessão:</label>
                  <Textarea
                    value={editingItem.description || ""}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Descreva a razão de mérito e honra para receber este emblema..."
                    rows={2}
                    className="text-xs bg-background/50 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── CONTEÚDO 3: CORES CUSTOMIZADAS ── */}
            {editorSection === "colors" && (
              <div className="space-y-3 animate-in fade-in-50 duration-200">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  💡 <strong>Dica:</strong> Por padrão, o emblema 3D calcula sua iluminação realista baseando-se no <strong>Material Precioso</strong>. As cores abaixo são opcionais caso deseje sobrescrever manualmente.
                </div>

                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <div className="flex border-b border-border/50 bg-secondary/20">
                    {([
                      { id: "bg", label: "Fundo 3D", color: editingItem.bg_color },
                      { id: "border", label: "Borda Chanfro", color: editingItem.border_color },
                      { id: "icon", label: "Ícone Central", color: editingItem.color },
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

                  <div className="p-3.5">
                    {colorTab === "bg" && (
                      <ColorPickerField
                        label="Cor Base do Emblema 3D"
                        value={editingItem.bg_color}
                        onChange={(v) => set("bg_color", v)}
                        placeholder="ex: #0284c7 ou #1e1b4b"
                      />
                    )}
                    {colorTab === "border" && (
                      <ColorPickerField
                        label="Cor da Borda / Chanfro"
                        value={editingItem.border_color}
                        onChange={(v) => set("border_color", v)}
                        placeholder="ex: #38bdf8 ou #f59e0b"
                      />
                    )}
                    {colorTab === "icon" && (
                      <ColorPickerField
                        label="Cor do Ícone / Símbolo"
                        value={editingItem.color}
                        onChange={(v) => set("color", v)}
                        placeholder="ex: #ffffff"
                      />
                    )}
                  </div>
                </div>

                {(editingItem.color || editingItem.bg_color || editingItem.border_color) && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingItem({ ...editingItem, color: null, bg_color: null, border_color: null })}
                      className="text-xs text-rose-400 hover:text-rose-300 gap-1.5 h-7"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Limpar Cores e Usar Material Padrão</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── BOTÕES DE AÇÃO ── */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditingItem(null);
                }}
                disabled={saveMutation.isPending}
              >
                Voltar ao Catálogo
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => saveMutation.mutate(editingItem)}
                disabled={saveMutation.isPending || !editingItem.id || !editingItem.name}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black gap-1.5 shadow-md"
              >
                {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Salvar Insígnia 3D no Catálogo
              </Button>
            </div>
          </div>
        ) : (
          /* ── LISTA DE INSÍGNIAS NO CATÁLOGO ── */
          <div className="space-y-3 pt-2">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                Carregando catálogo de insígnias 3D...
              </div>
            ) : catalog.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground border border-dashed rounded-3xl p-6 space-y-2">
                <Award className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="font-bold">Nenhuma insígnia cadastrada no catálogo.</p>
                <p>Clique em "Nova Insígnia 3D" para criar o primeiro emblema oficial.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catalog.map((badge) => {
                  const rar = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;
                  const shapeLabel = SHAPE_OPTIONS.find((s) => s.id === badge.shape_3d)?.label || "Roseta 3D";
                  const matLabel = MATERIAL_OPTIONS.find((m) => m.id === badge.material_3d)?.label || "Safira Azul";

                  return (
                    <div
                      key={badge.id}
                      className="p-3.5 rounded-3xl border border-border/70 bg-secondary/20 hover:bg-secondary/35 backdrop-blur-md flex items-start justify-between gap-3.5 transition-all shadow-sm hover:shadow-md group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Emblema 3D Realista */}
                        <div className="shrink-0 pt-0.5">
                          <InsigniaEmblem
                            icon={badge.icon}
                            name={badge.name}
                            rarity={badge.rarity}
                            shape_3d={badge.shape_3d}
                            material_3d={badge.material_3d}
                            border_style_3d={badge.border_style_3d}
                            gloss_effect={badge.gloss_effect}
                            color={badge.color}
                            bgColor={badge.bg_color}
                            borderColor={badge.border_color}
                            size="md"
                            showStar={true}
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-foreground truncate flex items-center gap-1.5">
                            <span>{badge.name}</span>
                          </h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                            {badge.description || "Sem descrição."}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn("text-[9px] px-1.5 py-0 uppercase font-black", rar.textClass, rar.borderClass, rar.bgClass)}
                            >
                              {rar.label}
                            </Badge>
                            <span className="text-[10px] font-mono text-amber-400 font-bold">
                              {badge.xp_cost > 0 ? `${badge.xp_cost} XP` : "Sem Custo"}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-mono bg-background/50 px-1.5 py-0.5 rounded-md border border-border/40">
                              {shapeLabel.split(" ")[0]}
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
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-400 shrink-0 rounded-xl"
                          title="Editar Insígnia 3D"
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
