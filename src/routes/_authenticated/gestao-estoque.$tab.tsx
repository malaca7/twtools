import { createFileRoute } from "@tanstack/react-router";
import { GestaoEstoquePage } from "./gestao-estoque";

export const Route = createFileRoute("/_authenticated/gestao-estoque/$tab")({
  component: GestaoEstoqueTabRoute,
});

function GestaoEstoqueTabRoute() {
  return <GestaoEstoquePage />;
}
