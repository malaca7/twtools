import { createFileRoute } from "@tanstack/react-router";
import { CeoGerenciarTagsPage } from "./ceo.tags";

export const Route = createFileRoute("/_authenticated/dev/gerenciar-tags")({
  component: DevGerenciarTagsRoute,
});

function DevGerenciarTagsRoute() {
  return <CeoGerenciarTagsPage />;
}
