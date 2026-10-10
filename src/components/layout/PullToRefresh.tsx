import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ArrowDown, Check } from "lucide-react";
import { toast } from "sonner";
import { playGamerSuccessSound } from "@/lib/sound-effects";
import { cn } from "@/lib/utils";

const PULL_THRESHOLD = 65; // pixels needed to trigger refresh
const RESISTANCE = 0.45; // drag resistance multiplier

export function PullToRefresh() {
  const queryClient = useQueryClient();
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const startYRef = useRef<number | null>(null);
  const currentYRef = useRef<number | null>(null);
  const isThresholdMetRef = useRef(false);
  const isRefreshingRef = useRef(false);

  isRefreshingRef.current = isRefreshing;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshingRef.current) return;

    // Apenas ativa se o scroll da janela estiver no topo (scrollTop === 0)
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop > 2) return;

    // Não ativa se o toque for dentro de modals, inputs ou elementos com scroll próprio
    const target = e.target as HTMLElement | null;
    if (target) {
      if (
        target.closest("[role='dialog']") ||
        target.closest(".dialog-content") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select") ||
        target.closest("[data-prevent-pull-refresh='true']")
      ) {
        return;
      }
    }

    if (e.touches.length === 1) {
      startYRef.current = e.touches[0].clientY;
      currentYRef.current = startYRef.current;
      isThresholdMetRef.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startYRef.current === null || isRefreshingRef.current) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop > 2 && pullDistance === 0) {
      startYRef.current = null;
      return;
    }

    const currentY = e.touches[0].clientY;
    currentYRef.current = currentY;

    const deltaY = currentY - startYRef.current;

    // Apenas se estiver puxando para baixo
    if (deltaY > 0) {
      const distance = Math.min(deltaY * RESISTANCE, 110);
      setPullDistance(distance);
      setIsPulling(true);

      const isMet = distance >= PULL_THRESHOLD;
      if (isMet && !isThresholdMetRef.current) {
        isThresholdMetRef.current = true;
        // Vibração háptica leve ao atingir o limite
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate(12);
          } catch {}
        }
      } else if (!isMet && isThresholdMetRef.current) {
        isThresholdMetRef.current = false;
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null || isRefreshingRef.current) {
      startYRef.current = null;
      return;
    }

    const finalDistance = pullDistance;
    startYRef.current = null;

    if (finalDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);

      try {
        // Invalida todas as queries ativas do React Query para recarregar dados em tempo real
        await queryClient.invalidateQueries();

        // Dispara evento customizado para componentes inscritos
        window.dispatchEvent(new CustomEvent("tw_pull_to_refresh"));

        playGamerSuccessSound(40);
        setIsSuccess(true);
        toast.success("Dados atualizados com sucesso!", {
          duration: 2000,
          id: "pull-to-refresh-toast",
        });

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.warn("⚠️ Falha ao atualizar via pull-to-refresh:", err);
      } finally {
        setIsSuccess(false);
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
        isThresholdMetRef.current = false;
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
      isThresholdMetRef.current = false;
    }
  }, [pullDistance, queryClient]);

  useEffect(() => {
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!isPulling && !isRefreshing && pullDistance === 0) {
    return null;
  }

  const isThresholdMet = pullDistance >= PULL_THRESHOLD;
  const rotation = Math.min(pullDistance * 3.5, 360);

  return (
    <div
      className={cn(
        "fixed top-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-transform duration-200 ease-out select-none",
        isRefreshing ? "translate-y-2 opacity-100" : ""
      )}
      style={{
        transform: !isRefreshing
          ? `translate(-50%, ${Math.min(pullDistance, 80)}px)`
          : undefined,
        opacity: Math.min(pullDistance / (PULL_THRESHOLD * 0.7), 1),
      }}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-2xl transition-all duration-150",
          isSuccess
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20"
            : isRefreshing
            ? "bg-primary/20 border-primary/40 text-primary shadow-primary/20 animate-pulse"
            : isThresholdMet
            ? "bg-primary/25 border-primary/50 text-primary-foreground shadow-primary/30 scale-105"
            : "bg-background/90 border-border/80 text-muted-foreground shadow-black/40"
        )}
      >
        <div
          className={cn(
            "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-transform duration-100",
            isRefreshing && !isSuccess ? "animate-spin" : ""
          )}
          style={{
            transform: !isRefreshing && !isSuccess ? `rotate(${rotation}deg)` : undefined,
          }}
        >
          {isSuccess ? (
            <Check className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
          ) : isRefreshing ? (
            <RefreshCw className="h-4 w-4 text-primary stroke-[2.5]" />
          ) : (
            <ArrowDown
              className={cn(
                "h-4 w-4 transition-transform duration-200 stroke-[2.5]",
                isThresholdMet ? "rotate-180 text-primary" : "text-muted-foreground"
              )}
            />
          )}
        </div>

        <span className="text-xs font-bold font-display tracking-wide whitespace-nowrap">
          {isSuccess
            ? "Atualizado!"
            : isRefreshing
            ? "Atualizando dados..."
            : isThresholdMet
            ? "Solte para atualizar"
            : "Puxe para atualizar"}
        </span>
      </div>
    </div>
  );
}
