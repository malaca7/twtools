import { supabase } from "@/integrations/supabase/client";
import type { ProfilePost, ProfileFollowStats } from "@/types/profileFeed";

/**
 * Extrai hashtags (#tag) de um texto
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#([a-zA-Z0-9_\u00C0-\u00FF]+)/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((t) => t.slice(1).toLowerCase())));
}

/**
 * Extrai menções (@usuario) de um texto
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/@([a-zA-Z0-9_.-]+)/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase())));
}

/**
 * Carrega as postagens do perfil de um membro
 */
export async function getProfilePosts(authorId: string, currentUserId?: string): Promise<ProfilePost[]> {
  try {
    const { data: posts, error } = await supabase
      .from("profile_posts" as any)
      .select("*")
      .eq("author_id", authorId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Erro ao carregar posts do perfil:", error.message);
      return [];
    }

    if (!posts || posts.length === 0) return [];

    // Carrega dados do autor
    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("user_id, nome, nickname, avatar_url, discord_avatar_url, custom_theme, discord_username")
      .eq("user_id", authorId)
      .maybeSingle();

    const author = authorProfile
      ? {
          id: authorProfile.user_id,
          nome: authorProfile.nome,
          nickname: authorProfile.nickname,
          avatar_url: authorProfile.discord_avatar_url || authorProfile.avatar_url,
          custom_url: (authorProfile.custom_theme as any)?.custom_url || null,
          discord_username: authorProfile.discord_username,
        }
      : undefined;

    // Se houver usuário logado, verifica quais posts foram curtidos por ele
    let likedPostIds = new Set<string>();
    if (currentUserId) {
      const postIds = posts.map((p: any) => p.id);
      const { data: likes } = await supabase
        .from("profile_post_likes" as any)
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", postIds);

      if (likes) {
        likedPostIds = new Set(likes.map((l: any) => l.post_id));
      }
    }

    return posts.map((p: any) => ({
      id: p.id,
      author_id: p.author_id,
      content: p.content,
      media_url: p.media_url,
      tags: p.tags || [],
      mentions: p.mentions || [],
      likes_count: p.likes_count || 0,
      pinned: Boolean(p.pinned),
      created_at: p.created_at,
      updated_at: p.updated_at,
      author,
      is_liked_by_me: likedPostIds.has(p.id),
    }));
  } catch (err) {
    console.error("Erro inesperado em getProfilePosts:", err);
    return [];
  }
}

/**
 * Cria uma nova publicação no feed do perfil
 */
export async function createProfilePost(
  content: string,
  mediaUrl?: string | null,
  videoUrl?: string | null,
  mediaType?: "image" | "video" | "none"
): Promise<ProfilePost> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Você precisa estar autenticado para publicar.");

  const trimmed = content.trim();
  if (!trimmed && !mediaUrl && !videoUrl) throw new Error("A publicação precisa conter texto ou mídia.");
  if (trimmed.length > 2000) throw new Error("A publicação não pode exceder 2000 caracteres.");

  const tags = extractHashtags(trimmed);
  const mentions = extractMentions(trimmed);

  const determinedMediaType = mediaType || (videoUrl ? "video" : mediaUrl ? "image" : "none");

  const { data: newPost, error } = await (supabase.from("profile_posts" as any))
    .insert({
      author_id: session.user.id,
      content: trimmed,
      media_url: mediaUrl?.trim() || null,
      video_url: videoUrl?.trim() || null,
      media_type: determinedMediaType,
      tags,
      mentions,
      likes_count: 0,
      comments_count: 0,
      pinned: false,
    })
    .select()
    .single();

  if (error) throw error;

  // Disparo assíncrono de notificações para menções e seguidores
  void notifyMentionsAndFollowers(session.user.id, newPost.id, trimmed, mentions);

  return {
    id: newPost.id,
    author_id: newPost.author_id,
    content: newPost.content,
    media_url: newPost.media_url,
    video_url: newPost.video_url,
    media_type: newPost.media_type,
    tags: newPost.tags || [],
    mentions: newPost.mentions || [],
    likes_count: 0,
    comments_count: 0,
    pinned: false,
    created_at: newPost.created_at,
    updated_at: newPost.updated_at,
    is_liked_by_me: false,
    is_bookmarked_by_me: false,
  };
}

