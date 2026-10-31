import { supabase } from "@/integrations/supabase/client";
import type { Permission } from "@/lib/permissions";

export type MemberTagRules = {
  // Bloqueios & Restrições Operacionais (Segurança)
  is_blocked?: boolean;
  block_operations?: boolean;
  block_login?: boolean;
  block_sales?: boolean;
  block_movements?: boolean;
  block_productions?: boolean;
  block_cash_fund?: boolean;
  block_escalas?: boolean;

  // Escala de Ação
  can_manage_escalas?: boolean;
  can_view_escalas?: boolean;
  can_participate_escalas?: boolean;

  // Comercial & Vendas
  can_sell?: boolean;
  allow_sales_counter?: boolean;
  max_discount_pct?: number;
  can_reverse_sales?: boolean;
  can_view_all_sales?: boolean;

  // Produções, Armazém & Matérias-Primas
  can_manage_productions?: boolean;
  can_manage_raw_materials?: boolean;
  can_transfer_warehouse?: boolean;
  can_adjust_warehouse_stock?: boolean;
  can_manage_production_recipes?: boolean;

  // Fundo de Caixa & Finanças
  can_deposit_cash_fund?: boolean;
  can_withdraw_cash_fund?: boolean;
  can_view_financial_reports?: boolean;

  // Gestão de Membros & Equipe
  can_manage_members?: boolean;
  can_view_sensitive_data?: boolean;
  can_view_all_tickets?: boolean;
  can_create_announcements?: boolean;

  // Acesso a Painéis Executivos
  can_access_ceo?: boolean;
  can_access_dev?: boolean;
  priority_badge?: boolean;

  // Modo Avançado & Experimental
  is_dev_test?: boolean;
  experimental_features?: boolean;
  show_test_tools?: boolean;
  auto_claim_rewards?: boolean;

  [key: string]: any;
};

/**
 * Converte de forma segura o campo rules recebido do Supabase (JSONB ou string) para MemberTagRules
 */
export function parseMemberTagRules(raw: any): MemberTagRules {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      return {};
    }
  }
  return {};
}

export type MemberTag = {
  id: string; // slug / identifier
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  is_system: boolean;
  is_active: boolean;
  order_index?: number;
  permissions: Permission[];
  rules: MemberTagRules;
  created_at: string;
  updated_at: string;
  assigned_count?: number;
  discord_role_id?: string | null;
  discord_guild_id?: string | null;
  discord_role_name?: string | null;
  discord_sync_enabled?: boolean;
  discord_role_position?: number | null;
};

export type MemberTagAssignment = {
  id: string;
  member_id: string;
  tag_id: string;
  assigned_by?: string | null;
  assigned_at: string;
  tag?: MemberTag;
};

export const CEO_SYSTEM_TAG: MemberTag = {
  id: "ceo",
  name: "CEO",
  description: "Tag Executiva de Diretoria da Twin Wheels. Acesso ao Painel Executivo CEO, métricas e governança.",
  color: "#f59e0b",
  icon: "Crown",
  is_system: true,
  is_active: true,
  order_index: -10,
  permissions: [
    "view_ceo",
    "view_ceo_dashboard",
    "view_ceo_financials",
    "view_ceo_stock_adjustments",
    "view_ceo_notifications",
    "view_ceo_warnings",
    "manage_ceo_warnings",
    "view_all_tickets",
    "view_tickets",
    "view_consolidated_financials",
    "view_cash_fund",
    "manage_cash_fund",
    "view_members",
    "promote_members",
    "edit_members",
  ],
  rules: {
    can_access_ceo: true,
    is_ceo: true,
    can_view_all_tickets: true,
    can_view_financial_reports: true,
    can_manage_members: true,
    can_create_announcements: true,
    can_deposit_cash_fund: true,
    can_withdraw_cash_fund: true,
  },
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  assigned_count: 0,
};

export const DEV_SYSTEM_TAG: MemberTag = {
  id: "dev",
  name: "Desenvolvedor",
  description: "Tag de Engenharia e Acesso Total ao Sistema Twin Wheels. Acesso ao painel Dev Tools e privilégios de desenvolvimento.",
  color: "#f43f5e",
  icon: "Code2",
  is_system: true,
  is_active: true,
  order_index: -20,
  permissions: [],
  rules: {
    can_access_dev: true,
    is_dev_test: true,
    priority_badge: true,
  },
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  assigned_count: 0,
};

export function syncSystemTagsWithPanelTheme(config?: any) {
  try {
    let raw = config;
    if (!raw && typeof window !== "undefined") {
      const stored = localStorage.getItem("tw_dev_module_config_v1");
      if (stored) raw = JSON.parse(stored);
    }
    if (raw) {
      if (raw.devThemeColor) {
        DEV_SYSTEM_TAG.color = raw.devThemeColor;
      }
      if (raw.devPanelIcon) {
        DEV_SYSTEM_TAG.icon = raw.devPanelIcon;
      }
      if (raw.ceoThemeColor) {
        CEO_SYSTEM_TAG.color = raw.ceoThemeColor;
      }
      if (raw.ceoPanelIcon) {
        CEO_SYSTEM_TAG.icon = raw.ceoPanelIcon;
      }
    }
  } catch {}
}

