import { supabase } from "@/integrations/supabase/client";
import type {
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  CreateGroupPayload,
} from "@/types/chat";
import type { Member, UserPresenceStatus } from "@/lib/app-types";

/**
 * Busca diretamente do banco todos os perfis, cargos e presenças para mapear
 * dados ricos de todos os usuários no chat sem depender de filtros de aprovação.
 */
export async function fetchChatMembersMap(): Promise<Map<string, Member>> {
  const membersMap = new Map<string, Member>();

  try {
    const [profilesRes, rolesRes, presenceRes] = await Promise.all([
      (supabase.from("profiles" as any))
        .select("id, user_id, nome, nickname, avatar_url, discord_avatar_url, discord_username, discord_id, discord_email, game_id, telefone, status, data_entrada, created_at, is_developer"),
      supabase.from("user_roles").select("user_id, nivel"),
      supabase.from("user_presence").select("user_id, status, last_seen, online_since, total_seconds_online"),
    ]);

    const rolesMap = new Map<string, any>();
    (rolesRes.data || []).forEach((r: any) => {
      if (r.user_id) rolesMap.set(r.user_id, r.nivel);
    });

    const nowMs = Date.now();
    const presenceMap = new Map<string, any>();
    (presenceRes.data || []).forEach((p: any) => {
      let st = (p.status as UserPresenceStatus) || "offline";
      const lastSeenMs = p.last_seen ? new Date(p.last_seen).getTime() : 0;
      const diffSecs = lastSeenMs > 0 ? (nowMs - lastSeenMs) / 1000 : 99999;
      if (st === "online" && diffSecs > 90) {
        st = diffSecs > 300 ? "offline" : "ausente";
      }
      presenceMap.set(p.user_id, {
        status: st,
        online_since: p.online_since || null,
        total_seconds: Number(p.total_seconds_online || 0),
      });
    });

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
        total_seconds_online: pres?.total_seconds || 0,
        discord_id: d.discord_id || null,
        discord_username: d.discord_username || null,
        discord_avatar_url: d.discord_avatar_url || d.avatar_url || null,
        discord_email: d.discord_email || null,
        is_developer: Boolean(d.is_developer || roleNivel === "desenvolvedor" || d.discord_id === "917826984778797087"),
      };
      membersMap.set(d.user_id, memberObj);
    });
  } catch (err) {
    console.warn("Erro ao carregar mapa de membros do chat:", err);
  }

  return membersMap;
}

/**
 * Busca todas as conversas do usuário autenticado (privadas e grupos),
 * incluindo dados dos participantes, mensagens recentes e contador de não lidas.
 */
