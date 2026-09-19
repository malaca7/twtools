import { useState, useMemo } from "react";
import { Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AVAILABLE_MENU_ICONS,
  resolveMenuIcon,
  type MenuIconDef,
} from "@/lib/menuIcons";
import {
  type PanelColor,
  getPanelColorStyle,
} from "@/lib/panelTheme";
import { cn } from "@/lib/utils";

export interface MenuItemIconPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  panelColor?: PanelColor;
  title?: string;
  description?: string;
}

export function MenuItemIconPickerModal({
  open,
  onOpenChange,
  selectedIcon,
  onSelectIcon,
  panelColor = "rose",
  title = "Escolher Ícone do Menu",
  description = "Selecione um ícone para identificar este item no menu lateral.",
}: MenuItemIconPickerModalProps) {
  const [search, setSearch] = useState("");
  const colorStyle = getPanelColorStyle(panelColor, "rose");

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return AVAILABLE_MENU_ICONS;
    const q = search.toLowerCase();
    return AVAILABLE_MENU_ICONS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 surface-card border border-border/80 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <span
                  className={cn(
                    "p-1.5 rounded-lg border",
                    colorStyle.bgSubtleClass,
                    colorStyle.borderClass,
                    colorStyle.textClass
                  )}
                >
                  {(() => {
                    const CurrIcon = resolveMenuIcon(selectedIcon);
                    return <CurrIcon className="h-4 w-4" />;
                  })()}
                </span>
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {description}
              </DialogDescription>
            </div>
            <Badge className={colorStyle.badgeClass}>
              {colorStyle.label.split(" ")[0]}
            </Badge>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ícone (ex: bot, estoque, chave, config, dashboard, usuarios...)"
              className="pl-8 h-9 text-xs bg-secondary/30 border-border/60"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 pr-1">
          {filteredIcons.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Nenhum ícone encontrado para "{search}".
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredIcons.map(({ name, label, icon: Icon }) => {
                const isSelected = selectedIcon === name;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      onSelectIcon(name);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98]",
                      isSelected
                        ? cn(
                            colorStyle.bgSubtleClass,
                            colorStyle.borderClass,
                            "ring-2",
                            colorStyle.ringClass,
                            "shadow-sm"
                          )
                        : "bg-secondary/20 border-border/60 hover:bg-secondary/40 hover:border-border"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-colors mb-1.5",
                        isSelected
                          ? cn(colorStyle.bgSubtleClass, colorStyle.textClass)
                          : "bg-secondary/40 text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-bold text-foreground truncate w-full">
                      {label}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground truncate w-full">
                      {name}
                    </span>
                    {isSelected && (
                      <div
                        className={cn(
                          "mt-1 flex items-center gap-1 text-[9px] font-bold",
                          colorStyle.textClass
                        )}
                      >
                        <Check className="h-3 w-3" /> Selecionado
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
