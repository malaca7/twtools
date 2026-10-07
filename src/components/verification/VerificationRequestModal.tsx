import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  HelpCircle,
  ExternalLink,
  Info,
  Phone,
  Gamepad2,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { getLevelLabel, levelBadgeClass } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface VerificationRequestModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function VerificationRequestModal({
  open,
  onOpenChange,
  isOpen,
  onClose,
}: VerificationRequestModalProps) {
  const isModalOpen = open !== undefined ? open : Boolean(isOpen);
  const handleOpenChange = (val: boolean) => {
    onOpenChange?.(val);
    if (!val) onClose?.();
  };

  const { user, profile, level, hasPermission } = useAuth();
  const { data: config } = useVerificationConfig();
  const { data: myRequest, isLoading: loadingMyReq } = useMyVerificationRequest();
  const { submitRequestMutation, cancelRequestMutation } = useVerificationMutations();

  const [reason, setReason] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [customDeclarations, setCustomDeclarations] = useState<Record<string, boolean>>({});

  const canRequest = hasPermission("verification.request");
  const isAlreadyVerified = Boolean(profile?.is_verified);
  const isPending = myRequest?.status === "pendente";
  const isRejected = myRequest?.status === "rejeitado";

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
    enabled: Boolean(user?.id) && isModalOpen,
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

  const meetsAll = totalRequired === 0 || passedRequired === totalRequired;
  const canSubmit = !isAlreadyVerified && canRequest && allowSelfRequest && meetsAll && reason.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyVerified || !canSubmit) return;

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
      onOpenChange?.(false);
      onClose?.();
    } catch {
      // Toast handled by mutation
    }
  };

  const handleCancel = async () => {
    if (!myRequest) return;
    if (confirm("Deseja realmente cancelar sua solicitação de verificação?")) {
      await cancelRequestMutation.mutateAsync(myRequest.id);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg surface-card border-border/80 shadow-2xl overflow-hidden p-0">
        {/* HEADER */}
        <div className="p-5 bg-gradient-to-b from-sky-500/10 via-background/60 to-background border-b border-border/60">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-1.5">
                    <span>Selo de Verificado</span>
                    <VerifiedBadge isVerified={isAlreadyVerified} size="sm" noTooltip />
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Autenticação e reconhecimento oficial na comunidade Twin Wheels.
                  </DialogDescription>
                </div>
              </div>

              {isAlreadyVerified && (
                <Badge className="bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs font-bold gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verificado</span>
                </Badge>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* CASO 1: JÁ É VERIFICADO */}
          {isAlreadyVerified ? (
            <div className="p-6 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/20">
                <BadgeCheck className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Você é um Membro Verificado!</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Seu perfil possui o selo oficial de verificação ativo e exibido em todas as áreas da plataforma.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">Exibição do seu selo:</span>
                <VerifiedBadge isVerified size="md" showText />
              </div>
            </div>
          ) : isPending ? (
            /* CASO 2: SOLICITAÇÃO PENDENTE */
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Clock className="h-5 w-5 animate-pulse" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-bold text-amber-300 text-sm">Solicitação em Análise</h4>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {dateTime(myRequest.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/80">
                    Sua solicitação foi enviada com sucesso e está na fila de análise da liderança.
                  </p>
                  <div className="pt-2">
                    <p className="text-[11px] text-muted-foreground font-semibold">Justificativa enviada:</p>
                    <p className="text-xs text-foreground bg-background/60 p-2.5 rounded-xl border border-border/40 mt-1 italic">
                      "{myRequest.reason}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelRequestMutation.isPending}
                  className="h-8 text-xs rounded-xl border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                >
                  {cancelRequestMutation.isPending ? "Cancelando..." : "Cancelar Solicitação"}
                </Button>
              </div>
            </div>
          ) : (
            /* CASO 3: FORMULÁRIO DE SOLICITAÇÃO */
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRejected && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <XCircle className="h-4 w-4" />
                    <span>Solicitação anterior não aprovada</span>
                  </div>
                  {myRequest?.review_notes && (
                    <p className="text-[11px] text-rose-200/90">
                      Motivo: {myRequest.review_notes}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Você pode revisar seus dados e enviar uma nova solicitação abaixo.
                  </p>
                </div>
              )}

              {/* INSTRUÇÕES DA DIRETORIA */}
              {config?.requirements_config?.custom_instructions && (
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs flex items-start gap-2">
                  <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-sky-400 block tracking-wider">
                      Instruções da Diretoria
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {config.requirements_config.custom_instructions}
                    </p>
                  </div>
                </div>
              )}

              {/* AVISO SE AUTO-SOLICITAÇÃO ESTIVER DESATIVADA */}
              {!allowSelfRequest && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="h-4 w-4" />
                    <span>Auto-solicitação desativada</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80">
                    Novas solicitações de verificação foram temporariamente suspensas pela Diretoria Executiva. As concessões estão ocorrendo diretamente pela liderança.
                  </p>
                </div>
              )}

              {/* REQUISITOS SINCRONIZADOS DA DIRETORIA */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-sky-400" />
                    <span>Requisitos Oficiais da Diretoria</span>
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-mono py-0",
                      meetsAll
                        ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                        : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                    )}
                  >
                    {totalRequired > 0
                      ? `${passedRequired}/${totalRequired} Cumpridos`
                      : "Sem Requisitos"}
                  </Badge>
                </div>

                {loadingReqs ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
                    <span className="text-[11px]">Sincronizando requisitos...</span>
                  </div>
                ) : !reqs?.items || reqs.items.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    Nenhum requisito configurado pela Diretoria.
                  </p>
                ) : (
                  <div className="space-y-2 pt-1 text-xs">
                    {reqs.items.map((item) => {
                      const isCustom = item.category === "custom";
                      const isMet = isCustom ? Boolean(customDeclarations[item.id]) : item.isMet;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "p-2 rounded-lg border flex flex-col gap-1.5 transition-all",
                            isMet
                              ? "bg-emerald-500/5 border-emerald-500/25"
                              : item.isRequired
                              ? "bg-rose-500/5 border-rose-500/20"
                              : "bg-secondary/20 border-border/40"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-foreground font-medium flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{item.title}</span>
                              {item.isRequired ? (
                                <Badge variant="outline" className="text-[8px] py-0 px-1 border-rose-500/30 text-rose-400">
                                  Obrigatório
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[8px] py-0 px-1 text-muted-foreground">
                                  Opcional
                                </Badge>
                              )}
                            </span>
                            <span
                              className={cn(
                                "font-bold flex items-center gap-1 shrink-0 text-[11px]",
                                isMet ? "text-emerald-400" : "text-rose-400"
                              )}
                            >
                              {isMet ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              {item.currentValue || (isMet ? "Atendido" : "Pendente")}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            {item.message || item.description}
                          </p>
                          {isCustom && (
                            <div className="pt-1.5 border-t border-border/30 flex items-center gap-2">
                              <Checkbox
                                id={`modal-decl-${item.id}`}
                                checked={Boolean(customDeclarations[item.id])}
                                onCheckedChange={(checked) =>
                                  setCustomDeclarations((prev) => ({
                                    ...prev,
                                    [item.id]: Boolean(checked),
                                  }))
                                }
                              />
                              <label
                                htmlFor={`modal-decl-${item.id}`}
                                className="text-[10px] text-foreground cursor-pointer select-none leading-none"
                              >
                                Declaro que cumpro este requisito
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* FORMULÁRIO CURTO */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="verification-reason" className="text-xs font-semibold">
                    Por que você deve ser verificado? <span className="text-rose-400">*</span>
                  </Label>
                  <Textarea
                    id="verification-reason"
                    rows={3}
                    placeholder="Ex: Sou membro ativo da facção, opero diariamente nas ações e vendas..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-xs rounded-xl bg-background/80 resize-none"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Mínimo de 5 caracteres. Seja claro e objetivo.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="verification-doc" className="text-xs font-semibold">
                    Link de Comprovante / Print (Opcional)
                  </Label>
                  <Input
                    id="verification-doc"
                    type="url"
                    placeholder="https://imgur.com/..."
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                    className="h-8 text-xs rounded-xl bg-background/80"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-border/50 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit || submitRequestMutation.isPending}
                  className="text-xs rounded-xl font-bold bg-sky-500 hover:bg-sky-600 text-white gap-1.5 shadow-lg shadow-sky-500/20"
                >
                  {submitRequestMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Enviar Solicitação</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
