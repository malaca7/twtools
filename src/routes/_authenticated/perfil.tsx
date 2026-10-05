import { useState, useEffect, useRef } from "react";
import { createFileRoute, useNavigate, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User,
  Phone,
  IdCard,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  Palette,
  Sparkles,
  RefreshCw,
  Globe,
  Copy,
  Check,
  ExternalLink,
  AtSign,
  Upload,
  Trash2,
  Image as ImageIcon,
  Quote,
  Radio,
  Sliders,
  Camera,
  ShieldAlert,
  Ban,
  AlertTriangle,
  Clock,
  Eye,
  Edit3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile } from "@/lib/app-api";
import { errorMessage, formatPhone } from "@/lib/format";
import { getLevelLabel, levelBadgeClass } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useMembers } from "@/hooks/useData";
import { type SocialLinks } from "@/types/profileFeed";
import { UserAppearanceSettings } from "@/components/profile/UserAppearanceSettings";
import { UniversalImageAdjusterModal } from "@/components/ui/UniversalImageAdjusterModal";
import { SocialNetworksConfigCard } from "@/components/profile/SocialNetworksConfigCard";
import { getProxiedImageUrl } from "@/services/postimagesService";
import { MemberGamificationCard } from "@/components/gamification/MemberGamificationCard";
import { MemberTagBadge } from "@/components/ui/MemberTagBadge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { VerificationRequestModal } from "@/components/verification/VerificationRequestModal";
import { PublicProfilePage } from "@/components/profile/PublicProfilePage";
import { BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilWrapper,
});

function PerfilWrapper() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) {
    return <Outlet />;
  }
  return <PerfilPage />;
}

// Upload helper para buckets do Supabase com fallback seguro
async function uploadImageFile(file: File, prefix: string, userId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const cleanExt = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? ext : "png";
  const fileName = `${prefix}_${userId}_${Date.now()}.${cleanExt}`;

  const { uploadImageToPostimages } = await import("@/services/postimagesService");
  const cdnUrl = await uploadImageToPostimages(file, {
    filename: fileName,
    maxDimension: prefix.includes("banner") ? 1920 : 600,
    quality: 0.85,
  });
  return cdnUrl;
}

export function PerfilPage({ initialTab }: { initialTab?: "perfil" | "dados" | "publico" | "aparencia" } = {}) {
  const { hasPermission } = useAuth();

  if (!hasPermission("view_profile")) {
    return <NoAccess />;
  }

  return <PerfilContent initialTab={initialTab} />;
}

