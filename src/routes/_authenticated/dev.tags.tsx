import { createFileRoute, Navigate } from "@tanstack/react-router";
import { CeoGerenciarTagsPage } from "./ceo.tags";

export const Route = createFileRoute("/_authenticated/dev/tags")({
  component: DevTagsRedirect,
});

function DevTagsRedirect() {
  return <Navigate to="/ceo/tags" replace />;
}

export function DevGerenciarTagsPageWrapper() {
  return <Navigate to="/ceo/tags" replace />;
}

export function DevGerenciarTagsPage() {
  return <CeoGerenciarTagsPage />;
}
