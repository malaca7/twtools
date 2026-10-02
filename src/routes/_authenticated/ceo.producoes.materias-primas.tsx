import { createFileRoute } from "@tanstack/react-router";
import { CeoGuard } from "@/guards/CeoGuard";
import { MateriasPrimasPage } from "./producoes.materias-primas";

export const Route = createFileRoute("/_authenticated/ceo/producoes/materias-primas")({
  component: CeoProducoesMateriasPrimasRoute,
});

function CeoProducoesMateriasPrimasRoute() {
  return (
    <CeoGuard>
      <MateriasPrimasPage />
    </CeoGuard>
  );
}
