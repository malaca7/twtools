require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
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

// Initialize Discord Client with all required member intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

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
      // Sincroniza também os metadados do Supabase Auth para evitar divergência de sessão
      for (const p of data) {
        if (p.user_id) {
          try {
            await supabase.auth.admin.updateUserById(p.user_id, {
              user_metadata: { avatar_url: newAvatarUrl }
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

    if (error) {
      console.error("[SYNC ERRO] Falha ao buscar perfis:", error.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      return;
    }

    for (const prof of profiles) {
      if (!prof.discord_id) continue;

      try {
        // Busca o usuário mais recente diretamente da API do Discord
        const user = await client.users.fetch(prof.discord_id, { force: true }).catch(() => null);
        if (!user) continue;

        const currentAvatar = user.displayAvatarURL({ extension: "png", forceStatic: false, size: 512 });
        const cleanCurrent = cleanAvatarUrl(currentAvatar);
        const cleanProfDiscord = cleanAvatarUrl(prof.discord_avatar_url);
        const cleanProfAvatar = cleanAvatarUrl(prof.avatar_url);

        // Se o avatar na plataforma for diferente ou nulo, atualiza no Supabase
        if (cleanCurrent && (cleanCurrent !== cleanProfDiscord || cleanCurrent !== cleanProfAvatar)) {
          console.log(`[SYNC Auto] Detectada diferença de avatar para ${user.tag} (${prof.discord_id}). Atualizando...`);
          await updateProfileAvatar(prof.discord_id, currentAvatar, user.tag);
        }
      } catch (err) {
        // Falha transitória com usuário específico
      }

      // Pequeno delay de 150ms para respeitar limites de requisições
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
      console.warn(`[GUILD AVISO] Não foi possível carregar membros do servidor "${guild.name}":`, err.message);
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
      app: "Twin Wheels Sync Bot",
      status: "online",
      botUser: client.user ? client.user.tag : null,
      guilds: client.guilds.cache.size,
      uptimeSeconds: Math.floor(process.uptime()),
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

  console.log(`✅ Twin Wheels Sync Bot iniciado com sucesso como ${client.user.tag}`);
  console.log("⚡ Escutando alterações de avatar em tempo real e agendando sincronização contínua...");

  // Pré-carrega cache de servidores
  await warmUpGuildMembers();

  // Primeira sincronização completa de todos os perfis
  await syncAllProfiles();

  // Sincronização contínua de segurança a cada 30 segundos
  setInterval(syncAllProfiles, 30 * 1000);
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

// 2. Escuta em tempo real: evento guildMemberUpdate do Discord (caso mude avatar no servidor)
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
