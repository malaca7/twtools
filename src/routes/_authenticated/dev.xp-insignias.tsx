import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { useAuth } from "@/hooks/useAuth";
import { NoAccess } from "@/components/ui-kit";
import { DevGamificationManager } from "@/components/dev/DevGamificationManager";

export const Route = createFileRoute("/_authenticated/dev/xp-insignias")({
  component: DevXpInsigniasRoute,
});

function DevXpInsigniasRoute() {
  return (
    <DeveloperGuard>
      <DevXpInsigniasPage />
    </DeveloperGuard>
  );
}

export function DevXpInsigniasPage({ initialTab }: { initialTab?: string }) {
  const { hasPermission, isDevUser } = useAuth();

  if (!isDevUser && !hasPermission("manage_dev_gamification")) {
    return <NoAccess />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      <DevGamificationManager initialTab={initialTab} />
    </div>
  );
}
