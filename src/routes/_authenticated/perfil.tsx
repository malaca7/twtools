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
import { errorMessage, formatPhone, formatSecondsToHoursAndMinutes } from "@/lib/format";
import { getLevelLabel, levelBadgeClass } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useMembers } from "@/hooks/useData";
import { type SocialLinks } from "@/types/profileFeed";
import { UserAppearanceSettings } from "@/components/profile/UserAppearanceSettings";

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

export function PerfilPage({ initialTab }: { initialTab?: "perfil" | "dados" | "publico" | "aparencia" } = {}) {
  const { profile, level, refresh, user, hasPermission } = useAuth();
  const { data: members = [] } = useMembers();
  const myMember = members.find((m) => m.user_id === user?.id);
  const queryClient = useQueryClient();

  if (!hasPermission("view_profile")) {
    return <NoAccess />;
  }

  const readInitialTab = (): "perfil" | "aparencia" => {
    if (initialTab && initialTab === "aparencia") {
      return "aparencia";
    }
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1];
      if (last === "aparencia") return "aparencia";
      const q = new URLSearchParams(window.location.search).get("tab");
      if (q === "aparencia") return "aparencia";
    }
    return "perfil";
  };

  const [activeTab, setActiveTabState] = useState<"perfil" | "aparencia">(readInitialTab);

  useEffect(() => {
    if (initialTab === "aparencia") {
      setActiveTabState("aparencia");
    } else if (initialTab) {
      setActiveTabState("perfil");
    }
  }, [initialTab]);

  const setActiveTab = (newTab: "perfil" | "aparencia") => {
    setActiveTabState(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.pathname.startsWith("/perfil")) {
        window.history.replaceState(null, "", newTab === "aparencia" ? "/perfil/aparencia" : "/perfil");
      } else {
        url.searchParams.set("tab", newTab);
        window.history.replaceState(null, "", url.toString());
      }
    }
  };

  // Dados Básicos do Jogador
  const [nome, setNome] = useState("");
  const [nickname, setNickname] = useState("");
  const [telefone, setTelefone] = useState("");
  const [gameId, setGameId] = useState("");

  // Perfil Público & Visual
  const [bannerUrl, setBannerUrl] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Redes Sociais
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [twitch, setTwitch] = useState("");
  const [youtube, setYoutube] = useState("");

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

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("A imagem do banner deve ter no máximo 10MB.");
      return;
    }

    setIsUploadingBanner(true);
    const toastId = toast.loading("Fazendo upload da imagem do banner...");

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const cleanExt = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? ext : "png";
      const fileName = `banner_${user?.id || "user"}_${Date.now()}.${cleanExt}`;

      let finalUrl = "";

      // 1. Tenta bucket 'products'
      const { data: prodData, error: prodErr } = await supabase.storage
        .from("products")
        .upload(fileName, file, {
          cacheControl: "31536000",
          upsert: true,
          contentType: file.type || `image/${cleanExt}`,
        });

      if (!prodErr && prodData) {
        const { data: pubData } = supabase.storage.from("products").getPublicUrl(prodData.path);
        finalUrl = pubData.publicUrl;
      } else {
        // 2. Fallback para bucket 'chat-attachments'
        const { data: chatData, error: chatErr } = await supabase.storage
          .from("chat-attachments")
          .upload(fileName, file, {
            cacheControl: "31536000",
            upsert: true,
            contentType: file.type || `image/${cleanExt}`,
          });

        if (!chatErr && chatData) {
          const { data: pubData } = supabase.storage.from("chat-attachments").getPublicUrl(chatData.path);
          finalUrl = pubData.publicUrl;
        } else {
          // 3. Fallback para Base64 Data URL
          finalUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Falha ao ler o arquivo selecionado"));
            reader.readAsDataURL(file);
          });
        }
      }

      setBannerUrl(finalUrl);
      toast.success("Banner carregado com sucesso! Clique em Salvar para aplicar.", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Falha ao fazer upload da imagem do banner", { id: toastId });
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = "";
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("O Nome do Jogador é obrigatório.");
      if (!telefone.trim()) throw new Error("O Telefone em jogo é obrigatório.");
      if (!gameId.trim()) throw new Error("O ID do Personagem em jogo é obrigatório.");

      const socialLinks: SocialLinks = {
        instagram: instagram.trim().replace(/^@/, "") || undefined,
        twitter: twitter.trim().replace(/^@/, "") || undefined,
        tiktok: tiktok.trim().replace(/^@/, "") || undefined,
        twitch: twitch.trim().replace(/^@/, "") || undefined,
        youtube: youtube.trim() || undefined,
      };

      await updateUserProfile({
        nome,
        nickname: nickname.trim() || null,
        telefone,
        game_id: gameId,
        custom_url: customUrl.trim().toLowerCase().replace(/^@/, "") || null,
        public_profile_enabled: publicProfileEnabled,
        banner_url: bannerUrl || null,
        bio: bio.trim() || null,
        custom_status: customStatus.trim() || null,
        social_links: socialLinks,
      });
    },
    onSuccess: async () => {
      toast.success("Perfil atualizado com sucesso!");
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
      void queryClient.invalidateQueries({ queryKey: ["public-profile-details"] });
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

  const discordAvatar = profile?.avatar_url || profile?.discord_avatar_url;
  const initials = (nickname || nome || "P").slice(0, 2).toUpperCase();
  const currentSlug = String(customUrl || profile?.discord_username?.replace(/#0$/, "") || user?.id || "").replace(/^@/, "");

  const handleOpenPublicProfile = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    window.open(`${origin}/perfil/${currentSlug}`, "_blank");
  };

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/perfil/${currentSlug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Link do perfil público copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie seus dados em jogo, personalize seu banner público e visualize suas informações vinculadas."
        actions={
          level ? (
            <Badge variant="outline" className={cn("text-xs", levelBadgeClass(level))}>
              Cargo: {getLevelLabel(level)}
            </Badge>
          ) : null
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-10 p-1 bg-secondary/60 rounded-xl border border-border/60">
          <TabsTrigger value="perfil" className="text-xs font-bold gap-2 rounded-lg cursor-pointer">
            <User className="h-4 w-4 text-primary" />
            <span>Meu Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="text-xs font-bold gap-2 rounded-lg cursor-pointer">
            <Palette className="h-4 w-4 text-purple-400" />
            <span>Tema & Estilo</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA UNIFICADA: MEU PERFIL */}
        <TabsContent value="perfil" className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid gap-6 md:grid-cols-3">
            {/* COLUNA ESQUERDA: RESUMO DO USUÁRIO & ATALHOS */}
            <Card className="surface-card md:col-span-1 h-fit">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24 border-2 border-primary shadow-md">
                  <AvatarImage src={discordAvatar || undefined} alt={nome} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {nickname || nome || "Jogador"}
                  </h3>
                  {nickname ? (
                    <p className="text-xs text-muted-foreground">{nome}</p>
                  ) : null}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Badge variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                    Membro Ativo
                  </Badge>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-secondary/50 text-foreground text-xs font-mono font-medium shadow-xs">
                    <span>⏳ Tempo Online:</span>
                    <span className="text-primary font-bold">{formatSecondsToHoursAndMinutes(myMember?.total_seconds_online || 0)}</span>
                  </div>
                </div>

                <div className="w-full pt-3 border-t border-border/50 space-y-2 text-xs text-left">
                  <p className="text-muted-foreground">
                    ID em Jogo: <span className="font-bold text-foreground">{gameId || "N/A"}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Telefone: <span className="font-bold text-foreground">{telefone || "N/A"}</span>
                  </p>
                  <p className="text-muted-foreground truncate">
                    Link Público:{" "}
                    <span className="font-mono font-bold text-primary">
                      /perfil/{currentSlug}
                    </span>
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPublicProfile}
                  className="w-full text-xs font-bold border-primary/40 hover:bg-primary/10 text-primary gap-1.5 cursor-pointer rounded-xl"
                  title="Abrir perfil público em nova aba"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Ver Perfil (Nova Aba)</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleManualSyncAvatar}
                  disabled={isSyncingAvatar}
                  className="w-full text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer rounded-xl"
                >
                  {isSyncingAvatar ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>Sincronizar com Discord</span>
                </Button>
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
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: BANNER DO PERFIL (UPLOAD DIRETO DE IMAGEM) */}
              <Card className="surface-card">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" /> Alterar Banner do Perfil
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Faça o upload de uma imagem personalizada para o banner do seu perfil público.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
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
                      <div className="relative rounded-2xl overflow-hidden border border-border/80 h-36 sm:h-44 w-full bg-black shadow-inner">
                        <img
                          src={bannerUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                          <Badge variant="outline" className="bg-background/85 text-[10px] font-mono border-emerald-500/40 text-emerald-400 backdrop-blur-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Banner Ativo
                          </Badge>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setBannerUrl("")}
                            className="h-7 px-2.5 text-xs rounded-lg gap-1 shadow-xs cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Remover</span>
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={isUploadingBanner}
                        className="w-full text-xs font-bold gap-1.5 rounded-xl border-primary/30 hover:bg-primary/10 text-primary cursor-pointer h-9"
                      >
                        {isUploadingBanner ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        <span>Trocar Imagem do Banner</span>
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => bannerInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed border-border/80 hover:border-primary/60 hover:bg-primary/5 rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all group",
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
                        PNG, JPG, WEBP ou GIF (máx. 10MB). Proporção panorâmica recomendada: 16:9 ou 3:1.
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
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Aparece em destaque no topo do seu perfil ({customStatus.length}/80).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Biografia ("Sobre Mim")</Label>
                    <Textarea
                      placeholder="Conte sobre sua história na cidade, funções de destaque na facção, especialidades..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 500))}
                      className="min-h-[100px] text-xs resize-y rounded-xl leading-relaxed"
                      maxLength={500}
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
                      <Globe className="h-4 w-4 text-primary" /> Link Público & URL Personalizada
                    </CardTitle>
                    {customUrl ? (
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono py-0.5">
                        ✨ URL Personalizada Ativa
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-zinc-500/40 text-muted-foreground bg-zinc-500/10 text-[10px] font-mono py-0.5">
                        Padrão (ID Discord)
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    Defina seu link exclusivo na plataforma (ex.: <span className="font-mono text-primary font-bold">/perfil/{customUrl || "seu-nome"}</span>).
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* PREVIEW DO LINK COM BOTÃO DE COPIAR E ABRIR EM NOVA ABA */}
                  <div className="rounded-xl border border-primary/30 bg-background/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                    <div className="min-w-0 flex items-center gap-2">
                      <AtSign className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Seu Link Público Oficial</p>
                        <p className="font-mono font-bold text-xs text-foreground truncate">
                          {typeof window !== "undefined" ? window.location.origin : ""}/perfil/
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
                        /perfil/
                      </div>
                      <Input
                        placeholder={profile?.discord_username ? profile.discord_username.replace(/#0$/, "") : "ex.: malaca"}
                        value={customUrl}
                        onChange={(e) => {
                          const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 30);
                          setCustomUrl(sanitized);
                        }}
                        className="h-9 pl-16 text-xs font-mono font-bold"
                        maxLength={30}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      ℹ️ De 3 a 30 caracteres (apenas letras, números, ponto, hífen ou underline).
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

              {/* CARD 5: REDES SOCIAIS */}
              <Card className="surface-card">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Radio className="h-4 w-4 text-rose-400" /> Redes Sociais
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Adicione links das suas redes sociais para exibir botões clicáveis no seu perfil.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-4 text-xs">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-semibold">📸 Instagram</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-muted-foreground text-xs font-bold">@</span>
                        <Input
                          placeholder="usuario"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          className="pl-7 text-xs h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-semibold">🐦 X / Twitter</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-muted-foreground text-xs font-bold">@</span>
                        <Input
                          placeholder="usuario"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          className="pl-7 text-xs h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-semibold">🎵 TikTok</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-muted-foreground text-xs font-bold">@</span>
                        <Input
                          placeholder="usuario"
                          value={tiktok}
                          onChange={(e) => setTiktok(e.target.value)}
                          className="pl-7 text-xs h-8"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground font-semibold">🟣 Twitch</Label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-muted-foreground text-xs font-mono">twitch.tv/</span>
                        <Input
                          placeholder="canal"
                          value={twitch}
                          onChange={(e) => setTwitch(e.target.value)}
                          className="pl-20 text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground font-semibold">🔴 YouTube</Label>
                    <Input
                      placeholder="@canal ou link completo do seu canal"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                </CardContent>
              </Card>

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
        </TabsContent>

        {/* ABA 2: TEMA & ESTILO */}
        <TabsContent value="aparencia" className="space-y-6 animate-in fade-in-50 duration-200">
          <UserAppearanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
