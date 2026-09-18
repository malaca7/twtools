const { Events } = require('discord.js');
const { Pool } = require('pg');

let dbPool = null;

/**
 * Função utilitária pura para interpretar o conteúdo de uma mensagem ou embed do Discord
 */
function parseDiscordStockMessage(rawText, embed = null, config = {}) {
  const parsedItems = [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let gamePlayerId = null;
  let authorName = (embed?.author?.name) || '';

  // 1. Extrair ID do Jogador e Nome
  const idMatch = (authorName || rawText).match(/ID\s*[:#]?\s*(\d+)/i) || (authorName || rawText).match(/Passaporte\s*[:#]?\s*(\d+)/i);
  if (idMatch) {
    gamePlayerId = idMatch[1];
  }

  if (!authorName) {
    const authorLine = lines.find(l => /ID\s*\d+/i.test(l));
    if (authorLine) authorName = authorLine;
  }

  // 2. Detectar Baús (e possíveis Transferências entre baús)
  let isTransfer = false;
  let fromBauName = null;
  let toBauName = null;
  let bauName = 'Baú'; // fallback

  // Checar padrões de transferência
  // Ex: "Origem: BAÚ QG" e "Destino: Baú Casa"
  // Ex: "Transferência: BAÚ QG -> Baú Casa" ou "De: BAÚ QG Para: Baú Casa"
  const transferMatch = rawText.match(/(?:origem|de)\s*[:\-]\s*([^\n\r\|]+).*?(?:destino|para)\s*[:\-]\s*([^\n\r\|]+)/i) ||
                        rawText.match(/transfer(?:ência|ido)?\s*(?:de)?\s*([^\n\r\->]+)\s*(?:->|para)\s*([^\n\r]+)/i);

  if (transferMatch) {
    isTransfer = true;
    fromBauName = transferMatch[1].replace(/📦/g, '').replace(/^[:\-\s]+/, '').trim();
    toBauName = transferMatch[2].replace(/📦/g, '').replace(/^[:\-\s]+/, '').trim();
  } else {
    // Busca baú comum
    for (const line of lines) {
      if (line.includes('📦')) {
        const clean = line.replace(/📦/g, '').replace(/^[:\-\s]+/, '').trim();
        if (clean) bauName = clean;
      } else if (/^ba[uú]\s*[:\-]\s*(.+)$/i.test(line)) {
        const m = line.match(/^ba[uú]\s*[:\-]\s*(.+)$/i);
        if (m && m[1]) bauName = m[1].replace(/^[:\-\s]+/, '').trim();
      }
    }
  }

  // 3. Interpretar itens e quantidades
  // Padrões aceitos:
  // "Saldo líquido: MP5 +1"
  // "Saldo líquido:" seguido por linhas "MP5 +1", "Micro Uzi -1"
  // "Micro Uzi -1"
  // "**MP5** +1"
  // "Munição de Fuzil +250"
  let inSaldoLiquidoSection = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    // Remove markdown bold/italic/backticks
    const line = rawLine.replace(/[\*\_`]/g, '').trim();

    // Se encontrar cabeçalho de saldo líquido
    if (/saldo\s*l[ií]quido/i.test(line)) {
      inSaldoLiquidoSection = true;

      // Pode ser que o item esteja na mesma linha: "Saldo líquido: MP5 +1"
      const inlineMatch = line.match(/saldo\s*l[ií]quido\s*[:\-]?\s*(.+?)\s*([+-]\s*\d+)$/i);
      if (inlineMatch) {
        const itemName = cleanItemName(inlineMatch[1], config.item_mappings);
        const qtyChange = parseInt(inlineMatch[2].replace(/\s+/g, ''), 10);
        if (!isNaN(qtyChange)) {
          parsedItems.push({
            is_transfer: isTransfer,
            from_bau_name: fromBauName,
            to_bau_name: toBauName,
            bau_name: bauName,
            item_name: itemName,
            quantity_change: qtyChange
          });
        }
      }
      continue;
    }

    if (inSaldoLiquidoSection) {
      // Se entrou em outra seção (ex: Detalhes da movimentação, Informações adicionais, etc.)
      if (/detalhes|informa[cç][oõ]es|data|hor[aá]rio|respons[aá]vel/i.test(line)) {
        inSaldoLiquidoSection = false;
        continue;
      }

      // Procura formato: "Item [+-]Quantidade" ou "Item: [+-]Quantidade"
      const itemMatch = line.match(/^(.+?)\s*[:\-]?\s*([+-]\s*\d+)$/);
      if (itemMatch) {
        const itemName = cleanItemName(itemMatch[1], config.item_mappings);
        const qtyChange = parseInt(itemMatch[2].replace(/\s+/g, ''), 10);
        if (!isNaN(qtyChange)) {
          parsedItems.push({
            is_transfer: isTransfer,
            from_bau_name: fromBauName,
            to_bau_name: toBauName,
            bau_name: bauName,
            item_name: itemName,
            quantity_change: qtyChange
          });
        }
      }
    } else {
      // Mesmo fora da seção de saldo líquido explícita, se a linha tiver padrão estrito de item e alteração
      // ex: "MP5 +1" ou "Micro Uzi -1"
      const itemMatch = line.match(/^([a-zA-Z0-9À-ÿ\s\.\-_]+?)\s+([+-]\d+)$/);
      if (itemMatch && !/saldo|detalhe|ba[uú]|id|data/i.test(itemMatch[1])) {
        const itemName = cleanItemName(itemMatch[1], config.item_mappings);
        const qtyChange = parseInt(itemMatch[2], 10);
        if (!isNaN(qtyChange) && itemName.length > 1) {
          parsedItems.push({
            is_transfer: isTransfer,
            from_bau_name: fromBauName,
            to_bau_name: toBauName,
            bau_name: bauName,
            item_name: itemName,
            quantity_change: qtyChange
          });
        }
      }
    }
  }

  return {
    authorName,
    gamePlayerId,
    isTransfer,
    fromBauName,
    toBauName,
    bauName,
    parsedItems
  };
}

function cleanItemName(rawName, mappings = {}) {
  let name = rawName.replace(/^[\s\-•\*\>]+/, '').trim();
  if (mappings && typeof mappings === 'object' && mappings[name]) {
    return mappings[name];
  }
  return name;
}

function initStockEngine(client) {
  console.log("📦 [STOCK-ENGINE] Motor de estoque via logs do Discord ativo!");

  if (process.env.DATABASE_URL) {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  } else {
    console.warn("⚠️ [STOCK-ENGINE] DATABASE_URL não configurado. Listener de estoque inativo.");
    return;
  }

  client.on(Events.MessageCreate, async (message) => {
    try {
      // Aceitar mensagens de bots e webhooks (ex: Cidade Alta APP)
      if (!message.author.bot && !message.webhookId) return;

      // Buscar configuração de estoque do Discord no banco
      const configRes = await dbPool.query(`SELECT * FROM public.discord_stock_config LIMIT 1`);
      if (configRes.rows.length === 0) return;

      const config = configRes.rows[0];
      if (config.is_active === false) {
        return; // Processamento automático desativado
      }

      // Se o canal estiver configurado e não for o canal da mensagem, ignora
      if (config.channel_id && config.channel_id.trim() !== '') {
        if (message.channelId !== config.channel_id.trim()) {
          return;
        }
      }

      // Se guild_id estiver configurado e não bater, ignora
      if (config.guild_id && config.guild_id.trim() !== '') {
        if (message.guildId && message.guildId !== config.guild_id.trim()) {
          return;
        }
      }

      // Montar texto cru a partir do embed ou da mensagem
      let rawText = message.content || '';
      let embedObj = null;

      if (message.embeds && message.embeds.length > 0) {
        const embed = message.embeds[0];
        embedObj = embed.toJSON();
        if (embed.author?.name) rawText += '\n' + embed.author.name;
        if (embed.title) rawText += '\n' + embed.title;
        if (embed.description) rawText += '\n' + embed.description;
        if (embed.fields) {
          embed.fields.forEach(f => {
            rawText += '\n' + f.name + '\n' + f.value;
          });
        }
      }

      // Se não aparenta ser uma log de movimentação de estoque, ignorar
      if (!/saldo\s*l[ií]quido|detalhes\s*da\s*movimenta[cç][aã]o|movimenta[cç][aã]o\s*de\s*ba[uú]|transfer[eê]ncia/i.test(rawText)) {
        return;
      }

      console.log(`📦 [STOCK-ENGINE] Log de estoque detectada! Mensagem ID: ${message.id}`);

      // Interpretar conteúdo
      const { authorName, gamePlayerId, parsedItems } = parseDiscordStockMessage(rawText, embedObj, config);

      if (!parsedItems || parsedItems.length === 0) {
        console.warn(`⚠️ [STOCK-ENGINE] Não foi possível interpretar itens na log ${message.id}. Registrando erro...`);
        await dbPool.query(`
          INSERT INTO public.discord_stock_logs (
            message_id, channel_id, guild_id, author_name, game_player_id, raw_content, raw_embeds, parsed_items, status, error_message
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'error', 'Nenhum item válido identificado no formato esperado')
          ON CONFLICT (message_id) DO NOTHING
        `, [
          message.id,
          message.channelId,
          message.guildId,
          authorName || 'Desconhecido',
          gamePlayerId,
          rawText,
          embedObj ? JSON.stringify(embedObj) : null,
          JSON.stringify([])
        ]);
        return;
      }

      // Chamar RPC process_discord_stock_log
      const rpcQuery = `
        SELECT public.process_discord_stock_log(
          $1::TEXT, $2::TEXT, $3::TEXT, $4::TEXT, $5::TEXT, $6::TEXT, $7::JSONB, $8::JSONB
        ) as result
      `;
      const values = [
        message.id,
        message.guildId,
        message.channelId,
        authorName,
        gamePlayerId,
        rawText,
        embedObj ? JSON.stringify(embedObj) : null,
        JSON.stringify(parsedItems)
      ];

      const res = await dbPool.query(rpcQuery, values);
      const resultObj = res.rows[0].result;

      if (resultObj.success) {
        console.log(`✅ [STOCK-ENGINE] Log processada com sucesso! Log ID: ${resultObj.log_id} (${parsedItems.length} itens movimentados)`);
      } else {
        console.warn(`⚠️ [STOCK-ENGINE] Falha ao processar log ${message.id}: ${resultObj.error}`);
      }

    } catch (err) {
      console.error("❌ [STOCK-ENGINE] Erro no listener de mensagens:", err);
    }
  });
}

module.exports = { initStockEngine, parseDiscordStockMessage };
