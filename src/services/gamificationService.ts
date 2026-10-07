import { supabase } from "@/integrations/supabase/client";

export type InsigniaRarity = "comum" | "raro" | "epico" | "lendario" | "mitico";

export type InsigniaShape3D =
  | "rosette"   // 🏵️ Roseta Dentada 3D (Estilo Verified da Imagem)
  | "medal"     // 🎖️ Medalha Circular 3D
  | "shield"    // 🛡️ Escudo Nobre 3D
  | "diamond"   // 💎 Diamante / Joia Lapidada 3D
  | "hexagon"   // ⬡ Hexágono Tático 3D
  | "octagon"   // 🛑 Octógono Imperial 3D
  | "square"    // ⏹️ Broche Quadrado Chanfrado 3D
  | "star";     // ⭐ Estrela Real 3D

export type InsigniaMaterial3D =
  | "safira_blue"      // 💎 Safira Azul 3D (Verified Oficial da Imagem)
  | "gold_24k"          // 🏆 Ouro Nobre 24k
  | "ruby_red"          // 🔮 Rubi Imperial 3D
  | "platinum_chrome"   // 👑 Platina & Cromo Espelhado
  | "amethyst_purple"   // 🌌 Ametista Cósmica
  | "emerald_green"     // 🌿 Esmeralda Real 3D
  | "obsidian_black"    // 🌑 Obsidiana & Ouro Negro
  | "cyber_neon"        // ⚡ Holográfico / Cyber Neon
  | "custom";           // 🎨 Cores Personalizadas

export type InsigniaBorderStyle3D =
  | "metallic_chamfer"  // Borda Metálica Chanfrada
  | "gold_trim"         // Moldura Ouro 24k
  | "silver_trim"       // Moldura Prata Espelhada
  | "neon_glow"         // Borda Neon Glow
  | "glass_rim"         // Borda de Vidro Cristalino
  | "none";             // Sem Borda Adicional

export type InsigniaGlossEffect =
  | "ultra_glass"       // Efeito Vidro Convexo Ultra 3D (com Arco Especular)
  | "specular_sheen"    // Brilho Esmaltado Metálico
  | "radial_dome"       // Domo 3D Curvado
  | "holographic";      // Reflexo Holográfico Furta-cor

export interface InsigniaItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: InsigniaRarity;
  xp_cost: number;
  category: string;
  active: boolean;
  color?: string | null;       // cor do ícone (foreground)
  bg_color?: string | null;    // cor de fundo do emblema
  border_color?: string | null; // cor da borda do emblema
  shape_3d?: InsigniaShape3D;
  material_3d?: InsigniaMaterial3D;
  border_style_3d?: InsigniaBorderStyle3D;
  gloss_effect?: InsigniaGlossEffect;
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

