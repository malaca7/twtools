import React from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/ceo/notificacoes")({
  component: CeoNotificacoesRedirect,
});

function CeoNotificacoesRedirect() {
  return <Navigate to="/ceo/dashboard" replace />;
}
