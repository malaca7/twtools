import { supabase } from "@/integrations/supabase/client";
import type {
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  MessageReaction,
  CreateGroupPayload,
  UpdateGroupPayload,
  ParticipantRole,
  MessageStatus,
  MessageReceiptParticipantInfo,
  MessageReceiptSummary,
} from "@/types/chat";
import { resolveMemberPresence } from "@/lib/format";
import type { Member, UserPresenceStatus } from "@/lib/app-types";
import { createNotification } from "@/lib/notifications-api";

// In-memory cache for profiles & presences (30s TTL) to accelerate fallback rendering
let _cachedMembersMap: Map<string, Member> | null = null;
let _cachedMembersMapAt = 0;

/**
 * Retorna membro do cache síncrono para renderização instantânea (0ms).
 */
export function getCachedMember(userId: string): Member | undefined {
  return _cachedMembersMap?.get(userId);
}

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
      supabase.from("user_presence" as any).select("user_id, status, last_seen, online_since, total_seconds_online, updated_at"),
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
        presence_status: resolveMemberPresence(pres?.status, pres?.last_seen, pres?.updated_at),
        last_seen: pres?.last_seen || null,
        presence_updated_at: pres?.updated_at || null,
        updated_at: pres?.updated_at || null,
        online_since: pres?.online_since || null,
        total_seconds_online: pres?.total_seconds_online || 0,
        discord_id: d.discord_id || null,
        discord_username: d.discord_username || null,
        discord_avatar_url: d.avatar_url || d.discord_avatar_url || null,
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
  beforeCreatedAt?: string,
  userId?: string
): Promise<ChatMessage[]> {
  if (!conversationId) return [];

  let effectiveUserId = userId || null;
  if (!effectiveUserId && typeof window !== "undefined") {
    try {
      const rawSession = localStorage.getItem("sb-adgdivossyzpwofouhrh-auth-token");
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        effectiveUserId = parsed?.user?.id || null;
      }
    } catch {
      // Ignora erro
    }
  }

  // 1. EXECUÇÃO VIA RPC ULTRA-RÁPIDA (Retorna mensagens, reações e replies em < 80ms)
  try {
    const { data, error } = await (supabase.rpc as any)("rpc_get_conversation_messages", {
      p_conversation_id: conversationId,
      p_limit: limit,
      p_before: beforeCreatedAt || null,
      p_user_id: effectiveUserId,
    });

    if (!error && Array.isArray(data)) {
      const messagesMap = new Map<string, any>(data.map((m: any) => [m.id, m]));
      const list = data.map((m: any) => {
        let replyToMessage = m.reply_to_message || null;
        if (!replyToMessage && m.reply_to_id && messagesMap.has(m.reply_to_id)) {
          const rep = messagesMap.get(m.reply_to_id);
          replyToMessage = {
            id: rep.id,
            sender_id: rep.sender_id,
            sender_name: rep.sender_name || "Membro",
            content: rep.content,
            message_type: rep.message_type || "text",
            attachment_name: rep.attachment_name,
            attachment_url: rep.attachment_url,
          };
        }
        return {
          ...m,
          reply_to_message: replyToMessage,
        };
      }) as ChatMessage[];

      // Garante ordenação cronológica crescente rigorosa (mais antigas no topo, mais recentes embaixo)
      return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
      .order("created_at", { ascending: false })
      .limit(limit);

    if (beforeCreatedAt) {
      query = query.lt("created_at", beforeCreatedAt);
    }

    const [messagesRes, membersMap] = await Promise.all([
      query,
      fetchChatMembersMap(),
    ]);

    if (messagesRes.error) throw messagesRes.error;
    const rawMessages = (messagesRes.data || []).reverse();

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

    const rawMap = new Map<string, any>(rawMessages.map((m: any) => [m.id, m]));

    // Identificar mensagens respondidas que possam estar fora do lote atual
    const missingReplyIds = rawMessages
      .map((m: any) => m.reply_to_id)
      .filter((id: any) => id && !rawMap.has(id));

    if (missingReplyIds.length > 0) {
      try {
        const { data: missingData } = await supabase
          .from("chat_messages" as any)
          .select("id, sender_id, content, message_type, attachment_name, attachment_url")
          .in("id", missingReplyIds);
        (missingData || []).forEach((rep: any) => rawMap.set(rep.id, rep));
      } catch (err) {
        console.warn("Não foi possível buscar mensagens respondidas anteriores:", err);
      }
    }

    return rawMessages.map((m: any) => {
      const prof = membersMap.get(m.sender_id);

      let replyToMessage = null;
      if (m.reply_to_id && rawMap.has(m.reply_to_id)) {
        const rep = rawMap.get(m.reply_to_id);
        const repProf = membersMap.get(rep.sender_id);
        replyToMessage = {
          id: rep.id,
          sender_id: rep.sender_id,
          sender_name: repProf?.nickname || repProf?.nome || "Membro",
          content: rep.content,
          message_type: rep.message_type || "text",
          attachment_name: rep.attachment_name,
          attachment_url: rep.attachment_url,
        };
      }

      return {
        id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        sender_name: prof?.nickname || prof?.nome || "Membro",
        sender_avatar: prof?.avatar_url || prof?.discord_avatar_url || null,
        content: m.content,
        status: m.status || "sent",
        message_type: m.message_type || "text",
        reply_to_id: m.reply_to_id,
        reply_to_message: replyToMessage,
        attachment_url: m.attachment_url,
        attachment_name: m.attachment_name,
        attachment_type: m.attachment_type,
        attachment_size: m.attachment_size,
        mentions: m.mentions || [],
        reactions: reactionsByMsg.get(m.id) || [],
        is_edited: Boolean(m.is_edited),
        is_deleted: Boolean(m.is_deleted || m.is_deleted_for_everyone),
        is_deleted_for_everyone: Boolean(m.is_deleted_for_everyone),
        is_forwarded: Boolean(m.is_forwarded),
        forwarded_from_name: m.forwarded_from_name || null,
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
    isForwarded?: boolean;
    forwardedFromName?: string | null;
    senderId?: string | null;
  }
): Promise<ChatMessage> {
  let effectiveSenderId = options?.senderId;
  if (!effectiveSenderId) {
    const { data: userData } = await supabase.auth.getUser();
    effectiveSenderId = userData?.user?.id;
  }
  if (!effectiveSenderId) {
    const { data: sessionData } = await supabase.auth.getSession();
    effectiveSenderId = sessionData?.session?.user?.id;
  }

  // Inserção direta via Supabase REST Client (< 80ms)
  const { data: inserted, error: insertError } = await supabase
    .from("chat_messages" as any)
    .insert({
      conversation_id: conversationId,
      sender_id: effectiveSenderId,
      content: content.trim(),
      message_type: options?.messageType || "text",
      reply_to_id: options?.replyToId || null,
      attachment_url: options?.attachmentUrl || null,
      attachment_name: options?.attachmentName || null,
      attachment_type: options?.attachmentType || null,
      attachment_size: options?.attachmentSize || null,
      mentions: options?.mentions || [],
      is_forwarded: Boolean(options?.isForwarded),
      forwarded_from_name: options?.forwardedFromName || null,
      status: "sent",
    })
    .select()
    .single();

  if (insertError || !inserted) throw insertError || new Error("Falha ao gravar mensagem.");

  let previewText = content.trim();
  if (!previewText) {
    if (options?.messageType === "audio") previewText = "🎤 Mensagem de voz";
    else if (options?.messageType === "image") previewText = "📷 Foto";
    else if (options?.messageType === "video") previewText = "🎥 Vídeo";
    else if (options?.messageType === "document") previewText = `📄 ${options?.attachmentName || "Documento"}`;
    else previewText = options?.attachmentName || "Anexo";
  }

  // Atualiza última mensagem na conversa em segundo plano
  void supabase
    .from("chat_conversations" as any)
    .update({
      last_message: previewText,
      last_message_at: (inserted as any).created_at || new Date().toISOString(),
      last_message_sender_id: (inserted as any).sender_id,
    })
    .eq("id", conversationId);

  // Dispara notificação pessoal para cada participante destinatário no sistema de notificações
  void (async () => {
    try {
      const [{ data: conv }, { data: participants }, { data: senderProf }] = await Promise.all([
        supabase.from("chat_conversations" as any).select("type, name").eq("id", conversationId).maybeSingle(),
        supabase.from("chat_participants" as any).select("user_id, is_muted").eq("conversation_id", conversationId).neq("user_id", effectiveSenderId),
        supabase.from("profiles" as any).select("nome, nickname, avatar_url, discord_avatar_url").eq("user_id", effectiveSenderId).maybeSingle(),
      ]);

      const sp = senderProf as any;
      const senderName = sp?.nickname || sp?.nome || "Membro";
      const senderAvatar = sp?.avatar_url || sp?.discord_avatar_url || null;
      const isGroup = (conv as any)?.type === "group";
      const convName = (conv as any)?.name || (isGroup ? "Grupo" : "Chat Privado");
      const mentions = options?.mentions || [];

      if (Array.isArray(participants)) {
        for (const p of participants as any[]) {
          if (p.is_muted) continue;
          const isUserMentioned = mentions.includes(p.user_id) || mentions.includes("todos");

          let notifTitle = `Mensagem de ${senderName}`;
          if (isUserMentioned) {
            notifTitle = `Menção de ${senderName} em ${convName}`;
          } else if (isGroup) {
            notifTitle = `${convName}: ${senderName}`;
          }

          void createNotification({
            title: notifTitle,
            message: previewText.slice(0, 110),
            type: "chat",
            category: isUserMentioned ? "alert" : "info",
            user_id: p.user_id,
            link: `/chat?conv=${conversationId}`,
            sender_id: effectiveSenderId,
            sender_name: senderName,
            sender_avatar: senderAvatar,
          });
        }
      }
    } catch (err) {
      console.warn("Erro ao disparar notificações de chat:", err);
    }
  })();

  return inserted as ChatMessage;
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
export async function editChatMessage(
  messageId: string,
  newContent: string,
  currentUserId?: string
): Promise<void> {
  try {
    const { error } = await (supabase.rpc as any)("rpc_edit_chat_message", {
      p_message_id: messageId,
      p_new_content: newContent.trim(),
      p_user_id: currentUserId || null,
    });
    if (!error) return;
  } catch (rpcErr) {
    console.warn("RPC edit_chat_message falhou, utilizando fallback direto:", rpcErr);
  }

  // Fallback direto
  const { error: updateError } = await supabase
    .from("chat_messages" as any)
    .update({
      content: newContent.trim(),
      is_edited: true,
      edited_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", messageId);

  if (updateError) throw updateError;
}

/**
 * Exclui uma mensagem (para si mesmo ou para todos).
 */
export async function deleteChatMessage(
  messageId: string,
  forEveryone = false,
  currentUserId?: string
): Promise<void> {
  try {
    const { error } = await (supabase.rpc as any)("rpc_delete_chat_message", {
      p_message_id: messageId,
      p_for_everyone: forEveryone,
      p_user_id: currentUserId || null,
    });
    if (!error) return;
  } catch (rpcErr) {
    console.warn("RPC delete_chat_message falhou, utilizando fallback direto:", rpcErr);
  }

  // Fallback direto
  if (forEveryone) {
    const { error: delError } = await supabase
      .from("chat_messages" as any)
      .update({
        is_deleted_for_everyone: true,
        content: "🚫 Mensagem apagada",
        attachment_url: null,
        attachment_name: null,
        attachment_type: null,
        attachment_size: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (delError) throw delError;
  } else if (currentUserId) {
    const { data: existing } = await supabase
      .from("chat_messages" as any)
      .select("deleted_for_users")
      .eq("id", messageId)
      .single();

    const users: string[] = (existing as any)?.deleted_for_users || [];
    if (!users.includes(currentUserId)) {
      const { error: hideError } = await supabase
        .from("chat_messages" as any)
        .update({
          deleted_for_users: [...users, currentUserId],
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (hideError) throw hideError;
    }
  }
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
  // 1. Atualiza timestamp de última leitura do participante
  await supabase
    .from("chat_participants" as any)
    .update({ last_read_at: now })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  // 2. Atualiza status de mensagens recebidas de outros membros para 'read' (recibo de leitura 2 tiques azuis)
  await supabase
    .from("chat_messages" as any)
    .update({ status: "read" })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .in("status", ["sent", "delivered"]);
}

/**
 * Marca todas as conversas como lidas para o usuário atual.
 */
export async function markAllConversationsAsRead(userId: string): Promise<void> {
  if (!userId) return;

  const now = new Date().toISOString();
  // 1. Atualiza timestamp de última leitura de todos os registros de participantes do usuário
  await supabase
    .from("chat_participants" as any)
    .update({ last_read_at: now })
    .eq("user_id", userId);

  // 2. Tenta chamar RPC se disponível
  try {
    await (supabase.rpc as any)("rpc_mark_all_conversations_read", {
      p_user_id: userId,
    });
  } catch {
    // Ignora se não existir RPC específica
  }
}


/**
 * Determina com precisão o status de entrega e visualização de uma mensagem no estilo WhatsApp:
 * - "sending": envio em andamento
 * - "failed": erro no envio
 * - "read": visualizada pelo destinatário (privado) ou por todos os membros (grupo) [2 tiques azuis]
 * - "delivered": entregue ao dispositivo/sessão (destinatário online ou recebeu em tempo real) [2 tiques cinzas]
 * - "sent": salva no servidor, aguardando entrega [1 tique cinza]
 */
export function resolveMessageStatus(
  message: ChatMessage,
  participants: ChatParticipant[] = [],
  currentUserId?: string
): MessageStatus {
  if (message.status === "sending" || message.status === "failed") {
    return message.status;
  }

  // Se o próprio registro já está marcado como "read", mantemos
  if (message.status === "read") {
    return "read";
  }

  const senderId = message.sender_id || currentUserId;
  const recipients = participants.filter((p) => p.user_id !== senderId);

  if (recipients.length === 0) {
    return message.status || "sent";
  }

  const msgTime = new Date(message.created_at).getTime();

  // Verifica quem já visualizou
  const readers = recipients.filter((p) => {
    if (!p.last_read_at) return false;
    return new Date(p.last_read_at).getTime() >= msgTime;
  });

  // Se TODOS os destinatários leram -> "read" (2 tiques azuis)
  if (readers.length === recipients.length) {
    return "read";
  }

  // Se pelo menos um leu ou foi entregue
  const delivered = recipients.filter((p) => {
    // Se já leu, logicamente já foi entregue
    if (p.last_read_at && new Date(p.last_read_at).getTime() >= msgTime) return true;
    // Se o membro está online agora
    const prof = p.profile || getCachedMember(p.user_id);
    if (prof?.presence_status === "online") return true;
    // Se foi visto por último após o envio da mensagem
    if (prof?.last_seen && new Date(prof.last_seen).getTime() >= msgTime) return true;
    // Se o status da mensagem já é entregue
    if (message.status === "delivered") return true;
    return false;
  });

  if (recipients.length === 1) {
    // Conversa 1:1 privada
    if (readers.length === 1) return "read";
    if (delivered.length === 1) return "delivered";
    return "sent";
  } else {
    // Grupo
    if (readers.length === recipients.length) return "read";
    if (readers.length > 0 || delivered.length > 0) return "delivered";
    return "sent";
  }
}

/**
 * Monta o resumo detalhado de recibos de uma mensagem estilo WhatsApp ("Dados da mensagem"):
 * - Lista de quem visualizou (com timestamp exato de leitura)
 * - Lista de para quem foi entregue (com timestamp de entrega)
 * - Lista de pendentes (membros que ainda não conectaram)
 */
export function getMessageReceiptInfo(
  message: ChatMessage,
  conversation: ChatConversation
): MessageReceiptSummary {
  const participants = conversation.participants || [];
  const senderId = message.sender_id;
  const recipients = participants.filter((p) => p.user_id !== senderId);
  const msgTime = new Date(message.created_at).getTime();

  const readParticipants: MessageReceiptParticipantInfo[] = [];
  const deliveredParticipants: MessageReceiptParticipantInfo[] = [];
  const pendingParticipants: MessageReceiptParticipantInfo[] = [];

  recipients.forEach((p) => {
    const prof = p.profile || getCachedMember(p.user_id);
    const hasRead = Boolean(
      (recipients.length === 1 && (message.status as string) === "read") ||
      (p.last_read_at && new Date(p.last_read_at).getTime() >= msgTime)
    );

    const isDelivered =
      hasRead ||
      message.status === "delivered" ||
      prof?.presence_status === "online" ||
      (prof?.last_seen && new Date(prof.last_seen).getTime() >= msgTime);

    const readTimestamp = p.last_read_at || (hasRead ? message.updated_at || message.created_at : null);
    const delivTimestamp =
      prof?.last_seen && new Date(prof.last_seen).getTime() >= msgTime
        ? prof.last_seen
        : readTimestamp || message.created_at;

    const baseInfo: MessageReceiptParticipantInfo = {
      user_id: p.user_id,
      user_name: prof?.nome || p.custom_nickname || "Membro",
      nickname: prof?.nickname || p.custom_nickname || null,
      game_id: prof?.game_id || null,
      avatar_url: prof?.avatar_url || prof?.discord_avatar_url || null,
      role: p.role,
      presence_status: prof?.presence_status,
      last_seen: prof?.last_seen || null,
      status: hasRead ? "read" : isDelivered ? "delivered" : "pending",
      timestamp: hasRead ? readTimestamp : isDelivered ? delivTimestamp : null,
    };

    if (hasRead) {
      readParticipants.push(baseInfo);
    } else if (isDelivered) {
      deliveredParticipants.push(baseInfo);
    } else {
      pendingParticipants.push(baseInfo);
    }
  });

  const overallStatus = resolveMessageStatus(message, participants, senderId);

  return {
    status: overallStatus,
    readCount: readParticipants.length,
    deliveredCount: deliveredParticipants.length,
    pendingCount: pendingParticipants.length,
    totalRecipients: recipients.length,
    readParticipants,
    deliveredParticipants,
    pendingParticipants,
  };
}

/**
 * Atualiza o status da mensagem no banco em segundo plano (se necessário).
 */
export async function syncMessageStatusInDb(messageId: string, status: "delivered" | "read"): Promise<void> {
  try {
    await supabase
      .from("chat_messages" as any)
      .update({ status })
      .eq("id", messageId);
  } catch {
    // Silently ignore
  }
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
 * Silencia ou desilencia um participante na conversa.
 */
export async function muteConversationParticipant(
  conversationId: string,
  targetUserId: string,
  isMuted: boolean,
  mutedUntil?: string | null,
  actorId?: string
): Promise<void> {
  const { error } = await supabase
    .from("chat_participants" as any)
    .update({
      is_muted: isMuted,
      muted_until: mutedUntil || null,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", targetUserId);

  if (error) throw error;
}

/**
 * Remove um participante de um grupo.
 */
export async function removeConversationParticipant(
  conversationId: string,
  targetUserId: string,
  actorId?: string
): Promise<void> {
  await manageGroupMember(conversationId, targetUserId, "remove");
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

/**
 * Fixa ou desafixa uma conversa no topo para o usuário atual.
 */
export async function togglePinConversation(conversationId: string, currentUserId?: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)("rpc_toggle_pin_conversation", {
    p_conversation_id: conversationId,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return Boolean(data);
}

/**
 * Silencia ou ativa notificações de uma conversa para o usuário atual.
 */
export async function toggleMuteConversation(conversationId: string, currentUserId?: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)("rpc_toggle_mute_conversation", {
    p_conversation_id: conversationId,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return Boolean(data);
}

/**
 * Arquiva ou desarquiva uma conversa para o usuário atual.
 */
export async function toggleArchiveConversation(conversationId: string, currentUserId?: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)("rpc_toggle_archive_conversation", {
    p_conversation_id: conversationId,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return Boolean(data);
}

/**
 * Marca uma conversa como não lida pelo usuário atual.
 */
export async function markConversationAsUnread(conversationId: string, currentUserId?: string): Promise<void> {
  const { error } = await (supabase.rpc as any)("rpc_mark_conversation_unread", {
    p_conversation_id: conversationId,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
}

/**
 * Remove/apaga uma conversa da visualização do usuário atual.
 */
export async function deleteConversationForUser(conversationId: string, currentUserId?: string): Promise<void> {
  const { error } = await (supabase.rpc as any)("rpc_delete_conversation_for_user", {
    p_conversation_id: conversationId,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
}

/**
 * Encaminha uma mensagem para outra conversa.
 */
export async function forwardChatMessage(
  targetConversationId: string,
  message: ChatMessage,
  currentUserId?: string
): Promise<ChatMessage> {
  const isOriginalAuthor = message.sender_id === currentUserId && !message.forwarded_from_name;
  let originalAuthorName: string | null = null;

  if (!isOriginalAuthor) {
    originalAuthorName =
      message.forwarded_from_name ||
      message.sender_name ||
      message.sender_nickname ||
      getCachedMember(message.sender_id)?.nickname ||
      getCachedMember(message.sender_id)?.nome ||
      "Membro";
  }

  return sendChatMessage(targetConversationId, message.content, {
    messageType: message.message_type,
    attachmentUrl: message.attachment_url,
    attachmentName: message.attachment_name,
    attachmentType: message.attachment_type,
    attachmentSize: message.attachment_size,
    isForwarded: true,
    forwardedFromName: originalAuthorName,
    senderId: currentUserId,
  });
}

/**
 * Fixa ou desafixa uma mensagem no topo da conversa.
 */
export async function togglePinChatMessage(messageId: string, currentUserId?: string): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)("rpc_toggle_pin_message", {
    p_message_id: messageId,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return Boolean(data);
}

/**
 * Salva ou remove uma mensagem dos favoritos pessoais.
 */
export async function toggleSaveChatMessage(
  messageId: string,
  conversationId: string,
  currentUserId?: string
): Promise<boolean> {
  const { data, error } = await (supabase.rpc as any)("rpc_toggle_save_message", {
    p_message_id: messageId,
    p_conversation_id: conversationId,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return Boolean(data);
}

/**
 * Busca todas as mensagens salvas pelo usuário atual.
 */
export async function getSavedChatMessages(currentUserId?: string): Promise<any[]> {
  const { data, error } = await (supabase.rpc as any)("rpc_get_saved_messages", {
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return (data || []) as any[];
}

/**
 * Cria e envia uma mensagem do tipo enquete.
 */
export async function sendPollChatMessage(
  conversationId: string,
  question: string,
  options: string[],
  isMultipleChoice: boolean,
  expiresAt: string | null = null,
  currentUserId?: string,
  currentUserName?: string
): Promise<ChatMessage> {
  const pollData = {
    question: question.trim(),
    options: options.filter((o) => o.trim().length > 0).map((text, idx) => ({
      id: `opt-${idx + 1}-${Date.now().toString(36)}`,
      text: text.trim(),
      votes: [],
    })),
    is_multiple_choice: isMultipleChoice,
    is_closed: false,
    expires_at: expiresAt || null,
    created_by: currentUserId || "",
    created_by_name: currentUserName || "Membro",
  };

  const { data: inserted, error } = await supabase
    .from("chat_messages" as any)
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: `🗳️ Enquete: ${question.trim()}`,
      message_type: "poll",
      poll_data: pollData,
      status: "sent",
    })
    .select()
    .single();

  if (error || !inserted) throw error || new Error("Falha ao criar enquete.");

  // Atualiza última mensagem na conversa
  void supabase
    .from("chat_conversations" as any)
    .update({
      last_message: `🗳️ Enquete: ${question.trim()}`,
      last_message_at: (inserted as any).created_at || new Date().toISOString(),
      last_message_sender_id: currentUserId,
    })
    .eq("id", conversationId);

  return inserted as ChatMessage;
}

/**
 * Registra ou remove voto em uma opção de enquete.
 */
export async function votePollChatMessage(
  messageId: string,
  optionId: string,
  currentUserId?: string
): Promise<any> {
  const { data, error } = await (supabase.rpc as any)("rpc_vote_poll", {
    p_message_id: messageId,
    p_option_id: optionId,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Encerra uma enquete.
 */
export async function closePollChatMessage(messageId: string, currentUserId?: string): Promise<any> {
  const { data, error } = await (supabase.rpc as any)("rpc_close_poll", {
    p_message_id: messageId,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Silencia uma conversa com duração específica (0 = reativar, -1 = sempre, >0 = minutos).
 */
export async function setConversationMuteDuration(
  conversationId: string,
  durationMinutes: number,
  currentUserId?: string
): Promise<void> {
  const { error } = await (supabase.rpc as any)("rpc_set_conversation_mute", {
    p_conversation_id: conversationId,
    p_duration_minutes: durationMinutes,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
}

/**
 * Cria um lembrete a partir de uma mensagem.
 */
export async function createChatMessageReminder(
  messageId: string,
  conversationId: string,
  remindAt: string,
  note?: string,
  currentUserId?: string
): Promise<any> {
  const { data, error } = await (supabase.rpc as any)("rpc_create_message_reminder", {
    p_message_id: messageId,
    p_conversation_id: conversationId,
    p_remind_at: remindAt,
    p_note: note?.trim() || null,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Busca todos os lembretes ativos do usuário.
 */
export async function getUserChatReminders(currentUserId?: string): Promise<any[]> {
  const { data, error } = await (supabase.rpc as any)("rpc_get_user_reminders", {
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return (data || []) as any[];
}

/**
 * Exclui ou marca lembrete como concluído.
 */
export async function deleteChatReminder(reminderId: string, currentUserId?: string): Promise<void> {
  const { error } = await supabase
    .from("chat_reminders" as any)
    .delete()
    .eq("id", reminderId);

  if (error) throw error;
}

/**
 * Cria e envia uma mensagem de evento com opções de RSVP (Vou / Não vou / Talvez).
 */
export async function sendEventChatMessage(
  conversationId: string,
  eventData: {
    title: string;
    description?: string;
    event_date: string;
    location?: string;
  },
  currentUserId?: string,
  currentUserName?: string
): Promise<ChatMessage> {
  const fullEvent = {
    title: eventData.title.trim(),
    description: eventData.description?.trim() || null,
    event_date: eventData.event_date,
    location: eventData.location?.trim() || null,
    responses: { vou: [], nao_vou: [], talvez: [] },
    created_by: currentUserId || "",
    created_by_name: currentUserName || "Membro",
    is_cancelled: false,
  };

  const { data: inserted, error } = await supabase
    .from("chat_messages" as any)
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: `📅 Evento: ${eventData.title.trim()}`,
      message_type: "event",
      event_data: fullEvent,
      status: "sent",
    })
    .select()
    .single();

  if (error || !inserted) throw error || new Error("Falha ao criar evento.");

  void supabase
    .from("chat_conversations" as any)
    .update({
      last_message: `📅 Evento: ${eventData.title.trim()}`,
      last_message_at: (inserted as any).created_at || new Date().toISOString(),
      last_message_sender_id: currentUserId,
    })
    .eq("id", conversationId);

  return inserted as ChatMessage;
}

/**
 * Responde a um evento no chat (Vou / Não vou / Talvez).
 */
export async function respondChatEvent(
  messageId: string,
  response: "vou" | "nao_vou" | "talvez",
  currentUserId?: string
): Promise<any> {
  const { data, error } = await (supabase.rpc as any)("rpc_respond_chat_event", {
    p_message_id: messageId,
    p_response: response,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return data;
}

/**
 * Cancela um evento no chat.
 */
export async function cancelChatEvent(messageId: string, currentUserId?: string): Promise<any> {
  const { data: msg } = await supabase
    .from("chat_messages" as any)
    .select("event_data")
    .eq("id", messageId)
    .single();

  if (!msg?.event_data) throw new Error("Evento não encontrado");

  const updatedEvent = { ...msg.event_data, is_cancelled: true };
  const { data, error } = await supabase
    .from("chat_messages" as any)
    .update({ event_data: updatedEvent, updated_at: new Date().toISOString() })
    .eq("id", messageId)
    .select()
    .single();

  if (error) throw error;
  return updatedEvent;
}

/**
 * Busca respostas de uma Thread de mensagem.
 */
export async function getThreadMessages(
  parentMessageId: string,
  currentUserId?: string
): Promise<ChatMessage[]> {
  const { data, error } = await (supabase.rpc as any)("rpc_get_thread_messages", {
    p_parent_message_id: parentMessageId,
    p_limit: 60,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return (data || []) as ChatMessage[];
}

/**
 * Envia uma resposta dentro de uma Thread.
 */
export async function sendThreadReply(
  parentMessageId: string,
  conversationId: string,
  content: string,
  currentUserId?: string
): Promise<ChatMessage> {
  const { data, error } = await (supabase.rpc as any)("rpc_send_thread_reply", {
    p_parent_message_id: parentMessageId,
    p_conversation_id: conversationId,
    p_content: content.trim(),
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
  return data as ChatMessage;
}

/**
 * Configura o tempo de expiração para mensagens temporárias na conversa (0 = desativado, 24, 168, 720 horas).
 */
export async function setConversationEphemeralTtl(
  conversationId: string,
  ttlHours: number,
  currentUserId?: string
): Promise<void> {
  const { error } = await (supabase.rpc as any)("rpc_set_conversation_ephemeral", {
    p_conversation_id: conversationId,
    p_ttl_hours: ttlHours,
    p_user_id: currentUserId || null,
  });

  if (error) throw error;
}

/**
 * Busca as pastas de conversas personalizadas do usuário.
 */
export async function getUserChatFolders(currentUserId?: string): Promise<any[]> {
  if (!currentUserId) return [];
  const { data, error } = await supabase
    .from("chat_user_folders" as any)
    .select("*")
    .eq("user_id", currentUserId)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data || []) as any[];
}

/**
 * Cria ou atualiza uma pasta de conversas.
 */
export async function saveUserChatFolder(
  folder: {
    id?: string;
    name: string;
    icon?: string;
    color?: string;
    conversation_ids?: string[];
    position?: number;
  },
  currentUserId?: string
): Promise<any> {
  if (!currentUserId) throw new Error("Não autorizado");

  if (folder.id) {
    const { data, error } = await supabase
      .from("chat_user_folders" as any)
      .update({
        name: folder.name.trim(),
        icon: folder.icon || "folder",
        color: folder.color || "#6366f1",
        conversation_ids: folder.conversation_ids || [],
        position: folder.position ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", folder.id)
      .eq("user_id", currentUserId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("chat_user_folders" as any)
      .insert({
        user_id: currentUserId,
        name: folder.name.trim(),
        icon: folder.icon || "folder",
        color: folder.color || "#6366f1",
        conversation_ids: folder.conversation_ids || [],
        position: folder.position ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Exclui uma pasta de conversas do usuário.
 */
export async function deleteUserChatFolder(folderId: string, currentUserId?: string): Promise<void> {
  const { error } = await supabase
    .from("chat_user_folders" as any)
    .delete()
    .eq("id", folderId)
    .eq("user_id", currentUserId);

  if (error) throw error;
}

/**
 * Cria uma denúncia de mensagem ou usuário.
 */
export async function reportChatMessage(
  conversationId: string,
  reportedUserId: string,
  reason: string,
  messageId?: string,
  reporterId?: string
): Promise<void> {
  const { error } = await supabase
    .from("chat_reports" as any)
    .insert({
      conversation_id: conversationId,
      reported_user_id: reportedUserId,
      message_id: messageId || null,
      reason: reason.trim(),
      reporter_id: reporterId,
      status: "pending",
    });

  if (error) throw error;
}

/**
 * Registra um log de ação de moderação.
 */
export async function logModerationAction(
  conversationId: string,
  action: string,
  actorId: string,
  targetUserId?: string,
  reason?: string,
  metadata?: any
): Promise<void> {
  await supabase
    .from("chat_moderation_logs" as any)
    .insert({
      conversation_id: conversationId,
      actor_id: actorId,
      target_user_id: targetUserId || null,
      action,
      reason: reason?.trim() || null,
      metadata: metadata || null,
    });
}

/**
 * Busca logs de moderação de uma conversa.
 */
export async function getConversationModerationLogs(conversationId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("chat_moderation_logs" as any)
    .select(`
      id,
      conversation_id,
      actor_id,
      target_user_id,
      action,
      reason,
      metadata,
      created_at
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) throw error;
  return (data || []) as any[];
}
