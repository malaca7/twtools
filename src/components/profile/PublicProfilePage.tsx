import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  MessageSquare,
  Check,
  ArrowLeft,
  Shield,
  Sparkles,
  Share2,
  Globe,
  ExternalLink,
  Edit3,
  Moon,
  Radio,
  Calendar,
  ChevronRight,
  LogIn,
  Quote,
  LayoutDashboard,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { getOrCreatePrivateConversation } from "@/services/chatService";
import { formatSecondsToHoursAndMinutes } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { ProfileFollowButton } from "@/components/profile/ProfileFollowButton";
import { ProfileFeed } from "@/components/profile/ProfileFeed";
import { BANNER_PRESETS, type SocialLinks } from "@/types/profileFeed";
import { STREAM_PLATFORMS } from "@/types/lives";
import { PerfilPage } from "@/routes/_authenticated/perfil";

export interface PublicProfilePageProps {
  handleOverride?: string;
  isRootRoute?: boolean;
}

export function PublicProfilePage({ handleOverride, isRootRoute = false }: PublicProfilePageProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: members = [] } = useMembers();

  const [copiedLink, setCopiedLink] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Normaliza o handle recebido (decodifica, remove @ ou %40 e coloca em minúsculas)
  const rawHandle = (() => {
    try {
      return decodeURIComponent(handleOverride || "");
    } catch {
      return handleOverride || "";
    }
  })();
  const cleanHandle = rawHandle.trim().toLowerCase().replace(/^(@|%40)/i, "");

  // Se o identificador for uma das abas do perfil próprio, renderiza diretamente o PerfilPage
  if (cleanHandle === "aparencia" || cleanHandle === "dados" || cleanHandle === "publico") {
    return <PerfilPage initialTab={cleanHandle as any} />;
  }

  // 1. Busca rápida em cache local nos membros carregados
  const cachedMember = members.find((m) => {
    const cUrl = (m.custom_url || m.custom_theme?.custom_url || "").toLowerCase().trim();
    const dId = (m.discord_id || "").toLowerCase().trim();
    const dUser = (m.discord_username || "").toLowerCase().replace(/#0$/, "").trim();
    const uId = (m.user_id || "").toLowerCase().trim();
    const gId = (m.game_id || "").toLowerCase().trim();
    return (
      cUrl === cleanHandle ||
      dId === cleanHandle ||
      dUser === cleanHandle ||
      uId === cleanHandle ||
      gId === cleanHandle
    );
  });

  // 2. Consulta direta indexada e ultra-rápida no Supabase (não depende de auth)
  const { data: dbProfile, isLoading: isDbLoading } = useQuery({
    queryKey: ["public-member-direct", cleanHandle],
    queryFn: async () => {
      if (!cleanHandle) return null;

      try {
        // Tenta buscar no profiles diretamente por custom_url, discord_username, discord_id, user_id ou game_id
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanHandle);
        let orQuery = `custom_url.ilike.${cleanHandle},discord_username.ilike.${cleanHandle}#0,discord_username.ilike.${cleanHandle},discord_id.eq.${cleanHandle},game_id.eq.${cleanHandle}`;
        if (isUuid) {
          orQuery += `,user_id.eq.${cleanHandle}`;
        }

        const { data: directData, error: directErr } = await (supabase.from("profiles" as any))
          .select("*, member_stream_accounts(*)")
          .or(orQuery)
          .limit(1)
          .maybeSingle();

        if (directData && !directErr) {
          // Busca cargo correspondente
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("nivel")
            .eq("user_id", directData.user_id)
            .maybeSingle();

          // Busca presença correspondente
          const { data: presenceData } = await (supabase.from("user_presence" as any))
            .select("status, last_seen, online_since, total_seconds_online")
            .eq("user_id", directData.user_id)
            .maybeSingle();

          return {
            ...directData,
            nivel: roleData?.nivel || (directData.is_developer || directData.is_ceo ? "01" : "novato"),
            presence: presenceData || null,
          };
        }

        // Fallback: busca por custom_theme->>'custom_url'
        const { data: jsonFallback } = await (supabase.from("profiles" as any))
          .select("*, member_stream_accounts(*)")
          .filter("custom_theme->>custom_url", "eq", cleanHandle)
          .limit(1)
          .maybeSingle();

        if (jsonFallback) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("nivel")
            .eq("user_id", jsonFallback.user_id)
            .maybeSingle();

          const { data: presenceData } = await (supabase.from("user_presence" as any))
            .select("status, last_seen, online_since, total_seconds_online")
            .eq("user_id", jsonFallback.user_id)
            .maybeSingle();

          return {
            ...jsonFallback,
            nivel: roleData?.nivel || (jsonFallback.is_developer || jsonFallback.is_ceo ? "01" : "novato"),
            presence: presenceData || null,
          };
        }
      } catch (err) {
        console.warn("Erro na busca direta do perfil:", err);
      }

      return null;
    },
    staleTime: 1000 * 30,
  });

  const memberData = dbProfile || cachedMember;
  const isTargetLoading = !cachedMember && isDbLoading;

  if (isTargetLoading) {
    return (
      <div className="mx-auto max-w-4xl py-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground font-medium">Carregando perfil oficial...</p>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-5 animate-in fade-in-50 duration-200">
        <div className="mx-auto h-16 w-16 rounded-3xl bg-secondary/80 border border-border/80 flex items-center justify-center shadow-lg">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-foreground">Perfil não encontrado</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Nenhum membro da facção foi localizado com o identificador{" "}
            <span className="font-mono font-bold text-primary">@{cleanHandle}</span>.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          {user ? (
            <Link to="/membros">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Ver Todos os Membros</span>
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button
                type="button"
                size="sm"
                className="text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Ir para Início / Login</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const userId = memberData.user_id;
  const isSelf = Boolean(user && userId === user.id);
  const isPublicProfileEnabled = memberData.custom_theme?.public_profile_enabled !== false;

  // Se o perfil estiver em modo privado e o visitante não estiver autenticado
  if (!isPublicProfileEnabled && !user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center space-y-5 animate-in fade-in-50 duration-200">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-secondary/80 border border-border/80 flex items-center justify-center shadow-xl">
          <Shield className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <Badge variant="outline" className="text-[10px] font-mono border-zinc-500/40 text-muted-foreground bg-zinc-500/10 font-bold">
            🔒 Perfil Privado
          </Badge>
          <h2 className="text-xl font-black text-foreground">Este perfil está em modo privado</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            O integrante <span className="font-bold text-foreground">{memberData.nickname || memberData.nome}</span> optou por restringir a visualização deste perfil apenas para membros autenticados no painel da facção.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/">
            <Button size="sm" className="text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground shadow-sm cursor-pointer">
              <LogIn className="h-3.5 w-3.5" />
              <span>Fazer Login para Visualizar</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const presenceObj = (memberData as any).presence || null;
  const status = cachedMember?.presence_status || presenceObj?.status || "offline";
  const totalSecondsOnline = cachedMember?.total_seconds_online || presenceObj?.total_seconds_online || 0;
  const currentNivel = ((memberData as any).nivel || cachedMember?.nivel || "novato") as AppLevel;
  const avatarUrl = memberData.avatar_url || memberData.discord_avatar_url;
  const displayName = memberData.nickname || memberData.nome || "Membro";
  const initials = displayName.slice(0, 2).toUpperCase();
  const activeSlug = memberData.custom_url || memberData.custom_theme?.custom_url || memberData.discord_username?.replace(/#0$/, "") || memberData.user_id;

  const bannerValue = (memberData.banner_url || memberData.custom_theme?.banner_url || "tw_classic") as string;
  const bio = (memberData.bio || memberData.custom_theme?.bio || "") as string;
  const customStatus = (memberData.custom_status || memberData.custom_theme?.custom_status || "") as string;
  const socialLinks: SocialLinks = (memberData.social_links || memberData.custom_theme?.social_links || {}) as SocialLinks;
  const streamAccounts = ((memberData as any).member_stream_accounts || []) as any[];

  const isPresetBanner = !bannerValue.startsWith("http://") && !bannerValue.startsWith("https://") && !bannerValue.startsWith("data:image");
  const matchedPreset = BANNER_PRESETS.find((p) => p.id === bannerValue) || BANNER_PRESETS[0];

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanSlug = String(activeSlug || "").replace(/^(@|%40)/i, "");
    // Formato moderno solicitado: /@handle ou /handle
    const link = `${origin}/@${cleanSlug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Link do perfil copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleStartChat = async () => {
    if (!user || isSelf) return;
    try {
      setStartingChat(true);
      await getOrCreatePrivateConversation(user.id, userId);
      toast.success(`Abrindo chat com ${displayName}...`);
      navigate({ to: "/chat" });
    } catch {
      toast.error("Não foi possível iniciar a conversa.");
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16 animate-in fade-in-50 duration-200">
      {/* BOTÃO VOLTAR / BREADCRUMBS */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              window.history.back();
            } else {
              navigate({ to: "/" });
            }
          }}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar</span>
        </Button>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
          <Link to="/" className="hover:text-primary transition-colors">
            Twin Wheels
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-bold truncate max-w-[160px]">@{activeSlug}</span>
        </div>
      </div>

      {/* HERO CARD COM BANNER PERSONALIZADO */}
      <div className="relative rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xl">
        {/* BANNER SUPERIOR (PRESET OU IMAGEM CUSTOMIZADA) */}
        <div className="h-44 sm:h-56 w-full relative overflow-hidden bg-black">
          {isPresetBanner ? (
            <div className={cn("w-full h-full bg-gradient-to-r relative", matchedPreset.gradient)}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.06),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.8)_0%,transparent_70%)]" />
            </div>
          ) : (
            <div className="w-full h-full relative">
              <img
                src={bannerValue}
                alt="Banner do Perfil"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
          )}



          {/* BADGES NO BANNER */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {isSelf && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold gap-1.5 backdrop-blur-md">
                <Sparkles className="h-3 w-3" />
                <span>Seu Perfil Público</span>
              </Badge>
            )}

            <Badge variant="outline" className={cn("text-xs uppercase font-mono font-black backdrop-blur-md", levelBadgeClass(currentNivel))}>
              {LEVEL_LABEL[currentNivel] || currentNivel}
            </Badge>
          </div>
        </div>

        {/* INFORMAÇÕES PRINCIPAIS & AVATAR */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* AVATAR COM ANEL DE STATUS */}
            <div className="relative inline-block self-start">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl border-4 border-card shadow-2xl bg-secondary ring-2 ring-border/80">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
                <AvatarFallback className="bg-gradient-brand text-primary-foreground font-black text-2xl sm:text-3xl rounded-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* STATUS DE PRESENÇA */}
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 h-6 w-6 rounded-xl border-3 border-card flex items-center justify-center shadow-md",
                  status === "online"
                    ? "bg-emerald-500 text-white"
                    : status === "ausente"
                    ? "bg-amber-500 text-white"
                    : "bg-zinc-600 text-white"
                )}
                title={status === "online" ? "Online agora" : status === "ausente" ? "Ausente" : "Offline"}
              >
                {status === "online" ? (
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                ) : status === "ausente" ? (
                  <Moon className="h-3 w-3" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-zinc-300" />
                )}
              </div>
            </div>

            {/* BOTÕES DE AÇÃO DO VISITANTE */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-9 px-3 text-xs font-bold border-border/80 hover:bg-secondary rounded-xl gap-1.5 cursor-pointer"
                title="Copiar link público do perfil"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copiedLink ? "Link Copiado!" : "Compartilhar"}</span>
              </Button>

              {isSelf ? (
                <Link to="/perfil">
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-4 text-xs font-bold bg-gradient-brand text-primary-foreground hover:opacity-90 rounded-xl gap-1.5 cursor-pointer shadow-md"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Personalizar Perfil</span>
                  </Button>
                </Link>
              ) : !user ? (
                <Link to="/">
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 px-4 text-xs font-bold bg-gradient-brand text-primary-foreground hover:opacity-90 rounded-xl gap-1.5 cursor-pointer shadow-md"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Entrar no Painel</span>
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          {/* NOMES E TAGLINE */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {displayName}
              </h1>

              {Boolean(memberData.is_developer) && (
                <Badge variant="outline" className="text-[10px] font-mono font-bold border-cyan-500/40 text-cyan-300 bg-cyan-500/10">
                  DEV
                </Badge>
              )}

              {Boolean(memberData.is_ceo || memberData.custom_theme?.is_ceo) && (
                <Badge className="text-[10px] font-bold border-amber-500/40 text-amber-300 bg-amber-500/20 shadow-xs shadow-amber-500/20">
                  👑 CEO
                </Badge>
              )}
            </div>

            {/* FRASE DE STATUS PERSONALIZADA */}
            {customStatus && (
              <p className="text-xs text-primary font-medium italic flex items-center gap-1.5">
                <span>“{customStatus}”</span>
              </p>
            )}

            {/* IDENTIFICADOR PÚBLICO E DATA DE ENTRADA */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 font-mono bg-secondary/60 border border-border/60 px-2.5 py-0.5 rounded-lg text-[11px]">
                <Globe className="h-3 w-3 text-primary" />
                <span>@{String(activeSlug || "").replace(/^(@|%40)/i, "")}</span>
              </div>

              {totalSecondsOnline > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono bg-secondary/40 border border-border/40 px-2.5 py-0.5 rounded-lg">
                  <Clock className="h-3 w-3 text-emerald-400" />
                  <span>Online: {formatSecondsToHoursAndMinutes(totalSecondsOnline)}</span>
                </div>
              )}

              {memberData.data_entrada && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>Membro desde {new Date(memberData.data_entrada).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
            </div>

            {/* SISTEMA DE SEGUIR & NOTIFICAÇÕES */}
            <div className="pt-3 border-t border-border/50 mt-3">
              <ProfileFollowButton
                targetUserId={userId}
                targetName={displayName}
                isSelf={isSelf}
              />
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE INFORMAÇÕES PÚBLICAS DO MEMBRO */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* CARD 1 & 2: SOBRE MIM / BIO */}
        <Card className={cn("surface-card", bio ? "md:col-span-2" : "md:col-span-3")}>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Quote className="h-4 w-4 text-primary" /> Sobre Mim
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs leading-relaxed text-foreground/80">
            {bio ? (
              <p className="whitespace-pre-wrap">{bio}</p>
            ) : (
              <p className="text-muted-foreground italic">
                {isSelf
                  ? "Você ainda não adicionou uma biografia. Clique em 'Personalizar Perfil' para contar mais sobre você!"
                  : "Este membro ainda não adicionou uma descrição ao seu perfil público."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* CARD 3: REDES SOCIAIS & TRANSMISSÕES */}
        <Card className="surface-card">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Radio className="h-4 w-4 text-rose-400" /> Redes & Transmissões
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5 text-xs">
            {/* CANAIS DE STREAMING VINCULADOS */}
            {streamAccounts.length > 0 ? (
              <div className="space-y-1.5 pb-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Canais de Live</p>
                {streamAccounts.map((acc: any) => {
                  const pMeta = STREAM_PLATFORMS[acc.platform as keyof typeof STREAM_PLATFORMS] || STREAM_PLATFORMS.twitch;
                  return (
                    <a
                      key={acc.id}
                      href={acc.channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] font-mono uppercase font-bold py-0", pMeta.badgeBg, pMeta.badgeColor, pMeta.borderColor)}
                        >
                          {pMeta.name}
                        </Badge>
                        <span className="font-bold text-[11px] truncate">@{acc.channel_name}</span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                    </a>
                  );
                })}
              </div>
            ) : null}

            {/* LINKS DE REDES SOCIAIS */}
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Redes Sociais</p>
              {Object.keys(socialLinks).some((k) => Boolean((socialLinks as any)[k])) ? (
                <div className="flex flex-wrap gap-1.5">
                  {socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${socialLinks.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/70 bg-secondary/40 hover:bg-secondary text-[11px] font-bold text-foreground transition-colors"
                    >
                      <span>📸 Instagram</span>
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a
                      href={`https://x.com/${socialLinks.twitter.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/70 bg-secondary/40 hover:bg-secondary text-[11px] font-bold text-foreground transition-colors"
                    >
                      <span>🐦 X / Twitter</span>
                    </a>
                  )}
                  {socialLinks.tiktok && (
                    <a
                      href={`https://tiktok.com/@${socialLinks.tiktok.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/70 bg-secondary/40 hover:bg-secondary text-[11px] font-bold text-foreground transition-colors"
                    >
                      <span>🎵 TikTok</span>
                    </a>
                  )}
                  {socialLinks.twitch && (
                    <a
                      href={`https://twitch.tv/${socialLinks.twitch.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[11px] font-bold transition-colors"
                    >
                      <span>🟣 Twitch</span>
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a
                      href={socialLinks.youtube.startsWith("http") ? socialLinks.youtube : `https://youtube.com/@${socialLinks.youtube.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-[11px] font-bold transition-colors"
                    >
                      <span>🔴 YouTube</span>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-[11px] italic">
                  Nenhuma rede social configurada.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FEED DE PUBLICAÇÕES DO MEMBRO */}
      <ProfileFeed
        authorId={userId}
        authorName={displayName}
        authorAvatar={avatarUrl}
        isSelf={isSelf}
      />
    </div>
  );
}
