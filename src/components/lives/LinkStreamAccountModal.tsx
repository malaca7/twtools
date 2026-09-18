import React, { useState, useEffect } from "react";
import {
  Radio,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Check,
  Globe,
  Share2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  STREAM_PLATFORMS,
  type StreamPlatform,
  type MemberStreamAccount,
  cleanChannelInput,
} from "@/types/lives";
import {
  useMemberStreamAccounts,
  useLinkStreamAccount,
  useUnlinkStreamAccount,
  useToggleStreamAccountActive,
} from "@/hooks/useLives";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LinkStreamAccountModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  initialPlatform?: StreamPlatform | null;
}

export function LinkStreamAccountModal({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  initialPlatform,
}: LinkStreamAccountModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const { user, profile } = useAuth();
  const { data: allAccounts = [], isLoading: isLoadingAccounts } = useMemberStreamAccounts();
  const linkMutation = useLinkStreamAccount();
  const unlinkMutation = useUnlinkStreamAccount();
  const toggleMutation = useToggleStreamAccountActive();

  const [activePlatform, setActivePlatform] = useState<StreamPlatform>(initialPlatform || "twitch");
  const [channelInput, setChannelInput] = useState("");

  const myAccounts = allAccounts.filter((acc) => acc.user_id === user?.id);

  // Identifica se a plataforma ativa já está conectada
  const activeExistingAccount = myAccounts.find((acc) => acc.platform === activePlatform);

  // Sugestão de apelido padrão baseado na identidade do membro
  const suggestedHandle =
    (profile?.nickname as string) ||
    (user?.user_metadata?.custom_claims?.username as string) ||
    (user?.user_metadata?.full_name as string) ||
    "";

  // Sincroniza plataforma inicial e preenche o canal existente ou sugerido
  useEffect(() => {
    if (open) {
      const targetPlatform = initialPlatform || activePlatform || "twitch";
      setActivePlatform(targetPlatform);

      const existing = myAccounts.find((acc) => acc.platform === targetPlatform);
      if (existing) {
        setChannelInput(existing.channel_name);
      } else if (suggestedHandle) {
        setChannelInput(suggestedHandle.toLowerCase().replace(/\s+/g, "_"));
      } else {
        setChannelInput("");
      }
    }
  }, [initialPlatform, open]);

  // Ao trocar de plataforma manualmente nas abas
  const handleSelectPlatform = (platform: StreamPlatform) => {
    setActivePlatform(platform);
    const existing = myAccounts.find((acc) => acc.platform === platform);
    if (existing) {
      setChannelInput(existing.channel_name);
    } else if (suggestedHandle) {
      setChannelInput(suggestedHandle.toLowerCase().replace(/\s+/g, "_"));
    } else {
      setChannelInput("");
    }
  };

  const handleConfirmLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim()) {
      toast.warning("Informe o nome de usuário ou link do seu canal.");
      return;
    }

    try {
      await linkMutation.mutateAsync({
        platform: activePlatform,
        channelInput: channelInput.trim(),
        accountId: activeExistingAccount?.id,
      });

      // Feedback de sucesso
      toast.success(
        activeExistingAccount
          ? `Canal da ${STREAM_PLATFORMS[activePlatform].name} atualizado com sucesso!`
          : `Canal da ${STREAM_PLATFORMS[activePlatform].name} vinculado com sucesso!`,
        {
          description: "O sistema e o bot agora monitoram suas transmissões automaticamente.",
        }
      );
    } catch (err: any) {
      // O erro já é tratado no hook, mas capturamos aqui para segurança
    }
  };

  const currentCleanInfo = channelInput.trim()
    ? cleanChannelInput(activePlatform, channelInput)
    : null;

  const currentPlatformMeta = STREAM_PLATFORMS[activePlatform] || STREAM_PLATFORMS.twitch;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl">
        {/* HEADER */}
        <div className="p-6 pb-4 border-b border-border/60 bg-gradient-to-r from-muted/30 via-muted/10 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/30 shadow-xs">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                Vincular Canal de Transmissão
                <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary bg-primary/5">
                  Detecção Automática
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Informe o link ou nome do seu canal na plataforma. O sistema detectará automaticamente quando você iniciar uma transmissão.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* CORPO DO MODAL (ROLÁVEL) */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-thin">
          {/* SELETOR DE PLATAFORMAS (4 CARDS COMPACTOS) */}
          <div className="space-y-2.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Selecione a Plataforma para Conectar:
            </Label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(STREAM_PLATFORMS) as StreamPlatform[]).map((pKey) => {
                const p = STREAM_PLATFORMS[pKey];
                const isSelected = activePlatform === pKey;
                const linkedAcc = myAccounts.find((acc) => acc.platform === pKey && acc.is_active);

                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => handleSelectPlatform(pKey)}
                    className={cn(
                      "relative p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 overflow-hidden",
                      isSelected
                        ? "bg-secondary/80 border-primary ring-2 ring-primary/40 shadow-md"
                        : "bg-secondary/30 border-border/60 hover:bg-secondary/50 hover:border-border"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: p.brandHex }}
                        />
                        <span className="text-xs font-black text-foreground truncate">{p.name}</span>
                      </div>
                      {linkedAcc && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>

                    <div className="text-[10px] font-mono truncate">
                      {linkedAcc ? (
                        <span className="text-emerald-400 font-bold truncate block">
                          @{linkedAcc.channel_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Disponível</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FORMULÁRIO DE VINCULAÇÃO DIRETA DA PLATAFORMA ATIVA */}
          <form
            onSubmit={handleConfirmLink}
            className="p-5 rounded-2xl bg-gradient-to-b from-secondary/40 to-secondary/20 border border-border/80 space-y-4 shadow-sm"
          >
            {/* CABEÇALHO DO FORMULÁRIO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-full shadow-xs shrink-0"
                  style={{ backgroundColor: currentPlatformMeta.brandHex }}
                />
                <h4 className="text-xs font-black text-foreground uppercase tracking-wide">
                  Configurar Canal na {currentPlatformMeta.name}
                </h4>
              </div>

              {activeExistingAccount && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    Conta Vinculada
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => unlinkMutation.mutate(activeExistingAccount.id)}
                    disabled={unlinkMutation.isPending}
                    className="h-6 text-[11px] text-destructive hover:bg-destructive/10 px-2"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Desvincular
                  </Button>
                </div>
              )}
            </div>

            {/* CAMPO DE INPUT DO CANAL / HANDLE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  Seu Nome de Usuário ou Link ({currentPlatformMeta.name})
                </Label>
                {suggestedHandle && (
                  <button
                    type="button"
                    onClick={() => setChannelInput(suggestedHandle.toLowerCase().replace(/\s+/g, "_"))}
                    className="text-[10px] text-primary hover:underline font-mono flex items-center gap-1 cursor-pointer"
                  >
                    ⚡ Usar meu apelido (@{suggestedHandle})
                  </button>
                )}
              </div>

              <Input
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder={currentPlatformMeta.placeholder}
                className="h-9 text-xs bg-background/90 border-border/80 font-mono"
                required
              />

              <p className="text-[11px] text-muted-foreground">
                {currentPlatformMeta.helperText} Você pode colar o link completo ou apenas o seu @usuário.
              </p>
            </div>

            {/* PREVIEW DO LINK RESOLVIDO E TESTE */}
            {currentCleanInfo && currentCleanInfo.channel_name.length > 0 && (
              <div className="p-3 rounded-xl bg-background/90 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-in fade-in-50 duration-200">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-muted-foreground text-[10px] block uppercase font-mono">
                      Canal Reconhecido:
                    </span>
                    <span className="font-mono text-primary font-bold text-xs truncate block">
                      {currentCleanInfo.channel_url}
                    </span>
                  </div>
                </div>

                <a
                  href={currentCleanInfo.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-xs font-bold text-foreground hover:text-primary transition-colors shrink-0 border border-border/80"
                >
                  Testar Link <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* BOTÕES DE AÇÃO DO FORMULÁRIO */}
            <div className="flex items-center justify-between pt-2">
              <a
                href={currentPlatformMeta.domainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Abrir site da {currentPlatformMeta.name} <ExternalLink className="h-3 w-3" />
              </a>

              <Button
                type="submit"
                disabled={linkMutation.isPending || !channelInput.trim()}
                className="h-9 text-xs font-extrabold gap-2 bg-gradient-brand text-primary-foreground shadow-md hover:opacity-95 px-4"
              >
                {linkMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {linkMutation.isPending
                  ? "Salvando..."
                  : activeExistingAccount
                  ? `Atualizar Canal da ${currentPlatformMeta.name}`
                  : `Salvar e Vincular ${currentPlatformMeta.name}`}
              </Button>
            </div>
          </form>

          {/* LISTA DE MEUS CANAIS VINCULADOS */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Meus Canais Vinculados ({myAccounts.length})
              </Label>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/5 font-mono">
                Detecção 100% Automática
              </Badge>
            </div>

            {isLoadingAccounts ? (
              <div className="flex items-center justify-center p-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : myAccounts.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border/60 bg-muted/10 space-y-1">
                <p className="text-xs font-semibold text-foreground">Nenhum canal vinculado no momento</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Selecione uma plataforma acima, digite seu nome de usuário ou link do canal e clique em salvar.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {myAccounts.map((acc) => {
                  const pMeta = STREAM_PLATFORMS[acc.platform] || STREAM_PLATFORMS.twitch;

                  return (
                    <div
                      key={acc.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all text-xs",
                        acc.is_active
                          ? "bg-secondary/30 border-border/80 hover:border-primary/40"
                          : "bg-muted/20 border-border/30 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono font-bold uppercase py-0.5",
                            pMeta.badgeBg,
                            pMeta.badgeColor,
                            pMeta.borderColor
                          )}
                        >
                          {pMeta.name}
                        </Badge>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground truncate">
                              @{acc.channel_name}
                            </span>
                            {!acc.is_active && (
                              <Badge variant="secondary" className="text-[9px] py-0 px-1 font-mono">
                                Pausado
                              </Badge>
                            )}
                          </div>
                          <a
                            href={acc.channel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono truncate"
                          >
                            {acc.channel_url} <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {/* EDITAR NESTA PLATAFORMA */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] font-bold px-2 text-primary hover:bg-primary/10"
                          onClick={() => handleSelectPlatform(acc.platform)}
                        >
                          Editar
                        </Button>

                        {/* PAUSAR / ATIVAR */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7 rounded-lg",
                            acc.is_active
                              ? "text-emerald-400 hover:text-amber-400"
                              : "text-muted-foreground hover:text-emerald-400"
                          )}
                          onClick={() =>
                            toggleMutation.mutate({ accountId: acc.id, isActive: !acc.is_active })
                          }
                          title={acc.is_active ? "Pausar monitoramento automático" : "Ativar monitoramento automático"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>

                        {/* REMOVER / DESVINCULAR */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                          onClick={() => unlinkMutation.mutate(acc.id)}
                          title="Remover canal vinculado"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
