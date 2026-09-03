import React, { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, Mic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AudioMessagePlayerProps {
  src: string;
  isSelf: boolean;
  senderAvatar?: string | null;
  senderName?: string;
  duration?: number | null;
}

export function AudioMessagePlayer({
  src,
  isSelf,
  senderAvatar,
  senderName,
  duration: initialDuration,
}: AudioMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [hasPlayed, setHasPlayed] = useState(false);

  // Gera 28 barras de onda sonoras consistentes a partir da URL/áudio
  const waveformBars = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < src.length; i++) {
      hash = (hash << 5) - hash + src.charCodeAt(i);
      hash |= 0;
    }
    const bars: number[] = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
      const val = Math.abs(Math.sin(hash + i * 1.7) * 0.75 + Math.cos(i * 0.9) * 0.25);
      const heightPercent = Math.max(20, Math.min(100, Math.round(val * 100)));
      bars.push(heightPercent);
    }
    return bars;
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setHasPlayed(true);
      void audio.play();
      setIsPlaying(true);
    }
  };

  const handleSpeedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const speeds: Array<1 | 1.5 | 2> = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (index: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const targetProgress = index / (waveformBars.length - 1);
    const targetTime = targetProgress * duration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTimer = (sec: number) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const currentBarIndex = Math.floor(progress * waveformBars.length);

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[240px] sm:min-w-[280px] max-w-sm select-none">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* AVATAR COM ÍCONE DE MICROFONE WHATSAPP */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10 border border-white/10 shadow-xs">
          {senderAvatar && <AvatarImage src={senderAvatar} alt={senderName || "Áudio"} />}
          <AvatarFallback className={cn("text-xs font-bold", isSelf ? "bg-emerald-700 text-white" : "bg-zinc-700 text-white")}>
            {(senderName || "M").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center border-2 border-[#202c33] shadow-xs",
            hasPlayed ? "bg-[#53bdeb] text-white" : "bg-[#00a884] text-white"
          )}
          title={hasPlayed ? "Áudio reproduzido" : "Áudio não ouvido"}
        >
          <Mic className="h-2.5 w-2.5" />
        </span>
      </div>

      {/* BOTÃO PLAY / PAUSE WHATSAPP GREEN */}
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md active:scale-95",
          isSelf
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-[#00a884] hover:bg-[#00a884]/90 text-white"
        )}
        title={isPlaying ? "Pausar" : "Tocar áudio"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </button>

      {/* WAVEFORM BARS & CONTADORES */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* WAVEFORM BARS INTERATIVAS */}
        <div className="flex items-center gap-[3px] h-7 cursor-pointer group py-1" title="Clique para avançar/retroceder">
          {waveformBars.map((heightPercent, idx) => {
            const isPlayed = idx <= currentBarIndex;
            return (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeek(idx);
                }}
                className="flex-1 flex items-center h-full group/bar py-0.5"
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={cn(
                    "w-full rounded-full transition-all duration-100",
                    isPlayed
                      ? isSelf
                        ? "bg-white"
                        : hasPlayed
                        ? "bg-[#53bdeb]"
                        : "bg-[#00a884]"
                      : isSelf
                      ? "bg-white/30 hover:bg-white/50"
                      : "bg-[#8696a0]/40 hover:bg-[#8696a0]/70"
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* TEMPO & BOTÃO DE VELOCIDADE (1x / 1.5x / 2x) */}
        <div className="flex items-center justify-between text-[10px] font-mono leading-none">
          <span className={cn(isSelf ? "text-white/80" : "text-[#8696a0]")}>
            {isPlaying || currentTime > 0 ? formatTimer(currentTime) : formatTimer(duration)}
          </span>

          <button
            type="button"
            onClick={handleSpeedToggle}
            className={cn(
              "px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono transition-colors cursor-pointer",
              isSelf
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-white/10 hover:bg-white/20 text-[#00a884]"
            )}
            title="Alterar velocidade de reprodução"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
