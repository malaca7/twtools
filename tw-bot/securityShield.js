/**
 * Twin Wheels Security & Anti-Spam Shield Engine
 * Proteção ativa contra spam, flood, links não autorizados (ex: Telegram spammers / A_ToolsX) e ataques em endpoints.
 */

const crypto = require("crypto");

// Configuração padrão dinâmica
let dynamicAntiSpamConfig = {
  enabled: true,
  blockTelegramLinks: true,
  blockDiscordInvites: true,
  blockPhishingLinks: true,
  blockIpLoggers: true,
  rateLimitEnabled: true,
  ipRateLimitEnabled: true,
  channelRateLimitEnabled: true,
  maxRequestsPerMinutePerIp: 25,
  maxMessagesPerMinutePerChannel: 20,
  duplicateProtectionEnabled: true,
  duplicateWindowSeconds: 45,
  customBlockedPhrasesEnabled: true,
  customBlockedPhrases: [],
  customBlockedDomainsEnabled: true,
  customBlockedDomains: [],
  autoDeleteChannelSpam: true,
  notifyOnSpamBlocked: true,
  stats: {
    totalBlocked: 0,
    lastBlockedAt: null,
    lastBlockedReason: null,
    lastBlockedChannel: null,
    lastBlockedIp: null,
  },
};

let supabaseInstance = null;

// Padrões de links e termos bloqueados padrão de fábrica
const CORE_BLOCKED_URL_PATTERNS = [
  /t\.me\//i,
  /telegram\.me\//i,
  /telegram\.dog\//i,
  /a_tools/i,
  /a-tools/i,
  /a_toolsx/i,
  /grabify\.link/i,
  /iplogger/i,
  /2no\.co/i,
  /yip\.su/i,
  /discord-nitro/i,
  /free-nitro/i,
  /discord-gift/i,
  /dlscord\./i,
  /discorcd\./i,
  /discort\./i,
];

const CORE_BLOCKED_TEXT_PHRASES = [
  "to use this bot, you must join",
  "to use this bot you must join",
  "programming & development tools",
  "resources • services everything you need",
  "join our channel",
  "a-tools x",
  "a_toolsx",
  "free nitro",
  "steam gift card",
  "claim your free nitro",
  "crypto airdrop",
  "claim free nitro",
  "free robux",
  "telegram channel",
];

// Rate limiting in-memory storage (sliding window)
const ipRequestHistory = new Map(); // ip -> Array of timestamps
const channelMessageHistory = new Map(); // channelId -> Array of timestamps
const recentMessageHashes = new Map(); // hash -> timestamp

// Limpeza periódica de memória a cada 2 minutos
setInterval(() => {
  const now = Date.now();
  const windowLimit = now - 60000;

  for (const [ip, times] of ipRequestHistory.entries()) {
    const valid = times.filter((t) => t > windowLimit);
    if (valid.length === 0) ipRequestHistory.delete(ip);
    else ipRequestHistory.set(ip, valid);
  }

  for (const [chId, times] of channelMessageHistory.entries()) {
    const valid = times.filter((t) => t > windowLimit);
    if (valid.length === 0) channelMessageHistory.delete(chId);
    else channelMessageHistory.set(chId, valid);
  }

  for (const [hash, time] of recentMessageHashes.entries()) {
    if (time < windowLimit) recentMessageHashes.delete(hash);
  }
}, 120000);

/**
 * Normaliza o texto removendo caracteres invisíveis, homóglifos e pontuações excessivas
 */
