import { useSyncExternalStore } from "react";
import { getRealtimeState, subscribeRealtimeStatus, type RealtimeState } from "@/lib/realtimeSync";

export function useRealtimeStatus(): RealtimeState {
  return useSyncExternalStore(
    subscribeRealtimeStatus,
    getRealtimeState,
    getRealtimeState
  );
}
