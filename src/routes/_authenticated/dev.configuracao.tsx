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
  Webhook,
  Radio,
  Palette,
  Crown,
  Check,
  Hash,
} from "lucide-react";
import { PANEL_COLOR_STYLES, type PanelColor, getPanelColorStyle } from "@/lib/panelTheme";
import { DevLivesConfigCard } from "@/components/dev/DevLivesConfigCard";
import { reportAppError } from "@/lib/app-error-reporting";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useUrlTab } from "@/hooks/useUrlTab";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import {
  getDevConfiguration,
  saveDevConfiguration,
  DEFAULT_DEV_CONFIG,
  type DevConfiguration,
} from "@/services/devService";
import { DevForcePurgeCard } from "@/components/dev/DevForcePurgeCard";
import { DevBotManageCard } from "@/components/dev/DevBotManageCard";
import { DevDiscordConfigCard } from "@/components/dev/DevDiscordConfigCard";
import { DevWebhooksConfigCard } from "@/components/dev/DevWebhooksConfigCard";
import { DevAuditLogModal } from "@/components/dev/DevAuditLogModal";
import { useAuditLogs } from "@/hooks/useData";
import { logAuditAction } from "@/lib/app-api";
import { humanizeAuditLog } from "@/lib/format";

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

  // Sincronização da aba ativa com a URL (?tab=bot-manage | webhooks | discord-logs | lives | general)
  const [activeTab, setActiveTab] = useUrlTab<
    "bot-manage" | "webhooks" | "discord-logs" | "lives" | "general"
  >("bot-manage", {
    paramName: "tab",
    allowedTabs: ["bot-manage", "webhooks", "discord-logs", "lives", "general"],
  });

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

  // Handler para salvar as alterações
  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    setError(null);

    try {
      await saveDevConfiguration(config, user, profile, level);
      setInitialConfig(JSON.parse(JSON.stringify(config)));
      toast.success("Configurações do Módulo Dev salvas com sucesso!", {
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
    setConfig(JSON.parse(JSON.stringify(DEFAULT_DEV_CONFIG)));
    toast.info("Configurações restauradas para os padrões dev.");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Dev → Configuração"
          description="Ajustes exclusivos para usuários com a tag desenvolvedor, controle de recursos experimentais e ambiente de desenvolvimento."
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
            disabled={!hasChanges || saving || loading}
            className="h-9 text-xs gap-1.5 font-extrabold bg-gradient-brand text-primary-foreground shadow-md hover:opacity-90 transition-all"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {/* Alert de alterações pendentes */}
      {hasChanges && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-400 text-xs font-semibold shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Existem alterações nas configurações Dev pendentes de salvar.</span>
          </div>
          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400 font-mono">
            Pendente de Salvar
          </Badge>
        </div>
      )}

      {/* Banner de Apresentação Módulo Dev */}
      <Card className="surface-card border-rose-500/30 bg-rose-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  Configurações Exclusivas para Desenvolvedores
                  <Badge variant="outline" className="text-[9px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10">
                    Dev System Only
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Ajustes internos destinados exclusivamente para usuários com a tag desenvolvedor. Esta estrutura é extensível para novas opções futuras.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* CARDS DE CONFIGURAÇÕES EXTENSÍVEIS */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Carregando configurações Dev...</p>
          </div>
        </div>
      ) : error ? (
        <Card className="surface-card p-8 text-center space-y-2">
          <XCircle className="mx-auto h-8 w-8 text-rose-500" />
          <p className="text-sm font-bold text-rose-400">{error}</p>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 max-w-5xl bg-secondary/40 p-1 rounded-xl border border-border/60 gap-1">
            <TabsTrigger value="bot-manage" className="text-xs font-bold gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Bot className="h-4 w-4" />
              Gerenciar Bot
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="text-xs font-bold gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              <Webhook className="h-4 w-4" />
              Webhooks Discord
            </TabsTrigger>
            <TabsTrigger value="discord-logs" className="text-xs font-bold gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
              <Hash className="h-4 w-4" />
              Canais & Logs
            </TabsTrigger>
            <TabsTrigger value="lives" className="text-xs font-bold gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-red-600 data-[state=active]:text-white">
              <Radio className="h-4 w-4" />
              Integração Lives
            </TabsTrigger>
            <TabsTrigger value="general" className="text-xs font-bold gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-zinc-700 data-[state=active]:to-zinc-800 data-[state=active]:text-white">
              <Settings className="h-4 w-4" />
              Ajustes Gerais Dev
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GERENCIAR BOT DISCORD */}
          <TabsContent value="bot-manage" className="space-y-6 animate-in fade-in-50 duration-300">
            <DevBotManageCard />
          </TabsContent>

          {/* TAB 2: WEBHOOKS DISCORD */}
          <TabsContent value="webhooks" className="space-y-6 animate-in fade-in-50 duration-300">
            <DevWebhooksConfigCard />
          </TabsContent>

          {/* TAB 3: CANAIS & LOGS DO BOT */}
          <TabsContent value="discord-logs" className="space-y-6 animate-in fade-in-50 duration-300">
            <DevDiscordConfigCard />
          </TabsContent>

          {/* TAB 4: INTEGRAÇÃO LIVES */}
          <TabsContent value="lives" className="space-y-6 animate-in fade-in-50 duration-300">
            <DevLivesConfigCard />
          </TabsContent>

          {/* TAB 4: AJUSTES GERAIS DEV */}
          <TabsContent value="general" className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Card de Limpeza Forçada de Cache em Tempo Real */}
            <DevForcePurgeCard />

            {/* Card de Cores Padrão dos Painéis Dev & CEO */}
            <Card className="surface-card border transition-all duration-300">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Palette className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-extrabold text-foreground">
                        Cores Padrão dos Painéis Dev & CEO
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Configure a cor temática oficial dos menus, categorias e ícones de cada painel.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                    Identidade Visual
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Seletor 1: Cor do Painel Dev */}
                  <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-rose-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-foreground">
                          Cor Padrão do Painel Dev
                        </span>
                      </div>
                      <Badge className={getPanelColorStyle(config.devThemeColor, "rose").badgeClass}>
                        {getPanelColorStyle(config.devThemeColor, "rose").label}
                      </Badge>
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground">
                      Define a cor padrão aplicada a todas as categorias, ícones e itens do menu lateral em modo Desenvolvedor.
                    </p>

                    {/* Paleta de Cores Dev */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(Object.keys(PANEL_COLOR_STYLES) as PanelColor[]).map((cKey) => {
                        const style = PANEL_COLOR_STYLES[cKey];
                        const isSelected = (config.devThemeColor || "rose") === cKey;

                        return (
                          <button
                            key={`dev-color-${cKey}`}
                            type="button"
                            onClick={() => {
                              setConfig((prev) => ({ ...prev, devThemeColor: cKey }));
                            }}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer",
                              isSelected
                                ? cn(style.borderClass, style.bgSubtleClass, "ring-2", style.ringClass, "shadow-sm")
                                : "border-border/60 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span
                              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs border border-white/20"
                              style={{ backgroundColor: style.hex }}
                            />
                            <span className="truncate text-[11px]">{style.label.split(" ")[0]}</span>
                            {isSelected && <Check className="h-3 w-3 ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Preview Rápido Dev */}
                    <div className={cn("p-3 rounded-xl border text-xs space-y-2", getPanelColorStyle(config.devThemeColor, "rose").borderSubtleClass, getPanelColorStyle(config.devThemeColor, "rose").bgSubtleClass)}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={cn("font-bold flex items-center gap-1.5", getPanelColorStyle(config.devThemeColor, "rose").textClass)}>
                          <Terminal className="h-3.5 w-3.5" />
                          Prévia da Categoria Dev
                        </span>
                        <Badge className={getPanelColorStyle(config.devThemeColor, "rose").badgeClass}>
                          Dev Active
                        </Badge>
                      </div>
                      <div className={cn("px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px]", getPanelColorStyle(config.devThemeColor, "rose").activeItemClass)}>
                        <Code2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Item Ativo de Menu Dev</span>
                      </div>
                    </div>
                  </div>

                  {/* Seletor 2: Cor do Painel CEO */}
                  <div className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-foreground">
                          Cor Padrão do Painel CEO
                        </span>
                      </div>
                      <Badge className={getPanelColorStyle(config.ceoThemeColor, "amber").badgeClass}>
                        {getPanelColorStyle(config.ceoThemeColor, "amber").label}
                      </Badge>
                    </div>
                    <p className="text-[0.7rem] text-muted-foreground">
                      Define a cor padrão aplicada a todas as categorias, ícones e itens do menu lateral em modo Executivo CEO.
                    </p>

                    {/* Paleta de Cores CEO */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(Object.keys(PANEL_COLOR_STYLES) as PanelColor[]).map((cKey) => {
                        const style = PANEL_COLOR_STYLES[cKey];
                        const isSelected = (config.ceoThemeColor || "amber") === cKey;

                        return (
                          <button
                            key={`ceo-color-${cKey}`}
                            type="button"
                            onClick={() => {
                              setConfig((prev) => ({ ...prev, ceoThemeColor: cKey }));
                            }}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer",
                              isSelected
                                ? cn(style.borderClass, style.bgSubtleClass, "ring-2", style.ringClass, "shadow-sm")
                                : "border-border/60 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span
                              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs border border-white/20"
                              style={{ backgroundColor: style.hex }}
                            />
                            <span className="truncate text-[11px]">{style.label.split(" ")[0]}</span>
                            {isSelected && <Check className="h-3 w-3 ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Preview Rápido CEO */}
                    <div className={cn("p-3 rounded-xl border text-xs space-y-2", getPanelColorStyle(config.ceoThemeColor, "amber").borderSubtleClass, getPanelColorStyle(config.ceoThemeColor, "amber").bgSubtleClass)}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={cn("font-bold flex items-center gap-1.5", getPanelColorStyle(config.ceoThemeColor, "amber").textClass)}>
                          <Crown className="h-3.5 w-3.5" />
                          Prévia da Categoria CEO
                        </span>
                        <Badge className={getPanelColorStyle(config.ceoThemeColor, "amber").badgeClass}>
                          CEO Active
                        </Badge>
                      </div>
                      <div className={cn("px-3 py-1.5 rounded-lg flex items-center gap-2 text-[11px]", getPanelColorStyle(config.ceoThemeColor, "amber").activeItemClass)}>
                        <Crown className="h-3.5 w-3.5 shrink-0" />
                        <span>Item Ativo de Menu CEO</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

              {/* Option 2: Dev Audit Logs */}
              <Card className="surface-card border transition-all duration-300 hover:border-purple-500/30">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Terminal className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-extrabold text-foreground">Auditoria de Ações Dev</CardTitle>
                          <Badge variant="outline" className="text-[10px] font-mono border-purple-500/40 text-purple-400 py-0 h-4">
                            {devLogs.length} logs
                          </Badge>
                        </div>
                        <CardDescription className="text-[0.7rem]">Rastreamento e histórico de alterações</CardDescription>
                      </div>
                    </div>

                    {/* Live Status Badge */}
                    <div>
                      {config.devAuditLogs ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono gap-1.5 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          GRAVANDO NO SERVIDOR
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-mono gap-1.5 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          SUPRIMIDO (SILENCIOSO)
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {/* Switch Principal */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40 hover:border-primary/30 transition-all">
                    <div className="space-y-0.5">
                      <Label htmlFor="devAuditLogs" className="text-xs font-bold text-foreground cursor-pointer block">
                        Registrar Ações Dev no Servidor
                      </Label>
                      <p className="text-[0.65rem] text-muted-foreground">
                        Armazena em log de auditoria todas as alterações e disparos efetuados no painel ou por usuários com tag dev.
                      </p>
                    </div>
                    <Switch
                      id="devAuditLogs"
                      checked={config.devAuditLogs}
                      onCheckedChange={() => handleToggle("devAuditLogs")}
                    />
                  </div>

                  {/* Barra de Ações & Validação */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                    <span className="text-[0.7rem] text-muted-foreground">
                      Validação e Histórico Dev:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold gap-1.5 border-purple-500/30 hover:border-purple-500/60 text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 h-7"
                        onClick={handleTriggerTestLog}
                        disabled={triggeringTestLog}
                      >
                        {triggeringTestLog ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        Disparar Log Dev de Teste
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold gap-1.5 border-border hover:border-purple-500/40 text-foreground h-7"
                        onClick={() => setAuditModalOpen(true)}
                      >
                        <Eye className="h-3 w-3 text-purple-400" />
                        Inspecionar Histórico ({devLogs.length})
                      </Button>

                      <Link to="/logs" search={{ module: "dev" } as any}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs gap-1 text-muted-foreground hover:text-foreground h-7 px-2"
                          title="Abrir página geral de logs filtrada pelo módulo dev"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Central de Logs
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Mini-feed inline dos últimos logs dev */}
                  <div className="p-3 rounded-xl bg-black/40 border border-purple-500/20 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-purple-400 font-bold uppercase flex items-center gap-1.5">
                        <Terminal className="h-3 w-3" />
                        Últimos Registros Dev Gravados
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {devLogs.length} total
                      </span>
                    </div>

                    {devLogs.length === 0 ? (
                      <div className="py-2.5 px-2 text-center text-[11px] text-muted-foreground italic">
                        Nenhum registro dev encontrado no momento. Clique em "Disparar Log Dev de Teste" acima para validar.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {devLogs.slice(0, 3).map((l) => {
                          const human = humanizeAuditLog(l);
                          const timeStr = new Date(l.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          });

                          return (
                            <div
                              key={l.id}
                              onClick={() => setAuditModalOpen(true)}
                              className="p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/40 hover:border-purple-500/30 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                                  {timeStr}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] py-0 h-4 uppercase font-bold shrink-0 ${human.tagColor}`}
                                >
                                  {human.tag}
                                </Badge>
                                <span className="text-[11px] font-medium text-foreground truncate group-hover:text-purple-300 transition-colors">
                                  {human.title}
                                </span>
                              </div>
                              <Eye className="h-3 w-3 text-muted-foreground group-hover:text-purple-400 shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Option 3: Dev System Notifications */}
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
          </TabsContent>
        </Tabs>
      )}

      {/* Modal de Auditoria e Inspeção de Logs Dev */}
      <DevAuditLogModal
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        isAuditActive={config.devAuditLogs}
        onTriggerTestLog={handleTriggerTestLog}
        triggeringTest={triggeringTestLog}
      />
    </div>
  );
}
