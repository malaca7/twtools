import { createFileRoute } from "@tanstack/react-router";
import { CeoGuard } from "@/guards/CeoGuard";
import { ProduzirPage } from "./producoes.produzir";

export const Route = createFileRoute("/_authenticated/ceo/producoes/produzir")({
  component: CeoProducoesProduzirRoute,
});

function CeoProducoesProduzirRoute() {
  return (
    <CeoGuard>
      <ProduzirPage />
    </CeoGuard>
  );
}
