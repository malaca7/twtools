import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { ProduzirPage } from "./producoes.produzir";

export const Route = createFileRoute("/_authenticated/dev/producoes/produzir")({
  component: DevProducoesProduzirRoute,
});

function DevProducoesProduzirRoute() {
  return (
    <DeveloperGuard>
      <ProduzirPage />
    </DeveloperGuard>
  );
}
