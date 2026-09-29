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
  ShieldAlert,
  ChevronRight,
  LogIn,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/components/Brand";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useAuth } from "@/hooks/useAuth";
import { DevMaintenanceManagerModal } from "./DevMaintenanceManagerModal";
import { cn } from "@/lib/utils";

export function GlobalMaintenanceOverlay() {
  const {
    settings,
    finishMaintenance,
    extendMaintenance,
  } = usePlatformSettings();
  const { isDevUser, profile, user } = useAuth();

  const authorName = profile?.nome || profile?.nickname || "Desenvolvedor";

  // Check if maintenance is actively engaged
  const isMaintenanceActive = Boolean(
    settings.maintenanceActive ||
      (settings.showSystemStatusNotice && settings.systemStatusType === "destructive")
  );

  // Dev controls states
  const [devDismissed, setDevDismissed] = useState<boolean>(false);
  const [previewAsMember, setPreviewAsMember] = useState<boolean>(false);
  const [managerOpen, setManagerOpen] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);

  // Time remaining calculation states
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

  // Calculate live countdown timer every second
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

  // Quick refresh status
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("tw_platform_settings_updated"));
      }
      toast.info("Status da plataforma verificado.", {
        description: isMaintenanceActive
          ? "A manutenção segue em andamento pela equipe técnica."
          : "Manutenção concluída! A plataforma já está liberada.",
      });
      if (!isMaintenanceActive) {
        window.location.reload();
      }
    } finally {
      setTimeout(() => setCheckingStatus(false), 800);
    }
  };

  // Quick extend from Dev HUD
  const handleQuickExtend = async (mins: number) => {
    try {
      await extendMaintenance(mins);
      toast.success(`Tempo prorrogado em +${mins} minutos!`, { icon: "⏱️" });
    } catch (err: any) {
      toast.error("Erro ao estender tempo: " + (err?.message || "Erro"));
    }
  };

  // Quick finish from Dev HUD
  const handleFinishMaintenance = async () => {
    try {
      await finishMaintenance(authorName);
      toast.success("Modo de manutenção finalizado com sucesso!", { icon: "✅" });
    } catch (err: any) {
      toast.error("Erro ao finalizar: " + (err?.message || "Erro"));
    }
  };

  // Format estimated end string
  const formattedEndTime = useMemo(() => {
    if (!settings.maintenanceEstimatedEnd) return null;
    try {
      const d = new Date(settings.maintenanceEstimatedEnd);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return null;
    }
  }, [settings.maintenanceEstimatedEnd]);

  // If maintenance is completely inactive, do nothing
  if (!isMaintenanceActive) {
    return null;
  }

  // DEV MODE (Bypass active and not in preview mode):
  // Renders the non-blocking indicators (Top HUD banner, screen edge glow, and floating manager button)
  if (isDevUser && !previewAsMember && devDismissed) {
    return (
      <>
        {/* 1. Indicador Neon de Borda no Viewport */}
        <div
          className="fixed inset-0 pointer-events-none z-[99980] border-[3px] border-amber-500/50 shadow-[inset_0_0_35px_rgba(245,158,11,0.25)] animate-pulse"
          aria-hidden="true"
        />

        {/* 2. Barra Superior Flutuante (Dev Maintenance HUD) */}
        <header className="fixed top-0 inset-x-0 z-[99990] bg-gradient-to-r from-amber-950/95 via-rose-950/95 to-amber-950/95 border-b-2 border-amber-500/60 shadow-2xl backdrop-blur-md px-3 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs text-amber-100 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded-lg bg-amber-500 text-black font-black animate-pulse shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-extrabold text-white text-[11px] sm:text-xs tracking-wider uppercase truncate">
                Modo de Manutenção Ativo
              </span>
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-mono border-amber-400/50 text-amber-300 bg-amber-500/10 px-1.5 py-0">
                Acesso Exclusivo Dev
              </Badge>
            </div>

            {/* Countdown no HUD */}
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-amber-500/30 shrink-0">
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

          {/* Ações Rápidas no HUD */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleQuickExtend(15)}
              className="h-7 text-[10.5px] font-bold px-2 border-amber-500/50 text-amber-300 hover:bg-amber-500/20 cursor-pointer"
              title="Prorrogar tempo em 15 minutos"
            >
              <PlusCircle className="w-3 h-3 mr-1" />
              +15m
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPreviewAsMember(true)}
              className="h-7 text-[10.5px] font-bold px-2 text-sky-300 border-sky-500/50 hover:bg-sky-500/20 cursor-pointer"
              title="Visualizar a tela bloqueada que os membros comuns veem"
            >
              <Eye className="w-3 h-3 mr-1" />
              Ver como Membro
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setManagerOpen(true)}
              className="h-7 text-[10.5px] font-bold px-2 bg-amber-500 hover:bg-amber-600 text-black cursor-pointer shadow-xs"
            >
              <Sliders className="w-3 h-3 mr-1" />
              Gerenciar
            </Button>

            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleFinishMaintenance}
              className="h-7 text-[10.5px] font-bold px-2.5 shadow-sm cursor-pointer"
            >
              <Square className="w-3 h-3 mr-1" />
              Finalizar
            </Button>
          </div>
        </header>

        {/* 3. Botão Flutuante Rápido no Canto Inferior Direito (FAB) */}
        <div className="fixed bottom-4 right-4 z-[99985]">
          <button
            type="button"
            onClick={() => setManagerOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-2xl border-2 border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Abrir Central de Gestão de Manutenção"
          >
            <Wrench className="w-4 h-4 animate-spin text-amber-200" style={{ animationDuration: "6s" }} />
            <span>Manutenção Ativa</span>
            <Badge className="bg-black/40 text-amber-300 font-mono text-[10px] px-1.5 py-0 border-amber-400/40">
              {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
            </Badge>
          </button>
        </div>

        <DevMaintenanceManagerModal
          open={managerOpen}
          onOpenChange={setManagerOpen}
          onPreviewAsMember={() => setPreviewAsMember(true)}
        />
      </>
    );
  }

  // BLOQUEIO TOTAL / POPUP CENTRAL DE MANUTENÇÃO (Para membros comuns, visitantes ou Dev em modo preview)
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Aviso de Manutenção do Sistema"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/85 backdrop-blur-2xl overflow-y-auto selection:bg-rose-500/20"
    >
      {/* Background Decorativo com Feixes de Luz e Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/20 blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] translate-x-1/2 translate-y-1/2 rounded-full bg-rose-500/20 blur-[160px]" />
      </div>

      <div className="relative w-full max-w-xl my-auto z-10 space-y-4">
        {/* Banner de Aviso no topo caso seja pré-visualização de Dev */}
        {previewAsMember && (
          <div className="p-2.5 rounded-xl bg-sky-950/80 border border-sky-500/50 text-sky-200 text-xs flex items-center justify-between gap-3 shadow-lg">
            <span className="font-bold flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-sky-400" />
              Pré-visualização Dev: Esta é a visão exata dos membros e visitantes.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPreviewAsMember(false)}
              className="h-6 text-[10px] font-bold border-sky-400/50 text-sky-300 hover:bg-sky-500/20 cursor-pointer"
            >
              Voltar ao Painel Dev
            </Button>
          </div>
        )}

        {/* Card Central de Manutenção */}
        <div className="rounded-3xl border-2 border-amber-500/40 bg-card/95 shadow-2xl backdrop-blur-3xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
          {/* Logo e Tag da Organização */}
          <div className="flex flex-col items-center justify-center gap-3">
            <Brand size="lg" className="items-center" />
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-widest gap-2 shadow-sm",
                settings.maintenanceSeverity === "destructive"
                  ? "border-rose-500 text-rose-400 bg-rose-500/10"
                  : "border-amber-500 text-amber-400 bg-amber-500/10"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              Sistema em Manutenção
            </Badge>
          </div>

          {/* Ícone de Manutenção com Anéis Pulsantes */}
          <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-amber-500/20 animate-ping opacity-60" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Wrench className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          {/* Título e Mensagem */}
          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {settings.maintenanceTitle || "Manutenção do Sistema em Andamento"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {settings.maintenanceMessage ||
                settings.systemStatusNotice ||
                "Estamos realizando atualizações técnicas e melhorias em nossa infraestrutura para garantir máxima estabilidade e novas ferramentas para a organização."}
            </p>
          </div>

          {/* CONTADOR REGRESSIVO COM TEMPO ESTIMADO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border/80 space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-foreground">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Tempo Estimado Restante</span>
            </div>

            {timeLeft.isExpired ? (
              <div className="py-2 space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Finalizando Procedimentos Técnicos</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  O prazo estimado foi atingido. Estamos executando os testes finais e estabilizando serviços para reabertura em instantes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-w-sm mx-auto">
                {timeLeft.days > 0 && (
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-background/80 border border-border/70 shadow-xs">
                    <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                      {String(timeLeft.days).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Dias</span>
                  </div>
                )}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-background/80 border border-border/70 shadow-xs">
                  <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Horas</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-background/80 border border-border/70 shadow-xs">
                  <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground">Minutos</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-background/80 border border-amber-500/40 shadow-xs ring-2 ring-amber-500/10">
                  <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 animate-pulse">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-amber-300">Segundos</span>
                </div>
              </div>
            )}

            {formattedEndTime && (
              <p className="text-[11px] text-muted-foreground/80 font-mono">
                Previsão de retorno: <strong className="text-foreground">{formattedEndTime}h</strong>
              </p>
            )}
          </div>

          {/* Badges de Identidade RP */}
          {(settings.cityRpName || settings.radioFrequency) && (
            <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-muted-foreground">
              {settings.cityRpName && (
                <span className="px-2.5 py-0.5 rounded-full bg-secondary/50 border border-border/60">
                  Cidade: <strong className="text-foreground">{settings.cityRpName}</strong>
                </span>
              )}
              {settings.radioFrequency && (
                <span className="px-2.5 py-0.5 rounded-full bg-secondary/50 border border-border/60 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-primary" />
                  Rádio RP: <strong className="text-foreground font-mono">{settings.radioFrequency}</strong>
                </span>
              )}
            </div>
          )}

          {/* Botões de Ação para Usuários Comuns */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="w-full sm:w-auto text-xs font-bold gap-1.5 cursor-pointer"
            >
              <RotateCw className={cn("w-3.5 h-3.5", checkingStatus && "animate-spin")} />
              {checkingStatus ? "Verificando..." : "Verificar Status / Atualizar"}
            </Button>

            {(settings.factionDiscordUrl || settings.supportDiscordUrl) && (
              <Button
                asChild
                className="w-full sm:w-auto text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
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

          {/* PAINEL EXCLUSIVO PARA QUEM TEM TAG DEV */}
          {isDevUser ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-left space-y-3 pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Acesso de Desenvolvedor Detectado (Tag Dev)
                </span>
                <Badge variant="outline" className="border-amber-400/50 text-amber-300 font-mono text-[9px]">
                  Bypass Autorizado
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Você possui permissões de desenvolvedor. Você pode ignorar este bloqueio para navegar e testar a plataforma livremente enquanto os outros membros permanecem bloqueados.
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
                  className="font-bold text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-black shadow-md cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar na Plataforma (Bypass Dev)
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setManagerOpen(true)}
                  className="font-bold text-xs gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Gerenciar Manutenção
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleFinishMaintenance}
                  className="font-bold text-xs gap-1 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  Finalizar Agora
                </Button>
              </div>
            </div>
          ) : !user ? (
            /* Link discreto para Devs deslogados */
            <div className="pt-2 text-[11px] text-muted-foreground">
              <span>É da equipe de desenvolvimento? </span>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="text-amber-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
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
