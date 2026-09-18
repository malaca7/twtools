import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { DevBotPageContent } from "./dev.bot";

export const Route = createFileRoute("/_authenticated/dev/bot/$tab")({
  component: DevBotTabRoute,
});

function DevBotTabRoute() {
  const { tab } = Route.useParams();
  return (
    <DeveloperGuard>
      <DevBotPageContent initialTab={tab} />
    </DeveloperGuard>
  );
}