if (typeof window !== "undefined") {
  syncSystemTagsWithPanelTheme();
  window.addEventListener("tw_dev_config_updated", (e: any) => {
    syncSystemTagsWithPanelTheme(e?.detail);
  });
  window.addEventListener("tw_dev_config_updated_v1", (e: any) => {
    syncSystemTagsWithPanelTheme(e?.detail);
  });
  window.addEventListener("storage", () => {
    syncSystemTagsWithPanelTheme();
  });
}

/**
 * Busca todas as tags de membros cadastradas ordenadas por ordem hierárquica (order_index)
 */
export async function getMemberTags(): Promise<MemberTag[]> {
  let tags: any[] = [];
  try {
    const { data, error: tagsErr } = await supabase
      .from("member_tags" as any)
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (!tagsErr && Array.isArray(data) && data.length > 0) {
      tags = data;
    }
  } catch {}

  // Fallback imediato ao Firebase RTDB caso Supabase não retorne ou falhe
  if (tags.length === 0) {
    try {
      const { rtdb } = await import("@/integrations/firebase/rtdb");
      const rtdbList = await rtdb.getList<any>("member_tags");
      if (Array.isArray(rtdbList) && rtdbList.length > 0) {
        tags = rtdbList;
      }
    } catch (e) {
      console.warn("Aviso ao buscar member_tags no RTDB:", e);
    }
  }

  // Busca contagem de atribuições
  const counts: Record<string, number> = {};
  try {
    const { data: assignments, error: assignErr } = await supabase
      .from("member_tag_assignments" as any)
      .select("tag_id");

    if (!assignErr && Array.isArray(assignments) && assignments.length > 0) {
      for (const a of assignments as any[]) {
        counts[a.tag_id] = (counts[a.tag_id] || 0) + 1;
      }
    }
  } catch {}

  if (Object.keys(counts).length === 0) {
    try {
      const { rtdb } = await import("@/integrations/firebase/rtdb");
      const rtdbAssigns = await rtdb.getList<any>("member_tag_assignments");
      if (Array.isArray(rtdbAssigns)) {
        for (const a of rtdbAssigns) {
          if (a && a.tag_id) {
            counts[a.tag_id] = (counts[a.tag_id] || 0) + 1;
          }
        }
      }
    } catch {}
  }

  const mappedTags: MemberTag[] = (tags || [])
    .filter((t: any) => {
      const cleanId = (t.id || "").toLowerCase().trim();
      const cleanName = (t.name || "").toLowerCase().trim();
      // Tag CEO é exclusiva do painel dev em /dev/permissoes
      return cleanId !== "ceo" && cleanName !== "ceo";
    })
    .map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description || null,
      color: t.color || "#3b82f6",
      icon: t.icon || "Tag",
      is_system: Boolean(t.is_system),
      is_active: t.is_active !== false,
      order_index: typeof t.order_index === "number" ? t.order_index : 0,
      permissions: Array.isArray(t.permissions)
        ? t.permissions
        : (t.permissions && typeof t.permissions === "object" ? Object.values(t.permissions) : []),
      rules: parseMemberTagRules(t.rules),
      created_at: t.created_at || new Date().toISOString(),
      updated_at: t.updated_at || new Date().toISOString(),
      assigned_count: counts[t.id] || 0,
      discord_role_id: t.discord_role_id || null,
      discord_guild_id: t.discord_guild_id || null,
      discord_role_name: t.discord_role_name || null,
      discord_sync_enabled: t.discord_sync_enabled !== false,
      discord_role_position: t.discord_role_position !== undefined ? t.discord_role_position : null,
    }))
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  return mappedTags;
}

/**
 * Busca todas as atribuições de tags aos membros
 */
export async function getMemberTagAssignments(): Promise<MemberTagAssignment[]> {
  try {
    const { data, error } = await supabase
      .from("member_tag_assignments" as any)
      .select("*")
      .order("assigned_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      return (data || []).map((d: any) => ({
        id: d.id,
        member_id: d.member_id || d.user_id,
        tag_id: d.tag_id,
        assigned_by: d.assigned_by,
        assigned_at: d.assigned_at,
      }));
    }

    // Fallback de ultra-baixa latência ao Firebase RTDB
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const rtdbList = await rtdb.getList<any>("member_tag_assignments");
    if (Array.isArray(rtdbList) && rtdbList.length > 0) {
      return rtdbList
        .filter((r) => r && (r.member_id || r.user_id) && r.tag_id)
        .map((r: any) => ({
          id: r.id || `${r.member_id || r.user_id}_${r.tag_id}`,
          member_id: r.member_id || r.user_id,
          tag_id: r.tag_id,
          assigned_by: r.assigned_by || null,
          assigned_at: r.created_at || r.assigned_at || new Date().toISOString(),
        }));
    }

    return (data || []).map((d: any) => ({
      id: d.id,
      member_id: d.member_id || d.user_id,
      tag_id: d.tag_id,
      assigned_by: d.assigned_by,
      assigned_at: d.assigned_at,
    }));
  } catch (err) {
    console.error("Erro ao buscar member_tag_assignments:", err);
    return [];
  }
}

/**
 * Busca as tags de um membro específico
 */
