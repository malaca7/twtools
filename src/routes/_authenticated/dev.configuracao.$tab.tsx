import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { DevConfiguracaoContent } from "./dev.configuracao";

export const Route = createFileRoute("/_authenticated/dev/configuracao/$tab")({
  component: DevConfiguracaoTabRoute,
});

function DevConfiguracaoTabRoute() {
  return (
    <DeveloperGuard>
      <DevConfiguracaoContent />
    </DeveloperGuard>
  );
}
