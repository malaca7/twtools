import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Loader2,
  Sparkles,
  Server,
  Hash,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Layers,
} from "lucide-react";
import {
  purgeDiscordSpamMessages,
  type PurgeSpamResult,
} from "@/services/webhookService";
import { cn } from "@/lib/utils";

interface PurgeSpamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SERVER_OPTIONS = [
  {
    id: "1535505650308620400",
    name: "Twin Wheel (Principal)",
    channels: [
      { id: "all", name: "Todos os canais de texto com permissão" },
      { id: "1535637119471587408", name: "📰│bate-papo" },
      { id: "1535505650920984628", name: "📑│avisos" },
      { id: "1548413371194286314", name: "⚙️│testedev" },
      { id: "1535637509818548234", name: "📦│baus" },
    ],
  },
  {
    id: "1537229296697999462",
    name: "malaca developers (Ambiente Dev)",
    channels: [
      { id: "all", name: "Todos os canais de texto com permissão" },
      { id: "1538375505953165312", name: "📄・geral" },
    ],
  },
  {
    id: "all",
    name: "Todos os Servidores do Bot",
    channels: [
      { id: "all", name: "Todos os canais de texto com permissão" },
    ],
  },
];

export function PurgeSpamModal({ open, onOpenChange }: PurgeSpamModalProps) {
  const [selectedServer, setSelectedServer] = useState("1535505650308620400");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [messageLimit, setMessageLimit] = useState("50");
  const [isPurging, setIsPurging] = useState(false);
  const [lastResult, setLastResult] = useState<PurgeSpamResult | null>(null);

  const currentServerObj = SERVER_OPTIONS.find((s) => s.id === selectedServer) || SERVER_OPTIONS[0];

  const handleStartPurge = async () => {
    setIsPurging(true);
    setLastResult(null);

    try {
      const res = await purgeDiscordSpamMessages({
        guildId: selectedServer,
        channelId: selectedChannel === "all" ? undefined : selectedChannel,
        limit: parseInt(messageLimit, 10) || 50,
      });

      setLastResult(res);

      if (res.success) {
        if (res.deletedMessagesCount > 0) {
          toast.success(
            `Limpeza concluída! ${res.deletedMessagesCount} mensagens de spam foram apagadas de ${res.scannedChannels} canais.`,
            { icon: "🧹" }
          );
        } else {
          toast.info(
            `Varredura concluída em ${res.scannedChannels} canais (${res.scannedMessages} mensagens analisadas). Nenhum spam encontrado!`,
            { icon: "🛡️" }
          );
        }
      } else {
        toast.error(res.error || "Ocorreu um erro ao executar a limpeza de spams.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Falha na comunicação com o bot.");
    } finally {
      setIsPurging(false);
    }
  };

  const handleReset = () => {
    setLastResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl surface-card border-border/80 shadow-2xl p-0 overflow-hidden">
        {/* HEADER */}
        <div className="p-5 bg-gradient-to-b from-rose-500/10 via-background/60 to-background border-b border-border/60">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold flex items-center gap-2">
                  <span>Apagar Todo Spam do Servidor Discord</span>
                  <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
                    Anti-Spam Bot
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Varredura inteligente nos canais para detectar e deletar mensagens maliciosas, invites e links do Telegram.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* SE NÃO ESTÁ EM RESULTADOS: CONFIGURAÇÃO DO PURGE */}
          {!lastResult && (
            <div className="space-y-4">
              {/* ALERTA DE FUNCIONAMENTO */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 flex items-start gap-3">
                <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-foreground text-xs">Como funciona a remoção?</p>
                  <p>
                    O bot inspecionará as mensagens recentes dos canais de texto contra o Escudo Anti-Spam (links suspeitos, convites, Telegram, spambots). Toda mensagem identificada como maliciosa será <strong>deletada permanentemente</strong> do servidor.
                  </p>
                </div>
              </div>

              {/* SELEÇÃO DE SERVIDOR */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-primary" />
                  Servidor Discord
                </Label>
                <Select
                  value={selectedServer}
                  onValueChange={(val) => {
                    setSelectedServer(val);
                    setSelectedChannel("all");
                  }}
                  disabled={isPurging}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-background/80">
                    <SelectValue placeholder="Selecione o servidor" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVER_OPTIONS.map((srv) => (
                      <SelectItem key={srv.id} value={srv.id} className="text-xs">
                        {srv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SELEÇÃO DE CANAL */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-indigo-400" />
                  Canal de Destino
                </Label>
                <Select
                  value={selectedChannel}
                  onValueChange={setSelectedChannel}
                  disabled={isPurging}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-background/80">
                    <SelectValue placeholder="Selecione o canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentServerObj.channels.map((ch) => (
                      <SelectItem key={ch.id} value={ch.id} className="text-xs">
                        {ch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PROFUNDIDADE DE MENSAGENS */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  Profundidade da Análise por Canal
                </Label>
                <Select
                  value={messageLimit}
                  onValueChange={setMessageLimit}
                  disabled={isPurging}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-background/80">
                    <SelectValue placeholder="Quantidade de mensagens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25" className="text-xs">Últimas 25 mensagens por canal (Rápido)</SelectItem>
                    <SelectItem value="50" className="text-xs">Últimas 50 mensagens por canal (Recomendado)</SelectItem>
                    <SelectItem value="100" className="text-xs">Últimas 100 mensagens por canal (Completo)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  O bot acessa os canais em que possui a permissão 'Gerenciar Mensagens' no Discord.
                </p>
              </div>
            </div>
          )}

          {/* EXIBIÇÃO DE RESULTADO APÓS A VARREDURA */}
          {lastResult && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {/* MÉTRICAS EM CARDS */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Canais
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {lastResult.scannedChannels}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Mensagens
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {lastResult.scannedMessages}
                  </span>
                </div>

                <div className={cn(
                  "p-3 rounded-xl border text-center",
                  lastResult.deletedMessagesCount > 0
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                )}>
                  <span className="text-[10px] uppercase font-bold block opacity-80">
                    Spams Deletados
                  </span>
                  <span className="text-lg font-black">
                    {lastResult.deletedMessagesCount}
                  </span>
                </div>
              </div>

              {/* SE NENHUM SPAM ENCONTRADO */}
              {lastResult.deletedMessagesCount === 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1.5">
                  <div className="mx-auto w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-foreground text-xs">Servidor 100% Limpo!</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Nenhuma mensagem maliciosa ou padrão de spam foi encontrado nas {lastResult.scannedMessages} mensagens analisadas.
                  </p>
                </div>
              )}

              {/* LISTA DE MENSAGENS DELETADAS */}
              {lastResult.deletedMessagesCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      Mensagens Removidas ({lastResult.deletedMessagesCount}):
                    </span>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {lastResult.deletedDetails.map((item, idx) => (
                      <div
                        key={item.messageId || idx}
                        className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-rose-300 flex items-center gap-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            #{item.channelName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            @{item.authorTag}
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-200/90 font-mono bg-background/50 p-1.5 rounded-lg border border-border/30 truncate">
                          "{item.contentSnippet || "(Conteúdo embed ou link)"}"
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                          <span className="italic">Motivo: {item.reason}</span>
                          <Badge variant="outline" className="text-[9px] py-0 border-emerald-500/40 text-emerald-400">
                            Deletada ✓
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ERROS CASO EXISTAM */}
              {lastResult.errors && lastResult.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Avisos durante a varredura</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[10px] text-muted-foreground">
                    {lastResult.errors.slice(0, 3).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="p-4 bg-secondary/20 border-t border-border/50 gap-2">
          {lastResult ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs rounded-xl gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Nova Varredura
              </Button>
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs rounded-xl font-bold bg-primary text-primary-foreground"
              >
                Concluir
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isPurging}
                className="text-xs rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleStartPurge}
                disabled={isPurging}
                className="text-xs rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                {isPurging ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Varrendo & Apagando Spams...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Apagar Todo Spam Agora</span>
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
