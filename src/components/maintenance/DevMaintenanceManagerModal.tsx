import { useState, useEffect, useMemo } from "react";
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
  Users,
  Tags,
  SlidersHorizontal,
  Shield,
  Check,
  Globe,
  Sun,
  Moon,
  Zap,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlatformSettings, type MaintenanceHistoryItem } from "@/hooks/usePlatformSettings";
import { useAuth } from "@/hooks/useAuth";
import { useCustomRoles } from "@/hooks/useData";
import { useMemberTags } from "@/hooks/useMemberTags";
import {
  LEVELS,
  LEVEL_LABEL,
  LEVEL_DESCRIPTION,
  LEVEL_RANK,
  levelBadgeClass,
  type AppLevel,
} from "@/lib/permissions";
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
  { label: "+15m", minutes: 15 },
  { label: "+30m", minutes: 30 },
  { label: "+45m", minutes: 45 },
  { label: "+1h", minutes: 60 },
  { label: "+2h", minutes: 120 },
  { label: "+3h", minutes: 180 },
  { label: "+4h", minutes: 240 },
  { label: "+6h", minutes: 360 },
  { label: "+12h", minutes: 720 },
  { label: "+24h", minutes: 1440 },
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
  const { data: customRoles = [] } = useCustomRoles();
  const { data: memberTags = [] } = useMemberTags();

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
  const [targetType, setTargetType] = useState<"all" | "selected">(
    settings.maintenanceTargetType || "all"
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    settings.maintenanceTargetRoles || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    settings.maintenanceTargetTags || []
  );

  const [activeTab, setActiveTab] = useState<"manage" | "history">("manage");
  const [targetSubTab, setTargetSubTab] = useState<"roles" | "tags">("roles");
  const [loading, setLoading] = useState(false);

  // Lista de cargos disponíveis
  const availableRoles = useMemo(() => {
    if (customRoles && customRoles.length > 0) {
      const filtered = customRoles.filter((r) => {
        const id = (r.id || "").toLowerCase();
        return id !== "desenvolvedor" && id !== "dev";
      });
      if (filtered.length > 0) {
        return filtered.map((r) => ({
          id: r.id.toLowerCase(),
          nome: r.nome || LEVEL_LABEL[r.id as AppLevel] || r.id,
          descricao: r.descricao || LEVEL_DESCRIPTION[r.id as AppLevel] || "Cargo operacional.",
          rank: r.rank || LEVEL_RANK[r.id as AppLevel] || 0,
        }));
      }
    }
    return LEVELS.map((lvl) => ({
      id: lvl,
      nome: LEVEL_LABEL[lvl] || lvl,
      descricao: LEVEL_DESCRIPTION[lvl] || "Cargo operacional.",
      rank: LEVEL_RANK[lvl] || 0,
    }));
  }, [customRoles]);

  // Lista de tags ativas
  const availableTags = useMemo(() => {
    return memberTags.filter((t) => t.is_active !== false);
  }, [memberTags]);

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
      setTargetType(settings.maintenanceTargetType || "all");
      setSelectedRoles(settings.maintenanceTargetRoles || []);
      setSelectedTags(settings.maintenanceTargetTags || []);

      if (settings.maintenanceEstimatedEnd) {
        try {
          const d = new Date(settings.maintenanceEstimatedEnd);
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
  }, [
    open,
    settings.maintenanceActive,
    settings.maintenanceEstimatedEnd,
    settings.maintenanceTargetType,
    settings.maintenanceTargetRoles,
    settings.maintenanceTargetTags,
  ]);

  // Calcula a data e duração a partir de customDateTime
  const calculatedDuration = useMemo(() => {
    if (!customDateTime) return durationMinutes;
    try {
      const targetTime = new Date(customDateTime).getTime();
      const diffMs = targetTime - Date.now();
      if (diffMs <= 0) return 0;
      return Math.round(diffMs / (60 * 1000));
    } catch {
      return durationMinutes;
    }
  }, [customDateTime, durationMinutes]);

  // Handle preset duration select
  const handleSelectDurationPreset = (minutes: number) => {
    setDurationMinutes(minutes);
    const d = new Date(Date.now() + minutes * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, "0");
    setCustomDateTime(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  };

  // Define horário de término diretamente (ex: hoje às 23:59, amanhã às 06:00, etc.)
  const handleSetExactTimeShortcut = (hour: number, minute: number, isTomorrow: boolean = false) => {
    const target = new Date();
    if (isTomorrow) {
      target.setDate(target.getDate() + 1);
    }
    target.setHours(hour, minute, 0, 0);

    // Se o horário de hoje já passou e não marcamos isTomorrow, joga para amanhã
    if (!isTomorrow && target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }

    const diffMs = target.getTime() - Date.now();
    const mins = Math.max(5, Math.round(diffMs / (60 * 1000)));
    setDurationMinutes(mins);

    const pad = (n: number) => n.toString().padStart(2, "0");
    setCustomDateTime(
      `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`
    );
  };

  // Helpers de seleção de cargos
  const toggleRole = (roleId: string) => {
    const cleanId = roleId.toLowerCase();
    setSelectedRoles((prev) =>
      prev.includes(cleanId) ? prev.filter((r) => r !== cleanId) : [...prev, cleanId]
    );
  };

  const selectAllRoles = () => {
    setSelectedRoles(availableRoles.map((r) => r.id));
  };

  const clearAllRoles = () => {
    setSelectedRoles([]);
  };

  const selectOperationalRoles = () => {
    const opRoles = ["membro", "motoqueiro", "novato"];
    setSelectedRoles(availableRoles.filter((r) => opRoles.includes(r.id)).map((r) => r.id));
  };

  // Helpers de seleção de tags
  const toggleTag = (tagId: string) => {
    const cleanId = tagId.toLowerCase();
    setSelectedTags((prev) =>
      prev.includes(cleanId) ? prev.filter((t) => t !== cleanId) : [...prev, cleanId]
    );
  };

  const selectAllTags = () => {
    setSelectedTags(availableTags.map((t) => t.id.toLowerCase()));
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  // Start or Update maintenance
  const handleSaveAndStart = async () => {
    if (targetType === "selected" && selectedRoles.length === 0 && selectedTags.length === 0) {
      toast.warning("Selecione pelo menos um cargo ou tag para aplicar a manutenção seletiva.");
      return;
    }

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
        durationMinutes: calculatedDuration > 0 ? calculatedDuration : durationMinutes,
        estimatedEnd: finalEndIso || undefined,
        severity,
        authorName,
        allowDevAccess: true,
        targetType,
        targetRoles: targetType === "selected" ? selectedRoles : [],
        targetTags: targetType === "selected" ? selectedTags : [],
      });

      toast.success(
        isCurrentActive ? "Manutenção Atualizada com Sucesso!" : "Modo de Manutenção Ativado!",
        {
          description:
            targetType === "selected"
              ? `Aplicado exclusivamente para ${selectedRoles.length} cargos e ${selectedTags.length} tags selecionadas.`
              : "A plataforma está restrita para todos os integrantes com contador regressivo.",
          icon: "🚨",
        }
      );
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
      setMessage(
        "Estamos realizando melhorias programadas e otimizações na infraestrutura. A plataforma retornará em instantes."
      );
      setDurationMinutes(30);
      setTargetType("all");
      setSelectedRoles([]);
      setSelectedTags([]);
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

  // Formatação amigável do horário de término
  const formattedEndTimePreview = useMemo(() => {
    if (!customDateTime) return null;
    try {
      const d = new Date(customDateTime);
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
  }, [customDateTime]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-2xl border-amber-500/40 shadow-2xl">
        {/* Header Tecnológico */}
        <div className="p-5 border-b border-border/60 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl border flex items-center justify-center shrink-0",
                isCurrentActive
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/40"
              )}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2 flex-wrap">
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
                {isCurrentActive && settings.maintenanceTargetType === "selected" && (
                  <Badge
                    variant="outline"
                    className="text-[9px] uppercase font-mono border-amber-400/50 text-amber-300 bg-amber-500/10"
                  >
                    Seletiva ({settings.maintenanceTargetRoles?.length || 0} cargos / {settings.maintenanceTargetTags?.length || 0} tags)
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Controle global e seletivo de bloqueio com aviso em tela cheia, contador regressivo e acesso Dev.
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
                      ? settings.maintenanceTargetType === "selected"
                        ? `A manutenção está ativa de forma SELETIVA apenas para os cargos (${settings.maintenanceTargetRoles?.join(", ") || "nenhum"}) e tags (${settings.maintenanceTargetTags?.join(", ") || "nenhuma"}). Outros usuários navegam normalmente.`
                        : "O site está bloqueado para todos os membros comuns e visitantes com modal central e contador regressivo. Desenvolvedores possuem livre acesso com indicativos visuais."
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

              {/* SEÇÃO 1: PÚBLICO-ALVO & ESCOPO DA MANUTENÇÃO (Requirement 1) */}
              <div className="p-4 rounded-2xl bg-secondary/20 border border-border/70 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                      Escopo & Público-Alvo da Manutenção
                    </h4>
                    <p className="text-[10.5px] text-muted-foreground">
                      Escolha se a manutenção afeta toda a plataforma ou apenas cargos e tags específicos.
                    </p>
                  </div>

                  {/* Seletor de Tipo de Público */}
                  <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-xl border border-border/60 shrink-0">
                    <button
                      type="button"
                      onClick={() => setTargetType("all")}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                        targetType === "all"
                          ? "bg-amber-500 text-black shadow-xs font-black"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Todos os Integrantes
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType("selected")}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                        targetType === "selected"
                          ? "bg-amber-500 text-black shadow-xs font-black"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Tags className="w-3.5 h-3.5" />
                      Cargos & Tags Específicos
                    </button>
                  </div>
                </div>

                {/* Sub-painel quando "Cargos e Tags Específicos" está ativo */}
                {targetType === "selected" && (
                  <div className="space-y-3 pt-2 border-t border-border/50 animate-in fade-in-50 duration-200">
                    {/* Sub-tabs Cargos vs Tags */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-background/80 p-1 rounded-xl border border-border/70">
                        <button
                          type="button"
                          onClick={() => setTargetSubTab("roles")}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                            targetSubTab === "roles"
                              ? "bg-primary text-primary-foreground shadow-xs font-black"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Users className="w-3.5 h-3.5" />
                          Cargos Afetados ({selectedRoles.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetSubTab("tags")}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                            targetSubTab === "tags"
                              ? "bg-primary text-primary-foreground shadow-xs font-black"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Tags className="w-3.5 h-3.5" />
                          Tags de Sistema ({selectedTags.length})
                        </button>
                      </div>

                      {/* Botões de Ação Rápida */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {targetSubTab === "roles" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={selectAllRoles}
                              className="h-6.5 text-[10px] font-bold px-2 cursor-pointer"
                            >
                              Marcar Todos
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={selectOperationalRoles}
                              className="h-6.5 text-[10px] font-bold px-2 text-amber-400 border-amber-500/40 hover:bg-amber-500/10 cursor-pointer"
                            >
                              Apenas Operacionais
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={clearAllRoles}
                              className="h-6.5 text-[10px] font-bold px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              Limpar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={selectAllTags}
                              className="h-6.5 text-[10px] font-bold px-2 cursor-pointer"
                            >
                              Marcar Todas
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={clearAllTags}
                              className="h-6.5 text-[10px] font-bold px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              Limpar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Grade de Cargos */}
                    {targetSubTab === "roles" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto pr-1">
                        {availableRoles.map((role) => {
                          const isChecked = selectedRoles.includes(role.id.toLowerCase());
                          return (
                            <div
                              key={role.id}
                              onClick={() => toggleRole(role.id)}
                              className={cn(
                                "flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none",
                                isChecked
                                  ? "bg-amber-500/15 border-amber-500/50 shadow-xs ring-1 ring-amber-500/20"
                                  : "bg-background/60 border-border/60 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleRole(role.id)}
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={cn(
                                      "text-xs font-bold block truncate",
                                      isChecked && "text-amber-300"
                                    )}
                                  >
                                    {role.nome}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[9px] font-mono px-1 py-0",
                                      levelBadgeClass(role.id as AppLevel)
                                    )}
                                  >
                                    #{role.rank}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                                  {role.descricao}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Grade de Tags */}
                    {targetSubTab === "tags" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto pr-1">
                        {availableTags.length === 0 ? (
                          <div className="col-span-full py-6 text-center text-xs text-muted-foreground">
                            Nenhuma tag de sistema cadastrada no momento.
                          </div>
                        ) : (
                          availableTags.map((tag) => {
                            const isChecked = selectedTags.includes(tag.id.toLowerCase());
                            return (
                              <div
                                key={tag.id}
                                onClick={() => toggleTag(tag.id)}
                                className={cn(
                                  "flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none",
                                  isChecked
                                  ? "bg-amber-500/15 border-amber-500/50 shadow-xs ring-1 ring-amber-500/20"
                                  : "bg-background/60 border-border/60 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleTag(tag.id)}
                                  className="mt-0.5"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span
                                      className={cn(
                                        "text-xs font-bold truncate",
                                        isChecked && "text-amber-300"
                                      )}
                                    >
                                      {tag.nome}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                                    {tag.descricao || "Tag de sistema"}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Alerta Resumo */}
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-center justify-between gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        <strong>Resumo do Escopo:</strong> Apenas membros com os cargos ou tags marcadas acima verão o popup de manutenção.
                      </span>
                      <Badge className="bg-amber-500 text-black font-mono font-bold text-[10px]">
                        {selectedRoles.length} Cargos · {selectedTags.length} Tags
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: FORMULÁRIO DE TÍTULO E MENSAGEM */}
              <div className="space-y-4">
                {/* Título da Manutenção */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maint-title" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Título do Aviso de Manutenção
                    </Label>
                    <span className="text-[10px] text-muted-foreground">Exibido no cabeçalho do popup</span>
                  </div>
                  <Input
                    id="maint-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Manutenção Preventiva de Sistema"
                    className="h-9.5 text-xs font-bold rounded-xl"
                  />
                  {/* Presets Rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
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
                </div>

                {/* SEÇÃO 3: SELEÇÃO AVANÇADA DE HORA E DURAÇÃO (Requirement 2) */}
                <div className="p-4 rounded-2xl bg-secondary/20 border border-border/70 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Seleção de Horário & Duração da Manutenção
                      </h4>
                      <p className="text-[10.5px] text-muted-foreground">
                        Defina a duração ou escolha o horário exato de término para a contagem regressiva em tempo real.
                      </p>
                    </div>

                    {formattedEndTimePreview && (
                      <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/40 px-2.5 py-1 rounded-xl text-xs font-mono font-bold text-amber-300 shrink-0">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Previsão: {formattedEndTimePreview}</span>
                      </div>
                    )}
                  </div>

                  {/* 1. Presets de Duração (+15m, +30m, etc.) */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <span>Adicionar Duração Rápida:</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DURATION_PRESETS.map((p) => {
                        const isSelected = calculatedDuration === p.minutes;
                        return (
                          <Button
                            key={p.minutes}
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => handleSelectDurationPreset(p.minutes)}
                            className={cn(
                              "h-7 text-[11px] font-bold px-2 rounded-lg cursor-pointer transition-all",
                              isSelected
                                ? "bg-amber-500 text-black hover:bg-amber-600 shadow-xs scale-105"
                                : "hover:bg-secondary/60 text-foreground"
                            )}
                          >
                            {p.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Atalhos Diretos de Horário de Término */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <span>Atalhos de Horário de Término:</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetExactTimeShortcut(23, 59, false)}
                        className="h-7 text-[10.5px] font-bold px-2 rounded-lg border-border/70 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300 cursor-pointer flex items-center gap-1"
                      >
                        <Moon className="w-3 h-3 text-indigo-400" />
                        Até 23:59 (Fim de Hoje)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetExactTimeShortcut(6, 0, true)}
                        className="h-7 text-[10.5px] font-bold px-2 rounded-lg border-border/70 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300 cursor-pointer flex items-center gap-1"
                      >
                        <Sun className="w-3 h-3 text-amber-400" />
                        Até 06:00 (Madrugada Amanhã)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetExactTimeShortcut(12, 0, false)}
                        className="h-7 text-[10.5px] font-bold px-2 rounded-lg border-border/70 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300 cursor-pointer flex items-center gap-1"
                      >
                        <Sun className="w-3 h-3 text-yellow-400" />
                        Até 12:00 (Meio-dia)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetExactTimeShortcut(18, 0, false)}
                        className="h-7 text-[10.5px] font-bold px-2 rounded-lg border-border/70 hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-300 cursor-pointer flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3 text-rose-400" />
                        Até 18:00 (Fim de Tarde)
                      </Button>
                    </div>
                  </div>

                  {/* 3. Seletor de Data/Hora Precisa + Gravidade */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                    <div className="space-y-1">
                      <Label htmlFor="maint-datetime" className="text-[11px] font-bold text-foreground flex items-center justify-between">
                        <span>Data e Horário Preciso de Término</span>
                        {calculatedDuration > 0 && (
                          <span className="text-[10px] font-mono text-amber-400">
                            (~{Math.floor(calculatedDuration / 60)}h {calculatedDuration % 60}m)
                          </span>
                        )}
                      </Label>
                      <Input
                        id="maint-datetime"
                        type="datetime-local"
                        value={customDateTime}
                        onChange={(e) => setCustomDateTime(e.target.value)}
                        className="h-9.5 text-xs font-mono font-bold rounded-xl bg-background/80"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="maint-severity" className="text-[11px] font-bold text-foreground">
                        Gravidade / Tipo de Alerta
                      </Label>
                      <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                        <SelectTrigger id="maint-severity" className="h-9.5 text-xs rounded-xl bg-background/80">
                          <SelectValue placeholder="Selecione a gravidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warning">
                            <span className="flex items-center gap-2 font-medium">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              Programada / Aviso (Âmbar)
                            </span>
                          </SelectItem>
                          <SelectItem value="destructive">
                            <span className="flex items-center gap-2 font-medium">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              Crítica / Emergencial (Vermelho)
                            </span>
                          </SelectItem>
                          <SelectItem value="info">
                            <span className="flex items-center gap-2 font-medium">
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
                Iniciar Manutenção
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
