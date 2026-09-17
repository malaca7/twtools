import { supabase } from "@/integrations/supabase/client";
import type { AppLevel } from "@/lib/permissions";
import {
  type AppNotification,
  type CreateNotificationPayload,
  type NotificationTypeRules,
  DEFAULT_NOTIFICATION_RULES,
} from "@/types/notifications";

const NOTIFICATIONS_STORAGE_KEY = "tw_notifications_v1";
const NOTIFICATIONS_DB_LEVEL = "system_notifications_data";
const NOTIFICATIONS_RULES_DB_LEVEL = "system_notification_rules";
const MAX_NOTIFICATIONS_HISTORY = 250;

let notificationsBroadcastChannel: any = null;

/**
 * Retorna ou inicializa o canal Supabase Realtime singleton para sincronização de notificações.
 */
export function getNotificationsRealtimeChannel() {
  if (!notificationsBroadcastChannel) {
    notificationsBroadcastChannel = supabase.channel("tw_notifications_realtime_sync", {
      config: { broadcast: { self: true } },
    });

    // 1. Escutar broadcast de notificação disparado por outros clientes
    notificationsBroadcastChannel.on(
      "broadcast",
      { event: "notification_broadcast" },
      (payload: any) => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("tw_notifications_updated", { detail: payload?.payload })
          );
        }
      }
    );

    // 2. Escutar inserções em audit_logs para a entidade 'notifications'
    notificationsBroadcastChannel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "audit_logs",
      },
      (payload: any) => {
        const row = payload.new;
        if (
          row?.entity === "notifications" ||
          (row?.action && String(row.action).includes("notification"))
        ) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_notifications_updated"));
          }
        }
      }
    );

    // 3. Escutar alterações em role_permissions para level = 'system_notifications_data' ou 'system_notification_rules'
    notificationsBroadcastChannel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "role_permissions",
      },
      (payload: any) => {
        const row = payload.new || payload.old;
        if (
          row?.level === NOTIFICATIONS_DB_LEVEL ||
          row?.level === NOTIFICATIONS_RULES_DB_LEVEL ||
          !row?.level
        ) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_notifications_updated"));
            window.dispatchEvent(new CustomEvent("tw_notification_rules_updated"));
          }
        }
      }
    );

    notificationsBroadcastChannel.subscribe();
  }
  return notificationsBroadcastChannel;
}

/**
 * Emite atualização de sincronização para:
 * 1. Aba atual (CustomEvent)
 * 2. Outras abas locais (BroadcastChannel + LocalStorage storage event)
 * 3. Outros clientes / computadores conectados (Supabase Realtime WebSocket)
 */
export function broadcastNotificationsRealtimeUpdate(payload?: any): void {
  try {
    if (typeof window !== "undefined") {
      // Aba atual
      window.dispatchEvent(new CustomEvent("tw_notifications_updated", { detail: payload }));

      // Storage event cross-tab
      try {
        localStorage.setItem("tw_notifications_sync_ping", String(Date.now()));
      } catch {}

      // BroadcastChannel cross-tab
      try {
        const bc = new BroadcastChannel("tw_notifications_channel");
        bc.postMessage({ type: "notifications_sync", payload, timestamp: Date.now() });
        setTimeout(() => {
          try {
            bc.close();
          } catch {}
        }, 1000);
      } catch {}
    }

    // WebSocket Supabase Realtime
    const ch = getNotificationsRealtimeChannel();
    const sendMsg = () => {
      void ch.send({
        type: "broadcast",
        event: "notification_broadcast",
        payload: payload || { timestamp: Date.now() },
      });
    };

    if (ch.state === "joined") {
      sendMsg();
    } else {
      ch.subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          sendMsg();
        }
      });
    }
  } catch (err) {
    console.warn("Erro ao emitir broadcast de notificações:", err);
  }
}

/**
 * Obtém a lista bruta de notificações do localStorage (cache instantâneo)
 */
