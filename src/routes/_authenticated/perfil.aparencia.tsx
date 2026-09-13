import { createFileRoute } from "@tanstack/react-router";
import { PerfilPage } from "./perfil";

export const Route = createFileRoute("/_authenticated/perfil/aparencia")({
  component: PerfilAparenciaRoute,
});

function PerfilAparenciaRoute() {
  return <PerfilPage initialTab="aparencia" />;
}
