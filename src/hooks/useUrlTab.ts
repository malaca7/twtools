import { useState, useEffect, useCallback, useRef } from "react";

export interface UseUrlTabOptions<T extends string> {
  /** Nome do parâmetro na URL para fallback ou query (padrão: 'tab') */
  paramName?: string;
  /** Lista opcional de abas válidas para proteção de fallback e roteamento amigável */
  allowedTabs?: readonly T[] | T[];
  /** Se deve substituir a entrada atual no histórico (padrão: true) */
  replaceHistory?: boolean;
  /** Se deve sincronizar também com a hash (#aba) da URL */
  syncHash?: boolean;
  /**
   * Se true, utiliza URLs amigáveis baseadas em caminho (ex: /dev/configuracao/webhooks em vez de ?tab=webhooks).
   * Padrão: true quando allowedTabs estiver presente.
   */
  usePath?: boolean;
}

/**
 * Hook universal de sincronização de abas, filtros e estados com a URL do navegador.
 * Garante URLs amigáveis no padrão de caminho (/dev/configuracao/webhooks) e mantém
 * compatibilidade total com links legados (?tab=webhooks) e hash (#webhooks).
 * Ao recarregar a página (F5), o usuário permanece exatamente onde estava na plataforma.
 */
export function useUrlTab<T extends string>(
  defaultTab: T,
  options?: UseUrlTabOptions<T>
): [T, (newTab: T) => void] {
  const paramName = options?.paramName || "tab";
  const allowed = options?.allowedTabs;
  const replaceHistory = options?.replaceHistory !== false;
  const syncHash = options?.syncHash || false;
  const usePath = options?.usePath !== undefined ? options.usePath : Boolean(allowed && allowed.length > 0);

  // Função pura para ler o valor inicial da URL (path -> query -> hash -> default)
  const readTabFromUrl = useCallback((): T => {
    if (typeof window === "undefined") return defaultTab;

    try {
      // 1. Tenta extrair a aba diretamente do path amigável (/rota/aba)
      if (usePath && allowed && allowed.length > 0) {
        const pathname = window.location.pathname.replace(/\/+$/, "");
        const segments = pathname.split("/").filter(Boolean);
        const lastSegment = segments[segments.length - 1];

        if (lastSegment && (allowed as readonly string[]).includes(lastSegment)) {
          return lastSegment as T;
        }
      }

      // 2. Fallback para Query Params (?tab=...)
      const urlParams = new URLSearchParams(window.location.search);
      const queryVal = urlParams.get(paramName);

      if (queryVal) {
        if (!allowed || (allowed as readonly string[]).includes(queryVal)) {
          return queryVal as T;
        }
      }

      // 3. Fallback para Hash (#aba)
      if (syncHash && window.location.hash) {
        const hashVal = window.location.hash.replace(/^#/, "");
        if (hashVal && (!allowed || (allowed as readonly string[]).includes(hashVal))) {
          return hashVal as T;
        }
      }
    } catch {
      // Ignora erro em ambientes restritos
    }

    return defaultTab;
  }, [defaultTab, paramName, allowed, syncHash, usePath]);

  const [activeTab, setActiveTabState] = useState<T>(readTabFromUrl);
  const activeTabRef = useRef<T>(activeTab);
  activeTabRef.current = activeTab;

  // Atualiza a URL e o estado local sem recarregar a página
  const setTab = useCallback(
    (newTab: T) => {
      if (activeTabRef.current === newTab) return;

      setActiveTabState(newTab);
      activeTabRef.current = newTab;

      if (typeof window === "undefined") return;

      try {
        const url = new URL(window.location.href);

        if (usePath && allowed && allowed.length > 0) {
          const cleanPath = url.pathname.replace(/\/+$/, "");
          const segments = cleanPath.split("/").filter(Boolean);
          const lastSegment = segments[segments.length - 1];

          let baseSegments = segments;
          if (lastSegment && (allowed as readonly string[]).includes(lastSegment)) {
            baseSegments = segments.slice(0, -1);
          }

          url.pathname = "/" + [...baseSegments, newTab].join("/");
          // Limpa o parâmetro query para manter a URL limpa e amigável
          url.searchParams.delete(paramName);
        } else {
          url.searchParams.set(paramName, newTab);
        }

        if (syncHash) {
          url.hash = newTab;
        }

        const newUrl = url.pathname + url.search + url.hash;
        if (replaceHistory) {
          window.history.replaceState(window.history.state, "", newUrl);
        } else {
          window.history.pushState(window.history.state, "", newUrl);
        }
      } catch (err) {
        console.warn("Falha ao sincronizar URL amigável:", err);
      }
    },
    [paramName, replaceHistory, syncHash, usePath, allowed]
  );

  // Migração automática de URLs legadas com query param (?tab=...) para URLs amigáveis no path (/rota/aba)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!usePath || !allowed || allowed.length === 0) return;

    try {
      const url = new URL(window.location.href);
      const queryVal = url.searchParams.get(paramName);

      if (queryVal && (allowed as readonly string[]).includes(queryVal)) {
        const cleanPath = url.pathname.replace(/\/+$/, "");
        const segments = cleanPath.split("/").filter(Boolean);
        const lastSegment = segments[segments.length - 1];

        let baseSegments = segments;
        if (lastSegment && (allowed as readonly string[]).includes(lastSegment)) {
          baseSegments = segments.slice(0, -1);
        }

        url.pathname = "/" + [...baseSegments, queryVal].join("/");
        url.searchParams.delete(paramName);
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
    } catch {}
  }, [paramName, allowed, usePath]);

  // Escuta os botões Voltar / Avançar do navegador
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const currentTab = readTabFromUrl();
      if (currentTab !== activeTabRef.current) {
        setActiveTabState(currentTab);
        activeTabRef.current = currentTab;
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, [readTabFromUrl]);

  return [activeTab, setTab];
}

/**
 * Hook genérico para sincronizar qualquer parâmetro de consulta com a URL
 * (ex: status, categoria, tipo, periodo, search, modal)
 */
export function useSyncedUrlParam<T extends string>(
  paramName: string,
  defaultValue: T,
  allowedValues?: readonly T[] | T[]
): [T, (newValue: T) => void] {
  return useUrlTab<T>(defaultValue, {
    paramName,
    allowedTabs: allowedValues,
    replaceHistory: true,
    usePath: false, // Parâmetros auxiliares continuam como search params
  });
}
