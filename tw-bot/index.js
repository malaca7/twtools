require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, Events } = require("discord.js");
const { createClient } = require("@supabase/supabase-js");
const http = require("http");
const { initLiveStreamEngine, getLiveStreamEngine } = require("./liveStreamEngine");
const { initStockEngine } = require("./stockEngine");
const {
  isSpamOrMalicious,
  checkRateLimit,
  isDuplicateFlood,
  isAuthorizedApiRequest,
  recordBlockedSpam,
  initDynamicAntiSpam,
  getActiveAntiSpamConfig,
} = require("./securityShield");

// Handlers globais de resiliência para evitar que o processo Node caia
process.on("unhandledRejection", (reason) => {
  console.warn("⚠️ [UNHANDLED REJECTION]:", reason?.message || reason);
});
process.on("uncaughtException", (err) => {
  console.error("❌ [UNCAUGHT EXCEPTION]:", err.message || err);
});

// Token ativo do Discord em memória (inicia com .env ou será atualizado do banco)
let currentBotToken = (process.env.DISCORD_BOT_TOKEN || "").trim();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("ERRO: Supabase credenciais (URL ou SERVICE_ROLE_KEY) não configuradas no .env");
  process.exit(1);
}

// Initialize Supabase Client with Service Role (Bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Neon PostgreSQL Pool if DATABASE_URL is set
const { Pool } = require("pg");
let neonPool = null;
if (process.env.DATABASE_URL) {
  try {
    neonPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
    console.log("🐘 [POSTGRES] Pool de conexões PostgreSQL Supabase inicializado com sucesso!");
  } catch (poolErr) {
    console.warn("⚠️ Falha ao inicializar pool PostgreSQL:", poolErr.message);
  }
}

// Initialize Discord Client with all required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Cache global de membros, produtos e baús para enriquecer logs em tempo real
let membersCache = new Map();
let productsCache = new Map();
let bausCache = new Map();
const processedTestIds = new Set();
const processedLogIds = new Set();
const recentSemanticEvents = new Map(); // chaveSemantica -> timestampMs (janela deslizante)
let lastAuditLogPollTimestamp = new Date(Date.now() - 30000).toISOString();
let testSharedChannel = null;

/**
 * Configuração padrão do Discord & Bot (100% direta via IDs dos Canais do Bot)
 */
let discordConfig = {
  enabled: true,
  guildId: "",
  guildName: "Twin Wheels RP",
  botStatusText: "Twin Wheels • Logs em Tempo Real",
  botActivityType: "Watching",
  footerText: "Twin Wheels RP • Sistema Integrado de Logs",
  footerIconUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
  botAvatarUrl: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
  logChannels: {
    generalLogsChannelId: "",
    stockMovementsChannelId: "",
    salesChannelId: "",
    cashFundChannelId: "",
    membersChannelId: "",
    goalsChannelId: "",
    announcementsChannelId: "",
    systemChannelId: "",
  },
  enabledEvents: {
    logins: true,
    stockMovements: true,
    sales: true,
    cashFund: true,
    members: true,
    roles: true,
    goals: true,
    announcements: true,
    forcePurge: true,
    systemErrors: true,
    pageViews: false,
  },
  embedColors: {
    sales: "#10B981",
    movements: "#0284C7",
    cashFund: "#F59E0B",
    members: "#8B5CF6",
    roles: "#6366F1",
    goals: "#EC4899",
    announcements: "#EAB308",
    system: "#06B6D4",
    errors: "#EF4444",
    logins: "#10B981",
  },
};

/**
 * Carrega a configuração do Discord do banco de dados Supabase
 */
async function loadDiscordConfig() {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "system_discord_config")
      .maybeSingle();

    if (!error && data?.permissions && typeof data.permissions === "object") {
      const dbToken = data.permissions.botToken ? String(data.permissions.botToken).trim() : "";

      discordConfig = {
        ...discordConfig,
        ...data.permissions,
        logChannels: {
          ...discordConfig.logChannels,
          ...(data.permissions.logChannels || {}),
        },
        enabledEvents: {
          ...discordConfig.enabledEvents,
          ...(data.permissions.enabledEvents || {}),
        },
        embedColors: {
          ...discordConfig.embedColors,
          ...(data.permissions.embedColors || {}),
        },
      };
      console.log("⚙️ [DISCORD CONFIG] Configurações de canais e eventos atualizadas do banco de dados.");

      // Se houver token válido no banco diferente do token atualmente logado, reconecta automaticamente
      if (dbToken && dbToken.length > 20 && dbToken !== currentBotToken) {
        console.log("🔑 [DISCORD AUTH] Novo token detectado na configuração. Reconectando ao Discord...");
        currentBotToken = dbToken;
        if (client) {
          try {
            client.destroy();
          } catch {}
        }
        setTimeout(() => {
          client.login(currentBotToken).catch((err) => {
            console.error("❌ [DISCORD AUTH] Falha ao logar com o novo token:", err.message);
          });
        }, 1500);
      }

      updateBotPresence();
      if (discordConfig.botAvatarUrl || discordConfig.botBannerUrl) {
        syncDiscordBotProfile(discordConfig.botAvatarUrl, discordConfig.botBannerUrl, false).catch((err) => {
          console.warn("⚠️ [AUTO SYNC BOT PROFILE] Aviso ao sincronizar perfil do bot:", err.message);
        });
      }
    }
  } catch (err) {
    console.warn("⚠️ [DISCORD CONFIG] Não foi possível carregar configurações:", err.message);
  }
}

/**
 * Atualiza o status/presença do bot no Discord
 */
function updateBotPresence() {
  if (!client || !client.isReady() || !client.user) {
    console.warn("⚠️ [PRESENCE] Cliente Discord ainda não está pronto para atualizar presença.");
    return false;
  }
  try {
    const typeStr = (discordConfig.botActivityType || "Playing").trim();
    const statusText = (discordConfig.botStatusText || "by malaca").trim();
    const streamingUrl = (discordConfig.botStreamingUrl || "").trim();

    const rawStatus = (discordConfig.botStatus || "online").toLowerCase();
    const presenceStatus =
      rawStatus === "idle"
        ? "idle"
        : rawStatus === "dnd"
        ? "dnd"
        : rawStatus === "invisible"
        ? "invisible"
        : "online";

    let activities = [];

    if (typeStr === "Custom" || typeStr === "None") {
      if (statusText) {
        activities = [
          {
            name: statusText,
            state: statusText,
            type: ActivityType.Custom,
          },
        ];
      }
    } else {
      let actType = ActivityType.Playing;
      if (typeStr === "Watching") actType = ActivityType.Watching;
      else if (typeStr === "Listening") actType = ActivityType.Listening;
      else if (typeStr === "Competing") actType = ActivityType.Competing;
      else if (typeStr === "Streaming") actType = ActivityType.Streaming;
      else if (typeStr === "Playing") actType = ActivityType.Playing;

      const activityObj = {
        name: statusText || "Twin Wheels RP • Logs",
        type: actType,
      };
      if (actType === ActivityType.Streaming) {
        activityObj.url = streamingUrl || "https://twitch.tv/twinwheels";
      }
      activities = [activityObj];
    }

    client.user.setPresence({
      activities,
      status: presenceStatus,
    });

    const actLog = activities.length > 0
      ? `[${typeStr}] "${activities[0].name || activities[0].state || statusText}"`
      : "Nenhuma atividade";
    console.log(`🎮 [PRESENCE] Presença atualizada no Discord: Status=[${presenceStatus}] | Atividade=${actLog}`);
    return true;
  } catch (err) {
    console.warn("⚠️ [PRESENCE] Erro ao atualizar presença do bot:", err.message);
    return false;
  }
}

let lastAppliedBotAvatarUrl = "";
let lastAppliedBotBannerUrl = "";
let lastProfileUpdateTimestamp = 0;

/**
 * Atualiza Avatar e/ou Banner do Bot oficial diretamente na API oficial do Discord (/users/@me).
 * Suporta links do Postimages (https://i.postimg.cc/...), URLs externas e Base64.
 */
async function syncDiscordBotProfile(avatarUrl, bannerUrl, force = false) {
  if (!client || !client.isReady() || !client.user || !client.token) {
    console.warn("⚠️ [BOT PROFILE] Cliente Discord não está pronto para atualizar perfil.");
    return { success: false, error: "Bot não está conectado ao Discord" };
  }

  const now = Date.now();
  if (!force && now - lastProfileUpdateTimestamp < 10000) {
    console.log("⏳ [BOT PROFILE] Aguardando janela de segurança anti-rate-limit do Discord...");
    return { success: false, error: "Rate limit: aguarde 10 segundos antes de tentar novamente" };
  }

  const body = {};
  let avatarChanged = false;
  let bannerChanged = false;

  // 1. Processa Avatar do Bot
  if (avatarUrl && typeof avatarUrl === "string" && avatarUrl.trim()) {
    const cleanAv = avatarUrl.trim();
    if (force || cleanAv !== lastAppliedBotAvatarUrl) {
      try {
        console.log(`🖼️ [BOT PROFILE] Processando avatar para atualizar no Discord: ${cleanAv.slice(0, 80)}...`);
        if (cleanAv.startsWith("data:")) {
          body.avatar = cleanAv;
          avatarChanged = true;
        } else {
          let targetUrl = cleanAv;
          if (targetUrl.includes("/api/image?url=")) {
            try {
              const parsed = new URL(targetUrl);
              const param = parsed.searchParams.get("url");
              if (param) targetUrl = decodeURIComponent(param);
            } catch {}
          }
          const avRes = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": "https://postimages.org/",
              "Accept": "image/*,*/*;q=0.8",
            },
          });
          if (avRes.ok) {
            const avBuf = await avRes.arrayBuffer();
            const avMime = avRes.headers.get("content-type") || "image/png";
            const avBase64 = Buffer.from(avBuf).toString("base64");
            body.avatar = `data:${avMime.split(";")[0]};base64,${avBase64}`;
            avatarChanged = true;
          } else {
            console.warn(`⚠️ [BOT PROFILE] Falha ao baixar avatar (${avRes.status}): ${cleanAv}`);
          }
        }
      } catch (avErr) {
        console.warn("⚠️ [BOT PROFILE] Erro ao converter avatar para base64:", avErr.message);
      }
    }
  }

  // 2. Processa Banner do Bot
  if (bannerUrl && typeof bannerUrl === "string" && bannerUrl.trim()) {
    const cleanBn = bannerUrl.trim();
    if (force || cleanBn !== lastAppliedBotBannerUrl) {
      try {
        console.log(`🎨 [BOT PROFILE] Processando banner para atualizar no Discord: ${cleanBn.slice(0, 80)}...`);
        if (cleanBn.startsWith("data:")) {
          body.banner = cleanBn;
          bannerChanged = true;
        } else {
          let targetUrl = cleanBn;
          if (targetUrl.includes("/api/image?url=")) {
            try {
              const parsed = new URL(targetUrl);
              const param = parsed.searchParams.get("url");
              if (param) targetUrl = decodeURIComponent(param);
            } catch {}
          }
          const bnRes = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": "https://postimages.org/",
              "Accept": "image/*,*/*;q=0.8",
            },
          });
          if (bnRes.ok) {
            const bnBuf = await bnRes.arrayBuffer();
            const bnMime = bnRes.headers.get("content-type") || "image/png";
            const bnBase64 = Buffer.from(bnBuf).toString("base64");
            body.banner = `data:${bnMime.split(";")[0]};base64,${bnBase64}`;
            bannerChanged = true;
          } else {
            console.warn(`⚠️ [BOT PROFILE] Falha ao baixar banner (${bnRes.status}): ${cleanBn}`);
          }
        }
      } catch (bnErr) {
        console.warn("⚠️ [BOT PROFILE] Erro ao converter banner para base64:", bnErr.message);
      }
    }
  }

  if (!avatarChanged && !bannerChanged) {
    return { success: true, message: "Avatar e banner já estão sincronizados com o Discord." };
  }

  try {
    console.log("🚀 [BOT PROFILE] Enviando PATCH /users/@me para o Discord:", {
      avatar: avatarChanged ? "atualizando" : "inalterado",
      banner: bannerChanged ? "atualizando" : "inalterado",
    });

    let result;
    if (avatarChanged && bannerChanged) {
      try {
        result = await client.rest.patch("/users/@me", { body });
      } catch (combinedErr) {
        console.warn("⚠️ PATCH /users/@me com banner falhou (provável restrição Discord em contas de bot). Tentando atualizar apenas avatar:", combinedErr.message);
        result = await client.rest.patch("/users/@me", { body: { avatar: body.avatar } });
        bannerChanged = false;
      }
    } else {
      try {
        result = await client.rest.patch("/users/@me", { body });
      } catch (patchErr) {
        if (bannerChanged && !avatarChanged) {
          console.warn("⚠️ Discord rejeitou alteração de banner para conta de bot:", patchErr.message);
          return {
            success: true,
            avatarUpdated: false,
            bannerUpdated: false,
            message: "Discord não permite customização de banner nesta conta de bot, mas foi salvo no painel.",
          };
        }
        throw patchErr;
      }
    }

    lastProfileUpdateTimestamp = Date.now();

    if (avatarChanged) lastAppliedBotAvatarUrl = avatarUrl;
    if (bannerChanged) lastAppliedBotBannerUrl = bannerUrl;

    console.log("✅ [BOT PROFILE] Perfil do bot atualizado com sucesso no Discord!", {
      avatarHash: result?.avatar,
      bannerHash: result?.banner,
    });

    return {
      success: true,
      avatarUpdated: avatarChanged,
      bannerUpdated: bannerChanged,
      avatarHash: result?.avatar,
      bannerHash: result?.banner,
    };
  } catch (discordErr) {
    console.error("❌ [BOT PROFILE] Erro na API do Discord ao atualizar perfil:", discordErr.message, discordErr.rawError);
    return {
      success: false,
      error: discordErr.message || "Erro na API do Discord ao atualizar perfil",
    };
  }
}

/**
 * Atualiza caches auxiliares (produtos, baús, perfis)
 */
async function refreshAuxiliaryCaches() {
  try {
    if (neonPool) {
      const [profilesRes, productsRes, bausRes] = await Promise.all([
        neonPool.query("SELECT id, user_id, nome, nickname, discord_id, discord_avatar_url, avatar_url, discord_username FROM profiles"),
        neonPool.query("SELECT id, nome, categoria_id, preco_sugerido FROM products"),
        neonPool.query("SELECT id, nome FROM baus"),
      ]);

      if (profilesRes.rows) {
        membersCache.clear();
        for (const m of profilesRes.rows) {
          if (m.user_id) membersCache.set(m.user_id, m);
          if (m.id) membersCache.set(m.id, m);
        }
      }

      if (productsRes.rows) {
        productsCache.clear();
        for (const p of productsRes.rows) {
          productsCache.set(p.id, p);
        }
      }

      if (bausRes.rows) {
        bausCache.clear();
        for (const b of bausRes.rows) {
          bausCache.set(b.id, b);
        }
      }
      return;
    }

    const [profilesRes, productsRes, bausRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, nome, nickname, discord_id, discord_avatar_url, avatar_url, discord_username"),
      supabase.from("products").select("id, nome, categoria_id, preco_sugerido"),
      supabase.from("baus").select("id, nome"),
    ]);

    if (profilesRes.data) {
      membersCache.clear();
      for (const m of profilesRes.data) {
        if (m.user_id) membersCache.set(m.user_id, m);
        if (m.id) membersCache.set(m.id, m);
      }
    }

    if (productsRes.data) {
      productsCache.clear();
      for (const p of productsRes.data) {
        productsCache.set(p.id, p);
      }
    }

    if (bausRes.data) {
      bausCache.clear();
      for (const b of bausRes.data) {
        bausCache.set(b.id, b);
      }
    }
  } catch (err) {
    console.warn("⚠️ Erro ao atualizar caches auxiliares:", err.message);
  }
}

/**
 * Converte Hex string para número inteiro aceito pelo EmbedBuilder
 */
function hexToInt(hex) {
  if (!hex) return 0x10b981;
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return isNaN(num) ? 0x10b981 : num;
}

/**
 * Formata valores numéricos para moeda BRL
 */
