import { createFileRoute } from "@tanstack/react-router";
import { RankingsPage } from "./rankings";

export const Route = createFileRoute("/_authenticated/rankings/$tab")({
  component: RankingsTabRoute,
});

function RankingsTabRoute() {
  return <RankingsPage />;
}
