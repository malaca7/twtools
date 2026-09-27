-- ============================================================================
-- CURVA DE XP SUPER DIFÍCIL: NÍVEL 5 MUITO DIFÍCIL & NÍVEL 10 HIPER DIFÍCIL
-- ============================================================================

-- 1. Redução e Calibração dos Custos das Insígnias
UPDATE public.insignias SET xp_cost = 0, rarity = 'comum' WHERE id = 'iniciacao_asfalto';
UPDATE public.insignias SET xp_cost = 2, rarity = 'comum' WHERE id = 'guardiao_bau';
UPDATE public.insignias SET xp_cost = 5, rarity = 'raro' WHERE id = 'operador_tatica';
UPDATE public.insignias SET xp_cost = 10, rarity = 'raro' WHERE id = 'negociador_ouro';
UPDATE public.insignias SET xp_cost = 18, rarity = 'epico' WHERE id = 'mestre_logistica';
UPDATE public.insignias SET xp_cost = 25, rarity = 'epico' WHERE id = 'falcao_vigia';
UPDATE public.insignias SET xp_cost = 50, rarity = 'lendario' WHERE id = 'lideranca_suprema';
UPDATE public.insignias SET xp_cost = 100, rarity = 'mitico' WHERE id = 'mito_twin_wheels';

-- 2. Calibração Rigorosa e Escassa das Regras de Ganho de XP
UPDATE public.xp_rules_config SET xp_reward = 1, cooldown_seconds = 180, daily_cap = 3 WHERE action_type = 'sale_completed';
UPDATE public.xp_rules_config SET xp_reward = 1, cooldown_seconds = 300, daily_cap = 2 WHERE action_type = 'stock_movement';
UPDATE public.xp_rules_config SET xp_reward = 1, cooldown_seconds = 86400, daily_cap = 1 WHERE action_type = 'daily_presence';
UPDATE public.xp_rules_config SET xp_reward = 1, cooldown_seconds = 600, daily_cap = 2 WHERE action_type = 'ticket_resolved';
UPDATE public.xp_rules_config SET xp_reward = 1, cooldown_seconds = 3600, daily_cap = 1 WHERE action_type = 'peer_eval_given';
UPDATE public.xp_rules_config SET xp_reward = 1, cooldown_seconds = 7200, daily_cap = 2 WHERE action_type = 'peer_eval_received';
UPDATE public.xp_rules_config SET xp_reward = 1, cooldown_seconds = 3600, daily_cap = 1 WHERE action_type = 'post_published';
UPDATE public.xp_rules_config SET xp_reward = 2, cooldown_seconds = 7200, daily_cap = 2 WHERE action_type = 'goal_milestone';

