const { Events } = require('discord.js');
const crypto = require('crypto');
const firebaseRtdb = require('./firebase');

const FIREBASE_RTDB_URL = process.env.FIREBASE_RTDB_URL || "https://rfdrive-fd805-default-rtdb.firebaseio.com";

async function fetchFromFirebaseRtdb(nodePath) {
  try {
    const data = await firebaseRtdb.get(nodePath);
    if (!data) return null;
    if (typeof data === "object" && !Array.isArray(data)) {
      return Object.values(data);
    }
    return data;
  } catch (err) {
    return null;
  }
}

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

  const bauTitleMatch = rawText.match(/(?:📦\s*)?ba[uú]\s*[:\-]\s*([^\n\r]+)/i);
  if (bauTitleMatch && bauTitleMatch[1]) {
    const extracted = bauTitleMatch[1].replace(/📦/g, '').replace(/^[:\-\s]+/, '').trim();
    if (extracted && !['baú', 'bau'].includes(extracted.toLowerCase())) {
      bauName = extracted;
    }
  }

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
  let actionMultiplier = 1;
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

    if (/^(?:💼\s*)?retirou|removido|retirada/i.test(line)) {
      actionMultiplier = -1;
    } else if (/^(?:💼\s*)?guardou|depositou|adicionado|dep[oó]sito/i.test(line)) {
      actionMultiplier = 1;
    }

    if (/(?:🎒\s*)?itens/i.test(line)) {
      inItensSection = true;
      inSaldoLiquidoSection = false;
      inDetalhesSection = false;

      const inlineItens = line.replace(/^(?:🎒\s*)?itens\s*[:\-]?\s*/i, '').trim();
      if (inlineItens) {
        const itemTokens = inlineItens.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean);
        for (const token of itemTokens) {
          parseItemToken(token, actionMultiplier, parsedItems, isTransfer, fromBauName, toBauName, bauName, config);
        }
      }
      continue;
    }

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

    if (/detalhes\s*da\s*movimenta[cç][aã]o/i.test(line)) {
      inSaldoLiquidoSection = false;
      inDetalhesSection = true;
      inItensSection = false;
      continue;
    }

    if (/movimenta[cç][oõ]es\s*agrupadas|voc[eê]\s*consegue\s*agendar|cda\s*:\s*\d+|data|hor[aá]rio|respons[aá]vel/i.test(line)) {
      inItensSection = false;
      inSaldoLiquidoSection = false;
      inDetalhesSection = false;
      continue;
    }

    if (inItensSection) {
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
const CACHE_TTL_MS = 15000;

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
  try {
    let config = null;
    let prods = [];
    let allBaus = [];

    // Carregar configurações diretamente do Firebase Realtime Database
    const fbConfigList = await fetchFromFirebaseRtdb("discord_stock_config");
    if (fbConfigList && fbConfigList.length > 0) {
      config = fbConfigList[0];
    }
    const fbProds = await fetchFromFirebaseRtdb("products");
    if (fbProds) {
      prods = fbProds.filter(p => p.ativo !== false);
    }
    const fbBaus = await fetchFromFirebaseRtdb("baus");
    if (fbBaus) {
      allBaus = fbBaus.filter(b => b.ativo !== false);
    }

    if (!config) return null;

    // Mesclar cda_name (múltiplos aliases) e nomes dos produtos cadastrados para aliases automáticos
    const mergedMappings = { ...(config.item_mappings || {}) };
    for (const p of prods) {
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
    console.warn("⚠️ [STOCK-ENGINE] Falha ao atualizar cache de configurações via Firebase:", e.message);
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
 * Processa uma mensagem individual de estoque do Discord gravando no Firebase RTDB
 */
async function processStockMessage(message, config, allBaus, broadcastChannel = null) {
  try {
    const channelId = String(message.channelId || message.channel?.id || '').trim();
    if (!channelId) return;

    if (processedMessageIds.has(message.id)) {
      return;
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

    // Marcar como processada para evitar duplicatas instantâneas
    markMessageProcessed(message.id);

    console.log(`📦 [STOCK-ENGINE] Processando movimentação automática instantânea no baú "${matchedBau?.nome || 'Geral'}" (Msg ID: ${message.id})`);

    const { authorName, gamePlayerId, parsedItems } = parseDiscordStockMessage(rawText, embedObj, config, matchedBau?.nome);

    if (!parsedItems || parsedItems.length === 0) {
      console.warn(`⚠️ [STOCK-ENGINE] Nenhum item reconhecido na msg ${message.id}`);
      const errorLogId = crypto.randomUUID();
      await firebaseRtdb.set(`discord_stock_logs/${errorLogId}`, {
        id: errorLogId,
        message_id: message.id,
        channel_id: channelId,
        guild_id: message.guildId || message.guild?.id || null,
        author_name: authorName || 'Sistema Twin Wheels',
        game_player_id: gamePlayerId || null,
        raw_content: rawText,
        raw_embeds: embedObj,
        parsed_items: [],
        status: 'error',
        error_message: 'Nenhum item válido identificado no formato esperado',
        created_at: new Date().toISOString()
      }).catch(() => {});
      return;
    }

    // Resolver membro / perfil do usuário pelo game_player_id ou nome
    let finalUserId = null;
    let finalAuthorName = authorName || 'Sistema Twin Wheels';

    const profilesList = await fetchFromFirebaseRtdb("profiles") || [];
    if (gamePlayerId) {
      const pFound = profilesList.find(p => p.game_id && String(p.game_id).trim() === String(gamePlayerId).trim());
      if (pFound) {
        finalUserId = pFound.user_id || pFound.id;
        finalAuthorName = pFound.nome || finalAuthorName;
      }
    }
    if (!finalUserId && authorName) {
      const lowerAuthor = authorName.trim().toLowerCase();
      const pFound = profilesList.find(p => 
        (p.nome && p.nome.trim().toLowerCase() === lowerAuthor) ||
        (p.nickname && p.nickname.trim().toLowerCase() === lowerAuthor)
      );
      if (pFound) {
        finalUserId = pFound.user_id || pFound.id;
        finalAuthorName = pFound.nome || finalAuthorName;
      }
    }

    const allowNegative = config.allow_negative_stock === true;
    const nowIso = new Date().toISOString();

    // Carregar produtos e product_baus atuais do Firebase
    let allProducts = await fetchFromFirebaseRtdb("products") || [];
    let productBausMap = await firebaseRtdb.get("product_baus") || {};

    for (const item of parsedItems) {
      const cleanName = (item.item_name || '').trim();
      const lowerClean = cleanName.toLowerCase();
      const normClean = normalizeText(cleanName);

      // Localizar produto existente
      let targetProduct = allProducts.find(p => {
        if (!p.nome) return false;
        if (p.nome.trim().toLowerCase() === lowerClean) return true;
        if (normalizeText(p.nome) === normClean) return true;
        if (p.cda_name) {
          const aliases = p.cda_name.split(/[,;\n|]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
          if (aliases.includes(lowerClean)) return true;
        }
        return false;
      });

      // Se produto não existir, auto-cadastrar no Firebase RTDB
      if (!targetProduct) {
        const newProdId = crypto.randomUUID();
        targetProduct = {
          id: newProdId,
          nome: cleanName,
          cda_name: cleanName,
          categoria_id: null,
          ativo: true,
          estoque_atual: "0.00",
          estoque_minimo: "0.00",
          preco_sugerido: "0.00",
          unidade: "un",
          created_at: nowIso,
          updated_at: nowIso,
        };
        await firebaseRtdb.set(`products/${newProdId}`, targetProduct);
        allProducts.push(targetProduct);
        console.log(`✨ [STOCK-ENGINE] Novo produto auto-cadastrado no Firebase RTDB: ${cleanName} (${newProdId})`);
      }

      if (item.is_transfer) {
        // Transferência entre baús
        const fromBau = allBaus.find(b => b.nome && b.nome.toLowerCase() === (item.from_bau_name || '').toLowerCase()) || matchedBau;
        const toBau = allBaus.find(b => b.nome && b.nome.toLowerCase() === (item.to_bau_name || '').toLowerCase()) || matchedBau;
        const qty = Math.abs(item.quantity_change);

        // 1. Saída do baú de origem
        const fromKey = `${targetProduct.id}_${fromBau.id}`;
        const fromPrev = parseFloat(productBausMap[fromKey]?.quantidade || 0) || 0;
        const fromNew = allowNegative ? (fromPrev - qty) : Math.max(0, fromPrev - qty);

        const fromPbData = {
          product_id: targetProduct.id,
          bau_id: fromBau.id,
          quantidade: fromNew.toFixed(2),
          updated_at: nowIso,
        };
        await firebaseRtdb.set(`product_baus/${fromKey}`, fromPbData);
        productBausMap[fromKey] = fromPbData;

        const movSaidaId = crypto.randomUUID();
        await firebaseRtdb.set(`stock_movements/${movSaidaId}`, {
          id: movSaidaId,
          product_id: targetProduct.id,
          bau_id: fromBau.id,
          user_id: finalUserId,
          type: "saida",
          quantity: qty.toFixed(2),
          previous_balance: fromPrev.toFixed(2),
          resulting_balance: fromNew.toFixed(2),
          reason: `Transferência automática para ${toBau.nome || 'Baú'}`,
          discord_message_id: message.id,
          discord_user_name: finalAuthorName,
          game_player_id: gamePlayerId || null,
          origin: "discord",
          raw_log: rawText,
          status: "completed",
          created_at: nowIso,
        });

        // 2. Entrada no baú de destino
        const toKey = `${targetProduct.id}_${toBau.id}`;
        const toPrev = parseFloat(productBausMap[toKey]?.quantidade || 0) || 0;
        const toNew = toPrev + qty;

        const toPbData = {
          product_id: targetProduct.id,
          bau_id: toBau.id,
          quantidade: toNew.toFixed(2),
          updated_at: nowIso,
        };
        await firebaseRtdb.set(`product_baus/${toKey}`, toPbData);
        productBausMap[toKey] = toPbData;

        const movEntradaId = crypto.randomUUID();
        await firebaseRtdb.set(`stock_movements/${movEntradaId}`, {
          id: movEntradaId,
          product_id: targetProduct.id,
          bau_id: toBau.id,
          user_id: finalUserId,
          type: "entrada",
          quantity: qty.toFixed(2),
          previous_balance: toPrev.toFixed(2),
          resulting_balance: toNew.toFixed(2),
          reason: `Transferência automática recebida de ${fromBau.nome || 'Baú'}`,
          discord_message_id: message.id,
          discord_user_name: finalAuthorName,
          game_player_id: gamePlayerId || null,
          origin: "discord",
          raw_log: rawText,
          status: "completed",
          created_at: nowIso,
        });

      } else {
        // Movimentação direta (Entrada ou Saída)
        let targetBau = matchedBau;
        if (item.bau_name && !['baú', 'bau'].includes(item.bau_name.trim().toLowerCase())) {
          const bFound = allBaus.find(b => b.nome && b.nome.toLowerCase() === item.bau_name.trim().toLowerCase());
          if (bFound) targetBau = bFound;
        }

        const pbKey = `${targetProduct.id}_${targetBau.id}`;
        const prevQty = parseFloat(productBausMap[pbKey]?.quantidade || 0) || 0;
        const qtyChange = item.quantity_change;
        let newQty = prevQty + qtyChange;
        if (!allowNegative && newQty < 0) {
          newQty = 0;
        }

        const pbData = {
          product_id: targetProduct.id,
          bau_id: targetBau.id,
          quantidade: newQty.toFixed(2),
          updated_at: nowIso,
        };
        await firebaseRtdb.set(`product_baus/${pbKey}`, pbData);
        productBausMap[pbKey] = pbData;

        const movId = crypto.randomUUID();
        const movType = qtyChange > 0 ? "entrada" : "saida";
        await firebaseRtdb.set(`stock_movements/${movId}`, {
          id: movId,
          product_id: targetProduct.id,
          bau_id: targetBau.id,
          user_id: finalUserId,
          type: movType,
          quantity: Math.abs(qtyChange).toFixed(2),
          previous_balance: prevQty.toFixed(2),
          resulting_balance: newQty.toFixed(2),
          reason: `Sincronizado via Discord Logs (${movType})`,
          discord_message_id: message.id,
          discord_user_name: finalAuthorName,
          game_player_id: gamePlayerId || null,
          origin: "discord",
          raw_log: rawText,
          status: "completed",
          created_at: nowIso,
        });
      }

      // Recalcular saldo total do produto em todos os baús
      let totalStock = 0;
      for (const [k, pb] of Object.entries(productBausMap)) {
        if (pb && pb.product_id === targetProduct.id) {
          totalStock += parseFloat(pb.quantidade || 0) || 0;
        }
      }
      if (!allowNegative && totalStock < 0) totalStock = 0;

      await firebaseRtdb.update(`products/${targetProduct.id}`, {
        estoque_atual: totalStock.toFixed(2),
        updated_at: nowIso,
      });
    }

    // Salvar log de sucesso em discord_stock_logs
    const stockLogId = crypto.randomUUID();
    await firebaseRtdb.set(`discord_stock_logs/${stockLogId}`, {
      id: stockLogId,
      message_id: message.id,
      channel_id: channelId,
      guild_id: message.guildId || message.guild?.id || null,
      author_name: finalAuthorName,
      game_player_id: gamePlayerId || null,
      raw_content: rawText,
      raw_embeds: embedObj,
      parsed_items: parsedItems,
      status: "success",
      error_message: null,
      created_at: nowIso,
    });

    // Atualizar status na configuração do estoque
    if (config.id) {
      await firebaseRtdb.update(`discord_stock_config/${config.id}`, {
        last_message_id: message.id,
        last_processed_at: nowIso,
        last_status: "success",
        updated_at: nowIso,
      }).catch(() => {});
    }

    console.log(`✅ [STOCK-ENGINE] Movimentação automática gravada no Firebase RTDB com sucesso! (Msg: ${message.id}, ${parsedItems.length} itens, Baú: ${matchedBau?.nome || 'QG'}, Autor: ${finalAuthorName})`);

    // Emitir pulso de sincronização no Firebase RTDB para atualização imediata do frontend web
    try {
      await firebaseRtdb.set('system_stock_sync_pulse', {
        timestamp: Date.now(),
        message_id: message.id,
        channel_id: channelId,
        bau_id: matchedBau?.id,
        bau_name: matchedBau?.nome,
        author_name: finalAuthorName,
        items_count: parsedItems.length,
      });

      await firebaseRtdb.set('system_realtime_events/latest', {
        type: 'cdc',
        table: 'stock_movements',
        eventType: 'INSERT',
        keys: ['movements', 'product_baus', 'baus', 'products', 'dashboard_metrics', 'discord_stock_logs'],
        originId: 'tw_bot_discord',
        timestamp: Date.now(),
      });
    } catch {}

    // Emitir também broadcast via Supabase Realtime (se cliente disponível)
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
            author_name: finalAuthorName,
            items_count: parsedItems.length,
            timestamp: Date.now(),
          }
        });
      } catch {}
    }

  } catch (err) {
    console.error(`❌ [STOCK-ENGINE] Erro ao processar mensagem ${message.id}:`, err);
  }
}