/**
 * Notifica os membros mencionados (@) e seguidores com notificações ativas
 */
async function notifyMentionsAndFollowers(
  authorId: string,
  postId: string,
  content: string,
  mentions: string[]
) {
  try {
    // Obter dados do autor
    const { data: author } = await supabase
      .from("profiles")
      .select("nome, nickname, discord_username, custom_theme")
      .eq("user_id", authorId)
      .maybeSingle();

    const authorName = author?.nickname || author?.nome || "Um membro";
    const authorSlug = (author?.custom_theme as any)?.custom_url || author?.discord_username || authorId;

    // 1. Notificar seguidores com notify_posts = true
    const { data: followers } = await supabase
      .from("member_follows" as any)
      .select("follower_id")
      .eq("following_id", authorId)
      .eq("notify_posts", true);

    const followerIds = new Set((followers || []).map((f: any) => f.follower_id));

    // 2. Localizar IDs dos membros mencionados
    const mentionedUserIds = new Set<string>();
    if (mentions.length > 0) {
      const { data: matchedProfiles } = await supabase
        .from("profiles")
        .select("user_id, discord_username, custom_theme");

      if (matchedProfiles) {
        for (const p of matchedProfiles) {
          if (p.user_id === authorId) continue;
          const dUser = (p.discord_username || "").toLowerCase().replace(/#0$/, "");
          const cUrl = ((p.custom_theme as any)?.custom_url || "").toLowerCase();
          for (const m of mentions) {
            if (m === dUser || m === cUrl) {
              mentionedUserIds.add(p.user_id);
            }
          }
        }
      }
    }

    // Inserir notificações de menção
    for (const mentionedId of mentionedUserIds) {
      // Remove de seguidores para não mandar notificação duplicada
      followerIds.delete(mentionedId);
      await supabase.from("audit_logs" as any).insert({
        action: "profile_mention",
        table_name: "profile_posts",
        user_id: mentionedId,
        details: {
          title: "Mencionado no Perfil!",
          message: `${authorName} mencionou você em uma publicação no perfil.`,
          link: `/perfil/${authorSlug}`,
          post_id: postId,
          type: "mention",
        },
      });
    }

    // Inserir notificações para seguidores restantes
    for (const followerId of followerIds) {
      if (followerId === authorId) continue;
      await supabase.from("audit_logs" as any).insert({
        action: "profile_post",
        table_name: "profile_posts",
        user_id: followerId,
        details: {
          title: `Nova postagem de ${authorName}`,
          message: content.length > 90 ? `${content.slice(0, 87)}...` : content,
          link: `/perfil/${authorSlug}`,
          post_id: postId,
          type: "feed",
        },
      });
    }
  } catch (err) {
    console.warn("Falha silenciosa ao processar notificações de post:", err);
  }
}

/**
 * Exclui uma publicação do feed
 */
export async function deleteProfilePost(postId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Não autenticado");

  const { error } = await supabase
    .from("profile_posts" as any)
    .delete()
    .eq("id", postId);

  if (error) throw error;
}

/**
 * Curte ou remove curtida de uma publicação
 */
export async function togglePostLike(postId: string): Promise<{ isLiked: boolean; newCount: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Você precisa estar autenticado para curtir.");

  const userId = session.user.id;

  // Verifica se já curtiu
  const { data: existingLike } = await supabase
    .from("profile_post_likes" as any)
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingLike) {
    // Remover curtida
    await supabase.from("profile_post_likes" as any).delete().eq("id", existingLike.id);
    // Decrementar contagem
    const { data: post } = await supabase
      .from("profile_posts" as any)
      .select("likes_count")
      .eq("id", postId)
      .single();

    const newCount = Math.max(0, ((post as any)?.likes_count || 1) - 1);
    await supabase.from("profile_posts" as any).update({ likes_count: newCount }).eq("id", postId);

    return { isLiked: false, newCount };
  } else {
    // Adicionar curtida
    await supabase.from("profile_post_likes" as any).insert({ post_id: postId, user_id: userId });
    // Incrementar contagem
    const { data: post } = await supabase
      .from("profile_posts" as any)
      .select("likes_count")
      .eq("id", postId)
      .single();

    const newCount = ((post as any)?.likes_count || 0) + 1;
    await supabase.from("profile_posts" as any).update({ likes_count: newCount }).eq("id", postId);

    return { isLiked: true, newCount };
  }
}

