import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dev/xp-insignias")({
  component: DevXpInsigniasRoute,
});

function DevXpInsigniasRoute() {
  return <Navigate to="/dashboard" replace />;
}

export function DevXpInsigniasPage() {
  return <Navigate to="/dashboard" replace />;
}
