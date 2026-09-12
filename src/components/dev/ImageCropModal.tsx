import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  Crop,
  Check,
  RefreshCw,
  Loader2,
  Move,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  cropShape?: "round" | "rect";
  defaultAspectRatio?: number; // width / height
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
  defaultAspectRatio,
  title = "Ajustar e Recortar Imagem",
  description = "A proporção é automática com a imagem original. Arraste para reposicionar ou dê zoom.",
  targetWidth,
  targetHeight,
  allowedRatios,
  onCropSave,
  isSaving = false,
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Proporção original natural da imagem
  const [naturalAspectRatio, setNaturalAspectRatio] = useState<number>(1);

  // Proporção ativa
  const [aspectRatio, setAspectRatio] = useState<number>(defaultAspectRatio || 1);

  // Transformações
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Arraste
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Inicializa imagem quando o arquivo muda e define a proporção AUTOMÁTICA da imagem
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
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      setNaturalAspectRatio(naturalRatio);

      // PROPORÇÃO AUTOMÁTICA: se não for forçado um default específico, adota a proporção natural da imagem
      const initialRatio = defaultAspectRatio || naturalRatio;
      setAspectRatio(initialRatio);

      // Reset transformações
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile, defaultAspectRatio]);

  // Lista de proporções computadas (Automática em primeiro lugar)
  const computedRatios = useMemo(() => {
    const list: { label: string; ratio: number; isAuto?: boolean }[] = [];

    if (imageObj && naturalAspectRatio) {
      list.push({
        label: `Automática (${imageObj.naturalWidth}x${imageObj.naturalHeight})`,
        ratio: naturalAspectRatio,
        isAuto: true,
      });
    }

    if (allowedRatios && allowedRatios.length > 0) {
      for (const r of allowedRatios) {
        // Evita duplicata se a proporção natural for idêntica
        if (Math.abs(r.ratio - naturalAspectRatio) > 0.04) {
          list.push(r);
        }
      }
    } else if (cropShape === "round") {
      if (Math.abs(1 - naturalAspectRatio) > 0.04) {
        list.push({ label: "1:1 Quadrado (Discord)", ratio: 1 });
      }
    }

    return list;
  }, [imageObj, naturalAspectRatio, allowedRatios, cropShape]);

  // Dimensões dinâmicas e compactas do Crop Box na tela (evita estourar altura e esconder botões)
  const CROP_BOX_MAX_WIDTH = 460;
  const CROP_BOX_MAX_HEIGHT = 180;

  let cropWidth = CROP_BOX_MAX_WIDTH;
  let cropHeight = cropWidth / aspectRatio;

  if (cropHeight > CROP_BOX_MAX_HEIGHT) {
    cropHeight = CROP_BOX_MAX_HEIGHT;
    cropWidth = cropHeight * aspectRatio;
  }
  if (cropWidth > CROP_BOX_MAX_WIDTH) {
    cropWidth = CROP_BOX_MAX_WIDTH;
    cropHeight = cropWidth / aspectRatio;
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

  // Dimensões base da imagem dentro do box
  const imgNaturalAspect = imageObj ? imageObj.naturalWidth / imageObj.naturalHeight : aspectRatio;
  let baseDrawWidth = cropWidth;
  let baseDrawHeight = cropHeight;

  if (imgNaturalAspect > aspectRatio) {
    baseDrawHeight = cropHeight;
    baseDrawWidth = cropHeight * imgNaturalAspect;
  } else {
    baseDrawWidth = cropWidth;
    baseDrawHeight = cropWidth / imgNaturalAspect;
  }

  // Executar corte e exportar Canvas para File
  const handleConfirmCrop = async () => {
    if (!imageObj || !imageFile) return;

    try {
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

      // Fundo escuro
      ctx.fillStyle = "#18181b";
      ctx.fillRect(0, 0, finalWidth, finalHeight);

      ctx.save();

      // Mover origem para o centro do canvas final
      ctx.translate(finalWidth / 2, finalHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      const screenToCanvasFactor = finalWidth / cropWidth;
      const renderW = baseDrawWidth * screenToCanvasFactor;
      const renderH = baseDrawHeight * screenToCanvasFactor;
      const renderPanX = pan.x * screenToCanvasFactor;
      const renderPanY = pan.y * screenToCanvasFactor;

      ctx.drawImage(
        imageObj,
        (-renderW * zoom) / 2 + renderPanX,
        (-renderH * zoom) / 2 + renderPanY,
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

      const croppedFileName =
        imageFile.name.replace(/\.[^/.]+$/, "") +
        "_cropped." +
        (mimeType === "image/png" ? "png" : "jpg");
      const croppedFile = new File([blob], croppedFileName, { type: mimeType });

      await onCropSave(croppedFile);
    } catch (err) {
      console.error("Erro no recorte:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-foreground p-0 gap-0 flex flex-col max-h-[92vh] overflow-y-auto shadow-2xl rounded-2xl">
        {/* CABEÇALHO COM BOTÃO RÁPIDO DE SALVAR NO TOPO */}
        <DialogHeader className="p-4 sm:p-5 pb-3 shrink-0 border-b border-zinc-800/80 bg-zinc-950 flex flex-row items-center justify-between gap-3 pr-12">
          <div className="space-y-0.5">
            <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-white">
              <Crop className="h-5 w-5 text-emerald-400" />
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {description}
            </DialogDescription>
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              onClick={handleConfirmCrop}
              disabled={isSaving || !imageObj}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 h-8 px-3 rounded-lg shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              )}
              Salvar
            </Button>
          </div>
        </DialogHeader>

        {/* CORPO DO MODAL */}
        <div className="p-4 sm:p-5 space-y-3.5 min-h-0 bg-zinc-950/60 flex-1">
          {/* SELETOR DE PROPORÇÕES (COM AUTOMÁTICA EM DESTAQUE) */}
          {computedRatios.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[0.7rem] font-bold text-muted-foreground mr-1 uppercase tracking-wider">
                Proporção:
              </span>
              {computedRatios.map((item) => {
                const isActive = Math.abs(aspectRatio - item.ratio) < 0.01;
                return (
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
                      "h-7 text-xs font-bold px-2.5 rounded-lg border transition-all gap-1.5",
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                        : "bg-zinc-900 border-zinc-800 text-muted-foreground hover:text-white"
                    )}
                  >
                    {item.isAuto && <Sparkles className="h-3 w-3 text-emerald-300" />}
                    {item.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* VIEWPORT INTERATIVO DE CORTE E ARRASTE */}
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
            className="relative w-full h-52 sm:h-56 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-inner"
          >
            {/* Imagem a ser manipulada */}
            {imageSrc && (
              <img
                src={imageSrc}
                alt="Source Crop"
                draggable={false}
                style={{
                  width: `${baseDrawWidth}px`,
                  height: `${baseDrawHeight}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  maxWidth: "none",
                  maxHeight: "none",
                  transition: isDragging ? "none" : "transform 0.08s ease-out",
                }}
                className="pointer-events-none drop-shadow-md select-none absolute"
              />
            )}

            {/* Máscara escura ao redor da área de corte */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                style={{
                  width: `${cropWidth}px`,
                  height: `${cropHeight}px`,
                  boxShadow: "0 0 0 9999px rgba(9, 9, 11, 0.82)",
                }}
                className={cn(
                  "relative border-2 border-emerald-500 shadow-2xl transition-all",
                  cropShape === "round" ? "rounded-full" : "rounded-lg"
                )}
              >
                {/* Linhas guias tipo regra dos terços */}
                {cropShape === "rect" && (
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-emerald-400/40" />
                    <div className="border-r border-b border-emerald-400/40" />
                    <div className="border-b border-emerald-400/40" />
                    <div className="border-r border-b border-emerald-400/40" />
                    <div className="border-r border-b border-emerald-400/40" />
                    <div className="border-b border-emerald-400/40" />
                    <div className="border-r border-b border-emerald-400/40" />
                    <div className="border-r border-b border-emerald-400/40" />
                    <div />
                  </div>
                )}
              </div>
            </div>

            {/* Badge orientativa flutuante */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] text-zinc-300 bg-black/80 border border-zinc-800/80 px-2 py-0.5 rounded-md pointer-events-none font-medium backdrop-blur-sm shadow-md">
              <Move className="h-3 w-3 text-emerald-400" />
              <span>Arraste para mover • Scroll da roda para zoom</span>
            </div>
          </div>

          {/* BARRA DE CONTROLE: ZOOM, ROTAÇÃO E RESET */}
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <Label className="font-bold flex items-center gap-1.5 text-zinc-300">
                <ZoomIn className="h-3.5 w-3.5 text-emerald-400" />
                Zoom: <span className="text-white font-mono">{zoom.toFixed(1)}x</span>
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
                  disabled={zoom <= 1}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-white"
                  title="Diminuir Zoom"
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
                  title="Aumentar Zoom"
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

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                  className="h-7 text-xs font-bold gap-1 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                >
                  <RotateCw className="h-3 w-3 text-emerald-400" />
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
                  Resetar Posição
                </Button>
              </div>

              <span className="text-[10px] text-zinc-400 font-mono">
                {cropShape === "round"
                  ? "Avatar Redondo (1:1)"
                  : `Proporção (${aspectRatio.toFixed(2)}:1)`}
              </span>
            </div>
          </div>
        </div>

        {/* RODAPÉ COM BOTÕES DE AÇÃO */}
        <DialogFooter className="p-3.5 sm:p-4 shrink-0 border-t border-zinc-800 bg-zinc-950 flex flex-row items-center justify-between gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-xs font-bold text-zinc-300 px-4 h-9"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirmCrop}
            disabled={isSaving || !imageObj}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold gap-2 px-5 py-2 h-9 rounded-lg shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.02]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processando e Salvando...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[2.5]" />
                <span>Confirmar Ajuste e Salvar</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
