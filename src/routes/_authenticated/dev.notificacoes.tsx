import React from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dev/notificacoes")({
  component: DevNotificacoesRedirect,
});

function DevNotificacoesRedirect() {
  return <Navigate to="/dev/configuracao" replace />;
}
