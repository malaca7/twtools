import { supabase } from "@/integrations/supabase/client";
import type {
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  MessageReaction,
  CreateGroupPayload,
  UpdateGroupPayload,
  ParticipantRole,
} from "@/types/chat";
import type { Member, UserPresenceStatus } from "@/lib/app-types";

// In-memory cache for profiles & presences (30s TTL) to accelerate fallback rendering
let _cachedMembersMap: Map<string, Member> | null = null;
let _cachedMembersMapAt = 0;

/**
 * Busca e mapeia todos os membros com status de presença e cargo hierárquico em cache local.
 */
export async function fetchChatMembersMap(force = false): Promise<Map<string, Member>> {
  const now = Date.now();
  if (!force && _cachedMembersMap && now - _cachedMembersMapAt < 30000) {
    return _cachedMembersMap;
  }

  const membersMap = new Map<string, Member>();

  try {
    const [profilesRes, rolesRes, presencesRes] = await Promise.all([
      supabase.from("profiles" as any).select("*"),
      supabase.from("user_roles" as any).select("user_id, nivel"),
      supabase.from("user_presence" as any).select("user_id, status, online_since, total_seconds_online"),
    ]);

    const rolesMap = new Map<string, string>();
    (rolesRes.data || []).forEach((r: any) => rolesMap.set(r.user_id, r.nivel));

    const presenceMap = new Map<string, any>();
    (presencesRes.data || []).forEach((p: any) => presenceMap.set(p.user_id, p));

    (profilesRes.data || []).forEach((d: any) => {
      const pres = presenceMap.get(d.user_id);
      const roleNivel = rolesMap.get(d.user_id) || "novato";
      const memberObj: Member = {
        user_id: d.user_id,
        nome: d.nome || "Membro",
        nickname: d.nickname || null,
        telefone: d.telefone ?? null,
        game_id: d.game_id ?? null,
        status: d.status || "ativo",
        data_entrada: String(d.data_entrada || ""),
        created_at: String(d.created_at || ""),
        nivel: roleNivel,
        presence_status: pres?.status || "offline",
        online_since: pres?.online_since || null,
        total_seconds_online: pres?.total_seconds_online || 0,
        discord_id: d.discord_id || null,
        discord_username: d.discord_username || null,
        discord_avatar_url: d.discord_avatar_url || d.avatar_url || null,
        discord_email: d.discord_email || null,
        is_developer: Boolean(d.is_developer || roleNivel === "desenvolvedor" || d.discord_id === "917826984778797087"),
      };
      membersMap.set(d.user_id, memberObj);
    });

    _cachedMembersMap = membersMap;
    _cachedMembersMapAt = now;
  } catch (err) {
    console.warn("Erro ao carregar mapa de membros do chat:", err);
  }

  return membersMap;
}

/**
 * Busca todas as conversas do usuário autenticado (privadas e grupos) via RPC ultra-rápida.
 */