-- 3. Função Matemática Oficial de Níveis (1 até 50+)
-- Requisitos: Nível 5 (1.500 XP - Muito Difícil), Nível 10 (15.000 XP - Super Hiper Difícil)
CREATE OR REPLACE FUNCTION public.calculate_gamification_level(p_xp BIGINT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_xp BIGINT;
BEGIN
  v_xp := COALESCE(p_xp, 0);
  IF v_xp < 0 THEN
    v_xp := 0;
  END IF;

  -- Níveis 40 a 50
  IF v_xp >= 6250000 THEN RETURN 50;
  ELSIF v_xp >= 5885000 THEN RETURN 49;
  ELSIF v_xp >= 5550000 THEN RETURN 48;
  ELSIF v_xp >= 5225000 THEN RETURN 47;
  ELSIF v_xp >= 4910000 THEN RETURN 46;
  ELSIF v_xp >= 4605000 THEN RETURN 45;
  ELSIF v_xp >= 4310000 THEN RETURN 44;
  ELSIF v_xp >= 4025000 THEN RETURN 43;
  ELSIF v_xp >= 3750000 THEN RETURN 42;
  ELSIF v_xp >= 3485000 THEN RETURN 41;
  ELSIF v_xp >= 3230000 THEN RETURN 40;

  -- Níveis 30 a 39
  ELSIF v_xp >= 2985000 THEN RETURN 39;
  ELSIF v_xp >= 2750000 THEN RETURN 38;
  ELSIF v_xp >= 2525000 THEN RETURN 37;
  ELSIF v_xp >= 2310000 THEN RETURN 36;
  ELSIF v_xp >= 2105000 THEN RETURN 35;
  ELSIF v_xp >= 1910000 THEN RETURN 34;
  ELSIF v_xp >= 1725000 THEN RETURN 33;
  ELSIF v_xp >= 1550000 THEN RETURN 32;
  ELSIF v_xp >= 1385000 THEN RETURN 31;
  ELSIF v_xp >= 1230000 THEN RETURN 30;

  -- Níveis 20 a 29
  ELSIF v_xp >= 1085000 THEN RETURN 29;
  ELSIF v_xp >= 950000 THEN RETURN 28;
  ELSIF v_xp >= 825000 THEN RETURN 27;
  ELSIF v_xp >= 710000 THEN RETURN 26;
  ELSIF v_xp >= 605000 THEN RETURN 25;
  ELSIF v_xp >= 510000 THEN RETURN 24;
  ELSIF v_xp >= 425000 THEN RETURN 23;
  ELSIF v_xp >= 350000 THEN RETURN 22;
  ELSIF v_xp >= 285000 THEN RETURN 21;
  ELSIF v_xp >= 230000 THEN RETURN 20;

  -- Níveis 10 a 19
  ELSIF v_xp >= 185000 THEN RETURN 19;
  ELSIF v_xp >= 149000 THEN RETURN 18;
  ELSIF v_xp >= 119000 THEN RETURN 17;
  ELSIF v_xp >= 94000 THEN RETURN 16;
  ELSIF v_xp >= 73000 THEN RETURN 15;
  ELSIF v_xp >= 56000 THEN RETURN 14;
  ELSIF v_xp >= 42000 THEN RETURN 13;
  ELSIF v_xp >= 31000 THEN RETURN 12;
  ELSIF v_xp >= 22000 THEN RETURN 11;
  ELSIF v_xp >= 15000 THEN RETURN 10; -- MILESTONE 10: 15.000 XP (SUPER SUPER HIPER DIFÍCIL)

  -- Níveis 1 a 9
  ELSIF v_xp >= 9800 THEN RETURN 9;
  ELSIF v_xp >= 6500 THEN RETURN 8;
  ELSIF v_xp >= 4200 THEN RETURN 7;
  ELSIF v_xp >= 2600 THEN RETURN 6;
  ELSIF v_xp >= 1500 THEN RETURN 5; -- MILESTONE 5: 1.500 XP (MUITO DIFÍCIL)
  ELSIF v_xp >= 800 THEN RETURN 4;
  ELSIF v_xp >= 350 THEN RETURN 3;
  ELSIF v_xp >= 120 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$;

-- 4. Redução dos Saldos de XP Atuais dos Membros (Escala Ultra Rara)
UPDATE public.profiles
SET xp = 28, gamification_level = 1
WHERE user_id = 'd8261681-8469-4643-bca0-5fc154b3a25b'; -- Andrew

UPDATE public.profiles
SET xp = 18, gamification_level = 1
WHERE user_id = '23bb2cb3-4bc8-48e9-b38e-78d50874083f'; -- Toretto

UPDATE public.profiles
SET xp = 15, gamification_level = 1
WHERE user_id = '2a974403-195b-4a1c-8c80-85afc1e77391'; -- Medusa

UPDATE public.profiles
SET xp = 14, gamification_level = 1
WHERE user_id = '3c062f9c-cb7a-4a8b-8d78-0fe5693098a5'; -- Macaé

UPDATE public.profiles
SET xp = 12, gamification_level = 1
WHERE user_id = '5eb49e12-e1ea-4180-9206-29105b3f1ea6'; -- lennon

UPDATE public.profiles
SET xp = 11, gamification_level = 1
WHERE user_id = 'f970371a-246e-4109-8a08-d197a41f0906'; -- JOAO SK

UPDATE public.profiles
SET xp = 9, gamification_level = 1
WHERE user_id = 'ce2aa0d1-43a9-44ab-b5fa-8021589b28d2'; -- KAIM

UPDATE public.profiles
SET xp = 5, gamification_level = 1
WHERE user_id = '6e2f5d10-d684-4caf-8c1e-636b9d1a84d6'; -- Dev

UPDATE public.profiles
SET xp = 5, gamification_level = 1
WHERE user_id = 'c5ef6dc6-e126-4027-80c3-319f0a870315'; -- Malaca

-- Demais membros sem movimentações zerados
UPDATE public.profiles
SET xp = 0, gamification_level = 1
WHERE user_id NOT IN (
  'd8261681-8469-4643-bca0-5fc154b3a25b',
  '23bb2cb3-4bc8-48e9-b38e-78d50874083f',
  '2a974403-195b-4a1c-8c80-85afc1e77391',
  '3c062f9c-cb7a-4a8b-8d78-0fe5693098a5',
  '5eb49e12-e1ea-4180-9206-29105b3f1ea6',
  'f970371a-246e-4109-8a08-d197a41f0906',
  'ce2aa0d1-43a9-44ab-b5fa-8021589b28d2',
  '6e2f5d10-d684-4caf-8c1e-636b9d1a84d6',
  'c5ef6dc6-e126-4027-80c3-319f0a870315'
);

-- Recalcular todos os níveis em profiles para garantir consistência perfeita
UPDATE public.profiles
SET gamification_level = public.calculate_gamification_level(xp);

-- Sincronizar registros de auditoria em xp_transactions
UPDATE public.xp_transactions SET amount = 28, xp_after = 28 WHERE user_id = 'd8261681-8469-4643-bca0-5fc154b3a25b';
UPDATE public.xp_transactions SET amount = 18, xp_after = 18 WHERE user_id = '23bb2cb3-4bc8-48e9-b38e-78d50874083f';
UPDATE public.xp_transactions SET amount = 15, xp_after = 15 WHERE user_id = '2a974403-195b-4a1c-8c80-85afc1e77391';
UPDATE public.xp_transactions SET amount = 14, xp_after = 14 WHERE user_id = '3c062f9c-cb7a-4a8b-8d78-0fe5693098a5';
UPDATE public.xp_transactions SET amount = 12, xp_after = 12 WHERE user_id = '5eb49e12-e1ea-4180-9206-29105b3f1ea6';
UPDATE public.xp_transactions SET amount = 11, xp_after = 11 WHERE user_id = 'f970371a-246e-4109-8a08-d197a41f0906';
UPDATE public.xp_transactions SET amount = 9, xp_after = 9 WHERE user_id = 'ce2aa0d1-43a9-44ab-b5fa-8021589b28d2';
UPDATE public.xp_transactions SET amount = 5, xp_after = 5 WHERE user_id = '6e2f5d10-d684-4caf-8c1e-636b9d1a84d6';
UPDATE public.xp_transactions SET amount = 5, xp_after = 5 WHERE user_id = 'c5ef6dc6-e126-4027-80c3-319f0a870315';

