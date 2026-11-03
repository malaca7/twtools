import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dev/loja")({
  component: DevShopStoreRoute,
});

function DevShopStoreRoute() {
  return <Navigate to="/dashboard" replace />;
}
