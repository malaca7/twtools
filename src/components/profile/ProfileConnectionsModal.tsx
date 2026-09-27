import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  Search,
  X,
  ExternalLink,
  Shield,
  Sparkles,
  Loader2,
  UserX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DevBadge, CeoBadge } from "@/components/ui-kit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  getProfileFollowers,
  getProfileFollowing,
  toggleFollowMember,
} from "@/services/profileFeedService";
import { getProxiedImageUrl } from "@/services/postimagesService";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import type { FollowMemberItem } from "@/types/profileFeed";
import { cn } from "@/lib/utils";

export interface ProfileConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "followers" | "following";
  targetUserId: string;
  targetName: string;
}

export function ProfileConnectionsModal({
  isOpen,
  onClose,
  initialTab = "followers",
  targetUserId,
  targetName,
}: ProfileConnectionsModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Carrega seguidores
  const { data: followers = [], isLoading: isLoadingFollowers } = useQuery({
    queryKey: ["profile-followers-list", targetUserId, user?.id],
    queryFn: () => getProfileFollowers(targetUserId, user?.id),
    enabled: isOpen,
    staleTime: 1000 * 20,
  });

  // Carrega seguindo
  const { data: following = [], isLoading: isLoadingFollowing } = useQuery({
    queryKey: ["profile-following-list", targetUserId, user?.id],
    queryFn: () => getProfileFollowing(targetUserId, user?.id),
    enabled: isOpen,
    staleTime: 1000 * 20,
  });

  // Mutação para seguir/deixar de seguir dentro da lista
  const followMutation = useMutation({
    mutationFn: (memberId: string) => toggleFollowMember(memberId),
    onSuccess: (res, memberId) => {
      void queryClient.invalidateQueries({ queryKey: ["profile-followers-list"] });
      void queryClient.invalidateQueries({ queryKey: ["profile-following-list"] });
      void queryClient.invalidateQueries({ queryKey: ["profile-follow-stats"] });
      toast.success(res.isFollowing ? "Membro seguido!" : "Deixou de seguir membro.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar seguidor.");
    },
  });

  const currentList: FollowMemberItem[] = activeTab === "followers" ? followers : following;
  const isLoading = activeTab === "followers" ? isLoadingFollowers : isLoadingFollowing;

  const filteredList = currentList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nome = (m.nome || "").toLowerCase();
    const nick = (m.nickname || "").toLowerCase();
    const handle = (m.custom_url || m.discord_username || "").toLowerCase();
    const gid = (m.game_id || "").toLowerCase();
    return nome.includes(q) || nick.includes(q) || handle.includes(q) || gid.includes(q);
  });

  const handleMemberClick = (member: FollowMemberItem) => {
    onClose();
    const slug = (member.custom_url || member.discord_username?.replace(/#0$/, "") || member.id).replace(/^@/, "");
    navigate({ to: "/@$handle", params: { handle: slug } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden text-foreground">
        {/* CABEÇALHO */}
        <DialogHeader className="p-5 pb-3 border-b border-border/60 bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <DialogTitle className="text-base font-black flex items-center gap-2 text-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span>Conexões da Facção</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate max-w-[280px]">
                Rede de integrantes ligados a <span className="font-bold text-foreground">{targetName}</span>
              </DialogDescription>
            </div>
          </div>

          {/* ABAS SEGUIDORES / SEGUINDO */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/60 rounded-xl mt-3 border border-border/50">
            <button
              type="button"
              onClick={() => setActiveTab("followers")}
              className={cn(
                "py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                activeTab === "followers"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>Seguidores</span>
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono font-bold">
                {followers.length}
              </Badge>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("following")}
              className={cn(
                "py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                activeTab === "following"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Seguindo</span>
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono font-bold">
                {following.length}
              </Badge>
            </button>
          </div>

          {/* BUSCA RÁPIDA */}
          <div className="relative mt-2.5">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome, nickname, @ ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-8 text-xs bg-background/80 rounded-xl border-border/60 focus-visible:ring-primary/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* LISTAGEM DE MEMBROS */}
        <div className="max-h-[380px] overflow-y-auto p-3 space-y-1.5 divide-y divide-border/20">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Carregando integrantes...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-secondary/60 border border-border/60 flex items-center justify-center">
                <UserX className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-xs font-bold text-foreground">
                {searchQuery
                  ? "Nenhum integrante encontrado com este termo."
                  : activeTab === "followers"
                  ? "Este membro ainda não possui seguidores."
                  : "Este membro ainda não está seguindo ninguém."}
              </p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                {searchQuery
                  ? "Tente buscar usando outro nome, nickname ou ID em jogo."
                  : "As conexões entre membros aparecem aqui automaticamente."}
              </p>
            </div>
          ) : (
            filteredList.map((member) => {
              const displayName = member.nickname || member.nome;
              const initials = displayName.slice(0, 2).toUpperCase();
              const nivel = (member.nivel || "novato") as AppLevel;
              const isSelf = user?.id === member.id;
              const isTargetMember = member.id === targetUserId;

              return (
                <div
                  key={member.id}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-secondary/40 transition-colors group"
                >
                  {/* DADOS DO INTEGRANTE COM CLIQUE PARA O PERFIL */}
                  <div
                    onClick={() => handleMemberClick(member)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <Avatar className="h-10 w-10 rounded-xl border border-border/80 shadow-xs shrink-0 ring-1 ring-primary/20">
                      {member.avatar_url && (
                        <AvatarImage
                          src={getProxiedImageUrl(member.avatar_url)}
                          alt={displayName}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-gradient-brand text-primary-foreground font-black text-xs rounded-xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate max-w-[140px]">
                          {displayName}
                        </span>

                        {member.is_ceo && <CeoBadge size="xs" />}
                        {member.is_developer && <DevBadge size="xs" />}

                        <Badge
                          variant="outline"
                          className={cn("text-[9px] uppercase font-mono px-1 py-0 h-4", levelBadgeClass(nivel))}
                        >
                          {LEVEL_LABEL[nivel] || nivel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                        {member.game_id && (
                          <span className="bg-secondary/80 px-1 rounded text-foreground/80 font-bold">
                            ID: {member.game_id}
                          </span>
                        )}
                        <span className="truncate">
                          @{member.custom_url || member.discord_username?.replace(/#0$/, "") || member.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AÇÕES (SEGUIR / PERFIL) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isSelf && user && (
                      <Button
                        type="button"
                        size="sm"
                        variant={member.is_following ? "outline" : "default"}
                        disabled={followMutation.isPending}
                        onClick={() => followMutation.mutate(member.id)}
                        className={cn(
                          "h-7 px-2.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all",
                          member.is_following
                            ? "border-border/80 text-muted-foreground hover:bg-destructive/20 hover:border-destructive/40 hover:text-destructive"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                        )}
                      >
                        {member.is_following ? (
                          <>
                            <UserCheck className="h-3 w-3 mr-1 text-emerald-400" />
                            <span>Seguindo</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3 mr-1" />
                            <span>Seguir</span>
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMemberClick(member)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                      title="Abrir perfil deste integrante"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="p-3 border-t border-border/60 bg-secondary/20 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-mono">
            {filteredList.length} de {currentList.length} integrante{currentList.length !== 1 ? "s" : ""}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 px-3 text-xs font-bold rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
