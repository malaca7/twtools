import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MessageSquarePlus,
  Send,
  Upload,
  Loader2,
  Trash2,
  Plus,
  Palette,
  Eye,
  Copy,
  Check,
  ImageIcon,
  AtSign,
  Link2,
  User,
  Clock,
  Code2,
  FileJson,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  uploadWebhookAvatar,
  type DiscordWebhook,
  type PostMessagePayload,
} from "@/services/webhookService";

export interface DiscohookPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: DiscordWebhook | null;
  allWebhooks?: DiscordWebhook[];
  onSelectWebhook?: (webhook: DiscordWebhook) => void;
  onSend: (payload: PostMessagePayload, targetWebhook: DiscordWebhook) => Promise<boolean>;
  isPosting?: boolean;
}

interface EmbedFieldItem {
  id: string;
  name: string;
  value: string;
  inline: boolean;
}

const COLOR_PRESETS = [
  { name: "Verde Esmeralda", hex: "#10B981" },
  { name: "Discord Blurple", hex: "#5865F2" },
  { name: "Ciano Neon", hex: "#06B6D4" },
  { name: "Azul Polícia", hex: "#3B82F6" },
  { name: "Roxo Real", hex: "#8B5CF6" },
  { name: "Rosa Neon", hex: "#EC4899" },
  { name: "Laranja Twin Wheels", hex: "#F97316" },
  { name: "Âmbar Dourado", hex: "#F59E0B" },
  { name: "Vermelho Alerta", hex: "#EF4444" },
  { name: "Carmim Crime", hex: "#E11D48" },
  { name: "Verde Militar", hex: "#15803D" },
  { name: "Preto Tático", hex: "#27272A" },
];

