import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  getTicketsRealtimeChannel,
} from "@/lib/app-api";
import type {
  Ticket,
  TicketMessage,
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

    // 3. Ouvir storage events (tanto na chave de dados quanto na chave de ping imediato)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tw_tickets_v1" || e.key === "tw_tickets_sync_ping") {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Inicializar canal singleton do Supabase Realtime (garante listeners ativos para broadcast, audit_logs e role_permissions)
    try {
      getTicketsRealtimeChannel();
    } catch {}

    return () => {
      window.removeEventListener("tw_tickets_updated", handleUpdate);
      window.removeEventListener("storage", handleStorage);
      if (bc) bc.close();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["tickets"],
    queryFn: getTickets,
    staleTime: 0,
    refetchInterval: 2500,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createTicket(payload),
    onSuccess: (newTicket) => {
      queryClient.setQueryData<Ticket[]>(["tickets"], (old = []) => {
        if (old.some((t) => t.id === newTicket.id)) return old;
        return [newTicket, ...old];
      });
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
    onSuccess: (newMsg: TicketMessage, vars) => {
      queryClient.setQueryData<Ticket[]>(["tickets"], (old = []) => {
        return old.map((t) => {
          if (t.id !== vars.ticketId) return t;
          const currentMsgs = t.messages || [];
          const exists = currentMsgs.some((m) => m.id === newMsg.id);
          const updatedMsgs = exists ? currentMsgs : [...currentMsgs, newMsg];
          let nextStatus = t.status;
          if (t.status === "aguardando" && !newMsg.is_internal_note) {
            nextStatus = "em_atendimento";
          } else if (t.status === "aberto" && !newMsg.is_internal_note) {
            nextStatus = "em_atendimento";
          }
          return {
            ...t,
            status: nextStatus,
            messages: updatedMsgs,
            updated_at: newMsg.created_at,
          };
        });
      });
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
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData<Ticket[]>(["tickets"], (old = []) => {
        return old.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
      });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success(`Você assumiu o chamado ${formatTicketNumber(updatedTicket.ticket_number)}!`, {
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
    onSuccess: (updatedTicket, vars) => {
      queryClient.setQueryData<Ticket[]>(["tickets"], (old = []) => {
        return old.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
      });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success(
        `Chamado ${formatTicketNumber(updatedTicket.ticket_number)} transferido para ${vars.payload.new_assigned_to_name}.`
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
    onSuccess: (updatedTicket, vars) => {
      queryClient.setQueryData<Ticket[]>(["tickets"], (old = []) => {
        return old.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
      });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      const stInfo = getStatusInfo(vars.status);
      toast.success(
        `Status do chamado ${formatTicketNumber(updatedTicket.ticket_number)} alterado para "${stInfo.label}".`
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
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData<Ticket[]>(["tickets"], (old = []) => {
        return old.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
      });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success(`Chamado ${formatTicketNumber(updatedTicket.ticket_number)} finalizado e fechado.`);
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
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData<Ticket[]>(["tickets"], (old = []) => {
        return old.map((t) => (t.id === updatedTicket.id ? updatedTicket : t));
      });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success(`Chamado ${formatTicketNumber(updatedTicket.ticket_number)} reaberto com sucesso.`);
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
    onSuccess: (_, ticketId) => {
      queryClient.setQueryData<Ticket[]>(["tickets"], (old = []) => {
        return old.filter((t) => t.id !== ticketId);
      });
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      broadcastTicketsRealtimeUpdate();
      toast.success("Chamado excluído permanentemente.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao excluir chamado.");
    },
  });
}
