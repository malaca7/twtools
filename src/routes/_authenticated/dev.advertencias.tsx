import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { AdvertenciasPage } from "@/routes/_authenticated/advertencias";

export const Route = createFileRoute("/_authenticated/dev/advertencias")({
  component: DevAdvertenciasRoute,
});

function DevAdvertenciasRoute() {
  return (
    <DeveloperGuard>
      <AdvertenciasPage />
    </DeveloperGuard>
  );
}