function getLocalNotifications(): AppNotification[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Atualiza o cache local de notificações
 */
function setLocalNotifications(notifications: AppNotification[], emitEvent: boolean = true): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
      if (emitEvent) {
        window.dispatchEvent(new CustomEvent("tw_notifications_updated"));
      }
    }
  } catch {}
}

/**
 * Busca a lista de todas as notificações gravadas no banco de dados (crua)
 */
export async function fetchAllRawNotifications(): Promise<AppNotification[]> {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", NOTIFICATIONS_DB_LEVEL)
      .maybeSingle();

    if (!error && data && data.permissions && typeof data.permissions === "object") {
      const parsed = data.permissions as any;
      if (Array.isArray(parsed.notifications)) {
        setLocalNotifications(parsed.notifications, false);
        return parsed.notifications as AppNotification[];
      }
    }
  } catch (err) {
    console.warn("Erro ao carregar notificações do banco:", err);
  }
  return getLocalNotifications();
}

/**
 * Salva a lista completa no banco via save_role_permissions RPC (SECURITY DEFINER) ou upsert
 */
export async function persistRawNotifications(notifications: AppNotification[]): Promise<void> {
  const capped = notifications.slice(0, MAX_NOTIFICATIONS_HISTORY);
  setLocalNotifications(capped, false);

  try {
    const { error: rpcError } = await supabase.rpc("save_role_permissions", {
      _level: NOTIFICATIONS_DB_LEVEL,
      _permissions: { notifications: capped },
    });
    if (!rpcError) return;
  } catch {}

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: NOTIFICATIONS_DB_LEVEL,
        nivel: NOTIFICATIONS_DB_LEVEL,
        permissions: { notifications: capped },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.warn("Erro ao persistir notificações no banco:", err);
  }
}

/**
 * Obtém as notificações filtradas para o usuário atual
 */
export async function getNotifications(
  userId?: string | null,
  userLevel?: AppLevel | null
): Promise<AppNotification[]> {
  const all = await fetchAllRawNotifications();
  if (!userId) return [];

  const filtered = all.filter((n) => {
    if (n.type === "chat") return false;

    // Se estiver explicitamente pausada/inativa, não entrega a membros normais
    if (n.is_active === false) return false;

    // 1. Se o usuário excluiu/dispensou a notificação, não exibir
    if (Array.isArray(n.deleted_by) && n.deleted_by.includes(userId)) {
      return false;
    }

    // 2. Destinatário específico ou global
    const isRecipient = n.user_id === "all" || n.user_id === userId;
    if (!isRecipient) return false;

    // 3. Filtro por cargos (se especificado)
    if (Array.isArray(n.target_roles) && n.target_roles.length > 0) {
      if (!userLevel || !n.target_roles.includes(userLevel)) {
        return false;
      }
    }

    return true;
  });

  return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Cria e envia uma nova notificação em tempo real
 */
export async function createNotification(payload: CreateNotificationPayload): Promise<AppNotification> {
  if (payload.type === "chat") {
    return {
      id: `chat_ignore_${Date.now()}`,
      title: payload.title,
      message: payload.message,
      type: "chat",
      category: "info",
      user_id: payload.user_id || "all",
      created_at: new Date().toISOString(),
      read_by: [],
      deleted_by: [],
      is_active: true,
    };
  }

  const all = await fetchAllRawNotifications();
  const now = new Date().toISOString();
  const newNotification: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: payload.title.trim(),
    message: payload.message.trim(),
    type: payload.type,
    category: payload.category || "info",
    user_id: payload.user_id || "all",
    target_roles: payload.target_roles,
    link: payload.link,
    metadata: payload.metadata,
    sender_id: payload.sender_id,
    sender_name: payload.sender_name,
    sender_avatar: payload.sender_avatar,
    created_at: now,
    read_by: [],
    deleted_by: [],
    is_active: payload.is_active !== undefined ? payload.is_active : true,
  };

  const updatedList = [newNotification, ...all.filter((n) => n.id !== newNotification.id)];
  await persistRawNotifications(updatedList);
  broadcastNotificationsRealtimeUpdate(newNotification);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("audit_logs").insert({
      action: "send_notification",
      entity: "notifications",
      entity_id: newNotification.id,
      user_id: session?.user?.id || null,
      new_data: {
        title: newNotification.title,
        type: newNotification.type,
        category: newNotification.category,
        recipient: newNotification.user_id,
        created_at: now,
      },
    });
  } catch {}

  return newNotification;
}