function currency(val) {
  const n = Number(val) || 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

/**
 * Formata quantidades numéricas
 */
function num(val) {
  const n = Number(val) || 0;
  return new Intl.NumberFormat("pt-BR").format(n);
}

/**
 * Determina a categoria e os metadados visuais do Embed para cada log
 */
function parseAuditLogForDiscord(log) {
  const action = log.action || "";
  const data = log.new_data || log.old_data || {};
  const old = log.old_data || {};

  // Não emitir mensagens para o Discord quando forem alterações de configurações da plataforma
  const lowerAction = action.toLowerCase();
  if (
    lowerAction.includes("config") ||
    lowerAction.includes("setting") ||
    lowerAction.includes("permission") ||
    lowerAction.includes("menu") ||
    lowerAction.startsWith("dev_") ||
    lowerAction.startsWith("update_bau") ||
    lowerAction.startsWith("create_bau") ||
    lowerAction.startsWith("delete_bau")
  ) {
    return null;
  }


  // Busca dados do autor
  let actorName = "Sistema";
  let actorAvatar = null;
  let actorDiscordId = null;

  if (log.user_id && membersCache.has(log.user_id)) {
    const mem = membersCache.get(log.user_id);
    actorName = mem.nickname ? `${mem.nickname} (${mem.nome})` : mem.nome;
    actorAvatar = mem.discord_avatar_url || mem.avatar_url || null;
    actorDiscordId = mem.discord_id || null;
  } else if (data.user_nickname || data.user_name) {
    actorName = data.user_nickname || data.user_name;
    actorDiscordId = data.discord_id || null;
  }

  const actorMention = actorDiscordId ? `<@${actorDiscordId}> (${actorName})` : `**${actorName}**`;

  let category = "system";
  let title = "Registro de Atividade";
  let description = `Ação registrada na plataforma por ${actorMention}.`;
  let color = discordConfig.embedColors.system || "#06B6D4";
  let fields = [];

  switch (action) {
    case "batch_movement":
    case "view_log_detail":
    case "page_view":
    case "update_discord_stock_config":
    case "update_discord_config":
    case "save_role_permissions":
    case "dev_config_update":
    case "update_dev_menu_config":
    case "update_system_config":
    case "system_dev_menu_config":
      // Ignora logs internos e de configurações que não devem gerar embed no Discord
      return null;

    // 0. TESTE DE CONEXÃO DIRETO VIA BOT
    case "test_discord_log": {
      category = "system";
      color = "#6366F1";
      const catName = data.category_name || "Logs Gerais";
      title = `🧪 Teste de Conexão: #${catName}`;
      description = `Este é um disparo de teste enviado diretamente do **Painel Dev da Twin Wheels** pelo **Bot oficial do Discord** (sem webhook).`;
      fields = [
        { name: "🏷️ Categoria de Teste", value: `\`${catName}\``, inline: true },
        { name: "🤖 Disparador", value: "`Twin Wheels Bot (Direto)`", inline: true },
        { name: "👤 Solicitante", value: actorMention, inline: true },
        ...(data.notes ? [{ name: "📝 Notas", value: String(data.notes), inline: false }] : []),
      ];
      break;
    }

    // 1. VENDAS
    case "create_sale": {
      category = "sales";
      color = discordConfig.embedColors.sales || "#10B981";
      const qty = num(data.quantity);
      const total = currency(data.total_price);
      let prodName = data.product_name;
      if (!prodName || /^[0-9a-fA-F-]{36}$/.test(prodName)) {
        prodName = productsCache.get(data.product_id)?.nome || "Insumo";
      }

      title = "💰 Venda Realizada com Sucesso";
      description = `O vendedor ${actorMention} concluiu a venda de **${qty}x ${prodName}** pelo valor total de **${total}**.`;
      fields = [
        { name: "📦 Produto / Item", value: `${qty}x ${prodName}`, inline: true },
        { name: "💵 Valor Total", value: `\`${total}\``, inline: true },
        { name: "👤 Vendedor", value: actorMention, inline: true },
        ...(data.buyer_name ? [{ name: "🤝 Comprador", value: String(data.buyer_name), inline: true }] : []),
        ...(data.bau_name ? [{ name: "🗄️ Baú de Origem", value: String(data.bau_name), inline: true }] : []),
      ];
      break;
    }

    case "reverse_sale": {
      category = "sales";
      color = discordConfig.embedColors.errors || "#EF4444";
      title = "↩️ Estorno de Venda";
      description = `O gestor ${actorMention} estornou a venda ${data.total_price ? `no valor de **${currency(data.total_price)}**` : ""}.${data.reason ? ` Motivo: "${data.reason}".` : ""}`;
      fields = [
        { name: "👤 Responsável", value: actorMention, inline: true },
        ...(data.total_price ? [{ name: "💵 Valor Estornado", value: `\`${currency(data.total_price)}\``, inline: true }] : []),
        ...(data.reason ? [{ name: "📝 Motivo", value: String(data.reason), inline: false }] : []),
      ];
      break;
    }

    // 2. ESTOQUE & MOVIMENTAÇÕES
    case "create_movement": {
      category = "stockMovements";
      const isEntrada = data.type === "entrada";
      color = isEntrada ? (discordConfig.embedColors.movements || "#0284C7") : "#F43F5E";
      const typeLabel = isEntrada ? "Entrada (+)" : "Saída (-)";
      const qty = num(data.quantity);

      let prodName = data.product_name;
      if (!prodName || /^[0-9a-fA-F-]{36}$/.test(prodName)) {
        prodName = productsCache.get(data.product_id)?.nome || "Item";
      }
      const bauName = data.bau_name || bausCache.get(data.bau_id)?.nome || "Baú Geral";

      title = isEntrada ? "📥 Entrada de Estoque" : "📤 Saída de Estoque";
      description = `O membro ${actorMention} registrou uma **${typeLabel.toLowerCase()}** de **${qty}x ${prodName}** no **${bauName}**.`;
      fields = [
        { name: "📦 Item", value: `${qty}x ${prodName}`, inline: true },
        { name: "🔄 Operação", value: `\`${typeLabel}\``, inline: true },
        { name: "🗄️ Baú", value: bauName, inline: true },
        { name: "👤 Responsável", value: actorMention, inline: true },
        ...(data.resulting_balance !== undefined ? [{ name: "📊 Saldo Resultante", value: `\`${num(data.resulting_balance)} un\``, inline: true }] : []),
        ...(data.chest_balance !== undefined && data.resulting_balance === undefined ? [{ name: "📊 Saldo Baú", value: `\`${num(data.chest_balance)} un\``, inline: true }] : []),
        ...(data.reason ? [{ name: "📝 Motivo / Observação", value: String(data.reason), inline: false }] : []),
      ];
      break;
    }

    case "transfer_between_chests": {
      category = "stockMovements";
      color = "#38BDF8";
      const prod = data.product_name || productsCache.get(data.product_id)?.nome || "Item";
      const from = data.from_bau_name || "Baú Origem";
      const to = data.to_bau_name || "Baú Destino";
      const qty = num(data.quantity);

      title = "🔀 Transferência Entre Baús";
      description = `O membro ${actorMention} transferiu **${qty}x ${prod}** do **${from}** para o **${to}**.`;
      fields = [
        { name: "📦 Item Transferido", value: `${qty}x ${prod}`, inline: true },
        { name: "🛫 De", value: from, inline: true },
        { name: "🛬 Para", value: to, inline: true },
        { name: "👤 Responsável", value: actorMention, inline: true },
        ...(data.reason ? [{ name: "📝 Motivo", value: String(data.reason), inline: false }] : []),
      ];
      break;
    }

    case "reverse_movement": {
      category = "stockMovements";
      color = discordConfig.embedColors.cashFund || "#F59E0B";
      title = "↩️ Estorno de Movimentação de Estoque";
      description = `O gestor ${actorMention} estornou um lançamento prévio de estoque, restaurando o saldo do baú.`;
      fields = [{ name: "👤 Responsável", value: actorMention, inline: true }];
      break;
    }

    // 3. FUNDO DE CAIXA
    case "create_cash_movement": {
      category = "cashFund";
      const isEntrada = data.type === "entrada";
      color = isEntrada ? (discordConfig.embedColors.cashFund || "#F59E0B") : "#EF4444";
      const valor = currency(data.amount);
      const typeLabel = isEntrada ? "Depósito / Entrada (+)" : "Retirada / Saída (-)";

      title = isEntrada ? "🏦 Depósito no Fundo de Caixa" : "💸 Retirada do Fundo de Caixa";
      description = `O responsável ${actorMention} realizou uma movimentação de **${valor}** no Fundo de Caixa do Grupo.`;
      fields = [
        { name: "💵 Valor Movimentado", value: `\`${valor}\``, inline: true },
        { name: "🔄 Tipo", value: `\`${typeLabel}\``, inline: true },
        { name: "👤 Responsável", value: actorMention, inline: true },
        ...(data.resulting_balance !== undefined ? [{ name: "💰 Saldo do Caixa", value: `\`${currency(data.resulting_balance)}\``, inline: true }] : []),
        ...(data.motive ? [{ name: "📝 Motivo", value: String(data.motive), inline: false }] : []),
      ];
      break;
    }

    case "reverse_cash_movement":
    case "delete_cash_movement": {
      category = "cashFund";
      color = "#EF4444";
      title = "↩️ Ajuste / Estorno no Fundo de Caixa";
      description = `O responsável ${actorMention} estornou ou removeu um lançamento de caixa${data.amount ? ` no valor de **${currency(data.amount)}**` : ""}.`;
      fields = [
        { name: "👤 Responsável", value: actorMention, inline: true },
        ...(data.reason || data.motive ? [{ name: "📝 Motivo", value: String(data.reason || data.motive), inline: false }] : []),
      ];
      break;
    }

    // 4. MEMBROS, CADASTROS & PERFIL
    case "submit_signup": {
      category = "members";
      color = "#38BDF8";
      const nomePlayer = data.nome || "Novo Jogador";
      title = "📝 Nova Solicitação de Cadastro";
      description = `O jogador **${nomePlayer}**${data.game_id ? ` (ID: \`${data.game_id}\`)` : ""} enviou uma solicitação de entrada para o grupo.`;
      fields = [
        { name: "👤 Nome do Jogador", value: nomePlayer, inline: true },
        ...(data.game_id ? [{ name: "🎮 ID / Passaporte", value: `\`${data.game_id}\``, inline: true }] : []),
        ...(data.telefone ? [{ name: "📱 Telefone", value: String(data.telefone), inline: true }] : []),
      ];
      break;
    }

    case "approve_signup": {
      category = "members";
      color = discordConfig.embedColors.members || "#8B5CF6";
      const targetName = data.nome || data.applicant_name || "Novo Membro";
      title = "✅ Membro Aprovado no Grupo";
      description = `O gestor ${actorMention} **aprovou** a entrada do membro **${targetName}** na Twin Wheels.`;
      fields = [
        { name: "👤 Novo Membro", value: targetName, inline: true },
        { name: "👑 Aprovado Por", value: actorMention, inline: true },
      ];
      break;
    }

    case "reject_signup": {
      category = "members";
      color = "#EF4444";
      const targetName = data.nome || data.applicant_name || "Candidato";
      title = "❌ Solicitação de Cadastro Recusada";
      description = `O gestor ${actorMention} **rejeitou** a solicitação de **${targetName}**.`;
      fields = [
        { name: "👤 Candidato", value: targetName, inline: true },
        { name: "👑 Avaliado Por", value: actorMention, inline: true },
        ...(data.reason ? [{ name: "📝 Motivo da Recusa", value: String(data.reason), inline: false }] : []),
      ];
      break;
    }

    case "delete_member":
    case "delete_members": {
      category = "members";
      color = "#EF4444";
      const targetName = data.target_name || data.nome || "Membro";
      title = "🚫 Membro Desligado do Grupo";
      description = `O gestor ${actorMention} desligou **${targetName}** do grupo.`;
      fields = [
        { name: "👤 Membro Desligado", value: targetName, inline: true },
        { name: "👑 Responsável", value: actorMention, inline: true },
      ];
      break;
    }

    case "update_profile":
    case "update_member_details": {
      category = "members";
      color = "#8B5CF6";
      title = "✏️ Atualização de Perfil de Membro";
      description = `As informações cadastrais do membro **${data.target_name || actorName}** foram atualizadas.`;
      fields = [{ name: "👤 Atualizado Por", value: actorMention, inline: true }];
      break;
    }

    // 5. CARGOS & PERMISSÕES
    case "update_level": {
      category = "roles";
      color = discordConfig.embedColors.roles || "#6366F1";
      const novoCargo = data.new_level || data.nivel || "novo cargo";
      const cargoAntigo = data.old_level ? ` de \`${data.old_level}\`` : "";
      const targetName = data.target_name || "Membro";

      title = "👑 Alteração de Cargo / Patente";
      description = `O gestor ${actorMention} alterou a patente de **${targetName}**${cargoAntigo} para **${novoCargo}**.`;
      fields = [
        { name: "👤 Membro", value: targetName, inline: true },
        { name: "🎖️ Nova Patente", value: `\`${novoCargo}\``, inline: true },
        { name: "👑 Alterado Por", value: actorMention, inline: true },
      ];
      break;
    }

    case "save_custom_role":
    case "delete_custom_role":
    case "save_role_permissions": {
      category = "roles";
      color = "#6366F1";
      title = "🛡️ Gestão de Cargos e Permissões";
      description = `O administrador ${actorMention} atualizou a estrutura de cargos ou permissões do sistema.`;
      fields = [{ name: "👤 Administrador", value: actorMention, inline: true }];
      break;
    }

    // 6. METAS & DESEMPENHO
    case "create_goal":
    case "update_goal":
    case "delete_goal": {
      category = "goals";
      color = discordConfig.embedColors.goals || "#EC4899";
      const targetName = data.target_name || "Membro";
      const goalType = data.goal_type || "Meta";
      const goalVal = data.target_value ? num(data.target_value) : "—";

      title = action === "delete_goal" ? "🎯 Remoção de Meta" : "🎯 Definição de Meta";
      description = `O gestor ${actorMention} configurou a meta de **${goalType}** (Alvo: **${goalVal}**) para **${targetName}**.`;
      fields = [
        { name: "👤 Membro Alvo", value: targetName, inline: true },
        { name: "🎯 Tipo de Meta", value: goalType, inline: true },
        { name: "📊 Valor Alvo", value: `\`${goalVal}\``, inline: true },
        { name: "👑 Definido Por", value: actorMention, inline: true },
      ];
      break;
    }

    // 7. AVISOS & COMUNICADOS
    case "create_announcement":
    case "update_announcement":
    case "delete_announcement": {
      category = "announcements";
      color = discordConfig.embedColors.announcements || "#EAB308";
      const announcementTitle = data.title || "Comunicado Oficial";

      title = action === "delete_announcement" ? "📢 Comunicado Removido" : "📢 Novo Comunicado Oficial Publicado";
      description = `O gestor ${actorMention} publicou o aviso em destaque: **"${announcementTitle}"**.`;
      fields = [
        { name: "📋 Título do Aviso", value: announcementTitle, inline: true },
        { name: "👤 Autor", value: actorMention, inline: true },
        ...(data.content ? [{ name: "📄 Conteúdo", value: String(data.content).slice(0, 1000), inline: false }] : []),
      ];
      break;
    }

    // 7.1 POSTAGEM DIRETA VIA WEBHOOK / CANAL
    case "webhook_post_message": {
      category = "announcements";
      color = data.embed_color || discordConfig.embedColors.announcements || "#10B981";
      title = data.title || "📢 Comunicado Twin Wheels";
      description = data.description || (data.content ? String(data.content) : "Mensagem da equipe");
      fields = [];
      if (data.fields && Array.isArray(data.fields)) {
        for (const f of data.fields) {
          if (f && f.name && f.value) {
            fields.push({ name: String(f.name), value: String(f.value), inline: !!f.inline });
          }
        }
      }
      break;
    }

    // 8. LOGINS & SESSÕES
    case "login":
    case "session_start": {
      category = "logins";
      color = discordConfig.embedColors.logins || "#10B981";
      title = "🟢 Membro Conectado (Login)";
      description = `O membro ${actorMention} conectou-se na plataforma Twin Wheels.`;
      fields = [
        { name: "👤 Membro", value: actorMention, inline: true },
        { name: "🌐 Plataforma", value: "`Twin Wheels Web`", inline: true },
      ];
      break;
    }

    case "logout":
    case "session_end": {
      category = "logins";
      color = "#94A3B8";
      const duration = data.duration_formatted ? ` (Duração da sessão: \`${data.duration_formatted}\`)` : "";
      title = "🔴 Membro Desconectado (Logout)";
      description = `O membro ${actorMention} encerrou sua sessão na plataforma${duration}.`;
      fields = [{ name: "👤 Membro", value: actorMention, inline: true }];
      break;
    }

    // 9. LIMPEZA FORÇADA DE CACHE (PURGE)
    case "system_force_cache_purge": {
      category = "forcePurge";
      color = discordConfig.embedColors.system || "#06B6D4";
      title = "⚡ Ordem Global de Limpeza de Cache (Dev)";
      description = `Uma ordem de **limpeza forçada de cache e recarregamento** foi disparada pelo desenvolvedor ${actorMention}.`;
      fields = [
        { name: "👤 Emitido Por", value: actorMention, inline: true },
        { name: "🔄 Ação", value: "`Limpeza de Service Worker & Cache Storage`", inline: true },
        ...(data.reason ? [{ name: "📝 Motivo / Notas", value: String(data.reason), inline: false }] : []),
      ];
      break;
    }

    // 10. ERROS CRÍTICOS & ACESSOS NEGADOS
    case "access_denied":
    case "operation_error": {
      category = "systemErrors";
      color = discordConfig.embedColors.errors || "#EF4444";
      title = action === "access_denied" ? "⚠️ Tentativa de Acesso Negado" : "❌ Erro em Operação";
      description = `Falha registrada para o usuário ${actorMention}: ${data.error_message || data.page || "Recurso restrito"}.`;
      fields = [
        { name: "👤 Usuário", value: actorMention, inline: true },
        ...(data.error_message ? [{ name: "🚨 Detalhe do Erro", value: `\`${data.error_message}\``, inline: false }] : []),
      ];
      break;
    }

    default: {
      const cleanAction = action.replace(/_/g, " ");
      title = `📝 Log: ${cleanAction.toUpperCase()}`;
      description = `O usuário ${actorMention} executou a ação "${cleanAction}".`;
      fields = [{ name: "👤 Autor", value: actorMention, inline: true }];
    }
  }

  // Adiciona campo padrão de data e hora do Discord
  const createdTimestamp = log.created_at ? new Date(log.created_at).getTime() : Date.now();
  const discordUnixTime = Math.floor(createdTimestamp / 1000);
  fields.push({
    name: "📅 Horário Registrado",
    value: `<t:${discordUnixTime}:F> (<t:${discordUnixTime}:R>)`,
    inline: true,
  });

  return {
    category,
    title,
    description,
    color,
    fields,
    actorName,
    actorAvatar,
    createdTimestamp,
  };
}

/**
 * Responde a confirmação de teste de volta para o canal compartilhado
 */
async function respondTestResult(testId, result) {
  if (!testId || !testSharedChannel) return;
  try {
    await testSharedChannel.send({
      type: "broadcast",
      event: "test_result",
      payload: {
        test_id: testId,
        ...result,
      },
    });
  } catch (err) {
    console.warn("⚠️ Falha ao responder broadcast de teste:", err.message);
  }
}

/**
 * Gera uma chave semântica única para o evento baseada no conteúdo real da ação.
 * Essa chave não depende de divisões de timestamp rígidas ou de IDs voláteis,
 * garantindo que RPCs do banco e eventos do cliente sejam reconhecidos como idênticos.
 */
