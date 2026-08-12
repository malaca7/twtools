import { useQuery } from "@tanstack/react-query";
import {
  getAuditLogs,
  getCategories,
  getGoals,
  getLoginPlayers,
  getMembers,
  getMovements,
  getPendingSignupRequests,
  getProducts,
  getSales,
} from "@/lib/app-api";
import type {
  AuditLog,
  Category,
  Goal,
  LoginPlayer,
  Member,
  Movement,
  PendingSignupRequest,
  Product,
  Sale,
} from "@/lib/app-types";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => getCategories(),
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
  });
}

export function usePendingSignupRequests(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["pending_signup_requests"],
    queryFn: async (): Promise<PendingSignupRequest[]> => getPendingSignupRequests(),
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
  });
}

export function nameOf(members: Member[] | undefined, userId: string | null | undefined) {
  if (!userId) return "—";
  const m = members?.find((x) => x.user_id === userId);
  return m?.nickname || m?.nome || "Membro";
}

export function productName(products: Product[] | undefined, id: string) {
  return products?.find((p) => p.id === id)?.nome ?? "Produto";
}
