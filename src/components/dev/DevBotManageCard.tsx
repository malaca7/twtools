import { useState, useEffect, useMemo, useRef } from "react";
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
  Upload,
  MessageSquare,
  Crop,
  MoreHorizontal,
  Plus,
  X,
  Trash2,
  Send,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { supabase } from "@/integrations/supabase/client";
import { logAuditAction } from "@/lib/app-api";
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
  requestBotHeartbeat,
  fetchBotGuilds,
  uploadBotImage,
  BANNER_PRESETS,
  type BotHeartbeatData,
  type BotGuildInfo,
  type DiscordUserValidationResult,
} from "@/services/discordBotManageService";
import { cn } from "@/lib/utils";
import { ImageCropModal } from "./ImageCropModal";

function DiscordIconSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 127.14 96.36" fill="currentColor">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.34,2.51-2a75.58,75.58,0,0,0,93,0c.79.71,1.63,1.4,2.51,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.6-18.83C129,54.65,122.64,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
    </svg>
  );
}

export interface DevBotManageCardProps {
  isCeoView?: boolean;
}

export function DevBotManageCard({ isCeoView: isCeoViewProp }: DevBotManageCardProps = {}) {
  const isCeoView =
    isCeoViewProp !== undefined
      ? isCeoViewProp
      : typeof window !== "undefined" && window.location.pathname.includes("/ceo");

  const { user, profile, level, hasPermission } = useAuth();

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
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarInput, setAvatarInput] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTextInput, setStatusTextInput] = useState("");
  const [activityTypeInput, setActivityTypeInput] = useState<
    "Playing" | "Watching" | "Listening" | "Competing" | "Streaming" | "Custom" | "None"
  >("Playing");
  const [streamingUrlInput, setStreamingUrlInput] = useState("");

  // Modal de Recorte, Zoom e Redimensionamento (Avatar & Banner)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<"avatar" | "banner">("avatar");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [isCropSaving, setIsCropSaving] = useState(false);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [customPermissions, setCustomPermissions] = useState("8"); // 8 = Administrator

  // Modal de Envio de Mensagem pelo Bot
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [sendMsgChannelId, setSendMsgChannelId] = useState("");
  const [sendMsgContent, setSendMsgContent] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Heartbeat do bot em tempo real
  const [heartbeat, setHeartbeat] = useState<BotHeartbeatData | null>(null);
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<number | null>(null);

  // Estados estilo Perfil do Discord
  const [activeDiscordTab, setActiveDiscordTab] = useState<"bio" | "servers" | "data">("bio");
  const [devNote, setDevNote] = useState<string>(() => {
    try {
      return localStorage.getItem("tw_bot_profile_note") || "";
    } catch {
      return "";
    }
  });
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [botRoles, setBotRoles] = useState<{ id: string; name: string; color: string }[]>([
    { id: "1", name: "TW | Bot", color: "#f2f3f5" },
    { id: "2", name: "『 🤖 』 Bots", color: "#a855f7" },
  ]);

  // Lista de servidores em que o bot está ativo
  const [guilds, setGuilds] = useState<BotGuildInfo[]>(() => {
    try {
      const cached = localStorage.getItem("tw_bot_cached_guilds");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "1535505650308620400",
        name: "Twin Wheel",
        icon: "4f4beed324c9ccfa04b3a748cfba1449",
        iconUrl: "https://cdn.discordapp.com/icons/1535505650308620400/4f4beed324c9ccfa04b3a748cfba1449.png?size=128",
        memberCount: 38,
        isMain: true,
      },
      {
        id: "1537229296697999462",
        name: "malaca developers",
        icon: "a_25287fd598b117fdebd41b7f779a304b",
        iconUrl: "https://cdn.discordapp.com/icons/1537229296697999462/a_25287fd598b117fdebd41b7f779a304b.gif?size=128",
        memberCount: 5,
        isMain: false,
      },
    ];
  });
  const [loadingGuilds, setLoadingGuilds] = useState(false);

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

          // Busca lista de servidores reais que o bot está
          fetchBotGuilds(data.botToken).then((list) => {
            if (isMounted && list && list.length > 0) {
              setGuilds(list);
            }
          });
          requestBotHeartbeat();
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

    // Subscrição do heartbeat em tempo real com lista de guilds
    const unsubscribe = subscribeToBotHeartbeat((data) => {
      if (isMounted) {
        setHeartbeat(data);
        setLastHeartbeatTime(Date.now());
        if (data.guilds && Array.isArray(data.guilds) && data.guilds.length > 0) {
          setGuilds(data.guilds);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Atualizar servidores manualmente
  const handleRefreshGuilds = async () => {
    setLoadingGuilds(true);
    try {
      await requestBotHeartbeat();
      const list = await fetchBotGuilds(config.botToken);
      if (list && list.length > 0) {
        setGuilds(list);
        toast.success(`${list.length} servidores sincronizados com sucesso!`);
      }
    } catch (err: any) {
      toast.error("Erro ao atualizar servidores: " + (err?.message || err));
    } finally {
      setLoadingGuilds(false);
    }
  };

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
    if (action === "restart" && !hasPermission("bot_restart")) {
      toast.error("Você não possui permissão para reiniciar o bot.");
      return;
    }
    if ((action === "start" || action === "stop") && !hasPermission("bot_power_toggle")) {
      toast.error("Você não possui permissão para ligar/desligar o bot.");
      return;
    }
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
    if (!hasPermission("bot_manage_token")) {
      toast.error("Você não possui permissão para alterar as configurações do token.");
      return;
    }
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
    if (!hasPermission("bot_manage_token")) {
      toast.error("Você não possui permissão para testar ou gerenciar o token.");
      return;
    }
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
    if (!hasPermission("bot_manage_token")) {
      toast.error("Você não possui permissão para salvar o token do bot.");
      return;
    }
    if (!tokenInput) return;
    await handleUpdateConfig(
      { botToken: tokenInput.trim() },
      "Token do bot salvo e sincronizado com segurança!"
    );
  };

  // Remover credenciais e configurações de token do bot
  const handleRemoveToken = async () => {
    if (!hasPermission("bot_manage_token")) {
      toast.error("Você não possui permissão para remover as configurações do token.");
      return;
    }
    if (
      !confirm(
        "Tem certeza que deseja remover as configurações e credenciais do token do bot? Isso desativará o bot até que um novo token seja configurado."
      )
    ) {
      return;
    }
    setTokenInput("");
    setTokenValidation(null);
    await handleUpdateConfig({ botToken: "" }, "Configurações de token removidas com sucesso!");
  };

  // Remover configurações de integração com a Discloud
  const handleRemoveDiscloudConfig = async () => {
    if (!hasPermission("bot_manage_discloud_config")) {
      toast.error("Você não possui permissão para remover as configurações da Discloud.");
      return;
    }
    if (
      !confirm(
        "Tem certeza que deseja remover as configurações da Discloud (App ID e API Token)?"
      )
    ) {
      return;
    }
    setConfig((prev) => ({ ...prev, discloudAppId: "", discloudApiToken: "" }));
    await handleUpdateConfig(
      { discloudAppId: "", discloudApiToken: "" },
      "Configurações da Discloud removidas com sucesso!"
    );
  };

  // Upload do Banner direto de arquivo abrindo o modal de recorte e zoom
  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasPermission("bot_change_banner")) {
      toast.error("Você não possui permissão para mudar o banner do bot.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem do banner deve ter no máximo 15MB.");
      return;
    }

    setCropFile(file);
    setCropImageUrl(null);
    setCropTarget("banner");
    setIsCropModalOpen(true);

    if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
  };

  // Upload do Avatar direto de arquivo abrindo o modal de recorte e zoom
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasPermission("bot_change_avatar")) {
      toast.error("Você não possui permissão para mudar o avatar do bot.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem de avatar deve ter no máximo 10MB.");
      return;
    }

    setCropFile(file);
    setCropImageUrl(null);
    setCropTarget("avatar");
    setIsCropModalOpen(true);

    if (avatarFileInputRef.current) avatarFileInputRef.current.value = "";
  };

  // Abrir modal de recorte para ajustar imagem atual já definida (banner ou avatar)
  const handleOpenCropForExisting = (target: "avatar" | "banner") => {
    if (target === "avatar" && !hasPermission("bot_change_avatar")) {
      toast.error("Você não possui permissão para mudar o avatar do bot.");
      return;
    }
    if (target === "banner" && !hasPermission("bot_change_banner")) {
      toast.error("Você não possui permissão para mudar o banner do bot.");
      return;
    }
    const currentUrl =
      target === "avatar"
        ? (avatarInput || config.botAvatarUrl)
        : (bannerUrlInput || config.botBannerUrl);

    if (!currentUrl) {
      toast.error(`Nenhuma imagem de ${target === "avatar" ? "avatar" : "banner"} foi definida ainda.`);
      return;
    }

    setCropTarget(target);
    setCropFile(null);
    setCropImageUrl(currentUrl);
    setIsCropModalOpen(true);
  };

  // Processar e salvar imagem recortada
  const handleCropSave = async (croppedFile: File) => {
    if (cropTarget === "avatar" && !hasPermission("bot_change_avatar")) {
      toast.error("Você não possui permissão para mudar o avatar do bot.");
      return;
    }
    if (cropTarget === "banner" && !hasPermission("bot_change_banner")) {
      toast.error("Você não possui permissão para mudar o banner do bot.");
      return;
    }
    setIsCropSaving(true);
    try {
      if (cropTarget === "avatar") {
        const publicUrl = await uploadBotImage(croppedFile, "avatar");
        setAvatarInput(publicUrl);
        await handleUpdateConfig(
          { botAvatarUrl: publicUrl },
          "Foto de perfil do bot atualizada com sucesso!"
        );
        setIsAvatarModalOpen(false);
      } else {
        const publicUrl = await uploadBotImage(croppedFile, "banner");
        setBannerUrlInput(publicUrl);
        await handleUpdateConfig(
          { botBannerUrl: publicUrl },
          "Banner do bot atualizado com sucesso!"
        );
        setIsBannerModalOpen(false);
      }
      setIsCropModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar imagem recortada.");
    } finally {
      setIsCropSaving(false);
    }
  };

  // Salvar Banner
  const handleSaveBanner = async () => {
    if (!hasPermission("bot_change_banner")) {
      toast.error("Você não possui permissão para mudar o banner do bot.");
      return;
    }
    if (!bannerUrlInput) return;
    await handleUpdateConfig(
      { botBannerUrl: bannerUrlInput.trim() },
      "Banner do bot atualizado com sucesso!"
    );
    setIsBannerModalOpen(false);
  };

  // Salvar Nome
  const handleSaveName = async () => {
    if (!hasPermission("bot_change_name")) {
      toast.error("Você não possui permissão para mudar o nome do bot.");
      return;
    }
    if (!nameInput.trim()) return;
    await handleUpdateConfig(
      { botName: nameInput.trim() },
      "Nome do bot atualizado!"
    );
    setIsNameModalOpen(false);
  };

  // Salvar Avatar
  const handleSaveAvatar = async () => {
    if (!hasPermission("bot_change_avatar")) {
      toast.error("Você não possui permissão para mudar o avatar do bot.");
      return;
    }
    if (!avatarInput.trim()) return;
    await handleUpdateConfig(
      { botAvatarUrl: avatarInput.trim() },
      "Avatar do bot atualizado!"
    );
    setIsAvatarModalOpen(false);
  };

  // Salvar Mensagem de Status
  const handleSaveStatus = async () => {
    if (!hasPermission("bot_change_status")) {
      toast.error("Você não possui permissão para mudar o status do bot.");
      return;
    }
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

  // Enviar Mensagem via Bot Discord
  const handleSendDiscordMessage = async () => {
    if (!hasPermission("bot_send_message")) {
      toast.error("Você não tem permissão para enviar mensagens pelo bot.");
      return;
    }
    if (!sendMsgContent.trim()) {
      toast.error("Digite o conteúdo da mensagem.");
      return;
    }

    setIsSendingMessage(true);
    try {
      const cleanToken = config.botToken ? config.botToken.trim().replace(/^Bot\s+/i, "") : "";
      const targetChannel = sendMsgChannelId.trim();

      let directSent = false;
      let directError = "";

      // 1. Se houver token e canal especificado, tenta envio direto via API REST oficial do Discord
      if (cleanToken && cleanToken.length > 20 && targetChannel) {
        try {
          const res = await fetch(`https://discord.com/api/v10/channels/${targetChannel}/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bot ${cleanToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: sendMsgContent.trim(),
            }),
          });

          if (res.ok) {
            directSent = true;
          } else {
            const errData = await res.json().catch(() => ({}));
            directError = errData.message || `Código HTTP ${res.status}`;
          }
        } catch (restErr: any) {
          directError = restErr?.message || "Falha de rede";
        }
      }

      // 2. Emite broadcast no canal de controle do bot (Supabase Realtime) para o bot backend processar
      try {
        const controlChannel = supabase.channel("system-discord-bot-control");
        await controlChannel.send({
          type: "broadcast",
          event: "send_message",
          payload: {
            channelId: targetChannel,
            content: sendMsgContent.trim(),
            sender: profile?.nome || user?.email || "CEO",
            timestamp: Date.now(),
          },
        });
      } catch (bcErr) {
        console.warn("Aviso ao emitir broadcast de mensagem:", bcErr);
      }

      // 3. Log de auditoria
      try {
        await logAuditAction("bot_send_message", {
          channelId: targetChannel || "padrão",
          messageSnippet: sendMsgContent.trim().slice(0, 100),
          sender: profile?.nome || user?.email || "CEO",
          directSent,
        });
      } catch {}

      if (directSent) {
        toast.success("Mensagem enviada com sucesso no canal do Discord!");
      } else if (directError) {
        toast.info(`Comando de envio transmitido ao bot. (${directError})`);
      } else {
        toast.success("Mensagem transmitida para a fila do bot Discord com sucesso!");
      }

      setSendMsgContent("");
      setIsSendMessageModalOpen(false);
    } catch (err: any) {
      toast.error(`Falha ao enviar mensagem: ${err?.message || "Erro desconhecido"}`);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Ícone da atividade
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "Custom":
      case "None":
        return <MessageSquare className="h-4 w-4" />;
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
      case "Custom":
      case "None":
        return "STATUS PERSONALIZADO";
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
        <p className="text-xs text-muted-foreground">
          Visualização fiel do perfil do bot no Discord e painel de controle operacional em tempo real.
        </p>
      </div>

      {/* GRID DE GESTÃO DO BOT: PERFIL DISCORD 1:1 (NÃO EXTENDIDO) + PAINEL DE CONTROLES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUNA ESQUERDA: DISCORD BOT PROFILE POPOUT CARD (FIDELIDADE DISCORD 1:1) */}
        <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 flex flex-col items-center lg:items-start w-full">
          <div className="w-full max-w-[360px] mx-auto lg:mx-0 rounded-3xl bg-[#111214] border border-[#2b2d31] overflow-hidden shadow-2xl shadow-black/90 font-sans select-none ring-1 ring-white/5">
            {/* BANNER COM OPÇÕES (...) */}
            <div
              className="relative w-full h-36 sm:h-40 bg-cover bg-center transition-all duration-300"
              style={{
                backgroundImage: `url("${botBanner}")`,
                backgroundColor: "#1e1f22",
              }}
            >
              {/* Top-Right Discord 3 Dots Menu (...) */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-lg"
                      title="Opções do perfil"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#111214] border-[#2b2d31] text-zinc-200">
                    {hasPermission("bot_change_banner") && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleOpenCropForExisting("banner")}
                          className="text-xs hover:bg-[#232428] hover:text-white cursor-pointer gap-2"
                        >
                          <Crop className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Ajustar / Recortar banner atual</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setBannerUrlInput(config.botBannerUrl || "");
                            setIsBannerModalOpen(true);
                          }}
                          className="text-xs hover:bg-[#232428] hover:text-white cursor-pointer gap-2"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-primary" />
                          <span>Alterar imagem do banner</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2b2d31]" />
                      </>
                    )}
                    {hasPermission("bot_change_avatar") && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleOpenCropForExisting("avatar")}
                          className="text-xs hover:bg-[#232428] hover:text-white cursor-pointer gap-2"
                        >
                          <Crop className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Ajustar foto de avatar atual</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setAvatarInput(config.botAvatarUrl || "");
                            setIsAvatarModalOpen(true);
                          }}
                          className="text-xs hover:bg-[#232428] hover:text-white cursor-pointer gap-2"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-primary" />
                          <span>Alterar foto de avatar</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2b2d31]" />
                      </>
                    )}
                    {hasPermission("bot_change_name") && (
                      <DropdownMenuItem
                        onClick={() => {
                          setNameInput(botName);
                          setIsNameModalOpen(true);
                        }}
                        className="text-xs hover:bg-[#232428] hover:text-white cursor-pointer gap-2"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-purple-400" />
                        <span>Alterar nome do bot</span>
                      </DropdownMenuItem>
                    )}
                    {hasPermission("bot_change_status") && (
                      <DropdownMenuItem
                        onClick={() => {
                          setStatusTextInput(config.botStatusText || "by malaca");
                          setActivityTypeInput(config.botActivityType || "Playing");
                          setStreamingUrlInput(config.botStreamingUrl || "");
                          setIsStatusModalOpen(true);
                        }}
                        className="text-xs hover:bg-[#232428] hover:text-white cursor-pointer gap-2"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-rose-400" />
                        <span>Definir mensagem de status</span>
                      </DropdownMenuItem>
                    )}
                    {(hasPermission("bot_change_name") || hasPermission("bot_change_status")) && (
                      <DropdownMenuSeparator className="bg-[#2b2d31]" />
                    )}
                    <DropdownMenuItem
                      onClick={handleCopyId}
                      className="text-xs hover:bg-[#232428] hover:text-white cursor-pointer gap-2"
                    >
                      {copiedId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>Copiar ID do usuário</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={getDeveloperPortalUrl(clientId)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs hover:bg-[#232428] hover:text-white cursor-pointer gap-2 flex items-center"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Portal de Desenvolvedores</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* CORPO DO PERFIL DISCORD */}
            <div className="px-4 pb-5 pt-0 relative bg-[#111214]">
              {/* LINHA SUPERIOR: AVATAR + STATUS BUBBLE + BOTÕES DE AÇÃO */}
              <div className="flex items-end justify-between -mt-10 sm:-mt-11 mb-3">
                {/* AVATAR + STATUS BUBBLE ('by malaca') */}
                <div className="flex items-end gap-2">
                  {/* Circular Avatar com Ring Discord */}
                  <div
                    className={cn(
                      "relative group shrink-0",
                      hasPermission("bot_change_avatar") ? "cursor-pointer" : "cursor-default"
                    )}
                    onClick={() => {
                      if (!hasPermission("bot_change_avatar")) return;
                      setIsAvatarModalOpen(true);
                    }}
                    title={
                      hasPermission("bot_change_avatar")
                        ? "Clique para alterar ou recortar avatar"
                        : botName
                    }
                  >
                    <img
                      src={botAvatar}
                      alt={botName}
                      className="h-20 w-20 sm:h-22 sm:w-22 rounded-full object-cover ring-6 ring-[#111214] bg-[#1e1f22] shadow-2xl transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                      }}
                    />
                    {/* Status indicator dot */}
                    <div
                      className={cn(
                        "absolute bottom-0.5 right-0.5 h-5 w-5 rounded-full ring-3 ring-[#111214] flex items-center justify-center shadow-md",
                        currentPresence === "online" && "bg-[#23a55a]",
                        currentPresence === "idle" && "bg-[#f0b232]",
                        currentPresence === "dnd" && "bg-[#f23f43]",
                        currentPresence === "invisible" && "bg-[#80848e]"
                      )}
                      title={`Status: ${currentPresence}`}
                    />
                    {/* Hover overlay */}
                    {hasPermission("bot_change_avatar") && (
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity ring-6 ring-[#111214]">
                        <Edit2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Status Bubble (Pill format matching Discord: 'by malaca') */}
                  <div
                    onClick={() => {
                      if (!hasPermission("bot_change_status")) return;
                      setStatusTextInput(config.botStatusText || "by malaca");
                      setActivityTypeInput(config.botActivityType || "Playing");
                      setStreamingUrlInput(config.botStreamingUrl || "");
                      setIsStatusModalOpen(true);
                    }}
                    className={cn(
                      "mb-0.5 px-2.5 py-1 rounded-2xl bg-[#232428] border border-[#313338] text-white text-[11px] font-semibold shadow-md flex items-center gap-1.5 select-none shrink-0 transition-all",
                      hasPermission("bot_change_status")
                        ? "hover:bg-[#2b2d31] cursor-pointer hover:scale-105 active:scale-95 group"
                        : "opacity-80 cursor-default"
                    )}
                    title={
                      hasPermission("bot_change_status")
                        ? "Clique para editar a mensagem de status"
                        : "Status do bot"
                    }
                  >
                    <span className="truncate max-w-[100px] sm:max-w-[120px]">
                      {config.botStatusText || "by malaca"}
                    </span>
                    {hasPermission("bot_change_status") && (
                      <Edit2 className="h-2.5 w-2.5 text-zinc-400 group-hover:text-white transition-colors" />
                    )}
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO DISCORD: CHAT + ADICIONAR APP */}
                {(hasPermission("bot_send_message") || hasPermission("bot_add_app") || hasPermission("bot_invite")) && (
                  <div className="flex items-center gap-1.5 mb-0.5 shrink-0">
                    {/* Botão Chat / Enviar Mensagem */}
                    {hasPermission("bot_send_message") && (
                      <button
                        type="button"
                        onClick={() => setIsSendMessageModalOpen(true)}
                        className="h-8 w-8 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] hover:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                        title="Enviar mensagem"
                      >
                        <MessageSquare className="h-3.5 w-3.5 fill-current" />
                      </button>
                    )}

                    {/* Botão + Adicionar app */}
                    {(hasPermission("bot_add_app") || hasPermission("bot_invite")) && (
                      <button
                        type="button"
                        onClick={() => setIsInviteModalOpen(true)}
                        className="h-8 px-2.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                        title="Adicionar app ao seu servidor"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Adicionar app</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* NOME DO BOT + BADGE APP + TAG DISCORD + SLASH ICON */}
              <div className="space-y-0.5 mb-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
                    {botName}
                    {hasPermission("bot_change_name") && (
                      <button
                        type="button"
                        onClick={() => {
                          setNameInput(botName);
                          setIsNameModalOpen(true);
                        }}
                        className="text-zinc-500 hover:text-white transition-colors"
                        title="Editar nome"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </h1>

                  {/* APP BADGE */}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#5865F2] text-white leading-none select-none">
                    APP
                  </span>
                </div>

                {/* TAG DISCORD & BADGE {/} */}
                <div className="flex items-center gap-2 text-xs text-[#949ba4] font-medium font-sans">
                  <span>{heartbeat?.botTag || `${botName}#8065`}</span>
                  <span
                    className="font-mono text-[#23a55a] font-black text-[11px] bg-[#23a55a]/10 px-1 py-0.2 rounded border border-[#23a55a]/30 select-none"
                    title="Comandos de barra (Slash Commands) disponíveis"
                  >
                    {"{/}"}
                  </span>
                </div>
              </div>

              {/* ABAS DISCORD: Bio | 2 servidores mútuos | Acesso a dados */}
              <div className="flex items-center gap-4 border-b border-[#2b2d31] mb-3 text-[11px] font-bold text-[#949ba4]">
                <button
                  type="button"
                  onClick={() => setActiveDiscordTab("bio")}
                  className={cn(
                    "pb-1.5 transition-colors cursor-pointer relative",
                    activeDiscordTab === "bio" ? "text-white border-b-2 border-white" : "hover:text-zinc-200"
                  )}
                >
                  Bio
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiscordTab("servers")}
                  className={cn(
                    "pb-1.5 transition-colors cursor-pointer relative",
                    activeDiscordTab === "servers" ? "text-white border-b-2 border-white" : "hover:text-zinc-200"
                  )}
                >
                  {guilds.length} {guilds.length === 1 ? "servidor mútuo" : "servidores mútuos"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiscordTab("data")}
                  className={cn(
                    "pb-1.5 transition-colors cursor-pointer relative",
                    activeDiscordTab === "data" ? "text-white border-b-2 border-white" : "hover:text-zinc-200"
                  )}
                >
                  Acesso a dados
                </button>
              </div>

              {/* CONTEÚDO DAS ABAS */}
              {activeDiscordTab === "bio" && (
                <div className="space-y-3.5 text-xs">
                  {/* SEÇÃO CARGOS */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#dbdee1] block">
                      Cargos
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {botRoles.map((role) => (
                        <div
                          key={role.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#2b2d31] text-[#dbdee1] text-[11px] font-medium border border-transparent group hover:border-[#383a40] transition-colors"
                        >
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                          <span>{role.name}</span>
                          <button
                            type="button"
                            onClick={() => setBotRoles(botRoles.filter((r) => r.id !== role.id))}
                            className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity ml-0.5 text-zinc-400 cursor-pointer"
                            title="Remover cargo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newRole = prompt("Nome do novo cargo:");
                          if (newRole?.trim()) {
                            setBotRoles([...botRoles, { id: Date.now().toString(), name: newRole.trim(), color: "#3b82f6" }]);
                          }
                        }}
                        className="h-6 w-6 rounded-md bg-[#2b2d31] hover:bg-[#35373c] text-[#949ba4] hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
                        title="Adicionar cargo"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* SEÇÃO CRIADO(A) EM */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#dbdee1] block">
                      Criado(a) Em
                    </span>
                    <div className="flex items-center gap-2 text-[#dbdee1] font-medium text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <DiscordIconSvg className="h-3.5 w-3.5 text-[#949ba4]" />
                        <span>9 de ago. de 2026</span>
                      </div>
                      <span className="text-[#949ba4]">•</span>
                      <div className="flex items-center gap-1.5">
                        <img
                          src="https://i.ibb.co/ymH1BQPQ/Uma124.png"
                          alt="TW"
                          className="h-3.5 w-3.5 rounded-full object-cover"
                        />
                        <span>12 de set. de 2026</span>
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO NOTA (VISÍVEL APENAS PARA VOCÊ) */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#dbdee1] block">
                      Nota (visível apenas para você)
                    </span>
                    {isEditingNote ? (
                      <div className="space-y-2">
                        <textarea
                          value={devNote}
                          onChange={(e) => setDevNote(e.target.value)}
                          placeholder="Clique para adicionar uma nota"
                          className="w-full h-16 p-2 rounded-lg bg-[#1e1f22] border border-[#383a40] text-white text-xs resize-none focus:outline-none focus:border-[#5865F2]"
                          autoFocus
                        />
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs text-zinc-400 hover:text-white"
                            onClick={() => setIsEditingNote(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-6 text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold"
                            onClick={() => {
                              try {
                                localStorage.setItem("tw_bot_profile_note", devNote);
                              } catch {}
                              setIsEditingNote(false);
                              toast.success("Nota salva com sucesso!");
                            }}
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingNote(true)}
                        className="p-2 rounded-lg bg-transparent hover:bg-[#1e1f22] text-[#949ba4] hover:text-zinc-200 cursor-pointer transition-colors text-xs select-none"
                        title="Clique para editar a nota"
                      >
                        {devNote.trim() ? (
                          <p className="text-zinc-200 whitespace-pre-wrap">{devNote}</p>
                        ) : (
                          <span>Clique para adicionar uma nota</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA SERVIDORES MÚTUOS (REAIS DINÂMICOS) */}
              {activeDiscordTab === "servers" && (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between px-1 text-[11px] text-[#949ba4]">
                    <span>Servidores ({guilds.length})</span>
                    <button
                      type="button"
                      onClick={handleRefreshGuilds}
                      disabled={loadingGuilds}
                      className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Atualizar lista de servidores em tempo real"
                    >
                      <RotateCcw className={cn("h-3 w-3", loadingGuilds && "animate-spin text-primary")} />
                      <span>{loadingGuilds ? "Sincronizando..." : "Atualizar"}</span>
                    </button>
                  </div>

                  {guilds.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-xl bg-[#1e1f22] p-2.5 flex items-center justify-between border border-[#2b2d31] hover:border-[#383a40] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {g.iconUrl ? (
                          <img
                            src={g.iconUrl}
                            alt={g.name}
                            className="h-8 w-8 rounded-full object-cover shrink-0 ring-1 ring-black/40 shadow-sm"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                            }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] flex items-center justify-center font-bold text-[10px] shrink-0">
                            {g.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-white text-xs truncate">{g.name}</p>
                          <p className="text-[10px] text-[#949ba4] font-mono">
                            ID: {g.id}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-[#23a55a]/10 text-[#23a55a] border-[#23a55a]/30 text-[9px] font-bold px-1.5 py-0 shrink-0">
                        Conectado
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* ABA ACESSO A DADOS */}
              {activeDiscordTab === "data" && (
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-[#1e1f22] p-2.5 border border-[#2b2d31]">
                      <p className="text-[9px] uppercase font-bold text-[#949ba4]">Gateway Latency</p>
                      <p className="text-xs font-mono font-bold text-[#23a55a] mt-0.5">
                        {heartbeat?.pingMs ? `${heartbeat.pingMs}ms` : "34ms (Estável)"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#1e1f22] p-2.5 border border-[#2b2d31]">
                      <p className="text-[9px] uppercase font-bold text-[#949ba4]">Discloud Host</p>
                      <p className="text-xs font-mono font-bold text-primary mt-0.5 truncate">twin.discloud.app</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#1e1f22] p-2.5 border border-[#2b2d31] space-y-1">
                    <p className="text-[9px] uppercase font-bold text-[#949ba4]">Intents Ativas</p>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[9px] py-0 px-1.5">
                        ✓ Message Content
                      </Badge>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[9px] py-0 px-1.5">
                        ✓ Server Members
                      </Badge>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[9px] py-0 px-1.5">
                        ✓ Presence Update
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: PAINEL DE CONTROLE, OPERAÇÃO, STATUS & TOKEN */}
        <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 space-y-6 w-full">
          {/* 1. CARD DE CONTROLE OPERACIONAL DO BOT */}
          <Card className="surface-card border-border/70 bg-zinc-950/70 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-xs">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-foreground flex items-center gap-2">
                      Controle do Bot Discloud
                      {isBotRunning ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold gap-1 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Operacional
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold py-0.5">
                          Desligado
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-mono">
                      App: twin · ID: {clientId}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Iniciar / Desligar Bot */}
                  {isBotRunning ? (
                    <Button
                      onClick={() => handleLifecycle("stop")}
                      disabled={actionLoading !== null || !hasPermission("bot_power_toggle")}
                      variant="outline"
                      size="sm"
                      className="bg-emerald-950/40 border-emerald-600/50 text-emerald-400 hover:bg-rose-950/50 hover:border-rose-600/50 hover:text-rose-300 font-bold text-xs gap-1.5 transition-all shadow-md group cursor-pointer h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === "stop" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400 group-hover:hidden" />
                          <Square className="h-3.5 w-3.5 fill-rose-400 text-rose-400 hidden group-hover:inline-block" />
                        </>
                      )}
                      <span className="group-hover:hidden">Ligado</span>
                      <span className="hidden group-hover:inline">Desligar</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleLifecycle("start")}
                      disabled={actionLoading !== null || !hasPermission("bot_power_toggle")}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-900/40 cursor-pointer h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === "start" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5 fill-white" />
                      )}
                      Iniciar
                    </Button>
                  )}

                  {/* Reiniciar */}
                  <Button
                    onClick={() => handleLifecycle("restart")}
                    disabled={actionLoading !== null || !hasPermission("bot_restart")}
                    variant="outline"
                    size="sm"
                    className="bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700/60 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === "restart" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Reiniciar
                  </Button>

                  {/* Convidar */}
                  <Button
                    onClick={() => {
                      if (!hasPermission("bot_invite")) {
                        toast.error("Você não possui permissão para convidar o bot.");
                        return;
                      }
                      setIsInviteModalOpen(true);
                    }}
                    disabled={!hasPermission("bot_invite")}
                    size="sm"
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs gap-1.5 shadow-md shadow-[#5865F2]/20 cursor-pointer h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Convidar
                  </Button>

                  {/* Portal Dev */}
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-white gap-1"
                  >
                    <a href={getDeveloperPortalUrl(clientId)} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="hidden xl:inline">Portal Dev</span>
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 2. SUB-CARDS: MENSAGEM DE STATUS & PRESENÇA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARD ESQUERDO: MENSAGEM DE STATUS */}
            <Card className="surface-card border-border/60 bg-zinc-950/60 flex flex-col justify-between">
              <CardHeader className="pb-2.5">
                <span className="text-[0.68rem] font-bold tracking-widest text-muted-foreground uppercase">
                  MENSAGEM DE STATUS
                </span>
                <CardDescription className="text-xs text-muted-foreground">
                  Personalize o texto e atividade exibidos no perfil.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
                  <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-900/40 shrink-0">
                    {renderActivityIcon(config.botActivityType || "Playing")}
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[0.65rem] font-black tracking-wider text-muted-foreground/80 block">
                      {getActivityLabel(config.botActivityType || "Playing")}
                    </span>
                    <p className="text-xs font-bold text-foreground truncate">
                      {config.botStatusText || "by malaca"}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  type="button"
                  disabled={!hasPermission("bot_change_status")}
                  onClick={() => {
                    if (!hasPermission("bot_change_status")) {
                      toast.error("Você não possui permissão para alterar o status do bot.");
                      return;
                    }
                    setStatusTextInput(config.botStatusText || "by malaca");
                    setActivityTypeInput(config.botActivityType || "Playing");
                    setStreamingUrlInput(config.botStreamingUrl || "");
                    setIsStatusModalOpen(true);
                  }}
                  className="w-full bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-950/40 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Definir mensagem de status
                </Button>
              </CardFooter>
            </Card>

            {/* CARD DIREITO: PRESENÇA */}
            <Card className="surface-card border-border/60 bg-zinc-950/60 flex flex-col justify-between">
              <CardHeader className="pb-2.5">
                <span className="text-[0.68rem] font-bold tracking-widest text-muted-foreground uppercase">
                  PRESENÇA
                </span>
                <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                  Como seu bot aparece no servidor Discord.
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="grid grid-cols-2 gap-2">
                  {/* On-line */}
                  <button
                    type="button"
                    disabled={!hasPermission("bot_change_presence") || saving}
                    onClick={() => {
                      if (!hasPermission("bot_change_presence")) {
                        toast.error("Você não possui permissão para alterar a presença do bot.");
                        return;
                      }
                      handleUpdateConfig({ botStatus: "online" }, "Presença alterada para On-line!");
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all text-left",
                      !hasPermission("bot_change_presence") && "cursor-not-allowed opacity-60",
                      currentPresence === "online"
                        ? "bg-zinc-900 border-emerald-500/80 text-foreground ring-1 ring-emerald-500/50 shadow-xs"
                        : "bg-zinc-900/40 border-zinc-800 text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                    )}
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shrink-0" />
                    <span>On-line</span>
                  </button>

                  {/* Parado */}
                  <button
                    type="button"
                    disabled={!hasPermission("bot_change_presence") || saving}
                    onClick={() => {
                      if (!hasPermission("bot_change_presence")) {
                        toast.error("Você não possui permissão para alterar a presença do bot.");
                        return;
                      }
                      handleUpdateConfig({ botStatus: "idle" }, "Presença alterada para Parado!");
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all text-left",
                      !hasPermission("bot_change_presence") && "cursor-not-allowed opacity-60",
                      currentPresence === "idle"
                        ? "bg-zinc-900 border-amber-500/80 text-foreground ring-1 ring-amber-500/50 shadow-xs"
                        : "bg-zinc-900/40 border-zinc-800 text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                    )}
                  >
                    <div className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shrink-0" />
                    <span>Parado</span>
                  </button>

                  {/* Não incomodar */}
                  <button
                    type="button"
                    disabled={!hasPermission("bot_change_presence") || saving}
                    onClick={() => {
                      if (!hasPermission("bot_change_presence")) {
                        toast.error("Você não possui permissão para alterar a presença do bot.");
                        return;
                      }
                      handleUpdateConfig({ botStatus: "dnd" }, "Presença alterada para Não incomodar!");
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all text-left",
                      !hasPermission("bot_change_presence") && "cursor-not-allowed opacity-60",
                      currentPresence === "dnd"
                        ? "bg-zinc-900 border-rose-500/80 text-foreground ring-1 ring-rose-500/50 shadow-xs"
                        : "bg-zinc-900/40 border-zinc-800 text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                    )}
                  >
                    <div className="h-2 w-2 rounded-full bg-rose-500 shadow-sm shrink-0" />
                    <span>Ocupado</span>
                  </button>

                  {/* Invisível */}
                  <button
                    type="button"
                    disabled={!hasPermission("bot_change_presence") || saving}
                    onClick={() => {
                      if (!hasPermission("bot_change_presence")) {
                        toast.error("Você não possui permissão para alterar a presença do bot.");
                        return;
                      }
                      handleUpdateConfig({ botStatus: "invisible" }, "Presença alterada para Invisível!");
                    }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all text-left",
                      !hasPermission("bot_change_presence") && "cursor-not-allowed opacity-60",
                      currentPresence === "invisible"
                        ? "bg-zinc-900 border-zinc-500/80 text-foreground ring-1 ring-zinc-500/50 shadow-xs"
                        : "bg-zinc-900/40 border-zinc-800 text-muted-foreground hover:bg-zinc-900 hover:text-foreground"
                    )}
                  >
                    <div className="h-2 w-2 rounded-full bg-zinc-500 shadow-sm shrink-0" />
                    <span>Invisível</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3. CARD: TOKEN DE ACESSO (Oculto no Painel CEO) */}
          {!isCeoView && (
            <Card className="surface-card border-border/60 bg-zinc-950/60">
              <CardHeader className="pb-2.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-400" />
                  <span className="text-[0.68rem] font-bold tracking-widest text-muted-foreground uppercase">
                    TOKEN DE ACESSO
                  </span>
                </div>
                <CardDescription className="text-xs text-muted-foreground">
                  O token do bot obtido no{" "}
                  <a
                    href={getDeveloperPortalUrl(clientId)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Developer Portal
                  </a>
                  . Sempre mantido em sigilo:
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* Input Mascarado / Visível */}
                  <div className="relative flex-1">
                    <Input
                      type={showToken ? "text" : "password"}
                      disabled={!hasPermission("bot_manage_token")}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                      className="bg-zinc-900/90 border-zinc-800 font-mono text-xs pr-10 focus-visible:ring-amber-500/50 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      disabled={!hasPermission("bot_manage_token")}
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      title={showToken ? "Ocultar token" : "Exibir token"}
                    >
                      {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Botão Colar */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePasteToken}
                    disabled={!hasPermission("bot_manage_token")}
                    className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 shrink-0 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Colar do clipboard"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    Colar
                  </Button>

                  {/* Botão Testar na API do Discord */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleValidateToken}
                    disabled={isValidatingToken || !tokenInput || !hasPermission("bot_manage_token")}
                    className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-xs font-bold gap-1.5 shrink-0 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isValidatingToken ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    )}
                    Testar
                  </Button>

                  {/* Botão Salvar Substituição */}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveToken}
                    disabled={saving || tokenInput === config.botToken || !hasPermission("bot_manage_token")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 shrink-0 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Salvar
                  </Button>

                  {/* Botão Remover Configurações do Token */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveToken}
                    disabled={saving || (!config.botToken && !tokenInput) || !hasPermission("bot_manage_token")}
                    className="bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/40 hover:border-rose-600/60 text-rose-300 text-xs font-bold gap-1.5 shrink-0 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remover configurações do token do bot"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                    Remover
                  </Button>
                </div>

                {/* Feedback da Validação do Token */}
                {tokenValidation && (
                  <div
                    className={cn(
                      "p-2.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in-50",
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
          )}
        </div>
      </div>

      {/* 4. SEÇÃO: OPÇÕES DE INTENÇÃO PRIVILEGIADA (Oculto no Painel CEO) */}
      {!isCeoView && (
        hasPermission("bot_view_intents") ? (
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
                  disabled={!hasPermission("bot_change_intents") || saving}
                  value={config.intentPresences || "always"}
                  onValueChange={(val: "always" | "never" | "auto") => {
                    if (!hasPermission("bot_change_intents")) {
                      toast.error("Você não possui permissão para mudar opções de intenção privilegiada.");
                      return;
                    }
                    handleUpdateConfig({ intentPresences: val }, "Intenção de presença atualizada!");
                  }}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs font-bold text-foreground disabled:opacity-50 disabled:cursor-not-allowed">
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
                  disabled={!hasPermission("bot_change_intents") || saving}
                  value={config.intentGuildMembers || "always"}
                  onValueChange={(val: "always" | "never" | "auto") => {
                    if (!hasPermission("bot_change_intents")) {
                      toast.error("Você não possui permissão para mudar opções de intenção privilegiada.");
                      return;
                    }
                    handleUpdateConfig({ intentGuildMembers: val }, "Intenção de membros atualizada!");
                  }}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs font-bold text-foreground disabled:opacity-50 disabled:cursor-not-allowed">
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
                  disabled={!hasPermission("bot_change_intents") || saving}
                  value={config.intentMessageContent || "always"}
                  onValueChange={(val: "always" | "never" | "auto") => {
                    if (!hasPermission("bot_change_intents")) {
                      toast.error("Você não possui permissão para mudar opções de intenção privilegiada.");
                      return;
                    }
                    handleUpdateConfig({ intentMessageContent: val }, "Intenção de conteúdo de mensagem atualizada!");
                  }}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 text-xs font-bold text-foreground disabled:opacity-50 disabled:cursor-not-allowed">
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
        ) : (
          <Card className="surface-card border-border/40 bg-zinc-950/20 p-4 border-dashed text-center">
            <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground py-3">
              <ShieldCheck className="h-5 w-5 text-muted-foreground/50" />
              <p className="text-xs font-semibold">Opções de intenção privilegiada ocultas</p>
              <p className="text-[0.7rem] text-muted-foreground/70">
                Você não possui a permissão &quot;Visualizar opções de intenção privilegiada&quot; para consultar ou alterar estas configurações.
              </p>
            </div>
          </Card>
        )
      )}

      {/* 5. DIAGNÓSTICOS DE CONEXÃO & INTEGRAÇÃO DISCLOUD (Oculto no Painel CEO) */}
      {!isCeoView && (
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
                disabled={!hasPermission("bot_manage_discloud_config")}
                value={config.discloudAppId || "twin"}
                onChange={(e) => setConfig((prev) => ({ ...prev, discloudAppId: e.target.value }))}
                onBlur={() => handleUpdateConfig({ discloudAppId: config.discloudAppId || "twin" })}
                className="bg-zinc-900 border-zinc-800 text-xs font-mono h-8 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-[0.7rem] text-muted-foreground font-semibold">
                  Discloud API Token (Opcional para controle direto na nuvem)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveDiscloudConfig}
                  disabled={
                    saving ||
                    (!config.discloudAppId && !config.discloudApiToken) ||
                    !hasPermission("bot_manage_discloud_config")
                  }
                  className="h-6 text-[0.68rem] text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 gap-1 px-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remover credenciais salvas do Discloud"
                >
                  <Trash2 className="h-3 w-3" />
                  Remover Configurações do Discloud
                </Button>
              </div>
              <Input
                type="password"
                disabled={!hasPermission("bot_manage_discloud_config")}
                placeholder="Cole seu token da Discloud aqui para comandos via API de nuvem..."
                value={config.discloudApiToken || ""}
                onChange={(e) => setConfig((prev) => ({ ...prev, discloudApiToken: e.target.value }))}
                onBlur={() => handleUpdateConfig({ discloudApiToken: config.discloudApiToken || "" }, "Token Discloud salvo!")}
                className="bg-zinc-900 border-zinc-800 text-xs font-mono h-8 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ALTERAR BANNER (UPLOAD DIRETO DE IMAGEM) */}
      {/* ========================================================================= */}
      <Dialog open={isBannerModalOpen} onOpenChange={setIsBannerModalOpen}>
        <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Alterar Banner do Bot
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Faça upload de uma imagem do seu dispositivo para ser o banner de destaque do bot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Input oculto de arquivo */}
            <input
              type="file"
              ref={bannerFileInputRef}
              accept="image/*"
              onChange={handleBannerFileUpload}
              className="hidden"
            />

            {/* Área de Upload com clique */}
            <div
              onClick={() => bannerFileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-zinc-700 hover:border-primary/60 bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-all gap-2 text-center group"
            >
              <div className="p-3 rounded-full bg-zinc-800 text-primary group-hover:scale-110 transition-transform">
                {isUploadingBanner ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </div>
              <p className="text-xs font-bold text-foreground">
                {isUploadingBanner ? "Fazendo upload do banner..." : "Clique para fazer upload da imagem do banner"}
              </p>
              <p className="text-[0.65rem] text-muted-foreground">
                Selecione uma imagem do seu computador (PNG, JPG, WEBP - máx. 8MB)
              </p>
            </div>

            {/* Preview do Banner com Botão de Ajustar */}
            {bannerUrlInput && (
              <div className="space-y-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <Label className="text-[0.7rem] text-muted-foreground font-semibold">Pré-visualização do Banner</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCropForExisting("banner")}
                    className="h-7 text-xs font-bold gap-1.5 bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/80 hover:text-white transition-all"
                  >
                    <Crop className="h-3.5 w-3.5" />
                    Ajustar / Recortar Este Banner
                  </Button>
                </div>
                <div
                  className="w-full h-28 rounded-xl bg-cover bg-center border border-zinc-800 relative overflow-hidden shadow-inner"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url("${bannerUrlInput}")`,
                  }}
                />
              </div>
            )}

            {/* Presets de Banner Rápidos */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <Label className="text-xs font-bold text-muted-foreground">Ou escolha um modelo pronto:</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BANNER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    disabled={!hasPermission("bot_change_banner")}
                    onClick={() => {
                      if (!hasPermission("bot_change_banner")) return;
                      setBannerUrlInput(preset.url);
                    }}
                    className={cn(
                      "group relative h-16 rounded-lg overflow-hidden border transition-all text-left p-2 flex flex-col justify-end",
                      !hasPermission("bot_change_banner") && "opacity-50 cursor-not-allowed",
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
                    <span className="text-[0.65rem] font-bold text-white drop-shadow-md truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
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
              disabled={isUploadingBanner || !bannerUrlInput || !hasPermission("bot_change_banner")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={!hasPermission("bot_change_name")}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Ex: Roda Dupla"
              className="bg-zinc-900 border-zinc-800 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={!hasPermission("bot_change_name") || !nameInput.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar Nome
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: ALTERAR AVATAR DO BOT (UPLOAD DIRETO DE IMAGEM) */}
      {/* ========================================================================= */}
      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Alterar Avatar do Bot
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Faça upload de uma nova imagem do seu dispositivo para ser a foto de perfil do bot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Input oculto de arquivo */}
            <input
              type="file"
              ref={avatarFileInputRef}
              accept="image/*"
              onChange={handleAvatarFileUpload}
              className="hidden"
            />

            {/* Dropzone de Upload com clique */}
            <div
              onClick={() => {
                if (!hasPermission("bot_change_avatar")) return;
                avatarFileInputRef.current?.click();
              }}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 transition-all gap-2 text-center group",
                hasPermission("bot_change_avatar")
                  ? "hover:border-primary/60 hover:bg-zinc-900 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="p-3 rounded-full bg-zinc-800 text-primary group-hover:scale-110 transition-transform">
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </div>
              <p className="text-xs font-bold text-foreground">
                {isUploadingAvatar ? "Fazendo upload do avatar..." : "Clique para fazer upload da foto de perfil"}
              </p>
              <p className="text-[0.65rem] text-muted-foreground">
                Selecione uma imagem do seu computador (PNG, JPG, WEBP, GIF - máx. 5MB)
              </p>
            </div>

            {/* Preview do Avatar com anel circular e Botão de Ajustar */}
            {avatarInput && (
              <div className="flex flex-col items-center gap-2.5 pt-2 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <div className="flex items-center justify-between w-full">
                  <span className="text-[0.68rem] text-muted-foreground font-semibold">Pré-visualização do Avatar</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hasPermission("bot_change_avatar")}
                    onClick={() => handleOpenCropForExisting("avatar")}
                    className="h-7 text-xs font-bold gap-1.5 bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/80 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Crop className="h-3.5 w-3.5" />
                    Ajustar / Recortar Foto Atual
                  </Button>
                </div>
                <img
                  src={avatarInput}
                  alt="Preview Avatar"
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-primary shadow-xl bg-zinc-900"
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
              disabled={isUploadingAvatar || !avatarInput || !hasPermission("bot_change_avatar")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={!hasPermission("bot_change_status")}
                value={activityTypeInput}
                onValueChange={(val: any) => setActivityTypeInput(val)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Selecione a atividade" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-xs">
                  <SelectItem value="Custom">Status Personalizado (Sem tipo de atividade)</SelectItem>
                  <SelectItem value="Playing">Jogando (Playing)</SelectItem>
                  <SelectItem value="Watching">Assistindo (Watching)</SelectItem>
                  <SelectItem value="Listening">Ouvindo (Listening)</SelectItem>
                  <SelectItem value="Competing">Competindo (Competing)</SelectItem>
                  <SelectItem value="Streaming">Transmitindo (Streaming)</SelectItem>
                </SelectContent>
              </Select>
              {(activityTypeInput === "Custom" || activityTypeInput === "None") && (
                <p className="text-[0.68rem] text-emerald-400 font-medium">
                  ✓ O status será exibido de forma limpa como mensagem de texto direta no Discord, sem o prefixo &quot;Jogando&quot;, &quot;Assistindo&quot; ou &quot;Ouvindo&quot;.
                </p>
              )}
            </div>

            {/* Texto da Mensagem */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Texto de Status</Label>
              <Input
                disabled={!hasPermission("bot_change_status")}
                value={statusTextInput}
                onChange={(e) => setStatusTextInput(e.target.value)}
                placeholder="Ex: Twin Wheels • Logs em Tempo Real"
                className="bg-zinc-900 border-zinc-800 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={!hasPermission("bot_change_status")}
                  value={streamingUrlInput}
                  onChange={(e) => setStreamingUrlInput(e.target.value)}
                  placeholder="https://www.twitch.tv/..."
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={!hasPermission("bot_change_status")}
              className="bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={!hasPermission("bot_add_app") && !hasPermission("bot_invite")}
              onClick={() => {
                if (!hasPermission("bot_add_app") && !hasPermission("bot_invite")) return;
                navigator.clipboard.writeText(generateBotInviteUrl(clientId, customPermissions));
                toast.success("Link de convite copiado!");
              }}
              className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar Link
            </Button>
            <Button
              type="button"
              disabled={!hasPermission("bot_add_app") && !hasPermission("bot_invite")}
              onClick={() => {
                if (!hasPermission("bot_add_app") && !hasPermission("bot_invite")) return;
                window.open(generateBotInviteUrl(clientId, customPermissions), "_blank");
                setIsInviteModalOpen(false);
              }}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir no Navegador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 6: CORTE, REDIMENSIONAMENTO E ZOOM DE IMAGEM (AVATAR E BANNER) */}
      {/* ========================================================================= */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        onClose={() => {
          setIsCropModalOpen(false);
          setCropFile(null);
          setCropImageUrl(null);
        }}
        imageFile={cropFile}
        imageUrl={cropImageUrl}
        cropShape={cropTarget === "avatar" ? "round" : "rect"}
        defaultAspectRatio={undefined}
        allowedRatios={
          cropTarget === "banner"
            ? [
                { label: "2.5:1 Banner Discord", ratio: 2.5 },
                { label: "16:9 Panorâmico", ratio: 16 / 9 },
                { label: "3:1 Ultrawide", ratio: 3 },
              ]
            : undefined
        }
        title={
          cropTarget === "avatar"
            ? "Ajustar Foto de Avatar do Bot"
            : "Ajustar Imagem do Banner do Bot"
        }
        description={
          cropTarget === "avatar"
            ? "A proporção é automática ou 1:1 circular. Arraste e dê zoom para posicionar a foto do bot."
            : "A proporção se ajusta automaticamente à sua imagem. Use o zoom e arraste para enquadrar perfeitamente."
        }
        targetWidth={cropTarget === "avatar" ? 512 : 1280}
        onCropSave={handleCropSave}
        isSaving={isCropSaving}
      />

      {/* ========================================================================= */}
      {/* MODAL 7: ENVIAR MENSAGEM VIA BOT DISCORD */}
      {/* ========================================================================= */}
      <Dialog open={isSendMessageModalOpen} onOpenChange={setIsSendMessageModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#5865F2]" />
              Enviar Mensagem pelo Bot
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Envie uma mensagem em tempo real para um canal do Discord através do bot oficial {botName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">ID do Canal de Destino (Opcional)</Label>
              <Input
                value={sendMsgChannelId}
                onChange={(e) => setSendMsgChannelId(e.target.value)}
                placeholder="Ex: 1535505650308620400 (ou deixe em branco para canal padrão)"
                className="bg-zinc-900 border-zinc-800 text-xs font-mono"
              />
              <p className="text-[0.65rem] text-muted-foreground">
                Informe o ID do canal de texto no Discord onde a mensagem será postada.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Conteúdo da Mensagem</Label>
                <span className="text-[0.65rem] text-muted-foreground font-mono">
                  {sendMsgContent.length}/2000
                </span>
              </div>
              <Textarea
                value={sendMsgContent}
                onChange={(e) => setSendMsgContent(e.target.value)}
                placeholder="Digite a mensagem a ser enviada pelo bot..."
                rows={4}
                maxLength={2000}
                className="bg-zinc-900 border-zinc-800 text-xs resize-none"
              />
              <p className="text-[0.68rem] text-zinc-400">
                Suporta marcações do Discord como <strong className="text-zinc-200">**negrito**</strong>, <em className="text-zinc-200">*itálico*</em> e menções.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSendMessageModalOpen(false)}
              className="bg-zinc-900 border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSendingMessage || !sendMsgContent.trim() || !hasPermission("bot_send_message")}
              onClick={handleSendDiscordMessage}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingMessage ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

