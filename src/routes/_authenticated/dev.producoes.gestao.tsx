import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { GestaoProducaoPage } from "./producoes.gestao";

export const Route = createFileRoute("/_authenticated/dev/producoes/gestao")({
  component: DevProducoesGestaoRoute,
});

function DevProducoesGestaoRoute() {
  return (
    <DeveloperGuard>
      <GestaoProducaoPage />
    </DeveloperGuard>
  );
}
