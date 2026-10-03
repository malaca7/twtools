import { createFileRoute } from "@tanstack/react-router";
import { PerfilAdvertenciasPage } from "./perfil.advertencias";

export const Route = createFileRoute("/_authenticated/perfil/disciplinar")({
  component: PerfilDisciplinarRoute,
});

function PerfilDisciplinarRoute() {
  return <PerfilAdvertenciasPage />;
}
