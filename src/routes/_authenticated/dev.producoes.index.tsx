import { createFileRoute, Navigate } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";

export const Route = createFileRoute("/_authenticated/dev/producoes/")({
  component: DevProducoesIndexRoute,
});

function DevProducoesIndexRoute() {
  return (
    <DeveloperGuard>
      <Navigate to="/dev/producoes/produzir" replace />
    </DeveloperGuard>
  );
}
