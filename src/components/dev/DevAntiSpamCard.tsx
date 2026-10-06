import { useState, useMemo } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  Sliders,
  Sparkles,
  Trash2,
  Plus,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Globe,
  MessageSquare,
  Flame,
  Zap,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Info,
  Server,
  Lock,
  Eye,
  Send,
  Hash,
  ExternalLink,
  Bot,
  Paperclip,
  Calendar,
  AlertTriangle,
  Link2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DEFAULT_ANTI_SPAM_CONFIG,
  fetchDiscordMessageByUrl,
  type DiscordMessagePreview,
  type DiscordWebhooksConfig,
  type WebhookAntiSpamConfig,
} from "@/services/webhookService";
import { cn } from "@/lib/utils";

interface DevAntiSpamCardProps {
  config: DiscordWebhooksConfig;
  onChange: (updated: DiscordWebhooksConfig) => void;
  canSave: boolean;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function DevAntiSpamCard({
  config,
  onChange,
  canSave,
  onSave,
  saving,
}: DevAntiSpamCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newPhrase, setNewPhrase] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [testInput, setTestInput] = useState("");
  const [fetchingDiscordMessage, setFetchingDiscordMessage] = useState(false);
  const [fetchedDiscordMessage, setFetchedDiscordMessage] = useState<DiscordMessagePreview | null>(null);
  const [testResult, setTestResult] = useState<{
    blocked: boolean;
    reason?: string;
    matchedPattern?: string;
  } | null>(null);

  const antiSpam: WebhookAntiSpamConfig = useMemo(() => {
    return {
      ...DEFAULT_ANTI_SPAM_CONFIG,
      ...(config.antiSpam || {}),
      stats: {
        ...DEFAULT_ANTI_SPAM_CONFIG.stats,
        ...(config.antiSpam?.stats || {}),
      },
    };
  }, [config.antiSpam]);

  const updateAntiSpam = (partial: Partial<WebhookAntiSpamConfig>) => {
    const updated: WebhookAntiSpamConfig = {
      ...antiSpam,
      ...partial,
      stats: {
        ...antiSpam.stats,
        ...(partial.stats || {}),
      },
    };
    onChange({
      ...config,
      antiSpam: updated,
    });
  };

  const handleAddPhrase = () => {
    const trimmed = newPhrase.trim().toLowerCase();
    if (!trimmed) return;
    if (antiSpam.customBlockedPhrases.includes(trimmed)) {
      toast.error("Esta frase já está na lista de bloqueio.");
      return;
    }
    updateAntiSpam({
      customBlockedPhrases: [...antiSpam.customBlockedPhrases, trimmed],
    });
    setNewPhrase("");
    toast.success(`Frase "${trimmed}" adicionada ao filtro.`);
  };

  const handleRemovePhrase = (phraseToRemove: string) => {
    updateAntiSpam({
      customBlockedPhrases: antiSpam.customBlockedPhrases.filter((p) => p !== phraseToRemove),
    });
    toast.success(`Frase removida.`);
  };

