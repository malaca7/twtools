import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sparkles,
  Globe,
  Save,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  Quote,
  Radio,
  Share2,
  Copy,
  Check,
  Eye,
  CheckCircle2,
  Upload,
  Trash2,
  Sliders,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UniversalImageAdjusterModal } from "@/components/ui/UniversalImageAdjusterModal";
import { type SocialLinks } from "@/types/profileFeed";
import { updateUserProfile } from "@/lib/app-api";
import { errorMessage } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function PublicProfileCustomizer() {
  const { profile, user, refresh } = useAuth();
  const queryClient = useQueryClient();

  // Estados dos campos de personalização
  const [bannerUrl, setBannerUrl] = useState("");
  const [originalBannerUrl, setOriginalBannerUrl] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerAdjusterOpen, setBannerAdjusterOpen] = useState(false);
  const [pendingBannerSrc, setPendingBannerSrc] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Redes sociais
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitch, setTwitch] = useState("");
  const [youtube, setYoutube] = useState("");

  useEffect(() => {
    if (profile) {
      const banner = (profile as any).banner_url || profile.custom_theme?.banner_url || "";
      if (banner && (banner.startsWith("http://") || banner.startsWith("https://") || banner.startsWith("data:image"))) {
        setBannerUrl(banner);
      } else {
        setBannerUrl("");
      }

      const origBanner = profile.custom_theme?.original_banner_url || (profile as any).original_banner_url || banner || "";
      setOriginalBannerUrl(origBanner);

      setBio((profile as any).bio || profile.custom_theme?.bio || "");
      setCustomStatus((profile as any).custom_status || profile.custom_theme?.custom_status || "");
      setCustomUrl(profile.custom_url || profile.custom_theme?.custom_url || "");
      setPublicProfileEnabled(profile.custom_theme?.public_profile_enabled !== false);

      const social: SocialLinks = (profile as any).social_links || profile.custom_theme?.social_links || {};
      setInstagram(social.instagram || "");
      setTwitter(social.twitter || "");
      setTiktok(social.tiktok || "");
      setTwitch(social.twitch || "");
      setYoutube(social.youtube || "");
    }
  }, [profile]);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("A imagem do banner deve ter no máximo 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPendingBannerSrc(result);
      setOriginalBannerUrl(result);
      setBannerAdjusterOpen(true);
    };
    reader.readAsDataURL(file);

    if (bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

  const handleReAdjustBanner = () => {
    const source = originalBannerUrl || bannerUrl;
    if (!source) return;
    setPendingBannerSrc(source);
    setBannerAdjusterOpen(true);
  };

  const handleSaveAdjustedBanner = async (croppedBlob: Blob, croppedDataUrl: string, originalDataUrl?: string) => {
    setIsUploadingBanner(true);
    const toastId = toast.loading("Salvando e otimizando banner no estúdio...");

    try {
      const fileName = `banner_${user?.id || "user"}_${Date.now()}.png`;
      let finalCroppedUrl = croppedDataUrl;

      // 1. Tenta upload no bucket 'products'
      const { data: prodData, error: prodErr } = await supabase.storage
        .from("products")
        .upload(fileName, croppedBlob, {
          cacheControl: "31536000",
          upsert: true,
          contentType: "image/png",
        });

      if (!prodErr && prodData) {
        const { data: pubData } = supabase.storage.from("products").getPublicUrl(prodData.path);
        finalCroppedUrl = pubData.publicUrl;
      } else {
        // Fallback chat-attachments
        const { data: chatData, error: chatErr } = await supabase.storage
          .from("chat-attachments")
          .upload(fileName, croppedBlob, {
            cacheControl: "31536000",
            upsert: true,
            contentType: "image/png",
          });

        if (!chatErr && chatData) {
          const { data: pubData } = supabase.storage.from("chat-attachments").getPublicUrl(chatData.path);
          finalCroppedUrl = pubData.publicUrl;
        }
      }

      setBannerUrl(finalCroppedUrl);
      if (originalDataUrl) {
        setOriginalBannerUrl(originalDataUrl);
      }
      toast.success("Banner ajustado com sucesso! Clique em Salvar para aplicar.", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Falha ao salvar banner", { id: toastId });
    } finally {
      setIsUploadingBanner(false);
      setBannerAdjusterOpen(false);
      setPendingBannerSrc(null);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const socialLinks: SocialLinks = {
        instagram: instagram.trim().replace(/^@/, "") || undefined,
        twitter: twitter.trim().replace(/^@/, "") || undefined,
        tiktok: tiktok.trim().replace(/^@/, "") || undefined,
        twitch: twitch.trim().replace(/^@/, "") || undefined,
        youtube: youtube.trim() || undefined,
      };

      await updateUserProfile({
        nome: profile?.nome || "",
        nickname: profile?.nickname || null,
        telefone: profile?.telefone || "",
        game_id: profile?.game_id || "",
        custom_url: customUrl.trim().toLowerCase().replace(/^@/, "") || null,
        public_profile_enabled: publicProfileEnabled,
        banner_url: bannerUrl || null,
        original_banner_url: originalBannerUrl || bannerUrl || null,
        bio: bio.trim() || null,
        custom_status: customStatus.trim() || null,
        social_links: socialLinks,
      });
    },
    onSuccess: async () => {
      toast.success("Perfil público atualizado com sucesso!");
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["public-profile-details"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const activeSlug = customUrl || profile?.discord_username?.replace(/#0$/, "") || user?.id;
  const avatarUrl = profile?.discord_avatar_url || profile?.avatar_url;
  const displayName = profile?.nickname || profile?.nome || "Membro";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleOpenPublicProfile = () => {
    const cleanSlug = String(activeSlug || "").replace(/^@/, "");
    window.open(`/@${cleanSlug}`, "_blank");
  };

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanSlug = String(activeSlug || "").replace(/^@/, "");
    const link = `${origin}/@${cleanSlug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Link do perfil copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO COM LINK PÚBLICO E ATALHO DE ABERTURA */}
      <Card className="surface-card border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Personalização do Perfil Público
              </CardTitle>
              <CardDescription className="text-xs">
                Configure como outros membros da facção e visitantes verão seu perfil oficial em nova aba.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-8 px-3 text-xs gap-1.5 rounded-xl cursor-pointer"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? "Copiado!" : "Copiar Link"}</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenPublicProfile}
                className="h-8 px-3 text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Visualizar Perfil (Nova Aba)</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* PRÉVIA EM TEMPO REAL (LIVE PREVIEW) */}
      <Card className="surface-card border-primary/20 overflow-hidden shadow-md">
        <CardHeader className="py-2.5 px-4 border-b border-border/60 bg-secondary/30">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5 text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-primary" />
              Pré-visualização em Tempo Real
            </span>
            <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
              Live Preview
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* BANNER PREVIEW */}
          <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-black">
            {bannerUrl ? (
              <div className="w-full h-full relative">
                <img
                  src={bannerUrl}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-emerald-950 via-zinc-950 to-neutral-950 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.06),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.8)_0%,transparent_70%)]" />
              </div>
            )}

          </div>

          {/* DADOS DO PREVIEW */}
          <div className="p-4 relative">
            <div className="flex items-end gap-3 -mt-12 mb-3">
              <Avatar className="h-20 w-20 rounded-2xl border-3 border-card shadow-xl bg-secondary ring-1 ring-border">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
                <AvatarFallback className="bg-gradient-brand text-primary-foreground font-black text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <h4 className="font-black text-base text-foreground leading-tight truncate">
                  {displayName}
                </h4>
                <p className="text-[11px] text-muted-foreground font-mono truncate">
                  @{activeSlug ? String(activeSlug).replace(/^@/, "") : "seu-id"}
                </p>
              </div>
            </div>

            {customStatus && (
              <p className="text-xs text-primary font-medium italic mb-2">
                “{customStatus}”
              </p>
            )}

            {bio && (
              <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed bg-secondary/30 p-2.5 rounded-xl border border-border/60">
                {bio}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FORMULÁRIO DE CUSTOMIZAÇÃO */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* COLUNA 1: BANNER, STATUS E IDENTIFICADOR */}
        <div className="space-y-6">
          {/* BANNER SELECTION COM UPLOAD */}
          <Card className="surface-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Alterar Banner do Perfil
              </CardTitle>
              <CardDescription className="text-xs">
                Faça upload de uma imagem personalizada para o banner do seu perfil público.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleBannerFileChange}
                disabled={isUploadingBanner}
              />

              {bannerUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-border/80 h-32 w-full bg-black shadow-inner">
                    <img
                      src={bannerUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                      <Badge variant="outline" className="bg-background/80 text-[10px] font-mono border-emerald-500/40 text-emerald-400 backdrop-blur-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Imagem Ativa
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleReAdjustBanner}
                          className="h-7 px-2.5 text-xs rounded-lg gap-1 shadow-sm cursor-pointer bg-black/60 hover:bg-black/80 text-white border border-white/20"
                        >
                          <Sliders className="h-3 w-3 text-primary" />
                          <span>Ajustar Foto</span>
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setBannerUrl("");
                            setOriginalBannerUrl("");
                          }}
                          className="h-7 px-2.5 text-xs rounded-lg gap-1 shadow-sm cursor-pointer"
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
                      onClick={handleReAdjustBanner}
                      disabled={isUploadingBanner}
                      className="text-xs font-bold gap-1.5 rounded-xl border-primary/40 hover:bg-primary/10 text-primary cursor-pointer"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>Reajustar no Estúdio</span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isUploadingBanner}
                      className="text-xs font-bold gap-1.5 rounded-xl border border-border cursor-pointer"
                    >
                      {isUploadingBanner ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span>Trocar Imagem</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed border-border/80 hover:border-primary/60 hover:bg-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group",
                    isUploadingBanner && "opacity-60 pointer-events-none"
                  )}
                >
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    {isUploadingBanner ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    {isUploadingBanner ? "Enviando imagem do banner..." : "Clique para fazer upload da imagem do banner"}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                    Formatos: PNG, JPG, WEBP ou GIF (máx. 10MB). Proporção panorâmica recomendada: 16:9 ou 3:1.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* STATUS E IDENTIFICADOR */}
          <Card className="surface-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Status e Identificador
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Frase de Status / Destaque</Label>
                <Input
                  placeholder="ex.: Piloto de Fuga Oficial 🏎️ ou No rádio QAP 📻"
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value.slice(0, 80))}
                  maxLength={80}
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Aparece em destaque no topo do seu perfil ({customStatus.length}/80).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">URL Exclusiva do Perfil</Label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground text-xs font-mono font-bold">
                    /perfil/
                  </div>
                  <Input
                    placeholder="ex.: seu-apelido"
                    value={customUrl}
                    onChange={(e) => {
                      const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 30);
                      setCustomUrl(sanitized);
                    }}
                    className="pl-16 text-xs font-mono font-bold"
                    maxLength={30}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  De 3 a 30 caracteres (apenas letras, números, ponto, hífen e underline).
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-secondary/30">
                <div className="space-y-0.5">
                  <Label htmlFor="vis-switch" className="text-xs font-bold cursor-pointer">
                    Visibilidade Pública do Perfil
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Permitir visualização pública sem login
                  </p>
                </div>
                <Switch
                  id="vis-switch"
                  checked={publicProfileEnabled}
                  onCheckedChange={setPublicProfileEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA 2: BIO & REDES SOCIAIS */}
        <div className="space-y-6">
          {/* BIO / SOBRE MIM */}
          <Card className="surface-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Quote className="h-4 w-4 text-primary" />
                Biografia ("Sobre Mim")
              </CardTitle>
              <CardDescription className="text-xs">
                Apresente-se para os outros membros da facção e visitantes.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              <Textarea
                placeholder="Conte sobre sua história na cidade, funções de destaque na facção, especialidades ou hobbies..."
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 500))}
                className="min-h-[120px] text-xs resize-y rounded-xl leading-relaxed"
                maxLength={500}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                <span>Dica: quebras de linha são preservadas</span>
                <span>{bio.length}/500</span>
              </div>
            </CardContent>
          </Card>

          {/* REDES SOCIAIS */}
          <Card className="surface-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4 text-rose-400" />
                Redes Sociais
              </CardTitle>
              <CardDescription className="text-xs">
                Adicione suas redes sociais para exibir botões clicáveis no seu perfil.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">📸 Instagram</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground text-xs">@</span>
                  <Input
                    placeholder="usuario"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="pl-7 text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">🐦 X / Twitter</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground text-xs">@</span>
                  <Input
                    placeholder="usuario"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="pl-7 text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">🎵 TikTok</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground text-xs">@</span>
                  <Input
                    placeholder="usuario"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    className="pl-7 text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">🟣 Twitch</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground text-xs">twitch.tv/</span>
                  <Input
                    placeholder="canal"
                    value={twitch}
                    onChange={(e) => setTwitch(e.target.value)}
                    className="pl-20 text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">🔴 YouTube</Label>
                <Input
                  placeholder="@canal ou link completo"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BOTÃO DE SALVAR FLUTUANTE / FIXO */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="h-10 px-6 text-xs font-bold rounded-xl bg-gradient-brand text-primary-foreground gap-2 cursor-pointer shadow-lg hover:opacity-90"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Salvar Alterações do Perfil Público</span>
        </Button>
      </div>

      {/* ESTÚDIO PRO DE AJUSTE DE BANNER */}
      {bannerAdjusterOpen && pendingBannerSrc && (
        <UniversalImageAdjusterModal
          isOpen={bannerAdjusterOpen}
          imageSrc={pendingBannerSrc}
          title="Estúdio Pro — Ajuste de Imagem do Banner"
          description="Use os controles de zoom, arrasto, rotação, espelhamento e filtros para deixar seu banner impecável."
          aspectRatioPreset="3:1"
          onClose={() => {
            setBannerAdjusterOpen(false);
            setPendingBannerSrc(null);
          }}
          onSave={handleSaveAdjustedBanner}
        />
      )}
    </div>
  );
}
