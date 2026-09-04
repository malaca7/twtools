import { useEffect, useRef } from "react";
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
const REALTIME_CHANNEL_NAME = "tw_metas_cross_tab_sync";
const SUPABASE_METAS_CHANNEL = "tw_metas_realtime_sync";

// Singleton channel for Supabase Realtime Broadcast across all clients
let globalMetasChannel: ReturnType<typeof supabase.channel> | null = null;

function getGlobalMetasChannel() {
  if (!globalMetasChannel) {
    globalMetasChannel = supabase.channel(SUPABASE_METAS_CHANNEL, {
      config: { broadcast: { self: true } },
    });
    globalMetasChannel.subscribe();
  }
  return globalMetasChannel;
}

export function broadcastMetasRealtimeUpdate(type: "goals" | "submissions" | "all" = "all") {
  try {
    // 1. Local DOM CustomEvent
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(
          type === "goals"
            ? "tw_weekly_goals_updated"
            : type === "submissions"
            ? "tw_goal_submissions_updated"
            : "tw_metas_all_updated"
        )
      );
    }
    // 2. Cross-tab BroadcastChannel
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(REALTIME_CHANNEL_NAME);
      bc.postMessage({ type: `${type}_updated`, timestamp: Date.now() });
      bc.close();
    }
    // 3. Supabase Realtime Broadcast (all connected users/devices worldwide)
    const ch = getGlobalMetasChannel();
    void ch.send({
      type: "broadcast",
      event: "metas_sync",
      payload: { type, timestamp: Date.now() },
    });
  } catch {}
}

export function useWeeklyGoals() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["weekly_goals"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
    };

    // 1. Local window events
    window.addEventListener("tw_weekly_goals_updated", handleUpdate);
    window.addEventListener("tw_metas_all_updated", handleUpdate);

    // 2. Cross-tab BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel(REALTIME_CHANNEL_NAME);
      bc.onmessage = (e) => {
        if (
          e.data?.type === "goals_updated" ||
          e.data?.type === "all_updated" ||
          e.data?.type === "metas_sync"
        ) {
          handleUpdate();
        }
      };
    }

    // 3. Storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tw_weekly_goals") {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Supabase Realtime Broadcast & Postgres Changes
    const channelId = `realtime_goals_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
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
      .on("broadcast", { event: "metas_sync" }, (payload) => {
        if (
          !payload?.payload?.type ||
          payload.payload.type === "goals" ||
          payload.payload.type === "all"
        ) {
          handleUpdate();
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener("tw_weekly_goals_updated", handleUpdate);
      window.removeEventListener("tw_metas_all_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["weekly_goals"],
    queryFn: getWeeklyGoals,
    staleTime: 0,
    refetchInterval: 1500,
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
      broadcastMetasRealtimeUpdate("goals");
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
      broadcastMetasRealtimeUpdate("goals");
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
      broadcastMetasRealtimeUpdate("goals");
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

    // 1. Local window events
    window.addEventListener("tw_goal_submissions_updated", handleUpdate);
    window.addEventListener("tw_metas_all_updated", handleUpdate);

    // 2. Cross-tab BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel(REALTIME_CHANNEL_NAME);
      bc.onmessage = (e) => {
        if (
          e.data?.type === "submissions_updated" ||
          e.data?.type === "all_updated" ||
          e.data?.type === "metas_sync"
        ) {
          handleUpdate();
        }
      };
    }

    // 3. Storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tw_goal_submissions") {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Supabase Realtime Broadcast & Postgres Changes
    const channelId = `realtime_subs_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
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
      .on("broadcast", { event: "metas_sync" }, (payload) => {
        if (
          !payload?.payload?.type ||
          payload.payload.type === "submissions" ||
          payload.payload.type === "all"
        ) {
          handleUpdate();
        }
      })
      .subscribe();

    return () => {
      window.removeEventListener("tw_goal_submissions_updated", handleUpdate);
      window.removeEventListener("tw_metas_all_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["goal_submissions"],
    queryFn: getGoalSubmissions,
    staleTime: 0,
    refetchInterval: 1500,
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
      broadcastMetasRealtimeUpdate("submissions");
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
      broadcastMetasRealtimeUpdate("submissions");
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
      broadcastMetasRealtimeUpdate("submissions");
      toast.success("Registro de entrega removido.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao remover registro de entrega.");
    },
  });
}

