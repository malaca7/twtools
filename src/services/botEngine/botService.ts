import { supabase } from "@/integrations/supabase/client";
import type {
  BotProject,
  BotCommand,
  BotEvent,
  BotTimer,
  BotVariable,
  ExecutionLog,
} from "./types";
import { BotEngine, type RunEngineOptions } from "./engine";

const BOTS_STORAGE_KEY = "tw_bot_projects_v1";
const LOGS_STORAGE_KEY = "tw_bot_execution_logs_v1";
const BOTS_DB_LEVEL = "system_bots_v1";
export const BOT_SYNC_EVENT = "tw_bots_updated";

/**
 * Projeto de Bot Padrão de Exemplo para inicialização imediata
 */
export const DEFAULT_BOT_PROJECT: BotProject = {
  id: "bot_twin_wheels_official",
  name: "Twin Wheels Bot Oficial",
  description: "Bot automatizado oficial para atendimento, avisos, logs e automações da facção Twin Wheels.",
  prefix: "!",
  avatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
  status: "online",
  enabled: true,
  guildId: "1535505650308620400",
  applicationId: "1548413371194286314",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  stats: {
    commandsCount: 3,
    eventsCount: 2,
    timersCount: 1,
    totalExecutions: 48,
    lastExecutedAt: new Date().toISOString(),
    errorsCount: 0,
  },
  commands: [
    {
      id: "cmd_ajuda",
      botId: "bot_twin_wheels_official",
      name: "ajuda",
      prefix: "!",
      description: "Exibe a central de comandos e informações de suporte da Twin Wheels.",
      usage: "!ajuda",
      aliases: ["help", "comandos"],
      enabled: true,
      parameters: [],
      conditions: [],
      actions: [
        {
          id: "act_help_reply",
          type: "send_message",
          name: "Enviar Menu de Ajuda",
          order: 1,
          config: {
            title: "📖 Central de Comandos Twin Wheels",
            description: "Olá {{user.name}}! Aqui estão os comandos disponíveis no servidor:\n\n• `!ajuda` — Mostra esta mensagem\n• `!saldo` — Consulta o saldo e cotas da facção\n• `!aviso [texto]` — Dispara um comunicado oficial\n\nPrecisa de suporte? Procure um Gerente ou 01.",
            color: "#10B981",
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cmd_saldo",
      botId: "bot_twin_wheels_official",
      name: "saldo",
      prefix: "!",
      description: "Informa o saldo atual do fundo de reserva da liderança.",
      usage: "!saldo",
      aliases: ["fundos", "caixa"],
      enabled: true,
      parameters: [],
      conditions: [
        {
          id: "cond_lider",
          logic: "OR",
          conditions: [
            { id: "c1", field: "user.roles", operator: "has_role", value: "lider" },
            { id: "c2", field: "user.roles", operator: "has_role", value: "gerente" },
            { id: "c3", field: "user.roles", operator: "has_role", value: "desenvolvedor" },
          ],
        },
      ],
      actions: [
        {
          id: "act_saldo_embed",
          type: "send_message",
          name: "Enviar Saldo do Fundo",
          order: 1,
          config: {
            title: "💰 Saldo do Fundo de Caixa",
            description: "Informações solicitadas por {{user.mention}} em {{date}} às {{time}}.\n\nSaldo Total: **R$ 2.450.000,00**\nStatus: Reservado para Operações.",
            color: "#F59E0B",
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cmd_aviso",
      botId: "bot_twin_wheels_official",
      name: "aviso",
      prefix: "!",
      description: "Dispara aviso geral formatado nos canais oficiais.",
      usage: "!aviso <comunicado>",
      aliases: ["anuncio", "broadcast"],
      enabled: true,
      parameters: [
        {
          id: "p_msg",
          name: "comunicado",
          type: "string",
          required: true,
          description: "Texto ou informativo a ser anunciado.",
        },
      ],
      conditions: [],
      actions: [
        {
          id: "act_aviso_embed",
          type: "send_message",
          name: "Postar Aviso no Canal",
          order: 1,
          config: {
            title: "📢 COMUNICADO OFICIAL DA DIRETORIA",
            description: "{{args.comunicado}}\n\n*Emitido por {{user.name}} em {{datetime}}*",
            color: "#8B5CF6",
          },
        },
        {
          id: "act_log",
          type: "log_audit",
          name: "Registrar em Auditoria",
          order: 2,
          config: {
            actionName: "bot_announcement_sent",
            details: "Aviso enviado pelo bot via comando !aviso",
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  events: [
    {
      id: "evt_welcome",
      botId: "bot_twin_wheels_official",
      name: "Boas-vindas ao Novo Membro",
      triggerType: "member_join",
      enabled: true,
      description: "Envia mensagem de acolhimento e instruções no canal de bate-papo ao ingressar.",
      conditions: [],
      actions: [
        {
          id: "act_welcome_msg",
          type: "send_message",
          name: "Mensagem de Boas-vindas",
          order: 1,
          config: {
            title: "👋 Bem-vindo(a) à Twin Wheels RP!",
            description: "Olá {{user.mention}}! Seja muito bem-vindo à família Twin Wheels.\n\nPor favor, dirija-se à sala de recrutamento para receber sua tag e orientações sobre os baús e regras da facção.",
            color: "#10B981",
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "evt_cmd_ran",
      botId: "bot_twin_wheels_official",
      name: "Registro de Comando Executado",
      triggerType: "command_ran",
      enabled: true,
      description: "Registra cada comando executado para métricas e auditoria.",
      conditions: [],
      actions: [
        {
          id: "act_audit_cmd",
          type: "log_audit",
          name: "Auditar Execução",
          order: 1,
          config: {
            actionName: "bot_command_executed",
            details: "Comando executado por {{user.name}} no canal {{channel.name}}",
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  timers: [
    {
      id: "timer_daily_meta",
      botId: "bot_twin_wheels_official",
      name: "Lembrete Diário de Metas",
      description: "Envia um aviso automático todos os dias para lembrar os membros sobre as cotas diárias de entrega.",
      scheduleType: "daily",
      scheduleConfig: {
        timeOfDay: "20:00",
        timezone: "America/Sao_Paulo",
      },
      enabled: true,
      repeat: true,
      executionCount: 14,
      lastRunAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      nextRunAt: new Date(Date.now() + 3600000 * 20).toISOString(),
      conditions: [],
      actions: [
        {
          id: "act_timer_embed",
          type: "send_message",
          name: "Disparar Lembrete",
          order: 1,
          config: {
            title: "⏰ Lembrete: Entrega de Metas Diárias",
            description: "Atenção membros da Twin Wheels! Lembramos que as entregas de insumos e cotas do baú encerram às 23:59.\n\nRegistre todas as suas movimentações no painel web!",
            color: "#06B6D4",
          },
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  variables: [
    {
      id: "var_meta_semanal",
      botId: "bot_twin_wheels_official",
      name: "meta_semanal",
      description: "Valor da cota semanal por membro da facção",
      scope: "bot",
      type: "number",
      value: "50000",
    },
    {
      id: "var_mensagem_status",
      botId: "bot_twin_wheels_official",
      name: "status_msg",
      description: "Texto padrão de status da facção",
      scope: "global",
      type: "string",
      value: "Twin Wheels no topo! 🏍️",
    },
  ],
};

/**
 * Carrega a lista de Bots criados (Supabase + LocalStorage fallback)
 */
export async function getBotProjects(): Promise<BotProject[]> {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", BOTS_DB_LEVEL)
      .maybeSingle();

    if (!error && data && Array.isArray(data.permissions) && data.permissions.length > 0) {
      if (typeof window !== "undefined") {
        localStorage.setItem(BOTS_STORAGE_KEY, JSON.stringify(data.permissions));
      }
      return data.permissions as BotProject[];
    }
  } catch (err) {
    console.warn("Falha ao carregar bots do Supabase:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(BOTS_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }

  return [DEFAULT_BOT_PROJECT];
}

/**
 * Salva a lista de Bots no Supabase e no LocalStorage
 */
export async function saveBotProjects(bots: BotProject[]): Promise<void> {
  const updatedBots = bots.map((b) => ({
    ...b,
    updatedAt: new Date().toISOString(),
    stats: {
      ...b.stats,
      commandsCount: b.commands?.length || 0,
      eventsCount: b.events?.length || 0,
      timersCount: b.timers?.length || 0,
    },
  }));

  if (typeof window !== "undefined") {
    localStorage.setItem(BOTS_STORAGE_KEY, JSON.stringify(updatedBots));
    window.dispatchEvent(new CustomEvent(BOT_SYNC_EVENT, { detail: updatedBots }));
    window.dispatchEvent(new Event("storage"));

    if (updatedBots.length > 0) {
      try {
        void import("./syncService").then((m) => {
          void m.syncBotProjectToDiscordConfig(updatedBots[0]);
        });
      } catch {}
    }
  }

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: BOTS_DB_LEVEL,
        nivel: BOTS_DB_LEVEL,
        permissions: updatedBots as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );

    // Broadcast Realtime para o Bot e clientes (ambos os canais para compatibilidade garantida)
    const channel = supabase.channel("system-bot-sync");
    await channel.send({
      type: "broadcast",
      event: "bots_updated",
      payload: updatedBots,
    });

    const channelListener = supabase.channel("system-bot-sync-listener");
    await channelListener.send({
      type: "broadcast",
      event: "bots_updated",
      payload: updatedBots,
    });
  } catch (err) {
    console.warn("Aviso ao sincronizar bots com Supabase:", err);
  }
}

/**
 * Obtém os logs de execução recentes
 */
export function getExecutionLogs(): ExecutionLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * Registra um log de execução da Bot Engine
 */
export function recordExecutionLog(log: ExecutionLog): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getExecutionLogs();
    const updated = [log, ...existing].slice(0, 50); // Mantém os 50 mais recentes
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("tw_bot_logs_updated"));
  } catch {}
}

/**
 * Executa o simulador da Bot Engine e grava logs
 */
export async function runBotSimulation(options: RunEngineOptions): Promise<ExecutionLog> {
  const log = await BotEngine.run(options);
  recordExecutionLog(log);

  // Atualiza estatísticas do bot
  try {
    const bots = await getBotProjects();
    const updatedBots = bots.map((b) => {
      if (b.id === options.bot.id) {
        return {
          ...b,
          stats: {
            ...b.stats,
            totalExecutions: (b.stats.totalExecutions || 0) + 1,
            lastExecutedAt: new Date().toISOString(),
            errorsCount: log.status === "error" ? (b.stats.errorsCount || 0) + 1 : b.stats.errorsCount,
          },
        };
      }
      return b;
    });
    await saveBotProjects(updatedBots);
  } catch {}

  return log;
}
