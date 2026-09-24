import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { Bot, Upload, Loader2, Server } from "lucide-react";
import type { BotProject } from "@/services/botEngine/types";
import { uploadWebhookAvatar } from "@/services/webhookService";

interface BotEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bot: BotProject | null;
  onSave: (bot: BotProject) => void;
}

export function BotEditorModal({ open, onOpenChange, bot, onSave }: BotEditorModalProps) {
  const [formData, setFormData] = useState<BotProject | null>(bot);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFormData(bot);
  }, [bot]);

  if (!formData) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const url = await uploadWebhookAvatar(file);
      setFormData({ ...formData, avatarUrl: url });
      toast.success("Avatar do bot carregado com sucesso!");
    } catch (err: any) {
      toast.error(`Falha no upload: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Informe um nome para o bot.");
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-foreground">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-foreground">
                  {formData.id.startsWith("new_") ? "Criar Novo Bot" : `Configurações: ${formData.name}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Identidade, prefixo padrão e servidor associado deste bot.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">
                {formData.enabled ? "Ativo" : "Pausado"}
              </span>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(val) =>
                  setFormData({
                    ...formData,
                    enabled: val,
                    status: val ? "online" : "offline",
                  })
                }
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Avatar & Nome */}
          <div className="flex items-center gap-4 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <div className="relative group shrink-0">
              <img
                src={formData.avatarUrl || "https://i.ibb.co/ymH1BQPQ/Uma124.png"}
                alt={formData.name}
                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-violet-500/30 bg-zinc-950"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).onerror = null;
                  (e.currentTarget as HTMLImageElement).src = "https://i.ibb.co/ymH1BQPQ/Uma124.png";
                }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white text-[10px] font-bold gap-1"
              >
                {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-bold">Nome do Bot</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Twin Wheels Bot Oficial"
                className="bg-zinc-950 border-zinc-800 text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-1">
              <Label className="text-xs font-bold">Prefixo Padrão</Label>
              <Input
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                placeholder="!"
                className="bg-zinc-900 border-zinc-800 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-bold">ID do Servidor Discord</Label>
              <Input
                value={formData.guildId}
                onChange={(e) => setFormData({ ...formData, guildId: e.target.value })}
                placeholder="Ex: 1535505650308620400"
                className="bg-zinc-900 border-zinc-800 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Descrição / Finalidade</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Para que serve este bot?"
              className="bg-zinc-900 border-zinc-800 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">URL do Avatar</Label>
            <Input
              value={formData.avatarUrl}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              placeholder="https://..."
              className="bg-zinc-900 border-zinc-800 text-xs font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="text-xs font-bold bg-primary text-primary-foreground"
          >
            Salvar Bot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
