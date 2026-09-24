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
import { MessageSquare, Phone, ShieldCheck, User } from "lucide-react";
import { useMembers } from "@/hooks/useData";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
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
          </div>

          <div className="space-y-0.5">
            <h3 className="font-extrabold text-base text-foreground">{displayName}</h3>
            {member.nickname && <p className="text-xs text-muted-foreground">{member.nome}</p>}
            <div className="pt-1 flex items-center justify-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`text-xs px-2 py-0.5 font-bold ${levelBadgeClass(nivel)}`}>
                {LEVEL_LABEL[nivel] || nivel}
              </Badge>
              {member.is_developer && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 font-bold border-rose-500/40 text-rose-400 bg-rose-500/10">
                  DEV
                </Badge>
              )}
              {Boolean(member.is_ceo || member.custom_theme?.is_ceo) && (
                <Badge className="text-xs px-2 py-0.5 font-bold border-amber-500/40 text-amber-300 bg-amber-500/20 shadow-xs shadow-amber-500/20">
                  👑 CEO
                </Badge>
              )}
            </div>
          </div>

          {/* METADATA GRID */}
          <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs text-left">

            <div className="p-2 rounded-xl bg-secondary/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground block">ID no Jogo</span>
              <span className="font-mono font-bold text-foreground">#{member.game_id || "N/A"}</span>
            </div>

            <div className="p-2 rounded-xl bg-secondary/30 border border-border/50">
              <span className="text-[10px] text-muted-foreground block">Telefone</span>
              <span className="font-bold text-foreground">{member.telefone || "N/A"}</span>
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
