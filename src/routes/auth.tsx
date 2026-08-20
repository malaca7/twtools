import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLoginPlayers } from "@/hooks/useData";
import { loginWithPlayer, registerPlayerRequest } from "@/lib/app-api";
import { errorMessage } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Twin Wheels" },
      {
        name: "description",
        content: "Acesse o painel interno da Twin Wheels selecionando seu jogador e senha.",
      },
      { property: "og:title", content: "Entrar — Twin Wheels" },
      { property: "og:description", content: "Login da plataforma de gestão Twin Wheels." },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  playerId: z.string().trim().uuid({ message: "Selecione o jogador." }),
  password: z.string().regex(/^\d{5,}$/, {
    message: "A senha deve ter apenas números e no mínimo 5 dígitos.",
  }),
});

const signupSchema = z.object({
  nome: z.string().trim().min(2, { message: "Informe seu nome dentro do jogo." }).max(60),
  nickname: z.string().trim().max(30).optional(),
  telefone: z.string().regex(/^\d{3}-\d{3}$/, {
    message: "Use o formato 000-000 para o telefone.",
  }),
  password: z.string().regex(/^\d{5,}$/, {
    message: "A senha deve ter apenas números e no mínimo 5 dígitos.",
  }),
});

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

function AuthPage() {
  const navigate = useNavigate();
  const {
    session,
    loading: authLoading,
    refresh,
    approvedAccess,
    signupRequestStatus,
    signOut,
  } = useAuth();
  const { data: players = [], isLoading: loadingPlayers } = useLoginPlayers();
  const [loading, setLoading] = useState(false);
  const [signupPhone, setSignupPhone] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

  useEffect(() => {
    if (!authLoading && approvedAccess) navigate({ to: "/dashboard", replace: true });
  }, [authLoading, approvedAccess, navigate]);

  useEffect(() => {
    if (!selectedPlayerId && players.length > 0 && players[0]) {
      setSelectedPlayerId(players[0].user_id);
    }
  }, [players, selectedPlayerId]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      playerId: form.get("playerId") || selectedPlayerId,
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    const selectedPlayer = players.find((player) => player.user_id === parsed.data.playerId);
    if (!selectedPlayer) {
      toast.error("Jogador inválido. Selecione novamente.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithPlayer({
        data: {
          playerId: selectedPlayer.user_id,
          password: parsed.data.password,
        },
      });

      if (result.status === "invalid") {
        toast.error("Jogador ou senha incorretos. Verifique e tente novamente.");
        return;
      }

      if (result.status === "pendente") {
        toast.message("Seu registro ainda está aguardando aprovação da gerência.");
        return;
      }

      if (result.status === "rejeitado") {
        toast.error("Seu registro foi recusado. Solicite uma nova análise à gerência.");
        return;
      }

      await refresh();
      toast.success("Bem-vindo de volta à Twin Wheels.");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(errorMessage(error, "Jogador ou senha incorretos. Verifique e tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const parsed = signupSchema.safeParse({
      password: form.get("password"),
      nome: form.get("nome"),
      nickname: (form.get("nickname") as string) || undefined,
      telefone: normalizePhone(String(form.get("telefone") ?? "")),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }
    setLoading(true);
    try {
      await registerPlayerRequest({
        data: {
          nome: parsed.data.nome,
          nickname: parsed.data.nickname,
          telefone: parsed.data.telefone,
          password: parsed.data.password,
        },
      });
      formEl.reset();
      setSignupPhone("");
      toast.success("Registro enviado. Aguarde a aprovação de um gerente ou superior.");
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      const message = errorMessage(error, "Não foi possível concluir o registro.");
      if (
        message.toLowerCase().includes("already registered") ||
        message.toLowerCase().includes("already been registered")
      ) {
        toast.error("Já existe um registro para este telefone.");
        return;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/">
            <Brand size="md" className="items-center" subtitle="Gestão interna · GTA RP" />
          </Link>
        </div>

        <Card className="surface-card">
          <CardContent className="p-6">
            {session && !approvedAccess ? (
              <div className="mb-5 space-y-3 rounded-lg border border-border/70 bg-muted/30 p-4 text-center">
                <h1 className="text-lg font-semibold">
                  {signupRequestStatus === "rejeitado"
                    ? "Registro recusado"
                    : "Aguardando aprovação"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {signupRequestStatus === "rejeitado"
                    ? "Seu registro foi recusado pela gerência. Você pode entrar com outro jogador ou enviar novo registro."
                    : "Seu acesso será liberado após aprovação de um gerente ou cargo superior. Você também pode entrar com outro jogador."}
                </p>
                <Button variant="outline" className="w-full" onClick={() => void signOut()}>
                  Entrar com outro jogador
                </Button>
              </div>
            ) : null}

            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Registro</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-5">
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-player">Nome do jogador</Label>
                    <input type="hidden" name="playerId" value={selectedPlayerId} />
                    <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                      <SelectTrigger id="login-player">
                        <SelectValue
                          placeholder={
                            loadingPlayers ? "Carregando jogadores..." : "Selecione seu jogador"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.user_id} value={player.user_id}>
                            {player.nickname || player.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!loadingPlayers && players.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Nenhum jogador disponível para login.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Entrar no painel
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form className="space-y-4" onSubmit={handleSignup}>
                  <div className="space-y-2">
                    <Label htmlFor="signup-nome">Nome no jogo</Label>
                    <Input id="signup-nome" name="nome" required maxLength={60} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-nickname">Apelido</Label>
                    <Input id="signup-nickname" name="nickname" maxLength={30} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-telefone">Telefone</Label>
                    <Input
                      id="signup-telefone"
                      name="telefone"
                      inputMode="numeric"
                      placeholder="000-000"
                      maxLength={7}
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(normalizePhone(e.target.value))}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Use o formato 000-000.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="new-password"
                      minLength={5}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Apenas números, com no mínimo 5 dígitos.
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Enviar registro
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    O acesso só é liberado após aprovação de um gerente ou cargo superior.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
