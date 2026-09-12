import { createFileRoute } from "@tanstack/react-router";
import { ConfiguracoesPage } from "./configuracoes";

export const Route = createFileRoute("/_authenticated/configuracoes/$tab")({
  component: ConfiguracoesTabRoute,
});

function ConfiguracoesTabRoute() {
  return <ConfiguracoesPage />;
}
