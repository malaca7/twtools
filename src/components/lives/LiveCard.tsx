import React from "react";
import {
  ExternalLink,
  Play,
  Radio,
  Eye,
  Clock,
  Gamepad2,
  Tv,
  Square,
  Sparkles,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  STREAM_PLATFORMS,
  type StreamSession,
  type StreamPlatform,
} from "@/types/lives";
import { cn } from "@/lib/utils";

interface LiveCardProps {
  session: StreamSession;
  onWatchModal?: (session: StreamSession) => void;
  onEndLive?: (sessionId: string) => void;
  canManage?: boolean;
}

export function LiveCard({
  session,
  onWatchModal,
  onEndLive,
  canManage = false,
}: LiveCardProps) {
  const platformMeta = STREAM_PLATFORMS[session.platform] || STREAM_PLATFORMS.twitch;

  // Formatação do tempo decorrido ou data de início
  const getElapsedTimeString = () => {
    try {
      const start = new Date(session.started_at).getTime();
      const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
      const diffMs = Math.max(0, end - start);
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const remMinutes = diffMinutes % 60;

      if (session.is_live) {
        if (diffHours > 0) return `Ao vivo há ${diffHours}h ${remMinutes}m`;
        if (diffMinutes > 0) return `Ao vivo há ${diffMinutes}m`;
        return "Iniciou agora mesmo";
      } else {
        if (diffHours > 0) return `Duração: ${diffHours}h ${remMinutes}m`;
        return `Duração: ${diffMinutes}m`;
      }
    } catch {
      return "";
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard) {
        navigator.clipboard.writeText(session.stream_url);
        toast.success("Link da live copiado para a área de transferência!");
      }
    } catch {
      toast.info("Link da live: " + session.stream_url);
    }
  };

  // Thumbnail fallback
  const defaultThumb = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60";
  const thumbnail = session.thumbnail_url || defaultThumb;

  return (
    <Card className={cn(
      "group overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl flex flex-col bg-card/90 backdrop-blur-md",
      session.is_live
        ? "border-rose-500/40 hover:border-rose-500/80 hover:shadow-rose-500/10"
        : "border-border/60 hover:border-border opacity-90 hover:opacity-100"
    )}>
      {/* THUMBNAIL COM OVERLAYS E BADGES */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/60">
        <img
          src={thumbnail}
          alt={session.title || session.streamer_name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultThumb;
          }}
        />

        {/* Gradiente escuro para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/50" />

        {/* TOP BAR: BADGE AO VIVO & PLATAFORMA */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
          {session.is_live ? (
            <Badge className="bg-rose-600/90 text-white font-black text-[11px] px-2.5 py-0.5 shadow-md flex items-center gap-1.5 border border-rose-400/40">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              <span>AO VIVO</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-black/60 text-muted-foreground font-mono text-[10px] px-2 py-0.5 border border-white/10">
              GRAVADA / OFFLINE
            </Badge>
          )}

          {/* BADGE DA PLATAFORMA */}
          <Badge
            variant="outline"
            className={cn(
              "font-extrabold text-[10px] tracking-wide uppercase px-2 py-0.5 shadow-xs flex items-center gap-1.5 backdrop-blur-md",
              platformMeta.badgeBg,
              platformMeta.badgeColor,
              platformMeta.borderColor
            )}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: platformMeta.brandHex }}
            />
            {platformMeta.name}
          </Badge>
        </div>

        {/* BOTTOM OVERLAY: ESPECTADORES E TEMPO */}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs text-white z-10">
          {session.is_live ? (
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[11px] font-mono font-bold text-rose-300">
              <Eye className="h-3.5 w-3.5 text-rose-400" />
              <span>{session.viewer_count || 1} espectadores</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[10px] font-mono text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{getElapsedTimeString()}</span>
            </div>
          )}

          {session.is_live && (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[10px] font-mono text-zinc-300">
              <Radio className="h-3 w-3 text-rose-400 animate-pulse" />
              <span>{getElapsedTimeString()}</span>
            </div>
          )}
        </div>

        {/* HOVER ACTION BUTTONS NO CARD */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
          {onWatchModal && (
            <Button
              size="sm"
              className="h-9 px-3.5 rounded-xl font-bold bg-white text-black hover:bg-white/90 gap-1.5 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onWatchModal(session);
              }}
            >
              <Tv className="h-4 w-4 text-primary" />
              Player Interno
            </Button>
          )}

          <a
            href={session.stream_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              className={cn(
                "h-9 px-3.5 rounded-xl font-bold text-white shadow-lg gap-1.5",
                session.is_live
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-secondary hover:bg-secondary/80 text-foreground"
              )}
            >
              <ExternalLink className="h-4 w-4" />
              {platformMeta.name}
            </Button>
          </a>
        </div>
      </div>

      {/* DETALHES DO STREAMER E DA TRANSMISSÃO */}
      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* PERFIL DO STREAMER */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-9 w-9 border border-border shadow-xs shrink-0">
                <AvatarImage src={session.streamer_avatar || undefined} alt={session.streamer_name} />
                <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                  {session.streamer_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">
                    {session.streamer_name}
                  </h4>
                  {session.is_live && (
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono truncate">
                  @{session.channel_name}
                </p>
              </div>
            </div>

            {/* BOTÃO COMPARTILHAR */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg shrink-0"
              onClick={handleShare}
              title="Copiar link da live"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* TÍTULO DA LIVE */}
          <h3
            className="text-xs font-semibold text-foreground/90 line-clamp-2 leading-snug group-hover:text-foreground transition-colors"
            title={session.title || undefined}
          >
            {session.title || "Transmissão ao vivo de GTA RP"}
          </h3>
        </div>

        {/* CATEGORIA E METADADOS DO JOGO */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-muted-foreground truncate">
            <Gamepad2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate font-medium">
              {session.category || "Grand Theft Auto V"}
            </span>
          </div>

          {canManage && session.is_live && onEndLive && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onEndLive(session.id);
              }}
            >
              <Square className="h-2.5 w-2.5 mr-1" />
              Finalizar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