function normalizeContent(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width spaces
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/**
 * Avalia se o texto ou embeds contêm conteúdo malicioso, links proibidos ou spam conhecido
 */
function isSpamOrMalicious(content = "", embeds = []) {
  if (dynamicAntiSpamConfig && dynamicAntiSpamConfig.enabled === false) {
    return { isBlocked: false };
  }

  const allTextsToCheck = [];

  if (typeof content === "string" && content.trim()) {
    allTextsToCheck.push(content);
  }

  const embedList = Array.isArray(embeds) ? embeds : [embeds].filter(Boolean);
  for (const emb of embedList) {
    if (!emb || typeof emb !== "object") continue;
    if (emb.title) allTextsToCheck.push(emb.title);
    if (emb.description) allTextsToCheck.push(emb.description);
    if (emb.url) allTextsToCheck.push(emb.url);
    if (emb.author?.name) allTextsToCheck.push(emb.author.name);
    if (emb.author?.url) allTextsToCheck.push(emb.author.url);
    if (emb.footer?.text) allTextsToCheck.push(emb.footer.text);
    if (emb.image?.url) allTextsToCheck.push(emb.image.url);
    if (emb.imageUrl) allTextsToCheck.push(emb.imageUrl);
    if (emb.thumbnail?.url) allTextsToCheck.push(emb.thumbnail.url);
    if (emb.thumbnailUrl) allTextsToCheck.push(emb.thumbnailUrl);

    if (Array.isArray(emb.fields)) {
      for (const f of emb.fields) {
        if (f.name) allTextsToCheck.push(f.name);
        if (f.value) allTextsToCheck.push(f.value);
      }
    }
  }

  const combinedRaw = allTextsToCheck.join("\n");
  const normalized = normalizeContent(combinedRaw);

  if (!normalized) return { isBlocked: false };

  // 1. Checagem por Regex de URLs bloqueadas (Core)
  if (dynamicAntiSpamConfig.blockTelegramLinks !== false || dynamicAntiSpamConfig.blockPhishingLinks !== false) {
    for (const pattern of CORE_BLOCKED_URL_PATTERNS) {
      if (pattern.test(combinedRaw) || pattern.test(normalized)) {
        return {
          isBlocked: true,
          reason: `Link ou domínio não autorizado detectado (${pattern.toString()})`,
        };
      }
    }
  }

  // 2. Checagem por frases típicas de spambots (Core)
  for (const phrase of CORE_BLOCKED_TEXT_PHRASES) {
    if (normalized.includes(phrase)) {
      return {
        isBlocked: true,
        reason: `Padrão de mensagem de spam identificado: "${phrase}"`,
      };
    }
  }

  // 3. Checagem de links Telegram genéricos
  if (dynamicAntiSpamConfig.blockTelegramLinks !== false) {
    if (normalized.includes("t.me/") || normalized.includes("telegram.me/") || normalized.includes("telegram.dog/")) {
      return {
        isBlocked: true,
        reason: "Divulgação de canais ou bots de Telegram não é permitida.",
      };
    }
  }

  // 4. Checagem de convites do Discord não autorizados
  if (dynamicAntiSpamConfig.blockDiscordInvites) {
    if (/discord\.gg\/[a-zA-Z0-9_-]+/i.test(combinedRaw) || /discord\.com\/invite\/[a-zA-Z0-9_-]+/i.test(combinedRaw)) {
      return {
        isBlocked: true,
        reason: "Divulgação de convites externos do Discord bloqueada.",
      };
    }
  }

  // 5. Checagem de Domínios Customizados configurados pelo usuário
  if (dynamicAntiSpamConfig.customBlockedDomainsEnabled !== false && Array.isArray(dynamicAntiSpamConfig.customBlockedDomains)) {
    for (const domain of dynamicAntiSpamConfig.customBlockedDomains) {
      const cleanDom = normalizeContent(domain);
      if (cleanDom && (normalized.includes(cleanDom) || combinedRaw.toLowerCase().includes(cleanDom))) {
        return {
          isBlocked: true,
          reason: `Domínio bloqueado pelas regras da facção: "${domain}"`,
        };
      }
    }
  }

  // 6. Checagem de Frases Customizadas configuradas pelo usuário
  if (dynamicAntiSpamConfig.customBlockedPhrasesEnabled !== false && Array.isArray(dynamicAntiSpamConfig.customBlockedPhrases)) {
    for (const phrase of dynamicAntiSpamConfig.customBlockedPhrases) {
      const cleanPhrase = normalizeContent(phrase);
      if (cleanPhrase && normalized.includes(cleanPhrase)) {
        return {
          isBlocked: true,
          reason: `Termo proibido pelas regras da facção: "${phrase}"`,
        };
      }
    }
  }

  return { isBlocked: false };
}

/**
 * Validação de Rate Limit por IP e Canal de destino
 */
function checkRateLimit(ip = "unknown", channelId = "") {
  // Se o escudo geral estiver desativado ou o rate limit estiver desativado, permite livremente
  if (dynamicAntiSpamConfig && dynamicAntiSpamConfig.enabled === false) {
    return { allowed: true };
  }
  if (dynamicAntiSpamConfig && dynamicAntiSpamConfig.rateLimitEnabled === false) {
    return { allowed: true };
  }

  const now = Date.now();
  const window10s = now - 10000;
  const window60s = now - 60000;

  const isIpLimitActive = dynamicAntiSpamConfig.ipRateLimitEnabled !== false;
  const isChannelLimitActive = dynamicAntiSpamConfig.channelRateLimitEnabled !== false;

  const maxPerMinuteIp = Number(dynamicAntiSpamConfig.maxRequestsPerMinutePerIp) || 25;
  const maxPerMinuteChannel = Number(dynamicAntiSpamConfig.maxMessagesPerMinutePerChannel) || 20;

  // 1. Limite por IP
  if (isIpLimitActive && maxPerMinuteIp > 0) {
    const ipTimes = (ipRequestHistory.get(ip) || []).filter((t) => t > window60s);
    const burstThreshold = Math.max(10, Math.ceil(maxPerMinuteIp / 2));
    const recent10s = ipTimes.filter((t) => t > window10s);

    if (recent10s.length >= burstThreshold) {
      return {
        allowed: false,
        reason: `Muitas requisições em curto intervalo (Limite de rajada: ${burstThreshold} reqs / 10s). Aguarde alguns segundos.`,
        retryAfterSeconds: 5,
      };
    }

    if (ipTimes.length >= maxPerMinuteIp) {
      return {
        allowed: false,
        reason: `Limite por minuto excedido para este IP (Limite: ${maxPerMinuteIp} reqs / 60s). Aguarde.`,
        retryAfterSeconds: 15,
      };
    }

    ipTimes.push(now);
    ipRequestHistory.set(ip, ipTimes);
  }

  // 2. Limite por canal Discord (proteção contra flood no canal)
  if (channelId && isChannelLimitActive && maxPerMinuteChannel > 0) {
    const chTimes = (channelMessageHistory.get(channelId) || []).filter((t) => t > window60s);
    if (chTimes.length >= maxPerMinuteChannel) {
      return {
        allowed: false,
        reason: `Limite de mensagens por minuto atingido para este canal Discord (Limite: ${maxPerMinuteChannel}/min).`,
        retryAfterSeconds: 10,
      };
    }
    chTimes.push(now);
    channelMessageHistory.set(channelId, chTimes);
  }

  return { allowed: true };
}

/**
 * Prevenção de duplicação exata de mensagens em janela configurável
 */
function isDuplicateFlood(channelId, content = "", embeds = []) {
  if (!channelId) return false;
  if (dynamicAntiSpamConfig && dynamicAntiSpamConfig.enabled === false) return false;
  if (dynamicAntiSpamConfig && dynamicAntiSpamConfig.duplicateProtectionEnabled === false) return false;

  const windowSec = Number(dynamicAntiSpamConfig.duplicateWindowSeconds);
  if (isNaN(windowSec) || windowSec <= 0) return false;

  const signature = `${channelId}:${content}:${JSON.stringify(embeds || [])}`;
  const hash = crypto.createHash("sha256").update(signature).digest("hex");

  const now = Date.now();
  const lastSeen = recentMessageHashes.get(hash);
  const windowMs = windowSec * 1000;

  if (lastSeen && now - lastSeen < windowMs) {
    return true; // Mensagem 100% idêntica enviada há menos tempo que a janela
  }

  recentMessageHashes.set(hash, now);
  return false;
}

/**
 * Registra estatísticas de bloqueio de spam e persiste no banco
 */
async function recordBlockedSpam(reason, details = {}) {
  dynamicAntiSpamConfig.stats = dynamicAntiSpamConfig.stats || { totalBlocked: 0 };
  dynamicAntiSpamConfig.stats.totalBlocked = (dynamicAntiSpamConfig.stats.totalBlocked || 0) + 1;
  dynamicAntiSpamConfig.stats.lastBlockedAt = new Date().toISOString();
  dynamicAntiSpamConfig.stats.lastBlockedReason = reason;
  dynamicAntiSpamConfig.stats.lastBlockedChannel = details.channelId || details.channelName || null;
  dynamicAntiSpamConfig.stats.lastBlockedIp = details.ip || null;

  console.warn(`🛡️ [ANTI-SPAM BLOCK #${dynamicAntiSpamConfig.stats.totalBlocked}] Motivo: ${reason}`, details);

  if (supabaseInstance) {
    try {
      const { data } = await supabaseInstance
        .from("role_permissions")
        .select("permissions")
        .eq("level", "system_discord_webhooks")
        .maybeSingle();

      if (data?.permissions) {
        const currentPerms = data.permissions;
        currentPerms.antiSpam = currentPerms.antiSpam || {};
        currentPerms.antiSpam.stats = dynamicAntiSpamConfig.stats;

        await supabaseInstance
          .from("role_permissions")
          .update({ permissions: currentPerms, updated_at: new Date().toISOString() })
          .eq("level", "system_discord_webhooks");
      }
    } catch (e) {
      // Ignora falha de log assíncrono de estatísticas
    }
  }
}

/**
 * Inicializa e sincroniza a configuração dinâmica de Anti-Spam com o Supabase
 */
async function initDynamicAntiSpam(supabaseClient) {
  supabaseInstance = supabaseClient;
  if (!supabaseClient) return;

  try {
    const { data } = await supabaseClient
      .from("role_permissions")
      .select("permissions")
      .eq("level", "system_discord_webhooks")
      .maybeSingle();

    if (data?.permissions?.antiSpam) {
      dynamicAntiSpamConfig = {
        ...dynamicAntiSpamConfig,
        ...data.permissions.antiSpam,
        stats: {
          ...dynamicAntiSpamConfig.stats,
          ...(data.permissions.antiSpam.stats || {}),
        },
      };
      console.log(`🛡️ [ANTI-SPAM] Configurações dinâmicas carregadas do banco. Bloqueados até hoje: ${dynamicAntiSpamConfig.stats.totalBlocked || 0}`);
    }

    // Listener para atualizações em tempo real no banco
    supabaseClient
      .channel("security_shield_config_watcher")
      .on("postgres_changes", { event: "*", schema: "public", table: "role_permissions" }, (payload) => {
        if (payload.new?.level === "system_discord_webhooks" && payload.new?.permissions?.antiSpam) {
          dynamicAntiSpamConfig = {
            ...dynamicAntiSpamConfig,
            ...payload.new.permissions.antiSpam,
            stats: {
              ...dynamicAntiSpamConfig.stats,
              ...(payload.new.permissions.antiSpam.stats || {}),
            },
          };
          console.log("🔄 [ANTI-SPAM] Configurações de segurança atualizadas via Realtime.");
        }
      })
      .subscribe();
  } catch (err) {
    console.warn("⚠️ [ANTI-SPAM] Não foi possível carregar configurações dinâmicas:", err.message);
  }
}

/**
 * Retorna as configurações ativas de Anti-Spam
 */
function getActiveAntiSpamConfig() {
  return dynamicAntiSpamConfig;
}

/**
 * Validação de Token de Autorização em requisições de API
 */
function isAuthorizedApiRequest(req) {
  const authHeader = req.headers["authorization"] || "";
  const secretHeader = req.headers["x-tw-secret"] || req.headers["x-webhook-secret"] || "";

  const expectedServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const expectedAnonKey = process.env.SUPABASE_ANON_KEY || "";
  const expectedCustomSecret = process.env.TW_API_SECRET || "twinwheels_secret_guard_2026";

  if (secretHeader && (secretHeader === expectedCustomSecret || secretHeader === expectedServiceKey)) {
    return true;
  }

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (token === expectedServiceKey || token === expectedAnonKey || token === expectedCustomSecret) {
      return true;
    }
  }

  return false;
}

module.exports = {
  isSpamOrMalicious,
  checkRateLimit,
  isDuplicateFlood,
  isAuthorizedApiRequest,
  recordBlockedSpam,
  initDynamicAntiSpam,
  getActiveAntiSpamConfig,
  normalizeContent,
};
