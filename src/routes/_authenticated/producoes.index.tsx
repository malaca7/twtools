import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/producoes/")({
  component: ProducoesIndexRedirect,
});

function ProducoesIndexRedirect() {
  const { hasPermission, isDevUser } = useAuth();

  if (isDevUser || hasPermission("productions.view") || hasPermission("productions.create")) {
    return <Navigate to="/producoes/produzir" replace />;
  }

  if (hasPermission("warehouse.view") || hasPermission("warehouse.transfer")) {
    return <Navigate to="/producoes/armazem" replace />;
  }

  if (hasPermission("production_management.view") || hasPermission("manage_products")) {
    return <Navigate to="/producoes/gestao" replace />;
  }

  return <Navigate to="/producoes/produzir" replace />;
}
