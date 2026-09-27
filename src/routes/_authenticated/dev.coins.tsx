import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { useAuth } from "@/hooks/useAuth";
import { NoAccess } from "@/components/ui-kit";
import { DevCoinsManager } from "@/components/dev/DevCoinsManager";

export const Route = createFileRoute("/_authenticated/dev/coins")({
  component: DevCoinsRoute,
});

function DevCoinsRoute() {
  return (
    <DeveloperGuard>
      <DevCoinsPage />
    </DeveloperGuard>
  );
}

export function DevCoinsPage() {
  const { hasPermission, isDevUser } = useAuth();

  if (!isDevUser && !hasPermission("view_dev_coins")) {
    return <NoAccess />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      <DevCoinsManager />
    </div>
  );
}
