import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { ArmazemPage } from "./producoes.armazem";

export const Route = createFileRoute("/_authenticated/dev/producoes/armazem")({
  component: DevProducoesArmazemRoute,
});

function DevProducoesArmazemRoute() {
  return (
    <DeveloperGuard>
      <ArmazemPage />
    </DeveloperGuard>
  );
}
