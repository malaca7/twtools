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
    refetchInterval: 20000,
  });

  // Supabase Realtime subscription for conversation updates and unread counts
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime-global-chat-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const newMsg = payload.new as any;
          void queryClient.invalidateQueries({ queryKey: ["chat_conversations", userId] });

          // Se a mensagem veio de outra pessoa e não é a conversa ativa no momento, toca som de notificação
          if (newMsg.sender_id !== userId) {
            if (activeConvRef.current !== newMsg.conversation_id) {
              chatSound.playIncomingMessage();
            }
          }
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
 * Hook para gerenciar uma sala de chat ativa (mensagens em tempo real, envio, reações, respostas, edição e anexos).
 */
export function useChatRoom(activeConversationId: string | null) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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

  // Realtime subscription para mensagens, reações e indicador de digitação (Broadcast)
  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;

    const channelName = `chat_room_${activeConversationId}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

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

          // Se a mensagem veio de outra pessoa, toca som sutil de mensagem recebida
          if (newRaw.sender_id !== currentUserId) {
            chatSound.playIncomingMessage();
            void markConversationAsRead(activeConversationId, currentUserId);
          }

          // Invalida query para sincronização rica de participantes e replies
          void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
          void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
        }
      )
      // 2. Atualizações de mensagens (edição, exclusão, status lido)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
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

  // Transmitir "digitando..."
  const sendTypingNotification = useCallback(() => {
    if (!activeConversationId || !currentUserId) return;

    if (typingTimeoutRef.current) return;

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

  // Mutation de envio de mensagem
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
    onSuccess: () => {
      chatSound.playSentMessage();
      setReplyingTo(null);
      void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
      void queryClient.invalidateQueries({ queryKey: ["chat_conversations", currentUserId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao enviar mensagem.");
    },
  });

  // Enviar anexo (arquivo / foto / vídeo / documento)
  const sendAttachment = async (file: File, caption = "") => {
    try {
      setUploadProgress(10);
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

  // Reagir com emoji
  const reactMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      await toggleMessageReaction(messageId, emoji);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao reagir.");
    },
  });

  // Editar mensagem
  const editMutation = useMutation({
    mutationFn: async ({ messageId, newContent }: { messageId: string; newContent: string }) => {
      await editChatMessage(messageId, newContent);
    },
    onSuccess: () => {
      toast.success("Mensagem editada!");
      void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao editar mensagem.");
    },
  });

  // Excluir mensagem
  const deleteMutation = useMutation({
    mutationFn: async ({ messageId, forEveryone }: { messageId: string; forEveryone: boolean }) => {
      await deleteChatMessage(messageId, forEveryone);
    },
    onSuccess: () => {
      toast.success("Mensagem apagada.");
      void queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
    },
    onError: (err: any) => {
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
