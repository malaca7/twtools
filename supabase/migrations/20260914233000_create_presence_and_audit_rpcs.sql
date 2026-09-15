-- Migration: Create presence heartbeat and audit RPCs, and clean stale presence records

-- 1. Heartbeat user presence RPC
CREATE OR REPLACE FUNCTION public.heartbeat_user_presence(
  _status text DEFAULT 'online',
  _increment_seconds integer DEFAULT 15,
  _user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _current_user_id uuid;
  _existing_status text;
  _existing_since timestamptz;
  _existing_last_seen timestamptz;
BEGIN
  _current_user_id := COALESCE(auth.uid(), _user_id);
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
    -- If user was offline OR last heartbeat was more than 2 minutes ago, restart session start time (online_since)
    IF _existing_status = 'offline' OR _existing_last_seen IS NULL OR _existing_last_seen < (now() - interval '2 minutes') THEN
      _existing_since := CASE WHEN _status = 'offline' THEN NULL ELSE now() END;
    ELSIF _status = 'offline' THEN
      _existing_since := NULL;
    ELSIF _existing_since IS NULL THEN
      _existing_since := now();
    END IF;

    UPDATE public.user_presence
    SET
      status = _status,
      last_seen = now(),
      online_since = _existing_since,
      total_seconds_online = COALESCE(total_seconds_online, 0) + (CASE WHEN _status = 'online' THEN LEAST(GREATEST(_increment_seconds, 0), 300) ELSE 0 END),
      updated_at = now()
    WHERE user_id = _current_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.heartbeat_user_presence(text, integer, uuid) TO authenticated, anon;

-- 2. Audit log insert RPC
CREATE OR REPLACE FUNCTION public.log_audit_action_rpc(
  _action text,
  _entity text,
  _new_data jsonb DEFAULT NULL,
  _old_data jsonb DEFAULT NULL,
  _entity_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid uuid;
  _log_id uuid;
  _fallback_uid text;
BEGIN
  _uid := auth.uid();

  IF _uid IS NULL THEN
    _fallback_uid := COALESCE(_new_data->>'user_id', _old_data->>'user_id', _new_data->>'target_id');
    IF _fallback_uid IS NOT NULL AND _fallback_uid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      _uid := _fallback_uid::uuid;
    END IF;
  END IF;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    old_data,
    new_data,
    created_at
  ) VALUES (
    _uid,
    _action,
    _entity,
    _entity_id,
    _old_data,
    _new_data,
    now()
  )
  RETURNING id INTO _log_id;

  RETURN _log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit_action_rpc(text, text, jsonb, jsonb, text) TO authenticated, anon;

-- 3. Save role permissions RPC
CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_level_idx ON public.role_permissions (level);

CREATE OR REPLACE FUNCTION public.save_role_permissions(
  _level text,
  _permissions jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.role_permissions (level, nivel, permissions, updated_at)
  VALUES (_level, _level, _permissions, now())
  ON CONFLICT (nivel)
  DO UPDATE SET
    level = EXCLUDED.level,
    permissions = EXCLUDED.permissions,
    updated_at = now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_role_permissions(text, jsonb) TO authenticated, anon;

-- 4. Clean up stale online presences in database
UPDATE public.user_presence
SET status = 'offline'
WHERE last_seen < now() - interval '3 minutes' AND status != 'offline';
