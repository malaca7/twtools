import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  TABLE_QUERY_KEYS,
  GLOBAL_CROSS_TAB_CHANNEL,
  GLOBAL_BROADCAST_CHANNEL,
  setRealtimeStatus,
  recordRealtimeEventReceived,
} from "@/lib/realtimeSync";
import { fetchRemoteMenuConfig } from "@/hooks/useMenuConfig";
import { fetchRemoteCeoMenuConfig } from "@/hooks/useCeoMenuConfig";
import { fetchRemoteDevMenuConfig } from "@/hooks/useDevMenuConfig";
import { fetchRemotePlatformSettings, getPlatformSettings } from "@/hooks/usePlatformSettings";
import { playGamerSuccessSound } from "@/lib/sound-effects";
import { getCeoTagPermissions, getCeoConfiguration } from "@/services/devService";

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const pendingInvalidationsRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    // ==========================================================================
    // 1. COALESCING INVALIDATIONS (Evita tempestade de refetches em lote)
    // ==========================================================================
    const triggerInvalidations = (keys: string[]) => {
      if (!keys || keys.length === 0) return;
      keys.forEach((k) => pendingInvalidationsRef.current.add(k));

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!isMounted) return;
        const toInvalidate = Array.from(pendingInvalidationsRef.current);
        pendingInvalidationsRef.current.clear();

        for (const key of toInvalidate) {
          void queryClient.invalidateQueries({ queryKey: [key], refetchType: "all" });
        }
        recordRealtimeEventReceived();
      }, 50);
    };

    // ==========================================================================
    // 2. SINCRONIZAÇÃO CROSS-TAB (BroadcastChannel entre abas locais)
    // ==========================================================================
    let bc: BroadcastChannel | null = null;
    let permBc: BroadcastChannel | null = null;

    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel(GLOBAL_CROSS_TAB_CHANNEL);
        bc.onmessage = (event) => {
          const keys = event.data?.keys;
          if (Array.isArray(keys) && keys.length > 0) {
            triggerInvalidations(keys);
          }
        };
      } catch {}

      try {
        permBc = new BroadcastChannel("tw_permissions_cross_tab_sync");
        permBc.onmessage = (event) => {
          const p = event.data;
          if (!p) return;

          if (p.type === "role_permissions" || p.type === "custom_roles") {
            triggerInvalidations(["role_permissions", "custom_roles"]);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_permissions_synced", { detail: p }));
            }
          }

          if (p.type === "user_roles" || p.type === "profiles" || p.type === "custom_roles") {
            triggerInvalidations(["members", "user_roles", "auth", "auth_session"]);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_auth_reload", { detail: p }));
            }
          }

          if (p.type === "menu_config") {
            if (p.level === "system_ceo_menu_config") {
              void fetchRemoteCeoMenuConfig();
            } else if (p.level === "system_dev_menu_config") {
              void fetchRemoteDevMenuConfig();
            } else {
              void fetchRemoteMenuConfig();
            }
          }

          if (p.type === "ceo_config") {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_ceo_config_updated", { detail: p }));
            }
          }
        };
      } catch {}
    }

    const broadcastCrossTab = (keys: string[]) => {
      try {
        if (bc) {
          bc.postMessage({ keys, timestamp: Date.now() });
        }
      } catch {}
    };

    // ==========================================================================
    // 3. PROCESSADOR CENTRAL DE EVENTOS DE BANCO DE DADOS (POSTGRES CDC)
    // ==========================================================================
    const handleTableChange = (table: string, payload: any) => {
      const keysToInvalidate: string[] = TABLE_QUERY_KEYS[table] || [table];

      // Disparos e efeitos específicos por módulo
      switch (table) {
        case "stock_movements": {
          const settings = getPlatformSettings();
          if (settings.soundEffectsEnabled) {
            playGamerSuccessSound(settings.soundVolume);
          }
          break;
        }

        case "profiles":
        case "user_roles":
        case "custom_roles": {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_auth_reload", { detail: payload }));
            window.dispatchEvent(new CustomEvent("tw_permissions_synced", { detail: payload }));
          }
          break;
        }

        case "role_permissions": {
          const changedLevel = payload?.new?.level || payload?.old?.level;
          if (changedLevel === "system_menu_config") {
            void fetchRemoteMenuConfig();
            return;
          }
          if (changedLevel === "system_ceo_menu_config") {
            void fetchRemoteCeoMenuConfig();
            return;
          }
          if (changedLevel === "system_dev_menu_config") {
            void fetchRemoteDevMenuConfig();
            return;
          }
          if (changedLevel === "ceo") {
            void getCeoTagPermissions();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_ceo_config_updated"));
              window.dispatchEvent(new CustomEvent("tw_permissions_synced", { detail: { level: "ceo" } }));
            }
            break;
          }
          if (changedLevel === "desenvolvedor") {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_dev_config_updated"));
              window.dispatchEvent(new CustomEvent("tw_permissions_synced", { detail: { level: "desenvolvedor" } }));
            }
            break;
          }
          if (changedLevel === "system_ceo_config") {
            void getCeoConfiguration();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_ceo_config_updated"));
            }
            return;
          }
          if (changedLevel === "system_platform_settings") {
            void fetchRemotePlatformSettings();
            return;
          }
          if (changedLevel === "system_weekly_goals") {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_weekly_goals_updated"));
            }
            break;
          }
          if (changedLevel === "system_goal_submissions") {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_goal_submissions_updated"));
            }
            break;
          }
          if (changedLevel === "system_absences_list") {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_absences_updated"));
            }
            break;
          }
          if (changedLevel === "system_notifications_data") {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_notifications_updated"));
            }
            break;
          }
          if (changedLevel === "system_notification_rules") {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_notification_rules_updated"));
            }
            return;
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_permissions_synced", { detail: { level: changedLevel } }));
          }
          break;
        }

        case "member_tags":
        case "member_tag_assignments": {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_member_tags_updated", { detail: payload }));
            window.dispatchEvent(new CustomEvent("tw_auth_reload", { detail: payload }));
          }
          break;
        }

        case "signup_requests": {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_auth_reload", { detail: payload }));
          }
          break;
        }

        case "announcements":
        case "announcement_reads": {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_announcements_updated", { detail: payload }));
          }
          break;
        }

        case "goals": {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_weekly_goals_updated", { detail: payload }));
          }
          break;
        }

        case "tickets":
        case "ticket_messages":
        case "ticket_members": {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_tickets_updated", { detail: payload }));
          }
          break;
        }

        case "chat_messages":
        case "chat_conversations":
        case "chat_participants": {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_chat_updated", { detail: payload }));
          }
          break;
        }

        case "stream_sessions":
        case "member_stream_accounts":
        case "stream_system_config": {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_lives_updated", { detail: payload }));
          }
          break;
        }

        case "xp_transactions":
        case "tw_coins_transactions":
        case "member_insignias": {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("tw_gamification_updated", { detail: payload }));
          }
          break;
        }

        default:
          break;
      }

      triggerInvalidations(keysToInvalidate);
      broadcastCrossTab(keysToInvalidate);
    };

    // ==========================================================================
    // 4. CANAIS SUPABASE REALTIME (WEBSOCKET COM RECONEXÃO PROGRESSIVA)
    // ==========================================================================
    let globalCdcChannel: any = null;
    let stockBroadcastChannel: any = null;
    let settingsBroadcastChannel: any = null;
    let permissionsBroadcastChannel: any = null;
    let appEventsBroadcastChannel: any = null;

    const setupChannels = () => {
      // 4.1 Canal CDC Global em todas as tabelas públicas com REPLICA IDENTITY FULL
      const uniqueChannelId = `tw_global_cdc_${Math.random().toString(36).substring(2, 9)}`;
      globalCdcChannel = supabase
        .channel(uniqueChannelId)
        .on(
          "postgres_changes",
          { event: "*", schema: "public" },
          (payload) => {
            if (payload.table) {
              handleTableChange(payload.table, payload);
            }
          }
        )
        .subscribe((status, err) => {
          if (!isMounted) return;

          if (status === "SUBSCRIBED") {
            reconnectAttemptsRef.current = 0;
            setRealtimeStatus("connected", {
              lastSyncTimestamp: Date.now(),
              activeChannels: 5,
              lastError: null,
            });
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            const errorMsg = err?.message || `Status: ${status}`;
            setRealtimeStatus("reconnecting", { lastError: errorMsg });
            scheduleAutoReconnect();
          } else if (status === "CLOSED") {
            setRealtimeStatus("offline");
          }
        });

      // 4.2 Canal Broadcast de Movimentações de Estoque instantâneas (<50ms)
      stockBroadcastChannel = supabase
        .channel("system-stock-events")
        .on("broadcast", { event: "stock_movement_created" }, (_payload) => {
          const stockKeys = ["movements", "product_baus", "baus", "products", "dashboard_metrics"];
          triggerInvalidations(stockKeys);
          broadcastCrossTab(stockKeys);

          const settings = getPlatformSettings();
          if (settings.soundEffectsEnabled) {
            playGamerSuccessSound(settings.soundVolume);
          }
        })
        .subscribe();

      // 4.3 Canal Broadcast de Configurações da Plataforma e Modo Manutenção
      settingsBroadcastChannel = supabase
        .channel("system-platform-settings")
        .on("broadcast", { event: "platform_settings_updated" }, (payload) => {
          if (payload?.payload?.settings) {
            try {
              localStorage.setItem("tw_platform_settings", JSON.stringify(payload.payload.settings));
            } catch {}
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("tw_platform_settings_updated", { detail: payload.payload.settings })
              );
            }
            triggerInvalidations(["platform_settings"]);
          }
        })
        .subscribe();

      // 4.4 Canal Broadcast de Permissões, Cargos e Tags (<50ms)
      permissionsBroadcastChannel = supabase
        .channel("tw_permissions_realtime_sync")
        .on("broadcast", { event: "permissions_changed" }, (msg: any) => {
          const p = msg?.payload;
          if (!p) return;

          if (p.type === "role_permissions" || p.type === "custom_roles") {
            if (p.level === "ceo") {
              void getCeoTagPermissions();
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("tw_ceo_config_updated"));
              }
            }
            triggerInvalidations(["role_permissions", "custom_roles"]);
            broadcastCrossTab(["role_permissions", "custom_roles"]);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_permissions_synced", { detail: p }));
            }
          }

          if (p.type === "user_roles" || p.type === "profiles" || p.type === "custom_roles") {
            triggerInvalidations(["members", "user_roles", "auth", "auth_session"]);
            broadcastCrossTab(["members", "user_roles", "auth", "auth_session"]);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_auth_reload", { detail: p }));
            }
          }

          if (p.type === "menu_config") {
            if (p.level === "system_ceo_menu_config") {
              void fetchRemoteCeoMenuConfig();
            } else if (p.level === "system_dev_menu_config") {
              void fetchRemoteDevMenuConfig();
            } else {
              void fetchRemoteMenuConfig();
            }
          }

          if (p.type === "ceo_config") {
            void getCeoConfiguration();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("tw_ceo_config_updated", { detail: p }));
            }
          }
        })
        .subscribe();

      // 4.5 Barramento Global de Eventos de Aplicação
      appEventsBroadcastChannel = supabase
        .channel(GLOBAL_BROADCAST_CHANNEL)
        .on("broadcast", { event: "*" }, (msg: any) => {
          const eventType = msg.event;
          const payload = msg.payload;

          if (payload?.keys && Array.isArray(payload.keys)) {
            triggerInvalidations(payload.keys);
            broadcastCrossTab(payload.keys);
          }

          if (typeof window !== "undefined" && eventType) {
            window.dispatchEvent(new CustomEvent(`tw_event_${eventType}`, { detail: payload }));
          }
        })
        .subscribe();
    };

    const cleanupChannels = () => {
      if (globalCdcChannel) void supabase.removeChannel(globalCdcChannel);
      if (stockBroadcastChannel) void supabase.removeChannel(stockBroadcastChannel);
      if (settingsBroadcastChannel) void supabase.removeChannel(settingsBroadcastChannel);
      if (permissionsBroadcastChannel) void supabase.removeChannel(permissionsBroadcastChannel);
      if (appEventsBroadcastChannel) void supabase.removeChannel(appEventsBroadcastChannel);
    };

    // ==========================================================================
    // 5. RECONEXÃO COM BACKOFF PROGRESSIVO E RESINCRONIZAÇÃO TOTAL
    // ==========================================================================
    const scheduleAutoReconnect = () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

      reconnectAttemptsRef.current += 1;
      // Backoff progressivo: 1s, 2s, 4s, 8s até no máximo 15s
      const delay = Math.min(15000, 1000 * Math.pow(2, Math.min(reconnectAttemptsRef.current - 1, 4)));

      reconnectTimeoutRef.current = setTimeout(async () => {
        if (!isMounted) return;
        setRealtimeStatus("reconnecting");
        cleanupChannels();
        setupChannels();

        // Resincroniza todas as queries ativas da interface após restabelecer conexão
        try {
          setRealtimeStatus("syncing");
          await queryClient.refetchQueries({ type: "active" });
          setRealtimeStatus("connected", { lastSyncTimestamp: Date.now() });
        } catch {
          setRealtimeStatus("connected");
        }
      }, delay);
    };

    // ==========================================================================
    // 6. DETECÇÃO DE STATUS DE REDE DO NAVEGADOR (ONLINE / OFFLINE)
    // ==========================================================================
    const handleOnline = async () => {
      setRealtimeStatus("syncing");
      reconnectAttemptsRef.current = 0;
      cleanupChannels();
      setupChannels();

      try {
        await queryClient.refetchQueries({ type: "active" });
        setRealtimeStatus("connected", { lastSyncTimestamp: Date.now() });
      } catch {
        setRealtimeStatus("connected");
      }
    };

    const handleOffline = () => {
      setRealtimeStatus("offline");
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    // Inicializa canais WebSocket
    setupChannels();

    // ==========================================================================
    // 7. TEARDOWN E LIMPEZA
    // ==========================================================================
    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }

      if (bc) bc.close();
      if (permBc) permBc.close();
      cleanupChannels();
    };
  }, [queryClient]);
}
