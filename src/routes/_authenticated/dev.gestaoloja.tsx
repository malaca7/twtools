import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dev/gestaoloja")({
  component: DevShopRoute,
});

function DevShopRoute() {
  return <Navigate to="/dashboard" replace />;
}

export function DevShopPage() {
  return <Navigate to="/dashboard" replace />;
}
