import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { PlatformPageDispatcher } from "@/components/routing/PlatformPageDispatcher";

export const Route = createFileRoute("/_authenticated/dev/$page")({
  component: DevPageRoute,
});

function DevPageRoute() {
  const { page } = Route.useParams();
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <PlatformPageDispatcher page={page} mode="dev" />;
}
