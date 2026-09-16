import { createFileRoute } from "@tanstack/react-router";
import { PlatformPageDispatcher } from "@/components/routing/PlatformPageDispatcher";

export const Route = createFileRoute("/_authenticated/dev/$page/$tab")({
  component: DevPageTabRoute,
});

function DevPageTabRoute() {
  const { page, tab } = Route.useParams();
  return <PlatformPageDispatcher page={page} tab={tab} mode="dev" />;
}
