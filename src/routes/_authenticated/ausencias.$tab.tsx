import { createFileRoute } from "@tanstack/react-router";
import { AusenciasPage } from "./ausencias";

export const Route = createFileRoute("/_authenticated/ausencias/$tab")({
  component: AusenciasTabRoute,
});

function AusenciasTabRoute() {
  return <AusenciasPage />;
}
