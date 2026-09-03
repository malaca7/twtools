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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui-kit";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { cn } from "@/lib/utils";
import {
  useDevMenuConfig,
  DEFAULT_DEV_MENU_ITEMS,
  DEFAULT_DEV_CATEGORIES,
  type DevMenuItemConfig,
} from "@/hooks/useDevMenuConfig";

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
  "/dev/desempenho": TrendingUp,
  "/dev/permissoes": KeyRound,
  "/dev/configuracao": Code2,
  "/dev/menu-lateral": Sliders,
};

function DevMenuLateralContent() {
  const { config, save, reset } = useDevMenuConfig();

  // Categories state
  const [categories, setCategories] = useState<string[]>(() => {
    if (config?.categories && Array.isArray(config.categories) && config.categories.length > 0) {
      return config.categories;
    }
    return [...DEFAULT_DEV_CATEGORIES];
  });

  const [newCatName, setNewCatName] = useState("");
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatText, setEditingCatText] = useState("");

  // Items state
  const [items, setItems] = useState<DevMenuItemConfig[]>(() => {
    try {
      if (config && Array.isArray(config.items) && config.items.length > 0) {
        const savedMap = new Map<string, DevMenuItemConfig>();
        config.items.forEach((item) => {
          if (item && typeof item === "object" && item.id) {
            savedMap.set(item.id, item);
          }
        });

        const merged = DEFAULT_DEV_MENU_ITEMS.map((def, defaultIdx) => {
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
      console.error("Error parsing dev menu config:", e);
    }
    return [...DEFAULT_DEV_MENU_ITEMS];
  });

  // Sync state when config finishes fetching remotely from Supabase
  useEffect(() => {
    if (config?.categories && Array.isArray(config.categories) && config.categories.length > 0) {
      setCategories(config.categories);
    }
    if (config?.items && Array.isArray(config.items) && config.items.length > 0) {
      const savedMap = new Map<string, DevMenuItemConfig>();
      config.items.forEach((item) => {
        if (item && typeof item === "object" && item.id) {
          savedMap.set(item.id, item);
        }
      });

      const merged = DEFAULT_DEV_MENU_ITEMS.map((def, defaultIdx) => {
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

  // Drag and Drop state for items
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // Helper to persist state to Supabase + LocalStorage
  const persist = useCallback(
    (newCats: string[], newItems: DevMenuItemConfig[]) => {
      // Re-index orders sequentially
      const cleanedItems = newItems.map((it, idx) => ({ ...it, order: idx }));
      setCategories(newCats);
      setItems(cleanedItems);
      save({ categories: newCats, items: cleanedItems });
    },
    [save]
  );

  /* ─── Category Handlers ─── */
  const handleAddCategory = () => {
    const cat = newCatName.trim();
    if (!cat) return;
    if (categories.includes(cat)) {
      toast.error("Esta categoria já existe no menu Dev!");
      return;
    }
    const nextCats = [...categories, cat];
    setNewCatName("");
    persist(nextCats, items);
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

    setEditingCatIndex(null);
    persist(nextCats, nextItems);
    toast.success(`Categoria alterada para "${newName}"!`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      toast.error("Você deve ter pelo menos 1 categoria no menu Dev!");
      return;
    }

    const nextCats = categories.filter((c) => c !== catToDelete);
    const fallbackCat = nextCats[0] || "Ferramentas Dev";

    const nextItems = items.map((i) => (i.category === catToDelete ? { ...i, category: fallbackCat } : i));

    persist(nextCats, nextItems);
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

      const cat = currentItem.category || "Ferramentas Dev";
      const catItems = items.filter((i) => (i.category || "Ferramentas Dev") === cat);
      const indexInCat = catItems.findIndex((i) => i.id === id);
      if (indexInCat < 0) return;

      const targetIndexInCat = direction === "up" ? indexInCat - 1 : indexInCat + 1;
      if (targetIndexInCat < 0 || targetIndexInCat >= catItems.length) return;

      const otherItem = catItems[targetIndexInCat];
      if (!otherItem) return;

      // Swap positions of currentItem and otherItem in the items array
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

    // Update dragged item's category to match the target's category
    const updatedDraggedItem = {
      ...draggedItem,
      category: targetItem.category || "Ferramentas Dev",
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
      groups[cat] = items.filter((item) => (item.category || "Ferramentas Dev") === cat);
    });
    items.forEach((item) => {
      const cat = item.category || "Ferramentas Dev";
      if (!groups[cat]) groups[cat] = [item];
    });
    return groups;
  }, [categories, items]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Dev Tools → Menu Lateral"
          description="Personalize a ordem, categorias, nomes e visibilidade dos menus exclusivos da barra de ferramentas do Desenvolvedor."
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-rose-500/50 bg-rose-500/10 text-rose-400 font-mono font-bold text-xs px-2.5 py-1 flex items-center gap-1.5 shadow-sm"
            >
              <Terminal className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
              CONFIGURAÇÃO DEV
            </Badge>
          </div>
        </PageHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-9 text-xs gap-1.5 font-bold border-border/80"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs gap-1 py-1 px-3">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sincronizado ao vivo
          </Badge>
        </div>
      </div>

      {/* Category Management Section */}
      <Card className="surface-card border-rose-500/30">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-rose-300">Categorias da Barra Dev</CardTitle>
                <CardDescription className="text-[0.7rem]">
                  Crie, edite, apague e arraste os cards para alterar a ordem das categorias do menu dev
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono gap-1 border-rose-500/40 text-rose-300">
              <Move className="h-3 w-3" /> Drag & Drop Ativo ({categories.length})
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat, idx) => {
              const isEditing = editingCatIndex === idx;
              const itemCount = items.filter((i) => (i.category || "Ferramentas Dev") === cat).length;
              const isDraggingCat = draggedCatIdx === idx;
              const isOverCat = dragOverCatIdx === idx;

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
                    !isEditing && "cursor-grab active:cursor-grabbing hover:border-rose-500/40",
                    isDraggingCat && "opacity-30 scale-95 border-dashed border-rose-500",
                    isOverCat && "border-rose-500 bg-rose-500/10 shadow-lg scale-[1.01]"
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
                        <GripVertical className="h-4 w-4 text-muted-foreground/60 hover:text-rose-400 cursor-grab shrink-0" />
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
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-rose-400 disabled:opacity-20"
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
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Input
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="Nome da nova categoria Dev..."
              className="h-9 text-xs bg-secondary/50 border-border/60 max-w-sm"
            />
            <Button
              size="sm"
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className="h-9 text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold"
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Menu className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Itens do Menu Dev Agrupados por Categoria</h4>
                <p className="text-[0.7rem] text-muted-foreground">
                  {items.length} itens no total · {items.filter((i) => i.visible).length} visíveis na navegação dev
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] gap-1 border-rose-500/40 text-rose-300">
              <Move className="h-3 w-3" /> Arraste para Reordenar
            </Badge>
          </div>

          {categories.map((cat) => {
            const catItems = items
              .filter((i) => (i.category || "Ferramentas Dev") === cat)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return (
              <Card key={cat} className="surface-card border-border/60">
                <CardHeader className="pb-2 pt-3 px-4 border-b border-border/40 bg-secondary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4 text-rose-400" />
                      <CardTitle className="text-xs font-bold text-foreground">
                        Categoria Dev: <span className="text-rose-400 font-extrabold">{cat}</span>
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-300 bg-rose-500/5">
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
                        const Icon = DEV_ICON_MAP[item.url] || Terminal;
                        const title = item.title || item.id;
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
                              "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing",
                              item.visible
                                ? "bg-card/40 border-border/60 shadow-sm hover:border-rose-500/40"
                                : "bg-secondary/20 border-border/30 opacity-50",
                              isDragging && "opacity-30 scale-95 border-dashed border-rose-500",
                              isDragOver && "border-rose-500 bg-rose-500/10 shadow-lg scale-[1.01]"
                            )}
                          >
                            {/* Left Group: Controls + Icon + Title */}
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
                                <GripVertical className="h-4 w-4 text-muted-foreground/60 hover:text-rose-400 cursor-grab" />
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

                              {/* Icon */}
                              <div
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 transition-colors shadow-sm",
                                  item.visible
                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                    : "bg-secondary/50 border-border/40 text-muted-foreground"
                                )}
                              >
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
                              >
                                <SelectTrigger className="h-7 w-32 text-[10px] font-bold border-border/60 bg-secondary/40 shrink-0">
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

        {/* Live Preview of Dev Sidebar */}
        <div className="space-y-3">
          <Card className="surface-card sticky top-20 border-rose-500/30">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-rose-300">Preview do Menu Dev</CardTitle>
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
                      <p className="text-[0.6rem] uppercase tracking-[0.2em] text-rose-400 font-bold mb-1.5 px-1 flex items-center gap-1">
                        <Terminal className="h-2.5 w-2.5" />
                        {cat}
                      </p>
                      <div className="space-y-0.5">
                        {visibleItems.map((item) => {
                          const Icon = DEV_ICON_MAP[item.url] || Terminal;
                          const title = item.title || item.id;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-rose-300 hover:bg-rose-500/10 transition-colors"
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0 text-rose-400" />
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
