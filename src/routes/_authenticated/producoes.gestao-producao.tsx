import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/producoes/gestao-producao")({
  component: GestaoProducaoLegacyRedirect,
});

function GestaoProducaoLegacyRedirect() {
  const { isDevMode, isCeoMode } = useAuth();
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";
  return <Navigate to={`${prefix}/producoes/gestao`} replace />;
}
