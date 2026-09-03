import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Clock, Send, LogOut, Trash2, AlertTriangle } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { submitSignupRequest, cancelSignupRequest } from "@/lib/app-api";
import { errorMessage, formatPhone } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — Twin Wheels" },
      {
        name: "description",
        content: "Acesse o painel interno da Twin Wheels usando sua conta do Discord.",
      },
    ],
  }),
  component: AuthPage,
});

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 127.14 96.36" fill="currentColor" {...props}>
      <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.34,2.51-2a75.58,75.58,0,0,0,93,0c.79.71,1.63,1.4,2.51,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.6-18.83C129,54.65,122.64,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    session,
    profile,
    signupRequestStatus,
    loading: authLoading,
    approvedAccess,
    signOut,
    refresh,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Form states for new registration
  const [nome, setNome] = useState("");
  const [nickname, setNickname] = useState("");
  const [telefone, setTelefone] = useState("");
  const [gameId, setGameId] = useState("");

  const isPendingApproval = signupRequestStatus === "pendente" || (profile && profile.status === "pendente");

  useEffect(() => {
    if (!authLoading && approvedAccess) {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [authLoading, approvedAccess, navigate]);

  // AUTOMATIC REDIRECT AS SOON AS LEADERSHIP APPROVES REGISTRATION
  useEffect(() => {
    if (!session?.user?.id || !isPendingApproval) return;

    const channel = supabase
      .channel(`pending-user-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "signup_requests",
          filter: `user_id=eq.${session.user.id}`,
        },
        async (payload) => {
          const status = (payload.new as any)?.status;
          if (status === "aprovado") {
            toast.success("Seu cadastro foi aprovado pela liderança! Entrando no painel...");
            await refresh();
            void navigate({ to: "/dashboard", replace: true });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_roles",
          filter: `user_id=eq.${session.user.id}`,
        },
        async () => {
          toast.success("Seu cadastro foi aprovado pela liderança! Entrando no painel...");
          await refresh();
          void navigate({ to: "/dashboard", replace: true });
        }
      )
      .subscribe();

    const interval = setInterval(async () => {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (userRole) {
        toast.success("Seu cadastro foi aprovado pela liderança! Entrando no painel...");
        await refresh();
        void navigate({ to: "/dashboard", replace: true });
      }
    }, 3500);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [session?.user?.id, isPendingApproval, refresh, navigate]);

  const handleDiscordLogin = async () => {
    setLoading(true);
    try {
      const origin = typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://2w.malaca.com.br";

      const cleanOrigin = origin.startsWith("http://") || origin.startsWith("https://")
        ? origin
        : `https://${origin}`;

      const redirectTarget = `${cleanOrigin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: redirectTarget,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast.error(errorMessage(error, "Erro ao iniciar o login com o Discord."));
      setLoading(false);
    }
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe seu Nome do Jogador.");
      if (!telefone.trim()) throw new Error("Informe seu Telefone em jogo.");
      if (!gameId.trim()) throw new Error("Informe seu ID do Personagem / Passaporte.");

      await submitSignupRequest({
        nome,
        nickname: nickname.trim() || null,
        telefone,
        game_id: gameId,
      });
    },
    onSuccess: async () => {
      toast.success("Solicitação enviada! Aguarde a aprovação da liderança.");
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
      void queryClient.invalidateQueries({ queryKey: ["pending_signup_requests"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await cancelSignupRequest(session?.user?.id);
      await signOut();
    },
    onSuccess: () => {
      toast.success("Solicitação de cadastro cancelada com sucesso.");
      setCancelDialogOpen(false);
      void queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Background Atmospheric Decorative Glows sincronizados com o tema e cor de destaque */}
      <div className="absolute top-1/4 left-1/4 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-[420px] w-[420px] translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-brand/15 blur-[150px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="mb-8 text-center flex flex-col items-center">
          <Brand size="lg" className="items-center" />
        </div>

        <Card className="surface-card border border-border/70 shadow-2xl backdrop-blur-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-7 sm:p-8">
            {authLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Verificando autenticação...</p>
              </div>
            ) : session && isPendingApproval ? (
              /* TELA: AGUARDANDO APROVAÇÃO DA LIDERANÇA */
              <div className="space-y-5 text-center py-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 animate-pulse">
                  <Clock className="h-7 w-7" />
                </div>

                <div className="space-y-1">
                  <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-xs">
                    Solicitação Pendente
                  </Badge>
                  <h1 className="text-xl font-bold text-foreground pt-1">
                    Aguardando Aprovação da Liderança
                  </h1>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sua solicitação de cadastro foi enviada e está em análise pelos gestores do grupo. Assim que for aprovada, você entrará automaticamente no painel.
                </p>

                <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5 text-left text-xs space-y-1.5">
                  <p className="text-[0.65rem] uppercase font-bold text-muted-foreground border-b border-border/40 pb-1">
                    Dados da Solicitação
                  </p>
                  <p className="text-foreground">
                    Nome: <span className="font-semibold">{profile?.nome || nome}</span>
                  </p>
                  {profile?.nickname || nickname ? (
                    <p className="text-foreground">
                      Apelido: <span className="font-semibold">{profile?.nickname || nickname}</span>
                    </p>
                  ) : null}
                  <p className="text-foreground">
                    Telefone: <span className="font-semibold">{profile?.telefone || telefone || "Cadastrado"}</span>
                  </p>
                  <p className="text-foreground">
                    ID em Jogo: <span className="font-semibold font-mono">{profile?.game_id || gameId || "Cadastrado"}</span>
                  </p>
                </div>

                {/* BOTÃO CANCELAR REGISTRO (VERMELHO) */}
                <Button
                  variant="destructive"
                  className="w-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 hover:bg-rose-500/25 transition-colors"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Cancelar Registro
                </Button>
              </div>
            ) : session && !approvedAccess ? (
              /* FORMULÁRIO DE REGISTRO DO NOVO MEMBRO DISCORD */
              <div className="space-y-5 text-left">
                <div className="space-y-1 text-center">
                  <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-xs">
                    Novo Cadastro de Membro
                  </Badge>
                  <h1 className="text-xl font-bold text-foreground pt-1">Preencha seus Dados em Jogo</h1>
                  <p className="text-xs text-muted-foreground">
                    Estes dados são necessários para identificação do grupo no GTA RP.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs font-semibold">
                      Nome do Jogador <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      placeholder="Ex.: Ricardo Silva"
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
                      placeholder="Ex.: Malaca"
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
                  className="w-full h-10 bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 text-xs mt-2"
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar Solicitação de Cadastro
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-xs text-muted-foreground hover:bg-muted/20"
                  onClick={() => void signOut()}
                >
                  Sair
                </Button>
              </div>
            ) : (
              /* LOGIN COM DISCORD */
              <div className="space-y-6 py-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">Acesse sua conta</h1>
                  <p className="text-sm text-muted-foreground">
                    Utilize sua conta do Discord corporativa ou de membro para entrar.
                  </p>
                </div>

                <Button
                  onClick={handleDiscordLogin}
                  disabled={loading}
                  className="w-full h-12 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold transition-all duration-300 flex items-center justify-center gap-3 rounded-xl shadow-lg shadow-[#5865F2]/10 hover:shadow-[#5865F2]/20 hover:-translate-y-[1px] active:translate-y-0"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <DiscordIcon className="h-5 w-5" />
                  )}
                  <span>Continuar com Discord</span>
                </Button>

                <p className="text-xs text-muted-foreground leading-relaxed px-4">
                  Ao continuar, você autoriza a plataforma a importar sua identidade básica do Discord e registrar o seu acesso interno.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rodapé Estilizado do Site */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-[11px] font-mono text-muted-foreground/80">
            Plataforma Integrada de Gestão &bull; Twin Wheels
          </p>
          <p className="text-[10px] text-muted-foreground/50">
            Design de Alto Impacto &bull; Sincronização em Tempo Real
          </p>
        </div>
      </div>

      {/* CONFIRMATION DIALOG FOR CANCELING REGISTRATION */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-5 w-5" /> Cancelar Solicitação de Registro?
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 leading-relaxed">
              Sua solicitação de cadastro será excluída permanentemente. Ela deixará de aparecer na lista de aprovação da liderança e você precisará preencher o formulário novamente se optar por retornar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelDialogOpen(false)}
              className="h-9 text-xs rounded-xl"
            >
              Manter Solicitação
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="h-9 text-xs font-bold rounded-xl"
            >
              {cancelMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
