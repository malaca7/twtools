import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { DevGerenciarTagsPage } from "./dev.tags";

export const Route = createFileRoute("/_authenticated/dev/gerenciar-tags")({
  component: DevGerenciarTagsRoute,
});

function DevGerenciarTagsRoute() {
  return (
    <DeveloperGuard>
      <DevGerenciarTagsPage />
    </DeveloperGuard>
  );
}
