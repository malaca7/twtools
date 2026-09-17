-- Migração: Perfil Público Personalizado, Feed com @Menções e #Hashtags, Sistema de Seguir
-- Data: 16/09/2026

-- 1. Campos adicionais na tabela profiles para personalização do perfil público
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- 2. Tabela de seguidores entre membros (member_follows)
CREATE TABLE IF NOT EXISTS public.member_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notify_posts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_member_follows UNIQUE (follower_id, following_id),
  CONSTRAINT chk_no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_member_follows_follower ON public.member_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_member_follows_following ON public.member_follows(following_id);

-- 3. Tabela de postagens no feed do perfil (profile_posts)
CREATE TABLE IF NOT EXISTS public.profile_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  mentions TEXT[] DEFAULT '{}'::text[],
  likes_count INTEGER NOT NULL DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_posts_author ON public.profile_posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_posts_created_at ON public.profile_posts(created_at DESC);

-- 4. Tabela de curtidas nas postagens do feed (profile_post_likes)
CREATE TABLE IF NOT EXISTS public.profile_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.profile_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_profile_post_likes UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_post_likes_post ON public.profile_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_profile_post_likes_user ON public.profile_post_likes(user_id);

-- 5. Habilitar Row Level Security (RLS)
ALTER TABLE public.member_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_post_likes ENABLE ROW LEVEL SECURITY;

-- Políticas para member_follows
DROP POLICY IF EXISTS "member_follows_select_all" ON public.member_follows;
CREATE POLICY "member_follows_select_all" ON public.member_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "member_follows_insert_own" ON public.member_follows;
CREATE POLICY "member_follows_insert_own" ON public.member_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "member_follows_update_own" ON public.member_follows;
CREATE POLICY "member_follows_update_own" ON public.member_follows FOR UPDATE USING (auth.uid() = follower_id) WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "member_follows_delete_own" ON public.member_follows;
CREATE POLICY "member_follows_delete_own" ON public.member_follows FOR DELETE USING (auth.uid() = follower_id);

-- Políticas para profile_posts
DROP POLICY IF EXISTS "profile_posts_select_all" ON public.profile_posts;
CREATE POLICY "profile_posts_select_all" ON public.profile_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "profile_posts_insert_own" ON public.profile_posts;
CREATE POLICY "profile_posts_insert_own" ON public.profile_posts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "profile_posts_update_own" ON public.profile_posts;
CREATE POLICY "profile_posts_update_own" ON public.profile_posts FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "profile_posts_delete_own" ON public.profile_posts;
CREATE POLICY "profile_posts_delete_own" ON public.profile_posts FOR DELETE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (is_developer = true OR is_ceo = true)
  )
);

-- Políticas para profile_post_likes
DROP POLICY IF EXISTS "profile_post_likes_select_all" ON public.profile_post_likes;
CREATE POLICY "profile_post_likes_select_all" ON public.profile_post_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "profile_post_likes_insert_own" ON public.profile_post_likes;
CREATE POLICY "profile_post_likes_insert_own" ON public.profile_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profile_post_likes_delete_own" ON public.profile_post_likes;
CREATE POLICY "profile_post_likes_delete_own" ON public.profile_post_likes FOR DELETE USING (auth.uid() = user_id);

-- Permissões de acesso
GRANT ALL ON public.member_follows TO authenticated, service_role;
GRANT SELECT ON public.member_follows TO anon;

GRANT ALL ON public.profile_posts TO authenticated, service_role;
GRANT SELECT ON public.profile_posts TO anon;

GRANT ALL ON public.profile_post_likes TO authenticated, service_role;
GRANT SELECT ON public.profile_post_likes TO anon;
