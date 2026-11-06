import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { PlatformPageDispatcher } from "@/components/routing/PlatformPageDispatcher";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";

export const Route = createFileRoute("/_authenticated/dev/$page")({
  component: DevPageRoute,
});

function DevPageRoute() {
  const { page } = Route.useParams();
  const childMatches = useChildMatches();
  return (
    <DeveloperGuard>
      {childMatches.length > 0 ? <Outlet /> : <PlatformPageDispatcher page={page} mode="dev" />}
    </DeveloperGuard>
  );
}
