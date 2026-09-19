import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Menu,
  Plus,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Lock,
  Tag,
  Move,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit3,
  Trash2,
  Check,
  X,
  FolderTree,
  ExternalLink,
  MousePointerClick as SelectIcon,
  Monitor,
  Eye,
  EyeOff,
  Undo2,
  Layers,
  Terminal,
  Crown,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useMenuConfig,
  DEFAULT_MENU_CATEGORIES,
  DEFAULT_MENU_ITEMS,
  PLATFORM_SYSTEM_MODULES,
  syncMenuConfig,
  type MenuItemConfig,
  type PlatformSystemModule,
} from "@/hooks/useMenuConfig";
import { AVAILABLE_MENU_ICONS, resolveMenuIcon } from "@/lib/menuIcons";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface PlatformMenuEditorProps {
  canEdit?: boolean;
  showDevNavigationLinks?: boolean;
}

export function PlatformMenuEditor({
  canEdit: canEditProp,
  showDevNavigationLinks = true,
}: PlatformMenuEditorProps) {
  const { config, save, reset } = useMenuConfig();
  const { hasPermission, isDevUser, isCeoUser, level } = useAuth();

  // Permission calculation: fallback to canEditProp or auth checks
  const isLeaderOrAdmin =
    level === "desenvolvedor" ||
    level === "01" ||
    level === "02" ||
    level === "gerente";

  const userCanEdit =
    canEditProp ??
    (isLeaderOrAdmin ||
      hasPermission("manage_permissions") ||
      hasPermission("manage_roles") ||
      hasPermission("manage_menu_settings") ||
      hasPermission("manage_platform_settings"));

  // Categories state
  const [categories, setCategories] = useState<string[]>(
    () => config.categories || DEFAULT_MENU_CATEGORIES
  );
  const [newCatName, setNewCatName] = useState("");
  const [editingCatIndex, setEditingCatIndex] = useState<number | null>(null);
  const [editingCatText, setEditingCatText] = useState("");

  // Items state
  const [items, setItems] = useState<MenuItemConfig[]>(
    () => config.items || DEFAULT_MENU_ITEMS
  );
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>(
    () => config.deletedItemIds || []
  );

  // Restore category selector state for each deleted item
  const [restoreCategoryMap, setRestoreCategoryMap] = useState<Record<string, string>>({});

  // Modal State: Create Menu
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [selectedSystemModuleId, setSelectedSystemModuleId] = useState<string>("custom");
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

  // Drag and Drop state for categories
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [dragOverCatIdx, setDragOverCatIdx] = useState<number | null>(null);

  // Synchronize state when external config updates
  useEffect(() => {
    if (config) {
      setCategories(config.categories || DEFAULT_MENU_CATEGORIES);
      setItems(config.items || DEFAULT_MENU_ITEMS);
      if (config.deletedItemIds) {
        setDeletedItemIds(config.deletedItemIds);
      }
    }
  }, [config]);

  // Master persistent reordering function
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

      // Sequential 0, 1, 2, ... indexing
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
    if (!userCanEdit || !newCatName.trim()) return;
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
    if (!userCanEdit) return;
    setEditingCatIndex(index);
    setEditingCatText(categories[index] || "");
  };

  const handleSaveEditCategory = (index: number) => {
    if (!userCanEdit) return;
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
    const nextItems = items.map((i) =>
      i.category === oldName ? { ...i, category: newName } : i
    );

    setEditingCatIndex(null);
    reorderAndPersist(nextCats, nextItems);
    toast.success(`Categoria alterada para "${newName}"!`);
  };

  const handleConfirmDeleteCategory = () => {
    if (!userCanEdit || !catToDelete) return;
    if (categories.length <= 1) {
      toast.error("Você deve ter pelo menos 1 categoria no menu!");
      setCatToDelete(null);
      return;
    }

    const targetCat = catToDelete;
    const nextCats = categories.filter((c) => c !== targetCat);
    const fallbackCat = nextCats[0] || "Gestão";

    // Move items in deleted category to fallback category
    const nextItems = items.map((i) =>
      i.category === targetCat ? { ...i, category: fallbackCat } : i
    );

    reorderAndPersist(nextCats, nextItems);
    setCatToDelete(null);
    toast.success(
      `Categoria "${targetCat}" excluída! Itens vinculados foram movidos para "${fallbackCat}".`
    );
  };

  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    if (!userCanEdit) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const nextCats = [...categories];
    [nextCats[index], nextCats[targetIndex]] = [nextCats[targetIndex], nextCats[index]];

    reorderAndPersist(nextCats, items);
    toast.success("Ordem das categorias atualizada!");
  };

  const handleCatDragStart = (e: React.DragEvent, index: number) => {
    if (!userCanEdit) return;
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
    if (!draggedItemId || !userCanEdit) return;
    e.preventDefault();
    setDragOverCatName(cat);
  };

  const handleCategoryCardDragLeave = () => {
    setDragOverCatName(null);
  };

  const handleCategoryCardDrop = (e: React.DragEvent, targetCat: string) => {
    e.preventDefault();
    setDragOverCatName(null);
    if (!draggedItemId || !userCanEdit) return;

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
      if (!userCanEdit) return;
      const nextItems = items.map((item) => (item.id === id ? { ...item, ...updates } : item));
      let nextCats = categories;
      if (updates.category && !categories.includes(updates.category)) {
        nextCats = [...categories, updates.category];
      }
      reorderAndPersist(nextCats, nextItems);
    },
    [userCanEdit, categories, items, reorderAndPersist]
  );

  const moveItemWithinCategory = useCallback(
    (id: string, direction: "up" | "down") => {
      if (!userCanEdit) return;
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

      const nextCatItems = [...catItems];
      [nextCatItems[idxInCat], nextCatItems[targetIdxInCat]] = [
        nextCatItems[targetIdxInCat],
        nextCatItems[idxInCat],
      ];

      const otherItems = items.filter((i) => (i.category || categories[0] || "Gestão") !== cat);
      const nextItems = [...otherItems, ...nextCatItems];

      reorderAndPersist(categories, nextItems);
      toast.success(`Ordem de "${currentItem.title}" atualizada!`);
    },
    [userCanEdit, categories, items, reorderAndPersist]
  );

  const handleReset = useCallback(() => {
    if (!userCanEdit) return;
    const defaultSynced = syncMenuConfig(null);
    setCategories(defaultSynced.categories);
    setItems(defaultSynced.items);
    setDeletedItemIds([]);
    reset();
    toast.success("Menu restaurado para o padrão do sistema!");
  }, [reset, userCanEdit]);

  const handleSyncAll = useCallback(() => {
    if (!userCanEdit) return;
    reorderAndPersist(categories, items);
    toast.success("Todas as categorias e menus foram sincronizados com sucesso!");
  }, [userCanEdit, categories, items, reorderAndPersist]);

  /* ─── Item Drag and Drop Handlers ─── */
  const handleItemDragStart = (e: React.DragEvent, id: string) => {
    if (!userCanEdit) return;
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
    if (!userCanEdit || !draggedItemId || draggedItemId === targetId) {
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
    if (!userCanEdit) return;
    setSelectedSystemModuleId("custom");
    setNewMenuTitle("");
    setNewMenuUrl("");
    setNewMenuCategory(defaultCategory || categories[0] || "Gestão");
    setNewMenuIconName("LayoutDashboard");
    setNewMenuVisible(true);
    setNewIconSearch("");
    setIsAddMenuOpen(true);
  };

  // When a system module is selected from dropdown in Add modal
  const handleSelectSystemModule = (moduleId: string) => {
    setSelectedSystemModuleId(moduleId);
    if (moduleId === "custom") {
      return;
    }
    const found = PLATFORM_SYSTEM_MODULES.find((m) => m.id === moduleId);
    if (found) {
      setNewMenuTitle(found.title);
      setNewMenuUrl(found.url);
      setNewMenuIconName(found.iconName);
      if (categories.includes(found.defaultCat)) {
        setNewMenuCategory(found.defaultCat);
      } else {
        setNewMenuCategory(categories[0] || "Gestão");
      }
    }
  };

  const handleCreateMenu = () => {
    if (!userCanEdit) return;
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

    const category = newMenuCategory || categories[0] || "Gestão";
    const isSystem = selectedSystemModuleId !== "custom";
    const itemId = isSystem ? selectedSystemModuleId : `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // If it was in deletedItemIds, remove it
    const nextDeletedIds = deletedItemIds.filter((id) => id !== itemId && id !== url);

    const newItem: MenuItemConfig = {
      id: itemId,
      title,
      url,
      category,
      visible: newMenuVisible,
      iconName: newMenuIconName,
      isCustom: !isSystem,
      order: items.length,
    };

    // If an item with this id already exists, replace it, else append
    const existingIdx = items.findIndex((i) => i.id === itemId);
    let nextItems: MenuItemConfig[];
    if (existingIdx >= 0) {
      nextItems = [...items];
      nextItems[existingIdx] = newItem;
    } else {
      nextItems = [...items, newItem];
    }

    reorderAndPersist(categories, nextItems, nextDeletedIds);
    setIsAddMenuOpen(false);
    setNewMenuTitle("");
    setNewMenuUrl("");
    toast.success(`Menu "${title}" adicionado à categoria "${category}"!`);
  };

  const handleStartEditItem = (item: MenuItemConfig) => {
    if (!userCanEdit) return;
    setEditingItem(item);
    setEditItemTitle(item.title);
    setEditItemUrl(item.url);
    setEditItemCategory(item.category || categories[0] || "Gestão");
    setEditItemIconName(item.iconName || "LayoutDashboard");
    setEditItemVisible(item.visible !== false);
    setEditIconSearch("");
  };

  const handleSaveEditItem = () => {
    if (!userCanEdit || !editingItem) return;
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
    if (!userCanEdit || !itemToDelete) return;
    const item = itemToDelete;
    const remaining = items.filter((i) => i.id !== item.id);
    const nextDeletedIds = item.isCustom
      ? deletedItemIds
      : Array.from(new Set([...deletedItemIds, item.id]));

    reorderAndPersist(categories, remaining, nextDeletedIds);
    setItemToDelete(null);
    toast.success(`Menu "${item.title}" removido da navegação!`);
  };

  /* ─── Restore Deleted Items Handlers ─── */
  const handleRestoreDeletedItem = (deletedId: string) => {
    if (!userCanEdit) return;
    const systemModule = PLATFORM_SYSTEM_MODULES.find((m) => m.id === deletedId);
    const targetCat =
      restoreCategoryMap[deletedId] ||
      (systemModule?.defaultCat && categories.includes(systemModule.defaultCat)
        ? systemModule.defaultCat
        : categories[0] || "Gestão");

    const restoredItem: MenuItemConfig = {
      id: deletedId,
      title: systemModule?.title || deletedId,
      url: systemModule?.url || `/${deletedId}`,
      visible: true,
      category: targetCat,
      order: items.length,
      iconName: systemModule?.iconName || "LayoutDashboard",
      isCustom: !systemModule,
    };

    const nextDeletedIds = deletedItemIds.filter((id) => id !== deletedId);
    const nextItems = [...items, restoredItem];

    reorderAndPersist(categories, nextItems, nextDeletedIds);
    toast.success(`Módulo "${restoredItem.title}" restaurado na categoria "${targetCat}"!`);
  };

  const handleRestoreAllDeleted = () => {
    if (!userCanEdit || deletedItemIds.length === 0) return;

    const restoredItems: MenuItemConfig[] = [];
    deletedItemIds.forEach((delId, idx) => {
      const systemModule = PLATFORM_SYSTEM_MODULES.find((m) => m.id === delId);
      const targetCat =
        restoreCategoryMap[delId] ||
        (systemModule?.defaultCat && categories.includes(systemModule.defaultCat)
          ? systemModule.defaultCat
          : categories[0] || "Gestão");

      restoredItems.push({
        id: delId,
        title: systemModule?.title || delId,
        url: systemModule?.url || `/${delId}`,
        visible: true,
        category: targetCat,
        order: items.length + idx,
        iconName: systemModule?.iconName || "LayoutDashboard",
        isCustom: !systemModule,
      });
    });

    reorderAndPersist(categories, [...items, ...restoredItems], []);
    toast.success(`${deletedItemIds.length} módulos restaurados com sucesso!`);
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

  // Available system modules not currently in items
  const availableSystemModules = useMemo(() => {
    const itemIds = new Set(items.map((i) => i.id));
    return PLATFORM_SYSTEM_MODULES.filter((m) => !itemIds.has(m.id));
  }, [items]);

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      {/* Top Banner / Navigation switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-foreground">
              Personalização do Menu Lateral (Plataforma)
            </h3>
            <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] py-0.5">
              Membros
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie as categorias, itens, rotas, ícones e ordem do menu exibido para todos os membros da facção.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {showDevNavigationLinks && (isDevUser || isCeoUser) && (
            <Link to="/dev/menu-lateral">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold"
                title="Acessar gerenciador dos menus Dev Tools e Painel CEO"
              >
                <Terminal className="h-3.5 w-3.5" />
                Menus Dev & CEO
              </Button>
            </Link>
          )}

          <Button
            size="sm"
            onClick={() => handleOpenAddMenu()}
            disabled={!userCanEdit}
            className="h-8 text-xs gap-1.5 bg-gradient-brand text-primary-foreground font-bold shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Menu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={!userCanEdit}
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
            disabled={!userCanEdit}
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

      {!userCanEdit && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            Você está em modo de apenas leitura. Fale com um administrador para obter a permissão{" "}
            <strong>Gerenciar Aba Menu</strong>.
          </span>
        </div>
      )}

      {/* Categories Management Section */}
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
              const itemCount = items.filter(
                (i) => (i.category || categories[0] || "Gestão") === cat
              ).length;
              const isDraggingCat = draggedCatIdx === idx;
              const isOverCat = dragOverCatIdx === idx;

              return (
                <div
                  key={cat}
                  draggable={userCanEdit && !isEditing}
                  onDragStart={(e) => handleCatDragStart(e, idx)}
                  onDragOver={(e) => handleCatDragOver(e, idx)}
                  onDragLeave={handleCatDragLeave}
                  onDrop={(e) => handleCatDrop(e, idx)}
                  className={cn(
                    "flex items-center justify-between gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/50 transition-all",
                    userCanEdit && !isEditing && "cursor-grab active:cursor-grabbing hover:border-primary/40",
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
                          <p className="text-[0.65rem] text-muted-foreground">
                            {itemCount} itens vinculados
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, "up")}
                          disabled={idx === 0 || !userCanEdit}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Mover categoria para cima"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, "down")}
                          disabled={idx === categories.length - 1 || !userCanEdit}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                          title="Mover categoria para baixo"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(idx)}
                          disabled={!userCanEdit}
                          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary disabled:opacity-20"
                          title="Editar nome da categoria"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatToDelete(cat)}
                          disabled={!userCanEdit || categories.length <= 1}
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
              disabled={!userCanEdit}
              className="h-9 text-xs bg-secondary/50 border-border/60 max-w-sm"
            />
            <Button
              size="sm"
              onClick={handleAddCategory}
              disabled={!userCanEdit || !newCatName.trim()}
              className="h-9 text-xs gap-1.5 bg-primary text-primary-foreground font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              Criar Categoria
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── MÓDULOS EXCLUÍDOS DA NAVEGAÇÃO ─── */}
      {deletedItemIds.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardHeader className="pb-2.5 pt-3 px-4 border-b border-amber-500/20 bg-amber-500/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Undo2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold text-amber-400">
                    Módulos Excluídos do Menu ({deletedItemIds.length})
                  </CardTitle>
                  <CardDescription className="text-[0.65rem] text-muted-foreground">
                    Estes itens foram removidos da navegação lateral. Clique em restaurar para colocá-los de volta em qualquer categoria.
                  </CardDescription>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleRestoreAllDeleted}
                disabled={!userCanEdit}
                className="h-7 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20 font-bold gap-1"
              >
                <Undo2 className="h-3 w-3" />
                Restaurar Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {deletedItemIds.map((delId) => {
                const sysModule = PLATFORM_SYSTEM_MODULES.find((m) => m.id === delId);
                const ItemIcon = resolveMenuIcon(sysModule?.iconName, sysModule?.url || `/${delId}`);
                const selectedCat =
                  restoreCategoryMap[delId] ||
                  (sysModule?.defaultCat && categories.includes(sysModule.defaultCat)
                    ? sysModule.defaultCat
                    : categories[0] || "Gestão");

                return (
                  <div
                    key={delId}
                    className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-amber-500/25 bg-background/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                        <ItemIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">
                            {sysModule?.title || delId}
                          </p>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10">
                            Excluído
                          </Badge>
                        </div>
                        <p className="text-[0.65rem] text-muted-foreground font-mono truncate mt-0.5">
                          {sysModule?.url || `/${delId}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Select
                        value={selectedCat}
                        onValueChange={(cat) =>
                          setRestoreCategoryMap((prev) => ({ ...prev, [delId]: cat }))
                        }
                        disabled={!userCanEdit}
                      >
                        <SelectTrigger className="h-7 w-28 text-[10px] font-bold border-border/60 bg-secondary/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c} className="text-xs">
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        onClick={() => handleRestoreDeletedItem(delId)}
                        disabled={!userCanEdit}
                        className="h-7 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold gap-1"
                        title="Restaurar item para o menu lateral"
                      >
                        <Undo2 className="h-3 w-3" />
                        Restaurar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Items by Category + Live Preview */}
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
              disabled={!userCanEdit}
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
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5"
                      >
                        {catItems.length} {catItems.length === 1 ? "item" : "itens"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenAddMenu(cat)}
                        disabled={!userCanEdit}
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
                        disabled={!userCanEdit}
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
                        const isExternal =
                          item.url.startsWith("http://") || item.url.startsWith("https://");
                        const isSystem = PLATFORM_SYSTEM_MODULES.some(
                          (m) => m.id === item.id || m.url === item.url
                        );

                        return (
                          <div
                            key={item.id}
                            draggable={userCanEdit}
                            onDragStart={(e) => handleItemDragStart(e, item.id)}
                            onDragOver={(e) => handleItemDragOver(e, item.id)}
                            onDragLeave={handleItemDragLeave}
                            onDrop={(e) => handleItemDrop(e, item.id)}
                            className={cn(
                              "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing",
                              item.visible
                                ? "bg-card/40 border-border/60 shadow-xs hover:border-primary/40"
                                : "bg-secondary/20 border-border/30 opacity-60",
                              isDragging && "opacity-30 scale-95 border-dashed border-primary",
                              isDragOver && "border-primary bg-primary/10 shadow-lg scale-[1.01]"
                            )}
                          >
                            {/* Left Group: Reorder Arrows + Icon + Title + URL */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1 w-full sm:w-auto">
                              {/* Reorder Arrows & Handle */}
                              <div className="flex flex-col items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveItemWithinCategory(item.id, "up")}
                                  disabled={itemIdxInCat === 0 || !userCanEdit}
                                  className="h-5 w-5 sm:h-4 sm:w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Mover para cima nesta categoria"
                                >
                                  <ChevronUp className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                                </button>
                                <GripVertical className="h-4 w-4 text-muted-foreground/50 hover:text-primary cursor-grab" />
                                <button
                                  type="button"
                                  onClick={() => moveItemWithinCategory(item.id, "down")}
                                  disabled={itemIdxInCat === catItems.length - 1 || !userCanEdit}
                                  className="h-5 w-5 sm:h-4 sm:w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-20"
                                  title="Mover para baixo nesta categoria"
                                >
                                  <ChevronDown className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                                </button>
                              </div>

                              {/* Icon Badge */}
                              <div
                                className={cn(
                                  "flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg border shrink-0 transition-colors shadow-xs",
                                  item.visible
                                    ? "bg-primary/10 border-primary/30 text-primary"
                                    : "bg-secondary/50 border-border/40 text-muted-foreground"
                                )}
                              >
                                <ItemIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                              </div>

                              {/* Title & Route */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-foreground truncate">
                                    {item.title}
                                  </p>
                                  {item.isCustom && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 border-purple-500/40 text-purple-400 bg-purple-500/10 font-bold shrink-0"
                                    >
                                      Custom
                                    </Badge>
                                  )}
                                  {isSystem && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 border-blue-500/40 text-blue-400 bg-blue-500/10 font-bold shrink-0"
                                    >
                                      Sistema
                                    </Badge>
                                  )}
                                  {isExternal && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] px-1 py-0 border-sky-500/40 text-sky-400 bg-sky-500/10 font-bold shrink-0 gap-0.5"
                                    >
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
                            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                              {/* Category Select */}
                              <Select
                                value={item.category || categories[0] || "Gestão"}
                                onValueChange={(val) => updateItem(item.id, { category: val })}
                                disabled={!userCanEdit}
                              >
                                <SelectTrigger className="h-8 sm:h-7 w-28 text-[10px] font-bold border-border/60 bg-secondary/40 shrink-0">
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

                              <Separator orientation="vertical" className="h-5 hidden sm:block" />

                              {/* Visibility Switch */}
                              <div
                                className="flex items-center gap-1.5 shrink-0 bg-secondary/30 sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded-lg sm:rounded-none border sm:border-0 border-border/40"
                                title={item.visible ? "Visível no menu" : "Oculto no menu"}
                              >
                                {item.visible ? (
                                  <Eye className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span className="text-[10px] sm:hidden text-muted-foreground">{item.visible ? "Visível" : "Oculto"}</span>
                                <Switch
                                  checked={item.visible}
                                  onCheckedChange={(checked) =>
                                    updateItem(item.id, { visible: checked })
                                  }
                                  disabled={!userCanEdit}
                                  className="data-[state=checked]:bg-emerald-500 scale-90 sm:scale-75"
                                />
                              </div>

                              <Separator orientation="vertical" className="h-5 hidden sm:block" />

                              {/* Edit Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEditItem(item)}
                                disabled={!userCanEdit}
                                className="h-8 w-8 sm:h-7 sm:w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                title="Editar título, rota ou ícone do menu"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>

                              {/* Delete Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setItemToDelete(item)}
                                disabled={!userCanEdit}
                                className="h-8 w-8 sm:h-7 sm:w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Remover item da navegação"
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
                  <CardDescription className="text-[0.7rem]">
                    Visualização exata da barra de navegação dos membros
                  </CardDescription>
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
                          const isExternal =
                            item.url.startsWith("http://") || item.url.startsWith("https://");
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
              Adicione um módulo do sistema ou crie uma rota/link personalizado para a navegação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick System Module Selector */}
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/60 space-y-2">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <SelectIcon className="h-3.5 w-3.5 text-primary" />
                Módulo Existente da Plataforma (Preenchimento Automático)
              </Label>
              <Select
                value={selectedSystemModuleId}
                onValueChange={handleSelectSystemModule}
              >
                <SelectTrigger className="h-9 text-xs font-medium">
                  <SelectValue placeholder="Selecione um módulo ou crie customizado..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="custom" className="text-xs font-bold text-primary">
                    + Criar Rota / Link Customizado
                  </SelectItem>
                  <Separator className="my-1" />
                  {PLATFORM_SYSTEM_MODULES.map((mod) => {
                    const isAlreadyIn = items.some((i) => i.id === mod.id);
                    const isDel = deletedItemIds.includes(mod.id);
                    return (
                      <SelectItem
                        key={mod.id}
                        value={mod.id}
                        className="text-xs flex items-center justify-between"
                      >
                        <span className="font-medium">
                          {mod.title} ({mod.url})
                          {isDel && " — [Excluído / Restaurar]"}
                          {isAlreadyIn && " — [Já no menu]"}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-[0.65rem] text-muted-foreground">
                Ao selecionar um módulo, título, rota, categoria e ícone serão preenchidos automaticamente.
              </p>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Título do Menu</Label>
              <Input
                value={newMenuTitle}
                onChange={(e) => setNewMenuTitle(e.target.value)}
                placeholder="Ex: Planilha de Armas, Loja VIP, Discord..."
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
                Dica: Endereços com <span className="font-mono text-primary">http://</span> ou{" "}
                <span className="font-mono text-primary">https://</span> serão abertos automaticamente em nova aba.
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

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Visibilidade Inicial</Label>
                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50 h-9">
                  <span className="text-xs text-muted-foreground">
                    {newMenuVisible ? "Visível" : "Oculto"}
                  </span>
                  <Switch
                    checked={newMenuVisible}
                    onCheckedChange={setNewMenuVisible}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Ícone do Menu</Label>
                <span className="text-[0.65rem] text-muted-foreground font-mono">
                  Selecionado: {newMenuIconName}
                </span>
              </div>

              <Input
                value={newIconSearch}
                onChange={(e) => setNewIconSearch(e.target.value)}
                placeholder="Buscar ícone (ex: box, user, cart, shield...)"
                className="h-8 text-xs bg-secondary/40"
              />

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl border border-border/50 bg-secondary/20">
                {filteredNewIcons.map((ic) => {
                  const IconComp = ic.icon;
                  const isSelected = newMenuIconName === ic.name;
                  return (
                    <button
                      type="button"
                      key={ic.name}
                      onClick={() => setNewMenuIconName(ic.name)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all hover:border-primary/50",
                        isSelected
                          ? "border-primary bg-primary/20 text-primary shadow-xs ring-1 ring-primary"
                          : "border-border/40 text-muted-foreground hover:text-foreground bg-card/30"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddMenuOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateMenu}
              className="text-xs bg-primary text-primary-foreground font-bold"
            >
              Salvar Menu
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
              Editar Menu: {editingItem?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atualize o título, rota de navegação, categoria ou ícone deste item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Título do Menu</Label>
              <Input
                value={editItemTitle}
                onChange={(e) => setEditItemTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">URL ou Rota</Label>
              <Input
                value={editItemUrl}
                onChange={(e) => setEditItemUrl(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

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

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Visibilidade</Label>
                <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50 h-9">
                  <span className="text-xs text-muted-foreground">
                    {editItemVisible ? "Visível" : "Oculto"}
                  </span>
                  <Switch
                    checked={editItemVisible}
                    onCheckedChange={setEditItemVisible}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Ícone do Menu</Label>
                <span className="text-[0.65rem] text-muted-foreground font-mono">
                  Selecionado: {editItemIconName}
                </span>
              </div>

              <Input
                value={editIconSearch}
                onChange={(e) => setEditIconSearch(e.target.value)}
                placeholder="Buscar ícone..."
                className="h-8 text-xs bg-secondary/40"
              />

              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl border border-border/50 bg-secondary/20">
                {filteredEditIcons.map((ic) => {
                  const IconComp = ic.icon;
                  const isSelected = editItemIconName === ic.name;
                  return (
                    <button
                      type="button"
                      key={ic.name}
                      onClick={() => setEditItemIconName(ic.name)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg border transition-all hover:border-primary/50",
                        isSelected
                          ? "border-primary bg-primary/20 text-primary shadow-xs ring-1 ring-primary"
                          : "border-border/40 text-muted-foreground hover:text-foreground bg-card/30"
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingItem(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEditItem}
              className="text-xs bg-primary text-primary-foreground font-bold"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: EXCLUIR ITEM ─── */}
      <Dialog open={Boolean(itemToDelete)} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Remover Menu da Navegação
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja remover o menu <strong>"{itemToDelete?.title}"</strong> da navegação?
              Você poderá restaurá-lo a qualquer momento na seção de módulos excluídos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemToDelete(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmDeleteItem}
              className="text-xs font-bold"
            >
              Confirmar Remoção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: EXCLUIR CATEGORIA ─── */}
      <Dialog open={Boolean(catToDelete)} onOpenChange={(open) => !open && setCatToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Excluir Categoria
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir a categoria <strong>"{catToDelete}"</strong>? Os itens
              pertencentes a ela serão movidos automaticamente para a categoria principal restante.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCatToDelete(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmDeleteCategory}
              className="text-xs font-bold"
            >
              Excluir Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
