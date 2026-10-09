import { useState, useEffect, useCallback, useMemo } from "react";
import { UserPlus, LifeBuoy, Calendar, Target, Package, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePendingSignupRequests, useProducts } from "@/hooks/useData";
import { useTickets } from "@/hooks/useTickets";
import { useAbsences } from "@/hooks/useAbsences";
import { useGoalSubmissions } from "@/hooks/useWeeklyGoals";
import type { Permission } from "@/lib/permissions";

export interface ManagementActionItem {
  id: string;
  title: string;
  count: number;
  unreadCount: number;
  isRead: boolean;
  description: string;
  link: string;
  actionLabel: string;
  icon: LucideIcon;
  color: "emerald" | "amber" | "purple" | "sky" | "rose";
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

export interface ManagementItemReadState {
  acknowledgedCount: number;
  readAt: string;
}

export type ManagementReadMap = Record<string, ManagementItemReadState>;

export function useManagementPendingActions() {
  const {
    isDevUser,
    isCeoUser,
    panelMode,
    hasPermission,
    hasMemberRolePermission,
    user,
  } = useAuth();

  // 1. Determinação do painel ativo:
  // Se estiver em rota /dev ou panelMode === "dev", painel "dev"
  // Se estiver em rota /ceo ou panelMode === "ceo", painel "ceo"
  // Caso contrário, painel "member"
  const currentPanel: "member" | "dev" | "ceo" = useMemo(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith("/dev") || hash.includes("/dev")) return "dev";
      if (path.startsWith("/ceo") || hash.includes("/ceo")) return "ceo";
    }
    return panelMode;
  }, [panelMode]);

  // 2. Verificação de permissão estrita por contexto:
  // - No Painel Membro: Apenas o cargo do membro e suas tags de sistema contam.
  //   Bypass de Dev é estritamente ignorado no painel de membro para garantir que
  //   membros sem cargo de gestão NÃO visualizem a aba ou notificações de gestão.
  // - No Painel CEO: Avalia permissões da Tag CEO / Painel CEO.
  // - No Painel Dev: Avalia permissões da Tag Dev / Painel Dev.
  const checkPermission = useCallback(
    (permission: Permission): boolean => {
      if (currentPanel === "member") {
        return hasMemberRolePermission(permission);
      }
      if (currentPanel === "ceo") {
        return hasPermission(permission, "ceo");
      }
      if (currentPanel === "dev") {
        return hasPermission(permission, "dev");
      }
      return false;
    },
    [currentPanel, hasMemberRolePermission, hasPermission]
  );

  const canSignups = checkPermission("approve_requests");
  const canTickets = checkPermission("manage_tickets");
  const canAbsences = checkPermission("manage_absences");
  const canGoals = checkPermission("manage_goals");
  const canStock = checkPermission("manage_products") || checkPermission("manage_baus");

  const isManager = Boolean(
    canSignups || canTickets || canAbsences || canGoals || canStock
  );

  // Consultas aos dados em tempo real apenas se tiver permissão
  const { data: signupRequests = [] } = usePendingSignupRequests(canSignups);
  const { data: tickets = [] } = useTickets();
  const { data: absences = [] } = useAbsences();
  const { data: submissions = [] } = useGoalSubmissions();
  const { data: products = [] } = useProducts(canStock);

  const pendingSignups = canSignups ? signupRequests.length : 0;

  const openTickets = useMemo(() => {
    if (!canTickets) return 0;
    return tickets.filter(
      (t) => t.status === "aberto" || t.status === "aguardando_suporte"
    ).length;
  }, [tickets, canTickets]);

  const pendingAbsences = useMemo(() => {
    if (!canAbsences) return 0;
    return absences.filter((a) => a.status === "pendente").length;
  }, [absences, canAbsences]);

  const pendingGoals = useMemo(() => {
    if (!canGoals) return 0;
    return submissions.filter((s) => s.status === "pendente").length;
  }, [submissions, canGoals]);

  const criticalStockCount = useMemo(() => {
    if (!canStock) return 0;
    return products.filter((p) => {
      const min = p.estoque_minimo ?? 0;
      return min > 0 && p.estoque <= min;
    }).length;
  }, [products, canStock]);

  // Armazenamento do status de leitura por usuário
  const storageKey = useMemo(() => {
    return user?.id ? `tw_mgmt_read_${user.id}` : "tw_mgmt_read_guest";
  }, [user?.id]);

  const [readState, setReadState] = useState<ManagementReadMap>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      setReadState(stored ? JSON.parse(stored) : {});
    } catch {
      setReadState({});
    }
  }, [storageKey]);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (customEvent.detail?.key && customEvent.detail.key !== storageKey) return;
      try {
        const stored = localStorage.getItem(storageKey);
        setReadState(stored ? JSON.parse(stored) : {});
      } catch {
        // ignore
      }
    };
    window.addEventListener("tw_mgmt_read_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("tw_mgmt_read_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [storageKey]);

  const getReadStatus = useCallback(
    (itemId: string, currentCount: number) => {
      if (currentCount <= 0) {
        return { isRead: true, unreadCount: 0 };
      }
      const record = readState[itemId];
      if (!record) {
        return { isRead: false, unreadCount: currentCount };
      }
      if (record.acknowledgedCount >= currentCount) {
        return { isRead: true, unreadCount: 0 };
      }
      return {
        isRead: false,
        unreadCount: Math.max(0, currentCount - record.acknowledgedCount),
      };
    },
    [readState]
  );

  const markItemAsRead = useCallback(
    (itemId: string) => {
      let count = 0;
      let label = "Item";
      if (itemId === "signups") { count = pendingSignups; label = "Novos Cadastros"; }
      else if (itemId === "tickets") { count = openTickets; label = "Chamados & Tickets"; }
      else if (itemId === "absences") { count = pendingAbsences; label = "Licenças & Ausências"; }
      else if (itemId === "goals") { count = pendingGoals; label = "Metas Semanais"; }
      else if (itemId === "stock") { count = criticalStockCount; label = "Estoque Crítico"; }

      setReadState((prev) => {
        const next = {
          ...prev,
          [itemId]: {
            acknowledgedCount: count,
            readAt: new Date().toISOString(),
          },
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
          window.dispatchEvent(
            new CustomEvent("tw_mgmt_read_updated", { detail: { key: storageKey } })
          );
        } catch (e) {
          console.error("Erro ao salvar status de leitura:", e);
        }
        return next;
      });
      toast.success(`${label} marcado como lido / ciente.`);
    },
    [pendingSignups, openTickets, pendingAbsences, pendingGoals, criticalStockCount, storageKey]
  );

  const markItemAsUnread = useCallback(
    (itemId: string) => {
      setReadState((prev) => {
        const next = { ...prev };
        delete next[itemId];
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
          window.dispatchEvent(
            new CustomEvent("tw_mgmt_read_updated", { detail: { key: storageKey } })
          );
        } catch (e) {
          console.error("Erro ao salvar status de leitura:", e);
        }
        return next;
      });
      toast.info("Item marcado como não lido.");
    },
    [storageKey]
  );

  const markAllAsRead = useCallback(() => {
    setReadState((prev) => {
      const next: ManagementReadMap = { ...prev };
      const now = new Date().toISOString();
      if (canSignups) next.signups = { acknowledgedCount: pendingSignups, readAt: now };
      if (canTickets) next.tickets = { acknowledgedCount: openTickets, readAt: now };
      if (canAbsences) next.absences = { acknowledgedCount: pendingAbsences, readAt: now };
      if (canGoals) next.goals = { acknowledgedCount: pendingGoals, readAt: now };
      if (canStock) next.stock = { acknowledgedCount: criticalStockCount, readAt: now };

      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent("tw_mgmt_read_updated", { detail: { key: storageKey } })
        );
      } catch (e) {
        console.error("Erro ao salvar status de leitura:", e);
      }
      return next;
    });
    toast.success("Todas as notificações de gestão foram marcadas como lidas!");
  }, [
    canSignups,
    pendingSignups,
    canTickets,
    openTickets,
    canAbsences,
    pendingAbsences,
    canGoals,
    pendingGoals,
    canStock,
    criticalStockCount,
    storageKey,
  ]);

  const allActionItems = useMemo<ManagementActionItem[]>(() => {
    if (!isManager) return [];
    const items: ManagementActionItem[] = [];

    if (canSignups) {
      const st = getReadStatus("signups", pendingSignups);
      items.push({
        id: "signups",
        title: "Novos Cadastros",
        count: pendingSignups,
        unreadCount: st.unreadCount,
        isRead: st.isRead,
        description:
          pendingSignups === 1
            ? "1 novo membro aguardando aprovação de cadastro"
            : `${pendingSignups} novos membros aguardando aprovação`,
        link: "/membros",
        actionLabel: "Aprovar Cadastros",
        icon: UserPlus,
        color: "emerald",
      });
    }

    if (canTickets) {
      const st = getReadStatus("tickets", openTickets);
      items.push({
        id: "tickets",
        title: "Chamados & Tickets",
        count: openTickets,
        unreadCount: st.unreadCount,
        isRead: st.isRead,
        description:
          openTickets === 1
            ? "1 chamado aberto aguardando resposta da liderança"
            : `${openTickets} chamados abertos aguardando atendimento`,
        link: "/tickets",
        actionLabel: "Atender Tickets",
        icon: LifeBuoy,
        color: "amber",
      });
    }

    if (canAbsences) {
      const st = getReadStatus("absences", pendingAbsences);
      items.push({
        id: "absences",
        title: "Licenças & Ausências",
        count: pendingAbsences,
        unreadCount: st.unreadCount,
        isRead: st.isRead,
        description:
          pendingAbsences === 1
            ? "1 pedido de licença aguardando aprovação"
            : `${pendingAbsences} pedidos de licença aguardando análise`,
        link: "/ausencias",
        actionLabel: "Avaliar Licenças",
        icon: Calendar,
        color: "purple",
      });
    }

    if (canGoals) {
      const st = getReadStatus("goals", pendingGoals);
      items.push({
        id: "goals",
        title: "Metas Semanais",
        count: pendingGoals,
        unreadCount: st.unreadCount,
        isRead: st.isRead,
        description:
          pendingGoals === 1
            ? "1 comprovante de entrega aguardando conferência"
            : `${pendingGoals} comprovantes de entrega aguardando conferência`,
        link: "/metas",
        actionLabel: "Conferir Metas",
        icon: Target,
        color: "sky",
      });
    }

    if (canStock) {
      const st = getReadStatus("stock", criticalStockCount);
      items.push({
        id: "stock",
        title: "Estoque em Nível Crítico",
        count: criticalStockCount,
        unreadCount: st.unreadCount,
        isRead: st.isRead,
        description:
          criticalStockCount === 1
            ? "1 produto com saldo abaixo da margem mínima"
            : `${criticalStockCount} produtos com saldo abaixo da margem mínima`,
        link: "/controledeestoque",
        actionLabel: "Repor Estoque",
        icon: Package,
        color: "rose",
      });
    }

    return items;
  }, [
    isManager,
    canSignups,
    pendingSignups,
    canTickets,
    openTickets,
    canAbsences,
    pendingAbsences,
    canGoals,
    pendingGoals,
    canStock,
    criticalStockCount,
    getReadStatus,
  ]);

  const totalPendingCount = useMemo(() => {
    return allActionItems.reduce((acc, item) => acc + item.count, 0);
  }, [allActionItems]);

  const unreadPendingCount = useMemo(() => {
    return allActionItems.reduce((acc, item) => acc + item.unreadCount, 0);
  }, [allActionItems]);

  const activeActionItems = useMemo(() => {
    return allActionItems.filter((item) => item.count > 0);
  }, [allActionItems]);

  return {
    isManager,
    currentPanel,
    totalPendingCount,
    unreadPendingCount,
    hasPendingActions: totalPendingCount > 0,
    hasUnreadPending: unreadPendingCount > 0,
    activeActionItems,
    allActionItems,
    markItemAsRead,
    markItemAsUnread,
    markAllAsRead,
    counts: {
      pendingSignups,
      openTickets,
      pendingAbsences,
      pendingGoals,
      criticalStockCount,
    },
    permissions: {
      canSignups,
      canTickets,
      canAbsences,
      canGoals,
      canStock,
    },
  };
}
