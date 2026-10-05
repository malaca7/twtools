-- ==============================================================================
-- MIGRATION: Sistema Completo de Selo de Verificado (Verification Badge System)
-- ==============================================================================

-- 1. Garante coluna is_verified na tabela profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles(is_verified);

-- 2. Tabela de Configuração Geral do Selo de Verificado (Singleton)
CREATE TABLE IF NOT EXISTS public.verification_badge_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  badge_name TEXT NOT NULL DEFAULT 'Verificado',
  badge_description TEXT NOT NULL DEFAULT 'Selo oficial de membro verificado e autenticado pela liderança.',
  badge_icon TEXT NOT NULL DEFAULT 'BadgeCheck',
  badge_color TEXT NOT NULL DEFAULT '#38bdf8',
  glow_style TEXT NOT NULL DEFAULT 'cyan',
  tooltip_text TEXT NOT NULL DEFAULT 'Membro Oficial Verificado',
  requirements_config JSONB NOT NULL DEFAULT '{
    "require_discord": true,
    "require_game_id": true,
    "require_phone": false,
    "min_days_in_faction": 0,
    "min_gamification_level": 0,
    "allowed_roles": [],
    "allowed_tags": [],
    "custom_instructions": "Preencha a justificativa detalhada para análise da liderança."
  }'::jsonb,
  authorized_roles TEXT[] NOT NULL DEFAULT ARRAY['ceo', 'desenvolvedor', '01', '02', 'gerente']::text[],
  authorized_tags TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
  allow_self_request BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insere configuração padrão se não existir
INSERT INTO public.verification_badge_config (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

-- 3. Tabela de Solicitações de Verificação (Requests)
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado', 'revogado')),
  reason TEXT NOT NULL,
  document_url TEXT,
  extra_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_created ON public.verification_requests(created_at DESC);

-- 4. Tabela de Membros Verificados Ativos (Member Verifications)
CREATE TABLE IF NOT EXISTS public.member_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.verification_requests(id) ON DELETE SET NULL,
  custom_title TEXT DEFAULT 'Verificado Oficial',
  badge_color_override TEXT,
  badge_icon_override TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_verifications_user ON public.member_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_member_verifications_active ON public.member_verifications(is_verified);

-- 5. Tabela de Auditoria e Histórico (Audit Logs)
CREATE TABLE IF NOT EXISTS public.verification_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN (
    'solicitacao_criada',
    'solicitacao_aprovada',
    'solicitacao_rejeitada',
    'solicitacao_cancelada',
    'selo_concedido_direto',
    'selo_removido',
    'config_atualizada'
  )),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_audit_target ON public.verification_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_verification_audit_created ON public.verification_audit_logs(created_at DESC);

-- 6. Trigger para sincronizar profiles.is_verified automaticamente
CREATE OR REPLACE FUNCTION public.sync_profile_is_verified_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET is_verified = NEW.is_verified,
        updated_at = now()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET is_verified = false,
        updated_at = now()
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_is_verified ON public.member_verifications;
CREATE TRIGGER trg_sync_profile_is_verified
AFTER INSERT OR UPDATE OR DELETE ON public.member_verifications
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_is_verified_trigger();

