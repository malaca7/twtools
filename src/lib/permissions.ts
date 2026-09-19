export type AppLevel = "desenvolvedor" | "01" | "02" | "gerente" | "motoqueiro" | "membro" | "novato";

export const LEVELS: AppLevel[] = ["01", "02", "gerente", "motoqueiro", "membro", "novato"];
export const ALL_LEVELS: AppLevel[] = LEVELS;

export const LEVEL_LABEL: Record<AppLevel, string> = {
  desenvolvedor: "Desenvolvedor",
  "01": "01",
  "02": "02",
  gerente: "Gerente",
  motoqueiro: "Motoqueiro",
  membro: "Membro",
  novato: "Novato",
};

export function getLevelLabel(level: string | null | undefined): string {
  if (!level) return "Membro";
  return LEVEL_LABEL[level as AppLevel] || level;
}

export const LEVEL_DESCRIPTION: Record<AppLevel, string> = {
  desenvolvedor: "Acesso total de desenvolvimento e administração de sistema",
  "01": "Acesso administrativo completo",
  "02": "Administra operações e membros",
  gerente: "Operações, estoque, vendas e métricas",
  motoqueiro: "Operações próprias e métricas próprias",
  membro: "Acesso operacional e dados próprios",
  novato: "Acesso limitado de leitura",
};

export const LEVEL_RANK: Record<AppLevel, number> = {
  desenvolvedor: 7,
  "01": 6,
  "02": 5,
  gerente: 4,
  motoqueiro: 3,
  membro: 2,
  novato: 1,
};

export type Permission =
  | "manage_permissions"
  | "view_dashboard"
  | "view_cash_fund"
  | "manage_cash_fund"
  | "reverse_cash_fund"
  | "delete_cash_movement"
  | "view_stock"
  | "view_movements"
  | "create_movement"
  | "reverse_movement"
  | "delete_movement"
  | "view_baus"
  | "manage_baus"
  | "view_all_movements"
  | "view_sales"
  | "create_sale"
  | "reverse_sale"
  | "delete_sale"
  | "view_products"
  | "manage_products"
  | "view_categories"
  | "manage_categories"
  | "view_members"
  | "view_sensitive_data"
  | "approve_requests"
  | "change_roles"
  | "promote_members"
  | "edit_members"
  | "delete_members"
  | "view_consolidated_financials"
  | "manage_roles"
  | "manage_announcements"
  | "view_rankings"
  | "view_performance"
  | "manage_performance"
  | "inspect_member_performance"
  | "view_goals"
  | "manage_goals"
  | "view_hierarchy"
  | "manage_hierarchy"
  | "view_audit"
  | "manage_platform_settings"
  | "manage_menu_settings"
  | "view_profile"
  | "view_chat"
  | "create_chat_group"
  | "manage_chat_groups"
  | "view_absences"
  | "request_absence"
  | "manage_absences"
  | "view_all_absences"
  | "view_patch_notes"
  | "manage_patch_notes"
  | "trigger_force_cache_purge"
  | "view_tickets"
  | "create_ticket"
  | "manage_tickets"
  | "view_all_tickets"
  | "view_notifications"
  | "send_notifications"
  | "manage_notifications"
  | "configure_notifications_sound"
  // Permissões da Central de Notificações CEO
  | "view_ceo_notifications"
  | "create_ceo_notification"
  | "edit_ceo_notification"
  | "delete_ceo_notification"
  | "toggle_ceo_notification_active"
  // Permissões de Ajustes de Estoque CEO (/ceo/ajustes-estoque)
  | "view_ceo_stock_adjustments"
  | "manage_ceo_stock_adjustments"
  | "ceo_adjust_stock_balance"
  | "ceo_stock_add"
  | "ceo_stock_remove"
  // Permissões da Central de Notificações Dev
  | "view_dev_notifications"
  | "manage_dev_notification_rules"
  | "create_dev_notification"
  | "edit_dev_notification"
  | "delete_dev_notification"
  | "simulate_dev_notification"
  | "toggle_dev_notification_active"
  | "purge_dev_notifications"
  | "inspect_dev_notification_payload"
  | "export_dev_notifications"
  | "manage_dev_notification_sounds"
  | "broadcast_dev_emergency_alert"
  | "view_lives"
  | "manage_lives"
  | "link_stream_account"
  | "manage_stream_accounts"
  | "force_end_live_session"
  | "simulate_live_stream"
  | "configure_stream_api"
  | "view_stream_logs"
  // Permissões do Painel Desenvolvedor (/dev)
  | "view_dev_hub"
  | "manage_dev_bot"
  | "manage_dev_patch_notes"
  | "manage_dev_performance"
  | "manage_dev_permissions"
  | "manage_dev_config"
  | "manage_dev_menu"
  // Permissões do Painel Executivo CEO & Gerenciamento de Bot
  | "view_ceo"
  | "manage_ceo_bot"
  | "bot_send_message"
  | "bot_add_app"
  | "bot_change_status"
  | "bot_change_name"
  | "bot_change_avatar"
  | "bot_change_banner"
  | "bot_change_presence"
  | "bot_restart"
  | "bot_power_toggle"
  | "bot_invite"
  | "bot_manage_roles"
  | "bot_manage_token"
  | "bot_view_intents"
  | "bot_change_intents"
  | "bot_manage_discloud_config"
  | "manage_ceo_webhooks"
  | "webhook_send_message"
  | "webhook_test"
  | "webhook_create"
  | "webhook_edit"
  | "webhook_delete"
  | "webhook_toggle_active"
  | "webhook_copy_url"
  | "webhook_view_code"
  | "webhook_save_config"
  | "view_ceo_financials"
  // Legacy aliases for backward compatibility
  | "view_financials"
  | "manage_members"
  | "view_all_sales"
  | "view_movement_balances"
  | "view_movement_baus"
  | "estoque.visualizar"
  | "estoque.ajustar"
  | "estoque.adicionar"
  | "estoque.remover"
  | "estoque.corrigir"
  | "estoque.configurar"
  | "estoque.auditoria"
  // Permissões da Página de Gestão de Estoque
  | "view_stock_management"
  | "manage_stock_products"
  | "manage_stock_categories"
  | "manage_stock_baus"
  | "adjust_stock_balance"
  | "manage_stock_balance";

