import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getWeeklyGoals,
  createWeeklyGoal,
  updateWeeklyGoal,
  deleteWeeklyGoal,
  getGoalSubmissions,
  submitGoalDelivery,
  reviewGoalSubmission,
  deleteGoalSubmission,
} from "@/lib/app-api";
import type {
  WeeklyGoal,
  GoalSubmission,
  CreateWeeklyGoalPayload,
  SubmitGoalPayload,
} from "@/lib/app-types";
import { currency, num } from "@/lib/format";

// Shared BroadcastChannel for instant same-browser cross-tab sync
const REALTIME_CHANNEL_NAME = "tw_realtime_metas_sync_channel";
const metasBroadcast = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(REALTIME_CHANNEL_NAME) : null;

// Realtime broadcaster to other connected clients
const metasSupabaseChannel = supabase.channel("tw_realtime_metas_live_stream");
metasSupabaseChannel.subscribe();

function triggerRealtimeSync(type: "goals" | "submissions") {
  // 1. Cross-tab local broadcast
  try {
    metasBroadcast?.postMessage({ type: `${type}_updated`, timestamp: Date.now() });
  } catch {}

  // 2. Supabase Realtime broadcast to other devices/users
  try {
    void metasSupabaseChannel.send({
      type: "broadcast",
      event: `${type}_sync`,
      payload: { timestamp: Date.now() },
    });
  } catch {}
}

export function useWeeklyGoals() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["weekly_goals"] });
    };

    // 1. Local window event
    window.addEventListener("tw_weekly_goals_updated", handleUpdate);

    // 2. Cross-tab BroadcastChannel
    const handleBcMessage = (e: MessageEvent) => {
      if (e.data?.type === "goals_updated" || e.data?.type === "metas_sync") {
        handleUpdate();
      }
    };
    if (metasBroadcast) {
      metasBroadcast.addEventListener("message", handleBcMessage);
    }

    // 3. Storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tw_weekly_goals") {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Supabase Realtime Postgres Changes & Broadcast
    const channel = supabase
      .channel("tw_realtime_weekly_goals_sub")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "role_permissions",
        },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (row?.level === "system_weekly_goals" || !row?.level) {
            handleUpdate();
          }
        }
      )
      .on("broadcast", { event: "goals_sync" }, () => {
        handleUpdate();
      })
      .subscribe();

    return () => {
      window.removeEventListener("tw_weekly_goals_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      if (metasBroadcast) {
        metasBroadcast.removeEventListener("message", handleBcMessage);
      }
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["weekly_goals"],
    queryFn: getWeeklyGoals,
    staleTime: 0,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useCreateWeeklyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWeeklyGoalPayload) => createWeeklyGoal(payload),
    onSuccess: (newGoal) => {
      void queryClient.invalidateQueries({ queryKey: ["weekly_goals"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
      triggerRealtimeSync("goals");
      toast.success("Meta semanal criada com sucesso!", {
        description: `${newGoal.title} — Alvo: ${
          newGoal.type === "financeiro" ? currency(newGoal.target_value) : `${num(newGoal.target_value)} ${newGoal.unit_name || "unid"}`
        }`,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao criar meta semanal.");
    },
  });
}

export function useUpdateWeeklyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<WeeklyGoal, "id" | "created_at">>;
    }) => updateWeeklyGoal(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["weekly_goals"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
      triggerRealtimeSync("goals");
      toast.success("Meta semanal atualizada.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao atualizar meta semanal.");
    },
  });
}

export function useDeleteWeeklyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWeeklyGoal(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["weekly_goals"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
      triggerRealtimeSync("goals");
      toast.success("Meta semanal removida.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao remover meta semanal.");
    },
  });
}

export function useGoalSubmissions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["goal_submissions"] });
    };

    // 1. Local window event
    window.addEventListener("tw_goal_submissions_updated", handleUpdate);

    // 2. Cross-tab BroadcastChannel
    const handleBcMessage = (e: MessageEvent) => {
      if (e.data?.type === "submissions_updated" || e.data?.type === "submissions_sync") {
        handleUpdate();
      }
    };
    if (metasBroadcast) {
      metasBroadcast.addEventListener("message", handleBcMessage);
    }

    // 3. Storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tw_goal_submissions") {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Supabase Realtime Postgres Changes & Broadcast
    const channel = supabase
      .channel("tw_realtime_goal_submissions_sub")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "role_permissions",
        },
        (payload) => {
          const row = (payload.new || payload.old) as any;
          if (row?.level === "system_goal_submissions" || !row?.level) {
            handleUpdate();
          }
        }
      )
      .on("broadcast", { event: "submissions_sync" }, () => {
        handleUpdate();
      })
      .subscribe();

    return () => {
      window.removeEventListener("tw_goal_submissions_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      if (metasBroadcast) {
        metasBroadcast.removeEventListener("message", handleBcMessage);
      }
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["goal_submissions"],
    queryFn: getGoalSubmissions,
    staleTime: 0,
    refetchInterval: 2500,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useSubmitGoalDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitGoalPayload) => submitGoalDelivery(payload),
    onSuccess: (sub) => {
      void queryClient.invalidateQueries({ queryKey: ["goal_submissions"] });
      triggerRealtimeSync("submissions");
      toast.success("Comprovante de entrega enviado com sucesso!", {
        description: `Entregue para ${sub.receiver_name} (${
          sub.unit_name === "R$" ? currency(sub.amount) : `${num(sub.amount)} ${sub.unit_name || "itens"}`
        }). Aguardando validação da liderança.`,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao registrar entrega de meta.");
    },
  });
}

export function useReviewGoalSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      status,
      reviewNotes,
    }: {
      submissionId: string;
      status: "aprovado" | "rejeitado";
      reviewNotes?: string;
    }) => reviewGoalSubmission(submissionId, { status, review_notes: reviewNotes }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["goal_submissions"] });
      triggerRealtimeSync("submissions");
      if (updated.status === "aprovado") {
        toast.success(`Entrega de ${updated.member_name} foi APROVADA com sucesso!`);
      } else {
        toast.info(`Entrega de ${updated.member_name} foi RECUSADA.`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao revisar entrega de meta.");
    },
  });
}

export function useDeleteGoalSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) => deleteGoalSubmission(submissionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["goal_submissions"] });
      triggerRealtimeSync("submissions");
      toast.success("Registro de entrega removido.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao remover registro de entrega.");
    },
  });
}