function getLogSemanticKey(log) {
  const action = log.action || "";
  const data = log.new_data || log.old_data || {};
  const userId = log.user_id || data.user_id || "";

  switch (action) {
    case "create_cash_movement": {
      const type = data.type || "";
      const amount = Number(data.amount || 0).toFixed(2);
      return `cash_${userId}_${type}_${amount}`;
    }
    case "reverse_cash_movement":
    case "delete_cash_movement": {
      const movId = data.movement_id || data.id || log.entity_id || "";
      const amount = Number(data.amount || 0).toFixed(2);
      return `${action}_${movId}_${amount}`;
    }
    case "create_movement": {
      const prodId = data.product_id || "";
      const type = data.type || "";
      const qty = Number(data.quantity || 0);
      return `mov_${userId}_${prodId}_${type}_${qty}`;
    }
    case "transfer_between_chests": {
      const prodId = data.product_id || "";
      const qty = Number(data.quantity || 0);
      return `transfer_${userId}_${prodId}_${qty}`;
    }
    case "create_sale": {
      const prodId = data.product_id || "";
      const qty = Number(data.quantity || 0);
      const total = Number(data.total_price || 0).toFixed(2);
      return `sale_${userId}_${prodId}_${qty}_${total}`;
    }
    case "reverse_sale": {
      const saleId = data.sale_id || data.id || log.entity_id || "";
      return `rev_sale_${saleId}`;
    }
    case "reverse_movement": {
      const movId = data.movement_id || data.id || log.entity_id || "";
      return `rev_mov_${movId}`;
    }
    case "approve_signup":
    case "reject_signup": {
      const target = data.target_id || log.entity_id || data.request_id || "";
      return `review_signup_${action}_${target}`;
    }
    case "submit_signup": {
      const pId = data.game_id || data.nome || userId;
      return `submit_signup_${pId}`;
    }
    case "update_level": {
      const target = data.target_id || log.entity_id || "";
      const newLvl = data.new_level || data.nivel || "";
      return `update_level_${target}_${newLvl}`;
    }
    case "delete_member":
    case "delete_members": {
      const target = data.target_id || data.user_id || log.entity_id || "";
      return `del_member_${target}`;
    }
    default: {
      const entId = log.entity_id || data.id || data.target_id || "";
      return `${action}_${userId}_${log.entity || ""}_${entId}`;
    }
  }
}

/**
 * Roteia e envia o embed do log diretamente para o canal do Discord através do Bot
 */
async function dispatchAuditLogToDiscord(log) {
  if (!discordConfig.enabled || !log) return;

  const testId = log?.test_id || log?.new_data?.test_id;
  if (testId) {
    if (processedTestIds.has(testId)) return;
    processedTestIds.add(testId);
    setTimeout(() => processedTestIds.delete(testId), 30000);
  }

  // Deduplicação inteligente de logs por janela deslizante semântica (evita disparos duplicados RPC + Broadcast + Polling)
  const isTest = log.action === "test_discord_log" || Boolean(testId);
  if (!isTest) {
    const semanticKey = getLogSemanticKey(log);
    const now = Date.now();

    // Limpeza de itens antigos (> 25s) na janela deslizante
    if (recentSemanticEvents.size > 300) {
      for (const [k, ts] of recentSemanticEvents.entries()) {
        if (now - ts > 25000) {
          recentSemanticEvents.delete(k);
        }
      }
    }

    // Se a mesma ação semântica já foi transmitida nos últimos 12 segundos, descarta como duplicata
    const lastSeen = recentSemanticEvents.get(semanticKey);
    if (lastSeen && (now - lastSeen < 12000)) {
      console.log(`🛡️ [DEDUP] Log duplicado descartado com sucesso: [${semanticKey}] (já transmitido há ${now - lastSeen}ms)`);
      return;
    }

    // Se temos um ID de banco já processado, descarta também
    if (log.id) {
      if (processedLogIds.has(log.id)) {
        console.log(`🛡️ [DEDUP] Log com ID ${log.id} já processado anteriormente. Descartando.`);
        return;
      }
      processedLogIds.add(log.id);
      if (processedLogIds.size > 2000) {
        const first = processedLogIds.values().next().value;
        processedLogIds.delete(first);
      }
    }

    recentSemanticEvents.set(semanticKey, now);
  }

  try {
    const parsed = parseAuditLogForDiscord(log);
    if (!parsed) return; // Ignora logs como batch_movement, view_log_detail, etc.

    // Se for log normal (não for teste), verifica se a categoria do evento está habilitada
    if (log.action !== "test_discord_log" && discordConfig.enabledEvents && discordConfig.enabledEvents[parsed.category] === false) {
      return;
    }

    // Se o log for de teste e trouxer channel_id explícito, usa ele
    const explicitChannelId = (log.new_data && log.new_data.channel_id) || (log.entity === "discord_channel_test" ? log.entity_id : null);

    // Mapeia canais específicos por categoria
    const channelMap = {
      sales: discordConfig.logChannels.salesChannelId,
      stockMovements: discordConfig.logChannels.stockMovementsChannelId,
      cashFund: discordConfig.logChannels.cashFundChannelId,
      members: discordConfig.logChannels.membersChannelId,
      roles: discordConfig.logChannels.membersChannelId,
      goals: discordConfig.logChannels.goalsChannelId,
      announcements: discordConfig.logChannels.announcementsChannelId,
      forcePurge: discordConfig.logChannels.systemChannelId,
      systemErrors: discordConfig.logChannels.systemChannelId,
      logins: discordConfig.logChannels.systemChannelId,
      system: discordConfig.logChannels.systemChannelId,
    };

    const targetChannelId = explicitChannelId || channelMap[parsed.category] || discordConfig.logChannels.generalLogsChannelId;

    if (!targetChannelId) {
      console.warn(`⚠️ [DISCORD LOG] Nenhum ID de canal configurado para [${parsed.category}] e nenhum canal geral definido.`);
      if (testId) {
        await respondTestResult(testId, {
          success: false,
          error_message: "Nenhum ID de canal do Discord foi informado.",
        });
      }
      return;
    }

    // Constrói o Discord Embed oficial usando EmbedBuilder
    const botImage = (discordConfig && discordConfig.botAvatarUrl) || "https://i.ibb.co/ymH1BQPQ/Uma124.png";
    const footerIcon = (discordConfig && discordConfig.footerIconUrl) || botImage;

    const embed = new EmbedBuilder()
      .setTitle(parsed.title)
      .setDescription(parsed.description)
      .setColor(hexToInt(parsed.color))
      .setTimestamp(parsed.createdTimestamp)
      .setFooter({
        text: (discordConfig && discordConfig.footerText) || "Twin Wheels RP • Sistema de Logs",
        iconURL: footerIcon,
      });

    // Define a imagem configurada como Thumbnail (canto superior direito)
    if (botImage) {
      embed.setThumbnail(botImage);
    }

    if (parsed.actorName) {
      embed.setAuthor({
        name: parsed.actorName,
        iconURL: parsed.actorAvatar || botImage,
      });
    } else {
      embed.setAuthor({
        name: (discordConfig && discordConfig.guildName) || "Twin Wheels RP",
        iconURL: botImage,
      });
    }

    if (parsed.fields && parsed.fields.length > 0) {
      embed.addFields(parsed.fields);
    }

    // Se houver URL de imagem anexa, anexa ao embed
    if (log.new_data?.image_url && typeof log.new_data.image_url === "string" && log.new_data.image_url.startsWith("http")) {
      embed.setImage(log.new_data.image_url);
    }

    // Dispara diretamente através do Bot no canal especificado pelo ID
    if (client.isReady()) {
      try {
        const channel = await client.channels.fetch(targetChannelId).catch((err) => {
          console.warn(`⚠️ [DISCORD BOT] Não foi possível encontrar o canal ${targetChannelId}: ${err.message}`);
          return null;
        });

        if (channel && channel.isTextBased()) {
          const mentionText = log.new_data?.mention || undefined;
          const sentMsg = await channel.send({
            content: mentionText,
            embeds: [embed],
          });
          console.log(`📡 [DISCORD BOT] Embed entregue no canal #${channel.name || targetChannelId} (${targetChannelId}) [${parsed.category}] (ID: ${sentMsg.id})`);

          if (testId) {
            await respondTestResult(testId, {
              success: true,
              message_id: sentMsg.id,
              channel_name: channel.name,
              channel_id: targetChannelId,
            });
          }
        } else {
          const errMsg = `Canal ID ${targetChannelId} não é de texto ou o bot não tem permissão de visualização.`;
          console.warn(`⚠️ [DISCORD BOT] ${errMsg}`);
          if (testId) {
            await respondTestResult(testId, {
              success: false,
              error_message: errMsg,
            });
          }
        }
      } catch (err) {
        console.error(`❌ [DISCORD BOT] Falha ao enviar no canal ${targetChannelId}:`, err.message);
        if (testId) {
          await respondTestResult(testId, {
            success: false,
            error_message: err.message,
          });
        }
      }
    } else {
      console.warn("⚠️ [DISCORD BOT] Bot ainda não está conectado no Discord. Aguardando conexão...");
      if (testId) {
        await respondTestResult(testId, {
          success: false,
          error_message: "Bot está inicializando ou desconectado do Discord.",
        });
      }
    }
  } catch (err) {
    console.error("❌ [DISCORD LOG ERRO CRÍTICO]", err);
    if (testId) {
      await respondTestResult(testId, {
        success: false,
        error_message: err.message || String(err),
      });
    }
  }
}

/**
 * Polling de logs de auditoria — Desativado para prevenir sobrecarga no banco de dados
 */
async function pollUnprocessedAuditLogs() {
  return;
}

/**
 * Escuta em tempo real alterações de configuração no banco
 */
function setupRealtimeListeners() {
  console.log("⚡ [REALTIME] Conectando listeners de configuração no Supabase...");

  // Canal de postgres_changes para atualizações de configuração
  supabase
    .channel("config-changes-to-discord-bot")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "role_permissions",
      },
      (payload) => {
        if (payload?.new?.level === "system_discord_config") {
          console.log("🔄 [REALTIME] Alteração de configuração do Discord detectada no banco. Recarregando...");
          loadDiscordConfig();
        }
      }
    )
    .subscribe((status) => {
      console.log(`📡 [REALTIME STATUS] Canal de configurações status: ${status}`);
    });

  // 3. Canal de Broadcast para sincronização instantânea de configurações
  supabase
    .channel("system-discord-config-sync")
    .on("broadcast", { event: "discord_config_updated" }, (payload) => {
      if (payload?.payload) {
        console.log("⚡ [BROADCAST] Nova configuração do Discord recebida em tempo real!");
        const oldAvatar = discordConfig.botAvatarUrl;
        const oldBanner = discordConfig.botBannerUrl;
        discordConfig = {
          ...discordConfig,
          ...payload.payload,
        };
        updateBotPresence();

        if (discordConfig.botAvatarUrl !== oldAvatar || discordConfig.botBannerUrl !== oldBanner) {
          syncDiscordBotProfile(discordConfig.botAvatarUrl, discordConfig.botBannerUrl).catch((e) => {
            console.warn("⚠️ [BROADCAST] Falha ao sincronizar perfil do bot com o Discord:", e.message);
          });
        }
      }
    })
    .subscribe();

  // 4. Canal persistente compartilhado para testes instantâneos bidirecionais
  testSharedChannel = supabase.channel("system-discord-test-channel");
  testSharedChannel
    .on("broadcast", { event: "trigger_test" }, (payload) => {
      if (payload?.payload) {
        console.log("🧪 [TEST CHANNEL] Trigger de teste recebido:", payload.payload.test_id);
        dispatchAuditLogToDiscord(payload.payload);
      }
    })
    .subscribe((status) => {
      console.log(`📡 [TEST CHANNEL STATUS] status: ${status}`);
    });

  // 5. Canal de Controle de Ciclo de Vida do Bot (Start, Stop, Restart, Presence, Heartbeat Request)
  supabase
    .channel("system-discord-bot-control")
    .on("broadcast", { event: "request_heartbeat" }, async () => {
      console.log("📡 [BOT CONTROL] Requisição de Heartbeat recebida. Enviando servidores e status...");
      await sendHeartbeat();
    })
    .on("broadcast", { event: "bot_profile_updated" }, async (payload) => {
      const data = payload?.payload;
      console.log("🎨 [BOT CONTROL] Atualização de perfil do bot recebida:", data?.username || "Perfil atualizado");
      await loadDiscordConfig();
      if (typeof sendHeartbeat === "function") sendHeartbeat();
    })
    .on("broadcast", { event: "bot_command" }, async (payload) => {
      const data = payload?.payload;
      if (!data) return;
      console.log(`🤖 [BOT CONTROL] Comando recebido: "${data.action}" por ${data.actor || "Dev"}`);

      if (data.action === "restart") {
        console.log("🔄 [BOT CONTROL] Reinicialização do cliente Discord solicitada...");
        try {
          if (client) client.destroy();
        } catch (e) {
          console.warn("Aviso ao destruir cliente:", e.message);
        }
        setTimeout(async () => {
          try {
            await loadDiscordConfig();
            const tokenToUse = currentBotToken || process.env.DISCORD_BOT_TOKEN;
            if (tokenToUse) {
              await client.login(tokenToUse);
              console.log("✅ [BOT CONTROL] Cliente Discord reiniciado com sucesso!");
              setTimeout(sendHeartbeat, 1500);
            }
          } catch (e) {
            console.error("❌ [BOT CONTROL] Erro ao reconectar cliente:", e.message);
          }
        }, 1500);
      } else if (data.action === "stop") {
        console.log("⏹ [BOT CONTROL] Parada solicitada. Desconectando do Discord...");
        try {
          if (client) client.destroy();
        } catch (e) {
          console.error("Erro ao parar cliente:", e.message);
        }
        setTimeout(sendHeartbeat, 1000);
      } else if (data.action === "start") {
        console.log("▶ [BOT CONTROL] Inicialização solicitada. Conectando ao Discord...");
        try {
          if (!client.isReady()) {
            await loadDiscordConfig();
            const tokenToUse = currentBotToken || process.env.DISCORD_BOT_TOKEN;
            if (tokenToUse) {
              await client.login(tokenToUse);
              console.log("✅ [BOT CONTROL] Cliente Discord conectado com sucesso!");
              setTimeout(sendHeartbeat, 1500);
            }
          }
        } catch (e) {
          console.error("Erro ao iniciar cliente:", e.message);
        }
      }

      if (data.config) {
        discordConfig = { ...discordConfig, ...data.config };
        updateBotPresence();
      }
    })
    .on("broadcast", { event: "send_message" }, async (payload) => {
      const data = payload?.payload;
      if (!data || !data.channelId) return;
      console.log(`💬 [BOT CONTROL] Mensagem recebida para envio no canal ${data.channelId} por ${data.sender || "CEO"}`);
      try {
        const spamCheck = isSpamOrMalicious(data.content, data.embed ? [data.embed] : []);
        if (spamCheck.isBlocked) {
          console.warn(`🚨 [ANTI-SPAM SHIELD] Broadcast send_message descartado por spam: ${spamCheck.reason}`);
          return;
        }

        const targetChannel =
          client.channels.cache.get(data.channelId) ||
          (await client.channels.fetch(data.channelId).catch(() => null));

        if (!targetChannel || !targetChannel.isTextBased()) {
          console.warn(`⚠️ [BOT CONTROL] Canal ${data.channelId} não encontrado ou não é canal de texto.`);
          return;
        }

        const msgOptions = {};
        if (data.content && data.content.trim()) {
          msgOptions.content = data.content.trim();
        }

        if (data.embed && typeof data.embed === "object") {
          const eb = new EmbedBuilder();
          if (data.embed.title) eb.setTitle(data.embed.title);
          if (data.embed.url) eb.setURL(data.embed.url);
          if (data.embed.description) eb.setDescription(data.embed.description);
          if (data.embed.color) {
            const c = typeof data.embed.color === "string" ? hexToInt(data.embed.color) : data.embed.color;
            eb.setColor(c);
          }
          if (data.embed.author && data.embed.author.name) {
            eb.setAuthor({
              name: data.embed.author.name,
              iconURL: data.embed.author.icon_url || data.embed.author.iconURL || undefined,
              url: data.embed.author.url || undefined,
            });
          }
          if (data.embed.thumbnail && data.embed.thumbnail.url) {
            eb.setThumbnail(data.embed.thumbnail.url);
          }
          if (data.embed.image && data.embed.image.url) {
            eb.setImage(data.embed.image.url);
          }
          if (data.embed.footer && data.embed.footer.text) {
            eb.setFooter({
              text: data.embed.footer.text,
              iconURL: data.embed.footer.icon_url || data.embed.footer.iconURL || undefined,
            });
          }
          if (data.embed.timestamp) {
            eb.setTimestamp(new Date(data.embed.timestamp));
          }
          if (Array.isArray(data.embed.fields) && data.embed.fields.length > 0) {
            for (const f of data.embed.fields) {
              if (f.name && f.value) {
                eb.addFields({ name: f.name, value: f.value, inline: Boolean(f.inline) });
              }
            }
          }
          msgOptions.embeds = [eb];
        }

        if (isDuplicateFlood(data.channelId, data.content, msgOptions.embeds)) {
          console.warn(`⚠️ [ANTI-FLOOD] Broadcast duplicado descartado para canal ${data.channelId}`);
          return;
        }

        await targetChannel.send(msgOptions);
        console.log(`✅ [BOT CONTROL] Mensagem enviada com sucesso no canal #${targetChannel.name} (${data.channelId})!`);
      } catch (err) {
        console.error(`❌ [BOT CONTROL] Falha ao enviar mensagem no canal ${data.channelId}:`, err.message);
      }
    })
    .subscribe((status) => {
      console.log(`📡 [BOT CONTROL CHANNEL STATUS] status: ${status}`);
    });

  // 6. Função de emissão de Heartbeat com lista completa e rica de servidores (guilds)
  const sendHeartbeat = async () => {
    try {
      const isOnline = client && client.isReady() && client.ws?.status === 0;
      const guildsList = isOnline && client.guilds?.cache
        ? Array.from(client.guilds.cache.values()).map((g) => {
            const iconUrl =
              g.iconURL({ size: 128, forceStatic: false }) ||
              (g.icon
                ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith("a_") ? "gif" : "png"}?size=128`
                : null);

            return {
              id: g.id,
              name: g.name,
              icon: g.icon,
              iconUrl,
              memberCount: g.memberCount || 0,
              isMain:
                g.id === (process.env.DISCORD_GUILD_ID || "1535505650308620400") ||
                g.name.toLowerCase().includes("twin wheel"),
            };
          })
        : [];

      const hbChannel = supabase.channel("system-discord-bot-heartbeat");
      await hbChannel.send({
        type: "broadcast",
        event: "heartbeat",
        payload: {
          status: isOnline ? (discordConfig.botStatus || "online") : "offline",
          uptimeSeconds: Math.floor(process.uptime()),
          pingMs: isOnline ? (client.ws?.ping || 0) : -1,
          guildCount: isOnline ? (client.guilds?.cache?.size || 0) : 0,
          memberCount: membersCache?.size || 0,
          memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          botTag: client?.user?.tag || "Twin Wheels Bot",
          botId: client?.user?.id || (discordConfig.clientId || "1536184283197079622"),
          timestamp: new Date().toISOString(),
          guilds: guildsList,
        },
      });
    } catch (err) {
      console.warn("Erro ao emitir heartbeat:", err.message);
    }
  };

  // Emissor periódico de Heartbeat (a cada 25 segundos e logo na inicialização)
  setInterval(sendHeartbeat, 25000);
  setTimeout(sendHeartbeat, 2000);

  // 7. Canal de Despacho de Webhooks / Postagem em Canais por ID de Servidor e Canal
  supabase
    .channel("system-discord-webhook-dispatch")
    .on("broadcast", { event: "dispatch_post" }, async (payload) => {
      const data = payload?.payload;
      if (!data || !data.channelId) return;
      console.log(`📤 [WEBHOOK DISPATCH] Postagem recebida para o canal Discord: ${data.channelId}`);

      try {
        const channel = await client.channels.fetch(data.channelId).catch((err) => {
          console.warn(`[WEBHOOK DISPATCH] Erro ao buscar canal ${data.channelId}:`, err.message);
          return null;
        });

        if (!channel) {
          console.warn(`[WEBHOOK DISPATCH] Canal ${data.channelId} não encontrado no Discord.`);
          const resultChannel = supabase.channel("system-discord-webhook-results");
          await resultChannel.send({
            type: "broadcast",
            event: "post_result",
            payload: {
              webhookId: data.webhookId,
              success: false,
              error: `Canal ${data.channelId} não encontrado ou o bot não tem permissão para acessá-lo.`,
              timestamp: Date.now(),
            },
          });
          return;
        }

        const embed = new EmbedBuilder();
        if (data.embed?.title) embed.setTitle(data.embed.title);
        if (data.embed?.description) embed.setDescription(data.embed.description);
        if (data.embed?.color) embed.setColor(data.embed.color);
        if (data.embed?.fields && Array.isArray(data.embed.fields)) {
          for (const f of data.embed.fields) {
            if (f.name && f.value) embed.addFields({ name: f.name, value: f.value, inline: !!f.inline });
          }
        }
        if (data.username || data.avatarUrl) {
          embed.setAuthor({
            name: data.username || "Twin Wheels RP",
            iconURL: data.avatarUrl && typeof data.avatarUrl === "string" && data.avatarUrl.startsWith("http") ? data.avatarUrl : undefined,
          });
        }
        if (data.embed?.footer) {
          embed.setFooter({
            text: data.embed.footer.text || "Twin Wheels RP",
            iconURL: data.embed.footer.icon_url || undefined,
          });
        }
        if (data.embed?.image) {
          const imgUrl = typeof data.embed.image === "string" ? data.embed.image : data.embed.image.url;
          if (imgUrl && imgUrl.startsWith("http")) embed.setImage(imgUrl);
        }
        if (data.embed?.timestamp) {
          embed.setTimestamp();
        }

        const spamCheck = isSpamOrMalicious(data.content, [embed]);
        if (spamCheck.isBlocked) {
          console.warn(`🚨 [ANTI-SPAM SHIELD] Webhook dispatch descartado por spam: ${spamCheck.reason}`);
          const resultChannel = supabase.channel("system-discord-webhook-results");
          await resultChannel.send({
            type: "broadcast",
            event: "post_result",
            payload: {
              webhookId: data.webhookId,
              success: false,
              error: `Conteúdo bloqueado pelo firewall anti-spam: ${spamCheck.reason}`,
              timestamp: Date.now(),
            },
          });
          return;
        }

        if (isDuplicateFlood(data.channelId, data.content, [embed])) {
          console.warn(`⚠️ [ANTI-FLOOD] Webhook dispatch duplicado ignorado para canal ${data.channelId}`);
          return;
        }

        const sentMessage = await channel.send({
          content: data.content || undefined,
          embeds: [embed],
        });

        console.log(`✅ [WEBHOOK DISPATCH] Mensagem postada com sucesso em #${channel.name || data.channelId} (ID: ${sentMessage.id})`);

        const resultChannel = supabase.channel("system-discord-webhook-results");
        await resultChannel.send({
          type: "broadcast",
          event: "post_result",
          payload: {
            webhookId: data.webhookId,
            channelId: data.channelId,
            channelName: channel.name,
            guildName: channel.guild?.name,
            messageId: sentMessage.id,
            success: true,
            timestamp: Date.now(),
          },
        });
      } catch (err) {
        console.error("[WEBHOOK DISPATCH ERRO]:", err.message);
        const resultChannel = supabase.channel("system-discord-webhook-results");
        await resultChannel.send({
          type: "broadcast",
          event: "post_result",
          payload: {
            webhookId: data.webhookId,
            success: false,
            error: err.message,
            timestamp: Date.now(),
          },
        });
      }
    })
    .subscribe((status) => {
      console.log(`📡 [WEBHOOK DISPATCH STATUS] status: ${status}`);
    });

  // 8. Polling de logs desativado para economia de banco de dados
  // setInterval(pollUnprocessedAuditLogs, 30000);
}

