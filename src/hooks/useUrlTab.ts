import { useState, useEffect, useCallback, useRef } from "react";

export interface UseUrlTabOptions<T extends string> {
  /** Nome do parâmetro na URL (padrão: 'tab') */
  paramName?: string;
  /** Lista opcional de abas válidas para proteção de fallback */
  allowedTabs?: readonly T[] | T[];
  /** Se deve substituir a entrada atual no histórico (padrão: true) */
  replaceHistory?: boolean;
  /** Se deve sincronizar também com a hash (#aba) da URL */
  syncHash?: boolean;
}

/**
 * Hook universal de sincronização de abas, filtros e estados com a URL do navegador.
 * Garante URLs amigáveis e que ao recarregar a página (F5), o usuário permaneça
 * exatamente onde estava na plataforma.
 */
export function useUrlTab<T extends string>(
  defaultTab: T,
  options?: UseUrlTabOptions<T>
): [T, (newTab: T) => void] {
  const paramName = options?.paramName || "tab";
  const allowed = options?.allowedTabs;
  const replaceHistory = options?.replaceHistory !== false;
  const syncHash = options?.syncHash || false;

  // Função pura para ler o valor inicial da URL ou hash
  const readTabFromUrl = useCallback((): T => {
    if (typeof window === "undefined") return defaultTab;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const val = urlParams.get(paramName);

      if (val) {
        if (!allowed || (allowed as readonly string[]).includes(val)) {
          return val as T;
        }
      }

      // Hash fallback se habilitado (ex: #webhooks)
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
  }, [defaultTab, paramName, allowed, syncHash]);

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

        // Se for igual ao padrão e não quisermos poluir, podemos manter explícito para URL amigável
        url.searchParams.set(paramName, newTab);

        if (syncHash) {
          url.hash = newTab;
        }

        if (replaceHistory) {
          window.history.replaceState(window.history.state, "", url.toString());
        } else {
          window.history.pushState(window.history.state, "", url.toString());
        }
      } catch (err) {
        console.warn("Falha ao sincronizar URL:", err);
      }
    },
    [paramName, replaceHistory, syncHash]
  );

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
    return () => window.removeEventListener("popstate", handlePopState);
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
  });
}
