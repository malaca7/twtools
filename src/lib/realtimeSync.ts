/**
 * TWIN WHEELS — ARQUITETURA GLOBAL DE SINCRONIZAÇÃO EM TEMPO REAL
 * 
 * Gerencia o estado de conectividade WebSocket, mapeamento de tabelas para chaves
 * de cache do TanStack Query, barramento de eventos (Cross-Tab e Supabase Realtime)
 * e coalescência de invalidações para performance sem micro-thrashes.
 */

import { supabase } from "@/integrations/supabase/client";

// ==============================================================================
// 1. EVENTOS PADRÃO DO SISTEMA (SYSTEM REALTIME EVENTS)
// ==============================================================================

export const REALTIME_EVENTS = {
  // Usuários e Autenticação
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  USER_BLOCKED: "USER_BLOCKED",
  USER_UNBLOCKED: "USER_UNBLOCKED",
  AUTH_SESSION_CHANGED: "AUTH_SESSION_CHANGED",

  // Gamificação e Perfil
  XP_UPDATED: "XP_UPDATED",
  BADGE_ADDED: "BADGE_ADDED",
  BADGE_REMOVED: "BADGE_REMOVED",
  COINS_UPDATED: "COINS_UPDATED",
  SHOP_UPDATED: "SHOP_UPDATED",
  RANKING_UPDATED: "RANKING_UPDATED",
  EVALUATION_UPDATED: "EVALUATION_UPDATED",

  // Tags e Permissões
  TAG_CREATED: "TAG_CREATED",
  TAG_UPDATED: "TAG_UPDATED",
  TAG_DELETED: "TAG_DELETED",
  TAG_ASSIGNED: "TAG_ASSIGNED",
  PERMISSION_UPDATED: "PERMISSION_UPDATED",
  ROLE_UPDATED: "ROLE_UPDATED",

  // Catálogo e Estoque
  PRODUCT_CREATED: "PRODUCT_CREATED",
  PRODUCT_UPDATED: "PRODUCT_UPDATED",
  PRODUCT_DELETED: "PRODUCT_DELETED",
  STOCK_UPDATED: "STOCK_UPDATED",
  CATEGORY_UPDATED: "CATEGORY_UPDATED",
  BAU_UPDATED: "BAU_UPDATED",

  // Produção e Armazém
  PRODUCTION_CREATED: "PRODUCTION_CREATED",
  PRODUCTION_UPDATED: "PRODUCTION_UPDATED",
  RAW_MATERIAL_UPDATED: "RAW_MATERIAL_UPDATED",
  WAREHOUSE_UPDATED: "WAREHOUSE_UPDATED",
  RECIPE_UPDATED: "RECIPE_UPDATED",

  // Vendas e Financeiro
  SALE_CREATED: "SALE_CREATED",
  SALE_UPDATED: "SALE_UPDATED",
  SALE_DELETED: "SALE_DELETED",
  CASH_FUND_UPDATED: "CASH_FUND_UPDATED",

  // Comunicação e Sistema
  NOTIFICATION_CREATED: "NOTIFICATION_CREATED",
  NOTIFICATION_UPDATED: "NOTIFICATION_UPDATED",
  ANNOUNCEMENT_CREATED: "ANNOUNCEMENT_CREATED",
  ANNOUNCEMENT_READ: "ANNOUNCEMENT_READ",
  GOAL_UPDATED: "GOAL_UPDATED",
  TICKET_UPDATED: "TICKET_UPDATED",
  CHAT_UPDATED: "CHAT_UPDATED",
  STREAM_UPDATED: "STREAM_UPDATED",
  SETTINGS_UPDATED: "SETTINGS_UPDATED",
} as const;

export type RealtimeEventType = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

// ==============================================================================
// 2. ESTADO DA CONEXÃO EM TEMPO REAL (CONNECTION STATUS STORE)
// ==============================================================================

export type RealtimeConnectionStatus = "connected" | "syncing" | "reconnecting" | "offline";

