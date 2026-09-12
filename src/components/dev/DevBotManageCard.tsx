import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Bot,
  Play,
  Square,
  RotateCcw,
  UserPlus,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Image as ImageIcon,
  KeyRound,
  Eye,
  EyeOff,
  ClipboardPaste,
  ShieldCheck,
  Gamepad2,
  Headphones,
  Tv,
  Trophy,
  Radio,
  Sparkles,
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cloud,
  ChevronDown,
  Info,
  Clock,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  getDiscordBotConfig,
  saveDiscordBotConfig,
  DEFAULT_DISCORD_CONFIG,
  type DiscordBotConfig,
} from "@/services/discordService";
import {
  validateDiscordBotToken,
  sendBotLifecycleCommand,
  generateBotInviteUrl,
  getDeveloperPortalUrl,
  subscribeToBotHeartbeat,
  BANNER_PRESETS,
  type BotHeartbeatData,
  type DiscordUserValidationResult,
} from "@/services/discordBotManageService";
import { cn } from "@/lib/utils";

export function DevBotManageCard() {
  const { user, profile, level } = useAuth();

  const [config, setConfig] = useState<DiscordBotConfig>(DEFAULT_DISCORD_CONFIG);
  const [initialConfig, setInitialConfig] = useState<DiscordBotConfig>(DEFAULT_DISCORD_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados de ciclo de vida do bot
  const [actionLoading, setActionLoading] = useState<"start" | "stop" | "restart" | null>(null);

  // Estados de cópia
  const [copiedId, setCopiedId] = useState(false);

  // Estados para Token
  const [showToken, setShowToken] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<DiscordUserValidationResult | null>(null);

  // Modais
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerUrlInput, setBannerUrlInput] = useState("");

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarInput, setAvatarInput] = useState("");

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTextInput, setStatusTextInput] = useState("");
  const [activityTypeInput, setActivityTypeInput] = useState<
    "Playing" | "Watching" | "Listening" | "Competing" | "Streaming" | "Custom"
  >("Playing");
  const [streamingUrlInput, setStreamingUrlInput] = useState("");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [customPermissions, setCustomPermissions] = useState("8"); // 8 = Administrator

  // Heartbeat do bot em tempo real
  const [heartbeat, setHeartbeat] = useState<BotHeartbeatData | null>(null);
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<number | null>(null);

  // Carrega configurações
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getDiscordBotConfig()
      .then((data) => {
        if (isMounted) {
          setConfig(data);
          setInitialConfig(JSON.parse(JSON.stringify(data)));
          setTokenInput(data.botToken || "");
          setBannerUrlInput(data.botBannerUrl || "");
          setNameInput(data.botName || "Roda Dupla");
          setAvatarInput(data.botAvatarUrl || "");
          setStatusTextInput(data.botStatusText || "Feito com Twin Wheels");
          setActivityTypeInput(data.botActivityType || "Playing");
          setStreamingUrlInput(data.botStreamingUrl || "");
        }
      })
      .catch((err) => {
        if (isMounted) {
          toast.error("Falha ao carregar configurações do bot: " + (err?.message || err));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // Subscrição do heartbeat em tempo real
    const unsubscribe = subscribeToBotHeartbeat((data) => {
      if (isMounted) {
        setHeartbeat(data);
        setLastHeartbeatTime(Date.now());
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Detecta se bot está respondendo recentemente
  const isHeartbeatActive = useMemo(() => {
    if (!lastHeartbeatTime) return false;
    return Date.now() - lastHeartbeatTime < 35000;
  }, [lastHeartbeatTime]);

  // Status visual efetivo do bot
  const currentPresence = config.botStatus || "online";
  const isBotRunning = config.isBotRunning !== false;

  // Salva alteração individual de configuração
  const handleUpdateConfig = async (patch: Partial<DiscordBotConfig>, successMsg?: string) => {
    const updated = { ...config, ...patch };
    setConfig(updated);
    setSaving(true);
    try {
      await saveDiscordBotConfig(updated, user, profile, level);
      setInitialConfig(JSON.parse(JSON.stringify(updated)));
      if (successMsg) toast.success(successMsg);
    } catch (err: any) {
      toast.error("Erro ao salvar configuração: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Ciclo de vida: Iniciar, Desligar ou Reiniciar
  const handleLifecycle = async (action: "start" | "stop" | "restart") => {
    setActionLoading(action);
    try {
      const res = await sendBotLifecycleCommand(action, config, user, profile, level);
      if (res.success) {
        toast.success(res.message);
        setConfig((prev) => ({
          ...prev,
          isBotRunning: action === "stop" ? false : true,
        }));
      }
    } catch (err: any) {
      toast.error(`Falha ao executar ${action}: ` + (err?.message || err));
    } finally {
      setActionLoading(null);
    }
  };

  // Copia o ID do usuário do bot
  const handleCopyId = () => {
    const idToCopy = config.clientId || "1536184283197079622";
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    toast.success("ID do bot copiado para a área de transferência!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Colar token da área de transferência
  const handlePasteToken = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
        toast.success("Token colado da área de transferência!");
      }
    } catch {
      toast.error("Não foi possível acessar a área de transferência.");
    }
  };

  // Testar e Validar Token contra API oficial do Discord
  const handleValidateToken = async () => {
    if (!tokenInput || tokenInput.trim().length < 20) {
      toast.error("Insira um token do Discord válido.");
      return;
    }
    setIsValidatingToken(true);
    setTokenValidation(null);
    try {
      const result = await validateDiscordBotToken(tokenInput);
      setTokenValidation(result);
      if (result.valid && result.user) {
        toast.success(`Token válido! Bot identificado: ${result.user.username} (ID: ${result.user.id})`);
        // Oportunidade de atualizar dados do bot automaticamente
        if (result.user.avatar && !config.botAvatarUrl) {
          handleUpdateConfig({ botAvatarUrl: result.user.avatar });
        }
      } else {
        toast.error(result.error || "Token do Discord inválido.");
      }
    } catch (err: any) {
      toast.error("Erro ao validar token: " + (err?.message || err));
    } finally {
      setIsValidatingToken(false);
    }
  };

  // Salvar novo token
  const handleSaveToken = async () => {
    if (!tokenInput) return;
    await handleUpdateConfig(
      { botToken: tokenInput.trim() },
      "Token do bot salvo e sincronizado com segurança!"
    );
  };

  // Salvar Banner
  const handleSaveBanner = async () => {
    if (!bannerUrlInput) return;
    await handleUpdateConfig(
      { botBannerUrl: bannerUrlInput.trim() },
      "Banner do bot atualizado com sucesso!"
    );
    setIsBannerModalOpen(false);
  };

  // Salvar Nome
  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    await handleUpdateConfig(
      { botName: nameInput.trim() },
      "Nome do bot atualizado!"
    );
    setIsNameModalOpen(false);
  };

  // Salvar Avatar
  const handleSaveAvatar = async () => {
    if (!avatarInput.trim()) return;
    await handleUpdateConfig(
      { botAvatarUrl: avatarInput.trim() },
      "Avatar do bot atualizado!"
    );
    setIsAvatarModalOpen(false);
  };

  // Salvar Mensagem de Status
  const handleSaveStatus = async () => {
    await handleUpdateConfig(
      {
        botStatusText: statusTextInput.trim() || "Feito com Twin Wheels",
        botActivityType: activityTypeInput,
        botStreamingUrl: streamingUrlInput.trim(),
      },
      "Mensagem de status e atividade atualizadas!"
    );
    setIsStatusModalOpen(false);
  };

  // Ícone da atividade
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "Watching":
        return <Tv className="h-4 w-4" />;
      case "Listening":
        return <Headphones className="h-4 w-4" />;
      case "Competing":
        return <Trophy className="h-4 w-4" />;
      case "Streaming":
        return <Radio className="h-4 w-4" />;
      default:
        return <Gamepad2 className="h-4 w-4" />;
    }
  };

  // Label amigável da atividade
  const getActivityLabel = (type: string) => {
    switch (type) {
      case "Watching":
        return "ASSISTINDO";
      case "Listening":
        return "OUVINDO";
      case "Competing":
        return "COMPETINDO";
      case "Streaming":
        return "TRANSMITINDO";
      default:
        return "JOGANDO";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Carregando painel do Bot Discord...</p>
        </div>
      </div>
    );
  }

  const clientId = config.clientId || "1536184283197079622";
  const botName = config.botName || "Roda Dupla";
  const botAvatar = config.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png";
  const botBanner =
    config.botBannerUrl ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop";

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* CABEÇALHO DO BLOCO */}
      <div className="space-y-1">
        <span className="text-[0.7rem] font-bold tracking-widest text-muted-foreground/80 uppercase">
          CONFIGURAÇÕES
        </span>
        <h2 className="text-2xl font-black tracking-tight text-foreground">Perfil do bot</h2>
      </div>

      {/* 1. CARD PRINCIPAL: BANNER + PERFIL DO BOT */}
      <div className="relative rounded-2xl border border-border/60 bg-zinc-950/70 overflow-hidden shadow-2xl backdrop-blur-md">
        {/* BANNER COM BOTÃO DE ALTERAR */}
        <div
          className="relative w-full h-44 sm:h-52 md:h-56 bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(10,10,12,0.85) 100%), url("${botBanner}")`,
          }}
        >
          {/* Botão Alterar Banner */}
          <button
            type="button"
            onClick={() => {
              setBannerUrlInput(config.botBannerUrl || "");
              setIsBannerModalOpen(true);
            }}
            className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white/90 text-xs font-semibold backdrop-blur-md border border-white/15 shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <Edit2 className="h-3.5 w-3.5 text-zinc-300" />
            <span>Alterar banner</span>
          </button>
        </div>

        {/* DETALHES DO PERFIL SOBRE O BANNER */}
        <div className="p-5 sm:p-6 pt-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 -mt-12 sm:-mt-14">
            {/* LADO ESQUERDO: AVATAR + NOME + ID */}
            <div className="flex items-end gap-4">
              {/* Avatar com Anel de Status */}
              <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                <img
                  src={botAvatar}
                  alt={botName}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-4 ring-zinc-950 bg-zinc-900 shadow-2xl transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                  }}
                />
                {/* Indicador de Presença */}
                <div
                  className={cn(
                    "absolute bottom-1 right-1 h-5 w-5 rounded-full ring-4 ring-zinc-950 shadow-md",
                    currentPresence === "online" && "bg-emerald-500",
                    currentPresence === "idle" && "bg-amber-400",
                    currentPresence === "dnd" && "bg-rose-500",
                    currentPresence === "invisible" && "bg-zinc-500"
                  )}
                  title={`Status: ${currentPresence}`}
                />
                {/* Overlay hover para editar avatar */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Edit2 className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Nome + Badges + ID */}
              <div className="space-y-1 pb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    {botName}
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(botName);
                        setIsNameModalOpen(true);
                      }}
                      className="text-muted-foreground hover:text-white transition-colors"
                      title="Alterar nome do bot"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </h3>
                  <Badge className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] tracking-wider px-2 py-0.5 rounded uppercase border-0 shadow-sm">
                    PREMIUM
                  </Badge>
                  {isBotRunning ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      ATIVO
                    </Badge>
                  ) : (
                    <Badge className="bg-zinc-700/50 text-zinc-400 border border-zinc-600 text-[10px] font-bold">
                      DESLIGADO
                    </Badge>
                  )}
                </div>

                {/* Linha de ID e Link do Portal */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>ID do usuário: {clientId}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="hover:text-white transition-colors"
                    title="Copiar ID do Bot"
                  >
                    {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <span className="text-muted-foreground/40">·</span>
                  <a
                    href={getDeveloperPortalUrl(clientId)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline hover:text-primary/80 font-sans transition-colors"
                  >
                    <span>Portal do desenvolvedor</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: BOTÕES DE CONTROLE PRINCIPAIS */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Iniciar / Desligar Bot */}
              {isBotRunning ? (
                <Button
                  onClick={() => handleLifecycle("stop")}
                  disabled={actionLoading !== null}
                  variant="outline"
                  className="bg-emerald-950/40 border-emerald-600/50 text-emerald-400 hover:bg-rose-950/50 hover:border-rose-600/50 hover:text-rose-300 font-bold text-xs gap-2 transition-all shadow-lg group"
                >
                  {actionLoading === "stop" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-emerald-400 text-emerald-400 group-hover:hidden" />
                      <Square className="h-4 w-4 fill-rose-400 text-rose-400 hidden group-hover:inline-block" />
                    </>
                  )}
                  <span className="group-hover:hidden">Bot Ativo</span>
                  <span className="hidden group-hover:inline">Desligar Bot</span>
                </Button>
              ) : (
                <Button
                  onClick={() => handleLifecycle("start")}
                  disabled={actionLoading !== null}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-2 shadow-lg shadow-emerald-900/40"
                >
                  {actionLoading === "start" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 fill-white" />
                  )}
                  Iniciar Bot
                </Button>
              )}

              {/* Reiniciar */}
              <Button
                onClick={() => handleLifecycle("restart")}
                disabled={actionLoading !== null}
                variant="outline"
                className="bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700/60 text-white font-bold text-xs gap-2 shadow-md"
              >
                {actionLoading === "restart" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Reiniciar
              </Button>

              {/* Convidar */}
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs gap-2 shadow-lg shadow-[#5865F2]/20"
              >
                <UserPlus className="h-4 w-4" />
                Convidar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SUB-CARDS: MENSAGEM DE STATUS & PRESENÇA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD ESQUERDO: MENSAGEM DE STATUS */}
        <Card className="surface-card border-border/60 bg-zinc-950/60 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <span className="text-[0.68rem] font-bold tracking-widest text-muted-foreground uppercase">
              MENSAGEM DE STATUS
            </span>
            <CardDescription className="text-xs text-muted-foreground">
              Substitua &quot;Feito com Twin Wheels&quot; pelo seu próprio texto.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Box Preview da Atividade */}
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
              <div className="p-2.5 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-900/40">
                {renderActivityIcon(config.botActivityType || "Playing")}
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-[0.65rem] font-black tracking-wider text-muted-foreground/80 block">
                  {getActivityLabel(config.botActivityType || "Playing")}
                </span>
                <p className="text-sm font-bold text-foreground truncate">
                  {config.botStatusText || "Feito com Twin Wheels"}
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-0">
            <Button
              type="button"
              onClick={() => {
                setStatusTextInput(config.botStatusText || "Feito com Twin Wheels");
                setActivityTypeInput(config.botActivityType || "Playing");
                setStreamingUrlInput(config.botStreamingUrl || "");
                setIsStatusModalOpen(true);
              }}
              className="w-full sm:w-auto bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs px-5 shadow-lg shadow-rose-950/50"
            >
              Definir mensagem de status
            </Button>
          </CardFooter>
        </Card>

        {/* CARD DIREITO: PRESENÇA */}
        <Card className="surface-card border-border/60 bg-zinc-950/60 flex flex-col justify-between">
          <CardHeader className="pb-3">
            <span className="text-[0.68rem] font-bold tracking-widest text-muted-foreground uppercase">
              PRESENÇA
            </span>
            <CardDescription className="text-xs text-muted-foreground leading-relaxed">
              Como seu bot aparece na lista de membros. O Discord pode demorar um pouco para atualizar, então abra o canal novamente se não o vir imediatamente.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Grid 2x2 com as 4 opções de presença */}
            <div className="grid grid-cols-2 gap-3">
              {/* 1. On-line */}
              <button
                type="button"
                onClick={() => handleUpdateConfig({ botStatus: "online" }, "Presença alterada para On-line!")}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all text-left",
                  currentPresence === "online"
                    ? "bg-zinc-900 border-emerald-500/80 text-foreground ring-1 ring-emerald-500/50 shadow-sm"
                    : "bg-zinc-900/40 border-zinc-800 text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                )}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shrink-0" />
                <span>On-line</span>
              </button>

              {/* 2. Parado (Idle) */}
              <button
                type="button"
                onClick={() => handleUpdateConfig({ botStatus: "idle" }, "Presença alterada para Parado!")}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all text-left",
                  currentPresence === "idle"
                    ? "bg-zinc-900 border-amber-500/80 text-foreground ring-1 ring-amber-500/50 shadow-sm"
                    : "bg-zinc-900/40 border-zinc-800 text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                )}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shrink-0" />
                <span>Parado</span>
              </button>

              {/* 3. Não incomodar (DND) */}
              <button
                type="button"
                onClick={() => handleUpdateConfig({ botStatus: "dnd" }, "Presença alterada para Não incomodar!")}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all text-left",
                  currentPresence === "dnd"
                    ? "bg-zinc-900 border-rose-500/80 text-foreground ring-1 ring-rose-500/50 shadow-sm"
                    : "bg-zinc-900/40 border-zinc-800 text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                )}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shrink-0" />
                <span>Não incomodar</span>
              </button>

              {/* 4. Invisível */}
              <button
                type="button"
                onClick={() => handleUpdateConfig({ botStatus: "invisible" }, "Presença alterada para Invisível!")}
                className={cn(
                  "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all text-left",
                  currentPresence === "invisible"
                    ? "bg-zinc-900 border-zinc-500/80 text-foreground ring-1 ring-zinc-500/50 shadow-sm"
                    : "bg-zinc-900/40 border-zinc-800 text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                )}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-500 shadow-sm shrink-0" />
                <span>Invisível</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. CARD: TOKEN DE ACESSO */}
      <Card className="surface-card border-border/60 bg-zinc-950/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-400" />
            <span className="text-[0.68rem] font-bold tracking-widest text-muted-foreground uppercase">
              TOKEN DE ACESSO
            </span>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            O token do seu bot, obtido no{" "}
            <a
              href={getDeveloperPortalUrl(clientId)}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              Portal de Desenvolvedores do Discord
            </a>
            , está sempre oculto aqui: cole um novo para substituí-lo.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Input Mascarado / Visível */}
            <div className="relative flex-1">
              <Input
                type={showToken ? "text" : "password"}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                className="bg-zinc-900/90 border-zinc-800 font-mono text-xs pr-10 focus-visible:ring-amber-500/50"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title={showToken ? "Ocultar token" : "Exibir token"}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Botão Colar */}
            <Button
              type="button"
              variant="outline"
              onClick={handlePasteToken}
              className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 shrink-0"
              title="Colar do clipboard"
            >
              <ClipboardPaste className="h-3.5 w-3.5" />
              Colar
            </Button>

            {/* Botão Testar na API do Discord */}
            <Button
              type="button"
              variant="outline"
              onClick={handleValidateToken}
              disabled={isValidatingToken || !tokenInput}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-xs font-bold gap-1.5 shrink-0"
            >
              {isValidatingToken ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              )}
              Testar Token
            </Button>

            {/* Botão Salvar Substituição */}
            <Button
              type="button"
              onClick={handleSaveToken}
              disabled={saving || tokenInput === config.botToken}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 shrink-0"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Salvar Token
            </Button>
          </div>

          {/* Feedback da Validação do Token */}
          {tokenValidation && (
            <div
              className={cn(
                "p-3 rounded-xl border text-xs flex items-center gap-3 animate-in fade-in-50",
                tokenValidation.valid
                  ? "bg-emerald-950/30 border-emerald-600/40 text-emerald-300"
                  : "bg-rose-950/30 border-rose-600/40 text-rose-300"
              )}
            >
              {tokenValidation.valid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <div>
                {tokenValidation.valid ? (
                  <p>
                    Token verificado com sucesso! Bot: <strong>{tokenValidation.user?.username}</strong> (ID:{" "}
                    {tokenValidation.user?.id})
                  </p>
                ) : (
                  <p>{tokenValidation.error}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. SEÇÃO: OPÇÕES DE INTENÇÃO PRIVILEGIADA (IMAGEM 2) */}
      <div className="space-y-4">
        <div className="space-y-1">
          <span className="text-[0.7rem] font-bold tracking-widest text-muted-foreground/80 uppercase">
            CONFIGURAÇÕES
          </span>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Opções de intenção privilegiada
          </h2>
        </div>

        {/* 3 CARDS LADO A LADO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CARD 1: Intenção de presença */}
          <Card className="surface-card border-border/60 bg-zinc-950/60 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-foreground">Intenção de presença</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                GUILD_PRESENCES. Sempre ativar, nunca ativar ou deixar o sistema decidir automaticamente.
              </p>
            </div>
            <Select
              value={config.intentPresences || "always"}
              onValueChange={(val: "always" | "never" | "auto") =>
                handleUpdateConfig({ intentPresences: val }, "Intenção de presença atualizada!")
              }
            >
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs font-bold text-foreground">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-xs">
                <SelectItem value="always">Ativar sempre</SelectItem>
                <SelectItem value="never">Desativar</SelectItem>
                <SelectItem value="auto">Decidir automaticamente</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {/* CARD 2: Intenção dos membros do servidor */}
          <Card className="surface-card border-border/60 bg-zinc-950/60 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-foreground">
                Intenção dos membros do servidor
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                MEMBROS DA GUILDA. Sempre habilitar, nunca habilitar ou deixar o sistema decidir automaticamente.
              </p>
            </div>
            <Select
              value={config.intentGuildMembers || "always"}
              onValueChange={(val: "always" | "never" | "auto") =>
                handleUpdateConfig({ intentGuildMembers: val }, "Intenção de membros atualizada!")
              }
            >
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs font-bold text-foreground">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-xs">
                <SelectItem value="always">Ativar sempre</SelectItem>
                <SelectItem value="never">Desativar</SelectItem>
                <SelectItem value="auto">Decidir automaticamente</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          {/* CARD 3: Intenção do conteúdo da mensagem */}
          <Card className="surface-card border-border/60 bg-zinc-950/60 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-foreground">
                Intenção do conteúdo da mensagem
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                CONTEÚDO DA MENSAGEM. Sempre ativar, nunca ativar ou deixar o sistema decidir automaticamente.
              </p>
            </div>
            <Select
              value={config.intentMessageContent || "always"}
              onValueChange={(val: "always" | "never" | "auto") =>
                handleUpdateConfig({ intentMessageContent: val }, "Intenção de conteúdo de mensagem atualizada!")
              }
            >
              <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs font-bold text-foreground">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-xs">
                <SelectItem value="always">Ativar sempre</SelectItem>
                <SelectItem value="never">Desativar</SelectItem>
                <SelectItem value="auto">Decidir automaticamente</SelectItem>
              </SelectContent>
            </Select>
          </Card>
        </div>
      </div>

      {/* 5. DIAGNÓSTICOS DE CONEXÃO & INTEGRAÇÃO DISCLOUD */}
      <Card className="surface-card border-border/60 bg-zinc-950/40 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                Hospedagem & Nuvem Discloud
                <Badge className="bg-zinc-800 text-zinc-300 text-[10px]">App ID: {config.discloudAppId || "twin"}</Badge>
              </h4>
              <p className="text-xs text-muted-foreground">
                Comandos de start, stop e restart sincronizados com a nuvem Discloud e o Supabase Realtime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <span className="text-muted-foreground block text-[0.68rem]">Status Realtime</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Sincronizado
              </span>
            </div>
          </div>
        </div>

        {/* Input Opcional para API Token da Discloud */}
        <div className="pt-2 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <Label className="text-[0.7rem] text-muted-foreground font-semibold">Discloud App ID</Label>
            <Input
              value={config.discloudAppId || "twin"}
              onChange={(e) => setConfig((prev) => ({ ...prev, discloudAppId: e.target.value }))}
              onBlur={() => handleUpdateConfig({ discloudAppId: config.discloudAppId || "twin" })}
              className="bg-zinc-900 border-zinc-800 text-xs font-mono h-8 mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-[0.7rem] text-muted-foreground font-semibold">
              Discloud API Token (Opcional para controle direto na nuvem)
            </Label>
            <Input
              type="password"
              placeholder="Cole seu token da Discloud aqui para comandos via API de nuvem..."
              value={config.discloudApiToken || ""}
              onChange={(e) => setConfig((prev) => ({ ...prev, discloudApiToken: e.target.value }))}
              onBlur={() => handleUpdateConfig({ discloudApiToken: config.discloudApiToken || "" }, "Token Discloud salvo!")}
              className="bg-zinc-900 border-zinc-800 text-xs font-mono h-8 mt-1"
            />
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: ALTERAR BANNER */}
      {/* ========================================================================= */}
      <Dialog open={isBannerModalOpen} onOpenChange={setIsBannerModalOpen}>
        <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Alterar Banner do Bot
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Escolha um dos modelos temáticos gamer/cyberpunk ou informe a URL de uma imagem personalizada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Presets de Banner */}
            <div className="space-y-2">
              <Label className="text-xs font-bold">Modelos Predefinidos</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BANNER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setBannerUrlInput(preset.url)}
                    className={cn(
                      "group relative h-20 rounded-lg overflow-hidden border transition-all text-left p-2 flex flex-col justify-end",
                      bannerUrlInput === preset.url
                        ? "border-primary ring-2 ring-primary/40"
                        : "border-zinc-800 hover:border-zinc-600"
                    )}
                    style={{
                      backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url("${preset.url}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <span className="text-[0.68rem] font-bold text-white drop-shadow-md truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input URL Personalizada */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">URL Customizada da Imagem</Label>
              <Input
                value={bannerUrlInput}
                onChange={(e) => setBannerUrlInput(e.target.value)}
                placeholder="https://i.imgur.com/... ou https://images.unsplash.com/..."
                className="bg-zinc-900 border-zinc-800 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBannerModalOpen(false)}
              className="bg-zinc-900 border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveBanner}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
            >
              Salvar Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: ALTERAR NOME DO BOT */}
      {/* ========================================================================= */}
      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Alterar Nome do Bot
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define o nome de exibição do bot nos registros e no painel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-bold">Nome do Bot</Label>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Ex: Roda Dupla"
              className="bg-zinc-900 border-zinc-800 text-sm font-bold"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNameModalOpen(false)}
              className="bg-zinc-900 border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveName}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
            >
              Salvar Nome
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: ALTERAR AVATAR DO BOT */}
      {/* ========================================================================= */}
      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Alterar Avatar do Bot
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Informe o link direto da imagem de avatar do bot (PNG ou JPG recomendado).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-bold">URL da Imagem de Avatar</Label>
            <Input
              value={avatarInput}
              onChange={(e) => setAvatarInput(e.target.value)}
              placeholder="https://i.ibb.co/... ou https://cdn.discordapp.com/..."
              className="bg-zinc-900 border-zinc-800 text-xs font-mono"
            />
            {avatarInput && (
              <div className="flex justify-center pt-2">
                <img
                  src={avatarInput}
                  alt="Preview Avatar"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-primary"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                  }}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAvatarModalOpen(false)}
              className="bg-zinc-900 border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveAvatar}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
            >
              Salvar Avatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: DEFINIR MENSAGEM DE STATUS & ATIVIDADE */}
      {/* ========================================================================= */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-rose-500" />
              Definir Mensagem de Status
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure como a atividade e o texto do bot serão apresentados no Discord.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipo de Atividade */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tipo de Atividade</Label>
              <Select
                value={activityTypeInput}
                onValueChange={(val: any) => setActivityTypeInput(val)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs font-bold">
                  <SelectValue placeholder="Selecione a atividade" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-xs">
                  <SelectItem value="Playing">Jogando (Playing)</SelectItem>
                  <SelectItem value="Watching">Assistindo (Watching)</SelectItem>
                  <SelectItem value="Listening">Ouvindo (Listening)</SelectItem>
                  <SelectItem value="Competing">Competindo (Competing)</SelectItem>
                  <SelectItem value="Streaming">Transmitindo (Streaming)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Texto da Mensagem */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Texto de Status</Label>
              <Input
                value={statusTextInput}
                onChange={(e) => setStatusTextInput(e.target.value)}
                placeholder="Ex: Twin Wheels • Logs em Tempo Real"
                className="bg-zinc-900 border-zinc-800 text-xs font-bold"
              />
              <p className="text-[0.65rem] text-muted-foreground">
                Exibido ao lado do tipo de atividade no perfil do bot.
              </p>
            </div>

            {/* URL Streaming se selecionado */}
            {activityTypeInput === "Streaming" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">URL da Transmissão (Twitch / YouTube)</Label>
                <Input
                  value={streamingUrlInput}
                  onChange={(e) => setStreamingUrlInput(e.target.value)}
                  placeholder="https://www.twitch.tv/..."
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
              className="bg-zinc-900 border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveStatus}
              className="bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-950/40"
            >
              Salvar Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: CONVIDAR BOT OAUTH2 */}
      {/* ========================================================================= */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#5865F2]" />
              Convidar Bot para Servidor
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Gere o link de convite oficial com as permissões necessárias para adicionar o bot ao servidor Discord da facção.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Permissões do Bot</Label>
              <Select value={customPermissions} onValueChange={setCustomPermissions}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs font-bold">
                  <SelectValue placeholder="Selecione as permissões" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-xs">
                  <SelectItem value="8">Administrador (Recomendado)</SelectItem>
                  <SelectItem value="534723950656">Gerenciar Mensagens & Canais</SelectItem>
                  <SelectItem value="2147483647">Acesso Total Sem Restrições</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1">
              <span className="text-[0.65rem] font-bold text-muted-foreground uppercase">Link Gerado</span>
              <p className="font-mono text-[0.7rem] text-primary break-all">
                {generateBotInviteUrl(clientId, customPermissions)}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generateBotInviteUrl(clientId, customPermissions));
                toast.success("Link de convite copiado!");
              }}
              className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar Link
            </Button>
            <Button
              type="button"
              onClick={() => {
                window.open(generateBotInviteUrl(clientId, customPermissions), "_blank");
                setIsInviteModalOpen(false);
              }}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir no Navegador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
