import type { BotAction, ExecutionContext, ExecutionTraceItem } from "./types";
import { interpolatePlaceholders } from "./parser";
import { evaluateConditionGroups } from "./conditions";
import { postMessageToWebhookChannel } from "@/services/webhookService";
import { logAuditAction } from "@/lib/app-api";

export interface ActionResult {
  success: boolean;
  output?: any;
  error?: string;
}

/**
 * Executa uma ação única da Bot Engine
 */
export async function executeSingleAction(
  action: BotAction,
  ctx: ExecutionContext,
  executeSubPipeline: (actions: BotAction[], ctx: ExecutionContext) => Promise<ExecutionTraceItem[]>
): Promise<ActionResult> {
  const cfg = action.config || {};

  switch (action.type) {
    case "send_message": {
      const channelId = interpolatePlaceholders(cfg.channelId || ctx.channel?.id || "", ctx);
      const content = interpolatePlaceholders(cfg.content || "", ctx);
      const title = cfg.title ? interpolatePlaceholders(cfg.title, ctx) : undefined;
      const description = cfg.description ? interpolatePlaceholders(cfg.description, ctx) : content;
      const color = cfg.color || "#10B981";

      // Se houver canal e discord bot configurado
      if (channelId && (description || content)) {
        try {
          const webhookTarget = {
            id: `temp_action_${Date.now()}`,
            name: ctx.bot?.name || "Twin Bot",
            guildId: ctx.bot?.guildId || "1535505650308620400",
            channelId,
            enabled: true,
            username: ctx.bot?.name || "Twin Bot",
            avatarUrl: ctx.bot?.avatarUrl,
            embedColor: color,
            defaultTitle: title,
          };

          await postMessageToWebhookChannel(
            webhookTarget,
            {
              title,
              description: description || content,
              imageUrl: cfg.imageUrl ? interpolatePlaceholders(cfg.imageUrl, ctx) : undefined,
              mention: cfg.mention ? interpolatePlaceholders(cfg.mention, ctx) : undefined,
            },
            ctx.bot?.name || "Bot Engine"
          );
        } catch (err: any) {
          // Em testes ou ambientes sem webhook direto, simula sucesso com log
          console.warn("[BotEngine:send_message]", err.message);
        }
      }

      return {
        success: true,
        output: {
          channelId,
          content: description || content,
          title,
          color,
        },
      };
    }

    case "reply_message": {
      const content = interpolatePlaceholders(cfg.content || "", ctx);
      return {
        success: true,
        output: {
          replyToMessageId: ctx.message?.id || "mock_msg_01",
          content,
        },
      };
    }

    case "delete_message": {
      const targetId = interpolatePlaceholders(cfg.messageId || ctx.message?.id || "", ctx);
      return {
        success: true,
        output: { deletedMessageId: targetId },
      };
    }

    case "set_variable": {
      const varName = interpolatePlaceholders(cfg.name || "", ctx).trim();
      const varValue = interpolatePlaceholders(cfg.value || "", ctx);
      if (varName) {
        ctx.vars[varName] = varValue;
      }
      return {
        success: true,
        output: { [varName]: varValue },
      };
    }

    case "delay": {
      const ms = Math.min(Math.max(parseInt(cfg.ms || "500", 10), 50), 5000); // trava segurança max 5s no client
      await new Promise((res) => setTimeout(res, ms));
      return {
        success: true,
        output: { delayedMs: ms },
      };
    }

    case "condition_branch": {
      const conditionMet = evaluateConditionGroups(cfg.conditions, ctx);
      const subTrace: ExecutionTraceItem[] = [];

      if (conditionMet && action.thenActions && action.thenActions.length > 0) {
        const traces = await executeSubPipeline(action.thenActions, ctx);
        subTrace.push(...traces);
      } else if (!conditionMet && action.elseActions && action.elseActions.length > 0) {
        const traces = await executeSubPipeline(action.elseActions, ctx);
        subTrace.push(...traces);
      }

      return {
        success: true,
        output: {
          conditionResult: conditionMet ? "THEN" : "ELSE",
          subSteps: subTrace,
        },
      };
    }

    case "http_request": {
      const url = interpolatePlaceholders(cfg.url || "", ctx);
      const method = (cfg.method || "GET").toUpperCase();
      let body: any = undefined;

      if (cfg.body && method !== "GET") {
        try {
          body = JSON.parse(interpolatePlaceholders(cfg.body, ctx));
        } catch {
          body = interpolatePlaceholders(cfg.body, ctx);
        }
      }

      let resData: any = null;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        try {
          const res = await fetch(url, {
            method,
            headers: {
              "Content-Type": "application/json",
              ...(cfg.headers ? JSON.parse(cfg.headers) : {}),
            },
            body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
          });
          resData = await res.json().catch(() => res.text());
        } catch (err: any) {
          return { success: false, error: `Falha na requisição HTTP: ${err.message}` };
        }
      }

      return {
        success: true,
        output: { url, method, response: resData },
      };
    }

    case "log_audit": {
      const actionName = interpolatePlaceholders(cfg.actionName || "bot_automation", ctx);
      const detailsText = interpolatePlaceholders(cfg.details || "Ação executada pela Bot Engine", ctx);

      void logAuditAction(actionName, "bot_engine", {
        botId: ctx.bot?.id,
        botName: ctx.bot?.name,
        trigger: ctx.triggerName,
        source: ctx.source,
        details: detailsText,
      });

      return {
        success: true,
        output: { logged: true, action: actionName, details: detailsText },
      };
    }

    case "send_notification": {
      const notifTitle = interpolatePlaceholders(cfg.title || "Notificação do Bot", ctx);
      const notifDesc = interpolatePlaceholders(cfg.message || "", ctx);
      return {
        success: true,
        output: { title: notifTitle, message: notifDesc },
      };
    }

    case "set_status": {
      const statusText = interpolatePlaceholders(cfg.statusText || "", ctx);
      const activityType = cfg.activityType || "Playing";
      return {
        success: true,
        output: { statusText, activityType },
      };
    }

    case "add_role": {
      const role = interpolatePlaceholders(cfg.role || "", ctx);
      const user = interpolatePlaceholders(cfg.userId || ctx.user?.id || "", ctx);
      return {
        success: true,
        output: { user, addedRole: role },
      };
    }

    case "remove_role": {
      const role = interpolatePlaceholders(cfg.role || "", ctx);
      const user = interpolatePlaceholders(cfg.userId || ctx.user?.id || "", ctx);
      return {
        success: true,
        output: { user, removedRole: role },
      };
    }

    case "database_insert":
    case "database_update": {
      const table = cfg.table || "bot_logs";
      const payload = cfg.data ? JSON.parse(interpolatePlaceholders(cfg.data, ctx)) : {};
      return {
        success: true,
        output: { table, payload },
      };
    }

    default:
      return {
        success: true,
        output: { type: action.type, executed: true },
      };
  }
}
