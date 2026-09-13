import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  Webhook,
  Plus,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
  Hash,
  Send,
  Trash2,
  Edit3,
  Copy,
  Check,
  Server,
  Upload,
  Image as ImageIcon,
  Palette,
  Bot,
  Layers,
  Clock,
  HelpCircle,
  ChevronRight,
  Info,
  ShieldCheck,
  Sparkles,
  MessageSquarePlus,
  Terminal,
  ExternalLink,
  Code2,
  Eye,
  Type,
  AtSign,
  Bookmark,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  CEO_CONFIG_EVENT,
  DEV_CONFIG_EVENT,
  getCeoTagPermissionsSync,
  getCeoTagPermissions,
} from "@/services/devService";
import type { Permission } from "@/lib/permissions";
import {
  getDiscordWebhooksConfig,
  saveDiscordWebhooksConfig,
  postMessageToWebhookChannel,
  testDiscordWebhookChannel,
  uploadWebhookAvatar,
  isValidDiscordId,
  getWebhookShareableUrl,
  getWebPosterUrl,
  getDiscohookUrl,
  isDiscordWebhookUrl,
  fetchOrCreateDiscordChannelWebhook,
  DEFAULT_WEBHOOKS_CONFIG,
  KNOWN_CHANNEL_WEBHOOKS,
  type DiscordWebhook,
  type DiscordWebhooksConfig,
  type PostMessagePayload,
} from "@/services/webhookService";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { name: "Verde Esmeralda", hex: "#10B981" },
  { name: "Verde Militar", hex: "#15803D" },
  { name: "Azul Polícia", hex: "#3B82F6" },
  { name: "Ciano Diamante", hex: "#06B6D4" },
  { name: "Roxo Real", hex: "#8B5CF6" },
  { name: "Rosa Neon", hex: "#EC4899" },
  { name: "Laranja Twin Wheels", hex: "#F97316" },
  { name: "Âmbar Dourado", hex: "#F59E0B" },
  { name: "Vermelho Alerta", hex: "#EF4444" },
  { name: "Carmim Crime", hex: "#E11D48" },
  { name: "Discord Blurple", hex: "#5865F2" },
  { name: "Preto Tático", hex: "#27272A" },
];

const SERVERS_PRESETS = [
  {
    id: "1535505650308620400",
    name: "Twin Wheel",
    label: "Twin Wheel (Facção GTA RP)",
    tag: "Principal",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    channels: [
      { id: "1548413371194286314", name: "⚙️│testedev", hint: "Testes de Dev" },
      { id: "1535637119471587408", name: "📰│bate-papo", hint: "Bate-Papo da Facção" },
      { id: "1535505650920984628", name: "📑│avisos", hint: "Avisos Oficiais" },
      { id: "1535637509818548234", name: "📦│baus", hint: "Baús e Estoque" },
    ],
  },
  {
    id: "1537229296697999462",
    name: "malaca developers",
    label: "malaca developers (Ambiente Dev)",
    tag: "Dev",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
    channels: [
      { id: "1538375505953165312", name: "📄・geral", hint: "Geral Servidor Dev" },
    ],
  },
];

interface DevWebhooksConfigCardProps {
  isCeoView?: boolean;
}

