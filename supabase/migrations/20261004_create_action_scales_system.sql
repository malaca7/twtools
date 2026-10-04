-- ==============================================================================
-- SISTEMA COMPLETO DE ESCALA DE AÇÃO (TWIN WHEELS)
-- ==============================================================================

-- 1. Tabela Principal: action_scales (Escalas de Ação)
CREATE TABLE IF NOT EXISTS public.action_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  tipo_acao text NOT NULL DEFAULT 'operacao',
  descricao text,
  data_hora timestamptz NOT NULL,
  data_hora_chamada timestamptz,
  local_posto text NOT NULL,
  vagas_limite integer NOT NULL DEFAULT 10,
  vagas_reservas integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicada', 'em_andamento', 'concluida', 'cancelada')),
  publicado_em timestamptz,
  cancelado_em timestamptz,
  motivo_cancelamento text,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_por_nome text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Membros Escalados: action_scale_members
CREATE TABLE IF NOT EXISTS public.action_scale_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_id uuid NOT NULL REFERENCES public.action_scales(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  nickname text,
  avatar_url text,
  cargo text,
  posto_funcao text NOT NULL DEFAULT 'Operacional',
  tipo_vaga text NOT NULL DEFAULT 'titular' CHECK (tipo_vaga IN ('titular', 'reserva')),
  status_presenca text NOT NULL DEFAULT 'pendente' CHECK (status_presenca IN ('pendente', 'confirmado', 'ausente', 'substituido')),
  reacao text,
  confirmado_em timestamptz,
  justificativa_ausencia text,
  substituido_por_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  substituido_por_nome text,
  substituicao_motivo text,
  adicionado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_scale_member UNIQUE (scale_id, member_id)
);

-- 3. Tabela de Auditoria e Histórico: action_scale_history
CREATE TABLE IF NOT EXISTS public.action_scale_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_id uuid NOT NULL REFERENCES public.action_scales(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  action_type text NOT NULL,
  details text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_action_scales_status ON public.action_scales(status);
CREATE INDEX IF NOT EXISTS idx_action_scales_data_hora ON public.action_scales(data_hora);
CREATE INDEX IF NOT EXISTS idx_action_scale_members_scale ON public.action_scale_members(scale_id);
CREATE INDEX IF NOT EXISTS idx_action_scale_members_member ON public.action_scale_members(member_id);
CREATE INDEX IF NOT EXISTS idx_action_scale_history_scale ON public.action_scale_history(scale_id);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.trg_update_action_scales_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_action_scales_updated ON public.action_scales;
CREATE TRIGGER trg_action_scales_updated
BEFORE UPDATE ON public.action_scales
FOR EACH ROW EXECUTE FUNCTION public.trg_update_action_scales_timestamp();

DROP TRIGGER IF EXISTS trg_action_scale_members_updated ON public.action_scale_members;
CREATE TRIGGER trg_action_scale_members_updated
BEFORE UPDATE ON public.action_scale_members
FOR EACH ROW EXECUTE FUNCTION public.trg_update_action_scales_timestamp();

-- Habilitar RLS
ALTER TABLE public.action_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_scale_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_scale_history ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS Permissivas para Usuários Autenticados
DROP POLICY IF EXISTS "action_scales_select_authenticated" ON public.action_scales;
CREATE POLICY "action_scales_select_authenticated"
ON public.action_scales FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "action_scales_all_authenticated" ON public.action_scales;
CREATE POLICY "action_scales_all_authenticated"
ON public.action_scales FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "action_scale_members_select_authenticated" ON public.action_scale_members;
CREATE POLICY "action_scale_members_select_authenticated"
ON public.action_scale_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "action_scale_members_all_authenticated" ON public.action_scale_members;
CREATE POLICY "action_scale_members_all_authenticated"
ON public.action_scale_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "action_scale_history_select_authenticated" ON public.action_scale_history;
CREATE POLICY "action_scale_history_select_authenticated"
ON public.action_scale_history FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "action_scale_history_insert_authenticated" ON public.action_scale_history;
CREATE POLICY "action_scale_history_insert_authenticated"
ON public.action_scale_history FOR INSERT TO authenticated WITH CHECK (true);

-- Habilitar Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'action_scales'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.action_scales;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'action_scale_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.action_scale_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'action_scale_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.action_scale_history;
  END IF;
END $$;

-- ==============================================================================
-- RPCs TRANSACIONAIS SEGURAS DO SISTEMA DE ESCALA DE AÇÃO
-- ==============================================================================

-- 1. Obter Escalas com Contagens Agregadas
CREATE OR REPLACE FUNCTION public.get_action_scales_summary(p_status text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'titulo', s.titulo,
      'tipo_acao', s.tipo_acao,
      'descricao', s.descricao,
      'data_hora', s.data_hora,
      'data_hora_chamada', s.data_hora_chamada,
      'local_posto', s.local_posto,
      'vagas_limite', s.vagas_limite,
      'vagas_reservas', s.vagas_reservas,
      'status', s.status,
      'publicado_em', s.publicado_em,
      'cancelado_em', s.cancelado_em,
      'motivo_cancelamento', s.motivo_cancelamento,
      'criado_por', s.criado_por,
      'criado_por_nome', s.criado_por_nome,
      'metadata', s.metadata,
      'criado_em', s.criado_em,
      'atualizado_em', s.atualizado_em,
      'total_titulares', coalesce(m.total_titulares, 0),
      'total_reservas', coalesce(m.total_reservas, 0),
      'confirmados_titulares', coalesce(m.confirmados_titulares, 0),
      'ausentes_titulares', coalesce(m.ausentes_titulares, 0),
      'pendentes_titulares', coalesce(m.pendentes_titulares, 0),
      'confirmados_reservas', coalesce(m.confirmados_reservas, 0),
      'substituidos_count', coalesce(m.substituidos_count, 0),
      'user_member_status', coalesce(u.status_presenca, NULL),
      'user_is_escalado', (u.member_id IS NOT NULL)
    ) ORDER BY s.data_hora ASC
  ), '[]'::jsonb) INTO v_result
  FROM public.action_scales s
  LEFT JOIN (
    SELECT 
      scale_id,
      count(*) FILTER (WHERE tipo_vaga = 'titular') AS total_titulares,
      count(*) FILTER (WHERE tipo_vaga = 'reserva') AS total_reservas,
      count(*) FILTER (WHERE tipo_vaga = 'titular' AND status_presenca = 'confirmado') AS confirmados_titulares,
      count(*) FILTER (WHERE tipo_vaga = 'titular' AND status_presenca = 'ausente') AS ausentes_titulares,
      count(*) FILTER (WHERE tipo_vaga = 'titular' AND status_presenca = 'pendente') AS pendentes_titulares,
      count(*) FILTER (WHERE tipo_vaga = 'reserva' AND status_presenca = 'confirmado') AS confirmados_reservas,
      count(*) FILTER (WHERE status_presenca = 'substituido') AS substituidos_count
    FROM public.action_scale_members
    GROUP BY scale_id
  ) m ON m.scale_id = s.id
  LEFT JOIN (
    SELECT scale_id, member_id, status_presenca
    FROM public.action_scale_members
    WHERE user_id = auth.uid() OR member_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    LIMIT 1
  ) u ON u.scale_id = s.id
  WHERE (p_status IS NULL OR s.status = p_status);

  RETURN v_result;
