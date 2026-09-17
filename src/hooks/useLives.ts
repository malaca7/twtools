import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMemberStreamAccounts,
  fetchStreamSessions,
  fetchUserStreamPreferences,
  saveUserStreamPreferences,
  linkStreamAccount,
  unlinkStreamAccount,
  toggleStreamAccountActive,
  fetchStreamSystemConfig,
  saveStreamSystemConfig,
  fetchStreamIntegrationLogs,
  simulateLiveEvent,
  startQuickStreamSession,
  endStreamSession,
  purgeStreamHistory,
} from "@/services/liveStreamService";
import type {
  MemberStreamAccount,
  StreamSession,
  MemberStreamPreferences,
  StreamSystemConfig,
  StreamIntegrationLog,
  LinkStreamAccountPayload,
  StreamPlatform,
} from "@/types/lives";

export function useMemberStreamAccounts() {
  const queryClient = useQueryClient();

  // Supabase Realtime subscription
  useEffect(() => {
    const channelName = `tw_member_stream_accounts_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "member_stream_accounts" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["member_stream_accounts"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["member_stream_accounts"],
    queryFn: fetchMemberStreamAccounts,
    staleTime: 5000,
  });
}

export function useStreamSessions(options?: { isLiveOnly?: boolean; limit?: number }) {
  const queryClient = useQueryClient();

  // Supabase Realtime subscription para atualizações instantâneas de status ONLINE/OFFLINE
  useEffect(() => {
    const channelName = `tw_stream_sessions_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stream_sessions" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["stream_sessions"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["stream_sessions", options?.isLiveOnly, options?.limit],
    queryFn: () => fetchStreamSessions(options),
    staleTime: 3000,
    refetchInterval: 15000, // Atualiza métricas e contadores a cada 15 segundos
    refetchOnWindowFocus: true,
  });
}

export function useUserStreamPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["member_stream_preferences", user?.id],
    queryFn: () => fetchUserStreamPreferences(user?.id),
    enabled: Boolean(user?.id),
    staleTime: 60000,
  });

  const mutation = useMutation({
    mutationFn: (prefs: MemberStreamPreferences) => saveUserStreamPreferences(prefs),
    onSuccess: (saved) => {
      queryClient.setQueryData(["member_stream_preferences", user?.id], saved);
      toast.success("Preferências de lives atualizadas com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Falha ao salvar preferências: " + (err?.message || "Erro desconhecido"));
    },
  });

  return {
    ...query,
    preferences: query.data,
    updatePreferences: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

export function useStreamSystemConfig() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["stream_system_config"],
    queryFn: fetchStreamSystemConfig,
    staleTime: 10000,
  });

  const mutation = useMutation({
    mutationFn: (config: Partial<StreamSystemConfig>) => saveStreamSystemConfig(config, user?.id),
    onSuccess: (saved) => {
      queryClient.setQueryData(["stream_system_config"], saved);
      toast.success("Configurações das plataformas salvas com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Falha ao salvar configurações: " + (err?.message || "Erro desconhecido"));
    },
  });

  return {
    ...query,
    config: query.data,
    updateConfig: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

export function useStreamIntegrationLogs(limit: number = 100) {
  return useQuery({
    queryKey: ["stream_integration_logs", limit],
    queryFn: () => fetchStreamIntegrationLogs(limit),
    staleTime: 5000,
    refetchInterval: 10000,
  });
}

export function useLinkStreamAccount() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: (payload: LinkStreamAccountPayload) => {
      if (!user?.id) throw new Error("Usuário não autenticado.");
      return linkStreamAccount(user.id, payload, {
        nome: profile?.nome,
        nickname: profile?.nickname,
        avatar_url: profile?.avatar_url || profile?.discord_avatar_url,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["member_stream_accounts"] });
      toast.success("Canal de transmissão vinculado com sucesso!", {
        description: "Seu canal agora é monitorado automaticamente pela plataforma.",
      });
    },
    onError: (err: any) => {
      toast.error("Erro ao vincular canal: " + (err?.message || "Erro desconhecido"));
    },
  });
}

export function useUnlinkStreamAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => unlinkStreamAccount(accountId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["member_stream_accounts"] });
      toast.success("Conta de transmissão desvinculada com sucesso.");
    },
    onError: (err: any) => {
      toast.error("Erro ao desvincular: " + (err?.message || "Erro desconhecido"));
    },
  });
}

export function useToggleStreamAccountActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, isActive }: { accountId: string; isActive: boolean }) =>
      toggleStreamAccountActive(accountId, isActive),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["member_stream_accounts"] });
      toast.success(
        vars.isActive
          ? "Detecção de live ativada para este canal."
          : "Detecção de live pausada para este canal."
      );
    },
    onError: (err: any) => {
      toast.error("Erro ao alternar status: " + (err?.message || "Erro desconhecido"));
    },
  });
}

export function useSimulateLiveEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (params: Parameters<typeof simulateLiveEvent>[0]) => simulateLiveEvent(params, user?.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stream_sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["stream_integration_logs"] });
      toast.success("Live simulada injetada com sucesso!", {
        description: "Notificação emitida em tempo real para todos os clientes online.",
      });
    },
    onError: (err: any) => {
      toast.error("Falha ao simular live: " + (err?.message || "Erro desconhecido"));
    },
  });
}

export function useEndStreamSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => endStreamSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stream_sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["stream_integration_logs"] });
      toast.info("Transmissão encerrada e movida para o histórico.");
    },
  });
}

export function usePurgeStreamHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purgeStreamHistory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stream_sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["stream_integration_logs"] });
      toast.success("Histórico de lives e logs limpos com sucesso.");
    },
  });
}

export function useStartQuickStreamSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (payload: {
      platform: StreamPlatform;
      channel_name: string;
      streamer_name: string;
      title: string;
      category?: string;
      stream_url?: string;
      stream_account_id?: string;
      thumbnail_url?: string;
    }) => startQuickStreamSession(payload, user?.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["stream_sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["stream_integration_logs"] });
      toast.success("Transmissão ao vivo iniciada com sucesso! 🔴", {
        description: "Alerta em tempo real disparado para todos os membros online.",
      });
    },
    onError: (err: any) => {
      toast.error("Falha ao iniciar live: " + (err?.message || "Erro desconhecido"));
    },
  });
}
