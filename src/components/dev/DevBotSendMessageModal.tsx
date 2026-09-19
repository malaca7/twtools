import React, { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  MessageSquare,
  Send,
  Loader2,
  Server,
  Hash,
  Palette,
  Image as ImageIcon,
  User,
  Clock,
  Plus,
  Trash2,
  Eye,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Quote,
  EyeOff,
  AtSign,
  Sparkles,
  ExternalLink,
  Volume2,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type BotGuildInfo,
  type DiscordChannelInfo,
  type DiscordEmbedData,
  type DiscordEmbedField,
  fetchGuildChannels,
  sendBotDiscordMessage,
} from "@/services/discordBotManageService";

// Presets de Cores do Discord e TW
const COLOR_PRESETS = [
  { name: "Blurple", hex: "#5865F2" },
  { name: "Esmeralda", hex: "#10B981" },
  { name: "Dourado", hex: "#F59E0B" },
  { name: "Rubi", hex: "#EF4444" },
  { name: "Roxo", hex: "#8B5CF6" },
  { name: "Rosa", hex: "#EC4899" },
  { name: "Ciano", hex: "#06B6D4" },
  { name: "Dark", hex: "#2B2D31" },
];

/* =========================================================================
   PARSER E RENDERIZADOR DE MARKDOWN DISCORD
   ========================================================================= */

function DiscordSpoiler({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className={cn(
        "rounded px-1 py-0.5 cursor-pointer select-none transition-all duration-150 inline font-mono text-[12px]",
        revealed
          ? "bg-[#2b2d31] text-[#dbdee1]"
          : "bg-[#202225] text-transparent hover:bg-[#25272b]"
      )}
      title={revealed ? "Clique para esconder" : "Clique para revelar spoiler"}
    >
      {children}
    </span>
  );
}

function parseDiscordMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  // Quebra em linhas preservando estrutura
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      result.push(<br key={`br-${lineIdx}`} />);
    }

    // Header 1
    if (line.startsWith("# ")) {
      result.push(
        <h1 key={`h1-${lineIdx}`} className="text-base sm:text-lg font-black text-white my-1">
          {renderInlineTokens(line.slice(2), lineIdx)}
        </h1>
      );
      return;
    }
    // Header 2
    if (line.startsWith("## ")) {
      result.push(
        <h2 key={`h2-${lineIdx}`} className="text-sm sm:text-base font-bold text-white my-0.5">
          {renderInlineTokens(line.slice(3), lineIdx)}
        </h2>
      );
      return;
    }
    // Header 3
    if (line.startsWith("### ")) {
      result.push(
        <h3 key={`h3-${lineIdx}`} className="text-xs sm:text-sm font-bold text-white my-0.5">
          {renderInlineTokens(line.slice(4), lineIdx)}
        </h3>
      );
      return;
    }
    // Blockquote
    if (line.startsWith("> ") || line.startsWith(">>> ")) {
      const qText = line.startsWith(">>> ") ? line.slice(4) : line.slice(2);
      result.push(
        <div
          key={`quote-${lineIdx}`}
          className="border-l-4 border-[#4e5058] pl-2.5 my-1 text-[#dbdee1] italic"
        >
          {renderInlineTokens(qText, lineIdx)}
        </div>
      );
      return;
    }

    // Linha normal
    result.push(
      <span key={`line-${lineIdx}`} className="leading-relaxed">
        {renderInlineTokens(line, lineIdx)}
      </span>
    );
  });

  return result;
}

