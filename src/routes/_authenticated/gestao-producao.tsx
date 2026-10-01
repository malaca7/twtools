import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/gestao-producao")({
  component: GestaoProducaoRootRedirect,
});

function GestaoProducaoRootRedirect() {
  const { isDevMode, isCeoMode } = useAuth();
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";
  return <Navigate to={`${prefix}/producoes/gestao`} replace />;
}
