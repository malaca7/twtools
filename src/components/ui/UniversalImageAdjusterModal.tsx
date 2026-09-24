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
import { Badge } from "@/components/ui/badge";
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
  Sliders,
  Sun,
  Contrast as ContrastIcon,
  Palette,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AspectRatioOption {
  label: string;
  ratio: number;
  isAuto?: boolean;
}

export interface UniversalImageAdjusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile?: File | null;
  imageUrl?: string | null;
  imageSrc?: string | null; // Compatibility alias
  originalImageUrl?: string | null; // URL da imagem original em alta resolução para reajuste
  cropShape?: "round" | "rect";
  defaultAspectRatio?: number;
  aspectRatioPreset?: string; // Compatibility alias
  allowedRatios?: AspectRatioOption[];
  targetWidth?: number;
  targetHeight?: number;
  title?: string;
  description?: string;
  onCropSave?: (croppedFile: File, originalFileOrUrl?: File | string) => Promise<void> | void;
  onSave?: (croppedBlob: Blob, croppedDataUrl: string, originalDataUrl?: string) => Promise<void> | void;
  isSaving?: boolean;
}

export function UniversalImageAdjusterModal({
  isOpen,
  onClose,
  imageFile,
  imageUrl,
  imageSrc: imageSrcProp,
  originalImageUrl,
  cropShape = "rect",
  defaultAspectRatio,
  allowedRatios,
  targetWidth,
  targetHeight,
  title = "Studio de Ajuste de Imagem",
  description = "Ajuste o enquadramento, rotação e iluminação com máxima precisão antes de salvar.",
  onCropSave,
  onSave,
  isSaving = false,
}: UniversalImageAdjusterModalProps) {
  // Imagem ativa para carregar no canvas (prioriza a imagem original se fornecida para reajuste)
  const effectiveImageUrl = originalImageUrl || imageUrl || imageSrcProp;

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Proporção original natural da imagem
  const [naturalAspectRatio, setNaturalAspectRatio] = useState<number>(1);
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);

  // Proporção ativa selecionada
  const [aspectRatio, setAspectRatio] = useState<number>(defaultAspectRatio || 1);

  // Transformações espaciais
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filtros de ajuste de cor e iluminação
  const [brightness, setBrightness] = useState<number>(100); // 100% = padrão (50% a 150%)
  const [contrast, setContrast] = useState<number>(100); // 100% = padrão (50% a 150%)
  const [saturation, setSaturation] = useState<number>(100); // 100% = padrão (0% a 200%)

  // Aba de controle ativa: "crop" | "filters"
  const [activeTab, setActiveTab] = useState<"crop" | "filters">("crop");

  // Arraste
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Inicializa imagem quando o arquivo ou URL mudar
  useEffect(() => {
    let isCancelled = false;
    let createdObjectUrl: string | null = null;

    if (!imageFile && !effectiveImageUrl) {
      setImageSrc(null);
      setImageObj(null);
      return;
    }

    setIsLoadingImage(true);

    const setupImage = (src: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;

      img.onload = () => {
        if (isCancelled) return;
        setImageObj(img);
        const naturalRatio = img.naturalWidth / img.naturalHeight;
        setNaturalAspectRatio(naturalRatio);
        setNaturalWidth(img.naturalWidth);
        setNaturalHeight(img.naturalHeight);

        const initialRatio = defaultAspectRatio || naturalRatio;
        setAspectRatio(initialRatio);

        // Reset transformações
        setZoom(1);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setPan({ x: 0, y: 0 });
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
        setIsLoadingImage(false);
      };

      img.onerror = () => {
        if (isCancelled) return;
        // Fallback sem crossOrigin se o servidor bloquear CORS
        const fallbackImg = new Image();
        fallbackImg.src = src;
        fallbackImg.onload = () => {
          if (isCancelled) return;
          setImageObj(fallbackImg);
          const naturalRatio = fallbackImg.naturalWidth / fallbackImg.naturalHeight;
          setNaturalAspectRatio(naturalRatio);
          setNaturalWidth(fallbackImg.naturalWidth);
          setNaturalHeight(fallbackImg.naturalHeight);
          setAspectRatio(defaultAspectRatio || naturalRatio);
          setZoom(1);
          setRotation(0);
          setFlipH(false);
          setFlipV(false);
          setPan({ x: 0, y: 0 });
          setIsLoadingImage(false);
        };
        fallbackImg.onerror = () => {
          if (isCancelled) return;
          setIsLoadingImage(false);
        };
      };
    };

    if (imageFile) {
      createdObjectUrl = URL.createObjectURL(imageFile);
      setImageSrc(createdObjectUrl);
      setupImage(createdObjectUrl);
    } else if (effectiveImageUrl) {
      // Baixa via fetch blob para garantir acesso completo no canvas
      fetch(effectiveImageUrl, { mode: "cors" })
        .then((res) => {
          if (!res.ok) throw new Error("CORS fetch failed");
          return res.blob();
        })
        .then((blob) => {
          if (isCancelled) return;
          createdObjectUrl = URL.createObjectURL(blob);
          setImageSrc(createdObjectUrl);
          setupImage(createdObjectUrl);
        })
        .catch(() => {
          if (isCancelled) return;
          setImageSrc(effectiveImageUrl);
          setupImage(effectiveImageUrl);
        });
    }

    return () => {
      isCancelled = true;
      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [imageFile, effectiveImageUrl, defaultAspectRatio]);

  // Lista de proporções disponíveis
  const computedRatios = useMemo(() => {
    const list: AspectRatioOption[] = [];

    // 1. Proporção Natural da Imagem
    if (imageObj && naturalAspectRatio) {
      list.push({
        label: `Original (${naturalWidth}x${naturalHeight})`,
        ratio: naturalAspectRatio,
        isAuto: true,
      });
    }

    // 2. Proporções personalizadas passadas
    if (allowedRatios && allowedRatios.length > 0) {
      for (const r of allowedRatios) {
        if (Math.abs(r.ratio - naturalAspectRatio) > 0.03) {
          list.push(r);
        }
      }
    } else {
      // Proporções padrão de excelência
      if (cropShape === "round") {
        list.push({ label: "1:1 Avatar Redondo", ratio: 1 });
      } else {
        const presets: AspectRatioOption[] = [
          { label: "16:9 Panorâmico", ratio: 16 / 9 },
          { label: "3:1 Banner Discord/Web", ratio: 3 },
          { label: "4:3 Comprovante/Print", ratio: 4 / 3 },
          { label: "1:1 Quadrado", ratio: 1 },
        ];
        for (const p of presets) {
          if (Math.abs(p.ratio - naturalAspectRatio) > 0.03) {
            list.push(p);
          }
        }
      }
    }

    return list;
  }, [imageObj, naturalAspectRatio, naturalWidth, naturalHeight, allowedRatios, cropShape]);

  // Dimensões do Crop Box no visor da tela
  const CROP_BOX_MAX_WIDTH = 480;
  const CROP_BOX_MAX_HEIGHT = 200;

  let cropWidth = CROP_BOX_MAX_WIDTH;
  let cropHeight = cropWidth / (aspectRatio || 1);

  if (cropHeight > CROP_BOX_MAX_HEIGHT) {
    cropHeight = CROP_BOX_MAX_HEIGHT;
    cropWidth = cropHeight * (aspectRatio || 1);
  }
  if (cropWidth > CROP_BOX_MAX_WIDTH) {
    cropWidth = CROP_BOX_MAX_WIDTH;
    cropHeight = cropWidth / (aspectRatio || 1);
  }

  // Handlers de mouse / touch para mover a imagem no visor
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
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 5));
  };

  // Resetar tudo para a imagem original limpa
  const handleResetAll = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPan({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    if (defaultAspectRatio) {
      setAspectRatio(defaultAspectRatio);
    } else if (naturalAspectRatio) {
      setAspectRatio(naturalAspectRatio);
    }
  };

  // Girar 90 graus
  const handleRotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Dimensões base da imagem dentro do visor
  const imgNaturalAspect = imageObj ? imageObj.naturalWidth / imageObj.naturalHeight : aspectRatio;
  let baseDrawWidth = cropWidth;
  let baseDrawHeight = cropHeight;

  if (imgNaturalAspect > aspectRatio) {
    baseDrawHeight = cropHeight;
    baseDrawWidth = cropHeight * imgNaturalAspect;
  } else {
    baseDrawWidth = cropWidth;
    baseDrawHeight = cropWidth / (imgNaturalAspect || 1);
  }

  // String de filtros CSS para o preview
  const filterCss = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  // Executar corte profissional em alta definição e exportar
  const handleConfirmCrop = async () => {
    if (!imageObj) return;

    try {
      const finalWidth = targetWidth || (cropShape === "round" ? 512 : Math.min(Math.max(1280, naturalWidth), 2560));
      const finalHeight = targetHeight || Math.round(finalWidth / (aspectRatio || 1));

      const canvas = document.createElement("canvas");
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Não foi possível inicializar o canvas de renderização.");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fundo escuro base
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, finalWidth, finalHeight);

      // Aplica filtros no contexto canvas
      ctx.filter = filterCss;

      ctx.save();

      // Mover origem para o centro do canvas final
      ctx.translate(finalWidth / 2, finalHeight / 2);

      // Aplica rotação e inversões
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      const screenToCanvasFactor = finalWidth / cropWidth;
      const renderW = baseDrawWidth * screenToCanvasFactor;
      const renderH = baseDrawHeight * screenToCanvasFactor;
      const renderPanX = pan.x * screenToCanvasFactor;
      const renderPanY = pan.y * screenToCanvasFactor;

      ctx.drawImage(
        imageObj,
        (-renderW * zoom) / 2 + (flipH ? -renderPanX : renderPanX),
        (-renderH * zoom) / 2 + (flipV ? -renderPanY : renderPanY),
        renderW * zoom,
        renderH * zoom
      );

      ctx.restore();

      // Exportar Canvas para Blob
      const isPng = (imageFile?.type || effectiveImageUrl || "").toLowerCase().includes("png");
      const mimeType = isPng ? "image/png" : "image/jpeg";

      let blob: Blob | null = null;
      let dataUrl: string = "";

      try {
        blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), mimeType, 0.95);
        });
        if (blob) {
          dataUrl = canvas.toDataURL(mimeType, 0.95);
        }
      } catch (canvasErr: any) {
        console.warn("⚠️ Aviso no canvas export (possível CORS na imagem de origem):", canvasErr);
      }

      if (!blob && imageFile) {
        blob = imageFile;
      }

      if (!blob) {
        throw new Error("Erro ao gerar arquivo renderizado. A imagem de origem pode ter bloqueio de CORS.");
      }

      const baseName = imageFile?.name
        ? imageFile.name.replace(/\.[^/.]+$/, "")
        : "imagem_ajustada";
      const croppedFileName = `${baseName}_pro.${isPng ? "png" : "jpg"}`;
      const croppedFile = new File([blob], croppedFileName, { type: mimeType });

      // Salva o arquivo ajustado e preserva a fonte original (File ou URL)
      if (onCropSave) {
        await onCropSave(croppedFile, imageFile || effectiveImageUrl || undefined);
      }
      if (onSave) {
        await onSave(
          blob,
          dataUrl || (typeof (imageFile || effectiveImageUrl) === "string" ? (imageFile || effectiveImageUrl) as string : ""),
          typeof (imageFile || effectiveImageUrl) === "string"
            ? ((imageFile || effectiveImageUrl) as string)
            : undefined
        );
      }
    } catch (err: any) {
      console.error("Erro no processamento da imagem:", err);
      toast.error(err?.message || "Erro no processamento da imagem.");
    }
  };

  const hasFilterChanges = brightness !== 100 || contrast !== 100 || saturation !== 100;
  const hasTransformChanges = zoom > 1 || rotation !== 0 || flipH || flipV || pan.x !== 0 || pan.y !== 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-zinc-950/95 backdrop-blur-xl border-zinc-800 text-foreground p-0 gap-0 flex flex-col max-h-[94vh] overflow-y-auto shadow-2xl rounded-3xl border">
        {/* CABEÇALHO */}
        <DialogHeader className="p-4 sm:p-5 pb-3 shrink-0 border-b border-zinc-800/80 bg-zinc-950/80 flex flex-row items-center justify-between gap-3 pr-12">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Crop className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-black text-white truncate">
                {title}
              </DialogTitle>
              {originalImageUrl && (
                <Badge variant="outline" className="hidden sm:inline-flex text-[9px] font-mono border-cyan-500/40 text-cyan-300 bg-cyan-500/10">
                  ✨ Imagem Original Preservada
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-muted-foreground truncate">
              {description}
            </DialogDescription>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Button
              type="button"
              onClick={handleConfirmCrop}
              disabled={isSaving || !imageObj || isLoadingImage}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 h-8 px-3.5 rounded-xl shadow-md cursor-pointer transition-all hover:scale-105"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              )}
              <span>Salvar</span>
            </Button>
          </div>
        </DialogHeader>

        {/* CORPO DO STUDIO */}
        <div className="p-4 sm:p-5 space-y-4 min-h-0 bg-zinc-950/50 flex-1">
          {/* SELETOR DE PROPORÇÕES (ASPECT RATIO PRESETS) */}
          {computedRatios.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground mr-1">
                Proporção:
              </span>
              {computedRatios.map((item) => {
                const isActive = Math.abs(aspectRatio - item.ratio) < 0.02;
                return (
                  <Button
                    key={item.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAspectRatio(item.ratio);
                      setPan({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                    className={cn(
                      "h-7 text-xs font-bold px-2.5 rounded-lg border transition-all gap-1.5 cursor-pointer",
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                        : "bg-zinc-900 border-zinc-800 text-muted-foreground hover:text-white hover:bg-zinc-800"
                    )}
                  >
                    {item.isAuto && <Sparkles className="h-3 w-3 text-emerald-300" />}
                    <span>{item.label}</span>
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
            className="relative w-full h-56 sm:h-64 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-inner"
          >
            {/* Loading state da imagem */}
            {isLoadingImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/90 z-30">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <span className="text-xs font-bold text-zinc-300">Carregando imagem original...</span>
              </div>
            )}

            {/* Imagem a ser manipulada */}
            {imageSrc && !isLoadingImage && (
              <img
                src={imageSrc}
                alt="Source Studio"
                draggable={false}
                style={{
                  width: `${baseDrawWidth}px`,
                  height: `${baseDrawHeight}px`,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  transformOrigin: "center center",
                  filter: filterCss,
                  maxWidth: "none",
                  maxHeight: "none",
                  transition: isDragging ? "none" : "transform 0.08s ease-out",
                }}
                className="pointer-events-none drop-shadow-md select-none absolute"
              />
            )}

            {/* Máscara escura ao redor da área de corte */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div
                style={{
                  width: `${cropWidth}px`,
                  height: `${cropHeight}px`,
                  boxShadow: "0 0 0 9999px rgba(9, 9, 11, 0.85)",
                }}
                className={cn(
                  "relative border-2 border-emerald-500 shadow-2xl transition-all",
                  cropShape === "round" ? "rounded-full" : "rounded-xl"
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
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[10px] text-zinc-300 bg-black/85 border border-zinc-800 px-2.5 py-1 rounded-lg pointer-events-none font-medium backdrop-blur-md shadow-md z-20">
              <Move className="h-3 w-3 text-emerald-400" />
              <span>Arraste para mover • Scroll para zoom</span>
            </div>

            {/* Resolução original */}
            {naturalWidth > 0 && (
              <div className="absolute top-2 right-2 text-[10px] font-mono text-zinc-400 bg-black/80 border border-zinc-800 px-2 py-0.5 rounded-md pointer-events-none z-20">
                {naturalWidth} × {naturalHeight} px
              </div>
            )}
          </div>

          {/* ABAS DE FERRAMENTAS DO STUDIO: ENQUADRAMENTO VS FILTROS */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/90 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 rounded-xl border border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setActiveTab("crop")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer",
                    activeTab === "crop"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Crop className="h-3.5 w-3.5" />
                  <span>Enquadramento</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("filters")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer",
                    activeTab === "filters"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span>Filtros & Cor</span>
                  {hasFilterChanges && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              </div>

              {(hasFilterChanges || hasTransformChanges) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetAll}
                  className="h-7 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1 rounded-lg cursor-pointer"
                >
                  <Undo2 className="h-3 w-3" />
                  <span>Resetar Ajustes</span>
                </Button>
              )}
            </div>

            {/* ABA 1: ENQUADRAMENTO (ZOOM, ROTAÇÃO, INVERSÃO) */}
            {activeTab === "crop" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="font-bold flex items-center gap-1.5 text-zinc-200">
                      <ZoomIn className="h-3.5 w-3.5 text-emerald-400" />
                      Zoom: <span className="text-white font-mono font-bold">{zoom.toFixed(1)}x</span>
                    </Label>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
                        disabled={zoom <= 1}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-white cursor-pointer"
                        title="Diminuir Zoom"
                      >
                        <ZoomOut className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setZoom((prev) => Math.min(5, prev + 0.2))}
                        disabled={zoom >= 5}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-white cursor-pointer"
                        title="Aumentar Zoom"
                      >
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Slider
                    value={[zoom]}
                    min={1}
                    max={5}
                    step={0.05}
                    onValueChange={(val) => setZoom(val[0])}
                    className="cursor-pointer"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRotate90}
                      className="h-7 text-xs font-bold gap-1 bg-zinc-950 border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg cursor-pointer"
                    >
                      <RotateCw className="h-3 w-3 text-emerald-400" />
                      Girar 90°
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFlipH((prev) => !prev)}
                      className={cn(
                        "h-7 text-xs font-bold gap-1 rounded-lg cursor-pointer transition-colors",
                        flipH
                          ? "bg-emerald-600 text-white border-emerald-500"
                          : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      )}
                    >
                      <FlipHorizontal className="h-3 w-3" />
                      Inverter H
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFlipV((prev) => !prev)}
                      className={cn(
                        "h-7 text-xs font-bold gap-1 rounded-lg cursor-pointer transition-colors",
                        flipV
                          ? "bg-emerald-600 text-white border-emerald-500"
                          : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                      )}
                    >
                      <FlipVertical className="h-3 w-3" />
                      Inverter V
                    </Button>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-mono">
                    {cropShape === "round"
                      ? "Avatar Redondo (1:1)"
                      : `Proporção (${aspectRatio.toFixed(2)}:1)`}
                  </span>
                </div>
              </div>
            )}

            {/* ABA 2: FILTROS & ILUMINAÇÃO */}
            {activeTab === "filters" && (
              <div className="grid gap-3 sm:grid-cols-3 pt-1 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-zinc-300">
                    <span className="flex items-center gap-1">
                      <Sun className="h-3 w-3 text-amber-400" /> Brilho
                    </span>
                    <span className="font-mono text-white">{brightness}%</span>
                  </div>
                  <Slider
                    value={[brightness]}
                    min={50}
                    max={150}
                    step={1}
                    onValueChange={(v) => setBrightness(v[0])}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-zinc-300">
                    <span className="flex items-center gap-1">
                      <ContrastIcon className="h-3 w-3 text-sky-400" /> Contraste
                    </span>
                    <span className="font-mono text-white">{contrast}%</span>
                  </div>
                  <Slider
                    value={[contrast]}
                    min={50}
                    max={150}
                    step={1}
                    onValueChange={(v) => setContrast(v[0])}
                    className="cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-zinc-300">
                    <span className="flex items-center gap-1">
                      <Palette className="h-3 w-3 text-pink-400" /> Saturação
                    </span>
                    <span className="font-mono text-white">{saturation}%</span>
                  </div>
                  <Slider
                    value={[saturation]}
                    min={0}
                    max={200}
                    step={1}
                    onValueChange={(v) => setSaturation(v[0])}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RODAPÉ */}
        <DialogFooter className="p-3.5 sm:p-4 shrink-0 border-t border-zinc-800 bg-zinc-950 flex flex-row items-center justify-between gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-xs font-bold text-zinc-300 px-4 h-9 rounded-xl cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleConfirmCrop}
            disabled={isSaving || !imageObj || isLoadingImage}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold gap-2 px-5 py-2 h-9 rounded-xl shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.02] cursor-pointer"
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
