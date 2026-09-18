import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { DevEstoquePageContent } from "./dev.estoque";

export const Route = createFileRoute("/_authenticated/dev/estoque/$tab")({
  component: DevEstoqueTabRoute,
});

function DevEstoqueTabRoute() {
  const { tab } = Route.useParams();
  return (
    <DeveloperGuard>
      <DevEstoquePageContent initialTab={tab} />
    </DeveloperGuard>
  );
}
