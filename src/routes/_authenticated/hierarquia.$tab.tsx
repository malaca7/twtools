import { createFileRoute } from "@tanstack/react-router";
import { HierarquiaPage } from "./hierarquia";

export const Route = createFileRoute("/_authenticated/hierarquia/$tab")({
  component: HierarquiaTabRoute,
});

function HierarquiaTabRoute() {
  return <HierarquiaPage />;
}
