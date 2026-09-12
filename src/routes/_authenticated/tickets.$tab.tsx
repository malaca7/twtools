import { createFileRoute } from "@tanstack/react-router";
import { TicketsPage } from "./tickets";

export const Route = createFileRoute("/_authenticated/tickets/$tab")({
  component: TicketsTabRoute,
});

function TicketsTabRoute() {
  return <TicketsPage />;
}
