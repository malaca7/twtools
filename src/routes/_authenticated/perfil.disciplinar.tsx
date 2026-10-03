import { createFileRoute } from "@tanstack/react-router";
import { PerfilPage } from "./perfil";

export const Route = createFileRoute("/_authenticated/perfil/disciplinar")({
  component: PerfilDisciplinarRoute,
});

function PerfilDisciplinarRoute() {
  return <PerfilPage initialTab="disciplinar" />;
}
