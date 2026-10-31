import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isUserDeveloper } from "@/services/devService";

export const Route = createFileRoute("/_authenticated/atualizacoes")({
  component: AtualizacoesRedirect,
});

export function AtualizacoesPage() {
  return <AtualizacoesRedirect />;
}

function AtualizacoesRedirect() {
  const { user, profile, level } = useAuth();
  const navigate = useNavigate();
  const isDev = isUserDeveloper(user, profile, level);

  useEffect(() => {
    if (isDev) {
      navigate({ to: "/dev/patch-notes", replace: true });
    } else {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isDev, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
