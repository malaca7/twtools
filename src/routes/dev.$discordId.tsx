import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Loader2, ShieldAlert, Bug, User, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Brand } from "@/components/Brand";
import { supabase } from "@/integrations/supabase/client";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";

export const Route = createFileRoute("/dev/$discordId")({
  component: DevLoginPageWrapper,
});

function DevLoginPageWrapper() {
  return (
    <DeveloperGuard>
      <DevLoginPage />
    </DeveloperGuard>
  );
}

type DevProfile = {
  user_id: string;
  nome: string;
  nickname: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_avatar_url: string | null;
  discord_email: string | null;
  status: string;
  nivel: AppLevel | null;
};

/**
 * DEV-ONLY fallback login route.
 * Looks up a member by discord_id and impersonates them locally.
 * This bypasses Supabase Auth entirely — for local testing only.
 *
 * Usage: http://localhost:8080/dev/{discord_id}
 */
function DevLoginPage() {
  const { discordId } = useParams({ from: "/dev/$discordId" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DevProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function lookupByDiscordId() {
      setLoading(true);
      setError(null);

      try {
        // Look up profile by discord_id, username, or game_id via RPC (bypasses RLS for dev mode)
        const { data: rows, error: rpcErr } = await (supabase.rpc as any)("get_dev_profile_by_discord_id", {
          p_discord_id: discordId,
        });

        if (rpcErr) throw rpcErr;
        const profileRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

        if (!profileRow) {
          setError(`Nenhum membro encontrado para o identificador: ${discordId}`);
          setLoading(false);
          return;
        }

        const devProfile: DevProfile = {
          user_id: profileRow.user_id,
          nome: profileRow.nome ?? "Membro",
          nickname: profileRow.nickname ?? null,
          discord_id: profileRow.discord_id ?? null,
          discord_username: profileRow.discord_username ?? null,
          discord_avatar_url: profileRow.discord_avatar_url ?? null,
          discord_email: profileRow.discord_email ?? null,
          status: profileRow.status ?? "ativo",
          nivel: (profileRow.nivel as AppLevel) ?? null,
        };

        setProfile(devProfile);
      } catch (err: any) {
        setError(err?.message || "Erro ao buscar membro.");
      } finally {
        setLoading(false);
      }
    }

    void lookupByDiscordId();
  }, [discordId]);

  const handleEnter = () => {
    if (!profile) return;

    // Store dev impersonation data in sessionStorage
    const devAuth = {
      user_id: profile.user_id,
      discord_id: profile.discord_id,
      nome: profile.nome,
      nickname: profile.nickname,
      discord_username: profile.discord_username,
      discord_avatar_url: profile.discord_avatar_url,
      discord_email: profile.discord_email,
      status: profile.status,
      nivel: profile.nivel,
      timestamp: Date.now(),
    };

    sessionStorage.setItem("tw_dev_impersonate", JSON.stringify(devAuth));
    sessionStorage.setItem("tw_session_start", String(Date.now()));

    // Force reload to pick up the dev auth
    window.location.href = "/dashboard";
  };

  const displayName = profile?.nickname || profile?.nome || "—";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Background */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 translate-y-1/2 rounded-full bg-rose-500/5 blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Brand size="md" className="items-center" />
        </div>

        <Card className="surface-card border border-amber-500/30 shadow-2xl backdrop-blur-md">
          <CardContent className="p-8">
            {/* DEV MODE BADGE */}
            <div className="flex items-center justify-center mb-5">
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/40 text-xs font-bold gap-1.5 px-3 py-1">
                <Bug className="h-3.5 w-3.5" />
                Modo Desenvolvedor — Acesso Direto
              </Badge>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                <p className="text-sm text-muted-foreground">
                  Buscando membro com Discord ID: <span className="font-mono font-bold text-foreground">{discordId}</span>
                </p>
              </div>
            ) : error ? (
              <div className="space-y-4 text-center py-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">Membro não encontrado</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
                </div>
                <div className="rounded-xl bg-secondary/30 border border-border/40 p-3 text-xs text-muted-foreground">
                  <p>Discord ID informado: <span className="font-mono font-bold text-foreground">{discordId}</span></p>
                  <p className="mt-1 text-[0.65rem]">Certifique-se de que o Discord ID numérico está correto.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ to: "/" })}
                  className="text-xs"
                >
                  Voltar ao Login
                </Button>
              </div>
            ) : profile ? (
              <div className="space-y-5 text-center">
                {/* Profile Preview */}
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-16 w-16 border-2 border-amber-500/40 shadow-lg">
                    {profile.discord_avatar_url && (
                      <AvatarImage src={profile.discord_avatar_url} alt={displayName} />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-foreground">{displayName}</h2>
                    {profile.nickname && (
                      <p className="text-xs text-muted-foreground">{profile.nome}</p>
                    )}
                  </div>

                  {profile.nivel && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-bold px-3", levelBadgeClass(profile.nivel))}
                    >
                      {LEVEL_LABEL[profile.nivel] || profile.nivel}
                    </Badge>
                  )}
                </div>

                {/* Info Details */}
                <div className="rounded-xl bg-secondary/30 border border-border/40 p-3 text-xs space-y-1.5 text-left">
                  <p className="text-[0.65rem] uppercase font-bold text-muted-foreground border-b border-border/40 pb-1">
                    Detalhes do Membro
                  </p>
                  <p>
                    <span className="text-muted-foreground">Discord:</span>{" "}
                    <span className="font-semibold text-foreground">{profile.discord_username || "—"}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Discord ID:</span>{" "}
                    <span className="font-mono font-bold text-foreground">{profile.discord_id}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">User ID:</span>{" "}
                    <span className="font-mono text-foreground text-[0.6rem]">{profile.user_id}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <span className="font-semibold text-foreground">{profile.status}</span>
                  </p>
                </div>

                {/* Enter Button */}
                <Button
                  onClick={handleEnter}
                  className="w-full h-12 bg-gradient-brand text-primary-foreground font-extrabold text-sm shadow-xl hover:opacity-90 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <User className="h-4 w-4" />
                  Entrar como {displayName}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <p className="text-[0.6rem] text-muted-foreground leading-relaxed">
                  ⚠️ Este acesso é apenas para <strong>testes locais</strong>. Não funciona em produção.
                  Nenhuma autenticação real do Supabase é realizada.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