/**
 * Atualiza o avatar de um perfil no Supabase.
 * - Atualiza sempre discord_avatar_url.
 * - Preserva avatar_url se o usuário possuir foto personalizada (Postimages, etc.).
 */
async function updateProfileAvatar(discordId, newAvatarUrl, tag, forceOverwriteAvatar = false) {
  if (!discordId || !newAvatarUrl) return false;

  try {
    let data = null;
    if (neonPool) {
      try {
        const checkRes = await neonPool.query(
          "SELECT id, user_id, avatar_url, discord_avatar_url FROM profiles WHERE discord_id = $1 LIMIT 1",
          [discordId]
        );
        const currentProf = checkRes.rows[0];
        const hasCustomAvatar = currentProf && currentProf.avatar_url && !currentProf.avatar_url.includes("cdn.discordapp.com");

        let updateSql = "";
        let params = [];
        if (forceOverwriteAvatar || !hasCustomAvatar) {
          updateSql = "UPDATE profiles SET discord_avatar_url = $1, avatar_url = $1 WHERE discord_id = $2 RETURNING id, user_id, nome, nickname, discord_id, discord_avatar_url, avatar_url";
          params = [newAvatarUrl, discordId];
        } else {
          updateSql = "UPDATE profiles SET discord_avatar_url = $1 WHERE discord_id = $2 RETURNING id, user_id, nome, nickname, discord_id, discord_avatar_url, avatar_url";
          params = [newAvatarUrl, discordId];
        }

        const pgRes = await neonPool.query(updateSql, params);
        data = pgRes.rows;
      } catch (poolErr) {
        console.warn("⚠️ [UPDATE AVATAR Fallback Supabase]:", poolErr.message);
      }
    }

    if (!data) {
      const { data: currentData } = await supabase
        .from("profiles")
        .select("id, user_id, avatar_url, discord_avatar_url")
        .eq("discord_id", discordId)
        .maybeSingle();

      const hasCustomAvatar = currentData && currentData.avatar_url && !currentData.avatar_url.includes("cdn.discordapp.com");
      const updatePayload = {
        discord_avatar_url: newAvatarUrl,
      };
      if (forceOverwriteAvatar || !hasCustomAvatar) {
        updatePayload.avatar_url = newAvatarUrl;
      }

      const { data: sbData, error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("discord_id", discordId)
        .select("id, user_id, nome, nickname, discord_id, discord_avatar_url, avatar_url");

      if (error) {
        console.error(`[ERRO Supabase] Falha ao atualizar foto de ${tag || discordId}:`, error.message);
        return false;
      }
      data = sbData;
    }

    if (data && data.length > 0) {
      console.log(`[SUCESSO] Avatar de ${tag || discordId} sincronizado: ${newAvatarUrl}`);
      // Sincroniza metadados no Supabase Auth se avatar_url foi atualizado
      for (const p of data) {
        if (p.user_id && p.avatar_url) {
          try {
            await supabase.auth.admin.updateUserById(p.user_id, {
              user_metadata: { avatar_url: p.avatar_url },
            });
          } catch {}
        }
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error(`[ERRO Fatal] updateProfileAvatar:`, err);
    return false;
  }
}

function cleanAvatarUrl(url) {
  if (!url) return "";
  return url.split("?")[0];
}

/**
 * Varre todos os membros cadastrados na tabela profiles e garante que o avatar esteja 100% atualizado
 */
let isSyncing = false;
async function syncAllProfiles() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    let profiles = [];
    if (neonPool) {
      try {
        const res = await neonPool.query(
          "SELECT id, user_id, discord_id, discord_avatar_url, avatar_url, discord_username FROM profiles WHERE discord_id IS NOT NULL"
        );
        profiles = res.rows || [];
      } catch (poolErr) {
        console.warn("⚠️ [SYNC Fallback Supabase]:", poolErr.message);
      }
    }

    if (!profiles || profiles.length === 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, discord_id, discord_avatar_url, avatar_url, discord_username")
        .not("discord_id", "is", null);
      if (error || !data || data.length === 0) return;
      profiles = data;
    }

    for (const prof of profiles) {
      if (!prof.discord_id) continue;

      try {
        const user = await client.users.fetch(prof.discord_id, { force: true }).catch(() => null);
        if (!user) continue;

        const currentAvatar = user.displayAvatarURL({ extension: "png", forceStatic: false, size: 512 });
        const cleanCurrent = cleanAvatarUrl(currentAvatar);
        const cleanProfDiscord = cleanAvatarUrl(prof.discord_avatar_url);

        // Atualiza somente se o avatar do Discord mudou no próprio Discord
        if (cleanCurrent && cleanCurrent !== cleanProfDiscord) {
          console.log(`[SYNC Auto] Detectada diferença de avatar para ${user.tag} (${prof.discord_id}). Atualizando...`);
          await updateProfileAvatar(prof.discord_id, currentAvatar, user.tag, false);
        }
      } catch (err) {}

      await new Promise((res) => setTimeout(res, 150));
    }
  } catch (err) {
    console.error("[SYNC Falha Global]:", err);
  } finally {
    isSyncing = false;
  }
}

/**
 * Aquece o cache de membros de todos os servidores que o bot participa
 */
async function warmUpGuildMembers() {
  for (const guild of client.guilds.cache.values()) {
    try {
      const fetched = await guild.members.fetch();
      console.log(`[GUILD CACHE] ${fetched.size} membros carregados do servidor "${guild.name}"`);
    } catch (err) {
      console.warn(`[GUILD AVISO] Não foi possível carregar membros de "${guild.name}":`, err.message);
    }
  }
}

// Mapeamento de apelidos e aliases de webhooks legados (ex: FiveM Cidade Alta logs)
const KNOWN_WEBHOOK_ALIASES = {
  "1548409284000485420": "1535637509818548234", // Webhook legado Cidade Alta / Baú logs -> Canal #baus-qg
  "1548409281257279619": "1535634406490906734", // Captain Hook
  "1557157544764641284": "1535637509818548234", // Webhook oficial #baus-qg
  "1554653001157705778": "1554652550634938540", // #baus-qgnew
  "1535637589818548234": "1535637509818548234", // Typo alias
  "baus": "1535637509818548234",
  "baus-qg": "1535637509818548234",
  "logs-bau": "1535637509818548234",
  "estoque": "1535637509818548234",
};

const KNOWN_CHANNEL_WEBHOOKS_BOT = {
  "1535637509818548234": "https://discord.com/api/webhooks/1557157544764641284/Cx1GDJxh7mBWrL2PMZBA6A1zX8UKsHQ6V2VbSbE4_60SF_koAY9_GyFrdvEHzwP-mzOi",
  "1548409284000485420": "https://discord.com/api/webhooks/1557157544764641284/Cx1GDJxh7mBWrL2PMZBA6A1zX8UKsHQ6V2VbSbE4_60SF_koAY9_GyFrdvEHzwP-mzOi",
  "1554652550634938540": "https://discord.com/api/webhooks/1554653001157705778/L1ULPzVRJYagJuBaFZOuV00hFp2TaFOiEeCpIwBVbNvEKOHV08MiI_fhs9Lu4eq3z3bo",
  "1535634406490906734": "https://discord.com/api/webhooks/1548409281257279619/D7xXcK4e4W5qdqBp8SVN_ngkh-aydDk-GRUcucykcQCYORp_9Jfh8iyumYVQGX19lLYX",
};

/**
 * Trata requisições HTTP para a rota pública de Webhook (/webhook/:target)
 */
async function handleWebhookHttpRequest(targetParam, req, res) {
  if (!targetParam) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: false, error: "ID de webhook ou canal não informado na URL." }));
  }

  // Normaliza o targetParam removendo query strings e barras
  const cleanTarget = String(targetParam).trim().replace(/^\/+|\/+$/g, "").split("?")[0];

  // 1. Verificação de Rate Limit por IP e Canal
  const clientIp = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const rateCheck = checkRateLimit(clientIp, cleanTarget);
  if (!rateCheck.allowed) {
    console.warn(`⚠️ [RATE LIMIT] Requisição bloqueada para IP ${clientIp} no canal ${cleanTarget}: ${rateCheck.reason}`);
    res.writeHead(429, {
      "Content-Type": "application/json",
      "Retry-After": String(rateCheck.retryAfterSeconds || 10),
    });
    return res.end(JSON.stringify({ success: false, error: rateCheck.reason }));
  }

  let channelId = KNOWN_WEBHOOK_ALIASES[cleanTarget] || cleanTarget;
  let webhookName = "Twin Wheels Webhook";
  let botUsername = "Twin Wheels RP";
  let botAvatar = (discordConfig && discordConfig.botAvatarUrl) || "https://i.ibb.co/ymH1BQPQ/Uma124.png";
  let embedColorHex = "#10B981";
  let defaultTitle = undefined;
  let defaultDescription = undefined;
  let useCodeblockField = false;
  let codeblockLanguage = "";
  let authorName = undefined;
  let authorIconUrl = undefined;
  let authorUrl = undefined;
  let thumbnailUrl = undefined;
  let webhookImageUrl = undefined;
  let footerText = (discordConfig && discordConfig.footerText) || "Twin Wheels RP • Canal de Mensagens";
  let footerIconUrl = undefined;
  let showTimestamp = true;
  let defaultMention = undefined;
  let directWebhookUrl = undefined;

  // Sempre busca nas configurações de webhooks do banco para obter metadados (nome, avatar, cor, canal, embeds)
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "system_discord_webhooks")
      .maybeSingle();

    if (data?.permissions?.webhooks && Array.isArray(data.permissions.webhooks)) {
      const found = data.permissions.webhooks.find(
        (w) =>
          w.id === cleanTarget ||
          w.channelId === cleanTarget ||
          w.channelId === channelId ||
          (w.webhookUrl && w.webhookUrl.includes(cleanTarget)) ||
          (cleanTarget === "1548409284000485420" && (w.channelId === "1535637509818548234" || w.id === "webhook_1789248648283"))
      );
      if (found) {
        if (found.channelId) channelId = found.channelId;
        if (found.webhookUrl) directWebhookUrl = found.webhookUrl;
        webhookName = found.name || webhookName;
        botUsername = found.username || botUsername;
        botAvatar = found.avatarUrl || botAvatar;
        embedColorHex = found.embedColor || embedColorHex;
        defaultTitle = found.defaultTitle;
        defaultDescription = found.defaultDescription;
        useCodeblockField = !!found.useCodeblockField;
        codeblockLanguage = found.codeblockLanguage || "";
        authorName = found.authorName;
        authorIconUrl = found.authorIconUrl;
        authorUrl = found.authorUrl;
        thumbnailUrl = found.thumbnailUrl;
        webhookImageUrl = found.imageUrl;
        footerText = found.footerText || footerText;
        footerIconUrl = found.footerIconUrl;
        showTimestamp = found.showTimestamp !== false;
        defaultMention = found.mentionRoles;
      }
    }
  } catch (e) {
    console.warn("Erro ao buscar webhook no banco:", e.message);
  }

  // Se channelId for ID snowflake de webhook (e não de canal), tenta resolver o canal correspondente via Discord API
  if (client.isReady() && /^\d{17,20}$/.test(channelId)) {
    const cachedChannel = client.channels.cache.get(channelId);
    if (!cachedChannel) {
      try {
        const fetchedWh = await client.fetchWebhook(channelId).catch(() => null);
        if (fetchedWh && fetchedWh.channelId) {
          channelId = fetchedWh.channelId;
          webhookName = fetchedWh.name || webhookName;
        }
      } catch {}
    }
  }

  if (!/^\d{17,20}$/.test(channelId) && !directWebhookUrl) {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: false, error: `Webhook ou ID de Canal inválido: ${cleanTarget}` }));
  }

  // Se for GET, renderiza a página web para envio direto pelo navegador ou retorna JSON se solicitado
  if (req.method === "GET") {
    if (urlObj.searchParams.get("format") === "json" || req.headers.accept?.includes("application/json")) {
      return handleGetWebhookUrl(channelId, req, res);
    }

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Postador de Mensagens • Twin Wheels</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #09090b; color: #f4f4f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #121215; border: 1px solid #27272a; border-radius: 20px; width: 100%; max-width: 540px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7); }
    .header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #27272a; }
    .avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #3f3f46; }
    .title { font-size: 18px; font-weight: 800; color: #fff; }
    .subtitle { font-size: 12px; color: #a1a1aa; margin-top: 2px; }
    .badge-bar { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 12px 14px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; }
    .badge-bar span { color: #a1a1aa; }
    .badge-bar strong { color: #34d399; font-family: monospace; }
    .badge-btn { background: #8b5cf6; color: #fff; text-decoration: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; transition: opacity 0.2s; white-space: nowrap; }
    .badge-btn:hover { opacity: 0.85; }
    .form-group { margin-bottom: 18px; }
    label { display: block; font-size: 12px; font-weight: 700; color: #d4d4d8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    input, textarea { width: 100%; background: #18181b; border: 1px solid #27272a; border-radius: 10px; padding: 12px 14px; color: #fff; font-size: 14px; transition: border-color 0.2s; outline: none; }
    input:focus, textarea:focus { border-color: #8b5cf6; box-shadow: 0 0 0 1px #8b5cf6; }
    textarea { resize: vertical; min-height: 110px; }
    .btn { width: 100%; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; border: none; border-radius: 10px; padding: 14px; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn:hover { background: linear-gradient(135deg, #7c3aed, #6d28d9); transform: translateY(-1px); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .badge { display: inline-block; background: #27272a; color: #a1a1aa; font-size: 11px; padding: 4px 10px; border-radius: 6px; font-family: monospace; }
    .alert { padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 600; margin-top: 16px; display: none; }
    .alert-success { background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; }
    .alert-error { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #f87171; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <img class="avatar" src="${botAvatar}" alt="Avatar">
      <div>
        <div class="title">${webhookName}</div>
        <div class="subtitle">Emissor: <strong>${botUsername}</strong> • <span class="badge">Canal: ${channelId}</span></div>
      </div>
    </div>

    <div class="badge-bar">
      <div>
        <span>Compatível com:</span> <strong>Discohook & FiveM</strong>
      </div>
      <a class="badge-btn" href="/api/webhook-url/${channelId}" target="_blank">Obter URL Oficial Discord</a>
    </div>

    <form id="webhookForm">
      <div class="form-group">
        <label>Título do Comunicado (Opcional)</label>
        <input type="text" id="titleInput" placeholder="Ex: COMUNICADO IMPORTANTE">
      </div>
      <div class="form-group">
        <label>Mensagem / Conteúdo *</label>
        <textarea id="contentInput" required placeholder="Digite sua mensagem que será enviada para o canal..."></textarea>
      </div>
      <div class="form-group">
        <label>URL da Imagem / Print (Opcional)</label>
        <input type="url" id="imageInput" placeholder="https://exemplo.com/imagem.png">
      </div>
      <button type="submit" id="submitBtn" class="btn">🚀 Enviar para o Discord</button>
      <div id="alertBox" class="alert"></div>
    </form>
  </div>
  <script>
    const form = document.getElementById('webhookForm');
    const btn = document.getElementById('submitBtn');
    const alertBox = document.getElementById('alertBox');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('titleInput').value.trim();
      const description = document.getElementById('contentInput').value.trim();
      const imageUrl = document.getElementById('imageInput').value.trim();

      btn.disabled = true;
      btn.innerText = 'Enviando...';
      alertBox.style.display = 'none';

      try {
        const res = await fetch(window.location.href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, imageUrl, content: description })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alertBox.className = 'alert alert-success';
          alertBox.innerText = '✅ ' + (data.message || 'Mensagem enviada com sucesso para o Discord!');
          alertBox.style.display = 'block';
          form.reset();
        } else {
          throw new Error(data.error || 'Erro ao enviar mensagem');
        }
      } catch (err) {
        alertBox.className = 'alert alert-error';
        alertBox.innerText = '❌ ' + err.message;
        alertBox.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.innerText = '🚀 Enviar para o Discord';
      }
    });
  </script>
</body>
</html>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  }

  // Se for POST: processa o envio
  if (req.method === "POST") {
    let rawBody = "";
    req.on("data", (chunk) => {
      rawBody += chunk;
    });

    req.on("end", async () => {
      try {
        let payload = {};
        if (rawBody.trim()) {
          try {
            payload = JSON.parse(rawBody);
          } catch {
            const params = new URLSearchParams(rawBody);
            payload = Object.fromEntries(params.entries());
          }
        }

        let embedsToSend = [];
        // Suporte tanto a embeds (array) quanto embed (objeto singular)
        const incomingEmbeds = Array.isArray(payload.embeds)
          ? payload.embeds
          : (payload.embed && typeof payload.embed === "object" ? [payload.embed] : []);

        if (incomingEmbeds.length > 0) {
          for (const rawEmbed of incomingEmbeds) {
            if (!rawEmbed || typeof rawEmbed !== "object") continue;
            try {
              const cleanEmbed = { ...rawEmbed };
              if (cleanEmbed.color && typeof cleanEmbed.color === "string") {
                cleanEmbed.color = hexToInt(cleanEmbed.color);
              }
              embedsToSend.push(EmbedBuilder.from(cleanEmbed));
            } catch (embedErr) {
              console.warn("[HTTP WEBHOOK] Erro ao instanciar embed recebido:", embedErr.message);
            }
          }
        }

        const description = payload.description || payload.content || payload.message || "";
        if (!description.trim() && embedsToSend.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "O campo 'description', 'content', 'message' ou 'embeds' é obrigatório." }));
        }

        const title = payload.title || defaultTitle || webhookName || "Comunicado Oficial";
        const imageUrl = payload.imageUrl || payload.image_url || payload.image || webhookImageUrl || undefined;
        const finalThumbnail = payload.thumbnailUrl || payload.thumbnail_url || payload.thumbnail || thumbnailUrl || undefined;
        const color = payload.color || payload.embedColor || embedColorHex || "#10B981";
        const sender = payload.username || payload.author || botUsername || "Twin Wheels RP";
        const avatar = payload.avatarUrl || payload.avatar_url || botAvatar;
        const finalMention = payload.mention || defaultMention || undefined;

        let contentText = undefined;
        if (finalMention && payload.content) {
          contentText = `${String(finalMention)}\n${String(payload.content)}`;
        } else if (finalMention) {
          contentText = String(finalMention);
        } else if (payload.content) {
          contentText = String(payload.content);
        }

        if (embedsToSend.length === 0) {
          // Gera Embed se o chamador passou description, title, imageUrl, fields ou não passou content puro
          if (payload.description || payload.title || defaultTitle || imageUrl || (payload.fields && payload.fields.length > 0) || !payload.content) {
            const embed = new EmbedBuilder()
              .setTitle(title)
              .setColor(hexToInt(color))
              .setFooter({
                text: payload.footerText || footerText || "Twin Wheels RP • Canal de Mensagens",
                iconURL: payload.footerIconUrl || footerIconUrl || avatar,
              });

            if (showTimestamp) {
              embed.setTimestamp();
            }

            if (useCodeblockField) {
              const subDesc = defaultDescription || "";
              if (subDesc) {
                embed.setDescription(subDesc);
              }
              embed.addFields({
                name: "\u200b",
                value: `\`\`\`${codeblockLanguage}\n${description.trim() || "Testando webhook"}\n\`\`\``,
                inline: false,
              });
            } else {
              embed.setDescription(description.trim() || defaultDescription || "\u200b");
            }

            const finalAuthor = payload.authorName || authorName;
            if (finalAuthor) {
              embed.setAuthor({
                name: String(finalAuthor),
                iconURL: payload.authorIconUrl || authorIconUrl || avatar,
                url: payload.authorUrl || authorUrl || undefined,
              });
            } else if (avatar) {
              embed.setAuthor({
                name: sender,
                iconURL: avatar,
              });
            }

            if (finalThumbnail && typeof finalThumbnail === "string" && finalThumbnail.startsWith("http")) {
              embed.setThumbnail(finalThumbnail.trim());
            }

            if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("http")) {
              embed.setImage(imageUrl.trim());
            }

            if (payload.fields && Array.isArray(payload.fields)) {
              for (const f of payload.fields) {
                if (f && f.name && f.value) {
                  embed.addFields({ name: String(f.name), value: String(f.value), inline: !!f.inline });
                }
              }
            }

            embedsToSend = [embed];
            // Se description for idêntica ao content, evita repetir o mesmo texto fora do embed
            if (contentText === description.trim()) {
              contentText = finalMention ? String(finalMention) : undefined;
            }
          }
        }

        // 2. Validação Anti-Spam e Anti-Malware Shield
        const spamCheck = isSpamOrMalicious(contentText || description, embedsToSend);
        if (spamCheck.isBlocked) {
          console.warn(`🚨 [ANTI-SPAM SHIELD] Bloqueado envio de spam para canal ${channelId} (IP: ${clientIp}): ${spamCheck.reason}`);
          recordBlockedSpam(spamCheck.reason, { ip: clientIp, channelId });
          res.writeHead(403, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: false,
              error: `Mensagem bloqueada pelo firewall de segurança: ${spamCheck.reason}`,
            })
          );
        }

        // 3. Prevenção de duplicação / flood idêntico
        if (isDuplicateFlood(channelId, contentText || description, embedsToSend)) {
          console.warn(`⚠️ [ANTI-FLOOD] Mensagem idêntica repetida ignorada para canal ${channelId}`);
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: true,
              message: "Mensagem idêntica já enviada recentemente (descarte anti-flood).",
              channelId,
            })
          );
        }

        let sentMsg = null;
        let finalChannelName = channelId;

        const targetWebhookUrl =
          directWebhookUrl ||
          KNOWN_CHANNEL_WEBHOOKS_BOT[channelId] ||
          KNOWN_CHANNEL_WEBHOOKS_BOT[cleanTarget];

        // 1. Prioridade: Envio direto via Webhook Oficial do Discord (Preserva avatar e nome "Cidade Alta APP")
        if (targetWebhookUrl && targetWebhookUrl.startsWith("http")) {
          try {
            const hookRes = await fetch(targetWebhookUrl + "?wait=true", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: sender,
                avatar_url: avatar,
                content: contentText || undefined,
                embeds: embedsToSend.map((e) => (typeof e.toJSON === "function" ? e.toJSON() : e)),
              }),
            });

            if (hookRes.ok) {
              const hookData = await hookRes.json().catch(() => ({}));
              sentMsg = { id: hookData.id || "discord_webhook_ok" };
              finalChannelName = hookData.channel_id || channelId;
              console.log(`📡 [HTTP WEBHOOK] Mensagem postada com sucesso via Webhook Oficial (${sender}) em #${finalChannelName} (ID: ${sentMsg.id})`);
            } else {
              const hookErr = await hookRes.text().catch(() => "");
              console.warn(`[HTTP WEBHOOK] Webhook Oficial retornou status ${hookRes.status}:`, hookErr);
            }
          } catch (whErr) {
            console.warn("[HTTP WEBHOOK] Erro ao disparar via Webhook Oficial:", whErr.message);
          }
        }

        // 2. Fallback: Envio direto via Bot Discord.js no canal de texto
        if (!sentMsg && client.isReady() && channelId && /^\d{17,20}$/.test(channelId)) {
          try {
            const channel = client.channels.cache.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
            if (channel && channel.isTextBased()) {
              sentMsg = await channel.send({
                content: contentText || undefined,
                embeds: embedsToSend.length > 0 ? embedsToSend : undefined,
              });
              finalChannelName = channel.name;
              console.log(`📡 [HTTP WEBHOOK] Mensagem postada via Bot direto em #${channel.name} (${channelId}) (ID: ${sentMsg.id})`);
            }
          } catch (sendErr) {
            console.warn(`[HTTP WEBHOOK] Falha ao postar via canal direto ${channelId}:`, sendErr.message);
          }
        }

        if (!sentMsg) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({
              success: false,
              error: `Canal Discord ou Webhook (${cleanTarget}) não encontrado ou inacessível no momento.`,
            })
          );
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            success: true,
            message: `Mensagem enviada com sucesso para o canal #${finalChannelName}!`,
            id: sentMsg.id,
            messageId: sentMsg.id,
            channel_id: channelId,
            channelName: finalChannelName,
            channelId,
          })
        );
      } catch (err) {
        console.error("[HTTP WEBHOOK ERRO]:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: err.message || "Erro interno ao enviar mensagem." }));
      }
    });
    return;
  }

  res.writeHead(405, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: false, error: "Método HTTP não permitido." }));
}

