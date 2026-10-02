export type WarningType = "advertencia" | "suspensao";

export type WarningSeverity = "leve" | "media" | "grave" | "critica";

export type SuspensionType = "temporaria" | "permanente";

export type WarningStatus = "ativo" | "expirado" | "revogado";

export type SuspensionFunctionalBlocks = {
  block_all_operations?: boolean; // Bloqueio total das operações
  block_login?: boolean;          // Bloqueio completo de acesso à plataforma
  block_sales?: boolean;          // Bloqueio de criação e consulta de vendas
  block_movements?: boolean;      // Bloqueio de movimentações e retiradas de baú
  block_productions?: boolean;    // Bloqueio de produções e transferências de armazém
  block_cash_fund?: boolean;      // Bloqueio de lançamentos no fundo de caixa
};

export interface MemberWarning {
  id: string;
  member_id: string;
  member_name: string;
  member_nickname?: string | null;
  member_avatar?: string | null;
  member_game_id?: string | null;
  member_level?: string | null;

  admin_id: string;
  admin_name: string;
  admin_nickname?: string | null;
  admin_avatar?: string | null;

  type: WarningType;
  severity: WarningSeverity;
  reason: string;
  description: string;

  // Vigência & Duração
  starts_at: string;
  duration_days?: number | null;
  duration_hours?: number | null;
  ends_at?: string | null; // null = permanente ou advertência simples sem data de expiração

  // Suspensão
  is_suspension: boolean;
  suspension_type?: SuspensionType | null;
  blocks?: SuspensionFunctionalBlocks;

  // Status & Resolução
  status: WarningStatus;
  acknowledged_at?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
  revoked_by_name?: string | null;
  revocation_reason?: string | null;

  // Integração com Tag
  applied_tag_id?: string | null;

  created_at: string;
  updated_at: string;
}

export type CreateWarningPayload = Omit<
  MemberWarning,
  "id" | "created_at" | "updated_at" | "status"
> & {
  status?: WarningStatus;
};

export type UpdateWarningPayload = Partial<
  Omit<MemberWarning, "id" | "created_at" | "member_id">
>;

export const WARNING_REASON_PRESETS = [
  "Descumprimento das Regras Internas da Facção",
  "Desrespeito à Hierarquia ou Insensibilidade com Membros",
  "Ausência Injustificada em Ações / Reuniões Obrigatórias",
  "Uso Indevido de Itens / Movimentação Irregular de Baú",
  "Não Prestação de Contas ou Desvio de Fundo de Caixa",
  "Conduta Antijogo / Violação das Diretrizes do Servidor RP",
  "Comportamento Tóxico ou Motim Interno",
  "Vazamento de Informações Confidenciais",
  "Desempenho Crítico Abaixo da Meta Mínima",
  "Outro Motivo Disciplinar (Especificar na Descrição)",
] as const;
