export type AppLevel = "desenvolvedor" | "01" | "02" | "gerente" | "motoqueiro" | "membro" | "novato" | (string & {});

import { getDevThemeColorSync, getMemberThemeColorSync } from "@/services/devService";
import { getPanelColorStyle } from "@/lib/panelTheme";

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
  | "approve_requests"
  | "change_roles"
  // Permissões do Sistema de Matérias-Primas
  | "raw_materials.view"
  | "raw_materials.create"
  | "raw_materials.edit"
  | "raw_materials.delete"
  | "raw_materials.adjust"
  | "raw_materials.transfer_bau"
  | "raw_materials.history"
  // Permissões do Sistema de Produção, Armazém e Vendas
  | "productions.view"
  | "productions.create"
  | "productions.edit"
  | "productions.delete"
  | "view_productions"
  | "create_production"
  | "warehouse.view"
  | "warehouse.transfer"
  | "warehouse.transfer_storage"
  | "warehouse.transfer_sale"
  | "warehouse.adjust"
  | "warehouse.history"
  | "view_warehouse"
  | "production_management.view"
  | "production_management.products"
  | "production_management.raw_materials"
  | "production_management.productions"
  | "production_management.settings"
  | "production_management.reports"
  | "view_production_management"
  | "sales.view"
  | "sales.create"
  | "sales.edit"
  | "sales.cancel"
  | "sales.history"
  // Permissões do Sistema de Escala de Ação
  | "escalas.view"
  | "escalas.details"
  | "escalas.create"
  | "escalas.edit"
  | "escalas.delete"
  | "escalas.publish"
  | "escalas.cancel"
  | "escalas.manage_members"
  | "escalas.add_participants"
  | "escalas.remove_participants"
  | "escalas.confirm_presence"
  | "escalas.manage_slots"
  | "escalas.substitute"
  | "escalas.history"
  | "escalas.settings"
  | "promote_members"
  | "edit_members"
  | "delete_members"
  | "view_consolidated_financials"
  | "view_rankings"
  // Permissões Detalhadas de Ranking, Insígnias e XP
  | "view_rankings_xp"
  | "view_rankings_financial"
  | "view_rankings_movements"
  | "view_insignias"
  | "grant_insignia"
  | "manage_insignias_catalog"
  | "view_shop"
  | "buy_shop_items"
  | "manage_shop"
  | "evaluate_member"
  | "manage_xp_rules"
  | "adjust_member_xp"
  | "view_member_xp"
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
  | "edit_profile_data"
  | "edit_profile_banner"
  | "edit_profile_bio"
  | "edit_profile_custom_url"
  | "edit_profile_appearance"
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
  // Permissões do Sistema de Tags de Membros (CEO & DEV)
  | "view_ceo_tag_permissions"
  | "manage_ceo_tag_permissions"
  | "create_ceo_tag"
  | "edit_ceo_tag"
  | "delete_ceo_tag"
  | "manage_ceo_tag_permissions_detail"
  | "manage_ceo_tag_rules"
  | "assign_ceo_tag"
  | "view_dev_tags"
  | "manage_dev_tags"
  // Permissões de Integração de Tags com o Discord
  | "tags.discord_config"
  | "tags.discord_create_role"
  | "tags.discord_edit_position"
  | "tags.discord_link"
  | "tags.discord_sync_members"
  | "tags_discord_config"
  | "tags_discord_create_role"
  | "tags_discord_edit_position"
  | "tags_discord_link"
  | "tags_discord_sync_members"
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
  | "manage_dev_gamification"
  // Permissões Detalhadas de Gestão da Loja Dev (/dev/gestaoloja)
  | "view_dev_shop"
  | "create_dev_shop_item"
  | "edit_dev_shop_item"
  | "delete_dev_shop_item"
  | "manage_dev_shop_prices"
  | "manage_dev_shop_stock"
  | "manage_dev_shop_orders"
  | "deliver_dev_shop_order"
  | "refund_dev_shop_order"
  // Permissões Detalhadas de Gestão de TW Coins Dev (/dev/coins)
  | "view_dev_coins"
  | "grant_dev_coins"
  | "deduct_dev_coins"
  | "view_dev_coins_transactions"
  | "manage_dev_coins_rates"
  | "manage_dev_coins_batch"
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
  | "manage_stock_balance"
  // Permissões do Sistema Life (Rede Social)
  | "view_life"
  | "life_view_following"
  | "life_view_bookmarks"
  | "post_life"
  | "life_post_image"
  | "life_post_video"
  | "life_mention_members"
  | "life_use_hashtags"
  | "life_like_posts"
  | "life_bookmark_posts"
  | "life_comment_posts"
  | "life_delete_own_comment"
  | "life_delete_own_post"
  | "life_follow_members"
  | "life_pin_posts"
  | "life_moderate_posts"
  | "manage_life"
  // Permissões do Sistema de Advertências e Suspensões
  | "view_warnings"
  | "view_all_warnings"
  | "create_warning"
  | "create_suspension"
  | "edit_warning"
  | "revoke_warning"
  | "delete_warning"
  | "view_warning_details"
  | "export_warnings"
  | "manage_warnings"
  | "view_ceo_warnings"
  | "manage_ceo_warnings"
  | "view_dev_warnings"
  | "manage_dev_warnings"
  // Permissões do Sistema de Selo de Verificação
  | "verification.view_page"
  | "verification.request"
  | "verification.cancel_own"
  | "verification.manage"
  | "verification.review"
  | "verification.grant_direct"
  | "verification.revoke"
  | "verification.config"
  | "verification.audit";

export const ALL_PERMISSIONS: Permission[] = [
  // Permissões de Selos de Verificação
  "verification.view_page",
  "verification.request",
  "verification.cancel_own",
  "verification.manage",
  "verification.review",
  "verification.grant_direct",
  "verification.revoke",
  "verification.config",
  "verification.audit",
  // Permissões de Matérias-Primas
  "raw_materials.view",
  "raw_materials.create",
  "raw_materials.edit",
  "raw_materials.delete",
  "raw_materials.adjust",
  "raw_materials.transfer_bau",
  "raw_materials.history",
  // Permissões de Produções e Armazém
  "productions.view",
  "productions.create",
  "productions.edit",
  "productions.delete",
  "view_productions",
  "create_production",
  "warehouse.view",
  "warehouse.transfer",
  "warehouse.transfer_storage",
  "warehouse.transfer_sale",
  "warehouse.adjust",
  "warehouse.history",
  "view_warehouse",
  "production_management.view",
  "production_management.products",
  "production_management.raw_materials",
  "production_management.productions",
  "production_management.settings",
  "production_management.reports",
  "view_production_management",
  "sales.view",
  "sales.create",
  "sales.edit",
  "sales.cancel",
  "sales.history",
  // Permissões de Escala de Ação
  "escalas.view",
  "escalas.details",
  "escalas.create",
  "escalas.edit",
  "escalas.delete",
  "escalas.publish",
  "escalas.cancel",
  "escalas.manage_members",
  "escalas.add_participants",
  "escalas.remove_participants",
  "escalas.confirm_presence",
  "escalas.manage_slots",
  "escalas.substitute",
  "escalas.history",
  "escalas.settings",
  "view_stock_management",
  "life_view_following",
  "life_view_bookmarks",
  "post_life",
  "life_post_image",
  "life_post_video",
  "life_mention_members",
  "life_use_hashtags",
  "life_like_posts",
  "life_bookmark_posts",
  "life_comment_posts",
  "life_delete_own_comment",
  "life_delete_own_post",
  "life_follow_members",
  "life_pin_posts",
  "life_moderate_posts",
  "life_moderate_comments",
  "manage_life",
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
  "view_rankings_xp",
  "view_rankings_financial",
  "view_rankings_movements",
  "view_insignias",
  "grant_insignia",
  "manage_insignias_catalog",
  "view_shop",
  "buy_shop_items",
  "manage_shop",
  "evaluate_member",
  "manage_xp_rules",
  "adjust_member_xp",
  "view_member_xp",
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
  // Permissões de Advertências CEO
  "view_ceo_warnings",
  "manage_ceo_warnings",
  // Permissões de Ajustes de Estoque CEO
  "view_ceo_stock_adjustments",
  "manage_ceo_stock_adjustments",
  "ceo_adjust_stock_balance",
  "ceo_stock_add",
  "ceo_stock_remove",
  // Permissões de Tags de Membros
  "view_ceo_tag_permissions",
  "manage_ceo_tag_permissions",
  "create_ceo_tag",
  "edit_ceo_tag",
  "delete_ceo_tag",
  "manage_ceo_tag_permissions_detail",
  "manage_ceo_tag_rules",
  "assign_ceo_tag",
  "view_dev_tags",
  "manage_dev_tags",
  // Permissões de Advertências Dev
  "view_dev_warnings",
  "manage_dev_warnings",
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
  "edit_profile_data",
  "edit_profile_banner",
  "edit_profile_bio",
  "edit_profile_custom_url",
  "edit_profile_appearance",
  // Dev Panel Permissions
  "view_dev_hub",
  "manage_dev_bot",
  "manage_dev_patch_notes",
  "manage_dev_performance",
  "manage_dev_permissions",
  "manage_dev_config",
  "manage_dev_menu",
  "manage_dev_gamification",
  "view_dev_shop",
  "create_dev_shop_item",
  "edit_dev_shop_item",
  "delete_dev_shop_item",
  "manage_dev_shop_prices",
  "manage_dev_shop_stock",
  "manage_dev_shop_orders",
  "deliver_dev_shop_order",
  "refund_dev_shop_order",
  "view_dev_coins",
  "grant_dev_coins",
  "deduct_dev_coins",
  "view_dev_coins_transactions",
  "manage_dev_coins_rates",
  "manage_dev_coins_batch",
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
  // Permissões de Advertências e Suspensões
  "view_warnings",
  "view_all_warnings",
  "create_warning",
  "create_suspension",
  "edit_warning",
  "revoke_warning",
  "delete_warning",
  "view_warning_details",
  "export_warnings",
  "manage_warnings",
];

