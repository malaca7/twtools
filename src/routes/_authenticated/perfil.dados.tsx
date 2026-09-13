import { createFileRoute } from "@tanstack/react-router";
import { PerfilPage } from "./perfil";

export const Route = createFileRoute("/_authenticated/perfil/dados")({
  component: PerfilDadosRoute,
});

function PerfilDadosRoute() {
  return <PerfilPage initialTab="dados" />;
}
