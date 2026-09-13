import type {
  BotProject,
  BotCommand,
  BotEvent,
  BotTimer,
  BotAction,
  ExecutionContext,
  ExecutionLog,
  ExecutionTraceItem,
} from "./types";
import { evaluateConditionGroups } from "./conditions";
import { executeSingleAction } from "./actions";

export interface RunEngineOptions {
  bot: BotProject;
  source: "command" | "event" | "timer" | "test";
  triggerName: string;
  command?: BotCommand;
  event?: BotEvent;
  timer?: BotTimer;
  actionsOverride?: BotAction[];
  user?: ExecutionContext["user"];
  channel?: ExecutionContext["channel"];
  message?: ExecutionContext["message"];
  args?: Record<string, any>;
  initialVars?: Record<string, any>;
}

export class BotEngine {
  private static readonly MAX_STEPS = 50;

  /**
   * Executa uma cadeia de ações com proteção contra loops e geração de trace completo
   */
  public static async run(options: RunEngineOptions): Promise<ExecutionLog> {
    const startTime = Date.now();
    const trace: ExecutionTraceItem[] = [];
    let stepsExecuted = 0;
    let runStatus: "success" | "error" | "warning" = "success";
    let errorMessage: string | undefined = undefined;

    // Constrói variáveis iniciais do bot
    const mergedVars: Record<string, any> = {};
    if (options.bot.variables) {
      for (const v of options.bot.variables) {
        mergedVars[v.name] = v.value;
      }
    }
    if (options.initialVars) {
      Object.assign(mergedVars, options.initialVars);
    }

    const ctx: ExecutionContext = {
      bot: options.bot,
      user: options.user || {
        id: "1537229296697999462",
        name: "Desenvolvedor",
        username: "dev_user",
        roles: ["desenvolvedor", "lider"],
        permissions: ["manage_ceo_bot"],
      },
      channel: options.channel || {
        id: "1548413371194286314",
        name: "testedev",
      },
      message: options.message,
      args: options.args || {},
      vars: mergedVars,
      source: options.source,
      triggerName: options.triggerName,
    };

    // 1. Validação de Condições Iniciais do Gatilho
    let targetConditions = options.command?.conditions || options.event?.conditions || options.timer?.conditions;
    if (targetConditions && targetConditions.length > 0) {
      const conditionPassed = evaluateConditionGroups(targetConditions, ctx);
      if (!conditionPassed) {
        trace.push({
          stepId: "trigger_conditions",
          stepName: "Verificação de Condições Iniciais",
          type: "condition_check",
          success: false,
          output: "Condições não atendidas. Interrompendo execução.",
        });
        return {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          botId: options.bot.id,
          source: options.source,
          triggerName: options.triggerName,
          triggeredBy: {
            id: ctx.user?.id,
            name: ctx.user?.name,
            username: ctx.user?.username,
          },
          startedAt: new Date(startTime).toISOString(),
          durationMs: Date.now() - startTime,
          status: "warning",
          stepsExecuted: 1,
          trace,
        };
      }
    }

    // 2. Determina a lista de ações a executar
    const actionsToExecute: BotAction[] =
      options.actionsOverride ||
      options.command?.actions ||
      options.event?.actions ||
      options.timer?.actions ||
      [];

    // 3. Executor recursivo controlado para sub-pipelines (como IF/ELSE branches)
    const executeActionPipeline = async (actions: BotAction[]): Promise<ExecutionTraceItem[]> => {
      const localTraces: ExecutionTraceItem[] = [];

      for (const act of actions) {
        if (stepsExecuted >= BotEngine.MAX_STEPS) {
          localTraces.push({
            stepId: act.id,
            stepName: act.name || act.type,
            type: act.type,
            success: false,
            error: "Limite máximo de segurança (50 passos) atingido para prevenir loops infinitos.",
          });
          runStatus = "error";
          errorMessage = "Proteção de Loop: Atingiu o limite de 50 ações nesta execução.";
          break;
        }

        stepsExecuted++;
        const stepStart = Date.now();

        try {
          const res = await executeSingleAction(act, ctx, executeActionPipeline);
          localTraces.push({
            stepId: act.id,
            stepName: act.name || act.type,
            type: act.type,
            success: res.success,
            output: res.output,
            error: res.error,
            durationMs: Date.now() - stepStart,
          });

          if (!res.success) {
            runStatus = "error";
            errorMessage = res.error || `Erro na ação ${act.name || act.type}`;
            break;
          }
        } catch (err: any) {
          runStatus = "error";
          errorMessage = err.message || `Exceção na ação ${act.name || act.type}`;
          localTraces.push({
            stepId: act.id,
            stepName: act.name || act.type,
            type: act.type,
            success: false,
            error: errorMessage,
            durationMs: Date.now() - stepStart,
          });
          break;
        }
      }

      return localTraces;
    };

    const mainTraces = await executeActionPipeline(actionsToExecute);
    trace.push(...mainTraces);

    const durationMs = Date.now() - startTime;

    return {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      botId: options.bot.id,
      source: options.source,
      triggerName: options.triggerName,
      triggeredBy: {
        id: ctx.user?.id,
        name: ctx.user?.name,
        username: ctx.user?.username,
      },
      startedAt: new Date(startTime).toISOString(),
      durationMs,
      status: runStatus,
      stepsExecuted,
      error: errorMessage,
      trace,
    };
  }
}
