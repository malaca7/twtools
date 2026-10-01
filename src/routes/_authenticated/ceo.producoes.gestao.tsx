import { createFileRoute } from "@tanstack/react-router";
import { CeoGuard } from "@/guards/CeoGuard";
import { GestaoProducaoPage } from "./producoes.gestao";

export const Route = createFileRoute("/_authenticated/ceo/producoes/gestao")({
  component: CeoProducoesGestaoRoute,
});

function CeoProducoesGestaoRoute() {
  return (
    <CeoGuard>
      <GestaoProducaoPage />
    </CeoGuard>
  );
}
