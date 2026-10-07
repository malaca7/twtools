import { useState } from "react";
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

  const canRequest = hasPermission("verification.request");
  const isAlreadyVerified = Boolean(profile?.is_verified);
  const isPending = myRequest?.status === "pendente";
  const isRejected = myRequest?.status === "rejeitado";

  const { data: reqs } = useQuery<VerificationRequirementsEvaluation>({
    queryKey: ["verification_requirements_status", user?.id, profile?.gamification_level, profile?.stars_count, level],
    queryFn: () => getMemberVerificationRequirementsStatus(user?.id, profile, level),
    enabled: Boolean(user?.id) && isModalOpen,
    staleTime: 10 * 1000,
  });

  const meetsAll = Boolean(reqs?.meetsAll);
  const canSubmit = !isAlreadyVerified && canRequest && meetsAll && reason.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyVerified || !canSubmit) return;

    try {
      await submitRequestMutation.mutateAsync({
        reason: reason.trim(),
        document_url: documentUrl.trim() || null,
      });
      setReason("");
      setDocumentUrl("");
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

              {/* OS 4 REQUISITOS MANDATÓRIOS */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-sky-400" />
                    <span>4 Requisitos Obrigatórios</span>
                  </p>
                  <Badge variant="outline" className={cn("text-[9px] font-mono py-0", meetsAll ? "border-emerald-500/40 text-emerald-400" : "border-amber-500/40 text-amber-400")}>
                    {meetsAll ? "Todos Cumpridos" : "Requisitos Pendentes"}
                  </Badge>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">1. Nível do Membro 3+:</span>
                    <span className={cn("font-bold flex items-center gap-1", reqs?.levelOk ? "text-emerald-400" : "text-rose-400")}>
                      {reqs?.levelOk ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      Nível {reqs?.currentLevel ?? 1}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">2. Cargo de Membro+:</span>
                    <span className={cn("font-bold flex items-center gap-1", reqs?.roleOk ? "text-emerald-400" : "text-rose-400")}>
                      {reqs?.roleOk ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {getLevelLabel(level)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">3. Pelo menos 1 Condecoração:</span>
                    <span className={cn("font-bold flex items-center gap-1", reqs?.insigniasOk ? "text-emerald-400" : "text-rose-400")}>
                      {reqs?.insigniasOk ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {reqs?.insigniasCount ?? 0} condecorações
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">4. Pelo menos 1 Avaliação:</span>
                    <span className={cn("font-bold flex items-center gap-1", reqs?.evaluationsOk ? "text-emerald-400" : "text-rose-400")}>
                      {reqs?.evaluationsOk ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {reqs?.evaluationsCount ?? 0} avaliações
                    </span>
                  </div>
                </div>
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
