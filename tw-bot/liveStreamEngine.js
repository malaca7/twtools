/**
 * Twin Wheels - Live Stream Engine
 * Motor modular de detecção de transmissões ao vivo para Twitch, Kick, YouTube e TikTok.
 * Executa verificação periódica, debounce de desconexões, prevenção estrita de duplicações,
 * notificações em tempo real na plataforma web e disparos de Embed no Discord.
 */

const https = require("https");
const http = require("http");

// Cache em memória de tokens e estados
let twitchAppAccessToken = null;
let twitchTokenExpiresAt = 0;
let isCheckRunning = false;
let pollingTimer = null;

// Mapa de streams ativas em memória: accountId -> { isLive, streamId, lastSeenAt }
const streamStateCache = new Map();

/**
 * Utilitário HTTP/HTTPS nativo sem dependências externas (JSON)
 */
function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;

    const reqOptions = {
      method: options.method || "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        ...(options.headers || {}),
      },
      timeout: options.timeout || 10000,
    };

    const req = client.request(urlObj, reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(data);
            resolve({ ok: true, status: res.statusCode, data: parsed });
          } else {
            resolve({ ok: false, status: res.statusCode, error: data });
          }
        } catch (e) {
          resolve({ ok: false, status: res.statusCode, error: "Invalid JSON", raw: data });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

/**
 * Utilitário HTTP/HTTPS com suporte a redirecionamentos (HTML / Text)
 */
function fetchText(url, options = {}, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > 5) {
      return resolve({ ok: false, error: "Too many redirects" });
    }
    try {
      const urlObj = new URL(url);
      const client = urlObj.protocol === "https:" ? https : http;

      const reqOptions = {
        method: options.method || "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          ...(options.headers || {}),
        },
        timeout: options.timeout || 10000,
      };

      const req = client.request(urlObj, reqOptions, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, url).toString();
          return resolve(fetchText(nextUrl, options, redirects + 1));
        }

        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            html: data,
          });
        });
      });

      req.on("error", (err) => resolve({ ok: false, error: err.message }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ ok: false, error: "Request timeout" });
      });

      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

/**
 * Obtém ou renova token App Access da Twitch via Client Credentials
 */
async function getTwitchAccessToken(clientId, clientSecret) {
  const now = Date.now();
  if (twitchAppAccessToken && twitchTokenExpiresAt > now + 60000) {
    return twitchAppAccessToken;
  }

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    const url = `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(
      clientId
    )}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`;

    const res = await fetchJson(url, { method: "POST" });
    if (res.ok && res.data?.access_token) {
      twitchAppAccessToken = res.data.access_token;
      twitchTokenExpiresAt = now + (res.data.expires_in || 3600) * 1000;
      console.log("🟣 [TWITCH API] Novo App Access Token gerado com sucesso.");
      return twitchAppAccessToken;
    }
  } catch (err) {
    console.warn("⚠️ [TWITCH API] Falha ao obter App Access Token:", err.message);
  }

  return null;
}

/**
 * Verificador de Live da Twitch (Zero-Config Automático + Suporte a API Privada)
 */
