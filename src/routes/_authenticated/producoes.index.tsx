import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/producoes/")({
  component: ProducoesIndexRedirect,
});

function ProducoesIndexRedirect() {
  return <Navigate to="/producoes/produzir" replace />;
}
