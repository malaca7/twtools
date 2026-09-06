import { useMemo } from "react";
import { UserPlus, LifeBuoy, Calendar, Target, Package, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePendingSignupRequests, useProducts } from "@/hooks/useData";
import { useTickets } from "@/hooks/useTickets";
import { useAbsences } from "@/hooks/useAbsences";
import { useGoalSubmissions } from "@/hooks/useWeeklyGoals";

export interface ManagementActionItem {
  id: string;
  title: string;
  count: number;
  description: string;
  link: string;
  actionLabel: string;
  icon: LucideIcon;
  color: "emerald" | "amber" | "purple" | "sky" | "rose";
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

export function useManagementPendingActions() {
  const { level, isDevUser, hasPermission } = useAuth();

  const isManager = Boolean(
    isDevUser ||
      level === "desenvolvedor" ||
      level === "01" ||
      level === "02" ||
      level === "gerente" ||
      hasPermission("approve_requests") ||
      hasPermission("manage_tickets") ||
      hasPermission("manage_absences") ||
      hasPermission("manage_goals") ||
      hasPermission("manage_notifications")
  );

  // Consultas aos dados em tempo real
  const { data: signupRequests = [] } = usePendingSignupRequests(isManager);
  const { data: tickets = [] } = useTickets();
  const { data: absences = [] } = useAbsences();
  const { data: submissions = [] } = useGoalSubmissions();
  const { data: products = [] } = useProducts(isManager);

  const pendingSignups = signupRequests.length;

  const openTickets = useMemo(() => {
    return tickets.filter(
      (t) => t.status === "aberto" || t.status === "aguardando_suporte"
    ).length;
  }, [tickets]);

  const pendingAbsences = useMemo(() => {
    return absences.filter((a) => a.status === "pendente").length;
  }, [absences]);

  const pendingGoals = useMemo(() => {
    return submissions.filter((s) => s.status === "pendente").length;
  }, [submissions]);

  const criticalStockCount = useMemo(() => {
    return products.filter((p) => {
      const min = p.estoque_minimo ?? 0;
      return min > 0 && p.estoque <= min;
    }).length;
  }, [products]);

  const totalPendingCount =
    pendingSignups + openTickets + pendingAbsences + pendingGoals + criticalStockCount;

  const allActionItems = useMemo<ManagementActionItem[]>(() => {
    return [
      {
        id: "signups",
        title: "Novos Cadastros",
        count: pendingSignups,
        description:
          pendingSignups === 1
            ? "1 novo membro aguardando aprovação de cadastro"
            : `${pendingSignups} novos membros aguardando aprovação`,
        link: "/membros",
        actionLabel: "Aprovar Cadastros",
        icon: UserPlus,
        color: "emerald",
      },
      {
        id: "tickets",
        title: "Chamados & Tickets",
        count: openTickets,
        description:
          openTickets === 1
            ? "1 chamado aberto aguardando resposta da liderança"
            : `${openTickets} chamados abertos aguardando atendimento`,
        link: "/tickets",
        actionLabel: "Atender Tickets",
        icon: LifeBuoy,
        color: "amber",
      },
      {
        id: "absences",
        title: "Licenças & Ausências",
        count: pendingAbsences,
        description:
          pendingAbsences === 1
            ? "1 pedido de licença aguardando aprovação"
            : `${pendingAbsences} pedidos de licença aguardando análise`,
        link: "/ausencias",
        actionLabel: "Avaliar Licenças",
        icon: Calendar,
        color: "purple",
      },
      {
        id: "goals",
        title: "Metas Semanais",
        count: pendingGoals,
        description:
          pendingGoals === 1
            ? "1 comprovante de entrega aguardando conferência"
            : `${pendingGoals} comprovantes de entrega aguardando conferência`,
        link: "/metas",
        actionLabel: "Conferir Metas",
        icon: Target,
        color: "sky",
      },
      {
        id: "stock",
        title: "Estoque em Nível Crítico",
        count: criticalStockCount,
        description:
          criticalStockCount === 1
            ? "1 produto com saldo abaixo da margem mínima"
            : `${criticalStockCount} produtos com saldo abaixo da margem mínima`,
        link: "/estoque",
        actionLabel: "Repor Estoque",
        icon: Package,
        color: "rose",
      },
    ];
  }, [pendingSignups, openTickets, pendingAbsences, pendingGoals, criticalStockCount]);

  const activeActionItems = useMemo(() => {
    return allActionItems.filter((item) => item.count > 0);
  }, [allActionItems]);

  return {
    isManager,
    totalPendingCount,
    hasPendingActions: totalPendingCount > 0,
    activeActionItems,
    allActionItems,
    counts: {
      pendingSignups,
      openTickets,
      pendingAbsences,
      pendingGoals,
      criticalStockCount,
    },
  };
}