export async function getMemberTagsForMember(memberId: string): Promise<MemberTag[]> {
  let mappedTags: any[] = [];
  try {
    const { data, error } = await supabase
      .from("member_tag_assignments" as any)
      .select("tag_id, member_tags (*)")
      .eq("member_id", memberId);

    if (!error && Array.isArray(data) && data.length > 0) {
      mappedTags = data.map((d: any) => d.member_tags).filter(Boolean);

      if (mappedTags.length === 0 && data.length > 0) {
        const tagIds = Array.from(new Set(data.map((d: any) => d.tag_id).filter(Boolean)));
        if (tagIds.length > 0) {
          const { data: directTags } = await supabase
            .from("member_tags" as any)
            .select("*")
            .in("id", tagIds);
          if (Array.isArray(directTags)) {
            mappedTags = directTags;
          }
        }
      }
    }
  } catch {}

  // Fallback de ultra-baixa latência com Firebase RTDB
  if (mappedTags.length === 0) {
    try {
      const [allTags, allAssignments] = await Promise.all([
        getMemberTags(),
        getMemberTagAssignments(),
      ]);

      const cleanMemberId = String(memberId || "").trim().toLowerCase();
      const myTagIds = new Set<string>();
      for (const a of allAssignments) {
        const mId = String(a.member_id || "").trim().toLowerCase();
        const uId = String((a as any).user_id || "").trim().toLowerCase();
        if ((mId && mId === cleanMemberId) || (uId && uId === cleanMemberId)) {
          myTagIds.add(String(a.tag_id || "").trim().toLowerCase());
        }
      }

      mappedTags = allTags.filter((t) => {
        const cleanId = String(t.id).trim().toLowerCase();
        const cleanName = String(t.name || "").trim().toLowerCase();
        return (myTagIds.has(cleanId) || myTagIds.has(cleanName)) && t.is_active !== false;
      });
    } catch {}
  }

  const cleanMid = String(memberId || "").trim().toLowerCase();
  const hasCeoAssignment = mappedTags.some((t: any) => t.id === "ceo" || t.name?.toLowerCase().trim() === "ceo");
  if (!hasCeoAssignment) {
    try {
      const assignments = await getMemberTagAssignments();
      const hasCeoInAssign = assignments.some((a) => {
        const mid = String(a.member_id || (a as any).user_id || "").toLowerCase().trim();
        const tid = String(a.tag_id || "").toLowerCase().trim();
        return mid === cleanMid && tid === "ceo";
      });
      if (hasCeoInAssign) {
        mappedTags.push(CEO_SYSTEM_TAG);
      }
    } catch {}
  }

  const hasDevAssignment = mappedTags.some(
    (t: any) => t.id === "dev" || t.id === "desenvolvedor" || t.name?.toLowerCase().trim() === "desenvolvedor" || t.name?.toLowerCase().trim() === "dev"
  );
  if (!hasDevAssignment) {
    try {
      const assignments = await getMemberTagAssignments();
      const hasDevInAssign = assignments.some((a) => {
        const mid = String(a.member_id || (a as any).user_id || "").toLowerCase().trim();
        const tid = String(a.tag_id || "").toLowerCase().trim();
        return mid === cleanMid && (tid === "dev" || tid === "desenvolvedor");
      });
      if (hasDevInAssign) {
        mappedTags.push(DEV_SYSTEM_TAG);
      }
    } catch {}
  }

  return mappedTags
    .filter((t: any) => t && t.is_active !== false)
    .map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      color: t.color || "#3b82f6",
      icon: t.icon || "Tag",
      is_system: Boolean(t.is_system),
      is_active: t.is_active !== false,
      order_index: typeof t.order_index === "number" ? t.order_index : 0,
      permissions: Array.isArray(t.permissions)
        ? t.permissions
        : (t.permissions && typeof t.permissions === "object" ? Object.values(t.permissions) : []),
      rules: parseMemberTagRules(t.rules),
      created_at: t.created_at,
      updated_at: t.updated_at,
      discord_role_id: t.discord_role_id || null,
      discord_guild_id: t.discord_guild_id || null,
      discord_role_name: t.discord_role_name || null,
      discord_sync_enabled: t.discord_sync_enabled !== false,
      discord_role_position: t.discord_role_position !== undefined ? t.discord_role_position : null,
    }))
    .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

/**
 * Cria ou atualiza uma tag
 */
