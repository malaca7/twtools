import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { playNotificationChimeSound } from "@/lib/sound-effects";
import {
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationsRealtimeChannel,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from "@/lib/notifications-api";
import type { AppNotification, CreateNotificationPayload } from "@/types/notifications";

export function useNotifications() {
  const { user, level } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isNotificationSoundEnabled());

  // Rastrear IDs de notificações já alertadas para não repetir o som/toast
  const notifiedIdsRef = useRef<Set<string>>(new Set());

  // Atualizar estado de som quando alternado
  useEffect(() => {
    const handleSoundToggle = (e: any) => {
      setSoundEnabledState(Boolean(e.detail?.enabled));
    };
    window.addEventListener("tw_notifications_sound_toggle", handleSoundToggle);
    return () => {
      window.removeEventListener("tw_notifications_sound_toggle", handleSoundToggle);
    };
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setNotificationSoundEnabled(next);
    if (next) {
      playNotificationChimeSound(60);
      toast.success("Efeitos sonoros de notificação ativados.");
    } else {
      toast.info("Notificações silenciadas.");
    }
  }, [soundEnabled]);

  // Listener em tempo real (CustomEvent, BroadcastChannel, Storage, Supabase Realtime)
  useEffect(() => {
    if (!user?.id) return;

    const handleUpdate = (e?: any) => {
      const detail = e?.detail;

      // Se recebemos os dados de uma nova notificação através do evento em tempo real
      if (detail && detail.id && detail.title && detail.created_at) {
        const notif = detail as AppNotification;
        const isTarget = notif.user_id === "all" || notif.user_id === user.id;
        const isRoleTarget = !notif.target_roles || !level || notif.target_roles.includes(level);
        const isNotSender = notif.sender_id !== user.id;

        if (isTarget && isRoleTarget && isNotSender && !notifiedIdsRef.current.has(notif.id)) {
          notifiedIdsRef.current.add(notif.id);

          // Tocar chime sonoro
          if (isNotificationSoundEnabled()) {
            playNotificationChimeSound(60);
          }

          // Exibir toast instantâneo no canto superior da tela
          toast(notif.title, {
            description: notif.message,
            duration: 6500,
            action: notif.link
              ? {
                  label: "Visualizar",
                  onClick: () => {
                    void markNotificationAsRead(notif.id, user.id);
                    navigate({ to: notif.link as any });
                  },
                }
              : undefined,
          });
        }
      }

      // Invalidar cache do React Query
      void queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
    };

    // 1. Ouvir evento customizado da mesma aba
    window.addEventListener("tw_notifications_updated", handleUpdate);

    // 2. Ouvir BroadcastChannel de outras abas no mesmo navegador
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("tw_notifications_channel");
      bc.onmessage = (msg) => {
        handleUpdate({ detail: msg.data?.payload });
      };
    } catch {}

    // 3. Ouvir storage events (outras abas)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tw_notifications_v1" || e.key === "tw_notifications_sync_ping") {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Inicializar canal WebSocket do Supabase Realtime
    try {
      getNotificationsRealtimeChannel();
    } catch {}

    return () => {
      window.removeEventListener("tw_notifications_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
    };
  }, [user?.id, level, queryClient, navigate]);

  // Consulta TanStack Query
  const query = useQuery({
    queryKey: ["notifications", user?.id, level],
    queryFn: () => getNotifications(user?.id, level),
    enabled: Boolean(user?.id),
    staleTime: 1000,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const notifications = query.data || [];
  const unreadNotifications = notifications.filter(
    (n) => !Array.isArray(n.read_by) || !n.read_by.includes(user?.id || "")
  );
  const unreadCount = unreadNotifications.length;
  const hasUnread = unreadCount > 0;

  return {
    ...query,
    notifications,
    unreadNotifications,
    unreadCount,
    hasUnread,
    soundEnabled,
    toggleSound,
  };
}

export function useMarkNotificationAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!user?.id) return Promise.resolve();
      return markNotificationAsRead(notificationId, user.id);
    },
    onMutate: async (notificationId: string) => {
      if (!user?.id) return;
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Atualização otimista
      queryClient.setQueriesData<AppNotification[]>({ queryKey: ["notifications"] }, (old = []) => {
        return old.map((n) => {
          if (n.id === notificationId) {
            const readBy = Array.isArray(n.read_by) ? [...n.read_by] : [];
            if (!readBy.includes(user.id)) readBy.push(user.id);
            return { ...n, read_by: readBy };
          }
          return n;
        });
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const { user, level } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!user?.id) return Promise.resolve();
      return markAllNotificationsAsRead(user.id, level);
    },
    onMutate: async () => {
      if (!user?.id) return;
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Atualização otimista
      queryClient.setQueriesData<AppNotification[]>({ queryKey: ["notifications"] }, (old = []) => {
        return old.map((n) => {
          const readBy = Array.isArray(n.read_by) ? [...n.read_by] : [];
          if (!readBy.includes(user.id)) readBy.push(user.id);
          return { ...n, read_by: readBy };
        });
      });
    },
    onSuccess: () => {
      toast.success("Todas as notificações foram marcadas como lidas.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!user?.id) return Promise.resolve();
      return deleteNotification(notificationId, user.id);
    },
    onMutate: async (notificationId: string) => {
      if (!user?.id) return;
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Atualização otimista: remover da visualização
      queryClient.setQueriesData<AppNotification[]>({ queryKey: ["notifications"] }, (old = []) => {
        return old.filter((n) => n.id !== notificationId);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useClearAllNotifications() {
  const { user, level } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!user?.id) return Promise.resolve();
      return clearAllNotifications(user.id, level);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      queryClient.setQueriesData<AppNotification[]>({ queryKey: ["notifications"] }, () => []);
    },
    onSuccess: () => {
      toast.success("Histórico de notificações limpo com sucesso.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNotificationPayload) => createNotification(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
