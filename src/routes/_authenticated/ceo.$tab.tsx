import { createFileRoute } from "@tanstack/react-router";
import { CeoGuard } from "@/guards/CeoGuard";
import { CeoPageContent } from "./ceo";

export const Route = createFileRoute("/_authenticated/ceo/$tab")({
  component: CeoTabRoute,
});

function CeoTabRoute() {
  const { tab } = Route.useParams();
  return (
    <CeoGuard>
      <CeoPageContent initialTab={tab} />
    </CeoGuard>
  );
}
