import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/lives")({
  component: LivesPage,
});

export function LivesPage() {
  return <Navigate to="/dashboard" replace />;
}
