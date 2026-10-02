import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Award,
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  TrendingUp,
  Shield,
  Star,
  Users,
  Sliders,
  History,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Target,
  DollarSign,
  Truck,
  Eye,
  Crown,
  Zap,
  Flame,
  Medal,
  Clock,
  Layers,
  HelpCircle,
  ExternalLink,
  Copy,
  PlusCircle,
  Filter,
  Lock,
  Check,
  CheckSquare,
  ListChecks,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DevBadge, CeoBadge, PageHeader } from "@/components/ui-kit";
import { usePanelTheme } from "@/lib/panelTheme";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getLevelLabel, levelBadgeClass } from "@/lib/permissions";
import {
  type InsigniaItem,
  type InsigniaRarity,
  type MemberInsigniaGrant,
  type XpTransaction,
  type XpRuleConfig,
  type RankedGamificationMember,
  RARITY_CONFIG,
  LEVEL_THRESHOLDS,
  getLevelInfo,
  getGamificationRanking,
  getMemberInsignias,
  devManageMemberXp,
  devSetMemberLevel,
  devGrantInsignia,
  devRevokeInsignia,
  devDeleteInsignia,
  devGetAllInsignias,
  devGetXpRules,
  devUpdateXpRule,
  devDeleteXpRule,
  devSaveXpRule,
  devGetAllXpTransactions,
  saveInsignia,
  devUpdateMemberInsigniaReason,
} from "@/services/gamificationService";
import {
  getInsigniaIconStyles,
  getInsigniaCardStyles,
  ColorPickerField,
} from "@/components/gamification/InsigniaCatalogManagerModal";

import * as LucideIcons from "lucide-react";
import { IconPicker } from "./IconPicker";

import { DynamicInsigniaIcon } from "@/components/gamification/InsigniaIcon";
export { DynamicInsigniaIcon };

function formatCooldown(secs: number): string {
  if (secs % 31536000 === 0 && secs > 0) return `${secs / 31536000} ano(s)`;
  if (secs % 2592000 === 0 && secs > 0) return `${secs / 2592000} mês(es)`;
  if (secs % 604800 === 0 && secs > 0) return `${secs / 604800} sem(s)`;
  if (secs % 86400 === 0 && secs > 0) return `${secs / 86400} dia(s)`;
  if (secs % 3600 === 0 && secs > 0) return `${secs / 3600} hora(s)`;
  if (secs % 60 === 0 && secs > 0) return `${secs / 60} min(s)`;
  return `${secs} seg(s)`;
}

