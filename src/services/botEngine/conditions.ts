import type { ConditionGroup, ConditionItem, ExecutionContext } from "./types";
import { interpolatePlaceholders } from "./parser";

/**
 * Extrai o valor real de um campo no ExecutionContext
 */
export function resolveFieldValue(field: string, ctx: ExecutionContext): any {
  if (!field) return "";
  const trimmed = field.trim();

  // 1. Variável interpolada (ex: {{user.name}} ou user.name)
  if (trimmed.startsWith("{{") && trimmed.endsWith("}}")) {
    return interpolatePlaceholders(trimmed, ctx);
  }

  // 2. Caminhos diretos comuns
  if (trimmed === "user.id") return ctx.user?.id || "";
  if (trimmed === "user.name") return ctx.user?.name || "";
  if (trimmed === "user.username") return ctx.user?.username || "";
  if (trimmed === "user.roles") return ctx.user?.roles || [];
  if (trimmed === "user.permissions") return ctx.user?.permissions || [];
  if (trimmed === "message.content") return ctx.message?.content || "";
  if (trimmed === "channel.id") return ctx.channel?.id || "";
  if (trimmed === "channel.name") return ctx.channel?.name || "";
  if (trimmed === "bot.prefix") return ctx.bot?.prefix || "!";

  // 3. Variáveis do contexto (vars.nome ou vars[nome])
  if (trimmed.startsWith("vars.")) {
    const key = trimmed.replace("vars.", "");
    return ctx.vars?.[key] !== undefined ? ctx.vars[key] : "";
  }
  if (ctx.vars?.[trimmed] !== undefined) {
    return ctx.vars[trimmed];
  }

  // 4. Argumentos do comando
  if (trimmed.startsWith("args.")) {
    const key = trimmed.replace("args.", "");
    return ctx.args?.[key] !== undefined ? ctx.args[key] : "";
  }
  if (ctx.args?.[trimmed] !== undefined) {
    return ctx.args[trimmed];
  }

  return trimmed;
}

/**
 * Avalia uma condição individual
 */
export function evaluateConditionItem(item: ConditionItem, ctx: ExecutionContext): boolean {
  const actualRaw = resolveFieldValue(item.field, ctx);
  const expectedRaw = interpolatePlaceholders(item.value, ctx);

  const actualStr = String(actualRaw ?? "").toLowerCase().trim();
  const expectedStr = String(expectedRaw ?? "").toLowerCase().trim();

  const actualNum = parseFloat(actualStr);
  const expectedNum = parseFloat(expectedStr);
  const hasNumbers = !isNaN(actualNum) && !isNaN(expectedNum);

  switch (item.operator) {
    case "equals":
      return hasNumbers ? actualNum === expectedNum : actualStr === expectedStr;

    case "not_equals":
      return hasNumbers ? actualNum !== expectedNum : actualStr !== expectedStr;

    case "contains":
      if (Array.isArray(actualRaw)) {
        return actualRaw.some((v) => String(v).toLowerCase().includes(expectedStr));
      }
      return actualStr.includes(expectedStr);

    case "not_contains":
      if (Array.isArray(actualRaw)) {
        return !actualRaw.some((v) => String(v).toLowerCase().includes(expectedStr));
      }
      return !actualStr.includes(expectedStr);

    case "starts_with":
      return actualStr.startsWith(expectedStr);

    case "ends_with":
      return actualStr.endsWith(expectedStr);

    case "greater_than":
      return hasNumbers ? actualNum > expectedNum : actualStr > expectedStr;

    case "less_than":
      return hasNumbers ? actualNum < expectedNum : actualStr < expectedStr;

    case "greater_or_equal":
      return hasNumbers ? actualNum >= expectedNum : actualStr >= expectedStr;

    case "less_or_equal":
      return hasNumbers ? actualNum <= expectedNum : actualStr <= expectedStr;

    case "is_empty":
      return actualRaw === null || actualRaw === undefined || actualStr === "" || (Array.isArray(actualRaw) && actualRaw.length === 0);

    case "is_not_empty":
      return actualRaw !== null && actualRaw !== undefined && actualStr !== "" && (!Array.isArray(actualRaw) || actualRaw.length > 0);

    case "has_role":
      const roles: string[] = Array.isArray(ctx.user?.roles) ? ctx.user!.roles : [];
      return roles.some((r) => r.toLowerCase() === expectedStr);

    case "has_permission":
      const perms: string[] = Array.isArray(ctx.user?.permissions) ? ctx.user!.permissions : [];
      return perms.some((p) => p.toLowerCase() === expectedStr);

    default:
      return true;
  }
}

/**
 * Avalia uma lista de grupos de condições com lógica AND / OR
 */
export function evaluateConditionGroups(groups: ConditionGroup[] | undefined, ctx: ExecutionContext): boolean {
  if (!groups || groups.length === 0) return true;

  return groups.every((group) => {
    if (!group.conditions || group.conditions.length === 0) return true;

    if (group.logic === "OR") {
      return group.conditions.some((item) => evaluateConditionItem(item, ctx));
    }

    // Default AND
    return group.conditions.every((item) => evaluateConditionItem(item, ctx));
  });
}
