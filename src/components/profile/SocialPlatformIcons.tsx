import React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SocialLinks } from "@/types/profileFeed";

export type SocialPlatformKey = keyof SocialLinks;

export interface SocialPlatformDefinition {
  id: SocialPlatformKey;
  name: string;
  prefix: string;
  placeholder: string;
  domainUrl: string;
  brandHex: string;
  brandBg: string;
  hoverGlow: string;
  badgeBorder: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  formatUrl: (raw: string) => string;
}

export const SOCIAL_PLATFORMS: Record<SocialPlatformKey, SocialPlatformDefinition> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    prefix: "@",
    placeholder: "seu.usuario",
    domainUrl: "https://instagram.com/",
    brandHex: "#E4405F",
    brandBg: "hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#bc1888] hover:to-[#285AEB] hover:text-white",
    hoverGlow: "hover:shadow-[0_0_22px_rgba(225,48,108,0.5)] hover:border-[#E4405F]/80",
    badgeBorder: "border-[#E4405F]/40",
    formatUrl: (val) => {
      const clean = val.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "");
      return `https://instagram.com/${clean}`;
    },
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },

  twitter: {
    id: "twitter",
    name: "X / Twitter",
    prefix: "@",
    placeholder: "seu_usuario",
    domainUrl: "https://x.com/",
    brandHex: "#FFFFFF",
    brandBg: "hover:bg-white hover:text-black",
    hoverGlow: "hover:shadow-[0_0_22px_rgba(255,255,255,0.45)] hover:border-white/90",
    badgeBorder: "border-white/30",
    formatUrl: (val) => {
      const clean = val.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\//i, "");
      return `https://x.com/${clean}`;
    },
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },

  tiktok: {
    id: "tiktok",
    name: "TikTok",
    prefix: "@",
    placeholder: "seu_perfil",
    domainUrl: "https://tiktok.com/@",
    brandHex: "#00F2FE",
    brandBg: "hover:bg-[#010101] hover:text-[#00F2FE]",
    hoverGlow: "hover:shadow-[0_0_22px_rgba(0,242,254,0.5)] hover:border-[#00F2FE]/80",
    badgeBorder: "border-[#00F2FE]/40",
    formatUrl: (val) => {
      const clean = val.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?tiktok\.com\/@?/i, "");
      return `https://tiktok.com/@${clean}`;
    },
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.89-4.49V8.87a8.28 8.28 0 0 0 4.88 1.58V7a4.84 4.84 0 0 1-1-.31z" />
      </svg>
    ),
  },

  twitch: {
    id: "twitch",
    name: "Twitch",
    prefix: "twitch.tv/",
    placeholder: "nome_do_canal",
    domainUrl: "https://twitch.tv/",
    brandHex: "#9146FF",
    brandBg: "hover:bg-[#9146FF] hover:text-white",
    hoverGlow: "hover:shadow-[0_0_22px_rgba(145,70,255,0.5)] hover:border-[#9146FF]/80",
    badgeBorder: "border-[#9146FF]/40",
    formatUrl: (val) => {
      const clean = val.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?twitch\.tv\//i, "");
      return `https://twitch.tv/${clean}`;
    },
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
      </svg>
    ),
  },

  youtube: {
    id: "youtube",
    name: "YouTube",
    prefix: "@",
    placeholder: "@CanalOuUrl",
    domainUrl: "https://youtube.com/@",
    brandHex: "#FF0000",
    brandBg: "hover:bg-[#FF0000] hover:text-white",
    hoverGlow: "hover:shadow-[0_0_22px_rgba(255,0,0,0.5)] hover:border-[#FF0000]/80",
    badgeBorder: "border-[#FF0000]/40",
    formatUrl: (val) => {
      const clean = val.trim();
      if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
      const handle = clean.replace(/^@/, "");
      return `https://youtube.com/@${handle}`;
    },
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },

  kick: {
    id: "kick",
    name: "Kick",
    prefix: "kick.com/",
    placeholder: "streamer",
    domainUrl: "https://kick.com/",
    brandHex: "#53FC18",
    brandBg: "hover:bg-[#53FC18] hover:text-black",
    hoverGlow: "hover:shadow-[0_0_22px_rgba(83,252,24,0.55)] hover:border-[#53FC18]/90",
    badgeBorder: "border-[#53FC18]/40",
    formatUrl: (val) => {
      const clean = val.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?kick\.com\//i, "");
      return `https://kick.com/${clean}`;
    },
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 2h5.5v7.2L14.7 2H21l-7.7 8.5L21 22h-6.2l-6.3-7.7V22H3V2z" />
      </svg>
    ),
  },

  discord: {
    id: "discord",
    name: "Discord",
    prefix: "",
    placeholder: "tag_ou_servidor",
    domainUrl: "https://discord.gg/",
    brandHex: "#5865F2",
    brandBg: "hover:bg-[#5865F2] hover:text-white",
    hoverGlow: "hover:shadow-[0_0_22px_rgba(88,101,242,0.5)] hover:border-[#5865F2]/80",
    badgeBorder: "border-[#5865F2]/40",
    formatUrl: (val) => {
      const clean = val.trim();
      if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
      if (clean.includes("discord.gg/")) return `https://${clean}`;
      // Se for número (ID), cria link de perfil
      if (/^\d{17,20}$/.test(clean)) return `https://discord.com/users/${clean}`;
      return `https://discord.com/users/${clean}`;
    },
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },

  steam: {
    id: "steam",
    name: "Steam",
    prefix: "steam/",
    placeholder: "id_ou_custom",
    domainUrl: "https://steamcommunity.com/id/",
    brandHex: "#66C0F4",
    brandBg: "hover:bg-[#171a21] hover:text-[#66c0f4]",
    hoverGlow: "hover:shadow-[0_0_22px_rgba(102,192,244,0.5)] hover:border-[#66C0F4]/80",
    badgeBorder: "border-[#66C0F4]/40",
    formatUrl: (val) => {
      const clean = val.trim();
      if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
      if (/^\d{17}$/.test(clean)) return `https://steamcommunity.com/profiles/${clean}`;
      return `https://steamcommunity.com/id/${clean}`;
    },
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.155-3.331-2.677L.251 14.73c1.077 5.253 5.707 9.27 11.728 9.27 6.627 0 12-5.373 12-12s-5.373-12-12-12zm-3.615 15.65c0-.986.8-1.786 1.786-1.786.985 0 1.786.8 1.786 1.786 0 .985-.801 1.786-1.786 1.786-.986 0-1.786-.801-1.786-1.786zm8.01-6.739c0-1.664-1.35-3.014-3.015-3.014-1.665 0-3.015 1.35-3.015 3.014 0 1.666 1.35 3.015 3.015 3.015 1.665 0 3.015-1.349 3.015-3.015z" />
      </svg>
    ),
  },

  spotify: {
    id: "spotify",
    name: "Spotify",
    prefix: "user/",
    placeholder: "usuario_spotify",
    domainUrl: "https://open.spotify.com/user/",
    brandHex: "#1ED760",
    brandBg: "hover:bg-[#1ED760] hover:text-black",
    hoverGlow: "hover:shadow-[0_0_22px_rgba(30,215,96,0.55)] hover:border-[#1ED760]/90",
    badgeBorder: "border-[#1ED760]/40",
    formatUrl: (val) => {
      const clean = val.trim();
      if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
      return `https://open.spotify.com/user/${clean}`;
    },
    icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
  },
};