/**
 * Atualiza campos de uma notificação existente (usado nos painéis CEO e DEV)
 */
export async function updateAdminNotification(
  id: string,
  updates: Partial<AppNotification>
): Promise<AppNotification> {
  const all = await fetchAllRawNotifications();
  let updatedNotif: AppNotification | null = null;

  const updatedList = all.map((n) => {
    if (n.id === id) {
      updatedNotif = {
        ...n,
        ...updates,
      };
      return updatedNotif;
    }
    return n;
  });

  if (!updatedNotif) {
    throw new Error("Notificação não encontrada para atualização.");
  }

  await persistRawNotifications(updatedList);
  broadcastNotificationsRealtimeUpdate({ action: "admin_update", notification: updatedNotif });
  return updatedNotif;
}

/**
 * Alterna status ativo/pausado de uma notificação (usado nos painéis CEO e DEV)
 */
export async function toggleAdminNotificationActive(
  id: string,
  isActive: boolean
): Promise<AppNotification> {
  return updateAdminNotification(id, { is_active: isActive });
}

/**
 * Exclui definitivamente uma notificação de toda a plataforma (usado nos painéis CEO e DEV)
 */
export async function deleteAdminNotification(id: string): Promise<void> {
  const all = await fetchAllRawNotifications();
  const filtered = all.filter((n) => n.id !== id);
  await persistRawNotifications(filtered);
  broadcastNotificationsRealtimeUpdate({ action: "admin_delete", id });
}

/**
 * Limpa notificações em massa (Purge - exclusivo Painel DEV)
 */
export async function purgeAdminNotifications(filter?: {
  type?: string;
  category?: string;
  olderThanDays?: number;
}): Promise<number> {
  const all = await fetchAllRawNotifications();
  let remaining = all;

  if (filter?.type && filter.type !== "all") {
    remaining = remaining.filter((n) => n.type !== filter.type);
  }
  if (filter?.category && filter.category !== "all") {
    remaining = remaining.filter((n) => n.category !== filter.category);
  }
  if (filter?.olderThanDays && filter.olderThanDays > 0) {
    const cutoff = Date.now() - filter.olderThanDays * 86400000;
    remaining = remaining.filter((n) => new Date(n.created_at).getTime() > cutoff);
  }
  if (!filter || Object.keys(filter).length === 0) {
    remaining = [];
  }

  const removedCount = all.length - remaining.length;
  await persistRawNotifications(remaining);
  broadcastNotificationsRealtimeUpdate({ action: "admin_purge", removedCount });
  return removedCount;
}

/**
 * Marca uma notificação individual como lida para o usuário atual
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  if (!userId) return;
  const all = await fetchAllRawNotifications();

  let modified = false;
  const updatedList = all.map((n) => {
    if (n.id === notificationId) {
      const readBy = Array.isArray(n.read_by) ? [...n.read_by] : [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        modified = true;
      }
      return { ...n, read_by: readBy };
    }
    return n;
  });

  if (modified) {
    await persistRawNotifications(updatedList);
    broadcastNotificationsRealtimeUpdate({ action: "mark_read", notificationId, userId });
  }
}

/**
 * Marca todas as notificações visíveis como lidas para o usuário atual
 */
export async function markAllNotificationsAsRead(
  userId: string,
  userLevel?: AppLevel | null
): Promise<void> {
  if (!userId) return;
  const all = await fetchAllRawNotifications();

  let modified = false;
  const updatedList = all.map((n) => {
    if (Array.isArray(n.deleted_by) && n.deleted_by.includes(userId)) return n;
    const isRecipient = n.user_id === "all" || n.user_id === userId;
    if (!isRecipient) return n;
    if (Array.isArray(n.target_roles) && n.target_roles.length > 0) {
      if (!userLevel || !n.target_roles.includes(userLevel)) return n;
    }

    const readBy = Array.isArray(n.read_by) ? [...n.read_by] : [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      modified = true;
    }
    return { ...n, read_by: readBy };
  });

  if (modified) {
    await persistRawNotifications(updatedList);
    broadcastNotificationsRealtimeUpdate({ action: "mark_all_read", userId });
  }
}

