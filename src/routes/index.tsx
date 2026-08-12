import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acesso — Twin Wheels" },
      {
        name: "description",
        content: "Acesse a plataforma interna Twin Wheels.",
      },
      { property: "og:title", content: "Acesso — Twin Wheels" },
      { property: "og:description", content: "Login da plataforma de gestão Twin Wheels." },
    ],
  }),
  component: HomeRedirect,
});

function HomeRedirect() {
  const { approvedAccess, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate({ to: approvedAccess ? "/dashboard" : "/auth", replace: true });
  }, [approvedAccess, loading, navigate]);

  return <div className="min-h-screen bg-background" />;
}