  const handleAddDomain = () => {
    let trimmed = newDomain.trim().toLowerCase();
    if (!trimmed) return;
    trimmed = trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!trimmed) return;
    if (antiSpam.customBlockedDomains.includes(trimmed)) {
      toast.error("Este domínio já está na lista de bloqueio.");
      return;
    }
    updateAntiSpam({
      customBlockedDomains: [...antiSpam.customBlockedDomains, trimmed],
    });
    setNewDomain("");
    toast.success(`Domínio "${trimmed}" adicionado ao filtro.`);
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    updateAntiSpam({
      customBlockedDomains: antiSpam.customBlockedDomains.filter((d) => d !== domainToRemove),
    });
    toast.success(`Domínio removido.`);
  };

  const handleResetDefaults = () => {
    updateAntiSpam({
      ...DEFAULT_ANTI_SPAM_CONFIG,
      stats: antiSpam.stats,
    });
    toast.success("Configurações do Anti-Spam restauradas para o padrão recomendado.");
  };

  const handleResetStats = () => {
    updateAntiSpam({
      stats: {
        totalBlocked: 0,
        lastBlockedAt: undefined,
        lastBlockedReason: undefined,
        lastBlockedChannel: undefined,
        lastBlockedIp: undefined,
      },
    });
    toast.success("Métricas de spams bloqueados zeradas.");
  };

  // Avaliação pura das regras anti-spam contra textos, títulos, descrições e campos
  const evaluateSpamRules = (
    rawText: string,
    embeds?: DiscordMessagePreview["embeds"],
    customConfig?: WebhookAntiSpamConfig
  ): { blocked: boolean; reason: string; matchedPattern?: string } => {
    const currentRules = customConfig || antiSpam;

    if (!currentRules.enabled) {
      return {
        blocked: false,
        reason: "O escudo anti-spam está desativado no momento.",
      };
    }

    const allChunks: string[] = [];
    if (rawText) allChunks.push(rawText);

    if (embeds && Array.isArray(embeds)) {
      for (const emb of embeds) {
        if (emb.title) allChunks.push(emb.title);
        if (emb.description) allChunks.push(emb.description);
        if (emb.url) allChunks.push(emb.url);
        if (emb.author?.name) allChunks.push(emb.author.name);
        if (emb.footer?.text) allChunks.push(emb.footer.text);
        if (emb.fields && Array.isArray(emb.fields)) {
          for (const f of emb.fields) {
            if (f.name) allChunks.push(f.name);
            if (f.value) allChunks.push(f.value);
          }
        }
      }
    }

    const combined = allChunks.join("\n").toLowerCase();

    // 1. Telegram
    if (currentRules.blockTelegramLinks) {
      if (
        /t\.me\/[a-z0-9_]+/i.test(combined) ||
        /telegram\.me\/[a-z0-9_]+/i.test(combined) ||
        /telegram\.dog\/[a-z0-9_]+/i.test(combined) ||
        /@a_toolsx/i.test(combined) ||
        combined.includes("a_toolsx") ||
        combined.includes("a-tools x")
      ) {
        return {
          blocked: true,
          reason: "Link ou canal de divulgação do Telegram detectado (t.me / A-Tools).",
          matchedPattern: "Telegram URL / Invite",
        };
      }
    }

    // 2. Discord Invites
    if (currentRules.blockDiscordInvites) {
      if (
        /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-z0-9-_]+/i.test(
          combined
        )
      ) {
        return {
          blocked: true,
          reason: "Link de convite para outro servidor Discord detectado.",
          matchedPattern: "Discord Invite Link",
        };
      }
    }

    // 3. Phishing / Grabbers
    if (currentRules.blockPhishingLinks || currentRules.blockIpLoggers) {
      const knownMalicious = [
        "grabify.link",
        "iplogger",
        "2no.co",
        "yip.su",
        "free-nitro",
        "discord-nitro",
        "steamcommunity-nitro",
        "airdrop-token",
        "free nitro",
        "claim free nitro",
        "steam gift card",
        "free robux",
      ];
      for (const mal of knownMalicious) {
        if (combined.includes(mal)) {
          return {
            blocked: true,
            reason: `Link malicioso ou termo suspeito detectado: "${mal}"`,
            matchedPattern: mal,
          };
        }
      }
    }

    // 4. Domínios customizados
    if (currentRules.customBlockedDomains && currentRules.customBlockedDomains.length > 0) {
      for (const dom of currentRules.customBlockedDomains) {
        if (dom && combined.includes(dom.toLowerCase())) {
          return {
            blocked: true,
            reason: `Domínio proibido pela lista personalizada: ${dom}`,
            matchedPattern: dom,
          };
        }
      }
    }

    // 5. Frases customizadas
    if (currentRules.customBlockedPhrases && currentRules.customBlockedPhrases.length > 0) {
      for (const phrase of currentRules.customBlockedPhrases) {
        if (phrase && combined.includes(phrase.toLowerCase())) {
          return {
            blocked: true,
            reason: `Palavra ou frase proibida detectada: "${phrase}"`,
            matchedPattern: phrase,
          };
        }
      }
    }

    return {
      blocked: false,
      reason: "Mensagem 100% limpa e autorizada pelo escudo de segurança!",
    };
  };

  // Avaliação em tempo real (reativa a qualquer alteração de switch ou palavra-chave)
  const activeVerdict = useMemo(() => {
    if (fetchedDiscordMessage) {
      return evaluateSpamRules(fetchedDiscordMessage.content || "", fetchedDiscordMessage.embeds, antiSpam);
    }
    if (testResult) {
      return testResult;
    }
    return null;
  }, [fetchedDiscordMessage, testResult, antiSpam]);

  // Simulador de Verificação em Tempo Real no Frontend
  const handleRunTest = async (overrideInput?: string) => {
    const rawToTest = (typeof overrideInput === "string" ? overrideInput : testInput).trim();
    if (!rawToTest) {
      setTestResult(null);
      setFetchedDiscordMessage(null);
      return;
    }

    // Detecta se é um link de mensagem do Discord
    const isDiscordMessageUrl = /discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/i.test(rawToTest);

    if (isDiscordMessageUrl) {
      setFetchingDiscordMessage(true);
      toast.info("Buscando mensagem real no Discord através do Bot...");

      try {
        const res = await fetchDiscordMessageByUrl(rawToTest);
        if (res.success && res.message) {
          setFetchedDiscordMessage(res.message);
          const verdict = evaluateSpamRules(res.message.content || "", res.message.embeds, antiSpam);
          setTestResult(verdict);
          if (verdict.blocked) {
            toast.warning(`Mensagem inspecionada: BLOQUEADA pelo escudo!`);
          } else {
            toast.success(`Mensagem de #${res.message.channelName || "canal"} carregada e aprovada!`);
          }
        } else {
          setFetchedDiscordMessage(null);
          const errReason = res.error || "Não foi possível carregar a mensagem do Discord.";
          setTestResult({
            blocked: false,
            reason: `Aviso: ${errReason}`,
          });
          toast.error(errReason);
        }
      } catch (fetchErr: any) {
        setFetchedDiscordMessage(null);
        setTestResult({
          blocked: false,
          reason: `Falha de conexão com o bot: ${fetchErr?.message || "Erro desconhecido"}`,
        });
        toast.error("Erro ao conectar com o serviço do Discord.");
      } finally {
        setFetchingDiscordMessage(false);
      }
      return;
    }

    // Se for texto normal / payload
    setFetchedDiscordMessage(null);
    const verdict = evaluateSpamRules(rawToTest, undefined, antiSpam);
    setTestResult(verdict);
  };

  const sampleDiscordMessageUrl =
    "https://discord.com/channels/1535505650308620400/1535637509818548234/1556473932079697952";

  const sampleAttackPayload = `🚀 To use this bot, you must join our channel: https://t.me/A_ToolsX

Telegram

A-TOOLS X

💻 Programming & Development Tools • Resources • Services Everything you need in one place. ⚡`;

  const sampleDiscordInvitePayload = `Entre na nova facção aliada pelo link oficial: https://discord.gg/twinwheels-recrutamento`;

  return (
    <Card className="surface-card border-zinc-800 bg-zinc-950/80 shadow-xl overflow-hidden relative border-t-2 border-t-rose-500/80">
      {/* Glow de fundo */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* CABEÇALHO DO ESCUDO */}
      <CardHeader className="p-5 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                "p-3 rounded-xl border shadow-sm transition-all",
                antiSpam.enabled
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-950/20"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800"
              )}
            >
              {antiSpam.enabled ? <ShieldCheck className="h-6 w-6 text-emerald-400" /> : <ShieldAlert className="h-6 w-6 text-rose-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                  🛡️ Escudo Anti-Spam & Firewall do Bot
                </CardTitle>
                {antiSpam.enabled ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Proteção Ativa
                  </Badge>
                ) : (
                  <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] font-bold gap-1">
                    <AlertOctagon className="h-3 w-3" />
                    Firewall Pausado
                  </Badge>
                )}
                {antiSpam.autoDeleteChannelSpam && (
                  <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30 text-[10px] font-bold gap-1">
                    <Zap className="h-3 w-3" />
                    Auto-Purga Ativa
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Bloqueia propagandas de Telegram (`t.me`), links de phishing/nitro, rate-limit de invasões por IP e auto-deleta spams nos canais.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Master Switch */}
            <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded-xl border border-zinc-800">
              <Label htmlFor="master-antispam" className="text-xs font-bold cursor-pointer">
                {antiSpam.enabled ? "Escudo Ligado" : "Escudo Desligado"}
              </Label>
              <Switch
                id="master-antispam"
                checked={antiSpam.enabled}
                onCheckedChange={(val) => updateAntiSpam({ enabled: val })}
              />
            </div>

            {/* Toggle Expand/Collapse */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 h-8 text-zinc-300"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" /> Ocultar Detalhes
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" /> Configurar Regras
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* TELEMETRIA & ESTATÍSTICAS RÁPIDAS (Sempre Visíveis) */}
      <div className="px-5 py-3 border-y border-zinc-800/80 bg-zinc-900/40">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Spams Bloqueados */}
          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Spams Bloqueados</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-rose-400 font-mono">
                  {antiSpam.stats?.totalBlocked || 0}
                </span>
                <span className="text-[10px] text-muted-foreground">tentativas</span>
              </div>
            </div>
          </div>

          {/* 2. Último Ataque */}
          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Último Bloqueio</span>
              <span className="text-xs font-bold text-zinc-200 truncate block font-mono">
                {antiSpam.stats?.lastBlockedAt
                  ? new Date(antiSpam.stats.lastBlockedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "Nenhum recente"}
              </span>
            </div>
          </div>

          {/* 3. Motivo do Bloqueio */}
          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
              <Flame className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Último Motivo</span>
              <span
                className="text-xs font-semibold text-violet-300 truncate block"
                title={antiSpam.stats?.lastBlockedReason || "Nenhum ataque detectado"}
              >
                {antiSpam.stats?.lastBlockedReason || "Proteção limpa"}
              </span>
            </div>
          </div>

          {/* 4. Auto-Purga / Status Bot */}
          <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Zap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Auto-Purga</span>
                <span className="text-xs font-bold text-emerald-400 truncate block">
                  {antiSpam.autoDeleteChannelSpam ? "Ativa nos canais" : "Desativada"}
                </span>
              </div>
            </div>
            {antiSpam.stats?.totalBlocked && antiSpam.stats.totalBlocked > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetStats}
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-rose-400"
                title="Zerar contador de bloqueios"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* CONTEÚDO EXPANSÍVEL: MÓDULOS DE PROTEÇÃO, LIMITES, LISTAS E TESTADOR */}
      {isExpanded && (
        <CardContent className="p-5 space-y-6 animate-in fade-in-30 duration-200">
          {/* SEÇÃO 1: MÓDULOS DE PROTEÇÃO ATIVA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Módulos de Proteção em Tempo Real
              </h4>
              <span className="text-[10px] text-muted-foreground font-mono">
                Intercepta HTTP & Webhooks do Discord
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Toggle 1: Bloquear Telegram */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-3 hover:border-zinc-700 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Radio className="h-4 w-4 text-blue-400 shrink-0" />
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      Bloquear Links do Telegram
                    </Label>
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
                    Bloqueia domínios `t.me/*`, `telegram.me/*` e divulgações de canais como `A_ToolsX`.
                  </p>
                </div>
                <Switch
                  checked={antiSpam.blockTelegramLinks}
                  onCheckedChange={(val) => updateAntiSpam({ blockTelegramLinks: val })}
                />
              </div>

              {/* Toggle 2: Bloquear Convites Discord */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-3 hover:border-zinc-700 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-indigo-400 shrink-0" />
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      Bloquear Convites Discord
                    </Label>
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
                    Bloqueia `discord.gg/*` e links de convite para outros servidores e facções.
                  </p>
                </div>
                <Switch
                  checked={antiSpam.blockDiscordInvites}
                  onCheckedChange={(val) => updateAntiSpam({ blockDiscordInvites: val })}
                />
              </div>

              {/* Toggle 3: Bloquear Phishing & Scams */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-3 hover:border-zinc-700 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <AlertOctagon className="h-4 w-4 text-rose-400 shrink-0" />
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      Bloquear Phishing & Nitro Scams
                    </Label>
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
                    Bloqueia termos como Free Nitro, Steam gift card e falsos airdrops de criptomoeda.
                  </p>
                </div>
                <Switch
                  checked={antiSpam.blockPhishingLinks}
                  onCheckedChange={(val) => updateAntiSpam({ blockPhishingLinks: val })}
                />
              </div>

              {/* Toggle 4: Bloquear IP Loggers & Grabbers */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-3 hover:border-zinc-700 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      Bloquear IP Loggers & Grabbers
                    </Label>
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
                    Bloqueia encurtadores maliciosos como Grabify, IPLogger, 2no.co e yip.su.
                  </p>
                </div>
                <Switch
                  checked={antiSpam.blockIpLoggers}
                  onCheckedChange={(val) => updateAntiSpam({ blockIpLoggers: val })}
                />
              </div>

              {/* Toggle 5: Auto-Deletar Spam dos Canais */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-violet-900/30 flex items-start justify-between gap-3 hover:border-violet-700/50 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-violet-400 shrink-0" />
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      Auto-Deletar Spam dos Canais
                    </Label>
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
                    O bot apaga instantaneamente mensagens maliciosas detectadas nos canais do Discord.
                  </p>
                </div>
                <Switch
                  checked={antiSpam.autoDeleteChannelSpam}
                  onCheckedChange={(val) => updateAntiSpam({ autoDeleteChannelSpam: val })}
                />
              </div>

              {/* Toggle 6: Notificar Bloqueios */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start justify-between gap-3 hover:border-zinc-700 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-emerald-400 shrink-0" />
                    <Label className="text-xs font-bold text-foreground cursor-pointer">
                      Telemetria & Logs em Tempo Real
                    </Label>
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
                    Registra IPs bloqueados e detalhes técnicos para auditoria do CEO e desenvolvedores.
                  </p>
                </div>
                <Switch
                  checked={antiSpam.notifyOnSpamBlocked}
                  onCheckedChange={(val) => updateAntiSpam({ notifyOnSpamBlocked: val })}
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: LIMITES DE TRÁFEGO & RATE LIMITING */}
          <div className="space-y-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
              <div className="flex items-start sm:items-center gap-2.5">
                <Sliders className="h-4 w-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black tracking-wider uppercase text-foreground">
                      Limites de Tráfego & Anti-Flood (Rate Limiting)
                    </h4>
                    {(antiSpam.rateLimitEnabled ?? true) ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] font-bold py-0 h-4">
                        Ativado
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[9px] font-bold py-0 h-4">
                        Desativado
                      </Badge>
                    )}
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground mt-0.5">
                    Controle de vazão por IP e canal para proteger contra ataques, sobrecargas e spam em massa.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto bg-zinc-950/80 px-2.5 py-1.5 rounded-lg border border-zinc-800 shrink-0">
                <Label htmlFor="master-ratelimit" className="text-[11px] font-bold text-foreground cursor-pointer">
                  {(antiSpam.rateLimitEnabled ?? true) ? "Rate Limit Ativo" : "Rate Limit Desligado"}
                </Label>
                <Switch
                  id="master-ratelimit"
                  checked={antiSpam.rateLimitEnabled ?? true}
                  onCheckedChange={(val) => updateAntiSpam({ rateLimitEnabled: val })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Limite por IP */}
              <div
                className={cn(
                  "p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all",
                  (antiSpam.rateLimitEnabled ?? true) && (antiSpam.ipRateLimitEnabled ?? true)
                    ? "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                    : "bg-zinc-950/30 border-zinc-800/50 opacity-70"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Radio className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <Label className="text-xs font-bold text-foreground cursor-pointer truncate">
                        Req. Máximas por IP / min
                      </Label>
                    </div>
                    <Switch
                      checked={(antiSpam.rateLimitEnabled ?? true) && (antiSpam.ipRateLimitEnabled ?? true)}
                      disabled={!(antiSpam.rateLimitEnabled ?? true)}
                      onCheckedChange={(val) => updateAntiSpam({ ipRateLimitEnabled: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-mono">Limite Atual:</span>
                    {(antiSpam.rateLimitEnabled ?? true) && (antiSpam.ipRateLimitEnabled ?? true) ? (
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 text-primary bg-primary/10 border-primary/30 font-bold">
                        {antiSpam.maxRequestsPerMinutePerIp} req/min
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 text-muted-foreground bg-zinc-900 border-zinc-800">
                        Sem limite
                      </Badge>
                    )}
                  </div>

                  <Input
                    type="number"
                    min={1}
                    max={100000}
                    disabled={!((antiSpam.rateLimitEnabled ?? true) && (antiSpam.ipRateLimitEnabled ?? true))}
                    value={antiSpam.maxRequestsPerMinutePerIp}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateAntiSpam({
                        maxRequestsPerMinutePerIp: isNaN(val) ? 25 : Math.max(1, val),
                      });
                    }}
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold h-8"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {[25, 100, 500, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={!((antiSpam.rateLimitEnabled ?? true) && (antiSpam.ipRateLimitEnabled ?? true))}
                        onClick={() => updateAntiSpam({ maxRequestsPerMinutePerIp: preset })}
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                          antiSpam.maxRequestsPerMinutePerIp === preset && (antiSpam.rateLimitEnabled ?? true) && (antiSpam.ipRateLimitEnabled ?? true)
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[0.65rem] text-muted-foreground leading-tight">
                  {(antiSpam.rateLimitEnabled ?? true) && (antiSpam.ipRateLimitEnabled ?? true)
                    ? "Bloqueia temporariamente com HTTP 429 se um IP ultrapassar esse limite."
                    : "Requisições de IPs não sofrerão limitação de velocidade."}
                </p>
              </div>

              {/* Limite por Canal */}
              <div
                className={cn(
                  "p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all",
                  (antiSpam.rateLimitEnabled ?? true) && (antiSpam.channelRateLimitEnabled ?? true)
                    ? "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                    : "bg-zinc-950/30 border-zinc-800/50 opacity-70"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <Label className="text-xs font-bold text-foreground cursor-pointer truncate">
                        Msgs Máximas por Canal / min
                      </Label>
                    </div>
                    <Switch
                      checked={(antiSpam.rateLimitEnabled ?? true) && (antiSpam.channelRateLimitEnabled ?? true)}
                      disabled={!(antiSpam.rateLimitEnabled ?? true)}
                      onCheckedChange={(val) => updateAntiSpam({ channelRateLimitEnabled: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-mono">Limite Atual:</span>
                    {(antiSpam.rateLimitEnabled ?? true) && (antiSpam.channelRateLimitEnabled ?? true) ? (
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 text-primary bg-primary/10 border-primary/30 font-bold">
                        {antiSpam.maxMessagesPerMinutePerChannel} msg/min
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 text-muted-foreground bg-zinc-900 border-zinc-800">
                        Sem limite
                      </Badge>
                    )}
                  </div>

                  <Input
                    type="number"
                    min={1}
                    max={100000}
                    disabled={!((antiSpam.rateLimitEnabled ?? true) && (antiSpam.channelRateLimitEnabled ?? true))}
                    value={antiSpam.maxMessagesPerMinutePerChannel}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateAntiSpam({
                        maxMessagesPerMinutePerChannel: isNaN(val) ? 20 : Math.max(1, val),
                      });
                    }}
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold h-8"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {[20, 60, 120, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={!((antiSpam.rateLimitEnabled ?? true) && (antiSpam.channelRateLimitEnabled ?? true))}
                        onClick={() => updateAntiSpam({ maxMessagesPerMinutePerChannel: preset })}
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                          antiSpam.maxMessagesPerMinutePerChannel === preset && (antiSpam.rateLimitEnabled ?? true) && (antiSpam.channelRateLimitEnabled ?? true)
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[0.65rem] text-muted-foreground leading-tight">
                  {(antiSpam.rateLimitEnabled ?? true) && (antiSpam.channelRateLimitEnabled ?? true)
                    ? "Evita que um canal específico do Discord seja inundado com disparos em lote."
                    : "Disparos no canal não sofrerão limitação de velocidade."}
                </p>
              </div>

              {/* Janela Anti-Duplicação */}
              <div
                className={cn(
                  "p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition-all",
                  (antiSpam.duplicateProtectionEnabled ?? true)
                    ? "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                    : "bg-zinc-950/30 border-zinc-800/50 opacity-70"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <Label className="text-xs font-bold text-foreground cursor-pointer truncate">
                        Janela Anti-Duplicação
                      </Label>
                    </div>
                    <Switch
                      checked={antiSpam.duplicateProtectionEnabled ?? true}
                      onCheckedChange={(val) => updateAntiSpam({ duplicateProtectionEnabled: val })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-mono">Janela Atual:</span>
                    {(antiSpam.duplicateProtectionEnabled ?? true) ? (
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 text-primary bg-primary/10 border-primary/30 font-bold">
                        {antiSpam.duplicateWindowSeconds}s
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 text-muted-foreground bg-zinc-900 border-zinc-800">
                        Desativada
                      </Badge>
                    )}
                  </div>

                  <Input
                    type="number"
                    min={1}
                    max={3600}
                    disabled={!(antiSpam.duplicateProtectionEnabled ?? true)}
                    value={antiSpam.duplicateWindowSeconds}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateAntiSpam({
                        duplicateWindowSeconds: isNaN(val) ? 45 : Math.max(1, val),
                      });
                    }}
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold h-8"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {[5, 15, 45, 120].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={!(antiSpam.duplicateProtectionEnabled ?? true)}
                        onClick={() => updateAntiSpam({ duplicateWindowSeconds: preset })}
                        className={cn(
                          "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                          antiSpam.duplicateWindowSeconds === preset && (antiSpam.duplicateProtectionEnabled ?? true)
                            ? "bg-primary text-primary-foreground border-primary font-bold"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800"
                        )}
                      >
                        {preset}s
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[0.65rem] text-muted-foreground leading-tight">
                  {(antiSpam.duplicateProtectionEnabled ?? true)
                    ? "Descarta silenciosamente mensagens de mesmo conteúdo enviadas em sequência rápida."
                    : "Mensagens duplicadas serão enviadas normalmente sem descarte."}
                </p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: LISTAS CUSTOMIZADAS DE PALAVRAS E DOMÍNIOS PROIBIDOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 3.1 Palavras & Frases Proibidas */}
            <div className="space-y-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-rose-400" />
                    Frases e Termos Proibidos ({antiSpam.customBlockedPhrases.length})
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={newPhrase}
                    onChange={(e) => setNewPhrase(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPhrase();
                      }
                    }}
                    placeholder="Adicionar frase proibida (ex: to use this bot)..."
                    className="bg-zinc-950 border-zinc-800 text-xs h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddPhrase}
                    className="bg-zinc-800 hover:bg-zinc-700 text-foreground font-bold text-xs h-8 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                  {antiSpam.customBlockedPhrases.map((phrase) => (
                    <Badge
                      key={phrase}
                      variant="outline"
                      className="bg-zinc-900 border-zinc-800 text-zinc-300 text-[11px] font-mono py-0.5 px-2 flex items-center gap-1.5 hover:border-rose-500/50"
                    >
                      <span>{phrase}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhrase(phrase)}
                        className="text-muted-foreground hover:text-rose-400 transition-colors"
                        title="Remover termo"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* 3.2 Domínios Proibidos */}
            <div className="space-y-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-blue-400" />
                    Domínios e URLs Proibidas ({antiSpam.customBlockedDomains.length})
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDomain();
                      }
                    }}
                    placeholder="Adicionar domínio (ex: t.me, grabify.link)..."
                    className="bg-zinc-950 border-zinc-800 text-xs h-8 font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddDomain}
                    className="bg-zinc-800 hover:bg-zinc-700 text-foreground font-bold text-xs h-8 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-lg bg-zinc-950 border border-zinc-800/80">
                  {antiSpam.customBlockedDomains.map((domain) => (
                    <Badge
                      key={domain}
                      variant="outline"
                      className="bg-zinc-900 border-zinc-800 text-zinc-300 text-[11px] font-mono py-0.5 px-2 flex items-center gap-1.5 hover:border-blue-500/50"
                    >
                      <span>{domain}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        className="text-muted-foreground hover:text-rose-400 transition-colors"
                        title="Remover domínio"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: SIMULADOR & TESTADOR INTERATIVO EM TEMPO REAL */}
          <div className="space-y-4 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h4 className="text-xs font-black tracking-wider uppercase text-foreground flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  Simulador & Testador de Regras em Tempo Real
                </h4>
                <p className="text-[0.68rem] text-muted-foreground mt-0.5">
                  Cole um link direto de mensagem do Discord (<code className="text-primary font-mono">discord.com/channels/...</code>), texto livre ou payload para testar o escudo.
                </p>
              </div>

              {/* Botões de Predefinição Rápida */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTestInput(sampleDiscordMessageUrl);
                    handleRunTest(sampleDiscordMessageUrl);
                  }}
                  className="h-7 text-[11px] bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 gap-1 font-bold"
                  title="Carregar mensagem real do canal #baus-qg"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  Log Baú (#baus-qg)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTestInput(sampleAttackPayload);
                    handleRunTest(sampleAttackPayload);
                  }}
                  className="h-7 text-[11px] bg-violet-500/10 border-violet-500/30 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200 gap-1 font-bold"
                  title="Carregar payload de ataque spammer Telegram / A_ToolsX"
                >
                  <Flame className="h-3 w-3 text-violet-400" />
                  Invasão Telegram
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTestInput(sampleDiscordInvitePayload);
                    handleRunTest(sampleDiscordInvitePayload);
                  }}
                  className="h-7 text-[11px] bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200 gap-1 font-bold"
                  title="Carregar link de convite externo"
                >
                  <Globe className="h-3 w-3 text-indigo-400" />
                  Convite Discord
                </Button>

                {(testInput || fetchedDiscordMessage || testResult) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTestInput("");
                      setFetchedDiscordMessage(null);
                      setTestResult(null);
                    }}
                    className="h-7 text-[11px] text-zinc-400 hover:text-rose-400 gap-1 px-2"
                    title="Limpar simulador"
                  >
                    <Trash2 className="h-3 w-3" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Exemplo de link: https://discord.com/channels/1535505650308620400/1535637509818548234/1556473932079697952&#10;Ou cole um texto / propaganda / domínio suspeito..."
                  className="bg-zinc-950 border-zinc-800 text-xs font-mono min-h-[78px] pr-10 focus-visible:ring-primary/40"
                />
                {fetchingDiscordMessage && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/90 border border-zinc-700 text-[10px] text-zinc-300 font-mono">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    Buscando mensagem...
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={fetchingDiscordMessage || !testInput.trim()}
                    onClick={() => handleRunTest()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 h-8 shadow-sm"
                  >
                    {fetchingDiscordMessage ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Inspecionando Discord...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Verificar Bloqueio
                      </>
                    )}
                  </Button>

                  <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                    {testInput.includes("discord.com/channels/")
                      ? "🔗 Link de Mensagem do Discord detectado"
                      : "📝 Modo Análise de Texto"}
                  </span>
                </div>

                {activeVerdict && (
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all animate-in fade-in-50",
                      activeVerdict.blocked
                        ? "bg-rose-500/10 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/20"
                        : "bg-emerald-500/10 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/20"
                    )}
                  >
                    {activeVerdict.blocked ? (
                      <>
                        <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                        <span>🛑 BLOQUEADO: {activeVerdict.reason}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>✅ {activeVerdict.reason}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* CARD DE PREVIEW DA MENSAGEM REAL DO DISCORD */}
              {fetchedDiscordMessage && (
                <div className="mt-4 rounded-xl border border-zinc-800 bg-[#1e1f22]/90 shadow-2xl overflow-hidden animate-in fade-in-50 duration-200">
                  {/* Barra Superior do Canal Discord */}
                  <div className="px-4 py-2.5 bg-[#18191c] border-b border-[#2b2d31] flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1 rounded bg-[#2b2d31] text-zinc-400">
                        <Hash className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-bold text-zinc-200 truncate font-mono">
                        #{fetchedDiscordMessage.channelName || fetchedDiscordMessage.channelId}
                      </span>
                      {fetchedDiscordMessage.guildName && (
                        <span className="text-[11px] text-zinc-500 truncate hidden sm:inline">
                          • {fetchedDiscordMessage.guildName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className="bg-[#2b2d31] text-zinc-400 border-[#35373c] text-[10px] font-mono h-5 px-1.5"
                      >
                        ID: {fetchedDiscordMessage.id}
                      </Badge>
                      <a
                        href={fetchedDiscordMessage.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#5865F2] hover:underline font-bold"
                      >
                        Abrir no Discord
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  {/* Corpo da Mensagem do Discord */}
                  <div className="p-4 space-y-3">
                    {/* Linha do Autor */}
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          fetchedDiscordMessage.author.avatarUrl ||
                          "https://cdn.discordapp.com/embed/avatars/0.png"
                        }
                        alt="Avatar"
                        className="h-10 w-10 rounded-full object-cover shrink-0 border border-zinc-700 bg-zinc-900"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-zinc-100 hover:underline cursor-pointer">
                            {fetchedDiscordMessage.author.username}
                          </span>
                          {(fetchedDiscordMessage.author.bot || fetchedDiscordMessage.author.webhookId) && (
                            <span className="bg-[#5865F2] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {fetchedDiscordMessage.author.webhookId ? "Webhook" : "Bot"}
                            </span>
                          )}
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {new Date(fetchedDiscordMessage.createdAt).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Conteúdo de Texto da Mensagem */}
                        {fetchedDiscordMessage.content && (
                          <div className="text-sm text-zinc-200 mt-1.5 whitespace-pre-wrap leading-relaxed font-sans">
                            {fetchedDiscordMessage.content}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Preview de Embeds do Discord */}
                    {fetchedDiscordMessage.embeds && fetchedDiscordMessage.embeds.length > 0 && (
                      <div className="space-y-3 pl-0 sm:pl-13">
                        {fetchedDiscordMessage.embeds.map((emb, idx) => {
                          const borderHex =
                            typeof emb.color === "number"
                              ? `#${emb.color.toString(16).padStart(6, "0")}`
                              : emb.color || "#f59e0b";

                          return (
                            <div
                              key={idx}
                              style={{ borderLeftColor: borderHex }}
                              className="rounded-r-lg border-l-4 bg-[#2b2d31]/90 p-3.5 space-y-2.5 max-w-2xl border border-y-[#1e1f22] border-r-[#1e1f22] shadow-sm"
                            >
                              {/* Embed Author */}
                              {emb.author && (
                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                                  {emb.author.iconUrl && (
                                    <img
                                      src={emb.author.iconUrl}
                                      alt="Author Icon"
                                      className="h-5 w-5 rounded-full object-cover"
                                    />
                                  )}
                                  <span>{emb.author.name}</span>
                                </div>
                              )}

                              {/* Embed Title */}
                              {emb.title && (
                                <div className="font-bold text-sm text-zinc-100">
                                  {emb.url ? (
                                    <a
                                      href={emb.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[#00a8fc] hover:underline"
                                    >
                                      {emb.title}
                                    </a>
                                  ) : (
                                    emb.title
                                  )}
                                </div>
                              )}

                              {/* Embed Description */}
                              {emb.description && (
                                <div className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                                  {emb.description}
                                </div>
                              )}

                              {/* Embed Fields */}
                              {emb.fields && emb.fields.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                  {emb.fields.map((field, fIdx) => (
                                    <div
                                      key={fIdx}
                                      className={cn(
                                        "p-2 rounded bg-[#1e1f22]/70 border border-[#35373c]/50",
                                        field.inline ? "col-span-1" : "col-span-full"
                                      )}
                                    >
                                      <div className="text-[11px] font-bold text-zinc-400">
                                        {field.name}
                                      </div>
                                      <div className="text-xs text-zinc-200 whitespace-pre-wrap mt-0.5 font-mono">
                                        {field.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Embed Image */}
                              {emb.image?.url && (
                                <div className="pt-2">
                                  <img
                                    src={emb.image.url}
                                    alt="Embed Image"
                                    className="max-h-60 rounded-md object-contain border border-zinc-700"
                                  />
                                </div>
                              )}

                              {/* Embed Footer */}
                              {emb.footer && (
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 pt-1 border-t border-[#35373c]/40">
                                  {emb.footer.iconUrl && (
                                    <img
                                      src={emb.footer.iconUrl}
                                      alt="Footer Icon"
                                      className="h-4 w-4 rounded-full"
                                    />
                                  )}
                                  <span>{emb.footer.text}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Attachments / Anexos */}
                    {fetchedDiscordMessage.attachments &&
                      fetchedDiscordMessage.attachments.length > 0 && (
                        <div className="pt-2 pl-0 sm:pl-13 space-y-1.5">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase block">
                            Anexos ({fetchedDiscordMessage.attachments.length})
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {fetchedDiscordMessage.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg bg-[#2b2d31] border border-[#35373c] text-xs text-zinc-300 hover:text-white transition-colors"
                              >
                                <Paperclip className="h-3.5 w-3.5 text-primary" />
                                <span className="font-mono">{att.name}</span>
                                {att.size && (
                                  <span className="text-[10px] text-zinc-500">
                                    ({Math.round(att.size / 1024)} KB)
                                  </span>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Banner de Auditoria do Firewall */}
                    <div
                      className={cn(
                        "mt-4 p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs",
                        activeVerdict?.blocked
                          ? "bg-rose-950/40 border-rose-500/50 text-rose-200"
                          : "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {activeVerdict?.blocked ? (
                          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
                        ) : (
                          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold">
                            {activeVerdict?.blocked
                              ? "Ação do Firewall: Mensagem seria INTERCEPTADA e DESCARTADA"
                              : "Ação do Firewall: Mensagem AUTORIZADA para entrega no Discord"}
                          </div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            {activeVerdict?.reason}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono",
                            antiSpam.blockTelegramLinks ? "border-blue-500/40 text-blue-400" : "opacity-40"
                          )}
                        >
                          Telegram: {antiSpam.blockTelegramLinks ? "ON" : "OFF"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono",
                            antiSpam.blockDiscordInvites ? "border-indigo-500/40 text-indigo-400" : "opacity-40"
                          )}
                        >
                          Convites: {antiSpam.blockDiscordInvites ? "ON" : "OFF"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono",
                            antiSpam.blockPhishingLinks ? "border-rose-500/40 text-rose-400" : "opacity-40"
                          )}
                        >
                          Phishing: {antiSpam.blockPhishingLinks ? "ON" : "OFF"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}

      {/* FOOTER DE AÇÕES */}
      <CardFooter className="p-4 border-t border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between gap-3 flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleResetDefaults}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restaurar Padrão Recomendado
        </Button>

        {canSave && (
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs gap-1.5 shadow-lg shadow-rose-950/40 ml-auto"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar Regras do Escudo
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
