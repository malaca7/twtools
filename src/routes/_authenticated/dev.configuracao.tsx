import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Code2,
  Terminal,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Bug,
  Bell,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  Bot,
  Settings,
  AlertTriangle,
  Play,
  Eye,
  ExternalLink,
  Palette,
  Crown,
  Check,
  Users,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  PANEL_COLOR_STYLES,
  type PanelColor,
  type PanelColorType,
  getPanelColorStyle,
} from "@/lib/panelTheme";
import { reportAppError } from "@/lib/app-error-reporting";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { cn } from "@/lib/utils";
import {
  getDevConfiguration,
  saveDevConfiguration,
  DEFAULT_DEV_CONFIG,
  DEV_CONFIG_KEY,
  DEV_CONFIG_EVENT,
  type DevConfiguration,
} from "@/services/devService";
import { DevForcePurgeCard } from "@/components/dev/DevForcePurgeCard";
import { DevAuditLogModal } from "@/components/dev/DevAuditLogModal";
import { useAuditLogs } from "@/hooks/useData";
import { logAuditAction } from "@/lib/app-api";

export const Route = createFileRoute("/_authenticated/dev/configuracao")({
  component: DevConfiguracaoPageWrapper,
});

function DevConfiguracaoPageWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return (
    <DeveloperGuard>
      <DevConfiguracaoContent />
    </DeveloperGuard>
  );
}

