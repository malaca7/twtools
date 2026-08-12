import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentAuth } from "@/lib/app-api";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const auth = await getCurrentAuth();
    if (!auth.approvedAccess || !auth.user) {
      throw redirect({ to: "/auth" });
    }

    return { user: auth.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
