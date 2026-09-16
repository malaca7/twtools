import { createFileRoute } from "@tanstack/react-router";
import { PlatformPageDispatcher } from "@/components/routing/PlatformPageDispatcher";

export const Route = createFileRoute("/_authenticated/ceo/$tab/$subtab")({
  component: CeoTabSubtabRoute,
});

function CeoTabSubtabRoute() {
  const { tab, subtab } = Route.useParams();
  return <PlatformPageDispatcher page={tab} tab={subtab} mode="ceo" />;
}
