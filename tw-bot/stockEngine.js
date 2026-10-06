const { Events } = require('discord.js');
const { Pool } = require('pg');

let dbPool = null;

function normalizeText(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(a, b) {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (normA === normB) return 0;
  if (!normA.length) return normB.length;
  if (!normB.length) return normA.length;

  const matrix = [];
  for (let i = 0; i <= normB.length; i++) matrix[i] = [i];
  for (let j = 0; j <= normA.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= normB.length; i++) {
    for (let j = 1; j <= normA.length; j++) {
      if (normB.charAt(i - 1) === normA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[normB.length][normA.length];
}

function calculateSimilarity(a, b) {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  if (normA.includes(normB) || normB.includes(normA)) {
    const ratio = Math.min(normA.length, normB.length) / Math.max(normA.length, normB.length);
    return Math.max(0.75, ratio);
  }

  const distance = levenshteinDistance(normA, normB);
  const maxLength = Math.max(normA.length, normB.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - distance / maxLength;
}

function cleanItemName(rawName, mappings = {}) {
  // Remove markdown, backslashes (ex: MTAR\-21 -> MTAR-21), bullets and leading/trailing spaces
  let name = rawName.replace(/\\/g, '').replace(/^[\s\-•\*\>]+/, '').trim();
  if (!name) return name;

  if (mappings && typeof mappings === 'object') {
    // 1. Direct or case-insensitive exact match
    if (mappings[name]) return mappings[name];
    const lower = name.toLowerCase();
    if (mappings[lower]) return mappings[lower];

    const norm = normalizeText(name);
    for (const [k, v] of Object.entries(mappings)) {
      if (k.trim().toLowerCase() === lower || normalizeText(k) === norm) {
        return v;
      }
    }

    // 2. Fuzzy match fallback
    let bestScore = 0;
    let bestTarget = null;
    for (const [k, v] of Object.entries(mappings)) {
      const score = calculateSimilarity(name, k);
      if (score > bestScore) {
        bestScore = score;
        bestTarget = v;
      }
    }

    const minThreshold = norm.length <= 4 ? 0.75 : 0.65;
    if (bestScore >= minThreshold && bestTarget) {
      console.log(`🔍 [STOCK-ENGINE] Item '${name}' reconhecido por similaridade (${Math.round(bestScore * 100)}%) -> '${bestTarget}'`);
      return bestTarget;
    }
  }
  return name;
}

function parseItemToken(token, actionMultiplier, parsedItems, isTransfer, fromBauName, toBauName, bauName, config) {
  if (!token || typeof token !== 'string') return;
  const clean = token.replace(/^[•\-\*>\s]+/, '').trim();
  if (!clean || /^(?:🎒|itens|ba[uú]|a[cç][aã]o|registro|saldo|detalhe)/i.test(clean)) return;

  // 1. Padrão "x10 algemas" ou "x 10 algemas"
  let match = clean.match(/^x\s*(\d+)\s*[:\-]?\s*(.+)$/i);
  if (match) {
    const qty = parseInt(match[1], 10);
    const itemName = cleanItemName(match[2], config.item_mappings);
    if (!isNaN(qty) && itemName) {
      parsedItems.push({
        is_transfer: isTransfer,
        from_bau_name: fromBauName,
        to_bau_name: toBauName,
        bau_name: bauName,
        item_name: itemName,
        quantity_change: qty * actionMultiplier
      });
      return;
    }
  }

  // 2. Padrão "10x algemas" ou "10 x algemas"
  match = clean.match(/^(\d+)\s*x\s*[:\-]?\s*(.+)$/i);
  if (match) {
    const qty = parseInt(match[1], 10);
    const itemName = cleanItemName(match[2], config.item_mappings);
    if (!isNaN(qty) && itemName) {
      parsedItems.push({
        is_transfer: isTransfer,
        from_bau_name: fromBauName,
        to_bau_name: toBauName,
        bau_name: bauName,
        item_name: itemName,
        quantity_change: qty * actionMultiplier
      });
      return;
    }
  }

  // 3. Padrão "algemas x10" ou "algemas (10x)" ou "algemas: 10"
  match = clean.match(/^(.+?)\s*(?:x\s*|\(\s*)(\d+)(?:\s*x|\s*\))?$/i) || clean.match(/^(.+?)\s*[:\-]\s*(\d+)$/i);
  if (match) {
    const itemName = cleanItemName(match[1], config.item_mappings);
    const qty = parseInt(match[2], 10);
    if (!isNaN(qty) && itemName && itemName.length > 1) {
      parsedItems.push({
        is_transfer: isTransfer,
        from_bau_name: fromBauName,
        to_bau_name: toBauName,
        bau_name: bauName,
        item_name: itemName,
        quantity_change: qty * actionMultiplier
      });
      return;
    }
  }

  // 4. Padrão "10 algemas"
  match = clean.match(/^([+-]?\d+)\s+(.+)$/);
  if (match) {
    const qty = parseInt(match[1], 10);
    const itemName = cleanItemName(match[2], config.item_mappings);
    if (!isNaN(qty) && itemName && itemName.length > 1) {
      parsedItems.push({
        is_transfer: isTransfer,
        from_bau_name: fromBauName,
        to_bau_name: toBauName,
        bau_name: bauName,
        item_name: itemName,
        quantity_change: Math.abs(qty) * actionMultiplier
      });
      return;
    }
  }
}

/**
 * Função utilitária pura para interpretar o conteúdo de uma mensagem ou embed do Discord
 */
function parseDiscordStockMessage(rawText, embed = null, config = {}, defaultBauName = 'Baú') {
  const parsedItems = [];
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let authorName = (embed?.author?.name) || '';
  let gamePlayerId = null;

  // 1. Extrair ID do Jogador e Nome (ex: "Andrew Delucca Ferreira - 4337", "Macaé Dacoro • ID 590")
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
    const authorLine = lines.find(l => /ID\s*\d+/i.test(l) || /Ação e Registro/i.test(l));
    if (authorLine) {
      const clean = authorLine.replace(/👤|Ação e Registro|[:\-]+/gi, '').trim();
      const parts = clean.split(/[•\|\-]/);
      authorName = parts[0]?.trim() || clean;
    }
  }

  // 2. Baú
  let isTransfer = false;
  let fromBauName = null;
  let toBauName = null;
  let bauName = defaultBauName || 'BAÚ QG';

  // Checar se o título ou linha tem "Baú: Nome" ou "📦 Baú \n Nome"
  const bauTitleMatch = rawText.match(/(?:📦\s*)?ba[uú]\s*[:\-]\s*([^\n\r]+)/i);
  if (bauTitleMatch && bauTitleMatch[1]) {
    const extracted = bauTitleMatch[1].replace(/📦/g, '').replace(/^[:\-\s]+/, '').trim();
    if (extracted && !['baú', 'bau'].includes(extracted.toLowerCase())) {
      bauName = extracted;
    }
  }

  // Checar padrões explícitos de transferência entre dois baús
  const transferMatch = rawText.match(/(?:origem|de)\s*[:\-]\s*([^\n\r\|]+).*?(?:destino|para)\s*[:\-]\s*([^\n\r\|]+)/i) ||
                        rawText.match(/transfer(?:ência|ido)?\s*(?:de)?\s*([^\n\r\->]+)\s*(?:->|para)\s*([^\n\r]+)/i);

  if (transferMatch) {
    isTransfer = true;
    fromBauName = transferMatch[1].replace(/📦/g, '').replace(/^[:\-\s]+/, '').trim();
    toBauName = transferMatch[2].replace(/📦/g, '').replace(/^[:\-\s]+/, '').trim();
  } else if (!defaultBauName) {
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

  // 3. Detectar Ação Cidade Alta (Retirou vs Guardou)
  let actionMultiplier = 1; // 1 = Guardou/Adicionou, -1 = Retirou/Removeu
  let inItensSection = false;
  let inSaldoLiquidoSection = false;
  let inDetalhesSection = false;
  let lastItemPendingQty = null;

  const actionMatch = rawText.match(/(?:💼\s*)?a[cç][aã]o\s*[:\-]?\s*([^\n\r]+)/i);
  if (actionMatch) {
    const actStr = actionMatch[1].toLowerCase();
    if (/retir|remov|pegou|sacou|tirou|sa[ií]da/i.test(actStr)) {
      actionMultiplier = -1;
    } else if (/guard|deposit|coloc|adicion|armazen|entrada/i.test(actStr)) {
      actionMultiplier = 1;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.replace(/[\*\_`\\]/g, '').trim();

    // Se a linha em si for "Retirou" ou "Guardou"
    if (/^(?:💼\s*)?retirou|removido|retirada/i.test(line)) {
      actionMultiplier = -1;
    } else if (/^(?:💼\s*)?guardou|depositou|adicionado|dep[oó]sito/i.test(line)) {
      actionMultiplier = 1;
    }

    // Seção de Itens (Cidade Alta)
    if (/(?:🎒\s*)?itens/i.test(line)) {
      inItensSection = true;
      inSaldoLiquidoSection = false;
      inDetalhesSection = false;

      // Se os itens estiverem na mesma linha: "🎒 Itens: x10 algemas, x100 lockpick"
      const inlineItens = line.replace(/^(?:🎒\s*)?itens\s*[:\-]?\s*/i, '').trim();
      if (inlineItens) {
        const itemTokens = inlineItens.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean);
        for (const token of itemTokens) {
          parseItemToken(token, actionMultiplier, parsedItems, isTransfer, fromBauName, toBauName, bauName, config);
        }
      }
      continue;
    }

    // Início de Saldo Líquido
    if (/saldo\s*l[ií]quido/i.test(line)) {
      inSaldoLiquidoSection = true;
      inItensSection = false;
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
      inItensSection = false;
      continue;
    }

    // Linhas de rodapé ou metadados de fim
    if (/movimenta[cç][oõ]es\s*agrupadas|voc[eê]\s*consegue\s*agendar|cda\s*:\s*\d+|data|hor[aá]rio|respons[aá]vel/i.test(line)) {
      inItensSection = false;
      inSaldoLiquidoSection = false;
      inDetalhesSection = false;
      continue;
    }

    if (inItensSection) {
      // Formato Cidade Alta: "x10 algemas", "100x Lockpick", "10x capuz", "x10 algemas, x50 capuz"
      const subTokens = line.split(/[,;]+/).map(t => t.trim()).filter(Boolean);
      for (const token of subTokens) {
        parseItemToken(token, actionMultiplier, parsedItems, isTransfer, fromBauName, toBauName, bauName, config);
      }
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
      // Fallback para quando Saldo Líquido não estiver presente
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
      if (itemMatch && !/saldo|detalhe|ba[uú]|id|data|a[cç][aã]o|registro/i.test(itemMatch[1])) {
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

// Cache em memória de alta performance e deduplicação instantânea
let cachedConfig = null;
let cachedAllBaus = [];
let cachedStockChannelIds = new Set();
let lastCacheLoad = 0;
const CACHE_TTL_MS = 15000; // 15 segundos de TTL com auto-refresh em background e via Postgres change

const processedMessageIds = new Set();
function markMessageProcessed(id) {
  if (!id) return;
  processedMessageIds.add(id);
  if (processedMessageIds.size > 3000) {
    const first = processedMessageIds.values().next().value;
    if (first) processedMessageIds.delete(first);
  }
}

async function refreshCache() {
  if (!dbPool) return null;
  try {
    const configRes = await dbPool.query(`SELECT * FROM public.discord_stock_config LIMIT 1`);
    if (configRes.rows.length === 0) return null;
    const config = configRes.rows[0];

    // Mesclar cda_name (múltiplos aliases) e nomes dos produtos cadastrados para aliases automáticos
    const prodsRes = await dbPool.query(`SELECT nome, cda_name FROM public.products WHERE ativo = true`);
    const mergedMappings = { ...(config.item_mappings || {}) };
    for (const p of prodsRes.rows) {
      if (p.nome && p.nome.trim()) {
        mergedMappings[p.nome.trim().toLowerCase()] = p.nome;
      }
      if (p.cda_name && p.cda_name.trim()) {
        const aliases = p.cda_name.split(/[,;\n|]+/).map(s => s.trim()).filter(Boolean);
        for (const alias of aliases) {
          mergedMappings[alias.toLowerCase()] = p.nome;
        }
      }
    }
    config.item_mappings = mergedMappings;

    const bausRes = await dbPool.query(`SELECT id, nome, tipo_gestao, discord_channel_id, discord_guild_id, ativo FROM public.baus WHERE ativo = true`);
    const allBaus = bausRes.rows || [];

    // Mapear conjunto de IDs de canais monitorados
    const targetChannelIds = new Set();
    if (config.channel_id && config.channel_id.trim()) {
      targetChannelIds.add(config.channel_id.trim());
    }
    for (const b of allBaus) {
      if (b.tipo_gestao === 'automatico' && b.discord_channel_id && b.discord_channel_id.trim()) {
        targetChannelIds.add(b.discord_channel_id.trim());
      }
    }
    if (config.bau_channels && typeof config.bau_channels === 'object') {
      for (const bConf of Object.values(config.bau_channels)) {
        if (bConf && bConf.tipo_gestao === 'automatico' && bConf.channel_id && bConf.channel_id.trim()) {
          targetChannelIds.add(bConf.channel_id.trim());
        }
      }
    }

    cachedConfig = config;
    cachedAllBaus = allBaus;
    cachedStockChannelIds = targetChannelIds;
    lastCacheLoad = Date.now();

    return { config: cachedConfig, allBaus: cachedAllBaus, targetChannelIds: cachedStockChannelIds };
  } catch (e) {
    console.warn("⚠️ [STOCK-ENGINE] Falha ao atualizar cache de configurações:", e.message);
    if (cachedConfig) {
      return { config: cachedConfig, allBaus: cachedAllBaus, targetChannelIds: cachedStockChannelIds };
    }
    return null;
  }
}

async function getOrRefreshConfigAndBaus(force = false) {
  if (!force && cachedConfig && (Date.now() - lastCacheLoad < CACHE_TTL_MS)) {
    return { config: cachedConfig, allBaus: cachedAllBaus, targetChannelIds: cachedStockChannelIds };
  }
  return await refreshCache();
}

/**
 * Processa uma mensagem individual de estoque do Discord
 */
async function processStockMessage(message, config, allBaus, broadcastChannel = null) {
  try {
    const channelId = String(message.channelId || message.channel?.id || '').trim();
    if (!channelId) return;

    if (processedMessageIds.has(message.id)) {
      return; // Já processada nesta sessão
    }

    let matchedBau = null;

    // 1. Procurar por discord_channel_id diretamente no baú
    for (const b of allBaus) {
      if (b.discord_channel_id && String(b.discord_channel_id).trim() === channelId) {
        matchedBau = b;
        break;
      }
    }

    // 2. Procurar em config.bau_channels (caso configurado via JSON)
    if (!matchedBau && config.bau_channels && typeof config.bau_channels === 'object') {
      for (const [bId, bConf] of Object.entries(config.bau_channels)) {
        if (bConf && bConf.channel_id && String(bConf.channel_id).trim() === channelId) {
          const found = allBaus.find(b => b.id === bId);
          matchedBau = found ? { ...found, ...bConf } : { id: bId, nome: bConf.nome || 'Baú', ...bConf };
          break;
        }
      }
    }

    // Montar texto cru a partir do embed ou da mensagem para checar tipo de conteúdo
    let rawText = message.content || '';
    let embedObj = null;

    if (message.embeds && message.embeds.length > 0) {
      const embed = message.embeds[0];
      embedObj = typeof embed.toJSON === 'function' ? embed.toJSON() : embed;
      if (embed.author?.name) rawText += '\n' + embed.author.name;
      if (embed.title) rawText += '\n' + embed.title;
      if (embed.description) rawText += '\n' + embed.description;
      if (embed.fields) {
        embed.fields.forEach(f => {
          rawText += '\n' + f.name + '\n' + f.value;
        });
      }
    }

    const isStockEmbed = /saldo\s*l[ií]quido|detalhes\s*da\s*movimenta[cç][aã]o|movimenta[cç][aã]o|transfer[eê]ncia|ba[uú]|retirou|guardou|depositou|removeu|a[cç][aã]o\s*e\s*registro|itens/i.test(rawText);

    // Se o canal pertence a um baú específico
    if (matchedBau) {
      if (matchedBau.tipo_gestao === 'manual' || matchedBau.ativo === false) {
        return;
      }
    } else {
      // Se não pertence a nenhum baú específico, verifica se é o canal fallback global OU se é embed de estoque (canal de teste/simulação)
      const confChannelId = String(config.channel_id || '').trim();
      const isConfigChannel = confChannelId && channelId === confChannelId;

      if (!isConfigChannel && !isStockEmbed) {
        return;
      }

      // Tentar associar baú pelo nome mencionado no embed (ex: 📦 Baú Armas)
      const bauNameMatch = rawText.match(/📦\s*([^\n\r]+)/);
      if (bauNameMatch && bauNameMatch[1] && !['baú', 'bau'].includes(bauNameMatch[1].trim().toLowerCase())) {
        const foundByName = allBaus.find(b => b.nome.toLowerCase() === bauNameMatch[1].trim().toLowerCase());
        if (foundByName) matchedBau = foundByName;
      }

      if (!matchedBau && config.default_bau_id) {
        matchedBau = allBaus.find(b => b.id === config.default_bau_id);
      }
      if (!matchedBau) {
        matchedBau = allBaus.find(b => b.ativo && b.tipo_gestao !== 'manual') || allBaus[0];
      }

      if (matchedBau && (matchedBau.tipo_gestao === 'manual' || matchedBau.ativo === false)) {
        return;
      }
    }

    // Se não aparenta ser uma log de movimentação de estoque, ignorar
    if (!/saldo\s*l[ií]quido|detalhes\s*da\s*movimenta[cç][aã]o|movimenta[cç][aã]o|transfer[eê]ncia|ba[uú]|retirou|guardou|depositou|removeu|a[cç][aã]o\s*e\s*registro|itens/i.test(rawText)) {
      return;
    }

    // Verificar no banco se a mensagem já foi processada anteriormente com sucesso
    const checkLog = await dbPool.query(
      `SELECT id, status FROM public.discord_stock_logs WHERE message_id = $1 LIMIT 1`,
      [message.id]
    );
    if (checkLog.rows.length > 0 && checkLog.rows[0].status === 'success') {
      markMessageProcessed(message.id);
      return;
    }

    console.log(`📦 [STOCK-ENGINE] Processando movimentação automática instantânea no baú "${matchedBau?.nome || 'Geral'}" (Msg ID: ${message.id})`);

    // Interpretar conteúdo passando o baú do canal como default
    const { authorName, gamePlayerId, parsedItems } = parseDiscordStockMessage(rawText, embedObj, config, matchedBau?.nome);

    if (!parsedItems || parsedItems.length === 0) {
      console.warn(`⚠️ [STOCK-ENGINE] Nenhum item reconhecido na msg ${message.id}`);
      await dbPool.query(`
        INSERT INTO public.discord_stock_logs (
          message_id, channel_id, guild_id, author_name, game_player_id, raw_content, raw_embeds, parsed_items, status, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'error', 'Nenhum item válido identificado no formato esperado')
        ON CONFLICT (message_id) DO UPDATE 
          SET status = 'error', error_message = 'Nenhum item válido identificado no formato esperado'
      `, [
        message.id,
        channelId,
        message.guildId || message.guild?.id || null,
        authorName || 'Sistema Twin Wheels',
        gamePlayerId,
        rawText,
        embedObj ? JSON.stringify(embedObj) : null,
        JSON.stringify([])
      ]);
      markMessageProcessed(message.id);
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
      message.guildId || message.guild?.id || null,
      channelId,
      authorName,
      gamePlayerId,
      rawText,
      embedObj ? JSON.stringify(embedObj) : null,
      JSON.stringify(parsedItems)
    ];

    const res = await dbPool.query(rpcQuery, values);
    const resultObj = res.rows[0]?.result;

    if (resultObj && resultObj.success) {
      markMessageProcessed(message.id);
      console.log(`✅ [STOCK-ENGINE] Movimentação automática gravada com sucesso! (Msg: ${message.id}, ${parsedItems.length} itens, Baú: ${matchedBau?.nome || 'QG'}, Autor: ${resultObj.author || authorName})`);

      // Enviar evento de sincronização em tempo real instantâneo (<50ms) via Supabase Realtime Broadcast
      if (broadcastChannel) {
        try {
          await broadcastChannel.send({
            type: 'broadcast',
            event: 'stock_movement_created',
            payload: {
              message_id: message.id,
              channel_id: channelId,
              bau_id: matchedBau?.id,
              bau_name: matchedBau?.nome,
              author_name: resultObj.author || authorName,
              items_count: parsedItems.length,
              timestamp: Date.now()
            }
          });
          console.log(`📡 [STOCK-ENGINE] Broadcast de sincronização instantânea emitido com sucesso!`);
        } catch (bcErr) {
          console.warn(`⚠️ [STOCK-ENGINE] Falha ao emitir broadcast Supabase:`, bcErr.message);
        }
      }
    } else {
      console.warn(`⚠️ [STOCK-ENGINE] Resultado RPC para msg ${message.id}:`, resultObj);
      if (resultObj?.error?.includes('anteriormente')) {
        markMessageProcessed(message.id);
      }
    }
  } catch (err) {
    console.error(`❌ [STOCK-ENGINE] Erro ao processar mensagem ${message.id}:`, err);
  }
}

function initStockEngine(client, supabaseClient = null) {
  console.log("📦 [STOCK-ENGINE] Inicializando Motor de Estoque Automático em Tempo Real...");

  if (process.env.DATABASE_URL) {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  } else {
    console.warn("⚠️ [STOCK-ENGINE] DATABASE_URL não configurado. Listener de estoque inativo.");
    return;
  }

  // Inicializar canal de broadcast Supabase para notificação imediata (<50ms) ao painel web
  let stockBroadcastChannel = null;
  if (supabaseClient) {
    stockBroadcastChannel = supabaseClient.channel('system-stock-events', {
      config: { broadcast: { self: false } }
    });
    stockBroadcastChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log("📡 [STOCK-ENGINE] Canal de broadcast Supabase 'system-stock-events' conectado e pronto!");
      }
    });

    // Assistir alterações de configuração no banco para invalidar cache em tempo real
    supabaseClient
      .channel('stock_engine_db_watcher')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discord_stock_config' }, () => {
        console.log('🔄 [STOCK-ENGINE] discord_stock_config alterado no DB. Atualizando cache...');
        refreshCache();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'baus' }, () => {
        console.log('🔄 [STOCK-ENGINE] baus alterado no DB. Atualizando cache...');
        refreshCache();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        refreshCache();
      })
      .subscribe();
  }

  // Pré-aquecer cache na inicialização
  refreshCache().then((loaded) => {
    if (loaded) {
      console.log(`📦 [STOCK-ENGINE] Cache inicializado: ${loaded.allBaus.length} baús carregados, ${loaded.targetChannelIds.size} canais ativos de estoque monitorados.`);
    }
  });

  // 1. Listener em tempo real ultrarrápido (MessageCreate) com suporte a simulação e canais de teste
  client.on(Events.MessageCreate, async (message) => {
    try {
      const channelId = String(message.channelId || message.channel?.id || '').trim();
      if (!channelId) return;

      // Descarte instantâneo em 0ms se a mensagem já foi processada
      if (processedMessageIds.has(message.id)) return;

      // Detecta se é embed de movimentação de estoque (Cidade Alta APP ou simulação técnica)
      const hasStockEmbed = message.embeds?.length > 0 &&
        /saldo\s*l[ií]quido|detalhes\s*da\s*movimenta[cç][aã]o|retirou|guardou|depositou|ba[uú]|itens|a[cç][aã]o\s*e\s*registro/i.test(
          (message.embeds[0].title || '') + '\n' + (message.embeds[0].description || '') + '\n' + (message.embeds[0].fields?.map(f => f.name + ' ' + f.value).join('\n') || '')
        );

      // Ignorar mensagens enviadas pelo próprio bot (EXCETO se for mensagem de simulação/teste de estoque)
      if (message.author?.id === client.user?.id && !hasStockEmbed) return;

      // Descarte ultrarrápido em 0ms se o canal não for monitorado (a menos que seja um embed de estoque de teste)
      if (!hasStockEmbed && cachedStockChannelIds.size > 0 && !cachedStockChannelIds.has(channelId)) {
        return;
      }

      const loaded = await getOrRefreshConfigAndBaus();
      if (!loaded || loaded.config.is_active === false) return;

      // Verificação final pós-cache se necessário (permite embeds de estoque para canais de teste)
      if (!hasStockEmbed && !loaded.targetChannelIds.has(channelId)) return;

      await processStockMessage(message, loaded.config, loaded.allBaus, stockBroadcastChannel);
    } catch (err) {
      console.error("❌ [STOCK-ENGINE] Erro no listener MessageCreate:", err);
    }
  });

  // 2. Rotina de Sincronização e Catch-up Periódico (a cada 15s) para garantir que NENHUMA log seja perdida
  setInterval(async () => {
    try {
      const loaded = await getOrRefreshConfigAndBaus();
      if (!loaded || loaded.config.is_active === false) return;
      const { config, allBaus, targetChannelIds } = loaded;

      for (const chId of targetChannelIds) {
        try {
          const channel = client.channels.cache.get(chId) || await client.channels.fetch(chId).catch(() => null);
          if (!channel || typeof channel.messages?.fetch !== 'function') continue;

          const recentMsgs = await channel.messages.fetch({ limit: 15 }).catch(() => null);
          if (!recentMsgs || recentMsgs.size === 0) continue;

          // Processar da mais antiga para a mais recente
          const sortedMsgs = Array.from(recentMsgs.values()).reverse();
          for (const msg of sortedMsgs) {
            if (processedMessageIds.has(msg.id)) continue;
            await processStockMessage(msg, config, allBaus, stockBroadcastChannel);
          }
        } catch (chErr) {
          // Ignore individual channel fetch error
        }
      }
    } catch (syncErr) {
      // Ignore background sync error
    }
  }, 15 * 1000);

  console.log("✅ [STOCK-ENGINE] Motor de estoque ativo com broadcast instantâneo e catch-up automático a cada 15s!");
}

module.exports = { initStockEngine, parseDiscordStockMessage };
