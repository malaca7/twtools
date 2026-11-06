import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rtdb } from "@/integrations/firebase/rtdb";
import { syncDiscordUser } from "@/lib/app-api";
import { useAuth } from "@/hooks/useAuth";
import { DEV_DISCORD_IDS } from "@/services/devService";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Autenticando — Twin Wheels" }],
  }),
  component: AuthCallbackPage,
});

// Helper de timeout seguro para promessas assíncronas
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("Sincronizando sua conta do Discord...");
  const handledRef = useRef(false);

  const startCallback = async () => {
    try {
      setErrorMsg(null);
      setLoadingStep("Identificando parâmetros de autorização...");

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
        let msg = "Erro na autorização do Discord.";
        if (errorCode === "access_denied" || errorDesc?.includes("cancel")) {
          msg = "Login cancelado. Você precisa autorizar a plataforma para continuar.";
        } else if (errorDesc) {
          msg = errorDesc;
        }
        throw new Error(msg);
      }

      // 1. FLUXO DIRETO DISCORD OAUTH (Token via Hash - Sem dependência do Supabase)
      const accessToken = hashParams.get("access_token");
      if (accessToken) {
        setLoadingStep("Consultando perfil do Discord...");
        // Consultar dados do usuário Discord através do proxy seguro do Bot no Discloud (evita CORS)
        const botProxyUrl = `https://twin.discloud.app/api/auth/discord/user?token=${encodeURIComponent(accessToken)}`;
        const discordRes = await withTimeout(
          fetch(botProxyUrl).then((r) => r.json()),
          5000,
          { success: false, error: "Tempo limite esgotado ao contatar o Bot Discord." }
        );

        if (!discordRes.success || !discordRes.user) {
          throw new Error(discordRes.error || "Não foi possível validar seu login no Discord.");
        }

        const discordUser = discordRes.user;
        const discordAvatar = discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=512`
          : "https://cdn.discordapp.com/embed/avatars/0.png";

        // 1.1 Verificar se é desenvolvedor master / fundador pelo Discord ID (estritamente o criador Malaca)
        const isHardcodedDev = Boolean(
          String(discordUser.id) === "722320491767136346"
        );

        setLoadingStep("Validando permissões de acesso...");

        // Buscar perfil correspondente no Supabase e RTDB
        let matchedProfile: any = null;
        try {
          const { data } = await withTimeout(
            supabase
              .from("profiles" as any)
              .select("*")
              .or(`discord_id.eq.${discordUser.id},discord_email.eq.${discordUser.email || "none"}`)
              .maybeSingle(),
            2500,
            { data: null }
          );
          if (data) matchedProfile = data;
        } catch {}

        if (!matchedProfile) {
          const profiles = await withTimeout(rtdb.getList<any>("profiles"), 2000, []);
          matchedProfile = profiles.find(
            (p) =>
              p &&
              (String(p.discord_id) === String(discordUser.id) ||
                (discordUser.email && p.discord_email === discordUser.email))
          );
        }

        // Buscar solicitações de cadastro com timeout
        const signups = await withTimeout(rtdb.getList<any>("signup_requests"), 1500, []);
        const pendingSignup = signups.find(
          (s) =>
            s &&
            (String(s.discord_id) === String(discordUser.id) ||
              (discordUser.email && s.discord_email === discordUser.email))
        );

        // 1.2 ACESSO DE DESENVOLVEDOR MASTER (Instantâneo apenas se não tiver sido revogado)
        const isExplicitlyRevoked = matchedProfile && matchedProfile.is_developer === false;
        if (isHardcodedDev && !isExplicitlyRevoked) {
          const devSession = {
            id: matchedProfile?.id || "860f8be7-6e51-4a47-8c14-9ca912d3c20a",
            user_id: matchedProfile?.user_id || matchedProfile?.id || "c5ef6dc6-e126-4027-80c3-319f0a870315",
            nome: matchedProfile?.nome || discordUser.global_name || discordUser.username || "Malaca",
            nickname: matchedProfile?.nickname || "Malaca",
            telefone: matchedProfile?.telefone || "870-143",
            game_id: matchedProfile?.game_id || "5669",
            avatar_url: matchedProfile?.avatar_url || discordAvatar,
            discord_id: discordUser.id,
            discord_username: discordUser.username,
            discord_avatar_url: discordAvatar,
            discord_email: discordUser.email || "rogeriosantanajr@gmail.com",
            is_developer: true,
            is_ceo: true,
            nivel: "desenvolvedor",
            status: "ativo",
            is_verified: true,
            custom_theme: matchedProfile?.custom_theme || {
              is_ceo: true,
              is_developer: true,
              custom_url: "malaca",
              themeStyle: "cyberpunk",
            },
          };

          localStorage.setItem("tw_dev_impersonate", JSON.stringify(devSession));
          localStorage.setItem("tw_auth_user", JSON.stringify(discordUser));
          localStorage.setItem("tw_panel_mode", "dev");
          sessionStorage.setItem("tw_dev_impersonate", JSON.stringify(devSession));
          sessionStorage.setItem("tw_panel_mode", "dev");
          sessionStorage.setItem("tw_login_logged", String(Date.now()));
          sessionStorage.setItem("tw_session_start", String(Date.now()));

          await refresh();
          toast.success(`Bem-vindo, ${devSession.nickname || devSession.nome}! Acesso Dev verificado.`);
          navigate({ to: "/dev", replace: true });
          return;
        }

        // 1.3 MEMBRO ATIVO
        if (matchedProfile && (matchedProfile.status === "ativo" || matchedProfile.status === "aprovado")) {
          // Buscar cargo do membro
          const userRoles = await withTimeout(rtdb.getList<any>("user_roles"), 1500, []);
          const userRole = userRoles.find(
            (r) => r && (r.user_id === matchedProfile.user_id || r.user_id === matchedProfile.id)
          );

          const isDev = matchedProfile.is_developer === false
            ? false
            : Boolean(matchedProfile.is_developer === true || userRole?.nivel === "desenvolvedor");
          const isCeo = matchedProfile.is_ceo === false
            ? false
            : Boolean(matchedProfile.is_ceo === true || userRole?.nivel === "ceo" || userRole?.nivel === "01");
          const userLevel = isDev ? "desenvolvedor" : (userRole?.nivel || (isCeo ? "01" : "novato"));

          const sessionData = {
            id: matchedProfile.id || `discord-${discordUser.id}`,
            user_id: matchedProfile.user_id || matchedProfile.id || `discord-${discordUser.id}`,
            nome: matchedProfile.nome || discordUser.global_name || discordUser.username,
            nickname: matchedProfile.nickname || null,
            telefone: matchedProfile.telefone || null,
            game_id: matchedProfile.game_id || null,
            avatar_url: matchedProfile.avatar_url || discordAvatar,
            discord_id: discordUser.id,
            discord_username: discordUser.username,
            discord_avatar_url: discordAvatar,
            discord_email: discordUser.email || matchedProfile.discord_email,
            is_developer: isDev,
            is_ceo: isCeo,
            nivel: userLevel,
            status: "ativo",
            is_verified: Boolean(matchedProfile.is_verified),
            custom_theme: matchedProfile.custom_theme || null,
          };

          localStorage.setItem("tw_dev_impersonate", JSON.stringify(sessionData));
          localStorage.setItem("tw_auth_user", JSON.stringify(discordUser));
          localStorage.setItem("tw_panel_mode", isDev ? "dev" : isCeo ? "ceo" : "member");
          sessionStorage.setItem("tw_dev_impersonate", JSON.stringify(sessionData));
          sessionStorage.setItem("tw_login_logged", String(Date.now()));
          sessionStorage.setItem("tw_session_start", String(Date.now()));

          await refresh();
          toast.success(`Bem-vindo de volta, ${matchedProfile.nickname || sessionData.nome}!`);
          navigate({ to: isDev ? "/dev" : isCeo ? "/ceo" : "/dashboard", replace: true });
          return;
        }

        // 1.4 CADASTRO PENDENTE
        if (matchedProfile?.status === "pendente" || pendingSignup?.status === "pendente") {
          localStorage.setItem(
            "tw_pending_discord_user",
            JSON.stringify({
              id: discordUser.id,
              username: discordUser.username,
              avatar: discordAvatar,
              email: discordUser.email,
            })
          );

          const pendingSession = {
            id: matchedProfile?.id || `discord-${discordUser.id}`,
            user_id: matchedProfile?.user_id || `discord-${discordUser.id}`,
            nome: pendingSignup?.nome || matchedProfile?.nome || discordUser.global_name || discordUser.username,
            nickname: pendingSignup?.nickname || matchedProfile?.nickname || null,
            telefone: pendingSignup?.telefone || matchedProfile?.telefone || null,
            game_id: pendingSignup?.game_id || matchedProfile?.game_id || null,
            avatar_url: discordAvatar,
            discord_id: discordUser.id,
            discord_username: discordUser.username,
            discord_avatar_url: discordAvatar,
            discord_email: discordUser.email,
            is_developer: false,
            is_ceo: false,
            nivel: "novato",
            status: "pendente",
            is_verified: false,
          };
          localStorage.setItem("tw_dev_impersonate", JSON.stringify(pendingSession));

          await refresh();
          toast.info("Solicitação de cadastro em análise pela liderança.");
          navigate({ to: "/", replace: true });
          return;
        }

        // 1.5 MEMBRO NOVO (Sem cadastro prévio)
        localStorage.setItem(
          "tw_pending_discord_user",
          JSON.stringify({
            id: discordUser.id,
            username: discordUser.username,
            avatar: discordAvatar,
            email: discordUser.email,
          })
        );

        const newSession = {
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
          is_developer: false,
          is_ceo: false,
          nivel: "novato",
          status: "novo",
          is_verified: false,
        };
        localStorage.setItem("tw_dev_impersonate", JSON.stringify(newSession));

        await refresh();
        toast.info("Conta do Discord vinculada! Preencha seus dados para solicitar cadastro.");
        navigate({ to: "/", replace: true });
        return;
      }

      // 2. FLUXO FALLBACK (Se tiver código retornado pelo Supabase)
      const code = searchParams.get("code") || hashParams.get("code");
      if (code) {
        setLoadingStep("Processando código de autenticação...");
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
    }
  };

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    void startCallback();
  }, [navigate, refresh]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex flex-col items-center space-y-4 max-w-sm">
        {errorMsg ? (
          <div className="flex flex-col items-center space-y-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-foreground shadow-lg">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold">Falha na Autenticação</h2>
              <p className="text-xs text-rose-300">{errorMsg}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/", replace: true })}
                className="gap-1.5 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar ao Início
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handledRef.current = false;
                  void startCallback();
                }}
                className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary animate-duration-1000" />
            <h2 className="text-xl font-semibold text-foreground">Autenticando...</h2>
            <p className="text-sm text-muted-foreground animate-pulse">
              {loadingStep}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
