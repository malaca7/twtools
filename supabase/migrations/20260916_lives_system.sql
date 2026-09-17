-- Migration: 20260916_lives_system.sql
-- Description: Sistema de Lives, Vinculação de Contas, Histórico de Sessões, Preferências e Configurações

CREATE TABLE IF NOT EXISTS public.member_stream_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_url TEXT NOT NULL,
  channel_id TEXT,
  display_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  oauth_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT member_stream_accounts_unique_user_platform_channel UNIQUE (user_id, platform, channel_name)
);

CREATE INDEX IF NOT EXISTS idx_member_stream_accounts_user_id ON public.member_stream_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_member_stream_accounts_platform_channel ON public.member_stream_accounts(platform, channel_name);
CREATE INDEX IF NOT EXISTS idx_member_stream_accounts_active ON public.member_stream_accounts(is_active);

CREATE TABLE IF NOT EXISTS public.stream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_account_id UUID REFERENCES public.member_stream_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  streamer_name TEXT NOT NULL,
  streamer_avatar TEXT,
  title TEXT,
  category TEXT,
  thumbnail_url TEXT,
  stream_url TEXT NOT NULL,
  external_stream_id TEXT,
  is_live BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewer_count INTEGER NOT NULL DEFAULT 0,
  peak_viewers INTEGER NOT NULL DEFAULT 0,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stream_sessions_live_started ON public.stream_sessions(is_live, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_account_live ON public.stream_sessions(stream_account_id, is_live);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_platform_channel ON public.stream_sessions(platform, channel_name);
CREATE INDEX IF NOT EXISTS idx_stream_sessions_user_id ON public.stream_sessions(user_id);

CREATE TABLE IF NOT EXISTS public.member_stream_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  notify_platforms JSONB NOT NULL DEFAULT '["twitch", "kick", "youtube", "tiktok"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stream_system_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  platforms JSONB NOT NULL DEFAULT '{
    "twitch": { "enabled": true, "clientId": "", "clientSecret": "", "pollingIntervalSeconds": 60 },
    "kick": { "enabled": true, "pollingIntervalSeconds": 60 },
    "youtube": { "enabled": true, "apiKey": "", "pollingIntervalSeconds": 120 },
    "tiktok": { "enabled": true, "pollingIntervalSeconds": 120 }
  }'::jsonb,
  global_polling_interval_seconds INTEGER NOT NULL DEFAULT 60,
  discord_announcements_channel_id TEXT DEFAULT '',
  discord_announcements_enabled BOOLEAN NOT NULL DEFAULT true,
  notify_in_app BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

INSERT INTO public.stream_system_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.stream_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  streamer_name TEXT,
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stream_integration_logs_created ON public.stream_integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_integration_logs_platform ON public.stream_integration_logs(platform);

ALTER TABLE public.member_stream_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_stream_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_integration_logs ENABLE ROW LEVEL SECURITY;
