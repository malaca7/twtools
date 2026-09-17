import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, UserCheck, UserMinus, Bell, BellOff, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getProfileFollowStats,
  toggleFollowMember,
  toggleFollowNotification,
} from "@/services/profileFeedService";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ProfileFollowButtonProps {
  targetUserId: string;
  targetName: string;
  isSelf: boolean;
  className?: string;
}

export function ProfileFollowButton({
  targetUserId,
  targetName,
  isSelf,
  className,
}: ProfileFollowButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["profile-follow-stats", targetUserId, user?.id],
    queryFn: () => getProfileFollowStats(targetUserId, user?.id),
    staleTime: 1000 * 30, // 30s
  });

  const followMutation = useMutation({
    mutationFn: () => toggleFollowMember(targetUserId),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["profile-follow-stats", targetUserId] });
      toast.success(
        res.isFollowing
          ? `Você agora está seguindo ${targetName}!`
          : `Você deixou de seguir ${targetName}.`
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar seguidor.");
    },
  });

  const notifyMutation = useMutation({
    mutationFn: (newNotify: boolean) => toggleFollowNotification(targetUserId, newNotify),
    onSuccess: (_, newNotify) => {
      void queryClient.invalidateQueries({ queryKey: ["profile-follow-stats", targetUserId] });
      toast.success(
        newNotify
          ? `Notificações ativadas para as postagens de ${targetName}.`
          : `Notificações de ${targetName} foram silenciadas.`
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar preferências de notificação.");
    },
  });

  const followersCount = stats?.followers_count || 0;
  const followingCount = stats?.following_count || 0;
  const isFollowing = Boolean(stats?.is_following);
  const notifyPosts = stats?.notify_posts ?? true;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* CONTADORES DE SEGUIDORES */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mr-1">
        <span className="flex items-center gap-1">
          <strong className="text-foreground font-mono font-bold text-sm">{followersCount}</strong>
          <span>seguidores</span>
        </span>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1">
          <strong className="text-foreground font-mono font-bold text-sm">{followingCount}</strong>
          <span>seguindo</span>
        </span>
      </div>

      {/* BOTÃO DE SEGUIR (APENAS PARA OUTROS MEMBROS QUANDO VISITANTE LOGADO) */}
      {!isSelf && user && (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            disabled={followMutation.isPending || isLoading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => followMutation.mutate()}
            className={cn(
              "h-9 px-4 text-xs font-bold rounded-xl gap-1.5 cursor-pointer transition-all shadow-sm",
              isFollowing
                ? isHovered
                  ? "bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  : "bg-secondary text-foreground border border-border/80 hover:bg-secondary/80"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
            )}
          >
            {followMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isFollowing ? (
              isHovered ? (
                <>
                  <UserMinus className="h-3.5 w-3.5" />
                  <span>Deixar de Seguir</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Seguindo</span>
                </>
              )
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" />
                <span>Seguir</span>
              </>
            )}
          </Button>

          {/* SINO DE NOTIFICAÇÕES DO MEMBRO */}
          {isFollowing && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={notifyMutation.isPending}
              onClick={() => notifyMutation.mutate(!notifyPosts)}
              className={cn(
                "h-9 w-9 rounded-xl border transition-all cursor-pointer",
                notifyPosts
                  ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 shadow-xs"
                  : "border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              title={
                notifyPosts
                  ? "Notificações ativadas para este membro (clique para silenciar)"
                  : "Notificações silenciadas (clique para receber avisos de novas postagens)"
              }
            >
              {notifyMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : notifyPosts ? (
                <Bell className="h-4 w-4 fill-primary/30" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