-- 7. Função auxiliar de segurança para checar se o usuário tem permissão de gerenciar/aprovar verificações
CREATE OR REPLACE FUNCTION public.check_user_verification_permission(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_dev BOOLEAN := false;
  v_is_ceo BOOLEAN := false;
  v_user_role TEXT := '';
  v_config RECORD;
  v_has_tag BOOLEAN := false;
BEGIN
  -- 1. Verifica se é Dev ou CEO
  SELECT is_developer, is_ceo INTO v_is_dev, v_is_ceo FROM public.profiles WHERE user_id = p_user_id;
  IF v_is_dev = true OR v_is_ceo = true THEN
    RETURN true;
  END IF;

  -- 2. Carrega nível/cargo do usuário
  SELECT nivel INTO v_user_role FROM public.user_roles WHERE user_id = p_user_id;
  IF v_user_role IS NULL THEN
    v_user_role := 'membro';
  END IF;

  -- 3. Carrega configurações de autorização
  SELECT * INTO v_config FROM public.verification_badge_config WHERE id = 'default';

  IF v_config.authorized_roles IS NOT NULL AND v_user_role = ANY(v_config.authorized_roles) THEN
    RETURN true;
  END IF;

  -- 4. Verifica se possui alguma tag autorizada
  IF v_config.authorized_tags IS NOT NULL AND array_length(v_config.authorized_tags, 1) > 0 THEN
    SELECT EXISTS (
      SELECT 1 FROM public.member_tag_assignments
      WHERE member_id = p_user_id::text
        AND tag_id = ANY(v_config.authorized_tags)
    ) INTO v_has_tag;

    IF v_has_tag THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 8. RPC: Submeter Solicitação de Verificação
CREATE OR REPLACE FUNCTION public.submit_verification_request_rpc(
  p_reason TEXT,
  p_document_url TEXT DEFAULT NULL,
  p_extra_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_auth_uid UUID;
  v_existing_pending UUID;
  v_is_already_verified BOOLEAN;
  v_new_id UUID;
  v_profile RECORD;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado.';
  END IF;

  -- Verifica se o membro já é verificado
  SELECT is_verified INTO v_is_already_verified FROM public.profiles WHERE user_id = v_auth_uid;
  IF v_is_already_verified = true THEN
    RAISE EXCEPTION 'Seu perfil já possui o Selo de Verificado oficial!';
  END IF;

  -- Verifica se já existe solicitação pendente
  SELECT id INTO v_existing_pending FROM public.verification_requests 
  WHERE user_id = v_auth_uid AND status = 'pendente' LIMIT 1;
  
  IF v_existing_pending IS NOT NULL THEN
    RAISE EXCEPTION 'Você já possui uma solicitação de verificação pendente em análise.';
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'Por favor, informe a justificativa da solicitação.';
  END IF;

  INSERT INTO public.verification_requests (
    user_id,
    status,
    reason,
    document_url,
    extra_data,
    created_at,
    updated_at
  ) VALUES (
    v_auth_uid,
    'pendente',
    trim(p_reason),
    p_document_url,
    COALESCE(p_extra_data, '{}'::jsonb),
    now(),
    now()
  ) RETURNING id INTO v_new_id;

  -- Registra auditoria
  INSERT INTO public.verification_audit_logs (
    action,
    target_user_id,
    performed_by,
    details
  ) VALUES (
    'solicitacao_criada',
    v_auth_uid,
    v_auth_uid,
    jsonb_build_object('request_id', v_new_id, 'reason', trim(p_reason))
  );

  RETURN jsonb_build_object('success', true, 'request_id', v_new_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: Cancelar Solicitação Própria
CREATE OR REPLACE FUNCTION public.cancel_verification_request_rpc(p_request_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_auth_uid UUID;
  v_req RECORD;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado.';
  END IF;

  SELECT * INTO v_req FROM public.verification_requests WHERE id = p_request_id;
  IF v_req IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada.';
  END IF;

  IF v_req.user_id != v_auth_uid AND NOT public.check_user_verification_permission(v_auth_uid) THEN
    RAISE EXCEPTION 'Você não tem permissão para cancelar esta solicitação.';
  END IF;

  IF v_req.status != 'pendente' THEN
    RAISE EXCEPTION 'Apenas solicitações pendentes podem ser canceladas.';
  END IF;

  UPDATE public.verification_requests
  SET status = 'cancelado',
      updated_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.verification_audit_logs (
    action,
    target_user_id,
    performed_by,
    details
  ) VALUES (
    'solicitacao_cancelada',
    v_req.user_id,
    v_auth_uid,
    jsonb_build_object('request_id', p_request_id)
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RPC: Analisar e Aprovar/Rejeitar Solicitação
CREATE OR REPLACE FUNCTION public.review_verification_request_rpc(
  p_request_id UUID,
  p_approve BOOLEAN,
  p_notes TEXT DEFAULT NULL,
  p_custom_title TEXT DEFAULT 'Verificado Oficial',
  p_badge_color TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_auth_uid UUID;
  v_req RECORD;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado.';
  END IF;

  IF NOT public.check_user_verification_permission(v_auth_uid) THEN
    RAISE EXCEPTION 'Você não possui permissão para aprovar ou rejeitar verificações.';
  END IF;

  SELECT * INTO v_req FROM public.verification_requests WHERE id = p_request_id;
  IF v_req IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada.';
  END IF;

  IF p_approve THEN
    -- Atualiza status da solicitação
    UPDATE public.verification_requests
    SET status = 'aprovado',
        reviewed_by = v_auth_uid,
        reviewed_at = now(),
        review_notes = p_notes,
        updated_at = now()
    WHERE id = p_request_id;

    -- Concede ou atualiza selo de verificado
    INSERT INTO public.member_verifications (
      user_id,
      is_verified,
      verified_at,
      verified_by,
      request_id,
      custom_title,
      badge_color_override,
      notes,
      updated_at
    ) VALUES (
      v_req.user_id,
      true,
      now(),
      v_auth_uid,
      p_request_id,
      COALESCE(p_custom_title, 'Verificado Oficial'),
      p_badge_color,
      p_notes,
      now()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET is_verified = true,
        verified_at = now(),
        verified_by = v_auth_uid,
        request_id = p_request_id,
        custom_title = COALESCE(p_custom_title, member_verifications.custom_title),
        badge_color_override = COALESCE(p_badge_color, member_verifications.badge_color_override),
        notes = p_notes,
        updated_at = now();

    -- Atualiza profile
    UPDATE public.profiles
    SET is_verified = true,
        updated_at = now()
    WHERE user_id = v_req.user_id;

    -- Auditoria
    INSERT INTO public.verification_audit_logs (
      action,
      target_user_id,
      performed_by,
      details
    ) VALUES (
      'solicitacao_aprovada',
      v_req.user_id,
      v_auth_uid,
      jsonb_build_object(
        'request_id', p_request_id,
        'custom_title', p_custom_title,
        'notes', p_notes
      )
    );
  ELSE
    -- Rejeição
    UPDATE public.verification_requests
    SET status = 'rejeitado',
        reviewed_by = v_auth_uid,
        reviewed_at = now(),
        review_notes = p_notes,
        updated_at = now()
    WHERE id = p_request_id;

    -- Auditoria
    INSERT INTO public.verification_audit_logs (
      action,
      target_user_id,
      performed_by,
      details
    ) VALUES (
      'solicitacao_rejeitada',
      v_req.user_id,
      v_auth_uid,
      jsonb_build_object(
        'request_id', p_request_id,
        'notes', p_notes
      )
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'approved', p_approve);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RPC: Concessão Direta de Selo (Sem solicitação prévia)
CREATE OR REPLACE FUNCTION public.grant_direct_verification_rpc(
  p_target_user_id UUID,
  p_custom_title TEXT DEFAULT 'Verificado Oficial',
  p_badge_color TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_auth_uid UUID;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado.';
  END IF;

  IF NOT public.check_user_verification_permission(v_auth_uid) THEN
    RAISE EXCEPTION 'Você não possui permissão para conceder selos de verificação.';
  END IF;

  INSERT INTO public.member_verifications (
    user_id,
    is_verified,
    verified_at,
    verified_by,
    custom_title,
    badge_color_override,
    notes,
    updated_at
  ) VALUES (
    p_target_user_id,
    true,
    now(),
    v_auth_uid,
    COALESCE(p_custom_title, 'Verificado Oficial'),
    p_badge_color,
    p_notes,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET is_verified = true,
      verified_at = now(),
      verified_by = v_auth_uid,
      custom_title = COALESCE(p_custom_title, member_verifications.custom_title),
      badge_color_override = COALESCE(p_badge_color, member_verifications.badge_color_override),
      notes = p_notes,
      updated_at = now();

  UPDATE public.profiles
  SET is_verified = true,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  INSERT INTO public.verification_audit_logs (
    action,
    target_user_id,
    performed_by,
    details
  ) VALUES (
    'selo_concedido_direto',
    p_target_user_id,
    v_auth_uid,
    jsonb_build_object('custom_title', p_custom_title, 'notes', p_notes)
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. RPC: Revogar / Remover Selo de Verificado
CREATE OR REPLACE FUNCTION public.revoke_verification_rpc(
  p_target_user_id UUID,
  p_reason TEXT DEFAULT 'Selo revogado pela administração.'
)
RETURNS JSONB AS $$
DECLARE
  v_auth_uid UUID;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Não autenticado.';
  END IF;

  IF NOT public.check_user_verification_permission(v_auth_uid) THEN
    RAISE EXCEPTION 'Você não possui permissão para revogar selos de verificação.';
  END IF;

  UPDATE public.member_verifications
  SET is_verified = false,
      notes = p_reason,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  UPDATE public.profiles
  SET is_verified = false,
      updated_at = now()
  WHERE user_id = p_target_user_id;

  -- Atualiza eventuais solicitações aprovadas para 'revogado'
  UPDATE public.verification_requests
  SET status = 'revogado',
      updated_at = now()
  WHERE user_id = p_target_user_id AND status = 'aprovado';

  INSERT INTO public.verification_audit_logs (
    action,
    target_user_id,
    performed_by,
    details
  ) VALUES (
    'selo_removido',
    p_target_user_id,
    v_auth_uid,
    jsonb_build_object('reason', p_reason)
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. RLS (Row Level Security) e Permissões
ALTER TABLE public.verification_badge_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_audit_logs ENABLE ROW LEVEL SECURITY;

-- Config policies
DROP POLICY IF EXISTS "Public read verification config" ON public.verification_badge_config;
CREATE POLICY "Public read verification config" ON public.verification_badge_config
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authorized update verification config" ON public.verification_badge_config;
CREATE POLICY "Authorized update verification config" ON public.verification_badge_config
FOR ALL TO authenticated USING (public.check_user_verification_permission((select auth.uid())));

-- Requests policies
DROP POLICY IF EXISTS "Read own or authorized verification requests" ON public.verification_requests;
CREATE POLICY "Read own or authorized verification requests" ON public.verification_requests
FOR SELECT TO authenticated USING (
  user_id = (select auth.uid()) OR public.check_user_verification_permission((select auth.uid()))
);

DROP POLICY IF EXISTS "Insert own verification request" ON public.verification_requests;
CREATE POLICY "Insert own verification request" ON public.verification_requests
FOR INSERT TO authenticated WITH CHECK (
  user_id = (select auth.uid())
);

DROP POLICY IF EXISTS "Update own pending or authorized verification request" ON public.verification_requests;
CREATE POLICY "Update own pending or authorized verification request" ON public.verification_requests
FOR UPDATE TO authenticated USING (
  (user_id = (select auth.uid()) AND status = 'pendente') OR public.check_user_verification_permission((select auth.uid()))
);

-- Member verifications policies
DROP POLICY IF EXISTS "Read active member verifications" ON public.member_verifications;
CREATE POLICY "Read active member verifications" ON public.member_verifications
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authorized manage member verifications" ON public.member_verifications;
CREATE POLICY "Authorized manage member verifications" ON public.member_verifications
FOR ALL TO authenticated USING (public.check_user_verification_permission((select auth.uid())));

-- Audit logs policies
DROP POLICY IF EXISTS "Authorized read verification audit logs" ON public.verification_audit_logs;
CREATE POLICY "Authorized read verification audit logs" ON public.verification_audit_logs
FOR SELECT TO authenticated USING (public.check_user_verification_permission((select auth.uid())));

-- 14. Grants para Data API
GRANT ALL ON TABLE public.verification_badge_config TO authenticated, service_role;
GRANT ALL ON TABLE public.verification_requests TO authenticated, service_role;
GRANT ALL ON TABLE public.member_verifications TO authenticated, service_role;
GRANT ALL ON TABLE public.verification_audit_logs TO authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.submit_verification_request_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_verification_request_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_verification_request_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_direct_verification_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_verification_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_verification_permission TO authenticated;

-- 15. Habilita Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'verification_badge_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_badge_config;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'verification_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'member_verifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.member_verifications;
  END IF;
END $$;
