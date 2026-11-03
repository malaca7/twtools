import { useMemo } from "react";
import {
  User,
  Shield,
  Phone,
  Hash,
  Calendar,
  MessageSquare,
  Copy,
  ExternalLink,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { type Ticket, formatTicketNumber } from "@/types/tickets";
import { dateTime, formatTimeOnly } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TicketMemberDossierProps {
  ticket: Ticket;
  allTickets?: Ticket[];
  memberProfile?: any;
  onFilterMemberTickets?: (userId: string) => void;
}

export function TicketMemberDossier({
  ticket,
  allTickets = [],
  memberProfile,
  onFilterMemberTickets,
}: TicketMemberDossierProps) {
  const authorTickets = useMemo(() => {
    return allTickets.filter((t) => t.user_id === ticket.user_id);
  }, [allTickets, ticket.user_id]);

  const stats = useMemo(() => {
    const total = authorTickets.length;
    const closed = authorTickets.filter((t) => t.status === "fechado" || t.status === "resolvido").length;
    const open = total - closed;
    return { total, closed, open };
  }, [authorTickets]);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`, {
      description: text,
    });
  };

  const passaporte =
    memberProfile?.game_id ||
    memberProfile?.passaporte ||
    (ticket as any)?.creator_game_id ||
    null;

  const telefone =
    memberProfile?.telefone ||
    (ticket as any)?.creator_phone ||
    null;

  const discordUsername =
    memberProfile?.discord_username ||
    memberProfile?.discord_tag ||
    (ticket as any)?.creator_discord ||
    null;

  const discordId = memberProfile?.discord_id || null;

  return (
    <div className="space-y-3.5 p-4 bg-secondary/20 border border-border/70 rounded-2xl animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Dossiê do Solicitante
          </h4>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
          Dados do Membro
        </Badge>
      </div>

      {/* Cartão de Identificação Principal */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/80 shadow-xs">
        <Avatar className="h-12 w-12 rounded-xl border border-border shrink-0">
          <AvatarImage src={ticket.creator_avatar || memberProfile?.avatar_url || undefined} />
          <AvatarFallback className="text-sm font-bold bg-secondary">
            {(ticket?.creator_name || ticket?.creator_nickname || "MB").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-black text-foreground truncate">
              {ticket.creator_name || memberProfile?.nome || "Membro"}
            </span>
            <VerifiedBadge userId={ticket.user_id} size="sm" />
          </div>

          {ticket.creator_nickname && (
            <p className="text-xs text-muted-foreground font-medium">
              Apelido: <strong className="text-foreground">{ticket.creator_nickname}</strong>
            </p>
          )}

          <div className="pt-0.5">
            <Badge
              className={cn(
                "text-[10px] px-2 py-0.5 font-bold shadow-xs",
                levelBadgeClass(ticket.creator_role)
              )}
            >
              {LEVEL_LABEL[ticket.creator_role] || ticket.creator_role}
            </Badge>
          </div>
        </div>
      </div>

      {/* Grid de Identificadores (Passaporte, Telefone, Discord) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Passaporte / ID */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground font-semibold block">Passaporte / ID</span>
              <span className="font-mono font-bold text-foreground truncate block">
                {passaporte ? `#${passaporte}` : "Não informado"}
              </span>
            </div>
          </div>
          {passaporte && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(String(passaporte), "Passaporte")}
              className="h-7 w-7 text-muted-foreground hover:text-amber-400 shrink-0"
              title="Copiar Passaporte"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Telefone em Jogo */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/60">
          <div className="flex items-center gap-2 min-w-0">
            <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground font-semibold block">Telefone RP</span>
              <span className="font-mono font-bold text-foreground truncate block">
                {telefone || "Não informado"}
              </span>
            </div>
          </div>
          {telefone && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(String(telefone), "Telefone")}
              className="h-7 w-7 text-muted-foreground hover:text-emerald-400 shrink-0"
              title="Copiar Telefone"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Conta Discord */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/60 sm:col-span-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-3.5 w-3.5 rounded-full bg-[#5865F2] flex items-center justify-center shrink-0 text-white text-[8px] font-black">
              D
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground font-semibold block">Conta Discord</span>
              <span className="font-mono font-bold text-foreground truncate block text-xs">
                {discordUsername || "Não vinculado"}
                {discordId ? ` (${discordId})` : ""}
              </span>
            </div>
          </div>
          {(discordUsername || discordId) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(discordUsername || discordId || "", "Discord")}
              className="h-7 w-7 text-muted-foreground hover:text-[#5865F2] shrink-0"
              title="Copiar Discord"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Histórico Operacional de Chamados do Solicitante */}
      <div className="p-3 rounded-xl bg-card border border-border/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-muted-foreground flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            Histórico de Chamados
          </span>
          <span className="text-[11px] font-mono text-foreground font-bold">
            {stats.total} {stats.total === 1 ? "chamado" : "chamados"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
          <div className="p-1.5 rounded-lg bg-secondary/50 border border-border/40">
            <span className="text-[10px] text-muted-foreground block">Total</span>
            <span className="text-xs font-black font-mono text-foreground">{stats.total}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] text-amber-400 block">Em Aberto</span>
            <span className="text-xs font-black font-mono text-amber-300">{stats.open}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 block">Concluídos</span>
            <span className="text-xs font-black font-mono text-emerald-300">{stats.closed}</span>
          </div>
        </div>

        {/* Lista compacta de outros chamados abertos pelo membro */}
        {authorTickets.length > 1 && (
          <div className="pt-2 border-t border-border/40 space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground block uppercase tracking-wider">
              Outros Chamados Recentes:
            </span>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {authorTickets
                .filter((t) => t.id !== ticket.id)
                .slice(0, 4)
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono font-bold text-amber-400 shrink-0">
                        {formatTicketNumber(t.ticket_number)}
                      </span>
                      <span className="truncate text-foreground font-medium">{t.subject}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono shrink-0 ml-1">
                      {t.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
