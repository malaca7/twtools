import { createFileRoute, Navigate } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";

export const Route = createFileRoute("/_authenticated/dev/")({
  component: DevIndexRedirect,
});

export function DevHubContent() {
  return <Navigate to="/dashboard" replace />;
}

function DevIndexRedirect() {
  return (
    <DeveloperGuard>
      <Navigate to="/dashboard" replace />
    </DeveloperGuard>
  );
}