function initStockEngine(client, supabaseClient = null) {
  console.log("📦 [STOCK-ENGINE] Inicializando Motor de Estoque Automático em Tempo Real (Firebase RTDB)...");

  let stockBroadcastChannel = null;
  if (supabaseClient) {
    try {
      stockBroadcastChannel = supabaseClient.channel('system-stock-events', {
        config: { broadcast: { self: false } }
      });
      stockBroadcastChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log("📡 [STOCK-ENGINE] Canal de broadcast Supabase 'system-stock-events' conectado.");
        }
      });
    } catch {}
  }

  // Pré-aquecer cache na inicialização
  refreshCache().then((loaded) => {
    if (loaded) {
      console.log(`📦 [STOCK-ENGINE] Cache inicializado via Firebase: ${loaded.allBaus.length} baús carregados, ${loaded.targetChannelIds.size} canais de estoque monitorados.`);
    } else {
      console.log("📦 [STOCK-ENGINE] Aguardando configurações no Firebase RTDB...");
    }
  });

  // 1. Listener em tempo real ultrarrápido (MessageCreate)
  client.on(Events.MessageCreate, async (message) => {
    try {
      const channelId = String(message.channelId || message.channel?.id || '').trim();
      if (!channelId) return;

      if (processedMessageIds.has(message.id)) return;

      const hasStockEmbed = message.embeds?.length > 0 &&
        /saldo\s*l[ií]quido|detalhes\s*da\s*movimenta[cç][aã]o|retirou|guardou|depositou|ba[uú]|itens|a[cç][aã]o\s*e\s*registro/i.test(
          (message.embeds[0].title || '') + '\n' + (message.embeds[0].description || '') + '\n' + (message.embeds[0].fields?.map(f => f.name + ' ' + f.value).join('\n') || '')
        );

      if (message.author?.id === client.user?.id && !hasStockEmbed) return;

      if (!hasStockEmbed && cachedStockChannelIds.size > 0 && !cachedStockChannelIds.has(channelId)) {
        return;
      }

      const loaded = await getOrRefreshConfigAndBaus();
      if (!loaded || loaded.config.is_active === false) return;

      if (!hasStockEmbed && !loaded.targetChannelIds.has(channelId)) return;

      await processStockMessage(message, loaded.config, loaded.allBaus, stockBroadcastChannel);
    } catch (err) {
      console.error("❌ [STOCK-ENGINE] Erro no listener MessageCreate:", err);
    }
  });

  // 2. Rotina de Sincronização e Catch-up Periódico (a cada 20s) para garantir que NENHUMA log seja perdida
  setInterval(async () => {
    try {
      const loaded = await getOrRefreshConfigAndBaus();
      if (!loaded || loaded.config.is_active === false) return;
      const { config, allBaus, targetChannelIds } = loaded;

      for (const chId of targetChannelIds) {
        try {
          const channel = client.channels.cache.get(chId) || await client.channels.fetch(chId).catch(() => null);
          if (!channel || typeof channel.messages?.fetch !== 'function') continue;

          const recentMsgs = await channel.messages.fetch({ limit: 10 }).catch(() => null);
          if (!recentMsgs || recentMsgs.size === 0) continue;

          const sortedMsgs = Array.from(recentMsgs.values()).reverse();
          for (const msg of sortedMsgs) {
            if (processedMessageIds.has(msg.id)) continue;
            await processStockMessage(msg, config, allBaus, stockBroadcastChannel);
          }
        } catch (chErr) {
          // Ignora erro em canal individual
        }
      }
    } catch (syncErr) {
      // Ignora erro de sincronização em segundo plano
    }
  }, 20 * 1000);

  console.log("✅ [STOCK-ENGINE] Motor de estoque ativo 100% no Firebase RTDB com broadcast e catch-up contínuo!");
}

module.exports = { initStockEngine, parseDiscordStockMessage };
