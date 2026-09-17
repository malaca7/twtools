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
export async function createProfilePost(content: string, mediaUrl?: string): Promise<ProfilePost> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Você precisa estar autenticado para publicar.");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("O conteúdo da publicação não pode estar vazio.");
  if (trimmed.length > 2000) throw new Error("A publicação não pode exceder 2000 caracteres.");

  const tags = extractHashtags(trimmed);
  const mentions = extractMentions(trimmed);

  const { data: newPost, error } = await (supabase.from("profile_posts" as any))
    .insert({
      author_id: session.user.id,
      content: trimmed,
      media_url: mediaUrl?.trim() || null,
      tags,
      mentions,
      likes_count: 0,
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
    tags: newPost.tags || [],
    mentions: newPost.mentions || [],
    likes_count: 0,
    pinned: false,
    created_at: newPost.created_at,
    updated_at: newPost.updated_at,
    is_liked_by_me: false,
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
