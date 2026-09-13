import React, { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Componente interativo para Spoilers estilo Discord (||texto||).
 * Clicar revela/esconde o spoiler com animação e estilo do Discord.
 */
export function DiscordSpoiler({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setRevealed((prev) => !prev);
      }}
      title={revealed ? "Clique para ocultar spoiler" : "Clique para revelar spoiler"}
      className={cn(
        "rounded px-1.5 py-0.5 transition-all cursor-pointer inline-block text-xs font-medium my-0.5",
        revealed
          ? "bg-[#202225]/90 text-[#dbdee1] border border-white/10 hover:bg-[#202225]"
          : "bg-[#202225] text-transparent select-none border border-[#2b2d31] hover:bg-[#282b30] hover:border-zinc-600"
      )}
    >
      {children}
    </span>
  );
}

/**
 * Tokenizador e renderizador inline de Markdown do Discord:
 * - ||spoiler||
 * - `código inline`
 * - ***negrito itálico***
 * - **negrito**
 * - *itálico* ou _itálico_
 * - __sublinhado__
 * - ~~tachado~~
 * - [texto](url)
 * - @everyone, @here, <@&cargo>, <@user>, <#channel>
 * - URLs diretas (https://...)
 */
export function renderDiscordInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex para capturar tokens principais do Discord
  const regex =
    /(\|\|[\s\S]+?\|\||`[^`\n]+`|\*\*\*[\s\S]+?\*\*\*|\*\*[\s\S]+?\*\*|___[\s\S]+?___|__[\s\S]+?__|~~[\s\S]+?~~|\*[^\*\n]+?\*|_[^\_\n]+?_|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|<@&?\d+>|<#\d+>|@everyone|@here|https?:\/\/[^\s<]+)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const token = match[0];

    // Texto puro antes do match
    if (matchIndex > lastIndex) {
      nodes.push(text.substring(lastIndex, matchIndex));
    }

    // 1. Spoiler: ||texto||
    if (token.startsWith("||") && token.endsWith("||") && token.length >= 4) {
      const inner = token.substring(2, token.length - 2);
      nodes.push(
        <DiscordSpoiler key={`spoiler_${matchIndex}`}>
          {renderDiscordInline(inner)}
        </DiscordSpoiler>
      );
    }
    // 2. Código Inline: `código`
    else if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      const inner = token.substring(1, token.length - 1);
      nodes.push(
        <code
          key={`code_${matchIndex}`}
          className="bg-[#1e1f22] text-[#e0e1e5] font-mono text-[11px] px-1.5 py-0.5 rounded border border-[#2b2d31] mx-0.5 align-baseline"
        >
          {inner}
        </code>
      );
    }
    // 3. Negrito + Itálico: ***texto***
    else if (token.startsWith("***") && token.endsWith("***") && token.length >= 6) {
      const inner = token.substring(3, token.length - 3);
      nodes.push(
        <strong key={`bi_${matchIndex}`} className="font-bold italic text-[#f2f3f5]">
          {renderDiscordInline(inner)}
        </strong>
      );
    }
    // 4. Negrito: **texto**
    else if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      const inner = token.substring(2, token.length - 2);
      nodes.push(
        <strong key={`b_${matchIndex}`} className="font-bold text-[#f2f3f5]">
          {renderDiscordInline(inner)}
        </strong>
      );
    }
    // 5. Sublinhado: __texto__
    else if (token.startsWith("__") && token.endsWith("__") && token.length >= 4) {
      const inner = token.substring(2, token.length - 2);
      nodes.push(
        <span key={`u_${matchIndex}`} className="underline underline-offset-2">
          {renderDiscordInline(inner)}
        </span>
      );
    }
    // 6. Tachado: ~~texto~~
    else if (token.startsWith("~~") && token.endsWith("~~") && token.length >= 4) {
      const inner = token.substring(2, token.length - 2);
      nodes.push(
        <del key={`del_${matchIndex}`} className="line-through opacity-75">
          {renderDiscordInline(inner)}
        </del>
      );
    }
    // 7. Itálico: *texto* ou _texto_
    else if (
      (token.startsWith("*") && token.endsWith("*") && token.length >= 2) ||
      (token.startsWith("_") && token.endsWith("_") && token.length >= 2)
    ) {
      const inner = token.substring(1, token.length - 1);
      nodes.push(
        <em key={`i_${matchIndex}`} className="italic text-[#dbdee1]">
          {renderDiscordInline(inner)}
        </em>
      );
    }
    // 8. Link em Markdown: [Título](https://...)
    else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const closeBracket = token.indexOf("](");
      const label = token.substring(1, closeBracket);
      const url = token.substring(closeBracket + 2, token.length - 1);
      nodes.push(
        <a
          key={`link_${matchIndex}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#00a8fc] hover:underline cursor-pointer"
        >
          {label}
        </a>
      );
    }
    // 9. Menção Especial: @everyone / @here
    else if (token === "@everyone" || token === "@here") {
      nodes.push(
        <span
          key={`mention_${matchIndex}`}
          className="bg-[#5865f2]/20 text-[#c9cdfb] hover:bg-[#5865f2]/30 px-1.5 py-0.5 rounded font-medium inline-block align-baseline mx-0.5 text-xs transition-colors"
        >
          {token}
        </span>
      );
    }
    // 10. Menção de Cargo (<@&ID>) ou Membro (<@ID>) ou Canal (<#ID>)
    else if (token.startsWith("<@&") && token.endsWith(">")) {
      nodes.push(
        <span
          key={`role_${matchIndex}`}
          className="bg-[#5865f2]/20 text-[#c9cdfb] hover:bg-[#5865f2]/30 px-1.5 py-0.5 rounded font-medium inline-block align-baseline mx-0.5 text-xs"
        >
          @cargo
        </span>
      );
    } else if (token.startsWith("<@") && token.endsWith(">")) {
      nodes.push(
        <span
          key={`user_${matchIndex}`}
          className="bg-[#5865f2]/20 text-[#c9cdfb] hover:bg-[#5865f2]/30 px-1.5 py-0.5 rounded font-medium inline-block align-baseline mx-0.5 text-xs"
        >
          @usuário
        </span>
      );
    } else if (token.startsWith("<#") && token.endsWith(">")) {
      nodes.push(
        <span
          key={`chan_${matchIndex}`}
          className="bg-[#5865f2]/20 text-[#c9cdfb] hover:bg-[#5865f2]/30 px-1.5 py-0.5 rounded font-medium inline-block align-baseline mx-0.5 text-xs"
        >
          #canal
        </span>
      );
    }
    // 11. URL pura: https://...
    else if (token.startsWith("http://") || token.startsWith("https://")) {
      nodes.push(
        <a
          key={`rawurl_${matchIndex}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#00a8fc] hover:underline break-all"
        >
          {token}
        </a>
      );
    }
    // Fallback
    else {
      nodes.push(token);
    }

    lastIndex = matchIndex + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes;
}

/**
 * Renderizador de Markdown do Discord em nível de bloco / linhas:
 * - Subtexto oficial do Discord (-# texto)
 * - Cabeçalhos (#, ##, ###)
 * - Citações / Blockquotes (> texto)
 * - Blocos de código multiline (```lang ... ```)
 * - Listas com marcadores (- ou *)
 */
export function DiscordMarkdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;

  const lines = text.split("\n");
  const renderedElements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Detecção de início / fim de bloco de código ```
    if (rawLine.trim().startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = rawLine.trim().replace(/^```/, "").trim();
        codeBlockContent = [];
        continue;
      } else {
        inCodeBlock = false;
        renderedElements.push(
          <div
            key={`cb_${i}`}
            className="bg-[#1e1f22] rounded-md p-2.5 my-1.5 border border-[#111214] font-mono text-xs text-[#dbdee1] overflow-x-auto whitespace-pre shadow-inner"
          >
            {codeBlockContent.join("\n")}
          </div>
        );
        continue;
      }
    }

    if (inCodeBlock) {
      codeBlockContent.push(rawLine);
      continue;
    }

    // Linha vazia
    if (!rawLine.trim()) {
      renderedElements.push(<div key={`blank_${i}`} className="h-2" />);
      continue;
    }

    // 1. Subtexto do Discord: -# texto
    if (rawLine.startsWith("-# ") || rawLine.startsWith("-#")) {
      const subtextContent = rawLine.replace(/^-#\s?/, "");
      renderedElements.push(
        <div
          key={`sub_${i}`}
          className="text-[11px] text-[#949ba4] font-medium leading-relaxed break-words"
        >
          {renderDiscordInline(subtextContent)}
        </div>
      );
      continue;
    }

    // 2. Citação em bloco do Discord: > texto ou >>> texto
    if (rawLine.startsWith(">>> ") || rawLine.startsWith("> ")) {
      const quoteContent = rawLine.replace(/^(>>>|>)\s?/, "");
      renderedElements.push(
        <div
          key={`quote_${i}`}
          className="border-l-[3px] border-[#4e5058] pl-2.5 py-0.5 my-0.5 text-[#dbdee1] leading-relaxed break-words"
        >
          {renderDiscordInline(quoteContent)}
        </div>
      );
      continue;
    }

    // 3. Cabeçalhos H1, H2, H3
    if (rawLine.startsWith("# ")) {
      renderedElements.push(
        <div key={`h1_${i}`} className="text-base font-bold text-[#f2f3f5] mt-1 mb-0.5 leading-snug">
          {renderDiscordInline(rawLine.substring(2))}
        </div>
      );
      continue;
    }
    if (rawLine.startsWith("## ")) {
      renderedElements.push(
        <div key={`h2_${i}`} className="text-sm font-bold text-[#f2f3f5] mt-1 mb-0.5 leading-snug">
          {renderDiscordInline(rawLine.substring(3))}
        </div>
      );
      continue;
    }
    if (rawLine.startsWith("### ")) {
      renderedElements.push(
        <div key={`h3_${i}`} className="text-xs font-bold text-[#f2f3f5] mt-0.5 mb-0.5 leading-snug">
          {renderDiscordInline(rawLine.substring(4))}
        </div>
      );
      continue;
    }

    // 4. Lista com Marcadores (- item ou * item)
    if (rawLine.startsWith("- ") || rawLine.startsWith("* ")) {
      renderedElements.push(
        <div key={`li_${i}`} className="flex items-start gap-1.5 pl-2 leading-relaxed">
          <span className="text-[#949ba4] text-xs leading-relaxed select-none">•</span>
          <span className="flex-1 break-words">{renderDiscordInline(rawLine.substring(2))}</span>
        </div>
      );
      continue;
    }

    // 5. Linha comum
    renderedElements.push(
      <div key={`line_${i}`} className="leading-relaxed break-words">
        {renderDiscordInline(rawLine)}
      </div>
    );
  }

  // Se o bloco de código não foi fechado
  if (inCodeBlock && codeBlockContent.length > 0) {
    renderedElements.push(
      <div
        key="cb_unterminated"
        className="bg-[#1e1f22] rounded-md p-2.5 my-1.5 border border-[#111214] font-mono text-xs text-[#dbdee1] overflow-x-auto whitespace-pre shadow-inner"
      >
        {codeBlockContent.join("\n")}
      </div>
    );
  }

  return <div className={cn("space-y-0.5 text-xs sm:text-sm text-[#dbdee1]", className)}>{renderedElements}</div>;
}
