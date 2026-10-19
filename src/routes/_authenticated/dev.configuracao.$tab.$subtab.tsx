import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { DevConfiguracaoContent } from "./dev.configuracao";

export const Route = createFileRoute("/_authenticated/dev/configuracao/$tab/$subtab")({
  component: DevConfiguracaoSubTabRoute,
});

function DevConfiguracaoSubTabRoute() {
  const params = Route.useParams() as Record<string, string | undefined>;
  const tab = params["$tab"] || params["tab"] || "plataforma";
  const subtab = params["$subtab"] || params["subtab"] || "identidade";

  return (
    <DeveloperGuard>
      <DevConfiguracaoContent defaultTab={tab} defaultSubTab={subtab} />
    </DeveloperGuard>
  );
}