export async function fetchUserConversations(currentUserId: string): Promise<ChatConversation[]> {
  if (!currentUserId) return [];

  // 1. Busca os IDs das conversas onde o usuário é participante
  const { data: myParticipations, error: partError } = await (supabase.from("chat_participants" as any))
    .select("conversation_id, last_read_at, role, is_muted")
    .eq("user_id", currentUserId);

  if (partError || !myParticipations || myParticipations.length === 0) {
    return [];
  }

  const conversationIds = myParticipations.map((p: any) => p.conversation_id);
  const myReadMap = new Map<string, string>();
  myParticipations.forEach((p: any) => {
    myReadMap.set(p.conversation_id, p.last_read_at || new Date(0).toISOString());
  });

  // 2. Busca os dados de todas as conversas e todos os seus participantes em paralelo
  const [convsRes, allPartsRes, membersMap] = await Promise.all([
    (supabase.from("chat_conversations" as any))
      .select("*")
      .in("id", conversationIds)
      .order("last_message_at", { ascending: false }),
    (supabase.from("chat_participants" as any))
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
      profile: prof,
    });
    partsByConv.set(p.conversation_id, list);
  });

  // 3. Busca contagem de mensagens não lidas para cada conversa
  const conversations: ChatConversation[] = [];

  for (const c of convsRes.data || []) {
    const lastRead = myReadMap.get(c.id) || new Date(0).toISOString();
    const parts = partsByConv.get(c.id) || [];

    // Calcula mensagens não lidas
    let unreadCount = 0;
    if (c.last_message_at && new Date(c.last_message_at).getTime() > new Date(lastRead).getTime()) {
      const { count } = await (supabase.from("chat_messages" as any))
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .gt("created_at", lastRead)
        .neq("sender_id", currentUserId);
      unreadCount = count || 0;
    }

    let otherParticipant: Member | null = null;
    if (c.type === "private") {
      const otherPart = parts.find((p) => p.user_id !== currentUserId);
      otherParticipant = otherPart?.profile || (otherPart ? membersMap.get(otherPart.user_id) : null) || null;
    }

    conversations.push({
      id: c.id,
      type: c.type,
      title: c.title,
      avatar_url: c.avatar_url,
      created_by: c.created_by,
      created_at: c.created_at,
      updated_at: c.updated_at,
      last_message: c.last_message,
      last_message_at: c.last_message_at || c.created_at,
      last_message_sender_id: c.last_message_sender_id,
      participants: parts,
      unread_count: unreadCount,
      other_participant: otherParticipant,
    });
  }

  return conversations.sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  );
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
  const { data: myConvs } = await (supabase.from("chat_participants" as any))
    .select("conversation_id")
    .eq("user_id", currentUserId);

  if (myConvs && myConvs.length > 0) {
    const myConvIds = myConvs.map((p: any) => p.conversation_id);
    const { data: targetConvs } = await (supabase.from("chat_participants" as any))
      .select("conversation_id")
      .eq("user_id", targetUserId)
      .in("conversation_id", myConvIds);

    if (targetConvs && targetConvs.length > 0) {
      // Verifica se alguma dessas é do tipo 'private'
      const commonConvIds = targetConvs.map((p: any) => p.conversation_id);
      const { data: existingPrivate } = await (supabase.from("chat_conversations" as any))
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
  const { data: newConv, error: convError } = await (supabase.from("chat_conversations" as any))
    .insert({
      type: "private",
      created_by: currentUserId,
    })
    .select()
    .single();

  if (convError || !newConv) throw convError || new Error("Erro ao criar conversa privada.");

  // 3. Insere ambos os participantes
  await (supabase.from("chat_participants" as any)).insert([
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
  const { title, avatar_url, participant_ids } = payload;
  if (!title.trim()) throw new Error("Informe o nome do grupo.");

  const uniqueParticipants = Array.from(new Set([creatorId, ...participant_ids]));

  // 1. Cria a conversa do grupo
  const { data: newConv, error: convError } = await (supabase.from("chat_conversations" as any))
    .insert({
      type: "group",
      title: title.trim(),
      avatar_url: avatar_url || null,
      created_by: creatorId,
      last_message: "Grupo criado",
      last_message_at: new Date().toISOString(),
      last_message_sender_id: creatorId,
    })
    .select()
    .single();

  if (convError || !newConv) throw convError || new Error("Erro ao criar grupo.");

  // 2. Insere todos os participantes
  const participantsData = uniqueParticipants.map((uid) => ({
    conversation_id: newConv.id,
    user_id: uid,
    role: uid === creatorId ? "admin" : "member",
  }));

  const { error: partError } = await (supabase.from("chat_participants" as any)).insert(participantsData);
  if (partError) throw partError;

  // 3. Mensagem inicial do sistema informando criação do grupo
  await (supabase.from("chat_messages" as any)).insert({
    conversation_id: newConv.id,
    sender_id: creatorId,
    content: `🎉 Grupo "${title.trim()}" criado.`,
    status: "delivered",
  });

  const convs = await fetchUserConversations(creatorId);
  return convs.find((c) => c.id === newConv.id)!;
}

/**
 * Busca o histórico de mensagens de uma conversa com paginação eficiente.
 */
export async function fetchMessages(
  conversationId: string,
  limit = 50,
  beforeCreatedAt?: string
): Promise<ChatMessage[]> {
  let query = (supabase.from("chat_messages" as any))
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

  return (messagesRes.data || []).map((m: any) => {
    const prof = membersMap.get(m.sender_id);
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      status: m.status || "sent",
      created_at: m.created_at,
      updated_at: m.updated_at || m.created_at,
      sender_name: prof?.nickname || prof?.nome || prof?.discord_username || "Membro",
      sender_nickname: prof?.nickname || null,
      sender_game_id: prof?.game_id || null,
      sender_avatar: prof?.discord_avatar_url || null,
    };
  });
}

/**
 * Envia uma mensagem para a conversa e atualiza metadata em tempo real.
 */
export async function sendChatMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<ChatMessage> {
  const cleanContent = content.trim();
  if (!cleanContent) throw new Error("A mensagem não pode estar vazia.");

  const now = new Date().toISOString();

  // 1. Salva a mensagem no banco
  const { data: msg, error: msgError } = await (supabase.from("chat_messages" as any))
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: cleanContent,
      status: "sent",
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (msgError || !msg) throw msgError || new Error("Erro ao enviar mensagem.");

  // 2. Atualiza a conversa com a última mensagem
  await (supabase.from("chat_conversations" as any))
    .update({
      last_message: cleanContent,
      last_message_at: now,
      last_message_sender_id: senderId,
      updated_at: now,
    })
    .eq("id", conversationId);

  // 3. Atualiza o last_read_at do remetente
  await (supabase.from("chat_participants" as any))
    .update({ last_read_at: now })
    .eq("conversation_id", conversationId)
    .eq("user_id", senderId);

  return {
    id: msg.id,
    conversation_id: msg.conversation_id,
    sender_id: msg.sender_id,
    content: msg.content,
    status: msg.status,
    created_at: msg.created_at,
    updated_at: msg.updated_at,
  };
}

/**
 * Marca uma conversa como lida pelo usuário atual.
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  if (!conversationId || !userId) return;
  const now = new Date().toISOString();

  await (supabase.from("chat_participants" as any))
    .update({ last_read_at: now })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  // Atualiza status das mensagens enviadas por outros para 'read'
  await (supabase.from("chat_messages" as any))
    .update({ status: "read" })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);
}

/**
 * Adiciona novos participantes a um grupo existente.
 */
export async function addGroupMembers(
  conversationId: string,
  userIds: string[]
): Promise<void> {
  const data = userIds.map((uid) => ({
    conversation_id: conversationId,
    user_id: uid,
    role: "member",
  }));

  const { error } = await (supabase.from("chat_participants" as any))
    .upsert(data, { onConflict: "conversation_id,user_id" });

  if (error) throw error;
}

/**
 * Remove um participante de um grupo existente.
 */
export async function removeGroupMember(
  conversationId: string,
  targetUserId: string
): Promise<void> {
  const { error } = await (supabase.from("chat_participants" as any))
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", targetUserId);

  if (error) throw error;
}

/**
 * Atualiza o nome ou foto do grupo.
 */
export async function updateGroupInfo(
  conversationId: string,
  title: string,
  avatarUrl?: string | null
): Promise<void> {
  const { error } = await (supabase.from("chat_conversations" as any))
    .update({
      title: title.trim(),
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) throw error;
}
