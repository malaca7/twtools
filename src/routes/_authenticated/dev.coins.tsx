import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dev/coins")({
  component: DevCoinsRoute,
});

function DevCoinsRoute() {
  return <Navigate to="/dashboard" replace />;
}

export function DevCoinsPage() {
  return <Navigate to="/dashboard" replace />;
}
