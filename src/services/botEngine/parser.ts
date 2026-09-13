import type { ExecutionContext } from "./types";

/**
 * Interpola placeholders {{...}} no texto com base no ExecutionContext.
 */
export function interpolatePlaceholders(template: string, ctx: ExecutionContext): string {
  if (!template || typeof template !== "string") return "";

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const timeStr = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const isoStr = now.toISOString();

  return template.replace(/\{\{\s*([a-zA-Z0-9_.[\]]+)\s*\}\}/g, (match, path) => {
    const trimmed = path.trim();

    // 1. Data e Hora
    if (trimmed === "date") return dateStr;
    if (trimmed === "time") return timeStr;
    if (trimmed === "datetime" || trimmed === "now") return `${dateStr} ${timeStr}`;
    if (trimmed === "iso") return isoStr;

    // 2. Bot
    if (trimmed === "bot.name") return ctx.bot?.name || "Twin Bot";
    if (trimmed === "bot.prefix") return ctx.bot?.prefix || "!";
    if (trimmed === "bot.id") return ctx.bot?.id || "";

    // 3. Usuário
    if (trimmed === "user.name") return ctx.user?.name || ctx.user?.username || "Usuário";
    if (trimmed === "user.username") return ctx.user?.username || ctx.user?.name || "usuario";
    if (trimmed === "user.id") return ctx.user?.id || "0";
    if (trimmed === "user.mention") return ctx.user?.id ? `<@${ctx.user.id}>` : "@Usuário";

    // 4. Mensagem
    if (trimmed === "message.content") return ctx.message?.content || "";
    if (trimmed === "message.id") return ctx.message?.id || "";

    // 5. Canal
    if (trimmed === "channel.name") return ctx.channel?.name || "geral";
    if (trimmed === "channel.id") return ctx.channel?.id || "";
    if (trimmed === "channel.mention") return ctx.channel?.id ? `<#${ctx.channel.id}>` : "#geral";

    // 6. Argumentos de Comandos (ex: {{args.motivo}}, {{args[0]}})
    if (trimmed.startsWith("args.")) {
      const argKey = trimmed.replace("args.", "");
      if (ctx.args && ctx.args[argKey] !== undefined) {
        return String(ctx.args[argKey]);
      }
    }
    if (trimmed.startsWith("args[")) {
      const idxMatch = trimmed.match(/args\[(\d+)\]/);
      if (idxMatch && ctx.args) {
        const idx = parseInt(idxMatch[1], 10);
        const values = Object.values(ctx.args);
        if (values[idx] !== undefined) return String(values[idx]);
      }
    }

    // 7. Variáveis customizadas (ex: {{vars.saldo}}, {{saldo}})
    if (trimmed.startsWith("vars.")) {
      const varKey = trimmed.replace("vars.", "");
      if (ctx.vars && ctx.vars[varKey] !== undefined) {
        return String(ctx.vars[varKey]);
      }
    }
    if (ctx.vars && ctx.vars[trimmed] !== undefined) {
      return String(ctx.vars[trimmed]);
    }

    // 8. Se for um argumento direto
    if (ctx.args && ctx.args[trimmed] !== undefined) {
      return String(ctx.args[trimmed]);
    }

    return match;
  });
}

/**
 * Lista todos os placeholders conhecidos para sugestão visual / autocomplete
 */
export const AVAILABLE_PLACEHOLDERS = [
  { placeholder: "{{user.name}}", label: "Nome do Usuário", category: "Usuário" },
  { placeholder: "{{user.username}}", label: "Username / Tag Discord", category: "Usuário" },
  { placeholder: "{{user.id}}", label: "ID Discord do Usuário", category: "Usuário" },
  { placeholder: "{{user.mention}}", label: "Menção do Usuário (@alvo)", category: "Usuário" },
  { placeholder: "{{message.content}}", label: "Conteúdo da Mensagem", category: "Mensagem" },
  { placeholder: "{{channel.name}}", label: "Nome do Canal", category: "Canal" },
  { placeholder: "{{channel.id}}", label: "ID do Canal", category: "Canal" },
  { placeholder: "{{channel.mention}}", label: "Menção do Canal (#canal)", category: "Canal" },
  { placeholder: "{{bot.name}}", label: "Nome do Bot", category: "Bot" },
  { placeholder: "{{bot.prefix}}", label: "Prefixo do Bot", category: "Bot" },
  { placeholder: "{{date}}", label: "Data Atual (DD/MM/AAAA)", category: "Data/Hora" },
  { placeholder: "{{time}}", label: "Hora Atual (HH:MM:SS)", category: "Data/Hora" },
  { placeholder: "{{datetime}}", label: "Data e Hora Completa", category: "Data/Hora" },
];
