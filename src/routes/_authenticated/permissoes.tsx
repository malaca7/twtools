import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ShieldCheck,
  Save,
  Loader2,
  Users,
  Landmark,
  ShoppingCart,
  Boxes,
  Package,
  Tags,
  ArrowLeftRight,
  DollarSign,
  Megaphone,
  Trophy,
  TrendingUp,
  Target,
  LayoutDashboard,
  ScrollText,
  HelpCircle,
  FolderTree,
  Settings,
  CheckCircle2,
  User,
  Wrench,
  Workflow,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PageHeader, NoAccess } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions, useMembers } from "@/hooks/useData";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { saveRolePermissions } from "@/lib/app-api";
import {
  LEVELS,
  LEVEL_LABEL,
  LEVEL_DESCRIPTION,
  PERMISSIONS,
  ALL_PERMISSIONS,
  levelBadgeClass,
  type AppLevel,
  type Permission,
} from "@/lib/permissions";
import { errorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/permissoes")({
  component: PermissoesPage,
});

type PermissionDetail = {
  key: Permission;
  label: string;
  description: string;
  badge?: string;
  importantNote?: string;
};

type PageCardConfig = {
  id: string;
  title: string;
  route: string;
  icon: typeof Users;
  description: string;
  color: string;
  defaultCat: string;
  defaultOrder: number;
  permissions: PermissionDetail[];
};