export const ALL_PERMISSIONS: Permission[] = [
  "manage_permissions",
  "view_dashboard",
  "view_stock_management",
  "manage_stock_products",
  "manage_stock_categories",
  "manage_stock_baus",
  "adjust_stock_balance",
  "manage_stock_balance",
  "view_chat",
  "create_chat_group",
  "manage_chat_groups",
  "view_absences",
  "request_absence",
  "manage_absences",
  "view_all_absences",
  "view_cash_fund",
  "manage_cash_fund",
  "reverse_cash_fund",
  "delete_cash_movement",
  "view_stock",
  "view_movements",
  "create_movement",
  "reverse_movement",
  "delete_movement",
  "view_movement_balances",
  "view_movement_baus",
  "view_baus",
  "manage_baus",
  "view_all_movements",
  "view_sales",
  "create_sale",
  "reverse_sale",
  "delete_sale",
  "view_products",
  "manage_products",
  "view_categories",
  "manage_categories",
  "view_members",
  "view_sensitive_data",
  "approve_requests",
  "change_roles",
  "promote_members",
  "edit_members",
  "delete_members",
  "view_consolidated_financials",
  "manage_roles",
  "manage_announcements",
  "view_rankings",
  "view_performance",
  "manage_performance",
  "inspect_member_performance",
  "view_goals",
  "manage_goals",
  "view_hierarchy",
  "manage_hierarchy",
  "view_audit",
  "manage_platform_settings",
  "manage_menu_settings",
  "trigger_force_cache_purge",
  "view_patch_notes",
  "manage_patch_notes",
  "view_tickets",
  "create_ticket",
  "manage_tickets",
  "view_all_tickets",
  "view_notifications",
  "send_notifications",
  "manage_notifications",
  "configure_notifications_sound",
  // Permissões da Central de Notificações CEO
  "view_ceo_notifications",
  "create_ceo_notification",
  "edit_ceo_notification",
  "delete_ceo_notification",
  "toggle_ceo_notification_active",
  // Permissões de Ajustes de Estoque CEO
  "view_ceo_stock_adjustments",
  "manage_ceo_stock_adjustments",
  "ceo_adjust_stock_balance",
  "ceo_stock_add",
  "ceo_stock_remove",
  // Permissões da Central de Notificações Dev
  "view_dev_notifications",
  "manage_dev_notification_rules",
  "create_dev_notification",
  "edit_dev_notification",
  "delete_dev_notification",
  "simulate_dev_notification",
  "toggle_dev_notification_active",
  "purge_dev_notifications",
  "inspect_dev_notification_payload",
  "export_dev_notifications",
  "manage_dev_notification_sounds",
  "broadcast_dev_emergency_alert",
  "view_lives",
  "manage_lives",
  "link_stream_account",
  "manage_stream_accounts",
  "force_end_live_session",
  "simulate_live_stream",
  "configure_stream_api",
  "view_stream_logs",
  "view_profile",
  // Dev Panel Permissions
  "view_dev_hub",
  "manage_dev_bot",
  "manage_dev_patch_notes",
  "manage_dev_performance",
  "manage_dev_permissions",
  "manage_dev_config",
  "manage_dev_menu",
  // CEO Panel Permissions
  "view_ceo",
  "manage_ceo_bot",
  "bot_send_message",
  "bot_add_app",
  "bot_change_status",
  "bot_change_name",
  "bot_change_avatar",
  "bot_change_banner",
  "bot_change_presence",
  "bot_restart",
  "bot_power_toggle",
  "bot_invite",
  "bot_manage_roles",
  "bot_manage_token",
  "bot_view_intents",
  "bot_change_intents",
  "bot_manage_discloud_config",
  "manage_ceo_webhooks",
  "webhook_send_message",
  "webhook_test",
  "webhook_create",
  "webhook_edit",
  "webhook_delete",
  "webhook_toggle_active",
  "webhook_copy_url",
  "webhook_view_code",
  "webhook_save_config",
  "view_ceo_financials",
  "estoque.visualizar",
  "estoque.ajustar",
  "estoque.adicionar",
  "estoque.remover",
  "estoque.corrigir",
  "estoque.configurar",
  "estoque.auditoria",
];

