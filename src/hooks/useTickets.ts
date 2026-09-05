import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getTickets,
  createTicket,
  addTicketMessage,
  claimTicket,
  transferTicket,
  updateTicketStatus,
  closeTicket,
  reopenTicket,
  deleteTicket,
  broadcastTicketsRealtimeUpdate,
} from "@/lib/app-api";
import type {
  CreateTicketPayload,
  AddTicketMessagePayload,
  TransferTicketPayload,
  CloseTicketPayload,
  TicketStatus,
} from "@/types/tickets";
import { formatTicketNumber, getStatusInfo } from "@/types/tickets";

export function useTickets() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    };

    // 1. Ouvir evento customizado da mesma aba
    window.addEventListener("tw_tickets_updated", handleUpdate);

    // 2. Ouvir BroadcastChannel de outras abas do mesmo navegador
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("tw_tickets_channel");
      bc.onmessage = () => {
        handleUpdate();
      };
    } catch {}

    // 3. Ouvir storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tw_tickets_v1") {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Supabase Realtime Broadcast & Postgres Changes (sincronização global entre todos os usuários)
    const channelId = `realtime_tickets_${Math.random().toString(36).substring(2, 9)}`;
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
          if (row?.level === "system_tickets_data" || !row?.level) {
            handleUpdate();
          }
        }
      )
      .on("broadcast", { event: "tickets_sync" }, () => {
        handleUpdate();
      })
      .subscribe();

    return () => {
      window.removeEventListener("tw_tickets_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["tickets"],
    queryFn: getTickets,
    staleTime: 0,
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createTicket(payload),
    onSuccess: (newTicket) => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success(`Chamado ${formatTicketNumber(newTicket.ticket_number)} aberto com sucesso!`, {
        description: "A equipe da gerência foi notificada e responderá em breve.",
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao abrir chamado.");
    },
  });
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: AddTicketMessagePayload;
    }) => addTicketMessage(ticketId, payload),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      if (vars.payload.is_internal_note) {
        toast.success("Nota interna privada registrada com sucesso.", {
          description: "Visível apenas para membros da gerência.",
        });
      } else {
        toast.success("Mensagem enviada com sucesso.");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao enviar mensagem.");
    },
  });
}

export function useClaimTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => claimTicket(ticketId),
    onSuccess: (ticket) => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success(`Você assumiu o chamado ${formatTicketNumber(ticket.ticket_number)}!`, {
        description: "Status atualizado para Em Atendimento.",
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao assumir chamado.");
    },
  });
}

export function useTransferTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: TransferTicketPayload;
    }) => transferTicket(ticketId, payload),
    onSuccess: (ticket, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success(
        `Chamado ${formatTicketNumber(ticket.ticket_number)} transferido para ${vars.payload.new_assigned_to_name}.`
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao transferir chamado.");
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      status,
    }: {
      ticketId: string;
      status: TicketStatus;
    }) => updateTicketStatus(ticketId, status),
    onSuccess: (ticket, vars) => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      const stInfo = getStatusInfo(vars.status);
      toast.success(
        `Status do chamado ${formatTicketNumber(ticket.ticket_number)} alterado para "${stInfo.label}".`
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao atualizar status.");
    },
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload?: CloseTicketPayload;
    }) => closeTicket(ticketId, payload),
    onSuccess: (ticket) => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success(`Chamado ${formatTicketNumber(ticket.ticket_number)} finalizado e fechado.`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao fechar chamado.");
    },
  });
}

export function useReopenTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => reopenTicket(ticketId),
    onSuccess: (ticket) => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success(`Chamado ${formatTicketNumber(ticket.ticket_number)} reaberto com sucesso.`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao reabrir chamado.");
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) => deleteTicket(ticketId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success("Chamado excluído permanentemente.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao excluir chamado.");
    },
  });
}
