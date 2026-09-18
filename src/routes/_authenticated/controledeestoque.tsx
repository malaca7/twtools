import { createFileRoute } from "@tanstack/react-router";
import { EstoquePage } from "./estoque";

export const Route = createFileRoute("/_authenticated/controledeestoque")({
  component: EstoquePage,
});
