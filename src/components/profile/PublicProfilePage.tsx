import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  Check,
  ArrowLeft,
  Shield,
  Sparkles,
  Share2,
  Globe,
  ExternalLink,
  Edit3,
  Radio,
  Calendar,
  ChevronRight,
  LogIn,
  Quote,
  MessageSquare,
  Clock,
  IdCard,
  Lock,
  Flame,
  Award,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DevBadge, CeoBadge } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { getOrCreatePrivateConversation } from "@/services/chatService";
import { supabase } from "@/integrations/supabase/client";
import { ProfileFollowButton } from "@/components/profile/ProfileFollowButton";
import { BANNER_PRESETS, type SocialLinks } from "@/types/profileFeed";
import { STREAM_PLATFORMS } from "@/types/lives";
import { PerfilPage } from "@/routes/_authenticated/perfil";
import {
  SocialPlatformsList,
  SocialPlatformsCardsGrid,
} from "@/components/profile/SocialPlatformIcons";
import { getProxiedImageUrl } from "@/services/postimagesService";
import { MemberGamificationCard } from "@/components/gamification/MemberGamificationCard";
import { MemberInsigniasCardsSection } from "@/components/gamification/MemberInsigniasCardsSection";
import { useMemberTagsMap } from "@/hooks/useMemberTags";
import { MemberTagBadge } from "@/components/ui/MemberTagBadge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { VerificationRequestModal } from "@/components/verification/VerificationRequestModal";

export interface PublicProfilePageProps {
  handleOverride?: string;
  isRootRoute?: boolean;
  onEditClick?: () => void;
  hideBackNav?: boolean;
}

export function PublicProfilePage({
  handleOverride,
  isRootRoute = false,
  onEditClick,
  hideBackNav = false,
}: PublicProfilePageProps = {}) {
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

  return (
    <PublicProfileContent
      cleanHandle={cleanHandle}
      isRootRoute={isRootRoute}
      onEditClick={onEditClick}
      hideBackNav={hideBackNav}
    />
  );
}

