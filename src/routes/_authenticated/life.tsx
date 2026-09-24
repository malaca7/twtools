import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/life")({
  component: LifePage,
});

export function LifePage() {
  return <Navigate to="/dashboard" replace />;
}
