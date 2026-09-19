import { useState, useRef, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Flame,
  Sparkles,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Trash2,
  Pin,
  Image as ImageIcon,
  Video,
  Send,
  AtSign,
  Hash,
  X,
  UserPlus,
  UserCheck,
  User,
  ExternalLink,
  Loader2,
  Check,
  TrendingUp,
  Users,
  Compass,
  Smile,
  Maximize2,
  Play,
} from "lucide-react";
import { PageHeader, NoAccess, ProductThumbnail } from "@/components/ui-kit";
import { UniversalImageAdjusterModal } from "@/components/ui/UniversalImageAdjusterModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { usePresence } from "@/hooks/usePresence";
import { supabase } from "@/integrations/supabase/client";
import {
  getLifeFeed,
  createProfilePost,
  deleteProfilePost,
  togglePostLike,
  togglePostBookmark,
  getPostComments,
  createPostComment,
  deletePostComment,
  togglePinPost,
  toggleFollowMember,
  getProfileFollowStats,
  getSuggestedMembersToFollow,
  getTrendingHashtags,
  type LifeFeedTab,
} from "@/services/profileFeedService";
import { LEVEL_LABEL, levelBadgeClass, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { ProfilePost, ProfilePostComment } from "@/types/profileFeed";

export const Route = createFileRoute("/_authenticated/life")({
  component: LifePage,
});

/* =========================================================================
   UTILITÁRIOS E HELPERS DE VÍDEO / LINKS
   ========================================================================= */

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

function extractStreamableId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/streamable\.com\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".mov");
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "agora";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `há ${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "ontem";
    if (diffDays < 7) return `há ${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

/**
 * Renderiza texto formatando menções @ e tags #
 */
function FormattedPostContent({
  content,
  onTagClick,
}: {
  content: string;
  onTagClick?: (tag: string) => void;
}) {
  if (!content) return null;

  const tokenRegex = /(https?:\/\/[^\s]+)|(@[a-zA-Z0-9_.-]+)|(#[a-zA-Z0-9_\u00C0-\u00FF]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("http://") || token.startsWith("https://")) {
      parts.push(
        <a
          key={match.index}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-semibold break-all inline-flex items-center gap-0.5"
        >
          <span>{token.length > 35 ? `${token.slice(0, 35)}...` : token}</span>
          <ExternalLink className="h-3 w-3 inline" />
        </a>
      );
    } else if (token.startsWith("@")) {
      const cleanMention = token.slice(1).replace(/#0$/, "");
      parts.push(
        <Link
          key={match.index}
          to={`/@${cleanMention}` as any}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary/15 text-primary hover:bg-primary/25 font-bold transition-colors"
        >
          <AtSign className="h-3 w-3 inline" />
          <span>{cleanMention}</span>
        </Link>
      );
    } else if (token.startsWith("#")) {
      const cleanTag = token.slice(1);
      parts.push(
        <button
          key={match.index}
          type="button"
          onClick={() => onTagClick?.(cleanTag)}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-secondary/80 text-foreground font-mono text-xs font-bold hover:text-primary hover:bg-secondary transition-colors border border-border/60 cursor-pointer"
        >
          #{cleanTag}
        </button>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return (
    <div className="whitespace-pre-wrap leading-relaxed break-words text-sm text-foreground/95">
      {parts}
    </div>
  );
}

/* =========================================================================
   COMPONENTE PRINCIPAL: LIFE PAGE
   ========================================================================= */

export function LifePage() {
  const { user, profile, hasPermission, isDevUser, isCeoUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: members = [] } = useMembers();
  const { isOnline } = usePresence();

  const canView = hasPermission("view_life");
  const canPost = hasPermission("post_life");
  const canManage = hasPermission("manage_life") || isDevUser || isCeoUser;

  // Tabs state
  const [activeTab, setActiveTab] = useState<LifeFeedTab>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Composer state
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "none">("none");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaMode, setMediaMode] = useState<"image" | "video">("image");

  // Autocomplete @mentions
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Image Studio state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioFile, setStudioFile] = useState<File | null>(null);
  const [studioOriginalUrl, setStudioOriginalUrl] = useState<string | null>(null);

  // Lightbox Modal state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Queries
  const { data: posts = [], isLoading: loadingPosts, refetch: refetchFeed } = useQuery({
    queryKey: ["life-feed", activeTab, user?.id, selectedTag],
    queryFn: () =>
      getLifeFeed({
        tab: activeTab,
        currentUserId: user?.id,
        tagFilter: selectedTag,
      }),
    staleTime: 1000 * 10,
  });

  const { data: suggestedMembers = [] } = useQuery({
    queryKey: ["life-suggested-members", user?.id],
    queryFn: () => getSuggestedMembersToFollow(user?.id, 5),
    staleTime: 1000 * 30,
  });

  const { data: trendingTags = [] } = useQuery({
    queryKey: ["life-trending-tags"],
    queryFn: () => getTrendingHashtags(8),
    staleTime: 1000 * 60,
  });

  const { data: myStats } = useQuery({
    queryKey: ["profile-follow-stats", user?.id],
    queryFn: () => (user?.id ? getProfileFollowStats(user.id, user.id) : null),
    enabled: !!user?.id,
  });

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: () =>
      createProfilePost(
        content,
        mediaMode === "image" ? mediaUrl : null,
        mediaMode === "video" ? videoUrl : null,
        mediaMode === "video" ? "video" : mediaUrl ? "image" : "none"
      ),
    onSuccess: () => {
      setContent("");
      setMediaUrl("");
      setVideoUrl("");
      setShowMediaInput(false);
      setMediaType("none");
      void queryClient.invalidateQueries({ queryKey: ["life-feed"] });
      void queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["life-trending-tags"] });
      toast.success("Publicado no Life com sucesso! 🚀");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao publicar no Life.");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => deleteProfilePost(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["life-feed"] });
      toast.success("Publicação removida com sucesso!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao remover publicação."),
  });

  const likePostMutation = useMutation({
    mutationFn: (postId: string) => togglePostLike(postId),
    onSuccess: (data, postId) => {
      // Otimização de cache instantânea
      queryClient.setQueryData(
        ["life-feed", activeTab, user?.id, selectedTag],
        (old: ProfilePost[] | undefined) => {
          if (!old) return old;
          return old.map((p) =>
            p.id === postId
              ? { ...p, is_liked_by_me: data.isLiked, likes_count: data.newCount }
              : p
          );
        }
      );
    },
  });

  const bookmarkPostMutation = useMutation({
    mutationFn: (postId: string) => togglePostBookmark(postId),
    onSuccess: (data, postId) => {
      queryClient.setQueryData(
        ["life-feed", activeTab, user?.id, selectedTag],
        (old: ProfilePost[] | undefined) => {
          if (!old) return old;
          return old.map((p) =>
            p.id === postId ? { ...p, is_bookmarked_by_me: data.isBookmarked } : p
          );
        }
      );
      toast.success(
        data.isBookmarked
          ? "Publicação salva nos seus favoritos! 🔖"
          : "Publicação removida dos seus favoritos."
      );
      void queryClient.invalidateQueries({ queryKey: ["life-feed", "saved"] });
    },
  });

  const followMutation = useMutation({
    mutationFn: (targetUserId: string) => toggleFollowMember(targetUserId),
    onSuccess: (data, targetUserId) => {
      toast.success(
        data.isFollowing ? "Você agora está seguindo este membro!" : "Deixou de seguir."
      );
      void queryClient.invalidateQueries({ queryKey: ["life-feed"] });
      void queryClient.invalidateQueries({ queryKey: ["life-suggested-members"] });
      void queryClient.invalidateQueries({ queryKey: ["profile-follow-stats"] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ postId, pinned }: { postId: string; pinned: boolean }) =>
      togglePinPost(postId, pinned),
    onSuccess: (_, vars) => {
      toast.success(vars.pinned ? "Publicação fixada no topo!" : "Publicação desafixada.");
      void queryClient.invalidateQueries({ queryKey: ["life-feed"] });
    },
  });

  // Autocomplete de @menções
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_.-]*)$/);

    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionPosition({
        start: cursorPos - match[0].length,
        end: cursorPos,
      });
    } else {
      setMentionQuery(null);
      setMentionPosition(null);
    }
  };

  const handleSelectMention = (memberSlug: string) => {
    if (!mentionPosition || !textareaRef.current) return;

    const before = content.slice(0, mentionPosition.start);
    const after = content.slice(mentionPosition.end);
    const newContent = `${before}@${memberSlug} ${after}`;

    setContent(newContent);
    setMentionQuery(null);
    setMentionPosition(null);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = before.length + memberSlug.length + 2;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 50);
  };

  const filteredMentionMembers =
    mentionQuery !== null
      ? members
          .filter((m) => {
            const q = mentionQuery.toLowerCase();
            const nome = (m.nome || "").toLowerCase();
            const nick = (m.nickname || "").toLowerCase();
            const dUser = (m.discord_username || "").toLowerCase().replace(/#0$/, "");
            const cUrl = (m.custom_url || "").toLowerCase();
            return (
              nome.includes(q) ||
              nick.includes(q) ||
              dUser.includes(q) ||
              cUrl.includes(q)
            );
          })
          .slice(0, 5)
      : [];

  // Stories Strip: Lista de membros ativos com posts recentes
  const recentPosterMembers = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ id: string; name: string; avatar: string | null; slug: string }> = [];

    // Adiciona o próprio usuário primeiro
    if (user?.id) {
      seen.add(user.id);
      list.push({
        id: user.id,
        name: profile?.nickname || profile?.nome || "Você",
        avatar: profile?.discord_avatar_url || profile?.avatar_url || null,
        slug: (profile?.custom_theme as any)?.custom_url || user.id,
      });
    }

    posts.forEach((p) => {
      if (p.author && !seen.has(p.author_id)) {
        seen.add(p.author_id);
        list.push({
          id: p.author_id,
          name: p.author.nickname || p.author.nome,
          avatar: p.author.avatar_url || null,
          slug: p.author.custom_url || p.author.discord_username || p.author_id,
        });
      }
    });

    return list.slice(0, 10);
  }, [posts, user?.id, profile]);

  if (!canView) return <NoAccess />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* HEADER DE BOAS-VINDAS LIFE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-rose-500 via-primary to-emerald-400 p-0.5 flex items-center justify-center shadow-md">
              <div className="h-full w-full bg-background rounded-[10px] flex items-center justify-center">
                <Flame className="h-5 w-5 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2 font-display">
                <span>Twin Life</span>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/30 font-mono text-[10px] font-extrabold uppercase px-2"
                >
                  Feed Social
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                A rede social da facção. Compartilhe momentos, fotos, vídeos, siga parceiros e comente.
              </p>
            </div>
          </div>
        </div>

        {/* Indicadores rápidos de contagem */}
        <div className="flex items-center gap-2">
          {selectedTag && (
            <Badge
              variant="secondary"
              className="bg-primary/15 text-primary font-bold text-xs gap-1 py-1 px-2.5 rounded-xl border border-primary/30"
            >
              <Hash className="h-3 w-3" />
              <span>{selectedTag}</span>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="hover:bg-primary/20 rounded-full p-0.5 ml-1"
                title="Remover filtro de hashtag"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchFeed()}
            className="h-8 text-xs font-bold rounded-xl gap-1.5 border-border/80 hover:border-primary/50"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Atualizar Feed</span>
          </Button>
        </div>
      </div>

      {/* STRIP DE STORIES / DESTAQUES NO TOPO */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-primary" /> Destaques & Membros Ativos no Life
          </p>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar mobile-touch-scroll">
          {recentPosterMembers.map((m) => {
            const isMe = m.id === user?.id;
            return (
              <Link
                key={m.id}
                to={`/@${m.slug}` as any}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer text-center"
              >
                <div
                  className={cn(
                    "p-0.5 rounded-full transition-transform duration-200 group-hover:scale-105 shadow-sm",
                    isMe
                      ? "bg-gradient-to-tr from-primary to-emerald-400"
                      : "bg-gradient-to-tr from-rose-500 via-purple-500 to-primary"
                  )}
                >
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-background">
                    {m.avatar && <AvatarImage src={m.avatar} alt={m.name} />}
                    <AvatarFallback className="text-xs font-bold bg-secondary">
                      {m.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-[11px] font-bold text-foreground truncate max-w-[70px] leading-tight">
                  {isMe ? "Seu Perfil" : m.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* LAYOUT PRINCIPAL EM 2 COLUNAS (FEED À ESQUERDA + SIDEBAR À DIREITA NO DESKTOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUNA ESQUERDA: COMPOSER + ABAS + POSTS (2 COLUNAS EM LG) */}
        <div className="lg:col-span-2 space-y-5">
          {/* COMPOSER DE POSTAGEM */}
          {canPost && (
            <Card className="surface-card border-primary/30 shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 pt-3 px-4 sm:px-5 border-b border-border/40 bg-secondary/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 rounded-lg border border-border">
                      {profile?.discord_avatar_url || profile?.avatar_url ? (
                        <AvatarImage src={profile.discord_avatar_url || profile.avatar_url} />
                      ) : null}
                      <AvatarFallback className="text-[10px] font-bold">
                        {(profile?.nickname || profile?.nome || "M").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-extrabold text-foreground">
                      Publicar no Life
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground">
                    {content.length}/2000
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleTextChange}
                    placeholder="O que está rolando em Los Santos? Compartilhe ações, rolês, memes ou novidades... Dica: use @membro e #hashtag!"
                    className="min-h-[85px] text-xs sm:text-sm resize-y rounded-xl border-border/80 focus:border-primary/50 p-3 leading-relaxed"
                    maxLength={2000}
                  />

                  {/* AUTOCOMPLETE POPUP @MENÇÃO */}
                  {mentionQuery !== null && filteredMentionMembers.length > 0 && (
                    <div className="absolute left-2 bottom-full mb-1 w-64 max-h-48 overflow-y-auto rounded-xl border border-border/80 bg-card shadow-2xl p-1 z-50 animate-in fade-in-50 zoom-in-95 ring-1 ring-border/40 backdrop-blur-2xl">
                      <p className="px-2 py-1 text-[10px] font-mono text-muted-foreground uppercase font-bold border-b border-border/40">
                        Marcar membro:
                      </p>
                      {filteredMentionMembers.map((m) => {
                        const slug = m.custom_url || m.discord_username?.replace(/#0$/, "") || m.nome;
                        const avatar = m.discord_avatar_url || m.avatar_url;
                        return (
                          <button
                            key={m.user_id}
                            type="button"
                            onClick={() => handleSelectMention(slug)}
                            className="w-full text-left flex items-center gap-2 p-1.5 rounded-lg hover:bg-primary/15 hover:text-primary transition-colors text-xs cursor-pointer"
                          >
                            <Avatar className="h-6 w-6 rounded-md">
                              {avatar && <AvatarImage src={avatar} />}
                              <AvatarFallback className="text-[10px]">
                                {(m.nickname || m.nome || "M").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold truncate text-[11px] text-foreground">
                                {m.nickname || m.nome}
                              </p>
                              <p className="font-mono text-[10px] text-muted-foreground truncate">
                                @{slug}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* PREVIEW DA MÍDIA INCLUÍDA NO COMPOSER */}
                {mediaMode === "image" && mediaUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border/70 max-h-60 bg-black/40 flex items-center justify-center group">
                    <img
                      src={mediaUrl}
                      alt="Preview"
                      className="max-h-60 w-auto object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaUrl("")}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                      title="Remover foto"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                {mediaMode === "video" && videoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border/70 p-2 bg-secondary/30 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-sky-400 flex items-center gap-1">
                        <Video className="h-3.5 w-3.5" /> Vídeo Vinculado:
                      </span>
                      <button
                        type="button"
                        onClick={() => setVideoUrl("")}
                        className="text-rose-400 hover:text-rose-300"
                        title="Remover vídeo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground truncate">{videoUrl}</p>
                  </div>
                ) : null}

                {/* PAINEL RECOLHÍVEL DE ENTRADA DE MÍDIA */}
                {showMediaInput && (
                  <div className="p-3 rounded-xl border border-border/70 bg-secondary/30 space-y-3 animate-in fade-in-50">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={mediaMode === "image" ? "default" : "outline"}
                        className={cn(
                          "h-7 text-xs font-bold gap-1 rounded-lg",
                          mediaMode === "image" ? "bg-primary text-primary-foreground" : ""
                        )}
                        onClick={() => setMediaMode("image")}
                      >
                        <ImageIcon className="h-3.5 w-3.5" /> Foto / Imagem
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={mediaMode === "video" ? "default" : "outline"}
                        className={cn(
                          "h-7 text-xs font-bold gap-1 rounded-lg",
                          mediaMode === "video" ? "bg-sky-600 text-white" : ""
                        )}
                        onClick={() => setMediaMode("video")}
                      >
                        <Video className="h-3.5 w-3.5" /> Vídeo (YouTube / Clipes)
                      </Button>
                    </div>

                    {mediaMode === "image" ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Input
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="Cole o link da imagem (Discord CDN, Imgur, etc.)..."
                          className="h-8 text-xs font-mono flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 text-xs font-bold gap-1 rounded-lg shrink-0"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span>Upload & Studio</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Input
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="Cole o link do YouTube (watch/shorts), Streamable ou URL direta .mp4..."
                          className="h-8 text-xs font-mono"
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Compatível com: YouTube, Streamable e links diretos de vídeo (.mp4/.webm).
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* BOTÕES DE AÇÃO DO COMPOSER */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowMediaInput((prev) => !prev);
                        setMediaMode("image");
                      }}
                      className={cn(
                        "h-8 text-xs gap-1.5 rounded-xl",
                        mediaUrl ? "text-primary font-bold bg-primary/10" : "text-muted-foreground"
                      )}
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Foto</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowMediaInput(true);
                        setMediaMode("video");
                      }}
                      className={cn(
                        "h-8 text-xs gap-1.5 rounded-xl",
                        videoUrl ? "text-sky-400 font-bold bg-sky-500/10" : "text-muted-foreground"
                      )}
                    >
                      <Video className="h-4 w-4" />
                      <span className="hidden sm:inline">Vídeo</span>
                    </Button>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs gap-1 rounded-xl text-muted-foreground"
                        >
                          <Hash className="h-4 w-4 text-primary" />
                          <span className="hidden sm:inline">Tags</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 text-xs">
                        <p className="font-bold text-muted-foreground text-[10px] uppercase pb-1 mb-1 border-b">
                          Inserir hashtag rápida:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {["TwinWheels", "Roleplay", "Rolê", "Ação", "Oficina", "Guerra"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setContent((c) => `${c} #${t} `)}
                              className="px-2 py-0.5 rounded-md bg-secondary text-[11px] font-bold hover:text-primary hover:bg-secondary/80 cursor-pointer"
                            >
                              #{t}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    type="button"
                    onClick={() => createPostMutation.mutate()}
                    disabled={
                      (!content.trim() && !mediaUrl && !videoUrl) ||
                      createPostMutation.isPending
                    }
                    className="h-9 px-4 text-xs font-extrabold rounded-xl gap-1.5 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 cursor-pointer"
                  >
                    {createPostMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Publicar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* BARRA DE NAVEGAÇÃO DE ABAS DO FEED */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setSelectedTag(null);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "all" && !selectedTag
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Para Você</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("following");
                  setSelectedTag(null);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "following"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Seguindo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("saved");
                  setSelectedTag(null);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "saved"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>Salvos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("mine");
                  setSelectedTag(null);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                  activeTab === "mine"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <User className="h-3.5 w-3.5" />
                <span>Meus</span>
              </button>
            </div>
          </div>

          {/* LISTA DE POSTS DO FEED */}
          {loadingPosts ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">
                Carregando publicações do Life...
              </p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="surface-card border-border/70">
              <CardContent className="py-12 text-center space-y-3">
                <Flame className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">
                    {activeTab === "following"
                      ? "Você ainda não segue ninguém com publicações recentes"
                      : activeTab === "saved"
                      ? "Nenhuma publicação salva nos favoritos"
                      : activeTab === "mine"
                      ? "Você ainda não publicou nada no Life"
                      : "Nenhuma publicação encontrada no feed"}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {activeTab === "following"
                      ? "Confira os membros recomendados ao lado e comece a seguir seus parceiros de grupo!"
                      : activeTab === "saved"
                      ? "Toque no ícone de marcador nos posts para guardá-los aqui."
                      : "Seja o primeiro a compartilhar uma novidade ou foto com a facção!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <LifePostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  canManage={canManage}
                  onLike={() => likePostMutation.mutate(post.id)}
                  onBookmark={() => bookmarkPostMutation.mutate(post.id)}
                  onDelete={() => deletePostMutation.mutate(post.id)}
                  onFollow={(targetId) => followMutation.mutate(targetId)}
                  onPin={(pinned) => pinMutation.mutate({ postId: post.id, pinned })}
                  onTagClick={(tag) => setSelectedTag(tag)}
                  onImageClick={(url) => setLightboxImage(url)}
                />
              ))}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: SIDEBAR SOCIAL COM RECOMENDAÇÕES E HASHTAGS */}
        <div className="space-y-5">
          {/* CARD DO PERFIL DO USUÁRIO ATUAL */}
          {user && (
            <Card className="surface-card border-border/70 shadow-sm rounded-2xl overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-emerald-950 via-zinc-950 to-primary/30" />
              <CardContent className="px-4 pb-4 pt-0 relative space-y-3">
                <div className="flex items-end justify-between -mt-8">
                  <Avatar className="h-16 w-16 rounded-2xl border-4 border-card shadow-md">
                    {profile?.discord_avatar_url || profile?.avatar_url ? (
                      <AvatarImage src={profile.discord_avatar_url || profile.avatar_url} />
                    ) : null}
                    <AvatarFallback className="text-sm font-bold bg-secondary">
                      {(profile?.nickname || profile?.nome || "M").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs font-bold rounded-xl"
                  >
                    <Link to="/perfil">Meu Perfil</Link>
                  </Button>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-foreground">
                    {profile?.nickname || profile?.nome}
                  </h4>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    @{profile?.custom_theme?.custom_url || profile?.discord_username || "membro"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-center font-mono text-xs">
                  <div className="p-2 rounded-xl bg-secondary/30">
                    <span className="block font-black text-sm text-foreground">
                      {myStats?.followers_count || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold">
                      Seguidores
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-secondary/30">
                    <span className="block font-black text-sm text-foreground">
                      {myStats?.following_count || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-sans font-bold">
                      Seguindo
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QUEM SEGUIR / MEMBROS RECOMENDADOS */}
          {suggestedMembers.length > 0 && (
            <Card className="surface-card border-border/70 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5 text-primary" /> Quem Seguir no Life
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2.5">
                {suggestedMembers.map((sm) => (
                  <div key={sm.id} className="flex items-center justify-between gap-2">
                    <Link
                      to={`/@${sm.custom_url || sm.discord_username || sm.id}` as any}
                      className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-8 w-8 rounded-xl border border-border shrink-0">
                        {sm.avatar_url && <AvatarImage src={sm.avatar_url} />}
                        <AvatarFallback className="text-xs font-bold">
                          {(sm.nickname || sm.nome).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-foreground truncate">
                          {sm.nickname || sm.nome}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          @{sm.custom_url || sm.discord_username || "membro"}
                        </p>
                      </div>
                    </Link>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => followMutation.mutate(sm.id)}
                      className="h-7 text-xs px-2.5 font-bold rounded-xl border-primary/40 text-primary hover:bg-primary/10 shrink-0 cursor-pointer"
                    >
                      Seguir
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* HASHTAGS POPULARES (#EMALTA) */}
          <Card className="surface-card border-border/70 shadow-sm rounded-2xl">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Tópicos em Alta
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {trendingTags.map((t) => {
                  const isSelected = selectedTag?.toLowerCase() === t.tag.toLowerCase();
                  return (
                    <button
                      key={t.tag}
                      type="button"
                      onClick={() => setSelectedTag(isSelected ? null : t.tag)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-secondary/50 text-muted-foreground border-border/70 hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <span>#{t.tag}</span>
                      <span className="text-[10px] opacity-70 font-mono">({t.count})</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL STUDIO UNIVERSAL DE IMAGEM */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setStudioFile(f);
            setStudioOriginalUrl(null);
            setIsStudioOpen(true);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
      />

      <UniversalImageAdjusterModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        imageFile={studioFile}
        imageUrl={mediaUrl}
        originalImageUrl={studioOriginalUrl || mediaUrl}
        cropShape="rect"
        title="Studio: Ajustar Imagem da Publicação"
        description="Recorte, gire ou aplique filtros na foto antes de publicar no Life."
        onCropSave={async (croppedFile, origSource) => {
          const toastId = toast.loading("Enviando foto ajustada...");
          try {
            const ext = croppedFile.name.split(".").pop()?.toLowerCase() || "png";
            const fileName = `life_${user?.id || "user"}_${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage
              .from("chat-attachments")
              .upload(fileName, croppedFile, {
                cacheControl: "31536000",
                upsert: true,
                contentType: croppedFile.type || "image/png",
              });

            if (!error && data) {
              const pub = supabase.storage.from("chat-attachments").getPublicUrl(data.path);
              setMediaUrl(pub.data.publicUrl);
            } else {
              const b64 = await new Promise<string>((res) => {
                const r = new FileReader();
                r.onload = () => res(r.result as string);
                r.readAsDataURL(croppedFile);
              });
              setMediaUrl(b64);
            }

            if (typeof origSource === "string") {
              setStudioOriginalUrl(origSource);
            }

            setShowMediaInput(true);
            setMediaMode("image");
            setIsStudioOpen(false);
            toast.success("Foto ajustada com sucesso!", { id: toastId });
          } catch (err: any) {
            toast.error("Erro ao enviar imagem ajustada", { id: toastId });
          }
        }}
      />

      {/* MODAL LIGHTBOX DE IMAGEM */}
      <Dialog open={Boolean(lightboxImage)} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-border/40 shadow-2xl">
          <div className="relative flex items-center justify-center max-h-[85vh] overflow-hidden">
            {lightboxImage && (
              <img
                src={lightboxImage}
                alt="Visualização expandida"
                className="max-h-[85vh] w-auto object-contain rounded-xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =========================================================================
   SUBCOMPONENTE: CARD INDIVIDUAL DE POST NO LIFE
   ========================================================================= */

interface LifePostCardProps {
  post: ProfilePost;
  currentUserId?: string;
  canManage: boolean;
  onLike: () => void;
  onBookmark: () => void;
  onDelete: () => void;
  onFollow: (targetId: string) => void;
  onPin: (pinned: boolean) => void;
  onTagClick: (tag: string) => void;
  onImageClick: (url: string) => void;
}

function LifePostCard({
  post,
  currentUserId,
  canManage,
  onLike,
  onBookmark,
  onDelete,
  onFollow,
  onPin,
  onTagClick,
  onImageClick,
}: LifePostCardProps) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const isSelf = currentUserId === post.author_id;
  const authorSlug =
    post.author?.custom_url || post.author?.discord_username || post.author_id;

  // Comentários da postagem
  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ["post-comments", post.id],
    queryFn: () => getPostComments(post.id, currentUserId),
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => createPostComment(post.id, text),
    onSuccess: () => {
      setCommentText("");
      void queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
      void queryClient.invalidateQueries({ queryKey: ["life-feed"] });
      toast.success("Comentário publicado!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao comentar."),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deletePostComment(commentId, post.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
      void queryClient.invalidateQueries({ queryKey: ["life-feed"] });
      toast.success("Comentário removido.");
    },
  });

  const handleShare = () => {
    const url = `${window.location.origin}/life#post-${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link da publicação copiado para a área de transferência!");
  };

  // Mídias
  const youtubeId = post.video_url ? extractYouTubeId(post.video_url) : null;
  const streamableId = post.video_url ? extractStreamableId(post.video_url) : null;
  const isDirectVideo = post.video_url ? isDirectVideoUrl(post.video_url) : false;

  return (
    <Card
      id={`post-${post.id}`}
      className={cn(
        "surface-card transition-all duration-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md border",
        post.pinned ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20" : "border-border/70"
      )}
    >
      {/* BANNER DE POST FIXADO NO TOPO */}
      {post.pinned && (
        <div className="px-4 py-1 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between text-[11px] font-bold text-amber-400">
          <span className="flex items-center gap-1.5">
            <Pin className="h-3 w-3 fill-amber-400 text-amber-400" />
            Publicação Fixada pela Liderança
          </span>
          {canManage && (
            <button
              type="button"
              onClick={() => onPin(false)}
              className="text-[10px] uppercase underline hover:text-amber-300 cursor-pointer"
            >
              Desafixar
            </button>
          )}
        </div>
      )}

      {/* CABEÇALHO DO AUTOR */}
      <CardHeader className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link to={`/@${authorSlug}` as any} className="shrink-0 group">
              <Avatar className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border border-border group-hover:ring-2 group-hover:ring-primary/50 transition-all shadow-sm">
                {post.author?.avatar_url && <AvatarImage src={post.author.avatar_url} />}
                <AvatarFallback className="text-xs font-bold bg-secondary">
                  {(post.author?.nickname || post.author?.nome || "M").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={`/@${authorSlug}` as any}
                  className="font-extrabold text-xs sm:text-sm text-foreground hover:text-primary transition-colors truncate leading-tight"
                >
                  {post.author?.nickname || post.author?.nome}
                </Link>

                {post.author?.level && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-extrabold tracking-wide uppercase px-1.5 py-0 rounded-md",
                      levelBadgeClass(post.author.level as AppLevel)
                    )}
                  >
                    {LEVEL_LABEL[post.author.level as AppLevel] || post.author.level}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                <span className="font-mono">@{authorSlug}</span>
                <span>•</span>
                <span>{formatRelativeTime(post.created_at)}</span>
              </div>
            </div>
          </div>

          {/* BOTÃO DE SEGUIR & MENU DE OPÇÕES */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isSelf && currentUserId && (
              <Button
                type="button"
                size="sm"
                variant={post.is_following_author ? "secondary" : "outline"}
                onClick={() => onFollow(post.author_id)}
                className={cn(
                  "h-7 text-xs px-2.5 font-bold rounded-xl transition-all cursor-pointer",
                  post.is_following_author
                    ? "bg-secondary text-foreground hover:bg-destructive/15 hover:text-destructive"
                    : "border-primary/50 text-primary hover:bg-primary/10"
                )}
              >
                {post.is_following_author ? (
                  <>
                    <UserCheck className="h-3 w-3 mr-1" />
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground">
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleShare} className="cursor-pointer text-xs">
                  <Share2 className="h-3.5 w-3.5 mr-2" /> Copiar Link do Post
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer text-xs">
                  <Link to={`/@${authorSlug}` as any}>
                    <User className="h-3.5 w-3.5 mr-2" /> Ver Perfil do Autor
                  </Link>
                </DropdownMenuItem>

                {canManage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onPin(!post.pinned)}
                      className="cursor-pointer text-xs text-amber-400"
                    >
                      <Pin className="h-3.5 w-3.5 mr-2" />
                      {post.pinned ? "Desafixar do Topo" : "Fixar no Topo"}
                    </DropdownMenuItem>
                  </>
                )}

                {(isSelf || canManage) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="cursor-pointer text-xs text-destructive font-medium"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir Publicação
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* CONTEÚDO DO POST */}
      <CardContent className="px-4 sm:px-5 pb-3 space-y-3">
        <FormattedPostContent content={post.content} onTagClick={onTagClick} />

        {/* RENDERIZADOR DE MÍDIA (FOTO OU VÍDEO) */}
        {post.media_url ? (
          <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-black/40 shadow-inner my-2">
            <img
              src={post.media_url}
              alt="Mídia da publicação"
              onClick={() => onImageClick(post.media_url!)}
              className="max-h-[480px] w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
              loading="lazy"
            />
          </div>
        ) : null}

        {post.video_url ? (
          <div className="rounded-2xl overflow-hidden border border-border/70 bg-black shadow-md my-2">
            {youtubeId ? (
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : streamableId ? (
              <div className="aspect-video w-full">
                <iframe
                  src={`https://streamable.com/e/${streamableId}`}
                  title="Streamable video player"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : isDirectVideo ? (
              <video
                src={post.video_url}
                controls
                playsInline
                className="w-full max-h-[480px] bg-black"
              />
            ) : (
              <div className="p-4 flex items-center justify-between gap-2 bg-secondary/30 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Play className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate font-mono">{post.video_url}</span>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs shrink-0">
                  <a href={post.video_url} target="_blank" rel="noopener noreferrer">
                    Assistir <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {/* BARRA DE BOTÕES DE INTERAÇÃO (CURTIR, COMENTAR, SALVAR, COMPARTILHAR) */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40 text-muted-foreground text-xs">
          <div className="flex items-center gap-3">
            {/* Botão Curtir */}
            <button
              type="button"
              onClick={onLike}
              className={cn(
                "flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl transition-all cursor-pointer",
                post.is_liked_by_me
                  ? "text-rose-500 font-extrabold bg-rose-500/10 shadow-xs"
                  : "hover:text-rose-400 hover:bg-rose-500/5"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-transform active:scale-125",
                  post.is_liked_by_me ? "fill-rose-500 text-rose-500" : ""
                )}
              />
              <span className="font-mono text-xs">{post.likes_count || 0}</span>
            </button>

            {/* Botão Comentários */}
            <button
              type="button"
              onClick={() => setShowComments((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 p-1.5 px-2.5 rounded-xl transition-all cursor-pointer",
                showComments
                  ? "text-primary font-bold bg-primary/10"
                  : "hover:text-primary hover:bg-primary/5"
              )}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-mono text-xs">{post.comments_count || 0}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Botão Salvar / Favoritar */}
            <button
              type="button"
              onClick={onBookmark}
              className={cn(
                "p-2 rounded-xl transition-all cursor-pointer",
                post.is_bookmarked_by_me
                  ? "text-amber-400 font-bold bg-amber-500/15"
                  : "hover:text-amber-400 hover:bg-amber-500/10"
              )}
              title={post.is_bookmarked_by_me ? "Remover dos salvos" : "Salvar nos favoritos"}
            >
              <Bookmark
                className={cn(
                  "h-4 w-4",
                  post.is_bookmarked_by_me ? "fill-amber-400 text-amber-400" : ""
                )}
              />
            </button>

            {/* Botão Compartilhar */}
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
              title="Copiar link"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* SEÇÃO EXPANSÍVEL DE COMENTÁRIOS */}
        {showComments && (
          <div className="pt-3 border-t border-border/40 space-y-3 animate-in fade-in-50 duration-200">
            {/* Input para novo comentário */}
            <div className="flex items-center gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && commentText.trim()) {
                    e.preventDefault();
                    commentMutation.mutate(commentText);
                  }
                }}
                placeholder="Escreva um comentário..."
                className="h-8 text-xs rounded-xl border-border/70 flex-1"
                maxLength={800}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => commentMutation.mutate(commentText)}
                disabled={!commentText.trim() || commentMutation.isPending}
                className="h-8 px-3 text-xs font-bold rounded-xl bg-primary text-primary-foreground cursor-pointer"
              >
                {commentMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            {/* Lista de comentários */}
            {loadingComments ? (
              <div className="py-4 text-center">
                <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic text-center py-2">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </p>
            ) : (
              <div className="space-y-2.5 pt-1">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-2 text-xs group">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <Link to={`/@${c.author?.custom_url || c.author?.discord_username || c.author_id}` as any}>
                        <Avatar className="h-6 w-6 rounded-lg border border-border shrink-0 mt-0.5">
                          {c.author?.avatar_url && <AvatarImage src={c.author.avatar_url} />}
                          <AvatarFallback className="text-[9px] font-bold">
                            {(c.author?.nickname || c.author?.nome || "M").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="min-w-0 flex-1 bg-secondary/35 rounded-xl p-2 px-2.5 border border-border/40">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            to={`/@${c.author?.custom_url || c.author?.discord_username || c.author_id}` as any}
                            className="font-bold text-[11px] text-foreground hover:text-primary truncate"
                          >
                            {c.author?.nickname || c.author?.nome}
                          </Link>
                          <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                            {formatRelativeTime(c.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed mt-0.5 break-words">
                          {c.content}
                        </p>
                      </div>
                    </div>

                    {(c.is_own || canManage) && (
                      <button
                        type="button"
                        onClick={() => deleteCommentMutation.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
                        title="Excluir comentário"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
