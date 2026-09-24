import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { syncDiscordUser } from "@/lib/app-api";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Autenticando — Twin Wheels" }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    async function handleCallback() {
      try {
        // Check for error parameters in both query and hash
        const searchParams = new URLSearchParams(window.location.search);
        const hashClean = window.location.hash.startsWith("#") ? window.location.hash.substring(1) : window.location.hash;
        const hashParams = new URLSearchParams(hashClean);

        const errorCode = searchParams.get("error_code") || searchParams.get("error") || hashParams.get("error_code") || hashParams.get("error");
        const errorDesc = searchParams.get("error_description") || hashParams.get("error_description");
        
        if (errorCode) {
          let msg = "Erro na autenticação com o Discord.";
          if (errorCode === "access_denied" || errorDesc?.includes("cancel")) {
            msg = "Login cancelado. Você precisa autorizar o aplicativo para continuar.";
          } else if (errorDesc?.includes("Unable to exchange external code")) {
            msg = "Erro nas credenciais do Discord: o Client Secret no Supabase está incorreto ou expirado. É necessário atualizar o Client Secret no painel do Supabase com o valor do Discord Developer Portal.";
          } else if (errorDesc) {
            msg = errorDesc;
          }
          throw new Error(msg);
        }

        // Se houver um código retornado na URL (?code=...), tenta exchangeCodeForSession
        const code = searchParams.get("code") || hashParams.get("code");
        if (code) {
          try {
            await supabase.auth.exchangeCodeForSession(code);
          } catch (codeErr) {
            console.warn("exchangeCodeForSession info:", codeErr);
          }
        }

        // Wait up to 3 seconds for Supabase JS client to process hash/code token and populate session
        let session = null;
        for (let i = 0; i < 15; i++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            session = data.session;
            break;
          }
          await new Promise((r) => setTimeout(r, 200));
        }

        if (!session) {
          throw new Error("Sessão não encontrada. Tente fazer login novamente.");
        }

        // Sync with the backend RPC
        await syncDiscordUser({ data: { token: session.access_token } }).catch(() => {});
        
        // Mark session logged to prevent duplicate log in useAuth
        sessionStorage.setItem("tw_login_logged", String(Date.now()));
        sessionStorage.setItem("tw_session_start", String(Date.now()));

        // Log login & session_start audit actions
        const { logAuditAction } = await import("@/lib/app-api");
        await logAuditAction("login", "auth", { user_id: session.user.id });
        await logAuditAction("session_start", "user_presence", { user_id: session.user.id, reason: "login_discord" });

        // Refresh useAuth state
        await refresh();

        toast.success("Autenticação via Discord realizada com sucesso!");
        navigate({ to: "/dashboard", replace: true });
      } catch (err: any) {
        console.error("Auth callback error:", err);
        const msg = err.message || "Não foi possível concluir a autenticação.";
        setErrorMsg(msg);
        toast.error(msg);
        navigate({ to: "/", replace: true });
      }
    }

    void handleCallback();
  }, [navigate, refresh]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary animate-duration-1000" />
        <h2 className="text-xl font-semibold text-foreground">Autenticando...</h2>
        <p className="text-sm text-muted-foreground animate-pulse">
          {errorMsg ? errorMsg : "Sincronizando sua conta do Discord com a plataforma..."}
        </p>
      </div>
    </div>
  );
}
