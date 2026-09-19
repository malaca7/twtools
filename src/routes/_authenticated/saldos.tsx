import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/saldos")({
  component: () => <Navigate to="/gestao-estoque/saldos" replace />,
});
