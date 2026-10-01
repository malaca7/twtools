import { createFileRoute, Navigate } from "@tanstack/react-router";
import { CeoGuard } from "@/guards/CeoGuard";

export const Route = createFileRoute("/_authenticated/ceo/producoes/")({
  component: CeoProducoesIndexRoute,
});

function CeoProducoesIndexRoute() {
  return (
    <CeoGuard>
      <Navigate to="/ceo/producoes/produzir" replace />
    </CeoGuard>
  );
}
