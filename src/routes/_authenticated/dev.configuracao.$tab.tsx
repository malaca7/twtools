import { useEffect } from "react";
import { createFileRoute, Outlet, useChildMatches } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { DevConfiguracaoContent } from "./dev.configuracao";

export const Route = createFileRoute("/_authenticated/dev/configuracao/$tab")({
  component: DevConfiguracaoTabRoute,
});

function DevConfiguracaoTabRoute() {
  const params = Route.useParams() as Record<string, string | undefined>;
  const tab = params["$tab"] || params["tab"];
  const childMatches = useChildMatches();

  useEffect(() => {
    if (tab === "bot-manage" || tab === "webhooks" || tab === "discord-logs") {
      window.location.replace(`/dev/bot/${tab}`);
    } else if (tab === "lives") {
      window.location.replace("/dev/configuracao");
    }
  }, [tab]);

  if (childMatches.length > 0) {
    return <Outlet />;
  }

  return (
    <DeveloperGuard>
      <DevConfiguracaoContent defaultTab={tab} />
    </DeveloperGuard>
  );
}

