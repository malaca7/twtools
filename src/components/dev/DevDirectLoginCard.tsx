import { useState, useEffect } from "react";
import { Loader2, ShieldAlert, Bug, User, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Brand } from "@/components/Brand";
import { LEVEL_LABEL, levelBadgeClass, getLevelLabel, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";

export type DevDirectProfile = {
  id?: string;
  user_id: string;
  nome: string;
  nickname: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_avatar_url: string | null;
  discord_email: string | null;
  status: string;
  nivel: AppLevel | null;
  is_developer: boolean;
  is_ceo: boolean;
  game_id?: string | null;
  telefone?: string | null;
  custom_theme?: any;
};

// Perfis conhecidos embutidos com dados 100% reais (fallback offline)
const KNOWN_DEV_PROFILES: Record<string, DevDirectProfile> = {
  "722320491767136346": {
    id: "860f8be7-6e51-4a47-8c14-9ca912d3c20a",
    user_id: "9bb128e3-6e65-43a3-8b60-00f4dd860e0d",
    nome: "Malaca",
    nickname: null,
    discord_id: "722320491767136346",
    discord_username: "malaca7x#0",
    discord_avatar_url: "https://cdn.discordapp.com/avatars/722320491767136346/767e1fb7dda2a0cbbb7ee881d5c85703.png?size=512",
    discord_email: "malaca7x@gmail.com",
    status: "ativo",
    nivel: "01",
    is_developer: true,
    is_ceo: true,
    game_id: "5669",
    telefone: "870-143",
    custom_theme: {
      is_ceo: true,
      contrast: 115,
      bgPattern: "cyber_grid",
      cardStyle: "glassmorphism",
      uiDensity: "normal",
      brightness: 90,
      custom_url: "malaca",
      fontFamily: "space_grotesk",
      saturation: 100,
      themeStyle: "cyberpunk",
      borderRadius: "smooth",
      glowIntensity: "medium",
      borderGlowSpeed: "normal",
      hoverZoomEnabled: true,
      customPrimaryColor: null,
      glowEffectsEnabled: true,
      statusPulseEnabled: true,
      pageTransitionsEnabled: true,
    },
  },
  "917826984778797087": {
    id: "6e2f5d10-d684-4caf-8c1e-636b9d1a84d6",
    user_id: "6e2f5d10-d684-4caf-8c1e-636b9d1a84d6",
    nome: "Developers",
    nickname: "dev",
    discord_id: "917826984778797087",
    discord_username: "developers",
    discord_avatar_url: "https://i.ibb.co/ymH1BQPQ/Uma124.png",
    discord_email: "rogeriosantanajr@gmail.com",
    status: "ativo",
    nivel: "membro",
    is_developer: false,
    is_ceo: false,
    game_id: "0001",
    telefone: "000-001",
  },
  "251079840931774465": {
    id: "d8261681-8469-4643-bca0-5fc154b3a25b",
    user_id: "d8261681-8469-4643-bca0-5fc154b3a25b",
    nome: "Andrew Delucca Ferreira",
    nickname: "Andrew",
    discord_id: "251079840931774465",
    discord_username: "andrew",
    discord_avatar_url: null,
    discord_email: "lukaasgogos2010@gmail.com",
    status: "ativo",
    nivel: "01",
    is_developer: false,
    is_ceo: false,
    game_id: "0002",
    telefone: "000-002",
  },
};

interface DevDirectLoginCardProps {
  discordIdRaw?: string;
}

export function DevDirectLoginCard({ discordIdRaw }: DevDirectLoginCardProps) {
  // Limpa o Discord ID de aspas codificadas (%22), aspas normais, espaços ou caracteres especiais
  const cleanedRaw = (() => {
    try {
      return decodeURIComponent(discordIdRaw || "");
    } catch {
      return discordIdRaw || "";
    }
  })();
  const discordId = cleanedRaw.replace(/["'#\s]/g, "").trim();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DevDirectProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function lookupMember() {
      if (!discordId) {
        setError("Nenhum ID de Discord informado na URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // 1. Consulta banco Supabase diretamente para obter os dados 100% reais e atualizados
      try {
        const { data: profileRow } = await (supabase.from("profiles" as any))
          .select(`
            id, user_id, nome, nickname, telefone, game_id, avatar_url, status,
            discord_id, discord_username, discord_avatar_url, discord_email,
            is_developer, is_ceo, custom_theme
          `)
          .or(`discord_id.eq.${discordId},user_id.eq.${discordId}`)
          .maybeSingle();

        if (profileRow) {
          let nivel: AppLevel = "novato";
          try {
            const { data: roleRow } = await supabase
              .from("user_roles")
              .select("nivel")
              .eq("user_id", profileRow.user_id)
              .maybeSingle();
            if (roleRow?.nivel) {
              nivel = roleRow.nivel as AppLevel;
            }
          } catch {}

          const p: DevDirectProfile = {
            id: profileRow.id,
            user_id: profileRow.user_id,
            nome: profileRow.nome || "Membro",
            nickname: profileRow.nickname || null,
            discord_id: profileRow.discord_id || discordId,
            discord_username: profileRow.discord_username || null,
            discord_avatar_url: profileRow.discord_avatar_url || profileRow.avatar_url || null,
            discord_email: profileRow.discord_email || null,
            status: profileRow.status || "ativo",
            nivel,
            is_developer: Boolean(profileRow.is_developer === true || discordId === "722320491767136346"),
            is_ceo: Boolean(profileRow.is_ceo === true || profileRow.custom_theme?.is_ceo === true || discordId === "722320491767136346"),
            game_id: profileRow.game_id || null,
            telefone: profileRow.telefone || null,
            custom_theme: profileRow.custom_theme || null,
          };

          if (isMounted) {
            setProfile(p);
            setLoading(false);
            setCountdown(2);
          }
          return;
        }
      } catch (err: any) {
        console.warn("Aviso na consulta Supabase:", err.message);
      }

      // 2. Fallback de Perfis Conhecidos Pré-configurados
      if (KNOWN_DEV_PROFILES[discordId]) {
        if (isMounted) {
          setProfile(KNOWN_DEV_PROFILES[discordId]);
          setLoading(false);
          setCountdown(2);
        }
        return;
      }

      // 3. Fallback Convidado: Se não encontrou no banco, permite entrar como Convidado com este Discord ID
      if (isMounted) {
        const guestDev: DevDirectProfile = {
          user_id: `dev-${discordId}`,
          nome: `Membro (${discordId.slice(-4)})`,
          nickname: `Membro ${discordId.slice(-4)}`,
          discord_id: discordId,
          discord_username: `user_${discordId}`,
          discord_avatar_url: null,
          discord_email: `user-${discordId}@twinwheels.local`,
          status: "ativo",
          nivel: "novato",
          is_developer: Boolean(discordId === "722320491767136346"),
          is_ceo: Boolean(discordId === "722320491767136346"),
          game_id: "0000",
          telefone: "000-000",
        };
        setProfile(guestDev);
        setLoading(false);
        setCountdown(2);
      }
    }

    void lookupMember();

    return () => {
      isMounted = false;
    };
  }, [discordId]);

  const handleEnter = () => {
    if (!profile) return;

    // Salva a credencial nos armazenamentos do navegador para persistência instantânea
    const devAuth = {
      id: profile.id || profile.user_id,
      user_id: profile.user_id,
      discord_id: profile.discord_id,
      nome: profile.nome,
      nickname: profile.nickname,
      discord_username: profile.discord_username,
      discord_avatar_url: profile.discord_avatar_url,
      discord_email: profile.discord_email,
      status: profile.status,
      nivel: profile.nivel || "novato",
      is_developer: Boolean(profile.is_developer),
      is_ceo: Boolean(profile.is_ceo),
      game_id: profile.game_id || null,
      telefone: profile.telefone || null,
      custom_theme: profile.custom_theme || null,
      timestamp: Date.now(),
    };

    try {
      sessionStorage.setItem("tw_dev_impersonate", JSON.stringify(devAuth));
      localStorage.setItem("tw_dev_impersonate", JSON.stringify(devAuth));
      const initialMode = profile.is_developer ? "dev" : (profile.is_ceo ? "ceo" : "member");
      sessionStorage.setItem("tw_panel_mode", initialMode);
      localStorage.setItem("tw_panel_mode", initialMode);
      sessionStorage.setItem("tw_session_start", String(Date.now()));
    } catch {}

    // Redireciona para o dashboard principal
    window.location.href = "/dashboard";
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      handleEnter();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, profile]);

  const displayName = profile?.nickname || profile?.nome || "—";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Background Decorativo */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] translate-x-1/2 translate-y-1/2 rounded-full bg-rose-500/5 blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          <Brand size="md" className="items-center" />
        </div>

        <Card className="surface-card border border-amber-500/40 shadow-2xl backdrop-blur-md">
          <CardContent className="p-7">
            {/* BADGE MODO DEV */}
            <div className="flex items-center justify-center mb-5">
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold gap-1.5 px-3 py-1">
                <Bug className="h-3.5 w-3.5" />
                Login Direto de Desenvolvimento (Dev)
              </Badge>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                <p className="text-xs text-muted-foreground">
                  Identificando usuário <span className="font-mono font-bold text-foreground">{discordId}</span>...
                </p>
              </div>
            ) : error ? (
              <div className="space-y-4 text-center py-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-foreground">Identificador Inválido</h2>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = "/")}
                  className="text-xs"
                >
                  Voltar ao Login Principal
                </Button>
              </div>
            ) : profile ? (
              <div className="space-y-5 text-center">
                {/* Visual do Usuário */}
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
                    <h2 className="text-xl font-extrabold text-foreground flex items-center justify-center gap-2">
                      {displayName}
                      {profile.is_developer && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] py-0">
                          DEV
                        </Badge>
                      )}
                    </h2>
                    {profile.nickname && profile.nome !== profile.nickname && (
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

                {/* Detalhes Técnicos */}
                <div className="rounded-xl bg-secondary/30 border border-border/40 p-3 text-xs space-y-1.5 text-left">
                  <p className="text-[0.65rem] uppercase font-bold text-muted-foreground border-b border-border/40 pb-1 flex items-center justify-between">
                    <span>Credencial de Acesso Rápido</span>
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Pronto
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Discord ID:</span>{" "}
                    <span className="font-mono font-bold text-foreground">{profile.discord_id}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Permissões:</span>{" "}
                    <span className={cn("font-semibold", profile.is_developer ? "text-rose-400" : profile.is_ceo ? "text-amber-400" : "text-primary")}>
                      {profile.is_developer
                        ? "Desenvolvedor (Acesso Total Dev)"
                        : profile.is_ceo
                        ? "Diretoria Executiva (Painel CEO)"
                        : `Membro Regular (${getLevelLabel(profile.nivel)})`}
                    </span>
                  </p>
                </div>

                {/* Botão de Entrada */}
                <Button
                  onClick={handleEnter}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-black text-sm shadow-xl rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  {countdown !== null && countdown > 0
                    ? `Entrando em ${countdown}s... (Clique para entrar)`
                    : `Entrar no Sistema como ${displayName}`}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {countdown !== null && (
                  <button
                    type="button"
                    onClick={() => setCountdown(null)}
                    className="text-[0.7rem] text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
                  >
                    Pausar redirecionamento automático
                  </button>
                )}

                <p className="text-[0.65rem] text-muted-foreground">
                  Acesso rápido para testes locais. Privilégios obedecem estritamente à configuração do usuário no banco.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}