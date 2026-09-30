import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { ShopPage } from "@/components/shop/ShopPage";

export const Route = createFileRoute("/_authenticated/dev/loja")({
  component: DevShopStoreRoute,
});

function DevShopStoreRoute() {
  return (
    <DeveloperGuard>
      <ShopPage />
    </DeveloperGuard>
  );
}
