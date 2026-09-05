import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Bot,
  Hash,
  Sparkles,
  Server,
  Send,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Palette,
  BellRing,
  Globe,
  Radio,
  Loader2,
  RotateCcw,
  Save,
  Package,
  DollarSign,
  Landmark,
  Users,
  Target,
  Megaphone,
  Terminal,
  HelpCircle,
  UploadCloud,
  Link as LinkIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_DISCORD_CONFIG,
  getDiscordBotConfig,
  saveDiscordBotConfig,
  triggerDiscordBotTestEmbed,
  type DiscordBotConfig,
  type DiscordLogChannels,
  type DiscordEnabledEvents,
  type DiscordEmbedColors,
} from "@/services/discordService";

export function DevDiscordConfigCard() {
  const { user, profile, level } = useAuth();

  const [config, setConfig] = useState<DiscordBotConfig>(DEFAULT_DISCORD_CONFIG);
  const [initialConfig, setInitialConfig] = useState<DiscordBotConfig>(DEFAULT_DISCORD_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState("channels");

  // Estados para Teste de Envio pelo Bot
  const [testCategory, setTestCategory] = useState<keyof DiscordLogChannels>("generalLogsChannelId");
  const [customTestChannelId, setCustomTestChannelId] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Estados para Preview ao Vivo
  const [previewCategory, setPreviewCategory] = useState<"venda" | "movimentacao" | "membro" | "caixa" | "purga">("venda");

  // Carrega a configuração inicial
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getDiscordBotConfig()
      .then((data) => {
        if (isMounted) {
          setConfig(data);
          setInitialConfig(JSON.parse(JSON.stringify(data)));
        }
      })
      .catch((err) => {
        if (isMounted) {
          toast.error("Falha ao carregar configurações do Discord: " + (err?.message || err));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sincroniza o ID de teste com o canal selecionado
  useEffect(() => {
    const currentId = config.logChannels[testCategory] || config.logChannels.generalLogsChannelId || "";
    setCustomTestChannelId(currentId);
  }, [testCategory, config.logChannels]);

  // Detecta se existem alterações pendentes
  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(initialConfig);
  }, [config, initialConfig]);

  // Atualiza campo do config raiz
  const handleRootChange = <K extends keyof DiscordBotConfig>(key: K, value: DiscordBotConfig[K]) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Estados e handler para upload de imagens (Bot Avatar e Footer Icon)
  const [uploadingBotAvatar, setUploadingBotAvatar] = useState(false);
  const [uploadingFooterIcon, setUploadingFooterIcon] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [showManualUrlInput, setShowManualUrlInput] = useState(false);
  const botAvatarInputRef = useRef<HTMLInputElement>(null);
  const footerIconInputRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = async (file: File, targetField: "botAvatarUrl" | "footerIconUrl") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("O tamanho da imagem não pode ultrapassar 8MB.");
      return;
    }

    const setUploading = targetField === "botAvatarUrl" ? setUploadingBotAvatar : setUploadingFooterIcon;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const cleanExt = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext) ? ext : "png";
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
      const fileName = `bot-avatar/${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage.from("products").upload(fileName, file, {
        cacheControl: "31536000",
        upsert: true,
        contentType: file.type || `image/${cleanExt}`,
      });

      if (error) {
        throw new Error(error.message);
      }

      const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(data.path);
      const publicUrl = publicUrlData.publicUrl;

      handleRootChange(targetField, publicUrl);
      toast.success(
        targetField === "botAvatarUrl"
          ? "Imagem do Bot carregada com sucesso!"
          : "Ícone do rodapé carregado com sucesso!"
      );
    } catch (err: any) {
      toast.error(`Falha ao fazer upload da imagem: ${err?.message || "Erro desconhecido"}`);
    } finally {
      setUploading(false);
    }
  };

  // Atualiza canal individual
  const handleChannelChange = (channelKey: keyof DiscordLogChannels, value: string) => {
    setConfig((prev) => ({
      ...prev,
      logChannels: {
        ...prev.logChannels,
        [channelKey]: value.trim(),
      },
    }));
  };

  // Atualiza evento toggle
  const handleEventToggle = (eventKey: keyof DiscordEnabledEvents) => {
    setConfig((prev) => ({
      ...prev,
      enabledEvents: {
        ...prev.enabledEvents,
        [eventKey]: !prev.enabledEvents[eventKey],
      },
    }));
  };

  // Atualiza cor do embed
  const handleColorChange = (colorKey: keyof DiscordEmbedColors, hex: string) => {
    setConfig((prev) => ({
      ...prev,
      embedColors: {
        ...prev.embedColors,
        [colorKey]: hex,
      },
    }));
  };

  // Salva no banco de dados Supabase
  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);

    try {
      await saveDiscordBotConfig(config, user, profile, level);
      setInitialConfig(JSON.parse(JSON.stringify(config)));
      toast.success("Configurações do Discord salvas e sincronizadas com o Bot com sucesso!", {
        icon: "🤖",
      });
    } catch (err: any) {
      toast.error(err?.message || "Falha ao salvar configurações do Discord.");
    } finally {
      setSaving(false);
    }
  };

  // Restaura os padrões
  const handleResetDefaults = () => {
    setConfig(JSON.parse(JSON.stringify(DEFAULT_DISCORD_CONFIG)));
    toast.info("Configurações do Discord restauradas para os padrões recomendados.");
  };

  // Dispara teste de envio pelo bot (sem webhook)
  const handleSendTest = async () => {
    const targetChannelId = customTestChannelId.trim() || (config.logChannels[testCategory] as string) || config.logChannels.generalLogsChannelId || "";

    if (!targetChannelId) {
      toast.error("Informe um ID de Canal do Discord válido para realizar o teste.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const categoryNames: Record<string, string> = {
      generalLogsChannelId: "Geral de Logs",
      stockMovementsChannelId: "Estoque & Movimentações",
      salesChannelId: "Vendas & Lucros",
      cashFundChannelId: "Fundo de Caixa",
      membersChannelId: "Gestão de Membros",
      goalsChannelId: "Metas da Facção",
      announcementsChannelId: "Avisos & Comunicados",
      systemChannelId: "Sistema & Auditoria",
    };

    const label = categoryNames[testCategory as string] || "Logs Gerais";

    try {
      const res = await triggerDiscordBotTestEmbed(
        testCategory,
        label,
        targetChannelId,
        profile?.nickname || profile?.nome || "Desenvolvedor",
        user,
        profile,
        level
      );
      setTestResult(res);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || String(err) });
      toast.error("Erro no teste de envio.");
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <Card className="surface-card border p-12 text-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-xs text-muted-foreground font-medium">Carregando configurações do Discord & Bot...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER CARD COM STATUS GERAL */}
      <Card className="surface-card border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-background to-purple-950/20 shadow-xl overflow-hidden relative">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="pb-4 border-b border-border/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-inner">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base font-black text-foreground tracking-tight">
                    Integração Discord & Bot de Logs
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 ${
                      config.enabled
                        ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                        : "border-rose-500/40 text-rose-400 bg-rose-500/10"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.enabled ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                    {config.enabled ? "Bot & Logs Ativos" : "Transmissão Pausada"}
                  </Badge>
                  <Badge variant="outline" className="text-[0.65rem] border-indigo-500/40 text-indigo-300 bg-indigo-500/10 font-mono">
                    100% Bot Direto (Sem Webhooks)
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1 text-muted-foreground">
                  Envio automático de logs em tempo real através do Bot do Discord configurando apenas os IDs dos canais e do servidor.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDefaults}
                disabled={saving}
                className="h-9 text-xs gap-1.5 font-bold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Padrões
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="h-9 text-xs gap-1.5 font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Sincronizando..." : "Salvar Configuração"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Radio className="h-4 w-4 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="discord-enabled-toggle" className="text-xs font-extrabold text-foreground cursor-pointer block">
                  Habilitar Transmissão de Logs no Discord
                </Label>
                <p className="text-[0.7rem] text-muted-foreground">
                  Quando ativo, o bot oficial (`tw-bot`) processa cada inserção de auditoria e posta como Embed no canal correspondente.
                </p>
              </div>
            </div>
            <Switch
              id="discord-enabled-toggle"
              checked={config.enabled}
              onCheckedChange={(val) => handleRootChange("enabled", val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* TABS DE GERENCIAMENTO */}
      <Tabs value={subTab} onValueChange={setSubTab} className="w-full space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-1 bg-secondary/40 p-1 rounded-xl border border-border/60 h-auto">
          <TabsTrigger value="channels" className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Hash className="h-3.5 w-3.5" />
            IDs dos Canais
          </TabsTrigger>
          <TabsTrigger value="server" className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Server className="h-3.5 w-3.5" />
            Servidor & Bot
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <BellRing className="h-3.5 w-3.5" />
            Filtro de Eventos
          </TabsTrigger>
          <TabsTrigger value="customization" className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Palette className="h-3.5 w-3.5" />
            Cores & Preview
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs font-bold gap-1.5 py-2 col-span-2 md:col-span-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
            <Send className="h-3.5 w-3.5" />
            Testar Envio
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: IDS DOS CANAIS DE LOGS (SEM WEBHOOKS) */}
        <TabsContent value="channels" className="space-y-4">
          {/* Canal Geral (Fallback Principal) */}
          <Card className="surface-card border-indigo-500/40 bg-indigo-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-extrabold text-foreground">
                    Canal Geral de Auditoria (Principal / Padrão)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Canal padrão onde todos os logs serão postados caso uma categoria específica não tenha ID próprio configurado.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-indigo-400" />
                  ID do Canal no Discord
                </Label>
                <Input
                  placeholder="Ex: 112233445566778899"
                  value={config.logChannels.generalLogsChannelId || ""}
                  onChange={(e) => handleChannelChange("generalLogsChannelId", e.target.value)}
                  className="font-mono text-xs bg-secondary/30 h-10 max-w-xl"
                />
                <p className="text-[0.68rem] text-muted-foreground">
                  Como pegar: no Discord, ative o Modo Desenvolvedor em Configurações de Usuário → Avançado → clique com botão direito no canal e clique em <strong>Copiar ID</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Canais Granulares por Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Estoque & Movimentações */}
            <Card className="surface-card border transition-all">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-foreground">📦 Estoque, Baús & Movimentações</CardTitle>
                    <CardDescription className="text-[0.68rem]">Entradas, saídas, estornos e transferências</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 space-y-1.5">
                <Label className="text-[0.7rem] font-semibold text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3 text-sky-400" /> ID do Canal no Discord
                </Label>
                <Input
                  placeholder="Ex: 112233445566778899"
                  value={config.logChannels.stockMovementsChannelId || ""}
                  onChange={(e) => handleChannelChange("stockMovementsChannelId", e.target.value)}
                  className="font-mono text-xs h-9 bg-secondary/30"
                />
              </CardContent>
            </Card>

            {/* 2. Vendas & Financeiro */}
            <Card className="surface-card border transition-all">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-foreground">💰 Vendas & Faturamento</CardTitle>
                    <CardDescription className="text-[0.68rem]">Lançamentos de vendas, valores e estornos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 space-y-1.5">
                <Label className="text-[0.7rem] font-semibold text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3 text-emerald-400" /> ID do Canal no Discord
                </Label>
                <Input
                  placeholder="Ex: 112233445566778899"
                  value={config.logChannels.salesChannelId || ""}
                  onChange={(e) => handleChannelChange("salesChannelId", e.target.value)}
                  className="font-mono text-xs h-9 bg-secondary/30"
                />
              </CardContent>
            </Card>

            {/* 3. Fundo de Caixa */}
            <Card className="surface-card border transition-all">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-foreground">🏦 Fundo de Caixa & Finanças</CardTitle>
                    <CardDescription className="text-[0.68rem]">Depósitos, retiradas e saldos da facção</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 space-y-1.5">
                <Label className="text-[0.7rem] font-semibold text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3 text-amber-400" /> ID do Canal no Discord
                </Label>
                <Input
                  placeholder="Ex: 112233445566778899"
                  value={config.logChannels.cashFundChannelId || ""}
                  onChange={(e) => handleChannelChange("cashFundChannelId", e.target.value)}
                  className="font-mono text-xs h-9 bg-secondary/30"
                />
              </CardContent>
            </Card>

            {/* 4. Gestão de Membros & Hierarquia */}
            <Card className="surface-card border transition-all">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-foreground">👥 Membros & Hierarquia</CardTitle>
                    <CardDescription className="text-[0.68rem]">Cadastros, promoções, desligamentos e perfis</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 space-y-1.5">
                <Label className="text-[0.7rem] font-semibold text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3 text-purple-400" /> ID do Canal no Discord
                </Label>
                <Input
                  placeholder="Ex: 112233445566778899"
                  value={config.logChannels.membersChannelId || ""}
                  onChange={(e) => handleChannelChange("membersChannelId", e.target.value)}
                  className="font-mono text-xs h-9 bg-secondary/30"
                />
              </CardContent>
            </Card>

            {/* 5. Metas & Desempenho */}
            <Card className="surface-card border transition-all">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-foreground">🎯 Metas & Desempenho</CardTitle>
                    <CardDescription className="text-[0.68rem]">Criação e atualizações de metas de membros</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 space-y-1.5">
                <Label className="text-[0.7rem] font-semibold text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3 text-pink-400" /> ID do Canal no Discord
                </Label>
                <Input
                  placeholder="Ex: 112233445566778899"
                  value={config.logChannels.goalsChannelId || ""}
                  onChange={(e) => handleChannelChange("goalsChannelId", e.target.value)}
                  className="font-mono text-xs h-9 bg-secondary/30"
                />
              </CardContent>
            </Card>

            {/* 6. Avisos & Comunicados */}
            <Card className="surface-card border transition-all">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-foreground">📣 Avisos & Comunicados</CardTitle>
                    <CardDescription className="text-[0.68rem]">Publicação e leituras de comunicados importantes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 space-y-1.5">
                <Label className="text-[0.7rem] font-semibold text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3 text-yellow-400" /> ID do Canal no Discord
                </Label>
                <Input
                  placeholder="Ex: 112233445566778899"
                  value={config.logChannels.announcementsChannelId || ""}
                  onChange={(e) => handleChannelChange("announcementsChannelId", e.target.value)}
                  className="font-mono text-xs h-9 bg-secondary/30"
                />
              </CardContent>
            </Card>

            {/* 7. Sistema & Auditoria Crítica */}
            <Card className="surface-card border md:col-span-2 transition-all">
              <CardHeader className="pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Terminal className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-foreground">⚡ Sistema, Purga de Cache & Erros Críticos</CardTitle>
                    <CardDescription className="text-[0.68rem]">Limpeza forçada de cache, acessos negados, erros de API e logins</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 space-y-1.5">
                <Label className="text-[0.7rem] font-semibold text-muted-foreground flex items-center gap-1">
                  <Hash className="h-3 w-3 text-cyan-400" /> ID do Canal no Discord
                </Label>
                <Input
                  placeholder="Ex: 112233445566778899"
                  value={config.logChannels.systemChannelId || ""}
                  onChange={(e) => handleChannelChange("systemChannelId", e.target.value)}
                  className="font-mono text-xs h-9 bg-secondary/30"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 2: SERVIDOR & BOT */}
        <TabsContent value="server" className="space-y-4">
          <Card className="surface-card border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Server className="h-4 w-4 text-indigo-400" />
                Dados do Servidor Discord (Guild)
              </CardTitle>
              <CardDescription className="text-xs">
                Identificação do servidor Discord onde o Bot oficial da Twin Wheels está conectado.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-indigo-400" />
                    ID do Servidor Discord (Guild ID)
                  </Label>
                  <Input
                    placeholder="Ex: 917826984778797087"
                    value={config.guildId || ""}
                    onChange={(e) => handleRootChange("guildId", e.target.value)}
                    className="font-mono text-xs bg-secondary/30 h-9"
                  />
                  <p className="text-[0.68rem] text-muted-foreground">
                    Clique com botão direito no ícone do servidor no Discord → <strong>Copiar ID do Servidor</strong>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Nome de Exibição do Servidor</Label>
                  <Input
                    placeholder="Ex: Twin Wheels RP"
                    value={config.guildName || ""}
                    onChange={(e) => handleRootChange("guildName", e.target.value)}
                    className="text-xs bg-secondary/30 h-9"
                  />
                  <p className="text-[0.68rem] text-muted-foreground">
                    Utilizado no cabeçalho e rodapé dos relatórios de log.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Texto de Presença / Status do Bot</Label>
                  <Input
                    placeholder="Ex: Twin Wheels • Logs em Tempo Real"
                    value={config.botStatusText || ""}
                    onChange={(e) => handleRootChange("botStatusText", e.target.value)}
                    className="text-xs bg-secondary/30 h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Tipo de Atividade do Bot</Label>
                  <Select
                    value={config.botActivityType || "Watching"}
                    onValueChange={(val: any) => handleRootChange("botActivityType", val)}
                  >
                    <SelectTrigger className="text-xs bg-secondary/30 h-9">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Watching">Assistindo (Watching)</SelectItem>
                      <SelectItem value="Playing">Jogando (Playing)</SelectItem>
                      <SelectItem value="Listening">Ouvindo (Listening)</SelectItem>
                      <SelectItem value="Competing">Competindo em (Competing)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IDENTIDADE VISUAL & IMAGEM DO BOT NO EMBED */}
          <Card className="surface-card border border-indigo-500/30">
            <CardHeader className="pb-3 border-b border-border/60 bg-indigo-500/[0.03]">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                    <Bot className="h-4 w-4 text-indigo-400" />
                    Imagem do Bot no Embed (Avatar & Thumbnail)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Defina a imagem oficial que o Bot utilizará como miniatura/thumbnail no canto superior e como avatar nos Embeds do Discord.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/30 text-indigo-400 bg-indigo-500/10 font-bold">
                  Embed Visual
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div
                className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-secondary/30 border transition-all",
                  isDraggingAvatar ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/40" : "border-border/60"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingAvatar(true);
                }}
                onDragLeave={() => setIsDraggingAvatar(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingAvatar(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleUploadImage(file, "botAvatarUrl");
                }}
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (let i = 0; i < items.length; i++) {
                    if (items[i].type.startsWith("image/")) {
                      const file = items[i].getAsFile();
                      if (file) {
                        void handleUploadImage(file, "botAvatarUrl");
                        break;
                      }
                    }
                  }
                }}
              >
                {/* PREVIEW AO VIVO DA IMAGEM DO BOT COM BOTÃO DE TROCA */}
                <div className="relative shrink-0 flex flex-col items-center gap-2 self-center sm:self-auto">
                  <div
                    onClick={() => botAvatarInputRef.current?.click()}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-indigo-500/50 bg-[#1e1f22] overflow-hidden shadow-xl flex items-center justify-center group relative cursor-pointer"
                    title="Clique para trocar imagem do Bot"
                  >
                    {uploadingBotAvatar ? (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 z-10">
                        <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                        <span className="text-[9px] text-indigo-200 font-medium">Enviando...</span>
                      </div>
                    ) : (
                      <>
                        <img
                          src={config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                          alt="Imagem do Bot no Embed"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                          <UploadCloud className="h-5 w-5 text-indigo-300" />
                          <span className="text-[9px] font-bold">Alterar</span>
                        </div>
                      </>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono font-bold text-indigo-400 border-indigo-500/30 bg-indigo-500/10">
                    Avatar & Thumbnail
                  </Badge>
                </div>

                {/* ÁREA DE UPLOAD E CONTROLES */}
                <div className="flex-1 min-w-0 space-y-3 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                        Upload da Imagem do Bot
                      </Label>
                      <p className="text-[0.72rem] text-muted-foreground mt-0.5">
                        Faça upload direto do arquivo de imagem do seu computador ou celular.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRootChange("botAvatarUrl", "https://i.ibb.co/ymH1BQPQ/Uma124.png")}
                      className="h-7 px-2 text-[10px] text-muted-foreground hover:text-indigo-400 cursor-pointer"
                      title="Restaurar imagem padrão da Twin Wheels"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Padrão TW
                    </Button>
                  </div>

                  {/* BOTÕES DE UPLOAD E ARRASTE */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      ref={botAvatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadImage(file, "botAvatarUrl");
                      }}
                    />

                    <Button
                      type="button"
                      onClick={() => botAvatarInputRef.current?.click()}
                      disabled={uploadingBotAvatar}
                      className="h-9 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm shadow-indigo-600/20 cursor-pointer"
                    >
                      {uploadingBotAvatar ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Fazendo Upload...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4" />
                          Fazer Upload de Imagem
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowManualUrlInput(!showManualUrlInput)}
                      className="h-9 px-3 text-xs gap-1.5 border-border/80 text-muted-foreground hover:text-foreground"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      {showManualUrlInput ? "Ocultar Link" : "Informar por Link"}
                    </Button>
                  </div>

                  {/* CAMPO DE LINK MANUAL (OPCIONAL/COLAPSÁVEL) */}
                  {showManualUrlInput && (
                    <div className="p-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-1.5 animate-in fade-in duration-200">
                      <Label className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" /> Link direto da imagem (URL)
                      </Label>
                      <Input
                        placeholder="https://... (link direto da imagem)"
                        value={config.botAvatarUrl || ""}
                        onChange={(e) => handleRootChange("botAvatarUrl", e.target.value.trim())}
                        className="text-xs bg-background/80 h-8 font-mono"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[0.68rem] text-muted-foreground">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>Formatos aceitos: <strong>PNG, JPG, WEBP, GIF</strong> até 8MB. Você também pode arrastar ou colar com <kbd className="px-1 py-0.2 rounded bg-muted border text-[9px]">Ctrl+V</kbd>.</span>
                  </div>
                </div>
              </div>

              {/* RODAPÉ DO EMBED (TEXTO E ÍCONE) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/40">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Ícone do Rodapé (Footer Icon)
                    </Label>
                    <input
                      ref={footerIconInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadImage(file, "footerIconUrl");
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => footerIconInputRef.current?.click()}
                      disabled={uploadingFooterIcon}
                      className="h-6 px-2 text-[10px] text-indigo-400 hover:text-indigo-300 gap-1 cursor-pointer"
                    >
                      {uploadingFooterIcon ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UploadCloud className="h-3 w-3" />
                      )}
                      Upload Ícone
                    </Button>
                  </div>
                  <Input
                    placeholder="Deixe em branco para usar a imagem do Bot"
                    value={config.footerIconUrl || ""}
                    onChange={(e) => handleRootChange("footerIconUrl", e.target.value.trim())}
                    className="text-xs bg-secondary/30 h-9 font-mono"
                  />
                  <p className="text-[0.68rem] text-muted-foreground">
                    Miniatura pequena exibida no rodapé inferior do embed junto ao timestamp.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Texto do Rodapé (Footer Text)</Label>
                  <Input
                    placeholder="Ex: Twin Wheels RP • Sistema Integrado de Logs"
                    value={config.footerText || ""}
                    onChange={(e) => handleRootChange("footerText", e.target.value)}
                    className="text-xs bg-secondary/30 h-9"
                  />
                  <p className="text-[0.68rem] text-muted-foreground">
                    Texto descritivo exibido na base de cada Embed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: FILTRO DE EVENTOS */}
        <TabsContent value="events" className="space-y-4">
          <Card className="surface-card border">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <BellRing className="h-4 w-4 text-indigo-400" />
                Eventos Habilitados para Transmissão
              </CardTitle>
              <CardDescription className="text-xs">
                Selecione quais ações da plataforma devem gerar notificações e Embeds no Discord.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Logins & Sessões */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-emerald-500/30 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Logins & Sessões de Membros
                    </Label>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Acessos e saídas da plataforma via Discord OAuth.
                    </p>
                  </div>
                  <Switch
                    checked={config.enabledEvents.logins}
                    onCheckedChange={() => handleEventToggle("logins")}
                  />
                </div>

                {/* 2. Movimentações de Estoque */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-sky-500/30 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-sky-400" />
                      Movimentações de Estoque & Baús
                    </Label>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Entradas, saídas, estornos e transferências de itens.
                    </p>
                  </div>
                  <Switch
                    checked={config.enabledEvents.stockMovements}
                    onCheckedChange={() => handleEventToggle("stockMovements")}
                  />
                </div>

                {/* 3. Vendas & Faturamento */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-emerald-500/30 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Registro & Estorno de Vendas
                    </Label>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Vendas concluídas e cancelamentos de pedidos.
                    </p>
                  </div>
                  <Switch
                    checked={config.enabledEvents.sales}
                    onCheckedChange={() => handleEventToggle("sales")}
                  />
                </div>

                {/* 4. Fundo de Caixa */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-amber-500/30 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Movimentações do Fundo de Caixa
                    </Label>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Entradas, saídas de dinheiro e ajustes de saldo.
                    </p>
                  </div>
                  <Switch
                    checked={config.enabledEvents.cashFund}
                    onCheckedChange={() => handleEventToggle("cashFund")}
                  />
                </div>

                {/* 5. Cadastros e Membros */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-purple-500/30 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-400" />
                      Gestão de Membros & Solicitações
                    </Label>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Novos cadastros, aprovações, rejeições e desligamentos.
                    </p>
                  </div>
                  <Switch
                    checked={config.enabledEvents.members}
                    onCheckedChange={() => handleEventToggle("members")}
                  />
                </div>

                {/* 6. Cargos & Permissões */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-indigo-500/30 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-400" />
                      Alteração de Cargos & Permissões
                    </Label>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Promoções de patente e salvamento de permissões.
                    </p>
                  </div>
                  <Switch
                    checked={config.enabledEvents.roles}
                    onCheckedChange={() => handleEventToggle("roles")}
                  />
                </div>

                {/* 7. Metas da Facção */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-pink-500/30 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-pink-400" />
                      Gestão de Metas & Desempenho
                    </Label>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Criação, edição e exclusão de metas operacionais.
                    </p>
                  </div>
                  <Switch
                    checked={config.enabledEvents.goals}
                    onCheckedChange={() => handleEventToggle("goals")}
                  />
                </div>

                {/* 8. Avisos & Comunicados */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-yellow-500/30 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-yellow-400" />
                      Avisos & Comunicados Importantes
                    </Label>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Novos comunicados e avisos publicados pela liderança.
                    </p>
                  </div>
                  <Switch
                    checked={config.enabledEvents.announcements}
                    onCheckedChange={() => handleEventToggle("announcements")}
                  />
                </div>

                {/* 9. Limpeza Forçada de Cache */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-cyan-500/30 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      Limpeza Forçada de Cache (Dev Purge)
                    </Label>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Disparo de ordens globais de recarregamento e limpeza.
                    </p>
                  </div>
                  <Switch
                    checked={config.enabledEvents.forcePurge}
                    onCheckedChange={() => handleEventToggle("forcePurge")}
                  />
                </div>

                {/* 10. Erros Críticos de Operação */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary/20 border border-border/40 hover:border-rose-500/30 transition-all">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      Alertas de Erros & Acessos Negados
                    </Label>
                    <p className="text-[0.68rem] text-muted-foreground">
                      Falhas de banco e tentativas de acesso sem autorização.
                    </p>
                  </div>
                  <Switch
                    checked={config.enabledEvents.systemErrors}
                    onCheckedChange={() => handleEventToggle("systemErrors")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4: CORES & LIVE PREVIEW */}
        <TabsContent value="customization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Seletor de Cores HEX */}
            <Card className="surface-card border lg:col-span-6">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Palette className="h-4 w-4 text-indigo-400" />
                  Paleta de Cores dos Embeds
                </CardTitle>
                <CardDescription className="text-xs">
                  Personalize a barra lateral colorida para cada categoria de log no Discord.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Vendas */}
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground">Vendas & Lucros</span>
                      <p className="text-[0.65rem] text-muted-foreground">Registros de venda</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.embedColors.sales}
                        onChange={(e) => handleColorChange("sales", e.target.value)}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[0.7rem] font-bold text-muted-foreground">{config.embedColors.sales}</span>
                    </div>
                  </div>

                  {/* Movimentações */}
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground">Estoque & Baús</span>
                      <p className="text-[0.65rem] text-muted-foreground">Entradas e saídas</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.embedColors.movements}
                        onChange={(e) => handleColorChange("movements", e.target.value)}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[0.7rem] font-bold text-muted-foreground">{config.embedColors.movements}</span>
                    </div>
                  </div>

                  {/* Fundo de Caixa */}
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground">Fundo de Caixa</span>
                      <p className="text-[0.65rem] text-muted-foreground">Lançamentos de caixa</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.embedColors.cashFund}
                        onChange={(e) => handleColorChange("cashFund", e.target.value)}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[0.7rem] font-bold text-muted-foreground">{config.embedColors.cashFund}</span>
                    </div>
                  </div>

                  {/* Membros */}
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground">Membros & Cadastros</span>
                      <p className="text-[0.65rem] text-muted-foreground">Aprovações e perfis</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.embedColors.members}
                        onChange={(e) => handleColorChange("members", e.target.value)}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[0.7rem] font-bold text-muted-foreground">{config.embedColors.members}</span>
                    </div>
                  </div>

                  {/* Metas */}
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground">Metas</span>
                      <p className="text-[0.65rem] text-muted-foreground">Alvos de produção</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.embedColors.goals}
                        onChange={(e) => handleColorChange("goals", e.target.value)}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[0.7rem] font-bold text-muted-foreground">{config.embedColors.goals}</span>
                    </div>
                  </div>

                  {/* Sistema / Purga */}
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground">Sistema & Purga</span>
                      <p className="text-[0.65rem] text-muted-foreground">Ações de dev e purga</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.embedColors.system}
                        onChange={(e) => handleColorChange("system", e.target.value)}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[0.7rem] font-bold text-muted-foreground">{config.embedColors.system}</span>
                    </div>
                  </div>

                  {/* Erros Críticos */}
                  <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-between gap-2 sm:col-span-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground">Erros & Acesso Negado</span>
                      <p className="text-[0.65rem] text-muted-foreground">Falhas críticas</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={config.embedColors.errors}
                        onChange={(e) => handleColorChange("errors", e.target.value)}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-[0.7rem] font-bold text-muted-foreground">{config.embedColors.errors}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <Label className="text-xs font-bold text-foreground">Texto do Rodapé do Embed</Label>
                  <Input
                    placeholder="Twin Wheels RP • Sistema Integrado de Logs"
                    value={config.footerText || ""}
                    onChange={(e) => handleRootChange("footerText", e.target.value)}
                    className="text-xs bg-secondary/30 h-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* LIVE PREVIEW DISCORD MOCKUP */}
            <Card className="surface-card border lg:col-span-6 bg-[#1e1f22] text-[#dbdee1] overflow-hidden">
              <CardHeader className="pb-3 border-b border-white/5 bg-[#2b2d31]/50">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <CardTitle className="text-xs font-bold text-white tracking-wide uppercase">
                      Live Preview • Embed Discord
                    </CardTitle>
                  </div>
                  <Select
                    value={previewCategory}
                    onValueChange={(val: any) => setPreviewCategory(val)}
                  >
                    <SelectTrigger className="w-36 h-7 text-[0.7rem] bg-[#1e1f22] border-white/10 text-white">
                      <SelectValue placeholder="Modelo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2b2d31] border-white/10 text-white">
                      <SelectItem value="venda">Venda de Insumo</SelectItem>
                      <SelectItem value="movimentacao">Entrada de Estoque</SelectItem>
                      <SelectItem value="caixa">Fundo de Caixa</SelectItem>
                      <SelectItem value="membro">Aprovação Membro</SelectItem>
                      <SelectItem value="purga">Purga de Cache</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 font-sans">
                {/* DISCORD MESSAGE CONTAINER */}
                <div className="flex items-start gap-3">
                  <img
                    src={config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                    alt="Bot Avatar"
                    className="w-10 h-10 rounded-full bg-[#5865f2] shrink-0 mt-0.5 object-cover shadow-sm"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                    }}
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="font-bold text-white text-sm hover:underline cursor-pointer">
                        {config.guildName ? `${config.guildName} Bot` : "Twin Wheels Bot"}
                      </span>
                      <span className="text-[0.62rem] bg-[#5865f2] text-white px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                        APP
                      </span>
                      <span className="text-[0.7rem] text-[#949ba4] ml-1">
                        Hoje às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* DISCORD EMBED CARD */}
                    {previewCategory === "venda" && (
                      <div
                        className="rounded-md bg-[#2b2d31] border-l-4 p-3.5 space-y-2.5 max-w-lg shadow-md"
                        style={{ borderLeftColor: config.embedColors.sales }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[0.72rem] text-[#b5bac1] font-semibold">
                              <span>Operador: {profile?.nickname || profile?.nome || "Vendedor"}</span>
                            </div>
                            <h4 className="font-bold text-white text-sm hover:underline cursor-pointer">
                              💰 Venda Concluída — Insumos Operacionais
                            </h4>
                            <p className="text-xs text-[#dbdee1] mt-1 leading-relaxed">
                              O vendedor <strong>{profile?.nickname || profile?.nome || "Vendedor"}</strong> registrou uma venda no valor total de <strong className="text-emerald-400">R$ 450.000</strong>.
                            </p>
                          </div>
                          <img
                            src={config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                            alt="Embed Thumbnail"
                            className="w-14 h-14 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0 shadow-sm"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2 rounded bg-[#1e1f22]/60">
                            <span className="text-[0.65rem] uppercase font-bold text-[#949ba4] block">Produto / Item</span>
                            <span className="text-xs font-semibold text-white">500x Lockpick Especial</span>
                          </div>
                          <div className="p-2 rounded bg-[#1e1f22]/60">
                            <span className="text-[0.65rem] uppercase font-bold text-[#949ba4] block">Valor Total</span>
                            <span className="text-xs font-bold text-emerald-400">R$ 450.000,00</span>
                          </div>
                          <div className="p-2 rounded bg-[#1e1f22]/60">
                            <span className="text-[0.65rem] uppercase font-bold text-[#949ba4] block">Comprador</span>
                            <span className="text-xs font-semibold text-white">Facção Parceira</span>
                          </div>
                          <div className="p-2 rounded bg-[#1e1f22]/60">
                            <span className="text-[0.65rem] uppercase font-bold text-[#949ba4] block">Baú de Origem</span>
                            <span className="text-xs font-semibold text-white">Baú Principal 01</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[0.68rem] text-[#949ba4]">
                          <img
                            src={config.footerIconUrl || config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                            alt="Footer Icon"
                            className="w-4 h-4 rounded-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                          <span>{config.footerText || "Twin Wheels RP • Sistema Integrado de Logs"}</span>
                        </div>
                      </div>
                    )}

                    {previewCategory === "movimentacao" && (
                      <div
                        className="rounded-md bg-[#2b2d31] border-l-4 p-3.5 space-y-2.5 max-w-lg shadow-md"
                        style={{ borderLeftColor: config.embedColors.movements }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[0.72rem] text-[#b5bac1] font-semibold">
                              <span>Operador: {profile?.nickname || profile?.nome || "Membro"}</span>
                            </div>
                            <h4 className="font-bold text-white text-sm">
                              📦 Entrada de Estoque — Baú de Insumos
                            </h4>
                            <p className="text-xs text-[#dbdee1] mt-1">
                              O membro guardou <strong>1.200x Peças Mecânicas</strong> no <strong>Baú da Oficina</strong>.
                            </p>
                          </div>
                          <img
                            src={config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                            alt="Embed Thumbnail"
                            className="w-14 h-14 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0 shadow-sm"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2 rounded bg-[#1e1f22]/60">
                            <span className="text-[0.65rem] uppercase font-bold text-[#949ba4] block">Tipo de Lançamento</span>
                            <span className="text-xs font-semibold text-sky-400">Entrada (+)</span>
                          </div>
                          <div className="p-2 rounded bg-[#1e1f22]/60">
                            <span className="text-[0.65rem] uppercase font-bold text-[#949ba4] block">Saldo Resultante</span>
                            <span className="text-xs font-semibold text-white">5.840 unidades</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[0.68rem] text-[#949ba4]">
                          <img
                            src={config.footerIconUrl || config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                            alt="Footer Icon"
                            className="w-4 h-4 rounded-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                          <span>{config.footerText || "Twin Wheels RP • Sistema Integrado de Logs"}</span>
                        </div>
                      </div>
                    )}

                    {previewCategory === "caixa" && (
                      <div
                        className="rounded-md bg-[#2b2d31] border-l-4 p-3.5 space-y-2.5 max-w-lg shadow-md"
                        style={{ borderLeftColor: config.embedColors.cashFund }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm">
                              🏦 Depósito no Fundo de Caixa da Facção
                            </h4>
                            <p className="text-xs text-[#dbdee1] mt-1">
                              Depósito confirmado de <strong className="text-amber-400">R$ 1.500.000</strong> efetuado por {profile?.nickname || "Gestor"}.
                            </p>
                          </div>
                          <img
                            src={config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                            alt="Embed Thumbnail"
                            className="w-14 h-14 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0 shadow-sm"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[0.68rem] text-[#949ba4]">
                          <img
                            src={config.footerIconUrl || config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                            alt="Footer Icon"
                            className="w-4 h-4 rounded-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                          <span>{config.footerText || "Twin Wheels RP • Sistema Integrado de Logs"}</span>
                        </div>
                      </div>
                    )}

                    {previewCategory === "membro" && (
                      <div
                        className="rounded-md bg-[#2b2d31] border-l-4 p-3.5 space-y-2.5 max-w-lg shadow-md"
                        style={{ borderLeftColor: config.embedColors.members }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm">
                              👥 Nova Aprovação de Membro na Facção
                            </h4>
                            <p className="text-xs text-[#dbdee1] mt-1">
                              O gestor aprovou o cadastro do membro <strong>Novo Integrante (ID: 4821)</strong>.
                            </p>
                          </div>
                          <img
                            src={config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                            alt="Embed Thumbnail"
                            className="w-14 h-14 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0 shadow-sm"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[0.68rem] text-[#949ba4]">
                          <img
                            src={config.footerIconUrl || config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                            alt="Footer Icon"
                            className="w-4 h-4 rounded-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                          <span>{config.footerText || "Twin Wheels RP • Sistema Integrado de Logs"}</span>
                        </div>
                      </div>
                    )}

                    {previewCategory === "purga" && (
                      <div
                        className="rounded-md bg-[#2b2d31] border-l-4 p-3.5 space-y-2.5 max-w-lg shadow-md"
                        style={{ borderLeftColor: config.embedColors.system }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className="font-bold text-white text-sm">
                              ⚡ Ordem Global de Limpeza Forçada de Cache (Dev)
                            </h4>
                            <p className="text-xs text-[#dbdee1] mt-1">
                              Todos os clientes online foram instruídos a limpar os caches locais e recarregar a plataforma.
                            </p>
                          </div>
                          <img
                            src={config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                            alt="Embed Thumbnail"
                            className="w-14 h-14 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0 shadow-sm"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[0.68rem] text-[#949ba4]">
                          <img
                            src={config.footerIconUrl || config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                            alt="Footer Icon"
                            className="w-4 h-4 rounded-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                          <span>{config.footerText || "Twin Wheels RP • Sistema Integrado de Logs"}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 5: DIAGNÓSTICO & TESTE DE ENVIO VIA BOT (SEM WEBHOOK) */}
        <TabsContent value="diagnostics" className="space-y-4">
          <Card className="surface-card border-indigo-500/30">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Send className="h-4 w-4 text-indigo-400" />
                Disparo de Embed de Teste via Bot Oficial
              </CardTitle>
              <CardDescription className="text-xs">
                Dispare um embed de teste em tempo real para o Bot enviar diretamente no canal do Discord através da API do Discord.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Canal / Categoria de Teste</Label>
                  <Select
                    value={testCategory}
                    onValueChange={(val: any) => {
                      setTestCategory(val);
                      const currentVal = config.logChannels[val as keyof DiscordLogChannels] || "";
                      setCustomTestChannelId(currentVal);
                    }}
                  >
                    <SelectTrigger className="text-xs bg-secondary/30 h-9">
                      <SelectValue placeholder="Selecione o canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generalLogsChannelId">Canal Geral de Logs</SelectItem>
                      <SelectItem value="stockMovementsChannelId">Estoque & Movimentações</SelectItem>
                      <SelectItem value="salesChannelId">Vendas & Lucros</SelectItem>
                      <SelectItem value="cashFundChannelId">Fundo de Caixa</SelectItem>
                      <SelectItem value="membersChannelId">Membros & Cadastros</SelectItem>
                      <SelectItem value="goalsChannelId">Metas & Desempenho</SelectItem>
                      <SelectItem value="announcementsChannelId">Avisos & Comunicados</SelectItem>
                      <SelectItem value="systemChannelId">Sistema & Purga de Cache</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-indigo-400" />
                    ID do Canal no Discord
                  </Label>
                  <Input
                    placeholder="Ex: 112233445566778899"
                    value={customTestChannelId || (config.logChannels[testCategory] as string) || ""}
                    onChange={(e) => setCustomTestChannelId(e.target.value.trim())}
                    className="font-mono text-xs bg-secondary/30 h-9"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <p className="text-[0.72rem] text-muted-foreground">
                  O teste é processado pelo bot em milissegundos via Supabase Realtime e enviado diretamente ao canal do servidor.
                </p>

                <Button
                  onClick={handleSendTest}
                  disabled={isTesting}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shrink-0 gap-2 h-9 px-4 cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Disparando Teste...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Disparar Embed de Teste via Bot
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
                    testResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
