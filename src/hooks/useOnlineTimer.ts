import { useState, useEffect } from "react";

function getStartTimestamp(onlineSinceISO?: string | null): number {
  if (onlineSinceISO) {
    const parsed = new Date(onlineSinceISO).getTime();
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  let sessionStart = typeof window !== "undefined" ? Number(sessionStorage.getItem("tw_session_start")) : 0;
  if (!sessionStart || isNaN(sessionStart)) {
    sessionStart = Date.now();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tw_session_start", String(sessionStart));
    }
  }
  return sessionStart;
}

export function useOnlineTimer(onlineSinceISO?: string | null) {
  const [seconds, setSeconds] = useState<number>(() => {
    const start = getStartTimestamp(onlineSinceISO);
    let elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
    return elapsed > 86400 ? elapsed % 86400 : elapsed;
  });

  useEffect(() => {
    const update = () => {
      const start = getStartTimestamp(onlineSinceISO);
      let elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
      if (elapsed > 86400) {
        elapsed = elapsed % 86400;
      }
      setSeconds(elapsed);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [onlineSinceISO]);

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  const formattedTimer = hrs > 0 
    ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;

  const formattedHuman = hrs > 0
    ? `${hrs}h ${pad(mins)}m ${pad(secs)}s`
    : `${mins}m ${pad(secs)}s`;

  const formattedShort = hrs > 0
    ? `${hrs}h ${mins}m`
    : `${mins}m ${secs}s`;

  return {
    seconds,
    formattedTimer,
    formattedHuman,
    formattedShort,
  };
}
