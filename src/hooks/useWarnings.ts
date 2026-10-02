import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  getWarnings,
  createWarning,
  updateWarning,
  revokeWarning,
  deleteWarning,
  acknowledgeWarning,
  getWarningsRealtimeChannel,
  WARNINGS_REALTIME_EVENT,
} from "@/services/warningsService";
import type {
  MemberWarning,
  CreateWarningPayload,
  UpdateWarningPayload,
} from "@/types/warnings";
import { useAuth } from "@/hooks/useAuth";

export const WARNINGS_QUERY_KEY = ["member_warnings"] as const;

/**
 * Hook para obter a lista completa de advertências e suspensões com sincronização em tempo real
 */
export function useWarnings() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Garante que o canal Supabase Realtime esteja conectado
    getWarningsRealtimeChannel();

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: WARNINGS_QUERY_KEY });
    };

    window.addEventListener(WARNINGS_REALTIME_EVENT, handleUpdate);
    window.addEventListener("storage", (e) => {
      if (e.key === "tw_warnings_sync_ping") {
        queryClient.invalidateQueries({ queryKey: WARNINGS_QUERY_KEY });
      }
    });

    return () => {
      window.removeEventListener(WARNINGS_REALTIME_EVENT, handleUpdate);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: WARNINGS_QUERY_KEY,
    queryFn: getWarnings,
    staleTime: 1000 * 30, // 30 segundos
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook para obter advertências e suspensões de um membro específico
 */
export function useMemberWarnings(memberId?: string | null) {
  const { data: warnings = [], ...rest } = useWarnings();

  const memberWarnings = useMemo(() => {
    if (!memberId) return [];
    return warnings
      .filter((w) => w.member_id === memberId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [warnings, memberId]);

  return { data: memberWarnings, ...rest };
}

/**
 * Hook para verificar se o membro possui uma suspensão ativa com restrições funcionais
 */
export function useActiveSuspension(memberId?: string | null) {
  const { data: warnings = [] } = useWarnings();

  return useMemo(() => {
    if (!memberId) return null;
    const now = new Date().toISOString();

    const activeSusp = warnings.find((w) => {
      if (w.member_id !== memberId) return false;
      if (w.status !== "ativo") return false;
      if (!w.is_suspension && w.type !== "suspensao") return false;
      // Se tiver data de término, checar se ainda não passou
      if (w.ends_at && w.ends_at <= now) return false;
      return true;
    });

    return activeSusp || null;
  }, [warnings, memberId]);
}

/**
 * Mutation para criar uma advertência ou suspensão
 */
export function useCreateWarningMutation() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (payload: CreateWarningPayload) => {
      const adminUser = {
        id: user?.id || "admin",
        name: profile?.name || user?.email || "Administrador",
        nickname: profile?.nickname || null,
        avatar: profile?.avatar_url || null,
      };
      return createWarning(payload, adminUser);
    },
    onSuccess: (newWarn) => {
      queryClient.invalidateQueries({ queryKey: WARNINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["member_tags"] });
      queryClient.invalidateQueries({ queryKey: ["member_tag_assignments"] });

      const isSusp = newWarn.type === "suspensao";
      toast.success(
        isSusp
          ? `Suspensão aplicada com sucesso para ${newWarn.member_name}!`
          : `Advertência aplicada com sucesso para ${newWarn.member_name}!`
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao registrar advertência.");
    },
  });
}

/**
 * Mutation para atualizar uma advertência ou suspensão
 */
export function useUpdateWarningMutation() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateWarningPayload }) => {
      const adminUser = {
        id: user?.id || "admin",
        name: profile?.name || user?.email || "Administrador",
      };
      return updateWarning(id, payload, adminUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WARNINGS_QUERY_KEY });
      toast.success("Registro atualizado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao atualizar advertência.");
    },
  });
}

/**
 * Mutation para revogar / cancelar manualmente uma suspensão ou advertência
 */
export function useRevokeWarningMutation() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const adminUser = {
        id: user?.id || "admin",
        name: profile?.name || user?.email || "Administrador",
      };
      return revokeWarning(id, reason, adminUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WARNINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["member_tags"] });
      queryClient.invalidateQueries({ queryKey: ["member_tag_assignments"] });
      toast.success("Penalidade revogada com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao revogar penalidade.");
    },
  });
}

/**
 * Mutation para excluir permanentemente uma advertência
 */
export function useDeleteWarningMutation() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const adminUser = {
        id: user?.id || "admin",
        name: profile?.name || user?.email || "Administrador",
      };
      return deleteWarning(id, adminUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WARNINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["member_tags"] });
      queryClient.invalidateQueries({ queryKey: ["member_tag_assignments"] });
      toast.success("Advertência removida permanentemente!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao remover advertência.");
    },
  });
}

/**
 * Mutation para o membro confirmar ciência da advertência
 */
export function useAcknowledgeWarningMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado.");
      return acknowledgeWarning(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WARNINGS_QUERY_KEY });
      toast.success("Ciência confirmada com sucesso.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao confirmar ciência.");
    },
  });
}
