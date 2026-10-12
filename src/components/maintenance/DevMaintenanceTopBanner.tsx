import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Clock,
  PlusCircle,
  Sliders,
  Square,
  Eye,
  ShieldCheck,
  RotateCw,
  Users,
  Info,
  Wrench,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useAuth } from "@/hooks/useAuth";
import { DevMaintenanceManagerModal } from "./DevMaintenanceManagerModal";
import { cn } from "@/lib/utils";

export function DevMaintenanceTopBanner() {
  const { settings, finishMaintenance, extendMaintenance } = usePlatformSettings();
  const { isDevUser, profile, user, level, memberTags } = useAuth();
  const [managerOpen, setManagerOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const isMaintenanceActive = Boolean(
    settings.maintenanceActive ||
      (settings.showSystemStatusNotice && settings.systemStatusType === "destructive")
  );

  const authorName = profile?.nome || profile?.nickname || "Desenvolvedor";

  // Verifica se o usuário atual é um dos membros com acesso liberado (Bypass de Membro)
  const isAllowedMember = useMemo(() => {
    const allowed = (settings.maintenanceAllowedMembers || []).map((id) => String(id).toLowerCase());
    if (allowed.length === 0) return false;
    const uid = (user?.id || "").toLowerCase();
    const pUserId = (profile?.user_id || "").toLowerCase();
    const pId = (profile?.id || "").toLowerCase();
    return (
      (uid && allowed.includes(uid)) ||
      (pUserId && allowed.includes(pUserId)) ||
      (pId && allowed.includes(pId))
    );
  }, [settings.maintenanceAllowedMembers, user?.id, profile?.user_id, profile?.id]);

  // Verifica se o usuário faz parte do público alvo seletivo
  const isUserTargeted = useMemo(() => {
    if (settings.maintenanceTargetType !== "selected") {
      return true;
    }
    const targetRoles = (settings.maintenanceTargetRoles || []).map((r) => r.toLowerCase());
    const targetTags = (settings.maintenanceTargetTags || []).map((t) => t.toLowerCase());
    if (targetRoles.length === 0 && targetTags.length === 0) {
      return false;
    }
    const userRole = level?.toLowerCase();
    const roleMatches = userRole ? targetRoles.includes(userRole) : false;
    const userTagIds = (memberTags || []).map((t) => t.id.toLowerCase());
    const tagMatches = userTagIds.some((tId) => targetTags.includes(tId));
    return roleMatches || tagMatches;
  }, [settings.maintenanceTargetType, settings.maintenanceTargetRoles, settings.maintenanceTargetTags, level, memberTags]);

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

  // Checagem de status rápida para membros autorizados
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tw_platform_settings_updated"));
      }
      toast.info("Status da Manutenção:", {
        description: isMaintenanceActive
          ? "A plataforma segue em manutenção técnica pela liderança/desenvolvimento."
          : "Manutenção concluída! A plataforma já está liberada.",
      });
      if (!isMaintenanceActive) {
        window.location.reload();
      }
    } finally {
      setTimeout(() => setCheckingStatus(false), 700);
    }
  };

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

  // Se a manutenção estiver desativada: não renderiza
  if (!isMaintenanceActive) {
    return null;
  }

  // Se o usuário estiver bloqueado pelo overlay de tela inteira (não é dev, não é autorizado e é alvo):
  // O overlay principal já cuida da exibição
  if (!isDevUser && !isAllowedMember && isUserTargeted) {
    return null;
  }

  const allowedMembersCount = settings.maintenanceAllowedMembers?.length || 0;

  return (
    <>
      <aside
        aria-label="Aviso de Manutenção da Plataforma"
        className="w-full z-40 bg-[#0c0c0e] border-b border-amber-500/60 shadow-lg px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs text-amber-100 flex-wrap transition-all select-none relative overflow-hidden"
      >
        {/* Glow sutil no fundo */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/5 pointer-events-none" />

        <div className="flex items-center gap-2.5 min-w-0 relative z-10">
          <div className="p-1 rounded-md bg-amber-500 text-black font-black animate-pulse shrink-0 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-extrabold text-white text-[11px] sm:text-xs tracking-wider uppercase truncate drop-shadow-xs">
              Modo de Manutenção Ativo
            </span>

            {/* Badge de acordo com o perfil que está acessando */}
            {isDevUser ? (
              <Badge
                variant="outline"
                className="text-[9px] font-mono font-bold border-amber-400/60 text-amber-300 bg-amber-500/15 px-1.5 py-0 shrink-0"
              >
                Bypass Dev
              </Badge>
            ) : isAllowedMember ? (
              <Badge
                variant="outline"
                className="text-[9px] font-mono font-bold border-emerald-500/60 text-emerald-300 bg-emerald-500/15 px-1.5 py-0 shrink-0 flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Membro Autorizado
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[9px] font-mono font-bold border-sky-400/60 text-sky-300 bg-sky-500/15 px-1.5 py-0 shrink-0"
              >
                Acesso Liberado
              </Badge>
            )}

            {/* Badges de Escopo (Seletiva ou Membros Liberados) */}
            {isDevUser && allowedMembersCount > 0 && (
              <Badge
                variant="outline"
                className="hidden lg:inline-flex text-[9px] font-mono border-amber-400/40 text-amber-200/90 bg-black/40 px-1.5 py-0 gap-1"
                title={`${allowedMembersCount} membro(s) selecionados com acesso liberado`}
              >
                <Users className="w-3 h-3 text-amber-400" />
                {allowedMembersCount} membro{allowedMembersCount > 1 ? "s" : ""} liberado{allowedMembersCount > 1 ? "s" : ""}
              </Badge>
            )}

            {settings.maintenanceTargetType === "selected" && (
              <Badge
                variant="outline"
                className="hidden md:inline-flex text-[9px] font-mono border-sky-400/50 text-sky-300 bg-sky-500/10 px-1.5 py-0"
              >
                Seletiva ({settings.maintenanceTargetRoles?.length || 0} cargos / {settings.maintenanceTargetTags?.length || 0} tags)
              </Badge>
            )}

            {/* Mensagem explicativa para membros autorizados */}
            {!isDevUser && (
              <span className="hidden xl:inline-block text-[11px] text-amber-200/80 font-medium pl-1">
                · Você está navegando como membro autorizado pela equipe técnica.
              </span>
            )}
          </div>

          {/* Countdown no Banner */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-300 bg-black/80 px-2.5 py-0.5 rounded-lg border border-amber-500/50 shrink-0 shadow-inner">
            <Clock className="w-3 h-3 text-amber-400" />
            {timeLeft.isExpired ? (
              <span className="text-rose-400 animate-pulse">Finalizando...</span>
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

        {/* Ações no Banner: Específicas para Dev vs Membro Autorizado */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative z-10">
          {isDevUser ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickExtend(15)}
                className="h-7 text-[10.5px] font-bold px-2.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 rounded-lg cursor-pointer transition-all"
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
                className="h-7 text-[10.5px] font-bold px-2.5 border-sky-500/40 text-sky-300 hover:bg-sky-500/20 rounded-lg cursor-pointer transition-all"
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
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="h-7 text-[10.5px] font-bold px-3 border-amber-500/50 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 rounded-lg cursor-pointer transition-all"
            >
              <RotateCw className={cn("w-3 h-3 mr-1.5", checkingStatus && "animate-spin")} />
              {checkingStatus ? "Verificando..." : "Verificar Status"}
            </Button>
          )}
        </div>
      </aside>

      {isDevUser && (
        <DevMaintenanceManagerModal
          open={managerOpen}
          onOpenChange={setManagerOpen}
          onPreviewAsMember={handlePreviewAsMember}
        />
      )}
    </>
  );
}
