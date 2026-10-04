import { Link } from "@tanstack/react-router";
import {
  Lock,
  ShieldAlert,
  Ban,
  LogOut,
  AlertTriangle,
  Clock,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { MemberTagBadge } from "@/components/ui/MemberTagBadge";
import { cn } from "@/lib/utils";

export function PlatformLockedScreen() {
  const { user, profile, platformLockedTags, activeSuspension, signOut } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in-50 duration-300">
      <div className="w-full max-w-2xl space-y-6">
        {/* CARD PRINCIPAL DE BLOQUEIO */}
        <Card className="surface-card border-rose-500/50 shadow-2xl shadow-rose-950/30 overflow-hidden relative bg-gradient-to-b from-rose-950/30 via-background/95 to-background backdrop-blur-xl">
          {/* Efeito Glow no Topo */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.8)]" />

          <CardHeader className="p-6 sm:p-8 text-center pb-4 space-y-4">
            {/* Ícone de Escudo Travado */}
            <div className="mx-auto relative">
              <div className="h-20 w-20 rounded-3xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto shadow-[0_0_40px_rgba(244,63,94,0.3)] animate-pulse">
                <Lock className="h-10 w-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-background border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-md">
                <Ban className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="destructive" className="font-mono uppercase tracking-widest text-[11px] px-3 py-0.5 shadow-sm">
                  🔒 Chave Mestra Ativa
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Acesso à Plataforma Bloqueado
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                O acesso aos menus, páginas e operações deste painel está restrito por diretriz de segurança aplicada pela Liderança / Administração.
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 pt-2 space-y-6">
            {/* TAGS QUE CAUSARAM O BLOQUEIO */}
            {platformLockedTags.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" /> Tag(s) de Restrição Ativa(s):
                  </span>
                  <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/20 font-mono">
                    {platformLockedTags.length} tag(s)
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {platformLockedTags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-2 bg-background/80 p-2 rounded-xl border border-rose-500/30 shadow-xs">
                      <MemberTagBadge tag={tag} size="md" showIcon className="font-bold" />
                      <span className="text-xs text-muted-foreground font-mono">
                        (Regra: Bloquear Acesso à Plataforma)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SE HOUVER SUSPENSÃO FORMAL */}
            {activeSuspension && activeSuspension.blocks?.block_login && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Ban className="h-4 w-4" /> Suspensão Disciplinar
                  </span>
                  <span className="text-[11px] font-mono text-rose-300">
                    {activeSuspension.ends_at
                      ? `Expira em: ${new Date(activeSuspension.ends_at).toLocaleString("pt-BR")}`
                      : "Duração: Permanente"}
                  </span>
                </div>
                <p className="text-xs text-rose-200">
                  Motivo: <strong>{activeSuspension.reason}</strong>
                </p>
                {activeSuspension.description && (
                  <p className="text-xs text-muted-foreground">{activeSuspension.description}</p>
                )}
              </div>
            )}

            {/* DETALHES DAS LIMITAÇÕES ENFORCADAS */}
            <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground">Navegação Bloqueada</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Todos os menus, painéis e abas do sistema estão travados para visualização.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary/30 border border-border/60 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground">Operações Interrompidas</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Proibido registrar vendas, movimentar baús, produzir itens ou fazer aportes.
                  </p>
                </div>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/50">
              <Link to="/perfil/advertencias" className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto h-10 px-4 text-xs font-bold border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 gap-2 rounded-xl cursor-pointer"
                >
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span>Ver Prontuário & Advertências</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-auto sm:ml-0" />
                </Button>
              </Link>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => signOut()}
                className="w-full sm:w-auto h-10 px-5 text-xs font-bold gap-2 rounded-xl cursor-pointer shadow-md"
              >
                <LogOut className="h-4 w-4" />
                <span>Desconectar / Sair</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