END;
$$;

-- 2. Criar ou Atualizar Escala
CREATE OR REPLACE FUNCTION public.save_action_scale(
  p_id uuid,
  p_titulo text,
  p_tipo_acao text,
  p_descricao text,
  p_data_hora timestamptz,
  p_data_hora_chamada timestamptz,
  p_local_posto text,
  p_vagas_limite integer,
  p_vagas_reservas integer,
  p_status text,
  p_actor_name text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scale_id uuid;
  v_res jsonb;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO public.action_scales (
      titulo,
      tipo_acao,
      descricao,
      data_hora,
      data_hora_chamada,
      local_posto,
      vagas_limite,
      vagas_reservas,
      status,
      criado_por,
      criado_por_nome,
      metadata,
      publicado_em
    ) VALUES (
      p_titulo,
      p_tipo_acao,
      p_descricao,
      p_data_hora,
      p_data_hora_chamada,
      p_local_posto,
      coalesce(p_vagas_limite, 10),
      coalesce(p_vagas_reservas, 2),
      coalesce(p_status, 'rascunho'),
      auth.uid(),
      p_actor_name,
      coalesce(p_metadata, '{}'::jsonb),
      CASE WHEN p_status = 'publicada' THEN timezone('utc'::text, now()) ELSE NULL END
    ) RETURNING id INTO v_scale_id;

    -- Registrar histórico
    INSERT INTO public.action_scale_history (
      scale_id, actor_id, actor_name, action_type, details
    ) VALUES (
      v_scale_id,
      auth.uid(),
      p_actor_name,
      'criacao',
      'Escala criada com status ' || coalesce(p_status, 'rascunho')
    );
  ELSE
    v_scale_id := p_id;
    UPDATE public.action_scales SET
      titulo = p_titulo,
      tipo_acao = p_tipo_acao,
      descricao = p_descricao,
      data_hora = p_data_hora,
      data_hora_chamada = p_data_hora_chamada,
      local_posto = p_local_posto,
      vagas_limite = coalesce(p_vagas_limite, vagas_limite),
      vagas_reservas = coalesce(p_vagas_reservas, vagas_reservas),
      status = coalesce(p_status, status),
      metadata = coalesce(p_metadata, metadata),
      publicado_em = CASE 
        WHEN p_status = 'publicada' AND status = 'rascunho' THEN timezone('utc'::text, now())
        ELSE publicado_em 
      END,
      atualizado_em = timezone('utc'::text, now())
    WHERE id = v_scale_id;

    -- Registrar histórico
    INSERT INTO public.action_scale_history (
      scale_id, actor_id, actor_name, action_type, details
    ) VALUES (
      v_scale_id,
      auth.uid(),
      p_actor_name,
      'edicao',
      'Dados da escala atualizados por ' || p_actor_name
    );
  END IF;

  SELECT to_jsonb(s.*) INTO v_res FROM public.action_scales s WHERE s.id = v_scale_id;
  RETURN v_res;
END;
$$;

-- 3. Publicar Escala
CREATE OR REPLACE FUNCTION public.publish_action_scale(
  p_scale_id uuid,
  p_actor_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.action_scales SET
    status = 'publicada',
    publicado_em = timezone('utc'::text, now()),
    atualizado_em = timezone('utc'::text, now())
  WHERE id = p_scale_id;

  INSERT INTO public.action_scale_history (
    scale_id, actor_id, actor_name, action_type, details
  ) VALUES (
    p_scale_id,
    auth.uid(),
    p_actor_name,
    'publicacao',
    'Escala oficial publicada para confirmação dos membros'
  );

  RETURN jsonb_build_object('success', true, 'scale_id', p_scale_id);
END;
$$;

-- 4. Cancelar Escala
CREATE OR REPLACE FUNCTION public.cancel_action_scale(
  p_scale_id uuid,
  p_motivo text,
  p_actor_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.action_scales SET
    status = 'cancelada',
    cancelado_em = timezone('utc'::text, now()),
    motivo_cancelamento = p_motivo,
    atualizado_em = timezone('utc'::text, now())
  WHERE id = p_scale_id;

  INSERT INTO public.action_scale_history (
    scale_id, actor_id, actor_name, action_type, details
  ) VALUES (
    p_scale_id,
    auth.uid(),
    p_actor_name,
    'cancelamento',
    'Escala cancelada. Motivo: ' || coalesce(p_motivo, 'Sem motivo informado')
  );

  RETURN jsonb_build_object('success', true, 'scale_id', p_scale_id);
END;
$$;

-- 5. Adicionar Membro Escalado
CREATE OR REPLACE FUNCTION public.add_action_scale_member(
  p_scale_id uuid,
  p_member_id uuid,
  p_posto_funcao text,
  p_tipo_vaga text,
  p_actor_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prof record;
  v_member_rec record;
BEGIN
  SELECT id, user_id, nome, nickname, avatar_url INTO v_prof 
  FROM public.profiles 
  WHERE id = p_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil de membro não encontrado.';
  END IF;

  INSERT INTO public.action_scale_members (
    scale_id,
    member_id,
    user_id,
    nome,
    nickname,
    avatar_url,
    posto_funcao,
    tipo_vaga,
    status_presenca,
    adicionado_por
  ) VALUES (
    p_scale_id,
    v_prof.id,
    v_prof.user_id,
    v_prof.nome,
    v_prof.nickname,
    v_prof.avatar_url,
    coalesce(p_posto_funcao, 'Operacional'),
    coalesce(p_tipo_vaga, 'titular'),
    'pendente',
    auth.uid()
  )
  ON CONFLICT (scale_id, member_id) 
  DO UPDATE SET
    posto_funcao = coalesce(p_posto_funcao, action_scale_members.posto_funcao),
    tipo_vaga = coalesce(p_tipo_vaga, action_scale_members.tipo_vaga),
    atualizado_em = timezone('utc'::text, now())
  RETURNING * INTO v_member_rec;

  INSERT INTO public.action_scale_history (
    scale_id, actor_id, actor_name, action_type, details
  ) VALUES (
    p_scale_id,
    auth.uid(),
    p_actor_name,
    'adicao_membro',
    'Membro ' || coalesce(v_prof.nickname, v_prof.nome) || ' adicionado como ' || coalesce(p_posto_funcao, 'Operacional') || ' (' || coalesce(p_tipo_vaga, 'titular') || ')'
  );

  RETURN to_jsonb(v_member_rec);
END;
$$;

-- 6. Remover Membro da Escala
CREATE OR REPLACE FUNCTION public.remove_action_scale_member(
  p_scale_id uuid,
  p_member_id uuid,
  p_actor_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nome text;
BEGIN
  SELECT coalesce(nickname, nome) INTO v_nome
  FROM public.action_scale_members
  WHERE scale_id = p_scale_id AND member_id = p_member_id;

  DELETE FROM public.action_scale_members
  WHERE scale_id = p_scale_id AND member_id = p_member_id;

  INSERT INTO public.action_scale_history (
    scale_id, actor_id, actor_name, action_type, details
  ) VALUES (
    p_scale_id,
    auth.uid(),
    p_actor_name,
    'remocao_membro',
    'Membro ' || coalesce(v_nome, 'desconhecido') || ' desescalado da ação'
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 7. Confirmar Presença ou Ausência (Reação/Status)
CREATE OR REPLACE FUNCTION public.confirm_action_scale_presence(
  p_scale_id uuid,
  p_member_id uuid,
  p_status_presenca text,
  p_reacao text,
  p_justificativa text,
  p_actor_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec record;
BEGIN
  UPDATE public.action_scale_members SET
    status_presenca = p_status_presenca,
    reacao = p_reacao,
    justificativa_ausencia = p_justificativa,
    confirmado_em = CASE WHEN p_status_presenca = 'confirmado' THEN timezone('utc'::text, now()) ELSE confirmado_em END,
    atualizado_em = timezone('utc'::text, now())
  WHERE scale_id = p_scale_id AND (member_id = p_member_id OR user_id = auth.uid())
  RETURNING * INTO v_rec;

  INSERT INTO public.action_scale_history (
    scale_id, actor_id, actor_name, action_type, details
  ) VALUES (
    p_scale_id,
    auth.uid(),
    p_actor_name,
    'status_presenca',
    coalesce(v_rec.nickname, v_rec.nome, p_actor_name) || ' definiu presença como ' || p_status_presenca || 
    CASE WHEN p_justificativa IS NOT NULL AND length(trim(p_justificativa)) > 0 THEN ' (Motivo: ' || p_justificativa || ')' ELSE '' END
  );

  RETURN to_jsonb(v_rec);
END;
$$;

-- 8. Substituição de Membro Ausente
CREATE OR REPLACE FUNCTION public.substitute_action_scale_member(
  p_scale_id uuid,
  p_original_member_id uuid,
  p_substituto_id uuid,
  p_motivo text,
  p_actor_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub record;
  v_orig record;
  v_posto text;
BEGIN
  -- Dados do membro original
  SELECT * INTO v_orig FROM public.action_scale_members
  WHERE scale_id = p_scale_id AND member_id = p_original_member_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro original não encontrado na escala.';
  END IF;

  v_posto := v_orig.posto_funcao;

  -- Dados do substituto
  SELECT id, user_id, nome, nickname, avatar_url INTO v_sub
  FROM public.profiles
  WHERE id = p_substituto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil do substituto não encontrado.';
  END IF;

  -- Marca o original como substituído
  UPDATE public.action_scale_members SET
    status_presenca = 'substituido',
    substituido_por_id = v_sub.id,
    substituido_por_nome = coalesce(v_sub.nickname, v_sub.nome),
    substituicao_motivo = p_motivo,
    atualizado_em = timezone('utc'::text, now())
  WHERE scale_id = p_scale_id AND member_id = p_original_member_id;

  -- Insere o substituto como titular ou reserva conforme o posto original
  INSERT INTO public.action_scale_members (
    scale_id,
    member_id,
    user_id,
    nome,
    nickname,
    avatar_url,
    posto_funcao,
    tipo_vaga,
    status_presenca,
    reacao,
    confirmado_em,
    adicionado_por
  ) VALUES (
    p_scale_id,
    v_sub.id,
    v_sub.user_id,
    v_sub.nome,
    v_sub.nickname,
    v_sub.avatar_url,
    v_posto,
    v_orig.tipo_vaga,
    'confirmado',
    '🔄',
    timezone('utc'::text, now()),
    auth.uid()
  )
  ON CONFLICT (scale_id, member_id) DO UPDATE SET
    posto_funcao = v_posto,
    tipo_vaga = v_orig.tipo_vaga,
    status_presenca = 'confirmado',
    reacao = '🔄',
    confirmado_em = timezone('utc'::text, now()),
    atualizado_em = timezone('utc'::text, now());

  -- Histórico
  INSERT INTO public.action_scale_history (
    scale_id, actor_id, actor_name, action_type, details
  ) VALUES (
    p_scale_id,
    auth.uid(),
    p_actor_name,
    'substituicao',
    'Substituição: ' || coalesce(v_sub.nickname, v_sub.nome) || ' assumiu a vaga de ' || coalesce(v_orig.nickname, v_orig.nome) || ' (' || v_posto || '). Motivo: ' || coalesce(p_motivo, 'Sem motivo')
  );

  RETURN jsonb_build_object('success', true);
END;
$$;