export const DEV_PANEL_PERMISSIONS: Permission[] = [
  "view_dev_hub",
  "manage_dev_bot",
  "manage_dev_patch_notes",
  "manage_dev_performance",
  "manage_dev_permissions",
  "manage_dev_config",
  "manage_dev_menu",
  "manage_dev_gamification",
  "view_dev_shop",
  "create_dev_shop_item",
  "edit_dev_shop_item",
  "delete_dev_shop_item",
  "manage_dev_shop_prices",
  "manage_dev_shop_stock",
  "manage_dev_shop_orders",
  "deliver_dev_shop_order",
  "refund_dev_shop_order",
  "view_dev_coins",
  "grant_dev_coins",
  "deduct_dev_coins",
  "view_dev_coins_transactions",
  "manage_dev_coins_rates",
  "manage_dev_coins_batch",
  "view_dev_notifications",
  "manage_dev_notification_rules",
  "create_dev_notification",
  "edit_dev_notification",
  "delete_dev_notification",
  "simulate_dev_notification",
  "view_dev_tags",
  "manage_dev_tags",
  "view_dev_warnings",
  "manage_dev_warnings",
  "view_ceo_tag_permissions",
  "manage_ceo_tag_permissions",
  "create_ceo_tag",
  "edit_ceo_tag",
  "delete_ceo_tag",
  "manage_ceo_tag_permissions_detail",
  "manage_ceo_tag_rules",
  "assign_ceo_tag",
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
  "view_ceo_warnings",
  "manage_ceo_warnings",
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
  "view_ceo_tag_permissions",
  "manage_ceo_tag_permissions",
  "create_ceo_tag",
  "edit_ceo_tag",
  "delete_ceo_tag",
  "manage_ceo_tag_permissions_detail",
  "manage_ceo_tag_rules",
  "assign_ceo_tag",
  "view_life",
  "life_view_following",
  "life_view_bookmarks",
  "post_life",
  "life_post_image",
  "life_post_video",
  "life_mention_members",
  "life_use_hashtags",
  "life_like_posts",
  "life_bookmark_posts",
  "life_comment_posts",
  "life_delete_own_comment",
  "life_delete_own_post",
  "life_follow_members",
  "life_pin_posts",
  "life_moderate_posts",
  "life_moderate_comments",
  "manage_life",
  // Permissões de Advertências e Suspensões no CEO
  "view_warnings",
  "create_warning",
  "create_suspension",
  "edit_warning",
  "revoke_warning",
  "delete_warning",
  "view_warning_details",
  "export_warnings",
  "manage_warnings",
  // Permissões de Selos de Verificação no CEO
  "verification.manage",
  "verification.review",
  "verification.grant_direct",
  "verification.revoke",
  "verification.config",
  "verification.audit",
  "verification.view_page",
  "verification.request",
  "verification.cancel_own",
];

const ADMIN: Permission[] = ALL_PERMISSIONS.filter(
  (p) => !CEO_PERMISSIONS.includes(p) && !DEV_PANEL_PERMISSIONS.includes(p) && p !== "grant_insignia"
);

const OFFICER: Permission[] = [
  "view_dashboard",
  "view_warnings",
  "view_all_warnings",
  "create_warning",
  "create_suspension",
  "edit_warning",
  "revoke_warning",
  "view_warning_details",
  "export_warnings",
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
  // Permissões de Matérias-Primas (Officer)
  "raw_materials.view",
  "raw_materials.create",
  "raw_materials.edit",
  "raw_materials.delete",
  "raw_materials.adjust",
  "raw_materials.transfer_bau",
  "raw_materials.history",
  // Permissões de Produções e Armazém (Officer)
  "productions.view",
  "productions.create",
  "productions.edit",
  "productions.delete",
  "view_productions",
  "create_production",
  "warehouse.view",
  "warehouse.transfer",
  "warehouse.transfer_storage",
  "warehouse.transfer_sale",
  "warehouse.adjust",
  "warehouse.history",
  "view_warehouse",
  "production_management.view",
  "production_management.products",
  "production_management.raw_materials",
  "production_management.productions",
  "production_management.settings",
  "production_management.reports",
  "view_production_management",
  "sales.view",
  "sales.create",
  "sales.edit",
  "sales.cancel",
  "sales.history",
  "view_members",
  "approve_requests",
  "change_roles",
  "promote_members",
  "edit_members",
  "manage_announcements",
  "view_rankings",
  "view_rankings_xp",
  "view_rankings_financial",
  "view_rankings_movements",
  "view_insignias",
  "manage_insignias_catalog",
  "view_shop",
  "buy_shop_items",
  "manage_shop",
  "evaluate_member",
  "manage_xp_rules",
  "adjust_member_xp",
  "view_member_xp",
  "view_performance",
  "manage_performance",
  "inspect_member_performance",
  "view_goals",
  "manage_goals",
  "view_hierarchy",
  "manage_hierarchy",
  "view_audit",
  // Permissões de Escala de Ação (Officer)
  "escalas.view",
  "escalas.details",
  "escalas.create",
  "escalas.edit",
  "escalas.delete",
  "escalas.publish",
  "escalas.cancel",
  "escalas.manage_members",
  "escalas.add_participants",
  "escalas.remove_participants",
  "escalas.confirm_presence",
  "escalas.manage_slots",
  "escalas.substitute",
  "escalas.history",
  "escalas.settings",
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
  "edit_profile_data",
  "edit_profile_banner",
  "edit_profile_bio",
  "edit_profile_custom_url",
  "edit_profile_appearance",
  "view_life",
  "life_view_following",
  "life_view_bookmarks",
  "post_life",
  "life_post_image",
  "life_post_video",
  "life_mention_members",
  "life_use_hashtags",
  "life_like_posts",
  "life_bookmark_posts",
  "life_comment_posts",
  "life_delete_own_comment",
  "life_delete_own_post",
  "life_follow_members",
  "life_pin_posts",
  "life_moderate_posts",
  "life_moderate_comments",
  "manage_life",
  // Permissões de Selos de Verificação (Officer)
  "verification.manage",
  "verification.review",
  "verification.grant_direct",
  "verification.revoke",
  "verification.config",
  "verification.audit",
  "verification.view_page",
  "verification.request",
  "verification.cancel_own",
];

