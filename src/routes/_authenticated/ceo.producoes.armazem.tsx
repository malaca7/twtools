import { createFileRoute } from "@tanstack/react-router";
import { CeoGuard } from "@/guards/CeoGuard";
import { ArmazemPage } from "./producoes.armazem";

export const Route = createFileRoute("/_authenticated/ceo/producoes/armazem")({
  component: CeoProducoesArmazemRoute,
});

function CeoProducoesArmazemRoute() {
  return (
    <CeoGuard>
      <ArmazemPage />
    </CeoGuard>
  );
}
