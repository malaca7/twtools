import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Crown, ArrowLeft, Lock, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface CeoGuardProps {
  children: ReactNode;
}

export function CeoGuard({ children }: CeoGuardProps) {
  const { isCeoUser, isDevUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-xs text-muted-foreground font-medium">Verificando credenciais executivas (Tag CEO)...</p>
        </div>
      </div>
    );
  }

  const hasAccess = Boolean(isCeoUser || isDevUser);

  if (!hasAccess) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-4 sm:p-8 animate-in fade-in-50 duration-300">
        <Card className="max-w-md w-full surface-card border-amber-500/30 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.1)] text-center p-6 space-y-5">
          <CardHeader className="p-0 space-y-3">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Crown className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300 bg-amber-500/10 font-bold">
                DIRETORIA EXECUTIVA · 403
              </Badge>
              <CardTitle className="text-lg font-black text-foreground">
                Painel Restrito à Diretoria (Tag CEO)
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 text-xs text-muted-foreground space-y-4">
            <p>
              Este painel e as ferramentas executivas são de uso exclusivo para membros portadores da{" "}
              <strong className="text-amber-300 font-bold">Tag CEO 👑</strong> ou da{" "}
              <strong className="text-rose-400 font-bold">Tag Dev 💻</strong>.
            </p>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-[0.7rem] text-left space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-amber-400" /> Política de Acesso Executivo:
              </span>
              <p className="text-muted-foreground">
                Apenas quem possui a Tag Dev pode atribuir a Tag CEO a um membro do grupo. Se você deveria ter acesso a este painel, contate a diretoria de desenvolvimento.
              </p>
            </div>
          </CardContent>

          <div className="pt-2">
            <Button asChild variant="outline" className="w-full text-xs font-bold border-border/80 hover:bg-secondary">
              <Link to="/dashboard">
                <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                Voltar ao Painel Operacional
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
