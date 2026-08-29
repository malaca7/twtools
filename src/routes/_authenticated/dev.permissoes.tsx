import { useState, useEffect, useCallback, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Code2,
  ShieldCheck,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  XCircle,
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
  User,
  Wrench,
  Workflow,
  Shield,
  Info,
  Check,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useMenuConfig } from "@/hooks/useMenuConfig";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import {
  getDevPermissions,
  saveDevPermissions,
} from "@/services/devService";
import { ALL_PERMISSIONS, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dev/permissoes")({
  component: DevPermissoesPageWrapper,
});

function DevPermissoesPageWrapper() {
  return (
    <DeveloperGuard>
      <DevPermissoesContent />
    </DeveloperGuard>
  );
}

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
    id: "estoque",
    title: "Controle de Estoque",
    route: "/estoque",
    icon: Boxes,
    description: "Gestão do inventário da facção, movimentações de insumos, entradas, saídas e saldos.",
    color: "border-sky-500/40 bg-sky-500/5 text-sky-400",
    defaultCat: "Gestão",
    defaultOrder: 1,
    permissions: [
      {
        key: "view_stock",
        label: "Visualizar Lista de Insumos & Estoque",
        description: "Permite visualizar os itens armazenados nos baús da facção e suas quantidades.",
      },
      {
        key: "view_all_movements",
        label: "Ver Histórico de Movimentações de Todos",
        description: "Permite consultar movimentações de estoque registradas por qualquer membro do grupo.",
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
        label: "Visualizar Suas Próprias Vendas",
        description: "Permite consultar as vendas registradas pelo próprio membro logado.",
      },
      {
        key: "view_all_sales",
        label: "Visualizar Vendas de Todos os Membros",
        description: "Permite acessar o histórico completo de vendas efetuadas por qualquer operador do grupo.",
      },
      {
        key: "create_sale",
        label: "Registrar Nova Venda de Produtos",
        description: "Lançar saídas de produtos comercializados com desconto automático de estoque.",
      },
      {
        key: "reverse_sale",
        label: "Estornar Venda Registrada",
        description: "Permite estornar uma venda efetuada, devolvendo os produtos ao estoque.",
        badge: "Estorno Vendas",
      },
      {
        key: "delete_sale",
        label: "Excluir Registro de Venda",
        description: "Permite deletar permanentemente o lançamento de uma venda no sistema.",
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
    id: "baus",
    title: "Baús de Insumos",
    route: "/baus",
    icon: Package,
    description: "Cadastro, organização e monitoramento dos baús e depósitos de armazenamento da facção.",
    color: "border-amber-500/40 bg-amber-500/5 text-amber-400",
    defaultCat: "Gestão",
    defaultOrder: 3,
    permissions: [
      {
        key: "view_baus",
        label: "Visualizar Lista de Baús",
        description: "Permite visualizar os baús cadastrados e suas capacidades.",
      },
      {
        key: "manage_baus",
        label: "Gerenciar e Criar Baús",
        description: "Criar, editar nome e arquivar baús de armazenamento.",
        badge: "Gestão Baús",
      },
    ],
  },
  {
    id: "categorias",
    title: "Produtos & Categorias",
    route: "/categorias",
    icon: Tags,
    description: "Cadastro de itens do catálogo, preços unitários e categorização para movimentação.",
    color: "border-emerald-500/40 bg-emerald-500/5 text-emerald-400",
    defaultCat: "Gestão",
    defaultOrder: 5,
    permissions: [
      {
        key: "view_products",
        label: "Ver Produtos e Preços do Catálogo",
        description: "Visualizar os insumos cadastrados e seus valores unitários.",
      },
      {
        key: "manage_products",
        label: "Gerenciar Catálogo de Produtos",
        description: "Criar, editar preço e desativar itens do catálogo.",
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
    defaultOrder: 6,
    permissions: [
      {
        key: "view_cash_fund",
        label: "Ver Saldo e Histórico do Fundo de Caixa",
        description: "Visualizar o saldo total acumulado e a lista de depósitos e saídas.",
      },
      {
        key: "manage_cash_fund",
        label: "Lançar Entradas e Saídas do Caixa",
        description: "Registrar depósitos de verba ou retiradas do fundo de caixa.",
        badge: "Caixa Geral",
      },
      {
        key: "reverse_cash_fund",
        label: "Estornar Lançamentos de Caixa",
        description: "Estornar depósitos ou retiradas lançados incorretamente.",
        badge: "Estorno Caixa",
      },
      {
        key: "delete_cash_movement",
        label: "Deletar Registro de Caixa",
        description: "Remover permanentemente um lançamento financeiro do histórico.",
        badge: "Ação Crítica",
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
    id: "cargos",
    title: "Gerenciamento de Cargos",
    route: "/cargos",
    icon: ShieldCheck,
    description: "Criação, edição e exclusão de patentes/cargos customizados da facção.",
    color: "border-purple-500/40 bg-purple-500/5 text-purple-400",
    defaultCat: "Gestão",
    defaultOrder: 9,
    permissions: [
      {
        key: "manage_roles",
        label: "Criar, Editar e Excluir Cargos",
        description: "Permite criar novas patentes na hierarquia e definir cores e requisitos.",
        badge: "Gestão Cargos",
      },
    ],
  },
  {
    id: "permissoes",
    title: "Matriz de Permissões",
    route: "/permissoes",
    icon: Settings,
    description: "Configuração detalhada e em tempo real dos privilégios de acesso de cada cargo por funcionalidade.",
    color: "border-purple-500/40 bg-purple-500/5 text-purple-400",
    defaultCat: "Gestão",
    defaultOrder: 10,
    permissions: [
      {
        key: "manage_permissions",
        label: "Gerenciar Permissões por Página",
        description: "Permite configurar e ativar permissões individuais de cada cargo em tempo real.",
        badge: "Admin Permissões",
        importantNote: "Apenas administradores e devs devem possuir permissão de alterar matrizes.",
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

function DevPermissoesContent() {
  const { user, profile, level } = useAuth();
  const { config: menuConfig } = useMenuConfig();

  const [activePermissions, setActivePermissions] = useState<Permission[]>(ALL_PERMISSIONS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carrega as permissões da Tag Dev ao inicializar
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getDevPermissions(user, profile, level)
      .then((data) => {
        if (isMounted) {
          // Mapeia do formato DevPermissionResource ou array de strings
          if (Array.isArray(data)) {
            const keys: Permission[] = [];
            data.forEach((item: any) => {
              if (typeof item === "string" && ALL_PERMISSIONS.includes(item as Permission)) {
                keys.push(item as Permission);
              } else if (item.id && ALL_PERMISSIONS.includes(item.id as Permission)) {
                if (item.visualizar) keys.push(item.id as Permission);
              }
            });
            if (keys.length > 0) {
              setActivePermissions(keys);
            } else {
              setActivePermissions(ALL_PERMISSIONS);
            }
          }
        }
      })
      .catch(() => {
        if (isMounted) setActivePermissions(ALL_PERMISSIONS);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, profile, level]);

  // Agrupa os cards de páginas dinamicamente seguindo a ordem do menu
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

  // Sincronização e salvamento em tempo real
  const autoSaveDevTagPermissions = useCallback(
    async (nextPerms: Permission[]) => {
      setIsSyncing(true);
      try {
        const formattedData = nextPerms.map((key) => ({
          id: key,
          name: key,
          description: "",
          visualizar: true,
          criar: true,
          editar: true,
          excluir: true,
        }));
        await saveDevPermissions(formattedData, user, profile, level);
      } catch (err) {
        toast.error("Falha ao sincronizar permissões da Tag Dev.");
      } finally {
        setIsSyncing(false);
      }
    },
    [user, profile, level]
  );

  const togglePermission = (permKey: Permission) => {
    const next = activePermissions.includes(permKey)
      ? activePermissions.filter((p) => p !== permKey)
      : [...activePermissions, permKey];
    setActivePermissions(next);
    void autoSaveDevTagPermissions(next);
  };

  const setAllPermissions = () => {
    setActivePermissions([...ALL_PERMISSIONS]);
    void autoSaveDevTagPermissions([...ALL_PERMISSIONS]);
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
      "view_sensitive_data",
      "view_consolidated_financials",
      "view_rankings",
      "view_performance",
      "view_goals",
      "view_audit",
      "view_profile",
    ];
    setActivePermissions(next);
    void autoSaveDevTagPermissions(next);
  };

  const clearAllPermissions = () => {
    const next: Permission[] = [];
    setActivePermissions(next);
    void autoSaveDevTagPermissions(next);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 animate-in fade-in-50 duration-300">
      {/* Page Header */}
      <PageHeader
        title="Dev → Permissões da Tag Desenvolvedor"
        description="Configure as permissões operacionais vinculadas exclusivamente à Tag Desenvolvedor [Dev System 💻]. As permissões da Tag se somam às do cargo do membro."
        actions={
          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs py-1.5 px-3 gap-1.5 font-bold">
            {isSyncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-rose-400" />
            )}
            {isSyncing ? "Sincronizando..." : "Sincronizado em Tempo Real"}
          </Badge>
        }
      />

      {/* Informativo Tag Dev Aditiva */}
      <Card className="surface-card border-rose-500/30 bg-rose-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  Matriz Aditiva da Tag Desenvolvedor
                  <Badge variant="outline" className="text-[9px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10">
                    Tag Dev Exclusiva
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  As permissões marcadas abaixo são concedidas aos integrantes com a tag <strong>desenvolvedor</strong> e se somam automaticamente aos privilégios do cargo do membro.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Barra de Controles Rápidos */}
      <Card className="surface-card p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-foreground">Tag Desenvolvedor</h3>
                <Badge variant="outline" className="text-[10px] font-mono border-rose-500/40 text-rose-400 bg-rose-500/10">
                  Dev System
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {activePermissions.length} de {ALL_PERMISSIONS.length} permissões ativadas para a Tag Dev
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={setAllPermissions}
              className="text-xs h-8 font-bold border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
            >
              Marcar Todas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={setReadOnlyPermissions}
              className="text-xs h-8 font-bold border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
            >
              Apenas Leitura
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllPermissions}
              className="text-xs h-8 font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              Limpar Todas
            </Button>
          </div>
        </div>
      </Card>

      {/* MÓDULOS DE PERMISSÕES (IGUAL À PÁGINA DE CARGOS) */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Carregando permissões da Tag Dev...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedPageCards.map(({ category, cards }) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400/90">
                  {category}
                </span>
                <span className="text-[0.65rem] text-muted-foreground">
                  ({cards.length} {cards.length === 1 ? "módulo" : "módulos"})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => {
                  const cardPermKeys = card.permissions.map((p) => p.key);
                  const activeInCard = cardPermKeys.filter((k) => activePermissions.includes(k)).length;
                  const isAllActive = activeInCard === cardPermKeys.length;
                  const Icon = card.icon;

                  return (
                    <Card
                      key={card.id}
                      className={cn(
                        "surface-card transition-all duration-200 border hover:border-rose-500/30",
                        activeInCard > 0 ? "border-border/80" : "opacity-80"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl border shrink-0", card.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <CardTitle className="text-sm font-bold text-foreground">
                                {card.title}
                              </CardTitle>
                              <CardDescription className="text-[0.7rem] line-clamp-1">
                                {card.description}
                              </CardDescription>
                            </div>
                          </div>

                          <Badge
                            variant={isAllActive ? "default" : activeInCard > 0 ? "outline" : "secondary"}
                            className="text-[10px] font-mono shrink-0"
                          >
                            {activeInCard}/{cardPermKeys.length}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3 pt-0">
                        {card.permissions.map((perm) => {
                          const isChecked = activePermissions.includes(perm.key);

                          return (
                            <div
                              key={perm.key}
                              onClick={() => togglePermission(perm.key)}
                              className={cn(
                                "flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                                isChecked
                                  ? "bg-rose-500/5 border-rose-500/30 text-foreground"
                                  : "bg-secondary/20 border-border/40 hover:bg-secondary/40 text-muted-foreground"
                              )}
                            >
                              <Checkbox
                                id={`dev-${perm.key}`}
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(perm.key)}
                                className="mt-0.5 rounded border-rose-500/40 data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                              />

                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <label
                                    htmlFor={`dev-${perm.key}`}
                                    className="text-xs font-bold text-foreground cursor-pointer block truncate"
                                  >
                                    {perm.label}
                                  </label>
                                  {perm.badge && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] font-mono py-0 px-1.5 border-rose-500/30 text-rose-400 shrink-0"
                                    >
                                      {perm.badge}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[0.68rem] text-muted-foreground leading-snug">
                                  {perm.description}
                                </p>
                                {perm.importantNote && (
                                  <p className="text-[0.65rem] text-amber-400 font-medium mt-1">
                                    ⚠️ {perm.importantNote}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
