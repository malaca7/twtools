import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Terminal,
  Search,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Play,
  Loader2,
  Code2,
  Clock,
  ShieldCheck,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useAuditLogs, useMembers, nameOf } from "@/hooks/useData";
import { humanizeAuditLog } from "@/lib/format";
import type { AuditLog } from "@/lib/app-types";

interface DevAuditLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAuditActive: boolean;
  onTriggerTestLog: () => Promise<void>;
  triggeringTest: boolean;
}

export function DevAuditLogModal({
  open,
  onOpenChange,
  isAuditActive,
  onTriggerTestLog,
  triggeringTest,
}: DevAuditLogModalProps) {
  const { data: logs = [], isLoading, refetch } = useAuditLogs();
  const { data: members = [] } = useMembers();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "test" | "config" | "critical">("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtra apenas registros relacionados a ações Dev
  const devLogs = useMemo(() => {
    return logs.filter((l) => {
      const isDevAction =
        l.is_dev_action ||
        Boolean((l.new_data as any)?._meta?.is_dev_action) ||
        String(l.action || "").startsWith("dev_") ||
        String(l.action || "").includes("dev") ||
        String(l.entity || "").startsWith("dev_") ||
        String(l.entity || "").includes("dev");

      return isDevAction;
    });
  }, [logs]);

  // Aplica filtros de pesquisa e categoria
  const filteredLogs = useMemo(() => {
    return devLogs.filter((log) => {
      // Filtro de tipo
      if (filterType === "test" && log.action !== "test_dev_action") return false;
      if (
        filterType === "config" &&
        log.action !== "dev_setting_toggle" &&
        log.action !== "save_dev_configuration"
      ) {
        return false;
      }
      if (filterType === "critical" && (log.severity || "info") !== "critical") return false;

      // Filtro de busca textual
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const userName = log.user_id ? nameOf(members, log.user_id).toLowerCase() : "sistema";
      const actionClean = log.action.toLowerCase();
      const entityClean = log.entity.toLowerCase();
      const jsonStr = JSON.stringify(log.new_data || {}).toLowerCase();

      return (
        userName.includes(q) ||
        actionClean.includes(q) ||
        entityClean.includes(q) ||
        jsonStr.includes(q)
      );
    });
  }, [devLogs, filterType, search, members]);

  // Contadores analíticos
  const totalDevLogs = devLogs.length;
  const testLogsCount = devLogs.filter((l) => l.action === "test_dev_action").length;
  const lastEvent = devLogs[0];

  const handleCopyJson = (log: AuditLog) => {
    const payload = JSON.stringify(
      {
        id: log.id,
        action: log.action,
        entity: log.entity,
        user_id: log.user_id,
        created_at: log.created_at,
        severity: log.severity,
        new_data: log.new_data,
        old_data: log.old_data,
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopiedId(log.id);
    toast.success("Payload JSON copiado com sucesso!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 border-purple-500/30 bg-background/95 backdrop-blur-xl shadow-2xl">
        {/* Header com gradiente cyberpunk */}
        <DialogHeader className="p-5 border-b border-border/60 bg-gradient-to-r from-purple-950/40 via-background to-background">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-inner">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-extrabold text-foreground">
                    Auditoria de Ações Dev
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-purple-500/40 bg-purple-500/10 text-purple-400"
                  >
                    {totalDevLogs} registros
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Rastreamento, validação e inspeção detalhada de eventos executados no contexto de desenvolvimento
                </DialogDescription>
              </div>
            </div>

            {/* Status Live */}
            <div className="flex items-center gap-2">
              {isAuditActive ? (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono gap-1.5 py-1 px-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  GRAVANDO NO SERVIDOR
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] font-mono gap-1.5 py-1 px-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  GRAVAÇÃO SUPRIMIDA (SILENCIOSO)
                </Badge>
              )}
            </div>
          </div>

          {/* Cards de Métricas Rápidas */}
          <div className="grid grid-cols-3 gap-2 pt-3 mt-1">
            <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/40">
              <span className="text-[10px] font-medium text-muted-foreground block">Total de Logs Dev</span>
              <span className="text-lg font-black font-mono text-foreground">{totalDevLogs}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/40">
              <span className="text-[10px] font-medium text-muted-foreground block">Testes Disparados</span>
              <span className="text-lg font-black font-mono text-purple-400">{testLogsCount}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-secondary/30 border border-border/40">
              <span className="text-[10px] font-medium text-muted-foreground block">Último Evento</span>
              <span className="text-xs font-semibold text-foreground truncate block">
                {lastEvent ? new Date(lastEvent.created_at).toLocaleTimeString("pt-BR") : "Nenhum"}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar de Controle e Filtros */}
        <div className="p-3.5 border-b border-border/50 bg-secondary/15 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ação, desenvolvedor, entidade ou payload..."
              className="pl-8 h-8 text-xs bg-background/60"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <Button
              type="button"
              variant={filterType === "all" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => setFilterType("all")}
            >
              Todos ({devLogs.length})
            </Button>
            <Button
              type="button"
              variant={filterType === "test" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => setFilterType("test")}
            >
              Testes Dev ({testLogsCount})
            </Button>
            <Button
              type="button"
              variant={filterType === "config" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => setFilterType("config")}
            >
              Ajustes
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              onClick={() => void refetch()}
              disabled={isLoading}
              title="Atualizar registros agora"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-purple-500/40 text-purple-300 hover:text-white bg-purple-500/15 hover:bg-purple-500/25 font-semibold"
              onClick={onTriggerTestLog}
              disabled={triggeringTest}
            >
              {triggeringTest ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              Disparar Teste
            </Button>
          </div>
        </div>

        {/* Lista de Registros */}
        <ScrollArea className="flex-1 p-4 overflow-y-auto max-h-[55vh]">
          {filteredLogs.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 w-fit mx-auto border border-purple-500/20">
                <Terminal className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground">
                {search ? "Nenhum log corresponde à busca" : "Nenhum log de desenvolvedor gravado"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {search
                  ? "Tente buscar por outro termo ou limpe os filtros para visualizar os eventos existentes."
                  : isAuditActive
                  ? "A auditoria dev está ativada. Clique no botão abaixo para gerar uma ação de teste e validar a persistência."
                  : "A gravação de logs dev está desativada nos Ajustes Gerais. Ative o switch para registrar ações."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-purple-500/40 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20"
                onClick={onTriggerTestLog}
                disabled={triggeringTest}
              >
                {triggeringTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Disparar Primeiro Log de Teste
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map((log) => {
                const human = humanizeAuditLog(log, members);
                const isExpanded = expandedLogId === log.id;
                const memberObj = members.find((m) => m.user_id === log.user_id);
                const actorName = memberObj ? memberObj.nickname || memberObj.nome : "Desenvolvedor";
                const dateStr = new Date(log.created_at).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "medium",
                });

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-border/60 bg-secondary/20 hover:border-purple-500/40 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar className="h-7 w-7 border border-purple-500/30 shrink-0 mt-0.5">
                          {memberObj?.discord_avatar_url && (
                            <AvatarImage src={memberObj.discord_avatar_url} alt={actorName} />
                          )}
                          <AvatarFallback className="bg-purple-500/20 text-purple-300 font-bold text-[9px]">
                            {actorName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-foreground">{human.title}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] uppercase font-bold py-0 h-4 ${human.tagColor}`}
                            >
                              {human.tag}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {log.entity}
                            </span>
                          </div>

                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {human.description}
                          </p>

                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3" />
                              {dateStr}
                            </span>
                            <span>•</span>
                            <span>Por: <strong className="text-foreground">{actorName}</strong></span>
                            {log.user_agent && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[200px]" title={log.user_agent}>
                                  UA: {log.user_agent}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        >
                          <Code2 className="h-3 w-3" />
                          {isExpanded ? "Ocultar JSON" : "Ver JSON"}
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Detalhes Expandidos (JSON Payload Viewer) */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                            Payload e Metadados do Log (ID: {log.id})
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px] gap-1"
                            onClick={() => handleCopyJson(log)}
                          >
                            {copiedId === log.id ? (
                              <>
                                <Check className="h-2.5 w-2.5 text-emerald-400" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-2.5 w-2.5" />
                                Copiar JSON
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="p-3 rounded-lg bg-black/70 border border-purple-500/20 text-[11px] font-mono overflow-x-auto max-h-48 text-purple-200 shadow-inner">
                          <pre>
                            {JSON.stringify(
                              {
                                action: log.action,
                                entity: log.entity,
                                entity_id: log.entity_id,
                                user_id: log.user_id,
                                created_at: log.created_at,
                                severity: log.severity,
                                new_data: log.new_data,
                                old_data: log.old_data,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer com link para módulo geral */}
        <div className="p-3.5 border-t border-border/60 bg-background/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
            <Info className="h-3.5 w-3.5 text-purple-400" />
            <span>Logs dev recebem tag de auditoria exclusiva e são filtráveis na central de logs.</span>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/logs" search={{ module: "dev" } as any}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 border-border hover:border-purple-500/40"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir na Central de Logs
              </Button>
            </Link>

            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
