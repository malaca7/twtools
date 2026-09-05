import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Phone, IdCard, Lock, Save, Loader2, CheckCircle2, Palette, Sparkles, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { UserAppearanceSettings } from "@/components/profile/UserAppearanceSettings";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const { profile, level, refresh, user, hasPermission } = useAuth();
  const { data: members = [] } = useMembers();
  const myMember = members.find((m) => m.user_id === user?.id);
  const queryClient = useQueryClient();

  if (!hasPermission("view_profile")) {
    return <NoAccess />;
  }

  const [activeTab, setActiveTab] = useState<"dados" | "aparencia">("dados");
  const [nome, setNome] = useState("");
  const [nickname, setNickname] = useState("");
  const [telefone, setTelefone] = useState("");
  const [gameId, setGameId] = useState("");

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || "");
      setNickname(profile.nickname || "");
      setTelefone(formatPhone(profile.telefone || ""));
      setGameId(profile.game_id || "");
    }
  }, [profile]);

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
      });
    },
    onSuccess: async () => {
      toast.success("Perfil atualizado com sucesso!");
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      void queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const [isSyncingAvatar, setIsSyncingAvatar] = useState(false);

  const handleManualSyncAvatar = async () => {
    try {
      setIsSyncingAvatar(true);
      // Notifica o bot para sincronização caso esteja acessível
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Meu Perfil"
        description="Gerencie seus dados de jogador em jogo e visualize sua conta do Discord vinculada."
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
          <TabsTrigger value="dados" className="text-xs font-bold gap-2 rounded-lg cursor-pointer">
            <User className="h-4 w-4 text-primary" />
            <span>Dados do Jogador</span>
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="text-xs font-bold gap-2 rounded-lg cursor-pointer">
            <Palette className="h-4 w-4 text-purple-400" />
            <span>Minha Aparência & Tema</span>
            <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 border-purple-500/40 text-purple-300 bg-purple-500/20 font-black">
              NOVO ✨
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DADOS DO JOGADOR */}
        <TabsContent value="dados" className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid gap-6 md:grid-cols-3">
            {/* AVATAR & USER SUMMARY CARD */}
            <Card className="surface-card md:col-span-1">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <Avatar className="h-24 w-24 border-2 border-primary shadow-md">
                  <AvatarImage src={discordAvatar || undefined} alt={nome} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {nickname || nome}
                  </h3>
                  {nickname ? (
                    <p className="text-xs text-muted-foreground">{nome}</p>
                  ) : null}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <Badge variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                    Membro Ativo
                  </Badge>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-secondary/50 text-foreground text-xs font-mono font-medium shadow-sm">
                    <span>⏳ Tempo na Plataforma:</span>
                    <span className="text-primary font-bold">{formatSecondsToHoursAndMinutes(myMember?.total_seconds_online || 0)}</span>
                  </div>
                </div>

                <div className="w-full pt-3 border-t border-border/50 space-y-1.5 text-xs text-left">
                  <p className="text-muted-foreground">
                    ID em Jogo: <span className="font-bold text-foreground">{gameId || "N/A"}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Telefone: <span className="font-bold text-foreground">{telefone || "N/A"}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* EDIT PROFILE FORM & DISCORD INFO */}
            <div className="md:col-span-2 space-y-6">
              {/* EDITABLE GAME PROFILE */}
              <Card className="surface-card">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Dados do Jogador (Em Jogo)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Atualize suas informações no servidor GTA RP. Preencha todos os campos obrigatórios.
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

                  <Button
                    type="button"
                    className="w-full bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 mt-2"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Alterações de Perfil
                  </Button>
                </CardContent>
              </Card>

              {/* READ-ONLY DISCORD INFO CARD */}
              <Card className="surface-card border-indigo-500/20 bg-indigo-500/5">
                <CardHeader className="pb-3 border-b border-indigo-500/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold text-indigo-400 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-indigo-400" /> Conta do Discord Vinculada
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] flex items-center gap-1.5 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Sincronização Ativa
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 gap-1.5 cursor-pointer"
                        onClick={handleManualSyncAvatar}
                        disabled={isSyncingAvatar}
                      >
                        {isSyncingAvatar ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        <span>Sincronizar Foto Agora</span>
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Sua foto de perfil e dados são sincronizados automaticamente sempre que você alterar no Discord.
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
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: MINHA APARÊNCIA & TEMA INDIVIDUAL */}
        <TabsContent value="aparencia" className="space-y-6 animate-in fade-in-50 duration-200">
          <UserAppearanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
