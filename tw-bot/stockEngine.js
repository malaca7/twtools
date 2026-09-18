const { Events } = require('discord.js');
const { Pool } = require('pg');

let dbPool = null;

/**
 * Função utilitária pura para interpretar o conteúdo de uma mensagem ou embed do Discord
 */
function parseDiscordStockMessage(rawText, embed = null, config = {}, defaultBauName = 'Baú') {
  const parsedItems = [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let authorName = (embed?.author?.name) || '';
  let gamePlayerId = null;

  // 1. Extrair ID do Jogador e Nome (ex: "Andrew Delucca Ferreira • ID 274" ou "Macaé Dacoro • ID 590")
  const authorPattern = /(?:^|\n)\s*([a-zA-Z0-9À-ÿ\s\.\-_]+?)\s*[•\|\-]\s*(?:ID|Passaporte)?\s*(\d+)/i;
  const authorMatch = (authorName || rawText).match(authorPattern);
  if (authorMatch) {
    if (!authorName) authorName = authorMatch[1].trim();
    gamePlayerId = authorMatch[2].trim();
  } else {
    const idMatch = (authorName || rawText).match(/ID\s*[:#]?\s*(\d+)/i) || (authorName || rawText).match(/Passaporte\s*[:#]?\s*(\d+)/i);
    if (idMatch) {
      gamePlayerId = idMatch[1];
    }
  }

  if (!authorName) {
    const authorLine = lines.find(l => /ID\s*\d+/i.test(l));
    if (authorLine) {
      const parts = authorLine.split(/[•\|\-]/);
      authorName = parts[0]?.trim() || authorLine;
    }
  }

  // 2. Baú: Como as mensagens de log (Cidade Alta APP) trazem apenas "📦 Baú" genérico,
  // o baú é resolvido primordialmente pelo canal dedicado (defaultBauName)
  let isTransfer = false;
  let fromBauName = null;
  let toBauName = null;
  let bauName = defaultBauName || 'Baú Geral';

  // Checar padrões explícitos de transferência entre dois baús
  const transferMatch = rawText.match(/(?:origem|de)\s*[:\-]\s*([^\n\r\|]+).*?(?:destino|para)\s*[:\-]\s*([^\n\r\|]+)/i) ||
                        rawText.match(/transfer(?:ência|ido)?\s*(?:de)?\s*([^\n\r\->]+)\s*(?:->|para)\s*([^\n\r]+)/i);

  if (transferMatch) {
    isTransfer = true;
    fromBauName = transferMatch[1].replace(/📦/g, '').replace(/^[:\-\s]+/, '').trim();
    toBauName = transferMatch[2].replace(/📦/g, '').replace(/^[:\-\s]+/, '').trim();
  } else if (!defaultBauName) {
    // Se não há defaultBauName do canal, tenta buscar se tiver nome específico no texto
    for (const line of lines) {
      if (line.includes('📦')) {
        const clean = line.replace(/📦/g, '').replace(/^[:\-\s]+/, '').trim();
        if (clean && clean.toLowerCase() !== 'baú' && clean.toLowerCase() !== 'bau') {
          bauName = clean;
        }
      } else if (/^ba[uú]\s*[:\-]\s*(.+)$/i.test(line)) {
        const m = line.match(/^ba[uú]\s*[:\-]\s*(.+)$/i);
        if (m && m[1]) bauName = m[1].replace(/^[:\-\s]+/, '').trim();
      }
    }
  }

  // 3. Interpretar itens e quantidades (Saldo Líquido e Detalhes da Movimentação)
  let inSaldoLiquidoSection = false;
  let inDetalhesSection = false;
  let lastItemPendingQty = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.replace(/[\*\_`]/g, '').trim();

    // Início de Saldo Líquido
    if (/saldo\s*l[ií]quido/i.test(line)) {
      inSaldoLiquidoSection = true;
      inDetalhesSection = false;

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

    // Início de Detalhes da Movimentação
    if (/detalhes\s*da\s*movimenta[cç][aã]o/i.test(line)) {
      inSaldoLiquidoSection = false;
      inDetalhesSection = true;
      continue;
    }

    // Linhas de rodapé ou metadados de fim
    if (/movimenta[cç][oõ]es\s*agrupadas|data|hor[aá]rio|respons[aá]vel/i.test(line)) {
      inSaldoLiquidoSection = false;
      inDetalhesSection = false;
      continue;
    }

    if (inSaldoLiquidoSection) {
      const itemMatch = line.match(/^(.+?)\s*[:\-]?\s*([+-]\s*\d+)$/);
      if (itemMatch) {
        const itemName = cleanItemName(itemMatch[1], config.item_mappings);
        const qtyChange = parseInt(itemMatch[2].replace(/\s+/g, ''), 10);
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
    } else if (inDetalhesSection && parsedItems.length === 0) {
      // Fallback para quando Saldo Líquido não estiver presente ou formatado diferente
      const arrowMatch = line.match(/^[↳\->]+\s*([+-]?\s*\d+)\s*(removid[oa]s?|retirad[oa]s?|adicionad[oa]s?|colocad[oa]s?|guardad[oa]s?)?/i);
      if (arrowMatch && lastItemPendingQty) {
        let qty = parseInt(arrowMatch[1].replace(/\s+/g, ''), 10);
        const actionWord = (arrowMatch[2] || '').toLowerCase();
        if (/removid|retirad/.test(actionWord) && qty > 0) {
          qty = -qty;
        }
        parsedItems.push({
          is_transfer: isTransfer,
          from_bau_name: fromBauName,
          to_bau_name: toBauName,
          bau_name: bauName,
          item_name: lastItemPendingQty,
          quantity_change: qty
        });
        lastItemPendingQty = null;
      } else if (!/^[↳\->]/.test(line)) {
        lastItemPendingQty = cleanItemName(line, config.item_mappings);
      }
    } else {
      // Padrão de linha individual: "Metanfetamina -72"
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
  if (mappings && typeof mappings === 'object') {
    if (mappings[name]) return mappings[name];
    const lower = name.toLowerCase();
    if (mappings[lower]) return mappings[lower];
    for (const [k, v] of Object.entries(mappings)) {
      if (k.trim().toLowerCase() === lower) return v;
    }
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
        return; // Processamento automático desativado globalmente
      }

      // Buscar todos os baús para verificar canal específico e tipo de gestão
      const bausRes = await dbPool.query(`SELECT id, nome, tipo_gestao, discord_channel_id, discord_guild_id FROM public.baus WHERE ativo = true`);
      const allBaus = bausRes.rows || [];

      let matchedBau = null;

      // 1. Procurar por discord_channel_id diretamente no baú
      for (const b of allBaus) {
        if (b.discord_channel_id && b.discord_channel_id.trim() === message.channelId) {
          matchedBau = b;
          break;
        }
      }

      // 2. Procurar em config.bau_channels (caso configurado via JSON)
      if (!matchedBau && config.bau_channels && typeof config.bau_channels === 'object') {
        for (const [bId, bConf] of Object.entries(config.bau_channels)) {
          if (bConf && bConf.channel_id && bConf.channel_id.trim() === message.channelId) {
            const found = allBaus.find(b => b.id === bId);
            matchedBau = found ? { ...found, ...bConf } : { id: bId, nome: bConf.nome || 'Baú', ...bConf };
            break;
          }
        }
      }

      // Se o canal pertence a um baú específico
      if (matchedBau) {
        // Se o baú estiver como "manual" ou desativado, NÃO faz movimentações automáticas
        if (matchedBau.tipo_gestao === 'manual' || matchedBau.is_active === false) {
          console.log(`ℹ️ [STOCK-ENGINE] Canal ${message.channelId} pertence ao baú "${matchedBau.nome}", mas está configurado com movimentação MANUAL.`);
          return;
        }

        // Se guild_id específico do baú estiver configurado e não bater, ignora
        if (matchedBau.discord_guild_id && matchedBau.discord_guild_id.trim() !== '') {
          if (message.guildId && message.guildId !== matchedBau.discord_guild_id.trim()) {
            return;
          }
        }
      } else {
        // Se não pertence a nenhum baú específico, verifica se é o canal fallback global
        if (!config.channel_id || config.channel_id.trim() === '' || message.channelId !== config.channel_id.trim()) {
          return;
        }

        // Se guild_id global estiver configurado e não bater, ignora
        if (config.guild_id && config.guild_id.trim() !== '') {
          if (message.guildId && message.guildId !== config.guild_id.trim()) {
            return;
          }
        }

        // Se houver default_bau_id, usa como matchedBau
        if (config.default_bau_id) {
          matchedBau = allBaus.find(b => b.id === config.default_bau_id);
          if (matchedBau && matchedBau.tipo_gestao === 'manual') {
            console.log(`ℹ️ [STOCK-ENGINE] Baú fallback "${matchedBau.nome}" está configurado como MANUAL.`);
            return;
          }
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

      console.log(`📦 [STOCK-ENGINE] Log de estoque detectada para baú "${matchedBau?.nome || 'Geral'}"! Mensagem ID: ${message.id}`);

      // Interpretar conteúdo passando o baú do canal como default
      const { authorName, gamePlayerId, parsedItems } = parseDiscordStockMessage(rawText, embedObj, config, matchedBau?.nome);

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