export async function fetchUserConversations(currentUserId: string): Promise<ChatConversation[]> {
  if (!currentUserId) return [];

  // 1. EXECUÇÃO VIA RPC ULTRA-RÁPIDA (Retorna todo o payload em 1 única requisição < 100ms)
  try {
    const { data, error } = await (supabase.rpc as any)("rpc_get_user_conversations", {
      p_user_id: currentUserId,
    });

    if (!error && Array.isArray(data)) {
      return data as ChatConversation[];
    }
  } catch (rpcErr) {
    console.warn("Fallback de conversas por RPC:", rpcErr);
  }

  // 2. FALLBACK PARALELO (Caso a RPC falhe)
  try {
    const { data: myParticipations, error: partError } = await supabase
      .from("chat_participants" as any)
      .select("conversation_id, last_read_at, role, is_muted, custom_nickname")
      .eq("user_id", currentUserId);

    if (partError || !myParticipations || myParticipations.length === 0) {
      return [];
    }

    const conversationIds = myParticipations.map((p: any) => p.conversation_id);
    const myReadMap = new Map<string, string>();
    const myRoleMap = new Map<string, any>();
    myParticipations.forEach((p: any) => {
      myReadMap.set(p.conversation_id, p.last_read_at || new Date(0).toISOString());
      myRoleMap.set(p.conversation_id, p.role || "member");
    });

    const [convsRes, allPartsRes, membersMap] = await Promise.all([
      supabase
        .from("chat_conversations" as any)
        .select("*")
        .in("id", conversationIds)
        .order("last_message_at", { ascending: false }),
      supabase
        .from("chat_participants" as any)
        .select("*")
        .in("conversation_id", conversationIds),
      fetchChatMembersMap(),
    ]);

    if (convsRes.error) throw convsRes.error;

    const partsByConv = new Map<string, ChatParticipant[]>();
    (allPartsRes.data || []).forEach((p: any) => {
      const list = partsByConv.get(p.conversation_id) || [];
      const prof = membersMap.get(p.user_id) || null;
      list.push({
        id: p.id,
        conversation_id: p.conversation_id,
        user_id: p.user_id,
        role: p.role || "member",
        joined_at: p.joined_at,
        last_read_at: p.last_read_at,
        is_muted: Boolean(p.is_muted),
        custom_nickname: p.custom_nickname || null,
        profile: prof,
      });
      partsByConv.set(p.conversation_id, list);
    });

    return (convsRes.data || []).map((c: any) => {
      const parts = partsByConv.get(c.id) || [];
      let otherParticipant: Member | null = null;
      if (c.type === "private") {
        const otherPart = parts.find((p) => p.user_id !== currentUserId);
        otherParticipant = otherPart?.profile || (otherPart ? membersMap.get(otherPart.user_id) : null) || null;
      }

      return {
        id: c.id,
        type: c.type,
        title: c.title,
        description: c.description,
        avatar_url: c.avatar_url,
        created_by: c.created_by,
        only_admins_can_post: Boolean(c.only_admins_can_post),
        is_archived: Boolean(c.is_archived),
        settings: c.settings || {},
        created_at: c.created_at,
        updated_at: c.updated_at,
        last_message: c.last_message,
        last_message_at: c.last_message_at || c.created_at,
        last_message_sender_id: c.last_message_sender_id,
        participants: parts,
        unread_count: 0,
        other_participant: otherParticipant,
        my_role: (c.created_by === currentUserId || myRoleMap.get(c.id) === "admin") ? "admin" : (myRoleMap.get(c.id) || "member"),
      };
    });
  } catch (err) {
    console.error("Erro no fallback de conversas:", err);
    return [];
  }
}

/**
 * Cria ou recupera uma conversa privada 1:1 entre dois membros.
 */
export async function getOrCreatePrivateConversation(
  currentUserId: string,
  targetUserId: string
): Promise<ChatConversation> {
  if (currentUserId === targetUserId) {
    throw new Error("Você não pode iniciar uma conversa consigo mesmo.");
  }

  // 1. Procura se já existe uma conversa privada entre esses dois membros
  const { data: myConvs } = await supabase
    .from("chat_participants" as any)
    .select("conversation_id")
    .eq("user_id", currentUserId);

  if (myConvs && myConvs.length > 0) {
    const myConvIds = myConvs.map((p: any) => p.conversation_id);
    const { data: targetConvs } = await supabase
      .from("chat_participants" as any)
      .select("conversation_id")
      .eq("user_id", targetUserId)
      .in("conversation_id", myConvIds);

    if (targetConvs && targetConvs.length > 0) {
      const commonConvIds = targetConvs.map((p: any) => p.conversation_id);
      const { data: existingPrivate } = await supabase
        .from("chat_conversations" as any)
        .select("*")
        .in("id", commonConvIds)
        .eq("type", "private")
        .maybeSingle();

      if (existingPrivate) {
        const convs = await fetchUserConversations(currentUserId);
        const found = convs.find((c) => c.id === existingPrivate.id);
        if (found) return found;
      }
    }
  }

  // 2. Se não encontrou, cria uma nova conversa privada
  const { data: newConv, error: convError } = await supabase
    .from("chat_conversations" as any)
    .insert({
      type: "private",
      created_by: currentUserId,
    })
    .select()
    .single();

  if (convError || !newConv) throw convError || new Error("Erro ao criar conversa privada.");

  // 3. Insere ambos os participantes
  await supabase.from("chat_participants" as any).insert([
    { conversation_id: newConv.id, user_id: currentUserId, role: "admin" },
    { conversation_id: newConv.id, user_id: targetUserId, role: "member" },
  ]);

  const convs = await fetchUserConversations(currentUserId);
  return convs.find((c) => c.id === newConv.id)!;
}

/**
 * Cria um novo grupo de chat com os membros selecionados.
 */
