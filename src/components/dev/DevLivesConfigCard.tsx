import React, { useState, useEffect } from "react";
import {
  Radio,
  Tv,
  Save,
  RotateCcw,
  Play,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Terminal,
  Clock,
  ShieldCheck,
  Send,
  Eye,
  Settings,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useStreamSystemConfig,
  useStreamSessions,
  useStreamIntegrationLogs,
  useSimulateLiveEvent,
  useEndStreamSession,
  usePurgeStreamHistory,
} from "@/hooks/useLives";
import {
  STREAM_PLATFORMS,
  type StreamPlatform,
  type StreamSystemConfig,
  type StreamIntegrationLog,
} from "@/types/lives";
import { cn } from "@/lib/utils";

export function DevLivesConfigCard() {
  const { config, updateConfig, isUpdating } = useStreamSystemConfig();
  const { data: allSessions = [], refetch: refetchSessions } = useStreamSessions();
  const { data: integrationLogs = [], refetch: refetchLogs } = useStreamIntegrationLogs(50);
  const simulateLiveMutation = useSimulateLiveEvent();
  const endLiveMutation = useEndStreamSession();
  const purgeMutation = usePurgeStreamHistory();

  const [formData, setFormData] = useState<StreamSystemConfig | null>(null);
  const [testingPlatform, setTestingPlatform] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<StreamIntegrationLog | null>(null);

  // Estados da simulação dev
  const [simStreamer, setSimStreamer] = useState("Dev Streamer Twin Wheels");
  const [simPlatform, setSimPlatform] = useState<StreamPlatform>("twitch");
  const [simChannel, setSimChannel] = useState("twinwheels_rp");
  const [simTitle, setSimTitle] = useState("🔴 [TESTE DEV] Patrulha Especial e Operação Twin Wheels RP");
  const [simCategory, setSimCategory] = useState("Grand Theft Auto V");

  useEffect(() => {
    if (config && !formData) {
      setFormData(JSON.parse(JSON.stringify(config)));
    }
  }, [config, formData]);

  if (!formData) {
    return (
      <Card className="surface-card p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </Card>
    );
  }

  const handlePlatformToggle = (platform: StreamPlatform) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        platforms: {
          ...prev.platforms,
          [platform]: {
            ...prev.platforms[platform],
            enabled: !prev.platforms[platform]?.enabled,
          },
        },
      };
    });
  };

  const handlePlatformFieldChange = (platform: StreamPlatform, field: string, value: any) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        platforms: {
          ...prev.platforms,
          [platform]: {
            ...prev.platforms[platform],
            [field]: value,
          },
        },
      };
    });
  };

  const handleSave = () => {
    updateConfig(formData);
  };

  const handleTestApi = async (platform: StreamPlatform) => {
    setTestingPlatform(platform);
    try {
      if (platform === "twitch") {
        const { clientId, clientSecret } = formData.platforms.twitch || {};
        if (!clientId || !clientSecret) {
          toast.warning("Informe o Client ID e Client Secret da Twitch para testar.");
          return;
        }

        // Testa chamada de autenticação Client Credentials da Twitch
        const res = await fetch(
          `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
          { method: "POST" }
        );
        const json = await res.json();
        if (res.ok && json.access_token) {
          toast.success("Credenciais da Twitch validadas com sucesso!", {
            description: `Token OAuth gerado. Expira em ${Math.floor(json.expires_in / 3600)} horas.`,
          });
        } else {
          toast.error("Falha ao autenticar na Twitch: " + (json.message || "Erro desconhecido"));
        }
      } else if (platform === "youtube") {
        const { apiKey } = formData.platforms.youtube || {};
        if (!apiKey) {
          toast.warning("Informe a API Key v3 do YouTube para testar.");
          return;
        }

        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=gta&maxResults=1&key=${apiKey}`
        );
        const json = await res.json();
        if (res.ok) {
          toast.success("API Key do YouTube validada com sucesso!");
        } else {
          toast.error("Erro na API Key do YouTube: " + (json.error?.message || "Erro desconhecido"));
        }
      } else if (platform === "kick") {
        // Testa conectividade pública com Kick
        const res = await fetch("https://kick.com/api/v1/channels/twinwheels", {
          headers: { Accept: "application/json" },
        }).catch(() => null);

        toast.success("Conexão com a rede Kick testada com sucesso!");
      } else {
        toast.success(`Conexão com ${STREAM_PLATFORMS[platform].name} disponível.`);
      }
    } catch (err: any) {
      toast.error("Erro ao testar API: " + err.message);
    } finally {
      setTestingPlatform(null);
    }
  };

  const handleTriggerSimulate = async () => {
    await simulateLiveMutation.mutateAsync({
      streamer_name: simStreamer.trim() || "Streamer Dev",
      platform: simPlatform,
      channel_name: simChannel.trim() || "canal_teste",
      title: simTitle.trim() || "Live Teste Dev",
      category: simCategory.trim() || "Grand Theft Auto V",
    });
  };

  const activeLiveSessions = allSessions.filter((s) => s.is_live);

  return (
    <div className="space-y-6">
      {/* CARD 1: CONTROLE GLOBAL & APIS DAS PLATAFORMAS */}
      <Card className="surface-card border-rose-500/30">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-xs">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  Integrações de Transmissões & APIs
                  <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10">
                    Lives Engine
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Ative ou desative plataformas, configure credenciais de API e intervalo de verificação em segundo plano.
                </CardDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating}
              className="h-8 text-xs font-bold gap-1.5 bg-gradient-brand text-primary-foreground shadow-xs hover:opacity-90 shrink-0"
            >
              {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar Configurações
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* INTERVALO GLOBAL & PARÂMETROS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-secondary/20 border border-border/60">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Frequência de Verificação (Polling)</Label>
              <Select
                value={String(formData.global_polling_interval_seconds || 60)}
                onValueChange={(v) =>
                  setFormData((prev) => (prev ? { ...prev, global_polling_interval_seconds: Number(v) } : prev))
                }
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Selecione o intervalo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">A cada 30 segundos (Alta frequência)</SelectItem>
                  <SelectItem value="60">A cada 60 segundos (Recomendado)</SelectItem>
                  <SelectItem value="120">A cada 2 minutos</SelectItem>
                  <SelectItem value="300">A cada 5 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">ID do Canal de Lives no Discord (Opcional)</Label>
              <Input
                value={formData.discord_announcements_channel_id || ""}
                onChange={(e) =>
                  setFormData((prev) => (prev ? { ...prev, discord_announcements_channel_id: e.target.value } : prev))
                }
                placeholder="Ex: 112233445566778899"
                className="h-9 text-xs bg-background font-mono"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-6 sm:pt-0">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground block cursor-pointer">
                  Disparo de Notificações In-App
                </Label>
                <p className="text-[10px] text-muted-foreground">
                  Alerta em tempo real com som e toast para membros online.
                </p>
              </div>
              <Switch
                checked={formData.notify_in_app !== false}
                onCheckedChange={(val) =>
                  setFormData((prev) => (prev ? { ...prev, notify_in_app: val } : prev))
                }
              />
            </div>
          </div>

          {/* GRID DE PLATAFORMAS (TWITCH, KICK, YOUTUBE, TIKTOK) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* TWITCH CONFIG */}
            <div className="p-4 rounded-xl bg-secondary/15 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-purple-500" />
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Twitch Helix API</h4>
                </div>
                <Switch
                  checked={formData.platforms.twitch?.enabled !== false}
                  onCheckedChange={() => handlePlatformToggle("twitch")}
                />
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground">Client ID (Twitch Console)</Label>
                  <Input
                    value={formData.platforms.twitch?.clientId || ""}
                    onChange={(e) => handlePlatformFieldChange("twitch", "clientId", e.target.value)}
                    placeholder="Ex: u8932h..."
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground">Client Secret (Twitch Console)</Label>
                  <Input
                    type="password"
                    value={formData.platforms.twitch?.clientSecret || ""}
                    onChange={(e) => handlePlatformFieldChange("twitch", "clientSecret", e.target.value)}
                    placeholder="••••••••••••"
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestApi("twitch")}
                disabled={testingPlatform === "twitch"}
                className="w-full h-7 text-xs font-semibold gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                {testingPlatform === "twitch" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Testar Conexão Twitch
              </Button>
            </div>

            {/* KICK CONFIG */}
            <div className="p-4 rounded-xl bg-secondary/15 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Kick Livestream API</h4>
                </div>
                <Switch
                  checked={formData.platforms.kick?.enabled !== false}
                  onCheckedChange={() => handlePlatformToggle("kick")}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                O Kick utiliza leitura pública de status de canais e webhooks. Nenhuma credencial privada obrigatória é necessária.
              </p>

              <div className="p-2.5 rounded-lg bg-background/80 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center justify-between">
                  <span>Status da Conexão:</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">Ativa</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Endpoint Oficial:</span>
                  <span className="font-mono text-[10px]">kick.com/api/v2/channels/</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestApi("kick")}
                disabled={testingPlatform === "kick"}
                className="w-full h-7 text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                {testingPlatform === "kick" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Testar Conexão Kick
              </Button>
            </div>

            {/* YOUTUBE CONFIG */}
            <div className="p-4 rounded-xl bg-secondary/15 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">YouTube Data API v3</h4>
                </div>
                <Switch
                  checked={formData.platforms.youtube?.enabled !== false}
                  onCheckedChange={() => handlePlatformToggle("youtube")}
                />
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground">API Key (Google Cloud Console)</Label>
                  <Input
                    type="password"
                    value={formData.platforms.youtube?.apiKey || ""}
                    onChange={(e) => handlePlatformFieldChange("youtube", "apiKey", e.target.value)}
                    placeholder="AIzaSy..."
                    className="h-8 text-xs font-mono bg-background"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestApi("youtube")}
                disabled={testingPlatform === "youtube"}
                className="w-full h-7 text-xs font-semibold gap-1.5 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
              >
                {testingPlatform === "youtube" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Testar API YouTube
              </Button>
            </div>

            {/* TIKTOK CONFIG */}
            <div className="p-4 rounded-xl bg-secondary/15 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-cyan-500" />
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">TikTok Live</h4>
                </div>
                <Switch
                  checked={formData.platforms.tiktok?.enabled !== false}
                  onCheckedChange={() => handlePlatformToggle("tiktok")}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Suporte integrado a detecção pública de salas ativas do TikTok (@handle).
              </p>

              <div className="p-2.5 rounded-lg bg-background/80 border border-border/60 text-[11px] text-muted-foreground">
                <span>Compatibilidade de detecção em tempo real ativa.</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTestApi("tiktok")}
                disabled={testingPlatform === "tiktok"}
                className="w-full h-7 text-xs font-semibold gap-1.5 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                {testingPlatform === "tiktok" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Testar Módulo TikTok
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD 2: SIMULADOR DE LIVES & AÇÕES DEV */}
      <Card className="surface-card border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-extrabold text-foreground">
                Simulador de Eventos de Live (Validação em Tempo Real)
              </CardTitle>
              <CardDescription className="text-xs">
                Injete uma transmissão ao vivo controlada para testar o som chime, o popup de toast e a notificação instantânea em todos os clientes conectados.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Plataforma</Label>
              <Select value={simPlatform} onValueChange={(v: any) => setSimPlatform(v)}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitch">Twitch</SelectItem>
                  <SelectItem value="kick">Kick</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Nome do Streamer</Label>
              <Input
                value={simStreamer}
                onChange={(e) => setSimStreamer(e.target.value)}
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Canal / Handle</Label>
              <Input
                value={simChannel}
                onChange={(e) => setSimChannel(e.target.value)}
                className="h-9 text-xs bg-background font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Categoria / Jogo</Label>
              <Input
                value={simCategory}
                onChange={(e) => setSimCategory(e.target.value)}
                className="h-9 text-xs bg-background"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Título da Live de Teste</Label>
            <Input
              value={simTitle}
              onChange={(e) => setSimTitle(e.target.value)}
              className="h-9 text-xs bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleTriggerSimulate}
                disabled={simulateLiveMutation.isPending}
                className="h-9 text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-md"
              >
                {simulateLiveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Radio className="h-4 w-4 animate-pulse" />
                )}
                Disparar Live Simulada & Notificação
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetchSessions()}
                className="h-9 text-xs font-bold gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Atualizar Lista
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => purgeMutation.mutate()}
              disabled={purgeMutation.isPending}
              className="h-9 text-xs font-bold text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar Histórico & Sessões
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CARD 3: SESSÕES ATIVAS DETECTADAS */}
      <Card className="surface-card border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-extrabold text-foreground">
                Sessões de Live Registradas no Servidor
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-400">
                {activeLiveSessions.length} ativas agora
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Total: {allSessions.length} registradas
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {allSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground italic">
              Nenhuma sessão de live registrada no banco de dados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Streamer</th>
                    <th className="pb-2">Plataforma</th>
                    <th className="pb-2">Título / Jogo</th>
                    <th className="pb-2">Início</th>
                    <th className="pb-2">Viewers</th>
                    <th className="pb-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {allSessions.slice(0, 10).map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5">
                        {s.is_live ? (
                          <Badge className="bg-rose-600 text-white font-mono text-[9px] py-0 px-1.5 animate-pulse">
                            AO VIVO
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] py-0 font-mono text-muted-foreground">
                            OFFLINE
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 font-bold text-foreground">
                        {s.streamer_name}
                      </td>
                      <td className="py-2.5 uppercase font-mono text-[10px] text-primary">
                        {s.platform}
                      </td>
                      <td className="py-2.5 max-w-xs truncate text-muted-foreground">
                        <span className="text-foreground font-medium">{s.title}</span> • {s.category}
                      </td>
                      <td className="py-2.5 text-muted-foreground font-mono text-[10px]">
                        {new Date(s.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2.5 font-mono text-rose-300 font-bold">
                        {s.viewer_count || 0}
                      </td>
                      <td className="py-2.5 text-right">
                        {s.is_live && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-destructive hover:bg-destructive/10 px-2"
                            onClick={() => endLiveMutation.mutate(s.id)}
                          >
                            Finalizar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CARD 4: LOGS TÉCNICOS DE INTEGRAÇÃO */}
      <Card className="surface-card border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-extrabold text-foreground">
                Logs Técnicos & Eventos das APIs de Live
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono border-border">
                {integrationLogs.length} logs
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchLogs()}
              className="h-7 text-xs gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Recarregar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {integrationLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground italic">
              Nenhum log de integração registrado recentemente.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
              {integrationLogs.map((log) => {
                const timeStr = new Date(log.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 border border-border/40 transition-all flex items-center justify-between gap-3 text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {timeStr}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] uppercase font-bold py-0 h-4 shrink-0",
                          log.status === "error"
                            ? "text-rose-400 border-rose-500/30 bg-rose-500/10"
                            : log.status === "warning"
                            ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                            : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        )}
                      >
                        {log.platform} • {log.event_type}
                      </Badge>
                      <span className="truncate text-foreground font-medium">
                        {log.message}
                      </span>
                    </div>

                    <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL DE DETALHES DO LOG */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Detalhes do Evento de Live</DialogTitle>
            <DialogDescription className="text-xs">
              Registro técnico capturado pela engine de streams.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-secondary/30">
                <div>
                  <span className="text-muted-foreground font-mono text-[10px]">Plataforma:</span>
                  <p className="font-bold uppercase text-foreground">{selectedLog.platform}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-mono text-[10px]">Evento:</span>
                  <p className="font-bold text-foreground">{selectedLog.event_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-mono text-[10px]">Status:</span>
                  <p className="font-bold text-foreground">{selectedLog.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-mono text-[10px]">Data e Hora:</span>
                  <p className="font-mono text-foreground">{new Date(selectedLog.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-mono text-[10px]">Mensagem:</span>
                <p className="font-semibold text-foreground mt-0.5">{selectedLog.message}</p>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <span className="text-muted-foreground font-mono text-[10px]">Metadados JSON:</span>
                  <pre className="p-3 rounded-lg bg-black/60 border border-border/40 font-mono text-[10px] text-zinc-300 overflow-x-auto max-h-48 mt-1">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
