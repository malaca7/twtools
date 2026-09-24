/**
 * Hook de timer de tempo online simplificado.
 * Desativa re-renderizações por segundo e processamento contínuo de tempo online.
 */
export function useOnlineTimer(_onlineSinceISO?: string | null) {
  return {
    seconds: 0,
    formattedTimer: "00:00",
    formattedHuman: "0m 0s",
    formattedShort: "0m",
  };
}
