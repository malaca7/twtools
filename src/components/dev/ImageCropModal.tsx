import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Crop,
  Check,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  cropShape?: "round" | "rect";
  defaultAspectRatio?: number; // width / height (ex: 1 para 1:1, 16/9 para banner)
  title?: string;
  description?: string;
  targetWidth?: number;
  targetHeight?: number;
  allowedRatios?: { label: string; ratio: number }[];
  onCropSave: (croppedFile: File) => Promise<void> | void;
  isSaving?: boolean;
}

export function ImageCropModal({
  isOpen,
  onClose,
  imageFile,
  cropShape = "rect",
  defaultAspectRatio = 1,
  title = "Ajustar e Recortar Imagem",
  description = "Arraste para reposicionar e ajuste o zoom na proporção desejada.",
  targetWidth,
  targetHeight,
  allowedRatios,
  onCropSave,
  isSaving = false,
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Proporção ativa
  const [aspectRatio, setAspectRatio] = useState<number>(defaultAspectRatio);

  // Transformações
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Arraste
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Inicializa imagem quando o arquivo muda
  useEffect(() => {
    if (!imageFile) {
      setImageSrc(null);
      setImageObj(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImageSrc(objectUrl);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = objectUrl;
    img.onload = () => {
      setImageObj(img);
      // Reset transformações
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setAspectRatio(defaultAspectRatio);
    };

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile, defaultAspectRatio]);

  // Dimensões do Crop Box
  const CROP_BOX_MAX_WIDTH = 440;
  const CROP_BOX_MAX_HEIGHT = 280;

  let cropWidth = CROP_BOX_MAX_WIDTH;
  let cropHeight = cropWidth / aspectRatio;

  if (cropHeight > CROP_BOX_MAX_HEIGHT) {
    cropHeight = CROP_BOX_MAX_HEIGHT;
    cropWidth = cropHeight * aspectRatio;
  }

  // Handlers de mouse/touch para mover a imagem
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    },
    [isDragging]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom pelo mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 4));
  };

  // Resetar ajustes
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Girar 90 graus
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Executar corte e exportar Canvas para File
  const handleConfirmCrop = async () => {
    if (!imageObj || !imageFile) return;

    try {
      // Dimensões finais do recorte
      const finalWidth = targetWidth || (cropShape === "round" ? 512 : 1280);
      const finalHeight = targetHeight || Math.round(finalWidth / aspectRatio);

      const canvas = document.createElement("canvas");
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Não foi possível inicializar o canvas de recorte.");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fundo escuro se for banner
      if (cropShape !== "round") {
        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      }

      ctx.save();

      // Mover origem para o centro do canvas final
      ctx.translate(finalWidth / 2, finalHeight / 2);

      // Aplicar rotação
      ctx.rotate((rotation * Math.PI) / 180);

      // Calcular proporção entre o box na tela e a imagem natural
      const scaleMultiplier = finalWidth / cropWidth;

      // Aplicar zoom e pan escalados
      const drawScale = zoom * scaleMultiplier;
      ctx.scale(drawScale, drawScale);

      // O pan na tela deve ser escalado
      const drawX = (pan.x / zoom) * (imageObj.naturalWidth / cropWidth);
      const drawY = (pan.y / zoom) * (imageObj.naturalHeight / cropHeight);

      // Desenhar a imagem centralizada
      // Calcula como a imagem é mapeada no cropbox inicialmente
      const imgAspect = imageObj.naturalWidth / imageObj.naturalHeight;
      let baseDrawWidth: number;
      let baseDrawHeight: number;

      if (imgAspect > aspectRatio) {
        baseDrawHeight = cropHeight;
        baseDrawWidth = cropHeight * imgAspect;
      } else {
        baseDrawWidth = cropWidth;
        baseDrawHeight = cropWidth / imgAspect;
      }

      // Converte para coordenadas do canvas final
      const screenToCanvasFactor = finalWidth / cropWidth;
      const renderW = baseDrawWidth * screenToCanvasFactor;
      const renderH = baseDrawHeight * screenToCanvasFactor;
      const renderPanX = pan.x * screenToCanvasFactor;
      const renderPanY = pan.y * screenToCanvasFactor;

      // Reseta transformação anterior para desenho matematicamente preciso
      ctx.restore();
      ctx.save();

      ctx.translate(finalWidth / 2, finalHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      ctx.drawImage(
        imageObj,
        -renderW * zoom / 2 + renderPanX,
        -renderH * zoom / 2 + renderPanY,
        renderW * zoom,
        renderH * zoom
      );

      ctx.restore();

      // Exportar Canvas para Blob
      const mimeType = imageFile.type.includes("png") ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), mimeType, 0.95);
      });

      if (!blob) {
        throw new Error("Erro ao gerar arquivo recortado.");
      }

      const croppedFileName = imageFile.name.replace(/\.[^/.]+$/, "") + "_cropped." + (mimeType === "image/png" ? "png" : "jpg");
      const croppedFile = new File([blob], croppedFileName, { type: mimeType });

      await onCropSave(croppedFile);
    } catch (err) {
      console.error("Erro no recorte:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-foreground p-5 sm:p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Crop className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Alternância de Proporções Rápidas (caso fornecidas) */}
          {allowedRatios && allowedRatios.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[0.7rem] font-bold text-muted-foreground mr-1">Proporção:</span>
              {allowedRatios.map((item) => (
                <Button
                  key={item.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAspectRatio(item.ratio);
                    handleReset();
                  }}
                  className={cn(
                    "h-7 text-xs font-bold px-2.5 rounded-lg border",
                    aspectRatio === item.ratio
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-zinc-900 border-zinc-800 text-muted-foreground hover:text-white"
                  )}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          )}

          {/* VIEWPORT DO CROP INTERATIVO */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className="relative w-full h-80 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          >
            {/* Imagem a ser manipulada */}
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Source Crop"
                draggable={false}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  transition: isDragging ? "none" : "transform 0.08s ease-out",
                }}
                className="pointer-events-none drop-shadow-md"
              />
            )}

            {/* Máscara escura com buraco central na proporção do Crop */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                style={{
                  width: `${cropWidth}px`,
                  height: `${cropHeight}px`,
                  boxShadow: "0 0 0 9999px rgba(9, 9, 11, 0.78)",
                }}
                className={cn(
                  "relative border-2 border-primary/90 transition-all",
                  cropShape === "round" ? "rounded-full" : "rounded-lg"
                )}
              >
                {/* Linhas guias tipo regra dos terços */}
                {cropShape === "rect" && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-primary/40" />
                    <div className="border-r border-b border-primary/40" />
                    <div className="border-b border-primary/40" />
                    <div className="border-r border-b border-primary/40" />
                    <div className="border-r border-b border-primary/40" />
                    <div className="border-b border-primary/40" />
                    <div className="border-r border-primary/40" />
                    <div className="border-r border-primary/40" />
                    <div />
                  </div>
                )}
              </div>
            </div>

            {/* Indicador de arraste */}
            <span className="absolute bottom-2 left-2 text-[10px] text-zinc-400 bg-black/70 px-2 py-0.5 rounded pointer-events-none font-medium backdrop-blur-xs">
              Arraste para mover • Scroll para zoom
            </span>
          </div>

          {/* CONTROLES DE ZOOM E ROTAÇÃO */}
          <div className="space-y-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            {/* Slider de Zoom */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-bold flex items-center gap-1.5 text-muted-foreground">
                  <ZoomIn className="h-3.5 w-3.5 text-primary" />
                  Zoom ({zoom.toFixed(1)}x)
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
                    disabled={zoom <= 1}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom((prev) => Math.min(4, prev + 0.2))}
                    disabled={zoom >= 4}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={4}
                step={0.05}
                onValueChange={(val) => setZoom(val[0])}
                className="cursor-pointer"
              />
            </div>

            {/* Botões de Ação Secundária: Girar e Resetar */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="h-7 text-xs font-bold gap-1 bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
                >
                  <RotateCw className="h-3 w-3 text-primary" />
                  Girar 90°
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 text-xs text-muted-foreground hover:text-white gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Resetar
                </Button>
              </div>

              <span className="text-[10px] text-muted-foreground font-mono">
                {cropShape === "round" ? "Avatar Redondo (1:1)" : `Banner (${aspectRatio.toFixed(2)}:1)`}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="bg-zinc-900 border-zinc-800 text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmCrop}
            disabled={isSaving || !imageObj}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1.5 shadow-md"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {isSaving ? "Processando e Enviando..." : "Cortar e Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
