-- Add Discord role integration columns to member_tags table
ALTER TABLE member_tags 
ADD COLUMN IF NOT EXISTS discord_role_id TEXT,
ADD COLUMN IF NOT EXISTS discord_guild_id TEXT,
ADD COLUMN IF NOT EXISTS discord_role_name TEXT,
ADD COLUMN IF NOT EXISTS discord_sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS discord_role_position INTEGER;
