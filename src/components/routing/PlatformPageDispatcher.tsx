import React from "react";
import { Navigate } from "@tanstack/react-router";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { CeoGuard } from "@/guards/CeoGuard";
import { useAuth } from "@/hooks/useAuth";
import { NoAccess } from "@/components/ui-kit";
import { type Permission } from "@/lib/permissions";

// Route page components
import { DashboardPage } from "@/routes/_authenticated/dashboard";
import { MovimentacoesPage } from "@/routes/_authenticated/movimentacoes";
import { VendasPage } from "@/routes/_authenticated/vendas";
import { LivesPage } from "@/routes/_authenticated/lives";
import { TicketsPage } from "@/routes/_authenticated/tickets";
import { EstoquePage } from "@/routes/_authenticated/estoque";
import { MembrosPage } from "@/routes/_authenticated/membros";
import { HierarquiaPage } from "@/routes/_authenticated/hierarquia";
import { FundoCaixaPage } from "@/routes/_authenticated/fundo-caixa";
import { AusenciasPage } from "@/routes/_authenticated/ausencias";
import { RankingsPage } from "@/routes/_authenticated/rankings";
import { MeuDesempenhoPage } from "@/routes/_authenticated/desempenho";
import { MetasPage } from "@/routes/_authenticated/metas";
import { AvisosPage } from "@/routes/_authenticated/avisos";
import { CargosPage } from "@/routes/_authenticated/cargos";
import { PermissoesPage } from "@/routes/_authenticated/permissoes";
import { AtualizacoesPage } from "@/routes/_authenticated/atualizacoes";
import { PerfilPage } from "@/routes/_authenticated/perfil";
import { PublicProfilePage } from "@/components/profile/PublicProfilePage";
import { ConfiguracoesPage } from "@/routes/_authenticated/configuracoes";
import { CeoPageContent } from "@/routes/_authenticated/ceo";
import { MemberNotificationsPage } from "@/routes/_authenticated/notificacoes";
import { CeoNotificationsPage } from "@/routes/_authenticated/ceo.notificacoes";
import { DevNotificationsPage } from "@/routes/_authenticated/dev.notificacoes";

export interface PlatformPageDispatcherProps {
  page: string;
  tab?: string;
  subtab?: string;
  mode: "dev" | "ceo" | "member";
}

const PAGE_PERMISSION_MAP: Record<string, Permission | null> = {
  dashboard: "view_dashboard",
  movimentacoes: "view_movements",
  vendas: "view_sales",
  lives: "view_lives",
  tickets: "view_tickets",
  estoque: "view_stock",
  baus: "view_stock",
  categorias: "view_stock",
  produtos: "view_stock",
  membros: "view_members",
  hierarquia: "view_hierarchy",
  "fundo-caixa": "view_cash_fund",
  ausencias: "view_absences",
  rankings: "view_rankings",
  desempenho: "view_performance",
  "meu-desempenho": "view_performance",
  metas: "view_goals",
  avisos: "manage_announcements",
  cargos: "manage_roles",
  permissoes: "manage_permissions",
  "permissoes-gerais": "manage_permissions",
  atualizacoes: "view_patch_notes",
  perfil: "view_profile",
  configuracoes: "manage_platform_settings",
  notificacoes: "view_notifications",

  // Módulos CEO
  executivo: "view_ceo",
  bot: "manage_ceo_bot",
  webhooks: "manage_ceo_webhooks",
  financas: "view_ceo_financials",
  "ceo-notificacoes": "view_ceo_notifications",

  // Módulos DEV
  "dev-notificacoes": "view_dev_notifications",
};

function InnerPageResolver({ page, tab, mode }: { page: string; tab?: string; mode: "dev" | "ceo" | "member" }) {
  const { hasPermission } = useAuth();
  const normalizedPage = (page || "").toLowerCase().trim();

  // CEO Specific modules
  if (mode === "ceo") {
    if (normalizedPage === "executivo" || normalizedPage === "dashboard") {
      return <CeoPageContent initialTab="dashboard" />;
    }
    if (normalizedPage === "bot") {
      return <CeoPageContent initialTab="bot" />;
    }
    if (normalizedPage === "webhooks") {
      return <CeoPageContent initialTab="webhooks" />;
    }
    if (normalizedPage === "financas") {
      return <CeoPageContent initialTab="financas" />;
    }
    if (normalizedPage === "notificacoes" || normalizedPage === "ceo-notificacoes") {
      return <CeoNotificationsPage />;
    }
  }

  // DEV Specific modules
  if (mode === "dev") {
    if (normalizedPage === "notificacoes" || normalizedPage === "dev-notificacoes") {
      return <DevNotificationsPage />;
    }
  }

  // Verifica permissão da página se exigida
  const requiredPerm = PAGE_PERMISSION_MAP[normalizedPage];
  if (requiredPerm && !hasPermission(requiredPerm)) {
    return <NoAccess />;
  }

  switch (normalizedPage) {
    case "dashboard":
      return <DashboardPage />;
    case "movimentacoes":
      return <MovimentacoesPage />;
    case "vendas":
      return <VendasPage />;
    case "lives":
      return <LivesPage />;
    case "chat":
      return <Navigate to="/dashboard" replace />;
    case "tickets":
      return <TicketsPage />;
    case "estoque":
    case "baus":
    case "categorias":
    case "produtos":
      return <EstoquePage />;
    case "membros":
      return <MembrosPage />;
    case "hierarquia":
      return <HierarquiaPage />;
    case "fundo-caixa":
      return <FundoCaixaPage />;
    case "ausencias":
      return <AusenciasPage />;
    case "rankings":
      return <RankingsPage />;
    case "desempenho":
    case "meu-desempenho":
      return <MeuDesempenhoPage />;
    case "metas":
      return <MetasPage />;
    case "avisos":
      return <AvisosPage />;
    case "cargos":
      return <CargosPage />;
    case "permissoes":
    case "permissoes-gerais":
      return <PermissoesPage />;
    case "logs":
      return <Navigate to="/dashboard" replace />;
    case "atualizacoes":
      return <AtualizacoesPage />;
    case "configuracoes":
      return <ConfiguracoesPage />;
    case "notificacoes":
      return <MemberNotificationsPage />;
    case "perfil":
      if (!tab || tab === "dados" || tab === "aparencia") {
        return <PerfilPage initialTab={tab as "dados" | "aparencia" | undefined} />;
      }
      return <PublicProfilePage handleOverride={tab} />;
    default:
      if (mode === "dev") {
        return <Navigate to="/dev" replace />;
      }
      if (mode === "ceo") {
        return <Navigate to="/ceo/dashboard" replace />;
      }
      return <Navigate to="/dashboard" replace />;
  }
}

export function PlatformPageDispatcher({ page, tab, subtab, mode }: PlatformPageDispatcherProps) {
  if (mode === "dev") {
    return (
      <DeveloperGuard>
        <InnerPageResolver page={page} tab={tab || subtab} mode={mode} />
      </DeveloperGuard>
    );
  }

  if (mode === "ceo") {
    return (
      <CeoGuard>
        <InnerPageResolver page={page} tab={tab || subtab} mode={mode} />
      </CeoGuard>
    );
  }

  return <InnerPageResolver page={page} tab={tab || subtab} mode={mode} />;
}