/**
 * Envia uma mensagem simulada de movimentação idêntica ao bot "Cidade Alta APP" para o canal Discord
 */
async function handleSendSimulatedStock(payload) {
  const {
    channelId,
    authorName = "Andrew Delucca Ferreira",
    gamePlayerId = "274",
    bauName = "Baú",
    items = [],
    timeString = "",
    useWebhook = false,
  } = payload;

  if (!channelId || !/^\d{17,20}$/.test(String(channelId).trim())) {
    return { success: false, error: "ID de canal do Discord inválido." };
  }

  const cleanChannelId = String(channelId).trim();
  const channel = client.channels.cache.get(cleanChannelId) || (await client.channels.fetch(cleanChannelId).catch(() => null));

  if (!channel || !channel.isTextBased()) {
    return { success: false, error: `Canal ${cleanChannelId} não encontrado no Discord ou sem permissão de envio.` };
  }

  // Montar linhas de Saldo Líquido e Detalhes da Movimentação
  const saldoLiquidoLines = [];
  const detalhesLines = [];

  for (const item of items) {
    const qty = Number(item.quantity) || 0;
    if (qty === 0) continue;
    const name = String(item.name).trim();

    // Formato Saldo líquido: Lockpick `+15` ou Lockpick `-15`
    const sign = qty > 0 ? `+${qty}` : `${qty}`;
    saldoLiquidoLines.push(`${name} \`${sign}\``);

    // Formato Detalhes da movimentação:
    // Lockpick
    // ↳ +15 adicionados (ou ↳ +1 adicionado) / ↳ -15 removidos (ou ↳ -1 removido)
    detalhesLines.push(name);
    if (qty > 0) {
      const verb = qty === 1 ? "adicionado" : "adicionados";
      detalhesLines.push(`↳ +${qty} ${verb}`);
    } else {
      const absQty = Math.abs(qty);
      const verb = absQty === 1 ? "removido" : "removidos";
      detalhesLines.push(`↳ -${absQty} ${verb}`);
    }
  }

  if (saldoLiquidoLines.length === 0) {
    return { success: false, error: "Nenhum item válido informado para movimentação." };
  }

  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const formattedTime = timeString || `Hoje às ${hh}:${mm}`;

  const description = [
    `📦 ${bauName || "Baú"}`,
    "",
    "📊 Saldo líquido",
    saldoLiquidoLines.join("\n"),
    "",
    "🧾 Detalhes da movimentação",
    detalhesLines.join("\n"),
    "",
    `Movimentações agrupadas em uma janela de 30 segundos • ${formattedTime}`,
  ].join("\n");

  const authorTitle = gamePlayerId ? `${authorName} • ID ${gamePlayerId}` : authorName;

  const embed = new EmbedBuilder()
    .setAuthor({ name: authorTitle })
    .setDescription(description)
    .setColor(0xf59e0b); // Gold/Amber #F59E0B

  let sentMessage = null;

  // Se solicitado via webhook ou se possível criar webhook para exibir "Cidade Alta APP"
  if (useWebhook && channel.fetchWebhooks) {
    try {
      const webhooks = await channel.fetchWebhooks();
      let wh = webhooks.find((w) => w.owner?.id === client.user?.id) || webhooks.first();
      if (!wh) {
        wh = await channel.createWebhook({
          name: "Cidade Alta",
          reason: "Webhook gerado para simulação de estoque Cidade Alta APP",
        });
      }
      if (wh) {
        sentMessage = await wh.send({
          username: "Cidade Alta",
          avatarURL: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
          embeds: [embed],
        });
      }
    } catch (whErr) {
      console.warn("⚠️ [SIMULATE-STOCK] Falha ao enviar via webhook, usando bot direto:", whErr.message);
    }
  }

  if (!sentMessage) {
    sentMessage = await channel.send({ embeds: [embed] });
  }

  console.log(`🚀 [SIMULATE-STOCK] Mensagem idêntica enviada com sucesso em #${channel.name} (${sentMessage.id})`);

  return {
    success: true,
    messageId: sentMessage.id,
    channelId: cleanChannelId,
    channelName: channel.name,
    authorName,
    gamePlayerId,
    itemsCount: items.length,
    description,
  };
}

/**
 * Obtém ou cria o Webhook oficial do Discord (compatível com Discohook, FiveM, etc.)
 */
async function handleGetWebhookUrl(channelId, req, res) {
  res.setHeader("Content-Type", "application/json");

  // Proteção: apenas chamadas autenticadas podem obter/gerar webhooks
  if (!isAuthorizedApiRequest(req)) {
    res.writeHead(401);
    return res.end(JSON.stringify({ success: false, error: "Acesso não autorizado ao webhook de canal." }));
  }

  if (!/^\d{17,20}$/.test(channelId)) {
    res.writeHead(400);
    return res.end(JSON.stringify({ success: false, error: "ID de canal inválido." }));
  }

  try {
    if (!client.isReady()) {
      res.writeHead(503);
      return res.end(JSON.stringify({ success: false, error: "Bot do Discord não está pronto. Tente novamente." }));
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      res.writeHead(404);
      return res.end(JSON.stringify({ success: false, error: `Canal ${channelId} não encontrado no Discord.` }));
    }

    const webhooks = await channel.fetchWebhooks();
    let wh = webhooks.find((w) => w.owner?.id === client.user.id) || webhooks.first();
    if (!wh) {
      wh = await channel.createWebhook({
        name: "Twin Wheels Webhook",
        reason: "Webhook gerado automaticamente pelo painel TWTools",
      });
    }

    res.writeHead(200);
    return res.end(
      JSON.stringify({
        success: true,
        channelId,
        webhookUrl: wh.url,
        webhookId: wh.id,
        webhookName: wh.name,
      })
    );
  } catch (err) {
    console.error("[GET WEBHOOK URL ERRO]:", err);
    res.writeHead(500);
    return res.end(JSON.stringify({ success: false, error: err.message || "Erro interno ao obter webhook." }));
  }
}

/**
 * Busca e inspeciona uma mensagem do Discord pelo link (ex: https://discord.com/channels/:guildId/:channelId/:messageId)
 * Retorna dados estruturados completos da mensagem e executa a verificação do Escudo Anti-Spam
 */
