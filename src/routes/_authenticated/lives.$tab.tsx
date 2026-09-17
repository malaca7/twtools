import { createFileRoute } from "@tanstack/react-router";
import { LivesPage } from "./lives";

export const Route = createFileRoute("/_authenticated/lives/$tab")({
  component: LivesTabRoute,
});

function LivesTabRoute() {
  return <LivesPage />;
}
