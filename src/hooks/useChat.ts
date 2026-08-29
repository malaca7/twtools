import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchUserConversations,
  fetchMessages,
  sendChatMessage,
  markConversationAsRead,
  getOrCreatePrivateConversation,
  createGroupConversation,
  addGroupMembers,
  removeGroupMember,
  updateGroupInfo,
} from "@/services/chatService";
import type {
  ChatConversation,
  ChatMessage,
  CreateGroupPayload,
  TypingUser,
} from "@/types/chat";
import { toast } from "sonner";

/**
 * Hook para listar e sincronizar em tempo real todas as conversas do usuário.
 */
export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ["chat_conversations", userId],
    queryFn: () => (userId ? fetchUserConversations(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
    refetchInterval: 15000,
  });

  // Supabase Realtime subscription for conversation updates and unread counts
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime-user-chat-conversations-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
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
 * Hook para gerenciar uma sala de chat ativa (mensagens em tempo real, envio e indicador de digitação).
 */
export function useChatRoom(activeConversationId: string | null) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingCleanersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const currentUserId = user?.id;
  const currentUserName = profile?.nickname || profile?.nome || "Membro";

  // Busca histórico de mensagens da conversa
  const messagesQuery = useQuery({
    queryKey: ["chat_messages", activeConversationId],
    queryFn: () => (activeConversationId ? fetchMessages(activeConversationId) : Promise.resolve([])),
    enabled: Boolean(activeConversationId),
  });

  // Marca conversa como lida ao abrir
  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;
    void markConversationAsRead(activeConversationId, currentUserId).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
    });
  }, [activeConversationId, currentUserId, queryClient]);

  // Realtime subscription para mensagens e indicador de digitação (Broadcast)
  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;

    const channelName = `chat_room_${activeConversationId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    // 1. Recebe mensagens novas em tempo real
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          const convs = queryClient.getQueryData<ChatConversation[]>(["chat_conversations", currentUserId]) || [];
          const activeConv = convs.find((c) => c.id === activeConversationId);
          const senderPart = activeConv?.participants?.find((p) => p.user_id === newMsg.sender_id);
          const senderProf = senderPart?.profile;

          const sName = newMsg.sender_id === currentUserId
            ? (profile?.nickname || profile?.nome || "Você")
            : (senderProf?.nickname || senderProf?.nome || senderProf?.discord_username || "Membro");
          const sNickname = newMsg.sender_id === currentUserId ? (profile?.nickname || null) : (senderProf?.nickname || null);
          const sGameId = newMsg.sender_id === currentUserId ? (profile?.game_id || null) : (senderProf?.game_id || null);
          const sAvatar = newMsg.sender_id === currentUserId
            ? (profile?.discord_avatar_url || profile?.avatar_url || null)
            : (senderProf?.discord_avatar_url || null);

          queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (prev = []) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                id: newMsg.id,
                conversation_id: newMsg.conversation_id,
                sender_id: newMsg.sender_id,
                content: newMsg.content,
                status: newMsg.status || "sent",
                created_at: newMsg.created_at,
                updated_at: newMsg.updated_at,
                sender_name: sName,
                sender_nickname: sNickname,
                sender_game_id: sGameId,
                sender_avatar: sAvatar,
                is_self: newMsg.sender_id === currentUserId,
              },
            ];
          });

          // Se a mensagem veio de outra pessoa e estamos com o chat aberto, marca como lida
          if (newMsg.sender_id !== currentUserId) {
            void markConversationAsRead(activeConversationId, currentUserId);
          }
        }
      )
      // 2. Recebe atualizações de status de mensagem (ex: read/delivered)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (prev = []) => {
            return prev.map((m) => (m.id === updatedMsg.id ? { ...m, status: updatedMsg.status } : m));
          });
        }
      )
      // 3. Recebe evento de Digitação via Supabase Broadcast
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (!payload || payload.user_id === currentUserId) return;

        const { user_id, user_name } = payload;

        setTypingUsers((prev) => {
          const filtered = prev.filter((u) => u.user_id !== user_id);
          return [...filtered, { user_id, user_name, timestamp: Date.now() }];
        });

        // Limpa indicador após 3.5s
        const existingTimer = typingCleanersRef.current.get(user_id);
        if (existingTimer) clearTimeout(existingTimer);

        const newTimer = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.user_id !== user_id));
          typingCleanersRef.current.delete(user_id);
        }, 3500);

        typingCleanersRef.current.set(user_id, newTimer);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      typingCleanersRef.current.forEach((t) => clearTimeout(t));
      typingCleanersRef.current.clear();
    };
  }, [activeConversationId, currentUserId, queryClient]);

  // Função para transmitir "estou digitando..." via broadcast
  const sendTypingNotification = useCallback(() => {
    if (!activeConversationId || !currentUserId) return;

    if (typingTimeoutRef.current) return; // Throttle 2.5s

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2500);

    const channelName = `chat_room_${activeConversationId}`;
    const channel = supabase.channel(channelName);
    void channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: currentUserId,
        user_name: currentUserName,
      },
    });
  }, [activeConversationId, currentUserId, currentUserName]);

  // Mutation de envio de mensagem com atualização otimista
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!activeConversationId || !currentUserId) throw new Error("Chat não selecionado");
      return sendChatMessage(activeConversationId, currentUserId, text);
    },
    onMutate: async (text: string) => {
      await queryClient.cancelQueries({ queryKey: ["chat_messages", activeConversationId] });
      const previous = queryClient.getQueryData<ChatMessage[]>(["chat_messages", activeConversationId]) || [];

      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversation_id: activeConversationId!,
        sender_id: currentUserId!,
        content: text,
        status: "sending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender_name: currentUserName,
        sender_avatar: profile?.discord_avatar_url || null,
        is_self: true,
      };

      queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], [...previous, optimisticMsg]);
      return { previous, tempId };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["chat_messages", activeConversationId], context.previous);
      }
      toast.error(`Erro ao enviar mensagem: ${(err as any).message || err}`);
    },
    onSuccess: (savedMsg, _, context) => {
      queryClient.setQueryData<ChatMessage[]>(["chat_messages", activeConversationId], (prev = []) => {
        return prev.map((m) => (m.id === context?.tempId ? { ...savedMsg, sender_name: currentUserName } : m));
      });
      void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    isSending: sendMutation.isPending,
    typingUsers,
    sendMessage: sendMutation.mutateAsync,
    sendTypingNotification,
  };
}
