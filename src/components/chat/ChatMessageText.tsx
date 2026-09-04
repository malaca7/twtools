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
      {/* MESSAGE TEXT WITH CLICKABLE LINKS */}
      <p className={cn("text-[13.5px] leading-relaxed whitespace-pre-wrap break-words select-text font-sans", className)}>
        {tokens.length === 0
          ? content
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
              return <React.Fragment key={idx}>{token.value}</React.Fragment>;
            })}
      </p>

      {/* RICH LINK PREVIEW CARD */}
      {showPreview && firstUrl && <LinkPreviewCard url={firstUrl} />}
    </div>
  );
};
