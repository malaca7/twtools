import React, { useState, useMemo, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Filter out non-components and types
const iconNames = Object.keys(LucideIcons).filter(
  (key) => typeof (LucideIcons as any)[key] === "function" || typeof (LucideIcons as any)[key] === "object"
).filter(key => key !== "createLucideIcon" && key !== "Icon" && key !== "LucideIcon");

const ITEMS_PER_PAGE = 100;

export function IconPicker({
  value,
  onChange,
  children
}: {
  value: string;
  onChange: (name: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredIcons = useMemo(() => {
    if (!search.trim()) return iconNames;
    const s = search.toLowerCase();
    return iconNames.filter((name) => name.toLowerCase().includes(s));
  }, [search]);

  const paginatedIcons = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredIcons.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredIcons, page]);

  const totalPages = Math.ceil(filteredIcons.length / ITEMS_PER_PAGE);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col bg-card/95 border-border backdrop-blur-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Selecione um Ícone</DialogTitle>
          <div className="relative mt-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ícone (ex: star, sword, shield)..."
              className="pl-9 h-10"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredIcons.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Nenhum ícone encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {paginatedIcons.map((name) => {
                const IconComponent = (LucideIcons as any)[name];
                const isSelected = value === name;
                return (
                  <Button
                    key={name}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-12 w-full p-0 flex flex-col items-center justify-center gap-1 ${
                      isSelected ? "border-primary" : "border-border/60 hover:border-primary/50"
                    }`}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                    title={name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="shrink-0 flex items-center justify-between pt-4 border-t border-border/40">
            <span className="text-xs text-muted-foreground">
              Mostrando {paginatedIcons.length} de {filteredIcons.length} ícones
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-mono font-bold w-12 text-center">
                {page}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
