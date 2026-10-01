import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/producoes/gestao-producao")({
  component: () => <Navigate to="/producoes/gestao" replace />,
});
