import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { MateriasPrimasPage } from "./producoes.materias-primas";

export const Route = createFileRoute("/_authenticated/dev/producoes/materias-primas")({
  component: DevProducoesMateriasPrimasRoute,
});

function DevProducoesMateriasPrimasRoute() {
  return (
    <DeveloperGuard>
      <MateriasPrimasPage />
    </DeveloperGuard>
  );
}
