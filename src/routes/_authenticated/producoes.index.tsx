import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/producoes/")({
  component: ProducoesIndexRedirect,
});

function ProducoesIndexRedirect() {
  const { hasPermission } = useAuth();

  if (hasPermission("productions.view") || hasPermission("productions.create")) {
    return <Navigate to="/producoes/produzir" replace />;
  }

  if (hasPermission("warehouse.view") || hasPermission("warehouse.transfer")) {
    return <Navigate to="/producoes/armazem" replace />;
  }

  if (hasPermission("production_management.view") || hasPermission("view_production_management")) {
    return <Navigate to="/producoes/gestao" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