export function DiscohookPostModal({
  open,
  onOpenChange,
  webhook,
  allWebhooks = [],
  onSelectWebhook,
  onSend,
  isPosting = false,
}: DiscohookPostModalProps) {
  // Target webhook selector
  const activeWebhook = webhook || allWebhooks[0] || null;

  // Bot Profile Override
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Plain Message Content (outside embed)
  const [content, setContent] = useState("");

  // Embed Main Configuration
  const [hasEmbed, setHasEmbed] = useState(true);
  const [title, setTitle] = useState("");
  const [titleUrl, setTitleUrl] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#10B981");
  const [useCodeblock, setUseCodeblock] = useState(false);

  // Author
  const [authorName, setAuthorName] = useState("");
  const [authorUrl, setAuthorUrl] = useState("");
  const [authorIconUrl, setAuthorIconUrl] = useState("");

  // Images
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Fields
  const [fields, setFields] = useState<EmbedFieldItem[]>([]);

  // Footer
  const [footerText, setFooterText] = useState("");
  const [footerIconUrl, setFooterIconUrl] = useState("");
  const [showTimestamp, setShowTimestamp] = useState(true);

  // Uploading states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingAuthorIcon, setIsUploadingAuthorIcon] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingFooterIcon, setIsUploadingFooterIcon] = useState(false);

  // Refs for file inputs
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const authorIconInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const footerIconInputRef = useRef<HTMLInputElement | null>(null);

  // Copied state
  const [copiedJson, setCopiedJson] = useState(false);

  // Initialize or reset form when webhook changes or modal opens
  useEffect(() => {
    if (activeWebhook && open) {
      setUsername(activeWebhook.username || activeWebhook.name || "Twin Wheels RP");
      setAvatarUrl(activeWebhook.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png");
      setTitle(activeWebhook.defaultTitle || "💻 Comunicado Oficial");
      setTitleUrl("");
      setDescription(activeWebhook.defaultDescription || "");
      setColor(activeWebhook.embedColor || "#10B981");
      setUseCodeblock(activeWebhook.useCodeblockField ?? false);
      setAuthorName(activeWebhook.authorName || "");
      setAuthorUrl(activeWebhook.authorUrl || "");
      setAuthorIconUrl(activeWebhook.authorIconUrl || "");
      setThumbnailUrl(activeWebhook.thumbnailUrl || "");
      setImageUrl(activeWebhook.imageUrl || "");
      setFooterText(activeWebhook.footerText || "Twin Wheels RP");
      setFooterIconUrl(activeWebhook.footerIconUrl || "");
      setShowTimestamp(activeWebhook.showTimestamp !== false);
      setContent(activeWebhook.mentionRoles || "");
      setHasEmbed(true);
      setFields([]);
    }
  }, [activeWebhook?.id, open]);

  // Generic File Upload Handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    loadingSetter: (loading: boolean) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 8MB.");
      return;
    }

    loadingSetter(true);
    try {
      const publicUrl = await uploadWebhookAvatar(file);
      setter(publicUrl);
      toast.success(`${label} carregado com sucesso!`);
    } catch (err: any) {
      toast.error(err.message || `Erro ao fazer upload de ${label}.`);
    } finally {
      loadingSetter(false);
      e.target.value = "";
    }
  };

  // Add a new embed field
  const handleAddField = () => {
    if (fields.length >= 25) {
      toast.error("O Discord permite no máximo 25 campos por embed.");
      return;
    }
    const newField: EmbedFieldItem = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `Campo ${fields.length + 1}`,
      value: "Valor do campo",
      inline: true,
    };
    setFields([...fields, newField]);
  };

  const handleUpdateField = (id: string, updates: Partial<EmbedFieldItem>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  // Quick mention insertion
  const handleInsertMention = (mention: string) => {
    setContent((prev) => {
      if (prev.includes(mention)) return prev;
      return prev ? `${mention} ${prev}` : mention;
    });
  };

  // Build Discohook JSON Payload
  const discohookJson = useMemo(() => {
    const cleanContent = content.trim();
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();

    const embedObj: any = {
      title: cleanTitle || undefined,
      url: titleUrl.trim() || undefined,
      description: cleanDesc || undefined,
      color: parseInt(color.replace("#", ""), 16) || 0x10b981,
    };

    if (authorName.trim()) {
      embedObj.author = {
        name: authorName.trim(),
        url: authorUrl.trim() || undefined,
        icon_url: authorIconUrl.trim() || undefined,
      };
    }

    if (thumbnailUrl.trim()) {
      embedObj.thumbnail = { url: thumbnailUrl.trim() };
    }

    if (imageUrl.trim()) {
      embedObj.image = { url: imageUrl.trim() };
    }

    if (footerText.trim()) {
      embedObj.footer = {
        text: footerText.trim(),
        icon_url: footerIconUrl.trim() || undefined,
      };
    }

    if (showTimestamp) {
      embedObj.timestamp = new Date().toISOString();
    }

    if (fields.length > 0) {
      embedObj.fields = fields
        .filter((f) => f.name.trim() || f.value.trim())
        .map((f) => ({
          name: f.name.trim() || "\u200b",
          value: f.value.trim() || "\u200b",
          inline: !!f.inline,
        }));
    }

    const payload: any = {
      username: username.trim() || undefined,
      avatar_url: avatarUrl.trim() || undefined,
      content: cleanContent || undefined,
    };

    if (hasEmbed) {
      payload.embeds = [embedObj];
    }

    return payload;
  }, [
    content,
    username,
    avatarUrl,
    hasEmbed,
    title,
    titleUrl,
    description,
    color,
    authorName,
    authorUrl,
    authorIconUrl,
    thumbnailUrl,
    imageUrl,
    footerText,
    footerIconUrl,
    showTimestamp,
    fields,
  ]);

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(discohookJson, null, 2));
    setCopiedJson(true);
    toast.success("Payload JSON copiado (formato oficial Discord / Discohook)!");
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Reset to default
  const handleReset = () => {
    if (!activeWebhook) return;
    setUsername(activeWebhook.username || activeWebhook.name || "Twin Wheels RP");
    setAvatarUrl(activeWebhook.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png");
    setTitle(activeWebhook.defaultTitle || "💻 Comunicado Oficial");
    setTitleUrl("");
    setDescription(activeWebhook.defaultDescription || "");
    setColor(activeWebhook.embedColor || "#10B981");
    setUseCodeblock(activeWebhook.useCodeblockField ?? false);
    setAuthorName(activeWebhook.authorName || "");
    setAuthorUrl(activeWebhook.authorUrl || "");
    setAuthorIconUrl(activeWebhook.authorIconUrl || "");
    setThumbnailUrl(activeWebhook.thumbnailUrl || "");
    setImageUrl(activeWebhook.imageUrl || "");
    setFooterText(activeWebhook.footerText || "Twin Wheels RP");
    setFooterIconUrl(activeWebhook.footerIconUrl || "");
    setShowTimestamp(activeWebhook.showTimestamp !== false);
    setContent(activeWebhook.mentionRoles || "");
    setHasEmbed(true);
    setFields([]);
    toast.info("Configurações restauradas para o padrão do webhook.");
  };

  // Clear everything
  const handleClear = () => {
    setContent("");
    setTitle("");
    setTitleUrl("");
    setDescription("");
    setAuthorName("");
    setAuthorUrl("");
    setAuthorIconUrl("");
    setThumbnailUrl("");
    setImageUrl("");
    setFooterText("");
    setFooterIconUrl("");
    setFields([]);
    toast.info("Campos da mensagem limpos.");
  };

  // Submit post
  const handleSubmit = async () => {
    if (!activeWebhook) {
      toast.error("Nenhum webhook selecionado para envio.");
      return;
    }

    const hasAnyContent = Boolean(
      content.trim() ||
        (hasEmbed &&
          (title.trim() ||
            description.trim() ||
            imageUrl.trim() ||
            thumbnailUrl.trim() ||
            fields.length > 0))
    );

    if (!hasAnyContent) {
      toast.error("Digite algum conteúdo de mensagem ou preencha o embed.");
      return;
    }

    const payload: PostMessagePayload = {
      content: content.trim() || undefined,
      username: username.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      title: hasEmbed && title.trim() ? title.trim() : undefined,
      titleUrl: hasEmbed && titleUrl.trim() ? titleUrl.trim() : undefined,
      description: hasEmbed && description.trim() ? description.trim() : undefined,
      color: hasEmbed ? color : undefined,
      useCodeblock: hasEmbed ? useCodeblock : false,
      authorName: hasEmbed && authorName.trim() ? authorName.trim() : undefined,
      authorUrl: hasEmbed && authorUrl.trim() ? authorUrl.trim() : undefined,
      authorIconUrl: hasEmbed && authorIconUrl.trim() ? authorIconUrl.trim() : undefined,
      thumbnailUrl: hasEmbed && thumbnailUrl.trim() ? thumbnailUrl.trim() : undefined,
      imageUrl: hasEmbed && imageUrl.trim() ? imageUrl.trim() : undefined,
      footerText: hasEmbed && footerText.trim() ? footerText.trim() : undefined,
      footerIconUrl: hasEmbed && footerIconUrl.trim() ? footerIconUrl.trim() : undefined,
      showTimestamp: hasEmbed ? showTimestamp : false,
      fields:
        hasEmbed && fields.length > 0
          ? fields
              .filter((f) => f.name.trim() || f.value.trim())
              .map((f) => ({
                name: f.name.trim() || "\u200b",
                value: f.value.trim() || "\u200b",
                inline: f.inline,
              }))
          : undefined,
    };

    const success = await onSend(payload, activeWebhook);
    if (success) {
      onOpenChange(false);
    }
  };

  // Format current preview time
  const previewTime = useMemo(() => {
    const now = new Date();
    return `Hoje às ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl xl:max-w-7xl bg-zinc-950 border-zinc-800 text-foreground max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        {/* Hidden inputs for uploading images */}
        <input
          type="file"
          ref={avatarInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFileUpload(e, setAvatarUrl, setIsUploadingAvatar, "Avatar do Bot")
          }
        />
        <input
          type="file"
          ref={authorIconInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFileUpload(e, setAuthorIconUrl, setIsUploadingAuthorIcon, "Ícone do Autor")
          }
        />
        <input
          type="file"
          ref={thumbnailInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFileUpload(e, setThumbnailUrl, setIsUploadingThumbnail, "Miniatura")
          }
        />
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFileUpload(e, setImageUrl, setIsUploadingImage, "Banner do Embed")
          }
        />
        <input
          type="file"
          ref={footerIconInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFileUpload(e, setFooterIconUrl, setIsUploadingFooterIcon, "Ícone do Rodapé")
          }
        />

        {/* Modal Header */}
        <DialogHeader className="p-4 sm:px-6 sm:py-3.5 border-b border-border/50 bg-zinc-900/60 shrink-0 flex flex-row items-center justify-between gap-4">
          <div className="space-y-0.5">
            <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <MessageSquarePlus className="h-5 w-5" />
              </div>
              <span>Nova Postagem — Editor Discord (Estilo Discohook)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>Construa mensagens ricas com preview em tempo real e envie diretamente para o canal Discord.</span>
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Target Webhook Selector */}
            {allWebhooks.length > 1 && onSelectWebhook && activeWebhook && (
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs">
                <span className="text-muted-foreground font-semibold">Canal:</span>
                <select
                  value={activeWebhook.id}
                  onChange={(e) => {
                    const found = allWebhooks.find((w) => w.id === e.target.value);
                    if (found) onSelectWebhook(found);
                  }}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-hidden cursor-pointer"
                >
                  {allWebhooks.map((w) => (
                    <option key={w.id} value={w.id} className="bg-zinc-950 text-foreground">
                      {w.name} ({w.channelId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
              className="bg-zinc-900 border-zinc-800 text-xs h-8 gap-1.5 hover:bg-zinc-800 text-zinc-300"
              title="Copiar JSON no formato oficial Discord / Discohook"
            >
              {copiedJson ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <FileJson className="h-3.5 w-3.5 text-violet-400" />
              )}
              <span className="hidden sm:inline">Copiar JSON</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="bg-zinc-900 border-zinc-800 text-xs h-8 gap-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white"
              title="Restaurar valores padrão do webhook"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Restaurar</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Modal Body: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* ========================================================================= */}
          {/* COLUNA ESQUERDA: CONTROLES DISCOHOOK (lg:col-span-7) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 overflow-y-auto p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-border/60 space-y-4">
            <Tabs defaultValue="embed" className="w-full">
              <TabsList className="grid grid-cols-4 sm:grid-cols-6 bg-zinc-900/80 p-1 border border-zinc-800/80 rounded-xl h-auto">
                <TabsTrigger value="embed" className="text-xs font-bold py-1.5 data-[state=active]:bg-zinc-800">
                  Embed
                </TabsTrigger>
                <TabsTrigger value="message" className="text-xs font-bold py-1.5 data-[state=active]:bg-zinc-800">
                  Mensagem
                </TabsTrigger>
                <TabsTrigger value="fields" className="text-xs font-bold py-1.5 data-[state=active]:bg-zinc-800">
                  Campos ({fields.length})
                </TabsTrigger>
                <TabsTrigger value="images" className="text-xs font-bold py-1.5 data-[state=active]:bg-zinc-800">
                  Imagens
                </TabsTrigger>
                <TabsTrigger value="author" className="text-xs font-bold py-1.5 data-[state=active]:bg-zinc-800">
                  Autor/Rodapé
                </TabsTrigger>
                <TabsTrigger value="profile" className="text-xs font-bold py-1.5 data-[state=active]:bg-zinc-800">
                  Perfil Bot
                </TabsTrigger>
              </TabsList>

              {/* ==================== TAB 1: EMBED PRINCIPAL ==================== */}
              <TabsContent value="embed" className="space-y-4 pt-3">
                {/* Embed Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      Ativar Embed Rico
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Permite títulos coloridos, caixas estilizadas, campos e imagens formatadas.
                    </p>
                  </div>
                  <Switch checked={hasEmbed} onCheckedChange={setHasEmbed} />
                </div>

                {hasEmbed && (
                  <>
                    {/* Título & Link */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold">Título do Embed</Label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Ex: 📢 COMUNICADO DA DIRETORIA"
                          className="bg-zinc-950 border-zinc-800 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold flex items-center gap-1">
                          <Link2 className="h-3 w-3 text-muted-foreground" />
                          URL do Título (Link Clicável)
                        </Label>
                        <Input
                          value={titleUrl}
                          onChange={(e) => setTitleUrl(e.target.value)}
                          placeholder="https://..."
                          className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold">
                          Descrição / Conteúdo Principal (Markdown)
                        </Label>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {description.length}/4096 carac.
                        </span>
                      </div>
                      <Textarea
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Digite o texto principal do embed. Suporta **negrito**, *itálico*, links e emojis..."
                        className="bg-zinc-950 border-zinc-800 text-xs leading-relaxed font-sans"
                      />

                      {/* Switch Codeblock Monospace */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <Code2 className="h-3.5 w-3.5 text-violet-400" />
                          <span className="text-xs font-medium text-zinc-300">
                            Destacar texto em caixa de código escura (Codeblock)
                          </span>
                        </div>
                        <Switch checked={useCodeblock} onCheckedChange={setUseCodeblock} />
                      </div>
                    </div>

                    {/* Cor do Embed */}
                    <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold flex items-center gap-1.5">
                          <Palette className="h-3.5 w-3.5 text-primary" />
                          Cor da Barra Lateral do Embed
                        </Label>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-md border border-white/20 shadow-xs"
                            style={{ backgroundColor: color }}
                          />
                          <Input
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            placeholder="#10B981"
                            className="w-24 bg-zinc-950 border-zinc-800 text-xs font-mono font-bold h-7 uppercase text-center"
                          />
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                        {COLOR_PRESETS.map((preset) => {
                          const isSelected = color.toLowerCase() === preset.hex.toLowerCase();
                          return (
                            <button
                              key={preset.hex}
                              type="button"
                              onClick={() => setColor(preset.hex)}
                              className={cn(
                                "flex items-center gap-1.5 p-1.5 rounded-lg border text-left text-[11px] transition-all",
                                isSelected
                                  ? "bg-zinc-800 border-primary ring-1 ring-primary text-white font-bold"
                                  : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900"
                              )}
                            >
                              <span
                                className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: preset.hex }}
                              />
                              <span className="truncate">{preset.name.split(" ")[0]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ==================== TAB 2: MENSAGEM EXTERNA (CONTENT) ==================== */}
              <TabsContent value="message" className="space-y-4 pt-3">
                <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <AtSign className="h-3.5 w-3.5 text-primary" />
                      Texto da Mensagem (Fora do Embed)
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInsertMention("@everyone")}
                        className="h-6 text-[10px] font-mono font-bold bg-zinc-900 border-zinc-800 text-violet-400 hover:bg-violet-950/30"
                      >
                        + @everyone
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInsertMention("@here")}
                        className="h-6 text-[10px] font-mono font-bold bg-zinc-900 border-zinc-800 text-emerald-400 hover:bg-emerald-950/30"
                      >
                        + @here
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Digite menções (@everyone, @here, <@&cargo>), avisos em texto comum ou links diretos..."
                    className="bg-zinc-950 border-zinc-800 text-xs font-sans leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Este texto aparece acima do embed ou isolado caso o embed esteja desligado. Ideal para marcar notificações de membros e cargos.
                  </p>
                </div>
              </TabsContent>

              {/* ==================== TAB 3: CAMPOS DO EMBED (FIELDS) ==================== */}
              <TabsContent value="fields" className="space-y-4 pt-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      Campos do Embed ({fields.length}/25)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Organize dados em pares de chave/valor com suporte a alinhamento lado a lado (inline).
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddField}
                    disabled={fields.length >= 25}
                    className="text-xs font-bold gap-1.5 bg-violet-600 hover:bg-violet-500 text-white h-8"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Campo
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
                    <p className="text-xs text-muted-foreground">Nenhum campo adicionado a este embed.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddField}
                      className="mt-3 text-xs font-bold gap-1.5 bg-zinc-900 border-zinc-800"
                    >
                      <Plus className="h-3 w-3" />
                      Criar Primeiro Campo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground uppercase font-mono">
                            Campo #{idx + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                              <Switch
                                checked={field.inline}
                                onCheckedChange={(val) => handleUpdateField(field.id, { inline: val })}
                              />
                              <span>Em linha (Inline)</span>
                            </label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveField(field.id)}
                              className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold">Nome / Título do Campo</Label>
                            <Input
                              value={field.name}
                              onChange={(e) => handleUpdateField(field.id, { name: e.target.value })}
                              placeholder="Ex: Responsável"
                              className="bg-zinc-950 border-zinc-800 text-xs font-bold h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold">Valor / Informação</Label>
                            <Input
                              value={field.value}
                              onChange={(e) => handleUpdateField(field.id, { value: e.target.value })}
                              placeholder="Ex: @malaca ou 50.000$"
                              className="bg-zinc-950 border-zinc-800 text-xs h-8"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ==================== TAB 4: IMAGENS & MINIATURA ==================== */}
              <TabsContent value="images" className="space-y-4 pt-3">
                {/* Thumbnail */}
                <div className="space-y-2 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                      Miniatura (Thumbnail no Canto Superior Direito)
                    </Label>
                    {thumbnailUrl && (
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl("")}
                        className="text-[10px] text-rose-400 hover:underline font-semibold"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://... (URL da miniatura)"
                      className="bg-zinc-950 border-zinc-800 text-xs font-mono h-8 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => thumbnailInputRef.current?.click()}
                      disabled={isUploadingThumbnail}
                      className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 h-8 shrink-0"
                    >
                      {isUploadingThumbnail ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                      Upload
                    </Button>
                  </div>
                </div>

                {/* Banner / Imagem Grande */}
                <div className="space-y-2 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                      Banner / Imagem Grande (Rodapé do Embed)
                    </Label>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="text-[10px] text-rose-400 hover:underline font-semibold"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... (URL da imagem principal/print)"
                      className="bg-zinc-950 border-zinc-800 text-xs font-mono h-8 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 h-8 shrink-0"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                      Upload
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ==================== TAB 5: AUTOR & RODAPÉ ==================== */}
              <TabsContent value="author" className="space-y-4 pt-3">
                {/* Autor */}
                <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    Autor do Embed (Topo do Cartão)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">Nome do Autor</Label>
                      <Input
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="Ex: Twin Wheels Official"
                        className="bg-zinc-950 border-zinc-800 text-xs font-bold h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold">URL de Link do Autor</Label>
                      <Input
                        value={authorUrl}
                        onChange={(e) => setAuthorUrl(e.target.value)}
                        placeholder="https://..."
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono h-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <Label className="text-[11px] font-semibold">Ícone do Autor</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={authorIconUrl}
                        onChange={(e) => setAuthorIconUrl(e.target.value)}
                        placeholder="URL do ícone ou faça upload..."
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono h-8 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => authorIconInputRef.current?.click()}
                        disabled={isUploadingAuthorIcon}
                        className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 h-8 shrink-0"
                      >
                        {isUploadingAuthorIcon ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Rodapé (Footer) */}
                <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Rodapé do Embed (Footer)
                  </h4>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Texto do Rodapé</Label>
                    <Input
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      placeholder="Ex: Twin Wheels RP • Sistema de Gestão"
                      className="bg-zinc-950 border-zinc-800 text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1 pt-1">
                    <Label className="text-[11px] font-semibold">Ícone do Rodapé</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={footerIconUrl}
                        onChange={(e) => setFooterIconUrl(e.target.value)}
                        placeholder="URL do ícone ou faça upload..."
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono h-8 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => footerIconInputRef.current?.click()}
                        disabled={isUploadingFooterIcon}
                        className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 h-8 shrink-0"
                      >
                        {isUploadingFooterIcon ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        Upload
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-zinc-300 font-medium">
                      Exibir data e horário atual no rodapé
                    </span>
                    <Switch checked={showTimestamp} onCheckedChange={setShowTimestamp} />
                  </div>
                </div>
              </TabsContent>

              {/* ==================== TAB 6: PERFIL DO BOT OVERRIDE ==================== */}
              <TabsContent value="profile" className="space-y-4 pt-3">
                <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    Identidade do Emissor (Substituição de Bot)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Substitua o nome e avatar padrão do webhook especificamente para esta postagem.
                  </p>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Nome do Bot</Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ex: Twin Wheels RP ou Notícias da Facção"
                      className="bg-zinc-950 border-zinc-800 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Avatar do Bot (Foto de Perfil)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                        className="bg-zinc-950 border-zinc-800 text-xs font-mono h-8 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="bg-zinc-900 border-zinc-800 text-xs font-bold gap-1.5 h-8 shrink-0"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* ========================================================================= */}
          {/* COLUNA DIREITA: LIVE DISCORD PREVIEW (lg:col-span-5) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 bg-zinc-950/80 p-4 sm:p-6 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-violet-400" />
                Preview em Tempo Real (Discord)
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-mono"
              >
                Live Preview
              </Badge>
            </div>

            {/* Simulated Discord Channel Header */}
            <div className="rounded-t-xl bg-[#2b2d31] px-3.5 py-2 border border-[#232428] flex items-center gap-2 text-xs font-bold text-[#f2f3f5] shadow-xs">
              <span className="text-[#80848e] text-base font-normal">#</span>
              <span className="truncate">
                {activeWebhook ? activeWebhook.name : "canal-discord"}
              </span>
              <span className="text-[10px] text-[#949ba4] font-mono ml-auto">
                ID: {activeWebhook?.channelId || "—"}
              </span>
            </div>

            {/* Authentic Discord Desktop Chat Box */}
            <div className="rounded-b-xl bg-[#313338] border-x border-b border-[#232428] text-[#dbdee1] p-4 shadow-2xl space-y-2 select-none min-h-[320px]">
              {/* Message Row */}
              <div className="flex items-start gap-3.5">
                {/* Bot Avatar */}
                <img
                  src={avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                  alt="Bot"
                  className="w-10 h-10 rounded-full object-cover shrink-0 bg-[#2b2d31] shadow-sm ring-1 ring-black/40"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                  }}
                />

                <div className="flex-1 min-w-0 space-y-1">
                  {/* Top Author Line */}
                  <div className="flex items-center gap-1.5 flex-wrap leading-none">
                    <span className="font-semibold text-sm text-[#f2f3f5] hover:underline cursor-pointer">
                      {username || "Twin Wheels RP"}
                    </span>
                    <span className="inline-flex items-center bg-[#5865F2] text-white text-[9px] font-bold px-1 py-0.5 rounded leading-none shadow-xs">
                      APP
                    </span>
                    <span className="text-[11px] text-[#949ba4] font-normal ml-1">
                      {previewTime}
                    </span>
                  </div>

                  {/* Content (Fora do Embed) */}
                  {content.trim() && (
                    <div className="text-sm text-[#dbdee1] leading-relaxed break-words whitespace-pre-wrap pt-0.5">
                      {/* Simple highlight of @mentions */}
                      {content.split(" ").map((token, i) => {
                        if (token.startsWith("@") || token.startsWith("<@")) {
                          return (
                            <span
                              key={i}
                              className="bg-[#5865f2]/20 text-[#c9cdfb] px-1 py-0.5 rounded font-medium mr-1 inline-block"
                            >
                              {token}
                            </span>
                          );
                        }
                        return <React.Fragment key={i}>{token} </React.Fragment>;
                      })}
                    </div>
                  )}

                  {/* Embed Box */}
                  {hasEmbed && (
                    <div
                      className="rounded-md bg-[#2b2d31] border border-[#1e1f22] p-3.5 space-y-2.5 max-w-full relative shadow-md mt-1"
                      style={{
                        borderLeftWidth: "4px",
                        borderLeftColor: color || "#10B981",
                      }}
                    >
                      {/* Author */}
                      {authorName.trim() && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#f2f3f5]">
                          {authorIconUrl.trim() && (
                            <img
                              src={authorIconUrl}
                              alt="Author Icon"
                              className="w-4 h-4 rounded-full object-cover shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <span className={cn("truncate", authorUrl ? "hover:underline cursor-pointer" : "")}>
                            {authorName}
                          </span>
                        </div>
                      )}

                      {/* Title & Thumbnail Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          {title.trim() && (
                            <div
                              className={cn(
                                "font-bold text-sm text-[#f2f3f5] leading-snug break-words",
                                titleUrl ? "text-[#00a8fc] hover:underline cursor-pointer" : ""
                              )}
                            >
                              {title}
                            </div>
                          )}

                          {/* Description */}
                          {description.trim() && (
                            useCodeblock ? (
                              <div className="bg-[#1e1f22] rounded-md p-2.5 border border-[#111214] font-mono text-xs text-[#dbdee1] shadow-inner break-words whitespace-pre-wrap">
                                {description}
                              </div>
                            ) : (
                              <div className="text-xs text-[#dbdee1] leading-relaxed break-words whitespace-pre-wrap">
                                {description}
                              </div>
                            )
                          )}
                        </div>

                        {/* Thumbnail */}
                        {thumbnailUrl.trim() && (
                          <img
                            src={thumbnailUrl}
                            alt="Thumbnail"
                            className="w-16 h-16 rounded-md object-cover shrink-0 border border-black/30 bg-[#1e1f22]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        )}
                      </div>

                      {/* Fields */}
                      {fields.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#35373c]/50">
                          {fields.map((f) => (
                            <div
                              key={f.id}
                              className={cn(
                                "space-y-0.5",
                                f.inline ? "col-span-1" : "sm:col-span-2"
                              )}
                            >
                              <div className="text-[11px] font-bold text-[#f2f3f5] truncate">
                                {f.name || "\u200b"}
                              </div>
                              <div className="text-xs text-[#dbdee1] break-words whitespace-pre-wrap">
                                {f.value || "\u200b"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Banner Image */}
                      {imageUrl.trim() && (
                        <div className="rounded overflow-hidden max-h-56 w-full border border-black/30 bg-[#1e1f22] mt-1">
                          <img
                            src={imageUrl}
                            alt="Banner"
                            className="w-full object-cover max-h-56"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      {/* Footer */}
                      {(footerText.trim() || showTimestamp) && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#949ba4] pt-1">
                          {footerIconUrl.trim() && (
                            <img
                              src={footerIconUrl}
                              alt="Footer Icon"
                              className="w-4 h-4 rounded-full object-cover shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          {footerText.trim() && <span className="truncate">{footerText}</span>}
                          {footerText.trim() && showTimestamp && <span>•</span>}
                          {showTimestamp && <span>{previewTime}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              A renderização acima simula exatamente a exibição no cliente desktop do Discord.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-3.5 sm:px-6 bg-zinc-900/80 border-t border-border/50 shrink-0 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Destino:</span>
            <strong className="text-foreground">{activeWebhook?.name || "Webhook"}</strong>
            <span className="text-[10px] font-mono text-zinc-500">({activeWebhook?.channelId})</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-zinc-900 border-zinc-800 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPosting}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold gap-1.5 shadow-lg shadow-violet-950/40"
            >
              {isPosting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Enviar ao Discord
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
