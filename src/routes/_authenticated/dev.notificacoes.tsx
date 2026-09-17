import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BellRing, ShieldCheck } from "lucide-react";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { useAuth } from "@/hooks/useAuth";
import { DevNotificationsManager } from "@/components/dev/DevNotificationsManager";

export const Route = createFileRoute("/_authenticated/dev/notificacoes")({
  component: DevNotificacoesRoute,
});

function DevNotificacoesRoute() {
  return (
    <DeveloperGuard>
      <DevNotificationsPage />
    </DeveloperGuard>
  );
}

export function DevNotificationsPage() {
  const { hasPermission } = useAuth();

  if (!hasPermission("view_dev_notifications")) {
    return <NoAccess />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Central de Notificações & Regras — Painel Dev"
        description="Controle avançado de matriz de tipos por cargo/tag, simulador de push em tempo real, telemetria de entrega e manutenção em massa."
        icon={BellRing}
      />

      <DevNotificationsManager />
    </div>
  );
}
