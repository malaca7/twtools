import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Volume2,
  VolumeX,
  Play,
  Check,
  Music2,
  Bell,
  Send,
  AtSign,
  Sparkles,
  Smartphone,
  Eye,
  Zap,
  Globe,
  Flame,
  Layers,
  Palette,
} from "lucide-react";
import {
  chatSound,
  SOUND_THEMES,
  VISUAL_ALERT_STYLES,
  GLOW_COLORS,
  type ChatNotificationSettings,
  type ChatSoundTheme,
  type ChatVisualAlertStyle,
  type ChatGlowColor,
} from "@/lib/chatSound";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatSoundSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatSoundSettingsDialog({
  open,
  onOpenChange,
}: ChatSoundSettingsDialogProps) {
  const [settings, setSettings] = useState<ChatNotificationSettings>(() => chatSound.getSettings());
  const [activeTab, setActiveTab] = useState<"audio" | "visual" | "browser">("audio");
  const [nativeStatus, setNativeStatus] = useState<string>(() => chatSound.getNativePermissionStatus());

  useEffect(() => {
    if (open) {
      setSettings(chatSound.getSettings());
      setNativeStatus(chatSound.getNativePermissionStatus());
    }
  }, [open]);

  const handleUpdate = (partial: Partial<ChatNotificationSettings>) => {
    const updated = chatSound.updateSettings(partial);
    setSettings(updated);
  };

  const handlePreviewSound = (e: React.MouseEvent, themeId: ChatSoundTheme) => {
    e.stopPropagation();
    chatSound.playIncomingMessage(themeId);
  };

  const handleSelectTheme = (themeId: ChatSoundTheme) => {
    handleUpdate({ theme: themeId });
    chatSound.playIncomingMessage(themeId);
    toast.success(`Tema sonoro "${SOUND_THEMES.find((t) => t.id === themeId)?.name}" selecionado!`);
  };

  const handleTestVisualAlert = () => {
    chatSound.playIncomingMessage();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("tw_chat_new_message", {
          detail: {
            message: { content: "Esta é uma demonstração do alerta visual personalizado!" },
            conversationId: "test_demo",
            senderName: "Twin Wheels Bot",
            senderAvatar: null,
            visualStyle: settings.visualStyle,
            glowColor: settings.glowColor,
            isTestDemo: true,
          },
        })
      );
    }
    toast.info("Demonstração do alerta visual ativada na tela!");
  };

  const handleRequestNativePermission = async () => {
    const granted = await chatSound.requestNativePermission();
    setNativeStatus(chatSound.getNativePermissionStatus());
    if (granted) {
      toast.success("Notificações nativas do navegador ativadas com sucesso!");
    } else {
      toast.error("Permissão de notificação negada ou não suportada no navegador.");
    }
  };

  const handleTestNativeNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("💬 Teste de Notificação - Twin Wheels", {
          body: "As notificações nativas do seu navegador estão funcionando perfeitamente!",
          icon: "/favicon.ico",
        });
        toast.success("Notificação enviada ao sistema!");
      } else {
        toast.warning("Você precisa conceder permissão primeiro.");
      }
    } else {
      toast.error("Seu navegador não suporta notificações nativas.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border-border/80 shadow-2xl rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh] z-[1000]">
        {/* HEADER COM NAVEGAÇÃO DE ABAS */}
        <DialogHeader className="p-4 pb-3 border-b border-border/60 bg-secondary/30 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <DialogTitle className="text-base font-black flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Personalizar Alertas & Chat
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure sons, efeitos visuais, notificações de tela e estilo ao receber mensagens.
              </DialogDescription>
            </div>
          </div>

          {/* SEGMENTED TABS PILL */}
          <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-2xl border border-border/50 shadow-inner mt-1">
            <button
              type="button"
              onClick={() => setActiveTab("audio")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
                activeTab === "audio"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <Music2 className="h-3.5 w-3.5" />
              <span>Sons & Áudio</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("visual")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
                activeTab === "visual"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Efeitos Visuais</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("browser")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none",
                activeTab === "browser"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Navegador</span>
            </button>
          </div>
        </DialogHeader>

        {/* DIALOG BODY */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[62vh]">
          {/* TAB 1: SONS & ÁUDIO */}
          {activeTab === "audio" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* MASTER SWITCH */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/70 bg-secondary/30">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black flex items-center gap-1.5">
                    {settings.enabled ? (
                      <Volume2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                    Efeitos Sonoros do Chat
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {settings.enabled ? "Sons do chat ativados" : "Todos os sons do chat estão silenciados"}
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => handleUpdate({ enabled })}
                />
              </div>

              {/* VOLUME SLIDER */}
              {settings.enabled && (
                <div className="space-y-2 p-3.5 rounded-2xl border border-border/70 bg-secondary/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Volume Master</span>
                    <span className="font-mono font-bold text-primary">{settings.volume}%</span>
                  </div>
                  <Slider
                    value={[settings.volume]}
                    min={5}
                    max={100}
                    step={5}
                    onValueChange={([val]) => handleUpdate({ volume: val })}
                    className="cursor-pointer"
                  />
                </div>
              )}

              {/* SELEÇÃO DE TEMAS SONOROS */}
              {settings.enabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black text-foreground">Tema dos Sons</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {SOUND_THEMES.length} sons sintetizados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SOUND_THEMES.map((theme) => {
                      const isSelected = settings.theme === theme.id;
                      return (
                        <div
                          key={theme.id}
                          onClick={() => handleSelectTheme(theme.id)}
                          className={cn(
                            "p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-all cursor-pointer select-none",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-md shadow-primary/20"
                              : "bg-secondary/30 border-border/60 hover:bg-secondary text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-base shrink-0">{theme.emoji}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-tight truncate">
                                {theme.name}
                              </p>
                              <p
                                className={cn(
                                  "text-[10px] leading-tight truncate opacity-80",
                                  isSelected ? "text-primary-foreground" : "text-muted-foreground"
                                )}
                              >
                                {theme.desc}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handlePreviewSound(e, theme.id)}
                              className={cn(
                                "h-6 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                                isSelected
                                  ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                                  : "bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary"
                              )}
                              title="Ouvir demonstração"
                            >
                              <Play className="h-2.5 w-2.5 fill-current" />
                              <span>Ouvir</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CANAIS DE SONS INDEPENDENTES */}
              {settings.enabled && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <Label className="text-xs font-black text-foreground">Canais de Som</Label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                      <div className="flex items-center gap-1.5">
                        <Bell className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold">Recebidas</span>
                      </div>
                      <Switch
                        checked={settings.incomingEnabled}
                        onCheckedChange={(incomingEnabled) => handleUpdate({ incomingEnabled })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                      <div className="flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold">Enviadas</span>
                      </div>
                      <Switch
                        checked={settings.sentEnabled}
                        onCheckedChange={(sentEnabled) => handleUpdate({ sentEnabled })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 border border-border/50">
                      <div className="flex items-center gap-1.5">
                        <AtSign className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold">Menção</span>
                      </div>
                      <Switch
                        checked={settings.mentionEnabled}
                        onCheckedChange={(mentionEnabled) => handleUpdate({ mentionEnabled })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EFEITOS VISUAIS */}
          {activeTab === "visual" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="space-y-2">
                <Label className="text-xs font-black text-foreground">Estilo do Alerta Visual</Label>
                <p className="text-[11px] text-muted-foreground">
                  Escolha como a notificação de mensagem aparece na sua tela quando receber mensagens.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {VISUAL_ALERT_STYLES.map((style) => {
                    const isSelected = settings.visualStyle === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => handleUpdate({ visualStyle: style.id })}
                        className={cn(
                          "p-3 rounded-2xl border flex flex-col justify-between gap-2 transition-all cursor-pointer select-none relative overflow-hidden",
                          isSelected
                            ? "bg-primary/10 border-primary ring-2 ring-primary/40 font-bold shadow-md"
                            : "bg-secondary/30 border-border/60 hover:bg-secondary text-foreground"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{style.emoji}</span>
                            <span className="text-xs font-bold leading-tight">{style.name}</span>
                          </div>
                          {isSelected && (
                            <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10.5px] text-muted-foreground leading-tight">
                          {style.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SELEÇÃO DE COR NEON / AURA */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-primary" />
                    Cor do Brilho Radiante (Neon Glow)
                  </Label>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {GLOW_COLORS.map((color) => {
                    const isSelected = settings.glowColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => handleUpdate({ glowColor: color.id })}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border transition-all cursor-pointer select-none",
                          isSelected
                            ? "bg-secondary border-primary ring-2 ring-primary/50"
                            : "bg-secondary/20 border-border/50 hover:bg-secondary/50"
                        )}
                      >
                        <span
                          className={cn("h-6 w-6 rounded-full shadow-md", color.bgClass, isSelected && "scale-110 ring-2 ring-white/50")}
                        />
                        <span className="text-[9.5px] font-bold truncate max-w-full text-center">
                          {color.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DEMO TEST BUTTON */}
              <div className="p-3 rounded-2xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">Testar Efeito Visual Agora</p>
                  <p className="text-[10px] text-muted-foreground">
                    Dispara uma simulação do alerta visual configurado na sua tela.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestVisualAlert}
                  className="h-8 text-xs font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Testar Alerta
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: NAVEGADOR & NOTIFICAÇÕES NATIVAS */}
          {activeTab === "browser" && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* NOTIFICAÇÕES NATIVAS DO SISTEMA */}
              <div className="p-3.5 rounded-2xl border border-border/70 bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-black flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-primary" />
                      Notificações Nativas do Sistema
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Exibe notificações na área de trabalho do Windows/macOS/Celular mesmo com o site em segundo plano.
                    </p>
                  </div>
                  <Switch
                    checked={settings.nativeNotificationsEnabled}
                    onCheckedChange={(nativeNotificationsEnabled) => handleUpdate({ nativeNotificationsEnabled })}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Status da Permissão:</span>
                    {nativeStatus === "granted" ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                        Concedido
                      </Badge>
                    ) : nativeStatus === "denied" ? (
                      <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-[10px] font-mono">
                        Bloqueado pelo Navegador
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] font-mono">
                        Pendente
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {nativeStatus !== "granted" ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleRequestNativePermission}
                        className="h-7 text-[11px] font-bold rounded-xl bg-primary text-primary-foreground"
                      >
                        Permitir
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestNativeNotification}
                        className="h-7 text-[11px] font-bold rounded-xl gap-1"
                      >
                        <Bell className="h-3 w-3 text-primary" />
                        Testar Notificação
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* PISCAR TÍTULO DA ABA */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/70 bg-secondary/30">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-primary" />
                    Piscar Título da Aba do Navegador
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Alterna "(1) Nova Mensagem" no título da guia quando estiver navegando em outro site.
                  </p>
                </div>
                <Switch
                  checked={settings.flashTabTitle}
                  onCheckedChange={(flashTabTitle) => handleUpdate({ flashTabTitle })}
                />
              </div>

              {/* EXPANSÃO AUTOMÁTICA EM MENSAGENS PRIVADAS */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/70 bg-secondary/30">
                <div className="space-y-0.5">
                  <Label className="text-xs font-black flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-primary" />
                    Abrir Balão Flutuante em DMs
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Abre o chat automaticamente quando receber uma mensagem privada de outro membro.
                  </p>
                </div>
                <Switch
                  checked={settings.autoExpandOnDM}
                  onCheckedChange={(autoExpandOnDM) => handleUpdate({ autoExpandOnDM })}
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-3 border-t border-border/60 bg-secondary/30 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestVisualAlert}
            className="text-xs font-bold rounded-xl gap-1.5 border-border/60"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Testar Alerta Completo
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold rounded-xl bg-primary text-primary-foreground"
          >
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
