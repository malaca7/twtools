import { supabase } from "@/integrations/supabase/client";
import type { AppUser, Profile } from "@/lib/app-types";
import type { AppLevel } from "@/lib/permissions";
import { assertDeveloperAccess } from "@/services/devService";

export type DiscordWebhookEventType =
  | "sales"
  | "movements"
  | "cash_fund"
  | "goals"
  | "absences"
  | "members"
  | "tickets"
  | "announcements"
  | "dev_audit"
  | "system_errors";

export interface DiscordWebhookEventMeta {
  label: string;
  description: string;
  category: string;
  defaultColor: string;
  badgeColor: string;
}

export const WEBHOOK_EVENTS_META: Record<DiscordWebhookEventType, DiscordWebhookEventMeta> = {
  sales: {
    label: "Vendas & Comissões",
    description: "Lançamentos de vendas concluídas, faturamento e estornos",
    category: "Financeiro & Vendas",
    defaultColor: "#10B981", // Emerald
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  movements: {
    label: "Movimentações de Estoque",
    description: "Entradas e retiradas de insumos e suprimentos nos baús",
    category: "Estoque & Baús",
    defaultColor: "#0284C7", // Sky blue
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  },
  cash_fund: {
    label: "Fundo de Caixa (Cofre)",
    description: "Depósitos, sangrias e estornos de valores no cofre da facção",
    category: "Financeiro",
    defaultColor: "#F59E0B", // Amber
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  goals: {
    label: "Metas da Semana",
    description: "Criação de metas, comprovantes de entrega de membros e aprovações",
    category: "Produtividade & Metas",
    defaultColor: "#EC4899", // Pink
    badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  },
  absences: {
    label: "Ausências & Licenças",
    description: "Solicitações de afastamento, licenças aprovadas e cancelamentos",
    category: "Gestão de Pessoal",
    defaultColor: "#8B5CF6", // Purple
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  members: {
    label: "Membros & Patentes",
    description: "Novos cadastros aprovados, promoções e alterações de cargo",
    category: "Gestão de Pessoal",
    defaultColor: "#6366F1", // Indigo
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  },
  tickets: {
    label: "Chamados & Suporte",
    description: "Abertura de chamados internos, novas mensagens e finalizações",
    category: "Suporte & Atendimento",
    defaultColor: "#3B82F6", // Blue
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  announcements: {
    label: "Comunicados da Facção",
    description: "Novos avisos importantes fixados no mural e novidades",
    category: "Comunicação",
    defaultColor: "#EAB308", // Yellow
    badgeColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  },
  dev_audit: {
    label: "Auditoria & Ações Dev",
    description: "Ações de desenvolvedor, limpezas forçadas e purgas de cache",
    category: "Sistema & Segurança",
    defaultColor: "#F43F5E", // Rose
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  },
  system_errors: {
    label: "Erros & Exceções",
    description: "Alertas de falhas críticas, exceções não tratadas e bugs",
    category: "Sistema & Segurança",
    defaultColor: "#EF4444", // Red
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/30",
  },
};

export interface DiscordWebhook {
  id: string;
  name: string;
  url: string;
  channelName: string;
  description?: string;
  enabled: boolean;
  username?: string;
  avatarUrl?: string;
  events: DiscordWebhookEventType[];
  embedColor?: string;
  mentionRoles?: string;
  footerText?: string;
  footerIconUrl?: string;
  showTimestamp?: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggeredAt?: string;
  lastStatus?: "success" | "error";
  lastErrorMessage?: string;
}

export interface DiscordWebhooksConfig {
  enabled: boolean;
  webhooks: DiscordWebhook[];
  defaultUsername: string;
  defaultAvatarUrl: string;
  defaultFooterText: string;
  updatedAt: string;
}

export const DEFAULT_WEBHOOKS_CONFIG: DiscordWebhooksConfig = {
  enabled: true,
  defaultUsername: "Twin Wheels RP • Logs",
  defaultAvatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
  defaultFooterText: "Twin Wheels RP • Sistema de Webhooks",
  updatedAt: new Date().toISOString(),
  webhooks: [
    {
      id: "webhook_default_general",
      name: "Logs Gerais da Facção",
      url: "",
      channelName: "#logs-gerais",
      description: "Canal principal para notificações de vendas, estoque e movimentações",
      enabled: false,
      username: "Twin Wheels • Logs",
      avatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      events: ["sales", "movements", "cash_fund", "goals", "announcements"],
      embedColor: "#10B981",
      mentionRoles: "",
      footerText: "Twin Wheels RP • Sistema Integrado",
      showTimestamp: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

const WEBHOOKS_STORAGE_KEY = "tw_discord_webhooks_config_v1";
const WEBHOOKS_DB_LEVEL = "system_discord_webhooks";

/**
 * Converte cor HEX (#10B981) para número inteiro aceito pela API do Discord
 */
export function hexToInt(hex?: string): number {
  if (!hex) return 0x10b981;
  const clean = hex.replace("#", "").trim();
  const num = parseInt(clean, 16);
  return isNaN(num) ? 0x10b981 : num;
}

/**
 * Valida se uma URL tem o formato canônico de Webhook do Discord
 */
export function isValidDiscordWebhookUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  const pattern = /^https:\/\/(?:ptb\.|canary\.)?(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/i;
  return pattern.test(trimmed);
}

/**
 * Carrega a configuração de webhooks do Supabase com fallback para LocalStorage
 */
export async function getDiscordWebhooksConfig(): Promise<DiscordWebhooksConfig> {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", WEBHOOKS_DB_LEVEL)
      .maybeSingle();

    if (!error && data?.permissions && typeof data.permissions === "object") {
      const parsed = data.permissions as unknown as Partial<DiscordWebhooksConfig>;
      const config: DiscordWebhooksConfig = {
        ...DEFAULT_WEBHOOKS_CONFIG,
        ...parsed,
        webhooks: Array.isArray(parsed.webhooks) ? parsed.webhooks : DEFAULT_WEBHOOKS_CONFIG.webhooks,
      };

      try {
        localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(config));
      } catch {}

      return config;
    }
  } catch (err) {
    console.warn("Falha ao buscar system_discord_webhooks no Supabase:", err);
  }

  // Fallback para localStorage
  try {
    const local = localStorage.getItem(WEBHOOKS_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return {
        ...DEFAULT_WEBHOOKS_CONFIG,
        ...parsed,
        webhooks: Array.isArray(parsed.webhooks) ? parsed.webhooks : DEFAULT_WEBHOOKS_CONFIG.webhooks,
      };
    }
  } catch {}

  return DEFAULT_WEBHOOKS_CONFIG;
}

/**
 * Salva a configuração de webhooks no Supabase e no LocalStorage
 */
export async function saveDiscordWebhooksConfig(
  config: DiscordWebhooksConfig,
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null
): Promise<void> {
  assertDeveloperAccess(user, profile, level);

  const payload: DiscordWebhooksConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(payload));
  } catch {}

  try {
    // Tenta salvar via RPC save_role_permissions
    const { error: rpcError } = await supabase.rpc("save_role_permissions", {
      _level: WEBHOOKS_DB_LEVEL,
      _permissions: payload as any,
    });

    if (rpcError) {
      // Fallback para upsert direto
      const { error: upsertError } = await supabase.from("role_permissions").upsert(
        {
          level: WEBHOOKS_DB_LEVEL,
          nivel: WEBHOOKS_DB_LEVEL,
          permissions: payload as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "level" }
      );

      if (upsertError) throw upsertError;
    }

    // Broadcast em tempo real para sincronização instantânea entre clientes
    try {
      const channel = supabase.channel("system-discord-webhooks-sync");
      await channel.send({
        type: "broadcast",
        event: "webhooks_config_updated",
        payload,
      });
    } catch {}
  } catch (err: any) {
    console.error("Erro ao salvar configuração de webhooks no banco:", err);
    throw new Error(err?.message || "Falha ao salvar configuração de webhooks no banco de dados.");
  }
}

/**
 * Testa um webhook específico enviando um embed real para o Discord via fetch HTTP
 */
export async function testDiscordWebhook(
  webhook: DiscordWebhook,
  customNotes?: string
): Promise<{ success: boolean; message: string; channelId?: string; messageId?: string }> {
  if (!webhook.url || !webhook.url.trim()) {
    return {
      success: false,
      message: "A URL do Webhook do Discord não foi configurada.",
    };
  }

  if (!isValidDiscordWebhookUrl(webhook.url)) {
    return {
      success: false,
      message: "Formato de URL de Webhook inválido. A URL deve iniciar com 'https://discord.com/api/webhooks/...' ou 'https://discordapp.com/api/webhooks/...'.",
    };
  }

  const embedColor = hexToInt(webhook.embedColor || "#10B981");
  const nowIso = new Date().toISOString();

  const embedFields = [
    {
      name: "🎯 Canal de Destino",
      value: webhook.channelName ? `\`${webhook.channelName}\`` : "`Não especificado`",
      inline: true,
    },
    {
      name: "📡 Eventos Inscritos",
      value: webhook.events && webhook.events.length > 0
        ? webhook.events.map((e) => `• ${WEBHOOK_EVENTS_META[e]?.label || e}`).join("\n")
        : "`Nenhum evento inscrito`",
      inline: false,
    },
    {
      name: "⚙️ Status do Webhook",
      value: webhook.enabled ? "🟢 **Ativo e Operacional**" : "🟡 **Pausado nas Configurações**",
      inline: true,
    },
    {
      name: "🕒 Timestamp de Envio",
      value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
      inline: true,
    },
  ];

  if (customNotes) {
    embedFields.push({
      name: "💬 Observações do Teste",
      value: customNotes,
      inline: false,
    });
  }

  const payload = {
    username: webhook.username || "Twin Wheels RP • Logs",
    avatar_url: webhook.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
    content: webhook.mentionRoles?.trim() ? `${webhook.mentionRoles.trim()} 🔔 *Disparo de Teste do Webhook*` : undefined,
    embeds: [
      {
        title: `✅ Teste de Webhook: ${webhook.name}`,
        description: `Este é um teste de transmissão em tempo real enviado pelo **Módulo Desenvolvedor** da plataforma **Twin Wheels** para validar a conectividade deste canal.\n\n> Se você está lendo esta mensagem, o webhook está configurado corretamente e pronto para despachar eventos automáticos!`,
        color: embedColor,
        fields: embedFields,
        footer: {
          text: webhook.footerText || "Twin Wheels RP • Sistema de Webhooks Discord",
          icon_url: webhook.footerIconUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
        },
        timestamp: webhook.showTimestamp !== false ? nowIso : undefined,
      },
    ],
  };

  try {
    // Adiciona ?wait=true para que a API do Discord retorne o objeto da mensagem com o ID
    const endpoint = webhook.url.includes("?")
      ? `${webhook.url}&wait=true`
      : `${webhook.url}?wait=true`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 204 || res.status === 200) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      return {
        success: true,
        message: `Embed de teste entregue com sucesso no Discord! ${webhook.channelName ? `(Canal: ${webhook.channelName})` : ""}`,
        channelId: data?.channel_id,
        messageId: data?.id,
      };
    } else {
      let errorDetail = `Código HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson?.message) {
          errorDetail = `${errJson.message} (Código: ${errJson.code || res.status})`;
        }
      } catch {}

      if (res.status === 404) {
        errorDetail = "Webhook não encontrado no Discord (404). Verifique se o canal ou o webhook foi excluído no servidor.";
      } else if (res.status === 401 || res.status === 403) {
        errorDetail = "Token de webhook não autorizado ou inválido (401/403). Gere uma nova URL de webhook no Discord.";
      } else if (res.status === 429) {
        errorDetail = "Limite de taxa atingido (Rate Limit - 429). Aguarde alguns instantes antes de reenviar.";
      }

      return {
        success: false,
        message: `Falha ao enviar para o Discord: ${errorDetail}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Erro de conexão ou CORS ao enviar webhook: ${err?.message || "Verifique a URL e sua conexão com a internet."}`,
    };
  }
}

export interface WebhookDispatchPayload {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  color?: string;
  authorName?: string;
  authorIconUrl?: string;
  url?: string;
  customContent?: string;
}

/**
 * Despacha um evento para todos os webhooks ativos inscritos nessa categoria
 */
export async function dispatchDiscordWebhookEvent(
  eventType: DiscordWebhookEventType,
  data: WebhookDispatchPayload
): Promise<{ dispatchedCount: number; errors: string[] }> {
  try {
    const config = await getDiscordWebhooksConfig();
    if (!config.enabled) {
      return { dispatchedCount: 0, errors: [] };
    }

    // Filtra webhooks ativos inscritos neste evento
    const activeWebhooks = config.webhooks.filter(
      (w) => w.enabled && w.url && w.events.includes(eventType)
    );

    if (activeWebhooks.length === 0) {
      return { dispatchedCount: 0, errors: [] };
    }

    const errors: string[] = [];
    let successCount = 0;

    const promises = activeWebhooks.map(async (webhook) => {
      try {
        const embedColor = hexToInt(data.color || webhook.embedColor || WEBHOOK_EVENTS_META[eventType]?.defaultColor || "#10B981");
        const nowIso = new Date().toISOString();

        const payload = {
          username: webhook.username || config.defaultUsername || "Twin Wheels RP",
          avatar_url: webhook.avatarUrl || config.defaultAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
          content: data.customContent || (webhook.mentionRoles?.trim() ? webhook.mentionRoles.trim() : undefined),
          embeds: [
            {
              title: data.title,
              description: data.description,
              url: data.url,
              color: embedColor,
              fields: data.fields || [],
              author: data.authorName
                ? {
                    name: data.authorName,
                    icon_url: data.authorIconUrl,
                  }
                : undefined,
              footer: {
                text: webhook.footerText || config.defaultFooterText || "Twin Wheels RP",
                icon_url: webhook.footerIconUrl || config.defaultAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
              },
              timestamp: webhook.showTimestamp !== false ? nowIso : undefined,
            },
          ],
        };

        const res = await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok || res.status === 204) {
          successCount++;
          webhook.lastTriggeredAt = nowIso;
          webhook.lastStatus = "success";
          delete webhook.lastErrorMessage;
        } else {
          const errTxt = `HTTP ${res.status}`;
          webhook.lastStatus = "error";
          webhook.lastErrorMessage = errTxt;
          errors.push(`${webhook.name}: ${errTxt}`);
        }
      } catch (err: any) {
        const errTxt = err?.message || "Erro desconhecido";
        webhook.lastStatus = "error";
        webhook.lastErrorMessage = errTxt;
        errors.push(`${webhook.name}: ${errTxt}`);
      }
    });

    await Promise.allSettled(promises);

    // Salva silenciosamente o status atualizado no localStorage
    try {
      localStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(config));
    } catch {}

    return { dispatchedCount: successCount, errors };
  } catch (err: any) {
    console.warn("Falha geral ao despachar webhook do Discord:", err);
    return { dispatchedCount: 0, errors: [err?.message || "Falha geral"] };
  }
}
