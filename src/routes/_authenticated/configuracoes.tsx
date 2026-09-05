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
  CalendarOff,
  LifeBuoy,
  Search,
  ExternalLink,
  Globe,
  Bookmark,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AVAILABLE_MENU_ICONS, resolveMenuIcon, type MenuIconDef } from "@/lib/menuIcons";
import { playGamerSuccessSound, playGamerOnlineAlertSound } from "@/lib/sound-effects";
import { chatSound } from "@/lib/chatSound";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  useMenuConfig,
  saveMenuConfig,
  syncMenuConfig,
  DEFAULT_MENU_CATEGORIES,
  DEFAULT_MENU_ITEMS,
  type MenuItemConfig,
  type MenuConfig,
} from "@/hooks/useMenuConfig";
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
  "/tickets": LifeBuoy,
  "/estoque": Boxes,
  "/membros": Users,
  "/hierarquia": Workflow,
  "/fundo-caixa": Landmark,
  "/ausencias": CalendarOff,
  "/rankings": Trophy,
  "/desempenho": User,
  "/dev/desempenho": TrendingUp,
  "/dev.desempenho": TrendingUp,
  "/metas": Target,
  "/cargos": ShieldCheck,
  "/permissoes": Settings,
  "/avisos": Megaphone,
  "/logs": ScrollText,
  "/atualizacoes": Sparkles,
  "/perfil": User,
  "/configuracoes": Wrench,
  "/dev/permissoes": KeyRound,
  "/dev/configuracao": Code2,
  "/dev/menu-lateral": Sliders,
};

