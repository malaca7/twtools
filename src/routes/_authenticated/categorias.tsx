import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/categorias")({
  component: () => <Navigate to="/gestao-estoque/categorias" replace />,
});
