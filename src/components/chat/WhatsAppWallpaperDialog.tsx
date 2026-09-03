import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Image } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WhatsAppWallpaperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTheme?: string;
  onThemeChange?: (theme: string) => void;
}

export const WALLPAPER_THEMES = [
  {
    id: "default",
    name: "Doodle Clássico",
    desc: "Padrão oficial escuro do WhatsApp",
    previewClass: "bg-[#0b141a] border-[#00a884]",
    bgClass: "theme-default",
  },
  {
    id: "slate",
    name: "Grafite Noturno",
    desc: "Tom azulado ardósia elegante",
    previewClass: "bg-[#0f172a] border-blue-500",
    bgClass: "theme-slate",
  },
  {
    id: "emerald",
    name: "Verde Esmeralda",
    desc: "Tom profundo de verde floresta",
    previewClass: "bg-[#061c16] border-emerald-500",
    bgClass: "theme-emerald",
  },
  {
    id: "solid",
    name: "Sólido Preto",
    desc: "Fundo limpo sem textura doodle",
    previewClass: "bg-[#0b141a] border-zinc-500",
    bgClass: "theme-solid",
  },
];

export function WhatsAppWallpaperDialog({
  open,
  onOpenChange,
  currentTheme = "default",
  onThemeChange,
}: WhatsAppWallpaperDialogProps) {
  const [selected, setSelected] = useState(currentTheme);

  useEffect(() => {
    setSelected(currentTheme);
  }, [currentTheme]);

  const handleApply = (themeId: string) => {
    setSelected(themeId);
    try {
      localStorage.setItem("tw_chat_wallpaper_theme", themeId);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tw_chat_wallpaper_change", { detail: { theme: themeId } }));
      }
    } catch {}
    onThemeChange?.(themeId);
    toast.success("Papel de parede do WhatsApp atualizado!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#111b21] border border-white/10 shadow-2xl rounded-2xl p-5 text-white">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Image className="h-4 w-4 text-[#00a884]" />
            Papel de Parede da Conversa
          </DialogTitle>
          <DialogDescription className="text-xs text-[#8696a0]">
            Escolha o fundo visual do chat estilo WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-3">
          {WALLPAPER_THEMES.map((theme) => {
            const isSelected = selected === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleApply(theme.id)}
                className={cn(
                  "p-3 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer group hover:scale-[1.02]",
                  isSelected
                    ? "border-[#00a884] bg-white/5 ring-2 ring-[#00a884]/30"
                    : "border-white/10 hover:border-white/20 bg-white/5"
                )}
              >
                <div
                  className={cn(
                    "h-16 w-full rounded-lg border flex items-center justify-center relative overflow-hidden",
                    theme.previewClass
                  )}
                >
                  {isSelected && (
                    <div className="h-6 w-6 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-md">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-[#00a884] transition-colors">
                    {theme.name}
                  </h5>
                  <p className="text-[10px] text-[#8696a0] leading-tight mt-0.5">{theme.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
