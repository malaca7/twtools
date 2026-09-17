import React from "react";
import {
  ExternalLink,
  Radio,
  Eye,
  Tv,
  X,
  Maximize2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  STREAM_PLATFORMS,
  type StreamSession,
} from "@/types/lives";
import { cn } from "@/lib/utils";

interface LiveStreamPlayerModalProps {
  session: StreamSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LiveStreamPlayerModal({
  session,
  open,
  onOpenChange,
}: LiveStreamPlayerModalProps) {
  if (!session) return null;

  const platformMeta = STREAM_PLATFORMS[session.platform] || STREAM_PLATFORMS.twitch;
  const currentHostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

  // Gerador de URL do player embutido por plataforma
  const getEmbedUrl = () => {
    switch (session.platform) {
      case "twitch":
        return `https://player.twitch.tv/?channel=${encodeURIComponent(
          session.channel_name
        )}&parent=${currentHostname}&parent=localhost&muted=false`;

      case "kick":
        return `https://player.kick.com/${encodeURIComponent(session.channel_name)}`;

      case "youtube":
        if (session.external_stream_id) {
          return `https://www.youtube.com/embed/${encodeURIComponent(
            session.external_stream_id
          )}?autoplay=1`;
        }
        return null;

      case "tiktok":
      default:
        return null;
    }
  };

  const embedUrl = getEmbedUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-border/80 bg-black/95 text-white rounded-2xl shadow-2xl">
        {/* HEADER DO PLAYER */}
        <div className="p-4 border-b border-white/10 bg-zinc-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 border border-white/20 shadow-xs shrink-0">
              <AvatarImage src={session.streamer_avatar || undefined} alt={session.streamer_name} />
              <AvatarFallback className="font-bold text-xs bg-primary/20 text-primary">
                {session.streamer_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white truncate">
                  {session.streamer_name}
                </span>
                {session.is_live && (
                  <Badge className="bg-rose-600 text-white font-mono text-[10px] py-0 px-2 flex items-center gap-1 border border-rose-400/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    AO VIVO
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-mono font-bold uppercase py-0",
                    platformMeta.badgeBg,
                    platformMeta.badgeColor,
                    platformMeta.borderColor
                  )}
                >
                  {platformMeta.name}
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {session.title || "Transmissão da Twin Wheels"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {session.is_live && (
              <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-white/10 text-xs text-rose-300 font-mono font-bold">
                <Eye className="h-3.5 w-3.5 text-rose-400" />
                <span>{session.viewer_count || 1}</span>
              </div>
            )}

            <a
              href={session.stream_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-bold gap-1.5 border-white/20 hover:bg-white/10 text-white"
              >
                Abrir na {platformMeta.name}
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>

        {/* ÁREA DO PLAYER DE VÍDEO */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${session.streamer_name} Live Stream`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="p-8 text-center space-y-4 max-w-md mx-auto">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-primary">
                <Tv className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Player Externo Recomendado</h3>
                <p className="text-xs text-zinc-400">
                  O {platformMeta.name} restringe players embutidos externos para este canal. Você pode assistir diretamente na plataforma oficial.
                </p>
              </div>
              <a
                href={session.stream_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="h-10 px-6 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-2 shadow-lg">
                  Assistir Agora na {platformMeta.name}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* RODAPÉ COM INFORMAÇÕES DA LIVE */}
        <div className="p-3 bg-zinc-950 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono text-[11px] text-zinc-500">Jogo/Categoria:</span>
            <span className="font-bold text-zinc-300 truncate">
              {session.category || "Grand Theft Auto V"}
            </span>
          </div>

          <span className="font-mono text-[11px] text-zinc-500">
            Canal: @{session.channel_name}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
