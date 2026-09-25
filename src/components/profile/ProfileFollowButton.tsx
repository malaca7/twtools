import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, UserCheck, UserMinus, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getProfileFollowStats,
  toggleFollowMember,
} from "@/services/profileFeedService";
import { useAuth } from "@/hooks/useAuth";
import { ProfileConnectionsModal } from "@/components/profile/ProfileConnectionsModal";
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

  // Estado para o modal de conexões
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
  const [connectionsInitialTab, setConnectionsInitialTab] = useState<"followers" | "following">("followers");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["profile-follow-stats", targetUserId, user?.id],
    queryFn: () => getProfileFollowStats(targetUserId, user?.id),
    staleTime: 1000 * 20,
  });

  const followMutation = useMutation({
    mutationFn: () => toggleFollowMember(targetUserId),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["profile-follow-stats", targetUserId] });
      void queryClient.invalidateQueries({ queryKey: ["profile-followers-list", targetUserId] });
      void queryClient.invalidateQueries({ queryKey: ["profile-following-list", targetUserId] });
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

  const followersCount = stats?.followers_count || 0;
  const followingCount = stats?.following_count || 0;
  const isFollowing = Boolean(stats?.is_following);

  const openFollowersModal = () => {
    setConnectionsInitialTab("followers");
    setConnectionsModalOpen(true);
  };

  const openFollowingModal = () => {
    setConnectionsInitialTab("following");
    setConnectionsModalOpen(true);
  };

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
        {/* CONTADORES INTERATIVOS DE SEGUIDORES E SEGUINDO (CLICÁVEIS) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/40 border border-white/5 backdrop-blur-md">
          <button
            type="button"
            onClick={openFollowersModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer group"
            title="Ver quem está seguindo este membro"
          >
            <Users className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-mono font-black text-xs text-foreground">
              {followersCount}
            </span>
            <span className="text-[11px] font-medium">seguidores</span>
          </button>

          <span className="text-border/60 text-xs">|</span>

          <button
            type="button"
            onClick={openFollowingModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer group"
            title="Ver quem este membro está seguindo"
          >
            <UserCheck className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-mono font-black text-xs text-foreground">
              {followingCount}
            </span>
            <span className="text-[11px] font-medium">seguindo</span>
          </button>
        </div>

        {/* BOTÃO PRINCIPAL DE SEGUIR (APENAS PARA OUTROS MEMBROS QUANDO VISITANTE LOGADO) */}
        {!isSelf && user && (
          <Button
            type="button"
            size="sm"
            disabled={followMutation.isPending || isLoading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => followMutation.mutate()}
            className={cn(
              "h-9 px-4 text-xs font-bold rounded-xl gap-2 cursor-pointer transition-all duration-200 shadow-md",
              isFollowing
                ? isHovered
                  ? "bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-destructive/20"
                  : "bg-secondary/80 text-foreground border border-border/80 hover:bg-secondary"
                : "bg-gradient-brand text-primary-foreground hover:opacity-95 shadow-primary/25 hover:shadow-lg"
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
                <span>Seguir Membro</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* MODAL DE CONEXÕES (SEGUIDORES / SEGUINDO) */}
      <ProfileConnectionsModal
        isOpen={connectionsModalOpen}
        onClose={() => setConnectionsModalOpen(false)}
        initialTab={connectionsInitialTab}
        targetUserId={targetUserId}
        targetName={targetName}
      />
    </>
  );
}
