export type AppLevel = "01" | "02" | "gerente" | "motoqueiro" | "membro" | "novato";

export const LEVELS: AppLevel[] = ["01", "02", "gerente", "motoqueiro", "membro", "novato"];

export const LEVEL_LABEL: Record<AppLevel, string> = {
  "01": "01",
  "02": "02",
  gerente: "Gerente",
  motoqueiro: "Motoqueiro",
  membro: "Membro",
  novato: "Novato",
};

export const LEVEL_DESCRIPTION: Record<AppLevel, string> = {
  "01": "Acesso administrativo completo",
  "02": "Administra operações e membros",
  gerente: "Operações, estoque, vendas e métricas",
  motoqueiro: "Operações próprias e métricas próprias",
  membro: "Acesso operacional e dados próprios",
  novato: "Acesso limitado de leitura",
};

export type Permission =
  | "view_dashboard"
  | "view_products"
  | "manage_products"
  | "view_stock"
  | "create_movement"
  | "reverse_movement"
  | "view_all_movements"
  | "view_sales"
  | "create_sale"
  | "reverse_sale"
  | "view_all_sales"
  | "view_financials"
  | "view_members"
  | "manage_members"
  | "view_performance"
  | "view_rankings"
  | "manage_goals"
  | "view_audit";

const ADMIN: Permission[] = [
  "view_dashboard",
  "view_products",
  "manage_products",
  "view_stock",
  "create_movement",
  "reverse_movement",
  "view_all_movements",
  "view_sales",
  "create_sale",
  "reverse_sale",
  "view_all_sales",
  "view_financials",
  "view_members",
  "manage_members",
  "view_performance",
  "view_rankings",
  "manage_goals",
  "view_audit",
];

const MANAGER: Permission[] = ADMIN.filter(
  (p) => !["view_audit"].includes(p),
);

const OPERATOR: Permission[] = [
  "view_dashboard",
  "view_products",
  "view_stock",
  "create_movement",
  "view_sales",
  "create_sale",
  "view_performance",
  "view_rankings",
];

const ROOKIE: Permission[] = ["view_dashboard", "view_products", "view_stock", "view_rankings"];

export const PERMISSIONS: Record<AppLevel, Permission[]> = {
  "01": ADMIN,
  "02": ADMIN,
  gerente: MANAGER,
  motoqueiro: OPERATOR,
  membro: OPERATOR,
  novato: ROOKIE,
};

export function can(level: AppLevel | null | undefined, permission: Permission): boolean {
  if (!level) return false;
  return PERMISSIONS[level]?.includes(permission) ?? false;
}

export function levelBadgeClass(level: AppLevel): string {
  switch (level) {
    case "01":
      return "bg-gradient-brand text-primary-foreground border-transparent";
    case "02":
      return "bg-primary/15 text-primary border-primary/40";
    case "gerente":
      return "bg-accent/15 text-accent border-accent/40";
    case "motoqueiro":
      return "bg-success/15 text-success border-success/40";
    case "membro":
      return "bg-secondary text-secondary-foreground border-border";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
