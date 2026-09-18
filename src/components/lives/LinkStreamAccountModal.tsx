import React, { useState, useEffect } from "react";
import {
  Radio,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  Tv,
  LogIn,
  Sparkles,
  ArrowRight,
  RefreshCw,
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

const PLATFORM_LOGIN_URLS: Record<StreamPlatform, string> = {
  twitch: "https://www.twitch.tv/login",
  kick: "https://kick.com",
  youtube: "https://accounts.google.com/signin/v2/identifier?service=youtube",
  tiktok: "https://www.tiktok.com/login",
};

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

  const [activePlatform, setActivePlatform] = useState<StreamPlatform | null>(initialPlatform || null);
  const [channelInput, setChannelInput] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Sincroniza initialPlatform se alterado externamente
  useEffect(() => {
    if (initialPlatform && open) {
      handleOpenAuthPopup(initialPlatform);
    }
  }, [initialPlatform, open]);

  const myAccounts = allAccounts.filter((acc) => acc.user_id === user?.id);

  // Suggested default handle based on user's identity
  const suggestedHandle =
    (profile?.nickname as string) ||
    (user?.user_metadata?.custom_claims?.username as string) ||
    (user?.user_metadata?.full_name as string) ||
    "";

  const handleOpenAuthPopup = (platform: StreamPlatform) => {
    setActivePlatform(platform);
    if (!channelInput.trim() && suggestedHandle) {
      setChannelInput(suggestedHandle.toLowerCase().replace(/\s+/g, "_"));
    }

    const authUrl = PLATFORM_LOGIN_URLS[platform];
    const width = 650;
    const height = 750;
    const left = Math.max(0, Math.floor(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.floor(window.screenY + (window.outerHeight - height) / 2));

    try {
      const popup = window.open(
        authUrl,
        `Auth_${platform}`,
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (popup) {
        setIsPopupOpen(true);
        popup.focus();
        toast.info(`Popup aberto para login na ${STREAM_PLATFORMS[platform].name}`, {
          description: "Faça login na janela aberta e confirme a vinculação abaixo.",
        });

        // Monitor popup close
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            setIsPopupOpen(false);
          }
        }, 1000);
      } else {
        toast.error("O navegador bloqueou a abertura do popup", {
          description: "Permita popups para este site e tente novamente.",
        });
      }
    } catch {
      window.open(authUrl, "_blank");
    }
  };

  const handleConfirmLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlatform || !channelInput.trim()) {
      toast.warning("Informe o nome de usuário ou link do seu canal.");
      return;
    }

    try {
      await linkMutation.mutateAsync({
        platform: activePlatform,
        channelInput: channelInput.trim(),
      });
      setChannelInput("");
      setActivePlatform(null);
      setIsPopupOpen(false);
      toast.success("Canal vinculado com sucesso!", {
        description: "Agora suas transmissões serão detectadas e notificadas automaticamente.",
      });
    } catch (err: any) {
      toast.error("Falha ao vincular canal", {
        description: err?.message || "Tente novamente mais tarde.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl">
        {/* HEADER */}
        <div className="p-6 pb-4 border-b border-border/60 bg-gradient-to-r from-muted/30 via-muted/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                Vincular Contas de Transmissão
                <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary bg-primary/5">
                  1-Click Popup Auth
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Clique na plataforma desejada para abrir o popup de login nativo e vincular seu canal diretamente.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto scrollbar-thin">
          {/* BOTÕES DE CADA PLATAFORMA (LOGIN VIA POPUP NATIVO) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Selecione a Plataforma para Conectar via Popup:
              </Label>
              <span className="text-[11px] text-muted-foreground">Login nativo oficial</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(STREAM_PLATFORMS) as StreamPlatform[]).map((pKey) => {
                const p = STREAM_PLATFORMS[pKey];
                const isSelected = activePlatform === pKey;
                const isAlreadyLinked = myAccounts.some((acc) => acc.platform === pKey && acc.is_active);

                return (
                  <div
                    key={pKey}
                    className={cn(
                      "group relative p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 overflow-hidden",
                      isSelected
                        ? "bg-secondary/70 border-primary shadow-md ring-2 ring-primary/40"
                        : "bg-secondary/20 border-border/60 hover:bg-secondary/40 hover:border-border"
                    )}
                  >
                    {/* Background glow on hover */}
                    <div
                      className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none group-hover:opacity-25 transition-opacity"
                      style={{ backgroundColor: p.brandHex }}
                    />

                    <div className="flex items-center justify-between z-10">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3.5 w-3.5 rounded-full shadow-xs shrink-0"
                          style={{ backgroundColor: p.brandHex }}
                        />
                        <div>
                          <h4 className="text-sm font-black text-foreground">{p.name}</h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {p.domainUrl}
                          </span>
                        </div>
                      </div>

                      {isAlreadyLinked && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        >
                          Conectado
                        </Badge>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground z-10 leading-snug">
                      {p.helperText}
                    </p>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenAuthPopup(pKey)}
                      className={cn(
                        "w-full text-xs font-bold gap-2 shadow-xs transition-all z-10",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground border border-border/80"
                      )}
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Conectar com {p.name}
                      <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PAINEL DE CONFIRMAÇÃO DA CONEXÃO ATIVA (APÓS ABRIR POPUP) */}
          {activePlatform && (
            <form
              onSubmit={handleConfirmLink}
              className="p-5 rounded-2xl bg-gradient-to-b from-secondary/40 to-secondary/20 border border-primary/40 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-lg"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full animate-ping"
                    style={{ backgroundColor: STREAM_PLATFORMS[activePlatform].brandHex }}
                  />
                  <h4 className="text-xs font-black text-foreground uppercase tracking-wide">
                    Autenticando na {STREAM_PLATFORMS[activePlatform].name}
                  </h4>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenAuthPopup(activePlatform)}
                  className="h-7 text-[11px] text-primary gap-1 px-2 hover:bg-primary/10"
                >
                  <RefreshCw className="h-3 w-3" />
                  Reabrir Popup
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Confirme seu Usuário / Handle do Canal ({STREAM_PLATFORMS[activePlatform].name})
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                    placeholder={STREAM_PLATFORMS[activePlatform].placeholder}
                    className="h-9 text-xs bg-background/90 border-border/80"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Assim que logar na janela aberta, digite ou confirme o nome de usuário do seu canal para vincular.
                </p>
              </div>

              {channelInput.trim().length > 0 && (
                <div className="p-2.5 rounded-lg bg-background/90 border border-border/60 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-muted-foreground text-[11px] truncate">
                      Canal reconhecido:{" "}
                      <span className="font-mono text-primary font-bold">
                        {cleanChannelInput(activePlatform, channelInput).channel_url}
                      </span>
                    </span>
                  </div>
                  <a
                    href={cleanChannelInput(activePlatform, channelInput).channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-[11px] font-bold shrink-0 flex items-center gap-1"
                  >
                    Testar <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActivePlatform(null)}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={linkMutation.isPending || !channelInput.trim()}
                  className="h-8 text-xs font-bold gap-2 bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-95"
                >
                  {linkMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {linkMutation.isPending ? "Salvando..." : "Confirmar e Vincular Canal"}
                </Button>
              </div>
            </form>
          )}

          {/* MEUS CANAIS JÁ VINCULADOS */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Meus Canais Vinculados ({myAccounts.length})
              </Label>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                Detecção Automática Ativa
              </Badge>
            </div>

            {isLoadingAccounts ? (
              <div className="flex items-center justify-center p-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : myAccounts.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border/60 bg-muted/10 space-y-1">
                <p className="text-xs font-semibold text-foreground">Nenhum canal vinculado ainda</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Clique em um dos botões acima para conectar sua Twitch, Kick, YouTube ou TikTok. Quando você entrar ao vivo, a facção receberá o alerta automático!
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
                              {acc.channel_name}
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
                        {/* BOTÃO PAUSAR / ATIVAR DETECÇÃO */}
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
                          title={acc.is_active ? "Pausar verificação automática" : "Ativar verificação automática"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>

                        {/* BOTÃO REMOVER / DESVINCULAR */}
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
