import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { fetchRemoteMenuConfig } from "@/hooks/useMenuConfig";
import { fetchRemotePlatformSettings, getPlatformSettings } from "@/hooks/usePlatformSettings";
import { playGamerOnlineAlertSound, playGamerSuccessSound } from "@/lib/sound-effects";

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("global-twtools-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          const table = payload.table;

          if (table === "products") {
            void queryClient.invalidateQueries({ queryKey: ["products"] });
            void queryClient.invalidateQueries({ queryKey: ["movements"] });
          } else if (table === "stock_movements" || table === "sales") {
            void queryClient.invalidateQueries({ queryKey: ["movements"] });
            void queryClient.invalidateQueries({ queryKey: ["sales"] });
            void queryClient.invalidateQueries({ queryKey: ["products"] });
            void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });

            const settings = getPlatformSettings();
            if (settings.soundEffectsEnabled) {
              playGamerSuccessSound(settings.soundVolume);
            }
          } else if (table === "user_presence") {
            void queryClient.invalidateQueries({ queryKey: ["user_presence"] });
            void queryClient.invalidateQueries({ queryKey: ["members"] });

            const settings = getPlatformSettings();
            if (settings.onlineAlertEnabled && payload.new && (payload.new as any).presence_status === "online") {
              playGamerOnlineAlertSound(settings.soundVolume);
            }
          } else if (table === "categories") {
            void queryClient.invalidateQueries({ queryKey: ["categories"] });
            void queryClient.invalidateQueries({ queryKey: ["products"] });
          } else if (table === "baus") {
            void queryClient.invalidateQueries({ queryKey: ["baus"] });
            void queryClient.invalidateQueries({ queryKey: ["products"] });
          } else if (table === "profiles" || table === "user_roles") {
            void queryClient.invalidateQueries({ queryKey: ["members"] });
            void queryClient.invalidateQueries({ queryKey: ["user_roles"] });
          } else if (table === "signup_requests") {
            void queryClient.invalidateQueries({ queryKey: ["pending_signup_requests"] });
            void queryClient.invalidateQueries({ queryKey: ["members"] });
          } else if (table === "user_presence") {
            void queryClient.invalidateQueries({ queryKey: ["user_presence"] });
            void queryClient.invalidateQueries({ queryKey: ["members"] });
          } else if (table === "role_permissions") {
            void queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
            void queryClient.invalidateQueries({ queryKey: ["members"] });
            void fetchRemoteMenuConfig();
            void fetchRemotePlatformSettings();
          } else if (table === "cash_fund_movements") {
            void queryClient.invalidateQueries({ queryKey: ["cash_fund_movements"] });
            void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
          } else if (table === "custom_roles") {
            void queryClient.invalidateQueries({ queryKey: ["custom_roles"] });
            void queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
            void queryClient.invalidateQueries({ queryKey: ["members"] });
          } else if (table === "announcements") {
            void queryClient.invalidateQueries({ queryKey: ["announcements"] });
          } else if (table === "announcement_reads") {
            void queryClient.invalidateQueries({ queryKey: ["announcement_reads"] });
            void queryClient.invalidateQueries({ queryKey: ["announcements"] });
          } else if (table === "audit_logs") {
            void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
          } else {
            void queryClient.invalidateQueries();
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void queryClient.invalidateQueries();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
