import { useState, useCallback, useMemo, useEffect, Component } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Settings,
  Monitor,
  Menu,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  GripVertical,
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Users,
  Workflow,
  TrendingUp,
  Trophy,
  Target,
  ScrollText,
  ShieldCheck,
  User,
  Landmark,
  Megaphone,
  Info,
  Clock,
  Shield,
  Palette,
  Wrench,
  Lock,
  Bell,
  Volume2,
  Sparkles,
  Sliders,
  CheckCircle2,
  Code2,
  KeyRound,
  Tag,
  Type,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Move,
  FolderTree,
  Sun,
  Contrast,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { playGamerSuccessSound, playGamerOnlineAlertSound } from "@/lib/sound-effects";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useMenuConfig, saveMenuConfig, type MenuItemConfig, type MenuConfig } from "@/hooks/useMenuConfig";
import { usePlatformSettings, savePlatformSettings, DEFAULT_PLATFORM_SETTINGS, type PlatformSettings } from "@/hooks/usePlatformSettings";
import { UserAppearanceSettings } from "@/components/profile/UserAppearanceSettings";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: ConfiguracoesPage,
});

/* ─── Icon map for menu items ─── */
const ICON_MAP: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/movimentacoes": ArrowLeftRight,
  "/vendas": ShoppingCart,
  "/chat": MessageSquare,
  "/estoque": Boxes,
  "/membros": Users,
  "/hierarquia": Workflow,
  "/fundo-caixa": Landmark,
  "/rankings": Trophy,
  "/desempenho": User,
  "/dev/desempenho": TrendingUp,
  "/dev.desempenho": TrendingUp,
  "/metas": Target,
  "/cargos": ShieldCheck,
  "/permissoes": Settings,
  "/avisos": Megaphone,
  "/logs": ScrollText,
  "/perfil": User,
  "/configuracoes": Wrench,
  "/dev/permissoes": KeyRound,
  "/dev/configuracao": Code2,
};

/* ─── Default menu items definition ─── */
const DEFAULT_ITEMS: MenuItemConfig[] = [
  { id: "dashboard", title: "Dashboard", url: "/dashboard", visible: true, category: "Operação", order: 0 },
  { id: "movimentacoes", title: "Movimentações", url: "/movimentacoes", visible: true, category: "Operação", order: 1 },
  { id: "vendas", title: "Vendas", url: "/vendas", visible: true, category: "Operação", order: 2 },
  { id: "chat", title: "Chat da Facção", url: "/chat", visible: true, category: "Operação", order: 3 },
  { id: "estoque", title: "Controle de Estoque", url: "/estoque", visible: true, category: "Gestão", order: 4 },
  { id: "membros", title: "Membros", url: "/membros", visible: true, category: "Gestão", order: 5 },
  { id: "hierarquia", title: "Hierarquia", url: "/hierarquia", visible: true, category: "Gestão", order: 6 },
  { id: "fundo-caixa", title: "Fundo de Caixa", url: "/fundo-caixa", visible: true, category: "Gestão", order: 7 },
  { id: "rankings", title: "Rankings", url: "/rankings", visible: true, category: "Gestão", order: 8 },
  { id: "desempenho", title: "Meu Desempenho", url: "/desempenho", visible: true, category: "Gestão", order: 9 },
  { id: "metas", title: "Metas", url: "/metas", visible: true, category: "Gestão", order: 10 },
  { id: "cargos", title: "Gerenciamento de Cargos", url: "/cargos", visible: true, category: "Gestão", order: 11 },
  { id: "permissoes", title: "Permissões", url: "/permissoes", visible: true, category: "Gestão", order: 12 },
  { id: "avisos", title: "Enviar Avisos", url: "/avisos", visible: true, category: "Gestão", order: 13 },
  { id: "logs", title: "Logs", url: "/logs", visible: true, category: "Gestão", order: 14 },
  { id: "perfil", title: "Meu Perfil", url: "/perfil", visible: true, category: "Gestão", order: 15 },
  { id: "configuracoes", title: "Configurações", url: "/configuracoes", visible: true, category: "Gestão", order: 16 },
];

const CATEGORIES = ["Operação", "Gestão", "Administração"];