// Configuração matemática de patamares de XP por Nível (1 a 50+)
// Curva balanceada para economia decimal: Nível 2 (5 XP), Nível 5 (60 XP), Nível 10 (400 XP)
export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Recruta do Asfalto" },
  { level: 2, xp: 5, title: "Iniciado da Twin" },
  { level: 3, xp: 15, title: "Aspirante da Estrada" },
  { level: 4, xp: 30, title: "Soldado de Pista" },
  { level: 5, xp: 60, title: "Operador Tático" },
  { level: 6, xp: 100, title: "Sentinela de Honra" },
  { level: 7, xp: 160, title: "Batedor Noturno" },
  { level: 8, xp: 240, title: "Veterano de Ronda" },
  { level: 9, xp: 320, title: "Especialista de Comboio" },
  { level: 10, xp: 400, title: "Comandante Operacional" },
  { level: 11, xp: 500, title: "Capitão da Estrada" },
  { level: 12, xp: 620, title: "Guarda de Elite" },
  { level: 13, xp: 760, title: "Inspetor Tático" },
  { level: 14, xp: 920, title: "Marechal de Pista" },
  { level: 15, xp: 1100, title: "Pilar da Facção" },
  { level: 16, xp: 1300, title: "Guardião de Ferro" },
  { level: 17, xp: 1520, title: "Carrasco do Tráfego" },
  { level: 18, xp: 1760, title: "Patriarca de Ronda" },
  { level: 19, xp: 2020, title: "Mentor do Asfalto" },
  { level: 20, xp: 2300, title: "Lorde da Facção" },
  { level: 21, xp: 2600, title: "Mestre de Operações" },
  { level: 22, xp: 2920, title: "Sentinela Supremo" },
  { level: 23, xp: 3260, title: "Vanguarda Implacável" },
  { level: 24, xp: 3620, title: "Sombra da Estrada" },
  { level: 25, xp: 4000, title: "Grão-Mestre Twin Wheels" },
  { level: 26, xp: 4400, title: "Titã do Asfalto" },
  { level: 27, xp: 4820, title: "Imperador do Comboio" },
  { level: 28, xp: 5260, title: "Paladino de Honra" },
  { level: 29, xp: 5720, title: "Lenda Urbana" },
  { level: 30, xp: 6200, title: "Soberano da Twin Wheels" },
  { level: 31, xp: 6700, title: "General de Asfalto" },
  { level: 32, xp: 7220, title: "Lança de Ébano" },
  { level: 33, xp: 7760, title: "Comandante Lendário" },
  { level: 34, xp: 8320, title: "Fênix do Asfalto" },
  { level: 35, xp: 8900, title: "Lenda Viva" },
  { level: 36, xp: 9500, title: "Arauto da Glória" },
  { level: 37, xp: 10120, title: "Vórtice de Aço" },
  { level: 38, xp: 10760, title: "Guardião dos Céus" },
  { level: 39, xp: 11420, title: "Titã Imortal" },
  { level: 40, xp: 12100, title: "Mito Consagrado" },
  { level: 41, xp: 12800, title: "Vontade Inabalável" },
  { level: 42, xp: 13520, title: "Pilar dos Deuses" },
  { level: 43, xp: 14260, title: "Senhor do Destino" },
  { level: 44, xp: 15020, title: "Lenda Cósmica" },
  { level: 45, xp: 15800, title: "Semideus da Estrada" },
  { level: 46, xp: 16600, title: "Tempestade de Aço" },
  { level: 47, xp: 17420, title: "Presença Imperial" },
  { level: 48, xp: 18260, title: "Eminência Parda" },
  { level: 49, xp: 19120, title: "Primordial da Facção" },
  { level: 50, xp: 20000, title: "Divindade do Asfalto" },
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
    // Acima do nível 50
    const extraLevels = Math.floor((xp - 20000) / 1000);
    const lvl = 50 + extraLevels;
    const startXp = 20000 + extraLevels * 1000;
    const endXp = startXp + 1000;
    const inLvl = xp - startXp;
    return {
      level: lvl,
      title: "Supremacia Eterna",
      currentXp: xp,
      levelStartXp: startXp,
      nextLevelXp: endXp,
      xpNeededForNext: Number((endXp - xp).toFixed(2)),
      xpInCurrentLevel: Number(inLvl.toFixed(2)),
      progressPercent: Math.min(100, Math.round((inLvl / 1000) * 100)),
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
    xpNeededForNext: Number(Math.max(0, nextTier.xp - xp).toFixed(2)),
    xpInCurrentLevel: Number(inLevel.toFixed(2)),
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
  } catch {
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
        category,
        color,
        bg_color,
        border_color,
        shape_3d,
        material_3d,
        border_style_3d,
        gloss_effect
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
 * Busca todas as insígnias concedidas a todos os membros no sistema (para visualizações globais como Hierarquia)
 */
export async function getAllMemberInsignias(): Promise<MemberInsigniaGrant[]> {
  try {
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
          category,
          color,
          bg_color,
          border_color,
          shape_3d,
          material_3d,
          border_style_3d,
          gloss_effect
        ),
        grantor:granted_by (
          nome,
          nickname,
          avatar_url,
          discord_avatar_url
        )
      `)
      .order("granted_at", { ascending: false });

    if (error || !data) {
      console.warn("Falha ao buscar todas as insígnias dos membros:", error);
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
  } catch (err) {
    console.error("Erro ao carregar insígnias globais:", err);
    return [];
  }
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
    p_color: insignia.color || null,
    p_bg_color: insignia.bg_color || null,
    p_border_color: insignia.border_color || null,
    p_shape_3d: insignia.shape_3d || "rosette",
    p_material_3d: insignia.material_3d || "safira_blue",
    p_border_style_3d: insignia.border_style_3d || "metallic_chamfer",
    p_gloss_effect: insignia.gloss_effect || "ultra_glass",
  });

  if (error) {
    // Fallback direto via Supabase se RPC falhar
    const { error: directErr } = await supabase
      .from("insignias" as any)
      .upsert({
        id: insignia.id,
        name: insignia.name,
        icon: insignia.icon || "Award",
        description: insignia.description || "",
        rarity: insignia.rarity || "comum",
        xp_cost: Number(insignia.xp_cost || 0),
        category: insignia.category || "geral",
        active: insignia.active !== false,
        color: insignia.color || null,
        bg_color: insignia.bg_color || null,
        border_color: insignia.border_color || null,
        shape_3d: insignia.shape_3d || "rosette",
        material_3d: insignia.material_3d || "safira_blue",
        border_style_3d: insignia.border_style_3d || "metallic_chamfer",
        gloss_effect: insignia.gloss_effect || "ultra_glass",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (directErr) {
      throw new Error(directErr.message || error.message || "Falha ao salvar insígnia no catálogo.");
    }
  }
}

/**
 * ============================================================================
 * SERVIÇOS EXCLUSIVOS DO PAINEL DEV (XP, NÍVEIS E INSÍGNIAS)
 * ============================================================================
 */

/**
 * Ajusta o XP de um membro manualmente (Modo adicionar/subtrair ou modo fixo)
 */
export async function devManageMemberXp(params: {
  memberId: string;
  mode: "add" | "set";
  amount: number;
  reason: string;
}): Promise<{
  success: boolean;
  member_id: string;
  member_name: string;
  old_xp: number;
  new_xp: number;
  delta: number;
  old_level: number;
  new_level: number;
}> {
  const { data, error } = await supabase.rpc("dev_manage_member_xp_rpc", {
    p_member_id: params.memberId,
    p_mode: params.mode,
    p_amount: Number(Number(params.amount || 0).toFixed(2)),
    p_reason: params.reason,
  });

  if (error) {
    throw new Error(error.message || "Falha ao ajustar XP do membro.");
  }

  return data as any;
}

/**
 * Define o nível gamificado de um membro manualmente, com opção de sincronizar o XP mínimo
 */
export async function devSetMemberLevel(params: {
  memberId: string;
  level: number;
  syncXp: boolean;
  reason: string;
}): Promise<{
  success: boolean;
  member_id: string;
  old_level: number;
  new_level: number;
  old_xp: number;
  new_xp: number;
}> {
  const { data, error } = await supabase.rpc("dev_set_member_level_rpc", {
    p_member_id: params.memberId,
    p_level: Math.round(Number(params.level || 1)),
    p_sync_xp: Boolean(params.syncXp),
    p_reason: params.reason,
  });

  if (error) {
    throw new Error(error.message || "Falha ao definir nível do membro.");
  }

  return data as any;
}

/**
 * Concede uma insígnia diretamente via Dev Bypass (sem consumir XP de ninguém)
 */
export async function devGrantInsignia(params: {
  memberId: string;
  insigniaId: string;
  reason: string;
}): Promise<{
  success: boolean;
  grant_id: string;
  member_name: string;
  insignia_name: string;
}> {
  const { data, error } = await supabase.rpc("dev_grant_insignia_rpc", {
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
 * Revoga uma insígnia de um membro
 */
export async function devRevokeInsignia(params: {
  memberId: string;
  insigniaId: string;
  reason: string;
}): Promise<{
  success: boolean;
  deleted_count: number;
  member_name: string;
  insignia_name: string;
}> {
  const { data, error } = await supabase.rpc("dev_revoke_insignia_rpc", {
    p_member_id: params.memberId,
    p_insignia_id: params.insigniaId,
    p_reason: params.reason,
  });

  if (error) {
    throw new Error(error.message || "Falha ao revogar insígnia.");
  }

  return data as any;
}

/**
 * Edita o motivo/justificativa de uma insígnia já concedida (Dev)
 */
export async function devUpdateMemberInsigniaReason(grantId: string, newReason: string): Promise<void> {
  const { error } = await supabase.rpc("dev_update_insignia_reason_rpc", {
    p_grant_id: grantId,
    p_new_reason: newReason,
  });

  if (error) {
    throw new Error(error.message || "Falha ao editar a justificativa da insígnia.");
  }
}

/**
 * Exclui uma insígnia do catálogo
 */
export async function devDeleteInsignia(insigniaId: string): Promise<void> {
  const { error } = await supabase.rpc("dev_delete_insignia_rpc", {
    p_insignia_id: insigniaId,
  });

  if (error) {
    throw new Error(error.message || "Falha ao excluir insígnia do catálogo.");
  }
}

/**
 * Lista todas as insígnias do catálogo (ativas e inativas) para o painel Dev
 */
export async function devGetAllInsignias(): Promise<InsigniaItem[]> {
  const { data, error } = await supabase
    .from("insignias" as any)
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("Falha ao buscar catálogo completo de insígnias:", error);
    return [];
  }

  return data as InsigniaItem[];
}

/**
 * Lista as regras de pontuação de XP configuradas no sistema
 */
export async function devGetXpRules(): Promise<XpRuleConfig[]> {
  const { data, error } = await supabase
    .from("xp_rules_config" as any)
    .select("*")
    .order("action_type", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as XpRuleConfig[];
}

/**
 * Cria ou atualiza parâmetros de uma regra de XP no sistema
 */
export async function devUpdateXpRule(rule: Partial<XpRuleConfig> & { action_type: string; name: string }): Promise<void> {
  const cleanActionType = (rule.action_type || "").trim();
  const cleanName = (rule.name || "").trim();

  if (!cleanActionType) {
    throw new Error("O identificador do gatilho (action_type) é obrigatório.");
  }
  if (!cleanName) {
    throw new Error("O nome da regra de XP é obrigatório.");
  }

  const rewardVal = Number(Number(rule.xp_reward || 0).toFixed(2));
  if (rewardVal <= 0 || rewardVal >= 1) {
    throw new Error("O valor de ganho de XP deve ser decimal abaixo de 1 (entre 0.01 e 0.99 XP).");
  }

  // Tenta via RPC dev_update_xp_rule_rpc
  try {
    const { error: rpcErr } = await supabase.rpc("dev_update_xp_rule_rpc", {
      p_action_type: cleanActionType,
      p_name: cleanName,
      p_xp_reward: rewardVal,
      p_cooldown_seconds: Number(rule.cooldown_seconds || 0),
      p_daily_cap: Number(rule.daily_cap || 0),
      p_category: rule.category || "geral",
      p_description: rule.description || "",
      p_enabled: rule.enabled !== false,
    });

    if (!rpcErr) {
      return;
    }
  } catch {
    // Continua para o upsert direto
  }

  // Fallback: upsert direto na tabela xp_rules_config (permitido para admin e developer por RLS)
  const { error: directErr } = await supabase
    .from("xp_rules_config" as any)
    .upsert(
      {
        action_type: cleanActionType,
        name: cleanName,
        xp_reward: rewardVal,
        cooldown_seconds: Number(rule.cooldown_seconds || 0),
        daily_cap: Number(rule.daily_cap || 0),
        category: rule.category || "geral",
        description: rule.description || "",
        enabled: rule.enabled !== false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "action_type" }
    );

  if (directErr) {
    throw new Error(directErr.message || "Falha ao salvar regra de XP.");
  }
}

export const devSaveXpRule = devUpdateXpRule;

/**
 * Apaga permanentemente uma regra de XP do sistema
 */
export async function devDeleteXpRule(actionType: string): Promise<void> {
  const cleanActionType = (actionType || "").trim();
  if (!cleanActionType) {
    throw new Error("Gatilho da regra inválido.");
  }

  // Tenta via RPC se existir
  try {
    const { error: rpcErr } = await supabase.rpc("dev_delete_xp_rule_rpc" as any, {
      p_action_type: cleanActionType,
    });
    if (!rpcErr) {
      return;
    }
  } catch {
    // Continua para o delete direto
  }

  // Delete direto na tabela xp_rules_config (permitido por RLS para admin/dev)
  const { error: directErr } = await supabase
    .from("xp_rules_config" as any)
    .delete()
    .eq("action_type", cleanActionType);

  if (directErr) {
    throw new Error(directErr.message || "Falha ao excluir regra de XP.");
  }
}

/**
 * Busca histórico global de transações de XP para auditoria dev
 */
export async function devGetAllXpTransactions(limit = 100, memberId?: string): Promise<
  (XpTransaction & { member_name?: string; member_nickname?: string; avatar_url?: string })[]
> {
  let query = supabase
    .from("xp_transactions" as any)
    .select(`
      id,
      user_id,
      amount,
      xp_before,
      xp_after,
      action_type,
      reference_id,
      category,
      description,
      metadata,
      created_at,
      profiles:user_id (
        nome,
        nickname,
        avatar_url,
        discord_avatar_url
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (memberId) {
    query = query.eq("user_id", memberId);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return (data as any[]).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    amount: Number(row.amount || 0),
    xp_before: Number(row.xp_before || 0),
    xp_after: Number(row.xp_after || 0),
    action_type: row.action_type,
    reference_id: row.reference_id,
    category: row.category,
    description: row.description,
    metadata: row.metadata,
    created_at: row.created_at,
    avatar_url: row.profiles?.avatar_url || row.profiles?.discord_avatar_url,
  }));
}