export interface RealtimeState {
  status: RealtimeConnectionStatus;
  lastSyncTimestamp: number | null;
  eventsCount: number;
  activeChannels: number;
  lastError: string | null;
}

let currentState: RealtimeState = {
  status: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "connected",
  lastSyncTimestamp: Date.now(),
  eventsCount: 0,
  activeChannels: 0,
  lastError: null,
};

const listeners = new Set<(state: RealtimeState) => void>();

export function getRealtimeState(): RealtimeState {
  return currentState;
}

export function setRealtimeStatus(
  status: RealtimeConnectionStatus,
  updates?: Partial<Omit<RealtimeState, "status">>
) {
  currentState = {
    ...currentState,
    status,
    ...(updates || {}),
  };
  listeners.forEach((fn) => fn(currentState));
}

export function recordRealtimeEventReceived() {
  currentState = {
    ...currentState,
    lastSyncTimestamp: Date.now(),
    eventsCount: currentState.eventsCount + 1,
  };
  listeners.forEach((fn) => fn(currentState));
}

export function subscribeRealtimeStatus(callback: (state: RealtimeState) => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// ==============================================================================
// 3. MAPA CENTRAL DE TABELAS DO BANCO -> QUERY KEYS DO TANSTACK QUERY
// ==============================================================================

export const TABLE_QUERY_KEYS: Record<string, string[]> = {
  // Catálogo e Estoque
  products: ["products", "product_baus", "product_sale_stock", "warehouse_stock", "dashboard_metrics"],
  product_baus: ["product_baus", "products", "baus", "movements"],
  baus: ["baus", "product_baus", "movements", "discord_stock_config"],
  categories: ["categories", "products"],
  stock_movements: ["movements", "product_baus", "baus", "products", "dashboard_metrics"],
  product_sale_stock: ["product_sale_stock", "sales", "products", "warehouse_stock"],
  sales: ["sales", "product_sale_stock", "product_baus", "warehouse_stock", "cash_fund_movements", "dashboard_metrics"],
  cash_fund_movements: ["cash_fund_movements", "sales", "dashboard_metrics"],
  discord_stock_config: ["discord_stock_config", "baus", "product_baus"],
  discord_stock_logs: ["discord_stock_logs", "discord_stock_config"],

  // Produção Industrial e Armazém
  productions: ["productions", "warehouse_stock", "warehouse_movements", "raw_materials", "raw_material_movements", "products", "dashboard_metrics"],
  production_raw_materials: ["productions", "raw_materials", "raw_material_movements"],
  raw_materials: ["raw_materials", "raw_material_movements", "products", "product_recipes"],
  raw_material_movements: ["raw_material_movements", "raw_materials", "productions"],
  warehouse_stock: ["warehouse_stock", "warehouse_movements", "products", "productions", "product_sale_stock"],
  warehouse_movements: ["warehouse_movements", "warehouse_stock", "productions"],
  product_recipes: ["product_recipes", "products", "raw_materials"],

  // Gamificação, Ranking e Loja
  profiles: ["members", "auth", "auth_session", "gamification_ranking", "profile", "public_profile", "user_insignias"],
  xp_transactions: ["xp_transactions", "members", "gamification_ranking", "profile", "auth", "auth_session"],
  xp_rules_config: ["xp_rules_config", "xp_transactions"],
  insignias: ["insignias", "member_insignias", "members", "shop_items", "profile"],
  member_insignias: ["member_insignias", "insignias", "members", "profile", "shop_items"],
  shop_items: ["shop_items", "shop_purchases", "member_insignias"],
  shop_purchases: ["shop_purchases", "shop_items", "tw_coins_transactions", "profile"],
  tw_coins_config: ["tw_coins_config", "tw_coins_transactions", "shop_items"],
  tw_coins_transactions: ["tw_coins_transactions", "members", "profile", "shop_items", "auth"],
  member_evaluations: ["member_evaluations", "members", "profile"],

  // Usuários, Cargos, Permissões e Tags
  user_roles: ["members", "user_roles", "auth", "auth_session", "role_permissions"],
  custom_roles: ["custom_roles", "role_permissions", "members", "user_roles", "auth", "auth_session"],
  role_permissions: ["role_permissions", "custom_roles", "members", "auth", "auth_session"],
  member_tags: ["member_tags", "member_tag_assignments", "members", "auth", "auth_session"],
  member_tag_assignments: ["member_tags", "member_tag_assignments", "members", "auth", "auth_session"],
  signup_requests: ["pending_signup_requests", "members", "auth"],

  // Comunicação, Avisos, Metas e Moderação
  announcements: ["announcements", "announcement_reads", "dashboard_metrics"],
  announcement_reads: ["announcement_reads", "announcements"],
  goals: ["goals", "weekly_goals", "goal_submissions"],
  tickets: ["tickets", "ticket_messages", "ticket_members"],
  ticket_messages: ["ticket_messages", "tickets"],
  ticket_members: ["ticket_members", "tickets"],
  chat_conversations: ["chat_conversations", "chat_participants"],
  chat_messages: ["chat_messages", "chat_conversations"],
  chat_message_reactions: ["chat_messages", "chat_conversations"],
  chat_participants: ["chat_conversations", "chat_participants"],
  chat_user_folders: ["chat_user_folders", "chat_conversations"],
  chat_saved_messages: ["chat_saved_messages"],
  chat_reminders: ["chat_reminders"],
  chat_reports: ["chat_reports"],
  chat_moderation_logs: ["chat_moderation_logs"],

  // Streams / Lives
  stream_sessions: ["stream_sessions", "member_stream_accounts", "stream_system_config"],
  member_stream_accounts: ["member_stream_accounts", "stream_sessions"],
  member_stream_preferences: ["member_stream_preferences", "stream_sessions"],
  stream_system_config: ["stream_system_config", "stream_sessions"],
  stream_integration_logs: ["stream_integration_logs"],

  // Social / Feed de Perfis
  profile_posts: ["profile_posts", "profile_feed", "profile_stats"],
  profile_post_comments: ["profile_comments", "profile_posts"],
  profile_post_likes: ["profile_posts", "profile_stats"],
  profile_post_bookmarks: ["profile_posts", "profile_bookmarks"],
  member_follows: ["profile_followers", "profile_following", "profile_stats"],

  // Auditoria
  audit_logs: ["audit_logs"],
};

// ==============================================================================
// 4. CANAIS CROSS-TAB (BROADCASTCHANNEL)
// ==============================================================================

export const GLOBAL_CROSS_TAB_CHANNEL = "tw_global_realtime_sync";
export const GLOBAL_BROADCAST_CHANNEL = "tw_global_realtime_broadcast";

let globalBroadcastChannel: BroadcastChannel | null = null;

export function getGlobalBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!globalBroadcastChannel) {
    try {
      globalBroadcastChannel = new BroadcastChannel(GLOBAL_CROSS_TAB_CHANNEL);
    } catch {}
  }
  return globalBroadcastChannel;
}

/**
 * Transmite uma invalidação ou evento local instantaneamente (<1ms) para todas as outras
 * abas do navegador abertas pelo mesmo usuário, evitando duplicidade de requisições.
 */
export function broadcastCrossTabEvent(payload: {
  event?: RealtimeEventType | string;
  table?: string;
  keys?: string[];
  data?: any;
}) {
  const bc = getGlobalBroadcastChannel();
  if (bc) {
    try {
      bc.postMessage({
        ...payload,
        timestamp: Date.now(),
      });
    } catch {}
  }
}

/**
 * Transmite um evento via WebSocket Supabase Realtime para todos os outros usuários conectados.
 */
export async function broadcastSupabaseRealtimeEvent(
  event: RealtimeEventType | string,
  payload: any = {}
): Promise<void> {
  try {
    const channel = supabase.channel(GLOBAL_BROADCAST_CHANNEL);
    await channel.send({
      type: "broadcast",
      event,
      payload: {
        ...payload,
        timestamp: Date.now(),
      },
    });
  } catch (err) {
    console.warn("Aviso ao emitir broadcast Realtime:", err);
  }
}
