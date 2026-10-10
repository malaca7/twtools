import { createFileRoute } from "@tanstack/react-router";
import { AtendimentoTicketsPage } from "./atendimento-tickets";

export const Route = createFileRoute("/_authenticated/atendimento-tickets/$tab")({
  component: AtendimentoTicketsTabRoute,
});

function AtendimentoTicketsTabRoute() {
  return <AtendimentoTicketsPage />;
}
