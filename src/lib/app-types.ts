import type { AppLevel } from "@/lib/permissions";

export type AppUser = {
  id: string;
  email: string | null;
};

export type Profile = {
  id: string;
  user_id: string;
  nome: string;
  nickname: string | null;
  avatar_url: string | null;
  status: string;
  data_entrada: string;
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

export type Product = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string | null;
  unidade: string;
  estoque_atual: number;
  estoque_minimo: number;
  preco_sugerido: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type Movement = {
  id: string;
  product_id: string;
  user_id: string;
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

export type Member = {
  user_id: string;
  nome: string;
  nickname: string | null;
  status: string;
  data_entrada: string;
  nivel: AppLevel | null;
  created_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
};

export type PendingSignupRequest = {
  id: string;
  user_id: string;
  nome: string;
  nickname: string | null;
  telefone: string;
  email: string | null;
  requested_at: string;
  status: SignupRequestStatus;
};

export type LoginPlayer = {
  user_id: string;
  nome: string;
  nickname: string | null;
  login_email: string | null;
};