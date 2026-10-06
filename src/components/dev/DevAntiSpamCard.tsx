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

  // Simulador de Verificação em Tempo Real no Frontend
  const handleRunTest = () => {
    if (!testInput.trim()) {
      setTestResult(null);
      return;
    }

    if (!antiSpam.enabled) {
      setTestResult({
        blocked: false,
        reason: "O escudo anti-spam está desativado no momento.",
      });
      return;
    }

    const lower = testInput.toLowerCase();

    // 1. Telegram
    if (antiSpam.blockTelegramLinks) {
      if (/t\.me\/[a-z0-9_]+/i.test(lower) || /telegram\.me\/[a-z0-9_]+/i.test(lower) || /@a_toolsx/i.test(lower)) {
        setTestResult({
          blocked: true,
          reason: "Link ou canal de divulgação do Telegram detectado.",
          matchedPattern: "Telegram URL / Invite",
        });
        return;
      }
    }

    // 2. Discord Invites
    if (antiSpam.blockDiscordInvites) {
      if (/(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[a-z0-9-_]+/i.test(lower)) {
        setTestResult({
          blocked: true,
          reason: "Link de convite para outro servidor Discord detectado.",
          matchedPattern: "Discord Invite Link",
        });
        return;
      }
    }

    // 3. Phishing / Grabbers
    if (antiSpam.blockPhishingLinks || antiSpam.blockIpLoggers) {
      const knownMalicious = [
        "grabify.link",
        "iplogger",
        "2no.co",
        "yip.su",
        "free-nitro",
        "discord-nitro",
        "steamcommunity-nitro",
        "airdrop-token",
      ];
      for (const mal of knownMalicious) {
        if (lower.includes(mal)) {
          setTestResult({
            blocked: true,
            reason: `Link malicioso / rastreador de IP detectado: ${mal}`,
            matchedPattern: mal,
          });
          return;
        }
      }
    }

    // 4. Domínios customizados
    if (antiSpam.customBlockedDomains && antiSpam.customBlockedDomains.length > 0) {
      for (const dom of antiSpam.customBlockedDomains) {
        if (dom && lower.includes(dom.toLowerCase())) {
          setTestResult({
            blocked: true,
            reason: `Domínio proibido pela lista personalizada: ${dom}`,
            matchedPattern: dom,
          });
          return;
        }
      }
    }

    // 5. Frases customizadas
    if (antiSpam.customBlockedPhrases && antiSpam.customBlockedPhrases.length > 0) {
      for (const phrase of antiSpam.customBlockedPhrases) {
        if (phrase && lower.includes(phrase.toLowerCase())) {
          setTestResult({
            blocked: true,
            reason: `Palavra / frase proibida detectada: "${phrase}"`,
            matchedPattern: phrase,
          });
          return;
        }
      }
    }

    setTestResult({
      blocked: false,
      reason: "Mensagem 100% limpa e autorizada pelo escudo de segurança!",
    });
  };

  const sampleAttackPayload = `🚀 To use this bot, you must join our channel: https://t.me/A_ToolsX

Telegram

A-TOOLS X

💻 Programming & Development Tools • Resources • Services Everything you need in one place. ⚡`;

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
          <div className="space-y-3 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                Simulador & Testador de Regras em Tempo Real
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTestInput(sampleAttackPayload);
                }}
                className="h-6 text-[10px] text-violet-400 hover:text-violet-300 gap-1 font-bold"
              >
                <Sparkles className="h-3 w-3" />
                Carregar Payload da Invasão Recente
              </Button>
            </div>

            <div className="space-y-2">
              <Textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Cole um texto ou link aqui para testar se o escudo do bot interceptaria..."
                className="bg-zinc-950 border-zinc-800 text-xs font-mono min-h-[70px]"
              />

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRunTest}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 h-8"
                >
                  <Send className="h-3 w-3" />
                  Verificar Bloqueio
                </Button>

                {testResult && (
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border animate-in fade-in-50",
                      testResult.blocked
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    )}
                  >
                    {testResult.blocked ? (
                      <>
                        <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                        <span>🛑 BLOQUEADO: {testResult.reason}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>✅ {testResult.reason}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
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
