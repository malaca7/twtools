import { createFileRoute } from "@tanstack/react-router";
import { PerfilPage } from "./perfil";

export const Route = createFileRoute("/_authenticated/perfil/advertencias")({
  component: PerfilAdvertenciasRoute,
});

function PerfilAdvertenciasRoute() {
  return <PerfilPage initialTab="disciplinar" />;
}