const PAGE_CARDS: PageCardConfig[] = [
  {
    id: "hierarquia",
    title: "Hierarquia do Grupo",
    route: "/hierarquia",
    icon: Workflow,
    description: "Visualização inovadora, minimalista e interativa da estrutura de comando e cargos do grupo.",
    color: "border-purple-500/40 bg-purple-500/5 text-purple-400",
    defaultCat: "Gestão",
    defaultOrder: 0,
    permissions: [
      {
        key: "view_hierarchy",
        label: "Visualizar Árvore de Hierarquia",
        description: "Permite acessar a rota /hierarquia e visualizar a árvore completa de cargos e membros do grupo.",
      },
      {
        key: "manage_hierarchy",
        label: "Gerenciar Estrutura de Hierarquia",
        description: "Permite reordenar a estrutura e gerenciar limites de vagas por patente.",
        badge: "Gestão de Cargos",
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    route: "/dashboard",
    icon: LayoutDashboard,
    description: "Tela inicial da plataforma com comunicados em destaque, membros online e resumo geral.",
    color: "border-indigo-500/40 bg-indigo-500/5 text-indigo-400",
    defaultCat: "Operação",
    defaultOrder: 0,
    permissions: [
      {
        key: "view_dashboard",
        label: "Visualizar Dashboard",
        description: "Permite acessar a tela inicial da plataforma Twin Wheels.",
      },
    ],
  },
  {
    id: "movimentacoes",
    title: "Movimentações de Estoque",
    route: "/movimentacoes",
    icon: ArrowLeftRight,
    description: "Histórico completo de entradas e saídas de itens com filtro por baú, membro e data.",
    color: "border-sky-500/40 bg-sky-500/5 text-sky-400",
    defaultCat: "Operação",
    defaultOrder: 1,
    permissions: [
      {
        key: "view_movements",
        label: "Ver Página de Movimentação",
        description: "Permite acessar a rota /movimentacoes para visualizar a tela de movimentações de estoque.",
        badge: "Acesso à Rota",
      },
      {
        key: "view_all_movements",
        label: "Ver Histórico de Lançamentos",
        description: "Visualizar a seção de Histórico de Lançamentos com todos os registros de entrada e saída feitos pelos membros.",
      },
      {
        key: "view_movement_balances",
        label: "Ver Saldos (Anterior e Resultante)",
        description: "Permite visualizar as colunas numéricas de saldo em estoque antes e depois de cada movimentação.",
        badge: "Saldos Estoque",
      },
      {
        key: "view_movement_baus",
        label: "Ver Identificação dos Baús e Depósitos",
        description: "Permite visualizar qual baú/depósito de origem e destino foi selecionado no lançamento.",
        badge: "Identificação Baús",
      },
      {
        key: "create_movement",
        label: "Registrar Movimentações de Estoque",
        description: "Dar entrada (+) ou saída (-) de insumos nos baús da facção.",
      },
      {
        key: "reverse_movement",
        label: "Estornar Movimentações de Estoque",
        description: "Permite estornar lançamentos de estoque feitos por engano.",
        badge: "Estorno Estoque",
      },
      {
        key: "delete_movement",
        label: "Apagar Lançamentos de Estoque",
        description: "Permite deletar permanentemente um registro de movimentação de estoque.",
        badge: "Ação Crítica",
      },
    ],
  },
  {
    id: "vendas",
    title: "Registro de Vendas",
    route: "/vendas",
    icon: ShoppingCart,
    description: "Lançamento e controle de vendas de produtos com cálculo automático de receita e comissões.",
    color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400",
    defaultCat: "Operação",
    defaultOrder: 2,
    permissions: [
      {
        key: "view_sales",
        label: "Visualizar Histórico de Vendas",
        description: "Ver todas as vendas efetuadas pelos membros da facção.",
      },
      {
        key: "create_sale",
        label: "Registrar Novas Vendas",
        description: "Permite efetuar lançamentos de vendas e movimentar faturamento.",
      },
      {
        key: "reverse_sale",
        label: "Estornar Registros de Vendas",
        description: "Permite cancelar/estornar uma venda incorreta.",
        badge: "Estorno Vendas",
      },
      {
        key: "delete_sale",
        label: "Apagar Registros de Vendas",
        description: "Permite apagar definitivamente um lançamento de venda do sistema.",
        badge: "Ação Crítica",
      },
    ],
  },
  {
    id: "chat",
    title: "Chat & Mensagens",
    route: "/chat",
    icon: MessageSquare,
    description: "Comunicação em tempo real, canais privados, criação e administração de grupos de conversa.",
    color: "border-primary/40 bg-primary/5 text-primary",
    defaultCat: "Operação",
    defaultOrder: 3,
    permissions: [
      {
        key: "view_chat",
        label: "Acessar e Visualizar o Chat",
        description: "Permite acessar a página de chat e interagir nas mensagens privadas e grupos.",
        badge: "Acesso à Rota",
      },
      {
        key: "create_chat_group",
        label: "Criar Novos Grupos de Chat",
        description: "Permite criar novos grupos de conversa com os membros.",
      },
      {
        key: "manage_chat_groups",
        label: "Gerenciar Configurações de Grupos",
        description: "Permite moderar participantes, alterar fotos/descrições e definir permissões de envio em grupos.",
        badge: "Administração",
      },
    ],
  },
  {
    id: "estoque",
    title: "Estoque Geral e Depósitos",
    route: "/estoque",
    icon: Boxes,
    description: "Visão geral, controle de insumos e gerenciamento de baús armazenados nos depósitos.",
    color: "border-sky-500/40 bg-sky-500/5 text-sky-400",
    defaultCat: "Gestão",
    defaultOrder: 3,
    permissions: [
      {
        key: "view_stock",
        label: "Ver Saldos do Estoque Geral",
        description: "Consultar as quantidades totais em estoque dos produtos da facção.",
      },
      {
        key: "view_baus",
        label: "Visualizar Lista de Baús",
        description: "Permite visualizar quais baús existem na facção e seus respectivos itens.",
      },
      {
        key: "manage_baus",
        label: "Criar, Editar e Excluir Baús",
        description: "Permite criar novos depósitos de armazenamento e alterar nomes de baús.",
        badge: "Gestão Baús",
      },
      {
        key: "view_products",
        label: "Ver Lista de Produtos Cadastrados",
        description: "Visualizar os insumos e itens disponíveis no catálogo.",
      },
      {
        key: "manage_products",
        label: "Cadastrar, Editar e Apagar Produtos",
        description: "Criar novos itens, alterar nomes, preços de custo e venda.",
        badge: "Catálogo",
      },
      {
        key: "view_categories",
        label: "Ver Categorias de Produtos",
        description: "Visualizar as categorias dos itens (Armas, Munições, Drogas, etc.).",
      },
      {
        key: "manage_categories",
        label: "Gerenciar Categorias de Produtos",
        description: "Criar, editar e excluir categorias de insumos.",
        badge: "Categorias",
      },
    ],
  },
  {
    id: "membros",
    title: "Gerenciamento de Membros",
    route: "/membros",
    icon: Users,
    description: "Lista de integrantes da facção, aprovação de cadastros e alteração de cargos.",
    color: "border-purple-500/40 bg-purple-500/5 text-purple-400",
    defaultCat: "Gestão",
    defaultOrder: 4,
    permissions: [
      {
        key: "view_members",
        label: "Visualizar Lista de Membros",
        description: "Acessar a lista de integrantes do grupo com nomes, cargos, ID e telefone.",
      },
      {
        key: "view_sensitive_data",
        label: "Visualizar Dados Confidenciais e Sensurados dos Membros",
        description: "Permite visualizar IDs do Discord, estatísticas de presença e dados sensíveis completos dos membros sem censura.",
        badge: "Dados Confidenciais",
      },
      {
        key: "view_consolidated_financials",
        label: "Ver Dados Financeiros dos Membros",
        description: "Permite visualizar valores acumulados de vendas e contribuições por membro.",
      },
      {
        key: "approve_requests",
        label: "Aprovar / Recusar Solicitações de Novos Membros",
        description: "Permite aprovar novos cadastros de jogadores que entraram pelo Discord, ativando-os como Novatos, ou rejeitar solicitações.",
        badge: "Aprovação de Cadastros",
      },
      {
        key: "promote_members",
        label: "Promover / Alterar Cargo de Membros",
        description: "Permite promover ou rebaixar o cargo hierárquico de membros inferiores.",
        importantNote: "Regra Estrita: Só permite alterar cargos de ranks estritamente inferiores.",
      },
      {
        key: "edit_members",
        label: "Editar Dados de Membros",
        description: "Permite alterar nome, apelido, telefone e ID do personagem de membros inferiores.",
      },
      {
        key: "delete_members",
        label: "Desligar / Excluir Membros",
        description: "Permite desativar ou excluir registros de membros da facção.",
        badge: "Ação Crítica",
      },
    ],
  },
  {
    id: "fundo-caixa",
    title: "Fundo de Caixa",
    route: "/fundo-caixa",
    icon: Landmark,
    description: "Gestão do caixa geral da facção com entradas, saídas, estornos e saldo automático.",
    color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400",
    defaultCat: "Gestão",
    defaultOrder: 5,
    permissions: [
      {
        key: "view_cash_fund",
        label: "Acessar Fundo de Caixa",
        description: "Permite visualizar o saldo em tempo real e o histórico de movimentações financeiras.",
      },
      {
        key: "manage_cash_fund",
        label: "Registrar Lançamentos de Caixa",
        description: "Permite efetuar entradas (+) e saídas (-) de dinheiro no fundo de caixa.",
      },
      {
        key: "reverse_cash_fund",
        label: "Estornar Lançamentos de Caixa",
        description: "Permite estornar movimentações incorretas do caixa geral.",
        badge: "Estorno Financeiro",
      },
      {
        key: "delete_cash_movement",
        label: "Apagar / Excluir Lançamentos de Caixa",
        description: "Permite excluir definitivamente um registro do histórico do fundo de caixa.",
        badge: "Ação Crítica",
      },
    ],
  },
  {
    id: "rankings",
    title: "Rankings",
    route: "/rankings",
    icon: Trophy,
    description: "Pódio dos membros que mais movimentam estoques e realizam vendas na facção.",
    color: "border-amber-500/40 bg-amber-500/5 text-amber-400",
    defaultCat: "Gestão",
    defaultOrder: 6,
    permissions: [
      {
        key: "view_rankings",
        label: "Ver Rankings da Facção",
        description: "Acessar o pódio de membros em destaque.",
      },
    ],
  },
  {
    id: "desempenho",
    title: "Desempenho & Produtividade",
    route: "/desempenho",
    icon: TrendingUp,
    description: "Estatísticas avançadas de produtividade individual, raio-x dos integrantes e relatórios executivos.",
    color: "border-amber-500/40 bg-amber-500/5 text-amber-400",
    defaultCat: "Gestão",
    defaultOrder: 7,
    permissions: [
      {
        key: "view_performance",
        label: "Ver Meu Desempenho Pessoal (/desempenho)",
        description: "Permite ao membro consultar sua própria ficha técnica de faturamento e produtividade.",
      },
      {
        key: "manage_performance",
        label: "Acessar Gestão Executiva de Desempenho (/dev.desempenho)",
        description: "Permite acessar o painel geral da liderança com faturamento consolidado e ranking da facção.",
        badge: "Gestão Executiva",
      },
      {
        key: "inspect_member_performance",
        label: "Inspecionar Raio-X & Histórico de Membros",
        description: "Permite abrir o modal de inspeção individual para examinar vendas recentes e estoque por operador.",
        badge: "Raio-X Membros",
      },
    ],
  },
  {
    id: "metas",
    title: "Metas",
    route: "/metas",
    icon: Target,
    description: "Definição e acompanhamento de metas operacionais e de produção da equipe.",
    color: "border-amber-500/40 bg-amber-500/5 text-amber-400",
    defaultCat: "Gestão",
    defaultOrder: 8,
    permissions: [
      {
        key: "view_goals",
        label: "Ver Progresso das Metas da Facção",
        description: "Acompanhar a barra de evolução das metas da facção.",
      },
      {
        key: "manage_goals",
        label: "Criar e Gerenciar Metas Operacionais",
        description: "Criar novas metas, definir alvos numéricos e editar metas ativas.",
        badge: "Gestão Metas",
      },
    ],
  },
  {
    id: "cargos",
    title: "Gerenciamento de Cargos",
    route: "/cargos",
    icon: ShieldCheck,
    description: "Criação de novos cargos personalizados, ordem hierárquica e reordenação de níveis.",
    color: "border-purple-500/40 bg-purple-500/5 text-purple-400",
    defaultCat: "Gestão",
    defaultOrder: 9,
    permissions: [
      {
        key: "manage_roles",
        label: "Gerenciar Cargos e Hierarquia",
        description: "Permite criar cargos, editar nomes, descrições e reordenar a hierarquia.",
        badge: "Administrativo",
      },
    ],
  },
  {
    id: "permissoes",
    title: "Permissões",
    route: "/permissoes",
    icon: Settings,
    description: "Matriz de gerenciamento de permissões e controle de acesso aos módulos para cada cargo.",
    color: "border-indigo-500/40 bg-indigo-500/5 text-indigo-400",
    defaultCat: "Gestão",
    defaultOrder: 10,
    permissions: [
      {
        key: "manage_permissions",
        label: "Gerenciar Permissões por Página",
        description: "Permite configurar e ativar permissões individuais de cada cargo em tempo real.",
        badge: "Admin Permissões",
        importantNote: "Apenas administradores devem possuir permissão de alterar matrizes de cargos.",
      },
    ],
  },
  {
    id: "avisos",
    title: "Enviar Avisos",
    route: "/avisos",
    icon: Megaphone,
    description: "Publicação de comunicados gerais em destaque para toda a facção com confirmação de leitura.",
    color: "border-purple-500/40 bg-purple-500/5 text-purple-400",
    defaultCat: "Gestão",
    defaultOrder: 11,
    permissions: [
      {
        key: "manage_announcements",
        label: "Publicar e Apagar Comunicados",
        description: "Criar comunicados em destaque na página inicial e remover comunicados antigos.",
      },
    ],
  },
  {
    id: "logs",
    title: "Logs da Plataforma",
    route: "/logs",
    icon: ScrollText,
    description: "Histórico completo e transparente em tempo real de todas as ações, logins e eventos na plataforma.",
    color: "border-indigo-500/40 bg-indigo-500/5 text-indigo-400",
    defaultCat: "Gestão",
    defaultOrder: 12,
    permissions: [
      {
        key: "view_audit",
        label: "Ver Logs da Plataforma",
        description: "Permite consultar logs de logins, saídas, edições, vendas e movimentações.",
        badge: "Logs Sistema",
      },
    ],
  },
  {
    id: "configuracoes",
    title: "Configurações da Plataforma",
    route: "/configuracoes",
    icon: Wrench,
    description: "Gerenciamento das configurações gerais da facção, timeout de inatividade e personalização do menu lateral.",
    color: "border-indigo-500/40 bg-indigo-500/5 text-indigo-400",
    defaultCat: "Gestão",
    defaultOrder: 14,
    permissions: [
      {
        key: "manage_platform_settings",
        label: "Gerenciar Aba Plataforma",
        description: "Permite alterar o nome da facção, descrição, timeout de inatividade e parâmetros gerais.",
        badge: "Configurações",
      },
      {
        key: "manage_menu_settings",
        label: "Gerenciar Aba Menu",
        description: "Permite reordenar o menu lateral, alterar visibilidade dos itens e vincular categorias.",
        badge: "Gestão Menu",
      },
    ],
  },
  {
    id: "perfil",
    title: "Meu Perfil",
    route: "/perfil",
    icon: User,
    description: "Visualização e edição dos dados pessoais do integrante (nome, apelido, telefone e passaporte).",
    color: "border-sky-500/40 bg-sky-500/5 text-sky-400",
    defaultCat: "Gestão",
    defaultOrder: 13,
    permissions: [
      {
        key: "view_profile",
        label: "Acessar e Editar Meu Perfil",
        description: "Permite acessar a página de perfil pessoal e alterar dados em jogo.",
      },
    ],
  },
];

function PermissoesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { data: dbPermissions } = useRolePermissions();
  const { data: members = [] } = useMembers();
  const { config: menuConfig } = useMenuConfig();

  const canAccess = hasPermission("manage_permissions");

  // Selected Role State
  const [selectedLevel, setSelectedLevel] = useState<AppLevel>("novato");
  const [activePermissions, setActivePermissions] = useState<Permission[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (dbPermissions && dbPermissions[selectedLevel]) {
      setActivePermissions(dbPermissions[selectedLevel]);
    } else {
      setActivePermissions(PERMISSIONS[selectedLevel] || []);
    }
  }, [dbPermissions, selectedLevel]);

  // Dynamically group & order PAGE_CARDS according to the exact menu configuration
  const groupedPageCards = useMemo(() => {
    const validConfigItems = menuConfig?.items?.filter((c) => Boolean(c && (c.id || c.url))) || [];
    const configMap = new Map(validConfigItems.map((c) => [c.id || c.url, c]));

    const categoryOrder = menuConfig?.categories?.length
      ? menuConfig.categories
      : ["Operação", "Gestão", "Administração"];

    const customized = PAGE_CARDS.map((card) => {
      const cfg = configMap.get(card.id);
      return {
        ...card,
        title: cfg?.title || card.title,
        category: cfg?.category || card.defaultCat,
        order: typeof cfg?.order === "number" ? cfg.order : card.defaultOrder,
      };
    });

    const groups: { category: string; cards: typeof customized }[] = [];

    categoryOrder.forEach((cat) => {
      const catCards = customized
        .filter((c) => c.category === cat)
        .sort((a, b) => a.order - b.order);
      if (catCards.length > 0) {
        groups.push({ category: cat, cards: catCards });
      }
    });

    // Catch any cards with categories not in categoryOrder
    const knownCats = new Set(categoryOrder);
    customized.forEach((card) => {
      if (!knownCats.has(card.category)) {
        knownCats.add(card.category);
        const catCards = customized
          .filter((c) => c.category === card.category)
          .sort((a, b) => a.order - b.order);
        if (catCards.length > 0) {
          groups.push({ category: card.category, cards: catCards });
        }
      }
    });

    return groups;
  }, [menuConfig]);

  // Real-time automatic save function without requiring a manual save button
  const autoSavePermissions = useCallback(
    async (targetLevel: AppLevel, nextPerms: Permission[]) => {
      if (!canAccess) return;
      setIsSyncing(true);
      try {
        await saveRolePermissions(targetLevel, nextPerms);
        void queryClient.invalidateQueries({ queryKey: ["role_permissions"] });
      } catch (err) {
        toast.error(errorMessage(err, "Falha ao sincronizar permissões."));
      } finally {
        setIsSyncing(false);
      }
    },
    [canAccess, queryClient]
  );

  if (!canAccess) {
    return <NoAccess />;
  }

  const togglePermission = (permKey: Permission) => {
    const next = activePermissions.includes(permKey)
      ? activePermissions.filter((p) => p !== permKey)
      : [...activePermissions, permKey];
    setActivePermissions(next);
    void autoSavePermissions(selectedLevel, next);
  };

  const setAllPermissions = () => {
    setActivePermissions([...ALL_PERMISSIONS]);
    void autoSavePermissions(selectedLevel, [...ALL_PERMISSIONS]);
  };

  const setReadOnlyPermissions = () => {
    const next: Permission[] = [
      "view_dashboard",
      "view_cash_fund",
      "view_stock",
      "view_baus",
      "view_all_movements",
      "view_sales",
      "view_products",
      "view_categories",
      "view_members",
      "view_consolidated_financials",
      "view_rankings",
      "view_performance",
      "view_goals",
      "view_audit",
      "view_profile",
    ];
    setActivePermissions(next);
    void autoSavePermissions(selectedLevel, next);
  };

  const clearAllPermissions = () => {
    const next: Permission[] = [];
    setActivePermissions(next);
    void autoSavePermissions(selectedLevel, next);
  };

  const memberCount = members.filter((m) => m.nivel === selectedLevel).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Gerenciamento de Permissões por Página"
        description="Configure os privilégios operacionais e visibilidade card a card agrupados e sincronizados com a ordem do menu."
        actions={
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs py-1.5 px-3 gap-1.5 font-bold">
            {isSyncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>{isSyncing ? "Sincronizando..." : "Sincronização Ao Vivo Ativa"}</span>
          </Badge>
        }
      />

      {/* ROLE SELECTION BUTTONS */}
      <Card className="surface-card">
        <CardHeader className="pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Cargo Selecionado para Configuração
            </CardTitle>
            <CardDescription className="text-xs">
              Clique nos botões dos cargos abaixo para selecionar e ajustar as permissões em tempo real.
            </CardDescription>
          </div>

          {/* Role Buttons Row */}
          <div className="flex flex-wrap gap-2 pt-3">
            {LEVELS.map((lvl) => {
              const isSelected = selectedLevel === lvl;
              const count = members.filter((m) => m.nivel === lvl).length;

              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                    isSelected
                      ? "bg-gradient-brand text-primary-foreground border-primary shadow-md scale-[1.02]"
                      : "bg-secondary/40 border-border/60 hover:bg-secondary/80 text-foreground"
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{LEVEL_LABEL[lvl] || lvl}</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[9px] px-1.5 py-0 font-mono font-bold",
                      isSelected ? "bg-black/30 text-white" : "bg-background text-muted-foreground"
                    )}
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="pt-2 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30 p-3 rounded-lg border border-border/80">
            <div className="flex items-center gap-3">
              <Badge className={cn("text-xs px-3 py-1 font-bold", levelBadgeClass(selectedLevel))}>
                {LEVEL_LABEL[selectedLevel] || selectedLevel}
              </Badge>
              <div>
                <p className="text-xs text-foreground font-semibold">
                  {LEVEL_DESCRIPTION[selectedLevel] || "Cargo operacional do grupo."}
                </p>
                <p className="text-[0.65rem] text-muted-foreground">
                  Atribuído a <strong>{memberCount}</strong> {memberCount === 1 ? "membro ativo" : "membros ativos"} no grupo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={setAllPermissions}>
                Marcar Todos
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={setReadOnlyPermissions}>
                Apenas Leitura
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-rose-400 hover:bg-rose-500/10" onClick={clearAllPermissions}>
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DYNAMICALLY GROUPED & ORDERED PERMISSION CARDS BY MENU CATEGORIES */}
      <div className="space-y-8">
        {groupedPageCards.map(({ category, cards }) => (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-primary" />
                <h3 className="text-xs uppercase tracking-widest font-bold text-foreground">
                  Categoria do Menu: <span className="text-primary font-extrabold">{category}</span>
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                {cards.length} {cards.length === 1 ? "módulo" : "módulos"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((pageCard) => {
                const PageIcon = pageCard.icon;

                return (
                  <Card key={pageCard.id} className="surface-card flex flex-col justify-between">
                    <div>
                      <CardHeader className="pb-3 border-b border-border/50">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("p-2 rounded-lg border", pageCard.color)}>
                              <PageIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                                {pageCard.title}
                                <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                  ({pageCard.route})
                                </span>
                              </CardTitle>
                              <CardDescription className="text-[0.7rem] line-clamp-1">
                                {pageCard.description}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-3 space-y-2.5">
                        {pageCard.permissions.map((perm) => {
                          const isChecked = activePermissions.includes(perm.key);

                          return (
                            <div
                              key={`${pageCard.id}-${perm.key}`}
                              className={cn(
                                "p-2.5 rounded-lg border transition-all flex items-start gap-3 cursor-pointer select-none",
                                isChecked
                                  ? "border-primary/40 bg-primary/5 shadow-sm"
                                  : "border-border/50 bg-background/40 hover:bg-secondary/20"
                              )}
                              onClick={() => togglePermission(perm.key)}
                            >
                              <Checkbox
                                id={`perm-${pageCard.id}-${perm.key}`}
                                checked={isChecked}
                                className="mt-0.5 pointer-events-none"
                              />

                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-foreground">
                                    {perm.label}
                                  </span>

                                  {perm.badge && (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                                      {perm.badge}
                                    </Badge>
                                  )}
                                </div>

                                <p className="text-[0.7rem] text-muted-foreground leading-snug">
                                  {perm.description}
                                </p>

                                {perm.importantNote && (
                                  <div className="mt-1.5 p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-[0.65rem] text-amber-400 flex items-start gap-1">
                                    <HelpCircle className="h-3 w-3 shrink-0 mt-0.5 text-amber-400" />
                                    <span>{perm.importantNote}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
