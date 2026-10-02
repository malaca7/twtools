import { createFileRoute } from "@tanstack/react-router";
import { CeoGerenciarTagsPage } from "./ceo.tags";

export const Route = createFileRoute("/_authenticated/dev/tags")({
  component: DevGerenciarTagsPage,
});

export function DevTagsRedirect() {
  return <CeoGerenciarTagsPage />;
}

export function DevGerenciarTagsPageWrapper() {
  return <CeoGerenciarTagsPage />;
}

export function DevGerenciarTagsPage() {
  return <CeoGerenciarTagsPage />;
}
