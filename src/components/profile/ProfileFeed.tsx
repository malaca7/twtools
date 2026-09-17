import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Send,
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Check,
  AtSign,
  Hash,
  X,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getProfilePosts,
  createProfilePost,
  deleteProfilePost,
  togglePostLike,
} from "@/services/profileFeedService";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useData";
import { cn } from "@/lib/utils";
import type { ProfilePost } from "@/types/profileFeed";

interface ProfileFeedProps {
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  isSelf: boolean;
}

/**
 * Formatador de tempo relativo em português sem dependência externa
 */
function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return "agora mesmo";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "ontem";
    if (diffDays < 7) return `há ${diffDays} dias`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

/**
 * Renderizador de conteúdo que estiliza @menções e #hashtags
 */
function PostContentRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Regex combinando URLs, @menções e #hashtags
  const tokenRegex = /(https?:\/\/[^\s]+)|(@[a-zA-Z0-9_.-]+)|(#[a-zA-Z0-9_\u00C0-\u00FF]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(content)) !== null) {
    // Texto comum antes do token
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("http://") || token.startsWith("https://")) {
      // URL externa
      parts.push(
        <a
          key={match.index}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-all"
        >
          {token}
        </a>
      );
    } else if (token.startsWith("@")) {
      // Menção de membro
      const cleanMention = token.slice(1).replace(/#0$/, "");
      parts.push(
        <a
          key={match.index}
          href={`/perfil/${cleanMention}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-primary/15 text-primary hover:bg-primary/25 font-bold transition-colors"
        >
          <AtSign className="h-3 w-3 inline" />
          <span>{cleanMention}</span>
        </a>
      );
    } else if (token.startsWith("#")) {
      // Hashtag
      const cleanTag = token.slice(1);
      parts.push(
        <span
          key={match.index}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-secondary/80 text-foreground/90 font-mono text-[11px] font-semibold hover:text-primary transition-colors border border-border/60"
        >
          #{cleanTag}
        </span>
      );
    }

    lastIndex = match.index + token.length;
  }

  // Restante do texto
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return <div className="whitespace-pre-wrap leading-relaxed break-words text-sm text-foreground/90">{parts}</div>;
}

export function ProfileFeed({ authorId, authorName, authorAvatar, isSelf }: ProfileFeedProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: members = [] } = useMembers();

  // Estado do editor
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);

  // Autocomplete de @menções
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Consulta de postagens do perfil
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["profile-posts", authorId, user?.id],
    queryFn: () => getProfilePosts(authorId, user?.id),
    staleTime: 1000 * 15,
  });

  // Mutação para criar post
  const createPostMutation = useMutation({
    mutationFn: () => createProfilePost(content, mediaUrl),
    onSuccess: () => {
      setContent("");
      setMediaUrl("");
      setShowMediaInput(false);
      void queryClient.invalidateQueries({ queryKey: ["profile-posts", authorId] });
      toast.success("Publicado no seu feed com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao publicar no feed.");
    },
  });

  // Mutação para excluir post
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => deleteProfilePost(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile-posts", authorId] });
      toast.success("Publicação removida com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao remover publicação.");
    },
  });

  // Lógica de digitação e detecção de @menção
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(val);

    // Detecta se antes do cursor há uma palavra começando com @
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

  // Ao selecionar um membro no autocomplete
  const handleSelectMention = (memberSlug: string) => {
    if (!mentionPosition || !textareaRef.current) return;

    const before = content.slice(0, mentionPosition.start);
    const after = content.slice(mentionPosition.end);
    const newContent = `${before}@${memberSlug} ${after}`;

    setContent(newContent);
    setMentionQuery(null);
    setMentionPosition(null);

    // Reposiciona o cursor após a menção inserida
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = before.length + memberSlug.length + 2;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 50);
  };

  // Filtrar membros para menção
  const filteredMembers = mentionQuery !== null
    ? members.filter((m) => {
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
      }).slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      {/* SEÇÃO DO EDITOR: APENAS VISÍVEL PARA O DONO DO PERFIL LOGADO */}
      {isSelf && (
        <Card className="surface-card border-primary/20 shadow-md">
          <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Publicar no seu Feed</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 px-4 sm:px-5 pb-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleTextChange}
                placeholder="Compartilhe uma ideia, novidade ou status com a facção... Dica: use @membro para marcar e #hashtag para criar tópicos."
                className="min-h-[90px] text-xs resize-y rounded-xl border-border/80 focus:border-primary/50 p-3 leading-relaxed"
                maxLength={2000}
              />

              {/* POPUP DE AUTOCOMPLETE DE @MENÇÃO */}
              {mentionQuery !== null && filteredMembers.length > 0 && (
                <div className="absolute left-2 bottom-full mb-1 w-64 max-h-48 overflow-y-auto rounded-xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl p-1 z-50 animate-in fade-in-50 zoom-in-95">
                  <p className="px-2 py-1 text-[10px] font-mono text-muted-foreground uppercase font-bold border-b border-border/40">
                    Membros para marcar:
                  </p>
                  {filteredMembers.map((m) => {
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

            {/* INPUT DE IMAGEM ANEXA */}
            {showMediaInput && (
              <div className="flex items-center gap-2 p-2 rounded-xl border border-border/60 bg-secondary/30 text-xs">
                <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                <Input
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="URL direta da imagem (ex.: https://i.imgur.com/... ou link de imagem/GIF)"
                  className="h-8 text-xs font-mono"
                />
                {mediaUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMediaUrl("")}
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}

            {/* PRÉVIA DA IMAGEM ANEXADA */}
            {mediaUrl && (
              <div className="relative rounded-xl overflow-hidden border border-border/70 max-h-48 w-full bg-black/40">
                <img
                  src={mediaUrl}
                  alt="Anexo da publicação"
                  className="w-full h-auto max-h-48 object-contain"
                  onError={() => toast.error("URL de imagem inválida ou inacessível.")}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => setMediaUrl("")}
                  className="absolute top-2 right-2 h-6 w-6 rounded-md shadow-md"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* BARRA DE AÇÕES DO EDITOR */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMediaInput(!showMediaInput)}
                  className={cn(
                    "h-8 px-2.5 text-xs rounded-xl gap-1.5 cursor-pointer",
                    showMediaInput ? "border-primary/40 text-primary bg-primary/10" : "text-muted-foreground"
                  )}
                  title="Anexar imagem ou GIF"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Imagem</span>
                </Button>

                <span className="text-[11px] text-muted-foreground font-mono ml-2">
                  {content.length}/2000
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                disabled={!content.trim() || createPostMutation.isPending}
                onClick={() => createPostMutation.mutate()}
                className="h-8 px-4 text-xs font-bold rounded-xl bg-gradient-brand text-primary-foreground gap-1.5 cursor-pointer shadow-md"
              >
                {createPostMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Publicar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FEED DE POSTAGENS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Feed de Publicações
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground">Carregando feed de publicações...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-secondary/10 space-y-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">Nenhuma publicação ainda</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isSelf
                ? "Você ainda não fez nenhuma publicação no seu feed. Escreva algo acima para interagir com a facção!"
                : `${authorName} ainda não publicou nada em seu feed oficial.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {posts.map((post) => (
              <ProfilePostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                authorAvatar={authorAvatar}
                authorName={authorName}
                onDelete={() => deletePostMutation.mutate(post.id)}
                isDeleting={deletePostMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Card individual de postagem no feed
 */
function ProfilePostCard({
  post,
  currentUserId,
  authorAvatar,
  authorName,
  onDelete,
  isDeleting,
}: {
  post: ProfilePost;
  currentUserId?: string;
  authorAvatar?: string | null;
  authorName: string;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(Boolean(post.is_liked_by_me));
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [copiedLink, setCopiedLink] = useState(false);

  const isAuthor = Boolean(currentUserId && currentUserId === post.author_id);
  const displayName = post.author?.nickname || post.author?.nome || authorName;
  const avatar = post.author?.avatar_url || authorAvatar;
  const authorSlug = post.author?.custom_url || post.author?.discord_username || post.author_id;

  const likeMutation = useMutation({
    mutationFn: () => togglePostLike(post.id),
    onMutate: () => {
      // Optimistic update
      setIsLiked((prev) => !prev);
      setLikesCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
    },
    onSuccess: (data) => {
      setIsLiked(data.isLiked);
      setLikesCount(data.newCount);
    },
    onError: () => {
      // Reverter
      setIsLiked(Boolean(post.is_liked_by_me));
      setLikesCount(post.likes_count || 0);
      toast.error("Erro ao curtir publicação.");
    },
  });

  const handleCopyPostLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const cleanSlug = String(authorSlug || "").replace(/^(@|%40)/i, "");
    const link = `${origin}/perfil/${cleanSlug}#post-${post.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Link da publicação copiado!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <Card id={`post-${post.id}`} className="surface-card border-border/70 shadow-sm transition-all hover:border-border">
      <CardHeader className="pb-2.5 pt-4 px-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 rounded-xl border border-border/70 shadow-xs shrink-0">
              {avatar && <AvatarImage src={avatar} alt={displayName} />}
              <AvatarFallback className="text-xs font-bold">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-foreground truncate">{displayName}</span>
                {post.pinned && (
                  <Badge variant="outline" className="text-[9px] font-mono border-amber-500/40 text-amber-300 bg-amber-500/10 py-0">
                    Fixado
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                <Clock className="h-3 w-3 inline" />
                <span>{formatRelativeTime(post.created_at)}</span>
              </div>
            </div>
          </div>

          {/* AÇÕES NO TOPO DO POST: EXCLUIR */}
          {isAuthor && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isDeleting}
              onClick={() => {
                if (window.confirm("Deseja realmente excluir esta publicação do seu feed?")) {
                  onDelete();
                }
              }}
              className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg cursor-pointer"
              title="Excluir publicação"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 sm:px-5 pb-4 pt-1">
        {/* TEXTO FORMATADO COM @MENÇÕES E #HASHTAGS */}
        <PostContentRenderer content={post.content} />

        {/* IMAGEM ANEXADA */}
        {post.media_url && (
          <div className="rounded-xl overflow-hidden border border-border/60 bg-black/30 mt-2">
            <img
              src={post.media_url}
              alt="Mídia da postagem"
              className="w-full h-auto max-h-96 object-cover cursor-pointer hover:scale-[1.01] transition-transform"
              onClick={() => window.open(post.media_url!, "_blank")}
            />
          </div>
        )}

        {/* RODAPÉ DO POST: CURTIR & COMPARTILHAR */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => likeMutation.mutate()}
              className={cn(
                "h-8 px-2.5 text-xs rounded-xl gap-1.5 transition-colors cursor-pointer",
                isLiked
                  ? "text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-rose-500")} />
              <span className="font-mono font-bold">{likesCount}</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyPostLink}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-xl gap-1.5 cursor-pointer"
            title="Copiar link desta publicação"
          >
            {copiedLink ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            <span>{copiedLink ? "Copiado!" : "Compartilhar"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