function getCategoryBadgeColor(cat: string): string {
  const c = (cat || "").toLowerCase();
  if (c.includes("venda")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (c.includes("prod")) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (c.includes("estoque") || c.includes("bau")) return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  if (c.includes("meta")) return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
  if (c.includes("presen") || c.includes("live")) return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  if (c.includes("suporte") || c.includes("ticket")) return "bg-purple-500/15 text-purple-400 border-purple-500/30";
  if (c.includes("social") || c.includes("feed") || c.includes("life")) return "bg-pink-500/15 text-pink-400 border-pink-500/30";
  return "bg-secondary text-muted-foreground border-border/50";
}

const RULE_TEMPLATES: { label: string; action_type: string; name: string; category: string; xp_reward: number; cooldown_seconds: number; daily_cap: number; description: string }[] = [
  {
    label: "Produção de Item",
    action_type: "production_completed",
    name: "Produção de Item Concluída",
    category: "producao",
    xp_reward: 2,
    cooldown_seconds: 120,
    daily_cap: 10,
    description: "Concedido ao fabricar um lote de produtos na Estação de Produção.",
  },
  {
    label: "Matéria-Prima Registrada",
    action_type: "raw_material_collected",
    name: "Entrada de Matérias-Primas",
    category: "producao",
    xp_reward: 1,
    cooldown_seconds: 300,
    daily_cap: 5,
    description: "Concedido ao dar entrada de insumos ou puxar de baús manuais para a facção.",
  },
  {
    label: "Transferência de Armazém",
    action_type: "warehouse_transfer",
    name: "Logística do Armazém",
    category: "producao",
    xp_reward: 1,
    cooldown_seconds: 300,
    daily_cap: 5,
    description: "Concedido ao transferir itens do armazém central para os baús ou venda.",
  },
  {
    label: "Venda no Balcão",
    action_type: "counter_sale",
    name: "Venda no Balcão Comercial",
    category: "vendas",
    xp_reward: 2,
    cooldown_seconds: 180,
    daily_cap: 8,
    description: "Concedido ao registrar uma venda de produtos a clientes.",
  },
  {
    label: "Depósito no Fundo de Caixa",
    action_type: "cash_fund_deposit",
    name: "Aporte Financeiro no Caixa",
    category: "vendas",
    xp_reward: 2,
    cooldown_seconds: 600,
    daily_cap: 6,
    description: "Concedido ao realizar aportes em dinheiro no fundo de caixa da facção.",
  },
  {
    label: "Meta Semanal Concluída",
    action_type: "weekly_goal_completed",
    name: "Meta Semanal Batida",
    category: "metas",
    xp_reward: 5,
    cooldown_seconds: 86400,
    daily_cap: 5,
    description: "Bônus por alcançar a cota semanal estipulada pela diretoria.",
  },
];

export interface PlatformTriggerItem {
  action_type: string;
  name: string;
  category: string;
  category_label: string;
  description: string;
  default_xp: number;
  default_cooldown: number; // segundos
  default_cap: number;
}

export const ALL_PLATFORM_TRIGGERS: PlatformTriggerItem[] = [
  // VENDAS & COMERCIAL
  {
    action_type: "sale_completed",
    name: "Venda Comercial Concluída",
    category: "vendas",
    category_label: "Vendas & Comercial",
    description: "Disparado quando uma negociação ou venda de produtos/insumos é concluída e auditada.",
    default_xp: 3,
    default_cooldown: 60,
    default_cap: 15,
  },
  {
    action_type: "counter_sale",
    name: "Venda Rápida de Balcão",
    category: "vendas",
    category_label: "Vendas & Comercial",
    description: "Disparado ao realizar vendas diretas de balcão para clientes ou membros da facção.",
    default_xp: 2,
    default_cooldown: 180,
    default_cap: 8,
  },
  {
    action_type: "sale_order_created",
    name: "Pedido de Venda Registrado",
    category: "vendas",
    category_label: "Vendas & Comercial",
    description: "Disparado ao cadastrar e formalizar um novo pedido de carga/encomenda no sistema.",
    default_xp: 1,
    default_cooldown: 120,
    default_cap: 10,
  },
  {
    action_type: "sale_dispatched",
    name: "Entrega de Carga Comercial",
    category: "vendas",
    category_label: "Vendas & Comercial",
    description: "Disparado ao concluir a entrega e confirmação de recebimento de uma carga comercial.",
    default_xp: 3,
    default_cooldown: 300,
    default_cap: 6,
  },
  {
    action_type: "cash_fund_deposit",
    name: "Depósito no Fundo de Caixa",
    category: "vendas",
    category_label: "Financeiro & Caixa",
    description: "Disparado ao registrar um aporte financeiro em dinheiro ou transferência no caixa da facção.",
    default_xp: 2,
    default_cooldown: 600,
    default_cap: 6,
  },
  {
    action_type: "cash_fund_withdraw",
    name: "Prestação de Contas / Retirada",
    category: "vendas",
    category_label: "Financeiro & Caixa",
    description: "Disparado em operações com fluxo de saída e prestação de contas no fundo de caixa.",
    default_xp: 1,
    default_cooldown: 600,
    default_cap: 4,
  },

  // PRODUÇÃO & OFICINAS
  {
    action_type: "production_completed",
    name: "Produção de Item Concluída",
    category: "producao",
    category_label: "Produção & Oficinas",
    description: "Disparado ao fabricar com êxito um lote de insumos ou produtos na bancada.",
    default_xp: 2,
    default_cooldown: 120,
    default_cap: 10,
  },
  {
    action_type: "raw_material_collected",
    name: "Entrada de Matérias-Primas",
    category: "producao",
    category_label: "Produção & Oficinas",
    description: "Disparado ao recolher ou registrar entrada de insumos brutos para refino e processo.",
    default_xp: 1,
    default_cooldown: 300,
    default_cap: 5,
  },
  {
    action_type: "production_batch_finished",
    name: "Lote Industrial Concluído",
    category: "producao",
    category_label: "Produção & Oficinas",
    description: "Disparado ao finalizar uma carga industrial de grande volume de produtos.",
    default_xp: 4,
    default_cooldown: 600,
    default_cap: 4,
  },
  {
    action_type: "recipe_crafted",
    name: "Receita Especial Forjada",
    category: "producao",
    category_label: "Produção & Oficinas",
    description: "Disparado ao sintetizar ou forjar itens especiais ou receitas secretas da facção.",
    default_xp: 3,
    default_cooldown: 300,
    default_cap: 6,
  },
  {
    action_type: "machinery_maintenance",
    name: "Manutenção de Maquinário",
    category: "producao",
    category_label: "Produção & Oficinas",
    description: "Disparado ao calibrar e fazer reparos preventivos nas bancadas operacionais.",
    default_xp: 2,
    default_cooldown: 1800,
    default_cap: 3,
  },

  // LOGÍSTICA & BAÚS
  {
    action_type: "stock_movement",
    name: "Movimentação em Baú",
    category: "estoque",
    category_label: "Logística & Baús",
    description: "Disparado em depósitos e recolhimentos conferidos em baús físicos ou cofres da facção.",
    default_xp: 1,
    default_cooldown: 120,
    default_cap: 5,
  },
  {
    action_type: "warehouse_transfer",
    name: "Transferência de Armazém",
    category: "estoque",
    category_label: "Logística & Baús",
    description: "Disparado ao transferir suprimentos e lotes do armazém central para sub-baús ou veículos.",
    default_xp: 1,
    default_cooldown: 300,
    default_cap: 5,
  },
  {
    action_type: "warehouse_stock_in",
    name: "Recebimento no Armazém",
    category: "estoque",
    category_label: "Logística & Baús",
    description: "Disparado ao protocolar entrada e conferência de carregamento no armazém central.",
    default_xp: 2,
    default_cooldown: 300,
    default_cap: 5,
  },
  {
    action_type: "trunk_audit_completed",
    name: "Auditoria de Baú Concluída",
    category: "estoque",
    category_label: "Logística & Baús",
    description: "Disparado ao executar verificação e batimento de inventário em baú ou porta-malas.",
    default_xp: 3,
    default_cooldown: 1800,
    default_cap: 3,
  },

  // METAS & DESEMPENHO
  {
    action_type: "weekly_goal_completed",
    name: "Meta Semanal Concluída",
    category: "metas",
    category_label: "Metas & Desempenho",
    description: "Disparado ao atingir a cota individual ou coletiva da semana fixada pela diretoria.",
    default_xp: 5,
    default_cooldown: 86400,
    default_cap: 5,
  },
  {
    action_type: "goal_milestone",
    name: "Marco Operacional de Meta",
    category: "metas",
    category_label: "Metas & Desempenho",
    description: "Disparado ao bater marcos parciais de cotas operacionais e produção estipuladas.",
    default_xp: 3,
    default_cooldown: 3600,
    default_cap: 4,
  },
  {
    action_type: "monthly_goal_completed",
    name: "Meta Mensal Superada",
    category: "metas",
    category_label: "Metas & Desempenho",
    description: "Grande bonificação ao cumprir e consagrar o desempenho total mensal da facção.",
    default_xp: 15,
    default_cooldown: 604800,
    default_cap: 1,
  },
  {
    action_type: "top_ranking_award",
    name: "Destaque no Ranking Semanal",
    category: "metas",
    category_label: "Metas & Desempenho",
    description: "Premiação de prestígio para membros que figuram no Top 3 de produtividade e XP.",
    default_xp: 10,
    default_cooldown: 604800,
    default_cap: 1,
  },

  // PRESENÇA, RONDAS & OPERAÇÕES
  {
    action_type: "daily_presence",
    name: "Presença Ativa Diária",
    category: "presenca",
    category_label: "Presença & Operações",
    description: "Bônus diário conferido por engajamento e presença contínua auditada na plataforma.",
    default_xp: 2,
    default_cooldown: 86400,
    default_cap: 1,
  },
  {
    action_type: "event_attendance",
    name: "Participação em Reunião Geral",
    category: "presenca",
    category_label: "Presença & Operações",
    description: "Disparado ao confirmar presença em alinhamentos táticos ou assembleias gerais.",
    default_xp: 3,
    default_cooldown: 86400,
    default_cap: 2,
  },
  {
    action_type: "patrol_completed",
    name: "Ronda / Patrulhamento Concluído",
    category: "presenca",
    category_label: "Presença & Operações",
    description: "Disparado ao cumprir a rota de ronda e proteção de perímetro da facção.",
    default_xp: 3,
    default_cooldown: 1800,
    default_cap: 4,
  },
  {
    action_type: "tactical_action_completed",
    name: "Ação Tática / Comboio Concluído",
    category: "presenca",
    category_label: "Presença & Operações",
    description: "Disparado ao concluir com sucesso escolta armada, comboio ou ação tática coletiva.",
    default_xp: 4,
    default_cooldown: 3600,
    default_cap: 3,
  },

  // SUPORTE & TICKETS
  {
    action_type: "ticket_resolved",
    name: "Atendimento / Ticket Resolvido",
    category: "suporte",
    category_label: "Suporte & Ouvidoria",
    description: "Disparado quando um chamado, dúvida ou suporte interno de membro é solucionado.",
    default_xp: 2,
    default_cooldown: 300,
    default_cap: 4,
  },
  {
    action_type: "ticket_escalated",
    name: "Triagem de Ocorrência Técnica",
    category: "suporte",
    category_label: "Suporte & Ouvidoria",
    description: "Disparado ao abrir relatório formal e qualificar chamado para resolução da liderança.",
    default_xp: 1,
    default_cooldown: 600,
    default_cap: 4,
  },
  {
    action_type: "newbie_onboarding",
    name: "Onboarding / Treinamento de Recruta",
    category: "suporte",
    category_label: "Suporte & Ouvidoria",
    description: "Disparado ao instruir e integrar novos recrutas aos procedimentos da facção.",
    default_xp: 4,
    default_cooldown: 3600,
    default_cap: 3,
  },

  // AVALIAÇÕES & LIDERANÇA
  {
    action_type: "peer_eval_given",
    name: "Avaliação de Colega Realizada",
    category: "lideranca",
    category_label: "Avaliações & Liderança",
    description: "Disparado quando um líder ou colega envia feedback e notas de desempenho.",
    default_xp: 1,
    default_cooldown: 1800,
    default_cap: 2,
  },
  {
    action_type: "peer_eval_received",
    name: "Destaque em Avaliação Recebida",
    category: "lideranca",
    category_label: "Avaliações & Liderança",
    description: "Disparado quando o membro recebe avaliação positiva (4 ou 5 estrelas) por conduta exemplar.",
    default_xp: 2,
    default_cooldown: 3600,
    default_cap: 4,
  },
  {
    action_type: "promotion_granted",
    name: "Promoção Hierárquica Conquistada",
    category: "lideranca",
    category_label: "Avaliações & Liderança",
    description: "Disparado ao receber promoção formal para cargo ou patente superior.",
    default_xp: 10,
    default_cooldown: 604800,
    default_cap: 1,
  },

  // SOCIAL & LIFE FEED
  {
    action_type: "post_published",
    name: "Publicação Oficial no Life / Feed",
    category: "social",
    category_label: "Social & Mural",
    description: "Disparado ao publicar comunicados, fotos ou avisos operacionais no feed social.",
    default_xp: 1,
    default_cooldown: 1800,
    default_cap: 2,
  },
  {
    action_type: "comment_interaction",
    name: "Comentário no Mural da Facção",
    category: "social",
    category_label: "Social & Mural",
    description: "Disparado ao interagir de forma construtiva nos informes e publicações da facção.",
    default_xp: 1,
    default_cooldown: 600,
    default_cap: 3,
  },
  {
    action_type: "community_highlight",
    name: "Post em Destaque da Semana",
    category: "social",
    category_label: "Social & Mural",
    description: "Disparado quando uma postagem atinge alto engajamento e reconhecimento da comunidade.",
    default_xp: 3,
    default_cooldown: 86400,
    default_cap: 1,
  },

  // SISTEMA & GERAL
  {
    action_type: "insignia_acquired",
    name: "Insígnia Desbloqueada",
    category: "geral",
    category_label: "Sistema & Gamificação",
    description: "Bônus especial de prestígio gerado quando o membro conquista nova condecoração.",
    default_xp: 5,
    default_cooldown: 3600,
    default_cap: 3,
  },
  {
    action_type: "level_milestone",
    name: "Marco de Evolução de Nível",
    category: "geral",
    category_label: "Sistema & Gamificação",
    description: "Disparado ao subir de escalão nos patamares matemáticos de graduação.",
    default_xp: 8,
    default_cooldown: 86400,
    default_cap: 2,
  },
  {
    action_type: "manual_dev_grant",
    name: "Atribuição Manual de XP",
    category: "geral",
    category_label: "Sistema & Gamificação",
    description: "Ajuste ou bonificação direta concedida por desenvolvedor ou liderança executiva.",
    default_xp: 5,
    default_cooldown: 60,
    default_cap: 10,
  },
  {
    action_type: "special_event_bonus",
    name: "Bônus de Evento Especial",
    category: "geral",
    category_label: "Sistema & Gamificação",
    description: "Bonificação especial em eventos comemorativos, ações de guerra ou aniversários da facção.",
    default_xp: 10,
    default_cooldown: 86400,
    default_cap: 2,
  },
];

export function DevGamificationManager({ initialTab = "membros" }: { initialTab?: string }) {
  const { devStyle, DevIcon } = usePanelTheme();
  const { isDevUser, user } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dados
  const [members, setMembers] = useState<RankedGamificationMember[]>([]);
  const [insignias, setInsignias] = useState<InsigniaItem[]>([]);
  const [rules, setRules] = useState<XpRuleConfig[]>([]);
  const [transactions, setTransactions] = useState<
    (XpTransaction & { member_name?: string; member_nickname?: string; avatar_url?: string })[]
  >([]);

  // Estados de Modais
  const [selectedMember, setSelectedMember] = useState<RankedGamificationMember | null>(null);

  // Modal 1: Ajustar XP
  const [xpModalOpen, setXpModalOpen] = useState(false);
  const [xpMode, setXpMode] = useState<"add" | "set">("add");
  const [xpAmount, setXpAmount] = useState<number>(50);
  const [xpReason, setXpReason] = useState("");
  const [xpSubmitting, setXpSubmitting] = useState(false);

  // Modal 2: Definir Nível
  const [levelModalOpen, setLevelModalOpen] = useState(false);
  const [targetLevel, setTargetLevel] = useState<number>(1);
  const [syncXpWithLevel, setSyncXpWithLevel] = useState(true);
  const [levelReason, setLevelReason] = useState("");
  const [levelSubmitting, setLevelSubmitting] = useState(false);

  // Modal 3: Conceder Insígnia
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [selectedInsigniaId, setSelectedInsigniaId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [selectedMemberOwnedInsigniaIds, setSelectedMemberOwnedInsigniaIds] = useState<Set<string>>(new Set());

  // Modal 4: Gerenciar Insígnias do Membro
  const [memberInsigniasModalOpen, setMemberInsigniasModalOpen] = useState(false);
  const [memberBadges, setMemberBadges] = useState<MemberInsigniaGrant[]>([]);
  const [loadingMemberBadges, setLoadingMemberBadges] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [editingGrantId, setEditingGrantId] = useState<string | null>(null);
  const [editGrantReason, setEditGrantReason] = useState("");
  const [editGrantSubmitting, setEditGrantSubmitting] = useState(false);

  // Modal 5: Criar / Editar Insígnia no Catálogo
  const [insigniaEditorOpen, setInsigniaEditorOpen] = useState(false);
  const [editingInsignia, setEditingInsignia] = useState<Partial<InsigniaItem> | null>(null);
  const [insigniaSubmitting, setInsigniaSubmitting] = useState(false);
  const [colorTab, setColorTab] = useState<"icon" | "bg" | "border">("icon");

  // Modal 6: Editar / Criar Regra de XP
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<XpRuleConfig> | null>(null);
  const [editRewardStr, setEditRewardStr] = useState("0");
  const [editCapStr, setEditCapStr] = useState("0");
  const [editCooldownStr, setEditCooldownStr] = useState("0");
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [cooldownUnit, setCooldownUnit] = useState<number>(1);
  const [ruleSearch, setRuleSearch] = useState("");
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState("all");
  const [ruleStatusFilter, setRuleStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [ruleToDelete, setRuleToDelete] = useState<XpRuleConfig | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Modal 7: Pesquisar e Selecionar Gatilhos da Plataforma
  const [triggerSelectorOpen, setTriggerSelectorOpen] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState("");
  const [triggerCategoryFilter, setTriggerCategoryFilter] = useState("all");

  // Estados de Ações em Massa (Membros)
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  // Modais de Ações em Massa
  const [bulkXpModalOpen, setBulkXpModalOpen] = useState(false);
  const [bulkXpMode, setBulkXpMode] = useState<"add" | "set">("add");
  const [bulkXpAmount, setBulkXpAmount] = useState<number>(50);
  const [bulkXpReason, setBulkXpReason] = useState("");
  const [bulkXpSubmitting, setBulkXpSubmitting] = useState(false);

  const [bulkLevelModalOpen, setBulkLevelModalOpen] = useState(false);
  const [bulkTargetLevel, setBulkTargetLevel] = useState<number>(1);
  const [bulkSyncXp, setBulkSyncXp] = useState(true);
  const [bulkLevelReason, setBulkLevelReason] = useState("");
  const [bulkLevelSubmitting, setBulkLevelSubmitting] = useState(false);

  const [bulkInsigniaModalOpen, setBulkInsigniaModalOpen] = useState(false);
  const [bulkSelectedInsigniaId, setBulkSelectedInsigniaId] = useState("");
  const [bulkInsigniaReason, setBulkInsigniaReason] = useState("");
  const [bulkInsigniaSubmitting, setBulkInsigniaSubmitting] = useState(false);

  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; percent: number } | null>(null);

  const openCreateRule = (template?: Partial<XpRuleConfig>) => {
    setIsCreatingRule(true);
    setEditingRule({
      action_type: template?.action_type || "",
      name: template?.name || "",
      category: template?.category || "geral",
      description: template?.description || "",
      enabled: template?.enabled !== false,
    });
    setEditRewardStr(String(template?.xp_reward ?? 1));
    setEditCapStr(String(template?.daily_cap ?? 5));
    setEditCooldownStr(String(template?.cooldown_seconds ?? 60));
    setCooldownUnit(1);
    setRuleEditorOpen(true);
  };

  const openRuleEditor = (r: XpRuleConfig) => {
    setIsCreatingRule(false);
    let secs = r.cooldown_seconds || 0;
    let unit = 1;
    let val = secs;
    if (secs > 0) {
      if (secs % 31536000 === 0) { unit = 31536000; val = secs / 31536000; }
      else if (secs % 2592000 === 0) { unit = 2592000; val = secs / 2592000; }
      else if (secs % 604800 === 0) { unit = 604800; val = secs / 604800; }
      else if (secs % 86400 === 0) { unit = 86400; val = secs / 86400; }
      else if (secs % 3600 === 0) { unit = 3600; val = secs / 3600; }
      else if (secs % 60 === 0) { unit = 60; val = secs / 60; }
    }
    setCooldownUnit(unit);
    setEditCooldownStr(String(val));
    setEditRewardStr(String(r.xp_reward || 0));
    setEditCapStr(String(r.daily_cap || 0));
    setEditingRule({ ...r });
    setRuleEditorOpen(true);
  };

  const handleDuplicateRule = (r: XpRuleConfig) => {
    openCreateRule({
      ...r,
      action_type: `${r.action_type}_copia`,
      name: `${r.name} (Cópia)`,
    });
  };

  const handlePromptDeleteRule = (r: XpRuleConfig) => {
    setRuleToDelete(r);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    setRuleSubmitting(true);
    try {
      await devDeleteXpRule(ruleToDelete.action_type);
      toast.success(`Regra "${ruleToDelete.name}" excluída com sucesso!`);
      setRuleToDelete(null);
      setDeleteConfirmOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir regra de XP.");
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleToggleRuleStatus = async (r: XpRuleConfig) => {
    try {
      await devUpdateXpRule({
        ...r,
        enabled: !r.enabled,
      });
      toast.success(`Regra "${r.name}" ${!r.enabled ? "ativada" : "desativada"} com sucesso!`);
      loadData();
    } catch (err: any) {
      toast.error("Erro ao alternar status da regra.");
    }
  };

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    rules.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    ["vendas", "producao", "estoque", "metas", "presenca", "suporte", "social", "geral"].forEach((c) => set.add(c));
    return Array.from(set);
  }, [rules]);

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (ruleStatusFilter === "active" && !r.enabled) return false;
      if (ruleStatusFilter === "inactive" && r.enabled) return false;
      if (ruleCategoryFilter !== "all" && r.category?.toLowerCase() !== ruleCategoryFilter.toLowerCase()) return false;

      if (ruleSearch) {
        const q = ruleSearch.toLowerCase();
        const matchAction = r.action_type.toLowerCase().includes(q);
        const matchName = r.name.toLowerCase().includes(q);
        const matchDesc = (r.description || "").toLowerCase().includes(q);
        const matchCat = (r.category || "").toLowerCase().includes(q);
        if (!matchAction && !matchName && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [rules, ruleSearch, ruleCategoryFilter, ruleStatusFilter]);

  const ruleStats = useMemo(() => {
    const total = rules.length;
    const active = rules.filter((r) => r.enabled).length;
    const inactive = total - active;
    const avgXp = total > 0 ? Math.round(rules.reduce((acc, r) => acc + (r.xp_reward || 0), 0) / total) : 0;
    return { total, active, inactive, avgXp };
  }, [rules]);

  // Carregar dados gerais
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersData, insigniasData, rulesData, txData] = await Promise.all([
        getGamificationRanking("all"),
        devGetAllInsignias(),
        devGetXpRules(),
        devGetAllXpTransactions(100),
      ]);

      setMembers(membersData);
      setInsignias(insigniasData);
      setRules(rulesData);
      setTransactions(txData);
    } catch (err: any) {
      console.error("Erro ao carregar dados de gamificação Dev:", err);
      toast.error("Erro ao sincronizar dados com o banco de dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtro de membros
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;
    const q = searchTerm.toLowerCase();
    return members.filter(
      (m) =>
        m.nome?.toLowerCase().includes(q) ||
        m.nickname?.toLowerCase().includes(q) ||
        m.game_id?.toLowerCase().includes(q)
    );
  }, [members, searchTerm]);

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    const totalMembers = members.length;
    const totalXp = members.reduce((acc, m) => acc + (m.xp || 0), 0);
    const activeInsignias = insignias.filter((i) => i.active).length;
    const totalTransactions = transactions.length;
    return { totalMembers, totalXp, activeInsignias, totalTransactions };
  }, [members, insignias, transactions]);

  // Lista e Helpers de Membros Selecionados
  const selectedMembersList = useMemo(() => {
    return members.filter((m) => selectedMemberIds.has(m.user_id));
  }, [members, selectedMemberIds]);

  const toggleSelectMember = (userId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (filteredMembers.length === 0) return;
    const allFilteredSelected = filteredMembers.every((m) => selectedMemberIds.has(m.user_id));
    if (allFilteredSelected) {
      setSelectedMemberIds((prev) => {
        const next = new Set(prev);
        filteredMembers.forEach((m) => next.delete(m.user_id));
        return next;
      });
    } else {
      setSelectedMemberIds((prev) => {
        const next = new Set(prev);
        filteredMembers.forEach((m) => next.add(m.user_id));
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedMemberIds(new Set());
  };

  // Catálogo Completo de Gatilhos da Plataforma (União estática + dinâmica)
  const allPlatformTriggers = useMemo(() => {
    const list = [...ALL_PLATFORM_TRIGGERS];
    const knownActions = new Set(list.map((t) => t.action_type));

    rules.forEach((r) => {
      if (!knownActions.has(r.action_type)) {
        list.push({
          action_type: r.action_type,
          name: r.name,
          category: r.category || "geral",
          category_label: r.category ? r.category.toUpperCase() : "Personalizado",
          description: r.description || `Gatilho do sistema configurado (${r.action_type})`,
          default_xp: r.xp_reward || 1,
          default_cooldown: r.cooldown_seconds || 60,
          default_cap: r.daily_cap || 5,
        });
        knownActions.add(r.action_type);
      }
    });

    transactions.forEach((tx) => {
      if (tx.action_type && !knownActions.has(tx.action_type)) {
        list.push({
          action_type: tx.action_type,
          name: tx.action_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          category: tx.category || "geral",
          category_label: tx.category ? tx.category.toUpperCase() : "Geral",
          description: `Gatilho registrado em histórico (${tx.action_type})`,
          default_xp: 2,
          default_cooldown: 120,
          default_cap: 5,
        });
        knownActions.add(tx.action_type);
      }
    });

    return list;
  }, [rules, transactions]);

  const filteredTriggers = useMemo(() => {
    let result = allPlatformTriggers;
    if (triggerCategoryFilter !== "all") {
      result = result.filter((t) => t.category.toLowerCase() === triggerCategoryFilter.toLowerCase());
    }
    if (triggerSearch.trim()) {
      const q = triggerSearch.toLowerCase();
      result = result.filter(
        (t) =>
          t.action_type.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category_label.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allPlatformTriggers, triggerCategoryFilter, triggerSearch]);

  const handleSelectPlatformTrigger = (trigger: PlatformTriggerItem) => {
    setEditingRule((prev) => ({
      ...prev,
      action_type: trigger.action_type,
      name: (!prev?.name || prev.name.trim() === "" || prev.name === "Nova Regra") ? trigger.name : prev.name,
      category: trigger.category,
      description: (!prev?.description || prev.description.trim() === "") ? trigger.description : prev.description,
    }));

    if (isCreatingRule) {
      setEditRewardStr(String(trigger.default_xp));
      setEditCapStr(String(trigger.default_cap));
      let secs = trigger.default_cooldown;
      let unit = 1;
      let val = secs;
      if (secs > 0) {
        if (secs % 31536000 === 0) { unit = 31536000; val = secs / 31536000; }
        else if (secs % 2592000 === 0) { unit = 2592000; val = secs / 2592000; }
        else if (secs % 604800 === 0) { unit = 604800; val = secs / 604800; }
        else if (secs % 86400 === 0) { unit = 86400; val = secs / 86400; }
        else if (secs % 3600 === 0) { unit = 3600; val = secs / 3600; }
        else if (secs % 60 === 0) { unit = 60; val = secs / 60; }
      }
      setCooldownUnit(unit);
      setEditCooldownStr(String(val));
    }

    setTriggerSelectorOpen(false);
    toast.success(`Gatilho "${trigger.name}" (${trigger.action_type}) selecionado com sucesso!`);
  };

  // =========================================================================
  // HANDLERS DE AÇÕES EM MASSA (MEMBROS)
  // =========================================================================

  // Executar Concessão / Ajuste de XP em Massa
  const handleExecuteBulkXp = async () => {
    if (selectedMemberIds.size === 0) return;
    if (!bulkXpReason.trim()) {
      toast.error("Informe a justificativa obrigatória para auditoria de XP em massa.");
      return;
    }
    const targetMembers = selectedMembersList;
    setBulkXpSubmitting(true);
    setBulkProgress({ current: 0, total: targetMembers.length, percent: 0 });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targetMembers.length; i++) {
      const m = targetMembers[i];
      try {
        await devManageMemberXp({
          memberId: m.user_id,
          mode: bulkXpMode,
          amount: Number(bulkXpAmount),
          reason: `[AÇÃO EM MASSA] ${bulkXpReason.trim()}`,
        });
        successCount++;
      } catch (err) {
        console.error(`Falha ao conceder XP para ${m.nome}:`, err);
        failCount++;
      }
      const current = i + 1;
      setBulkProgress({
        current,
        total: targetMembers.length,
        percent: Math.round((current / targetMembers.length) * 100),
      });
    }

    setBulkXpSubmitting(false);
    setBulkProgress(null);
    setBulkXpModalOpen(false);
    setBulkXpReason("");
    setSelectedMemberIds(new Set());
    await loadData();

    if (failCount === 0) {
      toast.success(`XP ${bulkXpMode === "add" ? (bulkXpAmount >= 0 ? "concedido" : "debitado") : "definido"} com sucesso para ${successCount} membro(s)!`);
    } else {
      toast.info(`Operação em massa concluída: ${successCount} com sucesso, ${failCount} falharam.`);
    }
  };

  // Executar Definição de Nível em Massa
  const handleExecuteBulkLevel = async () => {
    if (selectedMemberIds.size === 0) return;
    if (!bulkLevelReason.trim()) {
      toast.error("Informe a justificativa obrigatória para alteração de nível em massa.");
      return;
    }
    const targetMembers = selectedMembersList;
    setBulkLevelSubmitting(true);
    setBulkProgress({ current: 0, total: targetMembers.length, percent: 0 });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targetMembers.length; i++) {
      const m = targetMembers[i];
      try {
        await devSetMemberLevel({
          memberId: m.user_id,
          level: Number(bulkTargetLevel),
          syncXp: bulkSyncXp,
          reason: `[AÇÃO EM MASSA] ${bulkLevelReason.trim()}`,
        });
        successCount++;
      } catch (err) {
        console.error(`Falha ao definir nível para ${m.nome}:`, err);
        failCount++;
      }
      const current = i + 1;
      setBulkProgress({
        current,
        total: targetMembers.length,
        percent: Math.round((current / targetMembers.length) * 100),
      });
    }

    setBulkLevelSubmitting(false);
    setBulkProgress(null);
    setBulkLevelModalOpen(false);
    setBulkLevelReason("");
    setSelectedMemberIds(new Set());
    await loadData();

    if (failCount === 0) {
      toast.success(`Nível ${bulkTargetLevel} aplicado com sucesso para ${successCount} membro(s)!`);
    } else {
      toast.info(`Operação em massa concluída: ${successCount} com sucesso, ${failCount} falharam.`);
    }
  };

  // Executar Concessão de Insígnia em Massa
  const handleExecuteBulkInsignia = async () => {
    if (selectedMemberIds.size === 0) return;
    if (!bulkSelectedInsigniaId) {
      toast.error("Selecione a condecoração/insígnia a ser concedida.");
      return;
    }
    if (!bulkInsigniaReason.trim()) {
      toast.error("Informe a justificativa/motivo para condecoração em massa.");
      return;
    }
    const targetBadge = insignias.find((b) => b.id === bulkSelectedInsigniaId);
    const targetMembers = selectedMembersList;
    setBulkInsigniaSubmitting(true);
    setBulkProgress({ current: 0, total: targetMembers.length, percent: 0 });

    let successCount = 0;
    let alreadyOwnedCount = 0;
    let failCount = 0;

    for (let i = 0; i < targetMembers.length; i++) {
      const m = targetMembers[i];
      try {
        await devGrantInsignia({
          memberId: m.user_id,
          insigniaId: bulkSelectedInsigniaId,
          reason: `[CONCESSÃO EM MASSA] ${bulkInsigniaReason.trim()}`,
        });
        successCount++;
      } catch (err: any) {
        const msg = String(err?.message || "").toLowerCase();
        if (msg.includes("já possui") || msg.includes("already") || msg.includes("unique")) {
          alreadyOwnedCount++;
        } else {
          console.error(`Falha ao conceder insígnia para ${m.nome}:`, err);
          failCount++;
        }
      }
      const current = i + 1;
      setBulkProgress({
        current,
        total: targetMembers.length,
        percent: Math.round((current / targetMembers.length) * 100),
      });
    }

    setBulkInsigniaSubmitting(false);
    setBulkProgress(null);
    setBulkInsigniaModalOpen(false);
    setBulkInsigniaReason("");
    setBulkSelectedInsigniaId("");
    setSelectedMemberIds(new Set());
    await loadData();

    const badgeName = targetBadge?.name || bulkSelectedInsigniaId;
    if (failCount === 0 && alreadyOwnedCount === 0) {
      toast.success(`Insígnia "${badgeName}" concedida com sucesso para todos os ${successCount} membros!`);
    } else {
      toast.info(
        `Insígnia "${badgeName}": ${successCount} concedida(s)` +
        (alreadyOwnedCount > 0 ? `, ${alreadyOwnedCount} já possuíam` : "") +
        (failCount > 0 ? `, ${failCount} falharam.` : ".")
      );
    }
  };

  // =========================================================================
  // HANDLERS DE AÇÕES DEV
  // =========================================================================

  // 1. Executar Ajuste de XP
  const handleExecuteXpAdjustment = async () => {
    if (!selectedMember) return;
    if (!xpReason.trim()) {
      toast.error("Informe a justificativa obrigatória para auditoria.");
      return;
    }

    setXpSubmitting(true);
    try {
      const res = await devManageMemberXp({
        memberId: selectedMember.user_id,
        mode: xpMode,
        amount: Number(xpAmount),
        reason: xpReason.trim(),
      });

      toast.success(
        `XP de ${res.member_name} atualizado com sucesso! (${res.old_xp} ➔ ${res.new_xp} XP, Nível ${res.new_level})`
      );
      setXpModalOpen(false);
      setXpReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao ajustar XP.");
    } finally {
      setXpSubmitting(false);
    }
  };

  // 2. Executar Definição de Nível
  const handleExecuteLevelChange = async () => {
    if (!selectedMember) return;
    if (!levelReason.trim()) {
      toast.error("Informe a justificativa obrigatória para auditoria.");
      return;
    }

    setLevelSubmitting(true);
    try {
      const res = await devSetMemberLevel({
        memberId: selectedMember.user_id,
        level: Number(targetLevel),
        syncXp: syncXpWithLevel,
        reason: levelReason.trim(),
      });

      toast.success(
        `Nível atualizado para Nível ${res.new_level}! ${syncXpWithLevel ? `(XP sincronizado para ${res.new_xp})` : ""}`
      );
      setLevelModalOpen(false);
      setLevelReason("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao definir nível.");
    } finally {
      setLevelSubmitting(false);
    }
  };

  // 3. Executar Concessão de Insígnia
  // Abrir Modal de Conceder Insígnia filtrando as já possuídas
  const handleOpenGrantModal = async (member: RankedGamificationMember) => {
    setSelectedMember(member);
    setSelectedInsigniaId("");
    setGrantReason("");
    try {
      const badges = await getMemberInsignias(member.user_id);
      setSelectedMemberOwnedInsigniaIds(new Set(badges.map((b) => b.insignia_id)));
    } catch {
      setSelectedMemberOwnedInsigniaIds(new Set());
    }
    setGrantModalOpen(true);
  };

  const handleExecuteGrantInsignia = async () => {
    if (!selectedMember || !selectedInsigniaId) {
      toast.error("Selecione a insígnia desejada.");
      return;
    }
    if (!grantReason.trim()) {
      toast.error("Informe o motivo da condecoração.");
      return;
    }

    setGrantSubmitting(true);
    try {
      const res = await devGrantInsignia({
        memberId: selectedMember.user_id,
        insigniaId: selectedInsigniaId,
        reason: grantReason.trim(),
      });

      toast.success(`Insígnia "${res.insignia_name}" concedida com sucesso a ${res.member_name}!`);
      setGrantModalOpen(false);
      setGrantReason("");
      setSelectedInsigniaId("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao conceder insígnia.");
    } finally {
      setGrantSubmitting(false);
    }
  };

  // 4. Abrir Gerenciador de Insígnias do Membro
  const handleOpenMemberInsignias = async (member: RankedGamificationMember) => {
    setSelectedMember(member);
    setMemberInsigniasModalOpen(true);
    setLoadingMemberBadges(true);
    try {
      const badges = await getMemberInsignias(member.user_id);
      setMemberBadges(badges);
    } catch (err: any) {
      toast.error("Erro ao buscar insígnias do membro.");
    } finally {
      setLoadingMemberBadges(false);
    }
  };

  // 5. Revogar Insígnia
  const handleRevokeInsignia = async (insigniaId: string, badgeName: string) => {
    if (!selectedMember) return;
    const confirmRevoke = window.confirm(
      `Deseja realmente revogar a insígnia "${badgeName}" do membro ${selectedMember.nickname || selectedMember.nome}?`
    );
    if (!confirmRevoke) return;

    setRevokingId(insigniaId);
    try {
      await devRevokeInsignia({
        memberId: selectedMember.user_id,
        insigniaId,
        reason: "Revogação manual executada pelo Desenvolvedor via Painel Dev",
      });

      toast.success(`Insígnia "${badgeName}" revogada com sucesso.`);
      setMemberBadges((prev) => prev.filter((b) => b.insignia_id !== insigniaId));
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao revogar insígnia.");
    } finally {
      setRevokingId(null);
    }
  };

  // Editar Justificativa de Insígnia
  const handleSaveEditedInsigniaReason = async (grantId: string) => {
    if (!editGrantReason.trim()) {
      toast.error("A justificativa não pode ficar vazia.");
      return;
    }
    setEditGrantSubmitting(true);
    try {
      await devUpdateMemberInsigniaReason(grantId, editGrantReason.trim());
      toast.success("Justificativa da insígnia atualizada com sucesso.");
      
      setMemberBadges((prev) => 
        prev.map((b) => b.id === grantId ? { ...b, reason: editGrantReason.trim() } : b)
      );
      setEditingGrantId(null);
      setEditGrantReason("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao editar justificativa.");
    } finally {
      setEditGrantSubmitting(false);
    }
  };

  // 6. Salvar Insígnia no Catálogo
  const handleSaveInsigniaCatalog = async () => {
    if (!editingInsignia?.name?.trim() || !editingInsignia?.id?.trim()) {
      toast.error("Preencha o identificador (ID) e o nome da insígnia.");
      return;
    }

    setInsigniaSubmitting(true);
    try {
      await saveInsignia({
        id: editingInsignia.id.trim().toLowerCase().replace(/\s+/g, "_"),
        name: editingInsignia.name.trim(),
        icon: editingInsignia.icon || "Award",
        description: editingInsignia.description?.trim() || "",
        rarity: (editingInsignia.rarity as InsigniaRarity) || "comum",
        xp_cost: Number(editingInsignia.xp_cost || 0),
        category: editingInsignia.category || "geral",
        active: editingInsignia.active !== false,
        color: editingInsignia.color || null,
        bg_color: editingInsignia.bg_color || null,
        border_color: editingInsignia.border_color || null,
      });

      toast.success("Insígnia salva no catálogo com sucesso!");
      setInsigniaEditorOpen(false);
      setEditingInsignia(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar insígnia.");
    } finally {
      setInsigniaSubmitting(false);
    }
  };

  // 7. Excluir Insígnia do Catálogo
  const handleDeleteInsigniaCatalog = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `ATENÇÃO: Deseja realmente excluir permanentemente a insígnia "${name}" do catálogo oficial?`
    );
    if (!confirmDelete) return;

    try {
      await devDeleteInsignia(id);
      toast.success(`Insígnia "${name}" excluída.`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir insígnia.");
    }
  };

  // 8. Salvar Regra de XP (Criar ou Editar)
  const handleSaveXpRule = async () => {
    if (!editingRule?.action_type?.trim()) {
      toast.error("Informe o identificador do gatilho (action_type).");
      return;
    }
    if (!editingRule?.name?.trim()) {
      toast.error("Informe o nome amigável da regra de XP.");
      return;
    }

    const cleanActionType = editingRule.action_type
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]/g, "_");

    if (!cleanActionType) {
      toast.error("Gatilho inválido. Use letras, números e underline.");
      return;
    }

    const finalReward = Number(editRewardStr.replace(',', '.')) || 0;
    const finalCap = Number(editCapStr.replace(',', '.')) || 0;
    const cooldownValParsed = Number(editCooldownStr.replace(',', '.')) || 0;
    const finalCooldownSeconds = cooldownValParsed * cooldownUnit;

    setRuleSubmitting(true);
    try {
      await devUpdateXpRule({
        action_type: cleanActionType,
        name: editingRule.name.trim(),
        xp_reward: finalReward,
        cooldown_seconds: finalCooldownSeconds,
        daily_cap: finalCap,
        category: (editingRule.category || "geral").toLowerCase().trim(),
        description: editingRule.description?.trim() || "",
        enabled: editingRule.enabled !== false,
      });

      toast.success(
        isCreatingRule
          ? `Nova regra "${editingRule.name.trim()}" criada com sucesso!`
          : `Regra "${editingRule.name.trim()}" atualizada com sucesso!`
      );
      setRuleEditorOpen(false);
      setEditingRule(null);
      setIsCreatingRule(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar regra de XP.");
    } finally {
      setRuleSubmitting(false);
    }
  };

  // Pré-visualização de cálculo de XP e Nível no Modal
  const previewCalculation = useMemo(() => {
    if (!selectedMember) return null;
    const curXp = selectedMember.xp || 0;
    const finalXp = xpMode === "set" ? Math.max(0, xpAmount) : Math.max(0, curXp + xpAmount);
    const lvlInfo = getLevelInfo(finalXp);
    return {
      curXp,
      finalXp,
      delta: finalXp - curXp,
      level: lvlInfo.level,
      title: lvlInfo.title,
      progress: lvlInfo.progressPercent,
    };
  }, [selectedMember, xpMode, xpAmount]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header com Design System */}
      <PageHeader
        title="XP e Insígnias"
        description="Controle avançado de gamificação, concessão direta de XP e patamares de níveis, condecorações manuais sem débito e governança de catálogo."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("px-2.5 py-1 text-xs font-bold gap-1.5 border", devStyle.badgeClass)}>
              <DevIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Exclusivo Dev</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-8 sm:h-9 text-xs gap-1.5 border-border/60 hover:bg-accent/40"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span>Atualizar</span>
            </Button>
          </div>
        }
      />

      {/* Cards de Métricas e Estado da Gamificação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className={cn("p-2 sm:p-2.5 rounded-xl border shrink-0", devStyle.bgSubtleClass, devStyle.borderSubtleClass)}>
              <Users className={cn("w-4 h-4 sm:w-5 sm:h-5", devStyle.iconClass || devStyle.textClass)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">Membros</p>
              <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-foreground truncate">{stats.totalMembers}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">XP Distribuído</p>
              <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-foreground truncate">
                {stats.totalXp.toLocaleString("pt-BR")} XP
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">Insígnias</p>
              <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-foreground truncate">{stats.activeInsignias}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm hover:border-primary/40 transition-all">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shrink-0">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">Auditorias</p>
              <h3 className="text-base sm:text-xl font-extrabold tracking-tight text-foreground truncate">{stats.totalTransactions}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais de Gerenciamento */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
        <TabsList className="bg-muted/50 p-1 border border-border/50 rounded-xl grid grid-cols-2 sm:grid-cols-4 h-auto w-full max-w-2xl gap-1">
          <TabsTrigger value="membros" className="gap-1.5 sm:gap-2 font-bold data-[state=active]:bg-background py-2 text-xs sm:text-sm">
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">Membros</span>
          </TabsTrigger>
          <TabsTrigger value="insignias" className="gap-1.5 sm:gap-2 font-bold data-[state=active]:bg-background py-2 text-xs sm:text-sm">
            <Award className="w-4 h-4 shrink-0" />
            <span className="truncate">Insígnias</span>
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-1.5 sm:gap-2 font-bold data-[state=active]:bg-background py-2 text-xs sm:text-sm">
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="truncate">Regras XP</span>
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-1.5 sm:gap-2 font-bold data-[state=active]:bg-background py-2 text-xs sm:text-sm">
            <History className="w-4 h-4 shrink-0" />
            <span className="truncate">Histórico</span>
          </TabsTrigger>
        </TabsList>

        {/* =========================================================================
            TAB 1: GESTÃO DE MEMBROS (CONCESSÃO DE XP, NÍVEL E INSÍGNIAS)
            ========================================================================= */}
        <TabsContent value="membros" className="space-y-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary shrink-0" />
                    <span>Membros & Ações</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Selecione um membro para conceder XP, definir nível manualmente ou gerenciar condecorações.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar membro, nick ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-background/80 border-border/60 h-9 rounded-lg text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 pt-2 space-y-3">
              {/* BARRA FLUTUANTE / FIXA DE AÇÕES EM MASSA */}
              {selectedMemberIds.size > 0 && (
                <div className="p-3 sm:p-3.5 rounded-xl border border-primary/40 bg-primary/10 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                        <span>{selectedMemberIds.size}</span>
                        <span>membro(s) selecionado(s)</span>
                        <Badge variant="outline" className="text-[10px] border-primary/40 bg-background/50">
                          de {filteredMembers.length}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Execute alterações e condecorações simultâneas para todos os membros marcados.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => {
                        setBulkXpMode("add");
                        setBulkXpAmount(50);
                        setBulkXpReason("");
                        setBulkXpModalOpen(true);
                      }}
                      className="h-8 px-2.5 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Conceder XP</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBulkTargetLevel(1);
                        setBulkSyncXp(true);
                        setBulkLevelReason("");
                        setBulkLevelModalOpen(true);
                      }}
                      className="h-8 px-2.5 text-xs font-bold gap-1.5 border-border hover:bg-accent/40 text-foreground cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>Definir Nível</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        setBulkSelectedInsigniaId("");
                        setBulkInsigniaReason("");
                        setBulkInsigniaModalOpen(true);
                      }}
                      className="h-8 px-2.5 text-xs font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-black shadow-xs cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Conceder Insígnia</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearSelection}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Desmarcar
                    </Button>
                  </div>
                </div>
              )}

              {/* BARRA DE SELEÇÃO RÁPIDA NO MOBILE */}
              {filteredMembers.length > 0 && (
                <div className="md:hidden flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                    <Checkbox
                      checked={filteredMembers.length > 0 && filteredMembers.every((m) => selectedMemberIds.has(m.user_id))}
                      onCheckedChange={handleSelectAllFiltered}
                    />
                    <span>Selecionar Todos ({filteredMembers.length})</span>
                  </label>
                  {selectedMemberIds.size > 0 && (
                    <span className="text-[11px] font-extrabold text-primary">
                      {selectedMemberIds.size} selecionado(s)
                    </span>
                  )}
                </div>
              )}

              {/* VISUALIZAÇÃO MOBILE (CARDS RESPONSIVOS - SEM BARRA DE ROLAGEM LATERAL) */}
              <div className="md:hidden space-y-3">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Nenhum membro encontrado.
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const lvlInfo = getLevelInfo(m.xp);
                    const isSelected = selectedMemberIds.has(m.user_id);
                    return (
                      <Card
                        key={m.user_id}
                        className={cn(
                          "border p-3.5 rounded-xl shadow-xs space-y-3 transition-colors",
                          isSelected
                            ? "bg-primary/10 border-primary/50 ring-1 ring-primary/40"
                            : "border-border/60 bg-background/80"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectMember(m.user_id)}
                              className="mt-0.5 shrink-0"
                            />
                            <span className="font-mono font-extrabold text-xs text-muted-foreground shrink-0 w-5">
                              #{m.rank_position}
                            </span>
                            <img
                              src={m.avatar_url || "/placeholder-avatar.png"}
                              alt={m.nome}
                              className="w-10 h-10 rounded-full object-cover border border-border/80 shrink-0"
                              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-foreground text-sm flex items-center gap-1">
                                <span className="truncate">{m.nickname || m.nome}</span>
                                {m.is_developer && <DevBadge size="xs" />}
                                {m.is_ceo && <CeoBadge size="xs" />}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono truncate">
                                {m.game_id ? `ID: ${m.game_id}` : m.nome}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-extrabold text-foreground text-sm">
                              {(m.xp || 0).toLocaleString("pt-BR")}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-1">XP</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-border/40 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className={cn("text-[10px] font-bold border", levelBadgeClass(m.nivel))}>
                              {getLevelLabel(m.nivel)}
                            </Badge>
                            <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[10px] font-extrabold px-2 py-0.5">
                              Nível {m.gamification_level || lvlInfo.level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenMemberInsignias(m)}
                              className="h-6 px-2 font-bold text-[11px] gap-1 hover:bg-amber-500/10 text-amber-300"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              <span>{m.insignias_count || 0}</span>
                            </Button>
                            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              <span>{Number(m.stars_rating || 5).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ações Dev Mobile */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(m);
                              setXpMode("add");
                              setXpAmount(50);
                              setXpReason("");
                              setXpModalOpen(true);
                            }}
                            className="h-8 px-1 text-xs font-bold gap-1 border-purple-500/40 text-purple-300 hover:bg-purple-500/10 w-full"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>XP</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(m);
                              setTargetLevel(m.gamification_level || lvlInfo.level);
                              setSyncXpWithLevel(true);
                              setLevelReason("");
                              setLevelModalOpen(true);
                            }}
                            className="h-8 px-1 text-xs font-bold gap-1 border-border/80 hover:bg-accent/40 w-full"
                          >
                            <Layers className="w-3.5 h-3.5 shrink-0" />
                            <span>Nível</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenMemberInsignias(m)}
                            className="h-8 px-1 text-xs font-bold gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 w-full"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Insígnia</span>
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* VISUALIZAÇÃO DESKTOP / TABLET (TABELA COMPLETA COM SCROLL INTERNO CONTROLADO) */}
              <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-background/50">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3 px-3 w-10 text-center">
                          <Checkbox
                            checked={filteredMembers.length > 0 && filteredMembers.every((m) => selectedMemberIds.has(m.user_id))}
                            onCheckedChange={handleSelectAllFiltered}
                            aria-label="Selecionar todos os membros"
                          />
                        </th>
                        <th className="py-3 px-4">Pos / Membro</th>
                        <th className="py-3 px-4">Cargo & Tags</th>
                        <th className="py-3 px-4 text-center">Nível Atual</th>
                        <th className="py-3 px-4 text-right">Saldo de XP</th>
                        <th className="py-3 px-4 text-center">Insígnias</th>
                        <th className="py-3 px-4 text-center">Avaliação</th>
                        <th className="py-3 px-4 text-right">Ações Dev</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-muted-foreground">
                            Nenhum membro encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((m) => {
                          const lvlInfo = getLevelInfo(m.xp);
                          const isSelected = selectedMemberIds.has(m.user_id);
                          return (
                            <tr
                              key={m.user_id}
                              className={cn(
                                "hover:bg-accent/20 transition-colors group",
                                isSelected && "bg-primary/10 hover:bg-primary/15"
                              )}
                            >
                              <td className="py-3 px-3 w-10 text-center">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelectMember(m.user_id)}
                                  aria-label={`Selecionar ${m.nome}`}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-extrabold text-xs text-muted-foreground w-6 text-center">
                                    #{m.rank_position}
                                  </span>
                                  <div className="relative">
                                    <img
                                      src={m.avatar_url || "/placeholder-avatar.png"}
                                      alt={m.nome}
                                      className="w-9 h-9 rounded-full object-cover border border-border/80 shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <div className="font-bold text-foreground flex items-center gap-1.5">
                                      {m.nickname || m.nome}
                                      {m.is_developer && <DevBadge size="xs" />}
                                      {m.is_ceo && <CeoBadge size="xs" />}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                      {m.game_id ? `ID: ${m.game_id}` : m.nome}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className={cn("text-[11px] font-bold border", levelBadgeClass(m.nivel))}>
                                  {getLevelLabel(m.nivel)}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-xs font-extrabold px-2.5 py-0.5">
                                  Nível {m.gamification_level || lvlInfo.level}
                                </Badge>
                                <div className="text-[10px] text-muted-foreground mt-0.5">{lvlInfo.title}</div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-mono font-extrabold text-foreground text-sm">
                                  {(m.xp || 0).toLocaleString("pt-BR")}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">XP</span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenMemberInsignias(m)}
                                  className="h-7 px-2 font-bold text-xs gap-1.5 hover:bg-amber-500/10 hover:text-amber-300"
                                >
                                  <Award className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{m.insignias_count || 0}</span>
                                </Button>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>{Number(m.stars_rating || 5).toFixed(1)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMember(m);
                                      setXpMode("add");
                                      setXpAmount(50);
                                      setXpReason("");
                                      setXpModalOpen(true);
                                    }}
                                    className="h-8 px-2.5 text-xs font-bold gap-1 border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                    XP
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMember(m);
                                      setTargetLevel(m.gamification_level || lvlInfo.level);
                                      setSyncXpWithLevel(true);
                                      setLevelReason("");
                                      setLevelModalOpen(true);
                                    }}
                                    className="h-8 px-2.5 text-xs font-bold gap-1 border-border/80 hover:bg-accent/40"
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                    Nível
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenMemberInsignias(m)}
                                    className="h-8 px-2.5 text-xs font-bold gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                                  >
                                    <Award className="w-3.5 h-3.5 text-amber-400" />
                                    Insígnia
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            TAB 2: CATÁLOGO DE INSÍGNIAS (CRUD COMPLETO)
            ========================================================================= */}
        <TabsContent value="insignias" className="space-y-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Catálogo de Insígnias & Condecorações</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Cadastre, personalize regras de custo em XP, raridade e condecorações da facção.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingInsignia({
                      id: "",
                      name: "",
                      icon: "Award",
                      description: "",
                      rarity: "comum",
                      xp_cost: 0,
                      category: "honra",
                      active: true,
                      color: null,
                      bg_color: null,
                      border_color: null,
                    });
                    setColorTab("icon");
                    setInsigniaEditorOpen(true);
                  }}
                  className="font-extrabold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm w-full sm:w-auto text-xs h-9"
                >
                  <Plus className="w-4 h-4" />
                  Nova Insígnia
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insignias.map((badge) => {
                  const rarityStyle = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;
                  const iconStyle = getInsigniaIconStyles(badge);
                  const cardStyle = getInsigniaCardStyles(badge);
                  const hasCustomColors = Boolean(badge.color || badge.bg_color || badge.border_color);
                  return (
                    <Card
                      key={badge.id}
                      className={cn(
                        "border relative overflow-hidden backdrop-blur-sm transition-all hover:scale-[1.01] shadow-sm",
                        !cardStyle && rarityStyle.borderClass,
                        !cardStyle && rarityStyle.bgClass,
                        !badge.active && "opacity-50 grayscale"
                      )}
                      style={cardStyle}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner shrink-0",
                                !iconStyle && rarityStyle.borderClass,
                                !iconStyle && rarityStyle.bgClass,
                                !iconStyle && rarityStyle.textClass
                              )}
                              style={iconStyle}
                            >
                              <DynamicInsigniaIcon name={badge.icon} className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-foreground tracking-tight">{badge.name}</h4>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-mono text-muted-foreground">ID: {badge.id}</span>
                                {hasCustomColors && (
                                  <div className="flex items-center gap-1 bg-background/50 px-1 py-0.5 rounded border border-border/40">
                                    {badge.bg_color && (
                                      <span className="h-2 w-2 rounded-full border border-white/40" style={{ backgroundColor: badge.bg_color }} title={`Fundo: ${badge.bg_color}`} />
                                    )}
                                    {badge.border_color && (
                                      <span className="h-2 w-2 rounded-full border border-white/40" style={{ borderColor: badge.border_color, borderWidth: 2 }} title={`Borda: ${badge.border_color}`} />
                                    )}
                                    {badge.color && (
                                      <span className="h-2 w-2 rounded-full border border-white/40" style={{ backgroundColor: badge.color }} title={`Ícone: ${badge.color}`} />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 border",
                              rarityStyle.borderClass,
                              rarityStyle.bgClass,
                              rarityStyle.textClass
                            )}
                          >
                            {rarityStyle.label}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground min-h-[36px] line-clamp-2 leading-relaxed">
                          {badge.description || "Sem descrição cadastrada."}
                        </p>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40 font-mono">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span>Custo:</span>
                            <span className="font-extrabold text-foreground">{badge.xp_cost} XP</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                              {badge.category}
                            </Badge>
                            {!badge.active && (
                              <Badge variant="destructive" className="text-[10px]">
                                Inativo
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingInsignia({
                                ...badge,
                                color: badge.color || null,
                                bg_color: badge.bg_color || null,
                                border_color: badge.border_color || null,
                              });
                              setColorTab("icon");
                              setInsigniaEditorOpen(true);
                            }}
                            className="h-7 px-2.5 text-xs font-bold gap-1 hover:bg-accent"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteInsigniaCatalog(badge.id, badge.name)}
                            className="h-7 px-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            TAB 3: REGRAS DE XP & LIMITES DIÁRIOS
            ========================================================================= */}
        <TabsContent value="regras" className="space-y-4">
          {/* Header Card com Título e Ações */}
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary shrink-0" />
                    <span>Matriz de Regras de XP, Cooldowns e Limites</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Crie, edite, duplique ou exclua regras de concessão de XP e combate a spam por ações operacionais no sistema.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadData}
                    disabled={loading}
                    className="h-8 px-2.5 text-xs font-bold gap-1.5"
                    title="Recarregar regras"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                    <span>Sincronizar</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTriggerSelectorOpen(true)}
                    className="h-8 px-2.5 text-xs font-bold gap-1.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 shadow-xs cursor-pointer"
                    title="Pesquisar e selecionar todos os gatilhos da plataforma"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Gatilhos da Plataforma</span>
                    <span className="sm:hidden">Gatilhos</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-amber-500/15 text-amber-300 border-amber-500/30">
                      {allPlatformTriggers.length}
                    </Badge>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openCreateRule()}
                    className="h-8 px-3 text-xs font-extrabold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Nova Regra de XP</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
              {/* CARDS DE RESUMO OPERACIONAL */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-xl border border-border/50 bg-background/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground">Total de Regras</div>
                    <div className="text-lg font-black text-foreground">{ruleStats.total}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/50 bg-background/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground">Regras Ativas</div>
                    <div className="text-lg font-black text-emerald-400">{ruleStats.active}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/50 bg-background/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground">Pausadas / Inativas</div>
                    <div className="text-lg font-black text-amber-400">{ruleStats.inactive}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/50 bg-background/60 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground">Recompensa Média</div>
                    <div className="text-lg font-black text-purple-400">+{ruleStats.avgXp} XP</div>
                  </div>
                </div>
              </div>

              {/* ATALHOS DE CRIAÇÃO RÁPIDA (TEMPLATES) */}
              <div className="p-3 rounded-xl border border-border/40 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Modelos Rápidos de Regra (Clique para pré-preencher):
                  </span>
                  <span className="text-[11px] text-muted-foreground">Gatilhos comuns de Facção</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {RULE_TEMPLATES.map((tpl) => (
                    <Button
                      key={tpl.action_type}
                      variant="outline"
                      size="sm"
                      onClick={() => openCreateRule(tpl)}
                      className="h-7 text-xs px-2.5 rounded-lg border-border/60 hover:border-primary/50 hover:bg-primary/5 font-semibold gap-1"
                    >
                      <Plus className="w-3 h-3 text-primary" />
                      <span>{tpl.label}</span>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-0.5">
                        +{tpl.xp_reward}XP
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>

              {/* BARRA DE FILTROS & BUSCA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por gatilho, nome amigável ou descrição..."
                    value={ruleSearch}
                    onChange={(e) => setRuleSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                  {ruleSearch && (
                    <button
                      onClick={() => setRuleSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Select value={ruleCategoryFilter} onValueChange={setRuleCategoryFilter}>
                    <SelectTrigger className="w-[140px] sm:w-[160px] h-9 text-xs">
                      <Filter className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Categorias</SelectItem>
                      {availableCategories.map((c) => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={ruleStatusFilter}
                    onValueChange={(val: "all" | "active" | "inactive") => setRuleStatusFilter(val)}
                  >
                    <SelectTrigger className="w-[120px] sm:w-[130px] h-9 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="active">Apenas Ativas</SelectItem>
                      <SelectItem value="inactive">Apenas Inativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* TOTAL FILTRADO */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  Exibindo <strong className="text-foreground">{filteredRules.length}</strong> de{" "}
                  <strong className="text-foreground">{rules.length}</strong> regras configuradas
                </span>
                {(ruleSearch || ruleCategoryFilter !== "all" || ruleStatusFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRuleSearch("");
                      setRuleCategoryFilter("all");
                      setRuleStatusFilter("all");
                    }}
                    className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>

              {/* LISTAGEM VAZIA */}
              {filteredRules.length === 0 && (
                <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border/60 bg-muted/10 space-y-3">
                  <Sliders className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                  <div>
                    <h4 className="font-bold text-foreground text-sm">Nenhuma regra de XP encontrada</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ruleSearch || ruleCategoryFilter !== "all" || ruleStatusFilter !== "all"
                        ? "Tente ajustar os termos de busca ou remover os filtros aplicados."
                        : "Você ainda não possui regras de XP cadastradas."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openCreateRule()}
                    className="h-8 px-3 text-xs font-bold gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Criar Nova Regra
                  </Button>
                </div>
              )}

              {/* VISUALIZAÇÃO MOBILE (CARDS RESPONSIVOS SEM SCROLL LATERAL) */}
              {filteredRules.length > 0 && (
                <div className="md:hidden space-y-3">
                  {filteredRules.map((r) => (
                    <Card
                      key={r.action_type}
                      className={cn(
                        "border bg-background/80 p-3.5 rounded-xl shadow-xs space-y-2.5 transition-all",
                        r.enabled ? "border-border/60" : "border-border/30 opacity-70 bg-background/40"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-primary truncate">
                              {r.action_type}
                            </span>
                            {r.category && (
                              <Badge className={cn("text-[9px] font-bold px-1.5 py-0 capitalize", getCategoryBadgeColor(r.category))}>
                                {r.category}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-foreground text-sm mt-0.5">{r.name}</h4>
                          {r.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{r.description}</p>
                          )}
                        </div>
                        <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 font-mono font-bold text-xs shrink-0">
                          +{r.xp_reward} XP
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-mono flex-wrap">
                          <span>{formatCooldown(r.cooldown_seconds || 0)}</span>
                          <span>•</span>
                          <span className="text-foreground font-bold">{r.daily_cap > 0 ? `${r.daily_cap} XP/dia` : "Sem cap"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1.5 mr-1">
                            <Switch
                              id={`switch-mobile-${r.action_type}`}
                              checked={r.enabled}
                              onCheckedChange={() => handleToggleRuleStatus(r)}
                              className="scale-75"
                            />
                            <Label
                              htmlFor={`switch-mobile-${r.action_type}`}
                              className="text-[10px] font-bold cursor-pointer"
                            >
                              {r.enabled ? (
                                <span className="text-emerald-400">Ativo</span>
                              ) : (
                                <span className="text-muted-foreground">Inativo</span>
                              )}
                            </Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateRule(r)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Duplicar regra"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRuleEditor(r)}
                            className="h-7 px-2 text-xs font-bold gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePromptDeleteRule(r)}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Excluir regra"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* VISUALIZAÇÃO DESKTOP (TABELA) */}
              {filteredRules.length > 0 && (
                <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-background/50">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          <th className="py-3 px-4">Gatilho de Ação</th>
                          <th className="py-3 px-3">Categoria</th>
                          <th className="py-3 px-4">Nome da Ação & Descrição</th>
                          <th className="py-3 px-3 text-center">Recompensa</th>
                          <th className="py-3 px-3 text-center">Cooldown</th>
                          <th className="py-3 px-3 text-center">Limite Diário</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredRules.map((r) => (
                          <tr
                            key={r.action_type}
                            className={cn(
                              "hover:bg-accent/20 transition-colors",
                              !r.enabled && "opacity-60 bg-muted/5"
                            )}
                          >
                            <td className="py-3 px-4 font-mono text-xs font-bold text-primary">
                              <span className="bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                {r.action_type}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {r.category ? (
                                <Badge className={cn("text-[10px] font-bold px-2 py-0.5 capitalize", getCategoryBadgeColor(r.category))}>
                                  {r.category}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">geral</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-foreground text-sm">{r.name}</div>
                              {r.description ? (
                                <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>
                              ) : (
                                <div className="text-xs text-muted-foreground/60 italic">Sem descrição</div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 font-mono font-bold">
                                +{r.xp_reward} XP
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-xs text-muted-foreground">
                              {formatCooldown(r.cooldown_seconds || 0)}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-xs font-bold text-foreground">
                              {r.daily_cap > 0 ? `${r.daily_cap} XP/dia` : "Sem limite"}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Switch
                                  id={`switch-table-${r.action_type}`}
                                  checked={r.enabled}
                                  onCheckedChange={() => handleToggleRuleStatus(r)}
                                  className="scale-75"
                                />
                                <Label
                                  htmlFor={`switch-table-${r.action_type}`}
                                  className="text-[11px] font-bold cursor-pointer"
                                >
                                  {r.enabled ? (
                                    <span className="text-emerald-400">Ativo</span>
                                  ) : (
                                    <span className="text-muted-foreground">Inativo</span>
                                  )}
                                </Label>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicateRule(r)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  title="Duplicar regra"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRuleEditor(r)}
                                  className="h-8 px-2.5 text-xs font-bold gap-1 hover:bg-accent"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePromptDeleteRule(r)}
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  title="Excluir regra"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* =========================================================================
            TAB 4: HISTÓRICO GLOBAL & AUDITORIA DE XP
            ========================================================================= */}
        <TabsContent value="auditoria" className="space-y-4">
          <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Auditoria Imutável de Transações de XP</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Registros completos de pontuação, deduplicação, ajustes manuais dev e condecorações.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadData}
                  disabled={loading}
                  className="h-8 text-xs font-bold gap-1.5 w-full sm:w-auto"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                  <span>Recarregar Logs</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 pt-2">
              {/* VISUALIZAÇÃO MOBILE (CARDS RESPONSIVOS SEM SCROLL LATERAL) */}
              <div className="md:hidden space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs font-sans">
                    Nenhuma transação registrada.
                  </div>
                ) : (
                  transactions.map((tx) => {
                    const isPositive = (tx.amount || 0) >= 0;
                    return (
                      <Card key={tx.id} className="border border-border/60 bg-background/80 p-3 rounded-xl shadow-xs space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {tx.avatar_url && (
                              <img
                                src={tx.avatar_url}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                            )}
                            <span className="font-bold text-foreground truncate">
                              {tx.member_nickname || tx.member_name || tx.user_id.slice(0, 8)}
                            </span>
                          </div>
                          <Badge
                            className={cn(
                              "font-bold text-xs px-2 py-0.5 shrink-0",
                              isPositive
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            )}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount} XP
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                          <span>{new Date(tx.created_at).toLocaleString("pt-BR")}</span>
                          <span>
                            {tx.xp_before} ➔ <strong className="text-foreground">{tx.xp_after}</strong>
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px]">
                          <Badge variant="outline" className="font-mono text-[9px] uppercase shrink-0">
                            {tx.action_type}
                          </Badge>
                          <span className="text-muted-foreground truncate leading-tight">
                            {tx.description}
                          </span>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* VISUALIZAÇÃO DESKTOP (TABELA) */}
              <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-background/50">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3 px-4">Data / Hora</th>
                        <th className="py-3 px-4">Membro</th>
                        <th className="py-3 px-4 text-center">Movimentação</th>
                        <th className="py-3 px-4 text-center">Saldo (Antes ➔ Depois)</th>
                        <th className="py-3 px-4">Ação / Tipo</th>
                        <th className="py-3 px-4">Justificativa / Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-xs">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground font-sans">
                            Nenhuma transação registrada.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx) => {
                          const isPositive = (tx.amount || 0) >= 0;
                          return (
                            <tr key={tx.id} className="hover:bg-accent/20 transition-colors">
                              <td className="py-3 px-4 text-muted-foreground">
                                {new Date(tx.created_at).toLocaleString("pt-BR")}
                              </td>
                              <td className="py-3 px-4 font-sans font-bold text-foreground">
                                <div className="flex items-center gap-2">
                                  {tx.avatar_url && (
                                    <img
                                      src={tx.avatar_url}
                                      alt=""
                                      className="w-5 h-5 rounded-full object-cover shrink-0"
                                    />
                                  )}
                                  <span>{tx.member_nickname || tx.member_name || tx.user_id.slice(0, 8)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge
                                  className={cn(
                                    "font-bold text-xs px-2 py-0.5",
                                    isPositive
                                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                      : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                  )}
                                >
                                  {isPositive ? `+${tx.amount}` : tx.amount} XP
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-center text-muted-foreground">
                                {tx.xp_before} ➔ <span className="text-foreground font-bold">{tx.xp_after}</span>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                  {tx.action_type}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 font-sans text-xs text-muted-foreground max-w-xs truncate">
                                {tx.description}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* =========================================================================
          MODAL 1: AJUSTAR XP MANUALMENTE
          ========================================================================= */}
      <Dialog open={xpModalOpen} onOpenChange={setXpModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Ajuste Manual de XP (Dev Override)
            </DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <span>
                  Membro: <strong>{selectedMember.nickname || selectedMember.nome}</strong> (Saldo Atual:{" "}
                  <strong>{selectedMember.xp} XP</strong>, Nível {selectedMember.gamification_level})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Modo de Operação</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={xpMode === "add" ? "default" : "outline"}
                  onClick={() => setXpMode("add")}
                  className="font-bold text-xs h-9"
                >
                  Adicionar / Subtrair (+/-)
                </Button>
                <Button
                  type="button"
                  variant={xpMode === "set" ? "default" : "outline"}
                  onClick={() => setXpMode("set")}
                  className="font-bold text-xs h-9"
                >
                  Definir Saldo Fixo (=)
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="xp-amount" className="text-xs font-bold">
                {xpMode === "set" ? "Novo Saldo Exato de XP" : "Quantidade de XP a Conceder/Deduzir"}
              </Label>
              <Input
                id="xp-amount"
                type="number"
                value={xpAmount}
                onChange={(e) => setXpAmount(Number(e.target.value))}
                placeholder="Ex: 50 ou -20"
                className="font-mono text-lg font-extrabold"
              />
              <span className="text-[11px] text-muted-foreground">
                {xpMode === "set"
                  ? "O saldo total do membro será fixado exatamente neste valor."
                  : "Valores positivos adicionam XP; valores negativos subtraem XP."}
              </span>
            </div>

            {/* Prévia do cálculo */}
            {previewCalculation && (
              <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Previsão de Saldo:</span>
                  <span className="font-mono font-extrabold text-foreground">
                    {previewCalculation.curXp} ➔ {previewCalculation.finalXp} XP (
                    {previewCalculation.delta >= 0 ? `+${previewCalculation.delta}` : previewCalculation.delta})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Previsão de Nível:</span>
                  <Badge className="bg-purple-500/20 text-purple-300 font-extrabold text-xs">
                    Nível {previewCalculation.level} — {previewCalculation.title}
                  </Badge>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="xp-reason" className="text-xs font-bold">
                Justificativa Obrigatória (Auditoria Dev) *
              </Label>
              <Textarea
                id="xp-reason"
                value={xpReason}
                onChange={(e) => setXpReason(e.target.value)}
                placeholder="Ex: Bonificação por liderança exemplar em operação especial ou estorno corretivo."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setXpModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteXpAdjustment}
              disabled={xpSubmitting || !xpReason.trim()}
              className="font-extrabold bg-primary text-primary-foreground"
            >
              {xpSubmitting ? "Gravando no Banco..." : "Confirmar Ajuste de XP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: DEFINIR NÍVEL MANUALMENTE
          ========================================================================= */}
      <Dialog open={levelModalOpen} onOpenChange={setLevelModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-md bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Definição Manual de Nível
            </DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <span>
                  Membro: <strong>{selectedMember.nickname || selectedMember.nome}</strong> (Nível Atual:{" "}
                  <strong>{selectedMember.gamification_level}</strong>)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="target-level" className="text-xs font-bold">
                Nível Desejado (1 a 50+)
              </Label>
              <Input
                id="target-level"
                type="number"
                min={1}
                max={100}
                value={targetLevel}
                onChange={(e) => setTargetLevel(Math.max(1, Number(e.target.value)))}
                className="font-mono text-lg font-extrabold"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="sync-xp" className="text-xs font-bold cursor-pointer">
                  Sincronizar XP com a marca mínima do nível
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Se ativado, atualiza o saldo de XP do membro para o mínimo daquele patamar.
                </p>
              </div>
              <Switch id="sync-xp" checked={syncXpWithLevel} onCheckedChange={setSyncXpWithLevel} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="level-reason" className="text-xs font-bold">
                Justificativa Obrigatória (Auditoria) *
              </Label>
              <Textarea
                id="level-reason"
                value={levelReason}
                onChange={(e) => setLevelReason(e.target.value)}
                placeholder="Ex: Promovido à patente de liderança com enquadramento de nível imediato."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setLevelModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteLevelChange}
              disabled={levelSubmitting || !levelReason.trim()}
              className="font-extrabold bg-primary text-primary-foreground"
            >
              {levelSubmitting ? "Atualizando..." : "Aplicar Novo Nível"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 3: CONCEDER INSÍGNIA (DEV BYPASS)
          ========================================================================= */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Conceder Insígnia (Dev Bypass)
            </DialogTitle>
            <DialogDescription>
              {selectedMember && (
                <span>
                  Beneficiário: <strong>{selectedMember.nickname || selectedMember.nome}</strong>. Concessão com
                  isenção de custo de XP (Bypass de Desenvolvedor).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Selecione a Insígnia do Catálogo *</Label>
              {insignias.filter((b) => b.active && !selectedMemberOwnedInsigniaIds.has(b.id)).length === 0 ? (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300">
                  Este membro já possui todas as insígnias ativas disponíveis no catálogo.
                </div>
              ) : (
                <Select value={selectedInsigniaId} onValueChange={setSelectedInsigniaId}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Escolha a insígnia..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {insignias
                      .filter((b) => b.active && !selectedMemberOwnedInsigniaIds.has(b.id))
                      .map((badge) => {
                        const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;
                        return (
                          <SelectItem key={badge.id} value={badge.id}>
                            <div className="flex items-center gap-2">
                              <span className={cn("font-bold", rarity.textClass)}>[{rarity.label}]</span>
                              <span>{badge.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">({badge.xp_cost} XP)</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Isenção Dev:</strong> O saldo de XP do membro e do desenvolvedor não será debitado nesta
                operação.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grant-reason" className="text-xs font-bold">
                Motivo / Justificativa da Condecoração *
              </Label>
              <Textarea
                id="grant-reason"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Ex: Reconhecimento por bravura e zelo exemplar durante o comboio de segurança."
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setGrantModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteGrantInsignia}
              disabled={grantSubmitting || !selectedInsigniaId || !grantReason.trim()}
              className="font-extrabold bg-amber-500 hover:bg-amber-600 text-black shadow-sm"
            >
              {grantSubmitting ? "Concedendo..." : "Conceder Condecoração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 4: GERENCIAR INSÍGNIAS CONCEDIDAS AO MEMBRO
          ========================================================================= */}
      <Dialog open={memberInsigniasModalOpen} onOpenChange={setMemberInsigniasModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-xl bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 w-full pr-6">
              <div>
                <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Insígnias de {selectedMember?.nickname || selectedMember?.nome}
                </DialogTitle>
                <DialogDescription>
                  Lista de todas as condecorações ativas deste membro. Você pode editar justificativas ou revogá-las.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                className="font-extrabold gap-1.5 bg-amber-500 hover:bg-amber-600 text-black shadow-sm shrink-0"
                onClick={() => {
                  setMemberInsigniasModalOpen(false);
                  setTimeout(() => {
                    if (selectedMember) {
                      handleOpenGrantModal(selectedMember);
                    }
                  }, 100);
                }}
              >
                <Plus className="w-4 h-4" />
                Conceder Insígnia
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {loadingMemberBadges ? (
              <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
                Carregando condecorações do membro...
              </div>
            ) : memberBadges.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Este membro ainda não possui nenhuma insígnia conquistada.
              </div>
            ) : (
              memberBadges.map((grant) => {
                const b = grant.insignia;
                const rarityStyle = b?.rarity ? RARITY_CONFIG[b.rarity] : RARITY_CONFIG.comum;
                const iconStyle = b ? getInsigniaIconStyles(b) : undefined;
                const cardStyle = b ? getInsigniaCardStyles(b) : undefined;
                return (
                  <div
                    key={grant.id}
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between gap-3 backdrop-blur-sm",
                      !cardStyle && rarityStyle.borderClass,
                      !cardStyle && rarityStyle.bgClass
                    )}
                    style={cardStyle}
                  >
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-start gap-3 w-full">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner mt-1",
                              !iconStyle && rarityStyle.borderClass,
                              !iconStyle && rarityStyle.bgClass,
                              !iconStyle && rarityStyle.textClass
                            )}
                            style={iconStyle}
                          >
                            <DynamicInsigniaIcon name={b?.icon || "Award"} className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-foreground">{b?.name || grant.insignia_id}</h4>
                              <Badge className={cn("text-[9px] font-bold uppercase", rarityStyle.textClass)}>
                                {rarityStyle.label}
                              </Badge>
                            </div>

                            {editingGrantId === grant.id ? (
                              <div className="mt-2 space-y-2">
                                <Textarea
                                  value={editGrantReason}
                                  onChange={(e) => setEditGrantReason(e.target.value)}
                                  className="text-xs min-h-[60px]"
                                  placeholder="Nova justificativa..."
                                  disabled={editGrantSubmitting}
                                />
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => handleSaveEditedInsigniaReason(grant.id)}
                                    disabled={editGrantSubmitting}
                                  >
                                    Salvar
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => {
                                      setEditingGrantId(null);
                                      setEditGrantReason("");
                                    }}
                                    disabled={editGrantSubmitting}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5" title={grant.reason || b?.description}>
                                  {grant.reason || b?.description}
                                </p>
                                <div className="text-[10px] text-muted-foreground font-mono mt-1">
                                  Concedido em {new Date(grant.granted_at).toLocaleDateString("pt-BR")} por{" "}
                                  <strong>{grant.grantor_name}</strong>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          {editingGrantId !== grant.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingGrantId(grant.id);
                                setEditGrantReason(grant.reason || "");
                              }}
                              className="h-7 px-2 text-[10px] font-bold gap-1 w-full"
                            >
                              <Edit3 className="w-3 h-3" />
                              Editar
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevokeInsignia(grant.insignia_id, b?.name || grant.insignia_id)}
                            disabled={revokingId === grant.insignia_id}
                            className="h-7 px-2 text-[10px] font-bold gap-1 w-full"
                          >
                            <Trash2 className="w-3 h-3" />
                            Revogar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberInsigniasModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 5: CRIAR / EDITAR INSÍGNIA NO CATÁLOGO
          ========================================================================= */}
      <Dialog open={insigniaEditorOpen} onOpenChange={setInsigniaEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-xl bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              {editingInsignia?.id && insignias.some((i) => i.id === editingInsignia.id)
                ? "Editar Insígnia do Catálogo"
                : "Criar Nova Insígnia Oficial"}
            </DialogTitle>
            <DialogDescription>
              Configure identificador, nome, custo em XP e parâmetros visuais exclusivos (fundo, borda e ícone).
            </DialogDescription>
          </DialogHeader>

          {editingInsignia && (() => {
            const previewRarity = RARITY_CONFIG[(editingInsignia.rarity as InsigniaRarity) || "comum"] || RARITY_CONFIG.comum;
            const previewStyle = getInsigniaIconStyles(editingInsignia);
            const previewCardStyle = getInsigniaCardStyles(editingInsignia);
            const hasCustomColor = Boolean(editingInsignia.color || editingInsignia.bg_color || editingInsignia.border_color);

            return (
              <div className="space-y-4 py-2">
                {/* ── PREVIEW AO VIVO ── */}
                <div
                  className={cn(
                    "flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-200",
                    !previewCardStyle && "bg-secondary/30 border-border/60"
                  )}
                  style={previewCardStyle}
                >
                  <div
                    className={cn(
                      "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 border-2 shadow-inner transition-all duration-200",
                      !previewStyle && previewRarity.bgClass,
                      !previewStyle && previewRarity.borderClass,
                      !previewStyle && previewRarity.textClass
                    )}
                    style={previewStyle}
                  >
                    <DynamicInsigniaIcon name={editingInsignia.icon || "Award"} className="h-7 w-7" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-foreground truncate">
                        {editingInsignia.name || "Nome da Insígnia"}
                      </span>
                      <Badge className={cn("text-[9px] font-extrabold uppercase px-1.5 py-0 border", previewRarity.borderClass, previewRarity.bgClass, previewRarity.textClass)}>
                        {previewRarity.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {hasCustomColor ? "Cores personalizadas ativas (Fundo / Borda / Ícone)" : `Cores padrão da raridade (${previewRarity.label})`}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {editingInsignia.bg_color && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                          <div className="h-2.5 w-2.5 rounded-sm border border-white/20" style={{ backgroundColor: editingInsignia.bg_color }} />
                          <span>Fundo: {editingInsignia.bg_color}</span>
                        </div>
                      )}
                      {editingInsignia.border_color && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                          <div className="h-2.5 w-2.5 rounded-sm border-2" style={{ borderColor: editingInsignia.border_color }} />
                          <span>Borda: {editingInsignia.border_color}</span>
                        </div>
                      )}
                      {editingInsignia.color && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
                          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: editingInsignia.color }} />
                          <span>Ícone: {editingInsignia.color}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasCustomColor && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingInsignia({
                          ...editingInsignia,
                          color: null,
                          bg_color: null,
                          border_color: null,
                        })
                      }
                      className="h-7 text-[10px] text-muted-foreground hover:text-rose-400 gap-1 shrink-0"
                    >
                      <RefreshCw className="h-3 w-3" /> Resetar
                    </Button>
                  )}
                </div>

                {/* ── IDENTIFICADOR E NOME ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="badge-id" className="text-xs font-bold">
                      Identificador (ID) *
                    </Label>
                    <Input
                      id="badge-id"
                      disabled={Boolean(insignias.some((i) => i.id === editingInsignia.id))}
                      value={editingInsignia.id || ""}
                      onChange={(e) => setEditingInsignia({ ...editingInsignia, id: e.target.value })}
                      placeholder="ex: guardiao_asfalto"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="badge-name" className="text-xs font-bold">
                      Nome Oficial *
                    </Label>
                    <Input
                      id="badge-name"
                      value={editingInsignia.name || ""}
                      onChange={(e) => setEditingInsignia({ ...editingInsignia, name: e.target.value })}
                      placeholder="Ex: Guardião do Asfalto"
                      className="text-xs font-bold"
                    />
                  </div>
                </div>

                {/* ── RARIDADE, CUSTO E ÍCONE ── */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Raridade</Label>
                    <Select
                      value={editingInsignia.rarity || "comum"}
                      onValueChange={(val: any) => setEditingInsignia({ ...editingInsignia, rarity: val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comum">Comum</SelectItem>
                        <SelectItem value="raro">Raro</SelectItem>
                        <SelectItem value="epico">Épico</SelectItem>
                        <SelectItem value="lendario">Lendário</SelectItem>
                        <SelectItem value="mitico">Mítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="badge-cost" className="text-xs font-bold">
                      Custo em XP
                    </Label>
                    <Input
                      id="badge-cost"
                      type="number"
                      min={0}
                      value={editingInsignia.xp_cost || 0}
                      onChange={(e) => setEditingInsignia({ ...editingInsignia, xp_cost: Number(e.target.value) })}
                      className="h-9 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 flex flex-col items-start justify-center">
                    <Label htmlFor="badge-icon" className="text-xs font-bold">
                      Ícone Lucide
                    </Label>
                    <IconPicker
                      value={editingInsignia.icon || "Award"}
                      onChange={(val) => setEditingInsignia({ ...editingInsignia, icon: val })}
                    >
                      <Button variant="outline" className="w-full justify-start h-9 text-xs px-3">
                        <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                          <DynamicInsigniaIcon name={editingInsignia.icon || "Award"} className="w-4 h-4 shrink-0 text-primary" />
                          <span className="truncate">{editingInsignia.icon || "Award"}</span>
                        </div>
                      </Button>
                    </IconPicker>
                  </div>
                </div>

                {/* ── SELETOR DE CORES INDEPENDENTES (FUNDO / BORDA / ÍCONE) ── */}
                <div className="rounded-2xl border border-border/70 overflow-hidden bg-background/40">
                  <div className="flex border-b border-border/60 bg-muted/30">
                    {([
                      { id: "bg" as const, label: "Fundo", color: editingInsignia.bg_color },
                      { id: "border" as const, label: "Borda", color: editingInsignia.border_color },
                      { id: "icon" as const, label: "Ícone", color: editingInsignia.color },
                    ]).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setColorTab(tab.id)}
                        className={cn(
                          "flex-1 py-2 px-3 text-xs font-extrabold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer",
                          colorTab === tab.id
                            ? "border-primary text-foreground bg-accent/40"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/20"
                        )}
                      >
                        <span>{tab.label}</span>
                        {tab.color ? (
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-white/40 shrink-0"
                            style={{ backgroundColor: tab.color }}
                          />
                        ) : (
                          <span className="text-[10px] font-normal text-muted-foreground/60">(padrão)</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="p-3.5 space-y-2">
                    {colorTab === "bg" && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-2">
                          Cor de preenchimento do escudo/fundo do emblema. Deixe vazio para usar a cor padrão da raridade.
                        </p>
                        <ColorPickerField
                          label="Cor de Fundo do Emblema"
                          value={editingInsignia.bg_color}
                          onChange={(val) => setEditingInsignia({ ...editingInsignia, bg_color: val })}
                          placeholder="#1e1b4b ou rgba(30,27,75,0.8)"
                        />
                      </div>
                    )}

                    {colorTab === "border" && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-2">
                          Cor do contorno/borda do emblema e do card. Deixe vazio para usar o contorno padrão da raridade.
                        </p>
                        <ColorPickerField
                          label="Cor da Borda do Emblema"
                          value={editingInsignia.border_color}
                          onChange={(val) => setEditingInsignia({ ...editingInsignia, border_color: val })}
                          placeholder="#a855f7 ou #eab308"
                        />
                      </div>
                    )}

                    {colorTab === "icon" && (
                      <div>
                        <p className="text-[11px] text-muted-foreground mb-2">
                          Cor do símbolo/ícone Lucide no centro do emblema. Deixe vazio para usar a cor padrão da raridade.
                        </p>
                        <ColorPickerField
                          label="Cor do Ícone / Símbolo"
                          value={editingInsignia.color}
                          onChange={(val) => setEditingInsignia({ ...editingInsignia, color: val })}
                          placeholder="#facc15 ou #38bdf8"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* ── DESCRIÇÃO ── */}
                <div className="space-y-1.5">
                  <Label htmlFor="badge-desc" className="text-xs font-bold">
                    Descrição / Critério de Conquista
                  </Label>
                  <Textarea
                    id="badge-desc"
                    value={editingInsignia.description || ""}
                    onChange={(e) => setEditingInsignia({ ...editingInsignia, description: e.target.value })}
                    placeholder="Critérios exigidos para que a diretoria conceda esta distinção..."
                    rows={2}
                    className="text-xs"
                  />
                </div>

                {/* ── ATIVA/INATIVA ── */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="badge-active" className="text-xs font-bold cursor-pointer">
                      Insígnia Ativa para Concessão
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Quando desativada, não aparece na lista de condecoração para novos membros.
                    </p>
                  </div>
                  <Switch
                    id="badge-active"
                    checked={editingInsignia.active !== false}
                    onCheckedChange={(checked) => setEditingInsignia({ ...editingInsignia, active: checked })}
                  />
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setInsigniaEditorOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveInsigniaCatalog}
              disabled={insigniaSubmitting || !editingInsignia?.name?.trim()}
              className="font-extrabold bg-primary text-primary-foreground"
            >
              {insigniaSubmitting ? "Salvando..." : "Salvar no Catálogo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 6: CRIAR OU EDITAR REGRA DE XP
          ========================================================================= */}
      <Dialog open={ruleEditorOpen} onOpenChange={setRuleEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              {isCreatingRule ? (
                <>
                  <PlusCircle className="w-5 h-5 text-primary" />
                  <span>Criar Nova Regra de XP</span>
                </>
              ) : (
                <>
                  <Sliders className="w-5 h-5 text-primary" />
                  <span>Editar Regra de XP & Cooldown</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isCreatingRule ? (
                "Configure uma nova regra de pontuação para recompensar ações de membros no sistema."
              ) : (
                <span>
                  Gatilho: <strong className="font-mono text-primary">{editingRule?.action_type}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {editingRule && (
            <div className="space-y-4 py-2">
              {/* CAMPO GATILHO (action_type) */}
              {isCreatingRule ? (
                <div className="space-y-2.5 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <Label htmlFor="rule-action-type" className="text-xs font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Identificador do Gatilho (action_type) *
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setTriggerSelectorOpen(true)}
                      className="h-7 text-[11px] font-bold gap-1.5 border-primary/40 bg-background text-primary hover:bg-primary/10 shadow-xs cursor-pointer"
                    >
                      <Search className="w-3 h-3 text-primary" />
                      <span>Pesquisar e Selecionar Gatilhos</span>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-primary/15 text-primary border-primary/30">
                        {allPlatformTriggers.length}
                      </Badge>
                    </Button>
                  </div>

                  {/* Seleção rápida em lista suspensa */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold">Escolha rápida da plataforma:</span>
                    <Select
                      value={allPlatformTriggers.some((t) => t.action_type === editingRule.action_type) ? (editingRule.action_type || "") : ""}
                      onValueChange={(val) => {
                        const match = allPlatformTriggers.find((t) => t.action_type === val);
                        if (match) handleSelectPlatformTrigger(match);
                        else setEditingRule({ ...editingRule, action_type: val });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background/90">
                        <SelectValue placeholder="Ou selecione um evento oficial da lista suspensa..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {allPlatformTriggers.map((t) => (
                          <SelectItem key={t.action_type} value={t.action_type} className="text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{t.name}</span>
                              <code className="text-[10px] font-mono text-muted-foreground">({t.action_type})</code>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Input direto / custom slug */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-semibold">Identificador Slug (ou digite personalizado):</span>
                    <div className="relative">
                      <Input
                        id="rule-action-type"
                        placeholder="ex: producao_coca, entrega_maleta, sale_completed"
                        value={editingRule.action_type || ""}
                        onChange={(e) => {
                          const slug = e.target.value
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9_-]/g, "_");
                          setEditingRule({ ...editingRule, action_type: slug });
                        }}
                        className="font-mono text-xs font-bold pl-3 pr-20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setTriggerSelectorOpen(true)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 px-2 text-[10px] font-bold text-muted-foreground hover:text-primary gap-1"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Catálogo</span>
                      </Button>
                    </div>
                  </div>

                  {/* Detalhes do gatilho se detectado */}
                  {(() => {
                    const matched = allPlatformTriggers.find((t) => t.action_type === editingRule.action_type);
                    if (matched) {
                      return (
                        <div className="p-2.5 rounded-lg bg-background/80 border border-primary/30 text-[11px] space-y-1">
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-foreground flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              {matched.name}
                            </span>
                            <Badge variant="outline" className={cn("text-[9px] capitalize", getCategoryBadgeColor(matched.category))}>
                              {matched.category_label || matched.category}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            {matched.description}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Slug do sistema disparado pelos eventos de backend e painéis. Clique em <strong>Pesquisar e Selecionar Gatilhos</strong> para escolher com busca e filtros.
                  </p>

                  {/* Sugestões de prefixo */}
                  <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">Prefixos:</span>
                    {["producao_", "venda_", "entrega_", "coleta_", "evento_", "meta_"].map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => {
                          const cur = editingRule.action_type || "";
                          if (!cur.startsWith(pref)) {
                            setEditingRule({ ...editingRule, action_type: pref + cur.replace(/^[a-z]+_/, "") });
                          }
                        }}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border/60 hover:border-primary/50 text-foreground cursor-pointer transition-colors"
                      >
                        +{pref}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Gatilho do Sistema:</span>
                    <code className="font-mono text-xs font-bold text-primary">{editingRule.action_type}</code>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTriggerSearch(editingRule.action_type || "");
                      setTriggerSelectorOpen(true);
                    }}
                    className="h-6 text-[10px] px-2 text-muted-foreground hover:text-primary gap-1 shrink-0"
                  >
                    <Search className="w-3 h-3" />
                    Ver no Catálogo de Gatilhos
                  </Button>
                </div>
              )}

              {/* NOME AMIGÁVEL & CATEGORIA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="rule-name" className="text-xs font-bold">
                    Nome Amigável da Regra
                  </Label>
                  <Input
                    id="rule-name"
                    placeholder="Ex: Entrega de Carga Pesada"
                    value={editingRule.name || ""}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    className="text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rule-category" className="text-xs font-bold">
                    Categoria
                  </Label>
                  <div className="space-y-1">
                    <Input
                      id="rule-category"
                      placeholder="vendas, producao..."
                      value={editingRule.category || ""}
                      onChange={(e) => setEditingRule({ ...editingRule, category: e.target.value.toLowerCase() })}
                      className="text-xs font-semibold lowercase"
                      list="categories-datalist"
                    />
                    <datalist id="categories-datalist">
                      {availableCategories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* RECOMPENSA, COOLDOWN, LIMITE DIÁRIO */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rule-reward" className="text-xs font-bold">
                    Recompensa (XP)
                  </Label>
                  <Input
                    id="rule-reward"
                    type="text"
                    inputMode="decimal"
                    value={editRewardStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      setEditRewardStr(val);
                    }}
                    className="font-mono text-xs font-bold"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold">Cooldown (Intervalo)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={editCooldownStr}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                        setEditCooldownStr(val);
                      }}
                      className="font-mono text-xs font-bold w-1/2"
                    />
                    <Select
                      value={String(cooldownUnit)}
                      onValueChange={(valStr) => {
                        const unit = Number(valStr);
                        setCooldownUnit(unit);
                      }}
                    >
                      <SelectTrigger className="w-1/2 h-9 text-xs font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Segundos</SelectItem>
                        <SelectItem value="60">Minutos</SelectItem>
                        <SelectItem value="3600">Horas</SelectItem>
                        <SelectItem value="86400">Dias</SelectItem>
                        <SelectItem value="604800">Semanas</SelectItem>
                        <SelectItem value="2592000">Meses</SelectItem>
                        <SelectItem value="31536000">Anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rule-cap" className="text-xs font-bold">
                    Limite Diário (Cap)
                  </Label>
                  <Input
                    id="rule-cap"
                    type="text"
                    inputMode="decimal"
                    value={editCapStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, '');
                      setEditCapStr(val);
                    }}
                    className="font-mono text-xs font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">0 = sem limite</p>
                </div>
              </div>

              {/* DESCRIÇÃO */}
              <div className="space-y-1.5">
                <Label htmlFor="rule-desc" className="text-xs font-bold">
                  Descrição Operacional da Regra
                </Label>
                <Textarea
                  id="rule-desc"
                  placeholder="Explique quando o membro ganha este XP e detalhes da regra..."
                  value={editingRule.description || ""}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  rows={2}
                  className="text-xs"
                />
              </div>

              {/* STATUS ATIVO / INATIVO */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-background/50">
                <div>
                  <Label htmlFor="rule-enabled" className="text-xs font-bold cursor-pointer">
                    Regra Ativa no Sistema
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Quando desativada, nenhuma pontuação de XP será concedida para esta ação.
                  </p>
                </div>
                <Switch
                  id="rule-enabled"
                  checked={editingRule.enabled !== false}
                  onCheckedChange={(checked) => setEditingRule({ ...editingRule, enabled: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRuleEditorOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveXpRule}
              disabled={ruleSubmitting}
              className="font-extrabold bg-primary text-primary-foreground"
            >
              {ruleSubmitting
                ? "Salvando..."
                : isCreatingRule
                ? "Criar Regra de XP"
                : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 7: CONFIRMAR EXCLUSÃO DE REGRA DE XP
          ========================================================================= */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5 text-destructive" />
              <span>Excluir Regra de XP</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir esta regra de concessão de XP?
            </DialogDescription>
          </DialogHeader>

          {ruleToDelete && (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 space-y-1.5">
                <div className="font-bold text-foreground text-sm flex items-center justify-between">
                  <span>{ruleToDelete.name}</span>
                  <Badge variant="destructive" className="font-mono text-xs">
                    +{ruleToDelete.xp_reward} XP
                  </Badge>
                </div>
                <div className="font-mono text-xs text-primary font-bold">
                  Gatilho: {ruleToDelete.action_type}
                </div>
                {ruleToDelete.description && (
                  <p className="text-xs text-muted-foreground">{ruleToDelete.description}</p>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1 bg-muted/20 p-2.5 rounded-lg border border-border/50">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Impacto da exclusão:
                </div>
                <p>
                  A partir do momento em que for excluída, ações do sistema associadas ao gatilho{" "}
                  <code className="text-primary font-bold font-mono">{ruleToDelete.action_type}</code> não concederão mais XP.
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  O histórico de transações já recebidas por membros no passado não será perdido.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setRuleToDelete(null);
              }}
              disabled={ruleSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteRule}
              disabled={ruleSubmitting}
              className="font-extrabold gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {ruleSubmitting ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: PESQUISAR E SELECIONAR GATILHOS DA PLATAFORMA
          ========================================================================= */}
      <Dialog open={triggerSelectorOpen} onOpenChange={setTriggerSelectorOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col w-[95vw] sm:max-w-3xl bg-card/95 border-border backdrop-blur-md p-0">
          <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border/60">
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Gatilhos da Plataforma Twin Wheels</span>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs ml-1">
                {allPlatformTriggers.length} disponíveis
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pesquise e selecione qualquer evento da plataforma para preencher e vincular automaticamente a sua regra de XP.
            </DialogDescription>

            {/* Barra de Busca de Gatilhos */}
            <div className="pt-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por slug (ex: sale_completed), nome amigável ou categoria..."
                value={triggerSearch}
                onChange={(e) => setTriggerSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
                autoFocus
              />
              {triggerSearch && (
                <button
                  type="button"
                  onClick={() => setTriggerSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Categorias Pills */}
            <div className="flex items-center gap-1.5 pt-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              {[
                { id: "all", label: "Todos" },
                { id: "vendas", label: "Vendas & Comercial" },
                { id: "producao", label: "Produção & Oficinas" },
                { id: "estoque", label: "Logística & Baús" },
                { id: "metas", label: "Metas & Desempenho" },
                { id: "presenca", label: "Presença & Operações" },
                { id: "suporte", label: "Suporte & Tickets" },
                { id: "lideranca", label: "Liderança & Avaliações" },
                { id: "social", label: "Social & Mural" },
                { id: "geral", label: "Sistema & Gamificação" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setTriggerCategoryFilter(cat.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer border",
                    triggerCategoryFilter === cat.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </DialogHeader>

          {/* Lista de Gatilhos com Scroll */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 max-h-[60vh]">
            {filteredTriggers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <Search className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">Nenhum gatilho encontrado para "{triggerSearch}".</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTriggerSearch("");
                    setTriggerCategoryFilter("all");
                  }}
                  className="h-7 text-xs"
                >
                  Limpar Busca
                </Button>
              </div>
            ) : (
              filteredTriggers.map((t) => {
                const isConfigured = rules.some((r) => r.action_type === t.action_type);
                const isSelected = editingRule?.action_type === t.action_type;

                return (
                  <div
                    key={t.action_type}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                      isSelected
                        ? "bg-primary/10 border-primary/50 shadow-xs ring-1 ring-primary/40"
                        : "bg-background/60 border-border/60 hover:border-primary/40 hover:bg-accent/20"
                    )}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-foreground text-xs sm:text-sm">
                          {t.name}
                        </span>
                        <code className="text-[10px] font-mono font-bold bg-muted/80 text-primary px-1.5 py-0.5 rounded border border-border/60">
                          {t.action_type}
                        </code>
                        <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", getCategoryBadgeColor(t.category))}>
                          {t.category_label || t.category}
                        </Badge>
                        {isConfigured ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] px-1.5 py-0">
                            ✓ Regra Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                            Disponível
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t.description}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono pt-0.5 flex-wrap">
                        <span>Sugerido: <strong className="text-foreground">+{t.default_xp} XP</strong></span>
                        <span>•</span>
                        <span>Cooldown: <strong className="text-foreground">{formatCooldown(t.default_cooldown)}</strong></span>
                        <span>•</span>
                        <span>Limite Diário: <strong className="text-foreground">{t.default_cap}x</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (!ruleEditorOpen) {
                            openCreateRule({
                              action_type: t.action_type,
                              name: t.name,
                              category: t.category,
                              description: t.description,
                              xp_reward: t.default_xp,
                              cooldown_seconds: t.default_cooldown,
                              daily_cap: t.default_cap,
                            });
                            setTriggerSelectorOpen(false);
                          } else {
                            handleSelectPlatformTrigger(t);
                          }
                        }}
                        className={cn(
                          "h-8 px-3 text-xs font-bold gap-1.5 cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/90 hover:bg-primary text-primary-foreground"
                        )}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSelected ? "Selecionado" : "Selecionar Gatilho"}</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="p-3 sm:p-4 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Mostrando {filteredTriggers.length} de {allPlatformTriggers.length} gatilhos
            </span>
            <Button variant="ghost" size="sm" onClick={() => setTriggerSelectorOpen(false)} className="h-8 text-xs cursor-pointer">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL AÇÕES EM MASSA 1: AJUSTAR XP EM MASSA
          ========================================================================= */}
      <Dialog open={bulkXpModalOpen} onOpenChange={(open) => !bulkXpSubmitting && setBulkXpModalOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Conceder / Ajustar XP em Massa</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Aplique bonificações ou correções de saldo de XP para múltiplos membros simultaneamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Lista dos Membros Selecionados */}
            <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Membros Selecionados ({selectedMembersList.length})
                </span>
                <span className="text-[10px] text-muted-foreground">Todos receberão esta alteração</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {selectedMembersList.map((m) => (
                  <Badge key={m.user_id} variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 font-semibold">
                    <img
                      src={m.avatar_url || "/placeholder-avatar.png"}
                      alt={m.nome}
                      className="w-3.5 h-3.5 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                    <span>{m.nickname || m.nome}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">({(m.xp || 0).toLocaleString()} XP)</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Modo de Ajuste */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={bulkXpMode === "add" ? "default" : "outline"}
                onClick={() => setBulkXpMode("add")}
                className="font-bold text-xs h-9 gap-1.5 cursor-pointer"
                disabled={bulkXpSubmitting}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar / Subtrair XP</span>
              </Button>
              <Button
                type="button"
                variant={bulkXpMode === "set" ? "default" : "outline"}
                onClick={() => setBulkXpMode("set")}
                className="font-bold text-xs h-9 gap-1.5 cursor-pointer"
                disabled={bulkXpSubmitting}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Definir XP Fixo</span>
              </Button>
            </div>

            {/* Quantidade de XP */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk-xp-amount" className="text-xs font-bold">
                  {bulkXpMode === "add" ? "Quantidade de XP a Conceder/Deduzir" : "Novo Saldo Fixo de XP"}
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {bulkXpMode === "add" ? "use valor negativo para deduzir (ex: -50)" : "substitui o saldo atual"}
                </span>
              </div>
              <Input
                id="bulk-xp-amount"
                type="number"
                value={bulkXpAmount}
                onChange={(e) => setBulkXpAmount(Number(e.target.value))}
                placeholder="50"
                className="font-mono text-base font-extrabold"
                disabled={bulkXpSubmitting}
              />
              {/* Botões Rápidos */}
              {bulkXpMode === "add" && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[10, 25, 50, 100, 250, 500, 1000].map((val) => (
                    <Button
                      key={val}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkXpAmount(val)}
                      disabled={bulkXpSubmitting}
                      className="h-6 px-2 text-[10px] font-mono font-bold cursor-pointer"
                    >
                      +{val} XP
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkXpAmount(-50)}
                    disabled={bulkXpSubmitting}
                    className="h-6 px-2 text-[10px] font-mono font-bold text-destructive hover:text-destructive cursor-pointer"
                  >
                    -50 XP
                  </Button>
                </div>
              )}
            </div>

            {/* Justificativa Obrigatória */}
            <div className="space-y-1.5">
              <Label htmlFor="bulk-xp-reason" className="text-xs font-bold">
                Justificativa Obrigatória (Auditoria Dev) *
              </Label>
              <Textarea
                id="bulk-xp-reason"
                value={bulkXpReason}
                onChange={(e) => setBulkXpReason(e.target.value)}
                placeholder="Ex: Bonificação semanal por meta batida coletiva da facção."
                rows={3}
                className="text-xs"
                disabled={bulkXpSubmitting}
              />
            </div>

            {/* Barra de Progresso durante Execução */}
            {bulkProgress && (
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    Processando membros ({bulkProgress.current} de {bulkProgress.total})...
                  </span>
                  <span className="font-mono text-primary">{bulkProgress.percent}%</span>
                </div>
                <Progress value={bulkProgress.percent} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setBulkXpModalOpen(false)}
              disabled={bulkXpSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteBulkXp}
              disabled={bulkXpSubmitting || !bulkXpReason.trim() || selectedMembersList.length === 0}
              className="font-extrabold bg-purple-600 hover:bg-purple-700 text-white shadow-xs gap-1.5 cursor-pointer"
            >
              {bulkXpSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Aplicando ({bulkProgress?.current || 0}/{selectedMembersList.length})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aplicar XP para {selectedMembersList.length} Membros</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL AÇÕES EM MASSA 2: DEFINIR NÍVEL EM MASSA
          ========================================================================= */}
      <Dialog open={bulkLevelModalOpen} onOpenChange={(open) => !bulkLevelSubmitting && setBulkLevelModalOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <span>Definir Nível em Massa</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atualize a graduação gamificada de múltiplos membros com recalibração de patamar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Lista dos Membros Selecionados */}
            <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Membros Selecionados ({selectedMembersList.length})
                </span>
                <span className="text-[10px] text-muted-foreground">Todos receberão este nível</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {selectedMembersList.map((m) => (
                  <Badge key={m.user_id} variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 font-semibold">
                    <img
                      src={m.avatar_url || "/placeholder-avatar.png"}
                      alt={m.nome}
                      className="w-3.5 h-3.5 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                    <span>{m.nickname || m.nome}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">(Nvl {m.gamification_level || 1})</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Seleção do Nível Alvo */}
            <div className="space-y-1.5">
              <Label htmlFor="bulk-target-level" className="text-xs font-bold">
                Nível Alvo Desejado (1 a 50+)
              </Label>
              <Input
                id="bulk-target-level"
                type="number"
                min={1}
                max={50}
                value={bulkTargetLevel}
                onChange={(e) => setBulkTargetLevel(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="font-mono text-base font-extrabold"
                disabled={bulkLevelSubmitting}
              />
              {/* Preview do Nível Escolhido */}
              {(() => {
                const targetTier = LEVEL_THRESHOLDS.find((t) => t.level === bulkTargetLevel) || LEVEL_THRESHOLDS[0];
                return (
                  <div className="p-2.5 rounded-lg border border-purple-500/30 bg-purple-500/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-muted-foreground">Título de Graduação:</span>{" "}
                      <strong className="text-purple-300 font-bold">{targetTier.title}</strong>
                    </div>
                    <div className="font-mono font-bold text-foreground">
                      XP Base: {targetTier.xp.toLocaleString()} XP
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Checkbox Sincronizar XP */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="bulk-sync-xp" className="text-xs font-bold cursor-pointer">
                  Sincronizar XP com a marca mínima do nível
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Atualiza automaticamente o saldo de XP de cada membro caso seu XP atual seja inferior ao patamar mínimo do nível.
                </p>
              </div>
              <Switch
                id="bulk-sync-xp"
                checked={bulkSyncXp}
                onCheckedChange={setBulkSyncXp}
                disabled={bulkLevelSubmitting}
              />
            </div>

            {/* Justificativa Obrigatória */}
            <div className="space-y-1.5">
              <Label htmlFor="bulk-level-reason" className="text-xs font-bold">
                Justificativa Obrigatória (Auditoria Dev) *
              </Label>
              <Textarea
                id="bulk-level-reason"
                value={bulkLevelReason}
                onChange={(e) => setBulkLevelReason(e.target.value)}
                placeholder="Ex: Enquadramento geral de nível para nova patente de liderança ou reestruturação de cargos."
                rows={3}
                className="text-xs"
                disabled={bulkLevelSubmitting}
              />
            </div>

            {/* Progresso */}
            {bulkProgress && (
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    Aplicando nível ({bulkProgress.current} de {bulkProgress.total})...
                  </span>
                  <span className="font-mono text-primary">{bulkProgress.percent}%</span>
                </div>
                <Progress value={bulkProgress.percent} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setBulkLevelModalOpen(false)}
              disabled={bulkLevelSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteBulkLevel}
              disabled={bulkLevelSubmitting || !bulkLevelReason.trim() || selectedMembersList.length === 0}
              className="font-extrabold bg-primary text-primary-foreground shadow-xs gap-1.5 cursor-pointer"
            >
              {bulkLevelSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Aplicando ({bulkProgress?.current || 0}/{selectedMembersList.length})...</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  <span>Definir Nível para {selectedMembersList.length} Membros</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL AÇÕES EM MASSA 3: CONCEDER INSÍGNIA EM MASSA
          ========================================================================= */}
      <Dialog open={bulkInsigniaModalOpen} onOpenChange={(open) => !bulkInsigniaSubmitting && setBulkInsigniaModalOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] sm:max-w-lg bg-card/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Conceder Insígnia em Massa</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conceda uma mesma insígnia ou condecoração para múltiplos membros selecionados (Bypass Dev).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Lista dos Membros Selecionados */}
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  Beneficiários Selecionados ({selectedMembersList.length})
                </span>
                <span className="text-[10px] text-muted-foreground">Receberão a condecoração</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {selectedMembersList.map((m) => (
                  <Badge key={m.user_id} variant="secondary" className="text-[11px] gap-1 px-2 py-0.5 font-semibold">
                    <img
                      src={m.avatar_url || "/placeholder-avatar.png"}
                      alt={m.nome}
                      className="w-3.5 h-3.5 rounded-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                    <span>{m.nickname || m.nome}</span>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Seleção da Insígnia */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Selecione a Insígnia do Catálogo *</Label>
              <Select
                value={bulkSelectedInsigniaId}
                onValueChange={setBulkSelectedInsigniaId}
                disabled={bulkInsigniaSubmitting}
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Escolha a condecoração a conceder..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {insignias
                    .filter((b) => b.active)
                    .map((badge) => {
                      const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.comum;
                      return (
                        <SelectItem key={badge.id} value={badge.id}>
                          <div className="flex items-center gap-2">
                            <span className={cn("font-bold text-[11px]", rarity.textClass)}>[{rarity.label}]</span>
                            <span className="font-semibold">{badge.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">({badge.xp_cost} XP)</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Isenção Dev Bypass:</strong> Não há débito de XP dos membros ou do administrador. Membros que já possuem esta condecoração serão preservados sem erro.
              </span>
            </div>

            {/* Justificativa Obrigatória */}
            <div className="space-y-1.5">
              <Label htmlFor="bulk-grant-reason" className="text-xs font-bold">
                Motivo / Justificativa da Condecoração *
              </Label>
              <Textarea
                id="bulk-grant-reason"
                value={bulkInsigniaReason}
                onChange={(e) => setBulkInsigniaReason(e.target.value)}
                placeholder="Ex: Condecoração coletiva por vitória em operação estratégica e participação no comboio de segurança."
                rows={3}
                className="text-xs"
                disabled={bulkInsigniaSubmitting}
              />
            </div>

            {/* Progresso */}
            {bulkProgress && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    Concedendo insígnias ({bulkProgress.current} de {bulkProgress.total})...
                  </span>
                  <span className="font-mono text-amber-400">{bulkProgress.percent}%</span>
                </div>
                <Progress value={bulkProgress.percent} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setBulkInsigniaModalOpen(false)}
              disabled={bulkInsigniaSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteBulkInsignia}
              disabled={bulkInsigniaSubmitting || !bulkSelectedInsigniaId || !bulkInsigniaReason.trim() || selectedMembersList.length === 0}
              className="font-extrabold bg-amber-500 hover:bg-amber-600 text-black shadow-xs gap-1.5 cursor-pointer"
            >
              {bulkInsigniaSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Concedendo ({bulkProgress?.current || 0}/{selectedMembersList.length})...</span>
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5" />
                  <span>Conceder para {selectedMembersList.length} Membros</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
