import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Wrench,
  AlertTriangle,
  Clock,
  Radio,
  ExternalLink,
  RotateCw,
  Square,
  PlusCircle,
  Eye,
  Sliders,
  Sparkles,
  ChevronRight,
  LogIn,
  Layers,
  Activity,
  CheckCircle2,
  Tag,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/Brand";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useAuth } from "@/hooks/useAuth";
import { DevMaintenanceManagerModal } from "./DevMaintenanceManagerModal";
import { LEVEL_LABEL, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function GlobalMaintenanceOverlay() {
  const { settings, finishMaintenance, extendMaintenance } = usePlatformSettings();
  const { isDevUser, profile, user, level, memberTags } = useAuth();

  const authorName = profile?.nome || profile?.nickname || "Desenvolvedor";

  // Verifica se a manutenção está ativa
  const isMaintenanceActive = Boolean(
    settings.maintenanceActive ||
      (settings.showSystemStatusNotice && settings.systemStatusType === "destructive")
  );

  // Estados de controle Dev
  const [devDismissed, setDevDismissed] = useState<boolean>(false);
  const [previewAsMember, setPreviewAsMember] = useState<boolean>(false);
  const [managerOpen, setManagerOpen] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);

  useEffect(() => {
    const handleTogglePreview = (e: any) => {
      setPreviewAsMember(Boolean(e?.detail?.preview));
    };
    window.addEventListener("tw_toggle_maintenance_preview", handleTogglePreview);
    return () => {
      window.removeEventListener("tw_toggle_maintenance_preview", handleTogglePreview);
    };
  }, []);

  // Cálculo se o usuário atual é alvo da manutenção (Targeting)
  const isUserTargeted = useMemo(() => {
    // Se o desenvolvedor está no modo de visualização como membro, sempre considera afetado para teste
    if (previewAsMember) return true;

    // Se a manutenção for global para todos os integrantes
    if (settings.maintenanceTargetType !== "selected") {
      return true;
    }

    const targetRoles = (settings.maintenanceTargetRoles || []).map((r) => r.toLowerCase());
    const targetTags = (settings.maintenanceTargetTags || []).map((t) => t.toLowerCase());

    // Se nenhum cargo ou tag foi especificado na seletiva, não bloqueia por segurança
    if (targetRoles.length === 0 && targetTags.length === 0) {
      return false;
    }

    // 1. Verifica cargo (level) do usuário
    const userRole = level?.toLowerCase();
    const roleMatches = userRole ? targetRoles.includes(userRole) : false;

    // 2. Verifica tags de membros do usuário
    const userTagIds = (memberTags || []).map((t) => t.id.toLowerCase());
    const tagMatches = userTagIds.some((tId) => targetTags.includes(tId));

    return roleMatches || tagMatches;
  }, [
    previewAsMember,
    settings.maintenanceTargetType,
    settings.maintenanceTargetRoles,
    settings.maintenanceTargetTags,
    level,
    memberTags,
  ]);

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

  // Checagem rápida de status
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tw_platform_settings_updated"));
      }
      toast.info("Status verificado.", {
        description: isMaintenanceActive
          ? "A manutenção segue em andamento pela equipe técnica."
          : "Manutenção concluída! A plataforma já está liberada.",
      });
      if (!isMaintenanceActive) {
        window.location.reload();
      }
    } finally {
      setTimeout(() => setCheckingStatus(false), 700);
    }
  };

  // Prorrogação rápida do HUD Dev
  const handleQuickExtend = async (mins: number) => {
    try {
      await extendMaintenance(mins);
      toast.success(`Tempo prorrogado em +${mins} minutos!`, { icon: "⏱️" });
    } catch (err: any) {
      toast.error("Erro ao estender tempo: " + (err?.message || "Erro"));
    }
  };

  // Finalizar manutenção rápida
  const handleFinishMaintenance = async () => {
    try {
      await finishMaintenance(authorName);
      toast.success("Modo de manutenção finalizado com sucesso!", { icon: "✅" });
    } catch (err: any) {
      toast.error("Erro ao finalizar: " + (err?.message || "Erro"));
    }
  };

  // Formatação amigável do horário estimado
  const formattedEndTime = useMemo(() => {
    if (!settings.maintenanceEstimatedEnd) return null;
    try {
      const d = new Date(settings.maintenanceEstimatedEnd);
      if (isNaN(d.getTime())) return null;
      const isToday = new Date().toDateString() === d.toDateString();
      const isTomorrow =
        new Date(Date.now() + 86400000).toDateString() === d.toDateString();
      const dayLabel = isToday
        ? "Hoje"
        : isTomorrow
        ? "Amanhã"
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const timeLabel = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      return `${dayLabel} às ${timeLabel}h`;
    } catch {
      return null;
    }
  }, [settings.maintenanceEstimatedEnd]);

  // Se a manutenção estiver desativada, não renderiza nada
  if (!isMaintenanceActive) {
    return null;
  }

  // Se o usuário logado NÃO faz parte do público-alvo (manutenção seletiva) e não é Dev em preview:
  // Libera a navegação transparente sem bloqueio
  if (!isUserTargeted && !isDevUser && !previewAsMember) {
    return null;
  }

  // MODO DESENVOLVEDOR (Bypass ativo e não está em modo preview):
  // A barra superior de status e controles de manutenção é renderizada no topo do AppShell sem sobreposição.
  if (isDevUser && !previewAsMember) {
    return null;
  }

  // PÁGINA / POPUP PRINCIPAL DE MANUTENÇÃO (Design Minimalista, Elegante, Tecnológico e Profissional)
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Aviso de Manutenção do Sistema"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-[#070709]/96 backdrop-blur-3xl overflow-y-auto selection:bg-amber-500/20 selection:text-amber-200"
    >
      {/* Background Decorativo com Feixes Suaves de Iluminação Minimalista */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-amber-500/15 blur-[160px] animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[400px] rounded-full bg-rose-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative w-full max-w-xl my-auto z-10 space-y-4">
        {/* Banner de Aviso de Pré-visualização Dev */}
        {previewAsMember && (
          <div className="p-3 rounded-2xl bg-sky-950/80 border border-sky-500/40 text-sky-200 text-xs flex items-center justify-between gap-3 shadow-xl backdrop-blur-md">
            <span className="font-bold flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              Pré-visualização Dev: Você está vendo exatamente a tela de bloqueio dos membros.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPreviewAsMember(false)}
              className="h-6.5 text-[10.5px] font-bold border-sky-400/50 text-sky-300 hover:bg-sky-500/20 cursor-pointer shrink-0"
            >
              Voltar ao Painel Dev
            </Button>
          </div>
        )}

        {/* Card Principal de Manutenção com Efeito Glassmorphic Premium */}
        <div className="relative rounded-[28px] border border-white/10 bg-[#0d0d11]/90 shadow-[0_25px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden p-6 sm:p-10 space-y-7 text-center">
          {/* Luz de Borda Superior */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          {/* Cabeçalho de Identidade e Status */}
          <div className="flex flex-col items-center justify-center gap-3.5">
            <Brand size="lg" className="items-center" />

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "px-3 py-1 font-mono text-[10.5px] font-extrabold uppercase tracking-widest gap-2 shadow-xs rounded-full",
                  settings.maintenanceSeverity === "destructive"
                    ? "border-rose-500/50 text-rose-300 bg-rose-500/10"
                    : "border-amber-500/50 text-amber-300 bg-amber-500/10"
                )}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                {settings.maintenanceSeverity === "destructive"
                  ? "Manutenção Crítica & Atualização"
                  : "Manutenção Programada"}
              </Badge>

              {settings.maintenanceTargetType === "selected" && (
                <Badge
                  variant="outline"
                  className="px-2.5 py-0.5 font-mono text-[10px] font-bold border-sky-500/40 text-sky-300 bg-sky-500/10 rounded-full flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-sky-400" />
                  Aviso Setorial
                </Badge>
              )}
            </div>
          </div>

          {/* Ícone Minimalista com Halo Luminoso */}
          <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-zinc-800/90 to-zinc-900/90 border border-white/15 flex items-center justify-center text-amber-400 shadow-2xl">
              <Wrench className="w-7 h-7 animate-pulse" />
            </div>
          </div>

          {/* Título e Mensagem */}
          <div className="space-y-2.5 max-w-lg mx-auto">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {settings.maintenanceTitle || "Manutenção do Sistema em Andamento"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
              {settings.maintenanceMessage ||
                settings.systemStatusNotice ||
                "Estamos realizando melhorias técnicas, estabilização e atualizações estruturais na plataforma para aprimorar as ferramentas da organização."}
            </p>
          </div>

          {/* BLOCO ELEGANTE DE CONTAGEM REGRESSIVA */}
          <div className="p-4 sm:p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4 shadow-inner">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Tempo Estimado Restante</span>
            </div>

            {timeLeft.isExpired ? (
              <div className="py-2.5 space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Finalizando Procedimentos Técnicos</span>
                </div>
                <p className="text-[11px] text-zinc-400 max-w-md mx-auto leading-relaxed">
                  O tempo estimado foi atingido. Nossa equipe técnica está concluindo os testes finais de segurança e estabilidade para reabrir os serviços em instantes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
                {timeLeft.days > 0 && (
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-900/80 border border-white/10 shadow-lg">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                      {String(timeLeft.days).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 mt-0.5">
                      Dias
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-900/80 border border-white/10 shadow-lg">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 mt-0.5">
                    Horas
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-900/80 border border-white/10 shadow-lg">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 mt-0.5">
                    Minutos
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 shadow-lg ring-1 ring-amber-500/20">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 animate-pulse tracking-tight">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-amber-300 mt-0.5">
                    Segundos
                  </span>
                </div>
              </div>
            )}

            {formattedEndTime && (
              <p className="text-[11px] text-zinc-400 font-mono pt-1">
                Previsão de retorno: <strong className="text-white font-bold">{formattedEndTime}</strong>
              </p>
            )}
          </div>

          {/* Badges de Identidade RP */}
          {(settings.cityRpName || settings.radioFrequency) && (
            <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-zinc-400">
              {settings.cityRpName && (
                <span className="px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 shadow-xs">
                  Cidade: <strong className="text-zinc-200">{settings.cityRpName}</strong>
                </span>
              )}
              {settings.radioFrequency && (
                <span className="px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 shadow-xs flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-amber-400" />
                  Rádio RP: <strong className="text-zinc-200 font-mono">{settings.radioFrequency}</strong>
                </span>
              )}
            </div>
          )}

          {/* Botões de Ação para os Usuários */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="w-full sm:w-auto h-9.5 text-xs font-bold gap-2 border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 rounded-xl cursor-pointer"
            >
              <RotateCw className={cn("w-3.5 h-3.5", checkingStatus && "animate-spin")} />
              {checkingStatus ? "Verificando..." : "Verificar Status / Atualizar"}
            </Button>

            {(settings.factionDiscordUrl || settings.supportDiscordUrl) && (
              <Button
                asChild
                className="w-full sm:w-auto h-9.5 text-xs font-bold gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <a
                  href={settings.factionDiscordUrl || settings.supportDiscordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Acompanhar no Discord
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            )}
          </div>

          {/* PAINEL EXCLUSIVO PARA QUEM POSSUI TAG DEV */}
          {isDevUser ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-left space-y-3 pt-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Acesso de Desenvolvedor Detectado (Tag Dev)
                </span>
                <Badge
                  variant="outline"
                  className="border-amber-400/50 text-amber-300 font-mono text-[9px] bg-amber-500/10"
                >
                  Bypass Autorizado
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Você possui credenciais de desenvolvedor. Você pode ignorar este bloqueio para navegar, desenvolver e testar a plataforma livremente enquanto os outros membros permanecem na tela de manutenção.
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setDevDismissed(true);
                    setPreviewAsMember(false);
                    toast.success("Bypass Dev ativado!", {
                      description: "Navegação liberada com indicativos de manutenção ativos.",
                    });
                  }}
                  className="font-bold text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-black shadow-md cursor-pointer rounded-xl"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar na Plataforma (Bypass Dev)
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setManagerOpen(true)}
                  className="font-bold text-xs gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/20 cursor-pointer rounded-xl"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Gerenciar Manutenção
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleFinishMaintenance}
                  className="font-bold text-xs gap-1 cursor-pointer rounded-xl"
                >
                  <Square className="w-3.5 h-3.5" />
                  Finalizar Agora
                </Button>
              </div>
            </div>
          ) : !user ? (
            /* Link discreto para Devs deslogados */
            <div className="pt-2 text-[11px] text-zinc-500">
              <span>É da equipe de desenvolvimento? </span>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="text-amber-400 hover:text-amber-300 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                Fazer login técnico <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <DevMaintenanceManagerModal
        open={managerOpen}
        onOpenChange={setManagerOpen}
        onPreviewAsMember={() => setPreviewAsMember(true)}
      />
    </div>
  );
}
