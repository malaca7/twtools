-- Function to safely handle user presence heartbeat, session time and total time tracking
CREATE OR REPLACE FUNCTION public.heartbeat_user_presence(
  _status text DEFAULT 'online',
  _increment_seconds integer DEFAULT 60
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _current_user_id uuid;
  _existing_status text;
  _existing_since timestamptz;
  _existing_last_seen timestamptz;
BEGIN
  _current_user_id := auth.uid();
  IF _current_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT status, online_since, last_seen
  INTO _existing_status, _existing_since, _existing_last_seen
  FROM public.user_presence
  WHERE user_id = _current_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_presence (
      user_id,
      status,
      last_seen,
      online_since,
      total_seconds_online,
      updated_at
    ) VALUES (
      _current_user_id,
      _status,
      now(),
      now(),
      LEAST(GREATEST(_increment_seconds, 0), 300),
      now()
    );
  ELSE
    -- If user was offline OR last heartbeat was more than 3 minutes ago, reset session start time (online_since)
    IF _existing_status = 'offline' OR _existing_last_seen IS NULL OR _existing_last_seen < (now() - interval '3 minutes') THEN
      _existing_since := now();
    ELSIF _existing_since IS NULL THEN
      _existing_since := now();
    END IF;

    UPDATE public.user_presence
    SET
      status = _status,
      last_seen = now(),
      online_since = _existing_since,
      total_seconds_online = COALESCE(total_seconds_online, 0) + LEAST(GREATEST(_increment_seconds, 0), 300),
      updated_at = now()
    WHERE user_id = _current_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.heartbeat_user_presence(text, integer) TO authenticated;
