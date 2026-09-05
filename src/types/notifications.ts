import type { AppLevel } from "@/lib/permissions";

export type NotificationType =
  | "ticket"
  | "chat"
  | "absence"
  | "goal"
  | "movement"
  | "sale"
  | "system"
  | "announcement"
  | "signup";

export type NotificationCategory = "info" | "success" | "warning" | "error" | "alert";

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
}

export interface NotificationTypeInfo {
  label: string;
  iconName: string;
  badgeBg: string;
  badgeColor: string;
  borderColor: string;
}

export function getNotificationTypeInfo(type: NotificationType): NotificationTypeInfo {
  switch (type) {
    case "ticket":
      return {
        label: "Ticket",
        iconName: "LifeBuoy",
        badgeBg: "bg-indigo-500/10",
        badgeColor: "text-indigo-400",
        borderColor: "border-indigo-500/30",
      };
    case "chat":
      return {
        label: "Chat",
        iconName: "MessageSquare",
        badgeBg: "bg-cyan-500/10",
        badgeColor: "text-cyan-400",
        borderColor: "border-cyan-500/30",
      };
    case "absence":
      return {
        label: "Licença",
        iconName: "Calendar",
        badgeBg: "bg-purple-500/10",
        badgeColor: "text-purple-400",
        borderColor: "border-purple-500/30",
      };
    case "goal":
      return {
        label: "Meta",
        iconName: "Target",
        badgeBg: "bg-emerald-500/10",
        badgeColor: "text-emerald-400",
        borderColor: "border-emerald-500/30",
      };
    case "movement":
      return {
        label: "Baú",
        iconName: "Package",
        badgeBg: "bg-amber-500/10",
        badgeColor: "text-amber-400",
        borderColor: "border-amber-500/30",
      };
    case "sale":
      return {
        label: "Venda",
        iconName: "TrendingUp",
        badgeBg: "bg-emerald-500/10",
        badgeColor: "text-emerald-400",
        borderColor: "border-emerald-500/30",
      };
    case "announcement":
      return {
        label: "Comunicado",
        iconName: "Megaphone",
        badgeBg: "bg-rose-500/10",
        badgeColor: "text-rose-400",
        borderColor: "border-rose-500/30",
      };
    case "signup":
      return {
        label: "Cadastro",
        iconName: "UserPlus",
        badgeBg: "bg-blue-500/10",
        badgeColor: "text-blue-400",
        borderColor: "border-blue-500/30",
      };
    case "system":
    default:
      return {
        label: "Sistema",
        iconName: "Bell",
        badgeBg: "bg-slate-500/10",
        badgeColor: "text-slate-400",
        borderColor: "border-slate-500/30",
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
      };
    case "warning":
      return {
        label: "Atenção",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        dotColor: "bg-amber-400",
      };
    case "error":
      return {
        label: "Urgente",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
        dotColor: "bg-rose-400",
      };
    case "alert":
      return {
        label: "Alerta",
        color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        dotColor: "bg-orange-400",
      };
    case "info":
    default:
      return {
        label: "Info",
        color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        dotColor: "bg-sky-400",
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