export const DEV_PANEL_PERMISSIONS: Permission[] = [
  "view_dev_hub",
  "manage_dev_bot",
  "manage_dev_patch_notes",
  "manage_dev_performance",
  "manage_dev_permissions",
  "manage_dev_config",
  "manage_dev_menu",
  "view_dev_notifications",
  "manage_dev_notification_rules",
  "create_dev_notification",
  "edit_dev_notification",
  "delete_dev_notification",
  "simulate_dev_notification",
  "estoque.configurar",
  "estoque.auditoria",
  "estoque.ajustar",
  "estoque.adicionar",
  "estoque.remover",
  "estoque.corrigir",
];

export const CEO_PERMISSIONS: Permission[] = [
  "view_ceo",
  "manage_ceo_bot",
  "view_ceo_notifications",
  "create_ceo_notification",
  "edit_ceo_notification",
  "delete_ceo_notification",
  "toggle_ceo_notification_active",
  "bot_send_message",
  "bot_add_app",
  "bot_change_status",
  "bot_change_name",
  "bot_change_avatar",
  "bot_change_banner",
  "bot_change_presence",
  "bot_restart",
  "bot_power_toggle",
  "bot_invite",
  "bot_manage_roles",
  "bot_manage_token",
  "bot_view_intents",
  "bot_change_intents",
  "bot_manage_discloud_config",
  "manage_ceo_webhooks",
  "webhook_send_message",
  "webhook_test",
  "webhook_create",
  "webhook_edit",
  "webhook_delete",
  "webhook_toggle_active",
  "webhook_copy_url",
  "webhook_view_code",
  "webhook_save_config",
  "view_ceo_financials",
  "view_ceo_stock_adjustments",
  "manage_ceo_stock_adjustments",
  "ceo_adjust_stock_balance",
  "ceo_stock_add",
  "ceo_stock_remove",
];

const ADMIN: Permission[] = ALL_PERMISSIONS.filter(
  (p) => !CEO_PERMISSIONS.includes(p) && !DEV_PANEL_PERMISSIONS.includes(p)
);

