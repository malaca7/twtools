import type { AppLevel } from "@/lib/permissions";

export type NotificationType =
  | "ticket"
  | "chat"
  | "absence"
  | "goal"
  | "movement"
  | "sale"
  | "cash_fund"
  | "stock_alert"
  | "announcement"
  | "role_update"
  | "member_warning"
  | "security_alert"
  | "achievement"
  | "signup"
  | "live"
  | "bot_sync"
  | "patch_notes"
  | "feedback"
  | "system";

export const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  // Operação & Estoque
  "movement",
  "stock_alert",
  "goal",
  "sale",
  "achievement",
  "live",
  // Gestão & Atendimento
  "ticket",
  "chat",
  "absence",
  "signup",
  "feedback",
  // Governança & Segurança
  "announcement",
  "role_update",
  "member_warning",
  "cash_fund",
  "security_alert",
  // Sistema & Infraestrutura
  "system",
  "bot_sync",
  "patch_notes",
];

export type NotificationDomain = "operacao" | "gestao" | "governanca" | "sistema";

export interface NotificationDomainInfo {
  id: NotificationDomain;
  label: string;
  description: string;
  badgeClass: string;
}

export const NOTIFICATION_DOMAINS: NotificationDomainInfo[] = [
  {
    id: "operacao",
    label: "Operação & Estoque",
    description: "Baú, Estoque Crítico, Metas, Vendas, Lives e Conquistas",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "gestao",
    label: "Gestão & Atendimento",
    description: "Tickets, Chat, Licenças, Recrutamento e Ouvidoria",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  {
    id: "governanca",
    label: "Governança & Segurança",
    description: "Comunicados, Promoções, Disciplinar, Finanças e Segurança",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  {
    id: "sistema",
    label: "Sistema & Bot",
    description: "Alertas Gerais, Sincronização do Bot Discord e Notas de Atualização",
    badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  },
];

export type NotificationCategory = "info" | "success" | "warning" | "error" | "alert";

export interface NotificationTypeDeliveryOptions {
  enabled: boolean;
  showToast: boolean;
  showBell: boolean;
  sound: "chime" | "success" | "online" | "urgent" | "click" | "none";
  soundVolume: number;
  severity: NotificationCategory;
  toastDuration: number;
  mirrorDiscord: boolean;
}

export const DEFAULT_TYPE_DELIVERY_OPTIONS: Record<NotificationType, NotificationTypeDeliveryOptions> = {
  movement: { enabled: true, showToast: true, showBell: true, sound: "chime", soundVolume: 70, severity: "warning", toastDuration: 5, mirrorDiscord: false },
  stock_alert: { enabled: true, showToast: true, showBell: true, sound: "urgent", soundVolume: 95, severity: "error", toastDuration: 8, mirrorDiscord: true },
  goal: { enabled: true, showToast: true, showBell: true, sound: "success", soundVolume: 85, severity: "success", toastDuration: 6, mirrorDiscord: true },
  sale: { enabled: true, showToast: true, showBell: true, sound: "success", soundVolume: 85, severity: "success", toastDuration: 6, mirrorDiscord: true },
  achievement: { enabled: true, showToast: true, showBell: true, sound: "success", soundVolume: 90, severity: "success", toastDuration: 7, mirrorDiscord: true },
  live: { enabled: true, showToast: true, showBell: true, sound: "online", soundVolume: 80, severity: "alert", toastDuration: 7, mirrorDiscord: false },
  
  ticket: { enabled: true, showToast: true, showBell: true, sound: "chime", soundVolume: 80, severity: "info", toastDuration: 5, mirrorDiscord: true },
  chat: { enabled: true, showToast: false, showBell: true, sound: "click", soundVolume: 50, severity: "info", toastDuration: 3, mirrorDiscord: false },
  absence: { enabled: true, showToast: true, showBell: true, sound: "chime", soundVolume: 70, severity: "info", toastDuration: 5, mirrorDiscord: true },
  signup: { enabled: true, showToast: true, showBell: true, sound: "online", soundVolume: 75, severity: "info", toastDuration: 5, mirrorDiscord: true },
  feedback: { enabled: true, showToast: true, showBell: true, sound: "chime", soundVolume: 70, severity: "info", toastDuration: 5, mirrorDiscord: true },
  
  announcement: { enabled: true, showToast: true, showBell: true, sound: "urgent", soundVolume: 90, severity: "alert", toastDuration: 10, mirrorDiscord: true },
  role_update: { enabled: true, showToast: true, showBell: true, sound: "success", soundVolume: 90, severity: "success", toastDuration: 8, mirrorDiscord: true },
  member_warning: { enabled: true, showToast: true, showBell: true, sound: "urgent", soundVolume: 90, severity: "error", toastDuration: 8, mirrorDiscord: true },
  cash_fund: { enabled: true, showToast: true, showBell: true, sound: "success", soundVolume: 85, severity: "warning", toastDuration: 6, mirrorDiscord: true },
  security_alert: { enabled: true, showToast: true, showBell: true, sound: "urgent", soundVolume: 100, severity: "error", toastDuration: 12, mirrorDiscord: true },
  
  system: { enabled: true, showToast: true, showBell: true, sound: "chime", soundVolume: 70, severity: "info", toastDuration: 5, mirrorDiscord: false },
  bot_sync: { enabled: true, showToast: false, showBell: true, sound: "none", soundVolume: 50, severity: "info", toastDuration: 4, mirrorDiscord: false },
  patch_notes: { enabled: true, showToast: true, showBell: true, sound: "chime", soundVolume: 70, severity: "info", toastDuration: 8, mirrorDiscord: true },
};

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  user_id: string; // ID específico do usuário destinatário ou "all" para todos
  target_roles?: AppLevel[]; // Cargos autorizados (opcional; se omitido, visível a todos os cargos)
  link?: string; // Rota interna para navegação direta ao clicar (ex.: "/tickets", "/metas")
  metadata?: Record<string, any>;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string | null;
  created_at: string;
  read_by: string[]; // Array de user_ids que marcaram como lida
  deleted_by: string[]; // Array de user_ids que excluíram/dispensaram a notificação
  is_active?: boolean; // Se true (ou undefined), ativa para broadcast; se false, pausada
}

export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  category?: NotificationCategory;
  user_id?: string; // Omissão significa "all"
  target_roles?: AppLevel[];
  link?: string;
  metadata?: Record<string, any>;
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string | null;
  is_active?: boolean;
}

