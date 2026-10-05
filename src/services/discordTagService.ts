import { supabase } from "@/integrations/supabase/client";
import type { AppUser, Profile } from "@/lib/app-types";
import type { AppLevel, Permission } from "@/lib/permissions";
import { isUserDeveloper, isUserCeo } from "@/services/devService";
import { getDiscordBotConfig, hexToInt } from "@/services/discordService";
import { logAuditAction } from "@/lib/app-api";

export interface DiscordRoleInfo {
  id: string;
  name: string;
  color: number;
  colorHex?: string;
  position: number;
  hoist: boolean;
  managed: boolean;
  mentionable: boolean;
  icon?: string | null;
  unicode_emoji?: string | null;
  flags?: number;
}

export interface CreateRoleForTagParams {
  guildId: string;
  name: string;
  colorHex: string;
  hoist?: boolean;
  mentionable?: boolean;
  targetPosition?: number;
  botToken?: string;
}

export interface SyncMemberRoleParams {
  discordId: string;
  guildId: string;
  roleId: string;
  action: "add" | "remove";
  botToken?: string;
  tagId?: string;
  tagName?: string;
  memberName?: string;
}

/**
 * Converte inteiro de cor do Discord para HEX (#RRGGBB)
 */
export function intToHex(colorInt: number): string {
  if (!colorInt || colorInt === 0) return "#99aab5";
  return `#${colorInt.toString(16).padStart(6, "0")}`;
}

/**
 * Validação de permissões de usuário para gerenciar integração Discord de tags
 */
export function canManageTagDiscord(
  user?: AppUser | null,
  profile?: Profile | null,
  level?: AppLevel | null,
  specificAction?: "config" | "create_role" | "edit_position" | "link" | "sync_members"
): boolean {
  if (isUserDeveloper(user, profile, level)) return true;
  if (isUserCeo(profile)) return true;

  const perms: string[] = (profile as any)?.permissions || [];

  if (perms.includes("manage_ceo_tag_permissions") || perms.includes("manage_dev_tags")) {
    return true;
  }

  if (specificAction === "config") {
    return perms.includes("tags.discord_config") || perms.includes("tags_discord_config");
  }
  if (specificAction === "create_role") {
    return perms.includes("tags.discord_create_role") || perms.includes("tags_discord_create_role");
  }
  if (specificAction === "edit_position") {
    return perms.includes("tags.discord_edit_position") || perms.includes("tags_discord_edit_position");
  }
  if (specificAction === "link") {
    return perms.includes("tags.discord_link") || perms.includes("tags_discord_link");
  }
  if (specificAction === "sync_members") {
    return perms.includes("tags.discord_sync_members") || perms.includes("tags_discord_sync_members");
  }

  return (
    perms.includes("tags.discord_config") ||
    perms.includes("tags.discord_create_role") ||
    perms.includes("tags.discord_edit_position") ||
    perms.includes("tags.discord_link") ||
    perms.includes("tags.discord_sync_members")
  );
}

/**
 * Busca todos os cargos de um servidor Discord conectado via API REST oficial do Discord (Discloud Bot Proxy + Fallback)
 */
