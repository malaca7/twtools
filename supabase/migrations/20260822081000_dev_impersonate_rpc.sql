-- RPC to allow dev mode lookup of profile by discord_id, discord_username, or game_id
CREATE OR REPLACE FUNCTION public.get_dev_profile_by_discord_id(p_discord_id text)
RETURNS TABLE (
  user_id uuid,
  nome text,
  nickname text,
  discord_id text,
  discord_username text,
  discord_avatar_url text,
  discord_email text,
  status text,
  nivel text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.nome,
    p.nickname,
    p.discord_id,
    p.discord_username,
    p.discord_avatar_url,
    p.discord_email,
    p.status,
    r.nivel::text
  FROM public.profiles p
  LEFT JOIN public.user_roles r ON r.user_id = p.user_id
  WHERE p.discord_id = p_discord_id
     OR p.discord_username ILIKE p_discord_id
     OR p.discord_username ILIKE (p_discord_id || '%')
     OR p.game_id = p_discord_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dev_profile_by_discord_id(text) TO anon, authenticated;
