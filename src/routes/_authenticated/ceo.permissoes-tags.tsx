import { createFileRoute, Navigate } from "@tanstack/react-router";
import { CeoGerenciarTagsPage } from "./ceo.tags";

export const Route = createFileRoute("/_authenticated/ceo/permissoes-tags")({
  component: CeoPermissoesTagsRedirect,
});

function CeoPermissoesTagsRedirect() {
  return <Navigate to="/ceo/tags" replace />;
}

export function CeoPermissoesTagsPageWrapper() {
  return <Navigate to="/ceo/tags" replace />;
}

export function CeoPermissoesTagsPage() {
  return <CeoGerenciarTagsPage />;
}