const OFFICER: Permission[] = [
  "view_dashboard",
  "view_chat",
  "create_chat_group",
  "manage_chat_groups",
  "view_absences",
  "request_absence",
  "manage_absences",
  "view_all_absences",
  "view_cash_fund",
  "manage_cash_fund",
  "view_stock",
  "create_movement",
  "reverse_movement",
  "view_baus",
  "manage_baus",
  "view_all_movements",
  "view_sales",
  "create_sale",
  "reverse_sale",
  "view_products",
  "manage_products",
  "view_categories",
  "manage_categories",
  "view_stock_management",
  "manage_stock_products",
  "manage_stock_categories",
  "manage_stock_baus",
  "adjust_stock_balance",
  "manage_stock_balance",
  "view_members",
  "approve_requests",
  "change_roles",
  "promote_members",
  "edit_members",
  "manage_announcements",
  "view_rankings",
  "view_performance",
  "manage_performance",
  "inspect_member_performance",
  "view_goals",
  "manage_goals",
  "view_hierarchy",
  "manage_hierarchy",
  "view_audit",
  "estoque.visualizar",
  "estoque.auditoria",
  "manage_platform_settings",
  "manage_menu_settings",
  "trigger_force_cache_purge",
  "view_patch_notes",
  "manage_patch_notes",
  "view_tickets",
  "create_ticket",
  "manage_tickets",
  "view_all_tickets",
  "view_notifications",
  "send_notifications",
  "manage_notifications",
  "configure_notifications_sound",
  "view_lives",
  "manage_lives",
  "link_stream_account",
  "manage_stream_accounts",
  "force_end_live_session",
  "view_stream_logs",
  "view_profile",
];

const MANAGER: Permission[] = [
  "view_dashboard",
  "view_chat",
  "create_chat_group",
  "manage_chat_groups",
  "view_absences",
  "request_absence",
  "manage_absences",
  "view_all_absences",
  "view_cash_fund",
  "manage_cash_fund",
  "view_stock",
  "create_movement",
  "reverse_movement",
  "view_baus",
  "manage_baus",
  "view_all_movements",
  "view_sales",
  "create_sale",
  "reverse_sale",
  "view_products",
  "manage_products",
  "view_categories",
  "manage_categories",
  "view_stock_management",
  "manage_stock_products",
  "manage_stock_categories",
  "adjust_stock_balance",
  "view_members",
  "approve_requests",
  "change_roles",
  "promote_members",
  "edit_members",
  "manage_announcements",
  "view_rankings",
  "view_performance",
  "manage_performance",
  "inspect_member_performance",
  "view_goals",
  "manage_goals",
  "view_hierarchy",
  "manage_hierarchy",
  "view_audit",
  "estoque.visualizar",
  "estoque.auditoria",
  "manage_platform_settings",
  "manage_menu_settings",
  "view_patch_notes",
  "view_tickets",
  "create_ticket",
  "manage_tickets",
  "view_all_tickets",
  "view_notifications",
  "send_notifications",
  "manage_notifications",
  "configure_notifications_sound",
  "view_lives",
  "manage_lives",
  "link_stream_account",
  "force_end_live_session",
  "view_stream_logs",
  "view_profile",
];

const MEMBER: Permission[] = [
  "view_dashboard",
  "view_chat",
  "create_chat_group",
  "view_absences",
  "request_absence",
  "view_stock",
  "create_movement",
  "view_baus",
  "view_sales",
  "create_sale",
  "view_products",
  "view_categories",
  "view_members",
  "view_rankings",
  "view_performance",
  "view_goals",
  "view_hierarchy",
  "view_patch_notes",
  "view_tickets",
  "create_ticket",
  "view_notifications",
  "configure_notifications_sound",
  "view_lives",
  "link_stream_account",
  "view_profile",
];

const NOVATO: Permission[] = [
  "view_dashboard",
  "view_chat",
  "view_absences",
  "request_absence",
  "view_stock",
  "view_baus",
  "view_sales",
  "view_products",
  "view_categories",
  "view_members",
  "view_rankings",
  "view_performance",
  "view_goals",
  "view_hierarchy",
  "view_patch_notes",
  "view_tickets",
  "create_ticket",
  "view_notifications",
  "view_lives",
  "link_stream_account",
  "view_profile",
];

export const PERMISSIONS: Record<AppLevel, Permission[]> = {
  desenvolvedor: ALL_PERMISSIONS,
  "01": ADMIN,
  "02": OFFICER,
  gerente: MANAGER,
  motoqueiro: MEMBER,
  membro: MEMBER,
  novato: NOVATO,
};