/**
 * Obtém as estatísticas de seguidores de um membro
 */
export async function getProfileFollowStats(
  targetUserId: string,
  currentUserId?: string
): Promise<ProfileFollowStats> {
  try {
    // Contagem de seguidores
    const { count: followersCount } = await supabase
      .from("member_follows" as any)
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetUserId);

    // Contagem de seguindo
    const { count: followingCount } = await supabase
      .from("member_follows" as any)
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetUserId);

    let isFollowing = false;
    let notifyPosts = true;

    if (currentUserId && currentUserId !== targetUserId) {
      const { data: followRecord } = await supabase
        .from("member_follows" as any)
        .select("id, notify_posts")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (followRecord) {
        isFollowing = true;
        notifyPosts = Boolean((followRecord as any).notify_posts);
      }
    }

    return {
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      is_following: isFollowing,
      notify_posts: notifyPosts,
    };
  } catch (err) {
    console.error("Erro ao obter follow stats:", err);
    return {
      followers_count: 0,
      following_count: 0,
      is_following: false,
      notify_posts: true,
    };
  }
}

/**
 * Segue ou deixa de seguir um membro
 */
export async function toggleFollowMember(targetUserId: string): Promise<{ isFollowing: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Você precisa estar autenticado para seguir membros.");

  const currentUserId = session.user.id;
  if (currentUserId === targetUserId) throw new Error("Você não pode seguir seu próprio perfil.");

  const { data: existing } = await supabase
    .from("member_follows" as any)
    .select("id")
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase.from("member_follows" as any).delete().eq("id", existing.id);
    return { isFollowing: false };
  } else {
    await supabase.from("member_follows" as any).insert({
      follower_id: currentUserId,
      following_id: targetUserId,
      notify_posts: true,
    });
    return { isFollowing: true };
  }
}

/**
 * Alterna preferência de notificações de postagens para um membro seguido
 */
export async function toggleFollowNotification(
  targetUserId: string,
  notify: boolean
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Não autenticado");

  const { error } = await supabase
    .from("member_follows" as any)
    .update({ notify_posts: notify })
    .eq("follower_id", session.user.id)
    .eq("following_id", targetUserId);

  if (error) throw error;
}

/* =========================================================================
   SISTEMA "LIFE" — FEED DE REDE SOCIAL CENTRAL DA TWIN WHEELS
   ========================================================================= */

export type LifeFeedTab = "all" | "following" | "saved" | "mine";

export interface GetLifeFeedParams {
  tab?: LifeFeedTab;
  currentUserId?: string;
  tagFilter?: string | null;
  limit?: number;
}

/**
 * Carrega as postagens do Feed Life conforme a aba e filtros
 */
