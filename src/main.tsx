import React, { Component, type ErrorInfo, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical Application Crash caught by RootErrorBoundary:", error, errorInfo);
  }

  handleHardReset = () => {
    try {
      localStorage.removeItem("tw_dev_impersonate");
      localStorage.removeItem("tw_panel_mode");
      localStorage.removeItem("tw_menu_config");
      localStorage.removeItem("tw_platform_settings");
      localStorage.removeItem("tw_user_theme");
      sessionStorage.clear();
    } catch {}
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#060911",
            color: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              backgroundColor: "#0d111c",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "24px",
              padding: "32px",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                margin: "0 auto 20px",
                borderRadius: "16px",
                background: "rgba(244, 63, 94, 0.15)",
                border: "1px solid rgba(244, 63, 94, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
              }}
            >
              ⚠️
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px", color: "#fff" }}>
              Inconsistência na Inicialização
            </h1>
            <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: "1.6", marginBottom: "20px" }}>
              A plataforma encontrou uma inconsistência ao iniciar os módulos no seu navegador. Você pode recarregar a página ou restaurar os dados de cache.
            </p>
            {this.state.error?.message && (
              <div
                style={{
                  background: "rgba(244, 63, 94, 0.1)",
                  border: "1px solid rgba(244, 63, 94, 0.25)",
                  color: "#fda4af",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  textAlign: "left",
                  wordBreak: "break-all",
                  marginBottom: "20px",
                  maxHeight: "80px",
                  overflowY: "auto",
                }}
              >
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={this.handleReload}
                style={{
                  height: "42px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                }}
              >
                Recarregar Página
              </button>
              <button
                onClick={this.handleHardReset}
                style={{
                  height: "42px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#d1d5db",
                  fontWeight: "600",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Limpar Cache Local & Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const router = getRouter();

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <RouterProvider router={router} />
      </RootErrorBoundary>
    </React.StrictMode>
  );
}
