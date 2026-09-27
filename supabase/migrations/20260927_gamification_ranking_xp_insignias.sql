-- =========================================================================
-- MIGRAÇÃO: SISTEMA DE GAMIFICAÇÃO, RANKING POR XP, NÍVEIS, ESTRELAS E INSÍGNIAS
-- =========================================================================

-- 1. EXTENSÃO DA TABELA PROFILES (XP, Nível Gamificado e Avaliação em Estrelas)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'xp') THEN
    ALTER TABLE public.profiles ADD COLUMN xp BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gamification_level') THEN
    ALTER TABLE public.profiles ADD COLUMN gamification_level INTEGER NOT NULL DEFAULT 1 CHECK (gamification_level >= 1);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stars_rating') THEN
    ALTER TABLE public.profiles ADD COLUMN stars_rating NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (stars_rating >= 0 AND stars_rating <= 5.00);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stars_count') THEN
    ALTER TABLE public.profiles ADD COLUMN stars_count INTEGER NOT NULL DEFAULT 0 CHECK (stars_count >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_xp_desc ON public.profiles (xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_gamification_level ON public.profiles (gamification_level DESC);

-- 2. FUNÇÃO AUXILIAR MATEMÁTICA DE CÁLCULO DE NÍVEL BASEADO EM XP
CREATE OR REPLACE FUNCTION public.calculate_gamification_level(p_xp BIGINT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_xp IS NULL OR p_xp < 100 THEN
    RETURN 1;
  ELSIF p_xp < 250 THEN
    RETURN 2;
  ELSIF p_xp < 500 THEN
    RETURN 3;
  ELSIF p_xp < 900 THEN
    RETURN 4;
  ELSIF p_xp < 1500 THEN
    RETURN 5;
  ELSIF p_xp < 2400 THEN
    RETURN 6;
  ELSIF p_xp < 3700 THEN
    RETURN 7;
  ELSIF p_xp < 5500 THEN
    RETURN 8;
  ELSIF p_xp < 8000 THEN
    RETURN 9;
  ELSIF p_xp < 11500 THEN
    RETURN 10;
  ELSIF p_xp < 16000 THEN
    RETURN 11;
  ELSIF p_xp < 22000 THEN
    RETURN 12;
  ELSIF p_xp < 30000 THEN
    RETURN 13;
  ELSIF p_xp < 40000 THEN
    RETURN 14;
  ELSIF p_xp < 55000 THEN
    RETURN 15;
  ELSIF p_xp < 75000 THEN
    RETURN 16;
  ELSIF p_xp < 100000 THEN
    RETURN 17;
  ELSIF p_xp < 135000 THEN
    RETURN 18;
  ELSIF p_xp < 180000 THEN
    RETURN 19;
  ELSE
    -- Progressão contínua para níveis lendários 20+
    RETURN 20 + floor((p_xp - 180000) / 30000)::INTEGER;
  END IF;
END;
$$;

-- 3. TABELA DE REGRAS E LIMITES DE XP (PROTEÇÃO ANTI-FARMING, COOLDOWN E LIMITES DIÁRIOS)
CREATE TABLE IF NOT EXISTS public.xp_rules_config (
  action_type TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
  cooldown_seconds INTEGER NOT NULL DEFAULT 60 CHECK (cooldown_seconds >= 0),
  daily_cap INTEGER NOT NULL DEFAULT 50 CHECK (daily_cap >= 0),
  category TEXT NOT NULL DEFAULT 'geral',
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserção de regras calibradas (XP difícil, interações reais e limites rígidos)
INSERT INTO public.xp_rules_config (action_type, name, xp_reward, cooldown_seconds, daily_cap, category, description, enabled)
VALUES
  ('sale_completed', 'Venda Comercial Concluída', 15, 60, 75, 'sales', 'Conclusão de venda de insumos/armamentos devidamente validada.', true),
  ('stock_movement', 'Movimentação em Baú', 5, 120, 20, 'logistics', 'Abastecimento ou recolhimento registrado e auditado em baú físico.', true),
  ('daily_presence', 'Presença Ativa Diária', 10, 86400, 10, 'presence', 'Bônus diário de atividade na plataforma com heartbeat auditado.', true),
  ('ticket_resolved', 'Atendimento / Ticket Resolvido', 10, 300, 20, 'support', 'Resolução de ticket ou mediação de suporte aos membros.', true),
  ('peer_eval_given', 'Avaliação de Membro Realizada', 5, 1800, 15, 'evaluation', 'Exercício de liderança e auditoria ao avaliar um colega.', true),
  ('peer_eval_received', 'Destaque em Avaliação (4 ou 5 Estrelas)', 10, 3600, 30, 'evaluation', 'Reconhecimento por excelência operacional recebido de gerente/admin.', true),
  ('post_published', 'Publicação Oficial no Feed', 5, 1800, 10, 'social', 'Compartilhamento de informe ou registro de operação no mural.', true),
  ('goal_milestone', 'Meta Operacional Atingida', 25, 3600, 50, 'performance', 'Conquista de meta do grupo estabelecida pela diretoria.', true)
ON CONFLICT (action_type) DO UPDATE SET
  name = EXCLUDED.name,
  xp_reward = EXCLUDED.xp_reward,
  cooldown_seconds = EXCLUDED.cooldown_seconds,
  daily_cap = EXCLUDED.daily_cap,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- 4. TABELA DE AUDITORIA E HISTÓRICO DE XP (TRANSAÇÕES IMUTÁVEIS COM DEDUPLICAÇÃO)
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  xp_before BIGINT NOT NULL,
  xp_after BIGINT NOT NULL,
  action_type TEXT NOT NULL,
  reference_id TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deduplicação estrita: mesmo action_type + reference_id para o mesmo usuário é bloqueado pelo banco
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_tx_dedup
  ON public.xp_transactions (user_id, action_type, reference_id)
  WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_xp_tx_user_created ON public.xp_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_tx_action_created ON public.xp_transactions (action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_tx_created ON public.xp_transactions (created_at DESC);

-- 5. TABELA DE CATÁLOGO DE INSÍGNIAS (CONFIGURÁVEL POR ADMINS)
CREATE TABLE IF NOT EXISTS public.insignias (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'comum' CHECK (rarity IN ('comum', 'raro', 'epico', 'lendario', 'mitico')),
  xp_cost INTEGER NOT NULL DEFAULT 0 CHECK (xp_cost >= 0),
  category TEXT NOT NULL DEFAULT 'geral',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserção de insígnias oficiais de facção
INSERT INTO public.insignias (id, name, icon, description, rarity, xp_cost, category, active)
VALUES
  ('iniciacao_asfalto', 'Iniciação no Asfalto', 'Shield', 'Integrado oficialmente às operações da Twin Wheels.', 'comum', 0, 'honra', true),
  ('guardiao_bau', 'Guardião do Depósito', 'Boxes', 'Auditoria exemplar e zelo constante pelo patrimônio e baús do grupo.', 'comum', 50, 'logistica', true),
  ('operador_tatica', 'Operador Tático', 'Target', 'Disciplina máxima e precisão em ações e operações de campo.', 'raro', 100, 'operacoes', true),
  ('negociador_ouro', 'Negociador de Ouro', 'DollarSign', 'Fechamento de acordos comerciais de grande vulto para a facção.', 'raro', 150, 'vendas', true),
  ('mestre_logistica', 'Mestre da Logística', 'Truck', 'Eficiência impecável na cadeia de suprimentos e transporte blindado.', 'epico', 250, 'logistica', true),
  ('falcao_vigia', 'Falcão da Guarda', 'Eye', 'Dedicação contínua na vigilância e inteligência de território.', 'epico', 350, 'seguranca', true),
  ('lideranca_suprema', 'Liderança Suprema', 'Crown', 'Comando executivo respeitado, mentor de novos talentos e guia operacional.', 'lendario', 500, 'lideranca', true),
  ('mito_twin_wheels', 'Mito Twin Wheels', 'Sparkles', 'Distinção máxima concedida a pilares inquestionáveis da história do grupo.', 'mitico', 1000, 'honra', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  xp_cost = EXCLUDED.xp_cost,
  category = EXCLUDED.category,
  active = EXCLUDED.active;

-- 6. TABELA DE INSÍGNIAS CONCEDIDAS AOS MEMBROS
CREATE TABLE IF NOT EXISTS public.member_insignias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  insignia_id TEXT NOT NULL REFERENCES public.insignias(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE RESTRICT,
  xp_cost_paid INTEGER NOT NULL DEFAULT 0 CHECK (xp_cost_paid >= 0),
  reason TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_insignias_member ON public.member_insignias (member_id, granted_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_insignias_grantor ON public.member_insignias (granted_by);
CREATE INDEX IF NOT EXISTS idx_member_insignias_insignia ON public.member_insignias (insignia_id);

-- 7. TABELA DE AVALIAÇÕES DE MEMBROS (1 A 5 ESTRELAS)
CREATE TABLE IF NOT EXISTS public.member_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE RESTRICT,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  feedback TEXT,
  category TEXT NOT NULL DEFAULT 'geral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_eval_no_self CHECK (member_id <> evaluator_id)
);

CREATE INDEX IF NOT EXISTS idx_member_evals_member ON public.member_evaluations (member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_evals_evaluator ON public.member_evaluations (evaluator_id, member_id, created_at DESC);

-- =========================================================================
-- FUNÇÕES RPC SEGURAS (TRANSAÇÕES ATÔMICAS COM ROW-LOCKS SELECT FOR UPDATE)
-- =========================================================================

-- FUNÇÃO 1: CONCEDER INSÍGNIA COM CUSTO DEDUZIDO DO PRÓPRIO GERENTE/ADMIN
CREATE OR REPLACE FUNCTION public.grant_insignia_rpc(
  p_member_id UUID,
  p_insignia_id TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_grantor_id UUID;
  v_grantor_xp BIGINT;
  v_grantor_name TEXT;
  v_member_name TEXT;
  v_cost INTEGER;
  v_insignia RECORD;
  v_new_grantor_xp BIGINT;
  v_grant_id UUID;
BEGIN
  -- 1. Identificar e validar o usuário chamador
  v_grantor_id := auth.uid();
  IF v_grantor_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  -- 2. Validar permissões de gerência/administração no backend
  IF NOT (public.is_manager(v_grantor_id) OR public.is_admin(v_grantor_id)) THEN
    RAISE EXCEPTION 'Permissão negada: apenas Gerentes ou Administradores podem conceder insígnias.';
  END IF;

  -- 3. Não permitir auto-concessão de insígnias
  IF v_grantor_id = p_member_id THEN
    RAISE EXCEPTION 'Operação inválida: você não pode conceder insígnias a si mesmo.';
  END IF;

  -- 4. Validar motivo obrigatório
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'O motivo/justificativa para concessão da insígnia é obrigatório.';
  END IF;

  -- 5. Carregar dados da insígnia
  SELECT * INTO v_insignia FROM public.insignias WHERE id = p_insignia_id AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insígnia inválida ou inativa no catálogo.';
  END IF;
  v_cost := v_insignia.xp_cost;

  -- 6. Bloqueio em linha (Row Lock) no perfil do concedente para evitar race conditions
  SELECT xp, COALESCE(nickname, nome) INTO v_grantor_xp, v_grantor_name
  FROM public.profiles
  WHERE user_id = v_grantor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil do concedente não encontrado no sistema.';
  END IF;

  -- 7. REGRA VITAL: Verificar se o administrador/gerente possui XP suficiente
  IF v_grantor_xp < v_cost THEN
    RAISE EXCEPTION 'XP insuficiente para conceder esta insígnia. Você possui % XP, mas o custo exigido é de % XP.', v_grantor_xp, v_cost;
  END IF;

  -- 8. Bloqueio em linha no perfil do membro beneficiado
  SELECT COALESCE(nickname, nome) INTO v_member_name
  FROM public.profiles
  WHERE user_id = p_member_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro alvo não encontrado no sistema.';
  END IF;

  -- 9. DEDUZIR XP DO ADMINISTRADOR/GERENTE (NUNCA DO MEMBRO)
  v_new_grantor_xp := v_grantor_xp - v_cost;
  UPDATE public.profiles
  SET
    xp = v_new_grantor_xp,
    gamification_level = public.calculate_gamification_level(v_new_grantor_xp),
    updated_at = now()
  WHERE user_id = v_grantor_id;

  -- 10. Registrar transação de auditoria de XP para o concedente se houve custo
  IF v_cost > 0 THEN
    INSERT INTO public.xp_transactions (
      user_id,
      amount,
      xp_before,
      xp_after,
      action_type,
      reference_id,
      category,
      description,
      metadata
    ) VALUES (
      v_grantor_id,
      -v_cost,
      v_grantor_xp,
      v_new_grantor_xp,
      'insignia_grant_cost',
      p_member_id::text || '_' || p_insignia_id || '_' || extract(epoch from now())::text,
      'badge',
      format('Custo de concessão da insígnia "%s" para o membro %s', v_insignia.name, v_member_name),
      jsonb_build_object(
        'member_id', p_member_id,
        'member_name', v_member_name,
        'insignia_id', p_insignia_id,
        'insignia_name', v_insignia.name,
        'cost', v_cost,
        'reason', p_reason
      )
    );
  END IF;

  -- 11. Inserir registro oficial de concessão da insígnia
  INSERT INTO public.member_insignias (
    member_id,
    insignia_id,
    granted_by,
    xp_cost_paid,
    reason,
    granted_at
  ) VALUES (
    p_member_id,
    p_insignia_id,
    v_grantor_id,
    v_cost,
    trim(p_reason),
    now()
  ) RETURNING id INTO v_grant_id;

  -- 12. Registrar log de auditoria global da facção
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) VALUES (
    v_grantor_id,
    'GRANT_INSIGNIA',
    'member_insignias',
    v_grant_id::text,
    jsonb_build_object(
      'member_id', p_member_id,
      'member_name', v_member_name,
      'insignia_id', p_insignia_id,
      'insignia_name', v_insignia.name,
      'xp_cost_deducted', v_cost,
      'grantor_new_xp', v_new_grantor_xp,
      'reason', p_reason
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'grant_id', v_grant_id,
    'member_id', p_member_id,
    'member_name', v_member_name,
    'insignia_id', p_insignia_id,
    'insignia_name', v_insignia.name,
    'xp_cost_deducted', v_cost,
    'grantor_new_xp', v_new_grantor_xp,
    'message', format('Insígnia "%s" concedida com sucesso para %s!', v_insignia.name, v_member_name)
  );
END;
$$;

-- FUNÇÃO 2: AVALIAR MEMBRO COM 1 A 5 ESTRELAS
CREATE OR REPLACE FUNCTION public.evaluate_member_rpc(
  p_member_id UUID,
  p_stars INTEGER,
  p_feedback TEXT,
  p_category TEXT DEFAULT 'geral'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_evaluator_id UUID;
  v_evaluator_name TEXT;
  v_member_name TEXT;
  v_new_rating NUMERIC(3,2);
  v_new_count INTEGER;
  v_last_eval TIMESTAMPTZ;
  v_eval_id UUID;
BEGIN
  v_evaluator_id := auth.uid();
  IF v_evaluator_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  -- Validar permissão de gerência/administração
  IF NOT (public.is_manager(v_evaluator_id) OR public.is_admin(v_evaluator_id)) THEN
    RAISE EXCEPTION 'Permissão negada: apenas Gerentes ou Administradores podem avaliar membros.';
  END IF;

  IF v_evaluator_id = p_member_id THEN
    RAISE EXCEPTION 'Operação inválida: você não pode avaliar a si mesmo.';
  END IF;

  IF p_stars < 1 OR p_stars > 5 THEN
    RAISE EXCEPTION 'A nota de avaliação deve ser entre 1 e 5 estrelas.';
  END IF;

  -- Rate limit / Cooldown de avaliação: 1 avaliação a cada 12 horas por par (avaliador, membro)
  SELECT created_at INTO v_last_eval
  FROM public.member_evaluations
  WHERE evaluator_id = v_evaluator_id AND member_id = p_member_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_eval IS NOT NULL AND (now() - v_last_eval) < INTERVAL '12 hours' THEN
    RAISE EXCEPTION 'Você já avaliou este membro recentemente. Aguarde o período de resfriamento para uma nova avaliação.';
  END IF;

  -- Inserir avaliação
  INSERT INTO public.member_evaluations (
    member_id,
    evaluator_id,
    stars,
    feedback,
    category,
    created_at
  ) VALUES (
    p_member_id,
    v_evaluator_id,
    p_stars,
    COALESCE(trim(p_feedback), ''),
    COALESCE(p_category, 'geral'),
    now()
  ) RETURNING id INTO v_eval_id;

  -- Recalcular média e quantidade de avaliações do membro
  SELECT
    ROUND(AVG(stars)::NUMERIC, 2),
    COUNT(*)::INTEGER
  INTO v_new_rating, v_new_count
  FROM public.member_evaluations
  WHERE member_id = p_member_id;

  -- Atualizar no perfil do membro
  UPDATE public.profiles
  SET
    stars_rating = COALESCE(v_new_rating, 5.00),
    stars_count = v_new_count,
    updated_at = now()
  WHERE user_id = p_member_id;

  SELECT COALESCE(nickname, nome) INTO v_member_name FROM public.profiles WHERE user_id = p_member_id;
  SELECT COALESCE(nickname, nome) INTO v_evaluator_name FROM public.profiles WHERE user_id = v_evaluator_id;

  -- Concessão segura de XP de incentivo (5 XP ao avaliador por cumprir papel de auditoria)
  PERFORM public.award_platform_xp_internal(
    v_evaluator_id,
    'peer_eval_given',
    v_eval_id::text,
    format('Auditoria de desempenho: avaliação de %s (%s estrelas)', v_member_name, p_stars)
  );

  -- Se membro recebeu nota de excelência (4 ou 5 estrelas), ganha bônus de XP de reconhecimento
  IF p_stars >= 4 THEN
    PERFORM public.award_platform_xp_internal(
      p_member_id,
      'peer_eval_received',
      v_eval_id::text,
      format('Reconhecimento de desempenho: avaliação de %s estrelas por %s', p_stars, v_evaluator_name)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'eval_id', v_eval_id,
    'stars', p_stars,
    'new_rating', v_new_rating,
    'stars_count', v_new_count,
    'member_name', v_member_name,
    'message', format('Avaliação de %s estrelas registrada com sucesso para %s!', p_stars, v_member_name)
  );
END;
$$;

-- FUNÇÃO 3: MOTOR INTERNO DE CONCESSÃO DE XP COM REGRAS E DEDUPLICAÇÃO
CREATE OR REPLACE FUNCTION public.award_platform_xp_internal(
  p_user_id UUID,
  p_action_type TEXT,
  p_reference_id TEXT,
  p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_rule RECORD;
  v_today_xp INTEGER;
  v_last_time TIMESTAMPTZ;
  v_grant_xp INTEGER;
  v_user_xp BIGINT;
  v_new_xp BIGINT;
  v_new_level INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'invalid_user');
  END IF;

  -- 1. Carregar regra do tipo de ação
  SELECT * INTO v_rule FROM public.xp_rules_config WHERE action_type = p_action_type AND enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'rule_disabled_or_not_found');
  END IF;

  -- 2. DEDUPLICAÇÃO ESTRITA: se já recebeu XP por esta referência única, ignora silenciosamente
  IF p_reference_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.xp_transactions
    WHERE user_id = p_user_id AND action_type = p_action_type AND reference_id = p_reference_id
  ) THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'already_claimed');
  END IF;

  -- 3. COOLDOWN / ANTI-SPAM: verificar se última concessão desta ação foi há menos que cooldown_seconds
  IF v_rule.cooldown_seconds > 0 THEN
    SELECT created_at INTO v_last_time
    FROM public.xp_transactions
    WHERE user_id = p_user_id AND action_type = p_action_type
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_time IS NOT NULL AND (now() - v_last_time) < (v_rule.cooldown_seconds || ' seconds')::INTERVAL THEN
      RETURN jsonb_build_object('granted', false, 'reason', 'cooldown_active');
    END IF;
  END IF;

  -- 4. LIMITE DIÁRIO (DAILY CAP): somar XP já acumulado hoje nesta ação
  SELECT COALESCE(SUM(amount), 0) INTO v_today_xp
  FROM public.xp_transactions
  WHERE user_id = p_user_id
    AND action_type = p_action_type
    AND amount > 0
    AND created_at >= date_trunc('day', now());

  IF v_today_xp >= v_rule.daily_cap THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'daily_cap_reached');
  END IF;

  -- 5. Calcular valor real a conceder respeitando o teto diário
  v_grant_xp := LEAST(v_rule.xp_reward, v_rule.daily_cap - v_today_xp);
  IF v_grant_xp <= 0 THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'daily_cap_reached');
  END IF;

  -- 6. Lock no perfil do usuário e incremento atômico de XP
  SELECT xp INTO v_user_xp FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'profile_not_found');
  END IF;

  v_new_xp := v_user_xp + v_grant_xp;
  v_new_level := public.calculate_gamification_level(v_new_xp);

  UPDATE public.profiles
  SET
    xp = v_new_xp,
    gamification_level = v_new_level,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- 7. Registrar transação imutável no livro-razão de XP
  INSERT INTO public.xp_transactions (
    user_id,
    amount,
    xp_before,
    xp_after,
    action_type,
    reference_id,
    category,
    description,
    metadata
  ) VALUES (
    p_user_id,
    v_grant_xp,
    v_user_xp,
    v_new_xp,
    p_action_type,
    p_reference_id,
    v_rule.category,
    COALESCE(p_description, v_rule.name),
    jsonb_build_object(
      'daily_accumulated', v_today_xp + v_grant_xp,
      'daily_cap', v_rule.daily_cap
    )
  );

  RETURN jsonb_build_object(
    'granted', true,
    'xp_awarded', v_grant_xp,
    'xp_total', v_new_xp,
    'gamification_level', v_new_level
  );
END;
$$;

-- FUNÇÃO 4: CONCESSÃO VIA API COM AUTENTICAÇÃO E CHECAGEM DE PROPRIETÁRIO
CREATE OR REPLACE FUNCTION public.claim_action_xp_rpc(
  p_action_type TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  RETURN public.award_platform_xp_internal(v_caller_id, p_action_type, p_reference_id, p_description);
END;
$$;

-- FUNÇÃO 5: GESTÃO DE REGRAS DE XP E INSÍGNIAS (EXCLUSIVO PARA ADMINISTRADORES/DEVS)
CREATE OR REPLACE FUNCTION public.save_insignia_rpc(
  p_id TEXT,
  p_name TEXT,
  p_icon TEXT,
  p_description TEXT,
  p_rarity TEXT,
  p_xp_cost INTEGER,
  p_category TEXT DEFAULT 'geral',
  p_active BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Acesso negado: apenas Administradores podem gerenciar o catálogo de insígnias.';
  END IF;

  INSERT INTO public.insignias (
    id, name, icon, description, rarity, xp_cost, category, active, updated_at
  ) VALUES (
    trim(p_id), trim(p_name), trim(p_icon), trim(p_description), p_rarity, p_xp_cost, p_category, p_active, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    rarity = EXCLUDED.rarity,
    xp_cost = EXCLUDED.xp_cost,
    category = EXCLUDED.category,
    active = EXCLUDED.active,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'insignia_id', p_id);
END;
$$;

-- FUNÇÃO 6: CONSULTA CONSOLIDADA DE RANKING POR XP (COM SUPORTE A FILTROS GERAL/MÊS/SEMANA)
CREATE OR REPLACE FUNCTION public.get_gamification_ranking(
  p_period TEXT DEFAULT 'all'
)
RETURNS TABLE (
  user_id UUID,
  nome TEXT,
  nickname TEXT,
  avatar_url TEXT,
  game_id TEXT,
  nivel TEXT,
  is_developer BOOLEAN,
  is_ceo BOOLEAN,
  xp BIGINT,
  period_xp BIGINT,
  gamification_level INTEGER,
  stars_rating NUMERIC,
  stars_count INTEGER,
  insignias_count INTEGER,
  rank_position BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_since TIMESTAMPTZ;
BEGIN
  IF p_period = 'week' THEN
    v_since := now() - INTERVAL '7 days';
  ELSIF p_period = 'month' THEN
    v_since := now() - INTERVAL '30 days';
  ELSE
    v_since := NULL;
  END IF;

  RETURN QUERY
  WITH period_calc AS (
    SELECT
      tx.user_id as pid,
      COALESCE(SUM(tx.amount), 0)::BIGINT as sum_xp
    FROM public.xp_transactions tx
    WHERE (v_since IS NULL OR tx.created_at >= v_since)
      AND tx.amount > 0
    GROUP BY tx.user_id
  ),
  insignia_calc AS (
    SELECT
      mi.member_id as mid,
      COUNT(*)::INTEGER as badge_count
    FROM public.member_insignias mi
    GROUP BY mi.member_id
  ),
  base_members AS (
    SELECT
      p.user_id,
      p.nome,
      p.nickname,
      COALESCE(p.avatar_url, p.discord_avatar_url) as avatar_url,
      p.game_id,
      COALESCE(ur.nivel::text, 'membro') as nivel,
      COALESCE(p.is_developer, false) as is_developer,
      COALESCE(p.is_ceo, false) as is_ceo,
      p.xp,
      COALESCE(pc.sum_xp, 0)::BIGINT as period_xp,
      p.gamification_level,
      p.stars_rating,
      p.stars_count,
      COALESCE(ic.badge_count, 0) as insignias_count
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    LEFT JOIN period_calc pc ON pc.pid = p.user_id
    LEFT JOIN insignia_calc ic ON ic.mid = p.user_id
    WHERE p.status = 'ativo'
  )
  SELECT
    bm.user_id,
    bm.nome,
    bm.nickname,
    bm.avatar_url,
    bm.game_id,
    bm.nivel,
    bm.is_developer,
    bm.is_ceo,
    bm.xp,
    bm.period_xp,
    bm.gamification_level,
    bm.stars_rating,
    bm.stars_count,
    bm.insignias_count,
    ROW_NUMBER() OVER (
      ORDER BY
        (CASE WHEN v_since IS NOT NULL THEN bm.period_xp ELSE bm.xp END) DESC,
        bm.xp DESC,
        bm.stars_rating DESC,
        bm.nome ASC
    ) as rank_position
  FROM base_members bm;
END;
$$;

-- =========================================================================
-- HABILITAR RLS E CRIAR POLÍTICAS DE ACESSO SEGURO
-- =========================================================================
ALTER TABLE public.xp_rules_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insignias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_insignias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_evaluations ENABLE ROW LEVEL SECURITY;

-- 1. xp_rules_config: Leitura pública para autenticados; escrita restrita a admins
DROP POLICY IF EXISTS "xp_rules_select" ON public.xp_rules_config;
CREATE POLICY "xp_rules_select" ON public.xp_rules_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "xp_rules_admin_all" ON public.xp_rules_config;
CREATE POLICY "xp_rules_admin_all" ON public.xp_rules_config
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 2. insignias: Leitura para todos os autenticados; escrita para admins
DROP POLICY IF EXISTS "insignias_select" ON public.insignias;
CREATE POLICY "insignias_select" ON public.insignias
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insignias_admin_all" ON public.insignias;
CREATE POLICY "insignias_admin_all" ON public.insignias
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 3. member_insignias: Leitura para todos; inserção via grant_insignia_rpc (SECURITY DEFINER)
DROP POLICY IF EXISTS "member_insignias_select" ON public.member_insignias;
CREATE POLICY "member_insignias_select" ON public.member_insignias
  FOR SELECT TO authenticated USING (true);

-- 4. member_evaluations: Leitura pública; inserção para gerentes/admins
DROP POLICY IF EXISTS "member_evaluations_select" ON public.member_evaluations;
CREATE POLICY "member_evaluations_select" ON public.member_evaluations
  FOR SELECT TO authenticated USING (true);

-- 5. xp_transactions: Leitura do próprio histórico ou para admins/gerentes
DROP POLICY IF EXISTS "xp_transactions_select" ON public.xp_transactions;
CREATE POLICY "xp_transactions_select" ON public.xp_transactions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    public.is_manager(auth.uid()) OR
    public.is_admin(auth.uid())
  );

-- HABILITAR REALTIME NAS TABELAS DE GAMIFICAÇÃO
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_transactions;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.member_insignias;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.member_evaluations;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
