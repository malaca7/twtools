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
  Check,
  ImageIcon,
  AtSign,
  Link2,
  User,
  Clock,
  Code2,
  FileJson,
  RotateCcw,
  Layers,
  Copy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  uploadWebhookAvatar,
  type DiscordWebhook,
  type PostMessagePayload,
  type DiscordEmbedData,
} from "@/services/webhookService";
import { DiscordMarkdown } from "./DiscordMarkdown";

export interface DiscohookPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: DiscordWebhook | null;
  allWebhooks?: DiscordWebhook[];
  onSelectWebhook?: (webhook: DiscordWebhook) => void;
  onSend: (payload: PostMessagePayload, targetWebhook: DiscordWebhook) => Promise<boolean>;
  isPosting?: boolean;
}

export interface EmbedFieldItem {
  id: string;
  name: string;
  value: string;
  inline: boolean;
}

export interface DiscohookEmbedItem {
  id: string;
  title: string;
  titleUrl: string;
  description: string;
  color: string;
  useCodeblock: boolean;
  authorName: string;
  authorUrl: string;
  authorIconUrl: string;
  thumbnailUrl: string;
  imageUrl: string;
  footerText: string;
  footerIconUrl: string;
  showTimestamp: boolean;
  fields: EmbedFieldItem[];
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

