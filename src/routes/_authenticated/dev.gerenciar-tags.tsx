import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dev/gerenciar-tags")({
  component: DevGerenciarTagsRoute,
});

function DevGerenciarTagsRoute() {
  return <Navigate to="/ceo/tags" replace />;
}
