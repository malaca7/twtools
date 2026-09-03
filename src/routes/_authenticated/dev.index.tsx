import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Code2,
  Terminal,
  ShieldCheck,
  TrendingUp,
  KeyRound,
  LayoutDashboard,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Users,
  Workflow,
  Landmark,
  Trophy,
  Target,
  ScrollText,
  Settings,
  Megaphone,
  Wrench,
  User,
  ExternalLink,
  Activity,
  Database,
  Cpu,
  RefreshCw,
  Sparkles,
  Layers,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Radio,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useCustomRoles } from "@/hooks/useData";
import { DeveloperGuard } from "@/dev/guards/DeveloperGuard";
import { LEVEL_LABEL, type AppLevel } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dev/")({
  component: DevHubPageWrapper,
});

function DevHubPageWrapper() {
  return (
    <DeveloperGuard>
      <DevHubContent />
    </DeveloperGuard>
  );
}

const ALL_SYSTEM_MODULES = [
  {
    category: "Operação GTA RP",
    description: "Módulos de registro diário, lançamentos e movimentação operacional da facção.",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, desc: "Métricas gerais, faturamento e resumos em tempo real", color: "text-sky-400" },
      { title: "Movimentações", url: "/movimentacoes", icon: ArrowLeftRight, desc: "Lançamento de entradas, saídas e transferências de estoque", color: "text-emerald-400" },
      { title: "Vendas", url: "/vendas", icon: ShoppingCart, desc: "Registro de vendas com baixa automática de estoque", color: "text-amber-400" },
      { title: "Fundo de Caixa", url: "/fundo-caixa", icon: Landmark, desc: "Controle financeiro, depósitos, saques e saldo da facção", color: "text-teal-400" },
      { title: "Metas da Facção", url: "/metas", icon: Target, desc: "Acompanhamento de metas individuais e coletivas", color: "text-indigo-400" },
    ],
  },
  {
    category: "Gestão & Membros",
    description: "Administração do inventário, controle de membros e estrutura hierárquica.",
    items: [
      { title: "Controle de Estoque", url: "/estoque", icon: Boxes, desc: "Catálogo de produtos, imagens, saldo por baú e categorias", color: "text-blue-400" },
      { title: "Membros da Facção", url: "/membros", icon: Users, desc: "Lista de membros, aprovação de cadastros e atribuição de cargos", color: "text-cyan-400" },
      { title: "Hierarquia", url: "/hierarquia", icon: Workflow, desc: "Organograma visual da liderança e cargos da facção", color: "text-purple-400" },
      { title: "Rankings", url: "/rankings", icon: Trophy, desc: "Ranking de produtividade, vendas e presença dos membros", color: "text-yellow-400" },
      { title: "Meu Desempenho", url: "/desempenho", icon: User, desc: "Visão pessoal de rendimento, horas online e metas do membro", color: "text-orange-400" },
      { title: "Gerenciamento de Cargos", url: "/cargos", icon: ShieldCheck, desc: "Criação, ordenação e configuração de cargos da facção", color: "text-rose-400" },
    ],
  },
  {
    category: "Administração & Governança",
    description: "Configurações globais, auditoria e permissões de segurança da plataforma.",
    items: [
      { title: "Permissões dos Cargos", url: "/permissoes", icon: Settings, desc: "Matriz de permissões atribuídas a cada cargo da facção", color: "text-pink-400" },
      { title: "Enviar Avisos", url: "/avisos", icon: Megaphone, desc: "Disparo de notificações e comunicados para toda a facção", color: "text-amber-400" },
      { title: "Logs de Auditoria", url: "/logs", icon: ScrollText, desc: "Histórico completo de auditoria e ações realizadas na plataforma", color: "text-slate-400" },
      { title: "Configurações da Plataforma", url: "/configuracoes", icon: Wrench, desc: "Personalização de tema, regras, menus e integrações", color: "text-blue-400" },
      { title: "Meu Perfil", url: "/perfil", icon: User, desc: "Dados cadastrais do jogador, Discord e preferências", color: "text-emerald-400" },
    ],
  },
  {
    category: "Módulo Exclusivo Dev (Tag Desenvolvedor)",
    description: "Recursos avançados de engenharia, diagnóstico, inspeção e controle da tag dev.",
    items: [
      { title: "Gestão de Desempenho Dev", url: "/dev/desempenho", icon: TrendingUp, desc: "Inspeção aprofundada de produtividade, tempo online e auditoria de membros", color: "text-rose-400" },
      { title: "Permissões da Tag Dev", url: "/dev/permissoes", icon: KeyRound, desc: "Matriz granular e gerenciamento de permissões da tag desenvolvedor", color: "text-rose-400" },
      { title: "Configurações do Módulo Dev", url: "/dev/configuracao", icon: Code2, desc: "Flags de depuração, modo manutenção, mock data e diagnóstico", color: "text-rose-400" },
      { title: "Menu Lateral Dev", url: "/dev/menu-lateral", icon: Sliders, desc: "Configuração de ordens, categorias e visibilidade do menu dev", color: "text-rose-400" },
    ],
  },
];

