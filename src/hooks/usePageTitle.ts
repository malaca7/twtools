import { useEffect, useState, useSyncExternalStore, useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

export interface PageTitleInfo {
  pageTitle: string;
  tabTitle: string | null;
  modalTitle: string | null;
  fullTitle: string;
}

// Mapeamento abrangente de rotas para títulos amigáveis e específicos
const ROUTE_TITLE_MAP: Record<string, string> = {
  "/": "Acesso à Plataforma",
  "/auth/callback": "Autenticação",
  "/dashboard": "Dashboard Principal",
  "/movimentacoes": "Movimentações de Baú",
  "/vendas": "Vendas & Caixa",
  "/tickets": "Tickets & Ouvidoria",
  "/loja": "Loja Oficial",
  "/controledeestoque": "Controle de Estoque",
  "/estoque": "Controle de Estoque",
  "/gestao-estoque": "Gestão de Estoque",
  "/baus": "Baús & Armazenamento",
  "/categorias": "Categorias de Itens",
  "/produtos": "Catálogo de Produtos",
  "/saldos": "Saldos de Baú",
  "/membros": "Gestão de Membros",
  "/hierarquia": "Organograma & Hierarquia",
  "/fundo-caixa": "Fundo de Caixa & Cofre",
  "/ausencias": "Registro de Ausências",
  "/rankings": "Rankings & Destaques",
  "/desempenho": "Meu Desempenho",
  "/meu-desempenho": "Meu Desempenho",
  "/metas": "Metas & Produtividade",
  "/avisos": "Avisos & Comunicados",
  "/cargos": "Gerenciamento de Cargos",
  "/permissoes": "Matriz de Permissões",
  "/permissoes-gerais": "Matriz de Permissões",
  "/atualizacoes": "Notas de Atualização",
  "/perfil": "Meu Perfil",
  "/perfil/dados": "Meu Perfil · Dados Pessoais",
  "/perfil/aparencia": "Meu Perfil · Aparência",
  "/configuracoes": "Configurações da Plataforma",
  "/chat": "Chat Interno",
  "/logs": "Auditoria & Logs",
  "/lives": "Transmissões & Lives",

  // Painel CEO
  "/ceo": "CEO · Visão Executiva",
  "/ceo/executivo": "CEO · Visão Executiva",
  "/ceo/dashboard": "CEO · Visão Executiva",
  "/ceo/bot": "CEO · Gerenciamento do Bot",
  "/ceo/webhooks": "CEO · Webhooks Discord",
  "/ceo/financas": "CEO · Finanças & Cofre",
  "/ceo/ajustes-estoque": "CEO · Ajustes de Estoque",
  "/ceo/notificacoes": "CEO · Central de Notificações",

  // Painel Dev
  "/dev": "Dev · Dashboard Técnico",
  "/dev/dashboard": "Dev · Dashboard Técnico",
  "/dev/index": "Dev · Dashboard Técnico",
  "/dev/bot": "Dev · Central do Bot",
  "/dev/estoque": "Dev · Gestão Técnica de Estoque",
  "/dev/patch-notes": "Dev · Patch Notes Studio",
  "/dev/desempenho": "Dev · Gestão de Desempenho",
  "/dev/xp-insignias": "Dev · XP & Insígnias",
  "/dev/loja": "Dev · Gestão da Loja",
  "/dev/coins": "Dev · Gestão de Coins",
  "/dev/permissoes": "Dev · Permissões Tag Dev",
  "/dev/configuracao": "Dev · Configurações Dev",
  "/dev/menu-lateral": "Dev · Personalização de Menus",
  "/dev/notificacoes": "Dev · Central de Notificações",
};

// Mapeamento de abas conhecidas para nomes formatados
const TAB_TITLE_MAP: Record<string, string> = {
  // Abas do Bot
  "bot-manage": "Gerenciar Bot",
  "webhooks": "Webhooks Discord",
  "discord-logs": "Canais & Logs",
  "studio": "Bot Studio",
  "builder": "Bot Builder",

  // Abas de Estoque & Gestão
  "produtos": "Produtos & Itens",
  "baus": "Baús de Estoque",
  "categorias": "Categorias",
  "historico": "Histórico Geral",
  "saldo": "Saldos de Baú",
  "ajustes": "Ajustes de Estoque",

  // Abas de Membros
  "membros": "Membros Ativos",
  "ativos": "Membros Ativos",
  "candidatos": "Candidaturas",
  "pendentes": "Cadastros Pendentes",
  "desligados": "Desligados & Ex-Membros",

  // Abas de Ausências
  "minhas": "Minhas Ausências",
  "todas": "Todas as Ausências",

  // Abas de Metas & Farm
  "entregas": "Entregas & Lançamentos",
  "metas": "Metas da Semana",
  "ranking": "Ranking de Produtividade",

  // Abas de Perfil & Configurações
  "dados": "Dados Pessoais",
  "aparencia": "Aparência & Tema",
  "seguranca": "Segurança & Sessão",
  "geral": "Configurações Gerais",
  "auditoria": "Auditoria de Ações",
  "operacional": "Regras Operacionais",

  // Abas de Loja & Finanças
  "itens": "Catálogo de Itens",
  "compras": "Histórico de Compras",
  "extrato": "Extrato de Movimentações",
  "resumo": "Resumo Financeiro",
};

// Stack global de títulos de modal manuais
let explicitModalStack: string[] = [];
// Título de modal detectado automaticamente pelo DOM Observer
let observedModalTitle: string | null = null;
const modalListeners = new Set<() => void>();

function notifyModalListeners() {
  modalListeners.forEach((l) => l());
}

export function pushModalTitle(title: string) {
  explicitModalStack.push(title);
  notifyModalListeners();
}

export function popModalTitle(title?: string) {
  if (title) {
    explicitModalStack = explicitModalStack.filter((t) => t !== title);
  } else {
    explicitModalStack.pop();
  }
  notifyModalListeners();
}

export function setObservedModalTitle(title: string | null) {
  if (observedModalTitle !== title) {
    observedModalTitle = title;
    notifyModalListeners();
  }
}

function getActiveModalTitle(): string | null {
  if (explicitModalStack.length > 0) {
    return explicitModalStack[explicitModalStack.length - 1];
  }
  return observedModalTitle;
}

function subscribeModal(callback: () => void) {
  modalListeners.add(callback);
  return () => modalListeners.delete(callback);
}

/**
 * Resolve o título da página e da aba a partir da URL atual
 */
export function resolveRouteTitle(
  pathname: string,
  search?: string | Record<string, any>
): { pageTitle: string; tabTitle: string | null } {
  const cleanPath = pathname.replace(/\/+$/, "") || "/";

  // Busca exata no dicionário de rotas
  let pageTitle = ROUTE_TITLE_MAP[cleanPath];

  // Se não encontrar, tenta casamento com rotas dinâmicas
  if (!pageTitle) {
    for (const [routePattern, title] of Object.entries(ROUTE_TITLE_MAP)) {
      if (cleanPath.startsWith(routePattern + "/")) {
        pageTitle = title;
        break;
      }
    }
  }

  // Fallback caso a rota seja totalmente nova
  if (!pageTitle) {
    const segments = cleanPath.split("/").filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      pageTitle = last
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    } else {
      pageTitle = "Plataforma";
    }
  }

  // Resolve a aba ativa através da busca ou do último segmento
  let tabKey: string | null = null;
  if (typeof search === "string") {
    const params = new URLSearchParams(search);
    tabKey = params.get("tab") || params.get("subtab");
  } else if (search && typeof search === "object") {
    tabKey = (search as any).tab || (search as any).subtab || null;
  }

  // Se não houver query param, tenta ver se a rota termina com uma sub-aba conhecida
  if (!tabKey) {
    const segments = cleanPath.split("/").filter(Boolean);
    if (segments.length > 1) {
      const possibleTab = segments[segments.length - 1];
      if (TAB_TITLE_MAP[possibleTab]) {
        tabKey = possibleTab;
      }
    }
  }

  let tabTitle: string | null = null;
  if (tabKey) {
    tabTitle =
      TAB_TITLE_MAP[tabKey] ||
      tabKey.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return { pageTitle, tabTitle };
}

/**
 * Hook para obter as informações completas do título atual (Página, Aba, Modal e Título Completo)
 */
export function usePageTitle(): PageTitleInfo {
  const routerState = useRouterState();
  const { settings } = usePlatformSettings();
  const currentModal = useSyncExternalStore(subscribeModal, getActiveModalTitle, () => null);

  const pathname = routerState?.location?.pathname || (typeof window !== "undefined" ? window.location.pathname : "/");
  const search = routerState?.location?.search || (typeof window !== "undefined" ? window.location.search : "");

  const { pageTitle, tabTitle } = useMemo(
    () => resolveRouteTitle(pathname, search),
    [pathname, search]
  );

  const factionName = settings.factionName || "Twin Wheels";

  const fullTitle = useMemo(() => {
    if (currentModal) {
      return `${currentModal} · ${pageTitle} · ${factionName}`;
    }
    if (tabTitle && pageTitle) {
      return `${pageTitle} · ${tabTitle} · ${factionName}`;
    }
    if (pageTitle) {
      return `${pageTitle} · ${factionName}`;
    }
    return `${factionName} — ${settings.slogan || "Gestão Interna GTA RP"}`;
  }, [currentModal, pageTitle, tabTitle, factionName, settings.slogan]);

  return {
    pageTitle,
    tabTitle,
    modalTitle: currentModal,
    fullTitle,
  };
}

/**
 * Hook para declarar manualmente o título de um modal/popup enquanto estiver aberto
 */
export function useModalTitle(title: string | null | undefined, isOpen: boolean) {
  useEffect(() => {
    if (isOpen && title) {
      pushModalTitle(title);
      return () => {
        popModalTitle(title);
      };
    }
  }, [isOpen, title]);
}

/**
 * Sincronizador global de título do documento (document.title) e observador automático de Modals/Popups
 */
export function usePageTitleSync() {
  const { fullTitle } = usePageTitle();

  // 1. Sincroniza o document.title com o título composto atual
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.title = fullTitle;
    }
  }, [fullTitle]);

  // 2. Observador automático de Modals e Diálogos Radix UI no DOM
  useEffect(() => {
    if (typeof window === "undefined") return;

    const findActiveDialogTitle = (): string | null => {
      // Procura elementos com role="dialog" ou role="alertdialog" visíveis no DOM
      const dialogs = document.querySelectorAll<HTMLElement>(
        '[role="dialog"], [role="alertdialog"], [data-state="open"][data-dialog-content]'
      );

      if (dialogs.length === 0) return null;

      // Pega o último modal aberto (o mais recente na pilha visual)
      const topDialog = dialogs[dialogs.length - 1];

      // Tenta achar o título pelo aria-labelledby
      const labelledBy = topDialog.getAttribute("aria-labelledby");
      if (labelledBy) {
        const titleEl = document.getElementById(labelledBy);
        if (titleEl && titleEl.textContent) {
          const clean = cleanDialogTitleText(titleEl.textContent);
          if (clean) return clean;
        }
      }

      // Tenta achar pelo seletor de classes de título de diálogo
      const titleCandidate = topDialog.querySelector<HTMLElement>(
        '[data-radix-dialog-title], h2, h3, [role="heading"], .dialog-title'
      );
      if (titleCandidate && titleCandidate.textContent) {
        const clean = cleanDialogTitleText(titleCandidate.textContent);
        if (clean) return clean;
      }

      return null;
    };

    const updateFromDom = () => {
      const detected = findActiveDialogTitle();
      setObservedModalTitle(detected);
    };

    // Executa verificação inicial
    updateFromDom();

    // Cria MutationObserver para detectar abertura/fechamento instantâneo de modals e popups
    const observer = new MutationObserver(() => {
      updateFromDom();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "role", "aria-labelledby"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}

function cleanDialogTitleText(raw: string): string {
  // Limpa espaços extras, emojis redundantes e quebras de linha
  const clean = raw
    .replace(/\s+/g, " ")
    .replace(/^(✋|🤖|📦|⚡|🔧|✨|🏆|🛡️|⚠️|💡)\s*/, "")
    .trim();
  if (clean.length > 60) {
    return clean.slice(0, 58) + "...";
  }
  return clean;
}
