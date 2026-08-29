import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/baus")({
  component: () => <Navigate to="/estoque" replace />,
});