function DevHubContent() {
  const { user, profile, level, refresh } = useAuth();
  const { data: customRoles = [] } = useCustomRoles();
  const [simulatedRole, setSimulatedRole] = useState<string>("real");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const devRaw = sessionStorage.getItem("tw_dev_impersonate");
      if (devRaw) {
        try {
          const parsed = JSON.parse(devRaw);
          setSimulatedRole(parsed.nivel || "real");
        } catch {
          setSimulatedRole("real");
        }
      } else {
        setSimulatedRole("real");
      }
    }
  }, []);

  const handleSimulateRole = (targetRole: string, isDevTag: boolean = false) => {
    setSimulatedRole(targetRole);
    if (targetRole === "real") {
      sessionStorage.removeItem("tw_dev_impersonate");
      toast.success("Visualização restaurada para sua conta de Desenvolvedor real.");
    } else {
      const mockState = {
        user_id: user?.id || "dev-sim",
        nome: profile?.nome || "Dev",
        nickname: profile?.nickname || "Dev Simulator",
        nivel: targetRole,
        status: "ativo",
        discord_avatar_url: profile?.avatar_url || null,
        is_developer: isDevTag,
      };
      sessionStorage.setItem("tw_dev_impersonate", JSON.stringify(mockState));
      const roleObj = customRoles.find((r) => r.id === targetRole);
      const roleName = roleObj?.nome || LEVEL_LABEL[targetRole as AppLevel] || targetRole;
      
      if (isDevTag) {
        toast.info(`Simulando visão com Tag Dev (Acesso Total)`);
      } else {
        toast.info(`Simulando visão e permissões reais do cargo: ${roleName} (Modo Membro)`);
      }
    }
    void refresh();
  };

  const handleClearCaches = () => {
    localStorage.removeItem("tw_menu_config");
    localStorage.removeItem("tw_cached_products");
    localStorage.removeItem("tw_cached_baus");
    toast.success("Caches locais limpos com sucesso!");
    void refresh();
  };

  // Build sorted list of real roles from custom_roles table (excluding desenvolvedor which has dedicated button)
  const availableMemberRoles = customRoles.length > 0
    ? customRoles.filter((r) => r.id !== "desenvolvedor")
    : [
        { id: "01", nome: "01" },
        { id: "02", nome: "02" },
        { id: "gerente", nome: "Gerente" },
        { id: "motoqueiro", nome: "Motoqueiro" },
        { id: "membro", nome: "Membro" },
        { id: "novato", nome: "Novato" },
      ];

  const currentActiveRoleName = simulatedRole === "real"
    ? "Desenvolvedor Real"
    : simulatedRole === "desenvolvedor"
    ? "Tag Dev (Desenvolvedor)"
    : customRoles.find((r) => r.id === simulatedRole)?.nome || LEVEL_LABEL[simulatedRole as AppLevel] || simulatedRole;

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER PRINCIPAL DO PAINEL DEV */}
      <PageHeader
        title="Dev Tools — Painel do Desenvolvedor"
        description="Central unificada com acesso total a todos os menus da plataforma, todas as funções e permissões da tag Dev."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-rose-500/50 bg-rose-500/10 text-rose-400 font-mono font-bold text-xs px-2.5 py-1 flex items-center gap-1.5 shadow-sm"
          >
            <Terminal className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            DEV BYPASS ATIVO
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCaches}
            className="h-8 text-xs border-border/80 rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Limpar Caches
          </Button>
        </div>
      </PageHeader>

      {/* CARD DE STATUS DO DEV E SIMULADOR */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-rose-500/30 bg-rose-500/5 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-rose-400 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-rose-400" />
              Sessão do Desenvolvedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Usuário:</span>
              <span className="font-bold text-foreground">{profile?.nickname || profile?.nome || "Dev"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Visão Ativa:</span>
              <span className="font-mono font-bold text-primary">{currentActiveRoleName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tag Dev:</span>
              <Badge className={cn(
                "text-[10px] font-bold",
                simulatedRole === "real" || simulatedRole === "desenvolvedor"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/40"
              )}>
                {simulatedRole === "real" || simulatedRole === "desenvolvedor" ? "✓ Tag Dev Ativa" : "Desativada (Modo Membro)"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Simulador de Visão de Cargos (Para Testes)
              </CardTitle>
              {simulatedRole !== "real" && (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] font-mono">
                  Modo Simulação Ativo
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Alterne a visualização para testar as permissões e telas exatamente como cada cargo real ou tag da plataforma enxerga:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* LINHA 1: DEV REAL & TAG DEV */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Ferramentas de Desenvolvimento:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant={simulatedRole === "real" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 text-xs font-bold rounded-lg cursor-pointer",
                    simulatedRole === "real" ? "bg-rose-600 text-white shadow-xs" : "border-border/80"
                  )}
                  onClick={() => handleSimulateRole("real")}
                >
                  <Code2 className="h-3 w-3 mr-1" /> Dev Real (Original)
                </Button>

                <Button
                  type="button"
                  variant={simulatedRole === "desenvolvedor" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-7 text-xs font-bold rounded-lg cursor-pointer",
                    simulatedRole === "desenvolvedor"
                      ? "bg-rose-500 text-white shadow-rose-950/20 shadow-xs"
                      : "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                  )}
                  onClick={() => handleSimulateRole("desenvolvedor", true)}
                >
                  <Terminal className="h-3 w-3 mr-1" /> Tag Dev (Acesso Total)
                </Button>
              </div>
            </div>

            {/* LINHA 2: CARGOS REAIS DA PLATAFORMA */}
            <div className="space-y-1 pt-1 border-t border-border/40">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Cargos Reais da Plataforma (Simulação Sem Tag Dev):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableMemberRoles.map((r) => {
                  const isSelected = simulatedRole === r.id;
                  return (
                    <Button
                      key={r.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-7 text-xs font-bold rounded-lg cursor-pointer transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary/40"
                          : "border-border/70 hover:bg-secondary"
                      )}
                      onClick={() => handleSimulateRole(r.id, false)}
                    >
                      {r.nome || LEVEL_LABEL[r.id as AppLevel] || r.id}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GRADE COM TODOS OS MENUS DO SISTEMA E ACESSO COMPLETO */}
      <div className="space-y-6">
        {ALL_SYSTEM_MODULES.map((section) => (
          <div key={section.category} className="space-y-3">
            <div className="border-b border-border/60 pb-2">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                {section.category}
              </h3>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.url}
                    to={item.url}
                    className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/60 hover:bg-secondary/40 transition-all shadow-sm hover:shadow-md cursor-pointer overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={cn("p-2 rounded-xl bg-secondary/80 border border-border/60 group-hover:scale-110 transition-transform", item.color)}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono border-border/60 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary">
                          Acesso Total <ExternalLink className="h-2.5 w-2.5 ml-1" />
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span className="truncate">{item.url}</span>
                      <span className="text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">Abrir →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
