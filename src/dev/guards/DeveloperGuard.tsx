import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { isUserDeveloper } from "@/services/devService";

interface DeveloperGuardProps {
  children: ReactNode;
}

export function DeveloperGuard({ children }: DeveloperGuardProps) {
  const { user, profile, level, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-xs text-muted-foreground font-medium">Verificando credenciais de desenvolvedor...</p>
        </div>
      </div>
    );
  }

  const isDev = isUserDeveloper(user, profile, level);

  if (!isDev) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-4 sm:p-8 animate-in fade-in-50 duration-300">
        <Card className="max-w-md w-full surface-card border-rose-500/30 bg-rose-500/5 shadow-[0_0_30px_rgba(244,63,94,0.1)] text-center p-6 space-y-5">
          <CardHeader className="p-0 space-y-3">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-md">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10">
                HTTP 403 FORBIDDEN
              </Badge>
              <CardTitle className="text-lg font-black text-foreground">
                Acesso Negado ao Módulo Dev
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 text-xs text-muted-foreground space-y-4">
            <p>
              Esta página e os recursos do <strong>Módulo Dev</strong> são destinados exclusivamente a usuários que possuem a tag <code className="text-rose-400 font-mono bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">desenvolvedor</code>.
            </p>
            <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-[0.7rem] text-left space-y-1">
              <span className="font-bold text-foreground block flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-amber-400" /> Política de Segurança Backend:
              </span>
              <p className="text-muted-foreground">
                Qualquer requisição de API ou acesso direto por URL sem a tag exigida é rejeitado automaticamente pelo servidor com código 403 Forbidden.
              </p>
            </div>
          </CardContent>

          <div className="pt-2">
            <Button asChild size="sm" className="bg-gradient-brand text-primary-foreground font-semibold h-9 gap-2">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
