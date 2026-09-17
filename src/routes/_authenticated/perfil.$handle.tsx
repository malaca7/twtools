import { createFileRoute, useParams } from "@tanstack/react-router";
import { PublicProfilePage } from "@/components/profile/PublicProfilePage";

export { PublicProfilePage };

export const Route = createFileRoute("/_authenticated/perfil/$handle")({
  component: AuthenticatedPublicProfileRouteComponent,
});

function AuthenticatedPublicProfileRouteComponent() {
  const { handle = "" } = useParams({ strict: false }) as any;
  return <PublicProfilePage handleOverride={handle} />;
}