async function handleFetchDiscordMessage(urlObj, req, res) {
  res.setHeader("Content-Type", "application/json");

  let targetUrl = urlObj.searchParams.get("url") || "";
  let guildId = urlObj.searchParams.get("guildId") || "";
  let channelId = urlObj.searchParams.get("channelId") || "";
  let messageId = urlObj.searchParams.get("messageId") || "";

  // Se passou URL completa no formato https://discord.com/channels/:guildId/:channelId/:messageId
  if (targetUrl) {
    const match = targetUrl.match(/discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)/i);
    if (match) {
      guildId = match[1];
      channelId = match[2];
      messageId = match[3];
    }
  }

  if (!channelId || !messageId) {
    res.writeHead(400);
    return res.end(
      JSON.stringify({
        success: false,
        error: "Formato de link inválido. Use o padrão: https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID",
      })
    );
  }

  try {
    if (!client.isReady()) {
      res.writeHead(503);
      return res.end(JSON.stringify({ success: false, error: "Bot do Discord não está conectado no momento." }));
    }

    const channel = client.channels.cache.get(channelId) || (await client.channels.fetch(channelId).catch(() => null));
    if (!channel || !channel.isTextBased()) {
      res.writeHead(404);
      return res.end(
        JSON.stringify({
          success: false,
          error: `Canal Discord (${channelId}) não encontrado ou o bot não tem permissão para acessá-lo.`,
        })
      );
    }

    const message = await channel.messages.fetch(messageId).catch((err) => {
      console.warn(`[FETCH DISCORD MSG] Erro ao buscar mensagem ${messageId}:`, err.message);
      return null;
    });

    if (!message) {
      res.writeHead(404);
      return res.end(
        JSON.stringify({
          success: false,
          error: `Mensagem ${messageId} não foi encontrada no canal #${channel.name}. Ela pode ter sido deletada.`,
        })
      );
    }

    // Estruturar dados da mensagem
    const embedsData = (message.embeds || []).map((emb) => ({
      title: emb.title,
      description: emb.description,
      url: emb.url,
      color: emb.hexColor || emb.color,
      author: emb.author ? { name: emb.author.name, iconUrl: emb.author.iconURL, url: emb.author.url } : null,
      thumbnail: emb.thumbnail ? { url: emb.thumbnail.url } : null,
      image: emb.image ? { url: emb.image.url } : null,
      footer: emb.footer ? { text: emb.footer.text, iconUrl: emb.footer.iconURL } : null,
      timestamp: emb.timestamp,
      fields: (emb.fields || []).map((f) => ({ name: f.name, value: f.value, inline: f.inline })),
    }));

    const attachmentsData = Array.from(message.attachments.values()).map((att) => ({
      id: att.id,
      name: att.name,
      url: att.url,
      contentType: att.contentType,
      size: att.size,
    }));

    // Executa análise do Escudo Anti-Spam no backend
    const spamCheck = isSpamOrMalicious(message.content, message.embeds);

    const messageInfo = {
      id: message.id,
      guildId: message.guildId || guildId,
      guildName: message.guild?.name || channel.guild?.name || null,
      channelId: message.channelId || channelId,
      channelName: channel.name,
      createdTimestamp: message.createdTimestamp,
      createdAt: message.createdAt ? message.createdAt.toISOString() : new Date(message.createdTimestamp).toISOString(),
      author: {
        id: message.author?.id,
        username: message.author?.username || "Desconhecido",
        discriminator: message.author?.discriminator,
        avatarUrl: message.author?.displayAvatarURL ? message.author.displayAvatarURL() : null,
        bot: message.author?.bot || false,
        webhookId: message.webhookId || null,
      },
      content: message.content || "",
      embeds: embedsData,
      attachments: attachmentsData,
      url: message.url || targetUrl,
    };

    res.writeHead(200);
    return res.end(
      JSON.stringify({
        success: true,
        message: messageInfo,
        shieldResult: {
          blocked: spamCheck.isBlocked,
          reason: spamCheck.reason || "Mensagem 100% limpa e autorizada pelo escudo de segurança!",
          matchedPattern: spamCheck.reason,
        },
      })
    );
  } catch (err) {
    console.error("❌ [FETCH DISCORD MSG ERRO]:", err);
    res.writeHead(500);
    return res.end(JSON.stringify({ success: false, error: err.message || "Erro ao buscar mensagem do Discord." }));
  }
}

/**
 * Realiza upload de imagem para o Postimages.org via API JSON e recupera link direto CDN (i.postimg.cc)
 * Zero consumo de storage Supabase e zero egress de banco de dados.
 */
async function uploadBufferToPostimages(fileBuffer, fileName, mimeType = "image/png") {
  try {
    const form = new FormData();
    form.append("gallery", "");
    form.append("optsize", "0");
    form.append("expire", "0");
    form.append("numfiles", "1");
    form.append("upload_session", `${Date.now()}${Math.random().toString().substring(1)}`);
    form.append("file", new Blob([fileBuffer], { type: mimeType }), fileName);

    const res = await fetch("https://postimages.org/json/rr", {
      method: "POST",
      body: form,
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Origin: "https://postimages.org",
        Referer: "https://postimages.org/",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        const pageRes = await fetch(data.url);
        const html = await pageRes.text();
        const inputDirectMatch = html.match(/id=["']direct["'][^>]*value=["']([^"']+)["']/i) || html.match(/value=["'](https:\/\/i\.postimg\.cc\/[^"']+)["']/i);
        const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
        const directMatch = html.match(/https:\/\/i\.postimg\.cc\/[a-zA-Z0-9_\-./]+\.(?:png|jpg|jpeg|webp|gif)/i);

        const cdnUrl = (inputDirectMatch && inputDirectMatch[1]) || (ogMatch && ogMatch[1]) || (directMatch && directMatch[0]);
        if (cdnUrl) return cdnUrl;
      }
    }
  } catch (err) {
    console.warn("⚠️ [Postimages primary failed, trying catbox fallback]:", err.message);
  }

  // Fallback 1: Catbox.moe
  try {
    const catForm = new FormData();
    catForm.append("reqtype", "fileupload");
    catForm.append("fileToUpload", new Blob([fileBuffer], { type: mimeType }), fileName);
    const catRes = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: catForm,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });
    if (catRes.ok) {
      const catUrl = (await catRes.text()).trim();
      if (catUrl.startsWith("http")) return catUrl;
    }
  } catch (catErr) {
    console.warn("⚠️ [Catbox fallback failed]:", catErr.message);
  }

  throw new Error("Não foi possível realizar o upload da imagem no CDN.");
}

// Servidor HTTP básico para o Discloud (TYPE=site), Webhooks públicos e health checks
const server = http.createServer(async (req, res) => {
  // Configuração global de CORS para permitir chamadas de qualquer frontend ou script
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Filename");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = urlObj.pathname;

  if (pathname === "/sync") {
    syncAllProfiles();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "sync_triggered", timestamp: new Date().toISOString() }));
  }

  // Rota para disparar verificação imediata de lives: /api/lives/check-now ou /api/lives/sync
  if (pathname === "/api/lives/check-now" || pathname === "/api/lives/sync") {
    const engine = getLiveStreamEngine();
    if (engine) engine.checkNow();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "live_check_triggered", timestamp: new Date().toISOString() }));
  }

  // Rota de proxy acelerado de imagens (com bypass de restrições de ISP/TLS e cache Cloudflare edge)
  if (pathname === "/api/image" || pathname === "/image") {
    const rawTarget = urlObj.searchParams.get("url") || "";
    if (!rawTarget) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Parâmetro url é obrigatório" }));
    }

    try {
      const decodedUrl = decodeURIComponent(rawTarget);
      const imgRes = await fetch(decodedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://postimages.org/",
          "Accept": "image/*,*/*;q=0.8",
        },
      });

      if (!imgRes.ok) {
        res.writeHead(imgRes.status, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: `Falha ao carregar imagem: ${imgRes.status}` }));
      }

      const mimeType = imgRes.headers.get("content-type") || "image/png";
      const arrayBuf = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.writeHead(200);
      return res.end(buffer);
    } catch (err) {
      console.error("❌ [PROXY IMAGE ERROR]:", err.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // Rota para buscar e inspecionar mensagem do Discord por URL/IDs: /api/discord-message?url=...
  if (pathname === "/api/discord-message" || pathname === "/api/fetch-discord-message") {
    return handleFetchDiscordMessage(urlObj, req, res);
  }

  // Rota para obter URL oficial do Discord Webhook (compatível com Discohook): /api/webhook-url/:channelId
  if (pathname.startsWith("/api/webhook-url/")) {
    const targetChannelId = pathname.replace("/api/webhook-url/", "").trim();
    return handleGetWebhookUrl(targetChannelId, req, res);
  }

  // Rota de Webhook pública: /webhook/:idOrChannelId ou /api/webhook/:idOrChannelId
  if (pathname.startsWith("/webhook/") || pathname.startsWith("/api/webhook/")) {
    const targetParam = pathname.replace(/^\/(?:api\/)?webhook\//, "").trim();
    return handleWebhookHttpRequest(targetParam, req, res);
  }

  // Rota para forçar sincronização de Slash Commands do Bot Studio
  if (pathname === "/api/sync-slash-commands" || pathname === "/sync-slash-commands") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      return res.end();
    }
    loadBotProjects().then(() => syncSlashCommands()).catch(() => {});
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: true, message: "Slash Commands sincronizados com sucesso no Discord!" }));
  }

  // Rota para Atualizar Perfil do Bot no Discord (Avatar e Banner): /api/update-bot-profile
  if (pathname === "/api/update-bot-profile") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Método não permitido. Utilize POST." }));
    }

    let bodyStr = "";
    req.on("data", (chunk) => {
      bodyStr += chunk;
      if (bodyStr.length > 1024 * 512) req.destroy();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(bodyStr || "{}");
        const { botAvatarUrl, botBannerUrl, force } = payload;

        if (botAvatarUrl) discordConfig.botAvatarUrl = botAvatarUrl;
        if (botBannerUrl) discordConfig.botBannerUrl = botBannerUrl;

        console.log("⚡ [API UPDATE-BOT-PROFILE] Solicitando atualização imediata do perfil do bot no Discord:", { botAvatarUrl, botBannerUrl });
        const result = await syncDiscordBotProfile(botAvatarUrl, botBannerUrl, !!force);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(result.success ? 200 : 400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(result));
      } catch (err) {
        console.error("❌ [UPDATE-BOT-PROFILE HTTP ERROR]:", err);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Rota para Atualização Direta de Presença & Status do Bot no Discord
  if (pathname === "/api/update-presence" || pathname === "/api/bot-presence") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(
        JSON.stringify({
          success: true,
          status: discordConfig.botStatus || "online",
          activityType: discordConfig.botActivityType || "Playing",
          statusText: discordConfig.botStatusText || "by malaca",
          streamingUrl: discordConfig.botStreamingUrl || "",
        })
      );
    }

    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Método não permitido. Utilize POST." }));
    }

    let bodyStr = "";
    req.on("data", (chunk) => {
      bodyStr += chunk;
      if (bodyStr.length > 1024 * 64) req.destroy();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(bodyStr || "{}");
        if (payload.botStatus !== undefined) discordConfig.botStatus = payload.botStatus;
        if (payload.botActivityType !== undefined) discordConfig.botActivityType = payload.botActivityType;
        if (payload.botStatusText !== undefined) discordConfig.botStatusText = payload.botStatusText;
        if (payload.botStreamingUrl !== undefined) discordConfig.botStreamingUrl = payload.botStreamingUrl;

        console.log("⚡ [API UPDATE-PRESENCE] Solicitando atualização imediata de presença no Discord:", {
          status: discordConfig.botStatus,
          activityType: discordConfig.botActivityType,
          statusText: discordConfig.botStatusText,
        });

        const updated = updateBotPresence();
        res.writeHead(updated ? 200 : 400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            success: updated,
            message: updated ? "Presença atualizada com sucesso no Discord" : "Cliente Discord não está pronto",
            currentConfig: {
              botStatus: discordConfig.botStatus,
              botActivityType: discordConfig.botActivityType,
              botStatusText: discordConfig.botStatusText,
              botStreamingUrl: discordConfig.botStreamingUrl,
            },
          })
        );
      } catch (err) {
        console.error("❌ [UPDATE-PRESENCE HTTP ERROR]:", err);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Rota para Buscar Cargos de um Servidor do Discord
  if (pathname === "/api/discord-roles" || pathname === "/api/guild-roles") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    const guildId = urlObj.searchParams.get("guildId") || discordConfig.guildId;
    if (!guildId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, error: "guildId é obrigatório" }));
    }

    try {
      const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
      if (!guild) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: "Servidor Discord não encontrado" }));
      }

      const roles = await guild.roles.fetch();
      const mapped = Array.from(roles.values()).map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        colorHex: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : "#99aab5",
        position: r.position,
        hoist: Boolean(r.hoist),
        managed: Boolean(r.managed),
        mentionable: Boolean(r.mentionable),
        icon: r.iconURL ? r.iconURL() : null,
        unicode_emoji: r.unicodeEmoji || null,
        flags: r.flags?.bitfield || 0,
      }));

      mapped.sort((a, b) => b.position - a.position);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: true, guildId, roles: mapped }));
    } catch (err) {
      console.error("❌ [DISCORD-ROLES ERROR]:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  // Rota para Criar Cargo no Discord para Tag
  if (pathname === "/api/create-discord-role" || pathname === "/api/create-role") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Método não permitido. Utilize POST." }));
    }

    let bodyStr = "";
    req.on("data", (chunk) => {
      bodyStr += chunk;
      if (bodyStr.length > 1024 * 64) req.destroy();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(bodyStr || "{}");
        const { guildId, name, colorHex, hoist, mentionable, targetPosition } = payload;

        if (!guildId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "guildId é obrigatório" }));
        }
        if (!name || !name.trim()) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "Nome do cargo é obrigatório" }));
        }

        const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
        if (!guild) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: `Servidor Discord ${guildId} não encontrado` }));
        }

        const roleColor = typeof colorHex === "string" ? hexToInt(colorHex) : colorHex || 0x3b82f6;

        console.log(`🏷️ [CREATE ROLE] Criando cargo "${name}" no servidor "${guild.name}" (${guild.id})...`);
        const newRole = await guild.roles.create({
          name: name.trim(),
          color: roleColor,
          hoist: Boolean(hoist !== false),
          mentionable: Boolean(mentionable),
          reason: "Twin Wheels: Cargo criado automaticamente para Tag na plataforma",
        });

        let finalPosition = newRole.position;
        if (targetPosition !== undefined && targetPosition >= 0) {
          try {
            await newRole.setPosition(targetPosition);
            finalPosition = newRole.position;
          } catch (posErr) {
            console.warn("⚠️ [CREATE ROLE] Não foi possível ajustar posição exata do cargo:", posErr.message);
          }
        }

        const formattedRole = {
          id: newRole.id,
          name: newRole.name,
          color: newRole.color,
          colorHex: newRole.color ? `#${newRole.color.toString(16).padStart(6, "0")}` : (colorHex || "#3b82f6"),
          position: finalPosition,
          hoist: Boolean(newRole.hoist),
          managed: Boolean(newRole.managed),
          mentionable: Boolean(newRole.mentionable),
        };

        console.log(`✅ [CREATE ROLE] Cargo criado com sucesso: ${newRole.name} (ID: ${newRole.id})`);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: true, role: formattedRole }));
      } catch (err) {
        console.error("❌ [CREATE ROLE ERROR]:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: err.message || "Erro ao criar cargo no Discord" }));
      }
    });
    return;
  }

  // Rota para Sincronizar Cargo de Membro do Discord (Adicionar ou Remover)
  if (pathname === "/api/sync-member-role" || pathname === "/api/member-role") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Método não permitido. Utilize POST." }));
    }

    let bodyStr = "";
    req.on("data", (chunk) => {
      bodyStr += chunk;
      if (bodyStr.length > 1024 * 64) req.destroy();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(bodyStr || "{}");
        const { guildId, discordId, roleId, action, tagName, memberName } = payload;

        if (!guildId || !discordId || !roleId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "guildId, discordId e roleId são obrigatórios" }));
        }

        const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
        if (!guild) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "Servidor não encontrado" }));
        }

        const member = await guild.members.fetch(discordId).catch(() => null);
        if (!member) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: `Membro ${discordId} não encontrado no Discord` }));
        }

        const role = guild.roles.cache.get(roleId) || (await guild.roles.fetch(roleId).catch(() => null));
        if (!role) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: `Cargo ${roleId} não encontrado no servidor` }));
        }

        const reason = `Twin Wheels: Tag ${tagName || "Tag"} ${action === "remove" ? "removida" : "atribuída"} para ${memberName || member.user.tag}`;

        if (action === "remove") {
          if (member.roles.cache.has(roleId)) {
            await member.roles.remove(role, reason);
          }
          console.log(`🗑️ [MEMBER ROLE] Cargo ${role.name} removido de ${member.user.tag}`);
        } else {
          if (!member.roles.cache.has(roleId)) {
            await member.roles.add(role, reason);
          }
          console.log(`✅ [MEMBER ROLE] Cargo ${role.name} adicionado a ${member.user.tag}`);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: true, message: `Cargo ${action === "remove" ? "removido" : "atribuído"} com sucesso` }));
      } catch (err) {
        console.error("❌ [SYNC-MEMBER-ROLE HTTP ERROR]:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Rota para Atualizar Posição Hierárquica do Cargo no Discord
  if (pathname === "/api/update-role-position" || pathname === "/api/role-position") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Método não permitido. Utilize POST." }));
    }

    let bodyStr = "";
    req.on("data", (chunk) => {
      bodyStr += chunk;
      if (bodyStr.length > 1024 * 64) req.destroy();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(bodyStr || "{}");
        const { guildId, roleId, position } = payload;

        if (!guildId || !roleId || position === undefined) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "guildId, roleId e position são obrigatórios" }));
        }

        const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
        if (!guild) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "Servidor não encontrado" }));
        }

        const role = guild.roles.cache.get(roleId) || (await guild.roles.fetch(roleId).catch(() => null));
        if (!role) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: `Cargo ${roleId} não encontrado no servidor` }));
        }

        console.log(`🔼 [ROLE POSITION] Alterando posição do cargo "${role.name}" (${role.id}) para #${position}...`);
        await role.setPosition(Number(position));
        console.log(`✅ [ROLE POSITION] Posição do cargo "${role.name}" alterada para #${role.position}`);

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: true, position: role.position, message: "Posição hierárquica atualizada com sucesso no Discord!" }));
      } catch (err) {
        console.error("❌ [UPDATE-ROLE-POSITION HTTP ERROR]:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: err.message || "Erro ao alterar posição do cargo no Discord" }));
      }
    });
    return;
  }

  // Rota para Simulação de Movimentação de Estoque (envio idêntico ao Cidade Alta APP para canal de teste)
  if (pathname === "/api/simulate-stock") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Método não permitido. Utilize POST." }));
    }

    let bodyStr = "";
    req.on("data", (chunk) => {
      bodyStr += chunk;
      if (bodyStr.length > 1024 * 512) req.destroy();
    });

    req.on("end", async () => {
      try {
        const payload = JSON.parse(bodyStr || "{}");
        const result = await handleSendSimulatedStock(payload);
        res.writeHead(result.success ? 200 : 400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(result));
      } catch (err) {
        console.error("❌ [SIMULATE-STOCK HTTP ERROR]:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Rota para Upload de Imagens no Postimages.org (Zero Supabase Storage/Egress)
  if (pathname === "/api/upload-image") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Filename, Accept");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Método não permitido. Utilize POST." }));
    }

    const chunks = [];
    let totalLen = 0;
    req.on("data", (chunk) => {
      chunks.push(chunk);
      totalLen += chunk.length;
      if (totalLen > 20 * 1024 * 1024) req.destroy();
    });

    req.on("end", async () => {
      try {
        const rawBuffer = Buffer.concat(chunks);
        const contentType = req.headers["content-type"] || "";
        let fileBuffer, fileName, mimeType;

        if (contentType.includes("application/json")) {
          const json = JSON.parse(rawBuffer.toString("utf8"));
          fileName = json.filename || `img_${Date.now()}.png`;
          const base64Str = json.base64 || "";
          const commaIdx = base64Str.indexOf(",");
          const base64Data = commaIdx !== -1 ? base64Str.slice(commaIdx + 1) : base64Str;
          fileBuffer = Buffer.from(base64Data, "base64");
          mimeType = json.contentType || "image/png";
        } else {
          fileName = req.headers["x-filename"] || `img_${Date.now()}.png`;
          fileBuffer = rawBuffer;
          mimeType = contentType.split(";")[0] || "image/png";
        }

        const cdnUrl = await uploadBufferToPostimages(fileBuffer, fileName, mimeType);
        const proxiedUrl = `https://twin.discloud.app/api/image?url=${encodeURIComponent(cdnUrl)}`;
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: true, url: cdnUrl, cdnUrl, proxiedUrl }));
      } catch (err) {
        console.error("❌ [UPLOAD POSTIMAGES ERROR]:", err);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Rota para Consulta Live de Mensagens (Bot Studio)
  if (pathname === "/api/channel-messages") {
    const channelId = urlObj.searchParams.get("channelId");
    if (!channelId) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "channelId é obrigatório" }));
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Canal não encontrado ou sem permissão de leitura" }));
    }

    try {
      const messages = await channel.messages.fetch({ limit: 20 });
      const formatted = Array.from(messages.values()).map((m) => ({
        id: m.id,
        content: m.content || "",
        channel_id: m.channelId,
        author: {
          id: m.author.id,
          username: m.author.username,
          displayName: m.author.displayName || m.author.username,
          avatar: m.author.displayAvatarURL ? m.author.displayAvatarURL() : null,
          bot: m.author.bot,
        },
        embeds: m.embeds.map((e) => ({
          title: e.title || null,
          description: e.description || null,
          fields: e.fields || [],
          author: e.author ? { name: e.author.name, iconURL: e.author.iconURL } : null,
          footer: e.footer ? { text: e.footer.text, iconURL: e.footer.iconURL } : null,
          color: e.color || null,
          timestamp: e.timestamp || null,
        })),
        createdTimestamp: m.createdTimestamp,
        createdAt: m.createdAt.toISOString(),
      }));

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ channelId, count: formatted.length, messages: formatted }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      app: "Twin Wheels Bot - Direct Discord Logs & Webhooks",
      status: "online",
      botUser: client.user ? client.user.tag : null,
      guilds: client.guilds.cache.size,
      uptimeSeconds: Math.floor(process.uptime()),
      discordLogsEnabled: discordConfig.enabled,
    })
  );
});

