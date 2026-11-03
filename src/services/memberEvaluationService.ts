import { supabase } from "@/integrations/supabase/client";

export interface EvaluatableMember {
  user_id: string;
  nome: string;
  nickname?: string | null;
  avatar_url?: string | null;
  game_id?: string | number | null;
  stars_rating?: number | null;
}

/**
 * Avalia um membro com 1 a 5 estrelas na auditoria de desempenho
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
