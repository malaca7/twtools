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
  getDiscordWebhooksConfig,
  saveDiscordWebhooksConfig,
  postMessageToWebhookChannel,
  testDiscordWebhookChannel,
  uploadWebhookAvatar,
  isValidDiscordId,
  getWebhookShareableUrl,
  DEFAULT_WEBHOOKS_CONFIG,
  type DiscordWebhook,
  type DiscordWebhooksConfig,
  type PostMessagePayload,
} from "@/services/webhookService";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { name: "Verde Esmeralda", hex: "#10B981" },
  { name: "Azul Céu", hex: "#0284C7" },
  { name: "Âmbar Dourado", hex: "#F59E0B" },
  { name: "Roxo Real", hex: "#8B5CF6" },
  { name: "Rosa Neon", hex: "#EC4899" },
  { name: "Índigo", hex: "#6366F1" },
  { name: "Vermelho Rubi", hex: "#EF4444" },
  { name: "Ciano Brilhante", hex: "#06B6D4" },
];

export function DevWebhooksConfigCard() {
  const { user, profile, level } = useAuth();

  const [config, setConfig] = useState<DiscordWebhooksConfig>(DEFAULT_WEBHOOKS_CONFIG);
  const [initialConfig, setInitialConfig] = useState<DiscordWebhooksConfig>(DEFAULT_WEBHOOKS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal de Criação / Edição
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<DiscordWebhook | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

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
    const newId = `webhook_${Date.now()}`;
    setEditingWebhook({
      id: newId,
      name: "",
      guildId: config.defaultGuildId || "1537229296697999462",
      channelId: "",
      description: "",
      enabled: true,
      username: config.defaultUsername || "Twin Wheels RP",
      avatarUrl: config.defaultAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      embedColor: "#10B981",
      footerText: config.defaultFooterText || "Twin Wheels RP",
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
    setEditingWebhook(JSON.parse(JSON.stringify(wh)));
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

  // Salvar no Modal
  const handleSaveEditor = () => {
    if (!editingWebhook) return;

    if (!editingWebhook.name.trim()) {
      toast.error("Informe um nome para identificar este webhook.");
      return;
    }

    if (!editingWebhook.guildId.trim() || !isValidDiscordId(editingWebhook.guildId)) {
      toast.error("Informe um ID de Servidor Discord válido (17 a 20 dígitos).");
      return;
    }

    if (!editingWebhook.channelId.trim() || !isValidDiscordId(editingWebhook.channelId)) {
      toast.error("Informe um ID de Canal do Servidor válido (17 a 20 dígitos).");
      return;
    }

    const updatedWebhook: DiscordWebhook = {
      ...editingWebhook,
      name: editingWebhook.name.trim(),
      guildId: editingWebhook.guildId.trim(),
      channelId: editingWebhook.channelId.trim(),
      updatedAt: new Date().toISOString(),
    };

    let newWebhooks: DiscordWebhook[];
    if (isNew) {
      newWebhooks = [updatedWebhook, ...config.webhooks];
    } else {
      newWebhooks = config.webhooks.map((w) => (w.id === updatedWebhook.id ? updatedWebhook : w));
    }

    const newConfig = { ...config, webhooks: newWebhooks };
    setConfig(newConfig);
    setIsEditorOpen(false);
    toast.success(isNew ? "Webhook criado com sucesso!" : "Webhook atualizado com sucesso!");
  };

  // Excluir Webhook
  const handleDelete = (id: string) => {
    const filtered = config.webhooks.filter((w) => w.id !== id);
    setConfig({ ...config, webhooks: filtered });
    toast.success("Webhook removido.");
  };

  // Alternar Ativo/Pausado
  const handleToggle = (id: string, enabled: boolean) => {
    const updated = config.webhooks.map((w) => (w.id === id ? { ...w, enabled } : w));
    setConfig({ ...config, webhooks: updated });
    toast.success(enabled ? "Webhook ativado!" : "Webhook pausado.");
  };

  // Copiar Link Compartilhável do Webhook
  const handleCopyWebhookLink = (wh: DiscordWebhook) => {
    const url = getWebhookShareableUrl(wh);
    navigator.clipboard.writeText(url);
    setCopiedId(wh.id);
    toast.success(`Link do webhook "${wh.name}" copiado para a área de transferência!`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  // Testar Envio
  const handleTest = async (wh: DiscordWebhook) => {
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
    setTargetWebhookForPost(wh);
    setPostTitle("");
    setPostDescription("");
    setPostImageUrl("");
    setPostMention(wh.mentionRoles || "");
    setIsPostModalOpen(true);
  };

  // Enviar Postagem
  const handleSendPost = async () => {
    if (!targetWebhookForPost) return;

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
          {hasChanges && (
            <Button
              onClick={handleSaveAll}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-lg shadow-emerald-950/40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar Alterações
            </Button>
          )}

          <Button
            onClick={handleCreateNew}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Webhook
          </Button>
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
            <Button onClick={handleCreateNew} className="text-xs font-bold gap-1.5 mt-2">
              <Plus className="h-3.5 w-3.5" />
              Criar Primeiro Webhook
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {config.webhooks.map((wh) => (
            <Card
              key={wh.id}
              className={cn(
                "surface-card border transition-all duration-200 hover:shadow-lg flex flex-col justify-between",
                wh.enabled ? "border-border/80 bg-zinc-950/60" : "border-border/40 opacity-75 bg-zinc-950/30"
              )}
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
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold truncate text-foreground">{wh.name}</CardTitle>
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: wh.embedColor || "#10B981" }}
                          title={`Cor do Embed: ${wh.embedColor}`}
                        />
                      </div>
                      <p className="text-[0.7rem] text-muted-foreground truncate">
                        Emissor: <strong className="text-foreground">{wh.username || "Twin Wheels RP"}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Switch Ativo / Pausado */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={wh.enabled}
                      onCheckedChange={(val) => handleToggle(wh.id, val)}
                      title={wh.enabled ? "Webhook Ativo" : "Webhook Pausado"}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                {wh.description && (
                  <p className="text-xs text-muted-foreground/90 line-clamp-2">{wh.description}</p>
                )}

                {/* IDs do Servidor e Canal */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[0.7rem] font-mono">
                  <div>
                    <span className="text-[0.65rem] text-muted-foreground block font-sans font-semibold">
                      ID Servidor:
                    </span>
                    <span className="text-foreground truncate block">{wh.guildId}</span>
                  </div>
                  <div>
                    <span className="text-[0.65rem] text-muted-foreground block font-sans font-semibold">
                      ID Canal:
                    </span>
                    <span className="text-foreground truncate block">{wh.channelId}</span>
                  </div>
                </div>

                {/* Link do Webhook para Compartilhar */}
                <div className="space-y-1.5 p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-[0.65rem] font-semibold">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ExternalLink className="h-3 w-3 text-primary" />
                      Link para Compartilhar:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyWebhookLink(wh)}
                      className="text-primary hover:underline flex items-center gap-1 font-bold text-[0.65rem]"
                    >
                      {copiedId === wh.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[0.68rem] font-mono text-zinc-300">
                    <span className="truncate flex-1 select-all" title={getWebhookShareableUrl(wh)}>
                      {getWebhookShareableUrl(wh)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyWebhookLink(wh)}
                      className="h-6 px-1.5 text-[0.65rem] font-bold text-muted-foreground hover:text-foreground"
                      title="Copiar link do webhook"
                    >
                      {copiedId === wh.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <a
                      href={getWebhookShareableUrl(wh)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-6 px-1.5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded hover:bg-zinc-800"
                      title="Abrir postador em nova aba"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

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

              <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 flex-wrap">
                {/* Botões de Ação Direta */}
                <div className="flex items-center gap-1.5">
                  {/* Botão Postar Mensagem */}
                  <Button
                    size="sm"
                    onClick={() => handleOpenPostModal(wh)}
                    disabled={!wh.enabled}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs gap-1.5 h-8 shadow-sm"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    Postar Mensagem
                  </Button>

                  {/* Botão Copiar Link */}
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

                  {/* Botão Testar */}
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

                  {/* Botão Como Usar / API */}
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
                </div>

                {/* Botões de Edição e Exclusão */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(wh)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title="Editar webhook"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(wh.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-400"
                    title="Excluir webhook"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR WEBHOOK */}
      {/* ========================================================================= */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              {isNew ? "Criar Novo Webhook de Canal" : "Editar Webhook de Canal"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure o ID do servidor e ID do canal no Discord com nome e avatar customizados para postagens.
            </DialogDescription>
          </DialogHeader>

          {editingWebhook && (
            <div className="space-y-5 py-2">
              {/* Nome do Webhook e Descrição */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">
                    Nome do Webhook <span className="text-rose-400">*</span>
                  </Label>
                  <Input
                    value={editingWebhook.name}
                    onChange={(e) => setEditingWebhook({ ...editingWebhook, name: e.target.value })}
                    placeholder="Ex: Canal de Postagens da Facção"
                    className="bg-zinc-900 border-zinc-800 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Finalidade / Descrição (Opcional)</Label>
                  <Input
                    value={editingWebhook.description || ""}
                    onChange={(e) => setEditingWebhook({ ...editingWebhook, description: e.target.value })}
                    placeholder="Ex: Utilizado para enviar avisos e informativos"
                    className="bg-zinc-900 border-zinc-800 text-xs"
                  />
                </div>
              </div>

              {/* ID do Servidor e ID do Canal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-indigo-400" />
                      ID do Servidor Discord <span className="text-rose-400">*</span>
                    </Label>
                  </div>
                  <Input
                    value={editingWebhook.guildId}
                    onChange={(e) => setEditingWebhook({ ...editingWebhook, guildId: e.target.value })}
                    placeholder="Ex: 1537229296697999462"
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold"
                  />
                  <p className="text-[0.65rem] text-muted-foreground">
                    Clique com o botão direito no seu servidor Discord e selecione &quot;Copiar ID do Servidor&quot;.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-blue-400" />
                      ID do Canal do Servidor <span className="text-rose-400">*</span>
                    </Label>
                  </div>
                  <Input
                    value={editingWebhook.channelId}
                    onChange={(e) => setEditingWebhook({ ...editingWebhook, channelId: e.target.value })}
                    placeholder="Ex: 1538375505953165312"
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold"
                  />
                  <p className="text-[0.65rem] text-muted-foreground">
                    Clique com o botão direito no canal de texto e selecione &quot;Copiar ID do canal&quot;.
                  </p>
                </div>
              </div>

              {/* Personalização do Emissor: Nome e Upload de Avatar */}
              <div className="space-y-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <h4 className="text-xs font-black tracking-wider uppercase text-muted-foreground flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-400" />
                  Personalização do Bot Emissor
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome do Bot */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nome do Bot ao Postar</Label>
                    <Input
                      value={editingWebhook.username || ""}
                      onChange={(e) => setEditingWebhook({ ...editingWebhook, username: e.target.value })}
                      placeholder="Ex: Twin Wheels RP"
                      className="bg-zinc-950 border-zinc-800 text-xs font-bold"
                    />
                  </div>

                  {/* Upload do Avatar */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Avatar do Bot (Upload de Imagem)</Label>
                    <div className="flex items-center gap-3">
                      <img
                        src={editingWebhook.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                        alt="Avatar Preview"
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-zinc-700 bg-zinc-900 shrink-0"
                      />
                      <input
                        type="file"
                        ref={avatarFileInputRef}
                        accept="image/*"
                        onChange={handleAvatarFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => avatarFileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="bg-zinc-950 border-zinc-800 text-xs font-bold gap-1.5 h-9"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        Fazer Upload da Imagem
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Cor do Embed e Rodapé */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-primary" />
                      Cor da Barra do Embed
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={editingWebhook.embedColor || "#10B981"}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, embedColor: e.target.value })}
                        className="h-8 w-12 p-0.5 bg-zinc-950 border-zinc-800 rounded cursor-pointer"
                      />
                      <Input
                        value={editingWebhook.embedColor || "#10B981"}
                        onChange={(e) => setEditingWebhook({ ...editingWebhook, embedColor: e.target.value })}
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono font-bold h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Texto do Rodapé (Footer)</Label>
                    <Input
                      value={editingWebhook.footerText || ""}
                      onChange={(e) => setEditingWebhook({ ...editingWebhook, footerText: e.target.value })}
                      placeholder="Ex: Twin Wheels RP • Sistema Integrado"
                      className="bg-zinc-950 border-zinc-800 text-xs h-8"
                    />
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
              className="bg-zinc-900 border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveEditor}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
            >
              Salvar Webhook
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

              {/* Exemplo cURL / API HTTP */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">Disparo via HTTP POST (cURL / FiveM / Scripts):</span>
                <pre className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[0.7rem] font-mono text-zinc-300 overflow-x-auto">
{`curl -X POST ${getWebhookShareableUrl(codeWebhook)} \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Aviso Oficial",
    "description": "Mensagem enviada via script ou FiveM.",
    "imageUrl": "https://i.ibb.co/.../imagem.png"
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
