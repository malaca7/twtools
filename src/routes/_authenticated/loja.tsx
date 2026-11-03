import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/loja")({
  component: ShopRoute,
});

function ShopRoute() {
  return <Navigate to="/dashboard" replace />;
}