/* ─── Canonical menu items & categories definition ─── */
const DEFAULT_ITEMS: MenuItemConfig[] = DEFAULT_MENU_ITEMS;
const CATEGORIES: string[] = DEFAULT_MENU_CATEGORIES;

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

  // Categories state - initialized and synchronized with config
  const [categories, setCategories] = useState<string[]>(() => config.categories || DEFAULT_MENU_CATEGORIES);

  const [newCatName, setNewCatName] = useState("");
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatText, setEditingCatText] = useState("");

  // Items state - initialized and synchronized with config
  const [items, setItems] = useState<MenuItemConfig[]>(() => config.items || DEFAULT_MENU_ITEMS);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>(() => config.deletedItemIds || []);

  // Modal State: Create Menu
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [newMenuTitle, setNewMenuTitle] = useState("");
  const [newMenuUrl, setNewMenuUrl] = useState("");
  const [newMenuCategory, setNewMenuCategory] = useState(categories[0] || "Gestão");
  const [newMenuIconName, setNewMenuIconName] = useState("LayoutDashboard");
  const [newMenuVisible, setNewMenuVisible] = useState(true);
  const [newIconSearch, setNewIconSearch] = useState("");

  // Modal State: Edit Menu
  const [editingItem, setEditingItem] = useState<MenuItemConfig | null>(null);
  const [editItemTitle, setEditItemTitle] = useState("");
  const [editItemUrl, setEditItemUrl] = useState("");
  const [editItemCategory, setEditItemCategory] = useState("");
  const [editItemIconName, setEditItemIconName] = useState("LayoutDashboard");
  const [editItemVisible, setEditItemVisible] = useState(true);
  const [editIconSearch, setEditIconSearch] = useState("");

  // Modal State: Delete Confirmation
  const [itemToDelete, setItemToDelete] = useState<MenuItemConfig | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  // Drag and Drop state for items
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dragOverCatName, setDragOverCatName] = useState<string | null>(null);

  // Category Drag and Drop state
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [dragOverCatIdx, setDragOverCatIdx] = useState<number | null>(null);

  // Sync state when config updates (e.g. initial fetch or remote updates)
  useEffect(() => {
    if (config) {
      setCategories(config.categories || DEFAULT_MENU_CATEGORIES);
      setItems(config.items || DEFAULT_MENU_ITEMS);
      if (config.deletedItemIds) {
        setDeletedItemIds(config.deletedItemIds);
      }
    }
  }, [config]);

  // Master persistent reordering function: guarantees sequential order indices 0, 1, 2...
  const reorderAndPersist = useCallback(
    (newCats: string[], newItems: MenuItemConfig[], newDeletedIds?: string[]) => {
      const activeDeletedIds = newDeletedIds ?? deletedItemIds;
      const catSet = new Set(newCats);

      // Group items strictly according to newCats order
      const categorizedItems: MenuItemConfig[] = [];
      newCats.forEach((cat) => {
        const inCat = newItems.filter((i) => (i.category || newCats[0]) === cat);
        categorizedItems.push(...inCat);
      });

      // Append any items in orphan categories
      newItems.forEach((item) => {
        const cat = item.category || newCats[0];
        if (!catSet.has(cat) && !categorizedItems.some((ci) => ci.id === item.id)) {
          categorizedItems.push(item);
        }
      });

      // Sequential 0, 1, 2, ... indexing so order is rock-solid and never resets
      categorizedItems.forEach((item, idx) => {
        item.order = idx;
      });

      const synced = syncMenuConfig({
        categories: newCats,
        items: categorizedItems,
        deletedItemIds: activeDeletedIds,
      });

      setCategories(synced.categories);
      setItems(synced.items);
      setDeletedItemIds(synced.deletedItemIds || []);
      save(synced);
    },
    [deletedItemIds, save]
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
    reorderAndPersist(nextCats, items);
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
    reorderAndPersist(nextCats, nextItems);
    toast.success(`Categoria alterada para "${newName}"!`);
  };

  const handleConfirmDeleteCategory = () => {
    if (!canEdit || !catToDelete) return;
    if (categories.length <= 1) {
      toast.error("Você deve ter pelo menos 1 categoria no menu!");
      setCatToDelete(null);
      return;
    }

    const targetCat = catToDelete;
    const nextCats = categories.filter((c) => c !== targetCat);
    const fallbackCat = nextCats[0] || "Gestão";

    // Move items in deleted category to fallback category
    const nextItems = items.map((i) => (i.category === targetCat ? { ...i, category: fallbackCat } : i));

    reorderAndPersist(nextCats, nextItems);
    setCatToDelete(null);
    toast.success(`Categoria "${targetCat}" excluída! Itens vinculados foram movidos para "${fallbackCat}".`);
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    if (!canEdit) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const nextCats = [...categories];
    [nextCats[index], nextCats[targetIndex]] = [nextCats[targetIndex], nextCats[index]];

    reorderAndPersist(nextCats, items);
    toast.success("Ordem das categorias atualizada!");
  };

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

    reorderAndPersist(nextCats, items);
    setDraggedCatIdx(null);
    setDragOverCatIdx(null);
    toast.success(`Categoria "${movedCat}" reordenada com sucesso!`);
  };

  /* ─── Category Drop Target (Drop items onto category cards) ─── */
  const handleCategoryCardDragOver = (e: React.DragEvent, cat: string) => {
    if (!draggedItemId || !canEdit) return;
    e.preventDefault();
    setDragOverCatName(cat);
  };

  const handleCategoryCardDragLeave = () => {
    setDragOverCatName(null);
  };

  const handleCategoryCardDrop = (e: React.DragEvent, targetCat: string) => {
    e.preventDefault();
    setDragOverCatName(null);
    if (!draggedItemId || !canEdit) return;

    const draggedItem = items.find((i) => i.id === draggedItemId);
    if (!draggedItem) return;

    if (draggedItem.category === targetCat) {
      setDraggedItemId(null);
      return;
    }

    const nextItems = items.map((i) =>
      i.id === draggedItemId ? { ...i, category: targetCat } : i
    );
    reorderAndPersist(categories, nextItems);
    setDraggedItemId(null);
    toast.success(`Item "${draggedItem.title}" movido para a categoria "${targetCat}"!`);
  };

  /* ─── Item Handlers ─── */
  const updateItem = useCallback(
    (id: string, updates: Partial<MenuItemConfig>) => {
      if (!canEdit) return;
      const nextItems = items.map((item) => (item.id === id ? { ...item, ...updates } : item));
      let nextCats = categories;
      if (updates.category && !categories.includes(updates.category)) {
        nextCats = [...categories, updates.category];
      }
      reorderAndPersist(nextCats, nextItems);
    },
    [canEdit, categories, items, reorderAndPersist]
  );

  const moveItemWithinCategory = useCallback(
    (id: string, direction: "up" | "down") => {
      if (!canEdit) return;
      const currentItem = items.find((i) => i.id === id);
      if (!currentItem) return;

      const cat = currentItem.category || categories[0] || "Gestão";
      const catItems = items
        .filter((i) => (i.category || categories[0] || "Gestão") === cat)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const idxInCat = catItems.findIndex((i) => i.id === id);
      if (idxInCat < 0) return;

      const targetIdxInCat = direction === "up" ? idxInCat - 1 : idxInCat + 1;
      if (targetIdxInCat < 0 || targetIdxInCat >= catItems.length) return;

      const otherItem = catItems[targetIdxInCat];
      if (!otherItem) return;

      const nextCatItems = [...catItems];
      [nextCatItems[idxInCat], nextCatItems[targetIdxInCat]] = [nextCatItems[targetIdxInCat], nextCatItems[idxInCat]];

      const otherItems = items.filter((i) => (i.category || categories[0] || "Gestão") !== cat);
      const nextItems = [...otherItems, ...nextCatItems];

      reorderAndPersist(categories, nextItems);
      toast.success(`Ordem de "${currentItem.title}" atualizada!`);
    },
    [canEdit, categories, items, reorderAndPersist]
  );

  const handleReset = useCallback(() => {
    if (!canEdit) return;
    const defaultSynced = syncMenuConfig(null);
    setCategories(defaultSynced.categories);
    setItems(defaultSynced.items);
    setDeletedItemIds([]);
    reset();
    toast.success("Menu restaurado para o padrão do sistema!");
  }, [reset, canEdit]);

  const handleSyncAll = useCallback(() => {
    if (!canEdit) return;
    reorderAndPersist(categories, items);
    toast.success("Todas as categorias e menus foram sincronizados com sucesso!");
  }, [canEdit, categories, items, reorderAndPersist]);

  /* ─── Item Drag and Drop Handlers ─── */
  const handleItemDragStart = (e: React.DragEvent, id: string) => {
    if (!canEdit) return;
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleItemDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedItemId === null || draggedItemId === id) return;
    setDragOverItemId(id);
  };

  const handleItemDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleItemDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!canEdit || !draggedItemId || draggedItemId === targetId) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const draggedItem = items.find((i) => i.id === draggedItemId);
    const targetItem = items.find((i) => i.id === targetId);

    if (!draggedItem || !targetItem) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    const targetCategory = targetItem.category || categories[0] || "Gestão";
    const catItems = items
      .filter((i) => (i.category || categories[0] || "Gestão") === targetCategory && i.id !== draggedItemId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const targetIdxInCat = catItems.findIndex((i) => i.id === targetId);
    const updatedDraggedItem = { ...draggedItem, category: targetCategory };

    if (targetIdxInCat >= 0) {
      catItems.splice(targetIdxInCat, 0, updatedDraggedItem);
    } else {
      catItems.push(updatedDraggedItem);
    }

    const remainingItems = items.filter(
      (i) => i.id !== draggedItemId && (i.category || categories[0] || "Gestão") !== targetCategory
    );
    const nextItems = [...remainingItems, ...catItems];

    reorderAndPersist(categories, nextItems);
    setDraggedItemId(null);
    setDragOverItemId(null);
    toast.success(`Item "${draggedItem.title}" reordenado com sucesso!`);
  };

  /* ─── Modal Triggers: Add & Edit Menu Items ─── */
  const handleOpenAddMenu = (defaultCategory?: string) => {
    if (!canEdit) return;
    setNewMenuTitle("");
    setNewMenuUrl("");
    setNewMenuCategory(defaultCategory || categories[0] || "Gestão");
    setNewMenuIconName("LayoutDashboard");
    setNewMenuVisible(true);
    setNewIconSearch("");
    setIsAddMenuOpen(true);
  };

  const handleCreateMenu = () => {
    if (!canEdit) return;
    const title = newMenuTitle.trim();
    const url = newMenuUrl.trim();
    if (!title) {
      toast.error("Informe o título do menu.");
      return;
    }
    if (!url) {
      toast.error("Informe a URL ou rota do menu.");
      return;
    }

    const newId = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const category = newMenuCategory || categories[0] || "Gestão";

    const newItem: MenuItemConfig = {
      id: newId,
      title,
      url,
      category,
      visible: newMenuVisible,
      iconName: newMenuIconName,
      isCustom: true,
      order: items.length,
    };

    reorderAndPersist(categories, [...items, newItem]);
    setIsAddMenuOpen(false);
    setNewMenuTitle("");
    setNewMenuUrl("");
    toast.success(`Menu "${title}" criado com sucesso!`);
  };

  const handleStartEditItem = (item: MenuItemConfig) => {
    if (!canEdit) return;
    setEditingItem(item);
    setEditItemTitle(item.title);
    setEditItemUrl(item.url);
    setEditItemCategory(item.category || categories[0] || "Gestão");
    setEditItemIconName(item.iconName || "LayoutDashboard");
    setEditItemVisible(item.visible !== false);
    setEditIconSearch("");
  };

  const handleSaveEditItem = () => {
    if (!canEdit || !editingItem) return;
    const title = editItemTitle.trim();
    const url = editItemUrl.trim();
    if (!title) {
      toast.error("O título do menu não pode ficar vazio.");
      return;
    }
    if (!url) {
      toast.error("A URL / rota do menu não pode ficar vazia.");
      return;
    }

    const nextItems = items.map((it) => {
      if (it.id === editingItem.id) {
        return {
          ...it,
          title,
          url,
          category: editItemCategory || categories[0] || "Gestão",
          iconName: editItemIconName,
          visible: editItemVisible,
        };
      }
      return it;
    });

    reorderAndPersist(categories, nextItems);
    setEditingItem(null);
    toast.success(`Menu "${title}" atualizado com sucesso!`);
  };

  const handleConfirmDeleteItem = () => {
    if (!canEdit || !itemToDelete) return;
    const item = itemToDelete;
    const remaining = items.filter((i) => i.id !== item.id);
    const nextDeletedIds = item.isCustom
      ? deletedItemIds
      : Array.from(new Set([...deletedItemIds, item.id]));

    reorderAndPersist(categories, remaining, nextDeletedIds);
    setItemToDelete(null);
    toast.success(`Menu "${item.title}" excluído com sucesso!`);
  };

  // Group items by category for preview
  const grouped = useMemo(() => {
    const groups: Record<string, MenuItemConfig[]> = {};
    categories.forEach((cat) => {
      groups[cat] = items
        .filter((item) => (item.category || categories[0] || "Gestão") === cat)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    // Include items from missing categories
    items.forEach((item) => {
      const cat = item.category || categories[0] || "Gestão";
      if (!groups[cat]) {
        groups[cat] = [item];
      }
    });
    return groups;
  }, [categories, items]);

  // Icon search filters
  const filteredNewIcons = useMemo(() => {
    const term = newIconSearch.trim().toLowerCase();
    if (!term) return AVAILABLE_MENU_ICONS;
    return AVAILABLE_MENU_ICONS.filter(
      (i) => i.name.toLowerCase().includes(term) || i.label.toLowerCase().includes(term)
    );
  }, [newIconSearch]);

  const filteredEditIcons = useMemo(() => {
    const term = editIconSearch.trim().toLowerCase();
    if (!term) return AVAILABLE_MENU_ICONS;
    return AVAILABLE_MENU_ICONS.filter(
      (i) => i.name.toLowerCase().includes(term) || i.label.toLowerCase().includes(term)
    );
  }, [editIconSearch]);

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Personalização do Menu Lateral</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crie novos menus, edite títulos e ícones, apague itens e arraste para reordenar categorias e páginas em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            size="sm"
            onClick={() => handleOpenAddMenu()}
            disabled={!canEdit}
            className="h-8 text-xs gap-1.5 bg-gradient-brand text-primary-foreground font-bold shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Menu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={!canEdit}
            className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 font-bold"
            title="Sincronizar e persistir todas as categorias e menus"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Sincronizar Tudo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!canEdit}
            className="h-8 text-xs gap-1.5"
            title="Restaurar menus e categorias para o padrão original"
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
                <CardTitle className="text-sm font-bold">Categorias do Menu</CardTitle>
                <CardDescription className="text-[0.7rem]">
                  Crie, edite, apague e reordene as categorias da barra lateral (use as setas ou arraste)
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono gap-1 border-primary/30 text-primary">
              <Move className="h-3 w-3" /> {categories.length} categorias
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* List of categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat, idx) => {
              const isEditing = editingCatIndex === idx;
              const itemCount = items.filter((i) => (i.category || categories[0] || "Gestão") === cat).length;
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
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEditCategory(idx);
                          if (e.key === "Escape") setEditingCatIndex(null);
                        }}
                        autoFocus
                        className="h-7 text-xs bg-background font-bold"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEditCategory(idx)}
                        className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300"
                        title="Salvar nome da categoria"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCatIndex(null)}
                        className="h-7 w-7 p-0 text-muted-foreground"
                        title="Cancelar"
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
                          onClick={() => setCatToDelete(cat)}
                          disabled={!canEdit || categories.length <= 1}
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
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border/60 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary">
                <Menu className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Itens do Menu por Categoria</h4>
                <p className="text-[0.7rem] text-muted-foreground">
                  {items.length} itens cadastrados · {items.filter((i) => i.visible).length} visíveis na navegação
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenAddMenu()}
              disabled={!canEdit}
              className="h-7 text-xs gap-1 bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Menu
            </Button>
          </div>

          {categories.map((cat) => {
            const catItems = items
              .filter((i) => (i.category || categories[0] || "Gestão") === cat)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            const isCatOver = dragOverCatName === cat;

            return (
              <Card
                key={cat}
                className={cn(
                  "surface-card border-border/60 transition-all",
                  isCatOver && "border-primary ring-2 ring-primary/20 bg-primary/5"
                )}
                onDragOver={(e) => handleCategoryCardDragOver(e, cat)}
                onDragLeave={handleCategoryCardDragLeave}
                onDrop={(e) => handleCategoryCardDrop(e, cat)}
              >
                <CardHeader className="pb-2 pt-3 px-4 border-b border-border/40 bg-secondary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4 text-primary" />
                      <CardTitle className="text-xs font-bold text-foreground">
                        Categoria: <span className="text-primary font-extrabold">{cat}</span>
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                        {catItems.length} {catItems.length === 1 ? "item" : "itens"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenAddMenu(cat)}
                        disabled={!canEdit}
                        className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10 gap-1 font-bold"
                        title={`Adicionar novo menu dentro de ${cat}`}
                      >
                        <Plus className="h-3 w-3" />
                        Novo Menu
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3">
                  {catItems.length === 0 ? (
                    <div className="border border-dashed border-border/60 rounded-xl p-5 text-center space-y-2 bg-secondary/10 hover:border-primary/40 transition-colors">
                      <p className="text-xs font-bold text-foreground">
                        Nenhum item nesta categoria
                      </p>
                      <p className="text-[0.7rem] text-muted-foreground">
                        Arraste um menu para cá ou crie um novo menu vinculado a {cat}.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAddMenu(cat)}
                        disabled={!canEdit}
                        className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10 font-bold"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Criar Menu em {cat}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {catItems.map((item, itemIdxInCat) => {
                        const ItemIcon = resolveMenuIcon(item.iconName, item.url);
                        const isDragging = draggedItemId === item.id;
                        const isDragOver = dragOverItemId === item.id;
                        const isExternal = item.url.startsWith("http://") || item.url.startsWith("https://");

                        return (
                          <div
                            key={item.id}
                            draggable={canEdit}
                            onDragStart={(e) => handleItemDragStart(e, item.id)}
                            onDragOver={(e) => handleItemDragOver(e, item.id)}
                            onDragLeave={handleItemDragLeave}
                            onDrop={(e) => handleItemDrop(e, item.id)}
                            className={cn(
                              "flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing",
                              item.visible
                                ? "bg-card/40 border-border/60 shadow-xs hover:border-primary/40"
                                : "bg-secondary/20 border-border/30 opacity-50",
                              isDragging && "opacity-30 scale-95 border-dashed border-primary",
                              isDragOver && "border-primary bg-primary/10 shadow-lg scale-[1.01]"
                            )}
                          >
                            {/* Left Group: Reorder Arrows + Icon + Title + URL */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* Reorder Arrows & Handle */}
                              <div className="flex flex-col items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveItemWithinCategory(item.id, "up")}
                                  disabled={itemIdxInCat === 0 || !canEdit}
                                  className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Mover para cima nesta categoria"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-primary cursor-grab" />
                                <button
                                  type="button"
                                  onClick={() => moveItemWithinCategory(item.id, "down")}
                                  disabled={itemIdxInCat === catItems.length - 1 || !canEdit}
                                  className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Mover para baixo nesta categoria"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Icon Badge */}
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 transition-colors shadow-xs",
                                item.visible
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "bg-secondary/50 border-border/40 text-muted-foreground"
                              )}>
                                <ItemIcon className="h-4 w-4" />
                              </div>

                              {/* Title & Route */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-foreground truncate">
                                    {item.title}
                                  </p>
                                  {item.isCustom && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-purple-500/40 text-purple-400 bg-purple-500/10 font-bold shrink-0">
                                      Custom
                                    </Badge>
                                  )}
                                  {isExternal && (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-sky-500/40 text-sky-400 bg-sky-500/10 font-bold shrink-0 gap-0.5">
                                      <ExternalLink className="h-2.5 w-2.5" />
                                      Link
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[0.65rem] text-muted-foreground font-mono truncate mt-0.5">
                                  {item.url}
                                </p>
                              </div>
                            </div>

                            {/* Right Group: Category Selector + Visibility + Edit & Delete Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Category Select */}
                              <Select
                                value={item.category || categories[0] || "Gestão"}
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

                              <Separator orientation="vertical" className="h-5" />

                              {/* Visibility Switch */}
                              <div className="flex items-center gap-1 shrink-0" title={item.visible ? "Visível no menu" : "Oculto no menu"}>
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

                              <Separator orientation="vertical" className="h-5" />

                              {/* Edit Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEditItem(item)}
                                disabled={!canEdit}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                title="Editar título, rota ou ícone do menu"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>

                              {/* Delete Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setItemToDelete(item)}
                                disabled={!canEdit}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Excluir este item de menu"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
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

          {/* Safety Catch-All for any Orphan Categories */}
          {(() => {
            const knownCats = new Set(categories);
            const orphanItems = items.filter((i) => !knownCats.has(i.category || categories[0] || "Gestão"));
            if (orphanItems.length === 0) return null;

            const orphanCategories = Array.from(new Set(orphanItems.map((i) => i.category || categories[0] || "Gestão")));

            return orphanCategories.map((orphanCat) => {
              const catItems = orphanItems
                .filter((i) => (i.category || categories[0] || "Gestão") === orphanCat)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

              return (
                <Card key={`orphan-${orphanCat}`} className="surface-card border-amber-500/40">
                  <CardHeader className="pb-2 pt-3 px-4 border-b border-amber-500/30 bg-amber-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-amber-400" />
                        <CardTitle className="text-xs font-bold text-amber-400">
                          Categoria Detectada: <span className="font-extrabold">{orphanCat}</span>
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-400">
                          {catItems.length} {catItems.length === 1 ? "item" : "itens"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!categories.includes(orphanCat)) {
                              reorderAndPersist([...categories, orphanCat], items);
                              toast.success(`Categoria "${orphanCat}" adicionada às categorias ativas!`);
                            }
                          }}
                          className="h-6 text-[10px] px-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                        >
                          Fixar Categoria
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {catItems.map((item) => {
                        const ItemIcon = resolveMenuIcon(item.iconName, item.url);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 shrink-0">
                                <ItemIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-foreground truncate">
                                  {item.title}
                                </p>
                                <p className="text-[0.65rem] text-muted-foreground font-mono truncate mt-0.5">
                                  {item.url}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Select
                                value={item.category || categories[0] || "Gestão"}
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            });
          })()}
        </div>

        {/* Live Preview Column */}
        <div className="space-y-3">
          <Card className="surface-card sticky top-20">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/30 text-accent">
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">Preview do Menu Lateral</CardTitle>
                  <CardDescription className="text-[0.7rem]">Visualização exata da barra de navegação</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="rounded-xl bg-sidebar border border-sidebar-border p-3 space-y-3">
                {Object.keys(grouped).map((cat) => {
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
                          const ItemIcon = resolveMenuIcon(item.iconName, item.url);
                          const isExternal = item.url.startsWith("http://") || item.url.startsWith("https://");
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <ItemIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                <span className="truncate font-medium">{item.title}</span>
                              </div>
                              {isExternal && (
                                <ExternalLink className="h-3 w-3 opacity-40 shrink-0" />
                              )}
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

      {/* ─── MODAL: CRIAR NOVO MENU ─── */}
      <Dialog open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Novo Item de Menu
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adicione uma rota interna ou link externo para a navegação dos membros.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Título do Menu</Label>
              <Input
                value={newMenuTitle}
                onChange={(e) => setNewMenuTitle(e.target.value)}
                placeholder="Ex: Discord da Facção, Planilha de Armas, Loja VIP..."
                className="h-9 text-xs"
              />
            </div>

            {/* URL / Route */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">URL ou Rota</Label>
              <Input
                value={newMenuUrl}
                onChange={(e) => setNewMenuUrl(e.target.value)}
                placeholder="Ex: /minha-pagina ou https://discord.gg/exemplo"
                className="h-9 text-xs font-mono"
              />
              <p className="text-[0.65rem] text-muted-foreground">
                Dica: Endereços com <span className="font-mono text-primary">http://</span> ou <span className="font-mono text-primary">https://</span> serão abertos automaticamente em nova aba.
              </p>
            </div>

            {/* Category & Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Categoria</Label>
                <Select value={newMenuCategory} onValueChange={setNewMenuCategory}>
                  <SelectTrigger className="h-9 text-xs font-bold">
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
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/40 h-9">
                  <span className="text-xs font-bold">Visível no Menu</span>
                  <Switch
                    checked={newMenuVisible}
                    onCheckedChange={setNewMenuVisible}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Selecione o Ícone</Label>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                  {(() => {
                    const CurrentIcon = resolveMenuIcon(newMenuIconName);
                    return (
                      <>
                        <CurrentIcon className="h-3.5 w-3.5" />
                        <span className="text-[11px]">{newMenuIconName}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={newIconSearch}
                  onChange={(e) => setNewIconSearch(e.target.value)}
                  placeholder="Buscar ícone..."
                  className="h-8 pl-8 text-xs bg-secondary/40"
                />
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-lg border border-border/40 bg-secondary/20">
                {filteredNewIcons.map((ic) => {
                  const IconComp = ic.icon;
                  const isSelected = newMenuIconName === ic.name;
                  return (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setNewMenuIconName(ic.name)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all hover:scale-105",
                        isSelected
                          ? "border-primary bg-primary/20 text-primary shadow-xs ring-1 ring-primary"
                          : "border-border/40 bg-card hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                      )}
                      title={ic.label}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setIsAddMenuOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateMenu}
              className="bg-primary text-primary-foreground font-bold"
            >
              Criar Menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: EDITAR MENU ─── */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" />
              Editar Menu
            </DialogTitle>
            <DialogDescription className="text-xs">
              Altere o título, URL, categoria, visibilidade ou ícone deste item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Título do Menu</Label>
              <Input
                value={editItemTitle}
                onChange={(e) => setEditItemTitle(e.target.value)}
                placeholder="Título do menu..."
                className="h-9 text-xs font-bold"
              />
            </div>

            {/* URL / Route */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">URL ou Rota</Label>
              <Input
                value={editItemUrl}
                onChange={(e) => setEditItemUrl(e.target.value)}
                placeholder="/rota ou https://..."
                className="h-9 text-xs font-mono"
              />
            </div>

            {/* Category & Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Categoria</Label>
                <Select value={editItemCategory} onValueChange={setEditItemCategory}>
                  <SelectTrigger className="h-9 text-xs font-bold">
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
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/40 h-9">
                  <span className="text-xs font-bold">Visível no Menu</span>
                  <Switch
                    checked={editItemVisible}
                    onCheckedChange={setEditItemVisible}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Ícone</Label>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                  {(() => {
                    const CurrentIcon = resolveMenuIcon(editItemIconName);
                    return (
                      <>
                        <CurrentIcon className="h-3.5 w-3.5" />
                        <span className="text-[11px]">{editItemIconName}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={editIconSearch}
                  onChange={(e) => setEditIconSearch(e.target.value)}
                  placeholder="Buscar ícone..."
                  className="h-8 pl-8 text-xs bg-secondary/40"
                />
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-lg border border-border/40 bg-secondary/20">
                {filteredEditIcons.map((ic) => {
                  const IconComp = ic.icon;
                  const isSelected = editItemIconName === ic.name;
                  return (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setEditItemIconName(ic.name)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all hover:scale-105",
                        isSelected
                          ? "border-primary bg-primary/20 text-primary shadow-xs ring-1 ring-primary"
                          : "border-border/40 bg-card hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                      )}
                      title={ic.label}
                    >
                      <IconComp className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEditItem}
              className="bg-primary text-primary-foreground font-bold"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: CONFIRMAR EXCLUSÃO DE ITEM ─── */}
      <Dialog open={Boolean(itemToDelete)} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Excluir Item de Menu
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir o menu <strong>"{itemToDelete?.title}"</strong>?
              {itemToDelete?.isCustom ? (
                <span> Este item customizado será removido permanentemente.</span>
              ) : (
                <span> Ele não será mais exibido na barra lateral de navegação (você pode recuperá-lo usando "Restaurar Padrão").</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setItemToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteItem}
              className="font-bold gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir Menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: CONFIRMAR EXCLUSÃO DE CATEGORIA ─── */}
      <Dialog open={Boolean(catToDelete)} onOpenChange={(open) => !open && setCatToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Excluir Categoria
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir a categoria <strong>"{catToDelete}"</strong>?
              Os itens vinculados a ela serão automaticamente transferidos para outra categoria ativa e esta categoria não será recriada.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setCatToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDeleteCategory}
              className="font-bold gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Chat Notification Sounds Component ─── */
function ChatSoundConfigCard() {
  const [chatSoundEnabled, setChatSoundEnabled] = useState(chatSound.isEnabled());

  useEffect(() => {
    const handleSoundChange = (e: any) => {
      if (typeof e.detail?.enabled === "boolean") {
        setChatSoundEnabled(e.detail.enabled);
      }
    };
    window.addEventListener("tw_chat_sound_change", handleSoundChange);
    return () => window.removeEventListener("tw_chat_sound_change", handleSoundChange);
  }, []);

  const handleToggle = (checked: boolean) => {
    chatSound.setEnabled(checked);
    setChatSoundEnabled(checked);
    toast.success(
      checked
        ? "Notificações sonoras do chat ativadas com sucesso!"
        : "Notificações sonoras do chat desativadas!"
    );
    if (checked) {
      chatSound.playIncomingMessage();
    }
  };

  const handleTestIncoming = () => {
    chatSound.playIncomingMessage();
    toast.info("Testando som de nova mensagem do chat");
  };

  const handleTestMention = () => {
    chatSound.playMentionSound();
    toast.info("Testando som de menção (@você) no chat");
  };

  const handleTestSent = () => {
    chatSound.playSentMessage();
    toast.info("Testando som de mensagem enviada");
  };

  return (
    <Card className="surface-card">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold">Notificações Sonoras do Chat</CardTitle>
              <CardDescription className="text-[0.7rem]">
                Alertas sonoros em tempo real para novas mensagens recebidas, menções e envio
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-mono",
              chatSoundEnabled
                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                : "border-zinc-500/40 text-muted-foreground"
            )}
          >
            {chatSoundEnabled ? "Áudio Ativo" : "Silenciado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/40">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-foreground">Sons de novas mensagens e menções</p>
            <p className="text-[0.7rem] text-muted-foreground">
              Reproduzir tom sonoro discreto e cristalino ao receber novas mensagens fora da conversa aberta
            </p>
          </div>
          <Switch
            checked={chatSoundEnabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>

        {/* Audio Test Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestIncoming}
            disabled={!chatSoundEnabled}
            className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Testar Som de Mensagem Recebida
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestMention}
            disabled={!chatSoundEnabled}
            className="h-8 text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Testar Som de Menção (@)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestSent}
            disabled={!chatSoundEnabled}
            className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Testar Som de Envio
          </Button>
        </div>
      </CardContent>
    </Card>
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

      {/* CHAT NOTIFICATIONS SOUND CARD */}
      <ChatSoundConfigCard />

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
