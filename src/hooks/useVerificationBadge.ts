import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchVerificationConfig,
  updateVerificationConfig,
  fetchVerificationRequests,
  fetchMyVerificationRequest,
  submitVerificationRequest,
  cancelVerificationRequest,
  reviewVerificationRequest,
  grantDirectVerification,
  revokeVerification,
  fetchMemberVerifications,
  fetchVerificationAuditLogs,
  type VerificationBadgeConfig,
  type VerificationRequest,
  type MemberVerification,
  type VerificationAuditLog,
} from "@/services/verificationBadgeService";

export const VERIFICATION_KEYS = {
  config: ["verification_badge_config"] as const,
  requests: (status?: string) => ["verification_requests", status || "all"] as const,
  myRequest: ["my_verification_request"] as const,
  activeMembers: ["member_verifications_active"] as const,
  auditLogs: (limit?: number) => ["verification_audit_logs", limit || 50] as const,
};

/**
 * Hook para obter a configuração geral do Selo de Verificado com Realtime
 */
export function useVerificationConfig() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-verification-config")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verification_badge_config" },
        () => {
          void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.config });
        }
      )
      .subscribe();

    const handleCustomUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.config });
    };
    window.addEventListener("tw_verification_config_updated", handleCustomUpdate);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("tw_verification_config_updated", handleCustomUpdate);
    };
  }, [queryClient]);

  return useQuery<VerificationBadgeConfig>({
    queryKey: VERIFICATION_KEYS.config,
    queryFn: fetchVerificationConfig,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

/**
 * Hook para obter solicitações de verificação com Realtime
 */
export function useVerificationRequests(statusFilter?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-verification-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "verification_requests" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["verification_requests"] });
          void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.myRequest });
          void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.activeMembers });
          void queryClient.invalidateQueries({ queryKey: ["members"] });
        }
      )
      .subscribe();

    const handleCustomUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["verification_requests"] });
      void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.myRequest });
      void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.activeMembers });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    };
    window.addEventListener("tw_verifications_updated", handleCustomUpdate);

    return () => {
      void supabase.removeChannel(channel);
      window.removeEventListener("tw_verifications_updated", handleCustomUpdate);
    };
  }, [queryClient]);

  return useQuery<VerificationRequest[]>({
    queryKey: VERIFICATION_KEYS.requests(statusFilter),
    queryFn: () => fetchVerificationRequests(statusFilter),
    staleTime: 1000 * 30, // 30s
  });
}

/**
 * Hook para obter a solicitação ativa do membro logado
 */
export function useMyVerificationRequest() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleCustomUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.myRequest });
    };
    window.addEventListener("tw_verifications_updated", handleCustomUpdate);
    return () => {
      window.removeEventListener("tw_verifications_updated", handleCustomUpdate);
    };
  }, [queryClient]);

  return useQuery<VerificationRequest | null>({
    queryKey: VERIFICATION_KEYS.myRequest,
    queryFn: fetchMyVerificationRequest,
    staleTime: 1000 * 30,
  });
}

/**
 * Hook para listar membros verificados ativos
 */
export function useMemberVerifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-member-verifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "member_verifications" },
        () => {
          void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.activeMembers });
          void queryClient.invalidateQueries({ queryKey: ["members"] });
          void queryClient.invalidateQueries({ queryKey: ["profiles"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery<MemberVerification[]>({
    queryKey: VERIFICATION_KEYS.activeMembers,
    queryFn: fetchMemberVerifications,
    staleTime: 1000 * 60,
  });
}

/**
 * Hook para obter histórico e logs de auditoria
 */
export function useVerificationAuditLogs(limit = 50) {
  return useQuery<VerificationAuditLog[]>({
    queryKey: VERIFICATION_KEYS.auditLogs(limit),
    queryFn: () => fetchVerificationAuditLogs(limit),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook com todas as mutações do Selo de Verificado
 */
export function useVerificationMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.config });
    void queryClient.invalidateQueries({ queryKey: ["verification_requests"] });
    void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.myRequest });
    void queryClient.invalidateQueries({ queryKey: VERIFICATION_KEYS.activeMembers });
    void queryClient.invalidateQueries({ queryKey: ["verification_audit_logs"] });
    void queryClient.invalidateQueries({ queryKey: ["members"] });
    void queryClient.invalidateQueries({ queryKey: ["profiles"] });
    void queryClient.invalidateQueries({ queryKey: ["auth"] });
  };

  const updateConfigMutation = useMutation({
    mutationFn: (config: Partial<VerificationBadgeConfig>) => updateVerificationConfig(config),
    onSuccess: () => {
      toast.success("Configurações do Selo de Verificado salvas com sucesso!");
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar configurações do selo.");
    },
  });

  const submitRequestMutation = useMutation({
    mutationFn: (params: { reason: string; document_url?: string | null; extra_data?: Record<string, any> }) =>
      submitVerificationRequest(params),
    onSuccess: () => {
      toast.success("Solicitação enviada com sucesso! Aguarde a análise da liderança.", {
        icon: "✨",
      });
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao enviar solicitação de verificação.");
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => cancelVerificationRequest(requestId),
    onSuccess: () => {
      toast.info("Solicitação de verificação cancelada.");
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao cancelar solicitação.");
    },
  });

  const reviewRequestMutation = useMutation({
    mutationFn: (params: {
      requestId: string;
      approve: boolean;
      notes?: string;
      customTitle?: string;
      badgeColor?: string;
    }) => reviewVerificationRequest(params),
    onSuccess: (_, vars) => {
      toast.success(
        vars.approve
          ? "Solicitação aprovada! O membro agora possui o Selo de Verificado."
          : "Solicitação rejeitada com sucesso."
      );
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao analisar solicitação.");
    },
  });

  const grantDirectMutation = useMutation({
    mutationFn: (params: {
      targetUserId: string;
      customTitle?: string;
      badgeColor?: string;
      notes?: string;
    }) => grantDirectVerification(params),
    onSuccess: () => {
      toast.success("Selo de Verificado concedido ao membro com sucesso!", { icon: "🛡️" });
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao conceder selo direto.");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (params: { targetUserId: string; reason?: string }) => revokeVerification(params),
    onSuccess: () => {
      toast.warning("Selo de Verificado revogado do membro.");
      invalidateAll();
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao revogar selo.");
    },
  });

  return {
    updateConfigMutation,
    submitRequestMutation,
    cancelRequestMutation,
    reviewRequestMutation,
    grantDirectMutation,
    revokeMutation,
  };
}