export interface SocialPlatformButtonProps {
  platform: SocialPlatformKey;
  value: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Botão ultra elegante contendo APENAS o ícone oficial da rede social,
 * com efeitos de glow, glassmorphism, tooltip moderno e transição suave.
 */
export function SocialPlatformButton({
  platform,
  value,
  size = "md",
  className,
}: SocialPlatformButtonProps) {
  const meta = SOCIAL_PLATFORMS[platform];
  if (!meta || !value?.trim()) return null;

  const url = meta.formatUrl(value);
  const IconComponent = meta.icon;

  const sizeStyles = {
    sm: "h-8 w-8 rounded-xl",
    iconSm: "h-4 w-4",
    md: "h-10 w-10 rounded-2xl",
    iconMd: "h-4.5 w-4.5",
    lg: "h-12 w-12 rounded-2xl",
    iconLg: "h-6 w-6",
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={meta.name}
            className={cn(
              "group relative inline-flex items-center justify-center border border-white/10 bg-secondary/40 text-foreground/80 backdrop-blur-md transition-all duration-300 shadow-sm cursor-pointer",
              "hover:scale-110 hover:-translate-y-0.5 active:scale-95 active:translate-y-0",
              meta.brandBg,
              meta.hoverGlow,
              size === "sm" && sizeStyles.sm,
              size === "md" && sizeStyles.md,
              size === "lg" && sizeStyles.lg,
              className
            )}
          >
            <IconComponent
              className={cn(
                "transition-transform duration-300 group-hover:scale-110",
                size === "sm" && sizeStyles.iconSm,
                size === "md" && sizeStyles.iconMd,
                size === "lg" && sizeStyles.iconLg
              )}
            />
          </a>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-popover/95 backdrop-blur-md border border-border/80 text-xs px-2.5 py-1 font-semibold shadow-xl">
          <div className="flex items-center gap-1.5">
            <span style={{ color: meta.brandHex }}>●</span>
            <span className="font-bold text-foreground">{meta.name}</span>
            <span className="text-muted-foreground font-mono text-[10px] truncate max-w-[140px]">
              {value.startsWith("http") ? "" : `(${value})`}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Lista horizontal com botões elegantes apenas de ícones das redes sociais vinculadas
 */
export function SocialPlatformsList({
  socialLinks,
  size = "md",
  className,
}: {
  socialLinks?: SocialLinks | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!socialLinks) return null;

  const validPlatforms = (Object.keys(SOCIAL_PLATFORMS) as SocialPlatformKey[]).filter(
    (k) => Boolean(socialLinks[k]?.trim())
  );

  if (validPlatforms.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {validPlatforms.map((platform) => (
        <SocialPlatformButton
          key={platform}
          platform={platform}
          value={socialLinks[platform]!}
          size={size}
        />
      ))}
    </div>
  );
}
