import { supabase } from "@/integrations/supabase/client";

export type PermissionsRealtimeType =
  | "role_permissions"
  | "user_roles"
  | "custom_roles"
  | "menu_config"
  | "ceo_config"
  | "profiles";

export interface PermissionsRealtimePayload {
  type: PermissionsRealtimeType;
  level?: string | undefined;
  userId?: string | undefined;
  timestamp?: number | undefined;
}

const REALTIME_CHANNEL_NAME = "tw_permissions_realtime_sync";
const CROSS_TAB_CHANNEL_NAME = "tw_permissions_cross_tab_sync";

let permissionsBroadcastChannel: ReturnType<typeof supabase.channel> | null = null;
let crossTabBc: BroadcastChannel | null = null;

if (typeof BroadcastChannel !== "undefined") {
  try {
    crossTabBc = new BroadcastChannel(CROSS_TAB_CHANNEL_NAME);
  } catch {}
}

/**
 * Obtém ou inicializa o canal Supabase Realtime singleton para broadcast de permissões e cargos.
 */
export function getPermissionsRealtimeChannel() {
  if (!permissionsBroadcastChannel) {
    permissionsBroadcastChannel = supabase.channel(REALTIME_CHANNEL_NAME, {
      config: { broadcast: { self: true } },
    });
    permissionsBroadcastChannel.subscribe();
  }
  return permissionsBroadcastChannel;
}

/**
 * Dispara notificação local em tempo real no DOM da aba atual e em outras abas do navegador.
 */
export function dispatchLocalPermissionsSync(payload: PermissionsRealtimePayload) {
  if (typeof window === "undefined") return;

  try {
    if (payload.type === "role_permissions" || payload.type === "custom_roles") {
      window.dispatchEvent(new CustomEvent("tw_permissions_synced", { detail: payload }));
    }

    if (
      payload.type === "user_roles" ||
      payload.type === "profiles" ||
      payload.type === "custom_roles"
    ) {
      window.dispatchEvent(new CustomEvent("tw_auth_reload", { detail: payload }));
    }

    if (payload.type === "menu_config") {
      window.dispatchEvent(new CustomEvent("tw_menu_updated", { detail: payload }));
      window.dispatchEvent(new Event("storage"));
    }

    if (payload.type === "ceo_config") {
      window.dispatchEvent(new CustomEvent("tw_ceo_config_updated", { detail: payload }));
      window.dispatchEvent(new Event("storage"));
    }
  } catch {}
}

/**
 * Emite uma notificação em tempo real (latência < 50ms) para TODOS os membros conectados na plataforma
 * quando permissões, cargos, perfis ou menus forem atualizados/modificados.
 */
export async function broadcastPermissionsRealtimeUpdate(
  payload: PermissionsRealtimePayload
): Promise<void> {
  const fullPayload: PermissionsRealtimePayload = {
    ...payload,
    timestamp: Date.now(),
  };

  // 1. Sincronização local na aba atual com 0ms de latência
  dispatchLocalPermissionsSync(fullPayload);

  // 2. BroadcastChannel para outras abas abertas pelo mesmo membro no navegador
  try {
    if (crossTabBc) {
      crossTabBc.postMessage(fullPayload);
    }
  } catch {}

  // 3. Supabase Realtime WebSocket broadcast para todos os outros usuários conectados
  try {
    const ch = getPermissionsRealtimeChannel();
    await ch.send({
      type: "broadcast",
      event: "permissions_changed",
      payload: fullPayload,
    });
  } catch (err) {
    console.warn("Realtime permissions broadcast warning:", err);
  }
}
