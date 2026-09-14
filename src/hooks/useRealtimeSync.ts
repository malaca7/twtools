import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { fetchRemoteMenuConfig } from "@/hooks/useMenuConfig";
import { fetchRemotePlatformSettings, getPlatformSettings } from "@/hooks/usePlatformSettings";
import { playGamerOnlineAlertSound, playGamerSuccessSound } from "@/lib/sound-effects";

const CROSS_TAB_CHANNEL = "tw_global_realtime_sync";

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const pendingInvalidationsRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Coalescing invalidation function to prevent micro-thrashes on rapid batch updates
    const triggerInvalidations = (keys: string[]) => {
      keys.forEach((k) => pendingInvalidationsRef.current.add(k));

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const toInvalidate = Array.from(pendingInvalidationsRef.current);
        pendingInvalidationsRef.current.clear();

        for (const key of toInvalidate) {
          void queryClient.invalidateQueries({ queryKey: [key], refetchType: "all" });
          void queryClient.refetchQueries({ queryKey: [key], type: "active" });
        }
      }, 50);
    };

    // 1. Cross-tab BroadcastChannel for 0ms local synchronization across open browser tabs
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel(CROSS_TAB_CHANNEL);
        bc.onmessage = (event) => {
          const keys = event.data?.keys;
          if (Array.isArray(keys) && keys.length > 0) {
            triggerInvalidations(keys);
          } else {
            void queryClient.invalidateQueries({ refetchType: "active" });
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

    const handleTableChange = (table: string, payload: any) => {
      let keysToInvalidate: string[] = [];

      switch (table) {
        case "products":
        case "product_baus":
          keysToInvalidate = ["products", "product_baus", "movements", "sales"];
          break;

        case "stock_movements":
        case "sales":
          keysToInvalidate = ["movements", "product_baus", "sales", "products", "audit_logs"];
          const settings = getPlatformSettings();
          if (settings.soundEffectsEnabled) {
            playGamerSuccessSound(settings.soundVolume);
          }
          break;

        case "baus":
          keysToInvalidate = ["baus", "product_baus", "products"];
          break;

        case "categories":
          keysToInvalidate = ["categories", "products", "product_baus"];
          break;

        case "profiles":
        case "user_roles":
          keysToInvalidate = ["members", "user_roles", "role_permissions", "auth", "auth_session"];
          break;

        case "custom_roles":
          keysToInvalidate = ["custom_roles", "role_permissions", "members", "user_roles"];
          break;

        case "role_permissions":
          keysToInvalidate = [
            "role_permissions",
            "weekly_goals",
            "goal_submissions",
            "goals",
            "absences",
            "members",
          ];
          void fetchRemoteMenuConfig();
          void fetchRemotePlatformSettings();
          break;

        case "signup_requests":
          keysToInvalidate = ["pending_signup_requests", "members", "auth"];
          break;

        case "user_presence":
          keysToInvalidate = ["user_presence", "members"];
          const presenceSettings = getPlatformSettings();
          if (
            presenceSettings.onlineAlertEnabled &&
            payload.new &&
            (payload.new as any).presence_status === "online"
          ) {
            playGamerOnlineAlertSound(presenceSettings.soundVolume);
          }
          break;

        case "cash_fund_movements":
          keysToInvalidate = ["cash_fund_movements", "audit_logs"];
          break;

        case "announcements":
          keysToInvalidate = ["announcements", "announcement_reads"];
          break;

        case "announcement_reads":
          keysToInvalidate = ["announcement_reads", "announcements"];
          break;

        case "goals":
          keysToInvalidate = ["goals", "weekly_goals", "goal_submissions"];
          break;

        case "audit_logs":
          keysToInvalidate = ["audit_logs"];
          break;

        case "chat_messages":
        case "chat_message_reactions":
          keysToInvalidate = ["chat_messages", "chat_conversations"];
          break;

        case "chat_conversations":
        case "chat_participants":
        case "chat_user_folders":
        case "chat_saved_messages":
        case "chat_reminders":
        case "chat_reports":
        case "chat_moderation_logs":
          keysToInvalidate = ["chat_conversations", "chat_participants"];
          break;

        default:
          void queryClient.invalidateQueries({ refetchType: "all" });
          void queryClient.refetchQueries({ type: "active" });
          return;
      }

      triggerInvalidations(keysToInvalidate);
      broadcastCrossTab(keysToInvalidate);
    };

    // 2. Supabase Realtime channel listening to all postgres_changes in public schema
    const channelName = `twtools_global_sync_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          if (payload.table) {
            handleTableChange(payload.table, payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Immediately refresh visible data on channel subscription
          void queryClient.invalidateQueries({ refetchType: "active" });
        }
      });

    // 3. Network reconnection & Window focus recovery
    const onFocus = () => {
      void queryClient.invalidateQueries({ refetchType: "active" });
    };

    const onOnline = () => {
      void queryClient.invalidateQueries({ refetchType: "active" });
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (bc) {
        bc.close();
      }
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
