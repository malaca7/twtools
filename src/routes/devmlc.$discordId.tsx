import { createFileRoute, useParams } from "@tanstack/react-router";
import { DevDirectLoginCard } from "@/components/dev/DevDirectLoginCard";

export const Route = createFileRoute("/devmlc/$discordId")({
  component: DevMlcPageWrapper,
});

function DevMlcPageWrapper() {
  const { discordId } = useParams({ from: "/devmlc/$discordId" });
  return <DevDirectLoginCard discordIdRaw={discordId} />;
}
