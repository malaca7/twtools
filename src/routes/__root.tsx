import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportAppError } from "../lib/app-error-reporting";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    if (pathname.includes("/dev.desempenho")) {
      window.location.replace("/dev/desempenho");
    } else if (pathname.includes("/dev.permissoes")) {
      window.location.replace("/dev/permissoes");
    } else if (pathname.includes("/dev.configuracao")) {
      window.location.replace("/dev/configuracao");
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
            className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground transition-colors"
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
    } catch {}
    try {
      router.invalidate();
      reset();
    } catch {}
    window.location.href = "/dashboard";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="max-w-md w-full rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ocorreu uma inconsistência temporária na inicialização da página. Clique no botão abaixo para restaurar a sessão.
        </p>

        {error?.message && (
          <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-mono font-semibold text-left break-all max-h-24 overflow-y-auto">
            {error.message}
          </div>
        )}

        <div className="pt-2 flex flex-wrap justify-center gap-2">
          <button
            onClick={handleReset}
            className="w-full h-10 rounded-xl bg-gradient-brand px-4 py-2 text-xs font-bold text-primary-foreground cursor-pointer shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            Tentar novamente
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
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@500;700;900&family=Outfit:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  if (typeof window !== "undefined") {
    return <>{children}</>;
  }

  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useUserTheme, applyThemeToDOM } from "@/hooks/useUserTheme";

function DocumentTitleSync() {
  const { settings } = usePlatformSettings();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = settings.factionName || "Twin Wheels";
      const slogan = settings.slogan || settings.factionType || "Gestão de Facção — GTA RP";
      document.title = `${name} — ${slogan}`;
    }
  }, [settings.factionName, settings.slogan, settings.factionType]);

  return null;
}

function AppearanceSync() {
  const { theme } = useUserTheme();

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DocumentTitleSync />
        <AppearanceSync />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-right" richColors theme="dark" closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