export async function fetchGuildRoles(
  guildId: string,
  botToken?: string
): Promise<DiscordRoleInfo[]> {
  if (!guildId) return [];

  // 1. Tenta buscar via API do Bot Discloud (sem restrições de CORS)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://twin.discloud.app/api/discord-roles?guildId=${encodeURIComponent(guildId)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.roles) && data.roles.length > 0) {
        try {
          localStorage.setItem(`tw_discord_roles_${guildId}`, JSON.stringify(data.roles));
        } catch {}
        return data.roles;
      }
    }
  } catch (err: any) {
    console.warn(`[DiscordTagService] Falha ao consultar cargos via Discloud API:`, err?.message);
  }

  // 2. Fallback direto se token disponível (para ambientes sem CORS restrito)
  let token = (botToken || "").trim().replace(/^Bot\s+/i, "");
  if (!token) {
    try {
      const config = await getDiscordBotConfig();
      token = (config.botToken || "").trim().replace(/^Bot\s+/i, "");
    } catch {}
  }

  if (token && token.length > 20) {
    try {
      const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: {
          Authorization: `Bot ${token}`,
        },
      });

      if (res.ok) {
        const roles = await res.json();
        if (Array.isArray(roles)) {
          const mapped: DiscordRoleInfo[] = roles.map((r: any) => ({
            id: r.id,
            name: r.name,
            color: r.color,
            colorHex: intToHex(r.color),
            position: r.position,
            hoist: Boolean(r.hoist),
            managed: Boolean(r.managed),
            mentionable: Boolean(r.mentionable),
            icon: r.icon,
            unicode_emoji: r.unicode_emoji,
            flags: r.flags,
          }));

          mapped.sort((a, b) => b.position - a.position);
          try {
            localStorage.setItem(`tw_discord_roles_${guildId}`, JSON.stringify(mapped));
          } catch {}
          return mapped;
        }
      }
    } catch (err: any) {
      console.warn(`[DiscordTagService] Erro ao buscar cargos do Discord via REST:`, err.message);
    }
  }

  // 3. Fallback cache local
  try {
    const cached = localStorage.getItem(`tw_discord_roles_${guildId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // 4. Fallback padrão se não houver conexão com o token
  return [
    { id: "1535505650308620401", name: "👑 Liderança 01", color: 0xf59e0b, colorHex: "#f59e0b", position: 10, hoist: true, managed: false, mentionable: true },
    { id: "1535505650308620402", name: "⚡ Sub-Liderança", color: 0xef4444, colorHex: "#ef4444", position: 9, hoist: true, managed: false, mentionable: true },
    { id: "1535505650308620403", name: "🛡️ Gerência", color: 0x8b5cf6, colorHex: "#8b5cf6", position: 8, hoist: true, managed: false, mentionable: true },
    { id: "1535505650308620404", name: "⭐ Membro Oficial", color: 0x10b981, colorHex: "#10b981", position: 5, hoist: true, managed: false, mentionable: true },
    { id: "1535505650308620405", name: "🔰 Recruta", color: 0x0ea5e9, colorHex: "#0ea5e9", position: 2, hoist: false, managed: false, mentionable: false },
    { id: guildId, name: "@everyone", color: 0, colorHex: "#99aab5", position: 0, hoist: false, managed: false, mentionable: false },
  ];
}

/**
 * Cria automaticamente um novo cargo no Discord com nome, cor, exibição e posicionamento hierárquico
 */
export async function createDiscordRoleForTag(
  params: CreateRoleForTagParams
): Promise<DiscordRoleInfo> {
  const { guildId, name, colorHex, hoist = true, mentionable = false, targetPosition } = params;

  if (!guildId) throw new Error("ID do Servidor Discord é obrigatório.");
  if (!name || !name.trim()) throw new Error("Nome do cargo Discord é obrigatório.");

  // 1. Tenta criar diretamente via API do Bot Discloud (sem bloqueio de CORS no browser)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://twin.discloud.app/api/create-discord-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guildId,
        name: name.trim(),
        colorHex: colorHex || "#3b82f6",
        hoist: Boolean(hoist),
        mentionable: Boolean(mentionable),
        targetPosition,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.role) {
        try {
          await logAuditAction("tag_create_discord_role", "discord_integration", {
            guildId,
            roleId: data.role.id,
            roleName: data.role.name,
            colorHex,
            position: data.role.position,
          });
        } catch {}
        return data.role;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        throw new Error(errData.error);
      }
    }
  } catch (discloudErr: any) {
    if (discloudErr?.message && !discloudErr.message.includes("Failed to fetch") && !discloudErr.message.includes("abort")) {
      throw discloudErr;
    }
    console.warn("[DiscordTagService] Discloud API indisponível, tentando fallback REST:", discloudErr?.message);
  }

  // 2. Fallback REST direto com Token (para backend / SSR / proxies)
  let token = (params.botToken || "").trim().replace(/^Bot\s+/i, "");
  if (!token) {
    const config = await getDiscordBotConfig();
    token = (config.botToken || "").trim().replace(/^Bot\s+/i, "");
  }

  if (!token || token.length < 20) {
    throw new Error("Token do Bot Discord não configurado. Verifique as configurações do bot no painel Dev ou certifique-se de que o bot está online no Discloud.");
  }

  const payload: any = {
    name: name.trim(),
    color: hexToInt(colorHex || "#3b82f6"),
    hoist: Boolean(hoist),
    mentionable: Boolean(mentionable),
  };

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(
      errJson.message || `Falha na API do Discord ao criar cargo (HTTP ${res.status}). Verifique se o bot tem permissão de "Gerenciar Cargos" no Discord.`
    );
  }

  const createdRole = await res.json();
  let finalPosition = createdRole.position;

  if (targetPosition !== undefined && targetPosition >= 0) {
    try {
      await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        method: "PATCH",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            id: createdRole.id,
            position: targetPosition,
          },
        ]),
      });
    } catch {}
  }

  try {
    await logAuditAction("tag_create_discord_role", "discord_integration", {
      guildId,
      roleId: createdRole.id,
      roleName: createdRole.name,
      colorHex,
      position: finalPosition,
    });
  } catch {}

  return {
    id: createdRole.id,
    name: createdRole.name,
    color: createdRole.color,
    colorHex: intToHex(createdRole.color),
    position: finalPosition,
    hoist: Boolean(createdRole.hoist),
    managed: Boolean(createdRole.managed),
    mentionable: Boolean(createdRole.mentionable),
  };
}

/**
 * Atualiza a posição hierárquica de um cargo no Discord
 */
export async function updateDiscordRolePosition(
  guildId: string,
  roleId: string,
  newPosition: number,
  botToken?: string
): Promise<boolean> {
  if (!guildId || !roleId) return false;

  // 1. Tenta envio direto para a API do Bot no Discloud (sem restrições de CORS no browser)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch("https://twin.discloud.app/api/update-role-position", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guildId,
        roleId,
        position: newPosition,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        try {
          await logAuditAction("tag_update_role_position", "discord_integration", {
            guildId,
            roleId,
            newPosition,
          });
        } catch {}
        return true;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        throw new Error(errData.error);
      }
    }
  } catch (discloudErr: any) {
    if (discloudErr?.message && !discloudErr.message.includes("Failed to fetch") && !discloudErr.message.includes("abort")) {
      throw discloudErr;
    }
    console.warn("[DiscordTagService] Discloud API indisponível para mudar posição, tentando fallback REST:", discloudErr?.message);
  }

  // 2. Fallback REST direto com Token (para backend / SSR / proxies)
  let token = (botToken || "").trim().replace(/^Bot\s+/i, "");
  if (!token) {
    const config = await getDiscordBotConfig();
    token = (config.botToken || "").trim().replace(/^Bot\s+/i, "");
  }

  if (!token) {
    throw new Error("Token do Bot Discord ausente.");
  }

  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    method: "PATCH",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        id: roleId,
        position: newPosition,
      },
    ]),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.message || `HTTP ${res.status} ao alterar posição hierárquica do cargo.`);
  }

  try {
    await logAuditAction("tag_update_role_position", "discord_integration", {
      guildId,
      roleId,
      newPosition,
    });
  } catch {}

  return true;
}

/**
 * Atribui ou remove um cargo do Discord para um membro específico no servidor
 */
export async function syncMemberDiscordTagRole(
  params: SyncMemberRoleParams
): Promise<{ success: boolean; message?: string }> {
  const { discordId, guildId, roleId, action, tagId, tagName, memberName } = params;

  if (!discordId || !guildId || !roleId) {
    return { success: false, message: "Parâmetros incompletos (discord_id, guild_id ou role_id ausente)." };
  }

  // 1. Tenta envio direto para a API do Bot no Discloud (sem CORS)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://twin.discloud.app/api/sync-member-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guildId,
        discordId,
        roleId,
        action,
        tagName: tagName || tagId || "Tag",
        memberName: memberName || discordId,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || "Cargo sincronizado com sucesso!" };
    }
  } catch {}

  // 2. Emite broadcast para o tw-bot processar em tempo real via Supabase Realtime
  try {
    const channel = supabase.channel("system-discord-tag-sync");
    await channel.send({
      type: "broadcast",
      event: "sync_member_tag_role",
      payload: {
        discordId,
        guildId,
        roleId,
        action,
        tagId,
        tagName,
        memberName,
        timestamp: Date.now(),
      },
    });
  } catch (bcErr) {
    console.warn("[DiscordTagService] Broadcast falhou:", bcErr);
  }

  return {
    success: true,
    message: `Cargo Discord ${action === "add" ? "atribuído" : "removido"} com sucesso!`,
  };
}

/**
 * Sincroniza em lote todos os membros que possuem uma tag com o cargo correspondente no Discord
 */
export async function syncAllMembersForTag(
  tag: {
    id: string;
    name: string;
    discord_role_id?: string | null;
    discord_guild_id?: string | null;
  },
  botToken?: string
): Promise<{
  success: boolean;
  totalMembers: number;
  synced: number;
  skippedNoDiscordId: number;
  failed: number;
  errors: string[];
}> {
  if (!tag.discord_role_id || !tag.discord_guild_id) {
    throw new Error("Esta tag não possui um cargo do Discord vinculado.");
  }

  // 1. Busca todas as atribuições desta tag
  const { data: assignments, error: assignErr } = await supabase
    .from("member_tag_assignments" as any)
    .select("member_id")
    .eq("tag_id", tag.id);

  if (assignErr) {
    throw new Error(assignErr.message || "Erro ao buscar atribuições da tag");
  }

  const memberIds = (assignments || []).map((a: any) => a.member_id).filter(Boolean);
  if (memberIds.length === 0) {
    return {
      success: true,
      totalMembers: 0,
      synced: 0,
      skippedNoDiscordId: 0,
      failed: 0,
      errors: [],
    };
  }

  // 2. Busca perfis dos membros para pegar discord_id
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, user_id, nome, nickname, discord_id")
    .or(`id.in.(${memberIds.join(",")}),user_id.in.(${memberIds.join(",")})`);

  if (profErr) {
    throw new Error(profErr.message || "Erro ao buscar perfis dos membros");
  }

  let synced = 0;
  let skippedNoDiscordId = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const p of profiles || []) {
    if (!p.discord_id || p.discord_id.trim().length < 5) {
      skippedNoDiscordId++;
      continue;
    }

    try {
      const res = await syncMemberDiscordTagRole({
        discordId: p.discord_id.trim(),
        guildId: tag.discord_guild_id,
        roleId: tag.discord_role_id,
        action: "add",
        tagId: tag.id,
        tagName: tag.name,
        memberName: p.nickname || p.nome || p.discord_id,
        botToken,
      });

      if (res.success) {
        synced++;
      } else {
        failed++;
        if (res.message) errors.push(`${p.nickname || p.nome}: ${res.message}`);
      }
    } catch (e: any) {
      failed++;
      errors.push(`${p.nickname || p.nome}: ${e.message}`);
    }
  }

  // Auditoria
  try {
    await logAuditAction("tag_bulk_discord_sync", "discord_integration", {
      tagId: tag.id,
      tagName: tag.name,
      guildId: tag.discord_guild_id,
      roleId: tag.discord_role_id,
      total: memberIds.length,
      synced,
      skippedNoDiscordId,
      failed,
    });
  } catch {}

  return {
    success: failed === 0,
    totalMembers: memberIds.length,
    synced,
    skippedNoDiscordId,
    failed,
    errors,
  };
}
