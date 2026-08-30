import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Image,
  Video,
  FileText,
  Music,
  Link2,
  Download,
  ExternalLink,
  ArrowRight,
  FolderArchive,
} from "lucide-react";
import { formatTimeOnly, dateOnly } from "@/lib/format";
import type { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMediaGalleryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  conversationTitle?: string;
  onSelectMessage: (messageId: string) => void;
}

export function ChatMediaGalleryDrawer({
  open,
  onOpenChange,
  messages,
  conversationTitle,
  onSelectMessage,
}: ChatMediaGalleryDrawerProps) {
  const [activeTab, setActiveTab] = useState<"images" | "videos" | "documents" | "audio" | "links">("images");

  // Filtra itens compartilhados na conversa
  const images = useMemo(
    () => messages.filter((m) => m.message_type === "image" && m.attachment_url && !m.is_deleted),
    [messages]
  );

  const videos = useMemo(
    () => messages.filter((m) => m.message_type === "video" && m.attachment_url && !m.is_deleted),
    [messages]
  );

  const documents = useMemo(
    () =>
      messages.filter(
        (m) =>
          (m.message_type === "document" || (!["image", "video", "audio"].includes(m.message_type) && m.attachment_url)) &&
          m.attachment_url &&
          !m.is_deleted
      ),
    [messages]
  );

  const audios = useMemo(
    () => messages.filter((m) => m.message_type === "audio" && m.attachment_url && !m.is_deleted),
    [messages]
  );

  // Extrai links de mensagens de texto
  const links = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const list: Array<{ message: ChatMessage; url: string }> = [];
    messages.forEach((m) => {
      if (m.content && !m.is_deleted) {
        const matches = m.content.match(urlRegex);
        if (matches) {
          matches.forEach((u) => list.push({ message: m, url: u }));
        }
      }
    });
    return list;
  }, [messages]);

  const handleJump = (messageId: string) => {
    onOpenChange(false);
    onSelectMessage(messageId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <FolderArchive className="h-4 w-4 text-primary" />
            Central de Mídia & Arquivos
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            {conversationTitle ? `Arquivos compartilhados em "${conversationTitle}"` : "Arquivos e links compartilhados"}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* ABAS DE CATEGORIAS */}
          <div className="px-3 pt-2 border-b border-border/40 bg-secondary/20">
            <TabsList className="grid grid-cols-5 h-9 bg-secondary/80 rounded-xl p-0.5">
              <TabsTrigger value="images" className="text-xs font-bold gap-1 rounded-lg">
                <Image className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fotos</span> ({images.length})
              </TabsTrigger>
              <TabsTrigger value="videos" className="text-xs font-bold gap-1 rounded-lg">
                <Video className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Vídeos</span> ({videos.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs font-bold gap-1 rounded-lg">
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Docs</span> ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="audio" className="text-xs font-bold gap-1 rounded-lg">
                <Music className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Áudios</span> ({audios.length})
              </TabsTrigger>
              <TabsTrigger value="links" className="text-xs font-bold gap-1 rounded-lg">
                <Link2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Links</span> ({links.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* CONTEÚDO: FOTOS */}
          <TabsContent value="images" className="flex-1 overflow-y-auto p-3 m-0 max-h-[60vh]">
            {images.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Nenhuma foto compartilhada.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleJump(m.id)}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-secondary border border-border/60 cursor-pointer shadow-xs"
                  >
                    <img src={m.attachment_url!} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 text-white">
                      <span className="text-[9px] font-mono">{formatTimeOnly(m.created_at)}</span>
                      <span className="text-[10px] font-bold truncate">{m.sender_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CONTEÚDO: VÍDEOS */}
          <TabsContent value="videos" className="flex-1 overflow-y-auto p-3 m-0 max-h-[60vh]">
            {videos.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Nenhum vídeo compartilhado.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {videos.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleJump(m.id)}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-black/90 border border-border/60 cursor-pointer flex items-center justify-center"
                  >
                    <video src={m.attachment_url!} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Video className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CONTEÚDO: DOCUMENTOS */}
          <TabsContent value="documents" className="flex-1 overflow-y-auto p-3 m-0 space-y-2 max-h-[60vh]">
            {documents.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Nenhum documento compartilhado.</div>
            ) : (
              documents.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleJump(m.id)}
                  className="p-2.5 rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{m.attachment_name || "Documento"}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {m.sender_name} • {dateOnly(m.created_at)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={m.attachment_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary flex items-center justify-center shrink-0"
                    title="Baixar arquivo"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))
            )}
          </TabsContent>

          {/* CONTEÚDO: ÁUDIOS */}
          <TabsContent value="audio" className="flex-1 overflow-y-auto p-3 m-0 space-y-2 max-h-[60vh]">
            {audios.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Nenhum áudio compartilhado.</div>
            ) : (
              audios.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleJump(m.id)}
                  className="p-3 rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary flex flex-col gap-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{m.sender_name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{dateOnly(m.created_at)}</span>
                  </div>
                  <audio
                    src={m.attachment_url!}
                    controls
                    className="w-full h-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))
            )}
          </TabsContent>

          {/* CONTEÚDO: LINKS */}
          <TabsContent value="links" className="flex-1 overflow-y-auto p-3 m-0 space-y-2 max-h-[60vh]">
            {links.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">Nenhum link encontrado.</div>
            ) : (
              links.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleJump(item.message.id)}
                  className="p-2.5 rounded-xl border border-border/60 bg-secondary/30 hover:bg-secondary flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-primary truncate hover:underline">{item.url}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {item.message.sender_name} • {dateOnly(item.message.created_at)}
                      </p>
                    </div>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-7 w-7 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary flex items-center justify-center shrink-0"
                    title="Abrir link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
