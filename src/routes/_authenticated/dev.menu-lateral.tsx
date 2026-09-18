import { useState, useCallback, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Code2,
  Terminal,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  GripVertical,
  TrendingUp,
  KeyRound,
  Sliders,
  CheckCircle2,
  Tag,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Move,
  FolderTree,
  Monitor,
  Menu,
  ShieldCheck,
  LayoutDashboard,
  Layers,
  Sparkles,
  Crown,
  Bot,
  Webhook,
  Landmark,
  Wallet,
  Activity,
  DollarSign,
  Palette,
  BellRing,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui-kit";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { cn } from "@/lib/utils";
import { useUrlTab } from "@/hooks/useUrlTab";
import {
  useDevMenuConfig,
  DEFAULT_DEV_MENU_ITEMS,
  DEFAULT_DEV_CATEGORIES,
  normalizeDevMenuConfig,
  type DevMenuItemConfig,
} from "@/hooks/useDevMenuConfig";
import {
  useCeoMenuConfig,
  DEFAULT_CEO_MENU_ITEMS,
  DEFAULT_CEO_CATEGORIES,
  sanitizeCeoConfig,
  type CeoMenuItemConfig,
} from "@/hooks/useCeoMenuConfig";
import { resolveMenuIcon, AVAILABLE_MENU_ICONS } from "@/lib/menuIcons";
import {
  type PanelColor,
  getPanelColorStyle,
  resolveCategoryIcon,
} from "@/lib/panelTheme";
import {
  getDevThemeColorSync,
  getCeoThemeColorSync,
  DEV_CONFIG_EVENT,
} from "@/services/devService";
import { CategoryIconPickerModal } from "@/components/dev/CategoryIconPickerModal";

export const Route = createFileRoute("/_authenticated/dev/menu-lateral")({
  component: DevMenuLateralPageWrapper,
});

function DevMenuLateralPageWrapper() {
  return (
    <DeveloperGuard>
      <DevMenuLateralContent />
    </DeveloperGuard>
  );
}

const DEV_ICON_MAP: Record<string, typeof Terminal> = {
  "/dev": Terminal,
  "/dev/bot": Bot,
  "/dev/estoque": Boxes,
  "/dev/patch-notes": Sparkles,
  "/dev/desempenho": TrendingUp,
  "/dev/permissoes": KeyRound,
  "/dev/configuracao": Code2,
  "/dev/menu-lateral": Sliders,
  "/dev/notificacoes": BellRing,
};

function DevToolsMenuEditor() {
  const { config, save, reset } = useDevMenuConfig();

  // Dynamic Theme state
  const [devTheme, setDevTheme] = useState<PanelColor>(() => getDevThemeColorSync());
  useEffect(() => {
    const handleConfig = (e: any) => {
      if (e?.detail?.devThemeColor) setDevTheme(e.detail.devThemeColor);
    };
    window.addEventListener(DEV_CONFIG_EVENT, handleConfig);
    return () => window.removeEventListener(DEV_CONFIG_EVENT, handleConfig);
  }, []);
  const devStyle = useMemo(() => getPanelColorStyle(devTheme, "rose"), [devTheme]);

  // Categories state
  const [categories, setCategories] = useState<string[]>(() => {
    if (config?.categories && Array.isArray(config.categories) && config.categories.length > 0) {
      return config.categories;
    }
    return [...DEFAULT_DEV_CATEGORIES];
  });

  // Category Icons state
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>(() => {
    return config?.categoryIcons || {};
  });
  const [selectedNewCatIcon, setSelectedNewCatIcon] = useState<string>("Terminal");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [pickingForCat, setPickingForCat] = useState<string | null>(null);

  const [newCatName, setNewCatName] = useState("");
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatText, setEditingCatText] = useState("");

  // Items state
  const [items, setItems] = useState<DevMenuItemConfig[]>(() => {
    try {
      if (config && Array.isArray(config.items) && config.items.length > 0) {
        return normalizeDevMenuConfig(config).items;
      }
    } catch (e) {
      console.error("Error parsing dev menu config:", e);
    }
    return [...DEFAULT_DEV_MENU_ITEMS];
  });

  // Sync state when config finishes fetching remotely from Supabase
  useEffect(() => {
    if (config?.categories && Array.isArray(config.categories) && config.categories.length > 0) {
      setCategories(config.categories);
    }
    if (config?.categoryIcons) {
      setCategoryIcons(config.categoryIcons);
    }
    if (config?.items && Array.isArray(config.items) && config.items.length > 0) {
      setItems(normalizeDevMenuConfig(config).items);
    }
  }, [config]);

  // Add Item Dialog State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("DEV");
  const [newItemIcon, setNewItemIcon] = useState("Terminal");

  const handleAddItem = () => {
    const title = newItemTitle.trim();
    let url = newItemUrl.trim();
    if (!title) {
      toast.error("Informe o título do menu Dev!");
      return;
    }
    if (!url) {
      toast.error("Informe a rota ou URL do menu!");
      return;
    }
    if (!url.startsWith("/") && !url.startsWith("http")) {
      url = "/" + url;
    }

    const newItem: DevMenuItemConfig = {
      id: `dev-custom-${Date.now()}`,
      title,
      url,
      iconName: newItemIcon,
      visible: true,
      category: newItemCategory || categories[0] || "DEV",
      order: items.length,
      isCustom: true,
    };

    const nextItems = [...items, newItem];
    persist(categories, nextItems);
    setNewItemTitle("");
    setNewItemUrl("");
    setIsAddItemOpen(false);
    toast.success(`Item "${title}" adicionado ao menu Dev!`);
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (item.isCustom) {
      const nextItems = items.filter((i) => i.id !== id);
      persist(categories, nextItems);
      toast.success(`Item personalizado "${item.title}" removido!`);
    } else {
      if (confirm(`Deseja realmente remover "${item.title}" do menu Dev? Você poderá restaurar os padrões a qualquer momento.`)) {
        const nextItems = items.filter((i) => i.id !== id);
        persist(categories, nextItems);
        toast.success(`Item "${item.title}" removido do menu Dev.`);
      }
    }
  };

  // Drag and Drop state for items
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // Helper to persist state to Supabase + LocalStorage
  const persist = useCallback(
    (newCats: string[], newItems: DevMenuItemConfig[], newIcons?: Record<string, string>) => {
      const cleanedItems = newItems.map((it, idx) => ({ ...it, order: idx }));
      const currentIcons = newIcons ?? categoryIcons;
      setCategories(newCats);
      setItems(cleanedItems);
      setCategoryIcons(currentIcons);
      save({ categories: newCats, items: cleanedItems, categoryIcons: currentIcons });
    },
    [save, categoryIcons]
  );

  /* ─── Category Icon Picker Handler ─── */
  const handleSelectIcon = (iconName: string) => {
    if (pickingForCat === null) {
      setSelectedNewCatIcon(iconName);
    } else {
      const nextIcons = { ...categoryIcons, [pickingForCat]: iconName };
      persist(categories, items, nextIcons);
      toast.success(`Ícone da categoria "${pickingForCat}" alterado!`);
    }
  };

  /* ─── Category Handlers ─── */
  const handleAddCategory = () => {
    const cat = newCatName.trim();
    if (!cat) return;
    if (categories.includes(cat)) {
      toast.error("Esta categoria já existe no menu Dev!");
      return;
    }
    const nextCats = [...categories, cat];
    const nextIcons = { ...categoryIcons, [cat]: selectedNewCatIcon };
    setNewCatName("");
    persist(nextCats, items, nextIcons);
    toast.success(`Categoria Dev "${cat}" criada com sucesso!`);
  };

  const handleStartEditCategory = (index: number) => {
    setEditingCatIndex(index);
    setEditingCatText(categories[index] || "");
  };

  const handleSaveEditCategory = (index: number) => {
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

    const nextItems = items.map((i) => (i.category === oldName ? { ...i, category: newName } : i));
    const nextIcons = { ...categoryIcons };
    if (nextIcons[oldName]) {
      nextIcons[newName] = nextIcons[oldName];
      delete nextIcons[oldName];
    }

    setEditingCatIndex(null);
    persist(nextCats, nextItems, nextIcons);
    toast.success(`Categoria alterada para "${newName}"!`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      toast.error("Você deve ter pelo menos 1 categoria no menu Dev!");
      return;
    }

    const nextCats = categories.filter((c) => c !== catToDelete);
    const fallbackCat = nextCats[0] || "DEV";

    const nextItems = items.map((i) => (i.category === catToDelete ? { ...i, category: fallbackCat } : i));
    const nextIcons = { ...categoryIcons };
    delete nextIcons[catToDelete];

    persist(nextCats, nextItems, nextIcons);
    toast.success(`Categoria "${catToDelete}" removida! Itens movidos para "${fallbackCat}".`);
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const nextCats = [...categories];
    [nextCats[index], nextCats[targetIndex]] = [nextCats[targetIndex], nextCats[index]];

    persist(nextCats, items);
    toast.success("Ordem das categorias Dev atualizada!");
  };

  // Category Drag and Drop state
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [dragOverCatIdx, setDragOverCatIdx] = useState<number | null>(null);

  const handleCatDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCatIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `devcat-${index}`);
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
    toast.success(`Categoria Dev "${movedCat}" reordenada!`);
  };

  /* ─── Item Handlers ─── */
  const updateItem = useCallback(
    (id: string, updates: Partial<DevMenuItemConfig>) => {
      const nextItems = items.map((item) => (item.id === id ? { ...item, ...updates } : item));
      persist(categories, nextItems);
    },
    [categories, items, persist]
  );

  const moveItemWithinCategory = useCallback(
    (id: string, direction: "up" | "down") => {
      const currentItem = items.find((i) => i.id === id);
      if (!currentItem) return;

      const cat = currentItem.category || "DEV";
      const catItems = items.filter((i) => (i.category || "DEV") === cat);
      const indexInCat = catItems.findIndex((i) => i.id === id);
      if (indexInCat < 0) return;

      const targetIndexInCat = direction === "up" ? indexInCat - 1 : indexInCat + 1;
      if (targetIndexInCat < 0 || targetIndexInCat >= catItems.length) return;

      const otherItem = catItems[targetIndexInCat];
      if (!otherItem) return;

      const nextItems = [...items];
      const idxA = nextItems.findIndex((i) => i.id === currentItem.id);
      const idxB = nextItems.findIndex((i) => i.id === otherItem.id);
      [nextItems[idxA], nextItems[idxB]] = [nextItems[idxB], nextItems[idxA]];

      persist(categories, nextItems);
    },
    [categories, items, persist]
  );

  const handleReset = useCallback(() => {
    setCategories([...DEFAULT_DEV_CATEGORIES]);
    setItems([...DEFAULT_DEV_MENU_ITEMS]);
    setCategoryIcons({});
    reset();
    toast.success("Menu Dev restaurado para o padrão!");
  }, [reset]);

  /* ─── Item Drag and Drop Handlers ─── */
  const handleItemDragStart = (e: React.DragEvent, id: string) => {
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
    if (!draggedItemId || draggedItemId === targetId) {
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

    const nextItems = items.filter((i) => i.id !== draggedItemId);
    const targetIdx = nextItems.findIndex((i) => i.id === targetId);

    const updatedDraggedItem = {
      ...draggedItem,
      category: targetItem.category || "DEV",
    };

    nextItems.splice(targetIdx, 0, updatedDraggedItem);

    persist(categories, nextItems);
    setDraggedItemId(null);
    setDragOverItemId(null);
    toast.success(`Item Dev "${draggedItem.title}" reordenado!`);
  };

  // Group items by category for preview
  const grouped = useMemo(() => {
    const groups: Record<string, DevMenuItemConfig[]> = {};
    categories.forEach((cat) => {
      groups[cat] = items.filter((item) => (item.category || "DEV") === cat);
    });
    items.forEach((item) => {
      const cat = item.category || "DEV";
      if (!groups[cat]) groups[cat] = [item];
    });
    return groups;
  }, [categories, items]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Modal de Escolha de Ícone para Categoria */}
      <CategoryIconPickerModal
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        selectedIcon={pickingForCat ? (categoryIcons[pickingForCat] || "Terminal") : selectedNewCatIcon}
        onSelectIcon={handleSelectIcon}
        panelColor={devTheme}
        title={pickingForCat ? `Ícone da Categoria: ${pickingForCat}` : "Escolher Ícone da Nova Categoria Dev"}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Dev Tools → Menu Lateral"
          description="Personalize a ordem, categorias, ícones e visibilidade dos menus exclusivos da barra de ferramentas do Desenvolvedor."
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("font-mono font-bold text-xs px-2.5 py-1 flex items-center gap-1.5 shadow-sm", devStyle.badgeClass)}
            >
              <Terminal className="h-3.5 w-3.5 animate-pulse" />
              CONFIGURAÇÃO DEV · {devStyle.label.split(" ")[0]}
            </Badge>
          </div>
        </PageHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9 text-xs gap-1.5 font-bold border-border/80"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setNewItemCategory(categories[0] || "DEV");
              setIsAddItemOpen(true);
            }}
            className={cn("h-9 text-xs gap-1.5 font-bold border", devStyle.borderClass, devStyle.bgSubtleClass, devStyle.textClass)}
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Item Dev
          </Button>
          <Button
            size="sm"
            onClick={() => {
              persist(categories, items);
              toast.success("Configuração do Menu Lateral Dev salva no Supabase!");
            }}
            className={cn("h-9 text-xs gap-1.5 font-bold shadow-sm", devStyle.bgSolidClass)}
          >
            <Save className="h-3.5 w-3.5" />
            Salvar Menu Dev
          </Button>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs gap-1 py-1 px-3">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sincronizado ao vivo
          </Badge>
        </div>
      </div>

      {/* Category Management Section */}
      <Card className={cn("surface-card", devStyle.borderClass)}>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", devStyle.bgSubtleClass, devStyle.borderClass, devStyle.textClass)}>
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className={cn("text-sm font-bold", devStyle.textClass)}>Categorias da Barra Dev</CardTitle>
                <CardDescription className="text-[0.7rem]">
                  Crie, edite, defina ícones personalizados e arraste os cards para reorganizar o menu dev
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={cn("text-[10px] font-mono gap-1", devStyle.badgeClass)}>
              <Move className="h-3 w-3" /> Drag & Drop Ativo ({categories.length})
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat, idx) => {
              const isEditing = editingCatIndex === idx;
              const itemCount = items.filter((i) => (i.category || "DEV") === cat).length;
              const isDraggingCat = draggedCatIdx === idx;
              const isOverCat = dragOverCatIdx === idx;
              const CatIcon = resolveCategoryIcon(categoryIcons[cat], Terminal);

              return (
                <div
                  key={cat}
                  draggable={!isEditing}
                  onDragStart={(e) => handleCatDragStart(e, idx)}
                  onDragOver={(e) => handleCatDragOver(e, idx)}
                  onDragLeave={handleCatDragLeave}
                  onDrop={(e) => handleCatDrop(e, idx)}
                  className={cn(
                    "flex items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/50 transition-all",
                    !isEditing && cn("cursor-grab active:cursor-grabbing", devStyle.borderHoverClass),
                    isDraggingCat && cn("opacity-30 scale-95 border-dashed", devStyle.borderClass),
                    isOverCat && cn(devStyle.borderClass, devStyle.bgSubtleClass, "shadow-lg scale-[1.01]")
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
                        <GripVertical className="h-4 w-4 text-muted-foreground/60 hover:text-foreground cursor-grab shrink-0" />
                        
                        {/* Category Icon Picker Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPickingForCat(cat);
                            setIconPickerOpen(true);
                          }}
                          className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 transition-all hover:scale-110 shadow-2xs",
                            devStyle.bgSubtleClass,
                            devStyle.borderClass,
                            devStyle.textClass
                          )}
                          title="Clique para alterar o ícone desta categoria"
                        >
                          <CatIcon className="h-3.5 w-3.5" />
                        </button>

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
                          disabled={idx === 0}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Mover categoria para cima"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, "down")}
                          disabled={idx === categories.length - 1}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Mover categoria para baixo"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(idx)}
                          className={cn("h-6 w-6 flex items-center justify-center rounded text-muted-foreground disabled:opacity-20", "hover:" + devStyle.textClass)}
                          title="Editar nome da categoria"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
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
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
            {/* New Category Icon Selector */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPickingForCat(null);
                setIconPickerOpen(true);
              }}
              className={cn("h-9 gap-1.5 px-3 text-xs font-bold border-border/60", devStyle.bgSubtleClass, devStyle.textClass)}
              title="Escolher ícone para a nova categoria"
            >
              {(() => {
                const Ico = resolveCategoryIcon(selectedNewCatIcon, Terminal);
                return <Ico className="h-4 w-4" />;
              })()}
              <span className="hidden sm:inline">Ícone: {selectedNewCatIcon}</span>
            </Button>

            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="Nome da nova categoria Dev..."
              className="h-9 text-xs bg-secondary/50 border-border/60 max-w-sm flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className={cn("h-9 text-xs gap-1.5 font-bold shadow-sm", devStyle.bgSolidClass)}
            >
              <Plus className="h-3.5 w-3.5" />
              Criar Categoria Dev
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Editor & Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Menu Items Editor - Grouped by Category */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border/60">
            <div className="flex items-center gap-2">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", devStyle.bgSubtleClass, devStyle.borderClass, devStyle.textClass)}>
                <Menu className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Itens do Menu Dev Agrupados por Categoria</h4>
                <p className="text-[0.7rem] text-muted-foreground">
                  {items.length} itens no total · {items.filter((i) => i.visible).length} visíveis na navegação dev
                </p>
              </div>
            </div>
            <Badge variant="outline" className={cn("text-[10px] gap-1", devStyle.badgeClass)}>
              <Move className="h-3 w-3" /> Arraste para Reordenar
            </Badge>
          </div>

          {categories.map((cat) => {
            const catItems = items
              .filter((i) => (i.category || "DEV") === cat)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const CatIcon = resolveCategoryIcon(categoryIcons[cat], Terminal);

            return (
              <Card key={cat} className="surface-card border-border/60">
                <CardHeader className="pb-2 pt-3 px-4 border-b border-border/40 bg-secondary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CatIcon className={cn("h-4 w-4", devStyle.textClass)} />
                      <CardTitle className="text-xs font-bold text-foreground">
                        Categoria Dev: <span className={cn("font-extrabold", devStyle.textClass)}>{cat}</span>
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] font-mono", devStyle.badgeClass)}>
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
                      {catItems.map((item, itemIdxInCat) => {
                        const Icon = resolveMenuIcon(item.iconName, item.url);
                        const isDragging = draggedItemId === item.id;
                        const isDragOver = dragOverItemId === item.id;

                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleItemDragStart(e, item.id)}
                            onDragOver={(e) => handleItemDragOver(e, item.id)}
                            onDragLeave={handleItemDragLeave}
                            onDrop={(e) => handleItemDrop(e, item.id)}
                            className={cn(
                              "flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing",
                              item.visible
                                ? cn("bg-card/50 border-border/60 shadow-sm hover:bg-card/70", devStyle.borderHoverClass)
                                : "bg-secondary/20 border-border/30 opacity-50",
                              isDragging && cn("opacity-30 scale-95 border-dashed", devStyle.borderClass),
                              isDragOver && cn(devStyle.borderClass, devStyle.bgSubtleClass, "shadow-lg scale-[1.01]")
                            )}
                          >
                            {/* Left Group: Controls + Icon + Title + URL */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Drag Handle & Arrows */}
                              <div className="flex flex-col items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveItemWithinCategory(item.id, "up")}
                                  disabled={itemIdxInCat === 0}
                                  className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Mover para cima nesta categoria"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <GripVertical className={cn("h-4 w-4 text-muted-foreground/60 cursor-grab", "hover:" + devStyle.textClass)} />
                                <button
                                  type="button"
                                  onClick={() => moveItemWithinCategory(item.id, "down")}
                                  disabled={itemIdxInCat === catItems.length - 1}
                                  className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Mover para baixo nesta categoria"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Icon Selector */}
                              <Select
                                value={item.iconName || "Terminal"}
                                onValueChange={(iconVal) => updateItem(item.id, { iconName: iconVal })}
                                className="w-auto shrink-0"
                              >
                                <SelectTrigger
                                  className={cn(
                                    "h-10 w-10 p-0 flex items-center justify-center rounded-xl shrink-0 transition-colors shadow-xs [&>svg]:hidden border",
                                    devStyle.borderClass,
                                    devStyle.bgSubtleClass,
                                    devStyle.textClass
                                  )}
                                  title="Alterar ícone do item Dev"
                                >
                                  <Icon className="h-4 w-4" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {AVAILABLE_MENU_ICONS.map((ico) => {
                                    const IcoComp = ico.icon;
                                    return (
                                      <SelectItem key={ico.name} value={ico.name} className="text-xs">
                                        <div className="flex items-center gap-2">
                                          <IcoComp className={cn("h-3.5 w-3.5", devStyle.textClass)} />
                                          <span>{ico.label}</span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>

                              {/* Title Input & URL Input */}
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={item.title || ""}
                                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                    className="h-8 text-xs font-bold bg-background/90 border-border/70 focus:border-primary transition-colors rounded-lg shadow-2xs"
                                    placeholder="Nome exibido no menu dev..."
                                  />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 text-[0.68rem] text-muted-foreground font-mono bg-secondary/60 border border-border/60 px-1.5 py-0.5 rounded-md truncate max-w-xs">
                                    <span className={cn("font-bold text-[10px]", devStyle.textClass)}>ROTA:</span>
                                    <Input
                                      value={item.url || ""}
                                      onChange={(e) => updateItem(item.id, { url: e.target.value })}
                                      className="h-5 text-[0.68rem] font-mono bg-transparent border-0 p-0 focus-visible:ring-0 text-foreground w-40"
                                      placeholder="/dev/..."
                                    />
                                  </div>
                                  <Badge variant="outline" className="text-[9px] font-mono border-border/60 text-muted-foreground py-0">
                                    ID: {item.id}
                                  </Badge>
                                  {item.isCustom && (
                                    <Badge variant="outline" className={cn("text-[9px] font-bold py-0", devStyle.badgeClass)}>
                                      Custom
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Group: Category + Visibility + Delete */}
                            <div className="flex items-center gap-3 shrink-0 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/30 w-full md:w-auto justify-between md:justify-end">
                              {/* Category Select */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground font-medium hidden lg:inline">Cat:</span>
                                <Select
                                  value={item.category}
                                  onValueChange={(val) => updateItem(item.id, { category: val })}
                                  className="w-32 shrink-0"
                                >
                                  <SelectTrigger className="h-8 w-32 text-xs font-bold border-border/70 bg-secondary/40 rounded-lg shrink-0">
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

                              <Separator orientation="vertical" className="h-6 hidden md:block" />

                              {/* Visibility Switch */}
                              <div className="flex items-center gap-2 shrink-0 bg-secondary/30 px-2.5 py-1 rounded-lg border border-border/50">
                                {item.visible ? (
                                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                    <Eye className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-[10px]">Visível</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-[10px]">Oculto</span>
                                  </div>
                                )}
                                <Switch
                                  checked={item.visible}
                                  onCheckedChange={(checked) => updateItem(item.id, { visible: checked })}
                                  className="data-[state=checked]:bg-emerald-500 scale-90"
                                />
                              </div>

                              {/* Delete Item */}
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors"
                                title="Excluir item do menu Dev"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

        {/* Live Preview of Dev Sidebar */}
        <div className="space-y-3">
          <Card className={cn("surface-card sticky top-20", devStyle.borderClass)}>
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", devStyle.bgSubtleClass, devStyle.borderClass, devStyle.textClass)}>
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className={cn("text-sm font-bold", devStyle.textClass)}>Preview do Menu Dev</CardTitle>
                  <CardDescription className="text-[0.7rem]">Visualização em tempo real</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="rounded-xl bg-sidebar border border-sidebar-border p-3 space-y-3 shadow-inner">
                {categories.map((cat) => {
                  const catItems = grouped[cat] || [];
                  const visibleItems = catItems.filter((i) => i.visible);
                  if (visibleItems.length === 0) return null;
                  const CatIcon = resolveCategoryIcon(categoryIcons[cat], Terminal);

                  return (
                    <div key={cat}>
                      <p className={cn("text-[0.6rem] uppercase tracking-[0.2em] font-bold mb-1.5 px-1 flex items-center gap-1.5", devStyle.textClass)}>
                        <CatIcon className="h-3 w-3" />
                        {cat}
                      </p>
                      <div className="space-y-0.5">
                        {visibleItems.map((item) => {
                          const Icon = resolveMenuIcon(item.iconName, item.url);
                          const title = item.title || item.id;
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
                                devStyle.textMutedClass,
                                "hover:" + devStyle.bgSubtleClass,
                                "hover:" + devStyle.textClass
                              )}
                            >
                              <Icon className={cn("h-3.5 w-3.5 shrink-0", devStyle.textClass)} />
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

      {/* Modal para Adicionar Novo Item Dev */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className={cn("flex items-center gap-2 text-base font-bold", devStyle.textClass)}>
              <Plus className="h-5 w-5" />
              Novo Item de Menu Dev
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre um novo atalho, página ou módulo na barra lateral de ferramentas do Desenvolvedor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Título / Nome Exibido</label>
              <Input
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Ex: Documentação API ou Bot Studio"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Rota / Caminho URL</label>
              <Input
                value={newItemUrl}
                onChange={(e) => setNewItemUrl(e.target.value)}
                placeholder="Ex: /dev/bot/builder ou /dev/permissoes"
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Categoria</label>
                <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Ícone</label>
                <Select value={newItemIcon} onValueChange={setNewItemIcon}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {AVAILABLE_MENU_ICONS.map((ico) => {
                      const Ico = ico.icon;
                      return (
                        <SelectItem key={ico.name} value={ico.name} className="text-xs">
                          <div className="flex items-center gap-2">
                            <Ico className={cn("h-3.5 w-3.5", devStyle.textClass)} />
                            <span>{ico.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsAddItemOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddItem} className={cn("font-bold shadow-sm", devStyle.bgSolidClass)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar ao Menu Dev
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =========================================================================================
   GESTOR DE MENU LATERAL DO PAINEL CEO (DIRETORIA EXECUTIVA)
   ========================================================================================= */

const CEO_DEFAULT_ICONS: Record<string, typeof Crown> = {
  "/ceo/dashboard": LayoutDashboard,
  "/ceo/bot": Bot,
  "/ceo/webhooks": Webhook,
  "/ceo/financas": Landmark,
  "/ceo": Crown,
};

function CeoMenuLateralEditor() {
  const { config, save, reset } = useCeoMenuConfig();

  // Dynamic Theme state
  const [ceoTheme, setCeoTheme] = useState<PanelColor>(() => getCeoThemeColorSync());
  useEffect(() => {
    const handleConfig = (e: any) => {
      if (e?.detail?.ceoThemeColor) setCeoTheme(e.detail.ceoThemeColor);
    };
    window.addEventListener(DEV_CONFIG_EVENT, handleConfig);
    return () => window.removeEventListener(DEV_CONFIG_EVENT, handleConfig);
  }, []);
  const ceoStyle = useMemo(() => getPanelColorStyle(ceoTheme, "amber"), [ceoTheme]);

  // Categories state
  const [categories, setCategories] = useState<string[]>(() => {
    if (config?.categories && Array.isArray(config.categories) && config.categories.length > 0) {
      return config.categories;
    }
    return [...DEFAULT_CEO_CATEGORIES];
  });

  // Category Icons state
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>(() => {
    return config?.categoryIcons || {};
  });
  const [selectedNewCatIcon, setSelectedNewCatIcon] = useState<string>("Crown");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [pickingForCat, setPickingForCat] = useState<string | null>(null);

  const [newCatName, setNewCatName] = useState("");
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatText, setEditingCatText] = useState("");

  // Items state
  const [items, setItems] = useState<CeoMenuItemConfig[]>(() => {
    try {
      if (config && Array.isArray(config.items) && config.items.length > 0) {
        return sanitizeCeoConfig(config).items;
      }
    } catch (e) {
      console.error("Error parsing ceo menu config:", e);
    }
    return [...DEFAULT_CEO_MENU_ITEMS];
  });

  // Sync state when config finishes fetching remotely from Supabase
  useEffect(() => {
    if (config?.categories && Array.isArray(config.categories) && config.categories.length > 0) {
      setCategories(config.categories);
    }
    if (config?.categoryIcons) {
      setCategoryIcons(config.categoryIcons);
    }
    if (config?.items && Array.isArray(config.items) && config.items.length > 0) {
      setItems(sanitizeCeoConfig(config).items);
    }
  }, [config]);

  // Add Item Dialog State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("CEO");
  const [newItemIcon, setNewItemIcon] = useState("Crown");

  const handleAddItem = () => {
    const title = newItemTitle.trim();
    let url = newItemUrl.trim();
    if (!title) {
      toast.error("Informe o título do menu CEO!");
      return;
    }
    if (!url) {
      toast.error("Informe a rota ou URL do menu!");
      return;
    }
    if (!url.startsWith("/") && !url.startsWith("http")) {
      url = "/" + url;
    }

    const newItem: CeoMenuItemConfig = {
      id: `ceo-custom-${Date.now()}`,
      title,
      url,
      iconName: newItemIcon,
      visible: true,
      category: newItemCategory || categories[0] || "CEO",
      order: items.length,
      isCustom: true,
    };

    const nextItems = [...items, newItem];
    persist(categories, nextItems);
    setNewItemTitle("");
    setNewItemUrl("");
    setIsAddItemOpen(false);
    toast.success(`Item executivo "${title}" adicionado ao menu CEO! 👑`);
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (item.isCustom) {
      const nextItems = items.filter((i) => i.id !== id);
      persist(categories, nextItems);
      toast.success(`Item personalizado "${item.title}" removido! 👑`);
    } else {
      if (confirm(`Deseja realmente remover "${item.title}" do menu CEO? Você poderá restaurar os padrões a qualquer momento.`)) {
        const nextItems = items.filter((i) => i.id !== id);
        persist(categories, nextItems);
        toast.success(`Item "${item.title}" removido do menu CEO. 👑`);
      }
    }
  };

  // Drag and Drop state for items
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // Helper to persist state to Supabase + LocalStorage
  const persist = useCallback(
    (newCats: string[], newItems: CeoMenuItemConfig[], newIcons?: Record<string, string>) => {
      const cleanedItems = newItems.map((it, idx) => ({ ...it, order: idx }));
      const currentIcons = newIcons ?? categoryIcons;
      setCategories(newCats);
      setItems(cleanedItems);
      setCategoryIcons(currentIcons);
      save({ categories: newCats, items: cleanedItems, categoryIcons: currentIcons });
    },
    [save, categoryIcons]
  );

  /* ─── Category Icon Picker Handler ─── */
  const handleSelectIcon = (iconName: string) => {
    if (pickingForCat === null) {
      setSelectedNewCatIcon(iconName);
    } else {
      const nextIcons = { ...categoryIcons, [pickingForCat]: iconName };
      persist(categories, items, nextIcons);
      toast.success(`Ícone da categoria "${pickingForCat}" alterado! 👑`);
    }
  };

  /* ─── Category Handlers ─── */
  const handleAddCategory = () => {
    const cat = newCatName.trim();
    if (!cat) return;
    if (categories.includes(cat)) {
      toast.error("Esta categoria já existe no menu CEO!");
      return;
    }
    const nextCats = [...categories, cat];
    const nextIcons = { ...categoryIcons, [cat]: selectedNewCatIcon };
    setNewCatName("");
    persist(nextCats, items, nextIcons);
    toast.success(`Categoria CEO "${cat}" criada com sucesso! 👑`);
  };

  const handleStartEditCategory = (index: number) => {
    setEditingCatIndex(index);
    setEditingCatText(categories[index] || "");
  };

  const handleSaveEditCategory = (index: number) => {
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

    const nextItems = items.map((i) => (i.category === oldName ? { ...i, category: newName } : i));
    const nextIcons = { ...categoryIcons };
    if (nextIcons[oldName]) {
      nextIcons[newName] = nextIcons[oldName];
      delete nextIcons[oldName];
    }

    setEditingCatIndex(null);
    persist(nextCats, nextItems, nextIcons);
    toast.success(`Categoria CEO alterada para "${newName}"! 👑`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      toast.error("Você deve ter pelo menos 1 categoria no menu CEO!");
      return;
    }

    const nextCats = categories.filter((c) => c !== catToDelete);
    const fallbackCat = nextCats[0] || "CEO";

    const nextItems = items.map((i) => (i.category === catToDelete ? { ...i, category: fallbackCat } : i));
    const nextIcons = { ...categoryIcons };
    delete nextIcons[catToDelete];

    persist(nextCats, nextItems, nextIcons);
    toast.success(`Categoria "${catToDelete}" removida! Itens movidos para "${fallbackCat}".`);
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const nextCats = [...categories];
    [nextCats[index], nextCats[targetIndex]] = [nextCats[targetIndex], nextCats[index]];

    persist(nextCats, items);
    toast.success("Ordem das categorias CEO atualizada! 👑");
  };

  // Category Drag and Drop state
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [dragOverCatIdx, setDragOverCatIdx] = useState<number | null>(null);

  const handleCatDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCatIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `ceocat-${index}`);
  };

  const handleCatDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCatIdx === null || draggedCatIdx === index) return;
    setDragOverCatIdx(index);
  };

  const handleCatDragLeave = () => {
    setDragOverCatIdx(null);
  };

  const handleCatDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    setDragOverCatIdx(null);
    if (draggedCatIdx === null || draggedCatIdx === targetIdx) {
      setDraggedCatIdx(null);
      return;
    }

    const nextCats = [...categories];
    const [removed] = nextCats.splice(draggedCatIdx, 1);
    nextCats.splice(targetIdx, 0, removed);

    setDraggedCatIdx(null);
    persist(nextCats, items);
    toast.success(`Categoria CEO "${removed}" reposicionada! 👑`);
  };

  /* ─── Item Handlers ─── */
  const updateItem = (itemId: string, patch: Partial<CeoMenuItemConfig>) => {
    const next = items.map((i) => (i.id === itemId ? { ...i, ...patch } : i));
    persist(categories, next);
  };

  const moveItemWithinCategory = (itemId: string, direction: "up" | "down") => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const cat = item.category || "CEO";

    const catItems = items
      .filter((i) => (i.category || "CEO") === cat)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const currentIdx = catItems.findIndex((i) => i.id === itemId);
    const targetIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= catItems.length) return;

    const swapTarget = catItems[targetIdx];

    const currentItemGlobalIdx = items.findIndex((i) => i.id === itemId);
    const swapTargetGlobalIdx = items.findIndex((i) => i.id === swapTarget.id);

    const next = [...items];
    const tempOrder = next[currentItemGlobalIdx].order;
    next[currentItemGlobalIdx].order = next[swapTargetGlobalIdx].order;
    next[swapTargetGlobalIdx].order = tempOrder;

    persist(categories, next);
    toast.success("Ordem do item CEO atualizada! 👑");
  };

  const handleReset = async () => {
    if (confirm("Tem certeza que deseja restaurar as configurações padrão do menu lateral do CEO?")) {
      await reset();
      setCategories([...DEFAULT_CEO_CATEGORIES]);
      setItems([...DEFAULT_CEO_MENU_ITEMS]);
      setCategoryIcons({});
      toast.success("Menu lateral do CEO restaurado para os padrões originais! 👑");
    }
  };

  // Drag and Drop for Items
  const handleItemDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleItemDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (draggedItemId === null || draggedItemId === itemId) return;
    setDragOverItemId(itemId);
  };

  const handleItemDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleItemDrop = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    setDragOverItemId(null);
    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null);
      return;
    }

    const draggedItem = items.find((i) => i.id === draggedItemId);
    const targetItem = items.find((i) => i.id === targetItemId);
    if (!draggedItem || !targetItem) {
      setDraggedItemId(null);
      return;
    }

    let next = items.filter((i) => i.id !== draggedItemId);
    const targetIndex = next.findIndex((i) => i.id === targetItemId);

    const updatedDragged = {
      ...draggedItem,
      category: targetItem.category || "CEO",
    };

    next.splice(targetIndex, 0, updatedDragged);

    setDraggedItemId(null);
    persist(categories, next);
    toast.success(`Item CEO "${draggedItem.title}" reordenado! 👑`);
  };

  // Group items by category for preview
  const grouped = useMemo(() => {
    const groups: Record<string, CeoMenuItemConfig[]> = {};
    categories.forEach((cat) => {
      groups[cat] = items.filter((item) => (item.category || "CEO") === cat);
    });
    items.forEach((item) => {
      const cat = item.category || "CEO";
      if (!groups[cat]) groups[cat] = [item];
    });
    return groups;
  }, [categories, items]);

  return (
    <div className="space-y-6">
      {/* Modal de Escolha de Ícone para Categoria CEO */}
      <CategoryIconPickerModal
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        selectedIcon={pickingForCat ? (categoryIcons[pickingForCat] || "Crown") : selectedNewCatIcon}
        onSelectIcon={handleSelectIcon}
        panelColor={ceoTheme}
        title={pickingForCat ? `Ícone da Categoria CEO: ${pickingForCat}` : "Escolher Ícone da Nova Categoria CEO"}
      />

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <Crown className={cn("h-5 w-5", ceoStyle.textClass)} />
            Configuração do Menu Lateral — Painel CEO
          </h3>
          <p className="text-xs text-muted-foreground">
            Personalize a ordem, títulos, categorias, ícones e visibilidade dos menus exclusivos da diretoria executiva.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9 text-xs gap-1.5 font-bold border-border/80 hover:bg-secondary/60"
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            Restaurar Padrão CEO
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setNewItemCategory(categories[0] || "CEO");
              setIsAddItemOpen(true);
            }}
            className={cn("h-9 text-xs gap-1.5 font-bold border", ceoStyle.borderClass, ceoStyle.bgSubtleClass, ceoStyle.textClass)}
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Item CEO
          </Button>

          <Button
            size="sm"
            onClick={() => {
              persist(categories, items);
              toast.success("Configuração do Menu Lateral do CEO salva no Supabase! 👑");
            }}
            className={cn("h-9 text-xs gap-1.5 font-bold shadow-sm", ceoStyle.bgSolidClass)}
          >
            <Save className="h-3.5 w-3.5" />
            Salvar Menu CEO
          </Button>

          <Badge className={cn("text-xs gap-1 py-1 px-3", ceoStyle.badgeClass)}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Supabase Live · {ceoStyle.label.split(" ")[0]}
          </Badge>
        </div>
      </div>

      {/* Category Management Section */}
      <Card className={cn("surface-card", ceoStyle.borderClass)}>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", ceoStyle.bgSubtleClass, ceoStyle.borderClass, ceoStyle.textClass)}>
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className={cn("text-sm font-bold", ceoStyle.textClass)}>Categorias do Menu CEO</CardTitle>
                <CardDescription className="text-[0.7rem]">
                  Crie, renomeie, defina ícones e arraste os cards para reorganizar as seções do painel executivo
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={cn("text-[10px] font-mono gap-1", ceoStyle.badgeClass)}>
              <Move className="h-3 w-3" /> Drag & Drop Ativo ({categories.length})
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat, idx) => {
              const isEditing = editingCatIndex === idx;
              const itemCount = items.filter((i) => (i.category || "CEO") === cat).length;
              const isDraggingCat = draggedCatIdx === idx;
              const isOverCat = dragOverCatIdx === idx;
              const CatIcon = resolveCategoryIcon(categoryIcons[cat], Crown);

              return (
                <div
                  key={cat}
                  draggable={!isEditing}
                  onDragStart={(e) => handleCatDragStart(e, idx)}
                  onDragOver={(e) => handleCatDragOver(e, idx)}
                  onDragLeave={handleCatDragLeave}
                  onDrop={(e) => handleCatDrop(e, idx)}
                  className={cn(
                    "flex items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/50 transition-all",
                    !isEditing && cn("cursor-grab active:cursor-grabbing", ceoStyle.borderHoverClass),
                    isDraggingCat && cn("opacity-30 scale-95 border-dashed", ceoStyle.borderClass),
                    isOverCat && cn(ceoStyle.borderClass, ceoStyle.bgSubtleClass, "shadow-lg scale-[1.01]")
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
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        
                        {/* Category Icon Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPickingForCat(cat);
                            setIconPickerOpen(true);
                          }}
                          className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center border shrink-0 transition-all hover:scale-110 shadow-2xs",
                            ceoStyle.bgSubtleClass,
                            ceoStyle.borderClass,
                            ceoStyle.textClass
                          )}
                          title="Clique para alterar o ícone desta categoria CEO"
                        >
                          <CatIcon className="h-3.5 w-3.5" />
                        </button>

                        <span className="text-xs font-black text-foreground truncate">{cat}</span>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 font-mono text-muted-foreground">
                          {itemCount}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, "up")}
                          disabled={idx === 0}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Mover categoria para cima"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, "down")}
                          disabled={idx === categories.length - 1}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Mover categoria para baixo"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(idx)}
                          className={cn("h-6 w-6 flex items-center justify-center rounded text-muted-foreground disabled:opacity-20", "hover:" + ceoStyle.textClass)}
                          title="Editar nome da categoria"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
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
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
            {/* New Category Icon Selector */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPickingForCat(null);
                setIconPickerOpen(true);
              }}
              className={cn("h-9 gap-1.5 px-3 text-xs font-bold border-border/60", ceoStyle.bgSubtleClass, ceoStyle.textClass)}
              title="Escolher ícone para a nova categoria CEO"
            >
              {(() => {
                const Ico = resolveCategoryIcon(selectedNewCatIcon, Crown);
                return <Ico className="h-4 w-4" />;
              })()}
              <span className="hidden sm:inline">Ícone: {selectedNewCatIcon}</span>
            </Button>

            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="Nome da nova categoria CEO (ex: Estratégico, Auditoria)..."
              className="h-9 text-xs bg-secondary/50 border-border/60 max-w-sm flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className={cn("h-9 text-xs gap-1.5 font-bold shadow-sm", ceoStyle.bgSolidClass)}
            >
              <Plus className="h-3.5 w-3.5" />
              Criar Categoria CEO
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Editor & Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Menu Items Editor - Grouped by Category */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-card border border-border/60">
            <div className="flex items-center gap-2">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", ceoStyle.bgSubtleClass, ceoStyle.borderClass, ceoStyle.textClass)}>
                <Menu className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Itens do Menu CEO por Categoria</h4>
                <p className="text-[0.7rem] text-muted-foreground">
                  {items.length} itens no total · {items.filter((i) => i.visible).length} visíveis na navegação da diretoria
                </p>
              </div>
            </div>
            <Badge variant="outline" className={cn("text-[10px] gap-1", ceoStyle.badgeClass)}>
              <Move className="h-3 w-3" /> Arraste para Reordenar
            </Badge>
          </div>

          {categories.map((cat) => {
            const catItems = items
              .filter((i) => (i.category || "CEO") === cat)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const CatIcon = resolveCategoryIcon(categoryIcons[cat], Crown);

            return (
              <Card key={cat} className="surface-card border-border/60">
                <CardHeader className="pb-2 pt-3 px-4 border-b border-border/40 bg-secondary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CatIcon className={cn("h-4 w-4", ceoStyle.textClass)} />
                      <CardTitle className="text-xs font-bold text-foreground">
                        Categoria CEO: <span className={cn("font-extrabold", ceoStyle.textClass)}>{cat}</span>
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] font-mono", ceoStyle.badgeClass)}>
                      {catItems.length} {catItems.length === 1 ? "item" : "itens"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-3">
                  {catItems.length === 0 ? (
                    <p className="text-[0.75rem] text-muted-foreground italic py-3 text-center">
                      Nenhum item nesta categoria. Selecione esta categoria em um dos itens abaixo para movê-lo para cá.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {catItems.map((item, itemIdxInCat) => {
                        const ItemIcon = resolveMenuIcon(item.iconName, item.url);
                        const isDragging = draggedItemId === item.id;
                        const isDragOver = dragOverItemId === item.id;

                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleItemDragStart(e, item.id)}
                            onDragOver={(e) => handleItemDragOver(e, item.id)}
                            onDragLeave={handleItemDragLeave}
                            onDrop={(e) => handleItemDrop(e, item.id)}
                            className={cn(
                              "flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing",
                              item.visible
                                ? cn("bg-card/60 border-border/70 shadow-xs hover:bg-card/80", ceoStyle.borderHoverClass)
                                : "bg-secondary/20 border-border/30 opacity-60",
                              isDragging && cn("opacity-30 scale-95 border-dashed", ceoStyle.borderClass),
                              isDragOver && cn(ceoStyle.borderClass, ceoStyle.bgSubtleClass, "shadow-lg scale-[1.01]")
                            )}
                          >
                            {/* Left Group: Controls + Icon + Title Input */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Drag Handle & Arrows */}
                              <div className="flex flex-col items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveItemWithinCategory(item.id, "up")}
                                  disabled={itemIdxInCat === 0}
                                  className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Mover para cima"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <GripVertical className={cn("h-4 w-4 text-muted-foreground/60 cursor-grab", "hover:" + ceoStyle.textClass)} />
                                <button
                                  type="button"
                                  onClick={() => moveItemWithinCategory(item.id, "down")}
                                  disabled={itemIdxInCat === catItems.length - 1}
                                  className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Mover para baixo"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Seletor de Ícone */}
                              <Select
                                value={item.iconName || "LayoutDashboard"}
                                onValueChange={(iconVal) => updateItem(item.id, { iconName: iconVal })}
                                className="w-auto shrink-0"
                              >
                                <SelectTrigger
                                  className={cn(
                                    "h-10 w-10 p-0 flex items-center justify-center rounded-xl shrink-0 transition-colors shadow-xs [&>svg]:hidden border",
                                    ceoStyle.borderClass,
                                    ceoStyle.bgSubtleClass,
                                    ceoStyle.textClass
                                  )}
                                  title="Alterar ícone do item"
                                >
                                  <ItemIcon className="h-4 w-4" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {AVAILABLE_MENU_ICONS.map((ico) => {
                                    const IcoComp = ico.icon;
                                    return (
                                      <SelectItem key={ico.name} value={ico.name} className="text-xs">
                                        <div className="flex items-center gap-2">
                                          <IcoComp className={cn("h-3.5 w-3.5", ceoStyle.textClass)} />
                                          <span>{ico.label}</span>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>

                              {/* Title Input & URL Info */}
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={item.title || ""}
                                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                    className="h-8 text-xs font-bold bg-background/90 border-border/70 focus:border-primary transition-colors rounded-lg shadow-2xs"
                                    placeholder="Nome exibido no menu..."
                                  />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 text-[0.68rem] text-muted-foreground font-mono bg-secondary/60 border border-border/60 px-1.5 py-0.5 rounded-md truncate max-w-xs">
                                    <span className={cn("font-bold text-[10px]", ceoStyle.textClass)}>ROTA:</span>
                                    <Input
                                      value={item.url || ""}
                                      onChange={(e) => updateItem(item.id, { url: e.target.value })}
                                      className="h-5 text-[0.68rem] font-mono bg-transparent border-0 p-0 focus-visible:ring-0 text-foreground w-40"
                                      placeholder="/ceo/..."
                                    />
                                  </div>
                                  <Badge variant="outline" className="text-[9px] font-mono border-border/60 text-muted-foreground py-0">
                                    ID: {item.id}
                                  </Badge>
                                  {item.isCustom && (
                                    <Badge variant="outline" className={cn("text-[9px] font-bold py-0", ceoStyle.badgeClass)}>
                                      Custom
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Group: Category + Visibility + Delete */}
                            <div className="flex items-center gap-3 shrink-0 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-border/30 w-full md:w-auto justify-between md:justify-end">
                              {/* Category Select */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground font-medium hidden lg:inline">Cat:</span>
                                <Select
                                  value={item.category || "CEO"}
                                  onValueChange={(val) => updateItem(item.id, { category: val })}
                                  className="w-32 shrink-0"
                                >
                                  <SelectTrigger className="h-8 w-32 text-xs font-bold border-border/70 bg-secondary/40 rounded-lg shrink-0">
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

                              <Separator orientation="vertical" className="h-6 hidden md:block" />

                              {/* Visibility Switch */}
                              <div className="flex items-center gap-2 shrink-0 bg-secondary/30 px-2.5 py-1 rounded-lg border border-border/50">
                                {item.visible ? (
                                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                    <Eye className="h-3.5 w-3.5 text-emerald-400" />
                                    <span className="text-[10px]">Visível</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-muted-foreground text-xs font-medium">
                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-[10px]">Oculto</span>
                                  </div>
                                )}
                                <Switch
                                  checked={item.visible}
                                  onCheckedChange={(checked) => updateItem(item.id, { visible: checked })}
                                  className="data-[state=checked]:bg-emerald-500 scale-90"
                                />
                              </div>

                              {/* Delete Item */}
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors"
                                title="Excluir item do menu CEO"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

        {/* Live Preview of CEO Sidebar */}
        <div className="space-y-3">
          <Card className={cn("surface-card sticky top-20", ceoStyle.borderClass)}>
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", ceoStyle.bgSubtleClass, ceoStyle.borderClass, ceoStyle.textClass)}>
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className={cn("text-sm font-bold", ceoStyle.textClass)}>Preview do Menu CEO</CardTitle>
                    <CardDescription className="text-[0.7rem]">Visualização em tempo real</CardDescription>
                  </div>
                </div>
                <Badge className={cn("text-[9px] font-bold uppercase", ceoStyle.badgeClass)}>
                  👑 Diretoria
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-3">
              <div className={cn("rounded-xl bg-sidebar border p-3 space-y-3 shadow-inner", ceoStyle.borderSubtleClass)}>
                {categories.map((cat) => {
                  const catItems = grouped[cat] || [];
                  const visibleItems = catItems.filter((i) => i.visible);
                  if (visibleItems.length === 0) return null;
                  const CatIcon = resolveCategoryIcon(categoryIcons[cat], Crown);

                  return (
                    <div key={cat}>
                      <p className={cn("text-[0.6rem] uppercase tracking-[0.2em] font-black mb-1.5 px-1 flex items-center gap-1.5", ceoStyle.textClass)}>
                        <CatIcon className="h-3 w-3" />
                        {cat}
                      </p>
                      <div className="space-y-0.5">
                        {visibleItems.map((item) => {
                          const Icon = resolveMenuIcon(item.iconName, item.url);
                          const title = item.title || item.id;
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
                                ceoStyle.textMutedClass,
                                "hover:" + ceoStyle.bgSubtleClass,
                                "hover:" + ceoStyle.textClass
                              )}
                            >
                              <Icon className={cn("h-3.5 w-3.5 shrink-0", ceoStyle.textClass)} />
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

      {/* Modal para Adicionar Novo Item CEO */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className={cn("flex items-center gap-2 text-base font-bold", ceoStyle.textClass)}>
              <Plus className="h-5 w-5" />
              Novo Item de Menu CEO
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre um novo atalho, página ou módulo na barra lateral da Diretoria Executiva.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Título / Nome Exibido</label>
              <Input
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Ex: Auditoria Geral ou Relatórios"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Rota / Caminho URL</label>
              <Input
                value={newItemUrl}
                onChange={(e) => setNewItemUrl(e.target.value)}
                placeholder="Ex: /ceo/relatorios ou /ceo/auditoria"
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Categoria</label>
                <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Ícone</label>
                <Select value={newItemIcon} onValueChange={setNewItemIcon}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {AVAILABLE_MENU_ICONS.map((ico) => {
                      const Ico = ico.icon;
                      return (
                        <SelectItem key={ico.name} value={ico.name} className="text-xs">
                          <div className="flex items-center gap-2">
                            <Ico className={cn("h-3.5 w-3.5", ceoStyle.textClass)} />
                            <span>{ico.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsAddItemOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAddItem} className={cn("font-bold shadow-sm", ceoStyle.bgSolidClass)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar ao Menu CEO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =========================================================================================
   ORQUESTRADOR PRINCIPAL COM SELETOR DE ABAS [ DEV TOOLS ] vs [ PAINEL CEO ]
   ========================================================================================= */

function DevMenuLateralContent() {
  const [activeTab, setActiveTab] = useUrlTab<"dev" | "ceo">("dev", {
    allowedTabs: ["dev", "ceo"] as const,
    usePath: false,
    paramName: "tab",
  });

  const [devTheme, setDevTheme] = useState<PanelColor>(() => getDevThemeColorSync());
  const [ceoTheme, setCeoTheme] = useState<PanelColor>(() => getCeoThemeColorSync());

  useEffect(() => {
    const handleConfig = (e: any) => {
      if (e?.detail) {
        if (e.detail.devThemeColor) setDevTheme(e.detail.devThemeColor);
        if (e.detail.ceoThemeColor) setCeoTheme(e.detail.ceoThemeColor);
      }
    };
    window.addEventListener(DEV_CONFIG_EVENT, handleConfig);
    return () => window.removeEventListener(DEV_CONFIG_EVENT, handleConfig);
  }, []);

  const devStyle = useMemo(() => getPanelColorStyle(devTheme, "rose"), [devTheme]);
  const ceoStyle = useMemo(() => getPanelColorStyle(ceoTheme, "amber"), [ceoTheme]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* HEADER DA PÁGINA COM SELETOR DE ABAS DEV / CEO */}
      <PageHeader
        title="Gestão de Menus Laterais — Dev & CEO"
        description="Personalize a ordem, categorias, nomes, ícones e visibilidade dos menus exclusivos da Tag Desenvolvedor e da Tag CEO."
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn("font-mono font-bold text-xs px-2.5 py-1 flex items-center gap-1.5 shadow-sm", devStyle.badgeClass)}
            >
              <Terminal className="h-3.5 w-3.5 animate-pulse" />
              Navigation Architecture
            </Badge>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <TabsList className="flex bg-secondary/30 border border-border/60 p-1.5 rounded-2xl flex-wrap h-auto gap-2 shadow-sm">
          <TabsTrigger
            value="dev"
            className={cn(
              "text-xs font-bold gap-2 py-2.5 px-4 rounded-xl transition-all cursor-pointer",
              activeTab === "dev" ? cn(devStyle.bgSolidClass, "shadow-md") : "hover:bg-secondary/50 text-muted-foreground"
            )}
          >
            <Terminal className="h-4 w-4" />
            Menu Dev Tools
            <Badge className={cn("text-[9px] py-0 px-1.5 font-extrabold border ml-1", activeTab === "dev" ? "bg-white/20 text-white border-white/30" : devStyle.badgeClass)}>
              Dev
            </Badge>
          </TabsTrigger>

          <TabsTrigger
            value="ceo"
            className={cn(
              "text-xs font-bold gap-2 py-2.5 px-4 rounded-xl transition-all cursor-pointer",
              activeTab === "ceo" ? cn(ceoStyle.bgSolidClass, "shadow-md") : "hover:bg-secondary/50 text-muted-foreground"
            )}
          >
            <Crown className="h-4 w-4" />
            Menu Painel CEO
            <Badge className={cn("text-[9px] py-0 px-1.5 font-extrabold border ml-1", activeTab === "ceo" ? "bg-black/20 text-black border-black/30" : ceoStyle.badgeClass)}>
              Diretoria
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dev" className="space-y-6">
          <DevToolsMenuEditor />
        </TabsContent>

        <TabsContent value="ceo" className="space-y-6">
          <CeoMenuLateralEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}

