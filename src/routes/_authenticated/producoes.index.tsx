import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/producoes/")({
  component: ProducoesIndexRedirect,
});

function ProducoesIndexRedirect() {
  const { hasPermission, isDevMode, isCeoMode } = useAuth();

  if (hasPermission("productions.view") || hasPermission("productions.create")) {
    if (isDevMode) return <Navigate to="/dev/producoes/produzir" replace />;
    if (isCeoMode) return <Navigate to="/ceo/producoes/produzir" replace />;
    return <Navigate to="/producoes/produzir" replace />;
  }

  if (hasPermission("warehouse.view") || hasPermission("warehouse.transfer")) {
    if (isDevMode) return <Navigate to="/dev/producoes/armazem" replace />;
    if (isCeoMode) return <Navigate to="/ceo/producoes/armazem" replace />;
    return <Navigate to="/producoes/armazem" replace />;
  }

  if (hasPermission("production_management.view") || hasPermission("view_production_management")) {
    if (isDevMode) return <Navigate to="/dev/producoes/gestao" replace />;
    if (isCeoMode) return <Navigate to="/ceo/producoes/gestao" replace />;
    return <Navigate to="/producoes/gestao" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
