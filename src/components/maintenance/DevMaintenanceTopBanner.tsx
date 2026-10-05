import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clock,
  PlusCircle,
  Sliders,
  Square,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useAuth } from "@/hooks/useAuth";
import { DevMaintenanceManagerModal } from "./DevMaintenanceManagerModal";

export function DevMaintenanceTopBanner() {
  const { settings, finishMaintenance, extendMaintenance } = usePlatformSettings();
  const { isDevUser, profile } = useAuth();
  const [managerOpen, setManagerOpen] = useState(false);

  const isMaintenanceActive = Boolean(
    settings.maintenanceActive ||
      (settings.showSystemStatusNotice && settings.systemStatusType === "destructive")
  );

  const authorName = profile?.nome || profile?.nickname || "Desenvolvedor";

  // Contagem regressiva em tempo real
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!isMaintenanceActive) return;

    const calculateTime = () => {
      if (!settings.maintenanceEstimatedEnd) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isExpired: false,
        });
        return;
      }

      const targetTime = new Date(settings.maintenanceEstimatedEnd).getTime();
      const now = Date.now();
      const diffMs = targetTime - now;

      if (diffMs <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isExpired: true,
        });
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        totalSeconds,
        isExpired: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [isMaintenanceActive, settings.maintenanceEstimatedEnd]);

  if (!isMaintenanceActive || !isDevUser) {
    return null;
  }

  const handleQuickExtend = async (mins: number) => {
    try {
      await extendMaintenance(mins);
      toast.success(`Tempo prorrogado em +${mins} minutos!`, { icon: "⏱️" });
    } catch (err: any) {
      toast.error("Erro ao estender tempo: " + (err?.message || "Erro"));
    }
  };

  const handlePreviewAsMember = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("tw_toggle_maintenance_preview", { detail: { preview: true } })
      );
    }
  };

  const handleFinishMaintenance = async () => {
    if (
      !window.confirm(
        "Deseja realmente finalizar o Modo de Manutenção e liberar a plataforma para todos os membros?"
      )
    ) {
      return;
    }
    try {
      await finishMaintenance(authorName);
      toast.success("Modo de manutenção finalizado com sucesso!", { icon: "✅" });
    } catch (err: any) {
      toast.error("Erro ao finalizar: " + (err?.message || "Erro"));
    }
  };

  return (
    <>
      <div className="w-full z-40 bg-[#0c0c0e] border-b border-amber-500/50 shadow-md px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs text-amber-100 flex-wrap transition-all select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded-md bg-amber-500 text-black font-black animate-pulse shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-extrabold text-white text-[11px] sm:text-xs tracking-wider uppercase truncate">
              Modo de Manutenção Ativo
            </span>
            <Badge
              variant="outline"
              className="text-[9px] font-mono border-amber-400/50 text-amber-300 bg-amber-500/10 px-1.5 py-0 shrink-0"
            >
              Bypass Dev
            </Badge>
            {settings.maintenanceTargetType === "selected" && (
              <Badge
                variant="outline"
                className="hidden md:inline-flex text-[9px] font-mono border-sky-400/50 text-sky-300 bg-sky-500/10 px-1.5 py-0"
              >
                Seletiva ({settings.maintenanceTargetRoles?.length || 0} cargos / {settings.maintenanceTargetTags?.length || 0} tags)
              </Badge>
            )}
          </div>

          {/* Countdown no Banner */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-300 bg-black/70 px-2.5 py-0.5 rounded-lg border border-amber-500/40 shrink-0 shadow-inner">
            <Clock className="w-3 h-3 text-amber-400" />
            {timeLeft.isExpired ? (
              <span className="text-rose-400 animate-pulse">Prazo Expirado</span>
            ) : (
              <span>
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {String(timeLeft.hours).padStart(2, "0")}h:
                {String(timeLeft.minutes).padStart(2, "0")}m:
                {String(timeLeft.seconds).padStart(2, "0")}s
              </span>
            )}
          </div>
        </div>

        {/* Ações Rápidas no Banner */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleQuickExtend(15)}
            className="h-7 text-[10.5px] font-bold px-2.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 rounded-lg cursor-pointer"
            title="Prorrogar tempo em +15 minutos"
          >
            <PlusCircle className="w-3 h-3 mr-1" />
            +15m
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handlePreviewAsMember}
            className="h-7 text-[10.5px] font-bold px-2.5 border-sky-500/40 text-sky-300 hover:bg-sky-500/20 rounded-lg cursor-pointer"
            title="Visualizar a tela de bloqueio que os membros veem"
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver como Membro
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setManagerOpen(true)}
            className="h-7 text-[10.5px] font-bold px-3 bg-amber-500 hover:bg-amber-600 text-black rounded-lg cursor-pointer shadow-xs transition-all hover:scale-105"
          >
            <Sliders className="w-3 h-3 mr-1" />
            Gerenciar
          </Button>

          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={handleFinishMaintenance}
            className="h-7 text-[10.5px] font-bold px-2.5 rounded-lg shadow-xs cursor-pointer hover:bg-rose-600 transition-all"
          >
            <Square className="w-3 h-3 mr-1" />
            Finalizar
          </Button>
        </div>
      </div>

      <DevMaintenanceManagerModal
        open={managerOpen}
        onOpenChange={setManagerOpen}
        onPreviewAsMember={handlePreviewAsMember}
      />
    </>
  );
}