function PublicProfileContent({
  cleanHandle,
  isRootRoute,
  onEditClick,
  hideBackNav,
}: {
  cleanHandle: string;
  isRootRoute: boolean;
  onEditClick?: () => void;
  hideBackNav?: boolean;
}) {
  const navigate = useNavigate();
  const { user, profile: authProfile, hasPermission } = useAuth();
  const { data: members = [] } = useMembers();
  const memberTagsMap = useMemberTagsMap();

  const [copiedLink, setCopiedLink] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Determina se o visitante é o próprio dono do perfil
  const isSelf = Boolean(
    user &&
    (!cleanHandle ||
      (user.id && user.id.toLowerCase() === cleanHandle) ||
      (authProfile?.id && String(authProfile.id).toLowerCase() === cleanHandle) ||
      (authProfile?.user_id && String(authProfile.user_id).toLowerCase() === cleanHandle) ||
      (authProfile?.custom_url && authProfile.custom_url.toLowerCase() === cleanHandle) ||
      (authProfile?.discord_username && authProfile.discord_username.toLowerCase().replace(/#0$/, "") === cleanHandle) ||
      (authProfile?.game_id && String(authProfile.game_id).toLowerCase() === cleanHandle))
  );

  // 1. Busca rápida em cache local nos membros carregados
  const cachedMember = members.find((m) => {
    if (!cleanHandle) return false;
    const cUrl = (m.custom_url || m.custom_theme?.custom_url || "").toLowerCase().trim();
    const dId = (m.discord_id || "").toLowerCase().trim();
    const dUser = (m.discord_username || "").toLowerCase().replace(/#0$/, "").trim();
    const uId = (m.user_id || "").toLowerCase().trim();
    const gId = (m.game_id || "").toLowerCase().trim();
    return (
      (cUrl && cUrl === cleanHandle) ||
      (dId && dId === cleanHandle) ||
      (dUser && dUser === cleanHandle) ||
      (uId && uId === cleanHandle) ||
      (gId && gId === cleanHandle)
    );
  });

  // 2. Consulta direta indexada e ultra-rápida no Supabase (não depende de auth)
  const { data: dbProfile, isLoading: isDbLoading } = useQuery({
    queryKey: ["public-member-direct", cleanHandle],
    queryFn: async () => {
      if (!cleanHandle) return null;

      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanHandle);
        let orQuery = `custom_url.ilike.${cleanHandle},discord_username.ilike.${cleanHandle}#0,discord_username.ilike.${cleanHandle},discord_id.eq.${cleanHandle},game_id.eq.${cleanHandle}`;
        if (isUuid) {
          orQuery += `,user_id.eq.${cleanHandle},id.eq.${cleanHandle}`;
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

          return {
            ...directData,
            nivel: roleData?.nivel || (directData.is_developer || directData.is_ceo ? "01" : "novato"),
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

          return {
            ...jsonFallback,
            nivel: roleData?.nivel || (jsonFallback.is_developer || jsonFallback.is_ceo ? "01" : "novato"),
          };
        }
      } catch (err) {
        console.warn("Erro na busca direta do perfil:", err);
      }

      return null;
    },
    staleTime: 1000 * 15,
  });

  const baseData = dbProfile || cachedMember;
  const memberData = isSelf && authProfile
    ? { ...(baseData || {}), ...authProfile, custom_theme: { ...(baseData?.custom_theme || {}), ...(authProfile.custom_theme || {}) } }
    : baseData;
  const userId = memberData?.user_id || (isSelf ? user?.id : undefined);

  const isTargetLoading = !isSelf && !cachedMember && isDbLoading;

  if (isTargetLoading) {
    return (
      <div className="mx-auto max-w-4xl py-24 flex flex-col items-center justify-center space-y-4 animate-in fade-in-50">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent shadow-lg shadow-primary/20" />
        <p className="text-xs text-muted-foreground font-mono font-medium tracking-wider">
          Carregando credenciais do integrante...
        </p>
      </div>
    );
  }

  if (!memberData) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-5 animate-in fade-in-50 duration-200">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-secondary/80 border border-border/80 flex items-center justify-center shadow-xl">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-foreground">Perfil não encontrado</h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Nenhum integrante da facção localizado com o identificador{" "}
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
                <span>Ver Todos os Integrantes</span>
              </Button>
            </Link>
          ) : (
            <Link to="/">
              <Button
                type="button"
                size="sm"
                className="text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground cursor-pointer shadow-md"
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
            O integrante <span className="font-bold text-foreground">{memberData.nickname || memberData.nome}</span> optou por restringir a visualização deste perfil apenas para membros autenticados no painel do grupo.
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

  const currentNivel = ((memberData as any).nivel || cachedMember?.nivel || "novato") as AppLevel;
  // Foto sempre sincronizada do Discord com fallback seguro
  const avatarUrl = memberData.discord_avatar_url || memberData.avatar_url;
  const displayName = memberData.nickname || memberData.nome || "Membro";
  const initials = displayName.slice(0, 2).toUpperCase();
  const activeSlug = memberData.custom_url || memberData.custom_theme?.custom_url || memberData.discord_username?.replace(/#0$/, "") || memberData.user_id;

  const rawBanner =
    memberData?.banner_url ||
    memberData?.custom_theme?.banner_url ||
    (isSelf ? (authProfile as any)?.banner_url || authProfile?.custom_theme?.banner_url : null);
  const bannerValue = (rawBanner && typeof rawBanner === "string" && rawBanner.trim() ? rawBanner.trim() : "tw_classic") as string;
  const bio = (memberData.bio || memberData.custom_theme?.bio || "") as string;
  const customStatus = (memberData.custom_status || memberData.custom_theme?.custom_status || "") as string;
  const socialLinks: SocialLinks = (memberData.social_links || memberData.custom_theme?.social_links || {}) as SocialLinks;
  const streamAccounts = ((memberData as any).member_stream_accounts || []) as any[];

  const isCustomImageBanner =
    Boolean(bannerValue) &&
    (bannerValue.startsWith("http://") ||
      bannerValue.startsWith("https://") ||
      bannerValue.startsWith("data:image") ||
      bannerValue.startsWith("/"));
  const isPresetBanner = !isCustomImageBanner;
  const matchedPreset = BANNER_PRESETS.find((p) => p.id === bannerValue) || BANNER_PRESETS[0];

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanSlug = String(activeSlug || "").replace(/^(@|%40)/i, "");
    const link = `${origin}/perfil/${cleanSlug}`;
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

  // Cálculo de tempo de casa
  const joinedDateFormatted = memberData.data_entrada
    ? new Date(memberData.data_entrada).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 animate-in fade-in-50 duration-200">
      {/* BOTÃO VOLTAR / BREADCRUMBS */}
      {!hideBackNav && (
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
            <span className="text-muted-foreground">perfil</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-bold truncate max-w-[160px]">{cleanHandle || activeSlug}</span>
          </div>
        </div>
      )}

      {/* HERO CARD MINIMALISTA & HIGH-TECH COM BANNER */}
      <div className="relative rounded-3xl border border-white/10 bg-card/80 backdrop-blur-xl overflow-hidden shadow-2xl">
        {/* BANNER SUPERIOR */}
        <div className="h-52 sm:h-64 md:h-72 w-full relative overflow-hidden bg-black/80 border-b border-white/10">
          {isPresetBanner ? (
            <div className={cn("w-full h-full bg-gradient-to-r relative", matchedPreset.gradient)}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,transparent_65%)]" />
            </div>
          ) : (
            <div className="w-full h-full relative group/banner">
              <img
                src={getProxiedImageUrl(bannerValue)}
                alt={`Banner de ${displayName}`}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover/banner:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).onerror = null;
                  (e.currentTarget as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/30" />
            </div>
          )}

          {/* BADGES NO TOPO DIREITO DO BANNER */}
          <div className="absolute top-3.5 right-3.5 flex flex-wrap items-center gap-2">
            {isSelf && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold gap-1.5 backdrop-blur-md shadow-lg shadow-emerald-500/10">
                <Sparkles className="h-3 w-3" />
                <span>Seu Perfil Oficial</span>
              </Badge>
            )}

            {Boolean(memberData.is_ceo || memberData.custom_theme?.is_ceo) && (
              <CeoBadge size="md" />
            )}

            {Boolean(memberData.is_developer) && (
              <DevBadge size="md" />
            )}

            <Badge
              variant="outline"
              className={cn("text-xs uppercase font-mono font-black backdrop-blur-md shadow-lg", levelBadgeClass(currentNivel))}
            >
              {LEVEL_LABEL[currentNivel] || currentNivel}
            </Badge>
          </div>
        </div>

        {/* INFORMAÇÕES PRINCIPAIS & AVATAR */}
        <div className="px-5 sm:px-8 pb-7 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-18 sm:-mt-22 mb-4">
            {/* AVATAR COM ANEL DE STATUS TECNOLÓGICO */}
            <div className="relative inline-block self-start">
              <Avatar className="h-32 w-32 sm:h-36 sm:w-36 rounded-3xl border-4 border-card shadow-2xl bg-secondary ring-2 ring-primary/40">
                {avatarUrl && (
                  <AvatarImage
                    src={getProxiedImageUrl(avatarUrl)}
                    alt={displayName}
                    className="object-cover"
                  />
                )}
                <AvatarFallback className="bg-gradient-brand text-primary-foreground font-black text-3xl sm:text-4xl rounded-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Selo Discord Sincronizado */}
              <div
                className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-xl bg-[#5865F2] border-2 border-card flex items-center justify-center text-white shadow-md"
                title="Foto sincronizada e atualizada pelo Discord"
              >
                <Lock className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* BOTÕES DE AÇÃO DO VISITANTE */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-10 px-3.5 text-xs font-bold border-white/10 hover:bg-secondary/80 rounded-xl gap-1.5 cursor-pointer backdrop-blur-md shadow-xs transition-all"
                title="Copiar link público do perfil"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                <span>{copiedLink ? "Copiado!" : "Compartilhar"}</span>
              </Button>

              {!isSelf && user && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="h-10 px-3.5 text-xs font-bold border-white/10 hover:bg-secondary/80 text-foreground rounded-xl gap-1.5 cursor-pointer backdrop-blur-md shadow-xs transition-all"
                  title={`Conversar com ${displayName}`}
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>Mensagem</span>
                </Button>
              )}

              {isSelf && !memberData.is_verified && hasPermission("verification.view_page") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="h-10 px-3.5 text-xs font-bold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/15 rounded-xl gap-1.5 cursor-pointer backdrop-blur-md shadow-xs transition-all"
                  title="Solicitar verificação de conta oficial"
                >
                  <BadgeCheck className="h-4 w-4" />
                  <span>Solicitar Selo</span>
                </Button>
              )}

              {isSelf ? (
                onEditClick ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={onEditClick}
                    className="h-10 px-4 text-xs font-bold bg-gradient-brand text-primary-foreground hover:opacity-90 rounded-xl gap-1.5 cursor-pointer shadow-lg shadow-primary/20 transition-all"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Editar Meu Perfil</span>
                  </Button>
                ) : (
                  <Link to="/perfil">
                    <Button
                      type="button"
                      size="sm"
                      className="h-10 px-4 text-xs font-bold bg-gradient-brand text-primary-foreground hover:opacity-90 rounded-xl gap-1.5 cursor-pointer shadow-lg shadow-primary/20 transition-all"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Personalizar Perfil</span>
                    </Button>
                  </Link>
                )
              ) : !user ? (
                <Link to="/">
                  <Button
                    type="button"
                    size="sm"
                    className="h-10 px-4 text-xs font-bold bg-gradient-brand text-primary-foreground hover:opacity-90 rounded-xl gap-1.5 cursor-pointer shadow-lg shadow-primary/20 transition-all"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Entrar no Painel</span>
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          {/* NOMES E TAGLINE */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {displayName}
              </h1>

              <VerifiedBadge
                isVerified={Boolean(memberData.is_verified || (memberData as any).verified)}
                size="md"
              />

              {memberData.nickname && memberData.nome && memberData.nickname !== memberData.nome && (
                <span className="text-xs text-muted-foreground font-medium">
                  ({memberData.nome})
                </span>
              )}
            </div>

            {/* FRASE DE STATUS PERSONALIZADA COM VISUAL CYBER HUD */}
            {customStatus && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium italic">
                <Quote className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span>“{customStatus}”</span>
              </div>
            )}

            {/* TAGS DO INTEGRANTE */}
            {(() => {
              const tags = memberTagsMap[userId] || memberTagsMap[memberData.user_id] || memberTagsMap[memberData.id] || [];
              if (tags.length === 0) return null;
              return (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {tags.map((tag) => (
                    <MemberTagBadge key={tag.id} tag={tag} size="sm" showIcon />
                  ))}
                </div>
              );
            })()}

            {/* IDENTIFICADORES & CHIPS HUD */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-mono bg-secondary/70 border border-white/5 px-3 py-1 rounded-xl text-xs text-foreground/90">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span>@{String(activeSlug || "").replace(/^(@|%40)/i, "")}</span>
              </div>

              {memberData.game_id && (
                <div className="flex items-center gap-1.5 font-mono bg-secondary/70 border border-white/5 px-3 py-1 rounded-xl text-xs text-foreground/90">
                  <IdCard className="h-3.5 w-3.5 text-emerald-400" />
                  <span>ID: <strong className="text-foreground">{memberData.game_id}</strong></span>
                </div>
              )}

              {joinedDateFormatted && (
                <div className="flex items-center gap-1.5 font-mono bg-secondary/70 border border-white/5 px-3 py-1 rounded-xl text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Desde {joinedDateFormatted}</span>
                </div>
              )}
            </div>

            {/* BARRA DE AÇÃO: SISTEMA DE SEGUIR & REDES SOCIAIS PROEMINENTES */}
            <div className="pt-4 border-t border-border/50 mt-4 flex flex-wrap items-center justify-between gap-4">
              {/* Sistema de seguir com modal interativo de seguidores/seguindo */}
              <ProfileFollowButton
                targetUserId={userId}
                targetName={displayName}
                isSelf={isSelf}
              />

              {/* Botões Aumentados de Redes Sociais no Topo */}
              <SocialPlatformsList socialLinks={socialLinks} size="lg" />
            </div>
          </div>
        </div>
      </div>

      {/* GAMIFICAÇÃO, XP & INSÍGNIAS DO MEMBRO */}
      <MemberGamificationCard
        userId={userId}
        totalXp={memberData.xp || 0}
        starsRating={memberData.stars_rating}
        starsCount={memberData.stars_count}
        isPublic={true}
        showInsignias={false}
      />

      {/* SEÇÃO PRINCIPAL DE INFORMAÇÕES DA FICHA TÉCNICA */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* CARD 1: SOBRE MIM / BIOGRAFIA */}
        <Card className={cn("surface-card border border-white/5 bg-card/70 backdrop-blur-md shadow-xl", bio ? "md:col-span-2" : "md:col-span-3")}>
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Quote className="h-4 w-4 text-primary" />
              <span>Sobre Mim</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs leading-relaxed text-foreground/80">
            {bio ? (
              <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{bio}</p>
            ) : (
              <p className="text-muted-foreground italic">
                {isSelf
                  ? "Você ainda não adicionou uma biografia. Clique em 'Personalizar Perfil' para contar mais sobre você e sua trajetória!"
                  : "Este integrante ainda não adicionou uma descrição ao seu perfil oficial."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* CARD 2: FICHA OFICIAL DA FACÇÃO */}
        <Card className="surface-card border border-white/5 bg-card/70 backdrop-blur-md shadow-xl">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Credenciais da Facção</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Organização:</span>
              <span className="font-bold text-foreground font-mono">Twin Wheels</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Patente / Nível:</span>
              <Badge variant="outline" className={cn("text-[10px] uppercase font-mono font-bold py-0", levelBadgeClass(currentNivel))}>
                {LEVEL_LABEL[currentNivel] || currentNivel}
              </Badge>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">ID do Personagem:</span>
              <span className="font-bold text-primary font-mono">{memberData.game_id || "Não informado"}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Status Operacional:</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold py-0">
                Ativo
              </Badge>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground">Foto Oficial:</span>
              <span className="text-[11px] text-[#5865F2] font-semibold flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Discord Sincronizado
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO DEDICADA: QUADRO DE CONDECORAÇÕES & INSÍGNIAS OFICIAIS */}
      <MemberInsigniasCardsSection
        userId={userId}
        member={{ user_id: userId, nome: displayName, nickname: displayName, avatar_url: avatarUrl }}
        isSelf={isSelf}
      />

      {/* SEÇÃO DE REDES SOCIAIS & TRANSMISSÕES AO VIVO EM DESTAQUE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              <span>Conexões & Redes Sociais</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Canais oficiais e perfis externos do integrante
            </p>
          </div>
        </div>

        {/* CANAIS DE TRANSMISSÃO AO VIVO (SE HOUVER) */}
        {streamAccounts.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-rose-400" />
              <span>Canais de Live & Transmissões</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {streamAccounts.map((acc: any) => {
                const pMeta = STREAM_PLATFORMS[acc.platform as keyof typeof STREAM_PLATFORMS] || STREAM_PLATFORMS.twitch;
                return (
                  <a
                    key={acc.id}
                    href={acc.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md hover:bg-secondary/40 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-secondary/80 flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                        <Radio className="h-5 w-5 text-rose-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] font-mono uppercase font-bold py-0", pMeta.badgeBg, pMeta.badgeColor, pMeta.borderColor)}
                          >
                            {pMeta.name}
                          </Badge>
                        </div>
                        <p className="font-bold text-xs truncate mt-0.5 group-hover:text-primary transition-colors">
                          @{acc.channel_name}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* GRID DE CARDS GRANDES DE REDES SOCIAIS */}
        {Object.keys(socialLinks).some((k) => Boolean((socialLinks as any)[k])) ? (
          <SocialPlatformsCardsGrid socialLinks={socialLinks} />
        ) : (
          <Card className="surface-card p-6 text-center border-dashed border-border/60">
            <p className="text-xs text-muted-foreground italic">
              {isSelf
                ? "Você ainda não adicionou nenhuma rede social. Acesse 'Personalizar Perfil' para vincular Instagram, YouTube, Twitch, Discord e outras!"
                : "Nenhuma rede social configurada por este integrante."}
            </p>
          </Card>
        )}
      </div>

      <VerificationRequestModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
}
