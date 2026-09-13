import { useState } from "react";
import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  User,
  Phone,
  IdCard,
  MessageSquare,
  Copy,
  Check,
  ArrowLeft,
  Shield,
  Clock,
  Sparkles,
  Share2,
  Globe,
  ExternalLink,
  Edit3,
  Moon,
  Radio,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { LEVEL_LABEL, getLevelLabel, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { formatPhone, formatSecondsToHoursAndMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getOrCreatePrivateConversation } from "@/services/chatService";
import { PerfilPage } from "./perfil";

export const Route = createFileRoute("/_authenticated/perfil/$handle")({
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { handle } = useParams({ from: "/_authenticated/perfil/$handle" });
  const navigate = useNavigate();
  const { user, profile: myProfile } = useAuth();
  const { data: members = [], isLoading } = useMembers();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDiscordId, setCopiedDiscordId] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Normaliza o handle recebido (decodifica, remove @ ou %40 e coloca em minúsculas)
  const rawHandle = (() => {
    try {
      return decodeURIComponent(handle || "");
    } catch {
      return handle || "";
    }
  })();
  const cleanHandle = rawHandle.trim().toLowerCase().replace(/^(@|%40)/i, "");

  // Se o identificador for uma das abas do perfil próprio, renderiza diretamente o PerfilPage
  if (cleanHandle === "aparencia" || cleanHandle === "dados") {
    return <PerfilPage initialTab={cleanHandle} />;
  }

  // Localiza o membro pelo custom_url, discord_id, discord_username, user_id ou game_id
  const member = members.find((m) => {
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

  const isSelf = Boolean(member && user && member.user_id === user.id);
  const status = member?.presence_status || "offline";
  const currentNivel = (member?.nivel || "novato") as AppLevel;
  const avatarUrl = member?.discord_avatar_url || member?.avatar_url;
  const displayName = member?.nickname || member?.nome || "Membro";
  const initials = displayName.slice(0, 2).toUpperCase();
  const activeSlug = member?.custom_url || member?.discord_id || member?.user_id;

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanSlug = String(activeSlug || "").replace(/^(@|%40)/i, "");
    const link = `${origin}/perfil/${cleanSlug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Link do perfil público copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyDiscordId = () => {
    if (!member?.discord_id) return;
    navigator.clipboard.writeText(member.discord_id);
    setCopiedDiscordId(true);
    toast.success("ID do Discord copiado!");
    setTimeout(() => setCopiedDiscordId(false), 2000);
  };

  const handleStartChat = async () => {
    if (!user || !member || isSelf) return;
    try {
      setStartingChat(true);
      await getOrCreatePrivateConversation(user.id, member.user_id);
      toast.success(`Abrindo chat com ${displayName}...`);
      navigate({ to: "/chat" });
    } catch {
      toast.error("Não foi possível iniciar a conversa.");
    } finally {
      setStartingChat(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-12 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground font-medium">Carregando perfil público...</p>
      </div>
    );
  }

  if (!member) {
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/membros" })}
            className="text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Ver Todos os Membros</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            className="text-xs font-bold gap-1.5 rounded-xl bg-gradient-brand text-primary-foreground cursor-pointer"
          >
            <span>Ir para Dashboard</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* BOTÃO VOLTAR E BREADCRUMBS */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Voltar</span>
        </Button>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
          <Link to="/membros" className="hover:text-primary transition-colors">
            Membros
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-bold truncate max-w-[150px]">@{activeSlug}</span>
        </div>
      </div>

      {/* BANNER & HERO CARD DO PERFIL */}
      <div className="relative rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xl">
        {/* BANNER SUPERIOR ESTILIZADO */}
        <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-indigo-950/80 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.18),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.6),transparent,rgba(0,0,0,0.7))]" />

          {/* WATERMARK TWIN WHEELS */}
          <div className="absolute right-4 bottom-2 text-right select-none pointer-events-none opacity-25">
            <span className="font-black text-2xl sm:text-3xl tracking-tighter text-foreground font-mono">
              TWIN WHEELS
            </span>
          </div>

          {/* BADGE É VOCÊ OU CARGO NO BANNER */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            {isSelf ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold gap-1.5 backdrop-blur-md">
                <Sparkles className="h-3 w-3" />
                <span>Seu Perfil Público</span>
              </Badge>
            ) : null}

            <Badge variant="outline" className={cn("text-xs uppercase font-mono font-black backdrop-blur-md", levelBadgeClass(currentNivel))}>
              {LEVEL_LABEL[currentNivel] || currentNivel}
            </Badge>
          </div>
        </div>

        {/* INFORMAÇÕES PRINCIPAIS & AVATAR */}
        <div className="px-5 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* AVATAR COM STATUS RING */}
            <div className="relative inline-block self-start">
              <Avatar className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl border-4 border-card shadow-2xl bg-secondary ring-2 ring-border/80">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
                <AvatarFallback className="bg-gradient-brand text-primary-foreground font-black text-2xl sm:text-3xl rounded-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* STATUS INDICATOR */}
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

            {/* BOTÕES DE AÇÃO RÁPIDA */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="h-9 px-3 text-xs font-bold border-border/80 hover:bg-secondary rounded-xl gap-1.5 cursor-pointer"
                title="Copiar URL pública do perfil"
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
                    <span>Editar Meu Perfil</span>
                  </Button>
                </Link>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStartChat}
                  disabled={startingChat}
                  className="h-9 px-4 text-xs font-bold bg-gradient-brand text-primary-foreground hover:opacity-90 rounded-xl gap-1.5 cursor-pointer shadow-md"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Enviar Mensagem</span>
                </Button>
              )}
            </div>
          </div>

          {/* NOMES E IDENTIFICAÇÃO */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {displayName}
              </h1>

              {member.is_developer && (
                <Badge variant="outline" className="text-[10px] font-mono font-bold border-cyan-500/40 text-cyan-300 bg-cyan-500/10">
                  DEV
                </Badge>
              )}

              {Boolean(member.is_ceo || member.custom_theme?.is_ceo) && (
                <Badge className="text-[10px] font-bold border-amber-500/40 text-amber-300 bg-amber-500/20 shadow-xs shadow-amber-500/20">
                  👑 CEO
                </Badge>
              )}
            </div>

            {member.nickname && (
              <p className="text-xs text-muted-foreground font-medium">
                Nome em jogo: <span className="text-foreground font-semibold">{member.nome}</span>
              </p>
            )}

            {/* URL OFICIAL BADGE */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1 text-xs font-mono bg-secondary/80 border border-border/70 px-2.5 py-1 rounded-lg">
                <Globe className="h-3 w-3 text-primary" />
                <span className="text-muted-foreground font-normal">twin.malaca.com.br/perfil/</span>
                <span className="font-bold text-primary">{String(activeSlug || "").replace(/^(@|%40)/i, "")}</span>
              </div>

              {member.custom_url ? (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono py-0.5">
                  ✨ URL Personalizada
                </Badge>
              ) : (
                <Badge variant="outline" className="border-zinc-500/30 text-muted-foreground bg-zinc-500/5 text-[10px] font-mono py-0.5">
                  ID Discord Padrão
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE CARDS COM INFORMAÇÕES DETALHADAS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CARD 1: DADOS EM JOGO (GTA RP) */}
        <Card className="surface-card">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <IdCard className="h-4 w-4 text-primary" /> Dados do Personagem (GTA RP)
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">ID / Passaporte</p>
                <p className="font-mono font-bold text-base text-foreground mt-0.5">
                  {member.game_id || "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Telefone em Jogo</p>
                <p className="font-mono font-bold text-base text-foreground mt-0.5">
                  {formatPhone(member.telefone || "") || "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Cargo na Facção</p>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className={cn("text-[10px] uppercase font-mono font-bold px-2 py-0.5", levelBadgeClass(currentNivel))}>
                    {LEVEL_LABEL[currentNivel] || currentNivel}
                  </Badge>
                  {Boolean(member.is_ceo || member.custom_theme?.is_ceo) && (
                    <Badge className="text-[10px] font-bold border-amber-500/40 text-amber-300 bg-amber-500/20 shadow-xs shadow-amber-500/20">
                      👑 CEO
                    </Badge>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/20 p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Status do Membro</p>
                <div className="mt-1">
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    Ativo na Facção
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Tempo na Plataforma</p>
                  <p className="font-mono font-bold text-sm text-primary">
                    {formatSecondsToHoursAndMinutes(member.total_seconds_online || 0)}
                  </p>
                </div>
              </div>

              {member.data_entrada && (
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Membro Desde</p>
                  <p className="font-mono font-bold text-xs text-foreground">
                    {new Date(member.data_entrada).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: CONTA DO DISCORD VINCULADA */}
        <Card className="surface-card border-indigo-500/20 bg-indigo-500/5">
          <CardHeader className="pb-3 border-b border-indigo-500/20">
            <CardTitle className="text-base font-semibold text-indigo-400 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" /> Integração Discord
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-4 space-y-3.5 text-xs">
            <div className="rounded-xl border border-indigo-500/25 bg-background/60 p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Tag / Nome no Discord</p>
                <p className="font-mono font-bold text-sm text-foreground mt-0.5 truncate">
                  {member.discord_username ? `@${member.discord_username}` : "Não vinculado"}
                </p>
              </div>

              {member.discord_username && (
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-500/10 text-[10px] font-mono shrink-0">
                  Verificado
                </Badge>
              )}
            </div>

            <div className="rounded-xl border border-indigo-500/25 bg-background/60 p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">ID do Discord</p>
                <p className="font-mono font-bold text-xs text-foreground mt-0.5 truncate">
                  {member.discord_id || "Não vinculado"}
                </p>
              </div>

              {member.discord_id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyDiscordId}
                  className="h-7 px-2 text-[11px] text-indigo-300 hover:text-white hover:bg-indigo-500/20 rounded-lg gap-1 shrink-0 cursor-pointer"
                  title="Copiar ID do Discord"
                >
                  {copiedDiscordId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedDiscordId ? "Copiado" : "Copiar ID"}</span>
                </Button>
              )}
            </div>

            {/* STATUS DE PRESENÇA EM TEMPO REAL */}
            <div className="rounded-xl border border-border/60 bg-secondary/30 p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full shrink-0",
                    status === "online"
                      ? "bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"
                      : status === "ausente"
                      ? "bg-amber-500 shadow-sm shadow-amber-500/50"
                      : "bg-zinc-500"
                  )}
                />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Presença no Sistema</p>
                  <p className="font-bold text-xs capitalize text-foreground">
                    {status === "online" ? "Online Agora" : status === "ausente" ? "Ausente / AFK" : "Offline"}
                  </p>
                </div>
              </div>

              {status === "online" && (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono">
                  🟢 Ativo
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