// ==========================================
// TIPOS E SERVIÇOS DA LOJA E MOEDA TW COINS
// ==========================================

export type ShopItemType = "insignia" | "tag" | "servico" | "recurso" | "veiculo" | "custom" | string;

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "insignias" | "tags" | "servicos" | "vantagens" | "recursos" | "veiculos" | "personalizacao" | string;
  price_coins: number;
  price_xp: number;
  rarity: InsigniaRarity;
  stock: number | null;
  item_type?: ShopItemType;
  insignia_id?: string | null;
  tag_id?: string | null;
  badge_color?: string | null;
  instructions?: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
  insignia?: InsigniaItem;
  tag?: any;
}

export interface ShopPurchase {
  id: string;
  user_id: string;
  item_id: string;
  item_title: string;
  category: string;
  price_coins_paid: number;
  price_xp_paid: number;
  status: string;
  metadata?: any;
  created_at: string;
}

export interface TwCoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  action_type: string;
  description: string;
  metadata?: any;
  created_at: string;
}

export async function getShopItems(includeInactive: boolean = false): Promise<ShopItem[]> {
  let query = supabase
    .from("shop_items" as any)
    .select(`
      *,
      insignia:insignias (
        id,
        name,
        description,
        icon,
        rarity,
        xp_cost,
        color,
        bg_color,
        border_color,
        shape_3d,
        material_3d,
        border_style_3d,
        gloss_effect
      ),
      tag:member_tags (
        id,
        name,
        description,
        color,
        icon,
        is_system,
        is_active
      )
    `)
    .order("display_order", { ascending: true });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao carregar itens da loja:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon || "Gift",
    category: row.category,
    price_coins: Number(row.price_coins || 0),
    price_xp: Number(row.price_xp || 0),
    rarity: (row.rarity || "comum") as InsigniaRarity,
    stock: row.stock !== null ? Number(row.stock) : null,
    item_type: row.item_type || (row.insignia_id ? "insignia" : row.tag_id ? "tag" : "custom"),
    insignia_id: row.insignia_id,
    tag_id: row.tag_id,
    badge_color: row.badge_color,
    instructions: row.instructions,
    active: row.active,
    display_order: Number(row.display_order || 0),
    created_at: row.created_at,
    insignia: row.insignia,
    tag: row.tag,
  }));
}

