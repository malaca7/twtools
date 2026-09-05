import type { AppLevel } from "@/lib/permissions";

export type TicketCategory =
  | "duvidas"
  | "reembolso"
  | "denuncia"
  | "promocao"
  | "operacional"
  | "outros";

export type TicketPriority = "baixa" | "media" | "alta" | "urgente";

export type TicketStatus =
  | "aberto"
  | "em_atendimento"
  | "aguardando"
  | "resolvido"
  | "fechado";

export interface TicketAttachment {
  id: string;
  name: string;
  url: string; // Base64 data URL or external URL
  size?: number;
  type?: string;
  created_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_nickname?: string | null;
  sender_role: AppLevel;
  sender_avatar?: string | null;
  content: string;
  is_internal_note: boolean;
  attachments?: TicketAttachment[];
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: number; // e.g. 1, 2, 3 -> formatted as #001, #002...
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  user_id: string;
  creator_name: string;
  creator_nickname?: string | null;
  creator_role: AppLevel;
  creator_avatar?: string | null;
  assigned_to_id?: string | null;
  assigned_to_name?: string | null;
  assigned_to_nickname?: string | null;
  assigned_to_role?: AppLevel | null;
  assigned_to_avatar?: string | null;
  attachments?: TicketAttachment[];
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  closed_by_id?: string | null;
  closed_by_name?: string | null;
  closed_reason?: string | null;
}

export interface CreateTicketPayload {
  category: TicketCategory;
  subject: string;
  description: string;
  priority: TicketPriority;
  attachments?: TicketAttachment[];
}

export interface AddTicketMessagePayload {
  content: string;
  is_internal_note?: boolean;
  attachments?: TicketAttachment[];
}

export interface TransferTicketPayload {
  new_assigned_to_id: string;
  new_assigned_to_name: string;
  new_assigned_to_nickname?: string | null;
  new_assigned_to_role?: AppLevel | null;
  new_assigned_to_avatar?: string | null;
  note?: string;
}

export interface CloseTicketPayload {
  reason?: string;
}

export const TICKET_CATEGORIES: {
  id: TicketCategory;
  label: string;
  iconName: string;
  emoji: string;
  description: string;
  badgeClass: string;
}[] = [
  {
    id: "duvidas",
    label: "Dúvidas Gerais",
    iconName: "HelpCircle",
    emoji: "❓",
    description: "Perguntas e esclarecimentos sobre regras, procedimentos e facção.",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  {
    id: "reembolso",
    label: "Reembolso",
    iconName: "DollarSign",
    emoji: "💰",
    description: "Solicitações de ressarcimento de custos, armamentos ou itens operacionais.",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "denuncia",
    label: "Denúncia Interna",
    iconName: "AlertTriangle",
    emoji: "⚠️",
    description: "Denúncias confidenciais sobre conduta, quebra de regras ou infrações.",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  {
    id: "promocao",
    label: "Solicitação de Promoção",
    iconName: "TrendingUp",
    emoji: "📈",
    description: "Pedidos de avaliação para ascensão hierárquica e reconhecimento.",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  {
    id: "operacional",
    label: "Problema Operacional",
    iconName: "Wrench",
    emoji: "🛠️",
    description: "Falhas em baús, rotas, veículos, cargas ou desvios de operação.",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  },
  {
    id: "outros",
    label: "Outros",
    iconName: "FileText",
    emoji: "📋",
    description: "Outros assuntos que não se encaixam nas categorias acima.",
    badgeClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  },
];

export const TICKET_PRIORITIES: {
  id: TicketPriority;
  label: string;
  badgeClass: string;
  dotClass: string;
}[] = [
  {
    id: "baixa",
    label: "Baixa",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    dotClass: "bg-slate-400",
  },
  {
    id: "media",
    label: "Média",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    dotClass: "bg-blue-400",
  },
  {
    id: "alta",
    label: "Alta",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    dotClass: "bg-orange-400",
  },
  {
    id: "urgente",
    label: "Urgente",
    badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/40 font-semibold animate-pulse",
    dotClass: "bg-rose-500",
  },
];

export const TICKET_STATUSES: {
  id: TicketStatus;
  label: string;
  badgeClass: string;
  order: number;
}[] = [
  {
    id: "aberto",
    label: "Aberto",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    order: 1,
  },
  {
    id: "em_atendimento",
    label: "Em Atendimento",
    badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    order: 2,
  },
  {
    id: "aguardando",
    label: "Aguardando",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    order: 3,
  },
  {
    id: "resolvido",
    label: "Resolvido",
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    order: 4,
  },
  {
    id: "fechado",
    label: "Fechado",
    badgeClass: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    order: 5,
  },
];

export function formatTicketNumber(num: number): string {
  return `#${num.toString().padStart(3, "0")}`;
}

export function getCategoryInfo(category: TicketCategory) {
  return TICKET_CATEGORIES.find((c) => c.id === category) || TICKET_CATEGORIES[5];
}

export function getPriorityInfo(priority: TicketPriority) {
  return TICKET_PRIORITIES.find((p) => p.id === priority) || TICKET_PRIORITIES[1];
}

export function getStatusInfo(status: TicketStatus) {
  return TICKET_STATUSES.find((s) => s.id === status) || TICKET_STATUSES[0];
}