async function checkTwitchLive(channelName, config) {
  const cleanLogin = channelName.replace(/^@/, "").toLowerCase().trim();
  const clientId = config?.clientId;
  const clientSecret = config?.clientSecret;

  // 1. Tenta Helix API se credenciais configuradas
  if (clientId && clientSecret) {
    const token = await getTwitchAccessToken(clientId, clientSecret);
    if (token) {
      try {
        const url = `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(cleanLogin)}`;
        const res = await fetchJson(url, {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok && Array.isArray(res.data?.data)) {
          const stream = res.data.data[0];
          if (stream && stream.type === "live") {
            const thumb = stream.thumbnail_url
              ? stream.thumbnail_url.replace("{width}", "1280").replace("{height}", "720")
              : null;

            return {
              isLive: true,
              title: stream.title || "Live na Twitch",
              category: stream.game_name || "Grand Theft Auto V",
              thumbnailUrl: thumb,
              viewerCount: stream.viewer_count || 0,
              startedAt: stream.started_at || new Date().toISOString(),
              streamUrl: `https://twitch.tv/${cleanLogin}`,
              externalStreamId: stream.id,
            };
          }
          return { isLive: false };
        }
      } catch (err) {
        console.warn(`[TWITCH API] Erro ao consultar canal ${cleanLogin}:`, err.message);
      }
    }
  }

  // 2. MODO AUTOMÁTICO (Zero-Config): Fallback público via GQL Twitch
  try {
    const gqlUrl = "https://gql.twitch.tv/gql";
    const gqlBody = JSON.stringify({
      query: `query { user(login: "${cleanLogin}") { stream { id title viewersCount game { name } createdAt } } }`,
    });

    const res = await fetchJson(gqlUrl, {
      method: "POST",
      headers: {
        "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko", // Client ID público da Twitch Web
        "Content-Type": "application/json",
      },
      body: gqlBody,
    });

    if (res.ok && res.data?.data?.user?.stream) {
      const s = res.data.data.user.stream;
      return {
        isLive: true,
        title: s.title || "Live na Twitch",
        category: s.game?.name || "Grand Theft Auto V",
        thumbnailUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${cleanLogin}-1280x720.jpg`,
        viewerCount: s.viewersCount || 0,
        startedAt: s.createdAt || new Date().toISOString(),
        streamUrl: `https://twitch.tv/${cleanLogin}`,
        externalStreamId: s.id,
      };
    }
  } catch {}

  // 3. Fallback Web Scanner público
  try {
    const res = await fetchText(`https://www.twitch.tv/${cleanLogin}`);
    if (res.ok && res.html) {
      if (res.html.includes('"isLiveBroadcast":true') || res.html.includes('"isLive":true')) {
        return {
          isLive: true,
          title: `Live na Twitch • ${cleanLogin}`,
          category: "Grand Theft Auto V",
          thumbnailUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${cleanLogin}-1280x720.jpg`,
          viewerCount: 0,
          startedAt: new Date().toISOString(),
          streamUrl: `https://twitch.tv/${cleanLogin}`,
          externalStreamId: `twitch_${cleanLogin}`,
        };
      }
    }
  } catch {}

  return { isLive: false };
}

/**
 * Verificador de Live do Kick (Zero-Config Automático)
 */
async function checkKickLive(channelName) {
  const cleanSlug = channelName.replace(/^@/, "").toLowerCase().trim();

  try {
    const url = `https://kick.com/api/v2/channels/${encodeURIComponent(cleanSlug)}/livestream`;
    const res = await fetchJson(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (res.ok && res.data?.data) {
      const data = res.data.data;
      if (data.is_live || data.session_title) {
        return {
          isLive: true,
          title: data.session_title || "Live no Kick",
          category: data.category?.name || data.subcategory?.name || "Grand Theft Auto V",
          thumbnailUrl: data.thumbnail?.url || null,
          viewerCount: data.viewer_count || data.viewers || 0,
          startedAt: data.created_at || new Date().toISOString(),
          streamUrl: `https://kick.com/${cleanSlug}`,
          externalStreamId: String(data.id || Date.now()),
        };
      }
    }
  } catch (err) {
    // Fallback v1 Kick
    try {
      const v1Url = `https://kick.com/api/v1/channels/${encodeURIComponent(cleanSlug)}`;
      const v1Res = await fetchJson(v1Url);
      if (v1Res.ok && v1Res.data?.livestream) {
        const ls = v1Res.data.livestream;
        return {
          isLive: true,
          title: ls.session_title || "Live no Kick",
          category: ls.category?.name || "Grand Theft Auto V",
          thumbnailUrl: ls.thumbnail?.url || null,
          viewerCount: ls.viewer_count || 0,
          startedAt: ls.created_at || new Date().toISOString(),
          streamUrl: `https://kick.com/${cleanSlug}`,
          externalStreamId: String(ls.id || Date.now()),
        };
      }
    } catch {}
  }

  return { isLive: false };
}

/**
 * Verificador de Live do YouTube (Zero-Config Automático + Suporte a API Key)
 */
async function checkYouTubeLive(channelInput, config) {
  const clean = channelInput.trim();
  const apiKey = config?.apiKey;

  // 1. Se API Key informada e canal for ID com UC, usa a Google Data API v3
  if (apiKey && clean.startsWith("UC")) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
        clean
      )}&eventType=live&type=video&key=${apiKey}`;

      const res = await fetchJson(url);
      if (res.ok && Array.isArray(res.data?.items) && res.data.items.length > 0) {
        const item = res.data.items[0];
        const snippet = item.snippet;
        const videoId = item.id?.videoId;

        return {
          isLive: true,
          title: snippet?.title || "Live no YouTube",
          category: "Grand Theft Auto V",
          thumbnailUrl:
            snippet?.thumbnails?.high?.url ||
            snippet?.thumbnails?.medium?.url ||
            `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          viewerCount: 0,
          startedAt: snippet?.publishedAt || new Date().toISOString(),
          streamUrl: `https://youtube.com/watch?v=${videoId}`,
          externalStreamId: videoId,
        };
      }
    } catch {}
  }

  // 2. MODO AUTOMÁTICO (Zero-Config): Detecção pública direta via página /live ou handle sem precisar de chave API
  try {
    const handleUrl = clean.startsWith("UC")
      ? `https://www.youtube.com/channel/${clean}/live`
      : `https://www.youtube.com/${clean.startsWith("@") ? clean : `@${clean}`}/live`;

    const res = await fetchText(handleUrl);
    if (res.ok && res.html) {
      const isLive = res.html.includes('"isLive":true') || res.html.includes('"status":"LIVE"');
      if (isLive) {
        const matchCanonical = res.html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)"/);
        const matchTitle = res.html.match(/<meta name="title" content="([^"]+)"/);
        const matchThumb = res.html.match(/<meta property="og:image" content="([^"]+)"/);
        const videoId = matchCanonical ? matchCanonical[1] : `yt_${Date.now()}`;

        return {
          isLive: true,
          title: matchTitle ? matchTitle[1].replace(/ - YouTube$/, "") : "Live no YouTube",
          category: "Grand Theft Auto V",
          thumbnailUrl: matchThumb ? matchThumb[1] : `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          viewerCount: 0,
          startedAt: new Date().toISOString(),
          streamUrl: `https://youtube.com/watch?v=${videoId}`,
          externalStreamId: videoId,
        };
      }
    }
  } catch (err) {
    console.warn(`[YOUTUBE PUBLIC DETECT] Erro ao consultar ${clean}:`, err.message);
  }

  return { isLive: false };
}

