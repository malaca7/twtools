import React from "react";
import { X, Download, ExternalLink, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PatchNoteLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  imageTitle?: string;
  caption?: string;
}

export function PatchNoteLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  imageTitle,
  caption,
}: PatchNoteLightboxModalProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden bg-[#0b0f14]/95 border border-white/10 shadow-2xl backdrop-blur-2xl text-white">
        {/* HEADER */}
        <div className="p-3 px-4 border-b border-white/10 flex items-center justify-between bg-[#151c24]/80">
          <div className="min-w-0 pr-4">
            <h4 className="text-xs font-bold text-[#e9edef] truncate">
              {imageTitle || "Visualização da Imagem"}
            </h4>
            {caption && <p className="text-[11px] text-[#8696a0] truncate">{caption}</p>}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => window.open(imageUrl, "_blank")}
              className="h-8 w-8 text-[#8696a0] hover:text-white hover:bg-white/10 rounded-full"
              title="Abrir imagem em nova aba"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-[#8696a0] hover:text-white hover:bg-white/10 rounded-full"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* IMAGE PREVIEW */}
        <div className="relative flex items-center justify-center p-3 sm:p-6 bg-black/40 min-h-[300px] max-h-[75vh] overflow-auto">
          <img
            src={imageUrl}
            alt={caption || imageTitle || "Imagem da Atualização"}
            className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/5"
          />
        </div>

        {/* FOOTER */}
        {caption && (
          <div className="p-3 px-4 bg-[#151c24]/90 border-t border-white/10 text-xs text-[#d1d7db] text-center">
            {caption}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
