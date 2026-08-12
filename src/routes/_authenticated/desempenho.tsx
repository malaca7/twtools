import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/desempenho")({
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Desempenho" description="Módulo em construção." />
      <EmptyState title="Em breve" description="Este módulo será liberado na próxima etapa." />
    </div>
  );
}
