import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, Clock, ShieldCheck, User } from "lucide-react";
import { useMembers } from "@/hooks/useData";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { formatSecondsToHoursAndMinutes, formatUserPresenceText } from "@/lib/format";
import { cn } from "@/lib/utils";

interface UserProfileDrawerProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartChat?: (userId: string) => void;
}

export function UserProfileDrawer({
  userId,
  open,
  onOpenChange,
  onStartChat,
}: UserProfileDrawerProps) {
  const { data: members = [] } = useMembers();
  const member = members.find((m) => m.user_id === userId);

  if (!member) return null;

  const displayName = member.nickname || member.nome;
  const initials = displayName.slice(0, 2).toUpperCase();
  const nivel = (member.nivel || "novato") as AppLevel;
  const isOnline = member.presence_status === "online";
  const isAusente = member.presence_status === "ausente";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-5 bg-card text-card-foreground border border-border">
        <DialogHeader className="sr-only">
          <DialogTitle>Perfil do Membro</DialogTitle>
          <DialogDescription>Informações cadastrais e de presença</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-primary/40 shadow-md">
              {member.discord_avatar_url && <AvatarImage src={member.discord_avatar_url} alt={displayName} />}
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card ${
                isOnline ? "bg-emerald-500 shadow-sm" : isAusente ? "bg-amber-500 animate-pulse" : "bg-zinc-500"
              }`}
              title={isOnline ? "Online" : isAusente ? "Ausente" : "Offline"}
            />
          </div>

          <div className="space-y-0.5">
            <h3 className="font-extrabold text-base text-foreground">{displayName}</h3>
            {member.nickname && <p className="text-xs text-muted-foreground">{member.nome}</p>}
            <div className="pt-1">
              <Badge variant="outline" className={`text-xs px-2 py-0.5 font-bold ${levelBadgeClass(nivel)}`}>
                {LEVEL_LABEL[nivel] || nivel}
              </Badge>
            </div>
          </div>

          {/* METADATA GRID */}
          <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs text-left">
            <div className="p-2 rounded-xl bg-secondary/30 border border-border/50 col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block">Status de Atividade</span>
                <span className={cn("font-bold text-xs flex items-center gap-1.5", isOnline ? "text-emerald-400" : isAusente ? "text-amber-400" : "text-zinc-400")}>
                  <span className={cn("h-2 w-2 rounded-full inline-block", isOnline ? "bg-emerald-400" : isAusente ? "bg-amber-400 animate-pulse" : "bg-zinc-400")} />
                  {formatUserPresenceText(
                    member.presence_status,
                    member.last_seen,
                    member.presence_updated_at || member.updated_at
                  )}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-secondary/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground block">ID no Jogo</span>
              <span className="font-mono font-bold text-foreground">#{member.game_id || "N/A"}</span>
            </div>

            <div className="p-2 rounded-xl bg-secondary/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground block">Telefone</span>
              <span className="font-bold text-foreground">{member.telefone || "N/A"}</span>
            </div>

            <div className="p-2 rounded-xl bg-secondary/30 border border-border/50 col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block">Tempo Online na Plataforma</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatSecondsToHoursAndMinutes(member.total_seconds_online || 0)}
                </span>
              </div>
              <Clock className="h-4 w-4 text-emerald-400 opacity-80" />
            </div>

            {member.discord_username && (
              <div className="p-2 rounded-xl bg-secondary/30 border border-border/50 col-span-2">
                <span className="text-[10px] text-muted-foreground block">Conta Discord</span>
                <span className="font-mono text-indigo-400 font-bold">@{member.discord_username}</span>
              </div>
            )}
          </div>

          {onStartChat && (
            <Button
              type="button"
              className="w-full bg-primary text-primary-foreground font-bold shadow-md mt-2 cursor-pointer"
              onClick={() => {
                onOpenChange(false);
                onStartChat(member.user_id);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Conversar no Chat Privado
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