export function DevConfiguracaoContent() {
  const { user, profile, level } = useAuth();
  const queryClient = useQueryClient();
  const { data: allAuditLogs = [] } = useAuditLogs();

  const [config, setConfig] = useState<DevConfiguration>(DEFAULT_DEV_CONFIG);
  const [initialConfig, setInitialConfig] = useState<DevConfiguration>(DEFAULT_DEV_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona automaticamente se acessar abas de bot que foram migradas para /dev/bot
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get("tab");
      if (tab === "bot-manage" || tab === "webhooks" || tab === "discord-logs") {
        window.location.replace(`/dev/bot/${tab}`);
      } else if (tab === "lives") {
        window.location.replace("/dev/configuracao");
      }
    }
  }, []);

  // Estados para Auditoria de Ações Dev
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [triggeringTestLog, setTriggeringTestLog] = useState(false);

  // Filtra logs do contexto dev
  const devLogs = useMemo(() => {
    return allAuditLogs.filter((l) => {
      return (
        l.is_dev_action ||
        Boolean((l.new_data as any)?._meta?.is_dev_action) ||
        String(l.action || "").startsWith("dev_") ||
        String(l.action || "").includes("dev") ||
        String(l.entity || "").startsWith("dev_") ||
        String(l.entity || "").includes("dev")
      );
    });
  }, [allAuditLogs]);

  // Carrega as configurações exclusivas do Módulo Dev ao inicializar
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    getDevConfiguration(user, profile, level)
      .then((data) => {
        if (isMounted) {
          setConfig(data);
          setInitialConfig(JSON.parse(JSON.stringify(data)));
        }
      })
      .catch((err) => {
        if (isMounted) {
          const msg = err?.message || "Erro 403: Falha ao carregar configurações do Módulo Dev.";
          setError(msg);
          toast.error(msg);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, profile, level]);

  // Detecta se existem alterações pendentes não salvas
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(initialConfig);
  }, [config, initialConfig]);

  // Handler para alternar switches individuais
  const handleToggle = (key: keyof DevConfiguration) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handler imediato para trocar a cor de um painel específico
  const handleSelectPanelColor = (
    key: "devThemeColor" | "ceoThemeColor" | "memberThemeColor",
    color: PanelColor
  ) => {
    const updated: DevConfiguration = {
      ...config,
      [key]: color,
    };
    setConfig(updated);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: updated }));
      }
      const label = PANEL_COLOR_STYLES[color]?.label || color;
      const panelName =
        key === "devThemeColor" ? "Painel Dev" : key === "ceoThemeColor" ? "Painel CEO" : "Painel Membro";
      toast.success(`${panelName}: Cor atualizada para ${label}!`, {
        description: "Todas as categorias, ícones e itens do painel agora utilizam esta cor.",
      });
    } catch (e) {
      console.error("Falha ao salvar tema localmente:", e);
    }
  };

  // Handler para aplicar uma única cor a TODOS os painéis (Dev, CEO e Membro)
  const handleApplyToAllPanels = (color: PanelColor) => {
    const updated: DevConfiguration = {
      ...config,
      devThemeColor: color,
      ceoThemeColor: color,
      memberThemeColor: color,
    };
    setConfig(updated);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: updated }));
      }
      const label = PANEL_COLOR_STYLES[color]?.label || color;
      toast.success(`Cor "${label}" aplicada a TODOS os painéis com sucesso!`, {
        description: "Painel Dev, Painel CEO e Painel Membro agora usam a mesma identidade visual.",
        icon: "✨",
      });
    } catch (e) {
      console.error("Falha ao salvar tema globalmente:", e);
    }
  };

  // Disparo manual de log de teste para validação imediata da Auditoria Dev
  const handleTriggerTestLog = async () => {
    setTriggeringTestLog(true);
    try {
      const wasRecorded = await logAuditAction(
        "test_dev_action",
        "dev_configuration",
        {
          setting: "devAuditLogs",
          status: config.devAuditLogs ? "enabled" : "disabled",
          triggered_by: user?.email || profile?.nome || "Desenvolvedor",
          timestamp: new Date().toISOString(),
        }
      );

      await queryClient.invalidateQueries({ queryKey: ["audit_logs"] });

      if (wasRecorded) {
        toast.success("Log de Teste Dev registrado com sucesso no servidor!", {
          description: "O evento foi salvo no banco com tag dev e metadados completos.",
          icon: "💻",
        });
      } else {
        toast.info("Gravação de Ações Dev suprimida.", {
          description: "A opção 'Registrar Ações Dev no Servidor' está desativada. O log foi descartado conforme configurado.",
          icon: "🛡️",
        });
      }
    } catch (err: any) {
      toast.error("Falha ao registrar log de teste: " + (err?.message || "Erro desconhecido"));
    } finally {
      setTriggeringTestLog(false);
    }
  };

  // Handler para salvar as alterações permanentemente no Supabase
  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError(null);

    try {
      await saveDevConfiguration(config, user, profile, level);
      setInitialConfig(JSON.parse(JSON.stringify(config)));
      toast.success("Configurações do Módulo Dev salvas com sucesso no servidor!", {
        icon: "💻",
      });

      // Grava log de auditoria técnica da alteração
      void logAuditAction(
        "save_dev_configuration",
        "dev_configuration",
        { ...config },
        { ...initialConfig }
      );
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
    } catch (err: any) {
      const msg = err?.message || "Falha ao salvar configurações do Módulo Dev.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Handler para restaurar os padrões
  const handleResetDefaults = () => {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_DEV_CONFIG));
    setConfig(defaults);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(defaults));
        window.dispatchEvent(new CustomEvent(DEV_CONFIG_EVENT, { detail: defaults }));
      }
    } catch {}
    toast.info("Configurações e cores restauradas para os padrões oficiais.");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Dev → Configuração"
          description="Ajustes exclusivos para desenvolvedores, controle de recursos experimentais, identidade visual dos painéis e auditoria."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            disabled={loading || saving}
            className="h-9 text-xs gap-1.5 font-bold"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrões
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || saving || !hasChanges}
            className={cn(
              "h-9 text-xs gap-1.5 font-bold shadow-sm transition-all duration-200",
              hasChanges
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Modal de Auditoria de Ações Dev */}
      <DevAuditLogModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        logs={devLogs}
        onTriggerTestLog={handleTriggerTestLog}
        triggeringTestLog={triggeringTestLog}
      />

      {loading ? (
        <Card className="p-12 flex flex-col items-center justify-center space-y-3 border-dashed">
          <Loader2 className="h-8 w-8 text-rose-500 animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Carregando configurações do Módulo Dev...</p>
        </Card>
      ) : error ? (
        <Card className="p-8 border-rose-500/30 bg-rose-500/5 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Acesso Negado ou Erro de Inicialização</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* BANNER INFORMATIVO: CENTRAL UNIFICADA DO BOT */}
          <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  Central Unificada do Bot Discord
                  <Badge variant="outline" className="text-[10px] bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
                    Unificado em /dev/bot
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  As abas <strong>Gerenciar Bot</strong>, <strong>Webhooks Discord</strong> e <strong>Canais & Logs</strong> foram unificadas na página dedicada do <strong>Bot</strong> junto ao Studio & Builder.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shrink-0">
              <Link to="/dev/bot">
                Acessar Central do Bot
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          {/* Card de Limpeza Forçada de Cache em Tempo Real */}
          <DevForcePurgeCard />

          {/* Card de Cores Padrão dos Painéis Dev, CEO & Membro */}
          <Card className="surface-card border transition-all duration-300">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">
                      Cores Padrão dos Painéis (Dev, CEO & Membro)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure a identidade visual oficial dos menus, categorias e ícones de cada painel. Ao selecionar uma cor, todas as categorias, ícones e itens do painel passam a adotá-la automaticamente.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                  Identidade Visual dos Painéis
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Seletor 1: Cor do Painel Dev */}
                <PanelColorPickerCard
                  panelName="Painel Dev"
                  panelSubname="Desenvolvedor"
                  icon={Terminal}
                  themeKey="devThemeColor"
                  colorValue={config.devThemeColor}
                  fallback="rose"
                  description="Define a cor padrão aplicada a todas as categorias, ícones e itens do menu lateral em modo Desenvolvedor."
                  onSelectColor={handleSelectPanelColor}
                  onApplyToAllPanels={handleApplyToAllPanels}
                />

                {/* Seletor 2: Cor do Painel CEO */}
                <PanelColorPickerCard
                  panelName="Painel CEO"
                  panelSubname="Executivo / Diretoria"
                  icon={Crown}
                  themeKey="ceoThemeColor"
                  colorValue={config.ceoThemeColor}
                  fallback="amber"
                  description="Define a cor padrão aplicada a todas as categorias, ícones e itens do menu lateral em modo Executivo CEO."
                  onSelectColor={handleSelectPanelColor}
                  onApplyToAllPanels={handleApplyToAllPanels}
                />

                {/* Seletor 3: Cor do Painel de Membro */}
                <PanelColorPickerCard
                  panelName="Painel Membro"
                  panelSubname="Plataforma Geral"
                  icon={Users}
                  themeKey="memberThemeColor"
                  colorValue={config.memberThemeColor}
                  fallback="cyan"
                  description="Define a cor padrão aplicada a todas as categorias, ícones e itens do menu lateral para todos os membros regulares."
                  onSelectColor={handleSelectPanelColor}
                  onApplyToAllPanels={handleApplyToAllPanels}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cards de Opções Adicionais do Desenvolvedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Option 1: Developer Bypass */}
            <Card className="surface-card border transition-all duration-300">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">Bypass de Autorização Dev</CardTitle>
                    <CardDescription className="text-[0.7rem]">Privilégio supremo de desenvolvedor</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40 hover:border-primary/30 transition-all">
                  <div className="space-y-0.5">
                    <Label htmlFor="developerBypassMode" className="text-xs font-bold text-foreground cursor-pointer block">
                      Acesso Irrestrito Supremo
                    </Label>
                    <p className="text-[0.65rem] text-muted-foreground">
                      Garante acesso completo a todas as páginas e ações sem bloqueio de patente.
                    </p>
                  </div>
                  <Switch
                    id="developerBypassMode"
                    checked={config.developerBypassMode}
                    onCheckedChange={() => handleToggle("developerBypassMode")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Option 2: Dev System Notifications */}
            <Card className="surface-card border transition-all duration-300">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-extrabold text-foreground">Alertas de Exceção</CardTitle>
                    <CardDescription className="text-[0.7rem]">Notificações em tempo real</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40 hover:border-primary/30 transition-all">
                  <div className="space-y-0.5">
                    <Label htmlFor="devSystemNotifications" className="text-xs font-bold text-foreground cursor-pointer block">
                      Notificações Instantâneas Dev
                    </Label>
                    <p className="text-[0.65rem] text-muted-foreground">
                      Exibe popups de aviso em tela quando ocorrem exceções não tratadas na plataforma.
                    </p>
                  </div>
                  <Switch
                    id="devSystemNotifications"
                    checked={config.devSystemNotifications}
                    onCheckedChange={() => handleToggle("devSystemNotifications")}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <span className="text-[0.7rem] text-muted-foreground">
                    Validação em tempo real:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold gap-1.5 border-sky-500/30 hover:border-sky-500/60 text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 h-7"
                    onClick={() => {
                      reportAppError(new Error("Teste de alerta de exceção dev executado com sucesso!"));
                      if (!config.devSystemNotifications) {
                        toast.info("Alertas de Exceção estão desativados. Nenhum popup de erro foi disparado.", {
                          duration: 3500,
                        });
                      }
                    }}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Disparar Exceção de Teste
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Subcomponente de Seleção de Cores para Cada Painel
 * Permite filtrar por Sólidas, Peroladas e Degradês, visualizar preview imediato
 * e aplicar em todos os painéis com um clique.
 */
function PanelColorPickerCard({
  panelName,
  panelSubname,
  icon: Icon,
  themeKey,
  colorValue,
  fallback,
  description,
  onSelectColor,
  onApplyToAllPanels,
}: {
  panelName: string;
  panelSubname: string;
  icon: any;
  themeKey: "devThemeColor" | "ceoThemeColor" | "memberThemeColor";
  colorValue?: PanelColor;
  fallback: PanelColor;
  description: string;
  onSelectColor: (key: "devThemeColor" | "ceoThemeColor" | "memberThemeColor", color: PanelColor) => void;
  onApplyToAllPanels: (color: PanelColor) => void;
}) {
  const [filterType, setFilterType] = useState<"all" | PanelColorType>("all");
  const currentColor = colorValue || fallback;
  const currentStyle = getPanelColorStyle(currentColor, fallback);

  const allKeys = useMemo(() => Object.keys(PANEL_COLOR_STYLES) as PanelColor[], []);
  const filteredKeys = useMemo(() => {
    if (filterType === "all") return allKeys;
    return allKeys.filter((k) => PANEL_COLOR_STYLES[k].colorType === filterType);
  }, [allKeys, filterType]);

  const solidCount = useMemo(() => allKeys.filter((k) => PANEL_COLOR_STYLES[k].colorType === "solid").length, [allKeys]);
  const pearlCount = useMemo(() => allKeys.filter((k) => PANEL_COLOR_STYLES[k].colorType === "pearl").length, [allKeys]);
  const gradientCount = useMemo(() => allKeys.filter((k) => PANEL_COLOR_STYLES[k].colorType === "gradient").length, [allKeys]);

  return (
    <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/60 flex flex-col justify-between">
      <div className="space-y-3.5">
        {/* Cabeçalho do Painel */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "p-2 rounded-lg border flex items-center justify-center shrink-0 shadow-xs",
                currentStyle.bgSubtleClass,
                currentStyle.borderSubtleClass,
                currentStyle.iconClass
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-foreground block">
                {panelName}
              </span>
              <span className="text-[10.5px] text-muted-foreground font-medium">
                {panelSubname}
              </span>
            </div>
          </div>
          <Badge className={currentStyle.badgeClass}>
            {currentStyle.label.split(" ")[0]}
          </Badge>
        </div>

        <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
          {description}
        </p>

        {/* Filtros de Tipos de Cor */}
        <div className="flex items-center gap-1 p-1 bg-secondary/40 rounded-lg border border-border/40 text-[10px] font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={cn(
              "px-2 py-1 rounded-md transition-all shrink-0 cursor-pointer",
              filterType === "all" ? "bg-background text-foreground shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todas ({allKeys.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("solid")}
            className={cn(
              "px-2 py-1 rounded-md transition-all shrink-0 cursor-pointer",
              filterType === "solid" ? "bg-background text-foreground shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Sólidas ({solidCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("pearl")}
            className={cn(
              "px-2 py-1 rounded-md transition-all shrink-0 cursor-pointer flex items-center gap-1",
              filterType === "pearl" ? "bg-background text-foreground shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-2.5 h-2.5" />
            Peroladas ({pearlCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("gradient")}
            className={cn(
              "px-2 py-1 rounded-md transition-all shrink-0 cursor-pointer flex items-center gap-1",
              filterType === "gradient" ? "bg-background text-foreground shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="w-2.5 h-2.5" />
            Degradês ({gradientCount})
          </button>
        </div>

        {/* Grade de Cores com Scroll Suave */}
        <div className="grid grid-cols-2 gap-1.5 max-h-[290px] overflow-y-auto pr-1 no-scrollbar">
          {filteredKeys.map((cKey) => {
            const style = PANEL_COLOR_STYLES[cKey];
            const isSelected = currentColor === cKey;

            return (
              <button
                key={`${themeKey}-${cKey}`}
                type="button"
                onClick={() => onSelectColor(themeKey, cKey)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer relative group",
                  isSelected
                    ? cn(style.borderClass, style.bgSubtleClass, "ring-2", style.ringClass, "shadow-sm")
                    : "border-border/60 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                )}
                title={style.description}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs border border-white/20"
                  style={{ background: style.previewGradient || style.hex }}
                />
                <span className="truncate text-[10.5px] flex-1">{style.label.split(" ")[0]}</span>
                {isSelected && <Check className="h-3 w-3 ml-auto shrink-0 text-foreground" />}
              </button>
            );
          })}
        </div>

        {/* Preview Rápido */}
        <div className={cn("p-3 rounded-xl border text-xs space-y-2", currentStyle.borderSubtleClass, currentStyle.bgSubtleClass)}>
          <div className="flex items-center justify-between text-[11px]">
            <span className={cn("font-bold flex items-center gap-1.5", currentStyle.textClass)}>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              Prévia da Categoria
            </span>
            <Badge className={currentStyle.badgeClass}>
              Ativo
            </Badge>
          </div>
          <div className={cn("px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px]", currentStyle.activeItemClass)}>
            <Code2 className="h-3.5 w-3.5 shrink-0" />
            <span>Item Ativo de Menu</span>
          </div>
        </div>
      </div>

      {/* Botão de Aplicação Global a Todos os Painéis */}
      <div className="pt-2 border-t border-border/40 mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onApplyToAllPanels(currentColor)}
          className="w-full text-[11px] font-bold h-8 gap-1.5 border-border/60 hover:border-primary/50 hover:bg-primary/10 transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Aplicar em Todos os Painéis
        </Button>
      </div>
    </div>
  );
}
