import { createFileRoute } from "@tanstack/react-router";
import { MovimentacoesPage } from "./movimentacoes";

export const Route = createFileRoute("/_authenticated/movimentacoes/$tab")({
  component: MovimentacoesTabRoute,
});

function MovimentacoesTabRoute() {
  return <MovimentacoesPage />;
}
