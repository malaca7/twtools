import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserPresence, logAuditAction } from "@/lib/app-api";
import { getPlatformSettings } from "@/hooks/usePlatformSettings";
import type { UserPresenceStatus } from "@/lib/app-types";

function getIdleTimeoutMs(): number {
  const { idleTimeoutSeconds } = getPlatformSettings();
  return (idleTimeoutSeconds || 120) * 1000;
}

function getHeartbeatIntervalMs(): number {
  const { heartbeatSeconds } = getPlatformSettings();
  return (heartbeatSeconds || 15) * 1000;
}

export function usePresence(userId?: string | null) {
  const queryClient = useQueryClient();
  const [currentStatus, setCurrentStatus] = useState<UserPresenceStatus>("online");
  const [isAbsenceMode, setIsAbsenceMode] = useState<boolean>(false);
  const statusRef = useRef(currentStatus);
  statusRef.current = currentStatus;

  const lastActivityRef = useRef<number>(Date.now());
  const sessionLoggedRef = useRef<boolean>(false);
  const lastLoggedStatusRef = useRef<UserPresenceStatus | null>(null);

  const mutation = useMutation({
    mutationFn: async (status: UserPresenceStatus) => {
      await updateUserPresence(status, 0);
    },
    onSuccess: (_, status) => {
      setCurrentStatus(status);

      // Log status change audit log if status actually changed
      if (lastLoggedStatusRef.current !== status && userId) {
        lastLoggedStatusRef.current = status;
        if (status === "online") {
          void logAuditAction("session_start", "user_presence", {
            user_id: userId,
            online_since: new Date().toISOString(),
          });
        } else if (status === "ausente") {
          void logAuditAction("session_absence", "user_presence", {
            user_id: userId,
            reason: "manual_change",
          });
        } else if (status === "offline") {
          void logAuditAction("session_end", "user_presence", {
            user_id: userId,
            reason: "manual_change",
          });
        }
      }

      void queryClient.invalidateQueries({ queryKey: ["user_presence"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
    },
  });

  const resumeSession = () => {
    lastActivityRef.current = Date.now();
    statusRef.current = "online";
    setCurrentStatus("online");
    setIsAbsenceMode(false);
    sessionStorage.setItem("tw_session_start", String(Date.now()));
    lastLoggedStatusRef.current = "online";

    void logAuditAction("session_start", "user_presence", {
      user_id: userId,
      online_since: new Date().toISOString(),
      reason: "retorno_ausencia",
    });

    updateUserPresence("online", 0)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["members"] });
        void queryClient.invalidateQueries({ queryKey: ["user_presence"] });
        void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!userId) return;

    // Ensure session start time is recorded INSTANTLY on mount
    if (typeof window !== "undefined" && !sessionStorage.getItem("tw_session_start")) {
      sessionStorage.setItem("tw_session_start", String(Date.now()));
    }

    // Send initial online heartbeat immediately
    updateUserPresence("online", 0)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["members"] });
        void queryClient.invalidateQueries({ queryKey: ["user_presence"] });
      })
      .catch(() => {});

    // Log session_start audit entry if not logged yet for this active session
    if (!sessionLoggedRef.current) {
      sessionLoggedRef.current = true;
      lastLoggedStatusRef.current = "online";
      logAuditAction("session_start", "user_presence", {
        user_id: userId,
        online_since: new Date().toISOString(),
      }).then(() => {
        void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
      });
    }

    // Listen to user activity to reset idle timer if not in forced absence screen
    const resetIdleTimer = () => {
      const now = Date.now();
      const idleTimeoutMs = getIdleTimeoutMs();
      const wasIdle = now - lastActivityRef.current > idleTimeoutMs;
      lastActivityRef.current = now;

      if (wasIdle || statusRef.current === "offline" || statusRef.current === "ausente") {
        if (!isAbsenceMode) {
          statusRef.current = "online";
          setCurrentStatus("online");
          if (lastLoggedStatusRef.current !== "online") {
            lastLoggedStatusRef.current = "online";
            logAuditAction("session_start", "user_presence", {
              user_id: userId,
              reason: "atividade_detectada",
            }).then(() => {
              void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
            });
          }
          updateUserPresence("online", 0)
            .then(() => {
              void queryClient.invalidateQueries({ queryKey: ["members"] });
              void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
            })
            .catch(() => {});
        }
      }
    };

    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Heartbeat & Inactivity Check Loop
    const heartbeatMs = getHeartbeatIntervalMs();
    const interval = setInterval(() => {
      const now = Date.now();
      const idleTimeoutMs = getIdleTimeoutMs();
      const isIdle = now - lastActivityRef.current > idleTimeoutMs;

      if (isIdle) {
        if (statusRef.current !== "ausente") {
          statusRef.current = "ausente";
          setCurrentStatus("ausente");
          setIsAbsenceMode(true);
          lastLoggedStatusRef.current = "ausente";

          void logAuditAction("session_absence", "user_presence", {
            user_id: userId,
            reason: "inatividade_timeout",
          });

          updateUserPresence("ausente", 0)
            .then(() => {
              void queryClient.invalidateQueries({ queryKey: ["members"] });
              void queryClient.invalidateQueries({ queryKey: ["user_presence"] });
              void queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
            })
            .catch(() => {});
        }
      } else {
        if (statusRef.current !== "online") {
          statusRef.current = "online";
          setCurrentStatus("online");
          setIsAbsenceMode(false);
        }
        updateUserPresence("online", 15)
          .then(() => {
            void queryClient.invalidateQueries({ queryKey: ["members"] });
          })
      }
    }, heartbeatMs);

    // Tab close / page unload listener
    const handleUnload = () => {
      const startStr = sessionStorage.getItem("tw_session_start");
      let durStr = "1min";
      if (startStr) {
        const elapsed = Math.max(1, Math.floor((Date.now() - Number(startStr)) / 1000));
        const hrs = Math.floor(elapsed / 3600);
        const mins = Math.floor((elapsed % 3600) / 60);
        durStr = hrs > 0 ? `${hrs}h ${mins}min` : `${mins || 1}min`;
      }
      void logAuditAction("session_end", "user_presence", {
        user_id: userId,
        duration_formatted: durStr,
        reason: "fechamento_aba",
      });
      updateUserPresence("offline", 0).catch(() => {});
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [userId, queryClient, isAbsenceMode]);

  return {
    status: currentStatus,
    currentStatus,
    isAbsenceMode,
    resumeSession,
    setStatus: (s: UserPresenceStatus) => mutation.mutate(s),
  };
}
