import { useState } from "react";
import { toast } from "sonner";
import {
  Wrench,
  RotateCcw,
  Sparkles,
  Flame,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { triggerForceCachePurge } from "@/services/devService";
import { DevMaintenanceManagerModal } from "@/components/maintenance/DevMaintenanceManagerModal";

export function DevToolsMenu() {
  const { user, profile, level, isDevUser } = useAuth();
  const { settings } = usePlatformSettings();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isDevUser) return null;

  const isMaintenanceActive = Boolean(
    settings.maintenanceActive ||
      (settings.showSystemStatusNotice && settings.systemStatusType === "destructive")
  );

  const handleTriggerPurge = async () => {
    setIsSubmitting(true);
    try {
      const record = await triggerForceCachePurge(
        user,
        profile,
        level,
        reason.trim() || "Atualização de melhorias e limpeza de cache"
      );

      setDialogOpen(false);
      setReason("");

      toast.success("🚀 Instrução global de limpeza de cache transmitida com sucesso!", {
        description: "Todos os membros online (incluindo você) terão o cache limpo e a página recarregada em instantes.",
        duration: 6000,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tw_force_cache_purge_self", { detail: record })
        );
      }
    } catch (err: any) {
      toast.error(`Falha ao disparar ordem de limpeza: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 font-bold text-[10px] sm:text-xs transition-all shadow-sm gap-1.5"
            aria-label="Dev Tools"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dev Tools</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-60 bg-slate-950 border-cyan-500/30">
          <DropdownMenuLabel className="text-xs font-black text-cyan-400 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Acesso Rápido Dev
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-cyan-500/20" />

          <DropdownMenuItem
            onClick={() => setMaintenanceModalOpen(true)}
            className="cursor-pointer text-xs font-bold text-amber-300 focus:bg-amber-950/40 focus:text-amber-200 gap-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <span>Modo de Manutenção</span>
            </div>
            {isMaintenanceActive && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-cyan-500/20" />

          <DropdownMenuItem
            onClick={() => setDialogOpen(true)}
            className="cursor-pointer text-xs font-bold text-rose-400 focus:bg-rose-950/50 focus:text-rose-300 gap-2"
          >
            <Flame className="h-3.5 w-3.5 fill-rose-500/20" /> Limpeza de Cache
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DevMaintenanceManagerModal
        open={maintenanceModalOpen}
        onOpenChange={setMaintenanceModalOpen}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg w-[calc(100%-2rem)] bg-[#0c1222] border border-cyan-500/40 text-white p-5 sm:p-6 shadow-2xl rounded-2xl ring-1 ring-cyan-500/30 backdrop-blur-2xl">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
                <RotateCcw className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-white tracking-tight">
                  Confirmar Limpeza Forçada de Cache
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300">
                  Esta ação enviará uma instrução global para todos os clientes online.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-300 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>O que acontece ao acionar?</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[0.72rem] text-amber-200/90 leading-relaxed">
                <li>O <strong>Cache Storage</strong> de todos os navegadores é apagado.</li>
                <li>Todos os <strong>Service Workers</strong> ativos são desregistrados.</li>
                <li>O cache em memória do TanStack Query é limpo instantaneamente.</li>
                <li>Recarregamento automático ocorrerá nos clientes conectados.</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purge-reason-menu" className="text-xs font-bold text-slate-200">
                Motivo / Notas da Atualização (Opcional)
              </Label>
              <Input
                id="purge-reason-menu"
                placeholder="Ex: Atualização de funcionalidades e limpeza de cache"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-black/50 border-white/15 text-xs text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 h-10 rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
              className="text-xs hover:bg-white/10 text-slate-300 rounded-xl h-9"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleTriggerPurge}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 gap-1.5 rounded-xl h-9 transition-all cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Transmitindo...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Confirmar e Disparar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
