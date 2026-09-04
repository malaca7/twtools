export type UserThemeSettings = {
  themeStyle: string;
  cardStyle: string;
  fontFamily: string;
  customPrimaryColor?: string | null;
  borderRadius?: string;
  bgPattern?: string;
  uiDensity?: string;
  glowEffectsEnabled: boolean;
  glowIntensity?: string;
  statusPulseEnabled: boolean;
  pageTransitionsEnabled: boolean;
  hoverZoomEnabled: boolean;
  borderGlowSpeed: string;
  brightness: number;
  contrast: number;
  saturation?: number;
};

export const DEFAULT_USER_THEME: UserThemeSettings = {
  themeStyle: "cyberpunk",
  cardStyle: "glassmorphism",
  fontFamily: "space_grotesk",
  customPrimaryColor: null,
  borderRadius: "smooth",
  bgPattern: "cyber_grid",
  uiDensity: "normal",
  glowEffectsEnabled: true,
  glowIntensity: "medium",
  statusPulseEnabled: true,
  pageTransitionsEnabled: true,
  hoverZoomEnabled: true,
  borderGlowSpeed: "normal",
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

export type AppUser = {
  id: string;
  email: string | null;
};

export type Profile = {
  id: string;
  user_id: string;
  nome: string;
  nickname: string | null;
  telefone?: string | null;
  game_id?: string | null;
  avatar_url: string | null;
  status: string;
  data_entrada: string;
  discord_id?: string | null;
  discord_username?: string | null;
  discord_avatar_url?: string | null;
  discord_email?: string | null;
  is_developer?: boolean;
  custom_theme?: UserThemeSettings | null;
};

export type SignupRequestStatus = "pendente" | "aprovado" | "rejeitado";

export type AuthState = {
  user: AppUser | null;
  profile: Profile | null;
  level: AppLevel | null;
  signupRequestStatus: SignupRequestStatus | null;
  approvedAccess: boolean;
};

export type Category = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
};

export type Bau = {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  ativo: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string | null;
  bau_id: string | null;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
  preco_sugerido: number;
  imagem_url?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type Movement = {
  id: string;
  product_id: string;
  user_id: string;
  bau_id?: string | null;
  type: "entrada" | "saida";
  quantity: number;
  previous_balance: number;
  resulting_balance: number;
  reason: string | null;
  sale_id: string | null;
  reversal_of: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  product_id: string;
  seller_id: string;
  buyer_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_method: string;
  notes: string | null;
  status: "concluida" | "estornada";
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  type: "vendas" | "faturamento" | "quantidade";
  target_value: number;
  period_start: string;
  period_end: string;
  descricao: string | null;
  created_at: string;
};

export type UserPresenceStatus = "online" | "ausente" | "ocupado" | "offline";

export type UserPresence = {
  user_id: string;
  status: UserPresenceStatus;
  last_seen: string;
  online_since?: string | null;
  total_seconds_online?: number | null;
  updated_at: string;
};

export type Member = {
  user_id: string;
  nome: string;
  nickname: string | null;
  telefone?: string | null;
  game_id?: string | null;
  status: string;
  data_entrada: string;
  nivel: AppLevel | null;
  presence_status?: UserPresenceStatus;
  last_seen?: string | null;
  presence_updated_at?: string | null;
  updated_at?: string | null;
  online_since?: string | null;
  total_seconds_online?: number;
  total_hours_online?: number;
  created_at: string;
  discord_id?: string | null;
  discord_username?: string | null;
  discord_avatar_url?: string | null;
  discord_email?: string | null;
  is_developer?: boolean;
  custom_theme?: UserThemeSettings | null;
};

export type Announcement = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  priority: "normal" | "importante" | "urgente";
  created_at: string;
  updated_at: string;
};

export type AnnouncementRead = {
  announcement_id: string;
  user_id: string;
  read_at: string;
};

export type AuditLogSeverity = "info" | "warning" | "critical";

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
  /** Populated from new_data._meta at read time */
  severity?: AuditLogSeverity;
  user_agent?: string;
  ip_address?: string;
};

