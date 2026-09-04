import React, { useState, useEffect, useMemo } from "react";
import {
  ExternalLink,
  Globe,
  Play,
  Image as ImageIcon,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface LinkMetadata {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
  favicon?: string | null;
  type?: "youtube" | "image" | "video" | "generic";
  videoId?: string | null;
}

// In-memory cache for fetched metadata across re-renders
const metadataCache = new Map<string, LinkMetadata>();

export const URL_REGEX =
  /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[^\s<]+[^<.,:;"')\]\s])/gi;

export function extractFirstUrl(text: string): string | null {
  if (!text) return null;
  const match = text.match(URL_REGEX);
  if (!match || match.length === 0) return null;
  let url = match[0];
  if (url.startsWith("www.")) {
    url = `https://${url}`;
  }
  return url;
}

export function extractAllUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(URL_REGEX) || [];
  return matches.map((u) => (u.startsWith("www.") ? `https://${u}` : u));
}

// YouTube URL parser
function parseYouTubeUrl(url: string): { isYouTube: boolean; videoId: string | null } {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([\w-]{11})/i
  );
  if (match && match[1]) {
    return { isYouTube: true, videoId: match[1] };
  }
  return { isYouTube: false, videoId: null };
}

// Direct Image URL parser
function isDirectImageUrl(url: string): boolean {
  return /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(url);
}

// Direct Video URL parser
function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