const MANAGER: Permission[] = [
  "view_dashboard",
  "view_warnings",
  "view_all_warnings",
  "create_warning",
  "create_suspension",
  "edit_warning",
  "revoke_warning",
  "view_warning_details",
  "export_warnings",
  "view_life",
  "life_view_following",
  "life_view_bookmarks",
  "post_life",
  "life_post_image",
  "life_post_video",
  "life_mention_members",
  "life_use_hashtags",
  "life_like_posts",
  "life_bookmark_posts",
  "life_comment_posts",
  "life_delete_own_comment",
  "life_delete_own_post",
  "life_follow_members",
  "life_pin_posts",
  "life_moderate_posts",
  "life_moderate_comments",
  "manage_life",
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
  // Permissões de Matérias-Primas (Manager)
  "raw_materials.view",
  "raw_materials.create",
  "raw_materials.edit",
  "raw_materials.delete",
  "raw_materials.adjust",
  "raw_materials.transfer_bau",
  "raw_materials.history",
  // Permissões de Produções e Armazém (Manager)
  "productions.view",
  "productions.create",
  "productions.edit",
  "productions.delete",
  "view_productions",
  "create_production",
  "warehouse.view",
  "warehouse.transfer",
  "warehouse.transfer_storage",
  "warehouse.transfer_sale",
  "warehouse.adjust",
  "warehouse.history",
  "view_warehouse",
  "production_management.view",
  "production_management.products",
  "production_management.raw_materials",
  "production_management.productions",
  "production_management.settings",
  "production_management.reports",
  "view_production_management",
  "sales.view",
  "sales.create",
  "sales.edit",
  "sales.cancel",
  "sales.history",
  // Permissões de Escala de Ação (Manager)
  "escalas.view",
  "escalas.details",
  "escalas.create",
  "escalas.edit",
  "escalas.publish",
  "escalas.cancel",
  "escalas.manage_members",
  "escalas.add_participants",
  "escalas.remove_participants",
  "escalas.confirm_presence",
  "escalas.manage_slots",
  "escalas.substitute",
  "escalas.history",
  "view_members",
  "approve_requests",
  "change_roles",
  "promote_members",
  "edit_members",
  "manage_announcements",
  "view_rankings",
  "view_rankings_xp",
  "view_rankings_financial",
  "view_rankings_movements",
  "view_insignias",
  "view_shop",
  "buy_shop_items",
  "evaluate_member",
  "view_member_xp",
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
  "edit_profile_data",
  "edit_profile_banner",
  "edit_profile_bio",
  "edit_profile_custom_url",
  "edit_profile_appearance",
  // Permissões de Selos de Verificação (Manager)
  "verification.view_page",
  "verification.request",
  "verification.cancel_own",
  "verification.review",
  "verification.manage",
];

const MEMBER: Permission[] = [
  "view_dashboard",
  "view_warnings",
  // Permissões de Escala de Ação (Member)
  "escalas.view",
  "escalas.details",
  "escalas.confirm_presence",
  "escalas.history",
  "view_chat",
  "create_chat_group",
  "view_absences",
  "request_absence",
  "view_stock",
  "create_movement",
  "view_baus",
  "raw_materials.view",
  "productions.view",
  "productions.create",
  "view_productions",
  "create_production",
  "view_products",
  "view_categories",
  "view_members",
  "view_rankings",
  "view_rankings_xp",
  "view_insignias",
  "view_shop",
  "buy_shop_items",
  "view_member_xp",
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
  "edit_profile_data",
  "edit_profile_banner",
  "edit_profile_bio",
  "edit_profile_custom_url",
  "edit_profile_appearance",
  "view_life",
  "life_view_following",
  "life_view_bookmarks",
  "post_life",
  "life_post_image",
  "life_post_video",
  "life_mention_members",
  "life_use_hashtags",
  "life_like_posts",
  "life_bookmark_posts",
  "life_comment_posts",
  "life_delete_own_comment",
  "life_delete_own_post",
  "life_follow_members",
  // Permissões de Selos de Verificação (Member)
  "verification.view_page",
  "verification.request",
  "verification.cancel_own",
];