export type PendingSignupRequest = {
  id: string;
  user_id: string;
  nome: string;
  nickname: string | null;
  telefone: string;
  game_id?: string | null;
  email: string | null;
  requested_at: string;
  status: SignupRequestStatus;
  discord_id?: string | null;
  discord_username?: string | null;
  discord_avatar_url?: string | null;
  discord_email?: string | null;
};

export type LoginPlayer = {
  user_id: string;
  nome: string;
  nickname: string | null;
  login_email: string | null;
};

export type RolePermissionRecord = {
  level: AppLevel;
  permissions: Permission[];
};

export type CashMovement = {
  id: string;
  user_id: string | null;
  type: "entrada" | "saida";
  amount: number;
  motive: string;
  notes: string | null;
  status?: string | null | undefined;
  previous_balance: number;
  resulting_balance: number;
  reversal_of: string | null;
  created_at: string;
  user_name?: string | undefined;
  user_avatar_url?: string | null | undefined;
};

export type ModuleAccessLevel = "none" | "view" | "manage";

export type SystemModule =
  | "dashboard"
  | "fundo_caixa"
  | "produtos"
  | "categorias"
  | "baus"
  | "movimentacoes"
  | "vendas"
  | "membros"
  | "desempenho"
  | "auditoria"
  | "gestao_cargos";

export type CustomRole = {
  id: string;
  nome: string;
  descricao: string | null;
  rank: number;
  is_system: boolean;
  module_permissions: Partial<Record<SystemModule, ModuleAccessLevel>>;
  created_at: string;
  updated_at: string;
};

export type AbsenceReason =
  | "ferias"
  | "viagem"
  | "trabalho_estudos"
  | "saude"
  | "motivo_pessoal"
  | "problemas_tecnicos"
  | "outro";

export type AbsenceStatus =
  | "pendente"
  | "aprovado"
  | "rejeitado"
  | "em_andamento"
  | "concluida"
  | "cancelada";

export type MemberAbsence = {
  id: string;
  user_id: string;
  member_name: string;
  member_nickname?: string | null;
  member_role?: string | null;
  member_avatar?: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  days_count: number;
  reason: AbsenceReason;
  reason_details?: string | null;
  status: AbsenceStatus;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type CreateAbsencePayload = {
  start_date: string;
  end_date: string;
  reason: AbsenceReason;
  reason_details?: string | null;
};

export type WeeklyGoalType = "financeiro" | "quantidade" | "vendas" | "geral";
export type GoalTargetScope = "todos" | "cargo" | "membro";

export type WeeklyGoal = {
  id: string;
  title: string;
  description?: string | null;
  type: WeeklyGoalType;
  target_value: number;
  unit_name?: string | null;
  target_scope: GoalTargetScope;
  target_role?: AppLevel | null;
  target_user_id?: string | null;
  target_user_name?: string | null;
  period_start: string; // YYYY-MM-DD
  period_end: string; // YYYY-MM-DD
  is_active: boolean;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at?: string | null;
};

export type GoalSubmissionStatus = "pendente" | "aprovado" | "rejeitado" | "cancelado";

export type GoalSubmission = {
  id: string;
  goal_id: string;
  goal_title: string;
  user_id: string;
  member_name: string;
  member_nickname?: string | null;
  member_role?: string | null;
  member_avatar?: string | null;
  receiver_id: string;
  receiver_name: string;
  receiver_role?: string | null;
  receiver_avatar?: string | null;
  amount: number;
  unit_name?: string | null;
  proof_url?: string | null;
  notes?: string | null;
  delivered_at: string;
  status: GoalSubmissionStatus;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type CreateWeeklyGoalPayload = {
  title: string;
  description?: string;
  type: WeeklyGoalType;
  target_value: number;
  unit_name?: string;
  target_scope: GoalTargetScope;
  target_role?: AppLevel;
  target_user_id?: string;
  target_user_name?: string;
  period_start: string;
  period_end: string;
  is_active?: boolean;
};

export type SubmitGoalPayload = {
  goal_id: string;
  receiver_id: string;
  amount: number;
  proof_url?: string;
  notes?: string;
  delivered_at?: string;
};
