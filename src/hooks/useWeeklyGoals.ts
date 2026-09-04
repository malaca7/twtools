import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

export function useWeeklyGoals() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["weekly_goals"] });
    };
    window.addEventListener("tw_weekly_goals_updated", handleUpdate);
    return () => window.removeEventListener("tw_weekly_goals_updated", handleUpdate);
  }, [queryClient]);

  return useQuery({
    queryKey: ["weekly_goals"],
    queryFn: getWeeklyGoals,
    staleTime: 1000 * 30,
  });
}

export function useCreateWeeklyGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWeeklyGoalPayload) => createWeeklyGoal(payload),
    onSuccess: (newGoal) => {
      void queryClient.invalidateQueries({ queryKey: ["weekly_goals"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
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
    window.addEventListener("tw_goal_submissions_updated", handleUpdate);
    return () => window.removeEventListener("tw_goal_submissions_updated", handleUpdate);
  }, [queryClient]);

  return useQuery({
    queryKey: ["goal_submissions"],
    queryFn: getGoalSubmissions,
    staleTime: 1000 * 30,
  });
}

export function useSubmitGoalDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitGoalPayload) => submitGoalDelivery(payload),
    onSuccess: (sub) => {
      void queryClient.invalidateQueries({ queryKey: ["goal_submissions"] });
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
      toast.success("Registro de entrega removido.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao remover registro de entrega.");
    },
  });
}
