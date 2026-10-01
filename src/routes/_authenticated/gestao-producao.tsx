import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gestao-producao")({
  component: () => <Navigate to="/producoes/gestao" replace />,
});
