import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  Clock,
  CheckCircle2,
  Calendar,
  Lock,
  User,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  Info,
  ShieldCheck,
  Check,
  FileText,
  AlertOctagon,
  Sparkles,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useMemberWarnings, useAcknowledgeWarningMutation } from "@/hooks/useWarnings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/perfil/advertencias")({
  component: PerfilAdvertenciasPage,
});

export function PerfilAdvertenciasPage() {
  const { user, profile, activeSuspension, isSuspended } = useAuth();
  const { data: warnings = [], isLoading, refetch, isRefetching } = useMemberWarnings(user?.id);
  const acknowledgeMutation = useAcknowledgeWarningMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspension" | "warning" | "unacknowledged" | "archived">("all");

  const activeWarnings = useMemo(() => warnings.filter((w) => w.status === "ativo"), [warnings]);
  const activeCount = activeWarnings.length;
  const unacknowledgedCount = useMemo(
    () => warnings.filter((w) => w.status === "ativo" && !w.acknowledged_at).length,
    [warnings]
  );
  const activeSuspensionsCount = useMemo(
    () => activeWarnings.filter((w) => w.is_suspension || w.type === "suspensao").length,
    [activeWarnings]
  );

  const filteredWarnings = useMemo(() => {
    return warnings.filter((w) => {
      const isSusp = w.is_suspension || w.type === "suspensao";
      const isUnack = w.status === "ativo" && !w.acknowledged_at;
      const isArchived = w.status === "expirado" || w.status === "revogado";

      if (statusFilter === "active" && w.status !== "ativo") return false;
      if (statusFilter === "suspension" && (!isSusp || w.status !== "ativo")) return false;
      if (statusFilter === "warning" && (isSusp || w.status !== "ativo")) return false;
      if (statusFilter === "unacknowledged" && !isUnack) return false;
      if (statusFilter === "archived" && !isArchived) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchReason = w.reason?.toLowerCase().includes(q);
        const matchDesc = w.description?.toLowerCase().includes(q);
        const matchAdmin = w.admin_name?.toLowerCase().includes(q);
        const matchType = w.type?.toLowerCase().includes(q);
        if (!matchReason && !matchDesc && !matchAdmin && !matchType) return false;
      }

      return true;
    });
  }, [warnings, statusFilter, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* CABEÇALHO COM NAVEGAÇÃO E STATUS GERAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <Link
              to="/perfil"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors bg-secondary/60 hover:bg-secondary px-2.5 py-1 rounded-lg border border-border/50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar ao Meu Perfil</span>
            </Link>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold px-2 py-0.5",
                activeCount > 0
                  ? "border-rose-500/40 text-rose-400 bg-rose-500/10"
                  : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
              )}
            >
              {activeCount > 0 ? `${activeCount} Penalidade(s) Ativa(s)` : "Ficha Limpa"}
            </Badge>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-rose-500" />
            <span>Prontuário Disciplinar & Advertências</span>
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Histórico oficial de termos de conduta, advertências operacionais, bloqueios e suspensões aplicadas pela liderança.
          </p>
        </div>

        <div className="flex items-center gap-2 z-10 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 text-xs font-bold gap-1.5 border-border/80 hover:bg-secondary cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            <span>Atualizar</span>
          </Button>
          <Link to="/perfil">
            <Button
              type="button"
              size="sm"
              className="h-9 text-xs font-bold gap-1.5 bg-gradient-brand text-primary-foreground shadow-sm cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              <span>Meu Perfil</span>
            </Button>
          </Link>
        </div>

        {/* Gradiente sutil de fundo */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: STATUS GERAL */}
        <Card className="surface-card border-border/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Situação Cadastral
              </p>
              <h3 className="text-base font-extrabold text-foreground mt-1 flex items-center gap-1.5">
                {isSuspended ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <Ban className="h-4 w-4" /> Suspenso
                  </span>
                ) : activeCount > 0 ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Com Advertência
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" /> Ficha Limpa
                  </span>
                )}
              </h3>
            </div>
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center border",
                activeCount > 0
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              )}
            >
              {activeCount > 0 ? <AlertOctagon className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </div>
          </div>
        </Card>

        {/* CARD 2: PENALIDADES ATIVAS */}
        <Card className="surface-card border-border/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Penalidades Ativas
              </p>
              <h3 className="text-xl font-black text-foreground mt-1">
                {activeCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* CARD 3: SUSPENSÕES VIGENTES */}
        <Card className="surface-card border-border/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Suspensões Vigentes
              </p>
              <h3 className="text-xl font-black text-foreground mt-1">
                {activeSuspensionsCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Ban className="h-5 w-5" />
            </div>
          </div>
        </Card>

        {/* CARD 4: PENDENTES DE CIÊNCIA */}
        <Card className="surface-card border-border/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Pendentes de Ciência
              </p>
              <h3 className="text-xl font-black text-foreground mt-1">
                {unacknowledgedCount}
              </h3>
            </div>
            <div
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center border",
                unacknowledgedCount > 0
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse"
                  : "bg-secondary border-border/60 text-muted-foreground"
              )}
            >
              <FileText className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* SUSPENSÃO ATIVA EM DESTAQUE */}
      {isSuspended && activeSuspension && (
        <div className="p-5 rounded-2xl border border-rose-500/60 bg-gradient-to-r from-rose-950/90 via-rose-900/50 to-background shadow-xl shadow-rose-950/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                <Ban className="h-7 w-7 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="destructive" className="font-black text-xs uppercase px-2.5 py-0.5">
                    🚫 Suspensão Operacional Ativa
                  </Badge>
                  <Badge variant="outline" className="text-xs uppercase font-bold border-rose-400 text-rose-200">
                    {activeSuspension.severity}
                  </Badge>
                  <span className="font-bold text-sm text-rose-100">
                    {activeSuspension.reason}
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 whitespace-pre-wrap leading-relaxed">
                  {activeSuspension.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1.5 text-xs text-rose-300/80">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5 text-rose-400" />
                    {activeSuspension.ends_at ? (
                      <>Expira em: <strong>{new Date(activeSuspension.ends_at).toLocaleString("pt-BR")}</strong></>
                    ) : (
                      <strong>Suspensão Permanente / Indeterminada</strong>
                    )}
                  </span>
                  <span>Aplicado por: <strong className="text-white">{activeSuspension.admin_name}</strong></span>
                </div>
              </div>
            </div>

            {/* Bloqueios funcionais ativos */}
            {activeSuspension.blocks && Object.values(activeSuspension.blocks).some(Boolean) && (
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-black/40 border border-rose-500/30 shrink-0 text-xs">
                <span className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Bloqueios em Vigor:
                </span>
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {activeSuspension.blocks.block_all_operations && (
                    <Badge variant="outline" className="text-[10px] border-rose-500/50 text-rose-300 bg-rose-500/10">
                      Operações Totais
                    </Badge>
                  )}
                  {activeSuspension.blocks.block_sales && (
                    <Badge variant="outline" className="text-[10px] border-rose-500/50 text-rose-300 bg-rose-500/10">
                      Vendas
                    </Badge>
                  )}
                  {activeSuspension.blocks.block_movements && (
                    <Badge variant="outline" className="text-[10px] border-rose-500/50 text-rose-300 bg-rose-500/10">
                      Retiradas de Baú
                    </Badge>
                  )}
                  {activeSuspension.blocks.block_productions && (
                    <Badge variant="outline" className="text-[10px] border-rose-500/50 text-rose-300 bg-rose-500/10">
                      Produções & Armazém
                    </Badge>
                  )}
                  {activeSuspension.blocks.block_cash_fund && (
                    <Badge variant="outline" className="text-[10px] border-rose-500/50 text-rose-300 bg-rose-500/10">
                      Fundo de Caixa
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILTROS E BUSCA */}
      <Card className="surface-card border-border/70 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por motivo, descrição ou administrador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-secondary/40"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 sm:pb-0">
            <Button
              type="button"
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="h-8 text-xs font-bold rounded-lg cursor-pointer"
            >
              Todas ({warnings.length})
            </Button>
            <Button
              type="button"
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
              className="h-8 text-xs font-bold rounded-lg cursor-pointer"
            >
              Ativas ({activeCount})
            </Button>
            <Button
              type="button"
              variant={statusFilter === "suspension" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("suspension")}
              className="h-8 text-xs font-bold rounded-lg cursor-pointer text-rose-400"
            >
              Suspensões ({activeSuspensionsCount})
            </Button>
            <Button
              type="button"
              variant={statusFilter === "warning" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("warning")}
              className="h-8 text-xs font-bold rounded-lg cursor-pointer text-amber-400"
            >
              Advertências ({activeCount - activeSuspensionsCount})
            </Button>
            {unacknowledgedCount > 0 && (
              <Button
                type="button"
                variant={statusFilter === "unacknowledged" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("unacknowledged")}
                className="h-8 text-xs font-bold rounded-lg cursor-pointer border-amber-500/40 text-amber-300"
              >
                Pendente Ciência ({unacknowledgedCount})
              </Button>
            )}
            <Button
              type="button"
              variant={statusFilter === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("archived")}
              className="h-8 text-xs font-bold rounded-lg cursor-pointer text-muted-foreground"
            >
              Histórico / Expiradas
            </Button>
          </div>
        </div>
      </Card>

      {/* LISTA COMPLETA DE ADVERTÊNCIAS & PENALIDADES */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="surface-card p-12 text-center text-xs text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
            Carregando histórico disciplinar...
          </Card>
        ) : filteredWarnings.length === 0 ? (
          <Card className="surface-card p-12 text-center flex flex-col items-center justify-center space-y-3 border border-dashed border-border/70">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {warnings.length === 0
                  ? "Parabéns! Nenhuma advertência registrada"
                  : "Nenhum registro encontrado para os filtros selecionados"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                {warnings.length === 0
                  ? "Você mantém uma conduta exemplar na organização e não possui advertências ou suspensões registradas. Continue assim!"
                  : "Tente limpar os termos de busca ou selecionar outra categoria no filtro."}
              </p>
            </div>
            {warnings.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="h-8 text-xs"
              >
                Limpar Filtros
              </Button>
            )}
          </Card>
        ) : (
          filteredWarnings.map((warn) => {
            const isSusp = warn.is_suspension || warn.type === "suspensao";
            const isUnacknowledged = warn.status === "ativo" && !warn.acknowledged_at;
            const isPendingMutation = acknowledgeMutation.isPending && acknowledgeMutation.variables === warn.id;

            return (
              <Card
                key={warn.id}
                className={cn(
                  "surface-card border transition-all text-xs overflow-hidden",
                  warn.status === "ativo" && isSusp && "border-rose-500/50 bg-rose-950/15 shadow-sm shadow-rose-950/10",
                  warn.status === "ativo" && !isSusp && "border-amber-500/50 bg-amber-950/15 shadow-sm shadow-amber-950/10",
                  warn.status !== "ativo" && "border-border/60 bg-card/60 opacity-85"
                )}
              >
                <div className="p-4 sm:p-5 space-y-3">
                  {/* LINHA SUPERIOR: BADGES & STATUS */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={isSusp ? "destructive" : "outline"}
                        className={cn(
                          "text-[10px] font-extrabold uppercase px-2 py-0.5",
                          !isSusp && "border-amber-500/60 text-amber-300 bg-amber-500/10"
                        )}
                      >
                        {isSusp ? "🚫 Suspensão" : "⚠️ Advertência"}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          warn.severity === "gravissima" && "border-rose-500 text-rose-300 bg-rose-500/10",
                          warn.severity === "grave" && "border-orange-500 text-orange-300 bg-orange-500/10",
                          warn.severity === "media" && "border-amber-500 text-amber-300 bg-amber-500/10",
                          warn.severity === "leve" && "border-sky-500 text-sky-300 bg-sky-500/10"
                        )}
                      >
                        Gravidade: {warn.severity}
                      </Badge>

                      <h3 className="font-extrabold text-foreground text-sm sm:text-base">
                        {warn.reason}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {warn.applied_tag_id && (
                        <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary border border-primary/30 flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5" /> Tag: {warn.applied_tag_id}
                        </Badge>
                      )}
                      {warn.status === "ativo" ? (
                        <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/40 text-emerald-400 bg-emerald-500/10 gap-1 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Penalidade Ativa
                        </Badge>
                      ) : warn.status === "expirado" ? (
                        <Badge variant="secondary" className="text-[10px] font-bold text-muted-foreground">
                          Expirada pelo Tempo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold border-purple-500/40 text-purple-300 bg-purple-500/10">
                          Revogada / Anistiada
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* DESCRIÇÃO / DETALHES DO MOTIVO */}
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed bg-secondary/30 p-3 rounded-xl border border-border/40 font-normal">
                    {warn.description}
                  </p>

                  {/* BLOQUEIOS OPERACIONAIS ATIVOS */}
                  {warn.blocks && Object.values(warn.blocks).some(Boolean) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Bloqueios Aplicados:
                      </span>
                      {warn.blocks.block_all_operations && (
                        <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                          Operações Totais
                        </Badge>
                      )}
                      {warn.blocks.block_login && (
                        <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                          Acesso Plataforma
                        </Badge>
                      )}
                      {warn.blocks.block_sales && (
                        <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                          Vendas
                        </Badge>
                      )}
                      {warn.blocks.block_movements && (
                        <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                          Retiradas de Baú
                        </Badge>
                      )}
                      {warn.blocks.block_productions && (
                        <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                          Produções & Armazém
                        </Badge>
                      )}
                      {warn.blocks.block_cash_fund && (
                        <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                          Fundo de Caixa
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* RODAPÉ DO CARD: METADADOS & BOTÃO DE CIÊNCIA INTEGRADO */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-3 flex-wrap font-mono">
                      <span>Data de Aplicação: <strong>{new Date(warn.starts_at).toLocaleDateString("pt-BR")}</strong></span>
                      {warn.ends_at && (
                        <span className="text-foreground/90">
                          Expira em: <strong>{new Date(warn.ends_at).toLocaleString("pt-BR")}</strong>
                        </span>
                      )}
                      <span>Líder Responsável: <strong className="text-foreground font-sans">{warn.admin_name}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isUnacknowledged ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => acknowledgeMutation.mutate(warn.id)}
                          disabled={isPendingMutation}
                          className="h-8 px-4 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black cursor-pointer shadow-sm gap-1.5 rounded-xl active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{isPendingMutation ? "Registrando Ciência..." : "Confirmar Ciência"}</span>
                        </Button>
                      ) : warn.acknowledged_at ? (
                        <span className="text-emerald-400 font-bold inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ciência confirmada em {new Date(warn.acknowledged_at).toLocaleDateString("pt-BR")}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* MOTIVO DE REVOGAÇÃO (SE HOUVER) */}
                  {warn.status === "revogado" && warn.revocation_reason && (
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2">
                      <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Motivo da Revogação / Anistia:</strong> {warn.revocation_reason}
                        {warn.revoked_by_name && (
                          <span className="block text-[10px] text-purple-300/80 mt-0.5 font-mono">
                            Revogado por: {warn.revoked_by_name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