server.listen(8080, () => {
  console.log("🌐 Servidor HTTP ouvindo na porta 8080 (Discloud)");
});

// Evento disparado quando o bot se conecta
let initialized = false;
const onReady = async () => {
  if (initialized) return;
  initialized = true;

  console.log(`✅ Twin Wheels Bot conectado com sucesso como ${client.user.tag}`);

  // 1. Carrega configurações do Discord e atualiza presença
  await loadDiscordConfig();

  // 1.1. Inicializa o Escudo de Segurança e Anti-Spam Dinâmico do Supabase
  await initDynamicAntiSpam(supabase);

  // 2. Atualiza caches de perfis, produtos e baús
  await refreshAuxiliaryCaches();

  // 3. Pré-carrega cache de servidores
  await warmUpGuildMembers();

  // 4. Inicia listeners em tempo real para audit_logs
  setupRealtimeListeners();

  // 5. Primeira sincronização completa de todos os perfis
  await syncAllProfiles();

  // 6. Carrega projetos da Bot Engine e escuta Realtime
  await loadBotProjects();
  setupBotEngineRealtime();

  // 7. Motor de Transmissões ao Vivo desativado para economia de banco de dados
  // initLiveStreamEngine(supabase, client);

  // 8. Inicializa listener Realtime de simulação de estoque
  try {
    const simChannel = supabase.channel("system-stock-simulate");
    simChannel
      .on("broadcast", { event: "simulate_stock" }, async (payload) => {
        if (payload?.payload) {
          console.log("📡 [REALTIME] Solicitação de simulação de estoque recebida via Supabase broadcast");
          try {
            await handleSendSimulatedStock(payload.payload);
          } catch (e) {
            console.error("❌ [REALTIME] Erro ao processar simulate_stock:", e.message);
          }
        }
      })
      .subscribe();
    console.log("📡 [REALTIME] Canal 'system-stock-simulate' pronto para testes remotos.");
  } catch (err) {
    console.warn("⚠️ Falha ao registrar canal system-stock-simulate:", err.message);
  }

  // Sincronização periódica de segurança a cada 15 minutos (alterações em tempo real são ouvidas via userUpdate)
  setInterval(syncAllProfiles, 15 * 60 * 1000);

  // Sincroniza Avatar e Banner oficiais do Bot no Discord na inicialização
  if (discordConfig.botAvatarUrl || discordConfig.botBannerUrl) {
    syncDiscordBotProfile(discordConfig.botAvatarUrl, discordConfig.botBannerUrl).catch((e) => {
      console.warn("⚠️ [ON READY] Falha ao sincronizar perfil do bot:", e.message);
    });
  }

  // Recarrega caches auxiliares a cada 5 minutos
  setInterval(refreshAuxiliaryCaches, 5 * 60 * 1000);
};

client.once(Events?.ClientReady || "ready", onReady);

// 1. Escuta em tempo real: evento userUpdate do Discord
client.on("userUpdate", async (oldUser, newUser) => {
  const oldAvatar = oldUser ? oldUser.displayAvatarURL({ extension: "png", forceStatic: false, size: 512 }) : null;
  const newAvatar = newUser.displayAvatarURL({ extension: "png", forceStatic: false, size: 512 });

  if (oldAvatar !== newAvatar) {
    console.log(`[REALTIME userUpdate] Avatar alterado para: ${newUser.tag} (${newUser.id})`);
    await updateProfileAvatar(newUser.id, newAvatar, newUser.tag);
  }
});

// 2. Escuta em tempo real: evento guildMemberUpdate do Discord
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  const oldAvatar = oldMember ? oldMember.displayAvatarURL({ extension: "png", forceStatic: false, size: 512 }) : null;
  const newAvatar = newMember.displayAvatarURL({ extension: "png", forceStatic: false, size: 512 });

  if (oldAvatar !== newAvatar) {
    console.log(`[REALTIME guildMemberUpdate] Avatar alterado para membro: ${newMember.user.tag} (${newMember.id})`);
    await updateProfileAvatar(newMember.user.id, newAvatar, newMember.user.tag);
  }
});

// ==========================================
// BOT ENGINE RUNTIME (Discord Command & Event Interpreter)
// ==========================================
let botProjects = [];
let isSyncingSlashCommands = false;

/**
 * Registra e sincroniza comandos do Bot Studio como Discord Slash Commands (/comando)
 * Registra globalmente e também nos servidores (Guilds) conectados para disponibilidade imediata sem atraso de cache.
 */
async function syncSlashCommands() {
  if (isSyncingSlashCommands) return;
  if (!client || !client.isReady() || !client.application || !client.token) {
    return;
  }
  isSyncingSlashCommands = true;

  try {
    const globalCommands = [];
    const guildCommandsMap = new Map();

    for (const bot of (botProjects || [])) {
      if (!bot.enabled) continue;
      for (const cmd of (bot.commands || [])) {
        if (!cmd.enabled) continue;

        // Discord slash command name: /^[a-z0-9_-]{1,32}$/
        const cleanName = (cmd.name || "")
          .toLowerCase()
          .trim()
          .replace(/^[!/]/, "")
          .replace(/[^a-z0-9_-]/g, "_")
          .slice(0, 32);

        if (!cleanName || cleanName.length < 1) continue;

        const description = (cmd.description?.trim() || `Comando /${cleanName} do grupo Twin Wheels`).slice(0, 100);

        const options = [];
        if (Array.isArray(cmd.parameters) && cmd.parameters.length > 0) {
          for (const param of cmd.parameters) {
            const paramName = (param.name || "arg")
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9_-]/g, "_")
              .slice(0, 32);

            if (!paramName) continue;

            // ApplicationCommandOptionType:
            // 3: String, 4: Integer, 5: Boolean, 6: User, 7: Channel, 8: Role, 10: Number
            let optType = 3;
            if (param.type === "number") optType = 10;
            else if (param.type === "integer") optType = 4;
            else if (param.type === "boolean") optType = 5;
            else if (param.type === "user") optType = 6;
            else if (param.type === "channel") optType = 7;
            else if (param.type === "role") optType = 8;

            options.push({
              name: paramName,
              description: (param.description?.trim() || `Parâmetro ${paramName}`).slice(0, 100),
              type: optType,
              required: Boolean(param.required),
            });
          }
        }

        const cmdData = {
          name: cleanName,
          description,
          options,
        };

        const targetGuild = cmd.guildId || bot.guildId;
        if (targetGuild && targetGuild !== "all") {
          if (!guildCommandsMap.has(targetGuild)) guildCommandsMap.set(targetGuild, []);
          guildCommandsMap.get(targetGuild).push(cmdData);
        } else {
          globalCommands.push(cmdData);
        }
      }
    }

    // 1. Registra comandos globais
    await client.application.commands.set(globalCommands).catch((err) => {
      console.warn("⚠️ [SLASH COMMANDS] Falha ao registrar comandos globais:", err.message);
    });

    // 2. Registra nos servidores conectados para ativação instantânea na interface do Discord
    for (const [guildId, guild] of client.guilds.cache.entries()) {
      const specific = guildCommandsMap.get(guildId) || [];
      const combined = [...globalCommands, ...specific];
      const unique = Array.from(new Map(combined.map((c) => [c.name, c])).values());

      await guild.commands.set(unique).then(() => {
        console.log(`⚡ [SLASH COMMANDS] ${unique.length} Slash Command(s) ativo(s) no servidor "${guild.name}"!`);
      }).catch((gErr) => {
        console.warn(`⚠️ [SLASH COMMANDS] Falha ao registrar no servidor ${guild.name}:`, gErr.message);
      });
    }
  } catch (err) {
    console.error("❌ [SLASH COMMANDS] Erro ao sincronizar Slash Commands:", err.message);
  } finally {
    isSyncingSlashCommands = false;
  }
}

async function loadBotProjects() {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", "system_bots_v1")
      .maybeSingle();

    if (!error && data && Array.isArray(data.permissions)) {
      botProjects = data.permissions;
      console.log(`🤖 Bot Projects sincronizados: ${botProjects.length} projeto(s)`);
      await syncSlashCommands();
    }
  } catch (err) {
    console.warn("⚠️ Falha ao carregar botProjects do Supabase:", err.message);
  }
}

function setupBotEngineRealtime() {
  try {
    // 1. Escuta broadcasts nos dois canais para garantir compatibilidade
    const channel1 = supabase.channel("system-bot-sync");
    channel1
      .on("broadcast", { event: "bots_updated" }, async (payload) => {
        if (Array.isArray(payload?.payload)) {
          botProjects = payload.payload;
          console.log(`🤖 [REALTIME sync] Bot Projects atualizados via broadcast: ${botProjects.length} projeto(s)`);
          await syncSlashCommands();
        }
      })
      .subscribe();

    const channel2 = supabase.channel("system-bot-sync-listener");
    channel2
      .on("broadcast", { event: "bots_updated" }, async (payload) => {
        if (Array.isArray(payload?.payload)) {
          botProjects = payload.payload;
          console.log(`🤖 [REALTIME listener] Bot Projects atualizados via broadcast: ${botProjects.length} projeto(s)`);
          await syncSlashCommands();
        }
      })
      .subscribe();

    // 2. Escuta mudanças na tabela role_permissions diretamente
    supabase
      .channel("system-bot-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "role_permissions", filter: "level=eq.system_bots_v1" },
        async () => {
          console.log("🤖 [REALTIME DB] Detectada alteração na tabela de bots, recarregando...");
          await loadBotProjects();
        }
      )
      .subscribe();

    // 3. Polling automático periódico (a cada 15 segundos) como garantia de sincronia
    setInterval(() => {
      loadBotProjects().catch(() => {});
    }, 15000);
  } catch (err) {
    console.warn("⚠️ Falha ao subscrever no Realtime do Bot Engine:", err.message);
  }
}

function interpolateBotText(template, context) {
  if (!template || typeof template !== "string") return "";
  let result = template;
  result = result.replace(/\{\{user\.name\}\}/g, context.user?.username || "Usuário");
  result = result.replace(/\{\{user\.id\}\}/g, context.user?.id || "");
  result = result.replace(/\{\{user\.mention\}\}/g, context.user ? `<@${context.user.id}>` : "");
  result = result.replace(/\{\{user\.tag\}\}/g, context.user?.tag || context.user?.username || "");
  result = result.replace(/\{\{bot\.name\}\}/g, context.bot?.name || client.user?.username || "Twin Wheels Bot");
  result = result.replace(/\{\{bot\.prefix\}\}/g, context.bot?.prefix || "!");
  result = result.replace(/\{\{channel\.name\}\}/g, context.channel?.name || "canal");
  result = result.replace(/\{\{channel\.id\}\}/g, context.channel?.id || "");
  result = result.replace(/\{\{channel\.mention\}\}/g, context.channel ? `<#${context.channel.id}>` : "");
  result = result.replace(/\{\{guild\.name\}\}/g, context.guild?.name || "Servidor");
  result = result.replace(/\{\{guild\.id\}\}/g, context.guild?.id || "");
  result = result.replace(/\{\{date\}\}/g, new Date().toLocaleDateString("pt-BR"));
  result = result.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString("pt-BR"));
  result = result.replace(/\{\{datetime\}\}/g, new Date().toLocaleString("pt-BR"));

  if (context.args && typeof context.args === "object") {
    for (const [k, v] of Object.entries(context.args)) {
      const valStr = String(v ?? "");
      // Suporta {{args.k}}, {{k}}, <k>, {k}
      result = result.replace(new RegExp(`\\{\\{args\\.${k}\\}\\}`, "gi"), valStr);
      result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, "gi"), valStr);
      result = result.replace(new RegExp(`<${k}>`, "gi"), valStr);
      result = result.replace(new RegExp(`\\{${k}\\}`, "gi"), valStr);
    }
  }

  if (context.vars && typeof context.vars === "object") {
    for (const [k, v] of Object.entries(context.vars)) {
      const valStr = String(v ?? "");
      result = result.replace(new RegExp(`\\{\\{vars\\.${k}\\}\\}`, "gi"), valStr);
      result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, "gi"), valStr);
      result = result.replace(new RegExp(`\\{${k}\\}`, "gi"), valStr);
    }
  }

  return result;
}

function evaluateBotConditions(conditionGroups, context) {
  if (!conditionGroups || !Array.isArray(conditionGroups) || conditionGroups.length === 0) return true;
  for (const group of conditionGroups) {
    if (!group.conditions || group.conditions.length === 0) continue;
    const isOr = group.logic === "OR";
    let groupPassed = !isOr;

    for (const cond of group.conditions) {
      let val = "";
      if (cond.field === "user.name") val = context.user?.username || "";
      else if (cond.field === "user.id") val = context.user?.id || "";
      else if (cond.field === "message.content") val = context.message?.content || "";
      else if (cond.field === "user.roles") {
        const memberRoles = context.member?.roles?.cache?.map((r) => r.name.toLowerCase()) || [];
        const hasRole = memberRoles.includes(String(cond.value).toLowerCase());
        if (isOr) {
          if (hasRole) {
            groupPassed = true;
            break;
          }
        } else {
          if (!hasRole) {
            groupPassed = false;
            break;
          }
        }
        continue;
      }

      let passed = false;
      if (cond.operator === "equals") passed = String(val).toLowerCase() === String(cond.value).toLowerCase();
      else if (cond.operator === "contains") passed = String(val).toLowerCase().includes(String(cond.value).toLowerCase());
      else passed = true;

      if (isOr) {
        if (passed) {
          groupPassed = true;
          break;
        }
      } else {
        if (!passed) {
          groupPassed = false;
          break;
        }
      }
    }

    if (!groupPassed) return false;
  }
  return true;
}

async function executeBotActions(actions, context) {
  if (!Array.isArray(actions) || actions.length === 0) return;
  const sorted = [...actions].sort((a, b) => (a.order || 0) - (b.order || 0));

  for (const action of sorted) {
    try {
      if (action.type === "send_message" || action.type === "reply_message") {
        const title = interpolateBotText(action.config?.title || "", context);
        const description = interpolateBotText(action.config?.description || "", context);
        const color = hexToInt(action.config?.color || "#10B981");

        let embed = null;
        if (title || description) {
          embed = new EmbedBuilder().setColor(color).setTimestamp();
          if (title) embed.setTitle(title);
          if (description) embed.setDescription(description);
        }

        const content = action.config?.content ? interpolateBotText(action.config.content, context) : undefined;
        const msgOptions = {};
        if (content) msgOptions.content = content;
        if (embed) msgOptions.embeds = [embed];

        // Validação de Shield Anti-Spam antes de postar mensagem
        const spamCheck = isSpamOrMalicious(content, embed ? [embed] : []);
        if (spamCheck.isBlocked) {
          console.warn(`⚠️ [BOT ACTION BLOCKED] Ação cancelada por conter spam/links proibidos: ${spamCheck.reason}`);
          continue;
        }

        // Determina canal de destino (específico da ação ou canal atual)
        let targetChannel = context.channel;
        if (action.config?.channelId) {
          const resolved = client.channels.cache.get(action.config.channelId) || (context.guild ? context.guild.channels.cache.get(action.config.channelId) : null);
          if (resolved && resolved.isTextBased && resolved.isTextBased()) {
            targetChannel = resolved;
          }
        }

        // Se a ação for disparada por um Slash Command (interaction) no canal atual
        if (context.interaction && (!action.config?.channelId || action.config.channelId === context.channel?.id)) {
          if (context.interaction.deferred && !context.interaction.replied) {
            await context.interaction.editReply(msgOptions).catch(async (e) => {
              console.warn("⚠️ Falha ao editar resposta de interaction:", e.message);
              if (targetChannel) await targetChannel.send(msgOptions).catch(() => {});
            });
            context.interaction.replied = true;
          } else {
            await context.interaction.followUp({
              ...msgOptions,
              ephemeral: Boolean(action.config?.ephemeral || context.command?.ephemeral),
            }).catch(async () => {
              if (targetChannel) await targetChannel.send(msgOptions).catch(() => {});
            });
          }
        } else if (action.type === "reply_message" && context.message) {
          await context.message.reply(msgOptions).catch(async () => {
            if (targetChannel) await targetChannel.send(msgOptions).catch(() => {});
          });
        } else if (targetChannel) {
          await targetChannel.send(msgOptions).catch((err) => {
            console.warn(`⚠️ Erro ao enviar mensagem no canal ${targetChannel.id}:`, err.message);
          });
        }
      } else if (action.type === "delete_message" && context.message) {
        await context.message.delete().catch(() => {});
      } else if (action.type === "add_role" && context.member && action.config?.roleId) {
        await context.member.roles.add(action.config.roleId).catch(() => {});
      } else if (action.type === "remove_role" && context.member && action.config?.roleId) {
        await context.member.roles.remove(action.config.roleId).catch(() => {});
      } else if (action.type === "delay" && action.config?.delayMs) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(action.config.delayMs, 10000)));
      } else if (action.type === "log_audit") {
        await supabase.from("audit_logs").insert({
          action: action.config?.actionName || "bot_action",
          details: {
            message: interpolateBotText(action.config?.details || "", context),
            user: context.user?.username,
            channel: context.channel?.name,
          },
        }).catch(() => {});
      }
    } catch (actErr) {
      console.warn(`⚠️ Erro ao executar ação ${action.type}:`, actErr.message);
    }
  }
}