// Helper to get clean hostname
export function getHostname(url: string): string {
  try {
    const full = url.startsWith("http") ? url : `https://${url}`;
    const u = new URL(full);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface LinkPreviewCardProps {
  url: string;
  className?: string;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url, className }) => {
  const normalizedUrl = useMemo(() => {
    return url.startsWith("http") ? url : `https://${url}`;
  }, [url]);

  const [metadata, setMetadata] = useState<LinkMetadata | null>(() => {
    return metadataCache.get(normalizedUrl) || null;
  });
  const [loading, setLoading] = useState<boolean>(() => !metadataCache.has(normalizedUrl));
  const [imageError, setImageError] = useState(false);

  const hostname = useMemo(() => getHostname(normalizedUrl), [normalizedUrl]);

  useEffect(() => {
    let isMounted = true;

    // Check cache
    if (metadataCache.has(normalizedUrl)) {
      setMetadata(metadataCache.get(normalizedUrl)!);
      setLoading(false);
      return;
    }

    // 1. YouTube instant client-side resolution
    const yt = parseYouTubeUrl(normalizedUrl);
    if (yt.isYouTube && yt.videoId) {
      const ytData: LinkMetadata = {
        url: normalizedUrl,
        title: "Vídeo do YouTube",
        description: `Assistir no YouTube (${hostname})`,
        image: `https://img.youtube.com/vi/${yt.videoId}/hqdefault.jpg`,
        siteName: "YouTube",
        favicon: "https://www.youtube.com/s/desktop/favicon.ico",
        type: "youtube",
        videoId: yt.videoId,
      };

      // Try fetching title via oEmbed
      fetch(`https://noembed.com/embed?url=${encodeURIComponent(normalizedUrl)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.title && isMounted) {
            ytData.title = data.title;
            ytData.description = data.author_name ? `Canal: ${data.author_name}` : ytData.description;
          }
          metadataCache.set(normalizedUrl, ytData);
          if (isMounted) {
            setMetadata({ ...ytData });
            setLoading(false);
          }
        })
        .catch(() => {
          metadataCache.set(normalizedUrl, ytData);
          if (isMounted) {
            setMetadata(ytData);
            setLoading(false);
          }
        });

      return;
    }

    // 2. Direct Image instant client-side resolution
    if (isDirectImageUrl(normalizedUrl)) {
      const imgData: LinkMetadata = {
        url: normalizedUrl,
        title: hostname,
        description: "Imagem direta da web",
        image: normalizedUrl,
        siteName: hostname,
        type: "image",
      };
      metadataCache.set(normalizedUrl, imgData);
      setMetadata(imgData);
      setLoading(false);
      return;
    }

    // 3. Generic Open Graph fetcher via Microlink public API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    fetch(`https://api.microlink.io?url=${encodeURIComponent(normalizedUrl)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        clearTimeout(timeout);
        if (!isMounted) return;

        if (json?.status === "success" && json.data) {
          const d = json.data;
          const meta: LinkMetadata = {
            url: normalizedUrl,
            title: d.title || hostname,
            description: d.description || null,
            image: d.image?.url || null,
            siteName: d.publisher || hostname,
            favicon: d.logo?.url || `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
            type: "generic",
          };
          metadataCache.set(normalizedUrl, meta);
          setMetadata(meta);
        } else {
          // Fallback minimal metadata
          const fallback: LinkMetadata = {
            url: normalizedUrl,
            title: hostname,
            description: "Clique para abrir o link em uma nova guia.",
            siteName: hostname,
            favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
            type: "generic",
          };
          metadataCache.set(normalizedUrl, fallback);
          setMetadata(fallback);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const fallback: LinkMetadata = {
          url: normalizedUrl,
          title: hostname,
          description: "Clique para abrir o link em uma nova guia.",
          siteName: hostname,
          favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
          type: "generic",
        };
        metadataCache.set(normalizedUrl, fallback);
        setMetadata(fallback);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [normalizedUrl, hostname]);

  if (loading && !metadata) {
    return (
      <div className={cn("mt-1.5 p-2 rounded-xl bg-black/30 border border-white/10 flex items-center gap-2 text-xs text-[#8696a0]", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00a884]" />
        <span className="truncate">Carregando prévia de {hostname}...</span>
      </div>
    );
  }

  if (!metadata) return null;

  const displayImage = metadata.image && !imageError ? metadata.image : null;

  return (
    <a
      href={normalizedUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "mt-1.5 block rounded-xl overflow-hidden bg-[#111b21]/90 hover:bg-[#182229] border border-white/10 hover:border-[#00a884]/40 transition-all duration-200 group/preview shadow-md max-w-full select-none",
        className
      )}
    >
      {/* THUMBNAIL / MEDIA COVER */}
      {displayImage && (
        <div className="relative w-full h-36 bg-black/50 overflow-hidden flex items-center justify-center">
          <img
            src={displayImage}
            alt={metadata.title || "Preview"}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-300"
          />
          {metadata.type === "youtube" && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/preview:bg-black/20 transition-colors">
              <div className="h-11 w-11 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform group-hover/preview:scale-110 transition-transform">
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white/80 backdrop-blur-md opacity-0 group-hover/preview:opacity-100 transition-opacity">
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      )}

      {/* METADATA CONTENT */}
      <div className="p-2.5 space-y-1">
        {/* DOMAIN & PROVIDER */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#8696a0] font-medium">
          {metadata.favicon ? (
            <img
              src={metadata.favicon}
              alt=""
              className="h-3.5 w-3.5 rounded-sm object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <Globe className="h-3 w-3 text-[#00a884]" />
          )}
          <span className="truncate font-semibold uppercase tracking-wider text-[#00a884]">
            {metadata.siteName || hostname}
          </span>
          <span className="opacity-40">•</span>
          <span className="truncate font-mono text-[9px] text-[#8696a0] lowercase">
            {hostname}
          </span>
        </div>

        {/* TITLE */}
        {metadata.title && (
          <h5 className="text-[12.5px] font-bold text-[#e9edef] line-clamp-2 leading-snug group-hover/preview:text-white transition-colors">
            {metadata.title}
          </h5>
        )}

        {/* DESCRIPTION */}
        {metadata.description && (
          <p className="text-[11px] text-[#8696a0] line-clamp-2 leading-relaxed font-sans">
            {metadata.description}
          </p>
        )}
      </div>
    </a>
  );
};
