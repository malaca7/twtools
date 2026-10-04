import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  Clock,
  CheckCircle2,
  Calendar,
  Lock,
  ChevronRight,
  ExternalLink,
  ShoppingCart,
  SlidersHorizontal,
  Factory,
  Landmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMemberWarnings, useAcknowledgeWarningMutation } from "@/hooks/useWarnings";
import { MemberTagBadge } from "@/components/ui/MemberTagBadge";
import { cn } from "@/lib/utils";

export function SuspensionAlertBanner() {
  const { user, activeSuspension, isSuspended, memberTags } = useAuth();
  const { data: memberWarnings = [] } = useMemberWarnings(user?.id);
  const acknowledgeMutation = useAcknowledgeWarningMutation();

  // Encontra advertência ativa pendente de ciência (se houver)
  const unacknowledgedWarning = memberWarnings.find(
    (w) => w.status === "ativo" && !w.acknowledged_at
  );

  // Encontra tags ativas com regras de bloqueio operacional
  const restrictingTags = memberTags.filter(
    (t) =>
      t.is_active !== false &&
      (t.rules?.is_blocked ||
        t.rules?.block_operations ||
        t.rules?.block_sales ||
        t.rules?.block_movements ||
        t.rules?.block_productions ||
        t.rules?.block_cash_fund)
  );

  // Se não houver suspensão ativa, advertência pendente nem tags com restrições, não renderiza nada
  if (!isSuspended && !unacknowledgedWarning && restrictingTags.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-2 mb-4 animate-in fade-in-50 duration-300">
      {/* BANNER 1: SUSPENSÃO ATIVA */}
      {isSuspended && activeSuspension && (
        <div className="relative overflow-hidden rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-background p-4 shadow-lg shadow-rose-950/20 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Ban className="h-6 w-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="destructive" className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
                    {activeSuspension.type === "advertencia"
                      ? "⚠️ Advertência com Restrições Ativas"
                      : activeSuspension.suspension_type === "permanente"
                      ? "🚫 Suspensão Permanente"
                      : "🚫 Suspensão Temporária"}
                  </Badge>
                  <span className="text-xs font-semibold text-rose-300">
                    Motivo: {activeSuspension.reason}
                  </span>
                </div>

                <p className="text-xs text-rose-200/90 line-clamp-2">
                  {activeSuspension.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono text-rose-300">
                    <Clock className="h-3 w-3" />
                    {activeSuspension.ends_at ? (
                      <>Expira em: {new Date(activeSuspension.ends_at).toLocaleString("pt-BR")}</>
                    ) : (
                      <>Duração: Indeterminada / Permanente</>
                    )}
                  </span>
                  <span>Aplicado por: <strong className="text-foreground">{activeSuspension.admin_name}</strong></span>
                </div>

                {/* Exibição resumida dos bloqueios ativos */}
                {activeSuspension.blocks && Object.values(activeSuspension.blocks).some(Boolean) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    <span className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Bloqueios:
                    </span>
                    {activeSuspension.blocks.block_all_operations && (
                      <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                        Operações Totais
                      </Badge>
                    )}
                    {activeSuspension.blocks.block_login && (
                      <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                        Acesso Plataforma
                      </Badge>
                    )}
                    {activeSuspension.blocks.block_sales && (
                      <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                        Vendas
                      </Badge>
                    )}
                    {activeSuspension.blocks.block_movements && (
                      <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                        Movimentações / Baú
                      </Badge>
                    )}
                    {activeSuspension.blocks.block_productions && (
                      <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                        Produção / Armazém
                      </Badge>
                    )}
                    {activeSuspension.blocks.block_cash_fund && (
                      <Badge variant="outline" className="text-[10px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                        Fundo de Caixa
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Link to="/perfil/advertencias">
                <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 gap-1.5 rounded-lg">
                  <span>Ver Histórico</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* BANNER 2: ADVERTÊNCIA PENDENTE DE CONFIRMAÇÃO DE CIÊNCIA */}
      {unacknowledgedWarning && !isSuspended && (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/70 via-amber-900/30 to-background p-4 shadow-lg shadow-amber-950/20 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-bold border-amber-500/50 text-amber-400 bg-amber-500/10 text-[10px] px-2 py-0.5">
                    ⚠️ Advertência Disciplinar ({unacknowledgedWarning.severity.toUpperCase()})
                  </Badge>
                  <span className="text-xs font-semibold text-amber-300">
                    Motivo: {unacknowledgedWarning.reason}
                  </span>
                </div>

                <p className="text-xs text-amber-200/90 line-clamp-2">
                  {unacknowledgedWarning.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                  <span>Aplicada em: {new Date(unacknowledgedWarning.starts_at).toLocaleDateString("pt-BR")}</span>
                  <span>Por: <strong className="text-foreground">{unacknowledgedWarning.admin_name}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                size="sm"
                onClick={() => acknowledgeMutation.mutate(unacknowledgedWarning.id)}
                disabled={acknowledgeMutation.isPending}
                className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black gap-1.5 rounded-lg shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirmar Ciência</span>
              </Button>

              <Link to="/perfil/advertencias">
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                  Detalhes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* BANNER 3: RESTRIÇÕES OPERACIONAIS ATIVAS POR TAG */}
      {restrictingTags.length > 0 && !isSuspended && (
        <div className="relative overflow-hidden rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/60 via-rose-900/20 to-background p-3.5 shadow-md backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <ShieldAlert className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="destructive" className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
                    🛡️ Restrições Operacionais Ativas
                  </Badge>
                  <span className="text-xs font-semibold text-rose-300">
                    Aplicadas pelas suas Tags de Membro
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Tags Restritivas:
                  </span>
                  {restrictingTags.map((t) => (
                    <MemberTagBadge key={t.id} tag={t} size="sm" showIcon />
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Ações Bloqueadas:
                  </span>
                  {restrictingTags.some((t) => t.rules?.is_blocked || t.rules?.block_operations) && (
                    <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                      Operações Totais
                    </Badge>
                  )}
                  {restrictingTags.some((t) => t.rules?.block_sales) && (
                    <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                      Vendas
                    </Badge>
                  )}
                  {restrictingTags.some((t) => t.rules?.block_movements) && (
                    <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                      Movimentações de Baú
                    </Badge>
                  )}
                  {restrictingTags.some((t) => t.rules?.block_productions) && (
                    <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                      Produção & Armazém
                    </Badge>
                  )}
                  {restrictingTags.some((t) => t.rules?.block_cash_fund) && (
                    <Badge variant="outline" className="text-[9px] border-rose-500/40 text-rose-300 bg-rose-500/10">
                      Fundo de Caixa
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Link to="/perfil/advertencias">
                <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 gap-1.5 rounded-lg">
                  <span>Prontuário</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
