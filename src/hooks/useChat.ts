import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchUserConversations,
  fetchMessages,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
  toggleMessageReaction,
  markConversationAsRead,
  getOrCreatePrivateConversation,
  createGroupConversation,
  manageGroupMember,
  updateGroupSettings,
  leaveOrDeleteGroup,
  uploadChatAttachment,
  getCachedMember,
  fetchChatMembersMap,
  resolveMessageStatus,
  syncMessageStatusInDb,
} from "@/services/chatService";
import type {
  ChatConversation,
  ChatMessage,
  CreateGroupPayload,
  UpdateGroupPayload,
  TypingUser,
} from "@/types/chat";
import { chatSound } from "@/lib/chatSound";
import { toast } from "sonner";

// Evita disparar múltiplos alertas/sons para a mesma mensagem recebida via múltiplos canais
const recentlyAlertedMessageIds = new Set<string>();

/**
 * Hook para listar e sincronizar em tempo real todas as conversas do usuário.
 */
export function useConversations(activeConversationId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const activeConvRef = useRef(activeConversationId);

  useEffect(() => {
    activeConvRef.current = activeConversationId;
  }, [activeConversationId]);

  const query = useQuery({
    queryKey: ["chat_conversations", userId],
    queryFn: () => (userId ? fetchUserConversations(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
    staleTime: 10000,
    refetchInterval: 15000,
  });

  const conversationsRef = useRef<ChatConversation[]>([]);
  conversationsRef.current = query.data || [];

  // Supabase Realtime subscription for conversation updates and unread counts
  useEffect(() => {
    if (!userId) return;

    const channelName = `realtime-global-chat-${userId}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        async (payload) => {
          const newMsg = payload.new as any;
          if (!newMsg || !newMsg.conversation_id || !userId) return;

          const isSelf = newMsg.sender_id === userId;

          // 1. Notificar ESTRITAMENTE participantes daquela conversa específica
          const userConvs = queryClient.getQueryData<ChatConversation[]>(["chat_conversations", userId]) || conversationsRef.current || [];
          let targetConv = userConvs.find((c) => c.id === newMsg.conversation_id);
          let isMuted = Boolean(targetConv?.is_muted);

          if (!targetConv) {
            // Se não estiver no cache local de conversas, verifica rigorosamente no Supabase se o usuário é participante
            try {
              const { data: participant } = await supabase
                .from("chat_participants" as any)
                .select("id, is_muted")
                .eq("conversation_id", newMsg.conversation_id)
                .eq("user_id", userId)
                .maybeSingle();

              if (!participant) {
                // Usuário NÃO faz parte desta conversa: NENHUMA notificação deve ser emitida!
                return;
              }

              isMuted = Boolean(participant.is_muted);
              // Se for participante (ex: conversa nova criada agora), atualiza a lista de conversas
              void queryClient.invalidateQueries({ queryKey: ["chat_conversations", userId] });
            } catch {
              // Em caso de erro na checagem, por segurança NÃO notifica
              return;
            }
          }

          // 2. Alertas sonoros e visuais: SOMENTE para mensagens de terceiros e se não estiver silenciada
          if (!isSelf && !isMuted) {
            if (newMsg.id && !recentlyAlertedMessageIds.has(newMsg.id)) {
              recentlyAlertedMessageIds.add(newMsg.id);
              setTimeout(() => recentlyAlertedMessageIds.delete(newMsg.id), 8000);

              const isActiveConv = activeConvRef.current === newMsg.conversation_id;
              const isMention =
                Boolean(newMsg.mentions) &&
                (newMsg.mentions.includes(userId) || (targetConv?.type === "group" && newMsg.mentions.includes("todos")));

              const senderMember = getCachedMember(newMsg.sender_id);
              const senderName =
                senderMember?.nickname ||
                senderMember?.nome ||
                newMsg.sender_name ||
                "Alguém";
              const senderAvatar =
                senderMember?.avatar_url ||
                senderMember?.discord_avatar_url ||
                newMsg.sender_avatar ||
                null;

              if (isMention) {
                if (isActiveConv) {
                  chatSound.playMentionSound();
                } else {
                  chatSound.triggerNewMessageAlert({
                    message: newMsg,
                    conversationId: newMsg.conversation_id,
                    senderName,
                    senderAvatar,
                    isMention: true,
                  });
                }
              } else if (!isActiveConv) {
                chatSound.triggerNewMessageAlert({
                  message: newMsg,
                  conversationId: newMsg.conversation_id,
                  senderName,
                  senderAvatar,
                  isMention: false,
                });
              } else {
                // Conversa ativa, sem menção: toca som de chegada
                chatSound.playIncomingMessage();
              }

              if (!senderMember) {
                void fetchChatMembersMap();
              }
            }
          }

          // Formatação legível da prévia da mensagem
          let preview = newMsg.content?.trim();
          if (!preview) {
            if (newMsg.message_type === "audio") preview = "🎤 Mensagem de voz";
            else if (newMsg.message_type === "image") preview = "📷 Foto";
            else if (newMsg.message_type === "video") preview = "🎥 Vídeo";
            else if (newMsg.message_type === "document") preview = `📄 ${newMsg.attachment_name || "Documento"}`;
            else preview = newMsg.attachment_name || "Anexo";
          }

          // 3. Atualização imediata no cache de conversas (para remetente e destinatário)
          queryClient.setQueryData<ChatConversation[]>(["chat_conversations", userId], (old) => {
            if (!old) return old;
            return old
              .map((c) => {
                if (c.id === newMsg.conversation_id) {
                  const isCurrentActive = activeConvRef.current === c.id;
                  const newUnread =
                    !isSelf && !isCurrentActive ? (c.unread_count || 0) + 1 : (isCurrentActive ? 0 : c.unread_count);
                  return {
                    ...c,
                    last_message: preview,
                    last_message_at: newMsg.created_at || new Date().toISOString(),
                    last_message_sender_id: newMsg.sender_id,
                    unread_count: newUnread,
                  };
                }
                return c;
              })
              .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
          });

          // Background revalidation
          void queryClient.invalidateQueries({ queryKey: ["chat_conversations", userId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_conversations",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["chat_conversations", userId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_participants",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["chat_conversations", userId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const totalUnreadCount = (query.data || []).reduce((sum, c) => sum + (c.unread_count || 0), 0);
  const unreadConversationsCount = (query.data || []).filter((c) => (c.unread_count || 0) > 0).length;

  return {
    conversations: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    totalUnreadCount,
    unreadConversationsCount,
    refetch: query.refetch,
  };
}

const PAGE_SIZE = 50;

/**
 * Hook de Sala de Chat com OTIMIZAÇÃO INSTANTÂNEA, RECIBOS DE LEITURA EM TEMPO REAL e LAZY LOADING NO SCROLL.
 */
export function useChatRoom(
  activeConversationId: string | null,
  conversationProp?: ChatConversation | null
) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingCleanersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const channelRef = useRef<any>(null);

  const currentUserId = user?.id;
  const currentUserName = profile?.nickname || profile?.nome || "Membro";
  const currentUserAvatar = profile?.discord_avatar_url || null;

  // Busca histórico inicial (apenas 25 mensagens para abrir instantaneamente em < 30ms)
  const messagesQuery = useQuery({
    queryKey: ["chat_messages", activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return [];
      const initial = await fetchMessages(activeConversationId, PAGE_SIZE, undefined, currentUserId);
      setHasMore(initial.length >= PAGE_SIZE);
      return initial;
    },
    enabled: Boolean(activeConversationId),
    staleTime: 5000,
  });

  // Carrega mais mensagens antigas ao rolar para cima (Lazy Loading)
  const loadMoreMessages = useCallback(async () => {
    if (!activeConversationId || isLoadingMore || !hasMore) return;

    const currentMsgs = queryClient.getQueryData<ChatMessage[]>(["chat_messages", activeConversationId]) || [];
    if (currentMsgs.length === 0) return;

    const oldestMsg = currentMsgs[0];
    if (!oldestMsg?.created_at) return;

    setIsLoadingMore(true);
    try {
      const older = await fetchMessages(activeConversationId, PAGE_SIZE, oldestMsg.created_at, currentUserId);
      if (older.length < PAGE_SIZE) {
        setHasMore(false);
      }
      if (older.length > 0) {
        const existingIds = new Set(currentMsgs.map((m) => m.id));
        const newUnique = older.filter((m) => !existingIds.has(m.id));
        queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], [
          ...newUnique,
          ...currentMsgs,
        ]);
      }
    } catch (err) {
      console.warn("Erro ao carregar histórico anterior:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [activeConversationId, isLoadingMore, hasMore, queryClient]);

  // Marca conversa como lida ao abrir e ao focar na janela, e transmite recibo de leitura em tempo real
  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;

    const triggerMarkAsRead = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const nowIso = new Date().toISOString();
      void markConversationAsRead(activeConversationId, currentUserId).then(() => {
        queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old) => {
          if (!old) return old;
          return old.map((c) => (c.id === activeConversationId ? { ...c, unread_count: 0 } : c));
        });

        if (channelRef.current) {
          void channelRef.current.send({
            type: "broadcast",
            event: "read_receipt",
            payload: {
              conversation_id: activeConversationId,
              user_id: currentUserId,
              read_at: nowIso,
            },
          });
        }
      });
    };

    triggerMarkAsRead();

    const handleFocusOrVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        triggerMarkAsRead();
      }
    };

    window.addEventListener("focus", handleFocusOrVisibility);
    document.addEventListener("visibilitychange", handleFocusOrVisibility);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisibility);
      document.removeEventListener("visibilitychange", handleFocusOrVisibility);
    };
  }, [activeConversationId, currentUserId, queryClient]);

  // Realtime subscription para mensagens, reações e indicador de digitação (Broadcast)
  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;

    const channelName = `chat_room_${activeConversationId}_${currentUserId}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    // 0. Mensagens instantâneas via WebSocket Broadcast (15ms latency)
    channel
      .on("broadcast", { event: "new_message" }, ({ payload }) => {
        const newMsg = payload?.message as ChatMessage;
        if (!newMsg || newMsg.conversation_id !== activeConversationId) return;
        if (newMsg.sender_id === currentUserId) return; // Própria mensagem já adicionada otimisticamente

        // Alerta sonoro de mensagem recebida
        if (newMsg.id && !recentlyAlertedMessageIds.has(newMsg.id)) {
          recentlyAlertedMessageIds.add(newMsg.id);
          setTimeout(() => recentlyAlertedMessageIds.delete(newMsg.id), 8000);

          const isMention =
            Boolean(newMsg.mentions) &&
            (newMsg.mentions.includes(currentUserId) || newMsg.mentions.includes("todos"));

          if (isMention) {
            chatSound.playMentionSound();
          } else {
            chatSound.playIncomingMessage();
          }
        }

        const nowIso = new Date().toISOString();
        if (channelRef.current) {
          void channelRef.current.send({
            type: "broadcast",
            event: "delivery_receipt",
            payload: {
              conversation_id: activeConversationId,
              user_id: currentUserId,
              message_ids: [newMsg.id],
              delivered_at: nowIso,
            },
          });
        }

        if (typeof document === "undefined" || !document.hidden) {
          void markConversationAsRead(activeConversationId, currentUserId);
          if (channelRef.current) {
            void channelRef.current.send({
              type: "broadcast",
              event: "read_receipt",
              payload: {
                conversation_id: activeConversationId,
                user_id: currentUserId,
                read_at: nowIso,
              },
            });
          }
        }

        // Insere imediatamente no cache de mensagens da conversa (0ms)
        queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) => {
          if (old.some((m) => m.id === newMsg.id)) return old;
          return [...old, { ...newMsg, is_self: false }];
        });

        // Atualiza conversa na barra lateral
        queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
          old
            .map((c) =>
              c.id === activeConversationId
                ? {
                    ...c,
                    last_message: newMsg.content || newMsg.attachment_name || "Anexo",
                    last_message_at: newMsg.created_at || nowIso,
                    last_message_sender_id: newMsg.sender_id,
                    unread_count: 0,
                  }
                : c
            )
            .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
        );
      })
      .on("broadcast", { event: "message_saved" }, ({ payload }) => {
        if (!payload?.tempId || !payload?.message) return;
        queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) =>
          old.map((m) => (m.id === payload.tempId ? { ...m, ...payload.message, id: payload.message.id || m.id } : m))
        );
      })

    // 1. Mensagens novas em tempo real
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async (payload) => {
          const newRaw = payload.new as any;
          if (!newRaw || newRaw.conversation_id !== activeConversationId) return;

          // Se a mensagem for de outro usuário, toca som (se ainda não alertado) e marca como lida imediatamente
          if (newRaw.sender_id !== currentUserId) {
            if (newRaw.id && !recentlyAlertedMessageIds.has(newRaw.id)) {
              recentlyAlertedMessageIds.add(newRaw.id);
              setTimeout(() => recentlyAlertedMessageIds.delete(newRaw.id), 8000);

              const isMention =
                Boolean(newRaw.mentions) &&
                (newRaw.mentions.includes(currentUserId) || newRaw.mentions.includes("todos"));

              if (isMention) {
                chatSound.playMentionSound();
              } else {
                chatSound.playIncomingMessage();
              }
            }

            const nowIso = new Date().toISOString();
            if (channelRef.current) {
              void channelRef.current.send({
                type: "broadcast",
                event: "delivery_receipt",
                payload: {
                  conversation_id: activeConversationId,
                  user_id: currentUserId,
                  message_ids: [newRaw.id],
                  delivered_at: nowIso,
                },
              });
            }

            // Se o usuário está com o chat aberto e a aba visível, marca como lida imediatamente
            if (typeof document === "undefined" || !document.hidden) {
              void markConversationAsRead(activeConversationId, currentUserId);
              if (channelRef.current) {
                void channelRef.current.send({
                  type: "broadcast",
                  event: "read_receipt",
                  payload: {
                    conversation_id: activeConversationId,
                    user_id: currentUserId,
                    read_at: nowIso,
                  },
                });
              }
            }
          }

          // Inserção instantânea (0ms) no cache do TanStack Query
          queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) => {
            // Se já existe pelo ID real, não duplica
            if (old.some((m) => m.id === newRaw.id)) return old;

            // Se for mensagem própria enviada por este usuário, reconcilia com a mensagem otimista
            if (newRaw.sender_id === currentUserId) {
              const optIndex = old.findIndex(
                (m) =>
                  m.id.startsWith("optimistic-") &&
                  m.content === newRaw.content &&
                  m.sender_id === currentUserId
              );
              if (optIndex !== -1) {
                const updated = [...old];
                updated[optIndex] = {
                  ...updated[optIndex],
                  id: newRaw.id,
                  created_at: newRaw.created_at || updated[optIndex].created_at,
                  updated_at: newRaw.updated_at || newRaw.created_at || updated[optIndex].updated_at,
                  status: newRaw.status || "sent",
                };
                return updated;
              }
            }

            // Mensagem recebida em tempo real de outro membro
            const senderProfile = getCachedMember(newRaw.sender_id);
            let replyToMessage = null;
            if (newRaw.reply_to_id) {
              const prev = old.find((m) => m && m.id === newRaw.reply_to_id);
              if (prev) {
                replyToMessage = {
                  id: prev.id,
                  sender_id: prev.sender_id,
                  sender_name: prev.sender_name || "Membro",
                  content: prev.content,
                  message_type: prev.message_type || "text",
                  attachment_name: prev.attachment_name,
                  attachment_url: prev.attachment_url,
                };
              }
            }

            const formattedMsg: ChatMessage = {
              id: newRaw.id,
              conversation_id: newRaw.conversation_id,
              sender_id: newRaw.sender_id,
              sender_name: senderProfile?.nickname || senderProfile?.nome || "Membro",
              sender_avatar: senderProfile?.discord_avatar_url || null,
              content: newRaw.content || "",
              status: newRaw.status || "delivered",
              message_type: newRaw.message_type || "text",
              reply_to_id: newRaw.reply_to_id || null,
              reply_to_message: replyToMessage,
              attachment_url: newRaw.attachment_url || null,
              attachment_name: newRaw.attachment_name || null,
              attachment_type: newRaw.attachment_type || null,
              attachment_size: newRaw.attachment_size || null,
              mentions: newRaw.mentions || [],
              reactions: [],
              is_edited: Boolean(newRaw.is_edited),
              is_deleted: Boolean(newRaw.is_deleted || newRaw.is_deleted_for_everyone),
              is_deleted_for_everyone: Boolean(newRaw.is_deleted_for_everyone),
              is_forwarded: Boolean(newRaw.is_forwarded),
              forwarded_from_name: newRaw.forwarded_from_name || null,
              deleted_for_users: newRaw.deleted_for_users || [],
              created_at: newRaw.created_at || new Date().toISOString(),
              updated_at: newRaw.updated_at || newRaw.created_at || new Date().toISOString(),
              is_self: newRaw.sender_id === currentUserId,
            };

            return [...old, formattedMsg];
          });

          // Atualiza lista lateral de conversas instantaneamente
          queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
            old
              .map((c) =>
                c.id === activeConversationId
                  ? {
                      ...c,
                      last_message: newRaw.content || newRaw.attachment_name || "Anexo",
                      last_message_at: newRaw.created_at || new Date().toISOString(),
                      last_message_sender_id: newRaw.sender_id,
                      unread_count: 0,
                    }
                  : c
              )
              .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
          );
        }
      )
      // 2. Atualizações de mensagens (edição, exclusão)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old) => {
            if (!old) return old;
            if (updated.deleted_for_users?.includes(currentUserId)) {
              return old.filter((m) => m.id !== updated.id);
            }
            return old.map((m) =>
              m.id === updated.id
                ? {
                    ...m,
                    content: updated.content,
                    is_edited: Boolean(updated.is_edited),
                    is_deleted: Boolean(updated.is_deleted_for_everyone || updated.is_deleted),
                    is_deleted_for_everyone: Boolean(updated.is_deleted_for_everyone),
                    status: updated.status || m.status,
                    deleted_for_users: updated.deleted_for_users || m.deleted_for_users,
                  }
                : m
            );
          });
        }
      )
      // 3. Reações em tempo real
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_message_reactions",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
        }
      )
      // 4. Alterações na conversa (ex: modo somente administradores ativado/desativado)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_conversations",
          filter: `id=eq.${activeConversationId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
        }
      )
      // 5. Indicador de Digitação via Supabase Broadcast
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!payload || payload.user_id === currentUserId) return;

        const { user_id, user_name } = payload;

        setTypingUsers((prev) => {
          const filtered = prev.filter((u) => u.user_id !== user_id);
          return [...filtered, { user_id, user_name, timestamp: Date.now() }];
        });

        const existingTimer = typingCleanersRef.current.get(user_id);
        if (existingTimer) clearTimeout(existingTimer);

        const newTimer = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.user_id !== user_id));
          typingCleanersRef.current.delete(user_id);
        }, 3000);

        typingCleanersRef.current.set(user_id, newTimer);
      })
      // 6. Recibo de Leitura em tempo real via Broadcast
      .on("broadcast", { event: "read_receipt" }, ({ payload }) => {
        if (!payload || payload.user_id === currentUserId) return;
        const { user_id, read_at } = payload;
        const readTime = new Date(read_at || Date.now()).getTime();

        queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old) => {
          if (!old) return old;
          return old.map((c) => {
            if (c.id !== activeConversationId) return c;
            const updatedParts = (c.participants || []).map((p) =>
              p.user_id === user_id ? { ...p, last_read_at: read_at || new Date().toISOString() } : p
            );
            return { ...c, participants: updatedParts };
          });
        });

        queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) =>
          old.map((m) => {
            if (m.sender_id === currentUserId || m.is_self) {
              return {
                ...m,
                status: "read" as const,
                updated_at: m.updated_at || read_at || new Date().toISOString(),
              };
            }
            return m;
          })
        );
      })
      // 7. Recibo de Entrega em tempo real via Broadcast
      .on("broadcast", { event: "delivery_receipt" }, ({ payload }) => {
        if (!payload || payload.user_id === currentUserId) return;
        const { message_ids, delivered_at } = payload as any;

        queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) =>
          old.map((m) => {
            if (
              (m.sender_id === currentUserId || m.is_self) &&
              m.status === "sent" &&
              (!message_ids || message_ids.includes(m.id))
            ) {
              return {
                ...m,
                status: "delivered" as const,
                updated_at: m.updated_at || delivered_at || new Date().toISOString(),
              };
            }
            return m;
          })
        );
      })
      // 8. Atualizações de participantes no banco (ex: last_read_at)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_participants",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const updatedPart = payload.new as any;
          if (!updatedPart) return;

          queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old) => {
            if (!old) return old;
            return old.map((c) => {
              if (c.id !== activeConversationId) return c;
              const updatedParts = (c.participants || []).map((p) =>
                p.user_id === updatedPart.user_id
                  ? { ...p, last_read_at: updatedPart.last_read_at || p.last_read_at }
                  : p
              );
              return { ...c, participants: updatedParts };
            });
          });

          void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
        }
      )
      .subscribe();

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
      typingCleanersRef.current.forEach((t) => clearTimeout(t));
      typingCleanersRef.current.clear();
    };
  }, [activeConversationId, currentUserId, queryClient]);

  // Transmitir "digitando..."
  const sendTypingNotification = useCallback(() => {
    if (!activeConversationId || !currentUserId) return;

    if (typingTimeoutRef.current) return;

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 1500);

    if (channelRef.current) {
      void channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: {
          user_id: currentUserId,
          user_name: currentUserName,
        },
      });
    }
  }, [activeConversationId, currentUserId, currentUserName]);

  const sendMutation = useMutation({
    mutationFn: async ({
      text,
      messageType = "text",
      attachment,
      replyTo,
    }: {
      text: string;
      messageType?: "text" | "image" | "video" | "audio" | "document" | "system";
      attachment?: {
        url: string;
        name: string;
        type: string;
        size: number;
      } | null;
      replyTo?: ChatMessage | null;
    }) => {
      if (!activeConversationId || !currentUserId) throw new Error("Chat não selecionado");

      let parsedMentions: string[] = [];
      const mentionRegex = /(?:^|\s)@([a-zA-Z0-9_]+)/g;
      const mentionMatches = Array.from(text.matchAll(mentionRegex));
      
      if (mentionMatches.length > 0) {
        const convs = queryClient.getQueryData<ChatConversation[]>(["chat_conversations", currentUserId]);
        const currentConv = convs?.find(c => c.id === activeConversationId);
        if (currentConv && currentConv.participants) {
          const names = mentionMatches.map(m => m[1].toLowerCase());
          const isGroup = currentConv.type === "group";
          const isCreator = isGroup && currentConv.created_by === currentUserId;
          const myPart = currentConv.participants.find(p => p.user_id === currentUserId);
          const isGroupAdmin = isCreator || myPart?.role === "admin" || currentConv.my_role === "admin";

          if (isGroup && isGroupAdmin && names.includes("todos")) {
            parsedMentions.push("todos");
          }

          currentConv.participants.forEach(p => {
            const nick = (p.custom_nickname || p.profile?.nickname || (p as any).nickname || "")?.toLowerCase();
            const nome = (p.profile?.nome || (p as any).nome || "")?.toLowerCase();
            const discordUser = (p.profile?.discord_username || "")?.toLowerCase();
            const nickSnake = nick.replace(/\s+/g, "_");
            const nomeSnake = nome.replace(/\s+/g, "_");

            if (
              (nick && names.includes(nick)) ||
              (nickSnake && names.includes(nickSnake)) ||
              (nome && names.includes(nome)) ||
              (nomeSnake && names.includes(nomeSnake)) ||
              (discordUser && names.includes(discordUser))
            ) {
              if (!parsedMentions.includes(p.user_id)) {
                parsedMentions.push(p.user_id);
              }
            }
          });
        }
      }

      const activeReply = replyTo || replyingTo || null;
      return sendChatMessage(activeConversationId, text, {
        messageType,
        replyToId: activeReply?.id || null,
        attachmentUrl: attachment?.url || null,
        attachmentName: attachment?.name || null,
        attachmentType: attachment?.type || null,
        attachmentSize: attachment?.size || null,
        mentions: parsedMentions,
        senderId: currentUserId,
      });
    },
    onMutate: async ({ text, messageType = "text", attachment, replyTo }) => {
      if (!activeConversationId || !currentUserId) return;

      const activeReply = replyTo || replyingTo || null;
      // Cria mensagem otimista e insere imediatamente no cache do TanStack Query
      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const nowIso = new Date().toISOString();

      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversation_id: activeConversationId,
        sender_id: currentUserId,
        sender_name: currentUserName,
        sender_avatar: currentUserAvatar,
        content: text.trim(),
        status: "sent",
        message_type: messageType,
        reply_to_id: activeReply?.id || null,
        reply_to_message: activeReply ? {
          id: activeReply.id,
          sender_id: activeReply.sender_id,
          sender_name: activeReply.sender_name || "Membro",
          content: activeReply.content,
          message_type: activeReply.message_type || "text",
          attachment_name: activeReply.attachment_name,
          attachment_url: activeReply.attachment_url,
        } : null,
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_type: attachment?.type || null,
        attachment_size: attachment?.size || null,
        mentions: [],
        reactions: [],
        is_edited: false,
        is_deleted: false,
        deleted_for_users: [],
        created_at: nowIso,
        updated_at: nowIso,
        is_self: true,
      };

      // Toca som de envio instantaneamente
      chatSound.playSentMessage();

      // Limpa resposta ativa
      setReplyingTo(null);

      // Insere na lista de mensagens da conversa
      queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) => [
        ...old,
        optimisticMsg,
      ]);

      let optimisticPreview = text.trim();
      if (!optimisticPreview) {
        if (messageType === "audio") optimisticPreview = "🎤 Mensagem de voz";
        else if (messageType === "image") optimisticPreview = "📷 Foto";
        else if (messageType === "video") optimisticPreview = "🎥 Vídeo";
        else if (messageType === "document") optimisticPreview = `📄 ${attachment?.name || "Documento"}`;
        else optimisticPreview = attachment?.name || "Anexo";
      }

      // Atualiza lista lateral de conversas instantaneamente
      queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
        old
          .map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  last_message: optimisticPreview,
                  last_message_at: nowIso,
                  last_message_sender_id: currentUserId,
                }
              : c
          )
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );

      // Envia broadcast instantâneo (15ms) para todos conectados nesta conversa
      if (channelRef.current) {
        void channelRef.current.send({
          type: "broadcast",
          event: "new_message",
          payload: { message: optimisticMsg },
        });
      }

      return { tempId };
    },
    onSuccess: (savedMsg, _, context) => {
      // Substitui o tempId pelo ID real retornado pelo Supabase
      if (context?.tempId && savedMsg) {
        queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) =>
          old.map((m) => (m.id === context.tempId ? { ...m, ...savedMsg, id: savedMsg.id || m.id } : m))
        );

        if (channelRef.current) {
          void channelRef.current.send({
            type: "broadcast",
            event: "message_saved",
            payload: { tempId: context.tempId, message: savedMsg },
          });
        }
      }
    },
    onError: (err: any, _, context) => {
      // Remove a mensagem otimista em caso de falha
      if (context?.tempId) {
        queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) =>
          old.filter((m) => m.id !== context.tempId)
        );
      }
      toast.error(err.message || "Erro ao enviar mensagem.");
    },
  });

  // Enviar anexo (arquivo / foto / vídeo / documento)
  const sendAttachment = async (file: File, caption = "") => {
    const currentReply = replyingTo;
    try {
      setUploadProgress(15);
      const res = await uploadChatAttachment(file, (pct) => setUploadProgress(pct));

      let mType: "image" | "video" | "audio" | "document" = "document";
      if (file.type.startsWith("image/")) mType = "image";
      else if (file.type.startsWith("video/")) mType = "video";
      else if (file.type.startsWith("audio/")) mType = "audio";

      await sendMutation.mutateAsync({
        text: caption.trim() || res.name,
        messageType: mType,
        attachment: res,
        replyTo: currentReply,
      });
    } catch (err: any) {
      toast.error(`Falha no upload: ${err.message || err}`);
    } finally {
      setUploadProgress(null);
    }
  };

  // Reagir com emoji com OTIMIZAÇÃO INSTANTÂNEA
  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      await toggleMessageReaction(messageId, emoji);
    },
    onMutate: async ({ messageId, emoji }) => {
      if (!currentUserId) return;
      queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) =>
        old.map((m) => {
          if (m.id !== messageId) return m;
          const currentReactions = m.reactions || [];
          const existing = currentReactions.find((r) => r.emoji === emoji);
          let nextReactions;
          if (existing) {
            const hasReacted = existing.users.some((u) => u.user_id === currentUserId);
            if (hasReacted) {
              const updatedUsers = existing.users.filter((u) => u.user_id !== currentUserId);
              nextReactions =
                updatedUsers.length === 0
                  ? currentReactions.filter((r) => r.emoji !== emoji)
                  : currentReactions.map((r) =>
                      r.emoji === emoji ? { ...r, count: updatedUsers.length, users: updatedUsers } : r
                    );
            } else {
              nextReactions = currentReactions.map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count + 1,
                      users: [...r.users, { user_id: currentUserId, user_name: currentUserName }],
                    }
                  : r
              );
            }
          } else {
            nextReactions = [
              ...currentReactions,
              { emoji, count: 1, users: [{ user_id: currentUserId, user_name: currentUserName }] },
            ];
          }
          return { ...m, reactions: nextReactions };
        })
      );
    },
    onError: (err: any) => {
      void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
      toast.error(err.message || "Erro ao reagir.");
    },
  });

  // Editar mensagem com OTIMIZAÇÃO INSTANTÂNEA
  const editMutation = useMutation({
    mutationFn: async ({ messageId, newContent }: { messageId: string; newContent: string }) => {
      await editChatMessage(messageId, newContent, currentUserId);
    },
    onMutate: async ({ messageId, newContent }) => {
      queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) =>
        old.map((m) => (m.id === messageId ? { ...m, content: newContent, is_edited: true } : m))
      );
    },
    onSuccess: () => {
      toast.success("Mensagem editada!");
    },
    onError: (err: any) => {
      void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
      toast.error(err.message || "Erro ao editar mensagem.");
    },
  });

  // Excluir mensagem com OTIMIZAÇÃO INSTANTÂNEA
  const deleteMutation = useMutation({
    mutationFn: async ({ messageId, forEveryone }: { messageId: string; forEveryone: boolean }) => {
      await deleteChatMessage(messageId, forEveryone, currentUserId);
    },
    onMutate: async ({ messageId, forEveryone }) => {
      queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) => {
        if (forEveryone) {
          return old.map((m) =>
            m.id === messageId
              ? { ...m, is_deleted: true, is_deleted_for_everyone: true, content: "🚫 Mensagem apagada" }
              : m
          );
        }
        return old.filter((m) => m.id !== messageId);
      });
    },
    onSuccess: () => {
      toast.success("Mensagem apagada.");
    },
    onError: (err: any) => {
      void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
      toast.error(err.message || "Erro ao apagar mensagem.");
    },
  });

  // Filtra mensagens não apagadas para o usuário atual e resolve status dinamicamente estilo WhatsApp
  const visibleMessages = useMemo(() => {
    const raw = (messagesQuery.data || []).filter(
      (m) => !m.deleted_for_users?.includes(currentUserId || "")
    );

    const conv =
      conversationProp ||
      queryClient
        .getQueryData<ChatConversation[]>(["chat_conversations", currentUserId])
        ?.find((c) => c.id === activeConversationId);

    const participants = conv?.participants || [];

    return raw.map((m) => {
      if (m.is_self || m.sender_id === currentUserId) {
        const resolved = resolveMessageStatus(m, participants, currentUserId);
        if (resolved !== m.status) {
          if (!m.id.startsWith("optimistic-") && (resolved === "delivered" || resolved === "read")) {
            void syncMessageStatusInDb(m.id, resolved);
          }
          return { ...m, status: resolved };
        }
      }
      return m;
    });
  }, [messagesQuery.data, conversationProp, activeConversationId, currentUserId, queryClient]);

  return {
    messages: visibleMessages,
    isLoading: messagesQuery.isLoading,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    isSending: sendMutation.isPending,
    uploadProgress,
    typingUsers,
    replyingTo,
    setReplyingTo,
    sendMessage: (text: string) => {
      const currentReply = replyingTo;
      return sendMutation.mutateAsync({ text, replyTo: currentReply });
    },
    sendAttachment,
    toggleReaction: (messageId: string, emoji: string) => reactMutation.mutate({ messageId, emoji }),
    editMessage: (messageId: string, newContent: string) => editMutation.mutateAsync({ messageId, newContent }),
    deleteMessage: (messageId: string, forEveryone = false) => deleteMutation.mutateAsync({ messageId, forEveryone }),
    sendTypingNotification,
  };
}
