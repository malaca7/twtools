import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/producoes/")({
  component: ProducoesIndexRedirect,
});

function ProducoesIndexRedirect() {
  const { hasPermission, isDevMode, isCeoMode } = useAuth();
  const prefix = isDevMode ? "/dev" : isCeoMode ? "/ceo" : "";

  if (hasPermission("productions.view") || hasPermission("productions.create")) {
    return <Navigate to={`${prefix}/producoes/produzir`} replace />;
  }

  if (hasPermission("warehouse.view") || hasPermission("warehouse.transfer")) {
    return <Navigate to={`${prefix}/producoes/armazem`} replace />;
  }

  if (hasPermission("production_management.view") || hasPermission("view_production_management")) {
    return <Navigate to={`${prefix}/producoes/gestao`} replace />;
  }

  return <Navigate to={prefix ? `${prefix}/dashboard` : "/dashboard"} replace />;
}