function PerfilContent({ initialTab }: { initialTab?: "perfil" | "dados" | "publico" | "aparencia" } = {}) {
  const { profile, level, refresh, user, hasPermission } = useAuth();
  const { data: members = [] } = useMembers();
  const myMember = members.find((m) => m.user_id === user?.id);
  const myTags = useMyMemberTags();
  const queryClient = useQueryClient();

  // Permissões granulares do módulo de Perfil
  const canEditData = hasPermission("edit_profile_data");
  const canEditBanner = hasPermission("edit_profile_banner");
  const canEditBio = hasPermission("edit_profile_bio");
  const canEditCustomUrl = hasPermission("edit_profile_custom_url");
  const canViewAppearance = hasPermission("edit_profile_appearance");

  const readInitialTab = (): "perfil" | "aparencia" => {
    let candidate: "perfil" | "aparencia" = "perfil";
    if (initialTab && initialTab === "aparencia") {
      candidate = "aparencia";
    } else if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last === "aparencia" || last === "tema" || last === "estilo") candidate = "aparencia";
      else if (last === "dados" || last === "meu-perfil" || last === "perfil") candidate = "perfil";
      else {
        const q = new URLSearchParams(window.location.search).get("tab");
        if (q === "aparencia" || q === "tema" || q === "estilo") candidate = "aparencia";
      }
    }

    if (candidate === "aparencia" && !canViewAppearance) return "perfil";
    return candidate;
  };

  const [activeTab, setActiveTabState] = useState<"perfil" | "aparencia">(readInitialTab);

  useEffect(() => {
    const nextTab = readInitialTab();
    setActiveTabState(nextTab);
  }, [initialTab, canViewAppearance]);

  const setActiveTab = (newTab: "perfil" | "aparencia") => {
    if (newTab === "aparencia" && !canViewAppearance) {
      toast.error("Você não possui permissão para acessar a aba de Tema & Estilo.");
      return;
    }

    setActiveTabState(newTab);
    if (typeof window !== "undefined") {
      const targetPath = newTab === "aparencia" ? "/perfil/aparencia" : "/perfil";
      window.history.replaceState(null, "", targetPath);
    }
  };

  // Modal de Verificação
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Dados Básicos do Jogador
  const [nome, setNome] = useState("");
  const [nickname, setNickname] = useState("");
  const [telefone, setTelefone] = useState("");
  const [gameId, setGameId] = useState("");

  // Perfil Público & Banner
  const [bannerUrl, setBannerUrl] = useState("");
  const [originalBannerUrl, setOriginalBannerUrl] = useState("");
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Redes Sociais
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  // Estado do Studio Universal de Ajuste de Imagem
  const [adjusterConfig, setAdjusterConfig] = useState<{
    isOpen: boolean;
    type: "banner" | "avatar";
    file: File | null;
    url: string | null;
    originalUrl: string | null;
    cropShape: "round" | "rect";
    defaultAspectRatio?: number;
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: "banner",
    file: null,
    url: null,
    originalUrl: null,
    cropShape: "rect",
    defaultAspectRatio: 16 / 9,
    title: "Studio: Ajustar Imagem",
    description: "Enquadre e ajuste com máxima precisão antes de salvar.",
  });
  const [isSavingAdjustedImage, setIsSavingAdjustedImage] = useState(false);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || "");
      setNickname(profile.nickname || "");
      setTelefone(formatPhone(profile.telefone || ""));
      setGameId(profile.game_id || "");

      const b = (profile as any).banner_url || profile.custom_theme?.banner_url || "";
      if (b && (b.startsWith("http://") || b.startsWith("https://") || b.startsWith("data:image"))) {
        setBannerUrl(b);
      } else {
        setBannerUrl("");
      }

      const origB = profile.custom_theme?.original_banner_url || "";
      setOriginalBannerUrl(origB);

      setBio((profile as any).bio || profile.custom_theme?.bio || "");
      setCustomStatus((profile as any).custom_status || profile.custom_theme?.custom_status || "");
      setCustomUrl(profile.custom_url || profile.custom_theme?.custom_url || "");
      setPublicProfileEnabled(profile.custom_theme?.public_profile_enabled !== false);

      const social: SocialLinks = (profile as any).social_links || profile.custom_theme?.social_links || {};
      setSocialLinks(social);
    }
  }, [profile]);

  // Dispara o Studio ao selecionar novo arquivo de Banner
  const handleBannerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem selecionada deve ter no máximo 15MB.");
      return;
    }

    setAdjusterConfig({
      isOpen: true,
      type: "banner",
      file,
      url: null,
      originalUrl: null,
      cropShape: "rect",
      defaultAspectRatio: 16 / 9,
      title: "Studio Pro: Ajustar Banner do Perfil",
      description: "Ajuste o enquadramento panorâmico, rotação e filtros de cor para o seu perfil.",
    });

    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  // Reajustar o Banner atual a partir da imagem original preservada
  const handleReadjustCurrentBanner = () => {
    const activeBn = bannerUrl || (profile as any)?.banner_url || profile?.custom_theme?.banner_url;
    if (!activeBn) return;
    setAdjusterConfig({
      isOpen: true,
      type: "banner",
      file: null,
      url: getProxiedImageUrl(activeBn),
      originalUrl: getProxiedImageUrl(originalBannerUrl || (profile as any)?.original_banner_url || profile?.custom_theme?.original_banner_url || activeBn),
      cropShape: "rect",
      defaultAspectRatio: 16 / 9,
      title: "Studio Pro: Reajustar Banner do Perfil",
      description: "Reajustando sobre a imagem original com qualidade total preservada.",
    });
  };

  // Callback de salvamento do Studio Universal de Banner
  const handleSaveAdjustedImage = async (croppedFile: File, originalSource?: File | string) => {
    setIsSavingAdjustedImage(true);
    const toastId = toast.loading("Processando e salvando banner com qualidade máxima...");

    try {
      const uid = user?.id || "user";
      const croppedUrl = await uploadImageFile(croppedFile, "banner_crop", uid);

      const origUrl = typeof originalSource === "string" ? originalSource : croppedUrl;

      setBannerUrl(croppedUrl);
      if (origUrl) setOriginalBannerUrl(origUrl);

      // Atualiza imediatamente o perfil com o novo banner
      await updateUserProfile({
        nome: nome || profile?.nome || "Membro",
        telefone: telefone || profile?.telefone || "000-000",
        game_id: gameId || profile?.game_id || "0",
        banner_url: croppedUrl,
        original_banner_url: origUrl || originalBannerUrl || croppedUrl,
        avatar_url: profile?.discord_avatar_url || profile?.avatar_url || null,
        custom_theme: {
          ...(profile?.custom_theme || {}),
          banner_url: croppedUrl,
          original_banner_url: origUrl || originalBannerUrl || croppedUrl,
        },
      } as any);
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Banner do perfil atualizado e salvo com sucesso!", { id: toastId });

      setAdjusterConfig((prev) => ({ ...prev, isOpen: false }));
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar a imagem ajustada.", { id: toastId });
    } finally {
      setIsSavingAdjustedImage(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("O Nome do Jogador é obrigatório.");
      if (!telefone.trim()) throw new Error("O Telefone em jogo é obrigatório.");
      if (!gameId.trim()) throw new Error("O ID do Personagem em jogo é obrigatório.");

      await updateUserProfile({
        nome,
        nickname: nickname.trim() || null,
        telefone,
        game_id: gameId,
        custom_url: customUrl.trim().toLowerCase().replace(/^@/, "") || null,
        public_profile_enabled: publicProfileEnabled,
        banner_url: bannerUrl || null,
        original_banner_url: originalBannerUrl || null,
        avatar_url: profile?.discord_avatar_url || profile?.avatar_url || null,
        bio: bio.trim() || null,
        custom_status: customStatus.trim() || null,
        social_links: socialLinks,
        custom_theme: {
          ...(profile?.custom_theme || {}),
          banner_url: bannerUrl || null,
          original_banner_url: originalBannerUrl || null,
        },
      } as any);
    },
    onSuccess: async () => {
      toast.success("Perfil atualizado com sucesso!");
      setIsEditingProfile(false);
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["public-profile-details"] });
      void queryClient.invalidateQueries({ queryKey: ["public-member-direct"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const [isSyncingAvatar, setIsSyncingAvatar] = useState(false);

  const handleManualSyncAvatar = async () => {
    try {
      setIsSyncingAvatar(true);
      try {
        await fetch("https://twin.discloud.app/sync", { mode: "no-cors" });
      } catch {}
      await new Promise((r) => setTimeout(r, 600));
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Foto e dados sincronizados com o Discord!");
    } catch {
      toast.error("Falha ao sincronizar foto com o Discord.");
    } finally {
      setIsSyncingAvatar(false);
    }
  };

  const currentSlug = String(customUrl || profile?.discord_username?.replace(/#0$/, "") || user?.id || "").replace(/^@/, "");
  const activeAvatar = profile?.discord_avatar_url || profile?.avatar_url;
  const activeBanner = bannerUrl || (profile as any)?.banner_url || profile?.custom_theme?.banner_url;
  const initials = (nickname || nome || "P").slice(0, 2).toUpperCase();

  const handleOpenPublicProfile = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    window.open(`${origin}/@${currentSlug}`, "_blank");
  };

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/@${currentSlug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Link do perfil público copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie seus dados em jogo, personalize seu banner público e utilize o Studio Universal para ajustar suas fotos."
        actions={
          level ? (
            <Badge variant="outline" className={cn("text-xs", levelBadgeClass(level))}>
              Cargo: {getLevelLabel(level)}
            </Badge>
          ) : null
        }
      />

      {/* MODAL UNIVERSAL PRO DE AJUSTE DE IMAGEM */}
      <UniversalImageAdjusterModal
        isOpen={adjusterConfig.isOpen}
        onClose={() => setAdjusterConfig((prev) => ({ ...prev, isOpen: false }))}
        imageFile={adjusterConfig.file}
        imageUrl={adjusterConfig.url}
        originalImageUrl={adjusterConfig.originalUrl}
        cropShape={adjusterConfig.cropShape}
        defaultAspectRatio={adjusterConfig.defaultAspectRatio}
        title={adjusterConfig.title}
        description={adjusterConfig.description}
        onCropSave={handleSaveAdjustedImage}
        isSaving={isSavingAdjustedImage}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <TabsList
            className={cn(
              "grid w-full h-10 p-1 bg-secondary/60 rounded-xl border border-border/60",
              canViewAppearance ? "grid-cols-2 max-w-md" : "grid-cols-1 max-w-xs"
            )}
          >
            <TabsTrigger value="perfil" className="text-xs font-bold gap-2 rounded-lg cursor-pointer">
              <User className="h-4 w-4 text-primary" />
              <span>Meu Perfil</span>
            </TabsTrigger>
            {canViewAppearance && (
              <TabsTrigger value="aparencia" className="text-xs font-bold gap-2 rounded-lg cursor-pointer">
                <Palette className="h-4 w-4 text-purple-400" />
                <span>Tema & Estilo</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* ABA UNIFICADA: MEU PERFIL */}
        <TabsContent value="perfil" className="space-y-6 animate-in fade-in-50 duration-200">
          {!isEditingProfile ? (
            <div className="space-y-6">
              {/* BARRA DE AÇÕES SUPERIOR DA PRÉVIA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-background/90 to-secondary/40 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 shadow-inner">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">Prévia do Perfil Público</h3>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono">
                        ✨ Ao Vivo
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Esta é a visualização oficial e interativa do seu perfil para outros membros e visitantes.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-9 px-3 text-xs font-bold border-border/80 hover:bg-secondary rounded-xl gap-1.5 cursor-pointer shadow-xs"
                    title="Copiar link público direto"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Copiado!" : "Copiar Link"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenPublicProfile}
                    className="h-9 px-3 text-xs font-bold border-primary/30 text-primary hover:bg-primary/10 rounded-xl gap-1.5 cursor-pointer"
                    title="Abrir em nova aba do navegador"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Nova Aba</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="h-9 px-4 text-xs font-bold bg-gradient-brand text-primary-foreground hover:opacity-90 rounded-xl gap-2 cursor-pointer shadow-md shadow-primary/25 transition-all hover:scale-[1.02]"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Editar Meu Perfil</span>
                  </Button>
                </div>
              </div>

              {/* PRÉVIA EMBARCADA DO PERFIL PÚBLICO */}
              <PublicProfilePage
                handleOverride={currentSlug}
                hideBackNav={true}
                onEditClick={() => setIsEditingProfile(true)}
              />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* BARRA SUPERIOR DO MODO DE EDIÇÃO */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-background/90 to-secondary/40 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                    <Edit3 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">Modo de Edição do Perfil</h3>
                      <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px] font-mono">
                        ✏️ Editando
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Altere seus dados, banner e redes sociais. Clique em salvar para atualizar seu perfil público.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(false)}
                    className="h-9 px-3.5 text-xs font-bold border-border/80 hover:bg-secondary rounded-xl gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    <span>Voltar para Prévia</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="h-9 px-4 text-xs font-bold bg-gradient-brand text-primary-foreground hover:opacity-90 rounded-xl gap-2 cursor-pointer shadow-md shadow-primary/25"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>Salvar Alterações</span>
                  </Button>
                </div>
              </div>

              {/* GAMIFICAÇÃO, XP, NÍVEL E INSÍGNIAS DO MEMBRO */}
              <MemberGamificationCard
                userId={user?.id || ""}
                totalXp={profile?.xp || 0}
                starsRating={profile?.stars_rating}
                starsCount={profile?.stars_count}
              />

              <div className="grid gap-6 md:grid-cols-3">
            {/* COLUNA ESQUERDA: RESUMO DO USUÁRIO & FOTO COM STUDIO */}
            <Card className="surface-card md:col-span-1 h-fit overflow-hidden p-0 border border-border/80 shadow-md">
              {/* BANNER DE CABEÇALHO DO PERFIL NO CARD DE RESUMO */}
              <div
                className="relative w-full h-28 sm:h-32 bg-cover bg-center transition-all group overflow-hidden border-b border-border/50"
                style={{
                  backgroundImage: activeBanner
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6)), url("${getProxiedImageUrl(activeBanner)}")`
                    : "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
                  backgroundColor: "#18181b",
                }}
              >
                {/* Botão de alterar banner direto pelo card */}
                {canEditBanner && (
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-white/90 hover:text-white flex items-center gap-1.5 text-[10px] font-bold backdrop-blur-md border border-white/10 transition-all cursor-pointer opacity-90 group-hover:opacity-100 shadow-md"
                    title="Alterar imagem do banner"
                  >
                    <Camera className="h-3 w-3 text-emerald-400" />
                    <span>Banner</span>
                  </button>
                )}
              </div>

              <CardContent className="p-6 pt-0 flex flex-col items-center text-center space-y-4 relative">
                {/* AVATAR SINCRONIZADO COM O DISCORD */}
                <div className="relative group -mt-12">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-2xl ring-2 ring-[#5865F2]/50 bg-background">
                    <AvatarImage src={getProxiedImageUrl(activeAvatar) || undefined} alt={nome} className="object-cover" />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {nickname || nome || "Jogador"}
                  </h3>
                  {nickname ? (
                    <p className="text-xs text-muted-foreground">{nome}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                  <Badge variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold">
                    Membro Ativo
                  </Badge>
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] text-[10px] font-mono font-bold shadow-xs" title="A foto de perfil é gerenciada e sincronizada diretamente pelo seu Discord">
                    <Lock className="h-3 w-3" />
                    <span>Foto do Discord</span>
                  </div>
                </div>

                {myTags.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {myTags.map((tag) => (
                      <MemberTagBadge key={tag.id} tag={tag} size="sm" showIcon />
                    ))}
                  </div>
                )}

                {/* STATUS DE VERIFICAÇÃO */}
                <div className="w-full p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 space-y-2 text-left">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <VerifiedBadge isVerified={profile?.is_verified} size="sm" />
                      <span className="text-xs font-bold text-sky-200 truncate">
                        {profile?.is_verified ? "Membro Verificado" : "Selo Oficial"}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] font-mono px-1.5 py-0",
                        profile?.is_verified
                          ? "border-emerald-500/50 text-emerald-300 bg-emerald-500/10"
                          : "border-sky-500/40 text-sky-300 bg-sky-500/10"
                      )}
                    >
                      {profile?.is_verified ? "Ativo" : "Disponível"}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="w-full text-xs font-bold border-sky-500/40 text-sky-300 hover:bg-sky-500/20 gap-1.5 h-8 rounded-lg cursor-pointer"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    <span>{profile?.is_verified ? "Ver Detalhes do Selo" : "Solicitar Verificação"}</span>
                  </Button>
                </div>

                <div className="w-full pt-3 border-t border-border/50 space-y-2 text-xs text-left">
                  <p className="text-muted-foreground">
                    ID em Jogo: <span className="font-bold text-foreground">{gameId || "N/A"}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Telefone: <span className="font-bold text-foreground">{telefone || "N/A"}</span>
                  </p>
                  <p className="text-muted-foreground truncate">
                    Link Direto:{" "}
                    <span className="font-mono font-bold text-primary">
                      /@{currentSlug}
                    </span>
                  </p>
                </div>

                <div className="w-full space-y-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleManualSyncAvatar}
                    disabled={isSyncingAvatar}
                    className="w-full text-xs font-bold border-[#5865F2]/40 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] hover:text-[#5865F2] gap-2 cursor-pointer rounded-xl h-9 transition-all shadow-xs"
                    title="Atualizar foto e dados diretamente do seu Discord"
                  >
                    {isSyncingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    <span>Sincronizar Foto do Discord</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenPublicProfile}
                    className="w-full text-xs font-bold border-primary/40 hover:bg-primary/10 text-primary gap-1.5 cursor-pointer rounded-xl h-9"
                    title="Abrir perfil público em nova aba"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Ver Perfil Público</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* COLUNA DIREITA: FORMULÁRIO COMPLETO */}
            <div className="md:col-span-2 space-y-6">
              {/* CARD 1: DADOS DO JOGADOR EM JOGO */}
              <Card className="surface-card">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Dados do Jogador (Em Jogo)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Suas informações oficiais no servidor de GTA RP.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold">
                        Nome do Jogador <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="Seu nome em jogo (ex.: Ricardo Silva)"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="mt-1 h-9 text-xs"
                        disabled={!canEditData}
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">
                        Apelido <span className="text-muted-foreground font-normal">(Opcional)</span>
                      </Label>
                      <Input
                        placeholder="Apelido em jogo (ex.: Malaca)"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="mt-1 h-9 text-xs"
                        disabled={!canEditData}
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">
                        Telefone em Jogo (000-000) <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="Ex.: 555-019"
                        value={telefone}
                        onChange={(e) => setTelefone(formatPhone(e.target.value))}
                        className="mt-1 h-9 text-xs font-mono font-bold"
                        maxLength={7}
                        disabled={!canEditData}
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">
                        ID do Personagem / Passaporte <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        placeholder="Ex.: 1042"
                        value={gameId}
                        onChange={(e) => setGameId(e.target.value)}
                        className="mt-1 h-9 text-xs font-mono font-bold"
                        disabled={!canEditData}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: BANNER DO PERFIL COM STUDIO PRO DE AJUSTE */}
              <Card className="surface-card">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" /> Banner do Perfil Público
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                      Studio Pro Integrado
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Faça o upload de uma imagem e ajuste o enquadramento no Studio antes de salvar.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleBannerFileSelect}
                  />

                  {bannerUrl ? (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden border border-border/80 h-36 sm:h-44 w-full bg-black shadow-inner">
                        <img
                          src={getProxiedImageUrl(bannerUrl)}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).onerror = null;
                            (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                          <Badge variant="outline" className="bg-background/85 text-[10px] font-mono border-emerald-500/40 text-emerald-400 backdrop-blur-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Banner Ativo
                          </Badge>
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleReadjustCurrentBanner}
                              className="h-7 px-2.5 text-xs rounded-lg gap-1 bg-background/80 hover:bg-background border-emerald-500/40 text-emerald-400 shadow-xs cursor-pointer"
                              title="Reajustar enquadramento e filtros a partir da imagem original"
                            >
                              <Sliders className="h-3 w-3" />
                              <span>Reajustar</span>
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setBannerUrl("");
                                setOriginalBannerUrl("");
                              }}
                              className="h-7 px-2.5 text-xs rounded-lg gap-1 shadow-xs cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Remover</span>
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canEditBanner}
                          onClick={() => bannerInputRef.current?.click()}
                          className="w-full text-xs font-bold gap-1.5 rounded-xl border-primary/30 hover:bg-primary/10 text-primary cursor-pointer h-9"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Trocar Imagem</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canEditBanner}
                          onClick={handleReadjustCurrentBanner}
                          className="w-full text-xs font-bold gap-1.5 rounded-xl border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 cursor-pointer h-9"
                        >
                          <Sliders className="h-4 w-4" />
                          <span>Abrir Studio de Ajuste</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className="border-2 border-dashed border-border/80 hover:border-primary/60 hover:bg-primary/5 rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        Clique para escolher imagem e abrir o Studio Pro
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                        PNG, JPG, WEBP ou GIF (máx. 15MB). Ajuste proporções, zoom e cores antes de salvar.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CARD 3: APRESENTAÇÃO & BIOGRAFIA */}
              <Card className="surface-card">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Quote className="h-4 w-4 text-primary" /> Apresentação & Biografia
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Frase de destaque e história pessoal exibidas no seu perfil.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Frase de Status / Destaque</Label>
                    <Input
                      placeholder="ex.: Piloto de Fuga Oficial 🏎️ ou No rádio QAP 📻"
                      value={customStatus}
                      onChange={(e) => setCustomStatus(e.target.value.slice(0, 80))}
                      maxLength={80}
                      disabled={!canEditBio}
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Aparece em destaque no topo do seu perfil ({customStatus.length}/80).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Biografia ("Sobre Mim")</Label>
                    <Textarea
                      placeholder="Conte sobre sua história na cidade, funções de destaque no grupo, especialidades..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 500))}
                      className="min-h-[100px] text-xs resize-y rounded-xl leading-relaxed"
                      maxLength={500}
                      disabled={!canEditBio}
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                      <span>Quebras de linha são preservadas</span>
                      <span>{bio.length}/500</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 4: LINK PÚBLICO & VISIBILIDADE */}
              <Card className="surface-card border-primary/25 bg-primary/5">
                <CardHeader className="pb-3 border-b border-primary/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" /> Links Diretos & URL Personalizada
                    </CardTitle>
                    {customUrl ? (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono py-0.5">
                        ✨ URL Direta Ativa
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-zinc-500/40 text-muted-foreground bg-zinc-500/10 text-[10px] font-mono py-0.5">
                        Padrão (ID Discord)
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    Defina seu link exclusivo na plataforma (ex.: <span className="font-mono text-primary font-bold">/@{customUrl || "seu-nome"}</span> ou <span className="font-mono text-primary font-bold">/{customUrl || "seu-nome"}</span>).
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* PREVIEW DO LINK COM BOTÃO DE COPIAR E ABRIR EM NOVA ABA */}
                  <div className="rounded-xl border border-primary/30 bg-background/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                    <div className="min-w-0 flex items-center gap-2">
                      <AtSign className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Seu Link Direto Oficial</p>
                        <p className="font-mono font-bold text-xs text-foreground truncate">
                          {typeof window !== "undefined" ? window.location.origin : ""}/@
                          <span className="text-primary font-black">{currentSlug}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        className="h-8 px-2.5 text-xs border-primary/30 hover:bg-primary/20 text-primary gap-1.5 cursor-pointer rounded-lg"
                      >
                        {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedLink ? "Copiado!" : "Copiar Link"}</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleOpenPublicProfile}
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary gap-1.5 cursor-pointer rounded-lg"
                        title="Abrir perfil público em nova aba"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Abrir</span>
                      </Button>
                    </div>
                  </div>

                  {/* CAMPO DE DEFINIÇÃO DA URL */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Identificador Personalizado (URL do Perfil)
                    </Label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground text-xs font-mono font-bold">
                        /@
                      </div>
                      <Input
                        placeholder={profile?.discord_username ? profile.discord_username.replace(/#0$/, "") : "ex.: malaca"}
                        value={customUrl}
                        onChange={(e) => {
                          const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 30);
                          setCustomUrl(sanitized);
                        }}
                        disabled={!canEditCustomUrl}
                        className="h-9 pl-9 text-xs font-mono font-bold"
                        maxLength={30}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      ℹ️ Disponível tanto em <span className="font-mono text-foreground font-bold">/@{customUrl || "nome"}</span> quanto em <span className="font-mono text-foreground font-bold">/{customUrl || "nome"}</span> e <span className="font-mono text-foreground font-bold">/perfil/{customUrl || "nome"}</span>.
                    </p>
                  </div>

                  {/* TOGGLE DE VISIBILIDADE PÚBLICA */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/20 bg-background/80 shadow-xs">
                    <div className="space-y-0.5 pr-2">
                      <Label htmlFor="public-profile-toggle" className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        Visibilidade Pública do Perfil
                        <Badge variant="outline" className={cn("text-[9px] font-mono py-0 px-1.5", publicProfileEnabled ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-zinc-500/40 text-muted-foreground bg-zinc-500/10")}>
                          {publicProfileEnabled ? "Ativado (Público)" : "Desativado (Privado)"}
                        </Badge>
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Permite que qualquer pessoa com o link oficial visualize seu perfil sem precisar fazer login no painel.
                      </p>
                    </div>
                    <Switch
                      id="public-profile-toggle"
                      checked={publicProfileEnabled}
                      onCheckedChange={(checked) => setPublicProfileEnabled(checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* CARD 5: REDES SOCIAIS & CONTAS VINCULADAS */}
              <SocialNetworksConfigCard
                socialLinks={socialLinks}
                onChange={setSocialLinks}
              />

              {/* CARD 6: CONTA DO DISCORD VINCULADA */}
              <Card className="surface-card border-indigo-500/20 bg-indigo-500/5">
                <CardHeader className="pb-3 border-b border-indigo-500/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-indigo-400 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-indigo-400" /> Conta do Discord Vinculada
                    </CardTitle>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] flex items-center gap-1.5 py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Sincronização Ativa
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Sua foto de perfil e dados de autenticação são sincronizados com o Discord.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-lg border border-indigo-500/20 bg-background/60 p-3">
                      <p className="text-[0.65rem] uppercase font-bold text-muted-foreground">Discord Tag / Username</p>
                      <p className="font-semibold text-foreground font-mono mt-0.5">
                        {profile?.discord_username ? `@${profile.discord_username}` : "Não vinculado"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-indigo-500/20 bg-background/60 p-3">
                      <p className="text-[0.65rem] uppercase font-bold text-muted-foreground">ID do Discord</p>
                      <p className="font-semibold text-foreground font-mono mt-0.5">
                        {profile?.discord_id || "Não vinculado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* BOTÃO DE SALVAR GERAL */}
              <div className="pt-2">
                <Button
                  type="button"
                  className="w-full h-11 bg-gradient-brand text-primary-foreground font-bold hover:opacity-90 shadow-md cursor-pointer rounded-xl text-xs gap-2"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Alterações de Perfil
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TabsContent>

        {/* ABA 2: TEMA & ESTILO */}
        <TabsContent value="aparencia" className="space-y-6 animate-in fade-in-50 duration-200">
          <UserAppearanceSettings />
        </TabsContent>
      </Tabs>

      <VerificationRequestModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />
    </div>
  );
}
