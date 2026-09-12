import { createFileRoute } from "@tanstack/react-router";
import { MetasPage } from "./metas";

export const Route = createFileRoute("/_authenticated/metas/$tab")({
  component: MetasTabRoute,
});

function MetasTabRoute() {
  return <MetasPage />;
}
