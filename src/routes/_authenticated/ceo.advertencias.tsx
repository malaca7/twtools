import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CeoGuard } from "@/guards/CeoGuard";
import { AdvertenciasPage } from "@/routes/_authenticated/advertencias";

export const Route = createFileRoute("/_authenticated/ceo/advertencias")({
  component: CeoAdvertenciasRoute,
});

function CeoAdvertenciasRoute() {
  return (
    <CeoGuard>
      <AdvertenciasPage />
    </CeoGuard>
  );
}