export interface NotificationTypeRules {
  roles: Record<string, NotificationType[]>;
  tags: Record<string, NotificationType[]>;
  typeOptions?: Record<NotificationType, NotificationTypeDeliveryOptions>;
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_NOTIFICATION_RULES: NotificationTypeRules = {
  roles: {
    "01": [...ALL_NOTIFICATION_TYPES],
    "02": [...ALL_NOTIFICATION_TYPES],
    gerente: [
      "movement", "stock_alert", "goal", "sale", "achievement", "live",
      "ticket", "chat", "absence", "signup", "feedback",
      "announcement", "role_update", "member_warning", "cash_fund",
      "system", "bot_sync", "patch_notes"
    ],
    motoqueiro: [
      "movement", "stock_alert", "goal", "sale", "achievement", "live",
      "announcement", "patch_notes", "system"
    ],
    membro: [
      "movement", "stock_alert", "goal", "sale", "achievement", "live",
      "announcement", "patch_notes", "system"
    ],
    novato: [
      "goal", "achievement", "live", "announcement", "patch_notes", "system"
    ],
  },
  tags: {
    tag_dev: [...ALL_NOTIFICATION_TYPES],
    tag_ceo: [...ALL_NOTIFICATION_TYPES],
  },
  typeOptions: { ...DEFAULT_TYPE_DELIVERY_OPTIONS },
  updated_at: new Date().toISOString(),
};

export interface NotificationTypeInfo {
  label: string;
  iconName: string;
  domain: NotificationDomain;
  badgeBg: string;
  badgeColor: string;
  borderColor: string;
  description: string;
}

export function getNotificationTypeInfo(type: NotificationType | string): NotificationTypeInfo {
  switch (type) {
    case "ticket":
      return {
        label: "Ticket",
        iconName: "LifeBuoy",
        domain: "gestao",
        badgeBg: "bg-indigo-500/10",
        badgeColor: "text-indigo-400",
        borderColor: "border-indigo-500/30",
        description: "Chamados e atendimentos internos da facção",
      };
    case "chat":
      return {
        label: "Chat",
        iconName: "MessageSquare",
        domain: "gestao",
        badgeBg: "bg-cyan-500/10",
        badgeColor: "text-cyan-400",
        borderColor: "border-cyan-500/30",
        description: "Mensagens diretas e canais de bate-papo",
      };
    case "absence":
      return {
        label: "Licença",
        iconName: "Calendar",
        domain: "gestao",
        badgeBg: "bg-purple-500/10",
        badgeColor: "text-purple-400",
        borderColor: "border-purple-500/30",
        description: "Solicitações e aprovações de ausência e férias",
      };
    case "goal":
      return {
        label: "Metas",
        iconName: "Target",
        domain: "operacao",
        badgeBg: "bg-emerald-500/10",
        badgeColor: "text-emerald-400",
        borderColor: "border-emerald-500/30",
        description: "Metas de arrecadação, pontuação e tarefas semanais",
      };
    case "movement":
      return {
        label: "Baú",
        iconName: "Package",
        domain: "operacao",
        badgeBg: "bg-amber-500/10",
        badgeColor: "text-amber-400",
        borderColor: "border-amber-500/30",
        description: "Depósitos e retiradas no estoque e baú da facção",
      };
    case "sale":
      return {
        label: "Vendas",
        iconName: "TrendingUp",
        domain: "operacao",
        badgeBg: "bg-teal-500/10",
        badgeColor: "text-teal-400",
        borderColor: "border-teal-500/30",
        description: "Vendas realizadas e comissões geradas no balcão",
      };
    case "cash_fund":
      return {
        label: "Finanças",
        iconName: "Coins",
        domain: "governanca",
        badgeBg: "bg-yellow-500/10",
        badgeColor: "text-yellow-400",
        borderColor: "border-yellow-500/30",
        description: "Movimentações de caixa, tesouraria e retiradas financeiras",
      };
    case "stock_alert":
      return {
        label: "Estoque Crítico",
        iconName: "AlertTriangle",
        domain: "operacao",
        badgeBg: "bg-orange-500/10",
        badgeColor: "text-orange-400",
        borderColor: "border-orange-500/30",
        description: "Alertas de itens com estoque baixo ou zerado no baú",
      };
    case "announcement":
      return {
        label: "Comunicados",
        iconName: "Megaphone",
        domain: "governanca",
        badgeBg: "bg-rose-500/10",
        badgeColor: "text-rose-400",
        borderColor: "border-rose-500/30",
        description: "Comunicados oficiais, diretrizes e avisos da liderança",
      };
    case "role_update":
      return {
        label: "Promoções",
        iconName: "Award",
        domain: "governanca",
        badgeBg: "bg-violet-500/10",
        badgeColor: "text-violet-400",
        borderColor: "border-violet-500/30",
        description: "Promoções, rebaixamentos e alterações de hierarquia",
      };
    case "member_warning":
      return {
        label: "Disciplinar",
        iconName: "ShieldAlert",
        domain: "governanca",
        badgeBg: "bg-red-500/10",
        badgeColor: "text-red-400",
        borderColor: "border-red-500/30",
        description: "Advertências, penalidades e ocorrências disciplinares",
      };
    case "security_alert":
      return {
        label: "Segurança",
        iconName: "Lock",
        domain: "governanca",
        badgeBg: "bg-rose-600/15",
        badgeColor: "text-rose-400 font-bold",
        borderColor: "border-rose-600/40",
        description: "Alertas críticos de tentativas suspeitas e acessos não autorizados",
      };
    case "achievement":
      return {
        label: "Conquistas",
        iconName: "Trophy",
        domain: "operacao",
        badgeBg: "bg-amber-400/15",
        badgeColor: "text-amber-300 font-bold",
        borderColor: "border-amber-400/40",
        description: "Metas batidas, recordes alcançados e medalhas da facção",
      };
    case "signup":
      return {
        label: "Recrutamento",
        iconName: "UserPlus",
        domain: "gestao",
        badgeBg: "bg-blue-500/10",
        badgeColor: "text-blue-400",
        borderColor: "border-blue-500/30",
        description: "Novas inscrições, entrevistas e admissões de integrantes",
      };
    case "live":
      return {
        label: "Ao Vivo",
        iconName: "Radio",
        domain: "operacao",
        badgeBg: "bg-rose-500/15",
        badgeColor: "text-rose-400 font-extrabold",
        borderColor: "border-rose-500/40",
        description: "Transmissões e lives de streamers do grupo",
      };
    case "bot_sync":
      return {
        label: "Bot Sync",
        iconName: "Bot",
        domain: "sistema",
        badgeBg: "bg-cyan-600/10",
        badgeColor: "text-cyan-400",
        borderColor: "border-cyan-600/30",
        description: "Sincronização de cargos, comandos e status do Bot Discord",
      };
    case "patch_notes":
      return {
        label: "Patch Notes",
        iconName: "Sparkles",
        domain: "sistema",
        badgeBg: "bg-fuchsia-500/10",
        badgeColor: "text-fuchsia-400",
        borderColor: "border-fuchsia-500/30",
        description: "Novidades, melhorias e notas de versão do sistema Twin Wheels",
      };
    case "feedback":
      return {
        label: "Ouvidoria",
        iconName: "HelpCircle",
        domain: "gestao",
        badgeBg: "bg-emerald-500/10",
        badgeColor: "text-emerald-400",
        borderColor: "border-emerald-500/30",
        description: "Sugestões de melhoria e ouvidoria dos integrantes",
      };
    case "system":
    default:
      return {
        label: "Sistema",
        iconName: "Bell",
        domain: "sistema",
        badgeBg: "bg-slate-500/10",
        badgeColor: "text-slate-400",
        borderColor: "border-slate-500/30",
        description: "Alertas gerais de infraestrutura e plataforma",
      };
  }
}

export function getCategoryBadge(category: NotificationCategory) {
  switch (category) {
    case "success":
      return {
        label: "Sucesso",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        dotColor: "bg-emerald-400",
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
      };
    case "warning":
      return {
        label: "Atenção",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        dotColor: "bg-amber-400",
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
      };
    case "error":
      return {
        label: "Urgente",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        dotColor: "bg-rose-400",
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/30",
      };
    case "alert":
      return {
        label: "Alerta",
        color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        dotColor: "bg-orange-400",
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/30",
      };
    case "info":
    default:
      return {
        label: "Info",
        color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        dotColor: "bg-sky-400",
        bg: "bg-sky-500/10",
        text: "text-sky-400",
        border: "border-sky-500/30",
      };
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 5) return "Agora mesmo";
    if (diffSeconds < 60) return `Há ${diffSeconds}s`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Há ${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays}d`;

    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}
