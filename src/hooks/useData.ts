import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  getAuditLogs,
  getBaus,
  getCategories,
  getDiscordStockConfig,
  getDiscordStockLogs,
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
  DiscordStockConfig,
  DiscordStockLog,
  Goal,
  LoginPlayer,
  Member,
  Movement,
  PendingSignupRequest,
  Product,
  Sale,
  UserPresence,
  ActionScale,
  ActionScaleMember,
  ActionScaleHistory,
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

export function useProductBaus() {
  return useQuery({
    queryKey: ["product_baus"],
    queryFn: async () => {
      const { getProductBaus } = await import("@/lib/app-api");
      return getProductBaus();
    },
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

export function useDiscordStockConfig() {
  return useQuery({
    queryKey: ["discord_stock_config"],
    queryFn: async (): Promise<DiscordStockConfig> => getDiscordStockConfig(),
  });
}

export function useDiscordStockLogs(_limit = 50) {
  return useQuery({
    queryKey: ["discord_stock_logs"],
    queryFn: async (): Promise<DiscordStockLog[]> => [],
    enabled: false,
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
    staleTime: 60000,
  });
}

export function usePendingSignupRequests(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const channelName = `realtime-signups-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "signup_requests",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["pending_signup_requests"] });
          void queryClient.invalidateQueries({ queryKey: ["members"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);

  return useQuery({
    enabled,
    queryKey: ["pending_signup_requests"],
    queryFn: async (): Promise<PendingSignupRequest[]> => getPendingSignupRequests(enabled),
    staleTime: 60000,
  });
}

export function useLoginPlayers() {
  return useQuery({
    queryKey: ["login_players"],
    queryFn: async (): Promise<LoginPlayer[]> => getLoginPlayers(),
  });
}

export function useAuditLogs(_enabled = true) {
  return useQuery({
    enabled: false,
    queryKey: ["audit_logs"],
    queryFn: async (): Promise<AuditLog[]> => [],
    staleTime: Infinity,
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: ["role_permissions"],
    queryFn: async (): Promise<Record<AppLevel, Permission[]>> => getRolePermissions(),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useUserPresences() {
  return useQuery({
    enabled: false,
    queryKey: ["user_presence"],
    queryFn: async (): Promise<UserPresence[]> => [],
    staleTime: Infinity,
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
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useRawMaterials() {
  return useQuery({
    queryKey: ["raw_materials"],
    queryFn: async () => {
      const { getRawMaterials } = await import("@/services/productionService");
      return getRawMaterials();
    },
  });
}

export function useRawMaterialMovements(rawMaterialId?: string, limit = 150) {
  return useQuery({
    queryKey: ["raw_material_movements", rawMaterialId || "all", limit],
    queryFn: async () => {
      const { getRawMaterialMovements } = await import("@/services/productionService");
      return getRawMaterialMovements(rawMaterialId, limit);
    },
  });
}

export function useProductRecipes(productId?: string) {
  return useQuery({
    queryKey: ["product_recipes", productId || "all"],
    queryFn: async () => {
      const { getProductRecipes } = await import("@/services/productionService");
      return getProductRecipes(productId);
    },
  });
}

export function useWarehouseStock() {
  return useQuery({
    queryKey: ["warehouse_stock"],
    queryFn: async () => {
      const { getWarehouseStock } = await import("@/services/productionService");
      return getWarehouseStock();
    },
  });
}

export function useProductions(limit = 100) {
  return useQuery({
    queryKey: ["productions", limit],
    queryFn: async () => {
      const { getProductions } = await import("@/services/productionService");
      return getProductions(limit);
    },
  });
}

export function useWarehouseMovements(productId?: string, limit = 150) {
  return useQuery({
    queryKey: ["warehouse_movements", productId, limit],
    queryFn: async () => {
      const { getWarehouseMovements } = await import("@/services/productionService");
      return getWarehouseMovements(productId, limit);
    },
  });
}

export function useActionScales(status?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("action_scales_realtime_data")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "action_scales" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "action_scale_members" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["action_scales", status || "all"],
    queryFn: async (): Promise<ActionScale[]> => {
      const { getActionScales } = await import("@/lib/app-api");
      return getActionScales(status);
    },
  });
}

export function useActionScale(id?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`action_scale_detail_${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "action_scales", filter: `id=eq.${id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["action_scale", id] });
          void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "action_scale_members", filter: `scale_id=eq.${id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["action_scale", id] });
          void queryClient.invalidateQueries({ queryKey: ["action_scales"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "action_scale_history", filter: `scale_id=eq.${id}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["action_scale_history", id] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  return useQuery({
    queryKey: ["action_scale", id],
    queryFn: async (): Promise<ActionScale | null> => {
      if (!id) return null;
      const { getActionScale } = await import("@/lib/app-api");
      return getActionScale(id);
    },
    enabled: Boolean(id),
  });
}

export function useActionScaleHistory(id?: string) {
  return useQuery({
    queryKey: ["action_scale_history", id],
    queryFn: async (): Promise<ActionScaleHistory[]> => {
      if (!id) return [];
      const { getActionScaleHistory } = await import("@/lib/app-api");
      return getActionScaleHistory(id);
    },
    enabled: Boolean(id),
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
