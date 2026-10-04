import React, { useId } from "react";
import * as LucideIcons from "lucide-react";
import { Award, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  InsigniaRarity,
  InsigniaShape3D,
  InsigniaMaterial3D,
  InsigniaBorderStyle3D,
  InsigniaGlossEffect,
  InsigniaItem,
} from "@/services/gamificationService";

// ============================================================================
// 1. ÍNDICE DE ÍCONES LUCIDE E EMOJIS COM TOLERÂNCIA TOTAL
// ============================================================================
const LUCIDE_INDEX = new Map<string, React.ElementType>();

for (const key of Object.keys(LucideIcons)) {
  const item = (LucideIcons as any)[key];
  if (
    (typeof item === "function" || (typeof item === "object" && item !== null)) &&
    key !== "createLucideIcon" &&
    key !== "Icon" &&
    key !== "LucideIcon"
  ) {
    LUCIDE_INDEX.set(key, item);
    LUCIDE_INDEX.set(key.toLowerCase(), item);
    LUCIDE_INDEX.set(key.toLowerCase().replace(/[-_]/g, ""), item);
  }
}

function isEmojiString(str?: string | null): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  const emojiRegex = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u200d)+$/u;
  return emojiRegex.test(trimmed) || (trimmed.length <= 4 && /[\u{1F300}-\u{1FAD6}]/u.test(trimmed));
}

export function getInsigniaIconComponent(iconName?: string | null): React.ElementType {
  if (!iconName) return Award;
  const trimmed = iconName.trim();
  if (!trimmed) return Award;

  if (LUCIDE_INDEX.has(trimmed)) {
    return LUCIDE_INDEX.get(trimmed)!;
  }
  const lower = trimmed.toLowerCase();
  if (LUCIDE_INDEX.has(lower)) {
    return LUCIDE_INDEX.get(lower)!;
  }
  const clean = lower.replace(/[-_]/g, "");
  if (LUCIDE_INDEX.has(clean)) {
    return LUCIDE_INDEX.get(clean)!;
  }
  return Award;
}

export interface DynamicInsigniaIconProps {
  name?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export function DynamicInsigniaIcon({ name, className = "w-5 h-5", style }: DynamicInsigniaIconProps) {
  if (isEmojiString(name)) {
    return (
      <span
        className={className}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }}
        role="img"
        aria-label="insignia-icon"
      >
        {name}
      </span>
    );
  }

  const IconComp = getInsigniaIconComponent(name);
  return <IconComp className={className} style={style} />;
}

export function renderInsigniaIcon(iconName?: string | null, className = "h-4 w-4", style?: React.CSSProperties) {
  return <DynamicInsigniaIcon name={iconName} className={className} style={style} />;
}

// ============================================================================
// 2. GEOMETRIAS SVG 3D REALISTAS (ROSETA VERIFIED, MEDALHA, ESCUDO, ETC.)
// ============================================================================

// Roseta 16 pontas suavizadas (idêntica ao selo Verified 3D de alta qualidade)
function generateRosettePath(cx = 50, cy = 50, rOuter = 48, rInner = 41.5, points = 16): string {
  const step = (Math.PI * 2) / points;
  let d = "";
  for (let i = 0; i < points; i++) {
    const angle1 = i * step - step / 2;
    const anglePeak = i * step;
    const angle2 = i * step + step / 2;

    const x1 = cx + rInner * Math.cos(angle1);
    const y1 = cy + rInner * Math.sin(angle1);

    const xp = cx + rOuter * Math.cos(anglePeak);
    const yp = cy + rOuter * Math.sin(anglePeak);

    const x2 = cx + rInner * Math.cos(angle2);
    const y2 = cy + rInner * Math.sin(angle2);

    const cp1x = cx + rOuter * 1.02 * Math.cos(angle1 + step * 0.25);
    const cp1y = cy + rOuter * 1.02 * Math.sin(angle1 + step * 0.25);
    const cp2x = cx + rOuter * 1.02 * Math.cos(angle2 - step * 0.25);
    const cp2y = cy + rOuter * 1.02 * Math.sin(angle2 - step * 0.25);

    if (i === 0) {
      d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    }
    d += `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${x2.toFixed(2)} ${y2.toFixed(2)} `;
  }
  d += "Z";
  return d;
}