export async function saveMemberTag(tag: {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  is_active?: boolean;
  order_index?: number;
  permissions?: Permission[];
  rules?: MemberTagRules;
  is_system?: boolean;
  discord_role_id?: string | null;
  discord_guild_id?: string | null;
  discord_role_name?: string | null;
  discord_sync_enabled?: boolean;
  discord_role_position?: number | null;
}): Promise<MemberTag> {
  const cleanId = tag.id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_");
  if (!cleanId) throw new Error("Identificador (slug) da tag é obrigatório.");
  if (!tag.name.trim()) throw new Error("Nome da tag é obrigatório.");

  const safeRules = parseMemberTagRules(tag.rules);
  const now = new Date().toISOString();

  const payload: any = {
    id: cleanId,
    name: tag.name.trim(),
    description: tag.description?.trim() || null,
    color: tag.color.trim() || "#3b82f6",
    icon: tag.icon.trim() || "Tag",
    updated_at: now,
  };

  if (tag.is_active !== undefined) payload.is_active = tag.is_active;
  if (tag.order_index !== undefined) payload.order_index = tag.order_index;
  if (tag.permissions !== undefined) payload.permissions = tag.permissions;
  if (tag.rules !== undefined) payload.rules = safeRules;
  if (tag.is_system !== undefined) payload.is_system = tag.is_system;
  if (tag.discord_role_id !== undefined) payload.discord_role_id = tag.discord_role_id;
  if (tag.discord_guild_id !== undefined) payload.discord_guild_id = tag.discord_guild_id;
  if (tag.discord_role_name !== undefined) payload.discord_role_name = tag.discord_role_name;
  if (tag.discord_sync_enabled !== undefined) payload.discord_sync_enabled = tag.discord_sync_enabled;
  if (tag.discord_role_position !== undefined) payload.discord_role_position = tag.discord_role_position;

  // 1. Sempre grava imediatamente no Firebase RTDB (zero latência e persistência garantida)
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set(`member_tags/${cleanId}`, payload).catch(() => {});
    await rtdb.set("system_realtime_events/latest", {
      type: "member_tags",
      tagId: cleanId,
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}

  // 2. Persiste no Supabase
  let savedData: any = payload;
  try {
    const { data, error } = await supabase
      .from("member_tags" as any)
      .upsert(payload, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (!error && data) {
      savedData = data;
    } else if (error) {
      console.warn("Aviso ao salvar member_tag no Supabase (salvo no RTDB):", error.message);
    }
  } catch (err: any) {
    console.warn("Exceção ao salvar member_tag no Supabase (salvo no RTDB):", err?.message);
  }

  // 3. Notifica em tempo real
  try {
    const { broadcastPermissionsRealtimeUpdate } = await import("@/lib/permissionsRealtimeSync");
    void broadcastPermissionsRealtimeUpdate({
      type: "member_tags",
      tagId: cleanId,
    });
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("tw_auth_reload", {
        detail: {
          type: "member_tags",
          tagId: cleanId,
          timestamp: Date.now(),
        },
      })
    );
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new CustomEvent("tw_member_tags_updated", { detail: { tag: cleanId } }));
    window.dispatchEvent(new Event("tw_permissions_synced"));
  }

  return {
    id: savedData.id,
    name: savedData.name,
    description: savedData.description,
    color: savedData.color,
    icon: savedData.icon,
    is_system: Boolean(savedData.is_system),
    is_active: savedData.is_active !== false,
    order_index: typeof savedData.order_index === "number" ? savedData.order_index : 0,
    permissions: Array.isArray(savedData.permissions) ? savedData.permissions : [],
    rules: parseMemberTagRules(savedData.rules),
    created_at: savedData.created_at || now,
    updated_at: savedData.updated_at || now,
    discord_role_id: savedData.discord_role_id || null,
    discord_guild_id: savedData.discord_guild_id || null,
    discord_role_name: savedData.discord_role_name || null,
    discord_sync_enabled: savedData.discord_sync_enabled !== false,
    discord_role_position: savedData.discord_role_position !== undefined ? savedData.discord_role_position : null,
  };
}

/**
 * Atualiza a ordenação sequencial de todas as tags (ordem hierárquica)
 */
export async function updateMemberTagsOrder(orderedTagIds: string[]): Promise<void> {
  if (!orderedTagIds || orderedTagIds.length === 0) return;

  const now = new Date().toISOString();
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    for (let i = 0; i < orderedTagIds.length; i++) {
      await rtdb.update(`member_tags/${orderedTagIds[i]}`, {
        order_index: i,
        updated_at: now,
      }).catch(() => {});
    }
    await rtdb.set("system_realtime_events/latest", {
      type: "member_tags",
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}

  try {
    const { error } = await (supabase.rpc as any)("reorder_member_tags", {
      p_tag_ids: orderedTagIds,
    });

    if (error) {
      for (let i = 0; i < orderedTagIds.length; i++) {
        await supabase
          .from("member_tags" as any)
          .update({ order_index: i, updated_at: now })
          .eq("id", orderedTagIds[i]);
      }
    }
  } catch {}

  try {
    const { broadcastPermissionsRealtimeUpdate } = await import("@/lib/permissionsRealtimeSync");
    void broadcastPermissionsRealtimeUpdate({
      type: "member_tags",
    });
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
  }
}

/**
 * Atualiza apenas as permissões e regras de uma tag (usado pelo CEO e DEV)
 */
export async function updateTagPermissionsAndRules(
  tagId: string,
  permissions: Permission[],
  rules: MemberTagRules
): Promise<void> {
  const safeRules = parseMemberTagRules(rules);
  const updatedAt = new Date().toISOString();

  // 1. Salva imediatamente no Firebase RTDB (fonte em tempo real com ultra-alta disponibilidade)
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.update(`member_tags/${tagId}`, {
      permissions,
      rules: safeRules,
      updated_at: updatedAt,
    }).catch(() => {});
    await rtdb.set("system_realtime_events/latest", {
      type: "tags_updated",
      tag: tagId,
      tagId,
      timestamp: Date.now(),
    }).catch(() => {});
  } catch (e) {
    console.warn("Aviso ao salvar permissões da tag no RTDB:", e);
  }

  // 2. Persiste no Supabase
  try {
    const { error } = await supabase
      .from("member_tags" as any)
      .update({
        permissions,
        rules: safeRules,
        updated_at: updatedAt,
      })
      .eq("id", tagId);

    if (error) {
      console.warn("Aviso ao atualizar permissões da tag no Supabase (persistido via RTDB):", error.message);
    }
  } catch (e: any) {
    console.warn("Exceção ao atualizar permissões da tag no Supabase:", e?.message);
  }

  // 3. Notifica em tempo real canais e janelas
  try {
    const { broadcastPermissionsRealtimeUpdate } = await import("@/lib/permissionsRealtimeSync");
    void broadcastPermissionsRealtimeUpdate({
      type: "tags_updated",
      tag: tagId,
    });
  } catch {}

  try {
    const { broadcastTicketsRealtimeUpdate } = await import("@/lib/app-api");
    broadcastTicketsRealtimeUpdate();
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("tw_auth_reload", {
        detail: {
          type: "tags_updated",
          tag: tagId,
          timestamp: Date.now(),
        },
      })
    );
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new CustomEvent("tw_member_tags_updated", { detail: { tag: tagId } }));
    window.dispatchEvent(new Event("tw_permissions_synced"));
    window.dispatchEvent(new Event("tw_tickets_updated"));
  }
}

