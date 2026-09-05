require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require("discord.js");
const { createClient } = require("@supabase/supabase-js");
const http = require("http");

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

// Initialize Discord Client with all required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

// Cache global de membros, produtos e baús para enriquecer logs em tempo real
let membersCache = new Map();
let productsCache = new Map();
let bausCache = new Map();

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
    let actType = ActivityType.Watching;
    if (discordConfig.botActivityType === "Playing") actType = ActivityType.Playing;
    else if (discordConfig.botActivityType === "Listening") actType = ActivityType.Listening;
    else if (discordConfig.botActivityType === "Competing") actType = ActivityType.Competing;

    client.user.setPresence({
      activities: [
        {
          name: discordConfig.botStatusText || "Twin Wheels RP • Logs",
          type: actType,
        },
      ],
      status: "online",
    });
  } catch (err) {
    console.warn("⚠️ Erro ao atualizar presença do bot:", err.message);
  }
}

/**
 * Atualiza caches auxiliares (produtos, baús, perfis)
 */
async function refreshAuxiliaryCaches() {
  try {
    const [profilesRes, productsRes, bausRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, nome, nickname, discord_id, discord_avatar_url, avatar_url, discord_username"),
      supabase.from("produtos").select("id, nome, categoria_id, preco_sugerido"),
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
        ...(data.content ? [{ name: "📄 Conteúdo", value: String(data.content).slice(0, 500), inline: false }] : []),
      ];
      break;
    }

    // 8. LOGINS & SESSÕES
    case "login": {
      category = "logins";
      color = discordConfig.embedColors.logins || "#10B981";
      title = "🟢 Membro Conectado (Login)";
      description = `O membro ${actorMention} realizou login na plataforma Twin Wheels via Discord.`;
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
 * Roteia e envia o embed do log diretamente para o canal do Discord através do Bot
 */
async function dispatchAuditLogToDiscord(log) {
  if (!discordConfig.enabled) return;

  try {
    const parsed = parseAuditLogForDiscord(log);

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
      return;
    }

    // Constrói o Discord Embed oficial usando EmbedBuilder
    const embed = new EmbedBuilder()
      .setTitle(parsed.title)
      .setDescription(parsed.description)
      .setColor(hexToInt(parsed.color))
      .setTimestamp(parsed.createdTimestamp)
      .setFooter({
        text: discordConfig.footerText || "Twin Wheels RP • Sistema de Logs",
        iconURL: discordConfig.footerIconUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      });

    if (parsed.actorName) {
      embed.setAuthor({
        name: parsed.actorName,
        iconURL: parsed.actorAvatar || discordConfig.botAvatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png",
      });
    }

    if (parsed.fields && parsed.fields.length > 0) {
      embed.addFields(parsed.fields);
    }

    // Dispara diretamente através do Bot no canal especificado pelo ID
    if (client.isReady()) {
      try {
        const channel = await client.channels.fetch(targetChannelId).catch((err) => {
          console.warn(`⚠️ [DISCORD BOT] Não foi possível encontrar o canal ${targetChannelId}: ${err.message}`);
          return null;
        });

        if (channel && channel.isTextBased()) {
          await channel.send({ embeds: [embed] });
          console.log(`📡 [DISCORD BOT] Embed entregue no canal #${channel.name || targetChannelId} (${targetChannelId}) [${parsed.category}]`);
        } else {
          console.warn(`⚠️ [DISCORD BOT] Canal ${targetChannelId} não é de texto ou não está acessível pelo Bot.`);
        }
      } catch (err) {
        console.error(`❌ [DISCORD BOT] Falha ao enviar no canal ${targetChannelId}:`, err.message);
      }
    } else {
      console.warn("⚠️ [DISCORD BOT] Bot ainda não está conectado no Discord. Aguardando conexão...");
    }
  } catch (err) {
    console.error("❌ [DISCORD LOG ERRO CRÍTICO]", err);
  }
}

/**
 * Escuta em tempo real inserções na tabela `audit_logs` e broadcasts
 */
function setupRealtimeListeners() {
  console.log("⚡ [REALTIME] Conectando listener de audit_logs e role_permissions no Supabase...");

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

  // Canal de Broadcast para sincronização instantânea (<50ms) enviada pelo frontend
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

  // Canal de Broadcast para disparo direto de embeds de teste
  supabase
    .channel("system-discord-test-trigger")
    .on("broadcast", { event: "trigger_test_embed" }, (payload) => {
      if (payload?.payload) {
        console.log("🧪 [BROADCAST TEST] Teste de embed recebido via Broadcast!");
        dispatchAuditLogToDiscord(payload.payload);
      }
    })
    .subscribe();
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

// Servidor HTTP básico para o Discloud (TYPE=site) e health checks
const server = http.createServer(async (req, res) => {
  if (req.url === "/sync") {
    syncAllProfiles();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "sync_triggered", timestamp: new Date().toISOString() }));
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      app: "Twin Wheels Bot - Direct Discord Logs",
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

  // Sincronização contínua de segurança a cada 30 segundos
  setInterval(syncAllProfiles, 30 * 1000);

  // Recarrega caches auxiliares a cada 5 minutos
  setInterval(refreshAuxiliaryCaches, 5 * 60 * 1000);
};

client.once("clientReady", onReady);
client.once("ready", onReady);

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

// Login no Discord
client.login(process.env.DISCORD_BOT_TOKEN);
