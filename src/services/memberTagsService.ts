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

/**
 * Busca todas as tags de membros cadastradas ordenadas por ordem hierárquica (order_index)
 */
export async function getMemberTags(): Promise<MemberTag[]> {
  const { data: tags, error: tagsErr } = await supabase
    .from("member_tags" as any)
    .select("*")
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (tagsErr) {
    console.error("Erro ao buscar member_tags:", tagsErr);
    throw new Error(tagsErr.message || "Erro ao carregar tags de membros");
  }

  // Busca contagem de atribuições
  const { data: assignments, error: assignErr } = await supabase
    .from("member_tag_assignments" as any)
    .select("tag_id");

  const counts: Record<string, number> = {};
  if (!assignErr && Array.isArray(assignments)) {
    for (const a of assignments as any[]) {
      counts[a.tag_id] = (counts[a.tag_id] || 0) + 1;
    }
  }

  return (tags || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    description: t.description || null,
    color: t.color || "#3b82f6",
    icon: t.icon || "Tag",
    is_system: Boolean(t.is_system),
    is_active: t.is_active !== false,
    order_index: typeof t.order_index === "number" ? t.order_index : 0,
    permissions: Array.isArray(t.permissions) ? t.permissions : [],
    rules: parseMemberTagRules(t.rules),
    created_at: t.created_at,
    updated_at: t.updated_at,
    assigned_count: counts[t.id] || 0,
    discord_role_id: t.discord_role_id || null,
    discord_guild_id: t.discord_guild_id || null,
    discord_role_name: t.discord_role_name || null,
    discord_sync_enabled: t.discord_sync_enabled !== false,
    discord_role_position: t.discord_role_position !== undefined ? t.discord_role_position : null,
  }));
}

/**
 * Busca todas as atribuições de tags aos membros
 */
export async function getMemberTagAssignments(): Promise<MemberTagAssignment[]> {
  const { data, error } = await supabase
    .from("member_tag_assignments" as any)
    .select("*")
    .order("assigned_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar member_tag_assignments:", error);
    return [];
  }

  return (data || []).map((d: any) => ({
    id: d.id,
    member_id: d.member_id,
    tag_id: d.tag_id,
    assigned_by: d.assigned_by,
    assigned_at: d.assigned_at,
  }));
}

/**
 * Busca as tags de um membro específico
 */
export async function getMemberTagsForMember(memberId: string): Promise<MemberTag[]> {
  const { data, error } = await supabase
    .from("member_tag_assignments" as any)
    .select("tag_id, member_tags (*)")
    .eq("member_id", memberId);

  if (error || !data || !Array.isArray(data)) {
    return [];
  }

  let mappedTags = data
    .map((d: any) => d.member_tags)
    .filter(Boolean);

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

  return mappedTags
    .filter((t: any) => t.is_active !== false)
    .map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      color: t.color || "#3b82f6",
      icon: t.icon || "Tag",
      is_system: Boolean(t.is_system),
      is_active: t.is_active !== false,
      order_index: typeof t.order_index === "number" ? t.order_index : 0,
      permissions: Array.isArray(t.permissions) ? t.permissions : [],
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

  const payload: any = {
    id: cleanId,
    name: tag.name.trim(),
    description: tag.description?.trim() || null,
    color: tag.color.trim() || "#3b82f6",
    icon: tag.icon.trim() || "Tag",
    updated_at: new Date().toISOString(),
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

  const { data, error } = await supabase
    .from("member_tags" as any)
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar member_tag:", error);
    throw new Error(error.message || "Erro ao salvar tag");
  }

  return {
    id: (data as any).id,
    name: (data as any).name,
    description: (data as any).description,
    color: (data as any).color,
    icon: (data as any).icon,
    is_system: Boolean((data as any).is_system),
    is_active: (data as any).is_active !== false,
    order_index: typeof (data as any).order_index === "number" ? (data as any).order_index : 0,
    permissions: Array.isArray((data as any).permissions) ? (data as any).permissions : [],
    rules: parseMemberTagRules((data as any).rules),
    created_at: (data as any).created_at,
    updated_at: (data as any).updated_at,
    discord_role_id: (data as any).discord_role_id || null,
    discord_guild_id: (data as any).discord_guild_id || null,
    discord_role_name: (data as any).discord_role_name || null,
    discord_sync_enabled: (data as any).discord_sync_enabled !== false,
    discord_role_position: (data as any).discord_role_position !== undefined ? (data as any).discord_role_position : null,
  };
}

/**
 * Atualiza a ordenação sequencial de todas as tags (ordem hierárquica)
 */