function renderInlineTokens(lineText: string, keyPrefix: number | string): React.ReactNode[] {
  if (!lineText) return [];

  // Expressão regular ampla para tokens comuns de Discord
  // 1: code block inline: `code`
  // 2: spoiler: ||spoiler||
  // 3: bold italic: ***text***
  // 4: bold: **text**
  // 5: underline: __text__
  // 6: strikethrough: ~~text~~
  // 7: italic: *text* ou _text_
  // 8: mention: @everyone, @here, <@id>, <#id>, <@&id>
  // 9: markdown link: [text](url)
  // 10: raw url: https?://...
  const tokenRegex =
    /(`[^`]+`)|(\|\|.+?\|\|)|(\*\*\*.+?\*\*\*)|(\*\*.+?\*\*)|(__.+?__)|(~~.+?~~)|(\*[^*]+?\*)|(_[^_]+?_)|(@everyone|@here|<@[!&]?\d+>|<#\d+>)|(\[[^\]]+\]\([^)]+\))|(https?:\/\/[^\s]+)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(lineText)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(lineText.slice(lastIndex, match.index));
    }

    const token = match[0];
    const k = `${keyPrefix}-${match.index}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      // Inline Code
      nodes.push(
        <code
          key={k}
          className="bg-[#2b2d31] text-[#e0e1e5] px-1.5 py-0.5 rounded font-mono text-[11px] border border-[#383a40]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("||") && token.endsWith("||")) {
      // Spoiler
      nodes.push(<DiscordSpoiler key={k}>{token.slice(2, -2)}</DiscordSpoiler>);
    } else if (token.startsWith("***") && token.endsWith("***")) {
      // Bold Italic
      nodes.push(
        <strong key={k} className="font-bold italic text-white">
          {token.slice(3, -3)}
        </strong>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      // Bold
      nodes.push(
        <strong key={k} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("__") && token.endsWith("__")) {
      // Underline
      nodes.push(
        <u key={k} className="underline text-white">
          {token.slice(2, -2)}
        </u>
      );
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      // Strikethrough
      nodes.push(
        <del key={k} className="line-through text-[#949ba4]">
          {token.slice(2, -2)}
        </del>
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      // Italic
      nodes.push(
        <em key={k} className="italic text-[#f2f3f5]">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token === "@everyone" || token === "@here" || token.startsWith("<@") || token.startsWith("<#")) {
      // Mentions
      nodes.push(
        <span
          key={k}
          className="bg-[#5865F2]/25 hover:bg-[#5865F2]/40 text-[#c9cdfb] font-semibold px-1 py-0.5 rounded transition-colors inline-flex items-center gap-0.5 text-[12px]"
        >
          {token}
        </span>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      // Markdown Link [text](url)
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        nodes.push(
          <a
            key={k}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00a8fc] hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    } else if (token.startsWith("http")) {
      // Raw URL
      nodes.push(
        <a
          key={k}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00a8fc] hover:underline break-all"
        >
          {token}
        </a>
      );
    } else {
      nodes.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < lineText.length) {
    nodes.push(lineText.slice(lastIndex));
  }

  return nodes;
}

/* =========================================================================
   COMPONENTE PRINCIPAL: MODAL DE ENVIO DE MENSAGEM
   ========================================================================= */

export interface DevBotSendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  botToken: string;
  botName: string;
  botAvatarUrl?: string;
  guilds: BotGuildInfo[];
  senderName?: string;
  onSuccess?: () => void;
}

export function DevBotSendMessageModal({
  isOpen,
  onClose,
  botToken,
  botName,
  botAvatarUrl,
  guilds,
  senderName,
  onSuccess,
}: DevBotSendMessageModalProps) {
  // Servidor e Canal Selecionados
  const [selectedGuildId, setSelectedGuildId] = useState<string>("");
  const [channels, setChannels] = useState<DiscordChannelInfo[]>([]);
  const [loadingChannels, setLoadingChannels] = useState<boolean>(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [manualChannelId, setManualChannelId] = useState<string>("");
  const [isManualChannel, setIsManualChannel] = useState<boolean>(false);

  // Modo de Envio: "normal" (apenas texto) ou "embed" (embed rica)
  const [messageMode, setMessageMode] = useState<"normal" | "embed">("normal");

  // Conteúdo da Mensagem (Content / Texto simples)
  const [content, setContent] = useState<string>("");

  // Estado do Embed Personalizado
  const [embedTitle, setEmbedTitle] = useState<string>("");
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const [embedDescription, setEmbedDescription] = useState<string>("");
  const [embedColor, setEmbedColor] = useState<string>("#5865F2");
  const [embedAuthorName, setEmbedAuthorName] = useState<string>("");
  const [embedAuthorIcon, setEmbedAuthorIcon] = useState<string>("");
  const [embedAuthorUrl, setEmbedAuthorUrl] = useState<string>("");
  const [embedThumbnailUrl, setEmbedThumbnailUrl] = useState<string>("");
  const [embedImageUrl, setEmbedImageUrl] = useState<string>("");
  const [embedFooterText, setEmbedFooterText] = useState<string>("");
  const [embedFooterIcon, setEmbedFooterIcon] = useState<string>("");
  const [embedIncludeTimestamp, setEmbedIncludeTimestamp] = useState<boolean>(true);

  // Campos do Embed (Fields)
  const [embedFields, setEmbedFields] = useState<
    Array<{ id: string; name: string; value: string; inline: boolean }>
  >([]);

  // Sub-abas do Embed Customizer
  const [embedSubTab, setEmbedSubTab] = useState<"geral" | "fields" | "author" | "footer">("geral");

  // Visualização no mobile: Editor vs Prévia
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  // Estado de envio
  const [isSending, setIsSending] = useState(false);

  // Referência do textarea em foco para inserção rápida de formatação
  const contentInputRef = useRef<HTMLTextAreaElement | null>(null);
  const descInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeInput, setActiveInput] = useState<"content" | "desc">("content");

  // Inicializa servidor padrão ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      if (!selectedGuildId && guilds.length > 0) {
        const main = guilds.find((g) => g.isMain) || guilds[0];
        setSelectedGuildId(main.id);
      }
    }
  }, [isOpen, guilds, selectedGuildId]);

  // Busca canais quando o servidor muda
  useEffect(() => {
    if (!selectedGuildId || !botToken) return;

    let isMounted = true;
    setLoadingChannels(true);

    fetchGuildChannels(botToken, selectedGuildId)
      .then((data) => {
        if (!isMounted) return;
        setChannels(data);

        // Seleciona automaticamente o primeiro canal de texto válido
        const textCh = data.filter((c) => c.type === 0 || c.type === 5);
        if (textCh.length > 0 && !selectedChannelId) {
          setSelectedChannelId(textCh[0].id);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingChannels(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGuildId, botToken]);

  // Função para inserir formatação markdown no textarea ativo
  const insertFormatting = (prefix: string, suffix: string = prefix, placeholder: string = "texto") => {
    const targetRef = activeInput === "desc" ? descInputRef : contentInputRef;
    const setter = activeInput === "desc" ? setEmbedDescription : setContent;
    const currentVal = activeInput === "desc" ? embedDescription : content;

    const textarea = targetRef.current;
    if (!textarea) {
      setter((prev) => `${prev} ${prefix}${placeholder}${suffix} `);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentVal.substring(start, end) || placeholder;

    const before = currentVal.substring(0, start);
    const after = currentVal.substring(end);
    const newVal = `${before}${prefix}${selected}${suffix}${after}`;

    setter(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 50);
  };

  // Gerenciamento de Fields do Embed
  const handleAddField = () => {
    if (embedFields.length >= 25) {
      toast.error("O Discord permite no máximo 25 campos por Embed.");
      return;
    }
    setEmbedFields((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: `Campo #${prev.length + 1}`,
        value: "Valor do campo",
        inline: true,
      },
    ]);
  };

  const handleUpdateField = (
    id: string,
    updates: Partial<{ name: string; value: string; inline: boolean }>
  ) => {
    setEmbedFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleRemoveField = (id: string) => {
    setEmbedFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Enviar Mensagem
  const handleSend = async () => {
    const finalChannelId = isManualChannel
      ? manualChannelId.trim()
      : selectedChannelId.trim();

    if (!finalChannelId) {
      toast.error("Selecione ou informe um canal de destino.");
      return;
    }

    if (messageMode === "normal" && !content.trim()) {
      toast.error("Digite o conteúdo da mensagem normal.");
      return;
    }

    if (
      messageMode === "embed" &&
      !embedTitle.trim() &&
      !embedDescription.trim() &&
      embedFields.length === 0 &&
      !embedImageUrl.trim()
    ) {
      toast.error("Preencha ao menos um título, descrição, campo ou imagem no Embed.");
      return;
    }

    setIsSending(true);
    try {
      const embedPayload: DiscordEmbedData | undefined =
        messageMode === "embed"
          ? {
              title: embedTitle.trim() || undefined,
              url: embedUrl.trim() || undefined,
              description: embedDescription.trim() || undefined,
              color: embedColor,
              author: embedAuthorName.trim()
                ? {
                    name: embedAuthorName.trim(),
                    icon_url: embedAuthorIcon.trim() || undefined,
                    url: embedAuthorUrl.trim() || undefined,
                  }
                : undefined,
              thumbnail: embedThumbnailUrl.trim()
                ? { url: embedThumbnailUrl.trim() }
                : undefined,
              image: embedImageUrl.trim()
                ? { url: embedImageUrl.trim() }
                : undefined,
              footer: embedFooterText.trim()
                ? {
                    text: embedFooterText.trim(),
                    icon_url: embedFooterIcon.trim() || undefined,
                  }
                : undefined,
              timestamp: embedIncludeTimestamp,
              fields: embedFields.map((f) => ({
                name: f.name.trim() || "Campo",
                value: f.value.trim() || "-",
                inline: Boolean(f.inline),
              })),
            }
          : undefined;

      const res = await sendBotDiscordMessage({
        token: botToken,
        channelId: finalChannelId,
        content: content.trim() || undefined,
        embed: embedPayload,
        senderName: senderName || "CEO",
      });

      if (res.success) {
        toast.success(res.message || "Mensagem enviada com sucesso no Discord!");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.message || "Falha ao enviar mensagem no Discord.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro desconhecido ao enviar mensagem.");
    } finally {
      setIsSending(false);
    }
  };

  // Filtra canais de texto
  const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);
  const categories = channels.filter((c) => c.type === 4);

  // Nome do canal selecionado para a prévia
  const currentChannelObj = channels.find((c) => c.id === selectedChannelId);
  const currentChannelName = isManualChannel
    ? manualChannelId || "canal-manual"
    : currentChannelObj?.name || "geral";

  const selectedGuildObj = guilds.find((g) => g.id === selectedGuildId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[92vh] max-h-[950px] p-0 flex flex-col bg-zinc-950 border-zinc-800 text-foreground overflow-hidden rounded-2xl shadow-2xl">
        {/* CABEÇALHO DO MODAL */}
        <DialogHeader className="p-4 sm:px-6 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 shadow-xs">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-white">
                  <span>Enviar Mensagem pelo Bot</span>
                  <Badge className="bg-[#5865F2] text-white text-[10px] font-black uppercase px-1.5 py-0.5">
                    {botName || "Twin Wheels Bot"}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Escolha o servidor, canal de destino, personalize mensagens normais ou embeds ricas com formatação em tempo real.
                </DialogDescription>
              </div>
            </div>

            {/* Alternador Mobile (Editor / Prévia) */}
            <div className="flex sm:hidden">
              <Tabs
                value={mobileTab}
                onValueChange={(v) => setMobileTab(v as any)}
                className="h-8"
              >
                <TabsList className="h-8 bg-zinc-900 p-0.5 border border-zinc-800">
                  <TabsTrigger value="editor" className="text-xs font-bold h-7 px-2.5">
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs font-bold h-7 px-2.5">
                    Prévia
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </DialogHeader>

        {/* CORPO DO MODAL EM 2 COLUNAS (FORMULÁRIO À ESQUERDA + PRÉVIA DISCORD À DIREITA) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* COLUNA ESQUERDA: CONFIGURAÇÕES E FORMULÁRIO (LG: 7 COLUNAS) */}
          <div
            className={cn(
              "lg:col-span-7 flex flex-col min-h-0 border-r border-zinc-800/80 bg-zinc-950/70 overflow-y-auto",
              mobileTab === "preview" ? "hidden lg:flex" : "flex"
            )}
          >
            <div className="p-4 sm:p-5 space-y-5">
              {/* 1. SELEÇÃO DE SERVIDOR E CANAL */}
              <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/70">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#949ba4] flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-[#5865F2]" /> Destino no Discord
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsManualChannel(!isManualChannel)}
                    className="text-[11px] text-[#5865F2] hover:underline font-bold cursor-pointer"
                  >
                    {isManualChannel ? "Selecionar da lista" : "Digitar ID manual"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Select do Servidor */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-300">Servidor (Guild)</Label>
                    <Select
                      value={selectedGuildId}
                      onValueChange={(val) => {
                        setSelectedGuildId(val);
                        setSelectedChannelId("");
                      }}
                    >
                      <SelectTrigger className="h-9 bg-zinc-900 border-zinc-800 text-xs font-medium">
                        <SelectValue placeholder="Selecione o servidor..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                        {guilds.map((g) => (
                          <SelectItem key={g.id} value={g.id} className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              {g.iconUrl ? (
                                <img
                                  src={g.iconUrl}
                                  alt={g.name}
                                  className="h-4 w-4 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <Server className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                              <span className="font-bold truncate">{g.name}</span>
                              {g.isMain && (
                                <Badge className="bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/30 text-[9px] py-0 px-1 font-extrabold ml-auto">
                                  Principal
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Select do Canal de Texto */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                      <span>Canal de Texto</span>
                      {loadingChannels && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                          <Loader2 className="h-3 w-3 animate-spin text-[#5865F2]" /> Carregando canais...
                        </span>
                      )}
                    </Label>

                    {isManualChannel ? (
                      <Input
                        value={manualChannelId}
                        onChange={(e) => setManualChannelId(e.target.value)}
                        placeholder="ID do canal (ex: 1535505650920984628)"
                        className="h-9 bg-zinc-900 border-zinc-800 text-xs font-mono"
                      />
                    ) : (
                      <Select
                        value={selectedChannelId}
                        onValueChange={setSelectedChannelId}
                        disabled={loadingChannels || textChannels.length === 0}
                      >
                        <SelectTrigger className="h-9 bg-zinc-900 border-zinc-800 text-xs font-medium">
                          <SelectValue
                            placeholder={
                              loadingChannels
                                ? "Carregando canais..."
                                : textChannels.length === 0
                                ? "Nenhum canal encontrado"
                                : "Selecione o canal..."
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs max-h-60">
                          {textChannels.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                              <div className="flex items-center gap-2">
                                {c.type === 5 ? (
                                  <Megaphone className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                ) : (
                                  <Hash className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                )}
                                <span className="font-mono text-xs">{c.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. TIPO DE MENSAGEM (NORMAL VS EMBED) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#949ba4]">
                    Modo de Formatação
                  </span>
                  <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setMessageMode("normal")}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                        messageMode === "normal"
                          ? "bg-[#5865F2] text-white shadow-xs"
                          : "text-muted-foreground hover:text-white"
                      )}
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>Mensagem Normal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageMode("embed")}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                        messageMode === "embed"
                          ? "bg-[#5865F2] text-white shadow-xs"
                          : "text-muted-foreground hover:text-white"
                      )}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Embed Rica</span>
                    </button>
                  </div>
                </div>

                {/* BARRA DE FERRAMENTAS MARKDOWN RÁPIDO DO DISCORD */}
                <div className="flex items-center gap-1 flex-wrap p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <span className="text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-wider">
                    Formatos:
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting("**", "**", "negrito")}
                    className="h-7 w-7 p-0 text-xs font-black text-zinc-300 hover:text-white hover:bg-zinc-800"
                    title="Negrito (**texto**)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting("*", "*", "itálico")}
                    className="h-7 w-7 p-0 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800"
                    title="Itálico (*texto*)"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting("__", "__", "sublinhado")}
                    className="h-7 w-7 p-0 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800"
                    title="Sublinhado (__texto__)"
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting("~~", "~~", "tachado")}
                    className="h-7 w-7 p-0 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800"
                    title="Tachado (~~texto~~)"
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting("`", "`", "código")}
                    className="h-7 w-7 p-0 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 font-mono"
                    title="Código em linha (`código`)"
                  >
                    <Code className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting("```\n", "\n```", "bloco de código")}
                    className="h-7 px-1.5 text-[10px] font-mono text-zinc-300 hover:text-white hover:bg-zinc-800"
                    title="Bloco de código (```código```)"
                  >
                    {"{ }"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting("> ", "", "citação")}
                    className="h-7 w-7 p-0 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800"
                    title="Citação (> citação)"
                  >
                    <Quote className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting("||", "||", "spoiler")}
                    className="h-7 px-1.5 text-[10px] font-bold text-zinc-300 hover:text-white hover:bg-zinc-800"
                    title="Spoiler (||spoiler||)"
                  >
                    <EyeOff className="h-3.5 w-3.5 mr-0.5" /> Spoiler
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting("@everyone ", "", "")}
                    className="h-7 px-1.5 text-[10px] font-bold text-[#c9cdfb] bg-[#5865F2]/15 hover:bg-[#5865F2]/30 ml-auto"
                    title="Marcar @everyone"
                  >
                    @everyone
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting("@here ", "", "")}
                    className="h-7 px-1.5 text-[10px] font-bold text-[#c9cdfb] bg-[#5865F2]/15 hover:bg-[#5865F2]/30"
                    title="Marcar @here"
                  >
                    @here
                  </Button>
                </div>

                {/* CAMPO DE CONTEÚDO (MENSAGEM SIMPLES OU TEXTO ACIMA DO EMBED) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-300">
                      {messageMode === "normal"
                        ? "Mensagem de Texto"
                        : "Texto Introdutório (Opcional - fora do Embed)"}
                    </Label>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {content.length}/2000
                    </span>
                  </div>
                  <Textarea
                    ref={contentInputRef}
                    value={content}
                    onFocus={() => setActiveInput("content")}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                      messageMode === "normal"
                        ? "Digite a mensagem do bot... Dica: use os botões da barra acima para formatar!"
                        : "Ex: @everyone Atenção membros, novo comunicado oficial disponível abaixo!"
                    }
                    rows={messageMode === "normal" ? 6 : 2}
                    maxLength={2000}
                    className="bg-zinc-900/90 border-zinc-800 text-xs resize-y rounded-xl focus:border-[#5865F2]/60 font-sans"
                  />
                </div>

                {/* SEÇÃO DO EMBED PERSONALIZADO */}
                {messageMode === "embed" && (
                  <div className="space-y-4 pt-2 border-t border-zinc-800/80 animate-in fade-in-50">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#949ba4] flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5 text-[#5865F2]" /> Customizador de Embed
                      </span>
                    </div>

                    <Tabs
                      value={embedSubTab}
                      onValueChange={(v) => setEmbedSubTab(v as any)}
                      className="w-full space-y-3"
                    >
                      <TabsList className="grid grid-cols-4 bg-zinc-900 border border-zinc-800 h-8 p-0.5">
                        <TabsTrigger value="geral" className="text-xs font-bold h-7">
                          Geral & Cor
                        </TabsTrigger>
                        <TabsTrigger value="fields" className="text-xs font-bold h-7">
                          Campos ({embedFields.length})
                        </TabsTrigger>
                        <TabsTrigger value="author" className="text-xs font-bold h-7">
                          Autor & Mídia
                        </TabsTrigger>
                        <TabsTrigger value="footer" className="text-xs font-bold h-7">
                          Rodapé
                        </TabsTrigger>
                      </TabsList>

                      {/* SUB-ABA 1: GERAL & COR */}
                      <TabsContent value="geral" className="space-y-3.5 m-0 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-zinc-300">Título do Embed</Label>
                            <Input
                              value={embedTitle}
                              onChange={(e) => setEmbedTitle(e.target.value)}
                              placeholder="Ex: 📢 Comunicado Oficial da Liderança"
                              className="h-8 bg-zinc-900 border-zinc-800 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-zinc-300">Link do Título (URL)</Label>
                            <Input
                              value={embedUrl}
                              onChange={(e) => setEmbedUrl(e.target.value)}
                              placeholder="https://exemplo.com"
                              className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                            />
                          </div>
                        </div>

                        {/* Cor da Borda Lateral */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                            <span>Cor da Borda Lateral</span>
                            <span className="font-mono text-[10px] text-muted-foreground uppercase">
                              {embedColor}
                            </span>
                          </Label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {COLOR_PRESETS.map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => setEmbedColor(c.hex)}
                                className={cn(
                                  "h-6 px-2 rounded-md text-[10px] font-bold transition-all border flex items-center gap-1 cursor-pointer",
                                  embedColor.toLowerCase() === c.hex.toLowerCase()
                                    ? "ring-2 ring-white border-white scale-105"
                                    : "border-transparent opacity-85 hover:opacity-100"
                                )}
                                style={{ backgroundColor: `${c.hex}25`, color: c.hex }}
                              >
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span>{c.name}</span>
                              </button>
                            ))}
                            {/* Color Picker Nativo */}
                            <div className="flex items-center gap-1.5 ml-auto">
                              <input
                                type="color"
                                value={embedColor}
                                onChange={(e) => setEmbedColor(e.target.value)}
                                className="h-6 w-7 rounded cursor-pointer bg-transparent border-0"
                                title="Cor personalizada"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Descrição do Embed */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-zinc-300">
                              Descrição Principal
                            </Label>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {embedDescription.length}/4096
                            </span>
                          </div>
                          <Textarea
                            ref={descInputRef}
                            value={embedDescription}
                            onFocus={() => setActiveInput("desc")}
                            onChange={(e) => setEmbedDescription(e.target.value)}
                            placeholder="Digite o texto explicativo do embed... Suporta markdown completo do Discord."
                            rows={4}
                            maxLength={4096}
                            className="bg-zinc-900 border-zinc-800 text-xs resize-y rounded-xl"
                          />
                        </div>
                      </TabsContent>

                      {/* SUB-ABA 2: CAMPOS (FIELDS) */}
                      <TabsContent value="fields" className="space-y-3 m-0 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Campos organizados em grade ou linhas completas.
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddField}
                            className="h-7 text-xs font-bold gap-1 bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" /> Adicionar Campo
                          </Button>
                        </div>

                        {embedFields.length === 0 ? (
                          <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center space-y-1.5 bg-zinc-900/30">
                            <p className="text-xs text-zinc-400">Nenhum campo adicionado ainda.</p>
                            <p className="text-[10px] text-muted-foreground">
                              Clique no botão acima para adicionar pares de Título e Valor (ex: Regra, Cargo, Preço).
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {embedFields.map((field, idx) => (
                              <div
                                key={field.id}
                                className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-2 relative group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase font-mono">
                                    Campo #{idx + 1}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={field.inline}
                                        onChange={(e) =>
                                          handleUpdateField(field.id, { inline: e.target.checked })
                                        }
                                        className="rounded border-zinc-700 text-[#5865F2] focus:ring-0"
                                      />
                                      <span>Inline (lado a lado)</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveField(field.id)}
                                      className="text-zinc-500 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                                      title="Remover campo"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <Input
                                    value={field.name}
                                    onChange={(e) =>
                                      handleUpdateField(field.id, { name: e.target.value })
                                    }
                                    placeholder="Nome do campo"
                                    className="h-7 bg-zinc-950 border-zinc-800 text-xs font-bold"
                                  />
                                  <Input
                                    value={field.value}
                                    onChange={(e) =>
                                      handleUpdateField(field.id, { value: e.target.value })
                                    }
                                    placeholder="Valor do campo"
                                    className="h-7 bg-zinc-950 border-zinc-800 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      {/* SUB-ABA 3: AUTOR & MÍDIA */}
                      <TabsContent value="author" className="space-y-3.5 m-0 pt-1">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-zinc-300">Cabeçalho do Autor</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Input
                              value={embedAuthorName}
                              onChange={(e) => setEmbedAuthorName(e.target.value)}
                              placeholder="Nome do autor (ex: Twin Wheels)"
                              className="h-8 bg-zinc-900 border-zinc-800 text-xs"
                            />
                            <Input
                              value={embedAuthorIcon}
                              onChange={(e) => setEmbedAuthorIcon(e.target.value)}
                              placeholder="URL do ícone do autor"
                              className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                            />
                            <Input
                              value={embedAuthorUrl}
                              onChange={(e) => setEmbedAuthorUrl(e.target.value)}
                              placeholder="Link do autor (URL)"
                              className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-zinc-300">Mídias do Embed</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[11px] text-muted-foreground block">
                                Thumbnail (miniatura canto superior direito)
                              </span>
                              <Input
                                value={embedThumbnailUrl}
                                onChange={(e) => setEmbedThumbnailUrl(e.target.value)}
                                placeholder="https://... (URL de imagem)"
                                className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[11px] text-muted-foreground block">
                                Imagem Grande (banner principal)
                              </span>
                              <Input
                                value={embedImageUrl}
                                onChange={(e) => setEmbedImageUrl(e.target.value)}
                                placeholder="https://... (URL de banner/foto)"
                                className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* SUB-ABA 4: RODAPÉ */}
                      <TabsContent value="footer" className="space-y-3.5 m-0 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-zinc-300">Texto do Rodapé</Label>
                            <Input
                              value={embedFooterText}
                              onChange={(e) => setEmbedFooterText(e.target.value)}
                              placeholder="Ex: Twin Wheels Management • Todos os direitos reservados"
                              className="h-8 bg-zinc-900 border-zinc-800 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-zinc-300">URL do Ícone do Rodapé</Label>
                            <Input
                              value={embedFooterIcon}
                              onChange={(e) => setEmbedFooterIcon(e.target.value)}
                              placeholder="https://... (URL ícone)"
                              className="h-8 bg-zinc-900 border-zinc-800 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                          <div>
                            <p className="text-xs font-bold text-zinc-200">Incluir Data e Hora (Timestamp)</p>
                            <p className="text-[11px] text-muted-foreground">
                              Adiciona a data/hora do envio automaticamente ao lado do rodapé.
                            </p>
                          </div>
                          <Switch
                            checked={embedIncludeTimestamp}
                            onCheckedChange={setEmbedIncludeTimestamp}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: PRÉVIA FIEL EM TEMPO REAL ESTILO DISCORD (LG: 5 COLUNAS) */}
          <div
            className={cn(
              "lg:col-span-5 flex flex-col min-h-0 bg-[#2b2d31]/40 overflow-y-auto p-4 sm:p-5",
              mobileTab === "editor" ? "hidden lg:flex" : "flex"
            )}
          >
            <div className="space-y-3 sticky top-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#949ba4] flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-[#5865F2]" /> Prévia Discord ao Vivo
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  #{currentChannelName}
                </span>
              </div>

              {/* CARD DE VISUALIZAÇÃO DISCORD OFICIAL */}
              <div className="rounded-xl bg-[#313338] border border-[#232428] p-4 text-[#dbdee1] shadow-2xl font-sans text-xs space-y-2 selection:bg-[#5865F2]/40">
                {/* Header da Mensagem (Avatar + Nome + Badge APP + Horário) */}
                <div className="flex items-start gap-3">
                  {botAvatarUrl ? (
                    <img
                      src={botAvatarUrl}
                      alt={botName}
                      className="h-10 w-10 rounded-full object-cover shrink-0 select-none shadow-sm cursor-pointer"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#5865F2] text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {botName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                      <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
                        {botName}
                      </span>
                      <span className="inline-flex items-center px-1 py-0.2 rounded text-[9.5px] font-black uppercase tracking-wider bg-[#5865F2] text-white select-none">
                        APP
                      </span>
                      <span className="text-[11px] text-[#949ba4] font-medium ml-1">
                        Hoje às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Conteúdo de Texto Simples */}
                    {content.trim() && (
                      <div className="text-sm text-[#dbdee1] pt-0.5 break-words">
                        {parseDiscordMarkdown(content)}
                      </div>
                    )}

                    {/* Embed Discord */}
                    {messageMode === "embed" && (
                      <div
                        className="rounded-[4px] p-3.5 sm:p-4 bg-[#2b2d31] space-y-2.5 max-w-[500px] border-l-4 shadow-sm mt-2 transition-all"
                        style={{ borderLeftColor: embedColor }}
                      >
                        {/* Autor do Embed */}
                        {embedAuthorName.trim() && (
                          <div className="flex items-center gap-2">
                            {embedAuthorIcon.trim() && (
                              <img
                                src={embedAuthorIcon.trim()}
                                alt="Author icon"
                                className="h-5 w-5 rounded-full object-cover shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            )}
                            {embedAuthorUrl.trim() ? (
                              <a
                                href={embedAuthorUrl.trim()}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-white hover:underline truncate"
                              >
                                {embedAuthorName}
                              </a>
                            ) : (
                              <span className="text-xs font-bold text-white truncate">
                                {embedAuthorName}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Título & Thumbnail em Flex */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 min-w-0 flex-1">
                            {embedTitle.trim() && (
                              <div>
                                {embedUrl.trim() ? (
                                  <a
                                    href={embedUrl.trim()}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-sm sm:text-base text-[#00a8fc] hover:underline block leading-snug break-words"
                                  >
                                    {embedTitle}
                                  </a>
                                ) : (
                                  <h4 className="font-bold text-sm sm:text-base text-white block leading-snug break-words">
                                    {embedTitle}
                                  </h4>
                                )}
                              </div>
                            )}

                            {/* Descrição do Embed */}
                            {embedDescription.trim() && (
                              <div className="text-xs sm:text-[13px] text-[#dbdee1] leading-relaxed break-words">
                                {parseDiscordMarkdown(embedDescription)}
                              </div>
                            )}
                          </div>

                          {/* Thumbnail */}
                          {embedThumbnailUrl.trim() && (
                            <img
                              src={embedThumbnailUrl.trim()}
                              alt="Thumbnail"
                              className="h-16 w-16 sm:h-20 sm:w-20 rounded object-cover shrink-0 ring-1 ring-black/40 shadow-sm"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          )}
                        </div>

                        {/* Campos (Fields) */}
                        {embedFields.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {embedFields.map((f) => (
                              <div
                                key={f.id}
                                className={cn(
                                  "space-y-0.5",
                                  f.inline ? "col-span-1" : "sm:col-span-2"
                                )}
                              >
                                <p className="font-bold text-xs text-[#f2f3f5] truncate">
                                  {f.name || "Campo"}
                                </p>
                                <p className="text-xs text-[#dbdee1] leading-snug break-words">
                                  {parseDiscordMarkdown(f.value || "-")}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Imagem Grande */}
                        {embedImageUrl.trim() && (
                          <div className="pt-1">
                            <img
                              src={embedImageUrl.trim()}
                              alt="Embed media"
                              className="max-h-64 w-full rounded-[4px] object-cover ring-1 ring-black/30"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        {/* Rodapé e Timestamp */}
                        {(embedFooterText.trim() || embedIncludeTimestamp) && (
                          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#949ba4]">
                            {embedFooterIcon.trim() && (
                              <img
                                src={embedFooterIcon.trim()}
                                alt="Footer icon"
                                className="h-4 w-4 rounded-full object-cover shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            )}
                            <span className="truncate">{embedFooterText || botName}</span>
                            {embedIncludeTimestamp && (
                              <>
                                <span>•</span>
                                <span>Hoje às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ DO DIÁLOGO (AÇÕES) */}
        <DialogFooter className="p-3.5 sm:px-6 border-t border-zinc-800 bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <span>Destino:</span>
            <Badge variant="outline" className="bg-zinc-950 font-mono text-[10px]">
              {selectedGuildObj?.name || "Servidor"} • #{currentChannelName}
            </Badge>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 bg-zinc-900 border-zinc-800 text-xs font-bold hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={
                isSending ||
                (!selectedChannelId && !manualChannelId) ||
                (messageMode === "normal" && !content.trim()) ||
                (messageMode === "embed" &&
                  !embedTitle.trim() &&
                  !embedDescription.trim() &&
                  embedFields.length === 0)
              }
              onClick={handleSend}
              className="h-9 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-extrabold gap-2 px-4 shadow-lg shadow-[#5865F2]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Mensagem no Discord
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
