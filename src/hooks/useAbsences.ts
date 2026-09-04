import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getAbsences,
  createAbsence,
  reviewAbsence,
  cancelAbsence,
  deleteAbsence,
} from "@/lib/app-api";
import type { CreateAbsencePayload } from "@/lib/app-types";

// Shared BroadcastChannel for instant same-browser cross-tab sync
const REALTIME_CHANNEL_NAME = "tw_absences_cross_tab_sync";
const SUPABASE_ABSENCES_CHANNEL = "tw_absences_realtime_sync";

// Singleton channel for Supabase Realtime Broadcast across all clients
let globalAbsencesChannel: ReturnType<typeof supabase.channel> | null = null;

function getGlobalAbsencesChannel() {
  if (!globalAbsencesChannel) {
    globalAbsencesChannel = supabase.channel(SUPABASE_ABSENCES_CHANNEL, {
      config: { broadcast: { self: true } },
    });
    globalAbsencesChannel.subscribe();
  }
  return globalAbsencesChannel;
}

export function broadcastAbsencesRealtimeUpdate() {
  try {
    // 1. Local DOM CustomEvent
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("tw_absences_updated"));
    }
    // 2. Cross-tab BroadcastChannel
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(REALTIME_CHANNEL_NAME);
      bc.postMessage({ type: "absences_updated", timestamp: Date.now() });
      bc.close();
    }
    // 3. Supabase Realtime Broadcast (all connected users/devices worldwide)
    const ch = getGlobalAbsencesChannel();
    void ch.send({
      type: "broadcast",
      event: "absences_sync",
      payload: { timestamp: Date.now() },
    });
  } catch {}
}

export function useAbsences() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["absences"] });
    };

    // 1. Local window event
    window.addEventListener("tw_absences_updated", handleUpdate);

    // 2. Cross-tab BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel(REALTIME_CHANNEL_NAME);
      bc.onmessage = (e) => {
        if (e.data?.type === "absences_updated" || e.data?.type === "absences_sync") {
          handleUpdate();
        }
      };
    }

    // 3. Storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tw_absences_v1") {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Supabase Realtime Broadcast & Postgres Changes
    const channelId = `realtime_absences_${Math.random().toString(36).substring(2, 9)}`;
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
          if (row?.level === "system_absences_list" || !row?.level) {
            handleUpdate();
          }
        }
      )
      .on("broadcast", { event: "absences_sync" }, () => {
        handleUpdate();
      })
      .subscribe();

    return () => {
      window.removeEventListener("tw_absences_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["absences"],
    queryFn: getAbsences,
    staleTime: 0,
    refetchInterval: 1500,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useCreateAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAbsencePayload) => createAbsence(payload),
    onSuccess: (newAbsence) => {
      void queryClient.invalidateQueries({ queryKey: ["absences"] });
      broadcastAbsencesRealtimeUpdate();
      toast.success("Solicitação de ausência enviada com sucesso!", {
        description: `Período: ${newAbsence.days_count} dia(s) (${newAbsence.start_date} até ${newAbsence.end_date})`,
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao registrar solicitação de ausência.");
    },
  });
}

export function useReviewAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      absenceId,
      status,
      reviewNotes,
    }: {
      absenceId: string;
      status: "aprovado" | "rejeitado";
      reviewNotes?: string;
    }) => reviewAbsence(absenceId, { status, review_notes: reviewNotes }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["absences"] });
      broadcastAbsencesRealtimeUpdate();
      if (updated.status === "aprovado") {
        toast.success(`Ausência de ${updated.member_name} foi APROVADA com sucesso!`);
      } else {
        toast.info(`Ausência de ${updated.member_name} foi RECUSADA.`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao processar revisão de ausência.");
    },
  });
}

export function useCancelAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (absenceId: string) => cancelAbsence(absenceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["absences"] });
      broadcastAbsencesRealtimeUpdate();
      toast.info("Solicitação de ausência cancelada.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao cancelar solicitação de ausência.");
    },
  });
}

export function useDeleteAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (absenceId: string) => deleteAbsence(absenceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["absences"] });
      broadcastAbsencesRealtimeUpdate();
      toast.success("Registro de ausência excluído.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao excluir registro de ausência.");
    },
  });
}
