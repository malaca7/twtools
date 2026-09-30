import React from "react";
import * as LucideIcons from "lucide-react";
import { Award } from "lucide-react";

// Pré-computa mapa de nomes de ícones minúsculos e sem hifens/underscores para tolerância máxima
const LUCIDE_INDEX = new Map<string, React.ElementType>();

for (const key of Object.keys(LucideIcons)) {
  const item = (LucideIcons as any)[key];
  if ((typeof item === "function" || (typeof item === "object" && item !== null)) &&
      key !== "createLucideIcon" && key !== "Icon" && key !== "LucideIcon") {
    LUCIDE_INDEX.set(key, item);
    LUCIDE_INDEX.set(key.toLowerCase(), item);
    LUCIDE_INDEX.set(key.toLowerCase().replace(/[-_]/g, ""), item);
  }
}

/**
 * Detecta se a string é predominantemente um emoji
 */
function isEmojiString(str?: string | null): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  // Regex para emojis Unicode
  const emojiRegex = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u200d)+$/u;
  return emojiRegex.test(trimmed) || trimmed.length <= 4 && /[\u{1F300}-\u{1FAD6}]/u.test(trimmed);
}

/**
 * Retorna o componente React correspondente ao nome do ícone Lucide
 * com normalização automática de casing (Award, award, award-star, etc.)
 */
export function getInsigniaIconComponent(iconName?: string | null): React.ElementType {
  if (!iconName) return Award;
  const trimmed = iconName.trim();
  if (!trimmed) return Award;

  // 1. Busca exata
  if (LUCIDE_INDEX.has(trimmed)) {
    return LUCIDE_INDEX.get(trimmed)!;
  }

  // 2. Busca case-insensitive
  const lower = trimmed.toLowerCase();
  if (LUCIDE_INDEX.has(lower)) {
    return LUCIDE_INDEX.get(lower)!;
  }

  // 3. Busca sem hifens e underscores
  const clean = lower.replace(/[-_]/g, "");
  if (LUCIDE_INDEX.has(clean)) {
    return LUCIDE_INDEX.get(clean)!;
  }

  // 4. Fallback padrão
  return Award;
}

export interface DynamicInsigniaIconProps {
  name?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente unificado para renderizar ícones dinâmicos de insígnias em qualquer página.
 * Suporta qualquer ícone Lucide (qualquer casing) e também emojis.
 */
export function DynamicInsigniaIcon({ name, className = "w-5 h-5", style }: DynamicInsigniaIconProps) {
  if (isEmojiString(name)) {
    return (
      <span className={className} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }} role="img" aria-label="insignia-icon">
        {name}
      </span>
    );
  }

  const IconComp = getInsigniaIconComponent(name);
  return <IconComp className={className} style={style} />;
}

/**
 * Função helper universal para renderizar ícones de insígnia.
 * Compatível com chamadas anteriores como renderInsigniaIcon(badge.icon, "h-6 w-6")
 */
export function renderInsigniaIcon(iconName?: string | null, className = "h-4 w-4", style?: React.CSSProperties) {
  return <DynamicInsigniaIcon name={iconName} className={className} style={style} />;
}
