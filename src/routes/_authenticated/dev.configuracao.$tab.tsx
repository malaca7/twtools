import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { DevConfiguracaoContent } from "./dev.configuracao";

export const Route = createFileRoute("/_authenticated/dev/configuracao/$tab")({
  component: DevConfiguracaoTabRoute,
});

function DevConfiguracaoTabRoute() {
  const params = Route.useParams() as Record<string, string | undefined>;
  const tab = params["$tab"] || params["tab"];

  useEffect(() => {
    if (tab === "bot-manage" || tab === "webhooks" || tab === "discord-logs") {
      window.location.replace(`/dev/bot?tab=${tab}`);
    }
  }, [tab]);

  return (
    <DeveloperGuard>
      <DevConfiguracaoContent />
    </DeveloperGuard>
  );
}