/* ─── Platform tab component ─── */
function PlatformTab({ canEdit }: { canEdit: boolean }) {
  const { settings, save, reset } = usePlatformSettings();

  const [formData, setFormData] = useState<PlatformSettings>(() => settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!hasChanges) {
      setFormData(settings);
    }
  }, [settings, hasChanges]);

  const handleChange = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    if (!canEdit) return;
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(settings));
      return updated;
    });
  };

  const handleSave = () => {
    if (!canEdit) {
      toast.error("Você não tem permissão para alterar as configurações da plataforma.");
      return;
    }
    save(formData);
    setHasChanges(false);
    toast.success("Configurações da plataforma salvas com sucesso!");
  };

  const handleReset = () => {
    if (!canEdit) return;
    reset();
    setFormData(DEFAULT_PLATFORM_SETTINGS);
    setHasChanges(false);
    toast.success("Configurações restauradas para o padrão!");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Configurações Gerais & Identidade</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personalize a identidade da facção, parâmetros operacionais e timeouts de presença.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!canEdit}
            className="h-8 text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || !canEdit}
            className="h-8 text-xs gap-1.5 bg-gradient-brand text-primary-foreground font-bold"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Você está em modo de apenas leitura. Fale com um administrador para editar.</span>
        </div>
      )}

      {/* General Information Card */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Identidade da Facção</CardTitle>
              <CardDescription className="text-[0.7rem]">Nome, tag e dados públicos do grupo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome da Facção</Label>
              <Input
                value={formData.factionName}
                onChange={(e) => handleChange("factionName", e.target.value)}
                disabled={!canEdit}
                placeholder="Ex.: Twin Wheels"
                className="h-9 text-xs font-bold bg-secondary/50 border-border/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tag / Sigla</Label>
              <Input
                value={formData.factionTag}
                onChange={(e) => handleChange("factionTag", e.target.value)}
                disabled={!canEdit}
                placeholder="Ex.: [TW]"
                className="h-9 text-xs font-mono font-bold bg-secondary/50 border-border/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Organização</Label>
              <Input
                value={formData.factionType}
                onChange={(e) => handleChange("factionType", e.target.value)}
                disabled={!canEdit}
                placeholder="Ex.: Gestão de Facção — GTA RP"
                className="h-9 text-xs bg-secondary/50 border-border/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Subtítulo / Slogan</Label>
            <Input
              value={formData.slogan}
              onChange={(e) => handleChange("slogan", e.target.value)}
              disabled={!canEdit}
              placeholder="Ex.: Gestão Interna · GTA RP"
              className="h-9 text-xs bg-secondary/50 border-border/60"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Descrição do Grupo</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={!canEdit}
              rows={3}
              placeholder="Descrição curta da organização..."
              className="text-xs bg-secondary/50 border-border/60 leading-relaxed resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Session & Presence Card */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Sessão, Inatividade & Presença</CardTitle>
              <CardDescription className="text-[0.7rem]">Regras de detecção automática de ausência</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Timeout Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Timeout de Inatividade (Status Ausente)</Label>
              <Select
                value={String(formData.idleTimeoutSeconds)}
                onValueChange={(val) => handleChange("idleTimeoutSeconds", Number(val))}
                disabled={!canEdit}
              >
                <SelectTrigger className="h-9 text-xs bg-secondary/50 border-border/60 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="120" className="text-xs">120s (2 minutos — Padrão)</SelectItem>
                  <SelectItem value="300" className="text-xs">300s (5 minutos)</SelectItem>
                  <SelectItem value="600" className="text-xs">600s (10 minutos)</SelectItem>
                  <SelectItem value="900" className="text-xs">900s (15 minutos)</SelectItem>
                  <SelectItem value="1200" className="text-xs">1.200s (20 minutos)</SelectItem>
                  <SelectItem value="1800" className="text-xs">1.800s (30 minutos)</SelectItem>
                  <SelectItem value="2700" className="text-xs">2.700s (45 minutos)</SelectItem>
                  <SelectItem value="3600" className="text-xs">3.600s (1 hora / 60 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Heartbeat Interval */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Frequência de Heartbeat</Label>
              <Select
                value={String(formData.heartbeatSeconds)}
                onValueChange={(val) => handleChange("heartbeatSeconds", Number(val))}
                disabled={!canEdit}
              >
                <SelectTrigger className="h-9 text-xs bg-secondary/50 border-border/60 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="text-xs">10 segundos</SelectItem>
                  <SelectItem value="15" className="text-xs">15 segundos (Padrão)</SelectItem>
                  <SelectItem value="30" className="text-xs">30 segundos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Offline Limit */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Limite Auto-Offline (Sem Resposta)</Label>
              <Select
                value={String(formData.autoOfflineMinutes)}
                onValueChange={(val) => handleChange("autoOfflineMinutes", Number(val))}
                disabled={!canEdit}
              >
                <SelectTrigger className="h-9 text-xs bg-secondary/50 border-border/60 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" className="text-xs">5 minutos</SelectItem>
                  <SelectItem value="10" className="text-xs">10 minutos (Padrão)</SelectItem>
                  <SelectItem value="20" className="text-xs">20 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Rules Card */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Parâmetros Operacionais</CardTitle>
              <CardDescription className="text-[0.7rem]">Regras de movimentação e visibilidade de caixa</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Permitir movimentações sem baú vinculado</p>
              <p className="text-[0.7rem] text-muted-foreground">Permite retirar/dar entrada sem selecionar um baú específico</p>
            </div>
            <Switch
              checked={formData.allowMovementsWithoutBau}
              onCheckedChange={(checked) => handleChange("allowMovementsWithoutBau", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Notificar cadastros pendentes no Dashboard</p>
              <p className="text-[0.7rem] text-muted-foreground">Exibe alerta no topo quando houver membros aguardando aprovação</p>
            </div>
            <Switch
              checked={formData.notifyPendingSignups}
              onCheckedChange={(checked) => handleChange("notifyPendingSignups", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Exibir valor do Fundo de Caixa para Operadores</p>
              <p className="text-[0.7rem] text-muted-foreground">Exibe o total acumulado do caixa para membros de nível operador</p>
            </div>
            <Switch
              checked={formData.showConsolidatedCashToOperators}
              onCheckedChange={(checked) => handleChange("showConsolidatedCashToOperators", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Menu tab component ─── */
function MenuTab({ canEdit }: { canEdit: boolean }) {
  const { config, save, reset } = useMenuConfig();

  // Categories state
  const [categories, setCategories] = useState<string[]>(() => {
    if (config?.categories && Array.isArray(config.categories) && config.categories.length > 0) {
      return config.categories;
    }
    return ["Operação", "Gestão", "Administração"];
  });

  const [newCatName, setNewCatName] = useState("");
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatText, setEditingCatText] = useState("");

  // Items state
  const [items, setItems] = useState<MenuItemConfig[]>(() => {
    try {
      if (config && Array.isArray(config.items) && config.items.length > 0) {
        const savedMap = new Map<string, MenuItemConfig>();
        config.items.forEach((item) => {
          if (item && typeof item === "object" && item.id) {
            savedMap.set(item.id, item);
          }
        });

        const merged = DEFAULT_ITEMS.map((def, defaultIdx) => {
          const saved = savedMap.get(def.id);
          if (!saved) return def;
          return {
            id: def.id,
            title: saved.title || def.title,
            url: saved.url || def.url,
            visible: typeof saved.visible === "boolean" ? saved.visible : def.visible,
            category: saved.category || def.category,
            order: typeof saved.order === "number" ? saved.order : defaultIdx,
          };
        });

        return merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    } catch (e) {
      console.error("Error parsing menu config:", e);
    }
    return [...DEFAULT_ITEMS];
  });

  // Sync state when config finishes fetching remotely from Supabase
  useEffect(() => {
    if (config?.categories && Array.isArray(config.categories) && config.categories.length > 0) {
      setCategories(config.categories);
    }
    if (config?.items && Array.isArray(config.items) && config.items.length > 0) {
      const savedMap = new Map<string, MenuItemConfig>();
      config.items.forEach((item) => {
        if (item && typeof item === "object" && item.id) {
          savedMap.set(item.id, item);
        }
      });

      const merged = DEFAULT_ITEMS.map((def, defaultIdx) => {
        const saved = savedMap.get(def.id);
        if (!saved) return def;
        return {
          id: def.id,
          title: saved.title || def.title,
          url: saved.url || def.url,
          visible: typeof saved.visible === "boolean" ? saved.visible : def.visible,
          category: saved.category || def.category,
          order: typeof saved.order === "number" ? saved.order : defaultIdx,
        };
      });

      setItems(merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }
  }, [config]);

  // Items Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Helper to update state and save config globally to Supabase + LocalStorage
  const persist = useCallback(
    (newCats: string[], newItems: MenuItemConfig[]) => {
      setCategories(newCats);
      setItems(newItems);
      save({ categories: newCats, items: newItems });
    },
    [save]
  );

  /* ─── Category Handlers ─── */
  const handleAddCategory = () => {
    if (!canEdit || !newCatName.trim()) return;
    const cat = newCatName.trim();
    if (categories.includes(cat)) {
      toast.error("Esta categoria já existe!");
      return;
    }
    const nextCats = [...categories, cat];
    setNewCatName("");
    persist(nextCats, items);
    toast.success(`Categoria "${cat}" criada com sucesso!`);
  };

  const handleStartEditCategory = (index: number) => {
    if (!canEdit) return;
    setEditingCatIndex(index);
    setEditingCatText(categories[index] || "");
  };

  const handleSaveEditCategory = (index: number) => {
    if (!canEdit) return;
    const newName = editingCatText.trim();
    if (!newName) {
      setEditingCatIndex(null);
      return;
    }
    const oldName = categories[index];
    if (newName === oldName) {
      setEditingCatIndex(null);
      return;
    }

    const nextCats = [...categories];
    nextCats[index] = newName;

    // Update category name in items that used the old category name
    const nextItems = items.map((i) => (i.category === oldName ? { ...i, category: newName } : i));

    setEditingCatIndex(null);
    persist(nextCats, nextItems);
    toast.success(`Categoria alterada para "${newName}"!`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (!canEdit) return;
    if (categories.length <= 1) {
      toast.error("Você deve ter pelo menos 1 categoria no menu!");
      return;
    }

    const nextCats = categories.filter((c) => c !== catToDelete);
    const fallbackCat = nextCats[0] || "Gestão";

    // Move items in deleted category to fallback category
    const nextItems = items.map((i) => (i.category === catToDelete ? { ...i, category: fallbackCat } : i));

    persist(nextCats, nextItems);
    toast.success(`Categoria "${catToDelete}" removida! Itens movidos para "${fallbackCat}".`);
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    if (!canEdit) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const nextCats = [...categories];
    [nextCats[index], nextCats[targetIndex]] = [nextCats[targetIndex], nextCats[index]];

    persist(nextCats, items);
    toast.success("Ordem das categorias atualizada!");
  };

  // Category Drag and Drop state
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [dragOverCatIdx, setDragOverCatIdx] = useState<number | null>(null);

  const handleCatDragStart = (e: React.DragEvent, index: number) => {
    if (!canEdit) return;
    setDraggedCatIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `cat-${index}`);
  };

  const handleCatDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCatIdx === null || draggedCatIdx === index) return;
    setDragOverCatIdx(index);
  };

  const handleCatDragLeave = () => {
    setDragOverCatIdx(null);
  };

  const handleCatDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCatIdx === null || draggedCatIdx === targetIndex) {
      setDraggedCatIdx(null);
      setDragOverCatIdx(null);
      return;
    }

    const nextCats = [...categories];
    const [movedCat] = nextCats.splice(draggedCatIdx, 1);
    nextCats.splice(targetIndex, 0, movedCat);

    persist(nextCats, items);
    setDraggedCatIdx(null);
    setDragOverCatIdx(null);
    toast.success(`Categoria "${movedCat}" reordenada!`);
  };

  /* ─── Item Handlers ─── */
  const updateItem = useCallback(
    (id: string, updates: Partial<MenuItemConfig>) => {
      if (!canEdit) return;
      const nextItems = items.map((item) => (item.id === id ? { ...item, ...updates } : item));
      persist(categories, nextItems);
    },
    [canEdit, categories, items, persist]
  );

  const moveItem = useCallback(
    (id: string, direction: "up" | "down") => {
      if (!canEdit) return;
      const idx = items.findIndex((i) => i.id === id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= items.length) return;

      const next = [...items];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      const reordered = next.map((item, i) => ({ ...item, order: i }));
      persist(categories, reordered);
    },
    [canEdit, categories, items, persist]
  );

  const handleReset = useCallback(() => {
    if (!canEdit) return;
    const defaultCats = ["Operação", "Gestão", "Administração"];
    setCategories(defaultCats);
    setItems([...DEFAULT_ITEMS]);
    reset();
    toast.success("Menu restaurado para o padrão!");
  }, [reset, canEdit]);

  /* ─── Drag and Drop Handlers ─── */
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canEdit) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...items];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);
    const updated = reordered.map((item, i) => ({ ...item, order: i }));

    persist(categories, updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
    toast.success(`Item "${movedItem.title}" reordenado!`);
  };

  // Group items by category for preview
  const grouped = useMemo(() => {
    const groups: Record<string, MenuItemConfig[]> = {};
    categories.forEach((cat) => {
      groups[cat] = items.filter((item) => (item.category || "Gestão") === cat);
    });
    // Include items from missing categories
    items.forEach((item) => {
      const cat = item.category || "Gestão";
      if (!groups[cat]) groups[cat] = [item];
    });
    return groups;
  }, [categories, items]);

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Personalização do Menu Lateral</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Arraste as categorias ou os cards para reordenar e veja as alterações em tempo real no menu.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!canEdit}
            className="h-8 text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] gap-1 py-1 px-2.5">
            <CheckCircle2 className="h-3 w-3" />
            Sincronizado ao vivo
          </Badge>
        </div>
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Você está em modo de apenas leitura. Fale com um administrador para obter a permissão <strong>Gerenciar Aba Menu</strong>.</span>
        </div>
      )}

      {/* Category Management Section */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Categorias do Menu (Arraste para Reordenar)</CardTitle>
                <CardDescription className="text-[0.7rem]">
                  Crie, edite, apague e arraste os cards para alterar a ordem das categorias
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono gap-1 border-primary/30 text-primary">
              <Move className="h-3 w-3" /> Drag & Drop Ativo ({categories.length})
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* List of categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat, idx) => {
              const isEditing = editingCatIndex === idx;
              const itemCount = items.filter((i) => (i.category || "Gestão") === cat).length;
              const isDraggingCat = draggedCatIdx === idx;
              const isOverCat = dragOverCatIdx === idx;

              return (
                <div
                  key={cat}
                  draggable={canEdit && !isEditing}
                  onDragStart={(e) => handleCatDragStart(e, idx)}
                  onDragOver={(e) => handleCatDragOver(e, idx)}
                  onDragLeave={handleCatDragLeave}
                  onDrop={(e) => handleCatDrop(e, idx)}
                  className={cn(
                    "flex items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/50 transition-all",
                    canEdit && !isEditing && "cursor-grab active:cursor-grabbing hover:border-primary/40",
                    isDraggingCat && "opacity-30 scale-95 border-dashed border-primary",
                    isOverCat && "border-primary bg-primary/10 shadow-lg scale-[1.01]"
                  )}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <Input
                        value={editingCatText}
                        onChange={(e) => setEditingCatText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEditCategory(idx)}
                        autoFocus
                        className="h-7 text-xs bg-background font-bold"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEditCategory(idx)}
                        className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCatIndex(null)}
                        className="h-7 w-7 p-0 text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground/60 hover:text-primary cursor-grab shrink-0" />
                        <Badge variant="secondary" className="text-[9px] font-mono shrink-0">
                          #{idx + 1}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{cat}</p>
                          <p className="text-[0.65rem] text-muted-foreground">{itemCount} itens vinculados</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, "up")}
                          disabled={idx === 0 || !canEdit}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Mover categoria para cima"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, "down")}
                          disabled={idx === categories.length - 1 || !canEdit}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Mover categoria para baixo"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(idx)}
                          disabled={!canEdit}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary disabled:opacity-20"
                          title="Editar nome da categoria"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          disabled={!canEdit}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive disabled:opacity-20"
                          title="Excluir categoria"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Category Form */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="Nome da nova categoria..."
              disabled={!canEdit}
              className="h-9 text-xs bg-secondary/50 border-border/60 max-w-sm"
            />
            <Button
              size="sm"
              onClick={handleAddCategory}
              disabled={!canEdit || !newCatName.trim()}
              className="h-9 text-xs gap-1.5 bg-primary text-primary-foreground font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              Criar Categoria
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Menu Items Editor - Grouped by Category */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
                <Menu className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Itens do Menu Agrupados por Categoria</h4>
                <p className="text-[0.7rem] text-muted-foreground">
                  {items.length} itens no total · {items.filter((i) => i.visible).length} visíveis na navegação
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
              <Move className="h-3 w-3" /> Arraste para Reordenar
            </Badge>
          </div>

          {categories.map((cat) => {
            const catItems = items
              .filter((i) => (i.category || "Gestão") === cat)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return (
              <Card key={cat} className="surface-card border-border/60">
                <CardHeader className="pb-2 pt-3 px-4 border-b border-border/40 bg-secondary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4 text-primary" />
                      <CardTitle className="text-xs font-bold text-foreground">
                        Categoria: <span className="text-primary font-extrabold">{cat}</span>
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                      {catItems.length} {catItems.length === 1 ? "item" : "itens"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-3">
                  {catItems.length === 0 ? (
                    <p className="text-[0.75rem] text-muted-foreground italic py-3 text-center">
                      Nenhum item nesta categoria. Altere a categoria de um item abaixo para trazê-lo para cá.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {catItems.map((item) => {
                        const globalIdx = items.findIndex((i) => i.id === item.id);
                        const Icon = ICON_MAP[item.url] || Settings;
                        const title = item.title || DEFAULT_ITEMS.find((d) => d.id === item.id)?.title || item.id;
                        const isDragging = draggedIndex === globalIdx;
                        const isDragOver = dragOverIndex === globalIdx;

                        return (
                          <div
                            key={item.id}
                            draggable={canEdit}
                            onDragStart={(e) => handleDragStart(e, globalIdx)}
                            onDragOver={(e) => handleDragOver(e, globalIdx)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, globalIdx)}
                            className={cn(
                              "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing",
                              item.visible
                                ? "bg-card/40 border-border/60 shadow-sm hover:border-primary/40"
                                : "bg-secondary/20 border-border/30 opacity-50",
                              isDragging && "opacity-30 scale-95 border-dashed border-primary",
                              isDragOver && "border-primary bg-primary/10 shadow-lg scale-[1.01]"
                            )}
                          >
                            {/* Left Group: Controls + Icon + Title */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Drag Handle & Arrows */}
                              <div className="flex flex-col items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveItem(item.id, "up")}
                                  disabled={globalIdx === 0 || !canEdit}
                                  className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Mover para cima"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <GripVertical className="h-4 w-4 text-muted-foreground/60 hover:text-primary cursor-grab" />
                                <button
                                  type="button"
                                  onClick={() => moveItem(item.id, "down")}
                                  disabled={globalIdx === items.length - 1 || !canEdit}
                                  className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Mover para baixo"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Icon */}
                              <div className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 transition-colors shadow-sm",
                                item.visible
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "bg-secondary/50 border-border/40 text-muted-foreground"
                              )}>
                                <Icon className="h-4 w-4" />
                              </div>

                              {/* Title & URL */}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-extrabold text-foreground truncate leading-snug">
                                  {title}
                                </p>
                                <p className="text-[0.65rem] text-muted-foreground font-mono truncate mt-0.5">
                                  {item.url}
                                </p>
                              </div>
                            </div>

                            {/* Right Group: Category + Visibility */}
                            <div className="flex items-center gap-3 shrink-0 pl-2">
                              {/* Category Select */}
                              <Select
                                value={item.category}
                                onValueChange={(val) => updateItem(item.id, { category: val })}
                                disabled={!canEdit}
                              >
                                <SelectTrigger className="h-7 w-28 text-[10px] font-bold border-border/60 bg-secondary/40 shrink-0">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((c) => (
                                    <SelectItem key={c} value={c} className="text-xs font-medium">
                                      {c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Separator orientation="vertical" className="h-6" />

                              {/* Visibility Switch */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {item.visible ? (
                                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <Switch
                                  checked={item.visible}
                                  onCheckedChange={(checked) => updateItem(item.id, { visible: checked })}
                                  disabled={!canEdit}
                                  className="data-[state=checked]:bg-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <Card className="surface-card sticky top-20">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/30 text-accent">
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Preview do Menu</CardTitle>
                  <CardDescription className="text-[0.7rem]">Visualização em tempo real</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="rounded-xl bg-sidebar border border-sidebar-border p-3 space-y-3">
                {categories.map((cat) => {
                  const catItems = grouped[cat] || [];
                  const visibleItems = catItems.filter((i) => i.visible);
                  if (visibleItems.length === 0) return null;
                  return (
                    <div key={cat}>
                      <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5 px-1">
                        {cat}
                      </p>
                      <div className="space-y-0.5">
                        {visibleItems.map((item) => {
                          const Icon = ICON_MAP[item.url] || Settings;
                          const title = item.title || DEFAULT_ITEMS.find((d) => d.id === item.id)?.title || item.id;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                              <span className="truncate font-medium">{title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ─── Notifications & Notices Tab Component ─── */
function NotificationsTab({ canEdit }: { canEdit: boolean }) {
  const { settings, save } = usePlatformSettings();
  const [formData, setFormData] = useState<PlatformSettings>(() => settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!hasChanges) {
      setFormData(settings);
    }
  }, [settings, hasChanges]);

  const handleChange = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    if (!canEdit) return;
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(updated) !== JSON.stringify(settings));
      return updated;
    });
  };

  const handleSave = () => {
    if (!canEdit) return;
    save(formData);
    setHasChanges(false);
    toast.success("Configurações de notificações salvas com sucesso!");
    if (formData.soundEffectsEnabled) {
      playGamerSuccessSound(formData.soundVolume || 60);
    }
  };

  const handleTestOperationSound = () => {
    playGamerSuccessSound(formData.soundVolume || 60);
    toast.info("Testando efeito sonoro de operação (Web Audio API)", {
      description: `Volume ajustado em ${formData.soundVolume || 60}%`,
    });
  };

  const handleTestOnlineAlertSound = () => {
    playGamerOnlineAlertSound(formData.soundVolume || 60);
    toast.success("Testando alerta sonoro de membro online", {
      description: `Volume ajustado em ${formData.soundVolume || 60}%`,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Sons & Alertas de Notificações</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure o sistema profissional de áudio gamer e exibição de avisos da facção.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || !canEdit}
          className="h-8 text-xs gap-1.5 bg-gradient-brand text-primary-foreground font-bold shrink-0"
        >
          <Save className="h-3.5 w-3.5" />
          Salvar Alterações
        </Button>
      </div>

      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Efeitos Sonoros & Áudio Gamer</CardTitle>
              <CardDescription className="text-[0.7rem]">
                Sintetizador Web Audio API de alta fidelidade para lançamentos e presença
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Efeitos sonoros ao registrar operações</p>
              <p className="text-[0.7rem] text-muted-foreground">Bipe sci-fi ao efetuar vendas, saídas e movimentações</p>
            </div>
            <Switch
              checked={formData.soundEffectsEnabled}
              onCheckedChange={(checked) => handleChange("soundEffectsEnabled", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Alerta sonoro tático de entrada online</p>
              <p className="text-[0.7rem] text-muted-foreground">Tocar aviso de radar tático quando um membro entrar online</p>
            </div>
            <Switch
              checked={formData.onlineAlertEnabled}
              onCheckedChange={(checked) => handleChange("onlineAlertEnabled", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {/* Volume Control */}
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Volume Mestre do Efeito Sonoro ({formData.soundVolume || 60}%)</Label>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                Web Audio Synth
              </Badge>
            </div>
            <Slider
              value={[formData.soundVolume ?? 60]}
              onValueChange={(val) => handleChange("soundVolume", val[0] ?? 60)}
              min={0}
              max={100}
              step={5}
              disabled={!canEdit}
              className="py-1"
            />
          </div>

          {/* Audio Test Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestOperationSound}
              className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Testar Som de Operação
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestOnlineAlertSound}
              className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Testar Alerta de Membro Online
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Avisos & Comunicados</CardTitle>
              <CardDescription className="text-[0.7rem]">Banners e retenção de avisos da facção</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground">Exibir Banner de Avisos no topo do Dashboard</p>
              <p className="text-[0.7rem] text-muted-foreground">Exibe comunicados em destaque na tela inicial</p>
            </div>
            <Switch
              checked={formData.showAnnouncementBanner}
              onCheckedChange={(checked) => handleChange("showAnnouncementBanner", checked)}
              disabled={!canEdit}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Ocultar avisos mais antigos que</Label>
            <Select
              value={String(formData.hideOldAnnouncementsDays)}
              onValueChange={(val) => handleChange("hideOldAnnouncementsDays", Number(val))}
              disabled={!canEdit}
            >
              <SelectTrigger className="h-9 text-xs bg-secondary/50 border-border/60 font-bold max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3" className="text-xs">3 dias</SelectItem>
                <SelectItem value="7" className="text-xs">7 dias (Padrão)</SelectItem>
                <SelectItem value="15" className="text-xs">15 dias</SelectItem>
                <SelectItem value="30" className="text-xs">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Appearance Tab Component ─── */
function AppearanceTab({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="space-y-6">
      <UserAppearanceSettings />
    </div>
  );
}
class MenuTabErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, errorMsg: string }> {
  override state = { hasError: false, errorMsg: "" };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMsg: error?.message || String(error) };
  }

  override componentDidCatch(error: any, errorInfo: any) {
    console.error("Error rendering MenuTab:", error, errorInfo);
    try {
      localStorage.removeItem("tw_menu_config");
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <p className="text-sm font-bold">Ocorreu um erro ao carregar as configurações do menu.</p>
          <p className="text-xs text-muted-foreground">Suas configurações de menu foram restauradas para o padrão para evitar falhas.</p>
          <div className="text-left bg-black/50 p-3 rounded-lg overflow-auto max-h-32 text-[10px] font-mono text-red-400">
            {this.state.errorMsg}
          </div>
          <Button
            size="sm"
            onClick={() => {
              try {
                localStorage.removeItem("tw_menu_config");
              } catch {}
              window.location.reload();
            }}
            className="text-xs bg-gradient-brand text-primary-foreground font-bold"
          >
            Restaurar e Recarregar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Main settings page ─── */
function ConfiguracoesPage() {
  const { level, hasPermission } = useAuth();

  // Allow editing for leaders, co-leaders, managers, officers, developers, or anyone with role/permission management permissions
  const isLeaderOrAdmin =
    level === "desenvolvedor" ||
    level === "01" ||
    level === "02" ||
    level === "gerente";

  const canManagePlatform =
    isLeaderOrAdmin ||
    hasPermission("manage_permissions") ||
    hasPermission("manage_roles") ||
    hasPermission("manage_platform_settings");

  const canManageMenu =
    isLeaderOrAdmin ||
    hasPermission("manage_permissions") ||
    hasPermission("manage_roles") ||
    hasPermission("manage_menu_settings");

  const canAccess = canManagePlatform || canManageMenu;

  if (!canAccess) return <NoAccess />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Configurações"
        description="Painel completo de controle da plataforma, parâmetros operacionais e personalização do menu."
      />

      <Tabs defaultValue="plataforma" className="space-y-6">
        <TabsList className="bg-secondary/60 border border-border/50 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger
            value="plataforma"
            className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-lg px-4 py-2"
          >
            <Monitor className="h-3.5 w-3.5" />
            Plataforma
          </TabsTrigger>
          <TabsTrigger
            value="menu"
            className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-lg px-4 py-2"
          >
            <Menu className="h-3.5 w-3.5" />
            Menu Lateral
          </TabsTrigger>
          <TabsTrigger
            value="notificacoes"
            className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-lg px-4 py-2"
          >
            <Bell className="h-3.5 w-3.5" />
            Notificações
          </TabsTrigger>
          <TabsTrigger
            value="aparencia"
            className="gap-1.5 text-xs font-bold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30 rounded-lg px-4 py-2"
          >
            <Palette className="h-3.5 w-3.5" />
            Aparência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plataforma">
          <PlatformTab canEdit={canManagePlatform} />
        </TabsContent>

        <TabsContent value="menu">
          <MenuTabErrorBoundary>
            <MenuTab canEdit={canManageMenu} />
          </MenuTabErrorBoundary>
        </TabsContent>

        <TabsContent value="notificacoes">
          <NotificationsTab canEdit={canManagePlatform} />
        </TabsContent>

        <TabsContent value="aparencia">
          <AppearanceTab canEdit={canManagePlatform} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
