import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/perfil/disciplinar")({
  component: () => <Navigate to="/advertencias" replace />,
});