/**
 * Alterna rapidamente se a tag é Tag de Sistema (visível no perfil do membro) ou Interna
 */
export async function toggleMemberTagSystem(tagId: string, isSystem: boolean): Promise<void> {
  const updatedAt = new Date().toISOString();

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.update(`member_tags/${tagId}`, {
      is_system: isSystem,
      updated_at: updatedAt,
    }).catch(() => {});
    await rtdb.set("system_realtime_events/latest", {
      type: "member_tags",
      tagId,
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}

  try {
    await supabase
      .from("member_tags" as any)
      .update({
        is_system: isSystem,
        updated_at: updatedAt,
      })
      .eq("id", tagId);
  } catch {}

  try {
    const { broadcastPermissionsRealtimeUpdate } = await import("@/lib/permissionsRealtimeSync");
    void broadcastPermissionsRealtimeUpdate({
      type: "member_tags",
      tagId,
    });
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
  }
}

/**
 * Remove uma tag (com limpeza segura de vínculos)
 */
export async function deleteMemberTag(tagId: string): Promise<void> {
  // 1. Limpa no Firebase RTDB
  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.remove(`member_tags/${tagId}`).catch(() => {});
    const list = await rtdb.getList<any>("member_tag_assignments");
    for (const item of list) {
      if (item && item.tag_id === tagId) {
        const key = item._key || item.id || `${item.member_id}_${item.tag_id}`;
        await rtdb.remove(`member_tag_assignments/${key}`).catch(() => {});
      }
    }
    await rtdb.set("system_realtime_events/latest", {
      type: "member_tags",
      tagId,
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}

  // 2. Limpa no Supabase
  try {
    await supabase.from("member_tag_assignments" as any).delete().eq("tag_id", tagId);
    await supabase.from("member_tags" as any).delete().eq("id", tagId);
  } catch {}

  try {
    const { broadcastPermissionsRealtimeUpdate } = await import("@/lib/permissionsRealtimeSync");
    void broadcastPermissionsRealtimeUpdate({
      type: "member_tags",
      tagId,
    });
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
    window.dispatchEvent(new Event("tw_permissions_synced"));
  }
}

/**
 * Sincronização automática em background com o Discord ao alterar tags de membros
 */
export async function triggerAutoDiscordTagSync(
  memberId: string,
  tagId: string,
  action: "add" | "remove"
): Promise<void> {
  try {
    const [{ data: tagData }, { data: profData }] = await Promise.all([
      supabase
        .from("member_tags" as any)
        .select("id, name, discord_role_id, discord_guild_id, discord_sync_enabled")
        .eq("id", tagId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, user_id, nome, nickname, discord_id")
        .or(`id.eq.${memberId},user_id.eq.${memberId}`)
        .maybeSingle(),
    ]);

    if (!tagData || !profData) return;
    const tag = tagData as any;
    if (tag.discord_sync_enabled === false || !tag.discord_role_id || !tag.discord_guild_id) return;
    if (!profData.discord_id || profData.discord_id.trim().length < 5) return;

    const { syncMemberDiscordTagRole } = await import("@/services/discordTagService");
    await syncMemberDiscordTagRole({
      discordId: profData.discord_id.trim(),
      guildId: tag.discord_guild_id,
      roleId: tag.discord_role_id,
      action,
      tagId: tag.id,
      tagName: tag.name,
      memberName: profData.nickname || profData.nome,
    });
  } catch (err: any) {
    console.warn("[MemberTagsService] Auto Discord sync em background falhou:", err.message);
  }
}

/**
 * Alterna a atribuição de uma tag a um membro com suporte explícito a remoção/adição
 */
export async function toggleMemberTagAssignment(
  memberId: string,
  tagId: string,
  assignedBy?: string,
  active?: boolean,
  candidateIds?: string[]
): Promise<{ assigned: boolean }> {
  const allIds = Array.from(new Set([memberId, ...(candidateIds || [])].filter(Boolean)));
  let isAssigned = false;

  const { data, error } = await supabase.rpc("toggle_member_tag_rpc" as any, {
    p_member_id: memberId,
    p_user_id: memberId,
    p_tag_id: tagId,
    p_assigned_by: assignedBy || null,
    p_active: active,
  });

  if (!error && data && (data as any).assigned !== undefined) {
    isAssigned = Boolean((data as any).assigned);
  } else if (active !== undefined) {
    isAssigned = active;
  } else {
    // Consulta status atual se não foi explicitamente fornecido
    const { data: existing } = await supabase
      .from("member_tag_assignments" as any)
      .select("id")
      .eq("tag_id", tagId)
      .or(allIds.map((id) => `member_id.eq.${id},user_id.eq.${id}`).join(","))
      .maybeSingle();
    isAssigned = !existing;
  }

  // Executa garantia direta em Supabase e Firebase RTDB
  if (!isAssigned) {
    // DESVINCULAR (Remover de todas as tabelas)
    for (const uid of allIds) {
      await supabase
        .from("member_tag_assignments" as any)
        .delete()
        .eq("tag_id", tagId)
        .eq("member_id", uid);
      await supabase
        .from("member_tag_assignments" as any)
        .delete()
        .eq("tag_id", tagId)
        .eq("user_id", uid);
    }
    try {
      const { rtdb } = await import("@/integrations/firebase/rtdb");
      const list = await rtdb.getList<any>("member_tag_assignments");
      for (const item of list) {
        if (
          item &&
          item.tag_id === tagId &&
          (allIds.includes(item.member_id) || allIds.includes(item.user_id) || allIds.includes(item.id))
        ) {
          const key = item._key || item.id || `${item.member_id || item.user_id}_${item.tag_id}`;
          await rtdb.remove(`member_tag_assignments/${key}`);
        }
      }
      for (const uid of allIds) {
        await rtdb.remove(`member_tag_assignments/${uid}_${tagId}`);
      }
    } catch {}

    if (tagId === "ceo") {
      try {
        const { toggleMemberCeoTag } = await import("@/services/devService");
        await toggleMemberCeoTag(memberId, false);
      } catch {}
    }
    if (tagId === "dev" || tagId === "desenvolvedor") {
      try {
        const { toggleMemberDevTag } = await import("@/services/devService");
        await toggleMemberDevTag(memberId, false);
      } catch {}
    }
  } else {
    // VINCULAR (Inserir / Atualizar)
    const primaryId = memberId || allIds[0];
    const assignId = `${primaryId}_${tagId}`;
    const assignData = {
      id: assignId,
      member_id: primaryId,
      user_id: primaryId,
      tag_id: tagId,
      assigned_by: assignedBy || null,
      created_at: new Date().toISOString(),
    };
    await (supabase.from("member_tag_assignments" as any)).upsert(assignData, { onConflict: "id" });
    try {
      const { rtdb } = await import("@/integrations/firebase/rtdb");
      await rtdb.set(`member_tag_assignments/${assignId}`, assignData);
    } catch {}

    if (tagId === "ceo") {
      try {
        const { toggleMemberCeoTag } = await import("@/services/devService");
        await toggleMemberCeoTag(memberId, true);
      } catch {}
    }
    if (tagId === "dev" || tagId === "desenvolvedor") {
      try {
        const { toggleMemberDevTag } = await import("@/services/devService");
        await toggleMemberDevTag(memberId, true);
      } catch {}
    }
  }

  // Sincronização Discord em background
  void triggerAutoDiscordTagSync(memberId, tagId, isAssigned ? "add" : "remove");

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set("system_realtime_events/latest", {
      type: "tag_toggle",
      tag: tagId,
      status: isAssigned,
      userId: memberId,
      candidateIds: allIds,
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}

  try {
    const { broadcastPermissionsRealtimeUpdate } = await import("@/lib/permissionsRealtimeSync");
    void broadcastPermissionsRealtimeUpdate({
      type: "tag_toggle",
      tag: tagId,
      status: isAssigned,
      userId: memberId,
      candidateIds: allIds,
    });
  } catch {}

  try {
    const { broadcastTicketsRealtimeUpdate } = await import("@/lib/app-api");
    broadcastTicketsRealtimeUpdate();
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("tw_auth_reload", {
        detail: {
          type: "tag_toggle",
          tag: tagId,
          status: isAssigned,
          userId: memberId,
          candidateIds: allIds,
        },
      })
    );
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
    window.dispatchEvent(new Event("tw_permissions_synced"));
    window.dispatchEvent(new Event("tw_tickets_updated"));
  }

  return { assigned: isAssigned };
}

/**
 * Define o conjunto exato de tags de um membro
 */
export async function setMemberTags(
  memberId: string,
  tagIds: string[],
  assignedBy?: string
): Promise<void> {
  const { data: previous } = await supabase
    .from("member_tag_assignments" as any)
    .select("tag_id")
    .eq("member_id", memberId);

  const prevTagIds = (previous || []).map((p: any) => p.tag_id);
  const removedTagIds = prevTagIds.filter((t: string) => !tagIds.includes(t));
  const addedTagIds = tagIds.filter((t: string) => !prevTagIds.includes(t));

  const { error } = await supabase.rpc("set_member_tags_rpc" as any, {
    p_member_id: memberId,
    p_user_id: memberId,
    p_tag_ids: tagIds,
    p_assigned_by: assignedBy || null,
  });

  if (error) {
    await supabase
      .from("member_tag_assignments" as any)
      .delete()
      .eq("member_id", memberId);

    if (tagIds.length > 0) {
      await supabase.from("member_tag_assignments" as any).insert(
        tagIds.map((t) => ({
          member_id: memberId,
          user_id: memberId,
          tag_id: t,
          assigned_by: assignedBy || null,
        }))
      );
    }
  }

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const list = await rtdb.getList<any>("member_tag_assignments");
    for (const item of list) {
      if (item && (item.member_id === memberId || item.user_id === memberId)) {
        const key = item._key || item.id || `${item.member_id}_${item.tag_id}`;
        await rtdb.remove(`member_tag_assignments/${key}`);
      }
    }
    for (const t of tagIds) {
      const assignId = `${memberId}_${t}`;
      await rtdb.set(`member_tag_assignments/${assignId}`, {
        id: assignId,
        member_id: memberId,
        user_id: memberId,
        tag_id: t,
        assigned_by: assignedBy || null,
        created_at: new Date().toISOString(),
      });
    }
  } catch {}

  for (const tid of removedTagIds) {
    void triggerAutoDiscordTagSync(memberId, tid, "remove");
    if (tid === "ceo") {
      try {
        const { toggleMemberCeoTag } = await import("@/services/devService");
        await toggleMemberCeoTag(memberId, false);
      } catch {}
    }
    if (tid === "dev" || tid === "desenvolvedor") {
      try {
        const { toggleMemberDevTag } = await import("@/services/devService");
        await toggleMemberDevTag(memberId, false);
      } catch {}
    }
  }
  for (const tid of addedTagIds) {
    void triggerAutoDiscordTagSync(memberId, tid, "add");
    if (tid === "ceo") {
      try {
        const { toggleMemberCeoTag } = await import("@/services/devService");
        await toggleMemberCeoTag(memberId, true);
      } catch {}
    }
    if (tid === "dev" || tid === "desenvolvedor") {
      try {
        const { toggleMemberDevTag } = await import("@/services/devService");
        await toggleMemberDevTag(memberId, true);
      } catch {}
    }
  }

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set("system_realtime_events/latest", {
      type: "tags_updated",
      userId: memberId,
      candidateIds: [memberId],
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}

  try {
    const { broadcastPermissionsRealtimeUpdate } = await import("@/lib/permissionsRealtimeSync");
    void broadcastPermissionsRealtimeUpdate({
      type: "tags_updated",
      userId: memberId,
      candidateIds: [memberId],
    });
  } catch {}

  try {
    const { broadcastTicketsRealtimeUpdate } = await import("@/lib/app-api");
    broadcastTicketsRealtimeUpdate();
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
    window.dispatchEvent(new Event("tw_permissions_synced"));
    window.dispatchEvent(new Event("tw_tickets_updated"));
  }
}

/**
 * Define em lote os membros vinculados a uma tag
 */
export async function setTagMembers(
  tagId: string,
  memberIds: string[],
  assignedBy?: string
): Promise<void> {
  const { data: previous } = await supabase
    .from("member_tag_assignments" as any)
    .select("member_id")
    .eq("tag_id", tagId);

  const prevMemberIds = (previous || []).map((p: any) => p.member_id);
  const removedMemberIds = prevMemberIds.filter((m: string) => !memberIds.includes(m));
  const addedMemberIds = memberIds.filter((m: string) => !prevMemberIds.includes(m));

  const { error } = await supabase.rpc("set_tag_members_rpc" as any, {
    p_tag_id: tagId,
    p_member_ids: memberIds,
    p_user_ids: memberIds,
    p_assigned_by: assignedBy || null,
  });

  if (error) {
    await supabase
      .from("member_tag_assignments" as any)
      .delete()
      .eq("tag_id", tagId);

    if (memberIds.length > 0) {
      await supabase.from("member_tag_assignments" as any).insert(
        memberIds.map((m) => ({
          member_id: m,
          user_id: m,
          tag_id: tagId,
          assigned_by: assignedBy || null,
        }))
      );
    }
  }

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    const list = await rtdb.getList<any>("member_tag_assignments");
    for (const item of list) {
      if (item && item.tag_id === tagId) {
        const key = item._key || item.id || `${item.member_id}_${item.tag_id}`;
        await rtdb.remove(`member_tag_assignments/${key}`);
      }
    }
    for (const m of memberIds) {
      const assignId = `${m}_${tagId}`;
      await rtdb.set(`member_tag_assignments/${assignId}`, {
        id: assignId,
        member_id: m,
        user_id: m,
        tag_id: tagId,
        assigned_by: assignedBy || null,
        created_at: new Date().toISOString(),
      });
    }
  } catch {}

  for (const mid of removedMemberIds) {
    void triggerAutoDiscordTagSync(mid, tagId, "remove");
    if (tagId === "ceo") {
      try {
        const { toggleMemberCeoTag } = await import("@/services/devService");
        await toggleMemberCeoTag(mid, false);
      } catch {}
    }
    if (tagId === "dev" || tagId === "desenvolvedor") {
      try {
        const { toggleMemberDevTag } = await import("@/services/devService");
        await toggleMemberDevTag(mid, false);
      } catch {}
    }
  }
  for (const mid of addedMemberIds) {
    void triggerAutoDiscordTagSync(mid, tagId, "add");
    if (tagId === "ceo") {
      try {
        const { toggleMemberCeoTag } = await import("@/services/devService");
        await toggleMemberCeoTag(mid, true);
      } catch {}
    }
    if (tagId === "dev" || tagId === "desenvolvedor") {
      try {
        const { toggleMemberDevTag } = await import("@/services/devService");
        await toggleMemberDevTag(mid, true);
      } catch {}
    }
  }

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set("system_realtime_events/latest", {
      type: "tag_toggle",
      tag: tagId,
      candidateIds: memberIds,
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}

  try {
    const { broadcastPermissionsRealtimeUpdate } = await import("@/lib/permissionsRealtimeSync");
    void broadcastPermissionsRealtimeUpdate({
      type: "tag_toggle",
      tag: tagId,
      candidateIds: memberIds,
    });
  } catch {}

  try {
    const { broadcastTicketsRealtimeUpdate } = await import("@/lib/app-api");
    broadcastTicketsRealtimeUpdate();
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
    window.dispatchEvent(new Event("tw_permissions_synced"));
    window.dispatchEvent(new Event("tw_tickets_updated"));
  }
}

/**
 * Atribui uma tag específica a um membro (se ainda não possuir)
 */
export async function assignMemberTag(
  memberId: string,
  tagId: string,
  assignedBy?: string
): Promise<void> {
  const { data: existing } = await supabase
    .from("member_tag_assignments" as any)
    .select("id")
    .eq("member_id", memberId)
    .eq("tag_id", tagId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("member_tag_assignments" as any).insert({
      member_id: memberId,
      tag_id: tagId,
      assigned_by: assignedBy || null,
    });
    void triggerAutoDiscordTagSync(memberId, tagId, "add");

    if (tagId === "ceo") {
      try {
        const { toggleMemberCeoTag } = await import("@/services/devService");
        await toggleMemberCeoTag(memberId, true);
      } catch {}
    }
    if (tagId === "dev" || tagId === "desenvolvedor") {
      try {
        const { toggleMemberDevTag } = await import("@/services/devService");
        await toggleMemberDevTag(memberId, true);
      } catch {}
    }

    try {
      const { rtdb } = await import("@/integrations/firebase/rtdb");
      await rtdb.set("system_realtime_events/latest", {
        type: "tag_toggle",
        tag: tagId,
        status: true,
        userId: memberId,
        candidateIds: [memberId],
        timestamp: Date.now(),
      }).catch(() => {});
    } catch {}

    try {
      const { broadcastPermissionsRealtimeUpdate } = await import("@/lib/permissionsRealtimeSync");
      void broadcastPermissionsRealtimeUpdate({
        type: "tag_toggle",
        tag: tagId,
        status: true,
        userId: memberId,
        candidateIds: [memberId],
      });
    } catch {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("tw_auth_reload", {
          detail: {
            type: "tag_toggle",
            tag: tagId,
            status: true,
            userId: memberId,
            candidateIds: [memberId],
          },
        })
      );
      window.dispatchEvent(new Event("tw_tags_updated"));
      window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
      window.dispatchEvent(new Event("tw_permissions_synced"));
    }
  }
}

/**
 * Remove a atribuição de uma tag de um membro
 */
export async function removeMemberTagAssignment(
  memberId: string,
  tagId: string
): Promise<void> {
  await supabase
    .from("member_tag_assignments" as any)
    .delete()
    .eq("member_id", memberId)
    .eq("tag_id", tagId);

  void triggerAutoDiscordTagSync(memberId, tagId, "remove");

  if (tagId === "ceo") {
    try {
      const { toggleMemberCeoTag } = await import("@/services/devService");
      await toggleMemberCeoTag(memberId, false);
    } catch {}
  }
  if (tagId === "dev" || tagId === "desenvolvedor") {
    try {
      const { toggleMemberDevTag } = await import("@/services/devService");
      await toggleMemberDevTag(memberId, false);
    } catch {}
  }

  try {
    const { rtdb } = await import("@/integrations/firebase/rtdb");
    await rtdb.set("system_realtime_events/latest", {
      type: "tag_toggle",
      tag: tagId,
      status: false,
      userId: memberId,
      candidateIds: [memberId],
      timestamp: Date.now(),
    }).catch(() => {});
  } catch {}

  try {
    const { broadcastPermissionsRealtimeUpdate } = await import("@/lib/permissionsRealtimeSync");
    void broadcastPermissionsRealtimeUpdate({
      type: "tag_toggle",
      tag: tagId,
      status: false,
      userId: memberId,
      candidateIds: [memberId],
    });
  } catch {}

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("tw_auth_reload", {
        detail: {
          type: "tag_toggle",
          tag: tagId,
          status: false,
          userId: memberId,
          candidateIds: [memberId],
        },
      })
    );
    window.dispatchEvent(new Event("tw_tags_updated"));
    window.dispatchEvent(new CustomEvent("tw_member_tags_updated"));
    window.dispatchEvent(new Event("tw_permissions_synced"));
  }
}

