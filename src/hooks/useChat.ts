import { useState, useEffect, useCallback, useRef } from "react";
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
        (payload) => {
          const newMsg = payload.new as any;

          // Se a mensagem veio de outra pessoa e não é a conversa ativa no momento, toca som de notificação
          if (newMsg.sender_id !== userId) {
            if (activeConvRef.current !== newMsg.conversation_id) {
              chatSound.playIncomingMessage();
            }
          }

          // Atualização imediata no cache de conversas sem bloquear o render
          queryClient.setQueryData<ChatConversation[]>(["chat_conversations", userId], (old) => {
            if (!old) return old;
            const preview = newMsg.content || newMsg.attachment_name || "Anexo";
            return old
              .map((c) => {
                if (c.id === newMsg.conversation_id) {
                  const isCurrentActive = activeConvRef.current === c.id;
                  const newUnread =
                    newMsg.sender_id !== userId && !isCurrentActive ? (c.unread_count || 0) + 1 : c.unread_count;
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

  return {
    conversations: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    totalUnreadCount,
    refetch: query.refetch,
  };
}

/**
 * Hook de Sala de Chat com OTIMIZAÇÃO INSTANTÂNEA (Optimistic UI 0ms delay).
 */
export function useChatRoom(activeConversationId: string | null) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingCleanersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const channelRef = useRef<any>(null);

  const currentUserId = user?.id;
  const currentUserName = profile?.nickname || profile?.nome || "Membro";
  const currentUserAvatar = profile?.discord_avatar_url || null;

  // Busca histórico de mensagens da conversa
  const messagesQuery = useQuery({
    queryKey: ["chat_messages", activeConversationId],
    queryFn: () => (activeConversationId ? fetchMessages(activeConversationId) : Promise.resolve([])),
    enabled: Boolean(activeConversationId),
    staleTime: 5000,
  });

  // Marca conversa como lida ao abrir
  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;
    void markConversationAsRead(activeConversationId, currentUserId).then(() => {
      queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old) => {
        if (!old) return old;
        return old.map((c) => (c.id === activeConversationId ? { ...c, unread_count: 0 } : c));
      });
    });
  }, [activeConversationId, currentUserId, queryClient]);

  // Realtime subscription para mensagens, reações e indicador de digitação (Broadcast)
  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;

    const channelName = `chat_room_${activeConversationId}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

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

          // Se a mensagem for de outro usuário, toca som sutil e marca lida imediatamente
          if (newRaw.sender_id !== currentUserId) {
            chatSound.playIncomingMessage();
            void markConversationAsRead(activeConversationId, currentUserId);
          }

          // Atualiza cache de mensagens sem piscar a tela
          void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
          void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
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
            return old.map((m) =>
              m.id === updated.id
                ? {
                    ...m,
                    content: updated.content,
                    is_edited: Boolean(updated.is_edited),
                    is_deleted: Boolean(updated.is_deleted),
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

  // Mutation de envio com ATUALIZAÇÃO OTIMISTA INSTANTÂNEA (0ms)
  const sendMutation = useMutation({
    mutationFn: async ({
      text,
      messageType = "text",
      attachment,
    }: {
      text: string;
      messageType?: "text" | "image" | "video" | "audio" | "document" | "system";
      attachment?: {
        url: string;
        name: string;
        type: string;
        size: number;
      } | null;
    }) => {
      if (!activeConversationId || !currentUserId) throw new Error("Chat não selecionado");

      return sendChatMessage(activeConversationId, text, {
        messageType,
        replyToId: replyingTo?.id || null,
        attachmentUrl: attachment?.url || null,
        attachmentName: attachment?.name || null,
        attachmentType: attachment?.type || null,
        attachmentSize: attachment?.size || null,
      });
    },
    onMutate: async ({ text, messageType = "text", attachment }) => {
      if (!activeConversationId || !currentUserId) return;

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
        reply_to_id: replyingTo?.id || null,
        reply_to_message: replyingTo || null,
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

      // Atualiza lista lateral de conversas instantaneamente
      queryClient.setQueryData<ChatConversation[]>(["chat_conversations", currentUserId], (old = []) =>
        old
          .map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  last_message: text.trim() || attachment?.name || "Anexo",
                  last_message_at: nowIso,
                  last_message_sender_id: currentUserId,
                }
              : c
          )
          .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
      );

      return { tempId };
    },
    onSuccess: (savedMsg, _, context) => {
      // Substitui o tempId pelo ID real retornado pelo Supabase
      if (context?.tempId && savedMsg) {
        queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) =>
          old.map((m) => (m.id === context.tempId ? { ...m, ...savedMsg, id: savedMsg.id || m.id } : m))
        );
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
      await editChatMessage(messageId, newContent);
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
      await deleteChatMessage(messageId, forEveryone);
    },
    onMutate: async ({ messageId, forEveryone }) => {
      queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (old = []) => {
        if (forEveryone) {
          return old.map((m) => (m.id === messageId ? { ...m, is_deleted: true, content: "Mensagem apagada" } : m));
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

  // Filtra mensagens não apagadas para o usuário atual
  const visibleMessages = (messagesQuery.data || []).filter(
    (m) => !m.deleted_for_users?.includes(currentUserId || "")
  );

  return {
    messages: visibleMessages,
    isLoading: messagesQuery.isLoading,
    isSending: sendMutation.isPending,
    uploadProgress,
    typingUsers,
    replyingTo,
    setReplyingTo,
    sendMessage: (text: string) => sendMutation.mutateAsync({ text }),
    sendAttachment,
    toggleReaction: (messageId: string, emoji: string) => reactMutation.mutate({ messageId, emoji }),
    editMessage: (messageId: string, newContent: string) => editMutation.mutateAsync({ messageId, newContent }),
    deleteMessage: (messageId: string, forEveryone = false) => deleteMutation.mutateAsync({ messageId, forEveryone }),
    sendTypingNotification,
  };
}