/**
 * Verificador de Live do TikTok (Zero-Config Automático)
 */
async function checkTikTokLive(channelName) {
  const cleanHandle = channelName.replace(/^@/, "").trim();

  try {
    const url = `https://www.tiktok.com/@${cleanHandle}/live`;
    const res = await fetchText(url);
    if (res.ok && res.html) {
      const isLive = res.html.includes('"liveRoom"') && (res.html.includes('"status":2') || res.html.includes('"liveUrl"'));
      if (isLive) {
        const matchTitle = res.html.match(/"title":"([^"]+)"/) || res.html.match(/<meta property="og:title" content="([^"]+)"/);
        const matchThumb = res.html.match(/<meta property="og:image" content="([^"]+)"/);

        return {
          isLive: true,
          title: matchTitle ? matchTitle[1] : `Live no TikTok de @${cleanHandle}`,
          category: "Grand Theft Auto V",
          thumbnailUrl: matchThumb ? matchThumb[1] : null,
          viewerCount: 0,
          startedAt: new Date().toISOString(),
          streamUrl: `https://tiktok.com/@${cleanHandle}/live`,
          externalStreamId: `tiktok_${cleanHandle}_${Date.now()}`,
        };
      }
    }
  } catch (err) {
    console.warn(`[TIKTOK PUBLIC DETECT] Erro ao consultar @${cleanHandle}:`, err.message);
  }

  return { isLive: false };
}

/**
 * Despacha o status da live baseado na plataforma
 */
async function checkPlatformStream(platform, channelName, config) {
  switch (platform) {
    case "twitch":
      return checkTwitchLive(channelName, config?.platforms?.twitch);
    case "kick":
      return checkKickLive(channelName, config?.platforms?.kick);
    case "youtube":
      return checkYouTubeLive(channelName, config?.platforms?.youtube);
    case "tiktok":
      return checkTikTokLive(channelName, config?.platforms?.tiktok);
    default:
      return { isLive: false };
  }
}

