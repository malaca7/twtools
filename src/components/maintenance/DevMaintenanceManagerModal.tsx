import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Sparkles,
  History,
  ShieldAlert,
  Play,
  Square,
  PlusCircle,
  Eye,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlatformSettings, type MaintenanceHistoryItem } from "@/hooks/usePlatformSettings";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface DevMaintenanceManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreviewAsMember?: () => void;
}

const PRESET_TITLES = [
  "Manutenção Preventiva de Sistema",
  "Atualização de Infraestrutura & Banco de Dados",
  "Otimização de Desempenho & Estabilidade",
  "Implementação de Novos Recursos & Melhorias",
  "Correção Emergencial de Serviços",
];

const DURATION_PRESETS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "1 hora", minutes: 60 },
  { label: "2 horas", minutes: 120 },
  { label: "4 horas", minutes: 240 },
];

export function DevMaintenanceManagerModal({
  open,
  onOpenChange,
  onPreviewAsMember,
}: DevMaintenanceManagerModalProps) {
  const {
    settings,
    startMaintenance,
    finishMaintenance,
    extendMaintenance,
    resetMaintenance,
    clearHistory,
    deleteHistoryItem,
  } = usePlatformSettings();
  const { profile } = useAuth();

  const authorName = profile?.nome || profile?.nickname || "Desenvolvedor";

  // Form states
  const [title, setTitle] = useState(settings.maintenanceTitle || "Manutenção Preventiva de Sistema");
  const [message, setMessage] = useState(
    settings.maintenanceMessage ||
      "Estamos realizando atualizações técnicas na infraestrutura. A plataforma retornará em instantes."
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    settings.maintenanceDurationMinutes || 30
  );
  const [severity, setSeverity] = useState<"warning" | "destructive" | "info">(
    settings.maintenanceSeverity || "warning"
  );
  const [customDateTime, setCustomDateTime] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"manage" | "history">("manage");
  const [loading, setLoading] = useState(false);

  // Sync state whenever settings or dialog open
  useEffect(() => {
    if (open) {
      setTitle(settings.maintenanceTitle || "Manutenção Preventiva de Sistema");
      setMessage(
        settings.maintenanceMessage ||
          "Estamos realizando atualizações técnicas na infraestrutura. A plataforma retornará em instantes."
      );
      setDurationMinutes(settings.maintenanceDurationMinutes || 30);
      setSeverity(settings.maintenanceSeverity || "warning");

      if (settings.maintenanceEstimatedEnd) {
        try {
          const d = new Date(settings.maintenanceEstimatedEnd);
          // Format as YYYY-MM-DDTHH:mm for datetime-local
          const pad = (n: number) => n.toString().padStart(2, "0");
          const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          setCustomDateTime(localStr);
        } catch {
          setCustomDateTime("");
        }
      } else {
        const d = new Date(Date.now() + 30 * 60 * 1000);
        const pad = (n: number) => n.toString().padStart(2, "0");
        const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setCustomDateTime(localStr);
      }
    }
  }, [open, settings.maintenanceActive, settings.maintenanceEstimatedEnd]);

  // Handle preset duration select
  const handleSelectDurationPreset = (minutes: number) => {
    setDurationMinutes(minutes);
    const d = new Date(Date.now() + minutes * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    setCustomDateTime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };

  // Start or Update maintenance
  const handleSaveAndStart = async () => {
    setLoading(true);
    try {
      let finalEndIso = "";
      if (customDateTime) {
        const parsed = new Date(customDateTime);
        if (!isNaN(parsed.getTime())) {
          finalEndIso = parsed.toISOString();
        }
      }

      await startMaintenance({
        title,
        message,
        durationMinutes,
        estimatedEnd: finalEndIso || undefined,
        severity,
        authorName,
        allowDevAccess: true,
      });

      toast.success("Modo de Manutenção Ativado com Sucesso!", {
        description: "A plataforma está restrita para membros e visitantes com contador regressivo.",
        icon: "🚨",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao iniciar manutenção: " + (err?.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  // Finish maintenance
  const handleFinish = async () => {
    setLoading(true);
    try {
      await finishMaintenance(authorName);
      toast.success("Manutenção Finalizada!", {
        description: "A plataforma foi reaberta para todos os integrantes.",
        icon: "✅",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao finalizar manutenção: " + (err?.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  // Quick extend
  const handleQuickExtend = async (minutes: number) => {
    setLoading(true);
    try {
      await extendMaintenance(minutes);
      toast.success(`Tempo prorrogado em +${minutes} minutos!`, {
        icon: "⏱️",
      });
    } catch (err: any) {
      toast.error("Erro ao estender tempo: " + (err?.message || "Erro"));
    } finally {
      setLoading(false);
    }
  };

  // Reset/Clear maintenance data
  const handleResetData = async () => {
    if (!confirm("Deseja realmente limpar e resetar os dados da manutenção?")) return;
    setLoading(true);
    try {
      await resetMaintenance();
      setTitle("Manutenção Preventiva de Sistema");
      setMessage("Estamos realizando melhorias programadas e otimizações na infraestrutura. A plataforma retornará em instantes.");
      setDurationMinutes(30);
      toast.info("Dados de manutenção resetados para o padrão.");
    } catch (err: any) {
      toast.error("Erro ao resetar dados: " + (err?.message || "Erro"));
    } finally {
      setLoading(false);
    }
  };

  // Clear history
  const handleClearHistory = async () => {
    if (!confirm("Deseja apagar todo o histórico de manutenções?")) return;
    setLoading(true);
    try {
      await clearHistory();
      toast.info("Histórico de manutenções limpo com sucesso.");
    } catch (err: any) {
      toast.error("Erro ao limpar histórico: " + (err?.message || "Erro"));
    } finally {
      setLoading(false);
    }
  };

  const isCurrentActive = Boolean(settings.maintenanceActive || settings.showSystemStatusNotice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-amber-500/40 shadow-2xl">
        {/* Header Tecnológico */}
        <div className="p-5 border-b border-border/60 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl border flex items-center justify-center",
                isCurrentActive
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/40"
              )}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                Central de Gestão de Manutenção
                {isCurrentActive ? (
                  <Badge variant="destructive" className="text-[10px] uppercase font-mono animate-pulse">
                    ● Ativa Agora
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] uppercase font-mono text-muted-foreground">
                    Inativa
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Controle global de bloqueio, aviso na tela cheia com contador regressivo e acesso exclusivo Dev.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-xl border border-border/50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("manage")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                activeTab === "manage"
                  ? "bg-amber-500 text-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              Controles
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                activeTab === "history"
                  ? "bg-amber-500 text-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="w-3.5 h-3.5" />
              Histórico ({settings.maintenanceHistory?.length || 0})
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === "manage" ? (
            <>
              {/* Barra de Status Atual & Ações Rápidas */}
              <div
                className={cn(
                  "p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all",
                  isCurrentActive
                    ? "bg-rose-500/10 border-rose-500/40 text-rose-200"
                    : "bg-secondary/40 border-border/70 text-muted-foreground"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        isCurrentActive ? "bg-rose-500 animate-ping" : "bg-muted-foreground/50"
                      )}
                    />
                    <span className="text-xs font-extrabold text-foreground uppercase tracking-wider">
                      {isCurrentActive ? "Modo de Manutenção em Andamento" : "Sistema Operando Normalmente"}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {isCurrentActive
                      ? "O site está bloqueado para membros comuns e visitantes com modal central e contador regressivo. Desenvolvedores possuem livre acesso com indicativos visuais."
                      : "Nenhum bloqueio ativo. Todos os integrantes e visitantes podem navegar normalmente."}
                  </p>
                  {isCurrentActive && settings.maintenanceEstimatedEnd && (
                    <p className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      Término previsto:{" "}
                      {new Date(settings.maintenanceEstimatedEnd).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ({new Date(settings.maintenanceEstimatedEnd).toLocaleDateString("pt-BR")})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {isCurrentActive ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={handleFinish}
                        disabled={loading}
                        className="font-bold text-xs gap-1.5 shadow-md cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5" />
                        Finalizar Manutenção
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickExtend(15)}
                        disabled={loading}
                        className="font-bold text-xs gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 cursor-pointer"
                        title="Adicionar mais 15 minutos ao tempo restante"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        +15 min
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveAndStart}
                      disabled={loading}
                      className="font-bold text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-black shadow-md cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      Ativar Manutenção
                    </Button>
                  )}

                  {onPreviewAsMember && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onOpenChange(false);
                        onPreviewAsMember();
                      }}
                      className="font-bold text-xs gap-1 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 cursor-pointer"
                      title="Ver como os membros bloqueados visualizam o popup"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver como Membro
                    </Button>
                  )}
                </div>
              </div>

              {/* Formulário de Configuração da Manutenção */}
              <div className="space-y-4">
                {/* Título da Manutenção */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maint-title" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Título do Aviso de Manutenção
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Exibido em destaque no cabeçalho do popup</span>
                  </div>
                  <Input
                    id="maint-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Manutenção Preventiva de Sistema"
                    className="h-9.5 text-xs font-bold rounded-xl"
                  />
                  {/* Presets Rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-muted-foreground font-mono">Sugestões:</span>
                    {PRESET_TITLES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTitle(preset)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/60 hover:bg-amber-500/20 hover:text-amber-300 border border-border/60 transition-all cursor-pointer font-medium"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mensagem e Motivo da Manutenção */}
                <div className="space-y-1.5">
                  <Label htmlFor="maint-message" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-sky-400" />
                    Mensagem & Orientações para os Usuários
                  </Label>
                  <Textarea
                    id="maint-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva o motivo da manutenção e as ações que estão sendo realizadas..."
                    rows={3}
                    className="text-xs rounded-xl resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Oriente os membros a acompanharem o Discord oficial ou aguardarem a conclusão do cronômetro.
                  </p>
                </div>

                {/* Duração & Tempo Estimado com Contador */}
                <div className="p-4 rounded-2xl bg-secondary/20 border border-border/70 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Duração Estimada & Contador Regressivo
                      </h4>
                      <p className="text-[10.5px] text-muted-foreground">
                        Define o tempo da contagem regressiva exibida no centro da tela.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DURATION_PRESETS.map((p) => (
                        <Button
                          key={p.minutes}
                          type="button"
                          size="sm"
                          variant={durationMinutes === p.minutes ? "default" : "outline"}
                          onClick={() => handleSelectDurationPreset(p.minutes)}
                          className={cn(
                            "h-7 text-[11px] font-bold px-2 rounded-lg cursor-pointer",
                            durationMinutes === p.minutes
                              ? "bg-amber-500 text-black hover:bg-amber-600"
                              : "hover:bg-secondary/60"
                          )}
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="maint-datetime" className="text-[11px] font-bold text-foreground">
                        Data e Horário Exato Previsto de Término
                      </Label>
                      <Input
                        id="maint-datetime"
                        type="datetime-local"
                        value={customDateTime}
                        onChange={(e) => setCustomDateTime(e.target.value)}
                        className="h-9 text-xs font-mono rounded-xl bg-background/80"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="maint-severity" className="text-[11px] font-bold text-foreground">
                        Gravidade / Tipo de Alerta
                      </Label>
                      <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                        <SelectTrigger id="maint-severity" className="h-9 text-xs rounded-xl bg-background/80">
                          <SelectValue placeholder="Selecione a gravidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warning">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              Programada / Aviso (Âmbar)
                            </span>
                          </SelectItem>
                          <SelectItem value="destructive">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              Crítica / Emergencial (Vermelho)
                            </span>
                          </SelectItem>
                          <SelectItem value="info">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-400" />
                              Melhorias Rápidas (Azul)
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ABA DE HISTÓRICO DE MANUTENÇÕES */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Registro de Manutenções Anteriores</h4>
                  <p className="text-[10px] text-muted-foreground">
                    Histórico das manutenções executadas na plataforma com horários e duração.
                  </p>
                </div>
                {settings.maintenanceHistory && settings.maintenanceHistory.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearHistory}
                    disabled={loading}
                    className="h-7 text-[10px] text-destructive hover:bg-destructive/10 font-bold gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar Histórico
                  </Button>
                )}
              </div>

              {!settings.maintenanceHistory || settings.maintenanceHistory.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-2">
                  <History className="w-8 h-8 mx-auto opacity-40 text-amber-400" />
                  <p className="text-xs font-medium">Nenhum histórico de manutenção registrado ainda.</p>
                  <p className="text-[10px]">As manutenções realizadas e finalizadas serão arquivadas aqui automaticamente.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {settings.maintenanceHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-border/60 bg-secondary/20 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-xs">{item.title}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-mono",
                              item.severity === "destructive"
                                ? "border-rose-500/40 text-rose-300"
                                : item.severity === "info"
                                ? "border-sky-500/40 text-sky-300"
                                : "border-amber-500/40 text-amber-300"
                            )}
                          >
                            {item.durationMinutes ? `${item.durationMinutes} min` : "Finalizada"}
                          </Badge>
                          {item.authorName && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              por {item.authorName}
                            </span>
                          )}
                        </div>
                        {item.message && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 font-mono">
                          Início: {new Date(item.startedAt).toLocaleString("pt-BR")}
                          {item.endedAt && ` · Fim: ${new Date(item.endedAt).toLocaleTimeString("pt-BR")}`}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteHistoryItem(item.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                        title="Excluir este registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 border-t border-border/60 bg-background/80 flex items-center justify-between gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetData}
            disabled={loading}
            className="h-8 text-xs font-bold gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Resetar Formulário
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs font-bold cursor-pointer"
            >
              Fechar
            </Button>

            {isCurrentActive ? (
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAndStart}
                disabled={loading}
                className="h-8 text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-black cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Atualizar Dados da Manutenção
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAndStart}
                disabled={loading}
                className="h-8 text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Iniciar Manutenção Global
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