export const SHAPE_PATHS: Record<InsigniaShape3D, { path: string; crescentPath?: string }> = {
  // 1. Roseta Verified 3D Oficial
  rosette: {
    path: generateRosettePath(50, 50, 48, 41.5, 16),
    crescentPath: "M 14 46 C 14 20 30 10 50 10 C 70 10 86 20 86 46 C 72 40 28 40 14 46 Z",
  },
  // 2. Medalha Circular
  medal: {
    path: "M 50 3 A 47 47 0 1 0 50 97 A 47 47 0 1 0 50 3 Z",
    crescentPath: "M 10 48 C 10 24 28 8 50 8 C 72 8 90 24 90 48 C 75 42 25 42 10 48 Z",
  },
  // 3. Escudo Nobre Faction Shield
  shield: {
    path: "M 50 3 C 78 3 94 8 94 30 C 94 67 68 90 50 97 C 32 90 6 67 6 30 C 6 8 22 3 50 3 Z",
    crescentPath: "M 12 30 C 12 14 28 8 50 8 C 72 8 88 14 88 30 C 70 42 30 42 12 30 Z",
  },
  // 4. Diamante Lapidado
  diamond: {
    path: "M 50 3 L 95 50 L 50 97 L 5 50 Z",
    crescentPath: "M 14 42 L 50 10 L 86 42 C 68 36 32 36 14 42 Z",
  },
  // 5. Hexágono Tático
  hexagon: {
    path: "M 50 4 L 92 27 L 92 73 L 50 96 L 8 73 L 8 27 Z",
    crescentPath: "M 14 30 L 50 10 L 86 30 C 70 42 30 42 14 30 Z",
  },
  // 6. Octógono Imperial
  octagon: {
    path: "M 33 4 L 67 4 L 96 33 L 96 67 L 67 96 L 33 96 L 4 67 L 4 33 Z",
    crescentPath: "M 10 40 L 35 10 L 65 10 L 90 40 C 72 38 28 38 10 40 Z",
  },
  // 7. Broche Squircle Chanfrado
  square: {
    path: "M 26 4 C 10 4 4 10 4 26 L 4 74 C 4 90 10 96 26 96 L 74 96 C 90 96 96 90 96 74 L 96 26 C 96 10 90 4 74 4 Z",
    crescentPath: "M 10 42 C 10 16 22 10 50 10 C 78 10 90 16 90 42 C 70 38 30 38 10 42 Z",
  },
  // 8. Estrela Real de Honra
  star: {
    path: "M 50 3 L 62 33 L 96 36 L 70 59 L 78 93 L 50 75 L 22 93 L 30 59 L 4 36 L 38 33 Z",
    crescentPath: "M 22 40 L 50 12 L 78 40 C 65 35 35 35 22 40 Z",
  },
};

// ============================================================================
// 3. MATERIAIS & PALETAS 3D REALISTAS
// ============================================================================
export interface MaterialColorConfig {
  name: string;
  baseLight: string;      // Top-left illumination
  baseMid: string;        // Primary badge color
  baseDark: string;       // Deep shadow tone
  extrusionDark: string;  // 3D bevel side thickness
  bevelLight: string;     // Chamfer bright edge
  bevelDark: string;      // Chamfer dark shadow edge
  specular: string;       // Gloss white/colored sheen
  glow: string;           // Ambient aura color
  iconColor: string;      // Default icon color
  starColor: string;      // Miniature star color
}