// 3. Escuta em tempo real: Comandos de texto e eventos message_create
client.on("messageCreate", async (message) => {
  // Filtro Anti-Spam Universal: intercepta qualquer mensagem contendo spam no servidor
  const spamCheck = isSpamOrMalicious(message.content, message.embeds);
  if (spamCheck.isBlocked) {
    console.warn(`🛡️ [ANTI-SPAM GUARD] Mensagem de spam de ${message.author?.tag || 'Desconhecido'} descartada: ${spamCheck.reason}`);
    recordBlockedSpam(spamCheck.reason, {
      channelId: message.channelId,
      channelName: message.channel?.name,
      author: message.author?.tag,
    });

    const activeConfig = getActiveAntiSpamConfig();
    if (activeConfig?.autoDeleteChannelSpam !== false && message.deletable) {
      message.delete().catch(() => {});
      console.log(`🧹 [ANTI-SPAM AUTO-DELETE] Mensagem de spam deletada instantaneamente do canal #${message.channel?.name || message.channelId}`);
    }
    return;
  }

  if (message.author.bot) return;
  if (!botProjects || botProjects.length === 0) return;

  for (const bot of botProjects) {
    if (!bot.enabled) continue;

    // A. Comandos com prefixo
    let commandMatched = false;
    for (const cmd of (bot.commands || [])) {
      if (!cmd.enabled) continue;

      // Restrição de servidor (Guild ID)
      const targetGuild = cmd.guildId || bot.guildId;
      if (targetGuild && targetGuild !== "all" && message.guild?.id !== targetGuild) {
        continue;
      }

      // Prefixo dinâmico: aceita cmd.prefix, bot.prefix, "!" ou "/"
      const prefixes = Array.from(new Set([cmd.prefix, bot.prefix, "!", "/"].filter(Boolean)));
      const matchedPrefix = prefixes.find((p) => message.content.startsWith(p));
      if (!matchedPrefix) continue;

      const rawContent = message.content.slice(matchedPrefix.length).trim();
      const parts = rawContent.split(/\s+/);
      const invokedName = parts[0]?.toLowerCase();
      if (!invokedName) continue;

      const cleanCmdName = (cmd.name || "").toLowerCase().replace(/^[!/]/, "");
      const cleanAliases = (cmd.aliases || []).map((a) => a.toLowerCase().replace(/^[!/]/, ""));

      if (invokedName !== cleanCmdName && !cleanAliases.includes(invokedName)) {
        continue;
      }

      // Argumentos
      const argValues = parts.slice(1);
      const args = {
        all: argValues.join(" "),
        "0": argValues[0] || "",
        "1": argValues[1] || "",
        "2": argValues[2] || "",
      };

      if (Array.isArray(cmd.parameters) && cmd.parameters.length > 0) {
        cmd.parameters.forEach((param, idx) => {
          if (idx === cmd.parameters.length - 1 && param.type === "string") {
            args[param.name] = argValues.slice(idx).join(" ");
          } else {
            args[param.name] = argValues[idx] || param.defaultValue || "";
          }
        });
      } else {
        // Fallback genérico caso a ação referencie {{texto}} ou {{mensagem}}
        args["texto"] = argValues.join(" ");
        args["mensagem"] = argValues.join(" ");
      }

      const vars = {};
      if (Array.isArray(bot.variables)) {
        bot.variables.forEach((v) => {
          vars[v.name] = v.value;
        });
      }

      const context = {
        user: message.author,
        member: message.member,
        channel: message.channel,
        guild: message.guild,
        message,
        args,
        vars,
        bot,
      };

      if (evaluateBotConditions(cmd.conditions, context)) {
        console.log(`⚡ [COMANDO EXECUTADO] ${matchedPrefix}${invokedName} por ${message.author.tag} no servidor ${message.guild?.name || "DM"}`);
        await executeBotActions(cmd.actions, context);
      }
      commandMatched = true;
      break;
    }

    if (commandMatched) continue;

    // B. Eventos disparados ao enviar mensagem (message_create)
    const msgEvents = bot.events?.filter((e) => e.enabled && e.triggerType === "message_create");
    if (msgEvents && msgEvents.length > 0) {
      for (const evt of msgEvents) {
        const targetGuild = evt.guildId || bot.guildId;
        if (targetGuild && targetGuild !== "all" && message.guild?.id !== targetGuild) {
          continue;
        }

        const vars = {};
        if (Array.isArray(bot.variables)) {
          bot.variables.forEach((v) => {
            vars[v.name] = v.value;
          });
        }

        const context = {
          user: message.author,
          member: message.member,
          channel: message.channel,
          guild: message.guild,
          message,
          vars,
          bot,
        };

        if (evaluateBotConditions(evt.conditions, context)) {
          await executeBotActions(evt.actions, context);
        }
      }
    }
  }
});

// 3.1. Escuta em tempo real: Discord Slash Commands (interactionCreate)
client.on(Events?.InteractionCreate || "interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand || !interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    console.log(`⚡ [SLASH COMMAND RECEBIDO] /${commandName} acionado por ${interaction.user.tag} (${interaction.user.id}) no canal #${interaction.channel?.name || "DM"}`);

    let matchedCmd = null;
    let matchedBot = null;

    for (const bot of (botProjects || [])) {
      if (!bot.enabled) continue;
      for (const cmd of (bot.commands || [])) {
        if (!cmd.enabled) continue;
        const cleanName = (cmd.name || "")
          .toLowerCase()
          .trim()
          .replace(/^[!/]/, "")
          .replace(/[^a-z0-9_-]/g, "_")
          .slice(0, 32);

        if (cleanName === commandName) {
          matchedCmd = cmd;
          matchedBot = bot;
          break;
        }
      }
      if (matchedCmd) break;
    }

    if (!matchedCmd) {
      return interaction.reply({
        content: `❌ O comando \`/${commandName}\` não está ativo ou foi removido do painel Twin Wheels.`,
        ephemeral: true,
      }).catch(() => {});
    }

    // Validação de servidor (Guild ID)
    const targetGuild = matchedCmd.guildId || matchedBot.guildId;
    if (targetGuild && targetGuild !== "all" && interaction.guildId !== targetGuild) {
      return interaction.reply({
        content: "🔒 Este comando não está autorizado para execução neste servidor Discord.",
        ephemeral: true,
      }).catch(() => {});
    }

    // Validação de cargos necessários
    if (Array.isArray(matchedCmd.requiredRoles) && matchedCmd.requiredRoles.length > 0) {
      const memberRoles = interaction.member?.roles?.cache?.map((r) => r.name.toLowerCase()) || [];
      const hasReqRole = matchedCmd.requiredRoles.some((r) => memberRoles.includes(r.toLowerCase()));
      if (!hasReqRole) {
        return interaction.reply({
          content: "🔒 Você não possui o cargo necessário no servidor para executar este comando.",
          ephemeral: true,
        }).catch(() => {});
      }
    }

    // Coleta todos os parâmetros / opções passados
    const args = {
      all: "",
    };

    if (interaction.options && interaction.options.data) {
      const allVals = [];
      for (const opt of interaction.options.data) {
        args[opt.name] = opt.value;
        allVals.push(String(opt.value ?? ""));

        if (opt.user) {
          args[`${opt.name}_user`] = opt.user.username;
          args[`${opt.name}_id`] = opt.user.id;
          args[`${opt.name}_mention`] = `<@${opt.user.id}>`;
          args["user_mention"] = `<@${opt.user.id}>`;
          args["user_id"] = opt.user.id;
        }
        if (opt.channel) {
          args[`${opt.name}_channel`] = opt.channel.name;
          args[`${opt.name}_id`] = opt.channel.id;
          args[`${opt.name}_mention`] = `<#${opt.channel.id}>`;
        }
        if (opt.role) {
          args[`${opt.name}_role`] = opt.role.name;
          args[`${opt.name}_id`] = opt.role.id;
          args[`${opt.name}_mention`] = `<@&${opt.role.id}>`;
        }
      }
      args.all = allVals.join(" ");
    }

    // Monta variáveis do bot
    const vars = {};
    if (Array.isArray(matchedBot.variables)) {
      matchedBot.variables.forEach((v) => {
        vars[v.name] = v.value;
      });
    }

    const context = {
      user: interaction.user,
      member: interaction.member,
      channel: interaction.channel,
      guild: interaction.guild,
      interaction,
      command: matchedCmd,
      args,
      vars,
      bot: matchedBot,
    };

    // Valida condições
    if (!evaluateBotConditions(matchedCmd.conditions, context)) {
      return interaction.reply({
        content: "⚠️ As condições configuradas para a execução deste comando não foram atendidas.",
        ephemeral: true,
      }).catch(() => {});
    }

    // Defer reply para evitar erro de 3 segundos no Discord
    const isEphemeral = Boolean(matchedCmd.ephemeral);
    await interaction.deferReply({ ephemeral: isEphemeral }).catch(() => {});

    // Executa as ações configuradas
    await executeBotActions(matchedCmd.actions, context);

    // Se a interação ainda não foi respondida por nenhuma ação, finaliza com confirmação
    if (!interaction.replied) {
      await interaction.editReply({
        content: `✅ Comando \`/${commandName}\` executado com sucesso!`,
      }).catch(() => {});
    }

    // Atualiza estatísticas do bot
    matchedBot.stats = matchedBot.stats || {};
    matchedBot.stats.totalExecutions = (matchedBot.stats.totalExecutions || 0) + 1;
    matchedBot.stats.lastExecutedAt = new Date().toISOString();

    console.log(`✅ [SLASH COMMAND FINALIZADO] /${commandName} executado para ${interaction.user.tag}`);

    // Dispara evento 'command_ran' se configurado no bot
    const ranEvents = matchedBot.events?.filter((e) => e.enabled && e.triggerType === "command_ran");
    if (ranEvents && ranEvents.length > 0) {
      for (const evt of ranEvents) {
        if (evaluateBotConditions(evt.conditions, context)) {
          await executeBotActions(evt.actions, context).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error("❌ Erro no processamento de Slash Command:", err);
    try {
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content: "❌ Ocorreu um erro ao processar o comando no servidor." }).catch(() => {});
      } else if (!interaction.replied) {
        await interaction.reply({ content: "❌ Ocorreu um erro ao processar o comando no servidor.", ephemeral: true }).catch(() => {});
      }
    } catch {}
  }
});

// 4. Escuta em tempo real: Membro entrou no servidor (member_join)
client.on("guildMemberAdd", async (member) => {
  if (!botProjects) return;
  for (const bot of botProjects) {
    if (!bot.enabled) continue;
    const events = bot.events?.filter((e) => e.enabled && e.triggerType === "member_join");
    if (!events || events.length === 0) continue;

    for (const evt of events) {
      const targetGuild = evt.guildId || bot.guildId;
      if (targetGuild && targetGuild !== "all" && member.guild?.id !== targetGuild) {
        continue;
      }

      const defaultChannel = member.guild.systemChannel || member.guild.channels.cache.find((c) => c.isTextBased && c.isTextBased());
      const vars = {};
      if (Array.isArray(bot.variables)) {
        bot.variables.forEach((v) => {
          vars[v.name] = v.value;
        });
      }

      const context = {
        user: member.user,
        member,
        channel: defaultChannel,
        guild: member.guild,
        vars,
        bot,
      };

      if (evaluateBotConditions(evt.conditions, context)) {
        await executeBotActions(evt.actions, context);
      }
    }
  }
});

// 5. Escuta em tempo real: Membro saiu do servidor (member_leave)
client.on("guildMemberRemove", async (member) => {
  if (!botProjects) return;
  for (const bot of botProjects) {
    if (!bot.enabled) continue;
    const events = bot.events?.filter((e) => e.enabled && e.triggerType === "member_leave");
    if (!events || events.length === 0) continue;

    for (const evt of events) {
      const targetGuild = evt.guildId || bot.guildId;
      if (targetGuild && targetGuild !== "all" && member.guild?.id !== targetGuild) {
        continue;
      }

      const defaultChannel = member.guild.systemChannel || member.guild.channels.cache.find((c) => c.isTextBased && c.isTextBased());
      const vars = {};
      if (Array.isArray(bot.variables)) {
        bot.variables.forEach((v) => {
          vars[v.name] = v.value;
        });
      }

      const context = {
        user: member.user,
        member,
        channel: defaultChannel,
        guild: member.guild,
        vars,
        bot,
      };

      if (evaluateBotConditions(evt.conditions, context)) {
        await executeBotActions(evt.actions, context);
      }
    }
  }
});

// 6. Rotina de Timers / Automações programadas (a cada 60s)
setInterval(async () => {
  if (!botProjects || botProjects.length === 0) return;
  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, "0");
  const currentMinute = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${currentHour}:${currentMinute}`;

  for (const bot of botProjects) {
    if (!bot.enabled) continue;
    const timers = bot.timers?.filter((t) => t.enabled);
    if (!timers || timers.length === 0) continue;

    for (const timer of timers) {
      const targetGuild = timer.guildId || bot.guildId;
      let shouldRun = false;
      if (timer.scheduleType === "daily" && timer.scheduleConfig?.timeOfDay === currentTime) {
        shouldRun = true;
      }

      if (shouldRun) {
        const guild = targetGuild && targetGuild !== "all" ? client.guilds.cache.get(targetGuild) : client.guilds.cache.first();
        if (!guild) continue;
        const channel = guild.systemChannel || guild.channels.cache.find((c) => c.isTextBased && c.isTextBased());
        if (!channel) continue;

        const vars = {};
        if (Array.isArray(bot.variables)) {
          bot.variables.forEach((v) => {
            vars[v.name] = v.value;
          });
        }

        const context = {
          guild,
          channel,
          bot,
          vars,
        };

        if (evaluateBotConditions(timer.conditions, context)) {
          await executeBotActions(timer.actions, context);
        }
      }
    }
  }
}, 60 * 1000);



// 7. Sincronização em tempo real de Tags com Cargos do Discord
const tagSyncChannel = supabase.channel("system-discord-tag-sync");
tagSyncChannel
  .on("broadcast", { event: "sync_member_tag_role" }, async (payload) => {
    try {
      const data = payload?.payload;
      if (!data || !data.discordId || !data.guildId || !data.roleId) return;

      const guild =
        client.guilds.cache.get(data.guildId) ||
        (await client.guilds.fetch(data.guildId).catch(() => null));
      if (!guild) {
        console.warn(`⚠️ [TAG DISCORD SYNC] Servidor não encontrado: ${data.guildId}`);
        return;
      }

      const member = await guild.members.fetch(data.discordId).catch(() => null);
      if (!member) {
        console.warn(`⚠️ [TAG DISCORD SYNC] Membro não encontrado no Discord: ${data.discordId}`);
        return;
      }

      const role =
        guild.roles.cache.get(data.roleId) ||
        (await guild.roles.fetch(data.roleId).catch(() => null));
      if (!role) {
        console.warn(`⚠️ [TAG DISCORD SYNC] Cargo não encontrado no servidor: ${data.roleId}`);
        return;
      }

      if (data.action === "add") {
        if (!member.roles.cache.has(data.roleId)) {
          await member.roles.add(role, `Twin Wheels: Tag ${data.tagName || data.tagId} atribuída`);
          console.log(`✅ [TAG DISCORD SYNC] Cargo ${role.name} adicionado ao membro ${member.user.tag}`);
        }
      } else if (data.action === "remove") {
        if (member.roles.cache.has(data.roleId)) {
          await member.roles.remove(role, `Twin Wheels: Tag ${data.tagName || data.tagId} removida`);
          console.log(`🗑️ [TAG DISCORD SYNC] Cargo ${role.name} removido do membro ${member.user.tag}`);
        }
      }
    } catch (syncErr) {
      console.warn("⚠️ [TAG DISCORD SYNC] Erro ao sincronizar cargo no Discord:", syncErr.message);
    }
  })
  .subscribe();

// Inicializa motor de estoque Discord com sincronização em tempo real
initStockEngine(client, supabase);

// Função principal de inicialização assíncrona do bot
async function startBot() {
  try {
    // 1. Tenta carregar token prioritário diretamente do banco de dados antes do primeiro login
    try {
      const { data } = await supabase
        .from("role_permissions")
        .select("permissions")
        .eq("level", "system_discord_config")
        .maybeSingle();

      if (data?.permissions?.botToken && String(data.permissions.botToken).trim().length > 20) {
        currentBotToken = String(data.permissions.botToken).trim();
        console.log("🔑 [DISCORD AUTH] Token carregado com sucesso do banco de dados Supabase.");
      }
    } catch (dbTokenErr) {
      console.warn("⚠️ Não foi possível obter token inicial do banco:", dbTokenErr.message);
    }

    // 2. Login no Discord com token ativo
    const tokenToUse = currentBotToken || process.env.DISCORD_BOT_TOKEN;
    if (!tokenToUse) {
      console.error("❌ [DISCORD AUTH] Nenhum token do Discord configurado.");
      return;
    }

    await client.login(tokenToUse);
    console.log("🚀 [DISCORD AUTH] Login realizado com sucesso no Discord!");
  } catch (loginErr) {
    console.error("❌ [DISCORD AUTH] Falha crítica ao inicializar bot do Discord:", loginErr.message);
  }
}

startBot();