export function can(
  userLevel: AppLevel | null | undefined,
  permission: Permission,
  customRoleMap?: Record<string, Permission[]>
): boolean {
  if (!userLevel) return false;
  if (userLevel === "desenvolvedor") return true;

  // Custom role override check (se permissões customizadas foram salvas no banco para este cargo)
  if (customRoleMap && customRoleMap[userLevel]) {
    const list = customRoleMap[userLevel];
    if (list.includes(permission)) return true;

    // Herança e equivalências do sistema de tickets
    if (list.includes("manage_tickets")) {
      if (
        permission === "view_all_tickets" ||
        permission === "view_tickets" ||
        permission === "create_ticket"
      ) {
        return true;
      }
    }
    if (list.includes("view_all_tickets") && permission === "view_tickets") {
      return true;
    }

    // Fallback gracioso: se o cargo foi salvo no banco antes do módulo de tickets existir (aplica-se SOMENTE a tickets)
    const hasAnySavedTicketPerm = list.some((p) => typeof p === "string" && p.includes("ticket"));
    if (!hasAnySavedTicketPerm && permission.includes("ticket")) {
      const defaultRolePerms = PERMISSIONS[userLevel] || [];
      if (defaultRolePerms.includes(permission)) return true;
    }

    // Equivalências e herança do sistema de lives
    if (list.includes("manage_lives")) {
      if (
        permission === "view_lives" ||
        permission === "link_stream_account" ||
        permission === "manage_stream_accounts" ||
        permission === "force_end_live_session" ||
        permission === "simulate_live_stream" ||
        permission === "view_stream_logs"
      ) {
        return true;
      }
    }
    if (list.includes("configure_stream_api") && permission === "view_lives") return true;

    // Fallback gracioso: se o cargo foi salvo no banco antes do módulo de lives existir
    const hasAnySavedLivePerm = list.some((p) => typeof p === "string" && (p.includes("live") || p.includes("stream")));
    if (!hasAnySavedLivePerm && (permission.includes("live") || permission.includes("stream"))) {
      const defaultRolePerms = PERMISSIONS[userLevel] || [];
      if (defaultRolePerms.includes(permission)) return true;
    }

    // Equivalências de bot
    if (permission === "bot_add_app" && list.includes("bot_invite")) return true;
    if (permission === "bot_invite" && list.includes("bot_add_app")) return true;

    // Sub-ações legítimas: Ações de gestão/modificação implicam acesso de visualização ao respectivo módulo
    if (permission === "view_stock" && (list.includes("manage_products") || list.includes("manage_categories") || list.includes("manage_baus"))) return true;
    if (permission === "view_products" && list.includes("manage_products")) return true;
    if (permission === "view_categories" && list.includes("manage_categories")) return true;
    if (permission === "view_baus" && list.includes("manage_baus")) return true;
    if (permission === "view_movements" && (list.includes("create_movement") || list.includes("reverse_movement") || list.includes("delete_movement"))) return true;
    if (permission === "view_sales" && (list.includes("create_sale") || list.includes("reverse_sale") || list.includes("delete_sale"))) return true;
    if (permission === "view_cash_fund" && (list.includes("manage_cash_fund") || list.includes("reverse_cash_fund") || list.includes("delete_cash_movement"))) return true;
    if (permission === "view_absences" && (list.includes("request_absence") || list.includes("manage_absences") || list.includes("view_all_absences"))) return true;
    if (permission === "view_all_absences" && list.includes("manage_absences")) return true;
    if (permission === "view_goals" && list.includes("manage_goals")) return true;
    if (permission === "view_hierarchy" && (list.includes("manage_hierarchy") || list.includes("manage_roles"))) return true;
    if (permission === "view_members" && (list.includes("edit_members") || list.includes("delete_members") || list.includes("promote_members") || list.includes("change_roles") || list.includes("approve_requests"))) return true;
    if (permission === "view_chat" && (list.includes("create_chat_group") || list.includes("manage_chat_groups"))) return true;
    if (permission === "view_consolidated_financials" && list.includes("view_financials")) return true;
    if (permission === "approve_requests" && list.includes("manage_members")) return true;

    // Gestão de Estoque
    if (permission === "view_stock_management" && (list.includes("manage_stock_products") || list.includes("manage_stock_categories") || list.includes("manage_stock_baus") || list.includes("adjust_stock_balance") || list.includes("manage_stock_balance") || list.includes("manage_products") || list.includes("manage_categories") || list.includes("manage_baus") || list.includes("view_stock"))) return true;
    if (permission === "manage_stock_products" && list.includes("manage_products")) return true;
    if (permission === "manage_stock_categories" && list.includes("manage_categories")) return true;
    if (permission === "manage_stock_baus" && list.includes("manage_baus")) return true;
    if (permission === "adjust_stock_balance" && (list.includes("estoque.ajustar") || list.includes("estoque.corrigir"))) return true;
    if (permission === "manage_stock_balance" && list.includes("estoque.corrigir")) return true;

    // Ajustes de Estoque CEO
    if (permission === "view_ceo_stock_adjustments" && (list.includes("manage_ceo_stock_adjustments") || list.includes("ceo_adjust_stock_balance") || list.includes("ceo_stock_add") || list.includes("ceo_stock_remove"))) return true;
    if (list.includes("manage_ceo_stock_adjustments") && (permission === "ceo_adjust_stock_balance" || permission === "ceo_stock_add" || permission === "ceo_stock_remove" || permission === "view_ceo_stock_adjustments")) return true;

    return false;
  }

  const rolePerms = PERMISSIONS[userLevel] || [];
  if (rolePerms.includes(permission)) return true;

  // Herança e equivalências padrão de tickets
  if (rolePerms.includes("manage_tickets")) {
    if (
      permission === "view_all_tickets" ||
      permission === "view_tickets" ||
      permission === "create_ticket"
    ) {
      return true;
    }
  }
  if (rolePerms.includes("view_all_tickets") && permission === "view_tickets") {
    return true;
  }

  // Herança e equivalências padrão de lives
  if (rolePerms.includes("manage_lives")) {
    if (
      permission === "view_lives" ||
      permission === "link_stream_account" ||
      permission === "manage_stream_accounts" ||
      permission === "force_end_live_session" ||
      permission === "simulate_live_stream" ||
      permission === "view_stream_logs"
    ) {
      return true;
    }
  }
  if (rolePerms.includes("configure_stream_api") && permission === "view_lives") return true;

  // Herança e equivalências de notificações
  if (rolePerms.includes("manage_notifications") && permission === "view_notifications") return true;
  if (rolePerms.includes("send_notifications") && permission === "view_notifications") return true;
  if (rolePerms.includes("view_dev_notifications") && permission === "view_notifications") return true;
  if (rolePerms.includes("view_ceo_notifications") && permission === "view_notifications") return true;
  if (rolePerms.includes("manage_dev_notification_rules") && permission === "view_dev_notifications") return true;
  if (rolePerms.includes("create_ceo_notification") && permission === "view_ceo_notifications") return true;
  if (rolePerms.includes("edit_ceo_notification") && permission === "view_ceo_notifications") return true;
  if (rolePerms.includes("create_dev_notification") && permission === "view_dev_notifications") return true;
  if (rolePerms.includes("edit_dev_notification") && permission === "view_dev_notifications") return true;
  if (rolePerms.includes("delete_dev_notification") && permission === "view_dev_notifications") return true;
  if (rolePerms.includes("simulate_dev_notification") && permission === "view_dev_notifications") return true;
  if (rolePerms.includes("toggle_dev_notification_active") && permission === "view_dev_notifications") return true;
  if (rolePerms.includes("purge_dev_notifications") && permission === "view_dev_notifications") return true;
  if (rolePerms.includes("inspect_dev_notification_payload") && permission === "view_dev_notifications") return true;
  if (rolePerms.includes("export_dev_notifications") && permission === "view_dev_notifications") return true;
  if (rolePerms.includes("manage_dev_notification_sounds") && permission === "view_dev_notifications") return true;
  if (rolePerms.includes("broadcast_dev_emergency_alert") && permission === "view_dev_notifications") return true;

  // Fallback alias checks
  if (permission === "bot_add_app" && rolePerms.includes("bot_invite")) return true;
  if (permission === "bot_invite" && rolePerms.includes("bot_add_app")) return true;
  if (permission === "view_stock" && (rolePerms.includes("manage_products") || rolePerms.includes("manage_categories") || rolePerms.includes("manage_baus"))) return true;
  if (permission === "view_products" && rolePerms.includes("manage_products")) return true;
  if (permission === "view_categories" && rolePerms.includes("manage_categories")) return true;
  if (permission === "view_baus" && rolePerms.includes("manage_baus")) return true;
  if (permission === "view_movements" && (rolePerms.includes("create_movement") || rolePerms.includes("reverse_movement") || rolePerms.includes("delete_movement"))) return true;
  if (permission === "view_sales" && (rolePerms.includes("create_sale") || rolePerms.includes("reverse_sale") || rolePerms.includes("delete_sale"))) return true;
  if (permission === "estoque.visualizar" && (rolePerms.includes("estoque.ajustar") || rolePerms.includes("estoque.adicionar") || rolePerms.includes("estoque.remover") || rolePerms.includes("estoque.corrigir") || rolePerms.includes("estoque.configurar") || rolePerms.includes("estoque.auditoria"))) return true;
  if (permission === "view_cash_fund" && (rolePerms.includes("manage_cash_fund") || rolePerms.includes("reverse_cash_fund") || rolePerms.includes("delete_cash_movement"))) return true;
  if (permission === "view_absences" && (rolePerms.includes("request_absence") || rolePerms.includes("manage_absences") || rolePerms.includes("view_all_absences"))) return true;
  if (permission === "view_all_absences" && rolePerms.includes("manage_absences")) return true;
  if (permission === "view_goals" && rolePerms.includes("manage_goals")) return true;
  if (permission === "view_hierarchy" && (rolePerms.includes("manage_hierarchy") || rolePerms.includes("manage_roles"))) return true;
  if (permission === "view_members" && (rolePerms.includes("edit_members") || rolePerms.includes("delete_members") || rolePerms.includes("promote_members") || rolePerms.includes("change_roles") || rolePerms.includes("approve_requests"))) return true;
  if (permission === "view_chat" && (rolePerms.includes("create_chat_group") || rolePerms.includes("manage_chat_groups"))) return true;
  if (permission === "view_consolidated_financials" && rolePerms.includes("view_financials")) return true;
  if (permission === "approve_requests" && rolePerms.includes("manage_members")) return true;

  // Gestão de Estoque
  if (permission === "view_stock_management" && (rolePerms.includes("manage_stock_products") || rolePerms.includes("manage_stock_categories") || rolePerms.includes("manage_stock_baus") || rolePerms.includes("adjust_stock_balance") || rolePerms.includes("manage_stock_balance") || rolePerms.includes("manage_products") || rolePerms.includes("manage_categories") || rolePerms.includes("manage_baus") || rolePerms.includes("view_stock"))) return true;
  if (permission === "manage_stock_products" && rolePerms.includes("manage_products")) return true;
  if (permission === "manage_stock_categories" && rolePerms.includes("manage_categories")) return true;
  if (permission === "manage_stock_baus" && rolePerms.includes("manage_baus")) return true;
  if (permission === "adjust_stock_balance" && (rolePerms.includes("estoque.ajustar") || rolePerms.includes("estoque.corrigir"))) return true;
  if (permission === "manage_stock_balance" && rolePerms.includes("estoque.corrigir")) return true;

  // Ajustes de Estoque CEO
  if (permission === "view_ceo_stock_adjustments" && (rolePerms.includes("manage_ceo_stock_adjustments") || rolePerms.includes("ceo_adjust_stock_balance") || rolePerms.includes("ceo_stock_add") || rolePerms.includes("ceo_stock_remove"))) return true;
  if (rolePerms.includes("manage_ceo_stock_adjustments") && (permission === "ceo_adjust_stock_balance" || permission === "ceo_stock_add" || permission === "ceo_stock_remove" || permission === "view_ceo_stock_adjustments")) return true;

  return false;
}

export function canPromote(
  actorLevel?: AppLevel | null,
  targetLevel?: AppLevel,
  desiredLevel?: AppLevel,
  isDeveloperActor?: boolean
): boolean {
  return true;
}

export function levelBadgeClass(level: AppLevel | null | undefined): string {
  switch (level) {
    case "desenvolvedor":
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    case "01":
      return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    case "02":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
    case "gerente":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "motoqueiro":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "membro":
      return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    case "novato":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}
