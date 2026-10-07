import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
  Send,
  HelpCircle,
  ExternalLink,
  Award,
  Star,
  UserCheck,
  Trophy,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Info,
  Layers,
  Phone,
  Gamepad2,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import {
  useVerificationConfig,
  useMyVerificationRequest,
  useVerificationMutations,
} from "@/hooks/useVerificationBadge";
import {
  getMemberVerificationRequirementsStatus,
  type VerificationRequirementsEvaluation,
} from "@/services/verificationBadgeService";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getLevelLabel, levelBadgeClass } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/solicitar-selo")({
  component: SolicitarSeloPageWrapper,
});

function SolicitarSeloPageWrapper() {
  const { profile, hasPermission } = useAuth();
  const isAlreadyVerified = Boolean(profile?.is_verified);

  if (isAlreadyVerified) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-12 animate-in fade-in-50 duration-300">
        <PageHeader
          title="Solicitar Verificação de Selo 🛡️"
          description="Página Oficial de Autenticação — Membro da Twin Wheels."
          actions={
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold px-3 py-1 flex items-center gap-1.5 shadow-sm">
              <BadgeCheck className="h-4 w-4 text-emerald-400" />
              <span>Verificado Ativo</span>
            </Badge>
          }
        />
        <Card className="surface-card border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-background shadow-xl overflow-hidden">
          <CardContent className="p-6 sm:p-10 space-y-6 text-center">
            <div className="mx-auto relative flex items-center justify-center h-24 w-24 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 shadow-xl shadow-emerald-500/10">
              <BadgeCheck className="h-12 w-12 text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500" />
              </span>
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-foreground">
                  {profile?.nickname || profile?.nome || "Membro"}
                </h2>
                <VerifiedBadge isVerified={true} size="md" />
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-extrabold">
                  Oficial Verificado
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Você já possui o <strong className="text-emerald-400">Selo Oficial de Verificação</strong> ativo no seu perfil. Como você já é um membro autenticado pela Diretoria Executiva da Twin Wheels, a página e o formulário de novas solicitações não estão disponíveis para sua conta.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-4 border-t border-border/50 text-xs">
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 text-left">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Status do Selo</p>
                <div className="flex items-center gap-1.5 mt-1 font-extrabold text-emerald-400 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Ativo & Reconhecido</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 text-left">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Exibição na Plataforma</p>
                <p className="font-extrabold text-foreground font-mono mt-1">Global (Todas as Telas)</p>
              </div>
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 text-left">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Autenticação</p>
                <p className="font-extrabold text-sky-400 font-mono mt-1">Oficial Twin Wheels</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button asChild size="default" className="bg-gradient-brand text-primary-foreground font-bold shadow-md w-full sm:w-auto h-10 px-6 gap-2">
                <Link to="/perfil">
                  <Award className="h-4 w-4" />
                  <span>Ver Meu Perfil</span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="default" className="border-border/70 hover:bg-secondary/60 w-full sm:w-auto h-10 px-6 gap-2">
                <Link to="/">
                  <span>Voltar ao Início</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission("verification.view_page")) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Solicitar Verificação"
          description="Selo oficial de membro verificado da Twin Wheels."
        />
        <NoAccess
          title="Acesso à Página de Solicitação Restrito"
          description="Você não possui a permissão 'Visualizar Página de Solicitação de Selo (/solicitar-selo)'. Entre em contato com a liderança para liberar seu acesso."
        />
      </div>
    );
  }
  return <SolicitarSeloContent />;
}