export async function createGroupConversation(
  creatorId: string,
  payload: CreateGroupPayload
): Promise<ChatConversation> {
  const { title, description, avatar_url, only_admins_can_post, participant_ids } = payload;
  if (!title.trim()) throw new Error("Informe o nome do grupo.");

  const uniqueParticipants = Array.from(new Set([creatorId, ...participant_ids]));

  // 1. Cria a conversa do grupo
  const { data: newConv, error: convError } = await supabase
    .from("chat_conversations" as any)
    .insert({
      type: "group",
      title: title.trim(),
      description: description?.trim() || null,
      avatar_url: avatar_url || null,
      created_by: creatorId,
      only_admins_can_post: Boolean(only_admins_can_post),
      last_message: "Grupo criado",
      last_message_at: new Date().toISOString(),
      last_message_sender_id: creatorId,
    })
    .select()
    .single();

  if (convError || !newConv) throw convError || new Error("Erro ao criar grupo.");

  // 2. Insere participantes com criador como admin
  const participantRows = uniqueParticipants.map((uid) => ({
    conversation_id: newConv.id,
    user_id: uid,
    role: uid === creatorId ? "admin" : "member",
    joined_at: new Date().toISOString(),
    last_read_at: new Date().toISOString(),
  }));

  const { error: partError } = await supabase
    .from("chat_participants" as any)
    .insert(participantRows);

  if (partError) throw partError;

  // 3. Insere mensagem do sistema
  await supabase.from("chat_messages" as any).insert({
    conversation_id: newConv.id,
    sender_id: creatorId,
    content: `🎉 Grupo "${title.trim()}" criado.`,
    message_type: "system",
    status: "delivered",
  });

  const convs = await fetchUserConversations(creatorId);
  return convs.find((c) => c.id === newConv.id)!;
}

/**
 * Busca o histórico de mensagens de uma conversa com reações, respostas e paginação via RPC ultra-rápida.
 */
export async function fetchMessages(
  conversationId: string,
  limit = 60,
  beforeCreatedAt?: string
): Promise<ChatMessage[]> {
  if (!conversationId) return [];

  // 1. EXECUÇÃO VIA RPC ULTRA-RÁPIDA (Retorna mensagens, reações e replies em < 80ms)
  try {
    const { data, error } = await (supabase.rpc as any)("rpc_get_conversation_messages", {
      p_conversation_id: conversationId,
      p_limit: limit,
      p_before: beforeCreatedAt || null,
    });

    if (!error && Array.isArray(data)) {
      return data as ChatMessage[];
    }
  } catch (rpcErr) {
    console.warn("Fallback de mensagens por RPC:", rpcErr);
  }

  // 2. FALLBACK PARALELO
  try {
    let query = supabase
      .from("chat_messages" as any)
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (beforeCreatedAt) {
      query = query.lt("created_at", beforeCreatedAt);
    }

    const [messagesRes, membersMap] = await Promise.all([
      query,
      fetchChatMembersMap(),
    ]);

    if (messagesRes.error) throw messagesRes.error;
    const rawMessages = messagesRes.data || [];

    if (rawMessages.length === 0) return [];

    const messageIds = rawMessages.map((m: any) => m.id);

    const { data: reactionsData } = await supabase
      .from("chat_message_reactions" as any)
      .select("*")
      .in("message_id", messageIds);

    const reactionsByMsg = new Map<string, MessageReaction[]>();
    (reactionsData || []).forEach((r: any) => {
      const list = reactionsByMsg.get(r.message_id) || [];
      const prof = membersMap.get(r.user_id);
      list.push({
        id: r.id,
        message_id: r.message_id,
        user_id: r.user_id,
        emoji: r.emoji,
        created_at: r.created_at,
        user_name: prof?.nickname || prof?.nome || "Membro",
      });
      reactionsByMsg.set(r.message_id, list);
    });

    return rawMessages.map((m: any) => {
      const prof = membersMap.get(m.sender_id);
      return {
        id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        sender_name: prof?.nickname || prof?.nome || "Membro",
        sender_avatar: prof?.discord_avatar_url || null,
        content: m.content,
        status: m.status || "sent",
        message_type: m.message_type || "text",
        reply_to_id: m.reply_to_id,
        attachment_url: m.attachment_url,
        attachment_name: m.attachment_name,
        attachment_type: m.attachment_type,
        attachment_size: m.attachment_size,
        mentions: m.mentions || [],
        reactions: reactionsByMsg.get(m.id) || [],
        is_edited: Boolean(m.is_edited),
        is_deleted: Boolean(m.is_deleted),
        deleted_for_users: m.deleted_for_users || [],
        created_at: m.created_at,
        updated_at: m.updated_at,
      };
    });
  } catch (err) {
    console.error("Erro no fallback de mensagens:", err);
    return [];
  }
}

