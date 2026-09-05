import React, { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { LinkPreviewCard, extractFirstUrl, URL_REGEX } from "./LinkPreviewCard";
import { cn } from "@/lib/utils";

interface ChatMessageTextProps {
  content: string;
  isDeleted?: boolean;
  className?: string;
  showPreview?: boolean;
}

export function parseMentions(text: string): React.ReactNode[] {
  const regex = /(@[a-zA-Z0-9_]+)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith("@") && part.length > 1) {
      return (
        <span
          key={i}
          className="font-black text-sky-400 bg-sky-500/10 px-1 py-0.5 mx-0.5 rounded-md border border-sky-500/20"
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

/**
 * Função utilitária para formatar texto no estilo WhatsApp:
 * - *texto* => negrito (<strong>)
 * - _texto_ => itálico (<em>)
 * - ~texto~ => tachado (<del>)
 * - `texto` => código inline (<code>)
 * - ```texto``` => bloco de código (<pre><code>)
 */
export function parseWhatsAppFormatting(text: string): React.ReactNode[] {
  if (!text) return [];

  // Divide em blocos de código (```), código inline (`), negrito (*), itálico (_) e tachado (~)
  const regex = /(```[\s\S]+?```|`[^`\n]+`|\*[^\*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Bloco de código: ```codigo```
    if (part.startsWith("```") && part.endsWith("```") && part.length >= 6) {
      const codeContent = part.slice(3, -3).trim();
      return (
        <pre
          key={i}
          className="my-1.5 p-2.5 rounded-xl bg-black/60 border border-white/15 font-mono text-[11.5px] overflow-x-auto text-emerald-300 shadow-inner whitespace-pre leading-relaxed select-text"
        >
          <code>{codeContent}</code>
        </pre>
      );
    }

    // Código inline: `codigo`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-black/40 border border-white/10 font-mono text-[12px] text-amber-300 font-bold inline-block select-text"
        >
          {codeContent}
        </code>
      );
    }

    // Negrito: *texto*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <strong key={i} className="font-extrabold text-foreground tracking-tight">
          {parseWhatsAppFormatting(inner)}
        </strong>
      );
    }

    // Itálico: _texto_
    if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={i} className="italic opacity-90 font-medium">
          {parseWhatsAppFormatting(inner)}
        </em>
      );
    }

    // Tachado (rasurado): ~texto~
    if (part.startsWith("~") && part.endsWith("~") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <del key={i} className="line-through opacity-75 decoration-current">
          {parseWhatsAppFormatting(inner)}
        </del>
      );
    }

    return <React.Fragment key={i}>{parseMentions(part)}</React.Fragment>;
  });
}

export const ChatMessageText: React.FC<ChatMessageTextProps> = ({
  content,
  isDeleted = false,
  className,
  showPreview = true,
}) => {
  if (isDeleted) {
    return (
      <p className={cn("text-[13.5px] leading-relaxed whitespace-pre-wrap break-words italic opacity-70", className)}>
        🚫 Mensagem apagada
      </p>
    );
  }

  if (!content) return null;

  // Extract first URL for preview card
  const firstUrl = useMemo(() => extractFirstUrl(content), [content]);

  // Tokenize text into plain string and URL tokens
  const tokens = useMemo(() => {
    if (!content) return [];
    const parts: { type: "text" | "link"; value: string; url: string }[] = [];
    let lastIdx = 0;
    const regex = new RegExp(URL_REGEX.source, "gi");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      const matchIndex = match.index;
      const matchText = match[0];

      // Leading plain text
      if (matchIndex > lastIdx) {
        parts.push({
          type: "text",
          value: content.slice(lastIdx, matchIndex),
          url: "",
        });
      }

      // Normalized URL for anchor href
      let href = matchText;
      if (href.startsWith("www.")) {
        href = `https://${href}`;
      } else if (!href.startsWith("http://") && !href.startsWith("https://")) {
        href = `https://${href}`;
      }

      parts.push({
        type: "link",
        value: matchText,
        url: href,
      });

      lastIdx = matchIndex + matchText.length;
    }

    // Trailing plain text
    if (lastIdx < content.length) {
      parts.push({
        type: "text",
        value: content.slice(lastIdx),
        url: "",
      });
    }

    return parts;
  }, [content]);

  return (
    <div className="space-y-1">
      {/* MESSAGE TEXT WITH WHATSAPP FORMATTING & CLICKABLE LINKS */}
      <div className={cn("text-[13.5px] leading-relaxed whitespace-pre-wrap break-words select-text font-sans", className)}>
        {tokens.length === 0
          ? parseWhatsAppFormatting(content)
          : tokens.map((token, idx) => {
              if (token.type === "link") {
                return (
                  <a
                    key={idx}
                    href={token.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#53bdeb] hover:text-[#79d3ff] underline underline-offset-2 decoration-[#53bdeb]/40 hover:decoration-[#53bdeb] break-all transition-colors font-semibold cursor-pointer inline-flex items-center gap-0.5 mx-0.5"
                    title={token.url}
                  >
                    <span>{token.value}</span>
                    <ExternalLink className="h-3 w-3 inline-block shrink-0 opacity-60 ml-0.5" />
                  </a>
                );
              }
              return <React.Fragment key={idx}>{parseWhatsAppFormatting(token.value)}</React.Fragment>;
            })}
      </div>

      {/* RICH LINK PREVIEW CARD */}
      {showPreview && firstUrl && <LinkPreviewCard url={firstUrl} />}
    </div>
  );
};