export async function getMemberCoins(userId: string): Promise<number> {
  if (!userId) return 0;
  const { data, error } = await supabase
    .from("profiles" as any)
    .select("tw_coins")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return 0;
  return Number((data as any).tw_coins || 0);
}

export interface TwCoinsConfig {
  id?: number;
  xp_per_coin: number;
  exchange_fee_percent: number;
  min_xp_exchange: number;
  exchange_enabled: boolean;
  updated_at?: string;
}

export async function getCoinsExchangeConfig(): Promise<TwCoinsConfig> {
  const { data, error } = await supabase.rpc("get_coins_exchange_config_rpc");
  if (error || !data) {
    // Fallback diretamente na tabela
    const { data: tblData } = await supabase
      .from("tw_coins_config" as any)
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (tblData) {
      return {
        id: (tblData as any).id,
        xp_per_coin: Number((tblData as any).xp_per_coin || 1.0),
        exchange_fee_percent: Number((tblData as any).exchange_fee_percent || 0.0),
        min_xp_exchange: Number((tblData as any).min_xp_exchange || 1.0),
        exchange_enabled: (tblData as any).exchange_enabled !== false,
        updated_at: (tblData as any).updated_at,
      };
    }

    return {
      xp_per_coin: 1.0,
      exchange_fee_percent: 0.0,
      min_xp_exchange: 1.0,
      exchange_enabled: true,
      updated_at: new Date().toISOString(),
    };
  }

  return {
    xp_per_coin: Number((data as any).xp_per_coin ?? 1.0),
    exchange_fee_percent: Number((data as any).exchange_fee_percent ?? 0.0),
    min_xp_exchange: Number((data as any).min_xp_exchange ?? 1.0),
    exchange_enabled: (data as any).exchange_enabled !== false,
    updated_at: (data as any).updated_at,
  };
}

