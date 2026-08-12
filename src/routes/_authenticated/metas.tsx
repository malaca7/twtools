import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/metas")({
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Metas" description="Módulo em construção." />
      <EmptyState title="Em breve" description="Este módulo será liberado na próxima etapa." />
    </div>
  );
}
