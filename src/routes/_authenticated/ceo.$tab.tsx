import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { PlatformPageDispatcher } from "@/components/routing/PlatformPageDispatcher";

export const Route = createFileRoute("/_authenticated/ceo/$tab")({
  component: CeoTabRoute,
});

function CeoTabRoute() {
  const { tab } = Route.useParams();
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <PlatformPageDispatcher page={tab} mode="ceo" />;
}