/**
 * Classe principal do Motor de Lives
 */
class LiveStreamEngine {
  constructor(supabase, discordClient) {
    this.supabase = supabase;
    this.discord = discordClient;
    this.config = null;
  }

  /**
   * Inicializa o motor, carrega configurações e agenda o timer de verificação
   */
  async init() {
    console.log("🔴 [LIVE ENGINE] Inicializando Motor de Transmissões Twin Wheels...");
    await this.reloadConfig();

    // Primeira verificação após 5 segundos da inicialização
    setTimeout(() => {
      this.executeCheckCycle().catch(() => {});
    }, 5000);

    // Agenda intervalo contínuo
    this.scheduleNextCheck();
  }

  /**
   * Recarrega configurações do banco
   */
  async reloadConfig() {
    try {
      const { data, error } = await this.supabase
        .from("stream_system_config")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data) {
        this.config = data;
      }
    } catch (err) {
      console.warn("⚠️ [LIVE ENGINE] Falha ao carregar stream_system_config:", err.message);
    }
  }

  /**
   * Agenda próxima verificação
   */
  scheduleNextCheck() {
    if (pollingTimer) clearTimeout(pollingTimer);
    const intervalSec = this.config?.global_polling_interval_seconds || 60;
    pollingTimer = setTimeout(() => {
      this.executeCheckCycle().finally(() => {
        this.scheduleNextCheck();
      });
    }, Math.max(30, intervalSec) * 1000);
  }

  /**
   * Executa um ciclo completo de verificação para todas as contas vinculadas
   */
  async executeCheckCycle() {
    if (isCheckRunning) return;
    isCheckRunning = true;

    try {
      // 1. Busca todas as contas ativas vinculadas
      const { data: accounts, error: accErr } = await this.supabase
        .from("member_stream_accounts")
        .select("*")
        .eq("is_active", true);

      if (accErr || !accounts || accounts.length === 0) {
        isCheckRunning = false;
        return;
      }

      // 2. Busca perfis para enriquecer nome/avatar
      const userIds = [...new Set(accounts.map((a) => a.user_id))];
      const { data: profiles } = await this.supabase
        .from("profiles")
        .select("user_id, nome, nickname, avatar_url, discord_avatar_url, game_id")
        .in("user_id", userIds);

      const profilesMap = new Map((profiles || []).map((p) => [p.user_id, p]));

      // 3. Verifica cada conta
      for (const acc of accounts) {
        const platformCfg = this.config?.platforms?.[acc.platform];
        if (platformCfg && platformCfg.enabled === false) {
          continue; // Plataforma desativada globalmente no painel dev
        }

        try {
          const prof = profilesMap.get(acc.user_id);
          const streamerName = prof?.nickname || prof?.nome || acc.display_name || acc.channel_name;
          const streamerAvatar = prof?.avatar_url || prof?.discord_avatar_url || acc.avatar_url;

          const liveStatus = await checkPlatformStream(acc.platform, acc.channel_name, this.config);
          const stateKey = `${acc.id}`;
          const prevState = streamStateCache.get(stateKey);

          if (liveStatus.isLive) {
            // Live está ONLINE
            streamStateCache.set(stateKey, {
              isLive: true,
              externalStreamId: liveStatus.externalStreamId,
              lastSeenAt: Date.now(),
            });

            // Verifica se já existe sessão ativa registrada com notificação disparada
            const { data: existingSession } = await this.supabase
              .from("stream_sessions")
              .select("id, notification_sent")
              .eq("stream_account_id", acc.id)
              .eq("is_live", true)
              .maybeSingle();

            if (!existingSession) {
              // INÍCIO DE NOVA LIVE! Disparar alertas e gravar sessão
              await this.handleLiveStarted({
                account: acc,
                streamerName,
                streamerAvatar,
                liveData: liveStatus,
              });
            } else {
              // Live continua online: atualiza viewer count e last_checked_at
              await this.supabase
                .from("stream_sessions")
                .update({
                  viewer_count: liveStatus.viewerCount || 0,
                  peak_viewers: Math.max(liveStatus.viewerCount || 0, 0),
                  title: liveStatus.title || undefined,
                  category: liveStatus.category || undefined,
                  thumbnail_url: liveStatus.thumbnailUrl || undefined,
                  last_checked_at: new Date().toISOString(),
                })
                .eq("id", existingSession.id);
            }
          } else {
            // Live está OFFLINE
            if (prevState && prevState.isLive) {
              // Encerramento da live detectado!
              streamStateCache.set(stateKey, { isLive: false, lastSeenAt: Date.now() });

              await this.handleLiveEnded(acc.id, streamerName);
            }
          }
        } catch (itemErr) {
          console.warn(`[LIVE ENGINE] Erro ao verificar conta ${acc.platform}:${acc.channel_name}:`, itemErr.message);
        }
      }
    } catch (cycleErr) {
      console.warn("⚠️ [LIVE ENGINE] Erro no ciclo de verificação:", cycleErr.message);
    } finally {
      isCheckRunning = false;
    }
  }

  /**
   * Processa início de live (gravação, notificação em tempo real e Discord Embed)
   */
  async handleLiveStarted({ account, streamerName, streamerAvatar, liveData }) {
    console.log(`🔴 [LIVE ENGINE] Live Detectada: ${streamerName} está Ao Vivo na ${account.platform}!`);

    const now = new Date().toISOString();

    // 1. Grava a sessão com notification_sent = true para evitar duplicidade
    const sessionPayload = {
      stream_account_id: account.id,
      user_id: account.user_id,
      platform: account.platform,
      channel_name: account.channel_name,
      streamer_name: streamerName,
      streamer_avatar: streamerAvatar,
      title: liveData.title,
      category: liveData.category,
      thumbnail_url: liveData.thumbnailUrl,
      stream_url: liveData.streamUrl || account.channel_url,
      external_stream_id: liveData.externalStreamId || `ext_${Date.now()}`,
      is_live: true,
      started_at: liveData.startedAt || now,
      last_checked_at: now,
      viewer_count: liveData.viewerCount || 1,
      peak_viewers: liveData.viewerCount || 1,
      notification_sent: true,
      notified_at: now,
    };

    const { data: newSession, error: sessErr } = await this.supabase
      .from("stream_sessions")
      .insert(sessionPayload)
      .select()
      .single();

    if (sessErr) {
      console.warn("⚠️ [LIVE ENGINE] Erro ao salvar stream_session:", sessErr.message);
      return;
    }

    // 2. Dispara Notificação In-App no Supabase Realtime (se habilitado)
    if (this.config?.notify_in_app !== false) {
      try {
        const notifPayload = {
          id: `notif_live_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: `${streamerName} está Ao Vivo! 🔴`,
          message: `Transmitindo "${liveData.title || "GTA RP"}" na ${account.platform.toUpperCase()}!`,
          type: "live",
          category: "alert",
          user_id: "all",
          link: "/lives",
          metadata: {
            platform: account.platform,
            streamer_name: streamerName,
            channel_name: account.channel_name,
            title: liveData.title,
            category: liveData.category,
            thumbnail_url: liveData.thumbnailUrl,
            stream_url: liveData.streamUrl || account.channel_url,
          },
          created_at: now,
          read_by: [],
          deleted_by: [],
        };

        // Adiciona à lista de notificações do sistema em role_permissions
        const { data: currentNotifs } = await this.supabase
          .from("role_permissions")
          .select("permissions")
          .eq("level", "system_notifications_data")
          .maybeSingle();

        const list = Array.isArray(currentNotifs?.permissions?.notifications)
          ? currentNotifs.permissions.notifications
          : [];

        const updatedList = [notifPayload, ...list.slice(0, 150)];

        await this.supabase.from("role_permissions").upsert(
          {
            level: "system_notifications_data",
            nivel: "system_notifications_data",
            permissions: { notifications: updatedList },
            updated_at: now,
          },
          { onConflict: "level" }
        );

        // Dispara canal Realtime broadcast para todos os navegadores conectados
        const ch = this.supabase.channel("tw_notifications_realtime_sync");
        await ch.send({
          type: "broadcast",
          event: "notification_broadcast",
          payload: notifPayload,
        });

        // Registro em audit_logs para acionar WAL
        await this.supabase.from("audit_logs").insert({
          action: "send_notification",
          entity: "notifications",
          entity_id: notifPayload.id,
          new_data: notifPayload,
        });
      } catch (notifErr) {
        console.warn("⚠️ [LIVE ENGINE] Erro ao disparar notificação in-app:", notifErr.message);
      }
    }

    // 3. Dispara no Discord (se canal configurado)
    const discordChannelId =
      this.config?.discord_announcements_channel_id ||
      process.env.DISCORD_LIVES_CHANNEL_ID;

    if (discordChannelId && this.discord?.isReady()) {
      try {
        const channel = await this.discord.channels.fetch(discordChannelId).catch(() => null);
        if (channel && channel.isTextBased()) {
          const { EmbedBuilder } = require("discord.js");

          const embed = new EmbedBuilder()
            .setColor(account.platform === "twitch" ? 0x9146ff : account.platform === "kick" ? 0x53fc18 : 0xff0000)
            .setTitle(`🔴 ${streamerName} está Ao Vivo!`)
            .setURL(liveData.streamUrl || account.channel_url)
            .setDescription(`**${liveData.title || "Transmissão ao vivo de GTA RP"}**\n\nVenha acompanhar e apoiar nosso membro da Twin Wheels!`)
            .addFields(
              { name: "Plataforma", value: account.platform.toUpperCase(), inline: true },
              { name: "Categoria", value: liveData.category || "Grand Theft Auto V", inline: true },
              { name: "Link Direto", value: `[Assistir Live](${liveData.streamUrl || account.channel_url})`, inline: true }
            )
            .setTimestamp(new Date());

          if (liveData.thumbnailUrl) {
            embed.setImage(liveData.thumbnailUrl);
          }
          if (streamerAvatar) {
            embed.setThumbnail(streamerAvatar);
          }

          embed.setFooter({
            text: "Twin Wheels RP • Sistema Integrado de Lives",
            iconURL: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
          });

          await channel.send({
            content: `📢 **@everyone** | **${streamerName}** abriu live agora!`,
            embeds: [embed],
          });
        }
      } catch (discErr) {
        console.warn("⚠️ [LIVE ENGINE] Falha ao enviar embed no Discord:", discErr.message);
      }
    }

    // 4. Registra no log de integrações
    try {
      await this.supabase.from("stream_integration_logs").insert({
        platform: account.platform,
        event_type: "live_start",
        status: "success",
        streamer_name: streamerName,
        message: `Live iniciada: "${liveData.title}" na ${account.platform}`,
        details: { liveData, account_id: account.id },
      });
    } catch {}
  }

  /**
   * Processa encerramento de live
   */
  async handleLiveEnded(accountId, streamerName) {
    console.log(`⚫ [LIVE ENGINE] Live Finalizada: ${streamerName} encerrou a transmissão.`);
    const now = new Date().toISOString();

    try {
      await this.supabase
        .from("stream_sessions")
        .update({
          is_live: false,
          ended_at: now,
          updated_at: now,
        })
        .eq("stream_account_id", accountId)
        .eq("is_live", true);

      await this.supabase.from("stream_integration_logs").insert({
        platform: "system",
        event_type: "live_end",
        status: "info",
        streamer_name: streamerName,
        message: `Live finalizada por ${streamerName}`,
      });
    } catch (endErr) {
      console.warn("⚠️ [LIVE ENGINE] Erro ao registrar encerramento de live:", endErr.message);
    }
  }

  /**
   * Disparo imediato manual (chamado via Dev Tools ou Webhook)
   */
  async checkNow() {
    await this.reloadConfig();
    return this.executeCheckCycle();
  }
}

let liveEngineInstance = null;

function initLiveStreamEngine(_supabaseClient, _discordClient) {
  console.log("ℹ️ [LIVE STREAM ENGINE] Motor de transmissões ao vivo desativado para economia de banco de dados.");
  return null;
}

function getLiveStreamEngine() {
  return liveEngineInstance;
}

module.exports = {
  initLiveStreamEngine,
  getLiveStreamEngine,
  checkTwitchLive,
  checkKickLive,
  checkYouTubeLive,
};
