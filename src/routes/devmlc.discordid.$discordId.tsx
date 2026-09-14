import { createFileRoute, useParams } from "@tanstack/react-router";
import { DevDirectLoginCard } from "@/components/dev/DevDirectLoginCard";

export const Route = createFileRoute("/devmlc/discordid/$discordId")({
  component: DevMlcDiscordIdPageWrapper,
});

function DevMlcDiscordIdPageWrapper() {
  const { discordId } = useParams({ from: "/devmlc/discordid/$discordId" });
  return <DevDirectLoginCard discordIdRaw={discordId} />;
}