export async function devUpdateCoinsConfig(config: {
  xp_per_coin: number;
  exchange_fee_percent: number;
  min_xp_exchange: number;
  exchange_enabled: boolean;
}): Promise<TwCoinsConfig> {
  const { data, error } = await supabase.rpc("dev_update_coins_config_rpc", {
    p_xp_per_coin: Number(config.xp_per_coin),
    p_exchange_fee_percent: Number(config.exchange_fee_percent),
    p_min_xp_exchange: Number(config.min_xp_exchange),
    p_exchange_enabled: Boolean(config.exchange_enabled),
  });

  if (error) {
    throw new Error(error.message || "Erro ao atualizar configuração de câmbio.");
  }

  return data as any;
}

export async function exchangeXpForCoins(xpAmount: number): Promise<{
  success: boolean;
  coins_gained: number;
  gross_coins?: number;
  fee_coins?: number;
  new_xp: number;
  new_coins: number;
  message: string;
}> {
  const { data, error } = await supabase.rpc("exchange_xp_for_coins_rpc", {
    p_xp_amount: Number(xpAmount),
  });

  if (error) {
    throw new Error(error.message || "Erro ao converter XP em TW Coins.");
  }

  return data as any;
}

export async function buyShopItem(itemId: string): Promise<{
  success: boolean;
  purchase_id: string;
  item_title: string;
  price_paid: number;
  new_coins: number;
  has_insignia: boolean;
  message: string;
}> {
  const { data, error } = await supabase.rpc("buy_shop_item_rpc", {
    p_item_id: itemId,
  });

  if (error) {
    throw new Error(error.message || "Erro ao comprar item na loja.");
  }

  return data as any;
}

