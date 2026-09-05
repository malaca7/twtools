import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Radio,
  Loader2,
  Clock,
  User,
  ShieldAlert,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  triggerForceCachePurge,
  fetchLastForceCachePurge,
  type ForceCachePurgeRecord,
} from "@/services/devService";

export function DevForcePurgeCard() {
  const { user, profile, level } = useAuth();
  const [lastPurge, setLastPurge] = useState<ForceCachePurgeRecord | null>(null);
  const [loadingLast, setLoadingLast] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchLastForceCachePurge()
      .then((rec) => {
        if (isMounted) setLastPurge(rec);
      })
      .finally(() => {
        if (isMounted) setLoadingLast(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTrigger = async () => {
    setIsSubmitting(true);
    try {
      const record = await triggerForceCachePurge(
        user,
        profile,
        level,
        reason.trim() || "Atualização de melhorias e limpeza de cache"
      );

      setLastPurge(record);
      setDialogOpen(false);
      setReason("");

      toast.success("🚀 Instrução global de limpeza de cache transmitida com sucesso!", {
        description: "Todos os membros online terão o cache limpo e a página recarregada em instantes.",
        duration: 6000,
      });
    } catch (err: any) {
      toast.error(`Falha ao disparar ordem de limpeza: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return "Nenhum disparo registrado";
    try {
      const d = new Date(ts);
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return String(ts);
    }
  };

  return (
    <Card className="surface-card border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-background to-blue-950/20 shadow-xl overflow-hidden relative">
      {/* Detalhe estético de luz neon de fundo */}
      <div className="absolute -right-16 -top-16 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <RotateCcw className="h-5 w-5 animate-[spin_8s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-black text-foreground">
                  Limpeza Forçada de Cache & Recarregar Clientes
                </CardTitle>
                <Badge variant="outline" className="text-[0.65rem] border-cyan-500/40 text-cyan-400 bg-cyan-500/10 font-bold uppercase tracking-wider">
                  <Radio className="w-2.5 h-2.5 mr-1 text-cyan-400 animate-pulse" />
                  Realtime Broadcast
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5 text-muted-foreground">
                Força todos os membros conectados a limparem o cache do navegador e recarregarem a aplicação em tempo real.
              </CardDescription>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95 shrink-0 gap-1.5"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                Forçar Limpeza & Recarregar
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md bg-[#0a0f1d] border-cyan-500/40 text-white p-6 shadow-2xl">
              <DialogHeader className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                    <RotateCcw className="h-5 w-5 animate-spin" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-black text-white">
                      Confirmar Limpeza Forçada de Cache
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-300">
                      Esta ação enviará uma ordem para todos os clientes online no site.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-3 text-xs">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>O que acontece ao acionar?</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[0.72rem] text-amber-200/90">
                    <li>O <strong>Cache Storage</strong> de todos os navegadores conectados é apagado.</li>
                    <li>Todos os <strong>Service Workers</strong> ativos são desregistrados.</li>
                    <li>O cache em memória do TanStack Query é limpo.</li>
                    <li>Um aviso elegante e futurista é exibido para o usuário antes da recarga automática.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purge-reason" className="text-xs font-bold text-slate-200">
                    Motivo / Notas da Atualização (Opcional)
                  </Label>
                  <Input
                    id="purge-reason"
                    placeholder="Ex: Correção no sistema de notificações e nova versão do chat"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-black/40 border-white/10 text-xs text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                  />
                  <p className="text-[0.68rem] text-slate-400">
                    Este texto será visível no aviso de carregamento de todos os membros.
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs hover:bg-white/10 text-slate-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleTrigger}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/30 gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Transmitindo Ordem...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Confirmar e Disparar Ordem
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-cyan-400" />
              Último Disparo Registrado
            </span>
            <p className="text-xs font-mono font-semibold text-foreground">
              {loadingLast ? "Consultando..." : formatTimestamp(lastPurge?.timestamp)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3 h-3 text-emerald-400" />
              Emitido Por & Motivo
            </span>
            <p className="text-xs font-semibold text-foreground truncate">
              {lastPurge ? (
                <span>
                  <strong className="text-primary font-bold">{lastPurge.requested_by_name || "Dev"}</strong>
                  {lastPurge.reason && ` — "${lastPurge.reason}"`}
                </span>
              ) : (
                <span className="text-muted-foreground font-normal">Nenhum histórico recente</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-[0.7rem] text-cyan-300">
          <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
          <span>
            <strong>Dica Dev:</strong> Acione este botão após cada deploy ou correção crítica para que ninguém fique preso em versões antigas armazenadas em cache local.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