export function DevWebhooksConfigCard({ isCeoView }: DevWebhooksConfigCardProps = {}) {
  const { user, profile, level, isDevUser, isCeoMode, hasPermission } = useAuth();

  const isCeoPanel = Boolean(
    isCeoView ||
      isCeoMode ||
      (typeof window !== "undefined" &&
        (window.location.pathname.startsWith("/ceo") || window.location.hash.includes("/ceo")))
  );

  const [ceoPermTick, setCeoPermTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setCeoPermTick((prev) => prev + 1);
    };
    window.addEventListener(DEV_CONFIG_EVENT, handleUpdate);
    window.addEventListener(CEO_CONFIG_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(DEV_CONFIG_EVENT, handleUpdate);
      window.removeEventListener(CEO_CONFIG_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (isCeoPanel) {
      getCeoTagPermissions(user, profile, level).then(() => {
        setCeoPermTick((prev) => prev + 1);
      });
    }
  }, [isCeoPanel, user, profile, level]);

  const ceoPerms = useMemo(() => {
    return getCeoTagPermissionsSync();
  }, [ceoPermTick]);

  const checkPerm = (perm: Permission): boolean => {
    if (isCeoPanel) {
      return ceoPerms.includes(perm);
    }
    return isDevUser || hasPermission(perm);
  };

  // Permissões granulares para cada opção/função da página de Webhooks
  // No painel CEO, as permissões que o CEO não tiver nem são mostradas na página
  const canSendMessage = checkPerm("webhook_send_message");
  const canTestWebhook = checkPerm("webhook_test");
  const canCreateWebhook = checkPerm("webhook_create");
  const canEditWebhook = checkPerm("webhook_edit");
  const canDeleteWebhook = checkPerm("webhook_delete");
  const canToggleActive = checkPerm("webhook_toggle_active");
  const canCopyUrl = checkPerm("webhook_copy_url");
  const canViewCode = checkPerm("webhook_view_code");
  const canSaveConfig = checkPerm("webhook_save_config");

  const [config, setConfig] = useState<DiscordWebhooksConfig>(DEFAULT_WEBHOOKS_CONFIG);
  const [initialConfig, setInitialConfig] = useState<DiscordWebhooksConfig>(DEFAULT_WEBHOOKS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingInModal, setSavingInModal] = useState(false);

  // Modal de Criação / Edição
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<DiscordWebhook | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const thumbnailFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal de Postagem Manual de Mensagem
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [targetWebhookForPost, setTargetWebhookForPost] = useState<DiscordWebhook | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [postMention, setPostMention] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
  const postImageInputRef = useRef<HTMLInputElement | null>(null);

  // Modal de Código / Como Usar
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [codeWebhook, setCodeWebhook] = useState<DiscordWebhook | null>(null);

  // Estado de teste rápido
  const [testingId, setTestingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Carrega configurações
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getDiscordWebhooksConfig()
      .then((data) => {
        if (isMounted) {
          setConfig(data);
          setInitialConfig(JSON.parse(JSON.stringify(data)));
        }
      })
      .catch((err) => {
        if (isMounted) {
          toast.error("Falha ao carregar webhooks: " + (err?.message || err));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasChanges = useMemo(() => {
    return JSON.stringify(config) !== JSON.stringify(initialConfig);
  }, [config, initialConfig]);

  // Salvar tudo
  const handleSaveAll = async () => {
    if (!canSaveConfig) {
      toast.error("Você não possui permissão para salvar configurações globais de webhooks.");
      return;
    }
    setSaving(true);
    try {
      await saveDiscordWebhooksConfig(config, user, profile, level);
      setInitialConfig(JSON.parse(JSON.stringify(config)));
      toast.success("Configuração de canais/webhooks salva com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Abrir Modal para Novo Webhook
  const handleCreateNew = () => {
    if (!canCreateWebhook) {
      toast.error("Você não possui permissão para criar novos webhooks.");
      return;
    }
    const newId = `webhook_${Date.now()}`;
    setEditingWebhook({
      id: newId,
      name: "",
      guildId: config.defaultGuildId || "1535505650308620400",
      channelId: "",
      description: "",
      enabled: true,
      username: config.defaultUsername || "Twin Wheels RP",
      avatarUrl: config.defaultAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      embedColor: "#10B981",
      defaultTitle: "💻 Teste Desenvolvedor",
      defaultDescription: "by malaca",
      useCodeblockField: true,
      codeblockLanguage: "",
      authorName: "",
      authorIconUrl: "",
      authorUrl: "",
      thumbnailUrl: "",
      imageUrl: "",
      footerText: config.defaultFooterText || "Twin Wheels RP",
      footerIconUrl: "",
      mentionRoles: "",
      showTimestamp: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsNew(true);
    setIsEditorOpen(true);
  };

  // Abrir Modal de Edição
  const handleEdit = (wh: DiscordWebhook) => {
    if (!canEditWebhook) {
      toast.error("Você não possui permissão para editar webhooks.");
      return;
    }
    setEditingWebhook({
      ...wh,
      defaultTitle: wh.defaultTitle !== undefined ? wh.defaultTitle : "💻 Teste Desenvolvedor",
      defaultDescription: wh.defaultDescription !== undefined ? wh.defaultDescription : "by malaca",
      useCodeblockField: wh.useCodeblockField ?? true,
      embedColor: wh.embedColor || "#10B981",
      showTimestamp: wh.showTimestamp ?? true,
    });
    setIsNew(false);
    setIsEditorOpen(true);
  };

  // Upload de Avatar direto do arquivo
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const publicUrl = await uploadWebhookAvatar(file);
      setEditingWebhook((prev) => (prev ? { ...prev, avatarUrl: publicUrl } : null));
      toast.success("Avatar carregado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da imagem.");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = "";
    }
  };

  // Upload de Miniatura (Thumbnail) direto do arquivo
  const handleThumbnailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A miniatura deve ter no máximo 5MB.");
      return;
    }

    setIsUploadingThumbnail(true);
    try {
      const publicUrl = await uploadWebhookAvatar(file);
      setEditingWebhook((prev) => (prev ? { ...prev, thumbnailUrl: publicUrl } : null));
      toast.success("Miniatura (thumbnail) carregada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da miniatura.");
    } finally {
      setIsUploadingThumbnail(false);
      if (thumbnailFileInputRef.current) thumbnailFileInputRef.current.value = "";
    }
  };

  // Upload de Imagem Grande / Banner direto do arquivo
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 8MB.");
      return;
    }

    setIsUploadingBanner(true);
    try {
      const publicUrl = await uploadWebhookAvatar(file);
      setEditingWebhook((prev) => (prev ? { ...prev, imageUrl: publicUrl } : null));
      toast.success("Imagem grande / Banner carregado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload do banner.");
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
    }
  };

  // Upload de Imagem para Postagem de Mensagem
  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPostImage(true);
    try {
      const publicUrl = await uploadWebhookAvatar(file);
      setPostImageUrl(publicUrl);
      toast.success("Imagem da postagem anexada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload da imagem.");
    } finally {
      setIsUploadingPostImage(false);
      if (postImageInputRef.current) postImageInputRef.current.value = "";
    }
  };

  // Salvar no Modal com persistência direta e imediata no Supabase
  const handleSaveEditor = async () => {
    if (!editingWebhook) return;

    if (isNew && !canCreateWebhook) {
      toast.error("Você não possui permissão para criar webhooks.");
      return;
    }
    if (!isNew && !canEditWebhook) {
      toast.error("Você não possui permissão para editar webhooks.");
      return;
    }

    const trimmedName = editingWebhook.name.trim();
    if (!trimmedName) {
      toast.error("Informe um nome para identificar este webhook.");
      return;
    }

    const trimmedGuildId = editingWebhook.guildId.trim();
    if (!trimmedGuildId || !isValidDiscordId(trimmedGuildId)) {
      toast.error("Informe um ID de Servidor Discord válido (17 a 20 dígitos).");
      return;
    }

    const trimmedChannelId = editingWebhook.channelId.trim();
    if (!trimmedChannelId || !isValidDiscordId(trimmedChannelId)) {
      toast.error("Informe um ID de Canal do Servidor válido (17 a 20 dígitos).");
      return;
    }

    setSavingInModal(true);
    try {
      let resolvedWebhookUrl = editingWebhook.webhookUrl?.trim();
      if (!resolvedWebhookUrl && KNOWN_CHANNEL_WEBHOOKS[trimmedChannelId]) {
        resolvedWebhookUrl = KNOWN_CHANNEL_WEBHOOKS[trimmedChannelId];
      }

      const updatedWebhook: DiscordWebhook = {
        ...editingWebhook,
        name: trimmedName,
        guildId: trimmedGuildId,
        channelId: trimmedChannelId,
        username: editingWebhook.username?.trim() || trimmedName,
        description: editingWebhook.description?.trim() || "",
        avatarUrl: editingWebhook.avatarUrl?.trim() || config.defaultAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
        webhookUrl: resolvedWebhookUrl || undefined,
        embedColor: editingWebhook.embedColor?.trim() || "#10B981",
        defaultTitle: editingWebhook.defaultTitle?.trim() || undefined,
        defaultDescription: editingWebhook.defaultDescription?.trim() || undefined,
        useCodeblockField: editingWebhook.useCodeblockField ?? true,
        codeblockLanguage: editingWebhook.codeblockLanguage?.trim() || undefined,
        authorName: editingWebhook.authorName?.trim() || undefined,
        authorIconUrl: editingWebhook.authorIconUrl?.trim() || undefined,
        authorUrl: editingWebhook.authorUrl?.trim() || undefined,
        thumbnailUrl: editingWebhook.thumbnailUrl?.trim() || undefined,
        imageUrl: editingWebhook.imageUrl?.trim() || undefined,
        footerText: editingWebhook.footerText?.trim() || undefined,
        footerIconUrl: editingWebhook.footerIconUrl?.trim() || undefined,
        showTimestamp: editingWebhook.showTimestamp ?? true,
        mentionRoles: editingWebhook.mentionRoles?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      let newWebhooks: DiscordWebhook[];
      if (isNew) {
        newWebhooks = [updatedWebhook, ...config.webhooks];
      } else {
        newWebhooks = config.webhooks.map((w) => (w.id === updatedWebhook.id ? updatedWebhook : w));
      }

      const newConfig = { ...config, webhooks: newWebhooks };

      // Persiste no Supabase imediatamente
      await saveDiscordWebhooksConfig(newConfig, user, profile, level);
      setConfig(newConfig);
      setInitialConfig(JSON.parse(JSON.stringify(newConfig)));
      setIsEditorOpen(false);
      toast.success(isNew ? "Webhook criado e salvo com sucesso!" : "Webhook atualizado e salvo com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar webhook: " + (err?.message || err));
    } finally {
      setSavingInModal(false);
    }
  };

  // Excluir Webhook com persistência imediata
  const handleDelete = async (id: string) => {
    if (!canDeleteWebhook) {
      toast.error("Você não possui permissão para excluir webhooks.");
      return;
    }
    const filtered = config.webhooks.filter((w) => w.id !== id);
    const newConfig = { ...config, webhooks: filtered };
    try {
      await saveDiscordWebhooksConfig(newConfig, user, profile, level);
      setConfig(newConfig);
      setInitialConfig(JSON.parse(JSON.stringify(newConfig)));
      toast.success("Webhook removido e salvo com sucesso.");
    } catch (err: any) {
      toast.error("Erro ao remover: " + (err?.message || err));
    }
  };

  // Alternar Ativo/Pausado com persistência imediata
  const handleToggle = async (id: string, enabled: boolean) => {
    if (!canToggleActive) {
      toast.error("Você não possui permissão para ativar ou pausar webhooks.");
      return;
    }
    const updated = config.webhooks.map((w) => (w.id === id ? { ...w, enabled } : w));
    const newConfig = { ...config, webhooks: updated };
    try {
      await saveDiscordWebhooksConfig(newConfig, user, profile, level);
      setConfig(newConfig);
      setInitialConfig(JSON.parse(JSON.stringify(newConfig)));
      toast.success(enabled ? "Webhook ativado!" : "Webhook pausado.");
    } catch (err: any) {
      toast.error("Erro ao alterar status: " + (err?.message || err));
    }
  };

  // Copiar Link Oficial do Webhook Discord (Compatível com Discohook & FiveM)
  const handleCopyWebhookLink = async (wh: DiscordWebhook) => {
    if (!canCopyUrl) {
      toast.error("Você não possui permissão para copiar links de webhooks.");
      return;
    }
    let url = getWebhookShareableUrl(wh);
    if (!isDiscordWebhookUrl(url)) {
      try {
        const res = await fetchOrCreateDiscordChannelWebhook(wh.channelId, wh.name);
        if (res.success && res.webhookUrl) {
          url = res.webhookUrl;
          setConfig((prev) => ({
            ...prev,
            webhooks: prev.webhooks.map((w) => (w.id === wh.id ? { ...w, webhookUrl: res.webhookUrl } : w)),
          }));
        }
      } catch {}
    }

    navigator.clipboard.writeText(url);
    setCopiedId(wh.id);
    toast.success(`Link oficial do Discord copiado! 100% compatível com Discohook e FiveM.`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  // Testar Envio
  const handleTest = async (wh: DiscordWebhook) => {
    if (!canTestWebhook) {
      toast.error("Você não possui permissão para testar envio de webhooks.");
      return;
    }
    setTestingId(wh.id);
    try {
      const res = await testDiscordWebhookChannel(wh, profile?.nome || user?.email || "Desenvolvedor", user, profile, level);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
      // Atualiza status do webhook
      setConfig((prev) => ({
        ...prev,
        webhooks: prev.webhooks.map((w) =>
          w.id === wh.id
            ? {
                ...w,
                lastTriggeredAt: new Date().toISOString(),
                lastStatus: res.success ? "success" : "error",
                lastErrorMessage: res.success ? undefined : res.message,
              }
            : w
        ),
      }));
    } catch (err: any) {
      toast.error("Falha no teste: " + (err?.message || err));
    } finally {
      setTestingId(null);
    }
  };

  // Abrir Modal de Postagem
  const handleOpenPostModal = (wh: DiscordWebhook) => {
    if (!canSendMessage) {
      toast.error("Você não possui permissão para disparar mensagens via webhook.");
      return;
    }
    setTargetWebhookForPost(wh);
    setPostTitle(wh.defaultTitle || "");
    setPostDescription(wh.defaultDescription || "");
    setPostImageUrl(wh.imageUrl || "");
    setPostMention(wh.mentionRoles || "");
    setIsPostModalOpen(true);
  };

  // Enviar Postagem
  const handleSendPost = async () => {
    if (!targetWebhookForPost) return;

    if (!canSendMessage) {
      toast.error("Você não possui permissão para disparar mensagens via webhook.");
      return;
    }

    if (!postDescription.trim()) {
      toast.error("Digite o texto ou conteúdo da mensagem.");
      return;
    }

    setIsPosting(true);
    try {
      const res = await postMessageToWebhookChannel(
        targetWebhookForPost,
        {
          title: postTitle.trim() || undefined,
          description: postDescription.trim(),
          imageUrl: postImageUrl.trim() || undefined,
          mention: postMention.trim() || undefined,
        },
        profile?.nome || user?.email || "Usuário",
        user,
        profile,
        level
      );

      if (res.success) {
        toast.success(res.message);
        setIsPostModalOpen(false);
      } else {
        toast.error(res.message);
      }

      // Atualiza status do webhook
      setConfig((prev) => ({
        ...prev,
        webhooks: prev.webhooks.map((w) =>
          w.id === targetWebhookForPost.id
            ? {
                ...w,
                lastTriggeredAt: new Date().toISOString(),
                lastStatus: res.success ? "success" : "error",
                lastErrorMessage: res.success ? undefined : res.message,
              }
            : w
        ),
      }));
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem: " + (err?.message || err));
    } finally {
      setIsPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium">Carregando gerenciador de webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-950/60 border border-border/60 backdrop-blur-sm shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-sm">
            <Webhook className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              Webhooks e Canais de Postagem
              <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30 text-[10px]">
                {config.webhooks.length} {config.webhooks.length === 1 ? "Canal" : "Canais"}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure canais do Discord com ID do Servidor e ID do Canal para postagem de mensagens e avisos pela equipe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {canSaveConfig && hasChanges && (
            <Button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-lg shadow-emerald-950/40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar Alterações
            </Button>
          )}

          {canCreateWebhook && (
            <Button
              onClick={handleCreateNew}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 shadow-md"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo Webhook
            </Button>
          )}
        </div>
      </div>

      {/* LISTA DE WEBHOOKS */}
      {config.webhooks.length === 0 ? (
        <Card className="surface-card p-12 text-center border-dashed border-border/80">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-secondary/50 text-muted-foreground">
              <Webhook className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-foreground">Nenhum canal/webhook configurado</h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Crie seu primeiro webhook informando apenas o ID do Servidor e o ID do Canal do Discord para postar mensagens.
            </p>
            {canCreateWebhook && (
              <Button onClick={handleCreateNew} className="text-xs font-bold gap-1.5 mt-2">
                <Plus className="h-3.5 w-3.5" />
                Criar Primeiro Webhook
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {config.webhooks.map((wh) => (
            <Card
              key={wh.id}
              className={cn(
                "surface-card border transition-all duration-200 hover:shadow-lg flex flex-col justify-between overflow-hidden",
                wh.enabled ? "border-border/80 bg-zinc-950/60" : "border-border/40 opacity-75 bg-zinc-950/30"
              )}
              style={{ borderLeftWidth: "4px", borderLeftColor: wh.embedColor || "#10B981" }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar do Bot */}
                    <img
                      src={wh.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                      alt={wh.username || "Bot"}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-border shrink-0 bg-zinc-900"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-sm font-bold truncate text-foreground">{wh.name}</CardTitle>
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: wh.embedColor || "#10B981" }}
                          title={`Cor do Embed: ${wh.embedColor || "#10B981"}`}
                        />
                        {wh.guildId === "1535505650308620400" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/25 text-[10px] px-1.5 py-0 font-bold gap-1">
                            <Server className="h-3 w-3" /> Twin Wheel
                          </Badge>
                        ) : wh.guildId === "1537229296697999462" ? (
                          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/25 text-[10px] px-1.5 py-0 font-bold gap-1">
                            <Terminal className="h-3 w-3" /> malaca devs
                          </Badge>
                        ) : (
                          <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px] px-1.5 py-0 font-mono gap-1">
                            <Server className="h-3 w-3" /> {wh.guildId}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <p className="text-[0.7rem] text-muted-foreground truncate">
                          Emissor: <strong className="text-foreground">{wh.username || "Twin Wheels RP"}</strong>
                        </p>
                        {wh.defaultTitle && (
                          <Badge variant="outline" className="text-[9px] bg-zinc-900 border-zinc-800 text-zinc-300 font-mono py-0 h-4">
                            {wh.defaultTitle}
                          </Badge>
                        )}
                        {wh.useCodeblockField && (
                          <Badge variant="outline" className="text-[9px] bg-violet-950/30 border-violet-800/30 text-violet-300 font-mono py-0 h-4">
                            Codeblock
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Switch Ativo / Pausado */}
                  <div className="flex items-center gap-2 shrink-0">
                    {canToggleActive ? (
                      <Switch
                        checked={wh.enabled}
                        onCheckedChange={(val) => handleToggle(wh.id, val)}
                        title={wh.enabled ? "Webhook Ativo" : "Webhook Pausado"}
                      />
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-mono py-0 px-1.5",
                          wh.enabled
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                            : "border-zinc-700 text-zinc-400"
                        )}
                      >
                        {wh.enabled ? "Ativo" : "Pausado"}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                {wh.description && (
                  <p className="text-xs text-muted-foreground/90 line-clamp-2">{wh.description}</p>
                )}
                {wh.defaultDescription && (
                  <p className="text-[11px] text-zinc-400 italic bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800/60 line-clamp-1">
                    Subtítulo: &ldquo;{wh.defaultDescription}&rdquo;
                  </p>
                )}

                {/* IDs do Servidor e Canal */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[0.7rem] font-mono">
                  <div>
                    <span className="text-[0.65rem] text-muted-foreground block font-sans font-semibold">
                      Servidor Discord:
                    </span>
                    <span className="text-foreground truncate block font-bold" title={wh.guildId}>
                      {wh.guildId === "1535505650308620400"
                        ? "Twin Wheel (Principal)"
                        : wh.guildId === "1537229296697999462"
                        ? "malaca developers (Dev)"
                        : wh.guildId}
                    </span>
                  </div>
                  <div>
                    <span className="text-[0.65rem] text-muted-foreground block font-sans font-semibold">
                      Canal do Servidor:
                    </span>
                    <span className="text-foreground truncate block font-bold text-violet-300" title={wh.channelId}>
                      {wh.channelId === "1548413371194286314"
                        ? "#⚙️│testedev"
                        : wh.channelId === "1535637119471587408"
                        ? "#📰│bate-papo"
                        : wh.channelId === "1535505650920984628"
                        ? "#📑│avisos"
                        : wh.channelId === "1535637509818548234"
                        ? "#📦│baus"
                        : wh.channelId === "1538375505953165312"
                        ? "#📄・geral"
                        : `#${wh.channelId}`}
                    </span>
                  </div>
                </div>

                {/* Link do Webhook para Compartilhar (Oficial Discord / Discohook) */}
                {canCopyUrl && (
                  <div className="space-y-2 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-center justify-between text-[0.68rem]">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Webhook className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Link do Webhook:</span>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0 font-medium">
                          Discohook • Oficial
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyWebhookLink(wh)}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold text-[0.68rem] transition-colors"
                      >
                        {copiedId === wh.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[0.68rem] font-mono text-zinc-300">
                      <span className="truncate flex-1 select-all font-mono" title={getWebhookShareableUrl(wh)}>
                        {getWebhookShareableUrl(wh)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyWebhookLink(wh)}
                        className="h-6 px-1.5 text-[0.65rem] font-bold text-muted-foreground hover:text-foreground hover:bg-zinc-800 shrink-0"
                        title="Copiar link oficial do Discord"
                      >
                        {copiedId === wh.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <a
                        href={getDiscohookUrl(wh)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-6 px-2 text-[0.65rem] font-bold flex items-center gap-1 text-violet-400 hover:text-violet-300 hover:bg-violet-950/40 rounded border border-violet-500/20 shrink-0 transition-colors"
                        title="Abrir no Discohook com este webhook pré-carregado"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Discohook
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-[0.62rem] text-muted-foreground pt-0.5">
                      <span>100% aceito no Discohook, FiveM, bots e cURL.</span>
                      <a
                        href={getWebPosterUrl(wh)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-white underline inline-flex items-center gap-1"
                        title="Abrir formulário web simples sem precisar do Discohook"
                      >
                        Postador Web
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Status do Último Envio / Teste */}
                {wh.lastTriggeredAt && (
                  <div
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[0.68rem] font-medium border",
                      wh.lastStatus === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}
                  >
                    {wh.lastStatus === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                    )}
                    <span className="truncate flex-1">
                      {wh.lastStatus === "success"
                        ? "Entrega confirmada no Discord"
                        : wh.lastErrorMessage || "Falha na entrega"}
                    </span>
                    <span className="text-[0.6rem] text-muted-foreground shrink-0 font-mono">
                      {new Date(wh.lastTriggeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </CardContent>

              {(canSendMessage || canCopyUrl || canTestWebhook || canViewCode || canEditWebhook || canDeleteWebhook) && (
                <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 flex-wrap">
                  {/* Botões de Ação Direta */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Botão Postar Mensagem */}
                    {canSendMessage && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenPostModal(wh)}
                        disabled={!wh.enabled}
                        className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs gap-1.5 h-8 shadow-sm"
                      >
                        <MessageSquarePlus className="h-3.5 w-3.5" />
                        Postar Mensagem
                      </Button>
                    )}

                    {/* Botão Copiar Link */}
                    {canCopyUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyWebhookLink(wh)}
                        disabled={!wh.enabled}
                        className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 h-8 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                        title="Copiar link deste webhook para compartilhar com outros membros"
                      >
                        {copiedId === wh.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-primary" />
                            <span>Copiar Link</span>
                          </>
                        )}
                      </Button>
                    )}

                    {/* Botão Testar */}
                    {canTestWebhook && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(wh)}
                        disabled={testingId === wh.id || !wh.enabled}
                        className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 h-8 hover:bg-zinc-800"
                      >
                        {testingId === wh.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Testar
                      </Button>
                    )}

                    {/* Botão Como Usar / API */}
                    {canViewCode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCodeWebhook(wh);
                          setIsCodeModalOpen(true);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                        title="Ver instrução de uso / código"
                      >
                        <Code2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Botões de Edição e Exclusão */}
                  {(canEditWebhook || canDeleteWebhook) && (
                    <div className="flex items-center gap-1">
                      {canEditWebhook && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(wh)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Editar webhook"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDeleteWebhook && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(wh.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-400"
                          title="Excluir webhook"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR WEBHOOK */}
      {/* ========================================================================= */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-5xl lg:max-w-6xl bg-zinc-950 border-zinc-800 text-foreground max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              {isNew ? "Criar Novo Webhook de Canal" : "Editar Webhook & Estilo de Mensagem"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure o destino, identidade do bot, cores personalizadas e estilo padrão dos embeds com pré-visualização ao vivo.
            </DialogDescription>
          </DialogHeader>

          {editingWebhook && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-2">
              {/* ================================================================= */}
              {/* COLUNA ESQUERDA: FORMULÁRIO DE CONFIGURAÇÃO (lg:col-span-7) */}
              {/* ================================================================= */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. Identificação Geral */}
                <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <h4 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                    <Bookmark className="h-3.5 w-3.5 text-primary" />
                    Identificação do Webhook
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">
                        Nome do Webhook <span className="text-rose-400">*</span>
                      </Label>
                      <Input
                        value={editingWebhook.name}
                        onChange={(e) =>
                          setEditingWebhook({
                            ...editingWebhook,
                            name: e.target.value,
                            username:
                              !editingWebhook.username || editingWebhook.username === editingWebhook.name
                                ? e.target.value
                                : editingWebhook.username,
                          })
                        }
                        placeholder="Ex: TW | Logs Baú QG"
                        className="bg-zinc-950 border-zinc-800 text-xs font-bold"
                      />
                      <p className="text-[0.65rem] text-muted-foreground">
                        Nome descritivo para identificar facilmente este webhook no painel.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Finalidade / Descrição (Opcional)</Label>
                      <Input
                        value={editingWebhook.description || ""}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, description: e.target.value })}
                        placeholder="Ex: Canal para comunicados e informativos da liderança"
                        className="bg-zinc-950 border-zinc-800 text-xs"
                      />
                      <p className="text-[0.65rem] text-muted-foreground">
                        Explicação sobre para que serve e onde é usado este webhook.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Servidor Discord e Canal de Destino */}
                <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-indigo-400" />
                      Servidor & Canal Discord <span className="text-rose-400">*</span>
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Guild: {editingWebhook.guildId || "Nenhum"}
                    </span>
                  </div>

                  {/* Botões Rápidos de Servidor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SERVERS_PRESETS.map((srv) => {
                      const isSelected = editingWebhook.guildId === srv.id;
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => {
                            setEditingWebhook((prev) => (prev ? { ...prev, guildId: srv.id } : null));
                          }}
                          className={cn(
                            "p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-2",
                            isSelected
                              ? "bg-primary/15 border-primary/60 shadow-sm"
                              : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <Server className={cn("h-3.5 w-3.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                              <span className={isSelected ? "text-primary" : "text-foreground"}>{srv.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate block font-mono">{srv.id}</span>
                          </div>
                          <Badge className={cn("text-[9px] px-1.5 py-0 font-bold", srv.badgeColor)}>
                            {srv.tag}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>

                  {/* Input de ID de servidor customizado */}
                  <Input
                    value={editingWebhook.guildId}
                    onChange={(e) => setEditingWebhook({ ...editingWebhook, guildId: e.target.value })}
                    placeholder="ID do Servidor Discord (ex: 1535505650308620400)"
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold h-8"
                  />

                  {/* Canal com chips dos canais conhecidos */}
                  <div className="space-y-2 pt-1 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-blue-400" />
                        ID do Canal Discord <span className="text-rose-400">*</span>
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Canal de postagem</span>
                    </div>

                    {(() => {
                      const curPreset = SERVERS_PRESETS.find((s) => s.id === editingWebhook.guildId);
                      if (!curPreset) return null;
                      return (
                        <div className="space-y-1">
                          <span className="text-[0.65rem] font-semibold text-muted-foreground block">
                            Canais sugeridos no servidor {curPreset.name}:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {curPreset.channels.map((ch) => {
                              const isSel = editingWebhook.channelId === ch.id;
                              return (
                                <button
                                  key={ch.id}
                                  type="button"
                                  onClick={() => {
                                    setEditingWebhook((prev) => {
                                      if (!prev) return null;
                                      const newName = !prev.name || prev.name.startsWith("Canal") ? ch.name : prev.name;
                                      return {
                                        ...prev,
                                        channelId: ch.id,
                                        name: newName,
                                        webhookUrl: KNOWN_CHANNEL_WEBHOOKS[ch.id] || prev.webhookUrl,
                                      };
                                    });
                                  }}
                                  className={cn(
                                    "px-2.5 py-1 rounded-md text-[0.7rem] font-mono border transition-all flex items-center gap-1.5",
                                    isSel
                                      ? "bg-violet-600 text-white border-violet-500 font-bold shadow-sm"
                                      : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white"
                                  )}
                                >
                                  <Hash className="h-3 w-3" />
                                  <span>{ch.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    <Input
                      value={editingWebhook.channelId}
                      onChange={(e) => setEditingWebhook({ ...editingWebhook, channelId: e.target.value })}
                      placeholder="Ex: 1548413371194286314"
                      className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold h-8"
                    />
                  </div>

                  {/* URL Oficial do Webhook Discord */}
                  {canCopyUrl && (
                    <div className="space-y-1 pt-1 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold flex items-center gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                          URL Oficial do Webhook (Discohook / FiveM)
                        </Label>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-mono">
                          Oficial Discord
                        </Badge>
                      </div>
                      <Input
                        value={editingWebhook.webhookUrl || ""}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, webhookUrl: e.target.value })}
                        placeholder="https://discord.com/api/webhooks/... (preenchida automaticamente se vazia)"
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Identidade do Bot Emissor */}
                <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <h4 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-400" />
                    Identidade do Bot Emissor
                  </h4>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Nome de Exibição do Bot</Label>
                      <Input
                        value={editingWebhook.username || ""}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, username: e.target.value })}
                        placeholder="Ex: TW | Logs Baú QG"
                        className="bg-zinc-950 border-zinc-800 text-xs font-bold"
                      />
                    </div>

                    {/* Avatar do Bot com Upload */}
                    <div className="space-y-2 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                        Avatar do Bot
                      </Label>

                      <div className="flex items-center gap-3">
                        <img
                          src={editingWebhook.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                          alt="Avatar Preview"
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/40 bg-zinc-900 shrink-0 shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                          }}
                        />
                        <div className="flex-1 space-y-1.5">
                          <input
                            type="file"
                            ref={avatarFileInputRef}
                            accept="image/*"
                            onChange={handleAvatarFileUpload}
                            className="hidden"
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => avatarFileInputRef.current?.click()}
                              disabled={isUploadingAvatar}
                              className="bg-zinc-900 border-zinc-700 text-xs font-bold gap-1.5 h-8"
                            >
                              {isUploadingAvatar ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                              ) : (
                                <Upload className="h-3.5 w-3.5 text-primary" />
                              )}
                              {isUploadingAvatar ? "Enviando..." : "Fazer Upload de Imagem"}
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setEditingWebhook((prev) =>
                                  prev ? { ...prev, avatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png" } : null
                                )
                              }
                              className="text-[0.65rem] text-muted-foreground hover:text-foreground h-8"
                            >
                              Restaurar Padrão TW
                            </Button>
                          </div>
                          <p className="text-[0.65rem] text-muted-foreground">
                            PNG, JPG, WebP ou GIF (máx. 5MB). Salvo automaticamente na nuvem.
                          </p>
                        </div>
                      </div>

                      <Input
                        value={editingWebhook.avatarUrl || ""}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, avatarUrl: e.target.value })}
                        placeholder="Ou cole a URL direta: https://i.ibb.co/... ou link público"
                        className="bg-zinc-900 border-zinc-800 text-xs font-mono h-8"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Cores & Paleta do Embed Discord */}
                <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      Cores do Embed Discord
                    </h4>
                    <span className="text-xs font-mono font-bold text-foreground">
                      {editingWebhook.embedColor || "#10B981"}
                    </span>
                  </div>

                  {/* Paleta de 12 Cores Curadas */}
                  <div className="space-y-1.5">
                    <Label className="text-[0.7rem] text-muted-foreground font-semibold">
                      Paleta Recomendada (GTA RP / Twin Wheels):
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {COLOR_PRESETS.map((color) => {
                        const isCur = editingWebhook.embedColor?.toLowerCase() === color.hex.toLowerCase();
                        return (
                          <button
                            key={color.hex}
                            type="button"
                            onClick={() =>
                              setEditingWebhook((prev) => (prev ? { ...prev, embedColor: color.hex } : null))
                            }
                            className={cn(
                              "p-2 rounded-lg border text-left flex items-center gap-2 transition-all",
                              isCur
                                ? "bg-zinc-900 border-primary ring-1 ring-primary shadow-sm"
                                : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                            )}
                          >
                            <span
                              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm border border-black/30"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-[10px] font-semibold truncate text-zinc-300">
                              {color.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Seletor Customizado HEX & Color Picker */}
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-bold">Cor Customizada (HEX ou Seletor):</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={editingWebhook.embedColor || "#10B981"}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, embedColor: e.target.value })}
                        className="h-8 w-14 p-0.5 bg-zinc-950 border-zinc-800 rounded cursor-pointer shrink-0"
                      />
                      <Input
                        value={editingWebhook.embedColor || "#10B981"}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, embedColor: e.target.value })}
                        placeholder="#10B981"
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold h-8 flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Configurações Padrões da Mensagem e Embed (Novo!) */}
                <div className="space-y-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      Configurações Padrões de Mensagem & Embed
                    </h4>
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/25 text-[9px]">
                      Padrão de Disparo
                    </Badge>
                  </div>

                  {/* Título e Subtítulo Padrões */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Type className="h-3 w-3 text-primary" />
                        Título Padrão do Embed
                      </Label>
                      <Input
                        value={editingWebhook.defaultTitle || ""}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, defaultTitle: e.target.value })}
                        placeholder="Ex: 💻 Teste Desenvolvedor"
                        className="bg-zinc-950 border-zinc-800 text-xs font-bold h-8"
                      />
                      <p className="text-[0.65rem] text-muted-foreground">
                        Usado como título principal caso a mensagem não defina um.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">Subtítulo / Descrição Padrão</Label>
                      <Input
                        value={editingWebhook.defaultDescription || ""}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, defaultDescription: e.target.value })}
                        placeholder="Ex: by malaca"
                        className="bg-zinc-950 border-zinc-800 text-xs h-8"
                      />
                      <p className="text-[0.65rem] text-muted-foreground">
                        Texto de cabeçalho ou autoria antes do corpo da mensagem.
                      </p>
                    </div>
                  </div>

                  {/* Switch: Caixa de Código Monospace (Codeblock) */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 gap-3">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5 text-violet-400" />
                        Destacar Mensagem em Caixa de Código (Codeblock)
                      </Label>
                      <p className="text-[0.65rem] text-muted-foreground">
                        Renderiza a mensagem em caixa escura monospace de destaque (idêntico ao print do Discord da Facção).
                      </p>
                    </div>
                    <Switch
                      checked={editingWebhook.useCodeblockField ?? true}
                      onCheckedChange={(val) => setEditingWebhook({ ...editingWebhook, useCodeblockField: val })}
                    />
                  </div>

                  {/* Miniatura (Thumbnail) do Canto Superior Direito */}
                  <div className="space-y-2 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                        Miniatura do Embed (Thumbnail no Canto Superior Direito)
                      </Label>
                      {editingWebhook.thumbnailUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingWebhook({ ...editingWebhook, thumbnailUrl: "" })}
                          className="text-[10px] text-rose-400 hover:underline font-semibold"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={thumbnailFileInputRef}
                        accept="image/*"
                        onChange={handleThumbnailFileUpload}
                        className="hidden"
                      />
                      <Input
                        value={editingWebhook.thumbnailUrl || ""}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, thumbnailUrl: e.target.value })}
                        placeholder="URL da miniatura ou faça upload..."
                        className="bg-zinc-900 border-zinc-800 text-xs font-mono h-8 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => thumbnailFileInputRef.current?.click()}
                        disabled={isUploadingThumbnail}
                        className="bg-zinc-900 border-zinc-700 text-xs font-bold gap-1.5 h-8 shrink-0"
                      >
                        {isUploadingThumbnail ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Upload
                      </Button>
                    </div>
                  </div>

                  {/* Imagem Grande / Banner do Embed */}
                  <div className="space-y-2 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                        Banner / Imagem Grande do Embed
                      </Label>
                      {editingWebhook.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingWebhook({ ...editingWebhook, imageUrl: "" })}
                          className="text-[10px] text-rose-400 hover:underline font-semibold"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={bannerFileInputRef}
                        accept="image/*"
                        onChange={handleBannerFileUpload}
                        className="hidden"
                      />
                      <Input
                        value={editingWebhook.imageUrl || ""}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, imageUrl: e.target.value })}
                        placeholder="URL da imagem grande ou faça upload..."
                        className="bg-zinc-900 border-zinc-800 text-xs font-mono h-8 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => bannerFileInputRef.current?.click()}
                        disabled={isUploadingBanner}
                        className="bg-zinc-900 border-zinc-700 text-xs font-bold gap-1.5 h-8 shrink-0"
                      >
                        {isUploadingBanner ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Upload
                      </Button>
                    </div>
                  </div>

                  {/* Autor do Embed (Opcional) */}
                  <div className="space-y-2 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <Label className="text-xs font-bold">Autor do Embed (Opcional)</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={editingWebhook.authorName || ""}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, authorName: e.target.value })}
                        placeholder="Nome do autor (ex: Twin Wheels RP)"
                        className="bg-zinc-900 border-zinc-800 text-xs h-8"
                      />
                      <Input
                        value={editingWebhook.authorIconUrl || ""}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, authorIconUrl: e.target.value })}
                        placeholder="URL do ícone do autor (opcional)"
                        className="bg-zinc-900 border-zinc-800 text-xs font-mono h-8"
                      />
                    </div>
                  </div>

                  {/* Rodapé e Timestamp */}
                  <div className="space-y-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">Texto do Rodapé (Footer)</Label>
                        <Input
                          value={editingWebhook.footerText || ""}
                          onChange={(e) => setEditingWebhook({ ...editingWebhook, footerText: e.target.value })}
                          placeholder="Ex: Twin Wheels RP"
                          className="bg-zinc-900 border-zinc-800 text-xs h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">Ícone do Rodapé URL (Opcional)</Label>
                        <Input
                          value={editingWebhook.footerIconUrl || ""}
                          onChange={(e) => setEditingWebhook({ ...editingWebhook, footerIconUrl: e.target.value })}
                          placeholder="URL do ícone minúsculo do rodapé"
                          className="bg-zinc-900 border-zinc-800 text-xs font-mono h-8"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        Exibir Data e Horário no Rodapé (Timestamp)
                      </Label>
                      <Switch
                        checked={editingWebhook.showTimestamp ?? true}
                        onCheckedChange={(val) => setEditingWebhook({ ...editingWebhook, showTimestamp: val })}
                      />
                    </div>
                  </div>

                  {/* Menção Padrão */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <AtSign className="h-3.5 w-3.5 text-primary" />
                      Menções Padrão (Opcional)
                    </Label>
                    <Input
                      value={editingWebhook.mentionRoles || ""}
                      onChange={(e) => setEditingWebhook({ ...editingWebhook, mentionRoles: e.target.value })}
                      placeholder="Ex: @everyone, @here ou ID de cargo <@&...>"
                      className="bg-zinc-950 border-zinc-800 text-xs font-mono h-8"
                    />
                    <p className="text-[0.65rem] text-muted-foreground">
                      Notifica membros ou cargos automaticamente ao enviar mensagens.
                    </p>
                  </div>
                </div>
              </div>

              {/* ================================================================= */}
              {/* COLUNA DIREITA: LIVE DISCORD PREVIEW (lg:col-span-5) */}
              {/* ================================================================= */}
              <div className="lg:col-span-5 space-y-3">
                <div className="sticky top-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      Pré-visualização Discord (Live)
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-800 text-emerald-400 font-mono">
                      Tempo Real
                    </Badge>
                  </div>

                  {/* Janela de Mensagem Estilo Discord */}
                  <div className="p-4 rounded-xl bg-[#313338] border border-[#232428] text-[#dbdee1] shadow-2xl space-y-3 select-none">
                    {/* Header: Avatar + Nome + Tag APP + Horário */}
                    <div className="flex items-start gap-3">
                      <img
                        src={editingWebhook.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                        alt="Bot Avatar"
                        className="w-10 h-10 rounded-full object-cover shrink-0 bg-[#2b2d31] shadow-sm ring-1 ring-black/40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                        }}
                      />

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Linha superior: Nome + Tag APP + Horário */}
                        <div className="flex items-center gap-1.5 flex-wrap leading-none">
                          <span className="font-semibold text-sm text-[#f2f3f5] truncate">
                            {editingWebhook.username || editingWebhook.name || "Twin Wheels RP"}
                          </span>
                          <span className="inline-flex items-center gap-0.5 bg-[#5865F2] text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none shadow-xs">
                            APP
                          </span>
                          <span className="text-[11px] text-[#949ba4] font-normal ml-1">
                            Hoje às 17:54
                          </span>
                        </div>

                        {/* Menção no topo caso configurada */}
                        {editingWebhook.mentionRoles && (
                          <div className="text-xs text-[#c9cdfb] bg-[#5865f2]/15 px-1.5 py-0.5 rounded inline-block font-medium">
                            {editingWebhook.mentionRoles.startsWith("@") || editingWebhook.mentionRoles.startsWith("<")
                              ? editingWebhook.mentionRoles
                              : `@${editingWebhook.mentionRoles}`}
                          </div>
                        )}

                        {/* Cartão do Embed Discord com a barra colorida na lateral */}
                        <div
                          className="rounded-md bg-[#2b2d31] border border-[#1e1f22] p-3.5 space-y-2.5 max-w-full relative shadow-md"
                          style={{
                            borderLeftWidth: "4px",
                            borderLeftColor: editingWebhook.embedColor || "#10B981",
                          }}
                        >
                          {/* Autor do Embed */}
                          {editingWebhook.authorName && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f2f3f5]">
                              {editingWebhook.authorIconUrl && (
                                <img
                                  src={editingWebhook.authorIconUrl}
                                  alt="Author Icon"
                                  className="w-4 h-4 rounded-full object-cover shrink-0"
                                />
                              )}
                              <span className="truncate">{editingWebhook.authorName}</span>
                            </div>
                          )}

                          {/* Título, Subtítulo e Miniatura (Thumbnail) lado a lado */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="font-bold text-sm text-[#f2f3f5] leading-snug break-words">
                                {editingWebhook.defaultTitle || "💻 Teste Desenvolvedor"}
                              </div>
                              <div className="text-xs text-[#dbdee1] leading-relaxed break-words whitespace-pre-wrap">
                                {editingWebhook.defaultDescription || "by malaca"}
                              </div>
                            </div>

                            {editingWebhook.thumbnailUrl && (
                              <img
                                src={editingWebhook.thumbnailUrl}
                                alt="Thumbnail"
                                className="w-16 h-16 rounded object-cover shrink-0 border border-black/20 bg-[#1e1f22]"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            )}
                          </div>

                          {/* Caixa de Código em Destaque (Codeblock Monospace) */}
                          {editingWebhook.useCodeblockField ? (
                            <div className="bg-[#1e1f22] rounded-md p-2.5 border border-[#111214] font-mono text-xs text-[#dbdee1] shadow-inner break-words">
                              Testando webhook
                            </div>
                          ) : (
                            <div className="text-xs text-[#dbdee1] italic text-muted-foreground/80">
                              (Mensagem em texto comum sem destaque de código)
                            </div>
                          )}

                          {/* Imagem Grande / Banner do Embed */}
                          {editingWebhook.imageUrl && (
                            <div className="rounded overflow-hidden max-h-48 w-full border border-black/20 bg-[#1e1f22]">
                              <img
                                src={editingWebhook.imageUrl}
                                alt="Banner"
                                className="w-full object-cover max-h-48"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                          )}

                          {/* Rodapé (Footer) */}
                          <div className="flex items-center gap-1.5 text-[11px] text-[#949ba4] pt-1">
                            {editingWebhook.footerIconUrl && (
                              <img
                                src={editingWebhook.footerIconUrl}
                                alt="Footer Icon"
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                            )}
                            <span className="truncate">{editingWebhook.footerText || "Twin Wheels RP"}</span>
                            {editingWebhook.showTimestamp !== false && <span>• Hoje às 17:54</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dica de Integração */}
                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-muted-foreground space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Como os padrões são aplicados:
                    </span>
                    <p className="leading-relaxed">
                      Sempre que mensagens externas forem recebidas pelo link do webhook (Discohook, scripts cURL ou FiveM) sem campos específicos, essas cores, títulos e caixa de código são injetados automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditorOpen(false)}
              disabled={savingInModal}
              className="bg-zinc-900 border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveEditor}
              disabled={savingInModal}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1.5 shadow-md"
            >
              {savingInModal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {savingInModal ? "Salvando Webhook..." : "Salvar Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: POSTAR MENSAGEM NO CANAL */}
      {/* ========================================================================= */}
      <Dialog open={isPostModalOpen} onOpenChange={setIsPostModalOpen}>
        <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-violet-400" />
              Postar Mensagem no Canal Discord
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Envie um comunicado, mensagem ou print formatado para o canal{" "}
              <strong>ID: {targetWebhookForPost?.channelId}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Título opcional */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Título da Mensagem (Opcional)</Label>
              <Input
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Ex: COMUNICADO IMPORTANTE DA DIRETORIA"
                className="bg-zinc-900 border-zinc-800 text-xs font-bold"
              />
            </div>

            {/* Conteúdo / Texto */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">
                Conteúdo da Mensagem <span className="text-rose-400">*</span>
              </Label>
              <Textarea
                rows={4}
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                placeholder="Digite a mensagem ou aviso que deseja enviar ao canal..."
                className="bg-zinc-900 border-zinc-800 text-xs leading-relaxed"
              />
            </div>

            {/* Upload de Imagem para a Postagem */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Imagem ou Print Anexo (Opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={postImageUrl}
                  onChange={(e) => setPostImageUrl(e.target.value)}
                  placeholder="URL da imagem ou faça o upload ao lado..."
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
                <input
                  type="file"
                  ref={postImageInputRef}
                  accept="image/*"
                  onChange={handlePostImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => postImageInputRef.current?.click()}
                  disabled={isUploadingPostImage}
                  className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 shrink-0"
                >
                  {isUploadingPostImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload
                </Button>
              </div>
              {postImageUrl && (
                <div className="relative pt-2">
                  <img
                    src={postImageUrl}
                    alt="Preview anexo"
                    className="max-h-36 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPostImageUrl("")}
                    className="absolute top-3 right-2 bg-black/70 hover:bg-black text-rose-400 text-xs px-2 py-0.5 rounded"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            {/* Menção opcional */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Menção Especial (Opcional)</Label>
              <Input
                value={postMention}
                onChange={(e) => setPostMention(e.target.value)}
                placeholder="Ex: @everyone, @here ou ID de cargo <@&...>"
                className="bg-zinc-900 border-zinc-800 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPostModalOpen(false)}
              className="bg-zinc-900 border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSendPost}
              disabled={isPosting || !postDescription.trim()}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold gap-1.5 shadow-lg shadow-violet-950/40"
            >
              {isPosting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Enviar ao Discord
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: COMO USAR ESTE WEBHOOK / INSTRUÇÕES PARA DESENVOLVEDORES */}
      {/* ========================================================================= */}
      <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
        <DialogContent className="max-w-xl bg-zinc-950 border-zinc-800 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              Como Usar Este Webhook / Canal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Outros usuários ou scripts podem enviar mensagens diretamente para este canal através do serviço.
            </DialogDescription>
          </DialogHeader>

          {codeWebhook && (
            <div className="space-y-3.5 py-2">
              {/* Link Compartilhável */}
              {canCopyUrl && (
                <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.7rem] font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5 text-violet-400" />
                      Link Público / Compartilhável
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyWebhookLink(codeWebhook)}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-bold"
                    >
                      {copiedId === codeWebhook.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copiedId === codeWebhook.id ? "Copiado!" : "Copiar Link"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[0.75rem] font-mono text-zinc-300">
                    <span className="truncate flex-1 select-all">{getWebhookShareableUrl(codeWebhook)}</span>
                    <a
                      href={getWebhookShareableUrl(codeWebhook)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-zinc-800"
                      title="Abrir no navegador"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
                    Envie este link para outros membros. Ao abrir no navegador, qualquer pessoa pode digitar e enviar comunicados para este canal.
                  </p>
                </div>
              )}

              {/* Dados do Canal */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 text-xs font-mono">
                <span className="text-muted-foreground block text-[0.68rem] font-bold uppercase font-sans">
                  Identificadores Discord:
                </span>
                <p>
                  Servidor ID: <strong className="text-primary">{codeWebhook.guildId}</strong>
                </p>
                <p>
                  Canal ID: <strong className="text-primary">{codeWebhook.channelId}</strong>
                </p>
                <p>
                  Emissor Padrão: <strong>{codeWebhook.username}</strong>
                </p>
              </div>

              {/* Exemplo cURL / API HTTP para Webhook Oficial (Discord / Discohook) */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Disparo Oficial Discord (Discohook / FiveM / cURL):</span>
                <pre className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[0.7rem] font-mono text-zinc-300 overflow-x-auto">
{`curl -X POST "${getWebhookShareableUrl(codeWebhook)}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Comunicado Oficial",
    "embeds": [
      {
        "title": "Aviso Oficial",
        "description": "Mensagem formatada com link ou texto.",
        "color": 1095937
      }
    ]
  }'`}
                </pre>
              </div>

              {/* Exemplo cURL Endpoint Simplificado TWTools */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Disparo Simplificado TWTools (Postador / APIs):</span>
                <pre className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[0.7rem] font-mono text-zinc-300 overflow-x-auto">
{`curl -X POST "https://twin.discloud.app/webhook/${codeWebhook.channelId}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Aviso Oficial",
    "description": "Mensagem enviada de forma simplificada."
  }'`}
                </pre>
              </div>

              {/* Exemplo TypeScript */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Exemplo no Sistema (TypeScript):</span>
                <pre className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[0.7rem] font-mono text-zinc-300 overflow-x-auto">
{`import { postMessageToWebhookChannel } from "@/services/webhookService";

await postMessageToWebhookChannel(webhook, {
  title: "Aviso da Diretoria",
  description: "Mensagem personalizada.",
  imageUrl: "https://.../print.png", // opcional
});`}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                if (codeWebhook) {
                  navigator.clipboard.writeText(
                    `Servidor ID: ${codeWebhook.guildId} | Canal ID: ${codeWebhook.channelId}`
                  );
                  toast.success("IDs copiados!");
                }
                setIsCodeModalOpen(false);
              }}
              className="bg-primary text-primary-foreground text-xs font-bold"
            >
              Copiar IDs do Canal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