export const MATERIAL_PRESETS: Record<InsigniaMaterial3D, MaterialColorConfig> = {
  // 💎 Safira Azul 3D (Estilo Verified da Imagem Referência)
  safira_blue: {
    name: "Safira Azul 3D (Verified)",
    baseLight: "#38bdf8",
    baseMid: "#0284c7",
    baseDark: "#0369a1",
    extrusionDark: "#075985",
    bevelLight: "#bae6fd",
    bevelDark: "#0c4a6e",
    specular: "rgba(255, 255, 255, 0.75)",
    glow: "#0284c7",
    iconColor: "#ffffff",
    starColor: "#fbbf24",
  },
  // 🏆 Ouro Nobre 24k
  gold_24k: {
    name: "Ouro Imperial 24k",
    baseLight: "#fbbf24",
    baseMid: "#d97706",
    baseDark: "#92400e",
    extrusionDark: "#78350f",
    bevelLight: "#fef08a",
    bevelDark: "#451a03",
    specular: "rgba(255, 255, 255, 0.85)",
    glow: "#f59e0b",
    iconColor: "#ffffff",
    starColor: "#ffffff",
  },
  // 🔮 Rubi Imperial 3D
  ruby_red: {
    name: "Rubi Carmesim 3D",
    baseLight: "#fb7185",
    baseMid: "#e11d48",
    baseDark: "#9f1239",
    extrusionDark: "#881337",
    bevelLight: "#fecdd3",
    bevelDark: "#4c0519",
    specular: "rgba(255, 255, 255, 0.8)",
    glow: "#f43f5e",
    iconColor: "#ffffff",
    starColor: "#fbbf24",
  },
  // 👑 Platina & Cromo Espelhado
  platinum_chrome: {
    name: "Platina & Cromo 3D",
    baseLight: "#f1f5f9",
    baseMid: "#94a3b8",
    baseDark: "#475569",
    extrusionDark: "#1e293b",
    bevelLight: "#ffffff",
    bevelDark: "#0f172a",
    specular: "rgba(255, 255, 255, 0.95)",
    glow: "#cbd5e1",
    iconColor: "#ffffff",
    starColor: "#38bdf8",
  },
  // 🌌 Ametista Cósmica
  amethyst_purple: {
    name: "Ametista Cósmica 3D",
    baseLight: "#c084fc",
    baseMid: "#9333ea",
    baseDark: "#6b21a8",
    extrusionDark: "#4c1d95",
    bevelLight: "#f3e8ff",
    bevelDark: "#2e1065",
    specular: "rgba(255, 255, 255, 0.8)",
    glow: "#a855f7",
    iconColor: "#ffffff",
    starColor: "#facc15",
  },
  // 🌿 Esmeralda Real 3D
  emerald_green: {
    name: "Esmeralda Nobre 3D",
    baseLight: "#34d399",
    baseMid: "#059669",
    baseDark: "#065f46",
    extrusionDark: "#064e3b",
    bevelLight: "#a7f3d0",
    bevelDark: "#022c22",
    specular: "rgba(255, 255, 255, 0.8)",
    glow: "#10b981",
    iconColor: "#ffffff",
    starColor: "#fbbf24",
  },
  // 🌑 Obsidiana & Ouro Negro
  obsidian_black: {
    name: "Obsidiana & Ouro",
    baseLight: "#334155",
    baseMid: "#0f172a",
    baseDark: "#020617",
    extrusionDark: "#000000",
    bevelLight: "#fbbf24",
    bevelDark: "#090a0f",
    specular: "rgba(251, 191, 36, 0.65)",
    glow: "#f59e0b",
    iconColor: "#fbbf24",
    starColor: "#ffffff",
  },
  // ⚡ Holográfico / Cyber Neon
  cyber_neon: {
    name: "Cyber Neon Furta-cor",
    baseLight: "#38bdf8",
    baseMid: "#ec4899",
    baseDark: "#7c3aed",
    extrusionDark: "#4c1d95",
    bevelLight: "#67e8f9",
    bevelDark: "#311042",
    specular: "rgba(255, 255, 255, 0.9)",
    glow: "#ec4899",
    iconColor: "#ffffff",
    starColor: "#38bdf8",
  },
  // 🎨 Personalizado
  custom: {
    name: "Cores Customizadas",
    baseLight: "#a855f7",
    baseMid: "#7c3aed",
    baseDark: "#4c1d95",
    extrusionDark: "#2e1065",
    bevelLight: "#e9d5ff",
    bevelDark: "#1e1b4b",
    specular: "rgba(255, 255, 255, 0.75)",
    glow: "#7c3aed",
    iconColor: "#ffffff",
    starColor: "#fbbf24",
  },
};

