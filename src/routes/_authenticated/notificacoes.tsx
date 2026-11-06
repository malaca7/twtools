import React from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  component: NotificacoesRedirect,
});

function NotificacoesRedirect() {
  return <Navigate to="/dashboard" replace />;
}
