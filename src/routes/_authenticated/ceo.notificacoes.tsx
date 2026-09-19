import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BellRing, ShieldCheck } from "lucide-react";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { CeoGuard } from "@/guards/CeoGuard";
import { useAuth } from "@/hooks/useAuth";
import { CeoNotificationsManager } from "@/components/notifications/CeoNotificationsManager";

export const Route = createFileRoute("/_authenticated/ceo/notificacoes")({
  component: CeoNotificationsRoute,
});

function CeoNotificationsRoute() {
  return (
    <CeoGuard>
      <CeoNotificationsPage />
    </CeoGuard>
  );
}

export function CeoNotificationsPage() {
  const { hasPermission } = useAuth();

  if (!hasPermission("view_ceo_notifications")) {
    return <NoAccess />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Central de Notificações — Painel CEO"
        description="Gerencie comunicados, alertas operacionais, ativação/pausa e disparos em tempo real para o grupo Twin Wheels."
        icon={BellRing}
      />

      <CeoNotificationsManager />
    </div>
  );
}
