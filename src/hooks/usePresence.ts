import type { UserPresenceStatus } from "@/lib/app-types";

/**
 * Hook de presença simplificado e leve.
 * Desativa totalmente heartbeats periódicos de banco de dados, timers e event listeners
 * para prevenir sobrecarga e esgotamento de cota de banco de dados.
 */
export function usePresence(_userId?: string | null) {
  return {
    status: "online" as UserPresenceStatus,
    currentStatus: "online" as UserPresenceStatus,
    isOnline: true,
    isAbsenceMode: false,
    resumeSession: () => {},
    setStatus: (_s: UserPresenceStatus) => {},
  };
}
