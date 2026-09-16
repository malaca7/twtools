import { createFileRoute } from "@tanstack/react-router";
import { PlatformPageDispatcher } from "@/components/routing/PlatformPageDispatcher";

export const Route = createFileRoute("/_authenticated/dev/$page")({
  component: DevPageRoute,
});

function DevPageRoute() {
  const { page } = Route.useParams();
  return <PlatformPageDispatcher page={page} mode="dev" />;
}
