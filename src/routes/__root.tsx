import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { reportAppError } from "../lib/app-error-reporting";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { useUserTheme, applyThemeToDOM } from "@/hooks/useUserTheme";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { usePageTitleSync } from "@/hooks/usePageTitle";
import { GlobalMaintenanceOverlay } from "@/components/maintenance/GlobalMaintenanceOverlay";

function NotFoundComponent() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (pathname.includes("/dev.desempenho")) {
      window.location.replace(pathname.replace("/dev.desempenho", "/dev/desempenho") + search + hash);
    } else if (pathname.includes("/dev.permissoes")) {
      window.location.replace(pathname.replace("/dev.permissoes", "/dev/permissoes") + search + hash);
    } else if (pathname.includes("/dev.configuracao")) {
      window.location.replace(pathname.replace("/dev.configuracao", "/dev/configuracao") + search + hash);
    } else if (pathname.includes("/@")) {
      const match = pathname.match(/\/@([a-zA-Z0-9_.-]+)/);
      if (match && match[1]) {
        window.location.replace(`/perfil/${match[1]}` + search + hash);
      }
    } else if (hash && hash.includes("/@")) {
      const match = hash.match(/\/@([a-zA-Z0-9_.-]+)/);
      if (match && match[1]) {
        window.location.replace(`/perfil/${match[1]}`);
      }
    }
  }, [pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-gradient-brand text-7xl font-extrabold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço acessado não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground transition-colors cursor-pointer"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root Error Boundary Caught:", error);
  const router = useRouter();
  useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const handleReset = () => {
    try {
      localStorage.removeItem("tw_menu_config");
      localStorage.removeItem("tw_panel_mode");
      localStorage.removeItem("tw_dev_impersonate");
    } catch {}
    try {
      router.invalidate();
      reset();
    } catch {}
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="max-w-md w-full rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive text-2xl font-bold">
          ⚠️
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Esta página encontrou uma inconsistência
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ocorreu uma inconsistência temporária na inicialização da página. Clique no botão abaixo para restaurar e recarregar a sessão.
        </p>

        {error?.message && (
          <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-mono font-semibold text-left break-all max-h-24 overflow-y-auto">
            {error.message}
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full h-10 rounded-xl bg-gradient-brand px-4 py-2 text-xs font-bold text-primary-foreground cursor-pointer shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Recarregar Página
          </button>
          <button
            onClick={handleReset}
            className="w-full h-10 rounded-xl bg-secondary/80 border border-border px-4 py-2 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-secondary transition-all flex items-center justify-center gap-2"
          >
            Limpar Cache & Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "theme-color", content: "#060911" },
      { title: "Twin Wheels — Gestão de Grupo GTA RP" },
      {
        name: "description",
        content:
          "Plataforma interna Twin Wheels para gestão de estoque, vendas e desempenho de membros no GTA RP.",
      },
      { property: "og:title", content: "Twin Wheels — Gestão de Grupo GTA RP" },
      {
        property: "og:description",
        content: "Estoque, vendas, metas e rankings da família Twin Wheels em um só painel.",
      },
      { property: "og:image", content: "/logo.png" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/logo.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Montserrat:wght@400;500;600;700;800&family=Orbitron:wght@500;700;900&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rajdhani:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function DocumentTitleSync() {
  usePageTitleSync();
  return null;
}

function AppearanceSync() {
  const { theme } = useUserTheme();

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  return null;
}

function GlobalRealtimeSync() {
  useRealtimeSync();
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GlobalRealtimeSync />
        <DocumentTitleSync />
        <AppearanceSync />
        <GlobalMaintenanceOverlay />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-center" offset={80} mobileOffset={76} richColors theme="dark" closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
