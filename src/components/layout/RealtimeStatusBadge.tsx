import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import { setRealtimeStatus } from "@/lib/realtimeSync";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RealtimeStatusBadge() {
  const queryClient = useQueryClient();
  const { status, eventsCount, lastSyncTimestamp } = useRealtimeStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    setRealtimeStatus("syncing");
    try {
      await queryClient.refetchQueries({ type: "active" });
      setRealtimeStatus("connected", { lastSyncTimestamp: Date.now() });
      toast.success("Todos os dados da tela foram sincronizados com sucesso!");
    } catch {
      toast.error("Erro ao sincronizar dados com o servidor.");
      setRealtimeStatus("connected");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          label: "Ao Vivo",
          tooltip: "Sincronização em tempo real ativa",
          badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15",
          dotClass: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
          pulse: true,
          icon: Wifi,
        };
      case "syncing":
        return {
          label: "Sincronizando",
          tooltip: "Atualizando dados com o servidor...",
          badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/15",
          dotClass: "bg-amber-400",
          pulse: false,
          icon: RefreshCw,
        };
      case "reconnecting":
        return {
          label: "Reconectando",
          tooltip: "Restabelecendo conexão WebSocket...",
          badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/15",
          dotClass: "bg-amber-400 animate-pulse",
          pulse: true,
          icon: AlertTriangle,
        };
      case "offline":
      default:
        return {
          label: "Offline",
          tooltip: "Sem conexão com a internet ou WebSocket",
          badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/15",
          dotClass: "bg-rose-400",
          pulse: false,
          icon: WifiOff,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastSync = () => {
    if (!lastSyncTimestamp) return "Iniciando...";
    const diffSec = Math.max(0, Math.floor((Date.now() - lastSyncTimestamp) / 1000));
    if (diffSec < 5) return "Agora mesmo";
    if (diffSec < 60) return `Há ${diffSec} segundos`;
    const diffMin = Math.floor(diffSec / 60);
    return `Há ${diffMin} min atrás`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl border text-[11px] font-mono font-bold transition-all shadow-xs outline-none cursor-pointer select-none",
            config.badgeClass
          )}
          title={config.tooltip}
        >
          <span className="relative flex h-2 w-2">
            {config.pulse && (
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  config.dotClass
                )}
              />
            )}
            <span className={cn("relative inline-flex rounded-full h-2 w-2", config.dotClass)} />
          </span>
          <span className="hidden sm:inline">{config.label}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        className="w-80 p-4 surface-card border-border/80 shadow-2xl rounded-2xl space-y-3 text-xs"
      >
        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <p className="font-extrabold text-foreground text-xs leading-none">
                Sincronização em Tempo Real
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                WebSocket Supabase Realtime Ativo
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn("text-[10px] font-mono uppercase font-bold", config.badgeClass)}
          >
            {config.label}
          </Badge>
        </div>

        <div className="space-y-2 py-1 text-[11px]">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Eventos Processados:</span>
            </span>
            <strong className="text-foreground font-mono">{eventsCount}</strong>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Última Sincronização:</span>
            </span>
            <strong className="text-foreground font-mono">{formatLastSync()}</strong>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-sky-400" />
              <span>Modo Multi-Aba:</span>
            </span>
            <span className="text-emerald-400 font-mono font-bold">BroadcastChannel Ativo</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/50 text-[10px] text-muted-foreground space-y-1">
          <div className="flex items-center gap-1 font-bold text-foreground">
            <Info className="h-3 w-3 text-primary" />
            <span>Atualização Sem Reload</span>
          </div>
          <p className="leading-relaxed">
            Todas as alterações realizadas por membros, líderes ou administradores são propagadas imediatamente para a sua tela sem necessidade de recarregar a página.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleManualSync}
          disabled={isRefreshing}
          className="w-full h-8 text-xs font-bold rounded-xl gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          <span>{isRefreshing ? "Sincronizando..." : "Forçar Sincronização Agora"}</span>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
