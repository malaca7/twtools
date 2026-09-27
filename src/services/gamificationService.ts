import { supabase } from "@/integrations/supabase/client";

export type InsigniaRarity = "comum" | "raro" | "epico" | "lendario" | "mitico";

export interface InsigniaItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: InsigniaRarity;
  xp_cost: number;
  category: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MemberInsigniaGrant {
  id: string;
  member_id: string;
  insignia_id: string;
  granted_by: string;
  xp_cost_paid: number;
  reason: string;
  granted_at: string;
  insignia?: InsigniaItem;
  grantor_name?: string;
  grantor_avatar?: string;
}

export interface MemberEvaluation {
  id: string;
  member_id: string;
  evaluator_id: string;
  stars: number;
  feedback?: string;
  category: string;
  created_at: string;
  evaluator_name?: string;
}

export interface XpTransaction {
  id: string;
  user_id: string;
  amount: number;
  xp_before: number;
  xp_after: number;
  action_type: string;
  reference_id?: string;
  category: string;
  description: string;
  metadata?: any;
  created_at: string;
}

export interface XpRuleConfig {
  action_type: string;
  name: string;
  xp_reward: number;
  cooldown_seconds: number;
  daily_cap: number;
  category: string;
  description?: string;
  enabled: boolean;
}

export interface RankedGamificationMember {
  user_id: string;
  nome: string;
  nickname: string | null;
  avatar_url: string | null;
  game_id: string | null;
  nivel: string | null;
  is_developer: boolean;
  is_ceo: boolean;
  xp: number;
  period_xp: number;
  gamification_level: number;
  stars_rating: number;
  stars_count: number;
  insignias_count: number;
  rank_position: number;
  insignias?: MemberInsigniaGrant[];
}

export interface LevelInfo {
  level: number;
  title: string;
  currentXp: number;
  levelStartXp: number;
  nextLevelXp: number;
  xpNeededForNext: number;
  xpInCurrentLevel: number;
  progressPercent: number;
  isMaxLevel?: boolean;
}

// Configuração matemática de patamares de XP por Nível
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Recruta do Asfalto" },
  { level: 2, xp: 100, title: "Iniciado da Twin" },
  { level: 3, xp: 250, title: "Soldado da Estrada" },
  { level: 4, xp: 500, title: "Operador de Pista" },
  { level: 5, xp: 900, title: "Especialista Tático" },
  { level: 6, xp: 1500, title: "Veterano de Honra" },
  { level: 7, xp: 2400, title: "Capitão do Comboio" },
  { level: 8, xp: 3700, title: "Guardião da Facção" },
  { level: 9, xp: 5500, title: "Comandante Operacional" },
  { level: 10, xp: 8000, title: "Mestre Supremo" },
  { level: 11, xp: 11500, title: "Lorde do Asfalto" },
  { level: 12, xp: 16000, title: "Pilar da Facção" },
  { level: 13, xp: 22000, title: "Lenda Twin Wheels" },
  { level: 14, xp: 30000, title: "Titã da Estrada" },
  { level: 15, xp: 40000, title: "Imortal da Twin" },
  { level: 16, xp: 55000, title: "Vanguarda Lendária" },
  { level: 17, xp: 75000, title: "Patriarca de Honra" },
  { level: 18, xp: 100000, title: "Dominador do Tráfego" },
  { level: 19, xp: 135000, title: "Mito Consagrado" },
  { level: 20, xp: 180000, title: "Supremacia Eterna" },
];

