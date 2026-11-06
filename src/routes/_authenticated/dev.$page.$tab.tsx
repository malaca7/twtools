import { createFileRoute } from "@tanstack/react-router";
import { PlatformPageDispatcher } from "@/components/routing/PlatformPageDispatcher";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";

export const Route = createFileRoute("/_authenticated/dev/$page/$tab")({
  component: DevPageTabRoute,
});

function DevPageTabRoute() {
  const { page, tab } = Route.useParams();
  return (
    <DeveloperGuard>
      <PlatformPageDispatcher page={page} tab={tab} mode="dev" />
    </DeveloperGuard>
  );
}