function SolicitarSeloContent() {
  const { user, profile, level, hasPermission } = useAuth();
  const { data: config, isLoading: loadingConfig } = useVerificationConfig();
  const { data: myRequest, isLoading: loadingMyReq } = useMyVerificationRequest();
  const { submitRequestMutation, cancelRequestMutation } = useVerificationMutations();

  const [reason, setReason] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [customDeclarations, setCustomDeclarations] = useState<Record<string, boolean>>({});

  const canRequest = hasPermission("verification.request");
  const canCancel = hasPermission("verification.cancel_own");

  const isAlreadyVerified = Boolean(profile?.is_verified);
  const isPending = myRequest?.status === "pendente";
  const isRejected = myRequest?.status === "rejeitado";

  // Avaliação em tempo real dos requisitos configurados no sistema
  const { data: reqs, isLoading: loadingReqs } = useQuery<VerificationRequirementsEvaluation>({
    queryKey: [
      "verification_requirements_status",
      user?.id,
      profile?.gamification_level,
      profile?.telefone,
      profile?.game_id,
      profile?.discord_username,
      profile?.discord_id,
      profile?.data_entrada,
      profile?.created_at,
      level,
      config?.requirements_config,
      config?.allow_self_request,
    ],
    queryFn: () => getMemberVerificationRequirementsStatus(user?.id, profile, level, config),
    enabled: Boolean(user?.id),
    staleTime: 10 * 1000,
  });

  const allowSelfRequest = config?.allow_self_request !== false;

  const requiredItems = useMemo(() => reqs?.items?.filter((i) => i.isRequired) || [], [reqs]);
  const totalRequired = requiredItems.length;

  const passedRequired = useMemo(() => {
    return requiredItems.filter((i) => {
      if (i.category === "custom") return Boolean(customDeclarations[i.id]);
      return i.isMet;
    }).length;
  }, [requiredItems, customDeclarations]);

  const meetsAllRequirements = totalRequired === 0 || passedRequired === totalRequired;
  const progressPct = totalRequired > 0 ? (passedRequired / totalRequired) * 100 : 100;

  const canSubmit =
    !isAlreadyVerified &&
    canRequest &&
    allowSelfRequest &&
    meetsAllRequirements &&
    !isPending &&
    reason.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyVerified) {
      toast.error("Você já possui o selo de verificado ativo e não pode enviar nova solicitação!");
      return;
    }
    if (!allowSelfRequest) {
      toast.error("O envio de novas solicitações foi temporariamente desativado pela Diretoria Executiva.");
      return;
    }
    if (!canSubmit) return;

    try {
      await submitRequestMutation.mutateAsync({
        reason: reason.trim(),
        document_url: documentUrl.trim() || null,
        extra_data: {
          custom_declarations: customDeclarations,
        },
      });
      setReason("");
      setDocumentUrl("");
    } catch {
      // Toast disparado na mutação
    }
  };

  const handleCancel = async () => {
    if (!myRequest) return;
    if (confirm("Deseja realmente cancelar sua solicitação de verificação?")) {
      await cancelRequestMutation.mutateAsync(myRequest.id);
    }
  };

  const memberDisplayName = profile?.nickname || profile?.nome || "Membro";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* CABEÇALHO */}
      <PageHeader
        title="Solicitar Verificação de Selo 🛡️"
        description="Página Oficial do Membro — Acompanhe seus requisitos operacionais e solicite a verificação de autenticidade da Twin Wheels."
        actions={
          <div className="flex items-center gap-2">
            {isAlreadyVerified ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold px-3 py-1 flex items-center gap-1.5 shadow-sm">
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
                <span>Verificado Ativo</span>
              </Badge>
            ) : isPending ? (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-bold px-3 py-1 flex items-center gap-1.5 shadow-sm">
                <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
                <span>Em Análise</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-mono font-bold border-sky-500/30 text-sky-400 px-3 py-1">
                Selo Disponível
              </Badge>
            )}
          </div>
        }
      />

      {/* CASO 1: MEMBRO JÁ ESTÁ VERIFICADO */}
      {isAlreadyVerified && (
        <Card className="surface-card border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-background shadow-lg overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <div className="relative flex items-center justify-center h-20 w-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 shadow-inner">
                <BadgeCheck className="h-10 w-10 text-emerald-400" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                </span>
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-foreground">{memberDisplayName}</h3>
                  <VerifiedBadge isVerified={true} size="md" />
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-extrabold">
                    Membro Oficial Verificado
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Seu perfil possui o selo de autenticidade concedido e validado pela Diretoria Executiva da Twin Wheels.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/50 text-xs">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Status do Selo</p>
                <p className="font-extrabold text-emerald-400 font-mono mt-0.5">Ativo & Sincronizado</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Exibição na Plataforma</p>
                <p className="font-extrabold text-foreground font-mono mt-0.5">Global (Todos os Módulos)</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Seu Perfil Público</p>
                <Link
                  to="/perfil"
                  className="font-extrabold text-primary hover:underline flex items-center gap-1 mt-0.5 font-mono"
                >
                  <span>Ver Meu Perfil</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CASO 2: SOLICITAÇÃO PENDENTE DE ANÁLISE */}
      {!isAlreadyVerified && isPending && myRequest && (
        <Card className="surface-card border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-background shadow-lg">
          <CardContent className="p-6 sm:p-7 space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-foreground">Solicitação em Análise pela Diretoria</h3>
                  <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300 bg-amber-500/10">
                    Pendente
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Seu pedido de verificação foi registrado e está na fila de avaliação dos administradores e líderes.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Data do Envio:</span>
                <span className="font-mono font-bold text-foreground">{dateTime(myRequest.created_at)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sua Justificativa:</span>
                <p className="font-medium text-foreground mt-1 p-2.5 rounded-lg bg-background/60 border border-border/40 italic">
                  "{myRequest.reason}"
                </p>
              </div>
            </div>

            {canCancel && (
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelRequestMutation.isPending}
                  className="text-xs font-bold border-rose-500/40 text-rose-400 hover:bg-rose-500/10 gap-1.5 h-9"
                >
                  {cancelRequestMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Cancelar Solicitação</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CASO 3: ÚLTIMA SOLICITAÇÃO REJEITADA */}
      {!isAlreadyVerified && isRejected && myRequest && (
        <Card className="surface-card border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-card to-background shadow-lg">
          <CardContent className="p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-rose-400 font-bold">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>Sua solicitação anterior foi rejeitada</span>
            </div>
            {myRequest.review_notes && (
              <p className="text-muted-foreground p-3 rounded-lg bg-secondary/30 border border-border/40">
                <strong className="text-foreground">Motivo informado pela liderança:</strong> {myRequest.review_notes}
              </p>
            )}
            <p className="text-muted-foreground">
              Você pode submeter uma nova solicitação caso atenda a todos os requisitos obrigatórios abaixo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* INSTRUÇÕES DA DIRETORIA EXECUTIVA */}
      {config?.requirements_config?.custom_instructions && (
        <Card className="surface-card border-sky-500/30 bg-sky-500/5 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3 text-xs">
            <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-foreground text-xs uppercase tracking-wider text-sky-400">
                Orientações da Diretoria Executiva
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {config.requirements_config.custom_instructions}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AVISO SE AUTO-SOLICITAÇÃO ESTIVER DESATIVADA PELA LIDERANÇA */}
      {!allowSelfRequest && !isAlreadyVerified && (
        <Card className="surface-card border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3.5 text-xs text-amber-300">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-foreground text-sm">Auto-Solicitação Desativada pela Diretoria</p>
              <p className="text-muted-foreground leading-relaxed">
                O envio de novas solicitações diretas pelo membro foi temporariamente suspenso pela Diretoria Executiva da Twin Wheels. As verificações estão ocorrendo exclusivamente por indicação direta da liderança.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CARD DOS REQUISITOS CONFIGURADOS */}
      <Card className="surface-card">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-extrabold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span>Requisitos Oficiais para Verificação</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Critérios operacionais sincronizados em tempo real com a gestão da Twin Wheels
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-mono font-bold px-3 py-1 self-start sm:self-auto",
                meetsAllRequirements
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500/40 text-amber-400 bg-amber-500/10"
              )}
            >
              {totalRequired > 0
                ? `${passedRequired} de ${totalRequired} Requisitos Obrigatórios Atendidos (${progressPct.toFixed(0)}%)`
                : "Solicitação Aberta (Sem restrições configuradas)"}
            </Badge>
          </div>
          {totalRequired > 0 && (
            <div className="pt-2">
              <Progress value={progressPct} className="h-2 bg-secondary" />
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-3">
          {loadingReqs || loadingConfig ? (
            <div className="py-6 flex items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs">Sincronizando requisitos com a liderança...</span>
            </div>
          ) : !reqs?.items || reqs.items.length === 0 ? (
            <div className="p-4 rounded-xl bg-secondary/30 text-center text-xs text-muted-foreground">
              Nenhum requisito configurado. Qualquer membro ativo pode solicitar o selo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reqs.items.map((item, idx) => {
                const isCustom = item.category === "custom";
                const isMet = isCustom ? Boolean(customDeclarations[item.id]) : item.isMet;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5",
                      isMet
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : item.isRequired
                        ? "bg-rose-500/5 border-rose-500/25"
                        : "bg-secondary/20 border-border/60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black",
                          isMet
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : item.isRequired
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : "bg-secondary text-muted-foreground border border-border"
                        )}
                      >
                        {isMet ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5 flex-1">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <p className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                            <span>{idx + 1}. {item.title}</span>
                          </p>
                          <div className="flex items-center gap-1">
                            {item.isRequired ? (
                              <Badge variant="outline" className="text-[9px] font-mono py-0 border-rose-500/30 text-rose-400 bg-rose-500/10">
                                Obrigatório
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] font-mono py-0 text-muted-foreground">
                                Opcional
                              </Badge>
                            )}
                            {item.currentValue && (
                              <Badge variant="outline" className="text-[9px] font-mono py-0">
                                {item.currentValue}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {item.message || item.description}
                        </p>
                      </div>
                    </div>

                    {/* CONFIRMAÇÃO DECLARATÓRIA DE REQUISITO CUSTOMIZADO */}
                    {isCustom && (
                      <div className="pt-2 border-t border-border/40 flex items-center gap-2">
                        <Checkbox
                          id={`req-check-${item.id}`}
                          checked={Boolean(customDeclarations[item.id])}
                          onCheckedChange={(checked) =>
                            setCustomDeclarations((prev) => ({
                              ...prev,
                              [item.id]: Boolean(checked),
                            }))
                          }
                        />
                        <label
                          htmlFor={`req-check-${item.id}`}
                          className="text-[11px] font-medium text-foreground cursor-pointer select-none leading-none"
                        >
                          Declaro e confirmo que cumpro este critério
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FORMULÁRIO DE SOLICITAÇÃO (SE NÃO ESTIVER VERIFICADO, NÃO ESTIVER PENDENTE, POSSUIR PERMISSÃO E PERMITIR AUTO-SOLICITAÇÃO) */}
      {!isAlreadyVerified && !isPending && canRequest && allowSelfRequest && (
        <Card className="surface-card">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              <span>Formulário de Solicitação de Selo</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Preencha uma breve justificativa para envio à Diretoria Executiva
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="req-reason" className="text-xs font-bold text-foreground">
                  Motivo / Justificativa da Solicitação <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="req-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explique brevemente por que você deseja a verificação de autenticidade (ex.: Membro ativo em operações, produtor dedicado, etc.)..."
                  className="min-h-[100px] text-xs resize-none"
                  disabled={!meetsAllRequirements || submitRequestMutation.isPending}
                />
                <p className="text-[11px] text-muted-foreground">
                  Mínimo de 5 caracteres. Seja claro e objetivo.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="req-doc" className="text-xs font-bold text-foreground">
                  Link Adicional ou Comprovante <span className="text-muted-foreground font-normal">(Opcional)</span>
                </Label>
                <Input
                  id="req-doc"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://discord.com/... ou link de imagem/comprovante"
                  className="h-9 text-xs font-mono"
                  disabled={!meetsAllRequirements || submitRequestMutation.isPending}
                />
              </div>

              {!meetsAllRequirements && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Você precisa cumprir e confirmar todos os requisitos obrigatórios da Diretoria acima antes de submeter a solicitação de verificação.
                  </span>
                </div>
              )}

              <Button
                type="submit"
                disabled={!canSubmit || submitRequestMutation.isPending}
                className="w-full h-11 bg-gradient-brand text-primary-foreground font-bold hover:opacity-90 shadow-md cursor-pointer rounded-xl text-xs gap-2"
              >
                {submitRequestMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enviando solicitação...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Enviar Solicitação de Verificação</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* AVISO QUANDO NÃO POSSUIR PERMISSÃO PARA ENVIAR SOLICITAÇÃO */}
      {!isAlreadyVerified && !isPending && !canRequest && (
        <Card className="surface-card border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardContent className="p-5 flex items-start gap-3.5 text-xs text-amber-300">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-foreground text-sm">Permissão 'Enviar Solicitação de Verificação' Desativada</p>
              <p className="text-muted-foreground leading-relaxed">
                Você possui acesso a esta página para acompanhar os requisitos, porém a permissão para enviar solicitações não está habilitada para seu perfil ou cargo. Entre em contato com a diretoria caso necessite submeter um pedido de verificação.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
