import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/logs")({
  component: LogsPage,
});

export function LogsPage() {
  return <Navigate to="/dashboard" replace />;
}
