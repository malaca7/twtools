export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  twitch?: string;
  youtube?: string;
  discord?: string;
}

export interface ProfilePost {
  id: string;
  author_id: string;
  content: string;
  media_url?: string | null;
  tags: string[];
  mentions: string[];
  likes_count: number;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    nome: string;
    nickname?: string | null;
    avatar_url?: string | null;
    custom_url?: string | null;
    discord_username?: string | null;
  };
  is_liked_by_me?: boolean;
}

export interface ProfileFollowStats {
  followers_count: number;
  following_count: number;
  is_following: boolean;
  notify_posts: boolean;
}

export interface BannerPreset {
  id: string;
  name: string;
  description: string;
  gradient: string;
  accent: string;
}

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: "tw_classic",
    name: "Twin Wheels Original",
    description: "Preto acetinado com verde esmeralda e acentos de carbono",
    gradient: "from-emerald-950 via-zinc-950 to-neutral-950",
    accent: "#10b981",
  },
  {
    id: "neon_cyber",
    name: "Cyberpunk Neon",
    description: "Violeta elétrico e ciano futurista",
    gradient: "from-purple-950 via-zinc-950 to-cyan-950",
    accent: "#8b5cf6",
  },
  {
    id: "blood_syndicate",
    name: "Crimson Syndicate",
    description: "Vermelho carmesim de combate urbano e grupo tática",
    gradient: "from-rose-950 via-zinc-950 to-red-950",
    accent: "#f43f5e",
  },
  {
    id: "cartel_gold",
    name: "Golden Luxury Cartel",
    description: "Ouro nobre 24k com grafite luxuoso",
    gradient: "from-amber-950 via-zinc-950 to-yellow-950",
    accent: "#f59e0b",
  },
  {
    id: "midnight_patrol",
    name: "Midnight Drift",
    description: "Azul noturno das pistas de Los Santos",
    gradient: "from-sky-950 via-slate-950 to-indigo-950",
    accent: "#0ea5e9",
  },
  {
    id: "acid_toxic",
    name: "Toxic Matrix",
    description: "Verde neon tóxico de alta voltagem",
    gradient: "from-lime-950 via-zinc-950 to-emerald-950",
    accent: "#84cc16",
  },
  {
    id: "stealth_blackout",
    name: "OLED Blackout",
    description: "Preto absoluto com textura minimalista de fibra",
    gradient: "from-zinc-950 via-black to-neutral-950",
    accent: "#71717a",
  },
  {
    id: "sunset_vice",
    name: "Vice City Sunset",
    description: "Rosa magenta e pôr do sol retrô anos 80",
    gradient: "from-fuchsia-950 via-zinc-950 to-rose-950",
    accent: "#d946ef",
  },
];