/**
 * Envia uma nova mensagem no chat.
 */
export async function sendChatMessage(
  conversationId: string,
  content: string,
  options?: {
    messageType?: "text" | "image" | "video" | "audio" | "document" | "system";
    replyToId?: string | null;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentType?: string | null;
    attachmentSize?: number | null;
    mentions?: string[];
  }
): Promise<ChatMessage> {
  const { data, error } = await (supabase.rpc as any)("rpc_send_chat_message", {
    p_conversation_id: conversationId,
    p_content: content,
    p_message_type: options?.messageType || "text",
    p_reply_to_id: options?.replyToId || null,
    p_attachment_url: options?.attachmentUrl || null,
    p_attachment_name: options?.attachmentName || null,
    p_attachment_type: options?.attachmentType || null,
    p_attachment_size: options?.attachmentSize || null,
    p_mentions: options?.mentions || [],
  });

  if (error) throw error;
  return data as ChatMessage;
}

/**
 * Adiciona ou remove uma reação com emoji em uma mensagem.
 */
export async function toggleMessageReaction(
  messageId: string,
  emoji: string
): Promise<{ success: boolean; action: "added" | "removed" }> {
  const { data, error } = await (supabase.rpc as any)("rpc_toggle_message_reaction", {
    p_message_id: messageId,
    p_emoji: emoji,
  });

  if (error) throw error;
  return data as any;
}

/**
 * Edita o texto de uma mensagem enviada.
 */
export async function editChatMessage(messageId: string, newContent: string): Promise<void> {
  const { error } = await (supabase.rpc as any)("rpc_edit_chat_message", {
    p_message_id: messageId,
    p_new_content: newContent,
  });

  if (error) throw error;
}

/**
 * Exclui uma mensagem (para si mesmo ou para todos).
 */
export async function deleteChatMessage(messageId: string, forEveryone = false): Promise<void> {
  const { error } = await (supabase.rpc as any)("rpc_delete_chat_message", {
    p_message_id: messageId,
    p_for_everyone: forEveryone,
  });

  if (error) throw error;
}

/**
 * Marca todas as mensagens de uma conversa como lidas pelo usuário atual.
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  if (!conversationId || !userId) return;

  const now = new Date().toISOString();
  await supabase
    .from("chat_participants" as any)
    .update({ last_read_at: now })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}

/**
 * Atualiza configurações de um grupo.
 */
export async function updateGroupSettings(payload: UpdateGroupPayload): Promise<void> {
  const { data, error } = await (supabase.rpc as any)("rpc_update_group_settings", {
    p_conversation_id: payload.conversation_id,
    p_title: payload.title,
    p_description: payload.description,
    p_avatar_url: payload.avatar_url,
    p_only_admins_can_post: payload.only_admins_can_post,
  });

  if (error) throw error;
}

/**
 * Gerencia participantes do grupo (adicionar, remover, promover, rebaixar).
 */
export async function manageGroupMember(
  conversationId: string,
  targetUserId: string,
  action: "add" | "remove" | "make_admin" | "remove_admin",
  newRole?: ParticipantRole
): Promise<void> {
  const { data, error } = await (supabase.rpc as any)("rpc_manage_group_member", {
    p_conversation_id: conversationId,
    p_target_user_id: targetUserId,
    p_action: action,
    p_new_role: newRole,
  });

  if (error) throw error;
}

/**
 * Sai de um grupo ou exclui o grupo se for o criador.
 */
export async function leaveOrDeleteGroup(
  conversationId: string,
  action: "leave" | "delete"
): Promise<void> {
  const { data, error } = await (supabase.rpc as any)("rpc_leave_or_delete_group", {
    p_conversation_id: conversationId,
    p_action: action,
  });

  if (error) throw error;
}

/**
 * Faz upload de um anexo para o bucket 'chat-attachments'.
 */
export async function uploadChatAttachment(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; name: string; type: string; size: number }> {
  const ext = file.name.split(".").pop() || "bin";
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const filePath = `uploads/${uniqueName}`;

  if (onProgress) onProgress(20);

  const { error: uploadError } = await supabase.storage
    .from("chat-attachments")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Falha no upload: ${uploadError.message}`);
  }

  if (onProgress) onProgress(80);

  const { data: publicUrlData } = supabase.storage
    .from("chat-attachments")
    .getPublicUrl(filePath);

  if (onProgress) onProgress(100);

  return {
    url: publicUrlData.publicUrl,
    name: file.name,
    type: file.type,
    size: file.size,
  };
}