/**
 * Exclui/dispensa uma notificação para o usuário atual
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  if (!userId) return;
  const all = await fetchAllRawNotifications();

  let modified = false;
  const updatedList = all.map((n) => {
    if (n.id === notificationId) {
      const deletedBy = Array.isArray(n.deleted_by) ? [...n.deleted_by] : [];
      if (!deletedBy.includes(userId)) {
        deletedBy.push(userId);
        modified = true;
      }
      return { ...n, deleted_by: deletedBy };
    }
    return n;
  });

  if (modified) {
    await persistRawNotifications(updatedList);
    broadcastNotificationsRealtimeUpdate({ action: "delete", notificationId, userId });
  }
}

/**
 * Limpa todas as notificações visíveis para o usuário atual (adiciona seu ID a deleted_by)
 */
export async function clearAllNotifications(userId: string, userLevel?: AppLevel | null): Promise<void> {
  if (!userId) return;
  const all = await fetchAllRawNotifications();

  let modified = false;
  const updatedList = all.map((n) => {
    const isRecipient = n.user_id === "all" || n.user_id === userId;
    if (!isRecipient) return n;
    if (Array.isArray(n.target_roles) && n.target_roles.length > 0) {
      if (!userLevel || !n.target_roles.includes(userLevel)) return n;
    }

    const deletedBy = Array.isArray(n.deleted_by) ? [...n.deleted_by] : [];
    if (!deletedBy.includes(userId)) {
      deletedBy.push(userId);
      modified = true;
    }
    return { ...n, deleted_by: deletedBy };
  });

  if (modified) {
    await persistRawNotifications(updatedList);
    broadcastNotificationsRealtimeUpdate({ action: "clear_all", userId });
  }
}

/**
 * Busca a matriz de regras de tipos de notificação por Cargo e Tag (exclusivo Dev)
 */
export async function fetchNotificationTypeRules(): Promise<NotificationTypeRules> {
  try {
    const { data } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("level", NOTIFICATIONS_RULES_DB_LEVEL)
      .maybeSingle();

    if (data && data.permissions && typeof data.permissions === "object") {
      const p = data.permissions as any;
      if (p.roles && p.tags) {
        return p as NotificationTypeRules;
      }
    }
  } catch (err) {
    console.warn("Erro ao carregar regras de tipos de notificação:", err);
  }
  return DEFAULT_NOTIFICATION_RULES;
}

/**
 * Salva a matriz de regras de tipos de notificação por Cargo e Tag (exclusivo Dev)
 */
export async function saveNotificationTypeRules(
  rules: NotificationTypeRules,
  updatedBy?: string
): Promise<void> {
  const payload = {
    ...rules,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  try {
    await supabase.rpc("save_role_permissions", {
      _level: NOTIFICATIONS_RULES_DB_LEVEL,
      _permissions: payload,
    });
  } catch {}

  try {
    await supabase.from("role_permissions").upsert(
      {
        level: NOTIFICATIONS_RULES_DB_LEVEL,
        nivel: NOTIFICATIONS_RULES_DB_LEVEL,
        permissions: payload as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "level" }
    );
  } catch (err) {
    console.warn("Falha ao salvar regras de tipos de notificação:", err);
  }

  broadcastNotificationsRealtimeUpdate({ action: "rules_updated" });
}

/**
 * Helpers de preferências de som de notificação
 */
export function isNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("tw_notifications_sound_enabled");
  return stored !== "false";
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("tw_notifications_sound_enabled", String(enabled));
  window.dispatchEvent(new CustomEvent("tw_notifications_sound_toggle", { detail: { enabled } }));
}
