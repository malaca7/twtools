import { useQuery } from "@tanstack/react-query";
import {
  getAuditLogs,
  getBaus,
  getCategories,
  getGoals,
  getLoginPlayers,
  getMembers,
  getMovements,
  getPendingSignupRequests,
  getProducts,
  getRolePermissions,
  getSales,
  getUserPresences,
} from "@/lib/app-api";
import type {
  AuditLog,
  Bau,
  Category,
  Goal,
  LoginPlayer,
  Member,
  Movement,
  PendingSignupRequest,
  Product,
  Sale,
  UserPresence,
} from "@/lib/app-types";
import type { AppLevel, Permission } from "@/lib/permissions";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => getCategories(),
  });
}

export function useBaus() {
  return useQuery({
    queryKey: ["baus"],
    queryFn: async (): Promise<Bau[]> => getBaus(),
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => getProducts(),
  });
}

export function useMovements() {
  return useQuery({
    queryKey: ["movements"],
    queryFn: async (): Promise<Movement[]> => getMovements(),
  });
}

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async (): Promise<Sale[]> => getSales(),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async (): Promise<Goal[]> => getGoals(),
  });
}

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async (): Promise<Member[]> => getMembers(),
    refetchInterval: 4000,
  });
}

export function usePendingSignupRequests(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["pending_signup_requests"],
    queryFn: async (): Promise<PendingSignupRequest[]> => getPendingSignupRequests(),
    refetchInterval: 10000,
  });
}

export function useLoginPlayers() {
  return useQuery({
    queryKey: ["login_players"],
    queryFn: async (): Promise<LoginPlayer[]> => getLoginPlayers(),
  });
}

export function useAuditLogs(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["audit_logs"],
    queryFn: async (): Promise<AuditLog[]> => getAuditLogs(),
    refetchInterval: 5000,
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: ["role_permissions"],
    queryFn: async (): Promise<Record<AppLevel, Permission[]>> => getRolePermissions(),
  });
}

export function useUserPresences() {
  return useQuery({
    queryKey: ["user_presence"],
    queryFn: async (): Promise<UserPresence[]> => getUserPresences(),
    refetchInterval: 15000,
  });
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { getAnnouncements } = await import("@/lib/app-api");
      return getAnnouncements();
    },
  });
}

export function useAnnouncementReads() {
  return useQuery({
    queryKey: ["announcement_reads"],
    queryFn: async () => {
      const { getAnnouncementReads } = await import("@/lib/app-api");
      return getAnnouncementReads();
    },
  });
}

export function useCashMovements() {
  return useQuery({
    queryKey: ["cash_fund_movements"],
    queryFn: async () => {
      const { getCashMovements } = await import("@/lib/app-api");
      return getCashMovements();
    },
  });
}

export function useCustomRoles() {
  return useQuery({
    queryKey: ["custom_roles"],
    queryFn: async () => {
      const { getCustomRoles } = await import("@/lib/app-api");
      return getCustomRoles();
    },
  });
}

export function nameOf(
  membersOrId: Member[] | string | null | undefined,
  idOrMembers?: string | Member[] | null | undefined
): string {
  let members: Member[] | undefined;
  let userId: string | null | undefined;

  if (Array.isArray(membersOrId)) {
    members = membersOrId;
    userId = typeof idOrMembers === "string" ? idOrMembers : undefined;
  } else if (Array.isArray(idOrMembers)) {
    members = idOrMembers;
    userId = typeof membersOrId === "string" ? membersOrId : undefined;
  }

  if (!userId) return "—";
  const m = Array.isArray(members) ? members.find((x) => x.user_id === userId) : undefined;
  return m?.nickname || m?.nome || "Membro";
}

export function productName(products: Product[] | undefined, id: string) {
  return products?.find((p) => p.id === id)?.nome ?? "Produto";
}