export function getLevelInfo(totalXp: number): LevelInfo {
  const xp = Math.max(0, Number(totalXp || 0));

  let currentTier = LEVEL_THRESHOLDS[0];
  let nextTier = LEVEL_THRESHOLDS[1];

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      currentTier = LEVEL_THRESHOLDS[i];
      nextTier = LEVEL_THRESHOLDS[i + 1] || null;
    } else {
      break;
    }
  }

  if (!nextTier) {
    // Acima do nível 20
    const extraLevels = Math.floor((xp - 180000) / 30000);
    const lvl = 20 + extraLevels;
    const startXp = 180000 + extraLevels * 30000;
    const endXp = startXp + 30000;
    const inLvl = xp - startXp;
    return {
      level: lvl,
      title: "Supremacia Eterna",
      currentXp: xp,
      levelStartXp: startXp,
      nextLevelXp: endXp,
      xpNeededForNext: endXp - xp,
      xpInCurrentLevel: inLvl,
      progressPercent: Math.min(100, Math.round((inLvl / 30000) * 100)),
      isMaxLevel: false,
    };
  }

  const range = nextTier.xp - currentTier.xp;
  const inLevel = xp - currentTier.xp;
  const pct = range > 0 ? Math.min(100, Math.max(0, Math.round((inLevel / range) * 100))) : 100;

  return {
    level: currentTier.level,
    title: currentTier.title,
    currentXp: xp,
    levelStartXp: currentTier.xp,
    nextLevelXp: nextTier.xp,
    xpNeededForNext: Math.max(0, nextTier.xp - xp),
    xpInCurrentLevel: inLevel,
    progressPercent: pct,
    isMaxLevel: false,
  };
}

export const RARITY_CONFIG: Record<
  InsigniaRarity,
  { label: string; borderClass: string; bgClass: string; textClass: string; glowClass: string }
> = {
  comum: {
    label: "Comum",
    borderClass: "border-slate-500/50",
    bgClass: "bg-slate-500/10",
    textClass: "text-slate-300",
    glowClass: "shadow-slate-500/10",
  },
  raro: {
    label: "Raro",
    borderClass: "border-sky-500/50",
    bgClass: "bg-sky-500/10",
    textClass: "text-sky-300",
    glowClass: "shadow-sky-500/20",
  },
  epico: {
    label: "Épico",
    borderClass: "border-purple-500/50",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-300",
    glowClass: "shadow-purple-500/20",
  },
  lendario: {
    label: "Lendário",
    borderClass: "border-amber-500/60",
    bgClass: "bg-amber-500/15",
    textClass: "text-amber-300",
    glowClass: "shadow-amber-500/30",
  },
  mitico: {
    label: "Mítico",
    borderClass: "border-rose-500/70",
    bgClass: "bg-rose-500/15",
    textClass: "text-rose-300",
    glowClass: "shadow-rose-500/30",
  },
};

/**
 * Busca o Ranking Gamificado oficial ordenado por XP
 */
export async function getGamificationRanking(period: "all" | "month" | "week" = "all"): Promise<RankedGamificationMember[]> {
  try {
    const { data, error } = await supabase.rpc("get_gamification_ranking", {
      p_period: period,
    });

    if (error) {
      console.warn("RPC get_gamification_ranking falhou, fallback direto em profiles:", error);
      return await getRankingFallback(period);
    }

    if (!Array.isArray(data)) return [];

    return data.map((m: any) => ({
      user_id: m.user_id,
      nome: m.nome,
      nickname: m.nickname,
      avatar_url: m.avatar_url,
      game_id: m.game_id,
      nivel: m.nivel,
      is_developer: Boolean(m.is_developer),
      is_ceo: Boolean(m.is_ceo),
      xp: Number(m.xp || 0),
      period_xp: Number(m.period_xp || 0),
      gamification_level: Number(m.gamification_level || 1),
      stars_rating: Number(m.stars_rating || 5.0),
      stars_count: Number(m.stars_count || 0),
      insignias_count: Number(m.insignias_count || 0),
      rank_position: Number(m.rank_position || 1),
    }));
  } catch (err) {
    console.error("Erro ao obter ranking gamificado:", err);
    return [];
  }
}

async function getRankingFallback(period: string): Promise<RankedGamificationMember[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, nome, nickname, avatar_url, discord_avatar_url, game_id, is_developer, is_ceo, xp, gamification_level, stars_rating, stars_count, status")
    .eq("status", "ativo")
    .order("xp", { ascending: false });

  if (error || !profiles) return [];

  const { data: roles } = await supabase.from("user_roles").select("user_id, nivel");
  const rolesMap = new Map((roles || []).map((r) => [r.user_id, r.nivel]));

  return profiles.map((p, idx) => ({
    user_id: p.user_id,
    nome: p.nome,
    nickname: p.nickname,
    avatar_url: p.avatar_url || p.discord_avatar_url,
    game_id: p.game_id,
    nivel: rolesMap.get(p.user_id) || "membro",
    is_developer: Boolean(p.is_developer),
    is_ceo: Boolean(p.is_ceo),
    xp: Number(p.xp || 0),
    period_xp: Number(p.xp || 0),
    gamification_level: Number(p.gamification_level || 1),
    stars_rating: Number(p.stars_rating || 5.0),
    stars_count: Number(p.stars_count || 0),
    insignias_count: 0,
    rank_position: idx + 1,
  }));
}

