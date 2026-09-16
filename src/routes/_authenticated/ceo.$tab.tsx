import { createFileRoute } from "@tanstack/react-router";
import { PlatformPageDispatcher } from "@/components/routing/PlatformPageDispatcher";

export const Route = createFileRoute("/_authenticated/ceo/$tab")({
  component: CeoTabRoute,
});

function CeoTabRoute() {
  const { tab } = Route.useParams();
  return <PlatformPageDispatcher page={tab} mode="ceo" />;
}
