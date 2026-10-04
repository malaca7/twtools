import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/perfil/advertencias")({
  component: () => <Navigate to="/advertencias" replace />,
});
