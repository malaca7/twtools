require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, Events } = require("discord.js");
const { createClient } = require("@supabase/supabase-js");
const http = require("http");
const { initLiveStreamEngine, getLiveStreamEngine } = require("./liveStreamEngine");
const { initStockEngine } = require("./stockEngine");

// Validate environment variables
if (!process.env.DISCORD_BOT_TOKEN) {
  console.error("ERRO: DISCORD_BOT_TOKEN não foi configurado no .env");
  process.exit(1);
}
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
      updateBotPresence();
    }
  } catch (err) {
    console.warn("⚠️ [DISCORD CONFIG] Não foi possível carregar configurações:", err.message);
  }
}

/**
 * Atualiza o status/presença do bot no Discord
 */
function updateBotPresence() {
  if (!client.user) return;
  try {
    const typeStr = discordConfig.botActivityType;
    const statusText = discordConfig.botStatusText || "";

    const presenceStatus =
      discordConfig.botStatus === "idle"
        ? "idle"
        : discordConfig.botStatus === "dnd"
        ? "dnd"
        : discordConfig.botStatus === "invisible"
        ? "invisible"
        : "online";

    let activities = [];

    if (typeStr === "Custom" || typeStr === "None") {
      if (statusText.trim()) {
        activities = [
          {
            name: "Custom Status",
            state: statusText.trim(),
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
        name: statusText.trim() || "Twin Wheels RP • Logs",
        type: actType,
      };
      if (actType === ActivityType.Streaming && discordConfig.botStreamingUrl) {
        activityObj.url = discordConfig.botStreamingUrl;
      }
      activities = [activityObj];
    }

    client.user.setPresence({
      activities,
      status: presenceStatus,
    });

    if (discordConfig.botAvatarUrl && typeof discordConfig.botAvatarUrl === "string" && discordConfig.botAvatarUrl.startsWith("http")) {
      client.user.setAvatar(discordConfig.botAvatarUrl).catch(() => {});
    }
  } catch (err) {
    console.warn("⚠️ Erro ao atualizar presença do bot:", err.message);
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
      description = `O responsável ${actorMention} realizou uma movimentação de **${valor}** no Fundo de Caixa da Facção.`;
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
      description = `O jogador **${nomePlayer}**${data.game_id ? ` (ID: \`${data.game_id}\`)` : ""} enviou uma solicitação de entrada para a facção.`;
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
      title = "✅ Membro Aprovado na Facção";
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
      title = "🚫 Membro Desligado da Facção";
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
 * Polling contínuo de novos logs de auditoria como garantia de 100% de entrega
 */
async function pollUnprocessedAuditLogs() {
  if (!discordConfig.enabled) return;
  try {
    let logs = [];
    if (neonPool) {
      const res = await neonPool.query(
        "SELECT * FROM audit_logs WHERE created_at >= $1 ORDER BY created_at ASC LIMIT 50",
        [lastAuditLogPollTimestamp]
      );
      logs = res.rows || [];
    } else {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .gte("created_at", lastAuditLogPollTimestamp)
        .order("created_at", { ascending: true })
        .limit(50);
      if (!error && data) logs = data;
    }

    if (logs.length === 0) return;

    for (const log of logs) {
      if (log.created_at && log.created_at > lastAuditLogPollTimestamp) {
        lastAuditLogPollTimestamp = log.created_at;
      }
      dispatchAuditLogToDiscord(log);
    }
  } catch (err) {
    console.warn("⚠️ [POLL AUDIT LOGS ERRO]:", err.message);
  }
}

/**
 * Escuta em tempo real inserções na tabela `audit_logs` e broadcasts
 */
function setupRealtimeListeners() {
  console.log("⚡ [REALTIME] Conectando listeners de logs e canais no Supabase...");

  // 1. Canal de broadcast em tempo real para novos logs emitidos instantaneamente pelo frontend (<50ms)
  supabase
    .channel("system-audit-logs")
    .on("broadcast", { event: "new_audit_log" }, (payload) => {
      if (payload?.payload) {
        console.log(`⚡ [BROADCAST] Novo log recebido em tempo real: ${payload.payload.action}`);
        dispatchAuditLogToDiscord(payload.payload);
      }
    })
    .subscribe((status) => {
      console.log(`📡 [AUDIT LOGS BROADCAST STATUS] status: ${status}`);
    });

  // 2. Canal de postgres_changes caso esteja ativo no banco de dados
  supabase
    .channel("audit-logs-to-discord-bot")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "audit_logs",
      },
      (payload) => {
        if (payload && payload.new) {
          console.log(`📡 [POSTGRES_CHANGES] Insert recebido em audit_logs: ${payload.new.action}`);
          dispatchAuditLogToDiscord(payload.new);
        }
      }
    )
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
      console.log(`📡 [REALTIME STATUS] Canal de logs do Supabase status: ${status}`);
    });

  // 3. Canal de Broadcast para sincronização instantânea de configurações
  supabase
    .channel("system-discord-config-sync")
    .on("broadcast", { event: "discord_config_updated" }, (payload) => {
      if (payload?.payload) {
        console.log("⚡ [BROADCAST] Nova configuração do Discord recebida em tempo real!");
        discordConfig = {
          ...discordConfig,
          ...payload.payload,
        };
        updateBotPresence();
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
    .on("broadcast", { event: "bot_command" }, async (payload) => {
      const data = payload?.payload;
      if (!data) return;
      console.log(`🤖 [BOT CONTROL] Comando recebido: "${data.action}" por ${data.actor || "Dev"}`);

      if (data.action === "restart") {
        console.log("🔄 [BOT CONTROL] Reinicialização solicitada. Encerrando processo para autorrestart do Discloud...");
        try {
          if (client) client.destroy();
        } catch {}
        setTimeout(() => {
          process.exit(0);
        }, 800);
      } else if (data.action === "stop") {
        console.log("⏹ [BOT CONTROL] Parada solicitada. Desconectando do Discord...");
        try {
          if (client) client.destroy();
        } catch (e) {
          console.error("Erro ao parar cliente:", e.message);
        }
      } else if (data.action === "start") {
        console.log("▶ [BOT CONTROL] Inicialização solicitada. Conectando ao Discord...");
        try {
          if (!client.isReady()) {
            client.login(process.env.DISCORD_BOT_TOKEN);
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
    .subscribe((status) => {
      console.log(`📡 [BOT CONTROL CHANNEL STATUS] status: ${status}`);
    });

  // 6. Função de emissão de Heartbeat com lista completa e rica de servidores (guilds)
  const sendHeartbeat = async () => {
    try {
      if (!client.user) return;
      const guildsList = Array.from(client.guilds.cache.values()).map((g) => {
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
      });

      const hbChannel = supabase.channel("system-discord-bot-heartbeat");
      await hbChannel.send({
        type: "broadcast",
        event: "heartbeat",
        payload: {
          status: client.ws?.status === 0 ? (discordConfig.botStatus || "online") : "offline",
          uptimeSeconds: Math.floor(process.uptime()),
          pingMs: client.ws?.ping || 0,
          guildCount: client.guilds?.cache?.size || 0,
          memberCount: membersCache?.size || 0,
          memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          botTag: client.user.tag,
          botId: client.user.id,
          timestamp: new Date().toISOString(),
          guilds: guildsList,
        },
      });
    } catch (err) {
      console.warn("Erro ao emitir heartbeat:", err.message);
    }
  };

  // Emissor periódico de Heartbeat (a cada 15 segundos e logo na inicialização)
  setInterval(sendHeartbeat, 15000);
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

  // 8. Polling Engine de segurança executado a cada 15 segundos (otimizado contra limite de banco)
  setInterval(pollUnprocessedAuditLogs, 15000);
}

/**
 * Atualiza o avatar de um perfil no Supabase (tanto discord_avatar_url quanto avatar_url)
 */
async function updateProfileAvatar(discordId, newAvatarUrl, tag) {
  if (!discordId || !newAvatarUrl) return false;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        discord_avatar_url: newAvatarUrl,
        avatar_url: newAvatarUrl,
      })
      .eq("discord_id", discordId)
      .select("id, user_id, nome, nickname, discord_id, discord_avatar_url");

    if (error) {
      console.error(`[ERRO Supabase] Falha ao atualizar foto de ${tag || discordId}:`, error.message);
      return false;
    } else if (data && data.length > 0) {
      console.log(`[SUCESSO] Avatar de ${tag || discordId} sincronizado: ${newAvatarUrl}`);
      // Sincroniza metadados no Supabase Auth
      for (const p of data) {
        if (p.user_id) {
          try {
            await supabase.auth.admin.updateUserById(p.user_id, {
              user_metadata: { avatar_url: newAvatarUrl },
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
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, user_id, discord_id, discord_avatar_url, avatar_url, discord_username")
      .not("discord_id", "is", null);

    if (error || !profiles || profiles.length === 0) return;

    for (const prof of profiles) {
      if (!prof.discord_id) continue;

      try {
        const user = await client.users.fetch(prof.discord_id, { force: true }).catch(() => null);
        if (!user) continue;

        const currentAvatar = user.displayAvatarURL({ extension: "png", forceStatic: false, size: 512 });
        const cleanCurrent = cleanAvatarUrl(currentAvatar);
        const cleanProfDiscord = cleanAvatarUrl(prof.discord_avatar_url);
        const cleanProfAvatar = cleanAvatarUrl(prof.avatar_url);

        if (cleanCurrent && (cleanCurrent !== cleanProfDiscord || cleanCurrent !== cleanProfAvatar)) {
          console.log(`[SYNC Auto] Detectada diferença de avatar para ${user.tag} (${prof.discord_id}). Atualizando...`);
          await updateProfileAvatar(prof.discord_id, currentAvatar, user.tag);
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

/**
 * Trata requisições HTTP para a rota pública de Webhook (/webhook/:target)
 */
async function handleWebhookHttpRequest(targetParam, req, res) {
  if (!targetParam) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: false, error: "ID de webhook ou canal não informado na URL." }));
  }

  let channelId = targetParam;
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
          w.id === targetParam ||
          w.channelId === targetParam ||
          (w.webhookUrl && w.webhookUrl.includes(targetParam))
      );
      if (found && found.channelId) {
        channelId = found.channelId;
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

  if (!/^\d{17,20}$/.test(channelId)) {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ success: false, error: `Webhook ou ID de Canal inválido: ${targetParam}` }));
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

        if (!client.isReady()) {
          res.writeHead(503, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: "Bot do Discord está offline ou reconectando. Tente novamente em alguns instantes." }));
        }

        const channel = await client.channels.fetch(channelId).catch((err) => {
          console.warn(`[HTTP WEBHOOK] Erro ao buscar canal ${channelId}:`, err.message);
          return null;
        });

        if (!channel || !channel.isTextBased()) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ success: false, error: `Canal Discord ${channelId} não encontrado ou o bot não tem permissão para acessá-lo.` }));
        }

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

        const sentMsg = await channel.send({
          content: contentText || undefined,
          embeds: embedsToSend.length > 0 ? embedsToSend : undefined,
        });

        console.log(`📡 [HTTP WEBHOOK] Mensagem postada com sucesso em #${channel.name} (${channelId}) (ID: ${sentMsg.id})`);

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            success: true,
            message: `Mensagem enviada com sucesso para o canal #${channel.name}!`,
            messageId: sentMsg.id,
            channelName: channel.name,
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
 * Obtém ou cria o Webhook oficial do Discord (compatível com Discohook, FiveM, etc.)
 */
async function handleGetWebhookUrl(channelId, req, res) {
  res.setHeader("Content-Type", "application/json");
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

// Servidor HTTP básico para o Discloud (TYPE=site), Webhooks públicos e health checks
const server = http.createServer(async (req, res) => {
  // Configuração global de CORS para permitir chamadas de qualquer frontend ou script
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

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

  // 7. Inicializa o Motor de Transmissões ao Vivo (Twitch, Kick, YouTube, TikTok)
  initLiveStreamEngine(supabase, client);

  // Sincronização contínua de segurança a cada 30 segundos
  setInterval(syncAllProfiles, 30 * 1000);

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
  if (!client.application) {
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

        const description = (cmd.description?.trim() || `Comando /${cleanName} da facção Twin Wheels`).slice(0, 100);

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

// 7. Servidor HTTP para Telemetria e Consulta Live de Mensagens (Sem persistência no BD)
const PORT = process.env.PORT || 8080;
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (parsedUrl.pathname === "/health" || parsedUrl.pathname === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "online", bot: client.user?.tag || "conectando...", uptime: process.uptime() }));
      return;
    }

    if (parsedUrl.pathname === "/api/channel-messages") {
      const channelId = parsedUrl.searchParams.get("channelId");
      if (!channelId) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "channelId é obrigatório" }));
        return;
      }

      const channel = await client.channels.fetch(channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Canal não encontrado ou sem permissão de leitura" }));
        return;
      }

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
      res.end(JSON.stringify({ channelId, count: formatted.length, messages: formatted }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint não encontrado" }));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🌐 [HTTP SERVER] Servidor do Bot escutando na porta ${PORT}`);
});

// Inicializa motor de estoque Discord
initStockEngine(client);

// Login no Discord
client.login(process.env.DISCORD_BOT_TOKEN);

