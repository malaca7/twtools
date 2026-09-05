import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import {
  getDevConfiguration,
  saveDevConfiguration,
  DEFAULT_DEV_CONFIG,
  type DevConfiguration,
} from "@/services/devService";
import { DevForcePurgeCard } from "@/components/dev/DevForcePurgeCard";
import { DevDiscordConfigCard } from "@/components/dev/DevDiscordConfigCard";

export const Route = createFileRoute("/_authenticated/dev/configuracao")({
  component: DevConfiguracaoPageWrapper,
});

function DevConfiguracaoPageWrapper() {
  return (
    <DeveloperGuard>
      <DevConfiguracaoContent />
    </DeveloperGuard>
  );
}

function DevConfiguracaoContent() {
  const { user, profile, level } = useAuth();

  const [config, setConfig] = useState<DevConfiguration>(DEFAULT_DEV_CONFIG);
  const [initialConfig, setInitialConfig] = useState<DevConfiguration>(DEFAULT_DEV_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Tabs defaultValue="discord" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-secondary/40 p-1 rounded-xl border border-border/60">
            <TabsTrigger value="discord" className="text-xs font-bold gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Bot className="h-4 w-4" />
              Discord & Bot de Logs
            </TabsTrigger>
            <TabsTrigger value="general" className="text-xs font-bold gap-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
              <Settings className="h-4 w-4" />
              Ajustes Gerais Dev
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DISCORD & BOT DE LOGS */}
          <TabsContent value="discord" className="space-y-6 animate-in fade-in-50 duration-300">
            <DevDiscordConfigCard />
          </TabsContent>

          {/* TAB 2: AJUSTES GERAIS DEV */}
          <TabsContent value="general" className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Card de Limpeza Forçada de Cache em Tempo Real */}
            <DevForcePurgeCard />

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
              <Card className="surface-card border transition-all duration-300">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Terminal className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-extrabold text-foreground">Auditoria de Ações Dev</CardTitle>
                      <CardDescription className="text-[0.7rem]">Rastreamento e histórico de alterações</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40 hover:border-primary/30 transition-all">
                    <div className="space-y-0.5">
                      <Label htmlFor="devAuditLogs" className="text-xs font-bold text-foreground cursor-pointer block">
                        Registrar Ações Dev no Servidor
                      </Label>
                      <p className="text-[0.65rem] text-muted-foreground">
                        Armazena em log de auditoria todas as alterações efetuadas por usuários com tag dev.
                      </p>
                    </div>
                    <Switch
                      id="devAuditLogs"
                      checked={config.devAuditLogs}
                      onCheckedChange={() => handleToggle("devAuditLogs")}
                    />
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