// ============================================================================
// 4. MAPA DE RARIDADE -> MATERIAL PADRÃO (FALLBACK INTELIGENTE)
// ============================================================================
export const RARITY_TO_MATERIAL: Record<InsigniaRarity, InsigniaMaterial3D> = {
  comum: "platinum_chrome",
  raro: "safira_blue",
  epico: "amethyst_purple",
  lendario: "gold_24k",
  mitico: "ruby_red",
};

export const RARITY_TO_SHAPE: Record<InsigniaRarity, InsigniaShape3D> = {
  comum: "medal",
  raro: "rosette",
  epico: "shield",
  lendario: "rosette",
  mitico: "star",
};

// ============================================================================
// 5. COMPONENTE PRINCIPAL INSIGNIA EMBLEM 3D REALISTA
// ============================================================================
export interface InsigniaEmblemProps {
  icon?: string | null;
  name?: string;
  rarity?: InsigniaRarity | string;
  shape_3d?: InsigniaShape3D | null;
  material_3d?: InsigniaMaterial3D | null;
  border_style_3d?: InsigniaBorderStyle3D | null;
  gloss_effect?: InsigniaGlossEffect | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  color?: string | null;
  bgColor?: string | null;
  borderColor?: string | null;
  showStar?: boolean;
  interactive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function InsigniaEmblem({
  icon,
  name,
  rarity = "comum",
  shape_3d,
  material_3d,
  border_style_3d = "metallic_chamfer",
  gloss_effect = "ultra_glass",
  size = "md",
  color,
  bgColor,
  borderColor,
  showStar = true,
  interactive = true,
  className,
  style,
  onClick,
}: InsigniaEmblemProps) {
  const uniqueId = useId().replace(/:/g, "_");

  // Determinar Shape e Material Efetivo
  const safeRarity: InsigniaRarity = (
    ["comum", "raro", "epico", "lendario", "mitico"].includes(rarity as string)
      ? rarity
      : "comum"
  ) as InsigniaRarity;

  const effectiveShape: InsigniaShape3D = shape_3d || RARITY_TO_SHAPE[safeRarity] || "rosette";
  const defaultMaterialKey = RARITY_TO_MATERIAL[safeRarity] || "safira_blue";
  const effectiveMaterialKey: InsigniaMaterial3D = material_3d || (bgColor ? "custom" : defaultMaterialKey);

  const matConfig = { ...MATERIAL_PRESETS[effectiveMaterialKey] || MATERIAL_PRESETS.safira_blue };

  // Se tiver cores personalizadas explícitas do usuário
  if (bgColor) {
    matConfig.baseMid = bgColor;
    matConfig.baseLight = lightenColor(bgColor, 25);
    matConfig.baseDark = darkenColor(bgColor, 30);
    matConfig.extrusionDark = darkenColor(bgColor, 50);
  }
  if (borderColor) {
    matConfig.bevelLight = lightenColor(borderColor, 35);
    matConfig.bevelDark = darkenColor(borderColor, 30);
    matConfig.glow = borderColor;
  }
  if (color) {
    matConfig.iconColor = color;
  }

  const shapeData = SHAPE_PATHS[effectiveShape] || SHAPE_PATHS.rosette;

  // Dimensões em pixels por tamanho
  const sizeConfig = {
    xs: { px: 32, iconPx: 14, starPx: 10, starPos: "-top-0.5 -right-0.5", starText: "text-[7px]" },
    sm: { px: 42, iconPx: 18, starPx: 12, starPos: "-top-1 -right-1", starText: "text-[8px]" },
    md: { px: 54, iconPx: 24, starPx: 15, starPos: "-top-1 -right-1", starText: "text-[9px]" },
    lg: { px: 68, iconPx: 30, starPx: 18, starPos: "-top-1 -right-1", starText: "text-[10px]" },
    xl: { px: 84, iconPx: 38, starPx: 22, starPos: "-top-1.5 -right-1.5", starText: "text-[12px]" },
    "2xl": { px: 110, iconPx: 50, starPx: 28, starPos: "-top-2 -right-2", starText: "text-[14px]" },
  }[size] || { px: 54, iconPx: 24, starPx: 15, starPos: "-top-1 -right-1", starText: "text-[9px]" };

  const finalIconColor = color || matConfig.iconColor;
  const finalGlow = borderColor || bgColor || color || matConfig.glow;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "group relative inline-flex items-center justify-center select-none shrink-0 transition-all duration-300",
        interactive && "cursor-pointer hover:scale-110 hover:-translate-y-1 hover:z-20 active:scale-95",
        className
      )}
      style={{
        width: sizeConfig.px,
        height: sizeConfig.px,
        minWidth: sizeConfig.px,
        minHeight: sizeConfig.px,
        filter: `drop-shadow(0 ${Math.max(2, Math.round(sizeConfig.px * 0.08))}px ${Math.max(6, Math.round(sizeConfig.px * 0.25))}px ${finalGlow}55) drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
        ...style,
      }}
      title={name}
    >
      {/* =====================================================================
          RENDERIZADOR SVG 3D MULTI-CAMADA (CORPO REALISTA, CHANFRO, DOMO E REFLEXO)
          ===================================================================== */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full absolute inset-0 overflow-visible pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 1. Gradiente da Extrusão 3D Inferior (Sombra de Espessura Física) */}
          <linearGradient id={`ext_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={matConfig.baseDark} />
            <stop offset="100%" stopColor={matConfig.extrusionDark} />
          </linearGradient>

          {/* 2. Gradiente do Chanfro Metálico / Borda de Joalheria */}
          <linearGradient id={`chamfer_${uniqueId}`} x1="15%" y1="10%" x2="85%" y2="90%">
            <stop offset="0%" stopColor={matConfig.bevelLight} stopOpacity="1" />
            <stop offset="35%" stopColor={matConfig.baseLight} stopOpacity="0.8" />
            <stop offset="70%" stopColor={matConfig.bevelDark} stopOpacity="0.9" />
            <stop offset="100%" stopColor={matConfig.extrusionDark} stopOpacity="1" />
          </linearGradient>

          {/* 3. Gradiente Radial do Domo Convexo 3D (Luz vinda de 35% 25%) */}
          <radialGradient
            id={`dome_${uniqueId}`}
            cx="35%"
            cy="28%"
            r="65%"
            fx="32%"
            fy="22%"
          >
            <stop offset="0%" stopColor={matConfig.baseLight} />
            <stop offset="45%" stopColor={matConfig.baseMid} />
            <stop offset="85%" stopColor={matConfig.baseDark} />
            <stop offset="100%" stopColor={matConfig.extrusionDark} />
          </radialGradient>

          {/* 4. Gradiente de Arco Especular de Vidro (Reflexo de Vidro Verified) */}
          <linearGradient id={`glass_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
          </linearGradient>

          {/* 5. Gradiente Esmaltado Metálico / Holográfico */}
          <linearGradient id={`sheen_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
          </linearGradient>

          {/* Filtro de Sombra Suave e Chanfrado */}
          <filter id={`shadow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* CAMADA 1: EXTRUSÃO 3D DE FUNDO (PROFUNDIDADE FÍSICA INFERIOR) */}
        <g transform="translate(0, 3.5)">
          <path
            d={shapeData.path}
            fill={`url(#ext_${uniqueId})`}
            opacity="0.9"
          />
        </g>

        {/* CAMADA 2: MOLDURA CHANFRADA EXTERNA DE ALTA JOALHERIA */}
        {border_style_3d !== "none" && (
          <path
            d={shapeData.path}
            fill={`url(#chamfer_${uniqueId})`}
          />
        )}

        {/* CAMADA 3: DOMO CONVEXO PRINCIPAL 3D (SUPERFÍCIE DO EMBLEMA) */}
        <g transform="scale(0.92) translate(4.35, 4.35)">
          <path
            d={shapeData.path}
            fill={`url(#dome_${uniqueId})`}
          />

          {/* CAMADA 4: BRILHO DE VIDRO / ARCO ESPECULAR ULTRA 3D (ESTILO VERIFIED) */}
          {(gloss_effect === "ultra_glass" || gloss_effect === "radial_dome") && (
            <path
              d={shapeData.crescentPath || "M 15 45 C 15 20 30 10 50 10 C 70 10 85 20 85 45 C 70 40 30 40 15 45 Z"}
              fill={`url(#glass_${uniqueId})`}
              className="transition-opacity duration-300 group-hover:opacity-90 opacity-80"
            />
          )}

          {/* CAMADA 5: SHEEN ESMALTADO METÁLICO */}
          {gloss_effect === "specular_sheen" && (
            <path
              d={shapeData.path}
              fill={`url(#sheen_${uniqueId})`}
              className="opacity-70"
            />
          )}

          {/* CAMADA 6: REFLEXO HOLOGRÁFICO DINÂMICO */}
          {gloss_effect === "holographic" && (
            <path
              d={shapeData.path}
              fill="url(#sheen_holographic)"
              className="opacity-40 mix-blend-overlay"
            />
          )}

          {/* ANEL INTERNO DE RELEVO DE PRECISÃO */}
          <path
            d={shapeData.path}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.8"
            opacity="0.6"
          />
        </g>
      </svg>

      {/* =====================================================================
          ÍCONE CENTRAL 3D EM ALTO-RELEVO (EMBOSSED COM DROP-SHADOW & SPECULAR)
          ===================================================================== */}
      <div
        className="relative z-10 flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
        style={{
          color: finalIconColor,
          filter: `drop-shadow(0 2px 3px rgba(0,0,0,0.65)) drop-shadow(0 1px 1px rgba(0,0,0,0.9)) drop-shadow(0 -1px 0 rgba(255,255,255,0.45))`,
        }}
      >
        <DynamicInsigniaIcon
          name={icon}
          style={{ width: sizeConfig.iconPx, height: sizeConfig.iconPx }}
        />
      </div>

      {/* =====================================================================
          PIN / BROCHE DA ESTRELA REAL NO CANTO SUPERIOR (OPCIONAL)
          ===================================================================== */}
      {showStar && size !== "xs" && (
        <div
          className={cn(
            "absolute rounded-full flex items-center justify-center font-black shadow-lg border z-20 transition-transform duration-200 group-hover:scale-125",
            sizeConfig.starPos,
            sizeConfig.starText
          )}
          style={{
            width: sizeConfig.starPx,
            height: sizeConfig.starPx,
            background: "linear-gradient(135deg, #1e293b 0%, #090a0f 100%)",
            borderColor: matConfig.bevelLight,
            color: matConfig.starColor,
            boxShadow: `0 2px 8px ${matConfig.glow}70, inset 0 1px 1px rgba(255,255,255,0.4)`,
          }}
        >
          <span className="leading-none select-none font-black text-amber-400">★</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. UTILITÁRIOS MATEMÁTICOS DE COR PARA ILUMINAÇÃO DINÂMICA
// ============================================================================
function parseColorToRgb(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    const num = parseInt(hex.substring(0, 6), 16);
    if (isNaN(num)) return [120, 120, 120];
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  if (color.startsWith("rgb")) {
    const match = color.match(/\d+/g);
    if (match && match.length >= 3) {
      return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2])];
    }
  }
  return [120, 120, 120];
}

function lightenColor(color: string, percent: number): string {
  const [r, g, b] = parseColorToRgb(color);
  const factor = percent / 100;
  const nr = Math.min(255, Math.round(r + (255 - r) * factor));
  const ng = Math.min(255, Math.round(g + (255 - g) * factor));
  const nb = Math.min(255, Math.round(b + (255 - b) * factor));
  return `rgb(${nr}, ${ng}, ${nb})`;
}

function darkenColor(color: string, percent: number): string {
  const [r, g, b] = parseColorToRgb(color);
  const factor = (100 - percent) / 100;
  const nr = Math.max(0, Math.round(r * factor));
  const ng = Math.max(0, Math.round(g * factor));
  const nb = Math.max(0, Math.round(b * factor));
  return `rgb(${nr}, ${ng}, ${nb})`;
}
