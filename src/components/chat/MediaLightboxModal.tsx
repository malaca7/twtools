import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Share2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatTimeOnly, dateOnly } from "@/lib/format";
import type { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MediaLightboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMessage: ChatMessage | null;
  allMediaMessages?: ChatMessage[];
  onSelectMessage?: (msg: ChatMessage) => void;
}

export function MediaLightboxModal({
  open,
  onOpenChange,
  currentMessage,
  allMediaMessages = [],
  onSelectMessage,
}: MediaLightboxModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Filtra apenas fotos e vídeos válidos
  const mediaList = allMediaMessages.filter(
    (m) => (m.message_type === "image" || m.message_type === "video") && m.attachment_url && !m.is_deleted
  );

  const currentIndex = mediaList.findIndex((m) => m.id === currentMessage?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < mediaList.length - 1;

  // Reset zoom ao trocar de imagem
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [currentMessage?.id]);

  // Suporte a teclado (setas e ESC)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "ArrowLeft" && hasPrev) {
        onSelectMessage?.(mediaList[currentIndex - 1]);
      }
      if (e.key === "ArrowRight" && hasNext) {
        onSelectMessage?.(mediaList[currentIndex + 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentIndex, hasPrev, hasNext, mediaList, onSelectMessage, onOpenChange]);

  if (!open || !currentMessage || !currentMessage.attachment_url) return null;

  const isVideo = currentMessage.message_type === "video";
  const url = currentMessage.attachment_url;
  const senderName = currentMessage.sender_name || "Membro";
  const initials = senderName.slice(0, 2).toUpperCase();

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = currentMessage.attachment_name || (isVideo ? "video.mp4" : "imagem.png");
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-150">
      {/* HEADER TOP BAR */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111b21]/80 backdrop-blur-md border-b border-white/10 shrink-0 z-20">
        {/* SENDER INFO */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-white/10 shadow-xs">
            {currentMessage.sender_avatar && (
              <AvatarImage src={currentMessage.sender_avatar} alt={senderName} />
            )}
            <AvatarFallback className="bg-emerald-700 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{senderName}</h4>
            <span className="text-xs text-[#8696a0] font-mono">
              {dateOnly(currentMessage.created_at)} às {formatTimeOnly(currentMessage.created_at)}
            </span>
          </div>
        </div>

        {/* TOP CONTROLS */}
        <div className="flex items-center gap-1.5">
          {!isVideo && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.min(z + 0.3, 3))}
                className="h-8 w-8 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setZoom((z) => Math.max(z - 0.3, 0.7))}
                className="h-8 w-8 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="h-8 w-8 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
                title="Girar imagem"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-8 w-8 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full cursor-pointer"
            title="Baixar arquivo"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 text-[#aebac1] hover:text-white hover:bg-white/10 rounded-full cursor-pointer ml-2"
            title="Fechar (ESC)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* MEDIA DISPLAY AREA */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
        {/* PREV BUTTON */}
        {hasPrev && (
          <button
            type="button"
            onClick={() => onSelectMessage?.(mediaList[currentIndex - 1])}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/60 hover:bg-[#202c33] border border-white/10 flex items-center justify-center text-white cursor-pointer transition-all shadow-xl z-10 hover:scale-105"
            title="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* MEDIA ELEMENT */}
        <div className="flex items-center justify-center max-h-full max-w-full overflow-auto transition-transform duration-150">
          {isVideo ? (
            <video
              src={url}
              controls
              autoPlay
              className="max-h-[82vh] max-w-full rounded-xl shadow-2xl"
            />
          ) : (
            <img
              src={url}
              alt={currentMessage.attachment_name || "Mídia"}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: "transform 0.15s ease-out",
              }}
              className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl pointer-events-auto"
            />
          )}
        </div>

        {/* NEXT BUTTON */}
        {hasNext && (
          <button
            type="button"
            onClick={() => onSelectMessage?.(mediaList[currentIndex + 1])}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/60 hover:bg-[#202c33] border border-white/10 flex items-center justify-center text-white cursor-pointer transition-all shadow-xl z-10 hover:scale-105"
            title="Próxima"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* CAPTION BOTTOM BAR (IF HAS TEXT) */}
      {currentMessage.content && currentMessage.content !== currentMessage.attachment_name && (
        <div className="px-6 py-3 bg-[#111b21]/90 backdrop-blur-md border-t border-white/10 text-center text-sm text-[#e9edef] max-w-2xl mx-auto rounded-t-2xl shadow-xl">
          {currentMessage.content}
        </div>
      )}
    </div>
  );
}
