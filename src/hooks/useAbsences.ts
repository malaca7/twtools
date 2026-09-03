import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAbsences,
  createAbsence,
  reviewAbsence,
  cancelAbsence,
  deleteAbsence,
} from "@/lib/app-api";
import type { CreateAbsencePayload } from "@/lib/app-types";

export function useAbsences() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["absences"] });
    };
    window.addEventListener("tw_absences_updated", handleUpdate);
    return () => window.removeEventListener("tw_absences_updated", handleUpdate);
  }, [queryClient]);

  return useQuery({
    queryKey: ["absences"],
    queryFn: getAbsences,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreateAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAbsencePayload) => createAbsence(payload),
    onSuccess: (newAbsence) => {
      void queryClient.invalidateQueries({ queryKey: ["absences"] });
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
      toast.success("Registro de ausência excluído.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao excluir registro de ausência.");
    },
  });
}
