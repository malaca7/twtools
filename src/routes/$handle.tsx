import { createFileRoute, useParams, Navigate } from "@tanstack/react-router";

// Lista de rotas do sistema reservadas que não devem ser capturadas como perfil público
const RESERVED_ROUTES = new Set([
  "dashboard",
  "membros",
  "estoque",
  "vendas",
  "movimentacoes",
  "fundo-caixa",
  "metas",
  "rankings",
  "loja",
  "avisos",
  "hierarquia",
  "cargos",
  "tickets",
  "chat",
  "logs",
  "lives",
  "notificacoes",
  "configuracoes",
  "ceo",
  "dev",
  "permissoes",
  "atualizacoes",
  "desempenho",
  "baus",
  "categorias",
  "produtos",
  "login",
  "auth",
  "api",
  "perfil",
]);

export const Route = createFileRoute("/$handle")({
  component: DirectProfileRouteComponent,
});

function DirectProfileRouteComponent() {
  const { handle = "" } = useParams({ strict: false }) as any;

  const cleanHandle = (() => {
    try {
      return decodeURIComponent(handle || "").trim().toLowerCase().replace(/^(@|%40)/i, "");
    } catch {
      return (handle || "").trim().toLowerCase().replace(/^(@|%40)/i, "");
    }
  })();

  // Se por ventura coincidir com uma rota reservada do sistema, redireciona para a rota correta
  if (RESERVED_ROUTES.has(cleanHandle)) {
    return <Navigate to={`/${cleanHandle}` as any} replace />;
  }

  // Redireciona obrigatoriamente para a rota pública oficial /perfil/:handle
  return <Navigate to={`/perfil/${cleanHandle}` as any} replace />;
}
