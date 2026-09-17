import React, { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface LinkStreamAccountModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function LinkStreamAccountModal({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: LinkStreamAccountModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const { user } = useAuth();
  const { data: allAccounts = [], isLoading: isLoadingAccounts } = useMemberStreamAccounts();
  const linkMutation = useLinkStreamAccount();
  const unlinkMutation = useUnlinkStreamAccount();
  const toggleMutation = useToggleStreamAccountActive();

  const [selectedPlatform, setSelectedPlatform] = useState<StreamPlatform>("twitch");
  const [channelInput, setChannelInput] = useState("");
  const [displayName, setDisplayName] = useState("");

  const myAccounts = allAccounts.filter((acc) => acc.user_id === user?.id);
  const platformMeta = STREAM_PLATFORMS[selectedPlatform];

  // Pré-visualização do canal formatado
  const preview = cleanChannelInput(selectedPlatform, channelInput);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim()) return;

    await linkMutation.mutateAsync({
      platform: selectedPlatform,
      channelInput: channelInput.trim(),
      display_name: displayName.trim() || undefined,
    });

    setChannelInput("");
    setDisplayName("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-border/80 bg-card/95 backdrop-blur-2xl rounded-2xl">
        {/* HEADER DO MODAL */}
        <div className="p-6 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-xs">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                Vincular Contas de Streaming
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  Twin Wheels Lives
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Vincule seus canais da Twitch, Kick, YouTube ou TikTok para detecção automática e alertas de lives.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {/* SELEÇÃO DA PLATAFORMA */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">1. Escolha a Plataforma</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(STREAM_PLATFORMS) as StreamPlatform[]).map((pKey) => {
                const p = STREAM_PLATFORMS[pKey];
                const isSelected = selectedPlatform === pKey;

                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => setSelectedPlatform(pKey)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-150 cursor-pointer gap-1.5",
                      isSelected
                        ? "bg-secondary/70 border-primary shadow-sm ring-1 ring-primary/40"
                        : "bg-secondary/20 border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: p.brandHex }}
                      />
                      <span className="text-xs font-bold text-foreground">{p.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FORMULÁRIO DE VINCULAÇÃO */}
          <form onSubmit={handleLink} className="space-y-4 p-4 rounded-xl bg-secondary/20 border border-border/60">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  2. Usuário ou Link do Canal ({platformMeta.name})
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {platformMeta.domainUrl}
                </span>
              </div>
              <Input
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                placeholder={platformMeta.placeholder}
                className="h-9 text-xs bg-background/80 border-border/80"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                {platformMeta.helperText}
              </p>
            </div>

            {/* PREVIEW EM TEMPO REAL */}
            {channelInput.trim().length > 1 && (
              <div className="p-2.5 rounded-lg bg-background/90 border border-border/60 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-muted-foreground text-[11px] truncate">
                    Link reconhecido: <span className="font-mono text-primary font-bold">{preview.channel_url}</span>
                  </span>
                </div>
                <a
                  href={preview.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-[11px] font-bold shrink-0 flex items-center gap-1"
                >
                  Testar <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <Button
              type="submit"
              disabled={linkMutation.isPending || !channelInput.trim()}
              className="w-full h-9 text-xs font-bold gap-2 bg-gradient-brand text-primary-foreground shadow-sm hover:opacity-95"
            >
              {linkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {linkMutation.isPending ? "Vinculando canal..." : `Vincular Canal da ${platformMeta.name}`}
            </Button>
          </form>

          {/* MEUS CANAIS JÁ VINCULADOS */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Meus Canais Vinculados ({myAccounts.length})
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Monitoramento contínuo
              </span>
            </div>

            {isLoadingAccounts ? (
              <div className="flex items-center justify-center p-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : myAccounts.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-border/60 bg-muted/10 space-y-1">
                <p className="text-xs font-semibold text-foreground">Nenhum canal vinculado ainda</p>
                <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                  Vincule seu canal acima para ser notificado automaticamente e aparecer na aba de lives da Twin Wheels quando iniciar stream.
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
                          ? "bg-secondary/30 border-border/80"
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
                            acc.is_active ? "text-emerald-400 hover:text-amber-400" : "text-muted-foreground hover:text-emerald-400"
                          )}
                          onClick={() => toggleMutation.mutate({ accountId: acc.id, isActive: !acc.is_active })}
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
