-- =========================================================================
-- MIGRATION: REMOVER grant_insignia DE GERENTE E ADMIN POR PADRÃO
-- APENAS CARGOS COM A PERMISSÃO EXPLICITAMENTE ATIVADA PODEM CONCEDER INSÍGNIAS
-- =========================================================================

-- 1. Atualizar grant_insignia_rpc para NÃO ter bypass automático de admin ou gerente
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
  v_insignia RECORD;
  v_grantor_xp BIGINT;
  v_new_grantor_xp BIGINT;
  v_member_name TEXT;
  v_grantor_name TEXT;
  v_cost INTEGER;
  v_grant_id UUID;
BEGIN
  -- 1. Identificar e validar o usuário chamador
  v_grantor_id := auth.uid();
  IF v_grantor_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuário não autenticado.';
  END IF;

  -- 2. VALIDAR SE O CARGO DO USUÁRIO POSSUI A PERMISSÃO 'grant_insignia' HABILITADA
  -- ATENÇÃO: NÃO conferir automaticamente para admin ou gerente.
  -- Apenas se o cargo tiver a permissão 'grant_insignia' explicitamente habilitada (ou se for desenvolvedor da plataforma).
  IF NOT (
    public.user_has_permission(v_grantor_id, 'grant_insignia')
    OR public.is_developer(v_grantor_id)
  ) THEN
    RAISE EXCEPTION 'Permissão negada: seu cargo atual não possui a permissão "Conceder Insígnias a Membro" habilitada.';
  END IF;

  -- 3. Não permitir auto-concessão de insígnias
  IF v_grantor_id = p_member_id THEN
    RAISE EXCEPTION 'Operação inválida: você não pode conceder insígnias a si mesmo.';
  END IF;

  -- 4. Validar motivo obrigatório
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'O motivo/justificativa para concessão da insígnia é obrigatório.';
  END IF;

  -- 5. Validar e buscar dados da insígnia no catálogo
  SELECT id, name, xp_cost, rarity, icon, category, active
  INTO v_insignia
  FROM public.insignias_catalog
  WHERE id = p_insignia_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insígnia inválida ou não encontrada no catálogo oficial.';
  END IF;

  IF NOT v_insignia.active THEN
    RAISE EXCEPTION 'Esta insígnia está temporariamente desativada no catálogo.';
  END IF;

  -- 6. Validar que o membro NÃO possui a insígnia (anti-duplicação)
  IF EXISTS (
    SELECT 1 FROM public.member_insignias
    WHERE user_id = p_member_id AND insignia_id = p_insignia_id
  ) THEN
    RAISE EXCEPTION 'O integrante selecionado já possui esta insígnia.';
  END IF;

  -- 7. Validar saldo de XP do concedente
  v_cost := COALESCE(v_insignia.xp_cost, 0);

  SELECT xp, coalesce(nickname, nome)
  INTO v_grantor_xp, v_grantor_name
  FROM public.profiles
  WHERE user_id = v_grantor_id
  FOR UPDATE;

  IF v_cost > 0 AND (v_grantor_xp IS NULL OR v_grantor_xp < v_cost) THEN
    RAISE EXCEPTION 'Saldo de XP insuficiente para condecoração. Custo: % XP, Saldo atual: % XP.',
      v_cost, COALESCE(v_grantor_xp, 0);
  END IF;

  -- 8. Buscar nome do membro agraciado
  SELECT coalesce(nickname, nome)
  INTO v_member_name
  FROM public.profiles
  WHERE user_id = p_member_id;

  IF v_member_name IS NULL THEN
    v_member_name := 'Integrante';
  END IF;

  -- 9. Debitar XP do concedente (se houver custo)
  IF v_cost > 0 THEN
    v_new_grantor_xp := v_grantor_xp - v_cost;

    UPDATE public.profiles
    SET
      xp = v_new_grantor_xp,
      updated_at = now()
    WHERE user_id = v_grantor_id;

    -- Registrar transação de débito no histórico de XP
    INSERT INTO public.xp_transactions (
      user_id,
      amount,
      xp_before,
      xp_after,
      action_type,
      description,
      metadata,
      created_by
    ) VALUES (
      v_grantor_id,
      -v_cost,
      v_grantor_xp,
      v_new_grantor_xp,
      'insignia_cost',
      format('Débito de XP para concessão da insígnia "%s" a %s', v_insignia.name, v_member_name),
      jsonb_build_object(
        'insignia_id', v_insignia.id,
        'insignia_name', v_insignia.name,
        'beneficiary_id', p_member_id,
        'beneficiary_name', v_member_name,
        'reason', trim(p_reason)
      ),
      v_grantor_id
    );
  END IF;

  -- 10. Inserir a condecoração na tabela member_insignias
  INSERT INTO public.member_insignias (
    user_id,
    insignia_id,
    granted_by,
    reason,
    granted_at
  ) VALUES (
    p_member_id,
    v_insignia.id,
    v_grantor_id,
    trim(p_reason),
    now()
  )
  RETURNING id INTO v_grant_id;

  -- 11. Auditoria da plataforma
  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    entity,
    details,
    created_at
  ) VALUES (
    v_grantor_id,
    v_grantor_name,
    'insignia_granted',
    'member_insignias',
    format('Concedeu a insígnia "%s" para o membro %s. Motivo: %s', v_insignia.name, v_member_name, trim(p_reason)),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'grant_id', v_grant_id,
    'insignia_id', v_insignia.id,
    'insignia_name', v_insignia.name,
    'insignia_rarity', v_insignia.rarity,
    'member_id', p_member_id,
    'member_name', v_member_name,
    'xp_cost', v_cost,
    'remaining_grantor_xp', COALESCE(v_new_grantor_xp, v_grantor_xp)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_insignia_rpc(UUID, TEXT, TEXT) TO authenticated, service_role;

-- 2. Limpar 'grant_insignia' das permissões salvas por padrão nos cargos no banco
-- Para garantir que NENHUM cargo tenha grant_insignia até que seja explicitamente habilitado na tela de permissões
UPDATE public.role_permissions
SET permissions = permissions - 'grant_insignia'
WHERE nivel IN ('gerente', '01', '02', 'admin', 'lider', 'sublider')
  AND jsonb_typeof(permissions) = 'array';
