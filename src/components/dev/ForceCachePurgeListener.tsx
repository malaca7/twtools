import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Sparkles, ShieldAlert, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchLastForceCachePurge, type ForceCachePurgeRecord } from "@/services/devService";

const STORAGE_LAST_PURGE = "tw_last_force_purge_ts";

export function ForceCachePurgeListener() {
  const queryClient = useQueryClient();
  const [isPurging, setIsPurging] = useState(false);
  const [purgeData, setPurgeData] = useState<ForceCachePurgeRecord | null>(null);
  const [progress, setProgress] = useState(0);
  const isExecutingRef = useRef(false);

  const executePurgeAndReload = async (record: ForceCachePurgeRecord) => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;

    setPurgeData(record);
    setIsPurging(true);
    setProgress(15);

    // Marca imediatamente no localStorage para evitar loop de recarregamento
    try {
      localStorage.setItem(STORAGE_LAST_PURGE, String(record.timestamp));
    } catch {
      // Ignora erro de cota de storage
    }

    // 1. Limpeza assíncrona do Cache Storage da Web API
    try {
      if (typeof window !== "undefined" && "caches" in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
    } catch (err) {
      console.warn("Aviso ao limpar Cache Storage:", err);
    }

    // 2. Desregistrar Service Workers ativos
    try {
      if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (err) {
      console.warn("Aviso ao desregistrar Service Workers:", err);
    }

    // 3. Limpeza do TanStack Query Cache
    try {
      queryClient.clear();
    } catch (err) {
      console.warn("Aviso ao limpar queryClient:", err);
    }

    // 4. Limpeza de SessionStorage
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.clear();
      }
    } catch {
      // Ignora erro
    }

    // Animação de progresso suave e elegante (0 -> 100% em ~1.8s)
    const startTime = Date.now();
    const duration = 1800;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(Math.max(15, currentPct));

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(() => {
          // Recarregamento forçado desconsiderando cache do navegador
          try {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set("_purge", String(record.timestamp));
            window.location.replace(currentUrl.toString());
          } catch {
            window.location.reload();
          }
        }, 150);
      }
    }, 40);
  };

  useEffect(() => {
    // 1. Verifica no banco se houve uma ordem de limpeza emitida recentemente (últimos 3 minutos)
    const checkInitialPurge = async () => {
      try {
        const lastRecord = await fetchLastForceCachePurge();
        if (!lastRecord || !lastRecord.timestamp) return;

        const lastProcessed = Number(localStorage.getItem(STORAGE_LAST_PURGE) || "0");
        const ageMs = Date.now() - lastRecord.timestamp;

        // Se a instrução tem menos de 3 minutos e ainda não foi processada por este cliente
        if (lastRecord.timestamp > lastProcessed && ageMs < 180000) {
          void executePurgeAndReload(lastRecord);
        }
      } catch (err) {
        console.warn("Falha ao checar registro inicial de purga:", err);
      }
    };

    void checkInitialPurge();

    // 2. Escuta canal WebSocket Realtime global para disparo instantâneo
    const channel = supabase
      .channel("global-twtools-realtime")
      .on("broadcast", { event: "force_cache_purge" }, ({ payload }) => {
        if (!payload || !payload.timestamp) return;
        const lastProcessed = Number(localStorage.getItem(STORAGE_LAST_PURGE) || "0");
        if (payload.timestamp > lastProcessed) {
          void executePurgeAndReload(payload as ForceCachePurgeRecord);
        }
      })
      .subscribe();

    return () => {
      // Não remove o canal se compartilhado com o useRealtimeSync
    };
  }, []);

  if (!isPurging) return null;

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-300 select-none p-4"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#090e1a]/95 p-6 shadow-[0_0_60px_rgba(6,182,212,0.25)] text-left backdrop-blur-2xl">
        {/* Glow de fundo */}
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Top badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
              <span>Atualização do Sistema</span>
            </div>
            <span className="text-[0.7rem] font-mono text-cyan-400/70">{progress}%</span>
          </div>

          {/* Ícone principal e Título */}
          <div className="flex items-start gap-3.5 pt-1">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/15 text-cyan-400 shadow-inner shadow-cyan-500/20">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white">
                Sincronizando Novas Melhorias
              </h2>
              <p className="mt-0.5 text-xs text-slate-300">
                Limpando caches locais e atualizando para a versão mais recente em segundo plano.
              </p>
            </div>
          </div>

          {/* Detalhes da instrução */}
          {purgeData?.reason && (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-200">
              <div className="flex items-center gap-1.5 font-medium text-cyan-300 text-[0.7rem] uppercase tracking-wider mb-1">
                <span>Motivo da Atualização</span>
              </div>
              <p className="line-clamp-2 text-slate-300 leading-relaxed font-mono text-[0.75rem]">
                "{purgeData.reason}"
              </p>
              {purgeData.requested_by_name && (
                <p className="mt-1.5 text-[0.68rem] text-slate-400 flex items-center gap-1">
                  Transmitido por: <strong className="text-white font-semibold">{purgeData.requested_by_name}</strong>
                </p>
              )}
            </div>
          )}

          {/* Barra de Progresso Neon */}
          <div className="space-y-1.5 pt-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-100 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[0.68rem] text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Caches e Service Workers limpos
              </span>
              <span>Recarregando em instantes...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
