import { notifyDevException } from "./error-capture";

type AppErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
        
  const stack = error instanceof Error ? error.stack : undefined;
  console.error("[Twin Wheels App Error]", {
    message,
    stack,
    route: window.location.pathname,
    ...context,
  });

  notifyDevException(error);
}