/**
 * Busca o catálogo oficial de insígnias configuradas
 */
export async function getInsigniasCatalog(): Promise<InsigniaItem[]> {
  const { data, error } = await supabase
    .from("insignias" as any)
    .select("*")
    .eq("active", true)
    .order("xp_cost", { ascending: true });

  if (error || !data) {
    console.warn("Falha ao buscar catálogo de insígnias:", error);
    return [];
  }

  return data as InsigniaItem[];
}

/**
 * Busca as insígnias conquistadas por um membro específico
 */
export async function getMemberInsignias(memberId: string): Promise<MemberInsigniaGrant[]> {
  if (!memberId) return [];

  const { data, error } = await supabase
    .from("member_insignias" as any)
    .select(`
      id,
      member_id,
      insignia_id,
      granted_by,
      xp_cost_paid,
      reason,
      granted_at,
      insignias:insignia_id (
        id,
        name,
        icon,
        description,
        rarity,
        xp_cost,
        category
      ),
      grantor:granted_by (
        nome,
        nickname,
        avatar_url,
        discord_avatar_url
      )
    `)
    .eq("member_id", memberId)
    .order("granted_at", { ascending: false });

  if (error || !data) {
    console.warn("Falha ao buscar insígnias do membro:", error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    member_id: item.member_id,
    insignia_id: item.insignia_id,
    granted_by: item.granted_by,
    xp_cost_paid: Number(item.xp_cost_paid || 0),
    reason: item.reason,
    granted_at: item.granted_at,
    insignia: item.insignias as InsigniaItem,
    grantor_name: item.grantor?.nickname || item.grantor?.nome || "Comandante",
    grantor_avatar: item.grantor?.avatar_url || item.grantor?.discord_avatar_url,
  }));
}

/**
 * Concede uma insígnia com custo de XP descontado do concedente (Gerente/Admin)
 */
export async function grantInsignia(params: {
  memberId: string;
  insigniaId: string;
  reason: string;
}): Promise<{ success: boolean; message: string; grantor_new_xp?: number }> {
  const { data, error } = await supabase.rpc("grant_insignia_rpc", {
    p_member_id: params.memberId,
    p_insignia_id: params.insigniaId,
    p_reason: params.reason,
  });

  if (error) {
    throw new Error(error.message || "Falha ao conceder insígnia.");
  }

  return data as any;
}

/**
 * Avalia um membro com 1 a 5 estrelas
 */
export async function evaluateMember(params: {
  memberId: string;
  stars: number;
  feedback?: string;
  category?: string;
}): Promise<{ success: boolean; message: string; new_rating: number; stars_count: number }> {
  const { data, error } = await supabase.rpc("evaluate_member_rpc", {
    p_member_id: params.memberId,
    p_stars: params.stars,
    p_feedback: params.feedback || "",
    p_category: params.category || "geral",
  });

  if (error) {
    throw new Error(error.message || "Falha ao avaliar membro.");
  }

  return data as any;
}

/**
 * Busca histórico de transações de XP do usuário
 */
export async function getMemberXpTransactions(userId: string, limit = 20): Promise<XpTransaction[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("xp_transactions" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as XpTransaction[];
}

/**
 * Salva/configura uma insígnia no catálogo (Admin/Dev)
 */
export async function saveInsignia(insignia: Partial<InsigniaItem> & { id: string; name: string }): Promise<void> {
  const { error } = await supabase.rpc("save_insignia_rpc", {
    p_id: insignia.id,
    p_name: insignia.name,
    p_icon: insignia.icon || "Award",
    p_description: insignia.description || "",
    p_rarity: insignia.rarity || "comum",
    p_xp_cost: Number(insignia.xp_cost || 0),
    p_category: insignia.category || "geral",
    p_active: insignia.active !== false,
  });

  if (error) {
    throw new Error(error.message || "Falha ao salvar insígnia no catálogo.");
  }
}
