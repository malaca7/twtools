import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rtdb } from "@/integrations/firebase/rtdb";
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
        const searchParams = new URLSearchParams(window.location.search);
        const hashClean = window.location.hash.startsWith("#") ? window.location.hash.substring(1) : window.location.hash;
        const hashParams = new URLSearchParams(hashClean);

        const errorCode =
          searchParams.get("error_code") ||
          searchParams.get("error") ||
          hashParams.get("error_code") ||
          hashParams.get("error");
        const errorDesc = searchParams.get("error_description") || hashParams.get("error_description");

        if (errorCode) {
          let msg = "Erro na autenticação com o Discord.";
          if (errorCode === "access_denied" || errorDesc?.includes("cancel")) {
            msg = "Login cancelado. Você precisa autorizar o aplicativo para continuar.";
          } else if (errorDesc) {
            msg = errorDesc;
          }
          throw new Error(msg);
        }

        // 1. FLUXO DIRETO DISCORD OAUTH (Token via Hash - Sem dependência do Supabase)
        const accessToken = hashParams.get("access_token");
        if (accessToken) {
          // Consultar dados do usuário Discord através do proxy seguro do Bot no Discloud (evita CORS)
          const botProxyUrl = `https://twin.discloud.app/api/auth/discord/user?token=${encodeURIComponent(accessToken)}`;
          const discordRes = await fetch(botProxyUrl);
          const discordJson = await discordRes.json();

          if (!discordJson.success || !discordJson.user) {
            throw new Error(discordJson.error || "Não foi possível validar seu login no Discord.");
          }

          const discordUser = discordJson.user;
          const discordAvatar = discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=512`
            : "https://cdn.discordapp.com/embed/avatars/0.png";

          // Buscar perfil correspondente no Firebase Realtime Database
          const profiles = await rtdb.getList<any>("profiles");
          const matchedProfile = profiles.find(
            (p) =>
              String(p.discord_id) === String(discordUser.id) ||
              (discordUser.email && p.discord_email === discordUser.email)
          );

          if (matchedProfile && matchedProfile.status === "ativo") {
            // Buscar cargo do membro no Firebase RTDB
            const userRoles = await rtdb.getList<any>("user_roles");
            const userRole = userRoles.find(
              (r) => r.user_id === matchedProfile.user_id || r.user_id === matchedProfile.id
            );

            const isDev = Boolean(
              matchedProfile.is_developer === true || (matchedProfile.is_developer === undefined && discordUser.id === "722320491767136346")
            );
            const isCeo = Boolean(
              matchedProfile.is_ceo === true || matchedProfile.custom_theme?.is_ceo === true
            );
            const userLevel = userRole?.nivel || (isDev || isCeo ? "01" : "novato");

            const sessionData = {
              id: matchedProfile.id,
              user_id: matchedProfile.user_id || matchedProfile.id,
              nome: matchedProfile.nome,
              nickname: matchedProfile.nickname,
              telefone: matchedProfile.telefone,
              game_id: matchedProfile.game_id,
              avatar_url: matchedProfile.avatar_url || discordAvatar,
              discord_id: discordUser.id,
              discord_username: discordUser.username,
              discord_avatar_url: discordAvatar,
              discord_email: discordUser.email || matchedProfile.discord_email,
              is_developer: isDev,
              is_ceo: isCeo,
              nivel: userLevel,
              status: matchedProfile.status,
              is_verified: Boolean(matchedProfile.is_verified),
              custom_theme: matchedProfile.custom_theme || null,
            };

            // Salvar sessão no localStorage
            localStorage.setItem("tw_dev_impersonate", JSON.stringify(sessionData));
            localStorage.setItem("tw_auth_user", JSON.stringify(discordUser));
            sessionStorage.setItem("tw_login_logged", String(Date.now()));
            sessionStorage.setItem("tw_session_start", String(Date.now()));

            await refresh();
            toast.success(`Bem-vindo de volta, ${matchedProfile.nickname || matchedProfile.nome}!`);
            navigate({ to: "/dashboard", replace: true });
            return;
          } else {
            // Membro novo ou cadastro pendente de aprovação
            localStorage.setItem(
              "tw_pending_discord_user",
              JSON.stringify({
                id: discordUser.id,
                username: discordUser.username,
                avatar: discordAvatar,
                email: discordUser.email,
              })
            );

            // Criar sessão temporária para permitir cadastro na tela inicial
            const tempSession = {
              id: `discord-${discordUser.id}`,
              user_id: `discord-${discordUser.id}`,
              nome: discordUser.global_name || discordUser.username,
              nickname: null,
              telefone: null,
              game_id: null,
              avatar_url: discordAvatar,
              discord_id: discordUser.id,
              discord_username: discordUser.username,
              discord_avatar_url: discordAvatar,
              discord_email: discordUser.email,
              is_developer: discordUser.id === "722320491767136346",
              is_ceo: discordUser.id === "722320491767136346",
              nivel: "novato",
              status: "pendente",
              is_verified: false,
            };
            localStorage.setItem("tw_dev_impersonate", JSON.stringify(tempSession));

            await refresh();
            toast.info("Conta do Discord vinculada! Preencha seus dados para solicitar acesso.");
            navigate({ to: "/", replace: true });
            return;
          }
        }

        // 2. FLUXO FALLBACK (Se tiver código retornado pelo Supabase)
        const code = searchParams.get("code") || hashParams.get("code");
        if (code) {
          try {
            await supabase.auth.exchangeCodeForSession(code);
          } catch (codeErr) {
            console.warn("exchangeCodeForSession info:", codeErr);
          }

          let session = null;
          for (let i = 0; i < 15; i++) {
            const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
            if (data?.session) {
              session = data.session;
              break;
            }
            await new Promise((r) => setTimeout(r, 200));
          }

          if (session) {
            await syncDiscordUser({ data: { token: session.access_token } }).catch(() => {});
            sessionStorage.setItem("tw_login_logged", String(Date.now()));
            sessionStorage.setItem("tw_session_start", String(Date.now()));
            await refresh();
            toast.success("Autenticação via Discord realizada com sucesso!");
            navigate({ to: "/dashboard", replace: true });
            return;
          }
        }

        throw new Error("Sessão não identificada. Tente fazer login novamente.");
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
