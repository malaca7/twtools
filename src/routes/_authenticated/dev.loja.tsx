import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { useAuth } from "@/hooks/useAuth";
import { NoAccess } from "@/components/ui-kit";
import { DevShopManager } from "@/components/dev/DevShopManager";

export const Route = createFileRoute("/_authenticated/dev/loja")({
  component: DevShopRoute,
});

function DevShopRoute() {
  return (
    <DeveloperGuard>
      <DevShopPage />
    </DeveloperGuard>
  );
}

export function DevShopPage() {
  const { hasPermission, isDevUser } = useAuth();

  if (!isDevUser && !hasPermission("view_dev_shop")) {
    return <NoAccess />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      <DevShopManager />
    </div>
  );
}