export async function getMemberShopPurchases(userId: string): Promise<ShopPurchase[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("shop_purchases" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar histórico de compras:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    item_id: row.item_id,
    item_title: row.item_title,
    category: row.category,
    price_coins_paid: Number(row.price_coins_paid || 0),
    price_xp_paid: Number(row.price_xp_paid || 0),
    status: row.status,
    metadata: row.metadata,
    created_at: row.created_at,
  }));
}

export async function getCoinTransactions(userId: string): Promise<TwCoinTransaction[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("tw_coins_transactions" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Erro ao buscar transações de moedas:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    amount: Number(row.amount || 0),
    balance_before: Number(row.balance_before || 0),
    balance_after: Number(row.balance_after || 0),
    action_type: row.action_type,
    description: row.description,
    metadata: row.metadata,
    created_at: row.created_at,
  }));
}

// ==========================================
// FUNÇÕES DEV: GERENCIAMENTO DE LOJA
// ==========================================
export async function createShopItem(payload: {
  title: string;
  description?: string;
  icon?: string;
  category: string;
  price_coins: number;
  price_xp?: number;
  rarity?: InsigniaRarity;
  stock?: number | null;
  item_type?: ShopItemType;
  insignia_id?: string | null;
  tag_id?: string | null;
  badge_color?: string | null;
  instructions?: string | null;
  active?: boolean;
  display_order?: number;
}): Promise<ShopItem> {
  const { data, error } = await supabase
    .from("shop_items" as any)
    .insert({
      title: payload.title,
      description: payload.description || null,
      icon: payload.icon || "Gift",
      category: payload.category || "geral",
      price_coins: Math.max(0, Math.floor(payload.price_coins || 0)),
      price_xp: Math.max(0, Math.floor(payload.price_xp || 0)),
      rarity: payload.rarity || "comum",
      stock: payload.stock !== undefined ? payload.stock : null,
      item_type: payload.item_type || (payload.insignia_id ? "insignia" : payload.tag_id ? "tag" : "custom"),
      insignia_id: payload.insignia_id || null,
      tag_id: payload.tag_id || null,
      badge_color: payload.badge_color || null,
      instructions: payload.instructions || null,
      active: payload.active !== undefined ? payload.active : true,
      display_order: payload.display_order || 0,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Erro ao criar item na loja.");
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    icon: data.icon,
    category: data.category,
    price_coins: Number(data.price_coins || 0),
    price_xp: Number(data.price_xp || 0),
    rarity: data.rarity,
    stock: data.stock !== null ? Number(data.stock) : null,
    item_type: data.item_type,
    insignia_id: data.insignia_id,
    tag_id: data.tag_id,
    badge_color: data.badge_color,
    instructions: data.instructions,
    active: data.active,
    display_order: Number(data.display_order || 0),
    created_at: data.created_at,
  };
}

export async function updateShopItem(
  id: string,
  payload: Partial<{
    title: string;
    description: string | null;
    icon: string;
    category: string;
    price_coins: number;
    price_xp: number;
    rarity: InsigniaRarity;
    stock: number | null;
    item_type: ShopItemType;
    insignia_id: string | null;
    tag_id: string | null;
    badge_color: string | null;
    instructions: string | null;
    active: boolean;
    display_order: number;
  }>
): Promise<void> {
  const updateData: any = { updated_at: new Date().toISOString() };
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.icon !== undefined) updateData.icon = payload.icon;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.price_coins !== undefined) updateData.price_coins = Math.max(0, Math.floor(payload.price_coins));
  if (payload.price_xp !== undefined) updateData.price_xp = Math.max(0, Math.floor(payload.price_xp));
  if (payload.rarity !== undefined) updateData.rarity = payload.rarity;
  if (payload.stock !== undefined) updateData.stock = payload.stock;
  if (payload.item_type !== undefined) updateData.item_type = payload.item_type;
  if (payload.insignia_id !== undefined) updateData.insignia_id = payload.insignia_id;
  if (payload.tag_id !== undefined) updateData.tag_id = payload.tag_id;
  if (payload.badge_color !== undefined) updateData.badge_color = payload.badge_color;
  if (payload.instructions !== undefined) updateData.instructions = payload.instructions;
  if (payload.active !== undefined) updateData.active = payload.active;
  if (payload.display_order !== undefined) updateData.display_order = payload.display_order;

  const { error } = await supabase
    .from("shop_items" as any)
    .update(updateData)
    .eq("id", id);

  if (error) {
    throw new Error(error.message || "Erro ao atualizar item da loja.");
  }
}

