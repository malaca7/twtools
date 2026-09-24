import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/lives/$tab")({
  component: LivesTabRoute,
});

function LivesTabRoute() {
  return <Navigate to="/dashboard" replace />;
}