export async function getLifeFeed({
  tab = "all",
  currentUserId,
  tagFilter,
  limit = 60,
}: GetLifeFeedParams): Promise<ProfilePost[]> {
  try {
    let query = supabase
      .from("profile_posts" as any)
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tab === "following") {
      if (!currentUserId) return [];
      const { data: follows, error: followErr } = await supabase
        .from("member_follows" as any)
        .select("following_id")
        .eq("follower_id", currentUserId);

      if (followErr || !follows || follows.length === 0) return [];
      const followingIds = follows.map((f: any) => f.following_id);
      query = query.in("author_id", followingIds);
    } else if (tab === "saved") {
      if (!currentUserId) return [];
      const { data: bookmarks, error: markErr } = await supabase
        .from("profile_post_bookmarks" as any)
        .select("post_id")
        .eq("user_id", currentUserId);

      if (markErr || !bookmarks || bookmarks.length === 0) return [];
      const bookmarkedIds = bookmarks.map((b: any) => b.post_id);
      query = query.in("id", bookmarkedIds);
    } else if (tab === "mine") {
      if (!currentUserId) return [];
      query = query.eq("author_id", currentUserId);
    }

    const { data: rawPosts, error } = await query;
    if (error) {
      console.warn("Erro ao buscar feed do Life:", error.message);
      return [];
    }

    if (!rawPosts || rawPosts.length === 0) return [];

    // Filtro client-side de hashtag se aplicável
    let posts = rawPosts;
    if (tagFilter) {
      const cleanTag = tagFilter.replace(/^#/, "").toLowerCase();
      posts = posts.filter((p: any) =>
        Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase() === cleanTag)
      );
    }

    if (posts.length === 0) return [];

    // 1. Carregar perfis dos autores
    const authorIds = Array.from(new Set(posts.map((p: any) => p.author_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, nome, nickname, avatar_url, discord_avatar_url, custom_theme, discord_username, is_developer, is_ceo")
      .in("user_id", authorIds);

    // Carregar roles dos autores
    const { data: userRoles } = await supabase
      .from("user_roles" as any)
      .select("user_id, role")
      .in("user_id", authorIds);

    const rolesMap = new Map<string, string>();
    (userRoles || []).forEach((r: any) => {
      if (r.user_id && r.role && !rolesMap.has(r.user_id)) {
        rolesMap.set(r.user_id, r.role);
      }
    });

    const profileMap = new Map<string, any>();
    (profiles || []).forEach((pr: any) => {
      profileMap.set(pr.user_id, {
        id: pr.user_id,
        nome: pr.nome,
        nickname: pr.nickname,
        avatar_url: pr.discord_avatar_url || pr.avatar_url,
        custom_url: (pr.custom_theme as any)?.custom_url || null,
        discord_username: pr.discord_username,
        level: rolesMap.get(pr.user_id) || (pr.is_developer ? "desenvolvedor" : pr.is_ceo ? "01" : "membro"),
      });
    });

    // 2. Carregar interações do usuário atual
    let likedPostIds = new Set<string>();
    let bookmarkedPostIds = new Set<string>();
    let followingAuthorIds = new Set<string>();

    if (currentUserId) {
      const postIds = posts.map((p: any) => p.id);

      const [likesRes, bookmarksRes, followsRes] = await Promise.all([
        supabase
          .from("profile_post_likes" as any)
          .select("post_id")
          .eq("user_id", currentUserId)
          .in("post_id", postIds),
        supabase
          .from("profile_post_bookmarks" as any)
          .select("post_id")
          .eq("user_id", currentUserId)
          .in("post_id", postIds),
        supabase
          .from("member_follows" as any)
          .select("following_id")
          .eq("follower_id", currentUserId)
          .in("following_id", authorIds),
      ]);

      if (likesRes.data) {
        likedPostIds = new Set(likesRes.data.map((l: any) => l.post_id));
      }
      if (bookmarksRes.data) {
        bookmarkedPostIds = new Set(bookmarksRes.data.map((b: any) => b.post_id));
      }
      if (followsRes.data) {
        followingAuthorIds = new Set(followsRes.data.map((f: any) => f.following_id));
      }
    }

    return posts.map((p: any) => ({
      id: p.id,
      author_id: p.author_id,
      content: p.content,
      media_url: p.media_url,
      video_url: p.video_url,
      media_type: p.media_type || (p.video_url ? "video" : p.media_url ? "image" : "none"),
      tags: p.tags || [],
      mentions: p.mentions || [],
      likes_count: p.likes_count || 0,
      comments_count: p.comments_count || 0,
      pinned: Boolean(p.pinned),
      created_at: p.created_at,
      updated_at: p.updated_at,
      author: profileMap.get(p.author_id) || {
        id: p.author_id,
        nome: "Membro",
        avatar_url: null,
      },
      is_liked_by_me: likedPostIds.has(p.id),
      is_bookmarked_by_me: bookmarkedPostIds.has(p.id),
      is_following_author: followingAuthorIds.has(p.author_id),
    }));
  } catch (err) {
    console.error("Erro inesperado em getLifeFeed:", err);
    return [];
  }
}

/**
 * Salva ou remove uma publicação dos favoritos / bookmarks
 */
export async function togglePostBookmark(postId: string): Promise<{ isBookmarked: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Você precisa estar autenticado para salvar publicações.");

  const userId = session.user.id;

  const { data: existing } = await supabase
    .from("profile_post_bookmarks" as any)
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("profile_post_bookmarks" as any).delete().eq("id", existing.id);
    return { isBookmarked: false };
  } else {
    await supabase.from("profile_post_bookmarks" as any).insert({
      post_id: postId,
      user_id: userId,
    });
    return { isBookmarked: true };
  }
}

/**
 * Carrega os comentários de uma publicação
 */
export async function getPostComments(postId: string, currentUserId?: string): Promise<ProfilePostComment[]> {
  try {
    const { data: comments, error } = await supabase
      .from("profile_post_comments" as any)
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error || !comments || comments.length === 0) return [];

    const authorIds = Array.from(new Set(comments.map((c: any) => c.author_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, nome, nickname, avatar_url, discord_avatar_url, custom_theme, discord_username")
      .in("user_id", authorIds);

    const profileMap = new Map<string, any>();
    (profiles || []).forEach((pr: any) => {
      profileMap.set(pr.user_id, {
        id: pr.user_id,
        nome: pr.nome,
        nickname: pr.nickname,
        avatar_url: pr.discord_avatar_url || pr.avatar_url,
        custom_url: (pr.custom_theme as any)?.custom_url || null,
        discord_username: pr.discord_username,
      });
    });

    return comments.map((c: any) => ({
      id: c.id,
      post_id: c.post_id,
      author_id: c.author_id,
      content: c.content,
      created_at: c.created_at,
      updated_at: c.updated_at,
      author: profileMap.get(c.author_id) || {
        id: c.author_id,
        nome: "Membro",
        avatar_url: null,
      },
      is_own: currentUserId ? c.author_id === currentUserId : false,
    }));
  } catch (err) {
    console.error("Erro ao buscar comentários:", err);
    return [];
  }
}

/**
 * Cria um comentário em uma publicação
 */
export async function createPostComment(postId: string, content: string): Promise<ProfilePostComment> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Você precisa estar autenticado para comentar.");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("O comentário não pode estar vazio.");
  if (trimmed.length > 800) throw new Error("O comentário não pode exceder 800 caracteres.");

  const userId = session.user.id;

  const { data: newComment, error } = await (supabase.from("profile_post_comments" as any))
    .insert({
      post_id: postId,
      author_id: userId,
      content: trimmed,
    })
    .select()
    .single();

  if (error) throw error;

  // Incrementar contagem de comentários no post
  const { data: post } = await supabase
    .from("profile_posts" as any)
    .select("comments_count, author_id")
    .eq("id", postId)
    .single();

  const newCount = ((post as any)?.comments_count || 0) + 1;
  await supabase.from("profile_posts" as any).update({ comments_count: newCount }).eq("id", postId);

  // Notificar autor do post se não for o mesmo
  if (post && (post as any).author_id !== userId) {
    try {
      const { data: commenter } = await supabase
        .from("profiles")
        .select("nome, nickname")
        .eq("user_id", userId)
        .maybeSingle();

      const name = commenter?.nickname || commenter?.nome || "Um membro";
      await supabase.from("audit_logs" as any).insert({
        action: "post_comment",
        table_name: "profile_posts",
        user_id: (post as any).author_id,
        details: {
          title: "Novo comentário no seu post!",
          message: `${name} comentou: "${trimmed.length > 60 ? trimmed.slice(0, 57) + '...' : trimmed}"`,
          link: `/life`,
          post_id: postId,
          type: "comment",
        },
      });
    } catch {}
  }

  // Carregar dados do autor para retorno imediato
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("user_id, nome, nickname, avatar_url, discord_avatar_url, custom_theme, discord_username")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    id: newComment.id,
    post_id: newComment.post_id,
    author_id: newComment.author_id,
    content: newComment.content,
    created_at: newComment.created_at,
    updated_at: newComment.updated_at,
    author: myProfile
      ? {
          id: myProfile.user_id,
          nome: myProfile.nome,
          nickname: myProfile.nickname,
          avatar_url: myProfile.discord_avatar_url || myProfile.avatar_url,
          custom_url: (myProfile.custom_theme as any)?.custom_url || null,
          discord_username: myProfile.discord_username,
        }
      : undefined,
    is_own: true,
  };
}

/**
 * Exclui um comentário de uma publicação
 */
export async function deletePostComment(commentId: string, postId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Não autenticado.");

  const { error } = await supabase
    .from("profile_post_comments" as any)
    .delete()
    .eq("id", commentId);

  if (error) throw error;

  // Decrementar contagem de comentários no post
  const { data: post } = await supabase
    .from("profile_posts" as any)
    .select("comments_count")
    .eq("id", postId)
    .single();

  const newCount = Math.max(0, ((post as any)?.comments_count || 1) - 1);
  await supabase.from("profile_posts" as any).update({ comments_count: newCount }).eq("id", postId);
}

/**
 * Alterna estado de fixação do post (para Liderança / CEO / Dev)
 */
export async function togglePinPost(postId: string, pinned: boolean): Promise<void> {
  const { error } = await supabase
    .from("profile_posts" as any)
    .update({ pinned })
    .eq("id", postId);

  if (error) throw error;
}

/**
 * Membros sugeridos para seguir no Life
 */
export async function getSuggestedMembersToFollow(
  currentUserId?: string,
  limit: number = 5
): Promise<Array<{
  id: string;
  nome: string;
  nickname?: string | null;
  avatar_url?: string | null;
  custom_url?: string | null;
  discord_username?: string | null;
  role_name?: string | null;
}>> {
  try {
    let excludedIds = currentUserId ? [currentUserId] : [];

    if (currentUserId) {
      const { data: alreadyFollowing } = await supabase
        .from("member_follows" as any)
        .select("following_id")
        .eq("follower_id", currentUserId);

      if (alreadyFollowing && alreadyFollowing.length > 0) {
        excludedIds = [...excludedIds, ...alreadyFollowing.map((f: any) => f.following_id)];
      }
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, nome, nickname, avatar_url, discord_avatar_url, custom_theme, discord_username")
      .not("user_id", "in", `(${excludedIds.join(",")})`)
      .limit(limit);

    if (!profiles) return [];

    return profiles.map((p: any) => ({
      id: p.user_id,
      nome: p.nome,
      nickname: p.nickname,
      avatar_url: p.discord_avatar_url || p.avatar_url,
      custom_url: (p.custom_theme as any)?.custom_url || null,
      discord_username: p.discord_username,
    }));
  } catch (err) {
    console.error("Erro ao obter membros sugeridos:", err);
    return [];
  }
}

/**
 * Coleta as hashtags em alta dos últimos posts
 */
export async function getTrendingHashtags(limit: number = 8): Promise<Array<{ tag: string; count: number }>> {
  try {
    const { data: posts } = await supabase
      .from("profile_posts" as any)
      .select("tags")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!posts || posts.length === 0) {
      return [
        { tag: "TwinWheels", count: 12 },
        { tag: "Roleplay", count: 9 },
        { tag: "Rolê", count: 7 },
        { tag: "Ação", count: 6 },
        { tag: "Oficina", count: 5 },
      ];
    }

    const countMap = new Map<string, number>();
    for (const p of posts) {
      if (Array.isArray((p as any).tags)) {
        for (const t of (p as any).tags) {
          const lower = t.trim().toLowerCase();
          if (lower) {
            countMap.set(lower, (countMap.get(lower) || 0) + 1);
          }
        }
      }
    }

    const sorted = Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    if (sorted.length === 0) {
      return [
        { tag: "TwinWheels", count: 1 },
        { tag: "Roleplay", count: 1 },
      ];
    }

    return sorted;
  } catch {
    return [];
  }
}

