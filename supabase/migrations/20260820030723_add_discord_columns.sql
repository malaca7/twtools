-- Add Discord integration columns to public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS discord_id text,
ADD COLUMN IF NOT EXISTS discord_username text,
ADD COLUMN IF NOT EXISTS discord_avatar_url text,
ADD COLUMN IF NOT EXISTS discord_email text;