const NOVATO: Permission[] = [
  "view_dashboard",
  // Permissões de Escala de Ação (Novato)
  "escalas.view",
  "escalas.details",
  "view_warnings",
  "view_chat",
  "view_absences",
  "request_absence",
  "view_stock",
  "view_baus",
  "view_products",
  "view_categories",
  "view_members",
  "view_rankings",
  "view_rankings_xp",
  "view_insignias",
  "view_shop",
  "buy_shop_items",
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
  "edit_profile_data",
  "edit_profile_banner",
  "edit_profile_bio",
  "edit_profile_custom_url",
  "edit_profile_appearance",
  "view_life",
  "life_view_following",
  "life_view_bookmarks",
  "post_life",
  "life_like_posts",
  "life_bookmark_posts",
  "life_comment_posts",
  "life_delete_own_comment",
  "life_delete_own_post",
  "life_follow_members",
  // Permissões de Selos de Verificação (Novato)
  "verification.view_page",
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

/**
 * Avalia se uma lista de permissões arbitrária (ex: de tags, de painéis ou de cargos)
 * satisfaz a permissão solicitada, considerando correspondência exata, heranças,
 * equivalências estruturais e permissões de guarda-chuva.
 */
export function satisfiesPermission(
  list: Permission[] | string[] | undefined | null,
  permission: Permission
): boolean {
  if (!list || !Array.isArray(list) || list.length === 0) return false;
  if (list.includes(permission)) return true;

  // 1. Sistema de Tickets
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

  // 2. Sistema Life
  if (list.includes("manage_life")) {
    if (
      permission === "view_life" ||
      permission === "life_view_following" ||
      permission === "life_view_bookmarks" ||
      permission === "post_life" ||
      permission === "life_post_image" ||
      permission === "life_post_video" ||
      permission === "life_mention_members" ||
      permission === "life_use_hashtags" ||
      permission === "life_like_posts" ||
      permission === "life_bookmark_posts" ||
      permission === "life_comment_posts" ||
      permission === "life_delete_own_comment" ||
      permission === "life_delete_own_post" ||
      permission === "life_follow_members" ||
      permission === "life_pin_posts" ||
      permission === "life_moderate_posts" ||
      permission === "life_moderate_comments"
    ) {
      return true;
    }
  }

  // 2.1. Sistema de Advertências e Suspensões
  if (
    list.includes("manage_warnings") ||
    list.includes("manage_ceo_warnings") ||
    list.includes("manage_dev_warnings")
  ) {
    if (
      permission === "view_warnings" ||
      permission === "view_all_warnings" ||
      permission === "create_warning" ||
      permission === "create_suspension" ||
      permission === "edit_warning" ||
      permission === "revoke_warning" ||
      permission === "delete_warning" ||
      permission === "view_warning_details" ||
      permission === "export_warnings" ||
      permission === "manage_warnings" ||
      permission === "view_ceo_warnings" ||
      permission === "manage_ceo_warnings" ||
      permission === "view_dev_warnings" ||
      permission === "manage_dev_warnings"
    ) {
      return true;
    }
  }

  // 2.2. Sistema de Selo de Verificação (Isolamento Estrito por Módulo e Página)
  // Módulo: Gerenciar Selos (CEO) -> Apenas para /ceo/selos
  if (
    list.includes("verification.manage") ||
    list.includes("verification.review") ||
    list.includes("verification.grant_direct") ||
    list.includes("verification.revoke") ||
    list.includes("verification.config") ||
    list.includes("verification.audit")
  ) {
    if (permission === "verification.manage") {
      return true;
    }
  }

  // Módulo: Solicitar Verificação -> Apenas para /solicitar-selo
  if (
    list.includes("verification.view_page") ||
    list.includes("verification.request") ||
    list.includes("verification.cancel_own")
  ) {
    if (permission === "verification.view_page") {
      return true;
    }
  }

  if (
    (list.includes("view_all_warnings") ||
      list.includes("view_ceo_warnings") ||
      list.includes("view_dev_warnings")) &&
    (permission === "view_warnings" ||
      permission === "view_warning_details")
  ) {
    return true;
  }

  if (
    (list.includes("create_warning") ||
      list.includes("create_suspension") ||
      list.includes("edit_warning") ||
      list.includes("revoke_warning") ||
      list.includes("delete_warning") ||
      list.includes("view_warning_details") ||
      list.includes("export_warnings")) &&
    (permission === "view_warnings" ||
      permission === "view_warning_details")
  ) {
    return true;
  }
  if (list.includes("life_moderate_posts") && (permission === "life_delete_own_post" || permission === "view_life")) return true;
  if (list.includes("life_moderate_comments") && (permission === "life_delete_own_comment" || permission === "view_life")) return true;
  if (list.includes("life_pin_posts") && permission === "view_life") return true;
  if (list.includes("post_life") && permission === "view_life") return true;
  if (
    (list.includes("life_post_image") ||
      list.includes("life_post_video") ||
      list.includes("life_mention_members") ||
      list.includes("life_use_hashtags")) &&
    (permission === "post_life" || permission === "view_life")
  ) {
    return true;
  }
  if (
    (list.includes("life_like_posts") ||
      list.includes("life_bookmark_posts") ||
      list.includes("life_comment_posts") ||
      list.includes("life_follow_members") ||
      list.includes("life_view_following") ||
      list.includes("life_view_bookmarks")) &&
    permission === "view_life"
  ) {
    return true;
  }

  // 3. Sistema de Lives
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

  // 4. Notificações
  if (list.includes("manage_notifications") && permission === "view_notifications") return true;
  if (list.includes("send_notifications") && permission === "view_notifications") return true;
  if (list.includes("view_dev_notifications") && permission === "view_notifications") return true;
  if (list.includes("view_ceo_notifications") && permission === "view_notifications") return true;
  if (list.includes("manage_dev_notification_rules") && permission === "view_dev_notifications") return true;
  if (list.includes("create_ceo_notification") && permission === "view_ceo_notifications") return true;
  if (list.includes("edit_ceo_notification") && permission === "view_ceo_notifications") return true;
  if (list.includes("create_dev_notification") && permission === "view_dev_notifications") return true;
  if (list.includes("edit_dev_notification") && permission === "view_dev_notifications") return true;
  if (list.includes("delete_dev_notification") && permission === "view_dev_notifications") return true;
  if (list.includes("simulate_dev_notification") && permission === "view_dev_notifications") return true;
  if (list.includes("toggle_dev_notification_active") && permission === "view_dev_notifications") return true;
  if (list.includes("purge_dev_notifications") && permission === "view_dev_notifications") return true;
  if (list.includes("inspect_dev_notification_payload") && permission === "view_dev_notifications") return true;
  if (list.includes("export_dev_notifications") && permission === "view_dev_notifications") return true;
  if (list.includes("manage_dev_notification_sounds") && permission === "view_dev_notifications") return true;
  if (list.includes("broadcast_dev_emergency_alert") && permission === "view_dev_notifications") return true;

  // 5. Bot & Discord
  if (permission === "bot_add_app" && list.includes("bot_invite")) return true;
  if (permission === "bot_invite" && list.includes("bot_add_app")) return true;

  // 6. Estoque, Baús, Categorias e Produtos
  if (permission === "view_stock" && (list.includes("manage_products") || list.includes("manage_categories") || list.includes("manage_baus") || list.includes("view_baus") || list.includes("create_movement") || list.includes("reverse_movement") || list.includes("delete_movement"))) return true;
  if (permission === "view_products" && (list.includes("manage_products") || list.includes("create_sale") || list.includes("sales.create"))) return true;
  if (permission === "view_categories" && list.includes("manage_categories")) return true;
  if (permission === "view_baus" && list.includes("manage_baus")) return true;
  if (permission === "view_movements" && (list.includes("create_movement") || list.includes("reverse_movement") || list.includes("delete_movement") || list.includes("view_all_movements"))) return true;
  if (permission === "estoque.visualizar" && (list.includes("estoque.ajustar") || list.includes("estoque.adicionar") || list.includes("estoque.remover") || list.includes("estoque.corrigir") || list.includes("estoque.configurar") || list.includes("estoque.auditoria"))) return true;

  // 7. Financeiro, Fundo de Caixa, Ausências, Metas e Hierarquia
  if (permission === "view_cash_fund" && (list.includes("manage_cash_fund") || list.includes("reverse_cash_fund") || list.includes("delete_cash_movement"))) return true;
  if (permission === "view_absences" && (list.includes("request_absence") || list.includes("manage_absences") || list.includes("view_all_absences"))) return true;
  if (permission === "view_all_absences" && list.includes("manage_absences")) return true;
  if (permission === "view_goals" && list.includes("manage_goals")) return true;
  if (permission === "view_hierarchy" && (list.includes("manage_hierarchy") || list.includes("manage_roles"))) return true;
  if (permission === "view_members" && (list.includes("edit_members") || list.includes("delete_members") || list.includes("promote_members") || list.includes("change_roles") || list.includes("approve_requests") || list.includes("manage_members"))) return true;
  if (permission === "view_chat" && (list.includes("create_chat_group") || list.includes("manage_chat_groups"))) return true;
  if (permission === "view_consolidated_financials" && (list.includes("view_financials") || list.includes("view_ceo_financials"))) return true;
  if (permission === "approve_requests" && list.includes("manage_members")) return true;

  // 8. Produções
  if (
    (permission === "productions.view" || permission === "view_productions") &&
    (list.includes("productions.view") ||
      list.includes("view_productions") ||
      list.includes("productions.create") ||
      list.includes("create_production") ||
      list.includes("productions.edit") ||
      list.includes("productions.delete") ||
      list.includes("production_management.productions") ||
      list.includes("production_management.view"))
  ) {
    return true;
  }
  if (
    (permission === "productions.create" || permission === "create_production") &&
    (list.includes("productions.create") ||
      list.includes("create_production") ||
      list.includes("production_management.productions"))
  ) {
    return true;
  }
  if (
    (permission === "productions.edit" || permission === "productions.delete") &&
    (list.includes("productions.delete") || list.includes("production_management.productions"))
  ) {
    return true;
  }

  // 9. Matérias-Primas
  if (
    permission === "raw_materials.view" &&
    (list.includes("raw_materials.view") ||
      list.includes("raw_materials.create") ||
      list.includes("raw_materials.edit") ||
      list.includes("raw_materials.delete") ||
      list.includes("raw_materials.adjust") ||
      list.includes("raw_materials.transfer_bau") ||
      list.includes("raw_materials.history") ||
      list.includes("production_management.raw_materials") ||
      list.includes("production_management.view"))
  ) {
    return true;
  }
  if (
    permission === "raw_materials.history" &&
    (list.includes("raw_materials.history") ||
      list.includes("raw_materials.view") ||
      list.includes("raw_materials.transfer_bau") ||
      list.includes("raw_materials.adjust"))
  ) {
    return true;
  }

  // 10. Armazém
  if (
    (permission === "warehouse.view" || permission === "view_warehouse") &&
    (list.includes("warehouse.view") ||
      list.includes("view_warehouse") ||
      list.includes("warehouse.transfer") ||
      list.includes("warehouse.transfer_storage") ||
      list.includes("warehouse.transfer_sale") ||
      list.includes("warehouse.adjust") ||
      list.includes("warehouse.history") ||
      list.includes("production_management.view"))
  ) {
    return true;
  }
  if (
    (permission === "warehouse.transfer_storage" || permission === "warehouse.transfer_sale") &&
    list.includes("warehouse.transfer")
  ) {
    return true;
  }
  if (
    permission === "warehouse.transfer" &&
    (list.includes("warehouse.transfer_storage") || list.includes("warehouse.transfer_sale"))
  ) {
    return true;
  }
  if (
    permission === "warehouse.history" &&
    (list.includes("warehouse.view") ||
      list.includes("view_warehouse") ||
      list.includes("warehouse.transfer") ||
      list.includes("production_management.view"))
  ) {
    return true;
  }
  if (
    permission === "warehouse.adjust" &&
    (list.includes("warehouse.adjust") ||
      list.includes("production_management.settings") ||
      list.includes("manage_stock_balance") ||
      list.includes("estoque.corrigir") ||
      list.includes("adjust_stock_balance"))
  ) {
    return true;
  }

  // 11. Gestão de Produção
  if (
    (permission === "production_management.view" || permission === "view_production_management") &&
    (list.includes("production_management.view") ||
      list.includes("view_production_management") ||
      list.includes("production_management.products") ||
      list.includes("production_management.raw_materials") ||
      list.includes("production_management.productions") ||
      list.includes("production_management.settings") ||
      list.includes("production_management.reports"))
  ) {
    return true;
  }
  if (
    permission === "production_management.products" &&
    list.includes("production_management.products")
  ) {
    return true;
  }
  if (
    permission === "production_management.raw_materials" &&
    list.includes("production_management.raw_materials")
  ) {
    return true;
  }
  if (
    permission === "production_management.productions" &&
    list.includes("production_management.productions")
  ) {
    return true;
  }
  if (
    permission === "production_management.settings" &&
    list.includes("production_management.settings")
  ) {
    return true;
  }
  if (
    permission === "production_management.reports" &&
    (list.includes("production_management.reports") || list.includes("production_management.view"))
  ) {
    return true;
  }

  // 12. Vendas
  if (
    (permission === "view_sales" || permission === "sales.view" || permission === "sales.history") &&
    (list.includes("view_sales") ||
      list.includes("sales.view") ||
      list.includes("sales.history") ||
      list.includes("create_sale") ||
      list.includes("sales.create") ||
      list.includes("reverse_sale") ||
      list.includes("sales.cancel") ||
      list.includes("sales.edit") ||
      list.includes("delete_sale") ||
      list.includes("view_all_sales"))
  ) {
    return true;
  }
  if (
    (permission === "create_sale" || permission === "sales.create") &&
    (list.includes("create_sale") || list.includes("sales.create"))
  ) {
    return true;
  }
  if (
    (permission === "reverse_sale" || permission === "sales.cancel" || permission === "sales.edit") &&
    (list.includes("reverse_sale") ||
      list.includes("sales.cancel") ||
      list.includes("sales.edit") ||
      list.includes("delete_sale"))
  ) {
    return true;
  }
  if (
    permission === "delete_sale" &&
    (list.includes("delete_sale") || list.includes("sales.cancel"))
  ) {
    return true;
  }

  // 13. Gestão de Estoque Avançado
  if (
    permission === "view_stock_management" &&
    (list.includes("manage_stock_products") ||
      list.includes("manage_stock_categories") ||
      list.includes("manage_stock_baus") ||
      list.includes("adjust_stock_balance") ||
      list.includes("manage_stock_balance"))
  ) {
    return true;
  }
  if (permission === "adjust_stock_balance" && (list.includes("estoque.ajustar") || list.includes("estoque.corrigir"))) return true;
  if (permission === "manage_stock_balance" && list.includes("estoque.corrigir")) return true;

  // 14. Ajustes de Estoque CEO
  if (permission === "view_ceo_stock_adjustments" && (list.includes("manage_ceo_stock_adjustments") || list.includes("ceo_adjust_stock_balance") || list.includes("ceo_stock_add") || list.includes("ceo_stock_remove"))) return true;
  if (list.includes("manage_ceo_stock_adjustments") && (permission === "ceo_adjust_stock_balance" || permission === "ceo_stock_add" || permission === "ceo_stock_remove" || permission === "view_ceo_stock_adjustments")) return true;

  // 15. Permissões de Tags (CEO e DEV)
  if (
    list.includes("manage_ceo_tag_permissions") &&
    (permission === "view_ceo_tag_permissions" ||
      permission === "manage_ceo_tag_permissions_detail" ||
      permission === "manage_ceo_tag_rules" ||
      permission === "create_ceo_tag" ||
      permission === "edit_ceo_tag" ||
      permission === "delete_ceo_tag" ||
      permission === "assign_ceo_tag")
  ) {
    return true;
  }
  if (
    permission === "view_ceo_tag_permissions" &&
    (list.includes("create_ceo_tag") ||
      list.includes("edit_ceo_tag") ||
      list.includes("delete_ceo_tag") ||
      list.includes("manage_ceo_tag_permissions") ||
      list.includes("manage_ceo_tag_permissions_detail") ||
      list.includes("manage_ceo_tag_rules") ||
      list.includes("assign_ceo_tag"))
  ) {
    return true;
  }
  if (permission === "view_dev_tags" && list.includes("manage_dev_tags")) return true;

  // 16. Hub Dev e Hub CEO
  if (
    permission === "view_dev_hub" &&
    (list.includes("manage_dev_bot") ||
      list.includes("manage_dev_patch_notes") ||
      list.includes("manage_dev_performance") ||
      list.includes("manage_dev_permissions") ||
      list.includes("manage_dev_config") ||
      list.includes("manage_dev_menu") ||
      list.includes("manage_dev_gamification") ||
      list.includes("view_dev_shop") ||
      list.includes("view_dev_coins") ||
      list.includes("view_dev_notifications") ||
      list.includes("view_dev_tags") ||
      list.includes("manage_dev_tags"))
  ) {
    return true;
  }
  if (
    permission === "view_ceo" &&
    (list.includes("manage_ceo_bot") ||
      list.includes("view_ceo_notifications") ||
      list.includes("view_ceo_stock_adjustments") ||
      list.includes("view_ceo_financials") ||
      list.includes("view_ceo_tag_permissions") ||
      list.includes("manage_ceo_tag_permissions") ||
      list.includes("create_ceo_tag") ||
      list.includes("edit_ceo_tag") ||
      list.includes("delete_ceo_tag") ||
      list.includes("manage_ceo_tag_permissions_detail") ||
      list.includes("manage_ceo_tag_rules") ||
      list.includes("assign_ceo_tag") ||
      list.includes("manage_ceo_webhooks"))
  ) {
    return true;
  }

  // 17. Rankings, Insígnias e Gamificação (XP)
  if (list.includes("manage_insignias_catalog") && permission === "view_insignias") return true;
  if (list.includes("grant_insignia") && permission === "view_insignias") return true;
  if (list.includes("manage_xp_rules") && (permission === "view_rankings_xp" || permission === "view_member_xp")) return true;
  if (list.includes("adjust_member_xp") && permission === "view_member_xp") return true;
  if (
    (list.includes("view_rankings_xp") ||
      list.includes("view_rankings_financial") ||
      list.includes("view_rankings_movements") ||
      list.includes("evaluate_member")) &&
    permission === "view_rankings"
  ) {
    return true;
  }

  // 17. Escala de Ação
  if (permission === "escalas.view") {
    if (
      list.includes("escalas.view") ||
      list.some((p) => typeof p === "string" && p.startsWith("escalas."))
    ) {
      return true;
    }
  }
  if (permission === "escalas.details") {
    if (
      list.includes("escalas.details") ||
      list.includes("escalas.view") ||
      list.some((p) => typeof p === "string" && p.startsWith("escalas."))
    ) {
      return true;
    }
  }
  if (permission === "escalas.create") {
    if (list.includes("escalas.create") || list.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.edit") {
    if (list.includes("escalas.edit") || list.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.delete") {
    if (list.includes("escalas.delete") || list.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.publish") {
    if (list.includes("escalas.publish") || list.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.cancel") {
    if (list.includes("escalas.cancel") || list.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.manage_members") {
    if (list.includes("escalas.manage_members") || list.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.add_participants") {
    if (
      list.includes("escalas.add_participants") ||
      list.includes("escalas.manage_members") ||
      list.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.remove_participants") {
    if (
      list.includes("escalas.remove_participants") ||
      list.includes("escalas.manage_members") ||
      list.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.confirm_presence") {
    if (
      list.includes("escalas.confirm_presence") ||
      list.includes("escalas.manage_members") ||
      list.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.manage_slots") {
    if (
      list.includes("escalas.manage_slots") ||
      list.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.substitute") {
    if (
      list.includes("escalas.substitute") ||
      list.includes("escalas.manage_members") ||
      list.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.history") {
    if (
      list.includes("escalas.history") ||
      list.includes("escalas.manage_members") ||
      list.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.settings") {
    if (list.includes("escalas.settings")) {
      return true;
    }
  }

  return false;
}

export function can(
  userLevel: AppLevel | null | undefined,
  permission: Permission,
  customRoleMap?: Record<string, Permission[]>
): boolean {
  if (!userLevel) return false;

  // Custom role override check (se permissões customizadas foram salvas no banco para este cargo ou se for desenvolvedor com permissões configuradas)
  if (customRoleMap && customRoleMap[userLevel]) {
    const list = customRoleMap[userLevel];
    if (satisfiesPermission(list, permission)) return true;
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

    // Tickets são configuráveis na matriz de cargos: somente permissões marcadas são concedidas.

    // Equivalências e herança do sistema Life
    if (list.includes("manage_life")) {
      if (
        permission === "view_life" ||
        permission === "life_view_following" ||
        permission === "life_view_bookmarks" ||
        permission === "post_life" ||
        permission === "life_post_image" ||
        permission === "life_post_video" ||
        permission === "life_mention_members" ||
        permission === "life_use_hashtags" ||
        permission === "life_like_posts" ||
        permission === "life_bookmark_posts" ||
        permission === "life_comment_posts" ||
        permission === "life_delete_own_comment" ||
        permission === "life_delete_own_post" ||
        permission === "life_follow_members" ||
        permission === "life_pin_posts" ||
        permission === "life_moderate_posts" ||
        permission === "life_moderate_comments"
      ) {
        return true;
      }
    }
    if (list.includes("life_moderate_posts") && (permission === "life_delete_own_post" || permission === "view_life")) return true;
    if (list.includes("life_moderate_comments") && (permission === "life_delete_own_comment" || permission === "view_life")) return true;
    if (list.includes("life_pin_posts") && permission === "view_life") return true;
    if (list.includes("post_life") && permission === "view_life") return true;
    if (
      (list.includes("life_post_image") ||
        list.includes("life_post_video") ||
        list.includes("life_mention_members") ||
        list.includes("life_use_hashtags")) &&
      (permission === "post_life" || permission === "view_life")
    ) {
      return true;
    }
    if (
      (list.includes("life_like_posts") ||
        list.includes("life_bookmark_posts") ||
        list.includes("life_comment_posts") ||
        list.includes("life_follow_members") ||
        list.includes("life_view_following") ||
        list.includes("life_view_bookmarks")) &&
      permission === "view_life"
    ) {
      return true;
    }

    // Fallback gracioso para Life se não estiver no customRoleMap salvo
    const hasAnySavedLifePerm = list.some((p) => typeof p === "string" && p.includes("life"));
    if (hasAnySavedLifePerm && list.includes("post_life")) {
      if (
        permission === "life_post_image" ||
        permission === "life_post_video" ||
        permission === "life_mention_members" ||
        permission === "life_use_hashtags" ||
        permission === "life_like_posts" ||
        permission === "life_bookmark_posts" ||
        permission === "life_comment_posts" ||
        permission === "life_delete_own_comment" ||
        permission === "life_delete_own_post" ||
        permission === "life_follow_members" ||
        permission === "life_view_following" ||
        permission === "life_view_bookmarks"
      ) {
        return true;
      }
    }
    if (!hasAnySavedLifePerm && permission.includes("life")) {
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

    // Equivalências e herança do sistema de advertências e suspensões
    if (
      list.includes("manage_warnings") ||
      list.includes("manage_ceo_warnings") ||
      list.includes("manage_dev_warnings")
    ) {
      if (
        permission === "view_warnings" ||
        permission === "view_all_warnings" ||
        permission === "create_warning" ||
        permission === "create_suspension" ||
        permission === "edit_warning" ||
        permission === "revoke_warning" ||
        permission === "delete_warning" ||
        permission === "view_warning_details" ||
        permission === "export_warnings" ||
        permission === "manage_warnings" ||
        permission === "view_ceo_warnings" ||
        permission === "manage_ceo_warnings" ||
        permission === "view_dev_warnings" ||
        permission === "manage_dev_warnings"
      ) {
        return true;
      }
    }

    if (
      (list.includes("view_all_warnings") ||
        list.includes("view_ceo_warnings") ||
        list.includes("view_dev_warnings")) &&
      (permission === "view_warnings" ||
        permission === "view_warning_details")
    ) {
      return true;
    }

    if (
      (list.includes("create_warning") ||
        list.includes("create_suspension") ||
        list.includes("edit_warning") ||
        list.includes("revoke_warning") ||
        list.includes("delete_warning") ||
        list.includes("view_warning_details") ||
        list.includes("export_warnings")) &&
      (permission === "view_warnings" ||
        permission === "view_warning_details")
    ) {
      return true;
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

    // Produção, Armazém, Gestão de Produção e Vendas
    // 1. Produzir / Produção
    if (
      (permission === "productions.view" || permission === "view_productions") &&
      (list.includes("productions.view") ||
        list.includes("view_productions") ||
        list.includes("productions.create") ||
        list.includes("create_production") ||
        list.includes("productions.edit") ||
        list.includes("productions.delete"))
    ) {
      return true;
    }
    if (
      (permission === "productions.create" || permission === "create_production") &&
      (list.includes("productions.create") ||
        list.includes("create_production"))
    ) {
      return true;
    }
    if (
      (permission === "productions.edit" || permission === "productions.delete") &&
      (list.includes("productions.delete") || list.includes("production_management.productions"))
    ) {
      return true;
    }

    // 2. Armazém
    if (
      (permission === "warehouse.view" || permission === "view_warehouse") &&
      (list.includes("warehouse.view") ||
        list.includes("view_warehouse") ||
        list.includes("warehouse.transfer") ||
        list.includes("warehouse.transfer_storage") ||
        list.includes("warehouse.transfer_sale") ||
        list.includes("warehouse.adjust") ||
        list.includes("warehouse.history"))
    ) {
      return true;
    }
    if (
      (permission === "warehouse.transfer_storage" || permission === "warehouse.transfer_sale") &&
      list.includes("warehouse.transfer")
    ) {
      return true;
    }
    if (
      permission === "warehouse.transfer" &&
      (list.includes("warehouse.transfer_storage") || list.includes("warehouse.transfer_sale"))
    ) {
      return true;
    }
    if (
      permission === "warehouse.history" &&
      (list.includes("warehouse.view") ||
        list.includes("view_warehouse") ||
        list.includes("warehouse.transfer"))
    ) {
      return true;
    }
    if (
      permission === "warehouse.adjust" &&
      (list.includes("warehouse.adjust") ||
        list.includes("production_management.settings") ||
        list.includes("manage_stock_balance") ||
        list.includes("estoque.corrigir") ||
        list.includes("adjust_stock_balance"))
    ) {
      return true;
    }

    // 3. Gestão de Produção (Acesso administrativo restrito a quem possui permissão explícita)
    if (
      (permission === "production_management.view" || permission === "view_production_management") &&
      (list.includes("production_management.view") ||
        list.includes("view_production_management") ||
        list.includes("production_management.products") ||
        list.includes("production_management.raw_materials") ||
        list.includes("production_management.productions") ||
        list.includes("production_management.settings") ||
        list.includes("production_management.reports"))
    ) {
      return true;
    }
    if (
      permission === "production_management.products" &&
      list.includes("production_management.products")
    ) {
      return true;
    }
    if (
      permission === "production_management.raw_materials" &&
      list.includes("production_management.raw_materials")
    ) {
      return true;
    }
    if (
      permission === "production_management.productions" &&
      list.includes("production_management.productions")
    ) {
      return true;
    }
    if (
      permission === "production_management.settings" &&
      list.includes("production_management.settings")
    ) {
      return true;
    }
    if (
      permission === "production_management.reports" &&
      (list.includes("production_management.reports") || list.includes("production_management.view"))
    ) {
      return true;
    }

    // 4. Vendas
    if (
      (permission === "view_sales" || permission === "sales.view" || permission === "sales.history") &&
      (list.includes("view_sales") ||
        list.includes("sales.view") ||
        list.includes("sales.history") ||
        list.includes("create_sale") ||
        list.includes("sales.create") ||
        list.includes("reverse_sale") ||
        list.includes("sales.cancel") ||
        list.includes("sales.edit") ||
        list.includes("delete_sale") ||
        list.includes("view_all_sales"))
    ) {
      return true;
    }
    if (
      (permission === "create_sale" || permission === "sales.create") &&
      (list.includes("create_sale") || list.includes("sales.create"))
    ) {
      return true;
    }
    if (
      (permission === "reverse_sale" || permission === "sales.cancel" || permission === "sales.edit") &&
      (list.includes("reverse_sale") ||
        list.includes("sales.cancel") ||
        list.includes("sales.edit") ||
        list.includes("delete_sale"))
    ) {
      return true;
    }
    if (
      permission === "delete_sale" &&
      (list.includes("delete_sale") || list.includes("sales.cancel"))
    ) {
      return true;
    }

    // Gestão de Estoque
    if (
      permission === "view_stock_management" &&
      (list.includes("manage_stock_products") ||
        list.includes("manage_stock_categories") ||
        list.includes("manage_stock_baus") ||
        list.includes("adjust_stock_balance") ||
        list.includes("manage_stock_balance"))
    ) {
      return true;
    }
    if (permission === "adjust_stock_balance" && (list.includes("estoque.ajustar") || list.includes("estoque.corrigir"))) return true;
    if (permission === "manage_stock_balance" && list.includes("estoque.corrigir")) return true;

    // Ajustes de Estoque CEO
    if (permission === "view_ceo_stock_adjustments" && (list.includes("manage_ceo_stock_adjustments") || list.includes("ceo_adjust_stock_balance") || list.includes("ceo_stock_add") || list.includes("ceo_stock_remove"))) return true;
    if (list.includes("manage_ceo_stock_adjustments") && (permission === "ceo_adjust_stock_balance" || permission === "ceo_stock_add" || permission === "ceo_stock_remove" || permission === "view_ceo_stock_adjustments")) return true;

    // Rankings, Insígnias e Gamificação (XP)
    if (list.includes("manage_insignias_catalog") && permission === "view_insignias") return true;
    if (list.includes("grant_insignia") && permission === "view_insignias") return true;
    if (list.includes("manage_xp_rules") && (permission === "view_rankings_xp" || permission === "view_member_xp")) return true;
    if (list.includes("adjust_member_xp") && permission === "view_member_xp") return true;
    if (
      (list.includes("view_rankings_xp") ||
        list.includes("view_rankings_financial") ||
        list.includes("view_rankings_movements") ||
        list.includes("evaluate_member")) &&
      permission === "view_rankings"
    ) {
      return true;
    }

    // Rankings/XP/Insígnias são configuráveis na matriz de cargos: somente permissões marcadas são concedidas.
    return false;
  }

  // Sem registro salvo no banco para este cargo: usa a matriz padrão do código (inclusive para "desenvolvedor").

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

  if (
    rolePerms.includes("manage_warnings") ||
    rolePerms.includes("manage_ceo_warnings") ||
    rolePerms.includes("manage_dev_warnings")
  ) {
    if (
      permission === "view_warnings" ||
      permission === "view_all_warnings" ||
      permission === "create_warning" ||
      permission === "create_suspension" ||
      permission === "edit_warning" ||
      permission === "revoke_warning" ||
      permission === "delete_warning" ||
      permission === "view_warning_details" ||
      permission === "export_warnings" ||
      permission === "manage_warnings" ||
      permission === "view_ceo_warnings" ||
      permission === "manage_ceo_warnings" ||
      permission === "view_dev_warnings" ||
      permission === "manage_dev_warnings"
    ) {
      return true;
    }
  }

  // Herança e equivalências de Selos de Verificação (Isolamento Estrito por Módulo e Página)
  // Módulo: Gerenciar Selos (CEO) -> Apenas para /ceo/selos
  if (
    rolePerms.includes("verification.manage") ||
    rolePerms.includes("verification.review") ||
    rolePerms.includes("verification.grant_direct") ||
    rolePerms.includes("verification.revoke") ||
    rolePerms.includes("verification.config") ||
    rolePerms.includes("verification.audit")
  ) {
    if (permission === "verification.manage") {
      return true;
    }
  }

  // Módulo: Solicitar Verificação -> Apenas para /solicitar-selo
  if (
    rolePerms.includes("verification.view_page") ||
    rolePerms.includes("verification.request") ||
    rolePerms.includes("verification.cancel_own")
  ) {
    if (permission === "verification.view_page") {
      return true;
    }
  }

  if (
    (rolePerms.includes("view_all_warnings") ||
      rolePerms.includes("view_ceo_warnings") ||
      rolePerms.includes("view_dev_warnings")) &&
    (permission === "view_warnings" ||
      permission === "view_warning_details")
  ) {
    return true;
  }

  if (
    (rolePerms.includes("create_warning") ||
      rolePerms.includes("create_suspension") ||
      rolePerms.includes("edit_warning") ||
      rolePerms.includes("revoke_warning") ||
      rolePerms.includes("delete_warning") ||
      rolePerms.includes("view_warning_details") ||
      rolePerms.includes("export_warnings")) &&
    (permission === "view_warnings" ||
      permission === "view_warning_details")
  ) {
    return true;
  }

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
  if (permission === "view_sales" && (rolePerms.includes("create_sale") || rolePerms.includes("reverse_sale") || rolePerms.includes("delete_sale") || rolePerms.includes("sales.view") || rolePerms.includes("sales.create"))) return true;
  if (permission === "sales.view" && (rolePerms.includes("view_sales") || rolePerms.includes("create_sale") || rolePerms.includes("sales.create") || rolePerms.includes("sales.history"))) return true;
  if (permission === "sales.create" && (rolePerms.includes("create_sale") || rolePerms.includes("sales.create"))) return true;
  if (permission === "create_sale" && (rolePerms.includes("sales.create") || rolePerms.includes("create_sale"))) return true;
  if ((permission === "sales.cancel" || permission === "sales.edit") && (rolePerms.includes("reverse_sale") || rolePerms.includes("sales.cancel") || rolePerms.includes("delete_sale"))) return true;
  if (permission === "reverse_sale" && (rolePerms.includes("sales.cancel") || rolePerms.includes("sales.edit") || rolePerms.includes("delete_sale"))) return true;
  if (permission === "delete_sale" && (rolePerms.includes("sales.cancel") || rolePerms.includes("delete_sale"))) return true;

  // Produções & Armazém (Role Fallback)
  if (
    (permission === "productions.view" || permission === "view_productions") &&
    (rolePerms.includes("productions.view") ||
      rolePerms.includes("view_productions") ||
      rolePerms.includes("productions.create") ||
      rolePerms.includes("create_production") ||
      rolePerms.includes("production_management.view") ||
      rolePerms.includes("production_management.productions"))
  ) {
    return true;
  }
  if (
    (permission === "productions.create" || permission === "create_production") &&
    (rolePerms.includes("productions.create") ||
      rolePerms.includes("create_production") ||
      rolePerms.includes("production_management.productions"))
  ) {
    return true;
  }
  if (
    (permission === "warehouse.view" || permission === "view_warehouse") &&
    (rolePerms.includes("warehouse.view") ||
      rolePerms.includes("view_warehouse") ||
      rolePerms.includes("warehouse.transfer") ||
      rolePerms.includes("warehouse.transfer_storage") ||
      rolePerms.includes("warehouse.transfer_sale") ||
      rolePerms.includes("warehouse.adjust") ||
      rolePerms.includes("production_management.view"))
  ) {
    return true;
  }
  if (
    (permission === "warehouse.transfer_storage" || permission === "warehouse.transfer_sale") &&
    rolePerms.includes("warehouse.transfer")
  ) {
    return true;
  }
  if (
    permission === "warehouse.transfer" &&
    (rolePerms.includes("warehouse.transfer_storage") || rolePerms.includes("warehouse.transfer_sale"))
  ) {
    return true;
  }
  if (
    permission === "warehouse.history" &&
    (rolePerms.includes("warehouse.view") ||
      rolePerms.includes("view_warehouse") ||
      rolePerms.includes("warehouse.transfer") ||
      rolePerms.includes("production_management.view"))
  ) {
    return true;
  }
  if (
    (permission === "production_management.view" || permission === "view_production_management") &&
    (rolePerms.includes("production_management.view") ||
      rolePerms.includes("view_production_management") ||
      rolePerms.includes("production_management.products") ||
      rolePerms.includes("production_management.raw_materials") ||
      rolePerms.includes("production_management.productions") ||
      rolePerms.includes("production_management.settings") ||
      rolePerms.includes("production_management.reports"))
  ) {
    return true;
  }
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
  if (
    permission === "view_stock_management" &&
    (rolePerms.includes("manage_stock_products") ||
      rolePerms.includes("manage_stock_categories") ||
      rolePerms.includes("manage_stock_baus") ||
      rolePerms.includes("adjust_stock_balance") ||
      rolePerms.includes("manage_stock_balance"))
  ) {
    return true;
  }
  if (permission === "adjust_stock_balance" && (rolePerms.includes("estoque.ajustar") || rolePerms.includes("estoque.corrigir"))) return true;
  if (permission === "manage_stock_balance" && rolePerms.includes("estoque.corrigir")) return true;

  // Ajustes de Estoque CEO
  if (permission === "view_ceo_stock_adjustments" && (rolePerms.includes("manage_ceo_stock_adjustments") || rolePerms.includes("ceo_adjust_stock_balance") || rolePerms.includes("ceo_stock_add") || rolePerms.includes("ceo_stock_remove"))) return true;
  if (rolePerms.includes("manage_ceo_stock_adjustments") && (permission === "ceo_adjust_stock_balance" || permission === "ceo_stock_add" || permission === "ceo_stock_remove" || permission === "view_ceo_stock_adjustments")) return true;

  // Life
  if (rolePerms.includes("manage_life")) {
    if (
      permission === "view_life" ||
      permission === "life_view_following" ||
      permission === "life_view_bookmarks" ||
      permission === "post_life" ||
      permission === "life_post_image" ||
      permission === "life_post_video" ||
      permission === "life_mention_members" ||
      permission === "life_use_hashtags" ||
      permission === "life_like_posts" ||
      permission === "life_bookmark_posts" ||
      permission === "life_comment_posts" ||
      permission === "life_delete_own_comment" ||
      permission === "life_delete_own_post" ||
      permission === "life_follow_members" ||
      permission === "life_pin_posts" ||
      permission === "life_moderate_posts" ||
      permission === "life_moderate_comments"
    ) {
      return true;
    }
  }
  if (rolePerms.includes("life_moderate_posts") && (permission === "life_delete_own_post" || permission === "view_life")) return true;
  if (rolePerms.includes("life_moderate_comments") && (permission === "life_delete_own_comment" || permission === "view_life")) return true;
  if (rolePerms.includes("life_pin_posts") && permission === "view_life") return true;
  if (rolePerms.includes("post_life") && permission === "view_life") return true;
  if (
    (rolePerms.includes("life_post_image") ||
      rolePerms.includes("life_post_video") ||
      rolePerms.includes("life_mention_members") ||
      rolePerms.includes("life_use_hashtags")) &&
    (permission === "post_life" || permission === "view_life")
  ) {
    return true;
  }
  if (
    (rolePerms.includes("life_like_posts") ||
      rolePerms.includes("life_bookmark_posts") ||
      rolePerms.includes("life_comment_posts") ||
      rolePerms.includes("life_follow_members") ||
      rolePerms.includes("life_view_following") ||
      rolePerms.includes("life_view_bookmarks")) &&
    permission === "view_life"
  ) {
    return true;
  }

  // Rankings, Insígnias e Gamificação (XP)
  if (rolePerms.includes("manage_insignias_catalog") && permission === "view_insignias") return true;
  if (rolePerms.includes("grant_insignia") && permission === "view_insignias") return true;
  if (rolePerms.includes("manage_xp_rules") && (permission === "view_rankings_xp" || permission === "view_member_xp")) return true;
  if (rolePerms.includes("adjust_member_xp") && permission === "view_member_xp") return true;
  if (
    (rolePerms.includes("view_rankings_xp") ||
      rolePerms.includes("view_rankings_financial") ||
      rolePerms.includes("view_rankings_movements") ||
      rolePerms.includes("evaluate_member")) &&
    permission === "view_rankings"
  ) {
    return true;
  }

  // Tags de Membros (CEO & DEV)
  if (
    rolePerms.includes("manage_ceo_tag_permissions") &&
    (permission === "view_ceo_tag_permissions" ||
      permission === "manage_ceo_tag_permissions_detail" ||
      permission === "manage_ceo_tag_rules" ||
      permission === "create_ceo_tag" ||
      permission === "edit_ceo_tag" ||
      permission === "delete_ceo_tag" ||
      permission === "assign_ceo_tag")
  ) {
    return true;
  }
  if (
    permission === "view_ceo_tag_permissions" &&
    (rolePerms.includes("create_ceo_tag") ||
      rolePerms.includes("edit_ceo_tag") ||
      rolePerms.includes("delete_ceo_tag") ||
      rolePerms.includes("manage_ceo_tag_permissions") ||
      rolePerms.includes("manage_ceo_tag_permissions_detail") ||
      rolePerms.includes("manage_ceo_tag_rules") ||
      rolePerms.includes("assign_ceo_tag"))
  ) {
    return true;
  }
  // Escala de Ação (Role Fallback)
  if (permission === "escalas.view") {
    if (
      rolePerms.includes("escalas.view") ||
      rolePerms.some((p) => typeof p === "string" && p.startsWith("escalas."))
    ) {
      return true;
    }
  }
  if (permission === "escalas.details") {
    if (
      rolePerms.includes("escalas.details") ||
      rolePerms.includes("escalas.view") ||
      rolePerms.some((p) => typeof p === "string" && p.startsWith("escalas."))
    ) {
      return true;
    }
  }
  if (permission === "escalas.create") {
    if (rolePerms.includes("escalas.create") || rolePerms.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.edit") {
    if (rolePerms.includes("escalas.edit") || rolePerms.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.delete") {
    if (rolePerms.includes("escalas.delete") || rolePerms.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.publish") {
    if (rolePerms.includes("escalas.publish") || rolePerms.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.cancel") {
    if (rolePerms.includes("escalas.cancel") || rolePerms.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.manage_members") {
    if (rolePerms.includes("escalas.manage_members") || rolePerms.includes("escalas.settings")) {
      return true;
    }
  }
  if (permission === "escalas.add_participants") {
    if (
      rolePerms.includes("escalas.add_participants") ||
      rolePerms.includes("escalas.manage_members") ||
      rolePerms.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.remove_participants") {
    if (
      rolePerms.includes("escalas.remove_participants") ||
      rolePerms.includes("escalas.manage_members") ||
      rolePerms.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.confirm_presence") {
    if (
      rolePerms.includes("escalas.confirm_presence") ||
      rolePerms.includes("escalas.manage_members") ||
      rolePerms.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.manage_slots") {
    if (
      rolePerms.includes("escalas.manage_slots") ||
      rolePerms.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.substitute") {
    if (
      rolePerms.includes("escalas.substitute") ||
      rolePerms.includes("escalas.manage_members") ||
      rolePerms.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.history") {
    if (
      rolePerms.includes("escalas.history") ||
      rolePerms.includes("escalas.manage_members") ||
      rolePerms.includes("escalas.settings")
    ) {
      return true;
    }
  }
  if (permission === "escalas.settings") {
    if (rolePerms.includes("escalas.settings")) {
      return true;
    }
  }

  if (permission === "view_dev_tags" && rolePerms.includes("manage_dev_tags")) return true;

  if (
    permission === "tags.discord_config" ||
    permission === "tags.discord_create_role" ||
    permission === "tags.discord_edit_position" ||
    permission === "tags.discord_link" ||
    permission === "tags.discord_sync_members" ||
    permission === "tags_discord_config" ||
    permission === "tags_discord_create_role" ||
    permission === "tags_discord_edit_position" ||
    permission === "tags_discord_link" ||
    permission === "tags_discord_sync_members"
  ) {
    if (
      rolePerms.includes("manage_ceo_tag_permissions") ||
      rolePerms.includes("manage_dev_tags") ||
      rolePerms.includes("manage_ceo_bot") ||
      rolePerms.includes("manage_dev_bot") ||
      rolePerms.includes(permission)
    ) {
      return true;
    }
  }

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
    case "desenvolvedor": {
      const style = getPanelColorStyle(getDevThemeColorSync(), "rose");
      return style.badgeClass;
    }
    case "01":
      return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    case "02":
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
    case "gerente":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "motoqueiro":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "membro": {
      const style = getPanelColorStyle(getMemberThemeColorSync(), "cyan");
      return style.badgeClass;
    }
    case "novato":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}
