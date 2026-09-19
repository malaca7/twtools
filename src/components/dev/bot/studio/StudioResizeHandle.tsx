import React, { useState, useEffect, useCallback, useRef } from "react";
import { GripVertical, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioResizeHandleProps {
  direction: "vertical" | "horizontal";
  onResize: (delta: number, currentPos: { x: number; y: number }) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  onDoubleClick?: () => void;
  min?: number;
  max?: number;
  currentValue?: number;
  className?: string;
  label?: string;
  position?: "left" | "right" | "top" | "bottom";
}

export function StudioResizeHandle({
  direction,
  onResize,
  onResizeStart,
  onResizeEnd,
  onDoubleClick,
  currentValue,
  className,
  label,
  position = "right",
}: StudioResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true);
      startPosRef.current = { x: clientX, y: clientY };
      onResizeStart?.();
    },
    [onResizeStart]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }
    },
    [handleStart]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.x;
      const deltaY = e.clientY - startPosRef.current.y;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      const delta = direction === "vertical" ? deltaX : deltaY;
      onResize(delta, { x: e.clientX, y: e.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - startPosRef.current.x;
        const deltaY = touch.clientY - startPosRef.current.y;
        startPosRef.current = { x: touch.clientX, y: touch.clientY };

        const delta = direction === "vertical" ? deltaX : deltaY;
        onResize(delta, { x: touch.clientX, y: touch.clientY });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      onResizeEnd?.();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    // Prevent text selection while dragging
    document.body.style.userSelect = "none";
    document.body.style.cursor =
      direction === "vertical" ? "col-resize" : "row-resize";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, direction, onResize, onResizeEnd]);

  if (direction === "vertical") {
    return (
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={onDoubleClick}
        className={cn(
          "w-3 hover:w-3.5 -mx-1.5 z-30 cursor-col-resize flex items-center justify-center group select-none relative transition-all duration-150 shrink-0",
          isDragging && "w-3.5 bg-emerald-500/20",
          className
        )}
        title={label ? `${label} (Arraste para redimensionar ou duplo clique para redefinir)` : "Arraste para redimensionar"}
      >
        {/* Visual Line */}
        <div
          className={cn(
            "w-[2px] h-full transition-colors duration-150",
            isDragging
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
              : "bg-zinc-800/80 group-hover:bg-emerald-500/60"
          )}
        />

        {/* Central Grab Handle Pill */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-9 rounded-full border flex items-center justify-center shadow-lg transition-all duration-150 backdrop-blur-sm",
            isDragging
              ? "bg-emerald-600 border-emerald-400 text-white scale-110"
              : "bg-zinc-900/90 border-zinc-700/80 text-zinc-400 group-hover:border-emerald-500/60 group-hover:text-emerald-400 group-hover:scale-105"
          )}
        >
          <GripVertical className="h-3 w-3" />
        </div>

        {/* Floating Tooltip when dragging */}
        {isDragging && typeof currentValue === "number" && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-zinc-900 border border-emerald-500/50 text-[10px] font-mono font-bold text-emerald-400 shadow-xl pointer-events-none whitespace-nowrap z-50">
            {label ? `${label}: ` : ""}{Math.round(currentValue)}px
          </div>
        )}
      </div>
    );
  }

  // Horizontal Resize Handle (for bottom bar or mobile bottom sheet)
  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={onDoubleClick}
      className={cn(
        "h-3.5 hover:h-4 -my-1.5 z-30 cursor-row-resize flex items-center justify-center group select-none relative transition-all duration-150 shrink-0 w-full",
        isDragging && "h-4 bg-emerald-500/20",
        className
      )}
      title={label ? `${label} (Arraste para redimensionar ou duplo clique para redefinir)` : "Arraste para redimensionar"}
    >
      {/* Visual Line */}
      <div
        className={cn(
          "h-[2px] w-full transition-colors duration-150",
          isDragging
            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
            : "bg-zinc-800/80 group-hover:bg-emerald-500/60"
        )}
      />

      {/* Central Grab Handle Pill */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 h-4 w-12 rounded-full border flex items-center justify-center shadow-lg transition-all duration-150 backdrop-blur-sm",
          isDragging
            ? "bg-emerald-600 border-emerald-400 text-white scale-110"
            : "bg-zinc-900/90 border-zinc-700/80 text-zinc-400 group-hover:border-emerald-500/60 group-hover:text-emerald-400 group-hover:scale-105"
        )}
      >
        <GripHorizontal className="h-3 w-3" />
      </div>

      {/* Floating Tooltip when dragging */}
      {isDragging && typeof currentValue === "number" && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-zinc-900 border border-emerald-500/50 text-[10px] font-mono font-bold text-emerald-400 shadow-xl pointer-events-none whitespace-nowrap z-50">
          {label ? `${label}: ` : ""}{Math.round(currentValue)}px
        </div>
      )}
    </div>
  );
}