  // Multiple Embeds List (1 to 10 embeds)
  const [embeds, setEmbeds] = useState<DiscohookEmbedItem[]>([]);
  const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);

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

  // Active Embed helper
  const currentEmbed = embeds[activeEmbedIndex] || null;

  // Helper to create a new empty embed
  const createDefaultEmbed = (base?: Partial<DiscohookEmbedItem>): DiscohookEmbedItem => ({
    id: `emb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: base?.title || "💻 Comunicado Oficial",
    titleUrl: base?.titleUrl || "",
    description: base?.description || "",
    color: base?.color || activeWebhook?.embedColor || "#10B981",
    useCodeblock: base?.useCodeblock ?? (activeWebhook?.useCodeblockField ?? false),
    authorName: base?.authorName || activeWebhook?.authorName || "",
    authorUrl: base?.authorUrl || activeWebhook?.authorUrl || "",
    authorIconUrl: base?.authorIconUrl || activeWebhook?.authorIconUrl || "",
    thumbnailUrl: base?.thumbnailUrl || activeWebhook?.thumbnailUrl || "",
    imageUrl: base?.imageUrl || activeWebhook?.imageUrl || "",
    footerText: base?.footerText || activeWebhook?.footerText || "Twin Wheels RP",
    footerIconUrl: base?.footerIconUrl || activeWebhook?.footerIconUrl || "",
    showTimestamp: base?.showTimestamp ?? (activeWebhook?.showTimestamp !== false),
    fields: base?.fields || [],
  });

  // Initialize or reset form when webhook changes or modal opens
  useEffect(() => {
    if (activeWebhook && open) {
      setUsername(activeWebhook.username || activeWebhook.name || "Twin Wheels RP");
      setAvatarUrl(activeWebhook.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png");
      setContent(activeWebhook.mentionRoles || "");

      // Cria o embed inicial com os padrões do webhook
      const initialEmbed: DiscohookEmbedItem = createDefaultEmbed({
        title: activeWebhook.defaultTitle || "💻 Teste Desenvolvedor",
        description: activeWebhook.defaultDescription || "by malaca",
        color: activeWebhook.embedColor || "#10B981",
        useCodeblock: activeWebhook.useCodeblockField ?? false,
      });

      setEmbeds([initialEmbed]);
      setActiveEmbedIndex(0);
    }
  }, [activeWebhook?.id, open]);

  // Update current active embed properties
  const updateCurrentEmbed = (updates: Partial<DiscohookEmbedItem>) => {
    if (activeEmbedIndex < 0 || activeEmbedIndex >= embeds.length) return;
    setEmbeds((prev) =>
      prev.map((emb, idx) => (idx === activeEmbedIndex ? { ...emb, ...updates } : emb))
    );
  };

  // Add a new embed
  const handleAddEmbed = () => {
    if (embeds.length >= 10) {
      toast.error("O Discord permite no máximo 10 embeds por mensagem.");
      return;
    }
    const newEmb = createDefaultEmbed({
      title: `Embed #${embeds.length + 1}`,
      description: "",
    });
    setEmbeds((prev) => [...prev, newEmb]);
    setActiveEmbedIndex(embeds.length);
    toast.success(`Embed #${embeds.length + 1} adicionado!`);
  };

  // Duplicate an embed
  const handleDuplicateEmbed = (index: number) => {
    if (embeds.length >= 10) {
      toast.error("O Discord permite no máximo 10 embeds por mensagem.");
      return;
    }
    const source = embeds[index];
    if (!source) return;

    const clone: DiscohookEmbedItem = {
      ...JSON.parse(JSON.stringify(source)),
      id: `emb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: source.title ? `${source.title} (Cópia)` : `Embed #${embeds.length + 1}`,
    };

    const next = [...embeds];
    next.splice(index + 1, 0, clone);
    setEmbeds(next);
    setActiveEmbedIndex(index + 1);
    toast.success(`Embed #${index + 1} duplicado com sucesso!`);
  };

  // Delete an embed
  const handleDeleteEmbed = (index: number) => {
    const next = embeds.filter((_, i) => i !== index);
    setEmbeds(next);
    if (activeEmbedIndex >= next.length) {
      setActiveEmbedIndex(Math.max(0, next.length - 1));
    }
    toast.info("Embed removido.");
  };

  // Move embed order
  const handleMoveEmbed = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= embeds.length) return;
    const next = [...embeds];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setEmbeds(next);
    setActiveEmbedIndex(toIndex);
  };

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

  // Add field to current embed
  const handleAddField = () => {
    if (!currentEmbed) return;
    if (currentEmbed.fields.length >= 25) {
      toast.error("O Discord permite no máximo 25 campos por embed.");
      return;
    }
    const newField: EmbedFieldItem = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `Campo ${currentEmbed.fields.length + 1}`,
      value: "Valor do campo",
      inline: true,
    };
    updateCurrentEmbed({ fields: [...currentEmbed.fields, newField] });
  };

  const handleUpdateField = (id: string, updates: Partial<EmbedFieldItem>) => {
    if (!currentEmbed) return;
    updateCurrentEmbed({
      fields: currentEmbed.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  };

  const handleRemoveField = (id: string) => {
    if (!currentEmbed) return;
    updateCurrentEmbed({
      fields: currentEmbed.fields.filter((f) => f.id !== id),
    });
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

    const formattedEmbeds: any[] = embeds.map((emb) => {
      const embedObj: any = {
        title: emb.title.trim() || undefined,
        url: emb.titleUrl.trim() || undefined,
        description: emb.description.trim() || undefined,
        color: parseInt(emb.color.replace("#", ""), 16) || 0x10b981,
      };

      if (emb.authorName.trim()) {
        embedObj.author = {
          name: emb.authorName.trim(),
          url: emb.authorUrl.trim() || undefined,
          icon_url: emb.authorIconUrl.trim() || undefined,
        };
      }

      if (emb.thumbnailUrl.trim()) {
        embedObj.thumbnail = { url: emb.thumbnailUrl.trim() };
      }

      if (emb.imageUrl.trim()) {
        embedObj.image = { url: emb.imageUrl.trim() };
      }

      if (emb.footerText.trim()) {
        embedObj.footer = {
          text: emb.footerText.trim(),
          icon_url: emb.footerIconUrl.trim() || undefined,
        };
      }

      if (emb.showTimestamp) {
        embedObj.timestamp = new Date().toISOString();
      }

      if (emb.fields.length > 0) {
        embedObj.fields = emb.fields
          .filter((f) => f.name.trim() || f.value.trim())
          .map((f) => ({
            name: f.name.trim() || "\u200b",
            value: f.value.trim() || "\u200b",
            inline: !!f.inline,
          }));
      }

      return embedObj;
    });

    const payload: any = {
      username: username.trim() || undefined,
      avatar_url: avatarUrl.trim() || undefined,
      content: cleanContent || undefined,
    };

    if (formattedEmbeds.length > 0) {
      payload.embeds = formattedEmbeds;
    }

    return payload;
  }, [content, username, avatarUrl, embeds]);

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
    setContent(activeWebhook.mentionRoles || "");

    const defaultEmb = createDefaultEmbed({
      title: activeWebhook.defaultTitle || "💻 Teste Desenvolvedor",
      description: activeWebhook.defaultDescription || "by malaca",
      color: activeWebhook.embedColor || "#10B981",
      useCodeblock: activeWebhook.useCodeblockField ?? false,
    });
    setEmbeds([defaultEmb]);
    setActiveEmbedIndex(0);
    toast.info("Configurações restauradas para o padrão do webhook.");
  };

  // Clear everything
  const handleClear = () => {
    setContent("");
    setEmbeds([]);
    setActiveEmbedIndex(0);
    toast.info("Todos os campos e embeds foram limpos.");
  };

  // Submit post
  const handleSubmit = async () => {
    if (!activeWebhook) {
      toast.error("Nenhum webhook selecionado para envio.");
      return;
    }

    const hasAnyContent = Boolean(
      content.trim() ||
        embeds.some(
          (emb) =>
            emb.title.trim() ||
            emb.description.trim() ||
            emb.imageUrl.trim() ||
            emb.thumbnailUrl.trim() ||
            emb.fields.length > 0
        )
    );

    if (!hasAnyContent) {
      toast.error("Digite o texto da mensagem ou configure pelo menos um embed.");
      return;
    }

    const embedsPayload: DiscordEmbedData[] = embeds.map((emb) => ({
      title: emb.title.trim() || undefined,
      titleUrl: emb.titleUrl.trim() || undefined,
      description: emb.description.trim() || undefined,
      color: emb.color,
      useCodeblock: emb.useCodeblock,
      authorName: emb.authorName.trim() || undefined,
      authorUrl: emb.authorUrl.trim() || undefined,
      authorIconUrl: emb.authorIconUrl.trim() || undefined,
      thumbnailUrl: emb.thumbnailUrl.trim() || undefined,
      imageUrl: emb.imageUrl.trim() || undefined,
      footerText: emb.footerText.trim() || undefined,
      footerIconUrl: emb.footerIconUrl.trim() || undefined,
      showTimestamp: emb.showTimestamp,
      fields:
        emb.fields.length > 0
          ? emb.fields
              .filter((f) => f.name.trim() || f.value.trim())
              .map((f) => ({
                name: f.name.trim() || "\u200b",
                value: f.value.trim() || "\u200b",
                inline: f.inline,
              }))
          : undefined,
    }));

    const payload: PostMessagePayload = {
      content: content.trim() || undefined,
      username: username.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      embeds: embedsPayload.length > 0 ? embedsPayload : undefined,
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
      <DialogContent className="max-w-[96vw] lg:max-w-6xl xl:max-w-7xl bg-zinc-950 border-zinc-800 text-foreground max-h-[94vh] flex flex-col p-0 overflow-hidden shadow-2xl">
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
            handleFileUpload(
              e,
              (url) => updateCurrentEmbed({ authorIconUrl: url }),
              setIsUploadingAuthorIcon,
              "Ícone do Autor"
            )
          }
        />
        <input
          type="file"
          ref={thumbnailInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFileUpload(
              e,
              (url) => updateCurrentEmbed({ thumbnailUrl: url }),
              setIsUploadingThumbnail,
              "Miniatura"
            )
          }
        />
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFileUpload(
              e,
              (url) => updateCurrentEmbed({ imageUrl: url }),
              setIsUploadingImage,
              "Banner do Embed"
            )
          }
        />
        <input
          type="file"
          ref={footerIconInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            handleFileUpload(
              e,
              (url) => updateCurrentEmbed({ footerIconUrl: url }),
              setIsUploadingFooterIcon,
              "Ícone do Rodapé"
            )
          }
        />

        {/* Modal Header */}
        <DialogHeader className="p-3.5 sm:px-6 sm:py-3 border-b border-border/50 bg-zinc-900/60 shrink-0 flex flex-row items-center justify-between gap-3">
          <div className="space-y-0.5">
            <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
              <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30">
                <MessageSquarePlus className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="truncate">Nova Postagem — Editor Discord (Estilo Discohook)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>Construa mensagens e múltiplos embeds com preview fiel ao Discord desktop.</span>
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Target Webhook Selector */}
            {allWebhooks.length > 1 && onSelectWebhook && activeWebhook && (
              <div className="hidden sm:flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs">
                <span className="text-muted-foreground font-semibold">Canal:</span>
                <select
                  value={activeWebhook.id}
                  onChange={(e) => {
                    const found = allWebhooks.find((w) => w.id === e.target.value);
                    if (found) onSelectWebhook(found);
                  }}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-hidden cursor-pointer max-w-[140px] truncate"
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
              title="Copiar JSON oficial Discord / Discohook"
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
          <div className="lg:col-span-7 overflow-y-auto p-3.5 sm:p-5 border-b lg:border-b-0 lg:border-r border-border/60 space-y-4">
            <Tabs defaultValue="embeds" className="w-full">
              <TabsList className="grid grid-cols-3 bg-zinc-900/80 p-1 border border-zinc-800/80 rounded-xl h-auto">
                <TabsTrigger value="embeds" className="text-xs font-bold py-1.5 data-[state=active]:bg-zinc-800 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-violet-400" />
                  <span>Embeds ({embeds.length})</span>
                </TabsTrigger>
                <TabsTrigger value="message" className="text-xs font-bold py-1.5 data-[state=active]:bg-zinc-800 flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5 text-primary" />
                  <span>Mensagem</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="text-xs font-bold py-1.5 data-[state=active]:bg-zinc-800 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-amber-400" />
                  <span>Perfil Bot</span>
                </TabsTrigger>
              </TabsList>

              {/* ==================== TAB 1: GERENCIADOR DE MÚLTIPLOS EMBEDS ==================== */}
              <TabsContent value="embeds" className="space-y-4 pt-3">
                {/* Embeds Bar: Selector & Actions */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/90 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Lista de Embeds ({embeds.length}/10)
                      </span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddEmbed}
                      disabled={embeds.length >= 10}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs gap-1.5 h-7 shadow-xs"
                    >
                      <Plus className="h-3 w-3" />
                      Adicionar Embed
                    </Button>
                  </div>

                  {/* Pills de Navegação entre os Embeds */}
                  {embeds.length > 0 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                      {embeds.map((emb, idx) => {
                        const isCur = idx === activeEmbedIndex;
                        return (
                          <button
                            key={emb.id}
                            type="button"
                            onClick={() => setActiveEmbedIndex(idx)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shrink-0 cursor-pointer",
                              isCur
                                ? "bg-zinc-800 border-violet-500 text-white shadow-sm ring-1 ring-violet-500/50"
                                : "bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                            )}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: emb.color || "#10B981" }}
                            />
                            <span>{emb.title ? emb.title.slice(0, 18) : `Embed ${idx + 1}`}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-zinc-800 rounded-lg bg-zinc-950/50">
                      <p className="text-xs text-muted-foreground">
                        Nenhum embed configurado. Apenas o texto da mensagem será enviado ao Discord.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddEmbed}
                        className="mt-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold gap-1.5"
                      >
                        <Plus className="h-3 w-3" />
                        Criar Primeiro Embed
                      </Button>
                    </div>
                  )}

                  {/* Ações do Embed Ativo */}
                  {currentEmbed && (
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-zinc-400 font-semibold mr-1">
                          Editando Embed #{activeEmbedIndex + 1}:
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={activeEmbedIndex === 0}
                          onClick={() => handleMoveEmbed(activeEmbedIndex, activeEmbedIndex - 1)}
                          className="h-6 w-6 p-0 text-zinc-400 hover:text-white"
                          title="Mover para cima/esquerda"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={activeEmbedIndex === embeds.length - 1}
                          onClick={() => handleMoveEmbed(activeEmbedIndex, activeEmbedIndex + 1)}
                          className="h-6 w-6 p-0 text-zinc-400 hover:text-white"
                          title="Mover para baixo/direita"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateEmbed(activeEmbedIndex)}
                          disabled={embeds.length >= 10}
                          className="h-6 px-2 text-[11px] font-bold bg-zinc-950 border-zinc-800 hover:bg-zinc-800 text-zinc-300 gap-1"
                          title="Duplicar este embed"
                        >
                          <Copy className="h-3 w-3" />
                          Duplicar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEmbed(activeEmbedIndex)}
                          className="h-6 px-2 text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 gap-1"
                          title="Excluir este embed"
                        >
                          <Trash2 className="h-3 w-3" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Painéis de Edição do Embed Ativo */}
                {currentEmbed && (
                  <Tabs defaultValue="body" className="w-full">
                    <TabsList className="grid grid-cols-4 bg-zinc-900/60 p-1 border border-zinc-800/80 rounded-lg h-auto">
                      <TabsTrigger value="body" className="text-[11px] font-bold py-1 data-[state=active]:bg-zinc-800">
                        Corpo & Cor
                      </TabsTrigger>
                      <TabsTrigger value="fields" className="text-[11px] font-bold py-1 data-[state=active]:bg-zinc-800">
                        Campos ({currentEmbed.fields.length})
                      </TabsTrigger>
                      <TabsTrigger value="images" className="text-[11px] font-bold py-1 data-[state=active]:bg-zinc-800">
                        Imagens
                      </TabsTrigger>
                      <TabsTrigger value="author" className="text-[11px] font-bold py-1 data-[state=active]:bg-zinc-800">
                        Autor / Rodapé
                      </TabsTrigger>
                    </TabsList>

                    {/* SUB-ABA: CORPO & COR DO EMBED */}
                    <TabsContent value="body" className="space-y-3 pt-3">
                      {/* Título & Link */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold">Título do Embed</Label>
                          <Input
                            value={currentEmbed.title}
                            onChange={(e) => updateCurrentEmbed({ title: e.target.value })}
                            placeholder="Ex: 📢 COMUNICADO OFICIAL"
                            className="bg-zinc-950 border-zinc-800 text-xs font-bold h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold flex items-center gap-1">
                            <Link2 className="h-3 w-3 text-muted-foreground" />
                            URL do Título (Link Clicável)
                          </Label>
                          <Input
                            value={currentEmbed.titleUrl}
                            onChange={(e) => updateCurrentEmbed({ titleUrl: e.target.value })}
                            placeholder="https://..."
                            className="bg-zinc-950 border-zinc-800 text-xs font-mono h-8"
                          />
                        </div>
                      </div>

                      {/* Descrição */}
                      <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold">
                            Descrição Principal (Suporta Markdown do Discord)
                          </Label>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {currentEmbed.description.length}/4096
                          </span>
                        </div>
                        <Textarea
                          rows={4}
                          value={currentEmbed.description}
                          onChange={(e) => updateCurrentEmbed({ description: e.target.value })}
                          placeholder="Texto do embed. Suporta **negrito**, *itálico*, __sublinhado__, ||spoiler||, -# subtexto, etc..."
                          className="bg-zinc-950 border-zinc-800 text-xs leading-relaxed font-sans"
                        />

                        {/* Switch Codeblock Monospace */}
                        <div className="flex items-center justify-between pt-1.5">
                          <div className="flex items-center gap-1.5">
                            <Code2 className="h-3.5 w-3.5 text-violet-400" />
                            <span className="text-xs font-medium text-zinc-300">
                              Destacar descrição em bloco de código escuro (Codeblock)
                            </span>
                          </div>
                          <Switch
                            checked={currentEmbed.useCodeblock}
                            onCheckedChange={(val) => updateCurrentEmbed({ useCodeblock: val })}
                          />
                        </div>
                      </div>

                      {/* Cor da Barra Lateral */}
                      <div className="space-y-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold flex items-center gap-1.5">
                            <Palette className="h-3.5 w-3.5 text-primary" />
                            Cor da Barra Lateral deste Embed
                          </Label>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-md border border-white/20 shadow-xs"
                              style={{ backgroundColor: currentEmbed.color }}
                            />
                            <Input
                              value={currentEmbed.color}
                              onChange={(e) => updateCurrentEmbed({ color: e.target.value })}
                              placeholder="#10B981"
                              className="w-24 bg-zinc-950 border-zinc-800 text-xs font-mono font-bold h-7 uppercase text-center"
                            />
                          </div>
                        </div>

                        {/* Paleta de Cores */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                          {COLOR_PRESETS.map((preset) => {
                            const isSelected =
                              currentEmbed.color.toLowerCase() === preset.hex.toLowerCase();
                            return (
                              <button
                                key={preset.hex}
                                type="button"
                                onClick={() => updateCurrentEmbed({ color: preset.hex })}
                                className={cn(
                                  "flex items-center gap-1.5 p-1.5 rounded-lg border text-left text-[11px] transition-all cursor-pointer",
                                  isSelected
                                    ? "bg-zinc-800 border-primary ring-1 ring-primary text-white font-bold"
                                    : "bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900"
                                )}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                                  style={{ backgroundColor: preset.hex }}
                                />
                                <span className="truncate">{preset.name.split(" ")[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </TabsContent>

                    {/* SUB-ABA: CAMPOS DO EMBED (FIELDS) */}
                    <TabsContent value="fields" className="space-y-3 pt-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                        <div>
                          <h4 className="text-xs font-bold text-foreground">
                            Campos deste Embed ({currentEmbed.fields.length}/25)
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            Chave e valor com suporte a exibição lado a lado (Inline).
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddField}
                          disabled={currentEmbed.fields.length >= 25}
                          className="text-xs font-bold gap-1 bg-violet-600 hover:bg-violet-500 text-white h-7"
                        >
                          <Plus className="h-3 w-3" />
                          Adicionar Campo
                        </Button>
                      </div>

                      {currentEmbed.fields.length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
                          <p className="text-xs text-muted-foreground">Nenhum campo adicionado neste embed.</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddField}
                            className="mt-2 text-xs font-bold gap-1 bg-zinc-900 border-zinc-800"
                          >
                            <Plus className="h-3 w-3" />
                            Adicionar Campo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {currentEmbed.fields.map((field, fIdx) => (
                            <div
                              key={field.id}
                              className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">
                                  Campo #{fIdx + 1}
                                </span>
                                <div className="flex items-center gap-3">
                                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                                    <Switch
                                      checked={field.inline}
                                      onCheckedChange={(val) =>
                                        handleUpdateField(field.id, { inline: val })
                                      }
                                    />
                                    <span className="text-[11px]">Inline</span>
                                  </label>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveField(field.id)}
                                    className="h-6 w-6 p-0 text-zinc-400 hover:text-rose-400"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Input
                                  value={field.name}
                                  onChange={(e) =>
                                    handleUpdateField(field.id, { name: e.target.value })
                                  }
                                  placeholder="Título / Nome do campo"
                                  className="bg-zinc-950 border-zinc-800 text-xs font-bold h-8"
                                />
                                <Input
                                  value={field.value}
                                  onChange={(e) =>
                                    handleUpdateField(field.id, { value: e.target.value })
                                  }
                                  placeholder="Valor do campo"
                                  className="bg-zinc-950 border-zinc-800 text-xs h-8"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* SUB-ABA: IMAGENS & MINIATURA DO EMBED */}
                    <TabsContent value="images" className="space-y-3 pt-3">
                      {/* Miniatura */}
                      <div className="space-y-2 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                            Miniatura (Thumbnail no Canto Superior Direito)
                          </Label>
                          {currentEmbed.thumbnailUrl && (
                            <button
                              type="button"
                              onClick={() => updateCurrentEmbed({ thumbnailUrl: "" })}
                              className="text-[10px] text-rose-400 hover:underline font-semibold"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={currentEmbed.thumbnailUrl}
                            onChange={(e) => updateCurrentEmbed({ thumbnailUrl: e.target.value })}
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

                      {/* Imagem Grande / Banner */}
                      <div className="space-y-2 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                            Banner / Imagem Grande (Rodapé do Embed)
                          </Label>
                          {currentEmbed.imageUrl && (
                            <button
                              type="button"
                              onClick={() => updateCurrentEmbed({ imageUrl: "" })}
                              className="text-[10px] text-rose-400 hover:underline font-semibold"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={currentEmbed.imageUrl}
                            onChange={(e) => updateCurrentEmbed({ imageUrl: e.target.value })}
                            placeholder="https://... (URL do banner ou print anexo)"
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

                    {/* SUB-ABA: AUTOR & RODAPÉ DO EMBED */}
                    <TabsContent value="author" className="space-y-3 pt-3">
                      {/* Autor */}
                      <div className="space-y-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary" />
                          Autor do Embed (Topo)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            value={currentEmbed.authorName}
                            onChange={(e) => updateCurrentEmbed({ authorName: e.target.value })}
                            placeholder="Nome do autor"
                            className="bg-zinc-950 border-zinc-800 text-xs font-bold h-8"
                          />
                          <Input
                            value={currentEmbed.authorUrl}
                            onChange={(e) => updateCurrentEmbed({ authorUrl: e.target.value })}
                            placeholder="URL do link do autor (opcional)"
                            className="bg-zinc-950 border-zinc-800 text-xs font-mono h-8"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Input
                            value={currentEmbed.authorIconUrl}
                            onChange={(e) => updateCurrentEmbed({ authorIconUrl: e.target.value })}
                            placeholder="URL do ícone do autor..."
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

                      {/* Rodapé (Footer) */}
                      <div className="space-y-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          Rodapé do Embed (Footer)
                        </h4>
                        <Input
                          value={currentEmbed.footerText}
                          onChange={(e) => updateCurrentEmbed({ footerText: e.target.value })}
                          placeholder="Texto do rodapé"
                          className="bg-zinc-950 border-zinc-800 text-xs h-8"
                        />

                        <div className="flex items-center gap-2 pt-1">
                          <Input
                            value={currentEmbed.footerIconUrl}
                            onChange={(e) => updateCurrentEmbed({ footerIconUrl: e.target.value })}
                            placeholder="URL do ícone do rodapé..."
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

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-zinc-300 font-medium">
                            Exibir carimbo de horário atual no rodapé
                          </span>
                          <Switch
                            checked={currentEmbed.showTimestamp}
                            onCheckedChange={(val) => updateCurrentEmbed({ showTimestamp: val })}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </TabsContent>

              {/* ==================== TAB 2: MENSAGEM EXTERNA (CONTENT) ==================== */}
              <TabsContent value="message" className="space-y-3 pt-3">
                <div className="space-y-2.5 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5">
                      <AtSign className="h-3.5 w-3.5 text-primary" />
                      Texto da Mensagem (Fora dos Embeds)
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
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Digite menções (@everyone, @here), avisos de texto ou markdown do Discord (-# subtexto, ||spoiler||, **negrito**)..."
                    className="bg-zinc-950 border-zinc-800 text-xs font-sans leading-relaxed"
                  />
                  <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/60 text-[11px] text-muted-foreground space-y-1">
                    <span className="font-bold text-zinc-300">💡 Dicas de formatação do Discord suportadas:</span>
                    <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-mono">
                      <li><code className="text-violet-400">-# texto</code> : Subtexto focado</li>
                      <li><code className="text-violet-400">||spoiler||</code> : Spoiler oculto</li>
                      <li><code className="text-violet-400">**negrito**</code> : Negrito</li>
                      <li><code className="text-violet-400">*itálico*</code> : Itálico</li>
                      <li><code className="text-violet-400">__sublinhado__</code> : Sublinhado</li>
                      <li><code className="text-violet-400">&gt; citação</code> : Bloco de citação</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* ==================== TAB 3: PERFIL DO BOT OVERRIDE ==================== */}
              <TabsContent value="profile" className="space-y-3 pt-3">
                <div className="space-y-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    Identidade do Emissor (Substituição de Bot)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Substitua o nome e o avatar padrão do webhook para toda esta postagem.
                  </p>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold">Nome do Bot</Label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ex: Twin Wheels RP ou Notícias da Facção"
                      className="bg-zinc-950 border-zinc-800 text-xs font-bold h-8"
                    />
                  </div>

                  <div className="space-y-1">
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
          <div className="lg:col-span-5 bg-zinc-950/80 p-3.5 sm:p-5 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-violet-400" />
                Preview em Tempo Real (Discord)
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-mono"
              >
                {embeds.length} {embeds.length === 1 ? "embed" : "embeds"}
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
            <div className="rounded-b-xl bg-[#313338] border-x border-b border-[#232428] text-[#dbdee1] p-3.5 sm:p-4 shadow-2xl space-y-2 select-none min-h-[360px]">
              {/* Message Row */}
              <div className="flex items-start gap-3">
                {/* Bot Avatar */}
                <img
                  src={avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                  alt="Bot"
                  className="w-10 h-10 rounded-full object-cover shrink-0 bg-[#2b2d31] shadow-sm ring-1 ring-black/40"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                  }}
                />

                <div className="flex-1 min-w-0 space-y-1.5">
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

                  {/* Content (Fora do Embed) com Parser Completo de Discord Markdown */}
                  {content.trim() && (
                    <div className="pt-0.5 pb-1">
                      <DiscordMarkdown text={content} />
                    </div>
                  )}

                  {/* LISTA DE MÚLTIPLOS EMBEDS ESTILIZADOS DO DISCORD */}
                  {embeds.length > 0 && (
                    <div className="space-y-2.5 mt-1">
                      {embeds.map((emb, idx) => (
                        <div
                          key={emb.id || idx}
                          className="rounded-md bg-[#2b2d31] border border-[#1e1f22] p-3.5 space-y-2.5 max-w-full relative shadow-md transition-all"
                          style={{
                            borderLeftWidth: "4px",
                            borderLeftColor: emb.color || "#10B981",
                          }}
                        >
                          {/* Author */}
                          {emb.authorName.trim() && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#f2f3f5]">
                              {emb.authorIconUrl.trim() && (
                                <img
                                  src={emb.authorIconUrl}
                                  alt="Author Icon"
                                  className="w-4 h-4 rounded-full object-cover shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              )}
                              <span
                                className={cn(
                                  "truncate",
                                  emb.authorUrl ? "hover:underline cursor-pointer text-[#00a8fc]" : ""
                                )}
                              >
                                {emb.authorName}
                              </span>
                            </div>
                          )}

                          {/* Title & Thumbnail Row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 min-w-0 flex-1">
                              {emb.title.trim() && (
                                <div
                                  className={cn(
                                    "font-bold text-sm text-[#f2f3f5] leading-snug break-words",
                                    emb.titleUrl ? "text-[#00a8fc] hover:underline cursor-pointer" : ""
                                  )}
                                >
                                  {emb.title}
                                </div>
                              )}

                              {/* Description with Discord Markdown */}
                              {emb.description.trim() &&
                                (emb.useCodeblock ? (
                                  <div className="bg-[#1e1f22] rounded-md p-2.5 border border-[#111214] font-mono text-xs text-[#dbdee1] shadow-inner break-words whitespace-pre-wrap">
                                    {emb.description}
                                  </div>
                                ) : (
                                  <div className="pt-0.5">
                                    <DiscordMarkdown text={emb.description} />
                                  </div>
                                ))}
                            </div>

                            {/* Thumbnail */}
                            {emb.thumbnailUrl.trim() && (
                              <img
                                src={emb.thumbnailUrl}
                                alt="Thumbnail"
                                className="w-16 h-16 rounded-md object-cover shrink-0 border border-black/30 bg-[#1e1f22]"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            )}
                          </div>

                          {/* Fields Grid */}
                          {emb.fields.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#35373c]/50">
                              {emb.fields.map((f) => (
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
                                  <div className="text-xs text-[#dbdee1] break-words">
                                    <DiscordMarkdown text={f.value || "\u200b"} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Banner Image */}
                          {emb.imageUrl.trim() && (
                            <div className="rounded overflow-hidden max-h-52 w-full border border-black/30 bg-[#1e1f22] mt-1">
                              <img
                                src={emb.imageUrl}
                                alt="Banner"
                                className="w-full object-cover max-h-52"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                          )}

                          {/* Footer */}
                          {(emb.footerText.trim() || emb.showTimestamp) && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[#949ba4] pt-1">
                              {emb.footerIconUrl.trim() && (
                                <img
                                  src={emb.footerIconUrl}
                                  alt="Footer Icon"
                                  className="w-4 h-4 rounded-full object-cover shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              )}
                              {emb.footerText.trim() && (
                                <span className="truncate">{emb.footerText}</span>
                              )}
                              {emb.footerText.trim() && emb.showTimestamp && <span>•</span>}
                              {emb.showTimestamp && <span>{previewTime}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Renderização em tempo real formatada com suporte a subtexto, spoilers, menções e múltiplos embeds.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-3 sm:px-6 bg-zinc-900/80 border-t border-border/50 shrink-0 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Destino:</span>
            <strong className="text-foreground">{activeWebhook?.name || "Webhook"}</strong>
            <span className="text-[10px] font-mono text-zinc-500">
              ({activeWebhook?.channelId})
            </span>
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
              Enviar ao Discord ({embeds.length} {embeds.length === 1 ? "embed" : "embeds"})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