export async function deleteShopItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("shop_items" as any)
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message || "Erro ao excluir item da loja.");
  }
}

export async function getAllShopPurchases(): Promise<(ShopPurchase & { buyer_name?: string })[]> {
  const { data, error } = await supabase
    .from("shop_purchases" as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar todos os pedidos da loja:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    item_id: row.item_id,
    item_title: row.item_title,
    category: row.category,
    price_coins_paid: Number(row.price_coins_paid || 0),
    price_xp_paid: Number(row.price_xp_paid || 0),
    status: row.status,
    metadata: row.metadata,
    created_at: row.created_at,
    buyer_name: row.metadata?.buyer_name || undefined,
  }));
}

export async function updateShopPurchaseStatus(purchaseId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("shop_purchases" as any)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", purchaseId);

  if (error) {
    throw new Error(error.message || "Erro ao atualizar status do pedido.");
  }
}

export async function devRefundShopPurchase(
  purchaseId: string,
  reason?: string
): Promise<{ success: boolean; message: string; refunded_coins: number }> {
  const { data, error } = await supabase.rpc("dev_refund_shop_purchase_rpc", {
    p_purchase_id: purchaseId,
    p_reason: reason || "Estorno administrativo solicitado",
  });

  if (error) {
    throw new Error(error.message || "Erro ao estornar compra.");
  }

  return data as any;
}

// ==========================================
// FUNÇÕES DEV: GERENCIAMENTO DE COINS
// ==========================================
export async function devAdjustMemberCoins(
  targetUserId: string,
  amount: number,
  reason: string
): Promise<{
  success: boolean;
  message: string;
  new_coins: number;
}> {
  const { data, error } = await supabase.rpc("dev_adjust_member_coins_rpc", {
    p_target_user_id: targetUserId,
    p_amount: Math.floor(amount),
    p_reason: reason,
  });

  if (error) {
    throw new Error(error.message || "Erro ao ajustar moedas do membro.");
  }

  return data as any;
}

export async function getAllCoinsTransactions(limit = 100): Promise<TwCoinTransaction[]> {
  const { data, error } = await supabase
    .from("tw_coins_transactions" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erro ao carregar transações de moedas:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    amount: Number(row.amount || 0),
    balance_before: Number(row.balance_before || 0),
    balance_after: Number(row.balance_after || 0),
    action_type: row.action_type,
    description: row.description,
    metadata: row.metadata,
    created_at: row.created_at,
  }));
}


