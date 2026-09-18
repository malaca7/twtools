import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/produtos")({
  component: () => <Navigate to="/controledeestoque" replace />,
});