export async function updateMemberTagsOrder(orderedTagIds: string[]): Promise<void> {
  if (!orderedTagIds || orderedTagIds.length === 0) return;

  const { error } = await (supabase.rpc as any)("reorder_member_tags", {
    p_tag_ids: orderedTagIds,
  });

  if (error) {
    console.warn("RPC reorder_member_tags falhou, aplicando fallback direto:", error.message);
    const now = new Date().toISOString();
    for (let i = 0; i < orderedTagIds.length; i++) {
      await supabase
        .from("member_tags" as any)
        .update({ order_index: i, updated_at: now })
        .eq("id", orderedTagIds[i]);
    }
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
  const { error } = await supabase
    .from("member_tags" as any)
    .update({
      permissions,
      rules: safeRules,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tagId);

  if (error) {
    console.error("Erro ao atualizar permissões e regras da tag:", error);
    throw new Error(error.message || "Erro ao salvar permissões e regras da tag");
  }
}

/**
 * Remove uma tag
 */
export async function deleteMemberTag(tagId: string): Promise<void> {
  const { error } = await supabase
    .from("member_tags" as any)
    .delete()
    .eq("id", tagId);

  if (error) {
    console.error("Erro ao excluir tag:", error);
    throw new Error(error.message || "Erro ao remover tag");
  }
}

/**
 * Sincronização automática em background com o Discord ao alterar tags de membros
 */
async function triggerAutoDiscordTagSync(
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
 * Alterna a atribuição de uma tag a um membro
 */
export async function toggleMemberTagAssignment(
  memberId: string,
  tagId: string,
  assignedBy?: string
): Promise<{ assigned: boolean }> {
  let isAssigned = false;
  const { data, error } = await supabase.rpc("toggle_member_tag_rpc" as any, {
    p_member_id: memberId,
    p_tag_id: tagId,
    p_assigned_by: assignedBy || null,
  });

  if (error) {
    // Fallback manual se RPC falhar
    const { data: existing } = await supabase
      .from("member_tag_assignments" as any)
      .select("id")
      .eq("member_id", memberId)
      .eq("tag_id", tagId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("member_tag_assignments" as any)
        .delete()
        .eq("member_id", memberId)
        .eq("tag_id", tagId);
      isAssigned = false;
    } else {
      await supabase.from("member_tag_assignments" as any).insert({
        member_id: memberId,
        tag_id: tagId,
        assigned_by: assignedBy || null,
      });
      isAssigned = true;
    }
  } else {
    isAssigned = Boolean((data as any)?.assigned);
  }

  // Dispara sincronização automática com o Discord em background
  void triggerAutoDiscordTagSync(memberId, tagId, isAssigned ? "add" : "remove");

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
  // Busca tags anteriores para sincronizar remoções
  const { data: previous } = await supabase
    .from("member_tag_assignments" as any)
    .select("tag_id")
    .eq("member_id", memberId);

  const prevTagIds = (previous || []).map((p: any) => p.tag_id);
  const removedTagIds = prevTagIds.filter((t: string) => !tagIds.includes(t));
  const addedTagIds = tagIds.filter((t: string) => !prevTagIds.includes(t));

  const { error } = await supabase.rpc("set_member_tags_rpc" as any, {
    p_member_id: memberId,
    p_tag_ids: tagIds,
    p_assigned_by: assignedBy || null,
  });

  if (error) {
    // Fallback direto
    await supabase
      .from("member_tag_assignments" as any)
      .delete()
      .eq("member_id", memberId);

    if (tagIds.length > 0) {
      await supabase.from("member_tag_assignments" as any).insert(
        tagIds.map((t) => ({
          member_id: memberId,
          tag_id: t,
          assigned_by: assignedBy || null,
        }))
      );
    }
  }

  // Sincroniza adições e remoções no Discord
  for (const tid of removedTagIds) {
    void triggerAutoDiscordTagSync(memberId, tid, "remove");
  }
  for (const tid of addedTagIds) {
    void triggerAutoDiscordTagSync(memberId, tid, "add");
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
    p_assigned_by: assignedBy || null,
  });

  if (error) {
    // Fallback direto
    await supabase
      .from("member_tag_assignments" as any)
      .delete()
      .eq("tag_id", tagId);

    if (memberIds.length > 0) {
      await supabase.from("member_tag_assignments" as any).insert(
        memberIds.map((m) => ({
          member_id: m,
          tag_id: tagId,
          assigned_by: assignedBy || null,
        }))
      );
    }
  }

  // Sincroniza adições e remoções no Discord
  for (const mid of removedMemberIds) {
    void triggerAutoDiscordTagSync(mid, tagId, "remove");
  }
  for (const mid of addedMemberIds) {
    void triggerAutoDiscordTagSync(mid, tagId, "add");
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
}

