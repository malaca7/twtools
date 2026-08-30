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
import { Volume2, VolumeX, Play, Check, Music2, Bell, Send, AtSign } from "lucide-react";
import {
  chatSound,
  SOUND_THEMES,
  type ChatSoundSettings,
  type ChatSoundTheme,
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
  const [settings, setSettings] = useState<ChatSoundSettings>(() => chatSound.getSettings());

  useEffect(() => {
    if (open) {
      setSettings(chatSound.getSettings());
    }
  }, [open]);

  const handleUpdate = (partial: Partial<ChatSoundSettings>) => {
    const updated = chatSound.updateSettings(partial);
    setSettings(updated);
  };

  const handlePreview = (e: React.MouseEvent, themeId: ChatSoundTheme) => {
    e.stopPropagation();
    chatSound.playIncomingMessage(themeId);
  };

  const handleSelectTheme = (themeId: ChatSoundTheme) => {
    handleUpdate({ theme: themeId });
    chatSound.playIncomingMessage(themeId);
    toast.success(`Tema sonoro "${SOUND_THEMES.find((t) => t.id === themeId)?.name}" selecionado!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 pb-2 border-b border-border/60">
          <DialogTitle className="text-base font-black flex items-center gap-2">
            <Music2 className="h-4 w-4 text-primary" />
            Configurações de Sons do Chat
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Escolha o tema sonoro de sua preferência e ajuste o volume das notificações.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[65vh]">
          {/* MASTER SWITCH */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-secondary/30">
            <div className="space-y-0.5">
              <Label className="text-xs font-black flex items-center gap-1.5">
                {settings.enabled ? (
                  <Volume2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
                Sons do Chat
              </Label>
              <p className="text-[10.5px] text-muted-foreground">
                {settings.enabled ? "Efeitos sonoros ativados" : "Todos os sons do chat estão silenciados"}
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => handleUpdate({ enabled })}
            />
          </div>

          {/* VOLUME SLIDER */}
          {settings.enabled && (
            <div className="space-y-2 p-3 rounded-xl border border-border/70 bg-secondary/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Volume dos Efeitos</span>
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
                  {SOUND_THEMES.length} opções disponíveis
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {SOUND_THEMES.map((theme) => {
                  const isSelected = settings.theme === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={cn(
                        "p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-bold shadow-md shadow-primary/20"
                          : "bg-secondary/30 border-border/60 hover:bg-secondary text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-lg">{theme.emoji}</span>
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handlePreview(e, theme.id)}
                          className={cn(
                            "h-7 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer",
                            isSelected
                              ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                              : "bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary"
                          )}
                          title="Ouvir demonstração deste som"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Ouvir</span>
                        </button>

                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-primary-foreground text-primary flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
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

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold">Mensagem recebida</span>
                  </div>
                  <Switch
                    checked={settings.incomingEnabled}
                    onCheckedChange={(incomingEnabled) => handleUpdate({ incomingEnabled })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Send className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold">Mensagem enviada</span>
                  </div>
                  <Switch
                    checked={settings.sentEnabled}
                    onCheckedChange={(sentEnabled) => handleUpdate({ sentEnabled })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <AtSign className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold">Menção (@você)</span>
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

        <DialogFooter className="p-3 border-t border-border/60 bg-secondary/30 flex items-center justify-end">
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold rounded-xl"
          >
            Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
